# Blueprint Migrasi Self-Hosted e-Mumtaz

## Sasaran akhir

e-Mumtaz berjalan pada hosting sendiri seperti projek `G:\Projects\kamil-sanjais`:

- Laravel 13 + PHP 8.3+
- MySQL/MariaDB
- Laravel authentication dan session
- local/private storage pada server
- cPanel deployment dan Cron
- database migrations dan backup yang dikawal oleh projek
- tiada runtime dependency kepada Supabase atau Vercel

Projek Supabase semasa kekal sebagai sumber asal sehingga cutover disahkan.

## Keputusan seni bina

| Keperluan semasa | Pengganti self-hosted |
| --- | --- |
| Next.js App Router / Server Actions | Laravel routes, controllers, Form Requests dan Blade/Livewire atau frontend client |
| Supabase Auth | Laravel `users`, password hashing, sessions, password reset dan middleware role |
| Supabase PostgreSQL | MySQL/MariaDB migrations dan Eloquent models |
| Supabase RLS | Laravel policies, gates, scoped queries dan database foreign keys |
| Supabase RPC | Service classes / transactions / stored procedures hanya jika perlu |
| Supabase Storage | Laravel Filesystem private/public disk |
| Supabase Realtime | Polling atau WebSocket hanya untuk keperluan yang disahkan |
| Vercel | cPanel document root `public/`, PHP-FPM, Composer dan Cron |
| Supabase backups | `mysqldump`, cPanel backup dan `artisan system:backup` |

## Urutan migrasi wajib

### Fasa 0 — perlindungan sumber asal

1. Bekukan perubahan schema Supabase baharu kecuali pembaikan production.
2. Export schema, data, Auth metadata dan Storage secara berasingan.
3. Simpan checksum dan tarikh setiap backup.
4. Sediakan database MySQL staging; jangan gunakan database production cPanel sebagai eksperimen.

### Fasa 1 — kernel aplikasi

Bangunkan projek Laravel baharu dengan modul asas berikut sebelum modul akademik:

- `users`, role, status, school/zone scope
- login, logout, reset password, change password
- authorization policies dan audit log
- schools, classes, students, subjects dan exams
- health check, error logging dan backup command

### Fasa 2 — data teras

Urutan import:

1. daerah dan zon
2. sekolah
3. pengguna dan role
4. kelas
5. murid
6. subjek dan peperiksaan
7. assignment guru
8. markah dan komponen markah

Setiap importer mesti idempotent, merekod bilangan inserted/updated/skipped/error dan boleh dijalankan semula tanpa duplicate.

### Fasa 3 — modul tambahan

- laporan dan report verification
- kehadiran, Amal Khair dan takwim
- PBD
- UPKK dan PSRA
- RPH dan topic bank
- jadual waktu
- Sahsiah IHAB/Khalifah Muda
- parent access
- approval workflow, notifications, licensing dan audit export

### Fasa 4 — cutover

1. Uji import penuh pada staging.
2. Jalankan parallel verification antara Supabase dan MySQL.
3. Letak aplikasi lama dalam read-only atau maintenance window.
4. Import delta terakhir.
5. Tukar DNS/document root kepada Laravel.
6. Pantau login, write transaction, laporan, parent access dan backup.
7. Kekalkan Supabase read-only sehingga tempoh pemulihan dipersetujui.

## Konvensyen data MySQL

- Kekalkan UUID sebagai `char(36)` pada migrasi pertama untuk mengurangkan risiko pemetaan ID.
- Gunakan `utf8mb4` dan collation konsisten.
- Tukar PostgreSQL `timestamptz` kepada UTC `datetime` dan tetapkan timezone aplikasi kepada `Asia/Kuala_Lumpur` untuk paparan sahaja.
- Tukar enum PostgreSQL kepada string + validation Laravel, kecuali enum yang benar-benar stabil.
- Simpan medan JSON sebagai MySQL JSON hanya selepas ujian MariaDB/cPanel mengesahkan sokongan.
- Semua FK, unique index dan index tenant mesti diwujudkan dalam migration.
- Jangan import `auth.users` secara terus ke bentuk Laravel tanpa prosedur reset password yang disahkan.

## Kriteria penerimaan

Migrasi hanya dianggap selesai apabila semua perkara ini dibuktikan pada staging dan production:

- `npm`/Next/Vercel tidak diperlukan semasa runtime.
- Supabase URL/key tidak diperlukan dalam environment production.
- Login dan reset password berfungsi untuk setiap role.
- Pengguna tidak boleh membaca atau mengubah sekolah di luar scope.
- Semua modul utama boleh membaca dan menyimpan data.
- Bilangan rekod dan checksum data kritikal sepadan dengan sumber asal.
- Backup dan restore MySQL berjaya diuji pada server berasingan.
- `APP_DEBUG=false`, HTTPS aktif dan `.env` tidak berada dalam public root.
- Health check, log, queue dan Cron cPanel berfungsi.
- Sistem lama boleh dipulihkan jika cutover gagal.

## Export dan import data

Export jadual teras dari Supabase menggunakan service key pada mesin yang dipercayai:

```powershell
node tools/export-supabase-json.mjs outputs/emumtaz-supabase-export.json
```

Kemudian salin JSON ke backend Laravel dan semak dahulu:

```bash
php artisan emumtaz:import-json storage/app/private/emumtaz-supabase-export.json --dry-run
php artisan emumtaz:import-json storage/app/private/emumtaz-supabase-export.json
```

Jangan commit fail export atau service key. Export ini merangkumi jadual teras sahaja; modul tambahan mesti ditambah dalam senarai exporter dan migration Laravel selepas schema modul disahkan.

## Perkara yang tidak boleh dilakukan

- Jangan padam projek Supabase sebelum checksum dan UAT selesai.
- Jangan menyalin `SUPABASE_SERVICE_ROLE_KEY` ke MySQL atau repository.
- Jangan menukar semua modul dalam satu cutover tanpa staging.
- Jangan anggap migration SQL PostgreSQL boleh dijalankan terus pada MySQL.
- Jangan jadikan UI hiding sebagai pengganti authorization server-side.
