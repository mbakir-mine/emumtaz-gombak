-- Immutable sign-in/sign-out activity and expanded data-change auditing.

create table if not exists public.auth_activity_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  actor_auth_user_id uuid not null,
  actor_email text,
  actor_profile_id uuid,
  actor_name text,
  actor_role text,
  kod_sekolah text,
  event_type text not null check (event_type in ('LOGIN', 'LOGOUT')),
  session_id text not null,
  constraint auth_activity_logs_session_event_key unique (session_id, event_type)
);

create index if not exists auth_activity_logs_created_at_idx
  on public.auth_activity_logs (created_at desc);
create index if not exists auth_activity_logs_actor_idx
  on public.auth_activity_logs (actor_auth_user_id, created_at desc);
create index if not exists auth_activity_logs_school_idx
  on public.auth_activity_logs (kod_sekolah, created_at desc);

alter table public.auth_activity_logs enable row level security;
drop policy if exists auth_activity_logs_owner_read on public.auth_activity_logs;
create policy auth_activity_logs_owner_read on public.auth_activity_logs
  for select to authenticated using ((select private.can_read_security_audit()));

revoke all on table public.auth_activity_logs from public, anon, authenticated;
grant select on table public.auth_activity_logs to authenticated;
grant all on table public.auth_activity_logs to service_role;

-- Session activity is written only by the server-side service role after
-- validating the caller's access token. No public RPC can manufacture logs.
drop function if exists public.record_auth_activity(text);

alter table public.security_audit_logs
  add column if not exists old_values jsonb,
  add column if not exists new_values jsonb;

create or replace function private.capture_security_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_data jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  previous_data jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else '{}'::jsonb end;
  clean_row jsonb;
  clean_previous jsonb;
  actor_profile uuid;
  school_code text;
  record_key text;
  fields text[] := '{}';
  before_values jsonb;
  after_values jsonb;
  excluded_fields constant text[] := array[
    'password', 'password_hash', 'temporary_password', 'access_token',
    'refresh_token', 'token', 'secret', 'service_role_key', 'anon_key'
  ];
  automatic_fields constant text[] := array['created_at', 'created_by', 'updated_at', 'updated_by'];
begin
  clean_row := row_data - excluded_fields;
  clean_previous := previous_data - excluded_fields;

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
  if school_code is null and row_data ? 'student_id' then
    select s.kod_sekolah into school_code
    from public.students s
    where s.id = nullif(row_data ->> 'student_id', '')::uuid;
  end if;
  if school_code is null and row_data ? 'assessment_id' then
    select a.kod_sekolah into school_code
    from public.pbd_assessments a
    where a.id = nullif(row_data ->> 'assessment_id', '')::uuid;
  end if;

  record_key := coalesce(
    row_data ->> 'id', row_data ->> 'kod_sekolah', row_data ->> 'key',
    row_data ->> 'student_id', row_data ->> 'class_id'
  );

  if tg_op = 'INSERT' then
    select coalesce(array_agg(key order by key), '{}') into fields
    from jsonb_each(clean_row)
    where not (key = any(automatic_fields));
  elsif tg_op = 'UPDATE' then
    select coalesce(array_agg(key order by key), '{}') into fields
    from (
      select key from jsonb_each(clean_row)
      where value is distinct from clean_previous -> key
        and not (key = any(automatic_fields))
    ) changed;

    if coalesce(array_length(fields, 1), 0) = 0 then
      return new;
    end if;

    select coalesce(jsonb_object_agg(field_name, clean_previous -> field_name), '{}'::jsonb)
      into before_values from unnest(fields) as changed(field_name);
    select coalesce(jsonb_object_agg(field_name, clean_row -> field_name), '{}'::jsonb)
      into after_values from unnest(fields) as changed(field_name);
  end if;

  insert into public.security_audit_logs (
    actor_auth_user_id, actor_email, actor_profile_id, action,
    table_name, record_id, kod_sekolah, changed_fields, old_values, new_values
  ) values (
    (select auth.uid()), nullif((select auth.jwt() ->> 'email'), ''), actor_profile, tg_op,
    tg_table_name, record_key, school_code, fields, before_values, after_values
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
    'app_users', 'schools', 'classes', 'students', 'student_enrollments',
    'student_transfer_logs', 'school_module_access', 'teacher_class_assignments',
    'teacher_subject_assignments', 'teacher_subject_component_assignments',
    'subjects', 'exams', 'grade_scales', 'subject_grade_rules', 'subject_components',
    'subject_component_mark_settings', 'school_subject_mark_settings',
    'school_subject_component_mark_settings', 'mark_components', 'marks',
    'daily_attendance', 'amal_khair_categories', 'amal_khair_records',
    'takwim_events', 'timetable_slots', 'timetable_entries', 'timetable_requirements',
    'rph_records', 'pbd_assessments', 'pbd_marks', 'upkk_amali_solat_marks',
    'upkk_pchi_marks', 'psra_trial_marks', 'psra_trial_paper_marks',
    'upkk_trial_grade_settings', 'upkk_trial_paper_marks', 'khalifah_muda_components',
    'khalifah_muda_records', 'sahsiah_ihab_assessments', 'system_settings'
  ] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('drop trigger if exists security_audit_trigger on public.%I', table_name);
      execute format(
        'create trigger security_audit_trigger after insert or update or delete on public.%I for each row execute function private.capture_security_audit()',
        table_name
      );
    end if;
  end loop;
end;
$$;
