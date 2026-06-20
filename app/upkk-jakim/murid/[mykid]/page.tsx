import Link from 'next/link';
import AppFrame from '../../../ui/AppFrame';
import {
  getClasses,
  getSchoolModuleAccesses,
  getSchools,
  getStudents,
  getUpkkJakimItemMarks,
  getUpkkJakimMarks,
} from '@/lib/data';
import type { UpkkJakimAssessmentType } from '@/lib/upkkJakim';
import UpkkJakimStudentForm from './UpkkJakimStudentForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function decodeParam(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isUpkkAssessmentType(value: string | undefined): value is UpkkJakimAssessmentType {
  return value === 'PCHI' || value === 'AMALI_SOLAT';
}

export default async function UpkkJakimStudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ mykid: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ mykid }, query] = await Promise.all([params, searchParams]);
  const studentMykid = decodeParam(mykid);
  const tahun = Number(firstParam(query.tahun));
  const classId = firstParam(query.kelas) ?? '';
  const jenis = firstParam(query.jenis);
  const assessmentType: UpkkJakimAssessmentType = isUpkkAssessmentType(jenis) ? jenis : 'PCHI';
  const selectedYear = Number.isFinite(tahun) ? tahun : new Date().getFullYear();

  const [schools, classes, students, marks, itemMarks, moduleAccesses] = await Promise.all([
    getSchools(),
    getClasses(),
    getStudents(),
    getUpkkJakimMarks(),
    getUpkkJakimItemMarks(),
    getSchoolModuleAccesses(),
  ]);

  const selectedClass = classes.find((item) => item.id === classId) ?? null;
  const selectedSchool = selectedClass ? schools.find((school) => school.kod_sekolah === selectedClass.kod_sekolah) ?? null : null;
  const selectedStudent =
    students.find((student) => student.mykid === studentMykid && student.class_id === selectedClass?.id) ??
    students.find((student) => student.mykid === studentMykid) ??
    null;
  const backHref = `/upkk-jakim?sekolah=${encodeURIComponent(selectedClass?.kod_sekolah ?? firstParam(query.sekolah) ?? '')}&tahun=${selectedYear}&kelas=${encodeURIComponent(classId)}&jenis=${assessmentType}`;

  return (
    <AppFrame
      title="UPKK JAKIM"
      subtitle={selectedStudent ? `Borang pemarkahan ${selectedStudent.nama_murid}.` : 'Borang pemarkahan murid Tahun 5.'}
      active="upkkJakim"
    >
      {!selectedClass || !selectedSchool || !selectedStudent ? (
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Rekod murid tidak ditemui</h2>
              <p>Semak semula kelas, tahun akademik dan murid yang dipilih.</p>
            </div>
            <Link className="button secondary" href="/upkk-jakim">
              Kembali
            </Link>
          </div>
        </section>
      ) : (
        <UpkkJakimStudentForm
          school={selectedSchool}
          selectedClass={selectedClass}
          student={selectedStudent}
          marks={marks}
          itemMarks={itemMarks}
          moduleAccesses={moduleAccesses}
          assessmentType={assessmentType}
          year={selectedYear}
          backHref={backHref}
        />
      )}
    </AppFrame>
  );
}
