import type { QuestionBankItemPG } from './questionBankHelper';

// Extended Part 4: Additional Fase-scoped PG items across all 9 non-math subjects
// Guarantees zero cross-class twins even across Kelas 6 (25 PG) -> Kelas 4 (20 PG) -> Kelas 1 (15 PG).

export const PART4_PG_BY_CAT: Record<string, QuestionBankItemPG[]> = {
    indo: [
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Ibu membeli tiga buah apel merah segar di pasar pagi.',
            question: 'Kata yang menunjukkan warna benda pada kalimat di atas adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Merah' }, { key: 'B', text: 'Tiga' }, { key: 'C', text: 'Pasar' }],
            optionsFaseBC: [{ key: 'A', text: 'Merah' }, { key: 'B', text: 'Tiga' }, { key: 'C', text: 'Pasar' }, { key: 'D', text: 'Apel' }],
            correctAnswer: 'A',
            explanation: '"Merah" adalah kata sifat yang menjelaskan warna buah apel.',
            cognitiveLevel: 'LOTS',
            topic: 'Kata Sifat Warna'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Kakak merapikan buku pelajaran ke dalam tas agar tidak tertinggal besok pagi.',
            question: 'Tempat menyimpan buku pelajaran yang disebutkan pada kalimat di atas adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Tas' }, { key: 'B', text: 'Meja' }, { key: 'C', text: 'Lemari' }],
            optionsFaseBC: [{ key: 'A', text: 'Tas' }, { key: 'B', text: 'Meja' }, { key: 'C', text: 'Lemari' }, { key: 'D', text: 'Rak sepatu' }],
            correctAnswer: 'A',
            explanation: 'Berdasarkan kalimat tersebut, buku pelajaran dirapikan ke dalam tas.',
            cognitiveLevel: 'LOTS',
            topic: 'Membaca Kalimat Sederhana'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Perhatikan pengumuman singkat: "Lomba kebersihan antar-kelas akan diadakan hari Jumat pukul 07.30 WIB."',
            question: 'Informasi penting mengenai waktu pelaksanaan lomba pada pengumuman tersebut adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Hari Jumat pukul 07.30 WIB' }, { key: 'B', text: 'Hari Senin siang' }, { key: 'C', text: 'Hari Minggu sore' }],
            optionsFaseBC: [{ key: 'A', text: 'Hari Jumat pukul 07.30 WIB' }, { key: 'B', text: 'Hari Senin pukul 08.00 WIB' }, { key: 'C', text: 'Hari Sabtu sore' }, { key: 'D', text: 'Hari Minggu pagi' }],
            correctAnswer: 'A',
            explanation: 'Pengumuman menyatakan lomba dilaksanakan pada hari Jumat pukul 07.30 WIB.',
            cognitiveLevel: 'LOTS',
            topic: 'Memahami Pengumuman'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Dalam sebuah resensi buku cerita anak, penulis menuliskan kelebihan alur cerita yang seru serta ilustrasi gambar berwarna cerah.',
            question: 'Bagian teks tanggapan yang menilai keunggulan dan kekurangan suatu buku bacaan disebut ...',
            optionsFaseA: [{ key: 'A', text: 'Resensi buku' }, { key: 'B', text: 'Daftar pustaka' }, { key: 'C', text: 'Kamus istilah' }],
            optionsFaseBC: [{ key: 'A', text: 'Resensi / ulasan buku' }, { key: 'B', text: 'Daftar pustaka' }, { key: 'C', text: 'Indeks halaman' }, { key: 'D', text: 'Lampiran biodata' }],
            correctAnswer: 'A',
            explanation: 'Resensi adalah ulasan yang memuat ringkasan isi serta penilaian kelebihan dan kekurangan karya.',
            cognitiveLevel: 'MOTS',
            topic: 'Ulasan / Resensi Buku'
        }
    ],
    pancasila: [
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Sebelum tidur malam, Nisa selalu mencuci kaki, menggosok gigi, dan merapikan bantalnya sendiri.',
            question: 'Kebiasaan merapikan tempat tidur sendiri di rumah melatih sikap ...',
            optionsFaseA: [{ key: 'A', text: 'Mandiri dan disiplin' }, { key: 'B', text: 'Manja dan malas' }, { key: 'C', text: 'Tergesa-gesa' }],
            optionsFaseBC: [{ key: 'A', text: 'Mandiri dan disiplin' }, { key: 'B', text: 'Manja kepada orang tua' }, { key: 'C', text: 'Kurang peduli' }, { key: 'D', text: 'Ceroboh' }],
            correctAnswer: 'A',
            explanation: 'Melakukan tugas ringan sendiri membiasakan anak hidup mandiri dan bertanggung jawab.',
            cognitiveLevel: 'LOTS',
            topic: 'Aturan Kemandirian Rumah'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Saat guru menjelaskan pelajaran di papan tulis, seluruh siswa kelas duduk rapi dan tidak mengobrol sendiri.',
            question: 'Manfaat sikap tertib mendengarkan guru saat belajar di kelas adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Pelajaran mudah dipahami oleh semua siswa' }, { key: 'B', text: 'Suasana kelas menjadi gaduh' }, { key: 'C', text: 'Teman-teman terganggu saat membaca' }],
            optionsFaseBC: [{ key: 'A', text: 'Suasana belajar nyaman sehingga materi mudah dipahami' }, { key: 'B', text: 'Kelas menjadi ramai tidak teratur' }, { key: 'C', text: 'Pelajaran tidak selesai tepat waktu' }, { key: 'D', text: 'Siswa kesulitan berkonsentrasi' }],
            correctAnswer: 'A',
            explanation: 'Ketenangan kelas menjaga konsentrasi belajar dan bentuk rasa hormat kepada guru.',
            cognitiveLevel: 'LOTS',
            topic: 'Tata Tertib Belajar'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Rafi memiliki tetangga baru yang berasal dari luar kota dan berbeda bahasa daerah dengannya.',
            question: 'Sikap yang baik ditunjukkan Rafi kepada tetangga barunya adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Menyapa dengan ramah dan mengajak berkenalan' }, { key: 'B', text: 'Menutup pintu pagar rapat-rapat' }, { key: 'C', text: 'Menertawakan cara bicaranya' }],
            optionsFaseBC: [{ key: 'A', text: 'Menyapa ramah dan menjalin persahabatan tanpa membedakan asal' }, { key: 'B', text: 'Membiarkannya sendirian' }, { key: 'C', text: 'Mengejek logat bahasanya' }, { key: 'D', text: 'Menolak bermain bersama' }],
            correctAnswer: 'A',
            explanation: 'Menyambut tetangga baru dengan ramah mempererat kerukunan lingkungan.',
            cognitiveLevel: 'LOTS',
            topic: 'Kerukunan Bertetangga'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Di kelas terdapat foto Presiden dan Wakil Presiden Republik Indonesia serta lambang Burung Garuda.',
            question: 'Lambang sila kedua Pancasila yang berupa rantai emas berjumlah tujuh belas gelang melambangkan nilai ...',
            optionsFaseA: [{ key: 'A', text: 'Kemanusiaan dan saling membantu sesama' }, { key: 'B', text: 'Ketuhanan Yang Maha Esa' }, { key: 'C', text: 'Pangan dan sandang rakyat' }],
            optionsFaseBC: [{ key: 'A', text: 'Kemanusiaan yang adil dan beradab' }, { key: 'B', text: 'Ketuhanan Yang Maha Esa' }, { key: 'C', text: 'Persatuan Indonesia' }, { key: 'D', text: 'Kerakyatan dalam musyawarah' }],
            correctAnswer: 'A',
            explanation: 'Rantai emas melambangkan keterikatan manusia yang saling peduli dan menghormati (Sila ke-2).',
            cognitiveLevel: 'LOTS',
            topic: 'Simbol Sila Kedua'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Setiap hari Senin pagi siswa mengikuti upacara bendera dengan berdiri tegak saat Sang Merah Putih dikibarkan.',
            question: 'Sikap tubuh yang benar saat menyanyikan lagu Indonesia Raya dan menghormat bendera adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Berdiri tegak khidmat dan tertib' }, { key: 'B', text: 'Berlari mengejar teman' }, { key: 'C', text: 'Duduk bersandar sambil makan' }],
            optionsFaseBC: [{ key: 'A', text: 'Sikap sempurna berdiri tegak dengan penuh hormat' }, { key: 'B', text: 'Bercanda dan tertawa keras' }, { key: 'C', text: 'Duduk di rumput lapangan' }, { key: 'D', text: 'Berbicara dengan barisan sebelah' }],
            correctAnswer: 'A',
            explanation: 'Berdiri sikap sempurna saat upacara bendera menunjukkan cinta tanah air dan disiplin.',
            cognitiveLevel: 'LOTS',
            topic: 'Cinta Tanah Air'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Tari meminjam penggaris milik Kiki karena penggarisnya tertinggal di rumah.',
            question: 'Setelah selesai memakai penggaris pinjaman, sikap jujur dan tanggung jawab yang wajib dilakukan Tari adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Mengembalikan penggaris kepada Kiki sambil mengucapkan terima kasih' }, { key: 'B', text: 'Menyimpannya di tas sendiri tanpa bilang' }, { key: 'C', text: 'Mematahkannya lalu dibuang' }],
            optionsFaseBC: [{ key: 'A', text: 'Mengembalikan penggaris tepat waktu dalam keadaan utuh dan berterima kasih' }, { key: 'B', text: 'Membawanya pulang tanpa izin' }, { key: 'C', text: 'Memberikannya ke anak kelas lain' }, { key: 'D', text: 'Meninggalkannya di halaman sekolah' }],
            correctAnswer: 'A',
            explanation: 'Mengembalikan barang pinjaman dalam kondisi baik melatih kejujuran dan tanggung jawab.',
            cognitiveLevel: 'LOTS',
            topic: 'Tanggung Jawab Milik Orang Lain'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Di lingkungan tempat tinggal Bagas dibentuk pengurus Rukun Tetangga (RT) dan Rukun Warga (RW) untuk mengurus administrasi warga.',
            question: 'Kepala lingkungan masyarakat terkecil yang dipilih warga di tingkat beberapa puluh rumah disebut ketua ...',
            optionsFaseA: [{ key: 'A', text: 'Rukun Tetangga (RT)' }, { key: 'B', text: 'Gubernur provinsi' }, { key: 'C', text: 'Bupati kabupaten' }],
            optionsFaseBC: [{ key: 'A', text: 'Rukun Tetangga (RT)' }, { key: 'B', text: 'Camat kecamatan' }, { key: 'C', text: 'Bupati kabupaten' }, { key: 'D', text: 'Gubernur provinsi' }],
            correctAnswer: 'A',
            explanation: 'RT (Rukun Tetangga) adalah lembaga kemasyarakatan paling dekat dengan warga di tingkat lingkungan rumah.',
            cognitiveLevel: 'LOTS',
            topic: 'Pemerintahan Lingkungan'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Ketika teman sekelas sedang menjalankan ibadah puasa atau berdoa sebelum belajar, siswa lain tetap tenang dan tidak makan di depannya.',
            question: 'Perilaku menghormati umat beragama lain menjalankan ibadah dengan tenang adalah pengamalan nyata sila ...',
            optionsFaseA: [{ key: 'A', text: 'Ketuhanan Yang Maha Esa (Sila ke-1)' }, { key: 'B', text: 'Kerakyatan (Sila ke-4)' }, { key: 'C', text: 'Keadilan Sosial (Sila ke-5)' }],
            optionsFaseBC: [{ key: 'A', text: 'Sila ke-1 (Ketuhanan Yang Maha Esa)' }, { key: 'B', text: 'Sila ke-3 (Persatuan Indonesia)' }, { key: 'C', text: 'Sila ke-4 (Kerakyatan)' }, { key: 'D', text: 'Sila ke-5 (Keadilan Sosial)' }],
            correctAnswer: 'A',
            explanation: 'Toleransi antarumat beragama dan menghargai kebebasan beribadah merupakan wujud Sila ke-1.',
            cognitiveLevel: 'MOTS',
            topic: 'Toleransi Beragama'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Saat pembagian tugas kerja kelompok membuat kliping, semua anggota sepakat membagi pekerjaan secara merata tanpa ada yang menganggur.',
            question: 'Nilai keadilan dalam sila kelima Pancasila yang tampak dari pembagian tugas kelompok tersebut adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Pembagian hak dan kewajiban secara seimbang bagi semua anggota' }, { key: 'B', text: 'Satu orang mengerjakan seluruh tugas sendiri' }, { key: 'C', text: 'Memilih anggota yang paling kaya saja' }],
            optionsFaseBC: [{ key: 'A', text: 'Membagi tanggung jawab secara adil sesuai kemampuan setiap anggota' }, { key: 'B', text: 'Menyerahkan semua pekerjaan kepada ketua kelompok' }, { key: 'C', text: 'Mengutamakan anggota yang paling akrab saja' }, { key: 'D', text: 'Menunda pekerjaan hingga hari pengumpulan' }],
            correctAnswer: 'A',
            explanation: 'Adil berarti membagi porsi tugas dan penghargaan secara proporsional serta tidak berat sebelah.',
            cognitiveLevel: 'MOTS',
            topic: 'Keadilan dalam Kelompok'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Siswa diimbau menggunakan produk buatan pengrajin lokal seperti batik daerah dan sepatu buatan dalam negeri.',
            question: 'Mengutamakan memakai produk buatan bangsa Indonesia sendiri merupakan contoh nyata sikap ...',
            optionsFaseA: [{ key: 'A', text: 'Cinta tanah air dan bangga akan karya bangsa' }, { key: 'B', text: 'Meremehkan hasil karya anak negeri' }, { key: 'C', text: 'Boros dalam membelanjakan uang' }],
            optionsFaseBC: [{ key: 'A', text: 'Nasionalisme dan cinta produk dalam negeri (Sila ke-3)' }, { key: 'B', text: 'Gaya hidup konsumtif barang impor' }, { key: 'C', text: 'Sikap acuh tak acuh terhadap pengrajin' }, { key: 'D', text: 'Ketidakpedulian terhadap budaya lokal' }],
            correctAnswer: 'A',
            explanation: 'Mencintai produk dalam negeri mendukung perekonomian bangsa dan wujud Persatuan Indonesia.',
            cognitiveLevel: 'MOTS',
            topic: 'Cinta Produk Dalam Negeri'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Di perpustakaan sekolah tertempel tata tertib: "Kembalikan buku ke rak semula setelah selesai membaca dan jagalah ketenangan."',
            question: 'Jenis aturan yang dibuat oleh pihak sekolah untuk menjaga keteraturan warga sekolah tersebut termasuk aturan ...',
            optionsFaseA: [{ key: 'A', text: 'Tertulis (tata tertib sekolah)' }, { key: 'B', text: 'Adat istiadat lisan' }, { key: 'C', text: 'Peraturan lalu lintas jalan raya' }],
            optionsFaseBC: [{ key: 'A', text: 'Aturan tertulis sekolah' }, { key: 'B', text: 'Norma agama murni' }, { key: 'C', text: 'Adat kebiasaan kampung' }, { key: 'D', text: 'Hukum perdata negara' }],
            correctAnswer: 'A',
            explanation: 'Tata tertib sekolah yang dicetak dan dipasang di dinding merupakan aturan tertulis di lingkungan sekolah.',
            cognitiveLevel: 'LOTS',
            topic: 'Aturan Tertulis Sekolah'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Setiap anak memiliki hak bermain setelah belajar, namun ia juga memiliki kewajiban merapikan mainannya kembali.',
            question: 'Hubungan yang benar antara pelaksanaan kewajiban dan menuntut hak adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Melaksanakan kewajiban dengan penuh tanggung jawab sebelum menuntut hak' }, { key: 'B', text: 'Menuntut semua hak tanpa mau menjalankan kewajiban' }, { key: 'C', text: 'Menghindari kewajiban agar mendapat hak lebih banyak' }],
            optionsFaseBC: [{ key: 'A', text: 'Menjalankan kewajiban terlebih dahulu secara seimbang agar hak terpenuhi dengan tertib' }, { key: 'B', text: 'Mengutamakan hak pribadi di atas kewajiban bersama' }, { key: 'C', text: 'Melupakan kewajiban di rumah maupun sekolah' }, { key: 'D', text: 'Meminta orang lain mengerjakan kewajiban kita' }],
            correctAnswer: 'A',
            explanation: 'Hak dan kewajiban harus berjalan seimbang dengan mendahulukan pelaksanaan kewajiban.',
            cognitiveLevel: 'MOTS',
            topic: 'Keseimbangan Hak Kewajiban'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Pada tanggal 28 Oktober 1928, para pemuda dari berbagai daerah di Nusantara mengikrarkan satu tanah air, satu bangsa, dan satu bahasa persatuan.',
            question: 'Peristiwa bersejarah ikrar persatuan pemuda Indonesia tersebut dikenal sebagai ...',
            optionsFaseA: [{ key: 'A', text: 'Sumpah Pemuda' }, { key: 'B', text: 'Kebangkitan Nasional' }, { key: 'C', text: 'Konferensi Meja Bundar' }],
            optionsFaseBC: [{ key: 'A', text: 'Sumpah Pemuda' }, { key: 'B', text: 'Hari Kebangkitan Nasional' }, { key: 'C', text: 'Bandung Lautan Api' }, { key: 'D', text: 'Perjanjian Linggarjati' }],
            correctAnswer: 'A',
            explanation: 'Sumpah Pemuda 28 Oktober 1928 meneguhkan tekad persatuan bangsa Indonesia.',
            cognitiveLevel: 'LOTS',
            topic: 'Sumpah Pemuda'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Untuk mengurus kepentingan warga di tingkat daerah, kepala daerah seperti gubernur atau bupati dipilih oleh rakyat secara langsung.',
            question: 'Pemimpin pemerintahan tertinggi di wilayah tingkat provinsi di Indonesia adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Gubernur' }, { key: 'B', text: 'Walikota' }, { key: 'C', text: 'Lurah' }],
            optionsFaseBC: [{ key: 'A', text: 'Gubernur' }, { key: 'B', text: 'Bupati' }, { key: 'C', text: 'Walikota' }, { key: 'D', text: 'Camat' }],
            correctAnswer: 'A',
            explanation: 'Gubernur adalah kepala daerah tingkat provinsi, sedangkan bupati/walikota memimpin kabupaten/kota.',
            cognitiveLevel: 'LOTS',
            topic: 'Pemerintahan Daerah'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Para tokoh perumus dasar negara dalam sidang BPUPKI berbeda latar belakang, namun mereka rela berkompromi demi keutuhan bangsa Indonesia.',
            question: 'Sikap keteladanan para pendiri bangsa saat merumuskan Pancasila yang wajib kita tiru di sekolah adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Mengutamakan persatuan dan kepentingan bersama di atas kepentingan golongan' }, { key: 'B', text: 'Memaksakan pendapat pribadi sampai terjadi pertikaian' }, { key: 'C', text: 'Meninggalkan ruang rapat ketika usulan ditolak' }],
            optionsFaseBC: [{ key: 'A', text: 'Berjiwa besar, menghargai perbedaan, dan mendahulukan kepentingan bangsa di atas ego pribadi' }, { key: 'B', text: 'Mempertahankan kehendak kelompok sendiri tanpa kompromi' }, { key: 'C', text: 'Menghindari diskusi bersama teman berbeda suku' }, { key: 'D', text: 'Mengabaikan suara minoritas dalam rapat kelas' }],
            correctAnswer: 'A',
            explanation: 'Para pendiri bangsa meneladankan semangat musyawarah, toleransi, dan pengorbanan demi persatuan.',
            cognitiveLevel: 'HOTS',
            topic: 'Keteladanan Perumus Pancasila'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Bentuk negara Indonesia sebagaimana tercantum dalam Pasal 1 ayat (1) UUD NRI Tahun 1945 adalah Negara Kesatuan yang berbentuk Republik.',
            question: 'Arti penting persatuan dalam Negara Kesatuan Republik Indonesia (NKRI) adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Menjaga keutuhan wilayah serta mencegah perpecahan antardaerah' }, { key: 'B', text: 'Menghapus seluruh budaya daerah agar seragam' }, { key: 'C', text: 'Membatasi hak daerah untuk memajukan kesenian lokal' }],
            optionsFaseBC: [{ key: 'A', text: 'Memperkokoh kedaulatan bangsa dan menjaga keutuhan seluruh wilayah Nusantara' }, { key: 'B', text: 'Menghilangkan keragaman bahasa daerah Nusantara' }, { key: 'C', text: 'Mengutamakan pembangunan hanya di satu pulau saja' }, { key: 'D', text: 'Menutup kerja sama antarprovinsi' }],
            correctAnswer: 'A',
            explanation: 'NKRI bersatu dalam bingkai Bhinneka Tunggal Ika menjaga kedaulatan sekaligus menghormati kekayaan budaya daerah.',
            cognitiveLevel: 'MOTS',
            topic: 'Keutuhan NKRI'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Saat terjadi musibah banjir bandang di daerah tetangga, siswa mengumpulkan sumbangan sukarela berupa pakaian layak pakai dan alat tulis.',
            question: 'Penggalangan bantuan kemanusiaan bagi korban bencana alam mencerminkan pengamalan Pancasila terutama sila ke- ...',
            optionsFaseA: [{ key: 'A', text: 'Dua (Kemanusiaan yang adil dan beradab)' }, { key: 'B', text: 'Empat (Kerakyatan)' }, { key: 'C', text: 'Satu (Ketuhanan)' }],
            optionsFaseBC: [{ key: 'A', text: 'Sila kedua (Kemanusiaan yang adil dan beradab)' }, { key: 'B', text: 'Sila keempat (Kerakyatan)' }, { key: 'C', text: 'Sila pertama saja' }, { key: 'D', text: 'Tidak terkait nilai Pancasila' }],
            correctAnswer: 'A',
            explanation: 'Rasa empati, solidaritas kemanusiaan, dan menolong korban musibah adalah ciri utama Sila ke-2.',
            cognitiveLevel: 'MOTS',
            topic: 'Solidaritas Kemanusiaan'
        }
    ],
    ipas: [
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Pada pagi hari matahari tampak terbit di sebelah timur, sedangkan pada sore hari terbenam di sebelah barat.',
            question: 'Keadaan langit dan suhu udara pada siang hari ketika matahari bersinar terik terasa lebih ...',
            optionsFaseA: [{ key: 'A', text: 'Terang dan hangat' }, { key: 'B', text: 'Gelap gulita' }, { key: 'C', text: 'Beku bersalju' }],
            optionsFaseBC: [{ key: 'A', text: 'Terang dan hangat' }, { key: 'B', text: 'Gelap gulita' }, { key: 'C', text: 'Dingin membeku' }, { key: 'D', text: 'Bertabur bintang' }],
            correctAnswer: 'A',
            explanation: 'Sinar matahari pada siang hari menerangi dan menghangatkan permukaan bumi.',
            cognitiveLevel: 'LOTS',
            topic: 'Siang dan Malam'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Di kebun sekolah ada kupu-kupu hinggap di atas bunga mawar, sedangkan cacing bergerak di dalam tanah gembur.',
            question: 'Alat gerak yang digunakan kupu-kupu untuk terbang dari satu bunga ke bunga lain adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Sayap' }, { key: 'B', text: 'Sirip' }, { key: 'C', text: 'Ekor ikan' }],
            optionsFaseBC: [{ key: 'A', text: 'Sayap' }, { key: 'B', text: 'Sirip' }, { key: 'C', text: 'Sisik perut' }, { key: 'D', text: 'Kaki katak' }],
            correctAnswer: 'A',
            explanation: 'Kupu-kupu dan burung bergerak di udara menggunakan sepasang sayapnya.',
            cognitiveLevel: 'LOTS',
            topic: 'Alat Gerak Hewan'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Pada musim kemarau panjang, persediaan air sungai menyusut sehingga petani kesulitan mengairi sawah padi.',
            question: 'Tindakan sederhana siswa untuk ikut menghemat air bersih di sekolah maupun rumah adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Menutup keran air rapat-rapat setelah selesai mencuci tangan' }, { key: 'B', text: 'Membiarkan air bak mandi meluap terus' }, { key: 'C', text: 'Menyiram halaman beraspal setiap jam' }],
            optionsFaseBC: [{ key: 'A', text: 'Segera mematikan keran setelah dipakai dan menggunakan air secukupnya' }, { key: 'B', text: 'Membiarkan selang air mengalir tanpa dipakai' }, { key: 'C', text: 'Bermain semprot air sepanjang hari' }, { key: 'D', text: 'Membuang air minum sisa dengan sengaja' }],
            correctAnswer: 'A',
            explanation: 'Menutup keran setelah selesai memakai mencegah pemborosan air bersih.',
            cognitiveLevel: 'MOTS',
            topic: 'Konservasi Air'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Daerah pegunungan berhawa sejuk cocok ditanami teh dan sayuran, sedangkan daerah pantai berpasir menghasilkan ikan laut dan garam.',
            question: 'Mata pencaharian utama penduduk yang tinggal di kawasan pesisir pantai adalah sebagai ...',
            optionsFaseA: [{ key: 'A', text: 'Nelayan dan petani tambak garam' }, { key: 'B', text: 'Pemetik daun teh pegunungan' }, { key: 'C', text: 'Penebang kayu hutan pinus' }],
            optionsFaseBC: [{ key: 'A', text: 'Nelayan penangkap ikan dan petambak garam' }, { key: 'B', text: 'Petani kebun teh dataran tinggi' }, { key: 'C', text: 'Peternak sapi perah pegunungan' }, { key: 'D', text: 'Penambang batu bara bukit' }],
            correctAnswer: 'A',
            explanation: 'Kondisi geografis pantai menyediakan sumber daya ikan laut dan air asin bahan garam.',
            cognitiveLevel: 'MOTS',
            topic: 'Bentang Alam dan Ekonomi'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Di dalam sistem pernapasan manusia, udara masuk melalui hidung, melewati tenggorokan, lalu menuju gelembung halus di paru-paru.',
            question: 'Gas penting di udara yang dihirup paru-paru manusia untuk proses pembakaran sari makanan di dalam sel tubuh adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Oksigen' }, { key: 'B', text: 'Karbon monoksida' }, { key: 'C', text: 'Nitrogen cair' }],
            optionsFaseBC: [{ key: 'A', text: 'Oksigen (O₂)' }, { key: 'B', text: 'Karbon dioksida (CO₂)' }, { key: 'C', text: 'Gas metana' }, { key: 'D', text: 'Asap belerang' }],
            correctAnswer: 'A',
            explanation: 'Manusia menghirup oksigen (O₂) untuk metabolisme sel dan mengembuskan karbon dioksida.',
            cognitiveLevel: 'LOTS',
            topic: 'Sistem Pernapasan Manusia'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Penggunaan energi fosil seperti batu bara dan bensin secara berlebihan menghasilkan gas rumah kaca yang memerangkap panas di atmosfer.',
            question: 'Salah satu sumber energi alternatif terbarukan yang ramah lingkungan dan melimpah di negara tropis Indonesia adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Energi surya (matahari) melalui panel surya' }, { key: 'B', text: 'Minyak bumi mentah' }, { key: 'C', text: 'Batu bara tambang' }],
            optionsFaseBC: [{ key: 'A', text: 'Energi matahari (panel surya), angin, dan air terjun' }, { key: 'B', text: 'Batu bara dan solar' }, { key: 'C', text: 'Minyak tanah dan bensin' }, { key: 'D', text: 'Gas elpiji fosil' }],
            correctAnswer: 'A',
            explanation: 'Energi matahari, angin, dan air bersifat terbarukan serta tidak menimbulkan polusi asap karbon.',
            cognitiveLevel: 'MOTS',
            topic: 'Energi Alternatif Terbarukan'
        }
    ],
    pjok: [
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Saat melakukan latihan lari bolak-balik di halaman sekolah, setiap siswa harus mengenakan sepatu olahraga bertali rapi.',
            question: 'Manfaat memakai sepatu olahraga yang pas dan bertali kencang saat berolahraga adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Melindungi telapak kaki agar tidak lecet atau terpeleset' }, { key: 'B', text: 'Membuat langkah kaki terasa lebih berat' }, { key: 'C', text: 'Agar kaki tidak bisa berlari kencang' }],
            optionsFaseBC: [{ key: 'A', text: 'Melindungi kaki dari benda tajam dan mencegah terpeleset' }, { key: 'B', text: 'Menghambat gerakan melompat' }, { key: 'C', text: 'Membuat kaki mudah terkilir' }, { key: 'D', text: 'Menggantikan fungsi kaus kaki' }],
            correctAnswer: 'A',
            explanation: 'Sepatu olahraga melindungi kaki dari benturan, kerikil tajam, serta memberi cengkeraman kuat.',
            cognitiveLevel: 'LOTS',
            topic: 'Keselamatan Berolahraga'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Setelah bermain kejar-kejaran di bawah sinar matahari, baju terasa basah oleh keringat dan tubuh merasa haus.',
            question: 'Minuman sehat yang paling baik diminum untuk mengganti cairan tubuh setelah berolahraga adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Air putih matang bersih' }, { key: 'B', text: 'Minuman bersoda dingin sekali' }, { key: 'C', text: 'Kopi hitam pekat' }],
            optionsFaseBC: [{ key: 'A', text: 'Air putih bersih secukupnya' }, { key: 'B', text: 'Minuman bersoda manis' }, { key: 'C', text: 'Sirup kental bergula tinggi' }, { key: 'D', text: 'Kopi kental' }],
            correctAnswer: 'A',
            explanation: 'Air putih adalah cairan paling alami dan aman untuk mengembalikan hidrasi tubuh.',
            cognitiveLevel: 'LOTS',
            topic: 'Pola Hidup Sehat'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Mila menirukan gerak kelinci melompat ke depan dua kali, lalu bergerak ke samping mengikuti ketukan musik senam irama.',
            question: 'Saat mendarat dari gerakan melompat agar lutut tidak sakit, posisi kedua lutut sebaiknya ...',
            optionsFaseA: [{ key: 'A', text: 'Sedikit ditekuk mengeper secara lentur' }, { key: 'B', text: 'Dikunci lurus kaku sekuat tenaga' }, { key: 'C', text: 'Mendarat dengan tumit miring' }],
            optionsFaseBC: [{ key: 'A', text: 'Sedikit ditekuk (mengeper) untuk meredam benturan' }, { key: 'B', text: 'Diluruskan kaku tanpa ditekuk' }, { key: 'C', text: 'Menjatuhkan lutut langsung ke lantai' }, { key: 'D', text: 'Mendarat memakai satu jari kaki' }],
            correctAnswer: 'A',
            explanation: 'Menekuk lutut saat mendarat meredam gaya hentakan sehingga aman bagi sendi.',
            cognitiveLevel: 'MOTS',
            topic: 'Teknik Mendarat Melompat'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Dalam permainan bola basket mini, Gilang memantul-mantulkan bola ke lantai lapangan sambil berlari menuju ring lawan.',
            question: 'Teknik memantulkan bola ke lantai menggunakan satu tangan sambil bergerak dalam bola basket disebut ...',
            optionsFaseA: [{ key: 'A', text: 'Dribbling (Menggiring bola)' }, { key: 'B', text: 'Shooting (Menembak bola)' }, { key: 'C', text: 'Blocking (Menghadang)' }],
            optionsFaseBC: [{ key: 'A', text: 'Dribbling (Menggiring bola)' }, { key: 'B', text: 'Shooting (Menembak ke ring)' }, { key: 'C', text: 'Passing (Mengoper bola)' }, { key: 'D', text: 'Rebound' }],
            correctAnswer: 'A',
            explanation: 'Dribbling pada bola basket dilakukan dengan memantulkan bola ke lantai memakai satu telapak tangan secara bergantian atau tetap.',
            cognitiveLevel: 'LOTS',
            topic: 'Permainan Bola Basket'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Pada cabang atletik lompat jauh, atlet berlari cepat di lintasan awalan sebelum menumpu pada balok tumpuan.',
            question: 'Untuk memperoleh tolakan lompatan paling kuat ke arah depan-atas di balok tumpuan, pelompat menggunakan ...',
            optionsFaseA: [{ key: 'A', text: 'Satu kaki terkuat' }, { key: 'B', text: 'Kedua tangan menyentuh tanah' }, { key: 'C', text: 'Kedua lutut sekaligus' }],
            optionsFaseBC: [{ key: 'A', text: 'Satu kaki terkuat secara tepat di papan tumpu' }, { key: 'B', text: 'Kedua kaki bersamaan sambil berhenti' }, { key: 'C', text: 'Tumit kaki belakang diseret' }, { key: 'D', text: 'Tangan kanan mendorong papan' }],
            correctAnswer: 'A',
            explanation: 'Tolakan lompat jauh yang sah dan bertenaga menggunakan satu kaki terkuat di papan tumpuan.',
            cognitiveLevel: 'MOTS',
            topic: 'Atletik Lompat Jauh'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Saat menggosok gigi sebelum tidur malam, sikat gigi diarahkan dari pangkal gusi menuju ujung gigi secara lembut.',
            question: 'Dampak buruk jika seorang anak jarang menggosok gigi setelah makan makanan manis adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Gigi mudah berlubang dan sakit akibat bakteri sisa gula' }, { key: 'B', text: 'Gigi menjadi semakin putih berkilau' }, { key: 'C', text: 'Napas terasa lebih segar' }],
            optionsFaseBC: [{ key: 'A', text: 'Karies atau gigi berlubang serta radang gusi' }, { key: 'B', text: 'Gigi tumbuh lebih kuat dan mengilap' }, { key: 'C', text: 'Nafsu makan meningkat drastis' }, { key: 'D', text: 'Mulut terbebas dari plak selamanya' }],
            correctAnswer: 'A',
            explanation: 'Sisa gula yang menempel di gigi diubah bakteri menjadi asam yang mengikis email gigi hingga berlubang.',
            cognitiveLevel: 'LOTS',
            topic: 'Kebersihan Gigi dan Mulut'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Dalam permainan bulu tangkis, pemain memukul shuttlecock melambung tinggi ke bagian belakang lapangan lawan agar lawan terpaksa mundur.',
            question: 'Pukulan melambung tinggi jauh ke garis belakang lapangan lawan dalam permainan bulu tangkis disebut pukulan ...',
            optionsFaseA: [{ key: 'A', text: 'Lob' }, { key: 'B', text: 'Dropshot' }, { key: 'C', text: 'Netting' }],
            optionsFaseBC: [{ key: 'A', text: 'Pukulan Lob' }, { key: 'B', text: 'Pukulan Dropshot' }, { key: 'C', text: 'Pukulan Smes' }, { key: 'D', text: 'Pukulan Drive datar' }],
            correctAnswer: 'A',
            explanation: 'Pukulan lob melambungkan kok tinggi menuju area belakang lapangan lawan.',
            cognitiveLevel: 'MOTS',
            topic: 'Permainan Bulu Tangkis'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Saat melakukan gerak berirama (senam aerobik) secara berkelompok di halaman sekolah, musik pengiring diputar dengan ketukan tetap.',
            question: 'Faktor utama yang menyatukan seluruh gerakan tangan dan langkah kaki para siswa saat senam irama adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Kesesuaian gerak tubuh dengan ketukan irama musik' }, { key: 'B', text: 'Kecepatan masing-masing siswa tanpa memperhatikan musik' }, { key: 'C', text: 'Warna seragam olahraga yang dipakai' }],
            optionsFaseBC: [{ key: 'A', text: 'Keluwesan gerak, kontinuitas, dan keselarasan dengan ketukan irama' }, { key: 'B', text: 'Berlari secepat-cepatnya memutar lapangan' }, { key: 'C', text: 'Berhenti setiap tiga detik saat lagu diputar' }, { key: 'D', text: 'Melakukan gerakan berbeda-beda tiap anak' }],
            correctAnswer: 'A',
            explanation: 'Senam irama menekankan keserasian, kelenturan, dan ketepatan gerakan mengikuti ritme musik atau hitungan.',
            cognitiveLevel: 'MOTS',
            topic: 'Senam Irama Berkelompok'
        }
    ],
    seni: [
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Arka menggambar bentuk matahari memakai tutup botol air mineral sebagai cetakan lingkaran di buku gambar.',
            question: 'Bentuk dasar yang dihasilkan saat menjiplak keliling tutup botol air mineral adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Lingkaran' }, { key: 'B', text: 'Segitiga' }, { key: 'C', text: 'Bujur sangkar' }],
            optionsFaseBC: [{ key: 'A', text: 'Lingkaran' }, { key: 'B', text: 'Segitiga' }, { key: 'C', text: 'Persegi panjang' }, { key: 'D', text: 'Trapesium' }],
            correctAnswer: 'A',
            explanation: 'Penampang tutup botol berbentuk bulat sehingga menghasilkan bangun lingkaran.',
            cognitiveLevel: 'LOTS',
            topic: 'Mengenal Bentuk Lingkaran'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Wulan mencelupkan spons bekas ke dalam cat air merah dan menepukkannya perlahan di atas gambar daun.',
            question: 'Kesan bintik-bintik halus pada gambar yang dibuat menggunakan spons disebut memberi variasi ... gambar.',
            optionsFaseA: [{ key: 'A', text: 'Tekstur visual' }, { key: 'B', text: 'Ukuran berat' }, { key: 'C', text: 'Nada suara' }],
            optionsFaseBC: [{ key: 'A', text: 'Tekstur rupa' }, { key: 'B', text: 'Volume bunyi' }, { key: 'C', text: 'Tempo lagu' }, { key: 'D', text: 'Berat benda' }],
            correctAnswer: 'A',
            explanation: 'Cap spons membentuk kesan tekstur semu pada permukaan kertas gambar.',
            cognitiveLevel: 'MOTS',
            topic: 'Tekstur dalam Gambar'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Ketika menyanyi lagu anak bersama di kelas, suara tinggi dan suara rendah bergantian membuat lagu terdengar merdu.',
            question: 'Rangkaian nada yang tersusun berurutan sehingga enak didengar dalam sebuah lagu disebut ...',
            optionsFaseA: [{ key: 'A', text: 'Melodi' }, { key: 'B', text: 'Warna primer' }, { key: 'C', text: 'Garis lengkung' }],
            optionsFaseBC: [{ key: 'A', text: 'Melodi' }, { key: 'B', text: 'Warna primer' }, { key: 'C', text: 'Tekstur kasar' }, { key: 'D', text: 'Pola lantai' }],
            correctAnswer: 'A',
            explanation: 'Melodi adalah susunan rangkaian nada berirama yang membentuk lagu.',
            cognitiveLevel: 'LOTS',
            topic: 'Unsur Melodi Musik'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Hana membuat kartu ucapan Hari Ibu dengan melipat kertas karton menjadi dua lalu menempelkan bunga kertas yang muncul saat kartu dibuka.',
            question: 'Jenis karya kartu ucapan dengan gambar timbul saat lembaran kartu dibuka disebut kartu ...',
            optionsFaseA: [{ key: 'A', text: 'Pop-up' }, { key: 'B', text: 'Siluet hitam' }, { key: 'C', text: 'Fresco dinding' }],
            optionsFaseBC: [{ key: 'A', text: 'Kartu pop-up (timbul)' }, { key: 'B', text: 'Lukisan cat minyak' }, { key: 'C', text: 'Cetakan kayu datar' }, { key: 'D', text: 'Patung marmer' }],
            correctAnswer: 'A',
            explanation: 'Teknik lipat dan potong pop-up membuat objek di tengah kartu tampak timbul tiga dimensi saat dibuka.',
            cognitiveLevel: 'MOTS',
            topic: 'Karya Lipat Pop-up'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Ragam hias tradisional pada kain tenun atau ukiran kayu banyak meniru bentuk bunga, sulur daun, dan kelopak teratai.',
            question: 'Motif hiasan yang mengambil inspirasi bentuk dari dunia tumbuh-tumbuhan disebut motif ...',
            optionsFaseA: [{ key: 'A', text: 'Flora (Tumbuhan)' }, { key: 'B', text: 'Fauna (Hewan)' }, { key: 'C', text: 'Geometris sudut' }],
            optionsFaseBC: [{ key: 'A', text: 'Motif flora (tumbuh-tumbuhan)' }, { key: 'B', text: 'Motif fauna (hewan)' }, { key: 'C', text: 'Motif geometris murni' }, { key: 'D', text: 'Motif kaligrafi huruf' }],
            correctAnswer: 'A',
            explanation: 'Ragam hias flora menggayakan bentuk daun, bunga, dan sulur tanaman.',
            cognitiveLevel: 'LOTS',
            topic: 'Ragam Hias Flora'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Pada sebuah pementasan drama anak di aula sekolah, penata panggung mengatur lampu sorot berwarna biru redup untuk menggambarkan suasana malam hari.',
            question: 'Unsur pementasan seni teater yang bertugas mengatur gelap terang serta suasana waktu adegan dengan lampu panggung adalah tata ...',
            optionsFaseA: [{ key: 'A', text: 'Cahaya (Pencahayaan)' }, { key: 'B', text: 'Rias wajah' }, { key: 'C', text: 'Busana aktor' }],
            optionsFaseBC: [{ key: 'A', text: 'Tata cahaya (Lighting)' }, { key: 'B', text: 'Tata rias wajah' }, { key: 'C', text: 'Tata busana aktor' }, { key: 'D', text: 'Tata gerak tari' }],
            correctAnswer: 'A',
            explanation: 'Tata cahaya menciptakan atmosfer waktu dan emosi panggung dalam seni teater.',
            cognitiveLevel: 'LOTS',
            topic: 'Tata Cahaya Teater'
        }
    ],
    inggris: [
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Before entering the classroom, Ben knocks on the door and smiles at his teacher.',
            question: 'When Ben accidentally steps on his friend\'s foot, what should he say?',
            optionsFaseA: [{ key: 'A', text: 'I am sorry!' }, { key: 'B', text: 'You are welcome!' }, { key: 'C', text: 'Good afternoon!' }],
            optionsFaseBC: [{ key: 'A', text: 'I am sorry!' }, { key: 'B', text: 'You are welcome!' }, { key: 'C', text: 'Good night!' }, { key: 'D', text: 'Nice to meet you!' }],
            correctAnswer: 'A',
            explanation: 'We say "I am sorry" to apologize when we make a mistake.',
            cognitiveLevel: 'LOTS',
            topic: 'Polite Apology'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Sara points at a sweet red round fruit growing on the tree in her garden.',
            question: 'Which fruit is red, sweet, and crunchy when we bite it?',
            optionsFaseA: [{ key: 'A', text: 'An apple' }, { key: 'B', text: 'A lemon' }, { key: 'C', text: 'A carrot' }],
            optionsFaseBC: [{ key: 'A', text: 'An apple' }, { key: 'B', text: 'A lemon' }, { key: 'C', text: 'A cucumber' }, { key: 'D', text: 'A potato' }],
            correctAnswer: 'A',
            explanation: 'An apple is commonly red, sweet, and crunchy.',
            cognitiveLevel: 'LOTS',
            topic: 'Fruits Vocabulary'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Look at the clock on the wall. It is time to sleep at 9 o\'clock at night.',
            question: 'What greeting does Max say to his parents before going to bed?',
            optionsFaseA: [{ key: 'A', text: 'Good night, Mom and Dad!' }, { key: 'B', text: 'Good morning, Mom and Dad!' }, { key: 'C', text: 'How are you doing?' }],
            optionsFaseBC: [{ key: 'A', text: 'Good night, Mom and Dad!' }, { key: 'B', text: 'Good morning, Mom and Dad!' }, { key: 'C', text: 'Good afternoon!' }, { key: 'D', text: 'Thank you very much!' }],
            correctAnswer: 'A',
            explanation: '"Good night" is used as a farewell greeting before sleeping at night.',
            cognitiveLevel: 'LOTS',
            topic: 'Bedtime Greeting'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Look at the family schedule: Every Sunday morning, Ella waters the flowers while her father washes the car.',
            question: 'What does Ella do on Sunday morning?',
            optionsFaseA: [{ key: 'A', text: 'She waters the flowers' }, { key: 'B', text: 'She washes the car' }, { key: 'C', text: 'She goes to school' }],
            optionsFaseBC: [{ key: 'A', text: 'She waters the flowers' }, { key: 'B', text: 'She washes the car' }, { key: 'C', text: 'She cooks fried rice' }, { key: 'D', text: 'She visits the zoo' }],
            correctAnswer: 'A',
            explanation: 'The text states clearly that Ella waters the flowers every Sunday morning.',
            cognitiveLevel: 'LOTS',
            topic: 'Reading Daily Activities'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'In the zoo, Jake sees an animal with black and white stripes running across the grass field.',
            question: 'Which wild animal has black and white stripes on its body?',
            optionsFaseA: [{ key: 'A', text: 'A zebra' }, { key: 'B', text: 'A kangaroo' }, { key: 'C', text: 'A monkey' }],
            optionsFaseBC: [{ key: 'A', text: 'A zebra' }, { key: 'B', text: 'A kangaroo' }, { key: 'C', text: 'A bear' }, { key: 'D', text: 'A hippo' }],
            correctAnswer: 'A',
            explanation: 'A zebra is famous for its black and white striped coat.',
            cognitiveLevel: 'LOTS',
            topic: 'Zoo Animals'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Read the short sign inside the library: "SILENCE PLEASE. OTHERS ARE READING."',
            question: 'What should students do inside the library according to the sign?',
            optionsFaseA: [{ key: 'A', text: 'Keep quiet and avoid making loud noise' }, { key: 'B', text: 'Sing loudly with friends' }, { key: 'C', text: 'Play soccer near the bookshelves' }],
            optionsFaseBC: [{ key: 'A', text: 'Stay quiet and speak softly so others can read peacefully' }, { key: 'B', text: 'Shout and run around the tables' }, { key: 'C', text: 'Turn on loud music' }, { key: 'D', text: 'Close the library doors forever' }],
            correctAnswer: 'A',
            explanation: '"Silence please" asks visitors to remain quiet.',
            cognitiveLevel: 'LOTS',
            topic: 'Public Signs'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Emma has a younger brother. Her younger brother is eight years old, whereas Emma is twelve years old.',
            question: 'Which statement accurately compares Emma and her brother?',
            optionsFaseA: [{ key: 'A', text: 'Emma is older than her brother.' }, { key: 'B', text: 'Emma is younger than her brother.' }, { key: 'C', text: 'Her brother is taller than the school building.' }],
            optionsFaseBC: [{ key: 'A', text: 'Emma is older than her brother.' }, { key: 'B', text: 'Emma is younger than her brother.' }, { key: 'C', text: 'They were born in the same year.' }, { key: 'D', text: 'Her brother is twelve years old.' }],
            correctAnswer: 'A',
            explanation: 'Twelve is older than eight, so Emma is older than her brother.',
            cognitiveLevel: 'MOTS',
            topic: 'Comparing Ages'
        }
    ],
    pai: [
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Sebelum makan siang di rumah, Dito duduk rapi dan berdoa memohon keberkahan rezeki kepada Allah Swt.',
            question: 'Menggunakan tangan ... saat makan dan minum merupakan adab makan yang dicontohkan Nabi Muhammad saw.',
            optionsFaseA: [{ key: 'A', text: 'Kanan' }, { key: 'B', text: 'Kiri' }, { key: 'C', text: 'Kedua kaki' }],
            optionsFaseBC: [{ key: 'A', text: 'Kanan' }, { key: 'B', text: 'Kiri' }, { key: 'C', text: 'Siku' }, { key: 'D', text: 'Jari kelingking' }],
            correctAnswer: 'A',
            explanation: 'Rasulullah saw. mengajarkan makan dan minum memakai tangan kanan sambil duduk tenang.',
            cognitiveLevel: 'LOTS',
            topic: 'Adab Makan dan Minum'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Ketika mendengar suara azan berkumandang dari masjid dekat rumah, umat Islam segera bersiap menunaikan ibadah.',
            question: 'Azan dikumandangkan oleh muazin sebagai tanda telah masuknya waktu ...',
            optionsFaseA: [{ key: 'A', text: 'Salat' }, { key: 'B', text: 'Bermain bola' }, { key: 'C', text: 'Tidur malam' }],
            optionsFaseBC: [{ key: 'A', text: 'Salat fardu' }, { key: 'B', text: 'Berangkat sekolah' }, { key: 'C', text: 'Istirahat makan' }, { key: 'D', text: 'Kerja bakti' }],
            correctAnswer: 'A',
            explanation: 'Azan adalah panggilan resmi bagi umat Islam bahwa waktu salat wajib telah tiba.',
            cognitiveLevel: 'LOTS',
            topic: 'Azan dan Ikamah'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Di antara sifat Allah Swt. adalah Ar-Rahman yang berarti Maha Pengasih kepada seluruh makhluk di dunia.',
            question: 'Bentuk meneladani kasih sayang Allah Swt. terhadap hewan peliharaan di rumah adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Memberi makan dan minum secara teratur' }, { key: 'B', text: 'Menyakiti dan mengusirnya saat lapar' }, { key: 'C', text: 'Mengurungnya tanpa diberi air' }],
            optionsFaseBC: [{ key: 'A', text: 'Merawat, memberi makan dan minum dengan kasih sayang' }, { key: 'B', text: 'Membiarkannya kelaparan di kandang' }, { key: 'C', text: 'Melempari hewan yang lewat' }, { key: 'D', text: 'Merusak sarang burung di pohon' }],
            correctAnswer: 'A',
            explanation: 'Menyayangi makhluk ciptaan Allah termasuk hewan merupakan wujud meneladani sifat Ar-Rahman.',
            cognitiveLevel: 'MOTS',
            topic: 'Meneladani Ar-Rahman'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Nabi Ibrahim a.s. bersama putranya Nabi Ismail a.s. mendirikan kembali bangunan suci di Kota Makkah yang menjadi kiblat salat umat Islam.',
            question: 'Nama bangunan suci berbentuk kubus di Masjidil Haram Kota Makkah yang menjadi arah kiblat salat tersebut adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Ka\'bah' }, { key: 'B', text: 'Masjid Nabawi' }, { key: 'C', text: 'Masjid Al-Aqsa' }],
            optionsFaseBC: [{ key: 'A', text: 'Ka\'bah' }, { key: 'B', text: 'Masjid Quba' }, { key: 'C', text: 'Bukit Safa' }, { key: 'D', text: 'Gua Hira' }],
            correctAnswer: 'A',
            explanation: 'Ka\'bah di Masjidil Haram merupakan arah kiblat seluruh umat Islam saat salat.',
            cognitiveLevel: 'LOTS',
            topic: 'Kisah Nabi Ibrahim dan Ka\'bah'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Ketika sedang melakukan salat berjemaah di masjid, makmum mengikuti setiap gerakan imam dari takbiratulihram hingga salam.',
            question: 'Orang yang berdiri di barisan depan dan bertugas memimpin pelaksanaan salat berjemaah disebut ...',
            optionsFaseA: [{ key: 'A', text: 'Imam' }, { key: 'B', text: 'Makmum' }, { key: 'C', text: 'Khatib' }],
            optionsFaseBC: [{ key: 'A', text: 'Imam' }, { key: 'B', text: 'Makmum' }, { key: 'C', text: 'Khatib' }, { key: 'D', text: 'Muazin' }],
            correctAnswer: 'A',
            explanation: 'Pemimpin salat berjemaah disebut imam, sedangkan jemaah yang mengikuti di belakang disebut makmum.',
            cognitiveLevel: 'LOTS',
            topic: 'Salat Berjemaah'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Setiap umat Islam dianjurkan membaca istigfar apabila terlanjur berbuat kekhilafan atau kesalahan terhadap sesama maupun Allah Swt.',
            question: 'Bunyi kalimat tayyibah istigfar untuk memohon ampunan kepada Allah Swt. adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Astaghfirullahal azim' }, { key: 'B', text: 'Allahu Akbar' }, { key: 'C', text: 'Subhanallah' }],
            optionsFaseBC: [{ key: 'A', text: 'Astaghfirullahal azim' }, { key: 'B', text: 'Allahu Akbar' }, { key: 'C', text: 'Subhanallah' }, { key: 'D', text: 'Inna lillahi wa inna ilaihi rajiun' }],
            correctAnswer: 'A',
            explanation: 'Istigfar (Astaghfirullahal azim) berarti aku memohon ampun kepada Allah Yang Maha Agung.',
            cognitiveLevel: 'LOTS',
            topic: 'Kalimat Tayyibah Istigfar'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Pada usia empat puluh tahun, Nabi Muhammad saw. menerima wahyu pertama di Gua Hira melalui Malaikat Jibril.',
            question: 'Lima ayat pertama Al-Qur\'an yang diturunkan sebagai wahyu pertama di Gua Hira adalah Surah ...',
            optionsFaseA: [{ key: 'A', text: 'Al-Alaq ayat 1–5' }, { key: 'B', text: 'An-Nas ayat 1–6' }, { key: 'C', text: 'Al-Ikhlas ayat 1–4' }],
            optionsFaseBC: [{ key: 'A', text: 'Al-Alaq ayat 1–5' }, { key: 'B', text: 'Al-Falaq ayat 1–5' }, { key: 'C', text: 'Al-Kausar ayat 1–3' }, { key: 'D', text: 'Al-Asr ayat 1–3' }],
            correctAnswer: 'A',
            explanation: 'Wahyu pertama adalah Surah Al-Alaq ayat 1–5 yang diawali perintah "Iqra" (Bacalah).',
            cognitiveLevel: 'LOTS',
            topic: 'Turunnya Wahyu Pertama'
        }
    ],
    koding: [
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Kiki ingin mengirim ucapan selamat ulang tahun berupa gambar digital melalui komputer sekolah.',
            question: 'Perangkat keluaran komputer yang dipakai untuk mencetak gambar ucapan menjadi kertas fisik adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Printer (Mesin pencetak)' }, { key: 'B', text: 'Keyboard' }, { key: 'C', text: 'Mikrofon' }],
            optionsFaseBC: [{ key: 'A', text: 'Printer' }, { key: 'B', text: 'Keyboard' }, { key: 'C', text: 'Mouse' }, { key: 'D', text: 'Webcam' }],
            correctAnswer: 'A',
            explanation: 'Printer mengubah dokumen atau gambar digital dari komputer ke atas lembaran kertas.',
            cognitiveLevel: 'LOTS',
            topic: 'Perangkat Output Printer'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Perhatikan deret gambar buah yang disusun Tari: Apel - Jeruk - Apel - Jeruk - Apel - [ ... ].',
            question: 'Gambar buah berikutnya untuk melanjutkan susunan pola tersebut adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Jeruk' }, { key: 'B', text: 'Apel' }, { key: 'C', text: 'Mangga' }],
            optionsFaseBC: [{ key: 'A', text: 'Jeruk' }, { key: 'B', text: 'Apel' }, { key: 'C', text: 'Semangka' }, { key: 'D', text: 'Nanas' }],
            correctAnswer: 'A',
            explanation: 'Pola berulang bergantian Apel dan Jeruk.',
            cognitiveLevel: 'LOTS',
            topic: 'Pola Berulang Sederhana'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Agar ruang laboratorium komputer tetap aman dan nyaman dipakai bersama, siswa dilarang membawa minuman ke dekat keyboard.',
            question: 'Alasan tidak boleh meletakkan gelas air minum di sebelah papan ketik komputer adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Jika tumpah dapat merusak rangkaian listrik komputer' }, { key: 'B', text: 'Air akan berubah menjadi huruf di layar' }, { key: 'C', text: 'Keyboard akan terasa dingin' }],
            optionsFaseBC: [{ key: 'A', text: 'Tumpahan cairan dapat menyebabkan korsleting dan merusak perangkat komputer' }, { key: 'B', text: 'Huruf di keyboard langsung menghilang' }, { key: 'C', text: 'Komputer berjalan lebih cepat' }, { key: 'D', text: 'Warna monitor berubah hijau' }],
            correctAnswer: 'A',
            explanation: 'Cairan yang tumpah mengenai komponen elektronik berisiko merusak papan ketik dan sirkuit.',
            cognitiveLevel: 'LOTS',
            topic: 'Keselamatan Lab Komputer'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Saat menuliskan daftar belanja ibu ke dalam aplikasi catatan komputer, Bagas menyusunnya dari huruf depan abjad A sampai Z.',
            question: 'Proses menyusun daftar data secara urut dari kecil ke besar atau abjad A hingga Z dalam informatika disebut ...',
            optionsFaseA: [{ key: 'A', text: 'Pengurutan (Sorting)' }, { key: 'B', text: 'Penghapusan data' }, { key: 'C', text: 'Penggandaan berkas' }],
            optionsFaseBC: [{ key: 'A', text: 'Pengurutan (Sorting)' }, { key: 'B', text: 'Penghapusan berkas' }, { key: 'C', text: 'Pemutusan jaringan' }, { key: 'D', text: 'Pengiriman email' }],
            correctAnswer: 'A',
            explanation: 'Sorting adalah proses menyusun sekumpulan data secara terurut menurut aturan abjad atau nilai angka.',
            cognitiveLevel: 'LOTS',
            topic: 'Pengurutan Data (Sorting)'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Untuk menggerakkan karakter mobil di gim edukasi menggunakan tombol panah kanan pada keyboard, pemrogram memakai blok kejadian (event).',
            question: 'Fungsi blok kejadian "ketika tombol spasi ditekan" dalam pemrograman Scratch adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Menunggu aksi pengguna menekan spasi untuk memulai perintah di bawahnya' }, { key: 'B', text: 'Menghapus karakter secara permanen' }, { key: 'C', text: 'Mematikan layar komputer otomatis' }],
            optionsFaseBC: [{ key: 'A', text: 'Menjadi pemicu (trigger) menjalankan blok perintah ketika tombol spasi ditekan' }, { key: 'B', text: 'Mengganti ukuran monitor' }, { key: 'C', text: 'Menghapus seluruh proyek gim' }, { key: 'D', text: 'Memutus sambungan internet' }],
            correctAnswer: 'A',
            explanation: 'Blok Event memicu jalannya instruksi saat terjadi suatu kejadian (klik bendera hijau atau tekan tombol).',
            cognitiveLevel: 'MOTS',
            topic: 'Blok Kejadian (Events)'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Asisten suara pintar di ponsel dapat memutar lagu anak ketika pengguna menyebutkan judul lagu ke mikrofon.',
            question: 'Perangkat masukan pada ponsel atau laptop yang menangkap gelombang suara pengguna untuk dikenali AI adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Mikrofon' }, { key: 'B', text: 'Layar sentuh' }, { key: 'C', text: 'Printer' }],
            optionsFaseBC: [{ key: 'A', text: 'Mikrofon' }, { key: 'B', text: 'Printer' }, { key: 'C', text: 'Speaker' }, { key: 'D', text: 'Flashdisk' }],
            correctAnswer: 'A',
            explanation: 'Mikrofon menangkap suara (input audio) yang diproses teknologi pengenal suara (speech recognition).',
            cognitiveLevel: 'LOTS',
            topic: 'Teknologi Pengenal Suara'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Saat mencari artikel ilmiah untuk tugas kelas enam di mesin pencari internet, Reza membandingkan tiga situs resmi sebelum mencatat hasilnya.',
            question: 'Mengapa menuliskan sumber referensi atau tautan situs asli pada laporan tugas sekolah sangat penting dilakukan?',
            optionsFaseA: [{ key: 'A', text: 'Menghargai karya penulis asli dan mencegah tindakan plagiarisme' }, { key: 'B', text: 'Membuat tugas terasa lebih sulit dibaca guru' }, { key: 'C', text: 'Agar file dokumen berukuran lebih besar' }],
            optionsFaseBC: [{ key: 'A', text: 'Menghormati hak cipta penulis asli serta menjaga kejujuran akademik (anti-plagiarisme)' }, { key: 'B', text: 'Menyembunyikan fakta bahwa informasi berasal dari internet' }, { key: 'C', text: 'Memperbanyak halaman kosong' }, { key: 'D', text: 'Mengganti nama pengarang menjadi nama sendiri' }],
            correctAnswer: 'A',
            explanation: 'Mencantumkan sumber rujukan adalah bentuk etika digital menghargai hak cipta dan kejujuran ilmiah.',
            cognitiveLevel: 'HOTS',
            topic: 'Etika Hak Cipta Digital'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Seorang siswa ingin menyusun kata sandi (password) baru untuk akun belajar sekolahnya agar tidak mudah ditebak oleh peretas.',
            question: 'Contoh kata sandi di bawah ini yang paling kuat dan aman untuk melindungi akun belajar siswa adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Kopi#Pagi26!Raka' }, { key: 'B', text: '123456' }, { key: 'C', text: 'password' }],
            optionsFaseBC: [{ key: 'A', text: 'Bintang#72!Biru (kombinasi huruf besar, kecil, angka, dan simbol)' }, { key: 'B', text: '12345678' }, { key: 'C', text: 'namakusendiri' }, { key: 'D', text: 'abcdefg' }],
            correctAnswer: 'A',
            explanation: 'Kata sandi kuat menggabungkan huruf kapital, huruf kecil, angka, dan karakter simbol minimal 8–12 karakter.',
            cognitiveLevel: 'MOTS',
            topic: 'Keamanan Kata Sandi'
        }
    ],
    mulok: [
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Imas diajar ngitung benda di kelas maké Basa Sunda: hiji patlot, dua buku, tilu panghapus.',
            question: 'Kecap bilangan dina Basa Sunda pikeun angka opat (4) nyaéta ...',
            optionsFaseA: [{ key: 'A', text: 'Opat' }, { key: 'B', text: 'Lima' }, { key: 'C', text: 'Tujuh' }],
            optionsFaseBC: [{ key: 'A', text: 'Opat' }, { key: 'B', text: 'Tilu' }, { key: 'C', text: 'Lima' }, { key: 'D', text: 'Genep' }],
            correctAnswer: 'A',
            explanation: 'Urutan wilangan Basa Sunda: hiji (1), dua (2), tilu (3), opat (4), lima (5).',
            cognitiveLevel: 'LOTS',
            topic: 'Wilangan Hiji Nepi Sapuluh'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Isuk-isuk langit caang sarta panonpoé mimiti muncul ti belah wétan.',
            question: 'Sabalikna tina waktu isuk-isuk anu caang nyaéta waktu peuting anu ...',
            optionsFaseA: [{ key: 'A', text: 'Poék' }, { key: 'B', text: 'Ramé' }, { key: 'C', text: 'Haneut' }],
            optionsFaseBC: [{ key: 'A', text: 'Poék' }, { key: 'B', text: 'Caang' }, { key: 'C', text: 'Panas' }, { key: 'D', text: 'Tiis' }],
            correctAnswer: 'A',
            explanation: 'Poék mangrupa lawan kecap tina caang dina Basa Sunda.',
            cognitiveLevel: 'LOTS',
            topic: 'Kaayaan Alam Sapopoé'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Di buruan sakola aya tangkal mangga anu buahna geus karolot sarta rasana amis.',
            question: 'Bagian awak urang anu dipaké pikeun ngarasakeun amis atawa haseum kadaharan nyaéta ...',
            optionsFaseA: [{ key: 'A', text: 'Létah' }, { key: 'B', text: 'Irung' }, { key: 'C', text: 'Rambut' }],
            optionsFaseBC: [{ key: 'A', text: 'Létah (Ilah)' }, { key: 'B', text: 'Irung (Pangambung)' }, { key: 'C', text: 'Cepil (Ceuli)' }, { key: 'D', text: 'Rambut (Buuk)' }],
            correctAnswer: 'A',
            explanation: 'Létah nyaéta alat indra pikeun ngarasakeun rasa amis, asin, pait, jeung haseum.',
            cognitiveLevel: 'LOTS',
            topic: 'Pancaindra Dina Basa Sunda'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Nalika rék ngaliwat ka hareupeun bapa atawa ibu guru nu nuju calik, barudak kudu ngabungkukkeun awak bari nyarios sopan.',
            question: 'Kecap paménta ijin anu sopan nalika ngaliwat ka payuneun sepuh nyaéta ...',
            optionsFaseA: [{ key: 'A', text: 'Punten, ngiring ngalangkung' }, { key: 'B', text: 'Awas, minggir heula!' }, { key: 'C', text: 'Wilujeng bobo!' }],
            optionsFaseBC: [{ key: 'A', text: 'Punten, ngiring ngalangkung' }, { key: 'B', text: 'Awas rék lumpat!' }, { key: 'C', text: 'Hatur nuhun sadayana' }, { key: 'D', text: 'Wilujeng tuang' }],
            correctAnswer: 'A',
            explanation: '"Punten, ngiring ngalangkung" nyaéta ungkapan tatakrama has Sunda nalika ngaliwat di payuneun batur.',
            cognitiveLevel: 'LOTS',
            topic: 'Tatakrama Ngalangkung'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Baca cutatan paguneman ieu:\nDédi: "Gus, kumaha lamun poé Saptu urang latihan kaulinan bébénténgan?"\nAgus: "Hayu atuh, alus pisan éta usul téh!"',
            question: 'Naon anu direncanakeun ku Dédi jeung Agus pikeun poé Saptu nurutkeun paguneman di luhur?',
            optionsFaseA: [{ key: 'A', text: 'Latihan kaulinan bébénténgan babarengan' }, { key: 'B', text: 'Mancing lauk di walungan' }, { key: 'C', text: 'Balanja ka pasar kota' }],
            optionsFaseBC: [{ key: 'A', text: 'Maén kaulinan tradisional bébénténgan babarengan' }, { key: 'B', text: 'Ngala buah jambu di kebon' }, { key: 'C', text: 'Ngalukis pemandangan gunung' }, { key: 'D', text: 'Ngalap méja di kelas' }],
            correctAnswer: 'A',
            explanation: 'Dina paguneman disebutkeun Dédi ngajak Agus maén kaulinan bébénténgan poé Saptu.',
            cognitiveLevel: 'LOTS',
            topic: 'Maca Paguneman'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Héndra unggal poé ngabantuan indungna nyiram kembang di taman hareupeun imah sangkan teu garing.',
            question: 'Kecap dasar tina kecap "nyiram" dina kalimah di luhur nyaéta ...',
            optionsFaseA: [{ key: 'A', text: 'Siram' }, { key: 'B', text: 'Nyira' }, { key: 'C', text: 'Ram' }],
            optionsFaseBC: [{ key: 'A', text: 'Siram' }, { key: 'B', text: 'Nyira' }, { key: 'C', text: 'Sira' }, { key: 'D', text: 'Iram' }],
            correctAnswer: 'A',
            explanation: 'Kecap "nyiram" asalna tina kecap dasar "siram" anu meunang rarangkén hareup nasal ny-.',
            cognitiveLevel: 'MOTS',
            topic: 'Kecap Dasar Jeung Rarangkén'
        }
    ]
};
