import AppFrame from '../ui/AppFrame';
import { getSchoolUsers, getSchools, getTeacherClassAssignments, getTeacherSubjectAssignments } from '@/lib/data';
import TeacherList from './TeacherList';
import { getSelfHostedUsers } from '@/lib/selfHostedUsers';

export default async function GuruPage() {
  const selfHosted = await getSelfHostedUsers();
  if (selfHosted) return <AppFrame title="Guru & Pengguna" subtitle="Akaun, peranan dan sekolah." active="teachers"><section className="panel"><TeacherList users={selfHosted.users.filter((user) => user.role.startsWith('GURU_'))} schools={selfHosted.schools} classAssignments={selfHosted.classAssignments} subjectAssignments={selfHosted.subjectAssignments} /></section></AppFrame>;
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
