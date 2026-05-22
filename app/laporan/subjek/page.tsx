import AppFrame from '../../ui/AppFrame';
import { getClasses, getSchools, getSubjectSummaries } from '@/lib/data';
import SubjectReportTable from './SubjectReportTable';

export default async function LaporanSubjekPage() {
  const [schools, classes, summaries] = await Promise.all([getSchools(), getClasses(), getSubjectSummaries()]);

  return (
    <AppFrame title="Laporan Subjek" active="reports">
      <section className="panel report-page">
        <SubjectReportTable schools={schools} classes={classes} summaries={summaries} />
      </section>
    </AppFrame>
  );
}
