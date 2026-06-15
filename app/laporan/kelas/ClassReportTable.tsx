'use client';

import { useMemo, useState } from 'react';
import PrintButton from '../../ui/PrintButton';
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
import { allowedSubjectForTahun, gradeForMark } from '@/lib/subjects';

const zoneOptions = ['BARAT', 'TIMUR', 'TENGAH'];
const subjectCodeLabels: Record<string, string> = {
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

function zoneLabel(zon: string) {
  return `Zon ${zon.charAt(0) + zon.slice(1).toLowerCase()}`;
}

function subjectLabel(subject: SubjectRecord) {
  return subjectCodeLabels[subject.kod_subjek] ?? subject.kod_subjek;
}

function genderShort(jantina: string | null | undefined) {
  if (!jantina) return '-';
  const value = jantina.toUpperCase();
  if (value.startsWith('L')) return 'L';
  if (value.startsWith('P')) return 'P';
  return jantina;
}

function gradeShort(markah: number | null | undefined) {
  const grade = gradeForMark(markah);
  if (!grade) return '';
  if (grade === 'Mumtaz') return 'MM';
  if (grade === 'Jayyid Jiddan') return 'JJ';
  if (grade === 'Jayyid') return 'J';
  if (grade === 'Maqbul') return 'M';
  return 'D';
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

  const isSchoolAdmin = profile?.role === 'ADMIN_SEKOLAH';
  const effectiveZone = profile?.role === 'ADMIN_ZON' ? profile.zon ?? '' : selectedZone;
  const effectiveSchool = isSchoolAdmin ? profile?.kod_sekolah ?? '' : selectedSchool;
  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const schoolOptions = scopedSchools.filter((school) => !effectiveZone || school.zon === effectiveZone);
  const examOptions = exams
    .filter((exam) => exam.tahun_akademik === selectedYear)
    .sort((a, b) => a.kod_peperiksaan.localeCompare(b.kod_peperiksaan));

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
  const subjectMap = new Map(subjects.map((subject) => [subject.kod_subjek, subject]));
  const reportSubjects = useMemo(() => {
    if (!selectedClassRecord) return [];
    const allowed = subjects.filter((subject) => allowedSubjectForTahun(subject, selectedClassRecord.tahun));
    const fromMarks = selectedMarks
      .map((mark) => subjectMap.get(mark.kod_subjek) ?? mark.subjects)
      .filter((subject): subject is SubjectRecord => Boolean(subject));
    const merged = new Map<string, SubjectRecord>();
    [...allowed, ...fromMarks].forEach((subject) => merged.set(subject.kod_subjek, subject));
    return [...merged.values()].sort((a, b) => (a.susunan ?? 999) - (b.susunan ?? 999) || a.kod_subjek.localeCompare(b.kod_subjek));
  }, [selectedClassRecord, selectedMarks, subjectMap, subjects]);
  const markMap = new Map(selectedMarks.map((mark) => [`${mark.student_id}|${mark.kod_subjek}`, mark.markah]));

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

  return (
    <>
      <div className="panel-head">
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
          </div>

          <div className="table-scroll class-mark-report">
            <table>
              <thead>
                <tr>
                  <th>Bil</th>
                  <th>L/P</th>
                  <th className="student-name-col">Nama / MyKid / Jantina</th>
                  {reportSubjects.map((subject) => (
                    <th key={subject.kod_subjek} title={subject.nama_subjek}>
                      {subjectLabel(subject)}
                    </th>
                  ))}
                  <th>Jumlah</th>
                  <th>%</th>
                  <th>Gred</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.length === 0 ? (
                  <tr>
                    <td colSpan={reportSubjects.length + 6}>Tiada murid aktif dalam kelas ini.</td>
                  </tr>
                ) : (
                  classStudents.map((student, index) => {
                    const subjectMarks = reportSubjects.map((subject) => markMap.get(`${student.id}|${subject.kod_subjek}`));
                    const validMarks = subjectMarks.filter(
                      (markah): markah is number => markah !== null && markah !== undefined && Number.isFinite(markah),
                    );
                    const totalMarks = validMarks.reduce((total, markah) => total + markah, 0);
                    const average = validMarks.length > 0 ? Number((totalMarks / validMarks.length).toFixed(2)) : null;

                    return (
                      <tr key={student.id}>
                        <td>{index + 1}</td>
                        <td>{genderShort(student.jantina)}</td>
                        <td className="student-name-col">
                          <strong>{student.nama_murid}</strong>
                          <small>
                            {student.mykid} / {student.jantina ?? '-'}
                          </small>
                        </td>
                        {reportSubjects.map((subject) => {
                          const markah = markMap.get(`${student.id}|${subject.kod_subjek}`);
                          return (
                            <td key={subject.kod_subjek} className={scoreClass(markah)}>
                              {markah ?? '-'}
                              {markah !== null && markah !== undefined && <small>{gradeShort(markah)}</small>}
                            </td>
                          );
                        })}
                        <td className="score-total">{validMarks.length > 0 ? totalMarks : '-'}</td>
                        <td>{average ?? '-'}</td>
                        <td>{gradeForMark(average) || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
