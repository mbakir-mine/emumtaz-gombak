# e-Mumtaz Self-Hosted Backend

Backend Laravel untuk migrasi e-Mumtaz daripada Supabase/Vercel kepada model seperti `kamil-sanjais`: Laravel + MySQL/MariaDB + cPanel.

## Status

Sudah tersedia:

- Laravel 13 + PHP 8.3
- UUID-compatible users, schools, classes dan students
- Laravel session authentication
- Role/scope Owner, Daerah, Zon, Sekolah, Guru Kelas dan Guru Subjek
- import JSON Supabase secara idempotent
- schools, classes, students, subjects, exams, assignments dan marks
- laporan individu/kelas
- kehadiran batch
- PBD assessments dan marks
- workflow pengesahan markah, notifikasi dan token pengesahan laporan
- lesen sekolah serta skema penghantaran mingguan e-RPH dan bank topik
- log aktiviti login, percubaan login gagal, event akses ibu bapa dan audit keselamatan
- skema modul pilihan: takwim, amal khair, jadual waktu, e-RPH dan komponen markah
- skema penilaian UPKK (amali, PCHI, percubaan) dan PSRA (ringkasan serta per kertas)
- backup command dan `/health`
- ujian PHPUnit untuk authorization dan operasi teras

Status migrasi backend:

- API modul utama telah tersedia untuk frontend Next.js self-hosted.
- Import data production dan UAT cPanel perlu dilaksanakan menggunakan data serta
  kredensial hosting sebenar; jangan jalankan import production tanpa backup.

## Setup lokal

```powershell
copy .env.example .env
php artisan key:generate
php artisan migrate
php artisan test
```

Untuk MySQL, isi `DB_*` dalam `.env`. SQLite digunakan oleh default testing.

## Import data Supabase

Jalankan exporter dari root project dengan credentials pada mesin dipercayai:

```powershell
node tools/export-supabase-json.mjs outputs/emumtaz-supabase-export.json
```

Salin fail ke `storage/app/private/`, kemudian:

```bash
php artisan emumtaz:import-json storage/app/private/emumtaz-supabase-export.json --dry-run
php artisan emumtaz:import-json storage/app/private/emumtaz-supabase-export.json
```

Import tidak menetapkan password lama. Semua pengguna yang diimport perlu reset password.

## Operasi production

```bash
php artisan migrate --force
php artisan optimize
php artisan storage:link
php artisan emumtaz:backup --retention=30
```

Lihat [DEPLOYMENT-CPANEL.md](DEPLOYMENT-CPANEL.md) untuk document root, Cron dan backup.

Lihat [matriks kesediaan migrasi](../docs/self-hosted-readiness-matrix.md) sebelum cutover production.
