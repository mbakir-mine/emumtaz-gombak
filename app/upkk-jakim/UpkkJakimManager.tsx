'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses, scopeSchools, scopeStudents } from '../ui/scopedData';

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

function isUpkkAssessmentType(value: string | null | undefined): value is UpkkJakimAssessmentType {
  return value === 'PCHI' || value === 'AMALI_SOLAT';
}

export default function UpkkJakimManager({
  schools,
  classes,
  students,
  marks,
  itemMarks,
  moduleAccesses,
  initialSchool,
  initialYear,
  initialClassId,
  initialType,
}: {
  schools: School[];
  classes: ClassRecord[];
  students: StudentRecord[];
  marks: UpkkJakimMarkRecord[];
  itemMarks: UpkkJakimItemMarkRecord[];
  moduleAccesses: SchoolModuleAccess[];
  initialSchool?: string;
  initialYear?: number;
  initialClassId?: string;
  initialType?: string;
}) {
  const profile = useAccessProfile();
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];
  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const scopedStudents = useMemo(() => scopeStudents(profile, students, classes, schools), [classes, profile, schools, students]);
  const [selectedSchool, setSelectedSchool] = useState(initialSchool ?? profile?.kod_sekolah ?? '');
  const [selectedYear, setSelectedYear] = useState(initialYear ?? currentYear);
  const [selectedClassId, setSelectedClassId] = useState(initialClassId ?? '');
  const [selectedType, setSelectedType] = useState<UpkkJakimAssessmentType>(
    isUpkkAssessmentType(initialType) ? initialType : 'PCHI',
  );

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

  const savedCount = [...summaryMarkMap.values()].filter((mark) => mark.markah !== null && mark.markah !== undefined).length;

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
                      const href = `/upkk-jakim/murid/${encodeURIComponent(student.mykid)}?sekolah=${encodeURIComponent(
                        selectedSchool,
                      )}&tahun=${selectedYear}&kelas=${selectedClass.id}&jenis=${selectedType}`;
                      return (
                        <tr key={student.id}>
                          <td>{index + 1}</td>
                          <td>
                            <Link className="upkk-student-button" href={href}>
                              <strong>{student.nama_murid}</strong>
                              <small>{studentGenderLabel(student.jantina)}</small>
                            </Link>
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

              <p className="empty">Klik nama murid untuk membuka borang pemarkahan khusus di halaman baharu.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
