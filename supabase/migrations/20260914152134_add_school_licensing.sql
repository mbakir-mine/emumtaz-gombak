-- Commercial licensing per school. Schools without a row remain on legacy access
-- so this migration can be introduced without unexpectedly locking current users.

create table if not exists public.school_licenses (
  id uuid primary key default gen_random_uuid(),
  kod_sekolah text not null unique references public.schools(kod_sekolah) on update cascade on delete cascade,
  plan_code text not null default 'ASAS' check (plan_code in ('PERCUBAAN', 'ASAS', 'PRO', 'ENTERPRISE')),
  status text not null default 'PERCUBAAN' check (status in ('PERCUBAAN', 'AKTIF', 'DIGANTUNG', 'TAMAT')),
  starts_on date not null default current_date,
  ends_on date,
  max_students integer check (max_students is null or max_students > 0),
  max_users integer check (max_users is null or max_users > 0),
  notes text check (notes is null or length(notes) <= 1000),
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);

create index if not exists school_licenses_status_end_idx
  on public.school_licenses(status, ends_on);

alter table public.school_licenses enable row level security;
revoke all on table public.school_licenses from public, anon, authenticated;
grant select, insert, update, delete on table public.school_licenses to authenticated;

drop policy if exists school_licenses_select on public.school_licenses;
create policy school_licenses_select on public.school_licenses
  for select to authenticated
  using (
    (select private.is_owner())
    or exists (
      select 1 from public.app_users au
      where au.status = 'AKTIF'
        and au.kod_sekolah = school_licenses.kod_sekolah
        and private.matches_current_user(au.auth_user_id, au.email)
    )
  );

drop policy if exists school_licenses_insert on public.school_licenses;
create policy school_licenses_insert on public.school_licenses
  for insert to authenticated
  with check ((select private.is_owner()));

drop policy if exists school_licenses_update on public.school_licenses;
create policy school_licenses_update on public.school_licenses
  for update to authenticated
  using ((select private.is_owner()))
  with check ((select private.is_owner()));

drop policy if exists school_licenses_delete on public.school_licenses;
create policy school_licenses_delete on public.school_licenses
  for delete to authenticated
  using ((select private.is_owner()));

create or replace function private.touch_school_license_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.touch_school_license_updated_at() from public, anon, authenticated;

drop trigger if exists school_licenses_updated_at on public.school_licenses;
create trigger school_licenses_updated_at
before update on public.school_licenses
for each row execute function private.touch_school_license_updated_at();

-- Reuse the immutable audit trail for all licence changes.
drop trigger if exists security_audit_trigger on public.school_licenses;
create trigger security_audit_trigger
after insert or update or delete on public.school_licenses
for each row execute function private.capture_security_audit();
