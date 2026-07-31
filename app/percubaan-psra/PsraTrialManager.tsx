'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ClassRecord, School, SchoolModuleAccess, StudentRecord } from '@/lib/data';
import { PSRA_PAPERS, psraGrade, psraTotal, type PsraPaperKey, type PsraTrialRecord } from '@/lib/psra';
import { supabase } from '@/lib/supabase';
import { useAccessProfile } from '../ui/AuthGate';

type Props = {
  schools: School[];
  moduleAccesses: SchoolModuleAccess[];
  classes: ClassRecord[];
  students: StudentRecord[];
};

type ScoreDraft = Record<PsraPaperKey, string>;

const blankDraft = (): ScoreDraft => ({
  akhlak_sirah: '',
  bahasa_arab: '',
  jawi_imlak_khat: '',
  tauhid_fekah: '',
  tajwid: '',
});

function isActive(status: string | null | undefined) {
  return (status ?? '').toUpperCase() === 'AKTIF';
}

function scoreDraft(record: PsraTrialRecord | null): ScoreDraft {
  if (!record) return blankDraft();
  return Object.fromEntries(
    PSRA_PAPERS.map((paper) => [paper.key, String(record[paper.key])]),
  ) as ScoreDraft;
}

function scoreNumber(value: string) {
  const number = Number(value.replace(',', '.'));
  return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : 0;
}

function displayNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
}

