'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
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

type SchoolFilter = {
  label: string;
  categories?: string[];
  zone?: string;
};

function matchesFilter(school: School, filter: SchoolFilter | null) {
  if (!filter) return false;
  if (filter.zone && school.zon !== filter.zone) return false;
  if (filter.categories && !filter.categories.includes(categoryOf(school))) return false;
  return true;
}

function CountButton({
  children,
  filter,
  onSelect,
}: {
  children: ReactNode;
  filter: SchoolFilter;
  onSelect: (filter: SchoolFilter) => void;
}) {
  return (
    <button type="button" className="school-count-button" onClick={() => onSelect(filter)}>
      {children}
    </button>
  );
}

function SchoolSummaryCards({
  profile,
  schools,
  onSelect,
}: {
  profile: AccessProfile | null;
  schools: School[];
  onSelect: (filter: SchoolFilter) => void;
}) {
  const breakdown = categoryBreakdown(schools);
  const isZoneAdmin = profile?.role === 'ADMIN_ZON';
  const sraSraiTotal = countByCategory(schools, ['SRA', 'SRAI']);
  const kafaiTotal = countByCategory(schools, ['KAFAI']);
  const scopeLabel = isZoneAdmin ? zoneText(profile?.zon ?? null) : 'Daerah Gombak';

  return (
    <div className="school-summary-grid">
      <article className="school-summary-card">
        <div className="school-summary-title">
          <span>Jumlah Sekolah</span>
          <small>{scopeLabel}</small>
        </div>
        <div className="school-summary-main">
          <CountButton filter={{ label: `Semua sekolah ${scopeLabel}` }} onSelect={onSelect}>
            <strong>{schools.length}</strong>
          </CountButton>
          <div className="school-count-list">
            <span>
              <em>SRAI</em>
              <i>:</i>
              <CountButton filter={{ label: `SRAI ${scopeLabel}`, categories: ['SRAI'] }} onSelect={onSelect}>
                <b>{breakdown.srai}</b>
              </CountButton>
            </span>
            <span>
              <em>SRA</em>
              <i>:</i>
              <CountButton filter={{ label: `SRA ${scopeLabel}`, categories: ['SRA'] }} onSelect={onSelect}>
                <b>{breakdown.sra}</b>
              </CountButton>
            </span>
            <span>
              <em>KAFAI</em>
              <i>:</i>
              <CountButton filter={{ label: `KAFAI ${scopeLabel}`, categories: ['KAFAI'] }} onSelect={onSelect}>
                <b>{breakdown.kafai}</b>
              </CountButton>
            </span>
          </div>
        </div>
      </article>

      <article className="school-summary-card">
        <div className="school-summary-title">
          <span>SRA & SRAI</span>
          <small>{scopeLabel}</small>
        </div>
        <div className="school-summary-main">
          <CountButton
            filter={{ label: `SRA & SRAI ${scopeLabel}`, categories: ['SRA', 'SRAI'] }}
            onSelect={onSelect}
          >
            <strong>{sraSraiTotal}</strong>
          </CountButton>
          <div className="school-zone-list">
            {isZoneAdmin ? (
              <>
                <span>
                  <em>SRAI</em>
                  <i>:</i>
                  <CountButton filter={{ label: `SRAI ${scopeLabel}`, categories: ['SRAI'] }} onSelect={onSelect}>
                    <b>{breakdown.srai}</b>
                  </CountButton>
                </span>
                <span>
                  <em>SRA</em>
                  <i>:</i>
                  <CountButton filter={{ label: `SRA ${scopeLabel}`, categories: ['SRA'] }} onSelect={onSelect}>
                    <b>{breakdown.sra}</b>
                  </CountButton>
                </span>
              </>
            ) : (
              zoneBreakdown(schools, ['SRA', 'SRAI']).map((item) => (
                <span key={item.zone}>
                  <em>{zoneText(item.zone)}</em>
                  <i>:</i>
                  <CountButton
                    filter={{ label: `SRA & SRAI ${zoneText(item.zone)}`, categories: ['SRA', 'SRAI'], zone: item.zone }}
                    onSelect={onSelect}
                  >
                    <b>{item.count}</b>
                  </CountButton>
                </span>
              ))
            )}
          </div>
        </div>
      </article>

      <article className="school-summary-card">
        <div className="school-summary-title">
          <span>KAFAI</span>
          <small>{scopeLabel}</small>
        </div>
        <div className="school-summary-main">
          <CountButton filter={{ label: `KAFAI ${scopeLabel}`, categories: ['KAFAI'] }} onSelect={onSelect}>
            <strong>{kafaiTotal}</strong>
          </CountButton>
          <div className="school-zone-list">
            {isZoneAdmin ? (
              <span>
                <em>KAFAI</em>
                <i>:</i>
                <CountButton filter={{ label: `KAFAI ${scopeLabel}`, categories: ['KAFAI'] }} onSelect={onSelect}>
                  <b>{breakdown.kafai}</b>
                </CountButton>
              </span>
            ) : (
              zoneBreakdown(schools, ['KAFAI']).map((item) => (
                <span key={item.zone}>
                  <em>{zoneText(item.zone)}</em>
                  <i>:</i>
                  <CountButton
                    filter={{ label: `KAFAI ${zoneText(item.zone)}`, categories: ['KAFAI'], zone: item.zone }}
                    onSelect={onSelect}
                  >
                    <b>{item.count}</b>
                  </CountButton>
                </span>
              ))
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

export default function SchoolList({ schools }: { schools: School[] }) {
  const profile = useAccessProfile();
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<SchoolFilter | null>(null);
  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const assignedZones = scopedSchools.filter((school) => school.zon).length;
  const canEditZone = profile?.role === 'OWNER' || profile?.role === 'ADMIN_DAERAH';
  const filteredSchools = useMemo(() => {
    const term = query.trim().toLowerCase();
    const baseSchools = selectedFilter ? scopedSchools.filter((school) => matchesFilter(school, selectedFilter)) : [];
    if (!term) return baseSchools;

    return (selectedFilter ? baseSchools : scopedSchools).filter((school) =>
      [school.kod_sekolah, school.nama_sekolah, school.kategori, school.daerah, school.zon, school.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [query, scopedSchools, selectedFilter]);
  const shouldShowList = Boolean(selectedFilter) || query.trim().length > 0;

  return (
    <>
      <SchoolSummaryCards profile={profile} schools={scopedSchools} onSelect={setSelectedFilter} />
      <div className="panel-head">
        <div>
          <h2>Carian Sekolah</h2>
          {selectedFilter ? <p className="table-note">Paparan: {selectedFilter.label}</p> : null}
        </div>
        <span>
          {filteredSchools.length} / {scopedSchools.length} rekod - {assignedZones} berzon
        </span>
      </div>
      <div className="search-row">
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!event.target.value.trim()) return;
            setSelectedFilter(null);
          }}
          placeholder="Cari kod, nama sekolah, kategori, zon atau status"
          aria-label="Cari sekolah"
        />
      </div>
      {!shouldShowList ? (
        <p className="empty">Klik angka pada kad di atas atau gunakan carian untuk memaparkan senarai sekolah.</p>
      ) : filteredSchools.length === 0 ? (
        <p className="empty">Tiada rekod sekolah sepadan dengan carian.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Bil</th>
                <th>Kod</th>
                <th>Nama Sekolah</th>
                <th>Kategori</th>
                <th>Daerah</th>
                <th>Zon</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchools.map((school, index) => (
                <tr key={school.kod_sekolah}>
                  <td data-label="Bil">{index + 1}</td>
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
