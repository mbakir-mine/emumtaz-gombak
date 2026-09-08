-- DUA SESI PERCUBAAN UPKK
-- Markah sedia ada dikekalkan sebagai Percubaan UPKK 1.

begin;

alter table public.upkk_trial_paper_marks
  add column if not exists sesi smallint;

update public.upkk_trial_paper_marks
set sesi = 1
where sesi is null;

alter table public.upkk_trial_paper_marks
  alter column sesi set default 1,
  alter column sesi set not null;

alter table public.upkk_trial_paper_marks
  drop constraint if exists upkk_trial_session_check;

alter table public.upkk_trial_paper_marks
  add constraint upkk_trial_session_check check (sesi in (1, 2));

alter table public.upkk_trial_paper_marks
  drop constraint if exists upkk_trial_student_paper_unique;

alter table public.upkk_trial_paper_marks
  add constraint upkk_trial_student_paper_unique
  unique (tahun_akademik, student_id, sesi, paper_code);

drop index if exists public.idx_upkk_trial_marks_school_year;
create index idx_upkk_trial_marks_school_year
  on public.upkk_trial_paper_marks (kod_sekolah, tahun_akademik, sesi);

commit;

select
  column_name,
  data_type,
  column_default,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'upkk_trial_paper_marks'
  and column_name = 'sesi';
