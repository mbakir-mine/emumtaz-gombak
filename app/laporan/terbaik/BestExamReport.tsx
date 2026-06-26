'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { ClassRecord, ExamRecord, MarkDetailRecord, School, StudentSummaryRecord } from '@/lib/data';
import { fallbackSubjectForCode, gradeForMark, subjectDisplayName } from '@/lib/subjects';

const ALL = 'ALL';

type SummaryWithGpm = StudentSummaryRecord & { gpm?: number | null };

type RankedSummary = SummaryWithGpm & {
  classRecord?: ClassRecord;
  school?: School;
};

type SubjectStudent = {
  nama: string;
  mykid: string;
  classRecord?: ClassRecord;
  school?: School;
};

type SubjectBest = {
  key: string;
  tahun: number;
  subjectName: string;
  subjectOrder: number;
  markah: number;
  students: SubjectStudent[];
};

type Props = {
  schools: School[];
  classes: ClassRecord[];
  exams: ExamRecord[];
  summaries: StudentSummaryRecord[];
  marks: MarkDetailRecord[];
};

type CsvValue = string | number | null | undefined;

const filterGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '0.75rem',
  margin: '1rem 0',
};

const subheadingStyle: CSSProperties = {
  margin: '1.25rem 0 0.75rem',
  fontSize: '1.35rem',
};

const reportActionsStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
  justifyContent: 'flex-end',
  marginTop: '0.75rem',
};

const actionButtonStyle: CSSProperties = {
  border: 0,
  borderRadius: '0.55rem',
  padding: '0.65rem 0.9rem',
  background: '#edf3ff',
  color: '#075985',
  fontWeight: 700,
  cursor: 'pointer',
};

const actionPrimaryButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  background: '#0b7a3b',
  color: '#fff',
};

