# Deployment e-Mumtaz ke cPanel

Aplikasi ini menggunakan Next.js SSR sebagai frontend dan Laravel + MySQL/MariaDB
sebagai backend. Supabase dan Vercel tidak diperlukan untuk production.

## 1. Sediakan build deployment

Jalankan pada komputer pembangunan:

```bash
npm ci
npm run build
```

Selepas build selesai, salin folder berikut ke dalam `.next/standalone` sebelum
memuat naik pakej:

```bash
# Jalankan dari root projek (Linux/macOS/cPanel terminal)
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
```

Muat naik kandungan `.next/standalone` ke application root cPanel. Fail
`server.js` mesti berada terus di root aplikasi cPanel.

## 2. Tetapan Setup Node.js App

Dalam cPanel → **Setup Node.js App**:

- Node.js version: 22 atau lebih baharu
- Application mode: `Production`
- Application root: folder aplikasi yang memuatkan `server.js`
- Startup file: `server.js`
- Application URL: `emumtaz.ismp.my`

Tambahkan environment variables berikut melalui panel cPanel, bukan ke Git:

```env
NEXT_PUBLIC_SELF_HOSTED_API_URL=https://emumtaz.ismp.my
NEXT_PUBLIC_SITE_URL=https://emumtaz.ismp.my
EMUMTAZ_APP_URL=https://emumtaz.ismp.my
```

Selepas simpan, tekan **Restart Application**.

## 3. Laravel backend

Upload folder `backend-laravel` di luar `public_html`, jalankan arahan dalam
`backend-laravel/DEPLOYMENT-CPANEL.md`, dan arahkan subdomain/domain ke folder
`backend-laravel/public`. Frontend dan backend perlu berkongsi domain/origin yang
sesuai supaya cookie sesi Laravel dihantar dengan selamat.

## 4. DNS dan SSL

Jangan padam projek Vercel dahulu. Uji aplikasi melalui hostname sementara atau
URL cPanel. Selepas aplikasi stabil:

1. Tukar rekod DNS `emumtaz.ismp.my` kepada alamat yang diberikan oleh hosting cPanel.
2. Tunggu DNS tersebar.
3. Jalankan AutoSSL cPanel dan sahkan `https://emumtaz.ismp.my`.
4. Uji login, markah, laporan, PSRA, UPKK, dan refresh halaman.

## Nota keselamatan

`NEXT_PUBLIC_SUPABASE_ANON_KEY` memang boleh dihantar ke pelayar, tetapi semua
jadual yang mengandungi data mesti dilindungi dengan RLS Supabase. Jangan
letakkan `service_role` key dalam environment variables `NEXT_PUBLIC_*` atau
dalam kod klien.
