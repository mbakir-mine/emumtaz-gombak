-- Performance preparation for larger Gombak datasets.
-- Safe to run more than once in Supabase SQL Editor.

create index if not exists idx_schools_zon on schools (zon);
create index if not exists idx_schools_kategori on schools (kategori);
create index if not exists idx_schools_status on schools (status);

create index if not exists idx_classes_school_year on classes (kod_sekolah, tahun_akademik, tahun);
create index if not exists idx_classes_tahun on classes (tahun);
create index if not exists idx_classes_status on classes (status);

create index if not exists idx_students_school_status on students (kod_sekolah, status);
create index if not exists idx_students_class_status on students (class_id, status);
create index if not exists idx_students_gender on students (jantina);
create index if not exists idx_students_name on students (nama_murid);

create index if not exists idx_marks_exam_class_subject on marks (exam_id, class_id, kod_subjek);
create index if not exists idx_marks_exam_school on marks (exam_id, kod_sekolah);
create index if not exists idx_marks_student_exam on marks (student_id, exam_id);
create index if not exists idx_marks_class_subject on marks (class_id, kod_subjek);
create index if not exists idx_marks_updated_at on marks (updated_at);

create index if not exists idx_app_users_role_school on app_users (role, kod_sekolah);
create index if not exists idx_app_users_zone on app_users (zon);
create index if not exists idx_teacher_class_user on teacher_class_assignments (user_id);
create index if not exists idx_teacher_class_class on teacher_class_assignments (class_id);
create index if not exists idx_teacher_subject_user on teacher_subject_assignments (user_id);
create index if not exists idx_teacher_subject_class_subject on teacher_subject_assignments (class_id, kod_subjek);

create or replace view v_student_school_summary as
select
  sc.kod_sekolah,
  sc.nama_sekolah,
  sc.kategori,
  sc.zon,
  count(st.id) filter (where st.status = 'AKTIF') as jumlah_murid,
  count(st.id) filter (where st.status = 'AKTIF' and st.jantina = 'L') as murid_lelaki,
  count(st.id) filter (where st.status = 'AKTIF' and st.jantina = 'P') as murid_perempuan
from schools sc
left join students st on st.kod_sekolah = sc.kod_sekolah
group by sc.kod_sekolah, sc.nama_sekolah, sc.kategori, sc.zon;
