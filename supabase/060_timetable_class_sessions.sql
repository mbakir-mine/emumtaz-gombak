-- Pisahkan kelas sesi pagi dan petang dalam penjanaan jadual waktu.
alter table public.classes
  add column if not exists sesi text not null default 'PAGI';

update public.classes
set sesi = 'PAGI'
where sesi is null or sesi not in ('PAGI', 'PETANG');

alter table public.classes
  drop constraint if exists classes_sesi_check;

alter table public.classes
  add constraint classes_sesi_check check (sesi in ('PAGI', 'PETANG'));

alter table public.classes
  drop constraint if exists classes_kod_sekolah_tahun_akademik_tahun_nama_kelas_key;

alter table public.classes
  add constraint classes_school_year_grade_name_session_key
  unique (kod_sekolah, tahun_akademik, tahun, nama_kelas, sesi);

create index if not exists idx_classes_school_year_session
  on public.classes (kod_sekolah, tahun_akademik, sesi, tahun);
