'use client';

import { useMemo, useState } from 'react';
import type { ClassRecord, StudentRecord } from '@/lib/data';

export default function StudentList({
  students,
  classes,
}: {
  students: StudentRecord[];
  classes: ClassRecord[];
}) {
  const [query, setQuery] = useState('');
  const classById = new Map(classes.map((item) => [item.id, item]));
  const filteredStudents = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return students;

    return students.filter((student) => {
      const classRecord = student.class_id ? classById.get(student.class_id) : null;
      const classLabel = classRecord ? `Tahun ${classRecord.tahun} ${classRecord.nama_kelas}` : 'Tiada kelas';
      return [student.mykid, student.nama_murid, student.kod_sekolah, classLabel, student.jantina, student.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [classById, query, students]);

  return (
    <>
      <div className="panel-head">
        <h2>Senarai Murid</h2>
        <span>
          {filteredStudents.length} / {students.length} rekod
        </span>
      </div>
      <div className="search-row">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari MyKid, nama murid, sekolah, kelas atau status"
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
                <th>MyKid</th>
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
                    <td>{student.mykid}</td>
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
