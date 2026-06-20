import AppFrame from '../ui/AppFrame';
import {
  getClasses,
  getSchoolModuleAccesses,
  getSchools,
  getStudents,
  getUpkkJakimItemMarks,
  getUpkkJakimMarks,
} from '@/lib/data';
import UpkkJakimManager from './UpkkJakimManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function UpkkJakimPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tahun = Number(firstParam(params.tahun));
  const kelas = firstParam(params.kelas);
  const jenis = firstParam(params.jenis);
  const sekolah = firstParam(params.sekolah);
  const [schools, classes, students, marks, itemMarks, moduleAccesses] = await Promise.all([
    getSchools(),
    getClasses(),
    getStudents(),
    getUpkkJakimMarks(),
    getUpkkJakimItemMarks(),
    getSchoolModuleAccesses(),
  ]);

  return (
    <AppFrame
      title="UPKK JAKIM"
      subtitle="Pemarkahan PCHI dan Amali Solat UPKK."
      active="upkkJakim"
    >
      <UpkkJakimManager
        schools={schools}
        classes={classes}
        students={students}
        marks={marks}
        itemMarks={itemMarks}
        moduleAccesses={moduleAccesses}
        initialSchool={sekolah}
        initialYear={Number.isFinite(tahun) ? tahun : undefined}
        initialClassId={kelas}
        initialType={jenis}
      />
    </AppFrame>
  );
}
