import AppFrame from '../ui/AppFrame';
import { getSchools } from '@/lib/data';

function zoneLabel(zon: string | null) {
  if (!zon) return 'Belum ditetapkan';
  return `Zon ${zon.charAt(0) + zon.slice(1).toLowerCase()}`;
}

export default async function SekolahPage() {
  const schools = await getSchools();
  const assignedZones = schools.filter((school) => school.zon).length;

  return (
    <AppFrame title="Senarai Sekolah" active="schools">
      <section className="panel">
        <div className="panel-head">
          <h2>Sekolah</h2>
          <span>
            {schools.length} rekod · {assignedZones} berzon
          </span>
        </div>
        {schools.length === 0 ? (
          <p className="empty">Tiada data sekolah dipaparkan. Semak .env.local atau import schools.</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Kod</th>
                  <th>Nama Sekolah</th>
                  <th>Kategori</th>
                  <th>Daerah</th>
                  <th>Zon</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {schools.map((school) => (
                  <tr key={school.kod_sekolah}>
                    <td data-label="Kod">{school.kod_sekolah}</td>
                    <td data-label="Sekolah">{school.nama_sekolah}</td>
                    <td data-label="Kategori">{school.kategori}</td>
                    <td data-label="Daerah">{school.daerah}</td>
                    <td data-label="Zon">
                      <span className={school.zon ? 'status-badge status-aktif' : 'status-badge status-menunggu'}>
                        {zoneLabel(school.zon)}
                      </span>
                    </td>
                    <td data-label="Status">{school.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppFrame>
  );
}
