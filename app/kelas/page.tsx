import AppFrame from '../ui/AppFrame';
import ClassForm from './ClassForm';
import { getClasses, getSchools } from '@/lib/data';

export default async function KelasPage() {
  const [schools, classes] = await Promise.all([getSchools(), getClasses()]);

  return (
    <AppFrame title="Daftar Kelas" active="classes">
      <section className="panel">
        <div className="panel-head">
          <h2>Tambah Kelas</h2>
          <span>Tahun murid menentukan set subjek</span>
        </div>
        <ClassForm schools={schools} />
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Senarai Kelas</h2>
          <span>{classes.length} rekod</span>
        </div>
        {classes.length === 0 ? (
          <p className="empty">Belum ada kelas. Tambah kelas pertama menggunakan borang di atas.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Sekolah</th>
                <th>Tahun</th>
                <th>Tahun Murid</th>
                <th>Kelas</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((item) => (
                <tr key={item.id}>
                  <td>{item.kod_sekolah}</td>
                  <td>{item.tahun_akademik}</td>
                  <td>Tahun {item.tahun}</td>
                  <td>{item.nama_kelas}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AppFrame>
  );
}
