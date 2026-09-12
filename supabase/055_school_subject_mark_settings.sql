-- TETAPAN MARKAH PENUH MENGIKUT SEKOLAH
-- Skop: sekolah + tahun akademik + peperiksaan + tahun murid + subjek.

begin;

update public.app_users
set allowed_nav = array_append(allowed_nav, 'componentMarks')
where role = 'ADMIN_SEKOLAH'
  and allowed_nav is not null
  and not ('componentMarks' = any(allowed_nav));

create table if not exists public.school_subject_mark_settings (
  id uuid primary key default gen_random_uuid(),
  kod_sekolah text not null references public.schools(kod_sekolah) on delete cascade,
  tahun_akademik integer not null check (tahun_akademik between 2000 and 2200),
  kod_peperiksaan text not null,
  tahun smallint not null check (tahun between 1 and 6),
  kod_subjek text not null,
  markah_penuh numeric(7,2) not null check (markah_penuh > 0 and markah_penuh <= 1000),
  status text not null default 'AKTIF' check (status in ('AKTIF', 'TIDAK_AKTIF')),
  created_by uuid default auth.uid(),
  updated_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kod_sekolah, tahun_akademik, kod_peperiksaan, tahun, kod_subjek)
);

create table if not exists public.school_subject_component_mark_settings (
  id uuid primary key default gen_random_uuid(),
  kod_sekolah text not null references public.schools(kod_sekolah) on delete cascade,
  tahun_akademik integer not null check (tahun_akademik between 2000 and 2200),
  kod_peperiksaan text not null,
  tahun smallint not null check (tahun between 1 and 6),
  kod_subjek text not null,
  kod_komponen text not null,
  markah_penuh numeric(7,2) not null check (markah_penuh > 0 and markah_penuh <= 1000),
  status text not null default 'AKTIF' check (status in ('AKTIF', 'TIDAK_AKTIF')),
  created_by uuid default auth.uid(),
  updated_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kod_sekolah, tahun_akademik, kod_peperiksaan, tahun, kod_subjek, kod_komponen)
);

create index if not exists idx_school_subject_mark_scope
  on public.school_subject_mark_settings
  (kod_sekolah, tahun_akademik, kod_peperiksaan, tahun);

create index if not exists idx_school_component_mark_scope
  on public.school_subject_component_mark_settings
  (kod_sekolah, tahun_akademik, kod_peperiksaan, tahun, kod_subjek);

alter table public.school_subject_mark_settings enable row level security;
alter table public.school_subject_component_mark_settings enable row level security;

revoke all on table public.school_subject_mark_settings from anon, authenticated;
revoke all on table public.school_subject_component_mark_settings from anon, authenticated;
grant select, insert, update on table public.school_subject_mark_settings to authenticated;
grant select, insert, update on table public.school_subject_component_mark_settings to authenticated;
grant all on table public.school_subject_mark_settings to service_role;
grant all on table public.school_subject_component_mark_settings to service_role;

-- Semua pengguna aktif boleh membaca tetapan sekolah sendiri supaya skrin kemasukan
-- dan laporan boleh menggunakan had yang betul. Owner/Admin Daerah boleh membaca semua.
drop policy if exists "school_subject_marks_select" on public.school_subject_mark_settings;
create policy "school_subject_marks_select"
on public.school_subject_mark_settings for select to authenticated
using (
  exists (
    select 1 from public.app_users au
    where au.auth_user_id = (select auth.uid()) and au.status = 'AKTIF'
      and (au.role in ('OWNER', 'ADMIN_DAERAH') or au.kod_sekolah = school_subject_mark_settings.kod_sekolah)
  )
);

drop policy if exists "school_component_marks_select" on public.school_subject_component_mark_settings;
create policy "school_component_marks_select"
on public.school_subject_component_mark_settings for select to authenticated
using (
  exists (
    select 1 from public.app_users au
    where au.auth_user_id = (select auth.uid()) and au.status = 'AKTIF'
      and (au.role in ('OWNER', 'ADMIN_DAERAH') or au.kod_sekolah = school_subject_component_mark_settings.kod_sekolah)
  )
);

drop policy if exists "school_subject_marks_insert" on public.school_subject_mark_settings;
create policy "school_subject_marks_insert"
on public.school_subject_mark_settings for insert to authenticated
with check (
  created_by = (select auth.uid()) and updated_by = (select auth.uid()) and exists (
    select 1 from public.app_users au
    where au.auth_user_id = (select auth.uid()) and au.status = 'AKTIF'
      and (au.role in ('OWNER', 'ADMIN_DAERAH') or (au.role = 'ADMIN_SEKOLAH' and au.kod_sekolah = school_subject_mark_settings.kod_sekolah))
  )
);

