'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ClassRecord,
  School,
  SchoolModuleAccess,
  StudentRecord,
  TeacherClassAssignment,
  TeacherSubjectAssignment,
} from '@/lib/data';
import {
  PSRA_PAPERS,
  psraGrade,
  type PsraPaperKey,
  type PsraPaperMarkRecord,
} from '@/lib/psra';
import { supabase } from '@/lib/supabase';
import { useAccessProfile } from '../ui/AuthGate';

type Props = {
  schools: School[];
  moduleAccesses: SchoolModuleAccess[];
  classes: ClassRecord[];
  students: StudentRecord[];
  classAssignments: TeacherClassAssignment[];
  subjectAssignments: TeacherSubjectAssignment[];
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

function scoreNumber(value: string) {
  const number = Number(value.replace(',', '.'));
  return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : 0;
}

function displayNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
}

export default function PsraTrialManager({
  schools,
  moduleAccesses,
  classes,
  students,
  classAssignments,
  subjectAssignments,
}: Props) {
  const profile = useAccessProfile();
  const currentYear = new Date().getFullYear();
  const canManageAll = profile?.role === 'OWNER' || profile?.role === 'ADMIN_SEKOLAH';
  const assignedClassIds = useMemo(
    () => new Set(classAssignments.filter((item) => item.user_id === profile?.id).map((item) => item.class_id)),
    [classAssignments, profile?.id],
  );
  const assignedSubjectsByClass = useMemo(() => {
    const map = new Map<string, Set<string>>();
    subjectAssignments
      .filter((item) => item.user_id === profile?.id)
      .forEach((item) => {
        const codes = map.get(item.class_id) ?? new Set<string>();
        codes.add(item.kod_subjek);
        map.set(item.class_id, codes);
      });
    return map;
  }, [profile?.id, subjectAssignments]);
  const assignedSubjectClassIds = useMemo(
    () => new Set([...assignedSubjectsByClass.keys()]),
    [assignedSubjectsByClass],
  );

  const selectableSchools = useMemo(() => {
    if (profile?.role === 'OWNER') return schools.filter((school) => isActive(school.status));
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
  const [records, setRecords] = useState<PsraPaperMarkRecord[]>([]);
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
            isActive(classRecord.status) &&
            (canManageAll || assignedClassIds.has(classRecord.id) || assignedSubjectClassIds.has(classRecord.id)),
        )
        .sort((a, b) => a.nama_kelas.localeCompare(b.nama_kelas)),
    [
      assignedClassIds,
      assignedSubjectClassIds,
      canManageAll,
      classes,
      selectedSchool,
      selectedYear,
    ],
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

  const loadRecords = useCallback(async () => {
    setRecords([]);
    if (!supabase || !hasModuleAccess || !selectedSchool || !selectedClassId) return;
    const { data, error } = await supabase
      .from('psra_trial_paper_marks')
      .select('*')
      .eq('kod_sekolah', selectedSchool)
      .eq('tahun_akademik', selectedYear)
      .eq('class_id', selectedClassId)
      .eq('sesi', session)
      .order('updated_at', { ascending: false });

    if (error) {
      setMessage(
        error.message.includes('psra_trial_paper_marks')
          ? 'Struktur tugasan guru PSRA belum tersedia. Jalankan SQL 041_psra_teacher_entry.sql di Supabase.'
          : `Gagal memuatkan markah: ${error.message}`,
      );
      return;
    }
    setRecords((data ?? []) as PsraPaperMarkRecord[]);
  }, [hasModuleAccess, selectedClassId, selectedSchool, selectedYear, session]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const paperRecordMap = useMemo(
    () => new Map(records.map((record) => [`${record.student_id}|${record.paper_code}`, record])),
    [records],
  );
  const selectedSubjectCodes = assignedSubjectsByClass.get(selectedClassId) ?? new Set<string>();
  const isClassTeacher = assignedClassIds.has(selectedClassId);
  const editablePapers = useMemo(
    () =>
      PSRA_PAPERS.filter(
        (paper) => canManageAll || isClassTeacher || selectedSubjectCodes.has(paper.subjectCode),
      ),
    [canManageAll, isClassTeacher, selectedSubjectCodes],
  );
  const editablePaperCodes = useMemo(
    () => new Set(editablePapers.map((paper) => paper.subjectCode)),
    [editablePapers],
  );

  useEffect(() => {
    setDraft(
      Object.fromEntries(
        PSRA_PAPERS.map((paper) => {
          const record = paperRecordMap.get(`${selectedStudentId}|${paper.subjectCode}`);
          return [paper.key, record ? displayNumber(Number(record.markah)) : ''];
        }),
      ) as ScoreDraft,
    );
  }, [paperRecordMap, selectedStudentId, session]);

  const selectedPaperRecords = PSRA_PAPERS.map((paper) =>
    paperRecordMap.get(`${selectedStudentId}|${paper.subjectCode}`),
  ).filter(Boolean) as PsraPaperMarkRecord[];
  const selectedTotal = PSRA_PAPERS.reduce((sum, paper) => {
    const existing = paperRecordMap.get(`${selectedStudentId}|${paper.subjectCode}`);
    const value = editablePaperCodes.has(paper.subjectCode) ? draft[paper.key] : existing?.markah;
    return sum + (value === '' || value === undefined ? 0 : scoreNumber(String(value)));
  }, 0);
  const selectedComplete = selectedPaperRecords.length === PSRA_PAPERS.length;
  const selectedPercentage = selectedTotal / PSRA_PAPERS.length;

  const studentSummaries = useMemo(
    () =>
      studentsInClass.map((student) => {
        const marks = PSRA_PAPERS.map((paper) =>
          paperRecordMap.get(`${student.id}|${paper.subjectCode}`),
        ).filter(Boolean) as PsraPaperMarkRecord[];
        const total = marks.reduce((sum, mark) => sum + Number(mark.markah), 0);
        return {
          student,
          count: marks.length,
          total,
          percentage: total / PSRA_PAPERS.length,
          complete: marks.length === PSRA_PAPERS.length,
        };
      }),
    [paperRecordMap, studentsInClass],
  );
  const completedStudents = studentSummaries.filter((item) => item.complete);
  const average = completedStudents.length
    ? completedStudents.reduce((sum, item) => sum + item.percentage, 0) / completedStudents.length
    : 0;
  const mumtaz = completedStudents.filter((item) => item.percentage >= 90).length;

  async function saveMarks() {
    if (!supabase || !selectedStudentId || !selectedClassId || !selectedSchool) return;
    const client = supabase;
    if (!editablePapers.length) {
      setMessage('Akaun ini belum ditugaskan sebagai guru kelas atau guru subjek bagi kelas ini.');
      return;
    }
    if (editablePapers.some((paper) => draft[paper.key].trim() === '')) {
      setMessage('Lengkapkan markah bagi semua kertas yang ditugaskan kepada anda.');
      return;
    }

    setPending(true);
    setMessage('');
    const results = await Promise.all(
      editablePapers.map(async (paper) => {
        const existing = paperRecordMap.get(`${selectedStudentId}|${paper.subjectCode}`);
        if (existing) {
          return await client
            .from('psra_trial_paper_marks')
            .update({ markah: scoreNumber(draft[paper.key]), updated_at: new Date().toISOString() })
            .eq('id', existing.id);
        }
        return await client.from('psra_trial_paper_marks').insert({
          kod_sekolah: selectedSchool,
          tahun_akademik: selectedYear,
          class_id: selectedClassId,
          student_id: selectedStudentId,
          sesi: session,
          paper_code: paper.subjectCode,
          markah: scoreNumber(draft[paper.key]),
        });
      }),
    );
    const error = results.find((result) => result.error)?.error;
    if (error) {
      setMessage(`Gagal menyimpan markah: ${error.message}`);
    } else {
      setMessage(`${editablePapers.length} kertas PSRA berjaya disimpan.`);
      await loadRecords();
    }
    setPending(false);
  }

  const permissionLabel = canManageAll
    ? 'Pentadbir sekolah · Semua kelas dan kertas'
    : isClassTeacher
      ? 'Guru kelas · Semua 5 kertas bagi kelas ini'
      : editablePapers.length
        ? `Guru subjek · ${editablePapers.map((paper) => paper.label).join(', ')}`
        : 'Tiada tugasan bagi kelas ini';

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
        <section className="panel psra-locked">
          <strong>Tiada kelas Tahun 6 dalam tugasan anda</strong>
          <p>Admin sekolah perlu menetapkan anda sebagai guru kelas atau guru subjek melalui menu Guru Kelas & Subjek.</p>
        </section>
      ) : (
        <>
           <div className="psra-permission-banner">
             <span aria-hidden="true">✓</span>
             <div><strong>Kebenaran kemasukan markah</strong><small>{permissionLabel}</small></div>
             <Link href="/percubaan-psra/laporan">Buka Laporan PSRA</Link>
           </div>

          <section className="psra-summary-grid">
            <div><span>Calon Tahun 6</span><strong>{studentsInClass.length}</strong><small>murid berdaftar</small></div>
            <div><span>Markah Lengkap</span><strong>{completedStudents.length}</strong><small>semua 5 kertas</small></div>
            <div><span>Purata Kelas</span><strong>{average.toFixed(1)}%</strong><small>{completedStudents.length ? psraGrade(average) : 'Belum lengkap'}</small></div>
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
                {studentSummaries.map(({ student, count, total, complete }, index) => (
                  <button
                    type="button"
                    key={student.id}
                    className={selectedStudentId === student.id ? 'active' : ''}
                    onClick={() => setSelectedStudentId(student.id)}
                  >
                    <span className="psra-student-number">{index + 1}</span>
                    <span><strong>{student.nama_murid}</strong><small>{student.mykid}</small></span>
                    <span className="psra-student-score">
                      <strong>{count ? `${displayNumber(total)}/500` : 'Belum diisi'}</strong>
                      <small>{complete ? psraGrade(total / 5) : `${count}/5 kertas`}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="panel psra-entry-panel">
              <div className="psra-entry-head">
                <div>
                  <span>Percubaan PSRA {session}</span>
                  <h3>{studentsInClass.find((student) => student.id === selectedStudentId)?.nama_murid ?? 'Pilih murid'}</h3>
                </div>
                <div>
                  <strong>{displayNumber(selectedTotal)} / 500</strong>
                  <span>{selectedComplete ? `${selectedPercentage.toFixed(1)}% · ${psraGrade(selectedPercentage)}` : `${selectedPaperRecords.length}/5 kertas lengkap`}</span>
                </div>
              </div>
              <div className="psra-paper-grid">
                {PSRA_PAPERS.map((paper, index) => {
                  const editable = editablePaperCodes.has(paper.subjectCode);
                  return (
                    <label className={editable ? '' : 'psra-paper-locked'} key={paper.key}>
                      <span><b>0{index + 1}</b>{paper.label}{!editable && <em>Guru lain</em>}</span>
                      <div>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          inputMode="decimal"
                          value={draft[paper.key]}
                          disabled={!editable}
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
                  );
                })}
              </div>
              <div className="psra-entry-footer">
                <div><span>Jumlah Semasa</span><strong>{displayNumber(selectedTotal)}<small>/500</small></strong></div>
                <div><span>Status</span><strong>{selectedComplete ? psraGrade(selectedPercentage) : `${selectedPaperRecords.length}/5 lengkap`}</strong></div>
                <button
                  className="button"
                  type="button"
                  disabled={pending || !selectedStudentId || editablePapers.length === 0}
                  onClick={() => void saveMarks()}
                >
                  {pending ? 'Menyimpan…' : `Simpan ${editablePapers.length} Kertas`}
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
