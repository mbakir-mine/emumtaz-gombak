# Deployment e-Mumtaz ke cPanel

Aplikasi ini menggunakan Next.js SSR dan Supabase. Ia perlu dijalankan sebagai
Node.js Application di cPanel; jangan gunakan `out/` sebagai laman statik.

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

Tambahkan environment variables berikut. Nilai sebenar ambil daripada `.env.local`
dan masukkan melalui panel cPanel, bukan ke Git:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUPABASE_ANON_KEY
```

Selepas simpan, tekan **Restart Application**.

## 3. Supabase Auth

Di Supabase → Authentication → URL Configuration:

- Site URL: `https://emumtaz.ismp.my`
- Redirect URL: `https://emumtaz.ismp.my/**`

Kekalkan URL Vercel buat sementara sehingga DNS sudah berpindah dan login di
cPanel telah diuji.

## 4. DNS dan SSL

Jangan padam projek Vercel dahulu. Uji aplikasi melalui hostname sementara atau
URL cPanel. Selepas aplikasi stabil:

1. Tukar rekod DNS `emumtaz.ismp.my` kepada alamat yang diberikan oleh hosting cPanel.
2. Tunggu DNS tersebar.
3. Jalankan AutoSSL cPanel dan sahkan `https://emumtaz.ismp.my`.
4. Uji login, markah, laporan, PSRA, UPKK, dan refresh halaman.
5. Hanya selepas itu nyahaktifkan domain custom Vercel.

## Nota keselamatan

`NEXT_PUBLIC_SUPABASE_ANON_KEY` memang boleh dihantar ke pelayar, tetapi semua
jadual yang mengandungi data mesti dilindungi dengan RLS Supabase. Jangan
letakkan `service_role` key dalam environment variables `NEXT_PUBLIC_*` atau
dalam kod klien.
