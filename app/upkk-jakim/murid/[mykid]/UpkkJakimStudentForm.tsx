'use client';

import Link from 'next/link';
import { useActionState, useMemo } from 'react';
import type {
  ClassRecord,
  School,
  SchoolModuleAccess,
  StudentRecord,
  UpkkJakimItemMarkRecord,
  UpkkJakimMarkRecord,
} from '@/lib/data';
import {
  upkkAssessmentFormCode,
  upkkAssessmentLabel,
  upkkAssessmentOfficialTitle,
  upkkComponentsByType,
  upkkJakimAssessmentOptions,
  upkkTotalMaxMark,
  type UpkkJakimAssessmentType,
  type UpkkJakimComponent,
} from '@/lib/upkkJakim';
import { upkkScorableQuestionsByType, type UpkkScorableQuestion } from '@/lib/upkkJakimQuestions';
import { useAccessProfile } from '../../../ui/AuthGate';
import { saveUpkkJakimMarks, type UpkkJakimActionState } from '../../actions';

const initialState: UpkkJakimActionState = { ok: false, message: '' };

function classLabel(item: ClassRecord) {
  return `Tahun ${item.tahun} - ${item.nama_kelas}`;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function studentGenderLabel(value: string | null) {
  if (value === 'P' || value?.toLowerCase() === 'perempuan') return 'Perempuan';
  return 'Lelaki';
}

export default function UpkkJakimStudentForm({
  school,
  selectedClass,
  student,
  marks,
  itemMarks,
  moduleAccesses,
  assessmentType,
  year,
  backHref,
}: {
  school: School;
  selectedClass: ClassRecord;
  student: StudentRecord;
  marks: UpkkJakimMarkRecord[];
  itemMarks: UpkkJakimItemMarkRecord[];
  moduleAccesses: SchoolModuleAccess[];
  assessmentType: UpkkJakimAssessmentType;
  year: number;
  backHref: string;
}) {
  const profile = useAccessProfile();
  const [state, action, pending] = useActionState(saveUpkkJakimMarks, initialState);
  const components = useMemo(() => upkkComponentsByType(assessmentType), [assessmentType]);
  const questions = useMemo(() => upkkScorableQuestionsByType(assessmentType), [assessmentType]);
  const maxTotal = upkkTotalMaxMark(assessmentType);
  const officialFormCode = upkkAssessmentFormCode(assessmentType);
  const officialTitle = upkkAssessmentOfficialTitle(assessmentType);
  const assessmentShortLabel =
    upkkJakimAssessmentOptions.find((item) => item.value === assessmentType)?.shortLabel ?? assessmentType;

  const allowedForSchool =
    profile?.role === 'OWNER' ||
    profile?.role === 'ADMIN_DAERAH' ||
    (profile?.role === 'ADMIN_ZON' && profile.zon === school.zon) ||
    profile?.kod_sekolah === school.kod_sekolah;
  const moduleEnabled =
    profile?.role === 'OWNER' ||
    moduleAccesses.some(
      (access) => access.kod_sekolah === school.kod_sekolah && access.module_key === 'UPKK_JAKIM' && access.enabled,
    );

  const summaryMarkMap = useMemo(() => {
    const map = new Map<string, UpkkJakimMarkRecord>();
    marks
      .filter(
        (mark) =>
          mark.tahun_akademik === year &&
          mark.class_id === selectedClass.id &&
          mark.student_id === student.mykid &&
          mark.assessment_type === assessmentType,
      )
      .forEach((mark) => map.set(mark.component_key, mark));
    return map;
  }, [assessmentType, marks, selectedClass.id, student.mykid, year]);

  const itemMarkMap = useMemo(() => {
    const map = new Map<string, UpkkJakimItemMarkRecord>();
    itemMarks
      .filter(
        (mark) =>
          mark.tahun_akademik === year &&
          mark.class_id === selectedClass.id &&
          mark.student_id === student.mykid &&
          mark.assessment_type === assessmentType,
      )
      .forEach((mark) => map.set(mark.item_key, mark));
    return map;
  }, [assessmentType, itemMarks, selectedClass.id, student.mykid, year]);

  function componentTotal(componentKey: string) {
    const componentItemMarks = [...itemMarkMap.values()].filter((mark) => mark.component_key === componentKey);
    if (componentItemMarks.length > 0) {
      return componentItemMarks.reduce((sum, mark) => sum + (mark.markah ?? 0), 0);
    }
    return summaryMarkMap.get(componentKey)?.markah ?? 0;
  }

  function questionsForComponent(componentKey: string): UpkkScorableQuestion[] {
    return questions.filter((question) => question.componentKey === componentKey);
  }

  const studentTotal = components.reduce((sum, component) => sum + componentTotal(component.key), 0);

  if (!allowedForSchool || !moduleEnabled) {
    return (
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Akses UPKK JAKIM belum dibenarkan</h2>
            <p>Sekolah ini perlu diberi akses modul UPKK JAKIM oleh Pentadbir Utama terlebih dahulu.</p>
          </div>
          <Link className="button secondary" href="/upkk-jakim">
            Kembali
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="panel optional-module-panel upkk-panel upkk-student-page no-print">
      <form action={action} className="upkk-student-detail-form">
        <input type="hidden" name="kod_sekolah" value={school.kod_sekolah} />
        <input type="hidden" name="tahun_akademik" value={year} />
        <input type="hidden" name="class_id" value={selectedClass.id} />
        <input type="hidden" name="assessment_type" value={assessmentType} />
        <input type="hidden" name="teacher_id" value={profile?.id ?? ''} />
        <input type="hidden" name="student_id" value={student.mykid} />

        <div className="panel-head compact-head">
          <div>
            <h2>
              Borang {assessmentShortLabel} - {student.nama_murid}
            </h2>
            <p className="table-note">
              {school.kod_sekolah} - {school.nama_sekolah} | {classLabel(selectedClass)} {year} |{' '}
              {studentGenderLabel(student.jantina)}
            </p>
          </div>
          <div className="upkk-detail-actions">
            <span>
              {formatNumber(studentTotal)} / {formatNumber(maxTotal)}
            </span>
            <button className="button secondary" type="button" onClick={() => window.print()}>
              Cetak Borang
            </button>
            <Link className="button secondary" href={backHref}>
              Kembali
            </Link>
          </div>
        </div>

        <div className="upkk-question-sections">
          {components.map((component) => {
            const componentQuestions = questionsForComponent(component.key);
            const subtotal = componentTotal(component.key);
            return (
              <article className="upkk-question-section" key={component.key}>
                <div className="upkk-question-section-head">
                  <div>
                    <span>{component.section}</span>
                    <strong>{component.title}</strong>
                  </div>
                  <em>
                    {formatNumber(subtotal)} / {formatNumber(component.maxMark)}
                  </em>
                </div>
                {component.key === 'PCHI_D' && (
                  <p className="upkk-section-note">
                    Bahagian D mempunyai banyak item pilihan. Isi item yang berkaitan sahaja dan jumlah bahagian ini
                    dikawal maksimum {formatNumber(component.maxMark)} markah.
                  </p>
                )}
                <div className="upkk-question-list">
                  {componentQuestions.map((question) => {
                    const saved = itemMarkMap.get(question.key);
                    return (
                      <label className="upkk-question-row" key={question.key}>
                        <span className="upkk-question-copy">
                          <strong>
                            {question.number} {question.title}
                          </strong>
                          {question.helper && <small>{question.helper}</small>}
                        </span>
                        <input
                          className="upkk-score-input"
                          name={`item_mark_${question.key}`}
                          type="number"
                          min="0"
                          max={question.maxMark}
                          step="0.5"
                          defaultValue={saved?.markah ?? ''}
                          placeholder={`/${formatNumber(question.maxMark)}`}
                        />
                      </label>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>

        <div className="form-actions">
          <button className="button" type="submit" disabled={pending}>
            {pending ? 'Menyimpan...' : `Simpan ${assessmentShortLabel}`}
          </button>
          {state.message && <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>}
        </div>
      </form>
      </section>

      <OfficialUpkkPrintSheet
        assessmentShortLabel={assessmentShortLabel}
        components={components}
        componentTotal={componentTotal}
        formCode={officialFormCode}
        maxTotal={maxTotal}
        officialTitle={officialTitle}
        questionsForComponent={questionsForComponent}
        school={school}
        selectedClass={selectedClass}
        student={student}
        studentTotal={studentTotal}
        itemMarkMap={itemMarkMap}
        year={year}
      />
    </>
  );
}

const UPKK_GROUP_LABELS: Record<string, string> = {
  A1: 'ADAB DENGAN KELUARGA',
  A2: 'ADAB DALAM KEHIDUPAN SEHARIAN',
  A3: 'ADAB MENUNTUT ILMU',
  A4: 'ADAB BERJIRAN DAN BERMASYARAKAT',
  B1: 'TAHARAH DAN ISTINJAK',
  B2: 'WUDUK DAN TAYAMUM',
  B3: 'NAJIS',
  B4: 'HADAS KECIL DAN HADAS BESAR',
  B5: 'KONSEP BALIGH',
  B6: 'SOLAT',
  B7: 'PUASA',
  C1: 'RUKUN ISLAM',
  C2: 'RUKUN IMAN',
  C3: "PERKARA SAM'IYYAT",
};

function OfficialUpkkPrintSheet({
  assessmentShortLabel,
  components,
  componentTotal,
  formCode,
  maxTotal,
  officialTitle,
  questionsForComponent,
  school,
  selectedClass,
  student,
  studentTotal,
  itemMarkMap,
  year,
}: {
  assessmentShortLabel: string;
  components: UpkkJakimComponent[];
  componentTotal: (componentKey: string) => number;
  formCode: string;
  maxTotal: number;
  officialTitle: string;
  questionsForComponent: (componentKey: string) => UpkkScorableQuestion[];
  school: School;
  selectedClass: ClassRecord;
  student: StudentRecord;
  studentTotal: number;
  itemMarkMap: Map<string, UpkkJakimItemMarkRecord>;
  year: number;
}) {
  const assessmentClass = components.some((component) => component.key.startsWith('AMALI')) ? 'amali' : 'pchi';
  const totalLabel = `JUMLAH MARKAH BAHAGIAN ${components
    .map((component) => component.section.replace(/^Bahagian\s+/i, ''))
    .join('+')}`;

  return (
    <section className="upkk-official-print-sheet upkk-print-only" aria-label={`Borang rasmi ${assessmentShortLabel}`}>
      <div className={`upkk-official-page upkk-official-page-${assessmentClass}`}>
        <div className="upkk-official-border">
          <div className="upkk-official-code">{formCode}</div>
          <div className="upkk-official-agency">
            <img alt="Jata Negara" src="/jata-negara.png" />
            <span>JABATAN PERDANA MENTERI</span>
            <span>JABATAN KEMAJUAN ISLAM MALAYSIA</span>
          </div>
          <div className="upkk-official-title">
            <h2>UJIAN PENILAIAN KELAS AL-QURAN DAN FARDU AIN (UPKK)</h2>
            <h3>{officialTitle.toUpperCase()}</h3>
            <strong>TAHUN {year}</strong>
          </div>

          <div className="upkk-official-fields">
            <OfficialField label="NAMA CALON" value={student.nama_murid} />
            <OfficialField label="NAMA SEKOLAH" value={school.nama_sekolah} />
            <OfficialField label="NO. KAD PENGENALAN" value={student.mykid} />
            <OfficialField label="KOD SEKOLAH" value={school.kod_sekolah} />
            <OfficialField label="ANGKA GILIRAN" value="-" />
            <OfficialField label="KELAS" value={classLabel(selectedClass)} />
          </div>

          <div className={`upkk-official-sections upkk-official-sections-${assessmentClass}`}>
            {components.map((component) => (
              <OfficialComponentTable
                component={component}
                componentTotal={componentTotal(component.key)}
                itemMarkMap={itemMarkMap}
                key={component.key}
                questions={questionsForComponent(component.key)}
              />
            ))}
          </div>

          <table className="upkk-official-grand-total">
            <tbody>
              <tr>
                <th>{totalLabel}</th>
                <td>{formatNumber(maxTotal)}</td>
                <td>{formatNumber(studentTotal)}</td>
              </tr>
            </tbody>
          </table>

          <div className="upkk-official-signatures">
            <div>
              <strong>TANDATANGAN PENILAI:</strong>
              <i />
              <span>TARIKH:</span>
            </div>
            <div>
              <strong>TANDATANGAN GURU BESAR:</strong>
              <i />
              <span>TARIKH:</span>
              <small>CAP RASMI SEKOLAH</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OfficialField({ label, value }: { label: string; value: string }) {
  return (
    <div className="upkk-official-field">
      <span>{label}:</span>
      <b>{value}</b>
    </div>
  );
}

function OfficialComponentTable({
  component,
  componentTotal,
  itemMarkMap,
  questions,
}: {
  component: UpkkJakimComponent;
  componentTotal: number;
  itemMarkMap: Map<string, UpkkJakimItemMarkRecord>;
  questions: UpkkScorableQuestion[];
}) {
  const groupedQuestions = groupOfficialQuestions(questions);
  const sectionLetter = component.section.replace(/^Bahagian\s+/i, '');

  return (
    <table className="upkk-official-component-table">
      <thead>
        <tr>
          <th>KOD</th>
          <th>{component.section.toUpperCase()} : {component.title.toUpperCase()}</th>
          <th>SOALAN</th>
          <th>MARKAH PENUH</th>
          <th>MARKAH DIPEROLEHI</th>
        </tr>
      </thead>
      <tbody>
        {groupedQuestions.length === 0 ? (
          <tr>
            <td colSpan={5}>Tiada item penilaian.</td>
          </tr>
        ) : (
          groupedQuestions.map((group) =>
            group.questions.map((question, index) => {
              const saved = itemMarkMap.get(question.key);
              return (
                <tr key={question.key}>
                  {index === 0 ? <td rowSpan={group.questions.length}>{group.code}</td> : null}
                  {index === 0 ? <td rowSpan={group.questions.length}>{group.label}</td> : null}
                  <td>{question.number}</td>
                  <td>{formatNumber(question.maxMark)}</td>
                  <td>{saved?.markah == null ? '' : formatNumber(saved.markah)}</td>
                </tr>
              );
            })
          )
        )}
        <tr className="upkk-official-component-total">
          <td colSpan={3}>JUMLAH MARKAH BAHAGIAN {sectionLetter}</td>
          <td>{formatNumber(component.maxMark)}</td>
          <td>{formatNumber(componentTotal)}</td>
        </tr>
      </tbody>
    </table>
  );
}

function groupOfficialQuestions(questions: UpkkScorableQuestion[]) {
  return questions.reduce<Array<{ code: string; label: string; questions: UpkkScorableQuestion[] }>>((groups, question) => {
    const code = question.number.split('.')[0] || question.number;
    const lastGroup = groups[groups.length - 1];
    if (lastGroup?.code === code) {
      lastGroup.questions.push(question);
      return groups;
    }

    groups.push({
      code,
      label: UPKK_GROUP_LABELS[code] || question.title,
      questions: [question],
    });
    return groups;
  }, []);
}
