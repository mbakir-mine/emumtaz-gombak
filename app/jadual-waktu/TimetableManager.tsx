'use client';

import { useActionState, useMemo, useState } from 'react';
import type {
  ClassRecord,
  School,
  SubjectRecord,
  TimetableEntry,
  TimetableRequirement,
  TimetableSlot,
  UserRecord,
} from '@/lib/data';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses, scopeSchools, scopeUsers } from '../ui/scopedData';
import {
  generateAutoTimetable,
  generateDefaultTimetableSlots,
  saveTimetableRequirement,
  type TimetableActionState,
} from './actions';

const initialState: TimetableActionState = { ok: false, message: '' };
const days = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'];

function classLabel(item: ClassRecord) {
  return `Tahun ${item.tahun} - ${item.nama_kelas}`;
}

function timeRange(slot: TimetableSlot) {
  return `${slot.waktu_mula.slice(0, 5)} - ${slot.waktu_tamat.slice(0, 5)}`;
}

function isTeachingSlot(slot: TimetableSlot) {
  return !(slot.label ?? '').toUpperCase().includes('REHAT');
}

function yearOptions(classes: ClassRecord[]) {
  return [...new Set(classes.map((item) => item.tahun_akademik))].sort((a, b) => b - a);
}

export default function TimetableManager({
  schools,
  classes,
  subjects,
  users,
  slots,
  entries,
  requirements,
}: {
  schools: School[];
  classes: ClassRecord[];
  subjects: SubjectRecord[];
  users: UserRecord[];
  slots: TimetableSlot[];
  entries: TimetableEntry[];
  requirements: TimetableRequirement[];
}) {
  const profile = useAccessProfile();
  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const scopedUsers = useMemo(() => scopeUsers(profile, users, schools), [profile, schools, users]);
  const [selectedSchool, setSelectedSchool] = useState(profile?.kod_sekolah ?? scopedSchools[0]?.kod_sekolah ?? '');
  const schoolClasses = scopedClasses
    .filter((item) => item.kod_sekolah === selectedSchool && item.status === 'AKTIF')
    .sort((a, b) => a.tahun_akademik - b.tahun_akademik || a.tahun - b.tahun || a.nama_kelas.localeCompare(b.nama_kelas));
  const years = yearOptions(schoolClasses);
  const [selectedYear, setSelectedYear] = useState(years[0] ?? new Date().getFullYear());
  const yearClasses = schoolClasses.filter((item) => item.tahun_akademik === selectedYear);
  const [selectedClass, setSelectedClass] = useState(yearClasses[0]?.id ?? '');
  const selectedClassRecord = yearClasses.find((item) => item.id === selectedClass) ?? yearClasses[0] ?? null;
  const schoolSlots = slots
    .filter((slot) => slot.kod_sekolah === selectedSchool)
    .sort((a, b) => days.indexOf(a.hari) - days.indexOf(b.hari) || a.susunan - b.susunan || a.waktu_mula.localeCompare(b.waktu_mula));
  const teachingSlots = schoolSlots.filter(isTeachingSlot);
  const classEntries = entries.filter((entry) => entry.class_id === selectedClass);
  const entryBySlot = new Map(classEntries.map((entry) => [entry.slot_id, entry]));
  const subjectMap = new Map(subjects.map((subject) => [subject.kod_subjek, subject.nama_subjek]));
  const userMap = new Map(scopedUsers.map((user) => [user.id, user.nama]));
  const teachers = scopedUsers
    .filter(
      (user) =>
        ['GURU_KELAS', 'GURU_SUBJEK', 'ADMIN_SEKOLAH'].includes(user.role) &&
        user.status === 'AKTIF' &&
        user.kod_sekolah === selectedSchool,
    )
    .sort((a, b) => a.nama.localeCompare(b.nama));
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.kod_subjek ?? '');
  const classRequirements = requirements
    .filter((requirement) => requirement.class_id === selectedClass)
    .sort((a, b) => (subjectMap.get(a.kod_subjek) ?? a.kod_subjek).localeCompare(subjectMap.get(b.kod_subjek) ?? b.kod_subjek));
  const schoolYearClassIds = new Set(yearClasses.map((item) => item.id));
  const schoolYearRequirements = requirements.filter((requirement) => schoolYearClassIds.has(requirement.class_id));
  const schoolYearEntries = entries.filter((entry) => schoolYearClassIds.has(entry.class_id));
  const totalRequiredSlots = schoolYearRequirements.reduce((sum, item) => sum + item.bil_slot_seminggu, 0);
  const [slotState, slotAction] = useActionState(generateDefaultTimetableSlots, initialState);
  const [requirementState, requirementAction] = useActionState(saveTimetableRequirement, initialState);
  const [autoState, autoAction] = useActionState(generateAutoTimetable, initialState);
  const canChangeSchool = profile?.role === 'OWNER';

  function updateSchool(kodSekolah: string) {
    const nextClasses = scopedClasses
      .filter((item) => item.kod_sekolah === kodSekolah && item.status === 'AKTIF')
      .sort((a, b) => a.tahun_akademik - b.tahun_akademik || a.tahun - b.tahun || a.nama_kelas.localeCompare(b.nama_kelas));
    const nextYear = yearOptions(nextClasses)[0] ?? new Date().getFullYear();
    setSelectedSchool(kodSekolah);
    setSelectedYear(nextYear);
    setSelectedClass(nextClasses.find((item) => item.tahun_akademik === nextYear)?.id ?? '');
  }

  function updateYear(tahun: number) {
    setSelectedYear(tahun);
    setSelectedClass(schoolClasses.find((item) => item.tahun_akademik === tahun)?.id ?? '');
  }

  return (
    <section className="panel optional-module-panel">
      <div className="panel-head">
        <div>
          <h2>Jadual Waktu Automatik</h2>
          <p className="table-note">
            Tetapkan subjek, guru dan bilangan masa. Sistem akan jana jadual kelas dan elakkan pertembungan guru.
          </p>
        </div>
        <span>{schoolYearEntries.length} / {totalRequiredSlots} slot dijana</span>
      </div>

      <div className="module-toolbar timetable-auto-toolbar">
        <label>
          Sekolah
          <select value={selectedSchool} onChange={(event) => updateSchool(event.target.value)} disabled={!canChangeSchool}>
            {scopedSchools.map((school) => (
              <option key={school.kod_sekolah} value={school.kod_sekolah}>
                {school.kod_sekolah} - {school.nama_sekolah}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tahun Akademik
          <select value={selectedYear} onChange={(event) => updateYear(Number(event.target.value))}>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label>
          Kelas Semakan
          <select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)}>
            <option value="">Pilih kelas</option>
            {yearClasses.map((item) => (
              <option key={item.id} value={item.id}>
                {classLabel(item)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="timetable-action-row">
        <form action={slotAction}>
          <input type="hidden" name="kod_sekolah" value={selectedSchool} />
          <button className="button soft" type="submit">
            SEDIAKAN SLOT MASA
          </button>
        </form>
        <form action={autoAction}>
          <input type="hidden" name="kod_sekolah" value={selectedSchool} />
          <input type="hidden" name="tahun_akademik" value={selectedYear} />
          <button className="button" type="submit" disabled={schoolYearRequirements.length === 0 || teachingSlots.length === 0}>
            JANA JADUAL AUTOMATIK
          </button>
        </form>
      </div>
      {slotState.message && <p className={slotState.ok ? 'form-success' : 'form-message'}>{slotState.message}</p>}
      {autoState.message && <p className={autoState.ok ? 'form-success' : 'form-message'}>{autoState.message}</p>}

      <div className="timetable-setup-grid">
        <form action={requirementAction} className="timetable-requirement-form">
          <input type="hidden" name="kod_sekolah" value={selectedSchool} />
          <div>
            <h3>Tetapan Subjek Kelas</h3>
            <p className="table-note">Masukkan subjek yang perlu dijadualkan untuk kelas dipilih.</p>
          </div>
          <label>
            Kelas
            <select name="class_id" value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)} required>
              <option value="">Pilih kelas</option>
              {yearClasses.map((item) => (
                <option key={item.id} value={item.id}>
                  {classLabel(item)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Subjek
            <select name="kod_subjek" value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)} required>
              <option value="">Pilih subjek</option>
              {subjects.map((subject) => (
                <option key={subject.kod_subjek} value={subject.kod_subjek}>
                  {subject.nama_subjek}
                </option>
              ))}
            </select>
          </label>
          <label>
            Guru Subjek
            <select name="teacher_id" required>
              <option value="">Pilih guru</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.nama}
                </option>
              ))}
            </select>
          </label>
          <label>
            Bilangan Masa Seminggu
            <input name="bil_slot_seminggu" type="number" min="1" max="40" defaultValue={4} required />
          </label>
          <button className="button" type="submit" disabled={!selectedClass || !selectedSubject}>
            SIMPAN TETAPAN
          </button>
          {requirementState.message && (
            <p className={requirementState.ok ? 'form-success' : 'form-message'}>{requirementState.message}</p>
          )}
        </form>

        <div className="timetable-requirement-list">
          <div className="panel-head compact-head">
            <div>
              <h3>{selectedClassRecord ? `Subjek ${classLabel(selectedClassRecord)}` : 'Subjek Kelas'}</h3>
              <p className="table-note">{classRequirements.length} tetapan subjek</p>
            </div>
            <strong>{classRequirements.reduce((sum, item) => sum + item.bil_slot_seminggu, 0)} masa</strong>
          </div>
          {classRequirements.length === 0 ? (
            <p className="empty">Belum ada tetapan subjek untuk kelas ini.</p>
          ) : (
            <div className="table-scroll">
              <table className="compact-table">
                <thead>
                  <tr>
                    <th>Bil</th>
                    <th>Subjek</th>
                    <th>Guru</th>
                    <th>Masa</th>
                  </tr>
                </thead>
                <tbody>
                  {classRequirements.map((requirement, index) => (
                    <tr key={requirement.id}>
                      <td>{index + 1}</td>
                      <td>{subjectMap.get(requirement.kod_subjek) ?? requirement.kod_subjek}</td>
                      <td>{requirement.teacher_id ? userMap.get(requirement.teacher_id) ?? '-' : '-'}</td>
                      <td className="numeric-cell">{requirement.bil_slot_seminggu}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="panel-head module-subhead">
        <div>
          <h2>{selectedClassRecord ? `Jadual ${classLabel(selectedClassRecord)} ${selectedClassRecord.tahun_akademik}` : 'Senarai Jadual'}</h2>
          <p className="table-note">Jadual di bawah dijana oleh sistem berdasarkan tetapan subjek dan guru.</p>
        </div>
        <span>{classEntries.length} slot diisi</span>
      </div>

      {schoolSlots.length === 0 ? (
        <p className="empty">Belum ada slot masa. Klik SEDIAKAN SLOT MASA dahulu.</p>
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
                  <tr key={slot.id} className={!isTeachingSlot(slot) ? 'timetable-break-row' : undefined}>
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
