-- Pelaporan PBD berasaskan pentaksiran berterusan.
-- PBD tidak mengambil markah UPSA/UASA; ia disimpan sebagai evidens seperti kuiz,
-- latihan, pemerhatian, amali, projek dan lisan sepanjang tahun.

alter table public.school_module_access
  drop constraint if exists school_module_access_module_key_check;

alter table public.school_module_access
  add constraint school_module_access_module_key_check check (
    module_key in ('TAKWIM', 'KEHADIRAN_HARIAN', 'AMAL_KHAIR', 'JADUAL_WAKTU', 'RPH_AI', 'AKSES_IBU_BAPA', 'PELAPORAN_PBD')
  );

create table if not exists public.pbd_assessments (
  id uuid primary key default gen_random_uuid(),
  tahun_akademik integer not null,
  kod_sekolah text not null references public.schools(kod_sekolah) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  kod_subjek text not null references public.subjects(kod_subjek),
  jenis text not null default 'LATIHAN',
  tajuk text not null,
  tarikh date not null default current_date,
  markah_penuh numeric(6,2) not null default 100,
  pemberat numeric(6,2) not null default 1,
  status text not null default 'AKTIF',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pbd_assessments_jenis_check check (
    jenis in ('KUIZ', 'LATIHAN', 'PEMERHATIAN', 'AMALI', 'PROJEK', 'LISAN', 'LAIN')
  ),
  constraint pbd_assessments_markah_check check (markah_penuh > 0),
  constraint pbd_assessments_pemberat_check check (pemberat > 0)
);

create table if not exists public.pbd_marks (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.pbd_assessments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  markah numeric(6,2),
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, student_id)
);

create index if not exists idx_pbd_assessments_scope
  on public.pbd_assessments (tahun_akademik, kod_sekolah, class_id, kod_subjek);

create index if not exists idx_pbd_assessments_type
  on public.pbd_assessments (jenis, status);

create index if not exists idx_pbd_marks_assessment_student
  on public.pbd_marks (assessment_id, student_id);

create or replace function public.set_optional_module_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_pbd_assessments_updated_at on public.pbd_assessments;
create trigger trg_pbd_assessments_updated_at
before update on public.pbd_assessments
for each row execute function public.set_optional_module_updated_at();

drop trigger if exists trg_pbd_marks_updated_at on public.pbd_marks;
create trigger trg_pbd_marks_updated_at
before update on public.pbd_marks
for each row execute function public.set_optional_module_updated_at();
