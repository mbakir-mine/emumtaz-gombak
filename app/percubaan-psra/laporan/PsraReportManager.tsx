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
  gpm: number;
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
  const canManageAll = profile?.role === 'OWNER' || profile?.role === 'ADMIN_SEKOLAH';

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
    if (profile?.role === 'OWNER') return schools.filter((school) => isActive(school.status));
    return schools.filter((school) => school.kod_sekolah === profile?.kod_sekolah);
  }, [profile?.kod_sekolah, profile?.role, schools]);
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
        const marks = marksByStudent.get(student.id);
        const classRecord = student.class_id ? classById.get(student.class_id) : undefined;
        if (!marks || !classRecord || !PSRA_PAPERS.every((paper) => marks.has(paper.subjectCode))) return [];
        const values = PSRA_PAPERS.map((paper) => marks.get(paper.subjectCode) ?? 0);
        const total = values.reduce((sum, value) => sum + value, 0);
        const percentage = total / PSRA_PAPERS.length;
        return [{
          student,
          classRecord,
          marks,
          total,
          percentage,
          gpm: average(values.map(gradePoint)) ?? 0,
          grade: psraGrade(percentage),
        }];
      }),
    [classById, marksByStudent, visibleStudents],
  );

  const selectedClassResults = useMemo(
    () => completeStudents.filter((item) => item.student.class_id === selectedClassId),
    [completeStudents, selectedClassId],
  );
  const gps = average(completeStudents.map((item) => item.gpm));
  const schoolAverage = average(completeStudents.map((item) => item.percentage));
  const mumtazCount = completeStudents.filter((item) => item.grade === 'Mumtaz').length;

  const classSummaries = useMemo(
    () =>
      yearSixClasses.map((classRecord) => {
        const candidates = visibleStudents.filter((item) => item.class_id === classRecord.id);
        const results = completeStudents.filter((item) => item.student.class_id === classRecord.id);
        const gpk = average(results.map((item) => item.gpm));
        return {
          classRecord,
          candidates: candidates.length,
          complete: results.length,
          average: average(results.map((item) => item.percentage)),
          gpk,
          mumtaz: results.filter((item) => item.grade === 'Mumtaz').length,
          musaadah: results.filter((item) => item.grade === 'Musaadah').length,
        };
      }),
    [completeStudents, visibleStudents, yearSixClasses],
  );

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

  const selectedIndividual = completeStudents.find((item) => item.student.id === selectedStudentId);
  const selectedStudent = studentsInSelectedClass.find((item) => item.id === selectedStudentId);
  const selectedStudentMarks = selectedStudent ? marksByStudent.get(selectedStudent.id) : undefined;
  const selectedSchoolName = selectableSchools.find((item) => item.kod_sekolah === selectedSchool)?.nama_sekolah ?? selectedSchool;

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
        <label>Sekolah
          <select value={selectedSchool} onChange={(event) => setSelectedSchool(event.target.value)}>
            {selectableSchools.map((school) => <option key={school.kod_sekolah} value={school.kod_sekolah}>{school.kod_sekolah} - {school.nama_sekolah}</option>)}
          </select>
        </label>
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
            <div><span>Calon Lengkap</span><strong>{completeStudents.length}</strong><small>daripada {visibleStudents.length} calon</small></div>
            <div><span>Pencapaian Mumtaz</span><strong>{mumtazCount}</strong><small>90% dan ke atas</small></div>
          </section>

          {reportType === 'darjah' ? (
            <ReportSection title="Laporan Darjah Tahun 6" subtitle={`Percubaan PSRA ${session} · ${selectedYear}`}>
              <ReportTable headers={['Kelas', 'Calon', 'Lengkap', 'Purata %', 'GPK', 'Gred Purata', 'Mumtaz', 'Musaadah']}>
                {classSummaries.map((item) => (
                  <tr key={item.classRecord.id}>
                    <th>{item.classRecord.nama_kelas}</th><td>{item.candidates}</td><td>{item.complete}</td>
                    <td>{number(item.average, 1)}</td><td>{number(item.gpk)}</td><td>{pointGrade(item.gpk)}</td>
                    <td>{item.mumtaz}</td><td>{item.musaadah}</td>
                  </tr>
                ))}
              </ReportTable>
            </ReportSection>
          ) : null}

          {reportType === 'kelas' ? (
            <ReportSection title="Laporan Kelas" subtitle="GPK dikira daripada purata mata gred setiap murid yang lengkap.">
              <InlineFilters classes={yearSixClasses} selectedClassId={selectedClassId} setSelectedClassId={setSelectedClassId} />
              <ReportTable headers={['Murid', ...PSRA_PAPERS.map((paper) => paper.shortLabel), 'Jumlah', '%', 'GPM', 'Gred']}>
                {selectedClassResults.map((item) => (
                  <tr key={item.student.id}>
                    <th>{item.student.nama_murid}<small>{item.student.mykid}</small></th>
                    {PSRA_PAPERS.map((paper) => <td key={paper.subjectCode}>{item.marks.get(paper.subjectCode)}</td>)}
                    <td>{item.total}/500</td><td>{number(item.percentage, 1)}</td><td>{number(item.gpm)}</td><td>{item.grade}</td>
                  </tr>
                ))}
              </ReportTable>
              <p className="psra-report-footnote">GPK kelas: <strong>{number(average(selectedClassResults.map((item) => item.gpm)))}</strong></p>
            </ReportSection>
          ) : null}

          {reportType === 'individu' ? (
            <ReportSection title="Laporan Individu" subtitle="Prestasi calon bagi semua lima kertas.">
              <div className="psra-inline-filters">
                <InlineFilters classes={yearSixClasses} selectedClassId={selectedClassId} setSelectedClassId={setSelectedClassId} />
                <label>Murid
                  <select value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)}>
                    {studentsInSelectedClass.map((student) => <option key={student.id} value={student.id}>{student.nama_murid}</option>)}
                  </select>
                </label>
              </div>
              {selectedStudent ? (
                <div className="psra-individual-card">
                  <header><div><span>Nama Murid</span><strong>{selectedStudent.nama_murid}</strong><small>{selectedStudent.mykid}</small></div>
                    <div><span>GPM</span><strong>{selectedIndividual ? number(selectedIndividual.gpm) : 'Belum lengkap'}</strong><small>{selectedIndividual?.grade ?? '—'}</small></div></header>
                  <ReportTable headers={['Mata Pelajaran', 'Markah', 'Gred', 'Mata Gred']}>
                    {PSRA_PAPERS.map((paper) => {
                      const mark = selectedStudentMarks?.get(paper.subjectCode);
                      return <tr key={paper.subjectCode}><th>{paper.label}</th><td>{mark ?? '—'}</td><td>{mark === undefined ? '—' : psraGrade(mark)}</td><td>{mark === undefined ? '—' : gradePoint(mark)}</td></tr>;
                    })}
                  </ReportTable>
                </div>
              ) : <div className="empty-state">Tiada murid untuk kelas ini.</div>}
            </ReportSection>
          ) : null}

          {reportType === 'subjek' ? (
            <ReportSection title="Laporan Mata Pelajaran" subtitle="GPMP ialah purata mata gred bagi semua markah yang telah direkodkan.">
              <ReportTable headers={['Mata Pelajaran', 'Bil. Markah', 'Purata %', 'Lulus', '% Lulus', 'GPMP', 'Gred Purata']}>
                {subjectSummaries.map((item) => (
                  <tr key={item.paper.subjectCode}><th>{item.paper.label}</th><td>{item.values.length}</td><td>{number(item.average, 1)}</td>
                    <td>{item.pass}</td><td>{item.values.length ? number((item.pass / item.values.length) * 100, 1) : '—'}</td>
                    <td>{number(item.gpmp)}</td><td>{pointGrade(item.gpmp)}</td></tr>
                ))}
              </ReportTable>
            </ReportSection>
          ) : null}

          {reportType === 'gred' ? (
            <ReportSection title="Laporan Bilangan Gred" subtitle="Taburan pencapaian bagi setiap mata pelajaran.">
              <ReportTable headers={['Mata Pelajaran', ...GRADE_NAMES, 'Jumlah', 'GPMP']}>
                {subjectSummaries.map((item) => (
                  <tr key={item.paper.subjectCode}><th>{item.paper.label}</th>
                    {GRADE_NAMES.map((grade) => <td key={grade}>{item.counts[grade]}</td>)}
                    <td>{item.values.length}</td><td>{number(item.gpmp)}</td></tr>
                ))}
              </ReportTable>
            </ReportSection>
          ) : null}
        </>
      )}
    </div>
  );
}

function ReportSection({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <section className="psra-report-panel"><header><div><h3>{title}</h3><p>{subtitle}</p></div></header>{children}</section>;
}

function ReportTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <div className="psra-report-table-wrap"><table className="psra-report-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
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
