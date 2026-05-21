import AppFrame from '../ui/AppFrame';
import { getAllAppUsers, getSchools } from '@/lib/data';
import UserApprovalList from './UserApprovalList';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PenggunaPage() {
  const [users, schools] = await Promise.all([getAllAppUsers(), getSchools()]);

  return (
    <AppFrame title="Pengesahan" subtitle="Semak akaun dan status pengguna." active="users">
      <UserApprovalList users={users} schools={schools} />
    </AppFrame>
  );
}
