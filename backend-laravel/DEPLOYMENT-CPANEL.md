# Deployment cPanel e-Mumtaz

## Keperluan

- PHP 8.3 atau lebih baharu
- MySQL/MariaDB
- Extensions `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, `ctype`, `xml` dan `gd`
- Composer 2
- HTTPS
- Document root domain menghala ke folder `public`
- Cron Job untuk backup dan scheduler jika diperlukan

## Upload dan konfigurasi

1. Upload source project ke folder di luar `public_html`.
2. Jalankan `composer install --no-dev --optimize-autoloader`.
3. Salin `.env.example` kepada `.env` dan isi database production.
   Pastikan `APP_TIMEZONE=Asia/Kuala_Lumpur`.
4. Jalankan `php artisan key:generate` sekali sahaja.
5. Jalankan `php artisan migrate --force`.
6. Jalankan `php artisan storage:link` jika fail public digunakan.
7. Pastikan `APP_DEBUG=false`.
8. Arahkan domain/subdomain ke folder `public`.
9. Jalankan `php artisan optimize`.
10. Jalankan `php artisan emumtaz:check-production --strict` dan pastikan semua semakan `PASS`.

## Cutover frontend Next.js berperingkat

Untuk menguji authentication dan modul kehadiran melalui Laravel tanpa memutuskan
Supabase, tetapkan pada environment frontend Next.js:

```env
NEXT_PUBLIC_SELF_HOSTED_API_URL=https://emumtaz.example
NEXT_PUBLIC_SITE_URL=https://emumtaz.example
```

Nilai ini mestilah URL yang berkongsi cookie/session dengan frontend (paling mudah
melalui reverse proxy atau domain yang sama). Jika kosong, frontend menggunakan
laluan Supabase lama. Aktifkan hanya selepas `php artisan emumtaz:status`, `/health`
dan ujian login Laravel disahkan pada staging.

## Deploy dan rollback yang selamat

Simpan setiap release dalam folder berasingan, contohnya `releases/2026-09-28`,
dan arahkan symlink `current` kepada release aktif. Jalankan migrasi sebelum
menukar symlink, kemudian semak `/health` dan log masuk. Untuk rollback,
arahkan semula `current` kepada release sebelumnya; jangan rollback migrasi
database secara automatik tanpa backup dan pengesahan data.

Selepas upload source, urutan arahan yang disyorkan:

```bash
composer install --no-dev --prefer-dist --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan emumtaz:check-production --strict
```

Selepas import data, semak kiraan rekod sebelum cutover:

```bash
php artisan emumtaz:verify-import storage/app/private/emumtaz-supabase-export.json --strict
```

## Backup

Backup manual:

```bash
php artisan emumtaz:backup --retention=30
```

Contoh Cron harian:

```bash
15 2 * * * cd /home/USERNAME/emumtaz && php artisan emumtaz:backup --retention=30 >> storage/logs/backup.log 2>&1
```

Backup mesti disalin keluar daripada server secara berkala dan diuji restore pada database staging.

## Health check

```text
https://emumtaz.example/health
```

Endpoint ini hanya melaporkan status aplikasi/database dan tidak memerlukan Supabase atau Vercel.
