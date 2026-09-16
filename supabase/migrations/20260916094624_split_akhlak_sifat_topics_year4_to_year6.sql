update public.rph_topic_bank
set status = 'TIDAK_AKTIF', updated_at = now()
where kod_subjek = 'AKHLAK'
  and tahun in (4, 5, 6)
  and tajuk in (
    'Sifat mahmudah',
    'Sifat mazmumah',
    'Sifat Mahmudah',
    'Sifat Mazmumah'
  );

with dskp(tahun, kod_subjek, nama_subjek, tajuk, standard_kandungan, standard_pembelajaran, susunan) as (
  values
  (4,$q$AKHLAK$q$,$q$Akhlak Islami$q$,$q$Tawbah$q$,$q$Standard 7.1: Tawbah$q$,$q$7.1 Tawbah: pengertian, dalil, cara bertaubat, fadhilat dan akibat tidak bertaubat.$q$,38),
  (4,$q$AKHLAK$q$,$q$Akhlak Islami$q$,$q$Khauf$q$,$q$Standard 7.2: Khauf$q$,$q$7.2 Khauf: pengertian, dalil, cara khauf, fadhilat dan akibat tidak khauf.$q$,39),
  (4,$q$AKHLAK$q$,$q$Akhlak Islami$q$,$q$Syarah al-Ta'am$q$,$q$Standard 8.1: Syarah al-Ta'am$q$,$q$8.1 Syarah al-Ta'am: pengertian, dalil, ciri-ciri, akibat, fadhilat menjauhi dan cara menjauhi.$q$,40),
  (4,$q$AKHLAK$q$,$q$Akhlak Islami$q$,$q$Syarah al-Kalam$q$,$q$Standard 8.2: Syarah al-Kalam$q$,$q$8.2 Syarah al-Kalam: pengertian, dalil, ciri-ciri, akibat, fadhilat menjauhi dan cara menjauhi.$q$,41),

  (5,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Zuhud$q$,$q$Standard 4.1: Zuhud$q$,$q$4.1 Zuhud: pengertian, dalil, cara-cara zuhud, fadhilat zuhud dan akibat tidak zuhud.$q$,38),
  (5,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Sabar$q$,$q$Standard 4.2: Sabar$q$,$q$4.2 Sabar: pengertian, dalil, cara bersabar, fadhilat sabar dan akibat tidak sabar.$q$,39),
  (5,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Syukur$q$,$q$Standard 4.3: Syukur$q$,$q$4.3 Syukur: pengertian, dalil, ciri-ciri orang yang bersyukur, fadhilat orang yang bersyukur dan akibat tidak bersyukur.$q$,40),
  (5,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Ikhlas$q$,$q$Standard 4.4: Ikhlas$q$,$q$4.4 Ikhlas: pengertian, dalil, ciri-ciri ikhlas, fadhilat ikhlas dan akibat tidak ikhlas.$q$,41),
  (5,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Ghadab$q$,$q$Standard 5.1: Ghadab$q$,$q$5.1 Ghadab: maksud, dalil larangan, cara menghindari ghadab, fadhilat menjauhi sifat ghadab dan akibat bersifat ghadab.$q$,42),
  (5,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Hasad$q$,$q$Standard 5.2: Hasad$q$,$q$5.2 Hasad: maksud, dalil larangan, ciri-ciri hasad, akibat hasad dan fadhilat tidak bersifat hasad.$q$,43),
  (5,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Bakhil$q$,$q$Standard 5.3: Bakhil$q$,$q$5.3 Bakhil: maksud, dalil bakhil, ciri-ciri bakhil, cara menjauhi bakhil, akibat bakhil dan fadhilat menjauhi bakhil.$q$,44),
  (5,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Hubb al-Jah$q$,$q$Standard 5.4: Hubb al-Jah$q$,$q$5.4 Hubb al-Jah: pengertian, dalil larangan, ciri-ciri hubb al-jah, akibat bersifat hubb al-jah, cara menjauhi hubb al-jah dan fadhilat menjauhi hubb al-jah.$q$,45),

  (6,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Tawakkal$q$,$q$Standard 3.1: Tawakkal$q$,$q$3.1 Tawakkal: pengertian, dalil tawakkal, 2 ciri tawakkal, fadhilat tawakkal dan akibat tidak bertawakkal.$q$,36),
  (6,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Mahabbah$q$,$q$Standard 3.2: Mahabbah$q$,$q$3.2 Mahabbah: pengertian, dalil mahabbah, 2 cara mahabbah, fadhilat mahabbah dan akibat tidak mahabbah.$q$,37),
  (6,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Redha$q$,$q$Standard 3.3: Redha$q$,$q$3.3 Redha: pengertian, dalil redha, 2 ciri redha, fadhilat bersifat redha dan akibat tidak bersifat redha.$q$,38),
  (6,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Zikrul Maut$q$,$q$Standard 3.4: Zikrul Maut$q$,$q$3.4 Zikrul Maut: pengertian, dalil zikrul maut, cara zikrul maut, fadhilat zikrul maut dan akibat tidak zikrul maut.$q$,39),
  (6,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Hubb al-Dunya$q$,$q$Standard 4.1: Hubb al-Dunya$q$,$q$4.1 Hubb al-Dunya: pengertian, dalil larangan, ciri-ciri hubb al-dunya, akibat bersifat hubb al-dunya, cara menjauhi hubb al-dunya dan fadhilat menjauhi sifat hubb al-dunya.$q$,40),
  (6,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Takbur$q$,$q$Standard 4.2: Takbur$q$,$q$4.2 Takbur: pengertian, dalil larangan, ciri-ciri takbur, fadhilat menjauhi sifat takbur dan akibat takbur.$q$,41),
  (6,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Ujub$q$,$q$Standard 4.3: Ujub$q$,$q$4.3 Ujub: pengertian, dalil larangan, ciri-ciri ujub, cara menjauhi ujub, akibat bersifat ujub dan fadhilat menjauhi sifat ujub.$q$,42),
  (6,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Riya'$q$,$q$Standard 4.4: Riya'$q$,$q$4.4 Riya': pengertian, dalil larangan, ciri-ciri riya', akibat bersifat riya', cara menjauhi riya' dan fadhilat menjauhi sifat riya'.$q$,43)
)
insert into public.rph_topic_bank (
  tahun, kod_subjek, nama_subjek, tajuk, standard_kandungan, standard_pembelajaran, susunan, status
)
select tahun, kod_subjek, nama_subjek, tajuk, standard_kandungan, standard_pembelajaran, susunan, 'AKTIF'
from dskp
on conflict (tahun, kod_subjek, tajuk) do update set
  nama_subjek = excluded.nama_subjek,
  standard_kandungan = excluded.standard_kandungan,
  standard_pembelajaran = excluded.standard_pembelajaran,
  susunan = excluded.susunan,
  status = 'AKTIF',
  updated_at = now();
