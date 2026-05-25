'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ClassRecord, School } from '@/lib/data';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses } from '../ui/scopedData';
import ClassForm from './ClassForm';

const years = [1, 2, 3, 4, 5, 6];
const zones = ['BARAT', 'TENGAH', 'TIMUR'];

type ClassWithSchool = ClassRecord & {
  school?: School;
};

type ClassFilter = {
  label: string;
  zone?: string;
  schoolCode?: string;
  year?: number;
};

function zoneLabel(zon: string | null | undefined) {
  if (!zon) return 'Zon belum ditetapkan';
  return `Zon ${zon.charAt(0) + zon.slice(1).toLowerCase()}`;
}

function countClasses(items: ClassWithSchool[], filter: Omit<ClassFilter, 'label'>) {
  return items.filter((item) => {
    if (filter.zone && item.school?.zon !== filter.zone) return false;
    if (filter.schoolCode && item.kod_sekolah !== filter.schoolCode) return false;
    if (filter.year && item.tahun !== filter.year) return false;
    return true;
  }).length;
}

function statsTitle(role: string | undefined) {
  const currentYear = new Date().getFullYear();
  if (role === 'ADMIN_ZON') return `Statistik Kelas Zon ${currentYear}`;
  if (role === 'ADMIN_SEKOLAH') return `Statistik Kelas Sekolah ${currentYear}`;
  return `Statistik Kelas Daerah Gombak ${currentYear}`;
}

