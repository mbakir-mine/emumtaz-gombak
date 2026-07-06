'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import type { ClassRecord, School, SchoolModuleAccess, StudentRecord, UpkkAmaliSolatRecord } from '@/lib/data';
import {
  calculateUpkkAmaliTotal,
  UPKK_AMALI_SOLAT_SECTIONS,
  UPKK_AMALI_SOLAT_TOTAL,
  type UpkkAmaliSection,
} from '@/lib/upkkAmaliSolat';
import { useAccessProfile } from '../ui/AuthGate';
import { initialUpkkActionState, saveUpkkAmaliSolat } from './actions';

type UpkkAmaliSolatManagerProps = {
  schools: School[];
  moduleAccesses: SchoolModuleAccess[];
  classes: ClassRecord[];
  students: StudentRecord[];
  records: UpkkAmaliSolatRecord[];
};

function isActive(status: string | null | undefined) {
  return (status ?? '').toUpperCase() === 'AKTIF';
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return '0';
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
}

function genderLabel(value: string | null) {
  const normalized = (value ?? '').trim().toUpperCase();
  if (normalized === 'L' || normalized === 'LELAKI') return 'Lelaki';
  if (normalized === 'P' || normalized === 'PEREMPUAN') return 'Perempuan';
  return value || '-';
}

function sectionScore(section: UpkkAmaliSection, scores: Record<string, number>) {
  return section.groups.reduce(
    (sectionTotal, group) =>
      sectionTotal +
      group.items.reduce((groupTotal, item) => groupTotal + Number(scores[item.code] ?? 0), 0),
    0,
  );
}

