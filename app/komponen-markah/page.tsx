import AppFrame from '../ui/AppFrame';
import {
  getClasses,
  getExams,
  getSchools,
  getSchoolSubjectComponentMarkSettings,
  getSchoolSubjectMarkSettings,
  getSubjectComponentMarkSettings,
  getSubjectComponents,
  getSubjects,
} from '@/lib/data';
import SchoolMarkSettingsManager from './SchoolMarkSettingsManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ComponentMarksPage() {
  const [
    schools,
    classes,
    exams,
    subjects,
    components,
    defaultComponentSettings,
    schoolSubjectSettings,
    schoolComponentSettings,
  ] = await Promise.all([
    getSchools(),
    getClasses(),
    getExams(),
    getSubjects(),
    getSubjectComponents(),
    getSubjectComponentMarkSettings(),
    getSchoolSubjectMarkSettings(),
    getSchoolSubjectComponentMarkSettings(),
  ]);

  return (
    <AppFrame
      title="Markah Penuh & Komponen"
      subtitle="Tetapkan format markah setiap sekolah mengikut peperiksaan, tahun murid dan subjek."
      active="componentMarks"
    >
      <SchoolMarkSettingsManager
        schools={schools}
        classes={classes}
        exams={exams}
        subjects={subjects}
        components={components}
        defaultComponentSettings={defaultComponentSettings}
        initialSubjectSettings={schoolSubjectSettings}
        initialComponentSettings={schoolComponentSettings}
      />
    </AppFrame>
  );
}
