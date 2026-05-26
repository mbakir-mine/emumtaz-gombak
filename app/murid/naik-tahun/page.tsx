import AppFrame from '../../ui/AppFrame';
import { getClasses, getSchools, getStudentEnrollments, getStudents } from '@/lib/data';
import PromotionPlanner from './PromotionPlanner';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NaikTahunMuridPage() {
  const [schools, classes, students, enrollments] = await Promise.all([
    getSchools(),
    getClasses(),
    getStudents(),
    getStudentEnrollments(),
  ]);

  return (
    <AppFrame title="Naik Tahun Murid" subtitle="Semak dan sahkan penempatan murid tahun baharu." active="studentPromotion">
      <PromotionPlanner schools={schools} classes={classes} students={students} enrollments={enrollments} />
    </AppFrame>
  );
}
