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
    navKey: 'reportPbd',
    label: 'Pelaporan PBD',
    shortLabel: 'PBD',
    description: 'Pelaporan PBD rasmi mengikut format JAIS untuk sekolah yang diluluskan.',
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
