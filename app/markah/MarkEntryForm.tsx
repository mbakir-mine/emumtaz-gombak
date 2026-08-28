'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { saveMarks } from './actions';
import type { MarkComponentRecord, MarkRecord, StudentRecord, SubjectComponentRecord } from '@/lib/data';
import { gradeForMark } from '@/lib/subjects';

const initialState = {
  ok: false,
  message: '',
};

function isWholeInput(value: string) {
  return value === '' || /^\d+$/.test(value);
}

export default function MarkEntryForm({
  examId,
  classId,
  kodSekolah,
  kodSubjek,
  students,
  marks,
  subjectComponents = [],
  componentMarks = [],
}: {
  examId: string;
  classId: string;
  kodSekolah: string;
  kodSubjek: string;
  students: StudentRecord[];
  marks: MarkRecord[];
  subjectComponents?: SubjectComponentRecord[];
  componentMarks?: MarkComponentRecord[];
}) {
  const [state, action, pending] = useActionState(saveMarks, initialState);
  const marksByStudent = useMemo(() => new Map(marks.map((mark) => [mark.student_id, mark.markah])), [marks]);
  const activeComponents = useMemo(
    () => subjectComponents.filter((component) => component.status === 'AKTIF').sort((left, right) => left.susunan - right.susunan),
    [subjectComponents],
  );
  const componentMarksByKey = useMemo(() => {
    const map = new Map<string, number | null>();
    componentMarks.forEach((mark) => {
      map.set(`${mark.student_id}|${mark.kod_komponen}`, mark.markah);
    });
    return map;
  }, [componentMarks]);
  const [componentValues, setComponentValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    students.forEach((student) => {
      activeComponents.forEach((component) => {
        const markah = componentMarksByKey.get(`${student.id}|${component.kod_komponen}`);
        initial[`${student.id}|${component.kod_komponen}`] = markah === null || markah === undefined ? '' : String(markah);
      });
    });
    return initial;
  });
  const hasComponents = activeComponents.length > 0;

  useEffect(() => {
    const next: Record<string, string> = {};
    students.forEach((student) => {
      activeComponents.forEach((component) => {
        const markah = componentMarksByKey.get(`${student.id}|${component.kod_komponen}`);
        next[`${student.id}|${component.kod_komponen}`] = markah === null || markah === undefined ? '' : String(markah);
      });
    });
    setComponentValues(next);
  }, [activeComponents, componentMarksByKey, students]);

  function updateComponentValue(studentId: string, componentCode: string, value: string) {
    if (!isWholeInput(value)) return;
    setComponentValues((current) => ({
      ...current,
      [`${studentId}|${componentCode}`]: value,
    }));
  }

  function totalForStudent(studentId: string) {
    if (!hasComponents) return marksByStudent.get(studentId) ?? null;
    let total = 0;

    for (const component of activeComponents) {
      const raw = componentValues[`${studentId}|${component.kod_komponen}`] ?? '';
      if (raw.trim() === '') return null;
      const markah = Number(raw);
      if (!Number.isFinite(markah)) return null;
      total += markah;
    }

    return total;
  }

  return (
    <form action={action} className="mark-entry-form">
      <input type="hidden" name="exam_id" value={examId} />
      <input type="hidden" name="class_id" value={classId} />
      <input type="hidden" name="kod_sekolah" value={kodSekolah} />
      <input type="hidden" name="kod_subjek" value={kodSubjek} />
      {activeComponents.map((component) => (
        <input key={component.kod_komponen} type="hidden" name="component_code" value={component.kod_komponen} />
      ))}
      {activeComponents.map((component) => (
        <input
          key={`${component.kod_komponen}-max`}
          type="hidden"
          name={`component_max_${component.kod_komponen}`}
          value={component.markah_penuh}
        />
      ))}
      {activeComponents.map((component) => (
        <input
          key={`${component.kod_komponen}-name`}
          type="hidden"
          name={`component_name_${component.kod_komponen}`}
          value={component.nama_komponen}
        />
      ))}
      {activeComponents.map((component) => (
        <input
          key={`${component.kod_komponen}-order`}
          type="hidden"
          name={`component_order_${component.kod_komponen}`}
          value={component.susunan}
        />
      ))}

      {hasComponents && (
        <div className="component-mark-banner">
          <strong>Subjek gabungan</strong>
          <span>
            Isi markah mengikut komponen. Jumlah akhir akan dikira automatik dan disimpan sebagai markah rasmi subjek ini.
          </span>
        </div>
      )}

      <table className="mark-entry-table">
        <thead>
          <tr>
            <th>Bil</th>
            <th>Nama Murid</th>
            <th>Jantina</th>
            {hasComponents ? (
              activeComponents.map((component) => (
                <th key={component.kod_komponen}>
                  {component.nama_komponen}
                  <small>/{component.markah_penuh}</small>
                </th>
              ))
            ) : (
              <th>Markah</th>
            )}
            {hasComponents && <th>Jumlah</th>}
            <th>Gred</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => {
            const markah = marksByStudent.get(student.id) ?? null;
            const totalMark = totalForStudent(student.id);
            return (
              <tr key={student.id}>
                <td>{index + 1}</td>
                <td>
                  <input type="hidden" name="student_id" value={student.id} />
                  {student.nama_murid}
                </td>
                <td>{student.jantina}</td>
                {hasComponents ? (
                  <>
                    {activeComponents.map((component) => (
                      <td key={component.kod_komponen}>
                        <input
                          className="mark-input component-mark-input"
                          name={`component_markah_${student.id}_${component.kod_komponen}`}
                          type="number"
                          min="0"
                          max={component.markah_penuh}
                          step="1"
                          inputMode="numeric"
                          value={componentValues[`${student.id}|${component.kod_komponen}`] ?? ''}
                          onKeyDown={(event) => {
                            if (['.', ',', 'e', 'E', '+', '-'].includes(event.key)) event.preventDefault();
                          }}
                          onChange={(event) => updateComponentValue(student.id, component.kod_komponen, event.target.value)}
                          placeholder="-"
                        />
                      </td>
                    ))}
                    <td className="mark-total-cell">{totalMark ?? '-'}</td>
                    <td>{gradeForMark(totalMark)}</td>
                  </>
                ) : (
                  <>
                    <td>
                      <input
                        className="mark-input"
                        name={`markah_${student.id}`}
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        inputMode="numeric"
                        defaultValue={markah ?? ''}
                        onKeyDown={(event) => {
                          if (['.', ',', 'e', 'E', '+', '-'].includes(event.key)) event.preventDefault();
                        }}
                        placeholder="-"
                      />
                    </td>
                    <td>{gradeForMark(markah)}</td>
                  </>
                )}
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
