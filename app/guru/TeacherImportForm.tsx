'use client';

import { useActionState } from 'react';
import { importTeachers } from './actions';

const initialState = {
  ok: false,
  message: '',
};

export default function TeacherImportForm() {
  const [state, action, pending] = useActionState(importTeachers, initialState);

  return (
    <form action={action} className="import-form">
      <div>
        <h3>Import Pengguna Pukal</h3>
        <p className="table-note">
          CSV: nama, email, role, kod_sekolah, zon, status. Untuk Admin Zon, isi zon BARAT/TIMUR/TENGAH.
        </p>
        <a className="button soft template-link" href="/templates/template_import_pengguna.csv" download>
          Download Template CSV
        </a>
      </div>
      <label>
        Status default
        <select name="default_status" defaultValue="MENUNGGU">
          <option value="MENUNGGU">Menunggu</option>
          <option value="AKTIF">Aktif</option>
        </select>
      </label>
      <label>
        Fail CSV pengguna
        <input name="csv_file" type="file" accept=".csv,text/csv" required />
      </label>
      <div className="form-actions">
        <button className="button" type="submit" disabled={pending}>
          {pending ? 'Mengimport...' : 'Import Pengguna'}
        </button>
        {state.message && <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>}
      </div>
    </form>
  );
}
