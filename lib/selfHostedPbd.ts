import type { ClassRecord, PbdMarkDetailRecord, School, SchoolModuleAccess, StudentRecord, SubjectRecord, TeacherSubjectAssignment, TeacherSubjectComponentAssignment } from './data';
import { getTrustedSelfHostedUrl } from './trustedSelfHostedUrl';

export type SelfHostedPbdData = { schools: School[]; classes: ClassRecord[]; students: StudentRecord[]; subjects: SubjectRecord[]; subjectAssignments: TeacherSubjectAssignment[]; componentAssignments: TeacherSubjectComponentAssignment[]; pbdMarks: PbdMarkDetailRecord[]; moduleAccesses: SchoolModuleAccess[] };
type RawPbdRow = { id: string; assessment_id: string; student_id: string; markah: number | string | null; tahap_penguasaan: number | string | null; catatan: string | null; mykid: string; student_nama: string; jantina: string | null; student_school: string; student_class: string | null; student_status: string; kod_sekolah: string; class_id: string; tahun_akademik: number | string; kod_subjek: string; teacher_id: string | null; tarikh: string; tajuk: string; instrumen: string; markah_penuh: number | string; assessment_status: string };

export async function getSelfHostedPbdData(): Promise<SelfHostedPbdData | null> {
  const baseUrl = getTrustedSelfHostedUrl();
  if (!baseUrl) return null;
  const get = async <T>(url: string): Promise<T> => {
    const response = await fetch(url, { credentials: 'include', cache: 'no-store' });
    if (!response.ok) throw new Error(`Self-hosted PBD request failed (${response.status})`);
    const payload = await response.json() as { data?: T };
    return payload.data ?? ([] as T);
  };
  const [schools, classes, studentPage, subjects, assignments, rawMarks] = await Promise.all([
    get<School[]>(`${baseUrl}/api/schools`), get<ClassRecord[]>(`${baseUrl}/api/classes`), get<{ data?: Array<StudentRecord & { nama?: string }> }>(`${baseUrl}/api/students?per_page=1000`), get<SubjectRecord[]>(`${baseUrl}/api/subjects`), get<{ subject?: TeacherSubjectAssignment[]; class?: TeacherSubjectAssignment[] }>(`${baseUrl}/api/assignments`), get<RawPbdRow[]>(`${baseUrl}/api/pbd/marks`),
  ]);
  const students = (studentPage.data ?? []).map(({ nama, ...student }) => ({ ...student, nama_murid: student.nama_murid ?? nama ?? '' }));
  const pbdMarks = rawMarks.map((row) => ({ id: row.id, assessment_id: row.assessment_id, student_id: row.student_id, markah: row.markah === null ? null : Number(row.markah), tahap_penguasaan: row.tahap_penguasaan === null ? null : Number(row.tahap_penguasaan), catatan: row.catatan, students: { id: row.student_id, mykid: row.mykid, nama_murid: row.student_nama, jantina: row.jantina, kod_sekolah: row.student_school, class_id: row.student_class, status: row.student_status }, pbd_assessments: { id: row.assessment_id, kod_sekolah: row.kod_sekolah, class_id: row.class_id, tahun_akademik: Number(row.tahun_akademik), kod_subjek: row.kod_subjek, teacher_id: row.teacher_id, tarikh: row.tarikh, tajuk: row.tajuk, instrumen: row.instrumen, markah_penuh: Number(row.markah_penuh), status: row.assessment_status } })) as PbdMarkDetailRecord[];
  return { schools, classes, students, subjects, subjectAssignments: assignments.subject ?? [], componentAssignments: [], pbdMarks, moduleAccesses: [] };
}
