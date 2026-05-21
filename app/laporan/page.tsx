import AppFrame from '../ui/AppFrame';
import { getSchoolSummaries, getStudentSummaries } from '@/lib/data';
import { gradeForMark } from '@/lib/subjects';

const reports = [
  ['Laporan Individu', 'Slip prestasi murid, purata, gred dan perbandingan UPSA/UASA.', '/laporan/individu'],
  ['Laporan Kelas', 'Ranking murid, purata kelas, taburan gred dan subjek lemah.', '/laporan/kelas'],
  ['Laporan Sekolah', 'Prestasi keseluruhan sekolah, peratus lulus dan bilangan cemerlang.', '/laporan/sekolah'],
  ['Laporan Subjek', 'Analisis setiap subjek mengikut kelas, sekolah dan daerah.', '/laporan/subjek'],
  ['UPSA vs UASA', 'Perbandingan peperiksaan tahun semasa.', '/perbandingan'],
  ['Perbandingan Tahunan', 'Trend prestasi merentas tahun untuk pemantauan jangka panjang.', '/perbandingan'],
];

export default async function LaporanPage() {
  const [schoolSummaries, studentSummaries] = await Promise.all([
    getSchoolSummaries(),
    getStudentSummaries(),
  ]);
  const topStudents = studentSummaries.slice(0, 20);

  return (
    <AppFrame title="Laporan" subtitle="Analisis murid, kelas, sekolah dan daerah." active="reports">
      <div className="card-grid">
        {reports.map(([title, description, href]) => (
          <div className="card" key={title}>
            <h2>{title}</h2>
            <p>{description}</p>
            <a className="button secondary" href={href}>
              Buka Laporan
            </a>
          </div>
        ))}
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Ringkasan Sekolah</h2>
          <span>{schoolSummaries.length} rekod</span>
        </div>
        {schoolSummaries.length === 0 ? (
          <p className="empty">Belum ada markah untuk laporan sekolah.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tahun</th>
                <th>Peperiksaan</th>
                <th>Sekolah</th>
                <th>Murid</th>
                <th>Purata</th>
                <th>Gred</th>
                <th>% Lulus</th>
              </tr>
            </thead>
            <tbody>
              {schoolSummaries.map((item) => (
                <tr key={`${item.tahun_akademik}-${item.kod_peperiksaan}-${item.kod_sekolah}`}>
                  <td>{item.tahun_akademik}</td>
                  <td>{item.kod_peperiksaan}</td>
                  <td>{item.kod_sekolah}</td>
                  <td>{item.jumlah_murid}</td>
                  <td>{item.purata_sekolah ?? '-'}</td>
                  <td>{gradeForMark(item.purata_sekolah)}</td>
                  <td>{item.peratus_lulus ?? 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Laporan Individu Ringkas</h2>
          <span>{studentSummaries.length} rekod</span>
        </div>
        {topStudents.length === 0 ? (
          <p className="empty">Belum ada markah untuk laporan individu.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Peperiksaan</th>
                <th>Sekolah</th>
                <th>Nama Murid</th>
                <th>Bil Subjek</th>
                <th>Purata</th>
                <th>Gred</th>
              </tr>
            </thead>
            <tbody>
              {topStudents.map((item) => (
                <tr key={`${item.kod_peperiksaan}-${item.student_id}`}>
                  <td>{item.kod_peperiksaan}</td>
                  <td>{item.kod_sekolah}</td>
                  <td>{item.nama_murid}</td>
                  <td>{item.bil_subjek_dikira}</td>
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
