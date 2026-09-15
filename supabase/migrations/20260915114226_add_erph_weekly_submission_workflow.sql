-- Weekly e-RPH submission, review, correction and verification workflow.
-- Content is snapshotted on every submission so the reviewed version remains auditable.

create table public.rph_weekly_submissions (
  id uuid primary key default gen_random_uuid(),
  kod_sekolah text not null references public.schools(kod_sekolah) on update cascade on delete cascade,
  teacher_id uuid not null references public.app_users(id) on delete restrict,
  week_start date not null,
  status text not null default 'DRAF'
    check (status in ('DRAF','DIHANTAR','DALAM_SEMAKAN','PEMBETULAN','DIHANTAR_SEMULA','DISAHKAN')),
  teacher_note text check (teacher_note is null or length(teacher_note) <= 1000),
  reviewer_note text check (reviewer_note is null or length(reviewer_note) <= 2000),
  submitted_at timestamptz,
  submitted_by uuid,
  review_started_at timestamptz,
  review_started_by uuid references public.app_users(id) on delete set null,
  correction_requested_at timestamptz,
  correction_requested_by uuid references public.app_users(id) on delete set null,
  verified_at timestamptz,
  verified_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rph_weekly_submissions_monday_check check (extract(isodow from week_start) = 1),
  unique (kod_sekolah, teacher_id, week_start)
);

create table public.rph_weekly_submission_items (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.rph_weekly_submissions(id) on delete cascade,
  rph_record_id uuid not null references public.rph_records(id) on delete restrict,
  version_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique (submission_id, rph_record_id)
);

create table public.rph_weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.rph_weekly_submissions(id) on delete cascade,
  actor_profile_id uuid not null references public.app_users(id) on delete restrict,
  action text not null check (action in ('DIHANTAR','MULA_SEMAK','PEMBETULAN','DIHANTAR_SEMULA','DISAHKAN')),
  comment text check (comment is null or length(comment) <= 2000),
  created_at timestamptz not null default now()
);

create index rph_weekly_submissions_school_week_idx
  on public.rph_weekly_submissions (kod_sekolah, week_start desc, status);
create index rph_weekly_submissions_teacher_week_idx
  on public.rph_weekly_submissions (teacher_id, week_start desc);
create index rph_weekly_submission_items_submission_idx
  on public.rph_weekly_submission_items (submission_id);
create index rph_weekly_submission_items_record_idx
  on public.rph_weekly_submission_items (rph_record_id);
create index rph_weekly_reviews_submission_created_idx
  on public.rph_weekly_reviews (submission_id, created_at desc);

create trigger rph_weekly_submissions_updated_at
before update on public.rph_weekly_submissions
for each row execute function public.set_optional_module_updated_at();

alter table public.rph_weekly_submissions enable row level security;
alter table public.rph_weekly_submission_items enable row level security;
alter table public.rph_weekly_reviews enable row level security;

revoke all on table
  public.rph_weekly_submissions,
  public.rph_weekly_submission_items,
  public.rph_weekly_reviews
from public, anon, authenticated;

grant select on table
  public.rph_weekly_submissions,
  public.rph_weekly_submission_items,
  public.rph_weekly_reviews
to authenticated;

grant all on table
  public.rph_weekly_submissions,
  public.rph_weekly_submission_items,
  public.rph_weekly_reviews
to service_role;

