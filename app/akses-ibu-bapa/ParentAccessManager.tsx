'use client';

import { useActionState, useMemo, useState } from 'react';
import type { ClassRecord, School, SchoolModuleAccess, StudentRecord } from '@/lib/data';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses, scopeSchools, scopeStudents } from '../ui/scopedData';
import { issueParentAccessCode, type ParentCodeState } from './actions';

const initialState: ParentCodeState = { ok: false, message: '' };

export default function ParentAccessManager({ schools, classes, students, accesses }: {
  schools: School[];
  classes: ClassRecord[];
  students: StudentRecord[];
  accesses: SchoolModuleAccess[];
}) {
  const profile = useAccessProfile();
  const [schoolCode, setSchoolCode] = useState('');
  const [classId, setClassId] = useState('');
  const [state, formAction, pending] = useActionState(issueParentAccessCode, initialState);
  const enabledCodes = useMemo(() => new Set(accesses.filter((item) => item.module_key === 'AKSES_IBU_BAPA' && item.enabled).map((item) => item.kod_sekolah)), [accesses]);
  const scopedSchoolRows = useMemo(() => scopeSchools(profile, schools).filter((item) => enabledCodes.has(item.kod_sekolah)), [enabledCodes, profile, schools]);
  const effectiveSchool = schoolCode && scopedSchoolRows.some((item) => item.kod_sekolah === schoolCode)
    ? schoolCode
    : profile?.kod_sekolah && scopedSchoolRows.some((item) => item.kod_sekolah === profile.kod_sekolah)
      ? profile.kod_sekolah
      : scopedSchoolRows[0]?.kod_sekolah ?? '';
  const schoolClasses = useMemo(() => scopeClasses(profile, classes, schools).filter((item) => item.kod_sekolah === effectiveSchool && item.status === 'AKTIF'), [classes, effectiveSchool, profile, schools]);
  const effectiveClass = classId && schoolClasses.some((item) => item.id === classId) ? classId : schoolClasses[0]?.id ?? '';
  const classStudents = useMemo(() => scopeStudents(profile, students, classes, schools).filter((item) => item.kod_sekolah === effectiveSchool && item.class_id === effectiveClass && item.status === 'AKTIF').sort((a, b) => a.nama_murid.localeCompare(b.nama_murid, 'ms')), [classes, effectiveClass, effectiveSchool, profile, schools, students]);

  return (
    <section className="panel parent-access-manager">
      <div className="panel-head"><div><h2>Jana Kod Akses Penjaga</h2><p className="table-note">Kod hanya dipaparkan sekali. Kod lama murid dibatalkan apabila kod baharu dijana.</p></div></div>
      {scopedSchoolRows.length === 0 ? <p className="empty">Tiada sekolah dalam skop anda yang telah mengaktifkan modul Akses Ibu Bapa.</p> : (
        <form action={formAction} className="form-grid">
          <label>Sekolah<select name="kod_sekolah" value={effectiveSchool} onChange={(event) => { setSchoolCode(event.target.value); setClassId(''); }} required>{scopedSchoolRows.map((school) => <option key={school.kod_sekolah} value={school.kod_sekolah}>{school.kod_sekolah} - {school.nama_sekolah}</option>)}</select></label>
          <label>Kelas<select value={effectiveClass} onChange={(event) => setClassId(event.target.value)} required>{schoolClasses.map((item) => <option key={item.id} value={item.id}>Tahun {item.tahun} - {item.nama_kelas}</option>)}</select></label>
          <label>Murid<select name="student_id" required>{classStudents.map((student) => <option key={student.id} value={student.id}>{student.nama_murid}</option>)}</select></label>
          <label>Tempoh sah<select name="valid_days" defaultValue="7"><option value="1">1 hari</option><option value="7">7 hari</option><option value="14">14 hari</option><option value="30">30 hari</option></select></label>
          <div className="form-actions"><button className="button" type="submit" disabled={pending || classStudents.length === 0}>{pending ? 'Menjana…' : 'Jana Kod Baharu'}</button></div>
          {state.message && <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>}
          {state.ok && state.code && <div className="parent-one-time-code"><span>Kod akses sekali paparan</span><strong>{state.code}</strong><small>Sah sehingga {new Intl.DateTimeFormat('ms-MY', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kuala_Lumpur' }).format(new Date(state.expiresAt ?? ''))}</small></div>}
        </form>
      )}
    </section>
  );
}
