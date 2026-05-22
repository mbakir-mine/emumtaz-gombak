import { hasSupabaseEnv, supabase } from './supabase';

export type SetupCounts = {
  schools: number;
  users: number;
  subjects: number;
  exams: number;
  classes: number;
  students: number;
  marks: number;
  schoolCategories: Record<string, number>;
  studentGender: {
    lelaki: number;
    perempuan: number;
  };
};

export type DashboardScopeCounts = {
  all: SetupCounts;
  zones: Record<string, SetupCounts>;
  schools: Record<string, SetupCounts>;
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
  allowed_nav?: string[] | null;
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
  buka_markah?: string | null;
  tutup_markah?: string | null;
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

export type DashboardSchoolRank = {
  kod_sekolah: string;
  nama_sekolah: string;
  kategori: string;
  zon: string | null;
  jumlah_murid: number;
  purata: number | null;
  gps: number | null;
  kod_peperiksaan: string;
  tahun_akademik: number;
};

export type DashboardClassRank = {
  class_id: string;
  kod_sekolah: string;
  tahun: number;
  nama_kelas: string;
  bil_murid: number;
  purata: number | null;
  gps: number | null;
  kod_peperiksaan: string;
  tahun_akademik: number;
};

export type MarkCompletionSchool = {
  kod_sekolah: string;
  nama_sekolah: string;
  kategori: string;
  zon: string | null;
  expected: number;
  completed: number;
  percent: number;
  complete: boolean;
};

export type MarkCompletionClass = {
  class_id: string;
  kod_sekolah: string;
  tahun: number;
  nama_kelas: string;
  expected: number;
  completed: number;
  percent: number;
  complete: boolean;
};

export type TeacherDashboardClass = {
  user_id: string;
  class_id: string;
  kod_sekolah: string;
  nama_sekolah: string;
  tahun: number;
  nama_kelas: string;
  jumlah_murid: number;
  lelaki: number;
  perempuan: number;
};

export type TeacherDashboardSubject = {
  user_id: string;
  class_id: string;
  kod_sekolah: string;
  nama_sekolah: string;
  tahun: number;
  nama_kelas: string;
  kod_subjek: string;
  nama_subjek: string;
  jumlah_murid: number;
  lelaki: number;
  perempuan: number;
};

export type DashboardInsights = {
  latestExamLabel: string;
  schoolRanks: DashboardSchoolRank[];
  classRanks: DashboardClassRank[];
  completionSchools: MarkCompletionSchool[];
  completionClasses: MarkCompletionClass[];
  teacherClasses: TeacherDashboardClass[];
  teacherSubjects: TeacherDashboardSubject[];
  scopeCounts: DashboardScopeCounts;
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

type SubjectGradeRule = {
  tahun: number;
  kod_subjek: string;
  wajib_isi: boolean;
};

async function countTable(table: string) {
  if (!supabase) return 0;
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

async function getSchoolCategoryCounts() {
  const counts: Record<string, number> = {};
  const schools = await getSchools();
  schools.forEach((school) => {
    const key = school.kategori || 'LAIN';
    counts[key] = (counts[key] ?? 0) + 1;
  });
  return counts;
}

async function getStudentGenderCounts() {
  const students = await fetchStudentsInBatches();
  return students.reduce(
    (total, student) => {
      if (student.status !== 'AKTIF') return total;
      if (student.jantina === 'P') {
        total.perempuan += 1;
      } else if (student.jantina === 'L') {
        total.lelaki += 1;
      }
      return total;
    },
    { lelaki: 0, perempuan: 0 },
  );
}

async function fetchStudentsInBatches(): Promise<StudentRecord[]> {
  if (!supabase) return [];

  const pageSize = 1000;
  let from = 0;
  const rows: StudentRecord[] = [];

  while (true) {
    const { data, error } = await supabase
      .from('students')
      .select('id,mykid,nama_murid,jantina,kod_sekolah,class_id,status')
      .order('kod_sekolah')
      .order('nama_murid')
      .range(from, from + pageSize - 1);

    if (error) return rows;
    if (!data || data.length === 0) return rows;

    rows.push(...data);

    if (data.length < pageSize) return rows;
    from += pageSize;
  }
}

async function fetchStudentSummariesInBatches(): Promise<StudentSummaryRecord[]> {
  if (!supabase) return [];

  const pageSize = 1000;
  let from = 0;
  const rows: StudentSummaryRecord[] = [];

  while (true) {
    const { data, error } = await supabase
      .from('v_student_exam_summary')
      .select('*')
      .order('tahun_akademik', { ascending: false })
      .order('kod_peperiksaan')
      .order('kod_sekolah')
      .range(from, from + pageSize - 1);

    if (error) return rows;
    if (!data || data.length === 0) return rows;

    rows.push(...data);

    if (data.length < pageSize) return rows;
    from += pageSize;
  }
}

async function fetchMarksByExamInBatches(examId: string): Promise<MarkRecord[]> {
  if (!supabase || !examId) return [];

  const pageSize = 1000;
  let from = 0;
  const rows: MarkRecord[] = [];

  while (true) {
    const { data, error } = await supabase
      .from('marks')
      .select('id,exam_id,student_id,kod_sekolah,class_id,kod_subjek,markah')
      .eq('exam_id', examId)
      .range(from, from + pageSize - 1);

    if (error) return rows;
    if (!data || data.length === 0) return rows;

    rows.push(...data);

    if (data.length < pageSize) return rows;
    from += pageSize;
  }
}

async function getSubjectGradeRules(): Promise<SubjectGradeRule[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('subject_grade_rules')
    .select('tahun,kod_subjek,wajib_isi')
    .eq('wajib_isi', true)
    .order('tahun')
    .order('susunan');

  if (error) return [];
  return data ?? [];
}

async function getTeacherDashboardRows(
  schools: School[],
  classes: ClassRecord[],
  students: StudentRecord[],
  subjects: SubjectRecord[],
): Promise<{
  teacherClasses: TeacherDashboardClass[];
  teacherSubjects: TeacherDashboardSubject[];
}> {
  if (!supabase) return { teacherClasses: [], teacherSubjects: [] };

  const [{ data: classAssignments }, { data: subjectAssignments }] = await Promise.all([
    supabase.from('teacher_class_assignments').select('user_id,class_id'),
    supabase.from('teacher_subject_assignments').select('user_id,class_id,kod_subjek'),
  ]);

  const schoolMap = new Map(schools.map((school) => [school.kod_sekolah, school]));
  const classMap = new Map(classes.map((classRecord) => [classRecord.id, classRecord]));
  const subjectMap = new Map(subjects.map((subject) => [subject.kod_subjek, subject]));

  const teacherClasses = (classAssignments ?? [])
    .map((assignment: any) => {
      const classRecord = classMap.get(assignment.class_id);
      if (!classRecord) return null;
      const school = schoolMap.get(classRecord.kod_sekolah);
      const classStudents = students.filter(
        (student) => student.class_id === classRecord.id && student.status === 'AKTIF',
      );

      return {
        user_id: assignment.user_id,
        class_id: classRecord.id,
        kod_sekolah: classRecord.kod_sekolah,
        nama_sekolah: school?.nama_sekolah ?? classRecord.kod_sekolah,
        tahun: classRecord.tahun,
        nama_kelas: classRecord.nama_kelas,
        jumlah_murid: classStudents.length,
        lelaki: classStudents.filter((student) => student.jantina === 'L').length,
        perempuan: classStudents.filter((student) => student.jantina === 'P').length,
      };
    })
    .filter(Boolean) as TeacherDashboardClass[];

  const teacherSubjects = (subjectAssignments ?? [])
    .map((assignment: any) => {
      const classRecord = classMap.get(assignment.class_id);
      const subject = subjectMap.get(assignment.kod_subjek);
      if (!classRecord || !subject) return null;
      const school = schoolMap.get(classRecord.kod_sekolah);
      const classStudents = students.filter(
        (student) => student.class_id === classRecord.id && student.status === 'AKTIF',
      );

      return {
        user_id: assignment.user_id,
        class_id: classRecord.id,
        kod_sekolah: classRecord.kod_sekolah,
        nama_sekolah: school?.nama_sekolah ?? classRecord.kod_sekolah,
        tahun: classRecord.tahun,
        nama_kelas: classRecord.nama_kelas,
        kod_subjek: subject.kod_subjek,
        nama_subjek: subject.nama_subjek,
        jumlah_murid: classStudents.length,
        lelaki: classStudents.filter((student) => student.jantina === 'L').length,
        perempuan: classStudents.filter((student) => student.jantina === 'P').length,
      };
    })
    .filter(Boolean) as TeacherDashboardSubject[];

  return { teacherClasses, teacherSubjects };
}

function emptySetupCounts(subjects = 0, exams = 0): SetupCounts {
  return {
    schools: 0,
    users: 0,
    subjects,
    exams,
    classes: 0,
    students: 0,
    marks: 0,
    schoolCategories: {},
    studentGender: { lelaki: 0, perempuan: 0 },
  };
}

function addSchoolToCounts(counts: SetupCounts, school: School) {
  counts.schools += 1;
  const key = school.kategori || 'LAIN';
  counts.schoolCategories[key] = (counts.schoolCategories[key] ?? 0) + 1;
}

function addStudentToCounts(counts: SetupCounts, student: StudentRecord) {
  if (student.status !== 'AKTIF') return;
  counts.students += 1;
  if (student.jantina === 'L') counts.studentGender.lelaki += 1;
  if (student.jantina === 'P') counts.studentGender.perempuan += 1;
}

function buildDashboardScopeCounts({
  schools,
  classes,
  students,
  marks,
  users,
  subjects,
  exams,
}: {
  schools: School[];
  classes: ClassRecord[];
  students: StudentRecord[];
  marks: MarkRecord[];
  users: UserRecord[];
  subjects: SubjectRecord[];
  exams: ExamRecord[];
}): DashboardScopeCounts {
  const all = emptySetupCounts(subjects.length, exams.length);
  const zones: Record<string, SetupCounts> = {};
  const schoolCounts: Record<string, SetupCounts> = {};
  const schoolMap = new Map(schools.map((school) => [school.kod_sekolah, school]));

  schools.forEach((school) => {
    addSchoolToCounts(all, school);
    schoolCounts[school.kod_sekolah] = emptySetupCounts(subjects.length, exams.length);
    addSchoolToCounts(schoolCounts[school.kod_sekolah], school);

    if (school.zon) {
      zones[school.zon] = zones[school.zon] ?? emptySetupCounts(subjects.length, exams.length);
      addSchoolToCounts(zones[school.zon], school);
    }
  });

  classes.forEach((classRecord) => {
    all.classes += 1;
    const schoolCount = schoolCounts[classRecord.kod_sekolah];
    if (schoolCount) schoolCount.classes += 1;

    const zon = schoolMap.get(classRecord.kod_sekolah)?.zon;
    if (zon && zones[zon]) zones[zon].classes += 1;
  });

  students.forEach((student) => {
    addStudentToCounts(all, student);
    const schoolCount = schoolCounts[student.kod_sekolah];
    if (schoolCount) addStudentToCounts(schoolCount, student);

    const zon = schoolMap.get(student.kod_sekolah)?.zon;
    if (zon && zones[zon]) addStudentToCounts(zones[zon], student);
  });

  marks.forEach((mark) => {
    all.marks += 1;
    const schoolCount = schoolCounts[mark.kod_sekolah];
    if (schoolCount) schoolCount.marks += 1;

    const zon = schoolMap.get(mark.kod_sekolah)?.zon;
    if (zon && zones[zon]) zones[zon].marks += 1;
  });

  users.forEach((user) => {
    all.users += 1;
    if (user.kod_sekolah && schoolCounts[user.kod_sekolah]) {
      schoolCounts[user.kod_sekolah].users += 1;
    }

    if (user.zon && zones[user.zon]) {
      zones[user.zon].users += 1;
    } else if (user.kod_sekolah) {
      const zon = schoolMap.get(user.kod_sekolah)?.zon;
      if (zon && zones[zon]) zones[zon].users += 1;
    }
  });

  return { all, zones, schools: schoolCounts };
}

function gradePointFromAverage(purata: number | null | undefined) {
  if (purata === null || purata === undefined) return null;
  if (purata >= 90) return 1;
  if (purata >= 75) return 2;
  if (purata >= 60) return 3;
  if (purata >= 40) return 4;
  return 5;
}

function examSortValue(item: { tahun_akademik: number; kod_peperiksaan: string }) {
  const examWeight = item.kod_peperiksaan === 'UASA' ? 2 : item.kod_peperiksaan === 'UPSA' ? 1 : 0;
  return item.tahun_akademik * 10 + examWeight;
}

function latestExamKey(items: Array<{ tahun_akademik: number; kod_peperiksaan: string }>) {
  const latest = [...items].sort((a, b) => examSortValue(b) - examSortValue(a))[0];
  if (!latest) return null;
  return `${latest.tahun_akademik}-${latest.kod_peperiksaan}`;
}

function matchesExamKey(item: { tahun_akademik: number; kod_peperiksaan: string }, key: string) {
  return `${item.tahun_akademik}-${item.kod_peperiksaan}` === key;
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
      schoolCategories: {},
      studentGender: { lelaki: 0, perempuan: 0 },
    };
  }

  let schools = 0;
  let users = 0;
  let subjects = 0;
  let exams = 0;
  let classes = 0;
  let students = 0;
  let marks = 0;
  let schoolCategories: Record<string, number> = {};
  let studentGender = { lelaki: 0, perempuan: 0 };

  try {
    [schools, users, subjects, exams, classes, students, marks, schoolCategories, studentGender] = await Promise.all([
      countTable('schools'),
      countTable('app_users'),
      countTable('subjects'),
      countTable('exams'),
      countTable('classes'),
      countTable('students'),
      countTable('marks'),
      getSchoolCategoryCounts(),
      getStudentGenderCounts(),
    ]);
  } catch {
    return { schools, users, subjects, exams, classes, students, marks, schoolCategories, studentGender };
  }

  return { schools, users, subjects, exams, classes, students, marks, schoolCategories, studentGender };
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
  return fetchStudentsInBatches();
}

export async function getSchoolUsers(): Promise<UserRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('app_users')
    .select('id,email,nama,role,kod_sekolah,zon,status,allowed_nav')
    .in('role', ['ADMIN_DAERAH', 'ADMIN_ZON', 'ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK'])
    .neq('role', 'OWNER')
    .order('role')
    .order('kod_sekolah')
    .order('nama');

  if (error) return [];
  return data ?? [];
}