create or replace function private.can_view_rph_submission(target_school_code text, target_teacher_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.can_administer_school(target_school_code)
      or exists (
        select 1 from public.app_users au
        where au.id = target_teacher_id
          and au.status = 'AKTIF'
          and au.kod_sekolah = target_school_code
          and private.matches_current_user(au.auth_user_id, au.email)
      );
$$;

revoke all on function private.can_view_rph_submission(text, uuid) from public, anon;
grant execute on function private.can_view_rph_submission(text, uuid) to authenticated;

create policy rph_weekly_submissions_scoped_select
on public.rph_weekly_submissions for select to authenticated
using ((select private.can_view_rph_submission(kod_sekolah, teacher_id)));

create policy rph_weekly_submission_items_scoped_select
on public.rph_weekly_submission_items for select to authenticated
using (
  exists (
    select 1 from public.rph_weekly_submissions submission
    where submission.id = rph_weekly_submission_items.submission_id
      and (select private.can_view_rph_submission(submission.kod_sekolah, submission.teacher_id))
  )
);

create policy rph_weekly_reviews_scoped_select
on public.rph_weekly_reviews for select to authenticated
using (
  exists (
    select 1 from public.rph_weekly_submissions submission
    where submission.id = rph_weekly_reviews.submission_id
      and (select private.can_view_rph_submission(submission.kod_sekolah, submission.teacher_id))
  )
);

create or replace function public.transition_rph_weekly_submission(
  p_actor_profile_id uuid,
  p_school_code text,
  p_week_start date,
  p_submission_id uuid,
  p_next_action text,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.app_users%rowtype;
  current_submission public.rph_weekly_submissions%rowtype;
  result_id uuid;
  next_status text;
  ready_count integer;
  clean_note text := nullif(trim(coalesce(p_note, '')), '');
  is_reviewer boolean;
begin
  if (select auth.uid()) is null
    or p_actor_profile_id is null
    or p_school_code is null
    or p_week_start is null
    or extract(isodow from p_week_start) <> 1
    or p_next_action not in ('HANTAR','MULA_SEMAK','PEMBETULAN','SAH') then
    raise exception 'Permintaan penghantaran tidak sah';
  end if;
  if length(coalesce(clean_note, '')) > 2000 then raise exception 'Catatan terlalu panjang'; end if;

  select * into actor
  from public.app_users au
  where au.id = p_actor_profile_id
    and au.status = 'AKTIF'
    and private.matches_current_user(au.auth_user_id, au.email)
  limit 1;
  if actor.id is null then raise exception 'Profil aktif tidak sepadan dengan sesi'; end if;

  is_reviewer := actor.role::text in ('OWNER','ADMIN_DAERAH','ADMIN_ZON','ADMIN_SEKOLAH')
    and private.can_administer_school(p_school_code);

  if p_next_action = 'HANTAR' then
    if actor.role::text not in ('GURU_KELAS','GURU_SUBJEK')
      or actor.kod_sekolah is distinct from p_school_code then
      raise exception 'Hanya guru sekolah berkenaan boleh menghantar e-RPH sendiri';
    end if;

    select count(*) into ready_count
    from public.rph_records record
    where record.kod_sekolah = p_school_code
      and record.teacher_id = actor.id
      and record.tarikh between p_week_start and p_week_start + 6
      and record.status in ('SEDIA','SELESAI');
    if ready_count = 0 then raise exception 'Tiada RPH berstatus Sedia atau Selesai untuk minggu ini'; end if;

    select * into current_submission
    from public.rph_weekly_submissions submission
    where submission.kod_sekolah = p_school_code
      and submission.teacher_id = actor.id
      and submission.week_start = p_week_start
    for update;

    if current_submission.id is null then
      next_status := 'DIHANTAR';
      insert into public.rph_weekly_submissions (
        kod_sekolah, teacher_id, week_start, status, teacher_note, submitted_at, submitted_by
      ) values (
        p_school_code, actor.id, p_week_start, next_status, left(clean_note, 1000), now(), (select auth.uid())
      ) returning id into result_id;
    else
      if current_submission.status not in ('DRAF','PEMBETULAN') then
        raise exception 'Penghantaran ini sedang disemak atau telah disahkan';
      end if;
      next_status := case when current_submission.status = 'PEMBETULAN' then 'DIHANTAR_SEMULA' else 'DIHANTAR' end;
      update public.rph_weekly_submissions set
        status = next_status,
        teacher_note = left(clean_note, 1000),
        reviewer_note = case when next_status = 'DIHANTAR_SEMULA' then reviewer_note else null end,
        submitted_at = now(),
        submitted_by = (select auth.uid())
      where id = current_submission.id
      returning id into result_id;
      delete from public.rph_weekly_submission_items where submission_id = result_id;
    end if;

    insert into public.rph_weekly_submission_items (submission_id, rph_record_id, version_snapshot)
    select result_id, record.id, jsonb_build_object(
      'id', record.id,
      'tarikh', record.tarikh,
      'class_id', record.class_id,
      'kod_subjek', record.kod_subjek,
      'tajuk', record.tajuk,
      'standard_pembelajaran', record.standard_pembelajaran,
      'objektif', record.objektif,
      'aktiviti', record.aktiviti,
      'bbm', record.bbm,
      'pentaksiran', record.pentaksiran,
      'refleksi', record.refleksi,
      'status', record.status,
      'captured_at', now()
    )
    from public.rph_records record
    where record.kod_sekolah = p_school_code
      and record.teacher_id = actor.id
      and record.tarikh between p_week_start and p_week_start + 6
      and record.status in ('SEDIA','SELESAI');

    insert into public.rph_weekly_reviews (submission_id, actor_profile_id, action, comment)
    values (result_id, actor.id, next_status, clean_note);
    return result_id;
  end if;

  if not is_reviewer then raise exception 'Hanya Guru Besar atau pentadbir dibenarkan menyemak'; end if;

  select * into current_submission
  from public.rph_weekly_submissions submission
  where submission.kod_sekolah = p_school_code
    and submission.week_start = p_week_start
    and submission.id = p_submission_id
  for update;

  if current_submission.id is null then raise exception 'Penghantaran tidak ditemui'; end if;

  if p_next_action = 'MULA_SEMAK' then
    if current_submission.status not in ('DIHANTAR','DIHANTAR_SEMULA') then raise exception 'Penghantaran tidak boleh mula disemak'; end if;
    next_status := 'DALAM_SEMAKAN';
    update public.rph_weekly_submissions set status = next_status, review_started_at = now(), review_started_by = actor.id
    where id = current_submission.id;
  elsif p_next_action = 'PEMBETULAN' then
    if current_submission.status not in ('DIHANTAR','DIHANTAR_SEMULA','DALAM_SEMAKAN')
      or length(coalesce(clean_note, '')) < 5 then
      raise exception 'Ulasan pembetulan sekurang-kurangnya 5 aksara diperlukan';
    end if;
    next_status := 'PEMBETULAN';
    update public.rph_weekly_submissions set status = next_status, reviewer_note = clean_note,
      correction_requested_at = now(), correction_requested_by = actor.id
    where id = current_submission.id;
  elsif p_next_action = 'SAH' then
    if current_submission.status not in ('DIHANTAR','DIHANTAR_SEMULA','DALAM_SEMAKAN') then raise exception 'Penghantaran tidak boleh disahkan'; end if;
    next_status := 'DISAHKAN';
    update public.rph_weekly_submissions set status = next_status, reviewer_note = clean_note,
      verified_at = now(), verified_by = actor.id
    where id = current_submission.id;
  end if;

  insert into public.rph_weekly_reviews (submission_id, actor_profile_id, action, comment)
  values (
    current_submission.id,
    actor.id,
    case when p_next_action = 'SAH' then 'DISAHKAN' else p_next_action end,
    clean_note
  );
  return current_submission.id;
end;
$$;

revoke all on function public.transition_rph_weekly_submission(uuid, text, date, uuid, text, text) from public, anon;
grant execute on function public.transition_rph_weekly_submission(uuid, text, date, uuid, text, text) to authenticated;

create or replace function private.enforce_rph_submission_lock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid := case when tg_op = 'DELETE' then old.id else new.id end;
  active_status text;
begin
  select submission.status into active_status
  from public.rph_weekly_submission_items item
  join public.rph_weekly_submissions submission on submission.id = item.submission_id
  where item.rph_record_id = target_id
    and submission.status in ('DIHANTAR','DALAM_SEMAKAN','DIHANTAR_SEMULA','DISAHKAN')
  limit 1;
  if active_status is not null then
    raise exception 'RPH dikunci kerana penghantaran mingguan berstatus %', active_status;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.enforce_rph_submission_lock() from public, anon, authenticated;
create trigger rph_submission_content_lock
before update or delete on public.rph_records
for each row execute function private.enforce_rph_submission_lock();

create trigger rph_weekly_submissions_security_audit
after insert or update or delete on public.rph_weekly_submissions
for each row execute function private.capture_security_audit();

create trigger rph_weekly_reviews_security_audit
after insert or update or delete on public.rph_weekly_reviews
for each row execute function private.capture_security_audit();
