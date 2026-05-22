'use client';

import { useMemo } from 'react';
import PrintButton from '../../ui/PrintButton';
import { useAccessProfile } from '../../ui/AuthGate';
import { scopeSchools } from '../../ui/scopedData';
import type { School, SchoolSummaryRecord } from '@/lib/data';
import { gradeForMark } from '@/lib/subjects';

export default function SchoolReportTable({
  schools,
  summaries,
}: {
  schools: School[];
  summaries: SchoolSummaryRecord[];
}) {
  const profile = useAccessProfile();
  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const allowedSchools = new Set(scopedSchools.map((school) => school.kod_sekolah));
  const schoolName = new Map(schools.map((school) => [school.kod_sekolah, school.nama_sekolah]));
  const scopedSummaries = summaries.filter((item) => allowedSchools.has(item.kod_sekolah));

  return (
    <>
      <div className="panel-head">
        <div>
          <h2>Laporan Prestasi Sekolah</h2>
          <p className="table-note">Purata sekolah dikira berdasarkan purata murid yang mempunyai markah.</p>
        </div>
        <PrintButton />
      </div>
      {scopedSummaries.length === 0 ? (
        <p className="empty">Belum ada markah untuk laporan sekolah.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Tahun Akademik</th>
              <th>Peperiksaan</th>
              <th>Sekolah</th>
              <th>Jumlah Murid</th>
              <th>Purata</th>
              <th>Gred</th>
              <th>Bil Mumtaz</th>
              <th>% Mumtaz</th>
              <th>% Lulus</th>
            </tr>
          </thead>
          <tbody>
            {scopedSummaries.map((item) => (
              <tr key={`${item.tahun_akademik}-${item.kod_peperiksaan}-${item.kod_sekolah}`}>
                <td>{item.tahun_akademik}</td>
                <td>{item.kod_peperiksaan}</td>
                <td>
                  {item.kod_sekolah} - {schoolName.get(item.kod_sekolah)}
                </td>
                <td>{item.jumlah_murid}</td>
                <td>{item.purata_sekolah ?? '-'}</td>
                <td>{gradeForMark(item.purata_sekolah)}</td>
                <td>{item.bil_mumtaz}</td>
                <td>{item.peratus_mumtaz ?? 0}%</td>
                <td>{item.peratus_lulus ?? 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
