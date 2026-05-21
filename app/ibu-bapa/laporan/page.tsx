import Link from 'next/link';
import PrintButton from '../../ui/PrintButton';
import { getStudentSummariesByMykid } from '@/lib/data';
import { gradeForMark } from '@/lib/subjects';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function IbuBapaLaporanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const mykid = String(params.mykid ?? '').replace(/\D/g, '');
  const kodSekolah = String(params.kod_sekolah ?? '').trim().toUpperCase();
  const summaries = mykid && kodSekolah ? await getStudentSummariesByMykid(mykid, kodSekolah) : [];
  const student = summaries[0];

  return (
    <main className="parent-page">
      <section className="parent-card report-page">
        <div className="parent-head">
          <div className="login-brand">
            <div className="brand-mark">eM</div>
            <div>
              <strong>e-Mumtaz Gombak</strong>
              <span>Laporan Individu Murid</span>
            </div>
          </div>
          <div className="row-actions no-print">
            <PrintButton />
            <Link className="button secondary" href="/ibu-bapa">
              Semak Murid Lain
            </Link>
          </div>
        </div>

        {!mykid || !kodSekolah ? (
          <p className="empty">Sila masukkan MyKid dan kod sekolah murid dahulu.</p>
        ) : summaries.length === 0 ? (
          <div className="empty-state">
            <strong>Tiada laporan ditemui.</strong>
            <span>Semak nombor MyKid, kod sekolah atau hubungi pihak sekolah.</span>
          </div>
        ) : (
          <>
            <div className="student-report-head">
              <div>
                <span>Nama Murid</span>
                <strong>{student.nama_murid}</strong>
              </div>
              <div>
                <span>MyKid</span>
                <strong>{student.mykid}</strong>
              </div>
              <div>
                <span>Sekolah</span>
                <strong>{student.kod_sekolah}</strong>
              </div>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Tahun</th>
                    <th>Peperiksaan</th>
                    <th>Bil Subjek</th>
                    <th>Jumlah</th>
                    <th>Purata</th>
                    <th>Gred</th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((item) => (
                    <tr key={`${item.tahun_akademik}-${item.kod_peperiksaan}-${item.student_id}`}>
                      <td>{item.tahun_akademik}</td>
                      <td>{item.kod_peperiksaan}</td>
                      <td>{item.bil_subjek_dikira}</td>
                      <td>{item.jumlah_markah ?? '-'}</td>
                      <td>{item.purata ?? '-'}</td>
                      <td>{gradeForMark(item.purata)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
