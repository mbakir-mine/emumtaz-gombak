'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { navItems, visibleNavItems } from '@/lib/access';
import { supabase, syncServerSession } from '@/lib/supabase';
import { useAccessProfile } from './AuthGate';

const groupedMenu = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/',
    items: ['dashboard'],
  },
  {
    key: 'notifications',
    label: 'Notifikasi',
    href: '/notifikasi',
    items: ['notifications'],
  },
  {
    key: 'schoolSetup',
    label: 'Tetapan Sekolah',
    href: '/sekolah',
    items: ['schools', 'teachers', 'teacherSubjects', 'classes', 'students', 'studentPromotion'],
  },
  {
    key: 'optionalModules',
    label: 'Modul Sekolah',
    href: '/kehadiran',
    items: ['calendar', 'attendance', 'parentAccess', 'amalKhair', 'pbd', 'upkkAssessment', 'upkkTrial', 'psraTrial', 'khalifahMuda', 'timetable', 'rph'],
  },
  {
    key: 'scoring',
    label: 'Pemarkahan',
    href: '/markah',
    items: ['marks', 'markApproval'],
  },
  {
    key: 'reports',
    label: 'Laporan',
    href: '/laporan',
    items: [
      'reportIndividual',
      'reportClass',
      'reportBest',
      'reportSchool',
      'reportSubject',
      'reportPbd',
      'reportPsra',
      'comparison',
      'reportAnnual',
    ],
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
    items: ['setup', 'componentMarks', 'khalifahMudaComponents', 'users', 'securityAudit', 'schoolModules', 'licenses', 'changePassword'],
  },
];

const childLabels: Record<string, string> = {
  schools: 'Sekolah',
  teachers: 'Guru',
  teacherSubjects: 'Guru Kelas & Subjek',
  classes: 'Kelas',
  students: 'Murid',
  studentPromotion: 'Naik Tahun',
  calendar: 'Takwim',
  attendance: 'Kehadiran',
  parentAccess: 'Akses Ibu Bapa',
  amalKhair: 'Amal Khair',
  pbd: 'PBD',
  upkkAssessment: 'Penilaian UPKK',
  upkkTrial: 'Percubaan UPKK',
  psraTrial: 'Percubaan PSRA',
  khalifahMuda: 'Sahsiah IHAB',
  timetable: 'Jadual Waktu',
  rph: 'e-RPH Pintar',
  setup: 'Akses Markah',
  componentMarks: 'Markah Penuh & Komponen',
  khalifahMudaComponents: 'Komponen Sahsiah IHAB',
  marks: 'Kelas',
  markApproval: 'Pengesahan Markah',
  notifications: 'Notifikasi',
  reports: 'Pusat Laporan',
  reportIndividual: 'Individu',
  reportClass: 'Kelas',
  reportBest: 'Terbaik',
  reportSchool: 'Sekolah',
    reportSubject: 'Subjek',
    reportPbd: 'PBD',
    reportPsra: 'Percubaan PSRA',
    analysis: 'Analisis Subjek',
  comparison: 'UPSA vs UASA',
  reportAnnual: 'Perbandingan Tahunan',
  users: 'Admin',
  securityAudit: 'Log Aktiviti & Audit Edit',
  schoolModules: 'Akses Modul Sekolah',
  licenses: 'Lesen Sekolah',
  changePassword: 'Tukar Password',
};

export default function SidebarNav({ active }: { active: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const profile = useAccessProfile();
  async function logout() {
    await supabase?.auth.signOut();
    await syncServerSession(null);
    router.replace('/login');
  }

  const groups = useMemo(() => groupedMenu
    .map((group) => {
      const visibleItems = profile ? visibleNavItems(profile.role, profile.allowed_nav, profile.enabled_modules) : [];
      const visibleKeys = new Set(visibleItems.map((item) => item.key));
      const allItemMap = new Map(navItems.map((item) => [item.key, item]));
      const children = group.items
        .filter((key) => {
          if (visibleKeys.has(key) || key === 'changePassword') return true;
          if (group.key !== 'reports' || !visibleKeys.has('reports') || !profile) return false;
          const item = allItemMap.get(key);
          if (item?.moduleKey && profile.role !== 'OWNER' && !profile.enabled_modules?.includes(item.moduleKey)) {
            return false;
          }
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
    .filter((group) => group.children.length > 0), [active, pathname, profile]);
  const activeGroupKey = groups.find((group) => group.isActive)?.key ?? null;
  const [openGroupKey, setOpenGroupKey] = useState<string | null>(activeGroupKey);

  // Sidebar links are often hidden inside collapsed groups, so Next.js cannot
  // discover them for automatic viewport prefetching. Warm the route cache in
  // idle time to make menu clicks feel immediate without delaying first paint.
  useEffect(() => {
    const hrefs = [...new Set(
      groups.flatMap((group) => group.children.map((item) => item?.href).filter((href): href is string => Boolean(href))),
    )];
    const prefetch = () => hrefs.forEach((href) => router.prefetch(href));
    const hasIdleCallback = typeof window.requestIdleCallback === 'function';
    const idle = hasIdleCallback
      ? window.requestIdleCallback(prefetch, { timeout: 1500 })
      : window.setTimeout(prefetch, 500);
    return () => {
      if (hasIdleCallback) window.cancelIdleCallback(idle as number);
      else window.clearTimeout(idle as number);
    };
  }, [groups, router]);

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
        <span className="nav-logout-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M9 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9" />
            <path d="M13 12H3" />
            <path d="m6 8-4 4 4 4" />
          </svg>
        </span>
        <span>Log Keluar</span>
      </button>
    </nav>
  );
}
