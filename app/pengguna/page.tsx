import AppFrame from '../ui/AppFrame';
import { getAllAppUsers, getSchools } from '@/lib/data';
import UserApprovalList from './UserApprovalList';
import { getSelfHostedUsers } from '@/lib/selfHostedUsers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PenggunaPage() {
  const selfHosted = await getSelfHostedUsers();
  if (selfHosted) return <AppFrame title="Pengesahan" subtitle="Semak akaun dan status pengguna." active="users"><UserApprovalList users={selfHosted.users} schools={selfHosted.schools} /></AppFrame>;
  const [users, schools] = await Promise.all([getAllAppUsers(), getSchools()]);

  return (
    <AppFrame title="Pengesahan" subtitle="Semak akaun dan status pengguna." active="users">
      <UserApprovalList users={users} schools={schools} />
    </AppFrame>
  );
}
