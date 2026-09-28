'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

export type TeacherSubjectActionState = { ok: boolean; message: string };
const clearTeacherValue = '__CLEAR__';
const values = (form: FormData, key: string) => form.getAll(key).map(String);

async function post(path: string, body: unknown) {
  const base = getTrustedSelfHostedUrl();
  if (!base) return { ok: false, message: 'Backend self-hosted belum dikonfigurasi.' };
  const response = await fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: (await cookies()).toString() }, body: JSON.stringify(body), cache: 'no-store' });
  const result = await response.json().catch(() => ({}));
  return response.ok ? { ok: true, message: result.message ?? '' } : { ok: false, message: result.message ?? `Permintaan gagal (${response.status}).` };
}

export async function assignTeacherSubject(_state: TeacherSubjectActionState, form: FormData): Promise<TeacherSubjectActionState> {
  const result = await post('/api/assignments/subject-teacher', { user_id: String(form.get('user_id') ?? ''), class_id: String(form.get('class_id') ?? ''), kod_subjek: String(form.get('kod_subjek') ?? '') });
  if (result.ok) revalidatePath('/guru-subjek');
  return { ok: result.ok, message: result.ok ? 'Guru subjek berjaya ditetapkan.' : result.message };
}

export async function bulkAssignTeacherClasses(_state: TeacherSubjectActionState, form: FormData): Promise<TeacherSubjectActionState> {
  const classIds = values(form, 'class_id');
  const teachers = values(form, 'teacher_id');
  let updated = 0;
  for (const [index, classId] of classIds.entries()) {
    const userId = teachers[index];
    if (!userId || userId === clearTeacherValue) continue;
    const result = await post('/api/assignments/class-teacher', { user_id: userId, class_id: classId });
    if (!result.ok) return result;
    updated++;
  }
  revalidatePath('/guru-subjek'); revalidatePath('/guru-kelas'); revalidatePath('/');
  return { ok: true, message: `${updated} guru kelas berjaya dikemaskini.` };
}

export async function bulkAssignTeacherSubjects(_state: TeacherSubjectActionState, form: FormData): Promise<TeacherSubjectActionState> {
  const classId = String(form.get('subject_class_id') ?? '').trim();
  if (!classId) return { ok: false, message: 'Pilih kelas untuk dikemaskini.' };
  const subjectCodes = values(form, 'kod_subjek');
  const teacherIds = values(form, 'subject_teacher_id');
  const labels = values(form, 'subject_assignment_label');
  const subjects = subjectCodes.map((kod_subjek, index) => ({ kod_subjek, user_id: teacherIds[index] && teacherIds[index] !== clearTeacherValue ? teacherIds[index] : null, assignment_label: labels[index] || null })).filter((row) => row.user_id);
  const componentCodes = values(form, 'component_kod_subjek');
  const componentKeys = values(form, 'component_kod_komponen');
  const componentTeachers = values(form, 'component_teacher_id');
  const components = componentCodes.map((kod_subjek, index) => ({ kod_subjek, kod_komponen: componentKeys[index] ?? '', user_id: componentTeachers[index] && componentTeachers[index] !== clearTeacherValue ? componentTeachers[index] : null })).filter((row) => row.user_id && row.kod_komponen);
  const reqCodes = values(form, 'timetable_kod_subjek');
  const reqComponents = values(form, 'timetable_kod_komponen');
  const reqTeachers = values(form, 'timetable_teacher_id');
  const reqSlots = values(form, 'timetable_bil_slot');
  const reqLabels = values(form, 'timetable_assignment_label');
  const reqNames = values(form, 'timetable_nama_paparan');
  const requirements = reqCodes.map((kod_subjek, index) => ({ kod_subjek, kod_komponen: reqComponents[index] || null, teacher_id: reqTeachers[index] && reqTeachers[index] !== clearTeacherValue ? reqTeachers[index] : null, bil_slot_seminggu: Number(reqSlots[index] || 0), assignment_label: reqLabels[index] || null, nama_paparan: reqNames[index] || null })).filter((row) => row.teacher_id && row.bil_slot_seminggu > 0);
  const result = await post('/api/assignments/bulk', { class_id: classId, subjects, components, requirements });
  if (result.ok) { revalidatePath('/guru-subjek'); revalidatePath(`/guru-subjek/${classId}`); revalidatePath('/jadual-waktu'); revalidatePath('/'); }
  return { ok: result.ok, message: result.ok ? 'Tetapan guru subjek dan Bil. Masa berjaya dikemaskini.' : result.message };
}
