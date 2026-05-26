-- Student yearly enrollment and promotion support.
-- Run this in Supabase SQL Editor before using the Naik Tahun Murid module.

create extension if not exists "pgcrypto";

create table if not exists student_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  tahun_akademik int not null,
  kod_sekolah text not null references schools(kod_sekolah),
  class_id uuid references classes(id),
  status text not null default 'AKTIF',
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, tahun_akademik)
);

create index if not exists idx_student_enrollments_year on student_enrollments(tahun_akademik);
create index if not exists idx_student_enrollments_school_year on student_enrollments(kod_sekolah, tahun_akademik);
create index if not exists idx_student_enrollments_class on student_enrollments(class_id);
create index if not exists idx_student_enrollments_student on student_enrollments(student_id);

insert into student_enrollments (
  student_id,
  tahun_akademik,
  kod_sekolah,
  class_id,
  status,
  catatan
)
select
  s.id,
  c.tahun_akademik,
  s.kod_sekolah,
  s.class_id,
  s.status,
  'Rekod semasa sebelum modul Naik Tahun Murid'
from students s
join classes c on c.id = s.class_id
where s.class_id is not null
on conflict (student_id, tahun_akademik) do nothing;

create or replace view v_student_enrollment_detail as
select
  se.id,
  se.student_id,
  se.tahun_akademik,
  se.kod_sekolah,
  se.class_id,
  se.status,
  se.catatan,
  st.mykid,
  st.nama_murid,
  st.jantina,
  c.tahun,
  c.nama_kelas,
  sc.nama_sekolah,
  sc.kategori,
  sc.zon
from student_enrollments se
join students st on st.id = se.student_id
left join classes c on c.id = se.class_id
left join schools sc on sc.kod_sekolah = se.kod_sekolah;

update app_users
set allowed_nav = array_append(allowed_nav, 'studentPromotion')
where role in ('OWNER', 'ADMIN_DAERAH', 'ADMIN_ZON', 'ADMIN_SEKOLAH')
  and allowed_nav is not null
  and not ('studentPromotion' = any(allowed_nav));
