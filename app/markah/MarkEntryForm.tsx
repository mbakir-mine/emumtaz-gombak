'use client';

import { useActionState } from 'react';
import { saveMarks } from './actions';
import type { MarkRecord, StudentRecord } from '@/lib/data';
import { gradeForMark } from '@/lib/subjects';

const initialState = {
  ok: false,
  message: '',
};

export default function MarkEntryForm({
  examId,
  classId,
  kodSekolah,
  kodSubjek,
  students,
  marks,
}: {
  examId: string;
  classId: string;
  kodSekolah: string;
  kodSubjek: string;
  students: StudentRecord[];
  marks: MarkRecord[];
}) {
  const [state, action, pending] = useActionState(saveMarks, initialState);
  const marksByStudent = new Map(marks.map((mark) => [mark.student_id, mark.markah]));

  return (
    <form action={action} className="mark-entry-form">
      <input type="hidden" name="exam_id" value={examId} />
      <input type="hidden" name="class_id" value={classId} />
      <input type="hidden" name="kod_sekolah" value={kodSekolah} />
      <input type="hidden" name="kod_subjek" value={kodSubjek} />

      <table className="mark-entry-table">
        <thead>
          <tr>
            <th>Bil</th>
            <th>Nama Murid</th>
            <th>Jantina</th>
            <th>Markah</th>
            <th>Gred</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => {
            const markah = marksByStudent.get(student.id) ?? null;
            return (
              <tr key={student.id}>
                <td>{index + 1}</td>
                <td>
                  <input type="hidden" name="student_id" value={student.id} />
                  {student.nama_murid}
                </td>
                <td>{student.jantina}</td>
                <td>
                  <input
                    className="mark-input"
                    name={`markah_${student.id}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    defaultValue={markah ?? ''}
                    placeholder="-"
                  />
                </td>
                <td>{gradeForMark(markah)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="form-actions mark-actions">
        <button className="button" type="submit" disabled={pending}>
          {pending ? 'Menyimpan...' : 'Simpan Markah'}
        </button>
        {state.message && <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>}
      </div>
    </form>
  );
}
