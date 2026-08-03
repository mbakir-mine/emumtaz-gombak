import AppFrame from './ui/AppFrame';
import DashboardContent from './DashboardContent';
import { getDashboardInsights, getSetupCounts } from '@/lib/data';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string }>;
}) {
  const params = await searchParams;
  const [counts, insights] = await Promise.all([getSetupCounts(), getDashboardInsights(params.exam)]);

  return (
    <AppFrame title="Dashboard" subtitle="Ringkasan sistem e-Mumtaz UPI." active="dashboard">
      <DashboardContent counts={counts} insights={insights} />
    </AppFrame>
  );
}
