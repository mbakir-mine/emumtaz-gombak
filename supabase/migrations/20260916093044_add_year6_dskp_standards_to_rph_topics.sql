alter table public.rph_topic_bank
  add column if not exists standard_kandungan text,
  add column if not exists standard_pembelajaran text;

update public.rph_topic_bank
set status = 'TIDAK_AKTIF', updated_at = now()
where tahun = 6;

with dskp(tahun, kod_subjek, nama_subjek, tajuk, standard_kandungan, standard_pembelajaran, susunan) as (
  values
  (6,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 16$q$,$q$Standard 1: Juzuk 16$q$,$q$1.1 Membaca ayat-ayat Juzuk 16 dengan betul dan bertajwid.
1.2 Talaqqi musyafahah membaca 2 ayat Juzuk 16 dengan betul, lancar dan bertajwid.
Surah Maryam ayat 1-98.
Surah Taha ayat 1-135.$q$,1),
  (6,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 17$q$,$q$Standard 2: Juzuk 17$q$,$q$2.1 Membaca ayat-ayat Juzuk 17 dengan betul dan bertajwid.
2.2 Talaqqi musyafahah membaca 2 ayat Juzuk 17 dengan betul, lancar dan bertajwid.
Surah Al-Anbiya' ayat 1-112.
Surah Al-Hajj ayat 1-78.$q$,2),
  (6,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 18$q$,$q$Standard 3: Juzuk 18$q$,$q$3.1 Membaca ayat-ayat Juzuk 18 dengan betul dan bertajwid.
3.2 Talaqqi musyafahah membaca 2 ayat Juzuk 18 dengan betul, lancar dan bertajwid.
Surah Al-Mu'minun ayat 1-118.
Surah An-Nur ayat 1-64.
Surah Al-Furqan ayat 1-77.$q$,3),
  (6,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 19$q$,$q$Standard 4: Juzuk 19$q$,$q$4.1 Membaca ayat-ayat Juzuk 19 dengan betul dan bertajwid.
4.2 Talaqqi musyafahah membaca 2 ayat Juzuk 19 dengan betul, lancar dan bertajwid.
Surah Asy-Syu'ara' ayat 1-227.
Surah An-Naml ayat 1-93.$q$,4),
  (6,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 20$q$,$q$Standard 5: Juzuk 20$q$,$q$5.1 Membaca ayat-ayat Juzuk 20 dengan betul dan bertajwid.
5.2 Talaqqi musyafahah membaca 2 ayat Juzuk 20 dengan betul, lancar dan bertajwid.
Surah Al-Qasas ayat 1-88.
Surah Al-Ankabut ayat 1-69.$q$,5),
  (6,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 21$q$,$q$Standard 6: Juzuk 21$q$,$q$6.1 Membaca ayat-ayat Juzuk 21 dengan betul dan bertajwid.
6.2 Talaqqi musyafahah membaca 2 ayat Juzuk 21 dengan betul, lancar dan bertajwid.
Surah Ar-Rum ayat 1-60.
Surah Luqman ayat 1-34.
Surah As-Sajadah ayat 1-30.
Surah Al-Ahzab ayat 1-72.$q$,6),
  (6,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 22$q$,$q$Standard 7: Juzuk 22$q$,$q$7.1 Membaca ayat-ayat Juzuk 22 dengan betul dan bertajwid.
7.2 Talaqqi musyafahah membaca 2 ayat Juzuk 22 dengan betul, lancar dan bertajwid.
Surah Al-Ahzab ayat 31-72.
Surah Yasin ayat 1-27.$q$,7),
  (6,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 23$q$,$q$Standard 8: Juzuk 23$q$,$q$8.1 Membaca ayat-ayat Juzuk 23 dengan betul dan bertajwid.
8.2 Talaqqi musyafahah membaca 2 ayat Juzuk 23 dengan betul, lancar dan bertajwid.
Surah Yasin ayat 28-83.
Surah Az-Zumar ayat 1-31.$q$,8),
  (6,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 24$q$,$q$Standard 9: Juzuk 24$q$,$q$9.1 Membaca ayat-ayat Juzuk 24 dengan betul dan bertajwid.
9.2 Talaqqi musyafahah membaca 2 ayat Juzuk 24 dengan betul, lancar dan bertajwid.
Surah Az-Zumar ayat 32-75.
Surah Fussilat ayat 1-46.$q$,9),
  (6,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 25$q$,$q$Standard 10: Juzuk 25$q$,$q$10.1 Membaca ayat-ayat Juzuk 25 dengan betul dan bertajwid.
10.2 Talaqqi musyafahah membaca 2 ayat Juzuk 25 dengan betul, lancar dan bertajwid.
Surah Fussilat ayat 47-54.
Surah Asy-Syura ayat 1-37.$q$,10),
  (6,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 26$q$,$q$Standard 11: Juzuk 26$q$,$q$11.1 Membaca ayat-ayat Juzuk 26 dengan betul dan bertajwid.
11.2 Talaqqi musyafahah membaca 2 ayat Juzuk 26 dengan betul, lancar dan bertajwid.
Surah Al-Ahqaf ayat 1-35.
Surah Az-Zariyat ayat 1-30.$q$,11),
  (6,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 27$q$,$q$Standard 12: Juzuk 27$q$,$q$12.1 Membaca ayat-ayat Juzuk 27 dengan betul dan bertajwid.
12.2 Talaqqi musyafahah membaca 2 ayat Juzuk 27 dengan betul, lancar dan bertajwid.
Surah Az-Zariyat ayat 31-60.
Surah Al-Hadid ayat 1-29.$q$,12),
  (6,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 28$q$,$q$Standard 13: Juzuk 28$q$,$q$13.1 Membaca ayat-ayat Juzuk 28 dengan betul dan bertajwid.
13.2 Talaqqi musyafahah membaca 2 ayat Juzuk 28 dengan betul, lancar dan bertajwid.
Surah Al-Mujadilah ayat 1-22.
Surah At-Tahrim ayat 1-12.$q$,13),
  (6,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 29$q$,$q$Standard 14: Juzuk 29$q$,$q$14.1 Membaca ayat-ayat Juzuk 29 dengan betul dan bertajwid.
14.2 Talaqqi musyafahah membaca 2 ayat Juzuk 29 dengan betul, lancar dan bertajwid.
Surah Al-Mulk ayat 1-30.
Surah Al-Mursalat ayat 1-50.$q$,14),
  (6,$q$TILAWAH$q$,$q$Tilawah Al-Quran$q$,$q$Membaca Juzuk 30$q$,$q$Standard 15: Juzuk 30$q$,$q$15.1 Membaca ayat-ayat Juzuk 30 dengan betul dan bertajwid.
15.2 Talaqqi musyafahah membaca 2 ayat Juzuk 30 dengan betul, lancar dan bertajwid.
Surah An-Naba' ayat 1-40.
Surah An-Nas ayat 1-6.$q$,15),

  (6,$q$HAFAZAN$q$,$q$Hafazan$q$,$q$Surah 'Abasa$q$,$q$Standard 1: Surah 'Abasa$q$,$q$1.1 Membaca surah 'Abasa dengan betul dan bertajwid.
1.2 Menghafaz surah 'Abasa dengan betul dan lancar.
1.3 Menghafaz surah 'Abasa dengan betul, lancar dan bertajwid.
1.4 Menghafaz surah 'Abasa dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.
Surah 'Abasa ayat 1-42.$q$,16),
  (6,$q$HAFAZAN$q$,$q$Hafazan$q$,$q$Surah An-Nazi'at$q$,$q$Standard 2: Surah An-Nazi'at$q$,$q$2.1 Membaca surah An-Nazi'at dengan betul dan bertajwid.
2.2 Menghafaz surah An-Nazi'at dengan betul dan lancar.
2.3 Menghafaz surah An-Nazi'at dengan betul, lancar dan bertajwid.
2.4 Menghafaz surah An-Nazi'at dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.
Surah An-Nazi'at ayat 1-46.$q$,17),
  (6,$q$HAFAZAN$q$,$q$Hafazan$q$,$q$Surah An-Naba'$q$,$q$Standard 3: Surah An-Naba'$q$,$q$3.1 Membaca surah An-Naba' dengan betul dan bertajwid.
3.2 Menghafaz surah An-Naba' dengan betul dan lancar.
3.3 Menghafaz surah An-Naba' dengan betul, lancar dan bertajwid.
3.4 Menghafaz surah An-Naba' dengan betul, lancar dan bertajwid serta boleh membimbing rakan sebaya.
Surah An-Naba' ayat 1-40.$q$,18),

  (6,$q$TAJWID$q$,$q$Tajwid$q$,$q$Idgham$q$,$q$Standard 1: Idgham$q$,$q$1.1 Menyatakan pengertian idgham.
1.2 Menyatakan bahagian idgham dan hukum bacaannya.
Idgham Mutamathilain: pengertian, hukum, cara bacaan, huruf, misal dan bacaan potongan ayat Al-Quran dengan betul.
Idgham Mutaqaribain: pengertian, hukum, cara bacaan, huruf, misal dan bacaan potongan ayat Al-Quran dengan betul.
Idgham Mutajanisain: pengertian, hukum, cara bacaan, bahagian, huruf, misal dan bacaan potongan ayat Al-Quran dengan betul.$q$,19),
  (6,$q$TAJWID$q$,$q$Tajwid$q$,$q$Hukum Ra'$q$,$q$Standard 2: Hukum Ra'$q$,$q$2.1 Ra' dibaca tebal (tafkhim): bahagian hukum ra', sebab ra' dibaca tebal berserta misal dan huruf isti'la'.
2.2 Ra' dibaca nipis (tarqiq): sebab ra' dibaca nipis berserta misal, membedakan cara bacaan ra' tebal dan ra' nipis, serta membaca ayat yang mengandungi hukum ra'.
2.3 Ra' dibaca dua wajah: sebab, cara bacaan dan misal daripada potongan ayat Al-Quran.$q$,20),
  (6,$q$TAJWID$q$,$q$Tajwid$q$,$q$Hukum Tanwin Bertemu Hamzah Wasal$q$,$q$Standard 3: Hukum Tanwin Bertemu Hamzah Wasal$q$,$q$3.1 Menyatakan cara membaca ayat yang mengandungi hukum tanwin bertemu hamzah wasal.
3.2 Membaca ayat yang mengandungi hukum tanwin bertemu hamzah wasal.$q$,21),
  (6,$q$TAJWID$q$,$q$Tajwid$q$,$q$Bacaan Khusus Riwayat Hafs 'an 'Asim$q$,$q$Standard 4: Bacaan Khusus Riwayat Hafs 'an 'Asim (Tariq al-Shatibi)$q$,$q$4.1 Saktah: pengertian, misal dan cara bacaan.
4.2 Imalah, Naql dan Tas-hil: pengertian dan misal.
4.3 Ibdal, Isymam dan Raum: pengertian dan misal.$q$,22),
  (6,$q$TAJWID$q$,$q$Tajwid$q$,$q$Rukun Bacaan Al-Quran$q$,$q$Standard 5: Rukun Bacaan Al-Quran$q$,$q$5.1 Menyatakan 2 rukun bacaan Al-Quran dan mematuhi Qawa'id al-'Arabiyyah.
5.2 Menyatakan sanad bacaan riwayat Hafs yang bersambung kepada Rasulullah SAW.
5.3 Membedakan rasm imla'i dan rasm 'Uthmani serta menyatakan kelebihan rasm 'Uthmani.$q$,23),

  (6,$q$TAUHID$q$,$q$Tauhid$q$,$q$Perkara Sam'iyyat$q$,$q$Standard 1: Perkara Sam'iyyat$q$,$q$1.1 Menyatakan pengertian sam'iyyat.
1.2 Menyatakan dalil sam'iyyat.
1.3 Menyatakan hukum mempercayai sam'iyyat.
1.4 Menyatakan hikmah mempercayai sam'iyyat.
1.5 Menyatakan perkara-perkara sam'iyyat.
1.6 Menyatakan kesan beriman kepada sam'iyyat.$q$,24),
  (6,$q$TAUHID$q$,$q$Tauhid$q$,$q$Mukjizat$q$,$q$Standard 2: Mukjizat$q$,$q$2.1 Menyatakan pengertian mukjizat.
2.2 Menyatakan dalil adanya mukjizat.
2.3 Menyatakan tujuan mukjizat.
2.4 Menyatakan bahagian mukjizat.
2.5 Menceritakan mukjizat nabi dan rasul.$q$,25),
  (6,$q$TAUHID$q$,$q$Tauhid$q$,$q$Irhas, Karamah, Ma'unah, Istidraj, Ihanah dan Sihir$q$,$q$Standard 3: Irhas, Karamah, Ma'unah, Istidraj, Ihanah dan Sihir$q$,$q$3.1 Menyatakan pengertian irhas, karamah, ma'unah, istidraj, ihanah dan sihir.
3.2 Menyatakan contoh irhas, karamah, ma'unah, istidraj, ihanah dan sihir.
3.3 Menyatakan perbezaan antara irhas, karamah, ma'unah, istidraj, ihanah dan sihir.$q$,26),
  (6,$q$TAUHID$q$,$q$Tauhid$q$,$q$Syirik dan Perkara Khurafat$q$,$q$Standard 4: Syirik dan Perkara Khurafat$q$,$q$4.1 Menyatakan pengertian syirik.
4.2 Menyatakan contoh syirik dalam 2 jenis syirik.
4.3 Menyatakan 2 perkara yang membawa kepada syirik.
4.4 Menyatakan pengertian khurafat.
4.5 Menyatakan 2 contoh khurafat.
4.6 Menyatakan kesan khurafat.
4.7 Menyatakan cara mengatasi dan menghapuskan amalan khurafat.$q$,27),
  (6,$q$TAUHID$q$,$q$Tauhid$q$,$q$Al-Asma' al-Husna (51-99)$q$,$q$Standard 5: Al-Asma' al-Husna (51-99)$q$,$q$5.1 Menghafaz dan menyatakan pengertian Al-Asma' al-Husna 51 hingga 99.
5.2 Menulis dalil Al-Asma' al-Husna 51 hingga 99 dan menyatakan konsepnya dengan betul serta boleh membimbing rakan sebaya.
Senarai: Al-Haq, Al-Wakil, Al-Qawiyy, Al-Matin, Al-Waliyy, Al-Hamid, Al-Muhsi, Al-Mubdi', Al-Mu'id, Al-Muhyi, Al-Mumit, Al-Hayy, Al-Qayyum, Al-Wajid, Al-Majid, Al-Wahid, Al-Ahad, As-Samad, Al-Qadir, Al-Muqtadir, Al-Muqaddim, Al-Mu'akhkhir, Al-Awwal, Al-Akhir, Az-Zahir, Al-Batin, Al-Wali, Al-Muta'ali, Al-Barr, At-Tawwab, Al-Muntaqim, Al-'Afuww, Ar-Ra'uf, Malik al-Mulk, Dhul-Jalali wal-Ikram, Al-Muqsit, Al-Jami', Al-Ghaniyy, Al-Mughni, Al-Mani', Ad-Darr, An-Nafi', An-Nur, Al-Hadi, Al-Badi', Al-Baqi, Al-Warith, Ar-Rasyid dan As-Sabur.$q$,28),

  (6,$q$FEKAH$q$,$q$Fiqh$q$,$q$Haji dan Umrah$q$,$q$Standard 1: Haji dan Umrah$q$,$q$1.1 Menyebut pengertian haji dan umrah.
1.2 Menyebut dalil dan hukum haji dan umrah.
1.3 Menyatakan syarat wajib haji dan umrah.
1.4 Menyatakan rukun haji, wajib haji dan jenis-jenis haji.
1.5 Menyebut lafaz niat haji dan umrah.
1.6 Menyatakan 2 sunat haji dan umrah.
1.7 Menyatakan hikmah mengerjakan haji dan umrah.$q$,29),
  (6,$q$FEKAH$q$,$q$Fiqh$q$,$q$Sembelihan, Qurban dan Akikah$q$,$q$Standard 2: Sembelihan$q$,$q$2.1 Sembelihan: pengertian, dalil, hukum, syarat sah, alat, kaifiyat dan hikmah sembelihan.
2.2 Ibadah Qurban: pengertian, dalil, hukum, jenis dan syarat binatang qurban serta fadhilat qurban.
2.3 Ibadah Akikah: pengertian, dalil, hukum, jenis dan syarat binatang akikah, kaifiyat dan hikmah akikah.$q$,30),
  (6,$q$FEKAH$q$,$q$Fiqh$q$,$q$Muamalat$q$,$q$Standard 3: Muamalat$q$,$q$3.1 Menyebut pengertian dan hikmah muamalat.
3.2 Jual beli: membaca pengertian dan dalil jual beli, menyatakan hikmah, rukun dan larangan jual beli.
3.3 Riba: menyebut pengertian dan dalil riba serta hikmah pengharamannya.
3.4 Munakahat: menyebut pengertian, dalil dan hukum nikah, perempuan yang haram dikahwini dan hikmah nikah.$q$,31),
  (6,$q$FEKAH$q$,$q$Fiqh$q$,$q$Faraid$q$,$q$Standard 4: Faraid$q$,$q$4.1 Menyebut pengertian faraid.
4.2 Menyebut dalil dan hukum faraid.
4.3 Menyatakan waris yang berhak menerima harta faraid.
4.4 Menyatakan hikmah faraid.$q$,32),
  (6,$q$FEKAH$q$,$q$Fiqh$q$,$q$Jinayat$q$,$q$Standard 5: Jinayat$q$,$q$5.1 Menyatakan pengertian jinayat.
5.2 Menyatakan 2 jenis jinayat syariah dan 2 hukum syariah.
5.3 Menyatakan dalil dan hukum setiap jinayat syariah.
5.4 Menyatakan hikmah falsafah undang-undang jinayat syariah.$q$,33),

  (6,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Menziarahi Jenazah$q$,$q$Standard 1: Menziarahi Jenazah$q$,$q$1.1 Menyebut pengertian menziarahi jenazah.
1.2 Membaca dan menulis konsep menziarahi jenazah dengan bimbingan guru.
1.3 Menghafaz konsep menziarahi jenazah dengan betul.
1.4 Menyatakan konsep menziarahi jenazah dengan betul.
1.5 Mengamalkan adab menziarahi jenazah secara istiqamah.
1.6 Mengamalkan adab menziarahi jenazah secara istiqamah dan boleh dicontohi atau membimbing rakan sebaya.$q$,34),
  (6,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Menziarahi Kubur$q$,$q$Standard 2: Menziarahi Kubur$q$,$q$2.1 Menyatakan adab menziarahi kubur.
2.2 Memberi salam dan berdoa ketika menziarahi kubur.
2.3 Menyatakan 2 perkara yang dilarang ketika menziarahi kubur.
2.4 Menyebut fadhilat menziarahi kubur.
2.5 Menyebut akibat tidak beradab ketika menziarahi kubur.$q$,35),
  (6,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Sifat Mahmudah$q$,$q$Standard 3: Sifat Mahmudah$q$,$q$3.1 Tawakkal: pengertian, dalil, 2 ciri, fadhilat dan akibat tidak bertawakkal.
3.2 Mahabbah: pengertian, dalil, 2 cara, fadhilat dan akibat tidak mahabbah.
3.3 Redha: pengertian, dalil, 2 ciri, fadhilat dan akibat tidak redha.
3.4 Zikrul Maut: pengertian, dalil, cara, fadhilat dan akibat tidak zikrul maut.$q$,36),
  (6,$q$AKHLAK$q$,$q$Akhlak$q$,$q$Sifat Mazmumah$q$,$q$Standard 4: Sifat Mazmumah$q$,$q$4.1 Hubb al-Dunya: pengertian, dalil larangan, ciri-ciri, akibat, cara menjauhi dan fadhilat menjauhinya.
4.2 Takbur: pengertian, dalil larangan, ciri-ciri, fadhilat menjauhi dan akibat takbur.
4.3 Ujub: pengertian, dalil larangan, ciri-ciri, cara menjauhi, akibat dan fadhilat menjauhinya.
4.4 Riya': pengertian, dalil larangan, ciri-ciri, akibat, cara menjauhi dan fadhilat menjauhinya.$q$,37),

  (6,$q$SIRAH$q$,$q$Sirah$q$,$q$Kefahaman Negara Islam$q$,$q$Standard 1: Kefahaman Negara Islam$q$,$q$1.1 Menyatakan pengertian negara Islam.
1.2 Menyatakan tujuan negara Islam dan menyebutkan dalil kefahaman negara Islam.
1.3 Menyatakan ciri-ciri negara Islam.
1.4 Menyatakan prinsip negara Islam.$q$,38),
  (6,$q$SIRAH$q$,$q$Sirah$q$,$q$Sahabat Khulafa' al-Rasyidin$q$,$q$Standard 2: Sahabat Khulafa' al-Rasyidin$q$,$q$2.1 Menyatakan pengertian dan ciri sahabat serta pengertian dan ciri khulafa' al-Rasyidin, serta mengambil pengajaran daripada kisah sahabat.
2.2 Menyatakan dan menceritakan riwayat hidup Saidina Abu Bakar As-Siddiq.
2.3 Membaca dan menceritakan riwayat hidup Saidina Umar bin Al-Khattab.
2.4 Membaca dan menceritakan riwayat hidup Saidina Uthman bin Affan.
2.5 Membaca dan menceritakan riwayat hidup Saidina Ali bin Abi Talib.$q$,39),
  (6,$q$SIRAH$q$,$q$Sirah$q$,$q$Ahl al-Bait$q$,$q$Standard 3: Ahl al-Bait$q$,$q$3.1 Menyatakan 2 pengertian Ahl al-Bait.
3.2 Menjelaskan riwayat hidup isteri Nabi Muhammad SAW sebagai Ahl al-Bait.
3.3 Menjelaskan riwayat hidup Fatimah Az-Zahra dan cucunda Nabi Muhammad SAW sebagai Ahl al-Bait.$q$,40),
  (6,$q$SIRAH$q$,$q$Sirah$q$,$q$Sahabat Nabi yang Dijamin Syurga$q$,$q$Standard 4: Sahabat Nabi yang Dijamin Syurga$q$,$q$4.1-4.4 Membaca, menyatakan dan menjelaskan kisah sahabat yang dijamin syurga oleh Allah SWT selain khulafa' al-Rasyidin dengan bimbingan guru.
Nama sahabat: Talhah bin Ubaidillah, Az-Zubair bin Al-'Awwam, 'Abdur Rahman bin 'Auf, Abu 'Ubaidah bin Al-Jarrah dan Sa'id bin Zaid.$q$,41),

  (6,$q$JAWI$q$,$q$Jawi$q$,$q$Homograf$q$,$q$Standard 1: Homograf$q$,$q$1.1 Mengeja kata homograf dengan bimbingan guru.
1.1.2 Membaca kata homograf dengan betul.
1.1.3 Menulis kata homograf mengikut kaedah yang betul.
1.1.4 Membedakan kata homograf mengikut kaedah ejaan yang betul dan tepat.
1.1.5 Mempraktikkan kaedah ejaan kata homograf dengan betul dan tepat.
1.1.6 Mempraktikkan kaedah ejaan kata homograf dengan betul dan tepat serta boleh membimbing rakan sebaya.$q$,42),
  (6,$q$JAWI$q$,$q$Jawi$q$,$q$Kata Gabung$q$,$q$Standard 2: Kata Gabung$q$,$q$2.1 Mengeja kata gabung dengan bimbingan guru, membaca, menulis, membedakan dan mempraktikkan kaedah ejaan kata gabung dengan betul dan tepat.
2.2 Mengeja, membaca dan menulis kata gabung dengan betul.
2.3 Mengeja, membaca dan menulis kata gabung dengan betul.
2.4 Mengeja, membaca dan menulis kata gabung dengan betul.$q$,43),
  (6,$q$JAWI$q$,$q$Jawi$q$,$q$Tanda Sempang$q$,$q$Standard 3: Tanda Sempang$q$,$q$3.1 Membaca perkataan yang mengandungi tanda sempang dengan betul.
3.2 Menulis perkataan yang mengandungi tanda sempang mengikut kaedah yang betul.
3.3 Menyatakan perkataan yang mengandungi tanda sempang mengikut kaedah yang betul dan tepat.
3.4 Mempraktikkan perkataan yang mengandungi tanda sempang mengikut kaedah ejaan yang betul dan tepat.
3.5 Mempraktikkan perkataan yang mengandungi tanda sempang mengikut kaedah ejaan yang betul dan tepat serta boleh membimbing rakan sebaya.$q$,44),

  (6,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Khat Thuluth: Huruf آ، ط، ظ$q$,$q$Standard 1: Khat Thuluth - Huruf آ، ط، ظ$q$,$q$1.1 Mengenal dan membentuk titik huruf serta mengenal huruf Jawi آ، ط، ظ tunggal mengikut kaedah Khat Thuluth.
1.2 Mengenal dan menulis huruf Jawi آ، ط، ظ bersambung mengikut kaedah Khat Thuluth.$q$,45),
  (6,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Khat Thuluth: Huruf ك$q$,$q$Standard 2: Khat Thuluth - Huruf ك$q$,$q$2.1 Mengenal dan menulis huruf Jawi ك tunggal mengikut kaedah Khat Thuluth.
2.2 Mengenal dan menulis huruf Jawi ك bersambung mengikut kaedah Khat Thuluth.$q$,46),
  (6,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Khat Thuluth: Huruf ب، ت، ث$q$,$q$Standard 3: Khat Thuluth - Huruf ب، ت، ث$q$,$q$3.1 Mengenal dan menulis huruf Jawi ب، ت، ث tunggal mengikut kaedah Khat Thuluth.
3.2 Mengenal dan menulis huruf Jawi ب، ت، ث bersambung mengikut kaedah Khat Thuluth.$q$,47),
  (6,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Khat Thuluth: Huruf د، ذ$q$,$q$Standard 4: Khat Thuluth - Huruf د، ذ$q$,$q$4.1 Mengenal dan menulis huruf Jawi د، ذ tunggal mengikut kaedah Khat Thuluth.
4.2 Mengenal dan menulis huruf Jawi د، ذ bersambung mengikut kaedah Khat Thuluth.$q$,48),
  (6,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Khat Thuluth: Huruf ف$q$,$q$Standard 5: Khat Thuluth - Huruf ف$q$,$q$5.1 Mengenal dan menulis huruf Jawi ف tunggal mengikut kaedah Khat Thuluth.
5.2 Mengenal dan menulis huruf Jawi ف bersambung mengikut kaedah Khat Thuluth.$q$,49),
  (6,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Khat Thuluth: Huruf ه، لا$q$,$q$Standard 6: Khat Thuluth - Huruf ه، لا$q$,$q$6.1 Mengenal dan menulis huruf Jawi ه، لا tunggal mengikut kaedah Khat Thuluth.
6.2 Mengenal dan menulis huruf Jawi ه، لا bersambung mengikut kaedah Khat Thuluth.$q$,50),
  (6,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Khat Thuluth: Huruf ج، ح، خ$q$,$q$Standard 7: Khat Thuluth - Huruf ج، ح، خ$q$,$q$7.1 Mengenal dan menulis huruf Jawi ج، ح، خ tunggal mengikut kaedah Khat Thuluth.
7.2 Mengenal dan menulis huruf Jawi ج، ح، خ bersambung mengikut kaedah Khat Thuluth.$q$,51),
  (6,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Khat Thuluth: Huruf ر، ز، و$q$,$q$Standard 8: Khat Thuluth - Huruf ر، ز، و$q$,$q$8.1 Mengenal dan menulis huruf Jawi ر، ز، و tunggal mengikut kaedah Khat Thuluth.
8.2 Mengenal dan menulis huruf Jawi ر، ز، و bersambung mengikut kaedah Khat Thuluth.$q$,52),
  (6,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Khat Thuluth: Huruf س، ش$q$,$q$Standard 9: Khat Thuluth - Huruf س، ش$q$,$q$9.1 Mengenal dan menulis huruf Jawi س، ش tunggal mengikut kaedah Khat Thuluth.
9.2 Mengenal dan menulis huruf Jawi س، ش bersambung mengikut kaedah Khat Thuluth.$q$,53),
  (6,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Khat Thuluth: Huruf ص، ض$q$,$q$Standard 10: Khat Thuluth - Huruf ص، ض$q$,$q$10.1 Mengenal dan menulis huruf Jawi ص، ض tunggal mengikut kaedah Khat Thuluth.
10.2 Mengenal dan menulis huruf Jawi ص، ض bersambung mengikut kaedah Khat Thuluth.$q$,54),
  (6,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Khat Thuluth: Huruf ع، غ$q$,$q$Standard 11: Khat Thuluth - Huruf ع، غ$q$,$q$11.1 Mengenal dan menulis huruf Jawi ع، غ tunggal mengikut kaedah Khat Thuluth.
11.2 Mengenal dan menulis huruf Jawi ع، غ bersambung mengikut kaedah Khat Thuluth.$q$,55),
  (6,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Khat Thuluth: Huruf ق، ل، م$q$,$q$Standard 12: Khat Thuluth - Huruf ق، ل، م$q$,$q$12.1 Mengenal dan menulis huruf Jawi ق، ل، م tunggal mengikut kaedah Khat Thuluth.
12.2 Mengenal dan menulis huruf Jawi ق، ل، م bersambung mengikut kaedah Khat Thuluth.$q$,56),
  (6,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Khat Thuluth: Huruf ن، ث، ي$q$,$q$Standard 13: Khat Thuluth - Huruf ن، ث، ي$q$,$q$13.1 Mengenal dan menulis huruf Jawi ن، ث، ي tunggal mengikut kaedah Khat Thuluth.
13.2 Mengenal dan menulis huruf Jawi ن، ث، ي bersambung mengikut kaedah Khat Thuluth.$q$,57),
  (6,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Menulis Tanda Baris$q$,$q$Standard 14: Menulis Tanda Baris$q$,$q$14.1 Mengenal tanda baris mengikut kaedah Khat Naskh dan Khat Thuluth.
14.2 Menulis tanda baris mengikut kaedah Khat Naskh dan Khat Thuluth.$q$,58),
  (6,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Perbandingan Ciri-ciri Huruf$q$,$q$Standard 15: Perbandingan Ciri-ciri Huruf$q$,$q$15.1 Mengenal perbandingan ciri-ciri huruf antara Khat Naskh dan Khat Thuluth.
15.2 Menulis 2 huruf tunggal mengikut kaedah Khat Naskh dan Khat Thuluth.$q$,59),
  (6,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Perbandingan Ciri-ciri Kalimah$q$,$q$Standard 16: Perbandingan Ciri-ciri Kalimah$q$,$q$16.1 Mengenal perbandingan ciri-ciri kalimah antara Khat Naskh dan Khat Thuluth.
16.2 Menulis 2 contoh kalimah mengikut kaedah Khat Naskh dan Khat Thuluth.$q$,60),
  (6,$q$IMLAK_KHAT$q$,$q$Khat$q$,$q$Perbandingan Ciri-ciri Potongan Ayat$q$,$q$Standard 17: Perbandingan Ciri-ciri Potongan Ayat$q$,$q$17.1 Mengenal perbandingan ciri-ciri potongan ayat antara Khat Naskh dan Khat Thuluth.
17.2 Menulis 2 contoh potongan ayat mengikut kaedah Khat Naskh dan Khat Thuluth.$q$,61),
  (6,$q$IMLAK_KHAT$q$,$q$Imla'$q$,$q$Alif Zaidah$q$,$q$Standard 1: Alif Zaidah$q$,$q$1.1 Mengeja, membaca, menulis dan menyatakan kalimah yang mengandungi alif zaidah ا di akhir fi'l madhi jamak mudzakkar.
1.2 Membaca, menulis dan menyatakan kalimah yang mengandungi alif zaidah ا di akhir fi'l mudhari'.
1.3 Membaca, menulis dan menyatakan kalimah yang mengandungi alif zaidah ا di akhir fi'l amr.$q$,62),
  (6,$q$IMLAK_KHAT$q$,$q$Imla'$q$,$q$Wau Zaidah$q$,$q$Standard 2: Wau Zaidah$q$,$q$2.1 Membaca kalimah yang mengandungi wau zaidah و.
2.2 Menulis kalimah yang mengandungi wau zaidah و.
2.3 Menyatakan kalimah yang mengandungi wau zaidah و.$q$,63),

  (6,$q$BAHASA_ARAB$q$,$q$Bahasa Arab$q$,$q$الأعداد والأرقام: 600-2000$q$,$q$Standard 1: Al-A'dad wa Al-Arqam (600-2000)$q$,$q$1.1 Mendengar nombor dan angka 600-2000 dengan baik.
1.2 Menyebut nombor dan angka dengan betul.
1.3 Membaca nombor dan angka dengan betul.
1.4 Menulis nombor dan angka dengan betul.
1.5 Mempraktikkan dialog dengan betul.$q$,64),
  (6,$q$BAHASA_ARAB$q$,$q$Bahasa Arab$q$,$q$أوزان الأفعال$q$,$q$Standard 2: Auzaan al-Af'al$q$,$q$2.1 Mendengar auzaan al-af'al dengan baik.
2.2 Menyebut auzaan al-af'al dengan betul.
2.3 Membaca auzaan al-af'al dengan betul.
2.4 Menulis auzaan al-af'al dengan betul.
2.5 Mempraktikkan dialog dengan betul.$q$,65),
  (6,$q$BAHASA_ARAB$q$,$q$Bahasa Arab$q$,$q$القصة المختارة: بر الوالدين$q$,$q$Standard 3: Al-Qissah al-Mukhtarah - Birr al-Walidain$q$,$q$3.1 Mendengar cerita pilihan dengan baik.
3.2 Menyebut cerita pilihan dengan betul.
3.3 Membaca cerita pilihan dengan betul.
3.4 Menulis cerita pilihan dengan betul.
3.5 Mempraktikkan dialog dengan betul.$q$,66),
  (6,$q$BAHASA_ARAB$q$,$q$Bahasa Arab$q$,$q$تصريف الأفعال$q$,$q$Standard 4: Tashrif al-Af'al$q$,$q$4.1 Tashrif fi'l madhi: mendengar, menyebut, membaca dan menulis dengan betul.
4.2 Tashrif fi'l mudhari': mendengar, menyebut, membaca dan menulis dengan betul.
4.3 Tashrif fi'l amr: mendengar, menyebut, membaca dan menulis dengan betul.$q$,67),
  (6,$q$BAHASA_ARAB$q$,$q$Bahasa Arab$q$,$q$المبتدأ والخبر$q$,$q$Standard 5: Al-Mubtada' wa Al-Khabar$q$,$q$5.1 Mendengar jumlah mubtada' dan khabar dengan baik.
5.2 Menyebut jumlah mubtada' dan khabar dengan betul.
5.3 Membaca jumlah mubtada' dan khabar dengan betul.
5.4 Menulis jumlah mubtada' dan khabar dengan betul.
5.5 Menggunakan mubtada' dan khabar dalam ayat yang berguna.$q$,68),
  (6,$q$BAHASA_ARAB$q$,$q$Bahasa Arab$q$,$q$القصة المختارة: الأسرة السعيدة$q$,$q$Standard 6: Al-Qissah al-Mukhtarah - Al-Usrah al-Sa'idah$q$,$q$6.1 Mendengar cerita pilihan dengan baik.
6.2 Menyebut cerita pilihan dengan betul.
6.3 Membaca cerita pilihan dengan betul.
6.4 Menulis cerita pilihan dengan betul.
6.5 Mempraktikkan dialog dengan betul.$q$,69),
  (6,$q$BAHASA_ARAB$q$,$q$Bahasa Arab$q$,$q$حروف العطف$q$,$q$Standard 7: Huruf al-'Atf$q$,$q$7.1 Mendengar huruf 'atf dengan baik.
7.2 Menyebut huruf 'atf dengan betul.
7.3 Membaca huruf 'atf dengan betul.
7.4 Menulis huruf 'atf dengan betul.
7.5 Menggunakan huruf 'atf dalam ayat yang berguna.$q$,70),
  (6,$q$BAHASA_ARAB$q$,$q$Bahasa Arab$q$,$q$الكلمات المتضادة$q$,$q$Standard 8: Al-Kalimat al-Mutadhadah$q$,$q$8.1 Mendengar kalimat mutadhadah dengan baik.
8.2 Menyebut kalimat mutadhadah dengan betul.
8.3 Membaca kalimat mutadhadah dengan betul.
8.4 Menulis kalimat mutadhadah dengan betul.
8.5 Menggunakan kalimat mutadhadah dalam ayat yang berguna.$q$,71),
  (6,$q$BAHASA_ARAB$q$,$q$Bahasa Arab$q$,$q$القصة المختارة: اللعب بالنار$q$,$q$Standard 9: Al-Qissah al-Mukhtarah - Al-Lu'b bi al-Nar$q$,$q$9.1 Mendengar cerita pilihan dengan baik.
9.2 Menyebut cerita pilihan dengan betul.
9.3 Membaca cerita pilihan dengan betul.
9.4 Menulis cerita pilihan dengan betul.
9.5 Mempraktikkan dialog dengan betul.$q$,72),
  (6,$q$BAHASA_ARAB$q$,$q$Bahasa Arab$q$,$q$الحوار$q$,$q$Standard 10: Al-Hiwar$q$,$q$10.1 Mendengar dialog dengan baik.
10.2 Menyebut dialog dengan betul.
10.3 Membaca dialog dengan betul.
10.4 Menulis dialog dengan betul.
10.5 Mempraktikkan dialog dengan betul.$q$,73),
  (6,$q$BAHASA_ARAB$q$,$q$Bahasa Arab$q$,$q$الحكم والأمثال المختارة$q$,$q$Standard 11: Al-Hikam wa Al-Amthal al-Mukhtarah$q$,$q$11.1 Mendengar hikam dan amthal pilihan dengan baik.
11.2 Menyebut hikam dan amthal pilihan dengan betul.
11.3 Membaca hikam dan amthal pilihan dengan betul.
11.4 Menulis hikam dan amthal pilihan dengan betul.
11.5 Mempraktikkan hikam dan amthal pilihan dengan betul.
Contoh hikam: Adab al-Mar' Khair min Dhahabih; Man Talaba al-'Ula Sahira al-Layali.$q$,74)
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
