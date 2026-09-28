'use client';

import { useEffect, useState } from 'react';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

export function useAccessToken() {
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    if (getTrustedSelfHostedUrl()) setAccessToken('laravel-session');
  }, []);

  return accessToken;
}
