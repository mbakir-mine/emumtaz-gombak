'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ClassRecord, ExamRecord, MarkRecord, School, SchoolModuleAccess, StudentRecord } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { DEFAULT_UPKK_GRADES, UPKK_WRITTEN_PAPERS, upkkGrade, type UpkkGradeSettings, type UpkkWrittenMark, type UpkkWrittenPaperKey } from '@/lib/upkkTrial';
import { useAccessProfile } from '../ui/AuthGate';

type Props = { schools: School[]; moduleAccesses: SchoolModuleAccess[]; classes: ClassRecord[]; students: StudentRecord[]; exams: ExamRecord[] };
type LoadedUpkkMark = UpkkWrittenMark & { source: 'upkk_trial_paper_marks' | 'marks' };
type Draft = Record<UpkkWrittenPaperKey, string>;
const blankDraft = () => Object.fromEntries(UPKK_WRITTEN_PAPERS.map((paper) => [paper.key, ''])) as Draft;
const active = (status: string | null | undefined) => (status ?? '').toUpperCase() === 'AKTIF';
const whole = (value: string) => /^\d+$/.test(value) && Number(value) >= 0 && Number(value) <= 100;

export default function UpkkTrialManager({ schools, moduleAccesses, classes, students, exams }: Props) {
  const profile = useAccessProfile();
  const year = new Date().getFullYear();
  const canSelectSchool = profile?.role === 'OWNER' || profile?.role === 'ADMIN_DAERAH';
  const selectableSchools = useMemo(() => canSelectSchool ? schools.filter((school) => active(school.status)) : schools.filter((school) => school.kod_sekolah === profile?.kod_sekolah), [canSelectSchool, profile?.kod_sekolah, schools]);
  const [schoolCode, setSchoolCode] = useState('');
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [session, setSession] = useState<1 | 2>(1);
  const [records, setRecords] = useState<LoadedUpkkMark[]>([]);
  const [grades, setGrades] = useState<UpkkGradeSettings>({ kod_sekolah: '', ...DEFAULT_UPKK_GRADES });
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => { if (!selectableSchools.some((school) => school.kod_sekolah === schoolCode)) setSchoolCode(selectableSchools[0]?.kod_sekolah ?? ''); }, [schoolCode, selectableSchools]);
  const hasAccess = profile?.role === 'OWNER' || moduleAccesses.some((item) => item.kod_sekolah === schoolCode && item.module_key === 'PERCUBAAN_UPKK' && item.enabled);
  const yearFiveClasses = useMemo(() => classes.filter((item) => item.kod_sekolah === schoolCode && Number(item.tahun_akademik) === year && Number(item.tahun) === 5 && active(item.status)).sort((a, b) => a.nama_kelas.localeCompare(b.nama_kelas)), [classes, schoolCode, year]);
  useEffect(() => { if (!yearFiveClasses.some((item) => item.id === classId)) setClassId(yearFiveClasses[0]?.id ?? ''); }, [classId, yearFiveClasses]);
  const candidates = useMemo(() => students.filter((item) => item.kod_sekolah === schoolCode && item.class_id === classId && active(item.status)).sort((a, b) => a.nama_murid.localeCompare(b.nama_murid)), [classId, schoolCode, students]);
  useEffect(() => { if (!candidates.some((item) => item.id === studentId)) setStudentId(candidates[0]?.id ?? ''); }, [candidates, studentId]);

  const load = useCallback(async () => {
    setRecords([]);
    if (!supabase || !hasAccess || !schoolCode || !classId) return;
    const exam = exams.find(
      (item) =>
        Number(item.tahun_akademik) === year &&
        item.kod_peperiksaan.toUpperCase().replace(/[^A-Z0-9]/g, '') === `UPKK${session}`,
    );
    const [trialResult, standardResult, gradesResult] = await Promise.all([
      supabase.from('upkk_trial_paper_marks').select('*').eq('kod_sekolah', schoolCode).eq('tahun_akademik', year).eq('class_id', classId).eq('sesi', session),
      exam
        ? supabase
            .from('marks')
            .select('id,exam_id,student_id,kod_sekolah,class_id,kod_subjek,markah')
            .eq('exam_id', exam.id)
            .eq('kod_sekolah', schoolCode)
            .eq('class_id', classId)
        : Promise.resolve({ data: [] as MarkRecord[], error: null }),
      supabase.from('upkk_trial_grade_settings').select('*').eq('kod_sekolah', schoolCode).maybeSingle(),
    ]);
    if (trialResult.error && standardResult.error) {
      setMessage(`Gagal memuatkan markah UPKK: ${trialResult.error.message}`);
    } else {
      const dedicated = ((trialResult.data ?? []) as UpkkWrittenMark[]).map((record) => ({
        ...record,
        source: 'upkk_trial_paper_marks' as const,
      }));
      const paperBySubject = new Map(UPKK_WRITTEN_PAPERS.map((paper) => [paper.subjectCode as string, paper.paperCode]));
      const standard = ((standardResult.data ?? []) as MarkRecord[])
        .filter((record) => record.markah !== null && paperBySubject.has(record.kod_subjek))
        .map((record) => ({
          id: record.id,
          kod_sekolah: record.kod_sekolah,
          tahun_akademik: year,
          class_id: record.class_id,
          student_id: record.student_id,
          sesi: session,
          paper_code: paperBySubject.get(record.kod_subjek)!,
          markah: Number(record.markah),
          updated_at: '',
          source: 'marks' as const,
        }));
      // Markah daripada menu Pemarkahan mengatasi rekod khusus jika kedua-duanya wujud.
      const merged = new Map<string, LoadedUpkkMark>();
      [...dedicated, ...standard].forEach((record) => {
        merged.set(`${record.student_id}|${record.paper_code}`, record);
      });
      setRecords([...merged.values()]);
    }
    if (gradesResult.data) setGrades(gradesResult.data as UpkkGradeSettings);
    else setGrades({ kod_sekolah: schoolCode, ...DEFAULT_UPKK_GRADES });
  }, [classId, exams, hasAccess, schoolCode, session, year]);
  useEffect(() => { void load(); }, [load]);

  const recordMap = useMemo(() => new Map(records.map((item) => [`${item.student_id}|${item.paper_code}`, item])), [records]);
  useEffect(() => { setDraft(Object.fromEntries(UPKK_WRITTEN_PAPERS.map((paper) => [paper.key, String(recordMap.get(`${studentId}|${paper.paperCode}`)?.markah ?? '')])) as Draft); }, [recordMap, studentId]);
  const summaries = candidates.map((student) => {
    const marks = UPKK_WRITTEN_PAPERS.map((paper) => recordMap.get(`${student.id}|${paper.paperCode}`)).filter(Boolean) as UpkkWrittenMark[];
    const total = marks.reduce((sum, item) => sum + Number(item.markah), 0);
    return { student, count: marks.length, total, average: total / 6, complete: marks.length === 6 };
  });
  const completed = summaries.filter((item) => item.complete);
  const selectedTotal = UPKK_WRITTEN_PAPERS.reduce((sum, paper) => sum + (draft[paper.key] === '' ? 0 : Number(draft[paper.key])), 0);

  async function saveMarks() {
    if (!supabase || !schoolCode || !classId || !studentId) return;
    const client = supabase;
    const papers = UPKK_WRITTEN_PAPERS.filter((paper) => draft[paper.key] !== '');
    const invalid = papers.find((paper) => !whole(draft[paper.key]));
    if (!papers.length || invalid) return setMessage(invalid ? `Markah ${invalid.label} mesti nombor bulat 0 hingga 100.` : 'Masukkan sekurang-kurangnya satu markah.');
    setPending(true); setMessage('');
    const results = await Promise.all(papers.map((paper) => {
      const existing = recordMap.get(`${studentId}|${paper.paperCode}`);
      if (existing?.source === 'marks') {
        return client.from('marks').update({ markah: Number(draft[paper.key]) }).eq('id', existing.id);
      }
      return client.from('upkk_trial_paper_marks').upsert({
        kod_sekolah: schoolCode,
        tahun_akademik: year,
        class_id: classId,
        student_id: studentId,
        sesi: session,
        paper_code: paper.paperCode,
        markah: Number(draft[paper.key]),
      }, { onConflict: 'tahun_akademik,student_id,sesi,paper_code' });
    }));
    const error = results.find((result) => result.error)?.error;
    setMessage(error ? `Gagal menyimpan markah: ${error.message}` : `${papers.length} markah Percubaan UPKK ${session} berjaya disimpan.`);
    if (!error) await load();
    setPending(false);
  }

  async function saveGrades() {
    if (!supabase || !schoolCode) return;
    if (!(grades.grade_a_min > grades.grade_b_min && grades.grade_b_min > grades.grade_c_min && grades.grade_c_min > 0 && grades.grade_a_min <= 100)) return setMessage('Julat gred mesti tersusun A, B, C dan D tanpa pertindihan.');
    setPending(true);
    const { error } = await supabase.from('upkk_trial_grade_settings').upsert({ ...grades, kod_sekolah: schoolCode }, { onConflict: 'kod_sekolah' });
    setMessage(error ? `Gagal menyimpan gred: ${error.message}` : 'Tetapan gred sekolah berjaya disimpan.'); setPending(false);
  }

  if (!selectableSchools.length) return <section className="panel"><p className="empty">Tiada sekolah yang boleh diakses oleh akaun ini.</p></section>;
  return <div className="psra-shell upkk-trial-shell">
    <nav className="psra-session-tabs" role="tablist" aria-label="Pilih sesi Percubaan UPKK">
      {[1, 2].map((item) => <button key={item} type="button" role="tab" aria-selected={session === item} className={session === item ? 'active' : ''} onClick={() => { setSession(item as 1 | 2); setMessage(''); }}>Percubaan UPKK {item}</button>)}
    </nav>
    <section className="psra-filter-bar">{canSelectSchool ? <label>Sekolah<select value={schoolCode} onChange={(event) => setSchoolCode(event.target.value)}>{selectableSchools.map((school) => <option key={school.kod_sekolah} value={school.kod_sekolah}>{school.kod_sekolah} - {school.nama_sekolah}</option>)}</select></label> : <div className="psra-school-display"><span>Sekolah</span><strong>{selectableSchools[0]?.nama_sekolah}</strong></div>}<label>Tahun Akademik<input value={year} readOnly /></label><label>Kelas Tahun 5<select value={classId} onChange={(event) => setClassId(event.target.value)}>{yearFiveClasses.map((item) => <option key={item.id} value={item.id}>{item.nama_kelas}</option>)}</select></label></section>
    {!hasAccess ? <section className="panel psra-locked"><strong>Akses Percubaan UPKK belum diluluskan</strong><p>Aktifkan melalui Tetapan → Akses Modul Sekolah.</p></section> : !yearFiveClasses.length ? <section className="panel psra-locked"><strong>Tiada kelas Tahun 5 aktif</strong></section> : <>
      <section className="psra-summary-grid"><div><span>Calon Tahun 5</span><strong>{candidates.length}</strong><small>murid berdaftar</small></div><div><span>Markah Lengkap</span><strong>{completed.length}</strong><small>semua 6 subjek</small></div><div><span>Purata Kelas</span><strong>{completed.length ? `${(completed.reduce((s, i) => s + i.average, 0) / completed.length).toFixed(1)}%` : '—'}</strong></div><div><span>Pencapaian A</span><strong>{completed.filter((item) => item.average >= grades.grade_a_min).length}</strong><small>{grades.grade_a_min}% dan ke atas</small></div></section>
      {message && <p className={message.includes('berjaya') ? 'form-success psra-message' : 'form-message psra-message'}>{message}</p>}
      <section className="psra-layout"><div className="panel psra-student-panel"><div className="panel-head"><h2>Calon Tahun 5</h2><span>{candidates.length} murid</span></div><div className="psra-student-list">{summaries.map(({ student, count, total, complete }, index) => <button type="button" key={student.id} className={studentId === student.id ? 'active' : ''} onClick={() => setStudentId(student.id)}><span className="psra-student-number">{index + 1}</span><span><strong>{student.nama_murid}</strong><small>{student.mykid}</small></span><span className="psra-student-score"><strong>{count ? `${total}/600` : 'Belum diisi'}</strong><small>{complete ? `Gred ${upkkGrade(total / 6, grades)}` : `${count}/6 subjek`}</small></span></button>)}</div></div>
      <div className="panel psra-entry-panel"><div className="psra-entry-head"><div><span>Percubaan UPKK {session}</span><h3>{candidates.find((item) => item.id === studentId)?.nama_murid ?? 'Pilih murid'}</h3></div><div><strong>{selectedTotal} / 600</strong><span>{UPKK_WRITTEN_PAPERS.every((paper) => draft[paper.key] !== '') ? `${(selectedTotal / 6).toFixed(1)}% · Gred ${upkkGrade(selectedTotal / 6, grades)}` : 'Lengkapkan 6 subjek'}</span></div></div><div className="psra-paper-grid upkk-paper-grid">{UPKK_WRITTEN_PAPERS.map((paper) => <label key={paper.key}><span><b>{paper.code.replace('UPKK ', '')}</b>{paper.label}</span><div><input type="number" min="0" max="100" step="1" value={draft[paper.key]} onChange={(event) => { if (event.target.value === '' || /^\d+$/.test(event.target.value)) setDraft((current) => ({ ...current, [paper.key]: event.target.value })); }} /><span>/ 100</span></div></label>)}</div><div className="psra-entry-footer"><div><span>Jumlah Semasa</span><strong>{selectedTotal}<small>/600</small></strong></div><button className="button" type="button" disabled={pending || !studentId} onClick={() => void saveMarks()}>{pending ? 'Menyimpan…' : `Simpan Markah UPKK ${session}`}</button></div></div></section>
      <section className="panel psra-grade-panel"><div className="panel-head"><h2>Tetapan Gred Sekolah</h2><span>Julat khusus {schoolCode}</span></div><div className="upkk-grade-settings">{(['a','b','c'] as const).map((key) => <label key={key}>Minimum Gred {key.toUpperCase()}<input type="number" min="1" max="100" value={grades[`grade_${key}_min`]} onChange={(event) => setGrades((current) => ({ ...current, [`grade_${key}_min`]: Number(event.target.value) }))} /></label>)}<label>Minimum Gred D<input value="0" disabled /></label><button className="button" type="button" disabled={pending} onClick={() => void saveGrades()}>Simpan Tetapan Gred</button></div><div className="psra-grade-grid">{[['A',`${grades.grade_a_min}–100`],['B',`${grades.grade_b_min}–${grades.grade_a_min-1}`],['C',`${grades.grade_c_min}–${grades.grade_b_min-1}`],['D',`0–${grades.grade_c_min-1}`]].map(([grade, range]) => <div key={grade}><span>{range}</span><strong>Gred {grade}</strong></div>)}</div></section>
    </>}
  </div>;
}
