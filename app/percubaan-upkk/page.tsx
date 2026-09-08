import AppFrame from '../ui/AppFrame';
import { getClasses, getSchoolModuleAccesses, getSchools, getStudents } from '@/lib/data';
import UpkkTrialManager from './UpkkTrialManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PercubaanUpkkPage() {
  const [schools, moduleAccesses, classes, students] = await Promise.all([
    getSchools(), getSchoolModuleAccesses(), getClasses(), getStudents(),
  ]);
  return (
    <AppFrame title="Percubaan UPKK" subtitle="Peperiksaan Percubaan UPKK 1 dan 2 untuk calon Tahun 5." active="upkkTrial">
      <UpkkTrialManager schools={schools} moduleAccesses={moduleAccesses} classes={classes} students={students} />
    </AppFrame>
  );
}
