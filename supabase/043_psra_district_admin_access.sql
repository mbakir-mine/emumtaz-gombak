-- AKSES ADMIN DAERAH UNTUK PERCUBAAN PSRA
-- Admin daerah boleh memilih sekolah yang telah mengaktifkan modul PSRA,
-- membaca laporan dan mengurus markah semua kertas Tahun 6 sekolah tersebut.

update public.app_users
set allowed_nav = array_append(allowed_nav, 'psraTrial')
where role = 'ADMIN_DAERAH'
  and allowed_nav is not null
  and not ('psraTrial' = any(allowed_nav));

update public.app_users
set allowed_nav = array_append(allowed_nav, 'reportPsra')
where role = 'ADMIN_DAERAH'
  and allowed_nav is not null
  and not ('reportPsra' = any(allowed_nav));

drop policy if exists "psra_paper_select_district_admin" on public.psra_trial_paper_marks;
create policy "psra_paper_select_district_admin"
on public.psra_trial_paper_marks
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users au
    where au.auth_user_id = (select auth.uid())
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
    where au.auth_user_id = (select auth.uid())
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
    where au.auth_user_id = (select auth.uid())
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
    where au.auth_user_id = (select auth.uid())
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
