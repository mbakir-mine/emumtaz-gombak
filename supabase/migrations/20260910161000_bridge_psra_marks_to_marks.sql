-- Salin markah PSRA sedia ada ke jadual markah utama.
-- Ini membolehkan Menu Pemarkahan membaca markah yang telah dimasukkan
-- melalui Modul PSRA tanpa membuka jadual PSRA kepada pengguna awam.

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
  paper.kod_subjek,
  paper.markah,
  now()
from public.psra_trial_marks p
join public.exams e
  on e.kod_peperiksaan = 'PSRA' || p.sesi::text
 and e.tahun_akademik = p.tahun_akademik
cross join lateral (
  values
    ('AS01'::text, p.akhlak_sirah),
    ('BA02'::text, p.bahasa_arab),
    ('JIK03'::text, p.jawi_imlak_khat),
    ('TF04'::text, p.tauhid_fekah),
    ('TJ05'::text, p.tajwid)
) as paper(kod_subjek, markah)
where paper.markah is not null
on conflict (exam_id, student_id, kod_subjek) do update
set markah = excluded.markah,
    updated_at = now();
