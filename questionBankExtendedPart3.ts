import type {
    QuestionBankItemPG,
    QuestionBankItemIsian,
    QuestionBankItemUraian
} from './questionBankHelper';

// Extended Part 3:
// 1. Extra PG items per subject (especially boosting Fase A & B & C to eliminate cross-class & within-exam exhaustion)
// 2. Comprehensive grade-scoped Isian banks for all 9 non-math subjects
// 3. Comprehensive grade-scoped Uraian banks (with rubrics) for all 9 non-math subjects

export const EXTRA_PG_BY_CAT: Record<string, QuestionBankItemPG[]> = {
    indo: [
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Ibu menaruh buah jeruk di atas meja ruang tamu. Kakak meletakkan buku cerita di dalam tas sekolah.',
            question: 'Kata depan yang menunjukkan letak buah jeruk pada kalimat pertama adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'di atas' },
                { key: 'B', text: 'ke dalam' },
                { key: 'C', text: 'dari luar' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'di atas' },
                { key: 'B', text: 'di bawah' },
                { key: 'C', text: 'ke samping' },
                { key: 'D', text: 'dari jauh' }
            ],
            correctAnswer: 'A',
            explanation: 'Kata "di atas" menyatakan posisi benda berada pada permukaan bagian atas meja.',
            cognitiveLevel: 'LOTS',
            topic: 'Kata Depan Tempat'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Perhatikan tanda peringatan di taman sekolah: "DILARANG MENGINJAK RUMPUT".',
            question: 'Maksud tulisan peringatan di taman tersebut adalah kita tidak boleh ...',
            optionsFaseA: [
                { key: 'A', text: 'Berjalan atau berlari di atas rumput taman' },
                { key: 'B', text: 'Menyiram tanaman setiap pagi' },
                { key: 'C', text: 'Melihat bunga dari tepi jalan setapak' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Menginjak atau merusak rumput di taman' },
                { key: 'B', text: 'Menyiram tanaman di pot' },
                { key: 'C', text: 'Duduk di bangku taman' },
                { key: 'D', text: 'Membersihkan daun kering' }
            ],
            correctAnswer: 'A',
            explanation: 'Larangan menginjak rumput bertujuan menjaga kelestarian tanaman taman.',
            cognitiveLevel: 'LOTS',
            topic: 'Memahami Tanda Larangan'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Bacalah paragraf pendek berikut: "1) Kebersihan halaman sekolah merupakan tanggung jawab semua warga sekolah. 2) Setiap pagi siswa menyapu daun kering yang berguguran. 3) Sampah plastik dikumpulkan terpisah di bak daur ulang."',
            question: 'Kalimat utama yang merangkum inti seluruh isi paragraf di atas terdapat pada kalimat nomor ...',
            optionsFaseA: [
                { key: 'A', text: '1' },
                { key: 'B', text: '2' },
                { key: 'C', text: '3' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Kalimat nomor 1' },
                { key: 'B', text: 'Kalimat nomor 2' },
                { key: 'C', text: 'Kalimat nomor 3' },
                { key: 'D', text: 'Semua salah' }
            ],
            correctAnswer: 'A',
            explanation: 'Kalimat nomor 1 bersifat umum dan dijelaskan oleh kalimat penjelas nomor 2 dan 3.',
            cognitiveLevel: 'MOTS',
            topic: 'Kalimat Utama Paragraf'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Beni ingin mewawancarai penjaga perpustakaan sekolah tentang jenis buku cerita rakyat paling populer.',
            question: 'Kalimat pertanyaan wawancara yang sopan dan tepat diajukan Beni kepada narasumber adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Permisi Pak, buku cerita rakyat apa yang paling sering dipinjam siswa?' },
                { key: 'B', text: 'Cepat sebutkan semua buku yang ada di rak sekarang!' },
                { key: 'C', text: 'Mengapa Bapak tidak membelikan buku baru?' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Permisi Pak, jenis buku cerita rakyat apa yang paling digemari oleh siswa?' },
                { key: 'B', text: 'Cepat beritahu jumlah buku di sini tanpa banyak alasan!' },
                { key: 'C', text: 'Kenapa ruangan ini terasa kurang luas, Pak?' },
                { key: 'D', text: 'Tolong langsung tuliskan laporan wawancara saya!' }
            ],
            correctAnswer: 'A',
            explanation: 'Wawancara diawali sapaan santun dan pertanyaan fokus sesuai topik narasumber.',
            cognitiveLevel: 'MOTS',
            topic: 'Etika Wawancara'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Perhatikan kutipan formulir pendaftaran lomba:\nNama Lengkap : .......................\nTempat, Tanggal Lahir : ......................\nAlamat Rumah : .......................',
            question: 'Data yang tepat dituliskan pada baris "Tempat, Tanggal Lahir" adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Bandung, 14 Mei 2014' },
                { key: 'B', text: 'Jalan Merdeka No. 10' },
                { key: 'C', text: 'SDN Sukamaju' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Bandung, 14 Mei 2014' },
                { key: 'B', text: 'Jalan Merdeka No. 10' },
                { key: 'C', text: 'Membaca dan Melukis' },
                { key: 'D', text: 'Kelas 6B' }
            ],
            correctAnswer: 'A',
            explanation: 'Kolom Tempat, Tanggal Lahir diisi nama kota kelahiran diikuti tanggal, bulan, dan tahun lahir.',
            cognitiveLevel: 'LOTS',
            topic: 'Pengisian Formulir'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Dalam sebuah rapat OSIS tingkat SD, peserta didik menyampaikan usul agar hari Sabtu diadakan bazar buku bekas layak baca.',
            question: 'Ringkasan tertulis yang mencatat waktu, peserta, pokok bahasan, dan keputusan hasil rapat disebut ...',
            optionsFaseA: [
                { key: 'A', text: 'Notula rapat' },
                { key: 'B', text: 'Pantun nasihat' },
                { key: 'C', text: 'Surat lamaran' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Notula / notulen rapat' },
                { key: 'B', text: 'Teks eksplanasi ilmiah' },
                { key: 'C', text: 'Puisi naratif' },
                { key: 'D', text: 'Resensi novel' }
            ],
            correctAnswer: 'A',
            explanation: 'Notula adalah catatan resmi mengenai jalannya rapat serta keputusan yang disepakati.',
            cognitiveLevel: 'MOTS',
            topic: 'Teks Notula dan Laporan'
        }
    ],
    pancasila: [
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Saat bel pulang sekolah berbunyi, Dito melihat teman sebangkunya kesulitan memasukkan buku karena tasnya sobek.',
            question: 'Sikap tolong-menolong yang sesuai pengamalan Pancasila yang dapat Dito lakukan adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Membantu membawakan sebagian buku temannya dengan tulus' },
                { key: 'B', text: 'Menertawakan tas temannya yang rusak' },
                { key: 'C', text: 'Berlari pulang meninggalkan teman' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Membantu membawakan buku temannya yang kesulitan' },
                { key: 'B', text: 'Menertawakan tas teman di depan kelas' },
                { key: 'C', text: 'Pura-pura tidak melihat' },
                { key: 'D', text: 'Menyuruh teman membeli tas mahal saat itu juga' }
            ],
            correctAnswer: 'A',
            explanation: 'Membantu teman yang kesusahan merupakan wujud sila ke-2 Pancasila (Kemanusiaan yang adil dan beradab).',
            cognitiveLevel: 'LOTS',
            topic: 'Sikap Tolong Menolong'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Setiap pagi sebelum makan bersama keluarga di meja makan, Ayah memimpin doa agar makanan membawa berkah.',
            question: 'Kebiasaan berdoa sebelum melakukan kegiatan sehari-hari merupakan pengamalan sila ke- ...',
            optionsFaseA: [
                { key: 'A', text: 'Satu (Ketuhanan Yang Maha Esa)' },
                { key: 'B', text: 'Tiga (Persatuan Indonesia)' },
                { key: 'C', text: 'Lima (Keadilan Sosial)' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Pertama (Ketuhanan Yang Maha Esa)' },
                { key: 'B', text: 'Kedua' },
                { key: 'C', text: 'Ketiga' },
                { key: 'D', text: 'Keempat' }
            ],
            correctAnswer: 'A',
            explanation: 'Beribadah dan berdoa kepada Tuhan Yang Maha Esa mencerminkan Sila Pertama Pancasila.',
            cognitiveLevel: 'LOTS',
            topic: 'Pengamalan Sila Pertama'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Di kampung tempat tinggal Nadia, setiap hari Minggu warga berkumpul membersihkan selokan agar tidak tersumbat saat musim hujan.',
            question: 'Manfaat utama tradisi gotong royong di lingkungan masyarakat seperti kegiatan tersebut adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Pekerjaan berat cepat selesai dan kerukunan warga terjaga' },
                { key: 'B', text: 'Warga menjadi saling bersaing satu sama lain' },
                { key: 'C', text: 'Lingkungan menjadi semakin sepi' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Pekerjaan berat terasa ringan, cepat rampung, dan mempererat persatuan warga' },
                { key: 'B', text: 'Menimbulkan perselisihan antartetangga' },
                { key: 'C', text: 'Mengurangi tanggung jawab petugas kebersihan' },
                { key: 'D', text: 'Membuat saluran air menjadi tersumbat' }
            ],
            correctAnswer: 'A',
            explanation: 'Gotong royong meringankan beban bersama sekaligus menumbuhkan rasa persatuan dan kekeluargaan.',
            cognitiveLevel: 'MOTS',
            topic: 'Gotong Royong Masyarakat'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Wilayah Indonesia membentang dari Sabang sampai Merauke dengan ribuan pulau serta keberagaman suku, tarian, dan bahasa daerah.',
            question: 'Sikap paling bijak ketika mengenal teman baru dari daerah yang adat istiadatnya berbeda dengan kita adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Menghormati budayanya dan mau berteman dengan tulus' },
                { key: 'B', text: 'Mengejek logat bahasanya yang berbeda' },
                { key: 'C', text: 'Menghindarinya saat jam istirahat' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Menghormati adat istiadatnya dan berteman tanpa membeda-bedakan' },
                { key: 'B', text: 'Menganggap budaya daerah sendiri paling tinggi' },
                { key: 'C', text: 'Menolak bekerja kelompok bersamanya' },
                { key: 'D', text: 'Menertawakan pakaian adat daerahnya' }
            ],
            correctAnswer: 'A',
            explanation: 'Menghargai keragaman suku dan budaya mewujudkan persatuan sesuai semboyan Bhinneka Tunggal Ika.',
            cognitiveLevel: 'MOTS',
            topic: 'Keberagaman Budaya'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Dalam musyawarah pemilihan tujuan karyawisata kelas, usulan Reza tidak terpilih karena mayoritas siswa sepakat memilih museum sejarah.',
            question: 'Sikap berjiwa besar yang mencerminkan nilai demokrasi Pancasila yang seharusnya ditunjukkan Reza adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Menerima hasil keputusan bersama dengan lapang dada dan ikut menyukseskannya' },
                { key: 'B', text: 'Memboikot kegiatan kelas karena usulnya kalah' },
                { key: 'C', text: 'Memaksa ketua kelas mengulang rapat sampai usulnya menang' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Menerima hasil musyawarah dengan lapang dada dan melaksanakan keputusan bersama secara bertanggung jawab' },
                { key: 'B', text: 'Menolak ikut serta dalam kegiatan kelas' },
                { key: 'C', text: 'Menyalahkan teman yang memiliki pendapat berbeda' },
                { key: 'D', text: 'Mengubah keputusan rapat secara sepihak' }
            ],
            correctAnswer: 'A',
            explanation: 'Keputusan musyawarah untuk kepentingan bersama wajib diterima dengan ikhlas dan dijalankan penuh tanggung jawab.',
            cognitiveLevel: 'HOTS',
            topic: 'Etika Bermusyawarah'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Setiap warga negara Indonesia memiliki kedudukan yang sama di hadapan hukum serta berhak memperoleh pendidikan dasar yang layak.',
            question: 'Pasal dalam UUD NRI Tahun 1945 yang secara khusus menjamin hak setiap warga negara untuk mendapatkan pendidikan adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Pasal 31' },
                { key: 'B', text: 'Pasal 27 ayat (3)' },
                { key: 'C', text: 'Pasal 36' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Pasal 31 UUD NRI Tahun 1945' },
                { key: 'B', text: 'Pasal 27 ayat (3)' },
                { key: 'C', text: 'Pasal 35 tentang Bendera' },
                { key: 'D', text: 'Pasal 36A tentang Lambang Negara' }
            ],
            correctAnswer: 'A',
            explanation: 'Pasal 31 ayat (1) UUD 1945 menyatakan setiap warga negara berhak mendapat pendidikan.',
            cognitiveLevel: 'LOTS',
            topic: 'Hak Konstitusional Warga'
        }
    ],
    ipas: [
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Setiap pagi sebelum makan buah apel dan roti, Tari selalu mencuci kedua tangannya dengan sabun dan air mengalir.',
            question: 'Manfaat kebiasaan mencuci tangan sebelum makan adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Membersihkan kuman agar perut tidak sakit' },
                { key: 'B', text: 'Membuat makanan menjadi terasa asin' },
                { key: 'C', text: 'Menghilangkan warna buah apel' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Menghilangkan kuman penyakit yang menempel di tangan' },
                { key: 'B', text: 'Mengubah rasa manis makanan' },
                { key: 'C', text: 'Menghemat air minum' },
                { key: 'D', text: 'Membuat tangan menjadi lengket' }
            ],
            correctAnswer: 'A',
            explanation: 'Sabun dan air mengalir membunuh kuman penyebab diare atau sakit perut sebelum makan.',
            cognitiveLevel: 'LOTS',
            topic: 'Merawat Kebersihan Tubuh'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Di pekarangan rumah Kiki tumbuh pohon mangga. Setiap hari pohon itu disiram dan mendapat sinar matahari pagi.',
            question: 'Bagian tumbuhan mangga yang berada di dalam tanah untuk menyerap air adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Akar' },
                { key: 'B', text: 'Daun' },
                { key: 'C', text: 'Bunga' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Akar' },
                { key: 'B', text: 'Daun' },
                { key: 'C', text: 'Bunga' },
                { key: 'D', text: 'Buah' }
            ],
            correctAnswer: 'A',
            explanation: 'Akar tumbuhan berada di dalam tanah untuk menyerap air dan zat hara sekaligus menopang batang.',
            cognitiveLevel: 'LOTS',
            topic: 'Bagian Tubuh Tumbuhan'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Pada malam hari yang cerah tanpa mendung, langit tampak gelap bertabur titik-titik cahaya berkedip.',
            question: 'Benda langit yang memancarkan cahayanya sendiri dan tampak berkelap-kelip di langit malam adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Bintang' },
                { key: 'B', text: 'Awan putih' },
                { key: 'C', text: 'Pelangi' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Bintang' },
                { key: 'B', text: 'Awan' },
                { key: 'C', text: 'Pelangi' },
                { key: 'D', text: 'Kabut' }
            ],
            correctAnswer: 'A',
            explanation: 'Bintang tampak berkelap-kelip di langit malam yang cerah karena letaknya sangat jauh.',
            cognitiveLevel: 'LOTS',
            topic: 'Benda Langit Siang Malam'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Mila memasukkan air putih cair ke dalam cetakan es batu lalu menyimpannya di dalam lemari pembeku (freezer).',
            question: 'Setelah beberapa jam di dalam freezer, wujud air tersebut berubah menjadi ...',
            optionsFaseA: [
                { key: 'A', text: 'Benda padat (es batu)' },
                { key: 'B', text: 'Asap panas' },
                { key: 'C', text: 'Minyak goreng' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Padat (membeku menjadi es batu)' },
                { key: 'B', text: 'Gas berbau harum' },
                { key: 'C', text: 'Uap panas' },
                { key: 'D', text: 'Buih sabun' }
            ],
            correctAnswer: 'A',
            explanation: 'Pendinginan suhu sangat rendah mengubah benda cair menjadi benda padat (es batu).',
            cognitiveLevel: 'LOTS',
            topic: 'Mengenal Wujud Benda'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Seekor bunglon mampu mengubah warna kulitnya menyerupai warna dahan pohon atau dedaunan di tempat ia hinggap.',
            question: 'Tujuan kemampuan mimikri bunglon mengubah warna kulitnya tersebut adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Menyamarkan diri agar terhindar dari pemangsa' },
                { key: 'B', text: 'Menarik perhatian pemangsa untuk datang' },
                { key: 'C', text: 'Membantu daun berfotosintesis lebih cepat' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Berkamuflase agar aman dari serangan pemangsa dan mudah mengintai mangsa' },
                { key: 'B', text: 'Mengundang hewan buas agar mendekat' },
                { key: 'C', text: 'Mengubah suara menjadi nyaring' },
                { key: 'D', text: 'Menggugurkan ranting pohon' }
            ],
            correctAnswer: 'A',
            explanation: 'Mimikri adalah bentuk adaptasi bunglon menyesuaikan warna tubuh dengan lingkungan demi perlindungan diri.',
            cognitiveLevel: 'MOTS',
            topic: 'Adaptasi Hewan'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Sebuah meja kayu berat didorong oleh dua orang anak bersama-sama di atas lantai keramik hingga berpindah ke sudut kelas.',
            question: 'Gaya gesek yang bekerja antara kaki meja dengan permukaan lantai memiliki arah yang selalu ... dengan arah gerak meja.',
            optionsFaseA: [
                { key: 'A', text: 'Berlawanan' },
                { key: 'B', text: 'Searah' },
                { key: 'C', text: 'Tegak lurus ke atas' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Berlawanan arah dengan gerak benda' },
                { key: 'B', text: 'Searah dengan dorongan benda' },
                { key: 'C', text: 'Menarik benda ke atas langit' },
                { key: 'D', text: 'Berputar melingkar tanpa henti' }
            ],
            correctAnswer: 'A',
            explanation: 'Gaya gesek selalu menghambat gerakan sehingga arahnya berlawanan dengan arah gerak benda.',
            cognitiveLevel: 'MOTS',
            topic: 'Gaya Gesek'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Pada ekosistem pesisir, warga menanam kembali ribuan bibit tanaman bakau (mangrove) di sepanjang pantai yang mulai terkikis ombak.',
            question: 'Manfaat ekologis utama penanaman hutan bakau di kawasan pesisir pantai adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Menahan abrasi gelombang laut serta menjadi habitat ikan dan kepiting' },
                { key: 'B', text: 'Mengubah air laut menjadi air tawar siap minum' },
                { key: 'C', text: 'Meningkatkan erosi pasir pantai secara cepat' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Mencegah abrasi pantai oleh ombak dan menjadi tempat berkembang biak biota laut' },
                { key: 'B', text: 'Menghilangkan kadar garam air laut secara alami' },
                { key: 'C', text: 'Mempercepat pengikisan daratan pantai' },
                { key: 'D', text: 'Menghentikan pasang surut air laut' }
            ],
            correctAnswer: 'A',
            explanation: 'Akar bakau yang kuat menahan hempasan ombak sehingga mencegah abrasi dan melindungi ekosistem pesisir.',
            cognitiveLevel: 'HOTS',
            topic: 'Pelestarian Ekosistem Pesisir'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Indonesia memiliki letak geografis yang strategis di antara dua benua dan dua samudra, serta dilalui jalur pegunungan api aktif.',
            question: 'Dua samudra besar yang mengapit wilayah kepulauan negara Indonesia adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Samudra Hindia dan Samudra Pasifik' },
                { key: 'B', text: 'Samudra Atlantik dan Samudra Arktik' },
                { key: 'C', text: 'Samudra Hindia dan Samudra Atlantik' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Samudra Hindia dan Samudra Pasifik' },
                { key: 'B', text: 'Samudra Atlantik dan Samudra Pasifik' },
                { key: 'C', text: 'Samudra Arktik dan Samudra Hindia' },
                { key: 'D', text: 'Samudra Atlantik dan Samudra Antartika' }
            ],
            correctAnswer: 'A',
            explanation: 'Secara geografis, Indonesia terletak di antara Benua Asia dan Australia serta Samudra Hindia dan Samudra Pasifik.',
            cognitiveLevel: 'LOTS',
            topic: 'Letak Geografis Indonesia'
        }
    ],
    pjok: [
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Sebelum berlari mengelilingi lapangan bersama guru olahraga, Rafi memutar pergelangan tangan, leher, dan kaki secara perlahan.',
            question: 'Tujuan melakukan gerakan pemanasan sebelum berolahraga adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Melemaskan otot tubuh agar tidak mudah cedera' },
                { key: 'B', text: 'Membuat badan langsung terasa lelah' },
                { key: 'C', text: 'Menghabiskan waktu pelajaran saja' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Menyiapkan otot dan sendi tubuh agar terhindar dari kram atau cedera' },
                { key: 'B', text: 'Membuat tubuh cepat lelah sebelum bermain' },
                { key: 'C', text: 'Menghentikan aliran darah di kaki' },
                { key: 'D', text: 'Menggantikan kegiatan pendinginan' }
            ],
            correctAnswer: 'A',
            explanation: 'Pemanasan meningkatkan suhu tubuh dan melenturkan otot sehingga aman dari cedera olahraga.',
            cognitiveLevel: 'LOTS',
            topic: 'Pemanasan Sebelum Olahraga'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Saat pelajaran senam di aula, Kiki berdiri di atas satu kaki dengan kedua tangan direntangkan ke samping selama sepuluh hitungan.',
            question: 'Gerakan berdiri satu kaki sambil merentangkan kedua tangan tersebut berguna untuk melatih ...',
            optionsFaseA: [
                { key: 'A', text: 'Keseimbangan tubuh' },
                { key: 'B', text: 'Kecepatan berlari' },
                { key: 'C', text: 'Kekuatan melempar bola' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Keseimbangan statis tubuh' },
                { key: 'B', text: 'Kecepatan lari jarak pendek' },
                { key: 'C', text: 'Ketepatan menendang bola' },
                { key: 'D', text: 'Daya tahan menyelam' }
            ],
            correctAnswer: 'A',
            explanation: 'Sikap kapal terbang atau berdiri satu kaki adalah latihan keseimbangan tubuh.',
            cognitiveLevel: 'LOTS',
            topic: 'Gerak Keseimbangan'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Bima berlatih gerak berjalan di atas balok titian kayu yang rendah dan lurus dengan pandangan mata menghadap ke depan.',
            question: 'Sikap badan yang benar saat berjalan meniti balok titian agar tidak terjatuh adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Pandangan ke depan dan rentangkan kedua lengan untuk menjaga seimbang' },
                { key: 'B', text: 'Menutup kedua mata sambil berlari cepat' },
                { key: 'C', text: 'Menengok terus ke belakang' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Pandangan lurus ke depan dan merentangkan kedua lengan ke samping' },
                { key: 'B', text: 'Menutup kedua mata rapat-rapat' },
                { key: 'C', text: 'Berlari secepat mungkin sambil menoleh' },
                { key: 'D', text: 'Membungkuk menempelkan kepala ke balok' }
            ],
            correctAnswer: 'A',
            explanation: 'Merentangkan kedua lengan menjaga titik keseimbangan tubuh tetap stabil di atas balok titian.',
            cognitiveLevel: 'LOTS',
            topic: 'Gerak Lokomotor Titian'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Saat jam istirahat, Zara memotong kuku jari tangannya yang sudah mulai panjang bersama ibu di rumah.',
            question: 'Manfaat menjaga kebersihan kuku tangan secara teratur adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Mencegah kotoran dan kuman bersarang di bawah kuku' },
                { key: 'B', text: 'Agar kuku tidak bisa dipakai memegang pensil' },
                { key: 'C', text: 'Supaya warna jari berubah menjadi pucat' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Mencegah kuman penyakit dan kotoran tersembunyi di sela kuku' },
                { key: 'B', text: 'Membuat jari tangan tidak dapat menggenggam' },
                { key: 'C', text: 'Menambah berat badan tubuh' },
                { key: 'D', text: 'Mengganti kebiasaan mandi sore' }
            ],
            correctAnswer: 'A',
            explanation: 'Kuku yang pendek dan bersih menghindarkan masuknya kotoran dan kuman saat memegang makanan.',
            cognitiveLevel: 'LOTS',
            topic: 'Kebersihan Kuku dan Tangan'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Dalam permainan lempar tangkap bola kasti, Arka melemparkan bola lunak ke arah keranjang teman di depannya.',
            question: 'Gerakan melempar dan menangkap bola termasuk contoh gerak dasar ...',
            optionsFaseA: [
                { key: 'A', text: 'Manipulatif (memakai alat/benda)' },
                { key: 'B', text: 'Berdiri diam di tempat' },
                { key: 'C', text: 'Tidur telentang' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Gerak dasar manipulatif' },
                { key: 'B', text: 'Gerak nonlokomotor pasif' },
                { key: 'C', text: 'Gerak statis berbaring' },
                { key: 'D', text: 'Gerak istirahat' }
            ],
            correctAnswer: 'A',
            explanation: 'Gerak manipulatif melibatkan keterampilan mengendalikan benda/alat seperti melempar, menangkap, dan menendang bola.',
            cognitiveLevel: 'MOTS',
            topic: 'Gerak Dasar Manipulatif'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Salsa bermain lompat tali karet bersama teman-teman di halaman sekolah dengan ceria.',
            question: 'Saat melompati tali karet, anggota tubuh bagian bawah yang melakukan tolakan ke atas adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Kedua kaki dan lutut' },
                { key: 'B', text: 'Kedua telinga' },
                { key: 'C', text: 'Siku tangan' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Kedua kaki' },
                { key: 'B', text: 'Kedua siku' },
                { key: 'C', text: 'Bahu kanan' },
                { key: 'D', text: 'Dahi' }
            ],
            correctAnswer: 'A',
            explanation: 'Lompat tali melatih kekuatan otot tungkai kaki melalui gerakan tolakan dan pendaratan lentur.',
            cognitiveLevel: 'LOTS',
            topic: 'Gerak Melompat'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Dalam permainan bola kasti, pemukul berhasil memukul bola jauh lalu berlari menyentuh tiang hinggap satu dan dua tanpa terkena lemparan lawan.',
            question: 'Tiga keterampilan gerak utama yang harus dikuasai pemain dalam permainan bola kasti adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Melempar, menangkap, dan memukul bola' },
                { key: 'B', text: 'Menyundul, menendang, dan menyetir bola' },
                { key: 'C', text: 'Menyelam, mengayuh, dan memanah' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Melempar, menangkap, dan memukul bola' },
                { key: 'B', text: 'Menyundul dan menggiring bola dengan kaki' },
                { key: 'C', text: 'Servis dan smes bola memakai raket' },
                { key: 'D', text: 'Meluncur di atas air kolam' }
            ],
            correctAnswer: 'A',
            explanation: 'Bola kasti adalah permainan bola kecil dengan teknik inti melempar, menangkap, dan memukul.',
            cognitiveLevel: 'LOTS',
            topic: 'Permainan Bola Kasti'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Untuk menguji daya tahan jantung dan paru-paru siswa kelas enam, guru mengadakan tes lari santai selama dua belas menit mengelilingi lintasan.',
            question: 'Unsur kebugaran jasmani yang paling utama dilatih melalui lari jarak jauh atau jogging berdurasi lama secara teratur adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Daya tahan kardiovaskular (jantung dan paru-paru)' },
                { key: 'B', text: 'Kelenturan pergelangan jari tangan' },
                { key: 'C', text: 'Kekuatan leher' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Daya tahan jantung dan paru-paru (kardiorespirasi)' },
                { key: 'B', text: 'Kelenturan sendi jari' },
                { key: 'C', text: 'Keseimbangan berdiri satu kaki' },
                { key: 'D', text: 'Ketepatan memukul shuttlecock' }
            ],
            correctAnswer: 'A',
            explanation: 'Aktivitas aerobik seperti lari jarak jauh/jogging meningkatkan kapasitas daya tahan jantung dan paru-paru.',
            cognitiveLevel: 'MOTS',
            topic: 'Daya Tahan Kardiovaskular'
        }
    ]
};

