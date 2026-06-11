'use client';

import { useActionState, useMemo, useState } from 'react';
import type { ClassRecord, RphRecord, School, SubjectRecord, UserRecord } from '@/lib/data';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses, scopeSchools, scopeUsers } from '../ui/scopedData';
import { createRphDraft, type RphActionState } from './actions';

const initialState: RphActionState = { ok: false, message: '' };

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function classLabel(item: ClassRecord) {
  return `Tahun ${item.tahun} - ${item.nama_kelas}`;
}

function textLines(value: string | null) {
  return (value ?? '-').split('\n').filter(Boolean);
}

export default function RphManager({
  schools,
  classes,
  subjects,
  users,
  records,
}: {
  schools: School[];
  classes: ClassRecord[];
  subjects: SubjectRecord[];
  users: UserRecord[];
  records: RphRecord[];
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
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.kod_subjek ?? '');
  const [selectedTeacher, setSelectedTeacher] = useState(profile?.role === 'GURU_KELAS' || profile?.role === 'GURU_SUBJEK' ? profile.id : '');
  const selectedClassRecord = schoolClasses.find((item) => item.id === selectedClass) ?? null;
  const selectedSubjectRecord = subjects.find((item) => item.kod_subjek === selectedSubject) ?? null;
  const classMap = new Map(classes.map((item) => [item.id, item]));
  const subjectMap = new Map(subjects.map((subject) => [subject.kod_subjek, subject.nama_subjek]));
  const userMap = new Map(users.map((user) => [user.id, user.nama]));
  const teachers = scopedUsers
    .filter((user) => ['GURU_KELAS', 'GURU_SUBJEK', 'ADMIN_SEKOLAH'].includes(user.role) && user.status === 'AKTIF')
    .sort((a, b) => a.nama.localeCompare(b.nama));
  const visibleRecords = records
    .filter((record) => record.kod_sekolah === selectedSchool)
    .filter((record) => !selectedClass || record.class_id === selectedClass)
    .slice(0, 20);
  const [state, action] = useActionState(createRphDraft, initialState);
  const canChangeSchool = profile?.role === 'OWNER';

  return (
    <section className="panel optional-module-panel">
      <div className="panel-head">
        <div>
          <h2>RPH AI</h2>
          <p className="table-note">Jana draf Rancangan Pengajaran Harian sebagai asas untuk guru kemaskan.</p>
        </div>
        <span>{visibleRecords.length} draf</span>
      </div>

      <form action={action} className="module-form-grid rph-form">
        <input type="hidden" name="nama_kelas" value={selectedClassRecord ? classLabel(selectedClassRecord) : ''} />
        <input type="hidden" name="nama_subjek" value={selectedSubjectRecord?.nama_subjek ?? ''} />
        <label>
          Sekolah
          <select
            name="kod_sekolah"
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
          {!canChangeSchool && <input type="hidden" name="kod_sekolah" value={selectedSchool} />}
        </label>
        <label>
          Kelas
          <select name="class_id" value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)} required>
            <option value="">Pilih kelas</option>
            {schoolClasses.map((item) => (
              <option key={item.id} value={item.id}>
                {classLabel(item)} ({item.tahun_akademik})
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
          Guru
          <select name="teacher_id" value={selectedTeacher} onChange={(event) => setSelectedTeacher(event.target.value)}>
            <option value="">Pilih guru</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.nama}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tarikh
          <input name="tarikh" type="date" defaultValue={todayIso()} required />
        </label>
        <label className="module-wide-field">
          Tajuk
          <input name="tajuk" placeholder="Contoh: Solat Berjemaah" required />
        </label>
        <label className="module-wide-field">
          Standard Pembelajaran / Fokus
          <textarea name="standard_pembelajaran" rows={4} placeholder="Tulis standard, kemahiran atau fokus pengajaran." />
        </label>
        <div className="form-actions">
          <button className="button" type="submit">
            JANA DRAF RPH
          </button>
          {state.message && <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>}
        </div>
      </form>

      <div className="panel-head module-subhead">
        <h2>Senarai Draf RPH</h2>
        <span>{visibleRecords.length} rekod</span>
      </div>
      {visibleRecords.length === 0 ? (
        <p className="empty">Belum ada draf RPH untuk paparan ini.</p>
      ) : (
        <div className="rph-list">
          {visibleRecords.map((record) => {
            const classRecord = record.class_id ? classMap.get(record.class_id) : null;
            return (
              <article className="rph-card" key={record.id}>
                <div className="rph-card-head">
                  <div>
                    <h3>{record.tajuk}</h3>
                    <p>
                      {record.tarikh} · {classRecord ? classLabel(classRecord) : '-'} ·{' '}
                      {record.kod_subjek ? subjectMap.get(record.kod_subjek) ?? record.kod_subjek : '-'}
                    </p>
                  </div>
                  <span>{record.teacher_id ? userMap.get(record.teacher_id) ?? 'Guru' : 'Draf'}</span>
                </div>
                <div className="rph-card-grid">
                  <section>
                    <strong>Objektif</strong>
                    {textLines(record.objektif).map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </section>
                  <section>
                    <strong>Aktiviti</strong>
                    {textLines(record.aktiviti).map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </section>
                  <section>
                    <strong>BBM</strong>
                    <p>{record.bbm ?? '-'}</p>
                  </section>
                  <section>
                    <strong>Pentaksiran</strong>
                    <p>{record.pentaksiran ?? '-'}</p>
                  </section>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
