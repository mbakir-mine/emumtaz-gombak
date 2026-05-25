'use client';

import { useMemo } from 'react';
import PrintButton from '../../ui/PrintButton';
import { useAccessProfile } from '../../ui/AuthGate';
import { scopeClasses } from '../../ui/scopedData';
import type { ClassRecord, School, StudentSummaryRecord } from '@/lib/data';
import { buildClassSummaries } from '@/lib/reporting';
import { gradeForMark } from '@/lib/subjects';

export default function ClassReportTable({
  schools,
  classes,
  studentSummaries,
}: {
  schools: School[];
  classes: ClassRecord[];
  studentSummaries: StudentSummaryRecord[];
}) {
  const profile = useAccessProfile();
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const allowedClasses = new Set(scopedClasses.map((item) => item.id));
  const summaries = buildClassSummaries(studentSummaries, scopedClasses).filter((item) =>
    allowedClasses.has(item.class_id),
  );

  return (
    <>
      <div className="panel-head">
        <div>
          <h2>Laporan Prestasi Kelas</h2>
          <p className="table-note">Ringkasan ini dibina daripada purata murid dalam setiap kelas.</p>
        </div>
        <PrintButton />
      </div>
      {summaries.length === 0 ? (
        <p className="empty">Belum ada markah untuk laporan kelas.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Bil</th>
              <th>Tahun Akademik</th>
              <th>Peperiksaan</th>
              <th>Sekolah</th>
              <th>Tahun</th>
              <th>Kelas</th>
              <th>Murid</th>
              <th>Purata</th>
              <th>Gred</th>
              <th>Bil Mumtaz</th>
              <th>Bil Lulus</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((item, index) => (
              <tr key={`${item.tahun_akademik}-${item.kod_peperiksaan}-${item.class_id}`}>
                <td>{index + 1}</td>
                <td>{item.tahun_akademik}</td>
                <td>{item.kod_peperiksaan}</td>
                <td>{item.kod_sekolah}</td>
                <td>Tahun {item.tahun}</td>
                <td>{item.nama_kelas}</td>
                <td>{item.jumlah_murid}</td>
                <td>{item.purata_kelas ?? '-'}</td>
                <td>{gradeForMark(item.purata_kelas)}</td>
                <td>{item.bil_mumtaz}</td>
                <td>{item.bil_lulus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
