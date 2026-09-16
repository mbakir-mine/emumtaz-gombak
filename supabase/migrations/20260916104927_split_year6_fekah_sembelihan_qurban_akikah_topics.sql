update public.rph_topic_bank
set status = 'TIDAK_AKTIF', updated_at = now()
where tahun = 6
  and kod_subjek = 'FEKAH'
  and tajuk = 'Sembelihan, Qurban dan Akikah';

with topics(tahun, kod_subjek, nama_subjek, tajuk, standard_kandungan, standard_pembelajaran, susunan) as (
  values
  (6,$q$FEKAH$q$,$q$Fiqh$q$,$q$Sembelihan$q$,$q$Standard 2.1: Sembelihan$q$,$q$2.1.1 Menyebut pengertian sembelihan.
2.1.2 Menyebut dalil sembelihan.
2.1.3 Menyebut hukum sembelihan.
2.1.4 Menyatakan syarat sah sembelihan.
2.1.5 Menyebut 2 alat sembelihan.
2.1.6 Menyatakan kaifiyat sembelihan.
2.1.7 Menyatakan hikmah sembelihan.$q$,30),
  (6,$q$FEKAH$q$,$q$Fiqh$q$,$q$Ibadah Qurban$q$,$q$Standard 2.2: Ibadah Qurban$q$,$q$2.2.1 Menyebut pengertian qurban.
2.2.2 Menyebut dalil qurban.
2.2.3 Menyebut hukum qurban.
2.2.4 Menyatakan 2 jenis binatang qurban.
2.2.5 Menyatakan syarat 2 binatang qurban.
2.2.6 Menyatakan fadhilat qurban.$q$,31),
  (6,$q$FEKAH$q$,$q$Fiqh$q$,$q$Ibadah Akikah$q$,$q$Standard 2.3: Ibadah Akikah$q$,$q$2.3.1 Menyebut pengertian akikah.
2.3.2 Menyebut dalil akikah.
2.3.3 Menyebut hukum akikah.
2.3.4 Menyatakan 2 jenis binatang akikah.
2.3.5 Menyatakan syarat 2 binatang akikah.
2.3.6 Menyatakan kaifiyat ibadah akikah.
2.3.7 Menyatakan hikmah ibadah akikah.$q$,32)
)
insert into public.rph_topic_bank (
  tahun, kod_subjek, nama_subjek, tajuk, standard_kandungan, standard_pembelajaran, susunan, status
)
select tahun, kod_subjek, nama_subjek, tajuk, standard_kandungan, standard_pembelajaran, susunan, 'AKTIF'
from topics
on conflict (tahun, kod_subjek, tajuk) do update set
  nama_subjek = excluded.nama_subjek,
  standard_kandungan = excluded.standard_kandungan,
  standard_pembelajaran = excluded.standard_pembelajaran,
  susunan = excluded.susunan,
  status = 'AKTIF',
  updated_at = now();

update public.rph_topic_bank
set susunan = case tajuk
    when 'Muamalat' then 33
    when 'Faraid' then 34
    when 'Jinayat' then 35
    else susunan
  end,
  updated_at = now()
where tahun = 6
  and kod_subjek = 'FEKAH'
  and tajuk in ('Muamalat', 'Faraid', 'Jinayat');
