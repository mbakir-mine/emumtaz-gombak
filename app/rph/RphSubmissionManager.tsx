'use client';

import { useActionState, useMemo, useState } from 'react';
import type {
  ClassRecord,
  RphRecord,
  RphWeeklyReview,
  RphWeeklySubmission,
  RphWeeklySubmissionItem,
  School,
  SubjectRecord,
  UserRecord,
} from '@/lib/data';
import { getRphWeekEnd, getRphWeekStart } from '@/lib/rph';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeSchools } from '../ui/scopedData';
import { transitionRphWeeklySubmission, type RphSubmissionActionState } from './submission-actions';

const initialState: RphSubmissionActionState = { ok: false, message: '' };
const reviewerRoles = new Set(['OWNER', 'ADMIN_DAERAH', 'ADMIN_ZON', 'ADMIN_SEKOLAH']);
const statusLabels: Record<string, string> = {
  DRAF: 'Belum dihantar',
  DIHANTAR: 'Dihantar',
  DALAM_SEMAKAN: 'Dalam semakan',
  PEMBETULAN: 'Perlu pembetulan',
  DIHANTAR_SEMULA: 'Dihantar semula',
  DISAHKAN: 'Disahkan',
  MULA_SEMAK: 'Semakan dimulakan',
};

function formatDate(value: string, withYear = true) {
  return new Intl.DateTimeFormat('ms-MY', {
    day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}),
  }).format(new Date(`${value}T12:00:00`));
}

function formatDateTime(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ms-MY', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur',
  }).format(new Date(value));
}

function moveWeek(weekStart: string, amount: number) {
  const date = new Date(`${weekStart}T12:00:00`);
  date.setDate(date.getDate() + amount * 7);
  return getRphWeekStart(date);
}

function WeekPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className="rph-week-picker">
    <button type="button" onClick={() => onChange(moveWeek(value, -1))} aria-label="Minggu sebelumnya">‹</button>
    <label><span>Minggu pemantauan</span><input type="date" value={value} onChange={(event) => onChange(getRphWeekStart(event.target.value))} /></label>
    <button type="button" onClick={() => onChange(moveWeek(value, 1))} aria-label="Minggu berikutnya">›</button>
    <strong>{formatDate(value, false)} – {formatDate(getRphWeekEnd(value))}</strong>
  </div>;
}

function WorkflowActionForm({ submission, actorId, actionName, label, needsNote = false }: {
  submission: RphWeeklySubmission;
  actorId: string;
  actionName: 'MULA_SEMAK' | 'PEMBETULAN' | 'SAH';
  label: string;
  needsNote?: boolean;
}) {
  const [state, action, pending] = useActionState(transitionRphWeeklySubmission, initialState);
  return <form action={action} className={`rph-review-action ${needsNote ? 'with-note' : ''}`}>
    <input type="hidden" name="actor_profile_id" value={actorId} />
    <input type="hidden" name="submission_id" value={submission.id} />
    <input type="hidden" name="kod_sekolah" value={submission.kod_sekolah} />
    <input type="hidden" name="week_start" value={submission.week_start} />
    <input type="hidden" name="next_action" value={actionName} />
    {needsNote && <textarea name="note" minLength={5} maxLength={2000} rows={3} placeholder="Nyatakan perkara yang perlu dibetulkan…" required />}
    {actionName === 'SAH' && <input name="note" maxLength={2000} placeholder="Catatan pengesahan (pilihan)" />}
    <button className={actionName === 'SAH' ? 'button' : 'button soft'} disabled={pending} type="submit">{pending ? 'Memproses…' : label}</button>
    {state.message && <small className={state.ok ? 'form-success' : 'form-message'} role="status">{state.message}</small>}
  </form>;
}

