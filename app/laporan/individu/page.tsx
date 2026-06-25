import AppFrame from '../../ui/AppFrame';
import {
  getClasses,
  getMarkDetails,
  getSchools,
  getStudentSummaries,
  getTeacherClassAssignments,
} from '@/lib/data';
import IndividualReportTable from './IndividualReportTable';

export default async function LaporanIndividuPage() {
  const [schools, classes, summaries, teacherClassAssignments, marks] = await Promise.all([
    getSchools(),
    getClasses(),
    getStudentSummaries(),
    getTeacherClassAssignments(),
    getMarkDetails(),
  ]);

  return (
    <AppFrame title="Laporan Individu" active="reports">
      <section className="panel report-page">
        <IndividualReportTable
          schools={schools}
          classes={classes}
          summaries={summaries}
          teacherClassAssignments={teacherClassAssignments}
          marks={marks}
        />
      </section>
    </AppFrame>
  );
}
