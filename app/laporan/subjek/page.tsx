import AppFrame from '../../ui/AppFrame';
import PrintButton from '../../ui/PrintButton';
import { getClasses, getSubjectSummaries } from '@/lib/data';
import { gradeForMark } from '@/lib/subjects';

export default async function LaporanSubjekPage() {
  const [classes, summaries] = await Promise.all([getClasses(), getSubjectSummaries()]);
  const classById = new Map(classes.map((item) => [item.id, item]));

  return (
    <AppFrame title="Laporan Subjek" active="reports">
      <section className="panel report-page">
        <div className="panel-head">
          <div>
            <h2>Laporan Prestasi Subjek</h2>
            <p className="table-note">Analisis mengikut subjek/kertas, kelas dan peperiksaan.</p>
          </div>
          <PrintButton />
        </div>
        {summaries.length === 0 ? (
          <p className="empty">Belum ada markah untuk laporan subjek.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tahun Akademik</th>
                <th>Peperiksaan</th>
                <th>Sekolah</th>
                <th>Kelas</th>
                <th>Subjek</th>
                <th>Bil Markah</th>
                <th>Purata</th>
                <th>Gred</th>
                <th>Bil Lulus</th>
                <th>Bil Gagal</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((item) => {
                const classRecord = classById.get(item.class_id);
                return (
                  <tr key={`${item.tahun_akademik}-${item.kod_peperiksaan}-${item.class_id}-${item.kod_subjek}`}>
                    <td>{item.tahun_akademik}</td>
                    <td>{item.kod_peperiksaan}</td>
                    <td>{item.kod_sekolah}</td>
                    <td>{classRecord ? `Tahun ${classRecord.tahun} - ${classRecord.nama_kelas}` : '-'}</td>
                    <td>{item.kod_subjek} - {item.nama_subjek}</td>
                    <td>{item.bil_markah}</td>
                    <td>{item.purata_subjek ?? '-'}</td>
                    <td>{gradeForMark(item.purata_subjek)}</td>
                    <td>{item.bil_lulus}</td>
                    <td>{item.bil_gagal}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </AppFrame>
  );
}

