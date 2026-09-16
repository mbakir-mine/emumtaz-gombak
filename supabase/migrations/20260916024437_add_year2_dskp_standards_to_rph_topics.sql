alter table public.rph_topic_bank
  add column if not exists standard_kandungan text,
  add column if not exists standard_pembelajaran text;

update public.rph_topic_bank
set status = 'TIDAK_AKTIF', updated_at = now()
where tahun = 2
  and kod_subjek = 'TILAWAH'
  and tajuk = 'Membaca Juzuk 4 hingga 12';

with dskp(tahun, kod_subjek, nama_subjek, tajuk, standard_kandungan, standard_pembelajaran, susunan) as (
  values
  (2,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 4','Standard 1: Juzuk 4','1.1 Membaca ayat-ayat Juzuk 4 dengan betul dan bertajwid.
1.2 Talaqqi musyafahah membaca 2 ayat Juzuk 4 dengan betul, lancar dan bertajwid.
Surah Ali Imran ayat 93-200.
Surah An-Nisa ayat 1-23.',1),
  (2,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 5','Standard 2: Juzuk 5','2.1 Membaca ayat-ayat Juzuk 5 dengan betul dan bertajwid.
2.2 Talaqqi musyafahah membaca 2 ayat Juzuk 5 dengan betul, lancar dan bertajwid.
Surah An-Nisa ayat 24-147.',2),
  (2,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 6','Standard 3: Juzuk 6','3.1 Membaca ayat-ayat Juzuk 6 dengan betul dan bertajwid.
3.2 Talaqqi musyafahah membaca 2 ayat Juzuk 6 dengan betul, lancar dan bertajwid.
Surah An-Nisa ayat 148-176.
Surah Al-Maidah ayat 1-81.',3),
  (2,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 7','Standard 4: Juzuk 7','4.1 Membaca ayat-ayat Juzuk 7 dengan betul dan bertajwid.
4.2 Talaqqi musyafahah membaca 2 ayat Juzuk 7 dengan betul, lancar dan bertajwid.
Surah Al-Maidah ayat 82-120.
Surah Al-An''am ayat 1-110.',4),
  (2,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 8','Standard 5: Juzuk 8','5.1 Membaca ayat-ayat Juzuk 8 dengan betul dan bertajwid.
5.2 Talaqqi musyafahah membaca 2 ayat Juzuk 8 dengan betul, lancar dan bertajwid.
Surah Al-An''am ayat 111-165.
Surah Al-A''raf ayat 1-87.',5),
  (2,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 9','Standard 6: Juzuk 9','6.1 Membaca ayat-ayat Juzuk 9 dengan betul dan bertajwid.
6.2 Talaqqi musyafahah membaca 2 ayat Juzuk 9 dengan betul, lancar dan bertajwid.
Surah Al-A''raf ayat 88-206.
Surah Al-Anfal ayat 1-40.',6),
  (2,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 10','Standard 7: Juzuk 10','7.1 Membaca ayat-ayat Juzuk 10 dengan betul dan bertajwid.
7.2 Talaqqi musyafahah membaca 2 ayat Juzuk 10 dengan betul, lancar dan bertajwid.
Surah Al-Anfal ayat 41-75.
Surah At-Taubah ayat 1-92.',7),
  (2,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 11','Standard 8: Juzuk 11','8.1 Membaca ayat-ayat Juzuk 11 dengan betul dan bertajwid.
8.2 Talaqqi musyafahah membaca 2 ayat Juzuk 11 dengan betul, lancar dan bertajwid.
Surah At-Taubah ayat 93-129.
Surah Yunus ayat 1-109.
Surah Hud ayat 1-5.',8),
  (2,'TILAWAH','Tilawah Al-Quran','Membaca Juzuk 12','Standard 9: Juzuk 12','9.1 Membaca ayat-ayat Juzuk 12 dengan betul dan bertajwid.
9.2 Talaqqi musyafahah membaca 2 ayat Juzuk 12 dengan betul, lancar dan bertajwid.
Surah Hud ayat 6-123.
Surah Yusuf ayat 1-52.',9),
  (2,'HAFAZAN','Hafazan','Surah Al-Fil','Standard 1: Surah Al-Fil','1.1 Membaca surah Al-Fil dengan betul dan bertajwid.
1.2 Menghafaz surah Al-Fil dengan betul dan lancar.
1.3 Menghafaz surah Al-Fil dengan betul, lancar dan bertajwid.
1.4 Menghafaz surah Al-Fil dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.',10),
  (2,'HAFAZAN','Hafazan','Surah Al-Humazah','Standard 2: Surah Al-Humazah','2.1 Membaca surah Al-Humazah dengan betul dan bertajwid.
2.2 Menghafaz surah Al-Humazah dengan betul dan lancar.
2.3 Menghafaz surah Al-Humazah dengan betul, lancar dan bertajwid.
2.4 Menghafaz surah Al-Humazah dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.',11),
  (2,'HAFAZAN','Hafazan','Surah Al-''Asr','Standard 3: Surah Al-''Asr','3.1 Membaca surah Al-''Asr dengan betul dan bertajwid.
3.2 Menghafaz surah Al-''Asr dengan betul dan lancar.
3.3 Menghafaz surah Al-''Asr dengan betul, lancar dan bertajwid.
3.4 Menghafaz surah Al-''Asr dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.',12),
  (2,'HAFAZAN','Hafazan','Surah At-Takathur','Standard 4: Surah At-Takathur','4.1 Membaca surah At-Takathur dengan betul dan bertajwid.
4.2 Menghafaz surah At-Takathur dengan betul dan lancar.
4.3 Menghafaz surah At-Takathur dengan betul, lancar dan bertajwid.
4.4 Menghafaz surah At-Takathur dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.',13),
  (2,'HAFAZAN','Hafazan','Surah Al-Qari''ah','Standard 5: Surah Al-Qari''ah','5.1 Membaca surah Al-Qari''ah dengan betul dan bertajwid.
5.2 Menghafaz surah Al-Qari''ah dengan betul dan lancar.
5.3 Menghafaz surah Al-Qari''ah dengan betul, lancar dan bertajwid.
5.4 Menghafaz surah Al-Qari''ah dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.',14),
  (2,'HAFAZAN','Hafazan','Surah Al-''Adiyat','Standard 6: Surah Al-''Adiyat','6.1 Membaca surah Al-''Adiyat dengan betul dan bertajwid.
6.2 Menghafaz surah Al-''Adiyat dengan betul dan lancar.
6.3 Menghafaz surah Al-''Adiyat dengan betul, lancar dan bertajwid.
6.4 Menghafaz surah Al-''Adiyat dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.',15),
  (2,'HAFAZAN','Hafazan','Surah Al-Zalzalah','Standard 7: Surah Al-Zalzalah','7.1 Membaca surah Al-Zalzalah dengan betul dan bertajwid.
7.2 Menghafaz surah Al-Zalzalah dengan betul dan lancar.
7.3 Menghafaz surah Al-Zalzalah dengan betul, lancar dan bertajwid.
7.4 Menghafaz surah Al-Zalzalah dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.',16),
  (2,'HAFAZAN','Hafazan','Surah Al-Bayyinah','Standard 8: Surah Al-Bayyinah','8.1 Membaca surah Al-Bayyinah dengan betul dan bertajwid.
8.2 Menghafaz surah Al-Bayyinah dengan betul dan lancar.
8.3 Menghafaz surah Al-Bayyinah dengan betul, lancar dan bertajwid.
8.4 Menghafaz surah Al-Bayyinah dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.',17),
  (2,'TAUHID','Tauhid','Qidam lawannya Huduth','Standard 1: Sifat Allah yang Wajib dan Mustahil','1.1 Menyatakan erti dan makna sifat Qidam, Baqa, Mukhalafatuhu lil Hawadith, Qiyamuhu Binafsihi dan Wahdaniyyah.
1.2 Menyebut hukum makna sifat Qidam, Baqa, Mukhalafatuhu lil Hawadith, Qiyamuhu Binafsihi dan Wahdaniyyah.
1.3 Menyatakan faedah mengenal sifat.
1.4 Menjelaskan konsep sifat Allah yang wajib dan mustahil dengan betul.
1.5 Merumus konsep sifat Allah yang wajib dan mustahil dengan betul serta boleh membimbing rakan sebaya.
Qidam lawannya Huduth.',18),
  (2,'TAUHID','Tauhid','Baqa lawannya Fana','Standard 1: Sifat Allah yang Wajib dan Mustahil','1.1 Menyatakan erti dan makna sifat Qidam, Baqa, Mukhalafatuhu lil Hawadith, Qiyamuhu Binafsihi dan Wahdaniyyah.
1.2 Menyebut hukum makna sifat Qidam, Baqa, Mukhalafatuhu lil Hawadith, Qiyamuhu Binafsihi dan Wahdaniyyah.
1.3 Menyatakan faedah mengenal sifat.
1.4 Menjelaskan konsep sifat Allah yang wajib dan mustahil dengan betul.
1.5 Merumus konsep sifat Allah yang wajib dan mustahil dengan betul serta boleh membimbing rakan sebaya.
Baqa lawannya Fana.',19),
  (2,'TAUHID','Tauhid','Mukhalafatuhu lil hawadith lawannya Mumatsalatuhu lil hawadith','Standard 1: Sifat Allah yang Wajib dan Mustahil','1.1 Menyatakan erti dan makna sifat Qidam, Baqa, Mukhalafatuhu lil Hawadith, Qiyamuhu Binafsihi dan Wahdaniyyah.
1.2 Menyebut hukum makna sifat Qidam, Baqa, Mukhalafatuhu lil Hawadith, Qiyamuhu Binafsihi dan Wahdaniyyah.
1.3 Menyatakan faedah mengenal sifat.
1.4 Menjelaskan konsep sifat Allah yang wajib dan mustahil dengan betul.
1.5 Merumus konsep sifat Allah yang wajib dan mustahil dengan betul serta boleh membimbing rakan sebaya.
Mukhalafatuhu lil Hawadith lawannya Mumatsalatuhu lil Hawadith.',20),
  (2,'TAUHID','Tauhid','Qiyamuhu binafsihi lawannya Qiyamuhu bighairihi','Standard 1: Sifat Allah yang Wajib dan Mustahil','1.1 Menyatakan erti dan makna sifat Qidam, Baqa, Mukhalafatuhu lil Hawadith, Qiyamuhu Binafsihi dan Wahdaniyyah.
1.2 Menyebut hukum makna sifat Qidam, Baqa, Mukhalafatuhu lil Hawadith, Qiyamuhu Binafsihi dan Wahdaniyyah.
1.3 Menyatakan faedah mengenal sifat.
1.4 Menjelaskan konsep sifat Allah yang wajib dan mustahil dengan betul.
1.5 Merumus konsep sifat Allah yang wajib dan mustahil dengan betul serta boleh membimbing rakan sebaya.
Qiyamuhu Binafsihi lawannya Qiyamuhu Bighairihi.',21),
  (2,'TAUHID','Tauhid','Wahdaniyyah lawannya Ta''addud','Standard 1: Sifat Allah yang Wajib dan Mustahil','1.1 Menyatakan erti dan makna sifat Qidam, Baqa, Mukhalafatuhu lil Hawadith, Qiyamuhu Binafsihi dan Wahdaniyyah.
1.2 Menyebut hukum makna sifat Qidam, Baqa, Mukhalafatuhu lil Hawadith, Qiyamuhu Binafsihi dan Wahdaniyyah.
1.3 Menyatakan faedah mengenal sifat.
1.4 Menjelaskan konsep sifat Allah yang wajib dan mustahil dengan betul.
1.5 Merumus konsep sifat Allah yang wajib dan mustahil dengan betul serta boleh membimbing rakan sebaya.
Wahdaniyyah lawannya Ta''addud.',22),
  (2,'TAUHID','Tauhid','Beriman kepada Malaikat','Standard 2: Beriman kepada Malaikat','2.1 Menyebut pengertian beriman kepada malaikat.
2.2 Menyatakan hukum beriman kepada malaikat.
2.3 Menyebut dalil naqli beriman kepada malaikat.
2.4 Menyebut 2 nama, tugas dan sifat malaikat.
2.5 Menjelaskan 2 nama, tugas dan sifat malaikat.
2.6 Merumus 2 nama, tugas dan sifat malaikat dengan betul dan boleh membimbing rakan sebaya.',23),
  (2,'TAUHID','Tauhid','Beriman kepada Kitab','Standard 3: Beriman kepada Kitab','3.1 Menyebut pengertian beriman kepada kitab.
3.2 Menyatakan hukum beriman kepada kitab.
3.3 Menyebut dalil naqli beriman kepada kitab.
3.4 Menyebut nama kitab yang diturunkan Allah SWT kepada para rasul.
3.5 Menyebut nama nabi dan rasul yang diturunkan kitab.
3.6 Merumus konsep beriman kepada kitab dengan betul dan boleh membimbing rakan sebaya.',24),
  (2,'FEKAH','Fiqh','Najis','Standard 1: Najis','1.1 Menyatakan erti najis.
1.2 Menyebut bahagian najis.
1.3 Menyebut contoh najis mukhaffafah, mutawassitah dan mughallazah.
1.4 Menyatakan cara menyucikan najis mukhaffafah, mutawassitah dan mughallazah.
1.5 Menjelaskan konsep najis dan cara menyucikannya dengan betul.
1.6 Merumus konsep najis dan cara menyucikannya dengan betul serta boleh membimbing rakan sebaya.',25),
  (2,'FEKAH','Fiqh','Hadath','Standard 2: Hadath','2.1 Menyebut erti hadath kecil dan besar.
2.2 Menyatakan 2 sebab berhadath kecil dan besar.
2.3 Menyatakan 2 perkara yang menghalang hadath kecil dan besar.
2.4 Melaksanakan cara bersuci daripada hadath kecil dan besar.
2.5 Menjelaskan konsep hadath dan cara bersuci dengan betul.
2.6 Merumus konsep hadath dan cara bersuci dengan betul serta boleh membimbing rakan sebaya.',26),
  (2,'FEKAH','Fiqh','Mandi wajib','Standard 3: Mandi Wajib','3.1 Menyatakan erti mandi wajib.
3.2 Membaca dalil mandi wajib.
3.3 Membaca niat mandi wajib.
3.4 Menyatakan sebab mandi wajib.
3.5 Menyebut rukun dan sunat mandi wajib.
3.6 Melakukan mandi wajib dengan betul.',27),
  (2,'FEKAH','Fiqh','Mandi sunat','Standard 4: Mandi Sunat','4.1 Menyatakan 2 jenis mandi sunat.
4.2 Menyatakan cara mandi sunat.
4.3 Menghafaz lafaz niat mandi sunat.',28),
  (2,'AKHLAK','Akhlak Islami','Adab makan dan minum','Standard 1: Adab Makan dan Minum','1.1 Menyebut adab sebelum makan.
1.2 Menyatakan adab ketika makan dan minum.
1.3 Membaca dan menghafaz doa sebelum makan dan minum.
1.4 Membaca dan menghafaz doa selepas makan dan minum.
1.5 Menyatakan fadhilat beradab semasa makan dan minum.
1.6 Menyatakan akibat tidak beradab semasa makan dan minum.',29),
  (2,'AKHLAK','Akhlak Islami','Adab tidur','Standard 2: Adab Tidur','2.1 Menyatakan adab sebelum tidur.
2.2 Menyatakan adab selepas bangun tidur.
2.3 Membaca doa sebelum tidur.
2.4 Membaca doa selepas bangun tidur.
2.5 Menyatakan fadhilat mengamalkan adab sebelum dan selepas bangun tidur.
2.6 Menyebut akibat tidak beradab sebelum dan selepas bangun tidur.',30),
  (2,'AKHLAK','Akhlak Islami','Adab berkenderaan','Standard 3: Adab Berkenderaan','3.1 Menyatakan adab ketika menaiki kenderaan.
3.2 Membaca dan menghafaz doa ketika menaiki kenderaan.
3.3 Menyebut fadhilat beradab ketika menaiki kenderaan.
3.4 Menyatakan akibat tidak beradab ketika menaiki kenderaan.',31),
  (2,'AKHLAK','Akhlak Islami','Adab di masjid','Standard 4: Adab di Masjid','4.1 Menyatakan adab masuk masjid.
4.2 Menyatakan adab keluar masjid.
4.3 Membaca dan menghafaz doa masuk dan keluar masjid.
4.4 Menyatakan fadhilat beradab di masjid.
4.5 Menyatakan akibat tidak beradab di masjid.',32),
  (2,'AKHLAK','Akhlak Islami','Adab belajar','Standard 5: Adab Belajar','5.1 Menyatakan adab ketika belajar.
5.2 Membaca dan menghafaz doa sebelum belajar.
5.3 Membaca dan menghafaz doa selepas belajar.
5.4 Menyatakan fadhilat beradab ketika belajar.
5.5 Menyebut akibat tidak beradab ketika belajar.',33),
  (2,'AKHLAK','Akhlak Islami','Adab dengan mushaf Al-Quran','Standard 6: Adab dengan Mushaf Al-Quran','6.1 Menyebut adab ketika menyentuh mushaf Al-Quran.
6.2 Menyatakan adab ketika membaca Al-Quran.
6.3 Menyatakan adab ketika menyimpan mushaf Al-Quran.
6.4 Membaca dan menghafaz doa selepas membaca Al-Quran.
6.5 Menyatakan fadhilat beradab ketika menyentuh, membaca dan menyimpan mushaf Al-Quran.',34),
  (2,'AKHLAK','Akhlak Islami','Adab memelihara harta benda awam','Standard 7: Adab Memelihara Harta Benda Awam','7.1 Menyebut pengertian harta benda awam.
7.2 Menyatakan fadhilat menggunakan harta benda awam dengan beradab.
7.3 Menyatakan akibat tidak menjaga harta benda awam.
7.4 Merumus dan mengamalkan konsep adab memelihara harta benda awam secara istiqamah dalam kehidupan harian dan boleh membimbing rakan sebaya.',35),
  (2,'JAWI','Jawi','Suku kata tertutup vokal u dan o','Standard 1: Suku Kata Tertutup Vokal u dan o','1.1 Mengeja dan membaca suku kata tertutup yang mengandungi vokal u dan o.
1.2 Membedakan kaedah penulisan suku kata tertutup yang mengandungi vokal u dan o dengan betul.
1.3 Membaca suku kata tertutup yang mengandungi vokal u dan o.
1.4 Menulis suku kata tertutup yang mengandungi vokal u dan o.
Konsonan: ب، ت، ج، چ، د، ر، س، غ، ڠ، ف، ك، ل، م، ن، و، ه، ي.',36),
  (2,'JAWI','Jawi','Suku kata tertutup vokal i dan e taling','Standard 2: Suku Kata Tertutup Vokal e Taling dan e Pepet','2.1 Mengeja dan membaca suku kata tertutup yang mengandungi vokal e taling dan e pepet.
2.2 Membedakan kaedah penulisan suku kata tertutup yang mengandungi vokal e taling dan e pepet dengan betul.
2.3 Menulis suku kata tertutup yang mengandungi vokal e taling dan e pepet.
Konsonan: ب، ت، ج، چ، د، ر، س، غ، ڠ، ف، ك، ل، م، ن، و، ه، ي.',37),
  (2,'JAWI','Jawi','Vokal berganding: ia, iu, ua','Standard 3: Vokal Berganding ia, iu dan ua','3.1 Mengeja dan membaca perkataan yang mengandungi vokal berganding ia, iu dan ua.
3.2 Membaca perkataan yang mengandungi vokal berganding ia, iu dan ua.
3.3 Menulis perkataan yang mengandungi vokal berganding ia, iu dan ua.
3.4 Membedakan kaedah penulisan perkataan yang mengandungi vokal berganding ia, iu dan ua.
3.5 Menerangkan kaedah penulisan perkataan yang mengandungi vokal berganding ia, iu dan ua.',38),
  (2,'JAWI','Jawi','Vokal berganding dengan hamzah: ai, au, ui','Standard 4: Vokal Berganding dengan Hamzah ai, au dan ui','4.1 Mengeja dan membaca perkataan yang mengandungi vokal berganding dengan hamzah ai, au dan ui.
4.2 Membaca perkataan yang mengandungi vokal berganding dengan hamzah ai, au dan ui.
4.3 Menulis perkataan yang mengandungi vokal berganding dengan hamzah ai, au dan ui.
4.4 Membedakan kaedah penulisan perkataan yang mengandungi vokal berganding dengan hamzah ai, au dan ui.
4.5 Menerangkan kaedah penulisan perkataan yang mengandungi vokal berganding dengan hamzah ai, au dan ui.',39),
  (2,'BAHASA_ARAB','Bahasa Arab','Al-A''dad wa Al-Arqam','Standard 1: Al-A''dad wa Al-Arqam (Nombor dan Angka)','1.1 Mendengar nombor dan angka dengan baik.
1.2 Menyebut nombor dan angka dengan betul.
1.3 Membaca nombor dan angka dengan betul.
1.4 Menulis nombor dan angka dengan betul.
1.5 Mempraktikkan dialog dengan betul.',40),
  (2,'BAHASA_ARAB','Bahasa Arab','Al-Alwan','Standard 2: Al-Alwan (Warna)','2.1 Mendengar nama warna dengan baik.
2.2 Menyebut nama warna dengan betul.
2.3 Membaca nama warna dengan betul.
2.4 Menulis nama warna dengan betul.
2.5 Mempraktikkan dialog dengan betul.',41),
  (2,'BAHASA_ARAB','Bahasa Arab','Al-Al''ab','Standard 3: Al-Al''ab (Permainan)','3.1 Mendengar nama permainan riadah dengan baik.
3.2 Menyebut nama permainan riadah dengan betul.
3.3 Membaca nama permainan riadah dengan betul.
3.4 Menulis nama permainan riadah dengan betul.
3.5 Mempraktikkan dialog dengan betul.',42),
  (2,'BAHASA_ARAB','Bahasa Arab','Al-Malabis','Standard 4: Al-Malabis (Pakaian)','4.1 Mendengar nama pakaian dengan baik.
4.2 Menyebut nama pakaian dengan betul.
4.3 Membaca nama pakaian dengan betul.
4.4 Menulis nama pakaian dengan betul.
4.5 Mempraktikkan dialog dengan betul.',43),
  (2,'BAHASA_ARAB','Bahasa Arab','Al-Khadrawat','Standard 5: Al-Khadrawat (Sayur-sayuran)','5.1 Mendengar nama sayur-sayuran dengan baik.
5.2 Menyebut nama sayur-sayuran dengan betul.
5.3 Membaca nama sayur-sayuran dengan betul.
5.4 Menulis nama sayur-sayuran dengan betul.
5.5 Mempraktikkan dialog dengan betul.',44),
  (2,'BAHASA_ARAB','Bahasa Arab','Al-Ma''kulat wa Al-Masyrubat','Standard 6: Al-Ma''kulat wa Al-Masyrubat (Makanan dan Minuman)','6.1 Mendengar nama makanan dan minuman dengan baik.
6.2 Menyebut nama makanan dan minuman dengan betul.
6.3 Membaca nama makanan dan minuman dengan betul.
6.4 Menulis nama makanan dan minuman dengan betul.
6.5 Mempraktikkan dialog dengan betul.',45),
  (2,'BAHASA_ARAB','Bahasa Arab','Al-Fawakih wa Al-Tamr','Standard 7: Al-Fawakih wa Al-Tamr (Buah-buahan dan Tamar)','7.1 Mendengar nama buah-buahan dan tamar dengan baik.
7.2 Menyebut nama buah-buahan dan tamar dengan betul.
7.3 Membaca nama buah-buahan dan tamar dengan betul.
7.4 Menulis nama buah-buahan dan tamar dengan betul.
7.5 Mempraktikkan dialog dengan betul.',46)
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
