-- KHALIFAH MUDA
-- Jalankan SQL ini sekali di Supabase sebelum mengaktifkan Modul Khalifah Muda.

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
      'KHALIFAH_MUDA'
    )
  );

create table if not exists public.khalifah_muda_records (
  id uuid primary key default gen_random_uuid(),
  kod_sekolah text not null references public.schools(kod_sekolah) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  record_date date not null default current_date,
  record_scope text not null check (record_scope in ('KELAS', 'INDIVIDU')),
  record_kind text not null check (record_kind in ('AKTIVITI_KELAS', 'POSITIF', 'BIMBINGAN')),
  domain text not null,
  indicator_key text not null,
  indicator_label text not null,
  points numeric(6,2) not null default 0,
  catatan text,
  recorded_by uuid references public.app_users(id),
  status text not null default 'AKTIF' check (status in ('AKTIF', 'DIBATALKAN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_khalifah_muda_school_class_date
  on public.khalifah_muda_records (kod_sekolah, class_id, record_date desc);

create index if not exists idx_khalifah_muda_student
  on public.khalifah_muda_records (student_id);

create index if not exists idx_khalifah_muda_kind
  on public.khalifah_muda_records (record_kind, status);
