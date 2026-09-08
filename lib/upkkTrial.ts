export const UPKK_WRITTEN_PAPERS = [
  { key: 'akidah', paperCode: 'UPKK02', subjectCode: 'TAUHID', code: 'UPKK 02', label: 'Akidah' },
  { key: 'sirah', paperCode: 'UPKK03', subjectCode: 'SIRAH', code: 'UPKK 03', label: 'Sirah' },
  { key: 'adab', paperCode: 'UPKK04', subjectCode: 'AKHLAK', code: 'UPKK 04', label: 'Adab' },
  { key: 'jawi_khat', paperCode: 'UPKK05', subjectCode: 'JIK03', code: 'UPKK 05', label: 'Jawi dan Khat' },
  { key: 'bahasa_arab', paperCode: 'UPKK06', subjectCode: 'BA02', code: 'UPKK 06', label: 'Bahasa Arab' },
  { key: 'ibadah', paperCode: 'UPKK07', subjectCode: 'FEKAH', code: 'UPKK 07', label: 'Ibadah' },
] as const;

export type UpkkWrittenPaperKey = (typeof UPKK_WRITTEN_PAPERS)[number]['key'];
export type UpkkGradeSettings = { kod_sekolah: string; grade_a_min: number; grade_b_min: number; grade_c_min: number };
export type UpkkWrittenMark = { id: string; kod_sekolah: string; tahun_akademik: number; class_id: string; student_id: string; sesi: 1 | 2; paper_code: string; markah: number; updated_at: string };

export const DEFAULT_UPKK_GRADES = { grade_a_min: 85, grade_b_min: 65, grade_c_min: 45 };

export function upkkGrade(mark: number, settings = DEFAULT_UPKK_GRADES) {
  if (mark >= settings.grade_a_min) return 'A';
  if (mark >= settings.grade_b_min) return 'B';
  if (mark >= settings.grade_c_min) return 'C';
  return 'D';
}
