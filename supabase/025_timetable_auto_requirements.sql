-- Tetapan automasi jadual waktu.
-- Jalankan selepas 024_optional_school_modules_core.sql.

create table if not exists public.timetable_requirements (
  id uuid primary key default gen_random_uuid(),
  kod_sekolah text not null references public.schools(kod_sekolah) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  kod_subjek text not null references public.subjects(kod_subjek),
  kod_komponen text,
  nama_paparan text,
  teacher_id uuid references public.app_users(id) on delete set null,
  bil_slot_seminggu int not null default 1 check (bil_slot_seminggu >= 0 and bil_slot_seminggu <= 40),
  boleh_gabung boolean not null default false,
  status text not null default 'AKTIF',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.timetable_requirements
  add column if not exists kod_komponen text;

alter table public.timetable_requirements
  add column if not exists nama_paparan text;

alter table public.timetable_requirements
  add column if not exists boleh_gabung boolean not null default false;

alter table public.timetable_requirements
  drop constraint if exists timetable_requirements_class_id_kod_subjek_key;

create index if not exists idx_timetable_requirements_school
  on public.timetable_requirements (kod_sekolah, class_id);

create unique index if not exists idx_timetable_requirements_unique_item
  on public.timetable_requirements (class_id, kod_subjek, coalesce(kod_komponen, ''));

alter table public.timetable_entries
  add column if not exists kod_komponen text;

alter table public.timetable_entries
  add column if not exists nama_paparan text;

drop trigger if exists trg_timetable_requirements_updated_at on public.timetable_requirements;
create trigger trg_timetable_requirements_updated_at
before update on public.timetable_requirements
for each row execute function public.set_optional_module_updated_at();
