-- e-Mumtaz Gombak: Modul pilihan UPKK JAKIM.
-- Jalankan selepas 023_school_module_access.sql.
-- Modul ini menyimpan markah PCHI dan Amali Solat UPKK mengikut kelas dan murid.

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
      'PELAPORAN_PBD',
      'UPKK_JAKIM'
    )
  );

create table if not exists public.upkk_jakim_marks (
  id uuid primary key default gen_random_uuid(),
  tahun_akademik int not null,
  kod_sekolah text not null references public.schools(kod_sekolah) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id text not null references public.students(mykid) on delete cascade,
  assessment_type text not null check (assessment_type in ('PCHI', 'AMALI_SOLAT')),
  component_key text not null,
  component_title text not null,
  max_mark numeric not null check (max_mark > 0),
  markah numeric check (markah is null or markah >= 0),
  teacher_id uuid references public.app_users(id) on delete set null,
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tahun_akademik, class_id, student_id, assessment_type, component_key)
);

create index if not exists idx_upkk_jakim_marks_school_year
  on public.upkk_jakim_marks (kod_sekolah, tahun_akademik, class_id);

create index if not exists idx_upkk_jakim_marks_student
  on public.upkk_jakim_marks (student_id);

create index if not exists idx_upkk_jakim_marks_type
  on public.upkk_jakim_marks (assessment_type, component_key);

create table if not exists public.upkk_jakim_item_marks (
  id uuid primary key default gen_random_uuid(),
  tahun_akademik int not null,
  kod_sekolah text not null references public.schools(kod_sekolah) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id text not null references public.students(mykid) on delete cascade,
  assessment_type text not null check (assessment_type in ('PCHI', 'AMALI_SOLAT')),
  component_key text not null,
  component_title text not null,
  item_key text not null,
  item_number text not null,
  item_title text not null,
  max_mark numeric not null check (max_mark > 0),
  markah numeric check (markah is null or markah >= 0),
  teacher_id uuid references public.app_users(id) on delete set null,
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tahun_akademik, class_id, student_id, assessment_type, item_key)
);

create index if not exists idx_upkk_jakim_item_marks_school_year
  on public.upkk_jakim_item_marks (kod_sekolah, tahun_akademik, class_id);

create index if not exists idx_upkk_jakim_item_marks_student
  on public.upkk_jakim_item_marks (student_id, assessment_type);

create index if not exists idx_upkk_jakim_item_marks_component
  on public.upkk_jakim_item_marks (assessment_type, component_key, item_key);

create or replace function public.set_optional_module_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_upkk_jakim_marks_updated_at on public.upkk_jakim_marks;

create trigger trg_upkk_jakim_marks_updated_at
before update on public.upkk_jakim_marks
for each row execute function public.set_optional_module_updated_at();

drop trigger if exists trg_upkk_jakim_item_marks_updated_at on public.upkk_jakim_item_marks;

create trigger trg_upkk_jakim_item_marks_updated_at
before update on public.upkk_jakim_item_marks
for each row execute function public.set_optional_module_updated_at();

select 'upkk_jakim_marks dan upkk_jakim_item_marks telah disediakan' as status;
