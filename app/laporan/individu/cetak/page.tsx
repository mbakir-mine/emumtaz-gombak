import Link from 'next/link';
import AppFrame from '../../../ui/AppFrame';
import PrintButton from '../../../ui/PrintButton';
import { getClasses, getMarkDetails, getSchools, getStudentSummaries } from '@/lib/data';
import { gradeForMark } from '@/lib/subjects';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CetakLaporanIndividuPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const studentId = params.student_id ?? '';
  const tahunAkademik = Number(params.tahun_akademik ?? 0);
  const kodPeperiksaan = params.kod_peperiksaan ?? '';
  const [schools, classes, summaries, marks] = await Promise.all([
    getSchools(),
    getClasses(),
    getStudentSummaries(),
    getMarkDetails(),
  ]);
  const summary = summaries.find(
    (item) =>
      item.student_id === studentId &&
      item.tahun_akademik === tahunAkademik &&
      item.kod_peperiksaan === kodPeperiksaan,
  );
  const school = summary ? schools.find((item) => item.kod_sekolah === summary.kod_sekolah) : null;
  const classRecord = summary ? classes.find((item) => item.id === summary.class_id) : null;
  const studentMarks = marks
    .filter(
      (mark) =>
        mark.student_id === studentId &&
        mark.exams?.tahun_akademik === tahunAkademik &&
        mark.exams?.kod_peperiksaan === kodPeperiksaan,
    )
    .sort((a, b) => (a.subjects?.susunan ?? 999) - (b.subjects?.susunan ?? 999));

  return (
    <AppFrame title="Cetak Laporan Individu" subtitle="Slip prestasi murid." active="reports">
      <section className="panel report-page individual-print-page">
        <div className="panel-head no-print">
          <div>
            <h2>Laporan Individu Murid</h2>
            <p className="table-note">Semak slip, kemudian cetak atau simpan sebagai PDF.</p>
          </div>
          <div className="row-actions">
            <PrintButton label="CETAK" />
            <PrintButton label="CETAK PDF" />
            <Link className="button secondary" href="/laporan/individu">
              Kembali
            </Link>
          </div>
        </div>

        {!summary ? (
          <p className="empty">Rekod laporan individu tidak ditemui.</p>
        ) : (
          <>
            <div className="print-report-title">
              <h2>e-Mumtaz Gombak</h2>
              <p>Laporan Individu Murid</p>
            </div>

            <div className="student-report-head">
              <div>
                <span>Nama Murid</span>
                <strong>{summary.nama_murid}</strong>
              </div>
              <div>
                <span>MyKid</span>
                <strong>{summary.mykid}</strong>
              </div>
              <div>
                <span>Sekolah</span>
                <strong>{school ? `${school.kod_sekolah} - ${school.nama_sekolah}` : summary.kod_sekolah}</strong>
              </div>
              <div>
                <span>Kelas</span>
                <strong>
                  {classRecord ? `Tahun ${classRecord.tahun} - ${classRecord.nama_kelas}` : 'Tiada kelas'}
                </strong>
              </div>
              <div>
                <span>Peperiksaan</span>
                <strong>
                  {summary.kod_peperiksaan} {summary.tahun_akademik}
                </strong>
              </div>
              <div>
                <span>Purata / Gred</span>
                <strong>
                  {summary.purata ?? '-'} - {gradeForMark(summary.purata)}
                </strong>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Subjek</th>
                  <th>Markah</th>
                  <th>Gred</th>
                </tr>
              </thead>
              <tbody>
                {studentMarks.length === 0 ? (
                  <tr>
                    <td colSpan={3}>Tiada markah subjek ditemui.</td>
                  </tr>
                ) : (
                  studentMarks.map((mark) => (
                    <tr key={mark.id}>
                      <td>{mark.subjects ? `${mark.kod_subjek} - ${mark.subjects.nama_subjek}` : mark.kod_subjek}</td>
                      <td>{mark.markah ?? '-'}</td>
                      <td>{gradeForMark(mark.markah)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="student-report-summary">
              <div>
                <span>Bil Subjek Dikira</span>
                <strong>{summary.bil_subjek_dikira}</strong>
              </div>
              <div>
                <span>Jumlah Markah</span>
                <strong>{summary.jumlah_markah ?? '-'}</strong>
              </div>
              <div>
                <span>Purata</span>
                <strong>{summary.purata ?? '-'}</strong>
              </div>
              <div>
                <span>Gred</span>
                <strong>{gradeForMark(summary.purata)}</strong>
              </div>
            </div>
          </>
        )}
      </section>
    </AppFrame>
  );
}
