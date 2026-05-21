import AppFrame from '../ui/AppFrame';
import { getSchools } from '@/lib/data';

export default async function SekolahPage() {
  const schools = await getSchools();

  return (
    <AppFrame title="Senarai Sekolah" active="schools">
      <section className="panel">
        <div className="panel-head">
          <h2>Schools</h2>
          <span>{schools.length} rekod</span>
        </div>
        {schools.length === 0 ? (
          <p className="empty">Tiada data sekolah dipaparkan. Semak .env.local atau import schools.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Kod</th>
                <th>Nama Sekolah</th>
                <th>Kategori</th>
                <th>Daerah</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((school) => (
                <tr key={school.kod_sekolah}>
                  <td>{school.kod_sekolah}</td>
                  <td>{school.nama_sekolah}</td>
                  <td>{school.kategori}</td>
                  <td>{school.daerah}</td>
                  <td>{school.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AppFrame>
  );
}

