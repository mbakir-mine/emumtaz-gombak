'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  ClassRecord,
  ExamRecord,
  MarkRecord,
  School,
  SchoolModuleAccess,
  StudentRecord,
  TeacherClassAssignment,
  TeacherSubjectAssignment,
} from '@/lib/data';
import { DEFAULT_UPKK_GRADES, UPKK_WRITTEN_PAPERS, UPKK_WRITTEN_TOTAL_MAX, upkkGrade, upkkPercentage, type UpkkGradeSettings, type UpkkWrittenMark } from '@/lib/upkkTrial';
import { cleanMykid } from '@/lib/mykid';
import { supabase } from '@/lib/supabase';
import { useAccessProfile } from '../../ui/AuthGate';

type Props = {
  schools: School[];
  moduleAccesses: SchoolModuleAccess[];
  classes: ClassRecord[];
  students: StudentRecord[];
  classAssignments: TeacherClassAssignment[];
  subjectAssignments: TeacherSubjectAssignment[];
  exams: ExamRecord[];
};

type ReportType = 'darjah' | 'kelas' | 'individu' | 'subjek' | 'gred';
type CompleteStudent = {
  student: StudentRecord;
  classRecord: ClassRecord;
  marks: Map<string, number>;
  total: number;
  percentage: number;
  gpm: number | null;
  grade: string;
};

const REPORT_TABS: { key: ReportType; label: string }[] = [
  { key: 'darjah', label: 'Tahun' },
  { key: 'kelas', label: 'Kelas' },
  { key: 'individu', label: 'Individu' },
  { key: 'subjek', label: 'Subjek' },
  { key: 'gred', label: 'Bilangan Gred' },
];

const GRADE_NAMES = ['A', 'B', 'C', 'D'];
const GRADE_COLORS: Record<string, string> = {
  A: '#087456',
  B: '#46a978',
  C: '#e2b238',
  D: '#c84d4d',
};

function isActive(status: string | null | undefined) {
  return (status ?? '').toUpperCase() === 'AKTIF';
}

function gradePoint(mark: number, settings: UpkkGradeSettings) {
  const grade = upkkGrade(mark, settings);
  if (grade === 'A') return 1;
  if (grade === 'B') return 2;
  if (grade === 'C') return 3;
  return 4;
}

function pointGrade(point: number | null) {
  if (point === null) return '—';
  if (point <= 1.5) return 'A';
  if (point <= 2.5) return 'B';
  if (point <= 3.5) return 'C';
  return 'D';
}

