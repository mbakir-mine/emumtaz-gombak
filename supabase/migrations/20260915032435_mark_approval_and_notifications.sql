create table public.mark_submission_workflows (
  id uuid primary key default gen_random_uuid(),
  kod_sekolah text not null references public.schools(kod_sekolah) on update cascade on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  kod_subjek text not null references public.subjects(kod_subjek) on update cascade,
  status text not null default 'DRAF' check (status in ('DRAF','DIHANTAR','DISAHKAN','DIKUNCI','PEMBETULAN')),
  notes text check (notes is null or length(notes) <= 1000),
  submitted_at timestamptz,
  submitted_by uuid,
  verified_at timestamptz,
  verified_by uuid,
  locked_at timestamptz,
  locked_by uuid,
  correction_requested_at timestamptz,
  correction_requested_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  unique (kod_sekolah, exam_id, class_id, kod_subjek)
);

create index mark_submission_workflows_status_idx
  on public.mark_submission_workflows (status, updated_at desc);
create index mark_submission_workflows_school_idx
  on public.mark_submission_workflows (kod_sekolah, exam_id, class_id);

create table public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  kod_sekolah text references public.schools(kod_sekolah) on update cascade on delete cascade,
  target_roles text[] not null default '{}',
  type text not null check (type in ('MARK_SUBMITTED','MARK_VERIFIED','MARK_LOCKED','CORRECTION_REQUESTED','SYSTEM')),
  title text not null check (length(title) <= 160),
  message text not null check (length(message) <= 1000),
  link text check (link is null or length(link) <= 500),
  created_at timestamptz not null default now()
);

create table public.user_notification_reads (
  notification_id uuid not null references public.user_notifications(id) on delete cascade,
  auth_user_id uuid not null,
  read_at timestamptz not null default now(),
  primary key (notification_id, auth_user_id)
);

create index user_notifications_created_idx on public.user_notifications (created_at desc);
create index user_notifications_school_idx on public.user_notifications (kod_sekolah, created_at desc);

alter table public.mark_submission_workflows enable row level security;
alter table public.user_notifications enable row level security;
alter table public.user_notification_reads enable row level security;

revoke all on table public.mark_submission_workflows, public.user_notifications, public.user_notification_reads from public, anon, authenticated;
grant select on table public.mark_submission_workflows, public.user_notifications, public.user_notification_reads to authenticated;
grant all on table public.mark_submission_workflows, public.user_notifications, public.user_notification_reads to service_role;

create policy mark_submission_workflows_scoped_read on public.mark_submission_workflows
  for select to authenticated using ((select private.can_access_school(kod_sekolah)));

create policy user_notifications_scoped_read on public.user_notifications
  for select to authenticated using (
    exists (
      select 1 from public.app_users au
      where au.status = 'AKTIF'
        and private.matches_current_user(au.auth_user_id, au.email)
        and (
          au.role::text = 'OWNER'
          or (au.kod_sekolah = user_notifications.kod_sekolah and au.role::text = any(user_notifications.target_roles))
        )
    )
  );

create policy user_notification_reads_own_read on public.user_notification_reads
  for select to authenticated using (auth_user_id = (select auth.uid()));

