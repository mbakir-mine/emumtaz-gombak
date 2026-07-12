'use client';

import { useActionState } from 'react';
import type { KhalifahMudaComponent } from '@/lib/data';
import { useAccessProfile } from '../ui/AuthGate';
import {
  addKhalifahMudaComponent,
  updateKhalifahMudaComponent,
  type KhalifahComponentActionState,
} from './actions';

const initialState: KhalifahComponentActionState = { ok: false, message: '' };
const adminRoles = new Set(['OWNER', 'ADMIN_DAERAH', 'ADMIN_SEKOLAH']);

const kindLabels: Record<KhalifahMudaComponent['kind'], string> = {
  AKTIVITI_KELAS: 'Aktiviti Kelas',
  POSITIF: 'Indikator Penghargaan',
  BIMBINGAN: 'Indikator Bimbingan',
};

function ComponentRow({ component, accessRole }: { component: KhalifahMudaComponent; accessRole: string }) {
  const [state, action, pending] = useActionState(updateKhalifahMudaComponent, initialState);

  return (
    <form action={action} className="khalifah-component-row">
      <input type="hidden" name="id" value={component.id ?? ''} />
      <input type="hidden" name="access_role" value={accessRole} />
      <label>
        Nama
        <input name="label" defaultValue={component.label} required />
      </label>
      <label>
        Kod
        <input name="key" defaultValue={component.key} required />
      </label>
      <label>
        Domain
        <input name="domain" defaultValue={component.domain} required />
      </label>
      <label>
        Mata
        <input name="points" type="number" min="0" max="100" step="0.01" defaultValue={component.points} />
      </label>
      <label>
        Susunan
        <input name="sort_order" type="number" min="0" step="1" defaultValue={component.sort_order} />
      </label>
      <label>
        Status
        <select name="status" defaultValue={component.status}>
          <option value="AKTIF">Aktif</option>
          <option value="TIDAK_AKTIF">Tidak Aktif</option>
        </select>
      </label>
      <label>
        Jenis
        <select name="kind" defaultValue={component.kind}>
          <option value="AKTIVITI_KELAS">Aktiviti Kelas</option>
          <option value="POSITIF">Penghargaan</option>
          <option value="BIMBINGAN">Bimbingan</option>
        </select>
      </label>
      <button className="button" type="submit" disabled={pending || !component.id}>
        {pending ? 'Menyimpan...' : 'Simpan'}
      </button>
      {state.message ? <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p> : null}
    </form>
  );
}

export default function KhalifahMudaComponentManager({ components }: { components: KhalifahMudaComponent[] }) {
  const profile = useAccessProfile();
  const [addState, addAction, addPending] = useActionState(addKhalifahMudaComponent, initialState);
  const accessRole = profile?.role ?? '';
  const canManage = adminRoles.has(accessRole);

  const grouped = (['AKTIVITI_KELAS', 'POSITIF', 'BIMBINGAN'] as const).map((kind) => ({
    kind,
    label: kindLabels[kind],
    rows: components
      .filter((component) => component.kind === kind)
      .sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label)),
  }));

  if (!canManage) {
    return (
      <section className="panel">
        <h2>Akses Terhad</h2>
        <p className="table-note">Hanya admin sahaja boleh mengubah kandungan aktiviti dan indikator Khalifah Muda.</p>
      </section>
    );
  }

  return (
    <section className="panel khalifah-component-panel">
      <div className="panel-head">
        <div>
          <h2>Komponen Khalifah Muda</h2>
          <p className="table-note">Tambah atau kemas kini aktiviti kelas, indikator penghargaan dan indikator bimbingan.</p>
        </div>
        <span>{components.length} komponen</span>
      </div>

      <form action={addAction} className="khalifah-component-add">
        <input type="hidden" name="access_role" value={accessRole} />
        <label>
          Jenis
          <select name="kind" defaultValue="AKTIVITI_KELAS">
            <option value="AKTIVITI_KELAS">Aktiviti Kelas</option>
            <option value="POSITIF">Penghargaan</option>
            <option value="BIMBINGAN">Bimbingan</option>
          </select>
        </label>
        <label>
          Nama
          <input name="label" placeholder="Contoh: Membantu rakan" required />
        </label>
        <label>
          Kod
          <input name="key" placeholder="Auto jika dikosongkan" />
        </label>
        <label>
          Domain
          <input name="domain" placeholder="Contoh: Adab" />
        </label>
        <label>
          Mata
          <input name="points" type="number" min="0" max="100" step="0.01" defaultValue={1} />
        </label>
        <label>
          Susunan
          <input name="sort_order" type="number" min="0" step="1" defaultValue={components.length + 1} />
        </label>
        <input type="hidden" name="status" value="AKTIF" />
        <button className="button" type="submit" disabled={addPending}>
          {addPending ? 'Menambah...' : 'Tambah Komponen'}
        </button>
        {addState.message ? <p className={addState.ok ? 'form-success' : 'form-message'}>{addState.message}</p> : null}
      </form>

      <div className="khalifah-component-groups">
        {grouped.map((group) => (
          <section className="khalifah-component-group" key={group.kind}>
            <div className="panel-head module-subhead">
              <h3>{group.label}</h3>
              <span>{group.rows.length} item</span>
            </div>
            {group.rows.length === 0 ? (
              <p className="empty">Belum ada item.</p>
            ) : (
              <div className="khalifah-component-list">
                {group.rows.map((component) => (
                  <ComponentRow key={component.id ?? component.key} component={component} accessRole={accessRole} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}
