-- Data asas untuk modul pilihan sekolah:
-- Kehadiran Harian, Amal Khair, Jadual Waktu dan RPH.
-- Run in Supabase SQL Editor after 023_school_module_access.sql.

create table if not exists public.daily_attendance (
  id uuid primary key default gen_random_uuid(),
  attendance_date date not null,
  student_id uuid not null references public.students(id) on delete cascade,
  kod_sekolah text not null references public.schools(kod_sekolah) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  status text not null default 'HADIR',
  catatan text,
  recorded_by uuid references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_attendance_status_check check (
    status in ('HADIR', 'TIDAK_HADIR', 'SAKIT', 'CUTI', 'LEWAT', 'AKTIVITI')
  ),
  unique (attendance_date, student_id)
);

create index if not exists idx_daily_attendance_school_date
  on public.daily_attendance (kod_sekolah, attendance_date);

create index if not exists idx_daily_attendance_class_date
  on public.daily_attendance (class_id, attendance_date);

create table if not exists public.amal_khair_categories (
  id uuid primary key default gen_random_uuid(),
  nama_kategori text not null unique,
  mata_default int not null default 5,
  status text not null default 'AKTIF',
  created_at timestamptz not null default now()
);

insert into public.amal_khair_categories (nama_kategori, mata_default, status)
values
  ('Membantu Guru', 5, 'AKTIF'),
  ('Membantu Rakan', 5, 'AKTIF'),
  ('Menjaga Kebersihan', 5, 'AKTIF'),
  ('Beradab dan Sopan', 5, 'AKTIF'),
  ('Kepimpinan', 10, 'AKTIF'),
  ('Ibadah dan Disiplin Diri', 10, 'AKTIF'),
  ('Amanah', 5, 'AKTIF'),
  ('Usaha Memperbaiki Diri', 5, 'AKTIF')
on conflict (nama_kategori) do update set
  mata_default = excluded.mata_default,
  status = excluded.status;

create table if not exists public.amal_khair_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  kod_sekolah text not null references public.schools(kod_sekolah) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  category_id uuid references public.amal_khair_categories(id),
  mata int not null default 1 check (mata > 0 and mata <= 100),
  catatan text,
  recorded_by uuid references public.app_users(id),
  recorded_at timestamptz not null default now(),
  status text not null default 'AKTIF',
  created_at timestamptz not null default now()
);

create index if not exists idx_amal_khair_records_school
  on public.amal_khair_records (kod_sekolah, recorded_at desc);

create index if not exists idx_amal_khair_records_student
  on public.amal_khair_records (student_id, recorded_at desc);

create table if not exists public.timetable_slots (
  id uuid primary key default gen_random_uuid(),
  kod_sekolah text not null references public.schools(kod_sekolah) on delete cascade,
  hari text not null,
  waktu_mula time not null,
  waktu_tamat time not null,
  label text,
  susunan int not null default 999,
  status text not null default 'AKTIF',
  created_at timestamptz not null default now(),
  constraint timetable_slots_hari_check check (
    hari in ('ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT')
  ),
  unique (kod_sekolah, hari, waktu_mula, waktu_tamat)
);

create index if not exists idx_timetable_slots_school
  on public.timetable_slots (kod_sekolah, hari, susunan);

create table if not exists public.timetable_entries (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.timetable_slots(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  kod_sekolah text not null references public.schools(kod_sekolah) on delete cascade,
  kod_subjek text references public.subjects(kod_subjek),
  teacher_id uuid references public.app_users(id) on delete set null,
  bilik text,
  status text not null default 'AKTIF',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slot_id, class_id)
);

create index if not exists idx_timetable_entries_school
  on public.timetable_entries (kod_sekolah);

create index if not exists idx_timetable_entries_class
  on public.timetable_entries (class_id);

create table if not exists public.rph_records (
  id uuid primary key default gen_random_uuid(),
  kod_sekolah text not null references public.schools(kod_sekolah) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  teacher_id uuid references public.app_users(id) on delete set null,
  kod_subjek text references public.subjects(kod_subjek),
  tarikh date not null,
  tajuk text not null,
  standard_pembelajaran text,
  objektif text,
  aktiviti text,
  bbm text,
  pentaksiran text,
  refleksi text,
  ai_prompt text,
  status text not null default 'DRAF',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rph_records_school_date
  on public.rph_records (kod_sekolah, tarikh desc);

create index if not exists idx_rph_records_teacher_date
  on public.rph_records (teacher_id, tarikh desc);

create or replace function public.set_optional_module_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_daily_attendance_updated_at on public.daily_attendance;
create trigger trg_daily_attendance_updated_at
before update on public.daily_attendance
for each row execute function public.set_optional_module_updated_at();

drop trigger if exists trg_timetable_entries_updated_at on public.timetable_entries;
create trigger trg_timetable_entries_updated_at
before update on public.timetable_entries
for each row execute function public.set_optional_module_updated_at();

drop trigger if exists trg_rph_records_updated_at on public.rph_records;
create trigger trg_rph_records_updated_at
before update on public.rph_records
for each row execute function public.set_optional_module_updated_at();
