import AppFrame from '../ui/AppFrame';
import TeacherSubjectForm from './TeacherSubjectForm';
import {
  getClasses,
  getSchoolUsers,
  getSchools,
  getTeacherClassAssignments,
} from '@/lib/data';

export default async function GuruSubjekPage() {
  const [schools, classes, users, classAssignments] = await Promise.all([
    getSchools(),
    getClasses(),
    getSchoolUsers(),
    getTeacherClassAssignments(),
  ]);

  return (
    <AppFrame title="Guru Kelas & Guru Subjek" subtitle="Tetapan guru mengikut kelas dan mata pelajaran." active="teacherSubjects">
      <TeacherSubjectForm
        schools={schools}
        classes={classes}
        users={users}
        classAssignments={classAssignments}
      />
    </AppFrame>
  );
}
