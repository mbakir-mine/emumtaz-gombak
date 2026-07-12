-- KOMPONEN KHALIFAH MUDA
-- Jalankan SQL ini sekali di Supabase untuk membolehkan admin mengurus aktiviti dan indikator Khalifah Muda.

create table if not exists public.khalifah_muda_components (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  domain text not null default 'Umum',
  kind text not null check (kind in ('AKTIVITI_KELAS', 'POSITIF', 'BIMBINGAN')),
  points numeric(6,2) not null default 0 check (points >= 0),
  sort_order integer not null default 0,
  status text not null default 'AKTIF' check (status in ('AKTIF', 'TIDAK_AKTIF')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_khalifah_muda_components_kind_status
  on public.khalifah_muda_components (kind, status, sort_order);

insert into public.khalifah_muda_components (key, label, domain, kind, points, sort_order, status)
values
  ('doa-kelas', 'Doa pembukaan atau penutup kelas', 'Ibadah', 'AKTIVITI_KELAS', 1, 10, 'AKTIF'),
  ('quran-kelas', 'Bacaan al-Quran atau hafazan kelas', 'Ibadah', 'AKTIVITI_KELAS', 1, 20, 'AKTIF'),
  ('kebersihan-kelas', 'Kebersihan kelas dilaksanakan', 'Tanggungjawab', 'AKTIVITI_KELAS', 1, 30, 'AKTIF'),
  ('tazkirah-kelas', 'Tazkirah atau muhasabah ringkas', 'Kendiri', 'AKTIVITI_KELAS', 1, 40, 'AKTIF'),
  ('salam', 'Memberi salam', 'Adab', 'POSITIF', 1, 10, 'AKTIF'),
  ('doa', 'Memimpin atau membaca doa', 'Ibadah', 'POSITIF', 1, 20, 'AKTIF'),
  ('quran', 'Peningkatan bacaan al-Quran', 'Ibadah', 'POSITIF', 1, 30, 'AKTIF'),
  ('kebersihan', 'Menjaga kebersihan kelas', 'Tanggungjawab', 'POSITIF', 1, 40, 'AKTIF'),
  ('bantu-rakan', 'Membantu rakan', 'Adab', 'POSITIF', 1, 50, 'AKTIF'),
  ('amanah', 'Menunjukkan amanah', 'Kendiri', 'POSITIF', 1, 60, 'AKTIF'),
  ('kepimpinan', 'Menjadi imam, bilal atau ketua aktiviti', 'Kepimpinan', 'POSITIF', 2, 70, 'AKTIF'),
  ('adab', 'Perlu bimbingan adab', 'Bimbingan', 'BIMBINGAN', 0, 10, 'AKTIF'),
  ('fokus', 'Kurang fokus semasa aktiviti', 'Bimbingan', 'BIMBINGAN', 0, 20, 'AKTIF'),
  ('tugasan', 'Tidak melaksanakan tugasan', 'Bimbingan', 'BIMBINGAN', 0, 30, 'AKTIF'),
  ('lewat', 'Lewat hadir atau lambat masuk kelas', 'Bimbingan', 'BIMBINGAN', 0, 40, 'AKTIF'),
  ('kebersihan-negatif', 'Tidak menjaga kebersihan', 'Bimbingan', 'BIMBINGAN', 0, 50, 'AKTIF')
on conflict (key) do update set
  label = excluded.label,
  domain = excluded.domain,
  kind = excluded.kind,
  points = excluded.points,
  sort_order = excluded.sort_order,
  status = excluded.status,
  updated_at = now();
