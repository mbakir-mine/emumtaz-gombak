import Link from 'next/link';
import AppFrame from '../../ui/AppFrame';
import { getAppUserById, getSchools } from '@/lib/data';
import { roleLabel } from '@/lib/access';
import UserStatusForm from '../UserStatusForm';
import DeleteUserButton from '../DeleteUserButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function accessLabel(user: NonNullable<Awaited<ReturnType<typeof getAppUserById>>>, schoolNames: Map<string, string>) {
  if (user.kod_sekolah) {
    return `${user.kod_sekolah} - ${schoolNames.get(user.kod_sekolah) ?? 'Sekolah'}`;
  }

  if (user.zon) {
    return `Zon ${user.zon.charAt(0) + user.zon.slice(1).toLowerCase()}`;
  }

  return 'Semua sekolah';
}

export default async function PenggunaProfilPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, schools] = await Promise.all([getAppUserById(id), getSchools()]);
  const schoolNames = new Map(schools.map((school) => [school.kod_sekolah, school.nama_sekolah]));

  return (
    <AppFrame title="Profil Pengguna" subtitle="Tetapan role, status dan akses modul." active="users">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{user?.nama ?? 'Pengguna tidak ditemui'}</h2>
            {user && <p className="table-note">{user.email}</p>}
          </div>
          <Link className="button secondary" href="/pengguna">
            Kembali
          </Link>
        </div>

        {!user ? (
          <p className="empty">Rekod pengguna tidak ditemui.</p>
        ) : (
          <>
            <div className="profile-summary">
              <div>
                <span>Role Semasa</span>
                <strong>{roleLabel(user.role)}</strong>
              </div>
              <div>
                <span>Akses</span>
                <strong>{accessLabel(user, schoolNames)}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{user.status}</strong>
              </div>
            </div>

            <div className="profile-form-wrap">
              <UserStatusForm
                userId={user.id}
                currentRole={user.role}
                currentZon={user.zon}
                currentStatus={user.status}
                currentAllowedNav={user.allowed_nav}
                locked={user.role === 'OWNER'}
              />
            </div>

            <section className="danger-zone">
              <div>
                <h2>Zon Bahaya</h2>
                <p className="table-note">Padam hanya membuang profil akses sistem. Data murid dan markah tidak dipadam.</p>
              </div>
              <DeleteUserButton userId={user.id} userName={user.nama} locked={user.role === 'OWNER'} />
            </section>
          </>
        )}
      </section>
    </AppFrame>
  );
}
