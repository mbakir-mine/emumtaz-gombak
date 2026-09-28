# Matriks Kesediaan Self-Hosted e-Mumtaz

Dokumen ini membezakan **skema**, **API**, **UI** dan **UAT**. Jadual wujud tidak bermaksud modul sudah siap digunakan production.

| Kawasan | Skema Laravel | API Laravel | UI Laravel | Export/import | UAT production |
|---|---:|---:|---:|---:|---:|
| Authentication, session, reset password | Ya | Ya | Asas | User import | Belum |
| Sekolah, kelas, murid | Ya | Ya | Asas CRUD | Ya | Belum |
| Subjek, peperiksaan, markah | Ya | Ya | Belum penuh | Ya | Belum |
| PBD dan kehadiran | Ya | Ya | Belum penuh | Ya | Belum |
| Parent access | Ya | Ya | Belum penuh | Ya | Belum |
| Workflow markah, notifikasi, audit | Ya | Ya | Belum penuh | Ya | Belum |
| Lesen sekolah | Ya | Ya | API sahaja | Ya | Belum |
| Takwim, Amal Khair, jadual waktu | Ya | Sebahagian | Belum | Ya | Belum |
| e-RPH dan topic bank | Ya | Sebahagian | Belum | Ya | Belum |
| UPKK dan PSRA | Ya | Input/report asas | Input asas | Ya | Belum |
| Khalifah Muda | Ya | Input asas | Belum | Ya | Belum |
| Sahsiah/iHAB | Ya | Input asas | Belum | Ya | Belum |
| Deployment cPanel dan backup | Ya | Health/backup | N/A | N/A | Belum |

## Gate cutover

Cutover tidak boleh dianggap selesai sehingga semua syarat berikut dibuktikan pada staging cPanel:

1. `php artisan emumtaz:check-production --strict` lulus.
2. `php artisan migrate --force` berjaya pada MySQL/MariaDB kosong.
3. Export Supabase dibuat dengan service key pada mesin dipercayai dan jumlah rekod direkodkan.
4. Import dijalankan dengan `--dry-run`, kemudian import sebenar dan semakan count/checksum.
5. Login, logout, forced password change, scope sekolah, parent report, markah, UPKK/PSRA dan backup-restore diuji.
6. Aplikasi Next.js asal masih boleh diaktifkan sebagai rollback sehingga UAT ditandatangani.

## Bukti semasa

- Laravel migration fresh lokal berjaya.
- Backend PHPUnit lulus: 29 tests, 70 assertions.
- Aplikasi Next.js asal lulus lint, 24 Vitest tests dan production build.
- Tiada export production atau data production dijalankan oleh kerja migrasi ini.
