import AppFrame from '../../ui/AppFrame';
import PrintButton from '../../ui/PrintButton';
import { getClasses, getStudentSummaries } from '@/lib/data';
import { buildClassSummaries } from '@/lib/reporting';
import { gradeForMark } from '@/lib/subjects';

export default async function LaporanKelasPage() {
  const [classes, studentSummaries] = await Promise.all([getClasses(), getStudentSummaries()]);
  const summaries = buildClassSummaries(studentSummaries, classes);

  return (
    <AppFrame title="Laporan Kelas" active="reports">
      <section className="panel report-page">
        <div className="panel-head">
          <div>
            <h2>Laporan Prestasi Kelas</h2>
            <p className="table-note">Ringkasan ini dibina daripada purata murid dalam setiap kelas.</p>
          </div>
          <PrintButton />
        </div>
        {summaries.length === 0 ? (
          <p className="empty">Belum ada markah untuk laporan kelas.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tahun Akademik</th>
                <th>Peperiksaan</th>
                <th>Sekolah</th>
                <th>Tahun</th>
                <th>Kelas</th>
                <th>Murid</th>
                <th>Purata</th>
                <th>Gred</th>
                <th>Bil Mumtaz</th>
                <th>Bil Lulus</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((item) => (
                <tr key={`${item.tahun_akademik}-${item.kod_peperiksaan}-${item.class_id}`}>
                  <td>{item.tahun_akademik}</td>
                  <td>{item.kod_peperiksaan}</td>
                  <td>{item.kod_sekolah}</td>
                  <td>Tahun {item.tahun}</td>
                  <td>{item.nama_kelas}</td>
                  <td>{item.jumlah_murid}</td>
                  <td>{item.purata_kelas ?? '-'}</td>
                  <td>{gradeForMark(item.purata_kelas)}</td>
                  <td>{item.bil_mumtaz}</td>
                  <td>{item.bil_lulus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AppFrame>
  );
}

