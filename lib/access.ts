import type { OptionalSchoolModuleKey } from './schoolModules';

export type UserRole = 'OWNER' | 'ADMIN_DAERAH' | 'ADMIN_ZON' | 'ADMIN_SEKOLAH' | 'GURU_KELAS' | 'GURU_SUBJEK';

export type AccessProfile = {
  id: string;
  email: string;
  nama: string;
  role: UserRole;
  kod_sekolah: string | null;
  zon: string | null;
  status: string;
  allowed_nav?: string[] | null;
  enabled_modules?: OptionalSchoolModuleKey[] | null;
  must_change_password?: boolean | null;
};

export type NavItem = {
  key: string;
  label: string;
  href: string;
  roles: UserRole[];
  hidden?: boolean;
  moduleKey?: OptionalSchoolModuleKey;
};

export const allRoles: UserRole[] = ['OWNER', 'ADMIN_DAERAH', 'ADMIN_ZON', 'ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK'];

export const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/', roles: allRoles },
  { key: 'schools', label: 'Sekolah', href: '/sekolah', roles: ['OWNER', 'ADMIN_DAERAH', 'ADMIN_ZON'] },
  { key: 'teachers', label: 'Guru & Pengguna', href: '/guru', roles: ['OWNER', 'ADMIN_DAERAH', 'ADMIN_ZON', 'ADMIN_SEKOLAH'] },
  { key: 'classes', label: 'Kelas', href: '/kelas', roles: ['OWNER', 'ADMIN_DAERAH', 'ADMIN_ZON', 'ADMIN_SEKOLAH'] },
  { key: 'students', label: 'Murid', href: '/murid', roles: ['OWNER', 'ADMIN_DAERAH', 'ADMIN_ZON', 'ADMIN_SEKOLAH', 'GURU_KELAS'] },
  { key: 'studentPromotion', label: 'Naik Tahun Murid', href: '/murid/naik-tahun', roles: ['OWNER', 'ADMIN_SEKOLAH'] },
  {
    key: 'calendar',
    label: 'Takwim',
    href: '/takwim',
    roles: ['OWNER', 'ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK'],
    moduleKey: 'TAKWIM',
  },
  {
    key: 'attendance',
    label: 'Kehadiran Harian',
    href: '/kehadiran',
    roles: ['OWNER', 'ADMIN_SEKOLAH', 'GURU_KELAS'],
    moduleKey: 'KEHADIRAN_HARIAN',
  },
  {
    key: 'amalKhair',
    label: 'Amal Khair',
    href: '/amal-khair',
    roles: ['OWNER', 'ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK'],
    moduleKey: 'AMAL_KHAIR',
  },
  {
    key: 'pbd',
    label: 'PBD',
    href: '/pbd',
    roles: ['OWNER', 'ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK'],
    moduleKey: 'PELAPORAN_PBD',
  },
  {
    key: 'upkkAssessment',
    label: 'Penilaian UPKK',
    href: '/penilaian-upkk',
    roles: ['OWNER', 'ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK'],
    moduleKey: 'PENILAIAN_UPKK',
  },
  {
    key: 'khalifahMuda',
    label: 'IHAB',
    href: '/khalifah-muda',
    roles: ['OWNER', 'ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK'],
    moduleKey: 'KHALIFAH_MUDA',
  },
  {
    key: 'timetable',
    label: 'Jadual Waktu',
    href: '/jadual-waktu',
    roles: ['OWNER', 'ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK'],
    moduleKey: 'JADUAL_WAKTU',
  },
  {
    key: 'rph',
    label: 'RPH AI',
    href: '/rph',
    roles: ['OWNER', 'ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK'],
    moduleKey: 'RPH_AI',
  },
  { key: 'setup', label: 'Subjek', href: '/setup', roles: ['OWNER', 'ADMIN_DAERAH', 'ADMIN_SEKOLAH'] },
  { key: 'componentMarks', label: 'Komponen Markah', href: '/komponen-markah', roles: ['OWNER', 'ADMIN_DAERAH'] },
  {
    key: 'khalifahMudaComponents',
    label: 'Komponen IHAB',
    href: '/komponen-khalifah-muda',
    roles: ['OWNER', 'ADMIN_DAERAH', 'ADMIN_SEKOLAH'],
  },
  { key: 'marks', label: 'Markah', href: '/markah', roles: ['OWNER', 'ADMIN_DAERAH', 'ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK'] },
  { key: 'reports', label: 'Laporan', href: '/laporan', roles: allRoles },
  { key: 'reportIndividual', label: 'Laporan Individu', href: '/laporan/individu', roles: allRoles },
  { key: 'reportClass', label: 'Laporan Kelas', href: '/laporan/kelas', roles: allRoles },
  { key: 'reportBest', label: 'Laporan Terbaik', href: '/laporan/terbaik', roles: allRoles },
  { key: 'reportSchool', label: 'Laporan Sekolah', href: '/laporan/sekolah', roles: ['OWNER', 'ADMIN_DAERAH', 'ADMIN_ZON', 'ADMIN_SEKOLAH'] },
  { key: 'reportSubject', label: 'Laporan Subjek', href: '/laporan/subjek', roles: allRoles },
  {
    key: 'reportPbd',
    label: 'Pelaporan PBD',
    href: '/laporan/pbd',
    roles: ['OWNER', 'ADMIN_SEKOLAH', 'GURU_KELAS'],
    moduleKey: 'PELAPORAN_PBD',
  },
  { key: 'reportAnnual', label: 'Perbandingan Tahunan', href: '/perbandingan', roles: ['OWNER', 'ADMIN_DAERAH', 'ADMIN_ZON', 'ADMIN_SEKOLAH'] },
  { key: 'users', label: 'Pengesahan', href: '/pengguna', roles: ['OWNER', 'ADMIN_DAERAH'] },
  { key: 'schoolModules', label: 'Akses Modul Sekolah', href: '/modul-sekolah', roles: ['OWNER'] },
  { key: 'profile', label: 'Kemaskini Profil', href: '/profil', roles: allRoles, hidden: true },
  { key: 'changePassword', label: 'Tukar Password', href: '/tukar-password', roles: allRoles, hidden: true },
  { key: 'analysis', label: 'Analisis', href: '/analisis', roles: allRoles },
  { key: 'comparison', label: 'Perbandingan', href: '/perbandingan', roles: ['OWNER', 'ADMIN_DAERAH', 'ADMIN_ZON', 'ADMIN_SEKOLAH'] },
  { key: 'teacherClasses', label: 'Guru Kelas', href: '/guru-kelas', roles: ['OWNER', 'ADMIN_DAERAH', 'ADMIN_SEKOLAH'], hidden: true },
  { key: 'teacherSubjects', label: 'Guru Kelas & Subjek', href: '/guru-subjek', roles: ['OWNER', 'ADMIN_DAERAH', 'ADMIN_SEKOLAH'] },
];