drop policy if exists "school_subject_marks_update" on public.school_subject_mark_settings;
create policy "school_subject_marks_update"
on public.school_subject_mark_settings for update to authenticated
using (
  exists (
    select 1 from public.app_users au
    where au.auth_user_id = (select auth.uid()) and au.status = 'AKTIF'
      and (au.role in ('OWNER', 'ADMIN_DAERAH') or (au.role = 'ADMIN_SEKOLAH' and au.kod_sekolah = school_subject_mark_settings.kod_sekolah))
  )
)
with check (
  updated_by = (select auth.uid()) and exists (
    select 1 from public.app_users au
    where au.auth_user_id = (select auth.uid()) and au.status = 'AKTIF'
      and (au.role in ('OWNER', 'ADMIN_DAERAH') or (au.role = 'ADMIN_SEKOLAH' and au.kod_sekolah = school_subject_mark_settings.kod_sekolah))
  )
);

drop policy if exists "school_component_marks_insert" on public.school_subject_component_mark_settings;
create policy "school_component_marks_insert"
on public.school_subject_component_mark_settings for insert to authenticated
with check (
  created_by = (select auth.uid()) and updated_by = (select auth.uid()) and exists (
    select 1 from public.app_users au
    where au.auth_user_id = (select auth.uid()) and au.status = 'AKTIF'
      and (au.role in ('OWNER', 'ADMIN_DAERAH') or (au.role = 'ADMIN_SEKOLAH' and au.kod_sekolah = school_subject_component_mark_settings.kod_sekolah))
  )
);

drop policy if exists "school_component_marks_update" on public.school_subject_component_mark_settings;
create policy "school_component_marks_update"
on public.school_subject_component_mark_settings for update to authenticated
using (
  exists (
    select 1 from public.app_users au
    where au.auth_user_id = (select auth.uid()) and au.status = 'AKTIF'
      and (au.role in ('OWNER', 'ADMIN_DAERAH') or (au.role = 'ADMIN_SEKOLAH' and au.kod_sekolah = school_subject_component_mark_settings.kod_sekolah))
  )
)
with check (
  updated_by = (select auth.uid()) and exists (
    select 1 from public.app_users au
    where au.auth_user_id = (select auth.uid()) and au.status = 'AKTIF'
      and (au.role in ('OWNER', 'ADMIN_DAERAH') or (au.role = 'ADMIN_SEKOLAH' and au.kod_sekolah = school_subject_component_mark_settings.kod_sekolah))
  )
);

-- Satu sumber rasmi untuk markah efektif. Jika sekolah belum membuat tetapan,
-- markah penuh asal daripada jadual subjects terus digunakan.
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
  coalesce(ssms.markah_penuh, sb.markah_penuh, 100)::numeric as markah_penuh,
  case
    when m.markah is null then null
    else round((m.markah / nullif(coalesce(ssms.markah_penuh, sb.markah_penuh, 100), 0)) * 100, 2)
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
 and ssms.status = 'AKTIF';

create or replace view public.v_school_student_exam_summary
with (security_invoker = true)
as
select
  tahun_akademik,
  kod_peperiksaan,
  kod_sekolah,
  class_id,
  student_id,
  mykid,
  nama_murid,
  count(*) filter (where dikira_purata and markah_peratus is not null)::integer as bil_subjek_dikira,
  round(avg(markah_peratus) filter (where dikira_purata), 2) as purata,
  round(sum(markah_peratus) filter (where dikira_purata), 2) as jumlah_markah
from public.v_school_mark_percent
group by tahun_akademik, kod_peperiksaan, kod_sekolah, class_id, student_id, mykid, nama_murid;

create or replace view public.v_school_exam_summary_normalized
with (security_invoker = true)
as
select
  tahun_akademik,
  kod_peperiksaan,
  kod_sekolah,
  count(*) filter (where purata is not null)::integer as jumlah_murid,
  round(avg(purata), 2) as purata_sekolah,
  count(*) filter (where purata >= 90)::integer as bil_mumtaz,
  count(*) filter (where purata >= 40)::integer as bil_lulus,
  round(100.0 * count(*) filter (where purata >= 90) / nullif(count(*) filter (where purata is not null), 0), 2) as peratus_mumtaz,
  round(100.0 * count(*) filter (where purata >= 40) / nullif(count(*) filter (where purata is not null), 0), 2) as peratus_lulus
from public.v_school_student_exam_summary
group by tahun_akademik, kod_peperiksaan, kod_sekolah;

create or replace view public.v_school_subject_exam_summary_normalized
with (security_invoker = true)
as
select
  tahun_akademik,
  kod_peperiksaan,
  kod_sekolah,
  class_id,
  kod_subjek,
  max(nama_subjek) as nama_subjek,
  count(markah_peratus)::integer as bil_markah,
  round(avg(markah_peratus), 2) as purata_subjek,
  count(*) filter (where markah_peratus >= 40)::integer as bil_lulus,
  count(*) filter (where markah_peratus < 40)::integer as bil_gagal
