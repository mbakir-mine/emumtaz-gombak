'use client';

import { useActionState, useMemo, useState } from 'react';
import type { School, SchoolModuleAccess } from '@/lib/data';
import { optionalSchoolModules } from '@/lib/schoolModules';
import { KHALIFAH_MUDA_LOCKED_ACCESS_MODULES } from '@/lib/khalifahMuda';
import { updateSchoolModuleAccess, type SchoolModuleActionState } from './actions';

const initialState: SchoolModuleActionState = {
  ok: false,
  message: '',
};

function zoneLabel(zone: string | null) {
  if (!zone) return '-';
  return `Zon ${zone.charAt(0) + zone.slice(1).toLowerCase()}`;
}

function moduleMap(accesses: SchoolModuleAccess[]) {
  const map = new Map<string, boolean>();

  accesses.forEach((access) => {
    map.set(`${access.kod_sekolah}|${access.module_key}`, access.enabled);
  });

  return map;
}

function SchoolModuleRow({
  school,
  accessMap,
  index,
}: {
  school: School;
  accessMap: Map<string, boolean>;
  index: number;
}) {
  const [state, action] = useActionState(updateSchoolModuleAccess, initialState);

  return (
    <tr>
      <td>{index + 1}</td>
      <td>
        <strong>{school.kod_sekolah}</strong>
        <small>{school.nama_sekolah}</small>
      </td>
      <td>{school.kategori}</td>
      <td>{zoneLabel(school.zon)}</td>
      <td>
        <form action={action} className="module-access-row-form">
          <input type="hidden" name="kod_sekolah" value={school.kod_sekolah} />
          <div className="module-checkbox-grid">
            {optionalSchoolModules.map((module) => (
              KHALIFAH_MUDA_LOCKED_ACCESS_MODULES.some((key) => key === module.key) ? null : (
                <label className="module-checkbox" key={module.key}>
                  <input
                    type="checkbox"
                    name="module_keys"
                    value={module.key}
                    defaultChecked={accessMap.get(`${school.kod_sekolah}|${module.key}`) ?? false}
                  />
                  <span>{module.shortLabel}</span>
                </label>
              )
            ))}
          </div>
          <button className="button table-action" type="submit">
            Simpan
          </button>
          {state.message && (
            <small className={state.ok ? 'form-success' : 'form-message'}>{state.message}</small>
          )}
        </form>
      </td>
    </tr>
  );
}

export default function SchoolModuleAccessManager({
  schools,
  accesses,
}: {
  schools: School[];
  accesses: SchoolModuleAccess[];
}) {
  const [searchDraft, setSearchDraft] = useState('');
  const [query, setQuery] = useState('');
  const accessMap = useMemo(() => moduleMap(accesses), [accesses]);
  const filteredSchools = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return schools;

    return schools.filter((school) =>
      [school.kod_sekolah, school.nama_sekolah, school.kategori, zoneLabel(school.zon), school.status]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [query, schools]);

  return (
    <section className="panel module-access-panel">
      <div className="panel-head module-table-head">
        <div>
          <h2>Senarai Akses Modul Sekolah</h2>
          <p className="table-note">Pilih checkbox modul yang diluluskan untuk setiap sekolah.</p>
        </div>
        <span>{filteredSchools.length} / {schools.length} rekod</span>
      </div>

      <form
        className="module-access-search"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(searchDraft.trim());
        }}
      >
        <label>
          <span>Carian Sekolah</span>
          <input
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Cari kod sekolah, nama sekolah, kategori atau zon"
            aria-label="Cari sekolah"
          />
        </label>
        <button className="button search-button" type="submit">
          CARI
        </button>
      </form>

      {filteredSchools.length === 0 ? (
        <p className="empty">Tiada sekolah sepadan dengan carian.</p>
      ) : (
        <div className="table-scroll module-access-table">
          <table>
            <thead>
              <tr>
                <th>Bil</th>
                <th>Sekolah</th>
                <th>Kategori</th>
                <th>Zon</th>
                <th>Akses Modul</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchools.map((school, index) => (
                <SchoolModuleRow school={school} accessMap={accessMap} index={index} key={school.kod_sekolah} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {schools.length > 0 && accesses.length === 0 && (
        <p className="notice module-access-notice">
          Jika checkbox gagal disimpan, jalankan fail SQL <strong>supabase/023_school_module_access.sql</strong> di
          Supabase dahulu.
        </p>
      )}
    </section>
  );
}
