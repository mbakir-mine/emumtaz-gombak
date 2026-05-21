'use client';

export default function PrintButton({ label = 'Cetak Laporan' }: { label?: string }) {
  return (
    <button className="button secondary no-print" type="button" onClick={() => window.print()}>
      {label}
    </button>
  );
}

