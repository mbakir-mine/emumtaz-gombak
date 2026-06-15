-- Tetapan pecahan markah komponen mengikut tahun akademik, peperiksaan dan tahun murid.
-- Jalankan fail ini di Supabase SQL Editor sebelum menggunakan halaman Komponen Markah.

create table if not exists public.subject_component_mark_settings (
  id uuid primary key default gen_random_uuid(),
  tahun_akademik int not null,
  kod_peperiksaan text not null,
  tahun int not null check (tahun between 1 and 6),
  kod_subjek text not null references public.subjects(kod_subjek) on delete cascade,
  kod_komponen text not null,
  markah_penuh numeric(6,2) not null check (markah_penuh >= 0),
  status text not null default 'AKTIF',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tahun_akademik, kod_peperiksaan, tahun, kod_subjek, kod_komponen),
  foreign key (kod_subjek, kod_komponen)
    references public.subject_components(kod_subjek, kod_komponen)
    on delete cascade
);

create index if not exists idx_subject_component_mark_settings_context
  on public.subject_component_mark_settings (tahun_akademik, kod_peperiksaan, tahun, kod_subjek);

insert into public.subject_component_mark_settings
  (tahun_akademik, kod_peperiksaan, tahun, kod_subjek, kod_komponen, markah_penuh)
select
  exam.tahun_akademik,
  exam.kod_peperiksaan,
  grade.tahun,
  component.kod_subjek,
  component.kod_komponen,
  component.markah_penuh
from public.exams exam
cross join (values (3), (4), (5), (6)) as grade(tahun)
join public.subject_components component on component.status = 'AKTIF'
join public.subject_grade_rules rule
  on rule.tahun = grade.tahun
 and rule.kod_subjek = component.kod_subjek
on conflict (tahun_akademik, kod_peperiksaan, tahun, kod_subjek, kod_komponen)
do nothing;
