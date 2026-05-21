-- e-Mumtaz Gombak full reset
-- WARNING: This deletes old e-Mumtaz-related database objects.
-- Use only when important data has already been backed up elsewhere.
--
-- Recommended order in Supabase SQL Editor:
-- 1. Run this file.
-- 2. Run 001_emumtaz_schema.sql.
-- 3. Run 002_seed_minimal.sql.

drop view if exists analisis_sekolah cascade;
drop view if exists v_subject_exam_summary cascade;
drop view if exists v_school_exam_summary cascade;
drop view if exists v_student_exam_summary cascade;

drop table if exists teacher_subject_assignments cascade;
drop table if exists teacher_class_assignments cascade;
drop table if exists guru_subjek cascade;
drop table if exists guru_kelas cascade;
drop table if exists marks cascade;
drop table if exists markah cascade;
drop table if exists grade_scales cascade;
drop table if exists exams cascade;
drop table if exists peperiksaan cascade;
drop table if exists subjects cascade;
drop table if exists subjek cascade;
drop table if exists students cascade;
drop table if exists murid cascade;
drop table if exists classes cascade;
drop table if exists kelas cascade;
drop table if exists app_users cascade;
drop table if exists user_access cascade;
drop table if exists user_subjects cascade;
drop table if exists users cascade;
drop table if exists schools cascade;
drop table if exists sekolah cascade;

drop type if exists user_role cascade;
