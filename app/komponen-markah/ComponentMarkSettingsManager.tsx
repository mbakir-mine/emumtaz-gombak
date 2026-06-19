'use client';

import { useActionState, useMemo, useState } from 'react';
import type { ExamRecord, SubjectComponentMarkSetting, SubjectComponentRecord, SubjectRecord } from '@/lib/data';
import { compareExamCode } from '@/lib/examOrdering';
import { allowedSubjectForTahun } from '@/lib/subjects';
import { saveComponentMarkSettings, type ComponentMarkActionState } from './actions';

const initialState: ComponentMarkActionState = { ok: false, message: '' };

function contextKey(tahunAkademik: number, kodPeperiksaan: string, tahun: number, kodSubjek: string, kodKomponen: string) {
  return [tahunAkademik, kodPeperiksaan, tahun, kodSubjek, kodKomponen].join('|');
}

export default function ComponentMarkSettingsManager({
  exams,
  subjects,
  components,
  settings,
}: {
  exams: ExamRecord[];
  subjects: SubjectRecord[];
  components: SubjectComponentRecord[];
  settings: SubjectComponentMarkSetting[];
}) {
  const years = [...new Set(exams.map((exam) => exam.tahun_akademik))].sort((a, b) => b - a);
  const examCodes = [...new Set(exams.map((exam) => exam.kod_peperiksaan))].sort(compareExamCode);
  const [selectedYear, setSelectedYear] = useState(years[0] ?? new Date().getFullYear());
  const [selectedExamCode, setSelectedExamCode] = useState(examCodes[0] ?? 'UPSA');
  const [selectedTahun, setSelectedTahun] = useState(3);
  const [markValues, setMarkValues] = useState<Record<string, string>>({});
  const [state, action, pending] = useActionState(saveComponentMarkSettings, initialState);

  const settingMap = useMemo(() => {
    const map = new Map<string, SubjectComponentMarkSetting>();
    settings.forEach((setting) => {
      map.set(
        contextKey(
          setting.tahun_akademik,
          setting.kod_peperiksaan,
          setting.tahun,
          setting.kod_subjek,
          setting.kod_komponen,
        ),
        setting,
      );
    });
    return map;
  }, [settings]);

  const groupedSubjects = subjects
    .filter(
      (subject) =>
        subject.status === 'AKTIF' &&
        allowedSubjectForTahun(subject, selectedTahun) &&
        components.some((component) => component.kod_subjek === subject.kod_subjek && component.status === 'AKTIF'),
    )
    .map((subject) => ({
      subject,
      components: components
        .filter((component) => component.kod_subjek === subject.kod_subjek && component.status === 'AKTIF')
        .sort((a, b) => a.susunan - b.susunan),
    }));

  function componentInputValue(component: SubjectComponentRecord) {
    const key = contextKey(selectedYear, selectedExamCode, selectedTahun, component.kod_subjek, component.kod_komponen);
    const saved = settingMap.get(key);
    return markValues[key] ?? String(saved?.markah_penuh ?? component.markah_penuh);
  }

  return (
    <section className="panel component-mark-panel">
      <div className="panel-head">
        <div>
          <h2>Tetapan Komponen Markah</h2>
          <p className="table-note">
            Pecahan ini digunakan semasa guru mengisi markah subjek gabungan seperti Imlak dan Khat.
          </p>
        </div>
        <span>{groupedSubjects.length} subjek gabungan</span>
      </div>

      <div className="module-toolbar component-mark-toolbar">
        <label>
          Tahun Akademik
          <select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label>
          Peperiksaan
          <select value={selectedExamCode} onChange={(event) => setSelectedExamCode(event.target.value)}>
            {examCodes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tahun Murid
          <select value={selectedTahun} onChange={(event) => setSelectedTahun(Number(event.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((tahun) => (
              <option key={tahun} value={tahun}>
                Tahun {tahun}
              </option>
            ))}
          </select>
        </label>
      </div>

      <form action={action} className="component-mark-form">
        <input type="hidden" name="tahun_akademik" value={selectedYear} />
        <input type="hidden" name="kod_peperiksaan" value={selectedExamCode} />
        <input type="hidden" name="tahun" value={selectedTahun} />

        {groupedSubjects.length === 0 ? (
          <p className="empty">Tiada subjek gabungan untuk pilihan ini.</p>
        ) : (
          <div className="component-mark-grid">
            {groupedSubjects.map(({ subject, components: subjectComponents }) => {
              const total = subjectComponents.reduce((sum, component) => {
                const value = Number(componentInputValue(component));
                return sum + (Number.isFinite(value) ? value : 0);
              }, 0);

              return (
                <div className="component-mark-card" key={subject.kod_subjek}>
                  <div className="component-mark-card-head">
                    <div>
                      <h3>{subject.nama_subjek}</h3>
                      <p>{subject.kod_subjek}</p>
                    </div>
                    <strong className={Math.abs(total - 100) > 0.001 ? 'component-total-warning' : ''}>
                      {total}/100
                    </strong>
                  </div>
                  <div className="component-mark-rows">
                    {subjectComponents.map((component) => {
                      const key = contextKey(selectedYear, selectedExamCode, selectedTahun, component.kod_subjek, component.kod_komponen);
                      return (
                        <label key={`${component.kod_subjek}-${component.kod_komponen}`}>
                          <span>{component.nama_komponen}</span>
                          <input type="hidden" name="kod_subjek" value={component.kod_subjek} />
                          <input type="hidden" name="nama_subjek" value={subject.nama_subjek} />
                          <input type="hidden" name="kod_komponen" value={component.kod_komponen} />
                          <input
                            name="markah_penuh"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={componentInputValue(component)}
                            onChange={(event) =>
                              setMarkValues((current) => ({
                                ...current,
                                [key]: event.target.value,
                              }))
                            }
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="form-actions">
          <button className="button" type="submit" disabled={pending || groupedSubjects.length === 0}>
            {pending ? 'Menyimpan...' : 'Simpan Tetapan Komponen Markah'}
          </button>
          {state.message && <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>}
        </div>
      </form>
    </section>
  );
}
