-- PERCUBAAN PSRA
-- Dua sesi peperiksaan untuk murid Tahun 6, lima kertas dan jumlah 500 markah.

alter table public.school_module_access
  drop constraint if exists school_module_access_module_key_check;

alter table public.school_module_access
  add constraint school_module_access_module_key_check check (
    module_key in (
      'TAKWIM',
      'KEHADIRAN_HARIAN',
      'AMAL_KHAIR',
      'JADUAL_WAKTU',
      'RPH_AI',
      'AKSES_IBU_BAPA',
      'PELAPORAN_PBD',
      'PENILAIAN_UPKK',
      'KHALIFAH_MUDA',
      'PERCUBAAN_PSRA'
    )
  );

create table if not exists public.psra_trial_marks (
  id uuid primary key default gen_random_uuid(),
  kod_sekolah text not null references public.schools(kod_sekolah) on delete cascade,
  tahun_akademik integer not null,
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  sesi smallint not null check (sesi in (1, 2)),
  akhlak_sirah numeric(5,2) not null check (akhlak_sirah between 0 and 100),
  bahasa_arab numeric(5,2) not null check (bahasa_arab between 0 and 100),
  jawi_imlak_khat numeric(5,2) not null check (jawi_imlak_khat between 0 and 100),
  tauhid_fekah numeric(5,2) not null check (tauhid_fekah between 0 and 100),
  tajwid numeric(5,2) not null check (tajwid between 0 and 100),
  jumlah numeric(6,2) generated always as (
    akhlak_sirah + bahasa_arab + jawi_imlak_khat + tauhid_fekah + tajwid
  ) stored,
  peratus numeric(5,2) generated always as (
    (akhlak_sirah + bahasa_arab + jawi_imlak_khat + tauhid_fekah + tajwid) / 5
  ) stored,
  gred text generated always as (
    case
      when (akhlak_sirah + bahasa_arab + jawi_imlak_khat + tauhid_fekah + tajwid) / 5 >= 90 then 'Mumtaz'
      when (akhlak_sirah + bahasa_arab + jawi_imlak_khat + tauhid_fekah + tajwid) / 5 >= 75 then 'Jayyid Jiddan'
      when (akhlak_sirah + bahasa_arab + jawi_imlak_khat + tauhid_fekah + tajwid) / 5 >= 60 then 'Jayyid'
      when (akhlak_sirah + bahasa_arab + jawi_imlak_khat + tauhid_fekah + tajwid) / 5 >= 40 then 'Maqbul'
      else 'Musaadah'
    end
  ) stored,
  entered_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tahun_akademik, student_id, sesi)
);

create index if not exists idx_psra_trial_school_year_session
  on public.psra_trial_marks (kod_sekolah, tahun_akademik, sesi);

create index if not exists idx_psra_trial_class_session
  on public.psra_trial_marks (class_id, sesi);

alter table public.psra_trial_marks enable row level security;

revoke all on table public.psra_trial_marks from anon;
grant select, insert, update on table public.psra_trial_marks to authenticated;
grant select, insert, update, delete on table public.psra_trial_marks to service_role;

drop policy if exists "psra_select_enabled_school" on public.psra_trial_marks;
create policy "psra_select_enabled_school"
on public.psra_trial_marks
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
          au.kod_sekolah = psra_trial_marks.kod_sekolah
          and exists (
            select 1
            from public.school_module_access sma
            where sma.kod_sekolah = psra_trial_marks.kod_sekolah
              and sma.module_key = 'PERCUBAAN_PSRA'
              and sma.enabled = true
          )
        )
      )
  )
);

drop policy if exists "psra_insert_enabled_school" on public.psra_trial_marks;
create policy "psra_insert_enabled_school"
on public.psra_trial_marks
for insert
to authenticated
with check (
  entered_by = (select auth.uid())
  and exists (
    select 1
    from public.classes c
    join public.students s on s.class_id = c.id
    where c.id = psra_trial_marks.class_id
      and s.id = psra_trial_marks.student_id
      and c.tahun = 6
      and c.tahun_akademik = psra_trial_marks.tahun_akademik
      and c.kod_sekolah = psra_trial_marks.kod_sekolah
      and s.kod_sekolah = psra_trial_marks.kod_sekolah
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
          au.kod_sekolah = psra_trial_marks.kod_sekolah
          and exists (
            select 1
            from public.school_module_access sma
            where sma.kod_sekolah = psra_trial_marks.kod_sekolah
              and sma.module_key = 'PERCUBAAN_PSRA'
              and sma.enabled = true
          )
        )
      )
  )
);

drop policy if exists "psra_update_enabled_school" on public.psra_trial_marks;
create policy "psra_update_enabled_school"
on public.psra_trial_marks
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
          au.kod_sekolah = psra_trial_marks.kod_sekolah
          and exists (
            select 1
            from public.school_module_access sma
            where sma.kod_sekolah = psra_trial_marks.kod_sekolah
              and sma.module_key = 'PERCUBAAN_PSRA'
              and sma.enabled = true
          )
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.classes c
    join public.students s on s.class_id = c.id
    where c.id = psra_trial_marks.class_id
      and s.id = psra_trial_marks.student_id
      and c.tahun = 6
      and c.tahun_akademik = psra_trial_marks.tahun_akademik
      and c.kod_sekolah = psra_trial_marks.kod_sekolah
      and s.kod_sekolah = psra_trial_marks.kod_sekolah
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
          au.kod_sekolah = psra_trial_marks.kod_sekolah
          and exists (
            select 1
            from public.school_module_access sma
            where sma.kod_sekolah = psra_trial_marks.kod_sekolah
              and sma.module_key = 'PERCUBAAN_PSRA'
              and sma.enabled = true
          )
        )
      )
  )
);
