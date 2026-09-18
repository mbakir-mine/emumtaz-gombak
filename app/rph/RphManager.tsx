'use client';

import { useActionState, useMemo, useRef, useState, useTransition } from 'react';
import type { ClassRecord, RphRecord, RphTopic, RphWeeklyReview, RphWeeklySubmission, RphWeeklySubmissionItem, School, SubjectRecord, TakwimEvent, UserRecord } from '@/lib/data';
import type { RphPedagogy } from '@/lib/rph';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses, scopeSchools, scopeUsers } from '../ui/scopedData';
import { deleteRphDraft, generateAiRphDraft, saveRphDraft, updateRphStatus, type RphActionState } from './actions';
import RphSubmissionManager from './RphSubmissionManager';

const initialState: RphActionState = { ok: false, message: '' };
const pedagogies: { value: RphPedagogy; label: string; description: string }[] = [
  { value: 'KOLABORATIF', label: 'Kolaboratif', description: 'Kerja kumpulan & perkongsian' },
  { value: 'INKUIRI', label: 'Inkuiri', description: 'Soalan, teroka & temui' },
  { value: 'MASTERI', label: 'Masteri', description: 'Bimbingan berperingkat' },
  { value: 'PROJEK', label: 'Berasaskan projek', description: 'Hasil autentik murid' },
];

type BuilderState = {
  recordId: string;
  tarikh: string;
  tajuk: string;
  standard: string;
  tempoh: number;
  pedagogi: RphPedagogy;
  tahapMurid: string;
  emk: string;
  objektif: string;
  aktiviti: string;
  bbm: string;
  pentaksiran: string;
  refleksi: string;
};

function todayIso() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function emptyBuilder(): BuilderState {
  return {
    recordId: '', tarikh: todayIso(), tajuk: '', standard: '', tempoh: 60, pedagogi: 'KOLABORATIF',
    tahapMurid: 'pelbagai tahap penguasaan', emk: 'Nilai murni, komunikasi dan kreativiti',
    objektif: '', aktiviti: '', bbm: '', pentaksiran: '', refleksi: '',
  };
}

function classLabel(item: ClassRecord) {
  return `Tahun ${item.tahun} - ${item.nama_kelas}`;
}