function YearBreakdownCard({
  title,
  items,
  zone,
  schoolCode,
  onSelect,
}: {
  title: string;
  items: ClassWithSchool[];
  zone?: string;
  schoolCode?: string;
  onSelect: (filter: ClassFilter) => void;
}) {
  return (
    <article className="summary-card">
      <div>
        <h3>{title}</h3>
      </div>
      <div className="year-stats">
        {years.map((year) => {
          const filter = { zone, schoolCode, year };
          const classTotal = countClasses(items, filter);
          return (
            <div className="year-stat" key={year}>
              <span>Tahun {year}</span>
              <button
                type="button"
                onClick={() =>
                  onSelect({
                    ...filter,
                    label: `${title} - Kelas Tahun ${year}`,
                  })
                }
              >
                <strong>{classTotal}</strong>
              </button>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function TotalCard({
  title,
  total,
  children,
  action,
  onSelect,
}: {
  title: string;
  total: number;
  children?: ReactNode;
  action?: ReactNode;
  onSelect: () => void;
}) {
  return (
    <article className="summary-card summary-card-compact">
      <span>{title}</span>
      <button className="summary-number" type="button" onClick={onSelect}>
        {total}
      </button>
      {children}
      {action}
    </article>
  );
}

export default function ClassOverview({
  schools,
  classes,
}: {
  schools: School[];
  classes: ClassRecord[];
}) {
  const profile = useAccessProfile();
  const [filter, setFilter] = useState<ClassFilter | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const selectFilter = (nextFilter: ClassFilter) => {
    setFilter(nextFilter);
    window.setTimeout(() => {
      document.getElementById('senarai-kelas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const schoolByCode = useMemo(() => {
    return new Map(schools.map((school) => [school.kod_sekolah, school]));
  }, [schools]);

  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);

  const visibleItems = useMemo<ClassWithSchool[]>(() => {
    return scopedClasses.map((item) => ({
      ...item,
      school: schoolByCode.get(item.kod_sekolah),
    }));
  }, [schoolByCode, scopedClasses]);

  const filteredItems = visibleItems.filter((item) => {
    if (!filter) return false;
    if (filter.zone && item.school?.zon !== filter.zone) return false;
    if (filter.schoolCode && item.kod_sekolah !== filter.schoolCode) return false;
    if (filter.year && item.tahun !== filter.year) return false;
    return true;
  });

  const isDistrictView = !profile || profile.role === 'OWNER' || profile.role === 'ADMIN_DAERAH';
  const isZoneView = profile?.role === 'ADMIN_ZON';
  const school = profile?.kod_sekolah ? schoolByCode.get(profile.kod_sekolah) : null;
  const totalTitle = isDistrictView
    ? 'Jumlah kelas daerah'
    : isZoneView
      ? `Jumlah kelas ${zoneLabel(profile.zon)}`
      : `Jumlah kelas ${school?.nama_sekolah ?? profile?.kod_sekolah ?? 'sekolah'}`;
  const addClassButton = (
    <button className="button summary-add-button" type="button" onClick={() => setShowAddForm((value) => !value)}>
      {showAddForm ? 'TUTUP BORANG' : 'TAMBAH KELAS'}
    </button>
  );

  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <h2>{statsTitle(profile?.role)}</h2>
          <span>{filter?.label ?? 'Pilih angka untuk melihat butiran'}</span>
        </div>

        {isDistrictView && (
          <div className="summary-grid">
            <TotalCard
              title={totalTitle}
              total={visibleItems.length}
              action={addClassButton}
              onSelect={() => selectFilter({ label: 'Semua kelas daerah' })}
            >
              <div className="zone-mini-list">
                {zones.map((zone) => (
                  <button
                    type="button"
                    key={zone}
                    onClick={() => selectFilter({ label: `${zoneLabel(zone)} - Semua kelas`, zone })}
                  >
                    <span>{zoneLabel(zone)}</span>
                    <strong>{countClasses(visibleItems, { zone })}</strong>
                  </button>
                ))}
              </div>
            </TotalCard>
            {zones.map((zone) => (
              <YearBreakdownCard
                key={zone}
                title={zoneLabel(zone)}
                items={visibleItems}
                zone={zone}
                onSelect={selectFilter}
              />
            ))}
          </div>
        )}

        {isZoneView && (
          <div className="summary-grid summary-grid-zone">
            <TotalCard
              title={totalTitle}
              total={visibleItems.length}
              action={addClassButton}
              onSelect={() => selectFilter({ label: zoneLabel(profile.zon), zone: profile.zon ?? undefined })}
            />
            <YearBreakdownCard
              title={zoneLabel(profile.zon)}
              items={visibleItems}
              zone={profile.zon ?? undefined}
              onSelect={selectFilter}
            />
          </div>
        )}

        {profile?.role === 'ADMIN_SEKOLAH' && (
          <div className="summary-grid summary-grid-zone">
            <TotalCard
              title={totalTitle}
              total={visibleItems.length}
              action={addClassButton}
              onSelect={() =>
                selectFilter({
                  label: school?.nama_sekolah ?? profile.kod_sekolah ?? 'Sekolah',
                  schoolCode: profile.kod_sekolah ?? undefined,
                })
              }
            />
            <YearBreakdownCard
              title={school?.nama_sekolah ?? profile.kod_sekolah ?? 'Sekolah'}
              items={visibleItems}
              schoolCode={profile.kod_sekolah ?? undefined}
              onSelect={selectFilter}
            />
          </div>
        )}

        {showAddForm && (
          <div className="inline-add-panel">
            <div className="panel-head">
              <h3>Tambah Kelas</h3>
              <span>Tahun murid menentukan set subjek</span>
            </div>
            <ClassForm schools={schools} />
          </div>
        )}
      </section>

      {filter && (
        <section className="panel" id="senarai-kelas">
          <div className="panel-head">
            <h2>Butiran Kelas</h2>
            <span>{filteredItems.length} / {visibleItems.length} rekod</span>
          </div>

          {filteredItems.length === 0 ? (
          <p className="empty">Tiada kelas untuk pilihan ini.</p>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Sekolah</th>
                    <th>Zon</th>
                    <th>Tahun</th>
                    <th>Tahun Murid</th>
                    <th>Kelas</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.kod_sekolah}</strong>
                        <br />
                        <small>{item.school?.nama_sekolah ?? 'Sekolah belum ditemui'}</small>
                      </td>
                      <td>{zoneLabel(item.school?.zon)}</td>
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
        </section>
      )}
    </>
  );
}
