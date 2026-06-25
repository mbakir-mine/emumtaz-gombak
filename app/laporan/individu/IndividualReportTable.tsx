'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAccessProfile } from '../../ui/AuthGate';
import { scopeClasses, scopeSchools } from '../../ui/scopedData';
import type { ClassRecord, MarkDetailRecord, School, StudentSummaryRecord, TeacherClassAssignment } from '@/lib/data';
import { compareExamCode, normalizeExamCode } from '@/lib/examOrdering';
import { cleanMykid } from '@/lib/mykid';
import {
  fallbackSubjectForCode,
  formatGradePointValue,
  gradeForMark,
  gradePointForMark,
  isGradeOnlySubject,
  normalizeSubjectRecord,
} from '@/lib/subjects';

const yearOptions = [2025, 2026, 2027, 2028, 2029, 2030];
const zoneOptions = ['BARAT', 'TIMUR', 'TENGAH'];
const studentYears = [1, 2, 3, 4, 5, 6];
const profileExamOrder = ['UPSA', 'UASA', 'PBD'];

type SortDirection = 'asc' | 'desc';
type StudentSearchSortKey = 'name' | 'yearCount' | 'examCount' | 'latestAverage' | 'latestGpm';
type SavedIndividualReportState = {
  selectedYear?: number;
  selectedZone?: string;
  selectedSchool?: string;
  selectedTahun?: string;
  selectedClass?: string;
  searchTerm?: string;
  submittedSearchTerm?: string;
  showResults?: boolean;
  selectedStudentKey?: string;
  sortKey?: StudentSearchSortKey;
  sortDirection?: SortDirection;
};

type StudentProfileRecord = {
  key: string;
  student_id: string;
  mykid: string;
  nama_murid: string;
  records: StudentSummaryRecord[];
  latest: StudentSummaryRecord;
};

function summaryRecordKey(
  item: Pick<StudentSummaryRecord, 'student_id' | 'tahun_akademik' | 'kod_peperiksaan' | 'class_id'>,
) {
  return `${item.student_id}|${item.tahun_akademik}|${normalizeExamCode(item.kod_peperiksaan)}|${item.class_id}`;
}

function markDetailSummaryKey(mark: MarkDetailRecord) {
  if (!mark.exams) return '';
  return `${mark.student_id}|${mark.exams.tahun_akademik}|${normalizeExamCode(mark.exams.kod_peperiksaan)}|${mark.class_id}`;
}

function gpmFromMarks(marks: MarkDetailRecord[]) {
  const gradePoints = marks
    .filter((mark) => {
      const subject = mark.subjects ? normalizeSubjectRecord(mark.subjects) : fallbackSubjectForCode(mark.kod_subjek);
      if (isGradeOnlySubject(subject ?? mark.kod_subjek)) return false;
      return mark.markah !== null && mark.markah !== undefined && Number.isFinite(Number(mark.markah));
    })
    .map((mark) => gradePointForMark(Number(mark.markah)))
    .filter((point): point is number => point !== null && Number.isFinite(point));

  if (gradePoints.length === 0) return null;
  return gradePoints.reduce((total, point) => total + point, 0) / gradePoints.length;
}

const individualReportStorageKey = 'emumtaz:laporan-individu:state';

function zoneLabel(zon: string) {
  return `Zon ${zon.charAt(0) + zon.slice(1).toLowerCase()}`;
}

function normalizeText(value: string | number | null | undefined) {
  return String(value ?? '').trim().toLowerCase();
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

function defaultDirectionForSort(key: StudentSearchSortKey): SortDirection {
  return key === 'name' ? 'asc' : 'desc';
}

function isValidStudentSearchSortKey(value: string | null | undefined): value is StudentSearchSortKey {
  return Boolean(value && ['name', 'yearCount', 'examCount', 'latestAverage', 'latestGpm'].includes(value));
}

function isIndividualReportExam(code: string | null | undefined) {
  const normalized = normalizeExamCode(code);
  return normalized === 'UPSA' || normalized === 'UASA' || normalized === 'PBD';
}

function studentProfileKey(item: StudentSummaryRecord) {
  return cleanMykid(item.mykid) || item.student_id;
}

function classLabel(classRecord: ClassRecord | undefined) {
  if (!classRecord) return '-';
  return `Tahun ${classRecord.tahun} - ${classRecord.nama_kelas}`;
}

function schoolLabel(schoolRecord: School | undefined, kodSekolah: string) {
  return schoolRecord ? `${schoolRecord.kod_sekolah} - ${schoolRecord.nama_sekolah}` : kodSekolah;
}

function uniqueValues(values: Array<string | number | null | undefined>) {
  return [...new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))];
}

