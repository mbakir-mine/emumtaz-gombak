-- Optional audit trail for student transfers between schools/classes.
-- Safe to run more than once in Supabase SQL Editor.

create table if not exists student_transfer_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  mykid text not null,
  nama_murid text not null,
  from_kod_sekolah text,
  to_kod_sekolah text not null,
  from_class_id uuid,
  to_class_id uuid not null,
  transfer_type text not null default 'DALAM_DAERAH',
  confirmed_by uuid references app_users(id),
  confirmed_at timestamptz not null default now()
);

create index if not exists idx_student_transfer_logs_student on student_transfer_logs (student_id);
create index if not exists idx_student_transfer_logs_mykid on student_transfer_logs (mykid);
create index if not exists idx_student_transfer_logs_school on student_transfer_logs (from_kod_sekolah, to_kod_sekolah);
