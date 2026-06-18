const signatureLabels = ['Disediakan oleh,', 'Disemak oleh,', 'Disahkan oleh,'];

export default function ReportSignatureBlock() {
  return (
    <div className="report-signature-block" aria-label="Ruang pengesahan laporan">
      {signatureLabels.map((label) => (
        <div className="report-signature-item" key={label}>
          <p>{label}</p>
          <div className="report-signature-line" />
        </div>
      ))}
    </div>
  );
}
