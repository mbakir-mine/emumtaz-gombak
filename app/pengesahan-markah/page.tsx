import AppFrame from '../ui/AppFrame';
import { getClasses, getExams, getMarkSubmissionWorkflows, getSchools, getSubjects } from '@/lib/data';
import WorkflowManager from './WorkflowManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MarkApprovalPage() {
  const [schools, classes, exams, subjects, workflows] = await Promise.all([
    getSchools(), getClasses(), getExams(), getSubjects(), getMarkSubmissionWorkflows(),
  ]);
  return (
    <AppFrame title="Pengesahan Markah" subtitle="Aliran Draf → Dihantar → Disahkan → Dikunci dengan permohonan pembetulan." active="markApproval">
      <WorkflowManager schools={schools} classes={classes} exams={exams} subjects={subjects} workflows={workflows} />
    </AppFrame>
  );
}
