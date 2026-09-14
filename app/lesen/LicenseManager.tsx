'use client';

import { useActionState, useMemo, useState } from 'react';
import type { School, SchoolLicense } from '@/lib/data';
import { evaluateLicenseAccess } from '@/lib/licensing';
import { saveSchoolLicense, type LicenseActionState } from './actions';

const initialState: LicenseActionState = { ok: false, message: '' };

function defaultStart() {
  return new Date().toISOString().slice(0, 10);
}

function LicenseRow({ school, license }: { school: School; license?: SchoolLicense }) {
  const [state, action, pending] = useActionState(saveSchoolLicense, initialState);
  const effectiveStatus = evaluateLicenseAccess(license, defaultStart());

  return (
    <tr>
      <td><strong>{school.kod_sekolah}</strong><small>{school.nama_sekolah}</small></td>
      <td><span className={`license-status license-status-${effectiveStatus.toLowerCase()}`}>{effectiveStatus}</span></td>
      <td>
        <form action={action} className="license-row-form">
          <input type="hidden" name="kod_sekolah" value={school.kod_sekolah} />
          <select name="plan_code" defaultValue={license?.plan_code ?? 'ASAS'} aria-label={`Pakej ${school.kod_sekolah}`}>
            <option value="PERCUBAAN">Percubaan</option><option value="ASAS">Asas</option>
            <option value="PRO">Pro</option><option value="ENTERPRISE">Enterprise</option>
          </select>
          <select name="status" defaultValue={license?.status ?? 'AKTIF'} aria-label={`Status ${school.kod_sekolah}`}>
            <option value="PERCUBAAN">Percubaan</option><option value="AKTIF">Aktif</option>
            <option value="DIGANTUNG">Digantung</option><option value="TAMAT">Tamat</option>
          </select>
          <input type="date" name="starts_on" defaultValue={license?.starts_on ?? defaultStart()} aria-label={`Mula ${school.kod_sekolah}`} />
          <input type="date" name="ends_on" defaultValue={license?.ends_on ?? ''} aria-label={`Tamat ${school.kod_sekolah}`} />
          <input type="number" min="1" name="max_students" defaultValue={license?.max_students ?? ''} placeholder="Had murid" aria-label={`Had murid ${school.kod_sekolah}`} />
          <input type="number" min="1" name="max_users" defaultValue={license?.max_users ?? ''} placeholder="Had pengguna" aria-label={`Had pengguna ${school.kod_sekolah}`} />
          <input name="notes" defaultValue={license?.notes ?? ''} placeholder="Catatan" aria-label={`Catatan ${school.kod_sekolah}`} />
          <button className="button table-action" disabled={pending} type="submit">{pending ? 'Menyimpan…' : 'Simpan'}</button>
          {state.message && <small className={state.ok ? 'form-success' : 'form-message'}>{state.message}</small>}
        </form>
      </td>
    </tr>
  );
}

export default function LicenseManager({ schools, licenses }: { schools: School[]; licenses: SchoolLicense[] }) {
  const [query, setQuery] = useState('');
  const licenseMap = useMemo(() => new Map(licenses.map((item) => [item.kod_sekolah, item])), [licenses]);
  const filtered = schools.filter((school) => `${school.kod_sekolah} ${school.nama_sekolah} ${school.zon ?? ''}`.toLowerCase().includes(query.toLowerCase()));
  const active = licenses.filter((item) => evaluateLicenseAccess(item, defaultStart()) === 'AKTIF').length;

  return (
    <section className="panel license-panel">
      <div className="panel-head"><div><h2>Pengurusan Lesen</h2><p>{active} lesen aktif · {licenses.length} sekolah berlesen · sekolah tanpa rekod kekal sebagai akses legasi.</p></div></div>
      <input className="license-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kod atau nama sekolah" />
      <div className="table-scroll"><table><thead><tr><th>Sekolah</th><th>Keadaan</th><th>Tetapan lesen</th></tr></thead>
        <tbody>{filtered.map((school) => <LicenseRow key={school.kod_sekolah} school={school} license={licenseMap.get(school.kod_sekolah)} />)}</tbody>
      </table></div>
    </section>
  );
}
