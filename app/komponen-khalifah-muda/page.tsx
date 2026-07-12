import AppFrame from '../ui/AppFrame';
import { getKhalifahMudaComponents } from '@/lib/data';
import KhalifahMudaComponentManager from './KhalifahMudaComponentManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function KomponenKhalifahMudaPage() {
  const components = await getKhalifahMudaComponents();

  return (
    <AppFrame
      title="Komponen IHAB"
      subtitle="Tetapan aktiviti kelas, indikator penghargaan dan indikator bimbingan."
      active="khalifahMudaComponents"
    >
      <KhalifahMudaComponentManager components={components} />
    </AppFrame>
  );
}
