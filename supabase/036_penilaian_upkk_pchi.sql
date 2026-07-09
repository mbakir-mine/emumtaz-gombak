-- PENILAIAN UPKK - PCHI
-- Jalankan SQL ini sekali di Supabase sebelum menggunakan UPKK - PCHI.

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
      'PENILAIAN_UPKK'
    )
  );

create table if not exists public.upkk_pchi_marks (
  id uuid primary key default gen_random_uuid(),
  kod_sekolah text not null references public.schools(kod_sekolah) on delete cascade,
  tahun_akademik integer not null,
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id text not null references public.students(mykid) on delete cascade,
  scores jsonb not null default '{}'::jsonb,
  jumlah numeric(6,2) not null default 0,
  status text not null default 'DRAF' check (status in ('DRAF', 'LENGKAP')),
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tahun_akademik, student_id)
);

create index if not exists idx_upkk_pchi_school_year
  on public.upkk_pchi_marks (kod_sekolah, tahun_akademik);

create index if not exists idx_upkk_pchi_class
  on public.upkk_pchi_marks (class_id);

create index if not exists idx_upkk_pchi_student
  on public.upkk_pchi_marks (student_id);
