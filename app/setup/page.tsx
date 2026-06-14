import AppFrame from '../ui/AppFrame';
import { getExams } from '@/lib/data';
import ExamAccessForm from './ExamAccessForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SetupPage() {
  const exams = await getExams();
  const upsaExams = exams.filter((exam) => exam.kod_peperiksaan.toUpperCase() === 'UPSA');
  const uasaExams = exams.filter((exam) => exam.kod_peperiksaan.toUpperCase() === 'UASA');

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
            <div className="exam-access-card">
              <h3>UPSA</h3>
              <div className="exam-access-list">
                {upsaExams.length === 0 ? (
                  <p className="empty">Belum ada rekod UPSA.</p>
                ) : (
                  upsaExams.map((exam) => <ExamAccessForm key={exam.id} exam={exam} />)
                )}
              </div>
            </div>
            <div className="exam-access-card">
              <h3>UASA</h3>
              <div className="exam-access-list">
                {uasaExams.length === 0 ? (
                  <p className="empty">Belum ada rekod UASA.</p>
                ) : (
                  uasaExams.map((exam) => <ExamAccessForm key={exam.id} exam={exam} />)
                )}
              </div>
            </div>
          </div>
        )}
      </section>

    </AppFrame>
  );
}
