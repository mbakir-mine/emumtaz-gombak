'use client';

import { useActionState, useMemo, useState } from 'react';
import type { ClassRecord, ExamRecord, MarkSubmissionWorkflow, School, SubjectRecord } from '@/lib/data';
import { useAccessProfile } from '../ui/AuthGate';
import { transitionMarkSubmission, type MarkWorkflowActionState } from './actions';

const initialState: MarkWorkflowActionState = { ok: false, message: '' };
const reviewRoles = new Set(['OWNER', 'ADMIN_DAERAH', 'ADMIN_ZON', 'ADMIN_SEKOLAH']);
const statusLabels: Record<string, string> = {
  DRAF: 'Draf', DIHANTAR: 'Dihantar', DISAHKAN: 'Disahkan', DIKUNCI: 'Dikunci', PEMBETULAN: 'Perlu pembetulan',
};

function TransitionForm({ row, status, label, needsNote = false }: { row: MarkSubmissionWorkflow; status: string; label: string; needsNote?: boolean }) {
  const [state, action, pending] = useActionState(transitionMarkSubmission, initialState);
  return <form action={action} className="mark-workflow-action">
    <input type="hidden" name="kod_sekolah" value={row.kod_sekolah} />
    <input type="hidden" name="exam_id" value={row.exam_id} />
    <input type="hidden" name="class_id" value={row.class_id} />
    <input type="hidden" name="kod_subjek" value={row.kod_subjek} />
    <input type="hidden" name="next_status" value={status} />
    {needsNote ? <input name="notes" minLength={5} maxLength={1000} placeholder="Sebab pembetulan" required /> : null}
    <button className="button table-action" disabled={pending} type="submit">{pending ? 'Memproses…' : label}</button>
    {state.message ? <small className={state.ok ? 'form-success' : 'form-message'}>{state.message}</small> : null}
  </form>;
}

export default function WorkflowManager({ schools, classes, exams, subjects, workflows }: {
  schools: School[]; classes: ClassRecord[]; exams: ExamRecord[]; subjects: SubjectRecord[]; workflows: MarkSubmissionWorkflow[];
}) {
  const profile = useAccessProfile();
  const [schoolCode, setSchoolCode] = useState(profile?.kod_sekolah ?? schools[0]?.kod_sekolah ?? '');
  const [createState, createAction, creating] = useActionState(transitionMarkSubmission, initialState);
  const classMap = useMemo(() => new Map(classes.map((item) => [item.id, item])), [classes]);
  const examMap = useMemo(() => new Map(exams.map((item) => [item.id, item])), [exams]);
  const subjectMap = useMemo(() => new Map(subjects.map((item) => [item.kod_subjek, item])), [subjects]);
  const schoolClasses = classes.filter((item) => item.kod_sekolah === schoolCode && item.status === 'AKTIF');
  const isReviewer = Boolean(profile && reviewRoles.has(profile.role));

  return <>
    <section className="panel mark-workflow-create">
      <div className="panel-head"><div><h2>Mulakan penghantaran</h2><p>Pilih skop tepat sebelum markah dihantar untuk semakan.</p></div></div>
      <form action={createAction}>
        <label>Sekolah<select name="kod_sekolah" value={schoolCode} onChange={(event) => setSchoolCode(event.target.value)} required>
          {schools.map((school) => <option key={school.kod_sekolah} value={school.kod_sekolah}>{school.kod_sekolah} — {school.nama_sekolah}</option>)}
        </select></label>
        <label>Peperiksaan<select name="exam_id" required>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.nama_peperiksaan} {exam.tahun_akademik}</option>)}</select></label>
        <label>Kelas<select name="class_id" required>{schoolClasses.map((item) => <option key={item.id} value={item.id}>{item.nama_kelas} · Tahun {item.tahun}</option>)}</select></label>
        <label>Subjek<select name="kod_subjek" required>{subjects.filter((item) => item.status === 'AKTIF').map((item) => <option key={item.kod_subjek} value={item.kod_subjek}>{item.nama_subjek}</option>)}</select></label>
        <input type="hidden" name="next_status" value="DIHANTAR" />
        <label>Catatan<input name="notes" maxLength={1000} placeholder="Catatan penghantaran (pilihan)" /></label>
        <button className="button" disabled={creating} type="submit">{creating ? 'Menghantar…' : 'Hantar untuk pengesahan'}</button>
        {createState.message ? <small className={createState.ok ? 'form-success' : 'form-message'}>{createState.message}</small> : null}
      </form>
    </section>

    <section className="panel">
      <div className="panel-head"><div><h2>Status penghantaran</h2><p>{workflows.length} skop direkodkan.</p></div></div>
      {workflows.length === 0 ? <p className="empty">Belum ada penghantaran markah.</p> : <div className="table-scroll"><table><thead><tr>
        <th>Sekolah</th><th>Peperiksaan</th><th>Kelas</th><th>Subjek</th><th>Status</th><th>Tindakan</th>
      </tr></thead><tbody>{workflows.map((row) => <tr key={row.id}>
        <td>{row.kod_sekolah}</td><td>{examMap.get(row.exam_id)?.nama_peperiksaan ?? row.exam_id}</td>
        <td>{classMap.get(row.class_id)?.nama_kelas ?? row.class_id}</td><td>{subjectMap.get(row.kod_subjek)?.nama_subjek ?? row.kod_subjek}</td>
        <td><span className={`workflow-status workflow-status-${row.status.toLowerCase()}`}>{statusLabels[row.status]}</span>{row.notes ? <small>{row.notes}</small> : null}</td>
        <td><div className="mark-workflow-actions">
          {(row.status === 'DRAF' || row.status === 'PEMBETULAN') ? <TransitionForm row={row} status="DIHANTAR" label="Hantar semula" /> : null}
          {isReviewer && row.status === 'DIHANTAR' ? <TransitionForm row={row} status="DISAHKAN" label="Sahkan" /> : null}
          {isReviewer && row.status === 'DISAHKAN' ? <TransitionForm row={row} status="DIKUNCI" label="Kunci" /> : null}
          {isReviewer && ['DIHANTAR','DISAHKAN','DIKUNCI'].includes(row.status) ? <TransitionForm row={row} status="PEMBETULAN" label="Minta pembetulan" needsNote /> : null}
        </div></td>
      </tr>)}</tbody></table></div>}
    </section>
  </>;
}
