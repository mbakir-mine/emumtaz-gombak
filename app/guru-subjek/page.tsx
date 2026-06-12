import AppFrame from '../ui/AppFrame';
import TeacherSubjectForm from './TeacherSubjectForm';
import {
  getClasses,
  getSchoolUsers,
  getSchools,
  getSubjects,
  getTeacherClassAssignments,
  getTeacherSubjectAssignments,
} from '@/lib/data';

export default async function GuruSubjekPage() {
  const [schools, classes, users, subjects, classAssignments, subjectAssignments] = await Promise.all([
    getSchools(),
    getClasses(),
    getSchoolUsers(),
    getSubjects(),
    getTeacherClassAssignments(),
    getTeacherSubjectAssignments(),
  ]);

  return (
    <AppFrame title="Guru Kelas & Guru Subjek" subtitle="Tetapan guru mengikut kelas dan mata pelajaran." active="teacherSubjects">
      <TeacherSubjectForm
        schools={schools}
        classes={classes}
        users={users}
        subjects={subjects}
        classAssignments={classAssignments}
        subjectAssignments={subjectAssignments}
      />
    </AppFrame>
  );
}
