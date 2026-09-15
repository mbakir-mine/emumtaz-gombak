'use client';

import Image from 'next/image';
import QRCode from 'qrcode';
import { useState } from 'react';
import { issueReportVerification, type IssuedReport } from '@/app/laporan/actions';

function safeSpreadsheetCell(value: string) {
  const clean = value.replace(/\s+/g, ' ').trim();
  return /^[=+\-@]/.test(clean) ? `'${clean}` : clean;
}

function csvCell(value: string) {
  return `"${safeSpreadsheetCell(value).replace(/"/g, '""')}"`;
}

function reportTables() {
  return [...document.querySelectorAll<HTMLTableElement>('main table')].filter((table) => !table.closest('[data-no-export]'));
}

function reportSnapshot() {
  return reportTables()
    .map((table) => [...table.rows].map((row) => [...row.cells].map((cell) => cell.innerText.trim()).join('|')).join('\n'))
    .join('\n---\n');
}

export default function ReportExportToolbar({ reportType, scopeLabel }: { reportType: string; scopeLabel: string }) {
  const [issued, setIssued] = useState<IssuedReport | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [pending, setPending] = useState(false);

  function exportExcelCsv() {
    const tables = reportTables();
    const rows = tables.flatMap((table, tableIndex) => {
      const tableRows = [...table.rows].map((row) => [...row.cells].map((cell) => csvCell(cell.innerText)).join(','));
      return tableIndex === 0 ? tableRows : ['', ...tableRows];
    });
    if (!rows.length) return setIssued({ ok: false, message: 'Tiada jadual untuk dieksport.' });
    const blob = new Blob([`\uFEFF${rows.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${reportType.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function issueOfficialCopy() {
    const snapshot = reportSnapshot();
    if (!snapshot) return setIssued({ ok: false, message: 'Tiada kandungan laporan untuk didaftarkan.' });
    setPending(true);
    setIssued(null);
    setQrDataUrl('');
    try {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(snapshot));
      const hash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
      const result = await issueReportVerification({ reportType, scopeLabel, snapshotHash: hash });
      setIssued(result);
      if (result.ok && result.token) {
        const verificationUrl = `${window.location.origin}/sah-laporan/${result.token}`;
        setQrDataUrl(await QRCode.toDataURL(verificationUrl, { width: 180, margin: 1, errorCorrectionLevel: 'M' }));
      }
    } catch {
      setIssued({ ok: false, message: 'Gagal menjana pengesahan laporan.' });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="report-export-toolbar no-print">
      <button className="button secondary" type="button" onClick={() => window.print()}>Cetak / PDF</button>
      <button className="button secondary" type="button" onClick={exportExcelCsv}>Eksport Excel</button>
      <button className="button" type="button" onClick={issueOfficialCopy} disabled={pending}>
        {pending ? 'Mendaftarkan…' : 'Daftar Salinan Rasmi'}
      </button>
      {issued && <span className={issued.ok ? 'form-success' : 'form-message'}>{issued.message}</span>}
      {issued?.ok && issued.referenceNumber && qrDataUrl && (
        <div className="report-verification-card">
          <Image src={qrDataUrl} alt={`QR semakan ${issued.referenceNumber}`} width={108} height={108} unoptimized />
          <div><strong>{issued.referenceNumber}</strong><span>Imbas QR untuk semakan dalaman. QR dan rujukan turut dicetak.</span></div>
        </div>
      )}
    </div>
  );
}
