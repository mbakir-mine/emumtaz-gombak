-- Baiki senarai kod modul yang dibenarkan selepas modul PSRA dan UPKK ditambah.
begin;

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
      'PELAPORAN_PBD',
      'PENILAIAN_UPKK',
      'KHALIFAH_MUDA',
      'PERCUBAAN_PSRA',
      'PERCUBAAN_UPKK'
    )
  );

commit;
