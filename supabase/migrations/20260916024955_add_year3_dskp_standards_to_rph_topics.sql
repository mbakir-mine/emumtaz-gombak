alter table public.rph_topic_bank
  add column if not exists standard_kandungan text,
  add column if not exists standard_pembelajaran text;

update public.rph_topic_bank
set status = 'TIDAK_AKTIF', updated_at = now()
where tahun = 3
  and kod_subjek = 'TILAWAH'
  and tajuk = 'Membaca Juzuk 13 hingga 21';

with dskp(tahun, kod_subjek, nama_subjek, tajuk, standard_kandungan, standard_pembelajaran, susunan) as (
  values
  (3,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 13','Standard 1: Juzuk 13','1.1 Membaca ayat-ayat Juzuk 13 dengan betul dan bertajwid.
1.2 Talaqqi musyafahah membaca 2 ayat Juzuk 13 dengan betul, lancar dan bertajwid.
Surah Yusuf ayat 53-111.
Surah Ar-Ra''d ayat 1-43.
Surah Ibrahim ayat 1-52.',1),
  (3,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 14','Standard 2: Juzuk 14','2.1 Membaca ayat-ayat Juzuk 14 dengan betul dan bertajwid.
2.2 Talaqqi musyafahah membaca 2 ayat Juzuk 14 dengan betul, lancar dan bertajwid.
Surah Al-Hijr ayat 1-99.
Surah An-Nahl ayat 1-128.',2),
  (3,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 15','Standard 3: Juzuk 15','3.1 Membaca ayat-ayat Juzuk 15 dengan betul dan bertajwid.
3.2 Talaqqi musyafahah membaca 2 ayat Juzuk 15 dengan betul, lancar dan bertajwid.
Surah Al-Isra'' ayat 1-111.
Surah Al-Kahf ayat 1-110.',3),
  (3,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 16','Standard 4: Juzuk 16','4.1 Membaca ayat-ayat Juzuk 16 dengan betul dan bertajwid.
4.2 Talaqqi musyafahah membaca 2 ayat Juzuk 16 dengan betul, lancar dan bertajwid.
Surah Maryam ayat 1-98.
Surah Taha ayat 1-135.',4),
  (3,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 17','Standard 5: Juzuk 17','5.1 Membaca ayat-ayat Juzuk 17 dengan betul dan bertajwid.
5.2 Talaqqi musyafahah membaca 2 ayat Juzuk 17 dengan betul, lancar dan bertajwid.
Surah Al-Anbiya'' ayat 1-112.
Surah Al-Hajj ayat 1-78.',5),
  (3,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 18','Standard 6: Juzuk 18','6.1 Membaca ayat-ayat Juzuk 18 dengan betul dan bertajwid.
6.2 Talaqqi musyafahah membaca 2 ayat Juzuk 18 dengan betul, lancar dan bertajwid.
Surah Al-Mu''minun ayat 1-118.
Surah An-Nur ayat 1-64.
Surah Al-Furqan ayat 1-77.',6),
  (3,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 19','Standard 7: Juzuk 19','7.1 Membaca ayat-ayat Juzuk 19 dengan betul dan bertajwid.
7.2 Talaqqi musyafahah membaca 2 ayat Juzuk 19 dengan betul, lancar dan bertajwid.
Surah Asy-Syu''ara'' ayat 1-227.
Surah An-Naml ayat 1-93.',7),
  (3,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 20','Standard 8: Juzuk 20','8.1 Membaca ayat-ayat Juzuk 20 dengan betul dan bertajwid.
8.2 Talaqqi musyafahah membaca 2 ayat Juzuk 20 dengan betul, lancar dan bertajwid.
Surah Al-Qasas ayat 1-88.
Surah Al-Ankabut ayat 1-69.',8),
  (3,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 21','Standard 9: Juzuk 21','9.1 Membaca ayat-ayat Juzuk 21 dengan betul dan bertajwid.
9.2 Talaqqi musyafahah membaca 2 ayat Juzuk 21 dengan betul, lancar dan bertajwid.
Surah Ar-Rum ayat 1-60.
Surah Luqman ayat 1-34.
Surah As-Sajadah ayat 1-30.
Surah Al-Ahzab ayat 1-72.',9),
  (3,'HAFAZAN','Hafazan','Surah Al-Qadr','Standard 1: Surah Al-Qadr','1.1 Membaca surah Al-Qadr dengan betul dan bertajwid.
1.2 Menghafaz surah Al-Qadr dengan betul dan lancar.
1.3 Menghafaz surah Al-Qadr dengan betul, lancar dan bertajwid.
1.4 Menghafaz surah Al-Qadr dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.',10),
  (3,'HAFAZAN','Hafazan','Surah Al-''Alaq','Standard 2: Surah Al-''Alaq','2.1 Membaca surah Al-''Alaq dengan betul dan bertajwid.
2.2 Menghafaz surah Al-''Alaq dengan betul dan lancar.
2.3 Menghafaz surah Al-''Alaq dengan betul, lancar dan bertajwid.
2.4 Menghafaz surah Al-''Alaq dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.',11),
  (3,'HAFAZAN','Hafazan','Surah At-Tin','Standard 3: Surah At-Tin','3.1 Membaca surah At-Tin dengan betul dan bertajwid.
3.2 Menghafaz surah At-Tin dengan betul dan lancar.
3.3 Menghafaz surah At-Tin dengan betul, lancar dan bertajwid.
3.4 Menghafaz surah At-Tin dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.',12),
  (3,'HAFAZAN','Hafazan','Surah Asy-Syarh','Standard 4: Surah Asy-Syarh','4.1 Membaca surah Asy-Syarh dengan betul dan bertajwid.
4.2 Menghafaz surah Asy-Syarh dengan betul dan lancar.
4.3 Menghafaz surah Asy-Syarh dengan betul, lancar dan bertajwid.
4.4 Menghafaz surah Asy-Syarh dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.',13),
  (3,'HAFAZAN','Hafazan','Surah Ad-Dhuha','Standard 5: Surah Ad-Dhuha','5.1 Menghafaz surah Ad-Dhuha dengan betul dan bertajwid.
5.2 Menghafaz surah Ad-Dhuha dengan betul dan lancar.
5.3 Menghafaz surah Ad-Dhuha dengan betul, lancar dan bertajwid.
5.4 Menghafaz surah Ad-Dhuha dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.',14),
  (3,'HAFAZAN','Hafazan','Surah Al-Lail','Standard 6: Surah Al-Lail','6.1 Membaca surah Al-Lail dengan betul dan bertajwid.
6.2 Menghafaz surah Al-Lail dengan betul dan lancar.
6.3 Menghafaz surah Al-Lail dengan betul, lancar dan bertajwid.
6.4 Menghafaz surah Al-Lail dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.',15),
  (3,'HAFAZAN','Hafazan','Surah Asy-Syams','Standard 7: Surah Asy-Syams','7.1 Membaca surah Asy-Syams dengan betul dan bertajwid.
7.2 Menghafaz surah Asy-Syams dengan betul dan lancar.
7.3 Menghafaz surah Asy-Syams dengan betul, lancar dan bertajwid.
7.4 Menghafaz surah Asy-Syams dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.',16),
  (3,'HAFAZAN','Hafazan','Surah Al-Balad','Standard 8: Surah Al-Balad','8.1 Membaca surah Al-Balad dengan betul dan bertajwid.
8.2 Menghafaz surah Al-Balad dengan betul dan lancar.
8.3 Menghafaz surah Al-Balad dengan betul, lancar dan bertajwid.
8.4 Menghafaz surah Al-Balad dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.',17),
  (3,'TAJWID','Tajwid','Makhraj Huruf','Standard 1: Makhraj Huruf','1.1 Menyatakan pengertian makhraj huruf.
1.2 Menyebut bahagian makhraj huruf.
1.3 Menyatakan tempat keluar makhraj huruf.
1.1.1 Menyatakan pengertian al-Jauf.
1.1.2 Menyebut misal huruf yang keluar dari makhraj al-Jauf.
1.1.3 Menyebut kalimah mengikut kedudukan huruf yang keluar dari makhraj al-Jauf.
1.2.1 Menyatakan pengertian al-Halq.
1.2.2 Menyebut huruf al-Halq.
1.2.3 Menyatakan huruf yang keluar dari makhraj al-Halq mengikut bahagian.
1.2.4 Membedakan dan menentukan kedudukan huruf yang keluar dari makhraj al-Halq.
1.3.1 Menyatakan pengertian al-Lisan.
1.3.2 Menyebut huruf yang keluar dari makhraj al-Lisan.
1.3.3 Menyatakan 2 huruf yang keluar dari makhraj al-Lisan.
1.3.4 Menyebut bahagian al-Lisan serta huruf-hurufnya.
1.4.1 Menyatakan pengertian asy-Syafatain.
1.4.2 Menyebut 2 huruf yang keluar dari makhraj asy-Syafatain.
1.4.3 Menyatakan 2 huruf yang keluar dari makhraj asy-Syafatain.
1.4.4 Membedakan dan menentukan kedudukan huruf yang keluar dari makhraj asy-Syafatain.
1.5.1 Menyatakan pengertian al-Khaisyum.
1.5.2 Menyebut 2 huruf yang keluar dari makhraj al-Khaisyum.
1.5.3 Menyatakan 2 huruf yang keluar dari makhraj al-Khaisyum.
1.5.4 Membedakan dan menentukan kedudukan huruf yang keluar dari makhraj al-Khaisyum.',18),
  (3,'TAJWID','Tajwid','Nun dan Mim Syaddah','Standard 2: Nun dan Mim Syaddah','2.1 Menyatakan pengertian ghunnah.
2.2 Menyebut 2 hukum ghunnah dan kadar dengung bacaannya.
2.3 Menyebut misal nun dan mim syaddah.
2.4 Mengeluarkan misal nun dan mim syaddah pada ayat Al-Quran.',19),
  (3,'TAJWID','Tajwid','Isti''azah dan Basmalah','Standard 3: Isti''azah dan Basmalah','3.1.1 Menyebut pengertian isti''azah.
3.1.2 Membaca isti''azah dengan betul.
3.1.3 Menulis konsep isti''azah dengan betul.
3.1.4 Menghafaz konsep isti''azah dengan betul.
3.1.5 Mengaplikasikan isti''azah semasa membaca Al-Quran.
3.2.1 Menyebut pengertian basmalah.
3.2.2 Membaca basmalah dengan betul.
3.2.3 Menghafaz lafaz basmalah dengan betul.
3.2.4 Mengaplikasikan basmalah semasa membaca Al-Quran.
3.3.1 Menyatakan pengertian lam tafkhim.
3.3.2 Membaca lam tafkhim dengan betul.
3.3.3 Menghafaz konsep lam tafkhim dengan betul.
3.3.4 Mengaplikasikan lam tafkhim semasa membaca Al-Quran.',20),
  (3,'TAJWID','Tajwid','Lam Lafz al-Jalalah - Lam Tarqiq','Standard 4: Lam Lafz al-Jalalah - Lam Tarqiq','4.1 Menyatakan pengertian lam tarqiq.
4.2 Membaca lam tarqiq dengan betul.
4.3 Menulis konsep lam tarqiq dengan betul.
4.4 Menghafaz konsep lam tarqiq dengan betul.
4.5 Mengaplikasikan lam tarqiq semasa membaca Al-Quran.',21),
  (3,'TAJWID','Tajwid','Penulisan Rasm Uthmani','Standard 5: Penulisan Rasm Uthmani','5.1 Menyebut pengertian rasm Uthmani.
5.2 Menyebut sejarah ringkas rasm Uthmani.
5.3 Menyatakan 2 nama penulisan rasm Uthmani iaitu Rasm Uthmani dan Rasm Imlai.
5.4 Menyebut kelebihan rasm Uthmani.
5.5 Membedakan penulisan imlai dan rasm Uthmani.',22),
  (3,'TAUHID','Tauhid','Beriman kepada Rasul','Standard 1: Beriman kepada Rasul','1.1.1 Menyatakan pengertian beriman kepada rasul.
1.1.2 Menyatakan hukum beriman kepada rasul.
1.1.3 Menghafaz dalil naqli beriman kepada rasul.
1.1.4 Menghafaz dalil beriman kepada rasul.',23),
  (3,'TAUHID','Tauhid','Sifat wajib dan mustahil bagi Rasul','Standard 2: Sifat Wajib dan Mustahil bagi Rasul','2.1.1 Menyatakan pengertian nabi dan rasul.
2.1.2 Membedakan tugas antara nabi dan rasul.
2.1.3 Menghafaz 2 nama rasul yang wajib diketahui.',24),
  (3,'TAUHID','Tauhid','Rasul Ulul Azmi','Standard 3: Rasul Ulul Azmi','3.1.1 Menyatakan pengertian rasul ulul azmi.
3.1.2 Menyatakan 2 nama rasul berkaliber ulul azmi.',25),
  (3,'TAUHID','Tauhid','Ta''at kepada Rasulullah','Standard 4: Taat kepada Rasul','4.1 Menyatakan maksud taat kepada Rasulullah.
4.2 Menyatakan sunnah atau amalan Rasulullah.
4.3 Menghafaz konsep taat kepada Rasulullah dengan betul.',26),
  (3,'TAUHID','Tauhid','Nabi Muhammad penutup para nabi','Standard 5: Nabi Muhammad Penutup Para Nabi','5.1 Menyatakan Nabi Muhammad sebagai penutup para nabi.
5.2 Membaca konsep khatam al-anbiya'' dengan betul.
5.3 Menulis konsep khatam al-anbiya'' dengan betul.
5.4 Menghafaz konsep khatam al-anbiya'' dengan betul dan lancar.',27),
  (3,'TAUHID','Tauhid','Sifat Allah yang wajib dan mustahil','Standard 6: Sifat 20 Allah','6.1 Membaca sifat-sifat Allah yang wajib dan mustahil dengan bimbingan guru.
6.2 Membaca sifat-sifat Allah yang wajib dan mustahil dengan betul.
6.3 Menulis sifat-sifat Allah yang wajib dan mustahil dengan betul.
6.4 Menghafaz sifat-sifat Allah yang wajib dan mustahil dengan betul dan lancar.
6.5 Menjelaskan konsep sifat-sifat Allah yang wajib dan mustahil dengan betul.
6.6 Merumus konsep sifat-sifat Allah yang wajib dan mustahil dengan betul dan boleh membimbing rakan sebaya.
Sifat: Qudrat, Iradat, Ilmu, Hayat, Sam'', Basar, Kalam.
Mustahil: Ajz, Karahah, Jahl, Maut, Samam, Ama, Bakam.',28),
  (3,'FEKAH','Fiqh','Tayammum','Standard 1: Tayammum','1.1 Menyebut pengertian dan lafaz niat tayammum.
1.2 Menyatakan rukun, kaifiyat dan syarat 2 tayammum.
1.3 Menyatakan 2 perkara sunat dan 2 perkara yang membatalkan tayammum.
1.4 Menyatakan hikmah bertayammum.
1.5 Mengaplikasikan amali tayammum.',29),
  (3,'FEKAH','Fiqh','Azan dan Iqamah','Standard 2: Azan dan Iqamah','2.1 Menyatakan pengertian dan hukum azan dan iqamah.
2.2 Melafazkan azan dan iqamah serta menyatakan waktu azan dan iqamah.
2.3 Menyatakan 2 perkara sunat selepas azan dan iqamah.
2.4 Menyatakan hikmah azan dan iqamah.',30),
  (3,'FEKAH','Fiqh','Solat fardhu','Standard 3: Solat Fardu','3.1 Menyatakan pengertian solat fardu.
3.2 Menyatakan 5 waktu solat, bilangan rakaat dan nama rakaat.
3.3 Menyatakan 2 perkara sunat ab''ad dan sunat hai''at.
3.4 Menyatakan 2 perkara yang membatalkan solat dan hikmah solat.
3.5 Mengaplikasikan solat dengan betul.',31),
  (3,'FEKAH','Fiqh','Solat berjemaah','Standard 4: Solat Berjemaah','4.1 Menyatakan pengertian solat berjemaah dan hukumnya.
4.2 Menyatakan syarat sah solat berjemaah.
4.3 Menyatakan hikmah solat berjemaah.',32),
  (3,'AKHLAK','Akhlak Islami','Adab menziarahi orang sakit','Standard 1: Adab Menziarahi Orang Sakit','1.1 Menyebut adab ketika menziarahi orang sakit.
1.2 Membaca, menyatakan dan menghafaz dalil menziarahi orang sakit.
1.3 Membaca, menyatakan dan menghafaz doa menziarahi orang sakit.
1.4 Menyatakan fadhilat beradab ketika menziarahi orang sakit.
1.5 Menyatakan akibat tidak beradab ketika menziarahi orang sakit.',33),
  (3,'AKHLAK','Akhlak Islami','Adab menziarahi rakan','Standard 2: Adab Menziarahi Rakan','2.1 Menyatakan adab menziarahi rakan.
2.2 Menyatakan fadhilat beradab ketika menziarahi rakan.
2.3 Menyebut akibat tidak beradab ketika menziarahi rakan.
2.4 Membaca, menyatakan dan menghafaz dalil adab berziarah.',34),
  (3,'AKHLAK','Akhlak Islami','Bercakap benar','Standard 3: Bercakap Benar','3.1 Menyebut pengertian bercakap benar.
3.2 Membaca dan menghafaz dalil bercakap benar.
3.3 Menyatakan fadhilat bercakap benar.
3.4 Menyatakan akibat bercakap bohong.
3.5 Memahami konsep bercakap benar.',35),
  (3,'AKHLAK','Akhlak Islami','Sabar','Standard 4: Sabar','4.1 Menyatakan pengertian sabar.
4.2 Menyatakan ciri-ciri sabar.
4.3 Menyatakan dalil sifat sabar daripada Al-Quran.
4.4 Menyatakan dalil hadis sifat sabar.
4.5 Menyatakan fadhilat sabar.
4.6 Menyebut akibat tidak bersabar.',36),
  (3,'AKHLAK','Akhlak Islami','Berani','Standard 5: Berani','5.1 Menyatakan pengertian sifat berani.
5.2 Menyatakan ciri-ciri berani.
5.3 Menyatakan dalil bersifat berani.
5.4 Menyatakan fadhilat bersifat berani.
5.5 Menyatakan akibat tidak bersifat berani.
5.6 Menyatakan akibat kisah sifat berani.',37),
  (3,'AKHLAK','Akhlak Islami','Menepati janji','Standard 6: Menepati Janji','6.1 Menyatakan pengertian menepati janji.
6.2 Membaca dan menghafaz dalil menepati janji.
6.3 Menyatakan fadhilat menepati janji.
6.4 Menyatakan akibat tidak menepati janji.',38),
  (3,'AKHLAK','Akhlak Islami','Malu','Standard 7: Malu','7.1 Menyebut pengertian malu.
7.2 Menyebut bahagian malu.
7.3 Membaca dan menghafaz dalil malu.
7.4 Menyatakan fadhilat bersifat malu.
7.5 Menyatakan akibat tidak bersifat malu.',39),
  (3,'AKHLAK','Akhlak Islami','Pemaaf','Standard 8: Pemaaf','8.1 Menyatakan pengertian pemaaf.
8.2 Membaca dan menghafaz dalil bersifat pemaaf.
8.3 Menyatakan fadhilat bersifat pemaaf.
8.4 Menyatakan akibat tidak bersifat pemaaf.
8.5 Menceritakan kisah Nabi Muhammad SAW yang pemaaf.',40),
  (3,'SIRAH','Sirah','Nasab Nabi Muhammad','Standard 1: Nasab Nabi Muhammad SAW','1.1.1 Menyatakan kemuliaan bangsa Arab Quraisy.
1.2.1 Menyatakan nasab Nabi Muhammad SAW sebelah bapa.
1.3.1 Menyatakan nasab Nabi Muhammad SAW sebelah ibu.
1.4.1 Menyatakan nasab Nabi Muhammad SAW sebelah ibu dan bapa.',41),
  (3,'SIRAH','Sirah','Peristiwa kelahiran Nabi Muhammad','Standard 2: Peristiwa Kelahiran Nabi Muhammad SAW','2.1.1 Menyatakan tarikh wafat bapa Nabi Muhammad SAW.
2.1.2 Menceritakan kisah kematian ibu baginda.
2.2.1 Menyatakan tarikh kelahiran Nabi Muhammad SAW.
2.2.2 Menyatakan tempat kelahiran Nabi Muhammad SAW.
2.2.3 Menyatakan tahun kelahiran Nabi Muhammad SAW.
2.2.4 Menceritakan peristiwa kelahiran Nabi Muhammad SAW.
2.2.5 Menghafaz surah Al-Fil dengan lancar.
2.2.6 Menyatakan iktibar peristiwa kelahiran Nabi Muhammad SAW.
2.3.1 Menyatakan nama ibu susu Nabi Muhammad SAW.
2.3.2 Menceritakan kisah yang berlaku semasa baginda disusukan oleh Halimah As-Sa''diah.
2.3.3 Menyatakan kematian ibu dan datuk Nabi Muhammad SAW.',42),
  (3,'SIRAH','Sirah','Akhlak Nabi Muhammad','Standard 3: Akhlak Nabi Muhammad SAW','3.1.1 Menyatakan akhlak Nabi Muhammad SAW ketika kanak-kanak.
3.1.2 Mencontohi akhlak Nabi Muhammad SAW ketika kanak-kanak.
3.2.1 Menyatakan akhlak Nabi Muhammad SAW ketika remaja.
3.2.2 Mencontohi akhlak Nabi Muhammad SAW ketika remaja.
3.3.1 Menyatakan akhlak Nabi Muhammad SAW ketika dewasa.
3.3.2 Mencontohi akhlak Nabi Muhammad SAW ketika dewasa.
3.4 Menceritakan kisah mendapat gelaran Al-Amin.',43),
  (3,'SIRAH','Sirah','Pekerjaan Nabi Muhammad','Standard 4: Pekerjaan Nabi Muhammad SAW','4.1.1 Menceritakan pekerjaan Nabi Muhammad SAW sebagai penggembala kambing.
4.2.1 Menceritakan kisah pekerjaan Nabi Muhammad SAW sebagai peniaga.',44),
  (3,'SIRAH','Sirah','Kehidupan bermasyarakat Nabi Muhammad','Standard 5: Kehidupan Bermasyarakat Nabi Muhammad SAW','5.1.1 Menyatakan 2 sifat mulia Nabi Muhammad SAW ketika berkawan dengan sahabat.
5.1.2 Mengambil iktibar daripada pergaulan Nabi Muhammad SAW.
5.1.3 Mengamalkan cara pergaulan Nabi Muhammad SAW dalam kehidupan harian.
5.2.1 Menyatakan 2 nama sahabat Nabi Muhammad SAW.
5.2.2 Mengambil iktibar daripada pergaulan Nabi Muhammad SAW.
5.2.3 Mengamalkan cara pergaulan Nabi Muhammad SAW dalam kehidupan harian.',45),
  (3,'SIRAH','Sirah','Rumah tangga Nabi Muhammad','Standard 6: Rumah Tangga Nabi Muhammad SAW','6.1.1 Menyatakan sifat mulia Nabi Muhammad SAW dalam berkeluarga.
6.1.2 Menyatakan iktibar daripada sifat mulia Nabi Muhammad SAW dalam berkeluarga.
6.2.1 Menceritakan sifat mulia Nabi Muhammad SAW terhadap isteri.
6.2.2 Menyatakan iktibar daripada sifat mulia Nabi Muhammad SAW dalam berkeluarga.
6.3.1 Menceritakan sifat mulia Nabi Muhammad SAW terhadap mentua.
6.3.2 Menyatakan iktibar daripada sifat mulia Nabi Muhammad SAW dalam berkeluarga.
6.4.1 Menyatakan perlakuan Nabi Muhammad SAW terhadap anak dan cucu.
6.4.2 Menyatakan iktibar daripada sifat mulia Nabi Muhammad SAW dalam berkeluarga.',46),
  (3,'JAWI','Jawi','Perkataan berakhir suku kata tertutup konsonan k','Standard 1: Perkataan Berakhir dengan Suku Kata Tertutup Konsonan k','1.1 Mengeja dan membaca perkataan berakhir dengan suku kata tertutup konsonan k, padan huruf ق dan ك dengan betul.
1.2 Membaca dan menulis perkataan berakhir dengan suku kata tertutup konsonan k, padan huruf ق dan ك.
1.3 Membedakan kaedah penulisan perkataan berakhir dengan suku kata tertutup konsonan k, padan huruf ق dan ك dengan betul.',47),
  (3,'JAWI','Jawi','Hukum k pada suku kata terbuka','Standard 2: Hukum k pada Suku Kata Terbuka dalam Bahasa Melayu','2.1 Mengeja dan membaca perkataan berakhir dengan da, ra, la, wa, nga mengikut sebutan yang betul dengan bimbingan guru.
2.2 Membaca dan menulis perkataan berakhir dengan da, ra, la, wa, nga mengikut sebutan yang betul.
2.3 Membedakan perkataan berakhir dengan da, ra, la, wa, nga mengikut kaedah penulisan yang betul.',48),
  (3,'JAWI','Jawi','Perkataan berakhir bunyi a-a bertukar vokal','Standard 3: Perkataan Berakhir dengan Bunyi a-a Bertukar Vokal','3.1 Menyebut perkataan berakhir dengan ba, ta, pa, sa, ga, na, nya, ca, ya, ka, ja, ma dengan betul.
3.2 Membaca perkataan berakhir dengan ba, ta, pa, sa, ga, na, nya, ca, ya, ka, ja, ma dengan betul.
3.3 Menulis perkataan berakhir dengan ba, ta, pa, sa, ga, na, nya, ca, ya, ka, ja, ma.
3.4 Membedakan kaedah penulisan perkataan berakhir dengan ba, ta, pa, sa, ga, na, nya, ca, ya, ka, ja, ma.',49),
  (3,'JAWI','Jawi','Perkataan mengandungi tik','Standard 4: Perkataan Mengandungi Tik','4.1 Mengeja dan membaca perkataan mengandungi tik suku kata atau lebih.
4.2 Menulis perkataan mengandungi tik suku kata atau lebih.
4.3 Menerangkan kaedah penulisan perkataan mengandungi tik suku kata atau lebih dalam bahasa Melayu.
4.2.1 Mengeja dan membaca perkataan daripada bahasa Inggeris.
4.2.2 Menulis perkataan daripada bahasa Inggeris.
4.2.3 Membedakan kata asal bahasa Melayu dengan bahasa Inggeris yang mengandungi tik suku kata atau lebih dalam tulisan Jawi.',50),
  (3,'JAWI','Jawi','Ejaan Jawi lama','Standard 5: Ejaan Jawi Lama','5.1 Mengeja dan membaca perkataan mengikut ejaan Jawi lama.
5.2 Membaca perkataan ejaan Jawi lama dengan betul.
5.3 Menulis perkataan ejaan Jawi lama dengan betul.
5.4 Menjawikan ayat yang mengandungi perkataan ejaan Jawi lama.',51),
  (3,'JAWI','Jawi','Perkataan mengandungi bunyi diftong','Standard 6: Perkataan Mengandungi Bunyi Diftong','6.1.1 Mengeja dan membaca perkataan mengandungi bunyi diftong ai dengan betul.
6.1.2 Membaca perkataan mengandungi bunyi diftong ai dengan betul.
6.1.3 Menulis perkataan mengandungi bunyi diftong ai dengan betul.
6.2.1 Mengeja dan membaca perkataan mengandungi bunyi diftong au dengan betul.
6.2.2 Membaca perkataan mengandungi bunyi diftong au dengan betul.
6.2.3 Menulis perkataan mengandungi bunyi diftong au dengan betul.
6.3.1 Mengeja dan membaca perkataan mengandungi bunyi diftong oi dengan betul.
6.3.2 Membaca perkataan mengandungi bunyi diftong oi dengan betul.
6.3.3 Menulis perkataan mengandungi bunyi diftong oi dengan betul.',52),
  (3,'IMLAK_KHAT','Khat','Perayaan kaligrafi Islam (mengenal peralatan)','Standard 1: Mengenal Peralatan Kaligrafi Islam','1.1 Mengenal peralatan kaligrafi Islam.
1.2 Mengenal sejarah ringkas kaligrafi Islam.
1.3 Mengenal jenis-jenis khat.',53),
  (3,'IMLAK_KHAT','Khat','Membentuk titik','Standard 2: Khat Naskh - Menulis Titik','2.1 Mengenal bentuk titik mengikut kaedah Khat Naskh.
2.2 Menulis titik mengikut kaedah Khat Naskh.
2.3 Menulis bentuk titik mengikut kaedah Khat Naskh dengan betul.',54),
  (3,'IMLAK_KHAT','Khat','Menulis huruf Jawi tunggal mengikut kaedah Khat Naskh','Standard 3: Khat Naskh - Menulis Huruf Jawi Tunggal','3.1 Mengenal bentuk huruf Jawi tunggal mengikut kaedah Khat Naskh.
3.2 Menulis huruf Jawi tunggal mengikut kaedah Khat Naskh.
3.3 Menulis huruf Jawi tunggal mengikut kaedah Khat Naskh dengan betul mengikut kiraan titik di atas karisen dasar.',55),
  (3,'IMLAK_KHAT','Khat','Menulis huruf Jawi bersambung mengikut kaedah Khat Naskh','Standard 4-6: Khat Naskh - Menulis Huruf Jawi Tunggal dan Bersambung','4.1.1 Mengenal bentuk huruf Jawi ب، ت، ث tunggal mengikut kaedah Khat Naskh.
4.1.2 Menulis bentuk huruf Jawi ب، ت، ث tunggal mengikut kaedah Khat Naskh dengan betul.
4.2.1 Mengenal bentuk huruf Jawi ب، ت، ث bersambung mengikut kaedah Khat Naskh.
4.2.2 Menulis bentuk huruf Jawi ب، ت، ث bersambung mengikut kaedah Khat Naskh dengan betul.
5.1.1 Mengenal bentuk huruf Jawi د، ذ tunggal mengikut kaedah Khat Naskh.
5.1.2 Menulis bentuk huruf Jawi د، ذ tunggal mengikut kaedah Khat Naskh dengan betul.
5.2.1 Mengenal bentuk huruf Jawi د، ذ bersambung mengikut kaedah Khat Naskh.
5.2.2 Menulis bentuk huruf Jawi د، ذ bersambung mengikut kaedah Khat Naskh dengan betul.
6.1.1 Mengenal bentuk huruf Jawi ج، ح، خ tunggal mengikut kaedah Khat Naskh.
6.1.2 Menulis bentuk huruf Jawi ج، ح، خ tunggal mengikut kaedah Khat Naskh dengan betul.
6.2.1 Mengenal bentuk huruf Jawi ج، ح، خ bersambung mengikut kaedah Khat Naskh.
6.2.2 Menulis bentuk huruf Jawi ج، ح، خ bersambung mengikut kaedah Khat Naskh dengan betul.',56),
  (3,'IMLAK_KHAT','Imla''','Ism mufrad mudzakkar','Standard 1: Kalimah Ism Mufrad Mudzakkar','1.1 Mendengar dan membaca kalimah ism mufrad mudzakkar dengan betul.
1.2 Mengenal dan menyatakan kalimah ism mufrad mudzakkar.
1.3 Menulis kalimah ism mufrad mudzakkar.',57),
  (3,'IMLAK_KHAT','Imla''','Ism muthanna mudzakkar','Standard 2: Kalimah Ism Muthanna Mudzakkar','2.1 Mendengar dan membaca kalimah ism muthanna mudzakkar dengan betul.
2.2 Mengenal dan menyatakan kalimah ism muthanna mudzakkar.
2.3 Menulis kalimah ism muthanna mudzakkar.',58),
  (3,'IMLAK_KHAT','Imla''','Ism mufrad muannath','Standard 3: Kalimah Ism Mufrad Muannath','3.1 Mendengar dan membaca kalimah ism mufrad muannath dengan betul.
3.2 Mengenal dan menyatakan kalimah ism mufrad muannath.
3.3 Menulis kalimah ism mufrad muannath.',59),
  (3,'IMLAK_KHAT','Imla''','Ism muthanna muannath','Standard 4: Kalimah Ism Muthanna Muannath','4.1 Mendengar dan membaca kalimah ism muthanna muannath dengan betul.
4.2 Mengenal dan menyatakan kalimah ism muthanna muannath.
4.3 Menulis kalimah ism muthanna muannath.',60),
  (3,'IMLAK_KHAT','Imla''','Ism jamak mudzakkar salim','Standard 5: Kalimah Ism Jamak Mudzakkar Salim','5.1 Mendengar dan membaca kalimah ism jamak mudzakkar salim dengan betul.
5.2 Mengenal dan menyatakan kalimah ism jamak mudzakkar salim.
5.3 Menulis kalimah ism jamak mudzakkar salim.',61),
  (3,'IMLAK_KHAT','Imla''','Ism jamak muannath salim','Standard 6: Kalimah Ism Jamak Muannath Salim','6.1 Mendengar dan membaca kalimah ism jamak muannath salim dengan betul.
6.2 Mengenal dan menyatakan kalimah ism jamak muannath salim.
6.3 Menulis kalimah ism jamak muannath salim.',62),
  (3,'BAHASA_ARAB','Bahasa Arab','Al-A''dad wa Al-Arqam 201-300','Standard 1: Al-A''dad wa Al-Arqam (201-300)','1.1 Mendengar nombor dan angka 201-300 dengan baik.
1.2 Menyebut nombor dan angka dengan betul.
1.3 Membaca nombor dan angka dengan betul.
1.4 Menulis nombor dan angka dengan betul.
1.5 Mempraktikkan dialog dengan betul.',63),
  (3,'BAHASA_ARAB','Bahasa Arab','Al-Adawat al-Manziliyyah','Standard 2: Al-Adawat al-Manziliyyah (Peralatan Rumah)','2.1 Mendengar dialog tentang peralatan rumah dengan baik.
2.2 Menyebut dialog tentang peralatan rumah dengan betul.
2.3 Membaca mufradat peralatan rumah.
2.4 Menulis mufradat peralatan rumah dengan betul.
2.5 Mempraktikkan mufradat peralatan rumah.',64),
  (3,'BAHASA_ARAB','Bahasa Arab','Al-Adawat al-Matbakhiyyah','Standard 3: Al-Adawat al-Matbakhiyyah (Peralatan Dapur)','3.1 Mendengar dialog tentang peralatan dapur dengan baik.
3.2 Menyebut mufradat peralatan dapur.
3.3 Membaca mufradat peralatan dapur dengan betul.
3.4 Menulis mufradat peralatan dapur dengan betul.
3.5 Mempraktikkan dialog dengan betul.',65),
  (3,'BAHASA_ARAB','Bahasa Arab','Asy-Syuhur','Standard 4: Asy-Syuhur (Bulan)','4.1 Mendengar dialog tentang bulan Hijrah dan Masihi.
4.2 Menyebut nama bulan Hijrah dan Masihi.
4.3 Membaca nama bulan Hijrah dan Masihi.
4.4 Menulis nama bulan Hijrah dan Masihi dengan betul.
4.5 Mempraktikkan dialog dengan betul.',66),
  (3,'BAHASA_ARAB','Bahasa Arab','Al-Mudzakkar wa Al-Muannath','Standard 5: Al-Mudzakkar wa Al-Muannath','5.1 Mendengar nama mudzakkar dan muannath dengan baik.
5.2 Menyebut nama mudzakkar dan muannath.
5.3 Membaca nama mudzakkar dan muannath.
5.4 Menulis nama mudzakkar dan muannath dengan betul.
5.5 Mempraktikkan dengan betul.',67),
  (3,'BAHASA_ARAB','Bahasa Arab','Al-Jumlah','Standard 6: Al-Jumlah (Ayat)','6.1 Mendengar dialog tentang jumlah ismiyyah.
6.2 Menyebut jumlah ismiyyah.
6.3 Membaca jumlah ismiyyah.
6.4 Menulis jumlah ismiyyah dengan betul.
6.5 Mempraktikkan dialog dengan betul.',68),
  (3,'BAHASA_ARAB','Bahasa Arab','Al-Mufrad wa Al-Muthanna wa Al-Jamak','Standard 7: Al-Mufrad wa Al-Muthanna wa Al-Jamak','7.1 Mendengar ism mufrad, muthanna dan jamak dengan baik.
7.2 Menyebut ism mufrad, muthanna dan jamak dengan betul.
7.3 Membaca ism mufrad, muthanna dan jamak dengan betul.
7.4 Menulis ism mufrad, muthanna dan jamak dengan betul.
7.5 Menggunakan ism mufrad, muthanna dan jamak dalam ayat yang berguna.',69),
  (3,'BAHASA_ARAB','Bahasa Arab','Fi Al-Madrasah','Standard 8: Fi Al-Madrasah (Di Sekolah)','8.1 Mendengar nama tempat di sekolah dengan baik.
8.2 Menyebut nama tempat di sekolah dengan betul.
8.3 Membaca nama tempat di sekolah dengan betul.
8.4 Menulis nama tempat di sekolah dengan betul.',70),
  (3,'BAHASA_ARAB','Bahasa Arab','Fi Al-Madinah','Standard 9: Fi Al-Madinah (Di Bandar)','9.1 Mendengar nama tempat di bandar dengan baik.
9.2 Menyebut nama tempat di bandar dengan betul.
9.3 Membaca nama tempat di bandar dengan betul.
9.4 Menulis nama tempat di bandar dengan betul.',71)
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
