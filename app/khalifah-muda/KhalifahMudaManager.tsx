'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import type { ClassRecord, KhalifahMudaRecord, School, SchoolModuleAccess, StudentRecord } from '@/lib/data';
import {
  KHALIFAH_MUDA_MODULE_KEY,
  KHALIFAH_MUDA_YEAR,
  khalifahMudaClassActivities,
  khalifahMudaGuidanceIndicators,
  khalifahMudaPositiveIndicators,
} from '@/lib/khalifahMuda';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeSchools } from '../ui/scopedData';
import {
  createKhalifahMudaClassRecord,
  createKhalifahMudaStudentRecord,
  type KhalifahMudaActionState,
} from './actions';

const initialActionState: KhalifahMudaActionState = {
  ok: false,
  message: '',
};

function isActive(status: string | null | undefined) {
  return (status ?? '').toUpperCase() === 'AKTIF';
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('ms-MY');
}

function classLabel(classRecord: ClassRecord) {
  return classRecord.nama_kelas;
}

function recordKindLabel(kind: KhalifahMudaRecord['record_kind']) {
  if (kind === 'AKTIVITI_KELAS') return 'Aktiviti Kelas';
  if (kind === 'POSITIF') return 'Penghargaan';
  return 'Bimbingan';
}

function recordKindClass(kind: KhalifahMudaRecord['record_kind']) {
  if (kind === 'POSITIF') return 'khalifah-pill khalifah-pill-good';
  if (kind === 'BIMBINGAN') return 'khalifah-pill khalifah-pill-guide';
  return 'khalifah-pill';
}

