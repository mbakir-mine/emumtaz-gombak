-- KEMASUKAN MARKAH PSRA MENGIKUT TUGASAN GURU
-- Satu rekod bagi setiap murid, sesi dan kertas supaya guru subjek tidak menimpa kertas guru lain.

create table if not exists public.psra_trial_paper_marks (
  id uuid primary key default gen_random_uuid(),
  kod_sekolah text not null references public.schools(kod_sekolah) on delete cascade,
  tahun_akademik integer not null,
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  sesi smallint not null check (sesi in (1, 2)),
  paper_code text not null check (paper_code in ('AS01', 'BA02', 'JIK03', 'TF04', 'TJ05')),
  markah numeric(5,2) not null check (markah between 0 and 100),
  entered_by uuid not null default auth.uid(),
  updated_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tahun_akademik, student_id, sesi, paper_code)
);

create index if not exists idx_psra_paper_school_year_session
  on public.psra_trial_paper_marks (kod_sekolah, tahun_akademik, sesi);

create index if not exists idx_psra_paper_class_session
  on public.psra_trial_paper_marks (class_id, sesi);

create index if not exists idx_psra_paper_student_session
  on public.psra_trial_paper_marks (student_id, sesi);

create or replace function public.set_psra_paper_mark_audit()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_by = auth.uid();
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_psra_paper_mark_audit on public.psra_trial_paper_marks;
create trigger trg_psra_paper_mark_audit
before update on public.psra_trial_paper_marks
for each row execute function public.set_psra_paper_mark_audit();

alter table public.psra_trial_paper_marks enable row level security;

revoke all on table public.psra_trial_paper_marks from anon;
revoke all on table public.psra_trial_paper_marks from authenticated;
grant select on table public.psra_trial_paper_marks to authenticated;
grant insert (
  kod_sekolah,
  tahun_akademik,
  class_id,
  student_id,
  sesi,
  paper_code,
  markah
) on table public.psra_trial_paper_marks to authenticated;
grant update (markah, updated_at) on table public.psra_trial_paper_marks to authenticated;
grant select, insert, update, delete on table public.psra_trial_paper_marks to service_role;

drop policy if exists "psra_paper_select_school" on public.psra_trial_paper_marks;
create policy "psra_paper_select_school"
on public.psra_trial_paper_marks
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users au
    where au.auth_user_id = (select auth.uid())
      and au.status = 'AKTIF'
      and (
        au.role = 'OWNER'
        or (
          au.kod_sekolah = psra_trial_paper_marks.kod_sekolah
          and exists (
            select 1
            from public.school_module_access sma
            where sma.kod_sekolah = psra_trial_paper_marks.kod_sekolah
              and sma.module_key = 'PERCUBAAN_PSRA'
              and sma.enabled = true
          )
        )
      )
  )
);

drop policy if exists "psra_paper_insert_assigned_teacher" on public.psra_trial_paper_marks;
create policy "psra_paper_insert_assigned_teacher"
on public.psra_trial_paper_marks
for insert
to authenticated
with check (
  entered_by = (select auth.uid())
  and updated_by = (select auth.uid())
  and exists (
    select 1
    from public.classes c
    join public.students s on s.class_id = c.id
    where c.id = psra_trial_paper_marks.class_id
      and s.id = psra_trial_paper_marks.student_id
      and c.tahun = 6
      and c.tahun_akademik = psra_trial_paper_marks.tahun_akademik
      and c.kod_sekolah = psra_trial_paper_marks.kod_sekolah
      and s.kod_sekolah = psra_trial_paper_marks.kod_sekolah
      and s.status = 'AKTIF'
  )
  and exists (
    select 1
    from public.app_users au
    where au.auth_user_id = (select auth.uid())
      and au.status = 'AKTIF'
      and (
        au.role = 'OWNER'
        or (
          au.kod_sekolah = psra_trial_paper_marks.kod_sekolah
          and exists (
            select 1
            from public.school_module_access sma
            where sma.kod_sekolah = psra_trial_paper_marks.kod_sekolah
              and sma.module_key = 'PERCUBAAN_PSRA'
              and sma.enabled = true
          )
          and (
            au.role = 'ADMIN_SEKOLAH'
            or exists (
              select 1
              from public.teacher_class_assignments tca
              where tca.user_id = au.id
                and tca.class_id = psra_trial_paper_marks.class_id
            )
            or exists (
              select 1
              from public.teacher_subject_assignments tsa
              where tsa.user_id = au.id
                and tsa.class_id = psra_trial_paper_marks.class_id
                and tsa.kod_subjek = psra_trial_paper_marks.paper_code
            )
          )
        )
      )
  )
);

