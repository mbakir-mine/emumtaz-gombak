'use client';

import { useFormStatus } from 'react-dom';
import type { ExamRecord } from '@/lib/data';
import { updateExamAccess } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="button" type="submit" disabled={pending}>
      {pending ? 'Simpan...' : 'Simpan'}
    </button>
  );
}

export default function ExamAccessForm({ exam }: { exam: ExamRecord }) {
  return (
    <form action={updateExamAccess} className="exam-access-form">
      <input type="hidden" name="id" value={exam.id} />
      <div>
        <strong>{exam.tahun_akademik}</strong>
      </div>
      <label>
        Buka
        <input name="buka_markah" type="date" defaultValue={exam.buka_markah ?? ''} />
      </label>
      <label>
        Tutup
        <input name="tutup_markah" type="date" defaultValue={exam.tutup_markah ?? ''} />
      </label>
      <label>
        Status
        <select name="status" defaultValue={exam.status}>
          <option value="DIBUKA">Dibuka</option>
          <option value="DITUTUP">Ditutup</option>
        </select>
      </label>
      <SubmitButton />
    </form>
  );
}
