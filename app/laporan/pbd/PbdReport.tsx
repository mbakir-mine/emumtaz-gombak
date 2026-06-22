'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import PrintButton from '../../ui/PrintButton';
import ReportSignatureBlock from '../../ui/ReportSignatureBlock';
import { useAccessProfile } from '../../ui/AuthGate';
import { scopeClasses, scopeSchools } from '../../ui/scopedData';
import type {
  ClassRecord,
  PbdMarkDetailRecord,
  School,
  SchoolModuleAccess,
  StudentRecord,
  SubjectRecord,
  TeacherClassAssignment,
} from '@/lib/data';
import { cleanMykid } from '@/lib/mykid';
import {
  allowedSubjectForTahun,
  formatGradePoint,
  formatGradePointValue,
  gradeForMark,
  gradePointForGrade,
  gradeShortForMark,
  officialGradeRows,
} from '@/lib/subjects';

type PbdColumn = {
  key: string;
  label: string;
  aliases: string[];
};

type PbdRow = {
  student: StudentRecord;
  mykid: string;
  gender: string;
  values: Map<string, number | null>;
  total: number | null;
  percent: number | null;
  grade: string;
  rank: number | null;
};

const zoneOptions = ['BARAT', 'TIMUR', 'TENGAH'];

const pbdColumns: PbdColumn[] = [
  { key: 'uth', label: 'UTH', aliases: ['UTH', 'TILAWAH', 'HAFAZAN'] },
  { key: 'tajwid', label: 'Tajwid', aliases: ['TJ05', 'TAJWID'] },
  { key: 'bahasaArab', label: 'Bahasa Arab', aliases: ['BA02', 'BAHASA_ARAB', 'BAHASAARAB'] },
  { key: 'akhlakSirah', label: 'Akhlak / Sirah', aliases: ['AS01', 'AKHLAK', 'SIRAH'] },
  { key: 'tauhidFeqah', label: 'Tauhid / Feqah', aliases: ['TF04', 'TAUHID', 'FEKAH', 'FEQAH'] },
  { key: 'jawiKhatImlak', label: 'Jawi / Khat / Imlak', aliases: ['JIK03', 'JAWI', 'IMLAK_KHAT', 'IMLAKKHAT', 'IMLAK', 'KHAT'] },
];

const gradeRows = officialGradeRows;

