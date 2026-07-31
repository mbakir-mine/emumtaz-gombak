export const optionalSchoolModules = [
  {
    key: 'TAKWIM',
    navKey: 'calendar',
    label: 'Takwim',
    shortLabel: 'Takwim',
    description: 'Kalendar akademik, cuti, peperiksaan dan aktiviti sekolah.',
  },
  {
    key: 'KEHADIRAN_HARIAN',
    navKey: 'attendance',
    label: 'Kehadiran Harian',
    shortLabel: 'Kehadiran',
    description: 'Rekod kehadiran harian murid mengikut kelas.',
  },
  {
    key: 'AMAL_KHAIR',
    navKey: 'amalKhair',
    label: 'Amal Khair',
    shortLabel: 'Amal Khair',
    description: 'Mata amalan baik dan sahsiah murid.',
  },
  {
    key: 'JADUAL_WAKTU',
    navKey: 'timetable',
    label: 'Jadual Waktu',
    shortLabel: 'Jadual',
    description: 'Pembinaan jadual waktu belajar sekolah.',
  },
  {
    key: 'RPH_AI',
    navKey: 'rph',
    label: 'RPH AI',
    shortLabel: 'RPH AI',
    description: 'Bantuan AI untuk draf Rancangan Pengajaran Harian.',
  },
  {
    key: 'AKSES_IBU_BAPA',
    navKey: 'parentAccess',
    label: 'Akses Ibu Bapa',
    shortLabel: 'Ibu Bapa',
    description: 'Semakan laporan murid oleh ibu bapa mengikut sekolah yang diluluskan.',
  },
  {
    key: 'PELAPORAN_PBD',
    navKey: 'pbd',
    label: 'PBD',
    shortLabel: 'PBD',
    description: 'Kemasukan dan pelaporan PBD rasmi untuk sekolah yang diluluskan.',
  },
  {
    key: 'PENILAIAN_UPKK',
    navKey: 'upkkAssessment',
    label: 'Penilaian UPKK',
    shortLabel: 'UPKK',
    description: 'Borang UPKK Amali Solat, PCHI dan Al-Quran untuk murid Tahun 5.',
  },
  {
    key: 'PERCUBAAN_PSRA',
    navKey: 'psraTrial',
    label: 'Percubaan PSRA',
    shortLabel: 'PSRA',
    description: 'Dua peperiksaan Percubaan PSRA dengan lima kertas ujian untuk murid Tahun 6.',
  },
  {
    key: 'KHALIFAH_MUDA',
    navKey: 'khalifahMuda',
    label: 'IHAB',
    shortLabel: 'IHAB',
    description: 'Rekod tarbiah, pemerhatian sahsiah dan bimbingan murid Tahun 6.',
  },
] as const;

export type OptionalSchoolModuleKey = (typeof optionalSchoolModules)[number]['key'];
export type OptionalSchoolModuleNavKey = (typeof optionalSchoolModules)[number]['navKey'];

export function isOptionalSchoolModuleKey(value: string): value is OptionalSchoolModuleKey {
  return optionalSchoolModules.some((module) => module.key === value);
}

export function moduleKeyForNav(navKey: string) {
  return optionalSchoolModules.find((module) => module.navKey === navKey)?.key ?? null;
}
