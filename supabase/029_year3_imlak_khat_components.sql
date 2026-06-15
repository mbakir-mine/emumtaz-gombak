-- Pecahan guru dan markah untuk subjek Tahun 3: Imlak dan Khat.
-- Jalankan selepas 026_subject_mark_components.sql dan 027_subject_component_mark_settings.sql.

insert into public.subject_components (kod_subjek, kod_komponen, nama_komponen, markah_penuh, susunan)
values
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
      3,
      component.kod_subjek,
      component.kod_komponen,
      component.markah_penuh
    from public.exams exam
    join public.subject_components component
      on component.kod_subjek = 'IMLAK_KHAT'
     and component.status = 'AKTIF'
    join public.subject_grade_rules rule
      on rule.tahun = 3
     and rule.kod_subjek = component.kod_subjek
    on conflict (tahun_akademik, kod_peperiksaan, tahun, kod_subjek, kod_komponen)
    do nothing;
  end if;
end $$;
