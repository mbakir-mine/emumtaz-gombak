import IbuBapaAccessForm from './IbuBapaAccessForm';
import { getSchoolModuleAccesses, getSchools } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function IbuBapaLoginPage() {
  const [schools, accesses] = await Promise.all([getSchools(), getSchoolModuleAccesses()]);
  const enabledSchoolCodes = new Set(
    accesses
      .filter((access) => access.module_key === 'AKSES_IBU_BAPA' && access.enabled)
      .map((access) => access.kod_sekolah),
  );
  const enabledSchools = schools
    .filter((school) => school.status === 'AKTIF' && enabledSchoolCodes.has(school.kod_sekolah))
    .sort((a, b) => a.kod_sekolah.localeCompare(b.kod_sekolah));

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="brand-mark">eM</div>
          <div>
            <strong>e-Mumtaz Gombak</strong>
            <span>Akses Ibu Bapa</span>
          </div>
        </div>

        <h1>Semakan Anak</h1>
        <p className="login-copy">Masukkan MyKid dan pilih sekolah murid.</p>

        <IbuBapaAccessForm schools={enabledSchools} />
      </section>
    </main>
  );
}
