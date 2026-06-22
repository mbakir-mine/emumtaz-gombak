import type { SubjectRecord } from './data';

const canonicalSubjectCodeMap: Record<string, string> = {
  AKH: 'AKHLAK',
  SRH: 'SIRAH',
  BA: 'BAHASA_ARAB',
  JW: 'JAWI',
  IMK: 'IMLAK_KHAT',
  THD: 'TAUHID',
  FKH: 'FEKAH',
  FEQAH: 'FEKAH',
  TJW: 'TAJWID',
  TQ: 'TILAWAH',
  HF: 'HAFAZAN',
};

const fallbackSubjects: Record<string, Omit<SubjectRecord, 'kod_subjek'>> = {
  AKHLAK: { nama_subjek: 'Akhlak', markah_penuh: 100, dikira_purata: true, susunan: 1, status: 'AKTIF' },
  SIRAH: { nama_subjek: 'Sirah', markah_penuh: 100, dikira_purata: true, susunan: 2, status: 'AKTIF' },
  BAHASA_ARAB: { nama_subjek: 'Bahasa Arab', markah_penuh: 100, dikira_purata: true, susunan: 3, status: 'AKTIF' },
  JAWI: { nama_subjek: 'Jawi', markah_penuh: 100, dikira_purata: true, susunan: 4, status: 'AKTIF' },
  IMLAK_KHAT: { nama_subjek: 'Imlak dan Khat', markah_penuh: 100, dikira_purata: true, susunan: 5, status: 'AKTIF' },
  TAUHID: { nama_subjek: 'Tauhid', markah_penuh: 100, dikira_purata: true, susunan: 6, status: 'AKTIF' },
  FEKAH: { nama_subjek: 'Fekah', markah_penuh: 100, dikira_purata: true, susunan: 7, status: 'AKTIF' },
  TAJWID: { nama_subjek: 'Tajwid', markah_penuh: 100, dikira_purata: true, susunan: 8, status: 'AKTIF' },
  TILAWAH: { nama_subjek: 'Tilawah', markah_penuh: 100, dikira_purata: false, susunan: 9, status: 'AKTIF' },
  HAFAZAN: { nama_subjek: 'Hafazan', markah_penuh: 100, dikira_purata: false, susunan: 10, status: 'AKTIF' },
  AS01: { nama_subjek: 'Akhlak & Sirah', markah_penuh: 100, dikira_purata: true, susunan: 1, status: 'AKTIF' },
  BA02: { nama_subjek: 'Bahasa Arab', markah_penuh: 100, dikira_purata: true, susunan: 2, status: 'AKTIF' },
  JIK03: { nama_subjek: 'Jawi, Imlak & Khat', markah_penuh: 100, dikira_purata: true, susunan: 3, status: 'AKTIF' },
  TF04: { nama_subjek: 'Tauhid & Fekah', markah_penuh: 100, dikira_purata: true, susunan: 4, status: 'AKTIF' },
  TJ05: { nama_subjek: 'Tajwid', markah_penuh: 100, dikira_purata: true, susunan: 5, status: 'AKTIF' },
};

const lowerPrimarySubjectCodes = ['AKHLAK', 'BAHASA_ARAB', 'JAWI', 'TAUHID', 'FEKAH', 'TILAWAH', 'HAFAZAN'];
const yearThreeSubjectCodes = [
  'AKHLAK',
  'SIRAH',
  'BAHASA_ARAB',
  'JAWI',
  'IMLAK_KHAT',
  'TAUHID',
  'FEKAH',
  'TAJWID',
  'TILAWAH',
  'HAFAZAN',
];
const upperPrimarySubjectCodes = ['AS01', 'BA02', 'JIK03', 'TF04', 'TJ05', 'TILAWAH', 'HAFAZAN'];
const officialGradeScale = [
  { name: 'Mumtaz', short: 'MM', min: 90, max: 100, point: 1 },
  { name: 'Jayyid Jiddan', short: 'JJ', min: 75, max: 89.99, point: 2 },
  { name: 'Jayyid', short: 'J', min: 60, max: 74.99, point: 3 },
  { name: 'Maqbul', short: 'M', min: 40, max: 59.99, point: 4 },
  { name: 'Musaadah', short: 'Ms', min: 0, max: 39.99, point: 5 },
];

export const officialGradeRows = officialGradeScale.map((grade) => grade.name);

export function canonicalSubjectCode(kodSubjek: string) {
  return canonicalSubjectCodeMap[kodSubjek] ?? kodSubjek;
}

export function subjectAliasCodes(kodSubjek: string) {
  const canonical = canonicalSubjectCode(kodSubjek);
  return Array.from(
    new Set([
      kodSubjek,
      canonical,
      ...Object.entries(canonicalSubjectCodeMap)
        .filter(([, mapped]) => mapped === canonical)
        .map(([alias]) => alias),
    ]),
  );
}

export function fallbackSubjectForCode(kodSubjek: string): SubjectRecord | null {
  const canonical = canonicalSubjectCode(kodSubjek);
  const fallback = fallbackSubjects[canonical];
  if (!fallback) return null;
  return {
    kod_subjek: canonical,
    ...fallback,
  };
}

export function normalizeSubjectRecord(subject: SubjectRecord): SubjectRecord {
  const canonical = canonicalSubjectCode(subject.kod_subjek);
  const fallback = fallbackSubjects[canonical];
  return {
    ...subject,
    kod_subjek: canonical,
    nama_subjek: fallback?.nama_subjek ?? subject.nama_subjek,
    susunan: fallback?.susunan ?? subject.susunan,
  };
}

export function allowedSubjectForTahun(subject: SubjectRecord, tahun: number) {
  const kodSubjek = canonicalSubjectCode(subject.kod_subjek);
  if ([1, 2].includes(tahun)) {
    return lowerPrimarySubjectCodes.includes(kodSubjek);
  }

  if (tahun === 3) {
    return yearThreeSubjectCodes.includes(kodSubjek);
  }

  return upperPrimarySubjectCodes.includes(kodSubjek);
}

export function gradeForMark(markah: number | null | undefined) {
  if (markah === null || markah === undefined || Number.isNaN(markah)) return '';
  const value = Number(markah);
  return officialGradeScale.find((grade) => value >= grade.min && value <= grade.max)?.name ?? '';
}

export function gradeShortForMark(markah: number | null | undefined) {
  const grade = gradeForMark(markah);
  return officialGradeScale.find((item) => item.name === grade)?.short ?? '';
}

export function gradePointForGrade(grade: string) {
  return officialGradeScale.find((item) => item.name === grade)?.point ?? 0;
}
