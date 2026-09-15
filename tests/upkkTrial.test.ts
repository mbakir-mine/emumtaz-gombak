import { describe, expect, it } from 'vitest';
import { resolveSubjectFullMark } from '@/lib/markSettings';
import {
  DEFAULT_UPKK_GRADES,
  UPKK_WRITTEN_PAPER_MAX,
  UPKK_WRITTEN_TOTAL_MAX,
  upkkGrade,
  upkkPercentage,
} from '@/lib/upkkTrial';

describe('markah Percubaan UPKK', () => {
  it('uses 70 for every written paper and 420 for six papers', () => {
    expect(UPKK_WRITTEN_PAPER_MAX).toBe(70);
    expect(UPKK_WRITTEN_TOTAL_MAX).toBe(420);
  });

  it('converts raw marks out of 70 to percentage', () => {
    expect(upkkPercentage(70)).toBe(100);
    expect(upkkPercentage(60)).toBe(85.71);
    expect(upkkPercentage(45)).toBe(64.29);
    expect(upkkPercentage(300, UPKK_WRITTEN_TOTAL_MAX)).toBe(71.43);
  });

  it('assigns grades from the converted percentage', () => {
    expect(upkkGrade(upkkPercentage(60), DEFAULT_UPKK_GRADES)).toBe('A');
    expect(upkkGrade(upkkPercentage(46), DEFAULT_UPKK_GRADES)).toBe('B');
    expect(upkkGrade(upkkPercentage(32), DEFAULT_UPKK_GRADES)).toBe('C');
    expect(upkkGrade(upkkPercentage(31), DEFAULT_UPKK_GRADES)).toBe('D');
  });

  it('forces the UPKK Year 5 subject full mark to 70', () => {
    expect(resolveSubjectFullMark({
      kodSekolah: 'TEST001',
      tahunAkademik: 2026,
      kodPeperiksaan: 'UPKK1',
      tahun: 5,
      kodSubjek: 'TAUHID',
    }, [], [])).toBe(70);
  });
});
