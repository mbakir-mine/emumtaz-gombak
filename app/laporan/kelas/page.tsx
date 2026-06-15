import AppFrame from '../../ui/AppFrame';
import {
  getClasses,
  getExams,
  getMarkDetails,
  getSchools,
  getStudents,
  getSubjects,
  getTeacherClassAssignments,
} from '@/lib/data';
import ClassReportTable from './ClassReportTable';

export default async function LaporanKelasPage() {
  const [schools, classes, students, subjects, exams, marks, teacherClassAssignments] = await Promise.all([
    getSchools(),
    getClasses(),
    getStudents(),
    getSubjects(),
    getExams(),
    getMarkDetails(),
    getTeacherClassAssignments(),
  ]);

  return (
    <AppFrame title="Laporan Kelas" active="reports">
      <section className="panel report-page">
        <ClassReportTable
          schools={schools}
          classes={classes}
          students={students}
          subjects={subjects}
          exams={exams}
          marks={marks}
          teacherClassAssignments={teacherClassAssignments}
        />
      </section>
    </AppFrame>
  );
}
