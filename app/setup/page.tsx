import AppFrame from '../ui/AppFrame';

export default function SetupPage() {
  return (
    <AppFrame title="Subjek" subtitle="Subjek dan peraturan purata." active="setup">
      <div className="card-grid">
        <div className="card">
          <h2>Tetapan Sistem</h2>
          <p>e-Mumtaz Gombak disetkan untuk Tahun 1 hingga Tahun 6. Tahun akademik aktif semasa ialah 2026.</p>
        </div>
        <div className="card">
          <h2>1. Kelas</h2>
          <p>Admin sekolah daftar kelas mengikut tahun akademik, tahun murid dan nama kelas.</p>
        </div>
        <div className="card">
          <h2>2. Subjek Tahun</h2>
          <p>Tahun 1-2, Tahun 3 dan Tahun 4-6 menggunakan set subjek purata yang berbeza.</p>
        </div>
        <div className="card">
          <h2>3. Murid</h2>
          <p>Murid dimasukkan selepas kelas wujud supaya setiap murid ada class_id yang sah.</p>
        </div>
        <div className="card">
          <h2>4. Guru</h2>
          <p>Guru didaftarkan dalam app_users sebagai GURU_KELAS atau GURU_SUBJEK.</p>
        </div>
        <div className="card">
          <h2>5. Guru Kelas</h2>
          <p>Hubungkan guru kelas kepada kelas melalui teacher_class_assignments.</p>
        </div>
        <div className="card">
          <h2>6. Guru Subjek</h2>
          <p>Hubungkan guru subjek kepada kelas dan kod_subjek.</p>
        </div>
        <div className="card">
          <h2>7. Markah</h2>
          <p>Markah hanya dimasukkan selepas peperiksaan, murid, kelas dan subjek lengkap.</p>
        </div>
      </div>
    </AppFrame>
  );
}
