with updates(tahun, kod_subjek, tajuk, standard_pembelajaran) as (
  values
  (4,$q$FEKAH$q$,$q$Solat sunat$q$,$q$3.1.1 Menyatakan pengertian solat sunat rawatib.
3.1.2 Menyebut lafaz niat solat sunat rawatib.
3.1.3 Menyatakan kaifiyat solat sunat rawatib.
3.1.4 Menyatakan hikmah solat sunat rawatib.
3.1.5 Mengamalkan solat sunat rawatib.
3.2.1 Menyatakan pengertian solat sunat dhuha.
3.2.2 Menyebut lafaz niat solat sunat dhuha.
3.2.3 Menyatakan kaifiyat solat sunat dhuha.
3.2.4 Menyatakan hikmah solat sunat dhuha.
3.2.5 Mengamalkan solat sunat dhuha.
3.3.1 Menyatakan pengertian solat sunat hajat.
3.3.2 Menyebut lafaz niat solat sunat hajat.
3.3.3 Menyatakan kaifiyat solat sunat hajat.
3.3.4 Menyatakan hikmah solat sunat hajat.
3.3.5 Mengamalkan solat sunat hajat.
3.4.1 Menyatakan pengertian solat sunat tarawih.
3.4.2 Menyebut lafaz niat solat sunat tarawih.
3.4.3 Menyatakan kaifiyat solat sunat tarawih.
3.4.4 Menyatakan hikmah solat sunat tarawih.
3.4.5 Mengamalkan solat sunat tarawih.
3.5.1 Menyatakan pengertian solat sunat tahajud.
3.5.2 Menyebut lafaz niat solat sunat tahajud.
3.5.3 Menyatakan kaifiyat solat sunat tahajud.
3.5.4 Menyatakan hikmah solat sunat tahajud.
3.5.5 Mengamalkan solat sunat tahajud.
3.6.1 Menyatakan pengertian solat sunat tasbih.
3.6.2 Menyebut lafaz niat solat sunat tasbih.
3.6.3 Menyatakan kaifiyat solat sunat tasbih.
3.6.4 Menyatakan hikmah solat sunat tasbih.
3.6.5 Mengamalkan solat sunat tasbih.
3.7.1 Menyatakan pengertian solat sunat witir.
3.7.2 Menyebut lafaz niat solat sunat witir.
3.7.3 Menyatakan kaifiyat solat sunat witir.
3.7.4 Menyatakan hikmah solat sunat witir.
3.7.5 Mengamalkan solat sunat witir.
3.9.1 Menyatakan pengertian solat sunat khusuf.
3.9.2 Menyebut lafaz niat solat sunat khusuf.
3.9.3 Menyatakan kaifiyat solat sunat khusuf.
3.9.4 Menyatakan hikmah solat sunat khusuf.
3.9.5 Mengamalkan solat sunat khusuf.$q$),
  (6,$q$FEKAH$q$,$q$Sembelihan, Qurban dan Akikah$q$,$q$2.1.1 Menyebut pengertian sembelihan.
2.1.2 Menyebut dalil sembelihan.
2.1.3 Menyebut hukum sembelihan.
2.1.4 Menyatakan syarat sah sembelihan.
2.1.5 Menyebut 2 alat sembelihan.
2.1.6 Menyatakan kaifiyat sembelihan.
2.1.7 Menyatakan hikmah sembelihan.
2.2.1 Menyebut pengertian qurban.
2.2.2 Menyebut dalil qurban.
2.2.3 Menyebut hukum qurban.
2.2.4 Menyatakan 2 jenis binatang qurban.
2.2.5 Menyatakan syarat 2 binatang qurban.
2.2.6 Menyatakan fadhilat qurban.
2.3.1 Menyebut pengertian akikah.
2.3.2 Menyebut dalil akikah.
2.3.3 Menyebut hukum akikah.
2.3.4 Menyatakan 2 jenis binatang akikah.
2.3.5 Menyatakan syarat 2 binatang akikah.
2.3.6 Menyatakan kaifiyat ibadah akikah.
2.3.7 Menyatakan hikmah ibadah akikah.$q$)
)
update public.rph_topic_bank target
set standard_pembelajaran = updates.standard_pembelajaran,
    updated_at = now()
from updates
where target.tahun = updates.tahun
  and target.kod_subjek = updates.kod_subjek
  and target.tajuk = updates.tajuk;
