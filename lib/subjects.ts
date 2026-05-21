import type { SubjectRecord } from './data';

export function allowedSubjectForTahun(subject: SubjectRecord, tahun: number) {
  if ([1, 2].includes(tahun)) {
    return ['AKHLAK', 'BAHASA_ARAB', 'JAWI', 'TAUHID', 'FEKAH', 'TILAWAH', 'HAFAZAN'].includes(
      subject.kod_subjek,
    );
  }

  if (tahun === 3) {
    return [
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
    ].includes(subject.kod_subjek);
  }

  return ['AS01', 'BA02', 'JIK03', 'TF04', 'TJ05', 'TILAWAH', 'HAFAZAN'].includes(subject.kod_subjek);
}

export function gradeForMark(markah: number | null | undefined) {
  if (markah === null || markah === undefined || Number.isNaN(markah)) return '';
  if (markah >= 90) return 'Mumtaz';
  if (markah >= 75) return 'Jayyid Jiddan';
  if (markah >= 60) return 'Jayyid';
  if (markah >= 40) return 'Maqbul';
  return "Musa'adah";
}
