import type {
    QuestionBankItemPG,
    QuestionBankItemIsian,
    QuestionBankItemUraian
} from './questionBankHelper';

// Extended Part 5: Final Fase-scoped PG, Isian, and Uraian top-up across all 9 non-math subjects
// Guarantees zero within-exam and zero cross-class twins across Kelas 6 -> Kelas 4 -> Kelas 1 on the same device.

export const PART5_PG_BY_CAT: Record<string, QuestionBankItemPG[]> = {
    indo: [
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Lani membantu ibu menyapu daun kering yang berserakan di halaman depan.',
            question: 'Alat kebersihan yang digunakan Lani pada kalimat di atas adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Sapu lidi' }, { key: 'B', text: 'Sendok makan' }, { key: 'C', text: 'Bantal tidur' }],
            optionsFaseBC: [{ key: 'A', text: 'Sapu' }, { key: 'B', text: 'Sendok' }, { key: 'C', text: 'Payung' }, { key: 'D', text: 'Sisir' }],
            correctAnswer: 'A',
            explanation: 'Untuk menyapu daun kering di halaman digunakan sapu lidi.',
            cognitiveLevel: 'LOTS',
            topic: 'Kosakata Benda Sekitar'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Adik menangis tersedu-sedu karena mainan balok kayunya terjatuh dari meja.',
            question: 'Perasaan yang dialami adik pada kalimat di atas adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Sedih' }, { key: 'B', text: 'Tertawa riang' }, { key: 'C', text: 'Mengantuk' }],
            optionsFaseBC: [{ key: 'A', text: 'Sedih' }, { key: 'B', text: 'Gembira' }, { key: 'C', text: 'Bangga' }, { key: 'D', text: 'Tenang' }],
            correctAnswer: 'A',
            explanation: 'Menangis saat mainan rusak menandakan perasaan sedih.',
            cognitiveLevel: 'LOTS',
            topic: 'Mengenal Perasaan Tokoh'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Perhatikan kalimat perintah berikut: "Tutuplah pintu kelas setelah masuk ke ruangan!"',
            question: 'Kalimat perintah di atas diakhiri dengan tanda baca ...',
            optionsFaseA: [{ key: 'A', text: 'Tanda seru (!)' }, { key: 'B', text: 'Tanda tanya (?)' }, { key: 'C', text: 'Tanda koma (,)' }],
            optionsFaseBC: [{ key: 'A', text: 'Tanda seru (!)' }, { key: 'B', text: 'Tanda tanya (?)' }, { key: 'C', text: 'Tanda koma (,)' }, { key: 'D', text: 'Tanda titik dua (:)' }],
            correctAnswer: 'A',
            explanation: 'Kalimat perintah atau seruan ditulis dengan akhiran tanda seru (!).',
            cognitiveLevel: 'LOTS',
            topic: 'Kalimat Perintah'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Paman datang membawa oleh-oleh buah mangga harum manis dari kebun.',
            question: 'Siapakah yang datang membawa buah mangga pada cerita di atas?',
            optionsFaseA: [{ key: 'A', text: 'Paman' }, { key: 'B', text: 'Nenek' }, { key: 'C', text: 'Dokter' }],
            optionsFaseBC: [{ key: 'A', text: 'Paman' }, { key: 'B', text: 'Kakek' }, { key: 'C', text: 'Tetangga' }, { key: 'D', text: 'Pedagang' }],
            correctAnswer: 'A',
            explanation: 'Berdasarkan kalimat tersebut, Paman yang membawa oleh-oleh buah mangga.',
            cognitiveLevel: 'LOTS',
            topic: 'Memahami Tokoh Kalimat'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Bacalah kutipan kalimat berikut: "Meskipun hujan turun deras, semangat para siswa mengikuti lomba membaca puisi tetap menyala."',
            question: 'Kata hubung (konjungsi) pertentangan yang mengawali kalimat tersebut adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Meskipun' }, { key: 'B', text: 'Karena' }, { key: 'C', text: 'Sehingga' }],
            optionsFaseBC: [{ key: 'A', text: 'Meskipun' }, { key: 'B', text: 'Karena' }, { key: 'C', text: 'Sehingga' }, { key: 'D', text: 'Supaya' }],
            correctAnswer: 'A',
            explanation: '"Meskipun" menyatakan hubungan pertentangan atau perlawanan keadaan.',
            cognitiveLevel: 'MOTS',
            topic: 'Kata Hubung Kalimat'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Perhatikan kutipan bagian penutup pidato: "Demikian sambutan yang dapat saya sampaikan. Mohon maaf apabila terdapat kata-kata yang kurang berkenan."',
            question: 'Tujuan penyampaian kalimat penutup pidato tersebut di hadapan hadirin adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Mengakhiri pidato dengan sopan dan memohon maaf atas kekhilafan' }, { key: 'B', text: 'Memperkenalkan nama pembicara di awal acara' }, { key: 'C', text: 'Membuka sesi tanya jawab panjang' }],
            optionsFaseBC: [{ key: 'A', text: 'Menutup pidato secara santun disertai permohonan maaf bila ada kekeliruan' }, { key: 'B', text: 'Menyampaikan salam pembuka kepada tamu undangan' }, { key: 'C', text: 'Menjelaskan latar belakang topik utama' }, { key: 'D', text: 'Mengajak tamu berdiri bersama' }],
            correctAnswer: 'A',
            explanation: 'Penutup pidato berisi simpulan singkat, ucapan terima kasih, permohonan maaf, dan salam penutup.',
            cognitiveLevel: 'MOTS',
            topic: 'Struktur Pidato'
        }
    ],
    pancasila: [
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Sebelum berangkat bermain ke taman, Rafi meminta izin terlebih dahulu kepada ibu di rumah.',
            question: 'Manfaat berpamitan kepada orang tua sebelum keluar rumah adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Orang tua mengetahui keberadaan kita dan merasa tenang' }, { key: 'B', text: 'Agar cepat diberi uang jajan banyak' }, { key: 'C', text: 'Supaya boleh pulang larut malam' }],
            optionsFaseBC: [{ key: 'A', text: 'Orang tua merasa tenang karena tahu ke mana kita pergi' }, { key: 'B', text: 'Agar bisa bermain seharian tanpa makan' }, { key: 'C', text: 'Supaya bebas melanggar aturan rumah' }, { key: 'D', text: 'Agar tidak perlu membantu ibu' }],
            correctAnswer: 'A',
            explanation: 'Berpamitan membuat orang tua mengetahui tujuan kita dan menjaga keselamatan anak.',
            cognitiveLevel: 'LOTS',
            topic: 'Aturan Keluar Rumah'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Ketika teman sekelas jatuh terpeleset di teras sekolah, Nisa segera menolongnya berdiri.',
            question: 'Perilaku Nisa menolong teman yang terjatuh mencerminkan sikap ...',
            optionsFaseA: [{ key: 'A', text: 'Peduli dan penyayang' }, { key: 'B', text: 'Sombong' }, { key: 'C', text: 'Acuh tak acuh' }],
            optionsFaseBC: [{ key: 'A', text: 'Peduli dan suka menolong' }, { key: 'B', text: 'Sombong dan acuh' }, { key: 'C', text: 'Pemarah' }, { key: 'D', text: 'Egois' }],
            correctAnswer: 'A',
            explanation: 'Menolong sesama yang kesusahan merupakan sikap peduli dan pengamalan Sila ke-2.',
            cognitiveLevel: 'LOTS',
            topic: 'Kepedulian Sesama'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Setiap hari Jumat, sekolah mengadakan kegiatan menabung sukarela dan menyisihkan uang untuk membantu teman yang sakit.',
            question: 'Nilai luhur Pancasila yang dipupuk melalui kegiatan menyisihkan uang untuk membantu sesama adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Empati kemanusiaan dan semangat berbagi' }, { key: 'B', text: 'Sifat boros dan pamer kekayaan' }, { key: 'C', text: 'Persaingan antar siswa' }],
            optionsFaseBC: [{ key: 'A', text: 'Empati, solidaritas kemanusiaan, dan keadilan sosial' }, { key: 'B', text: 'Gaya hidup konsumtif' }, { key: 'C', text: 'Sikap individualisme' }, { key: 'D', text: 'Keinginan dipuji guru' }],
            correctAnswer: 'A',
            explanation: 'Berbagi dengan sesama yang sakit atau membutuhkan melatih rasa kemanusiaan.',
            cognitiveLevel: 'MOTS',
            topic: 'Empati dan Berbagi'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Di lingkungan tempat tinggal kita sering diadakan ronda malam atau siskamling secara bergiliran oleh warga.',
            question: 'Tujuan utama pelaksanaan siskamling di lingkungan tempat tinggal adalah menjaga ...',
            optionsFaseA: [{ key: 'A', text: 'Keamanan dan ketertiban lingkungan bersama' }, { key: 'B', text: 'Kebersihan selokan saja' }, { key: 'C', text: 'Jadwal lomba olahraga' }],
            optionsFaseBC: [{ key: 'A', text: 'Keamanan, ketenteraman, dan ketertiban warga sekitar' }, { key: 'B', text: 'Pembangunan gedung sekolah baru' }, { key: 'C', text: 'Pendataan nilai rapor siswa' }, { key: 'D', text: 'Pembagian hasil panen desa' }],
            correctAnswer: 'A',
            explanation: 'Siskamling adalah wujud kerja sama warga menjaga keamanan lingkungan.',
            cognitiveLevel: 'LOTS',
            topic: 'Keamanan Lingkungan'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Pancasila sebagai dasar negara disahkan secara resmi sebagai ideologi bangsa Indonesia pada tanggal 18 Agustus 1945.',
            question: 'Lembaga negara yang menetapkan dan mengesahkan UUD 1945 serta Pancasila sebagai dasar negara pada tanggal 18 Agustus 1945 adalah ...',
            optionsFaseA: [{ key: 'A', text: 'PPKI' }, { key: 'B', text: 'BPUPKI' }, { key: 'C', text: 'DPR sementara' }],
            optionsFaseBC: [{ key: 'A', text: 'PPKI (Panitia Persiapan Kemerdekaan Indonesia)' }, { key: 'B', text: 'BPUPKI' }, { key: 'C', text: 'MPRS' }, { key: 'D', text: 'Konstituante' }],
            correctAnswer: 'A',
            explanation: 'PPKI mengesahkan UUD NRI 1945 yang memuat Pancasila dalam Pembukaan alinea ke-4.',
            cognitiveLevel: 'LOTS',
            topic: 'Sejarah Pengesahan Pancasila'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Salah satu contoh perilaku hemat energi di sekolah adalah mematikan lampu kelas dan kipas angin saat pelajaran di ruangan selesai.',
            question: 'Tindakan menghemat listrik serta tidak bersikap boros dalam memakai fasilitas umum mencerminkan pengamalan sila ke- ...',
            optionsFaseA: [{ key: 'A', text: 'Lima (Keadilan Sosial bagi Seluruh Rakyat Indonesia)' }, { key: 'B', text: 'Satu (Ketuhanan)' }, { key: 'C', text: 'Empat (Kerakyatan)' }],
            optionsFaseBC: [{ key: 'A', text: 'Sila kelima (Keadilan Sosial bagi Seluruh Rakyat Indonesia)' }, { key: 'B', text: 'Sila pertama saja' }, { key: 'C', text: 'Sila kedua saja' }, { key: 'D', text: 'Sila keempat saja' }],
            correctAnswer: 'A',
            explanation: 'Tidak bergaya hidup mewah, tidak boros, dan menjaga fasilitas bersama merupakan butir Sila ke-5.',
            cognitiveLevel: 'MOTS',
            topic: 'Sikap Hemat Sila Kelima'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Indonesia aktif menjalin persahabatan dan kerja sama pendidikan, budaya, serta perdagangan dengan negara-negara tetangga di Asia Tenggara.',
            question: 'Organisasi kerja sama antarnegara kawasan Asia Tenggara yang diprakarsai oleh lima negara termasuk Indonesia adalah ...',
            optionsFaseA: [{ key: 'A', text: 'ASEAN' }, { key: 'B', text: 'PBB' }, { key: 'C', text: 'OPEC' }],
            optionsFaseBC: [{ key: 'A', text: 'ASEAN' }, { key: 'B', text: 'Uni Eropa' }, { key: 'C', text: 'NATO' }, { key: 'D', text: 'G20 Eropa' }],
            correctAnswer: 'A',
            explanation: 'ASEAN dibentuk 8 Agustus 1967 di Bangkok dengan Indonesia sebagai salah satu negara pendiri.',
            cognitiveLevel: 'LOTS',
            topic: 'Kerja Sama ASEAN'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Ketika berkendara sepeda motor di jalan raya, pengendara wajib memakai helm berstandar keselamatan dan memiliki Surat Izin Mengemudi.',
            question: 'Kewajiban memakai helm dan memiliki SIM merupakan contoh pelaksanaan norma ...',
            optionsFaseA: [{ key: 'A', text: 'Hukum' }, { key: 'B', text: 'Kesopanan' }, { key: 'C', text: 'Agama' }],
            optionsFaseBC: [{ key: 'A', text: 'Norma hukum' }, { key: 'B', text: 'Norma kesopanan' }, { key: 'C', text: 'Norma kesusilaan' }, { key: 'D', text: 'Norma adat lisan' }],
            correctAnswer: 'A',
            explanation: 'Aturan lalu lintas ditetapkan undang-undang negara dan memiliki sanksi tegas sehingga termasuk norma hukum.',
            cognitiveLevel: 'MOTS',
            topic: 'Norma Hukum Lalu Lintas'
        }
    ],
    ipas: [
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Saat menginjakkan kaki tanpa alas di jalan berpasir yang panas di siang hari, telapak kaki terasa hangat.',
            question: 'Bagian tubuh manusia yang berfungsi sebagai indra peraba panas, dingin, dan halus kasar adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Kulit' }, { key: 'B', text: 'Mata' }, { key: 'C', text: 'Telinga' }],
            optionsFaseBC: [{ key: 'A', text: 'Kulit' }, { key: 'B', text: 'Mata' }, { key: 'C', text: 'Hidung' }, { key: 'D', text: 'Lidah' }],
            correctAnswer: 'A',
            explanation: 'Kulit adalah indra peraba yang peka terhadap sentuhan, tekstur, dan suhu.',
            cognitiveLevel: 'LOTS',
            topic: 'Indra Peraba Kulit'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Ikan mas berenang lincah di dalam kolam air tawar menggunakan sirip dan ekornya.',
            question: 'Alat pernapasan yang digunakan oleh ikan untuk mengambil oksigen terlarut di dalam air adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Insang' }, { key: 'B', text: 'Paru-paru' }, { key: 'C', text: 'Sayap' }],
            optionsFaseBC: [{ key: 'A', text: 'Insang' }, { key: 'B', text: 'Paru-paru' }, { key: 'C', text: 'Trakea' }, { key: 'D', text: 'Kulit kering' }],
            correctAnswer: 'A',
            explanation: 'Ikan bernapas di dalam air menggunakan insang.',
            cognitiveLevel: 'LOTS',
            topic: 'Pernapasan Hewan Air'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Ibu menyiram tanaman tomat di halaman rumah setiap pagi agar tanahnya tetap lembap dan subur.',
            question: 'Jika tanaman tomat dibiarkan berhari-hari tanpa disiram air, akibat yang terjadi adalah daunnya menjadi ...',
            optionsFaseA: [{ key: 'A', text: 'Layu dan mengering' }, { key: 'B', text: 'Tumbuh semakin besar' }, { key: 'C', text: 'Berbuah lebat sekali' }],
            optionsFaseBC: [{ key: 'A', text: 'Layu lalu mati kekeringan' }, { key: 'B', text: 'Berbunga sangat banyak' }, { key: 'C', text: 'Berubah menjadi batu' }, { key: 'D', text: 'Tumbuh makin tinggi' }],
            correctAnswer: 'A',
            explanation: 'Air sangat dibutuhkan tumbuhan agar tetap segar dan hidup.',
            cognitiveLevel: 'LOTS',
            topic: 'Kebutuhan Air Tumbuhan'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Saat cuaca hujan deras turun, langit tampak mendung kelabu dan suhu udara terasa sejuk.',
            question: 'Perlengkapan yang tepat dipakai agar tubuh tidak kehujanan saat berjalan menuju sekolah adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Payung atau jas hujan' }, { key: 'B', text: 'Kacamata hitam pantai' }, { key: 'C', text: 'Topi anyaman tipis' }],
            optionsFaseBC: [{ key: 'A', text: 'Jas hujan atau payung' }, { key: 'B', text: 'Kacamata renang' }, { key: 'C', text: 'Kipas tangan kertas' }, { key: 'D', text: 'Sarung tangan wol tebal' }],
            correctAnswer: 'A',
            explanation: 'Jas hujan dan payung melindungi tubuh dari guyuran air hujan.',
            cognitiveLevel: 'LOTS',
            topic: 'Cuaca dan Perlengkapan'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Di rumah tangga terdapat panci aluminium untuk memasak air yang dilengkapi pegangan berbahan plastik keras.',
            question: 'Alasan pegangan panci dibuat dari bahan plastik atau kayu adalah karena bahan tersebut bersifat ...',
            optionsFaseA: [{ key: 'A', text: 'Isolator (menghambat rambatan panas)' }, { key: 'B', text: 'Konduktor (penghantar panas cepat)' }, { key: 'C', text: 'Magnetis (menarik besi)' }],
            optionsFaseBC: [{ key: 'A', text: 'Isolator panas sehingga tangan aman memegang panci' }, { key: 'B', text: 'Konduktor panas sangat kuat' }, { key: 'C', text: 'Mudah meleleh saat terkena air' }, { key: 'D', text: 'Menyerap seluruh api kompor' }],
            correctAnswer: 'A',
            explanation: 'Plastik dan kayu merupakan isolator yang buruk menghantarkan panas sehingga aman dipegang.',
            cognitiveLevel: 'MOTS',
            topic: 'Konduktor dan Isolator Panas'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Karet gelang yang ditarik memanjang akan kembali ke ukuran semula saat tarikan dilepaskan.',
            question: 'Jenis gaya yang timbul akibat tarikan atau regangan benda lentur seperti karet dan ketapel adalah gaya ...',
            optionsFaseA: [{ key: 'A', text: 'Gaya pegas' }, { key: 'B', text: 'Gaya magnet' }, { key: 'C', text: 'Gaya listrik' }],
            optionsFaseBC: [{ key: 'A', text: 'Gaya pegas (elastis)' }, { key: 'B', text: 'Gaya magnet' }, { key: 'C', text: 'Gaya listrik statis' }, { key: 'D', text: 'Gaya gravitasi' }],
            correctAnswer: 'A',
            explanation: 'Benda elastis seperti karet atau per menghasilkan gaya pegas saat diregangkan.',
            cognitiveLevel: 'LOTS',
            topic: 'Gaya Pegas'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Pak Raka mendirikan usaha bengkel servis sepeda motor di pinggir jalan raya desa.',
            question: 'Usaha jasa perbaikan kendaraan yang dikerjakan Pak Raka menghasilkan penghasilan berupa ...',
            optionsFaseA: [{ key: 'A', text: 'Pelayanan jasa' }, { key: 'B', text: 'Hasil tangkapan ikan' }, { key: 'C', text: 'Barang tambang batu bara' }],
            optionsFaseBC: [{ key: 'A', text: 'Kegiatan ekonomi bidang jasa perbaikan' }, { key: 'B', text: 'Industri pertanian sawah' }, { key: 'C', text: 'Perdagangan hasil tambang' }, { key: 'D', text: 'Peternakan unggas' }],
            correctAnswer: 'A',
            explanation: 'Bengkel, dokter, dan guru termasuk pekerjaan ekonomi yang memberikan layanan jasa.',
            cognitiveLevel: 'LOTS',
            topic: 'Pekerjaan Jasa dan Barang'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Pada ekosistem laut dalam yang masih dangkal dan jernih, burung jalak sering bertengger memakan kutu di punggung kerbau.',
            question: 'Hubungan antara burung jalak dan kerbau di padang rumput tersebut termasuk simbiosis ...',
            optionsFaseA: [{ key: 'A', text: 'Mutualisme (keduanya untung)' }, { key: 'B', text: 'Parasitisme (satu rugi)' }, { key: 'C', text: 'Komensalisme (satu netral)' }],
            optionsFaseBC: [{ key: 'A', text: 'Mutualisme' }, { key: 'B', text: 'Parasitisme' }, { key: 'C', text: 'Komensalisme' }, { key: 'D', text: 'Amensalisme' }],
            correctAnswer: 'A',
            explanation: 'Burung jalak kenyang memakan kutu, sedangkan kerbau terbebas dari gatal kutu (sama-sama untung).',
            cognitiveLevel: 'MOTS',
            topic: 'Simbiosis Ekosistem'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Ketika gerhana matahari total terjadi di siang hari, langit mendadak menjadi gelap selama beberapa menit.',
            question: 'Urutan posisi benda langit yang tepat saat peristiwa gerhana matahari berlangsung adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Matahari - Bulan - Bumi berada dalam satu garis lurus' }, { key: 'B', text: 'Matahari - Bumi - Bulan berada dalam satu garis lurus' }, { key: 'C', text: 'Bulan - Matahari - Bumi membentuk siku-siku' }],
            optionsFaseBC: [{ key: 'A', text: 'Matahari – Bulan – Bumi segaris lurus' }, { key: 'B', text: 'Matahari – Bumi – Bulan segaris lurus' }, { key: 'C', text: 'Bumi – Matahari – Bulan segaris lurus' }, { key: 'D', text: 'Bulan berada di belakang Bumi' }],
            correctAnswer: 'A',
            explanation: 'Pada gerhana matahari, Bulan berada di antara Matahari dan Bumi sehingga bayangan Bulan jatuh ke Bumi.',
            cognitiveLevel: 'MOTS',
            topic: 'Gerhana Matahari'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Pemerintah membangun Pembangkit Listrik Tenaga Air (PLTA) dengan memanfaatkan aliran deras air bendungan.',
            question: 'Perubahan bentuk energi yang berlangsung di dalam turbin dan generator PLTA adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Energi gerak air menjadi energi listrik' }, { key: 'B', text: 'Energi listrik menjadi energi panas' }, { key: 'C', text: 'Energi kimia menjadi energi suara' }],
            optionsFaseBC: [{ key: 'A', text: 'Energi potensial dan gerak aliran air menjadi energi listrik' }, { key: 'B', text: 'Energi panas bumi menjadi gerak angin' }, { key: 'C', text: 'Energi listrik menjadi kimia' }, { key: 'D', text: 'Energi bunyi menjadi cahaya' }],
            correctAnswer: 'A',
            explanation: 'Aliran air memutar turbin (energi gerak) yang kemudian menggerakkan generator penghasil listrik.',
            cognitiveLevel: 'MOTS',
            topic: 'Transformasi Energi PLTA'
        }
    ],
    pjok: [
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Setiap pagi sebelum masuk kelas, guru memeriksa kebersihan telinga dan gigi para siswa.',
            question: 'Alat yang aman digunakan sendiri setiap hari untuk membersihkan gigi adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Sikat gigi dan pasta gigi' }, { key: 'B', text: 'Batu kerikil' }, { key: 'C', text: 'Kertas koran' }],
            optionsFaseBC: [{ key: 'A', text: 'Sikat gigi berbulu lembut dan pasta gigi' }, { key: 'B', text: 'Sabun cuci piring' }, { key: 'C', text: 'Ranting kayu kecil' }, { key: 'D', text: 'Kapas basah saja' }],
            correctAnswer: 'A',
            explanation: 'Menggosok gigi dengan sikat dan pasta gigi minimal dua kali sehari menjaga kesehatan gigi.',
            cognitiveLevel: 'LOTS',
            topic: 'Kebersihan Gigi'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Di lapangan rumput, Tari bermain menirukan gerak pesawat terbang dengan merentangkan kedua lengan ke samping.',
            question: 'Sikap menirukan pesawat terbang dengan mengangkat satu kaki ke belakang melatih kemampuan ...',
            optionsFaseA: [{ key: 'A', text: 'Keseimbangan tubuh' }, { key: 'B', text: 'Kecepatan berenang' }, { key: 'C', text: 'Kekuatan melempar jauh' }],
            optionsFaseBC: [{ key: 'A', text: 'Keseimbangan badan' }, { key: 'B', text: 'Kelenturan leher' }, { key: 'C', text: 'Kecepatan melompat jauh' }, { key: 'D', text: 'Daya tahan menyelam' }],
            correctAnswer: 'A',
            explanation: 'Sikap kapal terbang melatih keseimbangan statis tubuh bertumpu satu kaki.',
            cognitiveLevel: 'LOTS',
            topic: 'Keseimbangan Kapal Terbang'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Saat berjalan santai menuju ruang perpustakaan bersama rombongan kelas, siswa berjalan rapi satu barisan.',
            question: 'Posisi pandangan mata yang benar ketika berjalan maju ke depan adalah mengarah ke ...',
            optionsFaseA: [{ key: 'A', text: 'Depan agar tidak menabrak benda' }, { key: 'B', text: 'Langit-langit terus' }, { key: 'C', text: 'Belakang sambil menutup mata' }],
            optionsFaseBC: [{ key: 'A', text: 'Lurus ke depan' }, { key: 'B', text: 'Menoleh ke belakang' }, { key: 'C', text: 'Memandang ke langit terus' }, { key: 'D', text: 'Menutup kedua mata' }],
            correctAnswer: 'A',
            explanation: 'Pandangan ke depan saat berjalan menjaga keselamatan agar tidak tersandung atau menabrak.',
            cognitiveLevel: 'LOTS',
            topic: 'Sikap Berjalan Benar'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Setelah seharian bermain dan belajar di sekolah, tubuh terasa lelah dan membutuhkan istirahat malam.',
            question: 'Manfaat tidur malam yang cukup sekitar delapan jam bagi anak usia sekolah adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Memulihkan tenaga agar esok hari segar kembali' }, { key: 'B', text: 'Membuat badan menjadi semakin lemas' }, { key: 'C', text: 'Mengurangi nafsu makan pagi' }],
            optionsFaseBC: [{ key: 'A', text: 'Mengembalikan kebugaran tubuh dan mendukung pertumbuhan anak' }, { key: 'B', text: 'Membuat mata mudah mengantuk saat belajar' }, { key: 'C', text: 'Menghambat konsentrasi membaca' }, { key: 'D', text: 'Membuat otot menjadi kaku' }],
            correctAnswer: 'A',
            explanation: 'Tidur cukup memulihkan stamina tubuh serta mendukung perkembangan otak dan pertumbuhan anak.',
            cognitiveLevel: 'LOTS',
            topic: 'Istirahat dan Tidur Sehat'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Saat mengikuti perlombaan lari cepat jarak pendek di lapangan, pelari bersiap pada garis start dengan posisi jongkok.',
            question: 'Aba-aba ketiga sebagai tanda pelari mulai melesat berlari secepat mungkin pada lomba lari pendek adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Ya! (atau bunyi peluit / tembakan start)' }, { key: 'B', text: 'Bersedia!' }, { key: 'C', text: 'Siap!' }],
            optionsFaseBC: [{ key: 'A', text: 'Aba-aba "Ya!" atau bunyi peluit' }, { key: 'B', text: 'Aba-aba "Bersedia"' }, { key: 'C', text: 'Aba-aba "Siap"' }, { key: 'D', text: 'Aba-aba "Berhenti"' }],
            correctAnswer: 'A',
            explanation: 'Urutan aba-aba start jongkok lari jarak pendek adalah Bersedia -> Siap -> Ya! (peluit).',
            cognitiveLevel: 'LOTS',
            topic: 'Start Jongkok Lari Pendek'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Sebelum berlatih gerak meluncur di kolam renang dangkal, guru menyuruh siswa membasahi tubuh di pancuran.',
            question: 'Salah satu aturan keselamatan penting di area kolam renang adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Tidak berlari-lari di tepi kolam yang licin agar tidak terpeleset' }, { key: 'B', text: 'Langsung melompat ke kolam terdalam tanpa pemanasan' }, { key: 'C', text: 'Mendorong teman ke dalam air dari belakang' }],
            optionsFaseBC: [{ key: 'A', text: 'Dilarang berlari di pinggir kolam yang licin dan wajib memakai pakaian renang' }, { key: 'B', text: 'Bercanda mendorong teman dari tepi kolam' }, { key: 'C', text: 'Makan permen karet sambil menyelam' }, { key: 'D', text: 'Melompat langsung ke bagian paling dalam' }],
            correctAnswer: 'A',
            explanation: 'Lantai pinggir kolam basah dan licin sehingga berlari sangat berisiko membuat siswa terpeleset.',
            cognitiveLevel: 'LOTS',
            topic: 'Keselamatan Kolam Renang'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Dalam latihan senam ketangkasan tanpa alat, siswa berlatih berdiri tegak membentuk sikap lilin di atas matras.',
            question: 'Saat melakukan sikap lilin di atas matras, tumpuan utama berat tubuh berada pada ...',
            optionsFaseA: [{ key: 'A', text: 'Punggung bagian atas dan tengkuk bahu' }, { key: 'B', text: 'Ujung jari kaki' }, { key: 'C', text: 'Dagu dan wajah' }],
            optionsFaseBC: [{ key: 'A', text: 'Bahu dan punggung atas dengan tangan menopang pinggang' }, { key: 'B', text: 'Telapak kaki dan lutut' }, { key: 'C', text: 'Dahi dan hidung' }, { key: 'D', text: 'Siku sebelah kiri saja' }],
            correctAnswer: 'A',
            explanation: 'Sikap lilin menumpu pada bahu/punggung atas sambil kedua tangan menyangga pinggang dan kaki lurus ke atas.',
            cognitiveLevel: 'MOTS',
            topic: 'Senam Lantai Sikap Lilin'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Makan makanan beragam yang terdiri atas nasi, lauk pauk ikan, sayur bayam, dan buah pepaya membuat tubuh sehat.',
            question: 'Zat gizi utama yang terkandung di dalam sayuran hijau dan buah-buahan segar untuk menjaga daya tahan tubuh adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Vitamin dan mineral' }, { key: 'B', text: 'Lemak jenuh tinggi' }, { key: 'C', text: 'Gula buatan' }],
            optionsFaseBC: [{ key: 'A', text: 'Vitamin, mineral, dan serat' }, { key: 'B', text: 'Lemak hewani jenuh' }, { key: 'C', text: 'Pewarna makanan' }, { key: 'D', text: 'Pengawet sintetis' }],
            correctAnswer: 'A',
            explanation: 'Sayur dan buah kaya vitamin, mineral, dan serat untuk melancarkan pencernaan dan kekebalan tubuh.',
            cognitiveLevel: 'LOTS',
            topic: 'Gizi Seimbang'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Dalam permainan bola basket, pemain melempar bola memantul ke lantai lapangan sebelum diterima rekan setimnya.',
            question: 'Teknik mengoper bola basket dengan cara memantulkannya sekali ke lantai menuju teman disebut ...',
            optionsFaseA: [{ key: 'A', text: 'Bounce pass' }, { key: 'B', text: 'Chest pass' }, { key: 'C', text: 'Overhead pass' }],
            optionsFaseBC: [{ key: 'A', text: 'Bounce pass (Operan pantul)' }, { key: 'B', text: 'Chest pass (Operan dada)' }, { key: 'C', text: 'Overhead pass (Atas kepala)' }, { key: 'D', text: 'Lay-up shoot' }],
            correctAnswer: 'A',
            explanation: 'Bounce pass adalah operan pantul ke lantai yang efektif melewati penjagaan lawan bertubuh tinggi.',
            cognitiveLevel: 'MOTS',
            topic: 'Operan Bola Basket'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Saat berlatih pencak silat di halaman sekolah, pesilat mengangkat satu kaki untuk menangkis atau menjauh dari serangan arah depan.',
            question: 'Gerakan menghindari serangan lawan tanpa memindahkan posisi telapak kaki bertumpu dalam pencak silat disebut ...',
            optionsFaseA: [{ key: 'A', text: 'Elakan' }, { key: 'B', text: 'Tendangan' }, { key: 'C', text: 'Pukulan lurus' }],
            optionsFaseBC: [{ key: 'A', text: 'Elakan' }, { key: 'B', text: 'Pukulan tebas' }, { key: 'C', text: 'Tendangan sabit' }, { key: 'D', text: 'Bantingan' }],
            correctAnswer: 'A',
            explanation: 'Elakan adalah teknik pembelaan menghindari serangan dengan menggerakkan badan tanpa berpindah tempat.',
            cognitiveLevel: 'MOTS',
            topic: 'Pembelaan Pencak Silat'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Setelah berolahraga intensitas tinggi di lapangan, guru mengajak siswa berjalan santai memutar lapangan sambil mengatur napas.',
            question: 'Tujuan utama melakukan gerakan pendinginan (cooling down) sesudah berolahraga adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Menurunkan detak jantung perlahan dan melemaskan otot yang tegang' }, { key: 'B', text: 'Membuat suhu tubuh melonjak tinggi mendadak' }, { key: 'C', text: 'Menambah risiko kram otot kaki' }],
            optionsFaseBC: [{ key: 'A', text: 'Mengembalikan detak jantung dan suhu tubuh ke kondisi normal serta mencegah pegal otot' }, { key: 'B', text: 'Meningkatkan kelelahan fisik ekstrem' }, { key: 'C', text: 'Menggantikan fungsi pemanasan awal' }, { key: 'D', text: 'Menahan cairan keringat agar tidak keluar' }],
            correctAnswer: 'A',
            explanation: 'Pendinginan mengembalikan ritme jantung dan pernapasan secara bertahap agar tubuh cepat pulih.',
            cognitiveLevel: 'MOTS',
            topic: 'Pendinginan Setelah Olahraga'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Siswa kelas enam melakukan latihan kebugaran jasmani berbentuk gerakan naik-turun bangku atau lari zig-zag melewati kerucut.',
            question: 'Latihan lari berbelok-belok (zig-zag) melewati rintangan kerucut bertujuan melatih ...',
            optionsFaseA: [{ key: 'A', text: 'Kelincahan (agility)' }, { key: 'B', text: 'Kekuatan otot leher' }, { key: 'C', text: 'Ketenangan tidur' }],
            optionsFaseBC: [{ key: 'A', text: 'Kelincahan (Agility)' }, { key: 'B', text: 'Kekuatan cengkeraman jari' }, { key: 'C', text: 'Kelenturan punggung' }, { key: 'D', text: 'Daya ledak lemparan' }],
            correctAnswer: 'A',
            explanation: 'Lari zig-zag (shuttle/slalom) melatih kemampuan tubuh mengubah arah gerak dengan cepat dan lincah.',
            cognitiveLevel: 'LOTS',
            topic: 'Komponen Kebugaran Kelincahan'
        }
    ],
    seni: [
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Dito menyusun potongan daun kering berbagai bentuk menjadi gambar seekor ikan di kertas gambar.',
            question: 'Karya menempelkan daun kering atau biji-bijian pada pola gambar disebut karya ...',
            optionsFaseA: [{ key: 'A', text: 'Kolase' }, { key: 'B', text: 'Patung batu' }, { key: 'C', text: 'Nyanyian' }],
            optionsFaseBC: [{ key: 'A', text: 'Kolase' }, { key: 'B', text: 'Patung' }, { key: 'C', text: 'Pantomim' }, { key: 'D', text: 'Orkestra' }],
            correctAnswer: 'A',
            explanation: 'Kolase adalah karya seni rupa tempel menggunakan beragam bahan alam maupun kertas bekas.',
            cognitiveLevel: 'LOTS',
            topic: 'Karya Kolase Sederhana'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Saat menggambar pemandangan laut dan ombak yang tenang, Nisa membuat garis melengkung berulang.',
            question: 'Jenis garis yang tepat dipakai untuk menggambar bentuk awan, bukit, dan ombak adalah garis ...',
            optionsFaseA: [{ key: 'A', text: 'Garis lengkung' }, { key: 'B', text: 'Garis lurus patah-patah' }, { key: 'C', text: 'Garis kotak kaku' }],
            optionsFaseBC: [{ key: 'A', text: 'Garis lengkung' }, { key: 'B', text: 'Garis zig-zag tajam' }, { key: 'C', text: 'Garis vertikal kaku' }, { key: 'D', text: 'Garis sudut siku' }],
            correctAnswer: 'A',
            explanation: 'Garis lengkung memberi kesan luwes, lembut, dan cocok untuk menggambar awan, bukit, maupun ombak.',
            cognitiveLevel: 'LOTS',
            topic: 'Jenis Garis Menggambar'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Tari memukul rebana dan botol plastik berisi kerikil secara teratur mengiringi lagu anak di kelas.',
            question: 'Alat musik yang berfungsi mengatur ketukan atau irama lagu tanpa nada tinggi-rendah disebut alat musik ...',
            optionsFaseA: [{ key: 'A', text: 'Ritmis' }, { key: 'B', text: 'Lukisan' }, { key: 'C', text: 'Patung' }],
            optionsFaseBC: [{ key: 'A', text: 'Ritmis' }, { key: 'B', text: 'Melodis' }, { key: 'C', text: 'Harmonis bernada' }, { key: 'D', text: 'Kriya kayu' }],
            correctAnswer: 'A',
            explanation: 'Alat musik ritmis seperti rebana, marakas, dan gendang mengiringi tempo dan ketukan irama.',
            cognitiveLevel: 'LOTS',
            topic: 'Alat Musik Ritmis'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Kiki meremas dan membentuk plastisin lunak berwarna biru menjadi mainan boneka gajah kecil.',
            question: 'Karena terbuat dari bahan lunak dan dapat dilihat dari depan, samping, dan belakang, patung plastisin termasuk karya ... dimensi.',
            optionsFaseA: [{ key: 'A', text: 'Tiga (3)' }, { key: 'B', text: 'Satu (1)' }, { key: 'C', text: 'Setengah' }],
            optionsFaseBC: [{ key: 'A', text: 'Tiga (3) dimensi' }, { key: 'B', text: 'Dua (2) dimensi' }, { key: 'C', text: 'Satu (1) dimensi' }, { key: 'D', text: 'Datar' }],
            correctAnswer: 'A',
            explanation: 'Benda 3 dimensi memiliki panjang, lebar, tinggi, serta volume ruang.',
            cognitiveLevel: 'LOTS',
            topic: 'Karya 3 Dimensi Plastisin'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Citra menggambar sketsa bunga terlebih dahulu menggunakan pensil tipis sebelum menebalkannya memakai spidol warna.',
            question: 'Langkah menggambar awal berupa goresan tipis yang masih dapat dihapus disebut membuat ...',
            optionsFaseA: [{ key: 'A', text: 'Sketsa' }, { key: 'B', text: 'Pigura' }, { key: 'C', text: 'Katalis' }],
            optionsFaseBC: [{ key: 'A', text: 'Sketsa awal' }, { key: 'B', text: 'Bingkai kayu' }, { key: 'C', text: 'Pewarnaan akhir' }, { key: 'D', text: 'Pameran' }],
            correctAnswer: 'A',
            explanation: 'Sketsa adalah rancangan gambar kasar sebelum diberi garis tegas dan pewarnaan.',
            cognitiveLevel: 'LOTS',
            topic: 'Tahapan Menggambar Sketsa'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Dalam pementasan tari kelompok di panggung aula, penari bergerak membentuk barisan lingkaran yang rapi.',
            question: 'Garis imajiner atau denah perpindahan posisi penari di atas panggung tari disebut ...',
            optionsFaseA: [{ key: 'A', text: 'Pola lantai' }, { key: 'B', text: 'Tangga nada' }, { key: 'C', text: 'Warna primer' }],
            optionsFaseBC: [{ key: 'A', text: 'Pola lantai tari' }, { key: 'B', text: 'Garis paranada' }, { key: 'C', text: 'Komposisi warna' }, { key: 'D', text: 'Tekstur gambar' }],
            correctAnswer: 'A',
            explanation: 'Pola lantai mengatur posisi dan arah gerak penari agar pementasan tampak rapi dan dinamis.',
            cognitiveLevel: 'LOTS',
            topic: 'Pola Lantai Tari'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Galih membuat kerajinan celengan berbentuk kura-kura dari botol plastik bekas yang dicat warna cerah.',
            question: 'Memanfaatkan botol plastik bekas menjadi celengan hias bertujuan melatih kreativitas sekaligus ... sampah.',
            optionsFaseA: [{ key: 'A', text: 'Mendaur ulang' }, { key: 'B', text: 'Menumpuk' }, { key: 'C', text: 'Membakar' }],
            optionsFaseBC: [{ key: 'A', text: 'Mendaur ulang (recycle)' }, { key: 'B', text: 'Membuang ke sungai' }, { key: 'C', text: 'Menimbun di kebun' }, { key: 'D', text: 'Memperbanyak limbah' }],
            correctAnswer: 'A',
            explanation: 'Karya kriya berbahan limbah plastik mengurangi sampah sekaligus menghasilkan barang bermanfaat.',
            cognitiveLevel: 'MOTS',
            topic: 'Seni Kriya Daur Ulang'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Ketika menyanyikan lagu "Maju Tak Gentar", seluruh siswa bernyanyi dengan ketukan cepat, tegas, dan penuh semangat.',
            question: 'Cepat atau lambatnya ketukan ketik sebuah lagu dinyanyikan dalam seni musik disebut ...',
            optionsFaseA: [{ key: 'A', text: 'Tempo' }, { key: 'B', text: 'Lirik' }, { key: 'C', text: 'Tekstur' }],
            optionsFaseBC: [{ key: 'A', text: 'Tempo lagu' }, { key: 'B', text: 'Kostum pentas' }, { key: 'C', text: 'Sketsa gambar' }, { key: 'D', text: 'Garis tepi' }],
            correctAnswer: 'A',
            explanation: 'Tempo adalah ukuran kecepatan lagu saat dimainkan atau dinyanyikan.',
            cognitiveLevel: 'LOTS',
            topic: 'Unsur Tempo Musik'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Bila warna biru dicampurkan dengan warna kuning pada palet cat air, muncul warna baru yang menyerupai warna daun segar.',
            question: 'Warna sekunder yang dihasilkan dari pencampuran warna biru dan kuning adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Hijau' }, { key: 'B', text: 'Ungu' }, { key: 'C', text: 'Oranye' }],
            optionsFaseBC: [{ key: 'A', text: 'Hijau' }, { key: 'B', text: 'Ungu' }, { key: 'C', text: 'Jingga / Oranye' }, { key: 'D', text: 'Merah muda' }],
            correctAnswer: 'A',
            explanation: 'Biru + Kuning = Hijau; Merah + Kuning = Oranye; Merah + Biru = Ungu.',
            cognitiveLevel: 'LOTS',
            topic: 'Campuran Warna Hijau'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Pada sebuah pementasan teater sekolah, aktor memerankan tokoh kakek tua dengan riasan rambut memutih dan garis keriput di wajah.',
            question: 'Bagian tata artistik pementasan teater yang mengubah penampilan wajah tokoh agar sesuai usia dan wataknya adalah tata ...',
            optionsFaseA: [{ key: 'A', text: 'Rias wajah' }, { key: 'B', text: 'Suara' }, { key: 'C', text: 'Panggung' }],
            optionsFaseBC: [{ key: 'A', text: 'Tata rias (Make-up)' }, { key: 'B', text: 'Tata suara (Audio)' }, { key: 'C', text: 'Tata lampu' }, { key: 'D', text: 'Tata irama' }],
            correctAnswer: 'A',
            explanation: 'Tata rias membantu memperkuat karakter usia, sifat, dan ciri khas tokoh drama.',
            cognitiveLevel: 'LOTS',
            topic: 'Tata Rias Teater'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Dalam pameran seni rupa kelas enam, panitia menata hasil lukisan pada papan display setinggi pandangan mata pengunjung.',
            question: 'Tujuan utama penyelenggaraan pameran karya seni rupa siswa di sekolah adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Mengapresiasi karya siswa serta menumbuhkan rasa percaya diri berkarya' }, { key: 'B', text: 'Menyembunyikan karya agar tidak dilihat orang lain' }, { key: 'C', text: 'Mencari kelemahan teman untuk diejek' }],
            optionsFaseBC: [{ key: 'A', text: 'Wadah apresiasi karya seni siswa, berbagi inspirasi, dan melatih kepercayaan diri' }, { key: 'B', text: 'Membuang karya yang dianggap kurang bagus' }, { key: 'C', text: 'Menghalangi siswa lain ikut melukis' }, { key: 'D', text: 'Menilai kekayaan peserta pameran' }],
            correctAnswer: 'A',
            explanation: 'Pameran seni sekolah mengapresiasi kreativitas siswa dan menumbuhkan sikap menghargai karya.',
            cognitiveLevel: 'MOTS',
            topic: 'Apresiasi Pameran Seni'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Kesenian anyaman tradisional dari daerah Tasikmalaya dan daerah lain di Indonesia dibuat dengan teknik menyilang-nyilangkan bilah bambu atau pandan.',
            question: 'Kelebihan kerajinan anyaman bambu dibandingkan kantong plastik sekali pakai adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Kuat, bernilai seni tinggi, dan ramah lingkungan karena mudah terurai' }, { key: 'B', text: 'Mencemari tanah hingga ratusan tahun' }, { key: 'C', text: 'Hanya dapat dipakai satu detik saja' }],
            optionsFaseBC: [{ key: 'A', text: 'Lebih ramah lingkungan, kuat dipakai berulang, serta melestarikan kriya lokal' }, { key: 'B', text: 'Menimbulkan limbah plastik laut' }, { key: 'C', text: 'Tidak dapat menahan beban apa pun' }, { key: 'D', text: 'Merusak kesenian tradisional' }],
            correctAnswer: 'A',
            explanation: 'Anyaman bambu alami bersifat kuat, estetik, dapat dipakai berulang, dan ramah lingkungan.',
            cognitiveLevel: 'MOTS',
            topic: 'Kriya Anyaman Nusantara'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Saat menggambar ilustrasi cerita rakyat, pelukis memperhatikan perbandingan ukuran tubuh tokoh manusia dan bangunan rumah di latar belakang.',
            question: 'Prinsip kesesuaian perbandingan ukuran antarbagian objek dalam sebuah gambar agar tampak wajar disebut ...',
            optionsFaseA: [{ key: 'A', text: 'Proporsi' }, { key: 'B', text: 'Kontras warna' }, { key: 'C', text: 'Tekstur kasar' }],
            optionsFaseBC: [{ key: 'A', text: 'Proporsi' }, { key: 'B', text: 'Gradasi gelap' }, { key: 'C', text: 'Mozaik' }, { key: 'D', text: 'Stensil' }],
            correctAnswer: 'A',
            explanation: 'Proporsi menjaga keseimbangan ukuran antara objek utama dan objek pendukung dalam gambar.',
            cognitiveLevel: 'MOTS',
            topic: 'Prinsip Proporsi Gambar'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Musik gamelan Jawa dan Sunda menggunakan susunan nada tradisional lima nada per oktaf yang khas.',
            question: 'Sistem tangga nada tradisional yang hanya terdiri atas lima nada pokok (seperti pada gamelan pelog/slendro) disebut tangga nada ...',
            optionsFaseA: [{ key: 'A', text: 'Pentatonis' }, { key: 'B', text: 'Diatonis mayor' }, { key: 'C', text: 'Kromatis' }],
            optionsFaseBC: [{ key: 'A', text: 'Pentatonis' }, { key: 'B', text: 'Diatonis mayor' }, { key: 'C', text: 'Diatonis minor' }, { key: 'D', text: 'Atonal bebas' }],
            correctAnswer: 'A',
            explanation: 'Penta berarti lima; tangga nada pentatonis memiliki lima nada pokok dalam satu oktaf.',
            cognitiveLevel: 'MOTS',
            topic: 'Tangga Nada Pentatonis'
        }
    ],
    inggris: [
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Tim opens his pencil case. There are three blue pencils inside.',
            question: 'How many blue pencils does Tim have?',
            optionsFaseA: [{ key: 'A', text: 'Three' }, { key: 'B', text: 'Five' }, { key: 'C', text: 'Ten' }],
            optionsFaseBC: [{ key: 'A', text: 'Three' }, { key: 'B', text: 'Five' }, { key: 'C', text: 'Seven' }, { key: 'D', text: 'Nine' }],
            correctAnswer: 'A',
            explanation: 'The sentence says there are three blue pencils inside Tim\'s pencil case.',
            cognitiveLevel: 'LOTS',
            topic: 'Counting Classroom Objects'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Mia looks at the sunny sky and sees bright yellow light shining warmly.',
            question: 'What is the color of the bright sun and ripe bananas?',
            optionsFaseA: [{ key: 'A', text: 'Yellow' }, { key: 'B', text: 'Purple' }, { key: 'C', text: 'Black' }],
            optionsFaseBC: [{ key: 'A', text: 'Yellow' }, { key: 'B', text: 'Purple' }, { key: 'C', text: 'Black' }, { key: 'D', text: 'Gray' }],
            correctAnswer: 'A',
            explanation: 'Yellow is the English word for the color kuning.',
            cognitiveLevel: 'LOTS',
            topic: 'Basic Colors'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Leo says hello when meeting his classmates on Monday morning at the school gate.',
            question: 'What greeting should Leo say at 7:00 in the morning?',
            optionsFaseA: [{ key: 'A', text: 'Good morning, friends!' }, { key: 'B', text: 'Good night, friends!' }, { key: 'C', text: 'Good evening!' }],
            optionsFaseBC: [{ key: 'A', text: 'Good morning, friends!' }, { key: 'B', text: 'Good night, friends!' }, { key: 'C', text: 'Good evening, friends!' }, { key: 'D', text: 'See you next year!' }],
            correctAnswer: 'A',
            explanation: 'We greet people with "Good morning" from morning until noon.',
            cognitiveLevel: 'LOTS',
            topic: 'Morning Greetings'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Amy touches her nose, ears, and two hands while singing a body parts song.',
            question: 'Which body part do we use to look at picture books?',
            optionsFaseA: [{ key: 'A', text: 'Eyes' }, { key: 'B', text: 'Knees' }, { key: 'C', text: 'Shoulders' }],
            optionsFaseBC: [{ key: 'A', text: 'Eyes' }, { key: 'B', text: 'Toes' }, { key: 'C', text: 'Knees' }, { key: 'D', text: 'Ears' }],
            correctAnswer: 'A',
            explanation: 'We use our eyes to see and read picture books.',
            cognitiveLevel: 'LOTS',
            topic: 'Parts of the Body'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Look at the school map: The canteen is next to the library, and the garden is in front of the office.',
            question: 'Where is the school canteen located according to the text?',
            optionsFaseA: [{ key: 'A', text: 'Next to the library' }, { key: 'B', text: 'Behind the football field' }, { key: 'C', text: 'Inside the office' }],
            optionsFaseBC: [{ key: 'A', text: 'Next to the library' }, { key: 'B', text: 'Inside the classroom' }, { key: 'C', text: 'Far away from school' }, { key: 'D', text: 'Under the office' }],
            correctAnswer: 'A',
            explanation: 'The text clearly states the canteen is next to the library.',
            cognitiveLevel: 'LOTS',
            topic: 'School Locations'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Ryan is thirsty after playing soccer under the hot sun. He wants a cool drink.',
            question: 'Which healthy drink does Ryan need to refresh his body?',
            optionsFaseA: [{ key: 'A', text: 'A glass of clean water' }, { key: 'B', text: 'A bowl of hot chili soup' }, { key: 'C', text: 'A slice of dry bread' }],
            optionsFaseBC: [{ key: 'A', text: 'A glass of fresh water' }, { key: 'B', text: 'A plate of fried noodles' }, { key: 'C', text: 'A piece of cake' }, { key: 'D', text: 'A bowl of spicy chips' }],
            correctAnswer: 'A',
            explanation: 'Water quenches thirst and hydrates the body safely.',
            cognitiveLevel: 'LOTS',
            topic: 'Food and Drinks'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Look at the weather outside: Dark clouds cover the sky and water drops are falling fast.',
            question: 'What is the weather like outside today?',
            optionsFaseA: [{ key: 'A', text: 'It is rainy' }, { key: 'B', text: 'It is sunny and dry' }, { key: 'C', text: 'It is snowy' }],
            optionsFaseBC: [{ key: 'A', text: 'It is rainy' }, { key: 'B', text: 'It is bright and sunny' }, { key: 'C', text: 'It is hot desert weather' }, { key: 'D', text: 'It is freezing snow' }],
            correctAnswer: 'A',
            explanation: 'Dark clouds and falling raindrops describe rainy weather.',
            cognitiveLevel: 'LOTS',
            topic: 'Weather Conditions'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Chloe likes drawing landscapes. She uses crayons and paper every Saturday afternoon.',
            question: 'What is Chloe\'s favorite hobby?',
            optionsFaseA: [{ key: 'A', text: 'Drawing' }, { key: 'B', text: 'Swimming' }, { key: 'C', text: 'Cooking' }],
            optionsFaseBC: [{ key: 'A', text: 'Drawing' }, { key: 'B', text: 'Cycling' }, { key: 'C', text: 'Gardening' }, { key: 'D', text: 'Fishing' }],
            correctAnswer: 'A',
            explanation: 'Using crayons and paper to make landscapes refers to drawing.',
            cognitiveLevel: 'LOTS',
            topic: 'Hobbies'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Noah goes to school by riding his two-wheeled bicycle every morning.',
            question: 'Which transportation vehicle does Noah use to go to school?',
            optionsFaseA: [{ key: 'A', text: 'A bicycle' }, { key: 'B', text: 'An airplane' }, { key: 'C', text: 'A ship' }],
            optionsFaseBC: [{ key: 'A', text: 'A bicycle' }, { key: 'B', text: 'A train' }, { key: 'C', text: 'A helicopter' }, { key: 'D', text: 'A boat' }],
            correctAnswer: 'A',
            explanation: 'A bicycle is a two-wheeled human-powered vehicle.',
            cognitiveLevel: 'LOTS',
            topic: 'Transportation'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Read the sentence carefully: "Last week, Kevin and his family ... (visit) Borobudur Temple in Central Java."',
            question: 'What is the correct Simple Past Tense verb to complete the sentence?',
            optionsFaseA: [{ key: 'A', text: 'visited' }, { key: 'B', text: 'visiting' }, { key: 'C', text: 'visits' }],
            optionsFaseBC: [{ key: 'A', text: 'visited' }, { key: 'B', text: 'visit' }, { key: 'C', text: 'visiting' }, { key: 'D', text: 'will visit' }],
            correctAnswer: 'A',
            explanation: '"Last week" signals past time, so regular verb "visit" becomes "visited".',
            cognitiveLevel: 'MOTS',
            topic: 'Simple Past Regular Verbs'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'At a clothing store, Emma asks: "Excuse me, how much is this blue jacket?" The seller answers: "It is eighty-five thousand rupiahs."',
            question: 'How much does the blue jacket cost?',
            optionsFaseA: [{ key: 'A', text: 'Rp 85.000' }, { key: 'B', text: 'Rp 58.000' }, { key: 'C', text: 'Rp 80.500' }],
            optionsFaseBC: [{ key: 'A', text: 'Rp 85.000' }, { key: 'B', text: 'Rp 58.000' }, { key: 'C', text: 'Rp 850.000' }, { key: 'D', text: 'Rp 185.000' }],
            correctAnswer: 'A',
            explanation: 'Eighty-five thousand equals 85.000.',
            cognitiveLevel: 'LOTS',
            topic: 'Shopping and Prices'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Dan wants to borrow Adam\'s dictionary during English class because he forgot his at home.',
            question: 'What polite request sentence should Dan say to Adam?',
            optionsFaseA: [{ key: 'A', text: 'May I borrow your dictionary, please?' }, { key: 'B', text: 'Give me that book now!' }, { key: 'C', text: 'You cannot read your book!' }],
            optionsFaseBC: [{ key: 'A', text: 'May I borrow your dictionary, please?' }, { key: 'B', text: 'Give me your book right now!' }, { key: 'C', text: 'Throw the dictionary to me!' }, { key: 'D', text: 'Do not use that book!' }],
            correctAnswer: 'A',
            explanation: '"May I ..., please?" is a polite English expression to ask for permission.',
            cognitiveLevel: 'MOTS',
            topic: 'Polite Requests'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Read the short dialogue:\nKate: "What are you going to do next holiday?"\nMaya: "I am going to plant flowers in my garden."',
            question: 'What is Maya\'s plan for the next holiday?',
            optionsFaseA: [{ key: 'A', text: 'She plans to plant flowers in her garden' }, { key: 'B', text: 'She went to a mountain yesterday' }, { key: 'C', text: 'She is sleeping in class' }],
            optionsFaseBC: [{ key: 'A', text: 'She is going to plant flowers in her garden' }, { key: 'B', text: 'She is going to travel abroad alone' }, { key: 'C', text: 'She went swimming last Monday' }, { key: 'D', text: 'She wants to buy a new car' }],
            correctAnswer: 'A',
            explanation: 'Maya clearly states "I am going to plant flowers in my garden."',
            cognitiveLevel: 'LOTS',
            topic: 'Future Plans Going To'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'A giraffe is taller than a deer, while a blue whale is the ... sea animal on Earth.',
            question: 'Which superlative adjective best completes the blank?',
            optionsFaseA: [{ key: 'A', text: 'largest' }, { key: 'B', text: 'larger' }, { key: 'C', text: 'large' }],
            optionsFaseBC: [{ key: 'A', text: 'largest' }, { key: 'B', text: 'larger' }, { key: 'C', text: 'more large' }, { key: 'D', text: 'large' }],
            correctAnswer: 'A',
            explanation: '"The ... on Earth" compares one against all others, requiring the superlative "largest".',
            cognitiveLevel: 'MOTS',
            topic: 'Superlative Adjectives'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Look at the school notice: "THROW TRASH INTO THE BIN TO KEEP OUR SCHOOL CLEAN."',
            question: 'Why did the school display that notice near the schoolyard?',
            optionsFaseA: [{ key: 'A', text: 'To remind students to keep the school environment clean from litter' }, { key: 'B', text: 'To invite students to throw paper on the floor' }, { key: 'C', text: 'To close the schoolyard forever' }],
            optionsFaseBC: [{ key: 'A', text: 'To remind everyone to dispose of rubbish properly in the bin' }, { key: 'B', text: 'To ask students not to enter the school' }, { key: 'C', text: 'To sell new plastic bins' }, { key: 'D', text: 'To cancel all outdoor sports' }],
            correctAnswer: 'A',
            explanation: 'The notice instructs students to put garbage into trash bins for cleanliness.',
            cognitiveLevel: 'MOTS',
            topic: 'Understanding School Notices'
        }
    ],
    pai: [
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Nabi Muhammad saw. selalu berkata benar sejak kecil sehingga penduduk Makkah memberinya gelar Al-Amin.',
            question: 'Arti gelar terpuji Al-Amin yang diberikan kepada Nabi Muhammad saw. adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Dapat dipercaya' }, { key: 'B', text: 'Suka marah' }, { key: 'C', text: 'Pemalu' }],
            optionsFaseBC: [{ key: 'A', text: 'Orang yang dapat dipercaya' }, { key: 'B', text: 'Paling kaya raya' }, { key: 'C', text: 'Suka menunda tugas' }, { key: 'D', text: 'Penakut' }],
            correctAnswer: 'A',
            explanation: 'Al-Amin berarti jujur dan sangat dapat dipercaya oleh masyarakat.',
            cognitiveLevel: 'LOTS',
            topic: 'Gelar Nabi Al-Amin'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Sebelum belajar membaca Al-Qur\'an, anak-anak mengenal huruf hijaiyah pertama seperti Alif, Ba, Ta, Tsa.',
            question: 'Jumlah seluruh huruf hijaiyah dasar yang menjadi dasar membaca Al-Qur\'an dimulai dengan huruf ...',
            optionsFaseA: [{ key: 'A', text: 'Alif' }, { key: 'B', text: 'Zai' }, { key: 'C', text: 'Ya' }],
            optionsFaseBC: [{ key: 'A', text: 'Alif' }, { key: 'B', text: 'Mim' }, { key: 'C', text: 'Nun' }, { key: 'D', text: 'Wau' }],
            correctAnswer: 'A',
            explanation: 'Huruf hijaiyah diawali dari Alif (ا) dan diakhiri huruf Ya (ي).',
            cognitiveLevel: 'LOTS',
            topic: 'Mengenal Huruf Hijaiyah'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Ketika menerima hadiah buku cerita dari paman, Tari mengucapkan kalimat pujian syukur kepada Allah Swt.',
            question: 'Kalimat tayyibah yang diucapkan saat bersyukur mendapat nikmat adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Alhamdulillah' }, { key: 'B', text: 'Bismillah' }, { key: 'C', text: 'Astaghfirullah' }],
            optionsFaseBC: [{ key: 'A', text: 'Alhamdulillahi rabbil alamin' }, { key: 'B', text: 'Bismillahirrahmanirrahim' }, { key: 'C', text: 'Astaghfirullahal azim' }, { key: 'D', text: 'Inna lillahi' }],
            correctAnswer: 'A',
            explanation: 'Alhamdulillah (segala puji bagi Allah) diucapkan sebagai ungkapan syukur atas nikmat.',
            cognitiveLevel: 'LOTS',
            topic: 'Kalimat Syukur Hamdalah'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Rukun Islam merupakan lima tiang ibadah utama yang wajib dipahami umat Islam.',
            question: 'Rukun Islam yang pertama kali diucapkan saat seseorang menyatakan keislamannya adalah membaca ...',
            optionsFaseA: [{ key: 'A', text: 'Dua kalimat syahadat' }, { key: 'B', text: 'Membayar zakat mal' }, { key: 'C', text: 'Berangkat haji ke Makkah' }],
            optionsFaseBC: [{ key: 'A', text: 'Dua kalimat syahadat' }, { key: 'B', text: 'Salat lima waktu' }, { key: 'C', text: 'Puasa Ramadan' }, { key: 'D', text: 'Ibadah haji' }],
            correctAnswer: 'A',
            explanation: 'Rukun Islam ke-1 adalah membaca dua kalimat syahadat.',
            cognitiveLevel: 'LOTS',
            topic: 'Dua Kalimat Syahadat'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Salah satu Asmaulhusna Allah Swt. adalah Al-Malik yang berarti Allah Maha Merajai alam semesta.',
            question: 'Sikap anak muslim yang meneladani sifat Al-Malik dalam menjaga diri adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Mengendalikan diri agar tidak marah dan berbuat baik' }, { key: 'B', text: 'Bersikap sombong menguasai barang teman' }, { key: 'C', text: 'Merusak tanaman di taman sekolah' }],
            optionsFaseBC: [{ key: 'A', text: 'Mampu mengendalikan emosi diri dan tidak berbuat seenaknya' }, { key: 'B', text: 'Memerintah teman secara kasar' }, { key: 'C', text: 'Mengambil mainan adik paksa' }, { key: 'D', text: 'Bersikap angkuh di kelas' }],
            correctAnswer: 'A',
            explanation: 'Meneladani Al-Malik berarti mampu menguasai diri sendiri dari amarah dan perbuatan tercela.',
            cognitiveLevel: 'MOTS',
            topic: 'Asmaulhusna Al-Malik'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Pada peristiwa hijrah, Nabi Muhammad saw. menumbuhkan persaudaraan erat antara kaum Muhajirin dari Makkah dan kaum Ansar di Madinah.',
            question: 'Sebutan bagi penduduk asli Kota Madinah yang menyambut serta menolong Nabi dan para sahabatnya disebut kaum ...',
            optionsFaseA: [{ key: 'A', text: 'Ansar' }, { key: 'B', text: 'Muhajirin' }, { key: 'C', text: 'Quraisy' }],
            optionsFaseBC: [{ key: 'A', text: 'Ansar' }, { key: 'B', text: 'Muhajirin' }, { key: 'C', text: 'Badui' }, { key: 'D', text: 'Khazraj saja' }],
            correctAnswer: 'A',
            explanation: 'Kaum Ansar berarti para penolong, yakni penduduk Madinah yang menolong kaum Muhajirin.',
            cognitiveLevel: 'LOTS',
            topic: 'Kaum Muhajirin dan Ansar'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Membaca basmalah, membasuh wajah, dan membasuh kedua tangan termasuk bagian dari rukun berwudu.',
            question: 'Salah satu hal yang membatalkan kesucian wudu seseorang sebelum mendirikan salat adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Keluar sesuatu dari qubul atau dubur (buang angin/air)' }, { key: 'B', text: 'Minum segelas air putih bersih' }, { key: 'C', text: 'Memakai baju koko bersih' }],
            optionsFaseBC: [{ key: 'A', text: 'Buang angin, buang air kecil/besar, atau tidur nyenyak' }, { key: 'B', text: 'Berjalan menuju masjid' }, { key: 'C', text: 'Membaca doa setelah wudu' }, { key: 'D', text: 'Menjawab salam teman' }],
            correctAnswer: 'A',
            explanation: 'Hadas kecil seperti buang angin atau buang air membatalkan wudu.',
            cognitiveLevel: 'MOTS',
            topic: 'Hal Membatalkan Wudu'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Setiap rasul Allah memiliki empat sifat wajib, yakni Siddiq, Amanah, Tabligh, dan Fatanah.',
            question: 'Sifat wajib rasul yang berarti "cerdas atau bijaksana" dalam membimbing umat adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Fatanah' }, { key: 'B', text: 'Siddiq' }, { key: 'C', text: 'Amanah' }],
            optionsFaseBC: [{ key: 'A', text: 'Fatanah' }, { key: 'B', text: 'Siddiq' }, { key: 'C', text: 'Amanah' }, { key: 'D', text: 'Tabligh' }],
            correctAnswer: 'A',
            explanation: 'Siddiq=jujur, Amanah=dapat dipercaya, Tabligh=menyampaikan wahyu, Fatanah=cerdas.',
            cognitiveLevel: 'LOTS',
            topic: 'Sifat Wajib Rasul'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Allah Swt. menurunkan kitab suci kepada rasul-rasul pilihan sebagai pedoman hidup manusia, termasuk Kitab Taurat dan Injil.',
            question: 'Kitab suci yang diturunkan Allah Swt. kepada Nabi Daud a.s. berisi nyanyian pujian adalah Kitab ...',
            optionsFaseA: [{ key: 'A', text: 'Zabur' }, { key: 'B', text: 'Taurat' }, { key: 'C', text: 'Injil' }],
            optionsFaseBC: [{ key: 'A', text: 'Kitab Zabur' }, { key: 'B', text: 'Kitab Taurat' }, { key: 'C', text: 'Kitab Injil' }, { key: 'D', text: 'Suhuf Ibrahim' }],
            correctAnswer: 'A',
            explanation: 'Empat kitab Allah: Taurat (Musa), Zabur (Daud), Injil (Isa), Al-Qur\'an (Muhammad saw.).',
            cognitiveLevel: 'LOTS',
            topic: 'Iman kepada Kitab Allah'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Pada waktu bulan Ramadan tiba, umat Islam dianjurkan melaksanakan salat sunah malam hari secara berjemaah setelah salat Isya.',
            question: 'Salat sunah khusus yang hanya dilaksanakan pada malam hari di bulan suci Ramadan adalah salat ...',
            optionsFaseA: [{ key: 'A', text: 'Tarawih' }, { key: 'B', text: 'Idulfitri' }, { key: 'C', text: 'Duha' }],
            optionsFaseBC: [{ key: 'A', text: 'Salat Tarawih' }, { key: 'B', text: 'Salat Iduladha' }, { key: 'C', text: 'Salat Istikharah' }, { key: 'D', text: 'Salat Tahiyatul Masjid' }],
            correctAnswer: 'A',
            explanation: 'Salat Tarawih adalah amalan sunah khas malam-malam bulan Ramadan.',
            cognitiveLevel: 'LOTS',
            topic: 'Amalan Bulan Ramadan'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Dalam Surah Al-Ma\'un, Allah mengingatkan ciri orang yang mendustakan agama adalah menghardik anak yatim dan enggan membantu fakir miskin.',
            question: 'Sikap nyata seorang siswa yang mengamalkan pesan Surah Al-Ma\'un di lingkungan sekitarnya adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Menyantuni anak yatim dan suka bersedekah kepada warga kurang mampu' }, { key: 'B', text: 'Salat dengan terburu-buru agar dipuji teman' }, { key: 'C', text: 'Menyimpan seluruh makanan tanpa peduli tetangga kelaparan' }],
            optionsFaseBC: [{ key: 'A', text: 'Peduli, ramah, serta ikhlas menyantuni anak yatim dan fakir miskin' }, { key: 'B', text: 'Beribadah hanya agar dilihat orang lain (ria)' }, { key: 'C', text: 'Menghindari teman yang berasal dari keluarga sederhana' }, { key: 'D', text: 'Menimbun barang keperluan pokok' }],
            correctAnswer: 'A',
            explanation: 'Surah Al-Ma\'un menekankan kepedulian sosial terhadap anak yatim, kaum miskin, dan menjauhi sifat ria.',
            cognitiveLevel: 'MOTS',
            topic: 'Kandungan Surah Al-Maun'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Setelah menunaikan ibadah puasa sebulan penuh pada bulan Ramadan, umat Islam merayakan hari kemenangan pada tanggal 1 Syawal.',
            question: 'Hukum mengeluarkan zakat fitrah bagi setiap muslim yang mampu sebelum salat Idulfitri adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Wajib (Fardu \'Ain)' }, { key: 'B', text: 'Mubah (Boleh tidak)' }, { key: 'C', text: 'Makruh' }],
            optionsFaseBC: [{ key: 'A', text: 'Wajib bagi setiap jiwa muslim yang memenuhi syarat' }, { key: 'B', text: 'Sunah muakad saja' }, { key: 'C', text: 'Mubah bagi anak-anak' }, { key: 'D', text: 'Tidak dianjurkan' }],
            correctAnswer: 'A',
            explanation: 'Zakat fitrah wajib ditunaikan setiap muslim guna menyucikan jiwa dan membantu fakir miskin berlebaran.',
            cognitiveLevel: 'LOTS',
            topic: 'Hukum Zakat Fitrah'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Allah Swt. memiliki sifat As-Samad yang berarti Maha Dibutuhkan oleh seluruh makhluk ciptaan-Nya.',
            question: 'Pengamalan keimanan terhadap sifat Allah As-Samad dalam kehidupan sehari-hari adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Berdoa memohon pertolongan hanya kepada Allah dan siap membantu teman' }, { key: 'B', text: 'Mempercayai ramalan benda keramat selain Allah' }, { key: 'C', text: 'Berputus asa ketika menghadapi kesulitan belajar' }],
            optionsFaseBC: [{ key: 'A', text: 'Menggantungkan harapan hanya kepada Allah Swt. serta ringan tangan menolong sesama' }, { key: 'B', text: 'Meminta bantuan dukun saat mengalami masalah' }, { key: 'C', text: 'Menolak bekerja sama karena merasa tidak butuh orang lain' }, { key: 'D', text: 'Menyerah sebelum berusaha' }],
            correctAnswer: 'A',
            explanation: 'As-Samad menegaskan hanya Allah tempat bergantung dan meminta pertolongan, serta mendorong kita bermanfaat bagi sesama.',
            cognitiveLevel: 'MOTS',
            topic: 'Asmaulhusna As-Samad'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Sahabat Nabi Muhammad saw. yang dijuluki As-Siddiq karena langsung membenarkan peristiwa Isra Mikraj tanpa ragu adalah khalifah pertama.',
            question: 'Nama sahabat mulia yang menjadi khalifah pertama sepeninggal Rasulullah saw. adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Abu Bakar As-Siddiq' }, { key: 'B', text: 'Umar bin Khattab' }, { key: 'C', text: 'Usman bin Affan' }],
            optionsFaseBC: [{ key: 'A', text: 'Abu Bakar As-Siddiq r.a.' }, { key: 'B', text: 'Umar bin Khattab r.a.' }, { key: 'C', text: 'Usman bin Affan r.a.' }, { key: 'D', text: 'Ali bin Abi Talib r.a.' }],
            correctAnswer: 'A',
            explanation: 'Khulafaurasyidin secara urut: Abu Bakar As-Siddiq, Umar bin Khattab, Usman bin Affan, Ali bin Abi Talib.',
            cognitiveLevel: 'LOTS',
            topic: 'Kisah Khulafaurasyidin'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Di sekolah, kelas mengadakan program infak Jumat sukarela untuk membantu pembangunan musala dan siswa kurang mampu.',
            question: 'Perbedaan utama antara infak/sedekah dengan zakat fitrah adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Infak bersifat sukarela tanpa batasan waktu dan jumlah, sedangkan zakat fitrah wajib dan ditentukan takarannya' }, { key: 'B', text: 'Infak hanya boleh dibayarkan dengan beras 2,5 kg' }, { key: 'C', text: 'Zakat fitrah tidak wajib bagi orang dewasa' }],
            optionsFaseBC: [{ key: 'A', text: 'Infak dan sedekah dapat diberikan kapan saja sesuai keikhlasan, sedangkan zakat wajib dengan syarat nisab/takarannya' }, { key: 'B', text: 'Sedekah hukumnya wajib setiap bulan Ramadan saja' }, { key: 'C', text: 'Zakat fitrah hanya untuk keluarga kaya' }, { key: 'D', text: 'Infak hanya berupa makanan pokok' }],
            correctAnswer: 'A',
            explanation: 'Zakat memiliki ketentuan waktu, kadar, dan mustahik wajib, sedangkan infak/sedekah lebih fleksibel kapan saja.',
            cognitiveLevel: 'HOTS',
            topic: 'Zakat, Infak, dan Sedekah'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Dalam Islam, meyakini bahwa seluruh makhluk hidup suatu saat akan mengalami kematian dan dibangkitkan kembali pada hari akhir merupakan rukun iman.',
            question: 'Keyakinan akan datangnya Hari Kiamat (Hari Akhir) mendorong seorang pelajar bersikap ...',
            optionsFaseA: [{ key: 'A', text: 'Rajin beramal saleh, jujur, dan menjauhi perbuatan curang' }, { key: 'B', text: 'Malas belajar karena menganggap semuanya percuma' }, { key: 'C', text: 'Berbuat sesuka hati tanpa memikirkan akibatnya' }],
            optionsFaseBC: [{ key: 'A', text: 'Berhati-hati dalam bertindak, tekun beribadah, jujur, dan giat berbuat kebaikan' }, { key: 'B', text: 'Menunda kewajiban belajar dan salat' }, { key: 'C', text: 'Hanya memikirkan kesenangan sesaat' }, { key: 'D', text: 'Merugikan teman sekelas' }],
            correctAnswer: 'A',
            explanation: 'Iman kepada Hari Akhir menumbuhkan kesadaran bahwa setiap amal akan dipertanggungjawabkan di hadapan Allah.',
            cognitiveLevel: 'MOTS',
            topic: 'Hikmah Iman Hari Akhir'
        }
    ],
    koding: [
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Untuk menggambar sebuah lingkaran merah di aplikasi Paint komputer, Dito menggeser alat penunjuk layar.',
            question: 'Perangkat keras genggam yang digeser di atas meja untuk menggerakkan kursor di layar komputer adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Mouse (Tetikus)' }, { key: 'B', text: 'Monitor' }, { key: 'C', text: 'Printer' }],
            optionsFaseBC: [{ key: 'A', text: 'Mouse' }, { key: 'B', text: 'Monitor' }, { key: 'C', text: 'Speaker' }, { key: 'D', text: 'Scanner' }],
            correctAnswer: 'A',
            explanation: 'Mouse digunakan untuk mengarahkan pointer/kursor serta memilih objek di layar.',
            cognitiveLevel: 'LOTS',
            topic: 'Perangkat Input Mouse'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Tari mengikuti urutan langkah memakai sepatu: 1) Pakai kaus kaki, 2) Masukkan kaki ke sepatu, 3) Ikat tali sepatu.',
            question: 'Apa yang terjadi jika langkah ke-3 (mengikat tali sepatu) dilakukan sebelum memasukkan kaki ke sepatu?',
            optionsFaseA: [{ key: 'A', text: 'Kaki tidak bisa masuk ke dalam sepatu karena talinya sudah terikat' }, { key: 'B', text: 'Sepatu menjadi lebih mengilap' }, { key: 'C', text: 'Kaus kaki berubah warna' }],
            optionsFaseBC: [{ key: 'A', text: 'Langkah tidak berhasil karena urutannya keliru' }, { key: 'B', text: 'Sepatu menjadi lebih besar otomatis' }, { key: 'C', text: 'Kaki terasa lebih cepat berlari' }, { key: 'D', text: 'Tali sepatu hilang' }],
            correctAnswer: 'A',
            explanation: 'Dalam algoritma, urutan langkah harus logis dan benar agar tujuan tercapai.',
            cognitiveLevel: 'MOTS',
            topic: 'Urutan Algoritma Logis'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Mila mendengarkan lagu anak dari video pembelajaran di komputer menggunakan alat pengeras suara.',
            question: 'Perangkat keluaran komputer yang berfungsi menghasilkan suara agar terdengar ke telinga kita adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Speaker' }, { key: 'B', text: 'Keyboard' }, { key: 'C', text: 'Kamera' }],
            optionsFaseBC: [{ key: 'A', text: 'Speaker' }, { key: 'B', text: 'Keyboard' }, { key: 'C', text: 'Mouse' }, { key: 'D', text: 'Joystick' }],
            correctAnswer: 'A',
            explanation: 'Speaker adalah perangkat output suara pada komputer atau laptop.',
            cognitiveLevel: 'LOTS',
            topic: 'Perangkat Output Speaker'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Di kelas informatika, Kiki melihat lampu lalu lintas menyala bergantian: Merah - Kuning - Hijau - Merah - Kuning.',
            question: 'Warna lampu lalu lintas selanjutnya yang muncul setelah Kuning pada urutan kedua tersebut adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Hijau' }, { key: 'B', text: 'Biru' }, { key: 'C', text: 'Merah muda' }],
            optionsFaseBC: [{ key: 'A', text: 'Hijau' }, { key: 'B', text: 'Ungu' }, { key: 'C', text: 'Hitam' }, { key: 'D', text: 'Cokelat' }],
            correctAnswer: 'A',
            explanation: 'Pola berulang lampu lalu lintas adalah Merah -> Kuning -> Hijau.',
            cognitiveLevel: 'LOTS',
            topic: 'Pola Berulang Sehari-hari'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Rafi menekan tombol anak panah atas pada permainan labirin robot agar robot berjalan naik menuju bendera.',
            question: 'Agar robot bergerak maju sebanyak 3 petak, perintah tombol panah maju harus diberikan sebanyak ... kali.',
            optionsFaseA: [{ key: 'A', text: '3 kali' }, { key: 'B', text: '1 kali' }, { key: 'C', text: '10 kali' }],
            optionsFaseBC: [{ key: 'A', text: '3 kali langkah maju' }, { key: 'B', text: '1 kali langkah mundur' }, { key: 'C', text: '0 kali' }, { key: 'D', text: '5 kali belok kiri' }],
            correctAnswer: 'A',
            explanation: 'Setiap 1 blok perintah maju memindahkan robot tepat 1 petak.',
            cognitiveLevel: 'LOTS',
            topic: 'Navigasi Grid Robot'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Ibu guru mengingatkan siswa agar layar tablet ditarik ke atas dengan jari pelan-pelan dan tidak dipukul.',
            question: 'Cara merawat perangkat tablet atau komputer sekolah agar tidak cepat rusak adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Menyentuh layar dengan tangan bersih dan meletakkannya di tempat aman' }, { key: 'B', text: 'Menekan layar keras-keras memakai pensil tajam' }, { key: 'C', text: 'Menaruh makanan berminyak di atas keyboard' }],
            optionsFaseBC: [{ key: 'A', text: 'Menjaga kebersihan tangan, menekan tombol lembut, dan mematikan perangkat dengan benar' }, { key: 'B', text: 'Menarik kabel listrik secara paksa' }, { key: 'C', text: 'Mencoret monitor dengan spidol' }, { key: 'D', text: 'Menumpuk buku berat di atas laptop' }],
            correctAnswer: 'A',
            explanation: 'Tangan bersih dan perlakuan hati-hati menjaga layar sentuh serta perangkat keras awet.',
            cognitiveLevel: 'LOTS',
            topic: 'Merawat Perangkat Digital'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Perhatikan diagram alir (flowchart) pengambilan keputusan di gerbang sekolah: JIKA memakai topi upacara MAKA masuk barisan; JIKA TIDAK MAKA ambil topi dulu.',
            question: 'Bentuk simbol bangun datar pada diagram alir (flowchart) yang dipakai untuk menyatakan percabangan keputusan YA/TIDAK adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Belah ketupat (Diamond)' }, { key: 'B', text: 'Lingkaran kecil' }, { key: 'C', text: 'Garis lurus panjang' }],
            optionsFaseBC: [{ key: 'A', text: 'Belah ketupat (Diamond)' }, { key: 'B', text: 'Persegi panjang sudut lancip' }, { key: 'C', text: 'Segitiga sama kaki' }, { key: 'D', text: 'Bintang segi lima' }],
            correctAnswer: 'A',
            explanation: 'Dalam flowchart standar, belah ketupat melambangkan keputusan (decision) berkondisi Ya/Tidak.',
            cognitiveLevel: 'MOTS',
            topic: 'Simbol Flowchart Keputusan'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Pada program Scratch, Citra ingin karakter kucing berjalan 10 langkah sebanyak 5 kali berturut-turut tanpa menumpuk 5 blok sama.',
            question: 'Blok kendali yang tepat digunakan Citra agar kode program jauh lebih ringkas dan efisien adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Blok Repeat / Ulangi 5 kali' }, { key: 'B', text: 'Blok Hapus Semua Suara' }, { key: 'C', text: 'Blok Berhenti Total' }],
            optionsFaseBC: [{ key: 'A', text: 'Blok Repeat (Perulangan)' }, { key: 'B', text: 'Blok Hentikan Program' }, { key: 'C', text: 'Blok Ganti Latar Belakang' }, { key: 'D', text: 'Blok Matikan Suara' }],
            correctAnswer: 'A',
            explanation: 'Blok Repeat (Loop) meringkas instruksi yang berulang beberapa kali secara otomatis.',
            cognitiveLevel: 'MOTS',
            topic: 'Efisiensi Loop Program'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Aplikasi penerjemah di ponsel mampu menerjemahkan kalimat Bahasa Indonesia menjadi Bahasa Inggris dalam hitungan detik.',
            question: 'Contoh aplikasi penerjemah bahasa instan tersebut merupakan pemanfaatan bidang Kecerdasan Artifisial dalam mengolah ...',
            optionsFaseA: [{ key: 'A', text: 'Bahasa dan teks manusia' }, { key: 'B', text: 'Gelombang gempa bumi' }, { key: 'C', text: 'Logam berat tambang' }],
            optionsFaseBC: [{ key: 'A', text: 'Pemrosesan bahasa alami dan teks manusia' }, { key: 'B', text: 'Pengolahan limbah plastik' }, { key: 'C', text: 'Pembuatan semen bangunan' }, { key: 'D', text: 'Penanaman bibit padi' }],
            correctAnswer: 'A',
            explanation: 'Natural Language Processing (NLP) memungkinkan AI memahami dan menerjemahkan bahasa manusia.',
            cognitiveLevel: 'MOTS',
            topic: 'Aplikasi AI Penerjemah'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Ketika membuat tugas makalah bergambar bersama kelompok, Nadia menyimpan salinan file ke folder beraturan berdasarkan tanggal.',
            question: 'Manfaat memberi nama file dan menata folder dengan rapi di komputer adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Memudahkan pencarian dokumen kembali saat dibutuhkan nanti' }, { key: 'B', text: 'Menghapus file tugas secara otomatis' }, { key: 'C', text: 'Membuat layar komputer selalu mati' }],
            optionsFaseBC: [{ key: 'A', text: 'Dokumen cepat ditemukan kembali dan terhindar dari tertumpuk acak' }, { key: 'B', text: 'Membuat komputer tidak terhubung listrik' }, { key: 'C', text: 'Mengubah ukuran kertas printer' }, { key: 'D', text: 'Menghilangkan gambar dalam tugas' }],
            correctAnswer: 'A',
            explanation: 'Penamaan file yang jelas dan pengelompokan folder meningkatkan kerapian serta efisiensi kerja digital.',
            cognitiveLevel: 'LOTS',
            topic: 'Manajemen File dan Folder'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Saat menguji program permainan lompat rintangan yang dibuatnya, Galih menyadari karakter tidak melompat meski tombol panah atas ditekan.',
            question: 'Tindakan memeriksa kembali tiap blok kode untuk mencari penyebab kesalahan gerak karakter tersebut dinamakan ...',
            optionsFaseA: [{ key: 'A', text: 'Debugging' }, { key: 'B', text: 'Uploading' }, { key: 'C', text: 'Printing' }],
            optionsFaseBC: [{ key: 'A', text: 'Debugging (pelacakan dan perbaikan bug)' }, { key: 'B', text: 'Downloading video' }, { key: 'C', text: 'Formatting disk' }, { key: 'D', text: 'Screenshotting' }],
            correctAnswer: 'A',
            explanation: 'Debugging adalah proses menemukan dan memperbaiki galat (bug) agar program berjalan sesuai rencana.',
            cognitiveLevel: 'MOTS',
            topic: 'Praktik Debugging'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Untuk menghemat baterai ponsel saat tidak dipakai lama, layar dimatikan. Namun saat dipakai bermain, kecerahan layar disesuaikan.',
            question: 'Sikap bijak dalam menggunakan gawai atau komputer agar kesehatan mata dan kebugaran tubuh anak tetap terjaga adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Membatasi durasi waktu layar (screen time) dan beristirahat melihat objek jauh' }, { key: 'B', text: 'Menatap layar tablet sepanjang malam di kamar gelap' }, { key: 'C', text: 'Mendekatkan wajah sangat rapat ke layar monitor' }],
            optionsFaseBC: [{ key: 'A', text: 'Mengatur batas waktu pemakaian gawai, pencahayaan cukup, dan beristirahat teratur' }, { key: 'B', text: 'Bermain gim nonstop selama delapan jam' }, { key: 'C', text: 'Menonton video di ruang gelap gulita' }, { key: 'D', text: 'Tidak pernah tidur malam demi bermain ponsel' }],
            correctAnswer: 'A',
            explanation: 'Keseimbangan waktu layar dan istirahat mata mencegah kelelahan mata dan menjaga kebugaran.',
            cognitiveLevel: 'MOTS',
            topic: 'Kesehatan Penggunaan Gawai'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Sebuah sistem kamera pintu pintar dilatih dengan 500 foto wajah untuk mengenali penghuni rumah.',
            question: 'Kumpulan ribuan contoh foto atau data teks yang dipakai untuk melatih model Kecerdasan Artifisial disebut ...',
            optionsFaseA: [{ key: 'A', text: 'Dataset (Data Latih)' }, { key: 'B', text: 'Kabel daya' }, { key: 'C', text: 'Kertas foto' }],
            optionsFaseBC: [{ key: 'A', text: 'Dataset / Data latih (Training Data)' }, { key: 'B', text: 'Kabel jaringan' }, { key: 'C', text: 'Printer laser' }, { key: 'D', text: 'Kipas pendingin' }],
            correctAnswer: 'A',
            explanation: 'Model AI mempelajari pola fitur dari dataset latih sebelum membuat prediksi pada data baru.',
            cognitiveLevel: 'MOTS',
            topic: 'Konsep Dataset AI'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Di dalam sistem bilangan biner komputer, setiap digit hanya mengenal dua nilai, yaitu 0 (mati/OFF) dan 1 (nyala/ON).',
            question: 'Nilai bilangan desimal yang setara dengan angka biner sederhana "101" (1×4 + 0×2 + 1×1) adalah ...',
            optionsFaseA: [{ key: 'A', text: '5' }, { key: 'B', text: '3' }, { key: 'C', text: '7' }],
            optionsFaseBC: [{ key: 'A', text: '5' }, { key: 'B', text: '3' }, { key: 'C', text: '6' }, { key: 'D', text: '9' }],
            correctAnswer: 'A',
            explanation: 'Konversi biner 101 ke desimal = (1×2²) + (0×2¹) + (1×2⁰) = 4 + 0 + 1 = 5.',
            cognitiveLevel: 'HOTS',
            topic: 'Konversi Biner Sederhana'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Saat menerima pesan berantai di grup obrolan tentang hadiah undian gratis yang meminta nomor rekening dan kode OTP rahasia.',
            question: 'Tindakan paling tepat dan aman menghadapi pesan mencurigakan yang meminta kode OTP pribadi adalah ...',
            optionsFaseA: [{ key: 'A', text: 'Mengabaikan pesan, tidak mengklik tautan, serta melapor kepada orang tua' }, { key: 'B', text: 'Segera mengirimkan kode OTP demi mendapat hadiah' }, { key: 'C', text: 'Meneruskan pesan tersebut ke seluruh teman sekolah' }],
            optionsFaseBC: [{ key: 'A', text: 'Menolak membagikan kode OTP, tidak menekan tautan asing, dan melapor pada orang tua' }, { key: 'B', text: 'Membagikan kata sandi dan OTP dengan cepat' }, { key: 'C', text: 'Menyebarkan tautan hadiah ke grup kelas' }, { key: 'D', text: 'Mengisi data alamat lengkap rumah di formulir asing' }],
            correctAnswer: 'A',
            explanation: 'Kode OTP dan sandi bersifat sangat rahasia; pesan hadiah berantai adalah modus penipuan phishing.',
            cognitiveLevel: 'HOTS',
            topic: 'Waspada Penipuan Phishing'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Ketika menggunakan alat bantu AI generatif untuk membantu mencari ide karangan cerita anak, Ilham menuliskan deskripsi latar, tokoh, dan gaya bahasa.',
            question: 'Agar AI generatif menghasilkan jawaban paling sesuai keinginan pengguna, instruksi (prompt) harus disusun secara ...',
            optionsFaseA: [{ key: 'A', text: 'Jelas, spesifik, dan menyebutkan konteks serta batasan yang diinginkan' }, { key: 'B', text: 'Hanya mengetik satu huruf acak saja' }, { key: 'C', text: 'Mengandung data rahasia KTP dan alamat rumah pribadi' }],
            optionsFaseBC: [{ key: 'A', text: 'Spesifik, jelas, mencantumkan konteks, audiens, serta format hasil yang diharapkan' }, { key: 'B', text: 'Memasukkan kata sandi akun bank keluarga' }, { key: 'C', text: 'Satu kata sangat kabur tanpa keterangan' }, { key: 'D', text: 'Menyalin jawaban mentah tanpa memeriksa kebenarannya' }],
            correctAnswer: 'A',
            explanation: 'Prompt engineering yang jelas dan berbatas konteks menghasilkan keluaran AI yang akurat dan relevan.',
            cognitiveLevel: 'MOTS',
            topic: 'Menyusun Prompt AI Efektif'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Dalam permainan kuis interaktif buatan siswa, variabel "skor" bernilai awal 0 dan bertambah +10 setiap kali pemain menjawab benar.',
            question: 'Apabila seorang pemain menjawab benar sebanyak 4 soal berturut-turut, nilai akhir variabel "skor" sekarang adalah ...',
            optionsFaseA: [{ key: 'A', text: '40' }, { key: 'B', text: '14' }, { key: 'C', text: '10' }],
            optionsFaseBC: [{ key: 'A', text: '40' }, { key: 'B', text: '14' }, { key: 'C', text: '20' }, { key: 'D', text: '400' }],
            correctAnswer: 'A',
            explanation: 'Skor awal 0 + (4 × 10) = 40.',
            cognitiveLevel: 'MOTS',
            topic: 'Logika Variabel Skor'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Lampu taman otomatis di sekolah akan menyala sendiri saat malam tiba dan mati ketika matahari terbit pagi hari.',
            question: 'Komponen utama pada sistem taman pintar yang mendeteksi gelap atau terangnya cahaya lingkungan adalah sensor ...',
            optionsFaseA: [{ key: 'A', text: 'Cahaya (LDR)' }, { key: 'B', text: 'Kelembaban tanah' }, { key: 'C', text: 'Detak jantung' }],
            optionsFaseBC: [{ key: 'A', text: 'Sensor cahaya (Light Sensor / LDR)' }, { key: 'B', text: 'Sensor suara tepuk tangan' }, { key: 'C', text: 'Sensor gerak magnet' }, { key: 'D', text: 'Sensor berat timbangan' }],
            correctAnswer: 'A',
            explanation: 'Sensor cahaya mendeteksi intensitas sinar sekitar untuk mengendalikan sakelar lampu otomatis.',
            cognitiveLevel: 'MOTS',
            topic: 'Sistem Otomatisasi Sensor'
        }
    ],
    mulok: [
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Adé nulis maké patlot dina buku tulis anyar anu sampulna warna héjo.',
            question: 'Kecap "héjo" dina kalimah di luhur ngaran ... buku.',
            optionsFaseA: [{ key: 'A', text: 'Warna' }, { key: 'B', text: 'Rasa' }, { key: 'C', text: 'Sora' }],
            optionsFaseBC: [{ key: 'A', text: 'Warna' }, { key: 'B', text: 'Rasa' }, { key: 'C', text: 'Wangun' }, { key: 'D', text: 'Bau' }],
            correctAnswer: 'A',
            explanation: 'Héjo (hijau) nyaéta ngaran warna dina Basa Sunda.',
            cognitiveLevel: 'LOTS',
            topic: 'Ngaran Warna Basa Sunda'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Nalika dipaparinan jajan ku Nini di imah, Ujang imut bari ngucapkeun kecap sopan.',
            question: 'Ungkapan sopan nalika nampi paméré ti batur dina Basa Sunda nyaéta ...',
            optionsFaseA: [{ key: 'A', text: 'Hatur nuhun' }, { key: 'B', text: 'Hapunten pisan' }, { key: 'C', text: 'Wilujeng wengi' }],
            optionsFaseBC: [{ key: 'A', text: 'Hatur nuhun' }, { key: 'B', text: 'Hapunten' }, { key: 'C', text: 'Wilujeng wengi' }, { key: 'D', text: 'Mangga tipayun' }],
            correctAnswer: 'A',
            explanation: '"Hatur nuhun" diucapkeun pikeun nganuhunkeun ka jalma nu geus méré atawa nulungan.',
            cognitiveLevel: 'LOTS',
            topic: 'Tatakrama Nganuhunkeun'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Di kebon tukangeun imah aya loba tangkal cau jeung tangkal kalapa nu jangkung.',
            question: 'Kadaharan manis tina bungbuahan warna konéng anu sok didahar ku monyét dina basa Sunda disebut ...',
            optionsFaseA: [{ key: 'A', text: 'Cau' }, { key: 'B', text: 'Sampeu' }, { key: 'C', text: 'Suuk' }],
            optionsFaseBC: [{ key: 'A', text: 'Cau (Pisang)' }, { key: 'B', text: 'Sampeu (Singkong)' }, { key: 'C', text: 'Bonténg (Ketimun)' }, { key: 'D', text: 'Waluh (Labu)' }],
            correctAnswer: 'A',
            explanation: 'Cau nyaéta sesebutan Basa Sunda pikeun buah pisang.',
            cognitiveLevel: 'LOTS',
            topic: 'Tutuwuhan Sabudeureun'
        },
        {
            minGrade: 1, maxGrade: 2,
            stimulus: 'Saméméh indit ka sakola, Cucu ngaberesihan tempat saré jeung mandi maké sabun seungit.',
            question: 'Kagiatan meresihan awak isuk-isuk maké cai bersih jeung sabun disebut ...',
            optionsFaseA: [{ key: 'A', text: 'Mandi' }, { key: 'B', text: 'Sasarap' }, { key: 'C', text: 'Ulin' }],
            optionsFaseBC: [{ key: 'A', text: 'Mandi' }, { key: 'B', text: 'Sasarap' }, { key: 'C', text: 'Diajar' }, { key: 'D', text: 'Kulem' }],
            correctAnswer: 'A',
            explanation: 'Mandi ngabersihan awak tina kesang jeung kokotor sangkan seger indit sakola.',
            cognitiveLevel: 'LOTS',
            topic: 'Kabiasaan Sehat Isuk-Isuk'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Wida jeung babaturanana ulin oray-orayan di lapangan sakola bari ngawih babarengan.',
            question: 'Sifat utama anu katingali nalika barudak ulin kaulinan tradisional oray-orayan babarengan nyaéta ...',
            optionsFaseA: [{ key: 'A', text: 'Rukun, gumbira, jeung silih jaga babaturan' }, { key: 'B', text: 'Paséa parebut tempat' }, { key: 'C', text: 'Cicing sorangan di jero kelas' }],
            optionsFaseBC: [{ key: 'A', text: 'Kukumpulan rukun, gumbira, jeung ngajaga kakompakan' }, { key: 'B', text: 'Sombong jeung éléhan' }, { key: 'C', text: 'Nyorangan bari baeud' }, { key: 'D', text: 'Méré sikep teu paduli' }],
            correctAnswer: 'A',
            explanation: 'Kaulinan oray-orayan ngalatih kakompakan, karukunan, jeung kabungahan barudak.',
            cognitiveLevel: 'MOTS',
            topic: 'Kaulinan Oray-Orayan'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Bapa nuju ngaleueut cai entéh haneut di tepas bumi sabari maca koran isuk-isuk.',
            question: 'Kecap lemes "ngaleueut" dina kalimah di luhur hartina sarua jeung kecap loma ...',
            optionsFaseA: [{ key: 'A', text: 'Nginum' }, { key: 'B', text: 'Leumpang' }, { key: 'C', text: 'Saré' }],
            optionsFaseBC: [{ key: 'A', text: 'Nginum' }, { key: 'B', text: 'Indit' }, { key: 'C', text: 'Kulem' }, { key: 'D', text: 'Nulis' }],
            correctAnswer: 'A',
            explanation: 'Ngaleueut mangrupa kecap lemes tina nginum atawa ngadahar.',
            cognitiveLevel: 'LOTS',
            topic: 'Kabeungharan Kecap Lemes'
        },
        {
            minGrade: 3, maxGrade: 4,
            stimulus: 'Dina carita sasatoan Sunda, Sakadang Peucang mindeng katelah sato anu pinter pikeun nyalametkeun diri tina bahaya buhaya.',
            question: 'Watek anu nonjol dina tokoh Sakadang Peucang dina dongéng fabel Sunda nyaéta ...',
            optionsFaseA: [{ key: 'A', text: 'Pinter jeung loba akal' }, { key: 'B', text: 'Bodoh jeung malesan' }, { key: 'C', text: 'Galak sok ngahakan sasama' }],
            optionsFaseBC: [{ key: 'A', text: 'Calakan (pinter) tur loba akal dina ngaréngsékeun masalah' }, { key: 'B', text: 'Tambelar jeung kedul' }, { key: 'C', text: 'Adigung kabina-bina' }, { key: 'D', text: 'Gampang nyerah' }],
            correctAnswer: 'A',
            explanation: 'Sakadang Peucang digambarkeun salaku sato nu calakan jeung loba akal.',
            cognitiveLevel: 'MOTS',
            topic: 'Watek Tokoh Dongéng'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Titénan paribasa Sunda ieu: "Cikaracak ninggang batu, laun-laun jadi legok."',
            question: 'Harti jeung amanat tina paribasa Sunda "Cikaracak ninggang batu, laun-laun jadi legok" nyaéta ...',
            optionsFaseA: [{ key: 'A', text: 'Lamun diajarna suhud jeung sabar terus-terusan, élmu nu hésé gé bakal kahontal' }, { key: 'B', text: 'Batu di walungan bakal langsung leungit dina sapoé' }, { key: 'C', text: 'Ulah daék usaha lamun pagawéanana hésé' }],
            optionsFaseBC: [{ key: 'A', text: 'Sanajan hésé, lamun dipigawé kalawan tekun, sabar, jeung tuluy-tuluyan pasti hasil' }, { key: 'B', text: 'Kudu nyerah saméméh nyobaan pagawéan beurat' }, { key: 'C', text: 'Cai hujan teu boga kakuatan nanaon' }, { key: 'D', text: 'Diajar mah cukup saminggu sakali waé' }],
            correctAnswer: 'A',
            explanation: 'Paribasa éta ngajarkeun yén ketekunan jeung kasabaran bisa ngalaksanakeun hal anu kacida héséna.',
            cognitiveLevel: 'HOTS',
            topic: 'Paribasa Sunda'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Dina upacara adat panén paré masarakat Sunda tradisional, paré disimpen dina wangunan leuit sangkan awét sarta jadi cadangan pangan.',
            question: 'Fungsi utama wangunan "leuit" dina kahirupan masarakat padésaan Sunda baheula jeung kiwari nyaéta tempat ...',
            optionsFaseA: [{ key: 'A', text: 'Nyimpen paré hasil panén sangkan aman pikeun cadangan pangan' }, { key: 'B', text: 'Ngaronda peuting di lawang désa' }, { key: 'C', text: 'Ngarakit parahu awi di walungan' }],
            optionsFaseBC: [{ key: 'A', text: 'Neundeun paré hasil tatanén salaku lumbung katahanan pangan warga' }, { key: 'B', text: 'Kandang ingon-ingon munding' }, { key: 'C', text: 'Tempat latihan maén bal' }, { key: 'D', text: 'Pasar tempat jualan lawon' }],
            correctAnswer: 'A',
            explanation: 'Leuit nyaéta lumbung paré tradisional has Sunda pikeun nyimpen cadangan kadaharan.',
            cognitiveLevel: 'MOTS',
            topic: 'Budaya Leuit Tatar Sunda'
        },
        {
            minGrade: 5, maxGrade: 6,
            stimulus: 'Baca pada Pupuh Kinanti ieu:\n"Budak leutik bisa ngapung /\nBabaku ngapungna peuting /\nNguriling kakalayangan /\nNéangan nu amis-amis..."',
            question: 'Sasatoan peuting anu dimaksud dina téka-téki Pupuh Kinanti di luhur nyaéta ...',
            optionsFaseA: [{ key: 'A', text: 'Kalong / Lalay' }, { key: 'B', text: 'Manuk japati' }, { key: 'C', text: 'Lauk emas' }],
            optionsFaseBC: [{ key: 'A', text: 'Kalong (Lalay / Kelelawar)' }, { key: 'B', text: 'Hayam jago' }, { key: 'C', text: 'Éntog bodas' }, { key: 'D', text: 'Oray sanca' }],
            correctAnswer: 'A',
            explanation: 'Lalay atawa kalong hiber ti peuting néangan buah nu rasana amis.',
            cognitiveLevel: 'MOTS',
            topic: 'Tatarucingan Dina Pupuh'
        }
    ]
};

