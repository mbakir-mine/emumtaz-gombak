'use client';

import { useMemo, useState } from 'react';
import type { ClassRecord, ExamRecord, School, SubjectRecord } from '@/lib/data';
import { allowedSubjectForTahun } from '@/lib/subjects';

export default function MarkSelectionForm({
  schools,
  classes,
  exams,
  subjects,
  initialExamId,
  initialSchool,
  initialClassId,
  initialSubject,
}: {
  schools: School[];
  classes: ClassRecord[];
  exams: ExamRecord[];
  subjects: SubjectRecord[];
  initialExamId: string;
  initialSchool: string;
  initialClassId: string;
  initialSubject: string;
}) {
  const [selectedExamId, setSelectedExamId] = useState(initialExamId);
  const [selectedSchool, setSelectedSchool] = useState(initialSchool);
  const [selectedClassId, setSelectedClassId] = useState(initialClassId);
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);

  const filteredClasses = useMemo(
    () => classes.filter((item) => selectedSchool && item.kod_sekolah === selectedSchool),
    [classes, selectedSchool],
  );

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId),
    [classes, selectedClassId],
  );

  const filteredSubjects = useMemo(
    () => subjects.filter((subject) => (selectedClass ? allowedSubjectForTahun(subject, selectedClass.tahun) : false)),
    [subjects, selectedClass],
  );

  return (
    <form className="form-grid" method="get">
      <label>
        Peperiksaan
        <select
          name="exam_id"
          value={selectedExamId}
          onChange={(event) => setSelectedExamId(event.target.value)}
          required
        >
          <option value="">Pilih peperiksaan</option>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.kod_peperiksaan} {exam.tahun_akademik} - {exam.nama_peperiksaan}
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
          {schools.map((school) => (
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

