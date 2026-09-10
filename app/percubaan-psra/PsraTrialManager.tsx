'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ClassRecord,
  ExamRecord,
  MarkRecord,
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
import { cleanMykid } from '@/lib/mykid';
import { supabase } from '@/lib/supabase';
import { useAccessProfile } from '../ui/AuthGate';

type Props = {
  schools: School[];
  moduleAccesses: SchoolModuleAccess[];
  classes: ClassRecord[];
  students: StudentRecord[];
  classAssignments: TeacherClassAssignment[];
  subjectAssignments: TeacherSubjectAssignment[];
  exams: ExamRecord[];
};

type LoadedPsraMark = PsraPaperMarkRecord & {
  source: 'psra_trial_paper_marks' | 'marks';
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
  return Number.isInteger(number) ? Math.max(0, Math.min(100, number)) : 0;
}

function isWholeScore(value: string) {
  const number = Number(value.replace(',', '.'));
  return Number.isInteger(number) && number >= 0 && number <= 100;
}

function isWholeInput(value: string) {
  return value === '' || /^\d+$/.test(value);
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
  exams,
}: Props) {
  const profile = useAccessProfile();
  const currentYear = new Date().getFullYear();
  const canSelectSchool = profile?.role === 'OWNER' || profile?.role === 'ADMIN_DAERAH';
  const canManageAll = canSelectSchool || profile?.role === 'ADMIN_SEKOLAH';
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
    if (canSelectSchool) return schools.filter((school) => isActive(school.status));
    return schools.filter((school) => school.kod_sekolah === profile?.kod_sekolah);
  }, [canSelectSchool, profile?.kod_sekolah, schools]);

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
  const [records, setRecords] = useState<LoadedPsraMark[]>([]);
  const [draft, setDraft] = useState<ScoreDraft>(blankDraft);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [restoredFromUrl, setRestoredFromUrl] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSchool = params.get('sekolah');
    const urlYear = Number(params.get('tahun'));
    const urlSession = Number(params.get('sesi'));
    setSelectedSchool(urlSchool && selectableSchools.some((school) => school.kod_sekolah === urlSchool)
      ? urlSchool
      : selectableSchools[0]?.kod_sekolah ?? '');
    setSelectedYear(years.includes(urlYear) ? urlYear : currentYear);
    setSelectedClassId(params.get('kelas') ?? '');
    setSelectedStudentId(params.get('murid') ?? '');
    setSession(urlSession === 2 ? 2 : 1);
    setRestoredFromUrl(true);
  }, [currentYear, selectableSchools, years]);

  useEffect(() => {
    if (!restoredFromUrl) return;
    const params = new URLSearchParams();
    if (selectedSchool) params.set('sekolah', selectedSchool);
    params.set('tahun', String(selectedYear));
    if (selectedClassId) params.set('kelas', selectedClassId);
    if (selectedStudentId) params.set('murid', selectedStudentId);
    params.set('sesi', String(session));
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, [restoredFromUrl, selectedClassId, selectedSchool, selectedStudentId, selectedYear, session]);

  useEffect(() => {
    if (!restoredFromUrl) return;
    if (!selectableSchools.some((school) => school.kod_sekolah === selectedSchool)) {
      setSelectedSchool(selectableSchools[0]?.kod_sekolah ?? '');
    }
  }, [restoredFromUrl, selectableSchools, selectedSchool]);

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
    if (!restoredFromUrl) return;
    if (!yearSixClasses.some((classRecord) => classRecord.id === selectedClassId)) {
      setSelectedClassId(yearSixClasses[0]?.id ?? '');
    }
  }, [restoredFromUrl, selectedClassId, yearSixClasses]);

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
    if (!restoredFromUrl) return;
    if (!studentsInClass.some((student) => student.id === selectedStudentId)) {
      setSelectedStudentId(studentsInClass[0]?.id ?? '');
    }
  }, [restoredFromUrl, selectedStudentId, studentsInClass]);

  const loadRecords = useCallback(async () => {
    setRecords([]);
    if (!supabase || !hasModuleAccess || !selectedSchool || !selectedClassId) return;
    const exam = exams.find(
      (item) =>
        Number(item.tahun_akademik) === selectedYear &&
        item.kod_peperiksaan.toUpperCase().replace(/[^A-Z0-9]/g, '') === `PSRA${session}`,
    );
    const [paperResult, standardResult] = await Promise.all([
      supabase
        .from('psra_trial_paper_marks')
        .select('*')
        .eq('kod_sekolah', selectedSchool)
        .eq('tahun_akademik', selectedYear)
        .eq('class_id', selectedClassId)
        .eq('sesi', session)
        .order('updated_at', { ascending: false }),
      exam
        ? supabase
            .from('marks')
            .select('id,exam_id,student_id,kod_sekolah,class_id,kod_subjek,markah')
            .eq('exam_id', exam.id)
            .eq('kod_sekolah', selectedSchool)
            .eq('class_id', selectedClassId)
        : Promise.resolve({ data: [] as MarkRecord[], error: null }),
    ]);

    if (paperResult.error && standardResult.error) {
      setMessage(
        paperResult.error.message.includes('psra_trial_paper_marks')
          ? 'Struktur tugasan guru PSRA belum tersedia. Jalankan SQL 041_psra_teacher_entry.sql di Supabase.'
          : `Gagal memuatkan markah: ${paperResult.error.message}`,
      );
      return;
    }
    const paperCodes = new Set(PSRA_PAPERS.map((paper) => paper.subjectCode as string));
    const dedicated = ((paperResult.data ?? []) as PsraPaperMarkRecord[]).map((record) => ({
      ...record,
      source: 'psra_trial_paper_marks' as const,
    }));
    const standard = ((standardResult.data ?? []) as MarkRecord[])
      .filter((record) => record.markah !== null && paperCodes.has(record.kod_subjek))
      .map((record) => ({
        id: record.id,
        kod_sekolah: record.kod_sekolah,
        tahun_akademik: selectedYear,
        class_id: record.class_id,
        student_id: record.student_id,
        sesi: session,
        paper_code: record.kod_subjek,
        markah: Number(record.markah),
        entered_by: '',
        updated_by: '',
        updated_at: '',
        source: 'marks' as const,
      }));
    // Markah daripada menu Pemarkahan mengatasi rekod khusus jika kedua-duanya wujud.
    const merged = new Map<string, LoadedPsraMark>();
    [...dedicated, ...standard].forEach((record) => {
      merged.set(`${record.student_id}|${record.paper_code}`, record);
    });
    setRecords([...merged.values()]);
  }, [exams, hasModuleAccess, selectedClassId, selectedSchool, selectedYear, session]);

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
    const papersToSave = editablePapers.filter((paper) => draft[paper.key].trim() !== '');
    if (!papersToSave.length) {
      setMessage('Masukkan sekurang-kurangnya satu markah untuk disimpan.');
      return;
    }
    const invalidPaper = papersToSave.find((paper) => !isWholeScore(draft[paper.key]));
    if (invalidPaper) {
      setMessage(`Markah ${invalidPaper.label} mesti nombor bulat antara 0 hingga 100.`);
      return;
    }

    setPending(true);
    setMessage('');
    const results = await Promise.all(
      papersToSave.map(async (paper) => {
        const existing = paperRecordMap.get(`${selectedStudentId}|${paper.subjectCode}`);
        if (existing?.source === 'marks') {
          return await client
            .from('marks')
            .update({ markah: scoreNumber(draft[paper.key]) })
            .eq('id', existing.id);
        }
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
      setMessage(`${papersToSave.length} kertas PSRA berjaya disimpan.`);
      await loadRecords();
    }
    setPending(false);
  }

  const permissionLabel = canManageAll
    ? `${profile?.role === 'ADMIN_DAERAH' ? 'Admin daerah' : profile?.role === 'OWNER' ? 'Pentadbir utama' : 'Pentadbir sekolah'} · Semua kelas dan kertas`
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
      <nav className="psra-session-tabs" role="tablist" aria-label="Pilih sesi Percubaan PSRA">
        {[1, 2].map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={session === item}
            className={session === item ? 'active' : ''}
            onClick={() => setSession(item as 1 | 2)}
          >
            Percubaan PSRA {item}
          </button>
        ))}
      </nav>

      <section className="psra-filter-bar">
        {canSelectSchool ? (
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
        ) : (
          <div className="psra-school-display">
            <span>Sekolah</span>
            <strong>
              {selectableSchools[0]
                ? `${selectableSchools[0].kod_sekolah} - ${selectableSchools[0].nama_sekolah}`
                : 'Sekolah tidak ditemui'}
            </strong>
          </div>
        )}
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
                    <span><strong>{student.nama_murid}</strong><small>{cleanMykid(student.mykid)}</small></span>
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
                          step="1"
                          inputMode="numeric"
                          value={draft[paper.key]}
                          disabled={!editable}
                          onKeyDown={(event) => {
                            if (['.', ',', 'e', 'E', '+', '-'].includes(event.key)) event.preventDefault();
                          }}
                          onChange={(event) => {
                            if (!isWholeInput(event.target.value)) return;
                            setDraft((current) => ({ ...current, [paper.key]: event.target.value }));
                          }}
                          onBlur={(event) => {
                            if (!event.target.value.trim()) return;
                            if (!isWholeScore(event.target.value)) return;
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
