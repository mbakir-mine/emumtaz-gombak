import AppFrame from '../../ui/AppFrame';
import { getClasses, getExams, getMarkDetails, getSchools, getStudentSummaries } from '@/lib/data';
import BestExamReport from './BestExamReport';

export default async function LaporanTerbaikPage() {
  const [schools, classes, exams, summaries, marks] = await Promise.all([
    getSchools(),
    getClasses(),
    getExams(),
    getStudentSummaries(),
    getMarkDetails(),
  ]);

  return (
    <AppFrame title="Laporan Terbaik" active="reports">
      <section className="panel report-page">
        <BestExamReport
          schools={schools}
          classes={classes}
          exams={exams}
          summaries={summaries}
          marks={marks}
        />
      </section>
    </AppFrame>
  );
}