drop policy if exists "psra_paper_update_assigned_teacher" on public.psra_trial_paper_marks;
create policy "psra_paper_update_assigned_teacher"
on public.psra_trial_paper_marks
for update
to authenticated
using (
  exists (
    select 1
    from public.app_users au
    where au.auth_user_id = (select auth.uid())
      and au.status = 'AKTIF'
      and (
        au.role = 'OWNER'
        or (
          au.kod_sekolah = psra_trial_paper_marks.kod_sekolah
          and exists (
            select 1
            from public.school_module_access sma
            where sma.kod_sekolah = psra_trial_paper_marks.kod_sekolah
              and sma.module_key = 'PERCUBAAN_PSRA'
              and sma.enabled = true
          )
          and (
            au.role = 'ADMIN_SEKOLAH'
            or exists (
              select 1
              from public.teacher_class_assignments tca
              where tca.user_id = au.id
                and tca.class_id = psra_trial_paper_marks.class_id
            )
            or exists (
              select 1
              from public.teacher_subject_assignments tsa
              where tsa.user_id = au.id
                and tsa.class_id = psra_trial_paper_marks.class_id
                and tsa.kod_subjek = psra_trial_paper_marks.paper_code
            )
          )
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.app_users au
    where au.auth_user_id = (select auth.uid())
      and au.status = 'AKTIF'
      and (
        au.role = 'OWNER'
        or (
          au.kod_sekolah = psra_trial_paper_marks.kod_sekolah
          and exists (
            select 1
            from public.school_module_access sma
            where sma.kod_sekolah = psra_trial_paper_marks.kod_sekolah
              and sma.module_key = 'PERCUBAAN_PSRA'
              and sma.enabled = true
          )
          and (
            au.role = 'ADMIN_SEKOLAH'
            or exists (
              select 1
              from public.teacher_class_assignments tca
              where tca.user_id = au.id
                and tca.class_id = psra_trial_paper_marks.class_id
            )
            or exists (
              select 1
              from public.teacher_subject_assignments tsa
              where tsa.user_id = au.id
                and tsa.class_id = psra_trial_paper_marks.class_id
                and tsa.kod_subjek = psra_trial_paper_marks.paper_code
            )
          )
        )
      )
  )
);

-- Salin markah daripada struktur awal jika sudah pernah digunakan.
insert into public.psra_trial_paper_marks (
  kod_sekolah,
  tahun_akademik,
  class_id,
  student_id,
  sesi,
  paper_code,
  markah,
  entered_by,
  updated_by,
  created_at,
  updated_at
)
select source.kod_sekolah, source.tahun_akademik, source.class_id, source.student_id,
       source.sesi, source.paper_code, source.markah, source.entered_by,
       source.entered_by, source.created_at, source.updated_at
from (
  select kod_sekolah, tahun_akademik, class_id, student_id, sesi, 'AS01'::text as paper_code,
         akhlak_sirah as markah, entered_by, created_at, updated_at from public.psra_trial_marks
  union all
  select kod_sekolah, tahun_akademik, class_id, student_id, sesi, 'BA02',
         bahasa_arab, entered_by, created_at, updated_at from public.psra_trial_marks
  union all
  select kod_sekolah, tahun_akademik, class_id, student_id, sesi, 'JIK03',
         jawi_imlak_khat, entered_by, created_at, updated_at from public.psra_trial_marks
  union all
  select kod_sekolah, tahun_akademik, class_id, student_id, sesi, 'TF04',
         tauhid_fekah, entered_by, created_at, updated_at from public.psra_trial_marks
  union all
  select kod_sekolah, tahun_akademik, class_id, student_id, sesi, 'TJ05',
         tajwid, entered_by, created_at, updated_at from public.psra_trial_marks
) source
on conflict (tahun_akademik, student_id, sesi, paper_code) do nothing;

-- Struktur awal tidak lagi boleh ditulis oleh klien selepas migrasi ke rekod per kertas.
revoke all on table public.psra_trial_marks from authenticated;
drop policy if exists "psra_select_enabled_school" on public.psra_trial_marks;
drop policy if exists "psra_insert_enabled_school" on public.psra_trial_marks;
drop policy if exists "psra_update_enabled_school" on public.psra_trial_marks;
