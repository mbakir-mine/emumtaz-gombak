import type { ExamRecord } from './data';

export function malaysiaDateString(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function examAccessStatus(exam: Pick<ExamRecord, 'status' | 'buka_markah' | 'tutup_markah'> | null | undefined) {
  if (!exam) {
    return { open: false, label: 'Peperiksaan tidak ditemui.' };
  }

  if (exam.status !== 'DIBUKA') {
    return { open: false, label: 'Peperiksaan ditutup.' };
  }

  const today = malaysiaDateString();
  const openDate = exam.buka_markah ?? '';
  const closeDate = exam.tutup_markah ?? '';

  if (!openDate || !closeDate) {
    return { open: false, label: 'Tempoh key in markah belum ditetapkan.' };
  }

  if (today < openDate) {
    return { open: false, label: `Key in markah dibuka pada ${openDate}.` };
  }

  if (today > closeDate) {
    return { open: false, label: `Key in markah telah ditutup pada ${closeDate}.` };
  }

  return { open: true, label: `Akses dibuka: ${openDate} hingga ${closeDate}.` };
}
