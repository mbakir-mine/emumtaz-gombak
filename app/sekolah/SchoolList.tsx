'use client';

import { useMemo, useState } from 'react';
import type { School } from '@/lib/data';
import SchoolZoneForm from './SchoolZoneForm';

export default function SchoolList({ schools }: { schools: School[] }) {
  const [query, setQuery] = useState('');
  const assignedZones = schools.filter((school) => school.zon).length;
  const filteredSchools = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return schools;

    return schools.filter((school) =>
      [school.kod_sekolah, school.nama_sekolah, school.kategori, school.daerah, school.zon, school.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [query, schools]);

  return (
    <>
      <div className="panel-head">
        <h2>Sekolah</h2>
        <span>
          {filteredSchools.length} / {schools.length} rekod · {assignedZones} berzon
        </span>
      </div>
      <div className="search-row">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari kod, nama sekolah, kategori, zon atau status"
          aria-label="Cari sekolah"
        />
      </div>
      {filteredSchools.length === 0 ? (
        <p className="empty">Tiada rekod sekolah sepadan dengan carian.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Kod</th>
                <th>Nama Sekolah</th>
                <th>Kategori</th>
                <th>Daerah</th>
                <th>Zon</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchools.map((school) => (
                <tr key={school.kod_sekolah}>
                  <td data-label="Kod">{school.kod_sekolah}</td>
                  <td data-label="Sekolah">{school.nama_sekolah}</td>
                  <td data-label="Kategori">{school.kategori}</td>
                  <td data-label="Daerah">{school.daerah}</td>
                  <td data-label="Zon">
                    <SchoolZoneForm kodSekolah={school.kod_sekolah} currentZone={school.zon} />
                  </td>
                  <td data-label="Status">{school.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
