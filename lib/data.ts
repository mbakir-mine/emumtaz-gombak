import { getSupabaseServerClient, hasSupabaseServerEnv as hasSupabaseEnv } from './supabase-server';
import { cache } from 'react';
import { compareExamCode, isStandardExamCode } from './examOrdering';
import {
  khalifahMudaClassActivities,
  khalifahMudaGuidanceIndicators,
  khalifahMudaPositiveIndicators,
  type KhalifahMudaIndicator,
} from './khalifahMuda';
import { sahsiahIhabGradeScale, type SahsiahIhabResult } from './sahsiahIhab';
import type { OptionalSchoolModuleKey } from './schoolModules';
import { mergeSubjectComponents, type SubjectComponentDefinition } from './subjectComponents';
import { gradePointForMark } from './subjects';

const PSRA_PAPER_CODES = new Set(['AS01', 'BA02', 'JIK03', 'TF04', 'TJ05']);

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
  classesByYear: Record<number, number>;
};

export type DashboardScopeCounts = {
  all: SetupCounts;
  districts: Record<string, SetupCounts>;
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

export type SchoolModuleAccess = {
  id: string;
  kod_sekolah: string;
  module_key: OptionalSchoolModuleKey;
  enabled: boolean;
  enabled_at: string | null;
  enabled_by: string | null;
  catatan: string | null;
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

export type UpkkAmaliSolatRecord = {
  id: string;
  kod_sekolah: string;
  tahun_akademik: number;
  class_id: string;
  student_id: string;
  scores: Record<string, number>;
  jumlah: number;
  status: string;
  catatan: string | null;
};

export type UpkkPchiRecord = UpkkAmaliSolatRecord;

export type StudentSchoolSummary = {
  kod_sekolah: string;
  nama_sekolah: string;
  kategori: string;
  zon: string | null;
  jumlah_murid: number;
  murid_lelaki: number;
  murid_perempuan: number;
};

export type StudentPageOptions = {
  page?: number;
  pageSize?: number;
  kodSekolah?: string;
  classId?: string;
  status?: string;
  search?: string;
};

export type StudentPageResult = {
  rows: StudentRecord[];
  count: number;
  page: number;
  pageSize: number;
};

export type StudentSchoolSummaryOptions = {
  kategori?: string;
  zon?: string;
  kodSekolah?: string;
};

export type StudentEnrollmentDetail = {
  id: string;
  student_id: string;
  tahun_akademik: number;
  kod_sekolah: string;
  class_id: string | null;
  status: string;
  catatan: string | null;
  mykid: string;
  nama_murid: string;
  jantina: string | null;
  tahun: number | null;
  nama_kelas: string | null;
  nama_sekolah: string | null;
  kategori: string | null;
  zon: string | null;
};

export type AttendanceRecord = {
  id: string;
  attendance_date: string;
  student_id: string;
  kod_sekolah: string;
  class_id: string | null;
  status: string;
  catatan: string | null;
};

export type TakwimEvent = {
  id: string;
  tahun_akademik: number;
  kod_sekolah: string | null;
  scope: 'DAERAH' | 'SEKOLAH';
  kategori: string;
  tajuk: string;
  tarikh_mula: string;
  tarikh_tamat: string;
  keterangan: string | null;
  warna: string | null;
  status: string;
};

export type AmalKhairCategory = {
  id: string;
  nama_kategori: string;
  mata_default: number;
  status: string;
};

export type AmalKhairRecord = {
  id: string;
  student_id: string;
  kod_sekolah: string;
  class_id: string | null;
  category_id: string | null;
  kategori: string | null;
  mata: number;
  catatan: string | null;
  recorded_at: string;
  nama_murid?: string | null;
};

export type KhalifahMudaRecord = {
  id: string;
  kod_sekolah: string;
  class_id: string;
  student_id: string | null;
  record_date: string;
  record_scope: 'KELAS' | 'INDIVIDU';
  record_kind: 'AKTIVITI_KELAS' | 'POSITIF' | 'BIMBINGAN';
  domain: string;
  indicator_key: string;
  indicator_label: string;
  points: number;
  catatan: string | null;
  recorded_by: string | null;
  created_at: string;
  nama_murid?: string | null;
};

export type KhalifahMudaComponent = KhalifahMudaIndicator & {
  id?: string;
  sort_order: number;
  status: string;
};

export type SahsiahIhabAssessment = SahsiahIhabResult & {
  id: string;
  kod_sekolah: string;
  tahun_akademik: number;
  bulan: number;
  class_id: string;
  student_id: string;
  m1_confirmed: boolean;
  m2_confirmed: boolean;
  m3_raw: number;
  m4: number;
  m5: number;
  m6: number;
  status: string;
  catatan: string | null;
  submitted_at: string | null;
  verified_at: string | null;
  nama_murid?: string | null;
};

export type TimetableSlot = {
  id: string;
  kod_sekolah: string;
  hari: string;
  waktu_mula: string;
  waktu_tamat: string;
  label: string | null;
  susunan: number;
  status: string;
};

export type TimetableEntry = {
  id: string;
  slot_id: string;
  class_id: string;
  kod_sekolah: string;
  kod_subjek: string | null;
  kod_komponen?: string | null;
  assignment_label?: string | null;
  nama_paparan?: string | null;
  teacher_id: string | null;
  bilik: string | null;
  status: string;
};

export type TimetableRequirement = {
  id: string;
  kod_sekolah: string;
  class_id: string;
  kod_subjek: string;
  kod_komponen?: string | null;
  assignment_label?: string | null;
  nama_paparan?: string | null;
  teacher_id: string | null;
  bil_slot_seminggu: number;
  boleh_gabung?: boolean;
  status: string;
};

export type RphRecord = {
  id: string;
  kod_sekolah: string;
  class_id: string | null;
  teacher_id: string | null;
  kod_subjek: string | null;
  tarikh: string;
  tajuk: string;
  standard_pembelajaran: string | null;
  objektif: string | null;
  aktiviti: string | null;
  bbm: string | null;
  pentaksiran: string | null;
  refleksi: string | null;
  status: string;
};

export type UserRecord = {
  id: string;
  auth_user_id?: string | null;
  email: string;
  nama: string;
  role: string;
  kod_sekolah: string | null;
  daerah: string | null;
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

export type SubjectComponentRecord = SubjectComponentDefinition & {
  id?: string;
};

export type SubjectComponentMarkSetting = {
  id: string;
  tahun_akademik: number;
  kod_peperiksaan: string;
  tahun: number;
  kod_subjek: string;
  kod_komponen: string;
  markah_penuh: number;
  status: string;
};

export type MarkComponentRecord = {
  id: string;
  exam_id: string;
  student_id: string;
  kod_sekolah: string;
  class_id: string;
  kod_subjek: string;
  kod_komponen: string;
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
  daerah: string;
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
  daerah: string;
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
  latestExamKey: string | null;
  examOptions: Array<{ key: string; label: string; group: 'utama' | 'psra' }>;
  schoolRanks: DashboardSchoolRank[];
  classRanks: DashboardClassRank[];
  completionSchools: MarkCompletionSchool[];
  completionClasses: MarkCompletionClass[];
  teacherClasses: TeacherDashboardClass[];
  teacherSubjects: TeacherDashboardSubject[];
  scopeCounts: DashboardScopeCounts;
  psraSelection: { year: number; session: 1 | 2 } | null;
  psraAvailableDistricts: string[];
  psraSchools: Array<{
    kod_sekolah: string;
    nama_sekolah: string;
    daerah: string;
    zon: string | null;
    candidateIds: string[];
  }>;
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

export type PbdAssessmentRecord = {
  id: string;
  kod_sekolah: string;
  class_id: string;
  tahun_akademik: number;
  kod_subjek: string;
  teacher_id: string | null;
  tarikh: string;
  tajuk: string;
  instrumen: string;
  markah_penuh: number;
  status: string;
  subjects?: SubjectRecord;
  classes?: ClassRecord;
  users?: UserRecord;
};

export type PbdMarkDetailRecord = {
  id: string;
  assessment_id: string;
  student_id: string;
  markah: number | null;
  tahap_penguasaan: number | null;
  catatan: string | null;
  students?: StudentRecord;
  pbd_assessments?: PbdAssessmentRecord;
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
  assignment_label?: string | null;
  users?: UserRecord;
  classes?: ClassRecord;
  subjects?: SubjectRecord;
};

export type TeacherSubjectComponentAssignment = {
  id: string;
  user_id: string;
  class_id: string;
  kod_subjek: string;
  kod_komponen: string;
  users?: UserRecord;
};

type SubjectGradeRule = {
  tahun: number;
  kod_subjek: string;
  wajib_isi: boolean;
};

async function countTable(table: string) {
  const supabase = await getSupabaseServerClient();
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
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const pageSize = 1000;
  const pages = await Promise.all(
    Array.from({ length: 8 }, (_, page) =>
      supabase
        .from('students')
        .select('id,mykid,nama_murid,jantina,kod_sekolah,class_id,status')
        .order('kod_sekolah')
        .order('nama_murid')
        .range(page * pageSize, (page + 1) * pageSize - 1),
    ),
  );
  return pages.flatMap(({ data, error }) => (error || !data ? [] : (data as StudentRecord[])));
}

async function fetchStudentSummariesInBatches(): Promise<StudentSummaryRecord[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const pageSize = 1000;
  const pages = await Promise.all(
    Array.from({ length: 8 }, (_, page) =>
      supabase
        .from('v_student_exam_summary')
        .select('*')
        .order('tahun_akademik', { ascending: false })
        .order('kod_peperiksaan')
        .order('kod_sekolah')
        .range(page * pageSize, (page + 1) * pageSize - 1),
    ),
  );
  return pages.flatMap(({ data, error }) => (error || !data ? [] : (data as StudentSummaryRecord[])));
}

async function fetchMarksByExamInBatches(examId: string): Promise<MarkRecord[]> {
  const supabase = await getSupabaseServerClient();
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
  const supabase = await getSupabaseServerClient();
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
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { teacherClasses: [], teacherSubjects: [] };

  const [{ data: classAssignments }, { data: subjectAssignments }] = await Promise.all([
    supabase.from('teacher_class_assignments').select('user_id,class_id'),
    supabase.from('teacher_subject_assignments').select('user_id,class_id,kod_subjek,assignment_label'),
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
    classesByYear: {},
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
  const districts: Record<string, SetupCounts> = {};
  const zones: Record<string, SetupCounts> = {};
  const schoolCounts: Record<string, SetupCounts> = {};
  const schoolMap = new Map(schools.map((school) => [school.kod_sekolah, school]));

  schools.forEach((school) => {
    addSchoolToCounts(all, school);
    const district = (school.daerah || '').toUpperCase();
    if (district) {
      districts[district] = districts[district] ?? emptySetupCounts(subjects.length, exams.length);
      addSchoolToCounts(districts[district], school);
    }
    schoolCounts[school.kod_sekolah] = emptySetupCounts(subjects.length, exams.length);
    addSchoolToCounts(schoolCounts[school.kod_sekolah], school);

    if (school.zon) {
      zones[school.zon] = zones[school.zon] ?? emptySetupCounts(subjects.length, exams.length);
      addSchoolToCounts(zones[school.zon], school);
    }
  });

  classes.forEach((classRecord) => {
    all.classes += 1;
    all.classesByYear[classRecord.tahun] = (all.classesByYear[classRecord.tahun] ?? 0) + 1;
    const schoolCount = schoolCounts[classRecord.kod_sekolah];
    if (schoolCount) {
      schoolCount.classes += 1;
      schoolCount.classesByYear[classRecord.tahun] = (schoolCount.classesByYear[classRecord.tahun] ?? 0) + 1;
    }

    const zon = schoolMap.get(classRecord.kod_sekolah)?.zon;
    if (zon && zones[zon]) {
      zones[zon].classes += 1;
      zones[zon].classesByYear[classRecord.tahun] = (zones[zon].classesByYear[classRecord.tahun] ?? 0) + 1;
    }
    const district = schoolMap.get(classRecord.kod_sekolah)?.daerah?.toUpperCase();
    if (district && districts[district]) {
      districts[district].classes += 1;
      districts[district].classesByYear[classRecord.tahun] = (districts[district].classesByYear[classRecord.tahun] ?? 0) + 1;
    }
  });

  students.forEach((student) => {
    addStudentToCounts(all, student);
    const schoolCount = schoolCounts[student.kod_sekolah];
    if (schoolCount) addStudentToCounts(schoolCount, student);

    const zon = schoolMap.get(student.kod_sekolah)?.zon;
    if (zon && zones[zon]) addStudentToCounts(zones[zon], student);
    const district = schoolMap.get(student.kod_sekolah)?.daerah?.toUpperCase();
    if (district && districts[district]) addStudentToCounts(districts[district], student);
  });

  marks.forEach((mark) => {
    all.marks += 1;
    const schoolCount = schoolCounts[mark.kod_sekolah];
    if (schoolCount) schoolCount.marks += 1;

    const zon = schoolMap.get(mark.kod_sekolah)?.zon;
    if (zon && zones[zon]) zones[zon].marks += 1;
    const district = schoolMap.get(mark.kod_sekolah)?.daerah?.toUpperCase();
    if (district && districts[district]) districts[district].marks += 1;
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
    const district = user.kod_sekolah ? schoolMap.get(user.kod_sekolah)?.daerah?.toUpperCase() : undefined;
    if (district && districts[district]) districts[district].users += 1;
  });

  return { all, districts, zones, schools: schoolCounts };
}

function gradePointFromAverage(purata: number | null | undefined) {
  return gradePointForMark(purata);
}

function examSortValue(item: { tahun_akademik: number; kod_peperiksaan: string }) {
  const examCode = item.kod_peperiksaan.toUpperCase();
  const examWeight = examCode === 'UASA' ? 2 : examCode === 'UPSA' ? 1 : 0;
  return item.tahun_akademik * 10 + examWeight;
}

function latestRelevantExam<T extends { tahun_akademik: number; kod_peperiksaan: string }>(
  items: T[],
  currentYear = new Date().getFullYear(),
) {
  const standardItems = items.filter((item) => isStandardExamCode(item.kod_peperiksaan));
  const examItems = standardItems.length > 0 ? standardItems : items;
  const currentOrPast = examItems.filter((item) => item.tahun_akademik <= currentYear);
  const currentYearItems = currentOrPast.filter((item) => item.tahun_akademik === currentYear);
  const candidates = currentYearItems.length > 0 ? currentYearItems : currentOrPast;
  return [...candidates].sort((a, b) => examSortValue(b) - examSortValue(a))[0] ?? null;
}

function latestExamKey(items: Array<{ tahun_akademik: number; kod_peperiksaan: string }>) {
  const latest = latestRelevantExam(items);
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
      classesByYear: {},
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
  const classesByYear: Record<number, number> = {};

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
    const classRows = await getClasses();
    classRows.forEach((classRecord) => {
      classesByYear[classRecord.tahun] = (classesByYear[classRecord.tahun] ?? 0) + 1;
    });
  } catch {
    return { schools, users, subjects, exams, classes, students, marks, schoolCategories, studentGender, classesByYear };
  }

  return { schools, users, subjects, exams, classes, students, marks, schoolCategories, studentGender, classesByYear };
}

async function getSchoolsUncached(): Promise<School[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('schools')
    .select('kod_sekolah,nama_sekolah,kategori,daerah,zon,status')
    .order('kod_sekolah');

  if (error) return [];
  return data ?? [];
}
export const getSchools = cache(getSchoolsUncached);

export async function getSchoolModuleAccesses(): Promise<SchoolModuleAccess[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('school_module_access')
    .select('id,kod_sekolah,module_key,enabled,enabled_at,enabled_by,catatan')
    .order('kod_sekolah')
    .order('module_key');

  if (error) return [];
  return (data ?? []) as SchoolModuleAccess[];
}

async function getClassesUncached(): Promise<ClassRecord[]> {
  const supabase = await getSupabaseServerClient();
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
export const getClasses = cache(getClassesUncached);

export async function getStudents(): Promise<StudentRecord[]> {
  return fetchStudentsInBatches();
}

function normalizeUpkkNumber(value: unknown) {
  const numeric = typeof value === 'string' ? Number(value.trim().replace(',', '.')) : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeUpkkScores(rawScores: unknown): Record<string, number> {
  let parsedScores = rawScores;

  if (typeof parsedScores === 'string') {
    try {
      parsedScores = JSON.parse(parsedScores);
    } catch {
      return {};
    }
  }

  if (!parsedScores || typeof parsedScores !== 'object' || Array.isArray(parsedScores)) {
    return {};
  }

  return Object.entries(parsedScores as Record<string, unknown>).reduce<Record<string, number>>(
    (scores, [code, value]) => {
      scores[code] = normalizeUpkkNumber(value);
      return scores;
    },
    {},
  );
}

function normalizeUpkkRecord(row: any): UpkkAmaliSolatRecord {
  return {
    id: String(row?.id ?? ''),
    kod_sekolah: String(row?.kod_sekolah ?? ''),
    tahun_akademik: normalizeUpkkNumber(row?.tahun_akademik),
    class_id: String(row?.class_id ?? ''),
    student_id: String(row?.student_id ?? ''),
    scores: normalizeUpkkScores(row?.scores),
    jumlah: normalizeUpkkNumber(row?.jumlah),
    status: String(row?.status ?? 'DRAF'),
    catatan: row?.catatan ?? null,
  };
}

export async function getUpkkAmaliSolatMarks(): Promise<UpkkAmaliSolatRecord[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('upkk_amali_solat_marks')
    .select('id,kod_sekolah,tahun_akademik,class_id,student_id,scores,jumlah,status,catatan')
    .order('updated_at', { ascending: false });

  if (error) return [];

  return (data ?? []).map(normalizeUpkkRecord);
}

export async function getUpkkPchiMarks(): Promise<UpkkPchiRecord[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('upkk_pchi_marks')
    .select('id,kod_sekolah,tahun_akademik,class_id,student_id,scores,jumlah,status,catatan')
    .order('updated_at', { ascending: false });

  if (error) return [];

  return (data ?? []).map(normalizeUpkkRecord);
}

export async function getStudentsPage(options: StudentPageOptions = {}): Promise<StudentPageResult> {
  const supabase = await getSupabaseServerClient();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(500, Math.max(1, options.pageSize ?? 100));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (!supabase) {
    return { rows: [], count: 0, page, pageSize };
  }

  let query = supabase
    .from('students')
    .select('id,mykid,nama_murid,jantina,kod_sekolah,class_id,status', { count: 'exact' });

  if (options.kodSekolah) query = query.eq('kod_sekolah', options.kodSekolah);
  if (options.classId) query = query.eq('class_id', options.classId);
  if (options.status) query = query.eq('status', options.status);
  if (options.search?.trim()) {
    const term = options.search.trim().replaceAll('%', '').replaceAll(',', ' ');
    query = query.or(`nama_murid.ilike.%${term}%,mykid.ilike.%${term}%,kod_sekolah.ilike.%${term}%`);
  }

  const { data, count, error } = await query
    .order('kod_sekolah')
    .order('nama_murid')
    .range(from, to);

  if (error) return { rows: [], count: 0, page, pageSize };
  return { rows: data ?? [], count: count ?? 0, page, pageSize };
}

export async function getStudentSchoolSummaries(
  options: StudentSchoolSummaryOptions = {},
): Promise<StudentSchoolSummary[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  let query = supabase
    .from('v_student_school_summary')
    .select('kod_sekolah,nama_sekolah,kategori,zon,jumlah_murid,murid_lelaki,murid_perempuan');

  if (options.kategori) query = query.eq('kategori', options.kategori);
  if (options.zon) query = query.eq('zon', options.zon);
  if (options.kodSekolah) query = query.eq('kod_sekolah', options.kodSekolah);

  const { data, error } = await query.order('kod_sekolah');
  if (error) return [];
  return (data ?? []) as StudentSchoolSummary[];
}

export async function getStudentEnrollments(): Promise<StudentEnrollmentDetail[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('v_student_enrollment_detail')
    .select('*')
    .order('tahun_akademik', { ascending: false })
    .order('kod_sekolah')
    .order('tahun')
    .order('nama_kelas')
    .order('nama_murid');

  if (error) return [];
  return data ?? [];
}

export async function getSchoolUsers(): Promise<UserRecord[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('app_users')
    .select('id,auth_user_id,email,nama,role,kod_sekolah,daerah,zon,status,allowed_nav')
    .in('role', ['ADMIN_DAERAH', 'ADMIN_ZON', 'ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK'])
    .neq('role', 'OWNER')
    .order('role')
    .order('kod_sekolah')
    .order('nama');

  if (error) return [];
  return data ?? [];
}

export async function getAllAppUsers(): Promise<UserRecord[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('app_users')
    .select('id,auth_user_id,email,nama,role,kod_sekolah,daerah,zon,status,allowed_nav')
    .order('status')
    .order('kod_sekolah')
    .order('role')
    .order('nama');

  if (error) return [];
  return data ?? [];
}

export async function getAppUserById(id: string): Promise<UserRecord | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase || !id) return null;
  const { data, error } = await supabase
    .from('app_users')
    .select('id,auth_user_id,email,nama,role,kod_sekolah,daerah,zon,status,allowed_nav')
    .eq('id', id)
    .maybeSingle();

  if (error) return null;
  return data ?? null;
}

export async function getTeacherClassAssignments(): Promise<TeacherClassAssignment[]> {
  const supabase = await getSupabaseServerClient();
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

async function getSubjectsUncached(): Promise<SubjectRecord[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('subjects')
    .select('kod_subjek,nama_subjek,markah_penuh,dikira_purata,susunan,status')
    .eq('status', 'AKTIF')
    .order('susunan');

  if (error) return [];
  return data ?? [];
}
export const getSubjects = cache(getSubjectsUncached);

async function getExamsUncached(): Promise<ExamRecord[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .order('tahun_akademik', { ascending: false })
    .order('kod_peperiksaan');

  if (error) return [];
  return data ?? [];
}
export const getExams = cache(getExamsUncached);

export async function getStudentsByClass(classId: string): Promise<StudentRecord[]> {
  const supabase = await getSupabaseServerClient();
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
  const supabase = await getSupabaseServerClient();
  if (!supabase || !examId || !classId || !kodSubjek) return [];
  const { data, error } = await supabase
    .from('marks')
    .select('id,exam_id,student_id,kod_sekolah,class_id,kod_subjek,markah')
    .eq('exam_id', examId)
    .eq('class_id', classId)
    .eq('kod_subjek', kodSubjek);

  if (error) return [];

  const coreMarks = (data ?? []) as MarkRecord[];
  const { data: exam } = await supabase
    .from('exams')
    .select('kod_peperiksaan')
    .eq('id', examId)
    .maybeSingle();

  const examCode = String(exam?.kod_peperiksaan ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const session = examCode === 'PSRA1' ? 1 : examCode === 'PSRA2' ? 2 : null;
  if (!session || !PSRA_PAPER_CODES.has(kodSubjek)) return coreMarks;

  const { data: psraMarks, error: psraError } = await supabase
    .from('psra_trial_paper_marks')
    .select('id,student_id,kod_sekolah,class_id,paper_code,markah')
    .eq('class_id', classId)
    .eq('sesi', session)
    .eq('paper_code', kodSubjek);

  let paperRows = psraMarks ?? [];
  if (psraError || paperRows.length === 0) {
    const legacyColumnBySubject: Record<string, string> = {
      AS01: 'akhlak_sirah',
      BA02: 'bahasa_arab',
      JIK03: 'jawi_imlak_khat',
      TF04: 'tauhid_fekah',
      TJ05: 'tajwid',
    };
    const legacyColumn = legacyColumnBySubject[kodSubjek];
    if (legacyColumn) {
      const { data: legacyRows, error: legacyError } = await supabase
        .from('psra_trial_marks')
        .select(`id,student_id,kod_sekolah,class_id,sesi,${legacyColumn}`)
        .eq('class_id', classId)
        .eq('sesi', session);

      if (!legacyError) {
        paperRows = (legacyRows ?? []).map((row: any) => ({
          id: row.id,
          student_id: row.student_id,
          kod_sekolah: row.kod_sekolah,
          class_id: row.class_id,
          paper_code: kodSubjek,
          markah: row[legacyColumn],
        }));
      }
    }
  }

  const byStudent = new Map(coreMarks.map((mark) => [mark.student_id, mark]));
  for (const row of paperRows) {
    const existing = byStudent.get(row.student_id);
    if (existing?.markah !== null && existing?.markah !== undefined) continue;
    byStudent.set(row.student_id, {
      id: `psra:${row.id}`,
      exam_id: examId,
      student_id: row.student_id,
      kod_sekolah: row.kod_sekolah,
      class_id: row.class_id,
      kod_subjek: row.paper_code,
      markah: row.markah === null ? null : Number(row.markah),
    });
  }

  return [...byStudent.values()];
}

export async function getSubjectComponents(): Promise<SubjectComponentRecord[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return mergeSubjectComponents([]);
  const { data, error } = await supabase
    .from('subject_components')
    .select('id,kod_subjek,kod_komponen,nama_komponen,markah_penuh,susunan,status')
    .eq('status', 'AKTIF')
    .order('kod_subjek')
    .order('susunan');

  if (error) return mergeSubjectComponents([]);
  return mergeSubjectComponents((data ?? []) as SubjectComponentRecord[]);
}

export async function getSubjectComponentMarkSettings(): Promise<SubjectComponentMarkSetting[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('subject_component_mark_settings')
    .select('id,tahun_akademik,kod_peperiksaan,tahun,kod_subjek,kod_komponen,markah_penuh,status')
    .eq('status', 'AKTIF')
    .order('tahun_akademik', { ascending: false })
    .order('kod_peperiksaan')
    .order('tahun')
    .order('kod_subjek');

  if (error) return [];
  return (data ?? []).map((item: any) => ({
    ...item,
    markah_penuh: Number(item.markah_penuh),
  }));
}

export async function getMarkComponentsForSelection(
  examId: string,
  classId: string,
  kodSubjek: string,
): Promise<MarkComponentRecord[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase || !examId || !classId || !kodSubjek) return [];
  const { data, error } = await supabase
    .from('mark_components')
    .select('id,exam_id,student_id,kod_sekolah,class_id,kod_subjek,kod_komponen,markah')
    .eq('exam_id', examId)
    .eq('class_id', classId)
    .eq('kod_subjek', kodSubjek);

  if (error) return [];
  return data ?? [];
}

export async function getAttendanceRecords(attendanceDate?: string): Promise<AttendanceRecord[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
  let query = supabase
    .from('daily_attendance')
    .select('id,attendance_date,student_id,kod_sekolah,class_id,status,catatan')
    .order('attendance_date', { ascending: false });

  if (attendanceDate) query = query.eq('attendance_date', attendanceDate);

  const { data, error } = await query.limit(5000);
  if (error) return [];
  return data ?? [];
}

export async function getTakwimEvents(): Promise<TakwimEvent[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('takwim_events')
    .select('id,tahun_akademik,kod_sekolah,scope,kategori,tajuk,tarikh_mula,tarikh_tamat,keterangan,warna,status')
    .eq('status', 'AKTIF')
    .order('tarikh_mula', { ascending: true });

  if (error) return [];
  return (data ?? []) as TakwimEvent[];
}

export async function getAmalKhairCategories(): Promise<AmalKhairCategory[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('amal_khair_categories')
    .select('id,nama_kategori,mata_default,status')
    .eq('status', 'AKTIF')
    .order('nama_kategori');

  if (error) return [];
  return data ?? [];
}

export async function getAmalKhairRecords(): Promise<AmalKhairRecord[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('amal_khair_records')
    .select(
      `
      id,student_id,kod_sekolah,class_id,category_id,mata,catatan,recorded_at,status,
      students(nama_murid),
      amal_khair_categories(nama_kategori)
    `,
    )
    .eq('status', 'AKTIF')
    .order('recorded_at', { ascending: false })
    .limit(500);

  if (error) return [];
  return (data ?? []).map((item: any) => ({
    id: item.id,
    student_id: item.student_id,
    kod_sekolah: item.kod_sekolah,
    class_id: item.class_id,
    category_id: item.category_id,
    mata: item.mata,
    catatan: item.catatan,
    recorded_at: item.recorded_at,
    kategori: Array.isArray(item.amal_khair_categories)
      ? item.amal_khair_categories[0]?.nama_kategori
      : item.amal_khair_categories?.nama_kategori,
    nama_murid: Array.isArray(item.students) ? item.students[0]?.nama_murid : item.students?.nama_murid,
  }));
}

export async function getKhalifahMudaRecords(): Promise<KhalifahMudaRecord[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('khalifah_muda_records')
    .select(
      `
      id,kod_sekolah,class_id,student_id,record_date,record_scope,record_kind,domain,
      indicator_key,indicator_label,points,catatan,recorded_by,created_at,status,
      students(nama_murid)
    `,
    )
    .eq('status', 'AKTIF')
    .order('record_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) return [];

  return (data ?? []).map((item: any) => ({
    id: item.id,
    kod_sekolah: item.kod_sekolah,
    class_id: item.class_id,
    student_id: item.student_id,
    record_date: item.record_date,
    record_scope: item.record_scope,
    record_kind: item.record_kind,
    domain: item.domain,
    indicator_key: item.indicator_key,
    indicator_label: item.indicator_label,
    points: Number(item.points ?? 0),
    catatan: item.catatan,
    recorded_by: item.recorded_by,
    created_at: item.created_at,
    nama_murid: Array.isArray(item.students) ? item.students[0]?.nama_murid : item.students?.nama_murid,
  }));
}

function defaultKhalifahMudaComponents(): KhalifahMudaComponent[] {
  return [
    ...khalifahMudaClassActivities,
    ...khalifahMudaPositiveIndicators,
    ...khalifahMudaGuidanceIndicators,
  ].map((item, index) => ({
    ...item,
    sort_order: index + 1,
    status: 'AKTIF',
  }));
}

export async function getKhalifahMudaComponents(): Promise<KhalifahMudaComponent[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return defaultKhalifahMudaComponents();

  const { data, error } = await supabase
    .from('khalifah_muda_components')
    .select('id,key,label,domain,kind,points,sort_order,status')
    .order('kind')
    .order('sort_order')
    .order('label');

  if (error) return defaultKhalifahMudaComponents();

  return ((data ?? []) as any[]).map((item) => ({
    id: item.id,
    key: item.key,
    label: item.label,
    domain: item.domain,
    kind: item.kind,
    points: Number(item.points ?? 0),
    sort_order: Number(item.sort_order ?? 0),
    status: item.status ?? 'AKTIF',
  }));
}

export async function getSahsiahIhabAssessments(options?: {
  kodSekolah?: string;
  classId?: string;
  tahunAkademik?: number;
  bulan?: number;
}): Promise<SahsiahIhabAssessment[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
  let query = supabase
    .from('sahsiah_ihab_assessments')
    .select('id,kod_sekolah,tahun_akademik,bulan,class_id,student_id,m1_confirmed,m2_confirmed,m3_raw,m3_percent,m4,m5,m6,total_score,grade,band,status,catatan,submitted_at,verified_at,students(nama_murid)')
    .order('tahun_akademik', { ascending: false })
    .order('bulan', { ascending: false })
    .limit(2000);
  if (options?.kodSekolah) query = query.eq('kod_sekolah', options.kodSekolah);
  if (options?.classId) query = query.eq('class_id', options.classId);
  if (options?.tahunAkademik) query = query.eq('tahun_akademik', options.tahunAkademik);
  if (options?.bulan) query = query.eq('bulan', options.bulan);
  const { data, error } = await query;
  if (error) return [];
  return ((data ?? []) as any[]).map((item) => ({
    id: item.id,
    kod_sekolah: item.kod_sekolah,
    tahun_akademik: Number(item.tahun_akademik),
    bulan: Number(item.bulan),
    class_id: item.class_id,
    student_id: item.student_id,
    m1_confirmed: Boolean(item.m1_confirmed),
    m2_confirmed: Boolean(item.m2_confirmed),
    m3_raw: Number(item.m3_raw ?? 0),
    m3Percent: Number(item.m3_percent ?? 0),
    m4: Number(item.m4 ?? 0),
    m5: Number(item.m5 ?? 0),
    m6: Number(item.m6 ?? 0),
    totalScore: Number(item.total_score ?? 0),
    band: Number(item.band ?? 1) as SahsiahIhabAssessment['band'],
    grade: item.grade,
    achievement: sahsiahIhabGradeScale.find((scale) => scale.grade === item.grade)?.achievement ?? 'Perlu Bimbingan',
    status: item.status,
    catatan: item.catatan,
    submitted_at: item.submitted_at,
    verified_at: item.verified_at,
    nama_murid: Array.isArray(item.students) ? item.students[0]?.nama_murid : item.students?.nama_murid,
  }));
}

export async function getTimetableSlots(): Promise<TimetableSlot[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('timetable_slots')
    .select('id,kod_sekolah,hari,waktu_mula,waktu_tamat,label,susunan,status')
    .eq('status', 'AKTIF')
    .order('kod_sekolah')
    .order('susunan')
    .order('waktu_mula');

  if (error) return [];
  return data ?? [];
}

export async function getTimetableEntries(): Promise<TimetableEntry[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('timetable_entries')
      .select('id,slot_id,class_id,kod_sekolah,kod_subjek,kod_komponen,assignment_label,nama_paparan,teacher_id,bilik,status')
    .eq('status', 'AKTIF')
    .order('kod_sekolah');

  if (error) {
    const fallback = await supabase
      .from('timetable_entries')
      .select('id,slot_id,class_id,kod_sekolah,kod_subjek,teacher_id,bilik,status')
      .eq('status', 'AKTIF')
      .order('kod_sekolah');

    if (fallback.error) return [];
    return fallback.data ?? [];
  }
  return data ?? [];
}

export async function getTimetableRequirements(): Promise<TimetableRequirement[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('timetable_requirements')
    .select('id,kod_sekolah,class_id,kod_subjek,kod_komponen,assignment_label,nama_paparan,teacher_id,bil_slot_seminggu,boleh_gabung,status')
    .eq('status', 'AKTIF')
    .order('kod_sekolah')
    .order('class_id');

  if (error) {
    const fallback = await supabase
      .from('timetable_requirements')
      .select('id,kod_sekolah,class_id,kod_subjek,teacher_id,bil_slot_seminggu,status')
      .eq('status', 'AKTIF')
      .order('kod_sekolah')
      .order('class_id');

    if (fallback.error) return [];
    return fallback.data ?? [];
  }
  return data ?? [];
}

export async function getRphRecords(): Promise<RphRecord[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('rph_records')
    .select(
      'id,kod_sekolah,class_id,teacher_id,kod_subjek,tarikh,tajuk,standard_pembelajaran,objektif,aktiviti,bbm,pentaksiran,refleksi,status',
    )
    .order('tarikh', { ascending: false })
    .limit(500);

  if (error) return [];
  return data ?? [];
}

export async function getStudentSummaries(): Promise<StudentSummaryRecord[]> {
  const rows = await fetchStudentSummariesInBatches();
  return rows.sort((a, b) => {
    if (a.kod_sekolah !== b.kod_sekolah) return a.kod_sekolah.localeCompare(b.kod_sekolah);
    if (a.kod_peperiksaan !== b.kod_peperiksaan) return compareExamCode(a.kod_peperiksaan, b.kod_peperiksaan);
    return (b.purata ?? -1) - (a.purata ?? -1);
  });
}

export async function getStudentSummariesByMykid(mykid: string, kodSekolah?: string): Promise<StudentSummaryRecord[]> {
  const supabase = await getSupabaseServerClient();
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
  const supabase = await getSupabaseServerClient();
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

export async function getDashboardInsights(selectedExamKey?: string): Promise<DashboardInsights> {
  const [schools, classes, exams, rules, subjects, schoolSummaries, studentSummaries, students, users, moduleAccesses] = await Promise.all([
    getSchools(),
    getClasses(),
    getExams(),
    getSubjectGradeRules(),
    getSubjects(),
    getSchoolSummaries(),
    fetchStudentSummariesInBatches(),
    fetchStudentsInBatches(),
    getSchoolUsers(),
    getSchoolModuleAccesses(),
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
  const enabledPsraSchools = new Set(
    moduleAccesses
      .filter((access) => access.module_key === 'PERCUBAAN_PSRA' && access.enabled)
      .map((access) => access.kod_sekolah),
  );
  const psraAvailableDistricts = [...new Set(
    schools
      .filter((school) => enabledPsraSchools.has(school.kod_sekolah) && school.daerah)
      .map((school) => school.daerah.toUpperCase()),
  )];

  const latestExam = latestRelevantExam(exams);
  const defaultKey = latestExam
    ? `${latestExam.tahun_akademik}-${latestExam.kod_peperiksaan}`
    : latestExamKey([...schoolSummaries, ...studentSummaries]);
  const currentYear = new Date().getFullYear();
  const standardExams = exams.filter((exam) => isStandardExamCode(exam.kod_peperiksaan));
  const availableExamKeys = new Set(standardExams.map((exam) => `${exam.tahun_akademik}-${exam.kod_peperiksaan}`));
  const psraMatch = selectedExamKey?.match(/^PSRA-(\d{4})-([12])$/);
  const psraSelection = psraMatch
    ? { year: Number(psraMatch[1]), session: Number(psraMatch[2]) as 1 | 2 }
    : null;
  const key = psraSelection
    ? selectedExamKey ?? null
    : selectedExamKey && availableExamKeys.has(selectedExamKey)
      ? selectedExamKey
      : defaultKey;
  const selectedExam = exams.find((exam) => `${exam.tahun_akademik}-${exam.kod_peperiksaan}` === key) ?? latestExam;
  const mainExamOptions = [...new Map(
    standardExams.map((exam) => [
      `${exam.tahun_akademik}-${exam.kod_peperiksaan}`,
      {
        key: `${exam.tahun_akademik}-${exam.kod_peperiksaan}`,
        label: `${exam.kod_peperiksaan} ${exam.tahun_akademik}`,
        group: 'utama' as const,
      },
    ]),
  ).values()];
  const examOptions = [
    ...mainExamOptions,
    {
      key: `PSRA-${currentYear}-1`,
      label: `Percubaan PSRA 1 ${currentYear}`,
      group: 'psra' as const,
    },
    {
      key: `PSRA-${currentYear}-2`,
      label: `Percubaan PSRA 2 ${currentYear}`,
      group: 'psra' as const,
    },
  ];

  if (psraSelection) {
    const classById = new Map(classes.map((classRecord) => [classRecord.id, classRecord]));
    const candidateIdsBySchool = new Map<string, string[]>();
    students.forEach((student) => {
      const classRecord = student.class_id ? classById.get(student.class_id) : undefined;
      if (
        student.status !== 'AKTIF' ||
        !classRecord ||
        classRecord.status !== 'AKTIF' ||
        classRecord.tahun !== 6 ||
        classRecord.tahun_akademik !== psraSelection.year
      ) return;
      const candidateIds = candidateIdsBySchool.get(student.kod_sekolah) ?? [];
      candidateIds.push(student.id);
      candidateIdsBySchool.set(student.kod_sekolah, candidateIds);
    });
    const psraSchools = schools
      .map((school) => ({
        kod_sekolah: school.kod_sekolah,
        nama_sekolah: school.nama_sekolah,
        daerah: school.daerah,
        zon: school.zon,
        candidateIds: candidateIdsBySchool.get(school.kod_sekolah) ?? [],
      }))
      .filter((school) => enabledPsraSchools.has(school.kod_sekolah) && school.candidateIds.length > 0);

    return {
      latestExamLabel: `Percubaan PSRA ${psraSelection.session} ${psraSelection.year}`,
      latestExamKey: key,
      examOptions,
      schoolRanks: [],
      classRanks: [],
      completionSchools: [],
      completionClasses: [],
      teacherClasses: teacherDashboard.teacherClasses,
      teacherSubjects: teacherDashboard.teacherSubjects,
      scopeCounts: baseScopeCounts,
      psraSelection,
      psraAvailableDistricts,
      psraSchools,
    };
  }

  if (!key) {
    return {
      latestExamLabel: 'Belum ada markah',
      latestExamKey: key,
      examOptions,
      schoolRanks: [],
      classRanks: [],
      completionSchools: [],
      completionClasses: [],
      teacherClasses: teacherDashboard.teacherClasses,
      teacherSubjects: teacherDashboard.teacherSubjects,
      scopeCounts: baseScopeCounts,
      psraSelection: null,
      psraAvailableDistricts,
      psraSchools: [],
    };
  }

  const schoolMap = new Map(schools.map((school) => [school.kod_sekolah, school]));
  const classMap = new Map(classes.map((classRecord) => [classRecord.id, classRecord]));
  const marks = selectedExam ? await fetchMarksByExamInBatches(selectedExam.id) : [];
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
        daerah: school?.daerah ?? '',
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
    .filter((classRecord) => !selectedExam || classRecord.tahun_akademik === selectedExam.tahun_akademik)
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
      daerah: school.daerah,
      expected,
      completed,
      percent,
      complete: expected > 0 && completed >= expected,
    });
  });

  const [tahun, exam] = key.split('-');
  return {
    latestExamLabel: `${exam} ${tahun}`,
    latestExamKey: key,
    examOptions,
    schoolRanks,
    classRanks,
    completionSchools: [...schoolCompletionMap.values()].sort((a, b) => a.kod_sekolah.localeCompare(b.kod_sekolah)),
    completionClasses: [...classCompletionMap.values()].sort(
      (a, b) => a.kod_sekolah.localeCompare(b.kod_sekolah) || a.tahun - b.tahun || a.nama_kelas.localeCompare(b.nama_kelas),
    ),
    teacherClasses: teacherDashboard.teacherClasses,
    teacherSubjects: teacherDashboard.teacherSubjects,
    scopeCounts,
    psraSelection: null,
    psraAvailableDistricts,
    psraSchools: [],
  };
}

export async function getSubjectSummaries(): Promise<SubjectSummaryRecord[]> {
  const supabase = await getSupabaseServerClient();
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
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const pageSize = 1000;
  let from = 0;
  const rows: any[] = [];

  while (true) {
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
      .order('kod_subjek')
      .order('id')
      .range(from, from + pageSize - 1);

    if (error) break;
    if (!data || data.length === 0) break;

    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return rows.map((item: any) => ({
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

export async function getPbdMarkDetails(): Promise<PbdMarkDetailRecord[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('pbd_marks')
    .select(
      `
      id,
      assessment_id,
      student_id,
      markah,
      tahap_penguasaan,
      catatan,
      students(id,mykid,nama_murid,jantina,kod_sekolah,class_id,status),
      pbd_assessments(
        id,
        kod_sekolah,
        class_id,
        tahun_akademik,
        kod_subjek,
        teacher_id,
        tarikh,
        tajuk,
        instrumen,
        markah_penuh,
        status,
        subjects(kod_subjek,nama_subjek,markah_penuh,dikira_purata,susunan,status),
        classes(id,kod_sekolah,tahun_akademik,tahun,nama_kelas,status),
        users:app_users(id,email,nama,role,kod_sekolah,status)
      )
    `,
    )
    .order('student_id');

  if (error) return [];
  return (data ?? []).map((item: any) => ({
    id: item.id,
    assessment_id: item.assessment_id,
    student_id: item.student_id,
    markah: item.markah,
    tahap_penguasaan: item.tahap_penguasaan,
    catatan: item.catatan,
    students: Array.isArray(item.students) ? item.students[0] : item.students,
    pbd_assessments: item.pbd_assessments
      ? {
          ...item.pbd_assessments,
          subjects: Array.isArray(item.pbd_assessments.subjects)
            ? item.pbd_assessments.subjects[0]
            : item.pbd_assessments.subjects,
          classes: Array.isArray(item.pbd_assessments.classes)
            ? item.pbd_assessments.classes[0]
            : item.pbd_assessments.classes,
          users: Array.isArray(item.pbd_assessments.users) ? item.pbd_assessments.users[0] : item.pbd_assessments.users,
        }
      : undefined,
  })) as PbdMarkDetailRecord[];
}

export async function getTeacherSubjectAssignments(): Promise<TeacherSubjectAssignment[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('teacher_subject_assignments')
    .select(
      `
      id,
      user_id,
      class_id,
      kod_subjek,
      assignment_label,
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
    assignment_label: item.assignment_label ?? null,
    users: Array.isArray(item.users) ? item.users[0] : item.users,
    classes: Array.isArray(item.classes) ? item.classes[0] : item.classes,
    subjects: Array.isArray(item.subjects) ? item.subjects[0] : item.subjects,
  })) as TeacherSubjectAssignment[];
}

export async function getTeacherSubjectComponentAssignments(): Promise<TeacherSubjectComponentAssignment[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('teacher_subject_component_assignments')
    .select(
      `
      id,
      user_id,
      class_id,
      kod_subjek,
      kod_komponen,
      users:app_users(id,email,nama,role,kod_sekolah,status)
    `,
    )
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data ?? []).map((item: any) => ({
    id: item.id,
    user_id: item.user_id,
    class_id: item.class_id,
    kod_subjek: item.kod_subjek,
    kod_komponen: item.kod_komponen,
    users: Array.isArray(item.users) ? item.users[0] : item.users,
  })) as TeacherSubjectComponentAssignment[];
}

export type SecurityAuditLog = {
  id: number;
  created_at: string;
  actor_email: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  table_name: string;
  record_id: string | null;
  kod_sekolah: string | null;
  changed_fields: string[];
};

export async function getSecurityAuditLogs(limit = 200): Promise<SecurityAuditLog[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 500));
  const { data, error } = await supabase
    .from('security_audit_logs')
    .select('id,created_at,actor_email,action,table_name,record_id,kod_sekolah,changed_fields')
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (error) return [];
  return (data ?? []) as SecurityAuditLog[];
}