function average(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function number(value: number | null, digits = 2) {
  return value === null ? '—' : value.toFixed(digits);
}

export default function UpkkReportManager({
  schools,
  moduleAccesses,
  classes,
  students,
  classAssignments,
  subjectAssignments,
  exams,
}: Props) {
  const profile = useAccessProfile();
  const currentYear = new Date().getFullYear();
  const canSelectSchool = profile?.role === 'OWNER' || profile?.role === 'ADMIN_DAERAH';
  const canManageAll = canSelectSchool || profile?.role === 'ADMIN_SEKOLAH';

  const assignedClassIds = useMemo(
    () => new Set(classAssignments.filter((item) => item.user_id === profile?.id).map((item) => item.class_id)),
    [classAssignments, profile?.id],
  );
  const subjectCodesByClass = useMemo(() => {
    const map = new Map<string, Set<string>>();
    subjectAssignments
      .filter((item) => item.user_id === profile?.id)
      .forEach((item) => {
        const codes = map.get(item.class_id) ?? new Set<string>();
        codes.add(item.kod_subjek);
        map.set(item.class_id, codes);
      });
    return map;
  }, [profile?.id, subjectAssignments]);
  const subjectClassIds = useMemo(() => new Set(subjectCodesByClass.keys()), [subjectCodesByClass]);
  const isSubjectOnly = !canManageAll && assignedClassIds.size === 0;

  const selectableSchools = useMemo(() => {
    if (canSelectSchool) return schools.filter((school) => isActive(school.status));
    return schools.filter((school) => school.kod_sekolah === profile?.kod_sekolah);
  }, [canSelectSchool, profile?.kod_sekolah, schools]);
  const years = useMemo(() => {
    const values = new Set<number>([currentYear]);
    classes.forEach((item) => values.add(Number(item.tahun_akademik)));
    return [...values].sort((a, b) => b - a);
  }, [classes, currentYear]);

  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [session, setSession] = useState<1 | 2>(1);
  const [reportType, setReportType] = useState<ReportType>(isSubjectOnly ? 'subjek' : 'darjah');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [schoolStudents, setSchoolStudents] = useState<StudentRecord[]>(students);
  const [records, setRecords] = useState<UpkkWrittenMark[]>([]);
  const [grades, setGrades] = useState<UpkkGradeSettings>({ kod_sekolah: '', ...DEFAULT_UPKK_GRADES });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const availableTabs = useMemo(
    () => REPORT_TABS.filter((tab) => !isSubjectOnly || tab.key === 'subjek' || tab.key === 'gred'),
    [isSubjectOnly],
  );
  useEffect(() => {
    if (!availableTabs.some((tab) => tab.key === reportType)) setReportType(availableTabs[0].key);
  }, [availableTabs, reportType]);
  useEffect(() => {
    if (!selectableSchools.some((school) => school.kod_sekolah === selectedSchool)) {
      setSelectedSchool(selectableSchools[0]?.kod_sekolah ?? '');
    }
  }, [selectableSchools, selectedSchool]);

  const hasModuleAccess =
    profile?.role === 'OWNER' ||
    moduleAccesses.some(
      (item) =>
        item.kod_sekolah === selectedSchool &&
        item.module_key === 'PERCUBAAN_UPKK' &&
        item.enabled,
    );
  const yearFiveClasses = useMemo(
    () =>
      classes
        .filter(
          (item) =>
            item.kod_sekolah === selectedSchool &&
            Number(item.tahun_akademik) === selectedYear &&
            Number(item.tahun) === 5 &&
            isActive(item.status) &&
            (canManageAll || assignedClassIds.has(item.id) || subjectClassIds.has(item.id)),
        )
        .sort((a, b) => a.nama_kelas.localeCompare(b.nama_kelas)),
    [assignedClassIds, canManageAll, classes, selectedSchool, selectedYear, subjectClassIds],
  );

  useEffect(() => {
    let cancelled = false;
    const serverSchoolStudents = students.filter(
      (student) => student.kod_sekolah === selectedSchool && isActive(student.status),
    );

    async function loadSchoolStudents() {
      if (!supabase || !selectedSchool || !hasModuleAccess) {
        if (!cancelled) setSchoolStudents(serverSchoolStudents);
        return;
      }

      const { data, error } = await supabase
        .from('students')
        .select('id,mykid,nama_murid,jantina,kod_sekolah,class_id,status')
        .eq('kod_sekolah', selectedSchool)
        .eq('status', 'AKTIF')
        .order('nama_murid');

      if (!cancelled) {
        setSchoolStudents(error ? serverSchoolStudents : ((data ?? []) as StudentRecord[]));
      }
    }

    void loadSchoolStudents();
    return () => {
      cancelled = true;
    };
  }, [hasModuleAccess, selectedSchool, students]);

  useEffect(() => {
    if (!yearFiveClasses.some((item) => item.id === selectedClassId)) {
      setSelectedClassId(yearFiveClasses[0]?.id ?? '');
    }
  }, [selectedClassId, yearFiveClasses]);

  const visibleStudents = useMemo(() => {
    const classIds = new Set(yearFiveClasses.map((item) => item.id));
    return schoolStudents.filter(
      (item) => item.kod_sekolah === selectedSchool && Boolean(item.class_id && classIds.has(item.class_id)) && isActive(item.status),
    );
  }, [schoolStudents, selectedSchool, yearFiveClasses]);
  const studentsInSelectedClass = useMemo(
    () =>
      visibleStudents
        .filter((item) => item.class_id === selectedClassId)
        .sort((a, b) => a.nama_murid.localeCompare(b.nama_murid)),
    [selectedClassId, visibleStudents],
  );
  useEffect(() => {
    if (!studentsInSelectedClass.some((item) => item.id === selectedStudentId)) {
      setSelectedStudentId(studentsInSelectedClass[0]?.id ?? '');
    }
  }, [selectedStudentId, studentsInSelectedClass]);

  const loadRecords = useCallback(async () => {
    setRecords([]);
    setMessage('');
    if (!supabase || !selectedSchool || !hasModuleAccess) return;
    setLoading(true);
    const exam = exams.find(
      (item) =>
        Number(item.tahun_akademik) === selectedYear &&
        item.kod_peperiksaan.toUpperCase().replace(/[^A-Z0-9]/g, '') === `UPKK${session}`,
    );
    const [paperResult, standardResult, gradesResult] = await Promise.all([
      supabase
        .from('upkk_trial_paper_marks').select('*').eq('kod_sekolah', selectedSchool).eq('tahun_akademik', selectedYear).eq('sesi', session),
      exam
        ? supabase
            .from('marks')
            .select('id,exam_id,student_id,kod_sekolah,class_id,kod_subjek,markah')
            .eq('exam_id', exam.id)
            .eq('kod_sekolah', selectedSchool)
        : Promise.resolve({ data: [] as MarkRecord[], error: null }),
      supabase.from('upkk_trial_grade_settings').select('*').eq('kod_sekolah', selectedSchool).maybeSingle(),
    ]);
    if (gradesResult.data) setGrades(gradesResult.data as UpkkGradeSettings);
    else setGrades({ kod_sekolah: selectedSchool, ...DEFAULT_UPKK_GRADES });
    if (paperResult.error && standardResult.error) {
      setMessage(`Laporan tidak dapat dimuatkan: ${paperResult.error.message}`);
    } else {
      const allowedClassIds = new Set(yearFiveClasses.map((item) => item.id));
      const paperBySubject = new Map(UPKK_WRITTEN_PAPERS.map((paper) => [paper.subjectCode as string, paper.paperCode]));
      const dedicated = (paperResult.data ?? []) as UpkkWrittenMark[];
      const standard = ((standardResult.data ?? []) as MarkRecord[])
        .filter((record) => record.markah !== null && paperBySubject.has(record.kod_subjek))
        .map((record) => ({
          id: record.id,
          kod_sekolah: record.kod_sekolah,
          tahun_akademik: selectedYear,
          class_id: record.class_id,
          student_id: record.student_id,
          sesi: session,
          paper_code: paperBySubject.get(record.kod_subjek)!,
          markah: Number(record.markah),
                    updated_at: '',
        } as UpkkWrittenMark));

      // Markah daripada menu Pemarkahan mengatasi rekod khusus jika kedua-duanya wujud.
      const merged = new Map<string, UpkkWrittenMark>();
      [...dedicated, ...standard].forEach((record) => {
        merged.set(`${record.student_id}|${record.paper_code}`, record);
      });
      setRecords(
        [...merged.values()].filter((record) => {
          if (!allowedClassIds.has(record.class_id)) return false;
          if (canManageAll || assignedClassIds.has(record.class_id)) return true;
          return UPKK_WRITTEN_PAPERS.some((paper) => paper.paperCode === record.paper_code && (subjectCodesByClass.get(record.class_id)?.has(paper.subjectCode) ?? false));
        }),
      );
    }
    setLoading(false);
  }, [
    assignedClassIds,
    canManageAll,
    exams,
    hasModuleAccess,
    selectedSchool,
    selectedYear,
    session,
    subjectCodesByClass,
    yearFiveClasses,
  ]);
  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const marksByStudent = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    records.forEach((record) => {
      const marks = map.get(record.student_id) ?? new Map<string, number>();
      marks.set(record.paper_code, Number(record.markah));
      map.set(record.student_id, marks);
    });
    return map;
  }, [records]);
  const classById = useMemo(() => new Map(yearFiveClasses.map((item) => [item.id, item])), [yearFiveClasses]);
  const teacherNameByClass = useMemo(() => {
    const names = new Map<string, string[]>();
    classAssignments.forEach((assignment) => {
      const teacherName = assignment.users?.nama?.trim();
      if (!teacherName) return;

      const current = names.get(assignment.class_id) ?? [];
      if (!current.includes(teacherName)) current.push(teacherName);
      names.set(assignment.class_id, current);
    });
    return new Map([...names.entries()].map(([classId, teacherNames]) => [classId, teacherNames.join(', ')]));
  }, [classAssignments]);
  const completeStudents = useMemo<CompleteStudent[]>(
    () =>
      visibleStudents.flatMap((student) => {
        const marks = marksByStudent.get(student.id) ?? new Map<string, number>();
        const classRecord = student.class_id ? classById.get(student.class_id) : undefined;
        if (!classRecord) return [];
        const enteredValues = UPKK_WRITTEN_PAPERS.flatMap((paper) => {
          const mark = marks.get(paper.paperCode);
          return mark === undefined ? [] : [mark];
        });
        const values = UPKK_WRITTEN_PAPERS.map((paper) => marks.get(paper.paperCode) ?? 0);
        const total = values.reduce((sum, value) => sum + value, 0);
        const percentage = upkkPercentage(total, UPKK_WRITTEN_TOTAL_MAX);
        return [{
          student,
          classRecord,
          marks,
          total,
          percentage,
          gpm: average(enteredValues.map((mark) => gradePoint(upkkPercentage(mark), grades))),
          grade: enteredValues.length === UPKK_WRITTEN_PAPERS.length ? upkkGrade(percentage, grades) : 'Belum lengkap',
        }];
      }),
    [classById, grades, marksByStudent, visibleStudents],
  );

  const selectedClassResults = useMemo(
    () => completeStudents.filter((item) => item.student.class_id === selectedClassId),
    [completeStudents, selectedClassId],
  );
  const yearFiveStudentRows = useMemo(() => {
    const resultsByStudent = new Map(completeStudents.map((item) => [item.student.id, item]));
    return visibleStudents
      .map((student) => ({
        student,
        classRecord: student.class_id ? classById.get(student.class_id) : undefined,
        marks: marksByStudent.get(student.id),
        result: resultsByStudent.get(student.id),
      }))
      .sort((a, b) => {
        const classOrder = (a.classRecord?.nama_kelas ?? '').localeCompare(b.classRecord?.nama_kelas ?? '');
        return classOrder || a.student.nama_murid.localeCompare(b.student.nama_murid);
      });
  }, [classById, completeStudents, marksByStudent, visibleStudents]);
  const gps = average(completeStudents.flatMap((item) => item.gpm === null ? [] : [item.gpm]));
  const schoolAverage = average(completeStudents.map((item) => item.percentage));
  const aCount = completeStudents.filter((item) => item.grade === 'A').length;

  const subjectSummaries = useMemo(
    () =>
      UPKK_WRITTEN_PAPERS.flatMap((paper) => {
        if (isSubjectOnly && ![...subjectCodesByClass.values()].some((codes) => codes.has(paper.subjectCode))) return [];
        const values = records.filter((record) => record.paper_code === paper.paperCode).map((record) => Number(record.markah));
        const gpmp = average(values.map((mark) => gradePoint(upkkPercentage(mark), grades)));
        const counts = Object.fromEntries(GRADE_NAMES.map((grade) => [grade, values.filter((mark) => upkkGrade(upkkPercentage(mark), grades) === grade).length]));
        return [{
          paper,
          values,
          average: average(values),
          pass: values.filter((mark) => upkkPercentage(mark) >= grades.grade_c_min).length,
          gpmp,
          counts,
        }];
      }),
    [grades, isSubjectOnly, records, subjectCodesByClass],
  );
  const gradeRanges = useMemo(() => {
    const minA = Math.ceil((grades.grade_a_min / 100) * UPKK_WRITTEN_TOTAL_MAX);
    const minB = Math.ceil((grades.grade_b_min / 100) * UPKK_WRITTEN_TOTAL_MAX);
    const minC = Math.ceil((grades.grade_c_min / 100) * UPKK_WRITTEN_TOTAL_MAX);
    return [`${minA}-${UPKK_WRITTEN_TOTAL_MAX}`, `${minB}-<${minA}`, `${minC}-<${minB}`, `0-<${minC}`];
  }, [grades.grade_a_min, grades.grade_b_min, grades.grade_c_min]);

  const overallGradeCounts = useMemo(
    () =>
      Object.fromEntries(
        GRADE_NAMES.map((grade) => [
          grade,
          completeStudents.filter((item) => item.grade === grade).length,
        ]),
      ) as Record<string, number>,
    [completeStudents],
  );

  const selectedIndividual = completeStudents.find((item) => item.student.id === selectedStudentId);
  const selectedStudent = studentsInSelectedClass.find((item) => item.id === selectedStudentId);
  const selectedStudentMarks = selectedStudent ? marksByStudent.get(selectedStudent.id) : undefined;
  const selectedSchoolRecord = selectableSchools.find((item) => item.kod_sekolah === selectedSchool);
  const selectedSchoolName = selectedSchoolRecord?.nama_sekolah ?? selectedSchool;
  const selectedClassRecord = classById.get(selectedClassId);
  const selectedClassTeacherName = selectedClassId ? teacherNameByClass.get(selectedClassId) ?? '—' : '—';

  if (!hasModuleAccess) {
    return <div className="empty-state">Sekolah ini belum diberi akses kepada modul Percubaan UPKK.</div>;
  }

  return (
    <div className="psra-report-shell">
      <section className="psra-report-heading">
        <div>
          <span>PENILAIAN SEKOLAH RENDAH AGAMA</span>
          <h2>Laporan Percubaan UPKK Tahun 5</h2>
          <p>{selectedSchoolName || 'Pilih sekolah untuk memaparkan laporan.'}</p>
        </div>
        <div className="psra-report-actions">
          <Link href="/percubaan-upkk">Kemasukan Markah</Link>
          <button type="button" onClick={() => window.print()}>Cetak Laporan</button>
        </div>
      </section>

      <section className="psra-report-filters">
        {canSelectSchool ? (
          <label>Sekolah
            <select value={selectedSchool} onChange={(event) => setSelectedSchool(event.target.value)}>
              {selectableSchools.map((school) => <option key={school.kod_sekolah} value={school.kod_sekolah}>{school.kod_sekolah} - {school.nama_sekolah}</option>)}
            </select>
          </label>
        ) : (
          <div className="psra-school-display">
            <span>Sekolah</span>
            <strong>
              {selectableSchools[0]
                ? `${selectableSchools[0].kod_sekolah} - ${selectableSchools[0].nama_sekolah}`
                : 'Sekolah tidak ditemui'}
            </strong>
          </div>
        )}
        <label>Tahun Akademik
          <select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
        <label>Peperiksaan
          <select value={session} onChange={(event) => setSession(Number(event.target.value) as 1 | 2)}>
            <option value={1}>Percubaan UPKK 1</option>
            <option value={2}>Percubaan UPKK 2</option>
          </select>
        </label>
      </section>

      <nav className="psra-report-tabs" aria-label="Jenis laporan">
        {availableTabs.map((tab) => (
          <button key={tab.key} type="button" className={reportType === tab.key ? 'active' : ''} onClick={() => setReportType(tab.key)}>
            {tab.label}
          </button>
        ))}
      </nav>

      {message ? <div className="form-message error">{message}</div> : null}
      {loading ? <div className="empty-state">Memuatkan laporan...</div> : (
        <>
          <section className="psra-report-metrics">
            <div><span>Purata Sekolah</span><strong>{number(schoolAverage, 1)}%</strong><small>Markah purata</small></div>
            <div><span>GPS</span><strong>{number(gps)}</strong><small>{pointGrade(gps)}</small></div>
            <div><span>Calon Dipapar</span><strong>{completeStudents.length}</strong><small>daripada {visibleStudents.length} calon</small></div>
            <div><span>Pencapaian A</span><strong>{aCount}</strong><small>{grades.grade_a_min}% dan ke atas</small></div>
          </section>

          {reportType === 'darjah' ? (
            <ReportSection
              title="Laporan Keseluruhan Tahun 5"
              className="psra-year-print-report"
              subtitle={`Gabungan semua kelas Tahun 5 · Percubaan UPKK ${session} · ${selectedYear}`}
            >
              <header className="psra-year-print-header">
                <h2>{selectedSchoolRecord?.nama_sekolah ?? selectedSchool}</h2>
                <p>
                  {selectedSchoolRecord
                    ? `${selectedSchoolRecord.kod_sekolah} · ${selectedSchoolRecord.daerah}${selectedSchoolRecord.zon ? ` · Zon ${selectedSchoolRecord.zon}` : ''}`
                    : 'Alamat Sekolah'}
                </p>
                <h3>Keputusan Percubaan UPKK {session} (Keseluruhan Tahun 5)</h3>
              </header>
              <ReportTable headers={['Nama Murid', 'Kelas', ...UPKK_WRITTEN_PAPERS.map((paper) => paper.code.replace('UPKK ', '')), 'Jumlah', 'Peratus', 'Gred', 'GPM']}>
                {yearFiveStudentRows.map((item) => (
                  <tr key={item.student.id}>
                    <th>{item.student.nama_murid}</th>
                    <td>{item.classRecord?.nama_kelas ?? '—'}</td>
                    {UPKK_WRITTEN_PAPERS.map((paper) => (
                      <td key={paper.subjectCode}>{item.marks?.get(paper.paperCode) ?? '—'}</td>
                    ))}
                    <td>{item.result ? item.result.total : 'Belum lengkap'}</td>
                    <td>{item.result ? number(item.result.percentage, 1) : '—'}</td>
                    <td>{item.result?.grade ?? '—'}</td>
                    <td>{item.result ? number(item.result.gpm) : '—'}</td>
                  </tr>
                ))}
              </ReportTable>
              <p className="psra-report-footnote">
                Jumlah keseluruhan: <strong>{visibleStudents.length} murid</strong> daripada {yearFiveClasses.length} kelas
                {' · '}
                Dipapar: <strong>{completeStudents.length}</strong>
                {' · '}
                GPS: <strong>{number(gps)}</strong>
              </p>
            </ReportSection>
          ) : null}

          {reportType === 'kelas' ? (
            <ReportSection title="Laporan Kelas" subtitle="GPK dikira daripada purata mata gred setiap murid yang lengkap." className="psra-year-print-report psra-class-print-report">
              <header className="psra-year-print-header">
                <h2>{selectedSchoolRecord?.nama_sekolah ?? selectedSchool}</h2>
                <p>
                  {selectedSchoolRecord
                    ? `${selectedSchoolRecord.kod_sekolah} · ${selectedSchoolRecord.daerah}${selectedSchoolRecord.zon ? ` · Zon ${selectedSchoolRecord.zon}` : ''}`
                    : 'Alamat Sekolah'}
                </p>
                <h3>Keputusan Percubaan UPKK {session} (Laporan Kelas)</h3>
              </header>
              <dl className="psra-class-print-meta">
                <div><dt>Nama Kelas :</dt><dd>{selectedClassRecord?.nama_kelas ?? '—'}</dd></div>
                <div><dt>Nama Guru Kelas :</dt><dd>{selectedClassTeacherName}</dd></div>
              </dl>
              <InlineFilters classes={yearFiveClasses} selectedClassId={selectedClassId} setSelectedClassId={setSelectedClassId} />
              <ReportTable headers={['Nama Murid', ...UPKK_WRITTEN_PAPERS.map((paper) => paper.code.replace('UPKK ', '')), 'Jumlah', 'Peratus', 'Gred', 'GPM']}>
                {selectedClassResults.map((item) => (
                  <tr key={item.student.id}>
                    <th>{item.student.nama_murid}</th>
                    {UPKK_WRITTEN_PAPERS.map((paper) => <td key={paper.subjectCode}>{item.marks.get(paper.paperCode) ?? '—'}</td>)}
                    <td>{item.total}</td><td>{number(item.percentage, 1)}</td><td>{item.grade}</td><td>{number(item.gpm)}</td>
                  </tr>
                ))}
              </ReportTable>
              <p className="psra-report-footnote">GPK kelas: <strong>{number(average(selectedClassResults.flatMap((item) => item.gpm === null ? [] : [item.gpm])))}</strong></p>
            </ReportSection>
          ) : null}

          {reportType === 'individu' ? (
            <ReportSection title="Laporan Individu" subtitle="Prestasi calon bagi semua enam kertas bertulis.">
              <div className="psra-individual-layout">
                <aside className="psra-individual-list-box">
                  <header className="psra-individual-box-header">
                    <h4>Kotak 1: Senarai murid dalam kelas</h4>
                    <p>Pilih kelas dan murid untuk paparan cetakan.</p>
                  </header>
                  <InlineFilters classes={yearFiveClasses} selectedClassId={selectedClassId} setSelectedClassId={setSelectedClassId} />
                  <div className="psra-individual-student-list" aria-label="Senarai murid dalam kelas">
                    {studentsInSelectedClass.map((student) => {
                      const item = completeStudents.find((record) => record.student.id === student.id);
                      return (
                        <button
                          key={student.id}
                          type="button"
                          className={student.id === selectedStudentId ? 'active' : ''}
                          onClick={() => setSelectedStudentId(student.id)}
                        >
                          <strong>{student.nama_murid}</strong>
                          <span>{item ? item.grade : 'Belum lengkap'}</span>
                        </button>
                      );
                    })}
                    {!studentsInSelectedClass.length ? <p className="empty">Tiada murid untuk kelas ini.</p> : null}
                  </div>
                </aside>

                <article className="psra-individual-preview-box">
                  <header className="psra-individual-box-header">
                    <h4>Kotak 2: Paparan Cetakan Laporan Individu</h4>
                    <p>Tekan Cetak Laporan selepas memilih murid.</p>
                  </header>
                  {selectedStudent ? (
                    <IndividualUPKKPrint
                      school={selectedSchoolRecord}
                      title={`Keputusan Ujian Percubaan UPKK ${session}`}
                      student={selectedStudent}
                      classRecord={selectedIndividual?.classRecord ?? classById.get(selectedStudent.class_id ?? '')}
                      classTeacherName={selectedStudent.class_id ? teacherNameByClass.get(selectedStudent.class_id) : undefined}
                      marks={selectedStudentMarks}
                      result={selectedIndividual}
                      grades={grades}
                    />
                  ) : <div className="empty-state">Pilih murid untuk memaparkan laporan individu.</div>}
                </article>
              </div>
            </ReportSection>
          ) : null}

          {reportType === 'subjek' ? (
            <div className="psra-report-pair psra-subject-print-report">
              <header className="psra-subject-print-header">
                <h2>{selectedSchoolRecord?.nama_sekolah ?? selectedSchool}</h2>
                <p>
                  {selectedSchoolRecord
                    ? `${selectedSchoolRecord.kod_sekolah} · ${selectedSchoolRecord.daerah}${selectedSchoolRecord.zon ? ` · Zon ${selectedSchoolRecord.zon}` : ''}`
                    : 'Alamat Sekolah'}
                </p>
                <h3>Laporan Mata Pelajaran Percubaan UPKK {session}</h3>
              </header>
              <ReportSection
                title="Laporan Mata Pelajaran"
                subtitle="Bilangan murid mengikut gred bagi setiap mata pelajaran serta Gred Purata Mata Pelajaran (GPMP)."
                className="psra-subject-print-table"
              >
                <ReportTable headers={['Mata Pelajaran', ...GRADE_NAMES, 'Jumlah Murid', 'GPMP']}>
                  {subjectSummaries.map((item) => (
                    <tr key={item.paper.subjectCode}>
                      <th>{item.paper.label}</th>
                      {GRADE_NAMES.map((grade) => <td key={grade}>{item.counts[grade]}</td>)}
                      <td>{item.values.length}</td>
                      <td>{number(item.gpmp)}</td>
                    </tr>
                  ))}
                </ReportTable>
              </ReportSection>
              <SubjectGradeChart
                title="Graf Taburan Gred Mengikut Mata Pelajaran"
                subtitle={`${selectedSchoolName} · Percubaan UPKK ${session} · ${selectedYear}`}
                rows={subjectSummaries.map((item) => ({
                  label: item.paper.label,
                  counts: item.counts,
                  total: item.values.length,
                }))}
              />
            </div>
          ) : null}

          {reportType === 'gred' ? (
            <div className="psra-report-pair">
              <ReportSection
                title="Laporan Bilangan Gred Keseluruhan"
                subtitle="Gred keseluruhan dikira daripada jumlah enam mata pelajaran bagi setiap calon (markah penuh 420)."
              >
                <ReportTable headers={['Gred Keseluruhan', 'Julat Markah', 'Bilangan Murid', 'Peratus Calon Dipapar']}>
                  {GRADE_NAMES.map((grade, index) => (
                    <tr key={grade}>
                      <th>{grade}</th>
                      <td>{gradeRanges[index]}</td>
                      <td>{overallGradeCounts[grade]}</td>
                      <td>
                        {completeStudents.length
                          ? `${number((overallGradeCounts[grade] / completeStudents.length) * 100, 1)}%`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </ReportTable>
                <p className="psra-report-footnote">
                  Jumlah calon dipapar: <strong>{completeStudents.length}</strong>
                  {' · '}
                  GPS: <strong>{number(gps)}</strong>
                </p>
              </ReportSection>
              <OverallGradeChart
                title="Graf Bilangan Gred Keseluruhan"
                subtitle={`${selectedSchoolName} · Percubaan UPKK ${session} · ${selectedYear} · Gabungan enam mata pelajaran`}
                counts={overallGradeCounts}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function ReportSection({ title, subtitle, children, className }: { title: string; subtitle: string; children: ReactNode; className?: string }) {
  return <section className={className ? `psra-report-panel ${className}` : 'psra-report-panel'}><header><div><h3>{title}</h3><p>{subtitle}</p></div></header>{children}</section>;
}

function ReportTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <div className="psra-report-table-wrap"><table className="psra-report-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}

function IndividualUPKKPrint({
  school,
  title,
  student,
  classRecord,
  classTeacherName,
  marks,
  result,
  grades,
}: {
  school: School | undefined;
  title: string;
  student: StudentRecord;
  classRecord: ClassRecord | undefined;
  classTeacherName: string | undefined;
  marks: Map<string, number> | undefined;
  result: CompleteStudent | undefined;
  grades: UpkkGradeSettings;
}) {
  return (
    <article className="psra-individual-print">
      <header className="psra-individual-print-school">
        <h2>{school?.nama_sekolah ?? student.kod_sekolah}</h2>
        <p>{school ? `${school.kod_sekolah} · ${school.daerah}${school.zon ? ` · Zon ${school.zon}` : ''}` : 'Alamat Sekolah'}</p>
      </header>

      <h3>{title}</h3>

      <dl className="psra-individual-print-profile">
        <div><dt>Nama Murid :</dt><dd>{student.nama_murid}</dd></div>
        <div><dt>No Mykid :</dt><dd>{cleanMykid(student.mykid)}</dd></div>
        <div><dt>Kelas :</dt><dd>{classRecord?.nama_kelas ?? '—'}</dd></div>
        <div><dt>Nama Guru Kelas:</dt><dd>{classTeacherName ?? '—'}</dd></div>
      </dl>

      <section className="psra-individual-print-subjects">
        <h4>Keputusan Bagi setiap mata pelajaran</h4>
        <table>
          <thead>
            <tr>
              <th>Mata Pelajaran</th>
              <th>Kod</th>
              <th>Markah Diperolehi</th>
              <th>Gred</th>
            </tr>
          </thead>
          <tbody>
            {UPKK_WRITTEN_PAPERS.map((paper) => {
              const mark = marks?.get(paper.paperCode);
              return (
                <tr key={paper.subjectCode}>
                  <td>{paper.label}</td>
                  <td>{paper.subjectCode}</td>
                  <td>{mark ?? '—'}</td>
                  <td>{mark === undefined ? '—' : upkkGrade(upkkPercentage(mark), grades)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <dl className="psra-individual-print-summary">
        <div><dt>Jumlah Markah keseluruhan :</dt><dd>{result ? `${result.total}/${UPKK_WRITTEN_TOTAL_MAX}` : 'Belum lengkap'}</dd></div>
        <div><dt>Gred :</dt><dd>{result?.grade ?? 'Belum lengkap'}</dd></div>
        <div><dt>Gred Purata Murid:</dt><dd>{result ? number(result.gpm) : 'Belum lengkap'}</dd></div>
      </dl>
    </article>
  );
}

function ChartLegend() {
  return (
    <div className="psra-chart-legend" aria-label="Petunjuk gred">
      {GRADE_NAMES.map((grade) => (
        <span key={grade}><i style={{ backgroundColor: GRADE_COLORS[grade] }} />{grade}</span>
      ))}
    </div>
  );
}

function SubjectGradeChart({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: { label: string; counts: Record<string, number>; total: number }[];
}) {
  const maximum = Math.max(1, ...rows.map((row) => row.total));
  return (
    <section className="psra-report-chart-page" aria-label={title}>
      <header><span>GRAF LAPORAN</span><h3>{title}</h3><p>{subtitle}</p></header>
      <ChartLegend />
      <div className="psra-stacked-chart">
        {rows.map((row) => (
          <div className="psra-stacked-row" key={row.label}>
            <strong>{row.label}</strong>
            <div className="psra-chart-track">
              {GRADE_NAMES.map((grade) => {
                const count = row.counts[grade] ?? 0;
                return count ? (
                  <span
                    key={grade}
                    title={`${grade}: ${count}`}
                    style={{ width: `${(count / maximum) * 100}%`, backgroundColor: GRADE_COLORS[grade] }}
                  >
                    {count}
                  </span>
                ) : null;
              })}
              {!row.total ? <em>Tiada markah direkodkan</em> : null}
            </div>
            <b>{row.total}</b>
          </div>
        ))}
      </div>
      <div className="psra-chart-scale"><span>0 murid</span><span>Maksimum {maximum} murid</span></div>
    </section>
  );
}

function OverallGradeChart({
  title,
  subtitle,
  counts,
}: {
  title: string;
  subtitle: string;
  counts: Record<string, number>;
}) {
  const maximum = Math.max(1, ...GRADE_NAMES.map((grade) => counts[grade] ?? 0));
  return (
    <section className="psra-report-chart-page" aria-label={title}>
      <header><span>GRAF LAPORAN</span><h3>{title}</h3><p>{subtitle}</p></header>
      <div className="psra-grade-bar-chart">
        {GRADE_NAMES.map((grade) => {
          const count = counts[grade] ?? 0;
          return (
            <div className="psra-grade-bar-row" key={grade}>
              <strong>{grade}</strong>
              <div className="psra-chart-track">
                <span style={{ width: `${(count / maximum) * 100}%`, backgroundColor: GRADE_COLORS[grade] }}>
                  {count ? count : ''}
                </span>
              </div>
              <b>{count}</b>
            </div>
          );
        })}
      </div>
      <div className="psra-chart-scale"><span>0 murid</span><span>Maksimum {maximum} murid</span></div>
    </section>
  );
}

function InlineFilters({
  classes,
  selectedClassId,
  setSelectedClassId,
}: {
  classes: ClassRecord[];
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
}) {
  return <label className="psra-class-filter">Kelas
    <select value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)}>
      {classes.map((item) => <option key={item.id} value={item.id}>{item.nama_kelas}</option>)}
    </select>
  </label>;
}




