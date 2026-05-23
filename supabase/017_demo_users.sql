-- e-Mumtaz Gombak: akaun demo untuk latihan dan ujian sistem.
-- Run di Supabase SQL Editor.
--
-- Semua akaun demo menggunakan password: 12345678
--
-- Akaun:
-- 1. demo.daerah@emumtaz.local  - Admin Daerah
-- 2. demo.zon.barat@emumtaz.local - Admin Zon Barat
-- 3. demo.zon.tengah@emumtaz.local - Admin Zon Tengah
-- 4. demo.zon.timur@emumtaz.local - Admin Zon Timur
-- 5. demo.admin.sekolah@emumtaz.local - Admin Sekolah BYP7010
-- 6. demo.guru.kelas@emumtaz.local - Guru Kelas BYP7010
-- 7. demo.guru.subjek@emumtaz.local - Guru Subjek BYP7010

create extension if not exists "pgcrypto";

-- Pastikan supabase/014_zon_access.sql sudah pernah dijalankan supaya role ADMIN_ZON tersedia.

delete from public.app_users
where email like 'demo.%@emumtaz.local';

with demo_users as (
  select *
  from (
    values
      ('demo.daerah@emumtaz.local', 'DEMO ADMIN DAERAH', 'ADMIN_DAERAH'::public.user_role, null::text, null::text),
      ('demo.zon.barat@emumtaz.local', 'DEMO ADMIN ZON BARAT', 'ADMIN_ZON'::public.user_role, null::text, 'BARAT'::text),
      ('demo.zon.tengah@emumtaz.local', 'DEMO ADMIN ZON TENGAH', 'ADMIN_ZON'::public.user_role, null::text, 'TENGAH'::text),
      ('demo.zon.timur@emumtaz.local', 'DEMO ADMIN ZON TIMUR', 'ADMIN_ZON'::public.user_role, null::text, 'TIMUR'::text),
      ('demo.admin.sekolah@emumtaz.local', 'DEMO ADMIN SEKOLAH', 'ADMIN_SEKOLAH'::public.user_role, 'BYP7010'::text, null::text),
      ('demo.guru.kelas@emumtaz.local', 'DEMO GURU KELAS', 'GURU_KELAS'::public.user_role, 'BYP7010'::text, null::text),
      ('demo.guru.subjek@emumtaz.local', 'DEMO GURU SUBJEK', 'GURU_SUBJEK'::public.user_role, 'BYP7010'::text, null::text)
  ) as item(email, nama, role, kod_sekolah, zon)
),
auth_upsert as (
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  select
    '00000000-0000-0000-0000-000000000000'::uuid,
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    email,
    crypt('12345678', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nama', nama),
    now(),
    now()
  from demo_users
  on conflict (email) do update
    set
      encrypted_password = excluded.encrypted_password,
      email_confirmed_at = coalesce(auth.users.email_confirmed_at, now()),
      raw_app_meta_data = excluded.raw_app_meta_data,
      raw_user_meta_data = excluded.raw_user_meta_data,
      updated_at = now()
  returning id, email
),
identity_upsert as (
  insert into auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  select
    au.id,
    au.id,
    au.email,
    jsonb_build_object('sub', au.id::text, 'email', au.email, 'email_verified', true),
    'email',
    now(),
    now(),
    now()
  from auth_upsert au
  on conflict (provider_id, provider) do update
    set
      user_id = excluded.user_id,
      identity_data = excluded.identity_data,
      updated_at = now()
  returning user_id
)
insert into public.app_users (
  auth_user_id,
  email,
  nama,
  role,
  kod_sekolah,
  zon,
  status,
  allowed_nav
)
select
  au.id,
  du.email,
  du.nama,
  du.role,
  du.kod_sekolah,
  du.zon,
  'AKTIF',
  null
from demo_users du
join auth.users au on au.email = du.email
on conflict (email, role, kod_sekolah) do update
  set
    auth_user_id = excluded.auth_user_id,
    nama = excluded.nama,
    zon = excluded.zon,
    status = 'AKTIF',
    allowed_nav = null;

select
  email,
  nama,
  role,
  coalesce(kod_sekolah, zon, 'SEMUA') as akses,
  status
from public.app_users
where email like 'demo.%@emumtaz.local'
order by role, email;
