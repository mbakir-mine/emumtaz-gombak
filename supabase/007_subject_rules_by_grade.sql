-- e-Mumtaz Gombak subject rules by tahun murid
-- Run this in Supabase SQL Editor.

create table if not exists subject_grade_rules (
  id uuid primary key default gen_random_uuid(),
  tahun int not null check (tahun between 1 and 6),
  kod_subjek text not null references subjects(kod_subjek) on delete cascade,
  dikira_purata boolean not null default true,
  wajib_isi boolean not null default true,
  susunan int not null default 999,
  unique (tahun, kod_subjek)
);

alter table subject_grade_rules
  add column if not exists tahun int;

alter table subject_grade_rules
  add column if not exists dikira_purata boolean not null default true;

alter table subject_grade_rules
  add column if not exists wajib_isi boolean not null default true;

alter table subject_grade_rules
  add column if not exists susunan int not null default 999;

alter table classes
  add column if not exists tahun int;

insert into subjects (kod_subjek, nama_subjek, markah_penuh, dikira_purata, susunan)
values
  ('AKHLAK', 'Akhlak', 100, true, 1),
  ('SIRAH', 'Sirah', 100, true, 2),
  ('BAHASA_ARAB', 'Bahasa Arab', 100, true, 3),
  ('JAWI', 'Jawi', 100, true, 4),
  ('IMLAK_KHAT', 'Imlak dan Khat', 100, true, 5),
  ('TAUHID', 'Tauhid', 100, true, 6),
  ('FEKAH', 'Fekah', 100, true, 7),
  ('TAJWID', 'Tajwid', 100, true, 8),
  ('AS01', 'Akhlak & Sirah', 100, true, 9),
  ('BA02', 'Bahasa Arab', 100, true, 10),
  ('JIK03', 'Jawi, Imlak & Khat', 100, true, 11),
  ('TF04', 'Tauhid & Fekah', 100, true, 12),
  ('TJ05', 'Tajwid', 100, true, 13),
  ('TILAWAH', 'Tilawah', 100, false, 14),
  ('HAFAZAN', 'Hafazan', 100, false, 15)
on conflict (kod_subjek) do update set
  nama_subjek = excluded.nama_subjek,
  markah_penuh = excluded.markah_penuh,
  dikira_purata = excluded.dikira_purata,
  susunan = excluded.susunan;

insert into subject_grade_rules (tahun, kod_subjek, dikira_purata, wajib_isi, susunan)
values
  (1, 'AKHLAK', true, true, 1),
  (1, 'BAHASA_ARAB', true, true, 2),
  (1, 'JAWI', true, true, 3),
  (1, 'TAUHID', true, true, 4),
  (1, 'FEKAH', true, true, 5),
  (1, 'TILAWAH', false, true, 6),
  (1, 'HAFAZAN', false, true, 7),
  (2, 'AKHLAK', true, true, 1),
  (2, 'BAHASA_ARAB', true, true, 2),
  (2, 'JAWI', true, true, 3),
  (2, 'TAUHID', true, true, 4),
  (2, 'FEKAH', true, true, 5),
  (2, 'TILAWAH', false, true, 6),
  (2, 'HAFAZAN', false, true, 7),
  (3, 'AKHLAK', true, true, 1),
  (3, 'SIRAH', true, true, 2),
  (3, 'BAHASA_ARAB', true, true, 3),
  (3, 'JAWI', true, true, 4),
  (3, 'IMLAK_KHAT', true, true, 5),
  (3, 'TAUHID', true, true, 6),
  (3, 'FEKAH', true, true, 7),
  (3, 'TAJWID', true, true, 8),
  (3, 'TILAWAH', false, true, 9),
  (3, 'HAFAZAN', false, true, 10),
  (4, 'AS01', true, true, 1),
  (4, 'BA02', true, true, 2),
  (4, 'JIK03', true, true, 3),
  (4, 'TF04', true, true, 4),
  (4, 'TJ05', true, true, 5),
  (4, 'TILAWAH', false, true, 6),
  (4, 'HAFAZAN', false, true, 7),
  (5, 'AS01', true, true, 1),
  (5, 'BA02', true, true, 2),
  (5, 'JIK03', true, true, 3),
  (5, 'TF04', true, true, 4),
  (5, 'TJ05', true, true, 5),
  (5, 'TILAWAH', false, true, 6),
  (5, 'HAFAZAN', false, true, 7),
  (6, 'AS01', true, true, 1),
  (6, 'BA02', true, true, 2),
  (6, 'JIK03', true, true, 3),
  (6, 'TF04', true, true, 4),
  (6, 'TJ05', true, true, 5),
  (6, 'TILAWAH', false, true, 6),
  (6, 'HAFAZAN', false, true, 7)
on conflict (tahun, kod_subjek) do update set
  dikira_purata = excluded.dikira_purata,
  wajib_isi = excluded.wajib_isi,
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
  count(m.markah) filter (where coalesce(sgr.dikira_purata, subj.dikira_purata) = true and m.markah is not null) as bil_subjek_dikira,
  round(avg(m.markah) filter (where coalesce(sgr.dikira_purata, subj.dikira_purata) = true and m.markah is not null), 2) as purata,
  sum(m.markah) filter (where coalesce(sgr.dikira_purata, subj.dikira_purata) = true and m.markah is not null) as jumlah_markah
from marks m
join exams e on e.id = m.exam_id
join students s on s.id = m.student_id
join subjects subj on subj.kod_subjek = m.kod_subjek
join classes c on c.id = m.class_id
left join subject_grade_rules sgr
  on sgr.tahun = c.tahun
 and sgr.kod_subjek = m.kod_subjek
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
  count(*) filter (where purata >= 90) as bil_mumtaz,
  count(*) filter (where purata >= 40) as bil_lulus,
  round(count(*) filter (where purata >= 90)::numeric / nullif(count(*), 0) * 100, 2) as peratus_mumtaz,
  round(count(*) filter (where purata >= 40)::numeric / nullif(count(*), 0) * 100, 2) as peratus_lulus
from v_student_exam_summary
group by tahun_akademik, kod_peperiksaan, kod_sekolah;
