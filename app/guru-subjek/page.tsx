import AppFrame from '../ui/AppFrame';
import TeacherSubjectForm from './TeacherSubjectForm';
import {
  getClasses,
  getSchoolUsers,
  getSchools,
  getSubjects,
  getTeacherSubjectAssignments,
} from '@/lib/data';

export default async function GuruSubjekPage() {
  const [schools, classes, users, subjects, assignments] = await Promise.all([
    getSchools(),
    getClasses(),
    getSchoolUsers(),
    getSubjects(),
    getTeacherSubjectAssignments(),
  ]);

  return (
    <AppFrame title="Tetapan Guru Subjek" active="teacherSubjects">
      <section className="panel">
        <div className="panel-head">
          <h2>Tetapkan Guru Subjek</h2>
          <span>Guru kepada kelas dan subjek</span>
        </div>
        <TeacherSubjectForm schools={schools} classes={classes} users={users} subjects={subjects} />
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Senarai Guru Subjek</h2>
          <span>{assignments.length} rekod</span>
        </div>
        {assignments.length === 0 ? (
          <p className="empty">Belum ada tetapan guru subjek.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Sekolah</th>
                <th>Kelas</th>
                <th>Subjek</th>
                <th>Guru</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((item) => (
                <tr key={item.id}>
                  <td>{item.classes?.kod_sekolah}</td>
                  <td>
                    Tahun {item.classes?.tahun} - {item.classes?.nama_kelas}
                  </td>
                  <td>
                    {item.kod_subjek} - {item.subjects?.nama_subjek}
                  </td>
                  <td>{item.users?.nama}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AppFrame>
  );
}