create or replace function public.transition_mark_submission(
  p_school_code text,
  p_exam_id uuid,
  p_class_id uuid,
  p_subject_code text,
  p_next_status text,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_row public.mark_submission_workflows%rowtype;
  actor_id uuid := (select auth.uid());
  actor_role text;
  can_edit boolean;
  can_review boolean;
  result_id uuid;
  notification_type text;
  notification_title text;
  notification_roles text[];
begin
  if actor_id is null or p_next_status not in ('DRAF','DIHANTAR','DISAHKAN','DIKUNCI','PEMBETULAN') then
    raise exception 'Permintaan tidak sah';
  end if;
  if length(coalesce(p_notes, '')) > 1000 then raise exception 'Catatan terlalu panjang'; end if;
  if not exists (select 1 from public.classes c where c.id = p_class_id and c.kod_sekolah = p_school_code) then
    raise exception 'Kelas tidak sepadan dengan sekolah';
  end if;
  if not exists (select 1 from public.exams e where e.id = p_exam_id) then raise exception 'Peperiksaan tidak ditemui'; end if;
  if not exists (select 1 from public.subjects s where s.kod_subjek = p_subject_code) then raise exception 'Subjek tidak ditemui'; end if;

  select au.role::text into actor_role
  from public.app_users au
  where au.status = 'AKTIF'
    and private.matches_current_user(au.auth_user_id, au.email)
    and (au.role::text = 'OWNER' or au.kod_sekolah = p_school_code or private.can_access_school(p_school_code))
  order by case au.role::text when 'OWNER' then 1 when 'ADMIN_DAERAH' then 2 when 'ADMIN_ZON' then 3 when 'ADMIN_SEKOLAH' then 4 else 5 end
  limit 1;

  if actor_role is null then raise exception 'Akses ditolak'; end if;
  can_edit := private.can_edit_class(p_school_code, p_class_id, p_subject_code);
  can_review := actor_role in ('OWNER','ADMIN_DAERAH','ADMIN_ZON','ADMIN_SEKOLAH');

  select * into current_row from public.mark_submission_workflows
  where kod_sekolah = p_school_code and exam_id = p_exam_id and class_id = p_class_id and kod_subjek = p_subject_code
  for update;

  if current_row.id is null then
    if p_next_status not in ('DRAF','DIHANTAR') or not can_edit then raise exception 'Transisi tidak dibenarkan'; end if;
    insert into public.mark_submission_workflows (
      kod_sekolah, exam_id, class_id, kod_subjek, status, notes,
      submitted_at, submitted_by, updated_by
    ) values (
      p_school_code, p_exam_id, p_class_id, p_subject_code, p_next_status, nullif(trim(p_notes), ''),
      case when p_next_status = 'DIHANTAR' then now() end,
      case when p_next_status = 'DIHANTAR' then actor_id end,
      actor_id
    ) returning id into result_id;
  else
    if p_next_status = 'DIHANTAR' and not (current_row.status in ('DRAF','PEMBETULAN') and can_edit) then raise exception 'Transisi tidak dibenarkan'; end if;
    if p_next_status = 'DRAF' and not (current_row.status = 'DRAF' and can_edit) then raise exception 'Transisi tidak dibenarkan'; end if;
    if p_next_status = 'DISAHKAN' and not (current_row.status = 'DIHANTAR' and can_review) then raise exception 'Transisi tidak dibenarkan'; end if;
    if p_next_status = 'DIKUNCI' and not (current_row.status = 'DISAHKAN' and can_review) then raise exception 'Transisi tidak dibenarkan'; end if;
    if p_next_status = 'PEMBETULAN' and not (current_row.status in ('DIHANTAR','DISAHKAN','DIKUNCI') and can_review and length(trim(coalesce(p_notes,''))) >= 5) then
      raise exception 'Sebab pembetulan sekurang-kurangnya 5 aksara diperlukan';
    end if;

    update public.mark_submission_workflows set
      status = p_next_status,
      notes = nullif(trim(p_notes), ''),
      submitted_at = case when p_next_status = 'DIHANTAR' then now() else submitted_at end,
      submitted_by = case when p_next_status = 'DIHANTAR' then actor_id else submitted_by end,
      verified_at = case when p_next_status = 'DISAHKAN' then now() else verified_at end,
      verified_by = case when p_next_status = 'DISAHKAN' then actor_id else verified_by end,
      locked_at = case when p_next_status = 'DIKUNCI' then now() else locked_at end,
      locked_by = case when p_next_status = 'DIKUNCI' then actor_id else locked_by end,
      correction_requested_at = case when p_next_status = 'PEMBETULAN' then now() else correction_requested_at end,
      correction_requested_by = case when p_next_status = 'PEMBETULAN' then actor_id else correction_requested_by end,
      updated_at = now(), updated_by = actor_id
    where id = current_row.id returning id into result_id;
  end if;

  if p_next_status = 'DIHANTAR' then
    notification_type := 'MARK_SUBMITTED'; notification_title := 'Markah dihantar untuk pengesahan';
    notification_roles := array['OWNER','ADMIN_DAERAH','ADMIN_ZON','ADMIN_SEKOLAH'];
  elsif p_next_status = 'DISAHKAN' then
    notification_type := 'MARK_VERIFIED'; notification_title := 'Markah telah disahkan';
    notification_roles := array['ADMIN_SEKOLAH','GURU_KELAS','GURU_SUBJEK'];
  elsif p_next_status = 'DIKUNCI' then
    notification_type := 'MARK_LOCKED'; notification_title := 'Markah telah dikunci';
    notification_roles := array['ADMIN_SEKOLAH','GURU_KELAS','GURU_SUBJEK'];
  elsif p_next_status = 'PEMBETULAN' then
    notification_type := 'CORRECTION_REQUESTED'; notification_title := 'Pembetulan markah diperlukan';
    notification_roles := array['ADMIN_SEKOLAH','GURU_KELAS','GURU_SUBJEK'];
  end if;

  if notification_type is not null then
    insert into public.user_notifications (kod_sekolah,target_roles,type,title,message,link)
    values (p_school_code,notification_roles,notification_type,notification_title,
      concat('Skop ',p_subject_code,' untuk kelas ',p_class_id::text,'. ',coalesce(nullif(trim(p_notes),''),'')),
      '/pengesahan-markah');
  end if;
  return result_id;
end;
$$;

revoke all on function public.transition_mark_submission(text,uuid,uuid,text,text,text) from public, anon;
grant execute on function public.transition_mark_submission(text,uuid,uuid,text,text,text) to authenticated;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'Akses ditolak'; end if;
  if not exists (
    select 1 from public.user_notifications n where n.id = p_notification_id and exists (
      select 1 from public.app_users au where au.status='AKTIF'
        and private.matches_current_user(au.auth_user_id,au.email)
        and (au.role::text='OWNER' or (au.kod_sekolah=n.kod_sekolah and au.role::text=any(n.target_roles)))
    )
  ) then raise exception 'Akses ditolak'; end if;
  insert into public.user_notification_reads(notification_id,auth_user_id)
  values (p_notification_id,(select auth.uid())) on conflict do nothing;
end;
$$;

revoke all on function public.mark_notification_read(uuid) from public, anon;
grant execute on function public.mark_notification_read(uuid) to authenticated;

create or replace function private.enforce_mark_workflow_lock()
returns trigger language plpgsql security definer set search_path = '' as $$
declare source_row record; workflow_status text;
begin
  if tg_op='DELETE' then source_row := old; else source_row := new; end if;
  if private.is_owner() then
    if tg_op='DELETE' then return old; else return new; end if;
  end if;
  select w.status into workflow_status from public.mark_submission_workflows w
  where w.kod_sekolah=source_row.kod_sekolah and w.exam_id=source_row.exam_id
    and w.class_id=source_row.class_id and w.kod_subjek=source_row.kod_subjek;
  if workflow_status in ('DIHANTAR','DISAHKAN','DIKUNCI') then
    raise exception 'Markah tidak boleh diubah ketika status %', workflow_status;
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end;
$$;

revoke all on function private.enforce_mark_workflow_lock() from public, anon, authenticated;
create trigger marks_workflow_lock before insert or update or delete on public.marks
for each row execute function private.enforce_mark_workflow_lock();
create trigger mark_components_workflow_lock before insert or update or delete on public.mark_components
for each row execute function private.enforce_mark_workflow_lock();

create trigger mark_submission_audit after insert or update or delete on public.mark_submission_workflows
for each row execute function private.capture_security_audit();

create table public.report_verifications (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  reference_number text not null unique,
  report_type text not null check (length(report_type) between 2 and 80),
  scope_label text not null check (length(scope_label) between 2 and 240),
  snapshot_hash text not null check (snapshot_hash ~ '^[a-f0-9]{64}$'),
  kod_sekolah text references public.schools(kod_sekolah) on update cascade on delete set null,
  issued_by uuid not null,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index report_verifications_issued_idx on public.report_verifications (issued_at desc);
alter table public.report_verifications enable row level security;
revoke all on table public.report_verifications from public, anon, authenticated;
grant select on table public.report_verifications to authenticated;
grant all on table public.report_verifications to service_role;

create policy report_verifications_scoped_read on public.report_verifications
  for select to authenticated using (
    issued_by = (select auth.uid())
    or (kod_sekolah is not null and (select private.can_access_school(kod_sekolah)))
    or (select private.is_owner())
  );

create or replace function public.issue_report_verification(
  p_report_type text,
  p_scope_label text,
  p_snapshot_hash text
)
returns table(token uuid, reference_number text, issued_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  school_code text;
  new_reference text;
begin
  if actor_id is null then raise exception 'Akses ditolak'; end if;
  if length(trim(coalesce(p_report_type,''))) not between 2 and 80
    or length(trim(coalesce(p_scope_label,''))) not between 2 and 240
    or p_snapshot_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Maklumat laporan tidak sah';
  end if;

  select au.kod_sekolah into school_code
  from public.app_users au
  where au.status = 'AKTIF' and private.matches_current_user(au.auth_user_id, au.email)
  order by case when au.role::text = 'OWNER' then 0 else 1 end
  limit 1;
  if not found then raise exception 'Profil pengguna aktif tidak ditemui'; end if;

  new_reference := concat(
    'EMTZ-', to_char(current_date, 'YYYYMMDD'), '-',
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  );

  return query
  insert into public.report_verifications (
    reference_number, report_type, scope_label, snapshot_hash, kod_sekolah, issued_by
  ) values (
    new_reference, trim(p_report_type), trim(p_scope_label), p_snapshot_hash, school_code, actor_id
  ) returning report_verifications.token, report_verifications.reference_number, report_verifications.issued_at;
end;
$$;

revoke all on function public.issue_report_verification(text,text,text) from public, anon;
grant execute on function public.issue_report_verification(text,text,text) to authenticated;

create trigger report_verifications_audit after insert or update or delete on public.report_verifications
for each row execute function private.capture_security_audit();
