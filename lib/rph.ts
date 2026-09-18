export type RphPedagogy = 'KOLABORATIF' | 'INKUIRI' | 'MASTERI' | 'PROJEK';

export type RphDraftInput = {
  tajuk: string;
  standard: string;
  namaKelas: string;
  namaSubjek: string;
  tempoh: number;
  pedagogi: RphPedagogy;
  tahapMurid: string;
  emk: string;
};

export type RphDraftContent = {
  objektif: string;
  aktiviti: string;
  bbm: string;
  pentaksiran: string;
  refleksi: string;
};

export type RphQualityReview = {
  score: number;
  checks: {
    hasStandard: boolean;
    hasMeasurableObjective: boolean;
    hasTimedActivities: boolean;
    hasAssessmentEvidence: boolean;
    hasDifferentiation: boolean;
  };
  notes: string[];
};

export type RphAnnualPlanTopic = {
  id: string;
  tajuk: string;
  standard_kandungan: string | null;
  standard_pembelajaran: string | null;
  susunan: number;
};

export type RphAnnualPlanEvent = {
  tajuk: string;
  kategori: string;
  tarikh_mula: string;
  tarikh_tamat: string;
};

export type RphAnnualPlanSession = {
  slot: number;
  tajuk: string;
  subTajuk: string | null;
  standard: string;
  nilaiMurni: string;
  kind: 'TOPIK' | 'PENGUKUHAN';
  phase: 'PENGAJARAN' | 'PENTAKSIRAN' | 'PENGUKUHAN';
};

export type RphAnnualPlanWeek = {
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  isTeachingWeek: boolean;
  takwimNotes: string[];
  sessions: RphAnnualPlanSession[];
};

const pedagogyActivities: Record<RphPedagogy, string> = {
  KOLABORATIF: 'Murid bekerja dalam kumpulan kecil, membahagi peranan dan membentangkan hasil perbincangan.',
  INKUIRI: 'Murid meneliti rangsangan, membina soalan dan mendapatkan jawapan melalui bimbingan serta penerokaan.',
  MASTERI: 'Murid mengikuti contoh berpandu, latihan berperingkat dan aktiviti pengukuhan mengikut tahap penguasaan.',
  PROJEK: 'Murid menghasilkan tugasan ringkas berasaskan situasi sebenar dan menerangkan keputusan yang dibuat.',
};

function clean(value: string, fallback: string) {
  return value.trim() || fallback;
}

function renumberDskpReferences(value: string) {
  let next = 1;
  return value.replace(/\b\d+(?:\.\d+)+(?=\s|[.)])/g, () => String(next++));
}

