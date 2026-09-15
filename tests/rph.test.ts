import { describe, expect, it } from 'vitest';
import { generateRphContent, isRphPedagogy, isRphStatus } from '@/lib/rph';

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
});
