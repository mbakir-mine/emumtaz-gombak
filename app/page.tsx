import AppFrame from './ui/AppFrame';
import DashboardContent from './DashboardContent';
import { getDashboardInsights, getSetupCounts } from '@/lib/data';

export default async function DashboardPage() {
  const [counts, insights] = await Promise.all([getSetupCounts(), getDashboardInsights()]);

  return (
    <AppFrame title="Dashboard" subtitle="Ringkasan e-Mumtaz Gombak." active="dashboard">
      <DashboardContent counts={counts} insights={insights} />
    </AppFrame>
  );
}
