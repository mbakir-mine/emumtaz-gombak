-- Database-enforced tenant isolation for the original eMumtaz tables.
-- Client-side filters remain useful for UX, but are no longer the security boundary.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create index if not exists app_users_auth_user_id_idx on public.app_users (auth_user_id);
create index if not exists app_users_email_lower_idx on public.app_users (lower(email));
create index if not exists app_users_school_idx on public.app_users (kod_sekolah);
create index if not exists app_users_zone_idx on public.app_users (zon);
create index if not exists schools_code_zone_idx on public.schools (kod_sekolah, zon);

create or replace function private.matches_current_user(target_auth_user_id uuid, target_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_auth_user_id = (select auth.uid())
      or (
        (select auth.uid()) is not null
        and target_email is not null
        and lower(target_email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
      );
$$;

create or replace function private.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_users au
    where au.status = 'AKTIF'
      and private.matches_current_user(au.auth_user_id, au.email)
  );
$$;

create or replace function private.can_access_school(target_school_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_users au
    where au.status = 'AKTIF'
      and private.matches_current_user(au.auth_user_id, au.email)
      and (
        au.role::text in ('OWNER', 'ADMIN_DAERAH')
        or au.kod_sekolah = target_school_code
        or (
          au.role::text = 'ADMIN_ZON'
          and au.zon is not null
          and exists (
            select 1 from public.schools s
            where s.kod_sekolah = target_school_code and s.zon = au.zon
          )
        )
      )
  );
$$;

create or replace function private.can_manage_profile(target_role text, target_school_code text, target_zone text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_users au
    where au.status = 'AKTIF'
      and private.matches_current_user(au.auth_user_id, au.email)
      and (
        au.role::text = 'OWNER'
        or (
          au.role::text = 'ADMIN_DAERAH'
          and target_role not in ('OWNER', 'ADMIN_DAERAH')
        )
        or (
          au.role::text = 'ADMIN_ZON'
          and target_role in ('ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK')
          and au.zon is not null and au.zon = target_zone
        )
        or (
          au.role::text = 'ADMIN_SEKOLAH'
          and target_role in ('GURU_KELAS', 'GURU_SUBJEK')
          and au.kod_sekolah is not null and au.kod_sekolah = target_school_code
        )
      )
  );
$$;

create or replace function private.can_view_profile(
  target_id uuid,
  target_auth_user_id uuid,
  target_email text,
  target_school_code text,
  target_zone text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.matches_current_user(target_auth_user_id, target_email)
      or exists (
        select 1
        from public.app_users au
        where au.status = 'AKTIF'
          and private.matches_current_user(au.auth_user_id, au.email)
          and (
            au.role::text in ('OWNER', 'ADMIN_DAERAH')
            or (au.role::text = 'ADMIN_ZON' and au.zon is not null and au.zon = target_zone)
            or (au.role::text = 'ADMIN_SEKOLAH' and au.kod_sekolah is not null and au.kod_sekolah = target_school_code)
          )
      );
$$;

create or replace function private.can_update_profile(
  target_id uuid,
  new_auth_user_id uuid,
  new_email text,
  new_role text,
  new_school_code text,
  new_status text,
  new_zone text,
  new_district text,
  new_allowed_nav text[],
  new_must_change_password boolean
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.can_manage_profile(new_role, new_school_code, new_zone)
      or exists (
        select 1
        from public.app_users old
        where old.id = target_id
          and private.matches_current_user(old.auth_user_id, old.email)
          and old.auth_user_id is not distinct from new_auth_user_id
          and old.email is not distinct from new_email
          and old.role::text is not distinct from new_role
          and old.kod_sekolah is not distinct from new_school_code
          and old.status is not distinct from new_status
          and old.zon is not distinct from new_zone
          and old.daerah is not distinct from new_district
          and old.allowed_nav is not distinct from new_allowed_nav
          and old.must_change_password is not distinct from new_must_change_password
      );
$$;

revoke all on function private.matches_current_user(uuid, text) from public, anon;
revoke all on function private.is_active_user() from public, anon;
revoke all on function private.can_access_school(text) from public, anon;
revoke all on function private.can_manage_profile(text, text, text) from public, anon;
revoke all on function private.can_view_profile(uuid, uuid, text, text, text) from public, anon;
revoke all on function private.can_update_profile(uuid, uuid, text, text, text, text, text, text, text[], boolean) from public, anon;

grant execute on function private.matches_current_user(uuid, text) to authenticated;
grant execute on function private.is_active_user() to authenticated;
grant execute on function private.can_access_school(text) to authenticated;
grant execute on function private.can_manage_profile(text, text, text) to authenticated;
grant execute on function private.can_view_profile(uuid, uuid, text, text, text) to authenticated;
grant execute on function private.can_update_profile(uuid, uuid, text, text, text, text, text, text, text[], boolean) to authenticated;

-- School-scoped tables: anonymous access is denied; active users only see their scope.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'amal_khair_records', 'classes', 'daily_attendance', 'khalifah_muda_records',
    'mark_components', 'marks', 'pbd_assessments', 'rph_records',
    'school_module_access', 'student_enrollments', 'students', 'timetable_entries',
    'timetable_requirements', 'timetable_slots', 'upkk_amali_solat_marks',
    'upkk_jakim_marks', 'upkk_pchi_marks'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select private.can_access_school(kod_sekolah)))',
      table_name || '_tenant_select', table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select private.can_access_school(kod_sekolah)))',
      table_name || '_tenant_insert', table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select private.can_access_school(kod_sekolah))) with check ((select private.can_access_school(kod_sekolah)))',
      table_name || '_tenant_update', table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select private.can_access_school(kod_sekolah)))',
      table_name || '_tenant_delete', table_name
    );
  end loop;
