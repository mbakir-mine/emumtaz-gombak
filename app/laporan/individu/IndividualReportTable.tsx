'use client';

import { useMemo } from 'react';
import PrintButton from '../../ui/PrintButton';
import { useAccessProfile } from '../../ui/AuthGate';
import { scopeSchools } from '../../ui/scopedData';
import type { School, StudentSummaryRecord } from '@/lib/data';
import { gradeForMark } from '@/lib/subjects';

export default function IndividualReportTable({
  schools,
  summaries,
}: {
  schools: School[];
  summaries: StudentSummaryRecord[];
}) {
  const profile = useAccessProfile();
  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const allowedSchools = new Set(scopedSchools.map((school) => school.kod_sekolah));
  const scopedSummaries = summaries.filter((item) => allowedSchools.has(item.kod_sekolah));

  return (
    <>
      <div className="panel-head">
        <div>
          <h2>Laporan Ringkas Individu</h2>
          <p className="table-note">Memaparkan purata murid berdasarkan subjek yang dikira sahaja.</p>
        </div>
        <PrintButton />
      </div>
      {scopedSummaries.length === 0 ? (
        <p className="empty">Belum ada markah untuk laporan individu.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Tahun Akademik</th>
              <th>Peperiksaan</th>
              <th>Sekolah</th>
              <th>MyKid</th>
              <th>Nama Murid</th>
              <th>Bil Subjek</th>
              <th>Jumlah</th>
              <th>Purata</th>
              <th>Gred</th>
            </tr>
          </thead>
          <tbody>
            {scopedSummaries.map((item) => (
              <tr key={`${item.tahun_akademik}-${item.kod_peperiksaan}-${item.student_id}`}>
                <td>{item.tahun_akademik}</td>
                <td>{item.kod_peperiksaan}</td>
                <td>{item.kod_sekolah}</td>
                <td>{item.mykid}</td>
                <td>{item.nama_murid}</td>
                <td>{item.bil_subjek_dikira}</td>
                <td>{item.jumlah_markah ?? '-'}</td>
                <td>{item.purata ?? '-'}</td>
                <td>{gradeForMark(item.purata)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
