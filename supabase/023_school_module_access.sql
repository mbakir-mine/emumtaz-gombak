-- Modul pilihan sekolah
-- Run in Supabase SQL Editor before using Tetapan > Akses Modul Sekolah.

create table if not exists public.school_module_access (
  id uuid primary key default gen_random_uuid(),
  kod_sekolah text not null references public.schools(kod_sekolah) on delete cascade,
  module_key text not null,
  enabled boolean not null default false,
  enabled_at timestamptz,
  enabled_by uuid references public.app_users(id),
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_module_access_module_key_check check (
    module_key in ('TAKWIM', 'KEHADIRAN_HARIAN', 'AMAL_KHAIR', 'JADUAL_WAKTU', 'RPH_AI', 'AKSES_IBU_BAPA')
  ),
  unique (kod_sekolah, module_key)
);

create index if not exists idx_school_module_access_school
  on public.school_module_access (kod_sekolah);

create index if not exists idx_school_module_access_module_enabled
  on public.school_module_access (module_key, enabled);

create or replace function public.set_school_module_access_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_school_module_access_updated_at on public.school_module_access;

create trigger trg_school_module_access_updated_at
before update on public.school_module_access
for each row
execute function public.set_school_module_access_updated_at();