end;
$$;

-- Transfers are visible from either the source or destination school.
alter table public.student_transfer_logs enable row level security;
create policy student_transfer_logs_tenant_select on public.student_transfer_logs
  for select to authenticated
  using ((select private.can_access_school(from_kod_sekolah)) or (select private.can_access_school(to_kod_sekolah)));
create policy student_transfer_logs_tenant_insert on public.student_transfer_logs
  for insert to authenticated
  with check ((select private.can_access_school(from_kod_sekolah)) and (select private.can_access_school(to_kod_sekolah)));

-- Assignment rows inherit their tenant from the linked class.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'teacher_class_assignments', 'teacher_subject_assignments', 'teacher_subject_component_assignments'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using (exists (select 1 from public.classes c where c.id = class_id and (select private.can_access_school(c.kod_sekolah))))',
      table_name || '_tenant_select', table_name
    );
    execute format(
      'create policy %I on public.%I for all to authenticated using (exists (select 1 from public.classes c where c.id = class_id and (select private.can_access_school(c.kod_sekolah)))) with check (exists (select 1 from public.classes c where c.id = class_id and (select private.can_access_school(c.kod_sekolah))))',
      table_name || '_tenant_write', table_name
    );
  end loop;
end;
$$;

-- PBD marks inherit tenant scope from their assessment.
alter table public.pbd_marks enable row level security;
create policy pbd_marks_tenant_select on public.pbd_marks
  for select to authenticated
  using (exists (
    select 1 from public.pbd_assessments a
    where a.id = assessment_id and (select private.can_access_school(a.kod_sekolah))
  ));
create policy pbd_marks_tenant_write on public.pbd_marks
  for all to authenticated
  using (exists (
    select 1 from public.pbd_assessments a
    where a.id = assessment_id and (select private.can_access_school(a.kod_sekolah))
  ))
  with check (exists (
    select 1 from public.pbd_assessments a
    where a.id = assessment_id and (select private.can_access_school(a.kod_sekolah))
  ));

-- Shared reference data is readable by active users; writes remain authenticated.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'amal_khair_categories', 'exams', 'grade_scales', 'khalifah_muda_components',
    'subject_component_mark_settings', 'subject_components', 'subject_grade_rules', 'subjects'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select private.is_active_user()))',
      table_name || '_active_select', table_name
    );
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select private.is_active_user())) with check ((select private.is_active_user()))',
      table_name || '_active_write', table_name
    );
  end loop;
end;
$$;

-- Schools are public only as a minimal active directory for registration.
alter table public.schools enable row level security;
create policy schools_public_registration_list on public.schools
  for select to anon using (status = 'AKTIF');
create policy schools_tenant_select on public.schools
  for select to authenticated using ((select private.can_access_school(kod_sekolah)));
create policy schools_tenant_write on public.schools
  for all to authenticated
  using ((select private.can_access_school(kod_sekolah)))
  with check ((select private.can_access_school(kod_sekolah)));

-- Profiles: users may read themselves; administrators see only their permitted scope.
-- A user may edit their own display name, but cannot alter protected identity/access fields.
alter table public.app_users enable row level security;
create policy app_users_scoped_select on public.app_users
  for select to authenticated
  using ((select private.can_view_profile(id, auth_user_id, email, kod_sekolah, zon)));
create policy app_users_scoped_insert on public.app_users
  for insert to authenticated
  with check ((select private.can_manage_profile(role::text, kod_sekolah, zon)));
create policy app_users_scoped_update on public.app_users
  for update to authenticated
  using ((select private.can_view_profile(id, auth_user_id, email, kod_sekolah, zon)))
  with check ((select private.can_update_profile(
    id, auth_user_id, email, role::text, kod_sekolah, status, zon, daerah, allowed_nav, must_change_password
  )));
create policy app_users_scoped_delete on public.app_users
  for delete to authenticated
  using ((select private.can_manage_profile(role::text, kod_sekolah, zon)));

-- Explicit table grants keep anonymous callers away from personal and academic data.
revoke all on all tables in schema public from anon;
grant select on public.schools to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
