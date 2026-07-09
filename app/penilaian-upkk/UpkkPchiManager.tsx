'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import type { ClassRecord, School, SchoolModuleAccess, StudentRecord, UpkkPchiRecord } from '@/lib/data';
import {
  calculateUpkkPchiTotal,
  UPKK_PCHI_SECTIONS,
  UPKK_PCHI_TOTAL,
  type UpkkPchiSection,
} from '@/lib/upkkPchi';
import { useAccessProfile } from '../ui/AuthGate';
import { initialUpkkActionState, saveUpkkPchi } from './actions';

type UpkkPchiManagerProps = {
  schools: School[];
  moduleAccesses: SchoolModuleAccess[];
  classes: ClassRecord[];
  students: StudentRecord[];
  records: UpkkPchiRecord[];
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

function sectionScore(section: UpkkPchiSection, scores: Record<string, number>) {
  return section.groups.reduce(
    (sectionTotal, group) =>
      sectionTotal +
      group.items.reduce((groupTotal, item) => groupTotal + Number(scores[item.code] ?? 0), 0),
    0,
  );
}

function escapeExcelCell(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sanitizeFilePart(value: string | number | null | undefined) {
  const clean = String(value ?? 'data')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return clean.slice(0, 80) || 'data';
}

export default function UpkkPchiManager({
  schools,
  moduleAccesses,
  classes,
  students,
  records,
}: UpkkPchiManagerProps) {
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
  const [actionState, formAction, isPending] = useActionState(saveUpkkPchi, initialUpkkActionState);

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
  const selectedTotal = calculateUpkkPchiTotal(selectedScores);
  const completedCount = studentsInClass.filter((student) => Number(recordByStudent.get(student.mykid)?.jumlah ?? 0) > 0).length;
  const classAverage = completedCount
    ? recordsForClass.reduce((total, record) => total + Number(record.jumlah ?? 0), 0) / completedCount
    : 0;

  function handleDownloadExcel() {
    if (!selectedSchoolRecord || !selectedClass || studentsInClass.length === 0) return;

    const exportItems = UPKK_PCHI_SECTIONS.flatMap((section) =>
      section.groups.flatMap((group) =>
        group.items.map((item) => ({
          ...item,
          sectionTitle: section.fullTitle,
          groupTitle: group.title,
        })),
      ),
    );

    const headers = [
      'BIL',
      'NAMA MURID',
      'MYKID',
      'JANTINA',
      ...exportItems.map((item) => `${item.code} ${item.label} /${item.max}`),
      ...UPKK_PCHI_SECTIONS.map((section) => `${section.title} ${section.fullTitle} /${section.total}`),
      `JUMLAH /${UPKK_PCHI_TOTAL}`,
      'STATUS',
    ];

    const headerRow = `<tr>${headers.map((header) => `<th>${escapeExcelCell(header)}</th>`).join('')}</tr>`;
    const bodyRows = studentsInClass
      .map((student, index) => {
        const record = recordByStudent.get(student.mykid);
        const scores = record?.scores ?? {};
        const hasRecord = Boolean(record);
        const row = [
          index + 1,
          student.nama_murid,
          student.mykid,
          genderLabel(student.jantina),
          ...exportItems.map((item) => (hasRecord ? formatNumber(Number(scores[item.code] ?? 0)) : '')),
          ...UPKK_PCHI_SECTIONS.map((section) => (hasRecord ? formatNumber(sectionScore(section, scores)) : '')),
          hasRecord ? formatNumber(calculateUpkkPchiTotal(scores)) : '',
          record?.status ?? 'BELUM DINILAI',
        ];
        return `<tr>${row.map((value) => `<td>${escapeExcelCell(value)}</td>`).join('')}</tr>`;
      })
      .join('');

    const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table>${headerRow}${bodyRows}</table></body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `UPKK-PCHI-${sanitizeFilePart(selectedSchool)}-${sanitizeFilePart(selectedClass.nama_kelas)}-${selectedYear}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (!selectableSchools.length) {
    return (
      <section className="panel">
        <h2>UPKK - PCHI</h2>
        <p className="muted">Tiada sekolah yang boleh diakses oleh akaun ini.</p>
      </section>
    );
  }

  return (
    <section className="upkk-panel">
      <div className="section-header-row">
        <div>
          <h2>UPKK - PCHI</h2>
          <p className="muted">Penghayatan Cara Hidup Islam untuk murid Tahun 5 sahaja.</p>
        </div>
        <span>{studentsInClass.length} murid</span>
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
          Tahun
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
          <select value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)}>
            {yearFiveClasses.map((classRecord) => (
              <option key={classRecord.id} value={classRecord.id}>
                Tahun {classRecord.tahun} - {classRecord.nama_kelas}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!hasModuleAccess ? (
        <p className="error-text">Sekolah ini belum diberi akses Modul Penilaian UPKK.</p>
      ) : null}

      {hasModuleAccess && yearFiveClasses.length === 0 ? (
        <p className="muted">Tiada kelas Tahun 5 untuk pilihan sekolah dan tahun ini.</p>
      ) : null}

      {hasModuleAccess && selectedClass ? (
        <>
          <div className="upkk-summary-grid">
            <div className="upkk-summary-card">
              <span>Jumlah Murid</span>
              <strong>{studentsInClass.length}</strong>
            </div>
            <div className="upkk-summary-card">
              <span>Telah Dinilai</span>
              <strong>{completedCount}</strong>
            </div>
            <div className="upkk-summary-card">
              <span>Purata Kelas</span>
              <strong>{formatNumber(classAverage)}</strong>
            </div>
            <div className="upkk-summary-card">
              <span>Markah Penuh</span>
              <strong>{UPKK_PCHI_TOTAL}</strong>
            </div>
          </div>

          <div className="upkk-layout">
            <div className="upkk-student-list">
              <div className="upkk-card-head">
                <div>
                  <h3>Senarai Murid Tahun 5</h3>
                  <p className="muted">{selectedSchoolRecord?.nama_sekolah ?? selectedSchool}</p>
                </div>
                <button className="upkk-export-button" type="button" onClick={handleDownloadExcel}>
                  Muat Turun Excel
                </button>
              </div>
              <table className="upkk-student-table">
                <thead>
                  <tr>
                    <th>BIL</th>
                    <th>NAMA MURID</th>
                    <th>JUMLAH</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsInClass.map((student, index) => {
                    const total = Number(recordByStudent.get(student.mykid)?.jumlah ?? 0);
                    return (
                      <tr key={student.mykid} className={student.mykid === selectedStudentId ? 'upkk-selected-row' : undefined}>
                        <td>{index + 1}</td>
                        <td>
                          <button className="upkk-student-button" type="button" onClick={() => setSelectedStudentId(student.mykid)}>
                            {student.nama_murid}
                          </button>
                          <small>{genderLabel(student.jantina)}</small>
                        </td>
                        <td>{formatNumber(total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <form action={formAction} className="upkk-form-card">
              <input type="hidden" name="kod_sekolah" value={selectedSchool} />
              <input type="hidden" name="tahun_akademik" value={selectedYear} />
              <input type="hidden" name="class_id" value={selectedClass.id} />
              <input type="hidden" name="student_id" value={selectedStudent?.mykid ?? ''} />

              <div className="upkk-form-head">
                <div>
                  <span>
                    {selectedSchool} - {selectedSchoolRecord?.nama_sekolah ?? ''}
                  </span>
                  <h3>Borang PCHI</h3>
                  <strong>{selectedStudent?.nama_murid ?? 'Pilih murid'}</strong>
                  <p className="muted">
                    {selectedClass.nama_kelas} / {selectedYear}
                  </p>
                </div>
                <strong className="upkk-total">
                  {formatNumber(selectedTotal)} / {UPKK_PCHI_TOTAL}
                </strong>
              </div>

              {UPKK_PCHI_SECTIONS.map((section) => (
                <div className="upkk-section-card" key={section.code}>
                  <div className="upkk-section-head">
                    <div>
                      <span>{section.title}</span>
                      <strong>{section.fullTitle}</strong>
                    </div>
                    <strong>
                      {formatNumber(sectionScore(section, selectedScores))} / {section.total}
                    </strong>
                  </div>

                  {section.groups.map((group) => (
                    <table className="upkk-group-table" key={group.code}>
                      <tbody>
                        {group.items.map((item, itemIndex) => (
                          <tr key={item.code}>
                            {itemIndex === 0 ? (
                              <>
                                <td className="upkk-group-code-cell" rowSpan={group.items.length}>
                                  {group.code}
                                </td>
                                <td className="upkk-group-title-cell" rowSpan={group.items.length}>
                                  {group.title}
                                </td>
                              </>
                            ) : null}
                            <td className="upkk-item-code-cell">{item.code}</td>
                            <td className="upkk-item-label-cell">{item.label}</td>
                            <td className="upkk-score-cell">
                              <input
                                className="upkk-score-input"
                                type="number"
                                name={`score_${item.code}`}
                                min="0"
                                max={item.max}
                                step="0.5"
                                defaultValue={selectedScores[item.code] ?? ''}
                                placeholder={`/${item.max}`}
                                disabled={!selectedStudent || isPending}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ))}
                </div>
              ))}

              <button className="upkk-submit-button" type="submit" disabled={!selectedStudent || isPending}>
                {isPending ? 'Menyimpan...' : 'Simpan Markah PCHI'}
              </button>
              {actionState.message ? (
                <p className={actionState.ok ? 'upkk-message-ok' : 'upkk-message-error'}>{actionState.message}</p>
              ) : null}
            </form>
          </div>
        </>
      ) : null}
    </section>
  );
}
