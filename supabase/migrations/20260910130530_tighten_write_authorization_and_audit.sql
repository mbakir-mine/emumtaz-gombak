-- Least-privilege write authorization and immutable administrative audit trail.

create or replace function private.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_users au
    where au.status = 'AKTIF'
      and au.role::text = 'OWNER'
      and private.matches_current_user(au.auth_user_id, au.email)
  );
$$;

create or replace function private.is_curriculum_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_users au
    where au.status = 'AKTIF'
      and au.role::text in ('OWNER', 'ADMIN_DAERAH', 'ADMIN_SEKOLAH')
      and private.matches_current_user(au.auth_user_id, au.email)
  );
$$;

create or replace function private.can_administer_school(target_school_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_users au
    where au.status = 'AKTIF'
      and private.matches_current_user(au.auth_user_id, au.email)
      and (
        au.role::text in ('OWNER', 'ADMIN_DAERAH')
        or (au.role::text = 'ADMIN_SEKOLAH' and au.kod_sekolah = target_school_code)
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

create or replace function private.can_manage_school_directory(target_school_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_users au
    where au.status = 'AKTIF'
      and private.matches_current_user(au.auth_user_id, au.email)
      and (
        au.role::text in ('OWNER', 'ADMIN_DAERAH')
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

create or replace function private.can_edit_class(
  target_school_code text,
  target_class_id uuid,
  target_subject_code text default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.can_administer_school(target_school_code)
      or exists (
        select 1
        from public.app_users au
        where au.status = 'AKTIF'
          and au.kod_sekolah = target_school_code
          and private.matches_current_user(au.auth_user_id, au.email)
          and (
            (
              au.role::text = 'GURU_KELAS'
              and exists (
                select 1 from public.teacher_class_assignments tca
                where tca.user_id = au.id and tca.class_id = target_class_id
              )
            )
            or (
              au.role::text = 'GURU_SUBJEK'
              and exists (
                select 1 from public.teacher_subject_assignments tsa
                where tsa.user_id = au.id
                  and tsa.class_id = target_class_id
                  and (target_subject_code is null or tsa.kod_subjek = target_subject_code)
              )
            )
          )
      );
$$;

create or replace function private.can_record_attendance(target_school_code text, target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.can_administer_school(target_school_code)
      or exists (
        select 1
        from public.app_users au
        join public.teacher_class_assignments tca on tca.user_id = au.id
        where au.status = 'AKTIF'
          and au.role::text = 'GURU_KELAS'
          and au.kod_sekolah = target_school_code
          and tca.class_id = target_class_id
          and private.matches_current_user(au.auth_user_id, au.email)
      );
$$;

create or replace function private.can_read_security_audit()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_users au
    where au.status = 'AKTIF'
      and au.role::text in ('OWNER', 'ADMIN_DAERAH')
      and private.matches_current_user(au.auth_user_id, au.email)
  );
$$;

revoke all on function private.is_owner() from public, anon;
revoke all on function private.is_curriculum_manager() from public, anon;
revoke all on function private.can_administer_school(text) from public, anon;
revoke all on function private.can_manage_school_directory(text) from public, anon;
revoke all on function private.can_edit_class(text, uuid, text) from public, anon;
revoke all on function private.can_record_attendance(text, uuid) from public, anon;
revoke all on function private.can_read_security_audit() from public, anon;

grant execute on function private.is_owner() to authenticated;
grant execute on function private.is_curriculum_manager() to authenticated;
grant execute on function private.can_administer_school(text) to authenticated;
grant execute on function private.can_manage_school_directory(text) to authenticated;
grant execute on function private.can_edit_class(text, uuid, text) to authenticated;
grant execute on function private.can_record_attendance(text, uuid) to authenticated;
grant execute on function private.can_read_security_audit() to authenticated;

-- Structural data may only be changed by the appropriate administrators.
drop policy if exists schools_tenant_write on public.schools;
create policy schools_admin_insert on public.schools for insert to authenticated
  with check ((select private.can_manage_school_directory(kod_sekolah)));
create policy schools_admin_update on public.schools for update to authenticated
  using ((select private.can_manage_school_directory(kod_sekolah)))
  with check ((select private.can_manage_school_directory(kod_sekolah)));
create policy schools_admin_delete on public.schools for delete to authenticated
  using ((select private.can_manage_school_directory(kod_sekolah)));

drop policy if exists classes_tenant_insert on public.classes;
drop policy if exists classes_tenant_update on public.classes;
drop policy if exists classes_tenant_delete on public.classes;
create policy classes_admin_insert on public.classes for insert to authenticated
  with check ((select private.can_administer_school(kod_sekolah)));
create policy classes_admin_update on public.classes for update to authenticated
  using ((select private.can_administer_school(kod_sekolah)))
  with check ((select private.can_administer_school(kod_sekolah)));
create policy classes_admin_delete on public.classes for delete to authenticated
  using ((select private.can_administer_school(kod_sekolah)));

drop policy if exists school_module_access_tenant_insert on public.school_module_access;
drop policy if exists school_module_access_tenant_update on public.school_module_access;
drop policy if exists school_module_access_tenant_delete on public.school_module_access;
create policy school_module_access_owner_insert on public.school_module_access for insert to authenticated
  with check ((select private.is_owner()));
create policy school_module_access_owner_update on public.school_module_access for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));
create policy school_module_access_owner_delete on public.school_module_access for delete to authenticated
  using ((select private.is_owner()));

-- Teachers may write only to classes/subjects explicitly assigned to them.
drop policy if exists students_tenant_insert on public.students;
drop policy if exists students_tenant_update on public.students;
drop policy if exists students_tenant_delete on public.students;
create policy students_assigned_insert on public.students for insert to authenticated
  with check ((select private.can_edit_class(kod_sekolah, class_id, null)));
create policy students_assigned_update on public.students for update to authenticated
  using ((select private.can_edit_class(kod_sekolah, class_id, null)))
  with check ((select private.can_edit_class(kod_sekolah, class_id, null)));
create policy students_assigned_delete on public.students for delete to authenticated
  using ((select private.can_administer_school(kod_sekolah)));

drop policy if exists marks_tenant_insert on public.marks;
drop policy if exists marks_tenant_update on public.marks;
drop policy if exists marks_tenant_delete on public.marks;
create policy marks_assigned_insert on public.marks for insert to authenticated
  with check ((select private.can_edit_class(kod_sekolah, class_id, kod_subjek)));
create policy marks_assigned_update on public.marks for update to authenticated
  using ((select private.can_edit_class(kod_sekolah, class_id, kod_subjek)))
  with check ((select private.can_edit_class(kod_sekolah, class_id, kod_subjek)));
create policy marks_assigned_delete on public.marks for delete to authenticated
  using ((select private.can_administer_school(kod_sekolah)));

drop policy if exists mark_components_tenant_insert on public.mark_components;
drop policy if exists mark_components_tenant_update on public.mark_components;
drop policy if exists mark_components_tenant_delete on public.mark_components;
create policy mark_components_assigned_insert on public.mark_components for insert to authenticated
  with check ((select private.can_edit_class(kod_sekolah, class_id, kod_subjek)));
create policy mark_components_assigned_update on public.mark_components for update to authenticated
  using ((select private.can_edit_class(kod_sekolah, class_id, kod_subjek)))
  with check ((select private.can_edit_class(kod_sekolah, class_id, kod_subjek)));
create policy mark_components_assigned_delete on public.mark_components for delete to authenticated
  using ((select private.can_administer_school(kod_sekolah)));

drop policy if exists daily_attendance_tenant_insert on public.daily_attendance;
drop policy if exists daily_attendance_tenant_update on public.daily_attendance;
drop policy if exists daily_attendance_tenant_delete on public.daily_attendance;
create policy daily_attendance_assigned_insert on public.daily_attendance for insert to authenticated
  with check ((select private.can_record_attendance(kod_sekolah, class_id)));
create policy daily_attendance_assigned_update on public.daily_attendance for update to authenticated
  using ((select private.can_record_attendance(kod_sekolah, class_id)))
  with check ((select private.can_record_attendance(kod_sekolah, class_id)));
create policy daily_attendance_admin_delete on public.daily_attendance for delete to authenticated
  using ((select private.can_administer_school(kod_sekolah)));

-- Class-bound optional modules use the same assignment checks.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'amal_khair_records', 'khalifah_muda_records', 'rph_records',
    'upkk_amali_solat_marks', 'upkk_jakim_marks', 'upkk_pchi_marks',
    'timetable_entries', 'timetable_requirements'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_tenant_insert', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_tenant_update', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_tenant_delete', table_name);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select private.can_edit_class(kod_sekolah, class_id, null)))',
      table_name || '_assigned_insert', table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select private.can_edit_class(kod_sekolah, class_id, null))) with check ((select private.can_edit_class(kod_sekolah, class_id, null)))',
      table_name || '_assigned_update', table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select private.can_administer_school(kod_sekolah)))',
      table_name || '_admin_delete', table_name
    );
  end loop;
