import { describe, expect, it } from 'vitest';
import { auditRowsToCsv, matchesAuditFilters, parseAuditFilters } from '@/lib/audit';

describe('parseAuditFilters', () => {
  it('normalizes supported filters and rejects invalid dates', () => {
    expect(parseAuditFilters({ category: 'auth', action: 'login', school: ' byp7001 ', from: '14-09-2026' })).toEqual({
      query: '',
      category: 'AUTH',
      action: 'LOGIN',
      school: 'BYP7001',
      from: '',
      to: '',
    });
  });
});

describe('matchesAuditFilters', () => {
  const row = {
    created_at: '2026-09-14T10:00:00.000Z',
    event_type: 'LOGIN',
    actor_email: 'guru@example.com',
    kod_sekolah: 'BYP7001',
  };

  it('matches category, action, school, date and free text', () => {
    expect(matchesAuditFilters(row, {
      query: 'guru@', category: 'AUTH', action: 'LOGIN', school: 'BYP7001', from: '2026-09-14', to: '2026-09-14',
    }, 'AUTH')).toBe(true);
  });

  it('rejects a row outside the selected category', () => {
    expect(matchesAuditFilters(row, {
      query: '', category: 'EDIT', action: '', school: '', from: '', to: '',
    }, 'AUTH')).toBe(false);
  });
});

describe('auditRowsToCsv', () => {
  it('escapes quotes and neutralizes spreadsheet formulas', () => {
    const csv = auditRowsToCsv([{ jenis: 'EDIT', email_pelaku: '=HYPERLINK("x")' }]);
    expect(csv).toContain('"\'=HYPERLINK(""x"")"');
    expect(csv.startsWith('\uFEFF')).toBe(true);
  });
});
