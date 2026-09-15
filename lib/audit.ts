export type AuditCategory = 'ALL' | 'AUTH' | 'EDIT';

export type AuditFilters = {
  query: string;
  category: AuditCategory;
  action: string;
  school: string;
  from: string;
  to: string;
};

type SearchValue = string | string[] | undefined;

function first(value: SearchValue) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function clean(value: SearchValue, maxLength = 120) {
  return first(value).trim().slice(0, maxLength);
}

export function parseAuditFilters(params: Record<string, SearchValue>): AuditFilters {
  const category = clean(params.category, 8).toUpperCase();
  return {
    query: clean(params.q),
    category: category === 'AUTH' || category === 'EDIT' ? category : 'ALL',
    action: clean(params.action, 12).toUpperCase(),
    school: clean(params.school, 40).toUpperCase(),
    from: /^\d{4}-\d{2}-\d{2}$/.test(clean(params.from, 10)) ? clean(params.from, 10) : '',
    to: /^\d{4}-\d{2}-\d{2}$/.test(clean(params.to, 10)) ? clean(params.to, 10) : '',
  };
}

export function matchesAuditFilters(
  row: Record<string, unknown>,
  filters: AuditFilters,
  kind: 'AUTH' | 'EDIT',
) {
  if (filters.category !== 'ALL' && filters.category !== kind) return false;
  const action = String(row.event_type ?? row.action ?? '').toUpperCase();
  if (filters.action && action !== filters.action) return false;
  if (filters.school && String(row.kod_sekolah ?? '').toUpperCase() !== filters.school) return false;

  const createdAt = String(row.created_at ?? '');
  if (filters.from && createdAt < `${filters.from}T00:00:00`) return false;
  if (filters.to && createdAt > `${filters.to}T23:59:59.999`) return false;

  if (!filters.query) return true;
  const needle = filters.query.toLocaleLowerCase('ms-MY');
  return Object.values(row).some((value) => {
    const text = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '');
    return text.toLocaleLowerCase('ms-MY').includes(needle);
  });
}

function csvCell(value: unknown) {
  let text = value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function auditRowsToCsv(rows: Record<string, unknown>[]) {
  const columns = [
    'jenis',
    'masa',
    'tindakan',
    'email_pelaku',
    'nama_pelaku',
    'peranan',
    'kod_sekolah',
    'jadual',
    'id_rekod',
    'medan_berubah',
    'nilai_lama',
    'nilai_baharu',
    'id_sesi',
  ];
  const header = columns.map(csvCell).join(',');
  const body = rows.map((row) => columns.map((column) => csvCell(row[column])).join(','));
  return `\uFEFF${[header, ...body].join('\r\n')}\r\n`;
}

export function repeatedLoginFailureCount(
  rows: Array<{ created_at: string; identifier_hash: string }>,
  now: Date,
  threshold = 5,
) {
  const cutoff = now.getTime() - 15 * 60_000;
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    if (Date.parse(row.created_at) >= cutoff) {
      counts.set(row.identifier_hash, (counts.get(row.identifier_hash) ?? 0) + 1);
    }
  });
  return [...counts.values()].filter((count) => count >= threshold).length;
}