const roleRank: Record<UserRole, number> = {
  OWNER: 1,
  ADMIN_DAERAH: 2,
  ADMIN_ZON: 3,
  ADMIN_SEKOLAH: 4,
  GURU_KELAS: 5,
  GURU_SUBJEK: 6,
};

export function choosePrimaryProfile(profiles: AccessProfile[]) {
  return [...profiles].sort((a, b) => roleRank[a.role] - roleRank[b.role])[0] ?? null;
}

export function uniqueAccessProfiles(profiles: AccessProfile[]) {
  const seen = new Set<string>();

  return profiles.filter((profile) => {
    const key = [
      profile.email.toLowerCase(),
      profile.role,
      profile.kod_sekolah ?? '',
      profile.zon ?? '',
      profile.status,
    ].join('|');

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function roleLabel(role: string) {
  const labels: Record<string, string> = {
    OWNER: 'Pentadbir Utama',
    ADMIN_DAERAH: 'Admin Daerah',
    ADMIN_ZON: 'Admin Zon',
    ADMIN_SEKOLAH: 'Admin Sekolah',
    GURU_KELAS: 'Guru Kelas',
    GURU_SUBJEK: 'Guru Subjek',
  };

  return labels[role] ?? role;
}

export function defaultAllowedNavForRole(role: UserRole) {
  return navItems
    .filter((item) => !item.hidden && item.key !== 'dashboard')
    .filter((item) => item.roles.includes(role))
    .map((item) => item.key);
}

export function visibleNavItems(
  role: UserRole,
  allowedNav?: string[] | null,
  enabledModules?: OptionalSchoolModuleKey[] | null,
) {
  const allowedSet = role !== 'OWNER' && allowedNav && allowedNav.length > 0 ? new Set(allowedNav) : null;
  const moduleSet = enabledModules && enabledModules.length > 0 ? new Set(enabledModules) : null;
  return navItems.filter((item) => {
    if (item.hidden) return false;
    if (!item.roles.includes(role)) return false;
    if (item.moduleKey && role !== 'OWNER' && !moduleSet?.has(item.moduleKey)) return false;
    if (!allowedSet) return true;
    return item.key === 'dashboard' || allowedSet.has(item.key);
  });
}

export function canAccessPath(
  role: UserRole,
  pathname: string,
  allowedNav?: string[] | null,
  enabledModules?: OptionalSchoolModuleKey[] | null,
) {
  const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
  const matchedItem = navItems
    .filter((item) => item.href !== '/')
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => cleanPath === item.href || cleanPath.startsWith(`${item.href}/`));

  if (!matchedItem) {
    return cleanPath === '/';
  }

  if (!matchedItem.roles.includes(role)) {
    return false;
  }

  if (matchedItem.moduleKey && role !== 'OWNER') {
    return Boolean(enabledModules?.includes(matchedItem.moduleKey));
  }

  if (role === 'OWNER') {
    return true;
  }

  if (matchedItem.hidden) {
    return true;
  }

  if (!allowedNav || allowedNav.length === 0) {
    return true;
  }

  return allowedNav.includes(matchedItem.key);
}
