import { describe, expect, it } from 'vitest';
import { generateRphContent, getRphWeekEnd, getRphWeekStart, isRphPedagogy, isRphStatus, reviewRphQuality } from '@/lib/rph';

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
});
