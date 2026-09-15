import Link from 'next/link';

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <section className="offline-card">
        <span className="offline-mark">eM</span>
        <h1>Sambungan terganggu</h1>
        <p>e-Mumtaz tidak dapat memuatkan halaman ini buat masa ini. Sila cuba muat semula sebentar lagi.</p>
        <Link href="/">Cuba muat semula halaman</Link>
      </section>
    </main>
  );
}
