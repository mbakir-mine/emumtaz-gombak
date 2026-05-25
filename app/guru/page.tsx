import AppFrame from '../ui/AppFrame';
import { getSchoolUsers, getSchools } from '@/lib/data';
import TeacherList from './TeacherList';

export default async function GuruPage() {
  const [schools, users] = await Promise.all([getSchools(), getSchoolUsers()]);

  return (
    <AppFrame title="Guru & Pengguna" subtitle="Akaun, peranan dan sekolah." active="teachers">
      <section className="panel">
        <TeacherList users={users} schools={schools} />
      </section>
    </AppFrame>
  );
}
