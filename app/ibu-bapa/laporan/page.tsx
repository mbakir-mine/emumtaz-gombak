import Link from 'next/link';
import PrintButton from '../../ui/PrintButton';
import ReportSignatureBlock from '../../ui/ReportSignatureBlock';
import { getParentReportSession } from '@/lib/parentAccess';
import { cleanMykid } from '@/lib/mykid';
import { gradeForMark } from '@/lib/subjects';
import { logoutParent } from '../actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function IbuBapaLaporanPage() {
  const parentSession = await getParentReportSession();
  const summaries = parentSession?.summaries ?? [];
  const student = parentSession?.student;

  return (
    <main className="parent-page">
      <section className="parent-card report-page">
        <div className="parent-head">
          <div className="login-brand">
            <div className="brand-mark">eM</div>
            <div>
              <strong>e-Mumtaz</strong>
              <span>Laporan Individu Murid</span>
            </div>
          </div>
          <div className="row-actions no-print">
            <PrintButton />
            <form action={logoutParent}><button className="button secondary" type="submit">Log Keluar</button></form>
          </div>
        </div>

        {!parentSession || !student ? (
          <div className="empty-state">
            <strong>Sesi tidak sah atau telah tamat.</strong>
            <span>Log masuk semula menggunakan MyKid, sekolah dan kod akses yang dibekalkan pihak sekolah.</span>
            <Link className="button secondary" href="/ibu-bapa">Ke Halaman Akses</Link>
          </div>
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
                <strong>{cleanMykid(student.mykid)}</strong>
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

            <ReportSignatureBlock />
          </>
        )}
      </section>
    </main>
  );
}
