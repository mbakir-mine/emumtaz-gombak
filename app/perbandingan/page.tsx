import AppFrame from '../ui/AppFrame';
import { getStudentSummaries } from '@/lib/data';

type Pair = {
  key: string;
  nama_murid: string;
  kod_sekolah: string;
  upsa?: number | null;
  uasa?: number | null;
};

export default async function PerbandinganPage() {
  const summaries = await getStudentSummaries();
  const pairs = new Map<string, Pair>();

  for (const item of summaries) {
    const key = `${item.tahun_akademik}-${item.student_id}`;
    const current = pairs.get(key) ?? {
      key,
      nama_murid: item.nama_murid,
      kod_sekolah: item.kod_sekolah,
    };
    if (item.kod_peperiksaan === 'UPSA') current.upsa = item.purata;
    if (item.kod_peperiksaan === 'UASA') current.uasa = item.purata;
    pairs.set(key, current);
  }

  const rows = Array.from(pairs.values())
    .filter((item) => item.upsa !== undefined || item.uasa !== undefined)
    .sort((a, b) => (b.uasa ?? 0) - (a.uasa ?? 0));

  return (
    <AppFrame title="Perbandingan UPSA / UASA" active="comparison">
      <section className="panel">
        <div className="panel-head">
          <h2>Perbandingan Tahun Semasa</h2>
          <span>{rows.length} murid</span>
        </div>
        {rows.length === 0 ? (
          <p className="empty">Belum ada data UPSA/UASA untuk dibandingkan.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Sekolah</th>
                <th>Nama Murid</th>
                <th>Purata UPSA</th>
                <th>Purata UASA</th>
                <th>Beza</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => {
                const beza =
                  item.upsa !== undefined && item.uasa !== undefined && item.upsa !== null && item.uasa !== null
                    ? Number((item.uasa - item.upsa).toFixed(2))
                    : null;
                return (
                  <tr key={item.key}>
                    <td>{item.kod_sekolah}</td>
                    <td>{item.nama_murid}</td>
                    <td>{item.upsa ?? '-'}</td>
                    <td>{item.uasa ?? '-'}</td>
                    <td>{beza ?? '-'}</td>
                    <td>{beza === null ? 'Belum lengkap' : beza > 0 ? 'Meningkat' : beza < 0 ? 'Menurun' : 'Kekal'}</td>
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

