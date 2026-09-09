-- PENTAKSIRAN SAHSIAH IHAB (M1-M6)
-- Sumber tunggal markah rasmi untuk modul Sahsiah IHAB eMumtaz.

begin;

create table if not exists public.sahsiah_ihab_assessments (
  id uuid primary key default gen_random_uuid(),
  kod_sekolah text not null references public.schools(kod_sekolah) on delete cascade,
  tahun_akademik integer not null,
  bulan smallint not null check (bulan between 1 and 12),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  m1_confirmed boolean not null default false,
  m2_confirmed boolean not null default false,
  m3_raw smallint not null check (m3_raw between 0 and 320),
  m3_percent numeric(5,1) not null check (m3_percent between 0 and 100),
  m4 smallint not null check (m4 between 0 and 16),
  m5 smallint not null check (m5 between 0 and 100),
  m6 smallint not null check (m6 between 0 and 100),
  total_score numeric(6,1) not null,
  grade text not null,
  band smallint not null check (band between 1 and 6),
  status text not null default 'DRAF' check (status in ('DRAF','DIHANTAR','DISAHKAN','DIPULANGKAN','DIKUNCI')),
  catatan text,
  submitted_by uuid references public.app_users(id) on delete set null,
  verified_by uuid references public.app_users(id) on delete set null,
  submitted_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kod_sekolah, tahun_akademik, bulan, student_id)
);

create index if not exists idx_sahsiah_ihab_assessment_school_period
  on public.sahsiah_ihab_assessments (kod_sekolah, tahun_akademik, bulan, status);
create index if not exists idx_sahsiah_ihab_assessment_class
  on public.sahsiah_ihab_assessments (class_id, tahun_akademik, bulan);
create index if not exists idx_sahsiah_ihab_assessment_student
  on public.sahsiah_ihab_assessments (student_id, tahun_akademik, bulan);

create or replace function public.set_sahsiah_ihab_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_sahsiah_ihab_updated_at on public.sahsiah_ihab_assessments;
create trigger trg_sahsiah_ihab_updated_at
before update on public.sahsiah_ihab_assessments
for each row execute function public.set_sahsiah_ihab_updated_at();

alter table public.sahsiah_ihab_assessments enable row level security;
revoke all on table public.sahsiah_ihab_assessments from anon, authenticated;
grant select, insert, update on table public.sahsiah_ihab_assessments to authenticated;
grant all on table public.sahsiah_ihab_assessments to service_role;

create or replace function public.can_access_sahsiah_ihab_school(target_school_code text)
returns boolean language sql stable security invoker set search_path = public as $$
  select exists (
    select 1 from public.app_users au
    where au.status = 'AKTIF'
      and (au.auth_user_id = (select auth.uid())
        or lower(au.email) = lower(coalesce((select auth.jwt() ->> 'email'), '')))
      and (au.role = 'OWNER'
        or (au.role in ('ADMIN_DAERAH') and au.daerah = (select s.daerah from public.schools s where s.kod_sekolah = target_school_code)
          and exists (
            select 1 from public.school_module_access sma
            where sma.kod_sekolah = target_school_code and sma.module_key = 'KHALIFAH_MUDA' and sma.enabled = true
          ))
        or (au.kod_sekolah = target_school_code and exists (
          select 1 from public.school_module_access sma
          where sma.kod_sekolah = target_school_code and sma.module_key = 'KHALIFAH_MUDA' and sma.enabled = true
        )))
  );
$$;

revoke all on function public.can_access_sahsiah_ihab_school(text) from public;
grant execute on function public.can_access_sahsiah_ihab_school(text) to authenticated, service_role;

drop policy if exists sahsiah_ihab_select on public.sahsiah_ihab_assessments;
create policy sahsiah_ihab_select on public.sahsiah_ihab_assessments
for select to authenticated using (public.can_access_sahsiah_ihab_school(kod_sekolah));

drop policy if exists sahsiah_ihab_insert on public.sahsiah_ihab_assessments;
create policy sahsiah_ihab_insert on public.sahsiah_ihab_assessments
for insert to authenticated with check (public.can_access_sahsiah_ihab_school(kod_sekolah));

drop policy if exists sahsiah_ihab_update on public.sahsiah_ihab_assessments;
create policy sahsiah_ihab_update on public.sahsiah_ihab_assessments
for update to authenticated using (public.can_access_sahsiah_ihab_school(kod_sekolah))
with check (public.can_access_sahsiah_ihab_school(kod_sekolah));

commit;
