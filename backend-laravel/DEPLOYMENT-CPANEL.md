# Deployment cPanel e-Mumtaz (Laravel sahaja)

Dokumen ini ialah laluan deployment production yang tidak menggunakan Node.js,
Vercel atau `npm`. Aplikasi mesti dijalankan sebagai PHP/Laravel melalui Apache.

## Keperluan

- PHP 8.3 atau lebih baharu
- MySQL/MariaDB
- Extensions `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, `ctype`, `xml` dan `gd`
- Composer 2 (diperlukan semasa pemasangan sahaja; vendor boleh dibina di server)
- HTTPS
- Document root domain menghala ke folder `public`
- Cron Job untuk backup dan scheduler jika diperlukan

## Kaedah paling selamat di cPanel

1. Buat folder release di luar `public_html`, contohnya
   `/home/USERNAME/emumtaz/releases/2026-09-29`.
2. Upload kandungan folder `backend-laravel` ke folder release itu. Jangan upload
   `.env` tempatan, `vendor` tempatan atau `node_modules`.
3. Di Terminal cPanel, masuk ke folder release dan jalankan:

   ```bash
   composer install --no-dev --prefer-dist --optimize-autoloader
   cp .env.production.example .env
   ```

4. Edit `.env` dan isi database sebenar cPanel. Jangan letakkan nilai rahsia dalam
   GitHub. Pastikan:

   ```env
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://emumtaz.ismp.my
   APP_TIMEZONE=Asia/Kuala_Lumpur
   DB_CONNECTION=mysql
   SESSION_DRIVER=database
   SESSION_SECURE_COOKIE=true
   ```

5. Jalankan arahan initialization berikut:

   ```bash
   php artisan key:generate --force
   php artisan migrate --force
   php artisan storage:link
   php artisan optimize
   php artisan emumtaz:check-production --strict
   ```

6. Di cPanel → Domains, set document root domain kepada:
   `/home/USERNAME/emumtaz/releases/2026-09-29/public`.
   Jika hosting tidak membenarkan document root di luar `public_html`, letakkan
   hanya kandungan folder `public` dalam `public_html/emumtaz.ismp.my` dan ubah
   `index.php` supaya merujuk kepada folder release `vendor/autoload.php` dan
   `bootstrap/app.php`. Jangan letakkan `.env` di dalam `public_html`.
7. Buka `https://emumtaz.ismp.my/health`. Respons mesti HTTP 200 dengan
   `"status":"ok"` dan `"schema":"ready"` sebelum pengguna log masuk.

## Urutan upload ringkas melalui File Manager

Jika Terminal/Composer tidak tersedia, bina `vendor` di komputer dengan
`composer install --no-dev --optimize-autoloader`, zip kandungan
`backend-laravel` (termasuk `vendor`, tidak termasuk `.env`), kemudian upload dan
extract ke folder release. Selepas itu jalankan sekurang-kurangnya `php artisan
migrate --force` dan `php artisan optimize` melalui Terminal cPanel atau minta
host menjalankannya sekali.

## Konfigurasi aplikasi

8. Salin `.env.example` kepada `.env` dan isi database production.
   Pastikan `APP_TIMEZONE=Asia/Kuala_Lumpur`.
9. Jalankan `php artisan key:generate` sekali sahaja.
10. Jalankan `php artisan migrate --force`.
11. Jalankan `php artisan storage:link` jika fail public digunakan.
12. Pastikan `APP_DEBUG=false`.
13. Arahkan domain/subdomain ke folder `public`.
14. Jalankan `php artisan optimize`.
15. Jalankan `php artisan emumtaz:check-production --strict` dan pastikan semua semakan `PASS`.

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
