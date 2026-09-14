export type LicenseAccessRecord = {
  status: string;
  starts_on: string;
  ends_on: string | null;
};

export type LicenseAccessState = 'LEGASI' | 'AKTIF' | 'BELUM_BERMULA' | 'DIGANTUNG' | 'TAMAT';

export function evaluateLicenseAccess(license: LicenseAccessRecord | null | undefined, today: string): LicenseAccessState {
  if (!license) return 'LEGASI';
  if (license.status === 'DIGANTUNG') return 'DIGANTUNG';
  if (license.status === 'TAMAT' || (license.ends_on !== null && license.ends_on < today)) return 'TAMAT';
  if (license.starts_on > today) return 'BELUM_BERMULA';
  return license.status === 'AKTIF' || license.status === 'PERCUBAAN' ? 'AKTIF' : 'TAMAT';
}

export function licenseAllowsAccess(state: LicenseAccessState) {
  return state === 'LEGASI' || state === 'AKTIF';
}
