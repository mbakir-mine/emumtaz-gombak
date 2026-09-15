import Link from 'next/link';
import AppFrame from '../ui/AppFrame';
import { getUserNotifications } from '@/lib/data';
import { markNotificationRead } from './actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatTime(value: string) {
  return new Intl.DateTimeFormat('ms-MY', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kuala_Lumpur' }).format(new Date(value));
}

export default async function NotificationsPage() {
  const notifications = await getUserNotifications(100);
  const unread = notifications.filter((item) => !item.read).length;
  return <AppFrame title="Notifikasi" subtitle={`${unread} belum dibaca daripada ${notifications.length} notifikasi terkini.`} active="notifications">
    <section className="panel notification-list">
      {notifications.length === 0 ? <p className="empty">Belum ada notifikasi.</p> : notifications.map((item) => <article className={item.read ? '' : 'notification-unread'} key={item.id}>
        <div><span>{formatTime(item.created_at)} · {item.kod_sekolah ?? 'Global'}</span><h2>{item.title}</h2><p>{item.message}</p></div>
        <div className="notification-actions">
          {item.link ? <Link className="button secondary table-action" href={item.link}>Buka</Link> : null}
          {!item.read ? <form action={markNotificationRead}><input type="hidden" name="id" value={item.id} /><button className="button table-action" type="submit">Tanda dibaca</button></form> : <span className="notification-read">Dibaca</span>}
        </div>
      </article>)}
    </section>
  </AppFrame>;
}
