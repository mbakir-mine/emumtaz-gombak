'use client';

import { useActionState, useMemo, useState } from 'react';
import type { ClassRecord, School, SubjectRecord, TimetableEntry, TimetableSlot, UserRecord } from '@/lib/data';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses, scopeSchools, scopeUsers } from '../ui/scopedData';
import { generateDefaultTimetableSlots, saveTimetableEntry, type TimetableActionState } from './actions';

const initialState: TimetableActionState = { ok: false, message: '' };
const days = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'];

function classLabel(item: ClassRecord) {
  return `Tahun ${item.tahun} - ${item.nama_kelas}`;
}

function timeRange(slot: TimetableSlot) {
  return `${slot.waktu_mula.slice(0, 5)} - ${slot.waktu_tamat.slice(0, 5)}`;
}

export default function TimetableManager({
  schools,
  classes,
  subjects,
  users,
  slots,
  entries,
}: {
  schools: School[];
  classes: ClassRecord[];
  subjects: SubjectRecord[];
  users: UserRecord[];
  slots: TimetableSlot[];
  entries: TimetableEntry[];
}) {
  const profile = useAccessProfile();
  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const scopedUsers = useMemo(() => scopeUsers(profile, users, schools), [profile, schools, users]);
  const [selectedSchool, setSelectedSchool] = useState(profile?.kod_sekolah ?? scopedSchools[0]?.kod_sekolah ?? '');
  const schoolClasses = scopedClasses
    .filter((item) => item.kod_sekolah === selectedSchool && item.status === 'AKTIF')
    .sort((a, b) => a.tahun - b.tahun || a.nama_kelas.localeCompare(b.nama_kelas));
  const [selectedClass, setSelectedClass] = useState(schoolClasses[0]?.id ?? '');
  const selectedClassRecord = schoolClasses.find((item) => item.id === selectedClass) ?? schoolClasses[0] ?? null;
  const schoolSlots = slots
    .filter((slot) => slot.kod_sekolah === selectedSchool)
    .sort((a, b) => days.indexOf(a.hari) - days.indexOf(b.hari) || a.susunan - b.susunan || a.waktu_mula.localeCompare(b.waktu_mula));
  const classEntries = entries.filter((entry) => entry.class_id === selectedClass);
  const entryBySlot = new Map(classEntries.map((entry) => [entry.slot_id, entry]));
  const subjectMap = new Map(subjects.map((subject) => [subject.kod_subjek, subject.nama_subjek]));
  const userMap = new Map(scopedUsers.map((user) => [user.id, user.nama]));
  const teachers = scopedUsers
    .filter((user) => ['GURU_KELAS', 'GURU_SUBJEK', 'ADMIN_SEKOLAH'].includes(user.role) && user.status === 'AKTIF')
    .sort((a, b) => a.nama.localeCompare(b.nama));
  const [slotState, slotAction] = useActionState(generateDefaultTimetableSlots, initialState);
  const [entryState, entryAction] = useActionState(saveTimetableEntry, initialState);

  const canChangeSchool = profile?.role === 'OWNER';

  return (
    <section className="panel optional-module-panel">
      <div className="panel-head">
        <div>
          <h2>Jadual Waktu Sekolah</h2>
          <p className="table-note">Bina slot masa dan tetapkan subjek mengikut kelas.</p>
        </div>
        <span>{classEntries.length} slot diisi</span>
      </div>

      <div className="module-toolbar timetable-toolbar">
        <label>
          Sekolah
          <select
            value={selectedSchool}
            onChange={(event) => {
              const kodSekolah = event.target.value;
              const firstClass = scopedClasses.find((item) => item.kod_sekolah === kodSekolah)?.id ?? '';
              setSelectedSchool(kodSekolah);
              setSelectedClass(firstClass);
            }}
            disabled={!canChangeSchool}
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
        <form action={slotAction} className="module-inline-form">
          <input type="hidden" name="kod_sekolah" value={selectedSchool} />
          <button className="button soft" type="submit">
            JANA SLOT ASAS
          </button>
        </form>
      </div>
      {slotState.message && <p className={slotState.ok ? 'form-success' : 'form-message'}>{slotState.message}</p>}

      <form action={entryAction} className="module-form-grid compact-module-form">
        <input type="hidden" name="kod_sekolah" value={selectedSchool} />
        <label>
          Kelas
          <select name="class_id" value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)} required>
            <option value="">Pilih kelas</option>
            {schoolClasses.map((item) => (
              <option key={item.id} value={item.id}>
                {classLabel(item)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Hari / Masa
          <select name="slot_id" required>
            <option value="">Pilih slot</option>
            {schoolSlots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.hari} - {timeRange(slot)} ({slot.label ?? 'Slot'})
              </option>
            ))}
          </select>
        </label>
        <label>
          Subjek
          <select name="kod_subjek" required>
            <option value="">Pilih subjek</option>
            {subjects.map((subject) => (
              <option key={subject.kod_subjek} value={subject.kod_subjek}>
                {subject.nama_subjek}
              </option>
            ))}
          </select>
        </label>
        <label>
          Guru
          <select name="teacher_id">
            <option value="">Belum ditetapkan</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.nama}
              </option>
            ))}
          </select>
        </label>
        <label>
          Bilik
          <input name="bilik" placeholder="Contoh: Kelas / Makmal" />
        </label>
        <div className="form-actions">
          <button className="button" type="submit" disabled={!selectedClass || schoolSlots.length === 0}>
            SIMPAN SLOT
          </button>
        </div>
      </form>
      {entryState.message && <p className={entryState.ok ? 'form-success' : 'form-message'}>{entryState.message}</p>}

      <div className="panel-head module-subhead">
        <div>
          <h2>{selectedClassRecord ? `Jadual ${classLabel(selectedClassRecord)} ${selectedClassRecord.tahun_akademik}` : 'Senarai Jadual'}</h2>
          <p className="table-note">Slot kosong boleh diisi sedikit demi sedikit.</p>
        </div>
        <span>{schoolSlots.length} slot</span>
      </div>

      {schoolSlots.length === 0 ? (
        <p className="empty">Belum ada slot masa. Klik JANA SLOT ASAS dahulu.</p>
      ) : (
        <div className="table-scroll">
          <table className="compact-table timetable-table">
            <thead>
              <tr>
                <th>Bil</th>
                <th>Hari</th>
                <th>Masa</th>
                <th>Subjek</th>
                <th>Guru</th>
                <th>Bilik</th>
              </tr>
            </thead>
            <tbody>
              {schoolSlots.map((slot, index) => {
                const entry = entryBySlot.get(slot.id);
                return (
                  <tr key={slot.id}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{slot.hari}</strong>
                      <small>{slot.label ?? '-'}</small>
                    </td>
                    <td>{timeRange(slot)}</td>
                    <td>{entry?.kod_subjek ? subjectMap.get(entry.kod_subjek) ?? entry.kod_subjek : '-'}</td>
                    <td>{entry?.teacher_id ? userMap.get(entry.teacher_id) ?? '-' : '-'}</td>
                    <td>{entry?.bilik ?? '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
