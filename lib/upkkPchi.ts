export type UpkkPchiItem = {
  code: string;
  label: string;
  max: number;
};

export type UpkkPchiGroup = {
  code: string;
  title: string;
  items: UpkkPchiItem[];
};

export type UpkkPchiSection = {
  code: 'A' | 'B' | 'C';
  title: string;
  fullTitle: string;
  total: number;
  groups: UpkkPchiGroup[];
};

export const UPKK_PCHI_TOTAL = 100;

export const UPKK_PCHI_SECTIONS: UpkkPchiSection[] = [
  {
    code: 'A',
    title: 'Bahagian A',
    fullTitle: 'Adab',
    total: 45,
    groups: [
      {
        code: 'A1',
        title: 'Adab Dengan Keluarga',
        items: [
          { code: 'A1.1', label: 'Soalan A1.1', max: 2 },
          { code: 'A1.2', label: 'Soalan A1.2', max: 1 },
          { code: 'A1.3', label: 'Soalan A1.3', max: 2 },
          { code: 'A1.4', label: 'Soalan A1.4', max: 2 },
          { code: 'A1.5', label: 'Soalan A1.5', max: 2 },
          { code: 'A1.6', label: 'Soalan A1.6', max: 2 },
        ],
      },
      {
        code: 'A2',
        title: 'Adab Dalam Kehidupan Seharian',
        items: [
          { code: 'A2.1', label: 'Soalan A2.1', max: 1 },
          { code: 'A2.2', label: 'Soalan A2.2', max: 2 },
          { code: 'A2.3', label: 'Soalan A2.3', max: 1 },
          { code: 'A2.4', label: 'Soalan A2.4', max: 2 },
          { code: 'A2.5', label: 'Soalan A2.5', max: 1 },
          { code: 'A2.6', label: 'Soalan A2.6', max: 2 },
          { code: 'A2.7', label: 'Soalan A2.7', max: 1 },
          { code: 'A2.8', label: 'Soalan A2.8', max: 2 },
          { code: 'A2.9', label: 'Soalan A2.9', max: 1 },
          { code: 'A2.10', label: 'Soalan A2.10', max: 2 },
        ],
      },
      {
        code: 'A3',
        title: 'Adab Menuntut Ilmu',
        items: [
          { code: 'A3.1', label: 'Soalan A3.1', max: 1 },
          { code: 'A3.2', label: 'Soalan A3.2', max: 2 },
          { code: 'A3.3', label: 'Soalan A3.3', max: 2 },
          { code: 'A3.4', label: 'Soalan A3.4', max: 2 },
          { code: 'A3.5', label: 'Soalan A3.5', max: 2 },
          { code: 'A3.6', label: 'Soalan A3.6', max: 2 },
        ],
      },
      {
        code: 'A4',
        title: 'Adab Berjiran dan Bermasyarakat',
        items: [
          { code: 'A4.1', label: 'Soalan A4.1', max: 2 },
          { code: 'A4.2', label: 'Soalan A4.2', max: 2 },
          { code: 'A4.3', label: 'Soalan A4.3', max: 2 },
          { code: 'A4.4', label: 'Soalan A4.4', max: 2 },
        ],
      },
    ],
  },
  {
    code: 'B',
    title: 'Bahagian B',
    fullTitle: 'Ibadah',
    total: 30,
    groups: [
      {
        code: 'B1',
        title: 'Taharah dan Istinjak',
        items: [
          { code: 'B1.1', label: 'Soalan B1.1', max: 2 },
          { code: 'B1.2', label: 'Soalan B1.2', max: 1 },
          { code: 'B1.3', label: 'Soalan B1.3', max: 2 },
          { code: 'B1.4', label: 'Soalan B1.4', max: 2 },
        ],
      },
      {
        code: 'B2',
        title: 'Wuduk dan Tayamum',
        items: [
          { code: 'B2.1', label: 'Soalan B2.1', max: 1 },
          { code: 'B2.2', label: 'Soalan B2.2', max: 1 },
        ],
      },
      { code: 'B3', title: 'Najis', items: [{ code: 'B3.1', label: 'Soalan B3.1', max: 2 }] },
      { code: 'B4', title: 'Hadas Kecil dan Hadas Besar', items: [{ code: 'B4.1', label: 'Soalan B4.1', max: 2 }] },
      { code: 'B5', title: 'Konsep Baligh', items: [{ code: 'B5.1', label: 'Soalan B5.1', max: 2 }] },
      {
        code: 'B6',
        title: 'Solat',
        items: [
          { code: 'B6.1', label: 'Soalan B6.1', max: 1 },
          { code: 'B6.2', label: 'Soalan B6.2', max: 1 },
          { code: 'B6.3', label: 'Soalan B6.3', max: 2 },
          { code: 'B6.4', label: 'Soalan B6.4', max: 2 },
          { code: 'B6.5', label: 'Soalan B6.5', max: 2 },
          { code: 'B6.6', label: 'Soalan B6.6', max: 2 },
          { code: 'B6.7', label: 'Soalan B6.7', max: 1 },
          { code: 'B6.8', label: 'Soalan B6.8', max: 1 },
        ],
      },
      {
        code: 'B7',
        title: 'Puasa',
        items: [
          { code: 'B7.1', label: 'Soalan B7.1', max: 2 },
          { code: 'B7.2', label: 'Soalan B7.2', max: 1 },
        ],
      },
    ],
  },
  {
    code: 'C',
    title: 'Bahagian C',
    fullTitle: 'Akidah',
    total: 25,
    groups: [
      {
        code: 'C1',
        title: 'Rukun Islam',
        items: [
          { code: 'C1.1', label: 'Soalan C1.1', max: 2 },
          { code: 'C1.2', label: 'Soalan C1.2', max: 2 },
        ],
      },
      {
        code: 'C2',
        title: 'Rukun Iman',
        items: [
          { code: 'C2.1', label: 'Soalan C2.1', max: 2 },
          { code: 'C2.2', label: 'Soalan C2.2', max: 2 },
          { code: 'C2.3', label: 'Soalan C2.3', max: 2 },
          { code: 'C2.4', label: 'Soalan C2.4', max: 2 },
          { code: 'C2.5', label: 'Soalan C2.5', max: 1 },
          { code: 'C2.6', label: 'Soalan C2.6', max: 2 },
          { code: 'C2.7', label: 'Soalan C2.7', max: 2 },
          { code: 'C2.8', label: 'Soalan C2.8', max: 2 },
          { code: 'C2.9', label: 'Soalan C2.9', max: 2 },
        ],
      },
      {
        code: 'C3',
        title: "Perkara Sam'iyyat",
        items: [
          { code: 'C3.1', label: 'Soalan C3.1', max: 2 },
          { code: 'C3.2', label: 'Soalan C3.2', max: 2 },
        ],
      },
    ],
  },
];

export const UPKK_PCHI_ITEMS = UPKK_PCHI_SECTIONS.flatMap((section) =>
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

export function calculateUpkkPchiTotal(scores: Record<string, unknown>) {
  return UPKK_PCHI_ITEMS.reduce((total, item) => {
    const rawValue = normalizeScoreValue(scores[item.code]);
    const score = Number.isFinite(rawValue) ? Math.min(item.max, Math.max(0, rawValue)) : 0;
    return total + score;
  }, 0);
}
