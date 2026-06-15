import AppFrame from '../ui/AppFrame';
import {
  getExams,
  getSubjectComponentMarkSettings,
  getSubjectComponents,
  getSubjects,
} from '@/lib/data';
import ComponentMarkSettingsManager from './ComponentMarkSettingsManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function KomponenMarkahPage() {
  const [exams, subjects, components, settings] = await Promise.all([
    getExams(),
    getSubjects(),
    getSubjectComponents(),
    getSubjectComponentMarkSettings(),
  ]);

  return (
    <AppFrame
      title="Komponen Markah"
      subtitle="Tetapan pecahan markah subjek gabungan."
      active="componentMarks"
    >
      <ComponentMarkSettingsManager
        exams={exams}
        subjects={subjects}
        components={components}
        settings={settings}
      />
    </AppFrame>
  );
}