export const EXTENDED_ISIAN_BY_CAT: Record<string, QuestionBankItemIsian[]> = {
    indo: [
        { minGrade: 1, maxGrade: 2, question: 'Tanda baca yang wajib diletakkan pada akhir sebuah kalimat tanya adalah tanda ...', correctAnswer: 'Tanya (?)', cognitiveLevel: 'LOTS', topic: 'Tanda Baca' },
        { minGrade: 1, maxGrade: 2, question: 'Kata "ma - ta - ha - ri" terdiri atas ... suku kata.', correctAnswer: '4 (Empat)', cognitiveLevel: 'LOTS', topic: 'Suku Kata' },
        { minGrade: 1, maxGrade: 2, question: 'Saat menerima pertolongan dari teman di kelas, kita wajib mengucapkan ...', correctAnswer: 'Terima kasih', cognitiveLevel: 'LOTS', topic: 'Ungkapan Santun' },
        { minGrade: 1, maxGrade: 2, question: 'Lawan kata dari kata "besar" adalah ...', correctAnswer: 'Kecil', cognitiveLevel: 'LOTS', topic: 'Antonim Sederhana' },
        { minGrade: 3, maxGrade: 4, question: 'Gagasan pokok atau inti pembicaraan yang dibahas dalam sebuah paragraf disebut ...', correctAnswer: 'Ide pokok', cognitiveLevel: 'LOTS', topic: 'Ide Pokok' },
        { minGrade: 3, maxGrade: 4, question: 'Orang yang dimintai keterangan atau informasi penting saat melakukan wawancara disebut ...', correctAnswer: 'Narasumber', cognitiveLevel: 'LOTS', topic: 'Wawancara' },
        { minGrade: 3, maxGrade: 4, question: 'Kamus Besar Bahasa Indonesia disingkat menjadi ...', correctAnswer: 'KBBI', cognitiveLevel: 'LOTS', topic: 'Kosakata Baku' },
        { minGrade: 3, maxGrade: 4, question: 'Kata tanya yang digunakan untuk menanyakan alasan atau sebab terjadinya suatu peristiwa adalah ...', correctAnswer: 'Mengapa', cognitiveLevel: 'LOTS', topic: 'Kata Tanya' },
        { minGrade: 5, maxGrade: 6, question: 'Ungkapan kiasan "tinggi hati" memiliki arti ...', correctAnswer: 'Sombong (angkuh)', cognitiveLevel: 'MOTS', topic: 'Ungkapan Idiom' },
        { minGrade: 5, maxGrade: 6, question: 'Surat resmi sekolah yang ditujukan kepada orang tua siswa selalu dilengkapi bagian atas berisi nama dan alamat lembaga yang disebut ... surat.', correctAnswer: 'Kop (Kepala)', cognitiveLevel: 'LOTS', topic: 'Surat Resmi' },
        { minGrade: 5, maxGrade: 6, question: 'Teks nonfiksi yang menjelaskan proses terjadinya fenomena alam seperti pelangi atau gempa bumi disebut teks ...', correctAnswer: 'Eksplanasi', cognitiveLevel: 'MOTS', topic: 'Teks Eksplanasi' },
        { minGrade: 5, maxGrade: 6, question: 'Bentuk baku dari kata "apotik" dan "nasehat" menurut kaidah ejaan Indonesia adalah apotek dan ...', correctAnswer: 'Nasihat', cognitiveLevel: 'MOTS', topic: 'Kata Baku' }
    ],
    pancasila: [
        { minGrade: 1, maxGrade: 2, question: 'Dasar negara Republik Indonesia yang memiliki lima sila disebut ...', correctAnswer: 'Pancasila', cognitiveLevel: 'LOTS', topic: 'Dasar Negara' },
        { minGrade: 1, maxGrade: 2, question: 'Lambang sila keempat Pancasila yang melambangkan musyawarah adalah kepala ...', correctAnswer: 'Banteng', cognitiveLevel: 'LOTS', topic: 'Lambang Sila Pancasila' },
        { minGrade: 1, maxGrade: 2, question: 'Agar ruang kelas selalu bersih dan nyaman untuk belajar, siswa melaksanakan jadwal ... kelas bersama-sama.', correctAnswer: 'Piket', cognitiveLevel: 'LOTS', topic: 'Aturan di Sekolah' },
        { minGrade: 1, maxGrade: 2, question: 'Bentuk kerja sama membersihkan selokan atau halaman bersama tetangga di kampung disebut ...', correctAnswer: 'Gotong royong (Kerja bakti)', cognitiveLevel: 'LOTS', topic: 'Gotong Royong' },
        { minGrade: 3, maxGrade: 4, question: 'Semboyan persatuan bangsa Indonesia yang tertulis pada pita yang dicengkeram Burung Garuda berbunyi ...', correctAnswer: 'Bhinneka Tunggal Ika', cognitiveLevel: 'LOTS', topic: 'Semboyan Bangsa' },
        { minGrade: 3, maxGrade: 4, question: 'Membahas suatu persoalan bersama dengan tenang hingga mencapai kata sepakat bersama disebut ...', correctAnswer: 'Musyawarah (Mufakat)', cognitiveLevel: 'LOTS', topic: 'Musyawarah' },
        { minGrade: 3, maxGrade: 4, question: 'Aturan hidup yang bersumber dari suara hati nurani manusia tentang baik dan buruk disebut norma ...', correctAnswer: 'Kesusilaan', cognitiveLevel: 'MOTS', topic: 'Macam-Macam Norma' },
        { minGrade: 3, maxGrade: 4, question: 'Rumah adat Tongkonan berasal dari provinsi ...', correctAnswer: 'Sulawesi Selatan', cognitiveLevel: 'MOTS', topic: 'Keragaman Daerah' },
        { minGrade: 5, maxGrade: 6, question: 'Segala sesuatu yang wajib dikerjakan seseorang dengan penuh tanggung jawab disebut ...', correctAnswer: 'Kewajiban', cognitiveLevel: 'LOTS', topic: 'Hak dan Kewajiban' },
        { minGrade: 5, maxGrade: 6, question: 'Sila pertama Pancasila berbunyi "Ketuhanan Yang Maha Esa" yang dilambangkan dengan gambar ...', correctAnswer: 'Bintang emas', cognitiveLevel: 'LOTS', topic: 'Makna Sila Pertama' },
        { minGrade: 5, maxGrade: 6, question: 'Tari Saman yang dimainkan serempak dengan tempo cepat merupakan warisan budaya daerah dari provinsi ...', correctAnswer: 'Aceh', cognitiveLevel: 'LOTS', topic: 'Budaya Nusantara' },
        { minGrade: 5, maxGrade: 6, question: 'Konstitusi tertulis yang menjadi hukum dasar tertinggi di negara Republik Indonesia adalah ...', correctAnswer: 'UUD NRI Tahun 1945', cognitiveLevel: 'MOTS', topic: 'Konstitusi Negara' }
    ],
    ipas: [
        { minGrade: 1, maxGrade: 2, question: 'Alat indra manusia yang digunakan untuk mencium aroma wangi bunga atau masakan ibu adalah ...', correctAnswer: 'Hidung', cognitiveLevel: 'LOTS', topic: 'Panca Indra' },
        { minGrade: 1, maxGrade: 2, question: 'Hewan ternak pemakan rumput yang menghasilkan susu segar dan daging untuk manusia adalah ...', correctAnswer: 'Sapi (Kambing)', cognitiveLevel: 'LOTS', topic: 'Manfaat Hewan' },
        { minGrade: 1, maxGrade: 2, question: 'Kebutuhan utama tumbuhan hijau agar tidak layu adalah air dan cahaya ...', correctAnswer: 'Matahari', cognitiveLevel: 'LOTS', topic: 'Kebutuhan Tumbuhan' },
        { minGrade: 1, maxGrade: 2, question: 'Benda yang bentuk dan ukurannya tetap meskipun dipindahkan dari kotak pensil ke atas meja berwujud ...', correctAnswer: 'Padat', cognitiveLevel: 'LOTS', topic: 'Wujud Benda' },
        { minGrade: 3, maxGrade: 4, question: 'Proses tumbuhan hijau mengolah air dan karbon dioksida dibantu sinar matahari menjadi makanan disebut ...', correctAnswer: 'Fotosintesis', cognitiveLevel: 'LOTS', topic: 'Fotosintesis' },
        { minGrade: 3, maxGrade: 4, question: 'Gaya tarik bumi yang menyebabkan buah mangga matang selalu jatuh ke bawah menuju tanah adalah gaya ...', correctAnswer: 'Gravitasi', cognitiveLevel: 'LOTS', topic: 'Gaya Gravitasi' },
        { minGrade: 3, maxGrade: 4, question: 'Energi listrik yang mengalir melalui kipas angin berubah menjadi energi ...', correctAnswer: 'Gerak', cognitiveLevel: 'LOTS', topic: 'Perubahan Bentuk Energi' },
        { minGrade: 3, maxGrade: 4, question: 'Alat musik sasando maupun gitar menghasilkan bunyi ketika senarnya ...', correctAnswer: 'Bergetar (dipetik)', cognitiveLevel: 'MOTS', topic: 'Sumber Bunyi' },
        { minGrade: 5, maxGrade: 6, question: 'Dalam rantai makanan sawah "Padi -> Tikus -> Ular -> Elang", makhluk hidup yang berperan sebagai produsen adalah ...', correctAnswer: 'Padi', cognitiveLevel: 'LOTS', topic: 'Rantai Makanan' },
        { minGrade: 5, maxGrade: 6, question: 'Bintang pusat tata surya yang dikelilingi oleh delapan planet termasuk Bumi adalah ...', correctAnswer: 'Matahari', cognitiveLevel: 'LOTS', topic: 'Tata Surya' },
        { minGrade: 5, maxGrade: 6, question: 'Peristiwa berputarnya planet Bumi pada porosnya sendiri selama 24 jam yang menimbulkan siang dan malam disebut ... Bumi.', correctAnswer: 'Rotasi', cognitiveLevel: 'MOTS', topic: 'Rotasi Bumi' },
        { minGrade: 5, maxGrade: 6, question: 'Lapisan gas pelindung Bumi yang menyaring sebagian besar sinar ultraviolet berbahaya dari matahari adalah lapisan ...', correctAnswer: 'Ozon', cognitiveLevel: 'MOTS', topic: 'Lingkungan & Atmosfer' }
    ],
    pjok: [
        { minGrade: 1, maxGrade: 2, question: 'Gerakan berpindah tempat dari satu titik ke titik lain seperti berjalan dan berlari disebut gerak ...', correctAnswer: 'Lokomotor', cognitiveLevel: 'LOTS', topic: 'Gerak Lokomotor' },
        { minGrade: 1, maxGrade: 2, question: 'Sebelum makan dan setelah bermain di tanah, kita wajib mencuci tangan memakai ...', correctAnswer: 'Sabun dan air bersih', cognitiveLevel: 'LOTS', topic: 'Kebersihan Diri' },
        { minGrade: 1, maxGrade: 2, question: 'Gerakan menekuk lutut atau memutar lengan di tempat tanpa berpindah posisi disebut gerak ...', correctAnswer: 'Nonlokomotor', cognitiveLevel: 'LOTS', topic: 'Gerak Nonlokomotor' },
        { minGrade: 1, maxGrade: 2, question: 'Supaya tubuh kuat dan tidak lemas saat belajar, setiap pagi siswa sebaiknya sarapan makanan yang ...', correctAnswer: 'Sehat dan bergizi', cognitiveLevel: 'LOTS', topic: 'Makanan Bergizi' },
        { minGrade: 3, maxGrade: 4, question: 'Jumlah pemain inti dalam satu regu permainan sepak bola di lapangan adalah ... orang.', correctAnswer: '11 (Sebelas)', cognitiveLevel: 'LOTS', topic: 'Sepak Bola' },
        { minGrade: 3, maxGrade: 4, question: 'Alat pelindung empuk berbahan busa yang diletakkan di lantai saat berlatih guling depan senam adalah ...', correctAnswer: 'Matras', cognitiveLevel: 'LOTS', topic: 'Senam Lantai' },
        { minGrade: 3, maxGrade: 4, question: 'Kotak perlengkapan pertolongan darurat ringan di UKS sekolah disebut kotak ...', correctAnswer: 'P3K', cognitiveLevel: 'LOTS', topic: 'Pertolongan Pertama' },
        { minGrade: 3, maxGrade: 4, question: 'Induk organisasi cabang olahraga pencak silat di Indonesia disingkat menjadi ...', correctAnswer: 'IPSI', cognitiveLevel: 'MOTS', topic: 'Pencak Silat' },
        { minGrade: 5, maxGrade: 6, question: 'Lari sambung beregu empat orang yang memindahkan tongkat dari pelari ke pelari berikutnya disebut lari ...', correctAnswer: 'Estafet', cognitiveLevel: 'LOTS', topic: 'Atletik Estafet' },
        { minGrade: 5, maxGrade: 6, question: 'Gaya renang yang posisi dadanya menghadap ke dasar kolam dengan ayunan tangan bergantian seperti kincir adalah gaya ...', correctAnswer: 'Bebas (Crawl)', cognitiveLevel: 'MOTS', topic: 'Aktivitas Air Renang' },
        { minGrade: 5, maxGrade: 6, question: 'Latihan berbaring telentang lalu mengangkat tubuh bagian atas ke arah lutut untuk melatih kekuatan otot perut disebut ...', correctAnswer: 'Sit-up', cognitiveLevel: 'LOTS', topic: 'Kebugaran Jasmani' },
        { minGrade: 5, maxGrade: 6, question: 'Sikap jujur menerima kekalahan dengan lapang dada serta menghormati lawan dalam pertandingan olahraga disebut ...', correctAnswer: 'Sportivitas (Fair play)', cognitiveLevel: 'MOTS', topic: 'Nilai Sportivitas' }
    ],
    seni: [
        { minGrade: 1, maxGrade: 2, question: 'Tiga warna pokok (primer) yang tidak bisa dibuat dari campuran warna lain adalah merah, kuning, dan ...', correctAnswer: 'Biru', cognitiveLevel: 'LOTS', topic: 'Warna Primer' },
        { minGrade: 1, maxGrade: 2, question: 'Alat musik tradisional Sunda yang terbuat dari tabung bambu dan dibunyikan dengan cara digoyangkan adalah ...', correctAnswer: 'Angklung', cognitiveLevel: 'LOTS', topic: 'Alat Musik Daerah' },
        { minGrade: 1, maxGrade: 2, question: 'Kertas tipis warna-warni yang biasa dilipat menjadi bentuk perahu, bunga, atau burung disebut kertas ...', correctAnswer: 'Origami (Lipat)', cognitiveLevel: 'LOTS', topic: 'Melipat Kertas' },
        { minGrade: 1, maxGrade: 2, question: 'Permukaan cermin kaca apabila diraba dengan telapak tangan terasa bertekstur ...', correctAnswer: 'Halus (Licin)', cognitiveLevel: 'LOTS', topic: 'Tekstur Benda' },
        { minGrade: 3, maxGrade: 4, question: 'Campuran warna cat merah dan kuning dalam perbandingan seimbang menghasilkan warna sekunder ...', correctAnswer: 'Oranye (Jingga)', cognitiveLevel: 'LOTS', topic: 'Pencampuran Warna' },
        { minGrade: 3, maxGrade: 4, question: 'Karya seni menempelkan biji-bijian atau sobekan kertas pada pola gambar hingga tertutup rapi disebut ...', correctAnswer: 'Kolase', cognitiveLevel: 'LOTS', topic: 'Seni Kolase' },
        { minGrade: 3, maxGrade: 4, question: 'Alat musik tiup tradisional Jawa Barat yang terbuat dari bambu dan menghasilkan bunyi lembut adalah ...', correctAnswer: 'Suling (Seruling)', cognitiveLevel: 'LOTS', topic: 'Alat Musik Tiup' },
        { minGrade: 3, maxGrade: 4, question: 'Seni membuat barang kerajinan dari tanah liat seperti kendi dan celengan yang dibakar disebut kerajinan ...', correctAnswer: 'Gerabah (Keramik)', cognitiveLevel: 'LOTS', topic: 'Kerajinan Gerabah' },
        { minGrade: 5, maxGrade: 6, question: 'Alat utama berbentuk cucuk pena untuk menggambar motif malam cair pada kain batik tulis adalah ...', correctAnswer: 'Canting', cognitiveLevel: 'LOTS', topic: 'Batik Tulis' },
        { minGrade: 5, maxGrade: 6, question: 'Pakaian khusus lengkap dengan hiasan yang dipakai penari saat pentas di panggung disebut tata ...', correctAnswer: 'Busana (Kostum)', cognitiveLevel: 'LOTS', topic: 'Unsur Pendukung Tari' },
        { minGrade: 5, maxGrade: 6, question: 'Seni pertunjukan cerita tanpa dialog lisan yang mengandalkan mimik wajah dan gerak tubuh disebut ...', correctAnswer: 'Pantomim', cognitiveLevel: 'LOTS', topic: 'Seni Teater' },
        { minGrade: 5, maxGrade: 6, question: 'Karya seni rupa yang memiliki ukuran panjang, lebar, serta tinggi/volume sehingga dapat dilihat dari berbagai arah disebut karya ... dimensi.', correctAnswer: 'Tiga (3)', cognitiveLevel: 'LOTS', topic: 'Seni Tiga Dimensi' }
    ],
    inggris: [
        { minGrade: 1, maxGrade: 2, question: 'In English, the color of clean milk and cotton clouds is ...', correctAnswer: 'White', cognitiveLevel: 'LOTS', topic: 'Colors' },
        { minGrade: 1, maxGrade: 2, question: 'After number seven (7) and before number nine (9) is number ...', correctAnswer: 'Eight', cognitiveLevel: 'LOTS', topic: 'Numbers' },
        { minGrade: 1, maxGrade: 2, question: 'We use our two ... to walk and run in the playground.', correctAnswer: 'Feet (Legs)', cognitiveLevel: 'LOTS', topic: 'Body Parts' },
        { minGrade: 1, maxGrade: 2, question: 'The English word for "pisang" which monkeys love to eat is ...', correctAnswer: 'Banana', cognitiveLevel: 'LOTS', topic: 'Fruits' },
        { minGrade: 3, maxGrade: 4, question: 'In English, the room at home where mother cooks delicious meals is the ...', correctAnswer: 'Kitchen', cognitiveLevel: 'LOTS', topic: 'Rooms at Home' },
        { minGrade: 3, maxGrade: 4, question: 'The month that comes right after March in a calendar is ...', correctAnswer: 'April', cognitiveLevel: 'LOTS', topic: 'Months' },
        { minGrade: 3, maxGrade: 4, question: 'A person who helps sick patients recover in a hospital alongside a nurse is a ...', correctAnswer: 'Doctor', cognitiveLevel: 'LOTS', topic: 'Professions' },
        { minGrade: 3, maxGrade: 4, question: 'The opposite adjective of "big" in English is ...', correctAnswer: 'Small', cognitiveLevel: 'LOTS', topic: 'Adjectives' },
        { minGrade: 5, maxGrade: 6, question: 'Yesterday, my family ... (go) to Pangandaran beach by car. The correct past verb is ...', correctAnswer: 'went', cognitiveLevel: 'MOTS', topic: 'Simple Past Tense' },
        { minGrade: 5, maxGrade: 6, question: 'Comparing heights: "A coconut tree is ... (tall) than a rose flower."', correctAnswer: 'taller', cognitiveLevel: 'MOTS', topic: 'Comparative Adjectives' },
        { minGrade: 5, maxGrade: 6, question: 'The public vehicle with wings that flies passengers across islands in the sky is an ...', correctAnswer: 'Airplane (Aeroplane)', cognitiveLevel: 'LOTS', topic: 'Transportation' },
        { minGrade: 5, maxGrade: 6, question: 'To write a future plan for next Sunday, we say "I ... visit my grandmother next week."', correctAnswer: 'will', cognitiveLevel: 'MOTS', topic: 'Future Tense' }
    ],
    pai: [
        { minGrade: 1, maxGrade: 2, question: 'Kitab suci umat Islam yang diwahyukan kepada Nabi Muhammad saw. adalah ...', correctAnswer: 'Al-Qur\'an', cognitiveLevel: 'LOTS', topic: 'Kitab Suci' },
        { minGrade: 1, maxGrade: 2, question: 'Surah pertama yang menjadi pembuka dalam Al-Qur\'an dan wajib dibaca saat salat adalah Surah ...', correctAnswer: 'Al-Fatihah', cognitiveLevel: 'LOTS', topic: 'Surah Al-Fatihah' },
        { minGrade: 1, maxGrade: 2, question: 'Sebelum melaksanakan salat, umat Islam wajib menyucikan diri terlebih dahulu dengan ber-... menggunakan air bersih.', correctAnswer: 'Wudu', cognitiveLevel: 'LOTS', topic: 'Bersuci (Wudu)' },
        { minGrade: 1, maxGrade: 2, question: 'Nabi terakhir yang menjadi teladan bagi seluruh umat Islam adalah Nabi ... saw.', correctAnswer: 'Muhammad', cognitiveLevel: 'LOTS', topic: 'Kisah Nabi' },
        { minGrade: 3, maxGrade: 4, question: 'Salat wajib yang dilaksanakan pada petang hari setelah matahari terbenam sebanyak 3 rakaat adalah salat ...', correctAnswer: 'Magrib', cognitiveLevel: 'LOTS', topic: 'Salat Wajib' },
        { minGrade: 3, maxGrade: 4, question: 'Asmaulhusna Al-Basir artinya Allah Maha ... segala sesuatu yang dilakukan hamba-Nya.', correctAnswer: 'Melihat', cognitiveLevel: 'LOTS', topic: 'Asmaulhusna' },
        { minGrade: 3, maxGrade: 4, question: 'Puasa wajib selama satu bulan penuh dilaksanakan oleh umat Islam pada bulan ...', correctAnswer: 'Ramadan', cognitiveLevel: 'LOTS', topic: 'Puasa Ramadan' },
        { minGrade: 3, maxGrade: 4, question: 'Gerakan menempelkan dahi, hidung, kedua telapak tangan, lutut, dan ujung kaki ke lantai saat salat disebut ...', correctAnswer: 'Sujud', cognitiveLevel: 'LOTS', topic: 'Gerakan Salat' },
        { minGrade: 5, maxGrade: 6, question: 'Zakat berupa bahan makanan pokok seberat 2,5 kg yang wajib dibayarkan menjelang Idulfitri disebut zakat ...', correctAnswer: 'Fitrah', cognitiveLevel: 'LOTS', topic: 'Zakat Fitrah' },
        { minGrade: 5, maxGrade: 6, question: 'Peristiwa berpindahnya Nabi Muhammad saw. beserta kaum muslimin dari Makkah menuju Madinah disebut ...', correctAnswer: 'Hijrah', cognitiveLevel: 'LOTS', topic: 'Sejarah Islam' },
        { minGrade: 5, maxGrade: 6, question: 'Sikap berserah diri kepada keputusan Allah Swt. setelah berusaha dan berdoa maksimal disebut ...', correctAnswer: 'Tawakal', cognitiveLevel: 'MOTS', topic: 'Akhlak Mulia' },
        { minGrade: 5, maxGrade: 6, question: 'Ibadah kurban menyembelih hewan ternak dilaksanakan umat Islam setiap memperingati Hari Raya ...', correctAnswer: 'Iduladha', cognitiveLevel: 'LOTS', topic: 'Ibadah Kurban' }
    ],
    koding: [
        { minGrade: 1, maxGrade: 2, question: 'Urutan langkah-langkah runtut untuk melakukan kegiatan seperti memasak mie atau menali sepatu disebut ...', correctAnswer: 'Algoritma', cognitiveLevel: 'LOTS', topic: 'Algoritma Sederhana' },
        { minGrade: 1, maxGrade: 2, question: 'Perangkat keras komputer berbentuk papan dengan banyak tombol huruf dan angka untuk mengetik disebut ...', correctAnswer: 'Keyboard (Papan ketik)', cognitiveLevel: 'LOTS', topic: 'Perangkat Komputer' },
        { minGrade: 1, maxGrade: 2, question: 'Pada pola gambar "Segitiga - Lingkaran - Segitiga - Lingkaran - ...", bentuk gambar berikutnya adalah ...', correctAnswer: 'Segitiga', cognitiveLevel: 'LOTS', topic: 'Pengenalan Pola' },
        { minGrade: 1, maxGrade: 2, question: 'Layar pada komputer atau laptop yang berfungsi menampilkan gambar dan tulisan disebut ...', correctAnswer: 'Monitor', cognitiveLevel: 'LOTS', topic: 'Perangkat Output' },
        { minGrade: 3, maxGrade: 4, question: 'Teknik memecah masalah yang besar menjadi beberapa bagian tugas kecil agar mudah dikerjakan disebut ...', correctAnswer: 'Dekomposisi', cognitiveLevel: 'LOTS', topic: 'Dekomposisi' },
        { minGrade: 3, maxGrade: 4, question: 'Blok perintah yang menjalankan gerakan berulang-ulang kali secara otomatis dalam pemrograman visual disebut ...', correctAnswer: 'Perulangan (Loop / Repeat)', cognitiveLevel: 'LOTS', topic: 'Perulangan' },
        { minGrade: 3, maxGrade: 4, question: 'Proses mencari dan memperbaiki kesalahan instruksi di dalam program komputer disebut ...', correctAnswer: 'Debugging', cognitiveLevel: 'LOTS', topic: 'Debugging' },
        { minGrade: 3, maxGrade: 4, question: 'Kata rahasia yang wajib dijaga dan tidak boleh dibagikan kepada orang asing agar akun aman disebut kata sandi atau ...', correctAnswer: 'Password', cognitiveLevel: 'LOTS', topic: 'Keamanan Digital' },
        { minGrade: 5, maxGrade: 6, question: 'Wadah bernama di dalam kode program yang digunakan untuk menyimpan nilai yang bisa berubah seperti skor permainan disebut ...', correctAnswer: 'Variabel', cognitiveLevel: 'MOTS', topic: 'Variabel' },
        { minGrade: 5, maxGrade: 6, question: 'Dua simbol angka yang dipakai dalam sistem bilangan biner komputer adalah 0 dan ...', correctAnswer: '1', cognitiveLevel: 'LOTS', topic: 'Bilangan Biner' },
        { minGrade: 5, maxGrade: 6, question: 'Komponen perangkat keras yang mendeteksi perubahan cahaya, jarak, atau suhu sekitar sebagai masukan sistem pintar disebut ...', correctAnswer: 'Sensor', cognitiveLevel: 'MOTS', topic: 'Sensor dan Input' },
        { minGrade: 5, maxGrade: 6, question: 'Teks instruksi atau perintah jelas yang diberikan pengguna kepada sistem Kecerdasan Artifisial generatif disebut ...', correctAnswer: 'Prompt', cognitiveLevel: 'MOTS', topic: 'Prompting AI' }
    ],
    mulok: [
        { minGrade: 1, maxGrade: 2, question: 'Salam dina Basa Sunda nu diucapkeun nalika panggih jeung guru dina waktu isuk-isuk nyaéta "Wilujeng ...".', correctAnswer: 'Énjing', cognitiveLevel: 'LOTS', topic: 'Salam Basa Sunda' },
        { minGrade: 1, maxGrade: 2, question: 'Bagian awak urang nu dipaké pikeun ngadéngé sora nyaéta ... (ceuli).', correctAnswer: 'Cepil', cognitiveLevel: 'LOTS', topic: 'Anggota Awak' },
        { minGrade: 1, maxGrade: 2, question: 'Bubuahan has nu rasana amis sarta kulitna konéng lamun geus asak dina Basa Sunda disebut ... (pisang).', correctAnswer: 'Cau', cognitiveLevel: 'LOTS', topic: 'Ngaran Bubuahan' },
        { minGrade: 1, maxGrade: 2, question: 'Wilangan dina Basa Sunda sanggeus salapan (9) nyaéta ...', correctAnswer: 'Sapuluh (10)', cognitiveLevel: 'LOTS', topic: 'Wilangan Sunda' },
        { minGrade: 3, maxGrade: 4, question: 'Alat musik tradisional Tatar Sunda tina awi nu dibunyikeun ku cara dioyagkeun nyaéta ...', correctAnswer: 'Angklung', cognitiveLevel: 'LOTS', topic: 'Kasenian Sunda' },
        { minGrade: 3, maxGrade: 4, question: 'Kadaharan has Sunda tina sampeu kulub nu diragian nepi ka hipu jeung amis disebut ...', correctAnswer: 'Peuyeum', cognitiveLevel: 'LOTS', topic: 'Kadaharan Has Sunda' },
        { minGrade: 3, maxGrade: 4, question: 'Lawan kecap tina "caang" (terang) dina Basa Sunda nyaéta ...', correctAnswer: 'Poék', cognitiveLevel: 'LOTS', topic: 'Antonim Basa Sunda' },
        { minGrade: 3, maxGrade: 4, question: 'Dongéng Sunda anu nyaritakeun asal-usul hiji tempat saperti Situ Bagendit jeung Tangkuban Parahu disebut dongéng ...', correctAnswer: 'Sasakala (Legénda)', cognitiveLevel: 'MOTS', topic: 'Dongéng Sasakala' },
        { minGrade: 5, maxGrade: 6, question: 'Dua padalisan mimiti dina sisindiran opat jajar disebut ...', correctAnswer: 'Cangkang', cognitiveLevel: 'MOTS', topic: 'Sisindiran' },
        { minGrade: 5, maxGrade: 6, question: 'Kagiatan nyarita di hareupeun jalma réa pikeun nepikeun hiji hal dina Basa Sunda disebut ... (pidato).', correctAnswer: 'Biantara', cognitiveLevel: 'LOTS', topic: 'Biantara' },
        { minGrade: 5, maxGrade: 6, question: 'Kecap rajékan anu ngulang engang mimiti kecap dasar saperti "tatanya" tina "tanya" disebut kecap rajékan ...', correctAnswer: 'Dwipurwa', cognitiveLevel: 'MOTS', topic: 'Kecap Rajékan' },
        { minGrade: 5, maxGrade: 6, question: 'Wangun suhunan imah adat Sunda anu nyarupaan jangjang manuk keur hiber disebut Julang ...', correctAnswer: 'Ngapak', cognitiveLevel: 'MOTS', topic: 'Arsitéktur Sunda' }
    ]
};

