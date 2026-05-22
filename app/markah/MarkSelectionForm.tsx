'use client';

import { useMemo, useState } from 'react';
import type { ClassRecord, ExamRecord, School, SubjectRecord } from '@/lib/data';
import { allowedSubjectForTahun } from '@/lib/subjects';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses, scopeSchools } from '../ui/scopedData';

export default function MarkSelectionForm({
  schools,
  classes,
  exams,
  subjects,
  initialYear,
  initialExamId,
  initialSchool,
  initialClassId,
  initialSubject,
}: {
  schools: School[];
  classes: ClassRecord[];
  exams: ExamRecord[];
  subjects: SubjectRecord[];
  initialYear: number;
  initialExamId: string;
  initialSchool: string;
  initialClassId: string;
  initialSubject: string;
}) {
  const profile = useAccessProfile();
  const yearOptions = [2025, 2026, 2027, 2028, 2029, 2030];
  const [selectedExamId, setSelectedExamId] = useState(initialExamId);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedSchool, setSelectedSchool] = useState(initialSchool);
  const [selectedClassId, setSelectedClassId] = useState(initialClassId);
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);

  const filteredClasses = useMemo(
    () => scopedClasses.filter((item) => selectedSchool && item.kod_sekolah === selectedSchool),
    [scopedClasses, selectedSchool],
  );
  const filteredExams = useMemo(
    () => exams.filter((exam) => exam.tahun_akademik === selectedYear),
    [exams, selectedYear],
  );

  const selectedClass = useMemo(
    () => scopedClasses.find((item) => item.id === selectedClassId),
    [scopedClasses, selectedClassId],
  );

  const filteredSubjects = useMemo(
    () => subjects.filter((subject) => (selectedClass ? allowedSubjectForTahun(subject, selectedClass.tahun) : false)),
    [subjects, selectedClass],
  );

  return (
    <form className="form-grid" method="get">
      <label>
        Tahun Akademik
        <select
          name="tahun_akademik"
          value={selectedYear}
          onChange={(event) => {
            setSelectedYear(Number(event.target.value));
            setSelectedExamId('');
          }}
          required
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
          name="exam_id"
          value={selectedExamId}
          onChange={(event) => setSelectedExamId(event.target.value)}
          required
        >
          <option value="">Pilih peperiksaan</option>
          {filteredExams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.kod_peperiksaan} - {exam.nama_peperiksaan}
            </option>
          ))}
        </select>
      </label>

      <label>
        Sekolah
        <select
          name="kod_sekolah"
          value={selectedSchool}
          onChange={(event) => {
            setSelectedSchool(event.target.value);
            setSelectedClassId('');
            setSelectedSubject('');
          }}
          required
        >
          <option value="">Pilih sekolah</option>
          {scopedSchools.map((school) => (
            <option key={school.kod_sekolah} value={school.kod_sekolah}>
              {school.kod_sekolah} - {school.nama_sekolah}
            </option>
          ))}
        </select>
      </label>

      <label>
        Kelas
        <select
          name="class_id"
          value={selectedClassId}
          onChange={(event) => {
            setSelectedClassId(event.target.value);
            setSelectedSubject('');
          }}
          required
          disabled={!selectedSchool}
        >
          <option value="">{selectedSchool ? 'Pilih kelas' : 'Pilih sekolah dahulu'}</option>
          {filteredClasses.map((item) => (
            <option key={item.id} value={item.id}>
              Tahun {item.tahun} - {item.nama_kelas} ({item.tahun_akademik})
            </option>
          ))}
        </select>
      </label>

      <label>
        Subjek / Kertas
        <select
          name="kod_subjek"
          value={selectedSubject}
          onChange={(event) => setSelectedSubject(event.target.value)}
          required
          disabled={!selectedClassId}
        >
          <option value="">{selectedClassId ? 'Pilih subjek' : 'Pilih kelas dahulu'}</option>
          {filteredSubjects.map((subject) => (
            <option key={subject.kod_subjek} value={subject.kod_subjek}>
              {subject.kod_subjek} - {subject.nama_subjek}
            </option>
          ))}
        </select>
      </label>

      <div className="form-actions">
        <button className="button secondary" type="submit">
          Papar Murid
        </button>
      </div>
    </form>
  );
}
