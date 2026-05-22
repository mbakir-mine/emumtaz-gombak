import AppFrame from '../../ui/AppFrame';
import { getSchools, getStudentSummaries } from '@/lib/data';
import IndividualReportTable from './IndividualReportTable';

export default async function LaporanIndividuPage() {
  const [schools, summaries] = await Promise.all([getSchools(), getStudentSummaries()]);

  return (
    <AppFrame title="Laporan Individu" active="reports">
      <section className="panel report-page">
        <IndividualReportTable schools={schools} summaries={summaries} />
      </section>
    </AppFrame>
  );
}