export default function BestExamReport({ schools, classes, exams, summaries, marks }: Props) {
  const currentYear = new Date().getFullYear();
  const schoolMap = useMemo(() => new Map(schools.map((school) => [school.kod_sekolah, school])), [schools]);
  const classMap = useMemo(() => new Map(classes.map((classRecord) => [classRecord.id, classRecord])), [classes]);

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    summaries.forEach((row) => years.add(row.tahun_akademik));
    exams.forEach((exam) => years.add(exam.tahun_akademik));
    classes.forEach((classRecord) => years.add(classRecord.tahun_akademik));
    return [...years].sort((a, b) => b - a);
  }, [classes, exams, summaries]);

  const [tahunAkademik, setTahunAkademik] = useState(
    yearOptions.includes(currentYear) ? currentYear : yearOptions[0] ?? currentYear,
  );
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedZone, setSelectedZone] = useState(ALL);
  const [selectedSchool, setSelectedSchool] = useState(ALL);

  const examOptions = useMemo(
    () => exams.filter((exam) => exam.tahun_akademik === tahunAkademik).sort(compareExams),
    [exams, tahunAkademik],
  );
  const selectedExam = examOptions.find((exam) => exam.id === selectedExamId) ?? examOptions[0] ?? null;

  const zoneOptions = useMemo(
    () => [...new Set(schools.map((school) => school.zon).filter((zone): zone is string => Boolean(zone)))].sort(),
    [schools],
  );

  const schoolOptions = useMemo(
    () =>
      schools
        .filter((school) => selectedZone === ALL || school.zon === selectedZone)
        .sort((a, b) => a.kod_sekolah.localeCompare(b.kod_sekolah)),
    [schools, selectedZone],
  );

  const rankedSummaries = useMemo<RankedSummary[]>(() => {
    if (!selectedExam) return [];

    return summaries
      .filter((row) => {
        if (row.tahun_akademik !== tahunAkademik) return false;
        if (row.kod_peperiksaan !== selectedExam.kod_peperiksaan) return false;
        if (selectedSchool !== ALL && row.kod_sekolah !== selectedSchool) return false;
        if (selectedZone !== ALL && schoolMap.get(row.kod_sekolah)?.zon !== selectedZone) return false;
        return true;
      })
      .map((row) => ({
        ...row,
        classRecord: classMap.get(row.class_id),
        school: schoolMap.get(row.kod_sekolah),
      }))
      .sort(compareSummaryRows);
  }, [classMap, schoolMap, selectedExam, selectedSchool, selectedZone, summaries, tahunAkademik]);

  const topByYear = useMemo(() => {
    const grouped = new Map<number, RankedSummary[]>();
    rankedSummaries.forEach((row) => {
      const tahun = row.classRecord?.tahun;
      if (!tahun) return;
      if (!grouped.has(tahun)) grouped.set(tahun, []);
      grouped.get(tahun)!.push(row);
    });

    return [...grouped.entries()]
      .sort(([a], [b]) => a - b)
      .map(([tahun, rows]) => ({ tahun, rows: rows.slice(0, 5) }));
  }, [rankedSummaries]);

  const topByClass = useMemo(() => {
    const grouped = new Map<string, RankedSummary[]>();
    rankedSummaries.forEach((row) => {
      if (!row.class_id) return;
      if (!grouped.has(row.class_id)) grouped.set(row.class_id, []);
      grouped.get(row.class_id)!.push(row);
    });

    return [...grouped.entries()]
      .map(([classId, rows]) => ({ classRecord: classMap.get(classId), rows: rows.slice(0, 5) }))
      .filter((group) => group.classRecord)
      .sort((a, b) => {
        const classA = a.classRecord!;
        const classB = b.classRecord!;
        return (
          classA.kod_sekolah.localeCompare(classB.kod_sekolah) ||
          classA.tahun - classB.tahun ||
          classA.nama_kelas.localeCompare(classB.nama_kelas)
        );
      });
  }, [classMap, rankedSummaries]);

  const subjectBestByYear = useMemo(() => {
    if (!selectedExam) return [];

    const grouped = new Map<string, SubjectBest>();
    marks.forEach((mark) => {
      if (mark.exam_id !== selectedExam.id) return;
      if (selectedSchool !== ALL && mark.kod_sekolah !== selectedSchool) return;
      if (selectedZone !== ALL && schoolMap.get(mark.kod_sekolah)?.zon !== selectedZone) return;
      if (typeof mark.markah !== 'number' || !Number.isFinite(mark.markah)) return;

      const classRecord = mark.classes ?? classMap.get(mark.class_id);
      if (!classRecord || classRecord.tahun_akademik !== tahunAkademik) return;

      const subject = mark.subjects ?? fallbackSubjectForCode(mark.kod_subjek);
      const subjectCode = subject?.kod_subjek ?? mark.kod_subjek;
      const subjectName = subjectDisplayName(subject, subjectCode);
      const key = `${classRecord.tahun}|${subjectCode}`;
      const student: SubjectStudent = {
        nama: mark.students?.nama_murid ?? '-',
        mykid: mark.students?.mykid ?? '',
        classRecord,
        school: schoolMap.get(mark.kod_sekolah),
      };

      const existing = grouped.get(key);
      if (!existing || mark.markah > existing.markah) {
        grouped.set(key, {
          key,
          tahun: classRecord.tahun,
          subjectName,
          subjectOrder: subject?.susunan ?? 999,
          markah: mark.markah,
          students: [student],
        });
        return;
      }

      if (mark.markah === existing.markah) {
        existing.students.push(student);
      }
    });

    const byYear = new Map<number, SubjectBest[]>();
    [...grouped.values()].forEach((row) => {
      if (!byYear.has(row.tahun)) byYear.set(row.tahun, []);
      byYear.get(row.tahun)!.push(row);
    });

    return [...byYear.entries()]
      .sort(([a], [b]) => a - b)
      .map(([tahun, rows]) => ({
        tahun,
        rows: rows.sort((a, b) => a.subjectOrder - b.subjectOrder || a.subjectName.localeCompare(b.subjectName)),
      }));
  }, [classMap, marks, schoolMap, selectedExam, selectedSchool, selectedZone, tahunAkademik]);

  const selectedExamLabel = selectedExam ? `${selectedExam.kod_peperiksaan} - ${selectedExam.nama_peperiksaan}` : '-';

  const handlePrintReport = () => {
    window.print();
  };

  const handleDownloadExcel = () => {
    const showSchool = selectedSchool === ALL;
    const selectedSchoolData = schoolMap.get(selectedSchool);
    const selectedSchoolLabel =
      selectedSchool === ALL
        ? 'Semua sekolah'
        : selectedSchoolData
          ? `${selectedSchoolData.kod_sekolah} - ${selectedSchoolData.nama_sekolah}`
          : selectedSchool;

    const rows: CsvValue[][] = [
      ['Laporan Keputusan Terbaik Peperiksaan'],
      ['Tahun Akademik', tahunAkademik],
      ['Peperiksaan', selectedExamLabel],
      ['Sekolah', selectedSchoolLabel],
      [],
      ['Keputusan 5 Terbaik Setiap Tahun'],
      ['Tahun', 'Kedudukan', 'Nama Murid', 'MyKid', showSchool ? 'Sekolah / Kelas' : 'Kelas', 'Jumlah', 'Purata', 'Gred', 'GPM'],
    ];

    topByYear.forEach((group) => {
      group.rows.forEach((row, index) => {
        rows.push([
          `Tahun ${group.tahun}`,
          index + 1,
          row.nama_murid,
          cleanText(row.mykid),
          studentPlacementLabel(row, showSchool),
          formatNumber(row.jumlah_markah),
          formatNumber(row.purata),
          gradeForMark(row.purata),
          formatNumber(row.gpm),
        ]);
      });
    });

    rows.push(
      [],
      ['Keputusan 5 Terbaik Setiap Kelas'],
      [showSchool ? 'Sekolah / Kelas' : 'Kelas', 'Kedudukan', 'Nama Murid', 'MyKid', 'Jumlah', 'Purata', 'Gred', 'GPM'],
    );

    topByClass.forEach((group) => {
      const groupLabel = group.classRecord ? classPlacementLabel(group.rows[0]?.school, group.classRecord, showSchool) : '-';
      group.rows.forEach((row, index) => {
        rows.push([
          groupLabel,
          index + 1,
          row.nama_murid,
          cleanText(row.mykid),
          formatNumber(row.jumlah_markah),
          formatNumber(row.purata),
          gradeForMark(row.purata),
          formatNumber(row.gpm),
        ]);
      });
    });

    rows.push(
      [],
      ['Pelajar Terbaik Mata Pelajaran Mengikut Tahun'],
      ['Tahun', 'Mata Pelajaran', 'Markah Tertinggi', 'Nama Murid', 'MyKid', showSchool ? 'Sekolah / Kelas' : 'Kelas'],
    );

    subjectBestByYear.forEach((group) => {
      group.rows.forEach((subject) => {
        subject.students.forEach((student) => {
          rows.push([
            `Tahun ${group.tahun}`,
            subject.subjectName,
            formatNumber(subject.markah),
            student.nama,
            cleanText(student.mykid),
            student.classRecord ? classPlacementLabel(student.school, student.classRecord, showSchool) : '-',
          ]);
        });
      });
    });

    downloadCsvFile(rows, `laporan-keputusan-terbaik-${tahunAkademik}.csv`);
  };

  return (
    <div>
      <header className="report-header">
        <div>
          <h2>Laporan Keputusan Terbaik Peperiksaan</h2>
          <p>5 terbaik setiap tahun, 5 terbaik setiap kelas dan pelajar terbaik bagi setiap mata pelajaran.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span>{rankedSummaries.length} rekod</span>
          <div className="no-print" style={reportActionsStyle}>
            <button type="button" style={actionButtonStyle} onClick={handlePrintReport}>
              CETAK
            </button>
            <button type="button" style={actionButtonStyle} onClick={handlePrintReport}>
              CETAK PDF
            </button>
            <button type="button" style={actionPrimaryButtonStyle} onClick={handleDownloadExcel}>
              Muat Turun Excel
            </button>
          </div>
        </div>
      </header>

      <div style={filterGridStyle}>
        <FilterSelect
          label="Tahun Akademik"
          value={String(tahunAkademik)}
          onChange={(value) => {
            setTahunAkademik(Number(value));
            setSelectedExamId('');
          }}
        >
          {yearOptions.map((year) => (
            <option value={year} key={year}>
              {year}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="Peperiksaan" value={selectedExam?.id ?? ''} onChange={setSelectedExamId}>
          {examOptions.map((exam) => (
            <option value={exam.id} key={exam.id}>
              {exam.kod_peperiksaan} - {exam.nama_peperiksaan}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Zon"
          value={selectedZone}
          onChange={(value) => {
            setSelectedZone(value);
            setSelectedSchool(ALL);
          }}
        >
          <option value={ALL}>Semua zon</option>
          {zoneOptions.map((zone) => (
            <option value={zone} key={zone}>
              {zone}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="Sekolah" value={selectedSchool} onChange={setSelectedSchool}>
          <option value={ALL}>Semua sekolah</option>
          {schoolOptions.map((school) => (
            <option value={school.kod_sekolah} key={school.kod_sekolah}>
              {school.kod_sekolah} - {school.nama_sekolah}
            </option>
          ))}
        </FilterSelect>
      </div>

      <h3 style={subheadingStyle}>Keputusan 5 Terbaik Setiap Tahun</h3>
      <TopByYearTable groups={topByYear} showSchool={selectedSchool === ALL} />

      <h3 style={subheadingStyle}>Keputusan 5 Terbaik Setiap Kelas</h3>
      <TopByClassTable groups={topByClass} showSchool={selectedSchool === ALL} />

      <h3 style={subheadingStyle}>Pelajar Terbaik Mata Pelajaran Mengikut Tahun</h3>
      <SubjectBestSummaryTable groups={subjectBestByYear} showSchool={selectedSchool === ALL} />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select className="input" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

function TopByYearTable({ groups, showSchool }: { groups: { tahun: number; rows: RankedSummary[] }[]; showSchool: boolean }) {
  if (!groups.length) return <EmptyNote />;

  return (
    <div className="table-responsive">
      <table className="data-table compact-table">
        <thead>
          <tr>
            <th>Tahun</th>
            <th>KEDUDUKAN</th>
            <th>Nama Murid / MyKid</th>
            <th>{showSchool ? 'Sekolah / Kelas' : 'Kelas'}</th>
            <th>Jumlah</th>
            <th>Purata</th>
            <th>Gred</th>
            <th>GPM</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) =>
            group.rows.map((row, index) => (
              <tr key={`${group.tahun}-${row.student_id}-${row.class_id}-${index}`}>
                <td>{`Tahun ${group.tahun}`}</td>
                <td>{index + 1}</td>
                <td>
                  <StudentName name={row.nama_murid} mykid={row.mykid} />
                </td>
                <td>{studentPlacementLabel(row, showSchool)}</td>
                <td>{formatNumber(row.jumlah_markah)}</td>
                <td>{formatNumber(row.purata)}</td>
                <td>{gradeForMark(row.purata)}</td>
                <td>{formatNumber(row.gpm)}</td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}

function TopByClassTable({
  groups,
  showSchool,
}: {
  groups: { classRecord?: ClassRecord; rows: RankedSummary[] }[];
  showSchool: boolean;
}) {
  if (!groups.length) return <EmptyNote />;

  return (
    <div className="table-responsive">
      <table className="data-table compact-table">
        <thead>
          <tr>
            <th>{showSchool ? 'Sekolah / Kelas' : 'Kelas'}</th>
            <th>KEDUDUKAN</th>
            <th>Nama Murid / MyKid</th>
            <th>Jumlah</th>
            <th>Purata</th>
            <th>Gred</th>
            <th>GPM</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const groupLabel = group.classRecord ? classPlacementLabel(group.rows[0]?.school, group.classRecord, showSchool) : '-';
            return group.rows.map((row, index) => (
              <tr key={`${group.classRecord?.id ?? 'class'}-${row.student_id}-${index}`}>
                <td>{groupLabel}</td>
                <td>{index + 1}</td>
                <td>
                  <StudentName name={row.nama_murid} mykid={row.mykid} />
                </td>
                <td>{formatNumber(row.jumlah_markah)}</td>
                <td>{formatNumber(row.purata)}</td>
                <td>{gradeForMark(row.purata)}</td>
                <td>{formatNumber(row.gpm)}</td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}

function SubjectBestSummaryTable({
  groups,
  showSchool,
}: {
  groups: { tahun: number; rows: SubjectBest[] }[];
  showSchool: boolean;
}) {
  if (!groups.length) return <EmptyNote />;

  return (
    <div className="table-responsive">
      <table className="data-table compact-table">
        <thead>
          <tr>
            <th>Tahun</th>
            <th>Mata Pelajaran</th>
            <th>Markah Tertinggi</th>
            <th>Pelajar</th>
            <th>{showSchool ? 'Sekolah / Kelas' : 'Kelas'}</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) =>
            group.rows.map((row) => (
              <tr key={row.key}>
                <td>{`Tahun ${group.tahun}`}</td>
                <td>{row.subjectName}</td>
                <td>{formatNumber(row.markah)}</td>
                <td>
                  {row.students.map((student) => (
                    <StudentName key={`${student.mykid}-${student.nama}`} name={student.nama} mykid={student.mykid} />
                  ))}
                </td>
                <td>
                  {row.students.map((student) => (
                    <div key={`${student.mykid}-${student.classRecord?.id ?? ''}`}>
                      {student.classRecord ? classPlacementLabel(student.school, student.classRecord, showSchool) : '-'}
                    </div>
                  ))}
                </td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}

function EmptyNote() {
  return <p style={{ color: '#52647a', margin: 0 }}>Tiada rekod untuk tapisan ini.</p>;
}

function compareExams(a: ExamRecord, b: ExamRecord) {
  return (
    examPriority(a.kod_peperiksaan) - examPriority(b.kod_peperiksaan) ||
    a.nama_peperiksaan.localeCompare(b.nama_peperiksaan)
  );
}

function examPriority(code: string) {
  const value = code.toUpperCase();
  if (value.includes('UPSA')) return 1;
  if (value.includes('UASA')) return 2;
  if (value.includes('PBD')) return 3;
  return 99;
}

function compareSummaryRows(a: RankedSummary, b: RankedSummary) {
  const purataDiff = (b.purata ?? -1) - (a.purata ?? -1);
  if (purataDiff !== 0) return purataDiff;
  const jumlahDiff = (b.jumlah_markah ?? -1) - (a.jumlah_markah ?? -1);
  if (jumlahDiff !== 0) return jumlahDiff;
  return a.nama_murid.localeCompare(b.nama_murid);
}

function classLabel(classRecord: ClassRecord) {
  return `Tahun ${classRecord.tahun} - ${classRecord.nama_kelas}`;
}

function classPlacementLabel(school: School | undefined, classRecord: ClassRecord, showSchool: boolean) {
  if (!showSchool) return classLabel(classRecord);
  const schoolLabel = school ? `${school.kod_sekolah} - ${school.nama_sekolah}` : '-';
  return `${schoolLabel} / ${classLabel(classRecord)}`;
}

function studentPlacementLabel(row: RankedSummary, showSchool: boolean) {
  return row.classRecord ? classPlacementLabel(row.school, row.classRecord, showSchool) : '-';
}

function StudentName({ name, mykid }: { name: string; mykid: string | null | undefined }) {
  return (
    <div>
      <div>{name}</div>
      <small>{cleanText(mykid)}</small>
    </div>
  );
}

function cleanText(value: string | null | undefined) {
  return (value ?? '').replace(/[^\dA-Za-z/@._ -]/g, '').trim();
}

function formatNumber(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.?0+$/, '');
}

function downloadCsvFile(rows: CsvValue[][], fileName: string) {
  const csv = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: CsvValue) {
  const text = value == null ? '' : String(value);
  const escaped = text.replace(/"/g, '""');
  return /[",\r\n]/.test(escaped) ? `"${escaped}"` : escaped;
}
