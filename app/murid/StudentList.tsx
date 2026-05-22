'use client';

import { useMemo, useState } from 'react';
import type { ClassRecord, School, StudentRecord } from '@/lib/data';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses, scopeStudents } from '../ui/scopedData';

export default function StudentList({
  students,
  classes,
  schools,
}: {
  students: StudentRecord[];
  classes: ClassRecord[];
  schools: School[];
}) {
  const profile = useAccessProfile();
  const [query, setQuery] = useState('');
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const scopedStudents = useMemo(
    () => scopeStudents(profile, students, classes, schools),
    [classes, profile, schools, students],
  );
  const classById = useMemo(() => new Map(scopedClasses.map((item) => [item.id, item])), [scopedClasses]);
  const filteredStudents = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return scopedStudents;

    return scopedStudents.filter((student) => {
      const classRecord = student.class_id ? classById.get(student.class_id) : null;
      const classLabel = classRecord ? `Tahun ${classRecord.tahun} ${classRecord.nama_kelas}` : 'Tiada kelas';
      return [student.nama_murid, student.kod_sekolah, classLabel, student.jantina, student.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [classById, query, scopedStudents]);

  return (
    <>
      <div className="panel-head">
        <h2>Senarai Murid</h2>
        <span>
          {filteredStudents.length} / {scopedStudents.length} rekod
        </span>
      </div>
      <div className="search-row">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari nama murid, sekolah, kelas atau status"
          aria-label="Cari murid"
        />
      </div>
      {filteredStudents.length === 0 ? (
        <p className="empty">Tiada murid sepadan dengan carian.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nama Murid</th>
                <th>Sekolah</th>
                <th>Kelas</th>
                <th>Jantina</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const classRecord = student.class_id ? classById.get(student.class_id) : null;
                return (
                  <tr key={student.id}>
                    <td>{student.nama_murid}</td>
                    <td>{student.kod_sekolah}</td>
                    <td>{classRecord ? `Tahun ${classRecord.tahun} - ${classRecord.nama_kelas}` : 'Tiada kelas'}</td>
                    <td>{student.jantina}</td>
                    <td>{student.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
