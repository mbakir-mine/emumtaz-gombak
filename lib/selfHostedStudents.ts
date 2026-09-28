import type { StudentRecord, StudentSchoolSummary } from './data';
import { getTrustedSelfHostedUrl } from './trustedSelfHostedUrl';

export async function getSelfHostedStudents(): Promise<{ students: StudentRecord[]; schoolSummaries: StudentSchoolSummary[] } | null> {
  const baseUrl = getTrustedSelfHostedUrl();
  if (!baseUrl) return null;
  const response = await fetch(`${baseUrl}/api/students?per_page=1000`, { credentials: 'include', cache: 'no-store' });
  if (!response.ok) throw new Error(`Self-hosted students request failed (${response.status})`);
  const payload = await response.json() as { data?: { data?: Array<StudentRecord & { nama?: string }> } };
  const rawStudents = payload.data?.data ?? [];
  const students = rawStudents.map(({ nama, ...student }) => ({ ...student, nama_murid: student.nama_murid ?? nama ?? '' }));
  const bySchool = new Map<string, StudentSchoolSummary>();
  students.forEach((student) => {
    const current = bySchool.get(student.kod_sekolah) ?? { kod_sekolah: student.kod_sekolah, nama_sekolah: student.kod_sekolah, kategori: '', zon: null, jumlah_murid: 0, murid_lelaki: 0, murid_perempuan: 0 };
    current.jumlah_murid += 1;
    if (student.jantina === 'L') current.murid_lelaki += 1;
    if (student.jantina === 'P') current.murid_perempuan += 1;
    bySchool.set(student.kod_sekolah, current);
  });
  return { students, schoolSummaries: [...bySchool.values()] };
}
