-- Bersihkan aksara rosak dalam No MyKid murid BYP7006 - SRA BATU ARANG.
-- Jalankan di Supabase SQL Editor.
-- MyKid sepatutnya 12 digit sahaja, jadi semua aksara bukan digit akan dibuang.

select
  id,
  nama_murid,
  mykid as mykid_asal,
  regexp_replace(mykid, '[^0-9]', '', 'g') as mykid_bersih
from public.students
where kod_sekolah = 'BYP7006'
  and mykid <> regexp_replace(mykid, '[^0-9]', '', 'g')
order by nama_murid;

update public.students
set mykid = regexp_replace(mykid, '[^0-9]', '', 'g')
where kod_sekolah = 'BYP7006'
  and mykid <> regexp_replace(mykid, '[^0-9]', '', 'g');

select
  count(*) as baki_mykid_beraksara
from public.students
where kod_sekolah = 'BYP7006'
  and mykid <> regexp_replace(mykid, '[^0-9]', '', 'g');
