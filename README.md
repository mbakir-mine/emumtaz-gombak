# e-Mumtaz Gombak

Fail ini ialah titik mula rasmi untuk membina semula sistem e-Mumtaz Gombak secara tersusun.

## Fail Penting

- `docs/emumtaz-blueprint.md`  
  Pelan sistem, role pengguna, modul, struktur markah, dan laporan.

- `supabase/001_emumtaz_schema.sql`  
  Schema database Supabase rasmi.

- `supabase/000_reset_schema.sql`  
  Skrip reset penuh jika mahu buang struktur lama dan mula semula.

- `supabase/002_seed_minimal.sql`  
  Data permulaan untuk sekolah, peperiksaan, dan pengguna contoh.

- `prototype/index.html`  
  Prototype web statik untuk melihat aliran dashboard, akses, input markah, laporan, dan tetapan.

## Langkah Setup Supabase

1. Buka Supabase.
2. Pergi ke SQL Editor.
3. Jika mahu mula baru, run kandungan `supabase/000_reset_schema.sql`.
4. Run kandungan `supabase/001_emumtaz_schema.sql`.
5. Run kandungan `supabase/002_seed_minimal.sql`.
6. Run kandungan `supabase/009_system_settings.sql`.
7. Semak table berikut wujud:
   - `schools`
   - `app_users`
   - `classes`
   - `students`
   - `subjects`
   - `exams`
   - `teacher_class_assignments`
   - `teacher_subject_assignments`
   - `marks`
   - `grade_scales`
   - `system_settings`

## Cara Buka Prototype

Buka fail ini di browser:

`prototype/index.html`

Prototype ini belum sambung ke Supabase. Ia digunakan untuk sahkan reka bentuk aliran sistem dahulu.

## Langkah Seterusnya

1. Import senarai sekolah sebenar ke table `schools`.
2. Daftar owner dan admin sekolah dalam `app_users`.
3. Bina page login dan akses sebenar.
4. Bina modul daftar guru, kelas, murid, dan subjek.
5. Bina modul input markah guru subjek.
6. Bina laporan individu, kelas, sekolah, subjek, UPSA vs UASA, dan tahunan.
