import type { QuestionBankItemPG } from './questionBankHelper';

// Extended PG banks (Part 1: Bahasa Indonesia, Pendidikan Pancasila, IPAS, PJOK)
// Every item is distinct from base banks and scoped accurately for Kurikulum Merdeka SD (Kelas 1-6).

export const EXTENDED_INDO_PG: QuestionBankItemPG[] = [
    // --- FASE A (KELAS 1 - 2) ---
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Rani tidak sengaja menyenggol botol minum milik Dito hingga jatuh ke lantai.',
        question: 'Kata santun yang sebaiknya langsung diucapkan oleh Rani kepada Dito adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Maaf ya, Dito, aku tidak sengaja' },
            { key: 'B', text: 'Biarin saja botolnya jatuh' },
            { key: 'C', text: 'Selamat ulang tahun, Dito' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Maaf ya, Dito, aku tidak sengaja' },
            { key: 'B', text: 'Terima kasih sudah jatuh' },
            { key: 'C', text: 'Selamat sore, Dito' },
            { key: 'D', text: 'Ayo cepat ambil sendiri' }
        ],
        correctAnswer: 'A',
        explanation: 'Saat berbuat salah atau tidak sengaja merugikan teman, kita wajib meminta maaf dengan tulus.',
        cognitiveLevel: 'LOTS',
        topic: 'Ungkapan Permintaan Maaf'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Sita ingin meminta bantuan kakaknya mengambilkan buku cerita di rak yang tinggi.',
        question: 'Kalimat permintaan tolong yang baik dan sopan untuk diucapkan Sita adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Kak, tolong ambilkan buku di rak atas, ya.' },
            { key: 'B', text: 'Cepat ambil buku itu sekarang!' },
            { key: 'C', text: 'Kakak tidak boleh pegang buku ini.' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Kak, tolong ambilkan buku di rak atas, ya.' },
            { key: 'B', text: 'Ambilkan sekarang juga!' },
            { key: 'C', text: 'Jangan berdiri di dekat rak buku.' },
            { key: 'D', text: 'Buku ini bukan milik kakak.' }
        ],
        correctAnswer: 'A',
        explanation: 'Menggunakan kata "tolong" membuat permintaan terdengar sopan dan menghargai orang lain.',
        cognitiveLevel: 'LOTS',
        topic: 'Ungkapan Permintaan Tolong'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Perhatikan urutan huruf vokal berikut ini: a, i, u, e, o.',
        question: 'Kata benda "meja" memiliki dua huruf vokal yaitu huruf ...',
        optionsFaseA: [
            { key: 'A', text: 'e dan a' },
            { key: 'B', text: 'm dan j' },
            { key: 'C', text: 'i dan o' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'e dan a' },
            { key: 'B', text: 'm dan j' },
            { key: 'C', text: 'a dan u' },
            { key: 'D', text: 'i dan e' }
        ],
        correctAnswer: 'A',
        explanation: 'Pada kata "meja", huruf vokalnya adalah e dan a, sedangkan m dan j adalah huruf konsonan.',
        cognitiveLevel: 'LOTS',
        topic: 'Huruf Vokal dan Konsonan'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Bacalah penggalan suku kata benda sekolah: "pen - sil".',
        question: 'Jika kedua suku kata tersebut digabung dengan tepat, benda yang dimaksud berguna untuk ...',
        optionsFaseA: [
            { key: 'A', text: 'Menulis di buku' },
            { key: 'B', text: 'Menyapu halaman' },
            { key: 'C', text: 'Memasak nasi' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menulis di buku tulis' },
            { key: 'B', text: 'Menyapu halaman kelas' },
            { key: 'C', text: 'Memotong kertas tebal' },
            { key: 'D', text: 'Menyiram tanaman pot' }
        ],
        correctAnswer: 'A',
        explanation: 'Gabungan suku kata "pen-sil" membentuk kata pensil yang dipakai untuk menulis.',
        cognitiveLevel: 'LOTS',
        topic: 'Membaca Suku Kata'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Perhatikan kalimat perintah berikut: "Bukalah halaman sepuluh buku ceritamu [ ... ]"',
        question: 'Tanda baca yang tepat di akhir kalimat perintah atau seruan tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Tanda seru (!)' },
            { key: 'B', text: 'Tanda tanya (?)' },
            { key: 'C', text: 'Tanda koma (,)' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Tanda seru (!)' },
            { key: 'B', text: 'Tanda tanya (?)' },
            { key: 'C', text: 'Tanda koma (,)' },
            { key: 'D', text: 'Tanda hubung (-)' }
        ],
        correctAnswer: 'A',
        explanation: 'Kalimat perintah atau ajakan yang tegas diakhiri dengan tanda seru (!).',
        cognitiveLevel: 'LOTS',
        topic: 'Kalimat Perintah'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Ibu mengajak Edo merapikan mainan balok setelah selesai bermain di ruang keluarga.',
        question: 'Contoh kalimat ajakan yang santun kepada teman untuk belajar bersama adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Ayo kita belajar membaca bersama di teras!' },
            { key: 'B', text: 'Siapa yang membawa tas merah itu?' },
            { key: 'C', text: 'Jangan dekati meja belajar saya!' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Ayo kita belajar membaca bersama di teras!' },
            { key: 'B', text: 'Kapan sekolah kita mulai libur?' },
            { key: 'C', text: 'Dilarang masuk ke ruang guru!' },
            { key: 'D', text: 'Mengapa buku itu basah?' }
        ],
        correctAnswer: 'A',
        explanation: 'Kalimat ajakan ditandai dengan kata "ayo" atau "mari" untuk mengajak orang lain berbuat baik bersama.',
        cognitiveLevel: 'LOTS',
        topic: 'Kalimat Ajakan'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Di dinding perpustakaan kelas tertempel gambar papan bertuliskan: "JAGA KETENANGAN".',
        question: 'Maksud dari tanda peringatan singkat di dinding perpustakaan itu adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Siswa tidak boleh berteriak dan berisik saat membaca' },
            { key: 'B', text: 'Siswa boleh berlari kencang di antara rak buku' },
            { key: 'C', text: 'Siswa harus bernyanyi keras bersama teman' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Siswa tidak boleh berisik agar semua nyaman membaca' },
            { key: 'B', text: 'Siswa diperbolehkan bermain bola di dalam ruangan' },
            { key: 'C', text: 'Siswa dilarang meminjam buku cerita bergambar' },
            { key: 'D', text: 'Siswa wajib menutup buku sebelum pulang' }
        ],
        correctAnswer: 'A',
        explanation: 'Tanda "Jaga Ketenangan" mengingatkan pengunjung perpustakaan agar tetap tenang dan tidak gaduh.',
        cognitiveLevel: 'MOTS',
        topic: 'Memahami Simbol dan Tanda'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Bacalah cerita singkat ini:\n"Kiki melihat seekor anak kucing kehujanan di teras. Kiki lalu mengambil handuk kering untuk mengelap bulu anak kucing itu dan memberinya semangkuk susu hangat."',
        question: 'Sifat terpuji tokoh Kiki dalam cerita singkat di atas adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Penyayang dan suka menolong' },
            { key: 'B', text: 'Pemarah dan sombong' },
            { key: 'C', text: 'Penakut dan pemalas' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Penyayang binatang dan suka menolong' },
            { key: 'B', text: 'Pemarah dan keras kepala' },
            { key: 'C', text: 'Ceroboh dan pelupa' },
            { key: 'D', text: 'Kikir dan tidak peduli' }
        ],
        correctAnswer: 'A',
        explanation: 'Kiki menolong anak kucing yang kehujanan, menunjukkan watak penyayang dan peduli.',
        cognitiveLevel: 'MOTS',
        topic: 'Watak Tokoh Cerita'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Perhatikan dua kalimat berikut:\n(1) Ayah mencuci sepeda motor di halaman.\n(2) Adik menyiram bunga melati memakai gayung.',
        question: 'Kata kerja (tindakan yang dilakukan) pada kalimat nomor (1) adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Mencuci' },
            { key: 'B', text: 'Ayah' },
            { key: 'C', text: 'Halaman' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Mencuci' },
            { key: 'B', text: 'Ayah' },
            { key: 'C', text: 'Sepeda motor' },
            { key: 'D', text: 'Halaman' }
        ],
        correctAnswer: 'A',
        explanation: 'Kata kerja menyatakan kegiatan atau tindakan, yaitu "mencuci".',
        cognitiveLevel: 'LOTS',
        topic: 'Kata Kerja Dasar'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Hari Minggu pagi, Tari bersama keluarga berolahraga jalan santai mengelilingi taman kota yang sejuk.',
        question: 'Latar tempat berlangsungnya kegiatan Tari dan keluarga pada kalimat tersebut adalah di ...',
        optionsFaseA: [
            { key: 'A', text: 'Taman kota' },
            { key: 'B', text: 'Pasar ikan' },
            { key: 'C', text: 'Ruang kelas' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Taman kota' },
            { key: 'B', text: 'Pasar tradisional' },
            { key: 'C', text: 'Perpustakaan daerah' },
            { key: 'D', text: 'Stasiun kereta api' }
        ],
        correctAnswer: 'A',
        explanation: 'Latar tempat adalah lokasi kejadian cerita, yakni di taman kota.',
        cognitiveLevel: 'LOTS',
        topic: 'Unsur Cerita (Latar)'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Perhatikan kalimat acak berikut: "membeli - Ibu - di - sayur - pasar".',
        question: 'Susunan kalimat yang benar dan bermakna dari kata-kata acak tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Ibu membeli sayur di pasar.' },
            { key: 'B', text: 'Pasar membeli sayur di Ibu.' },
            { key: 'C', text: 'Sayur di pasar membeli Ibu.' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Ibu membeli sayur di pasar.' },
            { key: 'B', text: 'Di pasar sayur membeli Ibu.' },
            { key: 'C', text: 'Membeli Ibu di pasar sayur.' },
            { key: 'D', text: 'Sayur Ibu di pasar membeli.' }
        ],
        correctAnswer: 'A',
        explanation: 'Susunan kalimat berpola Subjek-Predikat-Objek-Keterangan adalah "Ibu membeli sayur di pasar."',
        cognitiveLevel: 'MOTS',
        topic: 'Menyusun Kalimat Sederhana'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Bima sangat senang karena mendapat hadiah tas sekolah baru dari nenek saat liburan.',
        question: 'Perasaan yang dialami oleh Bima ketika menerima hadiah dari nenek adalah perasaan ...',
        optionsFaseA: [
            { key: 'A', text: 'Gembira dan bersyukur' },
            { key: 'B', text: 'Sedih dan kecewa' },
            { key: 'C', text: 'Takut dan gugup' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Gembira dan bersyukur' },
            { key: 'B', text: 'Sedih dan menangis' },
            { key: 'C', text: 'Marah dan kesal' },
            { key: 'D', text: 'Takut dan cemas' }
        ],
        correctAnswer: 'A',
        explanation: 'Kata "sangat senang" menggambarkan ekspresi perasaan gembira.',
        cognitiveLevel: 'LOTS',
        topic: 'Mengenal Perasaan'
    },

    // --- FASE B (KELAS 3 - 4) ---
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Perhatikan kalimat aktif berikut: "Rudi menendang bola ke arah gawang."',
        question: 'Pada kalimat berpola S-P-O-K tersebut, kata "bola" berkedudukan sebagai ...',
        optionsFaseA: [
            { key: 'A', text: 'Objek (O)' },
            { key: 'B', text: 'Subjek (S)' },
            { key: 'C', text: 'Predikat (P)' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Subjek (S)' },
            { key: 'B', text: 'Predikat (P)' },
            { key: 'C', text: 'Objek (O)' },
            { key: 'D', text: 'Keterangan tempat (K)' }
        ],
        correctAnswer: 'C',
        explanation: 'Rudi (Subjek), menendang (Predikat), bola (Objek), ke arah gawang (Keterangan tempat).',
        cognitiveLevel: 'MOTS',
        topic: 'Struktur Kalimat SPOK'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Bacalah puisi anak berikut:\n"Burung pipit berkicau merdu,\nMenyambut mentari pagi yang cerah,\nHati riang melangkah ke sekolah."',
        question: 'Suasana yang tergambar dalam bait puisi anak di atas adalah suasana yang ...',
        optionsFaseA: [
            { key: 'A', text: 'Ceria dan penuh semangat' },
            { key: 'B', text: 'Menyeramkan dan gelap' },
            { key: 'C', text: 'Sedih dan kesepian' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Ceria, segar, dan penuh semangat' },
            { key: 'B', text: 'Mencekam dan menakutkan' },
            { key: 'C', text: 'Sepi dan penuh kesedihan' },
            { key: 'D', text: 'Gelisah dan kecewa' }
        ],
        correctAnswer: 'A',
        explanation: 'Kata "berkicau merdu", "pagi yang cerah", dan "hati riang" menunjukkan suasana ceria dan bersemangat.',
        cognitiveLevel: 'MOTS',
        topic: 'Apresiasi Puisi Anak'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Galih menyalakan lampu belajar di kamarnya, namun ia selalu mematikannya kembali saat keluar ruangan.',
        question: 'Kata berawalan me- yang terbentuk dari kata dasar "nyala" pada kalimat tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Menyalakan' },
            { key: 'B', text: 'Mematikan' },
            { key: 'C', text: 'Kembali' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menyalakan' },
            { key: 'B', text: 'Mematikan' },
            { key: 'C', text: 'Keluar' },
            { key: 'D', text: 'Ruangan' }
        ],
        correctAnswer: 'A',
        explanation: 'Kata dasar "nyala" mendapat imbuhan me- + -kan menjadi "menyalakan".',
        cognitiveLevel: 'LOTS',
        topic: 'Imbuhan Awalan Me-'
    },
    {
        minGrade: 3, maxGrade: 5,
        stimulus: 'Perhatikan kalimat transitif dan intransitif berikut:\n(1) Lani menyiram tanaman hias.\n(2) Adik tertidur pulas di sofa.',
        question: 'Kalimat nomor (2) disebut kalimat intransitif karena ...',
        optionsFaseA: [
            { key: 'A', text: 'Tidak memerlukan objek' },
            { key: 'B', text: 'Memiliki dua objek sekaligus' },
            { key: 'C', text: 'Tidak memiliki subjek pelaku' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Predikatnya tidak memerlukan kehadiran objek' },
            { key: 'B', text: 'Predikatnya wajib diikuti objek langsung' },
            { key: 'C', text: 'Kalimatnya diakhiri tanda tanya' },
            { key: 'D', text: 'Tidak mengandung kata kerja sama sekali' }
        ],
        correctAnswer: 'A',
        explanation: 'Kalimat intransitif memiliki kata kerja yang tidak membutuhkan objek, misalnya "tertidur".',
        cognitiveLevel: 'MOTS',
        topic: 'Kalimat Transitif dan Intransitif'
    },
    {
        minGrade: 3, maxGrade: 5,
        stimulus: 'Di sebuah poster sekolah tertulis kalimat: "BUANGLAH SAMPAH PADA TEMPATNYA AGAR SEKOLAH BEBAS PENYAKIT!"',
        question: 'Tujuan utama penulisan poster layanan masyarakat tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Mengajak warga sekolah menjaga kebersihan lingkungan' },
            { key: 'B', text: 'Menjual tempat sampah plastik beraneka warna' },
            { key: 'C', text: 'Melarang siswa membawa bekal makanan' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Mengimbau dan mengajak warga sekolah menjaga kebersihan lingkungan' },
            { key: 'B', text: 'Mempromosikan penjualan sapu lidi di koperasi' },
            { key: 'C', text: 'Menceritakan sejarah berdirinya gedung sekolah' },
            { key: 'D', text: 'Melarang seluruh siswa bermain di halaman' }
        ],
        correctAnswer: 'A',
        explanation: 'Poster layanan masyarakat bertujuan membujuk atau mengimbau pembaca melakukan kebiasaan baik.',
        cognitiveLevel: 'MOTS',
        topic: 'Teks Poster dan Imbauan'
    },
    {
        minGrade: 3, maxGrade: 5,
        stimulus: 'Perhatikan pasangan kata berhomonim berikut:\n(1) Bisa ular kobra sangat berbahaya.\n(2) Nadia bisa memainkan alat musik pianika dengan lancar.',
        question: 'Perbedaan makna kata "bisa" pada kalimat (1) dan kalimat (2) secara berurutan adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Racun ular dan mampu/dapat' },
            { key: 'B', text: 'Dapat dan racun ular' },
            { key: 'C', text: 'Keduanya berarti mampu' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Racun hewan berbisa dan mampu atau dapat melakukan sesuatu' },
            { key: 'B', text: 'Mampu melakukan sesuatu dan racun hewan' },
            { key: 'C', text: 'Gigitan tajam dan suara nyaring' },
            { key: 'D', text: 'Kecepatan gerak dan kelenturan jari' }
        ],
        correctAnswer: 'A',
        explanation: 'Kata homonim memiliki ejaan dan lafal sama tetapi makna berbeda: racun (1) dan mampu (2).',
        cognitiveLevel: 'HOTS',
        topic: 'Kata Homonim'
    },
    {
        minGrade: 3, maxGrade: 6,
        stimulus: 'Nayla ingin mengetahui jadwal kegiatan lomba membaca puisi di kota tempat tinggalnya dengan mewawancarai panitia lomba.',
        question: 'Hal pertama yang harus disiapkan oleh Nayla sebelum melaksanakan wawancara dengan narasumber adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Menyusun daftar pertanyaan yang jelas dan sesuai topik' },
            { key: 'B', text: 'Memaksa narasumber menjawab pertanyaan pribadi' },
            { key: 'C', text: 'Memotong pembicaraan saat narasumber menjelaskan' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menentukan tema dan menyusun daftar pertanyaan yang terstruktur' },
            { key: 'B', text: 'Langsung mencetak laporan tanpa bertemu narasumber' },
            { key: 'C', text: 'Menyela setiap kalimat narasumber dengan tergesa-gesa' },
            { key: 'D', text: 'Menanyakan hal-hal pribadi di luar topik lomba' }
        ],
        correctAnswer: 'A',
        explanation: 'Persiapan wawancara meliputi menentukan topik, menghubungi narasumber, dan menyusun daftar pertanyaan.',
        cognitiveLevel: 'MOTS',
        topic: 'Wawancara Narasumber'
    },
    {
        minGrade: 3, maxGrade: 6,
        stimulus: 'Bacalah penggalan paragraf berikut:\n"Pohon kelapa dijuluki sebagai pohon serbaguna. Buahnya dapat diminum airnya untuk melepas dahaga. Daunnya yang muda biasa dianyam menjadi kulit ketupat, sedangkan batangnya sering dimanfaatkan untuk bahan bangunan."',
        question: 'Simpulan yang paling tepat berdasarkan isi paragraf tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Hampir seluruh bagian pohon kelapa bermanfaat bagi manusia' },
            { key: 'B', text: 'Pohon kelapa hanya bisa tumbuh di daerah pegunungan dingin' },
            { key: 'C', text: 'Batang pohon kelapa tidak dapat digunakan sama sekali' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Setiap bagian dari pohon kelapa memiliki banyak kegunaan bagi manusia' },
            { key: 'B', text: 'Buah kelapa hanya berguna saat hari raya saja' },
            { key: 'C', text: 'Pohon kelapa membutuhkan pupuk khusus agar berdaun lebat' },
            { key: 'D', text: 'Batang kelapa lebih rapuh daripada batang pohon pisang' }
        ],
        correctAnswer: 'A',
        explanation: 'Simpulan merangkum buah, daun, dan batang kelapa yang semuanya bermanfaat sehingga disebut pohon serbaguna.',
        cognitiveLevel: 'HOTS',
        topic: 'Menyimpulkan Isi Paragraf'
    },
    {
        minGrade: 3, maxGrade: 5,
        stimulus: 'Perhatikan penggunaan kata penghubung (konjungsi) pada kalimat berikut:\n"Hujan turun sangat deras, [ ... ] Farhan tetap berangkat ke sekolah dengan mengenakan jas hujan."',
        question: 'Kata hubung pertentangan yang tepat untuk melengkapi bagian rumpang tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'tetapi' },
            { key: 'B', text: 'sehingga' },
            { key: 'C', text: 'karena' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'tetapi' },
            { key: 'B', text: 'sehingga' },
            { key: 'C', text: 'karena' },
            { key: 'D', text: 'apabila' }
        ],
        correctAnswer: 'A',
        explanation: 'Kata "tetapi" atau "namun" dipakai untuk menghubungkan dua hal yang berlawanan/bertentangan.',
        cognitiveLevel: 'MOTS',
        topic: 'Kata Penghubung (Konjungsi)'
    },
    {
        minGrade: 3, maxGrade: 6,
        stimulus: 'Perhatikan kalimat langsung berikut: Ibu berkata, "Jangan lupa membawa payung sebelum berangkat!"',
        question: 'Apabila diubah menjadi kalimat tidak langsung, penulisan yang tepat adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Ibu mengingatkan agar tidak lupa membawa payung sebelum berangkat.' },
            { key: 'B', text: 'Ibu berkata, "Bawalah payungmu sekarang juga!"' },
            { key: 'C', text: 'Payung berkata kepada Ibu agar tidak tertinggal.' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Ibu berpesan agar anaknya tidak lupa membawa payung sebelum berangkat.' },
            { key: 'B', text: 'Ibu berkata, "Jangan lupa membawa payung sebelum berangkat!"' },
            { key: 'C', text: 'Anaknya menyuruh Ibu membawa payung saat hujan.' },
            { key: 'D', text: 'Ibu melarang membawa payung ke sekolah.' }
        ],
        correctAnswer: 'A',
        explanation: 'Kalimat tidak langsung melaporkan ucapan tanpa tanda petik ganda dan menyesuaikan kata ganti/bentuk kalimatnya.',
        cognitiveLevel: 'HOTS',
        topic: 'Kalimat Langsung dan Tidak Langsung'
    },

    // --- FASE C (KELAS 5 - 6) ---
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Bacalah teks eksplanasi berikut:\n"Terjadinya pelangi disebabkan oleh pembiasan dan penguraian cahaya matahari oleh titik-titik air hujan di udara. Cahaya putih matahari terurai menjadi tujuh warna spektrum yaitu merah, jingga, kuning, hijau, biru, nila, dan ungu."',
        question: 'Mengapa paragraf di atas digolongkan ke dalam teks eksplanasi ilmiah?',
        optionsFaseA: [
            { key: 'A', text: 'Menjelaskan proses sebab-akibat terjadinya fenomena alam secara faktual' },
            { key: 'B', text: 'Menceritakan kisah khayalan peri pelangi di negeri awan' },
            { key: 'C', text: 'Mengajak pembaca membeli cat air tujuh warna' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menjelaskan proses sebab-akibat terjadinya fenomena alam secara faktual dan ilmiah' },
            { key: 'B', text: 'Memaparkan langkah memasak makanan tradisional daerah' },
            { key: 'C', text: 'Berisi dongeng fiksi tentang dewa langit dan bidadari' },
            { key: 'D', text: 'Mengiklankan produk kaca pembesar untuk praktikum' }
        ],
        correctAnswer: 'A',
        explanation: 'Teks eksplanasi memaparkan proses mengapa dan bagaimana suatu peristiwa alam atau sosial terjadi berdasarkan fakta ilmiah.',
        cognitiveLevel: 'MOTS',
        topic: 'Teks Eksplanasi'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Perhatikan formulir pendaftaran anggota perpustakaan sekolah:\nNama Lengkap : .......................\nTempat, Tgl Lahir : .......................\nAlamat Rumah : .......................',
        question: 'Data yang paling tepat diisikan pada kolom "Tempat, Tgl Lahir" oleh Kayla yang lahir di Bandung pada 14 Agustus 2014 adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Bandung, 14 Agustus 2014' },
            { key: 'B', text: 'Jalan Merdeka Nomor 12' },
            { key: 'C', text: 'Kayla Putri Pratiwi' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Bandung, 14 Agustus 2014' },
            { key: 'B', text: 'Jalan Merdeka No. 12 Bandung' },
            { key: 'C', text: 'SDN Sukatinggal Kelas VI' },
            { key: 'D', text: 'Membaca dan Melukis' }
        ],
        correctAnswer: 'A',
        explanation: 'Kolom Tempat, Tanggal Lahir diisi nama kota kelahiran diikuti koma dan tanggal, bulan, serta tahun lahir.',
        cognitiveLevel: 'LOTS',
        topic: 'Pengisian Formulir'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Cermati kutipan pidato berikut:\n"Hadirin yang saya hormati, marilah kita bersama-sama menjaga kebersihan sungai dari sampah plastik demi masa depan anak cucu kita."',
        question: 'Berdasarkan isinya, bagian kutipan pidato tersebut termasuk bagian ...',
        optionsFaseA: [
            { key: 'A', text: 'Isi atau ajakan inti pidato' },
            { key: 'B', text: 'Salam pembuka pidato' },
            { key: 'C', text: 'Daftar riwayat hidup pembicara' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Isi pidato berupa ajakan persuasif' },
            { key: 'B', text: 'Salam pembuka dan ucapan terima kasih penutup' },
            { key: 'C', text: 'Biodata lengkap penulis naskah' },
            { key: 'D', text: 'Lampiran daftar hadir peserta' }
        ],
        correctAnswer: 'A',
        explanation: 'Bagian yang menyampaikan gagasan utama dan ajakan kepada pendengar adalah bagian isi pidato.',
        cognitiveLevel: 'MOTS',
        topic: 'Teks Pidato Persuasif'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Perhatikan daftar kata berikut: (1) apotek, (2) antre, (3) ijasah, (4) nasihat.',
        question: 'Kata yang penulisannya TIDAK baku menurut Pedoman Ejaan Bahasa Indonesia (EYD) dan KBBI adalah nomor ...',
        optionsFaseA: [
            { key: 'A', text: '(3) ijasah, seharusnya ijazah' },
            { key: 'B', text: '(1) apotek, seharusnya apotik' },
            { key: 'C', text: '(2) antre, seharusnya antri' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '(3) ijasah, bentuk bakunya adalah ijazah' },
            { key: 'B', text: '(1) apotek, bentuk bakunya adalah apotik' },
            { key: 'C', text: '(2) antre, bentuk bakunya adalah antri' },
            { key: 'D', text: '(4) nasihat, bentuk bakunya adalah nasehat' }
        ],
        correctAnswer: 'A',
        explanation: 'Bentuk baku dalam KBBI adalah apotek, antre, ijazah, dan nasihat.',
        cognitiveLevel: 'MOTS',
        topic: 'Kata Baku KBBI'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Bacalah cuplikan surat pribadi berikut:\n"Halo Sahabatku Maya, apa kabar? Semoga kamu sekeluarga selalu sehat di Yogyakarta. Minggu depan aku berencana berkunjung ke rumahmu."',
        question: 'Bahasa yang digunakan pada kutipan surat pribadi tersebut bersifat ...',
        optionsFaseA: [
            { key: 'A', text: 'Akrab, santai, dan komunikatif namun tetap sopan' },
            { key: 'B', text: 'Kaku, resmi, dan memakai nomor surat dinas' },
            { key: 'C', text: 'Kasar dan penuh perintah tegas' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Akrab, pribadi, dan komunikatif tetapi tetap santun' },
            { key: 'B', text: 'Sangat resmi memakai kop surat dan stempel instansi' },
            { key: 'C', text: 'Berisi daftar belanjaan barang elektronik' },
            { key: 'D', text: 'Memakai istilah hukum kenegaraan yang kaku' }
        ],
        correctAnswer: 'A',
        explanation: 'Surat pribadi antarteman memakai ragam bahasa akrab dan santai tanpa kop atau nomor surat resmi.',
        cognitiveLevel: 'MOTS',
        topic: 'Surat Pribadi dan Resmi'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Perhatikan kalimat bermajas hiperbola berikut: "Suara sorak-sorai penonton di stadion itu menggelegar membelah angkasa."',
        question: 'Makna ungkapan "menggelegar membelah angkasa" pada kalimat di atas menggambarkan suara yang ...',
        optionsFaseA: [
            { key: 'A', text: 'Sangat keras, ramai, dan bergemuruh' },
            { key: 'B', text: 'Pelan seperti bisikan daun' },
            { key: 'C', text: 'Sunyi senyap tanpa ada satu orang pun' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Sangat keras, ramai, dan membahana di stadion' },
            { key: 'B', text: 'Terlalu pelan sehingga tidak terdengar' },
            { key: 'C', text: 'Terputus-putus karena hujan gerimis' },
            { key: 'D', text: 'Hening dan menenangkan telinga' }
        ],
        correctAnswer: 'A',
        explanation: 'Majas hiperbola melebih-lebihkan kenyataan untuk menekankan kesan suara sorakan yang luar biasa keras.',
        cognitiveLevel: 'HOTS',
        topic: 'Majas Hiperbola'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Reza membaca buku berjudul "Mengenal Pahlawan Kemerdekaan" setebal 120 halaman. Sebelum membaca isi bab, ia mengecek urutan halaman setiap bab.',
        question: 'Bagian buku yang memuat judul-judul bab beserta nomor halamannya secara urut berada di bagian ...',
        optionsFaseA: [
            { key: 'A', text: 'Daftar isi' },
            { key: 'B', text: 'Glosarium' },
            { key: 'C', text: 'Biografi penulis' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Daftar isi' },
            { key: 'B', text: 'Glosarium (daftar istilah)' },
            { key: 'C', text: 'Daftar pustaka' },
            { key: 'D', text: 'Sampul belakang' }
        ],
        correctAnswer: 'A',
        explanation: 'Daftar isi terletak di halaman depan buku untuk memudahkan pembaca menemukan bab dan nomor halamannya.',
        cognitiveLevel: 'LOTS',
        topic: 'Bagian-Bagian Buku'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Perhatikan dua kalimat berikut:\n(1) Menurut saya, warna biru membuat ruang kelas terasa lebih sejuk.\n(2) Indonesia merayakan Hari Kemerdekaan setiap tanggal 17 Agustus.',
        question: 'Kalimat yang termasuk kalimat opini karena berupa pendapat pribadi seseorang adalah nomor ...',
        optionsFaseA: [
            { key: 'A', text: 'Kalimat (1)' },
            { key: 'B', text: 'Kalimat (2)' },
            { key: 'C', text: 'Keduanya kalimat fakta' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Kalimat (1)' },
            { key: 'B', text: 'Kalimat (2)' },
            { key: 'C', text: 'Keduanya kalimat fakta' },
            { key: 'D', text: 'Keduanya kalimat perintah' }
        ],
        correctAnswer: 'A',
        explanation: 'Frasa "menurut saya" dan penilaian subjektif "lebih sejuk" menandakan kalimat opini.',
        cognitiveLevel: 'MOTS',
        topic: 'Membedakan Fakta dan Opini'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Ilham membaca dua artikel berita tentang manfaat daur ulang kertas bekas dan pengurangan sampah plastik di sekolah.',
        question: 'Kegiatan mencatat hal-hal terpenting dari bacaan dengan bahasa sendiri secara ringkas tanpa mengubah makna aslinya disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Meringkas (membuat ringkasan)' },
            { key: 'B', text: 'Menyalin seluruh halaman kata demi kata' },
            { key: 'C', text: 'Mengarang cerita fiksi baru' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Meringkas atau merangkum teks bacaan' },
            { key: 'B', text: 'Menyalin ulang seluruh paragraf tanpa pengurangan' },
            { key: 'C', text: 'Mengubah teks berita menjadi dongeng' },
            { key: 'D', text: 'Menghafal daftar pustaka buku' }
        ],
        correctAnswer: 'A',
        explanation: 'Ringkasan adalah penyajian singkat karangan asli dengan mempertahankan ide pokok dan urutan alur isinya.',
        cognitiveLevel: 'MOTS',
        topic: 'Meringkas Teks Bacaan'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Dalam berita koran daerah terdapat kalimat: "Banjir bandang melanda pemukiman warga akibat saluran air tersumbat sampah rumah tangga."',
        question: 'Kata hubung "akibat" pada kalimat berita di atas menyatakan hubungan makna ...',
        optionsFaseA: [
            { key: 'A', text: 'Sebab-akibat' },
            { key: 'B', text: 'Perbandingan' },
            { key: 'C', text: 'Pilihan' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Hubungan sebab-akibat (kausalitas)' },
            { key: 'B', text: 'Hubungan syarat waktu' },
            { key: 'C', text: 'Hubungan pertentangan' },
            { key: 'D', text: 'Hubungan pemilihan dua benda' }
        ],
        correctAnswer: 'A',
        explanation: 'Saluran air tersumbat adalah penyebab terjadinya peristiwa banjir bandang.',
        cognitiveLevel: 'HOTS',
        topic: 'Hubungan Sebab-Akibat'
    }
];

export const EXTENDED_PANCASILA_PG: QuestionBankItemPG[] = [
    // --- FASE A (KELAS 1 - 2) ---
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Di ruang kelas terpampang lambang negara Indonesia yang gagah mencengkeram pita bertuliskan semboyan persatuan.',
        question: 'Nama lambang negara Kesatuan Republik Indonesia adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Garuda Pancasila' },
            { key: 'B', text: 'Merpati Putih' },
            { key: 'C', text: 'Harimau Sumatra' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Garuda Pancasila' },
            { key: 'B', text: 'Elang Jawa Putih' },
            { key: 'C', text: 'Cenderawasih Emas' },
            { key: 'D', text: 'Komodo Nusantara' }
        ],
        correctAnswer: 'A',
        explanation: 'Lambang negara Indonesia adalah Garuda Pancasila dengan perisai lima sila di dadanya.',
        cognitiveLevel: 'LOTS',
        topic: 'Lambang Negara'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Setiap hari Senin pagi, seluruh siswa berbaris rapi di lapangan sekolah mengikuti upacara pengibaran bendera.',
        question: 'Warna bendera pusaka Negara Kesatuan Republik Indonesia adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Merah dan Putih' },
            { key: 'B', text: 'Biru dan Kuning' },
            { key: 'C', text: 'Hijau dan Putih' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Merah dan Putih' },
            { key: 'B', text: 'Merah dan Biru' },
            { key: 'C', text: 'Kuning dan Hitam' },
            { key: 'D', text: 'Hijau dan Merah' }
        ],
        correctAnswer: 'A',
        explanation: 'Bendera negara Indonesia adalah Sang Merah Putih: merah berarti berani dan putih berarti suci.',
        cognitiveLevel: 'LOTS',
        topic: 'Identitas Nasional'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Keluarga Kiki membuat aturan sederhana di rumah agar semua anggota keluarga hidup tertib dan nyaman.',
        question: 'Contoh aturan baik yang harus ditaati anak di rumah pada malam hari adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Menyiapkan buku pelajaran dan tidur tidak terlalu malam' },
            { key: 'B', text: 'Menonton televisi sampai tengah malam' },
            { key: 'C', text: 'Berteriak keras saat adik sedang tidur' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menyiapkan buku esok hari lalu tidur tepat waktu' },
            { key: 'B', text: 'Bermain gim hingga larut tengah malam' },
            { key: 'C', text: 'Membuang sampah di bawah tempat tidur' },
            { key: 'D', text: 'Meninggalkan lampu menyala saat keluar rumah' }
        ],
        correctAnswer: 'A',
        explanation: 'Mempersiapkan alat sekolah dan tidur cukup adalah aturan disiplin yang baik di rumah.',
        cognitiveLevel: 'LOTS',
        topic: 'Aturan di Rumah'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Rafi beragama Islam sedangkan temannya, Kevin, beragama Kristen. Mereka berdua berteman akrab di sekolah.',
        question: 'Ketika Kevin merayakan hari raya keagamaannya, sikap baik yang harus ditunjukkan oleh Rafi adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Menghormati dan mengucapkan selamat dengan ramah' },
            { key: 'B', text: 'Menjauhi Kevin dan tidak mau menyapanya' },
            { key: 'C', text: 'Mengganggu ketenangan ibadah tetangga' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menghormati perayaannya serta tetap menjaga kerukunan' },
            { key: 'B', text: 'Memusuhi teman yang berbeda ibadah' },
            { key: 'C', text: 'Mengejek kebiasaan ibadah teman lain' },
            { key: 'D', text: 'Menolak bekerja kelompok dengannya' }
        ],
        correctAnswer: 'A',
        explanation: 'Saling menghormati kebebasan beragama adalah pengamalan Sila Pertama Pancasila.',
        cognitiveLevel: 'MOTS',
        topic: 'Toleransi Beragama'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Sebelum berangkat ke sekolah dasar, Nisa berpamitan dan mencium tangan ayah serta ibunya dengan santun.',
        question: 'Perbuatan Nisa tersebut menunjukkan sikap hormat dan bakti kepada ...',
        optionsFaseA: [
            { key: 'A', text: 'Kedua orang tua' },
            { key: 'B', text: 'Penjual mainan' },
            { key: 'C', text: 'Teman sebangku' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Kedua orang tua di rumah' },
            { key: 'B', text: 'Penjaga warung' },
            { key: 'C', text: 'Supir bus kota' },
            { key: 'D', text: 'Pengunjung taman' }
        ],
        correctAnswer: 'A',
        explanation: 'Berpamitan sebelum pergi merupakan wujud sopan santun dan kasih sayang kepada orang tua.',
        cognitiveLevel: 'LOTS',
        topic: 'Sopan Santun di Rumah'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Di papan perisai burung Garuda Pancasila terdapat lima gambar simbol yang berurutan dari sila 1 sampai sila 5.',
        question: 'Bunyi sila ketiga Pancasila yang dilambangkan oleh pohon beringin adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Persatuan Indonesia' },
            { key: 'B', text: 'Ketuhanan Yang Maha Esa' },
            { key: 'C', text: 'Keadilan sosial bagi seluruh rakyat Indonesia' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Persatuan Indonesia' },
            { key: 'B', text: 'Ketuhanan Yang Maha Esa' },
            { key: 'C', text: 'Kemanusiaan yang adil dan beradab' },
            { key: 'D', text: 'Keadilan sosial bagi seluruh rakyat Indonesia' }
        ],
        correctAnswer: 'A',
        explanation: 'Sila ke-3 Pancasila berbunyi "Persatuan Indonesia" dengan lambang pohon beringin.',
        cognitiveLevel: 'LOTS',
        topic: 'Bunyi Sila Pancasila'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Tari dan Mila berbagi bekal roti isi saat jam istirahat di bangku taman sekolah sambil mengobrol riang.',
        question: 'Manfaat sikap saling berbagi dengan teman di sekolah adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Mempererat persahabatan dan kerukunan' },
            { key: 'B', text: 'Membuat teman menjadi bermusuhan' },
            { key: 'C', text: 'Menyebabkan suasana kelas menjadi gaduh' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Mempererat persahabatan dan menumbuhkan rasa kasih sayang' },
            { key: 'B', text: 'Membuat teman merasa sedih dan kesepian' },
            { key: 'C', text: 'Mengurangi jumlah teman bermain' },
            { key: 'D', text: 'Menimbulkan pertengkaran saat istirahat' }
        ],
        correctAnswer: 'A',
        explanation: 'Berbagi menumbuhkan empati dan menjaga kerukunan antar teman di sekolah.',
        cognitiveLevel: 'LOTS',
        topic: 'Kerukunan di Sekolah'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Saat guru sedang menjelaskan pelajaran di depan papan tulis, semua murid duduk rapi dan mendengarkan.',
        question: 'Jika ingin bertanya atau menjawab pertanyaan guru di kelas, sikap tertib yang benar adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Mengangkat tangan terlebih dahulu sebelum berbicara' },
            { key: 'B', text: 'Berteriak keras dari bangku belakang' },
            { key: 'C', text: 'Berlari ke depan tanpa izin guru' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Mengangkat tangan dengan sopan dan menunggu dipersilakan' },
            { key: 'B', text: 'Memotong penjelasan guru sambil berdiri di kursi' },
            { key: 'C', text: 'Berbisik keras kepada teman sebangku' },
            { key: 'D', text: 'Mengetuk meja berulang kali dengan penggaris' }
        ],
        correctAnswer: 'A',
        explanation: 'Mengangkat tangan sebelum berbicara menjaga ketertiban dan menunjukkan rasa hormat kepada guru.',
        cognitiveLevel: 'LOTS',
        topic: 'Tata Tertib Kelas'
    },
    {
        minGrade: 1, maxGrade: 3,
        stimulus: 'Lagu kebangsaan negara Indonesia diciptakan oleh Wage Rudolf Supratman dan selalu dinyanyikan pada upacara bendera.',
        question: 'Judul lagu kebangsaan Negara Republik Indonesia adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Indonesia Raya' },
            { key: 'B', text: 'Garuda Pancasila' },
            { key: 'C', text: 'Maju Tak Gentar' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Indonesia Raya' },
            { key: 'B', text: 'Garuda Pancasila' },
            { key: 'C', text: 'Bagimu Negeri' },
            { key: 'D', text: 'Tanah Airku' }
        ],
        correctAnswer: 'A',
        explanation: 'Lagu kebangsaan Indonesia berjudul "Indonesia Raya" ciptaan W.R. Supratman.',
        cognitiveLevel: 'LOTS',
        topic: 'Lagu Kebangsaan'
    },
    {
        minGrade: 1, maxGrade: 3,
        stimulus: 'Warga kampung bekerja bakti membersihkan selokan air agar lingkungan sehat dan terhindar dari banjir.',
        question: 'Kebiasaan bekerja bersama-sama secara sukarela untuk kepentingan umum di masyarakat disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Gotong royong' },
            { key: 'B', text: 'Persaingan bebas' },
            { key: 'C', text: 'Hidup menyendiri' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Gotong royong' },
            { key: 'B', text: 'Individu mandiri' },
            { key: 'C', text: 'Pertengkaran warga' },
            { key: 'D', text: 'Perlombaan lari' }
        ],
        correctAnswer: 'A',
        explanation: 'Gotong royong merupakan budaya luhur bangsa Indonesia dalam menyelesaikan pekerjaan bersama.',
        cognitiveLevel: 'LOTS',
        topic: 'Gotong Royong'
    },

    // --- FASE B (KELAS 3 - 4) ---
    {
        minGrade: 3, maxGrade: 5,
        stimulus: 'Dalam kehidupan bermasyarakat terdapat berbagai jenis norma: norma agama, norma kesusilaan, norma kesopanan, dan norma hukum.',
        question: 'Norma yang bersumber langsung dari hati nurani manusia tentang perbuatan baik dan buruk (seperti jujur tidak mencontek) adalah norma ...',
        optionsFaseA: [
            { key: 'A', text: 'Norma kesusilaan' },
            { key: 'B', text: 'Norma lalu lintas' },
            { key: 'C', text: 'Norma olahraga' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Norma kesusilaan' },
            { key: 'B', text: 'Norma kesopanan adat' },
            { key: 'C', text: 'Norma hukum tertulis' },
            { key: 'D', text: 'Norma kesenian daerah' }
        ],
        correctAnswer: 'A',
        explanation: 'Norma kesusilaan berakar pada suara hati nurani manusia untuk berbuat jujur dan menghindari rasa bersalah.',
        cognitiveLevel: 'MOTS',
        topic: 'Macam-Macam Norma'
    },
    {
        minGrade: 3, maxGrade: 5,
        stimulus: 'Pengendara sepeda motor wajib memakai helm SNI dan memiliki Surat Izin Mengemudi (SIM) saat berkendara di jalan raya.',
        question: 'Aturan tertulis yang dibuat oleh negara dengan sanksi tegas seperti denda atau hukuman bagi pelanggarnya termasuk norma ...',
        optionsFaseA: [
            { key: 'A', text: 'Norma hukum' },
            { key: 'B', text: 'Norma kesopanan' },
            { key: 'C', text: 'Norma kebiasaan bermain' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Norma hukum' },
            { key: 'B', text: 'Norma kesusilaan' },
            { key: 'C', text: 'Norma kesopanan' },
            { key: 'D', text: 'Norma tata krama makan' }
        ],
        correctAnswer: 'A',
        explanation: 'Norma hukum bersifat mengikat, tertulis dalam peraturan perundang-undangan, dan memiliki sanksi tegas dari aparat negara.',
        cognitiveLevel: 'LOTS',
        topic: 'Norma Hukum'
    },
    {
        minGrade: 3, maxGrade: 5,
        stimulus: 'Ketika mengunjungi daerah asal nenek di Sumatra Barat, Alya melihat bangunan adat beratap lancip menyerupai tanduk kerbau serta pertunjukan tari piring.',
        question: 'Sikap yang mencerminkan kebanggaan terhadap keberagaman budaya daerah di Indonesia adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Mempelajari dan menghargai keunikan budaya setiap daerah' },
            { key: 'B', text: 'Menganggap budaya daerah sendiri paling unggul daripada daerah lain' },
            { key: 'C', text: 'Melarang pertunjukan kesenian tradisional di televisi' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menghormati, mempelajari, dan ikut melestarikan budaya Nusantara' },
            { key: 'B', text: 'Meremehkan tarian tradisional dari provinsi lain' },
            { key: 'C', text: 'Menghilangkan bahasa daerah dari pergaulan keluarga' },
            { key: 'D', text: 'Meniru gaya hidup asing dan melupakan budaya bangsa' }
        ],
        correctAnswer: 'A',
        explanation: 'Menghargai dan ikut melestarikan budaya Nusantara memperkuat persatuan dalam keragaman.',
        cognitiveLevel: 'MOTS',
        topic: 'Melestarikan Budaya Daerah'
    },
    {
        minGrade: 3, maxGrade: 5,
        stimulus: 'Pada rapat pemilihan ketua RT di lingkungan tempat tinggal Gilang, setiap warga diberi kesempatan menyampaikan pendapat secara bergantian.',
        question: 'Nilai utama yang tercermin dalam kegiatan pemilihan secara musyawarah di lingkungan masyarakat tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Menjunjung asas kerakyatan dan menghargai pendapat warga' },
            { key: 'B', text: 'Memaksakan kehendak pimpinan tanpa bertanya' },
            { key: 'C', text: 'Memilih pemimpin hanya berdasarkan kekayaan pribadi' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Demokrasi kerakyatan, keterbukaan, dan saling menghargai pendapat' },
            { key: 'B', text: 'Pemaksaan kehendak pribadi kepada seluruh peserta rapat' },
            { key: 'C', text: 'Pengambilan keputusan secara diam-diam tanpa rapat' },
            { key: 'D', text: 'Mengutamakan kepentingan satu kelompok keluarga saja' }
        ],
        correctAnswer: 'A',
        explanation: 'Memberi kesempatan berpendapat dan mengambil mufakat mencerminkan nilai demokrasi Pancasila Sila ke-4.',
        cognitiveLevel: 'HOTS',
        topic: 'Musyawarah di Masyarakat'
    },
    {
        minGrade: 3, maxGrade: 6,
        stimulus: 'Di lingkungan tempat tinggal kita ada pembagian wilayah pemerintahan desa atau kelurahan yang dipimpin oleh seorang kepala desa atau lurah.',
        question: 'Organisasi masyarakat paling kecil di tingkat lingkungan sekitar rumah yang mengurus warga beberapa kepala keluarga adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Rukun Tetangga (RT)' },
            { key: 'B', text: 'Pemerintah Provinsi' },
            { key: 'C', text: 'Pemerintah Kecamatan' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Rukun Tetangga (RT)' },
            { key: 'B', text: 'Pemerintah Provinsi' },
            { key: 'C', text: 'Pemerintah Kabupaten' },
            { key: 'D', text: 'Pemerintah Pusat' }
        ],
        correctAnswer: 'A',
        explanation: 'RT (Rukun Tetangga) merupakan satuan lingkungan warga terkecil sebelum RW dan Kelurahan/Desa.',
        cognitiveLevel: 'LOTS',
        topic: 'Struktur Pemerintahan Setempat'
    },
    {
        minGrade: 3, maxGrade: 6,
        stimulus: 'Setiap anak Indonesia memiliki hak memperoleh pendidikan serta kewajiban belajar dengan sungguh-sungguh.',
        question: 'Contoh pelaksanaan hak dan kewajiban yang seimbang bagi siswa di sekolah adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Mendapat bimbingan belajar dari guru dan rajin mengerjakan tugas' },
            { key: 'B', text: 'Menuntut nilai tinggi tanpa pernah masuk kelas' },
            { key: 'C', text: 'Meminjam buku perpustakaan lalu merusaknya' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menerima pengajaran guru dan melaksanakan tugas belajar dengan tekun' },
            { key: 'B', text: 'Hanya menuntut hak bermain tanpa mau piket kelas' },
            { key: 'C', text: 'Menggunakan fasilitas laboratorium lalu mengabaikan kebersihannya' },
            { key: 'D', text: 'Menolak mengerjakan latihan soal tetapi meminta hadiah juara' }
        ],
        correctAnswer: 'A',
        explanation: 'Pelaksanaan kewajiban belajar harus berjalan seimbang dengan hak mendapatkan pengajaran dari guru.',
        cognitiveLevel: 'MOTS',
        topic: 'Keseimbangan Hak dan Kewajiban'
    },
    {
        minGrade: 3, maxGrade: 6,
        stimulus: 'Sebagai negara kepulauan yang luas, Indonesia memiliki bahasa daerah yang sangat beragam namun disatukan oleh satu bahasa persatuan.',
        question: 'Bahasa resmi pemersatu bangsa yang digunakan dalam pendidikan dan pemerintahan di seluruh Indonesia adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Bahasa Indonesia' },
            { key: 'B', text: 'Bahasa daerah setempat' },
            { key: 'C', text: 'Bahasa asing internasional' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Bahasa Indonesia' },
            { key: 'B', text: 'Bahasa Melayu Kuno' },
            { key: 'C', text: 'Bahasa Sanskerta' },
            { key: 'D', text: 'Bahasa Inggris' }
        ],
        correctAnswer: 'A',
        explanation: 'Sumpah Pemuda 28 Oktober 1928 dan UUD 1945 menetapkan Bahasa Indonesia sebagai bahasa persatuan dan bahasa negara.',
        cognitiveLevel: 'LOTS',
        topic: 'Persatuan dan Bahasa Negara'
    },
    {
        minGrade: 3, maxGrade: 6,
        stimulus: 'Dimas gemar memakai sepatu dan tas sekolah buatan pengrajin lokal dari dalam negeri karena kualitasnya kuat dan rapi.',
        question: 'Sikap Dimas memilih menggunakan produk buatan pengrajin dalam negeri merupakan wujud pengamalan cinta tanah air yang sesuai dengan sila ke- ...',
        optionsFaseA: [
            { key: 'A', text: 'Ketiga dan Kelima Pancasila' },
            { key: 'B', text: 'Pertama saja' },
            { key: 'C', text: 'Keempat saja' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Ketiga (cinta tanah air) dan Kelima (mendukung kesejahteraan rakyat)' },
            { key: 'B', text: 'Pertama tentang kebebasan ibadah' },
            { key: 'C', text: 'Keempat tentang pemilihan umum' },
            { key: 'D', text: 'Bukan pengamalan nilai Pancasila' }
        ],
        correctAnswer: 'A',
        explanation: 'Mencintai produk dalam negeri menunjukkan nasionalisme (Sila 3) dan membantu perekonomian pengrajin bangsa (Sila 5).',
        cognitiveLevel: 'HOTS',
        topic: 'Cinta Produk Indonesia'
    },

    // --- FASE C (KELAS 5 - 6) ---
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Pada tanggal 1 Juni 1945 dalam sidang BPUPKI, Ir. Soekarno menyampaikan pidato bersejarah mengenai dasar negara Indonesia merdeka.',
        question: 'Tanggal 1 Juni hingga kini diperingati bangsa Indonesia sebagai Hari ...',
        optionsFaseA: [
            { key: 'A', text: 'Lahirnya Pancasila' },
            { key: 'B', text: 'Pahlawan Nasional' },
            { key: 'C', text: 'Sumpah Pemuda' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Lahirnya Pancasila' },
            { key: 'B', text: 'Kebangkitan Nasional' },
            { key: 'C', text: 'Kesaktian Pancasila' },
            { key: 'D', text: 'Proklamasi Kemerdekaan' }
        ],
        correctAnswer: 'A',
        explanation: 'Pidato Ir. Soekarno yang mengusulkan nama Pancasila pada 1 Juni 1945 diperingati sebagai Hari Lahir Pancasila.',
        cognitiveLevel: 'LOTS',
        topic: 'Sejarah Perumusan Pancasila'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Para tokoh perumus dasar negara dalam Panitia Sembilan berhasil menyepakati rancangan pembukaan hukum dasar negara pada 22 Juni 1945.',
        question: 'Naskah perjanjian luhur hasil kerja Panitia Sembilan yang menjadi cikal bakal Pembukaan UUD 1945 tersebut dikenal dengan nama ...',
        optionsFaseA: [
            { key: 'A', text: 'Piagam Jakarta (Jakarta Charter)' },
            { key: 'B', text: 'Naskah Proklamasi' },
            { key: 'C', text: 'Dekrit Presiden' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Piagam Jakarta (Jakarta Charter)' },
            { key: 'B', text: 'Teks Proklamasi Kemerdekaan' },
            { key: 'C', text: 'Teks Sumpah Pemuda' },
            { key: 'D', text: 'Perjanjian Linggarjati' }
        ],
        correctAnswer: 'A',
        explanation: 'Panitia Sembilan merumuskan Piagam Jakarta pada 22 Juni 1945 yang kemudian disempurnakan menjadi Pembukaan UUD 1945 pada 18 Agustus 1945.',
        cognitiveLevel: 'MOTS',
        topic: 'Sejarah Piagam Jakarta'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Pada rapat PPKI tanggal 18 Agustus 1945, Moh. Hatta mengusulkan perubahan kalimat pada sila pertama demi menjaga persatuan bangsa Indonesia yang majemuk.',
        question: 'Sikap keteladanan para pendiri bangsa (founding fathers) dalam peristiwa pengesahan Pancasila tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Mengutamakan persatuan bangsa di atas kepentingan golongan pribadi' },
            { key: 'B', text: 'Memaksakan pendapat sendiri meski ditolak semua peserta' },
            { key: 'C', text: 'Menunda kemerdekaan demi keuntungan kelompok tertentu' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Berjiwa besar dan mengutamakan keutuhan persatuan nasional di atas kepentingan golongan' },
            { key: 'B', text: 'Mementingkan kekuasaan pribadi dalam sidang' },
            { key: 'C', text: 'Menolak mendengar saran dari tokoh daerah lain' },
            { key: 'D', text: 'Membubarkan rapat karena adanya perbedaan pandangan' }
        ],
        correctAnswer: 'A',
        explanation: 'Kerelaan para tokoh bangsa bermusyawarah dan mengubah tujuh kata demi persatuan nasional merupakan teladan toleransi tertinggi.',
        cognitiveLevel: 'HOTS',
        topic: 'Teladan Pendiri Bangsa'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Kelima sila Pancasila saling berkaitan erat dan membentuk satu kesatuan utuh sebagai dasar negara serta pandangan hidup bangsa.',
        question: 'Kedudukan Pancasila sebagai sumber dari segala sumber hukum tertulis di Indonesia menunjukkan fungsi Pancasila sebagai ...',
        optionsFaseA: [
            { key: 'A', text: 'Dasar Negara' },
            { key: 'B', text: 'Lagu Daerah' },
            { key: 'C', text: 'Aturan Permainan' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Dasar Negara Republik Indonesia' },
            { key: 'B', text: 'Lambang Provinsi Daerah' },
            { key: 'C', text: 'Pedoman Peraturan Lalu Lintas saja' },
            { key: 'D', text: 'Tata Tertib Upacara Sekolah' }
        ],
        correctAnswer: 'A',
        explanation: 'Sebagai Dasar Negara, seluruh undang-undang dan peraturan di Indonesia tidak boleh bertentangan dengan nilai Pancasila.',
        cognitiveLevel: 'MOTS',
        topic: 'Kedudukan Pancasila'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Banjir melanda desa tetangga sehingga banyak siswa kehilangan perlengkapan belajar. Ketua kelas mengajak teman-teman menyisihkan sebagian uang jajan.',
        question: 'Apabila kamu melihat teman menolak berdonasi namun tetap menghina korban bencana, sikap bijaksana yang mencerminkan Sila ke-2 adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Menasihatinya dengan lembut tentang pentingnya empati kemanusiaan' },
            { key: 'B', text: 'Membalas mengejeknya di depan seluruh kelas' },
            { key: 'C', text: 'Memaksa mengambil uang sakunya secara diam-diam' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Mengingatkannya secara santun agar menumbuhkan empati dan tidak merendahkan korban' },
            { key: 'B', text: 'Memusuhinya dan melarang ia masuk ke kelas' },
            { key: 'C', text: 'Merampas tas sekolahnya untuk disumbangkan paksa' },
            { key: 'D', text: 'Mendukung perbuatannya agar terlihat kompak' }
        ],
        correctAnswer: 'A',
        explanation: 'Kemanusiaan yang adil dan beradab mengajarkan empati kepada korban bencana serta menasihati teman dengan cara beradab.',
        cognitiveLevel: 'HOTS',
        topic: 'Empati dan Kemanusiaan'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Berdasarkan UUD Negara Republik Indonesia Tahun 1945, bentuk negara Indonesia adalah negara kesatuan yang berbentuk republik.',
        question: 'Semboyan dan prinsip yang menegaskan bahwa wilayah Indonesia dari Sabang sampai Merauke merupakan satu kesatuan utuh adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Negara Kesatuan Republik Indonesia (NKRI)' },
            { key: 'B', text: 'Negara Serikat Bagian' },
            { key: 'C', text: 'Kerajaan Terpisah' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Negara Kesatuan Republik Indonesia (NKRI)' },
            { key: 'B', text: 'Negara Federal Berdaulat Terpisah' },
            { key: 'C', text: 'Wilayah Kerajaan Otonom' },
            { key: 'D', text: 'Persemakmuran Pulau' }
        ],
        correctAnswer: 'A',
        explanation: 'Pasal 1 ayat (1) UUD 1945 menegaskan Negara Indonesia ialah Negara Kesatuan yang berbentuk Republik.',
        cognitiveLevel: 'LOTS',
        topic: 'Keutuhan NKRI'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Indonesia terdiri atas 38 provinsi yang memiliki kekayaan alam, seni tari, rumah adat, dan kuliner tradisional masing-masing.',
        question: 'Cara paling nyata bagi pelajar untuk menjaga persatuan NKRI di era digital dan media sosial saat ini adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Menyaring berita bohong (hoaks) dan tidak menyebarkan ujaran kebencian SARA' },
            { key: 'B', text: 'Menyebarkan komentar yang menghina suku atau daerah lain' },
            { key: 'C', text: 'Mengunggah kabar palsu agar menjadi viral' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menyaring kebenaran berita sebelum membagikan dan menghindari ujaran kebencian SARA' },
            { key: 'B', text: 'Membagikan pesan provokasi antar daerah tanpa mengecek fakta' },
            { key: 'C', text: 'Menggunakan media sosial untuk mengejek logat teman' },
            { key: 'D', text: 'Membuat akun palsu untuk menjatuhkan siswa lain' }
        ],
        correctAnswer: 'A',
        explanation: 'Etika bermedia sosial dengan menolak hoaks dan ujaran kebencian menjaga kerukunan dan persatuan bangsa.',
        cognitiveLevel: 'HOTS',
        topic: 'Persatuan di Era Digital'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Setiap warga negara yang telah berusia 17 tahun memiliki hak ikut serta dalam pemilihan umum secara langsung, umum, bebas, rahasia, jujur, dan adil.',
        question: 'Asas "rahasia" dalam pemilihan umum maupun pemilihan ketua kelas berarti ...',
        optionsFaseA: [
            { key: 'A', text: 'Pilihan pemilih dijamin tidak diketahui orang lain agar bebas dari tekanan' },
            { key: 'B', text: 'Hasil perhitungan suara disembunyikan selamanya' },
            { key: 'C', text: 'Jadwal pemilihan tidak boleh diumumkan kepada warga' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Pilihan setiap pemilih di bilik suara dijamin kerahasiaannya tanpa paksaan' },
            { key: 'B', text: 'Jumlah perolehan suara tidak boleh dihitung di depan umum' },
            { key: 'C', text: 'Nama calon ketua tidak dituliskan di kertas suara' },
            { key: 'D', text: 'Hanya panitia saja yang boleh memberikan suara' }
        ],
        correctAnswer: 'A',
        explanation: 'Asas Rahasia melindungi pemilih agar dapat menentukan pilihannya secara bebas sesuai hati nurani tanpa intimidasi.',
        cognitiveLevel: 'MOTS',
        topic: 'Asas Demokrasi dan Pemilu'
    }
];

