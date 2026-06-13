-- Komponen markah untuk subjek gabungan Tahun 4, 5 dan 6.
-- Jalankan selepas 007_subject_rules_by_grade.sql.

create table if not exists public.subject_components (
  id uuid primary key default gen_random_uuid(),
  kod_subjek text not null references public.subjects(kod_subjek) on delete cascade,
  kod_komponen text not null,
  nama_komponen text not null,
  markah_penuh numeric not null check (markah_penuh > 0 and markah_penuh <= 100),
  susunan int not null default 999,
  status text not null default 'AKTIF',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kod_subjek, kod_komponen)
);

create table if not exists public.mark_components (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  kod_sekolah text not null references public.schools(kod_sekolah),
  class_id uuid not null references public.classes(id),
  kod_subjek text not null references public.subjects(kod_subjek),
  kod_komponen text not null,
  markah numeric,
  entered_by uuid references public.app_users(id),
  updated_at timestamptz not null default now(),
  check (markah is null or markah >= 0),
  unique (exam_id, student_id, kod_subjek, kod_komponen),
  foreign key (kod_subjek, kod_komponen)
    references public.subject_components(kod_subjek, kod_komponen)
    on delete cascade
);

create table if not exists public.teacher_subject_component_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  kod_subjek text not null references public.subjects(kod_subjek) on delete cascade,
  kod_komponen text not null,
  created_at timestamptz not null default now(),
  unique (user_id, class_id, kod_subjek, kod_komponen),
  foreign key (kod_subjek, kod_komponen)
    references public.subject_components(kod_subjek, kod_komponen)
    on delete cascade
);

insert into public.subject_components (kod_subjek, kod_komponen, nama_komponen, markah_penuh, susunan)
values
  ('TF04', 'TAUHID', 'Tauhid', 50, 1),
  ('TF04', 'FEKAH', 'Fekah', 50, 2),
  ('AS01', 'AKHLAK', 'Akhlak', 50, 1),
  ('AS01', 'SIRAH', 'Sirah', 50, 2),
  ('JIK03', 'JAWI', 'Jawi', 60, 1),
  ('JIK03', 'IMLAK', 'Imlak', 10, 2),
  ('JIK03', 'KHAT', 'Khat', 30, 3)
on conflict (kod_subjek, kod_komponen) do update set
  nama_komponen = excluded.nama_komponen,
  markah_penuh = excluded.markah_penuh,
  susunan = excluded.susunan,
  status = 'AKTIF',
  updated_at = now();

create index if not exists idx_subject_components_subject
  on public.subject_components (kod_subjek, susunan);

create index if not exists idx_mark_components_selection
  on public.mark_components (exam_id, class_id, kod_subjek);

create index if not exists idx_teacher_subject_component_assignments_class
  on public.teacher_subject_component_assignments (class_id, kod_subjek);

create or replace function public.set_optional_module_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_subject_components_updated_at on public.subject_components;
create trigger trg_subject_components_updated_at
before update on public.subject_components
for each row execute function public.set_optional_module_updated_at();
