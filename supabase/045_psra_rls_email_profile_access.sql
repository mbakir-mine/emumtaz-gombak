-- BAIKI RLS PERCUBAAN PSRA UNTUK PROFIL YANG DIPADANKAN MELALUI EMAIL
-- UI aplikasi menerima profil app_users melalui auth_user_id atau email.
-- Polisi PSRA sebelum ini hanya semak auth_user_id, menyebabkan akaun aktif
-- yang belum dipautkan auth_user_id gagal insert/update markah.

update public.app_users au
set auth_user_id = u.id
from auth.users u
where au.auth_user_id is null
  and lower(au.email) = lower(u.email);

create or replace function public.current_app_user_matches(target_auth_user_id uuid, target_email text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select
    target_auth_user_id = (select auth.uid())
    or lower(target_email) = lower(coalesce((select auth.jwt() ->> 'email'), ''));
$$;

drop policy if exists "psra_paper_select_school" on public.psra_trial_paper_marks;
create policy "psra_paper_select_school"
on public.psra_trial_paper_marks
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users au
    where public.current_app_user_matches(au.auth_user_id, au.email)
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
    where public.current_app_user_matches(au.auth_user_id, au.email)
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
    where public.current_app_user_matches(au.auth_user_id, au.email)
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
    where public.current_app_user_matches(au.auth_user_id, au.email)
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

drop policy if exists "psra_paper_select_district_admin" on public.psra_trial_paper_marks;
create policy "psra_paper_select_district_admin"
on public.psra_trial_paper_marks
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users au
    where public.current_app_user_matches(au.auth_user_id, au.email)
      and au.status = 'AKTIF'
      and au.role = 'ADMIN_DAERAH'
  )
  and exists (
    select 1
    from public.school_module_access sma
    where sma.kod_sekolah = psra_trial_paper_marks.kod_sekolah
      and sma.module_key = 'PERCUBAAN_PSRA'
      and sma.enabled = true
  )
);

drop policy if exists "psra_paper_insert_district_admin" on public.psra_trial_paper_marks;
create policy "psra_paper_insert_district_admin"
on public.psra_trial_paper_marks
for insert
to authenticated
with check (
  entered_by = (select auth.uid())
  and updated_by = (select auth.uid())
  and exists (
    select 1
    from public.app_users au
    where public.current_app_user_matches(au.auth_user_id, au.email)
      and au.status = 'AKTIF'
      and au.role = 'ADMIN_DAERAH'
  )
  and exists (
    select 1
    from public.school_module_access sma
    where sma.kod_sekolah = psra_trial_paper_marks.kod_sekolah
      and sma.module_key = 'PERCUBAAN_PSRA'
      and sma.enabled = true
  )
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
);

drop policy if exists "psra_paper_update_district_admin" on public.psra_trial_paper_marks;
create policy "psra_paper_update_district_admin"
on public.psra_trial_paper_marks
for update
to authenticated
using (
  exists (
    select 1
    from public.app_users au
    where public.current_app_user_matches(au.auth_user_id, au.email)
      and au.status = 'AKTIF'
      and au.role = 'ADMIN_DAERAH'
  )
  and exists (
    select 1
    from public.school_module_access sma
    where sma.kod_sekolah = psra_trial_paper_marks.kod_sekolah
      and sma.module_key = 'PERCUBAAN_PSRA'
      and sma.enabled = true
  )
)
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1
    from public.app_users au
    where public.current_app_user_matches(au.auth_user_id, au.email)
      and au.status = 'AKTIF'
      and au.role = 'ADMIN_DAERAH'
  )
  and exists (
    select 1
    from public.school_module_access sma
    where sma.kod_sekolah = psra_trial_paper_marks.kod_sekolah
      and sma.module_key = 'PERCUBAAN_PSRA'
      and sma.enabled = true
  )
);
