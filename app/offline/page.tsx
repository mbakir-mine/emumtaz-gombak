import Link from 'next/link';

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <section className="offline-card">
        <span className="offline-mark">eM</span>
        <h1>Anda sedang luar talian</h1>
        <p>e-Mumtaz memerlukan sambungan internet untuk melindungi dan mendapatkan data murid yang terkini.</p>
        <Link href="/">Sambung semula dan muat semula halaman</Link>
      </section>
    </main>
  );
}
