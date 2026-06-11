'use client';

import { useActionState, useMemo, useState } from 'react';
import type { AttendanceRecord, ClassRecord, School, StudentRecord } from '@/lib/data';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses, scopeSchools, scopeStudents } from '../ui/scopedData';
import { saveDailyAttendance, type AttendanceActionState } from './actions';

const initialState: AttendanceActionState = { ok: false, message: '' };
const statusOptions = [
  { value: 'HADIR', label: 'Hadir' },
  { value: 'TIDAK_HADIR', label: 'Tidak Hadir' },
  { value: 'SAKIT', label: 'Sakit' },
  { value: 'CUTI', label: 'Cuti' },
  { value: 'LEWAT', label: 'Lewat' },
  { value: 'AKTIVITI', label: 'Aktiviti' },
];
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
const dayNames = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
const dayShort = ['Aha', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function classLabel(item: ClassRecord) {
  return `Tahun ${item.tahun} - ${item.nama_kelas}`;
}

function isoDate(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function dateParts(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return { year, monthIndex: month - 1, day };
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function monthDates(year: number, monthIndex: number) {
  return Array.from({ length: daysInMonth(year, monthIndex) }, (_, index) => {
    const day = index + 1;
    const date = new Date(year, monthIndex, day);
    return {
      day,
      iso: isoDate(year, monthIndex, day),
      dayIndex: date.getDay(),
    };
  });
}

function statusShort(status?: string | null) {
  if (!status) return '';
  const labels: Record<string, string> = {
    HADIR: '',
    TIDAK_HADIR: 'TH',
    SAKIT: 'S',
    CUTI: 'C',
    LEWAT: 'L',
    AKTIVITI: 'A',
  };
  return labels[status] ?? '';
}

function statusTitle(status?: string | null) {
  if (!status) return 'Belum ditanda';
  const labels: Record<string, string> = {
    HADIR: 'Hadir',
    TIDAK_HADIR: 'Tidak Hadir',
    SAKIT: 'Sakit',
    CUTI: 'Cuti',
    LEWAT: 'Lewat',
    AKTIVITI: 'Aktiviti',
  };
  return labels[status] ?? status;
}

function statusClass(status?: string | null) {
  return `attendance-status attendance-${(status || 'EMPTY').toLowerCase().replaceAll('_', '-')}`;
}

function recordSummary(records: AttendanceRecord[]) {
  return records.reduce(
    (total, record) => {
      if (record.status === 'HADIR') total.hadir += 1;
      if (record.status === 'TIDAK_HADIR') total.tidakHadir += 1;
      if (record.status === 'LEWAT') total.lewat += 1;
      if (record.status === 'SAKIT') total.sakit += 1;
      if (record.status === 'CUTI') total.cuti += 1;
      if (record.status === 'AKTIVITI') total.aktiviti += 1;
      return total;
    },
    { hadir: 0, tidakHadir: 0, lewat: 0, sakit: 0, cuti: 0, aktiviti: 0 },
  );
}

function buildYearCalendar(year: number, studentRecords: AttendanceRecord[]) {
  const recordByDate = new Map(studentRecords.map((record) => [record.attendance_date, record]));

  return monthNames.map((monthName, monthIndex) => {
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const blanks = Array.from({ length: firstDay }, (_, index) => ({ key: `blank-${index}` }));
    const dates = monthDates(year, monthIndex).map((date) => ({
      ...date,
      record: recordByDate.get(date.iso) ?? null,
    }));
    return { monthName, blanks, dates };
  });
}

export default function AttendanceManager({
  schools,
  classes,
  students,
  records,
}: {
  schools: School[];
  classes: ClassRecord[];
  students: StudentRecord[];
  records: AttendanceRecord[];
}) {
  const profile = useAccessProfile();
  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const scopedStudents = useMemo(() => scopeStudents(profile, students, classes, schools), [classes, profile, schools, students]);
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const { year, monthIndex } = dateParts(selectedDate);
  const [selectedSchool, setSelectedSchool] = useState(profile?.kod_sekolah ?? scopedSchools[0]?.kod_sekolah ?? '');
  const schoolClasses = useMemo(
    () => scopedClasses.filter((item) => item.kod_sekolah === selectedSchool),
    [scopedClasses, selectedSchool],
  );
  const [selectedClass, setSelectedClass] = useState(schoolClasses[0]?.id ?? '');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const activeClass = schoolClasses.find((item) => item.id === selectedClass) ?? null;
  const activeSchool = scopedSchools.find((school) => school.kod_sekolah === selectedSchool) ?? null;
  const classStudents = useMemo(
    () =>
      scopedStudents
        .filter((student) => student.class_id === selectedClass && student.status === 'AKTIF')
        .sort((a, b) => a.nama_murid.localeCompare(b.nama_murid)),
    [scopedStudents, selectedClass],
  );
  const selectedStudent = classStudents.find((student) => student.id === selectedStudentId) ?? null;
  const monthDays = useMemo(() => monthDates(year, monthIndex), [monthIndex, year]);
  const classRecords = records.filter((record) => record.class_id === selectedClass);
  const currentMonthRecords = classRecords.filter((record) => {
    const parts = dateParts(record.attendance_date);
    return parts.year === year && parts.monthIndex === monthIndex;
  });
  const recordMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    records
      .filter((record) => record.attendance_date === selectedDate)
      .forEach((record) => map.set(record.student_id, record));
    return map;
  }, [records, selectedDate]);
  const monthlyRecordMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    currentMonthRecords.forEach((record) => map.set(`${record.student_id}|${record.attendance_date}`, record));
    return map;
  }, [currentMonthRecords]);
  const selectedStudentRecords = selectedStudent
    ? records.filter((record) => record.student_id === selectedStudent.id && dateParts(record.attendance_date).year === year)
    : [];
  const selectedStudentSummary = recordSummary(selectedStudentRecords);
  const selectedStudentCalendar = selectedStudent ? buildYearCalendar(year, selectedStudentRecords) : [];
  const monthSummary = recordSummary(currentMonthRecords);
  const [state, action] = useActionState(saveDailyAttendance, initialState);

  function changeMonth(offset: number) {
    const next = new Date(year, monthIndex + offset, 1);
    setSelectedDate(isoDate(next.getFullYear(), next.getMonth(), 1));
  }

  return (
    <section className="panel optional-module-panel attendance-panel">
      <div className="panel-head">
        <div>
          <h2>Kehadiran Harian</h2>
          <p className="table-note">Paparan bulanan kelas dan laporan individu murid.</p>
        </div>
        <span>{classStudents.length} murid</span>
      </div>

      <div className="module-toolbar attendance-toolbar">
        <label>
          Tarikh
          <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        </label>
        <label>
          Sekolah
          <select
            value={selectedSchool}
            onChange={(event) => {
              const kodSekolah = event.target.value;
              const nextClass = scopedClasses.find((item) => item.kod_sekolah === kodSekolah)?.id ?? '';
              setSelectedSchool(kodSekolah);
              setSelectedClass(nextClass);
              setSelectedStudentId('');
            }}
            disabled={profile?.role === 'ADMIN_SEKOLAH' || profile?.role === 'GURU_KELAS' || profile?.role === 'GURU_SUBJEK'}
          >
            {scopedSchools.map((school) => (
              <option key={school.kod_sekolah} value={school.kod_sekolah}>
                {school.kod_sekolah} - {school.nama_sekolah}
              </option>
            ))}
          </select>
        </label>
        <label>
          Kelas
          <select
            value={selectedClass}
            onChange={(event) => {
              setSelectedClass(event.target.value);
              setSelectedStudentId('');
            }}
          >
            <option value="">Pilih kelas</option>
            {schoolClasses.map((item) => (
              <option key={item.id} value={item.id}>
                {classLabel(item)} ({item.tahun_akademik})
              </option>
            ))}
          </select>
        </label>
      </div>

      {!activeClass ? (
        <p className="empty">Pilih kelas untuk menanda kehadiran.</p>
      ) : classStudents.length === 0 ? (
        <p className="empty">Tiada murid aktif dalam kelas ini.</p>
      ) : (
        <>
          <div className="attendance-month-head">
            <button className="button soft" type="button" onClick={() => changeMonth(-1)}>
              BULAN SEBELUM
            </button>
            <div>
              <h3>
                {monthNames[monthIndex]} {year}
              </h3>
              <p>
                {activeSchool?.nama_sekolah ?? selectedSchool} · {classLabel(activeClass)}
              </p>
            </div>
            <button className="button soft" type="button" onClick={() => changeMonth(1)}>
              BULAN SETERUSNYA
            </button>
          </div>

          <div className="attendance-legend">
            <span><i className="attendance-hadir" /> Hadir</span>
            <span><i className="attendance-tidak-hadir" /> Tidak Hadir</span>
            <span><i className="attendance-lewat" /> Lewat</span>
            <span><i className="attendance-sakit" /> Sakit</span>
            <span><i className="attendance-cuti" /> Cuti</span>
            <span><i className="attendance-aktiviti" /> Aktiviti</span>
          </div>

          <div className="table-scroll attendance-matrix-wrap">
            <table className="attendance-matrix">
              <thead>
                <tr>
                  <th rowSpan={2}>Bil</th>
                  <th rowSpan={2}>L/P</th>
                  <th rowSpan={2}>Nama Murid</th>
                  {monthDays.map((date) => (
                    <th className={`attendance-day-head day-${date.dayIndex}`} key={date.iso}>
                      <button type="button" onClick={() => setSelectedDate(date.iso)}>
                        <strong>{date.day}</strong>
                        <small>{dayShort[date.dayIndex]}</small>
                      </button>
                    </th>
                  ))}
                  <th colSpan={4}>Rumusan</th>
                </tr>
                <tr>
                  {monthDays.map((date) => (
                    <th className={`attendance-day-sub day-${date.dayIndex}`} key={`${date.iso}-sub`}>
                      {selectedDate === date.iso ? 'Dipilih' : ''}
                    </th>
                  ))}
                  <th>Lewat</th>
                  <th>Sakit/Cuti</th>
                  <th>Tidak Hadir</th>
                  <th>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((student, index) => {
                  const studentMonthRecords = currentMonthRecords.filter((record) => record.student_id === student.id);
                  const summary = recordSummary(studentMonthRecords);
                  return (
                    <tr className={selectedStudentId === student.id ? 'selected-attendance-row' : undefined} key={student.id}>
                      <td>{index + 1}</td>
                      <td>{student.jantina ?? '-'}</td>
                      <td className="attendance-student-name">
                        <button type="button" onClick={() => setSelectedStudentId(student.id)}>
                          {student.nama_murid}
                        </button>
                      </td>
                      {monthDays.map((date) => {
                        const record = monthlyRecordMap.get(`${student.id}|${date.iso}`);
                        return (
                          <td className={statusClass(record?.status)} key={`${student.id}-${date.iso}`} title={statusTitle(record?.status)}>
                            {statusShort(record?.status)}
                          </td>
                        );
                      })}
                      <td className="numeric-cell">{summary.lewat}</td>
                      <td className="numeric-cell">{summary.sakit + summary.cuti}</td>
                      <td className="numeric-cell">{summary.tidakHadir}</td>
                      <td className="numeric-cell">{summary.lewat + summary.sakit + summary.cuti + summary.tidakHadir}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}>Rumusan Bulan</td>
                  <td colSpan={monthDays.length}>
                    Hadir: <strong>{monthSummary.hadir}</strong> · Lewat: <strong>{monthSummary.lewat}</strong> · Tidak Hadir:{' '}
                    <strong>{monthSummary.tidakHadir}</strong>
                  </td>
                  <td className="numeric-cell">{monthSummary.lewat}</td>
                  <td className="numeric-cell">{monthSummary.sakit + monthSummary.cuti}</td>
                  <td className="numeric-cell">{monthSummary.tidakHadir}</td>
                  <td className="numeric-cell">{monthSummary.lewat + monthSummary.sakit + monthSummary.cuti + monthSummary.tidakHadir}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <form action={action} className="attendance-daily-form">
            <input type="hidden" name="attendance_date" value={selectedDate} />
            <div className="panel-head compact-head">
              <div>
                <h3>Kemaskini Kehadiran {selectedDate}</h3>
                <p className="table-note">Gunakan bahagian ini untuk menyimpan kehadiran harian kelas.</p>
              </div>
              <div className="module-table-actions">
                <button
                  className="button soft"
                  type="button"
                  onClick={(event) => {
                    const form = event.currentTarget.closest('form');
                    form?.querySelectorAll<HTMLSelectElement>('select[data-attendance-status]').forEach((select) => {
                      select.value = 'HADIR';
                    });
                  }}
                >
                  TANDA SEMUA HADIR
                </button>
                <button className="button" type="submit">
                  SIMPAN KEHADIRAN
                </button>
              </div>
            </div>
            {state.message && <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>}
            <div className="table-scroll">
              <table className="compact-table attendance-edit-table">
                <thead>
                  <tr>
                    <th>Bil</th>
                    <th>Nama Murid</th>
                    <th>Jantina</th>
                    <th>Status</th>
                    <th>Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudents.map((student, index) => {
                    const record = recordMap.get(student.id);
                    return (
                      <tr key={student.id}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{student.nama_murid}</strong>
                          <input type="hidden" name="student_id" value={student.id} />
                        </td>
                        <td>{student.jantina === 'P' ? 'Perempuan' : 'Lelaki'}</td>
                        <td>
                          <select name={`status_${student.id}`} defaultValue={record?.status ?? 'HADIR'} data-attendance-status>
                            {statusOptions.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input name={`catatan_${student.id}`} defaultValue={record?.catatan ?? ''} placeholder="Catatan ringkas" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </form>

          {selectedStudent && (
            <section className="attendance-student-report">
              <div className="panel-head">
                <div>
                  <h2>Laporan Kehadiran Pelajar</h2>
                  <p className="table-note">
                    {selectedStudent.nama_murid} · {classLabel(activeClass)} · {year}
                  </p>
                </div>
                <button className="button soft" type="button" onClick={() => setSelectedStudentId('')}>
                  TUTUP LAPORAN
                </button>
              </div>
              <div className="attendance-student-summary">
                <span>Jumlah Rekod <strong>{selectedStudentRecords.length}</strong></span>
                <span>Hadir <strong>{selectedStudentSummary.hadir}</strong></span>
                <span>Tidak Hadir <strong>{selectedStudentSummary.tidakHadir}</strong></span>
                <span>Lewat <strong>{selectedStudentSummary.lewat}</strong></span>
              </div>
              <div className="student-year-calendar">
                {selectedStudentCalendar.map((month) => (
                  <article className="student-month-card" key={month.monthName}>
                    <h3>
                      {month.monthName} {year}
                    </h3>
                    <div className="student-month-weekdays">
                      {dayNames.map((day) => (
                        <span key={day}>{day.slice(0, 3)}</span>
                      ))}
                    </div>
                    <div className="student-month-grid">
                      {month.blanks.map((blank) => (
                        <span className="calendar-empty" key={blank.key} />
                      ))}
                      {month.dates.map((date) => (
                        <span className={statusClass(date.record?.status)} title={statusTitle(date.record?.status)} key={date.iso}>
                          <b>{date.day}</b>
                          <em>{statusShort(date.record?.status)}</em>
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </section>
  );
}
