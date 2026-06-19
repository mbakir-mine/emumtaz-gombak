-- e-Mumtaz Gombak: Pelaporan PBD.
-- PBD menggunakan aliran pemarkahan yang sama seperti UPSA/UASA:
-- 1. Rekod PBD diwujudkan dalam public.exams.
-- 2. Guru subjek mengisi markah melalui menu Pemarkahan dengan memilih PBD.
-- 3. Laporan PBD membaca data daripada public.marks.

alter table public.school_module_access
  drop constraint if exists school_module_access_module_key_check;

alter table public.school_module_access
  add constraint school_module_access_module_key_check check (
    module_key in (
      'TAKWIM',
      'KEHADIRAN_HARIAN',
      'AMAL_KHAIR',
      'JADUAL_WAKTU',
      'RPH_AI',
      'AKSES_IBU_BAPA',
      'PELAPORAN_PBD'
    )
  );

insert into public.exams (kod_peperiksaan, nama_peperiksaan, tahun_akademik, status, tarikh_mula, tarikh_tamat)
select
  'PBD',
  'Pentaksiran Bilik Darjah',
  tahun_akademik,
  'DIBUKA',
  make_date(tahun_akademik, 1, 1),
  make_date(tahun_akademik, 12, 31)
from generate_series(2026, 2031) as years(tahun_akademik)
on conflict (kod_peperiksaan, tahun_akademik)
do update set
  nama_peperiksaan = excluded.nama_peperiksaan,
  status = excluded.status,
  tarikh_mula = coalesce(exams.tarikh_mula, excluded.tarikh_mula),
  tarikh_tamat = coalesce(exams.tarikh_tamat, excluded.tarikh_tamat);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'exams'
      and column_name = 'buka_markah'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'exams'
      and column_name = 'tutup_markah'
  ) then
    execute $sql$
      update public.exams
      set
        buka_markah = coalesce(buka_markah, make_date(tahun_akademik, 1, 1)),
        tutup_markah = coalesce(tutup_markah, make_date(tahun_akademik, 12, 31))
      where kod_peperiksaan = 'PBD'
    $sql$;
  end if;
end $$;

select
  kod_peperiksaan,
  nama_peperiksaan,
  tahun_akademik,
  status,
  tarikh_mula,
  tarikh_tamat
from public.exams
where kod_peperiksaan = 'PBD'
order by tahun_akademik;
