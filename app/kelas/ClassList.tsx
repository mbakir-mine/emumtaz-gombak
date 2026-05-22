'use client';

import { useMemo, useState } from 'react';
import type { ClassRecord, School } from '@/lib/data';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses } from '../ui/scopedData';

export default function ClassList({ classes, schools }: { classes: ClassRecord[]; schools: School[] }) {
  const profile = useAccessProfile();
  const [query, setQuery] = useState('');
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const filteredClasses = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return scopedClasses;

    return scopedClasses.filter((item) =>
      [item.kod_sekolah, item.tahun_akademik, `Tahun ${item.tahun}`, item.nama_kelas, item.status]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [query, scopedClasses]);

  return (
    <>
      <div className="panel-head">
        <h2>Senarai Kelas</h2>
        <span>
          {filteredClasses.length} / {scopedClasses.length} rekod
        </span>
      </div>
      <div className="search-row">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari sekolah, tahun, nama kelas atau status"
          aria-label="Cari kelas"
        />
      </div>
      {filteredClasses.length === 0 ? (
        <p className="empty">Tiada kelas sepadan dengan carian.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Sekolah</th>
                <th>Tahun</th>
                <th>Tahun Murid</th>
                <th>Kelas</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.map((item) => (
                <tr key={item.id}>
                  <td>{item.kod_sekolah}</td>
                  <td>{item.tahun_akademik}</td>
                  <td>Tahun {item.tahun}</td>
                  <td>{item.nama_kelas}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
