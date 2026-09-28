import AppFrame from '../ui/AppFrame';
import { getSchools } from '@/lib/data';
import SchoolList from './SchoolList';
import { getSelfHostedClasses } from '@/lib/selfHostedClasses';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SekolahPage() {
  const selfHosted = await getSelfHostedClasses();
  if (selfHosted) return <AppFrame title="Sekolah" subtitle="Senarai SRA, SRAI, SRI & KAFAI Gombak." active="schools"><section className="panel">{selfHosted.schools.length === 0 ? <p className="empty">Tiada data sekolah dipaparkan.</p> : <SchoolList schools={selfHosted.schools} />}</section></AppFrame>;
  const schools = await getSchools();

  return (
    <AppFrame title="Sekolah" subtitle="Senarai SRA, SRAI, SRI & KAFAI Gombak." active="schools">
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
