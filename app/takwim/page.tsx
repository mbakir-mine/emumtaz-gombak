import AppFrame from '../ui/AppFrame';
import { getSchools, getTakwimEvents } from '@/lib/data';
import TakwimManager from './TakwimManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TakwimPage() {
  const [schools, events] = await Promise.all([getSchools(), getTakwimEvents()]);

  return (
    <AppFrame title="Takwim" subtitle="Tunjang kalendar akademik, kehadiran, jadual dan RPH." active="calendar">
      <TakwimManager schools={schools} events={events} />
    </AppFrame>
  );
}
