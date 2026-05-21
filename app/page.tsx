import AppFrame from './ui/AppFrame';
import DashboardContent from './DashboardContent';
import { getSetupCounts } from '@/lib/data';

export default async function DashboardPage() {
  const counts = await getSetupCounts();

  return (
    <AppFrame title="Dashboard" active="dashboard">
      <DashboardContent counts={counts} />
    </AppFrame>
  );
}
