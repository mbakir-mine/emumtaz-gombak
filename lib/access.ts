export type UserRole = 'OWNER' | 'ADMIN_DAERAH' | 'ADMIN_SEKOLAH' | 'GURU_KELAS' | 'GURU_SUBJEK';

export type AccessProfile = {
  id: string;
  email: string;
  nama: string;
  role: UserRole;
  kod_sekolah: string | null;
  status: string;
};

export type NavItem = {
  key: string;
  label: string;
  href: string;
  roles: UserRole[];
};

export const allRoles: UserRole[] = ['OWNER', 'ADMIN_DAERAH', 'ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK'];

export const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/', roles: allRoles },
  { key: 'schools', label: 'Sekolah', href: '/sekolah', roles: ['OWNER', 'ADMIN_DAERAH', 'ADMIN_SEKOLAH'] },
  { key: 'classes', label: 'Kelas', href: '/kelas', roles: ['OWNER', 'ADMIN_DAERAH', 'ADMIN_SEKOLAH'] },
  { key: 'students', label: 'Murid', href: '/murid', roles: ['OWNER', 'ADMIN_DAERAH', 'ADMIN_SEKOLAH', 'GURU_KELAS'] },
  { key: 'teachers', label: 'Guru', href: '/guru', roles: ['OWNER', 'ADMIN_DAERAH', 'ADMIN_SEKOLAH'] },
  { key: 'marks', label: 'Markah', href: '/markah', roles: allRoles },
  { key: 'analysis', label: 'Analisis', href: '/analisis', roles: allRoles },
  { key: 'comparison', label: 'Perbandingan', href: '/perbandingan', roles: ['OWNER', 'ADMIN_DAERAH', 'ADMIN_SEKOLAH'] },
  { key: 'teacherClasses', label: 'Guru Kelas', href: '/guru-kelas', roles: ['OWNER', 'ADMIN_DAERAH', 'ADMIN_SEKOLAH'] },
  { key: 'teacherSubjects', label: 'Guru Subjek', href: '/guru-subjek', roles: ['OWNER', 'ADMIN_DAERAH', 'ADMIN_SEKOLAH'] },
  { key: 'users', label: 'Pengesahan Pengguna', href: '/pengguna', roles: ['OWNER', 'ADMIN_DAERAH'] },
  { key: 'setup', label: 'Setup Data', href: '/setup', roles: ['OWNER', 'ADMIN_DAERAH', 'ADMIN_SEKOLAH'] },
  { key: 'reports', label: 'Laporan', href: '/laporan', roles: allRoles },
];

const roleRank: Record<UserRole, number> = {
  OWNER: 1,
  ADMIN_DAERAH: 2,
  ADMIN_SEKOLAH: 3,
  GURU_KELAS: 4,
  GURU_SUBJEK: 5,
};

export function choosePrimaryProfile(profiles: AccessProfile[]) {
  return [...profiles].sort((a, b) => roleRank[a.role] - roleRank[b.role])[0] ?? null;
}

export function roleLabel(role: string) {
  const labels: Record<string, string> = {
    OWNER: 'Pentadbir Utama',
    ADMIN_DAERAH: 'Pentadbir Daerah',
    ADMIN_SEKOLAH: 'Pentadbir Sekolah',
    GURU_KELAS: 'Guru Kelas',
    GURU_SUBJEK: 'Guru Subjek',
  };

  return labels[role] ?? role;
}

export function canAccessPath(role: UserRole, pathname: string) {
  if (role === 'OWNER' || role === 'ADMIN_DAERAH') return true;

  const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
  const matchedItem = navItems
    .filter((item) => item.href !== '/')
    .find((item) => cleanPath === item.href || cleanPath.startsWith(`${item.href}/`));

  if (!matchedItem) {
    return cleanPath === '/';
  }

  return matchedItem.roles.includes(role);
}
