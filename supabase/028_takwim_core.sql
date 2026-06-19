-- Modul Takwim sebagai tunjang kalendar akademik.
-- Jalankan selepas 023_school_module_access.sql dan 024_optional_school_modules_core.sql.

alter table public.school_module_access
  drop constraint if exists school_module_access_module_key_check;

alter table public.school_module_access
  add constraint school_module_access_module_key_check check (
    module_key in ('TAKWIM', 'KEHADIRAN_HARIAN', 'AMAL_KHAIR', 'JADUAL_WAKTU', 'RPH_AI', 'AKSES_IBU_BAPA', 'PELAPORAN_PBD', 'UPKK_JAKIM')
  );

create table if not exists public.takwim_events (
  id uuid primary key default gen_random_uuid(),
  tahun_akademik int not null,
  kod_sekolah text references public.schools(kod_sekolah) on delete cascade,
  scope text not null default 'SEKOLAH',
  kategori text not null,
  tajuk text not null,
  tarikh_mula date not null,
  tarikh_tamat date not null,
  keterangan text,
  warna text,
  status text not null default 'AKTIF',
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint takwim_events_scope_check check (scope in ('DAERAH', 'SEKOLAH')),
  constraint takwim_events_kategori_check check (
    kategori in ('HARI_PERSEKOLAHAN', 'CUTI', 'PEPERIKSAAN', 'PROGRAM', 'AKTIVITI', 'MESYUARAT', 'LAIN')
  ),
  constraint takwim_events_date_check check (tarikh_tamat >= tarikh_mula)
);

create index if not exists idx_takwim_events_school_year_date
  on public.takwim_events (kod_sekolah, tahun_akademik, tarikh_mula, tarikh_tamat);

create index if not exists idx_takwim_events_scope_year
  on public.takwim_events (scope, tahun_akademik);

create index if not exists idx_takwim_events_kategori_status
  on public.takwim_events (kategori, status);

create or replace function public.set_optional_module_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_takwim_events_updated_at on public.takwim_events;
create trigger trg_takwim_events_updated_at
before update on public.takwim_events
for each row execute function public.set_optional_module_updated_at();
