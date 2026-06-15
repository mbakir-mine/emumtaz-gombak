'use client';

import { useActionState, useMemo, useState } from 'react';
import type { School, TakwimEvent } from '@/lib/data';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeSchools } from '../ui/scopedData';
import { saveTakwimEvent, type TakwimActionState } from './actions';

const initialState: TakwimActionState = { ok: false, message: '' };

const monthNames = [
  'Januari',
  'Februari',
  'Mac',
  'April',
  'Mei',
  'Jun',
  'Julai',
  'Ogos',
  'September',
  'Oktober',
  'November',
  'Disember',
];

const weekdayLabels = ['Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab', 'Ahd'];

const categories = [
  { value: 'HARI_PERSEKOLAHAN', label: 'Hari Persekolahan', color: '#0f9f64' },
  { value: 'CUTI', label: 'Cuti', color: '#f59e0b' },
  { value: 'PEPERIKSAAN', label: 'Peperiksaan', color: '#2563eb' },
  { value: 'PROGRAM', label: 'Program', color: '#7c3aed' },
  { value: 'AKTIVITI', label: 'Aktiviti', color: '#0891b2' },
  { value: 'MESYUARAT', label: 'Mesyuarat', color: '#64748b' },
  { value: 'LAIN', label: 'Lain-lain', color: '#08703a' },
];

function isoDate(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function todayParts() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    monthIndex: now.getMonth(),
  };
}

function buildMonthCells(year: number, monthIndex: number) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const mondayOffset = (firstDay + 6) % 7;
  const blanks = Array.from({ length: mondayOffset }, (_, index) => ({ key: `blank-${index}` }));
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    return {
      day,
      iso: isoDate(year, monthIndex, day),
    };
  });

  return { blanks, days };
}

function categoryLabel(value: string) {
  return categories.find((item) => item.value === value)?.label ?? value;
}

function schoolLabel(school?: School | null) {
  if (!school) return 'Takwim Daerah Gombak';
  return `${school.kod_sekolah} - ${school.nama_sekolah}`;
}

function eventInDay(event: TakwimEvent, iso: string) {
  return event.tarikh_mula <= iso && event.tarikh_tamat >= iso;
}

function eventRangeLabel(event: TakwimEvent) {
  if (event.tarikh_mula === event.tarikh_tamat) return event.tarikh_mula;
  return `${event.tarikh_mula} hingga ${event.tarikh_tamat}`;
}

