-- e-Mumtaz Gombak base schema
-- Run in Supabase SQL Editor.
-- This migration is designed to create missing tables safely.

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum (
      'OWNER',
      'ADMIN_DAERAH',
      'ADMIN_SEKOLAH',
      'GURU_KELAS',
      'GURU_SUBJEK'
    );
  end if;
end $$;

create table if not exists schools (
  id uuid primary key default gen_random_uuid(),
  kod_sekolah text not null unique,
  nama_sekolah text not null,
  kategori text not null default 'KAFAI',
  daerah text not null default 'GOMBAK',
  status text not null default 'AKTIF',
  created_at timestamptz not null default now()
);

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text not null,
  nama text not null,
  role user_role not null,
  kod_sekolah text references schools(kod_sekolah),
  status text not null default 'AKTIF',
  created_at timestamptz not null default now(),
  unique (email, role, kod_sekolah)
);

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  kod_sekolah text not null references schools(kod_sekolah),
  tahun_akademik int not null,
  tahun int not null check (tahun between 1 and 6),
  nama_kelas text not null,
  status text not null default 'AKTIF',
  created_at timestamptz not null default now(),
  unique (kod_sekolah, tahun_akademik, tahun, nama_kelas)
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  mykid text not null unique,
  nama_murid text not null,
  jantina text,
  kod_sekolah text not null references schools(kod_sekolah),
  class_id uuid references classes(id),
  status text not null default 'AKTIF',
  created_at timestamptz not null default now()
);

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  kod_subjek text not null unique,
  nama_subjek text not null,
  markah_penuh numeric not null default 100,
  dikira_purata boolean not null default true,
  susunan int not null default 999,
  status text not null default 'AKTIF'
);

create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  kod_peperiksaan text not null,
  nama_peperiksaan text not null,
  tahun_akademik int not null,
  status text not null default 'DIBUKA',
  tarikh_mula date,
  tarikh_tamat date,
  unique (kod_peperiksaan, tahun_akademik)
);

create table if not exists teacher_class_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, class_id)
);

create table if not exists teacher_subject_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  kod_subjek text not null references subjects(kod_subjek),
  created_at timestamptz not null default now(),
  unique (user_id, class_id, kod_subjek)
);

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

insert into subjects (kod_subjek, nama_subjek, markah_penuh, dikira_purata, susunan)
values
  ('TAUHID', 'Tauhid', 100, true, 1),
  ('FEQAH', 'Feqah', 100, true, 2),
  ('SIRAH', 'Sirah', 100, true, 3),
  ('AKHLAK', 'Akhlak', 100, true, 4),
  ('BAHASA_ARAB', 'Bahasa Arab', 100, true, 5),
  ('JAWI', 'Jawi', 100, true, 6),
  ('TAJWID', 'Tajwid', 100, true, 7),
  ('AL_QURAN', 'Al-Quran', 100, false, 8),
  ('HAFAZAN', 'Hafazan', 100, false, 9)
on conflict (kod_subjek) do update set
  nama_subjek = excluded.nama_subjek,
  markah_penuh = excluded.markah_penuh,
  dikira_purata = excluded.dikira_purata,
  susunan = excluded.susunan;

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