export const PART5_ISIAN_BY_CAT: Record<string, QuestionBankItemIsian[]> = {
    indo: [
        { minGrade: 1, maxGrade: 2, question: 'Huruf pertama dari kata "Sekolah" adalah huruf ...', correctAnswer: 'S', cognitiveLevel: 'LOTS', topic: 'Mengenal Huruf Awal' },
        { minGrade: 1, maxGrade: 2, question: 'Tanda baca yang dipakai di akhir kalimat berita "Ibu pergi ke pasar" adalah tanda ...', correctAnswer: 'Titik (.)', cognitiveLevel: 'LOTS', topic: 'Tanda Titik' },
        { minGrade: 1, maxGrade: 2, question: 'Jika tidak sengaja menumpahkan air minum teman, ungkapan santun yang kita ucapkan adalah ...', correctAnswer: 'Maaf', cognitiveLevel: 'LOTS', topic: 'Ungkapan Permintaan Maaf' },
        { minGrade: 1, maxGrade: 2, question: 'Kalimat "Siapa namamu?" merupakan contoh kalimat ...', correctAnswer: 'Tanya', cognitiveLevel: 'LOTS', topic: 'Kalimat Tanya' },
        { minGrade: 3, maxGrade: 4, question: 'Persamaan kata (sinonim) dari kata "indah" adalah ...', correctAnswer: 'Cantik / Elok / Bagus', cognitiveLevel: 'LOTS', topic: 'Sinonim Kata' },
        { minGrade: 5, maxGrade: 6, question: 'Bagian awal pembukaan pada teks pidato yang berisi sapaan hormat kepada hadirin disebut ... pembuka.', correctAnswer: 'Salam', cognitiveLevel: 'LOTS', topic: 'Bagian Pidato' }
    ],
    pancasila: [
        { minGrade: 1, maxGrade: 2, question: 'Warna pita yang dicengkeram oleh kaki Burung Garuda Pancasila bertuliskan Bhinneka Tunggal Ika adalah ...', correctAnswer: 'Putih', cognitiveLevel: 'LOTS', topic: 'Lambang Negara' },
        { minGrade: 1, maxGrade: 2, question: 'Sebelum tidur malam dan bangun tidur, kita wajib membaca ... kepada Tuhan.', correctAnswer: 'Doa', cognitiveLevel: 'LOTS', topic: 'Kebiasaan Berdoa' },
        { minGrade: 3, maxGrade: 4, question: 'Lambang sila kedua Pancasila yang melambangkan kemanusiaan yang saling terhubung adalah ... emas.', correctAnswer: 'Rantai', cognitiveLevel: 'LOTS', topic: 'Simbol Sila Kedua' },
        { minGrade: 3, maxGrade: 4, question: 'Segala sesuatu yang layak diterima seorang anak setelah menunaikan tugas dan kewajibannya disebut ...', correctAnswer: 'Hak', cognitiveLevel: 'LOTS', topic: 'Pengertian Hak' },
        { minGrade: 5, maxGrade: 6, question: 'Tanggal diperingatinya Hari Lahir Pancasila di Indonesia setiap tahun adalah tanggal 1 ...', correctAnswer: 'Juni', cognitiveLevel: 'LOTS', topic: 'Hari Lahir Pancasila' },
        { minGrade: 5, maxGrade: 6, question: 'Semangat persatuan untuk mempertahankan keutuhan wilayah Indonesia dari Sabang sampai Merauke menjaga keutuhan ...', correctAnswer: 'NKRI', cognitiveLevel: 'MOTS', topic: 'Keutuhan NKRI' }
    ],
    ipas: [
        { minGrade: 1, maxGrade: 2, question: 'Hewan peliharaan berkaki empat yang gemar mengeong dan menangkap tikus adalah ...', correctAnswer: 'Kucing', cognitiveLevel: 'LOTS', topic: 'Hewan Sekitar' },
        { minGrade: 1, maxGrade: 2, question: 'Benda langit yang tampak terang bulat di malam hari tanpa menghasilkan cahaya sendiri melainkan memantulkan sinar matahari adalah ...', correctAnswer: 'Bulan', cognitiveLevel: 'LOTS', topic: 'Benda Langit Malam' },
        { minGrade: 1, maxGrade: 2, question: 'Alat indra manusia yang berguna untuk mengecap rasa manis, asin, dan asam makanan adalah ...', correctAnswer: 'Lidah', cognitiveLevel: 'LOTS', topic: 'Indra Pengecap' },
        { minGrade: 1, maxGrade: 2, question: 'Bagian tubuh burung yang dipakai untuk terbang tinggi di udara adalah ...', correctAnswer: 'Sayap', cognitiveLevel: 'LOTS', topic: 'Bagian Tubuh Hewan' },
        { minGrade: 3, maxGrade: 4, question: 'Perubahan wujud es krim padat menjadi cair ketika dibiarkan di ruang panas disebut ...', correctAnswer: 'Mencair', cognitiveLevel: 'LOTS', topic: 'Perubahan Wujud' },
        { minGrade: 3, maxGrade: 4, question: 'Magnet memiliki dua ujung kutub yang selalu menunjuk arah utara dan ...', correctAnswer: 'Selatan', cognitiveLevel: 'LOTS', topic: 'Kutub Magnet' },
        { minGrade: 5, maxGrade: 6, question: 'Proses turunnya titik-titik air dari awan ke permukaan bumi dalam siklus air disebut hujan atau ...', correctAnswer: 'Presipitasi', cognitiveLevel: 'MOTS', topic: 'Tahapan Siklus Air' },
        { minGrade: 5, maxGrade: 6, question: 'Sumber daya alam berupa minyak bumi dan batu bara termasuk sumber daya alam yang ... diperbarui.', correctAnswer: 'Tidak dapat', cognitiveLevel: 'LOTS', topic: 'Sumber Daya Alam' }
    ],
    pjok: [
        { minGrade: 1, maxGrade: 2, question: 'Sepatu olahraga harus bertali rapi agar kaki tidak mudah ... saat berlari.', correctAnswer: 'Terpeleset (Terjatuh)', cognitiveLevel: 'LOTS', topic: 'Perlengkapan Olahraga' },
        { minGrade: 1, maxGrade: 2, question: 'Minuman alami terbaik untuk menghilangkan rasa haus setelah berolahraga adalah air ...', correctAnswer: 'Putih (Matang)', cognitiveLevel: 'LOTS', topic: 'Minuman Sehat' },
        { minGrade: 1, maxGrade: 2, question: 'Memutar pergelangan tangan sebelum mulai berolahraga merupakan bagian dari gerakan ...', correctAnswer: 'Pemanasan', cognitiveLevel: 'LOTS', topic: 'Pemanasan Awal' },
        { minGrade: 1, maxGrade: 2, question: 'Posisi punggung yang baik ketika duduk menulis di bangku sekolah harus ...', correctAnswer: 'Tegak', cognitiveLevel: 'LOTS', topic: 'Sikap Duduk' },
        { minGrade: 3, maxGrade: 4, question: 'Jumlah pemain inti dalam satu regu permainan bola basket di lapangan adalah ... orang.', correctAnswer: '5 (Lima)', cognitiveLevel: 'LOTS', topic: 'Permainan Basket' },
        { minGrade: 3, maxGrade: 4, question: 'Teknik pukulan awal untuk memulai permainan bola voli melewati net ke lapangan lawan disebut ...', correctAnswer: 'Servis', cognitiveLevel: 'LOTS', topic: 'Servis Bola Voli' },
        { minGrade: 5, maxGrade: 6, question: 'Alat pemukul pipih bersenar yang digunakan untuk memukul shuttlecock dalam permainan bulu tangkis adalah ...', correctAnswer: 'Raket', cognitiveLevel: 'LOTS', topic: 'Alat Bulu Tangkis' },
        { minGrade: 5, maxGrade: 6, question: 'Zat racun asap rokok yang mengikat hemoglobin darah dan menghambat pengangkutan oksigen tubuh adalah gas karbon ...', correctAnswer: 'Monoksida', cognitiveLevel: 'MOTS', topic: 'Bahaya Asap Rokok' }
    ],
    seni: [
        { minGrade: 1, maxGrade: 2, question: 'Campuran warna merah dengan warna putih menghasilkan warna merah muda atau ...', correctAnswer: 'Pink', cognitiveLevel: 'LOTS', topic: 'Gradasi Warna' },
        { minGrade: 1, maxGrade: 2, question: 'Alat gambar yang memiliki ujung lunak berwarna-warni berbahan lilin untuk mewarnai kertas adalah ...', correctAnswer: 'Krayon', cognitiveLevel: 'LOTS', topic: 'Alat Mewarnai' },
        { minGrade: 1, maxGrade: 2, question: 'Lagu "Balonku Ada Lima" dan "Pelangi-Pelangi" termasuk jenis lagu ...', correctAnswer: 'Anak-anak', cognitiveLevel: 'LOTS', topic: 'Lagu Anak' },
        { minGrade: 1, maxGrade: 2, question: 'Gerakan tangan melambai pelan seperti daun tertiup angin merupakan contoh gerak menirukan ...', correctAnswer: 'Alam (Tumbuhan)', cognitiveLevel: 'LOTS', topic: 'Gerak Tari Alam' },
        { minGrade: 3, maxGrade: 4, question: 'Karya seni rupa yang hanya mempunyai ukuran panjang dan lebar seperti lukisan dan poster disebut karya ... dimensi.', correctAnswer: 'Dua (2)', cognitiveLevel: 'LOTS', topic: 'Karya 2 Dimensi' },
        { minGrade: 3, maxGrade: 4, question: 'Bahan lunak alami dari tanah yang diolah untuk membuat kendi dan celengan adalah tanah ...', correctAnswer: 'Liat', cognitiveLevel: 'LOTS', topic: 'Bahan Kerajinan Liat' },
        { minGrade: 3, maxGrade: 4, question: 'Alat musik melodis tiup yang ditekan tombol tutsnya seperti piano kecil bernama ...', correctAnswer: 'Pianika', cognitiveLevel: 'LOTS', topic: 'Alat Musik Melodis' },
        { minGrade: 5, maxGrade: 6, question: 'Lagu wajib nasional yang melambangkan rasa cinta mendalam kepada negara Indonesia seperti "Indonesia Pusaka" diciptakan oleh Ismail ...', correctAnswer: 'Marzuki', cognitiveLevel: 'LOTS', topic: 'Pencipta Lagu Nasional' },
        { minGrade: 5, maxGrade: 6, question: 'Karya seni tempel menyusun kepingan kecil keramik, kaca berwarna, atau cangkang telur menjadi gambar hias disebut ...', correctAnswer: 'Mozaik', cognitiveLevel: 'MOTS', topic: 'Karya Mozaik' }
    ],
    inggris: [
        { minGrade: 1, maxGrade: 2, question: 'The English word for "buku" that we read in class is ...', correctAnswer: 'Book', cognitiveLevel: 'LOTS', topic: 'School Objects' },
        { minGrade: 1, maxGrade: 2, question: 'A pet animal with soft fur that says "meow" is a ...', correctAnswer: 'Cat', cognitiveLevel: 'LOTS', topic: 'Pets' },
        { minGrade: 1, maxGrade: 2, question: 'When someone says "Thank you", we politely reply "You are ...".', correctAnswer: 'Welcome', cognitiveLevel: 'LOTS', topic: 'Polite Replies' },
        { minGrade: 3, maxGrade: 4, question: 'We use an umbrella when walking outside on a ... day.', correctAnswer: 'Rainy', cognitiveLevel: 'LOTS', topic: 'Weather' },
        { minGrade: 3, maxGrade: 4, question: 'In English, the meal we eat every morning before going to school is called ...', correctAnswer: 'Breakfast', cognitiveLevel: 'LOTS', topic: 'Daily Meals' },
        { minGrade: 5, maxGrade: 6, question: 'An elephant is ... (big) than a rabbit.', correctAnswer: 'bigger', cognitiveLevel: 'MOTS', topic: 'Comparison' },
        { minGrade: 5, maxGrade: 6, question: 'Last Sunday, my sister ... (cook) fried rice for our lunch.', correctAnswer: 'cooked', cognitiveLevel: 'MOTS', topic: 'Past Tense Verbs' }
    ],
    pai: [
        { minGrade: 1, maxGrade: 2, question: 'Nabi yang membangun bahtera kapal besar atas perintah Allah Swt. saat banjir melanda adalah Nabi ... a.s.', correctAnswer: 'Nuh', cognitiveLevel: 'LOTS', topic: 'Kisah Nabi Nuh' },
        { minGrade: 1, maxGrade: 2, question: 'Bacaan doa yang diucapkan setiap kali hendak memulai pekerjaan baik adalah ...', correctAnswer: 'Bismillah (Basmalah)', cognitiveLevel: 'LOTS', topic: 'Kalimat Basmalah' },
        { minGrade: 1, maxGrade: 2, question: 'Salat wajib yang hanya berjumlah dua rakaat dan dikerjakan pada waktu fajar menjelang pagi adalah salat ...', correctAnswer: 'Subuh', cognitiveLevel: 'LOTS', topic: 'Salat Subuh' },
        { minGrade: 3, maxGrade: 4, question: 'Malaikat Allah Swt. yang bertugas meniup sangkakala sebagai tanda datangnya Hari Kiamat adalah Malaikat ...', correctAnswer: 'Israfil', cognitiveLevel: 'LOTS', topic: 'Nama Malaikat' },
        { minGrade: 3, maxGrade: 4, question: 'Bulan kesembilan dalam kalender Hijriah di mana umat Islam wajib berpuasa sebulan penuh adalah bulan ...', correctAnswer: 'Ramadan', cognitiveLevel: 'LOTS', topic: 'Kalender Hijriah' },
        { minGrade: 5, maxGrade: 6, question: 'Sifat terpuji menerima dengan ikhlas serta bersyukur atas pembagian rezeki dari Allah Swt. disebut ...', correctAnswer: 'Qanaah', cognitiveLevel: 'MOTS', topic: 'Akhlak Qanaah' },
        { minGrade: 5, maxGrade: 6, question: 'Ibadah wajib ke Tanah Suci Makkah bagi umat Islam yang mampu secara fisik dan biaya disebut ibadah ...', correctAnswer: 'Haji', cognitiveLevel: 'LOTS', topic: 'Rukun Islam Kelima' }
    ],
    koding: [
        { minGrade: 1, maxGrade: 2, question: 'Alat penunjuk kecil di layar monitor yang ikut bergerak saat mouse digeser disebut ...', correctAnswer: 'Kursor (Pointer)', cognitiveLevel: 'LOTS', topic: 'Antarmuka Komputer' },
        { minGrade: 1, maxGrade: 2, question: 'Susunan berulang "Merah - Biru - Merah - Biru - ..." memiliki warna berikutnya yaitu ...', correctAnswer: 'Merah', cognitiveLevel: 'LOTS', topic: 'Pola Warna' },
        { minGrade: 1, maxGrade: 2, question: 'Perangkat keras untuk mencetak gambar dari layar komputer ke lembaran kertas adalah ...', correctAnswer: 'Printer', cognitiveLevel: 'LOTS', topic: 'Perangkat Output' },
        { minGrade: 1, maxGrade: 2, question: 'Tombol panjang paling bawah pada keyboard yang berguna membuat jarak antarkata disebut tombol ...', correctAnswer: 'Spasi (Spacebar)', cognitiveLevel: 'LOTS', topic: 'Tombol Keyboard' },
        { minGrade: 3, maxGrade: 4, question: 'Simbol bangun oval pada awal dan akhir bagan diagram alir (flowchart) menunjukkan titik mulai atau ...', correctAnswer: 'Selesai (End)', cognitiveLevel: 'LOTS', topic: 'Diagram Alir' },
        { minGrade: 3, maxGrade: 4, question: 'Blok logika "JIKA ... MAKA ..." dalam pemrograman visual berfungsi membuat ...', correctAnswer: 'Percabangan / Keputusan', cognitiveLevel: 'MOTS', topic: 'Percabangan Logika' },
        { minGrade: 3, maxGrade: 4, question: 'Nama situs atau mesin di internet yang membantu kita mencari informasi berdasarkan kata kunci adalah mesin ...', correctAnswer: 'Pencari (Search engine)', cognitiveLevel: 'LOTS', topic: 'Literasi Internet' },
        { minGrade: 5, maxGrade: 6, question: 'Etika menyebutkan sumber asli ketika mengutip karya orang lain dari internet menghindarkan kita dari tindakan ...', correctAnswer: 'Plagiarisme (Menjiplak)', cognitiveLevel: 'MOTS', topic: 'Etika Digital' },
        { minGrade: 5, maxGrade: 6, question: 'Kumpulan data beragam yang dipakai untuk melatih sistem Kecerdasan Artifisial agar pintar mengenali pola disebut ...', correctAnswer: 'Dataset (Data latih)', cognitiveLevel: 'MOTS', topic: 'Data Latih AI' },
        { minGrade: 5, maxGrade: 6, question: 'Nilai biner "1" pada sakelar digital komputer menandakan arus listrik dalam kondisi ...', correctAnswer: 'Menyala (ON)', cognitiveLevel: 'LOTS', topic: 'Logika Biner' }
    ],
    mulok: [
        { minGrade: 1, maxGrade: 2, question: 'Warna getih jeung bandéra bagian luhur nagara Indonésia dina Basa Sunda nyaéta ... (merah).', correctAnswer: 'Beureum', cognitiveLevel: 'LOTS', topic: 'Warna Basa Sunda' },
        { minGrade: 1, maxGrade: 2, question: 'Upami panggih jeung sobat dina waktu beurang, salam anu diucapkeun nyaéta "Wilujeng ...".', correctAnswer: 'Siang', cognitiveLevel: 'LOTS', topic: 'Salam Basa Sunda' },
        { minGrade: 1, maxGrade: 2, question: 'Alat tulis anu dipaké pikeun mupus tulisan salah dina buku tulis disebut ... (penghapus).', correctAnswer: 'Panghapus', cognitiveLevel: 'LOTS', topic: 'Pakakas Sakola' },
        { minGrade: 3, maxGrade: 4, question: 'Kaulinan barudak Sunda anu maké papan kai boga tujuh liang unggal sisina sarta eusina siki kewuk nyaéta ...', correctAnswer: 'Congklak', cognitiveLevel: 'LOTS', topic: 'Kaulinan Tradisional' },
        { minGrade: 3, maxGrade: 4, question: 'Basa lemesna tina kecap "leumpang" (berjalan) pikeun jalma nu dipikahormat nyaéta ...', correctAnswer: 'Angkat / Nyaba', cognitiveLevel: 'MOTS', topic: 'Undak-Usuk Basa' },
        { minGrade: 5, maxGrade: 6, question: 'Jumlah guru lagu jeung guru wilangan dina tiap padalisan pupuh disusun nurutkeun aturan ... pupuh.', correctAnswer: 'Patokan (Watek)', cognitiveLevel: 'MOTS', topic: 'Patokan Pupuh' },
        { minGrade: 5, maxGrade: 6, question: 'Gotong royong silih tulungan dina budaya masarakat Tatar Sunda katelah istilah ...', correctAnswer: 'Sabilulungan', cognitiveLevel: 'LOTS', topic: 'Ajén Budaya Sunda' }
    ]
};