function textLines(value: string | null) {
  return (value ?? '-').split('\n').filter(Boolean);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

function statusLabel(status: string) {
  return status === 'SELESAI' ? 'Selesai' : status === 'SEDIA' ? 'Sedia mengajar' : 'Draf';
}

export default function RphManager({ schools, classes, subjects, users, records, rphTopics, takwimEvents, submissions, submissionItems, reviews }: {
  schools: School[]; classes: ClassRecord[]; subjects: SubjectRecord[]; users: UserRecord[]; records: RphRecord[]; rphTopics: RphTopic[]; takwimEvents: TakwimEvent[];
  submissions: RphWeeklySubmission[]; submissionItems: RphWeeklySubmissionItem[]; reviews: RphWeeklyReview[];
}) {
  const profile = useAccessProfile();
  const currentAcademicYear = new Date().getFullYear();
  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const scopedUsers = useMemo(() => scopeUsers(profile, users, schools), [profile, schools, users]);
  const initialSchool = profile?.kod_sekolah ?? scopedSchools[0]?.kod_sekolah ?? '';
  const firstClass = scopedClasses.find((item) => item.kod_sekolah === initialSchool && item.tahun_akademik === currentAcademicYear && item.status === 'AKTIF');
  const [selectedSchool, setSelectedSchool] = useState(initialSchool);
  const [selectedClass, setSelectedClass] = useState(firstClass?.id ?? '');
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.kod_subjek ?? '');
  const [selectedTeacher, setSelectedTeacher] = useState(['GURU_KELAS', 'GURU_SUBJEK'].includes(profile?.role ?? '') ? profile?.id ?? '' : '');
  const [builder, setBuilder] = useState<BuilderState>(emptyBuilder);
  const [view, setView] = useState<'BUILDER' | 'COLLECTION' | 'SUBMISSIONS'>('BUILDER');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('SEMUA');
  const [feedback, setFeedback] = useState<RphActionState | null>(null);
  const [state, action, saving] = useActionState(saveRphDraft, initialState);
  const [pending, startTransition] = useTransition();
  const builderRef = useRef<HTMLDivElement>(null);

  const schoolClasses = scopedClasses
    .filter((item) => item.kod_sekolah === selectedSchool && item.tahun_akademik === currentAcademicYear && item.status === 'AKTIF')
    .sort((a, b) => a.tahun - b.tahun || a.nama_kelas.localeCompare(b.nama_kelas));
  const teachers = scopedUsers
    .filter((user) => user.kod_sekolah === selectedSchool && ['GURU_KELAS', 'GURU_SUBJEK', 'ADMIN_SEKOLAH'].includes(user.role) && user.status === 'AKTIF')
    .sort((a, b) => a.nama.localeCompare(b.nama));
  const classMap = useMemo(() => new Map(classes.map((item) => [item.id, item])), [classes]);
  const subjectMap = useMemo(() => new Map(subjects.map((item) => [item.kod_subjek, item.nama_subjek])), [subjects]);
  const userMap = useMemo(() => new Map(users.map((user) => [user.id, user.nama])), [users]);
  const selectedClassRecord = classMap.get(selectedClass);
  const filteredTopics = rphTopics.filter(
    (topic) => topic.tahun === selectedClassRecord?.tahun && topic.kod_subjek === selectedSubject,
  );
  const schoolRecords = records.filter((record) => record.kod_sekolah === selectedSchool);
  const visibleRecords = schoolRecords.filter((record) => {
    const haystack = `${record.tajuk} ${record.standard_pembelajaran ?? ''} ${record.kod_subjek ?? ''}`.toLowerCase();
    return (statusFilter === 'SEMUA' || record.status === statusFilter) && haystack.includes(search.toLowerCase());
  });
  const takwimReferences = takwimEvents
    .filter((event) => event.tahun_akademik === currentAcademicYear && (event.scope === 'DAERAH' || event.kod_sekolah === selectedSchool))
    .sort((a, b) => a.tarikh_mula.localeCompare(b.tarikh_mula))
    .filter((event) => event.tarikh_tamat >= todayIso())
    .slice(0, 3);
  const thisWeek = schoolRecords.filter((record) => {
    const diff = new Date(`${record.tarikh}T00:00:00`).getTime() - new Date(`${todayIso()}T00:00:00`).getTime();
    return diff >= -6 * 86_400_000 && diff <= 6 * 86_400_000;
  }).length;
  const canDelete = ['OWNER', 'ADMIN_SEKOLAH', 'ADMIN_DAERAH', 'ADMIN_ZON'].includes(profile?.role ?? '');
  const isTeacherProfile = ['GURU_KELAS', 'GURU_SUBJEK'].includes(profile?.role ?? '');

  function updateBuilder<K extends keyof BuilderState>(key: K, value: BuilderState[K]) {
    setBuilder((current) => ({ ...current, [key]: value }));
  }

  function selectTopic(tajuk: string) {
    const topic = filteredTopics.find((item) => item.tajuk === tajuk);
    const standard = [topic?.standard_kandungan, topic?.standard_pembelajaran].filter(Boolean).join('\n\n');
    setBuilder((current) => ({
      ...current,
      tajuk,
      standard: standard || current.standard,
    }));
  }

  function buildRphFormData() {
    const formData = new FormData();
    formData.set('kod_sekolah', selectedSchool);
    formData.set('class_id', selectedClass);
    formData.set('teacher_id', isTeacherProfile ? profile?.id ?? '' : selectedTeacher);
    formData.set('kod_subjek', selectedSubject);
    formData.set('tajuk', builder.tajuk);
    formData.set('standard_pembelajaran', builder.standard);
    formData.set('pedagogi', builder.pedagogi);
    formData.set('tempoh', String(builder.tempoh));
    formData.set('tahap_murid', builder.tahapMurid);
    formData.set('emk', builder.emk);
    return formData;
  }

  function generateAiDraft() {
    setFeedback(null);
    startTransition(async () => {
      const result = await generateAiRphDraft(buildRphFormData());
      if (result.ok) {
        setBuilder((current) => ({
          ...current,
          objektif: result.objektif ?? current.objektif,
          aktiviti: result.aktiviti ?? current.aktiviti,
          bbm: result.bbm ?? current.bbm,
          pentaksiran: result.pentaksiran ?? current.pentaksiran,
          refleksi: result.refleksi ?? current.refleksi,
        }));
      }
      const qualityNotes = result.qualityNotes?.length ? ` Nota: ${result.qualityNotes.join(' ')}` : '';
      const source = result.source === 'TEMPLATE' ? ' (template sandaran)' : '';
      setFeedback({ ok: result.ok, message: `${result.message}${source}${qualityNotes}` });
    });
  }

  function loadRecord(record: RphRecord, duplicate = false) {
    setSelectedClass(record.class_id ?? selectedClass);
    setSelectedSubject(record.kod_subjek ?? selectedSubject);
    setSelectedTeacher(record.teacher_id ?? '');
    setBuilder({
      ...emptyBuilder(), recordId: duplicate ? '' : record.id, tarikh: duplicate ? todayIso() : record.tarikh,
      tajuk: duplicate ? `${record.tajuk} (Salinan)` : record.tajuk, standard: record.standard_pembelajaran ?? '',
      objektif: record.objektif ?? '', aktiviti: record.aktiviti ?? '', bbm: record.bbm ?? '',
      pentaksiran: record.pentaksiran ?? '', refleksi: record.refleksi ?? '',
    });
    setView('BUILDER');
    setFeedback({ ok: true, message: duplicate ? 'Salinan dimuatkan. Tukar tarikh atau kandungan sebelum simpan.' : 'RPH dimuatkan untuk dikemas kini.' });
    window.setTimeout(() => builderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  function mutateRecord(operation: () => Promise<RphActionState>) {
    startTransition(async () => setFeedback(await operation()));
  }

  function submitRph(formData: FormData) {
    setFeedback(null);
    action(formData);
  }

  function printRecord(id: string) {
    document.body.dataset.printRphId = id;
    const target = document.querySelector<HTMLElement>(`[data-rph-id="${id}"]`);
    target?.classList.add('rph-print-target');
    window.print();
    window.setTimeout(() => {
      target?.classList.remove('rph-print-target');
      delete document.body.dataset.printRphId;
    }, 500);
  }

  return (
    <div className="rph-workspace">
      <section className="rph-hero">
        <div className="rph-hero-copy">
          <span className="rph-eyebrow">e‑RPH PINTAR</span>
          <h2>Rancang pengajaran bermakna, bukan sekadar isi borang.</h2>
          <p>Bina, sesuaikan dan simpan RPH berkualiti dalam satu ruang kerja yang mudah digunakan oleh setiap guru.</p>
          <div className="rph-hero-actions">
            <button className="button" type="button" onClick={() => setView('BUILDER')}>+ Bina RPH baharu</button>
            <button className="button soft" type="button" onClick={() => setView('COLLECTION')}>Lihat koleksi</button>
          </div>
        </div>
        <div className="rph-metrics" aria-label="Ringkasan RPH">
          <div><strong>{schoolRecords.length}</strong><span>Jumlah RPH</span></div>
          <div><strong>{thisWeek}</strong><span>Minggu ini</span></div>
          <div><strong>{schoolRecords.filter((item) => item.status === 'SELESAI').length}</strong><span>Selesai</span></div>
        </div>
      </section>

      <nav className="rph-tabs" aria-label="Paparan RPH">
        <button className={view === 'BUILDER' ? 'active' : ''} type="button" onClick={() => setView('BUILDER')}>Pembina RPH</button>
        <button className={view === 'COLLECTION' ? 'active' : ''} type="button" onClick={() => setView('COLLECTION')}>Koleksi <span>{schoolRecords.length}</span></button>
        <button className={view === 'SUBMISSIONS' ? 'active' : ''} type="button" onClick={() => setView('SUBMISSIONS')}>{['OWNER', 'ADMIN_SEKOLAH', 'ADMIN_DAERAH', 'ADMIN_ZON'].includes(profile?.role ?? '') ? 'Pemantauan Guru' : 'Hantar Mingguan'} <span>{submissions.length}</span></button>
      </nav>

      {view === 'BUILDER' ? (
        <section className="panel rph-builder" ref={builderRef}>
          <div className="rph-builder-head">
            <div><span className="rph-step-number">01</span><div><h2>{builder.recordId ? 'Kemaskini RPH' : 'Maklumat pengajaran'}</h2><p>Tetapkan konteks kelas supaya cadangan lebih tepat.</p></div></div>
            {builder.recordId && <button className="button soft" type="button" onClick={() => { setBuilder(emptyBuilder()); setFeedback(null); }}>Batal sunting</button>}
          </div>

          {takwimReferences.length > 0 && (
            <div className="rph-calendar-note"><strong>Rujukan takwim terdekat</strong>{takwimReferences.map((event) => <span key={event.id}>{formatDate(event.tarikh_mula)} · {event.tajuk}</span>)}</div>
          )}

          <form action={submitRph} className="rph-smart-form">
            <input type="hidden" name="record_id" value={builder.recordId} />
            <input type="hidden" name="kod_sekolah" value={selectedSchool} />
            <div className="rph-fields-grid">
              <label>Sekolah<select value={selectedSchool} onChange={(event) => {
                const code = event.target.value;
                setSelectedSchool(code);
                setSelectedClass(scopedClasses.find((item) => item.kod_sekolah === code && item.tahun_akademik === currentAcademicYear && item.status === 'AKTIF')?.id ?? '');
              }} disabled={profile?.role !== 'OWNER'}>{scopedSchools.map((school) => <option key={school.kod_sekolah} value={school.kod_sekolah}>{school.kod_sekolah} · {school.nama_sekolah}</option>)}</select></label>
              <label>Kelas<select name="class_id" value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)} required><option value="">Pilih kelas</option>{schoolClasses.map((item) => <option key={item.id} value={item.id}>{classLabel(item)}</option>)}</select></label>
              <label>Mata pelajaran<select name="kod_subjek" value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)} required><option value="">Pilih subjek</option>{subjects.filter((item) => item.status === 'AKTIF').map((subject) => <option key={subject.kod_subjek} value={subject.kod_subjek}>{subject.nama_subjek}</option>)}</select></label>
              <label>Guru<select name="teacher_id" value={selectedTeacher} onChange={(event) => setSelectedTeacher(event.target.value)} disabled={isTeacherProfile}><option value="">Pilih guru</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.nama}</option>)}</select>{isTeacherProfile && <input type="hidden" name="teacher_id" value={profile?.id ?? ''} />}</label>
              <label>Tarikh<input name="tarikh" type="date" value={builder.tarikh} onChange={(event) => updateBuilder('tarikh', event.target.value)} required /></label>
              <label>Tempoh<select name="tempoh" value={builder.tempoh} onChange={(event) => updateBuilder('tempoh', Number(event.target.value))}><option value={30}>30 minit</option><option value={40}>40 minit</option><option value={60}>60 minit</option><option value={90}>90 minit</option></select></label>
              <label className="rph-span-2">Tajuk / fokus<select name="tajuk" value={builder.tajuk} onChange={(event) => selectTopic(event.target.value)} required><option value="">{selectedClass && selectedSubject ? 'Pilih tajuk' : 'Pilih kelas dan subjek dahulu'}</option>{filteredTopics.map((topic) => <option key={topic.id} value={topic.tajuk}>{topic.tajuk}</option>)}{builder.tajuk && !filteredTopics.some((topic) => topic.tajuk === builder.tajuk) && <option value={builder.tajuk}>{builder.tajuk}</option>}</select><span className="field-hint">{filteredTopics.length ? `${filteredTopics.length} tajuk tersedia untuk Tahun ${selectedClassRecord?.tahun}. Standard akan diisi automatik jika tersedia.` : 'Tajuk akan dipaparkan mengikut tahun kelas dan subjek.'}</span></label>
              <label className="rph-span-2">Standard kandungan & pembelajaran<textarea name="standard_pembelajaran" rows={3} value={builder.standard} onChange={(event) => updateBuilder('standard', event.target.value)} placeholder="Tampal standard atau nyatakan kemahiran yang ingin dicapai." /></label>
            </div>

            <div className="rph-section-heading"><span className="rph-step-number">02</span><div><h3>Reka bentuk pembelajaran</h3><p>Pilih pendekatan dan konteks murid.</p></div></div>
            <div className="rph-pedagogy-grid">{pedagogies.map((item) => <label className={builder.pedagogi === item.value ? 'selected' : ''} key={item.value}><input type="radio" name="pedagogi" value={item.value} checked={builder.pedagogi === item.value} onChange={() => updateBuilder('pedagogi', item.value)} /><strong>{item.label}</strong><span>{item.description}</span></label>)}</div>
            <div className="rph-fields-grid rph-context-fields">
              <label>Tahap / keperluan murid<input name="tahap_murid" value={builder.tahapMurid} onChange={(event) => updateBuilder('tahapMurid', event.target.value)} /></label>
              <label>EMK, nilai & PAK21<input name="emk" value={builder.emk} onChange={(event) => updateBuilder('emk', event.target.value)} /></label>
            </div>
            <button className="rph-generate-button" type="button" onClick={generateAiDraft} disabled={!builder.tajuk || !selectedClass || !selectedSubject || pending}><span>✦</span><strong>{pending ? 'Menjana RPH pintar…' : 'Jana RPH pintar 0 kos'}</strong><small>Objektif, aktiviti, BBM, pentaksiran dan semakan kualiti tanpa caj API</small></button>

            <div className="rph-section-heading"><span className="rph-step-number">03</span><div><h3>Semak & sesuaikan</h3><p>Semua cadangan boleh disunting mengikut realiti kelas.</p></div></div>
            <div className="rph-editor-grid">
              <label><span>Objektif pembelajaran</span><textarea name="objektif" rows={6} value={builder.objektif} onChange={(event) => updateBuilder('objektif', event.target.value)} placeholder="Klik Jana cadangan RPH atau tulis objektif sendiri." /></label>
              <label><span>Aktiviti & agihan masa</span><textarea name="aktiviti" rows={10} value={builder.aktiviti} onChange={(event) => updateBuilder('aktiviti', event.target.value)} /></label>
              <label><span>Bahan bantu mengajar</span><textarea name="bbm" rows={4} value={builder.bbm} onChange={(event) => updateBuilder('bbm', event.target.value)} /></label>
              <label><span>Pentaksiran & evidens</span><textarea name="pentaksiran" rows={4} value={builder.pentaksiran} onChange={(event) => updateBuilder('pentaksiran', event.target.value)} /></label>
              <label className="rph-span-2"><span>Refleksi selepas PdP</span><textarea name="refleksi" rows={3} value={builder.refleksi} onChange={(event) => updateBuilder('refleksi', event.target.value)} placeholder="Boleh dilengkapkan selepas pengajaran." /></label>
            </div>
            {(feedback?.message || state.message) && <p className={(feedback?.ok ?? state.ok) ? 'form-success rph-feedback' : 'form-message rph-feedback'} role="status">{feedback?.message || state.message}</p>}
            <div className="rph-save-bar"><div><strong>{builder.recordId ? 'Simpan perubahan' : 'Sedia dimasukkan ke koleksi?'}</strong><span>RPH boleh dikemas kini semula pada bila-bila masa.</span></div><div><button className="button soft" name="status" value="DRAF" disabled={saving}>Simpan draf</button><button className="button" name="status" value="SEDIA" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan & tandakan sedia'}</button></div></div>
          </form>
        </section>
      ) : view === 'COLLECTION' ? (
        <section className="panel rph-collection">
          <div className="rph-collection-head"><div><h2>Koleksi RPH sekolah</h2><p>Cari, guna semula dan jejak pelaksanaan pengajaran.</p></div><button className="button" type="button" onClick={() => { setBuilder(emptyBuilder()); setView('BUILDER'); }}>+ RPH baharu</button></div>
          <div className="rph-filter-bar"><label><span className="sr-only">Cari RPH</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari tajuk atau standard…" /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Tapis status"><option value="SEMUA">Semua status</option><option value="DRAF">Draf</option><option value="SEDIA">Sedia mengajar</option><option value="SELESAI">Selesai</option></select><span>{visibleRecords.length} rekod</span></div>
          {(feedback?.message) && <p className={feedback.ok ? 'form-success rph-feedback' : 'form-message rph-feedback'} role="status">{feedback.message}</p>}
          {visibleRecords.length === 0 ? <div className="rph-empty"><span>✎</span><h3>Tiada RPH ditemui</h3><p>Mulakan RPH baharu atau ubah kata carian dan penapis.</p></div> : <div className="rph-list">{visibleRecords.map((record) => {
            const classRecord = record.class_id ? classMap.get(record.class_id) : null;
            return <article className="rph-card" data-rph-id={record.id} key={record.id}>
              <div className="rph-card-head"><div className="rph-card-title"><div className="rph-date-tile"><strong>{new Date(`${record.tarikh}T00:00:00`).getDate()}</strong><span>{new Intl.DateTimeFormat('ms-MY', { month: 'short' }).format(new Date(`${record.tarikh}T00:00:00`))}</span></div><div><span className={`rph-status status-${record.status.toLowerCase()}`}>{statusLabel(record.status)}</span><h3>{record.tajuk}</h3><p>{classRecord ? classLabel(classRecord) : '-'} · {record.kod_subjek ? subjectMap.get(record.kod_subjek) ?? record.kod_subjek : '-'} · {record.teacher_id ? userMap.get(record.teacher_id) ?? 'Guru' : 'Belum ditetapkan'}</p></div></div><div className="rph-card-actions"><button type="button" onClick={() => loadRecord(record)}>Sunting</button><button type="button" onClick={() => loadRecord(record, true)}>Salin</button><button type="button" onClick={() => printRecord(record.id)}>Cetak</button></div></div>
              {record.standard_pembelajaran && <p className="rph-standard"><strong>Standard / fokus</strong>{record.standard_pembelajaran}</p>}
              <div className="rph-card-grid"><section><strong>Objektif</strong>{textLines(record.objektif).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</section><section><strong>Aktiviti pembelajaran</strong>{textLines(record.aktiviti).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</section><section><strong>BBM</strong><p>{record.bbm ?? '-'}</p></section><section><strong>Pentaksiran</strong><p>{record.pentaksiran ?? '-'}</p></section>{record.refleksi && <section className="rph-reflection"><strong>Refleksi</strong><p>{record.refleksi}</p></section>}</div>
              <footer className="rph-card-footer"><span>Dikemas untuk {formatDate(record.tarikh)}</span><div>{record.status !== 'SEDIA' && <button type="button" disabled={pending} onClick={() => mutateRecord(() => updateRphStatus(record.id, 'SEDIA'))}>Tanda sedia</button>}{record.status !== 'SELESAI' && <button className="complete" type="button" disabled={pending} onClick={() => mutateRecord(() => updateRphStatus(record.id, 'SELESAI'))}>✓ Selesai PdP</button>}{canDelete && <button className="danger-link" type="button" disabled={pending} onClick={() => { if (window.confirm(`Padam RPH “${record.tajuk}”?`)) mutateRecord(() => deleteRphDraft(record.id)); }}>Padam</button>}</div></footer>
            </article>;
          })}</div>}
        </section>
      ) : (
        <RphSubmissionManager schools={schools} users={users} classes={classes} subjects={subjects} records={records} submissions={submissions} submissionItems={submissionItems} reviews={reviews} />
      )}
    </div>
  );
}