export const EXTENDED_IPAS_PG: QuestionBankItemPG[] = [
    // --- FASE A (KELAS 1 - 2) ---
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Kaki ayam, sayap burung, dan sirip ikan memiliki kegunaan khusus sesuai tempat tinggal masing-masing hewan.',
        question: 'Bagian tubuh ikan yang berfungsi membantu ikan berenang dan berbelok di dalam air adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Sirip dan ekor' },
            { key: 'B', text: 'Sayap berbulu' },
            { key: 'C', text: 'Kaki panjang' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Sirip dan ekor' },
            { key: 'B', text: 'Sayap berbulu' },
            { key: 'C', text: 'Paruh runcing' },
            { key: 'D', text: 'Cakar tajam' }
        ],
        correctAnswer: 'A',
        explanation: 'Sirip dan ekor membantu ikan mendorong tubuhnya serta menjaga keseimbangan saat berenang.',
        cognitiveLevel: 'LOTS',
        topic: 'Bagian Tubuh Hewan'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Setiap pagi sebelum masuk kelas, siswa mencuci tangan memakai sabun dan air mengalir setelah bermain bola.',
        question: 'Kebiasaan mencuci tangan pakai sabun sebelum makan berguna untuk ...',
        optionsFaseA: [
            { key: 'A', text: 'Menghilangkan kuman penyebab sakit perut' },
            { key: 'B', text: 'Membuat tangan semakin kotor' },
            { key: 'C', text: 'Memboroskan air bersih di keran' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menghilangkan kotoran dan kuman penyakit dari telapak tangan' },
            { key: 'B', text: 'Mengubah warna kulit jari tangan' },
            { key: 'C', text: 'Menghabiskan sabun mandi di rumah' },
            { key: 'D', text: 'Membuat makanan terasa pahit' }
        ],
        correctAnswer: 'A',
        explanation: 'Sabun dan air mengalir membilas kuman agar tidak masuk ke tubuh bersama makanan.',
        cognitiveLevel: 'LOTS',
        topic: 'Kebersihan dan Kesehatan'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Saat malam hari tiba, langit menjadi gelap dan bintang-bintang tampak berkelip di angkasa.',
        question: 'Benda langit yang tampak terang memantulkan cahaya pada malam hari dan berubah bentuk dari sabit menjadi purnama adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Bulan' },
            { key: 'B', text: 'Matahari' },
            { key: 'C', text: 'Pelangi' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Bulan' },
            { key: 'B', text: 'Matahari' },
            { key: 'C', text: 'Awan hujan' },
            { key: 'D', text: 'Pelangi' }
        ],
        correctAnswer: 'A',
        explanation: 'Bulan tampak bercahaya di langit malam dengan bentuk yang berubah-ubah sepanjang bulan.',
        cognitiveLevel: 'LOTS',
        topic: 'Benda Langit Siang & Malam'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Di meja belajar terdapat penghapus karet, penggaris kayu, buku tulis, dan botol air minum.',
        question: 'Benda di bawah ini yang bentuk dan ukurannya TETAP tidak berubah meskipun dipindahkan ke tempat lain adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Penggaris kayu (benda padat)' },
            { key: 'B', text: 'Air minum dalam botol' },
            { key: 'C', text: 'Udara di dalam balon' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Penggaris kayu (benda padat)' },
            { key: 'B', text: 'Air mineral di gelas' },
            { key: 'C', text: 'Sirup buah manis' },
            { key: 'D', text: 'Minyak goreng cair' }
        ],
        correctAnswer: 'A',
        explanation: 'Benda padat seperti penggaris kayu mempertahankan bentuk dan ukurannya ke mana pun dipindahkan.',
        cognitiveLevel: 'LOTS',
        topic: 'Sifat Benda Padat'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Dito melihat dua ember sampah di halaman sekolah: ember hijau untuk daun kering dan ember kuning untuk botol plastik.',
        question: 'Tujuan memisahkan sampah daun dan botol plastik ke wadah berbeda adalah agar ...',
        optionsFaseA: [
            { key: 'A', text: 'Sampah mudah diolah menjadi kompos atau didaur ulang' },
            { key: 'B', text: 'Halaman sekolah dipenuhi lalat dan bau' },
            { key: 'C', text: 'Ember sampah cepat rusak terbakar' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Sampah organik dapat dijadikan kompos dan plastik mudah didaur ulang' },
            { key: 'B', text: 'Memperbanyak tumpukan sampah di selokan' },
            { key: 'C', text: 'Menghambat petugas kebersihan sekolah' },
            { key: 'D', text: 'Membuat halaman kelas penuh genangan' }
        ],
        correctAnswer: 'A',
        explanation: 'Pemilahan sampah memudahkan pengolahan kompos dari sampah organik dan daur ulang sampah anorganik.',
        cognitiveLevel: 'MOTS',
        topic: 'Peduli Sampah Lingkungan'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Setiap hari Senin sampai Sabtu, matahari terbit pada pagi hari dan terbenam pada sore hari.',
        question: 'Arah mata angin tempat matahari terbit di pagi hari adalah sebelah ...',
        optionsFaseA: [
            { key: 'A', text: 'Timur' },
            { key: 'B', text: 'Barat' },
            { key: 'C', text: 'Selatan' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Timur' },
            { key: 'B', text: 'Barat' },
            { key: 'C', text: 'Utara' },
            { key: 'D', text: 'Selatan' }
        ],
        correctAnswer: 'A',
        explanation: 'Matahari selalu tampak terbit di sebelah timur pada pagi hari dan terbenam di sebelah barat pada sore hari.',
        cognitiveLevel: 'LOTS',
        topic: 'Arah Mata Angin'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Nenek menanam bibit bunga mawar di dalam pot berisi tanah subur dan diletakkan di teras rumah yang terkena cahaya.',
        question: 'Agar tanaman bunga mawar di dalam pot tetap hidup dan berbunga indah, hal rutin yang harus dilakukan adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Menyiramnya secara teratur dan memberi pupuk secukupnya' },
            { key: 'B', text: 'Menutup pot rapat-rapat dengan kardus gelap' },
            { key: 'C', text: 'Mematahkan seluruh daun hijaunya' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menyiram secara teratur dan memastikan terkena sinar matahari' },
            { key: 'B', text: 'Menaruh tanaman di dalam lemari tertutup' },
            { key: 'C', text: 'Mencabut akarnya setiap minggu' },
            { key: 'D', text: 'Menyiram tanaman dengan air sabun' }
        ],
        correctAnswer: 'A',
        explanation: 'Tumbuhan membutuhkan air, cahaya matahari, dan unsur hara tanah agar dapat tumbuh subur.',
        cognitiveLevel: 'LOTS',
        topic: 'Merawat Tumbuhan'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Ketika hujan deras turun di sore hari, udara terasa dingin sehingga Mila mengenakan jaket tebal.',
        question: 'Benda yang paling tepat dipakai saat keluar rumah ketika hujan turun agar tubuh tidak basah kuyup adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Jas hujan atau payung' },
            { key: 'B', text: 'Topi pantai berlubang' },
            { key: 'C', text: 'Kacamata renang' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Jas hujan atau payung' },
            { key: 'B', text: 'Kaos tipis tanpa lengan' },
            { key: 'C', text: 'Kacamata hitam pantai' },
            { key: 'D', text: 'Kipas tangan kertas' }
        ],
        correctAnswer: 'A',
        explanation: 'Jas hujan dan payung terbuat dari bahan kedap air untuk melindungi tubuh dari air hujan.',
        cognitiveLevel: 'LOTS',
        topic: 'Musim Hujan dan Kemarau'
    },

    // --- FASE B (KELAS 3 - 4) ---
    {
        minGrade: 3, maxGrade: 5,
        stimulus: 'Sebuah magnet batang didekatkan pada benda-benda di atas meja: paku besi, klip kertas baja, penghapus karet, dan penggaris plastik.',
        question: 'Pasangan benda yang dapat ditarik kuat oleh gaya magnet (benda magnetis) adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Paku besi dan klip kertas baja' },
            { key: 'B', text: 'Penghapus karet dan penggaris plastik' },
            { key: 'C', text: 'Penghapus karet dan paku besi' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Paku besi dan klip kertas baja' },
            { key: 'B', text: 'Penghapus karet dan pensil kayu' },
            { key: 'C', text: 'Penggaris plastik dan daun kering' },
            { key: 'D', text: 'Kertas HVS dan sedotan plastik' }
        ],
        correctAnswer: 'A',
        explanation: 'Benda berbahan logam besi, baja, nikel, dan kobalt bersifat magnetis sehingga dapat ditarik oleh magnet.',
        cognitiveLevel: 'MOTS',
        topic: 'Sifat Magnet'
    },
    {
        minGrade: 3, maxGrade: 5,
        stimulus: 'Ibu menanak nasi memakai rice cooker, lalu menyetrika seragam sekolah agar rapi sebelum dipakai pagi hari.',
        question: 'Perubahan bentuk energi yang terjadi pada alat setrika dan rice cooker tersebut adalah energi listrik menjadi energi ...',
        optionsFaseA: [
            { key: 'A', text: 'Energi panas' },
            { key: 'B', text: 'Energi bunyi' },
            { key: 'C', text: 'Energi gerak' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Energi panas (kalor)' },
            { key: 'B', text: 'Energi gerak mekanik' },
            { key: 'C', text: 'Energi bunyi nyaring' },
            { key: 'D', text: 'Energi kimia baterai' }
        ],
        correctAnswer: 'A',
        explanation: 'Setrika dan penanak nasi mengubah energi listrik menjadi energi panas untuk melicinkan baju atau mematangkan nasi.',
        cognitiveLevel: 'LOTS',
        topic: 'Transformasi Energi'
    },
    {
        minGrade: 3, maxGrade: 5,
        stimulus: 'Di pagi hari yang dingin, Alya melihat titik-titik air bening menempel pada permukaan luar gelas yang berisi es teh manis.',
        question: 'Peristiwa terbentuknya titik-titik air di bagian luar dinding gelas dingin terjadi karena uap air di udara mengalami ...',
        optionsFaseA: [
            { key: 'A', text: 'Pengembunan (kondensasi)' },
            { key: 'B', text: 'Penguapan (evaporasi)' },
            { key: 'C', text: 'Penyubliman' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Pengembunan (kondensasi) dari gas menjadi cair' },
            { key: 'B', text: 'Penguapan (evaporasi) air es menembus kaca' },
            { key: 'C', text: 'Penyubliman benda padat menjadi gas' },
            { key: 'D', text: 'Pembekuan dinding kaca menjadi es' }
        ],
        correctAnswer: 'A',
        explanation: 'Uap air hangat di udara sekitar gelas mendingin saat menyentuh dinding gelas es sehingga mengembun menjadi titik air.',
        cognitiveLevel: 'MOTS',
        topic: 'Perubahan Wujud Mengembun'
    },
    {
        minGrade: 3, maxGrade: 5,
        stimulus: 'Kapur barus (kamper) yang diletakkan di dalam lemari pakaian lama-kelamaan ukurannya mengecil dan habis sambil menyebarkan aroma harum.',
        question: 'Perubahan wujud benda padat menjadi gas pada kapur barus di dalam lemari tersebut dinamakan ...',
        optionsFaseA: [
            { key: 'A', text: 'Menyublim' },
            { key: 'B', text: 'Mencair' },
            { key: 'C', text: 'Membeku' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menyublim' },
            { key: 'B', text: 'Mencair' },
            { key: 'C', text: 'Membeku' },
            { key: 'D', text: 'Mengembun' }
        ],
        correctAnswer: 'A',
        explanation: 'Menyublim adalah perubahan wujud langsung dari zat padat menjadi gas tanpa melewati fase cair.',
        cognitiveLevel: 'LOTS',
        topic: 'Perubahan Wujud Menyublim'
    },
    {
        minGrade: 3, maxGrade: 5,
        stimulus: 'Saat menginjak kolam renang yang jernih, dasar kolam tampak lebih dangkal dari kedalaman sebenarnya. Demikian juga pensil di dalam gelas berisi air terlihat seperti patah.',
        question: 'Sifat cahaya yang menyebabkan pensil dalam gelas bening berisi air tampak bengkok atau patah adalah cahaya dapat ...',
        optionsFaseA: [
            { key: 'A', text: 'Dibiaskan' },
            { key: 'B', text: 'Diserap seluruhnya' },
            { key: 'C', text: 'Dipantulkan cermin datar' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Dibiaskan (membelok saat melewati dua medium berbeda kerapatan)' },
            { key: 'B', text: 'Diserap oleh dinding gelas bening' },
            { key: 'C', text: 'Merambat melengkung di ruang hampa' },
            { key: 'D', text: 'Menembus benda kayu tebal' }
        ],
        correctAnswer: 'A',
        explanation: 'Cahaya mengalami pembiasan (pembelokan arah rambat) ketika berpindah dari udara ke air yang berbeda kerapatan.',
        cognitiveLevel: 'MOTS',
        topic: 'Sifat-Sifat Cahaya'
    },
    {
        minGrade: 3, maxGrade: 5,
        stimulus: 'Bel sekolah yang berbunyi nyaring terdengar hingga ke seluruh ruangan kelas karena getaran suara merambat melalui udara.',
        question: 'Sumber terjadinya segala macam bunyi yang dapat didengar oleh telinga manusia adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Benda yang bergetar' },
            { key: 'B', text: 'Benda yang berwarna cerah' },
            { key: 'C', text: 'Ruang hampa tanpa udara' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Getaran suatu benda (sumber bunyi)' },
            { key: 'B', text: 'Cahaya matahari di siang hari' },
            { key: 'C', text: 'Ruang hampa udara di luar angkasa' },
            { key: 'D', text: 'Benda diam yang tidak bergerak sama sekali' }
        ],
        correctAnswer: 'A',
        explanation: 'Bunyi dihasilkan oleh benda yang bergetar dan membutuhkan medium (padat, cair, atau gas) untuk merambat.',
        cognitiveLevel: 'LOTS',
        topic: 'Bunyi dan Pendengaran'
    },
    {
        minGrade: 3, maxGrade: 5,
        stimulus: 'Berdasarkan asalnya, sumber daya alam dibagi menjadi yang dapat diperbarui (seperti air, tumbuhan, ternak) dan yang tidak dapat diperbarui.',
        question: 'Contoh sumber daya alam tambang yang TIDAK dapat diperbarui dan harus digunakan secara hemat adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Minyak bumi dan batu bara' },
            { key: 'B', text: 'Cahaya matahari dan angin' },
            { key: 'C', text: 'Tanaman padi dan kayu jati' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Minyak bumi, gas alam, dan batu bara' },
            { key: 'B', text: 'Sinar matahari, angin, dan ombak laut' },
            { key: 'C', text: 'Hutan jati dan hasil perkebunan teh' },
            { key: 'D', text: 'Peternakan sapi perah dan ikan kolam' }
        ],
        correctAnswer: 'A',
        explanation: 'Bahan bakar fosil (minyak bumi dan batu bara) terbentuk selama jutaan tahun sehingga tidak dapat segera diperbarui bila habis.',
        cognitiveLevel: 'LOTS',
        topic: 'Sumber Daya Alam'
    },
    {
        minGrade: 3, maxGrade: 6,
        stimulus: 'Wilayah provinsi di Indonesia digambarkan pada sebuah peta yang dilengkapi judul, skala, penunjuk arah, dan keterangan simbol.',
        question: 'Komponen peta yang menjelaskan arti simbol-simbol seperti gambar gunung, sungai, jalan raya, dan ibu kota provinsi disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Legenda peta' },
            { key: 'B', text: 'Judul peta' },
            { key: 'C', text: 'Skala angka' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Legenda peta' },
            { key: 'B', text: 'Garis lintang dan bujur' },
            { key: 'C', text: 'Skala perbandingan' },
            { key: 'D', text: 'Inset peta kecil' }
        ],
        correctAnswer: 'A',
        explanation: 'Legenda berisi daftar keterangan arti setiap simbol warna, garis, maupun ikon yang tergambar pada peta.',
        cognitiveLevel: 'LOTS',
        topic: 'Membaca Peta Wilayah'
    },
    {
        minGrade: 3, maxGrade: 6,
        stimulus: 'Daerah pegunungan berhawa sejuk cocok ditanami sayuran kol, wortel, dan teh, sedangkan daerah pesisir laut banyak penduduknya bekerja sebagai nelayan.',
        question: 'Pernyataan tersebut membuktikan bahwa jenis mata pencaharian penduduk sangat dipengaruhi oleh ...',
        optionsFaseA: [
            { key: 'A', text: 'Kondisi bentang alam dan sumber daya wilayah setempat' },
            { key: 'B', text: 'Warna cat rumah penduduk desa' },
            { key: 'C', text: 'Bentuk atap gedung sekolah' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Kondisi geografis, iklim, dan potensi sumber daya alam setempat' },
            { key: 'B', text: 'Jenis seragam yang dikenakan saat bekerja' },
            { key: 'C', text: 'Jumlah kendaraan bermotor di kota lain' },
            { key: 'D', text: 'Panjang jalan tol antarprovinsi' }
        ],
        correctAnswer: 'A',
        explanation: 'Kondisi alam (pantai, dataran rendah, dataran tinggi) menentukan potensi ekonomi dan pekerjaan masyarakat.',
        cognitiveLevel: 'MOTS',
        topic: 'Bentang Alam dan Ekonomi'
    },
    {
        minGrade: 3, maxGrade: 6,
        stimulus: 'Lebah mengisap nektar manis dari bunga mawar, sementara serbuk sari bunga menempel di tubuh lebah sehingga membantu penyerbukan bunga.',
        question: 'Hubungan saling menguntungkan antara lebah dan bunga tanaman tersebut dinamakan simbiosis ...',
        optionsFaseA: [
            { key: 'A', text: 'Simbiosis mutualisme' },
            { key: 'B', text: 'Simbiosis parasitisme' },
            { key: 'C', text: 'Simbiosis komensalisme' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Simbiosis mutualisme' },
            { key: 'B', text: 'Simbiosis parasitisme' },
            { key: 'C', text: 'Simbiosis komensalisme' },
            { key: 'D', text: 'Kompetisi antarspesies' }
        ],
        correctAnswer: 'A',
        explanation: 'Mutualisme terjadi ketika kedua makhluk hidup yang berinteraksi sama-sama memperoleh keuntungan.',
        cognitiveLevel: 'LOTS',
        topic: 'Hubungan Antarmakhluk Hidup'
    },

    // --- FASE C (KELAS 5 - 6) ---
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Siswa kelas merangkai baterai, kabel, sakelar, dan dua buah lampu senter secara berderet dalam satu jalur kabel tanpa cabang.',
        question: 'Jika salah satu lampu pada rangkaian seri tersebut dilepas atau padam, keadaan lampu kedua adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Ikut padam karena aliran arus listrik terputus' },
            { key: 'B', text: 'Menyala dua kali lebih terang' },
            { key: 'C', text: 'Tetap menyala normal seperti semula' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Ikut padam karena jalur aliran arus listrik menjadi rangkaian terbuka' },
            { key: 'B', text: 'Menyala semakin terang dan panas' },
            { key: 'C', text: 'Tetap menyala stabil tanpa gangguan' },
            { key: 'D', text: 'Berubah menjadi berkedip-kedip cepat' }
        ],
        correctAnswer: 'A',
        explanation: 'Pada rangkaian seri hanya terdapat satu jalur aliran arus listrik; jika satu titik putus, seluruh lampu ikut padam.',
        cognitiveLevel: 'HOTS',
        topic: 'Rangkaian Listrik Seri & Paralel'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Pada saat bernapas, udara masuk melalui hidung menuju tenggorokan lalu sampai ke gelembung-gelembung halus di dalam paru-paru.',
        question: 'Bagian paru-paru tempat terjadinya pertukaran gas oksigen (O2) dan karbon dioksida (CO2) adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Alveolus' },
            { key: 'B', text: 'Kerongkongan' },
            { key: 'C', text: 'Lambung' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Alveolus' },
            { key: 'B', text: 'Bronkus utama' },
            { key: 'C', text: 'Kerongkongan (esofagus)' },
            { key: 'D', text: 'Usus halus' }
        ],
        correctAnswer: 'A',
        explanation: 'Alveolus adalah kantong udara berdinding tipis di paru-paru tempat pertukaran O2 dan CO2 dengan pembuluh kapiler darah.',
        cognitiveLevel: 'MOTS',
        topic: 'Sistem Pernapasan Manusia'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Makanan yang kita kunyah di mulut ditelan melalui kerongkongan menuju lambung untuk diolah oleh enzim dan asam lambung.',
        question: 'Organ pencernaan yang berperan utama menyerap sari-sari makanan ke dalam aliran darah adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Usus halus' },
            { key: 'B', text: 'Usus besar' },
            { key: 'C', text: 'Tenggorokan' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Usus halus' },
            { key: 'B', text: 'Usus besar' },
            { key: 'C', text: 'Kerongkongan' },
            { key: 'D', text: 'Rongga hidung' }
        ],
        correctAnswer: 'A',
        explanation: 'Usus halus menyerap sari makanan hasil pencernaan, sedangkan usus besar menyerap kembali air dan membusukkan sisa makanan.',
        cognitiveLevel: 'LOTS',
        topic: 'Sistem Pencernaan Manusia'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Sendi pada pangkal lengan atas dan pinggul memungkinkan tulang bergerak memutar ke segala arah saat berolahraga.',
        question: 'Jenis sendi pada sistem gerak manusia yang memungkinkan gerakan ke segala arah tersebut dinamakan sendi ...',
        optionsFaseA: [
            { key: 'A', text: 'Sendi peluru' },
            { key: 'B', text: 'Sendi engsel' },
            { key: 'C', text: 'Sendi putar' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Sendi peluru' },
            { key: 'B', text: 'Sendi engsel' },
            { key: 'C', text: 'Sendi kaku' },
            { key: 'D', text: 'Sendi mati tulang tengkorak' }
        ],
        correctAnswer: 'A',
        explanation: 'Sendi peluru (pada bahu dan pinggul) bergerak ke segala arah, sedangkan sendi engsel (siku, lutut) hanya satu arah.',
        cognitiveLevel: 'MOTS',
        topic: 'Rangka dan Sendi Manusia'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Peristiwa gerhana terjadi apabila posisi Matahari, Bumi, dan Bulan berada dalam satu garis lurus di ruang angkasa.',
        question: 'Gerhana matahari total terjadi apabila ...',
        optionsFaseA: [
            { key: 'A', text: 'Bulan berada di antara Matahari dan Bumi sehingga cahaya matahari terhalang ke Bumi' },
            { key: 'B', text: 'Bumi berada tepat di tengah antara Matahari dan Bulan' },
            { key: 'C', text: 'Matahari bergerak masuk ke belakang Bulan dan Bumi' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Posisi Bulan berada tepat di antara Matahari dan Bumi sehingga bayangan Bulan jatuh ke Bumi' },
            { key: 'B', text: 'Posisi Bumi berada tepat di antara Matahari dan Bulan' },
            { key: 'C', text: 'Bumi berhenti berputar pada porosnya selama satu hari' },
            { key: 'D', text: 'Planet Mars menutupi seluruh permukaan Matahari' }
        ],
        correctAnswer: 'A',
        explanation: 'Gerhana matahari terjadi pada fase bulan baru ketika Bulan menghalangi sinar Matahari menuju sebagian permukaan Bumi.',
        cognitiveLevel: 'MOTS',
        topic: 'Gerhana dan Tata Surya'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Dalam sistem tata surya kita terdapat delapan planet yang mengelilingi Matahari pada lintasan orbitnya masing-masing.',
        question: 'Planet terbesar dalam tata surya yang memiliki cincin tipis dan dikenal sebagai raksasa gas kelima dari Matahari adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Jupiter' },
            { key: 'B', text: 'Merkurius' },
            { key: 'C', text: 'Mars' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Jupiter' },
            { key: 'B', text: 'Merkurius' },
            { key: 'C', text: 'Venus' },
            { key: 'D', text: 'Neptunus' }
        ],
        correctAnswer: 'A',
        explanation: 'Urutan planet dari Matahari: Merkurius, Venus, Bumi, Mars, Jupiter (terbesar), Saturnus, Uranus, Neptunus.',
        cognitiveLevel: 'LOTS',
        topic: 'Planet Tata Surya'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Untuk mengurangi ketergantungan pada bahan bakar fosil, banyak negara mengembangkan pembangkit listrik tenaga surya (PLTS) dan tenaga angin (PLTB).',
        question: 'Keunggulan utama penggunaan energi alternatif seperti panel surya dibandingkan batu bara adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Ramah lingkungan, tidak menghasilkan asap polusi, dan tidak pernah habis' },
            { key: 'B', text: 'Menghasilkan asap hitam pekat yang mencemari udara' },
            { key: 'C', text: 'Hanya bisa digunakan sekali lalu dibuang selamanya' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Ramah lingkungan, bebas polusi gas buang, dan ketersediaannya terbarukan' },
            { key: 'B', text: 'Mempercepat pemanasan global di atmosfer Bumi' },
            { key: 'C', text: 'Menghabiskan cadangan minyak bumi dalam tanah' },
            { key: 'D', text: 'Hanya dapat menyala pada tengah malam' }
        ],
        correctAnswer: 'A',
        explanation: 'Energi terbarukan seperti surya, air, dan angin ramah lingkungan serta tersedia terus menerus di alam.',
        cognitiveLevel: 'HOTS',
        topic: 'Energi Terbarukan'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Tanggal 17 Agustus 1945 menjadi tonggak sejarah kemerdekaan bangsa Indonesia dengan dibacakannya naskah proklamasi di Jalan Pegangsaan Timur No. 56 Jakarta.',
        question: 'Tokoh nasional yang mengetik naskah asli Proklamasi Kemerdekaan Indonesia agar rapi adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Sayuti Melik' },
            { key: 'B', text: 'Ahmad Soebardjo' },
            { key: 'C', text: 'Fatmawati' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Sayuti Melik' },
            { key: 'B', text: 'Soekarno' },
            { key: 'C', text: 'Moh. Hatta' },
            { key: 'D', text: 'Sudirman' }
        ],
        correctAnswer: 'A',
        explanation: 'Naskah proklamasi tulisan tangan Ir. Soekarno diketik rapi oleh Sayuti Melik sebelum ditandatangani Soekarno-Hatta.',
        cognitiveLevel: 'LOTS',
        topic: 'Sejarah Proklamasi Kemerdekaan'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Indonesia merupakan salah satu negara pendiri organisasi kerja sama negara-negara kawasan Asia Tenggara (ASEAN) pada tahun 1967.',
        question: 'Menteri Luar Negeri wakil dari Indonesia yang ikut menandatangani Deklarasi Bangkok pendirian ASEAN adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Adam Malik' },
            { key: 'B', text: 'Tun Abdul Razak' },
            { key: 'C', text: 'Thanat Khoman' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Adam Malik' },
            { key: 'B', text: 'S. Rajaratnam' },
            { key: 'C', text: 'Narciso Ramos' },
            { key: 'D', text: 'Tun Abdul Razak' }
        ],
        correctAnswer: 'A',
        explanation: 'Adam Malik mewakili Indonesia menandatangani Deklarasi Bangkok pada 8 Agustus 1967 bersama 4 negara pendiri lainnya.',
        cognitiveLevel: 'LOTS',
        topic: 'Kerja Sama ASEAN'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Ibu memasak air menggunakan panci aluminium yang dilengkapi gagang berbahan plastik atau kayu tebal.',
        question: 'Alasan gagang panci dibuat dari plastik atau kayu sementara badan panci dari logam aluminium adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Logam menghantarkan panas cepat (konduktor), sedangkan plastik menahan panas (isolator)' },
            { key: 'B', text: 'Logam lebih ringan daripada plastik dan cepat meleleh' },
            { key: 'C', text: 'Plastik menghantarkan panas lebih cepat ke tangan' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Aluminium merupakan konduktor panas untuk memasak dan plastik adalah isolator pelindung tangan' },
            { key: 'B', text: 'Plastik adalah konduktor panas tercepat dibanding logam' },
            { key: 'C', text: 'Logam aluminium tidak dapat dialiri energi panas kompor' },
            { key: 'D', text: 'Gagang plastik dibuat agar panci cepat gosong' }
        ],
        correctAnswer: 'A',
        explanation: 'Logam menghantarkan panas baik (konduktor) agar air cepat mendidih; gagang isolator mencegah tangan melepuh.',
        cognitiveLevel: 'HOTS',
        topic: 'Konduktor dan Isolator Panas'
    }
];

