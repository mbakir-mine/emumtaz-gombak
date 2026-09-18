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

const pedagogyActivities: Record<RphPedagogy, string> = {
  KOLABORATIF: 'Murid bekerja dalam kumpulan kecil, membahagi peranan dan membentangkan hasil perbincangan.',
  INKUIRI: 'Murid meneliti rangsangan, membina soalan dan mendapatkan jawapan melalui bimbingan serta penerokaan.',
  MASTERI: 'Murid mengikuti contoh berpandu, latihan berperingkat dan aktiviti pengukuhan mengikut tahap penguasaan.',
  PROJEK: 'Murid menghasilkan tugasan ringkas berasaskan situasi sebenar dan menerangkan keputusan yang dibuat.',
};

function clean(value: string, fallback: string) {
  return value.trim() || fallback;
}

export function generateRphContent(input: RphDraftInput): RphDraftContent {
  const tajuk = clean(input.tajuk, 'topik pembelajaran');
  const subjek = clean(input.namaSubjek, 'mata pelajaran');
  const kelas = clean(input.namaKelas, 'kelas');
  const standard = clean(input.standard, `Pengetahuan dan kemahiran asas berkaitan ${tajuk}`);
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
      `Murid ${kelas} dapat melaksanakan satu tugasan ${subjek} berdasarkan ${standard} dengan bimbingan yang sesuai.`,
      `Murid dapat menerangkan hasil tugasan secara lisan atau bertulis serta menunjukkan kerjasama dan adab yang baik.`,
    ].join('\n'),
    aktiviti: [
      `${setInduksi} minit | Set induksi — Guru memaparkan rangsangan kontekstual dan menghubungkannya dengan pengalaman murid tentang ${tajuk}.`,
      `${penerokaan} minit | Penerokaan — Guru menerangkan dan memodelkan ${standard}. Murid memberi respons melalui soal jawab berfokus.`,
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
