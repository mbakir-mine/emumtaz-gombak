export type UpkkJakimAssessmentType = 'PCHI' | 'AMALI_SOLAT';

export type UpkkJakimComponent = {
  key: string;
  assessmentType: UpkkJakimAssessmentType;
  section: string;
  title: string;
  maxMark: number;
  sourceSheet: string;
};

export const upkkJakimComponents: UpkkJakimComponent[] = [
  {
    key: 'PCHI_A',
    assessmentType: 'PCHI',
    section: 'Bahagian A',
    title: 'Peradaban',
    maxMark: 40,
    sourceSheet: 'PCHI 1',
  },
  {
    key: 'PCHI_B',
    assessmentType: 'PCHI',
    section: 'Bahagian B',
    title: 'Penghayatan Solat',
    maxMark: 15,
    sourceSheet: 'PCHI 2',
  },
  {
    key: 'PCHI_C',
    assessmentType: 'PCHI',
    section: 'Bahagian C',
    title: 'Penghayatan Al-Quran',
    maxMark: 20,
    sourceSheet: 'PCHI 3',
  },
  {
    key: 'PCHI_D',
    assessmentType: 'PCHI',
    section: 'Bahagian D',
    title: 'Keprihatinan',
    maxMark: 25,
    sourceSheet: 'PCHI 4',
  },
  {
    key: 'AMALI_A',
    assessmentType: 'AMALI_SOLAT',
    section: 'Bahagian A',
    title: 'Persediaan Sebelum Solat',
    maxMark: 23,
    sourceSheet: 'AMALI SOLAT',
  },
  {
    key: 'AMALI_B',
    assessmentType: 'AMALI_SOLAT',
    section: 'Bahagian B',
    title: 'Perlakuan dan Bacaan Dalam Solat',
    maxMark: 62,
    sourceSheet: 'AMALI SOLAT',
  },
  {
    key: 'AMALI_C',
    assessmentType: 'AMALI_SOLAT',
    section: 'Bahagian C',
    title: 'Amalan Selepas Solat',
    maxMark: 15,
    sourceSheet: 'AMALI SOLAT',
  },
];

export const upkkJakimAssessmentOptions: { value: UpkkJakimAssessmentType; label: string; shortLabel: string }[] = [
  { value: 'PCHI', label: 'Penghayatan Cara Hidup Islam', shortLabel: 'PCHI' },
  { value: 'AMALI_SOLAT', label: 'Amali Solat', shortLabel: 'Amali Solat' },
];

export function upkkComponentsByType(type: UpkkJakimAssessmentType) {
  return upkkJakimComponents.filter((component) => component.assessmentType === type);
}

export function upkkTotalMaxMark(type: UpkkJakimAssessmentType) {
  return upkkComponentsByType(type).reduce((total, component) => total + component.maxMark, 0);
}

export function upkkAssessmentLabel(type: UpkkJakimAssessmentType) {
  return upkkJakimAssessmentOptions.find((option) => option.value === type)?.label ?? type;
}
