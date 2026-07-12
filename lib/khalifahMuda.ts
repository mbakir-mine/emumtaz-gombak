export type KhalifahMudaIndicator = {
  key: string;
  label: string;
  domain: string;
  kind: 'POSITIF' | 'BIMBINGAN' | 'AKTIVITI_KELAS';
  points: number;
  sort_order?: number;
  status?: string;
};

export const KHALIFAH_MUDA_MODULE_KEY = 'KHALIFAH_MUDA';
export const KHALIFAH_MUDA_YEAR = 6;
export const KHALIFAH_MUDA_LOCKED_ACCESS_MODULES = [KHALIFAH_MUDA_MODULE_KEY] as const;

export const khalifahMudaPositiveIndicators: KhalifahMudaIndicator[] = [
  { key: 'salam', label: 'Memberi salam', domain: 'Adab', kind: 'POSITIF', points: 1 },
  { key: 'doa', label: 'Memimpin atau membaca doa', domain: 'Ibadah', kind: 'POSITIF', points: 1 },
  { key: 'quran', label: 'Peningkatan bacaan al-Quran', domain: 'Ibadah', kind: 'POSITIF', points: 1 },
  { key: 'kebersihan', label: 'Menjaga kebersihan kelas', domain: 'Tanggungjawab', kind: 'POSITIF', points: 1 },
  { key: 'bantu-rakan', label: 'Membantu rakan', domain: 'Adab', kind: 'POSITIF', points: 1 },
  { key: 'amanah', label: 'Menunjukkan amanah', domain: 'Kendiri', kind: 'POSITIF', points: 1 },
  { key: 'kepimpinan', label: 'Menjadi imam, bilal atau ketua aktiviti', domain: 'Kepimpinan', kind: 'POSITIF', points: 2 },
];

export const khalifahMudaGuidanceIndicators: KhalifahMudaIndicator[] = [
  { key: 'adab', label: 'Perlu bimbingan adab', domain: 'Bimbingan', kind: 'BIMBINGAN', points: 0 },
  { key: 'fokus', label: 'Kurang fokus semasa aktiviti', domain: 'Bimbingan', kind: 'BIMBINGAN', points: 0 },
  { key: 'tugasan', label: 'Tidak melaksanakan tugasan', domain: 'Bimbingan', kind: 'BIMBINGAN', points: 0 },
  { key: 'lewat', label: 'Lewat hadir atau lambat masuk kelas', domain: 'Bimbingan', kind: 'BIMBINGAN', points: 0 },
  { key: 'kebersihan-negatif', label: 'Tidak menjaga kebersihan', domain: 'Bimbingan', kind: 'BIMBINGAN', points: 0 },
];

export const khalifahMudaClassActivities: KhalifahMudaIndicator[] = [
  { key: 'doa-kelas', label: 'Doa pembukaan atau penutup kelas', domain: 'Ibadah', kind: 'AKTIVITI_KELAS', points: 1 },
  { key: 'quran-kelas', label: 'Bacaan al-Quran atau hafazan kelas', domain: 'Ibadah', kind: 'AKTIVITI_KELAS', points: 1 },
  { key: 'kebersihan-kelas', label: 'Kebersihan kelas dilaksanakan', domain: 'Tanggungjawab', kind: 'AKTIVITI_KELAS', points: 1 },
  { key: 'tazkirah-kelas', label: 'Tazkirah atau muhasabah ringkas', domain: 'Kendiri', kind: 'AKTIVITI_KELAS', points: 1 },
];

export const khalifahMudaIndicators = [
  ...khalifahMudaPositiveIndicators,
  ...khalifahMudaGuidanceIndicators,
  ...khalifahMudaClassActivities,
];

export function findKhalifahMudaIndicator(key: string) {
  return khalifahMudaIndicators.find((item) => item.key === key) ?? null;
}
