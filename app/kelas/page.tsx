import AppFrame from '../ui/AppFrame';
import ClassOverview from './ClassOverview';
import { getClasses, getSchools } from '@/lib/data';

export default async function KelasPage() {
  const [schools, classes] = await Promise.all([getSchools(), getClasses()]);

  return (
    <AppFrame title="Kelas" subtitle="Senarai kelas mengikut sekolah." active="classes">
      <ClassOverview schools={schools} classes={classes} />
    </AppFrame>
  );
}
