'use client';

import { useMemo, useState } from 'react';
import type { ClassRecord, School } from '@/lib/data';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses } from '../ui/scopedData';

export default function ClassList({ classes, schools }: { classes: ClassRecord[]; schools: School[] }) {
  const profile = useAccessProfile();
  const [searchDraft, setSearchDraft] = useState('');
  const [query, setQuery] = useState('');
  const currentAcademicYear = new Date().getFullYear();
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const currentYearClasses = useMemo(() => {
    return scopedClasses.filter((item) => item.tahun_akademik === currentAcademicYear);
  }, [currentAcademicYear, scopedClasses]);
  const filteredClasses = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return currentYearClasses;

    return currentYearClasses.filter((item) =>
      [item.kod_sekolah, item.tahun_akademik, `Tahun ${item.tahun}`, item.nama_kelas, item.status]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [currentYearClasses, query]);

  return (
    <>
      <div className="panel-head">
        <h2>Senarai Kelas</h2>
        <span>
          {filteredClasses.length} / {currentYearClasses.length} rekod
        </span>
      </div>
      <form
        className="search-row"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(searchDraft.trim());
        }}
      >
        <input
          type="search"
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
          placeholder="Cari sekolah, tahun, nama kelas atau status"
          aria-label="Cari kelas"
        />
        <button className="button search-button" type="submit">
          CARI
        </button>
      </form>
      {filteredClasses.length === 0 ? (
        <p className="empty">Tiada kelas sepadan dengan carian.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Bil</th>
                <th>Sekolah</th>
                <th>Tahun</th>
                <th>Tahun Murid</th>
                <th>Kelas</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
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
