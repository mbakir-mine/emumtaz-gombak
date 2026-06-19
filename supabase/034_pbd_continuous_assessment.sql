-- e-Mumtaz Gombak: Modul PBD berasingan.
-- PBD tidak lagi dimasukkan sebagai peperiksaan UPSA/UASA.
-- Guru subjek mengisi rekod PBD melalui jadual khusus pbd_assessments dan pbd_marks.

alter table public.school_module_access
  drop constraint if exists school_module_access_module_key_check;

alter table public.school_module_access
  add constraint school_module_access_module_key_check
  check (
    module_key in (
      'TAKWIM',
      'KEHADIRAN_HARIAN',
      'AMAL_KHAIR',
      'JADUAL_WAKTU',
      'RPH_AI',
      'AKSES_IBU_BAPA',
      'PELAPORAN_PBD'
    )
  );

create table if not exists public.pbd_assessments (
  id uuid primary key default gen_random_uuid(),
  kod_sekolah text not null references public.schools(kod_sekolah) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  tahun_akademik int not null,
  kod_subjek text not null references public.subjects(kod_subjek),
  teacher_id uuid references public.app_users(id) on delete set null,
  tarikh date not null default current_date,
  tajuk text not null default 'Penilaian PBD',
  instrumen text not null default 'Pemerhatian',
  markah_penuh numeric not null default 100 check (markah_penuh > 0),
  status text not null default 'AKTIF',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, kod_subjek, tarikh, tajuk, instrumen)
);

create table if not exists public.pbd_marks (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.pbd_assessments(id) on delete cascade,
  student_id text not null references public.students(mykid) on delete cascade,
  markah numeric,
  tahap_penguasaan int check (tahap_penguasaan is null or tahap_penguasaan between 1 and 6),
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, student_id)
);

create index if not exists idx_pbd_assessments_school_year
  on public.pbd_assessments (kod_sekolah, tahun_akademik, class_id);

create index if not exists idx_pbd_assessments_subject
  on public.pbd_assessments (class_id, kod_subjek, tarikh);

create index if not exists idx_pbd_marks_assessment
  on public.pbd_marks (assessment_id);

create index if not exists idx_pbd_marks_student
  on public.pbd_marks (student_id);

-- Bersihkan rekod PBD lama dalam exams hanya jika belum ada markah yang bergantung padanya.
delete from public.exams exam
where exam.kod_peperiksaan = 'PBD'
  and not exists (
    select 1
    from public.marks mark
    where mark.exam_id = exam.id
  );

select 'pbd_assessments dan pbd_marks telah disediakan' as status;