from public.v_school_mark_percent
group by tahun_akademik, kod_peperiksaan, kod_sekolah, class_id, kod_subjek;

revoke all on public.v_school_mark_percent from anon;
revoke all on public.v_school_student_exam_summary from anon;
revoke all on public.v_school_exam_summary_normalized from anon;
revoke all on public.v_school_subject_exam_summary_normalized from anon;
grant select on public.v_school_mark_percent to authenticated, service_role;
grant select on public.v_school_student_exam_summary to authenticated, service_role;
grant select on public.v_school_exam_summary_normalized to authenticated, service_role;
grant select on public.v_school_subject_exam_summary_normalized to authenticated, service_role;

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

  select coalesce(setting.markah_penuh, subject.markah_penuh, 100)
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

drop trigger if exists validate_school_subject_mark_trigger on public.marks;
create trigger validate_school_subject_mark_trigger
before insert or update of markah, exam_id, class_id, kod_sekolah, kod_subjek
on public.marks for each row execute function public.validate_school_subject_mark();

create or replace function public.validate_school_component_mark()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  effective_full_mark numeric;
begin
  if new.markah is null then return new; end if;

  select coalesce(school_setting.markah_penuh, exam_setting.markah_penuh, component.markah_penuh)
    into effective_full_mark
  from public.exams exam
  join public.classes cls on cls.id = new.class_id
  left join public.subject_components component
    on component.kod_subjek = new.kod_subjek and component.kod_komponen = new.kod_komponen
  left join public.subject_component_mark_settings exam_setting
    on exam_setting.tahun_akademik = exam.tahun_akademik
   and exam_setting.kod_peperiksaan = exam.kod_peperiksaan
   and exam_setting.tahun = cls.tahun
   and exam_setting.kod_subjek = new.kod_subjek
   and exam_setting.kod_komponen = new.kod_komponen
   and exam_setting.status = 'AKTIF'
  left join public.school_subject_component_mark_settings school_setting
    on school_setting.kod_sekolah = new.kod_sekolah
   and school_setting.tahun_akademik = exam.tahun_akademik
   and school_setting.kod_peperiksaan = exam.kod_peperiksaan
   and school_setting.tahun = cls.tahun
   and school_setting.kod_subjek = new.kod_subjek
   and school_setting.kod_komponen = new.kod_komponen
   and school_setting.status = 'AKTIF'
  where exam.id = new.exam_id;

  if effective_full_mark is null or new.markah < 0 or new.markah > effective_full_mark then
    raise exception 'Markah % melebihi markah penuh komponen %.', new.markah, coalesce(effective_full_mark, 0)
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_school_component_mark_trigger on public.mark_components;
create trigger validate_school_component_mark_trigger
before insert or update of markah, exam_id, class_id, kod_sekolah, kod_subjek, kod_komponen
on public.mark_components for each row execute function public.validate_school_component_mark();

create or replace function public.prevent_invalid_school_full_mark()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.marks mark
    join public.exams exam on exam.id = mark.exam_id
    join public.classes cls on cls.id = mark.class_id
    where mark.kod_sekolah = new.kod_sekolah
      and exam.tahun_akademik = new.tahun_akademik
      and exam.kod_peperiksaan = new.kod_peperiksaan
      and cls.tahun = new.tahun
      and mark.kod_subjek = new.kod_subjek
      and mark.markah > new.markah_penuh
  ) then
    raise exception 'Markah penuh tidak boleh direndahkan kerana terdapat markah murid yang lebih tinggi.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_invalid_school_full_mark_trigger on public.school_subject_mark_settings;
create trigger prevent_invalid_school_full_mark_trigger
before insert or update of markah_penuh on public.school_subject_mark_settings
for each row execute function public.prevent_invalid_school_full_mark();

create or replace function public.prevent_invalid_school_component_full_mark()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.mark_components mark
    join public.exams exam on exam.id = mark.exam_id
    join public.classes cls on cls.id = mark.class_id
    where mark.kod_sekolah = new.kod_sekolah
      and exam.tahun_akademik = new.tahun_akademik
      and exam.kod_peperiksaan = new.kod_peperiksaan
      and cls.tahun = new.tahun
      and mark.kod_subjek = new.kod_subjek
      and mark.kod_komponen = new.kod_komponen
      and mark.markah > new.markah_penuh
  ) then
    raise exception 'Markah penuh komponen tidak boleh direndahkan kerana terdapat markah murid yang lebih tinggi.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_invalid_school_component_full_mark_trigger
  on public.school_subject_component_mark_settings;
create trigger prevent_invalid_school_component_full_mark_trigger
before insert or update of markah_penuh on public.school_subject_component_mark_settings
for each row execute function public.prevent_invalid_school_component_full_mark();

