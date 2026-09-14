import { describe, expect, it } from 'vitest';
import { evaluateLicenseAccess, licenseAllowsAccess } from '@/lib/licensing';

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
});
