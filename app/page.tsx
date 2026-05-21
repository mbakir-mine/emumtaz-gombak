import AppFrame from './ui/AppFrame';
import { getSetupCounts } from '@/lib/data';

export default async function DashboardPage() {
  const counts = await getSetupCounts();

  return (
    <AppFrame title="Dashboard Daerah" active="dashboard">
      <div className="metric-grid">
        <div className="metric">
          <span>Sekolah</span>
          <strong>{counts.schools}</strong>
          <small>Data dari table schools</small>
        </div>
        <div className="metric">
          <span>Pengguna</span>
          <strong>{counts.users}</strong>
          <small>Owner, admin, guru</small>
        </div>
        <div className="metric">
          <span>Subjek</span>
          <strong>{counts.subjects}</strong>
          <small>Subjek aktif sistem</small>
        </div>
        <div className="metric">
          <span>Markah</span>
          <strong>{counts.marks}</strong>
          <small>Rekod markah semasa</small>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Status Setup</h2>
          <span>e-Mumtaz Gombak</span>
        </div>
        <p className="table-note">
          Jika semua angka masih 0, masukkan nilai Supabase dalam fail .env.local dan restart server.
        </p>
      </section>
    </AppFrame>
  );
}

