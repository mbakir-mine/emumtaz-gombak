# e-Mumtaz Gombak

Sistem Analisis Prestasi Murid SRA & KAFAI Daerah Gombak.

## Matlamat Sistem

e-Mumtaz Gombak dibina untuk mengurus data murid, sekolah, guru, peperiksaan UPSA/UASA, markah, gred, analisis prestasi, dan laporan pelbagai peringkat.

Sistem ini mesti menyokong:

- 15 sekolah SRA.
- Lebih kurang 100 sekolah KAFAI.
- Rekod prestasi murid untuk tempoh jangka panjang.
- Input markah oleh guru subjek.
- Semakan kelas oleh guru kelas.
- Kawalan sekolah oleh admin sekolah.
- Pemantauan semua sekolah oleh owner/admin daerah.

## Peranan Pengguna

| Peranan | Kod Role | Skop Akses |
|---|---|---|
| Pemilik Sistem | OWNER | Semua sekolah, semua pengguna, semua markah, semua laporan |
| Admin Daerah | ADMIN_DAERAH | Semua sekolah daerah Gombak |
| Admin Sekolah | ADMIN_SEKOLAH | Sekolah sendiri sahaja |
| Guru Kelas | GURU_KELAS | Semua murid dalam kelas yang ditugaskan |
| Guru Subjek | GURU_SUBJEK | Markah subjek dan kelas yang ditugaskan sahaja |

## Modul Utama

1. Login dan akses pengguna.
2. Pengurusan sekolah.
3. Pengurusan guru.
4. Pengurusan kelas.
5. Pengurusan murid.
6. Pengurusan subjek.
7. Penetapan guru kelas.
8. Penetapan guru subjek.
9. Kemasukan markah UPSA/UASA.
10. Analisis individu.
11. Analisis kelas.
12. Analisis sekolah.
13. Analisis subjek.
14. Perbandingan UPSA dan UASA tahun semasa.
15. Perbandingan prestasi tahunan.

## Prinsip Database

Sistem mesti ada satu sumber data rasmi. Jangan cipta table baru secara rawak apabila page gagal. Semua page perlu membaca daripada table yang sama.

Table asas:

- `schools`
- `app_users`
- `classes`
- `students`
- `subjects`
- `subject_grade_rules`
- `exams`
- `teacher_class_assignments`
- `teacher_subject_assignments`
- `marks`
- `grade_scales`

## Struktur Markah

Markah disimpan dalam format panjang, bukan satu subjek satu kolum.

Contoh:

| tahun | peperiksaan | kod_sekolah | kelas | mykid | kod_subjek | markah |
|---|---|---|---|---|---|---|
| 2026 | UPSA | BYP7001 | 5 Amanah | 150101100001 | TAUHID | 88 |
| 2026 | UPSA | BYP7001 | 5 Amanah | 150101100001 | FEQAH | 91 |

Kelebihan:

- Mudah tambah subjek.
- Guru subjek hanya isi subjek sendiri.
- Analisis subjek lebih mudah.
- Purata boleh mengabaikan subjek kosong.

## Kaedah Purata

Purata murid, kelas, sekolah, dan subjek hanya mengambil kira markah yang tidak kosong.

Contoh:

- Jika murid hanya ada 5 markah daripada 8 subjek, purata dikira berdasarkan 5 subjek tersebut.
- Subjek kosong tidak dianggap 0.

Formula konsep:

```sql
avg(markah) where markah is not null
```

## Peraturan Subjek Mengikut Tahun Murid

### Tahun 1 dan Tahun 2

Subjek yang diambil kira untuk purata:

- Akhlak
- Bahasa Arab
- Jawi
- Tauhid
- Fekah

Tilawah dan Hafazan ada markah dan gred, tetapi tidak masuk purata keseluruhan.

### Tahun 3

Subjek yang diambil kira untuk purata:

- Akhlak
- Sirah
- Bahasa Arab
- Jawi
- Imlak dan Khat
- Tauhid
- Fekah
- Tajwid

Tilawah dan Hafazan ada markah dan gred, tetapi tidak masuk purata keseluruhan.

### Tahun 4, Tahun 5 dan Tahun 6

Kertas soalan yang diambil kira untuk purata:

- AS01 - Akhlak & Sirah
- BA02 - Bahasa Arab
- JIK03 - Jawi, Imlak & Khat
- TF04 - Tauhid & Fekah
- TJ05 - Tajwid

Tilawah dan Hafazan ada markah dan gred, tetapi tidak masuk purata keseluruhan.

## Skala Gred Rasmi

| Markah | Gred |
|---|---|
| 90-100 | Mumtaz |
| 75-89 | Jayyid Jiddan |
| 60-74 | Jayyid |
| 40-59 | Maqbul |
| 0-39 | Musa'adah |

## Laporan Yang Diperlukan

### Laporan Individu

- Nama murid.
- Sekolah.
- Kelas.
- Markah setiap subjek.
- Jumlah subjek diambil kira.
- Purata.
- Gred keseluruhan.
- Perbandingan UPSA/UASA.

### Laporan Kelas

- Senarai murid kelas.
- Purata kelas.
- Ranking murid.
- Bilangan murid ikut gred.
- Subjek paling kuat/lemah dalam kelas.

### Laporan Sekolah

- Purata sekolah.
- Bilangan calon.
- Bilangan murid Mumtaz.
- Peratus lulus.
- Ranking kelas.
- Perbandingan UPSA/UASA.

### Laporan Subjek

- Purata subjek.
- Bilangan murid.
- Bilangan lulus/gagal.
- Senarai murid lemah.
- Prestasi mengikut kelas dan sekolah.

### Laporan Daerah

- Ranking sekolah.
- Perbandingan SRA dan KAFAI.
- Subjek paling lemah daerah.
- Trend tahunan.

## Peraturan Pembangunan

- Jangan `drop table` yang ada data kecuali memang mahu reset penuh.
- Jangan gunakan `localStorage` sebagai sumber kebenaran utama untuk role.
- Role dan akses mesti datang daripada database.
- Page tidak boleh loading selama-lamanya. Jika data tiada, paparkan mesej.
- Setiap page mesti ada state `loading`, `error`, dan `empty`.
- UI perlu konsisten dengan identiti e-Mumtaz Gombak.