function compareRecordsNewest(
  a: StudentSummaryRecord,
  b: StudentSummaryRecord,
  classById: Map<string, ClassRecord>,
) {
  const academicDiff = b.tahun_akademik - a.tahun_akademik;
  if (academicDiff !== 0) return academicDiff;

  const classYearDiff = (classById.get(b.class_id)?.tahun ?? 0) - (classById.get(a.class_id)?.tahun ?? 0);
  if (classYearDiff !== 0) return classYearDiff;

  return compareExamCode(b.kod_peperiksaan, a.kod_peperiksaan);
}

function compareStudentProfiles(
  a: StudentProfileRecord,
  b: StudentProfileRecord,
  key: StudentSearchSortKey,
  direction: SortDirection,
  getGpm: (record: StudentSummaryRecord) => number | null,
) {
  if (key === 'name') return compareText(a.nama_murid, b.nama_murid, direction);
  if (key === 'yearCount') {
    const aYears = new Set(a.records.map((item) => item.tahun_akademik)).size;
    const bYears = new Set(b.records.map((item) => item.tahun_akademik)).size;
    return compareNullableNumber(aYears, bYears, direction) || compareText(a.nama_murid, b.nama_murid, 'asc');
  }
  if (key === 'examCount') {
    return (
      compareNullableNumber(a.records.length, b.records.length, direction) ||
      compareText(a.nama_murid, b.nama_murid, 'asc')
    );
  }
  if (key === 'latestAverage') {
    return (
      compareNullableNumber(a.latest.purata, b.latest.purata, direction) ||
      compareText(a.nama_murid, b.nama_murid, 'asc')
    );
  }
  return (
    compareNullableNumber(getGpm(a.latest), getGpm(b.latest), direction) ||
    compareText(a.nama_murid, b.nama_murid, 'asc')
  );
}

function formatExamCell(item: StudentSummaryRecord | undefined, gpm: number | null | undefined) {
  if (!item) return '-';
  const average = item.purata ?? '-';
  const grade = gradeForMark(item.purata) || '-';
  return `${average} | ${grade} | GPM ${formatGradePointValue(gpm)}`;
}

