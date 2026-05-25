import AppFrame from '../ui/AppFrame';
import { getSchoolSummaries, getSchools, getStudentSummaries } from '@/lib/data';
import { gradeForMark } from '@/lib/subjects';

export default async function AnalisisPage() {
  const [schools, schoolSummaries, studentSummaries] = await Promise.all([
    getSchools(),
    getSchoolSummaries(),
    getStudentSummaries(),
  ]);
  const schoolName = new Map(schools.map((school) => [school.kod_sekolah, school.nama_sekolah]));
  const totalStudentsWithMarks = new Set(studentSummaries.map((item) => item.student_id)).size;
  const latest = schoolSummaries[0];

  return (
    <AppFrame title="Analisis Prestasi" active="analysis">
      <div className="metric-grid">
        <div className="metric">
          <span>Sekolah Ada Markah</span>
          <strong>{new Set(schoolSummaries.map((item) => item.kod_sekolah)).size}</strong>
          <small>Berdasarkan rekod markah</small>
        </div>
        <div className="metric">
          <span>Murid Ada Markah</span>
          <strong>{totalStudentsWithMarks}</strong>
          <small>Unik dalam ringkasan</small>
        </div>
        <div className="metric">
          <span>Purata Tertinggi</span>
          <strong>{latest?.purata_sekolah ?? '-'}</strong>
          <small>{latest ? schoolName.get(latest.kod_sekolah) : 'Belum ada data'}</small>
        </div>
        <div className="metric">
          <span>Gred Purata</span>
          <strong>{gradeForMark(latest?.purata_sekolah)}</strong>
          <small>Skala rasmi e-Mumtaz</small>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Analisis Sekolah</h2>
          <span>{schoolSummaries.length} rekod</span>
        </div>
        {schoolSummaries.length === 0 ? (
          <p className="empty">Belum ada markah untuk dianalisis.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Bil</th>
                <th>Tahun</th>
                <th>Peperiksaan</th>
                <th>Sekolah</th>
                <th>Jumlah Murid</th>
                <th>Purata</th>
                <th>Gred</th>
                <th>% Mumtaz</th>
                <th>% Lulus</th>
              </tr>
            </thead>
            <tbody>
              {schoolSummaries.map((item, index) => (
                <tr key={`${item.tahun_akademik}-${item.kod_peperiksaan}-${item.kod_sekolah}`}>
                  <td>{index + 1}</td>
                  <td>{item.tahun_akademik}</td>
                  <td>{item.kod_peperiksaan}</td>
                  <td>{item.kod_sekolah} - {schoolName.get(item.kod_sekolah)}</td>
                  <td>{item.jumlah_murid}</td>
                  <td>{item.purata_sekolah ?? '-'}</td>
                  <td>{gradeForMark(item.purata_sekolah)}</td>
                  <td>{item.peratus_mumtaz ?? 0}%</td>
                  <td>{item.peratus_lulus ?? 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AppFrame>
  );
}
