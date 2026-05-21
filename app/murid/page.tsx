import AppFrame from '../ui/AppFrame';
import StudentForm from './StudentForm';
import { getClasses, getSchools, getStudents } from '@/lib/data';

export default async function MuridPage() {
  const [schools, classes, students] = await Promise.all([getSchools(), getClasses(), getStudents()]);
  const classById = new Map(classes.map((item) => [item.id, item]));

  return (
    <AppFrame title="Daftar Murid" active="students">
      <section className="panel">
        <div className="panel-head">
          <h2>Tambah Murid</h2>
          <span>Murid mesti diikat kepada kelas</span>
        </div>
        {classes.length === 0 ? (
          <p className="notice">Sila daftar kelas dahulu sebelum memasukkan murid.</p>
        ) : (
          <StudentForm schools={schools} classes={classes} />
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Senarai Murid</h2>
          <span>{students.length} rekod</span>
        </div>
        {students.length === 0 ? (
          <p className="empty">Belum ada murid. Tambah murid pertama menggunakan borang di atas.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>MyKid</th>
                <th>Nama Murid</th>
                <th>Sekolah</th>
                <th>Kelas</th>
                <th>Jantina</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const classRecord = student.class_id ? classById.get(student.class_id) : null;
                return (
                  <tr key={student.id}>
                    <td>{student.mykid}</td>
                    <td>{student.nama_murid}</td>
                    <td>{student.kod_sekolah}</td>
                    <td>
                      {classRecord
                        ? `Tahun ${classRecord.tahun} - ${classRecord.nama_kelas}`
                        : 'Tiada kelas'}
                    </td>
                    <td>{student.jantina}</td>
                    <td>{student.status}</td>
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