export default function IndividualReportTable({
  schools,
  classes,
  summaries,
  teacherClassAssignments,
  marks,
}: {
  schools: School[];
  classes: ClassRecord[];
  summaries: StudentSummaryRecord[];
  teacherClassAssignments: TeacherClassAssignment[];
  marks: MarkDetailRecord[];
}) {
  const profile = useAccessProfile();
  const currentYear = new Date().getFullYear();
  const defaultYear = yearOptions.includes(currentYear) ? currentYear : 2026;
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedTahun, setSelectedTahun] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedStudentKey, setSelectedStudentKey] = useState('');
  const [sortKey, setSortKey] = useState<StudentSearchSortKey>('latestAverage');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [stateReady, setStateReady] = useState(false);
  const didRestoreState = useRef(false);

  useEffect(() => {
    if (didRestoreState.current) return;
    didRestoreState.current = true;

    let savedState: SavedIndividualReportState = {};
    try {
      const savedValue = window.localStorage.getItem(individualReportStorageKey);
      if (savedValue) savedState = JSON.parse(savedValue) as SavedIndividualReportState;
    } catch {
      savedState = {};
    }

    const params = new URLSearchParams(window.location.search);
    const yearValue = params.get('tahun') ?? (savedState.selectedYear ? String(savedState.selectedYear) : '');
    const nextYear = Number(yearValue);
    if (Number.isFinite(nextYear) && yearOptions.includes(nextYear)) setSelectedYear(nextYear);

    const nextZone = params.get('zon') ?? savedState.selectedZone ?? '';
    const nextSchool = params.get('sekolah') ?? savedState.selectedSchool ?? '';
    const nextTahun = params.get('tahun_murid') ?? savedState.selectedTahun ?? '';
    const nextClass = params.get('kelas') ?? savedState.selectedClass ?? '';
    const nextSearch = params.get('cari') ?? savedState.searchTerm ?? '';
    const nextSubmittedSearch = params.get('carian') ?? savedState.submittedSearchTerm ?? nextSearch;
    const nextShowResults = params.get('papar') ?? (savedState.showResults ? '1' : '');
    const nextStudentKey = params.get('murid') ?? savedState.selectedStudentKey ?? '';
    const nextSortKey = params.get('sort') ?? savedState.sortKey;
    const nextSortDirection = params.get('arah') ?? savedState.sortDirection;

    if (nextZone) setSelectedZone(nextZone);
    if (nextSchool) setSelectedSchool(nextSchool);
    if (nextTahun) setSelectedTahun(nextTahun);
    if (nextClass) setSelectedClass(nextClass);
    if (nextSearch) setSearchTerm(nextSearch);
    if (nextSubmittedSearch) setSubmittedSearchTerm(nextSubmittedSearch);
    if (nextShowResults === '1') setShowResults(true);
    if (nextStudentKey) setSelectedStudentKey(nextStudentKey);
    if (isValidStudentSearchSortKey(nextSortKey)) setSortKey(nextSortKey);
    if (nextSortDirection === 'asc' || nextSortDirection === 'desc') setSortDirection(nextSortDirection);

    setStateReady(true);
  }, []);

  useEffect(() => {
    if (!stateReady) return;

    const savedState: SavedIndividualReportState = {
      selectedYear,
      selectedZone,
      selectedSchool,
      selectedTahun,
      selectedClass,
      searchTerm,
      submittedSearchTerm,
      showResults,
      selectedStudentKey,
      sortKey,
      sortDirection,
    };

    try {
      window.localStorage.setItem(individualReportStorageKey, JSON.stringify(savedState));
    } catch {
      // Kegagalan localStorage bukan ralat kritikal; URL masih jadi sandaran refresh.
    }

    const params = new URLSearchParams();
    params.set('tahun', String(selectedYear));
    if (selectedZone) params.set('zon', selectedZone);
    if (selectedSchool) params.set('sekolah', selectedSchool);
    if (selectedTahun) params.set('tahun_murid', selectedTahun);
    if (selectedClass) params.set('kelas', selectedClass);
    if (searchTerm) params.set('cari', searchTerm);
    if (submittedSearchTerm) params.set('carian', submittedSearchTerm);
    if (showResults) params.set('papar', '1');
    if (selectedStudentKey) params.set('murid', selectedStudentKey);
    params.set('sort', sortKey);
    params.set('arah', sortDirection);

    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, [
    searchTerm,
    selectedClass,
    selectedSchool,
    selectedStudentKey,
    selectedTahun,
    selectedYear,
    selectedZone,
    showResults,
    sortDirection,
    sortKey,
    stateReady,
    submittedSearchTerm,
  ]);

  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const classById = useMemo(() => new Map(scopedClasses.map((item) => [item.id, item])), [scopedClasses]);
  const schoolByCode = useMemo(() => new Map(scopedSchools.map((item) => [item.kod_sekolah, item])), [scopedSchools]);
  const marksBySummaryKey = useMemo(() => {
    const groups = new Map<string, MarkDetailRecord[]>();

    marks.forEach((mark) => {
      const key = markDetailSummaryKey(mark);
      if (!key) return;
      const rows = groups.get(key) ?? [];
      rows.push(mark);
      groups.set(key, rows);
    });

    return groups;
  }, [marks]);
  const gpmBySummaryKey = useMemo(() => {
    const map = new Map<string, number | null>();

    summaries.forEach((summary) => {
      const key = summaryRecordKey(summary);
      map.set(key, gpmFromMarks(marksBySummaryKey.get(key) ?? []));
    });

    return map;
  }, [marksBySummaryKey, summaries]);
  const summaryGpm = (summary: StudentSummaryRecord | undefined) => {
    if (!summary) return null;
    return gpmBySummaryKey.get(summaryRecordKey(summary)) ?? null;
  };
  const isClassTeacher = profile?.role === 'GURU_KELAS';
  const isSchoolAdmin = profile?.role === 'ADMIN_SEKOLAH';
  const hideSchoolScopeFilters = isClassTeacher || isSchoolAdmin;

  const teacherClassIds = useMemo(() => {
    if (!isClassTeacher || !profile) return new Set<string>();
    return new Set(
      teacherClassAssignments
        .filter((assignment) => assignment.user_id === profile.id)
        .map((assignment) => assignment.class_id),
    );
  }, [isClassTeacher, profile, teacherClassAssignments]);

  const effectiveZone = profile?.role === 'ADMIN_ZON' ? profile.zon ?? '' : selectedZone;
  const effectiveSchool = hideSchoolScopeFilters ? profile?.kod_sekolah ?? '' : selectedSchool;
  const schoolOptions = scopedSchools.filter((school) => !effectiveZone || school.zon === effectiveZone);

  const classOptions = scopedClasses.filter((item) => {
    if (item.tahun_akademik !== selectedYear) return false;
    if (isClassTeacher && !teacherClassIds.has(item.id)) return false;
    if (effectiveSchool && item.kod_sekolah !== effectiveSchool) return false;
    if (selectedTahun && item.tahun !== Number(selectedTahun)) return false;
    return true;
  });

  const allowedSchools = new Set(schoolOptions.map((school) => school.kod_sekolah));

  const resetResults = () => {
    setShowResults(false);
    setSelectedStudentKey('');
  };

  const allScopedSummaries = useMemo(() => {
    return summaries.filter((item) => {
      if (!isIndividualReportExam(item.kod_peperiksaan)) return false;
      if (isClassTeacher && !teacherClassIds.has(item.class_id)) return false;
      if (!classById.has(item.class_id)) return false;
      if (!allowedSchools.has(item.kod_sekolah)) return false;
      if (effectiveSchool && item.kod_sekolah !== effectiveSchool) return false;
      return true;
    });
  }, [allowedSchools, classById, effectiveSchool, isClassTeacher, summaries, teacherClassIds]);

  const allStudentProfiles = useMemo(() => {
    const grouped = new Map<string, StudentSummaryRecord[]>();

    allScopedSummaries.forEach((item) => {
      const key = studentProfileKey(item);
      const rows = grouped.get(key) ?? [];
      rows.push(item);
      grouped.set(key, rows);
    });

    return [...grouped.entries()].map(([key, records]) => {
      const orderedRecords = [...records].sort((a, b) => compareRecordsNewest(a, b, classById));
      const latest = orderedRecords[0];

      return {
        key,
        student_id: latest.student_id,
        mykid: cleanMykid(latest.mykid),
        nama_murid: latest.nama_murid,
        records: orderedRecords,
        latest,
      };
    });
  }, [allScopedSummaries, classById]);

  const allStudentProfileMap = useMemo(() => {
    return new Map(allStudentProfiles.map((item) => [item.key, item]));
  }, [allStudentProfiles]);

  const searchMatchedProfiles = useMemo(() => {
    const submitted = normalizeText(submittedSearchTerm);
    const matchedKeys = new Set<string>();

    allScopedSummaries.forEach((item) => {
      if (item.tahun_akademik !== selectedYear) return;
      const classRecord = classById.get(item.class_id);
      if (selectedTahun && classRecord?.tahun !== Number(selectedTahun)) return;
      if (selectedClass && item.class_id !== selectedClass) return;

      const schoolRecord = schoolByCode.get(item.kod_sekolah);
      const haystack = normalizeText(
        [
          item.nama_murid,
          cleanMykid(item.mykid),
          item.kod_sekolah,
          schoolRecord?.nama_sekolah,
          classRecord?.nama_kelas,
          classRecord?.tahun,
        ].join(' '),
      );

      if (submitted && !haystack.includes(submitted)) return;
      matchedKeys.add(studentProfileKey(item));
    });

    return [...matchedKeys]
      .map((key) => allStudentProfileMap.get(key))
      .filter((item): item is StudentProfileRecord => Boolean(item))
      .sort((a, b) =>
        compareStudentProfiles(
          a,
          b,
          sortKey,
          sortDirection,
          (record) => gpmBySummaryKey.get(summaryRecordKey(record)) ?? null,
        ),
      );
  }, [
    allScopedSummaries,
    allStudentProfileMap,
    classById,
    gpmBySummaryKey,
    schoolByCode,
    selectedClass,
    selectedTahun,
    selectedYear,
    sortDirection,
    sortKey,
    submittedSearchTerm,
  ]);

  const selectedStudentProfile = selectedStudentKey ? allStudentProfileMap.get(selectedStudentKey) : undefined;

  const toggleSort = (nextSortKey: StudentSearchSortKey) => {
    if (sortKey === nextSortKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection(defaultDirectionForSort(nextSortKey));
  };

  const renderSortButton = (label: string, key: StudentSearchSortKey) => {
    const indicator = sortKey === key ? (sortDirection === 'asc' ? '\u2191' : '\u2193') : '';

    return (
      <button
        type="button"
        className={sortKey === key ? 'sort-header-button active' : 'sort-header-button'}
        onClick={() => toggleSort(key)}
        title={`Susun ${label}`}
      >
        <span>{label}</span>
        {indicator && <small>{indicator}</small>}
      </button>
    );
  };

  const individualReportHref = (item: StudentSummaryRecord) => {
    const params = new URLSearchParams({
      student_id: item.student_id,
      tahun_akademik: String(item.tahun_akademik),
      kod_peperiksaan: item.kod_peperiksaan,
      return_to: '/laporan/individu',
    });

    return `/laporan/individu/cetak?${params.toString()}`;
  };

  const renderProfilePanel = (studentProfile: StudentProfileRecord) => {
    const latestClass = classById.get(studentProfile.latest.class_id);
    const latestSchool = schoolByCode.get(studentProfile.latest.kod_sekolah);
    const yearRows = studentYears.map((tahun) => {
      const records = studentProfile.records
        .filter((item) => classById.get(item.class_id)?.tahun === tahun)
        .sort((a, b) => a.tahun_akademik - b.tahun_akademik || compareExamCode(a.kod_peperiksaan, b.kod_peperiksaan));
      const academicYears = uniqueValues(records.map((item) => item.tahun_akademik)).join(', ');
      const schoolsText = uniqueValues(
        records.map((item) => schoolLabel(schoolByCode.get(item.kod_sekolah), item.kod_sekolah)),
      ).join(' / ');
      const classesText = uniqueValues(records.map((item) => classLabel(classById.get(item.class_id)))).join(' / ');
      const examsText = uniqueValues(records.map((item) => normalizeExamCode(item.kod_peperiksaan)))
        .sort(compareExamCode)
        .join(', ');

      return {
        tahun,
        records,
        academicYears,
        schoolsText,
        classesText,
        examsText,
      };
    });
    const matrixRows = studentYears.map((tahun) => {
      const records = studentProfile.records.filter((item) => classById.get(item.class_id)?.tahun === tahun);
      const newestRecord = [...records].sort((a, b) => compareRecordsNewest(a, b, classById))[0];
      const examMap = new Map<string, StudentSummaryRecord>();

      records.forEach((item) => {
        const examCode = normalizeExamCode(item.kod_peperiksaan);
        const current = examMap.get(examCode);
        if (!current || compareRecordsNewest(item, current, classById) < 0) {
          examMap.set(examCode, item);
        }
      });

      return {
        tahun,
        newestRecord,
        exams: examMap,
      };
    });

    return (
      <div className="student-progress-panel">
        <div className="student-progress-heading">
          <div>
            <h3>Profil Perkembangan Murid</h3>
            <p className="table-note">Rekod pembelajaran dan prestasi murid dari Tahun 1 hingga Tahun 6.</p>
          </div>
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setSelectedStudentKey('');
            }}
          >
            Tukar Murid
          </button>
        </div>

        <div className="student-profile-summary">
          <div className="student-profile-card wide">
            <span>Nama Murid</span>
            <strong>{studentProfile.nama_murid}</strong>
            <small>{studentProfile.mykid || '-'}</small>
          </div>
          <div className="student-profile-card">
            <span>Sekolah Terkini</span>
            <strong>{schoolLabel(latestSchool, studentProfile.latest.kod_sekolah)}</strong>
          </div>
          <div className="student-profile-card">
            <span>Kelas Terkini</span>
            <strong>{classLabel(latestClass)}</strong>
          </div>
          <div className="student-profile-card">
            <span>Rekod Direkodkan</span>
            <strong>{studentProfile.records.length} ujian</strong>
            <small>{new Set(studentProfile.records.map((item) => classById.get(item.class_id)?.tahun).filter(Boolean)).size} tahun murid</small>
          </div>
        </div>

        <div className="student-profile-section">
          <div className="section-title-row">
            <h3>Sejarah Pembelajaran Tahun 1-6</h3>
          </div>
          <div className="table-scroll">
            <table className="compact-table">
              <thead>
                <tr>
                  <th>Tahun Murid</th>
                  <th>Tahun Akademik</th>
                  <th>Sekolah</th>
                  <th>Kelas</th>
                  <th>Ujian Direkodkan</th>
                </tr>
              </thead>
              <tbody>
                {yearRows.map((row) => (
                  <tr key={row.tahun} className={row.records.length === 0 ? 'muted-row' : undefined}>
                    <td>Tahun {row.tahun}</td>
                    <td>{row.academicYears || '-'}</td>
                    <td>{row.schoolsText || 'Belum ada rekod'}</td>
                    <td>{row.classesText || '-'}</td>
                    <td>{row.examsText || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="student-profile-section">
          <div className="section-title-row">
            <h3>Prestasi Setiap Ujian</h3>
          </div>
          <div className="table-scroll">
            <table className="compact-table performance-matrix">
              <thead>
                <tr>
                  <th>Tahun Murid</th>
                  <th>Sekolah / Kelas</th>
                  {profileExamOrder.map((exam) => (
                    <th key={exam}>{exam}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((row) => {
                  const schoolRecord = row.newestRecord ? schoolByCode.get(row.newestRecord.kod_sekolah) : undefined;
                  const classRecord = row.newestRecord ? classById.get(row.newestRecord.class_id) : undefined;

                  return (
                    <tr key={row.tahun} className={!row.newestRecord ? 'muted-row' : undefined}>
                      <td>Tahun {row.tahun}</td>
                      <td className="school-class-cell">
                        {row.newestRecord ? (
                          <>
                            <span>{schoolLabel(schoolRecord, row.newestRecord.kod_sekolah)}</span>
                            <small>{classLabel(classRecord)}</small>
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                      {profileExamOrder.map((exam) => {
                        const examRecord = row.exams.get(exam);

                        return (
                          <td key={exam}>
                            {examRecord ? (
                              <Link className="exam-profile-cell" href={individualReportHref(examRecord)}>
                                <span>{formatExamCell(examRecord, summaryGpm(examRecord))}</span>
                                <small>Buka slip</small>
                              </Link>
                            ) : (
                              <span className="muted-dash">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="panel-head">
        <div>
          <h2>Carian Profil Individu Murid</h2>
          <p className="table-note">
            Cari murid untuk melihat sejarah sekolah, kelas dan prestasi ujian dari Tahun 1 hingga Tahun 6.
          </p>
        </div>
        <span>
          {selectedStudentProfile
            ? 'Profil murid'
            : showResults
              ? `${searchMatchedProfiles.length} murid`
              : 'Pilih tapisan'}
        </span>
      </div>

      {!selectedStudentProfile && (
        <div className="report-filter-grid individual-profile-filter no-print">
          <label>
            Tahun Akademik Rujukan
            <select
              value={selectedYear}
              onChange={(event) => {
                setSelectedYear(Number(event.target.value));
                setSelectedClass('');
                resetResults();
              }}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          {!hideSchoolScopeFilters && (
            <label>
              Zon
              <select
                value={effectiveZone}
                onChange={(event) => {
                  setSelectedZone(event.target.value);
                  setSelectedSchool('');
                  setSelectedClass('');
                  resetResults();
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

          {!hideSchoolScopeFilters && (
            <label>
              Sekolah
              <select
                value={effectiveSchool}
                onChange={(event) => {
                  setSelectedSchool(event.target.value);
                  setSelectedClass('');
                  resetResults();
                }}
              >
                <option value="">Semua sekolah</option>
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
                resetResults();
              }}
            >
              <option value="">Semua tahun</option>
              {studentYears.map((tahun) => (
                <option key={tahun} value={tahun}>
                  Tahun {tahun}
                </option>
              ))}
            </select>
          </label>

          <label>
            Kelas
            <select
              value={selectedClass}
              onChange={(event) => {
                setSelectedClass(event.target.value);
                resetResults();
              }}
            >
              <option value="">Semua kelas</option>
              {classOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  Tahun {item.tahun} - {item.nama_kelas}
                </option>
              ))}
            </select>
          </label>

          <label>
            Nama / MyKid
            <input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setShowResults(false);
              }}
              placeholder="Cari nama murid atau MyKid"
            />
          </label>

          <div className="report-filter-action">
            <button
              type="button"
              className="button"
              onClick={() => {
                setSubmittedSearchTerm(searchTerm);
                setSelectedStudentKey('');
                setShowResults(true);
              }}
            >
              Cari
            </button>
          </div>
        </div>
      )}

      {selectedStudentProfile ? (
        renderProfilePanel(selectedStudentProfile)
      ) : !showResults ? (
        <p className="empty">
          Pilih tapisan dan tekan butang Cari. Senarai panjang murid disembunyikan sehingga carian dibuat.
        </p>
      ) : searchMatchedProfiles.length === 0 ? (
        <p className="empty">Tiada murid sepadan dengan pilihan carian.</p>
      ) : (
        <div className="table-scroll individual-report-list">
          <table>
            <thead>
              <tr>
                <th>Bil</th>
                <th>{renderSortButton('Nama Murid / MyKid', 'name')}</th>
                <th>{isSchoolAdmin || isClassTeacher ? 'Kelas Terkini' : 'Sekolah / Kelas Terkini'}</th>
                <th>{renderSortButton('Tahun Direkodkan', 'yearCount')}</th>
                <th>{renderSortButton('Ujian Direkodkan', 'examCount')}</th>
                <th>{renderSortButton('Purata Terkini', 'latestAverage')}</th>
                <th>Gred Terkini</th>
                <th>{renderSortButton('GPM Terkini', 'latestGpm')}</th>
                <th>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {searchMatchedProfiles.map((item, index) => {
                const classRecord = classById.get(item.latest.class_id);
                const schoolRecord = schoolByCode.get(item.latest.kod_sekolah);
                const recordedStudentYears = new Set(
                  item.records.map((record) => classById.get(record.class_id)?.tahun).filter(Boolean),
                ).size;

                return (
                  <tr key={item.key}>
                    <td>{index + 1}</td>
                    <td className="student-name-col">
                      <button
                        type="button"
                        className="text-link"
                        onClick={() => setSelectedStudentKey(item.key)}
                      >
                        {item.nama_murid}
                      </button>
                      <small>{item.mykid || '-'}</small>
                    </td>
                    <td className="school-class-cell">
                      {!isSchoolAdmin && !isClassTeacher && (
                        <span>{schoolLabel(schoolRecord, item.latest.kod_sekolah)}</span>
                      )}
                      <small>{classLabel(classRecord)}</small>
                    </td>
                    <td>{recordedStudentYears} / 6</td>
                    <td>{item.records.length}</td>
                    <td>{item.latest.purata ?? '-'}</td>
                    <td>{gradeForMark(item.latest.purata) || '-'}</td>
                    <td>{formatGradePointValue(summaryGpm(item.latest))}</td>
                    <td>
                      <button
                        type="button"
                        className="table-action"
                        onClick={() => setSelectedStudentKey(item.key)}
                      >
                        Lihat Profil
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
