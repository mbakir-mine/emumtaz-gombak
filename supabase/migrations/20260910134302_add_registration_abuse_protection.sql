-- Privacy-preserving, database-backed rate limiting for public registration.
-- Only keyed hashes are stored; raw IP addresses and email addresses are not retained.

create table if not exists private.registration_attempts (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  ip_hash text not null,
  email_hash text not null
);

create index if not exists registration_attempts_ip_time_idx
  on private.registration_attempts (ip_hash, created_at desc);
create index if not exists registration_attempts_email_time_idx
  on private.registration_attempts (email_hash, created_at desc);

alter table private.registration_attempts enable row level security;
revoke all on private.registration_attempts from public, anon, authenticated, service_role;

create or replace function public.consume_registration_attempt(
  request_ip_hash text,
  request_email_hash text
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  recent_ip_attempts integer;
  recent_email_attempts integer;
begin
  if request_ip_hash is null or length(request_ip_hash) <> 64
     or request_email_hash is null or length(request_email_hash) <> 64 then
    return false;
  end if;

  -- Serialize attempts from the same source so concurrent requests cannot race the limit.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(request_ip_hash, 0));

  delete from private.registration_attempts
  where created_at < pg_catalog.now() - interval '24 hours';

  select count(*) into recent_ip_attempts
  from private.registration_attempts
  where ip_hash = request_ip_hash
    and created_at >= pg_catalog.now() - interval '1 hour';

  select count(*) into recent_email_attempts
  from private.registration_attempts
  where email_hash = request_email_hash
    and created_at >= pg_catalog.now() - interval '1 hour';

  insert into private.registration_attempts (ip_hash, email_hash)
  values (request_ip_hash, request_email_hash);

  return recent_ip_attempts < 5 and recent_email_attempts < 3;
end;
$$;

revoke all on function public.consume_registration_attempt(text, text)
  from public, anon, authenticated;
grant execute on function public.consume_registration_attempt(text, text)
  to service_role;
