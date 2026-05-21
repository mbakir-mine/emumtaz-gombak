-- e-Mumtaz Gombak repair script
-- Use this if base tables exist but marks / grade_scales / summary views are missing.

create table if not exists marks (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  kod_sekolah text not null references schools(kod_sekolah),
  class_id uuid not null references classes(id),
  kod_subjek text not null references subjects(kod_subjek),
  markah numeric check (markah >= 0 and markah <= 100),
  entered_by uuid references app_users(id),
  updated_at timestamptz not null default now(),
  unique (exam_id, student_id, kod_subjek)
);

create table if not exists grade_scales (
  id uuid primary key default gen_random_uuid(),
  nama_gred text not null,
  markah_min numeric not null,
  markah_max numeric not null,
  label_prestasi text,
  susunan int not null default 999,
  unique (nama_gred)
);

insert into grade_scales (nama_gred, markah_min, markah_max, label_prestasi, susunan)
values
  ('Mumtaz', 90, 100, 'Cemerlang Tertinggi', 1),
  ('Jayyid Jiddan', 75, 89.99, 'Sangat Baik', 2),
  ('Jayyid', 60, 74.99, 'Baik', 3),
  ('Maqbul', 40, 59.99, 'Lulus', 4),
  ('Musa''adah', 0, 39.99, 'Bantuan / Intervensi', 5)
on conflict (nama_gred) do update set
  markah_min = excluded.markah_min,
  markah_max = excluded.markah_max,
  label_prestasi = excluded.label_prestasi,
  susunan = excluded.susunan;

create or replace view v_student_exam_summary as
select
  e.tahun_akademik,
  e.kod_peperiksaan,
  m.kod_sekolah,
  m.class_id,
  m.student_id,
  s.mykid,
  s.nama_murid,
  count(m.markah) filter (where subj.dikira_purata = true and m.markah is not null) as bil_subjek_dikira,
  round(avg(m.markah) filter (where subj.dikira_purata = true and m.markah is not null), 2) as purata,
  sum(m.markah) filter (where subj.dikira_purata = true and m.markah is not null) as jumlah_markah
from marks m
join exams e on e.id = m.exam_id
join students s on s.id = m.student_id
join subjects subj on subj.kod_subjek = m.kod_subjek
group by
  e.tahun_akademik,
  e.kod_peperiksaan,
  m.kod_sekolah,
  m.class_id,
  m.student_id,
  s.mykid,
  s.nama_murid;

create or replace view v_school_exam_summary as
select
  tahun_akademik,
  kod_peperiksaan,
  kod_sekolah,
  count(distinct student_id) as jumlah_murid,
  round(avg(purata), 2) as purata_sekolah,
  count(*) filter (where purata >= 80) as bil_cemerlang,
  count(*) filter (where purata >= 40) as bil_lulus,
  round(count(*) filter (where purata >= 80)::numeric / nullif(count(*), 0) * 100, 2) as peratus_cemerlang,
  round(count(*) filter (where purata >= 40)::numeric / nullif(count(*), 0) * 100, 2) as peratus_lulus
from v_student_exam_summary
group by tahun_akademik, kod_peperiksaan, kod_sekolah;

create or replace view v_subject_exam_summary as
select
  e.tahun_akademik,
  e.kod_peperiksaan,
  m.kod_sekolah,
  m.class_id,
  m.kod_subjek,
  subj.nama_subjek,
  count(m.markah) as bil_markah,
  round(avg(m.markah), 2) as purata_subjek,
  count(*) filter (where m.markah >= 40) as bil_lulus,
  count(*) filter (where m.markah < 40) as bil_gagal
from marks m
join exams e on e.id = m.exam_id
join subjects subj on subj.kod_subjek = m.kod_subjek
where m.markah is not null
group by
  e.tahun_akademik,
  e.kod_peperiksaan,
  m.kod_sekolah,
  m.class_id,
  m.kod_subjek,
  subj.nama_subjek;
