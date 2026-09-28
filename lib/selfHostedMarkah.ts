import type { ClassRecord, ExamRecord, MarkRecord, School, SchoolModuleAccess, SubjectRecord, StudentRecord, TeacherSubjectAssignment, TeacherSubjectComponentAssignment, SubjectComponentRecord, MarkComponentRecord } from './data';
import { getTrustedSelfHostedUrl } from './trustedSelfHostedUrl';

export type SelfHostedMarkahData = {
  schools: School[];
  classes: ClassRecord[];
  exams: ExamRecord[];
  subjects: SubjectRecord[];
  students: StudentRecord[];
  marks: MarkRecord[];
  subjectComponents: SubjectComponentRecord[];
  componentMarks: MarkComponentRecord[];
  subjectAssignments: TeacherSubjectAssignment[];
  componentAssignments: TeacherSubjectComponentAssignment[];
  moduleAccesses: SchoolModuleAccess[];
};

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include', cache: 'no-store' });
  if (!response.ok) throw new Error(`Self-hosted markah request failed (${response.status})`);
  const payload = await response.json() as { data?: T };
  return payload.data ?? ([] as T);
}

export async function getSelfHostedMarkahData(examId: string, classId: string, kodSubjek: string): Promise<SelfHostedMarkahData | null> {
  const baseUrl = getTrustedSelfHostedUrl();
  if (!baseUrl) return null;
  const [schools, classes, exams, subjects, studentPage] = await Promise.all([
    getJson<School[]>(`${baseUrl}/api/schools`),
    getJson<ClassRecord[]>(`${baseUrl}/api/classes`),
    getJson<ExamRecord[]>(`${baseUrl}/api/exams`),
    getJson<SubjectRecord[]>(`${baseUrl}/api/subjects`),
    getJson<{ data?: Array<StudentRecord & { nama?: string }> }>(`${baseUrl}/api/students?per_page=1000`),
  ]);
  const students = (studentPage.data ?? []).map(({ nama, ...student }) => ({ ...student, nama_murid: student.nama_murid ?? nama ?? '' }))
    .filter((student) => !classId || student.class_id === classId);
  const marks = examId && classId && kodSubjek
    ? await getJson<MarkRecord[]>(`${baseUrl}/api/marks?exam_id=${encodeURIComponent(examId)}&class_id=${encodeURIComponent(classId)}&kod_subjek=${encodeURIComponent(kodSubjek)}`)
    : [];
  const [assignments, subjectComponents, componentMarks] = await Promise.all([
    getJson<{ class?: TeacherSubjectAssignment[]; subject?: TeacherSubjectAssignment[] }>(`${baseUrl}/api/assignments`),
    kodSubjek ? getJson<SubjectComponentRecord[]>(`${baseUrl}/api/subject-components?kod_subjek=${encodeURIComponent(kodSubjek)}`) : Promise.resolve([]),
    examId && classId && kodSubjek ? getJson<MarkComponentRecord[]>(`${baseUrl}/api/marks/components?exam_id=${encodeURIComponent(examId)}&class_id=${encodeURIComponent(classId)}&kod_subjek=${encodeURIComponent(kodSubjek)}`) : Promise.resolve([]),
  ]);
  return { schools, classes, exams, subjects, students, marks, subjectComponents, componentMarks, subjectAssignments: assignments.subject ?? [], componentAssignments: [], moduleAccesses: [] };
}
