'use client';

import { useFormStatus } from 'react-dom';
import { updateSchoolZone } from './actions';

const zoneOptions = [
  { value: '', label: 'Belum ditetapkan' },
  { value: 'BARAT', label: 'Zon Barat' },
  { value: 'TIMUR', label: 'Zon Timur' },
  { value: 'TENGAH', label: 'Zon Tengah' },
];

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="button" type="submit" disabled={pending}>
      {pending ? '...' : 'Simpan'}
    </button>
  );
}

export default function SchoolZoneForm({
  kodSekolah,
  currentZone,
}: {
  kodSekolah: string;
  currentZone: string | null;
}) {
  return (
    <form action={updateSchoolZone} className="zone-form">
      <input type="hidden" name="kod_sekolah" value={kodSekolah} />
      <select name="zon" defaultValue={currentZone ?? ''} aria-label={`Zon ${kodSekolah}`}>
        {zoneOptions.map((option) => (
          <option key={option.value || 'none'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <SubmitButton />
    </form>
  );
}
