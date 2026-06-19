const EXAM_PRIORITY: Record<string, number> = {
  UPSA: 1,
  UASA: 2,
  PBD: 3,
};

function normalizeExamCode(code: string | null | undefined) {
  return String(code ?? '').trim().toUpperCase();
}

export function examPriority(code: string | null | undefined) {
  return EXAM_PRIORITY[normalizeExamCode(code)] ?? 99;
}

export function compareExamCode(a: string | null | undefined, b: string | null | undefined) {
  const priorityDiff = examPriority(a) - examPriority(b);
  if (priorityDiff !== 0) return priorityDiff;
  return normalizeExamCode(a).localeCompare(normalizeExamCode(b), 'ms', { sensitivity: 'base' });
}

export function compareExamRecords<T extends { kod_peperiksaan: string; nama_peperiksaan?: string | null }>(a: T, b: T) {
  const codeDiff = compareExamCode(a.kod_peperiksaan, b.kod_peperiksaan);
  if (codeDiff !== 0) return codeDiff;
  return String(a.nama_peperiksaan ?? '').localeCompare(String(b.nama_peperiksaan ?? ''), 'ms', { sensitivity: 'base' });
}
