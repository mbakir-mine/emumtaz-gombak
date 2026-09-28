import AppFrame from '../ui/AppFrame';
import { getSchools, getTakwimEvents } from '@/lib/data';
import TakwimManager from './TakwimManager';
import { getSelfHostedTakwimEvents } from '@/lib/selfHostedTakwim';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TakwimPage() {
  const selfHostedEvents = await getSelfHostedTakwimEvents();
  if (selfHostedEvents) {
    const schools = [...new Set(selfHostedEvents.map((event) => event.kod_sekolah).filter((code): code is string => Boolean(code)))].map((kod_sekolah) => ({ kod_sekolah, nama_sekolah: kod_sekolah, kategori: '', daerah: '', zon: null, status: 'AKTIF' }));
    return <AppFrame title="Takwim" subtitle="Tunjang kalendar akademik, kehadiran, jadual dan RPH." active="calendar"><TakwimManager schools={schools} events={selfHostedEvents} /></AppFrame>;
  }
  const [schools, events] = await Promise.all([getSchools(), getTakwimEvents()]);

  return (
    <AppFrame title="Takwim" subtitle="Tunjang kalendar akademik, kehadiran, jadual dan RPH." active="calendar">
      <TakwimManager schools={schools} events={events} />
    </AppFrame>
  );
}
