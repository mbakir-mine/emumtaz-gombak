# Operasi, Backup dan Pemulihan e-Mumtaz

## Sasaran operasi

- RPO (kehilangan data maksimum): 24 jam tanpa PITR; beberapa minit jika PITR diaktifkan.
- RTO (masa pemulihan sasaran): 4 jam.
- Pemilik operasi: Pemilik Sistem e-Mumtaz.

## Lapisan backup

1. Aktifkan backup harian terurus Supabase untuk pelan Pro, Team atau Enterprise. Untuk tempoh peperiksaan aktif, pertimbangkan Point-in-Time Recovery (PITR).
2. Jalankan `tools/backup-supabase.ps1` untuk menghasilkan dump schema dan data setempat. Fail disimpan dalam `C:\backups\emumtaz-backups`, di luar repositori Git.
3. Salinan luar tapak hanya boleh dibuat ke storan organisasi yang diluluskan, dienkripsi dan mempunyai kawalan akses serta tempoh simpanan yang ditetapkan.

Dokumentasi rasmi: https://supabase.com/docs/guides/platform/backups

## Menjalankan backup setempat

Supabase CLI memerlukan Docker Desktop atau Podman untuk fungsi `db dump`. Selepas salah satunya dipasang:

```powershell
.\tools\backup-supabase.ps1
```

Pastikan kedua-dua fail schema dan data mempunyai saiz bukan sifar. Percubaan backup yang gagal akan dibersihkan supaya fail kosong tidak disalah anggap sebagai backup sebenar.

## Ujian pemulihan

Jalankan setiap tiga bulan pada projek Supabase ujian yang berasingan:

1. Gunakan backup terkini dan pulihkan schema dahulu, kemudian data.
2. Sahkan bilangan sekolah, pengguna, murid, kelas, markah dan log audit.
3. Jalankan login ujian, paparan laporan dan kemasukan satu markah.
4. Catat tarikh, tempoh pemulihan, pemeriksa dan sebarang kegagalan.

Jangan uji restore dengan menimpa pangkalan data produksi.

## Pemantauan

Endpoint `/api/health` menyemak aplikasi dan sambungan pangkalan data tanpa mendedahkan kandungan data. Workflow `Production health` memanggil endpoint ini setiap jam; kegagalan kelihatan pada GitHub Actions.

## Semakan harian pemilik

- Semak status backup Supabase dan health aplikasi.
- Semak log masuk luar biasa serta perubahan markah/pengguna dalam Audit Keselamatan.
- Pastikan lesen sekolah yang bakal tamat telah diperbaharui atau dimaklumkan.
