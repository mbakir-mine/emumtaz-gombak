import AppFrame from '../ui/AppFrame';
import { getSchoolUsers, getSchools, getTeacherClassAssignments, getTeacherSubjectAssignments } from '@/lib/data';
import TeacherList from './TeacherList';

export default async function GuruPage() {
  const [schools, users, classAssignments, subjectAssignments] = await Promise.all([
    getSchools(),
    getSchoolUsers(),
    getTeacherClassAssignments(),
    getTeacherSubjectAssignments(),
  ]);

  return (
    <AppFrame title="Guru & Pengguna" subtitle="Akaun, peranan dan sekolah." active="teachers">
      <section className="panel">
        <TeacherList
          users={users}
          schools={schools}
          classAssignments={classAssignments}
          subjectAssignments={subjectAssignments}
        />
      </section>
    </AppFrame>
  );
}
