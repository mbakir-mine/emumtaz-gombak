import AppFrame from '../ui/AppFrame';
import { getSchoolLicenses, getSchools } from '@/lib/data';
import LicenseManager from './LicenseManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LicensePage() {
  const [schools, licenses] = await Promise.all([getSchools(), getSchoolLicenses()]);
  return (
    <AppFrame
      title="Lesen Sekolah"
      subtitle="Kawal pakej, tempoh sah dan kapasiti penggunaan setiap sekolah. Akses Pemilik Sistem sahaja."
      active="licenses"
    >
      <LicenseManager schools={schools} licenses={licenses} />
    </AppFrame>
  );
}
