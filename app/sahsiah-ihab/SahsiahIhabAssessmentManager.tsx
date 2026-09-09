'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import type { ClassRecord, School, SchoolModuleAccess, SahsiahIhabAssessment, StudentRecord } from '@/lib/data';
import { calculateSahsiahIhab, sahsiahIhabGradeScale, sahsiahIhabSixM } from '@/lib/sahsiahIhab';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses, scopeSchools, scopeStudents } from '../ui/scopedData';
import { saveSahsiahIhabAssessment, type SahsiahIhabActionState } from './actions';

const initialState: SahsiahIhabActionState = { ok: false, message: '' };

export default function SahsiahIhabAssessmentManager({
  schools,
  moduleAccesses,
  classes,
  students,
  assessments,
}: {
  schools: School[];
  moduleAccesses: SchoolModuleAccess[];
  classes: ClassRecord[];
  students: StudentRecord[];
  assessments: SahsiahIhabAssessment[];
}) {
  const profile = useAccessProfile();
  const selectableSchools = useMemo(() => scopeSchools(profile, schools).filter((school) =>
    profile?.role === 'OWNER' || moduleAccesses.some((access) => access.kod_sekolah === school.kod_sekolah && access.module_key === 'KHALIFAH_MUDA' && access.enabled),
  ), [moduleAccesses, profile, schools]);
  const [schoolCode, setSchoolCode] = useState(profile?.kod_sekolah ?? selectableSchools[0]?.kod_sekolah ?? '');
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const yearSixClasses = useMemo(() => scopedClasses.filter((item) => item.kod_sekolah === schoolCode && item.tahun === 6 && item.status === 'AKTIF'), [scopedClasses, schoolCode]);
  const [classId, setClassId] = useState('');
  useEffect(() => { if (!yearSixClasses.some((item) => item.id === classId)) setClassId(yearSixClasses[0]?.id ?? ''); }, [classId, yearSixClasses]);
  const scopedStudents = useMemo(() => scopeStudents(profile, students, classes, schools), [classes, profile, schools, students]);
  const classStudents = useMemo(() => scopedStudents.filter((student) => student.class_id === classId && student.status === 'AKTIF').sort((a, b) => a.nama_murid.localeCompare(b.nama_murid)), [classId, scopedStudents]);
  const [studentId, setStudentId] = useState('');
  useEffect(() => { if (!classStudents.some((student) => student.id === studentId)) setStudentId(classStudents[0]?.id ?? ''); }, [classStudents, studentId]);
  const [m3Raw, setM3Raw] = useState(0);
  const [m4, setM4] = useState(0);
  const [m5, setM5] = useState(0);
  const [m6, setM6] = useState(0);
  const preview = calculateSahsiahIhab({ m3Raw, m4, m5, m6 });
  const [state, action, pending] = useActionState(saveSahsiahIhabAssessment, initialState);
  const visibleAssessments = assessments.filter((item) => !schoolCode || item.kod_sekolah === schoolCode).slice(0, 100);

  return (
    <div className="sahsiah-ihab-workspace">
      <section className="panel optional-module-panel">
        <div className="panel-head"><div><h2>Pentaksiran 6M</h2><p className="table-note">Isi markah bulanan Tahun 6. Sistem mengira M3%, skor akhir, gred dan band secara automatik.</p></div><span className="khalifah-pill">Sumber IHAB</span></div>
        <div className="module-form-grid">
          <label>Sekolah<select value={schoolCode} onChange={(event) => setSchoolCode(event.target.value)} disabled={profile?.role !== 'OWNER'}>{selectableSchools.map((school) => <option key={school.kod_sekolah} value={school.kod_sekolah}>{school.kod_sekolah} - {school.nama_sekolah}</option>)}</select></label>
          <label>Kelas Tahun 6<select value={classId} onChange={(event) => setClassId(event.target.value)}><option value="">Pilih kelas</option>{yearSixClasses.map((item) => <option key={item.id} value={item.id}>{item.nama_kelas}</option>)}</select></label>
          <label>Murid<select name="student_id" form="sahsiah-ihab-form" value={studentId} onChange={(event) => setStudentId(event.target.value)}><option value="">Pilih murid</option>{classStudents.map((student) => <option key={student.id} value={student.id}>{student.nama_murid} ({student.mykid})</option>)}</select></label>
          <label>Bulan<input name="bulan" form="sahsiah-ihab-form" type="number" min={1} max={12} defaultValue={new Date().getMonth() + 1} /></label>
        </div>
        <div className="sahsiah-ihab-sixm-grid">{sahsiahIhabSixM.map(([code, name, description]) => <article className="khalifah-card" key={code}><span className="khalifah-pill">{code}</span><h3>{name}</h3><p>{description}</p>{code === 'M1' || code === 'M2' ? <label className="checkbox-row"><input type="checkbox" name={`${code.toLowerCase()}_confirmed`} form="sahsiah-ihab-form" /> Disahkan</label> : <label>Markah<input name={code.toLowerCase() === 'M3' ? 'm3_raw' : code.toLowerCase()} form="sahsiah-ihab-form" type="number" min={0} max={code === 'M3' ? 320 : code === 'M4' ? 16 : 100} value={code === 'M3' ? m3Raw : code === 'M4' ? m4 : code === 'M5' ? m5 : m6} onChange={(event) => { const value = Number(event.target.value); if (code === 'M3') setM3Raw(value); else if (code === 'M4') setM4(value); else if (code === 'M5') setM5(value); else setM6(value); }} /></label>}</article>)}</div>
        <div className="khalifah-detail-panel"><strong>Pratonton keputusan: {preview.totalScore} · {preview.grade} · Band {preview.band}</strong><span>{preview.achievement} · M3% {preview.m3Percent}</span></div>
        <form id="sahsiah-ihab-form" action={action} className="module-form-grid"><input type="hidden" name="kod_sekolah" value={schoolCode} /><input type="hidden" name="class_id" value={classId} /><input type="hidden" name="student_id" value={studentId} /><label>Catatan<textarea name="catatan" rows={2} maxLength={500} placeholder="Catatan guru (pilihan)" /></label><button className="primary-button" disabled={pending || !studentId}>{pending ? 'Menyimpan…' : 'Simpan pentaksiran'}</button></form>
        {state.message && <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>}
      </section>
      <section className="panel optional-module-panel"><div className="panel-head"><div><h2>Skala gred dan laporan bulanan</h2><p className="table-note">Rekod berstatus DRAF boleh disemak sebelum proses pengesahan sekolah.</p></div><span>{visibleAssessments.length} rekod</span></div><div className="khalifah-layout"><div className="khalifah-table-card"><table><thead><tr><th>Murid</th><th>Bulan</th><th>Skor</th><th>Gred</th><th>Band</th><th>Status</th></tr></thead><tbody>{visibleAssessments.map((item) => <tr key={item.id}><td>{item.nama_murid ?? item.student_id}</td><td>{item.bulan}/{item.tahun_akademik}</td><td>{item.totalScore}</td><td>{item.grade}</td><td>{item.band}</td><td>{item.status}</td></tr>)}</tbody></table>{visibleAssessments.length === 0 && <p className="empty">Belum ada pentaksiran untuk sekolah ini.</p>}</div><div className="khalifah-detail-panel"><h3>Skala rasmi IHAB</h3>{sahsiahIhabGradeScale.map((item) => <div className="grade-scale-row" key={item.grade}><span>Band {item.band} · {item.grade}</span><b>{item.range}</b><small>{item.achievement}</small></div>)}</div></div></section>
    </div>
  );
}
