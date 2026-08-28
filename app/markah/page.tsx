import AppFrame from '../ui/AppFrame';
import MarkEntryForm from './MarkEntryForm';
import MarkSelectionForm from './MarkSelectionForm';
import {
  getClasses,
  getExams,
  getMarkComponentsForSelection,
  getMarksForSelection,
  getSchoolModuleAccesses,
  getSchools,
  getSubjectComponentMarkSettings,
  getStudentsByClass,
  getSubjectComponents,
  getTeacherSubjectAssignments,
  getTeacherSubjectComponentAssignments,
  getSubjects,
} from '@/lib/data';
import { examAccessStatus } from '@/lib/examAccess';
import { isPsraExamCode } from '@/lib/examOrdering';
import { applySubjectComponentMarkSettings } from '@/lib/subjectComponents';

export default async function MarkahPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [
    schools,
    classes,
    exams,
    subjects,
    subjectComponents,
    componentMarkSettings,
    subjectAssignments,
    componentAssignments,
    moduleAccesses,
  ] = await Promise.all([
    getSchools(),
    getClasses(),
    getExams(),
    getSubjects(),
    getSubjectComponents(),
    getSubjectComponentMarkSettings(),
    getTeacherSubjectAssignments(),
    getTeacherSubjectComponentAssignments(),
    getSchoolModuleAccesses(),
  ]);

  const selectedSchool = params.kod_sekolah ?? '';
  const selectedClassId = params.class_id ?? '';
  const selectedExamId = params.exam_id ?? '';
  const selectedSubject = params.kod_subjek ?? '';
  const selectedMode = params.mode === 'mine' ? 'mine' : 'school';
  const currentYear = new Date().getFullYear();
  const selectedYear = Number(params.tahun_akademik ?? currentYear);
  const selectedClass = classes.find((item) => item.id === selectedClassId);
  const selectedExam = exams.find((exam) => exam.id === selectedExamId);
  const markAccess = examAccessStatus(selectedExam);
  const selectedPsraWithoutAccess = Boolean(
    selectedExam &&
      isPsraExamCode(selectedExam.kod_peperiksaan) &&
      selectedSchool &&
      !moduleAccesses.some(
        (access) =>
          access.kod_sekolah === selectedSchool &&
          access.module_key === 'PERCUBAAN_PSRA' &&
          access.enabled,
      ),
  );

  const selectedSubjectComponents = applySubjectComponentMarkSettings(
    subjectComponents.filter((component) => component.kod_subjek === selectedSubject),
    componentMarkSettings,
    {
      tahun_akademik: selectedYear,
      kod_peperiksaan: selectedExam?.kod_peperiksaan,
      tahun: selectedClass?.tahun,
    },
  );
  const [students, marks, componentMarks] =
    selectedExamId && selectedClassId && selectedSubject && !selectedPsraWithoutAccess
      ? await Promise.all([
          getStudentsByClass(selectedClassId),
          getMarksForSelection(selectedExamId, selectedClassId, selectedSubject),
          selectedSubjectComponents.length > 0
            ? getMarkComponentsForSelection(selectedExamId, selectedClassId, selectedSubject)
            : Promise.resolve([]),
        ])
      : [[], [], []];

  return (
    <AppFrame title="Markah" subtitle="Kemasukan UPSA, UASA dan Percubaan PSRA." active="marks">
      <section className="panel">
        <div className="panel-head">
          <h2>Pilih Kelas dan Subjek</h2>
          <span>UPSA / UASA / PSRA</span>
        </div>
        <MarkSelectionForm
          schools={schools}
          classes={classes}
          exams={exams}
          subjects={subjects}
          subjectAssignments={subjectAssignments}
          componentAssignments={componentAssignments}
          moduleAccesses={moduleAccesses}
          initialYear={selectedYear}
          initialExamId={selectedExamId}
          initialSchool={selectedSchool}
          initialClassId={selectedClassId}
          initialSubject={selectedSubject}
          initialMode={selectedMode}
        />
        {subjects.length === 0 && (
          <p className="notice mark-notice">
            Senarai subjek masih kosong. Run fail SQL <strong>007_subject_rules_by_grade.sql</strong> di Supabase
            untuk mengaktifkan subjek Tahun 1 hingga Tahun 6.
          </p>
        )}
        {selectedExamId && (
          <p className={markAccess.open ? 'form-success mark-notice' : 'notice mark-notice'}>
            {markAccess.label}
          </p>
        )}
        {selectedPsraWithoutAccess && (
          <p className="notice mark-notice">
            Sekolah ini belum dibenarkan akses Percubaan PSRA. Pilih sekolah yang telah diaktifkan dalam Akses Modul Sekolah.
          </p>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Senarai Markah</h2>
          <span>{students.length} murid</span>
        </div>
        {!selectedExamId || !selectedClassId || !selectedSubject ? (
          <p className="empty">Pilih peperiksaan, sekolah, kelas dan subjek untuk mula isi markah.</p>
        ) : selectedPsraWithoutAccess ? (
          <p className="empty">Sekolah ini belum diberi akses Percubaan PSRA.</p>
        ) : students.length === 0 ? (
          <p className="empty">Tiada murid aktif ditemui untuk kelas ini.</p>
        ) : !markAccess.open ? (
          <p className="empty">{markAccess.label}</p>
        ) : (
          <MarkEntryForm
            examId={selectedExamId}
            classId={selectedClassId}
            kodSekolah={selectedClass?.kod_sekolah ?? selectedSchool}
            kodSubjek={selectedSubject}
            students={students}
            marks={marks}
            subjectComponents={selectedSubjectComponents}
            componentMarks={componentMarks}
          />
        )}
      </section>
    </AppFrame>
  );
}
