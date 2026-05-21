# e-Mumtaz Gombak: Akses Maya Guru

Dokumen ini ialah langkah ringkas untuk jadikan sistem boleh diakses oleh guru melalui internet.

## Status Sistem

- Aplikasi dibina dengan Next.js.
- Database menggunakan Supabase.
- Login menggunakan Supabase Auth.
- Profil pengguna disimpan dalam `app_users`.
- Akaun daftar baru akan masuk sebagai `MENUNGGU`.
- Pengguna hanya boleh masuk ke modul sistem jika ada profil `app_users.status = 'AKTIF'`.

## Aliran Pengguna

1. Guru buka URL rasmi sistem.
2. Guru klik `Daftar Pengguna Baru`.
3. Guru isi nama, email, password, role dan sekolah.
4. Sistem simpan akaun sebagai `MENUNGGU`.
5. Pentadbir semak di Supabase atau modul Guru.
6. Pentadbir tukar status kepada `AKTIF`.
7. Guru login dan akses sistem.

## Environment Variable Untuk Hosting

Masukkan nilai ini di platform hosting:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUPABASE_ANON_KEY
```

Nilai sebenar sama seperti fail `.env.local` di komputer pembangunan.

## Cadangan Hosting

Pilihan paling mudah:

- Frontend Next.js: Vercel
- Database dan login: Supabase

## Tetapan Supabase Auth

Selepas ada URL hosting rasmi, buka Supabase:

1. Pergi ke `Authentication`
2. Pergi ke `URL Configuration`
3. Letak `Site URL` kepada URL rasmi sistem
4. Tambah URL rasmi dalam `Redirect URLs`

Contoh:

```text
https://emumtaz-gombak.vercel.app
https://emumtaz-gombak.vercel.app/**
```

## Semakan Sebelum Edar Kepada Guru

- `schools` cukup 77 sekolah.
- `subjects` ada 15 subjek.
- `subject_grade_rules` ada 45 rules.
- `exams` ada UPSA dan UASA 2026.
- Data `classes` dan `students` sekolah pilot sudah masuk.
- Akaun pentadbir aktif sudah wujud dalam `app_users`.
- Halaman `/markah` boleh pilih peperiksaan, sekolah, kelas dan subjek.

## Nota Keselamatan

Semasa pembangunan, beberapa table masih `UNRESTRICTED`. Untuk penggunaan rasmi, aktifkan semula RLS dan tambah policy ikut role:

- Owner/Admin Daerah: semua sekolah
- Admin Sekolah: sekolah sendiri
- Guru Kelas: kelas sendiri
- Guru Subjek: subjek yang ditetapkan sahaja

