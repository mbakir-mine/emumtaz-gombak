'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  ClassRecord,
  School,
  SchoolModuleAccess,
  StudentRecord,
  TeacherClassAssignment,
  TeacherSubjectAssignment,
} from '@/lib/data';
import { PSRA_PAPERS, psraGrade, type PsraPaperMarkRecord } from '@/lib/psra';
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
  { key: 'darjah', label: 'Darjah' },
  { key: 'kelas', label: 'Kelas' },
  { key: 'individu', label: 'Individu' },
  { key: 'subjek', label: 'Subjek' },
  { key: 'gred', label: 'Bilangan Gred' },
];

const GRADE_NAMES = ['Mumtaz', 'Jayyid Jiddan', 'Jayyid', 'Maqbul', 'Musaadah'];
const GRADE_COLORS: Record<string, string> = {
  Mumtaz: '#087456',
  'Jayyid Jiddan': '#46a978',
  Jayyid: '#e2b238',
  Maqbul: '#e78338',
  Musaadah: '#c84d4d',
};

function isActive(status: string | null | undefined) {
  return (status ?? '').toUpperCase() === 'AKTIF';
}

function gradePoint(mark: number) {
  if (mark >= 90) return 1;
  if (mark >= 75) return 2;
  if (mark >= 60) return 3;
  if (mark >= 40) return 4;
  return 5;
}

function pointGrade(point: number | null) {
  if (point === null) return '—';
  if (point <= 1.5) return 'Mumtaz';
  if (point <= 2.5) return 'Jayyid Jiddan';
  if (point <= 3.5) return 'Jayyid';
  if (point <= 4.5) return 'Maqbul';
  return 'Musaadah';
}

