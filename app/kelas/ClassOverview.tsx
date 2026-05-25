'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ClassRecord, School, StudentRecord } from '@/lib/data';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses, scopeStudents } from '../ui/scopedData';

const years = [1, 2, 3, 4, 5, 6];
const zones = ['BARAT', 'TENGAH', 'TIMUR'];

type ClassWithSchool = ClassRecord & {
  school?: School;
  studentCount: number;
};

type StudentWithClass = StudentRecord & {
  classRecord?: ClassWithSchool;
  school?: School;
};

type ClassFilter = {
  label: string;
  mode?: 'classes' | 'students';
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

function countStudents(items: ClassWithSchool[], filter: Omit<ClassFilter, 'label'>) {
  return items
    .filter((item) => {
      if (filter.zone && item.school?.zon !== filter.zone) return false;
      if (filter.schoolCode && item.kod_sekolah !== filter.schoolCode) return false;
      if (filter.year && item.tahun !== filter.year) return false;
      return true;
    })
    .reduce((total, item) => total + item.studentCount, 0);
}

function listTitle(mode: ClassFilter['mode']) {
  return mode === 'students' ? 'Senarai Murid Terlibat' : 'Senarai Kelas Terlibat';
}

function YearBreakdownCard({
  title,
  subtitle,
  items,
  zone,
  schoolCode,
  onSelect,
}: {
  title: string;
  subtitle: string;
  items: ClassWithSchool[];
  zone?: string;
  schoolCode?: string;
  onSelect: (filter: ClassFilter) => void;
}) {
  return (
    <article className="summary-card">
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      <div className="year-stats">
        {years.map((year) => {
          const filter = { zone, schoolCode, year };
          const classTotal = countClasses(items, filter);
          const studentTotal = countStudents(items, filter);
          return (
            <div className="year-stat" key={year}>
              <span>Tahun {year}</span>
              <button
                type="button"
                onClick={() =>
                  onSelect({
                    ...filter,
                    mode: 'classes',
                    label: `${title} - Kelas Tahun ${year}`,
                  })
                }
              >
                <strong>{classTotal}</strong>
                <small>kelas</small>
              </button>
              <button
                type="button"
                onClick={() =>
                  onSelect({
                    ...filter,
                    mode: 'students',
                    label: `${title} - Murid Tahun ${year}`,
                  })
                }
              >
                <strong>{studentTotal}</strong>
                <small>murid</small>
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
  onSelect,
}: {
  title: string;
  total: number;
  children?: ReactNode;
  onSelect: () => void;
}) {
  return (
    <article className="summary-card summary-card-compact">
      <span>{title}</span>
      <button className="summary-number" type="button" onClick={onSelect}>
        {total}
      </button>
      {children}
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
  const [filter, setFilter] = useState<ClassFilter>({ label: 'Semua kelas', mode: 'classes' });
  const selectFilter = (nextFilter: ClassFilter) => {
    setFilter({ mode: 'classes', ...nextFilter });
    window.setTimeout(() => {
      document.getElementById('senarai-kelas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const schoolByCode = useMemo(() => {
    return new Map(schools.map((school) => [school.kod_sekolah, school]));
  }, [schools]);

  const studentCountByClass = useMemo(() => {
    const counts = new Map<string, number>();
    students.forEach((student) => {
      if (student.class_id && student.status === 'AKTIF') {
        counts.set(student.class_id, (counts.get(student.class_id) ?? 0) + 1);
      }
    });
    return counts;
  }, [students]);

  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);

  const visibleItems = useMemo<ClassWithSchool[]>(() => {
    return scopedClasses.map((item) => ({
      ...item,
      school: schoolByCode.get(item.kod_sekolah),
      studentCount: studentCountByClass.get(item.id) ?? 0,
    }));
  }, [schoolByCode, scopedClasses, studentCountByClass]);

  const classById = useMemo(() => {
    return new Map(visibleItems.map((item) => [item.id, item]));
  }, [visibleItems]);

  const visibleStudents = useMemo<StudentWithClass[]>(() => {
    return scopeStudents(profile, students, classes, schools)
      .filter((student) => student.status === 'AKTIF')
      .map((student) => {
        const classRecord = student.class_id ? classById.get(student.class_id) : undefined;
        return {
          ...student,
          classRecord,
          school: classRecord?.school ?? schoolByCode.get(student.kod_sekolah),
        };
      });
  }, [classById, classes, profile, schoolByCode, schools, students]);

  const filteredItems = visibleItems.filter((item) => {
    if (filter.zone && item.school?.zon !== filter.zone) return false;
    if (filter.schoolCode && item.kod_sekolah !== filter.schoolCode) return false;
    if (filter.year && item.tahun !== filter.year) return false;
    return true;
  });

  const filteredStudents = visibleStudents.filter((student) => {
    if (filter.zone && student.school?.zon !== filter.zone) return false;
    if (filter.schoolCode && student.kod_sekolah !== filter.schoolCode) return false;
    if (filter.year && student.classRecord?.tahun !== filter.year) return false;
    return true;
  });

  const isDistrictView = !profile || profile.role === 'OWNER' || profile.role === 'ADMIN_DAERAH';
  const isZoneView = profile?.role === 'ADMIN_ZON';
  const school = profile?.kod_sekolah ? schoolByCode.get(profile.kod_sekolah) : null;
  const selectedMode = filter.mode ?? 'classes';

  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <h2>Ringkasan Kelas</h2>
          <span>{filter.label}</span>
        </div>

        {isDistrictView && (
          <div className="summary-grid">
            <TotalCard
              title="Jumlah keseluruhan kelas"
              total={visibleItems.length}
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
                subtitle="Jumlah kelas mengikut Tahun 1 hingga 6"
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
              title={`Jumlah kelas ${zoneLabel(profile.zon)}`}
              total={visibleItems.length}
              onSelect={() => selectFilter({ label: zoneLabel(profile.zon), zone: profile.zon ?? undefined })}
            />
            <YearBreakdownCard
              title={zoneLabel(profile.zon)}
              subtitle="Jumlah murid mengikut Tahun 1 hingga 6"
              items={visibleItems}
              zone={profile.zon ?? undefined}
              onSelect={selectFilter}
            />
          </div>
        )}

        {profile?.role === 'ADMIN_SEKOLAH' && (
          <div className="summary-grid summary-grid-zone">
            <TotalCard
              title={`Jumlah kelas ${school?.nama_sekolah ?? profile.kod_sekolah ?? 'sekolah'}`}
              total={visibleItems.length}
              onSelect={() =>
                selectFilter({
                  label: school?.nama_sekolah ?? profile.kod_sekolah ?? 'Sekolah',
                  schoolCode: profile.kod_sekolah ?? undefined,
                })
              }
            />
            <YearBreakdownCard
              title={school?.nama_sekolah ?? profile.kod_sekolah ?? 'Sekolah'}
              subtitle="Jumlah kelas dan murid mengikut Tahun 1 hingga 6"
              items={visibleItems}
              schoolCode={profile.kod_sekolah ?? undefined}
              onSelect={selectFilter}
            />
          </div>
        )}
      </section>

      <section className="panel" id="senarai-kelas">
        <div className="panel-head">
          <h2>{listTitle(selectedMode)}</h2>
          <span>
            {selectedMode === 'students'
              ? `${filteredStudents.length} / ${visibleStudents.length} rekod`
              : `${filteredItems.length} / ${visibleItems.length} rekod`}
          </span>
        </div>

        {selectedMode === 'students' ? (
          filteredStudents.length === 0 ? (
            <p className="empty">Tiada murid untuk pilihan ini.</p>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Sekolah</th>
                    <th>Zon</th>
                    <th>Tahun Murid</th>
                    <th>Kelas</th>
                    <th>MyKid</th>
                    <th>Nama Murid</th>
                    <th>Jantina</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <strong>{student.kod_sekolah}</strong>
                        <br />
                        <small>{student.school?.nama_sekolah ?? 'Sekolah belum ditemui'}</small>
                      </td>
                      <td>{zoneLabel(student.school?.zon)}</td>
                      <td>{student.classRecord ? `Tahun ${student.classRecord.tahun}` : '-'}</td>
                      <td>{student.classRecord?.nama_kelas ?? 'Tiada kelas'}</td>
                      <td>{student.mykid}</td>
                      <td>{student.nama_murid}</td>
                      <td>{student.jantina ?? '-'}</td>
                      <td>{student.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : filteredItems.length === 0 ? (
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
                  <th>Murid</th>
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
                    <td>{item.studentCount}</td>
                    <td>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
