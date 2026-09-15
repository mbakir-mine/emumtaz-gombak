'use client';

import { useActionState, useMemo, useState } from 'react';
import type { School, SchoolLicense } from '@/lib/data';
import { daysUntilLicenseEnd, evaluateLicenseAccess, licensePlanModules } from '@/lib/licensing';
import { saveSchoolLicense, type LicenseActionState } from './actions';

const initialState: LicenseActionState = { ok: false, message: '' };

function defaultStart() {
  return new Date().toISOString().slice(0, 10);
}

function LicenseRow({ school, license }: { school: School; license?: SchoolLicense }) {
  const [state, action, pending] = useActionState(saveSchoolLicense, initialState);
  const effectiveStatus = evaluateLicenseAccess(license, defaultStart());
  const remainingDays = daysUntilLicenseEnd(license?.ends_on ?? null, defaultStart());

  return (
    <tr>
      <td><strong>{school.kod_sekolah}</strong><small>{school.nama_sekolah}</small></td>
      <td>
        <span className={`license-status license-status-${effectiveStatus.toLowerCase()}`}>{effectiveStatus}</span>
        {remainingDays !== null && remainingDays >= 0 && remainingDays <= 30
          ? <small className="license-renewal-warning">Tamat dalam {remainingDays} hari</small>
          : null}
      </td>
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
  const trials = licenses.filter((item) => evaluateLicenseAccess(item, defaultStart()) === 'PERCUBAAN').length;
  const expiring = licenses.filter((item) => {
    const days = daysUntilLicenseEnd(item.ends_on, defaultStart());
    return days !== null && days >= 0 && days <= 30;
  }).length;
  const blocked = licenses.filter((item) => ['TAMAT', 'DIGANTUNG'].includes(evaluateLicenseAccess(item, defaultStart()))).length;

  return (
    <section className="panel license-panel">
      <div className="panel-head"><div><h2>Pengurusan Lesen</h2><p>{licenses.length} sekolah berlesen · sekolah tanpa rekod kekal sebagai akses legasi.</p></div></div>
      <div className="license-summary" aria-label="Ringkasan lesen">
        <div><span>Aktif</span><strong>{active}</strong></div>
        <div><span>Percubaan</span><strong>{trials}</strong></div>
        <div><span>Perlu diperbaharui ≤30 hari</span><strong>{expiring}</strong></div>
        <div><span>Tamat / digantung</span><strong>{blocked}</strong></div>
      </div>
      <details className="license-entitlements">
        <summary>Lihat modul bagi setiap pakej</summary>
        <div>
          {Object.entries(licensePlanModules).map(([plan, modules]) => (
            <p key={plan}><strong>{plan}</strong><span>{modules.join(' · ')}</span></p>
          ))}
        </div>
      </details>
      <input className="license-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kod atau nama sekolah" />
      <div className="table-scroll"><table><thead><tr><th>Sekolah</th><th>Keadaan</th><th>Tetapan lesen</th></tr></thead>
        <tbody>{filtered.map((school) => <LicenseRow key={school.kod_sekolah} school={school} license={licenseMap.get(school.kod_sekolah)} />)}</tbody>
      </table></div>
    </section>
  );
}