export default function TakwimManager({
  schools,
  events,
}: {
  schools: School[];
  events: TakwimEvent[];
}) {
  const profile = useAccessProfile();
  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const now = todayParts();
  const [year, setYear] = useState(now.year);
  const [monthIndex, setMonthIndex] = useState(now.monthIndex);
  const [selectedSchool, setSelectedSchool] = useState(profile?.kod_sekolah ?? scopedSchools[0]?.kod_sekolah ?? '');
  const [state, action] = useActionState(saveTakwimEvent, initialState);
  const canManage = profile?.role === 'OWNER' || profile?.role === 'ADMIN_SEKOLAH';
  const selectedSchoolRecord = scopedSchools.find((school) => school.kod_sekolah === selectedSchool) ?? null;
  const monthCells = useMemo(() => buildMonthCells(year, monthIndex), [monthIndex, year]);
  const visibleEvents = useMemo(
    () =>
      events
        .filter((event) => event.tahun_akademik === year)
        .filter((event) => event.scope === 'DAERAH' || event.kod_sekolah === selectedSchool)
        .sort((a, b) => a.tarikh_mula.localeCompare(b.tarikh_mula)),
    [events, selectedSchool, year],
  );
  const monthEvents = visibleEvents.filter((event) => {
    const firstIso = isoDate(year, monthIndex, 1);
    const lastIso = isoDate(year, monthIndex, new Date(year, monthIndex + 1, 0).getDate());
    return event.tarikh_mula <= lastIso && event.tarikh_tamat >= firstIso;
  });
  const summary = {
    total: visibleEvents.length,
    cuti: visibleEvents.filter((event) => event.kategori === 'CUTI').length,
    peperiksaan: visibleEvents.filter((event) => event.kategori === 'PEPERIKSAAN').length,
    program: visibleEvents.filter((event) => ['PROGRAM', 'AKTIVITI', 'MESYUARAT'].includes(event.kategori)).length,
  };

  function changeMonth(offset: number) {
    const next = new Date(year, monthIndex + offset, 1);
    setYear(next.getFullYear());
    setMonthIndex(next.getMonth());
  }

  return (
    <section className="panel optional-module-panel takwim-panel">
      <div className="panel-head">
        <div>
          <h2>Takwim Akademik {year}</h2>
          <p className="table-note">Rujukan bersama untuk cuti, peperiksaan, program, kehadiran, jadual waktu dan RPH.</p>
        </div>
        <span>{visibleEvents.length} rekod takwim</span>
      </div>

      <div className="takwim-scope-bar">
        <label>
          Tahun Akademik
          <input type="number" min="2020" max="2040" value={year} onChange={(event) => setYear(Number(event.target.value) || now.year)} />
        </label>
        <label>
          Paparan Sekolah
          <select
            value={selectedSchool}
            onChange={(event) => setSelectedSchool(event.target.value)}
            disabled={profile?.role !== 'OWNER'}
          >
            {scopedSchools.map((school) => (
              <option key={school.kod_sekolah} value={school.kod_sekolah}>
                {schoolLabel(school)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="takwim-summary">
        <article>
          <span>Jumlah Acara</span>
          <strong>{summary.total}</strong>
        </article>
        <article>
          <span>Cuti</span>
          <strong>{summary.cuti}</strong>
        </article>
        <article>
          <span>Peperiksaan</span>
          <strong>{summary.peperiksaan}</strong>
        </article>
        <article>
          <span>Program/Aktiviti</span>
          <strong>{summary.program}</strong>
        </article>
      </div>

      {canManage && (
        <form action={action} className="takwim-form">
          <div className="panel-head compact-head">
            <div>
              <h3>Tambah Rekod Takwim</h3>
              <p className="table-note">Pilih Takwim Daerah untuk acara umum, atau pilih sekolah untuk acara sekolah tertentu.</p>
            </div>
          </div>
          <input type="hidden" name="tahun_akademik" value={year} />
          <label>
            Skop
            {profile?.role === 'OWNER' ? (
              <select name="kod_sekolah" defaultValue={selectedSchool}>
                <option value="">Takwim Daerah Gombak</option>
                {scopedSchools.map((school) => (
                  <option key={school.kod_sekolah} value={school.kod_sekolah}>
                    {schoolLabel(school)}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input value={schoolLabel(selectedSchoolRecord)} readOnly />
                <input type="hidden" name="kod_sekolah" value={profile?.kod_sekolah ?? selectedSchool} />
              </>
            )}
          </label>
          <label>
            Kategori
            <select name="kategori" defaultValue="CUTI">
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tajuk
            <input name="tajuk" placeholder="Contoh: Cuti Peristiwa, UPSA, Hari Sukan" />
          </label>
          <label>
            Tarikh Mula
            <input name="tarikh_mula" type="date" defaultValue={isoDate(year, monthIndex, 1)} />
          </label>
          <label>
            Tarikh Tamat
            <input name="tarikh_tamat" type="date" defaultValue={isoDate(year, monthIndex, 1)} />
          </label>
          <label>
            Warna
            <select name="warna" defaultValue="#08703a">
              {categories.map((category) => (
                <option key={category.value} value={category.color}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label className="module-wide-field">
            Catatan
            <input name="keterangan" placeholder="Catatan ringkas untuk rujukan sekolah" />
          </label>
          <button className="button" type="submit">
            SIMPAN TAKWIM
          </button>
          {state.message && <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>}
        </form>
      )}

      <div className="takwim-month-card">
        <div className="attendance-month-head">
          <button className="button soft" type="button" onClick={() => changeMonth(-1)}>
            BULAN SEBELUM
          </button>
          <div>
            <h3>
              {monthNames[monthIndex]} {year}
            </h3>
            <p>{schoolLabel(selectedSchoolRecord)}</p>
          </div>
          <button className="button soft" type="button" onClick={() => changeMonth(1)}>
            BULAN SETERUSNYA
          </button>
        </div>

        <div className="takwim-weekdays">
          {weekdayLabels.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="takwim-grid">
          {monthCells.blanks.map((blank) => (
            <div className="takwim-day takwim-day-empty" key={blank.key} />
          ))}
          {monthCells.days.map((day) => {
            const dayEvents = monthEvents.filter((event) => eventInDay(event, day.iso));
            return (
              <div className={dayEvents.length > 0 ? 'takwim-day takwim-day-filled' : 'takwim-day'} key={day.iso}>
                <strong>{day.day}</strong>
                {dayEvents.slice(0, 3).map((event) => (
                  <span className="takwim-event-pill" style={{ borderLeftColor: event.warna ?? '#08703a' }} key={event.id}>
                    {event.tajuk}
                  </span>
                ))}
                {dayEvents.length > 3 && <em>+{dayEvents.length - 3} lagi</em>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="takwim-impact-grid">
        <article>
          <strong>Kehadiran</strong>
          <span>Cuti dan aktiviti boleh menjadi rujukan rekod harian.</span>
        </article>
        <article>
          <strong>Jadual Waktu</strong>
          <span>Hari cuti/program boleh dikecualikan daripada jadual berjalan.</span>
        </article>
        <article>
          <strong>RPH AI</strong>
          <span>RPH boleh merujuk minggu, aktiviti dan cuti sebenar sekolah.</span>
        </article>
        <article>
          <strong>Peperiksaan</strong>
          <span>UPSA/UASA boleh diselaraskan dengan tarikh buka dan tutup markah.</span>
        </article>
      </div>

      <div className="panel-head takwim-list-head">
        <div>
          <h3>Senarai Rekod Takwim</h3>
          <p className="table-note">Paparan disusun mengikut tarikh mula.</p>
        </div>
        <span>{visibleEvents.length} rekod</span>
      </div>
      {visibleEvents.length === 0 ? (
        <p className="empty">Belum ada rekod takwim untuk paparan ini.</p>
      ) : (
        <div className="table-scroll">
          <table className="compact-table takwim-table">
            <thead>
              <tr>
                <th>Bil</th>
                <th>Tarikh</th>
                <th>Kategori</th>
                <th>Tajuk</th>
                <th>Skop</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {visibleEvents.map((event, index) => {
                const school = schools.find((item) => item.kod_sekolah === event.kod_sekolah);
                return (
                  <tr key={event.id}>
                    <td>{index + 1}</td>
                    <td>{eventRangeLabel(event)}</td>
                    <td>
                      <span className="takwim-category-dot" style={{ backgroundColor: event.warna ?? '#08703a' }} />
                      {categoryLabel(event.kategori)}
                    </td>
                    <td>
                      <strong>{event.tajuk}</strong>
                    </td>
                    <td>{event.scope === 'DAERAH' ? 'Daerah Gombak' : schoolLabel(school)}</td>
                    <td>{event.keterangan || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
