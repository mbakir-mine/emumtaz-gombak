export function getTrustedSelfHostedUrl(): string | null {
  const configured = (process.env.NEXT_PUBLIC_SELF_HOSTED_API_URL ?? '').trim().replace(/\/$/, '');
  if (!configured) return null;
  try {
    const target = new URL(configured);
    const siteOrigins = [process.env.NEXT_PUBLIC_SITE_URL, process.env.EMUMTAZ_APP_URL]
      .filter(Boolean)
      .map((value) => new URL(value as string).origin);
    const targetUrl = new URL(configured);
    const isAllowedSiteOrigin = siteOrigins.some((origin) => {
      const siteUrl = new URL(origin);
      return target.origin === origin || targetUrl.hostname === `api.${siteUrl.hostname}`;
    });
    if (!isAllowedSiteOrigin) return null;
    if (process.env.NODE_ENV === 'production' && target.protocol !== 'https:') return null;
    return configured;
  } catch {
    return null;
  }
}
