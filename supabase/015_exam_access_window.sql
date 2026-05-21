-- e-Mumtaz Gombak: tempoh akses key in markah.
-- Run sekali di Supabase SQL Editor sebelum guna tetapan di web.

alter table exams
add column if not exists buka_markah date,
add column if not exists tutup_markah date;

update exams
set
  buka_markah = coalesce(buka_markah, current_date),
  tutup_markah = coalesce(tutup_markah, current_date + interval '14 days')
where status = 'DIBUKA';

select
  kod_peperiksaan,
  tahun_akademik,
  status,
  buka_markah,
  tutup_markah
from exams
order by tahun_akademik desc, kod_peperiksaan;
