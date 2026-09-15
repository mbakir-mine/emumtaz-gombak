create table public.parent_access_codes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  kod_sekolah text not null references public.schools(kod_sekolah) on update cascade on delete cascade,
  code_hash text not null check (code_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  status text not null default 'AKTIF' check (status in ('AKTIF','DIBATALKAN')),
  failed_attempts integer not null default 0 check (failed_attempts between 0 and 20),
  locked_until timestamptz,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parent_access_codes_expiry check (expires_at > created_at and expires_at <= created_at + interval '31 days')
);

create index parent_access_codes_student_idx
  on public.parent_access_codes (student_id, status, expires_at desc);
create index parent_access_codes_school_idx
  on public.parent_access_codes (kod_sekolah, created_at desc);

create table public.parent_access_sessions (
  id uuid primary key default gen_random_uuid(),
  access_code_id uuid not null references public.parent_access_codes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  kod_sekolah text not null references public.schools(kod_sekolah) on update cascade on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint parent_access_sessions_expiry check (expires_at > created_at and expires_at <= created_at + interval '24 hours')
);

create index parent_access_sessions_active_idx
  on public.parent_access_sessions (token_hash, expires_at) where revoked_at is null;

create table public.parent_access_events (
  id bigint generated always as identity primary key,
  kod_sekolah text,
  student_id uuid references public.students(id) on delete set null,
  event_type text not null check (event_type in ('BERJAYA','GAGAL','DIKUNCI','LOG_KELUAR')),
  identifier_hash text not null check (identifier_hash ~ '^[a-f0-9]{64}$'),
  network_hash text check (network_hash is null or network_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now()
);

create index parent_access_events_rate_idx
  on public.parent_access_events (identifier_hash, created_at desc);

alter table public.parent_access_codes enable row level security;
alter table public.parent_access_sessions enable row level security;
alter table public.parent_access_events enable row level security;

revoke all on table public.parent_access_codes, public.parent_access_sessions, public.parent_access_events from public, anon, authenticated;
grant select, insert, update on table public.parent_access_codes to authenticated;
grant all on table public.parent_access_codes, public.parent_access_sessions, public.parent_access_events to service_role;
grant usage, select on sequence public.parent_access_events_id_seq to service_role;

create policy parent_access_codes_admin_read on public.parent_access_codes
  for select to authenticated using (
    exists (
      select 1 from public.app_users au
      where au.status = 'AKTIF'
        and private.matches_current_user(au.auth_user_id, au.email)
        and au.role::text in ('OWNER','ADMIN_DAERAH','ADMIN_ZON','ADMIN_SEKOLAH')
        and (au.role::text = 'OWNER' or private.can_access_school(parent_access_codes.kod_sekolah))
    )
  );

create policy parent_access_codes_admin_insert on public.parent_access_codes
  for insert to authenticated with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.students s
      where s.id = parent_access_codes.student_id
        and s.kod_sekolah = parent_access_codes.kod_sekolah
        and s.status = 'AKTIF'
    )
    and exists (
      select 1 from public.app_users au
      where au.status = 'AKTIF'
        and private.matches_current_user(au.auth_user_id, au.email)
        and au.role::text in ('OWNER','ADMIN_DAERAH','ADMIN_ZON','ADMIN_SEKOLAH')
        and (au.role::text = 'OWNER' or private.can_access_school(parent_access_codes.kod_sekolah))
    )
  );

create policy parent_access_codes_admin_update on public.parent_access_codes
  for update to authenticated using (
    exists (
      select 1 from public.app_users au
      where au.status = 'AKTIF'
        and private.matches_current_user(au.auth_user_id, au.email)
        and au.role::text in ('OWNER','ADMIN_DAERAH','ADMIN_ZON','ADMIN_SEKOLAH')
        and (au.role::text = 'OWNER' or private.can_access_school(parent_access_codes.kod_sekolah))
    )
  ) with check (
    exists (
      select 1 from public.app_users au
      where au.status = 'AKTIF'
        and private.matches_current_user(au.auth_user_id, au.email)
        and au.role::text in ('OWNER','ADMIN_DAERAH','ADMIN_ZON','ADMIN_SEKOLAH')
        and (au.role::text = 'OWNER' or private.can_access_school(parent_access_codes.kod_sekolah))
    )
  );

create or replace function public.issue_parent_access_code(
  p_student_id uuid,
  p_school_code text,
  p_code_hash text,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare new_id uuid;
begin
  if (select auth.uid()) is null or p_code_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Permintaan tidak sah';
  end if;

  update public.parent_access_codes
  set status = 'DIBATALKAN', updated_at = now()
  where student_id = p_student_id and kod_sekolah = p_school_code and status = 'AKTIF';

  insert into public.parent_access_codes (student_id, kod_sekolah, code_hash, expires_at)
  values (p_student_id, p_school_code, p_code_hash, p_expires_at)
  returning id into new_id;
  return new_id;
end;
$$;

revoke all on function public.issue_parent_access_code(uuid,text,text,timestamptz) from public, anon;
grant execute on function public.issue_parent_access_code(uuid,text,text,timestamptz) to authenticated;

create trigger parent_access_codes_audit after insert or update or delete on public.parent_access_codes
for each row execute function private.capture_security_audit();