export const EXTENDED_URAIAN_BY_CAT: Record<string, QuestionBankItemUraian[]> = {
    indo: [
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Setiap pagi Dito merapikan tempat tidur, mandi pagi, lalu sarapan roti bersama keluarga.',
            question: 'Tuliskan 3 kalimat sederhana tentang kegiatanmu di pagi hari sebelum berangkat ke sekolah menggunakan huruf kapital yang benar!',
            correctAnswer: '1. Saya bangun pagi pukul lima. 2. Saya mandi dan memakai seragam sekolah. 3. Saya berpamitan kepada ibu sebelum berangkat.',
            cognitiveLevel: 'MOTS',
            topic: 'Menulis Kalimat Sederhana',
            rubric: { score3: 'Menulis 3 kalimat runtut dengan huruf kapital dan tanda titik tepat.', score2: 'Menulis 2 kalimat benar.', score1: 'Menulis 1 kalimat kurang tepat ejaannya.', score0: 'Kosong.' }
        },
        {
            minGrade: 1, maxGrade: 2,
            question: 'Buatlah masing-masing 1 kalimat santun untuk situasi berikut: (a) meminta tolong mengambilkan pensil yang jatuh, dan (b) meminta maaf karena tidak sengaja menginjak kaki teman!',
            correctAnswer: '(a) "Tolong ambilkan pensilku yang jatuh di dekat mejamu, ya." (b) "Maaf ya, aku tidak sengaja menginjak kakimu."',
            cognitiveLevel: 'MOTS',
            topic: 'Ungkapan Tolong dan Maaf',
            rubric: { score3: 'Kedua kalimat santun menggunakan kata tolong dan maaf dengan tepat.', score2: 'Hanya 1 kalimat benar dan santun.', score1: 'Kalimat masih kasar atau kurang lengkap.', score0: 'Tidak menjawab.' }
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Setiap hari Sabtu pagi, siswa SD mengadakan gerakan Jumat/Sabtu Bersih menanam tanaman apotek hidup di pot bekas.',
            question: 'Susunlah 3 kalimat petunjuk berurutan tentang cara menanam bibit bunga di dalam pot agar tumbuh subur!',
            correctAnswer: '1. Siapkan pot berlubang di bagian bawah dan isi dengan campuran tanah gembur serta kompos. 2. Tanam bibit bunga secara tegak di tengah pot. 3. Siram dengan air secukupnya dan letakkan di tempat yang terkena cahaya matahari.',
            cognitiveLevel: 'MOTS',
            topic: 'Menulis Teks Petunjuk',
            rubric: { score3: 'Menuliskan 3 langkah menanam secara urut, logis, dan memakai kalimat perintah/petunjuk yang jelas.', score2: 'Langkah benar namun kurang urut atau hanya 2 langkah.', score1: 'Jawaban terlalu singkat dan tidak berurutan.', score0: 'Kosong.' }
        },
        {
            minGrade: 5, maxGrade: 6,
            question: 'Jelaskan 4 bagian utama yang wajib ada dalam teks pidato (mulai dari salam pembuka hingga penutup) secara singkat dan jelas!',
            correctAnswer: '1. Salam pembuka dan sapaan hormat. 2. Pendahuluan berisi ucapan syukur dan pengantar topik. 3. Isi pidato berisi gagasan pokok dan ajakan. 4. Penutup berisi kesimpulan, permohonan maaf, serta salam penutup.',
            cognitiveLevel: 'MOTS',
            topic: 'Struktur Teks Pidato',
            rubric: { score3: 'Menyebutkan 4 bagian pidato secara runtut beserta penjelasan singkatnya.', score2: 'Menyebutkan 2–3 bagian dengan benar.', score1: 'Hanya menyebutkan 1 bagian tanpa penjelasan.', score0: 'Kosong.' }
        }
    ],
    pancasila: [
        {
            minGrade: 1, maxGrade: 2,
            question: 'Tuliskan 3 contoh aturan tata tertib yang wajib dipatuhi saat kamu berada di dalam ruang kelas!',
            correctAnswer: '1. Datang ke sekolah tepat waktu. 2. Mendengarkan saat guru sedang menjelaskan. 3. Membuang sampah di tempat sampah dan menjaga kebersihan kelas.',
            cognitiveLevel: 'LOTS',
            topic: 'Aturan di Kelas',
            rubric: { score3: 'Menuliskan 3 contoh aturan kelas yang relevan dan benar.', score2: 'Menuliskan 2 contoh aturan yang tepat.', score1: 'Menuliskan 1 contoh saja.', score0: 'Tidak menjawab.' }
        },
        {
            minGrade: 1, maxGrade: 2,
            question: 'Mengapa kita harus berbuat rukun dan saling menyayangi dengan anggota keluarga di rumah? Berikan 2 contoh sikap rukun di rumah!',
            correctAnswer: 'Supaya rumah terasa nyaman, damai, dan tidak ada pertengkaran. Contoh: berbagi mainan dengan adik dan membantu ibu merapikan meja makan.',
            cognitiveLevel: 'MOTS',
            topic: 'Kerukunan Keluarga',
            rubric: { score3: 'Menjelaskan manfaat rukun dan memberikan 2 contoh sikap nyata dengan benar.', score2: 'Alasan benar namun hanya memberi 1 contoh.', score1: 'Jawaban sangat singkat.', score0: 'Kosong.' }
        },
        {
            minGrade: 3, maxGrade: 4,
            question: 'Sebutkan 3 suku bangsa beserta rumah adat atau pakaian adat daerahnya yang kamu ketahui di Indonesia, lalu jelaskan cara menghargai keberagaman tersebut!',
            correctAnswer: 'Contoh: Suku Minangkabau (Rumah Gadang), Suku Jawa (Joglo), Suku Bugis/Toraja (Tongkonan). Cara menghargai: tidak mengejek budaya daerah lain, mau berteman dengan siapa saja, dan melestarikan kesenian daerah.',
            cognitiveLevel: 'MOTS',
            topic: 'Keberagaman Suku & Budaya',
            rubric: { score3: 'Menyebutkan 3 pasangan suku/budaya daerah secara benar serta sikap menghargainya.', score2: 'Hanya menyebutkan 2 pasangan atau kurang penjelasan sikap.', score1: 'Menyebutkan 1 suku tanpa penjelasan.', score0: 'Kosong.' }
        },
        {
            minGrade: 5, maxGrade: 6,
            question: 'Jelaskan 3 contoh penerapan nilai-nilai Pancasila (sebutkan silanya) dalam menghadapi perbedaan pendapat saat kerja kelompok di sekolah!',
            correctAnswer: '1. Sila ke-4: mengutamakan musyawarah untuk mufakat dan menghargai usul teman. 2. Sila ke-3: tetap menjaga persatuan kelompok walau berbeda ide. 3. Sila ke-2: bersikap sopan dan tidak memaksakan kehendak kepada teman.',
            cognitiveLevel: 'HOTS',
            topic: 'Nilai Pancasila dalam Diskusi',
            rubric: { score3: 'Mengaitkan 3 contoh sikap dengan sila Pancasila yang sesuai secara logis.', score2: 'Hanya menyebutkan 2 contoh penerapan sila.', score1: 'Contoh kurang sesuai dengan sila yang disebutkan.', score0: 'Kosong.' }
        }
    ],
    ipas: [
        {
            minGrade: 1, maxGrade: 2,
            question: 'Sebutkan 3 panca indra pada tubuh manusia beserta kegunaan masing-masing dalam kegiatan sehari-hari!',
            correctAnswer: '1. Mata untuk melihat gambar dan membaca. 2. Telinga untuk mendengar suara guru dan musik. 3. Hidung untuk mencium aroma masakan atau bunga.',
            cognitiveLevel: 'LOTS',
            topic: 'Panca Indra Manusia',
            rubric: { score3: 'Menyebutkan 3 panca indra beserta fungsi tepatnya.', score2: 'Menyebutkan 2 panca indra beserta fungsinya.', score1: 'Menyebutkan nama indra tanpa kegunaan.', score0: 'Kosong.' }
        },
        {
            minGrade: 1, maxGrade: 2,
            question: 'Bagaimana cara merawat hewan peliharaan (seperti kucing atau ayam) di rumah agar tetap sehat dan tumbuh besar? Sebutkan 3 cara!',
            correctAnswer: '1. Memberi makan dan minum secara teratur setiap hari. 2. Membersihkan kandang agar tidak berbau. 3. Merawat atau mengobati bila hewan tampak sakit.',
            cognitiveLevel: 'MOTS',
            topic: 'Merawat Hewan Peliharaan',
            rubric: { score3: 'Menuliskan 3 cara merawat hewan dengan tepat dan jelas.', score2: 'Menuliskan 2 cara yang tepat.', score1: 'Menuliskan 1 cara saja.', score0: 'Kosong.' }
        },
        {
            minGrade: 3, maxGrade: 4,
            question: 'Jelaskan fungsi utama dari akar, batang, dan daun pada tumbuhan berbunga bagi kelangsungan hidup tumbuhan tersebut!',
            correctAnswer: 'Akar menyerap air dan mineral serta menopang tumbuhan; Batang mengangkut air/makanan dan menopang daun/bunga; Daun tempat berlangsungnya fotosintesis membuat makanan.',
            cognitiveLevel: 'MOTS',
            topic: 'Fungsi Bagian Tumbuhan',
            rubric: { score3: 'Menjelaskan fungsi ketiganya (akar, batang, daun) secara tepat.', score2: 'Menjelaskan 2 bagian tumbuhan dengan benar.', score1: 'Menjelaskan 1 bagian tumbuhan.', score0: 'Kosong.' }
        },
        {
            minGrade: 5, maxGrade: 6,
            question: 'Jelaskan perbedaan antara rangkaian listrik seri dan rangkaian listrik paralel pada lampu di rumah, serta mengapa rumah tinggal lebih memilih rangkaian paralel!',
            correctAnswer: 'Rangkaian seri disusun berurutan satu jalur sehingga jika satu lampu padam semua ikut padam; rangkaian paralel disusun bercabang sehingga tiap lampu memiliki jalur sendiri dan tetap menyala meski lampu lain dimatikan.',
            cognitiveLevel: 'HOTS',
            topic: 'Rangkaian Listrik Seri & Paralel',
            rubric: { score3: 'Menjelaskan perbedaan seri-paralel serta alasan penggunaan paralel di rumah secara logis.', score2: 'Perbedaan benar tetapi alasan pemilihan paralel kurang lengkap.', score1: 'Penjelasan masih tertukar.', score0: 'Kosong.' }
        }
    ],
    pjok: [
        {
            minGrade: 1, maxGrade: 2,
            question: 'Sebutkan 3 cara menjaga kebersihan diri setiap hari setelah selesai bermain olahraga di lapangan!',
            correctAnswer: '1. Mencuci tangan dan kaki dengan sabun. 2. Mengganti baju yang berkeringat atau mandi bersih. 3. Minum air putih yang cukup.',
            cognitiveLevel: 'LOTS',
            topic: 'Kebersihan Setelah Bermain',
            rubric: { score3: 'Menyebutkan 3 kebiasaan bersih setelah olahraga dengan benar.', score2: 'Menyebutkan 2 kebiasaan yang benar.', score1: 'Menyebutkan 1 kebiasaan saja.', score0: 'Kosong.' }
        },
        {
            minGrade: 3, maxGrade: 4,
            question: 'Jelaskan urutan langkah melakukan pemanasan yang benar sebelum pelajaran olahraga beserta 2 manfaatnya bagi tubuh!',
            correctAnswer: 'Langkah: peregangan statis mulai dari kepala, bahu, pinggang, hingga kaki lalu lari ringan. Manfaat: melenturkan otot/sendi dan mencegah risiko cedera atau kram.',
            cognitiveLevel: 'MOTS',
            topic: 'Pemanasan dan Pencegahan Cedera',
            rubric: { score3: 'Menjelaskan urutan pemanasan serta 2 manfaat secara runtut.', score2: 'Langkah atau manfaat hanya terisi sebagian.', score1: 'Penjelasan sangat singkat.', score0: 'Kosong.' }
        },
        {
            minGrade: 5, maxGrade: 6,
            question: 'Tuliskan 3 langkah pertolongan pertama yang benar ketika seorang teman mengalami luka lecet di lutut akibat terjatuh saat bermain sepak bola!',
            correctAnswer: '1. Tenangkan korban dan pindahkan ke tempat teduh. 2. Bersihkan luka perlahan menggunakan air bersih mengalir atau cairan antiseptik. 3. Oleskan obat antiseptik lalu tutup luka menggunakan plester/kasa steril.',
            cognitiveLevel: 'HOTS',
            topic: 'Pertolongan Pertama Luka Lecet',
            rubric: { score3: 'Menjelaskan 3 langkah P3K secara urut, higienis, dan tepat.', score2: 'Menjelaskan 2 langkah P3K dengan tepat.', score1: 'Urutan masih keliru atau kurang higienis.', score0: 'Kosong.' }
        }
    ],
    seni: [
        {
            minGrade: 1, maxGrade: 2,
            question: 'Sebutkan 3 jenis garis dasar yang biasa dipakai untuk menggambar pemandangan rumah dan alam, serta berikan contoh benda yang digambar dengan garis tersebut!',
            correctAnswer: '1. Garis lurus untuk dinding rumah dan pagar. 2. Garis lengkung untuk bukit, awan, atau pelangi. 3. Garis zig-zag untuk atap lancip atau rumput.',
            cognitiveLevel: 'LOTS',
            topic: 'Unsur Garis Gambar',
            rubric: { score3: 'Menyebutkan 3 jenis garis beserta contoh objek gambar yang sesuai.', score2: 'Menyebutkan 2 jenis garis dan contohnya.', score1: 'Menyebutkan garis tanpa contoh objek.', score0: 'Kosong.' }
        },
        {
            minGrade: 1, maxGrade: 2,
            question: 'Tuliskan langkah-langkah sederhana membuat karya kolase gambar kupu-kupu menggunakan daun kering dan kertas gambar!',
            correctAnswer: '1. Membuat sketsa gambar kupu-kupu di kertas. 2. Menggunting daun kering sesuai ukuran sayap. 3. Mengoleskan lem pada pola lalu menempelkan potongan daun hingga rapi.',
            cognitiveLevel: 'MOTS',
            topic: 'Membuat Kolase Bahan Alam',
            rubric: { score3: 'Menuliskan langkah membuat kolase secara urut dan jelas.', score2: 'Langkah cukup jelas namun ada bagian terlewat.', score1: 'Hanya menyebut bahan tanpa proses.', score0: 'Kosong.' }
        },
        {
            minGrade: 3, maxGrade: 4,
            question: 'Jelaskan perbedaan antara karya seni rupa dua dimensi dan karya seni rupa tiga dimensi beserta masing-masing 2 contoh bendanya!',
            correctAnswer: 'Dua dimensi hanya memiliki panjang dan lebar serta dilihat dari depan (contoh: lukisan, poster). Tiga dimensi memiliki panjang, lebar, dan volume sehingga bisa dilihat dari segala arah (contoh: patung, guci/gerabah).',
            cognitiveLevel: 'MOTS',
            topic: 'Karya 2D dan 3D',
            rubric: { score3: 'Menjelaskan perbedaan ukuran/sudut pandang dan memberi 2 contoh masing-masing secara tepat.', score2: 'Perbedaan benar tetapi contoh kurang lengkap.', score1: 'Hanya memberi 1 contoh tanpa penjelasan.', score0: 'Kosong.' }
        },
        {
            minGrade: 5, maxGrade: 6,
            question: 'Uraikan 3 jenis pola lantai dasar dalam seni tari daerah (lurus/vertikal, diagonal, dan melingkar) serta kesan yang ditimbulkan di atas panggung!',
            correctAnswer: '1. Pola garis lurus memberi kesan tegas dan sederhana. 2. Pola diagonal memberi kesan dinamis dan lincah. 3. Pola melingkar memberi kesan kebersamaan, lembut, dan akrab.',
            cognitiveLevel: 'HOTS',
            topic: 'Pola Lantai Tari Daerah',
            rubric: { score3: 'Menyebutkan 3 pola lantai dan kesan gerak panggungnya secara tepat.', score2: 'Menyebutkan 2 pola lantai dengan benar.', score1: 'Hanya menyebutkan nama pola tanpa penjelasan.', score0: 'Kosong.' }
        }
    ],
    inggris: [
        {
            minGrade: 1, maxGrade: 2,
            question: 'Write 3 short English sentences to introduce yourself (your name, your age, and your favorite color)!',
            correctAnswer: 'Example: 1. Hello, my name is Dito. 2. I am seven years old. 3. My favorite color is blue.',
            cognitiveLevel: 'MOTS',
            topic: 'Self Introduction',
            rubric: { score3: 'Writes all 3 introduction sentences accurately in English.', score2: 'Writes 2 correct sentences.', score1: 'Writes only words or 1 broken sentence.', score0: 'Blank.' }
        },
        {
            minGrade: 3, maxGrade: 4,
            question: 'Write 3 sentences in English telling about your daily morning routine before going to school (using time)!',
            correctAnswer: 'Example: 1. I wake up at 5 o\'clock every morning. 2. I take a bath at 5:30 a.m. 3. I go to school at 6:30 a.m.',
            cognitiveLevel: 'MOTS',
            topic: 'Daily Morning Routine',
            rubric: { score3: 'Writes 3 clear daily routine sentences with proper Present Tense and time.', score2: 'Writes 2 correct sentences.', score1: 'Writes 1 short sentence with minor errors.', score0: 'Blank.' }
        },
        {
            minGrade: 5, maxGrade: 6,
            question: 'Write 3 English sentences using comparative adjectives (e.g., taller, faster, bigger) to compare animals or objects around you!',
            correctAnswer: 'Example: 1. An elephant is bigger than a goat. 2. A cheetah runs faster than a turtle. 3. My classroom whiteboard is wider than my notebook.',
            cognitiveLevel: 'HOTS',
            topic: 'Comparative Sentences',
            rubric: { score3: 'Produces 3 grammatically accurate comparative sentences with "-er than".', score2: 'Produces 2 accurate comparative sentences.', score1: 'Uses base adjectives without proper "-er than" form.', score0: 'Blank.' }
        }
    ],
    pai: [
        {
            minGrade: 1, maxGrade: 2,
            question: 'Sebutkan urutan 5 waktu salat fardu dalam sehari semalam beserta jumlah rakaat masing-masing!',
            correctAnswer: '1. Subuh (2 rakaat), 2. Zuhur (4 rakaat), 3. Asar (4 rakaat), 4. Magrib (3 rakaat), 5. Isya (4 rakaat).',
            cognitiveLevel: 'LOTS',
            topic: 'Salat Fardu Lima Waktu',
            rubric: { score3: 'Menyebutkan ke-5 nama salat wajib dan jumlah rakaatnya dengan benar.', score2: 'Menyebutkan 3–4 nama salat dan rakaat dengan tepat.', score1: 'Hanya menyebutkan 1–2 salat.', score0: 'Kosong.' }
        },
        {
            minGrade: 1, maxGrade: 2,
            question: 'Mengapa kita harus berkata jujur kepada orang tua dan guru? Berikan 2 contoh sikap jujur anak di sekolah!',
            correctAnswer: 'Karena jujur adalah perintah Allah Swt., menumbuhkan kepercayaan, dan membawa ketenangan hati. Contoh: mengakui kesalahan jika memecahkan barang dan tidak mencontek saat ulangan.',
            cognitiveLevel: 'MOTS',
            topic: 'Perilaku Jujur',
            rubric: { score3: 'Menjelaskan alasan pentingnya jujur dan memberi 2 contoh nyata.', score2: 'Alasan tepat namun hanya 1 contoh.', score1: 'Jawaban terlalu singkat.', score0: 'Kosong.' }
        },
        {
            minGrade: 3, maxGrade: 4,
            question: 'Tuliskan 4 syarat atau rukun wudu secara berurutan agar salat yang dikerjakan menjadi sah!',
            correctAnswer: 'Urutan wudu: niat dalam hati saat membasuh muka, membasuh kedua tangan hingga siku, mengusap sebagian kepala, dan membasuh kedua kaki hingga mata kaki dengan tertib.',
            cognitiveLevel: 'MOTS',
            topic: 'Rukun Wudu',
            rubric: { score3: 'Menuliskan 4 atau lebih rukun wudu secara urut dan benar.', score2: 'Menuliskan 3 rukun dengan tepat.', score1: 'Hanya menuliskan 1–2 rukun.', score0: 'Kosong.' }
        },
        {
            minGrade: 5, maxGrade: 6,
            question: 'Jelaskan perbedaan antara zakat fitrah dan zakat mal (harta) dilihat dari waktu pelaksanaan dan bentuk yang dikeluarkan!',
            correctAnswer: 'Zakat fitrah wajib ditunaikan di bulan Ramadan sebelum salat Idulfitri berupa makanan pokok (2,5 kg beras per jiwa), sedangkan zakat mal dikeluarkan ketika harta mencapai nisab dan haul (1 tahun) berupa uang, emas, atau hasil usaha.',
            cognitiveLevel: 'HOTS',
            topic: 'Zakat Fitrah dan Zakat Mal',
            rubric: { score3: 'Membedakan zakat fitrah dan zakat mal dari segi waktu maupun bentuknya dengan tepat.', score2: 'Hanya membedakan salah satu aspek saja.', score1: 'Penjelasan masih tertukar.', score0: 'Kosong.' }
        }
    ],
    koding: [
        {
            minGrade: 1, maxGrade: 2,
            question: 'Tuliskan 4 langkah berurutan (algoritma sederhana) untuk mencuci tangan pakai sabun sampai bersih sebelum makan!',
            correctAnswer: '1. Basahi kedua tangan dengan air mengalir. 2. Usapkan sabun ke telapak, punggung tangan, dan sela jari. 3. Bilas tangan hingga busa hilang. 4. Keringkan tangan dengan lap bersih.',
            cognitiveLevel: 'LOTS',
            topic: 'Algoritma Kehidupan Sehari-hari',
            rubric: { score3: 'Menuliskan 4 langkah mencuci tangan secara urut, logis, dan lengkap.', score2: 'Menuliskan 3 langkah yang urut.', score1: 'Langkah masih acak.', score0: 'Kosong.' }
        },
        {
            minGrade: 3, maxGrade: 4,
            question: 'Jelaskan 3 aturan penting menjaga keamanan diri dan data pribadi saat menggunakan internet atau bermain gim daring!',
            correctAnswer: '1. Jangan membagikan alamat rumah, nomor telepon, atau kata sandi ke orang asing. 2. Tidak sembarangan mengklik tautan mencurigakan. 3. Segera melapor kepada orang tua atau guru jika ada pesan mengganggu.',
            cognitiveLevel: 'MOTS',
            topic: 'Keamanan Berinternet Anak',
            rubric: { score3: 'Menjelaskan 3 aturan keamanan data pribadi secara jelas dan tepat.', score2: 'Menjelaskan 2 aturan keamanan digital.', score1: 'Hanya 1 aturan singkat.', score0: 'Kosong.' }
        },
        {
            minGrade: 5, maxGrade: 6,
            question: 'Jelaskan mengapa kualitas dan keberagaman data latih sangat memengaruhi ketepatan hasil sistem Kecerdasan Artifisial (AI), serta berikan 1 contohnya!',
            correctAnswer: 'AI belajar pola dari kumpulan data latih. Jika data latih kurang beragam atau berat sebelah (bias), AI akan sering salah mengenali objek baru. Contoh: AI pengenal buah yang hanya dilatih foto apel merah mungkin gagal mengenali apel hijau.',
            cognitiveLevel: 'HOTS',
            topic: 'Kualitas Data Latih dan Bias AI',
            rubric: { score3: 'Menjelaskan hubungan kualitas dataset dengan akurasi/bias AI disertai 1 contoh tepat.', score2: 'Penjelasan benar tanpa contoh kasus.', score1: 'Jawaban masih umum.', score0: 'Kosong.' }
        }
    ],
    mulok: [
        {
            minGrade: 1, maxGrade: 2,
            question: 'Tuliskeun 3 ngaran sasatoan ingon-ingon dina Basa Sunda sarta sebutkeun sora disadana atawa mangpaatna!',
            correctAnswer: 'Conto: 1. Hayam (disadana kongkorongok, ngahasilkeun endog). 2. Ucing (disadana méong, néwak beurit). 3. Domba (disadana embé, ngahasilkeun daging/bulu).',
            cognitiveLevel: 'LOTS',
            topic: 'Sasatoan Sabudeureun',
            rubric: { score3: 'Nuliskeun 3 ngaran sasatoan jeung sora/mangpaatna dina Basa Sunda kalawan bener.', score2: 'Nuliskeun 2 sasatoan kalawan bener.', score1: 'Ngan nyebutkeun 1 sasatoan.', score0: 'Kosong.' }
        },
        {
            minGrade: 1, maxGrade: 2,
            question: 'Jieun 2 kalimah pondok dina Basa Sunda nu maké kecap "hatur nuhun" jeung "punten" nalika di sakola!',
            correctAnswer: '1. "Punten, Bu Guru, abdi badé naros perkawis pancén." 2. "Hatur nuhun, Dadan, parantos nginjeumkeun panghapus."',
            cognitiveLevel: 'MOTS',
            topic: 'Tatakrama Basa Sapopoé',
            rubric: { score3: 'Kadua kalimah ngagunakeun kecap punten jeung hatur nuhun kalawan sopan tur merenah.', score2: 'Ngan 1 kalimah anu bener.', score1: 'Kalimah kurang merenah basana.', score0: 'Kosong.' }
        },
        {
            minGrade: 3, maxGrade: 4,
            question: 'Tuliskeun 3 conto kadaharan has tradisional ti Tatar Sunda sarta bahan dasar nyieunna!',
            correctAnswer: 'Conto: 1. Peuyeum (tina sampeu jeung ragi). 2. Surabi (tina tipung béas jeung cipati). 3. Colénak (tina peuyeum sampeu nu dibeuleum jeung kinca gula beureum).',
            cognitiveLevel: 'MOTS',
            topic: 'Kadaharan Has Tatar Sunda',
            rubric: { score3: 'Nyebutkeun 3 kadaharan has Sunda jeung bahan dasarna kalawan bener.', score2: 'Nyebutkeun 2 kadaharan has Sunda kalawan bener.', score1: 'Nyebutkeun 1 kadaharan wungkul.', score0: 'Kosong.' }
        },
        {
            minGrade: 5, maxGrade: 6,
            question: 'Jéntrékeun bédana cangkang jeung eusi dina sisindiran Sunda, tuluy jieun 1 conto pada sisindiran paparikan nu eusina naséhat rajin diajar!',
            correctAnswer: 'Cangkang nyaéta dua padalisan mimiti pikeun muka sora/purwakanti, sedengkeun eusi nyaéta dua padalisan panutup nu ngandung maksud/amanat. Conto: Ka pasar meuli samangka / dibawa ka imah aki. Hayu urang rajin maca / sangkan élmu nambahan pasti.',
            cognitiveLevel: 'HOTS',
            topic: 'Ngarang Sisindiran Sunda',
            rubric: { score3: 'Ngajelaskeun cangkang-eusi bener sarta nyusun 4 jajar sisindiran paparikan luyu jeung purwakanti.', score2: 'Penjelasan bener tapi conto sisindiran kirang pas purwakantina.', score1: 'Ngan ngajelaskeun harti tanpa conto.', score0: 'Kosong.' }
        }
    ]
};
