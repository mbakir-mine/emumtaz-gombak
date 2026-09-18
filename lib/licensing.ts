import { optionalSchoolModules, type OptionalSchoolModuleKey } from './schoolModules';

export type LicensePlanCode = 'PERCUBAAN' | 'ASAS' | 'PRO' | 'PREMIER';

export type LicenseAccessRecord = {
  status: string;
  starts_on: string;
  ends_on: string | null;
};

export type LicenseAccessState = 'LEGASI' | 'PERCUBAAN' | 'AKTIF' | 'BELUM_BERMULA' | 'DIGANTUNG' | 'TAMAT';

const allModules = optionalSchoolModules.map((module) => module.key);

export const licensePlanModules: Record<LicensePlanCode, OptionalSchoolModuleKey[]> = {
  PERCUBAAN: allModules,
  ASAS: ['TAKWIM', 'KEHADIRAN_HARIAN', 'PELAPORAN_PBD'],
  PRO: allModules.filter((module) => module !== 'RPH_AI'),
  PREMIER: allModules,
};

export function isLicensePlanCode(value: string): value is LicensePlanCode {
  return value in licensePlanModules;
}

export function modulesAllowedByLicense(
  planCode: string | null | undefined,
  configuredModules: OptionalSchoolModuleKey[],
) {
  if (!planCode || !isLicensePlanCode(planCode)) return configuredModules;
  const entitlement = new Set(licensePlanModules[planCode]);
  return configuredModules.filter((module) => entitlement.has(module));
}

export function daysUntilLicenseEnd(endsOn: string | null, today: string) {
  if (!endsOn) return null;
  const end = Date.parse(`${endsOn}T00:00:00Z`);
  const start = Date.parse(`${today}T00:00:00Z`);
  if (!Number.isFinite(end) || !Number.isFinite(start)) return null;
  return Math.round((end - start) / 86_400_000);
}

export function evaluateLicenseAccess(license: LicenseAccessRecord | null | undefined, today: string): LicenseAccessState {
  if (!license) return 'LEGASI';
  if (license.status === 'DIGANTUNG') return 'DIGANTUNG';
  if (license.status === 'TAMAT' || (license.ends_on !== null && license.ends_on < today)) return 'TAMAT';
  if (license.starts_on > today) return 'BELUM_BERMULA';
  if (license.status === 'PERCUBAAN') return 'PERCUBAAN';
  return license.status === 'AKTIF' ? 'AKTIF' : 'TAMAT';
}

export function licenseAllowsAccess(state: LicenseAccessState) {
  return state === 'LEGASI' || state === 'PERCUBAAN' || state === 'AKTIF';
}
