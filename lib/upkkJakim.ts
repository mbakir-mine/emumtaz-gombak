export type UpkkJakimAssessmentType = 'PCHI' | 'AMALI_SOLAT';

export type UpkkJakimComponent = {
  key: string;
  assessmentType: UpkkJakimAssessmentType;
  section: string;
  title: string;
  maxMark: number;
  sourceSheet: string;
  formCode: string;
};

export const upkkJakimComponents: UpkkJakimComponent[] = [
  {
    key: 'PCHI_A',
    assessmentType: 'PCHI',
    section: 'Bahagian A',
    title: 'Adab',
    maxMark: 45,
    sourceSheet: 'UPKK08',
    formCode: 'UPKK08',
  },
  {
    key: 'PCHI_B',
    assessmentType: 'PCHI',
    section: 'Bahagian B',
    title: 'Ibadah',
    maxMark: 30,
    sourceSheet: 'UPKK08',
    formCode: 'UPKK08',
  },
  {
    key: 'PCHI_C',
    assessmentType: 'PCHI',
    section: 'Bahagian C',
    title: 'Akidah',
    maxMark: 25,
    sourceSheet: 'UPKK08',
    formCode: 'UPKK08',
  },
  {
    key: 'AMALI_A',
    assessmentType: 'AMALI_SOLAT',
    section: 'Bahagian A',
    title: 'Sebelum Solat',
    maxMark: 50,
    sourceSheet: 'UPKK09',
    formCode: 'UPKK09',
  },
  {
    key: 'AMALI_B',
    assessmentType: 'AMALI_SOLAT',
    section: 'Bahagian B',
    title: 'Solat',
    maxMark: 30,
    sourceSheet: 'UPKK09',
    formCode: 'UPKK09',
  },
  {
    key: 'AMALI_C',
    assessmentType: 'AMALI_SOLAT',
    section: 'Bahagian C',
    title: 'Amalan Selepas Solat',
    maxMark: 20,
    sourceSheet: 'UPKK09',
    formCode: 'UPKK09',
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

export function upkkAssessmentFormCode(type: UpkkJakimAssessmentType) {
  return type === 'PCHI' ? 'UPKK08' : 'UPKK09';
}

export function upkkAssessmentOfficialTitle(type: UpkkJakimAssessmentType) {
  return type === 'PCHI'
    ? 'Borang Penilaian Individu Penghayatan Cara Hidup Islam'
    : 'Borang Penilaian Individu Amali Solat';
}
