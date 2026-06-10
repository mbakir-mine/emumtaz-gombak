export const optionalSchoolModules = [
  {
    key: 'KEHADIRAN_HARIAN',
    label: 'Kehadiran Harian',
    shortLabel: 'Kehadiran',
    description: 'Rekod kehadiran harian murid mengikut kelas.',
  },
  {
    key: 'AMAL_KHAIR',
    label: 'Amal Khair',
    shortLabel: 'Amal Khair',
    description: 'Mata amalan baik dan sahsiah murid.',
  },
  {
    key: 'JADUAL_WAKTU',
    label: 'Jadual Waktu',
    shortLabel: 'Jadual',
    description: 'Pembinaan jadual waktu belajar sekolah.',
  },
  {
    key: 'RPH_AI',
    label: 'RPH AI',
    shortLabel: 'RPH AI',
    description: 'Bantuan AI untuk draf Rancangan Pengajaran Harian.',
  },
] as const;

export type OptionalSchoolModuleKey = (typeof optionalSchoolModules)[number]['key'];

export function isOptionalSchoolModuleKey(value: string): value is OptionalSchoolModuleKey {
  return optionalSchoolModules.some((module) => module.key === value);
}
