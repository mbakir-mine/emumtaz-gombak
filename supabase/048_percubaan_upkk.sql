-- PERCUBAAN UPKK BERTULIS - Tahun 5, enam kertas, gred khusus sekolah.

alter table public.school_module_access drop constraint if exists school_module_access_module_key_check;
alter table public.school_module_access add constraint school_module_access_module_key_check check (
  module_key in ('TAKWIM','KEHADIRAN_HARIAN','AMAL_KHAIR','JADUAL_WAKTU','RPH_AI','AKSES_IBU_BAPA','PELAPORAN_PBD','PENILAIAN_UPKK','KHALIFAH_MUDA','PERCUBAAN_PSRA','PERCUBAAN_UPKK')
);

create table if not exists public.upkk_trial_grade_settings (
  kod_sekolah text primary key references public.schools(kod_sekolah) on delete cascade,
  grade_a_min smallint not null default 85,
  grade_b_min smallint not null default 65,
  grade_c_min smallint not null default 45,
  updated_by uuid default auth.uid(),
  updated_at timestamptz not null default now(),
  constraint upkk_grade_ranges_valid check (grade_a_min <= 100 and grade_a_min > grade_b_min and grade_b_min > grade_c_min and grade_c_min > 0)
);

create table if not exists public.upkk_trial_paper_marks (
  id uuid primary key default gen_random_uuid(),
  kod_sekolah text not null references public.schools(kod_sekolah) on delete cascade,
  tahun_akademik integer not null,
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  paper_code text not null check (paper_code in ('UPKK02','UPKK03','UPKK04','UPKK05','UPKK06','UPKK07')),
  markah smallint not null check (markah between 0 and 100),
  entered_by uuid not null default auth.uid(),
  updated_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tahun_akademik, student_id, paper_code)
);

create index if not exists idx_upkk_trial_school_year on public.upkk_trial_paper_marks (kod_sekolah, tahun_akademik);
create index if not exists idx_upkk_trial_class on public.upkk_trial_paper_marks (class_id);
create index if not exists idx_upkk_trial_student on public.upkk_trial_paper_marks (student_id);

alter table public.upkk_trial_grade_settings enable row level security;
alter table public.upkk_trial_paper_marks enable row level security;
revoke all on public.upkk_trial_grade_settings, public.upkk_trial_paper_marks from anon, authenticated;
grant select, insert, update on public.upkk_trial_grade_settings to authenticated;
grant select, insert, update on public.upkk_trial_paper_marks to authenticated;
grant all on public.upkk_trial_grade_settings, public.upkk_trial_paper_marks to service_role;

create or replace function public.upkk_trial_school_allowed(target_school text)
returns boolean language sql stable security invoker set search_path = public as $$
  select exists (
    select 1 from public.app_users au
    where (au.auth_user_id = (select auth.uid()) or lower(au.email) = lower(coalesce((select auth.jwt() ->> 'email'), '')))
      and au.status = 'AKTIF'
      and (
        au.role = 'OWNER'
        or (au.kod_sekolah = target_school and exists (select 1 from public.school_module_access sma where sma.kod_sekolah = target_school and sma.module_key = 'PERCUBAAN_UPKK' and sma.enabled))
        or (au.role = 'ADMIN_DAERAH' and au.daerah = (select s.daerah from public.schools s where s.kod_sekolah = target_school) and exists (select 1 from public.school_module_access sma where sma.kod_sekolah = target_school and sma.module_key = 'PERCUBAAN_UPKK' and sma.enabled))
      )
  );
$$;

drop policy if exists "upkk_grades_select" on public.upkk_trial_grade_settings;
create policy "upkk_grades_select" on public.upkk_trial_grade_settings for select to authenticated using (public.upkk_trial_school_allowed(upkk_trial_grade_settings.kod_sekolah));
drop policy if exists "upkk_grades_insert" on public.upkk_trial_grade_settings;
create policy "upkk_grades_insert" on public.upkk_trial_grade_settings for insert to authenticated with check (public.upkk_trial_school_allowed(upkk_trial_grade_settings.kod_sekolah));
drop policy if exists "upkk_grades_update" on public.upkk_trial_grade_settings;
create policy "upkk_grades_update" on public.upkk_trial_grade_settings for update to authenticated using (public.upkk_trial_school_allowed(upkk_trial_grade_settings.kod_sekolah)) with check (public.upkk_trial_school_allowed(upkk_trial_grade_settings.kod_sekolah));

drop policy if exists "upkk_marks_select" on public.upkk_trial_paper_marks;
create policy "upkk_marks_select" on public.upkk_trial_paper_marks for select to authenticated using (public.upkk_trial_school_allowed(upkk_trial_paper_marks.kod_sekolah));
drop policy if exists "upkk_marks_insert" on public.upkk_trial_paper_marks;
create policy "upkk_marks_insert" on public.upkk_trial_paper_marks for insert to authenticated with check (
  upkk_trial_paper_marks.entered_by = (select auth.uid())
  and upkk_trial_paper_marks.updated_by = (select auth.uid())
  and public.upkk_trial_school_allowed(upkk_trial_paper_marks.kod_sekolah)
  and exists (
    select 1 from public.classes c
    join public.students s on s.class_id = c.id
    where c.id = upkk_trial_paper_marks.class_id
      and s.id = upkk_trial_paper_marks.student_id
      and c.tahun = 5
      and c.tahun_akademik = upkk_trial_paper_marks.tahun_akademik
      and c.kod_sekolah = upkk_trial_paper_marks.kod_sekolah
      and s.kod_sekolah = upkk_trial_paper_marks.kod_sekolah
      and s.status = 'AKTIF'
  )
);
drop policy if exists "upkk_marks_update" on public.upkk_trial_paper_marks;
create policy "upkk_marks_update" on public.upkk_trial_paper_marks for update to authenticated using (public.upkk_trial_school_allowed(upkk_trial_paper_marks.kod_sekolah)) with check (
  upkk_trial_paper_marks.updated_by = (select auth.uid())
  and public.upkk_trial_school_allowed(upkk_trial_paper_marks.kod_sekolah)
  and exists (
    select 1 from public.classes c
    join public.students s on s.class_id = c.id
    where c.id = upkk_trial_paper_marks.class_id
      and s.id = upkk_trial_paper_marks.student_id
      and c.tahun = 5
      and c.tahun_akademik = upkk_trial_paper_marks.tahun_akademik
      and c.kod_sekolah = upkk_trial_paper_marks.kod_sekolah
      and s.kod_sekolah = upkk_trial_paper_marks.kod_sekolah
      and s.status = 'AKTIF'
  )
);

create or replace function public.set_upkk_trial_audit() returns trigger language plpgsql security invoker set search_path = public as $$ begin new.updated_by = auth.uid(); new.updated_at = now(); return new; end; $$;
drop trigger if exists trg_upkk_trial_audit on public.upkk_trial_paper_marks;
create trigger trg_upkk_trial_audit before update on public.upkk_trial_paper_marks for each row execute function public.set_upkk_trial_audit();

insert into public.upkk_trial_grade_settings (kod_sekolah)
select s.kod_sekolah from public.schools s on conflict (kod_sekolah) do nothing;
