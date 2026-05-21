import AppFrame from '../ui/AppFrame';
import { getSchools } from '@/lib/data';
import SchoolList from './SchoolList';

export default async function SekolahPage() {
  const schools = await getSchools();

  return (
    <AppFrame title="Senarai Sekolah" active="schools">
      <section className="panel">
        {schools.length === 0 ? (
          <p className="empty">Tiada data sekolah dipaparkan. Semak .env.local atau import schools.</p>
        ) : (
          <SchoolList schools={schools} />
        )}
      </section>
    </AppFrame>
  );
}
