'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAccessProfile } from '../../ui/AuthGate';
import { scopeClasses, scopeSchools } from '../../ui/scopedData';
import type { ClassRecord, School, StudentSummaryRecord, TeacherClassAssignment } from '@/lib/data';
import { gradeForMark } from '@/lib/subjects';

const yearOptions = [2025, 2026, 2027, 2028, 2029, 2030];
const zoneOptions = ['BARAT', 'TIMUR', 'TENGAH'];

function zoneLabel(zon: string) {
  return `Zon ${zon.charAt(0) + zon.slice(1).toLowerCase()}`;
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

  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const classById = useMemo(() => new Map(scopedClasses.map((item) => [item.id, item])), [scopedClasses]);
  const isClassTeacher = profile?.role === 'GURU_KELAS';
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
    return [...new Set(teacherSummaries.filter((item) => item.tahun_akademik === selectedYear).map((item) => item.kod_peperiksaan))]
      .sort();
  }, [selectedYear, teacherSummaries]);
  const effectiveZone = profile?.role === 'ADMIN_ZON' ? profile.zon ?? '' : selectedZone;
  const effectiveSchool = profile?.role === 'ADMIN_SEKOLAH' ? profile.kod_sekolah ?? '' : selectedSchool;
  const schoolOptions = scopedSchools.filter((school) => !effectiveZone || school.zon === effectiveZone);
  const classOptions = scopedClasses.filter((item) => {
    if (effectiveSchool && item.kod_sekolah !== effectiveSchool) return false;
    if (selectedTahun && item.tahun !== Number(selectedTahun)) return false;
    return true;
  });
  const allowedSchools = new Set(schoolOptions.map((school) => school.kod_sekolah));

  const filteredSummaries = summaries.filter((item) => {
    if (item.tahun_akademik !== selectedYear) return false;
    if (!allowedSchools.has(item.kod_sekolah)) return false;
    if (effectiveSchool && item.kod_sekolah !== effectiveSchool) return false;

    const classRecord = classById.get(item.class_id);
    if (selectedTahun && classRecord?.tahun !== Number(selectedTahun)) return false;
    if (selectedClass && item.class_id !== selectedClass) return false;
    return true;
  });
  const teacherFilteredSummaries = useMemo(() => {
    if (!selectedExam) return [];
    return teacherSummaries
      .filter((item) => item.tahun_akademik === selectedYear && item.kod_peperiksaan === selectedExam)
      .sort((a, b) => (b.purata ?? -1) - (a.purata ?? -1) || (b.jumlah_markah ?? -1) - (a.jumlah_markah ?? -1));
  }, [selectedExam, selectedYear, teacherSummaries]);
  const rankedTeacherSummaries = teacherFilteredSummaries.map((item, index, rows) => {
    const previous = rows[index - 1];
    const rank =
      previous && previous.purata === item.purata && previous.jumlah_markah === item.jumlah_markah
        ? rows.findIndex((row) => row.purata === item.purata && row.jumlah_markah === item.jumlah_markah) + 1
        : index + 1;

    return { item, rank };
  });

  if (isClassTeacher) {
    return (
      <>
        <div className="panel-head">
          <div>
            <h2>Laporan Individu Murid</h2>
            <p className="table-note">Pilih tahun akademik dan jenis peperiksaan untuk melihat senarai kelas anda.</p>
          </div>
          <span>{rankedTeacherSummaries.length} rekod</span>
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
        ) : rankedTeacherSummaries.length === 0 ? (
          <p className="empty">Tiada laporan murid untuk pilihan ini.</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Bil</th>
                  <th>Nama Murid</th>
                  <th>Jumlah Markah</th>
                  <th>Peratus</th>
                  <th>Pangkat</th>
                  <th>Kedudukan</th>
                </tr>
              </thead>
              <tbody>
                {rankedTeacherSummaries.map(({ item, rank }, index) => {
                  const href = `/laporan/individu/cetak?student_id=${item.student_id}&tahun_akademik=${item.tahun_akademik}&kod_peperiksaan=${item.kod_peperiksaan}`;

                  return (
                    <tr key={`${item.tahun_akademik}-${item.kod_peperiksaan}-${item.student_id}`}>
                      <td>{index + 1}</td>
                      <td>
                        <Link className="text-link" href={href}>
                          {item.nama_murid}
                        </Link>
                      </td>
                      <td>{item.jumlah_markah ?? '-'}</td>
                      <td>{item.purata !== null && item.purata !== undefined ? `${item.purata}%` : '-'}</td>
                      <td>{gradeForMark(item.purata)}</td>
                      <td>{rank} / {rankedTeacherSummaries.length}</td>
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
          <h2>Laporan Individu Murid</h2>
          <p className="table-note">Pilih tapisan, kemudian klik nama murid untuk cetakan individu.</p>
        </div>
        <span>{filteredSummaries.length} rekod</span>
      </div>

      <div className="report-filter-grid no-print">
        <label>
          Tahun Peperiksaan
          <select
            value={selectedYear}
            onChange={(event) => {
              setSelectedYear(Number(event.target.value));
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
          Zon
          <select
            value={effectiveZone}
            onChange={(event) => {
              setSelectedZone(event.target.value);
              setSelectedSchool('');
              setSelectedClass('');
            }}
            disabled={profile?.role === 'ADMIN_ZON' || profile?.role === 'ADMIN_SEKOLAH'}
          >
            <option value="">Semua zon</option>
            {zoneOptions.map((zon) => (
              <option key={zon} value={zon}>
                {zoneLabel(zon)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Sekolah
          <select
            value={effectiveSchool}
            onChange={(event) => {
              setSelectedSchool(event.target.value);
              setSelectedClass('');
            }}
            disabled={profile?.role === 'ADMIN_SEKOLAH'}
          >
            <option value="">Semua sekolah</option>
            {schoolOptions.map((school) => (
              <option key={school.kod_sekolah} value={school.kod_sekolah}>
                {school.kod_sekolah} - {school.nama_sekolah}
              </option>
            ))}
          </select>
        </label>

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

      {filteredSummaries.length === 0 ? (
        <p className="empty">Tiada murid sepadan dengan pilihan laporan.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Peperiksaan</th>
                <th>Sekolah</th>
                <th>Tahun</th>
                <th>Kelas</th>
                <th>Nama Murid</th>
                <th>Bil Subjek</th>
                <th>Purata</th>
                <th>Gred</th>
              </tr>
            </thead>
            <tbody>
              {filteredSummaries.map((item) => {
                const classRecord = classById.get(item.class_id);
                const href = `/laporan/individu/cetak?student_id=${item.student_id}&tahun_akademik=${item.tahun_akademik}&kod_peperiksaan=${item.kod_peperiksaan}`;

                return (
                  <tr key={`${item.tahun_akademik}-${item.kod_peperiksaan}-${item.student_id}`}>
                    <td>{item.kod_peperiksaan}</td>
                    <td>{item.kod_sekolah}</td>
                    <td>{classRecord ? `Tahun ${classRecord.tahun}` : '-'}</td>
                    <td>{classRecord?.nama_kelas ?? '-'}</td>
                    <td>
                      <Link className="text-link" href={href}>
                        {item.nama_murid}
                      </Link>
                    </td>
                    <td>{item.bil_subjek_dikira}</td>
                    <td>{item.purata ?? '-'}</td>
                    <td>{gradeForMark(item.purata)}</td>
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
