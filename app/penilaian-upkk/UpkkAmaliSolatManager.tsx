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

function toFiniteNumber(value: unknown) {
  const numericValue =
    typeof value === 'string' ? Number(value.trim().replace(',', '.')) : Number(value ?? 0);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatNumber(value: unknown) {
  const numericValue = toFiniteNumber(value);
  return Number.isInteger(numericValue) ? String(numericValue) : numericValue.toFixed(1).replace(/\.0$/, '');
}

function genderLabel(value: string | null) {
  const normalized = (value ?? '').trim().toUpperCase();
  if (normalized === 'L' || normalized === 'LELAKI') return 'Lelaki';
  if (normalized === 'P' || normalized === 'PEREMPUAN') return 'Perempuan';
  return value || '-';
}

function scoreValue(scores: Record<string, unknown> | null | undefined, code: string) {
  return toFiniteNumber(scores?.[code]);
}

function sectionScore(section: UpkkAmaliSection, scores: Record<string, unknown> | null | undefined) {
  return section.groups.reduce(
    (sectionTotal, group) =>
      sectionTotal +
      group.items.reduce((groupTotal, item) => groupTotal + scoreValue(scores, item.code), 0),
    0,
  );
}

function blankScoreDraft() {
  const draft: Record<string, string> = {};
  UPKK_AMALI_SOLAT_SECTIONS.forEach((section) => {
    section.groups.forEach((group) => {
      group.items.forEach((item) => {
        draft[item.code] = '';
      });
    });
  });
  return draft;
}

function scoreDraftFromRecord(scores: Record<string, unknown> | null | undefined) {
  const draft = blankScoreDraft();
  Object.keys(draft).forEach((code) => {
    if (scores?.[code] !== undefined) {
      draft[code] = formatNumber(scores[code]);
    }
  });
  return draft;
}

function scoresFromDraft(draft: Record<string, string>) {
  const scores: Record<string, number> = {};
  UPKK_AMALI_SOLAT_SECTIONS.forEach((section) => {
    section.groups.forEach((group) => {
      group.items.forEach((item) => {
        scores[item.code] = toFiniteNumber(draft[item.code]);
      });
    });
  });
  return scores;
}

function clampScoreInput(value: string, max: number) {
  if (value.trim() === '') return '';

  const numericValue = Number(value.replace(',', '.'));
  if (!Number.isFinite(numericValue)) return '';

  return formatNumber(Math.min(max, Math.max(0, numericValue)));
}

function safeScoreValue(value: string | undefined, max: number) {
  return formatNumber(Math.min(max, Math.max(0, toFiniteNumber(value))));
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
  const [scoreDraft, setScoreDraft] = useState<Record<string, string>>(() => blankScoreDraft());
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
  useEffect(() => {
    setScoreDraft(scoreDraftFromRecord(selectedRecord?.scores));
  }, [selectedRecord, selectedStudentId]);

  const selectedScores = useMemo(() => scoresFromDraft(scoreDraft), [scoreDraft]);
  const selectedTotal = calculateUpkkAmaliTotal(selectedScores);
  const completedCount = studentsInClass.filter((student) => toFiniteNumber(recordByStudent.get(student.mykid)?.jumlah) > 0).length;
  const classAverage = completedCount
    ? recordsForClass.reduce((total, record) => total + toFiniteNumber(record.jumlah), 0) / completedCount
    : 0;

  function handleDownloadExcel() {
    if (!selectedSchoolRecord || !selectedClass || studentsInClass.length === 0) return;

    const exportItems = UPKK_AMALI_SOLAT_SECTIONS.flatMap((section) =>
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
      ...UPKK_AMALI_SOLAT_SECTIONS.map((section) => `${section.title} ${section.fullTitle} /${section.total}`),
      `JUMLAH /${UPKK_AMALI_SOLAT_TOTAL}`,
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
          ...exportItems.map((item) => (hasRecord ? formatNumber(scoreValue(scores, item.code)) : '')),
          ...UPKK_AMALI_SOLAT_SECTIONS.map((section) => (hasRecord ? formatNumber(sectionScore(section, scores)) : '')),
          hasRecord ? formatNumber(calculateUpkkAmaliTotal(scores)) : '',
          toFiniteNumber(record?.jumlah) > 0 ? 'Dinilai' : 'Belum dinilai',
        ];

        return `<tr>${row
          .map((cell, cellIndex) => `<td${cellIndex === 2 ? ' class="text-cell"' : ''}>${escapeExcelCell(cell)}</td>`)
          .join('')}</tr>`;
      })
      .join('');

    const title = `UPKK - Amali Solat ${selectedYear}`;
    const metaRows = [
      ['Sekolah', `${selectedSchoolRecord.kod_sekolah} - ${selectedSchoolRecord.nama_sekolah}`],
      ['Kelas', selectedClass.nama_kelas],
      ['Tahun Akademik', selectedYear],
      ['Jumlah Murid', studentsInClass.length],
      ['Murid Telah Dinilai', completedCount],
      ['Purata Kelas', `${formatNumber(classAverage)} / ${UPKK_AMALI_SOLAT_TOTAL}`],
    ]
      .map(
        ([label, value]) =>
          `<tr><td class="meta-label">${escapeExcelCell(label)}</td><td colspan="${headers.length - 1}">${escapeExcelCell(value)}</td></tr>`,
      )
      .join('');

    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; }
            th, td { border: 1px solid #9ca3af; padding: 4px 6px; font-size: 11px; vertical-align: top; }
            th { background: #e6f3ea; font-weight: 700; }
            .title-cell { border: 0; font-size: 16px; font-weight: 700; padding: 8px 0; }
            .meta-label { background: #f5faf6; font-weight: 700; }
            .text-cell { mso-number-format: "\\@"; }
          </style>
        </head>
        <body>
          <table>
            <tr><td class="title-cell" colspan="${headers.length}">${escapeExcelCell(title)}</td></tr>
            ${metaRows}
            <tr><td colspan="${headers.length}"></td></tr>
            ${headerRow}
            ${bodyRows}
          </table>
        </body>
      </html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `UPKK-Amali-Solat-${sanitizeFilePart(selectedSchoolRecord.kod_sekolah)}-${sanitizeFilePart(
      selectedClass.nama_kelas,
    )}-${selectedYear}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

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
                <div className="upkk-card-actions">
                  <span>{studentsInClass.length} murid</span>
                  <button
                    type="button"
                    className="button secondary upkk-export-button"
                    onClick={handleDownloadExcel}
                    disabled={studentsInClass.length === 0}
                  >
                    Muat Turun Excel
                  </button>
                </div>
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
                        const total = toFiniteNumber(record?.jumlah);
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
              action={formAction}
              className="upkk-form-card"
              noValidate
            >
              <input type="hidden" name="kod_sekolah" value={selectedSchool} />
              <input type="hidden" name="tahun_akademik" value={selectedYear} />
              <input type="hidden" name="class_id" value={selectedClassId} />
              <input type="hidden" name="student_id" value={selectedStudentId} />
              {UPKK_AMALI_SOLAT_SECTIONS.flatMap((section) =>
                section.groups.flatMap((group) =>
                  group.items.map((item) => (
                    <input
                      key={item.code}
                      type="hidden"
                      name={`score_${item.code}`}
                      value={safeScoreValue(scoreDraft[item.code], item.max)}
                    />
                  )),
                ),
              )}

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
                          <table className="upkk-group-table">
                            <tbody>
                              {group.items.map((item, index) => (
                                <tr key={item.code}>
                                  {index === 0 && (
                                    <>
                                      <td className="upkk-group-code-cell" rowSpan={group.items.length}>
                                        {group.code}
                                      </td>
                                      <td className="upkk-group-title-cell" rowSpan={group.items.length}>
                                        {group.title}
                                      </td>
                                    </>
                                  )}
                                  <td className="upkk-item-code-cell">{item.code}</td>
                                  <td className="upkk-item-label-cell">{item.label}</td>
                                  <td className="upkk-score-cell">
                                    <input
                                      className="upkk-score-input"
                                      type="number"
                                      min="0"
                                      max={item.max}
                                      step="0.5"
                                      value={scoreDraft[item.code] ?? ''}
                                      onChange={(event) =>
                                        setScoreDraft((currentDraft) => ({
                                          ...currentDraft,
                                          [item.code]: clampScoreInput(event.target.value, item.max),
                                        }))
                                      }
                                      placeholder={`/${item.max}`}
                                      aria-label={`${item.code} ${item.label}`}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
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
