import { afterEach, describe, expect, it } from 'vitest';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

const original = { ...process.env };

afterEach(() => {
  process.env = { ...original };
});

describe('trusted self-hosted origin', () => {
  it('rejects a different origin before cookies can be forwarded', () => {
    process.env.NEXT_PUBLIC_SELF_HOSTED_API_URL = 'https://attacker.example';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://emumtaz.example';
    expect(getTrustedSelfHostedUrl()).toBeNull();
  });

  it('accepts the configured application origin', () => {
    process.env.NEXT_PUBLIC_SELF_HOSTED_API_URL = 'https://emumtaz.example';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://emumtaz.example';
    expect(getTrustedSelfHostedUrl()).toBe('https://emumtaz.example');
  });
});
