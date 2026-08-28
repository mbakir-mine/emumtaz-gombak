-- Pastikan kemasukan markah pelajar tidak menerima perpuluhan.
-- NOT VALID digunakan supaya rekod lama boleh dibersihkan berasingan tanpa menghalang constraint untuk rekod baharu.

alter table public.marks
  drop constraint if exists marks_markah_whole_number_check;

alter table public.marks
  add constraint marks_markah_whole_number_check
  check (markah is null or markah = trunc(markah)) not valid;

alter table public.mark_components
  drop constraint if exists mark_components_markah_whole_number_check;

alter table public.mark_components
  add constraint mark_components_markah_whole_number_check
  check (markah is null or markah = trunc(markah)) not valid;

alter table public.psra_trial_paper_marks
  drop constraint if exists psra_trial_paper_marks_markah_whole_number_check;

alter table public.psra_trial_paper_marks
  add constraint psra_trial_paper_marks_markah_whole_number_check
  check (markah = trunc(markah)) not valid;
