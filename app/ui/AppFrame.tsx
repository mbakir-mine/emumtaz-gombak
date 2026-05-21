import AuthGate from './AuthGate';
import DateClock from './DateClock';
import SidebarNav from './SidebarNav';
import UserBadge from './UserBadge';

export default function AppFrame({
  title,
  subtitle,
  active,
  children,
}: {
  title: string;
  subtitle?: string;
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
          <DateClock />
        </aside>
        <main className="main">
          <header className="topbar">
            <div>
              <h1>{title}</h1>
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            <UserBadge />
          </header>
          {children}
        </main>
      </div>
    </AuthGate>
  );
}
