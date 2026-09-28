import type { UserNotification } from './data';
import { getTrustedSelfHostedUrl } from './trustedSelfHostedUrl';

export async function getSelfHostedNotifications(): Promise<UserNotification[] | null> {
  const baseUrl = getTrustedSelfHostedUrl();
  if (!baseUrl) return null;
  const response = await fetch(`${baseUrl}/api/notifications`, { credentials: 'include', cache: 'no-store' });
  if (!response.ok) throw new Error(`Self-hosted notifications request failed (${response.status})`);
  const payload = await response.json() as { data?: Array<UserNotification & { is_read?: boolean }> };
  return (payload.data ?? []).map((item) => ({ ...item, read: item.read || item.is_read === true }));
}
