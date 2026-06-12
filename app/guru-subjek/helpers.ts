import type { ClassRecord, School, SubjectRecord, UserRecord } from '@/lib/data';

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

export function classLabel(item: ClassRecord) {
  return `Tahun ${item.tahun} - ${item.nama_kelas}`;
}

export function schoolLabel(school?: School) {
  if (!school) return 'Sekolah';
  return `${school.kod_sekolah} - ${school.nama_sekolah}`;
}

export function teacherOptionsForSchool(users: UserRecord[], kodSekolah: string) {
  return users.filter(
    (user) =>
      user.kod_sekolah === kodSekolah &&
      user.status === 'AKTIF' &&
      ['GURU_KELAS', 'GURU_SUBJEK'].includes(user.role),
  );
}
