'use client';

import { useEffect, useState } from 'react';

export default function PwaRegister() {
  const [online, setOnline] = useState(true);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    const updateNetworkState = () => setOnline(navigator.onLine);
    updateNetworkState();
    window.addEventListener('online', updateNetworkState);
    window.addEventListener('offline', updateNetworkState);

    if ('serviceWorker' in navigator && window.isSecureContext) {
      void navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((registration) => {
        const watchInstallation = (worker: ServiceWorker | null) => {
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) setUpdateReady(true);
          });
        };
        registration.addEventListener('updatefound', () => watchInstallation(registration.installing));
        void registration.update();
      });
    }

    return () => {
      window.removeEventListener('online', updateNetworkState);
      window.removeEventListener('offline', updateNetworkState);
    };
  }, []);

  if (online && !updateReady) return null;

  return (
    <aside className={`pwa-status${online ? ' pwa-status-update' : ''}`} aria-live="polite">
      <span>{online ? 'Versi baharu e-Mumtaz sudah tersedia.' : 'Sambungan internet terputus. Data tidak akan dihantar sehingga anda kembali dalam talian.'}</span>
      {online ? <button type="button" onClick={() => window.location.reload()}>Muat semula</button> : null}
    </aside>
  );
}
