# Integrasi Sahsiah IHAB dalam eMumtaz

Modul Sahsiah IHAB kini menjadi modul rasmi eMumtaz menggunakan satu pangkalan data Supabase dan kawalan akses sedia ada. Tiada pangkalan data kedua diwujudkan.

## Nama dan laluan

- Nama paparan: **Sahsiah IHAB**
- Laluan rasmi: `/sahsiah-ihab`
- Laluan keserasian: `/khalifah-muda` (mengarahkan pengguna ke modul yang sama)
- Kunci modul dalaman: `KHALIFAH_MUDA` (dikekalkan supaya akses sekolah dan data lama tidak terputus)

## Pemetaan peranan

| Keperluan IHAB | Peranan eMumtaz |
| --- | --- |
| Pemilik platform | `OWNER` |
| Pentadbir daerah | `ADMIN_DAERAH` |
| Pentadbir sekolah | `ADMIN_SEKOLAH` |
| Guru kelas | `GURU_KELAS` |
| Guru subjek | `GURU_SUBJEK` |

## Data dan migrasi

Modul menggunakan jadual sedia ada:

- `khalifah_muda_records` — rekod aktiviti kelas, indikator positif dan bimbingan.
- `khalifah_muda_components` — komponen/indikator yang boleh ditetapkan oleh pentadbir.
- `school_module_access` — pengaktifan modul mengikut sekolah.

Jalankan migrasi `supabase/037_khalifah_muda_module.sql` dan `supabase/038_khalifah_muda_components.sql` pada projek Supabase eMumtaz jika belum pernah dijalankan. Semak RLS Supabase selepas migrasi sebelum mengaktifkan sekolah sebenar.

## Prosedur pengaktifan sekolah

1. Pastikan sekolah, kelas Tahun 6 dan murid aktif telah wujud.
2. OWNER mengaktifkan `KHALIFAH_MUDA` pada menu Akses Modul Sekolah.
3. Pentadbir menyemak komponen Sahsiah IHAB.
4. Guru merekod pentaksiran melalui `/sahsiah-ihab`.
5. Uji akses menggunakan akaun guru sekolah yang berbeza sebelum pelancaran.

Nama jadual dalaman dikekalkan buat masa ini sebagai strategi keserasian. Penamaan jadual hanya boleh diubah melalui migrasi berperingkat selepas semua integrasi dan laporan disahkan.
