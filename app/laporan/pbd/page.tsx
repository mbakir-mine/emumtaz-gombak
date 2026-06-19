import AppFrame from '../../ui/AppFrame';
import {
  getClasses,
  getPbdMarkDetails,
  getSchoolModuleAccesses,
  getSchools,
  getStudents,
  getSubjects,
  getTeacherClassAssignments,
} from '@/lib/data';
import PbdReport from './PbdReport';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LaporanPbdPage() {
  const [schools, classes, students, subjects, pbdMarks, teacherClassAssignments, moduleAccesses] =
    await Promise.all([
      getSchools(),
      getClasses(),
      getStudents(),
      getSubjects(),
      getPbdMarkDetails(),
      getTeacherClassAssignments(),
      getSchoolModuleAccesses(),
    ]);

  return (
    <AppFrame title="Pelaporan PBD" subtitle="Format pelaporan rasmi JAIS mengikut sekolah dan kelas." active="reportPbd">
      <section className="panel report-page pbd-report-page">
        <PbdReport
          schools={schools}
          classes={classes}
          students={students}
          subjects={subjects}
          pbdMarks={pbdMarks}
          teacherClassAssignments={teacherClassAssignments}
          moduleAccesses={moduleAccesses}
        />
      </section>
    </AppFrame>
  );
}