export function generateRphContent(input: RphDraftInput): RphDraftContent {
  const tajuk = clean(input.tajuk, 'topik pembelajaran');
  const subjek = clean(input.namaSubjek, 'mata pelajaran');
  const kelas = clean(input.namaKelas, 'kelas');
  const standard = clean(input.standard, `Pengetahuan dan kemahiran asas berkaitan ${tajuk}`);
  const displayStandard = renumberDskpReferences(standard);
  const tahapMurid = clean(input.tahapMurid, 'pelbagai tahap penguasaan');
  const emk = clean(input.emk, 'Nilai murni, komunikasi dan pembelajaran abad ke-21');
  const tempoh = Math.min(120, Math.max(20, Number(input.tempoh) || 60));
  const setInduksi = Math.max(5, Math.round(tempoh * 0.1));
  const penerokaan = Math.max(10, Math.round(tempoh * 0.3));
  const aktiviti = Math.max(10, tempoh - setInduksi - penerokaan - 5);
  const penutup = Math.max(5, tempoh - setInduksi - penerokaan - aktiviti);

  return {
    objektif: [
      `Pada akhir pembelajaran, murid dapat menyatakan sekurang-kurangnya dua idea utama tentang ${tajuk} dengan betul.`,
      `Murid ${kelas} dapat melaksanakan satu tugasan ${subjek} berdasarkan ${displayStandard} dengan bimbingan yang sesuai.`,
      `Murid dapat menerangkan hasil tugasan secara lisan atau bertulis serta menunjukkan kerjasama dan adab yang baik.`,
    ].join('\n'),
    aktiviti: [
      `${setInduksi} minit | Set induksi — Guru memaparkan rangsangan kontekstual dan menghubungkannya dengan pengalaman murid tentang ${tajuk}.`,
      `${penerokaan} minit | Penerokaan — Guru menerangkan dan memodelkan ${displayStandard}. Murid memberi respons melalui soal jawab berfokus.`,
      `${aktiviti} minit | Aktiviti utama — ${pedagogyActivities[input.pedagogi]} Pembezaan: murid ${tahapMurid} menerima sokongan, bahan atau cabaran yang bersesuaian.`,
      `${penutup} minit | Penutup — Murid melengkapkan tiket keluar; guru merumus isi utama, menyemak objektif dan memberi tindakan susulan.`,
      `Elemen merentas kurikulum: ${emk}.`,
    ].join('\n'),
    bbm: `Bahan rangsangan berkaitan ${tajuk}, buku teks, lembaran tugasan berbeza aras, papan putih dan bahan digital guru.`,
    pentaksiran: 'Soal jawab diagnostik, senarai semak pemerhatian, hasil tugasan dan tiket keluar. Evidens dinilai berdasarkan ketepatan, kefahaman dan penglibatan murid.',
    refleksi: '___ / ___ murid mencapai objektif. ___ murid memerlukan pengukuhan. Tindakan susulan: pemulihan berfokus / latihan pengayaan pada sesi berikutnya.',
  };
}

export function reviewRphQuality(input: RphDraftInput, content: RphDraftContent): RphQualityReview {
  const joined = `${content.objektif}\n${content.aktiviti}\n${content.pentaksiran}\n${content.refleksi}`.toLowerCase();
  const checks = {
    hasStandard: input.standard.trim().length >= 20,
    hasMeasurableObjective: /\b(menyatakan|menerangkan|menjelaskan|membaca|menulis|menghafaz|mengaplikasikan|melaksanakan|membedakan|merumus)\b/i.test(content.objektif),
    hasTimedActivities: /\b\d+\s*minit\b/i.test(content.aktiviti),
    hasAssessmentEvidence: /\b(evidens|pemerhatian|senarai semak|hasil|tiket keluar|soal jawab|lembaran)\b/i.test(content.pentaksiran),
    hasDifferentiation: /\b(pemulihan|pengayaan|pembezaan|bimbingan|cabaran)\b/i.test(joined),
  };
  const notes: string[] = [];
  if (!checks.hasStandard) notes.push('Standard DSKP perlu jelas sebelum RPH dihantar.');
  if (!checks.hasMeasurableObjective) notes.push('Objektif perlu menggunakan kata kerja yang boleh diukur.');
  if (!checks.hasTimedActivities) notes.push('Aktiviti perlu mempunyai agihan masa.');
  if (!checks.hasAssessmentEvidence) notes.push('Pentaksiran perlu menyebut evidens atau instrumen.');
  if (!checks.hasDifferentiation) notes.push('Tambah pemulihan, pengayaan atau pembezaan murid.');

  const passed = Object.values(checks).filter(Boolean).length;
  return {
    score: Math.round((passed / Object.keys(checks).length) * 100),
    checks,
    notes,
  };
}

