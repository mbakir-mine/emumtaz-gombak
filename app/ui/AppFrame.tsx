import AuthGate from './AuthGate';
import SidebarNav from './SidebarNav';
import UserBadge from './UserBadge';

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
          <SidebarNav active={active} />
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
