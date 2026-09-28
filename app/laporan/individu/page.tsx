import AppFrame from '../../ui/AppFrame';
import {
  getClasses,
  getMarkDetails,
  getSchools,
  getStudentSummaries,
  getTeacherClassAssignments,
} from '@/lib/data';
import IndividualReportTable from './IndividualReportTable';
import { getSelfHostedIndividualReport } from '@/lib/selfHostedIndividualReport';

export default async function LaporanIndividuPage() {
  const selfHosted = await getSelfHostedIndividualReport();
  if (selfHosted) {
    return (
      <AppFrame title="Laporan Individu" active="reports">
        <section className="panel report-page">
          <IndividualReportTable {...selfHosted} />
        </section>
      </AppFrame>
    );
  }

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
