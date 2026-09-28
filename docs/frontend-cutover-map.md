# Peta cutover frontend e-Mumtaz

Dokumen ini menjadi urutan pemindahan daripada Next.js/Supabase kepada Laravel/MySQL.
Sistem asal kekal sebagai fallback sehingga setiap baris mencapai status `verified`.

| Domain | Backend Laravel | Frontend lama | Status |
|---|---|---|---|
| Authentication | `/api/auth/login`, `/api/auth/session`, `/api/auth/logout` | `app/login`, `app/ui/AuthGate.tsx` | API verified; UI pending |
| Kehadiran | `GET /api/attendance/context`, `GET/POST /api/attendance` | `app/kehadiran` | API verified; Laravel Blade verified; Next cutover pending |
| Ibu bapa | `/api/parent/*`, `/ibu-bapa/*` | `app/ibu-bapa`, `app/akses-ibu-bapa` | Laravel portal verified; Next cutover pending |
| Murid/Kelas/Sekolah | `/api/students`, `/api/classes`, `/api/schools` | `app/murid`, `app/kelas`, `app/sekolah` | API verified; UI pending |
| Markah/Laporan | `/api/marks`, `/api/reports/*` | `app/markah`, `app/laporan` | API partial; UI pending |
| Assessment PSRA/UPKK | `/api/assessments/*` | `app/percubaan-*`, `app/penilaian-upkk` | API verified; UI pending |
| Workflow/Notifikasi | `/api/notifications`, `/api/mark-workflows` | `app/notifikasi`, `app/pengesahan-markah` | API verified; UI pending |
| RPH/Takwim/Jadual | migrations + partial controllers | `app/rph`, `app/takwim`, `app/jadual-waktu` | backend partial; UI pending |

## Gate release

Jalankan `npm run audit:self-hosted`. Cutover global hanya boleh dibuat apabila:

1. `cutoverReady` bernilai `true`.
2. Setiap domain di atas mempunyai ujian Laravel/API dan ujian UI.
3. Import data production telah dibuat ke staging dan bilangan rekod dibandingkan.
4. Login, laporan, backup/restore dan `/health` disahkan pada cPanel.
