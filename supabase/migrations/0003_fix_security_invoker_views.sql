-- =========================================================
-- SISTA - Migration 0003
-- Perbaikan: set security_invoker = true pada view yang
-- terdeteksi Supabase Linter sebagai "Security Definer View"
-- =========================================================
-- Tanpa security_invoker, view berjalan dengan hak akses pembuat
-- view (biasanya superuser), sehingga RLS milik user yang login
-- bisa terlewati. Perbaikan ini membuat view mengikuti hak akses
-- dan RLS dari user yang sedang query, sesuai perilaku yang benar.

alter view v_aset_kode_lengkap set (security_invoker = true);
alter view v_dashboard_aset set (security_invoker = true);
alter view v_dashboard_bhp set (security_invoker = true);
