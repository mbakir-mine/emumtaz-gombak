export const PSRA_PAPERS = [
  { key: 'akhlak_sirah', label: 'Akhlak & Sirah', shortLabel: 'Akhlak & Sirah' },
  { key: 'bahasa_arab', label: 'Bahasa Arab', shortLabel: 'Bahasa Arab' },
  { key: 'jawi_imlak_khat', label: 'Jawi, Imlak & Khat', shortLabel: 'Jawi, Imlak & Khat' },
  { key: 'tauhid_fekah', label: 'Tauhid & Fekah', shortLabel: 'Tauhid & Fekah' },
  { key: 'tajwid', label: 'Tajwid', shortLabel: 'Tajwid' },
] as const;

export type PsraPaperKey = (typeof PSRA_PAPERS)[number]['key'];

export type PsraTrialRecord = {
  id: string;
  kod_sekolah: string;
  tahun_akademik: number;
  class_id: string;
  student_id: string;
  sesi: 1 | 2;
  akhlak_sirah: number;
  bahasa_arab: number;
  jawi_imlak_khat: number;
  tauhid_fekah: number;
  tajwid: number;
  jumlah: number;
  peratus: number;
  gred: string;
  updated_at: string;
};

export function psraGrade(percentage: number) {
  if (percentage >= 90) return 'Mumtaz';
  if (percentage >= 75) return 'Jayyid Jiddan';
  if (percentage >= 60) return 'Jayyid';
  if (percentage >= 40) return 'Maqbul';
  return 'Musaadah';
}

export function psraTotal(scores: Partial<Record<PsraPaperKey, number>>) {
  return PSRA_PAPERS.reduce((total, paper) => total + Number(scores[paper.key] ?? 0), 0);
}