end;
$$;

drop policy if exists timetable_slots_tenant_insert on public.timetable_slots;
drop policy if exists timetable_slots_tenant_update on public.timetable_slots;
drop policy if exists timetable_slots_tenant_delete on public.timetable_slots;
create policy timetable_slots_admin_insert on public.timetable_slots for insert to authenticated
  with check ((select private.can_administer_school(kod_sekolah)));
create policy timetable_slots_admin_update on public.timetable_slots for update to authenticated
  using ((select private.can_administer_school(kod_sekolah)))
  with check ((select private.can_administer_school(kod_sekolah)));
create policy timetable_slots_admin_delete on public.timetable_slots for delete to authenticated
  using ((select private.can_administer_school(kod_sekolah)));

drop policy if exists pbd_assessments_tenant_insert on public.pbd_assessments;
drop policy if exists pbd_assessments_tenant_update on public.pbd_assessments;
drop policy if exists pbd_assessments_tenant_delete on public.pbd_assessments;
create policy pbd_assessments_assigned_insert on public.pbd_assessments for insert to authenticated
  with check ((select private.can_edit_class(kod_sekolah, class_id, kod_subjek)));
create policy pbd_assessments_assigned_update on public.pbd_assessments for update to authenticated
  using ((select private.can_edit_class(kod_sekolah, class_id, kod_subjek)))
  with check ((select private.can_edit_class(kod_sekolah, class_id, kod_subjek)));
