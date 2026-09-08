-- PERCUBAAN UPKK BERTULIS (PEMBINAAN SEMULA)
-- Jalankan keseluruhan fail ini. Skrip atomik dan selamat diulang.

begin;

alter table public.school_module_access
  drop constraint if exists school_module_access_module_key_check;

alter table public.school_module_access
  add constraint school_module_access_module_key_check check (
    module_key in (
      'TAKWIM', 'KEHADIRAN_HARIAN', 'AMAL_KHAIR', 'JADUAL_WAKTU',
      'RPH_AI', 'AKSES_IBU_BAPA', 'PELAPORAN_PBD', 'PENILAIAN_UPKK',
      'KHALIFAH_MUDA', 'PERCUBAAN_PSRA', 'PERCUBAAN_UPKK'
    )
  );

create table if not exists public.upkk_trial_grade_settings (
  kod_sekolah text primary key
    references public.schools (kod_sekolah) on delete cascade,
  grade_a_min smallint not null default 85,
  grade_b_min smallint not null default 65,
  grade_c_min smallint not null default 45,
  updated_by uuid default auth.uid(),
  updated_at timestamptz not null default now(),
  constraint upkk_trial_grade_ranges_check check (
    grade_a_min between 1 and 100
    and grade_b_min between 1 and 99
    and grade_c_min between 1 and 98
    and grade_a_min > grade_b_min
    and grade_b_min > grade_c_min
  )
);

create table if not exists public.upkk_trial_paper_marks (
  id uuid primary key default gen_random_uuid(),
  kod_sekolah text not null
    references public.schools (kod_sekolah) on delete cascade,
  tahun_akademik integer not null,
  class_id uuid not null
    references public.classes (id) on delete cascade,
  student_id uuid not null
    references public.students (id) on delete cascade,
  paper_code text not null,
  markah smallint not null,
  entered_by uuid not null default auth.uid(),
  updated_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint upkk_trial_paper_code_check check (
    paper_code in ('UPKK02', 'UPKK03', 'UPKK04', 'UPKK05', 'UPKK06', 'UPKK07')
  ),
  constraint upkk_trial_mark_check check (markah between 0 and 100),
  constraint upkk_trial_student_paper_unique
    unique (tahun_akademik, student_id, paper_code)
);

create index if not exists idx_upkk_trial_marks_school_year
  on public.upkk_trial_paper_marks (kod_sekolah, tahun_akademik);
create index if not exists idx_upkk_trial_marks_class
  on public.upkk_trial_paper_marks (class_id);
create index if not exists idx_upkk_trial_marks_student
  on public.upkk_trial_paper_marks (student_id);

alter table public.upkk_trial_grade_settings enable row level security;
alter table public.upkk_trial_paper_marks enable row level security;

revoke all on table public.upkk_trial_grade_settings from anon, authenticated;
revoke all on table public.upkk_trial_paper_marks from anon, authenticated;
grant select, insert, update on table public.upkk_trial_grade_settings to authenticated;
grant select, insert, update on table public.upkk_trial_paper_marks to authenticated;
grant all on table public.upkk_trial_grade_settings to service_role;
grant all on table public.upkk_trial_paper_marks to service_role;

create or replace function public.can_access_upkk_trial_school(target_school_code text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.app_users as current_user_profile
    where current_user_profile.status = 'AKTIF'
      and (
        current_user_profile.auth_user_id = (select auth.uid())
        or lower(current_user_profile.email) = lower(
          coalesce((select auth.jwt() ->> 'email'), '')
        )
      )
      and (
        current_user_profile.role = 'OWNER'
        or (
          current_user_profile.kod_sekolah = target_school_code
          and exists (
            select 1
            from public.school_module_access as module_access
            where module_access.kod_sekolah = target_school_code
              and module_access.module_key = 'PERCUBAAN_UPKK'
              and module_access.enabled = true
          )
        )
        or (
          current_user_profile.role = 'ADMIN_DAERAH'
          and current_user_profile.daerah = (
            select target_school.daerah
            from public.schools as target_school
            where target_school.kod_sekolah = target_school_code
          )
          and exists (
            select 1
            from public.school_module_access as module_access
            where module_access.kod_sekolah = target_school_code
              and module_access.module_key = 'PERCUBAAN_UPKK'
              and module_access.enabled = true
          )
        )
      )
  );
$$;

revoke all on function public.can_access_upkk_trial_school(text) from public;
grant execute on function public.can_access_upkk_trial_school(text)
  to authenticated, service_role;

