'use client';

import { useMemo, useState } from 'react';
import type {
  ClassRecord,
  ExamRecord,
  School,
  SchoolSubjectMarkSetting,
  SubjectComponentMarkSetting,
  SubjectComponentRecord,
  SubjectRecord,
} from '@/lib/data';
import { resolveComponentFullMark, resolveSubjectFullMark } from '@/lib/markSettings';
import { supabase } from '@/lib/supabase';
import { allowedSubjectForTahun } from '@/lib/subjects';
import { useAccessProfile } from '../ui/AuthGate';

type Props = {
  schools: School[];
  classes: ClassRecord[];
  exams: ExamRecord[];
  subjects: SubjectRecord[];
  components: SubjectComponentRecord[];
  defaultComponentSettings: SubjectComponentMarkSetting[];
  initialSubjectSettings: SchoolSubjectMarkSetting[];
  initialComponentSettings: SubjectComponentMarkSetting[];
};

type Draft = Record<string, string>;

type SubjectSettingWrite = Omit<SchoolSubjectMarkSetting, 'id'> & {
  updated_by: string;
  updated_at: string;
};

type ComponentSettingWrite = Omit<SubjectComponentMarkSetting, 'id' | 'kod_sekolah'> & {
  kod_sekolah: string;
  updated_by: string;
  updated_at: string;
};