export default function PsraTrialManager({ schools, moduleAccesses, classes, students }: Props) {
  const profile = useAccessProfile();
  const currentYear = new Date().getFullYear();
  const selectableSchools = useMemo(() => {
    if (profile?.role === 'OWNER') {
      return schools.filter((school) => isActive(school.status));
    }
    return schools.filter((school) => school.kod_sekolah === profile?.kod_sekolah);
  }, [profile?.kod_sekolah, profile?.role, schools]);

  const years = useMemo(() => {
    const available = new Set<number>([currentYear]);
    classes.forEach((classRecord) => available.add(Number(classRecord.tahun_akademik)));
    return [...available].sort((a, b) => b - a);
  }, [classes, currentYear]);

  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [session, setSession] = useState<1 | 2>(1);
  const [records, setRecords] = useState<PsraTrialRecord[]>([]);
  const [draft, setDraft] = useState<ScoreDraft>(blankDraft);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!selectableSchools.some((school) => school.kod_sekolah === selectedSchool)) {
      setSelectedSchool(selectableSchools[0]?.kod_sekolah ?? '');
    }
  }, [selectableSchools, selectedSchool]);

  const hasModuleAccess =
    profile?.role === 'OWNER' ||
    moduleAccesses.some(
      (access) =>
        access.kod_sekolah === selectedSchool &&
        access.module_key === 'PERCUBAAN_PSRA' &&
        access.enabled,
    );

  const yearSixClasses = useMemo(
    () =>
      classes
        .filter(
          (classRecord) =>
            classRecord.kod_sekolah === selectedSchool &&
            Number(classRecord.tahun_akademik) === selectedYear &&
            Number(classRecord.tahun) === 6 &&
            isActive(classRecord.status),
        )
        .sort((a, b) => a.nama_kelas.localeCompare(b.nama_kelas)),
    [classes, selectedSchool, selectedYear],
  );

  useEffect(() => {
    if (!yearSixClasses.some((classRecord) => classRecord.id === selectedClassId)) {
      setSelectedClassId(yearSixClasses[0]?.id ?? '');
    }
  }, [selectedClassId, yearSixClasses]);

  const studentsInClass = useMemo(
    () =>
      students
        .filter(
          (student) =>
            student.kod_sekolah === selectedSchool &&
            student.class_id === selectedClassId &&
            isActive(student.status),
        )
        .sort((a, b) => a.nama_murid.localeCompare(b.nama_murid)),
    [selectedClassId, selectedSchool, students],
  );

  useEffect(() => {
    if (!studentsInClass.some((student) => student.id === selectedStudentId)) {
      setSelectedStudentId(studentsInClass[0]?.id ?? '');
    }
  }, [selectedStudentId, studentsInClass]);

  useEffect(() => {
    let cancelled = false;

    async function loadRecords() {
      setRecords([]);
      if (!supabase || !hasModuleAccess || !selectedSchool || !selectedClassId) return;
      const { data, error } = await supabase
        .from('psra_trial_marks')
        .select('*')
        .eq('kod_sekolah', selectedSchool)
        .eq('tahun_akademik', selectedYear)
        .eq('class_id', selectedClassId)
        .eq('sesi', session)
        .order('updated_at', { ascending: false });

      if (cancelled) return;
      if (error) {
        setMessage(
          error.message.includes('psra_trial_marks')
            ? 'Jadual PSRA belum tersedia. Jalankan SQL 040_percubaan_psra.sql di Supabase.'
            : `Gagal memuatkan markah: ${error.message}`,
        );
        return;
      }
      setRecords((data ?? []) as PsraTrialRecord[]);
    }

    void loadRecords();
    return () => {
      cancelled = true;
    };
  }, [hasModuleAccess, selectedClassId, selectedSchool, selectedYear, session]);

  const recordByStudent = useMemo(
    () => new Map(records.map((record) => [record.student_id, record])),
    [records],
  );
  const selectedRecord = recordByStudent.get(selectedStudentId) ?? null;

  useEffect(() => {
    setDraft(scoreDraft(selectedRecord));
  }, [selectedRecord, selectedStudentId, session]);

  const numericScores = useMemo(
    () =>
      Object.fromEntries(
        PSRA_PAPERS.map((paper) => [paper.key, scoreNumber(draft[paper.key])]),
      ) as Record<PsraPaperKey, number>,
    [draft],
  );
  const total = psraTotal(numericScores);
  const percentage = total / 5;
  const completed = records.length;
  const average = completed
    ? records.reduce((sum, record) => sum + Number(record.peratus), 0) / completed
    : 0;
  const mumtaz = records.filter((record) => record.gred === 'Mumtaz').length;

  async function saveMarks() {
    if (!supabase || !selectedStudentId || !selectedClassId || !selectedSchool) return;
    if (PSRA_PAPERS.some((paper) => draft[paper.key].trim() === '')) {
      setMessage('Lengkapkan markah bagi semua lima kertas ujian.');
      return;
    }

    setPending(true);
    setMessage('');
    const payload = {
      kod_sekolah: selectedSchool,
      tahun_akademik: selectedYear,
      class_id: selectedClassId,
      student_id: selectedStudentId,
      sesi: session,
      ...numericScores,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('psra_trial_marks')
      .upsert(payload, { onConflict: 'tahun_akademik,student_id,sesi' })
      .select('*')
      .single();

    if (error) {
      setMessage(`Gagal menyimpan markah: ${error.message}`);
    } else {
      const saved = data as PsraTrialRecord;
      setRecords((current) => [saved, ...current.filter((record) => record.student_id !== saved.student_id)]);
      setMessage('Markah Percubaan PSRA berjaya disimpan.');
    }
    setPending(false);
  }

  if (!selectableSchools.length) {
    return <section className="panel"><p className="empty">Tiada sekolah yang boleh diakses oleh akaun ini.</p></section>;
  }

  return (
    <div className="psra-shell">
      <section className="psra-hero">
        <div>
          <span className="psra-kicker">PENILAIAN SEKOLAH RENDAH AGAMA</span>
          <h2>Percubaan PSRA Tahun 6</h2>
          <p>Dua sesi peperiksaan, lima kertas ujian dan jumlah keseluruhan 500 markah.</p>
        </div>
        <div className="psra-session-tabs" role="tablist" aria-label="Pilih sesi Percubaan PSRA">
          {[1, 2].map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={session === item}
              className={session === item ? 'active' : ''}
              onClick={() => setSession(item as 1 | 2)}
            >
              <span>0{item}</span>
              Percubaan PSRA {item}
            </button>
          ))}
        </div>
      </section>

      <section className="psra-filter-bar">
        <label>
          Sekolah
          <select value={selectedSchool} onChange={(event) => setSelectedSchool(event.target.value)}>
            {selectableSchools.map((school) => (
              <option value={school.kod_sekolah} key={school.kod_sekolah}>
                {school.kod_sekolah} - {school.nama_sekolah}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tahun Akademik
          <select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
            {years.map((year) => <option value={year} key={year}>{year}</option>)}
          </select>
        </label>
        <label>
          Kelas Tahun 6
          <select value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)}>
            {yearSixClasses.map((classRecord) => (
              <option value={classRecord.id} key={classRecord.id}>{classRecord.nama_kelas}</option>
            ))}
          </select>
        </label>
      </section>

      {!hasModuleAccess ? (
        <section className="panel psra-locked">
          <strong>Akses Percubaan PSRA belum diluluskan</strong>
          <p>Sekolah ini perlu diaktifkan melalui Tetapan → Akses Modul Sekolah.</p>
        </section>
      ) : yearSixClasses.length === 0 ? (
        <section className="panel"><p className="empty">Tiada kelas Tahun 6 yang aktif bagi tahun akademik ini.</p></section>
      ) : (
        <>
          <section className="psra-summary-grid">
            <div><span>Calon Tahun 6</span><strong>{studentsInClass.length}</strong><small>murid berdaftar</small></div>
            <div><span>Markah Lengkap</span><strong>{completed}</strong><small>daripada {studentsInClass.length} calon</small></div>
            <div><span>Purata Kelas</span><strong>{average.toFixed(1)}%</strong><small>{psraGrade(average)}</small></div>
            <div><span>Pencapaian Mumtaz</span><strong>{mumtaz}</strong><small>90% dan ke atas</small></div>
          </section>

          {message && <p className={message.includes('berjaya') ? 'form-success psra-message' : 'form-message psra-message'}>{message}</p>}

          <section className="psra-layout">
            <div className="panel psra-student-panel">
              <div className="panel-head">
                <h2>Senarai Calon</h2>
                <span>{studentsInClass.length} murid</span>
              </div>
              <div className="psra-student-list">
                {studentsInClass.map((student, index) => {
                  const record = recordByStudent.get(student.id);
                  return (
                    <button
                      type="button"
                      key={student.id}
                      className={selectedStudentId === student.id ? 'active' : ''}
                      onClick={() => setSelectedStudentId(student.id)}
                    >
                      <span className="psra-student-number">{index + 1}</span>
                      <span><strong>{student.nama_murid}</strong><small>{student.mykid}</small></span>
                      <span className="psra-student-score">
                        <strong>{record ? `${displayNumber(record.jumlah)}/500` : 'Belum diisi'}</strong>
                        <small>{record?.gred ?? '-'}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="panel psra-entry-panel">
              <div className="psra-entry-head">
                <div>
                  <span>Percubaan PSRA {session}</span>
                  <h3>{studentsInClass.find((student) => student.id === selectedStudentId)?.nama_murid ?? 'Pilih murid'}</h3>
                </div>
                <div><strong>{displayNumber(total)} / 500</strong><span>{percentage.toFixed(1)}% · {psraGrade(percentage)}</span></div>
              </div>
              <div className="psra-paper-grid">
                {PSRA_PAPERS.map((paper, index) => (
                  <label key={paper.key}>
                    <span><b>0{index + 1}</b>{paper.label}</span>
                    <div>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        inputMode="decimal"
                        value={draft[paper.key]}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, [paper.key]: event.target.value }))
                        }
                        onBlur={(event) => {
                          if (!event.target.value.trim()) return;
                          setDraft((current) => ({
                            ...current,
                            [paper.key]: displayNumber(scoreNumber(event.target.value)),
                          }));
                        }}
                      />
                      <span>/ 100</span>
                    </div>
                  </label>
                ))}
              </div>
              <div className="psra-entry-footer">
                <div><span>Jumlah</span><strong>{displayNumber(total)}<small>/500</small></strong></div>
                <div><span>Gred</span><strong>{psraGrade(percentage)}</strong></div>
                <button
                  className="button"
                  type="button"
                  disabled={pending || !selectedStudentId}
                  onClick={() => void saveMarks()}
                >
                  {pending ? 'Menyimpan…' : 'Simpan Markah'}
                </button>
              </div>
            </div>
          </section>

          <section className="panel psra-grade-panel">
            <div className="panel-head"><h2>Skala Gred PSRA</h2><span>Sama seperti UPSA dan UASA</span></div>
            <div className="psra-grade-grid">
              {[
                ['90–100', 'Mumtaz', 'Cemerlang Tertinggi'],
                ['75–89', 'Jayyid Jiddan', 'Sangat Baik'],
                ['60–74', 'Jayyid', 'Baik'],
                ['40–59', 'Maqbul', 'Lulus'],
                ['0–39', 'Musaadah', 'Intervensi'],
              ].map(([range, grade, label]) => (
                <div key={grade}><span>{range}</span><strong>{grade}</strong><small>{label}</small></div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
