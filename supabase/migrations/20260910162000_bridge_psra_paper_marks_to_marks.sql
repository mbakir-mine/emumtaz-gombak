-- Salin markah PSRA per-kertas (struktur semasa Modul PSRA)
-- ke jadual markah utama yang dibaca oleh Menu Pemarkahan.

insert into public.marks (
  exam_id,
  student_id,
  kod_sekolah,
  class_id,
  kod_subjek,
  markah,
  updated_at
)
select
  e.id,
  p.student_id,
  p.kod_sekolah,
  p.class_id,
  p.paper_code,
  p.markah,
  now()
from public.psra_trial_paper_marks p
join public.exams e
  on e.kod_peperiksaan = 'PSRA' || p.sesi::text
 and e.tahun_akademik = p.tahun_akademik
where p.markah is not null
on conflict (exam_id, student_id, kod_subjek) do update
set markah = excluded.markah,
    kod_sekolah = excluded.kod_sekolah,
    class_id = excluded.class_id,
    updated_at = now();
