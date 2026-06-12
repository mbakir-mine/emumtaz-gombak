'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import type { AmalKhairCategory, AmalKhairRecord, ClassRecord, School, StudentRecord } from '@/lib/data';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses, scopeSchools, scopeStudents } from '../ui/scopedData';
import { createAmalKhairRecord, type AmalKhairActionState } from './actions';

const initialState: AmalKhairActionState = { ok: false, message: '' };

function classLabel(item: ClassRecord) {
  return `Tahun ${item.tahun} - ${item.nama_kelas}`;
}

export default function AmalKhairManager({
  schools,
  classes,
  students,
  categories,
  records,
}: {
  schools: School[];
  classes: ClassRecord[];
  students: StudentRecord[];
  categories: AmalKhairCategory[];
  records: AmalKhairRecord[];
}) {
  const profile = useAccessProfile();
  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const scopedStudents = useMemo(() => scopeStudents(profile, students, classes, schools), [classes, profile, schools, students]);
  const currentAcademicYear = new Date().getFullYear();
  const [selectedSchool, setSelectedSchool] = useState(profile?.kod_sekolah ?? scopedSchools[0]?.kod_sekolah ?? '');
  const schoolClasses = scopedClasses.filter(
    (item) =>
      item.kod_sekolah === selectedSchool &&
      item.tahun_akademik === currentAcademicYear &&
      item.status === 'AKTIF',
  );
  const [selectedClass, setSelectedClass] = useState(schoolClasses[0]?.id ?? '');
  useEffect(() => {
    if (!selectedClass || !schoolClasses.some((item) => item.id === selectedClass)) {
      setSelectedClass(schoolClasses[0]?.id ?? '');
    }
  }, [schoolClasses, selectedClass]);
  const classStudents = scopedStudents
    .filter((student) => student.class_id === selectedClass && student.status === 'AKTIF')
    .sort((a, b) => a.nama_murid.localeCompare(b.nama_murid));
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id ?? '');
  const selectedCategoryRecord = categories.find((item) => item.id === selectedCategory) ?? null;
  const visibleRecords = records.filter((record) => !selectedSchool || record.kod_sekolah === selectedSchool).slice(0, 50);
  const [state, action] = useActionState(createAmalKhairRecord, initialState);

  return (
    <section className="panel optional-module-panel">
      <div className="panel-head">
        <div>
          <h2>Rekod Amal Khair</h2>
          <p className="table-note">Berikan mata dorongan untuk amalan baik murid.</p>
        </div>
        <span>{visibleRecords.length} rekod terkini</span>
      </div>

      <form action={action} className="module-form-grid">
        <label>
          Sekolah
          <select
            value={selectedSchool}
            onChange={(event) => {
              const kodSekolah = event.target.value;
              setSelectedSchool(kodSekolah);
              setSelectedClass(
                scopedClasses.find(
                  (item) =>
                    item.kod_sekolah === kodSekolah &&
                    item.tahun_akademik === currentAcademicYear &&
                    item.status === 'AKTIF',
                )?.id ?? '',
              );
            }}
            disabled={profile?.role !== 'OWNER'}
          >
            {scopedSchools.map((school) => (
              <option key={school.kod_sekolah} value={school.kod_sekolah}>
                {school.kod_sekolah} - {school.nama_sekolah}
              </option>
            ))}
          </select>
        </label>
        <label>
          Kelas
          <select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)}>
            <option value="">Pilih kelas</option>
            {schoolClasses.map((item) => (
              <option key={item.id} value={item.id}>
                {classLabel(item)} ({item.tahun_akademik})
              </option>
            ))}
          </select>
        </label>
        <label>
          Murid
          <select name="student_id" required>
            <option value="">Pilih murid</option>
            {classStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {student.nama_murid}
              </option>
            ))}
          </select>
        </label>
        <label>
          Kategori
          <select
            name="category_id"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            required
          >
            <option value="">Pilih kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nama_kategori}
              </option>
            ))}
          </select>
        </label>
        <label>
          Mata
          <input name="mata" type="number" min="1" max="100" defaultValue={selectedCategoryRecord?.mata_default ?? 5} />
        </label>
        <label className="module-wide-field">
          Catatan
          <input name="catatan" placeholder="Contoh: Membantu rakan mengemas kelas" />
        </label>
        <div className="form-actions">
          <button className="button" type="submit">
            SIMPAN AMAL KHAIR
          </button>
          {state.message && <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>}
        </div>
      </form>

      <div className="panel-head module-subhead">
        <h2>Senarai Rekod Terkini</h2>
        <span>{visibleRecords.length} rekod</span>
      </div>
      {visibleRecords.length === 0 ? (
        <p className="empty">Belum ada rekod Amal Khair untuk paparan ini.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Bil</th>
                <th>Murid</th>
                <th>Kategori</th>
                <th>Mata</th>
                <th>Catatan</th>
                <th>Tarikh</th>
              </tr>
            </thead>
            <tbody>
              {visibleRecords.map((record, index) => (
                <tr key={record.id}>
                  <td>{index + 1}</td>
                  <td>{record.nama_murid ?? record.student_id}</td>
                  <td>{record.kategori ?? '-'}</td>
                  <td><strong>{record.mata}</strong></td>
                  <td>{record.catatan ?? '-'}</td>
                  <td>{new Date(record.recorded_at).toLocaleDateString('ms-MY')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
