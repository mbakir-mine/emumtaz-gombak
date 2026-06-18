-- Baiki/seed semula rujukan komponen markah subjek gabungan.
-- Jalankan jika simpan markah komponen gagal dengan ralat foreign key mark_components.
-- Selamat dijalankan berulang kali.

insert into public.subject_components (kod_subjek, kod_komponen, nama_komponen, markah_penuh, susunan)
values
  ('TF04', 'TAUHID', 'Tauhid', 50, 1),
  ('TF04', 'FEKAH', 'Fekah', 50, 2),
  ('AS01', 'AKHLAK', 'Akhlak', 50, 1),
  ('AS01', 'SIRAH', 'Sirah', 50, 2),
  ('JIK03', 'JAWI', 'Jawi', 60, 1),
  ('JIK03', 'IMLAK', 'Imlak', 10, 2),
  ('JIK03', 'KHAT', 'Khat', 30, 3),
  ('IMLAK_KHAT', 'IMLAK', 'Imlak', 50, 1),
  ('IMLAK_KHAT', 'KHAT', 'Khat', 50, 2)
on conflict (kod_subjek, kod_komponen) do update set
  nama_komponen = excluded.nama_komponen,
  markah_penuh = excluded.markah_penuh,
  susunan = excluded.susunan,
  status = 'AKTIF',
  updated_at = now();

do $$
begin
  if to_regclass('public.subject_component_mark_settings') is not null then
    insert into public.subject_component_mark_settings
      (tahun_akademik, kod_peperiksaan, tahun, kod_subjek, kod_komponen, markah_penuh)
    select
      exam.tahun_akademik,
      exam.kod_peperiksaan,
      grade.tahun,
      component.kod_subjek,
      component.kod_komponen,
      component.markah_penuh
    from public.exams exam
    cross join (values (3), (4), (5), (6)) as grade(tahun)
    join public.subject_components component
      on component.status = 'AKTIF'
    join public.subject_grade_rules rule
      on rule.tahun = grade.tahun
     and rule.kod_subjek = component.kod_subjek
    on conflict (tahun_akademik, kod_peperiksaan, tahun, kod_subjek, kod_komponen)
    do nothing;
  end if;
end $$;
