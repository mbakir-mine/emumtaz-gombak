-- e-Mumtaz Gombak terminology migration
-- KPM uses "Tahun" for pupil level. "tahun_akademik" remains the academic year.
-- Run this after 007_subject_rules_by_grade.sql if your database still has darjah columns.

alter table classes
  rename column darjah to tahun;

alter table subject_grade_rules
  rename column darjah to tahun;

alter table classes
  drop constraint if exists classes_kod_sekolah_tahun_akademik_darjah_nama_kelas_key;

alter table classes
  add constraint classes_kod_sekolah_tahun_akademik_tahun_nama_kelas_key
  unique (kod_sekolah, tahun_akademik, tahun, nama_kelas);

alter table subject_grade_rules
  drop constraint if exists subject_grade_rules_darjah_kod_subjek_key;

alter table subject_grade_rules
  add constraint subject_grade_rules_tahun_kod_subjek_key
  unique (tahun, kod_subjek);

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

