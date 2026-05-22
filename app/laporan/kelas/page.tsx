import AppFrame from '../../ui/AppFrame';
import { getClasses, getSchools, getStudentSummaries } from '@/lib/data';
import ClassReportTable from './ClassReportTable';

export default async function LaporanKelasPage() {
  const [schools, classes, studentSummaries] = await Promise.all([getSchools(), getClasses(), getStudentSummaries()]);

  return (
    <AppFrame title="Laporan Kelas" active="reports">
      <section className="panel report-page">
        <ClassReportTable schools={schools} classes={classes} studentSummaries={studentSummaries} />
      </section>
    </AppFrame>
  );
}
