import { describe, expect, it } from 'vitest';
import {
  daysUntilLicenseEnd,
  evaluateLicenseAccess,
  licenseAllowsAccess,
  modulesAllowedByLicense,
} from '@/lib/licensing';

describe('evaluateLicenseAccess', () => {
  const today = '2026-09-14';

  it('keeps schools without a licence on legacy access', () => {
    expect(evaluateLicenseAccess(null, today)).toBe('LEGASI');
    expect(licenseAllowsAccess('LEGASI')).toBe(true);
  });

  it('accepts an active licence on its final day', () => {
    expect(evaluateLicenseAccess({ status: 'AKTIF', starts_on: '2026-01-01', ends_on: today }, today)).toBe('AKTIF');
  });

  it('rejects future, suspended and expired licences', () => {
    expect(evaluateLicenseAccess({ status: 'AKTIF', starts_on: '2026-10-01', ends_on: null }, today)).toBe('BELUM_BERMULA');
    expect(evaluateLicenseAccess({ status: 'DIGANTUNG', starts_on: '2026-01-01', ends_on: null }, today)).toBe('DIGANTUNG');
    expect(evaluateLicenseAccess({ status: 'AKTIF', starts_on: '2026-01-01', ends_on: '2026-09-13' }, today)).toBe('TAMAT');
    expect(licenseAllowsAccess('TAMAT')).toBe(false);
  });

  it('keeps trial access visible and permitted', () => {
    const state = evaluateLicenseAccess({ status: 'PERCUBAAN', starts_on: '2026-01-01', ends_on: null }, today);
    expect(state).toBe('PERCUBAAN');
    expect(licenseAllowsAccess(state)).toBe(true);
  });

  it('limits optional modules by package without changing legacy schools', () => {
    const configured = ['TAKWIM', 'PELAPORAN_PBD', 'RPH_AI'] as const;
    expect(modulesAllowedByLicense('ASAS', [...configured])).toEqual(['TAKWIM', 'PELAPORAN_PBD']);
    expect(modulesAllowedByLicense(null, [...configured])).toEqual([...configured]);
    expect(modulesAllowedByLicense('ENTERPRISE', [...configured])).toEqual([...configured]);
  });

  it('calculates renewal windows using whole calendar days', () => {
    expect(daysUntilLicenseEnd('2026-09-30', today)).toBe(16);
    expect(daysUntilLicenseEnd(null, today)).toBeNull();
  });
});
