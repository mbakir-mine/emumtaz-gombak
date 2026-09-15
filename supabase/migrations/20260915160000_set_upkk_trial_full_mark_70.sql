-- Percubaan UPKK: semua enam kertas bertulis menggunakan markah mentah /70.
-- Peratus rasmi dikira sebagai (markah diperoleh / 70) * 100.

begin;

-- Rekod lama dimasukkan semasa borang masih menggunakan /100. Simpan nilai
-- asal supaya penukaran boleh diaudit/dipulihkan, kemudian tukar kepada /70.
alter table if exists public.upkk_trial_paper_marks
  add column if not exists markah_asal_skala_100 smallint;

-- SQL Editor menggunakan peranan postgres tanpa auth.uid(). Kekalkan audit lama
-- bagi migrasi pentadbir, tetapi masih rekod pengguna semasa untuk kemas kini app.
create or replace function public.set_upkk_trial_mark_audit()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_by := coalesce(auth.uid(), old.updated_by, new.updated_by, old.entered_by, new.entered_by);
  new.updated_at := now();
  return new;
end;
$$;

update public.upkk_trial_paper_marks
set
  markah_asal_skala_100 = markah,
  markah = round(markah * 70.0 / 100.0)::smallint
where markah_asal_skala_100 is null;

comment on column public.upkk_trial_paper_marks.markah_asal_skala_100 is
  'Sandaran markah sebelum migrasi skala Percubaan UPKK daripada /100 kepada /70.';

-- Hadkan jadual khusus UPKK kepada markah mentah 0 hingga 70.
alter table if exists public.upkk_trial_paper_marks
  drop constraint if exists upkk_trial_mark_check;

alter table if exists public.upkk_trial_paper_marks
  add constraint upkk_trial_mark_check
  check (markah between 0 and 70) not valid;

do $$
begin
  if to_regclass('public.upkk_trial_paper_marks') is not null
     and not exists (
       select 1
       from public.upkk_trial_paper_marks
       where markah not between 0 and 70
     ) then
    alter table public.upkk_trial_paper_marks
      validate constraint upkk_trial_mark_check;
  end if;
end;
$$;

-- Jadual marks menyimpan markah mentah. Untuk UPKK Tahun 5, had berkesan
-- sentiasa 70 walaupun markah penuh asal subjek atau tetapan sekolah ialah 100.
create or replace function public.validate_school_subject_mark()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  effective_full_mark numeric;
begin
  if new.markah is null then return new; end if;

  select case
      when regexp_replace(upper(exam.kod_peperiksaan), '[^A-Z0-9]', '', 'g') in ('UPKK1', 'UPKK2')
       and cls.tahun = 5
       and new.kod_subjek in ('TAUHID', 'SIRAH', 'AKHLAK', 'JIK03', 'BA02', 'FEKAH')
        then 70
      else coalesce(setting.markah_penuh, subject.markah_penuh, 100)
    end
    into effective_full_mark
  from public.exams exam
  join public.classes cls on cls.id = new.class_id
  left join public.subjects subject on subject.kod_subjek = new.kod_subjek
  left join public.school_subject_mark_settings setting
    on setting.kod_sekolah = new.kod_sekolah
   and setting.tahun_akademik = exam.tahun_akademik
   and setting.kod_peperiksaan = exam.kod_peperiksaan
   and setting.tahun = cls.tahun
   and setting.kod_subjek = new.kod_subjek
   and setting.status = 'AKTIF'
  where exam.id = new.exam_id;

  if effective_full_mark is null then effective_full_mark := 100; end if;
  if new.markah < 0 or new.markah > effective_full_mark then
    raise exception 'Markah % mesti antara 0 dan % untuk subjek %.', new.markah, effective_full_mark, new.kod_subjek
      using errcode = '23514';
  end if;
  return new;
end;
$$;

-- Semua laporan menggunakan view ini. Markah UPKK ditukar kepada peratus /70;
-- peperiksaan lain terus menggunakan tetapan markah penuh sekolah sedia ada.
create or replace view public.v_school_mark_percent
with (security_invoker = true)
as
select
  m.id,
  m.exam_id,
  m.student_id,
  m.kod_sekolah,
  m.class_id,
  m.kod_subjek,
  e.tahun_akademik,
  e.kod_peperiksaan,
  c.tahun,
  c.nama_kelas,
  s.mykid,
  s.nama_murid,
  s.jantina,
  sb.nama_subjek,
  sb.dikira_purata,
  sb.susunan as susunan_subjek,
  e.nama_peperiksaan,
  m.markah as markah_asal,
  effective.markah_penuh,
  case
    when m.markah is null then null
    else round((m.markah / nullif(effective.markah_penuh, 0)) * 100, 2)
  end as markah_peratus
from public.marks m
join public.exams e on e.id = m.exam_id
join public.classes c on c.id = m.class_id
join public.students s on s.id = m.student_id
join public.subjects sb on sb.kod_subjek = m.kod_subjek
left join public.school_subject_mark_settings ssms
  on ssms.kod_sekolah = m.kod_sekolah
 and ssms.tahun_akademik = e.tahun_akademik
 and ssms.kod_peperiksaan = e.kod_peperiksaan
 and ssms.tahun = c.tahun
 and ssms.kod_subjek = m.kod_subjek
 and ssms.status = 'AKTIF'
cross join lateral (
  select case
    when regexp_replace(upper(e.kod_peperiksaan), '[^A-Z0-9]', '', 'g') in ('UPKK1', 'UPKK2')
     and c.tahun = 5
     and m.kod_subjek in ('TAUHID', 'SIRAH', 'AKHLAK', 'JIK03', 'BA02', 'FEKAH')
      then 70::numeric
    else coalesce(ssms.markah_penuh, sb.markah_penuh, 100)::numeric
  end as markah_penuh
) effective;

revoke all on public.v_school_mark_percent from anon;
grant select on public.v_school_mark_percent to authenticated, service_role;

commit;

-- Semakan: legacy_rows_over_70 mesti 0 dan constraint mesti telah disahkan.
select
  count(*) filter (where markah > 70) as legacy_rows_over_70,
  count(*) filter (where markah between 0 and 70) as valid_rows
from public.upkk_trial_paper_marks;

select
  constraint_name,
  is_deferrable
from information_schema.table_constraints
where table_schema = 'public'
  and table_name = 'upkk_trial_paper_marks'
  and constraint_name = 'upkk_trial_mark_check';
