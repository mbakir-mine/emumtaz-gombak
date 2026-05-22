import AppFrame from '../../ui/AppFrame';
import { getSchoolSummaries, getSchools } from '@/lib/data';
import SchoolReportTable from './SchoolReportTable';

export default async function LaporanSekolahPage() {
  const [schools, summaries] = await Promise.all([getSchools(), getSchoolSummaries()]);

  return (
    <AppFrame title="Laporan Sekolah" active="reports">
      <section className="panel report-page">
        <SchoolReportTable schools={schools} summaries={summaries} />
      </section>
    </AppFrame>
  );
}
