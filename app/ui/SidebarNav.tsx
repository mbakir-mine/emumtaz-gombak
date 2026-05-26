'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
    items: ['schools', 'teachers', 'teacherSubjects', 'classes', 'students', 'studentPromotion'],
  },
  {
    key: 'scoring',
    label: 'Pemarkahan',
    href: '/markah',
    items: ['marks'],
  },
  {
    key: 'reports',
    label: 'Laporan',
    href: '/laporan',
    items: ['reportIndividual', 'reportClass', 'reportSchool', 'reportSubject', 'comparison', 'reportAnnual'],
  },
  {
    key: 'analysis',
    label: 'Analisis',
    href: '/analisis',
    items: ['analysis'],
  },
  {
    key: 'settings',
    label: 'Tetapan',
    href: '/setup',
    items: ['setup', 'users', 'changePassword'],
  },
];

const childLabels: Record<string, string> = {
  schools: 'Sekolah',
  teachers: 'Guru',
  teacherSubjects: 'Guru Subjek',
  classes: 'Kelas',
  students: 'Murid',
  studentPromotion: 'Naik Tahun',
  setup: 'Akses Markah',
  marks: 'Kelas',
  reports: 'Pusat Laporan',
  reportIndividual: 'Individu',
  reportClass: 'Kelas',
  reportSchool: 'Sekolah',
  reportSubject: 'Subjek',
  analysis: 'Analisis Subjek',
  comparison: 'UPSA vs UASA',
  reportAnnual: 'Perbandingan Tahunan',
  users: 'Admin',
  changePassword: 'Tukar Password',
};

export default function SidebarNav({ active }: { active: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const profile = useAccessProfile();
  const visibleItems = profile ? visibleNavItems(profile.role, profile.allowed_nav) : [];
  const visibleKeys = new Set(visibleItems.map((item) => item.key));
  const allItemMap = new Map(navItems.map((item) => [item.key, item]));

  async function logout() {
    await supabase?.auth.signOut();
    router.replace('/login');
  }

  const groups = useMemo(() => groupedMenu
    .map((group) => {
      const children = group.items
        .filter((key) => {
          if (visibleKeys.has(key) || key === 'changePassword') return true;
          if (group.key !== 'reports' || !visibleKeys.has('reports') || !profile) return false;
          const item = allItemMap.get(key);
          return item ? item.roles.includes(profile.role) : false;
        })
        .map((key) => allItemMap.get(key))
        .filter(Boolean);

      const pathActive = children.some((item) => {
        if (!item) return false;
        return pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`));
      });

      return {
        ...group,
        children,
        isActive: group.key === active || group.items.includes(active) || pathActive,
      };
    })
    .filter((group) => group.children.length > 0), [active, allItemMap, pathname, profile, visibleKeys]);
  const activeGroupKey = groups.find((group) => group.isActive)?.key ?? null;
  const [openGroupKey, setOpenGroupKey] = useState<string | null>(activeGroupKey);

  useEffect(() => {
    setOpenGroupKey(activeGroupKey);
  }, [activeGroupKey]);

  return (
    <nav className="nav">
      {groups.map((group) => (
        <div className={`nav-group ${openGroupKey === group.key ? 'nav-group-open' : ''}`} key={group.key}>
          {group.children.length > 1 ? (
            <button
              className={`nav-group-link nav-menu-trigger ${group.isActive ? 'active' : ''}`}
              type="button"
              onClick={() => setOpenGroupKey((current) => (current === group.key ? null : group.key))}
            >
              {group.label}
            </button>
          ) : (
            <Link className={`nav-group-link ${group.isActive ? 'active' : ''}`} href={group.href}>
              {group.label}
            </Link>
          )}
          {openGroupKey === group.key && group.children.length > 1 && (
            <div className="nav-submenu">
              {group.children.map((item) => (
                <Link
                  className={
                    active === item!.key ||
                    (item!.key !== 'reportAnnual' &&
                      (pathname === item!.href || (item!.href !== '/' && pathname.startsWith(`${item!.href}/`))))
                      ? 'active'
                      : ''
                  }
                  href={item!.href}
                  key={item!.key}
                >
                  {childLabels[item!.key] ?? item!.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
      <button className="nav-logout" type="button" onClick={logout}>
        Keluar
      </button>
    </nav>
  );
}
