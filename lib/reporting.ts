import type { ClassRecord, StudentSummaryRecord } from './data';

export type ClassSummaryRecord = {
  tahun_akademik: number;
  kod_peperiksaan: string;
  kod_sekolah: string;
  class_id: string;
  nama_kelas: string;
  tahun: number;
  jumlah_murid: number;
  purata_kelas: number | null;
  bil_mumtaz: number;
  bil_lulus: number;
};

export function buildClassSummaries(
  studentSummaries: StudentSummaryRecord[],
  classes: ClassRecord[],
): ClassSummaryRecord[] {
  const classById = new Map(classes.map((item) => [item.id, item]));
  const groups = new Map<string, StudentSummaryRecord[]>();

  for (const summary of studentSummaries) {
    const key = `${summary.tahun_akademik}|${summary.kod_peperiksaan}|${summary.class_id}`;
    const rows = groups.get(key) ?? [];
    rows.push(summary);
    groups.set(key, rows);
  }

  return Array.from(groups.entries())
    .map(([key, rows]) => {
      const [tahunAkademik, kodPeperiksaan, classId] = key.split('|');
      const classRecord = classById.get(classId);
      const purataValues = rows
        .map((row) => row.purata)
        .filter((value): value is number => value !== null && value !== undefined);
      const purata =
        purataValues.length > 0
          ? Number((purataValues.reduce((total, value) => total + value, 0) / purataValues.length).toFixed(2))
          : null;

      return {
        tahun_akademik: Number(tahunAkademik),
        kod_peperiksaan: kodPeperiksaan,
        kod_sekolah: classRecord?.kod_sekolah ?? rows[0]?.kod_sekolah ?? '',
        class_id: classId,
        nama_kelas: classRecord?.nama_kelas ?? 'Tiada kelas',
        tahun: classRecord?.tahun ?? 0,
        jumlah_murid: rows.length,
        purata_kelas: purata,
        bil_mumtaz: rows.filter((row) => (row.purata ?? 0) >= 90).length,
        bil_lulus: rows.filter((row) => (row.purata ?? 0) >= 40).length,
      };
    })
    .sort((a, b) => b.tahun_akademik - a.tahun_akademik || a.kod_sekolah.localeCompare(b.kod_sekolah));
}
