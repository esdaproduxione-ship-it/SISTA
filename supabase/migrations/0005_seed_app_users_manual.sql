-- =========================================================
-- SISTA - Seed manual app_users
-- =========================================================
-- Jalankan ini di SQL Editor Supabase (BUKAN via migration
-- otomatis, karena UUID & data harus disesuaikan manual per user).
--
-- Langkah ambil UUID:
-- 1. Buka Authentication > Users di Supabase Dashboard
-- 2. Klik user yang sudah dibuat
-- 3. Copy nilai "UID" (contoh: a1b2c3d4-e5f6-...)
-- 4. Tempel ke placeholder '<UUID_DARI_AUTH_USERS>' di bawah
--
-- Ulangi blok insert untuk setiap user yang perlu didaftarkan.
-- =========================================================

insert into app_users (id, nama_lengkap, username, role, bidang, is_active)
values (
  'a9012688-4a89-4a62-9cd8-591b7d176610',   -- ganti dengan UID dari Authentication > Users
  'Super Admin',    -- ganti nama lengkap
  'supersista',           -- ganti username yang dipakai untuk login
  'super_admin',               -- pilih: 'super_admin' | 'admin' | 'viewer'
  'Bagian Perekonomian dan Sumber Daya Alam', -- opsional, boleh null
  true                         -- true = aktif, boleh langsung login
)
on conflict (id) do update set
  nama_lengkap = excluded.nama_lengkap,
  username = excluded.username,
  role = excluded.role,
  bidang = excluded.bidang,
  is_active = excluded.is_active;

-- Cek hasil:
-- select id, nama_lengkap, username, role, is_active from app_users;