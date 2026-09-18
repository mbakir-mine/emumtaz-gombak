import AppFrame from '../ui/AppFrame';
import { getClasses, getRphRecords, getRphTopics, getRphWeeklyReviews, getRphWeeklySubmissionItems, getRphWeeklySubmissions, getSchools, getSchoolUsers, getSubjects, getTakwimEvents, getTimetableRequirements } from '@/lib/data';
import RphManager from './RphManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RphPage() {
  const [schools, classes, subjects, users, records, rphTopics, takwimEvents, timetableRequirements, submissions, submissionItems, reviews] = await Promise.all([
    getSchools(),
    getClasses(),
    getSubjects(),
    getSchoolUsers(),
    getRphRecords(),
    getRphTopics(),
    getTakwimEvents(),
    getTimetableRequirements(),
    getRphWeeklySubmissions(),
    getRphWeeklySubmissionItems(),
    getRphWeeklyReviews(),
  ]);

  return (
    <AppFrame title="e-RPH Pintar" subtitle="Rancang, urus dan guna semula Rancangan Pengajaran Harian." active="rph">
      <RphManager schools={schools} classes={classes} subjects={subjects} users={users} records={records} rphTopics={rphTopics} takwimEvents={takwimEvents} timetableRequirements={timetableRequirements} submissions={submissions} submissionItems={submissionItems} reviews={reviews} />
    </AppFrame>
  );
}