-- Simpan subjek dan komponennya dalam satu transaksi supaya tiada keadaan separuh siap.
create or replace function public.save_school_mark_settings(
  p_kod_sekolah text,
  p_tahun_akademik integer,
  p_kod_peperiksaan text,
  p_tahun smallint,
  p_subjects jsonb,
  p_components jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.app_users au
    where au.auth_user_id = (select auth.uid())
      and au.status = 'AKTIF'
      and (
        au.role in ('OWNER', 'ADMIN_DAERAH')
        or (au.role = 'ADMIN_SEKOLAH' and au.kod_sekolah = p_kod_sekolah)
      )
  ) then
    raise exception 'Anda tidak dibenarkan mengubah tetapan sekolah ini.' using errcode = '42501';
  end if;

  if p_tahun_akademik not between 2000 and 2200 or p_tahun not between 1 and 6 then
    raise exception 'Skop tahun tidak sah.' using errcode = '23514';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(coalesce(p_subjects, '[]'::jsonb))
      as subject_row(kod_subjek text, markah_penuh numeric)
    where subject_row.kod_subjek is null
       or subject_row.markah_penuh <= 0
       or subject_row.markah_penuh > 1000
  ) then
    raise exception 'Terdapat markah penuh subjek yang tidak sah.' using errcode = '23514';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(coalesce(p_components, '[]'::jsonb))
      as component_row(kod_subjek text, kod_komponen text, markah_penuh numeric)
    where component_row.kod_subjek is null
       or component_row.kod_komponen is null
       or component_row.markah_penuh <= 0
       or component_row.markah_penuh > 1000
  ) then
    raise exception 'Terdapat markah penuh komponen yang tidak sah.' using errcode = '23514';
  end if;

  if exists (
    with subject_rows as (
      select * from jsonb_to_recordset(coalesce(p_subjects, '[]'::jsonb))
        as input_row(kod_subjek text, markah_penuh numeric)
    ), component_totals as (
      select input_row.kod_subjek, sum(input_row.markah_penuh) as total
      from jsonb_to_recordset(coalesce(p_components, '[]'::jsonb))
        as input_row(kod_subjek text, kod_komponen text, markah_penuh numeric)
      group by input_row.kod_subjek
    )
    select 1
    from subject_rows subject_row
    left join component_totals component_total using (kod_subjek)
    where exists (
      select 1 from public.subject_components definition
      where definition.kod_subjek = subject_row.kod_subjek and definition.status = 'AKTIF'
    )
      and coalesce(component_total.total, 0) <> subject_row.markah_penuh
  ) then
    raise exception 'Jumlah komponen mesti sama dengan markah penuh subjek.' using errcode = '23514';
  end if;

  insert into public.school_subject_mark_settings (
    kod_sekolah, tahun_akademik, kod_peperiksaan, tahun, kod_subjek,
    markah_penuh, status, updated_by, updated_at
  )
  select
    p_kod_sekolah, p_tahun_akademik, p_kod_peperiksaan, p_tahun,
    input_row.kod_subjek, input_row.markah_penuh, 'AKTIF', (select auth.uid()), now()
  from jsonb_to_recordset(coalesce(p_subjects, '[]'::jsonb))
    as input_row(kod_subjek text, markah_penuh numeric)
  on conflict (kod_sekolah, tahun_akademik, kod_peperiksaan, tahun, kod_subjek)
  do update set
    markah_penuh = excluded.markah_penuh,
    status = 'AKTIF',
    updated_by = (select auth.uid()),
    updated_at = now();

  insert into public.school_subject_component_mark_settings (
    kod_sekolah, tahun_akademik, kod_peperiksaan, tahun, kod_subjek,
    kod_komponen, markah_penuh, status, updated_by, updated_at
  )
  select
    p_kod_sekolah, p_tahun_akademik, p_kod_peperiksaan, p_tahun,
    input_row.kod_subjek, input_row.kod_komponen, input_row.markah_penuh,
    'AKTIF', (select auth.uid()), now()
  from jsonb_to_recordset(coalesce(p_components, '[]'::jsonb))
    as input_row(kod_subjek text, kod_komponen text, markah_penuh numeric)
  on conflict (kod_sekolah, tahun_akademik, kod_peperiksaan, tahun, kod_subjek, kod_komponen)
  do update set
    markah_penuh = excluded.markah_penuh,
    status = 'AKTIF',
    updated_by = (select auth.uid()),
    updated_at = now();
end;
$$;

revoke all on function public.save_school_mark_settings(text, integer, text, smallint, jsonb, jsonb) from public, anon;
grant execute on function public.save_school_mark_settings(text, integer, text, smallint, jsonb, jsonb) to authenticated;

commit;

