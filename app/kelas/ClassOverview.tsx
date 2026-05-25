'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ClassRecord, School, StudentRecord } from '@/lib/data';
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
  mode?: 'classes' | 'schoolSummary' | 'schoolClassDetail';
  zone?: string;
  schoolCode?: string;
  year?: number;
};

type SchoolClassSummary = {
  kod_sekolah: string;
  nama_sekolah: string;
  years: Record<number, number>;
  total: number;
  maleStudents: number;
  femaleStudents: number;
  totalStudents: number;
};

type SchoolClassDetail = ClassWithSchool & {
  maleStudents: number;
  femaleStudents: number;
  totalStudents: number;
};

type YearClassGroup = {
  year: number;
  classes: SchoolClassDetail[];
  maleStudents: number;
  femaleStudents: number;
  totalStudents: number;
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

function detailTitle(filter: ClassFilter, profileRole: string | undefined, schoolName?: string) {
  const currentYear = new Date().getFullYear();

  if (filter.mode === 'schoolSummary') {
    if (filter.zone && filter.year) return `Senarai Kelas ${zoneLabel(filter.zone)} - Tahun ${filter.year} ${currentYear}`;
    if (filter.zone) return `Ringkasan Kelas ${zoneLabel(filter.zone)} ${currentYear}`;
    if (filter.schoolCode) return `Ringkasan Kelas ${schoolName ?? filter.schoolCode} ${currentYear}`;
    if (profileRole === 'ADMIN_ZON') return `Ringkasan Kelas Zon ${currentYear}`;
    if (profileRole === 'ADMIN_SEKOLAH') return `Ringkasan Kelas Sekolah ${currentYear}`;
    return `Ringkasan Kelas Daerah Gombak ${currentYear}`;
  }

  if (filter.mode === 'schoolClassDetail' && filter.schoolCode) {
    return `Senarai Kelas ${filter.schoolCode} - ${schoolName ?? filter.schoolCode} ${currentYear}`;
  }

  if (filter.year && filter.zone) return `Senarai Kelas ${zoneLabel(filter.zone)} Tahun ${filter.year} ${currentYear}`;
  if (filter.year && filter.schoolCode) {
    return `Senarai Kelas ${schoolName ?? filter.schoolCode} Tahun ${filter.year} ${currentYear}`;
  }
  if (filter.zone) return `Senarai Kelas ${zoneLabel(filter.zone)} ${currentYear}`;
  if (filter.schoolCode) return `Senarai Kelas ${schoolName ?? filter.schoolCode} ${currentYear}`;
  return `Senarai Kelas ${currentYear}`;
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
                    mode: 'schoolSummary',
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
  students,
}: {
  schools: School[];
  classes: ClassRecord[];
  students: StudentRecord[];
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

  const studentCountsByClass = useMemo(() => {
    const counts = new Map<string, { maleStudents: number; femaleStudents: number; totalStudents: number }>();

    students.forEach((student) => {
      if (!student.class_id || student.status !== 'AKTIF') return;
      const current = counts.get(student.class_id) ?? {
        maleStudents: 0,
        femaleStudents: 0,
        totalStudents: 0,
      };

      if (student.jantina === 'L') current.maleStudents += 1;
      if (student.jantina === 'P') current.femaleStudents += 1;
      current.totalStudents += 1;
      counts.set(student.class_id, current);
    });

    return counts;
  }, [students]);

  const schoolClassDetails = useMemo<SchoolClassDetail[]>(() => {
    return filteredItems
      .map((item) => {
        const counts = studentCountsByClass.get(item.id) ?? {
          maleStudents: 0,
          femaleStudents: 0,
          totalStudents: 0,
        };

        return {
          ...item,
          ...counts,
        };
      })
      .sort((a, b) => a.tahun - b.tahun || a.nama_kelas.localeCompare(b.nama_kelas));
  }, [filteredItems, studentCountsByClass]);

  const yearClassGroups = useMemo<YearClassGroup[]>(() => {
    return years
      .map((year) => {
        const yearClasses = schoolClassDetails.filter((item) => item.tahun === year);
        return {
          year,
          classes: yearClasses,
          maleStudents: yearClasses.reduce((total, item) => total + item.maleStudents, 0),
          femaleStudents: yearClasses.reduce((total, item) => total + item.femaleStudents, 0),
          totalStudents: yearClasses.reduce((total, item) => total + item.totalStudents, 0),
        };
      })
      .filter((group) => group.classes.length > 0);
  }, [schoolClassDetails]);

  const schoolSummaries = useMemo<SchoolClassSummary[]>(() => {
    const summaries = new Map<string, SchoolClassSummary>();

    visibleItems.forEach((item) => {
      if (filter?.zone && item.school?.zon !== filter.zone) return;
      if (filter?.schoolCode && item.kod_sekolah !== filter.schoolCode) return;
      if (filter?.year && item.tahun !== filter.year) return;

      const current =
        summaries.get(item.kod_sekolah) ??
        {
          kod_sekolah: item.kod_sekolah,
          nama_sekolah: item.school?.nama_sekolah ?? 'Sekolah belum ditemui',
          years: {},
          total: 0,
          maleStudents: 0,
          femaleStudents: 0,
          totalStudents: 0,
        };
      const studentCounts = studentCountsByClass.get(item.id) ?? {
        maleStudents: 0,
        femaleStudents: 0,
        totalStudents: 0,
      };

      current.years[item.tahun] = (current.years[item.tahun] ?? 0) + 1;
      current.total += 1;
      current.maleStudents += studentCounts.maleStudents;
      current.femaleStudents += studentCounts.femaleStudents;
      current.totalStudents += studentCounts.totalStudents;
      summaries.set(item.kod_sekolah, current);
    });

    return [...summaries.values()].sort((a, b) => a.kod_sekolah.localeCompare(b.kod_sekolah));
  }, [filter?.schoolCode, filter?.year, filter?.zone, studentCountsByClass, visibleItems]);

  const schoolSummaryTotals = schoolSummaries.reduce(
    (total, item) => ({
      classes: total.classes + item.total,
      maleStudents: total.maleStudents + item.maleStudents,
      femaleStudents: total.femaleStudents + item.femaleStudents,
      totalStudents: total.totalStudents + item.totalStudents,
    }),
    { classes: 0, maleStudents: 0, femaleStudents: 0, totalStudents: 0 },
  );

  const isDistrictView = !profile || profile.role === 'OWNER' || profile.role === 'ADMIN_DAERAH';
  const isZoneView = profile?.role === 'ADMIN_ZON';
  const school = profile?.kod_sekolah ? schoolByCode.get(profile.kod_sekolah) : null;
  const selectedSchool = filter?.schoolCode ? schoolByCode.get(filter.schoolCode) : school;
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
              onSelect={() => selectFilter({ label: 'Ringkasan kelas mengikut sekolah', mode: 'schoolSummary' })}
            >
              <div className="zone-mini-list">
                {zones.map((zone) => (
                  <button
                    type="button"
                    key={zone}
                    onClick={() =>
                      selectFilter({
                        label: `Ringkasan kelas ${zoneLabel(zone)}`,
                        mode: 'schoolSummary',
                        zone,
                      })
                    }
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
              onSelect={() =>
                selectFilter({
                  label: `Ringkasan kelas ${zoneLabel(profile.zon)}`,
                  mode: 'schoolSummary',
                  zone: profile.zon ?? undefined,
                })
              }
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
                  label: `Ringkasan kelas ${school?.nama_sekolah ?? profile.kod_sekolah ?? 'Sekolah'}`,
                  mode: 'schoolSummary',
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
            <h2>{detailTitle(filter, profile?.role, selectedSchool?.nama_sekolah)}</h2>
            <span>
              {filter.mode === 'schoolSummary'
                ? `${schoolSummaries.length} sekolah`
                : filter.mode === 'schoolClassDetail'
                  ? `${schoolClassDetails.length} kelas`
                : `${filteredItems.length} / ${visibleItems.length} rekod`}
            </span>
          </div>

          {filter.mode === 'schoolSummary' ? (
            schoolSummaries.length === 0 ? (
              <p className="empty">Tiada rekod kelas untuk pilihan ini.</p>
            ) : filter.year ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Bil</th>
                      <th>Kod Sekolah</th>
                      <th>Nama Sekolah</th>
                      <th>Bilangan Kelas</th>
                      <th>Murid Lelaki</th>
                      <th>Murid Perempuan</th>
                      <th>Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schoolSummaries.map((item, index) => (
                      <tr key={item.kod_sekolah}>
                        <td>{index + 1}</td>
                        <td>{item.kod_sekolah}</td>
                        <td>{item.nama_sekolah}</td>
                        <td>
                          <button
                            className="table-number-button"
                            type="button"
                            onClick={() =>
                              selectFilter({
                                label: `Senarai kelas ${item.nama_sekolah}`,
                                mode: 'schoolClassDetail',
                                schoolCode: item.kod_sekolah,
                                year: filter.year,
                              })
                            }
                          >
                            {item.total}
                          </button>
                        </td>
                        <td>{item.maleStudents}</td>
                        <td>{item.femaleStudents}</td>
                        <td>
                          <strong>{item.totalStudents}</strong>
                        </td>
                      </tr>
                    ))}
                    <tr className="class-year-total-row">
                      <td colSpan={3}>Jumlah Keseluruhan</td>
                      <td>{schoolSummaryTotals.classes}</td>
                      <td>{schoolSummaryTotals.maleStudents}</td>
                      <td>{schoolSummaryTotals.femaleStudents}</td>
                      <td>{schoolSummaryTotals.totalStudents}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Bil</th>
                      <th>Kod Sekolah</th>
                      <th>Nama Sekolah</th>
                      {years.map((year) => (
                        <th key={year}>Tahun {year}</th>
                      ))}
                      <th>Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schoolSummaries.map((item, index) => (
                      <tr key={item.kod_sekolah}>
                        <td>{index + 1}</td>
                        <td>{item.kod_sekolah}</td>
                        <td>{item.nama_sekolah}</td>
                        {years.map((year) => (
                          <td key={year}>{item.years[year] ?? 0}</td>
                        ))}
                        <td>
                          <button
                            className="table-number-button"
                            type="button"
                            onClick={() =>
                              selectFilter({
                                label: `Senarai kelas ${item.nama_sekolah}`,
                                mode: 'schoolClassDetail',
                                schoolCode: item.kod_sekolah,
                              })
                            }
                          >
                            {item.total}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : filter.mode === 'schoolClassDetail' ? (
            schoolClassDetails.length === 0 ? (
              <p className="empty">Tiada kelas untuk sekolah ini.</p>
            ) : (
              <div className="class-year-list">
                {yearClassGroups.map((group) => (
                  <div className="class-year-block" key={group.year}>
                    <div className="table-scroll">
                      <table className="class-year-table">
                        <thead>
                          <tr>
                            <th>Bil</th>
                            <th>Tahun {group.year}</th>
                            <th>Lelaki</th>
                            <th>Perempuan</th>
                            <th>Jumlah</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.classes.map((item, index) => (
                            <tr key={item.id}>
                              <td>{index + 1}</td>
                              <td>{item.nama_kelas}</td>
                              <td>{item.maleStudents}</td>
                              <td>{item.femaleStudents}</td>
                              <td>{item.totalStudents}</td>
                            </tr>
                          ))}
                          <tr className="class-year-total-row">
                            <td colSpan={2}>Jumlah Tahun {group.year}</td>
                            <td>{group.maleStudents}</td>
                            <td>{group.femaleStudents}</td>
                            <td>{group.totalStudents}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : filteredItems.length === 0 ? (
          <p className="empty">Tiada kelas untuk pilihan ini.</p>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Bil</th>
                    <th>Sekolah</th>
                    <th>Zon</th>
                    <th>Tahun</th>
                    <th>Tahun Murid</th>
                    <th>Kelas</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
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
