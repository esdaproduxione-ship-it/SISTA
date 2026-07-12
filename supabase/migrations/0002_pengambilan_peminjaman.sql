-- =========================================================
-- SISTA - Migration 0002
-- Fitur: Pengambilan Barang Persediaan (publik) & Peminjaman Aset (publik)
-- =========================================================

-- ---------------------------------------------------------
-- 1. Kolom tambahan pada mutasi_bhp untuk mencatat pemohon
--    (diisi hanya untuk transaksi 'Keluar' via form publik)
-- ---------------------------------------------------------
alter table mutasi_bhp
  add column if not exists nama_pemohon text,
  add column if not exists bidang_pemohon text,
  add column if not exists keperluan text,
  add column if not exists sumber_input text not null default 'admin'; -- 'admin' | 'form_publik'

-- ---------------------------------------------------------
-- 2. Kolom penanda aset sedang dipinjam
-- ---------------------------------------------------------
alter table aset
  add column if not exists sedang_dipinjam boolean not null default false;

-- ---------------------------------------------------------
-- 3. TABEL PEMINJAMAN ASET
-- ---------------------------------------------------------
create table peminjaman_aset (
  id uuid primary key default gen_random_uuid(),
  aset_id uuid not null references aset(id),

  jenis_peminjam text not null check (jenis_peminjam in ('Internal OPD', 'Eksternal OPD')),
  nama_peminjam text not null,
  unit_asal text not null,          -- bidang (internal) atau nama instansi (eksternal)
  no_hp text,
  keperluan text not null,

  tanggal_pinjam date not null default current_date,
  rencana_tanggal_kembali date not null,
  tanggal_kembali_aktual date,

  kondisi_saat_pinjam kondisi_aset,
  kondisi_saat_kembali kondisi_aset,

  status text not null default 'Dipinjam' check (status in ('Dipinjam', 'Dikembalikan', 'Terlambat')),
  keterangan text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_peminjaman_aset_status on peminjaman_aset(status);
create index idx_peminjaman_aset_aset on peminjaman_aset(aset_id);

alter table peminjaman_aset enable row level security;

create policy "peminjaman_select" on peminjaman_aset for select using (auth.uid() is not null);
create policy "peminjaman_write" on peminjaman_aset for all
  using (fn_current_role() in ('admin','super_admin'))
  with check (fn_current_role() in ('admin','super_admin'));

-- ---------------------------------------------------------
-- 4. RPC PUBLIK (SECURITY DEFINER) — tanpa login
--    Dipanggil dari form publik, akses dibatasi lewat validasi
--    di dalam function, bukan lewat RLS langsung.
-- ---------------------------------------------------------

-- 4a. Daftar barang persediaan untuk ditampilkan di form pengambilan
create or replace function list_bhp_untuk_pengambilan()
returns table (
  id uuid,
  kode_barang text,
  nama_barang text,
  satuan text,
  stok_saat_ini numeric
)
language sql
security definer
set search_path = public
as $$
  select id, kode_barang, nama_barang, satuan, stok_saat_ini
  from bhp
  order by nama_barang;
$$;

-- 4b. Catat pengambilan barang (otomatis mengurangi stok via trigger mutasi_bhp)
create or replace function catat_pengambilan_bhp(
  p_bhp_id uuid,
  p_jumlah numeric,
  p_nama_pemohon text,
  p_bidang_pemohon text,
  p_keperluan text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stok numeric;
  v_nama text;
begin
  if p_jumlah is null or p_jumlah <= 0 then
    raise exception 'Jumlah pengambilan harus lebih dari 0';
  end if;
  if p_nama_pemohon is null or trim(p_nama_pemohon) = '' then
    raise exception 'Nama pemohon wajib diisi';
  end if;

  select stok_saat_ini, nama_barang into v_stok, v_nama from bhp where id = p_bhp_id;

  if v_stok is null then
    raise exception 'Barang tidak ditemukan';
  end if;
  if v_stok < p_jumlah then
    raise exception 'Stok % tidak mencukupi (sisa %)', v_nama, v_stok;
  end if;

  insert into mutasi_bhp (bhp_id, tanggal, jenis, jumlah, sumber_tujuan, keterangan, nama_pemohon, bidang_pemohon, keperluan, sumber_input)
  values (p_bhp_id, current_date, 'Keluar', p_jumlah, p_bidang_pemohon, p_keperluan, p_nama_pemohon, p_bidang_pemohon, p_keperluan, 'form_publik');

  return jsonb_build_object('success', true, 'nama_barang', v_nama, 'jumlah', p_jumlah);
end;
$$;

-- 4c. Daftar aset yang tersedia untuk dipinjam
create or replace function list_aset_untuk_peminjaman()
returns table (
  id uuid,
  kode_barang text,
  nama_barang text,
  kondisi kondisi_aset
)
language sql
security definer
set search_path = public
as $$
  select a.id,
         coalesce(k.kode || '.' || a.nomor_register, a.nomor_register) as kode_barang,
         a.nama_barang,
         a.kondisi
  from aset a
  left join kode_akun_bmd k on k.id = a.kode_akun_id
  where a.status = 'Aktif' and a.sedang_dipinjam = false
  order by a.nama_barang;
$$;

-- 4d. Ajukan/catat peminjaman aset
create or replace function ajukan_peminjaman_aset(
  p_aset_id uuid,
  p_jenis_peminjam text,
  p_nama_peminjam text,
  p_unit_asal text,
  p_no_hp text,
  p_keperluan text,
  p_rencana_kembali date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kondisi kondisi_aset;
  v_sedang_dipinjam boolean;
  v_nama text;
begin
  if p_nama_peminjam is null or trim(p_nama_peminjam) = '' then
    raise exception 'Nama peminjam wajib diisi';
  end if;
  if p_rencana_kembali is null or p_rencana_kembali < current_date then
    raise exception 'Rencana tanggal kembali tidak valid';
  end if;

  select kondisi, sedang_dipinjam, nama_barang into v_kondisi, v_sedang_dipinjam, v_nama
  from aset where id = p_aset_id;

  if v_kondisi is null then
    raise exception 'Aset tidak ditemukan';
  end if;
  if v_sedang_dipinjam then
    raise exception 'Aset % sedang dipinjam pihak lain', v_nama;
  end if;

  insert into peminjaman_aset (
    aset_id, jenis_peminjam, nama_peminjam, unit_asal, no_hp,
    keperluan, rencana_tanggal_kembali, kondisi_saat_pinjam
  ) values (
    p_aset_id, p_jenis_peminjam, p_nama_peminjam, p_unit_asal, p_no_hp,
    p_keperluan, p_rencana_kembali, v_kondisi
  );

  update aset set sedang_dipinjam = true, status = 'Mutasi' where id = p_aset_id;

  return jsonb_build_object('success', true, 'nama_barang', v_nama);
end;
$$;

-- 4e. Admin: tandai aset sudah dikembalikan
create or replace function tandai_aset_dikembalikan(
  p_peminjaman_id uuid,
  p_kondisi_saat_kembali kondisi_aset,
  p_keterangan text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_aset_id uuid;
begin
  if fn_current_role() not in ('admin','super_admin') then
    raise exception 'Tidak memiliki akses';
  end if;

  select aset_id into v_aset_id from peminjaman_aset where id = p_peminjaman_id;
  if v_aset_id is null then
    raise exception 'Data peminjaman tidak ditemukan';
  end if;

  update peminjaman_aset
  set status = 'Dikembalikan',
      tanggal_kembali_aktual = current_date,
      kondisi_saat_kembali = p_kondisi_saat_kembali,
      keterangan = p_keterangan,
      updated_at = now()
  where id = p_peminjaman_id;

  update aset
  set sedang_dipinjam = false,
      status = 'Aktif',
      kondisi = coalesce(p_kondisi_saat_kembali, kondisi)
  where id = v_aset_id;

  return jsonb_build_object('success', true);
end;
$$;

-- ---------------------------------------------------------
-- 5. Grant akses eksekusi RPC ke anon (form publik tanpa login)
--    dan authenticated (dipakai juga oleh admin yang sudah login)
-- ---------------------------------------------------------
grant execute on function list_bhp_untuk_pengambilan() to anon, authenticated;
grant execute on function catat_pengambilan_bhp(uuid, numeric, text, text, text) to anon, authenticated;
grant execute on function list_aset_untuk_peminjaman() to anon, authenticated;
grant execute on function ajukan_peminjaman_aset(uuid, text, text, text, text, text, date) to anon, authenticated;
grant execute on function tandai_aset_dikembalikan(uuid, kondisi_aset, text) to authenticated;

-- ---------------------------------------------------------
-- 6. View rekap mutasi BHP per transaksi (dipakai halaman Laporan)
-- ---------------------------------------------------------
create view v_mutasi_bhp_detail as
select
  m.id,
  m.tanggal,
  m.jenis,
  m.jumlah,
  m.sumber_tujuan,
  m.nama_pemohon,
  m.bidang_pemohon,
  m.keperluan,
  m.sumber_input,
  b.kode_barang,
  b.nama_barang,
  b.satuan,
  b.kategori
from mutasi_bhp m
join bhp b on b.id = m.bhp_id;

alter view v_mutasi_bhp_detail set (security_invoker = true);

-- ---------------------------------------------------------
-- 7. Auto-update status 'Terlambat' untuk peminjaman yang lewat rencana kembali
--    (dipanggil dari query laporan; tidak perlu cron, cukup view)
-- ---------------------------------------------------------
create view v_peminjaman_aset_detail as
select
  p.id,
  p.jenis_peminjam,
  p.nama_peminjam,
  p.unit_asal,
  p.no_hp,
  p.keperluan,
  p.tanggal_pinjam,
  p.rencana_tanggal_kembali,
  p.tanggal_kembali_aktual,
  p.kondisi_saat_pinjam,
  p.kondisi_saat_kembali,
  case
    when p.status = 'Dipinjam' and p.rencana_tanggal_kembali < current_date then 'Terlambat'
    else p.status
  end as status,
  p.keterangan,
  a.nama_barang,
  coalesce(k.kode || '.' || a.nomor_register, a.nomor_register) as kode_barang
from peminjaman_aset p
join aset a on a.id = p.aset_id
left join kode_akun_bmd k on k.id = a.kode_akun_id;

alter view v_peminjaman_aset_detail set (security_invoker = true);
