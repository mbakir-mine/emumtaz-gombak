import Link from 'next/link';
import AuthGate from './AuthGate';
import UserBadge from './UserBadge';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', href: '/' },
  { key: 'schools', label: 'Sekolah', href: '/sekolah' },
  { key: 'classes', label: 'Kelas', href: '/kelas' },
  { key: 'students', label: 'Murid', href: '/murid' },
  { key: 'teachers', label: 'Guru', href: '/guru' },
  { key: 'marks', label: 'Markah', href: '/markah' },
  { key: 'analysis', label: 'Analisis', href: '/analisis' },
  { key: 'comparison', label: 'Perbandingan', href: '/perbandingan' },
  { key: 'teacherClasses', label: 'Guru Kelas', href: '/guru-kelas' },
  { key: 'teacherSubjects', label: 'Guru Subjek', href: '/guru-subjek' },
  { key: 'users', label: 'Pengesahan Pengguna', href: '/pengguna' },
  { key: 'setup', label: 'Setup Data', href: '/setup' },
  { key: 'reports', label: 'Laporan', href: '/laporan' },
];

export default function AppFrame({
  title,
  active,
  children,
}: {
  title: string;
  active: string;
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">eM</div>
            <div>
              <strong>e-Mumtaz</strong>
              <small>Gombak</small>
            </div>
          </div>
          <nav className="nav">
            {navItems.map((item) => (
              <Link className={active === item.key ? 'active' : ''} href={item.href} key={item.key}>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="main">
          <header className="topbar">
            <div>
              <p className="eyebrow">Sistem Analisis Prestasi Murid</p>
              <h1>{title}</h1>
            </div>
            <UserBadge />
          </header>
          {children}
        </main>
      </div>
    </AuthGate>
  );
}
