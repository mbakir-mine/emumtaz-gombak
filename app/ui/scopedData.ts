import type { AccessProfile } from '@/lib/access';
import type { ClassRecord, School, StudentRecord, UserRecord } from '@/lib/data';

export function canSeeSchool(profile: AccessProfile | null, school: School) {
  if (!profile) return false;
  if (profile.role === 'OWNER' || profile.role === 'ADMIN_DAERAH') return true;
  if (profile.role === 'ADMIN_ZON') return Boolean(profile.zon) && school.zon === profile.zon;
  return Boolean(profile.kod_sekolah) && school.kod_sekolah === profile.kod_sekolah;
}

export function scopeSchools(profile: AccessProfile | null, schools: School[]) {
  return schools.filter((school) => canSeeSchool(profile, school));
}

export function scopeClasses(profile: AccessProfile | null, classes: ClassRecord[], schools: School[]) {
  const allowedSchools = new Set(scopeSchools(profile, schools).map((school) => school.kod_sekolah));
  return classes.filter((item) => allowedSchools.has(item.kod_sekolah));
}

export function scopeStudents(
  profile: AccessProfile | null,
  students: StudentRecord[],
  classes: ClassRecord[],
  schools: School[],
) {
  const allowedClasses = new Set(scopeClasses(profile, classes, schools).map((item) => item.id));
  const allowedSchools = new Set(scopeSchools(profile, schools).map((school) => school.kod_sekolah));

  return students.filter((student) => {
    if (student.class_id && allowedClasses.has(student.class_id)) return true;
    return allowedSchools.has(student.kod_sekolah);
  });
}

export function scopeUsers(profile: AccessProfile | null, users: UserRecord[], schools: School[]) {
  if (!profile) return [];
  if (profile.role === 'OWNER' || profile.role === 'ADMIN_DAERAH') return users;

  if (profile.role === 'ADMIN_ZON') {
    const zoneSchools = new Set(
      schools.filter((school) => profile.zon && school.zon === profile.zon).map((school) => school.kod_sekolah),
    );
    return users.filter((user) => user.zon === profile.zon || (user.kod_sekolah && zoneSchools.has(user.kod_sekolah)));
  }

  return users.filter((user) => user.kod_sekolah === profile.kod_sekolah);
}
