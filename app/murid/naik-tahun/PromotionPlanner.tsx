'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import type { ClassRecord, School, StudentEnrollmentDetail, StudentRecord } from '@/lib/data';
import { useAccessProfile } from '../../ui/AuthGate';
import { scopeClasses, scopeSchools, scopeStudents } from '../../ui/scopedData';
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

function targetOptionsForClass(
  sourceClass: ClassRecord | undefined,
  targetClasses: ClassRecord[],
  sourceClasses: ClassRecord[],
): TargetOption[] {
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
  const existingStems = new Set(existingOptions.map((item) => classStem(item.nama_kelas)));
  const generatedOptions = sourceClasses
    .filter((item) => item.kod_sekolah === sourceClass.kod_sekolah && item.tahun === sourceClass.tahun)
    .map((item) => {
      const namaKelas = nextClassName(item);
      return {
        value: newClassValue(item, namaKelas),
        tahun: targetTahun,
        nama_kelas: namaKelas,
        exists: false,
      };
    })
    .filter((item) => !existingStems.has(classStem(item.nama_kelas)))
    .sort((a, b) => a.nama_kelas.localeCompare(b.nama_kelas));

  return [...existingOptions, ...generatedOptions].sort(
    (a, b) => a.tahun - b.tahun || a.nama_kelas.localeCompare(b.nama_kelas),
  );
}

