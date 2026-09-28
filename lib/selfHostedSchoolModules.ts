import type { SchoolLicense, SchoolModuleAccess } from './data';
import { getTrustedSelfHostedUrl } from './trustedSelfHostedUrl';

export async function getSelfHostedSchoolModules(): Promise<{ accesses: SchoolModuleAccess[]; licenses: SchoolLicense[] } | null> {
  const baseUrl = getTrustedSelfHostedUrl();
  if (!baseUrl) return null;
  const [accessResponse, licenseResponse] = await Promise.all([
    fetch(`${baseUrl}/api/school-modules`, { credentials: 'include', cache: 'no-store' }),
    fetch(`${baseUrl}/api/licenses`, { credentials: 'include', cache: 'no-store' }),
  ]);
  if (!accessResponse.ok || !licenseResponse.ok) throw new Error('Self-hosted school module request failed');
  const accesses = (await accessResponse.json() as { data?: SchoolModuleAccess[] }).data ?? [];
  const licenses = (await licenseResponse.json() as { data?: SchoolLicense[] }).data ?? [];
  return { accesses, licenses };
}
