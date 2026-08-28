import AppFrame from '../ui/AppFrame';
import { getExams } from '@/lib/data';
import { compareExamRecords } from '@/lib/examOrdering';
import ExamAccessForm from './ExamAccessForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SetupPage() {
  const exams = await getExams();
  const examGroups = [
    {
      title: 'UPSA',
      empty: 'Belum ada rekod UPSA.',
      records: exams.filter((exam) => exam.kod_peperiksaan.toUpperCase() === 'UPSA').sort(compareExamRecords),
    },
    {
      title: 'UASA',
      empty: 'Belum ada rekod UASA.',
      records: exams.filter((exam) => exam.kod_peperiksaan.toUpperCase() === 'UASA').sort(compareExamRecords),
    },
    {
      title: 'Percubaan PSRA',
      empty: 'Belum ada rekod Percubaan PSRA.',
      records: exams
        .filter((exam) => ['PSRA1', 'PSRA2'].includes(exam.kod_peperiksaan.toUpperCase()))
        .sort(compareExamRecords),
    },
  ];

  return (
    <AppFrame title="Tetapan" subtitle="Akses markah dan panduan sistem." active="setup">
      <section className="panel">
        <div className="panel-head">
          <h2>Akses Key In Markah</h2>
          <span>{exams.length} peperiksaan</span>
        </div>
        {exams.length === 0 ? (
          <p className="empty">Belum ada peperiksaan.</p>
        ) : (
          <div className="exam-access-board">
            {examGroups.map((group) => (
              <div className="exam-access-card" key={group.title}>
                <h3>{group.title}</h3>
                <div className="exam-access-list">
                  {group.records.length === 0 ? (
                    <p className="empty">{group.empty}</p>
                  ) : (
                    group.records.map((exam) => <ExamAccessForm key={exam.id} exam={exam} />)
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </AppFrame>
  );
}
