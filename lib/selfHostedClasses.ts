import type { ClassRecord, School, StudentRecord } from './data';
import { getTrustedSelfHostedUrl } from './trustedSelfHostedUrl';

export async function getSelfHostedClasses(): Promise<{ schools: School[]; classes: ClassRecord[]; students: StudentRecord[] } | null> {
  const baseUrl = getTrustedSelfHostedUrl();
  if (!baseUrl) return null;
  const [schoolsResponse, classesResponse, studentsResponse] = await Promise.all([
    fetch(`${baseUrl}/api/schools`, { credentials: 'include', cache: 'no-store' }),
    fetch(`${baseUrl}/api/classes`, { credentials: 'include', cache: 'no-store' }),
    fetch(`${baseUrl}/api/students?per_page=1000`, { credentials: 'include', cache: 'no-store' }),
  ]);
  if (!schoolsResponse.ok || !classesResponse.ok || !studentsResponse.ok) throw new Error('Self-hosted class request failed');
  const schools = (await schoolsResponse.json() as { data?: School[] }).data ?? [];
  const classes = (await classesResponse.json() as { data?: ClassRecord[] }).data ?? [];
  const studentPayload = await studentsResponse.json() as { data?: Array<StudentRecord & { nama?: string }> | { data?: Array<StudentRecord & { nama?: string }> } };
  const rawStudents = Array.isArray(studentPayload.data) ? studentPayload.data : (studentPayload.data?.data ?? []);
  const students = rawStudents.map(({ nama, ...student }) => ({ ...student, nama_murid: student.nama_murid ?? nama ?? '' }));
  return { schools, classes, students };
}
