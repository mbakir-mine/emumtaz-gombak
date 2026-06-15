import AppFrame from '../ui/AppFrame';
import { getClasses, getRphRecords, getSchools, getSchoolUsers, getSubjects, getTakwimEvents } from '@/lib/data';
import RphManager from './RphManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RphPage() {
  const [schools, classes, subjects, users, records, takwimEvents] = await Promise.all([
    getSchools(),
    getClasses(),
    getSubjects(),
    getSchoolUsers(),
    getRphRecords(),
    getTakwimEvents(),
  ]);

  return (
    <AppFrame title="RPH AI" subtitle="Bantuan draf Rancangan Pengajaran Harian guru." active="rph">
      <RphManager schools={schools} classes={classes} subjects={subjects} users={users} records={records} takwimEvents={takwimEvents} />
    </AppFrame>
  );
}
