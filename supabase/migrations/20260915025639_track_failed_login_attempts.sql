-- Privacy-preserving failed-login monitoring. Raw email addresses, IP addresses
-- and full user-agent strings are deliberately not stored.

create table public.auth_login_failure_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  identifier_hash text not null check (length(identifier_hash) = 64),
  network_hash text check (network_hash is null or length(network_hash) = 64),
  device_family text not null check (device_family in ('MOBILE', 'TABLET', 'DESKTOP', 'UNKNOWN'))
);

create index auth_login_failure_logs_created_at_idx
  on public.auth_login_failure_logs (created_at desc);
create index auth_login_failure_logs_identifier_idx
  on public.auth_login_failure_logs (identifier_hash, created_at desc);

alter table public.auth_login_failure_logs enable row level security;
revoke all on table public.auth_login_failure_logs from public, anon, authenticated;
grant select on table public.auth_login_failure_logs to authenticated;
grant all on table public.auth_login_failure_logs to service_role;
grant usage, select on sequence public.auth_login_failure_logs_id_seq to service_role;

create policy auth_login_failure_logs_owner_read on public.auth_login_failure_logs
  for select to authenticated
  using ((select private.can_read_security_audit()));
