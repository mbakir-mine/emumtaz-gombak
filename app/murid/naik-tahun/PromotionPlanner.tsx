'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import type { ClassRecord, School, StudentEnrollmentDetail, StudentRecord } from '@/lib/data';
import { promoteStudents } from './actions';

type PromotionRow = {
  student: StudentRecord;
  school?: School;
  sourceClass?: ClassRecord;
  targetClassId?: string;
  status: 'NAIK_TAHUN' | 'PERLU_SEMAKAN' | 'TAMAT';
};

type TargetOption = {
  value: string;
  tahun: number;
  nama_kelas: string;
  exists: boolean;
};

const initialState = {
  ok: false,
  message: '',
};

function classStem(name: string) {
  return name.replace(/^\s*\d+\s*/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
}

function nextClassName(sourceClass: ClassRecord) {
  return `${sourceClass.tahun + 1} ${classStem(sourceClass.nama_kelas)}`;
}

function newClassValue(sourceClass: ClassRecord, className = nextClassName(sourceClass)) {
  return ['NEW', sourceClass.kod_sekolah, sourceClass.tahun + 1, targetSafeName(className)].join('__');
}

function targetSafeName(name: string) {
  return name.replaceAll('__', ' ').replace(/\s+/g, ' ').trim().toUpperCase();
}

function targetOptionsForClass(sourceClass: ClassRecord | undefined, targetClasses: ClassRecord[]): TargetOption[] {
  if (!sourceClass || sourceClass.tahun >= 6) return [];
  const targetTahun = sourceClass.tahun + 1;
  const existing = targetClasses
    .filter((item) => item.kod_sekolah === sourceClass.kod_sekolah && item.tahun === targetTahun)
    .sort((a, b) => a.nama_kelas.localeCompare(b.nama_kelas));
  const existingOptions = existing.map((item) => ({
    value: item.id,
    tahun: item.tahun,
    nama_kelas: item.nama_kelas,
    exists: true,
  }));
  const suggestedName = nextClassName(sourceClass);
  const hasSuggested = existingOptions.some((item) => classStem(item.nama_kelas) === classStem(suggestedName));

  return hasSuggested
    ? existingOptions
    : [
        {
          value: newClassValue(sourceClass, suggestedName),
          tahun: targetTahun,
          nama_kelas: suggestedName,
          exists: false,
        },
        ...existingOptions,
      ];
}

function defaultTargetValue(sourceClass: ClassRecord | undefined, targetClasses: ClassRecord[]) {
  if (!sourceClass || sourceClass.tahun >= 6) return '';
  const options = targetOptionsForClass(sourceClass, targetClasses);
  const sourceStem = classStem(sourceClass.nama_kelas);
  return options.find((item) => classStem(item.nama_kelas) === sourceStem)?.value ?? options[0]?.value ?? '';
}

function targetLabelFromValue(value: string, sourceClass: ClassRecord | undefined, targetClasses: ClassRecord[]) {
  if (!sourceClass || sourceClass.tahun >= 6) return 'Tamat persekolahan';
  const option = targetOptionsForClass(sourceClass, targetClasses).find((item) => item.value === value);
  if (!option) return 'Belum dipadankan';
  return `Tahun ${option.tahun} - ${option.nama_kelas}${option.exists ? '' : ' (akan dicipta)'}`;
}

function availableYears(classes: ClassRecord[], enrollments: StudentEnrollmentDetail[]) {
  const years = new Set<number>();
  classes.forEach((item) => years.add(item.tahun_akademik));
  enrollments.forEach((item) => years.add(item.tahun_akademik));
  return [...years].sort((a, b) => b - a);
}

export default function PromotionPlanner({
  schools,
  classes,
  students,
  enrollments,
}: {
  schools: School[];
  classes: ClassRecord[];
  students: StudentRecord[];
  enrollments: StudentEnrollmentDetail[];
}) {
  const years = availableYears(classes, enrollments);
  const currentYear = new Date().getFullYear();
  const defaultSourceYear = years.includes(currentYear) ? currentYear : years[0] ?? currentYear;
  const [sourceYear, setSourceYear] = useState(defaultSourceYear);
  const [targetYear, setTargetYear] = useState(defaultSourceYear + 1);
  const [sourceClassId, setSourceClassId] = useState('');
  const [bulkTargetClassId, setBulkTargetClassId] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetClassByStudent, setTargetClassByStudent] = useState<Record<string, string>>({});
  const [state, action, pending] = useActionState(promoteStudents, initialState);

  const classById = useMemo(() => new Map(classes.map((item) => [item.id, item])), [classes]);
  const schoolByCode = useMemo(() => new Map(schools.map((item) => [item.kod_sekolah, item])), [schools]);

  const allSourceRows = useMemo<PromotionRow[]>(() => {
    const enrollmentRows = enrollments.filter(
      (item) => item.tahun_akademik === sourceYear && item.status === 'AKTIF',
    );
    const targetClasses = classes.filter((item) => item.tahun_akademik === targetYear && item.status === 'AKTIF');

    if (enrollmentRows.length > 0) {
      return enrollmentRows.map((item) => {
        const sourceClass = item.class_id ? classById.get(item.class_id) : undefined;
        const student: StudentRecord = {
          id: item.student_id,
          mykid: item.mykid,
          nama_murid: item.nama_murid,
          jantina: item.jantina,
          kod_sekolah: item.kod_sekolah,
          class_id: item.class_id,
          status: item.status,
        };
        const targetClassId = defaultTargetValue(sourceClass, targetClasses);
        return {
          student,
          school: schoolByCode.get(item.kod_sekolah),
          sourceClass,
          targetClassId,
          status: sourceClass?.tahun === 6 ? 'TAMAT' : targetClassId ? 'NAIK_TAHUN' : 'PERLU_SEMAKAN',
        };
      });
    }

    return students
      .map((student) => {
        const sourceClass = student.class_id ? classById.get(student.class_id) : undefined;
        return { student, sourceClass };
      })
      .filter(({ sourceClass, student }) => sourceClass?.tahun_akademik === sourceYear && student.status === 'AKTIF')
      .map(({ student, sourceClass }) => {
        const targetClassId = defaultTargetValue(sourceClass, targetClasses);
        return {
          student,
          school: schoolByCode.get(student.kod_sekolah),
          sourceClass,
          targetClassId,
          status: sourceClass?.tahun === 6 ? 'TAMAT' : targetClassId ? 'NAIK_TAHUN' : 'PERLU_SEMAKAN',
        };
      });
  }, [classById, classes, enrollments, schoolByCode, sourceYear, students, targetYear]);

  const sourceClasses = useMemo(
    () =>
      classes
        .filter((item) => item.tahun_akademik === sourceYear && item.status === 'AKTIF')
        .sort((a, b) => a.kod_sekolah.localeCompare(b.kod_sekolah) || a.tahun - b.tahun || a.nama_kelas.localeCompare(b.nama_kelas)),
    [classes, sourceYear],
  );

  const selectedSourceClass = sourceClassId ? classById.get(sourceClassId) : undefined;

  const sourceRows = useMemo(
    () => (sourceClassId ? allSourceRows.filter((item) => item.sourceClass?.id === sourceClassId) : []),
    [allSourceRows, sourceClassId],
  );

  const summary = useMemo(
    () => ({
      total: sourceRows.length,
      promoted: sourceRows.filter((item) => item.status !== 'TAMAT' && targetClassByStudent[item.student.id]).length,
      review: sourceRows.filter((item) => item.status !== 'TAMAT' && !targetClassByStudent[item.student.id]).length,
      graduate: sourceRows.filter((item) => item.status === 'TAMAT').length,
    }),
    [sourceRows, targetClassByStudent],
  );

  const targetClasses = useMemo(
    () => classes.filter((item) => item.tahun_akademik === targetYear && item.status === 'AKTIF'),
    [classes, targetYear],
  );

  const bulkTargetOptions = useMemo(() => {
    return targetOptionsForClass(selectedSourceClass, targetClasses);
  }, [selectedSourceClass, targetClasses]);

  useEffect(() => {
    setSourceClassId(sourceClasses[0]?.id ?? '');
  }, [sourceClasses]);

  useEffect(() => {
    const defaultTargetClass = defaultTargetValue(selectedSourceClass, targetClasses) || bulkTargetOptions[0]?.value || '';
    setBulkTargetClassId(defaultTargetClass);
    setSelectedIds(new Set());
    setTargetClassByStudent(
      Object.fromEntries(sourceRows.map((item) => [item.student.id, item.targetClassId ?? defaultTargetClass])),
    );
  }, [bulkTargetOptions, selectedSourceClass, sourceRows, targetClasses]);

  const selectedCount = selectedIds.size;
  const allSelected = sourceRows.length > 0 && selectedIds.size === sourceRows.length;

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(sourceRows.map((item) => item.student.id)) : new Set());
  }

  function toggleStudent(studentId: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(studentId);
      else next.delete(studentId);
      return next;
    });
  }

  function updateBulkTarget(classId: string) {
    setBulkTargetClassId(classId);
    setTargetClassByStudent((current) => ({
      ...current,
      ...Object.fromEntries(sourceRows.map((item) => [item.student.id, classId])),
    }));
  }

  return (
    <form action={action} className="promotion-layout">
      <input type="hidden" name="source_year" value={sourceYear} />
      <input type="hidden" name="target_year" value={targetYear} />
      {[...selectedIds].map((studentId) => (
        <input key={studentId} type="hidden" name="selected_student_ids" value={studentId} />
      ))}
      {Object.entries(targetClassByStudent).map(([studentId, classId]) => (
        <input key={studentId} type="hidden" name={`target_class_id__${studentId}`} value={classId} />
      ))}

      <section className="panel promotion-hero">
        <div className="panel-head">
          <div>
            <h2>Pengurusan Kenaikan Tahun Murid</h2>
            <p className="table-note">
              Semak padanan kelas dahulu. Rekod yang tiada kelas cadangan tidak akan diproses secara automatik.
            </p>
          </div>
          <span>{summary.total} calon</span>
        </div>

        <div className="promotion-toolbar">
          <label>
            Tahun asal
            <select value={sourceYear} onChange={(event) => setSourceYear(Number(event.target.value))}>
              {years.length === 0 ? <option value={sourceYear}>{sourceYear}</option> : null}
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tahun baharu
            <input
              type="number"
              min={sourceYear + 1}
              value={targetYear}
              onChange={(event) => setTargetYear(Number(event.target.value))}
            />
          </label>

          <label>
            Kelas semasa
            <select value={sourceClassId} onChange={(event) => setSourceClassId(event.target.value)}>
              {sourceClasses.length === 0 ? <option value="">Tiada kelas</option> : null}
              {sourceClasses.map((item) => {
                const school = schoolByCode.get(item.kod_sekolah);
                return (
                  <option key={item.id} value={item.id}>
                    {item.kod_sekolah} - Tahun {item.tahun} {item.nama_kelas}
                    {school ? ` (${school.nama_sekolah})` : ''}
                  </option>
                );
              })}
            </select>
          </label>

          <label>
            Kelas tahun baharu
            <select
              value={bulkTargetClassId}
              onChange={(event) => updateBulkTarget(event.target.value)}
              disabled={bulkTargetOptions.length === 0}
            >
              {selectedSourceClass?.tahun === 6 ? <option value="">Tamat Tahun 6</option> : null}
              {selectedSourceClass?.tahun !== 6 && bulkTargetOptions.length === 0 ? (
                <option value="">Tiada kelas padanan</option>
              ) : null}
              {bulkTargetOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  Tahun {item.tahun} - {item.nama_kelas}
                  {item.exists ? '' : ' (cipta baharu)'}
                </option>
              ))}
            </select>
          </label>

          <div className="promotion-action-form">
            <button className="button" type="submit" disabled={pending || selectedCount === 0}>
              {pending ? 'Memproses...' : 'Sahkan Naik Tahun'}
            </button>
          </div>
        </div>

        {state.message ? <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p> : null}
      </section>

      <section className="promotion-summary-grid">
        <div className="promotion-card">
          <span>Jumlah calon</span>
          <strong>{summary.total}</strong>
          <small>{selectedSourceClass ? `Tahun ${selectedSourceClass.tahun} ${selectedSourceClass.nama_kelas}` : `Tahun ${sourceYear}`}</small>
        </div>
        <div className="promotion-card promotion-card-ready">
          <span>Dipilih</span>
          <strong>{selectedCount}</strong>
          <small>Murid yang akan diproses</small>
        </div>
        <div className="promotion-card promotion-card-review">
          <span>Perlu semakan</span>
          <strong>{summary.review}</strong>
          <small>Tiada kelas cadangan ditemui</small>
        </div>
        <div className="promotion-card promotion-card-finish">
          <span>Tamat Tahun 6</span>
          <strong>{summary.graduate}</strong>
          <small>Ditanda tamat pada tahun baharu</small>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Senarai Semakan Kenaikan Tahun {sourceYear} ke {targetYear}</h2>
          <span>{sourceRows.length} rekod</span>
        </div>

        {sourceRows.length === 0 ? (
          <p className="empty">Tiada murid aktif untuk tahun asal yang dipilih.</p>
        ) : (
          <div className="table-scroll">
            <table className="compact-table">
              <thead>
                <tr>
                  <th>BIL</th>
                  <th>Nama Murid</th>
                  <th>Sekolah</th>
                  <th>Kelas Semasa</th>
                  <th>Kelas Cadangan</th>
                  <th>Status</th>
                  <th>
                    <label className="promotion-table-check">
                      <span>Pindah Semua</span>
                      <input type="checkbox" checked={allSelected} onChange={(event) => toggleAll(event.target.checked)} />
                    </label>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sourceRows.map((item, index) => {
                  const hasSelectedTarget = Boolean(targetClassByStudent[item.student.id]);
                  const isSelected = selectedIds.has(item.student.id);
                  const displayStatus =
                    item.status === 'TAMAT' ? 'TAMAT' : hasSelectedTarget ? 'NAIK_TAHUN' : 'PERLU_SEMAKAN';

                  return (
                    <tr key={item.student.id}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{item.student.nama_murid}</strong>
                        <small>{item.student.mykid}</small>
                      </td>
                      <td>
                        <strong>{item.student.kod_sekolah}</strong>
                        <small>{item.school?.nama_sekolah ?? '-'}</small>
                      </td>
                      <td>
                        {item.sourceClass ? (
                          <>
                            Tahun {item.sourceClass.tahun}
                            <small>{item.sourceClass.nama_kelas}</small>
                          </>
                        ) : (
                          'Tiada kelas'
                        )}
                      </td>
                      <td>
                        <span className="promotion-target-label">
                          {targetLabelFromValue(targetClassByStudent[item.student.id] ?? '', item.sourceClass, targetClasses)}
                        </span>
                      </td>
                      <td>
                        <span className={`promotion-status status-${displayStatus.toLowerCase().replace('_', '-')}`}>
                          {displayStatus === 'NAIK_TAHUN'
                            ? 'Sedia'
                            : displayStatus === 'TAMAT'
                              ? 'Tamat'
                              : 'Perlu Semakan'}
                        </span>
                      </td>
                      <td>
                        <input
                          aria-label={`Pindah ${item.student.nama_murid}`}
                          checked={isSelected}
                          className="promotion-row-check"
                          type="checkbox"
                          onChange={(event) => toggleStudent(item.student.id, event.target.checked)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </form>
  );
}
