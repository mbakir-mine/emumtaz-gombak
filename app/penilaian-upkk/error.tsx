'use client';

import { useEffect } from 'react';

export default function PenilaianUpkkError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Ralat halaman Penilaian UPKK.', error);
  }, [error]);

  return (
    <main className="app-main">
      <section className="card">
        <h1>Penilaian UPKK tidak dapat dimuatkan</h1>
        <p className="muted">
          Sistem mengesan ralat semasa memuatkan atau menyimpan markah. Sila cuba muat semula halaman ini.
        </p>
        <button type="button" className="btn-primary" onClick={reset}>
          Muat Semula
        </button>
      </section>
    </main>
  );
}
