'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAccessProfile } from '../../ui/AuthGate';
import { scopeClasses, scopeSchools } from '../../ui/scopedData';
import type { ClassRecord, School, StudentSummaryRecord, TeacherClassAssignment } from '@/lib/data';
import { compareExamCode, isStandardExamCode } from '@/lib/examOrdering';
import { cleanMykid } from '@/lib/mykid';
import { formatGradePoint, gradeForMark, gradePointForMark } from '@/lib/subjects';

const yearOptions = [2025, 2026, 2027, 2028, 2029, 2030];
const zoneOptions = ['BARAT', 'TIMUR', 'TENGAH'];
type SortDirection = 'asc' | 'desc';
type IndividualSortKey = 'name' | 'total' | 'average' | 'grade' | 'gpm';

function zoneLabel(zon: string) {
  return `Zon ${zon.charAt(0) + zon.slice(1).toLowerCase()}`;
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

function defaultDirectionForSort(key: IndividualSortKey): SortDirection {
  return key === 'name' || key === 'grade' || key === 'gpm' ? 'asc' : 'desc';
}

function summaryKey(item: StudentSummaryRecord) {
  return `${item.tahun_akademik}-${item.kod_peperiksaan}-${item.student_id}`;
}

function compareSummaryRows(
  a: StudentSummaryRecord,
  b: StudentSummaryRecord,
  key: IndividualSortKey,
  direction: SortDirection,
) {
  if (key === 'name') return compareText(a.nama_murid, b.nama_murid, direction);
  if (key === 'total') return compareNullableNumber(a.jumlah_markah, b.jumlah_markah, direction);
  if (key === 'average') return compareNullableNumber(a.purata, b.purata, direction);
  if (key === 'grade') return compareText(gradeForMark(a.purata), gradeForMark(b.purata), direction);
  return compareNullableNumber(gradePointForMark(a.purata), gradePointForMark(b.purata), direction);
}

export default function IndividualReportTable({
  schools,
  classes,
  summaries,
  teacherClassAssignments,
}: {
  schools: School[];
  classes: ClassRecord[];
  summaries: StudentSummaryRecord[];
  teacherClassAssignments: TeacherClassAssignment[];
}) {
  const profile = useAccessProfile();
  const currentYear = new Date().getFullYear();
  const defaultYear = yearOptions.includes(currentYear) ? currentYear : 2026;
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedTahun, setSelectedTahun] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [sortKey, setSortKey] = useState<IndividualSortKey>('average');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const classById = useMemo(() => new Map(scopedClasses.map((item) => [item.id, item])), [scopedClasses]);
  const schoolByCode = useMemo(() => new Map(scopedSchools.map((item) => [item.kod_sekolah, item])), [scopedSchools]);
  const isClassTeacher = profile?.role === 'GURU_KELAS';
  const isSchoolAdmin = profile?.role === 'ADMIN_SEKOLAH';
  const teacherClassIds = useMemo(() => {
    if (!isClassTeacher || !profile) return new Set<string>();
    return new Set(
      teacherClassAssignments
        .filter((assignment) => assignment.user_id === profile.id)
        .map((assignment) => assignment.class_id),
    );
  }, [isClassTeacher, profile, teacherClassAssignments]);
  const teacherSummaries = useMemo(() => {
    return summaries.filter((item) => teacherClassIds.has(item.class_id));
  }, [summaries, teacherClassIds]);
  const teacherExamOptions = useMemo(() => {
    return [...new Set(teacherSummaries
      .filter((item) => item.tahun_akademik === selectedYear && isStandardExamCode(item.kod_peperiksaan))
      .map((item) => item.kod_peperiksaan))]
      .sort(compareExamCode);
  }, [selectedYear, teacherSummaries]);
  const effectiveZone = profile?.role === 'ADMIN_ZON' ? profile.zon ?? '' : selectedZone;
  const effectiveSchool = profile?.role === 'ADMIN_SEKOLAH' ? profile.kod_sekolah ?? '' : selectedSchool;
  const schoolOptions = scopedSchools.filter((school) => !effectiveZone || school.zon === effectiveZone);
  const classOptions = scopedClasses.filter((item) => {
    if (item.tahun_akademik !== selectedYear) return false;
    if (effectiveSchool && item.kod_sekolah !== effectiveSchool) return false;
    if (selectedTahun && item.tahun !== Number(selectedTahun)) return false;
    return true;
  });
  const allowedSchools = new Set(schoolOptions.map((school) => school.kod_sekolah));
  const examOptions = [...new Set(summaries
    .filter((item) => {
      if (item.tahun_akademik !== selectedYear) return false;
      if (!isStandardExamCode(item.kod_peperiksaan)) return false;
      if (!allowedSchools.has(item.kod_sekolah)) return false;
      if (effectiveSchool && item.kod_sekolah !== effectiveSchool) return false;
      return true;
    })
    .map((item) => item.kod_peperiksaan))]
    .sort(compareExamCode);

  const filteredSummaries = summaries.filter((item) => {
    if (item.tahun_akademik !== selectedYear) return false;
    if (!isStandardExamCode(item.kod_peperiksaan)) return false;
    if (selectedExam && item.kod_peperiksaan !== selectedExam) return false;
    if (!allowedSchools.has(item.kod_sekolah)) return false;
    if (effectiveSchool && item.kod_sekolah !== effectiveSchool) return false;

    const classRecord = classById.get(item.class_id);
    if (selectedTahun && classRecord?.tahun !== Number(selectedTahun)) return false;
    if (selectedClass && item.class_id !== selectedClass) return false;
    return true;
  });
  const sortedSummaries = useMemo(() => {
    return [...filteredSummaries].sort((a, b) => compareSummaryRows(a, b, sortKey, sortDirection));
  }, [filteredSummaries, sortDirection, sortKey]);
  const teacherPerformanceSummaries = useMemo(() => {
    if (!selectedExam) return [];
    return teacherSummaries
      .filter((item) => item.tahun_akademik === selectedYear && item.kod_peperiksaan === selectedExam)
      .sort((a, b) => (b.purata ?? -1) - (a.purata ?? -1) || (b.jumlah_markah ?? -1) - (a.jumlah_markah ?? -1));
  }, [selectedExam, selectedYear, teacherSummaries]);
  const teacherFilteredSummaries = useMemo(() => {
    if (!selectedExam) return [];
    return teacherSummaries
      .filter((item) => item.tahun_akademik === selectedYear && item.kod_peperiksaan === selectedExam)
      .sort((a, b) => compareSummaryRows(a, b, sortKey, sortDirection));
  }, [selectedExam, selectedYear, sortDirection, sortKey, teacherSummaries]);
  const teacherRankMap = new Map<string, number>();
  teacherPerformanceSummaries.forEach((item, index, rows) => {
    const previous = rows[index - 1];
    const rank =
      previous && previous.purata === item.purata && previous.jumlah_markah === item.jumlah_markah
        ? rows.findIndex((row) => row.purata === item.purata && row.jumlah_markah === item.jumlah_markah) + 1
        : index + 1;

    teacherRankMap.set(summaryKey(item), rank);
  });
  const toggleSort = (nextSortKey: IndividualSortKey) => {
    if (sortKey === nextSortKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection(defaultDirectionForSort(nextSortKey));
  };
  const renderSortButton = (label: string, key: IndividualSortKey) => {
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

  if (isClassTeacher) {
    return (
      <>
        <div className="panel-head">
          <div>
            <h2>Carian Laporan Individu Murid</h2>
            <p className="table-note">Pilih tahun akademik dan jenis peperiksaan untuk melihat senarai kelas anda.</p>
          </div>
          <span>{teacherFilteredSummaries.length} rekod</span>
        </div>

        <div className="report-filter-grid teacher-report-filter no-print">
          <label>
            Tahun Akademik
            <select
              value={selectedYear}
              onChange={(event) => {
                setSelectedYear(Number(event.target.value));
                setSelectedExam('');
              }}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label>
            Jenis Peperiksaan
            <select value={selectedExam} onChange={(event) => setSelectedExam(event.target.value)}>
              <option value="">Pilih peperiksaan</option>
              {teacherExamOptions.map((exam) => (
                <option key={exam} value={exam}>
                  {exam}
                </option>
              ))}
            </select>
          </label>
        </div>

        {teacherClassIds.size === 0 ? (
          <p className="empty">Kelas belum ditetapkan kepada akaun guru kelas ini.</p>
        ) : !selectedExam ? (
          <p className="empty">Pilih jenis peperiksaan untuk memaparkan senarai murid.</p>
        ) : teacherFilteredSummaries.length === 0 ? (
          <p className="empty">Tiada laporan murid untuk pilihan ini.</p>
        ) : (
          <div className="table-scroll individual-report-list">
            <table>
              <thead>
                <tr>
                  <th>Bil</th>
                  <th>{renderSortButton('Nama Murid / MyKid', 'name')}</th>
                  <th>Kelas</th>
                  <th>Peperiksaan</th>
                  <th>Bil Subjek</th>
                  <th>{renderSortButton('Jumlah Markah', 'total')}</th>
                  <th>{renderSortButton('Purata', 'average')}</th>
                  <th>{renderSortButton('Gred', 'grade')}</th>
                  <th>{renderSortButton('GPM', 'gpm')}</th>
                  <th>Kedudukan</th>
                  <th>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {teacherFilteredSummaries.map((item, index) => {
                  const href = individualReportHref(item);
                  const classRecord = classById.get(item.class_id);
                  const rank = teacherRankMap.get(summaryKey(item)) ?? index + 1;

                  return (
                    <tr key={`${item.tahun_akademik}-${item.kod_peperiksaan}-${item.student_id}`}>
                      <td>{index + 1}</td>
                      <td className="student-name-col">
                        <span>{item.nama_murid}</span>
                        <small>{cleanMykid(item.mykid)}</small>
                      </td>
                      <td>{classRecord ? `Tahun ${classRecord.tahun} - ${classRecord.nama_kelas}` : '-'}</td>
                      <td>{item.kod_peperiksaan}</td>
                      <td>{item.bil_subjek_dikira}</td>
                      <td>{item.jumlah_markah ?? '-'}</td>
                      <td>{item.purata ?? '-'}</td>
                      <td>{gradeForMark(item.purata) || '-'}</td>
                      <td>{formatGradePoint(item.purata)}</td>
                      <td>{rank} / {teacherPerformanceSummaries.length}</td>
                      <td>
                        <Link className="table-action" href={href}>
                          Lihat Laporan
                        </Link>
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

  return (
    <>
      <div className="panel-head">
        <div>
          <h2>Carian Laporan Individu Murid</h2>
          <p className="table-note">Pilih tapisan, kemudian buka laporan individu murid yang diperlukan.</p>
        </div>
        <span>{sortedSummaries.length} rekod</span>
      </div>

      <div className="report-filter-grid no-print">
        <label>
          Tahun Akademik
          <select
            value={selectedYear}
            onChange={(event) => {
              setSelectedYear(Number(event.target.value));
              setSelectedExam('');
              setSelectedClass('');
            }}
          >
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
            <option value="">Semua peperiksaan</option>
            {examOptions.map((exam) => (
              <option key={exam} value={exam}>
                {exam}
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
            <select
              value={effectiveSchool}
              onChange={(event) => {
                setSelectedSchool(event.target.value);
                setSelectedClass('');
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
            <option value="">Semua kelas</option>
            {classOptions.map((item) => (
              <option key={item.id} value={item.id}>
                Tahun {item.tahun} - {item.nama_kelas}
              </option>
            ))}
          </select>
        </label>
      </div>

      {sortedSummaries.length === 0 ? (
        <p className="empty">Tiada murid sepadan dengan pilihan laporan.</p>
      ) : (
        <div className="table-scroll individual-report-list">
          <table>
            <thead>
              <tr>
                <th>Bil</th>
                <th>{renderSortButton('Nama Murid / MyKid', 'name')}</th>
                <th>{isSchoolAdmin ? 'Kelas' : 'Sekolah / Kelas'}</th>
                <th>Peperiksaan</th>
                <th>Bil Subjek</th>
                <th>{renderSortButton('Jumlah Markah', 'total')}</th>
                <th>{renderSortButton('Purata', 'average')}</th>
                <th>{renderSortButton('Gred', 'grade')}</th>
                <th>{renderSortButton('GPM', 'gpm')}</th>
                <th>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {sortedSummaries.map((item, index) => {
                const classRecord = classById.get(item.class_id);
                const schoolRecord = schoolByCode.get(item.kod_sekolah);
                const href = individualReportHref(item);

                return (
                  <tr key={`${item.tahun_akademik}-${item.kod_peperiksaan}-${item.student_id}`}>
                    <td>{index + 1}</td>
                    <td className="student-name-col">
                      <span>{item.nama_murid}</span>
                      <small>{cleanMykid(item.mykid)}</small>
                    </td>
                    <td className="school-class-cell">
                      {!isSchoolAdmin && (
                        <span>{schoolRecord ? `${schoolRecord.kod_sekolah} - ${schoolRecord.nama_sekolah}` : item.kod_sekolah}</span>
                      )}
                      <small>{classRecord ? `Tahun ${classRecord.tahun} - ${classRecord.nama_kelas}` : '-'}</small>
                    </td>
                    <td>{item.kod_peperiksaan}</td>
                    <td>{item.bil_subjek_dikira}</td>
                    <td>{item.jumlah_markah ?? '-'}</td>
                    <td>{item.purata ?? '-'}</td>
                    <td>{gradeForMark(item.purata) || '-'}</td>
                    <td>{formatGradePoint(item.purata)}</td>
                    <td>
                      <Link className="table-action" href={href}>
                        Lihat Laporan
                      </Link>
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
