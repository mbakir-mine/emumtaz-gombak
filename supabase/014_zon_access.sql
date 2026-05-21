-- e-Mumtaz Gombak zone access support
-- Run this before deploying code that uses ADMIN_ZON.

alter type public.user_role add value if not exists 'ADMIN_ZON';

alter table public.schools
  add column if not exists zon text;

alter table public.app_users
  add column if not exists zon text;

alter table public.schools
  drop constraint if exists schools_zon_check;

alter table public.schools
  add constraint schools_zon_check
  check (zon is null or zon in ('BARAT', 'TIMUR', 'TENGAH'));

alter table public.app_users
  drop constraint if exists app_users_zon_check;

alter table public.app_users
  add constraint app_users_zon_check
  check (zon is null or zon in ('BARAT', 'TIMUR', 'TENGAH'));

create index if not exists schools_zon_idx
  on public.schools (zon);

create index if not exists app_users_zon_idx
  on public.app_users (zon);

-- Contoh kemaskini sekolah selepas pembahagian zon dimuktamadkan:
-- update public.schools set zon = 'BARAT' where kod_sekolah in ('BYP7010');
-- update public.schools set zon = 'TIMUR' where kod_sekolah in (...);
-- update public.schools set zon = 'TENGAH' where kod_sekolah in (...);

select 'Zon access columns are ready' as status;