export default function RphSubmissionManager({ schools, users, classes, subjects, records, submissions, submissionItems, reviews }: {
  schools: School[];
  users: UserRecord[];
  classes: ClassRecord[];
  subjects: SubjectRecord[];
  records: RphRecord[];
  submissions: RphWeeklySubmission[];
  submissionItems: RphWeeklySubmissionItem[];
  reviews: RphWeeklyReview[];
}) {
  const profile = useAccessProfile();
  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const isReviewer = reviewerRoles.has(profile?.role ?? '');
  const [weekStart, setWeekStart] = useState(getRphWeekStart());
  const [schoolCode, setSchoolCode] = useState(profile?.kod_sekolah ?? scopedSchools[0]?.kod_sekolah ?? '');
  const [expandedId, setExpandedId] = useState('');
  const [submitState, submitAction, submitting] = useActionState(transitionRphWeeklySubmission, initialState);
  const classMap = useMemo(() => new Map(classes.map((item) => [item.id, item])), [classes]);
  const subjectMap = useMemo(() => new Map(subjects.map((item) => [item.kod_subjek, item])), [subjects]);
  const userMap = useMemo(() => new Map(users.map((item) => [item.id, item])), [users]);
  const itemsBySubmission = useMemo(() => {
    const map = new Map<string, RphWeeklySubmissionItem[]>();
    submissionItems.forEach((item) => map.set(item.submission_id, [...(map.get(item.submission_id) ?? []), item]));
    return map;
  }, [submissionItems]);
  const reviewsBySubmission = useMemo(() => {
    const map = new Map<string, RphWeeklyReview[]>();
    reviews.forEach((review) => map.set(review.submission_id, [...(map.get(review.submission_id) ?? []), review]));
    return map;
  }, [reviews]);

  if (!profile) return null;

  const weekEnd = getRphWeekEnd(weekStart);
  const weeklySubmissions = submissions.filter((item) => item.kod_sekolah === schoolCode && item.week_start === weekStart);
  const teacherRoster = users
    .filter((user) => user.kod_sekolah === schoolCode && user.status === 'AKTIF' && ['GURU_KELAS', 'GURU_SUBJEK'].includes(user.role))
    .sort((a, b) => a.nama.localeCompare(b.nama));
  const submittedTeacherIds = new Set(weeklySubmissions.map((item) => item.teacher_id));
  const missingTeachers = teacherRoster.filter((teacher) => !submittedTeacherIds.has(teacher.id));
  const verifiedCount = weeklySubmissions.filter((item) => item.status === 'DISAHKAN').length;
  const correctionCount = weeklySubmissions.filter((item) => item.status === 'PEMBETULAN').length;
  const compliance = teacherRoster.length ? Math.round((weeklySubmissions.length / teacherRoster.length) * 100) : 0;

  if (isReviewer) {
    return <section className="panel rph-monitor-panel">
      <div className="rph-monitor-head">
        <div><span className="rph-eyebrow-dark">PEMANTAUAN GURU BESAR</span><h2>Penghantaran e‑RPH mingguan</h2><p>Pantau pematuhan, semak kandungan dan sahkan penghantaran guru.</p></div>
        <div className="rph-monitor-controls">
          {profile.role === 'OWNER' && <label>Sekolah<select value={schoolCode} onChange={(event) => setSchoolCode(event.target.value)}>{scopedSchools.map((school) => <option key={school.kod_sekolah} value={school.kod_sekolah}>{school.kod_sekolah} · {school.nama_sekolah}</option>)}</select></label>}
          <WeekPicker value={weekStart} onChange={setWeekStart} />
        </div>
      </div>

      <div className="rph-monitor-metrics">
        <div className="primary"><span>Pematuhan minggu ini</span><strong>{compliance}%</strong><small>{weeklySubmissions.length} daripada {teacherRoster.length} guru</small></div>
        <div><span>Belum hantar</span><strong>{missingTeachers.length}</strong><small>Memerlukan tindakan</small></div>
        <div><span>Dalam proses</span><strong>{weeklySubmissions.length - verifiedCount - correctionCount}</strong><small>Hantar / sedang semak</small></div>
        <div><span>Pembetulan</span><strong>{correctionCount}</strong><small>Dikembalikan kepada guru</small></div>
        <div><span>Disahkan</span><strong>{verifiedCount}</strong><small>Selesai dipantau</small></div>
      </div>

      {missingTeachers.length > 0 && <details className="rph-missing-teachers"><summary><strong>{missingTeachers.length} guru belum menghantar</strong><span>Lihat senarai</span></summary><div>{missingTeachers.map((teacher) => <span key={teacher.id}>{teacher.nama}<small>{teacher.role === 'GURU_KELAS' ? 'Guru Kelas' : 'Guru Subjek'}</small></span>)}</div></details>}

      <div className="rph-submission-section-head"><div><h3>Senarai penghantaran</h3><p>{formatDate(weekStart)} hingga {formatDate(weekEnd)}</p></div><span>{weeklySubmissions.length} penghantaran</span></div>
      {weeklySubmissions.length === 0 ? <div className="rph-empty"><span>⌛</span><h3>Belum ada penghantaran</h3><p>Penghantaran guru untuk minggu ini akan muncul di sini.</p></div> : <div className="rph-submission-list">{weeklySubmissions.map((submission) => {
        const teacher = userMap.get(submission.teacher_id);
        const items = itemsBySubmission.get(submission.id) ?? [];
        const submissionReviews = reviewsBySubmission.get(submission.id) ?? [];
        const expanded = expandedId === submission.id;
        return <article className="rph-submission-card" key={submission.id}>
          <header><div className="rph-teacher-avatar">{teacher?.nama.split(/\s+/).slice(0, 2).map((part) => part[0]).join('') ?? 'G'}</div><div><span className={`rph-workflow-status status-${submission.status.toLowerCase()}`}>{statusLabels[submission.status]}</span><h3>{teacher?.nama ?? 'Guru'}</h3><p>{items.length} RPH · Dihantar {formatDateTime(submission.submitted_at)}</p></div><button type="button" onClick={() => setExpandedId(expanded ? '' : submission.id)}>{expanded ? 'Tutup' : 'Semak RPH'}</button></header>
          {submission.reviewer_note && <div className="rph-review-note"><strong>Ulasan terkini</strong><p>{submission.reviewer_note}</p></div>}
          {expanded && <div className="rph-submission-detail">
            <div className="rph-snapshot-list">{items.map((item) => {
              const snapshot = item.version_snapshot;
              const classRecord = snapshot.class_id ? classMap.get(snapshot.class_id) : null;
              return <details key={item.id}><summary><span><strong>{snapshot.tajuk}</strong><small>{formatDate(snapshot.tarikh)} · {classRecord ? `Tahun ${classRecord.tahun} - ${classRecord.nama_kelas}` : 'Kelas'} · {snapshot.kod_subjek ? subjectMap.get(snapshot.kod_subjek)?.nama_subjek ?? snapshot.kod_subjek : '-'}</small></span><b>Lihat kandungan</b></summary><div className="rph-snapshot-content"><section><strong>Standard / fokus</strong><p>{snapshot.standard_pembelajaran ?? '-'}</p></section><section><strong>Objektif</strong><p>{snapshot.objektif ?? '-'}</p></section><section><strong>Aktiviti</strong><p>{snapshot.aktiviti ?? '-'}</p></section><section><strong>Pentaksiran</strong><p>{snapshot.pentaksiran ?? '-'}</p></section><section><strong>Refleksi</strong><p>{snapshot.refleksi ?? '-'}</p></section></div></details>;
            })}</div>
            <div className="rph-review-workspace">
              <h4>Keputusan semakan</h4>
              <div className="rph-review-buttons">
                {['DIHANTAR', 'DIHANTAR_SEMULA'].includes(submission.status) && <WorkflowActionForm submission={submission} actorId={profile.id} actionName="MULA_SEMAK" label="Mulakan semakan" />}
                {['DIHANTAR', 'DIHANTAR_SEMULA', 'DALAM_SEMAKAN'].includes(submission.status) && <WorkflowActionForm submission={submission} actorId={profile.id} actionName="SAH" label="✓ Sahkan RPH" />}
              </div>
              {['DIHANTAR', 'DIHANTAR_SEMULA', 'DALAM_SEMAKAN'].includes(submission.status) && <WorkflowActionForm submission={submission} actorId={profile.id} actionName="PEMBETULAN" label="Pulangkan untuk pembetulan" needsNote />}
              {submissionReviews.length > 0 && <div className="rph-review-history"><h4>Jejak semakan</h4>{submissionReviews.map((review) => <div key={review.id}><i /><span><strong>{statusLabels[review.action] ?? review.action}</strong><small>{userMap.get(review.actor_profile_id)?.nama ?? 'Pengguna'} · {formatDateTime(review.created_at)}</small>{review.comment && <p>{review.comment}</p>}</span></div>)}</div>}
            </div>
          </div>}
        </article>;
      })}</div>}
    </section>;
  }

  const ownRecords = records
    .filter((record) => record.kod_sekolah === profile.kod_sekolah && record.teacher_id === profile.id && record.tarikh >= weekStart && record.tarikh <= weekEnd)
    .sort((a, b) => a.tarikh.localeCompare(b.tarikh));
  const readyRecords = ownRecords.filter((record) => ['SEDIA', 'SELESAI'].includes(record.status));
  const ownSubmission = submissions.find((item) => item.teacher_id === profile.id && item.week_start === weekStart);
  const canSubmit = !ownSubmission || ownSubmission.status === 'DRAF' || ownSubmission.status === 'PEMBETULAN';
  const history = submissions.filter((item) => item.teacher_id === profile.id).slice(0, 12);

  return <section className="panel rph-teacher-submit-panel">
    <div className="rph-monitor-head"><div><span className="rph-eyebrow-dark">PENGHANTARAN GURU</span><h2>Hantar e‑RPH mingguan</h2><p>Semak kelengkapan RPH sebelum dihantar kepada Guru Besar.</p></div><WeekPicker value={weekStart} onChange={setWeekStart} /></div>
    <div className="rph-teacher-workflow" aria-label="Aliran penghantaran">
      {['DRAF', 'DIHANTAR', 'DALAM_SEMAKAN', 'DISAHKAN'].map((status, index) => {
        const currentStatus = ownSubmission?.status ?? 'DRAF';
        const effective = currentStatus === 'PEMBETULAN' ? 'DRAF' : currentStatus === 'DIHANTAR_SEMULA' ? 'DIHANTAR' : currentStatus;
        const currentIndex = ['DRAF', 'DIHANTAR', 'DALAM_SEMAKAN', 'DISAHKAN'].indexOf(effective);
        return <div className={index <= currentIndex ? 'active' : ''} key={status}><i>{index < currentIndex ? '✓' : index + 1}</i><span>{statusLabels[status]}</span></div>;
      })}
    </div>

    {ownSubmission?.status === 'PEMBETULAN' && <div className="rph-correction-banner"><strong>Pembetulan diperlukan</strong><p>{ownSubmission.reviewer_note}</p><span>Betulkan RPH berkaitan dalam Koleksi, tandakan “Sedia”, kemudian hantar semula.</span></div>}
    {ownSubmission?.status === 'DISAHKAN' && <div className="rph-verified-banner"><span>✓</span><div><strong>Penghantaran minggu ini telah disahkan</strong><p>Disahkan pada {formatDateTime(ownSubmission.verified_at)} oleh {ownSubmission.verified_by ? userMap.get(ownSubmission.verified_by)?.nama ?? 'Guru Besar' : 'Guru Besar'}.</p></div></div>}

    <div className="rph-submit-summary"><div><strong>{readyRecords.length}</strong><span>RPH sedia dihantar</span></div><div><strong>{ownRecords.length - readyRecords.length}</strong><span>Masih berstatus draf</span></div><div><strong>{formatDate(weekStart, false)} – {formatDate(weekEnd, false)}</strong><span>Tempoh penghantaran</span></div></div>
    <div className="rph-week-records">
      <div className="rph-submission-section-head"><div><h3>RPH dalam penghantaran</h3><p>Hanya RPH bertanda “Sedia” atau “Selesai” akan dihantar.</p></div></div>
      {ownRecords.length === 0 ? <div className="rph-empty compact"><span>✎</span><h3>Belum ada RPH minggu ini</h3><p>Bina RPH dan tetapkan nama guru kepada profil anda terlebih dahulu.</p></div> : ownRecords.map((record) => <div className={['SEDIA', 'SELESAI'].includes(record.status) ? 'ready' : 'draft'} key={record.id}><i>{['SEDIA', 'SELESAI'].includes(record.status) ? '✓' : '!'}</i><span><strong>{record.tajuk}</strong><small>{formatDate(record.tarikh)} · {record.kod_subjek ? subjectMap.get(record.kod_subjek)?.nama_subjek ?? record.kod_subjek : '-'}</small></span><b>{['SEDIA', 'SELESAI'].includes(record.status) ? 'Sedia' : 'Draf'}</b></div>)}
    </div>

    {canSubmit && <form action={submitAction} className="rph-week-submit-form">
      <input type="hidden" name="actor_profile_id" value={profile.id} /><input type="hidden" name="kod_sekolah" value={profile.kod_sekolah ?? ''} /><input type="hidden" name="week_start" value={weekStart} /><input type="hidden" name="next_action" value="HANTAR" />
      <label>Catatan kepada Guru Besar<textarea name="note" maxLength={1000} rows={3} placeholder="Catatan penghantaran (pilihan)" /></label>
      <div><p>Dengan menghantar, versi semasa {readyRecords.length} RPH akan direkodkan dan dikunci sepanjang semakan.</p><button className="button" type="submit" disabled={submitting || readyRecords.length === 0}>{submitting ? 'Menghantar…' : ownSubmission?.status === 'PEMBETULAN' ? 'Hantar semula untuk semakan' : 'Hantar RPH minggu ini'}</button></div>
      {submitState.message && <p className={submitState.ok ? 'form-success' : 'form-message'} role="status">{submitState.message}</p>}
    </form>}

    {history.length > 0 && <div className="rph-submission-history"><h3>Sejarah penghantaran</h3>{history.map((submission) => <div key={submission.id}><span><strong>{formatDate(submission.week_start)} – {formatDate(getRphWeekEnd(submission.week_start))}</strong><small>{(itemsBySubmission.get(submission.id) ?? []).length} RPH · {formatDateTime(submission.submitted_at)}</small></span><b className={`rph-workflow-status status-${submission.status.toLowerCase()}`}>{statusLabels[submission.status]}</b></div>)}</div>}
  </section>;
}