export default function KhalifahMudaManager({
  schools,
  moduleAccesses,
  classes,
  students,
  records,
}: {
  schools: School[];
  moduleAccesses: SchoolModuleAccess[];
  classes: ClassRecord[];
  students: StudentRecord[];
  records: KhalifahMudaRecord[];
}) {
  const profile = useAccessProfile();
  const currentYear = new Date().getFullYear();
  const enabledSchoolCodes = useMemo(
    () =>
      new Set(
        moduleAccesses
          .filter((access) => access.module_key === KHALIFAH_MUDA_MODULE_KEY && access.enabled)
          .map((access) => access.kod_sekolah),
      ),
    [moduleAccesses],
  );
  const selectableSchools = useMemo(
    () =>
      scopeSchools(profile, schools)
        .filter(
          (school) =>
            isActive(school.status) &&
            (profile?.role === 'OWNER' || enabledSchoolCodes.has(school.kod_sekolah)),
        )
        .sort((a, b) => a.kod_sekolah.localeCompare(b.kod_sekolah)),
    [enabledSchoolCodes, profile, schools],
  );
  const [selectedSchool, setSelectedSchool] = useState(profile?.kod_sekolah ?? selectableSchools[0]?.kod_sekolah ?? '');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const [classState, classAction, classPending] = useActionState(createKhalifahMudaClassRecord, initialActionState);
  const [studentState, studentAction, studentPending] = useActionState(createKhalifahMudaStudentRecord, initialActionState);

  useEffect(() => {
    if (!selectedSchool && selectableSchools[0]) {
      setSelectedSchool(selectableSchools[0].kod_sekolah);
    }
  }, [selectableSchools, selectedSchool]);

  const selectedSchoolRecord = schools.find((school) => school.kod_sekolah === selectedSchool) ?? null;
  const yearSixClasses = useMemo(
    () =>
      classes
        .filter(
          (classRecord) =>
            classRecord.kod_sekolah === selectedSchool &&
            classRecord.tahun_akademik === currentYear &&
            classRecord.tahun === KHALIFAH_MUDA_YEAR &&
            isActive(classRecord.status),
        )
        .sort((a, b) => a.nama_kelas.localeCompare(b.nama_kelas)),
    [classes, currentYear, selectedSchool],
  );

  useEffect(() => {
    if (!yearSixClasses.some((classRecord) => classRecord.id === selectedClassId)) {
      setSelectedClassId(yearSixClasses[0]?.id ?? '');
    }
  }, [selectedClassId, yearSixClasses]);

  const selectedClass = yearSixClasses.find((classRecord) => classRecord.id === selectedClassId) ?? null;
  const classStudents = useMemo(
    () =>
      students
        .filter((student) => student.class_id === selectedClassId && student.kod_sekolah === selectedSchool && isActive(student.status))
        .sort((a, b) => a.nama_murid.localeCompare(b.nama_murid)),
    [selectedClassId, selectedSchool, students],
  );

  useEffect(() => {
    if (!classStudents.some((student) => student.id === selectedStudentId)) {
      setSelectedStudentId(classStudents[0]?.id ?? '');
    }
  }, [classStudents, selectedStudentId]);

  const classRecords = useMemo(
    () => records.filter((record) => record.kod_sekolah === selectedSchool && record.class_id === selectedClassId),
    [records, selectedClassId, selectedSchool],
  );

  const studentSummary = useMemo(() => {
    const summary = new Map<string, { good: number; guide: number; points: number; latest: string | null }>();
    classStudents.forEach((student) => summary.set(student.id, { good: 0, guide: 0, points: 0, latest: null }));
    classRecords.forEach((record) => {
      if (!record.student_id || !summary.has(record.student_id)) return;
      const current = summary.get(record.student_id)!;
      if (record.record_kind === 'POSITIF') current.good += 1;
      if (record.record_kind === 'BIMBINGAN') current.guide += 1;
      current.points += record.points;
      if (!current.latest || record.record_date > current.latest) current.latest = record.record_date;
    });
    return summary;
  }, [classRecords, classStudents]);

  const positiveCount = classRecords.filter((record) => record.record_kind === 'POSITIF').length;
  const guidanceCount = classRecords.filter((record) => record.record_kind === 'BIMBINGAN').length;
  const classActivityCount = classRecords.filter((record) => record.record_kind === 'AKTIVITI_KELAS').length;
  const observedCount = [...studentSummary.values()].filter((item) => item.good > 0 || item.guide > 0).length;
  const recentRecords = classRecords.slice(0, 40);

  if (selectableSchools.length === 0) {
    return (
      <section className="panel optional-module-panel">
        <h2>Modul Khalifah Muda belum diaktifkan</h2>
        <p className="table-note">
          Modul ini hanya boleh digunakan oleh sekolah yang diberi keizinan. Pentadbir Utama mempunyai akses tetap.
        </p>
      </section>
    );
  }

  return (
    <section className="panel optional-module-panel khalifah-panel">
      <div className="panel-head">
        <div>
          <h2>Modul Khalifah Muda</h2>
          <p className="table-note">
            Rekod pemerhatian berasaskan peristiwa untuk murid Tahun {KHALIFAH_MUDA_YEAR}. Guru merekod perkara penting,
            sistem menyusun ringkasan perkembangan.
          </p>
        </div>
        <span>{classStudents.length} murid</span>
      </div>

      <div className="module-form-grid khalifah-filter-grid">
        <label>
          Sekolah
          <select
            value={selectedSchool}
            onChange={(event) => {
              setSelectedSchool(event.target.value);
              setSelectedClassId('');
            }}
            disabled={profile?.role !== 'OWNER'}
          >
            {selectableSchools.map((school) => (
              <option key={school.kod_sekolah} value={school.kod_sekolah}>
                {school.kod_sekolah} - {school.nama_sekolah}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tahun Akademik
          <input value={currentYear} readOnly />
        </label>
        <label>
          Kelas Tahun {KHALIFAH_MUDA_YEAR}
          <select value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)}>
            {yearSixClasses.length === 0 ? (
              <option value="">Tiada kelas Tahun {KHALIFAH_MUDA_YEAR}</option>
            ) : (
              yearSixClasses.map((classRecord) => (
                <option key={classRecord.id} value={classRecord.id}>
                  {classLabel(classRecord)}
                </option>
              ))
            )}
          </select>
        </label>
      </div>

      {yearSixClasses.length === 0 ? (
        <p className="empty">Tiada kelas Tahun {KHALIFAH_MUDA_YEAR} aktif untuk {selectedSchoolRecord?.nama_sekolah ?? selectedSchool}.</p>
      ) : (
        <>
          <div className="upkk-summary-grid khalifah-summary-grid">
            <div className="upkk-summary-card">
              <span>Murid Tahun {KHALIFAH_MUDA_YEAR}</span>
              <strong>{classStudents.length}</strong>
            </div>
            <div className="upkk-summary-card">
              <span>Telah Diperhati</span>
              <strong>{observedCount}</strong>
            </div>
            <div className="upkk-summary-card">
              <span>Penghargaan</span>
              <strong>{positiveCount}</strong>
            </div>
            <div className="upkk-summary-card">
              <span>Perlu Bimbingan</span>
              <strong>{guidanceCount}</strong>
            </div>
            <div className="upkk-summary-card">
              <span>Aktiviti Kelas</span>
              <strong>{classActivityCount}</strong>
            </div>
          </div>

          <div className="khalifah-workspace">
            <form action={classAction} className="khalifah-card">
              <div>
                <h3>Rekod Aktiviti Kelas</h3>
                <p className="table-note">Rekod secara pukal. Tidak perlu klik semua murid satu persatu.</p>
              </div>
              <input type="hidden" name="kod_sekolah" value={selectedSchool} />
              <input type="hidden" name="class_id" value={selectedClass?.id ?? ''} />
              <input type="hidden" name="access_role" value={profile?.role ?? ''} />
              <label>
                Tarikh
                <input name="record_date" type="date" defaultValue={today} />
              </label>
              <label>
                Aktiviti
                <select name="indicator_key" required>
                  {khalifahMudaClassActivities.map((indicator) => (
                    <option key={indicator.key} value={indicator.key}>
                      {indicator.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Catatan Ringkas
                <input name="catatan" placeholder="Contoh: Dilaksanakan selepas bacaan doa" />
              </label>
              <button className="button" type="submit" disabled={!selectedClass || classPending}>
                {classPending ? 'Menyimpan...' : 'Simpan Aktiviti Kelas'}
              </button>
              {classState.message && <p className={classState.ok ? 'form-success' : 'form-message'}>{classState.message}</p>}
            </form>

            <form action={studentAction} className="khalifah-card">
              <div>
                <h3>Rekod Peristiwa Murid</h3>
                <p className="table-note">Rekod perkara positif atau perkara yang memerlukan bimbingan.</p>
              </div>
              <input type="hidden" name="kod_sekolah" value={selectedSchool} />
              <input type="hidden" name="class_id" value={selectedClass?.id ?? ''} />
              <input type="hidden" name="access_role" value={profile?.role ?? ''} />
              <label>
                Tarikh
                <input name="record_date" type="date" defaultValue={today} />
              </label>
              <label>
                Murid
                <select name="student_id" value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)} required>
                  {classStudents.length === 0 ? (
                    <option value="">Tiada murid</option>
                  ) : (
                    classStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.nama_murid}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <label>
                Indikator
                <select name="indicator_key" required>
                  <optgroup label="Penghargaan">
                    {khalifahMudaPositiveIndicators.map((indicator) => (
                      <option key={indicator.key} value={indicator.key}>
                        {indicator.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Perlu Bimbingan">
                    {khalifahMudaGuidanceIndicators.map((indicator) => (
                      <option key={indicator.key} value={indicator.key}>
                        {indicator.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </label>
              <label>
                Catatan Ringkas
                <input name="catatan" placeholder="Contoh: Membantu rakan mengemas kelas" />
              </label>
              <button className="button" type="submit" disabled={!selectedStudentId || studentPending}>
                {studentPending ? 'Menyimpan...' : 'Simpan Rekod Murid'}
              </button>
              {studentState.message && <p className={studentState.ok ? 'form-success' : 'form-message'}>{studentState.message}</p>}
            </form>
          </div>

          <div className="khalifah-layout">
            <section className="khalifah-table-card">
              <div className="panel-head module-subhead">
                <h2>Ringkasan Murid</h2>
                <span>{classStudents.length} murid</span>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Bil</th>
                      <th>Nama Murid</th>
                      <th>Penghargaan</th>
                      <th>Bimbingan</th>
                      <th>Mata</th>
                      <th>Rekod Akhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((student, index) => {
                      const summary = studentSummary.get(student.id) ?? { good: 0, guide: 0, points: 0, latest: null };
                      return (
                        <tr key={student.id}>
                          <td>{index + 1}</td>
                          <td><strong>{student.nama_murid}</strong></td>
                          <td className="khalifah-good">{summary.good}</td>
                          <td className="khalifah-guide">{summary.guide}</td>
                          <td>{summary.points}</td>
                          <td>{summary.latest ? formatDate(summary.latest) : 'Belum diperhati'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="khalifah-table-card">
              <div className="panel-head module-subhead">
                <h2>Rekod Terkini</h2>
                <span>{recentRecords.length} rekod</span>
              </div>
              {recentRecords.length === 0 ? (
                <p className="empty">Belum ada rekod Khalifah Muda untuk kelas ini.</p>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Tarikh</th>
                        <th>Jenis</th>
                        <th>Murid / Kelas</th>
                        <th>Indikator</th>
                        <th>Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRecords.map((record) => (
                        <tr key={record.id}>
                          <td>{formatDate(record.record_date)}</td>
                          <td><span className={recordKindClass(record.record_kind)}>{recordKindLabel(record.record_kind)}</span></td>
                          <td>{record.record_scope === 'KELAS' ? selectedClass?.nama_kelas ?? 'Kelas' : record.nama_murid ?? '-'}</td>
                          <td>{record.indicator_label}</td>
                          <td>{record.catatan ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </section>
  );
}
