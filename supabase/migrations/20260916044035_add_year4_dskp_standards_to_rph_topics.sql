alter table public.rph_topic_bank
  add column if not exists standard_kandungan text,
  add column if not exists standard_pembelajaran text;

update public.rph_topic_bank
set status = 'TIDAK_AKTIF', updated_at = now()
where tahun = 4
  and kod_subjek = 'TILAWAH'
  and tajuk = 'Membaca Juzuk 22 hingga 29';

with dskp(tahun, kod_subjek, nama_subjek, tajuk, standard_kandungan, standard_pembelajaran, susunan) as (
  values
  (4,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 22','Standard 1: Juzuk 22','1.1 Membaca ayat-ayat Juzuk 22 dengan betul dan bertajwid.
1.2 Talaqqi musyafahah membaca 2 ayat Juzuk 22 dengan betul, lancar dan bertajwid.
Surah Al-Ahzab ayat 31-72.
Surah Yasin ayat 1-27.',1),
  (4,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 23','Standard 2: Juzuk 23','2.1 Membaca ayat-ayat Juzuk 23 dengan betul dan bertajwid.
2.2 Talaqqi musyafahah membaca 2 ayat Juzuk 23 dengan betul, lancar dan bertajwid.
Surah Yasin ayat 28-83.
Surah Az-Zumar ayat 1-31.',2),
  (4,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 24','Standard 3: Juzuk 24','3.1 Membaca ayat-ayat Juzuk 24 dengan betul dan bertajwid.
3.2 Talaqqi musyafahah membaca 2 ayat Juzuk 24 dengan betul, lancar dan bertajwid.
Surah Az-Zumar ayat 32-75.
Surah Fussilat ayat 1-46.',3),
  (4,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 25','Standard 4: Juzuk 25','4.1 Membaca ayat-ayat Juzuk 25 dengan betul dan bertajwid.
4.2 Talaqqi musyafahah membaca 2 ayat Juzuk 25 dengan betul, lancar dan bertajwid.
Surah Fussilat ayat 47-54.
Surah Asy-Syura ayat 1-37.',4),
  (4,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 26','Standard 5: Juzuk 26','5.1 Membaca ayat-ayat Juzuk 26 dengan betul dan bertajwid.
5.2 Talaqqi musyafahah membaca 2 ayat Juzuk 26 dengan betul, lancar dan bertajwid.
Surah Al-Ahqaf ayat 1-35.
Surah Az-Zariyat ayat 1-30.',5),
  (4,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 27','Standard 6: Juzuk 27','6.1 Membaca ayat-ayat Juzuk 27 dengan betul dan bertajwid.
6.2 Talaqqi musyafahah membaca 2 ayat Juzuk 27 dengan betul, lancar dan bertajwid.
Surah Az-Zariyat ayat 31-60.
Surah Al-Hadid ayat 1-29.',6),
  (4,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 28','Standard 7: Juzuk 28','7.1 Membaca ayat-ayat Juzuk 28 dengan betul dan bertajwid.
7.2 Talaqqi musyafahah membaca 2 ayat Juzuk 28 dengan betul, lancar dan bertajwid.
Surah Al-Mujadilah ayat 1-22.
Surah At-Tahrim ayat 1-12.',7),
  (4,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 29','Standard 8: Juzuk 29','8.1 Membaca ayat-ayat Juzuk 29 dengan betul dan bertajwid.
8.2 Talaqqi musyafahah membaca 2 ayat Juzuk 29 dengan betul, lancar dan bertajwid.
Surah Al-Mulk ayat 1-30.
Surah Al-Mursalat ayat 1-50.',8),
  (4,'HAFAZAN','Hafazan','Surah Al-Fajr','Standard 1: Surah Al-Fajr','1.1 Membaca surah Al-Fajr dengan betul dan bertajwid.
1.2 Menghafaz surah Al-Fajr dengan betul dan lancar.
1.3 Menghafaz surah Al-Fajr dengan betul, lancar dan bertajwid.
1.4 Menghafaz surah Al-Fajr dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.',9),
  (4,'HAFAZAN','Hafazan','Surah Al-Ghasyiyah','Standard 2: Surah Al-Ghasyiyah','2.1 Membaca surah Al-Ghasyiyah dengan betul dan bertajwid.
2.2 Menghafaz surah Al-Ghasyiyah dengan betul dan lancar.
2.3 Menghafaz surah Al-Ghasyiyah dengan betul, lancar dan bertajwid.
2.4 Menghafaz surah Al-Ghasyiyah dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.',10),
  (4,'HAFAZAN','Hafazan','Surah Al-A''la','Standard 3: Surah Al-A''la','3.1 Membaca surah Al-A''la dengan betul dan bertajwid.
3.2 Menghafaz surah Al-A''la dengan betul dan lancar.
3.3 Menghafaz surah Al-A''la dengan betul, lancar dan bertajwid.
3.4 Menghafaz surah Al-A''la dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.',11),
  (4,'HAFAZAN','Hafazan','Surah At-Tariq','Standard 4: Surah At-Tariq','4.1 Membaca surah At-Tariq dengan betul dan bertajwid.
4.2 Menghafaz surah At-Tariq dengan betul dan lancar.
4.3 Menghafaz surah At-Tariq dengan betul, lancar dan bertajwid.
4.4 Menghafaz surah At-Tariq dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.',12),
  (4,'HAFAZAN','Hafazan','Surah Al-Buruj','Standard 5: Surah Al-Buruj','5.1 Membaca surah Al-Buruj dengan betul dan bertajwid.
5.2 Menghafaz surah Al-Buruj dengan betul dan lancar.
5.3 Menghafaz surah Al-Buruj dengan betul, lancar dan bertajwid.
5.4 Menghafaz surah Al-Buruj dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.',13),
  (4,'TAJWID','Tajwid','Hukum Nun Sakinah dan Tanwin','Standard 1: Hukum Nun Sakinah dan Tanwin','1.1 Menyatakan pengertian, tanda dan hukum nun sakinah dan tanwin serta membaca misal.
1.2 Menyatakan pengertian izhar halqi, hurufnya dan membaca misal.
1.3 Menyatakan pengertian, syarat, huruf dan bahagian idgham serta contoh idgham bighunnah dan bila ghunnah.
1.4 Menyatakan pengertian, huruf, hukum bacaan dan membaca misal iqlab.
1.5 Menyatakan pengertian, huruf, hukum bacaan dan membaca misal ikhfa'' haqiqi.',14),
  (4,'TAJWID','Tajwid','Hukum Mim Sakinah','Standard 2: Hukum Mim Sakinah','2.1 Menyatakan pengertian idgham mutamathilain syafawi dan bahagian hukum mim sakinah.
2.2 Menyatakan pengertian dan cara bacaan idgham mutamathilain syafawi.
2.3 Menyatakan pengertian dan cara bacaan ikhfa'' syafawi.
2.4 Menyatakan pengertian dan cara bacaan izhar syafawi serta membaca 2 misal.',15),
  (4,'TAJWID','Tajwid','Qalqalah','Standard 3: Qalqalah','3.1 Menyatakan pengertian, cara bacaan dan huruf qalqalah.
3.2 Menyatakan pengertian, cara bacaan dan membaca 2 misal qalqalah sughra.
3.3 Menyatakan pengertian, cara bacaan dan membaca 2 misal qalqalah wusta.
3.4 Menyatakan pengertian, cara bacaan dan membaca 2 misal qalqalah kubra.',16),
  (4,'TAJWID','Tajwid','Al-Ta''rif','Standard 4: Al-Ta''rif','4.1 Menyatakan pengertian dan bahagian al-Ta''rif.
4.2 Menyatakan pengertian al-Qamariyyah, menyebut hurufnya dan membaca misal.
4.3 Menyatakan pengertian al-Syamsiyyah, menyebut hurufnya dan membaca misal.',17),
  (4,'TAUHID','Tauhid','Qudrat lawannya ''Ajz','Standard 1: Sifat Wajib, Mustahil dan Harus bagi Allah','1.1 Menyatakan pengertian sifat wajib dan mustahil bagi Allah.
1.2 Menyebut dalil sifat wajib dan mustahil bagi Allah.
1.3 Menyebut hukum beriman kepada sifat wajib dan mustahil bagi Allah.
1.4 Menyatakan kesan mempercayai sifat wajib dan mustahil bagi Allah.
Unit Qudrat: menyatakan pengertian sifat Qudrat dan lawannya Ajz, dalil, hukum beriman dan kesannya.',18),
  (4,'TAUHID','Tauhid','Iradat lawannya Karahah','Standard 1: Sifat Wajib, Mustahil dan Harus bagi Allah','Unit Iradat: menyatakan pengertian sifat Iradat dan lawannya Karahah, dalil, hukum beriman dan kesannya.',19),
  (4,'TAUHID','Tauhid','Ilmu lawannya Jahl','Standard 1: Sifat Wajib, Mustahil dan Harus bagi Allah','Unit Ilmu: menyatakan pengertian sifat Ilmu dan lawannya Jahl, dalil, hukum beriman dan kesannya.',20),
  (4,'TAUHID','Tauhid','Hayat lawannya Maut','Standard 1: Sifat Wajib, Mustahil dan Harus bagi Allah','Unit Hayat: menyatakan pengertian sifat Hayat dan lawannya Maut, dalil, hukum beriman dan kesannya.',21),
  (4,'TAUHID','Tauhid','Sam'' lawannya Samam','Standard 1: Sifat Wajib, Mustahil dan Harus bagi Allah','Unit Sam'': menyatakan pengertian sifat Sam'' dan lawannya Samam, dalil, hukum beriman dan kesannya.',22),
  (4,'TAUHID','Tauhid','Basar lawannya ''Ama','Standard 1: Sifat Wajib, Mustahil dan Harus bagi Allah','Unit Basar: menyatakan pengertian sifat Basar dan lawannya Ama, dalil, hukum beriman dan kesannya.',23),
  (4,'TAUHID','Tauhid','Kalam lawannya Bakam','Standard 1: Sifat Wajib, Mustahil dan Harus bagi Allah','Unit Kalam: menyatakan pengertian sifat Kalam dan lawannya Bakam, dalil, hukum beriman dan kesannya.',24),
  (4,'TAUHID','Tauhid','Sifat harus bagi Allah','Standard 1: Sifat Harus bagi Allah','2.1 Menyatakan pengertian sifat harus bagi Allah.
2.2 Menyebut dalil sifat harus bagi Allah.
2.3 Menyebut hukum beriman kepada sifat harus bagi Allah.
2.4 Menyatakan kesan mempercayai sifat harus bagi Allah.',25),
  (4,'TAUHID','Tauhid','Sifat wajib, mustahil dan harus bagi Rasul','Standard 2: Sifat Wajib, Mustahil dan Harus bagi Rasul','2.1 Menyatakan pengertian sifat wajib bagi rasul, 2 sifat wajib dan contoh kisah.
2.2 Menyatakan pengertian sifat mustahil bagi rasul, 2 sifat mustahil dan contoh kisah.
2.3 Menyatakan pengertian sifat harus bagi rasul, 2 sifat harus dan contoh kisah.',26),
  (4,'TAUHID','Tauhid','Beriman kepada hari qiamat','Standard 3: Beriman kepada Hari Qiamat','3.1 Menyatakan pengertian, dalil, golongan manusia yang percaya dan tanda-tanda hari qiamat.
3.2 Membaca, menulis, menghafaz dan menjelaskan nama serta tanda-tanda berlakunya hari qiamat.',27),
  (4,'FEKAH','Fiqh','Solat Jumaat','Standard 1: Solat Jumaat','1.1 Menyatakan pengertian solat Jumaat.
1.2 Menyatakan syarat wajib dan syarat sah solat Jumaat.
1.3 Menyatakan rukun solat Jumaat.
1.4 Menyatakan sunat solat Jumaat.
1.5 Menyatakan hikmah solat Jumaat.
1.6 Melaksanakan simulasi solat Jumaat.',28),
  (4,'FEKAH','Fiqh','Khutbah Jumaat','Standard 2: Khutbah Jumaat','2.1 Menyatakan pengertian khutbah Jumaat.
2.2 Menyatakan rukun khutbah Jumaat.
2.3 Menyatakan syarat sah khutbah Jumaat.
2.4 Menyatakan 2 sunat ketika berkhutbah.
2.5 Menyatakan hikmah khutbah Jumaat.',29),
  (4,'FEKAH','Fiqh','Solat sunat','Standard 3: Solat Sunat','3.1 Solat sunat rawatib: pengertian, lafaz niat, kaifiyat, hikmah dan amalan.
3.2 Solat sunat dhuha: pengertian, lafaz niat, kaifiyat, hikmah dan amalan.
3.3 Solat sunat hajat: pengertian, lafaz niat, kaifiyat, hikmah dan amalan.
3.4 Solat sunat tarawih: pengertian, lafaz niat, kaifiyat, hikmah dan amalan.
3.5 Solat sunat tahajud: pengertian, lafaz niat, kaifiyat, hikmah dan amalan.
3.6 Solat sunat tasbih: pengertian, lafaz niat, kaifiyat, hikmah dan amalan.
3.7 Solat sunat witir: pengertian, lafaz niat, kaifiyat, hikmah dan amalan.
3.9 Solat sunat khusuf: pengertian, lafaz niat, kaifiyat, hikmah dan amalan.',30),
  (4,'FEKAH','Fiqh','Solat jamak dan qasar','Standard 4: Solat Jamak dan Qasar','4.1 Menyatakan pengertian solat jamak dan qasar.
4.2 Menyatakan hukum solat jamak dan qasar.
4.3 Menyatakan syarat sah solat jamak dan qasar.
4.4 Menyatakan bahagian solat jamak dan qasar.
4.5 Menyatakan kaifiyat solat jamak dan qasar.
4.6 Menyatakan lafaz niat solat jamak taqdim, jamak ta''khir, qasar, serta jamak dan qasar.
4.7 Menyatakan hikmah solat jamak dan qasar.',31),
  (4,'AKHLAK','Akhlak Islami','Tolong-menolong dalam perkara kebaikan','Standard 1: Tolong-menolong','1.1 Menyatakan pengertian tolong-menolong.
1.2 Membaca dalil tolong-menolong.
1.3 Menyatakan fadhilat tolong-menolong.
1.4 Menyatakan akibat tidak tolong-menolong.
1.5 Merumus dan mengamalkan konsep tolong-menolong secara istiqamah.',32),
  (4,'AKHLAK','Akhlak Islami','Bertanggungjawab','Standard 2: Bertanggungjawab','2.1 Menyebut pengertian bertanggungjawab.
2.2 Membaca dalil bertanggungjawab.
2.3 Menyatakan bahagian bertanggungjawab.
2.4 Menyatakan fadhilat bertanggungjawab.
2.5 Menyatakan akibat tidak bertanggungjawab.',33),
  (4,'AKHLAK','Akhlak Islami','Adab berjalan','Standard 3: Adab Berjalan','3.1 Menyebut pengertian adab berjalan.
3.2 Menyatakan adab ketika berjalan.
3.3 Membaca doa ketika berjalan.
3.4 Menyatakan fadhilat mengamalkan adab ketika berjalan.
3.5 Merumus dan mengamalkan adab berjalan secara istiqamah.',34),
  (4,'AKHLAK','Akhlak Islami','Adab bermain','Standard 4: Adab Bermain','4.1 Menyebut pengertian adab bermain.
4.2 Menyebut adab sebelum bermain.
4.3 Menyatakan adab semasa bermain.
4.4 Menyatakan adab selepas bermain.
4.5 Menyebut 2 perkara yang dilarang ketika bermain.
4.6 Menyebut fadhilat beradab ketika bermain.
4.7 Menyatakan akibat tidak beradab ketika bermain.',35),
  (4,'AKHLAK','Akhlak Islami','Adab berkomunikasi','Standard 5: Adab Berkomunikasi','5.1 Menyebut pengertian adab berkomunikasi.
5.2 Menyatakan adab berkomunikasi.
5.3 Menghafaz konsep adab berkomunikasi dengan betul.
5.4 Menyatakan konsep adab berkomunikasi dengan betul.
5.5 Merumus dan mengamalkan adab berkomunikasi secara istiqamah.',36),
  (4,'AKHLAK','Akhlak Islami','Adab berjiran','Standard 6: Adab Berjiran','6.1 Menyebut pengertian adab berjiran.
6.2 Membaca dalil adab berjiran.
6.3 Menyatakan adab berjiran.
6.4 Menyebut fadhilat beradab dengan jiran.
6.5 Menyatakan akibat tidak beradab dengan jiran.',37),
  (4,'AKHLAK','Akhlak Islami','Sifat mahmudah','Standard 7: Sifat Mahmudah','7.1 Tawbah: pengertian, dalil, cara bertaubat, fadhilat dan akibat tidak bertaubat.
7.2 Khauf: pengertian, dalil, cara khauf, fadhilat dan akibat tidak khauf.',38),
  (4,'AKHLAK','Akhlak Islami','Sifat mazmumah','Standard 8: Sifat Mazmumah','8.1 Syarah al-Ta''am: pengertian, dalil, ciri-ciri, akibat, fadhilat menjauhi dan cara menjauhi.
8.2 Syarah al-Kalam: pengertian, dalil, ciri-ciri, akibat, fadhilat menjauhi dan cara menjauhi.',39),
  (4,'SIRAH','Sirah','Pelantikan Nabi sebagai Rasul','Standard 1: Pelantikan Nabi Muhammad SAW sebagai Rasul','1.1 Menceritakan peristiwa turunnya wahyu pertama di Gua Hira''.
1.2 Menyatakan sebab dakwah secara rahsia.
1.3 Menyatakan nama orang yang mula-mula beriman.
1.4 Menceritakan dakwah Nabi Muhammad di Bukit Safa.
1.5 Menyatakan bentuk tentangan orang kafir terhadap Rasulullah.',40),
  (4,'SIRAH','Sirah','Hijrah ke Habsyah dan Taif','Standard 2: Hijrah ke Habsyah dan Taif','2.1 Menyatakan pengertian hijrah, sebab hijrah ke Habsyah dan kelebihan Raja Najasyi.
2.2 Menyatakan tindakan penduduk Taif kepada Nabi dan mengambil iktibar daripada peristiwa hijrah ke Habsyah dan Taif.',41),
  (4,'SIRAH','Sirah','Israk dan Mikraj','Standard 3: Israk dan Mikraj','3.1 Menyatakan pengertian Israk dan Mikraj, sebab berlaku, peristiwa, kewajipan solat dan hikmahnya.',42),
  (4,'SIRAH','Sirah','Peristiwa Hijrah ke Madinah','Standard 4: Hijrah ke Yathrib','4.1 Menyatakan pengertian hijrah ke Yathrib, sebab, penduduk yang menyambut Nabi dan pembentukan negara Islam Madinah.
4.2 Menyatakan iktibar dan pengajaran peristiwa hijrah ke Yathrib dan pembinaan masjid.
4.3 Menyatakan lain-lain penduduk Yathrib kepada Nabi Muhammad.
4.4 Menyatakan pembentukan negara Islam Madinah.',43),
  (4,'SIRAH','Sirah','Asas negara Islam pertama: Pembinaan Masjid','Standard 5: Asas Negara Islam yang Pertama','5.1 Menyatakan, menghafaz dan merumus nama masjid yang dibina oleh Rasulullah selepas berhijrah.
5.2-5.6 Menyatakan, menghafaz dan merumus asas pembentukan negara Islam Madinah dari sudut akidah, ibadah, akhlak, pendidikan dan ekonomi.',44),
  (4,'SIRAH','Sirah','Asas negara Islam kedua: Persaudaraan dan perpaduan ummah','Standard 6: Asas Negara Islam yang Kedua','6.1 Menyatakan asas persaudaraan dan perpaduan ummah, cara mewujudkannya, contoh, menjelaskan, menghafaz dan merumus cara mewujudkan perpaduan ummah.',45),
  (4,'SIRAH','Sirah','Asas negara Islam ketiga: Sahifah Madinah','Standard 7: Asas Negara Islam yang Ketiga: Sahifah Madinah','7.1 Menyatakan, menghafaz dan merumus isi kandungan Sahifah Madinah.
7.2 Menyatakan, menghafaz dan merumus kesan Sahifah Madinah.',46),
  (4,'JAWI','Jawi','Kedudukan huruf hamzah','Standard 1: Kedudukan Huruf Hamzah','1.1 Mengeja, membaca, menulis, membezakan dan mempraktikkan kaedah ejaan huruf hamzah di atas huruf alif.
1.2 Mengeja, membaca, menulis, membezakan dan mempraktikkan kaedah ejaan huruf hamzah di bawah huruf alif.
1.3 Mengeja, menulis, membezakan dan mempraktikkan huruf hamzah setara atau sejajar.
1.4 Mengeja, membaca, menulis, membezakan dan mempraktikkan huruf hamzah berumah.',47),
  (4,'JAWI','Jawi','Suku kata tertutup vokal a','Standard 2: Suku Kata Tertutup Vokal a','2.1 Mengeja kata ikasku yang mengandungi suku kata tertutup vokal a.
2.2 Membaca kata ikasku yang mengandungi suku kata tertutup vokal a.
2.3 Menulis kata ikasku yang mengandungi suku kata tertutup vokal a.
2.4 Membedakan kata ikasku mengikut kaedah ejaan yang betul.
2.5 Mempraktikkan kaedah ejaan kata ikasku dengan betul dan tepat.',48),
  (4,'JAWI','Jawi','Hukum e-wa','Standard 3: Hukum e-wa','3.1 Membaca perkataan yang mengandungi hukum e-wa.
3.2 Menulis perkataan yang mengandungi hukum e-wa.
3.3 Membedakan perkataan hukum e-wa mengikut kaedah ejaan yang betul.
3.4 Mempraktikkan kaedah ejaan hukum e-wa dengan betul dan tepat.',49),
  (4,'JAWI','Jawi','Imbuhan awalan dan akhiran','Standard 4: Imbuhan Awalan dan Akhiran','4.1-4.10 Mengeja, membaca, menulis, membezakan dan mempraktikkan kaedah ejaan perkataan berimbuhan awalan ber-, ter-, meN-, di- serta akhiran -kan, -i dan -an dengan betul.',50),
  (4,'IMLAK_KHAT','Khat','Menulis huruf Jawi: ط، ظ','Standard 1: Khat Naskh - Huruf Jawi ط','1.1 Mengenal dan menulis huruf Jawi ط tunggal mengikut kaedah Khat Naskh.
1.2 Mengenal dan menulis huruf Jawi ط bersambung di awal, tengah dan akhir mengikut kaedah Khat Naskh.',51),
  (4,'IMLAK_KHAT','Khat','Menulis huruf Jawi: ف','Standard 2: Khat Naskh - Huruf Jawi ف','2.1 Mengenal dan menulis huruf Jawi ف tunggal mengikut kaedah Khat Naskh.
2.2 Mengenal dan menulis huruf Jawi ف bersambung di awal, tengah dan akhir mengikut kaedah Khat Naskh.',52),
  (4,'IMLAK_KHAT','Khat','Menulis huruf Jawi: ق','Standard 3 dan 7: Khat Naskh - Huruf Jawi ق','3.1/7.1 Mengenal dan menulis huruf Jawi ق tunggal mengikut kaedah Khat Naskh.
3.2/7.2 Mengenal dan menulis huruf Jawi ق bersambung di awal, tengah dan akhir mengikut kaedah Khat Naskh.',53),
  (4,'IMLAK_KHAT','Khat','Menulis huruf Jawi: س، ش','Standard 4: Khat Naskh - Huruf Jawi س dan ش','4.1 Mengenal dan menulis huruf Jawi س dan ش tunggal mengikut kaedah Khat Naskh.
4.2 Mengenal dan menulis huruf Jawi س dan ش bersambung di awal, tengah dan akhir mengikut kaedah Khat Naskh.',54),
  (4,'IMLAK_KHAT','Khat','Menulis huruf Jawi: ص، ض','Standard 5: Khat Naskh - Huruf Jawi ص dan ض','5.1 Mengenal dan menulis huruf Jawi ص dan ض tunggal mengikut kaedah Khat Naskh.
5.2 Mengenal dan menulis huruf Jawi ص dan ض bersambung di awal, tengah dan akhir mengikut kaedah Khat Naskh.',55),
  (4,'IMLAK_KHAT','Khat','Menulis huruf Jawi: ع، غ','Standard 6: Khat Naskh - Huruf Jawi ع dan غ','6.1 Mengenal dan menulis huruf Jawi ع dan غ tunggal mengikut kaedah Khat Naskh.
6.2 Mengenal dan menulis huruf Jawi ع dan غ bersambung di awal, tengah dan akhir mengikut kaedah Khat Naskh.',56),
  (4,'IMLAK_KHAT','Imla''','Hamzah di awal, tengah dan akhir kalimah','Standard 1: Huruf Hamzah di Awal, Tengah dan Akhir Kalimah','1.1 Mengeja, membaca, menulis dan menyatakan kalimah atau ayat yang mengandungi huruf hamzah di awal kalimah.
1.2 Mengeja, membaca, menulis dan menyatakan kalimah atau ayat yang mengandungi huruf hamzah di tengah kalimah.
1.3 Mengeja, membaca, menulis dan menyatakan kalimah atau ayat yang mengandungi huruf hamzah di akhir kalimah.',57),
  (4,'IMLAK_KHAT','Imla''','Hamzah ditulis di atas huruf wau','Standard 2: Huruf Hamzah Ditulis di Atas Huruf Wau','2.1 Mengenal kalimah atau ayat yang mengandungi huruf hamzah ditulis di atas huruf wau.
2.2 Membaca kalimah atau ayat yang mengandungi huruf hamzah ditulis di atas huruf wau.
2.3 Menulis kalimah atau ayat yang mengandungi huruf hamzah ditulis di atas huruf wau.
2.4 Menyatakan kalimah atau ayat yang mengandungi huruf hamzah ditulis di atas huruf wau.',58),
  (4,'IMLAK_KHAT','Imla''','Alif Lam Qamariyyah','Standard 3.1: Lam Qamariyyah','3.1.1 Membaca kalimah yang mengandungi Lam Qamariyyah.
3.1.2 Membedakan kalimah yang mengandungi Lam Qamariyyah.
3.1.3 Menulis dan menyatakan kalimah yang mengandungi Lam Qamariyyah.
3.1.4 Menulis secara imla'' kalimah atau ayat yang mengandungi lam al-Ta''rif dengan betul.
3.1.5 Menulis secara imla'' dengan betul dan kemas serta boleh membimbing rakan sebaya.',59),
  (4,'IMLAK_KHAT','Imla''','Alif Lam Syamsiyyah','Standard 3.2: Lam Syamsiyyah','3.2.1 Membaca kalimah yang mengandungi Lam Syamsiyyah.
3.2.2 Membedakan kalimah yang mengandungi Lam Syamsiyyah.
3.2.3 Menulis dan menyatakan kalimah yang mengandungi Lam Syamsiyyah.
3.2.4 Menulis secara imla'' kalimah atau ayat yang mengandungi lam al-Ta''rif dengan betul.
3.2.5 Menulis secara imla'' dengan betul dan kemas serta boleh membimbing rakan sebaya.',60),
  (4,'BAHASA_ARAB','Bahasa Arab','الأعداد والأرقام: 301–400','Standard 1: Al-A''dad wa Al-Arqam (301-400)','1.1 Mendengar nombor dan angka 301-400 dengan baik.
1.2 Menyebut nombor dan angka dengan betul.
1.3 Membaca nombor dan angka dengan betul.
1.4 Menulis nombor dan angka dengan betul.
1.5 Mempraktikkan dialog dengan betul.',61),
  (4,'BAHASA_ARAB','Bahasa Arab','المراكب والمواصلات','Standard 2: Al-Marakib wa Al-Muwashalat','2.1 Mendengar nama kenderaan dan pengangkutan dengan baik.
2.2 Menyebut nama kenderaan dan pengangkutan dengan betul.
2.3 Membaca nama kenderaan dan pengangkutan dengan betul.
2.4 Menulis nama kenderaan dan pengangkutan dengan betul.
2.5 Mempraktikkan dialog dengan betul.',62),
  (4,'BAHASA_ARAB','Bahasa Arab','أسماء الإشارة','Standard 3: Asma'' al-Isyarah','3.1 Mendengar kata tunjuk dengan baik.
3.2 Menyebut kata tunjuk dengan betul.
3.3 Membaca kata tunjuk dengan betul.
3.4 Menulis kata tunjuk dengan betul.
3.5 Mempraktikkan dialog dengan betul.',63),
  (4,'BAHASA_ARAB','Bahasa Arab','أسماء الاستفهام','Standard 4: Asma'' al-Istifham','4.1 Mendengar kata tanya dengan baik.
4.2 Menyebut kata tanya dengan betul.
4.3 Membaca kata tanya dengan betul.
4.4 Menulis kata tanya dengan betul.
4.5 Mempraktikkan dialog dengan betul.',64),
  (4,'BAHASA_ARAB','Bahasa Arab','الجملة الفعلية','Standard 5: Al-Jumlah al-Fi''liyyah','5.1 Mendengar ayat fi''liyyah dengan baik.
5.2 Menyebut ayat fi''liyyah dengan betul.
5.3 Membaca ayat fi''liyyah dengan betul.
5.4 Menulis ayat fi''liyyah dengan betul.
5.5 Mempraktikkan dialog dengan betul.',65),
  (4,'BAHASA_ARAB','Bahasa Arab','القصة المختارة: زيارة العم – إما المؤمنون إخوة','Standard 6: Al-Qissah al-Mukhtarah','6.1 Mendengar cerita pilihan dengan baik.
6.2 Menyebut cerita pilihan dengan betul.
6.3 Membaca cerita pilihan dengan betul.
6.4 Menulis cerita pilihan dengan betul.
6.5 Mempraktikkan dialog dengan betul.',66),
  (4,'BAHASA_ARAB','Bahasa Arab','الحوار في المكتبة','Standard 7: Al-Hiwar fi Al-Maktabah','7.1 Mendengar dialog di perpustakaan dengan baik.
7.2 Menyebut dialog di perpustakaan dengan betul.
7.3 Membaca dialog di perpustakaan dengan betul.
7.4 Menulis dialog di perpustakaan dengan betul.
7.5 Mempraktikkan dialog di perpustakaan dengan betul.',67),
  (4,'BAHASA_ARAB','Bahasa Arab','الحوار في الملعب','Standard 8: Al-Hiwar fi Al-Mala''b','8.1 Mendengar dialog di padang dengan baik.
8.2 Menyebut dialog di padang dengan betul.
8.3 Membaca dialog di padang dengan betul.
8.4 Menulis dialog di padang dengan betul.
8.5 Mempraktikkan dialog di padang dengan betul.',68)
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
