'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import type {
  ClassRecord,
  School,
  SchoolModuleAccess,
  StudentRecord,
  UpkkJakimItemMarkRecord,
  UpkkJakimMarkRecord,
} from '@/lib/data';
import {
  upkkAssessmentLabel,
  upkkComponentsByType,
  upkkJakimAssessmentOptions,
  upkkTotalMaxMark,
  type UpkkJakimAssessmentType,
} from '@/lib/upkkJakim';
import { upkkScorableQuestionsByType, type UpkkScorableQuestion } from '@/lib/upkkJakimQuestions';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses, scopeSchools, scopeStudents } from '../ui/scopedData';
import { saveUpkkJakimMarks, type UpkkJakimActionState } from './actions';

const initialState: UpkkJakimActionState = { ok: false, message: '' };
const UPKK_STUDENT_YEAR = 5;

function sortByClass(a: ClassRecord, b: ClassRecord) {
  return a.tahun - b.tahun || a.nama_kelas.localeCompare(b.nama_kelas, 'ms', { sensitivity: 'base' });
}

function classLabel(item: ClassRecord) {
  return `Tahun ${item.tahun} - ${item.nama_kelas}`;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function studentGenderLabel(value: string | null) {
  if (value === 'P' || value?.toLowerCase() === 'perempuan') return 'Perempuan';
  return 'Lelaki';
}

export default function UpkkJakimManager({
  schools,
  classes,
  students,
  marks,
  itemMarks,
  moduleAccesses,
}: {
  schools: School[];
  classes: ClassRecord[];
  students: StudentRecord[];
  marks: UpkkJakimMarkRecord[];
  itemMarks: UpkkJakimItemMarkRecord[];
  moduleAccesses: SchoolModuleAccess[];
}) {
  const profile = useAccessProfile();
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];
  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const scopedStudents = useMemo(() => scopeStudents(profile, students, classes, schools), [classes, profile, schools, students]);
  const [selectedSchool, setSelectedSchool] = useState(profile?.kod_sekolah ?? '');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedType, setSelectedType] = useState<UpkkJakimAssessmentType>('PCHI');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [state, action, pending] = useActionState(saveUpkkJakimMarks, initialState);

  useEffect(() => {
    if (!selectedSchool && scopedSchools.length === 1) {
      setSelectedSchool(scopedSchools[0].kod_sekolah);
    }
  }, [scopedSchools, selectedSchool]);

  const moduleEnabled = useMemo(() => {
    if (!profile || !selectedSchool) return false;
    if (profile.role === 'OWNER') return true;
    return moduleAccesses.some(
      (access) => access.kod_sekolah === selectedSchool && access.module_key === 'UPKK_JAKIM' && access.enabled,
    );
  }, [moduleAccesses, profile, selectedSchool]);

  const schoolClasses = useMemo(
    () =>
      scopedClasses
        .filter(
          (item) =>
            item.kod_sekolah === selectedSchool &&
            item.tahun_akademik === selectedYear &&
            item.tahun === UPKK_STUDENT_YEAR &&
            item.status === 'AKTIF',
        )
        .sort(sortByClass),
    [scopedClasses, selectedSchool, selectedYear],
  );

  useEffect(() => {
    if (selectedClassId && !schoolClasses.some((item) => item.id === selectedClassId)) {
      setSelectedClassId('');
    }
  }, [schoolClasses, selectedClassId]);

  useEffect(() => {
    setSelectedStudentId('');
  }, [selectedClassId, selectedType]);

  const selectedClass = schoolClasses.find((item) => item.id === selectedClassId) ?? null;
  const selectedSchoolRecord = scopedSchools.find((school) => school.kod_sekolah === selectedSchool) ?? null;
  const components = useMemo(() => upkkComponentsByType(selectedType), [selectedType]);
  const questions = useMemo(() => upkkScorableQuestionsByType(selectedType), [selectedType]);
  const maxTotal = upkkTotalMaxMark(selectedType);
  const classStudents = useMemo(
    () =>
      scopedStudents
        .filter((student) => student.class_id === selectedClassId && student.status === 'AKTIF')
        .sort((a, b) => a.nama_murid.localeCompare(b.nama_murid, 'ms', { sensitivity: 'base' })),
    [scopedStudents, selectedClassId],
  );

  const selectedStudent = classStudents.find((student) => student.mykid === selectedStudentId) ?? null;

  const summaryMarkMap = useMemo(() => {
    const map = new Map<string, UpkkJakimMarkRecord>();
    marks
      .filter(
        (mark) =>
          mark.tahun_akademik === selectedYear &&
          mark.class_id === selectedClassId &&
          mark.assessment_type === selectedType,
      )
      .forEach((mark) => map.set(`${mark.student_id}|${mark.component_key}`, mark));
    return map;
  }, [marks, selectedClassId, selectedType, selectedYear]);

  const itemMarkMap = useMemo(() => {
    const map = new Map<string, UpkkJakimItemMarkRecord>();
    itemMarks
      .filter(
        (mark) =>
          mark.tahun_akademik === selectedYear &&
          mark.class_id === selectedClassId &&
          mark.assessment_type === selectedType,
      )
      .forEach((mark) => map.set(`${mark.student_id}|${mark.item_key}`, mark));
    return map;
  }, [itemMarks, selectedClassId, selectedType, selectedYear]);

  const itemMarksByStudent = useMemo(() => {
    const map = new Map<string, UpkkJakimItemMarkRecord[]>();
    itemMarks
      .filter(
        (mark) =>
          mark.tahun_akademik === selectedYear &&
          mark.class_id === selectedClassId &&
          mark.assessment_type === selectedType,
      )
      .forEach((mark) => map.set(mark.student_id, [...(map.get(mark.student_id) ?? []), mark]));
    return map;
  }, [itemMarks, selectedClassId, selectedType, selectedYear]);

  function componentTotal(studentId: string, componentKey: string) {
    const studentItemMarks = itemMarksByStudent.get(studentId)?.filter((mark) => mark.component_key === componentKey) ?? [];
    if (studentItemMarks.length > 0) {
      return studentItemMarks.reduce((sum, mark) => sum + (mark.markah ?? 0), 0);
    }
    return summaryMarkMap.get(`${studentId}|${componentKey}`)?.markah ?? 0;
  }

  function studentTotal(studentId: string) {
    return components.reduce((sum, component) => sum + componentTotal(studentId, component.key), 0);
  }

  function questionsForComponent(componentKey: string): UpkkScorableQuestion[] {
    return questions.filter((question) => question.componentKey === componentKey);
  }

  const savedCount = [...summaryMarkMap.values()].filter((mark) => mark.markah !== null && mark.markah !== undefined).length;
  const selectedStudentTotal = selectedStudent ? studentTotal(selectedStudent.mykid) : 0;

  return (
    <section className="panel optional-module-panel upkk-panel">
      <div className="panel-head">
        <div>
          <h2>UPKK JAKIM</h2>
          <p>Pemarkahan Penghayatan Cara Hidup Islam (PCHI) dan Amali Solat untuk murid Tahun 5 sahaja.</p>
        </div>
        <span>{savedCount} skor disimpan</span>
      </div>

      <div className="module-toolbar">
        <label>
          Sekolah
          <select
            value={selectedSchool}
            onChange={(event) => {
              setSelectedSchool(event.target.value);
              setSelectedClassId('');
            }}
            disabled={profile?.role === 'ADMIN_SEKOLAH' || profile?.role === 'GURU_KELAS' || profile?.role === 'GURU_SUBJEK'}
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
          Tahun Akademik
          <select
            value={selectedYear}
            onChange={(event) => {
              setSelectedYear(Number(event.target.value));
              setSelectedClassId('');
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
          Kelas
          <select value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)} disabled={!selectedSchool}>
            <option value="">{selectedSchool ? 'Pilih kelas Tahun 5' : 'Pilih sekolah dahulu'}</option>
            {schoolClasses.map((item) => (
              <option key={item.id} value={item.id}>
                {classLabel(item)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!selectedSchool ? (
        <p className="empty">Pilih sekolah untuk menggunakan modul UPKK JAKIM.</p>
      ) : !moduleEnabled ? (
        <p className="empty">
          Sekolah ini belum diberi akses modul UPKK JAKIM. Pentadbir Utama perlu menanda modul UPKK di Tetapan &gt;
          Akses Modul Sekolah.
        </p>
      ) : (
        <>
          <div className="upkk-mode-tabs" role="tablist" aria-label="Jenis borang UPKK">
            {upkkJakimAssessmentOptions.map((option) => (
              <button
                className={selectedType === option.value ? 'active' : ''}
                key={option.value}
                type="button"
                onClick={() => setSelectedType(option.value)}
              >
                <strong>{option.shortLabel}</strong>
                <span>{option.label}</span>
              </button>
            ))}
          </div>

          <div className="upkk-summary-grid">
            {components.map((component) => (
              <article key={component.key}>
                <span>{component.section}</span>
                <strong>{component.title}</strong>
                <small>{formatNumber(component.maxMark)} markah</small>
              </article>
            ))}
            <article className="upkk-total-card">
              <span>Jumlah</span>
              <strong>{formatNumber(maxTotal)}</strong>
              <small>markah penuh</small>
            </article>
          </div>

          {!selectedClass ? (
            <p className="empty">
              Pilih kelas Tahun 5 untuk memaparkan senarai murid. UPKK JAKIM tidak melibatkan murid tahun lain.
            </p>
          ) : classStudents.length === 0 ? (
            <p className="empty">Tiada murid aktif dalam kelas ini.</p>
          ) : (
            <div className="upkk-entry-form">
              <div className="panel-head compact-head">
                <div>
                  <h3>
                    {upkkAssessmentLabel(selectedType)} {selectedYear}
                  </h3>
                  <p className="table-note">
                    {selectedSchoolRecord?.nama_sekolah ?? selectedSchool} - {classLabel(selectedClass)}
                  </p>
                </div>
                <span>
                  {classStudents.length} murid / {formatNumber(maxTotal)} markah
                </span>
              </div>

              <div className="table-scroll">
                <table className="data-table compact-table upkk-table">
                  <thead>
                    <tr>
                      <th>Bil</th>
                      <th>Nama Murid</th>
                      {components.map((component) => (
                        <th key={component.key}>
                          {component.section}
                          <small>{component.title}</small>
                        </th>
                      ))}
                      <th>Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((student, index) => {
                      const total = studentTotal(student.mykid);
                      return (
                        <tr key={student.id} className={selectedStudentId === student.mykid ? 'selected-row' : ''}>
                          <td>{index + 1}</td>
                          <td>
                            <button
                              type="button"
                              className="upkk-student-button"
                              onClick={() => setSelectedStudentId(student.mykid)}
                            >
                              <strong>{student.nama_murid}</strong>
                              <small>{studentGenderLabel(student.jantina)}</small>
                            </button>
                          </td>
                          {components.map((component) => (
                            <td key={`${student.id}-${component.key}`} className="upkk-score-total">
                              {formatNumber(componentTotal(student.mykid, component.key))}
                              <small>/{formatNumber(component.maxMark)}</small>
                            </td>
                          ))}
                          <td className="upkk-score-total">
                            {formatNumber(total)}
                            <small>{Math.round((total / maxTotal) * 100) || 0}%</small>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {!selectedStudent ? (
                <p className="empty">Klik nama murid untuk membuka borang soalan {upkkAssessmentLabel(selectedType)}.</p>
              ) : (
                <form action={action} className="upkk-student-detail-form">
                  <input type="hidden" name="kod_sekolah" value={selectedSchool} />
                  <input type="hidden" name="tahun_akademik" value={selectedYear} />
                  <input type="hidden" name="class_id" value={selectedClass.id} />
                  <input type="hidden" name="assessment_type" value={selectedType} />
                  <input type="hidden" name="teacher_id" value={profile?.id ?? ''} />
                  <input type="hidden" name="student_id" value={selectedStudent.mykid} />

                  <div className="panel-head compact-head">
                    <div>
                      <h3>
                        Borang {upkkJakimAssessmentOptions.find((item) => item.value === selectedType)?.shortLabel} -{' '}
                        {selectedStudent.nama_murid}
                      </h3>
                      <p className="table-note">
                        {classLabel(selectedClass)} - {studentGenderLabel(selectedStudent.jantina)}
                      </p>
                    </div>
                    <span>
                      {formatNumber(selectedStudentTotal)} / {formatNumber(maxTotal)}
                    </span>
                  </div>

                  <div className="upkk-question-sections">
                    {components.map((component) => {
                      const componentQuestions = questionsForComponent(component.key);
                      const subtotal = componentTotal(selectedStudent.mykid, component.key);
                      return (
                        <article className="upkk-question-section" key={component.key}>
                          <div className="upkk-question-section-head">
                            <div>
                              <span>{component.section}</span>
                              <strong>{component.title}</strong>
                            </div>
                            <em>
                              {formatNumber(subtotal)} / {formatNumber(component.maxMark)}
                            </em>
                          </div>
                          {component.key === 'PCHI_D' && (
                            <p className="upkk-section-note">
                              Bahagian D mempunyai banyak item pilihan. Isi item yang berkaitan sahaja dan jumlah bahagian ini
                              dikawal maksimum {formatNumber(component.maxMark)} markah.
                            </p>
                          )}
                          <div className="upkk-question-list">
                            {componentQuestions.map((question) => {
                              const saved = itemMarkMap.get(`${selectedStudent.mykid}|${question.key}`);
                              return (
                                <label className="upkk-question-row" key={question.key}>
                                  <span className="upkk-question-copy">
                                    <strong>
                                      {question.number} {question.title}
                                    </strong>
                                    {question.helper && <small>{question.helper}</small>}
                                  </span>
                                  <input
                                    className="upkk-score-input"
                                    name={`item_mark_${question.key}`}
                                    type="number"
                                    min="0"
                                    max={question.maxMark}
                                    step="0.5"
                                    defaultValue={saved?.markah ?? ''}
                                    placeholder={`/${formatNumber(question.maxMark)}`}
                                  />
                                </label>
                              );
                            })}
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <div className="form-actions">
                    <button className="button" type="submit" disabled={pending}>
                      {pending ? 'Menyimpan...' : `Simpan ${upkkJakimAssessmentOptions.find((item) => item.value === selectedType)?.shortLabel}`}
                    </button>
                    {state.message && <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>}
                  </div>
                </form>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
