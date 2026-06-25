'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import PrintButton from '../../ui/PrintButton';
import ReportSignatureBlock from '../../ui/ReportSignatureBlock';
import { useAccessProfile } from '../../ui/AuthGate';
import { scopeClasses } from '../../ui/scopedData';
import type { ClassRecord, MarkDetailRecord, School, SubjectRecord } from '@/lib/data';
import { compareExamRecords, isStandardExamCode } from '@/lib/examOrdering';
import {
  canonicalSubjectCode,
  fallbackSubjectForCode,
  formatGradePointValue,
  gradePointForMark,
  gradeShortForMark,
  subjectDisplayName,
} from '@/lib/subjects';

const ALL_VALUE = 'ALL';

const gradeColumns = [
  { key: 'MM', label: 'MM' },
  { key: 'JJ', label: 'JJ' },
  { key: 'J', label: 'J' },
  { key: 'M', label: 'M' },
  { key: 'Ms', label: 'Ms' },
] as const;

type GradeKey = (typeof gradeColumns)[number]['key'];

const gradeKeySet = new Set<string>(gradeColumns.map((item) => item.key));

const shortSubjectCodes: Record<string, string> = {
  AKHLAK: 'AKH',
  SIRAH: 'SRH',
  BAHASA_ARAB: 'BA',
  JAWI: 'JW',
  IMLAK_KHAT: 'IMK',
  TAUHID: 'THD',
  FEKAH: 'FKH',
  TAJWID: 'TJW',
  TILAWAH: 'TQ',
  HAFAZAN: 'HF',
};

type SubjectAnalysisRow = {
  key: string;
  kodSubjek: string;
  namaSubjek: string;
  susunan: number;
  pelajarBerdaftar: number;
  tidakHadir: number;
  jumlahPelajar: number;
  counts: Record<GradeKey, number>;
  bilLulus: number;
  bilGagal: number;
  purata: number | null;
  markahTertinggi: number | null;
  markahTerendah: number | null;
  gpmp: number | null;
};

function uniqueValues<T>(values: T[]) {
  return Array.from(new Set(values));
}

function compactNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
}

function percentText(value: number, total: number) {
  if (!total) return '0%';
  return `${compactNumber((value / total) * 100)}%`;
}

function classLabel(item: ClassRecord | null | undefined) {
  if (!item) return '-';
  return `Tahun ${item.tahun} - ${item.nama_kelas}`;
}

function schoolLabel(item: School | null | undefined) {
  if (!item) return '-';
  return `${item.kod_sekolah} - ${item.nama_sekolah}`;
}

function reportSubjectCode(kodSubjek: string) {
  const canonical = canonicalSubjectCode(kodSubjek);
  return shortSubjectCodes[canonical] ?? kodSubjek;
}

function reportSubjectRecord(kodSubjek: string, subject: SubjectRecord | null | undefined): SubjectRecord {
  const canonical = canonicalSubjectCode(kodSubjek);
  const fallback = fallbackSubjectForCode(canonical);
  return {
    kod_subjek: canonical,
    nama_subjek: fallback?.nama_subjek ?? subject?.nama_subjek ?? canonical,
    markah_penuh: fallback?.markah_penuh ?? subject?.markah_penuh ?? 100,
    dikira_purata: fallback?.dikira_purata ?? subject?.dikira_purata ?? true,
    susunan: fallback?.susunan ?? subject?.susunan ?? 999,
    status: fallback?.status ?? subject?.status ?? 'AKTIF',
  };
}

