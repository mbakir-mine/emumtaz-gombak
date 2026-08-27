'use client';

import { useState } from 'react';

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  name?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
};

export default function PasswordField({
  label,
  value,
  onChange,
  name,
  placeholder,
  required,
  autoComplete,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label>
      {label}
      <span className="password-input-wrap">
        <input
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
        />
        <button
          aria-label={visible ? 'Sembunyikan password' : 'Lihat password'}
          className="password-eye-button"
          type="button"
          onClick={() => setVisible((current) => !current)}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            {visible ? (
              <>
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.2 5.5A9.6 9.6 0 0 1 12 5c5 0 8.7 4.1 10 7a13.1 13.1 0 0 1-3.1 4.2" />
                <path d="M6.6 6.6A13 13 0 0 0 2 12c1.3 2.9 5 7 10 7 1.3 0 2.5-.3 3.6-.8" />
              </>
            ) : (
              <>
                <path d="M2 12s3.7-7 10-7 10 7 10 7-3.7 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
        </button>
      </span>
    </label>
  );
}
