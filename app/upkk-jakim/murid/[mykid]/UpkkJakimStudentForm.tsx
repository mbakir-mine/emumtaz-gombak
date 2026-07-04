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
  return (
    <section className="upkk-print-sheet upkk-print-only">
      <div className="upkk-print-code">{formCode}</div>
      <div className="upkk-print-title">
        <h2>Ujian Penilaian Kelas Al-Quran Dan Fardu Ain (UPKK)</h2>
        <h3>{officialTitle}</h3>
      </div>

      <table className="upkk-print-meta">
        <tbody>
          <tr>
            <th>Tahun</th>
            <td>{year}</td>
            <th>Nama Calon</th>
            <td>{student.nama_murid}</td>
          </tr>
          <tr>
            <th>Nama Sekolah</th>
            <td>{school.nama_sekolah}</td>
            <th>No. Kad Pengenalan</th>
            <td>{student.mykid}</td>
          </tr>
          <tr>
            <th>Kod Sekolah</th>
            <td>{school.kod_sekolah}</td>
            <th>Angka Giliran</th>
            <td>-</td>
          </tr>
          <tr>
            <th>Kelas</th>
            <td>{classLabel(selectedClass)}</td>
            <th>Penilaian</th>
            <td>{assessmentShortLabel}</td>
          </tr>
        </tbody>
      </table>

      <table className="upkk-print-table">
        <thead>
          <tr>
            <th>Bil</th>
            <th>Bahagian</th>
            <th>Item Penilaian</th>
            <th>Markah Penuh</th>
            <th>Markah</th>
          </tr>
        </thead>
        <tbody>
          {components.map((component) => (
            <FragmentRows
              component={component}
              componentTotal={componentTotal(component.key)}
              itemMarkMap={itemMarkMap}
              key={component.key}
              questions={questionsForComponent(component.key)}
            />
          ))}
          <tr className="upkk-print-total-row">
            <td colSpan={3}>Jumlah Keseluruhan</td>
            <td>{formatNumber(maxTotal)}</td>
            <td>{formatNumber(studentTotal)}</td>
          </tr>
        </tbody>
      </table>

      <div className="upkk-print-signatures">
        <div>
          <span>Disediakan oleh,</span>
          <i />
        </div>
        <div>
          <span>Disemak oleh,</span>
          <i />
        </div>
        <div>
          <span>Disahkan oleh,</span>
          <i />
        </div>
      </div>
    </section>
  );
}

function FragmentRows({
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
  return (
    <>
      <tr className="upkk-print-section-row">
        <td />
        <td colSpan={2}>
          {component.section}: {component.title}
        </td>
        <td>{formatNumber(component.maxMark)}</td>
        <td>{formatNumber(componentTotal)}</td>
      </tr>
      {questions.map((question, index) => {
        const saved = itemMarkMap.get(question.key);
        return (
          <tr key={question.key}>
            <td>{index + 1}</td>
            <td>{question.section}</td>
            <td>
              {question.number} {question.title}
            </td>
            <td>{formatNumber(question.maxMark)}</td>
            <td>{saved?.markah == null ? '' : formatNumber(saved.markah)}</td>
          </tr>
        );
      })}
    </>
  );
}