export async function getAllAppUsers(): Promise<UserRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('app_users')
    .select('id,email,nama,role,kod_sekolah,zon,status,allowed_nav')
    .order('status')
    .order('kod_sekolah')
    .order('role')
    .order('nama');

  if (error) return [];
  return data ?? [];
}

export async function getAppUserById(id: string): Promise<UserRecord | null> {
  if (!supabase || !id) return null;
  const { data, error } = await supabase
    .from('app_users')
    .select('id,email,nama,role,kod_sekolah,zon,status,allowed_nav')
    .eq('id', id)
    .maybeSingle();

  if (error) return null;
  return data ?? null;
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
    .select('*')
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
  const rows = await fetchStudentSummariesInBatches();
  return rows.sort((a, b) => {
    if (a.kod_sekolah !== b.kod_sekolah) return a.kod_sekolah.localeCompare(b.kod_sekolah);
    if (a.kod_peperiksaan !== b.kod_peperiksaan) return a.kod_peperiksaan.localeCompare(b.kod_peperiksaan);
    return (b.purata ?? -1) - (a.purata ?? -1);
  });
}

export async function getStudentSummariesByMykid(mykid: string, kodSekolah?: string): Promise<StudentSummaryRecord[]> {
  if (!supabase || !mykid) return [];
  let query = supabase
    .from('v_student_exam_summary')
    .select('*')
    .eq('mykid', mykid);

  if (kodSekolah) {
    query = query.eq('kod_sekolah', kodSekolah);
  }

  const { data, error } = await query
    .order('tahun_akademik', { ascending: false })
    .order('kod_peperiksaan');

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

export async function getDashboardInsights(): Promise<DashboardInsights> {
  const [schools, classes, exams, rules, subjects, schoolSummaries, studentSummaries, students, users] = await Promise.all([
    getSchools(),
    getClasses(),
    getExams(),
    getSubjectGradeRules(),
    getSubjects(),
    getSchoolSummaries(),
    fetchStudentSummariesInBatches(),
    fetchStudentsInBatches(),
    getSchoolUsers(),
  ]);
  const teacherDashboard = await getTeacherDashboardRows(schools, classes, students, subjects);
  const baseScopeCounts = buildDashboardScopeCounts({
    schools,
    classes,
    students,
    marks: [],
    users,
    subjects,
    exams,
  });

  const latestExam = [...exams].sort((a, b) => examSortValue(b) - examSortValue(a))[0];
  const key = latestExam
    ? `${latestExam.tahun_akademik}-${latestExam.kod_peperiksaan}`
    : latestExamKey([...schoolSummaries, ...studentSummaries]);

  if (!key) {
    return {
      latestExamLabel: 'Belum ada markah',
      schoolRanks: [],
      classRanks: [],
      completionSchools: [],
      completionClasses: [],
      teacherClasses: teacherDashboard.teacherClasses,
      teacherSubjects: teacherDashboard.teacherSubjects,
      scopeCounts: baseScopeCounts,
    };
  }

  const schoolMap = new Map(schools.map((school) => [school.kod_sekolah, school]));
  const classMap = new Map(classes.map((classRecord) => [classRecord.id, classRecord]));
  const marks = latestExam ? await fetchMarksByExamInBatches(latestExam.id) : [];
  const scopeCounts = buildDashboardScopeCounts({
    schools,
    classes,
    students,
    marks,
    users,
    subjects,
    exams,
  });
  const rulesByTahun = new Map<number, string[]>();
  rules.forEach((rule) => {
    rulesByTahun.set(rule.tahun, [...(rulesByTahun.get(rule.tahun) ?? []), rule.kod_subjek]);
  });
  const completedMarkKeys = new Set(
    marks
      .filter((mark) => mark.markah !== null && mark.markah !== undefined)
      .map((mark) => `${mark.student_id}-${mark.kod_subjek}`),
  );

  const schoolRanks = schoolSummaries
    .filter((summary) => matchesExamKey(summary, key) && summary.purata_sekolah !== null)
    .map((summary) => {
      const school = schoolMap.get(summary.kod_sekolah);
      return {
        kod_sekolah: summary.kod_sekolah,
        nama_sekolah: school?.nama_sekolah ?? summary.kod_sekolah,
        kategori: school?.kategori ?? '-',
        zon: school?.zon ?? null,
        jumlah_murid: summary.jumlah_murid,
        purata: summary.purata_sekolah,
        gps: gradePointFromAverage(summary.purata_sekolah),
        kod_peperiksaan: summary.kod_peperiksaan,
        tahun_akademik: summary.tahun_akademik,
      };
    })
    .sort((a, b) => (a.gps ?? 99) - (b.gps ?? 99) || (b.purata ?? -1) - (a.purata ?? -1));

  const classGroups = new Map<
    string,
    {
      classRecord: ClassRecord;
      kod_peperiksaan: string;
      tahun_akademik: number;
      total: number;
      count: number;
    }
  >();

  studentSummaries
    .filter((summary) => matchesExamKey(summary, key) && summary.purata !== null)
    .forEach((summary) => {
      const classRecord = classMap.get(summary.class_id);
      if (!classRecord) return;
      const groupKey = `${summary.class_id}-${summary.tahun_akademik}-${summary.kod_peperiksaan}`;
      const current =
        classGroups.get(groupKey) ??
        {
          classRecord,
          kod_peperiksaan: summary.kod_peperiksaan,
          tahun_akademik: summary.tahun_akademik,
          total: 0,
          count: 0,
        };

      current.total += summary.purata ?? 0;
      current.count += 1;
      classGroups.set(groupKey, current);
    });

  const classRanks = [...classGroups.values()]
    .map((group) => {
      const purata = group.count > 0 ? Number((group.total / group.count).toFixed(2)) : null;
      return {
        class_id: group.classRecord.id,
        kod_sekolah: group.classRecord.kod_sekolah,
        tahun: group.classRecord.tahun,
        nama_kelas: group.classRecord.nama_kelas,
        bil_murid: group.count,
        purata,
        gps: gradePointFromAverage(purata),
        kod_peperiksaan: group.kod_peperiksaan,
        tahun_akademik: group.tahun_akademik,
      };
    })
    .sort((a, b) => (a.gps ?? 99) - (b.gps ?? 99) || (b.purata ?? -1) - (a.purata ?? -1));

  const classCompletionMap = new Map<string, MarkCompletionClass>();

  classes
    .filter((classRecord) => !latestExam || classRecord.tahun_akademik === latestExam.tahun_akademik)
    .forEach((classRecord) => {
    const requiredSubjects = rulesByTahun.get(classRecord.tahun) ?? [];
    const classStudents = students.filter(
      (student) => student.class_id === classRecord.id && student.status === 'AKTIF',
    );
    const expected = classStudents.length * requiredSubjects.length;
    let completed = 0;

    classStudents.forEach((student) => {
      requiredSubjects.forEach((kodSubjek) => {
        if (completedMarkKeys.has(`${student.id}-${kodSubjek}`)) {
          completed += 1;
        }
      });
    });

    const percent = expected > 0 ? Math.round((completed / expected) * 100) : 0;
    classCompletionMap.set(classRecord.id, {
      class_id: classRecord.id,
      kod_sekolah: classRecord.kod_sekolah,
      tahun: classRecord.tahun,
      nama_kelas: classRecord.nama_kelas,
      expected,
      completed,
      percent,
      complete: expected > 0 && completed >= expected,
    });
  });

  const schoolCompletionMap = new Map<string, MarkCompletionSchool>();
  schools.forEach((school) => {
    const schoolClasses = [...classCompletionMap.values()].filter((item) => item.kod_sekolah === school.kod_sekolah);
    const expected = schoolClasses.reduce((total, item) => total + item.expected, 0);
    const completed = schoolClasses.reduce((total, item) => total + item.completed, 0);
    const percent = expected > 0 ? Math.round((completed / expected) * 100) : 0;
    schoolCompletionMap.set(school.kod_sekolah, {
      kod_sekolah: school.kod_sekolah,
      nama_sekolah: school.nama_sekolah,
      kategori: school.kategori,
      zon: school.zon,
      expected,
      completed,
      percent,
      complete: expected > 0 && completed >= expected,
    });
  });

  const [tahun, exam] = key.split('-');
  return {
    latestExamLabel: `${exam} ${tahun}`,
    schoolRanks,
    classRanks,
    completionSchools: [...schoolCompletionMap.values()].sort((a, b) => a.kod_sekolah.localeCompare(b.kod_sekolah)),
    completionClasses: [...classCompletionMap.values()].sort(
      (a, b) => a.kod_sekolah.localeCompare(b.kod_sekolah) || a.tahun - b.tahun || a.nama_kelas.localeCompare(b.nama_kelas),
    ),
    teacherClasses: teacherDashboard.teacherClasses,
    teacherSubjects: teacherDashboard.teacherSubjects,
    scopeCounts,
  };
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
