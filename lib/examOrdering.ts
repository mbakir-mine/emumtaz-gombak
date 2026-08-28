const EXAM_PRIORITY: Record<string, number> = {
  UPSA: 1,
  UASA: 2,
  PSRA1: 3,
  PSRA2: 4,
};

export function normalizeExamCode(code: string | null | undefined) {
  return String(code ?? '').trim().toUpperCase();
}

export function isStandardExamCode(code: string | null | undefined) {
  const normalized = normalizeExamCode(code);
  return normalized === 'UPSA' || normalized === 'UASA';
}

export function isPsraExamCode(code: string | null | undefined) {
  const normalized = normalizeExamCode(code);
  return normalized === 'PSRA1' || normalized === 'PSRA2';
}

export function isMarkEntryExamCode(code: string | null | undefined) {
  return isStandardExamCode(code) || isPsraExamCode(code);
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