function normalizeText(value: string | null | undefined) {
  return String(value ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function zoneLabel(zon: string) {
  return `Zon ${zon.charAt(0) + zon.slice(1).toLowerCase()}`;
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
  if (markah === null || markah === undefined || Number.isNaN(markah)) return 'pbd-score pbd-score-empty';
  if (markah >= 90) return 'pbd-score pbd-score-excellent';
  if (markah < 40) return 'pbd-score pbd-score-danger';
  return 'pbd-score';
}

function formatNumber(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(digits).replace(/\.?0+$/, '');
}

function subjectMatchesColumn(subject: SubjectRecord, column: PbdColumn) {
  const code = normalizeText(subject.kod_subjek);
  const name = normalizeText(subject.nama_subjek);
  return column.aliases.map(normalizeText).some((alias) => code === alias || name.includes(alias));
}

function valueForPbdColumn(
  studentId: string,
  column: PbdColumn,
  reportSubjects: SubjectRecord[],
  markMap: Map<string, number[]>,
) {
  const matchedSubjectCodes = new Set(
    reportSubjects.filter((subject) => subjectMatchesColumn(subject, column)).map((subject) => subject.kod_subjek),
  );
  const values = [...matchedSubjectCodes].flatMap((kodSubjek) => markMap.get(`${studentId}|${kodSubjek}`) ?? []);

  if (values.length === 0) return null;
  const average = values.reduce((total, value) => total + value, 0) / values.length;
  return Number(average.toFixed(2));
}

function rankRows(rows: Omit<PbdRow, 'rank'>[]): PbdRow[] {
  const ranked = [...rows]
    .filter((row) => row.total !== null)
    .sort((a, b) => Number(b.total) - Number(a.total) || a.student.nama_murid.localeCompare(b.student.nama_murid));
  const rankMap = new Map<string, number>();
  let previousTotal: number | null = null;
  let currentRank = 0;

  ranked.forEach((row, index) => {
    if (row.total !== previousTotal) currentRank = index + 1;
    previousTotal = row.total;
    rankMap.set(row.student.id, currentRank);
  });

  return rows.map((row) => ({
    ...row,
    rank: rankMap.get(row.student.id) ?? null,
  }));
}

function buildAnalysis(rows: PbdRow[]) {
  return pbdColumns.map((column) => {
    const values = rows.map((row) => row.values.get(column.key) ?? null);
    const counted = values.filter((value): value is number => value !== null && Number.isFinite(value));
    const gradeCounts = new Map<string, number>();
    gradeRows.forEach((grade) => gradeCounts.set(grade, 0));
    counted.forEach((value) => {
      const grade = gradeForMark(value);
      gradeCounts.set(grade, (gradeCounts.get(grade) ?? 0) + 1);
    });

    const th = values.length - counted.length;
    const pass = counted.filter((value) => value >= 40).length;
    const fail = counted.filter((value) => value < 40).length;
    const ngpmTotal = gradeRows.reduce((total, grade) => total + (gradeCounts.get(grade) ?? 0) * gradePointForGrade(grade), 0);
    const gps = counted.length > 0 ? ngpmTotal / counted.length : null;

    return {
      column,
      gradeCounts,
      th,
      pass,
      fail,
      total: values.length,
      percentPass: values.length > 0 ? (pass / values.length) * 100 : null,
      percentFail: values.length > 0 ? (fail / values.length) * 100 : null,
      gps,
    };
  });
}

function pksrScore(gps: number | null) {
  if (gps === null || Number.isNaN(gps)) return '-';
  if (gps < 2.01) return '4';
  if (gps < 3.01) return '3';
  if (gps < 4.01) return '2';
  return '1';
}

export default function PbdReport({
  schools,
  classes,
  students,
  subjects,
  pbdMarks,
  teacherClassAssignments,
  moduleAccesses,
}: {
  schools: School[];
  classes: ClassRecord[];
  students: StudentRecord[];
  subjects: SubjectRecord[];
  pbdMarks: PbdMarkDetailRecord[];
  teacherClassAssignments: TeacherClassAssignment[];
  moduleAccesses: SchoolModuleAccess[];
}) {
  const profile = useAccessProfile();
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    pbdMarks.forEach((mark) => {
      const year = mark.pbd_assessments?.tahun_akademik;
      if (year && year <= currentYear) years.add(year);
    });
    classes.forEach((classRecord) => {
      if (classRecord.tahun_akademik <= currentYear) years.add(classRecord.tahun_akademik);
    });
    years.add(currentYear);
    return [...years].sort((a, b) => b - a);
  }, [classes, currentYear, pbdMarks]);
  const defaultYear = yearOptions.includes(currentYear) ? currentYear : yearOptions[0] ?? 2026;
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedTahun, setSelectedTahun] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  useEffect(() => {
    if ((profile?.role === 'ADMIN_SEKOLAH' || profile?.role === 'GURU_KELAS') && profile.kod_sekolah) {
      setSelectedSchool(profile.kod_sekolah);
    }
  }, [profile]);

  const isSchoolScoped = profile?.role === 'ADMIN_SEKOLAH' || profile?.role === 'GURU_KELAS';
  const effectiveZone = profile?.role === 'ADMIN_ZON' ? profile.zon ?? '' : selectedZone;
  const effectiveSchool = isSchoolScoped ? profile?.kod_sekolah ?? selectedSchool : selectedSchool;
  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const schoolOptions = scopedSchools.filter((school) => !effectiveZone || school.zon === effectiveZone);
  const classOptions = scopedClasses
    .filter((classRecord) => {
      if (classRecord.tahun_akademik !== selectedYear) return false;
      if (effectiveSchool && classRecord.kod_sekolah !== effectiveSchool) return false;
      if (selectedTahun && classRecord.tahun !== Number(selectedTahun)) return false;
      return true;
    })
    .sort((a, b) => a.tahun - b.tahun || a.nama_kelas.localeCompare(b.nama_kelas, 'ms', { sensitivity: 'base' }));

  const selectedClassRecord = classOptions.find((classRecord) => classRecord.id === selectedClass);
  const selectedSchoolRecord = effectiveSchool
    ? schools.find((school) => school.kod_sekolah === effectiveSchool)
    : selectedClassRecord
      ? schools.find((school) => school.kod_sekolah === selectedClassRecord.kod_sekolah)
      : undefined;
  const classTeacher = teacherClassAssignments.find((assignment) => assignment.class_id === selectedClassRecord?.id)?.users;
  const pbdEnabled = Boolean(
    profile?.role === 'OWNER' ||
      (effectiveSchool &&
        moduleAccesses.some(
          (access) => access.kod_sekolah === effectiveSchool && access.module_key === 'PELAPORAN_PBD' && access.enabled,
        )),
  );

  const classStudents = students
    .filter((student) => student.class_id === selectedClassRecord?.id && student.status === 'AKTIF')
    .sort((a, b) => a.nama_murid.localeCompare(b.nama_murid, 'ms', { sensitivity: 'base' }));

  const selectedPbdMarks = useMemo(
    () =>
      pbdMarks.filter((mark) => {
        const assessment = mark.pbd_assessments;
        if (!assessment) return false;
        if (assessment.tahun_akademik !== selectedYear) return false;
        if (assessment.class_id !== selectedClassRecord?.id) return false;
        return mark.students?.status === 'AKTIF';
      }),
    [pbdMarks, selectedClassRecord?.id, selectedYear],
  );

  const subjectMap = useMemo(() => new Map(subjects.map((subject) => [subject.kod_subjek, subject])), [subjects]);
  const reportSubjects = useMemo(() => {
    if (!selectedClassRecord) return [];
    const allowed = subjects.filter((subject) => allowedSubjectForTahun(subject, selectedClassRecord.tahun));
    const fromPbd = selectedPbdMarks
      .map((mark) => subjectMap.get(mark.pbd_assessments?.kod_subjek ?? '') ?? mark.pbd_assessments?.subjects)
      .filter((subject): subject is SubjectRecord => Boolean(subject));
    const merged = new Map<string, SubjectRecord>();
    [...allowed, ...fromPbd].forEach((subject) => merged.set(subject.kod_subjek, subject));
    return [...merged.values()].sort(
      (a, b) => (a.susunan ?? 999) - (b.susunan ?? 999) || a.kod_subjek.localeCompare(b.kod_subjek),
    );
  }, [selectedClassRecord, selectedPbdMarks, subjectMap, subjects]);

  const pbdMarkMap = useMemo(() => {
    const map = new Map<string, number[]>();
    selectedPbdMarks.forEach((mark) => {
      const assessment = mark.pbd_assessments;
      if (!assessment || mark.markah === null || mark.markah === undefined) return;
      const markahPenuh = Number(assessment.markah_penuh || 100);
      if (!Number.isFinite(markahPenuh) || markahPenuh <= 0) return;
      const normalized = Number(((Number(mark.markah) / markahPenuh) * 100).toFixed(2));
      if (!Number.isFinite(normalized)) return;
      const key = `${mark.student_id}|${assessment.kod_subjek}`;
      map.set(key, [...(map.get(key) ?? []), normalized]);
    });
    return map;
  }, [selectedPbdMarks]);

  const reportRows = useMemo(() => {
    const baseRows = classStudents.map((student) => {
      const values = new Map<string, number | null>();
      pbdColumns.forEach((column) => {
        values.set(column.key, valueForPbdColumn(student.id, column, reportSubjects, pbdMarkMap));
      });
      const validValues = [...values.values()].filter(
        (value): value is number => value !== null && Number.isFinite(value),
      );
      const total = validValues.length > 0 ? Number(validValues.reduce((sum, value) => sum + value, 0).toFixed(2)) : null;
      const percent = total !== null && validValues.length > 0 ? Number((total / (validValues.length * 100) * 100).toFixed(2)) : null;

      return {
        student,
        mykid: cleanMykid(student.mykid),
        gender: genderShort(student.jantina),
        values,
        total,
        percent,
        grade: gradeForMark(percent) || '-',
      };
    });

    return rankRows(baseRows).sort((a, b) => a.student.nama_murid.localeCompare(b.student.nama_murid, 'ms', { sensitivity: 'base' }));
  }, [classStudents, pbdMarkMap, reportSubjects]);

  const analysis = buildAnalysis(reportRows);
  const overallGpsValues = analysis.map((item) => item.gps).filter((value): value is number => value !== null);
  const overallGps =
    overallGpsValues.length > 0 ? overallGpsValues.reduce((sum, value) => sum + value, 0) / overallGpsValues.length : null;
  const classTitle = selectedClassRecord
    ? `Tahun ${selectedClassRecord.tahun} - ${selectedClassRecord.nama_kelas} / ${selectedClassRecord.tahun_akademik}`
    : '-';

  function resetClassSelection() {
    setSelectedClass('');
  }

  return (
    <>
      <div className="panel-head no-print">
        <div>
          <h2>Pelaporan PBD JAIS</h2>
          <p className="table-note">
            Pilih sekolah dan kelas untuk memaparkan rekod PBD yang diisi oleh guru subjek sepanjang tahun.
          </p>
        </div>
        <div className="row-actions no-print">
          <PrintButton />
        </div>
      </div>

      <div className="report-filter-grid pbd-report-filter no-print">
        <label>
          Tahun Akademik
          <select
            value={selectedYear}
            onChange={(event) => {
              setSelectedYear(Number(event.target.value));
              resetClassSelection();
            }}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        {!isSchoolScoped && (
          <label>
            Zon
            <select
              value={effectiveZone}
              onChange={(event) => {
                setSelectedZone(event.target.value);
                setSelectedSchool('');
                resetClassSelection();
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

        {!isSchoolScoped && (
          <label>
            Sekolah
            <select
              value={effectiveSchool}
              onChange={(event) => {
                setSelectedSchool(event.target.value);
                resetClassSelection();
              }}
            >
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
              resetClassSelection();
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
                Tahun {classRecord.tahun} - {classRecord.nama_kelas}
              </option>
            ))}
          </select>
        </label>
      </div>

      {effectiveSchool && !pbdEnabled && (
        <p className="notice no-print">
          Sekolah ini belum diberi akses Pelaporan PBD. Pentadbir Utama perlu menanda modul PBD di Tetapan &gt; Akses
          Modul Sekolah.
        </p>
      )}

      {!selectedClassRecord ? (
        <p className="empty">Pilih kelas untuk memaparkan Pelaporan PBD.</p>
      ) : !pbdEnabled ? (
        <p className="empty">Pelaporan PBD tidak dipaparkan kerana sekolah belum diberi akses modul ini.</p>
      ) : (
        <>
          <div className="print-report-title">
            <h2>REKOD PENTAKSIRAN BILIK DARJAH {selectedYear}</h2>
            <p>{selectedSchoolRecord?.nama_sekolah ?? selectedClassRecord.kod_sekolah}</p>
          </div>

          <div className="class-report-meta pbd-meta">
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
              <strong>{classTitle}</strong>
            </div>
            <div>
              <span>Penilaian</span>
              <strong>PBD Berterusan</strong>
            </div>
            <div>
              <span>Guru Kelas</span>
              <strong>{classTeacher?.nama ?? '-'}</strong>
            </div>
          </div>

          <section className="pbd-section">
            <div className="panel-head compact-head">
              <div>
                <h3>Rekod Pentaksiran PBD Kelas</h3>
                <p className="table-note">Susunan jadual mengikut format kanan-ke-kiri JAIS.</p>
              </div>
              <span>{reportRows.length} murid</span>
            </div>
            {selectedPbdMarks.length === 0 && (
              <p className="notice no-print">
                Belum ada rekod PBD untuk kelas ini. Guru subjek boleh isi melalui menu Modul Sekolah &gt; PBD.
              </p>
            )}
            <div className="table-scroll pbd-table-scroll">
              <table className="pbd-rtl-table" dir="rtl">
                <thead>
                  <tr>
                    <th>Bil</th>
                    <th className="pbd-student-col">Nama Murid / MyKid / Jantina</th>
                    {pbdColumns.map((column) => (
                      <Fragment key={column.key}>
                        <th>{column.label}</th>
                        <th>Gred</th>
                      </Fragment>
                    ))}
                    <th>Jumlah</th>
                    <th>%</th>
                    <th>Pangkat</th>
                    <th>GPM</th>
                    <th>Kedudukan Kelas</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.length === 0 ? (
                    <tr>
                      <td colSpan={pbdColumns.length * 2 + 7}>Tiada murid aktif dalam kelas ini.</td>
                    </tr>
                  ) : (
                    reportRows.map((row, index) => (
                      <tr key={row.student.id}>
                        <td>{index + 1}</td>
                        <td className="pbd-student-col" dir="ltr">
                          <strong>{row.student.nama_murid}</strong>
                          <small>
                            {row.mykid} / {row.gender}
                          </small>
                        </td>
                        {pbdColumns.map((column) => {
                          const value = row.values.get(column.key) ?? null;
                          return (
                            <Fragment key={column.key}>
                              <td className={scoreClass(value)}>{formatNumber(value)}</td>
                              <td>{value === null ? '-' : gradeShort(value)}</td>
                            </Fragment>
                          );
                        })}
                        <td className="score-total">{formatNumber(row.total)}</td>
                        <td>{formatNumber(row.percent)}</td>
                        <td>{row.grade}</td>
                        <td>{formatGradePoint(row.percent)}</td>
                        <td className="score-total">{row.rank ?? '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="pbd-section">
            <div className="panel-head compact-head">
              <div>
                <h3>Analisa Pencapaian</h3>
                <p className="table-note">Bilangan murid mengikut tahap pencapaian setiap mata pelajaran.</p>
              </div>
              <span>{reportRows.length} calon</span>
            </div>
            <div className="table-scroll pbd-analysis-scroll">
              <table className="pbd-analysis-table">
                <thead>
                  <tr>
                    <th>Analisa</th>
                    {analysis.map((item) => (
                      <th key={item.column.key}>{item.column.label}</th>
                    ))}
                    <th>Keseluruhan</th>
                  </tr>
                </thead>
                <tbody>
                  {gradeRows.map((grade) => {
                    const overallCount = reportRows.filter((row) => row.grade === grade).length;
                    return (
                      <tr key={grade}>
                        <th>{grade}</th>
                        {analysis.map((item) => (
                          <td key={item.column.key}>{item.gradeCounts.get(grade) ?? 0}</td>
                        ))}
                        <td>{overallCount}</td>
                      </tr>
                    );
                  })}
                  <tr>
                    <th>Tidak Hadir / Tiada Markah</th>
                    {analysis.map((item) => (
                      <td key={item.column.key}>{item.th}</td>
                    ))}
                    <td>{reportRows.filter((row) => row.percent === null).length}</td>
                  </tr>
                  <tr className="pbd-total-row">
                    <th>Jumlah Calon</th>
                    {analysis.map((item) => (
                      <td key={item.column.key}>{item.total}</td>
                    ))}
                    <td>{reportRows.length}</td>
                  </tr>
                  <tr>
                    <th>Bilangan Lulus</th>
                    {analysis.map((item) => (
                      <td key={item.column.key}>{item.pass}</td>
                    ))}
                    <td>{reportRows.filter((row) => row.percent !== null && row.percent >= 40).length}</td>
                  </tr>
                  <tr>
                    <th>Bilangan Gagal</th>
                    {analysis.map((item) => (
                      <td key={item.column.key}>{item.fail}</td>
                    ))}
                    <td>{reportRows.filter((row) => row.percent !== null && row.percent < 40).length}</td>
                  </tr>
                  <tr>
                    <th>% Lulus</th>
                    {analysis.map((item) => (
                      <td key={item.column.key}>{formatNumber(item.percentPass, 1)}</td>
                    ))}
                    <td>
                      {formatNumber(
                        reportRows.length > 0
                          ? (reportRows.filter((row) => row.percent !== null && row.percent >= 40).length / reportRows.length) * 100
                          : null,
                        1,
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>% Gagal</th>
                    {analysis.map((item) => (
                      <td key={item.column.key}>{formatNumber(item.percentFail, 1)}</td>
                    ))}
                    <td>
                      {formatNumber(
                        reportRows.length > 0
                          ? (reportRows.filter((row) => row.percent !== null && row.percent < 40).length / reportRows.length) * 100
                          : null,
                        1,
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="pbd-section">
            <div className="panel-head compact-head">
              <div>
                <h3>Gred Purata Kelas</h3>
                <p className="table-note">Kiraan GPK dan GPMP menggunakan skala Mumtaz 1 hingga Musaadah 5.</p>
              </div>
              <span>GPK {formatGradePointValue(overallGps)} | Skor PKSR {pksrScore(overallGps)}</span>
            </div>
            <div className="table-scroll pbd-gps-scroll">
              <table className="pbd-gps-table">
                <thead>
                  <tr>
                    <th>Mata Pelajaran</th>
                    {gradeRows.map((grade) => (
                      <th key={grade}>{grade}</th>
                    ))}
                    <th>TH</th>
                    <th>Jumlah Calon</th>
                    <th>GPMP</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.map((item) => (
                    <tr key={item.column.key}>
                      <th>{item.column.label}</th>
                      {gradeRows.map((grade) => (
                        <td key={grade}>{item.gradeCounts.get(grade) ?? 0}</td>
                      ))}
                      <td>{item.th}</td>
                      <td>{item.total}</td>
                      <td>{formatGradePointValue(item.gps)}</td>
                    </tr>
                  ))}
                  <tr className="pbd-total-row">
                    <th>GPK Keseluruhan</th>
                    <td colSpan={gradeRows.length + 3}>{formatGradePointValue(overallGps)}</td>
                    <td>{pksrScore(overallGps)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <ReportSignatureBlock />
        </>
      )}
    </>
  );
}
