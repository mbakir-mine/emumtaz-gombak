'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAccessProfile } from '../../ui/AuthGate';
import { scopeClasses, scopeSchools } from '../../ui/scopedData';
import type { ClassRecord, School, StudentSummaryRecord } from '@/lib/data';
import { gradeForMark } from '@/lib/subjects';

const yearOptions = [2025, 2026, 2027, 2028, 2029, 2030];
const zoneOptions = ['BARAT', 'TIMUR', 'TENGAH'];

function zoneLabel(zon: string) {
  return `Zon ${zon.charAt(0) + zon.slice(1).toLowerCase()}`;
}

export default function IndividualReportTable({
  schools,
  classes,
  summaries,
}: {
  schools: School[];
  classes: ClassRecord[];
  summaries: StudentSummaryRecord[];
}) {
  const profile = useAccessProfile();
  const currentYear = new Date().getFullYear();
  const defaultYear = yearOptions.includes(currentYear) ? currentYear : 2026;
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedTahun, setSelectedTahun] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const classById = useMemo(() => new Map(scopedClasses.map((item) => [item.id, item])), [scopedClasses]);
  const effectiveZone = profile?.role === 'ADMIN_ZON' ? profile.zon ?? '' : selectedZone;
  const effectiveSchool = profile?.role === 'ADMIN_SEKOLAH' ? profile.kod_sekolah ?? '' : selectedSchool;
  const schoolOptions = scopedSchools.filter((school) => !effectiveZone || school.zon === effectiveZone);
  const classOptions = scopedClasses.filter((item) => {
    if (effectiveSchool && item.kod_sekolah !== effectiveSchool) return false;
    if (selectedTahun && item.tahun !== Number(selectedTahun)) return false;
    return true;
  });
  const allowedSchools = new Set(schoolOptions.map((school) => school.kod_sekolah));

  const filteredSummaries = summaries.filter((item) => {
    if (item.tahun_akademik !== selectedYear) return false;
    if (!allowedSchools.has(item.kod_sekolah)) return false;
    if (effectiveSchool && item.kod_sekolah !== effectiveSchool) return false;

    const classRecord = classById.get(item.class_id);
    if (selectedTahun && classRecord?.tahun !== Number(selectedTahun)) return false;
    if (selectedClass && item.class_id !== selectedClass) return false;
    return true;
  });

  return (
    <>
      <div className="panel-head">
        <div>
          <h2>Laporan Individu Murid</h2>
          <p className="table-note">Pilih tapisan, kemudian klik nama murid untuk cetakan individu.</p>
        </div>
        <span>{filteredSummaries.length} rekod</span>
      </div>

      <div className="report-filter-grid no-print">
        <label>
          Tahun Peperiksaan
          <select
            value={selectedYear}
            onChange={(event) => {
              setSelectedYear(Number(event.target.value));
              setSelectedClass('');
            }}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label>
          Zon
          <select
            value={effectiveZone}
            onChange={(event) => {
              setSelectedZone(event.target.value);
              setSelectedSchool('');
              setSelectedClass('');
            }}
            disabled={profile?.role === 'ADMIN_ZON' || profile?.role === 'ADMIN_SEKOLAH'}
          >
            <option value="">Semua zon</option>
            {zoneOptions.map((zon) => (
              <option key={zon} value={zon}>
                {zoneLabel(zon)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Sekolah
          <select
            value={effectiveSchool}
            onChange={(event) => {
              setSelectedSchool(event.target.value);
              setSelectedClass('');
            }}
            disabled={profile?.role === 'ADMIN_SEKOLAH'}
          >
            <option value="">Semua sekolah</option>
            {schoolOptions.map((school) => (
              <option key={school.kod_sekolah} value={school.kod_sekolah}>
                {school.kod_sekolah} - {school.nama_sekolah}
              </option>
            ))}
          </select>
        </label>

        <label>
          Tahun Murid
          <select
            value={selectedTahun}
            onChange={(event) => {
              setSelectedTahun(event.target.value);
              setSelectedClass('');
            }}
          >
            <option value="">Semua tahun</option>
            {[1, 2, 3, 4, 5, 6].map((tahun) => (
              <option key={tahun} value={tahun}>
                Tahun {tahun}
              </option>
            ))}
          </select>
        </label>

        <label>
          Kelas
          <select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)}>
            <option value="">Semua kelas</option>
            {classOptions.map((item) => (
              <option key={item.id} value={item.id}>
                Tahun {item.tahun} - {item.nama_kelas}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filteredSummaries.length === 0 ? (
        <p className="empty">Tiada murid sepadan dengan pilihan laporan.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Peperiksaan</th>
                <th>Sekolah</th>
                <th>Tahun</th>
                <th>Kelas</th>
                <th>Nama Murid</th>
                <th>Bil Subjek</th>
                <th>Purata</th>
                <th>Gred</th>
              </tr>
            </thead>
            <tbody>
              {filteredSummaries.map((item) => {
                const classRecord = classById.get(item.class_id);
                const href = `/laporan/individu/cetak?student_id=${item.student_id}&tahun_akademik=${item.tahun_akademik}&kod_peperiksaan=${item.kod_peperiksaan}`;

                return (
                  <tr key={`${item.tahun_akademik}-${item.kod_peperiksaan}-${item.student_id}`}>
                    <td>{item.kod_peperiksaan}</td>
                    <td>{item.kod_sekolah}</td>
                    <td>{classRecord ? `Tahun ${classRecord.tahun}` : '-'}</td>
                    <td>{classRecord?.nama_kelas ?? '-'}</td>
                    <td>
                      <Link className="text-link" href={href}>
                        {item.nama_murid}
                      </Link>
                    </td>
                    <td>{item.bil_subjek_dikira}</td>
                    <td>{item.purata ?? '-'}</td>
                    <td>{gradeForMark(item.purata)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