create policy pbd_assessments_admin_delete on public.pbd_assessments for delete to authenticated
  using ((select private.can_administer_school(kod_sekolah)));

drop policy if exists pbd_marks_tenant_write on public.pbd_marks;
create policy pbd_marks_assigned_insert on public.pbd_marks for insert to authenticated
  with check (exists (
    select 1 from public.pbd_assessments a
    where a.id = assessment_id
      and (select private.can_edit_class(a.kod_sekolah, a.class_id, a.kod_subjek))
  ));
create policy pbd_marks_assigned_update on public.pbd_marks for update to authenticated
  using (exists (
    select 1 from public.pbd_assessments a
    where a.id = assessment_id
      and (select private.can_edit_class(a.kod_sekolah, a.class_id, a.kod_subjek))
  ))
  with check (exists (
    select 1 from public.pbd_assessments a
    where a.id = assessment_id
      and (select private.can_edit_class(a.kod_sekolah, a.class_id, a.kod_subjek))
  ));
create policy pbd_marks_admin_delete on public.pbd_marks for delete to authenticated
  using (exists (
    select 1 from public.pbd_assessments a
    where a.id = assessment_id and (select private.can_administer_school(a.kod_sekolah))
  ));

-- Assignment configuration is administrator-only.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'teacher_class_assignments', 'teacher_subject_assignments', 'teacher_subject_component_assignments'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_tenant_write', table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated using (exists (select 1 from public.classes c where c.id = class_id and (select private.can_administer_school(c.kod_sekolah)))) with check (exists (select 1 from public.classes c where c.id = class_id and (select private.can_administer_school(c.kod_sekolah))))',
      table_name || '_admin_write', table_name
    );
  end loop;
end;
$$;

drop policy if exists student_enrollments_tenant_insert on public.student_enrollments;
drop policy if exists student_enrollments_tenant_update on public.student_enrollments;
drop policy if exists student_enrollments_tenant_delete on public.student_enrollments;
create policy student_enrollments_admin_write on public.student_enrollments for all to authenticated
  using ((select private.can_administer_school(kod_sekolah)))
  with check ((select private.can_administer_school(kod_sekolah)));

