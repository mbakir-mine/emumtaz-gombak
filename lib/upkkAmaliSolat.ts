export type UpkkAmaliItem = {
  code: string;
  label: string;
  max: number;
};

export type UpkkAmaliGroup = {
  code: string;
  title: string;
  items: UpkkAmaliItem[];
};

export type UpkkAmaliSection = {
  code: 'A' | 'B' | 'C';
  title: string;
  fullTitle: string;
  total: number;
  groups: UpkkAmaliGroup[];
};

export const UPKK_AMALI_SOLAT_TOTAL = 100;

export const UPKK_AMALI_SOLAT_SECTIONS: UpkkAmaliSection[] = [
  {
    code: 'A',
    title: 'Bahagian A',
    fullTitle: 'Sebelum Solat',
    total: 50,
    groups: [
      {
        code: 'A1',
        title: 'Amali Wuduk',
        items: [
          { code: 'A1.1', label: 'Niat wuduk', max: 1 },
          { code: 'A1.2', label: 'Membasuh muka', max: 1 },
          { code: 'A1.3', label: 'Membasuh kedua tangan hingga siku', max: 1 },
          { code: 'A1.4', label: 'Menyapu sebahagian kepala', max: 5 },
          { code: 'A1.5', label: 'Membasuh kedua kaki hingga buku lali', max: 1 },
          { code: 'A1.6', label: 'Tertib wuduk', max: 1 },
          { code: 'A1.7', label: 'Membaca basmalah', max: 1 },
          { code: 'A1.8', label: 'Berkumur', max: 1 },
          { code: 'A1.9', label: 'Memasukkan air ke hidung', max: 1 },
          { code: 'A1.10', label: 'Membaca doa selepas wuduk', max: 5 },
        ],
      },
      {
        code: 'A2',
        title: 'Amali Tayamum',
        items: [
          { code: 'A2.1', label: 'Niat tayamum', max: 2 },
          { code: 'A2.2', label: 'Menyapu muka', max: 1 },
          { code: 'A2.3', label: 'Menyapu kedua tangan', max: 1 },
        ],
      },
      {
        code: 'A3',
        title: 'Lafaz Azan dan Iqamah',
        items: [
          { code: 'A3.1', label: 'Lafaz azan', max: 11 },
          { code: 'A3.2', label: 'Lafaz iqamah', max: 11 },
        ],
      },
      {
        code: 'A4',
        title: 'Doa Selepas Azan dan Iqamah',
        items: [{ code: 'A4.1', label: 'Doa selepas azan dan iqamah', max: 6 }],
      },
    ],
  },
  {
    code: 'B',
    title: 'Bahagian B',
    fullTitle: 'Solat',
    total: 30,
    groups: [
      { code: 'B1', title: 'Berdiri Tegak', items: [{ code: 'B1.1', label: 'Berdiri tegak', max: 1 }] },
      { code: 'B2', title: 'Niat', items: [{ code: 'B2.1', label: 'Niat solat', max: 1 }] },
      { code: 'B3', title: 'Takbiratul Ihram', items: [{ code: 'B3.1', label: 'Takbiratul ihram', max: 1 }] },
      { code: 'B4', title: 'Doa Iftitah', items: [{ code: 'B4.1', label: 'Doa iftitah', max: 2 }] },
      { code: 'B5', title: 'Surah Al-Fatihah', items: [{ code: 'B5.1', label: 'Surah al-Fatihah', max: 1 }] },
      { code: 'B6', title: 'Surah Al-Quran', items: [{ code: 'B6.1', label: 'Surah al-Quran', max: 1 }] },
      {
        code: 'B7',
        title: "Rukuk Serta Tama'ninah",
        items: [{ code: 'B7.1', label: "Rukuk serta tama'ninah", max: 1 }],
      },
      {
        code: 'B8',
        title: "Iktidal Serta Tama'ninah",
        items: [
          { code: 'B8.1', label: "Iktidal serta tama'ninah", max: 1 },
          { code: 'B8.2', label: 'Bacaan iktidal', max: 1 },
        ],
      },
      {
        code: 'B9',
        title: 'Doa Qunut',
        items: [
          { code: 'B9.1', label: 'Doa qunut', max: 1 },
          { code: 'B9.2', label: 'Bacaan doa qunut', max: 2 },
        ],
      },
      {
        code: 'B10',
        title: "Sujud Serta Tama'ninah",
        items: [
          { code: 'B10.1', label: "Sujud serta tama'ninah", max: 1 },
          { code: 'B10.2', label: 'Bacaan sujud', max: 1 },
        ],
      },
      {
        code: 'B11',
        title: "Duduk Antara Dua Sujud Serta Tama'ninah",
        items: [
          { code: 'B11.1', label: "Duduk antara dua sujud serta tama'ninah", max: 1 },
          { code: 'B11.2', label: 'Bacaan duduk antara dua sujud', max: 1 },
        ],
      },
      {
        code: 'B12',
        title: 'Tahiyat Awal',
        items: [
          { code: 'B12.1', label: 'Tahiyat awal', max: 1 },
          { code: 'B12.2', label: 'Bacaan tahiyat awal', max: 2 },
        ],
      },
      {
        code: 'B13',
        title: 'Tahiyat Akhir',
        items: [
          { code: 'B13.1', label: 'Tahiyat akhir', max: 1 },
          { code: 'B13.2', label: 'Bacaan tahiyat akhir', max: 2 },
        ],
      },
      {
        code: 'B14',
        title: 'Salam',
        items: [
          { code: 'B14.1', label: 'Salam', max: 1 },
          { code: 'B14.2', label: 'Bacaan salam', max: 1 },
        ],
      },
      { code: 'B15', title: 'Tertib', items: [{ code: 'B15.1', label: 'Tertib', max: 1 }] },
      {
        code: 'B16',
        title: 'Niat Solat-Solat Fardu',
        items: [
          { code: 'B16.1', label: 'Niat solat Subuh', max: 1 },
          { code: 'B16.2', label: 'Niat solat Zohor', max: 1 },
          { code: 'B16.3', label: 'Niat solat Asar', max: 1 },
          { code: 'B16.4', label: 'Niat solat Maghrib dan Isyak', max: 1 },
        ],
      },
    ],
  },
  {
    code: 'C',
    title: 'Bahagian C',
    fullTitle: 'Amalan Selepas Solat',
    total: 20,
    groups: [
      {
        code: 'C1',
        title: 'Wirid',
        items: [
          { code: 'C1.1', label: 'Wirid 1', max: 1 },
          { code: 'C1.2', label: 'Wirid 2', max: 1 },
          { code: 'C1.3', label: 'Wirid 3', max: 1 },
          { code: 'C1.4', label: 'Wirid 4', max: 1 },
          { code: 'C1.5', label: 'Wirid 5', max: 1 },
          { code: 'C1.6', label: 'Wirid 6', max: 1 },
          { code: 'C1.7', label: 'Wirid 7', max: 1 },
          { code: 'C1.8', label: 'Wirid 8', max: 1 },
          { code: 'C1.9', label: 'Wirid 9', max: 1 },
          { code: 'C1.10', label: 'Wirid 10', max: 1 },
        ],
      },
      {
        code: 'C2',
        title: 'Doa Selepas Solat',
        items: [{ code: 'C2.1', label: 'Doa selepas solat', max: 10 }],
      },
    ],
  },
];

export const UPKK_AMALI_SOLAT_ITEMS = UPKK_AMALI_SOLAT_SECTIONS.flatMap((section) =>
  section.groups.flatMap((group) =>
    group.items.map((item) => ({
      ...item,
      section: section.code,
      sectionTitle: section.fullTitle,
      group: group.code,
      groupTitle: group.title,
    })),
  ),
);

function normalizeScoreValue(value: unknown) {
  const numericValue =
    typeof value === 'string' ? Number(value.trim().replace(',', '.')) : Number(value ?? 0);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

export function calculateUpkkAmaliTotal(scores: Record<string, unknown>) {
  return UPKK_AMALI_SOLAT_ITEMS.reduce((total, item) => {
    const rawValue = normalizeScoreValue(scores[item.code]);
    const score = Number.isFinite(rawValue) ? Math.min(item.max, Math.max(0, rawValue)) : 0;
    return total + score;
  }, 0);
}
