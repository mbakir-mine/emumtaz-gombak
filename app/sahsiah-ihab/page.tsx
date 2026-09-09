import AppFrame from '../ui/AppFrame';
import { getClasses, getSchoolModuleAccesses, getSchools, getStudents, getSahsiahIhabAssessments } from '@/lib/data';
import SahsiahIhabAssessmentManager from './SahsiahIhabAssessmentManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SahsiahIhabPage() {
  const [schools, moduleAccesses, classes, students, assessments] = await Promise.all([
    getSchools(), getSchoolModuleAccesses(), getClasses(), getStudents(), getSahsiahIhabAssessments(),
  ]);
  return <AppFrame title="Sahsiah IHAB" subtitle="Pentaksiran M1–M6, laporan bulanan dan keputusan sahsiah murid Tahun 6." active="khalifahMuda"><SahsiahIhabAssessmentManager schools={schools} moduleAccesses={moduleAccesses} classes={classes} students={students} assessments={assessments} /></AppFrame>;
}
