export const PSRA_PAPERS = [
  { key: 'akhlak_sirah', subjectCode: 'AS01', label: 'Akhlak & Sirah', shortLabel: 'Akhlak & Sirah' },
  { key: 'bahasa_arab', subjectCode: 'BA02', label: 'Bahasa Arab', shortLabel: 'Bahasa Arab' },
  { key: 'jawi_imlak_khat', subjectCode: 'JIK03', label: 'Jawi, Imlak & Khat', shortLabel: 'Jawi, Imlak & Khat' },
  { key: 'tauhid_fekah', subjectCode: 'TF04', label: 'Tauhid & Fekah', shortLabel: 'Tauhid & Fekah' },
  { key: 'tajwid', subjectCode: 'TJ05', label: 'Tajwid', shortLabel: 'Tajwid' },
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

export type PsraPaperMarkRecord = {
  id: string;
  kod_sekolah: string;
  tahun_akademik: number;
  class_id: string;
  student_id: string;
  sesi: 1 | 2;
  paper_code: string;
  markah: number;
  entered_by: string;
  updated_by: string;
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
