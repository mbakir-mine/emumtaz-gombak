import type { TakwimEvent } from './data';
import { getTrustedSelfHostedUrl } from './trustedSelfHostedUrl';

export async function getSelfHostedTakwimEvents(): Promise<TakwimEvent[] | null> {
  const baseUrl = getTrustedSelfHostedUrl();
  if (!baseUrl) return null;
  const response = await fetch(`${baseUrl}/api/takwim`, { credentials: 'include', cache: 'no-store' });
  if (!response.ok) throw new Error(`Self-hosted calendar request failed (${response.status})`);
  const payload = await response.json() as { data?: TakwimEvent[] };
  return payload.data ?? [];
}
