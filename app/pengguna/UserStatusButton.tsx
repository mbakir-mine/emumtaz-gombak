'use client';

import { useFormStatus } from 'react-dom';

export default function UserStatusButton({ label, variant = 'primary' }: { label: string; variant?: 'primary' | 'soft' | 'danger' }) {
  const { pending } = useFormStatus();

  return (
    <button className={`button ${variant === 'primary' ? '' : variant}`} type="submit" disabled={pending}>
      {pending ? 'Menyimpan...' : label}
    </button>
  );
}
