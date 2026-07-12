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
          { code: 'A1.1', label: 'Sebutkan doa untuk ibu bapa', max: 2 },
          { code: 'A1.2', label: 'Bagaimanakah cara bercakap dengan ibu bapa?', max: 1 },
          { code: 'A1.3', label: 'Sebutkan kesan derhaka kepada ibu bapa', max: 2 },
          { code: 'A1.4', label: 'Terangkan maksud mahram', max: 2 },
          { code: 'A1.5', label: 'Terangkan maksud bukan mahram berserta contoh', max: 2 },
          { code: 'A1.6', label: 'Terangkan batas aurat lelaki dan perempuan dengan bukan mahram', max: 2 },
        ],
      },
      {
        code: 'A2',
        title: 'Adab Dalam Kehidupan Seharian',
        items: [
          { code: 'A2.1', label: 'Sebutkan satu adab sebelum tidur', max: 1 },
          { code: 'A2.2', label: 'Sebutkan doa sebelum tidur', max: 2 },
          { code: 'A2.3', label: 'Sebutkan satu adab masuk tandas', max: 1 },
          { code: 'A2.4', label: 'Sebutkan doa masuk tandas', max: 2 },
          { code: 'A2.5', label: 'Sebutkan satu adab sebelum makan', max: 1 },
          { code: 'A2.6', label: 'Sebutkan doa sebelum makan', max: 2 },
          { code: 'A2.7', label: 'Sebutkan satu adab masuk rumah', max: 1 },
          { code: 'A2.8', label: 'Sebutkan doa keluar rumah', max: 2 },
          { code: 'A2.9', label: 'Sebutkan satu adab menaiki kenderaan', max: 1 },
          { code: 'A2.10', label: 'Sebutkan doa naik kenderaan', max: 2 },
        ],
      },
      {
        code: 'A3',
        title: 'Adab Menuntut Ilmu',
        items: [
          { code: 'A3.1', label: 'Sebutkan satu adab sebelum belajar', max: 1 },
          { code: 'A3.2', label: 'Sebutkan doa sebelum belajar', max: 2 },
          { code: 'A3.3', label: 'Sebutkan satu perkara yang dilarang ketika guru sedang mengajar', max: 2 },
          { code: 'A3.4', label: 'Sebutkan satu adab dengan al-Quran', max: 2 },
          { code: 'A3.5', label: 'Sebutkan satu cara menjaga kebersihan sekolah', max: 2 },
          { code: 'A3.6', label: 'Sebutkan satu cara menjaga harta benda sekolah', max: 2 },
        ],
      },
      {
        code: 'A4',
        title: 'Adab Berjiran dan Bermasyarakat',
        items: [
          { code: 'A4.1', label: 'Sebutkan satu adab dengan orang dewasa', max: 2 },
          { code: 'A4.2', label: 'Sebutkan satu adab dengan jiran', max: 2 },
          { code: 'A4.3', label: 'Sebutkan satu adab menyambut tetamu', max: 2 },
          { code: 'A4.4', label: 'Sebutkan satu adab terhadap orang kurang upaya', max: 2 },
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
          { code: 'B1.1', label: 'Sebutkan pengertian taharah', max: 2 },
          { code: 'B1.2', label: 'Sebutkan hukum taharah', max: 1 },
          { code: 'B1.3', label: 'Sebutkan pengertian istinjak', max: 2 },
          { code: 'B1.4', label: 'Sebutkan dua bahan yang boleh digunakan untuk beristinjak selain air', max: 2 },
        ],
      },
      {
        code: 'B2',
        title: 'Wuduk dan Tayamum',
        items: [
          { code: 'B2.1', label: 'Sebutkan satu hikmah wuduk dan tayamum', max: 1 },
          { code: 'B2.2', label: 'Sebutkan perkara yang membatalkan tayamum sahaja', max: 1 },
        ],
      },
      { code: 'B3', title: 'Najis', items: [{ code: 'B3.1', label: 'Sebutkan satu cara menyucikan najis', max: 2 }] },
      {
        code: 'B4',
        title: 'Hadas Kecil dan Hadas Besar',
        items: [{ code: 'B4.1', label: 'Sebutkan cara menyucikan hadas kecil dan hadas besar', max: 2 }],
      },
      {
        code: 'B5',
        title: 'Konsep Baligh',
        items: [{ code: 'B5.1', label: 'Sebutkan satu tanda baligh lelaki dan satu tanda baligh perempuan', max: 2 }],
      },
      {
        code: 'B6',
        title: 'Solat',
        items: [
          { code: 'B6.1', label: 'Apakah hukum solat fardu?', max: 1 },
          { code: 'B6.2', label: 'Tentukan hukum solat bagi situasi tidak membaca surah al-Fatihah', max: 1 },
          { code: 'B6.3', label: 'Sebutkan satu kelebihan solat berjemaah', max: 2 },
          { code: 'B6.4', label: 'Sebutkan satu kepentingan solat Jumaat', max: 2 },
          { code: 'B6.5', label: 'Sebutkan pengertian solat jamak dan qasar', max: 2 },
          { code: 'B6.6', label: 'Sebutkan satu syarat solat jamak dan qasar', max: 2 },
          { code: 'B6.7', label: 'Sebutkan satu cara solat ketika sakit', max: 1 },
          { code: 'B6.8', label: 'Sebutkan satu jenis solat sunat', max: 1 },
        ],
      },
      {
        code: 'B7',
        title: 'Puasa',
        items: [
          { code: 'B7.1', label: 'Sebutkan pengertian puasa', max: 2 },
          { code: 'B7.2', label: 'Sebutkan satu perkara yang membatalkan puasa', max: 1 },
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
          { code: 'C1.1', label: 'Sebutkan dua rukun Islam', max: 2 },
          { code: 'C1.2', label: 'Sebutkan lafaz dua kalimah syahadah dan maksudnya', max: 2 },
        ],
      },
      {
        code: 'C2',
        title: 'Rukun Iman',
        items: [
          { code: 'C2.1', label: 'Sebutkan dua rukun iman', max: 2 },
          { code: 'C2.2', label: 'Apakah maksud beriman kepada Allah?', max: 2 },
          { code: 'C2.3', label: 'Sebutkan satu kesan mempercayai sifat wujud Allah', max: 2 },
          { code: 'C2.4', label: 'Apakah maksud beriman kepada malaikat?', max: 2 },
          { code: 'C2.5', label: 'Sebutkan satu nama malaikat yang wajib diketahui', max: 1 },
          { code: 'C2.6', label: 'Sebutkan satu sikap membuktikan keimanan kepada rasul', max: 2 },
          { code: 'C2.7', label: 'Sebutkan dua sifat ulul azmi', max: 2 },
          { code: 'C2.8', label: 'Sebutkan satu cara beriman dengan al-Quran', max: 2 },
          { code: 'C2.9', label: 'Terangkan maksud beriman kepada qada dan qadar', max: 2 },
        ],
      },
      {
        code: 'C3',
        title: "Perkara Sam'iyyat",
        items: [
          { code: 'C3.1', label: "Apakah maksud perkara sam'iyyat?", max: 2 },
          { code: 'C3.2', label: "Sebutkan dua perkara sam'iyyat", max: 2 },
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
