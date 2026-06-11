-- Tetapan automasi jadual waktu.
-- Jalankan selepas 024_optional_school_modules_core.sql.

create table if not exists public.timetable_requirements (
  id uuid primary key default gen_random_uuid(),
  kod_sekolah text not null references public.schools(kod_sekolah) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  kod_subjek text not null references public.subjects(kod_subjek),
  teacher_id uuid references public.app_users(id) on delete set null,
  bil_slot_seminggu int not null default 1 check (bil_slot_seminggu >= 0 and bil_slot_seminggu <= 40),
  status text not null default 'AKTIF',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, kod_subjek)
);

create index if not exists idx_timetable_requirements_school
  on public.timetable_requirements (kod_sekolah, class_id);

drop trigger if exists trg_timetable_requirements_updated_at on public.timetable_requirements;
create trigger trg_timetable_requirements_updated_at
before update on public.timetable_requirements
for each row execute function public.set_optional_module_updated_at();
