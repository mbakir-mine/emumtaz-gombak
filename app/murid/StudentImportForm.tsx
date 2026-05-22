'use client';

import { useActionState } from 'react';
import { importStudents } from './actions';
import type { School } from '@/lib/data';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeSchools } from '../ui/scopedData';

const initialState = {
  ok: false,
  message: '',
};

export default function StudentImportForm({ schools }: { schools: School[] }) {
  const profile = useAccessProfile();
  const [state, action, pending] = useActionState(importStudents, initialState);
  const scopedSchools = scopeSchools(profile, schools);

  return (
    <form action={action} className="import-form">
      <div>
        <h3>Import Murid Pukal</h3>
        <p className="table-note">
          CSV: mykid, nama_murid, jantina, kod_sekolah, tahun, nama_kelas. Jika semua murid satu sekolah, pilih sekolah
          default di bawah.
        </p>
        <a className="button soft template-link" href="/templates/template_import_murid.csv" download>
          Download Template CSV
        </a>
      </div>
      <label>
        Sekolah default
        <select name="default_kod_sekolah">
          <option value="">Ikut kod_sekolah dalam CSV</option>
          {scopedSchools.map((school) => (
            <option key={school.kod_sekolah} value={school.kod_sekolah}>
              {school.kod_sekolah} - {school.nama_sekolah}
            </option>
          ))}
        </select>
      </label>
      <label>
        Fail CSV murid
        <input name="csv_file" type="file" accept=".csv,text/csv" required />
      </label>
      <input name="default_status" type="hidden" value="AKTIF" />
      <div className="form-actions">
        <button className="button" type="submit" disabled={pending}>
          {pending ? 'Mengimport...' : 'Import Murid'}
        </button>
        {state.message && <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>}
      </div>
    </form>
  );
}
