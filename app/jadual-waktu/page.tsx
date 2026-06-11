import AppFrame from '../ui/AppFrame';
import {
  getClasses,
  getSchools,
  getSchoolUsers,
  getSubjects,
  getTimetableEntries,
  getTimetableRequirements,
  getTimetableSlots,
} from '@/lib/data';
import TimetableManager from './TimetableManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TimetablePage() {
  const [schools, classes, subjects, users, slots, entries, requirements] = await Promise.all([
    getSchools(),
    getClasses(),
    getSubjects(),
    getSchoolUsers(),
    getTimetableSlots(),
    getTimetableEntries(),
    getTimetableRequirements(),
  ]);

  return (
    <AppFrame title="Jadual Waktu" subtitle="Pembinaan jadual waktu belajar mengikut kelas." active="timetable">
      <TimetableManager
        schools={schools}
        classes={classes}
        subjects={subjects}
        users={users}
        slots={slots}
        entries={entries}
        requirements={requirements}
      />
    </AppFrame>
  );
}
