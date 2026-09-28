import type { School, TeacherClassAssignment, TeacherSubjectAssignment, UserRecord } from './data';
import { getTrustedSelfHostedUrl } from './trustedSelfHostedUrl';

export async function getSelfHostedUsers(): Promise<{ users: UserRecord[]; schools: School[]; classAssignments: TeacherClassAssignment[]; subjectAssignments: TeacherSubjectAssignment[] } | null> {
  const baseUrl = getTrustedSelfHostedUrl();
  if (!baseUrl) return null;
  const [usersResponse, schoolsResponse, assignmentsResponse] = await Promise.all([fetch(`${baseUrl}/api/admin/users`, { credentials: 'include', cache: 'no-store' }), fetch(`${baseUrl}/api/schools`, { credentials: 'include', cache: 'no-store' }), fetch(`${baseUrl}/api/assignments`, { credentials: 'include', cache: 'no-store' })]);
  if (!usersResponse.ok || !schoolsResponse.ok || !assignmentsResponse.ok) throw new Error('Self-hosted users request failed');
  const usersPayload = await usersResponse.json() as { data?: UserRecord[] };
  const schoolsPayload = await schoolsResponse.json() as { data?: School[] };
  const assignmentsPayload = await assignmentsResponse.json() as { data?: { class?: TeacherClassAssignment[]; subject?: TeacherSubjectAssignment[] } };
  return { users: usersPayload.data ?? [], schools: schoolsPayload.data ?? [], classAssignments: assignmentsPayload.data?.class ?? [], subjectAssignments: assignmentsPayload.data?.subject ?? [] };
}
