import AppFrame from '../../ui/AppFrame';
import PrintButton from '../../ui/PrintButton';
import { getStudentSummaries } from '@/lib/data';
import { gradeForMark } from '@/lib/subjects';

export default async function LaporanIndividuPage() {
  const summaries = await getStudentSummaries();

  return (
    <AppFrame title="Laporan Individu" active="reports">
      <section className="panel report-page">
        <div className="panel-head">
          <div>
            <h2>Laporan Ringkas Individu</h2>
            <p className="table-note">Memaparkan purata murid berdasarkan subjek yang dikira sahaja.</p>
          </div>
          <PrintButton />
        </div>
        {summaries.length === 0 ? (
          <p className="empty">Belum ada markah untuk laporan individu.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tahun Akademik</th>
                <th>Peperiksaan</th>
                <th>Sekolah</th>
                <th>MyKid</th>
                <th>Nama Murid</th>
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
                  <td>{item.kod_sekolah}</td>
                  <td>{item.mykid}</td>
                  <td>{item.nama_murid}</td>
                  <td>{item.bil_subjek_dikira}</td>
                  <td>{item.jumlah_markah ?? '-'}</td>
                  <td>{item.purata ?? '-'}</td>
                  <td>{gradeForMark(item.purata)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AppFrame>
  );
}

