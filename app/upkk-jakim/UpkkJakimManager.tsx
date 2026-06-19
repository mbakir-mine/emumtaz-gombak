'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import type { ClassRecord, School, SchoolModuleAccess, StudentRecord, UpkkJakimMarkRecord } from '@/lib/data';
import {
  upkkAssessmentLabel,
  upkkComponentsByType,
  upkkJakimAssessmentOptions,
  upkkTotalMaxMark,
  type UpkkJakimAssessmentType,
} from '@/lib/upkkJakim';
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

export default function UpkkJakimManager({
  schools,
  classes,
  students,
  marks,
  moduleAccesses,
}: {
  schools: School[];
  classes: ClassRecord[];
  students: StudentRecord[];
  marks: UpkkJakimMarkRecord[];
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

  const selectedClass = schoolClasses.find((item) => item.id === selectedClassId) ?? null;
  const selectedSchoolRecord = scopedSchools.find((school) => school.kod_sekolah === selectedSchool) ?? null;
  const components = useMemo(() => upkkComponentsByType(selectedType), [selectedType]);
  const maxTotal = upkkTotalMaxMark(selectedType);
  const classStudents = useMemo(
    () =>
      scopedStudents
        .filter((student) => student.class_id === selectedClassId && student.status === 'AKTIF')
        .sort((a, b) => a.nama_murid.localeCompare(b.nama_murid, 'ms', { sensitivity: 'base' })),
    [scopedStudents, selectedClassId],
  );

  const markMap = useMemo(() => {
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

  const assessmentTotals = useMemo(() => {
    const totals = new Map<string, number>();
    classStudents.forEach((student) => {
      const total = components.reduce((sum, component) => {
        const mark = markMap.get(`${student.id}|${component.key}`)?.markah;
        return sum + (typeof mark === 'number' ? mark : 0);
      }, 0);
      totals.set(student.id, total);
    });
    return totals;
  }, [classStudents, components, markMap]);

  const savedCount = [...markMap.values()].filter((mark) => mark.markah !== null && mark.markah !== undefined).length;

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
            <form action={action} className="upkk-entry-form">
              <input type="hidden" name="kod_sekolah" value={selectedSchool} />
              <input type="hidden" name="tahun_akademik" value={selectedYear} />
              <input type="hidden" name="class_id" value={selectedClass.id} />
              <input type="hidden" name="assessment_type" value={selectedType} />
              <input type="hidden" name="teacher_id" value={profile?.id ?? ''} />

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
                          <em>{formatNumber(component.maxMark)} markah</em>
                        </th>
                      ))}
                      <th>Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((student, index) => {
                      const total = assessmentTotals.get(student.id) ?? 0;
                      return (
                        <tr key={student.id}>
                          <td>{index + 1}</td>
                          <td>
                            <input type="hidden" name="student_id" value={student.id} />
                            <strong>{student.nama_murid}</strong>
                            <small>{student.jantina === 'P' ? 'Perempuan' : 'Lelaki'}</small>
                          </td>
                          {components.map((component) => {
                            const saved = markMap.get(`${student.id}|${component.key}`);
                            return (
                              <td key={`${student.id}-${component.key}`}>
                                <input
                                  className="upkk-score-input"
                                  name={`markah_${student.id}_${component.key}`}
                                  type="number"
                                  min="0"
                                  max={component.maxMark}
                                  step="0.5"
                                  defaultValue={saved?.markah ?? ''}
                                  placeholder="-"
                                />
                              </td>
                            );
                          })}
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

              <div className="form-actions">
                <button className="button" type="submit" disabled={pending}>
                  {pending ? 'Menyimpan...' : `Simpan ${upkkJakimAssessmentOptions.find((item) => item.value === selectedType)?.shortLabel}`}
                </button>
                {state.message && <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>}
              </div>
            </form>
          )}
        </>
      )}
    </section>
  );
}