function isValidMark(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function buildSubjectAnalysis(marks: MarkDetailRecord[], registeredStudentCount: number): SubjectAnalysisRow[] {
  const rows = new Map<
    string,
    {
      kodSubjek: string;
      namaSubjek: string;
      susunan: number;
      studentIds: Set<string>;
      values: number[];
      pointValues: number[];
      counts: Record<GradeKey, number>;
    }
  >();

  for (const mark of marks) {
    const subject = reportSubjectRecord(mark.kod_subjek, mark.subjects);
    const key = subject.kod_subjek;
    const current =
      rows.get(key) ??
      {
        kodSubjek: key,
        namaSubjek: subjectDisplayName(subject, key),
        susunan: subject.susunan,
        studentIds: new Set<string>(),
        values: [],
        pointValues: [],
        counts: { MM: 0, JJ: 0, J: 0, M: 0, Ms: 0 },
      };

    const value = mark.markah;
    if (isValidMark(value)) {
      current.studentIds.add(mark.student_id);
      current.values.push(value);
      const shortGrade = gradeShortForMark(value);
      if (gradeKeySet.has(shortGrade)) {
        current.counts[shortGrade as GradeKey] += 1;
      }

      const point = gradePointForMark(value);
      if (point !== null) current.pointValues.push(point);
    }

    rows.set(key, current);
  }

  return Array.from(rows.entries())
    .map(([key, row]) => {
      const total = row.values.length;
      const sum = row.values.reduce((acc, value) => acc + value, 0);
      const pointSum = row.pointValues.reduce((acc, value) => acc + value, 0);
      const bilLulus = row.values.filter((value) => value >= 40).length;
      const pelajarBerdaftar = registeredStudentCount || row.studentIds.size;
      const jumlahPelajar = row.studentIds.size;
      return {
        key,
        kodSubjek: reportSubjectCode(row.kodSubjek),
        namaSubjek: row.namaSubjek,
        susunan: row.susunan,
        pelajarBerdaftar,
        tidakHadir: Math.max(pelajarBerdaftar - jumlahPelajar, 0),
        jumlahPelajar,
        counts: row.counts,
        bilLulus,
        bilGagal: total - bilLulus,
        purata: total ? sum / total : null,
        markahTertinggi: total ? Math.max(...row.values) : null,
        markahTerendah: total ? Math.min(...row.values) : null,
        gpmp: row.pointValues.length ? pointSum / row.pointValues.length : null,
      };
    })
    .sort((a, b) => a.susunan - b.susunan || a.namaSubjek.localeCompare(b.namaSubjek, 'ms'));
}

export default function SubjectReportTable({
  schools,
  classes,
  marks,
}: {
  schools: School[];
  classes: ClassRecord[];
  marks: MarkDetailRecord[];
}) {
  const profile = useAccessProfile();
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const classById = useMemo(() => new Map(scopedClasses.map((item) => [item.id, item])), [scopedClasses]);
  const schoolByCode = useMemo(() => new Map(schools.map((item) => [item.kod_sekolah, item])), [schools]);

  const scopedMarks = useMemo(
    () =>
      marks.filter((item) => {
        const classRecord = classById.get(item.class_id);
        return Boolean(classRecord && item.exams && isStandardExamCode(item.exams.kod_peperiksaan));
      }),
    [classById, marks],
  );

  const yearOptions = useMemo(() => {
    const values = uniqueValues(
      scopedMarks
        .map((item) => item.exams?.tahun_akademik ?? classById.get(item.class_id)?.tahun_akademik)
        .filter((value): value is number => typeof value === 'number'),
    );
    if (values.length === 0) {
      values.push(...uniqueValues(scopedClasses.map((item) => item.tahun_akademik)));
    }
    return values.sort((a, b) => b - a);
  }, [classById, scopedClasses, scopedMarks]);

  const [selectedYear, setSelectedYear] = useState('');
  const activeYear = selectedYear || String(yearOptions[0] ?? new Date().getFullYear());
  const activeYearNumber = Number(activeYear);

  const examOptions = useMemo(() => {
    const map = new Map<string, NonNullable<MarkDetailRecord['exams']>>();
    scopedMarks.forEach((item) => {
      if (item.exams?.tahun_akademik === activeYearNumber) {
        map.set(item.exams.id, item.exams);
      }
    });
    return Array.from(map.values()).sort(compareExamRecords);
  }, [activeYearNumber, scopedMarks]);

  const [selectedExam, setSelectedExam] = useState('');
  const activeExam = examOptions.some((item) => item.id === selectedExam) ? selectedExam : examOptions[0]?.id ?? '';

  const zoneOptions = useMemo(() => {
    const values = scopedClasses
      .map((item) => schoolByCode.get(item.kod_sekolah)?.zon)
      .filter((value): value is string => Boolean(value));
    return uniqueValues(values).sort((a, b) => a.localeCompare(b, 'ms'));
  }, [schoolByCode, scopedClasses]);

  const [selectedZone, setSelectedZone] = useState(ALL_VALUE);
  const activeZone = selectedZone === ALL_VALUE || zoneOptions.includes(selectedZone) ? selectedZone : ALL_VALUE;

  const schoolOptions = useMemo(() => {
    const codes = uniqueValues(
      scopedClasses
        .filter((item) => item.tahun_akademik === activeYearNumber)
        .filter((item) => activeZone === ALL_VALUE || schoolByCode.get(item.kod_sekolah)?.zon === activeZone)
        .map((item) => item.kod_sekolah),
    );
    return codes
      .map((kodSekolah) => schoolByCode.get(kodSekolah))
      .filter((item): item is School => Boolean(item))
      .sort((a, b) => a.nama_sekolah.localeCompare(b.nama_sekolah, 'ms'));
  }, [activeYearNumber, activeZone, schoolByCode, scopedClasses]);

  const [selectedSchool, setSelectedSchool] = useState(ALL_VALUE);
  const activeSchool =
    schoolOptions.length === 1
      ? schoolOptions[0].kod_sekolah
      : selectedSchool === ALL_VALUE || schoolOptions.some((item) => item.kod_sekolah === selectedSchool)
        ? selectedSchool
        : ALL_VALUE;

  const studentYearOptions = useMemo(() => {
    const values = uniqueValues(
      scopedClasses
        .filter((item) => item.tahun_akademik === activeYearNumber)
        .filter((item) => activeSchool === ALL_VALUE || item.kod_sekolah === activeSchool)
        .map((item) => item.tahun),
    );
    return values.sort((a, b) => a - b);
  }, [activeSchool, activeYearNumber, scopedClasses]);

  const [selectedStudentYear, setSelectedStudentYear] = useState(ALL_VALUE);
  const activeStudentYear =
    selectedStudentYear === ALL_VALUE || studentYearOptions.includes(Number(selectedStudentYear))
      ? selectedStudentYear
      : ALL_VALUE;

  const classOptions = useMemo(
    () =>
      scopedClasses
        .filter((item) => item.tahun_akademik === activeYearNumber)
        .filter((item) => activeSchool === ALL_VALUE || item.kod_sekolah === activeSchool)
        .filter((item) => activeStudentYear === ALL_VALUE || item.tahun === Number(activeStudentYear))
        .sort((a, b) => a.tahun - b.tahun || a.nama_kelas.localeCompare(b.nama_kelas, 'ms')),
    [activeSchool, activeStudentYear, activeYearNumber, scopedClasses],
  );

  const [selectedClass, setSelectedClass] = useState(ALL_VALUE);
  const activeClass =
    selectedClass === ALL_VALUE || classOptions.some((item) => item.id === selectedClass) ? selectedClass : ALL_VALUE;

  const filteredMarks = useMemo(
    () =>
      scopedMarks.filter((item) => {
        const classRecord = classById.get(item.class_id);
        const schoolRecord = classRecord ? schoolByCode.get(classRecord.kod_sekolah) : null;
        return Boolean(
          classRecord &&
            schoolRecord &&
            item.exams?.tahun_akademik === activeYearNumber &&
            (!activeExam || item.exam_id === activeExam) &&
            (activeZone === ALL_VALUE || schoolRecord.zon === activeZone) &&
            (activeSchool === ALL_VALUE || classRecord.kod_sekolah === activeSchool) &&
            (activeStudentYear === ALL_VALUE || classRecord.tahun === Number(activeStudentYear)) &&
            (activeClass === ALL_VALUE || classRecord.id === activeClass),
        );
      }),
    [
      activeClass,
      activeExam,
      activeSchool,
      activeStudentYear,
      activeYearNumber,
      activeZone,
      classById,
      schoolByCode,
      scopedMarks,
    ],
  );

  const registeredStudentIds = useMemo(
    () => new Set(filteredMarks.filter((item) => item.students?.status !== 'BERHENTI').map((item) => item.student_id)),
    [filteredMarks],
  );

  const analysisRows = useMemo(
    () => buildSubjectAnalysis(filteredMarks, registeredStudentIds.size),
    [filteredMarks, registeredStudentIds.size],
  );

  const activeSchoolLabel =
    activeSchool === ALL_VALUE ? 'Semua sekolah' : schoolLabel(schoolByCode.get(activeSchool));
  const activeExamRecord = examOptions.find((item) => item.id === activeExam);
  const activeClassLabel =
    activeClass === ALL_VALUE
      ? activeStudentYear === ALL_VALUE
        ? 'Semua kelas'
        : `Tahun ${activeStudentYear} / Semua kelas`
      : classLabel(classById.get(activeClass));

  const totals = useMemo(() => {
    const totalValid = analysisRows.reduce((acc, item) => acc + item.jumlahPelajar, 0);
    const totalPoint = analysisRows.reduce((acc, item) => acc + (item.gpmp ?? 0) * item.jumlahPelajar, 0);
    const totalPass = analysisRows.reduce((acc, item) => acc + item.bilLulus, 0);
    const totalAbsent = analysisRows.reduce((acc, item) => acc + item.tidakHadir, 0);
    return {
      totalValid,
      totalPass,
      totalAbsent,
      gps: totalValid ? totalPoint / totalValid : null,
      peratusLulus: totalValid ? (totalPass / totalValid) * 100 : null,
    };
  }, [analysisRows]);

  return (
    <>
      <div className="panel-head">
        <div>
          <h2>Laporan Analisis Subjek</h2>
          <p className="table-note">Analisis pencapaian subjek mengikut sekolah, kelas dan peperiksaan.</p>
        </div>
        <PrintButton />
      </div>

      <div className="subject-report-controls no-print">
        <label>
          Tahun Akademik
          <select
            value={activeYear}
            onChange={(event) => {
              setSelectedYear(event.target.value);
              setSelectedExam('');
              setSelectedSchool(ALL_VALUE);
              setSelectedStudentYear(ALL_VALUE);
              setSelectedClass(ALL_VALUE);
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
          <select
            value={activeExam}
            onChange={(event) => setSelectedExam(event.target.value)}
          >
            {examOptions.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.kod_peperiksaan} - {exam.nama_peperiksaan}
              </option>
            ))}
          </select>
        </label>
        <label>
          Zon
          <select
            value={activeZone}
            onChange={(event) => {
              setSelectedZone(event.target.value);
              setSelectedSchool(ALL_VALUE);
              setSelectedStudentYear(ALL_VALUE);
              setSelectedClass(ALL_VALUE);
            }}
          >
            <option value={ALL_VALUE}>Semua zon</option>
            {zoneOptions.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sekolah
          <select
            value={activeSchool}
            onChange={(event) => {
              setSelectedSchool(event.target.value);
              setSelectedStudentYear(ALL_VALUE);
              setSelectedClass(ALL_VALUE);
            }}
          >
            {schoolOptions.length !== 1 ? <option value={ALL_VALUE}>Semua sekolah</option> : null}
            {schoolOptions.map((school) => (
              <option key={school.kod_sekolah} value={school.kod_sekolah}>
                {schoolLabel(school)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tahun Murid
          <select
            value={activeStudentYear}
            onChange={(event) => {
              setSelectedStudentYear(event.target.value);
              setSelectedClass(ALL_VALUE);
            }}
          >
            <option value={ALL_VALUE}>Semua tahun</option>
            {studentYearOptions.map((year) => (
              <option key={year} value={year}>
                Tahun {year}
              </option>
            ))}
          </select>
        </label>
        <label>
          Kelas
          <select value={activeClass} onChange={(event) => setSelectedClass(event.target.value)}>
            <option value={ALL_VALUE}>Semua kelas</option>
            {classOptions.map((classRecord) => (
              <option key={classRecord.id} value={classRecord.id}>
                {classLabel(classRecord)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="subject-analysis-meta">
        <div>
          <span>Sekolah</span>
          <strong>{activeSchoolLabel}</strong>
        </div>
        <div>
          <span>Sesi</span>
          <strong>{activeStudentYear === ALL_VALUE ? activeYear : `Tahun ${activeStudentYear} / ${activeYear}`}</strong>
        </div>
        <div>
          <span>Peperiksaan</span>
          <strong>{activeExamRecord ? `${activeExamRecord.kod_peperiksaan} - ${activeExamRecord.nama_peperiksaan}` : '-'}</strong>
        </div>
        <div>
          <span>Kelas</span>
          <strong>{activeClassLabel}</strong>
        </div>
      </div>

      {analysisRows.length === 0 ? (
        <p className="empty">Belum ada markah untuk laporan subjek berdasarkan tapisan ini.</p>
      ) : (
        <>
          <div className="subject-analysis-scroll">
            <table className="subject-analysis-table">
              <thead>
                <tr>
                  <th rowSpan={2}>Bil</th>
                  <th rowSpan={2}>Kod</th>
                  <th rowSpan={2} className="subject-name">
                    Mata Pelajaran
                  </th>
                  <th rowSpan={2}>Pelajar Berdaftar</th>
                  <th rowSpan={2}>Tidak Hadir</th>
                  <th rowSpan={2}>Jumlah Pelajar</th>
                  {gradeColumns.map((grade) => (
                    <th key={grade.key} colSpan={2} className="subject-grade-group">
                      {grade.label}
                    </th>
                  ))}
                  <th colSpan={2}>Lulus</th>
                  <th colSpan={2}>Gagal</th>
                  <th rowSpan={2}>Markah Purata</th>
                  <th rowSpan={2}>Markah Tertinggi</th>
                  <th rowSpan={2}>Markah Terendah</th>
                  <th rowSpan={2}>GPMP</th>
                </tr>
                <tr>
                  {gradeColumns.map((grade) => (
                    <FragmentHeaderCells key={grade.key} />
                  ))}
                  <th>Bil</th>
                  <th>%</th>
                  <th>Bil</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {analysisRows.map((row, index) => (
                  <tr key={row.key}>
                    <td>{index + 1}</td>
                    <td>{row.kodSubjek}</td>
                    <td className="subject-name">{row.namaSubjek}</td>
                    <td>{row.pelajarBerdaftar}</td>
                    <td>{row.tidakHadir}</td>
                    <td>{row.jumlahPelajar}</td>
                    {gradeColumns.map((grade) => (
                      <FragmentDataCells key={grade.key}>
                        <td>{row.counts[grade.key]}</td>
                        <td>{percentText(row.counts[grade.key], row.jumlahPelajar)}</td>
                      </FragmentDataCells>
                    ))}
                    <td className="subject-pass-cell">{row.bilLulus}</td>
                    <td className="subject-pass-cell">{percentText(row.bilLulus, row.jumlahPelajar)}</td>
                    <td className={row.bilGagal > 0 ? 'subject-fail-cell' : undefined}>{row.bilGagal}</td>
                    <td className={row.bilGagal > 0 ? 'subject-fail-cell' : undefined}>
                      {percentText(row.bilGagal, row.jumlahPelajar)}
                    </td>
                    <td>{compactNumber(row.purata)}</td>
                    <td>{compactNumber(row.markahTertinggi)}</td>
                    <td>{compactNumber(row.markahTerendah)}</td>
                    <td>{formatGradePointValue(row.gpmp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="subject-report-summary">
            <div>
              <span>Gred Purata Sekolah (GPS)</span>
              <strong>{formatGradePointValue(totals.gps)}</strong>
            </div>
            <div>
              <span>Peratus Kelulusan</span>
              <strong>{totals.peratusLulus === null ? '-' : `${compactNumber(totals.peratusLulus)}%`}</strong>
            </div>
            <div>
              <span>Jumlah Markah Dianalisis</span>
              <strong>{totals.totalValid}</strong>
            </div>
            <div>
              <span>Jumlah Tidak Hadir</span>
              <strong>{totals.totalAbsent}</strong>
            </div>
          </div>

          <ReportSignatureBlock />
        </>
      )}
    </>
  );
}

function FragmentHeaderCells() {
  return (
    <>
      <th>Bil</th>
      <th>%</th>
    </>
  );
}

function FragmentDataCells({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
