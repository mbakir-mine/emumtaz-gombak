export type SahsiahIhabResult = {
  m3Percent: number;
  totalScore: number;
  band: 1 | 2 | 3 | 4 | 5 | 6;
  grade: string;
  achievement: string;
};

export type SahsiahIhabInput = {
  m3Raw: number;
  m4: number;
  m5: number;
  m6: number;
};

export const SAHSIAH_IHAB_LIMITS = {
  m3Raw: [0, 320],
  m4: [0, 16],
  m5: [0, 100],
  m6: [0, 100],
} as const;

export const sahsiahIhabGradeScale = [
  { min: 101, band: 6 as const, grade: 'AFJ', achievement: 'Al-Fateh Junior', range: '>100' },
  { min: 90, band: 5 as const, grade: 'MUMTAZ', achievement: 'Cemerlang', range: '90–100' },
  { min: 75, band: 4 as const, grade: 'JAID JIDDAN', achievement: 'Sangat Baik', range: '75–89' },
  { min: 65, band: 3 as const, grade: 'JAID', achievement: 'Baik', range: '65–74' },
  { min: 40, band: 2 as const, grade: 'MAQBUL', achievement: 'Sederhana', range: '40–64' },
  { min: 0, band: 1 as const, grade: 'MUSAADAH', achievement: 'Perlu Bimbingan', range: '0–39' },
] as const;

export const sahsiahIhabSixM = [
  ['M1', 'Musyaratah', 'Berazam dan berniat melakukan amalan'],
  ['M2', 'Muraqabah', 'Menyedari diri sentiasa diawasi Allah'],
  ['M3', 'Muhasabah', 'Menghitung amalan diri setiap hari'],
  ['M4', 'Muaqabah', 'Mendidik diri melalui tindakan pembetulan'],
  ['M5', 'Mujahadah', 'Bersungguh-sungguh menambah amalan baik'],
  ['M6', 'Muatabah', 'Menegur diri dan merekod demerit'],
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function calculateSahsiahIhab(input: SahsiahIhabInput): SahsiahIhabResult {
  const m3Raw = clamp(input.m3Raw, 0, 320);
  const m4 = clamp(input.m4, 0, 16);
  const m5 = clamp(input.m5, 0, 100);
  const m6 = clamp(input.m6, 0, 100);
  const m3Percent = Number(((m3Raw / 320) * 100).toFixed(1));
  const totalScore = Number((m3Percent + m4 + m5 - m6).toFixed(1));
  const grade = sahsiahIhabGradeScale.find((item) => totalScore >= item.min) ?? sahsiahIhabGradeScale.at(-1)!;
  return { m3Percent, totalScore, band: grade.band, grade: grade.grade, achievement: grade.achievement };
}

export function parseSahsiahIhabInput(values: Record<string, unknown>): SahsiahIhabInput {
  const parsed = {} as SahsiahIhabInput;
  for (const key of Object.keys(SAHSIAH_IHAB_LIMITS) as Array<keyof SahsiahIhabInput>) {
    const value = typeof values[key] === 'number' ? values[key] : Number(values[key]);
    const [min, max] = SAHSIAH_IHAB_LIMITS[key];
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new Error(`Nilai ${key} mesti antara ${min} dan ${max}.`);
    }
    parsed[key] = value as never;
  }
  return parsed;
}
