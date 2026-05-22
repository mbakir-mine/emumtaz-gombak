'use client';

import { useMemo } from 'react';
import PrintButton from '../../ui/PrintButton';
import { useAccessProfile } from '../../ui/AuthGate';
import { scopeClasses } from '../../ui/scopedData';
import type { ClassRecord, School, SubjectSummaryRecord } from '@/lib/data';
import { gradeForMark } from '@/lib/subjects';

export default function SubjectReportTable({
  schools,
  classes,
  summaries,
}: {
  schools: School[];
  classes: ClassRecord[];
  summaries: SubjectSummaryRecord[];
}) {
  const profile = useAccessProfile();
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const classById = new Map(scopedClasses.map((item) => [item.id, item]));
  const scopedSummaries = summaries.filter((item) => classById.has(item.class_id));

  return (
    <>
      <div className="panel-head">
        <div>
          <h2>Laporan Prestasi Subjek</h2>
          <p className="table-note">Analisis mengikut subjek/kertas, kelas dan peperiksaan.</p>
        </div>
        <PrintButton />
      </div>
      {scopedSummaries.length === 0 ? (
        <p className="empty">Belum ada markah untuk laporan subjek.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Tahun Akademik</th>
              <th>Peperiksaan</th>
              <th>Sekolah</th>
              <th>Kelas</th>
              <th>Subjek</th>
              <th>Bil Markah</th>
              <th>Purata</th>
              <th>Gred</th>
              <th>Bil Lulus</th>
              <th>Bil Gagal</th>
            </tr>
          </thead>
          <tbody>
            {scopedSummaries.map((item) => {
              const classRecord = classById.get(item.class_id);
              return (
                <tr key={`${item.tahun_akademik}-${item.kod_peperiksaan}-${item.class_id}-${item.kod_subjek}`}>
                  <td>{item.tahun_akademik}</td>
                  <td>{item.kod_peperiksaan}</td>
                  <td>{item.kod_sekolah}</td>
                  <td>{classRecord ? `Tahun ${classRecord.tahun} - ${classRecord.nama_kelas}` : '-'}</td>
                  <td>
                    {item.kod_subjek} - {item.nama_subjek}
                  </td>
                  <td>{item.bil_markah}</td>
                  <td>{item.purata_subjek ?? '-'}</td>
                  <td>{gradeForMark(item.purata_subjek)}</td>
                  <td>{item.bil_lulus}</td>
                  <td>{item.bil_gagal}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
