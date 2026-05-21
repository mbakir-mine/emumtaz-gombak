import { hasSupabaseEnv, supabase } from './supabase';

export type SetupCounts = {
  schools: number;
  users: number;
  subjects: number;
  exams: number;
  classes: number;
  students: number;
  marks: number;
};

export type School = {
  kod_sekolah: string;
  nama_sekolah: string;
  kategori: string;
  daerah: string;
  zon: string | null;
  status: string;
};

export type ClassRecord = {
  id: string;
  kod_sekolah: string;
  tahun_akademik: number;
  tahun: number;
  nama_kelas: string;
  status: string;
};

export type StudentRecord = {
  id: string;
  mykid: string;
  nama_murid: string;
  jantina: string | null;
  kod_sekolah: string;
  class_id: string | null;
  status: string;
};

export type UserRecord = {
  id: string;
  email: string;
  nama: string;
  role: string;
  kod_sekolah: string | null;
  zon: string | null;
  status: string;
};

export type SubjectRecord = {
  kod_subjek: string;
  nama_subjek: string;
  markah_penuh: number;
  dikira_purata: boolean;
  susunan: number;
  status: string;
};

export type ExamRecord = {
  id: string;
  kod_peperiksaan: string;
  nama_peperiksaan: string;
  tahun_akademik: number;
  status: string;
};

export type MarkRecord = {
  id: string;
  exam_id: string;
  student_id: string;
  kod_sekolah: string;
  class_id: string;
  kod_subjek: string;
  markah: number | null;
};

export type StudentSummaryRecord = {
  tahun_akademik: number;
  kod_peperiksaan: string;
  kod_sekolah: string;
  class_id: string;
  student_id: string;
  mykid: string;
  nama_murid: string;
  bil_subjek_dikira: number;
  purata: number | null;
  jumlah_markah: number | null;
};

export type SchoolSummaryRecord = {
  tahun_akademik: number;
  kod_peperiksaan: string;
  kod_sekolah: string;
  jumlah_murid: number;
  purata_sekolah: number | null;
  bil_mumtaz: number;
  bil_lulus: number;
  peratus_mumtaz: number | null;
  peratus_lulus: number | null;
};

export type SubjectSummaryRecord = {
  tahun_akademik: number;
  kod_peperiksaan: string;
  kod_sekolah: string;
  class_id: string;
  kod_subjek: string;
  nama_subjek: string;
  bil_markah: number;
  purata_subjek: number | null;
  bil_lulus: number;
  bil_gagal: number;
};

export type MarkDetailRecord = {
  id: string;
  markah: number | null;
  kod_subjek: string;
  kod_sekolah: string;
  exam_id: string;
  student_id: string;
  class_id: string;
  students?: StudentRecord;
  subjects?: SubjectRecord;
  exams?: ExamRecord;
  classes?: ClassRecord;
};

export type TeacherClassAssignment = {
  id: string;
  user_id: string;
  class_id: string;
  users?: UserRecord;
  classes?: ClassRecord;
};

export type TeacherSubjectAssignment = {
  id: string;
  user_id: string;
  class_id: string;
  kod_subjek: string;
  users?: UserRecord;
  classes?: ClassRecord;
  subjects?: SubjectRecord;
};

async function countTable(table: string) {
  if (!supabase) return 0;
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function getSetupCounts(): Promise<SetupCounts> {
  if (!hasSupabaseEnv) {
    return {
      schools: 0,
      users: 0,
      subjects: 0,
      exams: 0,
      classes: 0,
      students: 0,
      marks: 0,
    };
  }

  let schools = 0;
  let users = 0;
  let subjects = 0;
  let exams = 0;
  let classes = 0;
  let students = 0;
  let marks = 0;

  try {
    [schools, users, subjects, exams, classes, students, marks] = await Promise.all([
      countTable('schools'),
      countTable('app_users'),
      countTable('subjects'),
      countTable('exams'),
      countTable('classes'),
      countTable('students'),
      countTable('marks'),
    ]);
  } catch {
    return { schools, users, subjects, exams, classes, students, marks };
  }

  return { schools, users, subjects, exams, classes, students, marks };
}

export async function getSchools(): Promise<School[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('schools')
    .select('kod_sekolah,nama_sekolah,kategori,daerah,zon,status')
    .order('kod_sekolah');

  if (error) return [];
  return data ?? [];
}

export async function getClasses(): Promise<ClassRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('classes')
    .select('id,kod_sekolah,tahun_akademik,tahun,nama_kelas,status')
    .order('kod_sekolah')
    .order('tahun')
    .order('nama_kelas');

  if (error) return [];
  return data ?? [];
}

export async function getStudents(): Promise<StudentRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('students')
    .select('id,mykid,nama_murid,jantina,kod_sekolah,class_id,status')
    .order('kod_sekolah')
    .order('nama_murid');

  if (error) return [];
  return data ?? [];
}

export async function getSchoolUsers(): Promise<UserRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('app_users')
    .select('id,email,nama,role,kod_sekolah,zon,status')
    .in('role', ['ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK'])
    .order('kod_sekolah')
    .order('role')
    .order('nama');

  if (error) return [];
  return data ?? [];
}

export async function getAllAppUsers(): Promise<UserRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('app_users')
    .select('id,email,nama,role,kod_sekolah,zon,status')
    .order('status')
    .order('kod_sekolah')
    .order('role')
    .order('nama');

  if (error) return [];
  return data ?? [];
}