function numberText(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function positiveNumber(value: string) {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 1000 ? parsed : null;
}

function subjectKey(kodSubjek: string) {
  return `subject:${kodSubjek}`;
}

function componentKey(kodSubjek: string, kodKomponen: string) {
  return `component:${kodSubjek}:${kodKomponen}`;
}

export default function SchoolMarkSettingsManager({
  schools,
  classes,
  exams,
  subjects,
  components,
  defaultComponentSettings,
  initialSubjectSettings,
  initialComponentSettings,
}: Props) {
  const profile = useAccessProfile();
  const currentYear = new Date().getFullYear();
  const canSelectSchool = profile?.role === 'OWNER' || profile?.role === 'ADMIN_DAERAH';
  const selectableSchools = useMemo(
    () =>
      schools.filter(
        (school) =>
          school.status === 'AKTIF' && (canSelectSchool || school.kod_sekolah === profile?.kod_sekolah),
      ),
    [canSelectSchool, profile?.kod_sekolah, schools],
  );
  const academicYears = useMemo(() => {
    const values = new Set<number>([currentYear]);
    classes.forEach((item) => values.add(Number(item.tahun_akademik)));
    exams.forEach((item) => values.add(Number(item.tahun_akademik)));
    return [...values].sort((a, b) => b - a);
  }, [classes, currentYear, exams]);

  const [schoolChoice, setSchoolChoice] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(currentYear);
  const [examChoice, setExamChoice] = useState('UPSA');
  const [selectedYear, setSelectedYear] = useState(1);
  const [subjectSettings, setSubjectSettings] = useState(initialSubjectSettings);
  const [componentSettings, setComponentSettings] = useState(initialComponentSettings);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const examOptions = useMemo(() => {
    const matching = exams.filter((exam) => Number(exam.tahun_akademik) === selectedAcademicYear);
    return matching.length ? matching : exams;
  }, [exams, selectedAcademicYear]);

  const selectedSchool = selectableSchools.some((school) => school.kod_sekolah === schoolChoice)
    ? schoolChoice
    : selectableSchools[0]?.kod_sekolah ?? '';
  const selectedExam = examOptions.some((exam) => exam.kod_peperiksaan === examChoice)
    ? examChoice
    : examOptions[0]?.kod_peperiksaan ?? 'UPSA';
  const visibleSubjects = useMemo(
    () => subjects.filter((subject) => subject.status === 'AKTIF' && allowedSubjectForTahun(subject, selectedYear)),
    [selectedYear, subjects],
  );
  const draftScope = `${selectedSchool}|${selectedAcademicYear}|${selectedExam}|${selectedYear}`;
  const defaultDraft = useMemo(() => {
    const nextDraft: Draft = {};
    if (!selectedSchool || !selectedExam) return nextDraft;
    visibleSubjects.forEach((subject) => {
      const scope = {
        kodSekolah: selectedSchool,
        tahunAkademik: selectedAcademicYear,
        kodPeperiksaan: selectedExam,
        tahun: selectedYear,
        kodSubjek: subject.kod_subjek,
      };
      nextDraft[subjectKey(subject.kod_subjek)] = numberText(
        resolveSubjectFullMark(scope, subjectSettings, subjects),
      );
      components
        .filter((component) => component.kod_subjek === subject.kod_subjek && component.status === 'AKTIF')
        .forEach((component) => {
          nextDraft[componentKey(subject.kod_subjek, component.kod_komponen)] = numberText(
            resolveComponentFullMark(
              scope,
              component.kod_komponen,
              componentSettings,
              defaultComponentSettings,
              components,
            ),
          );
        });
    });
    return nextDraft;
  }, [
    componentSettings,
    components,
    defaultComponentSettings,
    selectedAcademicYear,
    selectedExam,
    selectedSchool,
    selectedYear,
    subjectSettings,
    subjects,
    visibleSubjects,
  ]);
  const draft = drafts[draftScope] ?? defaultDraft;

  function setDraft(update: (current: Draft) => Draft) {
    setDrafts((current) => ({
      ...current,
      [draftScope]: update(current[draftScope] ?? defaultDraft),
    }));
  }

  function splitEqually(subject: SubjectRecord, subjectComponents: SubjectComponentRecord[]) {
    const fullMark = positiveNumber(draft[subjectKey(subject.kod_subjek)]);
    if (!fullMark || !subjectComponents.length) return;
    const base = Math.floor((fullMark / subjectComponents.length) * 100) / 100;
    let used = 0;
    setDraft((current) => {
      const next = { ...current };
      subjectComponents.forEach((component, index) => {
        const value = index === subjectComponents.length - 1 ? fullMark - used : base;
        used += value;
        next[componentKey(subject.kod_subjek, component.kod_komponen)] = numberText(value);
      });
      return next;
    });
  }

  async function saveSettings() {
    if (!supabase || !selectedSchool || !selectedExam) return;
    setMessage('');

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setMessage('Sesi pengguna telah tamat. Sila log masuk semula.');
      return;
    }
    const authUserId = authData.user.id;

    const subjectRows: SubjectSettingWrite[] = [];
    const componentRows: ComponentSettingWrite[] = [];
    for (const subject of visibleSubjects) {
      const fullMark = positiveNumber(draft[subjectKey(subject.kod_subjek)] ?? '');
      if (!fullMark) {
        setMessage(`Markah penuh ${subject.nama_subjek} mesti melebihi 0.`);
        return;
      }

      const subjectComponents = components.filter(
        (component) => component.kod_subjek === subject.kod_subjek && component.status === 'AKTIF',
      );
      let componentTotal = 0;
      for (const component of subjectComponents) {
        const componentMark = positiveNumber(
          draft[componentKey(subject.kod_subjek, component.kod_komponen)] ?? '',
        );
        if (!componentMark) {
          setMessage(`Markah komponen ${component.nama_komponen} mesti melebihi 0.`);
          return;
        }
        componentTotal += componentMark;
        componentRows.push({
          kod_sekolah: selectedSchool,
          tahun_akademik: selectedAcademicYear,
          kod_peperiksaan: selectedExam,
          tahun: selectedYear,
          kod_subjek: subject.kod_subjek,
          kod_komponen: component.kod_komponen,
          markah_penuh: componentMark,
          status: 'AKTIF',
          updated_by: authUserId,
          updated_at: new Date().toISOString(),
        });
      }
      if (subjectComponents.length && Math.abs(componentTotal - fullMark) > 0.001) {
        setMessage(
          `Jumlah komponen ${subject.nama_subjek} ialah ${numberText(componentTotal)}, tetapi markah penuh subjek ialah ${numberText(fullMark)}.`,
        );
        return;
      }
      subjectRows.push({
        kod_sekolah: selectedSchool,
        tahun_akademik: selectedAcademicYear,
        kod_peperiksaan: selectedExam,
        tahun: selectedYear,
        kod_subjek: subject.kod_subjek,
        markah_penuh: fullMark,
        status: 'AKTIF',
        updated_by: authUserId,
        updated_at: new Date().toISOString(),
      });
    }

    setSaving(true);
    const saveResult = await supabase.rpc('save_school_mark_settings', {
      p_kod_sekolah: selectedSchool,
      p_tahun_akademik: selectedAcademicYear,
      p_kod_peperiksaan: selectedExam,
      p_tahun: selectedYear,
      p_subjects: subjectRows.map(({ kod_subjek, markah_penuh }) => ({ kod_subjek, markah_penuh })),
      p_components: componentRows.map(({ kod_subjek, kod_komponen, markah_penuh }) => ({
        kod_subjek,
        kod_komponen,
        markah_penuh,
      })),
    });
    if (saveResult.error) {
      setSaving(false);
      setMessage(`Gagal menyimpan tetapan: ${saveResult.error.message}`);
      return;
    }

    setSubjectSettings((current) => [
      ...current.filter(
        (item) =>
          !(
            item.kod_sekolah === selectedSchool &&
            Number(item.tahun_akademik) === selectedAcademicYear &&
            item.kod_peperiksaan === selectedExam &&
            Number(item.tahun) === selectedYear
          ),
      ),
      ...subjectRows.map((row) => ({
        ...row,
        id: `local:${row.kod_subjek}`,
      })),
    ]);
    setComponentSettings((current) => [
      ...current.filter(
        (item) =>
          !(
            item.kod_sekolah === selectedSchool &&
            Number(item.tahun_akademik) === selectedAcademicYear &&
            item.kod_peperiksaan === selectedExam &&
            Number(item.tahun) === selectedYear
          ),
      ),
      ...componentRows.map((row) => ({
        ...row,
        id: `local:${row.kod_subjek}:${row.kod_komponen}`,
      })),
    ]);
    setSaving(false);
    setMessage('Tetapan markah penuh sekolah berjaya disimpan.');
  }

  return (
    <section className="panel component-mark-panel">
      <div className="panel-head">
        <div>
          <h2>Tetapan Markah Sekolah</h2>
          <p>Markah akan ditukar kepada peratus secara automatik untuk gred dan laporan.</p>
        </div>
      </div>

      <div className="module-form-grid component-mark-toolbar">
        {canSelectSchool ? (
          <label>
            Sekolah
            <select value={selectedSchool} onChange={(event) => { setSchoolChoice(event.target.value); setMessage(''); }}>
              {selectableSchools.map((school) => (
                <option key={school.kod_sekolah} value={school.kod_sekolah}>
                  {school.kod_sekolah} — {school.nama_sekolah}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label>
          Tahun Akademik
          <select
            value={selectedAcademicYear}
            onChange={(event) => { setSelectedAcademicYear(Number(event.target.value)); setMessage(''); }}
          >
            {academicYears.map((year) => <option key={year}>{year}</option>)}
          </select>
        </label>
        <label>
          Peperiksaan
          <select value={selectedExam} onChange={(event) => { setExamChoice(event.target.value); setMessage(''); }}>
            {examOptions.map((exam) => (
              <option key={exam.id} value={exam.kod_peperiksaan}>{exam.nama_peperiksaan}</option>
            ))}
          </select>
        </label>
        <label>
          Tahun Murid
          <select value={selectedYear} onChange={(event) => { setSelectedYear(Number(event.target.value)); setMessage(''); }}>
            {[1, 2, 3, 4, 5, 6].map((year) => <option key={year} value={year}>Tahun {year}</option>)}
          </select>
        </label>
      </div>

      <div className="component-mark-grid">
        {visibleSubjects.map((subject) => {
          const subjectComponents = components.filter(
            (component) => component.kod_subjek === subject.kod_subjek && component.status === 'AKTIF',
          );
          const fullMark = positiveNumber(draft[subjectKey(subject.kod_subjek)] ?? '') ?? 0;
          const componentTotal = subjectComponents.reduce(
            (total, component) =>
              total + (positiveNumber(draft[componentKey(subject.kod_subjek, component.kod_komponen)] ?? '') ?? 0),
            0,
          );
          const invalidTotal = subjectComponents.length > 0 && Math.abs(componentTotal - fullMark) > 0.001;
          return (
            <article className="component-mark-card" key={subject.kod_subjek}>
              <div className="component-mark-card-head">
                <div>
                  <h3>{subject.nama_subjek}</h3>
                  <p>{subject.kod_subjek}{subjectComponents.length ? ' · Subjek gabungan' : ''}</p>
                </div>
                <strong className={invalidTotal ? 'component-total-warning' : ''}>/{numberText(fullMark)}</strong>
              </div>
              <div className="component-mark-rows">
                <label>
                  <span>Markah penuh subjek</span>
                  <input
                    type="number"
                    min="0.01"
                    max="1000"
                    step="0.01"
                    value={draft[subjectKey(subject.kod_subjek)] ?? ''}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, [subjectKey(subject.kod_subjek)]: event.target.value }))
                    }
                  />
                </label>
                {subjectComponents.map((component) => (
                  <label key={component.kod_komponen}>
                    <span>{component.nama_komponen}</span>
                    <input
                      type="number"
                      min="0.01"
                      max="1000"
                      step="0.01"
                      value={draft[componentKey(subject.kod_subjek, component.kod_komponen)] ?? ''}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          [componentKey(subject.kod_subjek, component.kod_komponen)]: event.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
              {subjectComponents.length ? (
                <div className="component-card-footer">
                  <small className={invalidTotal ? 'component-total-warning' : ''}>
                    Jumlah komponen: {numberText(componentTotal)}/{numberText(fullMark)}
                  </small>
                  <button className="button secondary-button" type="button" onClick={() => splitEqually(subject, subjectComponents)}>
                    Bahagi sama rata
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {message ? <div className={message.includes('berjaya') ? 'form-success' : 'form-message'}>{message}</div> : null}
      <div>
        <button className="button" type="button" disabled={saving || !selectedSchool} onClick={saveSettings}>
          {saving ? 'Menyimpan…' : 'Simpan Tetapan Markah'}
        </button>
      </div>
    </section>
  );
}
