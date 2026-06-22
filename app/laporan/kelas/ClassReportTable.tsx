'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import PrintButton from '../../ui/PrintButton';
import ReportSignatureBlock from '../../ui/ReportSignatureBlock';
import { useAccessProfile } from '../../ui/AuthGate';
import { scopeClasses, scopeSchools } from '../../ui/scopedData';
import type {
  ClassRecord,
  ExamRecord,
  MarkDetailRecord,
  School,
  StudentRecord,
  SubjectRecord,
  TeacherClassAssignment,
} from '@/lib/data';
import { compareExamRecords, isStandardExamCode } from '@/lib/examOrdering';
import { cleanMykid } from '@/lib/mykid';
import {
  allowedSubjectForTahun,
  fallbackSubjectForCode,
  formatGradePoint,
  formatGradePointValue,
  gradeForMark,
  gradePointForMark,
  gradeShortForMark,
  isGradeOnlySubject,
  normalizeSubjectRecord,
  subjectAliasCodes,
  subjectDisplayName,
} from '@/lib/subjects';

const zoneOptions = ['BARAT', 'TIMUR', 'TENGAH'];

type SortDirection = 'asc' | 'desc';
type SortKey = 'gender' | 'mykid' | 'name' | 'total' | 'average' | 'grade' | `subject:${string}`;
type SavedReportFilters = {
  tahunAkademik?: number;
  kodPeperiksaan?: string;
  zon?: string;
  kodSekolah?: string;
  tahunMurid?: string;
  classId?: string;
  sortKey?: SortKey;
  sortDirection?: SortDirection;
};

const reportFilterStorageKey = 'emumtaz:laporan-kelas:filters';

function zoneLabel(zon: string) {
  return `Zon ${zon.charAt(0) + zon.slice(1).toLowerCase()}`;
}

function subjectLabel(subject: SubjectRecord) {
  return subjectDisplayName(subject, subject.kod_subjek);
}

function genderShort(jantina: string | null | undefined) {
  if (!jantina) return '-';
  const value = jantina.toUpperCase();
  if (value.startsWith('L')) return 'L';
  if (value.startsWith('P')) return 'P';
  return jantina;
}

function gradeShort(markah: number | null | undefined) {
  return gradeShortForMark(markah);
}

function scoreClass(markah: number | null | undefined) {
  if (markah === null || markah === undefined || Number.isNaN(markah)) return 'score-cell score-empty';
  if (markah >= 90) return 'score-cell score-excellent';
  if (markah < 40) return 'score-cell score-danger';
  return 'score-cell';
}

function formatExam(exam: ExamRecord | undefined, kodPeperiksaan: string) {
  if (!exam) return kodPeperiksaan;
  return `${exam.kod_peperiksaan} - ${exam.nama_peperiksaan}`;
}

function isMissingNumber(value: number | null | undefined) {
  return value === null || value === undefined || Number.isNaN(value);
}

function compareNullableNumber(a: number | null | undefined, b: number | null | undefined, direction: SortDirection) {
  const aMissing = isMissingNumber(a);
  const bMissing = isMissingNumber(b);
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return direction === 'asc' ? Number(a) - Number(b) : Number(b) - Number(a);
}

function compareText(a: string, b: string, direction: SortDirection) {
  const result = a.localeCompare(b, 'ms', { sensitivity: 'base' });
  return direction === 'asc' ? result : -result;
}

function gradeSortValue(markah: number | null | undefined) {
  if (isMissingNumber(markah)) return null;
  if (Number(markah) >= 90) return 5;
  if (Number(markah) >= 75) return 4;
  if (Number(markah) >= 60) return 3;
  if (Number(markah) >= 40) return 2;
  return 1;
}

function isValidSortKey(value: string | null | undefined): value is SortKey {
  if (!value) return false;
  return ['gender', 'mykid', 'name', 'total', 'average', 'grade'].includes(value) || value.startsWith('subject:');
}