drop policy if exists upkk_trial_grades_select
  on public.upkk_trial_grade_settings;
create policy upkk_trial_grades_select
  on public.upkk_trial_grade_settings
  for select to authenticated
  using (
    public.can_access_upkk_trial_school(
      upkk_trial_grade_settings.kod_sekolah
    )
  );

drop policy if exists upkk_trial_grades_insert
  on public.upkk_trial_grade_settings;
create policy upkk_trial_grades_insert
  on public.upkk_trial_grade_settings
  for insert to authenticated
  with check (
    public.can_access_upkk_trial_school(
      upkk_trial_grade_settings.kod_sekolah
    )
  );

drop policy if exists upkk_trial_grades_update
  on public.upkk_trial_grade_settings;
create policy upkk_trial_grades_update
  on public.upkk_trial_grade_settings
  for update to authenticated
  using (
    public.can_access_upkk_trial_school(
      upkk_trial_grade_settings.kod_sekolah
    )
  )
  with check (
    public.can_access_upkk_trial_school(
      upkk_trial_grade_settings.kod_sekolah
    )
  );

drop policy if exists upkk_trial_marks_select
  on public.upkk_trial_paper_marks;
create policy upkk_trial_marks_select
  on public.upkk_trial_paper_marks
  for select to authenticated
  using (
    public.can_access_upkk_trial_school(
      upkk_trial_paper_marks.kod_sekolah
    )
  );

drop policy if exists upkk_trial_marks_insert
  on public.upkk_trial_paper_marks;
create policy upkk_trial_marks_insert
  on public.upkk_trial_paper_marks
  for insert to authenticated
  with check (
    upkk_trial_paper_marks.entered_by = (select auth.uid())
    and upkk_trial_paper_marks.updated_by = (select auth.uid())
    and public.can_access_upkk_trial_school(
      upkk_trial_paper_marks.kod_sekolah
    )
    and exists (
      select 1
      from public.classes as target_class
      join public.students as target_student
        on target_student.class_id = target_class.id
      where target_class.id = upkk_trial_paper_marks.class_id
        and target_student.id = upkk_trial_paper_marks.student_id
        and target_class.tahun = 5
        and target_class.tahun_akademik =
          upkk_trial_paper_marks.tahun_akademik
        and target_class.kod_sekolah =
          upkk_trial_paper_marks.kod_sekolah
        and target_student.kod_sekolah =
          upkk_trial_paper_marks.kod_sekolah
        and target_student.status = 'AKTIF'
    )
  );

drop policy if exists upkk_trial_marks_update
  on public.upkk_trial_paper_marks;
create policy upkk_trial_marks_update
  on public.upkk_trial_paper_marks
  for update to authenticated
  using (
    public.can_access_upkk_trial_school(
      upkk_trial_paper_marks.kod_sekolah
    )
  )
  with check (
    upkk_trial_paper_marks.updated_by = (select auth.uid())
    and public.can_access_upkk_trial_school(
      upkk_trial_paper_marks.kod_sekolah
    )
    and exists (
      select 1
      from public.classes as target_class
      join public.students as target_student
        on target_student.class_id = target_class.id
      where target_class.id = upkk_trial_paper_marks.class_id
        and target_student.id = upkk_trial_paper_marks.student_id
        and target_class.tahun = 5
        and target_class.tahun_akademik =
          upkk_trial_paper_marks.tahun_akademik
        and target_class.kod_sekolah =
          upkk_trial_paper_marks.kod_sekolah
        and target_student.kod_sekolah =
          upkk_trial_paper_marks.kod_sekolah
        and target_student.status = 'AKTIF'
    )
  );

create or replace function public.set_upkk_trial_mark_audit()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_upkk_trial_mark_audit() from public;
grant execute on function public.set_upkk_trial_mark_audit()
  to authenticated, service_role;

drop trigger if exists trg_upkk_trial_mark_audit
  on public.upkk_trial_paper_marks;
create trigger trg_upkk_trial_mark_audit
before update on public.upkk_trial_paper_marks
for each row execute function public.set_upkk_trial_mark_audit();

insert into public.upkk_trial_grade_settings (
  kod_sekolah,
  grade_a_min,
  grade_b_min,
  grade_c_min
)
select
  school.kod_sekolah,
  85,
  65,
  45
from public.schools as school
on conflict (kod_sekolah) do nothing;

commit;

-- Semakan selepas berjaya:
select
  to_regclass('public.upkk_trial_grade_settings') as grade_settings_table,
  to_regclass('public.upkk_trial_paper_marks') as paper_marks_table;