drop policy if exists student_transfer_logs_tenant_insert on public.student_transfer_logs;
create policy student_transfer_logs_admin_insert on public.student_transfer_logs for insert to authenticated
  with check (
    (select private.can_administer_school(from_kod_sekolah))
    and (select private.can_administer_school(to_kod_sekolah))
  );

-- Shared curriculum tables are no longer writable by every authenticated user.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'amal_khair_categories', 'exams', 'grade_scales', 'khalifah_muda_components',
    'subject_component_mark_settings', 'subject_components', 'subject_grade_rules', 'subjects'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_active_write', table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select private.is_curriculum_manager())) with check ((select private.is_curriculum_manager()))',
      table_name || '_manager_write', table_name
    );
  end loop;
end;
$$;

-- Teachers may create a missing component definition; duplicate updates remain manager-only.
create policy subject_components_teacher_insert on public.subject_components
  for insert to authenticated with check ((select private.is_active_user()));

-- Immutable security audit trail for administrative/configuration changes.
create table if not exists public.security_audit_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  actor_auth_user_id uuid,
  actor_email text,
  actor_profile_id uuid,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  table_name text not null,
  record_id text,
  kod_sekolah text,
  changed_fields text[] not null default '{}'
);

create index if not exists security_audit_logs_created_at_idx
  on public.security_audit_logs (created_at desc);
create index if not exists security_audit_logs_actor_idx
  on public.security_audit_logs (actor_auth_user_id, created_at desc);
create index if not exists security_audit_logs_school_idx
  on public.security_audit_logs (kod_sekolah, created_at desc);

alter table public.security_audit_logs enable row level security;
create policy security_audit_logs_authorized_read on public.security_audit_logs
  for select to authenticated using ((select private.can_read_security_audit()));

revoke all on public.security_audit_logs from anon, authenticated;
grant select on public.security_audit_logs to authenticated;
grant all on public.security_audit_logs to service_role;

create or replace function private.capture_security_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_data jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  previous_data jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else '{}'::jsonb end;
  actor_profile uuid;
  school_code text;
  fields text[] := '{}';
begin
  select au.id into actor_profile
  from public.app_users au
  where au.status = 'AKTIF'
    and private.matches_current_user(au.auth_user_id, au.email)
  order by case au.role::text
    when 'OWNER' then 1 when 'ADMIN_DAERAH' then 2 when 'ADMIN_ZON' then 3
    when 'ADMIN_SEKOLAH' then 4 when 'GURU_KELAS' then 5 else 6 end
  limit 1;

  school_code := row_data ->> 'kod_sekolah';
  if school_code is null and row_data ? 'class_id' then
    select c.kod_sekolah into school_code
    from public.classes c
    where c.id = nullif(row_data ->> 'class_id', '')::uuid;
  end if;

  if tg_op = 'INSERT' then
    select coalesce(array_agg(key order by key), '{}') into fields from jsonb_each(row_data);
  elsif tg_op = 'UPDATE' then
    select coalesce(array_agg(key order by key), '{}') into fields
    from (
      select key from jsonb_each(row_data)
      where value is distinct from previous_data -> key
    ) changed;
  end if;

  insert into public.security_audit_logs (
    actor_auth_user_id, actor_email, actor_profile_id, action,
    table_name, record_id, kod_sekolah, changed_fields
  ) values (
    (select auth.uid()), nullif((select auth.jwt() ->> 'email'), ''), actor_profile, tg_op,
    tg_table_name, row_data ->> 'id', school_code, fields
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.capture_security_audit() from public, anon, authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'app_users', 'schools', 'classes', 'school_module_access',
    'teacher_class_assignments', 'teacher_subject_assignments',
    'teacher_subject_component_assignments', 'subjects', 'exams',
    'subject_components', 'subject_component_mark_settings', 'khalifah_muda_components'
  ] loop
    execute format('drop trigger if exists security_audit_trigger on public.%I', table_name);
    execute format(
      'create trigger security_audit_trigger after insert or update or delete on public.%I for each row execute function private.capture_security_audit()',
      table_name
    );
  end loop;
end;
$$;