export default function ClassReportTable({
  schools,
  classes,
  students,
  subjects,
  exams,
  marks,
  teacherClassAssignments,
}: {
  schools: School[];
  classes: ClassRecord[];
  students: StudentRecord[];
  subjects: SubjectRecord[];
  exams: ExamRecord[];
  marks: MarkDetailRecord[];
  teacherClassAssignments: TeacherClassAssignment[];
}) {
  const profile = useAccessProfile();
  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    exams.forEach((exam) => years.add(exam.tahun_akademik));
    classes.forEach((classRecord) => years.add(classRecord.tahun_akademik));
    years.add(new Date().getFullYear());
    return [...years].sort((a, b) => b - a);
  }, [classes, exams]);
  const defaultYear = yearOptions.includes(new Date().getFullYear()) ? new Date().getFullYear() : yearOptions[0] ?? 2026;
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedTahun, setSelectedTahun] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filtersReady, setFiltersReady] = useState(false);
  const didRestoreFilters = useRef(false);

  useEffect(() => {
    if (didRestoreFilters.current) return;
    didRestoreFilters.current = true;

    let savedFilters: SavedReportFilters = {};
    try {
      const savedValue = window.localStorage.getItem(reportFilterStorageKey);
      if (savedValue) savedFilters = JSON.parse(savedValue) as SavedReportFilters;
    } catch {
      savedFilters = {};
    }

    const params = new URLSearchParams(window.location.search);
    const yearValue = params.get('tahun') ?? (savedFilters.tahunAkademik ? String(savedFilters.tahunAkademik) : '');
    const nextYear = Number(yearValue);
    if (Number.isFinite(nextYear) && yearOptions.includes(nextYear)) setSelectedYear(nextYear);

    const nextExam = params.get('peperiksaan') ?? savedFilters.kodPeperiksaan ?? '';
    const nextZone = params.get('zon') ?? savedFilters.zon ?? '';
    const nextSchool = params.get('sekolah') ?? savedFilters.kodSekolah ?? '';
    const nextTahun = params.get('tahun_murid') ?? savedFilters.tahunMurid ?? '';
    const nextClass = params.get('kelas') ?? savedFilters.classId ?? '';
    const nextSortKey = params.get('sort') ?? savedFilters.sortKey;
    const nextSortDirection = params.get('arah') ?? savedFilters.sortDirection;

    if (nextExam) setSelectedExam(nextExam);
    if (nextZone) setSelectedZone(nextZone);
    if (nextSchool) setSelectedSchool(nextSchool);
    if (nextTahun) setSelectedTahun(nextTahun);
    if (nextClass) setSelectedClass(nextClass);
    if (isValidSortKey(nextSortKey)) setSortKey(nextSortKey);
    if (nextSortDirection === 'asc' || nextSortDirection === 'desc') setSortDirection(nextSortDirection);

    setFiltersReady(true);
  }, [yearOptions]);

  useEffect(() => {
    if (!filtersReady) return;

    const savedFilters: SavedReportFilters = {
      tahunAkademik: selectedYear,
      kodPeperiksaan: selectedExam,
      zon: selectedZone,
      kodSekolah: selectedSchool,
      tahunMurid: selectedTahun,
      classId: selectedClass,
      sortKey,
      sortDirection,
    };

    try {
      window.localStorage.setItem(reportFilterStorageKey, JSON.stringify(savedFilters));
    } catch {
      // Gagal simpan di browser bukan isu kritikal; URL masih jadi sandaran.
    }

    const params = new URLSearchParams();
    params.set('tahun', String(selectedYear));
    if (selectedExam) params.set('peperiksaan', selectedExam);
    if (selectedZone) params.set('zon', selectedZone);
    if (selectedSchool) params.set('sekolah', selectedSchool);
    if (selectedTahun) params.set('tahun_murid', selectedTahun);
    if (selectedClass) params.set('kelas', selectedClass);
    params.set('sort', sortKey);
    params.set('arah', sortDirection);

    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, [filtersReady, selectedClass, selectedExam, selectedSchool, selectedTahun, selectedYear, selectedZone, sortDirection, sortKey]);

  const isSchoolAdmin = profile?.role === 'ADMIN_SEKOLAH';
  const effectiveZone = profile?.role === 'ADMIN_ZON' ? profile.zon ?? '' : selectedZone;
  const effectiveSchool = isSchoolAdmin ? profile?.kod_sekolah ?? '' : selectedSchool;
  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const schoolOptions = scopedSchools.filter((school) => !effectiveZone || school.zon === effectiveZone);
  const examOptions = exams
    .filter((exam) => exam.tahun_akademik === selectedYear && isStandardExamCode(exam.kod_peperiksaan))
    .sort(compareExamRecords);

  const classOptions = scopedClasses
    .filter((classRecord) => {
      if (classRecord.tahun_akademik !== selectedYear) return false;
      if (effectiveSchool && classRecord.kod_sekolah !== effectiveSchool) return false;
      if (selectedTahun && classRecord.tahun !== Number(selectedTahun)) return false;
      return true;
    })
    .sort(
      (a, b) =>
        a.kod_sekolah.localeCompare(b.kod_sekolah) ||
        a.tahun - b.tahun ||
        a.nama_kelas.localeCompare(b.nama_kelas),
    );

  const selectedClassRecord = classOptions.find((classRecord) => classRecord.id === selectedClass);
  const selectedSchoolRecord = selectedClassRecord
    ? schools.find((school) => school.kod_sekolah === selectedClassRecord.kod_sekolah)
    : undefined;
  const selectedExamRecord = examOptions.find((exam) => exam.id === selectedExam);
  const classTeacher = teacherClassAssignments.find((assignment) => assignment.class_id === selectedClassRecord?.id)?.users;
  const classStudents = students
    .filter((student) => student.class_id === selectedClassRecord?.id && student.status === 'AKTIF')
    .sort((a, b) => a.nama_murid.localeCompare(b.nama_murid));
  const selectedMarks = marks.filter((mark) => mark.exam_id === selectedExam && mark.class_id === selectedClassRecord?.id);
  const subjectMap = useMemo(() => {
    const map = new Map<string, SubjectRecord>();
    subjects.forEach((subject) => {
      const normalized = normalizeSubjectRecord(subject);
      map.set(subject.kod_subjek, normalized);
      map.set(normalized.kod_subjek, normalized);
    });
    return map;
  }, [subjects]);
  const reportSubjects = useMemo(() => {
    if (!selectedClassRecord) return [];
    const allowed = subjects
      .filter((subject) => allowedSubjectForTahun(subject, selectedClassRecord.tahun))
      .map((subject) => normalizeSubjectRecord(subject));
    const fromMarks = selectedMarks
      .map((mark) =>
        subjectMap.get(mark.kod_subjek) ??
        (mark.subjects ? normalizeSubjectRecord(mark.subjects) : fallbackSubjectForCode(mark.kod_subjek)),
      )
      .filter((subject): subject is SubjectRecord => Boolean(subject));
    const merged = new Map<string, SubjectRecord>();
    [...allowed, ...fromMarks].forEach((subject) => merged.set(subject.kod_subjek, subject));
    return [...merged.values()].sort((a, b) => (a.susunan ?? 999) - (b.susunan ?? 999) || a.kod_subjek.localeCompare(b.kod_subjek));
  }, [selectedClassRecord, selectedMarks, subjectMap, subjects]);
  const markMap = useMemo(() => {
    const map = new Map<string, number | null>();
    const setMark = (key: string, markah: number | null) => {
      const existing = map.get(key);
      const existingHasValue = existing !== null && existing !== undefined && Number.isFinite(existing);
      const nextHasValue = markah !== null && markah !== undefined && Number.isFinite(markah);
      if (!map.has(key) || (!existingHasValue && nextHasValue)) {
        map.set(key, markah);
      }
    };

    selectedMarks.forEach((mark) => {
      setMark(`${mark.student_id}|${mark.kod_subjek}`, mark.markah);
      subjectAliasCodes(mark.kod_subjek).forEach((kodSubjek) => {
        setMark(`${mark.student_id}|${kodSubjek}`, mark.markah);
      });
    });
    return map;
  }, [selectedMarks]);

  const reportRows = classStudents
    .map((student) => {
      const subjectMarks = new Map<string, number | null | undefined>();
      reportSubjects.forEach((subject) => {
        subjectMarks.set(subject.kod_subjek, markMap.get(`${student.id}|${subject.kod_subjek}`));
      });
      const validMarks = [...subjectMarks.values()].filter(
        (markah): markah is number => markah !== null && markah !== undefined && Number.isFinite(markah),
      );
      const totalMarks = validMarks.length > 0 ? validMarks.reduce((total, markah) => total + markah, 0) : null;
      const average = validMarks.length > 0 && totalMarks !== null ? Number((totalMarks / validMarks.length).toFixed(2)) : null;

      return {
        student,
        gender: genderShort(student.jantina),
        mykid: cleanMykid(student.mykid),
        subjectMarks,
        totalMarks,
        average,
      };
    })
    .sort((a, b) => {
      if (sortKey === 'gender') return compareText(a.gender, b.gender, sortDirection) || compareText(a.student.nama_murid, b.student.nama_murid, 'asc');
      if (sortKey === 'mykid') return compareText(a.mykid, b.mykid, sortDirection) || compareText(a.student.nama_murid, b.student.nama_murid, 'asc');
      if (sortKey === 'name') return compareText(a.student.nama_murid, b.student.nama_murid, sortDirection);
      if (sortKey === 'total') return compareNullableNumber(a.totalMarks, b.totalMarks, sortDirection) || compareText(a.student.nama_murid, b.student.nama_murid, 'asc');
      if (sortKey === 'average') return compareNullableNumber(a.average, b.average, sortDirection) || compareText(a.student.nama_murid, b.student.nama_murid, 'asc');
      if (sortKey === 'grade') return compareNullableNumber(gradeSortValue(a.average), gradeSortValue(b.average), sortDirection) || compareText(a.student.nama_murid, b.student.nama_murid, 'asc');
      const kodSubjek = sortKey.replace('subject:', '');
      return (
        compareNullableNumber(a.subjectMarks.get(kodSubjek), b.subjectMarks.get(kodSubjek), sortDirection) ||
        compareText(a.student.nama_murid, b.student.nama_murid, 'asc')
      );
    });
  const gpkValues = reportRows
    .map((row) => gradePointForMark(row.average))
    .filter((value): value is number => value !== null);
  const gpk = gpkValues.length > 0 ? gpkValues.reduce((total, value) => total + value, 0) / gpkValues.length : null;

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setSelectedExam('');
    setSelectedSchool('');
    setSelectedTahun('');
    setSelectedClass('');
  };

  const handleSchoolChange = (kodSekolah: string) => {
    setSelectedSchool(kodSekolah);
    setSelectedClass('');
  };

  const toggleSort = (nextSortKey: SortKey) => {
    if (sortKey === nextSortKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection('asc');
  };

  const sortLabel = (key: SortKey) => {
    if (sortKey !== key) return '';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const renderSortButton = (label: string, key: SortKey, title?: string) => (
    <button
      type="button"
      className={sortKey === key ? 'sort-header-button active' : 'sort-header-button'}
      onClick={() => toggleSort(key)}
      title={title ?? `Susun ${label}`}
    >
      <span>{label}</span>
      {sortLabel(key) && <small>{sortLabel(key)}</small>}
    </button>
  );

  return (
    <>
      <div className="panel-head no-print">
        <div>
          <h2>Laporan Markah Kelas</h2>
          <p className="table-note">Pilih kelas dan peperiksaan untuk memaparkan markah murid mengikut subjek.</p>
        </div>
        <div className="row-actions no-print">
          <PrintButton />
        </div>
      </div>

      <div className="report-filter-grid class-report-filter no-print">
        <label>
          Tahun Akademik
          <select value={selectedYear} onChange={(event) => handleYearChange(Number(event.target.value))}>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label>
          Peperiksaan
          <select value={selectedExam} onChange={(event) => setSelectedExam(event.target.value)}>
            <option value="">Pilih peperiksaan</option>
            {examOptions.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.kod_peperiksaan} - {exam.nama_peperiksaan}
              </option>
            ))}
          </select>
        </label>

        {!isSchoolAdmin && (
          <label>
            Zon
            <select
              value={effectiveZone}
              onChange={(event) => {
                setSelectedZone(event.target.value);
                setSelectedSchool('');
                setSelectedClass('');
              }}
              disabled={profile?.role === 'ADMIN_ZON'}
            >
              <option value="">Semua zon</option>
              {zoneOptions.map((zon) => (
                <option key={zon} value={zon}>
                  {zoneLabel(zon)}
                </option>
              ))}
            </select>
          </label>
        )}

        {!isSchoolAdmin && (
          <label>
            Sekolah
            <select value={effectiveSchool} onChange={(event) => handleSchoolChange(event.target.value)}>
              <option value="">Pilih sekolah</option>
              {schoolOptions.map((school) => (
                <option key={school.kod_sekolah} value={school.kod_sekolah}>
                  {school.kod_sekolah} - {school.nama_sekolah}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Tahun Murid
          <select
            value={selectedTahun}
            onChange={(event) => {
              setSelectedTahun(event.target.value);
              setSelectedClass('');
            }}
          >
            <option value="">Semua tahun</option>
            {[1, 2, 3, 4, 5, 6].map((tahun) => (
              <option key={tahun} value={tahun}>
                Tahun {tahun}
              </option>
            ))}
          </select>
        </label>

        <label>
          Kelas
          <select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)}>
            <option value="">Pilih kelas</option>
            {classOptions.map((classRecord) => (
              <option key={classRecord.id} value={classRecord.id}>
                {classRecord.kod_sekolah} - Tahun {classRecord.tahun} {classRecord.nama_kelas}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!selectedExam || !selectedClassRecord ? (
        <p className="empty">Pilih peperiksaan dan kelas untuk memaparkan laporan markah kelas.</p>
      ) : (
        <>
          <div className="class-report-meta">
            <div>
              <span>Sekolah</span>
              <strong>
                {selectedSchoolRecord
                  ? `${selectedSchoolRecord.kod_sekolah} - ${selectedSchoolRecord.nama_sekolah}`
                  : selectedClassRecord.kod_sekolah}
              </strong>
            </div>
            <div>
              <span>Kelas</span>
              <strong>
                Tahun {selectedClassRecord.tahun} - {selectedClassRecord.nama_kelas} / {selectedClassRecord.tahun_akademik}
              </strong>
            </div>
            <div>
              <span>Peperiksaan</span>
              <strong>{formatExam(selectedExamRecord, selectedExam)}</strong>
            </div>
            <div>
              <span>Guru Kelas</span>
              <strong>{classTeacher?.nama ?? '-'}</strong>
            </div>
            <div>
              <span>GPK</span>
              <strong>{formatGradePointValue(gpk)}</strong>
            </div>
          </div>

          <div className="table-scroll class-mark-report">
            <table>
              <thead>
                <tr>
                  <th>Bil</th>
                  <th className="student-name-col">
                    <div className="student-sort-group">
                      {renderSortButton('Nama', 'name')}
                      <span className="student-sort-separator">/</span>
                      {renderSortButton('MyKid', 'mykid')}
                      <span className="student-sort-separator">/</span>
                      {renderSortButton('Jantina', 'gender')}
                    </div>
                  </th>
                  {reportSubjects.map((subject) => (
                    <th key={subject.kod_subjek} title={subject.nama_subjek}>
                      {renderSortButton(subjectLabel(subject), `subject:${subject.kod_subjek}`, subject.nama_subjek)}
                    </th>
                  ))}
                  <th>{renderSortButton('Jumlah', 'total')}</th>
                  <th>{renderSortButton('%', 'average')}</th>
                  <th>{renderSortButton('Gred', 'grade')}</th>
                  <th>GPM</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.length === 0 ? (
                  <tr>
                    <td colSpan={reportSubjects.length + 6}>Tiada murid aktif dalam kelas ini.</td>
                  </tr>
                ) : (
                  reportRows.map(({ student, gender, mykid, subjectMarks, totalMarks, average }, index) => {
                    return (
                      <tr key={student.id}>
                        <td>{index + 1}</td>
                        <td className="student-name-col">
                          <strong>{student.nama_murid}</strong>
                          <small>
                            {mykid} / {student.jantina ?? '-'}
                          </small>
                        </td>
                        {reportSubjects.map((subject) => {
                          const markah = subjectMarks.get(subject.kod_subjek);
                          const hasMark = markah !== null && markah !== undefined && !Number.isNaN(Number(markah));
                          const gradeOnly = isGradeOnlySubject(subject);
                          return (
                            <td key={subject.kod_subjek} className={scoreClass(markah)}>
                              {gradeOnly ? (hasMark ? gradeShort(markah) || '-' : '-') : markah ?? '-'}
                              {!gradeOnly && hasMark && <small>{gradeShort(markah)}</small>}
                            </td>
                          );
                        })}
                        <td className="score-total">{totalMarks ?? '-'}</td>
                        <td>{average ?? '-'}</td>
                        <td>{gradeForMark(average) || '-'}</td>
                        <td>{formatGradePoint(average)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <ReportSignatureBlock />
        </>
      )}
    </>
  );
}
