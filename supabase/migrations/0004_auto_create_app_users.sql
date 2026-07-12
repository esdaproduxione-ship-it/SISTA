-- =========================================================
-- SISTA - Migration 0004
-- Trigger: otomatis membuat baris di app_users setiap kali
-- ada user baru dibuat di Authentication (auth.users).
--
-- Catatan:
-- - Trigger ini hanya berlaku untuk user yang dibuat SETELAH
--   migration ini dijalankan. Untuk user yang sudah terlanjur
--   dibuat sebelumnya, gunakan insert manual (lihat file
--   0005_seed_app_users_manual.sql).
-- - Default role adalah 'viewer' dan is_active = false, supaya
--   super_admin harus mengaktifkan & menetapkan role secara
--   sadar lewat halaman admin, bukan otomatis punya akses.
-- - Username default diambil dari bagian sebelum '@' pada email,
--   lalu bisa diubah manual lewat Table Editor / halaman admin.
-- =========================================================

create or replace function fn_handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  -- username default: bagian sebelum '@' di email, fallback ke potongan id
  v_username := split_part(new.email, '@', 1);

  -- pastikan unik: kalau sudah dipakai, tambahkan 4 karakter dari id
  if exists (select 1 from app_users where username = v_username) then
    v_username := v_username || '_' || substr(new.id::text, 1, 4);
  end if;

  insert into app_users (id, nama_lengkap, username, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama_lengkap', v_username),
    v_username,
    'viewer',
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_handle_new_auth_user on auth.users;

create trigger trg_handle_new_auth_user
after insert on auth.users
for each row execute function fn_handle_new_auth_user();
