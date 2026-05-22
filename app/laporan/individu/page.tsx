import AppFrame from '../../ui/AppFrame';
import { getClasses, getSchools, getStudentSummaries } from '@/lib/data';
import IndividualReportTable from './IndividualReportTable';

export default async function LaporanIndividuPage() {
  const [schools, classes, summaries] = await Promise.all([getSchools(), getClasses(), getStudentSummaries()]);

  return (
    <AppFrame title="Laporan Individu" active="reports">
      <section className="panel report-page">
        <IndividualReportTable schools={schools} classes={classes} summaries={summaries} />
      </section>
    </AppFrame>
  );
}
