-- Sokong pecahan guru bagi subjek yang sama, contoh Jawi 3 masa + Jawi 3 masa.
-- Jalankan selepas 025_timetable_auto_requirements.sql.

alter table public.teacher_subject_assignments
  add column if not exists assignment_label text;

alter table public.timetable_requirements
  add column if not exists assignment_label text;

alter table public.timetable_entries
  add column if not exists assignment_label text;

drop index if exists public.idx_timetable_requirements_unique_item;

create unique index if not exists idx_timetable_requirements_unique_item
  on public.timetable_requirements (
    class_id,
    kod_subjek,
    coalesce(kod_komponen, ''),
    coalesce(assignment_label, '')
  );