function average(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function number(value: number | null, digits = 2) {
  return value === null ? '—' : value.toFixed(digits);
}

export default function PsraReportManager({
  schools,
  moduleAccesses,
  classes,
  students,
  classAssignments,
  subjectAssignments,
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
  const [records, setRecords] = useState<PsraPaperMarkRecord[]>([]);
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
        item.module_key === 'PERCUBAAN_PSRA' &&
        item.enabled,
    );
  const yearSixClasses = useMemo(
    () =>
      classes
        .filter(
          (item) =>
            item.kod_sekolah === selectedSchool &&
            Number(item.tahun_akademik) === selectedYear &&
            Number(item.tahun) === 6 &&
            isActive(item.status) &&
            (canManageAll || assignedClassIds.has(item.id) || subjectClassIds.has(item.id)),
        )
        .sort((a, b) => a.nama_kelas.localeCompare(b.nama_kelas)),
    [assignedClassIds, canManageAll, classes, selectedSchool, selectedYear, subjectClassIds],
  );

  useEffect(() => {
    if (!yearSixClasses.some((item) => item.id === selectedClassId)) {
      setSelectedClassId(yearSixClasses[0]?.id ?? '');
    }
  }, [selectedClassId, yearSixClasses]);

  const visibleStudents = useMemo(() => {
    const classIds = new Set(yearSixClasses.map((item) => item.id));
    return students.filter(
      (item) => item.kod_sekolah === selectedSchool && Boolean(item.class_id && classIds.has(item.class_id)) && isActive(item.status),
    );
  }, [selectedSchool, students, yearSixClasses]);
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
    const { data, error } = await supabase
      .from('psra_trial_paper_marks')
      .select('*')
      .eq('kod_sekolah', selectedSchool)
      .eq('tahun_akademik', selectedYear)
      .eq('sesi', session);
    if (error) {
      setMessage(`Laporan tidak dapat dimuatkan: ${error.message}`);
    } else {
      const allowedClassIds = new Set(yearSixClasses.map((item) => item.id));
      setRecords(
        ((data ?? []) as PsraPaperMarkRecord[]).filter((record) => {
          if (!allowedClassIds.has(record.class_id)) return false;
          if (canManageAll || assignedClassIds.has(record.class_id)) return true;
          return subjectCodesByClass.get(record.class_id)?.has(record.paper_code) ?? false;
        }),
      );
    }
    setLoading(false);
  }, [
    assignedClassIds,
    canManageAll,
    hasModuleAccess,
    selectedSchool,
    selectedYear,
    session,
    subjectCodesByClass,
    yearSixClasses,
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
  const classById = useMemo(() => new Map(yearSixClasses.map((item) => [item.id, item])), [yearSixClasses]);
  const completeStudents = useMemo<CompleteStudent[]>(
    () =>
      visibleStudents.flatMap((student) => {
        const marks = marksByStudent.get(student.id) ?? new Map<string, number>();
        const classRecord = student.class_id ? classById.get(student.class_id) : undefined;
        if (!classRecord) return [];
        const enteredValues = PSRA_PAPERS.flatMap((paper) => {
          const mark = marks.get(paper.subjectCode);
          return mark === undefined ? [] : [mark];
        });
        const values = PSRA_PAPERS.map((paper) => marks.get(paper.subjectCode) ?? 0);
        const total = values.reduce((sum, value) => sum + value, 0);
        const percentage = total / PSRA_PAPERS.length;
        return [{
          student,
          classRecord,
          marks,
          total,
          percentage,
          gpm: average(enteredValues.map(gradePoint)),
          grade: enteredValues.length ? psraGrade(percentage) : 'Belum lengkap',
        }];
      }),
    [classById, marksByStudent, visibleStudents],
  );

  const selectedClassResults = useMemo(
    () => completeStudents.filter((item) => item.student.class_id === selectedClassId),
    [completeStudents, selectedClassId],
  );
  const yearSixStudentRows = useMemo(() => {
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
  const mumtazCount = completeStudents.filter((item) => item.grade === 'Mumtaz').length;

  const subjectSummaries = useMemo(
    () =>
      PSRA_PAPERS.flatMap((paper) => {
        if (isSubjectOnly && ![...subjectCodesByClass.values()].some((codes) => codes.has(paper.subjectCode))) return [];
        const values = records.filter((record) => record.paper_code === paper.subjectCode).map((record) => Number(record.markah));
        const gpmp = average(values.map(gradePoint));
        const counts = Object.fromEntries(GRADE_NAMES.map((grade) => [grade, values.filter((mark) => psraGrade(mark) === grade).length]));
        return [{
          paper,
          values,
          average: average(values),
          pass: values.filter((mark) => mark >= 40).length,
          gpmp,
          counts,
        }];
      }),
    [isSubjectOnly, records, subjectCodesByClass],
  );
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

  if (!hasModuleAccess) {
    return <div className="empty-state">Sekolah ini belum diberi akses kepada modul Percubaan PSRA.</div>;
  }

  return (
    <div className="psra-report-shell">
      <section className="psra-report-heading">
        <div>
          <span>PENILAIAN SEKOLAH RENDAH AGAMA</span>
          <h2>Laporan Percubaan PSRA Tahun 6</h2>
          <p>{selectedSchoolName || 'Pilih sekolah untuk memaparkan laporan.'}</p>
        </div>
        <div className="psra-report-actions">
          <Link href="/percubaan-psra">Kemasukan Markah</Link>
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
            <option value={1}>Percubaan PSRA 1</option>
            <option value={2}>Percubaan PSRA 2</option>
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
            <div><span>Pencapaian Mumtaz</span><strong>{mumtazCount}</strong><small>90% dan ke atas</small></div>
          </section>

          {reportType === 'darjah' ? (
            <ReportSection
              title="Laporan Keseluruhan Darjah 6"
              className="psra-year-print-report"
              subtitle={`Gabungan semua kelas Tahun 6 · Percubaan PSRA ${session} · ${selectedYear}`}
            >
              <header className="psra-year-print-header">
                <h2>{selectedSchoolRecord?.nama_sekolah ?? selectedSchool}</h2>
                <p>
                  {selectedSchoolRecord
                    ? `${selectedSchoolRecord.kod_sekolah} · ${selectedSchoolRecord.daerah}${selectedSchoolRecord.zon ? ` · Zon ${selectedSchoolRecord.zon}` : ''}`
                    : 'Alamat Sekolah'}
                </p>
                <h3>Keputusan Percubaan PSRA {session} (Keseluruhan Tahun 6)</h3>
              </header>
              <ReportTable headers={['Nama Murid', 'Kelas', ...PSRA_PAPERS.map((paper) => paper.shortLabel), 'Jumlah', 'Peratus', 'Pangkat', 'GPM']}>
                {yearSixStudentRows.map((item) => (
                  <tr key={item.student.id}>
                    <th>{item.student.nama_murid}</th>
                    <td>{item.classRecord?.nama_kelas ?? '—'}</td>
                    {PSRA_PAPERS.map((paper) => (
                      <td key={paper.subjectCode}>{item.marks?.get(paper.subjectCode) ?? '—'}</td>
                    ))}
                    <td>{item.result ? item.result.total : 'Belum lengkap'}</td>
                    <td>{item.result ? number(item.result.percentage, 1) : '—'}</td>
                    <td>{item.result?.grade ?? '—'}</td>
                    <td>{item.result ? number(item.result.gpm) : '—'}</td>
                  </tr>
                ))}
              </ReportTable>
              <p className="psra-report-footnote">
                Jumlah keseluruhan: <strong>{visibleStudents.length} murid</strong> daripada {yearSixClasses.length} kelas
                {' · '}
                Dipapar: <strong>{completeStudents.length}</strong>
                {' · '}
                GPS: <strong>{number(gps)}</strong>
              </p>
            </ReportSection>
          ) : null}

          {reportType === 'kelas' ? (
            <ReportSection title="Laporan Kelas" subtitle="GPK dikira daripada purata mata gred setiap murid yang lengkap.">
              <InlineFilters classes={yearSixClasses} selectedClassId={selectedClassId} setSelectedClassId={setSelectedClassId} />
              <ReportTable headers={['Murid', ...PSRA_PAPERS.map((paper) => paper.shortLabel), 'Jumlah', '%', 'GPM', 'Gred']}>
                {selectedClassResults.map((item) => (
                  <tr key={item.student.id}>
                    <th>{item.student.nama_murid}</th>
                    {PSRA_PAPERS.map((paper) => <td key={paper.subjectCode}>{item.marks.get(paper.subjectCode) ?? '—'}</td>)}
                    <td>{item.total}/500</td><td>{number(item.percentage, 1)}</td><td>{number(item.gpm)}</td><td>{item.grade}</td>
                  </tr>
                ))}
              </ReportTable>
              <p className="psra-report-footnote">GPK kelas: <strong>{number(average(selectedClassResults.flatMap((item) => item.gpm === null ? [] : [item.gpm])))}</strong></p>
            </ReportSection>
          ) : null}

          {reportType === 'individu' ? (
            <ReportSection title="Laporan Individu" subtitle="Prestasi calon bagi semua lima kertas.">
              <div className="psra-individual-layout">
                <aside className="psra-individual-list-box">
                  <header className="psra-individual-box-header">
                    <h4>Kotak 1: Senarai murid dalam kelas</h4>
                    <p>Pilih kelas dan murid untuk paparan cetakan.</p>
                  </header>
                  <InlineFilters classes={yearSixClasses} selectedClassId={selectedClassId} setSelectedClassId={setSelectedClassId} />
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
                    <IndividualPsraPrint
                      school={selectedSchoolRecord}
                      title={`Keputusan Ujian Percubaan PSRA ${session}`}
                      student={selectedStudent}
                      classRecord={selectedIndividual?.classRecord ?? classById.get(selectedStudent.class_id ?? '')}
                      marks={selectedStudentMarks}
                      result={selectedIndividual}
                    />
                  ) : <div className="empty-state">Pilih murid untuk memaparkan laporan individu.</div>}
                </article>
              </div>
            </ReportSection>
          ) : null}

          {reportType === 'subjek' ? (
            <div className="psra-report-pair">
              <ReportSection
                title="Laporan Mata Pelajaran"
                subtitle="Bilangan murid mengikut gred bagi setiap mata pelajaran serta Gred Purata Mata Pelajaran (GPMP)."
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
                subtitle={`${selectedSchoolName} · Percubaan PSRA ${session} · ${selectedYear}`}
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
                subtitle="Gred keseluruhan dikira daripada jumlah lima mata pelajaran bagi setiap calon (markah penuh 500)."
              >
                <ReportTable headers={['Gred Keseluruhan', 'Julat Markah', 'Bilangan Murid', 'Peratus Calon Dipapar']}>
                  {GRADE_NAMES.map((grade, index) => (
                    <tr key={grade}>
                      <th>{grade}</th>
                      <td>{['450–500', '375–<450', '300–<375', '200–<300', '0–<200'][index]}</td>
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
                subtitle={`${selectedSchoolName} · Percubaan PSRA ${session} · ${selectedYear} · Gabungan lima mata pelajaran`}
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

function IndividualPsraPrint({
  school,
  title,
  student,
  classRecord,
  marks,
  result,
}: {
  school: School | undefined;
  title: string;
  student: StudentRecord;
  classRecord: ClassRecord | undefined;
  marks: Map<string, number> | undefined;
  result: CompleteStudent | undefined;
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
        <div><dt>Nama Guru Kelas:</dt><dd /></div>
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
            {PSRA_PAPERS.map((paper) => {
              const mark = marks?.get(paper.subjectCode);
              return (
                <tr key={paper.subjectCode}>
                  <td>{paper.label}</td>
                  <td>{paper.subjectCode}</td>
                  <td>{mark ?? '—'}</td>
                  <td>{mark === undefined ? '—' : psraGrade(mark)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <dl className="psra-individual-print-summary">
        <div><dt>Jumlah Markah keseluruhan :</dt><dd>{result ? `${result.total}/500` : 'Belum lengkap'}</dd></div>
        <div><dt>Pangkat :</dt><dd>{result?.grade ?? 'Belum lengkap'}</dd></div>
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