export async function getTeacherClassAssignments(): Promise<TeacherClassAssignment[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('teacher_class_assignments')
    .select(
      `
      id,
      user_id,
      class_id,
      users:app_users(id,email,nama,role,kod_sekolah,status),
      classes(id,kod_sekolah,tahun_akademik,tahun,nama_kelas,status)
    `,
    )
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data ?? []).map((item: any) => ({
    id: item.id,
    user_id: item.user_id,
    class_id: item.class_id,
    users: Array.isArray(item.users) ? item.users[0] : item.users,
    classes: Array.isArray(item.classes) ? item.classes[0] : item.classes,
  })) as TeacherClassAssignment[];
}

export async function getSubjects(): Promise<SubjectRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('subjects')
    .select('kod_subjek,nama_subjek,markah_penuh,dikira_purata,susunan,status')
    .eq('status', 'AKTIF')
    .order('susunan');

  if (error) return [];
  return data ?? [];
}

export async function getExams(): Promise<ExamRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('exams')
    .select('id,kod_peperiksaan,nama_peperiksaan,tahun_akademik,status')
    .order('tahun_akademik', { ascending: false })
    .order('kod_peperiksaan');

  if (error) return [];
  return data ?? [];
}

export async function getStudentsByClass(classId: string): Promise<StudentRecord[]> {
  if (!supabase || !classId) return [];
  const { data, error } = await supabase
    .from('students')
    .select('id,mykid,nama_murid,jantina,kod_sekolah,class_id,status')
    .eq('class_id', classId)
    .eq('status', 'AKTIF')
    .order('nama_murid');

  if (error) return [];
  return data ?? [];
}

export async function getMarksForSelection(
  examId: string,
  classId: string,
  kodSubjek: string,
): Promise<MarkRecord[]> {
  if (!supabase || !examId || !classId || !kodSubjek) return [];
  const { data, error } = await supabase
    .from('marks')
    .select('id,exam_id,student_id,kod_sekolah,class_id,kod_subjek,markah')
    .eq('exam_id', examId)
    .eq('class_id', classId)
    .eq('kod_subjek', kodSubjek);

  if (error) return [];
  return data ?? [];
}

export async function getStudentSummaries(): Promise<StudentSummaryRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('v_student_exam_summary')
    .select('*')
    .order('kod_sekolah')
    .order('kod_peperiksaan')
    .order('purata', { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function getSchoolSummaries(): Promise<SchoolSummaryRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('v_school_exam_summary')
    .select('*')
    .order('tahun_akademik', { ascending: false })
    .order('kod_peperiksaan')
    .order('purata_sekolah', { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function getSubjectSummaries(): Promise<SubjectSummaryRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('v_subject_exam_summary')
    .select('*')
    .order('tahun_akademik', { ascending: false })
    .order('kod_peperiksaan')
    .order('kod_sekolah')
    .order('kod_subjek');

  if (error) return [];
  return data ?? [];
}

export async function getMarkDetails(): Promise<MarkDetailRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('marks')
    .select(
      `
      id,
      markah,
      kod_subjek,
      kod_sekolah,
      exam_id,
      student_id,
      class_id,
      students(id,mykid,nama_murid,jantina,kod_sekolah,class_id,status),
      subjects(kod_subjek,nama_subjek,markah_penuh,dikira_purata,susunan,status),
      exams(id,kod_peperiksaan,nama_peperiksaan,tahun_akademik,status),
      classes(id,kod_sekolah,tahun_akademik,tahun,nama_kelas,status)
    `,
    )
    .order('kod_sekolah')
    .order('kod_subjek');

  if (error) return [];
  return (data ?? []).map((item: any) => ({
    id: item.id,
    markah: item.markah,
    kod_subjek: item.kod_subjek,
    kod_sekolah: item.kod_sekolah,
    exam_id: item.exam_id,
    student_id: item.student_id,
    class_id: item.class_id,
    students: Array.isArray(item.students) ? item.students[0] : item.students,
    subjects: Array.isArray(item.subjects) ? item.subjects[0] : item.subjects,
    exams: Array.isArray(item.exams) ? item.exams[0] : item.exams,
    classes: Array.isArray(item.classes) ? item.classes[0] : item.classes,
  })) as MarkDetailRecord[];
}

export async function getTeacherSubjectAssignments(): Promise<TeacherSubjectAssignment[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('teacher_subject_assignments')
    .select(
      `
      id,
      user_id,
      class_id,
      kod_subjek,
      users:app_users(id,email,nama,role,kod_sekolah,status),
      classes(id,kod_sekolah,tahun_akademik,tahun,nama_kelas,status),
      subjects(kod_subjek,nama_subjek,markah_penuh,dikira_purata,susunan,status)
    `,
    )
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data ?? []).map((item: any) => ({
    id: item.id,
    user_id: item.user_id,
    class_id: item.class_id,
    kod_subjek: item.kod_subjek,
    users: Array.isArray(item.users) ? item.users[0] : item.users,
    classes: Array.isArray(item.classes) ? item.classes[0] : item.classes,
    subjects: Array.isArray(item.subjects) ? item.subjects[0] : item.subjects,
  })) as TeacherSubjectAssignment[];
}
