import AppFrame from '../../ui/AppFrame';
import TeacherSubjectDetailForm from '../TeacherSubjectDetailForm';
import {
  getClasses,
  getSchoolUsers,
  getSchools,
  getSubjects,
  getTeacherClassAssignments,
  getTeacherSubjectAssignments,
} from '@/lib/data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function GuruSubjekKelasPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const [schools, classes, users, subjects, classAssignments, subjectAssignments] = await Promise.all([
    getSchools(),
    getClasses(),
    getSchoolUsers(),
    getSubjects(),
    getTeacherClassAssignments(),
    getTeacherSubjectAssignments(),
  ]);
  const selectedClass = classes.find((item) => item.id === classId);

  return (
    <AppFrame
      title="Guru Mata Pelajaran"
      subtitle={selectedClass ? `Kemaskini subjek ${selectedClass.nama_kelas} ${selectedClass.tahun_akademik}.` : 'Kemaskini guru subjek.'}
      active="teacherSubjects"
    >
      <TeacherSubjectDetailForm
        classId={classId}
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
