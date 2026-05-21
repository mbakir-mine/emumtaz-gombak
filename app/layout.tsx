import type { Metadata } from 'next';
import './styles.css';

export const metadata: Metadata = {
  title: 'e-Mumtaz Gombak',
  description: 'Sistem Analisis Prestasi Murid SRA & KAFAI Daerah Gombak',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
