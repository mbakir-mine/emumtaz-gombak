import AppFrame from '../ui/AppFrame';
import {
  getAmalKhairCategories,
  getAmalKhairRecords,
  getClasses,
  getSchools,
  getStudents,
} from '@/lib/data';
import AmalKhairManager from './AmalKhairManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AmalKhairPage() {
  const [schools, classes, students, categories, records] = await Promise.all([
    getSchools(),
    getClasses(),
    getStudents(),
    getAmalKhairCategories(),
    getAmalKhairRecords(),
  ]);

  return (
    <AppFrame title="Amal Khair" subtitle="Rekod amalan baik dan mata dorongan murid." active="amalKhair">
      <AmalKhairManager
        schools={schools}
        classes={classes}
        students={students}
        categories={categories}
        records={records}
      />
    </AppFrame>
  );
}
