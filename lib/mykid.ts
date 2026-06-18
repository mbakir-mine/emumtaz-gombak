export function cleanMykid(value: string | null | undefined) {
  return String(value ?? '').replace(/\D/g, '');
}
