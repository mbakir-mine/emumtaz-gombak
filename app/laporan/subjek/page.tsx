import AppFrame from '../../ui/AppFrame';
import { getClasses, getMarkDetails, getSchools } from '@/lib/data';
import SubjectReportTable from './SubjectReportTable';

export default async function LaporanSubjekPage() {
  const [schools, classes, marks] = await Promise.all([getSchools(), getClasses(), getMarkDetails()]);

  return (
    <AppFrame title="Laporan Subjek" active="reports">
      <section className="panel report-page">
        <SubjectReportTable schools={schools} classes={classes} marks={marks} />
      </section>
    </AppFrame>
  );
}
