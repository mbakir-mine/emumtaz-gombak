'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  ClassRecord,
  ExamRecord,
  School,
  SubjectRecord,
  TeacherSubjectAssignment,
  TeacherSubjectComponentAssignment,
} from '@/lib/data';
import { allowedSubjectForTahun } from '@/lib/subjects';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses, scopeSchools } from '../ui/scopedData';

type MarkMode = 'school' | 'mine';

export default function MarkSelectionForm({
  schools,
  classes,
  exams,
  subjects,
  subjectAssignments,
  componentAssignments,
  initialYear,
  initialExamId,
  initialSchool,
  initialClassId,
  initialSubject,
  initialMode,
}: {
  schools: School[];
  classes: ClassRecord[];
  exams: ExamRecord[];
  subjects: SubjectRecord[];
  subjectAssignments: TeacherSubjectAssignment[];
  componentAssignments: TeacherSubjectComponentAssignment[];
  initialYear: number;
  initialExamId: string;
  initialSchool: string;
  initialClassId: string;
  initialSubject: string;
  initialMode: MarkMode;
}) {
  const profile = useAccessProfile();
  const yearOptions = [2025, 2026, 2027, 2028, 2029, 2030];
  const [selectedMode, setSelectedMode] = useState<MarkMode>(initialMode);
  const [selectedExamId, setSelectedExamId] = useState(initialExamId);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedSchool, setSelectedSchool] = useState(initialSchool);
  const [selectedClassId, setSelectedClassId] = useState(initialClassId);
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const myTeachingKeys = useMemo(() => {
    const keys = new Set<string>();
    if (!profile?.id) return keys;

    subjectAssignments
      .filter((assignment) => assignment.user_id === profile.id)
      .forEach((assignment) => keys.add(`${assignment.class_id}|${assignment.kod_subjek}`));

    componentAssignments
      .filter((assignment) => assignment.user_id === profile.id)
      .forEach((assignment) => keys.add(`${assignment.class_id}|${assignment.kod_subjek}`));

    return keys;
  }, [componentAssignments, profile?.id, subjectAssignments]);

  const myTeachingClassIds = useMemo(() => {
    const classIds = new Set<string>();
    myTeachingKeys.forEach((key) => classIds.add(key.split('|')[0]));
    return classIds;
  }, [myTeachingKeys]);
  const hasTeachingAssignments = myTeachingKeys.size > 0;
  const showModeToggle = profile?.role === 'ADMIN_SEKOLAH' || hasTeachingAssignments;

  useEffect(() => {
    if (selectedMode === 'mine' && !hasTeachingAssignments) {
      setSelectedMode('school');
    }
  }, [hasTeachingAssignments, selectedMode]);

  useEffect(() => {
    if (!selectedSchool && scopedSchools.length === 1) {
      setSelectedSchool(scopedSchools[0].kod_sekolah);
      return;
    }

    if (selectedSchool && !scopedSchools.some((school) => school.kod_sekolah === selectedSchool)) {
      setSelectedSchool('');
      setSelectedClassId('');
      setSelectedSubject('');
    }
  }, [scopedSchools, selectedSchool]);

  const filteredClasses = useMemo(
    () => {
      const baseClasses = scopedClasses.filter(
        (item) =>
          selectedSchool &&
          item.kod_sekolah === selectedSchool &&
          item.tahun_akademik === selectedYear &&
          item.status === 'AKTIF',
      );

      if (selectedMode !== 'mine') return baseClasses;
      return baseClasses.filter((item) => myTeachingClassIds.has(item.id));
    },
    [myTeachingClassIds, scopedClasses, selectedMode, selectedSchool, selectedYear],
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
    () => {
      const allowedSubjects = subjects.filter((subject) =>
        selectedClass ? allowedSubjectForTahun(subject, selectedClass.tahun) : false,
      );

      if (!selectedClass || selectedMode !== 'mine') return allowedSubjects;
      return allowedSubjects.filter((subject) => myTeachingKeys.has(`${selectedClass.id}|${subject.kod_subjek}`));
    },
    [myTeachingKeys, selectedClass, selectedMode, subjects],
  );

  useEffect(() => {
    if (!selectedClassId) return;
    if (!filteredClasses.some((item) => item.id === selectedClassId)) {
      setSelectedClassId('');
      setSelectedSubject('');
    }
  }, [filteredClasses, selectedClassId]);

  useEffect(() => {
    if (!selectedSubject) return;
    if (!filteredSubjects.some((subject) => subject.kod_subjek === selectedSubject)) {
      setSelectedSubject('');
    }
  }, [filteredSubjects, selectedSubject]);

  return (
    <form className="form-grid inline-form" method="get">
      <input name="mode" type="hidden" value={selectedMode} />
      {showModeToggle && (
        <div className="mark-mode-toggle">
          <button
            type="button"
            className={selectedMode === 'school' ? 'mark-mode-button active' : 'mark-mode-button'}
            onClick={() => {
              setSelectedMode('school');
              setSelectedClassId('');
              setSelectedSubject('');
            }}
          >
            Semua Markah Sekolah
          </button>
          <button
            type="button"
            className={selectedMode === 'mine' ? 'mark-mode-button active' : 'mark-mode-button'}
            onClick={() => {
              setSelectedMode('mine');
              setSelectedClassId('');
              setSelectedSubject('');
            }}
            disabled={!hasTeachingAssignments}
            title={hasTeachingAssignments ? 'Papar kelas dan subjek yang ditetapkan kepada saya' : 'Belum ada tugasan guru subjek'}
          >
            Markah Subjek Saya
          </button>
        </div>
      )}

      <label>
        Tahun Akademik
        <select
          name="tahun_akademik"
          value={selectedYear}
          onChange={(event) => {
            setSelectedYear(Number(event.target.value));
            setSelectedExamId('');
            setSelectedClassId('');
            setSelectedSubject('');
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
