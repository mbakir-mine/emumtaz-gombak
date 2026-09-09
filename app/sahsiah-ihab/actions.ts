'use server';

import { revalidatePath } from 'next/cache';
import { calculateSahsiahIhab, parseSahsiahIhabInput } from '@/lib/sahsiahIhab';
import { supabase } from '@/lib/supabase';

export type SahsiahIhabActionState = { ok: boolean; message: string };

const text = (formData: FormData, key: string) => String(formData.get(key) ?? '').trim();

export async function saveSahsiahIhabAssessment(
  _previousState: SahsiahIhabActionState,
  formData: FormData,
): Promise<SahsiahIhabActionState> {
  if (!supabase) return { ok: false, message: 'Supabase belum disambungkan.' };
  const kodSekolah = text(formData, 'kod_sekolah');
  const classId = text(formData, 'class_id');
  const studentId = text(formData, 'student_id');
  const tahunAkademik = Number(formData.get('tahun_akademik') ?? new Date().getFullYear());
  const bulan = Number(formData.get('bulan') ?? new Date().getMonth() + 1);

  if (!kodSekolah || !classId || !studentId || !Number.isInteger(tahunAkademik) || !Number.isInteger(bulan) || bulan < 1 || bulan > 12) {
    return { ok: false, message: 'Sekolah, kelas, murid, tahun dan bulan diperlukan.' };
  }

  let input;
  try {
    input = parseSahsiahIhabInput({
      m3Raw: formData.get('m3_raw'),
      m4: formData.get('m4'),
      m5: formData.get('m5'),
      m6: formData.get('m6'),
    });
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Markah M1-M6 tidak sah.' };
  }

  const { data: access, error: accessError } = await supabase
    .from('school_module_access')
    .select('id')
    .eq('kod_sekolah', kodSekolah)
    .eq('module_key', 'KHALIFAH_MUDA')
    .eq('enabled', true)
    .maybeSingle();
  if (accessError || !access) return { ok: false, message: 'Modul Sahsiah IHAB belum diaktifkan untuk sekolah ini.' };

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id,kod_sekolah,class_id,tahun,status')
    .eq('id', studentId)
    .maybeSingle();
  if (studentError || !student || student.kod_sekolah !== kodSekolah || student.class_id !== classId || student.status !== 'AKTIF') {
    return { ok: false, message: 'Murid tidak berada dalam kelas aktif sekolah yang dipilih.' };
  }

  const result = calculateSahsiahIhab(input);
  const { error } = await supabase.from('sahsiah_ihab_assessments').upsert(
    {
      kod_sekolah: kodSekolah,
      tahun_akademik: tahunAkademik,
      bulan,
      class_id: classId,
      student_id: studentId,
      m1_confirmed: formData.get('m1_confirmed') === 'on',
      m2_confirmed: formData.get('m2_confirmed') === 'on',
      m3_raw: input.m3Raw,
      m3_percent: result.m3Percent,
      m4: input.m4,
      m5: input.m5,
      m6: input.m6,
      total_score: result.totalScore,
      grade: result.grade,
      band: result.band,
      status: 'DRAF',
      catatan: text(formData, 'catatan') || null,
    },
    { onConflict: 'kod_sekolah,tahun_akademik,bulan,student_id' },
  );
  if (error) return { ok: false, message: `Gagal menyimpan pentaksiran: ${error.message}` };
  revalidatePath('/sahsiah-ihab');
  revalidatePath('/khalifah-muda');
  return { ok: true, message: `Pentaksiran disimpan: ${result.grade} (Band ${result.band}), skor ${result.totalScore}.` };
}
