import type { ClassRecord, MarkDetailRecord, School, StudentSummaryRecord, TeacherClassAssignment } from './data';
import { getTrustedSelfHostedUrl } from './trustedSelfHostedUrl';

export type SelfHostedIndividualReport = {
  schools: School[];
  classes: ClassRecord[];
  summaries: StudentSummaryRecord[];
  marks: MarkDetailRecord[];
  teacherClassAssignments: TeacherClassAssignment[];
};

export async function getSelfHostedIndividualReport(): Promise<SelfHostedIndividualReport | null> {
  const baseUrl = getTrustedSelfHostedUrl();
  if (!baseUrl) return null;
  const response = await fetch(`${baseUrl}/api/reports/individual`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Self-hosted individual report request failed (${response.status})`);
  const payload = await response.json() as { data?: SelfHostedIndividualReport };
  const assignmentResponse = await fetch(`${baseUrl}/api/assignments`, { credentials: 'include', cache: 'no-store' });
  const assignmentPayload = assignmentResponse.ok ? await assignmentResponse.json() as { data?: { class?: TeacherClassAssignment[] } } : { data: {} };
  return { ...(payload.data ?? { schools: [], classes: [], summaries: [], marks: [] }), teacherClassAssignments: assignmentPayload.data?.class ?? [] };
}
