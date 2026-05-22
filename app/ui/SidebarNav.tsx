'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { navItems, visibleNavItems } from '@/lib/access';
import { supabase } from '@/lib/supabase';
import { useAccessProfile } from './AuthGate';

const groupedMenu = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/',
    items: ['dashboard'],
  },
  {
    key: 'schoolSetup',
    label: 'Tetapan Sekolah',
    href: '/sekolah',
    items: ['schools', 'teachers', 'classes', 'students'],
  },
  {
    key: 'scoring',
    label: 'Pemarkahan',
    href: '/markah',
    items: ['setup', 'marks'],
  },
  {
    key: 'reports',
    label: 'Laporan',
    href: '/laporan',
    items: ['reports'],
  },
  {
    key: 'analysis',
    label: 'Analisis',
    href: '/analisis',
    items: ['analysis', 'comparison'],
  },
  {
    key: 'settings',
    label: 'Tetapan',
    href: '/pengguna',
    items: ['users', 'changePassword'],
  },
];

const childLabels: Record<string, string> = {
  schools: 'Sekolah',
  teachers: 'Guru',
  classes: 'Kelas',
  students: 'Murid',
  setup: 'Subjek',
  marks: 'Kelas',
  reports: 'Pusat Laporan',
  analysis: 'Analisis Subjek',
  comparison: 'Penilaian UPSA/UASA',
  users: 'Admin',
  changePassword: 'Tukar Password',
};

export default function SidebarNav({ active }: { active: string }) {
  const router = useRouter();
  const profile = useAccessProfile();
  const visibleItems = profile ? visibleNavItems(profile.role, profile.allowed_nav) : [];
  const visibleKeys = new Set(visibleItems.map((item) => item.key));
  const allItemMap = new Map(navItems.map((item) => [item.key, item]));

  async function logout() {
    await supabase?.auth.signOut();
    router.replace('/login');
  }

  const groups = groupedMenu
    .map((group) => {
      const children = group.items
        .filter((key) => visibleKeys.has(key) || key === 'changePassword')
        .map((key) => allItemMap.get(key))
        .filter(Boolean);

      return {
        ...group,
        children,
        isActive: group.items.includes(active),
      };
    })
    .filter((group) => group.children.length > 0);

  return (
    <nav className="nav">
      {groups.map((group) => (
        <details className="nav-group" key={group.key} open={group.isActive}>
          <summary className={group.isActive ? 'active' : ''}>{group.label}</summary>
          <div className="nav-submenu">
            {group.children.map((item) => (
              <Link className={active === item!.key ? 'active' : ''} href={item!.href} key={item!.key}>
                {childLabels[item!.key] ?? item!.label}
              </Link>
            ))}
          </div>
        </details>
      ))}
      <button className="nav-logout" type="button" onClick={logout}>
        Keluar
      </button>
    </nav>
  );
}
