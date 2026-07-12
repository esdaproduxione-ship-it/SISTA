-- =========================================================
-- SISTA - Sistem Informasi Stok dan Aset
-- Migration 0001: Skema awal database
-- =========================================================

-- ---------------------------------------------------------
-- 1. EXTENSIONS
-- ---------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- 2. ENUM TYPES
-- ---------------------------------------------------------
create type user_role as enum ('super_admin', 'admin', 'viewer');
create type kondisi_aset as enum ('Baik', 'Rusak Ringan', 'Rusak Berat');
create type status_aset as enum ('Aktif', 'Dalam Perbaikan', 'Mutasi', 'Dihapus');
create type jenis_mutasi_bhp as enum ('Masuk', 'Keluar');

-- ---------------------------------------------------------
-- 3. APP USERS (profil tambahan di atas auth.users)
-- ---------------------------------------------------------
create table app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  nama_lengkap text not null,
  username text unique not null,
  role user_role not null default 'viewer',
  bidang text,               -- unit/bidang di OPD
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table app_users is 'Profil pengguna aplikasi, terhubung ke auth.users Supabase';

-- ---------------------------------------------------------
-- 4. KODE AKUN BMD (referensi klasifikasi Permendagri 19/2016)
--    Struktur kode: Bidang.Kelompok.Sub Kelompok.Sub-sub Kelompok.Jenis Barang
--    contoh: 02.06.02.05.01  -> Peralatan dan Mesin > ... > Komputer
-- ---------------------------------------------------------
create table kode_akun_bmd (
  id uuid primary key default gen_random_uuid(),
  kode text unique not null,          -- ex: '02.06.02.05.01'
  nama_klasifikasi text not null,     -- ex: 'Personal Komputer'
  kategori_bidang text not null,      -- ex: 'Peralatan dan Mesin'
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 5. RUANGAN / LOKASI
-- ---------------------------------------------------------
create table ruangan (
  id uuid primary key default gen_random_uuid(),
  nama_ruangan text not null,
  bidang text,
  gedung text,
  lantai text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 6. ASET TETAP (Barang Modal)
-- ---------------------------------------------------------
create table aset (
  id uuid primary key default gen_random_uuid(),

  -- identitas & klasifikasi
  kode_akun_id uuid references kode_akun_bmd(id),
  nomor_register text not null,        -- nomor urut register per kode akun
  kode_barang text generated always as (nomor_register) stored, -- fallback, lihat view v_aset_kode_lengkap
  nama_barang text not null,
  merk_tipe text,
  nomor_seri text,

  -- perolehan
  tahun_perolehan int,
  tanggal_perolehan date,
  sumber_dana text,
  nilai_perolehan numeric(18,2) default 0,

  -- kondisi & status
  kondisi kondisi_aset not null default 'Baik',
  status status_aset not null default 'Aktif',

  -- penempatan & penanggung jawab
  ruangan_id uuid references ruangan(id),
  penanggung_jawab text,               -- nama pengguna barang
  nip_penanggung_jawab text,

  -- meta
  keterangan text,
  foto_url text,
  created_by uuid references app_users(id),
  updated_by uuid references app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (kode_akun_id, nomor_register)
);

create index idx_aset_kondisi on aset(kondisi);
create index idx_aset_status on aset(status);
create index idx_aset_ruangan on aset(ruangan_id);

-- View kode barang lengkap: kode akun + nomor register, format Permendagri
create view v_aset_kode_lengkap as
select
  a.id,
  k.kode || '.' || a.nomor_register as kode_barang_lengkap,
  a.nama_barang,
  k.nama_klasifikasi,
  a.kondisi,
  a.status
from aset a
join kode_akun_bmd k on k.id = a.kode_akun_id;

alter view v_aset_kode_lengkap set (security_invoker = true);

-- ---------------------------------------------------------
-- 7. RIWAYAT PEMELIHARAAN / SERVIS ASET
-- ---------------------------------------------------------
create table riwayat_pemeliharaan (
  id uuid primary key default gen_random_uuid(),
  aset_id uuid not null references aset(id) on delete cascade,
  tanggal_pemeliharaan date not null,
  jenis_pemeliharaan text not null,   -- ex: 'Servis Rutin', 'Perbaikan', 'Kalibrasi'
  biaya numeric(18,2) default 0,
  vendor text,
  keterangan text,
  created_by uuid references app_users(id),
  created_at timestamptz not null default now()
);

create index idx_pemeliharaan_aset on riwayat_pemeliharaan(aset_id);

-- ---------------------------------------------------------
-- 8. BARANG HABIS PAKAI (Master Persediaan)
-- ---------------------------------------------------------
create table bhp (
  id uuid primary key default gen_random_uuid(),
  kode_barang text unique not null,
  nama_barang text not null,
  kategori text,
  satuan text not null,              -- ex: 'pcs', 'rim', 'box'
  stok_minimum numeric(18,2) not null default 0,
  stok_saat_ini numeric(18,2) not null default 0,  -- kolom cache, disinkron via trigger
  keterangan text,
  created_by uuid references app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 9. MUTASI STOK BHP (Kartu Stok)
-- ---------------------------------------------------------
create table mutasi_bhp (
  id uuid primary key default gen_random_uuid(),
  bhp_id uuid not null references bhp(id) on delete cascade,
  tanggal date not null default current_date,
  jenis jenis_mutasi_bhp not null,
  jumlah numeric(18,2) not null check (jumlah > 0),
  sumber_tujuan text,                -- ex: 'Pengadaan 2026', 'Bidang Umum'
  keterangan text,
  created_by uuid references app_users(id),
  created_at timestamptz not null default now()
);

create index idx_mutasi_bhp_bhp on mutasi_bhp(bhp_id);
create index idx_mutasi_bhp_tanggal on mutasi_bhp(tanggal);

-- Trigger: update stok_saat_ini otomatis setiap ada mutasi
create or replace function fn_update_stok_bhp()
returns trigger
language plpgsql
security invoker
as $$
begin
  if TG_OP = 'INSERT' then
    update bhp
    set stok_saat_ini = stok_saat_ini + (case when NEW.jenis = 'Masuk' then NEW.jumlah else -NEW.jumlah end),
        updated_at = now()
    where id = NEW.bhp_id;
  elsif TG_OP = 'DELETE' then
    update bhp
    set stok_saat_ini = stok_saat_ini - (case when OLD.jenis = 'Masuk' then OLD.jumlah else -OLD.jumlah end),
        updated_at = now()
    where id = OLD.bhp_id;
  end if;
  return null;
end;
$$;

create trigger trg_update_stok_bhp
after insert or delete on mutasi_bhp
for each row execute function fn_update_stok_bhp();

-- ---------------------------------------------------------
-- 10. RPC: login via username (pola yang sudah pernah dipakai)
-- ---------------------------------------------------------
create or replace function get_email_by_username(p_username text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  select u.email into v_email
  from auth.users u
  join app_users au on au.id = u.id
  where au.username = p_username
    and au.is_active = true;

  return v_email;
end;
$$;

-- ---------------------------------------------------------
-- 11. ROW LEVEL SECURITY
-- ---------------------------------------------------------
alter table app_users enable row level security;
alter table kode_akun_bmd enable row level security;
alter table ruangan enable row level security;
alter table aset enable row level security;
alter table riwayat_pemeliharaan enable row level security;
alter table bhp enable row level security;
alter table mutasi_bhp enable row level security;

-- Helper: cek role user yang sedang login
create or replace function fn_current_role()
returns user_role
language sql
security invoker
stable
as $$
  select role from app_users where id = auth.uid();
$$;

-- app_users: semua user login boleh lihat, hanya super_admin boleh ubah
create policy "app_users_select" on app_users for select using (auth.uid() is not null);
create policy "app_users_insert" on app_users for insert with check (fn_current_role() = 'super_admin');
create policy "app_users_update" on app_users for update using (fn_current_role() = 'super_admin');
create policy "app_users_delete" on app_users for delete using (fn_current_role() = 'super_admin');

-- Data referensi & transaksi: semua login boleh SELECT,
-- admin & super_admin boleh INSERT/UPDATE/DELETE, viewer read-only
create policy "kode_akun_select" on kode_akun_bmd for select using (auth.uid() is not null);
create policy "kode_akun_write" on kode_akun_bmd for all
  using (fn_current_role() in ('admin','super_admin'))
  with check (fn_current_role() in ('admin','super_admin'));

create policy "ruangan_select" on ruangan for select using (auth.uid() is not null);
create policy "ruangan_write" on ruangan for all
  using (fn_current_role() in ('admin','super_admin'))
  with check (fn_current_role() in ('admin','super_admin'));

create policy "aset_select" on aset for select using (auth.uid() is not null);
create policy "aset_write" on aset for all
  using (fn_current_role() in ('admin','super_admin'))
  with check (fn_current_role() in ('admin','super_admin'));

create policy "pemeliharaan_select" on riwayat_pemeliharaan for select using (auth.uid() is not null);
create policy "pemeliharaan_write" on riwayat_pemeliharaan for all
  using (fn_current_role() in ('admin','super_admin'))
  with check (fn_current_role() in ('admin','super_admin'));

create policy "bhp_select" on bhp for select using (auth.uid() is not null);
create policy "bhp_write" on bhp for all
  using (fn_current_role() in ('admin','super_admin'))
  with check (fn_current_role() in ('admin','super_admin'));

create policy "mutasi_bhp_select" on mutasi_bhp for select using (auth.uid() is not null);
create policy "mutasi_bhp_write" on mutasi_bhp for all
  using (fn_current_role() in ('admin','super_admin'))
  with check (fn_current_role() in ('admin','super_admin'));

-- ---------------------------------------------------------
-- 12. VIEW RINGKASAN UNTUK DASHBOARD
-- ---------------------------------------------------------
create view v_dashboard_aset as
select
  count(*) as total_aset,
  count(*) filter (where kondisi = 'Baik') as jumlah_baik,
  count(*) filter (where kondisi = 'Rusak Ringan') as jumlah_rusak_ringan,
  count(*) filter (where kondisi = 'Rusak Berat') as jumlah_rusak_berat,
  coalesce(sum(nilai_perolehan), 0) as total_nilai_aset
from aset
where status != 'Dihapus';

alter view v_dashboard_aset set (security_invoker = true);

create view v_dashboard_bhp as
select
  count(*) as total_jenis_barang,
  count(*) filter (where stok_saat_ini <= stok_minimum) as jumlah_stok_menipis
from bhp;

alter view v_dashboard_bhp set (security_invoker = true);
