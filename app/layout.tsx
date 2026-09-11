import type { Metadata } from 'next';
import './styles.css';
import './compact-ui.css';
import './owner-dashboard.css';

export const metadata: Metadata = {
  title: 'e-Mumtaz',
  description: 'Sistem Analisis Prestasi Murid SRA, SRAI, SRI & KAFAI',
};

// Data eMumtaz is tenant-scoped and must always be rendered in a real request
// where the authenticated HttpOnly session cookie is available.
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
