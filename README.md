# SISTA — Sistem Informasi Stok dan Aset

Aplikasi manajemen aset tetap (barang modal) dan barang habis pakai untuk OPD.

## Stack
- Next.js 14 (App Router) + Tailwind CSS
- Supabase (PostgreSQL, Auth, RLS)
- Import CSV/JSON, Export Excel & PDF

## Fitur Utama

**Untuk Admin (login):**
- Dashboard ringkasan kondisi aset & stok
- CRUD data aset tetap (import massal CSV/JSON, export Excel/PDF)
- Kartu stok barang habis pakai otomatis
- Riwayat pengambilan barang lengkap dengan nama pemohon & keperluan
- Manajemen peminjaman aset — tandai "Dikembalikan" beserta kondisi terakhir
- Laporan rekap periodik (mingguan/bulanan/triwulanan/semesteran) barang masuk-keluar, exportable
- Kelola pengguna (khusus super_admin)

**Untuk Staf (tanpa login):**
- `/pengambilan` — formulir catat pengambilan ATK/kertas/tinta/dll, otomatis mengurangi stok
- `/peminjaman` — formulir ajukan peminjaman aset (internal maupun eksternal OPD)

Kedua formulir publik ini bisa dibagikan lewat link langsung atau QR code (link tersedia
untuk disalin di halaman Dashboard admin).

## Setup Lokal

1. Install dependencies:
   ```bash
   npm install
   ```

2. Buat project di [supabase.com](https://supabase.com), lalu jalankan migration **secara berurutan**:
   - Buka **SQL Editor** di dashboard Supabase
   - Jalankan `supabase/migrations/0001_init_sista.sql`
   - Lalu jalankan `supabase/migrations/0002_pengambilan_peminjaman.sql`

3. Isi kode akun BMD referensi (minimal beberapa contoh) di tabel `kode_akun_bmd`
   sesuai buku klasifikasi barang milik daerah (Permendagri 19/2016) OPD Bapak/Ibu.

4. Buat user pertama (super_admin):
   - Di Supabase dashboard → Authentication → Add user (isi email & password)
   - Lalu di SQL Editor, jalankan:
     ```sql
     insert into app_users (id, nama_lengkap, username, role, bidang)
     values ('UUID_DARI_AUTH_USERS', 'Nama Admin', 'admin1', 'super_admin', 'Sekretariat');
     ```

5. Salin `.env.example` menjadi `.env.local`, isi dengan URL & anon key project Supabase:
   ```bash
   cp .env.example .env.local
   ```

6. Jalankan development server:
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) — akan redirect ke halaman login.

## Deploy ke Vercel

1. Push project ini ke GitHub
2. Import repository di [vercel.com](https://vercel.com)
3. Tambahkan environment variables yang sama seperti `.env.local` di pengaturan project Vercel
4. Deploy

## Keamanan Form Publik

Formulir `/pengambilan` dan `/peminjaman` tidak memerlukan login, namun **tidak** memberi
akses baca/tulis penuh ke database. Keduanya hanya memanggil fungsi database khusus
(`catat_pengambilan_bhp`, `ajukan_peminjaman_aset`, dsb.) yang divalidasi secara ketat di
sisi server (contoh: stok tidak boleh minus, aset yang sedang dipinjam tidak bisa dipinjam
lagi). Tabel aset & BHP sendiri tetap terkunci RLS dan tidak bisa diakses langsung tanpa login.

## Format Import CSV/JSON

**Aset Tetap** — kolom wajib: `nama_barang`, `nomor_register`. Opsional: `merk_tipe`, `tahun_perolehan`, `nilai_perolehan`, `kondisi`, `penanggung_jawab`.

**Barang Habis Pakai** — kolom wajib: `kode_barang`, `nama_barang`, `satuan`. Opsional: `kategori`, `stok_minimum`.

## Struktur Folder

```
app/
  login/                 halaman login
  pengambilan/            form publik pengambilan barang (tanpa login)
  peminjaman/             form publik peminjaman aset (tanpa login)
  (dashboard)/
    dashboard/            ringkasan & statistik + link form publik
    aset/                 data aset tetap
    aset/peminjaman/      manajemen peminjaman aset
    bhp/                  data barang habis pakai
    bhp/riwayat/          riwayat pengambilan & mutasi barang
    laporan/              rekap periodik barang masuk/keluar
    pengguna/             kelola pengguna (super_admin)
components/               komponen UI (Sidebar, tabel, form, dsb)
lib/supabase/              client & server Supabase
supabase/migrations/       skema database (0001 & 0002)
```

## Tahap Lanjutan yang Bisa Dikembangkan
- Form tambah/edit aset & BHP satu-per-satu langsung dari UI (saat ini input massal via import + form publik untuk mutasi)
- Halaman detail aset + form tambah riwayat pemeliharaan/servis dari UI
- Halaman tambah pengguna baru langsung dari aplikasi (via Supabase Admin API/Edge Function)
- Cetak KIB (Kartu Inventaris Barang) & KIR sesuai format resmi Permendagri
- Notifikasi otomatis (email/WA) saat stok menipis atau peminjaman terlambat
- QR code per formulir publik untuk ditempel di ruang ATK/gudang aset

