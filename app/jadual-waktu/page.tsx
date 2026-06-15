import AppFrame from '../ui/AppFrame';
import {
  getClasses,
  getSchools,
  getSchoolUsers,
  getSubjects,
  getSubjectComponents,
  getTeacherSubjectAssignments,
  getTeacherSubjectComponentAssignments,
  getTimetableEntries,
  getTimetableRequirements,
  getTimetableSlots,
  getTakwimEvents,
} from '@/lib/data';
import TimetableManager from './TimetableManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TimetablePage() {
  const [
    schools,
    classes,
    subjects,
    users,
    slots,
    entries,
    requirements,
    subjectAssignments,
    componentAssignments,
    subjectComponents,
    takwimEvents,
  ] = await Promise.all([
    getSchools(),
    getClasses(),
    getSubjects(),
    getSchoolUsers(),
    getTimetableSlots(),
    getTimetableEntries(),
    getTimetableRequirements(),
    getTeacherSubjectAssignments(),
    getTeacherSubjectComponentAssignments(),
    getSubjectComponents(),
    getTakwimEvents(),
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
        subjectAssignments={subjectAssignments}
        componentAssignments={componentAssignments}
        subjectComponents={subjectComponents}
        takwimEvents={takwimEvents}
      />
    </AppFrame>
  );
}