export const EXTENDED_PJOK_PG: QuestionBankItemPG[] = [
    // --- FASE A (KELAS 1 - 2) ---
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Saat pelajaran senam pagi, Arka berlatih berdiri menggunakan satu kaki selama sepuluh detik sambil merentangkan kedua tangan.',
        question: 'Gerakan berdiri satu kaki dengan tangan terentang melatih kemampuan ...',
        optionsFaseA: [
            { key: 'A', text: 'Keseimbangan tubuh' },
            { key: 'B', text: 'Kekuatan suara' },
            { key: 'C', text: 'Kecepatan berhitung' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Keseimbangan statis tubuh' },
            { key: 'B', text: 'Kecepatan lari jarak jauh' },
            { key: 'C', text: 'Kekuatan leher' },
            { key: 'D', text: 'Kelenturan jari tangan' }
        ],
        correctAnswer: 'A',
        explanation: 'Berdiri satu kaki dan meniti balok keseimbangan melatih keseimbangan tubuh agar tidak mudah terjatuh.',
        cognitiveLevel: 'LOTS',
        topic: 'Latihan Keseimbangan'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Mila selalu menggosok gigi secara teratur setelah sarapan pagi dan sebelum tidur malam.',
        question: 'Manfaat utama rajin menggosok gigi setiap hari bagi kesehatan anak adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Mencegah gigi berlubang dan bau mulut' },
            { key: 'B', text: 'Membuat gigi menjadi goyah' },
            { key: 'C', text: 'Membuat bibir terasa sangat pedas' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menjaga gigi tetap bersih, sehat, dan bebas dari gigi berlubang' },
            { key: 'B', text: 'Membuat kuman mudah menempel di gusi' },
            { key: 'C', text: 'Mengurangi selera makan sayur' },
            { key: 'D', text: 'Menjadikan suara serak saat bernyanyi' }
        ],
        correctAnswer: 'A',
        explanation: 'Menyikat gigi membersihkan sisa makanan manis agar bakteri tidak merusak lapisan gigi.',
        cognitiveLevel: 'LOTS',
        topic: 'Kebersihan Gigi dan Mulut'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Wulan berlatih melompati simpai (hula hoop) yang disusun berderet di atas rumput halaman sekolah menggunakan dua kaki.',
        question: 'Saat mendarat setelah melompat ke depan, posisi kedua lutut yang aman agar kaki tidak sakit adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Sedikit ditekuk (mengeper)' },
            { key: 'B', text: 'Dikunci lurus kaku sekuatnya' },
            { key: 'C', text: 'Jatuh menggunakan dahi terlebih dahulu' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Kedua lutut sedikit ditekuk mengeper untuk meredam benturan' },
            { key: 'B', text: 'Kedua kaki dikunci kaku tanpa menekuk lutut' },
            { key: 'C', text: 'Mendarat memakai satu tumit secara miring' },
            { key: 'D', text: 'Membungkuk hingga kepala menyentuh rumput' }
        ],
        correctAnswer: 'A',
        explanation: 'Menekuk lutut saat mendarat meredam guncangan pada sendi lutut dan pergelangan kaki.',
        cognitiveLevel: 'MOTS',
        topic: 'Teknik Mendarat Aman'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Anak-anak bermain permainan tradisional "Gobak Sodor" dan "Lompat Tali" bersama-sama pada jam istirahat sekolah.',
        question: 'Sikap baik yang harus dijaga saat bermain bersama teman di lapangan adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Bermain jujur, tertib, dan tidak mendorong teman' },
            { key: 'B', text: 'Berbuat curang agar tim sendiri selalu menang' },
            { key: 'C', text: 'Mengejek teman yang kalah bermain' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Jujur, sportif, mematuhi aturan, serta menjaga keselamatan teman' },
            { key: 'B', text: 'Mendorong lawan agar terjatuh di tanah' },
            { key: 'C', text: 'Mengambil tali permainan lalu pulang sendiri' },
            { key: 'D', text: 'Marah besar ketika tersentuh tim penjaga' }
        ],
        correctAnswer: 'A',
        explanation: 'Permainan kelompok melatih kejujuran, kerja sama, dan sportivitas tanpa menyakiti teman.',
        cognitiveLevel: 'LOTS',
        topic: 'Sportivitas Bermain'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Saat duduk membaca dan menulis di meja kelas, ibu guru mengingatkan Kevin agar menyandarkan punggung dengan tegak.',
        question: 'Kebiasaan duduk membungkuk atau miring terlalu lama saat belajar dapat mengganggu pertumbuhan ...',
        optionsFaseA: [
            { key: 'A', text: 'Tulang punggung (tulang belakang)' },
            { key: 'B', text: 'Kuku ibu jari tangan' },
            { key: 'C', text: 'Daun telinga kanan' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Bentuk tulang belakang menjadi bengkok' },
            { key: 'B', text: 'Pertumbuhan rambut dan kuku' },
            { key: 'C', text: 'Warna mata dan kulit' },
            { key: 'D', text: 'Suara saat membaca nyaring' }
        ],
        correctAnswer: 'A',
        explanation: 'Sikap duduk yang tegak menjaga tulang belakang tumbuh lurus dan mencegah sakit punggung.',
        cognitiveLevel: 'MOTS',
        topic: 'Sikap Tubuh Ergonomis'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Zara melempar bola kasti kecil melambung ke atas lalu menangkapnya kembali menggunakan kedua telapak tangan.',
        question: 'Agar bola kasti tidak terlepas saat ditangkap, pandangan mata harus diarahkan ke ...',
        optionsFaseA: [
            { key: 'A', text: 'Arah datangnya bola' },
            { key: 'B', text: 'Sepatu teman di belakang' },
            { key: 'C', text: 'Awan di langit atas' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Arah datangnya bola secara fokus' },
            { key: 'B', text: 'Ujung sepatu sendiri di lantai' },
            { key: 'C', text: 'Pintu gerbang sekolah di samping' },
            { key: 'D', text: 'Menutup kedua mata rapat-rapat' }
        ],
        correctAnswer: 'A',
        explanation: 'Fokus melihat arah datangnya bola dan membuka kedua telapak tangan memudahkan tangkapan yang tepat.',
        cognitiveLevel: 'LOTS',
        topic: 'Melempar dan Menangkap Bola'
    },

    // --- FASE B & C (KELAS 3 - 6) ---
    {
        minGrade: 3, maxGrade: 6,
        stimulus: 'Dalam permainan bulu tangkis, pemain memegang raket dengan teknik pegangan seperti berjabat tangan agar pukulan forehand lebih akurat.',
        question: 'Nama teknik pegangan raket bulu tangkis yang menyerupai posisi berjabat tangan tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Forehand grip' },
            { key: 'B', text: 'Backhand slam' },
            { key: 'C', text: 'Passing bawah' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Forehand grip' },
            { key: 'B', text: 'American grip pukul kasur' },
            { key: 'C', text: 'Chest pass' },
            { key: 'D', text: 'Dribble bola' }
        ],
        correctAnswer: 'A',
        explanation: 'Forehand grip dilakukan seperti berjabat tangan sehingga leluasa mengayunkan raket ke depan maupun samping kanan.',
        cognitiveLevel: 'MOTS',
        topic: 'Permainan Bulu Tangkis'
    },
    {
        minGrade: 3, maxGrade: 6,
        stimulus: 'Pada perlombaan lari sambung (estafet) beregu di lintasan atletik, empat orang pelari secara bergantian menyerahkan benda berbentuk tabung pendek.',
        question: 'Benda berbentuk tabung kecil yang dioper dari pelari pertama hingga pelari keempat pada lomba lari estafet adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Tongkat estafet' },
            { key: 'B', text: 'Bola takraw' },
            { key: 'C', text: 'Peluru besi' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Tongkat estafet (baton)' },
            { key: 'B', text: 'Kok bulu tangkis' },
            { key: 'C', text: 'Peluru tolak' },
            { key: 'D', text: 'Pemukul kasti' }
        ],
        correctAnswer: 'A',
        explanation: 'Lari estafet beregu 4 x 100 m memindahkan tongkat estafet di zona pergantian pelari secara cepat tanpa jatuh.',
        cognitiveLevel: 'LOTS',
        topic: 'Atletik Lari Estafet'
    },
    {
        minGrade: 3, maxGrade: 6,
        stimulus: 'Untuk melatih kelincahan mengubah arah gerak kaki dengan cepat saat bermain bola, pelatih memasang lima kerucut (cone) sejajar.',
        question: 'Bentuk latihan lari berbelok-belok melewati rintangan kerucut secara cepat berguna untuk melatih ...',
        optionsFaseA: [
            { key: 'A', text: 'Kelincahan (agility)' },
            { key: 'B', text: 'Kekuatan leher' },
            { key: 'C', text: 'Ketahanan napas di air' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Kelincahan (agility) mengubah arah gerak' },
            { key: 'B', text: 'Kekuatan angkat beban berat' },
            { key: 'C', text: 'Ketenangan tidur malam' },
            { key: 'D', text: 'Kelenturan jari menulis' }
        ],
        correctAnswer: 'A',
        explanation: 'Lari zig-zag dan shuttle run melatih kelincahan mengubah arah tubuh secara cepat tanpa kehilangan keseimbangan.',
        cognitiveLevel: 'MOTS',
        topic: 'Kelincahan Kebugaran Jasmani'
    },
    {
        minGrade: 3, maxGrade: 6,
        stimulus: 'Pada piring makan sehat "Isi Piringku", separuh piring diisi sayur serta buah-buahan, sedangkan separuh lainnya berisi makanan pokok dan lauk-pauk.',
        question: 'Zat gizi utama pada nasi, jagung, roti, dan kentang yang menjadi sumber tenaga utama tubuh saat berolahraga adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Karbohidrat' },
            { key: 'B', text: 'Vitamin D' },
            { key: 'C', text: 'Serat selulosa' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Karbohidrat' },
            { key: 'B', text: 'Kalsium tulang' },
            { key: 'C', text: 'Zat besi darah' },
            { key: 'D', text: 'Vitamin C jeruk' }
        ],
        correctAnswer: 'A',
        explanation: 'Karbohidrat menghasilkan energi utama bagi otot dan otak selama belajar maupun beraktivitas fisik.',
        cognitiveLevel: 'LOTS',
        topic: 'Gizi Seimbang Pelajar'
    },
    {
        minGrade: 3, maxGrade: 6,
        stimulus: 'Di masa peralihan menuju remaja, anak kelas 5 dan 6 mengalami masa pubertas sehingga kebersihan alat reproduksi dan tubuh harus dijaga ekstra.',
        question: 'Cara tepat menjaga kebersihan pakaian dalam dan kesehatan tubuh pada masa pertumbuhan adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Mandi dua kali sehari dan rutin mengganti pakaian dalam berbahan katun bersih' },
            { key: 'B', text: 'Memakai pakaian olahraga basah berkeringat sepanjang hari' },
            { key: 'C', text: 'Jarang mandi agar menghemat sabun mandi' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Mandi teratur dua kali sehari serta mengganti pakaian dalam bersih berbahan katun' },
            { key: 'B', text: 'Menggunakan pakaian ketat yang lembap seharian' },
            { key: 'C', text: 'Bertukar handuk basah dengan teman di sekolah' },
            { key: 'D', text: 'Membiarkan keringat mengering tanpa dibersihkan' }
        ],
        correctAnswer: 'A',
        explanation: 'Kebersihan tubuh dan mengganti pakaian dalam bersih berbahan katun mencegah pertumbuhan jamur dan bakteri.',
        cognitiveLevel: 'MOTS',
        topic: 'Kebersihan Alat Reproduksi'
    },
    {
        minGrade: 3, maxGrade: 6,
        stimulus: 'Saat berlatih senam lantai, siswa melakukan gerakan tidur telentang lalu mengangkat kedua kaki lurus ke atas sambil pinggang ditopang kedua tangan.',
        question: 'Gerakan senam lantai di mana posisi tubuh terbalik bertumpu pada bahu dan kedua kaki lurus ke atas dinamakan ...',
        optionsFaseA: [
            { key: 'A', text: 'Sikap lilin' },
            { key: 'B', text: 'Guling belakang' },
            { key: 'C', text: 'Lompat kangkang' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Sikap lilin' },
            { key: 'B', text: 'Kayang melengkung' },
            { key: 'C', text: 'Guling lenting' },
            { key: 'D', text: 'Meroda ke samping' }
        ],
        correctAnswer: 'A',
        explanation: 'Sikap lilin melatih keseimbangan dan kekuatan otot perut dengan posisi kaki rapat lurus ke atas menyerupai lilin.',
        cognitiveLevel: 'LOTS',
        topic: 'Senam Lantai Sikap Lilin'
    },
    {
        minGrade: 3, maxGrade: 6,
        stimulus: 'Dalam permainan bola basket, pemain berjalan sambil memantul-mantulkan bola ke lantai menggunakan satu tangan secara terkendali.',
        question: 'Gerakan memantulkan bola basket ke lantai secara berulang sambil bergerak disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Dribbling (menggiring bola)' },
            { key: 'B', text: 'Shooting (menembak ke ring)' },
            { key: 'C', text: 'Rebound (menangkap pantulan)' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Dribbling (menggiring bola)' },
            { key: 'B', text: 'Shooting ke ring' },
            { key: 'C', text: 'Pivot satu kaki' },
            { key: 'D', text: 'Rebound bola gagal' }
        ],
        correctAnswer: 'A',
        explanation: 'Dribbling adalah teknik menggiring bola basket dengan cara memantulkannya ke lantai memakai telapak dan jari tangan.',
        cognitiveLevel: 'LOTS',
        topic: 'Teknik Dribbling Basket'
    },
    {
        minGrade: 3, maxGrade: 6,
        stimulus: 'Sebelum masuk ke kolam renang umum, siswa diwajibkan melakukan pemanasan dan membilas badan di pancuran air bersih.',
        question: 'Aturan keselamatan penting yang wajib ditaati agar terhindar dari kecelakaan saat berada di area tepi kolam renang adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Tidak berlari-lari di lantai tepi kolam yang basah dan licin' },
            { key: 'B', text: 'Langsung melompat ke kolam paling dalam tanpa bisa berenang' },
            { key: 'C', text: 'Bercanda mendorong teman masuk ke kolam secara tiba-tiba' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Dilarang berlari di pinggir kolam yang licin dan tidak mendorong teman' },
            { key: 'B', text: 'Menyelam di area kolam dalam tanpa pengawasan guru' },
            { key: 'C', text: 'Makan makanan berat tepat sebelum meluncur ke air' },
            { key: 'D', text: 'Melompat ke dalam kolam sambil memakai sepatu olahraga' }
        ],
        correctAnswer: 'A',
        explanation: 'Lantai kolam licin berisiko membuat siswa terpeleset dan cedera jika berlari atau saling mendorong.',
        cognitiveLevel: 'MOTS',
        topic: 'Keselamatan di Kolam Renang'
    },
    {
        minGrade: 3, maxGrade: 6,
        stimulus: 'Dalam permainan bola voli mini, bola pertama dari lapangan sendiri dikirimkan melewati net ke daerah lawan sebagai pembuka reli permainan.',
        question: 'Pukulan pertama untuk memulai jalannya permainan dan mengarahkan bola melewati atas net dalam bola voli disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Servis' },
            { key: 'B', text: 'Smash' },
            { key: 'C', text: 'Blocking' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Servis (bawah atau atas)' },
            { key: 'B', text: 'Smash keras' },
            { key: 'C', text: 'Blocking di dekat net' },
            { key: 'D', text: 'Passing bawah' }
        ],
        correctAnswer: 'A',
        explanation: 'Servis adalah pukulan awal dari garis belakang untuk memulai permainan bola voli melewati atas net.',
        cognitiveLevel: 'LOTS',
        topic: 'Teknik Servis Bola Voli'
    },
    {
        minGrade: 3, maxGrade: 6,
        stimulus: 'Pelatih kebugaran jasmani mengukur kekuatan otot perut siswa dengan meminta mereka tidur telentang menekuk lutut lalu mengangkat badan ke arah lutut.',
        question: 'Gerakan latihan kebugaran jasmani yang bertujuan memperkuat otot perut tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Sit-up' },
            { key: 'B', text: 'Push-up' },
            { key: 'C', text: 'Pull-up' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Sit-up' },
            { key: 'B', text: 'Push-up' },
            { key: 'C', text: 'Pull-up' },
            { key: 'D', text: 'Squat jump' }
        ],
        correctAnswer: 'A',
        explanation: 'Sit-up melatih otot perut, push-up melatih lengan dan dada, sedangkan squat jump melatih otot tungkai.',
        cognitiveLevel: 'LOTS',
        topic: 'Latihan Kekuatan Otot Perut'
    },
    {
        minGrade: 3, maxGrade: 6,
        stimulus: 'Penyakit menular seperti demam berdarah dengue (DBD) menyebar melalui gigitan nyamuk Aedes aegypti yang berkembang biak di genangan air bersih.',
        question: 'Tindakan pencegahan nyamuk demam berdarah melalui gerakan 3M Plus di lingkungan rumah dan sekolah meliputi ...',
        optionsFaseA: [
            { key: 'A', text: 'Menguras bak mandi, menutup tempat penampungan air, dan mendaur ulang barang bekas' },
            { key: 'B', text: 'Membiarkan kaleng bekas terisi air hujan di kebun' },
            { key: 'C', text: 'Menutup jendela rumah sepanjang hari tanpa cahaya' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menguras wadah air, menutup rapat penampungan air, serta mendaur ulang barang bekas penampung air' },
            { key: 'B', text: 'Mengumpulkan ban bekas terbuka di halaman belakang' },
            { key: 'C', text: 'Membuang sampah plastik ke dalam selokan depan rumah' },
            { key: 'D', text: 'Membiarkan vas bunga tanpa diganti airnya berbulan-bulan' }
        ],
        correctAnswer: 'A',
        explanation: 'Program 3M memutus siklus hidup jentik nyamuk pembawa virus demam berdarah.',
        cognitiveLevel: 'HOTS',
        topic: 'Pencegahan Penyakit Menular'
    }
];
