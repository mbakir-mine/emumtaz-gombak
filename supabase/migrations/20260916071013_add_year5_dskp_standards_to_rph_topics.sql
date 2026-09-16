alter table public.rph_topic_bank
  add column if not exists standard_kandungan text,
  add column if not exists standard_pembelajaran text;

update public.rph_topic_bank
set status = 'TIDAK_AKTIF', updated_at = now()
where tahun = 5;

with dskp(tahun, kod_subjek, nama_subjek, tajuk, standard_kandungan, standard_pembelajaran, susunan) as (
  values
  (5,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 1$q$,$q$Standard 1: Juzuk 1$q$,$q$1.1 Membaca potongan ayat Juzuk 1 dengan betul dan bertajwid.
1.2 Talaqqi musyafahah membaca 2 ayat Juzuk 1 dengan betul, lancar dan bertajwid.
Surah Al-Fatihah ayat 1-7.
Surah Al-Baqarah ayat 1-141.$q$,1),
  (5,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 2$q$,$q$Standard 2: Juzuk 2$q$,$q$2.1 Membaca potongan ayat Juzuk 2 dengan betul dan bertajwid.
2.2 Talaqqi musyafahah membaca 2 ayat Juzuk 2 dengan betul, lancar dan bertajwid.
Surah Al-Baqarah ayat 142-252.$q$,2),
  (5,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 3$q$,$q$Standard 3: Juzuk 3$q$,$q$3.1 Membaca potongan ayat Juzuk 3 dengan betul dan bertajwid.
3.2 Talaqqi musyafahah membaca 2 ayat Juzuk 3 dengan betul, lancar dan bertajwid.
Surah Al-Baqarah ayat 253-286.
Surah Ali Imran ayat 1-91.$q$,3),
  (5,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 4$q$,$q$Standard 4: Juzuk 4$q$,$q$4.1 Membaca potongan ayat Juzuk 4 dengan betul dan bertajwid.
4.2 Talaqqi musyafahah membaca 2 ayat Juzuk 4 dengan betul, lancar dan bertajwid.
Surah Ali Imran ayat 93-200.
Surah An-Nisa ayat 1-23.$q$,4),
  (5,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 5$q$,$q$Standard 5: Juzuk 5$q$,$q$5.1 Membaca potongan ayat Juzuk 5 dengan betul dan bertajwid.
5.2 Talaqqi musyafahah membaca 2 ayat Juzuk 5 dengan betul, lancar dan bertajwid.
Surah An-Nisa ayat 24-147.$q$,5),
  (5,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 6$q$,$q$Standard 6: Juzuk 6$q$,$q$6.1 Membaca potongan ayat Juzuk 6 dengan betul dan bertajwid.
6.2 Talaqqi musyafahah membaca 2 ayat Juzuk 6 dengan betul, lancar dan bertajwid.
Surah An-Nisa ayat 148-176.
Surah Al-Maidah ayat 1-81.$q$,6),
  (5,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 7$q$,$q$Standard 7: Juzuk 7$q$,$q$7.1 Membaca potongan ayat Juzuk 7 dengan betul dan bertajwid.
7.2 Talaqqi musyafahah membaca 2 ayat Juzuk 7 dengan betul, lancar dan bertajwid.
Surah Al-Maidah ayat 82-120.
Surah Al-An'am ayat 1-110.$q$,7),
  (5,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 8$q$,$q$Standard 8: Juzuk 8$q$,$q$8.1 Membaca potongan ayat Juzuk 8 dengan betul dan bertajwid.
8.2 Talaqqi musyafahah membaca 2 ayat Juzuk 8 dengan betul, lancar dan bertajwid.
Surah Al-An'am ayat 111-165.
Surah Al-A'raf ayat 1-87.$q$,8),
  (5,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 9$q$,$q$Standard 9: Juzuk 9$q$,$q$9.1 Membaca potongan ayat Juzuk 9 dengan betul dan bertajwid.
9.2 Talaqqi musyafahah membaca 2 ayat Juzuk 9 dengan betul, lancar dan bertajwid.
Surah Al-A'raf ayat 88-206.
Surah Al-Anfal ayat 1-40.$q$,9),
  (5,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 10$q$,$q$Standard 10: Juzuk 10$q$,$q$10.1 Membaca potongan ayat Juzuk 10 dengan betul dan bertajwid.
10.2 Talaqqi musyafahah membaca 2 ayat Juzuk 10 dengan betul, lancar dan bertajwid.
Surah Al-Anfal ayat 41-75.
Surah At-Taubah ayat 1-92.$q$,10),
  (5,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 11$q$,$q$Standard 11: Juzuk 11$q$,$q$11.1 Membaca potongan ayat Juzuk 11 dengan betul dan bertajwid.
11.2 Talaqqi musyafahah membaca 2 ayat Juzuk 11 dengan betul, lancar dan bertajwid.
Surah At-Taubah ayat 93-129.
Surah Yunus ayat 1-109.
Surah Hud ayat 1-5.$q$,11),
  (5,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 12$q$,$q$Standard 12: Juzuk 12$q$,$q$12.1 Membaca potongan ayat Juzuk 12 dengan betul dan bertajwid.
12.2 Talaqqi musyafahah membaca 2 ayat Juzuk 12 dengan betul, lancar dan bertajwid.
Surah Hud ayat 6-123.
Surah Yusuf ayat 1-52.$q$,12),
  (5,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 13$q$,$q$Standard 13: Juzuk 13$q$,$q$13.1 Membaca potongan ayat Juzuk 13 dengan betul dan bertajwid.
13.2 Talaqqi musyafahah membaca 2 ayat Juzuk 13 dengan betul, lancar dan bertajwid.
Surah Yusuf ayat 53-111.
Surah Ar-Ra'd ayat 1-43.
Surah Ibrahim ayat 1-52.$q$,13),
  (5,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 14$q$,$q$Standard 14: Juzuk 14$q$,$q$14.1 Membaca potongan ayat Juzuk 14 dengan betul dan bertajwid.
14.2 Talaqqi musyafahah membaca 2 ayat Juzuk 14 dengan betul, lancar dan bertajwid.
Surah Al-Hijr ayat 1-99.
Surah An-Nahl ayat 1-128.$q$,14),
  (5,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 15$q$,$q$Standard 15: Juzuk 15$q$,$q$15.1 Membaca potongan ayat Juzuk 15 dengan betul dan bertajwid.
15.2 Talaqqi musyafahah membaca 2 ayat Juzuk 15 dengan betul, lancar dan bertajwid.
Surah Al-Isra' ayat 1-111.
Surah Al-Kahf ayat 1-74.$q$,15),

  (5,$q$HAFAZAN$q$,$q$Hafazan$q$,$q$Surah Al-Insyiqaq$q$,$q$Standard 1: Surah Al-Insyiqaq$q$,$q$1.1 Membaca surah Al-Insyiqaq dengan betul dan bertajwid.
1.2 Menghafaz surah Al-Insyiqaq dengan betul dan lancar.
1.3 Menghafaz surah Al-Insyiqaq dengan betul, lancar dan bertajwid.
1.4 Menghafaz surah Al-Insyiqaq dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.
Surah Al-Insyiqaq ayat 1-25.$q$,16),
  (5,$q$HAFAZAN$q$,$q$Hafazan$q$,$q$Surah Al-Mutaffifin$q$,$q$Standard 2: Surah Al-Mutaffifin$q$,$q$2.1 Membaca surah Al-Mutaffifin dengan betul dan bertajwid.
2.2 Menghafaz surah Al-Mutaffifin dengan betul dan lancar.
2.3 Menghafaz surah Al-Mutaffifin dengan betul, lancar dan bertajwid.
2.4 Menghafaz surah Al-Mutaffifin dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.
Surah Al-Mutaffifin ayat 1-36.$q$,17),
  (5,$q$HAFAZAN$q$,$q$Hafazan$q$,$q$Surah Al-Infitar$q$,$q$Standard 3: Surah Al-Infitar$q$,$q$3.1 Membaca surah Al-Infitar dengan betul dan bertajwid.
3.2 Menghafaz surah Al-Infitar dengan betul dan lancar.
3.3 Menghafaz surah Al-Infitar dengan betul, lancar dan bertajwid.
3.4 Menghafaz surah Al-Infitar dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.
Surah Al-Infitar ayat 1-19.$q$,18),
  (5,$q$HAFAZAN$q$,$q$Hafazan$q$,$q$Surah At-Takwir$q$,$q$Standard 4: Surah At-Takwir$q$,$q$4.1 Membaca surah At-Takwir dengan betul dan bertajwid.
4.2 Menghafaz surah At-Takwir dengan betul dan lancar.
4.3 Menghafaz surah At-Takwir dengan betul, lancar dan bertajwid.
4.4 Menghafaz surah At-Takwir dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.
Surah At-Takwir ayat 1-29.$q$,19),

  (5,$q$TAJWID$q$,$q$Tajwid$q$,$q$Mad dan bahagiannya$q$,$q$Standard 1: Mad dan Bahagiannya$q$,$q$1.1 Menyatakan pengertian mad dan bahagiannya.
1.2 Menyatakan syarat mad dan huruf mad asli.
1.3 Menyatakan bahagian mad.
1.4 Menyatakan bahagian mad dengan betul.$q$,20),
  (5,$q$TAJWID$q$,$q$Tajwid$q$,$q$Mad Asli$q$,$q$Standard 2: Mad Asli$q$,$q$2.1 Menyatakan pengertian mad asli.
2.2 Menyatakan syarat mad asli.
2.3 Menyatakan pembahagian mad asli.
2.4 Membaca misal mad asli dengan betul.
Mad Asli Kalimi: pengertian, kadar panjang bacaan dan contoh.
Mad Asli Harfi: pengertian, kadar panjang bacaan, huruf, contoh dan bacaan potongan ayat Al-Quran.$q$,21),
  (5,$q$TAJWID$q$,$q$Tajwid$q$,$q$Mad Far'i$q$,$q$Standard 3: Mad Far'i$q$,$q$3.1 Menyatakan pengertian mad far'i.
3.2 Menyatakan 2 bahagian mad far'i.
3.3 Menyatakan hukum yang tertibnya dalam mad far'i.
Merangkumi Mad Wajib Muttasil, Mad Jaiz Munfasil, Mad Badal, Mad Silah Tawilah, Mad Farq, Mad Ta'zim, Mad Lazim, Mad Lazim Kalimi Muthaqqal, Mad Lazim Kalimi Mukhaffaf, Mad Lazim Harfi Muthaqqal, Mad Lazim Harfi Mukhaffaf, Mad 'Aridh Lissukun, Mad Lin, Mad 'Iwadh, Mad Tamkin dan Mad Silah Qasirah: pengertian, kadar panjang bacaan, huruf atau misal yang berkaitan dan bacaan contoh dengan betul.$q$,22),
  (5,$q$TAJWID$q$,$q$Tajwid$q$,$q$Tingkatan Mad$q$,$q$Standard 4: Tingkatan Mad$q$,$q$4.1 Menyatakan pengertian tingkatan mad.
4.2 Menyatakan kadar panjang bacaan setiap tingkatan mad.
4.3 Menyatakan tingkatan mad dengan betul.
4.4 Menyatakan tingkatan mad dengan betul serta boleh membimbing rakan sebaya.$q$,23),
  (5,$q$TAJWID$q$,$q$Tajwid$q$,$q$Waqaf$q$,$q$Standard 5: Waqaf$q$,$q$5.1 Menyatakan pengertian waqaf.
5.2 Menyatakan bahagian waqaf.
5.3 Menyatakan jenis waqaf ikhtiari.
5.4 Menyatakan tanda waqaf.
5.5 Menyatakan konsep waqaf dengan betul serta boleh membimbing rakan sebaya.$q$,24),
  (5,$q$TAJWID$q$,$q$Tajwid$q$,$q$Ibtida'$q$,$q$Standard 6: Ibtida'$q$,$q$6.1 Menyatakan pengertian ibtida'.
6.2 Menyatakan jenis ibtida'.
6.3 Membaca misal jenis ibtida'.
6.4 Menyatakan konsep ibtida' dengan betul serta boleh membimbing rakan sebaya.$q$,25),

  (5,$q$TAUHID$q$,$q$Tauhid$q$,$q$Beriman kepada Qada dan Qadar$q$,$q$Standard 1: Beriman kepada Qada dan Qadar$q$,$q$1.1 Menyatakan pengertian qada dan qadar.
1.2 Menyatakan hukum beriman kepada qada dan qadar.
1.3 Menghafaz dalil beriman kepada qada dan qadar.
1.4 Menyatakan maksud beriman kepada qada dan qadar.
1.5 Menyatakan contoh beriman kepada qada dan qadar.
1.6 Menyatakan akibat tidak beriman kepada qada dan qadar.
1.7 Menyatakan hikmah beriman kepada qada dan qadar.$q$,26),
  (5,$q$TAUHID$q$,$q$Tauhid$q$,$q$Hubungan Doa dengan Qadar$q$,$q$Standard 2: Hubungan Doa dengan Qadar$q$,$q$2.1 Menyatakan pengertian doa.
2.2 Menyatakan adab berdoa.
2.3 Menyatakan adab berdoa dalam kehidupan.
2.4 Menyatakan waktu dan tempat mustajab berdoa.
2.5 Menyatakan sebab doa tidak dimakbulkan.
2.6 Menyatakan 2 sebab doa tidak dimakbulkan.$q$,27),
  (5,$q$TAUHID$q$,$q$Tauhid$q$,$q$Al-Asma' al-Husna$q$,$q$Standard 3: Al-Asma' al-Husna$q$,$q$3.1 Menyatakan Al-Asma' al-Husna.
3.2 Menyatakan pengertian Al-Asma' al-Husna.
3.3 Menghafaz Al-Asma' al-Husna dengan lancar.
3.4 Menulis dalil yang berkaitan dengan Al-Asma' al-Husna.
3.5 Menyatakan konsep Al-Asma' al-Husna dengan betul serta boleh membimbing rakan sebaya.
Unit: Al-Rahman hingga Al-Mutakabbir, Al-Khaliq hingga Al-Qabidh, Al-Basit hingga Al-Latif, Al-Khabir hingga Al-Habib, Al-Jalil hingga Al-Syahid.$q$,28),

  (5,$q$FEKAH$q$,$q$Fiqh$q$,$q$Solat Orang Sakit$q$,$q$Standard 1: Solat Orang Sakit$q$,$q$1.1 Menyebut syarat sah solat orang sakit.
1.2 Menyatakan kaifiyat solat secara duduk.
1.3 Menyatakan kaifiyat solat secara baring mengiring.
1.4 Menyatakan kaifiyat solat secara baring menelentang.
1.5 Menyatakan hikmah solat orang sakit.$q$,29),
  (5,$q$FEKAH$q$,$q$Fiqh$q$,$q$Solat dalam Kenderaan$q$,$q$Standard 2: Solat dalam Kenderaan$q$,$q$2.1 Menyebut syarat sah solat dalam kenderaan.
2.2 Menyatakan kaifiyat solat dalam kenderaan.
2.3 Menyatakan hikmah solat dalam kenderaan.
2.4 Mengaplikasikan amali solat dalam kenderaan.$q$,30),
  (5,$q$FEKAH$q$,$q$Fiqh$q$,$q$Solat Sunat Dua Hari Raya$q$,$q$Standard 3: Solat Sunat Dua Hari Raya$q$,$q$3.1 Menyebut lafaz niat dan lafaz takbir solat sunat dua hari raya.
3.2 Menyatakan kaifiyat solat sunat dua hari raya.
3.3 Menyatakan syarat sah solat sunat dua hari raya.
3.4 Menyatakan hikmah solat sunat dua hari raya.
3.5 Melaksanakan simulasi amali solat sunat dua hari raya.$q$,31),
  (5,$q$FEKAH$q$,$q$Fiqh$q$,$q$Pengurusan Jenazah$q$,$q$Standard 4: Pengurusan Jenazah$q$,$q$4.1 Menyatakan konsep pengurusan jenazah.
4.2 Menyatakan konsep pengurusan jenazah dengan betul.
4.3 Menjelaskan dan mengaplikasikan konsep pengurusan jenazah dengan betul dalam kehidupan harian.
4.4 Menyatakan dan mengamalkan konsep pengurusan jenazah dengan sempurna dalam kehidupan harian.
4.5 Membedakan dan mengamalkan konsep pengurusan jenazah dengan sempurna dan istiqamah dalam kehidupan harian.
4.6 Merumus dan mengamalkan konsep pengurusan jenazah dengan sempurna dan istiqamah dalam kehidupan harian serta boleh dicontohi atau membimbing rakan sebaya.$q$,32),
  (5,$q$FEKAH$q$,$q$Fiqh$q$,$q$Puasa$q$,$q$Standard 5: Puasa$q$,$q$5.1 Menyebut pengertian puasa.
5.2 Menyebut dalil dan hukum puasa.
5.3 Menyatakan syarat wajib puasa.
5.4 Menyatakan syarat sah puasa.
5.5 Menyebut rukun puasa dan lafaz niat puasa.
5.6 Menyebut 2 perkara sunat ketika berpuasa.
5.7 Menyebut 2 perkara makruh ketika berpuasa.
5.8 Menyatakan 2 perkara yang membatalkan puasa.
5.9 Menyebut qada, fidyah dan kaffarah puasa.
5.10 Menyatakan 2 puasa sunat.
5.11 Menyatakan hari-hari haram berpuasa.
5.12 Menyatakan hikmah puasa.$q$,33),
  (5,$q$FEKAH$q$,$q$Fiqh$q$,$q$Zakat$q$,$q$Standard 6: Zakat$q$,$q$6.1 Menyatakan pengertian zakat.
6.2 Membaca dalil dan hukum membayar zakat.
6.3 Menyatakan syarat wajib zakat.
6.4 Menyebut bahagian zakat.
6.5 Menyatakan pengertian dan kadar zakat fitrah.
6.6 Menyatakan pengertian dan jenis zakat harta.
6.7 Menyatakan golongan yang berhak menerima zakat.
6.8 Menyatakan hikmah zakat.$q$,34),

  (5,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Adab Berjual Beli$q$,$q$Standard 1: Adab Berjual Beli$q$,$q$1.1 Menyebut pengertian berjual beli.
1.2 Menyebut adab-adab berjual beli.
1.3 Membaca dalil tuntutan berjual beli.
1.4 Menyatakan perkara yang dilarang ketika berjual beli.
1.5 Menyatakan fadhilat beradab ketika berjual beli.
1.6 Menyatakan akibat tidak beradab ketika berjual beli.$q$,35),
  (5,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Adab dalam Majlis$q$,$q$Standard 2: Adab dalam Majlis$q$,$q$2.1 Menyebut pengertian majlis.
2.2 Menyatakan adab dalam majlis.
2.3 Membaca dalil adab dalam majlis.
2.4 Menyatakan fadhilat beradab dalam majlis.
2.5 Menyatakan perkara yang dilarang ketika dalam majlis.
2.6 Menyatakan akibat tidak beradab dalam majlis.$q$,36),
  (5,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Adab kepada Pemimpin$q$,$q$Standard 3: Adab kepada Pemimpin$q$,$q$3.1 Menyebut pengertian pemimpin.
3.2 Menyatakan adab terhadap pemimpin.
3.3 Membaca dalil taat kepada pemimpin.
3.4 Menyatakan fadhilat beradab dengan pemimpin.
3.5 Menyatakan akibat tidak beradab dengan pemimpin.
3.6 Mengamalkan adab terhadap pemimpin secara istiqamah.$q$,37),
  (5,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Sifat Mahmudah$q$,$q$Standard 4: Sifat Mahmudah$q$,$q$4.1 Zuhud: pengertian, dalil, cara-cara, fadhilat dan akibat tidak zuhud.
4.2 Sabar: pengertian, dalil, cara bersabar, fadhilat dan akibat tidak sabar.
4.3 Syukur: pengertian, dalil, ciri-ciri orang bersyukur, fadhilat dan akibat tidak bersyukur.
4.4 Ikhlas: pengertian, dalil, ciri-ciri, fadhilat dan akibat tidak ikhlas.$q$,38),
  (5,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Sifat Mazmumah$q$,$q$Standard 5: Sifat Mazmumah$q$,$q$5.1 Ghadab: maksud, dalil larangan, cara menghindari, fadhilat menjauhi dan akibat bersifat ghadab.
5.2 Hasad: maksud, dalil larangan, ciri-ciri, akibat dan fadhilat tidak bersifat hasad.
5.3 Bakhil: maksud, dalil, ciri-ciri, cara menjauhi, akibat dan fadhilat menjauhi bakhil.
5.4 Hubb al-Jah: pengertian, dalil larangan, ciri-ciri, akibat, cara menjauhi dan fadhilat menjauhinya.$q$,39),

  (5,$q$SIRAH$q$,$q$Sirah$q$,$q$Jihad Nabi Muhammad dan Sahabat$q$,$q$Standard 1: Jihad Nabi Muhammad dan Sahabat$q$,$q$1.1 Konsep jihad: menyatakan pengertian jihad dalam Islam, menyebut 2 jenis jihad dan menyatakan hukum jihad.
1.2 Jenis jihad: menyebut 2 jenis jihad dalam Islam dan menyatakan hikmah jihad dalam Islam.$q$,40),
  (5,$q$SIRAH$q$,$q$Sirah$q$,$q$Peperangan Zaman Nabi Muhammad SAW$q$,$q$Standard 2: Peperangan Zaman Nabi Muhammad SAW$q$,$q$2.1 Menceritakan kisah Perang Badr.
2.2 Menceritakan kisah Perang Uhud.
2.3 Menceritakan kisah Perang Khandaq.
2.4 Menyatakan dan menceritakan sebab berlaku perselisihan dengan kaum Yahudi Bani Nadhir dan Quraizah.$q$,41),
  (5,$q$SIRAH$q$,$q$Sirah$q$,$q$Perjanjian Hudaibiyah$q$,$q$Standard 3: Perjanjian Hudaibiyah$q$,$q$3.1 Menyatakan sebab berlaku Perjanjian Hudaibiyah.
3.2 Menyatakan isi Perjanjian Hudaibiyah.
3.3 Menyatakan kesan Perjanjian Hudaibiyah.
3.4 Menyatakan hubungan dengan negara luar.$q$,42),
  (5,$q$SIRAH$q$,$q$Sirah$q$,$q$Pembukaan Kota Makkah$q$,$q$Standard 4: Pembukaan Kota Makkah$q$,$q$4.1 Menyatakan sebab berlaku pembukaan Kota Makkah.
4.2 Menyatakan tarikh pembukaan Kota Makkah.
4.3 Menyatakan kesan pembukaan Kota Makkah.$q$,43),
  (5,$q$SIRAH$q$,$q$Sirah$q$,$q$Peristiwa Kewafatan Nabi Muhammad SAW$q$,$q$Standard 5: Peristiwa Kewafatan Nabi Muhammad SAW$q$,$q$5.1 Menyatakan peristiwa Haji Wida'.
5.2 Menceritakan peristiwa kewafatan Nabi Muhammad SAW.$q$,44),
  (5,$q$SIRAH$q$,$q$Sirah$q$,$q$Pentadbiran Khalifah Pertama dalam Kerajaan Islam$q$,$q$Standard 6: Pentadbiran Khalifah Pertama dalam Kerajaan Islam$q$,$q$6.1 Menceritakan peristiwa pemilihan Khalifah pertama dalam Islam dan nama Khalifah pertama dalam kerajaan Islam.
6.1.2 Menyatakan nama Khalifah pertama dalam Islam.
6.1.3-6.1.7 Menyatakan dan menceritakan peristiwa pemilihan Khalifah pertama dalam Islam.$q$,45),

  (5,$q$JAWI$q$,$q$Jawi$q$,$q$Kata Berimbuhan an dengan Huruf ان dan ن$q$,$q$Standard 1: Kata yang Menggunakan Imbuhan an dengan Huruf ان dan ن$q$,$q$1.1 Mengeja kata yang menggunakan imbuhan an dengan huruf ان dan ن dengan bimbingan guru.
1.2 Mengeja, membaca dan menulis kata berimbuhan an dengan huruf ان dan ن.
1.3 Mengeja, membaca dan menulis kata berimbuhan an dengan huruf ان dan ن.$q$,46),
  (5,$q$JAWI$q$,$q$Jawi$q$,$q$Kata Berimbuhan i dengan Huruf ي$q$,$q$Standard 2: Kata yang Menggunakan Imbuhan i dengan Huruf ي$q$,$q$2.1 Mengeja, membaca dan menulis kata yang menggunakan imbuhan i dengan huruf ي.
2.2 Mengeja, membaca dan menulis kata yang menggunakan imbuhan i dengan huruf ي.$q$,47),
  (5,$q$JAWI$q$,$q$Jawi$q$,$q$Kata Pinjaman$q$,$q$Standard 3: Kata Pinjaman daripada Bahasa Arab dan Inggeris$q$,$q$3.1 Mengeja, membaca dan menulis kata pinjaman daripada bahasa Arab dalam istilah agama dan umum serta membedakan kaedah ejaan yang betul dan tepat.
3.2 Mengeja, membaca dan menulis kata pinjaman daripada bahasa Inggeris serta membedakan kaedah ejaan yang betul dan tepat.$q$,48),
  (5,$q$JAWI$q$,$q$Jawi$q$,$q$Akronim$q$,$q$Standard 4: Akronim$q$,$q$4.1 Mengeja, membaca dan menulis kata singkatan dan akronim qad kata bahasa Melayu.
4.2 Mengeja, membaca dan menulis kata singkatan dan akronim qad kata bahasa Inggeris.
4.3 Mengeja, membaca, membahagikan dan menulis akronim yang dilafazkan sebagai perkataan dengan betul.
4.4 Mengeja, membaca, membahagikan dan menulis akronim yang dilafazkan sebagai perkataan mengikut kaedah ejaan yang betul dan tepat.$q$,49),

  (5,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Menulis Huruf Jawi ك$q$,$q$Standard 1: Menulis Huruf Jawi ك$q$,$q$1.1 Mengenal dan menulis huruf Jawi ك tunggal mengikut kaedah Khat Naskh.
1.2 Mengenal dan menulis huruf Jawi ك bersambung di awal, tengah dan akhir mengikut kaedah Khat Naskh.$q$,50),
  (5,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Menulis Huruf Jawi ه$q$,$q$Standard 2: Menulis Huruf Jawi ه$q$,$q$2.1 Mengenal dan menulis huruf Jawi ه tunggal mengikut kaedah Khat Naskh.
2.2 Mengenal dan menulis huruf Jawi ه bersambung di awal, tengah dan akhir mengikut kaedah Khat Naskh.$q$,51),
  (5,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Menulis Huruf Jawi ال$q$,$q$Standard 3: Menulis Huruf Jawi ال$q$,$q$3.1 Mengenal dan menulis huruf Jawi ال tunggal mengikut kaedah Khat Naskh.
3.2 Mengenal dan menulis huruf Jawi ال bersambung mengikut kaedah Khat Naskh.$q$,52),
  (5,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Menulis Huruf Jawi ل$q$,$q$Standard 4: Menulis Huruf Jawi ل$q$,$q$4.1 Mengenal dan menulis huruf Jawi ل tunggal mengikut kaedah Khat Naskh.
4.2 Mengenal dan menulis huruf Jawi ل bersambung di awal, tengah dan akhir mengikut kaedah Khat Naskh.$q$,53),
  (5,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Menulis Huruf Jawi م$q$,$q$Standard 5: Menulis Huruf Jawi م$q$,$q$5.1 Mengenal dan menulis huruf Jawi م tunggal mengikut kaedah Khat Naskh.
5.2 Mengenal dan menulis huruf Jawi م bersambung di awal, tengah dan akhir mengikut kaedah Khat Naskh.$q$,54),
  (5,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Menulis Huruf Jawi ن$q$,$q$Standard 6: Menulis Huruf Jawi ن$q$,$q$6.1 Mengenal dan menulis huruf Jawi ن tunggal mengikut kaedah Khat Naskh.
6.2 Mengenal dan menulis huruf Jawi ن bersambung di awal, tengah dan akhir mengikut kaedah Khat Naskh.$q$,55),
  (5,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Menulis Huruf Jawi و$q$,$q$Standard 7: Menulis Huruf Jawi و$q$,$q$7.1 Mengenal dan menulis huruf Jawi و tunggal mengikut kaedah Khat Naskh.
7.2 Mengenal dan menulis huruf Jawi و bersambung di awal, tengah dan akhir mengikut kaedah Khat Naskh.$q$,56),
  (5,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Menulis Huruf Jawi ي$q$,$q$Standard 8: Menulis Huruf Jawi ي$q$,$q$8.1 Mengenal dan menulis huruf Jawi ي tunggal mengikut kaedah Khat Naskh.
8.2 Mengenal dan menulis huruf Jawi ي bersambung di awal, tengah dan akhir mengikut kaedah Khat Naskh.$q$,57),
  (5,$q$IMLAK_KHAT$q$,$q$Imla'$q$,$q$Alif Lam Layyinah$q$,$q$Standard 1: Alif Lam Layyinah$q$,$q$1.1 Mengeja, membaca, menulis dan menyatakan kalimah yang mengandungi Alif Lam Layyinah di tengah kalimah.
1.2 Membaca, menulis dan menyatakan kalimah yang mengandungi Alif Lam Layyinah di akhir kalimah ditulis dengan alif maddah ا.
1.3 Membaca, menulis dan menyatakan kalimah yang mengandungi Alif Lam Layyinah di akhir kalimah ditulis dengan alif maqsurah ى.$q$,58),
  (5,$q$IMLAK_KHAT$q$,$q$Imla'$q$,$q$Ta' Maftuhah ت$q$,$q$Standard 2: Ta' Maftuhah ت$q$,$q$2.1 Membaca dan menulis kalimah yang mengandungi huruf ta' maftuhah.
2.2 Menulis kalimah secara imla' bagi perkataan yang mengandungi huruf ta' maftuhah.
2.3 Menyatakan kalimah yang mengandungi huruf ta' maftuhah.$q$,59),
  (5,$q$IMLAK_KHAT$q$,$q$Imla'$q$,$q$Ta' Marbutah ة$q$,$q$Standard 3: Ta' Marbutah ة$q$,$q$3.1 Membaca kalimah yang mengandungi ta' marbutah ة.
3.2 Menulis kalimah secara imla' bagi perkataan yang mengandungi ta' marbutah ة.
3.3 Menyatakan kalimah yang mengandungi ta' marbutah ة.$q$,60),

  (5,$q$BAHASA_ARAB$q$,$q$Bahasa Arab$q$,$q$الأعداد والأرقام: 401-500$q$,$q$Standard 1: Al-A'dad wa Al-Arqam (401-500)$q$,$q$1.1 Mendengar nombor dan angka 401-500 dengan baik.
1.2 Menyebut nombor dan angka dengan betul.
1.3 Membaca nombor dan angka dengan betul.
1.4 Menulis nombor dan angka dengan betul.
1.5 Mempraktikkan dialog dengan betul.$q$,61),
  (5,$q$BAHASA_ARAB$q$,$q$Bahasa Arab$q$,$q$الضمائر$q$,$q$Standard 2: Al-Dama'ir (Kata Ganti Nama)$q$,$q$2.1 Mendengar kata ganti nama dengan baik.
2.2 Menyebut kata ganti nama dengan betul.
2.3 Membaca kata ganti nama dengan betul.
2.4 Menulis kata ganti nama dengan betul.
2.5 Mempraktikkan dialog dengan betul.$q$,62),
  (5,$q$BAHASA_ARAB$q$,$q$Bahasa Arab$q$,$q$الرحلة إلى شاطئ البحر$q$,$q$Standard 3: Al-Rihlah ila Syati' al-Bahr (Perjalanan ke Pantai)$q$,$q$3.1 Mendengar cerita perjalanan ke pantai dengan baik.
3.2 Menyebut cerita perjalanan ke pantai dengan betul.
3.3 Membaca cerita perjalanan ke pantai dengan betul.
3.4 Menulis cerita perjalanan ke pantai dengan betul.
3.5 Mempraktikkan dialog dengan betul.$q$,63),
  (5,$q$BAHASA_ARAB$q$,$q$Bahasa Arab$q$,$q$الطيور والحشرات$q$,$q$Standard 4: Al-Tuyur wa Al-Hasyarat (Burung dan Serangga)$q$,$q$4.1 Mendengar nama burung dan serangga dengan baik.
4.2 Menyebut nama burung dan serangga dengan betul.
4.3 Membaca nama burung dan serangga dengan betul.
4.4 Menulis nama burung dan serangga dengan betul.
4.5 Mempraktikkan dialog dengan betul.$q$,64),
  (5,$q$BAHASA_ARAB$q$,$q$Bahasa Arab$q$,$q$الأدوات الاتصالية الحديثة$q$,$q$Standard 5: Al-Adawat al-Ittisaliyyah al-Hadithah (Alat Komunikasi Moden)$q$,$q$5.1 Mendengar nama alat komunikasi moden dengan baik.
5.2 Menyebut nama alat komunikasi moden dengan betul.
5.3 Membaca nama alat komunikasi moden dengan betul.
5.4 Menulis nama alat komunikasi moden dengan betul.
5.5 Mempraktikkan dialog dengan betul.$q$,65),
  (5,$q$BAHASA_ARAB$q$,$q$Bahasa Arab$q$,$q$الرحلة إلى حديقة الحيوانات$q$,$q$Standard 6: Al-Rihlah ila Hadiqah al-Hayawanat (Perjalanan ke Zoo)$q$,$q$6.1 Mendengar cerita perjalanan ke zoo dengan baik.
6.2 Menyebut cerita perjalanan ke zoo dengan betul.
6.3 Membaca cerita perjalanan ke zoo dengan betul.
6.4 Menulis cerita perjalanan ke zoo dengan betul.
6.5 Mempraktikkan dialog dengan betul.$q$,66),
  (5,$q$BAHASA_ARAB$q$,$q$Bahasa Arab$q$,$q$حرف النفي وحرف النهي$q$,$q$Standard 7: Huruf al-Nafi wa Huruf al-Nahi$q$,$q$7.1 Mendengar huruf nafi dan huruf nahi dengan baik.
7.2 Menyebut huruf nafi dan huruf nahi dengan betul.
7.3 Membaca huruf nafi dan huruf nahi dengan betul.
7.4 Menulis huruf nafi dan huruf nahi dengan betul.
7.5 Mempraktikkan dialog dengan betul.$q$,67),
  (5,$q$BAHASA_ARAB$q$,$q$Bahasa Arab$q$,$q$حرف الجر$q$,$q$Standard 8: Huruf al-Jar$q$,$q$8.1 Mendengar huruf jar dengan baik.
8.2 Menyebut huruf jar dengan betul.
8.3 Membaca huruf jar dengan betul.
8.4 Menulis huruf jar dengan betul.
8.5 Mempraktikkan dialog dengan betul.$q$,68),
  (5,$q$BAHASA_ARAB$q$,$q$Bahasa Arab$q$,$q$الزيارة إلى المستشفى$q$,$q$Standard 9: Al-Ziyarah ila al-Mustashfa (Lawatan ke Hospital)$q$,$q$9.1 Mendengar cerita lawatan ke hospital dengan baik.
9.2 Menyebut cerita lawatan ke hospital dengan betul.
9.3 Membaca cerita lawatan ke hospital dengan betul.
9.4 Menulis cerita lawatan ke hospital dengan betul.
9.5 Mempraktikkan dialog dengan betul.$q$,69),
  (5,$q$BAHASA_ARAB$q$,$q$Bahasa Arab$q$,$q$الفاعل$q$,$q$Standard 10: Al-Fa'il$q$,$q$10.1 Mendengar contoh fa'il dan tandanya dalam i'rab dengan baik.
10.2 Menyebut contoh fa'il dan tandanya dalam i'rab dengan betul.
10.3 Membaca contoh fa'il dan tandanya dalam i'rab dengan betul.
10.4 Menulis contoh fa'il dan tandanya dalam i'rab dengan betul.
10.5 Mempraktikkan dialog dengan betul.$q$,70),
  (5,$q$BAHASA_ARAB$q$,$q$Bahasa Arab$q$,$q$المفعول به$q$,$q$Standard 11: Al-Maf'ul Bih$q$,$q$11.1 Mendengar contoh maf'ul bih dan tandanya dalam i'rab dengan baik.
11.2 Menyebut contoh maf'ul bih dan tandanya dalam i'rab dengan betul.
11.3 Membaca contoh maf'ul bih dan tandanya dalam i'rab dengan betul.
11.4 Menulis contoh maf'ul bih dan tandanya dalam i'rab dengan betul.
11.5 Mempraktikkan dialog dengan betul.$q$,71),
  (5,$q$BAHASA_ARAB$q$,$q$Bahasa Arab$q$,$q$الفعل الثلاثي المزيد بحرف واحد$q$,$q$Standard 12: Al-Fi'l al-Thulathi al-Mazid bi Harf Wahid$q$,$q$12.1 Mendengar contoh fi'l thulathi mazid bi harf wahid dengan baik.
12.2 Menyebut contoh fi'l thulathi mazid bi harf wahid dengan betul.
12.3 Membaca contoh fi'l thulathi mazid bi harf wahid dengan betul.
12.4 Menulis contoh fi'l thulathi mazid bi harf wahid dengan betul.
12.5 Mempraktikkan dialog dengan betul.$q$,72),
  (5,$q$BAHASA_ARAB$q$,$q$Bahasa Arab$q$,$q$الزيارة إلى المحلات التجارية$q$,$q$Standard 13: Al-Ziyarah ila al-Mahallat al-Tijariyyah (Lawatan ke Pusat Membeli-belah)$q$,$q$13.1 Mendengar cerita lawatan ke pusat membeli-belah dengan baik.
13.2 Menyebut cerita lawatan ke pusat membeli-belah dengan betul.
13.3 Membaca cerita lawatan ke pusat membeli-belah dengan betul.
13.4 Menulis cerita lawatan ke pusat membeli-belah dengan betul.
13.5 Mempraktikkan dialog dengan betul.$q$,73)
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
