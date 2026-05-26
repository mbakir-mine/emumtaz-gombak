'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import type { ClassRecord, School, StudentEnrollmentDetail, StudentRecord } from '@/lib/data';
import { promoteStudents } from './actions';

type PromotionRow = {
  student: StudentRecord;
  school?: School;
  sourceClass?: ClassRecord;
  targetClass?: ClassRecord;
  status: 'NAIK_TAHUN' | 'PERLU_SEMAKAN' | 'TAMAT';
};

const initialState = {
  ok: false,
  message: '',
};

function classStem(name: string) {
  return name.replace(/^\s*\d+\s*/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
}

function findTargetClass(sourceClass: ClassRecord | undefined, targetClasses: ClassRecord[]) {
  if (!sourceClass || sourceClass.tahun >= 6) return undefined;

  const candidates = targetClasses.filter(
    (item) => item.kod_sekolah === sourceClass.kod_sekolah && item.tahun === sourceClass.tahun + 1,
  );
  const sourceStem = classStem(sourceClass.nama_kelas);
  return candidates.find((item) => classStem(item.nama_kelas) === sourceStem) ?? candidates[0];
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetClassByStudent, setTargetClassByStudent] = useState<Record<string, string>>({});
  const [state, action, pending] = useActionState(promoteStudents, initialState);

  const classById = useMemo(() => new Map(classes.map((item) => [item.id, item])), [classes]);
  const schoolByCode = useMemo(() => new Map(schools.map((item) => [item.kod_sekolah, item])), [schools]);

  const sourceRows = useMemo<PromotionRow[]>(() => {
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
        const targetClass = findTargetClass(sourceClass, targetClasses);
        return {
          student,
          school: schoolByCode.get(item.kod_sekolah),
          sourceClass,
          targetClass,
          status: sourceClass?.tahun === 6 ? 'TAMAT' : targetClass ? 'NAIK_TAHUN' : 'PERLU_SEMAKAN',
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
        const targetClass = findTargetClass(sourceClass, targetClasses);
        return {
          student,
          school: schoolByCode.get(student.kod_sekolah),
          sourceClass,
          targetClass,
          status: sourceClass?.tahun === 6 ? 'TAMAT' : targetClass ? 'NAIK_TAHUN' : 'PERLU_SEMAKAN',
        };
      });
  }, [classById, classes, enrollments, schoolByCode, sourceYear, students, targetYear]);

  const summary = useMemo(
    () => ({
      total: sourceRows.length,
      promoted: sourceRows.filter((item) => item.status === 'NAIK_TAHUN').length,
      review: sourceRows.filter((item) => item.status === 'PERLU_SEMAKAN').length,
      graduate: sourceRows.filter((item) => item.status === 'TAMAT').length,
    }),
    [sourceRows],
  );

  const targetClasses = useMemo(
    () => classes.filter((item) => item.tahun_akademik === targetYear && item.status === 'AKTIF'),
    [classes, targetYear],
  );

  useEffect(() => {
    setSelectedIds(new Set(sourceRows.filter((item) => item.status !== 'PERLU_SEMAKAN').map((item) => item.student.id)));
    setTargetClassByStudent(
      Object.fromEntries(sourceRows.filter((item) => item.targetClass).map((item) => [item.student.id, item.targetClass!.id])),
    );
  }, [sourceRows]);

  const selectedCount = selectedIds.size;
  const allSelected = sourceRows.length > 0 && selectedIds.size === sourceRows.length;

  function targetOptionsFor(row: PromotionRow) {
    if (!row.sourceClass || row.sourceClass.tahun >= 6) return [];
    return targetClasses.filter(
      (item) => item.kod_sekolah === row.sourceClass?.kod_sekolah && item.tahun === row.sourceClass.tahun + 1,
    );
  }

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

          <div className="promotion-check-all">
            <label>
              <input type="checkbox" checked={allSelected} onChange={(event) => toggleAll(event.target.checked)} />
              Pilih Semua
            </label>
            <small>{selectedCount} dipilih</small>
          </div>

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
          <small>Murid aktif tahun {sourceYear}</small>
        </div>
        <div className="promotion-card promotion-card-ready">
          <span>Boleh dinaikkan</span>
          <strong>{summary.promoted}</strong>
          <small>Kelas baharu telah dipadankan</small>
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
                  <th>Pilih</th>
                  <th>Nama Murid</th>
                  <th>Sekolah</th>
                  <th>Kelas Semasa</th>
                  <th>Kelas Cadangan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sourceRows.map((item, index) => {
                  const hasSelectedTarget = Boolean(targetClassByStudent[item.student.id]);
                  const displayStatus =
                    item.status === 'TAMAT' ? 'TAMAT' : hasSelectedTarget ? 'NAIK_TAHUN' : 'PERLU_SEMAKAN';

                  return (
                    <tr key={item.student.id}>
                      <td>{index + 1}</td>
                      <td>
                        <input
                          aria-label={`Pilih ${item.student.nama_murid}`}
                          checked={selectedIds.has(item.student.id)}
                          className="promotion-row-check"
                          type="checkbox"
                          onChange={(event) => toggleStudent(item.student.id, event.target.checked)}
                        />
                      </td>
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
                        {item.status === 'TAMAT' ? (
                          'Tamat persekolahan'
                        ) : targetOptionsFor(item).length > 0 ? (
                          <select
                            className="promotion-target-select"
                            value={targetClassByStudent[item.student.id] ?? ''}
                            onChange={(event) =>
                              setTargetClassByStudent((current) => ({
                                ...current,
                                [item.student.id]: event.target.value,
                              }))
                            }
                          >
                            {targetOptionsFor(item).map((targetClass) => (
                              <option key={targetClass.id} value={targetClass.id}>
                                Tahun {targetClass.tahun} - {targetClass.nama_kelas}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>Belum dipadankan</span>
                        )}
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
