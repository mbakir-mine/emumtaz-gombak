'use client';

import { useMemo, useState } from 'react';
import type { School } from '@/lib/data';
import type { AccessProfile } from '@/lib/access';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeSchools } from '../ui/scopedData';
import SchoolZoneForm from './SchoolZoneForm';

const zoneOrder = ['BARAT', 'TENGAH', 'TIMUR'];

function zoneText(zon: string | null) {
  if (!zon) return 'Belum ditetapkan';
  return `Zon ${zon.charAt(0) + zon.slice(1).toLowerCase()}`;
}

function categoryOf(school: School) {
  return (school.kategori || '').toUpperCase();
}

function countByCategory(schools: School[], categories: string[]) {
  const allowed = new Set(categories);
  return schools.filter((school) => allowed.has(categoryOf(school))).length;
}

function categoryBreakdown(schools: School[]) {
  return {
    srai: countByCategory(schools, ['SRAI']),
    sra: countByCategory(schools, ['SRA']),
    kafai: countByCategory(schools, ['KAFAI']),
  };
}

function zoneBreakdown(schools: School[], categories: string[]) {
  return zoneOrder.map((zone) => ({
    zone,
    count: countByCategory(
      schools.filter((school) => school.zon === zone),
      categories,
    ),
  }));
}

function SchoolSummaryCards({ profile, schools }: { profile: AccessProfile | null; schools: School[] }) {
  const breakdown = categoryBreakdown(schools);
  const isZoneAdmin = profile?.role === 'ADMIN_ZON';
  const sraSraiTotal = countByCategory(schools, ['SRA', 'SRAI']);
  const kafaiTotal = countByCategory(schools, ['KAFAI']);

  return (
    <div className="school-summary-grid">
      <article className="school-summary-card">
        <span>{isZoneAdmin ? `Sekolah ${zoneText(profile?.zon ?? null)}` : 'Sekolah Daerah'}</span>
        <strong>{schools.length}</strong>
        <div className="school-count-list">
          <span>
            <em>SRAI</em>
            <i>:</i>
            <b>{breakdown.srai}</b>
          </span>
          <span>
            <em>SRA</em>
            <i>:</i>
            <b>{breakdown.sra}</b>
          </span>
          <span>
            <em>KAFAI</em>
            <i>:</i>
            <b>{breakdown.kafai}</b>
          </span>
        </div>
      </article>

      <article className="school-summary-card">
        <span>{isZoneAdmin ? 'SRA & SRAI Zon' : 'SRA & SRAI Daerah'}</span>
        <strong>{sraSraiTotal}</strong>
        {!isZoneAdmin ? (
          <div className="school-zone-list">
            {zoneBreakdown(schools, ['SRA', 'SRAI']).map((item) => (
              <span key={item.zone}>
                <em>{zoneText(item.zone)}</em>
                <i>:</i>
                <b>{item.count}</b>
              </span>
            ))}
          </div>
        ) : (
          <p>Sekolah agama rendah dalam zon semasa.</p>
        )}
      </article>

      <article className="school-summary-card">
        <span>{isZoneAdmin ? 'KAFAI Zon' : 'KAFAI Daerah'}</span>
        <strong>{kafaiTotal}</strong>
        {!isZoneAdmin ? (
          <div className="school-zone-list">
            {zoneBreakdown(schools, ['KAFAI']).map((item) => (
              <span key={item.zone}>
                <em>{zoneText(item.zone)}</em>
                <i>:</i>
                <b>{item.count}</b>
              </span>
            ))}
          </div>
        ) : (
          <p>KAFAI dalam zon semasa.</p>
        )}
      </article>
    </div>
  );
}

export default function SchoolList({ schools }: { schools: School[] }) {
  const profile = useAccessProfile();
  const [query, setQuery] = useState('');
  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const assignedZones = scopedSchools.filter((school) => school.zon).length;
  const canEditZone = profile?.role === 'OWNER' || profile?.role === 'ADMIN_DAERAH';
  const filteredSchools = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return scopedSchools;

    return scopedSchools.filter((school) =>
      [school.kod_sekolah, school.nama_sekolah, school.kategori, school.daerah, school.zon, school.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [query, scopedSchools]);

  return (
    <>
      <SchoolSummaryCards profile={profile} schools={scopedSchools} />
      <div className="panel-head">
        <h2>Sekolah</h2>
        <span>
          {filteredSchools.length} / {scopedSchools.length} rekod - {assignedZones} berzon
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
                    {canEditZone ? (
                      <SchoolZoneForm kodSekolah={school.kod_sekolah} currentZone={school.zon} />
                    ) : (
                      zoneText(school.zon)
                    )}
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
