-- HAD AKSES BACA LAPORAN PERCUBAAN PSRA MENGIKUT TUGASAN GURU
-- Admin sekolah melihat semua kelas; guru kelas melihat kelasnya;
-- guru subjek hanya melihat kertas yang ditugaskan.

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
