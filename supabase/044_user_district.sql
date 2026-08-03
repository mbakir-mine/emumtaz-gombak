-- Tambah skop daerah pada profil pengguna.
-- Semua pengguna sedia ada berada di bawah PAID Gombak pada peringkat awal.

alter table public.app_users
  add column if not exists daerah text;

update public.app_users
set daerah = 'GOMBAK'
where daerah is null or btrim(daerah) = '';

alter table public.app_users
  alter column daerah set default 'GOMBAK',
  alter column daerah set not null;

alter table public.app_users
  drop constraint if exists app_users_daerah_check;

alter table public.app_users
  add constraint app_users_daerah_check
  check (daerah in (
    'GOMBAK',
    'HULU LANGAT',
    'HULU SELANGOR',
    'KLANG',
    'KUALA LANGAT',
    'KUALA SELANGOR',
    'PETALING',
    'SABAK BERNAM',
    'SEPANG'
  ));

create index if not exists app_users_daerah_idx
  on public.app_users (daerah);

comment on column public.app_users.daerah is
  'Daerah PAID yang mengawal skop Dashboard dan data pengguna.';
