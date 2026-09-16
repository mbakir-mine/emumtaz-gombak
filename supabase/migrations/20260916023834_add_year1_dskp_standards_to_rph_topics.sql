alter table public.rph_topic_bank
  add column if not exists standard_kandungan text,
  add column if not exists standard_pembelajaran text;

with dskp(tahun, kod_subjek, nama_subjek, tajuk, standard_kandungan, standard_pembelajaran, susunan) as (
  values
  (1,'TILAWAH','Tilawah Al-Quran','Mengenal huruf hijaiyah dan kalimah Al-Quran berbaris seperti kaedah Iqra''',
   'Standard 1: Huruf Hijaiyah Berbaris Fathah
Standard 2: Membaca Huruf Bersambung dan Kalimah Berbaris Fathah
Standard 3: Membaca Kalimah dan Potongan Ayat Berbaris Fathah, Kasrah dan Dhommah
Standard 4: Membaca dan Menggilap Kalimah/Ayat Mengandungi Hukum Tajwid Baris Tanwin
Standard 5: Membaca Kalimah Mengandungi Hukum Mad ''Aridh Lissukun, Mad ''Iwadh, Mad Silah Qasirah, dan Mad Tamkin
Standard 6: Membaca 2 Ayat Mengandungi Hukum Iqlab, Ikhfa'' Haqiqi dan Nun Sakinah',
   '1.1 Mengenal huruf hijaiyah tunggal.
1.2 Membunyikan huruf hijaiyah berbaris fathah dengan betul.
1.3 Membunyikan huruf hijaiyah berbaris fathah dengan lancar.
1.4 Membunyikan huruf hijaiyah berbaris fathah dengan fasih.
1.5 Membunyikan huruf hijaiyah berbaris fathah dengan lancar dan fasih.
1.6 Membunyikan huruf hijaiyah berbaris fathah dengan lancar dan fasih serta boleh membimbing rakan sebaya.
2.1 Membaca huruf bersambung dan kalimah berbaris fathah dengan betul.
2.2 Membaca kalimah yang mengandungi huruf dan tanda baca mad dengan betul dan bertajwid.
2.3 Membaca kalimah berbaris fathah, kasrah dan dhommah dengan betul dan bertajwid.
2.4 Membaca potongan ayat berbaris fathah, kasrah dan dhommah dengan betul dan bertajwid.
2.5 Membaca potongan ayat berbaris fathah, kasrah dan dhommah dengan lancar dan fasih.
2.6 Membaca potongan ayat berbaris fathah, kasrah dan dhommah dengan lancar dan fasih serta boleh membimbing rakan sebaya.
3.1 Membaca kalimah dan potongan ayat berbaris fathah, kasrah dan dhommah dengan betul dan bertajwid.
3.2 Membaca potongan ayat berbaris fathah, kasrah dan dhommah dengan betul dan bertajwid.
3.3 Membaca potongan ayat berbaris fathah, kasrah dan dhommah dengan lancar dan fasih.
3.4 Membaca potongan ayat berbaris fathah, kasrah dan dhommah dengan lancar dan fasih serta boleh membimbing rakan sebaya.
4.1 Menggilap dan membaca kalimah mengandungi baris tanwin dengan betul.
4.2 Membedakan bacaan mad asli dan mad lain dengan betul.
4.3 Membunyikan mim sakinah berbaris fathah, kasrah dan dhommah dengan betul.
4.4 Membaca dengan bertajwid izhar dan qalqalah dengan betul.
4.5 Membaca dan membedakan potongan ayat mengandungi hukum tajwid dengan lancar dan fasih.
4.6 Membaca dan membedakan potongan ayat mengandungi hukum tajwid dengan lancar dan fasih serta boleh membimbing rakan sebaya.
5.1 Membaca dengan bertajwid hamzah wasal.
5.2 Membaca secara waqaf mad ''aridh lissukun dan ta'' marbutah.
5.3 Membaca kalimah yang mengandungi tanda baca huruf yang mempunyai dua harakat dengan betul dan bertajwid.
5.4 Membaca kalimah yang mengandungi hukum idgham, ikhfa'', iqlab dan nun sakinah.
5.5 Membaca dan membedakan potongan ayat mengandungi hukum tajwid dengan lancar dan fasih.
5.6 Membaca dan membedakan potongan ayat mengandungi hukum tajwid dengan lancar dan fasih serta boleh membimbing rakan sebaya.
6.1 Membaca 2 ayat yang mengandungi hukum iqlab dan ikhfa'' haqiqi dengan betul.
6.2 Membaca potongan surah Al-Mulk, Yasin dan Al-Insan dengan betul dan bertajwid.
6.3 Membaca dan membedakan 2 ayat yang mengandungi tanda waqaf dengan betul.',1),
  (1,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 30','Standard 7: Juzuk 30','7.1 Membaca potongan ayat Juzuk 30 dengan betul dan bertajwid.
7.2 Talaqqi musyafahah membaca 2 ayat Juzuk 30 dengan lancar dan fasih.
Surah An-Naba'' ayat 1-40.
Surah An-Nas ayat 1-6.',2),
  (1,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 1','Standard 8: Juzuk 1','8.1 Membaca potongan ayat Juzuk 1 dengan betul dan bertajwid.
8.2 Talaqqi musyafahah membaca 2 ayat Juzuk 1 dengan lancar dan fasih.
Surah Al-Baqarah ayat 1-141.',3),
  (1,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 2','Standard 9: Juzuk 2','9.1 Membaca potongan ayat Juzuk 2 dengan betul dan bertajwid.
9.2 Talaqqi musyafahah membaca 2 ayat Juzuk 2 dengan lancar dan fasih.
Surah Al-Baqarah ayat 142-252.',4),
  (1,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 3','Standard 10: Juzuk 3','10.1 Membaca potongan ayat Juzuk 3 dengan betul dan bertajwid.
10.2 Talaqqi musyafahah membaca 2 ayat Juzuk 3 dengan lancar dan fasih.
Surah Al-Baqarah ayat 253-286.
Surah Ali Imran ayat 1-91.',5),
  (1,'HAFAZAN','Hafazan','Surah Al-Fatihah','Standard 1: Surah Al-Fatihah','1.1 Membaca surah Al-Fatihah dengan betul dan bertajwid.
1.2 Menghafaz surah Al-Fatihah dengan betul dan lancar.
1.3 Menghafaz surah Al-Fatihah dengan betul, lancar dan fasih.
1.4 Menghafaz surah Al-Fatihah dengan betul, lancar dan fasih serta boleh membimbing rakan sebaya.',6),
  (1,'HAFAZAN','Hafazan','Surah An-Nas','Standard 2: Surah An-Nas','2.1 Membaca surah An-Nas dengan betul dan bertajwid.
2.2 Menghafaz surah An-Nas dengan betul dan lancar.
2.3 Menghafaz surah An-Nas dengan betul, lancar dan fasih.
2.4 Menghafaz surah An-Nas dengan betul, lancar dan fasih serta boleh membimbing rakan sebaya.',7),
  (1,'HAFAZAN','Hafazan','Surah Al-Falaq','Standard 3: Surah Al-Falaq','3.1 Membaca surah Al-Falaq dengan betul dan bertajwid.
3.2 Menghafaz surah Al-Falaq dengan betul dan lancar.
3.3 Menghafaz surah Al-Falaq dengan betul, lancar dan fasih.
3.4 Menghafaz surah Al-Falaq dengan betul, lancar dan fasih serta boleh membimbing rakan sebaya.',8),
  (1,'HAFAZAN','Hafazan','Surah Al-Ikhlas','Standard 4: Surah Al-Ikhlas','4.1 Membaca surah Al-Ikhlas dengan betul dan bertajwid.
4.2 Menghafaz surah Al-Ikhlas dengan betul dan lancar.
4.3 Menghafaz surah Al-Ikhlas dengan betul, lancar dan fasih.
4.4 Menghafaz surah Al-Ikhlas dengan betul, lancar dan fasih serta boleh membimbing rakan sebaya.',9),
  (1,'HAFAZAN','Hafazan','Surah Al-Lahab','Standard 5: Surah Al-Lahab','5.1 Membaca surah dengan betul dan bertajwid.
5.2 Menghafaz surah dengan betul dan lancar.
5.3 Menghafaz surah dengan betul, lancar dan fasih.
5.4 Menghafaz surah dengan betul, lancar dan fasih serta boleh membimbing rakan sebaya.',10),
  (1,'HAFAZAN','Hafazan','Surah An-Nasr','Standard 6: Surah An-Nasr','6.1 Membaca surah dengan betul dan bertajwid.
6.2 Menghafaz surah dengan betul dan lancar.
6.3 Menghafaz surah dengan betul, lancar dan fasih.
6.4 Menghafaz surah dengan betul, lancar dan fasih serta boleh membimbing rakan sebaya.',11),
  (1,'HAFAZAN','Hafazan','Surah Al-Kafirun','Standard 7: Surah Al-Kafirun','7.1 Membaca surah dengan betul dan bertajwid.
7.2 Menghafaz surah dengan betul dan lancar.
7.3 Menghafaz surah dengan betul, lancar dan fasih.
7.4 Menghafaz surah dengan betul, lancar dan fasih serta boleh membimbing rakan sebaya.',12),
  (1,'HAFAZAN','Hafazan','Surah Al-Kauthar','Standard 8: Surah Al-Kauthar','8.1 Membaca surah Al-Kauthar dengan betul dan bertajwid.
8.2 Menghafaz surah Al-Kauthar dengan betul dan lancar.
8.3 Menghafaz surah Al-Kauthar dengan betul, lancar dan fasih.
8.4 Menghafaz surah Al-Kauthar dengan betul, lancar dan fasih serta boleh membimbing rakan sebaya.',13),
  (1,'HAFAZAN','Hafazan','Surah Al-Ma''un','Standard 9: Surah Al-Ma''un','9.1 Membaca surah Al-Ma''un dengan betul dan bertajwid.
9.2 Menghafaz surah Al-Ma''un dengan betul dan lancar.
9.3 Menghafaz surah Al-Ma''un dengan betul, lancar dan fasih.
9.4 Menghafaz surah Al-Ma''un dengan betul, lancar dan fasih serta boleh membimbing rakan sebaya.',14),
  (1,'HAFAZAN','Hafazan','Surah Quraisy','Standard 10: Surah Quraisy','10.1 Membaca surah Quraisy dengan betul dan bertajwid.
10.2 Menghafaz surah Quraisy dengan betul dan lancar.
10.3 Menghafaz surah Quraisy dengan betul, lancar dan fasih.
10.4 Menghafaz surah Quraisy dengan betul, lancar dan fasih serta boleh membimbing rakan sebaya.',15),
  (1,'TAUHID','Tauhid','Iman','Standard 1: Iman','1.1.1 Menyebut pengertian iman.
1.1.2 Menyatakan rukun iman.
1.1.3 Menjelaskan makna tiap-tiap rukun iman.
1.1.4 Menyusun rukun iman mengikut urutan.',16),
  (1,'TAUHID','Tauhid','Islam dan Rukun Islam','Standard 2: Islam dan Rukun Islam','2.1.1 Menyebut pengertian Islam.
2.1.2 Menyatakan rukun Islam.
2.1.3 Menghuraikan tiap-tiap rukun Islam.
2.1.4 Menyusun rukun Islam mengikut urutan.',17),
  (1,'TAUHID','Tauhid','Beriman kepada Allah','Standard 3: Beriman kepada Allah','3.1.1 Menyebut pengertian beriman kepada Allah.
3.2.1 Membaca dalil beriman kepada Allah.',18),
  (1,'TAUHID','Tauhid','Dua Kalimah Syahadah','Standard 4: Dua Kalimah Syahadah','4.1.1 Menyebut lafaz dua kalimah syahadah.
4.2.1 Menyebut pengertian dua kalimah syahadah.
4.3.1 Menghafaz lafaz dua kalimah syahadah dan ertinya.',19),
  (1,'TAUHID','Tauhid','Makrifatullah','Standard 5: Makrifatullah','5.1.1 Menyatakan erti makrifat.
5.2.1 Membaca dalil naqli dan aqli berkenaan makrifat.
5.3.1 Menghafaz dalil naqli berkenaan makrifat.',20),
  (1,'TAUHID','Tauhid','Sifat Allah yang wajib dan mustahil: Wujud lawannya Adam','Standard 6: Sifat Allah yang Wajib dan Mustahil','6.1.1 Menyatakan makna sifat wujud.
6.1.2 Menyebut hukum makna sifat wujud.
6.1.3 Menyatakan 2 faedah mengenal sifat wujud.
6.1.4 Wujud lawannya Adam.',21),
  (1,'FEKAH','Fiqh','Ibadah','Standard 1: Ibadah','1.1 Menyatakan pengertian ibadah.
1.2 Membedakan ibadah umum dan ibadah khusus.
1.3 Menyatakan tujuan manusia dijadikan.
1.4 Membaca dalil dan hikmah ibadah.',22),
  (1,'FEKAH','Fiqh','Taharah','Standard 2: Taharah','2.1 Menyatakan pengertian taharah.
2.2 Menyatakan hukum taharah.
2.3 Menyatakan faedah taharah.',23),
  (1,'FEKAH','Fiqh','Bahagian air','Standard 3: Bahagian Air','3.1 Menyatakan bahagian air dan pengertiannya.
3.2 Menyatakan 2 jenis air yang boleh digunakan untuk bersuci.
Unit 1: Air Mutlak.
Unit 2: Air Musta''mal.
Unit 3: Air Mutanajjis.
Unit 4: Air Muqayyad.
Unit 5: Air Muqid.',24),
  (1,'FEKAH','Fiqh','Wuduk','Standard 4: Wuduk','4.1 Menyebut pengertian dan niat wuduk.
4.2 Menyatakan rukun dan sunat wuduk.
4.3 Menyatakan perkara yang membatalkan wuduk.
4.4 Mengaplikasikan cara berwuduk dengan betul.',25),
  (1,'FEKAH','Fiqh','Istinja''','Standard 5: Istinja''','5.1 Menyebut pengertian dan hukum istinja''.
5.2 Menyatakan cara beristinja'' menggunakan air dan batu.
5.3 Menyatakan larangan beristinja''.',26),
  (1,'AKHLAK','Akhlak Islami','Doa','Standard 1: Adab Berdoa','1.1 Menyatakan adab-adab berdoa.
1.2 Menyatakan fadhilat berdoa.',27),
  (1,'AKHLAK','Akhlak Islami','Adab dan fadhilat kebersihan diri','Standard 2: Adab dan Fadhilat Kebersihan Diri','2.1 Qada'' hajat: menyatakan adab qada'' hajat, membaca dan mengamalkan doa masuk dan keluar tandas, menyebut adab masuk dan keluar tandas, serta menyatakan fadhilat beradab ketika qada'' hajat.
2.2 Mandi: menyatakan adab mandi dan fadhilat mandi.
2.3 Bersugi: menyatakan adab bersugi dan fadhilat bersugi.
2.4 Memotong kuku: menyatakan tertib, adab dan fadhilat memotong kuku.
2.5 Menyisir rambut: menyatakan adab dan fadhilat menyisir rambut.
2.6 Bercelak: menyatakan adab dan fadhilat bercelak.',28),
  (1,'AKHLAK','Akhlak Islami','Menutup aurat','Standard 3: Menutup Aurat','3.1 Aurat: mengenal pasti aurat lelaki dan perempuan, menyatakan hukum menutup aurat, fadhilat menutup aurat dan akibat tidak menutup aurat.
3.2 Memakai pakaian: menyebut adab memakai pakaian, membaca doa memakai pakaian dan menyatakan fadhilat berpakaian.',29),
  (1,'AKHLAK','Akhlak Islami','Adab pergaulan','Standard 4: Adab Pergaulan','4.1 Bersama ibu bapa: menyatakan adab, fadhilat, kesan tidak beradab serta membaca dan menghafaz doa untuk ibu bapa.
4.2 Bersama guru: menyebut adab, fadhilat, kesan tidak beradab serta membaca dan menghafaz doa untuk guru.
4.3 Bersama orang alim: menyebut adab, fadhilat dan akibat tidak beradab dengan orang alim.
4.4 Bersama rakan: menyebut adab, fadhilat dan akibat tidak beradab dengan rakan.
4.5 Bersama orang dewasa: menyebut adab, fadhilat dan akibat tidak beradab dengan orang dewasa.',30),
  (1,'JAWI','Jawi','Huruf-huruf Jawi','Standard 1: Huruf Jawi','1.1 Menyebut huruf Jawi tunggal mengikut sebutan yang betul.
1.2 Menulis huruf Jawi tunggal mengikut kaedah yang betul.
1.3 Membedakan bentuk huruf Jawi tunggal.
1.4 Menerangkan kaedah penulisan huruf Jawi tunggal.
1.5 Membedakan bentuk huruf Jawi tunggal.',31),
  (1,'JAWI','Jawi','Padan huruf vokal','Standard 2: Padan Huruf Vokal','2.1 Menyebut huruf vokal di awal dan di tengah perkataan.
2.2 Membaca dan menulis huruf vokal di awal kata.
2.3 Membaca dan menulis huruf vokal di tengah perkataan.',32),
  (1,'JAWI','Jawi','Padan huruf konsonan','Standard 3: Padan Huruf Konsonan','3.1 Memadankan huruf konsonan Rumi dan Jawi.
3.2 Menyebut padan huruf konsonan Rumi dan Jawi.
3.3 Menulis padan huruf konsonan Rumi dan Jawi.',33),
  (1,'JAWI','Jawi','Pembentukan suku kata terbuka','Standard 4: Pembentukan Suku Kata Terbuka','4.1 Suku kata terbuka.
4.2 Suku kata terbuka vokal a.
4.3 Suku kata terbuka vokal e pepet.
4.4 Suku kata terbuka vokal o dan u.
4.5 Suku kata terbuka vokal e taling dan i.',34),
  (1,'JAWI','Jawi','Suku kata tertutup vokal a','Standard 5: Suku Kata Tertutup Vokal a','5.1 Konsonan: ب، ت، ج، د، ر، س، غ، ڠ، ف، ك، ل، م، ن، و، ه، ي.
5.2 Konsonan: ب، ت، ج، د، ر، س، غ، ڠ، ف، ك، ل، م، ن.
5.3 Konsonan: ك، ل، م، ن.
5.4 Konsonan: و، ه، ي.',35),
  (1,'JAWI','Jawi','Suku kata tertutup vokal e pepet','Standard 6: Suku Kata Tertutup Vokal e Pepet','6.1 Konsonan: ب، ت، ج، د، ر، س، غ، ڠ، ف، ك، ل، م، ن.
6.2 Konsonan: س، غ، ڠ، ف، ك.
6.3 Konsonan: ك، ل، م، ن.',36),
  (1,'BAHASA_ARAB','Bahasa Arab','Huruf Hijaiyah dan Angka','Standard 1: Huruf Hijaiyah dan Angka','1.1 Mendengar huruf hijaiyah dan angka dengan baik.
1.2 Menyebut huruf hijaiyah dan angka dengan betul.
1.3 Membaca huruf hijaiyah dan angka dengan betul.
1.4 Menulis huruf hijaiyah dan angka dengan jelas.
1.5 Menggunakan dan bertutur huruf hijaiyah dan angka dengan betul.
1.6 Menggunakan dan bertutur huruf hijaiyah dan angka dengan betul serta membantu rakan memahami topik.',37),
  (1,'BAHASA_ARAB','Bahasa Arab','Tahiyyah dan Ta''aruf','Standard 2: Tahiyyah dan Ta''aruf','2.1 Mendengar dialog tentang tahiyyah dan ta''aruf dengan baik.
2.2 Mendengar angka dengan baik.
2.3 Menyebut angka dengan betul.
2.4 Menulis mufradat dan angka dengan betul.
2.5 Mempraktikkan dialog dengan betul.
2.6 Menggunakan dan bertutur tahiyyah dan ta''aruf dalam ayat yang berguna serta membantu rakan memahami topik.',38),
  (1,'BAHASA_ARAB','Bahasa Arab','Madrasati','Standard 3: Madrasati','3.1 Mendengar teks tentang keadaan sekolah dan angka dengan baik.
3.2 Menyebut beberapa nama isyarat untuk dekat dan jauh dengan betul.
3.3 Membaca teks tentang keadaan sekolah dan angka dengan betul.
3.4 Menulis mufradat berkaitan Madrasati dan angka dengan betul.
3.5 Mempraktikkan dialog tentang Madrasati dengan betul.
3.6 Menggunakan dan bertutur tentang Madrasati serta membantu rakan memahami topik.',39),
  (1,'BAHASA_ARAB','Bahasa Arab','Al-Adawat al-Dirasiyyah','Standard 4: Al-Adawat al-Dirasiyyah','4.1 Mendengar nama alat pembelajaran dengan baik.
4.2 Menyebut nama alat pembelajaran dengan betul.
4.3 Membaca nama alat pembelajaran dan angka dengan betul.
4.4 Menulis nama alat pembelajaran dan angka dengan jelas.
4.5 Menggunakan nama alat pembelajaran dalam ayat yang berguna.
4.6 Menggunakan dan bertutur nama alat pembelajaran dalam ayat yang berguna serta membantu rakan memahami topik.',40),
  (1,'BAHASA_ARAB','Bahasa Arab','Al-Ayat al-Usbu''iyyah','Standard 5: Al-Ayat al-Usbu''iyyah','5.1 Mendengar nama ayat mingguan dan angka dengan baik.
5.2 Menyebut nama ayat mingguan dan angka dengan betul.
5.3 Membaca nama ayat mingguan dan angka dengan jelas.
5.4 Menulis nama ayat mingguan dan angka dengan betul.
5.5 Menggunakan nama ayat mingguan dalam ayat yang berguna.
5.6 Menggunakan dan bertutur nama ayat mingguan dalam ayat yang berguna serta membantu rakan memahami topik.',41),
  (1,'BAHASA_ARAB','Bahasa Arab','Al-Sa''ah','Standard 6: Al-Sa''ah','6.1 Mendengar sebutan waktu dari jam dan angka dengan baik.
6.2 Menyebut sebutan waktu dari jam dan angka dengan betul.
6.3 Membaca sebutan waktu dari jam dan angka dengan jelas.
6.4 Menulis sebutan waktu dari jam dan angka dengan betul.
6.5 Menggunakan sebutan waktu dari jam dalam ayat yang berguna.
6.6 Menggunakan dan bertutur sebutan waktu dari jam dalam ayat yang berguna serta membantu rakan memahami topik.',42),
  (1,'BAHASA_ARAB','Bahasa Arab','A''da'' al-Jism','Standard 7: A''da'' al-Jism','7.1 Mendengar nama anggota badan dan angka dengan baik.
7.2 Menyebut nama anggota badan dan angka dengan betul.
7.3 Membaca nama anggota badan dan angka dengan jelas.
7.4 Menulis nama anggota badan dan angka dengan betul.
7.5 Menggunakan nama anggota badan dalam ayat yang berguna.
7.6 Menggunakan dan bertutur nama anggota badan dalam ayat yang berguna serta membantu rakan memahami topik.',43),
  (1,'BAHASA_ARAB','Bahasa Arab','Afrad al-Usrah','Standard 8: Afrad al-Usrah','8.1 Mendengar nama ahli keluarga dan angka dengan baik.
8.2 Menyebut nama ahli keluarga dan angka dengan betul.
8.3 Membaca nama ahli keluarga dan angka dengan jelas.
8.4 Menulis nama ahli keluarga dan angka dengan betul.
8.5 Menggunakan nama ahli keluarga dalam ayat yang berguna.
8.6 Menggunakan dan bertutur nama ahli keluarga dalam ayat yang berguna serta membantu rakan memahami topik.',44),
  (1,'BAHASA_ARAB','Bahasa Arab','Al-Hayawanat al-Alifah wa al-Muftarisah','Standard 9: Al-Hayawanat al-Alifah wa al-Muftarisah','9.1 Mendengar nama haiwan jinak dan liar serta angka dengan baik.
9.2 Menyebut nama haiwan jinak dan liar serta angka dengan betul.
9.3 Membaca nama haiwan jinak dan liar serta angka dengan jelas.
9.4 Menulis nama haiwan jinak dan liar serta angka dengan betul.
9.5 Menggunakan nama haiwan jinak dan liar dalam ayat yang berguna.
9.6 Menggunakan dan bertutur nama haiwan jinak dan liar dalam ayat yang berguna serta membantu rakan memahami topik.',45)
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
  susunan = least(public.rph_topic_bank.susunan, excluded.susunan),
  status = 'AKTIF',
  updated_at = now();
