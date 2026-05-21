import AppFrame from '../ui/AppFrame';
import MarkEntryForm from './MarkEntryForm';
import MarkSelectionForm from './MarkSelectionForm';
import {
  getClasses,
  getExams,
  getMarksForSelection,
  getSchools,
  getStudentsByClass,
  getSubjects,
} from '@/lib/data';

export default async function MarkahPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [schools, classes, exams, subjects] = await Promise.all([
    getSchools(),
    getClasses(),
    getExams(),
    getSubjects(),
  ]);

  const selectedSchool = params.kod_sekolah ?? '';
  const selectedClassId = params.class_id ?? '';
  const selectedExamId = params.exam_id ?? '';
  const selectedSubject = params.kod_subjek ?? '';
  const selectedClass = classes.find((item) => item.id === selectedClassId);

  const [students, marks] =
    selectedExamId && selectedClassId && selectedSubject
      ? await Promise.all([
          getStudentsByClass(selectedClassId),
          getMarksForSelection(selectedExamId, selectedClassId, selectedSubject),
        ])
      : [[], []];

  return (
    <AppFrame title="Input Markah" active="marks">
      <section className="panel">
        <div className="panel-head">
          <h2>Pilih Kelas dan Subjek</h2>
          <span>UPSA / UASA</span>
        </div>
        <MarkSelectionForm
          schools={schools}
          classes={classes}
          exams={exams}
          subjects={subjects}
          initialExamId={selectedExamId}
          initialSchool={selectedSchool}
          initialClassId={selectedClassId}
          initialSubject={selectedSubject}
        />
        {subjects.length === 0 && (
          <p className="notice mark-notice">
            Senarai subjek masih kosong. Run fail SQL <strong>007_subject_rules_by_grade.sql</strong> di Supabase
            untuk mengaktifkan subjek Tahun 1 hingga Tahun 6.
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
        ) : students.length === 0 ? (
          <p className="empty">Tiada murid aktif ditemui untuk kelas ini.</p>
        ) : (
          <MarkEntryForm
            examId={selectedExamId}
            classId={selectedClassId}
            kodSekolah={selectedClass?.kod_sekolah ?? selectedSchool}
            kodSubjek={selectedSubject}
            students={students}
            marks={marks}
          />
        )}
      </section>
    </AppFrame>
  );
}