function defaultTargetValue(
  sourceClass: ClassRecord | undefined,
  targetClasses: ClassRecord[],
  sourceClasses: ClassRecord[],
) {
  if (!sourceClass || sourceClass.tahun >= 6) return '';
  const options = targetOptionsForClass(sourceClass, targetClasses, sourceClasses);
  const sourceStem = classStem(sourceClass.nama_kelas);
  return options.find((item) => classStem(item.nama_kelas) === sourceStem)?.value ?? options[0]?.value ?? '';
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
  const profile = useAccessProfile();
  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const scopedStudents = useMemo(
    () => scopeStudents(profile, students, classes, schools),
    [classes, profile, schools, students],
  );
  const allowedSchoolCodes = useMemo(
    () => new Set(scopedSchools.map((school) => school.kod_sekolah)),
    [scopedSchools],
  );
  const scopedEnrollments = useMemo(
    () => enrollments.filter((item) => allowedSchoolCodes.has(item.kod_sekolah)),
    [allowedSchoolCodes, enrollments],
  );
  const years = availableYears(scopedClasses, scopedEnrollments);
  const currentYear = new Date().getFullYear();
  const defaultSourceYear = years.includes(currentYear) ? currentYear : years[0] ?? currentYear;
  const [sourceYear, setSourceYear] = useState(defaultSourceYear);
  const [targetYear, setTargetYear] = useState(defaultSourceYear + 1);
  const [sourceClassId, setSourceClassId] = useState('');
  const [bulkTargetClassId, setBulkTargetClassId] = useState('');
  const [targetClassByStudent, setTargetClassByStudent] = useState<Record<string, string>>({});
  const [state, action, pending] = useActionState(promoteStudents, initialState);

  const classById = useMemo(() => new Map(scopedClasses.map((item) => [item.id, item])), [scopedClasses]);
  const schoolByCode = useMemo(() => new Map(scopedSchools.map((item) => [item.kod_sekolah, item])), [scopedSchools]);

  const allSourceRows = useMemo<PromotionRow[]>(() => {
    const enrollmentRows = scopedEnrollments.filter(
      (item) => item.tahun_akademik === sourceYear && item.status === 'AKTIF',
    );
    const targetClasses = scopedClasses.filter((item) => item.tahun_akademik === targetYear && item.status === 'AKTIF');

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
        const targetClassId = defaultTargetValue(sourceClass, targetClasses, scopedClasses);
        return {
          student,
          school: schoolByCode.get(item.kod_sekolah),
          sourceClass,
          targetClassId,
          status: sourceClass?.tahun === 6 ? 'TAMAT' : targetClassId ? 'NAIK_TAHUN' : 'PERLU_SEMAKAN',
        };
      });
    }

    return scopedStudents
      .map((student) => {
        const sourceClass = student.class_id ? classById.get(student.class_id) : undefined;
        return { student, sourceClass };
      })
      .filter(({ sourceClass, student }) => sourceClass?.tahun_akademik === sourceYear && student.status === 'AKTIF')
      .map(({ student, sourceClass }) => {
        const targetClassId = defaultTargetValue(sourceClass, targetClasses, scopedClasses);
        return {
          student,
          school: schoolByCode.get(student.kod_sekolah),
          sourceClass,
          targetClassId,
          status: sourceClass?.tahun === 6 ? 'TAMAT' : targetClassId ? 'NAIK_TAHUN' : 'PERLU_SEMAKAN',
        };
      });
  }, [classById, scopedEnrollments, schoolByCode, scopedClasses, scopedStudents, sourceYear, targetYear]);

  const sourceClasses = useMemo(
    () =>
      scopedClasses
        .filter((item) => item.tahun_akademik === sourceYear && item.status === 'AKTIF')
        .sort((a, b) => a.kod_sekolah.localeCompare(b.kod_sekolah) || a.tahun - b.tahun || a.nama_kelas.localeCompare(b.nama_kelas)),
    [scopedClasses, sourceYear],
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
    () => scopedClasses.filter((item) => item.tahun_akademik === targetYear && item.status === 'AKTIF'),
    [scopedClasses, targetYear],
  );

  const bulkTargetOptions = useMemo(() => {
    return targetOptionsForClass(selectedSourceClass, targetClasses, sourceClasses);
  }, [selectedSourceClass, sourceClasses, targetClasses]);

  useEffect(() => {
    setSourceClassId(sourceClasses[0]?.id ?? '');
  }, [sourceClasses]);

  useEffect(() => {
    const defaultTargetClass =
      defaultTargetValue(selectedSourceClass, targetClasses, sourceClasses) || bulkTargetOptions[0]?.value || '';
    setBulkTargetClassId(defaultTargetClass);
    setTargetClassByStudent(
      Object.fromEntries(sourceRows.map((item) => [item.student.id, item.targetClassId ?? defaultTargetClass])),
    );
  }, [bulkTargetOptions, selectedSourceClass, sourceClasses, sourceRows, targetClasses]);

  const selectedCount = sourceRows.length;

  function updateBulkTarget(classId: string) {
    setBulkTargetClassId(classId);
    if (!classId) return;
    setTargetClassByStudent((current) => ({
      ...current,
      ...Object.fromEntries(sourceRows.map((item) => [item.student.id, classId])),
    }));
  }

  return (
    <form action={action} className="promotion-layout">
      <input type="hidden" name="source_year" value={sourceYear} />
      <input type="hidden" name="target_year" value={targetYear} />
      {sourceRows.map((item) => (
        <input key={item.student.id} type="hidden" name="selected_student_ids" value={item.student.id} />
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
                  <th>MyKid</th>
                  <th>Kelas Semasa</th>
                  <th>
                    <select
                      className="promotion-bulk-select"
                      value=""
                      onChange={(event) => updateBulkTarget(event.target.value)}
                    >
                      <option value="">Pindah Semua</option>
                      {bulkTargetOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          Tahun {item.tahun} - {item.nama_kelas}
                        </option>
                      ))}
                    </select>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sourceRows.map((item, index) => {
                  return (
                    <tr key={item.student.id}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{item.student.nama_murid}</strong>
                      </td>
                      <td>
                        <span>{item.student.mykid}</span>
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
                          <span className="promotion-target-label">Tamat persekolahan</span>
                        ) : (
                          <select
                            className="promotion-row-select"
                            value={targetClassByStudent[item.student.id] ?? ''}
                            onChange={(event) =>
                              setTargetClassByStudent((current) => ({
                                ...current,
                                [item.student.id]: event.target.value,
                              }))
                            }
                          >
                            {targetOptionsForClass(item.sourceClass, targetClasses, sourceClasses).map((targetClass) => (
                              <option key={targetClass.value} value={targetClass.value}>
                                Tahun {targetClass.tahun} - {targetClass.nama_kelas}
                              </option>
                            ))}
                          </select>
                        )}
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
