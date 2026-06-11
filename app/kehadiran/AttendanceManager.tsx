'use client';

import { useActionState, useMemo, useState } from 'react';
import type { AttendanceRecord, ClassRecord, School, StudentRecord } from '@/lib/data';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses, scopeSchools, scopeStudents } from '../ui/scopedData';
import { saveDailyAttendance, type AttendanceActionState } from './actions';

const initialState: AttendanceActionState = { ok: false, message: '' };
const statusOptions = [
  { value: 'HADIR', label: 'Hadir' },
  { value: 'TIDAK_HADIR', label: 'Tidak Hadir' },
  { value: 'SAKIT', label: 'Sakit' },
  { value: 'CUTI', label: 'Cuti' },
  { value: 'LEWAT', label: 'Lewat' },
  { value: 'AKTIVITI', label: 'Aktiviti' },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function classLabel(item: ClassRecord) {
  return `Tahun ${item.tahun} - ${item.nama_kelas}`;
}

export default function AttendanceManager({
  schools,
  classes,
  students,
  records,
}: {
  schools: School[];
  classes: ClassRecord[];
  students: StudentRecord[];
  records: AttendanceRecord[];
}) {
  const profile = useAccessProfile();
  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const scopedStudents = useMemo(() => scopeStudents(profile, students, classes, schools), [classes, profile, schools, students]);
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [selectedSchool, setSelectedSchool] = useState(profile?.kod_sekolah ?? scopedSchools[0]?.kod_sekolah ?? '');
  const schoolClasses = useMemo(
    () => scopedClasses.filter((item) => item.kod_sekolah === selectedSchool),
    [scopedClasses, selectedSchool],
  );
  const [selectedClass, setSelectedClass] = useState(schoolClasses[0]?.id ?? '');
  const activeClass = schoolClasses.find((item) => item.id === selectedClass) ?? null;
  const classStudents = useMemo(
    () =>
      scopedStudents
        .filter((student) => student.class_id === selectedClass && student.status === 'AKTIF')
        .sort((a, b) => a.nama_murid.localeCompare(b.nama_murid)),
    [scopedStudents, selectedClass],
  );
  const recordMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    records
      .filter((record) => record.attendance_date === selectedDate)
      .forEach((record) => map.set(record.student_id, record));
    return map;
  }, [records, selectedDate]);
  const [state, action] = useActionState(saveDailyAttendance, initialState);

  return (
    <section className="panel optional-module-panel">
      <div className="panel-head">
        <div>
          <h2>Kehadiran Harian</h2>
          <p className="table-note">Tanda kehadiran mengikut kelas dan tarikh.</p>
        </div>
        <span>{classStudents.length} murid</span>
      </div>

      <div className="module-toolbar">
        <label>
          Tarikh
          <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        </label>
        <label>
          Sekolah
          <select
            value={selectedSchool}
            onChange={(event) => {
              const kodSekolah = event.target.value;
              setSelectedSchool(kodSekolah);
              setSelectedClass(scopedClasses.find((item) => item.kod_sekolah === kodSekolah)?.id ?? '');
            }}
            disabled={profile?.role === 'ADMIN_SEKOLAH' || profile?.role === 'GURU_KELAS' || profile?.role === 'GURU_SUBJEK'}
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
      </div>

      {!activeClass ? (
        <p className="empty">Pilih kelas untuk menanda kehadiran.</p>
      ) : classStudents.length === 0 ? (
        <p className="empty">Tiada murid aktif dalam kelas ini.</p>
      ) : (
        <form action={action}>
          <input type="hidden" name="attendance_date" value={selectedDate} />
          <div className="module-table-actions">
            <button
              className="button soft"
              type="button"
              onClick={(event) => {
                const form = event.currentTarget.closest('form');
                form?.querySelectorAll<HTMLSelectElement>('select[data-attendance-status]').forEach((select) => {
                  select.value = 'HADIR';
                });
              }}
            >
              TANDA SEMUA HADIR
            </button>
            <button className="button" type="submit">
              SIMPAN KEHADIRAN
            </button>
          </div>
          {state.message && <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>}
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Bil</th>
                  <th>Nama Murid</th>
                  <th>Jantina</th>
                  <th>Status</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((student, index) => {
                  const record = recordMap.get(student.id);
                  return (
                    <tr key={student.id}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{student.nama_murid}</strong>
                        <input type="hidden" name="student_id" value={student.id} />
                      </td>
                      <td>{student.jantina === 'P' ? 'Perempuan' : 'Lelaki'}</td>
                      <td>
                        <select name={`status_${student.id}`} defaultValue={record?.status ?? 'HADIR'} data-attendance-status>
                          {statusOptions.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input name={`catatan_${student.id}`} defaultValue={record?.catatan ?? ''} placeholder="Catatan ringkas" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </form>
      )}
    </section>
  );
}