function toIsoDate(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function overlaps(startA: string, endA: string, startB: string, endB: string) {
  return startA <= endB && startB <= endA;
}

function isBlockingTakwimEvent(event: RphAnnualPlanEvent) {
  const haystack = `${event.kategori} ${event.tajuk}`.toLowerCase();
  return /\b(cuti|peperiksaan|ujian|pentaksiran|psra|upkk|ramadan|ramadhan|raya|libur)\b/i.test(haystack);
}

const nobleValues = [
  'kebersihan',
  'disiplin',
  'tanggungjawab',
  'hormat',
  'kerjasama',
  'amanah',
  'sabar',
  'syukur',
  'kasih sayang',
  'istiqamah',
];

function valueForTopic(topicTitle: string, standardText: string, index: number) {
  const haystack = `${topicTitle} ${standardText}`.toLowerCase();
  if (/\b(kebersihan|taharah|wuduk|mandi|istinja|bersugi|kuku|rambut|aurat)\b/i.test(haystack)) return 'kebersihan dan menjaga maruah diri';
  if (/\b(doa|berdoa|syukur|ibadah)\b/i.test(haystack)) return 'syukur dan bergantung kepada Allah';
  if (/\b(ibu bapa|guru|rakan|pergaulan|jiran|ziarah)\b/i.test(haystack)) return 'hormat, kasih sayang dan adab bergaul';
  if (/\b(benar|janji|amanah|tanggungjawab)\b/i.test(haystack)) return 'amanah dan bertanggungjawab';
  return nobleValues[index % nobleValues.length];
}

function summarizeSubTopic(standard: string) {
  const withoutNumber = standard.replace(/^\s*\d+(?:\.\d+)+\s*/, '').trim();
  const beforeColon = withoutNumber.split(':')[0]?.trim();
  const phrase = beforeColon || withoutNumber;
  return phrase.length > 72 ? `${phrase.slice(0, 69).trim()}…` : phrase;
}

function splitLearningStandards(standard: string | null) {
  const text = (standard ?? '').trim();
  if (!text) return [];
  const matches = [...text.matchAll(/(?:^|\n)\s*(\d+(?:\.\d+)+)\s+([\s\S]*?)(?=\n\s*\d+(?:\.\d+)+\s+|$)/g)];
  if (matches.length > 0) {
    return matches.map((match) => `${match[1]} ${match[2].trim()}`.replace(/\s+/g, ' '));
  }
  return text.split('\n').map((line) => line.trim()).filter(Boolean);
}

function chunkLearningStandards(standards: string[], size = 2) {
  const chunks: string[][] = [];
  for (let index = 0; index < standards.length; index += size) {
    chunks.push(standards.slice(index, index + size));
  }
  return chunks;
}

function buildTopicUnits(topics: RphAnnualPlanTopic[]) {
  return topics.flatMap((topic, topicIndex) => {
    const standards = splitLearningStandards(topic.standard_pembelajaran);
    const chunks = standards.length > 0 ? chunkLearningStandards(standards, 2) : [[]];
    return chunks.map((chunk, chunkIndex) => {
      const standardText = chunk.join('\n');
      const subTajuk = chunk.length > 0 ? chunk.map(summarizeSubTopic).join(' + ') : null;
      return {
        topic,
        tajuk: subTajuk ? `${topic.tajuk} — ${subTajuk}` : topic.tajuk,
        subTajuk,
        standard: [topic.standard_kandungan, standardText, `Nilai murni: ${valueForTopic(topic.tajuk, standardText, topicIndex + chunkIndex)}`].filter(Boolean).join('\n\n'),
        nilaiMurni: valueForTopic(topic.tajuk, standardText, topicIndex + chunkIndex),
      };
    });
  });
}

export function buildAnnualRphPlan({
  year,
  yearLevel,
  topics,
  weeklySlots,
  events,
}: {
  year: number;
  yearLevel?: number;
  topics: RphAnnualPlanTopic[];
  weeklySlots: number;
  events: RphAnnualPlanEvent[];
}): RphAnnualPlanWeek[] {
  const slots = Math.max(1, Math.min(12, Math.round(Number(weeklySlots) || 1)));
  const sortedTopics = [...topics].sort((a, b) => a.susunan - b.susunan || a.tajuk.localeCompare(b.tajuk, 'ms'));
  const topicUnits = buildTopicUnits(sortedTopics).flatMap((unit) => [
    { ...unit, phase: 'PENGAJARAN' as const, tajuk: `${unit.tajuk} — Pengajaran dan pembelajaran` },
    { ...unit, phase: 'PENTAKSIRAN' as const, tajuk: `${unit.tajuk} — Ujian/pentaksiran formatif` },
    { ...unit, phase: 'PENGUKUHAN' as const, tajuk: `${unit.tajuk} — Pengukuhan, pemulihan dan pengayaan` },
  ]);
  const firstMonday = getRphWeekStart(`${year}-01-04`);
  const plan: RphAnnualPlanWeek[] = [];
  let unitIndex = 0;
  let cursor = firstMonday;
  let weekNumber = 1;

  while (cursor.slice(0, 4) <= String(year)) {
    const weekStart = cursor;
    const weekEnd = addDays(weekStart, 6);
    if (weekStart.slice(0, 4) > String(year)) break;

    const weekEvents = events.filter((event) => overlaps(weekStart, weekEnd, event.tarikh_mula, event.tarikh_tamat));
    const isTeachingWeek = !weekEvents.some(isBlockingTakwimEvent);
    const sessions: RphAnnualPlanSession[] = [];

    const beforeYear6Deadline = yearLevel !== 6 || Number(weekStart.slice(5, 7)) <= 6;
    if (isTeachingWeek && beforeYear6Deadline) {
      for (let slot = 1; slot <= slots; slot += 1) {
        const unit = topicUnits[unitIndex];
        if (unit) {
          sessions.push({
            slot,
            tajuk: unit.tajuk,
            subTajuk: unit.subTajuk,
            standard: unit.standard,
            nilaiMurni: unit.nilaiMurni,
            kind: 'TOPIK',
            phase: unit.phase,
          });
          unitIndex += 1;
        } else {
          sessions.push({
            slot,
            tajuk: 'Pengukuhan, pentaksiran formatif dan pemulihan/pengayaan',
            subTajuk: null,
            standard: 'Mengukuhkan standard pembelajaran terdahulu berdasarkan tahap penguasaan murid.',
            nilaiMurni: 'istiqamah dan usaha berterusan',
            kind: 'PENGUKUHAN',
            phase: 'PENGUKUHAN',
          });
        }
      }
    } else if (isTeachingWeek && yearLevel === 6) {
      for (let slot = 1; slot <= slots; slot += 1) {
        sessions.push({
          slot,
          tajuk: 'Ulang kaji, pengukuhan dan persediaan peperiksaan Tahun 6',
          subTajuk: null,
          standard: 'Mengukuhkan semua standard pembelajaran yang telah selesai sebelum Jun melalui ulang kaji, pentaksiran dan bimbingan berfokus.',
          nilaiMurni: 'istiqamah, disiplin dan usaha berterusan',
          kind: 'PENGUKUHAN',
          phase: 'PENGUKUHAN',
        });
      }
    }

    plan.push({
      weekNumber,
      weekStart,
      weekEnd,
      isTeachingWeek,
      takwimNotes: weekEvents.map((event) => `${event.tajuk} (${event.kategori})`),
      sessions,
    });
    cursor = addDays(cursor, 7);
    weekNumber += 1;
  }

  return plan;
}

export function isRphStatus(value: string): value is 'DRAF' | 'SEDIA' | 'SELESAI' {
  return ['DRAF', 'SEDIA', 'SELESAI'].includes(value);
}

export function isRphPedagogy(value: string): value is RphPedagogy {
  return ['KOLABORATIF', 'INKUIRI', 'MASTERI', 'PROJEK'].includes(value);
}

export function getRphWeekStart(value: string | Date = new Date()) {
  const date = typeof value === 'string' ? new Date(`${value}T12:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function getRphWeekEnd(weekStart: string) {
  const date = new Date(`${weekStart}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + 6);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}
