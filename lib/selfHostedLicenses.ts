import type { SchoolLicense } from './data';
import { getTrustedSelfHostedUrl } from './trustedSelfHostedUrl';

export async function getSelfHostedLicenses(): Promise<SchoolLicense[] | null> {
  const baseUrl = getTrustedSelfHostedUrl();
  if (!baseUrl) return null;
  const response = await fetch(`${baseUrl}/api/licenses`, { credentials: 'include', cache: 'no-store' });
  if (!response.ok) throw new Error(`Self-hosted licenses request failed (${response.status})`);
  const payload = await response.json() as { data?: SchoolLicense[] };
  return payload.data ?? [];
}
