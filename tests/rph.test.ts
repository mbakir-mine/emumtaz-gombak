import { describe, expect, it } from 'vitest';
import { buildAnnualRphPlan, generateRphContent, getRphWeekEnd, getRphWeekStart, isRphPedagogy, isRphStatus, reviewRphQuality } from '@/lib/rph';

describe('RPH pintar', () => {
  it('menghasilkan pelan pengajaran lengkap dengan agihan masa', () => {
    const draft = generateRphContent({
      tajuk: 'Solat Berjemaah',
      standard: 'Menjelaskan hikmah solat berjemaah',
      namaKelas: 'Tahun 5 - Kafa',
      namaSubjek: 'Akhlak',
      tempoh: 60,
      pedagogi: 'KOLABORATIF',
      tahapMurid: 'pelbagai tahap',
      emk: 'Nilai murni',
    });

    expect(draft.objektif).toContain('Solat Berjemaah');
    const minit = [...draft.aktiviti.matchAll(/(\d+) minit/g)].map((match) => Number(match[1]));
    expect(minit.reduce((total, value) => total + value, 0)).toBe(60);
    expect(draft.aktiviti).toContain('Pembezaan');
    expect(draft.pentaksiran).toContain('Evidens');
  });

  it('hanya menerima status aliran kerja yang sah', () => {
    expect(isRphStatus('SEDIA')).toBe(true);
    expect(isRphStatus('DIPADAM')).toBe(false);
    expect(isRphPedagogy('INKUIRI')).toBe(true);
    expect(isRphPedagogy('RAW')).toBe(false);
  });

  it('menyemak kualiti kandungan RPH sebelum guru menyimpan', () => {
    const input = {
      tajuk: 'Wuduk',
      standard: 'Menyatakan rukun dan sunat wuduk serta mengaplikasikan cara berwuduk dengan betul.',
      namaKelas: 'Tahun 1 - Kafa',
      namaSubjek: 'Fiqh',
      tempoh: 60,
      pedagogi: 'MASTERI' as const,
      tahapMurid: 'murid sederhana dan memerlukan bimbingan',
      emk: 'Nilai kebersihan dan amalan harian',
    };
    const draft = generateRphContent(input);
    const review = reviewRphQuality(input, draft);

    expect(review.score).toBe(100);
    expect(review.checks.hasStandard).toBe(true);
    expect(review.checks.hasMeasurableObjective).toBe(true);
    expect(review.checks.hasTimedActivities).toBe(true);
    expect(review.checks.hasAssessmentEvidence).toBe(true);
    expect(review.checks.hasDifferentiation).toBe(true);
  });

  it('menormalkan tarikh kepada minggu Isnin hingga Ahad', () => {
    expect(getRphWeekStart('2026-09-17')).toBe('2026-09-14');
    expect(getRphWeekEnd('2026-09-14')).toBe('2026-09-20');
    expect(getRphWeekStart('tidak-sah')).toBe('');
  });

  it('menjana cadangan tahunan mengikut bilangan masa dan takwim', () => {
    const plan = buildAnnualRphPlan({
      year: 2026,
      weeklySlots: 2,
      topics: [
        { id: '1', tajuk: 'Ibadah', standard_kandungan: 'Standard 1', standard_pembelajaran: '1.1 Menyatakan pengertian ibadah.', susunan: 1 },
        { id: '2', tajuk: 'Taharah', standard_kandungan: 'Standard 2', standard_pembelajaran: '2.1 Menyatakan pengertian taharah.', susunan: 2 },
        { id: '3', tajuk: 'Wuduk', standard_kandungan: 'Standard 3', standard_pembelajaran: '3.1 Menyebut niat wuduk.', susunan: 3 },
      ],
      events: [{ tajuk: 'Cuti Pertengahan Tahun', kategori: 'CUTI', tarikh_mula: '2026-01-05', tarikh_tamat: '2026-01-11' }],
    });

    const cutiWeek = plan.find((week) => week.weekStart === '2026-01-05');
    const firstTeachingWeek = plan.find((week) => week.isTeachingWeek);
    const secondTeachingWeek = plan.filter((week) => week.isTeachingWeek)[1];

    expect(cutiWeek?.isTeachingWeek).toBe(false);
    expect(firstTeachingWeek?.sessions.map((session) => session.tajuk)).toEqual(['Ibadah', 'Taharah']);
    expect(secondTeachingWeek?.sessions[0].tajuk).toBe('Wuduk');
  });
});