export const PART5_URAIAN_BY_CAT: Record<string, QuestionBankItemUraian[]> = {
    indo: [
        {
            minGrade: 1, maxGrade: 2,
            question: 'Tuliskan 3 benda yang ada di dalam tas sekolahmu dan buatlah masing-masing 1 kalimat sederhana tentang kegunaan benda tersebut!',
            correctAnswer: '1. Pensil: Pensil digunakan untuk menulis di buku tulis. 2. Penghapus: Penghapus digunakan untuk membersihkan tulisan salah. 3. Penggaris: Penggaris digunakan untuk membuat garis lurus.',
            cognitiveLevel: 'LOTS',
            topic: 'Mendeskripsikan Benda Sekolah',
            rubric: { score3: 'Menulis 3 benda beserta kalimat kegunaan yang jelas dan tepat.', score2: 'Menulis 2 benda dengan kalimat benar.', score1: 'Hanya menyebut nama benda.', score0: 'Kosong.' }
        },
        {
            minGrade: 1, maxGrade: 2,
            question: 'Perhatikan kata acak berikut: "belajar - rajin - Rafi - membaca - buku". Susunlah menjadi sebuah kalimat yang benar dan beri tanda titik di akhirnya!',
            correctAnswer: 'Rafi rajin belajar membaca buku.',
            cognitiveLevel: 'MOTS',
            topic: 'Menyusun Kalimat Acak',
            rubric: { score3: 'Menyusun kalimat logis dengan huruf kapital di awal nama orang dan tanda titik di akhir.', score2: 'Susunan kata benar tetapi tanda baca/kapital kurang tepat.', score1: 'Susunan kalimat masih terbalik.', score0: 'Kosong.' }
        },
        {
            minGrade: 1, maxGrade: 2,
            question: 'Sebutkan 2 contoh tanda baca dasar yang kamu ketahui (misalnya titik dan tanya) serta kapan tanda baca tersebut dipakai dalam kalimat!',
            correctAnswer: '1. Tanda titik (.) dipakai di akhir kalimat berita. 2. Tanda tanya (?) dipakai di akhir kalimat yang menanyakan sesuatu.',
            cognitiveLevel: 'LOTS',
            topic: 'Fungsi Tanda Baca',
            rubric: { score3: 'Menyebutkan 2 tanda baca dan kegunaannya dengan benar.', score2: 'Menyebutkan 1 tanda baca beserta fungsi tepat.', score1: 'Hanya menulis simbol tanpa penjelasan.', score0: 'Kosong.' }
        },
        {
            minGrade: 3, maxGrade: 4,
            question: 'Buatlah sebuah paragraf singkat (minimal 3 kalimat) menceritakan pengalamanmu membantu orang tua membersihkan lingkungan rumah di akhir pekan!',
            correctAnswer: 'Pada hari Minggu pagi, saya membantu ayah menyapu halaman depan rumah. Ibu juga membersihkan jendela dan menyiram tanaman bunga di pot. Setelah bekerja sama selama satu jam, rumah kami tampak bersih, rapi, dan nyaman.',
            cognitiveLevel: 'HOTS',
            topic: 'Menulis Paragraf Pengalaman',
            rubric: { score3: 'Menulis 3 kalimat runtut yang padu dengan ejaan huruf kapital dan tanda titik tepat.', score2: 'Menulis 3 kalimat tetapi kurang padu atau ada kesalahan ejaan ringan.', score1: 'Hanya menulis 1–2 kalimat singkat.', score0: 'Kosong.' }
        },
        {
            minGrade: 5, maxGrade: 6,
            question: 'Jelaskan perbedaan antara kalimat fakta dan kalimat opini, lalu buatlah masing-masing 1 contoh kalimatnya bertema kegiatan sekolah!',
            correctAnswer: 'Kalimat fakta berisi kenyataan yang dapat dibuktikan/diukur (Contoh: "Upacara bendera dimulai pukul 07.00 WIB di halaman sekolah"). Kalimat opini berisi pendapat pribadi yang belum tentu disetujui semua orang (Contoh: "Menurutku, halaman sekolah tampak paling indah jika ditanami bunga matahari").',
            cognitiveLevel: 'HOTS',
            topic: 'Membedakan Fakta dan Opini',
            rubric: { score3: 'Menjelaskan perbedaan fakta-opini secara akurat disertai 1 contoh fakta dan 1 contoh opini.', score2: 'Perbedaan benar tetapi salah satu contoh kurang tepat.', score1: 'Hanya mendefinisikan satu istilah saja.', score0: 'Kosong.' }
        }
    ],
    pancasila: [
        {
            minGrade: 1, maxGrade: 2,
            question: 'Sebutkan 3 contoh sikap rukun dan kerja sama yang bisa kamu lakukan bersama teman saat bermain di sekolah!',
            correctAnswer: '1. Bergantian memakai ayunan atau alat permainan. 2. Meminjamkan pensil warna kepada teman yang lupa membawa. 3. Merapikan mainan bersama setelah selesai bermain.',
            cognitiveLevel: 'LOTS',
            topic: 'Sikap Rukun Bermain',
            rubric: { score3: 'Menyebutkan 3 contoh sikap rukun yang tepat.', score2: 'Menyebutkan 2 contoh yang tepat.', score1: 'Menyebutkan 1 contoh saja.', score0: 'Kosong.' }
        },
        {
            minGrade: 1, maxGrade: 2,
            question: 'Tuliskan bunyi sila pertama hingga sila ketiga Pancasila secara urut beserta lambang gambarnya masing-masing!',
            correctAnswer: '1. Ketuhanan Yang Maha Esa (Bintang Emas). 2. Kemanusiaan yang Adil dan Beradab (Rantai Emas). 3. Persatuan Indonesia (Pohon Beringin).',
            cognitiveLevel: 'LOTS',
            topic: 'Bunyi dan Simbol Pancasila',
            rubric: { score3: 'Menuliskan ketiga bunyi sila dan simbolnya dengan benar dan urut.', score2: 'Hanya 2 sila beserta simbolnya benar.', score1: 'Hanya menyebutkan simbol tanpa bunyi sila.', score0: 'Kosong.' }
        },
        {
            minGrade: 3, maxGrade: 4,
            question: 'Mengapa keputusan yang diambil melalui musyawarah mufakat jauh lebih baik daripada keputusan yang dipaksakan satu orang saja? Jelaskan 2 alasannya!',
            correctAnswer: '1. Hasil keputusan mencerminkan suara dan kepentingan semua peserta sehingga adil. 2. Semua anggota merasa dihargai dan mau melaksanakan keputusan dengan tanggung jawab penuh.',
            cognitiveLevel: 'HOTS',
            topic: 'Keunggulan Musyawarah',
            rubric: { score3: 'Menjelaskan 2 alasan logis keutamaan musyawarah mufakat.', score2: 'Menjelaskan 1 alasan tepat.', score1: 'Jawaban kurang relevan.', score0: 'Kosong.' }
        },
        {
            minGrade: 3, maxGrade: 4,
            question: 'Berikan 3 contoh perilaku menjaga persatuan dan keutuhan di lingkungan tempat tinggalmu yang memiliki warga beragam suku!',
            correctAnswer: '1. Ikut kerja bakti membersihkan lingkungan tanpa membeda-bedakan tetangga. 2. Menghormati tradisi dan ibadah warga lain. 3. Menyapa tetangga dengan ramah dan menolong jika ada yang tertimpa musibah.',
            cognitiveLevel: 'MOTS',
            topic: 'Persatuan Masyarakat Beragam',
            rubric: { score3: 'Memberikan 3 contoh perilaku menjaga persatuan yang nyata dan tepat.', score2: 'Memberikan 2 contoh yang tepat.', score1: 'Hanya 1 contoh.', score0: 'Kosong.' }
        },
        {
            minGrade: 5, maxGrade: 6,
            question: 'Jelaskan 3 nilai keteladanan para tokoh perumus Pancasila (seperti Ir. Soekarno, Drs. Moh. Hatta, dan tokoh lainnya) yang patut diterapkan pelajar masa kini!',
            correctAnswer: '1. Mengutamakan persatuan bangsa di atas kepentingan golongan atau daerah. 2. Menghargai perbedaan pendapat melalui musyawarah bijaksana. 3. Rela berkorban waktu, tenaga, dan pikiran demi kemerdekaan dan kemajuan Indonesia.',
            cognitiveLevel: 'HOTS',
            topic: 'Keteladanan Pendiri Bangsa',
            rubric: { score3: 'Menyebutkan 3 nilai keteladanan perumus Pancasila dan kaitannya bagi pelajar.', score2: 'Menyebutkan 2 nilai keteladanan dengan jelas.', score1: 'Hanya menyebutkan 1 nilai umum.', score0: 'Kosong.' }
        }
    ],
    ipas: [
        {
            minGrade: 1, maxGrade: 2,
            question: 'Tuliskan 3 perbedaan utama antara benda hidup (seperti ayam atau pohon) dan benda tak hidup (seperti batu atau meja kayu)!',
            correctAnswer: '1. Benda hidup dapat bernapas, sedangkan benda tak hidup tidak bernapas. 2. Benda hidup membutuhkan makan dan minum untuk tumbuh besar. 3. Benda hidup dapat berkembang biak menghasilkan keturunan.',
            cognitiveLevel: 'MOTS',
            topic: 'Ciri Makhluk Hidup',
            rubric: { score3: 'Menjelaskan 3 perbedaan ciri makhluk hidup dan benda mati secara tepat.', score2: 'Menjelaskan 2 perbedaan benar.', score1: 'Menjelaskan 1 perbedaan saja.', score0: 'Kosong.' }
        },
        {
            minGrade: 1, maxGrade: 2,
            question: 'Sebutkan 3 benda berwujud padat dan 3 benda berwujud cair yang sering kamu temui di ruang dapur rumahmu!',
            correctAnswer: 'Benda padat: sendok, piring, panci (atau meja, gelas). Benda cair: air minum, minyak goreng, kecap (atau cuka, susu cair).',
            cognitiveLevel: 'LOTS',
            topic: 'Contoh Wujud Benda',
            rubric: { score3: 'Menyebutkan 3 benda padat dan 3 benda cair dengan benar.', score2: 'Menyebutkan total 4–5 contoh benda benar.', score1: 'Hanya 1–3 benda benar.', score0: 'Kosong.' }
        },
        {
            minGrade: 1, maxGrade: 2,
            question: 'Mengapa kita harus menghemat air bersih dan membuang sampah pada tempatnya setiap hari? Jelaskan 2 manfaatnya!',
            correctAnswer: '1. Menghemat air agar cadangan air bersih tidak cepat habis saat musim kemarau. 2. Membuang sampah di tempatnya menjaga lingkungan bersih, bebas bau, dan terhindar dari banjir atau penyakit.',
            cognitiveLevel: 'MOTS',
            topic: 'Menjaga Kebersihan Lingkungan',
            rubric: { score3: 'Menjelaskan manfaat hemat air dan buang sampah pada tempatnya dengan benar.', score2: 'Hanya menjelaskan salah satu dengan baik.', score1: 'Jawaban terlalu singkat.', score0: 'Kosong.' }
        },
        {
            minGrade: 3, maxGrade: 4,
            question: 'Jelaskan 3 jenis gaya yang dapat kamu amati saat bermain di lapangan sekolah beserta masing-masing contoh peristiwanya!',
            correctAnswer: '1. Gaya otot: menendang bola atau menarik tambang. 2. Gaya gravitasi: bola yang dilempar ke atas selalu jatuh kembali ke tanah. 3. Gaya gesek: gesekan sol sepatu dengan lapangan menahan kaki agar tidak terpeleset.',
            cognitiveLevel: 'MOTS',
            topic: 'Macam Gaya di Sekitar',
            rubric: { score3: 'Menjelaskan 3 jenis gaya dan contoh peristiwanya dengan akurat.', score2: 'Menjelaskan 2 jenis gaya dan contoh.', score1: 'Menjelaskan 1 jenis gaya saja.', score0: 'Kosong.' }
        },
        {
            minGrade: 5, maxGrade: 6,
            question: 'Jelaskan perbedaan terjadinya gerhana matahari dan gerhana bulan berdasarkan posisi Matahari, Bumi, dan Bulan!',
            correctAnswer: 'Gerhana matahari terjadi saat posisi Bulan berada di antara Matahari dan Bumi sehingga cahaya Matahari terhalang Bulan. Gerhana bulan terjadi saat Bumi berada di antara Matahari dan Bulan sehingga Bulan masuk ke bayangan Bumi.',
            cognitiveLevel: 'HOTS',
            topic: 'Perbandingan Gerhana',
            rubric: { score3: 'Menjelaskan posisi Matahari-Bumi-Bulan pada kedua gerhana secara tepat.', score2: 'Penjelasan satu gerhana tepat namun lainnya kurang lengkap.', score1: 'Posisi benda langit masih tertukar.', score0: 'Kosong.' }
        }
    ],
    pjok: [
        {
            minGrade: 1, maxGrade: 2,
            question: 'Sebutkan 3 contoh gerak di tempat (nonlokomotor) yang sering dilakukan saat senam pagi di halaman sekolah!',
            correctAnswer: '1. Mengayunkan kedua lengan ke depan dan belakang. 2. Memutar kepala atau bahu secara perlahan. 3. Menekuk lutut atau membungkukkan badan di tempat.',
            cognitiveLevel: 'LOTS',
            topic: 'Contoh Gerak Nonlokomotor',
            rubric: { score3: 'Menyebutkan 3 contoh gerak nonlokomotor dengan benar.', score2: 'Menyebutkan 2 contoh benar.', score1: 'Hanya 1 contoh benar.', score0: 'Kosong.' }
        },
        {
            minGrade: 1, maxGrade: 2,
            question: 'Mengapa sebelum berolahraga kita harus memakai pakaian dan sepatu olahraga yang nyaman, serta mencuci tangan sesudah bermain?',
            correctAnswer: 'Pakaian dan sepatu olahraga memudahkan tubuh bergerak bebas serta melindungi kaki dari cedera. Mencuci tangan sesudah bermain membersihkan debu dan kuman agar tubuh tetap sehat.',
            cognitiveLevel: 'MOTS',
            topic: 'Keamanan dan Kebersihan Olahraga',
            rubric: { score3: 'Menjelaskan fungsi pakaian/sepatu olahraga serta manfaat cuci tangan dengan tepat.', score2: 'Menjelaskan salah satu aspek dengan benar.', score1: 'Jawaban sangat singkat.', score0: 'Kosong.' }
        },
        {
            minGrade: 3, maxGrade: 4,
            question: 'Jelaskan perbedaan teknik melempar bola melambung, mendatar, dan menyusur tanah dalam permainan bola kasti beserta kegunaannya!',
            correctAnswer: '1. Lemparan melambung untuk mengoper bola jarak jauh ke penjaga jauh. 2. Lemparan mendatar setinggi dada untuk operan cepat jarak menengah. 3. Lemparan menyusur tanah untuk mengoper bola rendah bergulir di rumput.',
            cognitiveLevel: 'MOTS',
            topic: 'Variasi Lemparan Bola Kasti',
            rubric: { score3: 'Menjelaskan ketiga jenis lemparan kasti dan kegunaannya dengan jelas.', score2: 'Menjelaskan 2 jenis lemparan dengan benar.', score1: 'Hanya 1 jenis lemparan.', score0: 'Kosong.' }
        },
        {
            minGrade: 5, maxGrade: 6,
            question: 'Mengapa siswa sekolah dasar perlu memiliki daya tahan tubuh, kelincahan, dan kekuatan otot yang baik? Sebutkan 1 contoh latihan bagi masing-masing unsur tersebut!',
            correctAnswer: 'Agar tubuh bugar, tidak cepat lelah saat belajar, dan terampil beraktivitas. Contoh: Daya tahan = lari santai (jogging); Kelincahan = lari zig-zag; Kekuatan otot lengan = push-up.',
            cognitiveLevel: 'HOTS',
            topic: 'Unsur Kebugaran Jasmani',
            rubric: { score3: 'Menjelaskan manfaat kebugaran serta 3 latihan sesuai unsur daya tahan, kelincahan, dan kekuatan.', score2: 'Manfaat benar dengan 2 contoh latihan tepat.', score1: 'Hanya menyebut 1 latihan tanpa alasan.', score0: 'Kosong.' }
        }
    ],
    seni: [
        {
            minGrade: 1, maxGrade: 2,
            question: 'Sebutkan 3 alat musik ritmis sederhana (baik buatan pabrik maupun benda sekitar) yang dapat digunakan untuk mengiringi tepuk irama lagu anak!',
            correctAnswer: 'Contoh: 1. Rebana / tamborin. 2. Gendang / drum kecil. 3. Marakas atau botol plastik berisi biji kacang.',
            cognitiveLevel: 'LOTS',
            topic: 'Alat Musik Ritmis Sekitar',
            rubric: { score3: 'Menyebutkan 3 alat musik ritmis dengan tepat.', score2: 'Menyebutkan 2 alat musik ritmis.', score1: 'Menyebutkan 1 alat atau keliru dengan alat melodis.', score0: 'Kosong.' }
        },
        {
            minGrade: 1, maxGrade: 2,
            question: 'Tuliskan 3 bahan alam dari lingkungan sekitar yang bisa ditempelkan untuk membuat hiasan kolase di atas kertas gambar!',
            correctAnswer: '1. Daun kering berbagai warna. 2. Biji-bijian seperti kacang hijau, jagung, dan kedelai. 3. Ranting kecil kering atau cangkang telur bersih.',
            cognitiveLevel: 'LOTS',
            topic: 'Bahan Alam Kolase',
            rubric: { score3: 'Menyebutkan 3 bahan alam untuk kolase secara tepat.', score2: 'Menyebutkan 2 bahan alam tepat.', score1: 'Hanya 1 bahan.', score0: 'Kosong.' }
        },
        {
            minGrade: 3, maxGrade: 4,
            question: 'Jelaskan perbedaan motif ragam hias flora, fauna, dan geometris pada karya batik atau ukiran Nusantara beserta contoh gambarnya masing-masing!',
            correctAnswer: '1. Motif flora meniru bentuk tumbuhan seperti bunga dan sulur daun. 2. Motif fauna meniru bentuk hewan seperti burung cenderawasih atau kupu-kupu. 3. Motif geometris tersusun atas bentuk teratur seperti segitiga, lingkaran, dan garis zig-zag.',
            cognitiveLevel: 'MOTS',
            topic: 'Jenis Ragam Hias Nusantara',
            rubric: { score3: 'Menjelaskan ketiganya dengan tepat disertai contoh bentuk masing-masing.', score2: 'Menjelaskan 2 motif dengan benar.', score1: 'Hanya menyebutkan nama motif tanpa uraian.', score0: 'Kosong.' }
        },
        {
            minGrade: 3, maxGrade: 4,
            question: 'Apa yang dimaksud dengan komik cerita anak dan sebutkan 3 unsur penting yang wajib ada ketika kamu membuat gambar komik!',
            correctAnswer: 'Komik adalah cerita bergambar berurutan yang memadukan gambar dan teks. Unsur penting: 1. Panel/kotak adegan berurutan, 2. Gambar tokoh ekspresif, 3. Balon kata berisi dialog atau pikiran tokoh.',
            cognitiveLevel: 'MOTS',
            topic: 'Membuat Gambar Komik',
            rubric: { score3: 'Mendefinisikan komik dan menyebutkan 3 unsur utama (panel, tokoh, balon kata).', score2: 'Definisi benar dengan 2 unsur.', score1: 'Jawaban sangat singkat.', score0: 'Kosong.' }
        },
        {
            minGrade: 5, maxGrade: 6,
            question: 'Tuliskan 4 langkah utama pembuatan batik tulis tradisional pada kain putih mulai dari persiapan desain hingga proses pewarnaan dan pelorodan!',
            correctAnswer: '1. Membuat pola/sketsa motif batik di atas kain mori dengan pensil. 2. Menorehkan malam (lilin panas) mengikuti pola memakai canting (nglowong). 3. Mencelupkan kain ke dalam pewarna kain. 4. Merebus kain (melorod) untuk melunturkan lilin malam hingga motif muncul.',
            cognitiveLevel: 'HOTS',
            topic: 'Proses Pembuatan Batik Tulis',
            rubric: { score3: 'Menguraikan 4 tahapan batik tulis secara urut dan benar.', score2: 'Menuliskan 2–3 tahap benar.', score1: 'Urutan acak atau hanya menyebut alat.', score0: 'Kosong.' }
        },
        {
            minGrade: 5, maxGrade: 6,
            question: 'Mengapa artikulasi, intonasi, dan ekspresi mimik wajah harus dilatih dengan sungguh-sungguh oleh pemeran teater maupun pembaca puisi?',
            correctAnswer: 'Artikulasi yang jelas membuat dialog mudah dipahami penonton; intonasi memberi tekanan emosi kalimat; ekspresi wajah dan gestur membantu penonton merasakan suasana cerita yang diperankan.',
            cognitiveLevel: 'HOTS',
            topic: 'Teknik Pemeranan Teater',
            rubric: { score3: 'Menjelaskan peran artikulasi, intonasi, dan ekspresi secara logis dan lengkap.', score2: 'Menjelaskan 2 aspek dengan baik.', score1: 'Penjelasan sangat umum.', score0: 'Kosong.' }
        }
    ],
    inggris: [
        {
            minGrade: 1, maxGrade: 2,
            question: 'Write 3 names of classroom objects and 3 names of days of the week in English!',
            correctAnswer: 'Classroom objects: Book, Pencil, Ruler (or Chair, Table, Eraser).\nDays: Monday, Tuesday, Wednesday (or Thursday, Friday, Saturday, Sunday).',
            cognitiveLevel: 'LOTS',
            topic: 'Classroom & Days Vocabulary',
            rubric: { score3: 'Writes 3 classroom objects and 3 days accurately in English.', score2: 'Writes 4–5 accurate English words.', score1: 'Only 1–3 words correct.', score0: 'Blank.' }
        },
        {
            minGrade: 1, maxGrade: 2,
            question: 'Translate these 3 polite Indonesian expressions into English: (1) Selamat pagi, (2) Terima kasih, (3) Maaf!',
            correctAnswer: '1. Good morning. 2. Thank you. 3. I am sorry (Sorry).',
            cognitiveLevel: 'LOTS',
            topic: 'Polite Greetings Translation',
            rubric: { score3: 'Translates all 3 polite expressions cleanly into English.', score2: 'Translates 2 expressions accurately.', score1: 'Only 1 expression correct.', score0: 'Blank.' }
        },
        {
            minGrade: 1, maxGrade: 2,
            question: 'Write 3 simple English sentences describing your family members (for example, mother, father, and sister/brother)!',
            correctAnswer: 'Example: 1. This is my mother. 2. My father is very kind. 3. I have one younger brother.',
            cognitiveLevel: 'MOTS',
            topic: 'My Family Sentences',
            rubric: { score3: 'Writes 3 grammatically clear sentences about family members.', score2: 'Writes 2 understandable sentences.', score1: 'Only lists family words without sentences.', score0: 'Blank.' }
        },
        {
            minGrade: 3, maxGrade: 4,
            question: 'Write 3 sentences in English telling what you usually do on Sunday morning with your family!',
            correctAnswer: 'Example: 1. On Sunday morning, I wake up early and clean my room. 2. My father washes his car in the yard. 3. We eat breakfast together at eight o\'clock.',
            cognitiveLevel: 'MOTS',
            topic: 'Weekend Activities',
            rubric: { score3: 'Writes 3 clear Simple Present Tense sentences about Sunday activities.', score2: 'Writes 2 understandable sentences.', score1: 'Only 1 sentence correct.', score0: 'Blank.' }
        },
        {
            minGrade: 3, maxGrade: 4,
            question: 'Write 3 sentences in English telling the time using "o\'clock" or "half past" for your daily activities!',
            correctAnswer: 'Example: 1. I go to school at six o\'clock. 2. I eat lunch at half past twelve. 3. I go to sleep at nine o\'clock.',
            cognitiveLevel: 'MOTS',
            topic: 'Telling Time Sentences',
            rubric: { score3: 'Writes 3 accurate sentences using proper time expressions.', score2: 'Writes 2 accurate sentences.', score1: 'Time expression unclear.', score0: 'Blank.' }
        },
        {
            minGrade: 5, maxGrade: 6,
            question: 'Write a short paragraph in English (4 sentences) describing your best friend, including their appearance and hobby!',
            correctAnswer: 'Example: My best friend is Liam. He is eleven years old and studies in sixth grade. He is tall and wears glasses. His favorite hobby is playing badminton after school.',
            cognitiveLevel: 'HOTS',
            topic: 'Describing People',
            rubric: { score3: 'Writes 4 clear English sentences describing name, appearance, and hobby.', score2: 'Writes 3 clear sentences.', score1: 'Incomplete description.', score0: 'Blank.' }
        },
        {
            minGrade: 5, maxGrade: 6,
            question: 'Write 3 English sentences stating your future plans for the next school holiday using "will" or "going to"!',
            correctAnswer: 'Example: 1. Next holiday, I will visit my grandmother in Bandung. 2. My family is going to eat traditional food there. 3. I will take many photos of the green tea garden.',
            cognitiveLevel: 'HOTS',
            topic: 'Writing Future Plans',
            rubric: { score3: 'Produces 3 accurate future tense sentences with "will" or "be going to".', score2: 'Produces 2 accurate sentences.', score1: 'Uses wrong tense forms.', score0: 'Blank.' }
        }
    ],
    pai: [
        {
            minGrade: 1, maxGrade: 2,
            question: 'Tuliskan 5 Rukun Islam secara berurutan dari yang pertama hingga kelima!',
            correctAnswer: '1. Mengucapkan dua kalimat syahadat. 2. Mendirikan salat lima waktu. 3. Membayar zakat. 4. Berpuasa di bulan Ramadan. 5. Menunaikan ibadah haji bagi yang mampu.',
            cognitiveLevel: 'LOTS',
            topic: 'Lima Rukun Islam',
            rubric: { score3: 'Menuliskan kelima Rukun Islam secara urut dan tepat.', score2: 'Menuliskan 3–4 Rukun Islam dengan benar.', score1: 'Hanya 1–2 butir.', score0: 'Kosong.' }
        },
        {
            minGrade: 1, maxGrade: 2,
            question: 'Sebutkan 3 cara berbakti dan berbuat baik kepada kedua orang tua (ibu dan bapak) di rumah setiap hari!',
            correctAnswer: '1. Berbicara lemah lembut dan tidak membentak orang tua. 2. Membantu pekerjaan ringan di rumah dan merapikan mainan. 3. Mendoakan kebaikan dan kesehatan untuk kedua orang tua setiap selesai salat.',
            cognitiveLevel: 'MOTS',
            topic: 'Berbakti kepada Orang Tua',
            rubric: { score3: 'Menyebutkan 3 contoh nyata berbakti kepada orang tua dengan tepat.', score2: 'Menyebutkan 2 contoh nyata.', score1: 'Hanya 1 contoh.', score0: 'Kosong.' }
        },
        {
            minGrade: 1, maxGrade: 2,
            question: 'Tuliskan arti dari kalimat Basmalah ("Bismillahirrahmanirrahim") dan sebutkan 2 kegiatan baik yang diawali dengan membacanya!',
            correctAnswer: 'Artinya: Dengan menyebut nama Allah Yang Maha Pengasih lagi Maha Penyayang. Contoh kegiatan: sebelum makan/minum, sebelum belajar, dan sebelum masuk kamar tidur.',
            cognitiveLevel: 'LOTS',
            topic: 'Makna Kalimat Basmalah',
            rubric: { score3: 'Menuliskan arti Basmalah benar serta 2 contoh kegiatan baik.', score2: 'Arti benar dengan 1 contoh.', score1: 'Hanya menuliskan contoh kegiatan.', score0: 'Kosong.' }
        },
        {
            minGrade: 3, maxGrade: 4,
            question: 'Tuliskan 4 sifat wajib bagi rasul Allah (Siddiq, Amanah, Tabligh, Fatanah) beserta arti masing-masing!',
            correctAnswer: '1. Siddiq: Benar / Jujur dalam perkataan dan perbuatan. 2. Amanah: Dapat dipercaya. 3. Tabligh: Menyampaikan wahyu Allah kepada umat. 4. Fatanah: Cerdas dan bijaksana.',
            cognitiveLevel: 'LOTS',
            topic: 'Empat Sifat Wajib Rasul',
            rubric: { score3: 'Menuliskan 4 sifat wajib rasul beserta artinya secara tepat.', score2: 'Menuliskan 2–3 sifat dengan artinya.', score1: 'Hanya menyebut 1 sifat.', score0: 'Kosong.' }
        },
        {
            minGrade: 3, maxGrade: 4,
            question: 'Sebutkan 3 hikmah dan manfaat melaksanakan ibadah puasa Ramadan bagi kesehatan tubuh serta akhlak pelajar!',
            correctAnswer: '1. Melatih kesabaran, kejujuran, dan pengendalian hawa nafsu. 2. Menumbuhkan rasa empati peduli terhadap kaum duafa yang kekurangan. 3. Memberi kesempatan organ pencernaan beristirahat agar tubuh lebih sehat.',
            cognitiveLevel: 'MOTS',
            topic: 'Hikmah Puasa Ramadan',
            rubric: { score3: 'Menyebutkan 3 hikmah puasa secara tepat dari segi akhlak dan kesehatan.', score2: 'Menyebutkan 2 hikmah tepat.', score1: 'Hanya 1 hikmah.', score0: 'Kosong.' }
        },
        {
            minGrade: 5, maxGrade: 6,
            question: 'Jelaskan pesan pokok yang terkandung dalam Surah Al-Ma\'un dan berikan 2 contoh perilaku tercela yang dilarang dalam surah tersebut!',
            correctAnswer: 'Pesan pokok: Islam mengajarkan kesalehan ibadah harus selaras dengan kepedulian sosial menolong anak yatim dan fakir miskin. Perilaku yang dilarang: menghardik anak yatim, tidak memberi makan fakir miskin, lalai salat, serta berbuat ria (pamer).',
            cognitiveLevel: 'HOTS',
            topic: 'Tafsir Ringkas Surah Al-Maun',
            rubric: { score3: 'Menjelaskan pesan pokok Surah Al-Ma\'un dan menyebutkan 2 larangan di dalamnya secara tepat.', score2: 'Pesan pokok benar namun hanya 1 contoh larangan.', score1: 'Jawaban masih terlalu umum.', score0: 'Kosong.' }
        },
        {
            minGrade: 5, maxGrade: 6,
            question: 'Apa perbedaan utama antara sikap ikhlas beramal dan sikap ria? Jelaskan mengapa sikap ria harus dijauhi dalam beribadah maupun membantu teman!',
            correctAnswer: 'Ikhlas adalah melakukan kebaikan semata-mata mengharap rida Allah Swt., sedangkan ria adalah beramal agar dilihat dan dipuji manusia. Ria harus dijauhi karena dapat merusak pahala amal saleh dan menumbuhkan kesombongan.',
            cognitiveLevel: 'HOTS',
            topic: 'Ikhlas dan Menjauhi Ria',
            rubric: { score3: 'Membedakan ikhlas dan ria secara jelas serta menjelaskan bahaya sikap ria.', score2: 'Definisi benar tetapi alasan menjauhi ria kurang mendalam.', score1: 'Hanya menjelaskan satu istilah.', score0: 'Kosong.' }
        }
    ],
    koding: [
        {
            minGrade: 1, maxGrade: 2,
            question: 'Sebutkan 3 bagian utama perangkat komputer beserta fungsi sederhananya masing-masing (misalnya monitor, keyboard, dan mouse)!',
            correctAnswer: '1. Monitor: layar untuk menampilkan gambar dan tulisan. 2. Keyboard: papan tombol untuk mengetik huruf dan angka. 3. Mouse: alat genggam untuk mengarahkan kursor dan memilih menu di layar.',
            cognitiveLevel: 'LOTS',
            topic: 'Mengenal Perangkat Komputer',
            rubric: { score3: 'Menyebutkan 3 perangkat beserta fungsinya secara tepat.', score2: 'Menyebutkan 2 perangkat beserta fungsinya.', score1: 'Hanya menyebutkan nama perangkat.', score0: 'Kosong.' }
        },
        {
            minGrade: 1, maxGrade: 2,
            question: 'Tuliskan 4 langkah berurutan (algoritma sederhana) cara menggosok gigi sebelum tidur malam agar gigi bersih!',
            correctAnswer: '1. Ambil sikat gigi dan oleskan pasta gigi secukupnya. 2. Sikat seluruh permukaan gigi depan dan belakang secara lembut. 3. Berkumur dengan air bersih sampai busa hilang. 4. Cuci kembali sikat gigi lalu simpan di tempat bersih.',
            cognitiveLevel: 'LOTS',
            topic: 'Algoritma Kebiasaan Sehari-hari',
            rubric: { score3: 'Menuliskan 4 langkah runtut, logis, dan mudah diikuti.', score2: 'Menuliskan 3 langkah benar.', score1: 'Langkah kurang urut.', score0: 'Kosong.' }
        },
        {
            minGrade: 1, maxGrade: 2,
            question: 'Perhatikan pola bentuk berikut: "Segitiga - Persegi - Lingkaran - Segitiga - Persegi - Lingkaran". Jika kamu melanjutkan pola itu sebanyak 3 bentuk lagi, tuliskan urutannya dan jelaskan polanya!',
            correctAnswer: 'Tiga bentuk berikutnya: Segitiga - Persegi - Lingkaran. Penjelasan: Pola berulang tetap setiap tiga gambar secara bergantian.',
            cognitiveLevel: 'MOTS',
            topic: 'Melanjutkan Pola Berulang',
            rubric: { score3: 'Menuliskan urutan lanjutan dengan benar dan menjelaskan aturan polanya.', score2: 'Urutan benar tanpa penjelasan.', score1: 'Urutan masih keliru.', score0: 'Kosong.' }
        },
        {
            minGrade: 3, maxGrade: 4,
            question: 'Jelaskan apa yang dimaksud dengan bug dan debugging saat menyusun blok perintah di program komputer, serta mengapa kita perlu menguji program setelah dibuat!',
            correctAnswer: 'Bug adalah kesalahan atau gangguan pada kode yang membuat program tidak berjalan semestinya. Debugging adalah proses mencari dan memperbaiki bug. Pengujian memastikan seluruh urutan perintah berjalan benar tanpa kesalahan.',
            cognitiveLevel: 'MOTS',
            topic: 'Konsep Bug dan Pengujian',
            rubric: { score3: 'Menjelaskan bug, debugging, serta tujuan pengujian program dengan tepat.', score2: 'Dua dari tiga poin dijelaskan dengan benar.', score1: 'Hanya 1 poin singkat.', score0: 'Kosong.' }
        },
        {
            minGrade: 3, maxGrade: 4,
            question: 'Berikan 2 contoh penggunaan blok percabangan (JIKA ... MAKA ...) dalam permainan edukasi anak dan jelaskan apa yang terjadi bila syaratnya tidak terpenuhi!',
            correctAnswer: '1. JIKA karakter menyentuh bintang MAKA skor bertambah 1 (jika tidak menyentuh, skor tetap). 2. JIKA menyentuh rintangan duri MAKA nyawa berkurang 1 (jika tidak menyentuh, karakter terus berjalan aman).',
            cognitiveLevel: 'HOTS',
            topic: 'Penerapan Logika Percabangan',
            rubric: { score3: 'Memberi 2 contoh IF-THEN yang logis lengkap dengan kondisi tidak terpenuhi.', score2: 'Memberi 1 contoh lengkap atau 2 contoh tanpa kondisi tidak terpenuhi.', score1: 'Contoh masih kabur.', score0: 'Kosong.' }
        },
        {
            minGrade: 3, maxGrade: 4,
            question: 'Sebutkan 3 cara membedakan informasi yang benar dan berita bohong (hoaks) ketika membaca artikel di internet!',
            correctAnswer: '1. Periksa sumber situs atau lembaganya apakah resmi dan tepercaya. 2. Bandingkan kebenarannya dengan dua sumber berita kredibel lainnya. 3. Waspadai judul berlebihan yang memancing emosi serta periksa tanggal terbitnya.',
            cognitiveLevel: 'HOTS',
            topic: 'Verifikasi Informasi Digital',
            rubric: { score3: 'Menyebutkan 3 langkah verifikasi informasi digital secara tepat.', score2: 'Menyebutkan 2 langkah yang benar.', score1: 'Hanya 1 langkah.', score0: 'Kosong.' }
        },
        {
            minGrade: 5, maxGrade: 6,
            question: 'Bagaimana prinsip kerja sistem Kecerdasan Artifisial (AI) pengenal gambar buah dari proses pengumpulan data hingga menebak foto baru? Jelaskan dalam 3 tahap!',
            correctAnswer: '1. Pengumpulan Data (Dataset): mengumpulkan ratusan foto buah berlabel (misal apel dan pisang). 2. Pelatihan Model (Training): AI mempelajari ciri pola warna dan bentuk dari data latih. 3. Prediksi (Testing): saat diberi foto buah baru, AI mencocokkan polanya dan menebak jenis buah.',
            cognitiveLevel: 'HOTS',
            topic: 'Alur Kerja Pembelajaran Mesin',
            rubric: { score3: 'Menjelaskan ketiga tahap (Dataset, Training, Prediksi) secara runtut dan tepat.', score2: 'Menjelaskan 2 tahap dengan benar.', score1: 'Penjelasan masih kurang terstruktur.', score0: 'Kosong.' }
        },
        {
            minGrade: 5, maxGrade: 6,
            question: 'Tuliskan langkah-langkah membuat kata sandi (password) akun belajar digital yang kuat beserta 2 hal yang harus dihindari agar akun tidak mudah diretas!',
            correctAnswer: 'Cara membuat sandi kuat: gabungkan minimal 8–12 karakter terdiri dari huruf besar, huruf kecil, angka, dan simbol unik (contoh: Kelas#6B!Jaya). Yang dihindari: memakai tanggal lahir/urutan "123456" dan membagikan sandi kepada orang lain.',
            cognitiveLevel: 'MOTS',
            topic: 'Keamanan Kata Sandi Akun',
            rubric: { score3: 'Menjelaskan syarat sandi kuat dan 2 larangan keamanan akun dengan tepat.', score2: 'Syarat sandi benar dengan 1 hal yang dihindari.', score1: 'Jawaban sangat singkat.', score0: 'Kosong.' }
        },
        {
            minGrade: 5, maxGrade: 6,
            question: 'Jelaskan 4 pilar utama Berpikir Komputasional (Dekomposisi, Pengenalan Pola, Abstraksi, dan Algoritma) beserta contoh penerapannya saat merapikan lemari buku kelas!',
            correctAnswer: '1. Dekomposisi: membagi tugas menjadi sortir buku, lap rak, dan susun ulang. 2. Pengenalan Pola: mengelompokkan buku yang sama (Matematika dengan Matematika). 3. Abstraksi: fokus pada judul/mata pelajaran tanpa melihat warna sampul semata. 4. Algoritma: langkah berurutan mulai mengeluarkan buku, mengelap rak, hingga menata sesuai label.',
            cognitiveLevel: 'HOTS',
            topic: 'Empat Pilar Komputasional',
            rubric: { score3: 'Menjelaskan keempat pilar beserta contoh penerapannya secara runtut dan logis.', score2: 'Menjelaskan 3 pilar dengan benar.', score1: 'Menjelaskan 1–2 pilar.', score0: 'Kosong.' }
        }
    ],
    mulok: [
        {
            minGrade: 1, maxGrade: 2,
            question: 'Tuliskeun 3 conto kadaharan atawa inuman sapopoé sarta rasana dina Basa Sunda (contona manis, haseum, atawa asin)!',
            correctAnswer: 'Conto: 1. Gula atawa madu rasana amis. 2. Jeruk mipis rasana haseum. 3. Uyah rasana asin.',
            cognitiveLevel: 'LOTS',
            topic: 'Rasa Kadaharan Basa Sunda',
            rubric: { score3: 'Nuliskeun 3 conto kadaharan jeung rasana dina Basa Sunda kalawan bener.', score2: 'Nuliskeun 2 conto bener.', score1: 'Ngan 1 conto.', score0: 'Kosong.' }
        },
        {
            minGrade: 1, maxGrade: 2,
            question: 'Tuliskeun ngaran 4 anggota awak manusa dina Basa Sunda sarta gunana masing-masing!',
            correctAnswer: '1. Panon (soca) pikeun ningali. 2. Ceuli (cepil) pikeun ngadéngé. 3. Irung (pangambung) pikeun ngambeu. 4. Leungeun (panangan) pikeun nyekel atawa nulis.',
            cognitiveLevel: 'LOTS',
            topic: 'Anggota Awak jeung Gunana',
            rubric: { score3: 'Nuliskeun 4 anggota awak dina Basa Sunda sarta gunana kalawan bener.', score2: 'Nuliskeun 2–3 anggota awak bener.', score1: 'Ngan 1 anggota awak.', score0: 'Kosong.' }
        },
        {
            minGrade: 1, maxGrade: 2,
            question: 'Jieun 2 kalimah basajan dina Basa Sunda anu nyaritakeun kagiatan hidep di buruan sakola waktu istirahat!',
            correctAnswer: '1. Abdi sareng réréncangan ulin babarengan di buruan sakola. 2. Sanggeus istirahat, abdi miceun runtah kana wadahna.',
            cognitiveLevel: 'MOTS',
            topic: 'Kalimah Kagiatan Sakola',
            rubric: { score3: 'Nuliskeun 2 kalimah Basa Sunda anu merenah tur jelas maksudna.', score2: 'Ngan 1 kalimah anu merenah.', score1: 'Kalimah kurang lengkep.', score0: 'Kosong.' }
        },
        {
            minGrade: 3, maxGrade: 4,
            question: 'Tuliskeun 3 kecap pagawéan dina Basa Sunda sarta jieun masing-masing hiji conto kalimahna!',
            correctAnswer: '1. Maca: Roni nuju maca buku dongéng di perpustakaan. 2. Nulis: Susi nulis surat pikeun nini di lembur. 3. Nyiram: Unggal isuk Usep nyiram kembang di buruan.',
            cognitiveLevel: 'MOTS',
            topic: 'Kecap Pagawéan Basa Sunda',
            rubric: { score3: 'Nuliskeun 3 kecap pagawéan Basa Sunda jeung 3 kalimah anu bener.', score2: 'Nuliskeun 2 kecap jeung kalimah bener.', score1: 'Ngan nyebut kecap tanpa kalimah.', score0: 'Kosong.' }
        },
        {
            minGrade: 5, maxGrade: 6,
            question: 'Jéntrékeun bédana kecap rajékan dwipurwa jeung dwilingga dina Basa Sunda sarta béré masing-masing 2 conto kecapna!',
            correctAnswer: 'Dwipurwa nyaéta ngulang engang mimiti kecap dasar (conto: tatanya, sasapu, papanggih). Dwilingga nyaéta ngulang sagemblengna kecap dasar, boh dwimurni boh dwiréka (conto: buku-buku, tulas-tulis, imah-imah).',
            cognitiveLevel: 'HOTS',
            topic: 'Kecap Rajékan Sunda',
            rubric: { score3: 'Ngajelaskeun béda dwipurwa-dwilingga kalawan bener sarta méré 2 conto masing-masing.', score2: 'Penjelasan bener tapi contona kurang lengkep.', score1: 'Ngan ngajelaskeun hiji jinis.', score0: 'Kosong.' }
        }
    ]
};