export default function UpkkAmaliSolatManager({
  schools,
  moduleAccesses,
  classes,
  students,
  records,
}: UpkkAmaliSolatManagerProps) {
  const profile = useAccessProfile();
  const currentYear = new Date().getFullYear();

  const selectableSchools = useMemo(() => {
    if (profile?.role === 'OWNER') {
      return schools.filter((school) => isActive(school.status)).sort((a, b) => a.kod_sekolah.localeCompare(b.kod_sekolah));
    }

    if (!profile?.kod_sekolah) return [];
    return schools.filter((school) => school.kod_sekolah === profile.kod_sekolah);
  }, [profile?.kod_sekolah, profile?.role, schools]);

  const years = useMemo(() => {
    const uniqueYears = new Set<number>([currentYear]);
    classes.forEach((classRecord) => uniqueYears.add(Number(classRecord.tahun_akademik)));
    return Array.from(uniqueYears).sort((a, b) => b - a);
  }, [classes, currentYear]);

  const [selectedSchool, setSelectedSchool] = useState(selectableSchools[0]?.kod_sekolah ?? '');
  const [selectedYear, setSelectedYear] = useState(years.includes(currentYear) ? currentYear : years[0] ?? currentYear);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [actionState, formAction, isPending] = useActionState(saveUpkkAmaliSolat, initialUpkkActionState);

  useEffect(() => {
    if (!selectedSchool && selectableSchools[0]) {
      setSelectedSchool(selectableSchools[0].kod_sekolah);
    }
  }, [selectableSchools, selectedSchool]);

  const selectedSchoolRecord = useMemo(
    () => schools.find((school) => school.kod_sekolah === selectedSchool) ?? null,
    [schools, selectedSchool],
  );

  const hasModuleAccess = useMemo(() => {
    if (!selectedSchool) return false;
    if (profile?.role === 'OWNER') return true;
    return moduleAccesses.some(
      (access) =>
        access.kod_sekolah === selectedSchool && access.module_key === 'PENILAIAN_UPKK' && Boolean(access.enabled),
    );
  }, [moduleAccesses, profile?.role, selectedSchool]);

  const yearFiveClasses = useMemo(
    () =>
      classes
        .filter(
          (classRecord) =>
            classRecord.kod_sekolah === selectedSchool &&
            Number(classRecord.tahun_akademik) === selectedYear &&
            Number(classRecord.tahun) === 5 &&
            isActive(classRecord.status),
        )
        .sort((a, b) => a.nama_kelas.localeCompare(b.nama_kelas)),
    [classes, selectedSchool, selectedYear],
  );

  useEffect(() => {
    if (!yearFiveClasses.some((classRecord) => classRecord.id === selectedClassId)) {
      setSelectedClassId(yearFiveClasses[0]?.id ?? '');
    }
  }, [selectedClassId, yearFiveClasses]);

  const selectedClass = useMemo(
    () => yearFiveClasses.find((classRecord) => classRecord.id === selectedClassId) ?? null,
    [selectedClassId, yearFiveClasses],
  );

  const studentsInClass = useMemo(
    () =>
      students
        .filter((student) => student.class_id === selectedClassId && student.kod_sekolah === selectedSchool && isActive(student.status))
        .sort((a, b) => a.nama_murid.localeCompare(b.nama_murid)),
    [selectedClassId, selectedSchool, students],
  );

  useEffect(() => {
    if (!studentsInClass.some((student) => student.mykid === selectedStudentId)) {
      setSelectedStudentId(studentsInClass[0]?.mykid ?? '');
    }
  }, [selectedStudentId, studentsInClass]);

  const recordsForClass = useMemo(
    () =>
      records.filter(
        (record) =>
          record.kod_sekolah === selectedSchool &&
          Number(record.tahun_akademik) === selectedYear &&
          record.class_id === selectedClassId,
      ),
    [records, selectedClassId, selectedSchool, selectedYear],
  );

  const recordByStudent = useMemo(
    () => new Map(recordsForClass.map((record) => [record.student_id, record])),
    [recordsForClass],
  );

  const selectedStudent = useMemo(
    () => studentsInClass.find((student) => student.mykid === selectedStudentId) ?? null,
    [selectedStudentId, studentsInClass],
  );

  const selectedRecord = selectedStudent ? recordByStudent.get(selectedStudent.mykid) ?? null : null;
  const selectedScores = selectedRecord?.scores ?? {};
  const selectedTotal = calculateUpkkAmaliTotal(selectedScores);
  const completedCount = studentsInClass.filter((student) => Number(recordByStudent.get(student.mykid)?.jumlah ?? 0) > 0).length;
  const classAverage = completedCount
    ? recordsForClass.reduce((total, record) => total + Number(record.jumlah ?? 0), 0) / completedCount
    : 0;

  return (
    <section className="panel upkk-panel">
      <div className="module-head">
        <div>
          <h2>UPKK - Amali Solat</h2>
          <p>Borang penilaian Amali Solat hanya untuk murid Tahun 5.</p>
        </div>
        <strong>{studentsInClass.length} murid</strong>
      </div>

      <div className="upkk-filter-grid">
        <label>
          Sekolah
          <select value={selectedSchool} onChange={(event) => setSelectedSchool(event.target.value)}>
            {selectableSchools.map((school) => (
              <option key={school.kod_sekolah} value={school.kod_sekolah}>
                {school.kod_sekolah} - {school.nama_sekolah}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tahun Akademik
          <select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label>
          Kelas Tahun 5
          <select
            value={selectedClassId}
            onChange={(event) => setSelectedClassId(event.target.value)}
            disabled={!hasModuleAccess || yearFiveClasses.length === 0}
          >
            {yearFiveClasses.length === 0 ? (
              <option value="">Tiada kelas Tahun 5</option>
            ) : (
              yearFiveClasses.map((classRecord) => (
                <option key={classRecord.id} value={classRecord.id}>
                  {classRecord.nama_kelas}
                </option>
              ))
            )}
          </select>
        </label>
      </div>

      {!selectedSchool && <p className="empty-state">Tiada sekolah untuk dipaparkan.</p>}

      {selectedSchool && !hasModuleAccess && (
        <p className="form-alert">
          Sekolah ini belum diberi akses kepada modul Penilaian UPKK. Aktifkan dahulu melalui halaman Akses Modul Pilihan
          Sekolah.
        </p>
      )}

      {selectedSchool && hasModuleAccess && yearFiveClasses.length === 0 && (
        <p className="empty-state">Tiada kelas Tahun 5 aktif untuk sesi {selectedYear}.</p>
      )}

      {selectedSchool && hasModuleAccess && yearFiveClasses.length > 0 && (
        <>
          <div className="upkk-summary-grid">
            <div className="upkk-summary-card">
              <span>Sekolah</span>
              <strong>{selectedSchoolRecord?.nama_sekolah ?? selectedSchool}</strong>
            </div>
            <div className="upkk-summary-card">
              <span>Kelas</span>
              <strong>{selectedClass?.nama_kelas ?? '-'}</strong>
            </div>
            <div className="upkk-summary-card">
              <span>Selesai Dinilai</span>
              <strong>{completedCount} murid</strong>
            </div>
            <div className="upkk-summary-card">
              <span>Purata Kelas</span>
              <strong>{formatNumber(classAverage)} / {UPKK_AMALI_SOLAT_TOTAL}</strong>
            </div>
          </div>

          <div className="upkk-layout">
            <div className="upkk-student-list">
              <div className="upkk-card-head">
                <h3>Senarai Murid Tahun 5</h3>
                <span>{studentsInClass.length} murid</span>
              </div>

              {studentsInClass.length === 0 ? (
                <p className="empty-state">Tiada murid aktif dalam kelas ini.</p>
              ) : (
                <div className="table-scroll">
                  <table className="data-table compact-table upkk-student-table">
                    <thead>
                      <tr>
                        <th>BIL</th>
                        <th>NAMA MURID</th>
                        <th>JANTINA</th>
                        <th>JUMLAH</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsInClass.map((student, index) => {
                        const record = recordByStudent.get(student.mykid);
                        const rowSelected = student.mykid === selectedStudentId;
                        const total = Number(record?.jumlah ?? 0);
                        return (
                          <tr key={student.mykid} className={rowSelected ? 'upkk-selected-row' : undefined}>
                            <td>{index + 1}</td>
                            <td>
                              <button
                                type="button"
                                className="upkk-student-button"
                                onClick={() => setSelectedStudentId(student.mykid)}
                              >
                                {student.nama_murid}
                              </button>
                            </td>
                            <td>{genderLabel(student.jantina)}</td>
                            <td>{formatNumber(total)}</td>
                            <td>{total > 0 ? 'Dinilai' : 'Belum dinilai'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <form
              key={`${selectedClassId}-${selectedStudentId}-${selectedRecord?.id ?? 'baharu'}`}
              action={formAction}
              className="upkk-form-card"
            >
              <input type="hidden" name="kod_sekolah" value={selectedSchool} />
              <input type="hidden" name="tahun_akademik" value={selectedYear} />
              <input type="hidden" name="class_id" value={selectedClassId} />
              <input type="hidden" name="student_id" value={selectedStudentId} />

              <div className="upkk-form-head">
                <div>
                  <p>{selectedSchoolRecord ? `${selectedSchoolRecord.kod_sekolah} - ${selectedSchoolRecord.nama_sekolah}` : selectedSchool}</p>
                  <h3>Borang Amali Solat</h3>
                  <strong>{selectedStudent?.nama_murid ?? 'Pilih murid'}</strong>
                  <span>{selectedClass?.nama_kelas ?? '-'} / {selectedYear}</span>
                </div>
                <strong className="upkk-total">{formatNumber(selectedTotal)} / {UPKK_AMALI_SOLAT_TOTAL}</strong>
              </div>

              {!selectedStudent ? (
                <p className="empty-state">Pilih murid untuk memasukkan markah.</p>
              ) : (
                UPKK_AMALI_SOLAT_SECTIONS.map((section) => {
                  const total = sectionScore(section, selectedScores);
                  return (
                    <section key={section.code} className="upkk-section-card">
                      <div className="upkk-section-head">
                        <div>
                          <span>{section.title}</span>
                          <strong>{section.fullTitle}</strong>
                        </div>
                        <strong>{formatNumber(total)} / {section.total}</strong>
                      </div>

                      {section.groups.map((group) => (
                        <div key={group.code} className="upkk-group">
                          <p className="upkk-group-title">
                            {group.code} {group.title}
                          </p>
                          {group.items.map((item) => (
                            <label key={item.code} className="upkk-item-row">
                              <span className="upkk-item-code">{item.code}</span>
                              <span>{item.label}</span>
                              <input
                                className="upkk-score-input"
                                type="number"
                                name={`score_${item.code}`}
                                min="0"
                                max={item.max}
                                step="0.5"
                                defaultValue={
                                  selectedScores[item.code] === undefined ? '' : formatNumber(Number(selectedScores[item.code]))
                                }
                                placeholder={`/${item.max}`}
                              />
                            </label>
                          ))}
                        </div>
                      ))}
                    </section>
                  );
                })
              )}

              <button className="button upkk-submit-button" type="submit" disabled={isPending || !selectedStudent}>
                {isPending ? 'Menyimpan...' : 'Simpan Markah'}
              </button>
              {actionState.message && (
                <p className={actionState.ok ? 'upkk-message-ok' : 'upkk-message-error'}>{actionState.message}</p>
              )}
            </form>
          </div>
        </>
      )}
    </section>
  );
}
