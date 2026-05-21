-- e-Mumtaz Gombak official grade scale
-- Run this in Supabase SQL Editor to replace A-E grading with the official scale.

delete from grade_scales;

insert into grade_scales (nama_gred, markah_min, markah_max, label_prestasi, susunan)
values
  ('Mumtaz', 90, 100, 'Cemerlang Tertinggi', 1),
  ('Jayyid Jiddan', 75, 89.99, 'Sangat Baik', 2),
  ('Jayyid', 60, 74.99, 'Baik', 3),
  ('Maqbul', 40, 59.99, 'Lulus', 4),
  ('Musa''adah', 0, 39.99, 'Bantuan / Intervensi', 5);

