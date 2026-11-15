import type { QuestionBankItemPG } from './questionBankHelper';

// Extended PG banks (Part 2: Seni Rupa, Bahasa Inggris, PAI, Koding & KA, Bahasa Sunda)
// Every item is distinct from base banks and strictly grade-scoped (Kurikulum Merdeka SD).

export const EXTENDED_SENI_PG: QuestionBankItemPG[] = [
    // --- FASE A (KELAS 1 - 2) ---
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Sita menggambar rumah impiannya. Atap rumah digambar menggunakan bentuk garis miring ke kiri dan ke kanan yang bertemu di atas.',
        question: 'Jenis garis yang dipakai Sita untuk membuat atap rumah adalah garis ...',
        optionsFaseA: [
            { key: 'A', text: 'Miring / zig-zag' },
            { key: 'B', text: 'Lengkung' },
            { key: 'C', text: 'Lingkaran' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Miring / zig-zag' },
            { key: 'B', text: 'Lengkung' },
            { key: 'C', text: 'Spiral' },
            { key: 'D', text: 'Gelombang' }
        ],
        correctAnswer: 'A',
        explanation: 'Atap rumah lancip tersusun dari garis lurus miring yang bertemu di puncak.',
        cognitiveLevel: 'LOTS',
        topic: 'Unsur Garis Seni Rupa'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Dito meraba kulit buah salak lalu meraba permukaan kaca jendela kelas.',
        question: 'Permukaan benda yang terasa berbintik-bintik dan tidak licin saat diraba seperti kulit salak disebut bertekstur ...',
        optionsFaseA: [
            { key: 'A', text: 'Kasar' },
            { key: 'B', text: 'Halus' },
            { key: 'C', text: 'Cair' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Kasar' },
            { key: 'B', text: 'Halus' },
            { key: 'C', text: 'Rata' },
            { key: 'D', text: 'Licin' }
        ],
        correctAnswer: 'A',
        explanation: 'Tekstur kasar terasa tidak rata ketika disentuh, seperti kulit salak, ampelas, atau batang pohon.',
        cognitiveLevel: 'LOTS',
        topic: 'Tekstur Benda'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Rafi melipat kertas origami warna biru menjadi bentuk pesawat dan perahu.',
        question: 'Alat bantu utama yang digunakan saat ingin memotong kertas gambar mengikuti pola bentuk adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Gunting kertas' },
            { key: 'B', text: 'Penghapus karet' },
            { key: 'C', text: 'Kuas cat' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Gunting kertas' },
            { key: 'B', text: 'Penghapus karet' },
            { key: 'C', text: 'Kuas cat' },
            { key: 'D', text: 'Rautan pensil' }
        ],
        correctAnswer: 'A',
        explanation: 'Gunting kertas dipakai untuk memotong kertas sesuai pola bentuk dengan hati-hati.',
        cognitiveLevel: 'LOTS',
        topic: 'Alat Berkarya Rupa'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Lani menggambar bunga matahari memakai krayon berwarna kuning cerah dan hijau.',
        question: 'Sifat alat mewarnai krayon yang berbahan lilin adalah menghasilkan goresan warna yang ...',
        optionsFaseA: [
            { key: 'A', text: 'Tebal dan cerah' },
            { key: 'B', text: 'Transparan seperti air' },
            { key: 'C', text: 'Tidak terlihat di kertas' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Tebal dan cerah' },
            { key: 'B', text: 'Encer dan transparan' },
            { key: 'C', text: 'Mudah menguap' },
            { key: 'D', text: 'Berbau seperti logam' }
        ],
        correctAnswer: 'A',
        explanation: 'Krayon terbuat dari lilin dan pigmen sehingga menghasilkan warna tebal, pekat, dan cerah.',
        cognitiveLevel: 'LOTS',
        topic: 'Media Mewarnai'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Pada dinding kelas tertempel hiasan berbentuk segitiga, lingkaran, dan persegi panjang dari kertas warna.',
        question: 'Bentuk segitiga, lingkaran, dan persegi termasuk kelompok bentuk ...',
        optionsFaseA: [
            { key: 'A', text: 'Geometris (beraturan)' },
            { key: 'B', text: 'Organis (tumbuhan)' },
            { key: 'C', text: 'Acak tidak berbentuk' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Geometris (beraturan)' },
            { key: 'B', text: 'Organis (alami)' },
            { key: 'C', text: 'Abstrak murni' },
            { key: 'D', text: 'Tiga dimensi' }
        ],
        correctAnswer: 'A',
        explanation: 'Bentuk geometris adalah bentuk beraturan yang dapat diukur seperti lingkaran, segitiga, dan persegi.',
        cognitiveLevel: 'MOTS',
        topic: 'Bentuk Geometris'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Mila menempelkan daun kering di buku gambar menggunakan lem kertas hingga membentuk gambar ikan.',
        question: 'Agar daun kering menempel kuat dan rapi pada kertas gambar, Mila perlu mengoleskan ...',
        optionsFaseA: [
            { key: 'A', text: 'Lem kertas secukupnya' },
            { key: 'B', text: 'Air dingin' },
            { key: 'C', text: 'Minyak goreng' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Lem kertas secukupnya' },
            { key: 'B', text: 'Air dingin' },
            { key: 'C', text: 'Tinta spidol' },
            { key: 'D', text: 'Pasir halus' }
        ],
        correctAnswer: 'A',
        explanation: 'Lem berfungsi sebagai perekat bahan alam seperti daun kering ke permukaan kertas.',
        cognitiveLevel: 'LOTS',
        topic: 'Karya Tempel Bahan Alam'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Ibu guru memutarkan lagu anak "Cicak-Cicak di Dinding" dan mengajak siswa bertepuk tangan mengikuti irama.',
        question: 'Alat tubuh yang paling mudah digunakan untuk mengiringi ketukan irama lagu secara langsung adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Tepuk kedua tangan' },
            { key: 'B', text: 'Kedipan mata' },
            { key: 'C', text: 'Gelengan bahu pelan' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Tepuk kedua tangan' },
            { key: 'B', text: 'Kedipan mata' },
            { key: 'C', text: 'Senyuman lebar' },
            { key: 'D', text: 'Duduk diam' }
        ],
        correctAnswer: 'A',
        explanation: 'Tepuk tangan menghasilkan bunyi ritmis yang teratur untuk mengiringi lagu.',
        cognitiveLevel: 'LOTS',
        topic: 'Irama dan Tepuk Tangan'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Andi melihat gambar pemandangan sawah yang diberi warna hijau pada padi dan biru pada langit.',
        question: 'Warna langit cerah di siang hari yang biasa dipakai saat menggambar adalah warna ...',
        optionsFaseA: [
            { key: 'A', text: 'Biru muda' },
            { key: 'B', text: 'Hitam pekat' },
            { key: 'C', text: 'Cokelat tua' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Biru muda' },
            { key: 'B', text: 'Hitam pekat' },
            { key: 'C', text: 'Abu-abu gelap' },
            { key: 'D', text: 'Cokelat tua' }
        ],
        correctAnswer: 'A',
        explanation: 'Langit cerah siang hari identik dengan warna biru muda atau biru langit.',
        cognitiveLevel: 'LOTS',
        topic: 'Warna Alam Sekitar'
    },
    // --- FASE B (KELAS 3 - 4) ---
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Siswa kelas membuat karya cetak tinggi sederhana dengan mengukir bentuk bintang pada potongan kentang lalu mencelupkannya ke cat air.',
        question: 'Teknik berkarya seni rupa dengan menekan acuan berpola yang sudah diberi tinta ke permukaan kertas disebut teknik ...',
        optionsFaseA: [
            { key: 'A', text: 'Cetak / stempel' },
            { key: 'B', text: 'Butsir tanah liat' },
            { key: 'C', text: 'Anyam bambu' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Cetak (seni grafis sederhana)' },
            { key: 'B', text: 'Butsir tanah liat' },
            { key: 'C', text: 'Anyam bilah bambu' },
            { key: 'D', text: 'Cor logam' }
        ],
        correctAnswer: 'A',
        explanation: 'Stempel kentang atau pelepah pisang merupakan teknik cetak sederhana dalam seni rupa.',
        cognitiveLevel: 'MOTS',
        topic: 'Teknik Cetak Sederhana'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Pada gambar poster pameran sekolah, tulisan judul diletakkan di bagian atas tengah sementara gambar ilustrasi berada di tengah.',
        question: 'Pengaturan letak objek gambar dan tulisan agar tampak rapi, serasi, dan enak dilihat disebut prinsip ...',
        optionsFaseA: [
            { key: 'A', text: 'Komposisi' },
            { key: 'B', text: 'Pewarnaan' },
            { key: 'C', text: 'Pemotongan' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Komposisi' },
            { key: 'B', text: 'Arsiran' },
            { key: 'C', text: 'Perspektif jauh' },
            { key: 'D', text: 'Pencetakan' }
        ],
        correctAnswer: 'A',
        explanation: 'Komposisi adalah tata susunan unsur rupa pada bidang gambar agar harmonis dan seimbang.',
        cognitiveLevel: 'MOTS',
        topic: 'Prinsip Komposisi Rupa'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Saat menggambar benda yang terkena cahaya matahari dari sisi kanan, bagian sisi kiri benda digambar lebih gelap dengan garis-garis sejajar.',
        question: 'Teknik menggambar bayangan dengan menggoreskan garis tipis berulang untuk membedakan sisi terang dan gelap disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Arsir' },
            { key: 'B', text: 'Mozaik' },
            { key: 'C', text: 'Lipat' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Arsir' },
            { key: 'B', text: 'Mozaik' },
            { key: 'C', text: 'Pointilis' },
            { key: 'D', text: 'Semprot' }
        ],
        correctAnswer: 'A',
        explanation: 'Teknik arsir menggunakan goresan garis sejajar atau menyilang untuk menciptakan kesan gelap-terang dan volume.',
        cognitiveLevel: 'MOTS',
        topic: 'Teknik Arsir Gelap Terang'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Pengrajin membuat tempat pensil hias dengan cara menyusun silang-menyilang pita kertas warna secara teratur hingga rapat.',
        question: 'Karya kerajinan yang dibuat dengan menumpangkan atau menyilangkan bahan pipih seperti pita, pandan, atau bambu disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Anyaman' },
            { key: 'B', text: 'Ukiran' },
            { key: 'C', text: 'Lukisan' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Anyaman' },
            { key: 'B', text: 'Ukiran kayu' },
            { key: 'C', text: 'Patung tanah liat' },
            { key: 'D', text: 'Lukisan cat minyak' }
        ],
        correctAnswer: 'A',
        explanation: 'Anyaman adalah teknik menjalin bahan pipih secara silang-menyilang (lungsi dan pakan).',
        cognitiveLevel: 'LOTS',
        topic: 'Kerajinan Anyaman'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Dalam ruang kelas terdapat pajangan bunga kertas dan tempat sampah hias yang dibuat siswa dari botol plastik bekas air mineral.',
        question: 'Manfaat utama membuat karya seni rupa dari bahan bekas plastik dan kardus di sekolah adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Mengurangi sampah sekaligus melatih kreativitas' },
            { key: 'B', text: 'Menambah tumpukan limbah rumah tangga' },
            { key: 'C', text: 'Membuat kelas menjadi lebih kotor' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Mengurangi sampah sekaligus melatih kreativitas daur ulang' },
            { key: 'B', text: 'Membuat sampah semakin sulit diurai' },
            { key: 'C', text: 'Menggantikan fungsi buku pelajaran' },
            { key: 'D', text: 'Menghabiskan biaya sangat mahal' }
        ],
        correctAnswer: 'A',
        explanation: 'Karya daur ulang memanfaatkan barang bekas bernilai guna sehingga mengurangi pencemaran lingkungan.',
        cognitiveLevel: 'HOTS',
        topic: 'Karya Daur Ulang'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Saat mengarsir atau melukis buah apel, pelukis mencampurkan sedikit warna putih ke warna merah agar tampak bagian yang terkena cahaya.',
        question: 'Tujuan mencampurkan warna putih pada suatu warna cat dalam seni lukis adalah menghasilkan tingkat warna yang lebih ...',
        optionsFaseA: [
            { key: 'A', text: 'Terang (muda)' },
            { key: 'B', text: 'Gelap (pekat)' },
            { key: 'C', text: 'Hitam' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Terang atau muda (tint)' },
            { key: 'B', text: 'Gelap atau tua (shade)' },
            { key: 'C', text: 'Kusam dan abu-abu' },
            { key: 'D', text: 'Pudar tanpa pigmen' }
        ],
        correctAnswer: 'A',
        explanation: 'Penambahan warna putih menghasilkan gradasi nada warna yang lebih terang (tint).',
        cognitiveLevel: 'MOTS',
        topic: 'Gradasi Warna'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Sebuah lagu daerah dinyanyikan bersama kelompok paduan suara sekolah dengan ketukan yang pelan dan penuh penghayatan.',
        question: 'Cepat atau lambatnya ketukan lagu saat dinyanyikan dalam seni musik disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Tempo' },
            { key: 'B', text: 'Lirik' },
            { key: 'C', text: 'Kostum' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Tempo' },
            { key: 'B', text: 'Dinamika keras-lembut' },
            { key: 'C', text: 'Timbre suara' },
            { key: 'D', text: 'Partitur' }
        ],
        correctAnswer: 'A',
        explanation: 'Tempo adalah ukuran kecepatan birama atau ketukan dalam sebuah lagu.',
        cognitiveLevel: 'LOTS',
        topic: 'Tempo Lagu'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Dalam tarian daerah berkelompok, para penari membentuk barisan lurus sejajar menghadap ke arah penonton.',
        question: 'Garis imajiner di lantai panggung yang dilalui dan dibentuk oleh formasi para penari saat menari disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Pola lantai' },
            { key: 'B', text: 'Tata rias' },
            { key: 'C', text: 'Panggung terbuka' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Pola lantai' },
            { key: 'B', text: 'Tata busana' },
            { key: 'C', text: 'Tata cahaya' },
            { key: 'D', text: 'Naskah drama' }
        ],
        correctAnswer: 'A',
        explanation: 'Pola lantai adalah pola garis denah gerak dan posisi penari di atas panggung (lurus, lengkung, diagonal, lingkaran).',
        cognitiveLevel: 'LOTS',
        topic: 'Pola Lantai Tari'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Pengrajin membuat topeng tari dari bahan kayu ringan yang dipahat mengikuti ekspresi wajah tokoh cerita.',
        question: 'Fungsi utama properti topeng dalam sebuah pementasan seni tari atau teater tradisional adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Memperkuat karakter dan ekspresi tokoh yang diperankan' },
            { key: 'B', text: 'Menghalangi penari melihat arah panggung' },
            { key: 'C', text: 'Menggantikan alat musik pengiring' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Memperkuat karakter dan ekspresi tokoh dalam cerita' },
            { key: 'B', text: 'Membatasi ruang gerak penari di panggung' },
            { key: 'C', text: 'Menggantikan fungsi tata lampu' },
            { key: 'D', text: 'Mempersulit penonton mengenali tokoh' }
        ],
        correctAnswer: 'A',
        explanation: 'Topeng membantu menggambarkan watak tokoh (gagah, jenaka, bijaksana, atau lembut) secara visual.',
        cognitiveLevel: 'MOTS',
        topic: 'Karya Seni Topeng'
    },
    // --- FASE C (KELAS 5 - 6) ---
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Seorang siswa menggambar pemandangan jalan raya yang lurus. Semakin jauh ke arah garis cakrawala, lebar jalan dan tinggi tiang lampu digambar semakin mengecil.',
        question: 'Prinsip menggambar untuk menciptakan kesan ruang jauh-dekat sesuai penglihatan mata manusia tersebut dinamakan ...',
        optionsFaseA: [
            { key: 'A', text: 'Perspektif' },
            { key: 'B', text: 'Simetri lipat' },
            { key: 'C', text: 'Deformasi' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Perspektif' },
            { key: 'B', text: 'Siluet hitam' },
            { key: 'C', text: 'Distorsi bentuk' },
            { key: 'D', text: 'Kaligrafi' }
        ],
        correctAnswer: 'A',
        explanation: 'Perspektif menggambarkan kesan jarak dan kedalaman ruang menuju titik hilang di garis horizon.',
        cognitiveLevel: 'MOTS',
        topic: 'Gambar Perspektif'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Dalam pameran seni sekolah, panitia menata karya tiga dimensi seperti patung dan gerabah di atas meja penyangga, sedangkan lukisan digantung sejajar mata.',
        question: 'Karya seni rupa tiga dimensi seperti gerabah dan patung memiliki ciri utama yaitu ...',
        optionsFaseA: [
            { key: 'A', text: 'Mempunyai panjang, lebar, tinggi serta dapat diamati dari segala arah' },
            { key: 'B', text: 'Hanya memiliki panjang dan lebar di atas kertas datar' },
            { key: 'C', text: 'Tidak dapat disentuh dan tidak menempati ruang' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Memiliki ukuran panjang, lebar, tinggi/volume dan bisa dilihat dari berbagai sudut pandang' },
            { key: 'B', text: 'Hanya dapat dinikmati dari satu arah depan saja' },
            { key: 'C', text: 'Hanya berwujud garis tipis di atas kanvas datar' },
            { key: 'D', text: 'Tidak memiliki massa maupun ruang nyata' }
        ],
        correctAnswer: 'A',
        explanation: 'Seni rupa tiga dimensi menempati ruang nyata dengan tiga ukuran (panjang, lebar, tinggi) serta bervolume.',
        cognitiveLevel: 'MOTS',
        topic: 'Karya Tiga Dimensi'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Sebuah patung hiasan dibuat dengan cara menempelkan dan membentuk gumpalan tanah liat sedikit demi sedikit menggunakan jari dan sudip.',
        question: 'Teknik pembuatan patung dari bahan lunak seperti tanah liat atau plastisin dengan mengurangi maupun menambah bahan disebut teknik ...',
        optionsFaseA: [
            { key: 'A', text: 'Butsir' },
            { key: 'B', text: 'Pahat batu' },
            { key: 'C', text: 'Las besi' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Butsir' },
            { key: 'B', text: 'Pahat' },
            { key: 'C', text: 'Cor / tuang logam' },
            { key: 'D', text: 'Tenun benang' }
        ],
        correctAnswer: 'A',
        explanation: 'Teknik butsir digunakan untuk membentuk karya tiga dimensi dari bahan lunak seperti tanah liat dan plastisin.',
        cognitiveLevel: 'MOTS',
        topic: 'Teknik Pembuatan Patung'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Pada selembar kain batik pesisir, pengrajin menggambar motif bunga dan burung dengan garis lengkung luwes dan pewarnaan cerah.',
        question: 'Alat khusus berbentuk seperti pena bercucuk tembaga yang digunakan untuk menuliskan malam panas pada batik tulis disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Canting' },
            { key: 'B', text: 'Palet' },
            { key: 'C', text: 'Sudip' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Canting' },
            { key: 'B', text: 'Palet cat' },
            { key: 'C', text: 'Pahat ukir' },
            { key: 'D', text: 'Pisau cukil' }
        ],
        correctAnswer: 'A',
        explanation: 'Canting dipakai untuk menorehkan lilin malam cair di atas kain mori saat membatik tulis.',
        cognitiveLevel: 'LOTS',
        topic: 'Seni Batik Tradisional'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Poster bertema hemat energi listrik memadukan warna latar biru tua dengan tulisan utama berwarna kuning cerah berukuran besar.',
        question: 'Alasan desainer memadukan latar biru tua dengan teks kuning cerah pada poster tersebut adalah menerapkan prinsip ...',
        optionsFaseA: [
            { key: 'A', text: 'Kontras agar pesan utama mudah terbaca jelas' },
            { key: 'B', text: 'Kamulfase agar tulisan tidak terlihat mata' },
            { key: 'C', text: 'Monokrom tanpa perbedaan warna sama sekali' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Kontras agar pesan teks langsung menonjol dan mudah dibaca' },
            { key: 'B', text: 'Kesamaan warna supaya tulisan tersamarkan' },
            { key: 'C', text: 'Pengulangan pola simetris tanpa teks' },
            { key: 'D', text: 'Tekstur kasar pada bidang gambar' }
        ],
        correctAnswer: 'A',
        explanation: 'Prinsip kontras memadukan warna gelap dan terang agar objek atau pesan utama menjadi pusat perhatian.',
        cognitiveLevel: 'HOTS',
        topic: 'Desain Poster dan Kontras'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Sekelompok siswa menyusun simpul-simpul tali katun menjadi hiasan dinding dan gantungan pot bunga tanpa memakai jarum rajut.',
        question: 'Karya kerajinan seni kriya yang dibuat dengan teknik membuat berbagai variasi simpul pada tali atau benang disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Makrame' },
            { key: 'B', text: 'Sulam pita' },
            { key: 'C', text: 'Sablon saring' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Makrame' },
            { key: 'B', text: 'Sulam kristal' },
            { key: 'C', text: 'Sablon saring' },
            { key: 'D', text: 'Lukis kaca' }
        ],
        correctAnswer: 'A',
        explanation: 'Makrame adalah seni merangkai tali menggunakan berbagai teknik simpul tangan hingga membentuk pola dekoratif.',
        cognitiveLevel: 'MOTS',
        topic: 'Seni Simpul Makrame'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Dalam pertunjukan musik ansambel di sekolah, siswa memainkan pianika, rekorder, dan kendang kecil secara bersama-sama.',
        question: 'Dari ketiga alat musik yang dimainkan tersebut, yang termasuk alat musik ritmis (tidak bernada) adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Kendang' },
            { key: 'B', text: 'Pianika' },
            { key: 'C', text: 'Rekorder' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Kendang' },
            { key: 'B', text: 'Pianika' },
            { key: 'C', text: 'Rekorder' },
            { key: 'D', text: 'Gitar akustik' }
        ],
        correctAnswer: 'A',
        explanation: 'Kendang merupakan alat musik ritmis pengatur ketukan irama, sedangkan pianika dan rekorder bernada (melodis).',
        cognitiveLevel: 'MOTS',
        topic: 'Alat Musik Ritmis dan Melodis'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Para penari Saman dari Aceh tampil duduk berjajar sangat rapat sambil menggerakkan tangan dan menepuk dada secara serempak dengan tempo cepat.',
        question: 'Aspek paling menentukan keberhasilan penyajian tari Saman secara berkelompok seperti ilustrasi tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Kekompakan gerak dan ketepatan irama antarpenari' },
            { key: 'B', text: 'Kecepatan penari berpindah ke sudut panggung' },
            { key: 'C', text: 'Kebebasan setiap penari membuat gerakan sendiri' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Kekompakan, keserempakan gerak, dan ketepatan irama antarpenari' },
            { key: 'B', text: 'Gerakan improvisasi bebas tiap penari tanpa hitungan' },
            { key: 'C', text: 'Penggunaan properti senjata tajam di atas panggung' },
            { key: 'D', text: 'Jumlah penonton yang ikut menari bersama' }
        ],
        correctAnswer: 'A',
        explanation: 'Tari Saman mengandalkan kekompakan, keserempakan gerak tangan dan badan, serta ketepatan irama.',
        cognitiveLevel: 'HOTS',
        topic: 'Tari Daerah Nusantara'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Seorang anak menampilkan adegan pantomim tentang kegiatan menanam bibit pohon dan menyiramnya dengan gerak tubuh serta ekspresi wajah tanpa berbicara sepatah kata pun.',
        question: 'Dua unsur utama yang menjadi kekuatan penyampaian cerita dalam seni teater pantomim adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Ekspresi mimik wajah dan gerak tubuh yang jelas' },
            { key: 'B', text: 'Dialog panjang dan nyanyian vokal keras' },
            { key: 'C', text: 'Dekorasi panggung yang serba mewah' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Ekspresi mimik wajah dan olah gerak tubuh yang ekspresif' },
            { key: 'B', text: 'Naskah dialog panjang dan suara lantang' },
            { key: 'C', text: 'Pencahayaan gelap total tanpa terlihat aktor' },
            { key: 'D', text: 'Iringan paduan suara sepanjang pertunjukan' }
        ],
        correctAnswer: 'A',
        explanation: 'Pantomim adalah seni pertunjukan tanpa kata yang mengandalkan mimik wajah dan gestur tubuh imajinatif.',
        cognitiveLevel: 'MOTS',
        topic: 'Seni Teater Pantomim'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Siswa menempelkan potongan-potongan kertas kecil warna-warni dari majalah bekas secara rapat pada sketsa gambar burung garuda.',
        question: 'Karya seni rupa tempel yang tersusun dari kepingan bahan sejenis berukuran kecil (seperti potongan kertas, keramik, atau kulit telur) disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Mozaik' },
            { key: 'B', text: 'Sketsa pensil' },
            { key: 'C', text: 'Relief batu' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Mozaik' },
            { key: 'B', text: 'Sketsa pensil' },
            { key: 'C', text: 'Relief batu' },
            { key: 'D', text: 'Karikatur' }
        ],
        correctAnswer: 'A',
        explanation: 'Mozaik dibuat dengan menempelkan kepingan bahan padat sejenis berukuran kecil membentuk satu gambar utuh.',
        cognitiveLevel: 'LOTS',
        topic: 'Karya Seni Mozaik'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Setelah pameran seni rupa kelas selesai, siswa menuliskan kesan, kelebihan, dan saran perbaikan secara santun di buku komentar pameran.',
        question: 'Kegiatan mengamati, memahami, dan menghargai karya seni milik teman dengan penuh kesantunan disebut kegiatan ...',
        optionsFaseA: [
            { key: 'A', text: 'Apresiasi seni' },
            { key: 'B', text: 'Produksi massal' },
            { key: 'C', text: 'Manipulasi karya' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Apresiasi seni' },
            { key: 'B', text: 'Komersialisasi karya' },
            { key: 'C', text: 'Duplikasi karya' },
            { key: 'D', text: 'Evaluasi harga jual' }
        ],
        correctAnswer: 'A',
        explanation: 'Apresiasi seni berarti mengenali, menilai, dan menghargai nilai keindahan suatu karya seni.',
        cognitiveLevel: 'MOTS',
        topic: 'Apresiasi Karya Seni'
    }
];

export const EXTENDED_INGGRIS_PG: QuestionBankItemPG[] = [
    // --- FASE A (KELAS 1 - 2) ---
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Look at the school bag on the desk. Its color is like a ripe banana.',
        question: 'What is the color of the school bag?',
        optionsFaseA: [
            { key: 'A', text: 'Yellow' },
            { key: 'B', text: 'Purple' },
            { key: 'C', text: 'Black' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Yellow' },
            { key: 'B', text: 'Purple' },
            { key: 'C', text: 'Black' },
            { key: 'D', text: 'Grey' }
        ],
        correctAnswer: 'A',
        explanation: 'A ripe banana is yellow.',
        cognitiveLevel: 'LOTS',
        topic: 'Colors'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Mia counts her pencils on the table: one, two, three, four, five.',
        question: 'How many pencils are there if Mia adds two more pencils?',
        optionsFaseA: [
            { key: 'A', text: 'Six' },
            { key: 'B', text: 'Seven' },
            { key: 'C', text: 'Eight' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Six' },
            { key: 'B', text: 'Seven' },
            { key: 'C', text: 'Eight' },
            { key: 'D', text: 'Nine' }
        ],
        correctAnswer: 'B',
        explanation: 'Five (5) plus two (2) equals seven (7).',
        cognitiveLevel: 'MOTS',
        topic: 'Numbers 1-10'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Every morning at 7 o\'clock, Leo greets his teacher at the school gate.',
        question: 'What greeting should Leo say at 7 a.m.?',
        optionsFaseA: [
            { key: 'A', text: 'Good morning, Teacher!' },
            { key: 'B', text: 'Good night, Teacher!' },
            { key: 'C', text: 'Good evening, Teacher!' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Good morning, Teacher!' },
            { key: 'B', text: 'Good night, Teacher!' },
            { key: 'C', text: 'Good evening, Teacher!' },
            { key: 'D', text: 'See you next year!' }
        ],
        correctAnswer: 'A',
        explanation: 'We say "Good morning" when greeting someone in the morning.',
        cognitiveLevel: 'LOTS',
        topic: 'Greetings'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Father has a mother and father. My father\'s father lives in the village.',
        question: 'In English, my father\'s father is my ...',
        optionsFaseA: [
            { key: 'A', text: 'Grandfather' },
            { key: 'B', text: 'Brother' },
            { key: 'C', text: 'Uncle' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Grandfather' },
            { key: 'B', text: 'Brother' },
            { key: 'C', text: 'Uncle' },
            { key: 'D', text: 'Cousin' }
        ],
        correctAnswer: 'A',
        explanation: 'A father\'s father (kakek) is called grandfather in English.',
        cognitiveLevel: 'LOTS',
        topic: 'My Family'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'In the classroom, the teacher writes the lesson using a marker on the whiteboard.',
        question: 'We use our eyes to ... the writing on the whiteboard.',
        optionsFaseA: [
            { key: 'A', text: 'See and read' },
            { key: 'B', text: 'Smell' },
            { key: 'C', text: 'Taste' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'See and read' },
            { key: 'B', text: 'Smell' },
            { key: 'C', text: 'Taste' },
            { key: 'D', text: 'Hear' }
        ],
        correctAnswer: 'A',
        explanation: 'Eyes are used for seeing and reading.',
        cognitiveLevel: 'LOTS',
        topic: 'Parts of Body'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Look at the pet animal at Tim\'s house. It says "Meow" and loves to drink milk.',
        question: 'What animal is Tim\'s pet?',
        optionsFaseA: [
            { key: 'A', text: 'A cat' },
            { key: 'B', text: 'A duck' },
            { key: 'C', text: 'A cow' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'A cat' },
            { key: 'B', text: 'A duck' },
            { key: 'C', text: 'A cow' },
            { key: 'D', text: 'A goat' }
        ],
        correctAnswer: 'A',
        explanation: 'A cat makes the sound "Meow".',
        cognitiveLevel: 'LOTS',
        topic: 'Animals Around Us'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Inside my pencil case, there is a ruler, an eraser, and a pencil.',
        question: 'Which object do we use to clean a wrong pencil line on paper?',
        optionsFaseA: [
            { key: 'A', text: 'Eraser' },
            { key: 'B', text: 'Ruler' },
            { key: 'C', text: 'Sharpener' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Eraser' },
            { key: 'B', text: 'Ruler' },
            { key: 'C', text: 'Sharpener' },
            { key: 'D', text: 'Crayon' }
        ],
        correctAnswer: 'A',
        explanation: 'An eraser (penghapus) removes pencil marks on paper.',
        cognitiveLevel: 'LOTS',
        topic: 'Classroom Objects'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Lily is very thirsty after playing in the school yard.',
        question: 'What does Lily need right now?',
        optionsFaseA: [
            { key: 'A', text: 'A glass of water' },
            { key: 'B', text: 'A pair of shoes' },
            { key: 'C', text: 'A comic book' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'A glass of water' },
            { key: 'B', text: 'A pair of shoes' },
            { key: 'C', text: 'A comic book' },
            { key: 'D', text: 'A wooden chair' }
        ],
        correctAnswer: 'A',
        explanation: 'When someone is thirsty (haus), they need water to drink.',
        cognitiveLevel: 'LOTS',
        topic: 'Food and Drink'
    },
    // --- FASE B (KELAS 3 - 4) ---
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Look at the picture in your book: "The cat is sleeping UNDER the wooden table."',
        question: 'Where is the cat sleeping?',
        optionsFaseA: [
            { key: 'A', text: 'Below the table' },
            { key: 'B', text: 'On top of the table' },
            { key: 'C', text: 'Behind the door' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Below / beneath the table' },
            { key: 'B', text: 'On top of the table' },
            { key: 'C', text: 'Inside the cupboard' },
            { key: 'D', text: 'Next to the window' }
        ],
        correctAnswer: 'A',
        explanation: 'The preposition "under" means beneath or directly below something.',
        cognitiveLevel: 'LOTS',
        topic: 'Prepositions of Place'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Today is Wednesday. Tomorrow the students will have an English club after school.',
        question: 'What day will the English club be held tomorrow?',
        optionsFaseA: [
            { key: 'A', text: 'Tuesday' },
            { key: 'B', text: 'Thursday' },
            { key: 'C', text: 'Friday' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Tuesday' },
            { key: 'B', text: 'Thursday' },
            { key: 'C', text: 'Friday' },
            { key: 'D', text: 'Monday' }
        ],
        correctAnswer: 'B',
        explanation: 'The day after Wednesday is Thursday (Kamis).',
        cognitiveLevel: 'LOTS',
        topic: 'Days of the Week'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Ryan goes to school at half past six in the morning. He takes a bath at six o\'clock first.',
        question: 'What time does Ryan go to school?',
        optionsFaseA: [
            { key: 'A', text: '06.00' },
            { key: 'B', text: '06.30' },
            { key: 'C', text: '07.30' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '06.00' },
            { key: 'B', text: '06.30' },
            { key: 'C', text: '07.00' },
            { key: 'D', text: '07.30' }
        ],
        correctAnswer: 'B',
        explanation: '"Half past six" means thirty minutes after six, which is 06.30.',
        cognitiveLevel: 'MOTS',
        topic: 'Telling Time'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'In the living room, Grandmother usually sits on a soft sofa while reading a newspaper.',
        question: 'In which room of the house can we usually find a bed and a pillow?',
        optionsFaseA: [
            { key: 'A', text: 'Bedroom' },
            { key: 'B', text: 'Kitchen' },
            { key: 'C', text: 'Bathroom' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Bedroom' },
            { key: 'B', text: 'Kitchen' },
            { key: 'C', text: 'Bathroom' },
            { key: 'D', text: 'Garage' }
        ],
        correctAnswer: 'A',
        explanation: 'A bed and pillow for sleeping are found in the bedroom.',
        cognitiveLevel: 'LOTS',
        topic: 'Rooms in the House'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Noah wants to cross the busy street in front of the school. The traffic light for pedestrians turns green.',
        question: 'Where is the safest place for Noah to cross the street?',
        optionsFaseA: [
            { key: 'A', text: 'On the zebra crossing' },
            { key: 'B', text: 'In the middle of parked trucks' },
            { key: 'C', text: 'Behind a moving bus' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'On the zebra crossing' },
            { key: 'B', text: 'Between fast motorcycles' },
            { key: 'C', text: 'Behind a moving bus' },
            { key: 'D', text: 'Around a blind corner' }
        ],
        correctAnswer: 'A',
        explanation: 'Pedestrians should always cross safely on a zebra crossing.',
        cognitiveLevel: 'MOTS',
        topic: 'Public Places & Safety'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Look at the weather outside! Dark clouds cover the sky and heavy water falls from above.',
        question: 'What should Nora bring when walking home in rainy weather?',
        optionsFaseA: [
            { key: 'A', text: 'An umbrella or raincoat' },
            { key: 'B', text: 'Sunglasses' },
            { key: 'C', text: 'Swimming goggles' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'An umbrella or raincoat' },
            { key: 'B', text: 'Sunglasses' },
            { key: 'C', text: 'A kite' },
            { key: 'D', text: 'A woolen blanket' }
        ],
        correctAnswer: 'A',
        explanation: 'On a rainy day, an umbrella or raincoat keeps us dry.',
        cognitiveLevel: 'LOTS',
        topic: 'Weather and Seasons'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'My sister [ ... ] planting sunflowers in the garden right now.',
        question: 'The correct word to complete the Present Continuous sentence above is ...',
        optionsFaseA: [
            { key: 'A', text: 'is' },
            { key: 'B', text: 'are' },
            { key: 'C', text: 'am' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'is' },
            { key: 'B', text: 'are' },
            { key: 'C', text: 'am' },
            { key: 'D', text: 'were' }
        ],
        correctAnswer: 'A',
        explanation: 'Singular subject "My sister" (she) uses "is" + verb-ing.',
        cognitiveLevel: 'MOTS',
        topic: 'Present Continuous Tense'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Read the short notice on the school wall: "KEEP THE CLASSROOM CLEAN. PUT TRASH IN THE BIN."',
        question: 'What does the notice ask students to do?',
        optionsFaseA: [
            { key: 'A', text: 'Throw garbage into the trash bin' },
            { key: 'B', text: 'Leave old papers on the floor' },
            { key: 'C', text: 'Eat snacks during class' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Throw garbage into the trash bin to keep the room clean' },
            { key: 'B', text: 'Leave plastic bottles under the chairs' },
            { key: 'C', text: 'Write on the classroom wall' },
            { key: 'D', text: 'Close the classroom window tightly' }
        ],
        correctAnswer: 'A',
        explanation: 'The notice tells students to put trash in the bin so the classroom stays clean.',
        cognitiveLevel: 'MOTS',
        topic: 'Short Notice'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Chloe likes playing badminton on Sundays, whereas her brother likes riding a bicycle.',
        question: 'What is Chloe\'s favorite hobby on Sundays?',
        optionsFaseA: [
            { key: 'A', text: 'Playing badminton' },
            { key: 'B', text: 'Riding a bicycle' },
            { key: 'C', text: 'Cooking soup' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Playing badminton' },
            { key: 'B', text: 'Riding a bicycle' },
            { key: 'C', text: 'Swimming in the sea' },
            { key: 'D', text: 'Reading history books' }
        ],
        correctAnswer: 'A',
        explanation: 'The text states clearly that Chloe likes playing badminton on Sundays.',
        cognitiveLevel: 'LOTS',
        topic: 'Hobbies'
    },
    // --- FASE C (KELAS 5 - 6) ---
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Read the dialogue: Evan: "Excuse me, how much is a kilogram of sweet mangoes?" Seller: "It is fifteen thousand rupiahs."',
        question: 'How much do two kilograms of sweet mangoes cost?',
        optionsFaseA: [
            { key: 'A', text: 'Twenty thousand rupiahs' },
            { key: 'B', text: 'Thirty thousand rupiahs' },
            { key: 'C', text: 'Forty thousand rupiahs' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Fifteen thousand rupiahs' },
            { key: 'B', text: 'Twenty-five thousand rupiahs' },
            { key: 'C', text: 'Thirty thousand rupiahs' },
            { key: 'D', text: 'Forty-five thousand rupiahs' }
        ],
        correctAnswer: 'C',
        explanation: '1 kg costs Rp15,000, so 2 kg costs 2 x Rp15,000 = Rp30,000 (thirty thousand rupiahs).',
        cognitiveLevel: 'MOTS',
        topic: 'Shopping & Prices'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Last Saturday, Ruby and her classmates visited the city museum and saw traditional Javanese puppets.',
        question: 'Which sentence below correctly uses the Simple Past Tense to continue Ruby\'s story?',
        optionsFaseA: [
            { key: 'A', text: 'They took many photos and learned local history.' },
            { key: 'B', text: 'They take many photos tomorrow morning.' },
            { key: 'C', text: 'They are taking photos next week.' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'They took many photos and learned local history.' },
            { key: 'B', text: 'They takes many photos every day.' },
            { key: 'C', text: 'They will taking many photos yesterday.' },
            { key: 'D', text: 'They are take many photos last week.' }
        ],
        correctAnswer: 'A',
        explanation: 'Simple Past Tense uses past verb forms (V2) such as "took" and "learned".',
        cognitiveLevel: 'MOTS',
        topic: 'Simple Past Tense'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Compare the two animals: An elephant weighs around 4,000 kg, while a deer weighs around 80 kg.',
        question: 'Which comparative sentence is grammatically true based on the data above?',
        optionsFaseA: [
            { key: 'A', text: 'An elephant is much heavier than a deer.' },
            { key: 'B', text: 'A deer is heavier than an elephant.' },
            { key: 'C', text: 'An elephant is smaller than a deer.' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'An elephant is much heavier than a deer.' },
            { key: 'B', text: 'A deer is heavier than an elephant.' },
            { key: 'C', text: 'An elephant is lighter than a deer.' },
            { key: 'D', text: 'Both animals have the exact same weight.' }
        ],
        correctAnswer: 'A',
        explanation: '4,000 kg is greater than 80 kg, so the elephant is heavier than the deer.',
        cognitiveLevel: 'MOTS',
        topic: 'Comparative Adjectives'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Adam feels terrible today because he has a toothache after eating too many sweet candies.',
        question: 'Who is the right person Adam should visit for medical help with his tooth?',
        optionsFaseA: [
            { key: 'A', text: 'A dentist' },
            { key: 'B', text: 'A pilot' },
            { key: 'C', text: 'A firefighter' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'A dentist' },
            { key: 'B', text: 'A carpenter' },
            { key: 'C', text: 'A chef' },
            { key: 'D', text: 'A postman' }
        ],
        correctAnswer: 'A',
        explanation: 'A dentist is a doctor who checks and treats teeth.',
        cognitiveLevel: 'LOTS',
        topic: 'Health & Professions'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Read the short invitation card: "Dear Kate, Please come to my 11th birthday picnic on Sunday, May 12th at 3 p.m. in Taman Kota. Love, Emma."',
        question: 'Where will Emma celebrate her birthday picnic?',
        optionsFaseA: [
            { key: 'A', text: 'In Taman Kota' },
            { key: 'B', text: 'In the school library' },
            { key: 'C', text: 'At Kate\'s house' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'In Taman Kota' },
            { key: 'B', text: 'In the school hall' },
            { key: 'C', text: 'At Kate\'s bedroom' },
            { key: 'D', text: 'At the railway station' }
        ],
        correctAnswer: 'A',
        explanation: 'The invitation explicitly mentions the venue "in Taman Kota".',
        cognitiveLevel: 'LOTS',
        topic: 'Reading Invitation Card'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Kevin wants to be someone who flies airplanes and travels to many countries in the future.',
        question: 'What is Kevin\'s future dream profession?',
        optionsFaseA: [
            { key: 'A', text: 'A pilot' },
            { key: 'B', text: 'A farmer' },
            { key: 'C', text: 'A tailor' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'A pilot' },
            { key: 'B', text: 'A farmer' },
            { key: 'C', text: 'A tailor' },
            { key: 'D', text: 'A fisherman' }
        ],
        correctAnswer: 'A',
        explanation: 'A pilot flies airplanes.',
        cognitiveLevel: 'LOTS',
        topic: 'Future Dreams'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Read the sentence: "Next month, our school [ ... ] plant fifty fruit trees in the backyard."',
        question: 'Choose the best Future Tense phrase to complete the sentence!',
        optionsFaseA: [
            { key: 'A', text: 'will' },
            { key: 'B', text: 'did' },
            { key: 'C', text: 'was' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'will' },
            { key: 'B', text: 'did' },
            { key: 'C', text: 'was' },
            { key: 'D', text: 'yesterday' }
        ],
        correctAnswer: 'A',
        explanation: '"Next month" shows future time, so we use "will + verb 1".',
        cognitiveLevel: 'MOTS',
        topic: 'Future Tense (Will)'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Dan needs to borrow an English dictionary and read science encyclopedias quietly.',
        question: 'Which school facility should Dan go to?',
        optionsFaseA: [
            { key: 'A', text: 'The school library' },
            { key: 'B', text: 'The school canteen' },
            { key: 'C', text: 'The parking lot' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'The school library' },
            { key: 'B', text: 'The school canteen' },
            { key: 'C', text: 'The basketball court' },
            { key: 'D', text: 'The parking area' }
        ],
        correctAnswer: 'A',
        explanation: 'Students borrow books and read quietly in the school library.',
        cognitiveLevel: 'LOTS',
        topic: 'School Facilities'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Read the direction guide: "Walk straight along Jalan Melati, then turn left at the crossroads. The post office is next to the bank."',
        question: 'What should you do when you reach the crossroads?',
        optionsFaseA: [
            { key: 'A', text: 'Turn left' },
            { key: 'B', text: 'Turn right' },
            { key: 'C', text: 'Go back home' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Turn left' },
            { key: 'B', text: 'Turn right' },
            { key: 'C', text: 'Go straight past the bank' },
            { key: 'D', text: 'Stop inside the post office' }
        ],
        correctAnswer: 'A',
        explanation: 'The direction clearly instructs: "turn left at the crossroads".',
        cognitiveLevel: 'MOTS',
        topic: 'Giving Directions'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Arrange these jumbled words into a good English sentence: "always - washes - hands - Maya - her - meals - before".',
        question: 'Which arrangement forms a meaningful sentence?',
        optionsFaseA: [
            { key: 'A', text: 'Maya always washes her hands before meals.' },
            { key: 'B', text: 'Maya washes always hands her meals before.' },
            { key: 'C', text: 'Before meals always Maya washes her hands.' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Maya always washes her hands before meals.' },
            { key: 'B', text: 'Maya washes always hands her meals before.' },
            { key: 'C', text: 'Hands Maya always washes before her meals.' },
            { key: 'D', text: 'Always Maya her hands washes before meals.' }
        ],
        correctAnswer: 'A',
        explanation: 'The proper Subject + Adverb + Verb + Object + Time structure is "Maya always washes her hands before meals."',
        cognitiveLevel: 'HOTS',
        topic: 'Sentence Arrangement'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Notice on a grass field: "DO NOT STEP ON THE YOUNG GRASS!"',
        question: 'What is the purpose of the notice above?',
        optionsFaseA: [
            { key: 'A', text: 'To prohibit people from walking on the new grass' },
            { key: 'B', text: 'To invite children to play soccer there' },
            { key: 'C', text: 'To tell gardeners to cut the trees' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'To forbid people from walking or stepping on the young grass' },
            { key: 'B', text: 'To invite visitors to sit and picnic on the grass' },
            { key: 'C', text: 'To ask students to pull out the grass' },
            { key: 'D', text: 'To advertise a flower shop nearby' }
        ],
        correctAnswer: 'A',
        explanation: '"Do not step on..." is a prohibition warning people not to trample the grass.',
        cognitiveLevel: 'MOTS',
        topic: 'Prohibition Notice'
    }
];

export const EXTENDED_PAI_PG: QuestionBankItemPG[] = [
    // --- FASE A (KELAS 1 - 2) ---
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Sebelum mulai belajar atau membaca buku di sekolah, Rafi selalu mengangkat tangan dan memohon kebaikan kepada Allah Swt.',
        question: 'Kalimat basmalah yang diucapkan untuk mengawali setiap perbuatan baik berbunyi ...',
        optionsFaseA: [
            { key: 'A', text: 'Bismillahirrahmanirrahim' },
            { key: 'B', text: 'Alhamdulillahirabbil alamin' },
            { key: 'C', text: 'Astaghfirullahal azim' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Bismillahirrahmanirrahim' },
            { key: 'B', text: 'Alhamdulillahirabbil alamin' },
            { key: 'C', text: 'Astaghfirullahal azim' },
            { key: 'D', text: 'Subhanallah' }
        ],
        correctAnswer: 'A',
        explanation: 'Setiap kegiatan baik diawali dengan membaca Basmalah (Bismillahirrahmanirrahim).',
        cognitiveLevel: 'LOTS',
        topic: 'Kalimat Tayyibah Basmalah'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Nisa mendapat hadiah tas baru dari nenek dan ia merasa sangat senang serta bersyukur kepada Allah Swt.',
        question: 'Ucapan rasa syukur "Alhamdulillah" mengandung arti ...',
        optionsFaseA: [
            { key: 'A', text: 'Segala puji bagi Allah' },
            { key: 'B', text: 'Allah Maha Besar' },
            { key: 'C', text: 'Mohon ampun kepada Allah' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Segala puji bagi Allah' },
            { key: 'B', text: 'Allah Maha Besar' },
            { key: 'C', text: 'Mohon ampun kepada Allah' },
            { key: 'D', text: 'Maha Suci Allah' }
        ],
        correctAnswer: 'A',
        explanation: 'Hamdalah (Alhamdulillah) berarti "Segala puji bagi Allah" sebagai ungkapan syukur.',
        cognitiveLevel: 'LOTS',
        topic: 'Kalimat Tayyibah Hamdalah'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Allah Swt. menciptakan matahari, bulan, gunung, lautan, serta segala hewan dan tumbuhan untuk kehidupan manusia.',
        question: 'Asmaulhusna yang artinya Allah Maha Pencipta seluruh alam semesta adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Al-Khaliq' },
            { key: 'B', text: 'Ar-Rahman' },
            { key: 'C', text: 'Al-Malik' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Al-Khaliq' },
            { key: 'B', text: 'Ar-Rahman' },
            { key: 'C', text: 'Al-Malik' },
            { key: 'D', text: 'Al-Quddus' }
        ],
        correctAnswer: 'A',
        explanation: 'Al-Khaliq artinya Allah Maha Pencipta seluruh makhluk di alam semesta.',
        cognitiveLevel: 'LOTS',
        topic: 'Asmaulhusna Al-Khaliq'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Di kelas satu, guru mengenalkan rukun Islam yang pertama yaitu mengucapkan dua kalimat syahadat.',
        question: 'Arti dari syahadat rasul adalah bersaksi bahwa ... adalah utusan Allah Swt.',
        optionsFaseA: [
            { key: 'A', text: 'Nabi Muhammad saw.' },
            { key: 'B', text: 'Malaikat Jibril' },
            { key: 'C', text: 'Nabi Nuh a.s.' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Nabi Muhammad saw.' },
            { key: 'B', text: 'Malaikat Jibril' },
            { key: 'C', text: 'Nabi Nuh a.s.' },
            { key: 'D', text: 'Nabi Isa a.s.' }
        ],
        correctAnswer: 'A',
        explanation: 'Dua kalimat syahadat berisi persaksian bahwa tiada tuhan selain Allah dan Nabi Muhammad saw. adalah utusan Allah.',
        cognitiveLevel: 'LOTS',
        topic: 'Dua Kalimat Syahadat'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Umat Islam melaksanakan ibadah salat wajib setiap hari sejak terbit fajar hingga malam hari.',
        question: 'Salat wajib yang dikerjakan pada waktu pagi hari sebelum matahari terbit sebanyak 2 rakaat adalah salat ...',
        optionsFaseA: [
            { key: 'A', text: 'Subuh' },
            { key: 'B', text: 'Asar' },
            { key: 'C', text: 'Isya' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Subuh' },
            { key: 'B', text: 'Zuhur' },
            { key: 'C', text: 'Asar' },
            { key: 'D', text: 'Isya' }
        ],
        correctAnswer: 'A',
        explanation: 'Salat Subuh berjumlah 2 rakaat dan dilaksanakan pada waktu fajar pagi hari.',
        cognitiveLevel: 'LOTS',
        topic: 'Salat Lima Waktu'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Saat mengaji Iqra, Tari belajar membedakan harakat atau tanda baca pada huruf hijaiyah.',
        question: 'Tanda baca garis miring kecil di atas huruf hijaiyah yang berbunyi vokal "a" disebut harakat ...',
        optionsFaseA: [
            { key: 'A', text: 'Fathah' },
            { key: 'B', text: 'Kasrah' },
            { key: 'C', text: 'Dammah' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Fathah' },
            { key: 'B', text: 'Kasrah' },
            { key: 'C', text: 'Dammah' },
            { key: 'D', text: 'Sukun' }
        ],
        correctAnswer: 'A',
        explanation: 'Harakat fathah berada di atas huruf hijaiyah dan menghasilkan bunyi "a".',
        cognitiveLevel: 'LOTS',
        topic: 'Mengenal Huruf Hijaiyah'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Ketika berangkat ke sekolah, Kiki selalu mencium tangan ayah dan ibu sambil mengucapkan salam.',
        question: 'Perbuatan Kiki tersebut mencerminkan akhlak terpuji berupa ...',
        optionsFaseA: [
            { key: 'A', text: 'Hormat dan patuh kepada orang tua' },
            { key: 'B', text: 'Sombong kepada teman kelas' },
            { key: 'C', text: 'Malas bangun pagi' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Hormat dan patuh kepada kedua orang tua' },
            { key: 'B', text: 'Berani membantah nasihat ibu' },
            { key: 'C', text: 'Bermalas-malasan pergi sekolah' },
            { key: 'D', text: 'Suka memamerkan mainan' }
        ],
        correctAnswer: 'A',
        explanation: 'Mengucapkan salam dan berpamitan dengan santun merupakan wujud bakti kepada orang tua.',
        cognitiveLevel: 'LOTS',
        topic: 'Birrul Walidain'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Allah Swt. mengutus sepuluh malaikat dengan tugas mulia masing-masing, salah satunya mengatur turunnya hujan dan membagi rezeki kepada makhluk.',
        question: 'Nama malaikat Allah Swt. yang bertugas menurunkan hujan dan membagikan rezeki adalah Malaikat ...',
        optionsFaseA: [
            { key: 'A', text: 'Mikail' },
            { key: 'B', text: 'Israfil' },
            { key: 'C', text: 'Izrail' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Mikail' },
            { key: 'B', text: 'Israfil' },
            { key: 'C', text: 'Izrail' },
            { key: 'D', text: 'Malik' }
        ],
        correctAnswer: 'A',
        explanation: 'Malaikat Mikail bertugas mengatur rezeki dan menurunkan hujan atas izin Allah Swt.',
        cognitiveLevel: 'LOTS',
        topic: 'Mengenal Malaikat Mikail'
    },
    // --- FASE B (KELAS 3 - 4) ---
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Allah Swt. menurunkan empat kitab suci kepada para nabi dan rasul sebagai pedoman hidup umat manusia.',
        question: 'Kitab suci yang diturunkan Allah Swt. kepada Nabi Musa a.s. adalah kitab ...',
        optionsFaseA: [
            { key: 'A', text: 'Taurat' },
            { key: 'B', text: 'Zabur' },
            { key: 'C', text: 'Injil' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Taurat' },
            { key: 'B', text: 'Zabur' },
            { key: 'C', text: 'Injil' },
            { key: 'D', text: 'Al-Qur\'an' }
        ],
        correctAnswer: 'A',
        explanation: 'Taurat diturunkan kepada Nabi Musa a.s., Zabur kepada Nabi Daud a.s., Injil kepada Nabi Isa a.s., dan Al-Qur\'an kepada Nabi Muhammad saw.',
        cognitiveLevel: 'LOTS',
        topic: 'Iman kepada Kitab Allah'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Dalam ibadah salat wajib, terdapat gerakan berdiri tegak lalu membungkukkan badan sembilan puluh derajat dengan kedua tangan memegang lutut.',
        question: 'Gerakan salat membungkukkan badan dengan punggung lurus sambil membaca tasbih tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Rukuk' },
            { key: 'B', text: 'Sujud' },
            { key: 'C', text: 'Iktidal' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Rukuk' },
            { key: 'B', text: 'Sujud' },
            { key: 'C', text: 'Iktidal' },
            { key: 'D', text: 'Duduk tasyahud' }
        ],
        correctAnswer: 'A',
        explanation: 'Rukuk adalah gerakan membungkuk dengan punggung rata dan tangan memegang lutut disertai tuma\'ninah.',
        cognitiveLevel: 'LOTS',
        topic: 'Gerakan Salat'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Nadia menemukan uang jajan terjatuh di lorong kelas, lalu ia langsung menyerahkannya kepada wali kelas agar dikembalikan kepada pemiliknya.',
        question: 'Sifat terpuji yang ditunjukkan Nadia karena dapat dipercaya menjaga barang milik orang lain adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Amanah' },
            { key: 'B', text: 'Kikir' },
            { key: 'C', text: 'Riya' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Amanah' },
            { key: 'B', text: 'Kikir' },
            { key: 'C', text: 'Riya' },
            { key: 'D', text: 'Takabur' }
        ],
        correctAnswer: 'A',
        explanation: 'Amanah artinya dapat dipercaya dalam menjalankan tugas maupun menjaga titipan dan hak orang lain.',
        cognitiveLevel: 'MOTS',
        topic: 'Perilaku Amanah'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Pada masa kanak-kanak hingga muda, Nabi Muhammad saw. terkenal tidak pernah berdusta sehingga masyarakat Makkah sangat menyegani beliau.',
        question: 'Gelar kehormatan yang diberikan penduduk Makkah kepada Nabi Muhammad saw. karena kejujuran beliau adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Al-Amin' },
            { key: 'B', text: 'Al-Faruq' },
            { key: 'C', text: 'Asadullah' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Al-Amin' },
            { key: 'B', text: 'Al-Faruq' },
            { key: 'C', text: 'Dzun Nurain' },
            { key: 'D', text: 'Saifullah' }
        ],
        correctAnswer: 'A',
        explanation: 'Al-Amin berarti orang yang sangat jujur dan dapat dipercaya.',
        cognitiveLevel: 'LOTS',
        topic: 'Keteladanan Nabi Muhammad saw.'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Saat bulan suci Ramadan tiba, umat Islam diwajibkan menahan diri dari makan, minum, dan hal-hal yang membatalkan sejak terbit fajar hingga terbenam matahari.',
        question: 'Waktu berakhirnya puasa setiap hari ketika azan berkumandang pada petang hari adalah waktu ...',
        optionsFaseA: [
            { key: 'A', text: 'Magrib' },
            { key: 'B', text: 'Zuhur' },
            { key: 'C', text: 'Asar' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Magrib' },
            { key: 'B', text: 'Zuhur' },
            { key: 'C', text: 'Asar' },
            { key: 'D', text: 'Duha' }
        ],
        correctAnswer: 'A',
        explanation: 'Puasa berakhir (berbuka) ketika matahari terbenam yang ditandai masuknya waktu salat Magrib.',
        cognitiveLevel: 'LOTS',
        topic: 'Ibadah Puasa Ramadan'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Di sekolah, Galih bersahabat dengan teman yang berbeda suku bangsa dan tidak pernah merendahkan budaya teman.',
        question: 'Sikap menghormati perbedaan suku, agama, dan kebiasaan orang lain dalam Islam disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Tasamuh (toleransi)' },
            { key: 'B', text: 'Ghibah' },
            { key: 'C', text: 'Hasad' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Tasamuh (toleransi)' },
            { key: 'B', text: 'Ghibah' },
            { key: 'C', text: 'Hasad' },
            { key: 'D', text: 'Namimah' }
        ],
        correctAnswer: 'A',
        explanation: 'Tasamuh berarti bersikap lapang dada dan saling menghargai perbedaan antarsesama.',
        cognitiveLevel: 'MOTS',
        topic: 'Akhlak Toleransi'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Setiap hari Jumat, kaum laki-laki muslim yang memenuhi syarat berkumpul di masjid mendengarkan khotbah sebelum salat dua rakaat berjemaah.',
        question: 'Hukum melaksanakan salat Jumat bagi seorang laki-laki muslim yang sudah balig, berakal sehat, dan tidak sedang safar adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Wajib (Fardu ain)' },
            { key: 'B', text: 'Sunah muakad' },
            { key: 'C', text: 'Makruh' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Wajib (Fardu ain)' },
            { key: 'B', text: 'Sunah muakad' },
            { key: 'C', text: 'Mubah' },
            { key: 'D', text: 'Makruh' }
        ],
        correctAnswer: 'A',
        explanation: 'Salat Jumat hukumnya wajib (fardu ain) bagi laki-laki muslim mukim yang memenuhi syarat.',
        cognitiveLevel: 'MOTS',
        topic: 'Salat Jumat'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Sebelum masuk usia dewasa (balig), anak muslim dibiasakan berlatih menjalankan ibadah salat dan menutup aurat dengan baik.',
        question: 'Salah satu tanda biologis masuknya masa balig pada anak perempuan menurut ajaran fikih Islam adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Mengalami haid (menstruasi)' },
            { key: 'B', text: 'Suara bertambah besar' },
            { key: 'C', text: 'Tinggi badan berhenti tumbuh' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Mengalami haid (menstruasi)' },
            { key: 'B', text: 'Tumbuh jakun di leher' },
            { key: 'C', text: 'Suara terdengar lebih berat' },
            { key: 'D', text: 'Berubahnya warna kulit' }
        ],
        correctAnswer: 'A',
        explanation: 'Tanda balig anak perempuan antara lain mengalami haid, sedangkan pada laki-laki mengalami mimpi basah (ihtilam) atau berusia 15 tahun hijriah.',
        cognitiveLevel: 'MOTS',
        topic: 'Menyambut Usia Balig'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Dalam sejarah Islam, Nabi Muhammad saw. bersama para sahabat melakukan perjalanan hijrah dari Kota Makkah menuju Kota Madinah.',
        question: 'Salah satu sebab utama Nabi Muhammad saw. hijrah ke Madinah adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Menyelamatkan dakwah Islam dari tekanan kaum kafir Quraisy' },
            { key: 'B', text: 'Mencari keuntungan berdagang rempah' },
            { key: 'C', text: 'Berwisata melihat pemandangan gurun' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menyelamatkan dakwah Islam dan membangun masyarakat damai di Madinah' },
            { key: 'B', text: 'Mencari kekayaan pribadi dari hasil berdagang' },
            { key: 'C', text: 'Menghindari kewajiban beribadah' },
            { key: 'D', text: 'Mengikuti perlombaan syair Arab' }
        ],
        correctAnswer: 'A',
        explanation: 'Hijrah ke Madinah bertujuan melindungi kaum muslimin dari penindasan Quraisy dan membangun peradaban Islam.',
        cognitiveLevel: 'HOTS',
        topic: 'Sejarah Hijrah Nabi'
    },
    // --- FASE C (KELAS 5 - 6) ---
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Pada akhir bulan Ramadan menjelang Hari Raya Idulfitri, setiap muslim yang mampu menunaikan zakat berupa makanan pokok seberat 2,5 kg atau 3,5 liter.',
        question: 'Ibadah mengeluarkan bahan makanan pokok untuk menyucikan jiwa dan membantu fakir miskin di akhir Ramadan disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Zakat fitrah' },
            { key: 'B', text: 'Zakat mal' },
            { key: 'C', text: 'Kurbandi' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Zakat fitrah' },
            { key: 'B', text: 'Zakat mal (harta)' },
            { key: 'C', text: 'Kafarat sumpah' },
            { key: 'D', text: 'Wakaf tanah' }
        ],
        correctAnswer: 'A',
        explanation: 'Zakat fitrah wajib ditunaikan setiap jiwa muslim sebelum salat Idulfitri untuk membantu kaum fakir miskin.',
        cognitiveLevel: 'LOTS',
        topic: 'Zakat Fitrah'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Allah Swt. memiliki sifat Al-Qayyum dan Al-Mumit serta Maha Kuasa menjaga keteraturan alam semesta.',
        question: 'Makna Asmaulhusna Al-Qayyum adalah bahwa Allah Swt. Maha ...',
        optionsFaseA: [
            { key: 'A', text: 'Berdiri sendiri dan mengurus seluruh makhluk' },
            { key: 'B', text: 'Mematikan semua makhluk hidup' },
            { key: 'C', text: 'Mengumpulkan di hari akhir' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Berdiri sendiri tanpa bergantung kepada siapa pun' },
            { key: 'B', text: 'Mematikan setiap makhluk bernyawa' },
            { key: 'C', text: 'Menghidupkan tanah yang gersang' },
            { key: 'D', text: 'Mengampuni semua dosa hamba' }
        ],
        correctAnswer: 'A',
        explanation: 'Al-Qayyum berarti Allah Maha Berdiri Sendiri (Mandiri) dan terus-menerus mengurus makhluk-Nya.',
        cognitiveLevel: 'MOTS',
        topic: 'Asmaulhusna Kelas 5-6'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Salah satu rukun iman ke-5 mengajarkan bahwa kehidupan dunia ini bersifat sementara dan kelak akan berakhir.',
        question: 'Hari ketika seluruh manusia dibangkitkan kembali dari alam kubur untuk menerima balasan amal disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Yaumul Ba\'as' },
            { key: 'B', text: 'Yaumul Mizan' },
            { key: 'C', text: 'Yaumul Hisab' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Yaumul Ba\'as' },
            { key: 'B', text: 'Yaumul Mizan' },
            { key: 'C', text: 'Yaumul Hisab' },
            { key: 'D', text: 'Yaumul Barzakh' }
        ],
        correctAnswer: 'A',
        explanation: 'Yaumul Ba\'as adalah hari kebangkitan manusia dari kubur setelah tiupan sangkakala kedua.',
        cognitiveLevel: 'MOTS',
        topic: 'Iman kepada Hari Akhir'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Dalam tata cara bacaan Al-Qur\'an (ilmu tajwid), huruf nun sukun atau tanwin apabila bertemu huruf ba (ب) berubah bunyinya menjadi mim.',
        question: 'Hukum bacaan tajwid apabila nun mati/tanwin bertemu huruf ba (ب) disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Iqlab' },
            { key: 'B', text: 'Izhar halqi' },
            { key: 'C', text: 'Idgham bilagunnah' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Iqlab' },
            { key: 'B', text: 'Izhar halqi' },
            { key: 'C', text: 'Idgham bilagunnah' },
            { key: 'D', text: 'Ikhfa haqiqi' }
        ],
        correctAnswer: 'A',
        explanation: 'Iqlab terjadi apabila nun sukun atau tanwin bertemu huruf ba (ب), dibaca menukar bunyi n menjadi m disertai dengung.',
        cognitiveLevel: 'MOTS',
        topic: 'Ilmu Tajwid'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Pada malam-malam bulan Ramadan setelah salat Isya, umat Islam melaksanakan salat sunah secara berjemaah di masjid.',
        question: 'Salat sunah yang hanya dikerjakan secara khusus pada malam-malam bulan Ramadan adalah salat ...',
        optionsFaseA: [
            { key: 'A', text: 'Tarawih' },
            { key: 'B', text: 'Iduladha' },
            { key: 'C', text: 'Istisqa' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Tarawih' },
            { key: 'B', text: 'Iduladha' },
            { key: 'C', text: 'Istisqa' },
            { key: 'D', text: 'Kusuf' }
        ],
        correctAnswer: 'A',
        explanation: 'Salat Tarawih adalah salat sunah malam khusus di bulan Ramadan yang dilaksanakan setelah salat Isya.',
        cognitiveLevel: 'LOTS',
        topic: 'Salat Sunah Tarawih'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Peristiwa bersejarah ketika Nabi Muhammad saw. memasuki Kota Makkah dengan damai tanpa pertumpahan darah dikenal sebagai Fathu Makkah.',
        question: 'Sikap mulia Rasulullah saw. terhadap penduduk Makkah yang dahulu memusuhi beliau saat peristiwa Fathu Makkah adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Memaafkan kesalahan mereka dengan lapang dada' },
            { key: 'B', text: 'Membalas dendam dan mengusir semuanya' },
            { key: 'C', text: 'Merampas seluruh harta benda penduduk' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Memaafkan mereka dengan penuh kasih sayang dan tanpa dendam' },
            { key: 'B', text: 'Menghukum seluruh penduduk dengan berat' },
            { key: 'C', text: 'Merobohkan rumah-rumah penduduk' },
            { key: 'D', text: 'Memaksa mereka meninggalkan kota' }
        ],
        correctAnswer: 'A',
        explanation: 'Rasulullah saw. memberikan pengampunan umum (amnesti) saat Fathu Makkah sebagai teladan sifat pemaaf.',
        cognitiveLevel: 'HOTS',
        topic: 'Fathu Makkah'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Setelah Rasulullah saw. wafat, kepemimpinan umat Islam dilanjutkan oleh Khulafaurrasyidin, salah satunya dikenal sangat dermawan dan lembut hatinya.',
        question: 'Sahabat sekaligus khalifah pertama yang memerintahkan pembukuan Al-Qur\'an dalam mushaf karena banyaknya penghafal gugur adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Abu Bakar As-Siddiq' },
            { key: 'B', text: 'Umar bin Khattab' },
            { key: 'C', text: 'Ali bin Abi Thalib' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Abu Bakar As-Siddiq' },
            { key: 'B', text: 'Umar bin Khattab' },
            { key: 'C', text: 'Usman bin Affan' },
            { key: 'D', text: 'Ali bin Abi Thalib' }
        ],
        correctAnswer: 'A',
        explanation: 'Atas usulan Umar bin Khattab pada masa khalifah Abu Bakar As-Siddiq, lembaran Al-Qur\'an mulai dikumpulkan.',
        cognitiveLevel: 'MOTS',
        topic: 'Kisah Khulafaurrasyidin'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Dalam Al-Qur\'an Surah Ad-Duha, Allah Swt. berpesan agar kita menyayangi anak yatim dan tidak menghardik orang yang meminta-minta.',
        question: 'Perilaku nyata yang paling tepat mencerminkan pengamalan pesan Surah Ad-Duha di lingkungan sekitar adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Berbicara lemah lembut dan berbagi rezeki kepada yang membutuhkan' },
            { key: 'B', text: 'Membentak pengemis yang datang ke depan rumah' },
            { key: 'C', text: 'Mengabaikan teman yang hidup serba kekurangan' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Bersikap santun, menyantuni anak yatim, dan gemar bersedekah' },
            { key: 'B', text: 'Mengusir orang yang meminta pertolongan dengan kasar' },
            { key: 'C', text: 'Menyembunyikan nikmat dan selalu mengeluh' },
            { key: 'D', text: 'Menjauhi teman yang kurang mampu' }
        ],
        correctAnswer: 'A',
        explanation: 'Surah Ad-Duha mengajarkan empati kepada anak yatim, kelembutan terhadap peminta, serta mensyukuri nikmat Allah.',
        cognitiveLevel: 'HOTS',
        topic: 'Kandungan Surah Ad-Duha'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Dalam ajaran Islam, ada makanan dan minuman yang halal dikonsumsi serta ada pula yang haram demi menjaga kesehatan jasmani dan rohani.',
        question: 'Contoh makanan yang hukum asalnya halal berubah menjadi haram apabila ...',
        optionsFaseA: [
            { key: 'A', text: 'Diperoleh dengan cara mencuri milik orang lain' },
            { key: 'B', text: 'Dimasak menggunakan kompor gas' },
            { key: 'C', text: 'Dibeli di pasar tradisional pagi hari' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Diperoleh dari hasil mencuri atau cara yang batil' },
            { key: 'B', text: 'Dimakan bersama keluarga di ruang makan' },
            { key: 'C', text: 'Diberi bumbu rempah tradisional' },
            { key: 'D', text: 'Disajikan di atas piring keramik' }
        ],
        correctAnswer: 'A',
        explanation: 'Makanan halal harus memenuhi dua syarat: halal zatnya dan halal cara memperolehnya.',
        cognitiveLevel: 'MOTS',
        topic: 'Halal dan Haram'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Meskipun sudah belajar dengan giat untuk ujian sekolah, Kayla tetap berdoa dan menyerahkan hasil akhirnya kepada Allah Swt.',
        question: 'Sikap berserah diri kepada ketetapan Allah Swt. setelah berusaha secara maksimal disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Tawakal' },
            { key: 'B', text: 'Putus asa' },
            { key: 'C', text: 'Pesimis' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Tawakal' },
            { key: 'B', text: 'Pesimis' },
            { key: 'C', text: 'Takabur' },
            { key: 'D', text: 'Putus asa' }
        ],
        correctAnswer: 'A',
        explanation: 'Tawakal adalah menyerahkan hasil usaha kepada Allah Swt. setelah berikhtiar dan berdoa sungguh-sungguh.',
        cognitiveLevel: 'MOTS',
        topic: 'Iman kepada Qada dan Qadar'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Setiap akhir tahun ajaran, siswa kelas enam menggalang donasi buku bacaan bekas layak pakai untuk disumbangkan ke taman bacaan desa.',
        question: 'Amalan sedekah yang pahalanya terus mengalir meskipun pemberinya telah tiada karena manfaatnya dirasakan terus-menerus disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Sedekah jariah' },
            { key: 'B', text: 'Hadiah lomba' },
            { key: 'C', text: 'Upah kerja' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Sedekah jariah' },
            { key: 'B', text: 'Hadiah perlombaan' },
            { key: 'C', text: 'Pinjaman uang' },
            { key: 'D', text: 'Hibah sementara' }
        ],
        correctAnswer: 'A',
        explanation: 'Sedekah jariah (termasuk wakaf buku/ilmu bermanfaat) mengalirkan pahala berkelanjutan selama masih dimanfaatkan.',
        cognitiveLevel: 'HOTS',
        topic: 'Sedekah Jariah'
    }
];

export const EXTENDED_KODING_PG: QuestionBankItemPG[] = [
    // --- FASE A (KELAS 1 - 2) ---
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Sebelum masuk ke dalam ruang kelas, Dito diminta merapikan langkah: (1) buka sepatu, (2) taruh di rak, (3) masuk kelas.',
        question: 'Urutan langkah-langkah teratur untuk menyelesaikan suatu kegiatan seperti contoh di atas disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Langkah berurutan (Algoritma sederhana)' },
            { key: 'B', text: 'Tebakan acak' },
            { key: 'C', text: 'Lompatan bebas' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Urutan langkah (Algoritma sederhana)' },
            { key: 'B', text: 'Tebakan acak' },
            { key: 'C', text: 'Kesalahan alat' },
            { key: 'D', text: 'Gambar bebas' }
        ],
        correctAnswer: 'A',
        explanation: 'Algoritma sederhana adalah urutan langkah logis dan teratur dari awal hingga selesai.',
        cognitiveLevel: 'LOTS',
        topic: 'Urutan Langkah Logis'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Perhatikan pola warna manik-manik gelang milik Nisa berikut: Merah - Biru - Merah - Biru - Merah - [ ... ].',
        question: 'Warna manik-manik berikutnya untuk melanjutkan pola berulang tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Biru' },
            { key: 'B', text: 'Merah' },
            { key: 'C', text: 'Hijau' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Biru' },
            { key: 'B', text: 'Merah' },
            { key: 'C', text: 'Hijau' },
            { key: 'D', text: 'Kuning' }
        ],
        correctAnswer: 'A',
        explanation: 'Pola berulang bergantian Merah lalu Biru, sehingga sesudah Merah adalah Biru.',
        cognitiveLevel: 'LOTS',
        topic: 'Pengenalan Pola Sederhana'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Rafi memainkan permainan papan dengan menggerakkan robot kertas mengikuti tanda panah: Maju 2 langkah -> Belok kanan.',
        question: 'Apabila panah menunjuk ke arah atas kertas, gerakan robot kertas seharusnya menuju ke ...',
        optionsFaseA: [
            { key: 'A', text: 'Depan / Atas' },
            { key: 'B', text: 'Bawah' },
            { key: 'C', text: 'Diam di tempat' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Depan / Atas' },
            { key: 'B', text: 'Bawah' },
            { key: 'C', text: 'Diam di tempat' },
            { key: 'D', text: 'Mundur' }
        ],
        correctAnswer: 'A',
        explanation: 'Simbol panah atas pada peta petak berarti bergerak maju ke kotak di atasnya.',
        cognitiveLevel: 'LOTS',
        topic: 'Arah dan Perintah Panah'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Di ruang komputer sekolah terdapat layar monitor, papan ketik (keyboard), dan tetikus (mouse).',
        question: 'Perangkat keras yang digunakan dengan cara digeser dan diklik untuk menunjuk gambar di layar adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Mouse (Tetikus)' },
            { key: 'B', text: 'Speaker' },
            { key: 'C', text: 'Printer' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Mouse (Tetikus)' },
            { key: 'B', text: 'Speaker' },
            { key: 'C', text: 'Printer' },
            { key: 'D', text: 'Proyektor' }
        ],
        correctAnswer: 'A',
        explanation: 'Mouse dipakai untuk menggerakkan kursor dan mengklik ikon pada layar monitor.',
        cognitiveLevel: 'LOTS',
        topic: 'Perangkat Komputer Dasar'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Ibu guru mengajak siswa memilah mainan balok: kotak biru untuk balok bulat, kotak merah untuk balok segitiga.',
        question: 'Mengelompokkan benda berdasarkan kesamaan bentuknya dalam berpikir komputasional melatih kemampuan ...',
        optionsFaseA: [
            { key: 'A', text: 'Mengenali pola dan mengelompokkan data' },
            { key: 'B', text: 'Membuang semua mainan' },
            { key: 'C', text: 'Menghapus gambar' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Mengenali ciri dan mengelompokkan pola benda' },
            { key: 'B', text: 'Mengacak mainan di lantai' },
            { key: 'C', text: 'Merusak susunan kotak' },
            { key: 'D', text: 'Mematikan komputer' }
        ],
        correctAnswer: 'A',
        explanation: 'Mengelompokkan benda sejenis melatih keterampilan klasifikasi data dan pengenalan pola.',
        cognitiveLevel: 'MOTS',
        topic: 'Klasifikasi Data Sederhana'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Saat menggosok gigi, Mila tidak sengaja langsung memeras pasta gigi sebelum mengambil sikat giginya.',
        question: 'Agar urutan menggosok gigi berhasil benar, langkah pertama yang seharusnya diperbaiki oleh Mila adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Mengambil sikat gigi terlebih dahulu' },
            { key: 'B', text: 'Langsung berkumur sebelum ada sikat' },
            { key: 'C', text: 'Menutup keran lalu tidur' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Mengambil sikat gigi terlebih dahulu sebelum menuang pasta gigi' },
            { key: 'B', text: 'Langsung berkumur tanpa menggosok gigi' },
            { key: 'C', text: 'Menyimpan sikat ke dalam tas' },
            { key: 'D', text: 'Mengulang menyikat setelah tidur' }
        ],
        correctAnswer: 'A',
        explanation: 'Memperbaiki urutan langkah yang keliru merupakan latihan dasar menemukan kesalahan instruksi (debugging).',
        cognitiveLevel: 'MOTS',
        topic: 'Memperbaiki Urutan Langkah'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Sebuah lampu lalu lintas cerdas di kota menyala bergantian: Hijau untuk jalan, Kuning untuk hati-hati, Merah untuk berhenti.',
        question: 'Saat lampu lalu lintas berwarna hijau menyala, perintah aturan yang terjadi adalah kendaraan ...',
        optionsFaseA: [
            { key: 'A', text: 'Boleh melaju jalan' },
            { key: 'B', text: 'Wajib berhenti diam' },
            { key: 'C', text: 'Berputar balik arah' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Boleh melaju jalan' },
            { key: 'B', text: 'Wajib berhenti diam' },
            { key: 'C', text: 'Berputar balik arah' },
            { key: 'D', text: 'Mematikan mesin' }
        ],
        correctAnswer: 'A',
        explanation: 'Lampu lalu lintas bekerja berdasarkan kondisi warna: JIKA hijau MAKA jalan.',
        cognitiveLevel: 'LOTS',
        topic: 'Aturan Kondisi Sederhana'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Ketika memakai tablet belajar di rumah, layar mulai terasa panas dan jam tidur malam sudah tiba.',
        question: 'Tindakan paling bijak menggunakan perangkat digital di rumah sesuai aturan waktu adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Berhenti bermain tablet dan beristirahat tepat waktu' },
            { key: 'B', text: 'Terus bermain sampai tengah malam' },
            { key: 'C', text: 'Menaikkan kecerahan layar hingga maksimal' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Mematikan perangkat dan istirahat tepat waktu' },
            { key: 'B', text: 'Melanjutkan bermain sambil tidur larut' },
            { key: 'C', text: 'Membuka semua aplikasi bersamaan' },
            { key: 'D', text: 'Mengabaikan nasihat orang tua' }
        ],
        correctAnswer: 'A',
        explanation: 'Mengatur waktu layar (screen time) menjaga kesehatan mata dan kebiasaan disiplin anak.',
        cognitiveLevel: 'LOTS',
        topic: 'Kebiasaan Sehat Digital'
    },
    // --- FASE B (KELAS 3 - 4) ---
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Sebuah karakter kucing di layar Scratch perlu berjalan maju 10 langkah lalu berbelok 90 derajat, diulang sebanyak 4 kali.',
        question: 'Bentuk geometris yang tergambar dari lintasan jalan karakter kucing tersebut adalah bangun ...',
        optionsFaseA: [
            { key: 'A', text: 'Persegi' },
            { key: 'B', text: 'Lingkaran' },
            { key: 'C', text: 'Segitiga' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Persegi' },
            { key: 'B', text: 'Lingkaran' },
            { key: 'C', text: 'Segitiga sama sisi' },
            { key: 'D', text: 'Segi lima' }
        ],
        correctAnswer: 'A',
        explanation: 'Maju dengan panjang sama lalu berbelok siku-siku (90°) sebanyak 4 kali membentuk bangun persegi.',
        cognitiveLevel: 'MOTS',
        topic: 'Blok Gerak dan Perulangan'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Dalam diagram alur (flowchart), terdapat simbol berbentuk belah ketupat untuk memeriksa pertanyaan "Apakah nilai >= 75?".',
        question: 'Fungsi simbol belah ketupat (diamond) dalam sebuah diagram alur program adalah menyatakan ...',
        optionsFaseA: [
            { key: 'A', text: 'Pengambilan keputusan / percabangan kondisi (Ya/Tidak)' },
            { key: 'B', text: 'Titik mulai dan selesai program' },
            { key: 'C', text: 'Garis arah penghubung langkah' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Percabangan keputusan kondisi (Ya atau Tidak)' },
            { key: 'B', text: 'Penanda mulai atau selesai alur' },
            { key: 'C', text: 'Arah aliran instruksi' },
            { key: 'D', text: 'Penyimpanan arsip gambar' }
        ],
        correctAnswer: 'A',
        explanation: 'Dalam flowchart standar, belah ketupat dipakai untuk kondisi bercabang (decision) bernilai Benar/Salah.',
        cognitiveLevel: 'MOTS',
        topic: 'Simbol Flowchart'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Untuk membuat aplikasi jadwal piket kelas, Farhan memisahkan rincian warna baju siswa karena yang dibutuhkan hanya nama siswa dan hari tugasnya.',
        question: 'Tindakan menyaring hanya data penting dan mengabaikan detail yang tidak relevan tersebut dinamakan ...',
        optionsFaseA: [
            { key: 'A', text: 'Abstraksi' },
            { key: 'B', text: 'Perulangan' },
            { key: 'C', text: 'Enkripsi' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Abstraksi' },
            { key: 'B', text: 'Perulangan (Looping)' },
            { key: 'C', text: 'Enkripsi data' },
            { key: 'D', text: 'Kompresi video' }
        ],
        correctAnswer: 'A',
        explanation: 'Abstraksi adalah memusatkan perhatian pada informasi inti yang diperlukan serta menyisihkan detail yang tidak relevan.',
        cognitiveLevel: 'MOTS',
        topic: 'Abstraksi Berpikir Komputasional'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Seorang siswa ingin membuat gim kuis matematika. Ia memecahnya menjadi bagian: (1) tampilkan soal, (2) terima jawaban, (3) hitung skor.',
        question: 'Teknik memecah persoalan besar menjadi sub-bagian tugas yang lebih kecil dan mudah dikerjakan disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Dekomposisi' },
            { key: 'B', text: 'Duplikasi' },
            { key: 'C', text: 'Penghapusan' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Dekomposisi' },
            { key: 'B', text: 'Duplikasi kode' },
            { key: 'C', text: 'Pencarian acak' },
            { key: 'D', text: 'Penyalinan otomatis' }
        ],
        correctAnswer: 'A',
        explanation: 'Dekomposisi membagi masalah kompleks menjadi langkah bagian-bagian kecil agar mudah diselesaikan.',
        cognitiveLevel: 'LOTS',
        topic: 'Dekomposisi Masalah'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Pada aplikasi pengolah kata, Alya mengetik laporan kegiatan kelas dan menekan tombol huruf "B" tebal di menu atas.',
        question: 'Perubahan tampilan huruf pada teks laporan setelah tombol "B" (Bold) ditekan adalah tulisan menjadi ...',
        optionsFaseA: [
            { key: 'A', text: 'Cetak tebal' },
            { key: 'B', text: 'Cetak miring' },
            { key: 'C', text: 'Bergaris bawah' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Cetak tebal' },
            { key: 'B', text: 'Cetak miring (Italic)' },
            { key: 'C', text: 'Bergaris bawah (Underline)' },
            { key: 'D', text: 'Berwarna transparan' }
        ],
        correctAnswer: 'A',
        explanation: 'Ikon "B" (Bold) berfungsi menebalkan huruf yang dipilih.',
        cognitiveLevel: 'LOTS',
        topic: 'Literasi Digital Dasar'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Aplikasi kamera pintar pada gawai ayah dapat langsung mengenali wajah pemiliknya saat membuka kunci layar.',
        question: 'Teknologi komputer cerdas yang mampu mengenali pola gambar wajah dari hasil pembelajaran ribuan contoh foto adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Kecerdasan Artifisial (AI)' },
            { key: 'B', text: 'Kalkulator saku biasa' },
            { key: 'C', text: 'Mesin ketik mekanik' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Kecerdasan Artifisial (AI)' },
            { key: 'B', text: 'Kalkulator saku biasa' },
            { key: 'C', text: 'Mesin ketik manual' },
            { key: 'D', text: 'Lampu pijar biasa' }
        ],
        correctAnswer: 'A',
        explanation: 'Pengenalan wajah (face recognition) merupakan salah satu penerapan Kecerdasan Artifisial (AI) berbasis computer vision.',
        cognitiveLevel: 'LOTS',
        topic: 'Mengenal Kecerdasan Artifisial'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Saat menguji kode blok animasi, burung di layar justru berjalan mundur ke kiri padahal seharusnya terbang ke kanan.',
        question: 'Langkah perbaikan logika yang harus dilakukan pemrogram untuk memperbaiki bug arah tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Mengubah nilai gerak sumbu X dari negatif menjadi positif' },
            { key: 'B', text: 'Menghapus seluruh karakter burung dari layar' },
            { key: 'C', text: 'Mematikan aliran listrik komputer' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Mengganti angka arah sumbu X negatif menjadi positif (+)' },
            { key: 'B', text: 'Menghapus seluruh latar belakang panggung' },
            { key: 'C', text: 'Menonaktifkan tombol mulai proyek' },
            { key: 'D', text: 'Mengubah ukuran layar monitor' }
        ],
        correctAnswer: 'A',
        explanation: 'Gerak ke kanan menambah nilai koordinat X (positif), sedangkan gerak ke kiri mengurangi nilai X (negatif).',
        cognitiveLevel: 'MOTS',
        topic: 'Debugging Koordinat'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Dimas menerima pesan dari akun tidak dikenal yang meminta nomor telepon dan alamat lengkap rumahnya dengan iming-iming hadiah gim.',
        question: 'Tindakan keamanan digital yang paling tepat dilakukan Dimas adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Menolak memberikan data pribadi dan melapor ke orang tua/guru' },
            { key: 'B', text: 'Langsung mengirim foto kartu keluarga' },
            { key: 'C', text: 'Memberikan kata sandi akunnya' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Tidak membagikan data pribadi, memblokir akun, dan melapor kepada orang tua/guru' },
            { key: 'B', text: 'Menuliskan alamat rumah lengkap demi hadiah' },
            { key: 'C', text: 'Mengirimkan kata sandi akun sekolah' },
            { key: 'D', text: 'Menyebarkan pesan tersebut ke semua teman agar ikut mengklik' }
        ],
        correctAnswer: 'A',
        explanation: 'Data pribadi (alamat, nomor telepon, kata sandi) wajib dilindungi dari pihak asing untuk mencegah kejahatan siber.',
        cognitiveLevel: 'HOTS',
        topic: 'Keamanan Data Pribadi'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Dalam bahasa pemrograman blok, sebuah balok "ulangi 5 kali" membungkus balok perintah "bunyikan suara tepuk tangan".',
        question: 'Berapa kali bunyi tepuk tangan akan terdengar saat program dijalankan satu kali?',
        optionsFaseA: [
            { key: 'A', text: '5 kali' },
            { key: 'B', text: '1 kali' },
            { key: 'C', text: '10 kali' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '5 kali' },
            { key: 'B', text: '1 kali' },
            { key: 'C', text: '6 kali' },
            { key: 'D', text: '10 kali' }
        ],
        correctAnswer: 'A',
        explanation: 'Blok repeat 5 mengeksekusi perintah di dalamnya tepat sebanyak 5 kali.',
        cognitiveLevel: 'LOTS',
        topic: 'Blok Perulangan (Repeat)'
    },
    // --- FASE C (KELAS 5 - 6) ---
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Perhatikan aturan logika AI penyortir sampah pintar: JIKA objek terbuat dari botol plastik, MAKA arahkan ke kotak daur ulang; JIKA TIDAK, arahkan ke kotak residu.',
        question: 'Struktur kendali pemrograman yang dipakai sistem penyortir otomatis dua pilihan tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Percabangan IF - ELSE' },
            { key: 'B', text: 'Perulangan tanpa henti' },
            { key: 'C', text: 'Variabel statis' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Percabangan kondisi IF - ELSE' },
            { key: 'B', text: 'Perulangan tak terbatas (Infinite Loop)' },
            { key: 'C', text: 'Pengurutan abjad' },
            { key: 'D', text: 'Penamaan berkas' }
        ],
        correctAnswer: 'A',
        explanation: 'Struktur IF-ELSE memilih satu dari dua cabang tindakan berdasarkan terpenuhi atau tidaknya suatu syarat.',
        cognitiveLevel: 'MOTS',
        topic: 'Percabangan IF-ELSE'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Siswa melatih model kecerdasan artifisial sederhana untuk membedakan gambar daun mangga dan daun pisang. Namun semua foto latih hanya diambil dari satu jenis daun mangga.',
        question: 'Mengapa sistem AI tersebut berisiko sering salah menebak ketika diuji dengan gambar daun pisang?',
        optionsFaseA: [
            { key: 'A', text: 'Data latih tidak berimbang dan kurang contoh kategori daun pisang' },
            { key: 'B', text: 'Layar komputer terlalu terang' },
            { key: 'C', text: 'Keyboard tidak memakai huruf kapital' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Dataset latih bias/tidak seimbang karena kekurangan contoh variasi gambar daun pisang' },
            { key: 'B', text: 'Ukuran baterai laptop penuh 100%' },
            { key: 'C', text: 'Koneksi printer kabel belum terpasang' },
            { key: 'D', text: 'Kualitas speaker kurang keras' }
        ],
        correctAnswer: 'A',
        explanation: 'Kecerdasan Artifisial belajar dari data latih (training data). Data yang tidak seimbang atau bias menyebabkan prediksi keliru.',
        cognitiveLevel: 'HOTS',
        topic: 'Data Latih & Bias AI'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Dalam proyek gim edukasi, Reza membuat wadah bernama "skor" yang nilainya dimulai dari 0 dan selalu bertambah +10 tiap kali pemain menjawab benar.',
        question: 'Konsep pemrograman berupa wadah bernama untuk menyimpan nilai data yang dapat berubah selama permainan berlangsung disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Variabel' },
            { key: 'B', text: 'Latar panggung' },
            { key: 'C', text: 'Kostum sprite' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Variabel' },
            { key: 'B', text: 'Kostum karakter' },
            { key: 'C', text: 'Efek suara' },
            { key: 'D', text: 'Latar panggung' }
        ],
        correctAnswer: 'A',
        explanation: 'Variabel adalah lokasi penyimpanan data bernama di memori program yang nilainya dapat diubah atau dibaca.',
        cognitiveLevel: 'MOTS',
        topic: 'Variabel dalam Pemrograman'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Saat mencari informasi tugas sekolah melalui internet, Kayla menemukan artikel berita yang judulnya sensasional tetapi tidak mencantumkan sumber tepercaya.',
        question: 'Sikap literasi digital yang tepat sebelum mempercayai atau membagikan informasi tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Memverifikasi kebenaran berita melalui sumber resmi terpercaya' },
            { key: 'B', text: 'Langsung meneruskan ke seluruh grup teman' },
            { key: 'C', text: 'Menyalinnya tanpa membaca isinya terlebih dahulu' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Melakukan verifikasi silang ke sumber resmi/kredibel agar terhindar dari hoaks' },
            { key: 'B', text: 'Segera membagikan ke grup kelas agar cepat viral' },
            { key: 'C', text: 'Menganggap semua judul besar di internet pasti benar' },
            { key: 'D', text: 'Menyalin seluruh teks tanpa memeriksa penulisnya' }
        ],
        correctAnswer: 'A',
        explanation: 'Literasi digital kritis menuntut verifikasi sumber untuk mencegah penyebaran berita palsu (hoaks).',
        cognitiveLevel: 'HOTS',
        topic: 'Etika dan Literasi Informasi'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Sistem lampu taman sekolah dilengkapi sensor cahaya. Lampu otomatis menyala saat malam gelap dan otomatis padam saat pagi terang.',
        question: 'Bagian perangkat yang berfungsi membaca kondisi terang atau gelap lingkungan sekitar sebagai masukan (input) sistem adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Sensor cahaya' },
            { key: 'B', text: 'Bohlam lampu' },
            { key: 'C', text: 'Kabel listrik' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Sensor cahaya (komponen input)' },
            { key: 'B', text: 'Bohlam lampu (komponen output)' },
            { key: 'C', text: 'Tiang penyangga besi' },
            { key: 'D', text: 'Kap pelindung hujan' }
        ],
        correctAnswer: 'A',
        explanation: 'Sensor berfungsi menangkap data masukan (input) dari lingkungan fisik untuk diproses pengendali.',
        cognitiveLevel: 'MOTS',
        topic: 'Input-Proses-Output & Sensor'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Ilham menulis sebuah teks perintah (prompt) kepada asisten Kecerdasan Artifisial: "Buatkan soal!" tanpa menyebutkan topik, kelas, maupun jumlahnya.',
        question: 'Agar hasil keluaran AI jauh lebih akurat sesuai kebutuhan pelajaran, perbaikan prompt yang paling efektif adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Menambahkan konteks spesifik: mata pelajaran, jenjang kelas, topik, dan format hasil' },
            { key: 'B', text: 'Menulis satu kata saja tanpa spasi' },
            { key: 'C', text: 'Mengulang kata "cepat" sepuluh kali' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menyusun prompt yang spesifik mencantumkan peran, topik, tingkat kelas, serta batasan format' },
            { key: 'B', text: 'Mengurangi kata hingga tersisa dua huruf saja' },
            { key: 'C', text: 'Mengetik seluruh huruf menggunakan tanda seru' },
            { key: 'D', text: 'Mengubah bahasa perintah secara acak di tiap kata' }
        ],
        correctAnswer: 'A',
        explanation: 'Prompt engineering yang baik memuat konteks, tugas jelas, audiens target, dan format keluaran yang diharapkan.',
        cognitiveLevel: 'HOTS',
        topic: 'Prompting Efektif AI'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Perhatikan logika syarat masuk wahana bermain: "Pengunjung boleh naik JIKA tinggi >= 120 cm DAN didampingi orang tua."',
        question: 'Jika tinggi Maya adalah 125 cm tetapi ia datang sendirian tanpa orang tua, hasil keputusan operator logika AND adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Belum boleh naik (Salah)' },
            { key: 'B', text: 'Langsung boleh naik (Benar)' },
            { key: 'C', text: 'Sistem menjadi rusak' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Belum boleh naik (bernilai Salah/False karena satu syarat tidak terpenuhi)' },
            { key: 'B', text: 'Boleh naik (bernilai Benar/True)' },
            { key: 'C', text: 'Dianggap tingginya kurang dari 100 cm' },
            { key: 'D', text: 'Tetap naik tanpa syarat' }
        ],
        correctAnswer: 'A',
        explanation: 'Operator logika AND (DAN) hanya menghasilkan Benar apabila KEDUA syarat terpenuhi sekaligus.',
        cognitiveLevel: 'HOTS',
        topic: 'Operator Logika Boolean'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Untuk menghemat ruang gerak kode pada program Scratch, Fikri menggunakan perintah berulang terus-menerus selama permainan aktif berjalan.',
        question: 'Jenis blok perulangan yang membuat perintah terus berjalan berulang tanpa batas jumlah tertentu adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Forever (Selamanya)' },
            { key: 'B', text: 'Wait 1 second' },
            { key: 'C', text: 'Stop all' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Forever (Selamanya)' },
            { key: 'B', text: 'Wait 1 second' },
            { key: 'C', text: 'Stop all' },
            { key: 'D', text: 'Next costume' }
        ],
        correctAnswer: 'A',
        explanation: 'Blok Forever mengulang instruksi secara kontinu hingga program dihentikan.',
        cognitiveLevel: 'LOTS',
        topic: 'Jenis Blok Perulangan'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Saat mengunggah gambar hasil karya yang dibuat oleh aplikasi pembuat gambar AI ke majalah dinding kelas, Tiara menuliskan keterangan pembuatannya.',
        question: 'Etika penggunaan Kecerdasan Artifisial yang jujur dan bertanggung jawab dalam karya tugas sekolah adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Mengakui secara terbuka bagian karya yang dibantu alat AI dan tetap mengolah ide sendiri' },
            { key: 'B', text: 'Mengaku seratus persen hasil lukisan tangan padahal dibuat AI' },
            { key: 'C', text: 'Menyalin tugas milik teman tanpa mengubah apa pun' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Bersikap jujur mencantumkan sumber bantuan AI dan memakainya sebagai alat bantu belajar' },
            { key: 'B', text: 'Mengklaim hasil otomatis AI sepenuhnya sebagai gambar lukisan tangan' },
            { key: 'C', text: 'Menghapus nama pencipta asli sebuah gambar berlisensi' },
            { key: 'D', text: 'Membuat gambar palsu untuk mengejek teman' }
        ],
        correctAnswer: 'A',
        explanation: 'Integritas akademik menuntut kejujuran mengenai penggunaan AI serta melarang plagiarisme atau pemalsuan konten.',
        cognitiveLevel: 'HOTS',
        topic: 'Etika Penggunaan AI'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Komputer menyimpan seluruh huruf, angka, gambar, dan suara dalam bentuk kode bilangan paling dasar yang hanya memakai dua angka.',
        question: 'Dua angka dasar penyusun sistem bilangan biner yang dipahami langsung oleh perangkat keras komputer adalah ...',
        optionsFaseA: [
            { key: 'A', text: '0 dan 1' },
            { key: 'B', text: '1 dan 2' },
            { key: 'C', text: '8 dan 9' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '0 dan 1' },
            { key: 'B', text: '1 dan 2' },
            { key: 'C', text: '0 dan 9' },
            { key: 'D', text: '2 dan 5' }
        ],
        correctAnswer: 'A',
        explanation: 'Sistem bilangan biner (basis 2) menggunakan simbol 0 dan 1 (bit) untuk memproses semua data digital.',
        cognitiveLevel: 'LOTS',
        topic: 'Representasi Data Biner'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Sebuah toko online menggunakan program kecil otomatis di pojok kanan layar yang menjawab pertanyaan pelanggan tentang ongkos kirim selama 24 jam.',
        question: 'Program percakapan otomatis berbasis Kecerdasan Artifisial tersebut dinamakan ...',
        optionsFaseA: [
            { key: 'A', text: 'Chatbot' },
            { key: 'B', text: 'Spreadsheet' },
            { key: 'C', text: 'Antivirus' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Chatbot' },
            { key: 'B', text: 'Spreadsheet' },
            { key: 'C', text: 'Antivirus' },
            { key: 'D', text: 'Printer driver' }
        ],
        correctAnswer: 'A',
        explanation: 'Chatbot adalah aplikasi AI yang dirancang menyimulasikan percakapan dengan pengguna melalui teks atau suara.',
        cognitiveLevel: 'LOTS',
        topic: 'Aplikasi AI Sehari-hari'
    }
];

export const EXTENDED_MULOK_PG: QuestionBankItemPG[] = [
    // --- FASE A (KELAS 1 - 2) - 100% BASA SUNDA ASLI ---
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Isuk-isuk méméh indit ka sakola, Ujang amitan heula ka indung jeung bapana bari nyium pananganana.',
        question: 'Kecap salam anu merenah diucapkeun ku Ujang nalika papanggih jeung Ibu Guru isuk-isuk nyaéta ...',
        optionsFaseA: [
            { key: 'A', text: 'Wilujeng énjing, Ibu!' },
            { key: 'B', text: 'Wilujeng wengi, Ibu!' },
            { key: 'C', text: 'Hatur nuhun, Ibu!' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Wilujeng énjing, Ibu!' },
            { key: 'B', text: 'Wilujeng wengi, Ibu!' },
            { key: 'C', text: 'Wilujeng sonten, Ibu!' },
            { key: 'D', text: 'Wilujeng tuang, Ibu!' }
        ],
        correctAnswer: 'A',
        explanation: 'Salam pikeun waktu isuk-isuk dina Basa Sunda nyaéta "Wilujeng énjing".',
        cognitiveLevel: 'LOTS',
        topic: 'Salam Jeung Tatakrama'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Nénég ningali kembang malati bodas nu seungit pisan di buruan imahna.',
        question: 'Bagian awak urang anu dipaké pikeun ningali éndahna kembang malati nyaéta ...',
        optionsFaseA: [
            { key: 'A', text: 'Soca (Panon)' },
            { key: 'B', text: 'Cepil (Ceuli)' },
            { key: 'C', text: 'Sampéan (Suku)' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Soca (Panon)' },
            { key: 'B', text: 'Cepil (Ceuli)' },
            { key: 'C', text: 'Sampéan (Suku)' },
            { key: 'D', text: 'Baham (Sungut)' }
        ],
        correctAnswer: 'A',
        explanation: 'Panon atawa soca fungsina pikeun ningali sagala rupa nu aya di sabudeureun.',
        cognitiveLevel: 'LOTS',
        topic: 'Anggota Awak'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Di kebon tukangeun imah Aki aya tangkal gedang, tangkal cau, jeung tangkal jambu anu geus buahan.',
        question: 'Ngaran bubuahan anu kulitna konéng sarta rasana amis dina carita di luhur nyaéta buah ...',
        optionsFaseA: [
            { key: 'A', text: 'Cau asak' },
            { key: 'B', text: 'Cabé héjo' },
            { key: 'C', text: 'Bawang beureum' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Cau asak' },
            { key: 'B', text: 'Cabé héjo' },
            { key: 'C', text: 'Bawang beureum' },
            { key: 'D', text: 'Jahé' }
        ],
        correctAnswer: 'A',
        explanation: 'Cau asak kulitna konéng jeung rasana amis.',
        cognitiveLevel: 'LOTS',
        topic: 'Bubuahan Di Kebon'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Adé nginum cai hérang maké gelas sanggeus ulin lumpat di buruan sakola.',
        question: 'Warna daun tangkal jambu anu seger di buruan sakola nyaéta warna ...',
        optionsFaseA: [
            { key: 'A', text: 'Héjo' },
            { key: 'B', text: 'Hideung' },
            { key: 'C', text: 'Beureum' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Héjo' },
            { key: 'B', text: 'Hideung' },
            { key: 'C', text: 'Beureum' },
            { key: 'D', text: 'Bodas' }
        ],
        correctAnswer: 'A',
        explanation: 'Daun tutuwuhan anu seger umumna warnana héjo.',
        cognitiveLevel: 'LOTS',
        topic: 'Ngaran Warna'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Baca paguneman pondok ieu:\nDadan: "Punten, Cucu, pangnyandakkeun panghapus di luhur méja."\nCucu: "Mangga, ieu Dadan."',
        question: 'Sanggeus dibéré panghapus ku Cucu, Dadan wajib ngucapkeun ...',
        optionsFaseA: [
            { key: 'A', text: 'Hatur nuhun, Cucu' },
            { key: 'B', text: 'Punten, Cucu' },
            { key: 'C', text: 'Wilujeng wengi, Cucu' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Hatur nuhun, Cucu' },
            { key: 'B', text: 'Punten, Cucu' },
            { key: 'C', text: 'Wilujeng wengi, Cucu' },
            { key: 'D', text: 'Hapunten, Cucu' }
        ],
        correctAnswer: 'A',
        explanation: 'Lamun ditulungan ku batur, urang kudu ngucapkeun "Hatur nuhun".',
        cognitiveLevel: 'LOTS',
        topic: 'Paguneman Sopan'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Sato ingon-ingon di pipir imah aya éntog, meri, jeung ucing nu buluna lembut.',
        question: 'Sato ingon-ingon nu sora disadana "méong-méong" sarta resep néwak beurit nyaéta ...',
        optionsFaseA: [
            { key: 'A', text: 'Ucing' },
            { key: 'B', text: 'Meri' },
            { key: 'C', text: 'Domba' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Ucing' },
            { key: 'B', text: 'Meri' },
            { key: 'C', text: 'Domba' },
            { key: 'D', text: 'Sapi' }
        ],
        correctAnswer: 'A',
        explanation: 'Ucing sok disada méong-méong jeung mindeng diingu di imah.',
        cognitiveLevel: 'LOTS',
        topic: 'Sasatoan Sabudeureun'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Barudak kelas hiji keur ngalaksanakeun pikét meresihan kelas méméh bel asup disada.',
        question: 'Pakakas anu dipaké pikeun sasapu runtah di jero kelas nyaéta ...',
        optionsFaseA: [
            { key: 'A', text: 'Sapu injuk' },
            { key: 'B', text: 'Émbér' },
            { key: 'C', text: 'Buku gambar' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Sapu injuk' },
            { key: 'B', text: 'Émbér' },
            { key: 'C', text: 'Buku gambar' },
            { key: 'D', text: 'Patlot warna' }
        ],
        correctAnswer: 'A',
        explanation: 'Sapu injuk digunakeun pikeun sasapu lantai kelas sangkan beresih.',
        cognitiveLevel: 'LOTS',
        topic: 'Kabersihan Kelas'
    },
    {
        minGrade: 1, maxGrade: 2,
        stimulus: 'Tatang ngitung buku tulis dina kantongna: hiji, dua, tilu, opat, lima.',
        question: 'Upama buku tulis Tatang ditambah dua deui, jumlah sakabéhna jadi ... buku.',
        optionsFaseA: [
            { key: 'A', text: 'Tujuh' },
            { key: 'B', text: 'Genep' },
            { key: 'C', text: 'Salapan' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Tujuh' },
            { key: 'B', text: 'Genep' },
            { key: 'C', text: 'Dalapan' },
            { key: 'D', text: 'Salapan' }
        ],
        correctAnswer: 'A',
        explanation: 'Lima ditambah dua sarua jeung tujuh dina wilangan Basa Sunda.',
        cognitiveLevel: 'MOTS',
        topic: 'Wilangan Basa Sunda'
    },
    // --- FASE B (KELAS 3 - 4) ---
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Baca cutatan carita pondok ieu: "Unggal poé Minggu, Gilang jeung lanceukna ngabantuan bapana maraban lauk di balong tukangeun imah. Balongna cai hérang sarta loba lauk emas anu geus galedé."',
        question: 'Naon kagiatan anu dilakukeun ku Gilang unggal poé Minggu nurutkeun bacaan di luhur?',
        optionsFaseA: [
            { key: 'A', text: 'Ngabantuan bapana maraban lauk di balong' },
            { key: 'B', text: 'Indit ulin ka kota gedé' },
            { key: 'C', text: 'Meresihan kebon jagong' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Ngabantuan bapana maraban lauk emas di balong' },
            { key: 'B', text: 'Indit balanja ka pasar tradisional' },
            { key: 'C', text: 'Ngala buah rambutan di leuweung' },
            { key: 'D', text: 'Ngalap kéjo di dapur' }
        ],
        correctAnswer: 'A',
        explanation: 'Dina carita disebutkeun unggal poé Minggu Gilang ngabantuan bapana maraban lauk di balong.',
        cognitiveLevel: 'LOTS',
        topic: 'Maca Carita Pondok'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Sore tadi hujan ngagebrét, tuluy jalan di hareupeun sakola jadi leueur pisan.',
        question: 'Kecap "leueur" dina kalimah di luhur hartina sarua jeung ...',
        optionsFaseA: [
            { key: 'A', text: 'Licin lamun ditincak' },
            { key: 'B', text: 'Garing tur beresih' },
            { key: 'C', text: 'Panas pisan' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Licin matak tisolédat lamun ditincak' },
            { key: 'B', text: 'Garing pisan kawas keusik' },
            { key: 'C', text: 'Beresih teu aya lebu' },
            { key: 'D', text: 'Caang ku cahya panonpoé' }
        ],
        correctAnswer: 'A',
        explanation: 'Kecap "leueur" hartina licin, sabalikna tina kesed atawa garing.',
        cognitiveLevel: 'LOTS',
        topic: 'Kosakata Basa Sunda'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Ibu Guru naros ka Roni: "Roni, tos sarapan teu acan ti rorompok?"',
        question: 'Jawaban Roni anu maké basa lemes keur sorangan anu pangmerenahna nyaéta ...',
        optionsFaseA: [
            { key: 'A', text: 'Parantos, Bu. Abdi neda sareng endog dadar.' },
            { key: 'B', text: 'Enggeus, urang mah dahar wareg pisan.' },
            { key: 'C', text: 'Parantos, abdi tuang tadi subuh.' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Parantos, Bu. Abdi parantos neda tadi énjing.' },
            { key: 'B', text: 'Enggeus, uing mah nyatu di dapur.' },
            { key: 'C', text: 'Parantos, abdi parantos tuang di bumi.' },
            { key: 'D', text: 'Atos, keur lapar kénéh uing mah.' }
        ],
        correctAnswer: 'A',
        explanation: 'Keur diri sorangan maké kecap lemes "neda", sedengkeun kecap "tuang" dipaké pikeun ngahormat batur.',
        cognitiveLevel: 'MOTS',
        topic: 'Undak-Usuk Basa'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Titénan dongéng fabel ieu: "Sakadang Kuya jeung Sakadang Monyét babarengan melak tangkal cau. Monyét melak bagian pucukna nepi ka paéh, sedengkeun Kuya melak bagian tunggulna nepi ka buahan."',
        question: 'Sikap Sakadang Kuya dina dongéng di luhur anu patut diturutan ku urang nyaéta ...',
        optionsFaseA: [
            { key: 'A', text: 'Sabar jeung taliti nalika melak pepelakan' },
            { key: 'B', text: 'Sarakah hayang meunang bagian nu pangluhurna' },
            { key: 'C', text: 'Nipu babaturan sorangan' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Sabar, suhud, jeung ngarti cara melak nu bener' },
            { key: 'B', text: 'Sarakah ngarebut milik babaturan' },
            { key: 'C', text: 'Henteu daék ngarawat pepelakan' },
            { key: 'D', text: 'Pundungan nalika pagawéan hésé' }
        ],
        correctAnswer: 'A',
        explanation: 'Sakadang Kuya sabar ngarawat tangkal cau ti mimiti tunasna nepi ka buahan.',
        cognitiveLevel: 'MOTS',
        topic: 'Dongéng Fabel Sunda'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Di buruan sakola, barudak keur ulin kaulinan tradisional nguriling bari nyanyi: "Oray-orayan luar-léor mapay sawah..."',
        question: 'Nilai kahadéan anu karasa ku barudak tina kaulinan oray-orayan nyaéta ...',
        optionsFaseA: [
            { key: 'A', text: 'Ngaraketkeun duduluran, kabungah, jeung gawé bareng' },
            { key: 'B', text: 'Ngalatih sikep égois hayang meunang sorangan' },
            { key: 'C', text: 'Ngajadikeun barudak males gerak' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Silih asah silih asuh, rukun, jeung ngalatih kakompakan' },
            { key: 'B', text: 'Ngabalukarkeun pasea antar kelas' },
            { key: 'C', text: 'Ngurangan rasa babarayaan' },
            { key: 'D', text: 'Ngabiasakeun cicing sorangan di jero kamar' }
        ],
        correctAnswer: 'A',
        explanation: 'Kaulinan barudak Sunda ngajarkeun kabersamaan, gerak awak séhat, jeung karukunan.',
        cognitiveLevel: 'HOTS',
        topic: 'Kaulinan Barudak'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Titénan kalimah ieu: "Mang Agus keur ngala kalapa di kebon."',
        question: 'Kecap pagawéan (kata kerja) dina kalimah di luhur nyaéta ...',
        optionsFaseA: [
            { key: 'A', text: 'Ngala' },
            { key: 'B', text: 'Kalapa' },
            { key: 'C', text: 'Kebon' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Ngala' },
            { key: 'B', text: 'Kalapa' },
            { key: 'C', text: 'Kebon' },
            { key: 'D', text: 'Mang Agus' }
        ],
        correctAnswer: 'A',
        explanation: '"Ngala" mangrupa kecap pagawéan nu hartina metik atawa nyokot buah tina tangkalna.',
        cognitiveLevel: 'LOTS',
        topic: 'Kecap Pagawéan'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Bandung jeung sabudeureunana kawentar miboga rupa-rupa kadaharan has tradisional tina sampeu jeung ketan.',
        question: 'Kadaharan has Sunda anu dijieun tina sampeu kulub nu diragian nepi ka hipu jeung amis disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Peuyeum' },
            { key: 'B', text: 'Kérécek' },
            { key: 'C', text: 'Gudeg' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Peuyeum Bandung' },
            { key: 'B', text: 'Rendang daging' },
            { key: 'C', text: 'Gudeg nangka' },
            { key: 'D', text: 'Pempek palembang' }
        ],
        correctAnswer: 'A',
        explanation: 'Peuyeum Bandung dijieun tina sampeu anu difermentasi ku ragi.',
        cognitiveLevel: 'LOTS',
        topic: 'Kadaharan Has Sunda'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Baca kalimah ieu: "Hawa di pagunungan Lémbang karasa tiis pisan dina waktu subuh."',
        question: 'Lawan kecap tina "tiis" dina kalimah di luhur nyaéta ...',
        optionsFaseA: [
            { key: 'A', text: 'Panas / Haneut' },
            { key: 'B', text: 'Baseuh' },
            { key: 'C', text: 'Seungit' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Panas' },
            { key: 'B', text: 'Baseuh' },
            { key: 'C', text: 'Seungit' },
            { key: 'D', text: 'Jero' }
        ],
        correctAnswer: 'A',
        explanation: 'Antonim tina kecap "tiis" nyaéta "panas".',
        cognitiveLevel: 'LOTS',
        topic: 'Antonim Basa Sunda'
    },
    {
        minGrade: 3, maxGrade: 4,
        stimulus: 'Nalika Bapa Kapala Sakola nuju nyarios di hareupeun barudak, sadayana kudu ngaregepkeun kalawan tartib.',
        question: 'Kecap "nyarios" dina kalimah di luhur mangrupa basa lemes tina kecap loma ...',
        optionsFaseA: [
            { key: 'A', text: 'Ngomong' },
            { key: 'B', text: 'Leumpang' },
            { key: 'C', text: 'Saré' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Ngomong' },
            { key: 'B', text: 'Leumpang' },
            { key: 'C', text: 'Saré' },
            { key: 'D', text: 'Nulis' }
        ],
        correctAnswer: 'A',
        explanation: 'Nyarios mangrupa kecap lemes keur batur tina kecap loma ngomong.',
        cognitiveLevel: 'MOTS',
        topic: 'Undak-Usuk Basa Lanjutan'
    },
    // --- FASE C (KELAS 5 - 6) ---
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Titénan sisindiran paparikan ieu:\n"Meuli baju ka Cimahi,\nmeuli sapatu ka Cicadas.\nKudu getol ngaji diri,\nsangkan hirup henteu bedas." (catetan: maksudna hirup salawasna tartib tur jembar élmu)',
        question: 'Dina aturan sisindiran Sunda, dua padalisan mimiti ("Meuli baju ka Cimahi / meuli sapatu ka Cicadas") disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Cangkang' },
            { key: 'B', text: 'Eusi' },
            { key: 'C', text: 'Amanat' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Cangkang' },
            { key: 'B', text: 'Eusi' },
            { key: 'C', text: 'Judul' },
            { key: 'D', text: 'Panutup' }
        ],
        correctAnswer: 'A',
        explanation: 'Dina sisindiran opat padalisan, baris ka-1 jeung ka-2 disebut cangkang, sedengkeun baris ka-3 jeung ka-4 disebut eusi.',
        cognitiveLevel: 'MOTS',
        topic: 'Sisindiran Sunda'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Baca cutatan biantara ieu: "Hadirin nu dipikahormat, hayu urang babarengan ngamumulé lingkungan sakola ku cara melak tangkal jeung miceun runtah kana tempatna."',
        question: 'Bagian biantara anu eusina ngajak pamiarsa pikeun ngalaksanakeun hiji kahadéan saperti conto di luhur kaasup kana bagian ...',
        optionsFaseA: [
            { key: 'A', text: 'Eusi biantara' },
            { key: 'B', text: 'Salam bubuka' },
            { key: 'C', text: 'Salam panutup' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Eusi biantara' },
            { key: 'B', text: 'Salam bubuka' },
            { key: 'C', text: 'Bubuka panghatur nuhun' },
            { key: 'D', text: 'Salam panutup' }
        ],
        correctAnswer: 'A',
        explanation: 'Ajakan jeung pedaran poko pasualan ditepikeun dina bagian eusi biantara.',
        cognitiveLevel: 'MOTS',
        topic: 'Struktur Biantara'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Baca babasan Sunda ieu: "Si Raka mah budakna hampang birit, unggal dititah ku kolotna sok langsung ngalaksanakeun."',
        question: 'Harti babasan "hampang birit" dina kalimah di luhur nyaéta ...',
        optionsFaseA: [
            { key: 'A', text: 'Daékan, gancang mun dititah' },
            { key: 'B', text: 'Kedul jeung hésé hudang' },
            { key: 'C', text: 'Sombong kana pakaya' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Daékan sarta gancang nurut lamun dipénta tulung' },
            { key: 'B', text: 'Kedul pisan teu daék digawé' },
            { key: 'C', text: 'Sok pundung lamun dipapatahan' },
            { key: 'D', text: 'Suka ngomongkeun batur' }
        ],
        correctAnswer: 'A',
        explanation: 'Babasan "hampang birit" ngagambarkeun jalma nu daékan, enténgan, jeung gancang digawé mun dititah.',
        cognitiveLevel: 'MOTS',
        topic: 'Babasan Jeung Paribasa'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Titénan pada Pupuh Kinanti ieu:\n"Budak leutik bisa ngapung\nbabaku ngapungna peuting\nngalayang kakalayangan\nnéangan nu amis-amis\nsarupaning bubuahan\nnaon baé nu kapanggih"',
        question: 'Suku kata (guru wilangan) jeung sora tungtung vokal (guru lagu) dina padalisan kahiji pupuh di luhur ("Bu-dak leu-tik bi-sa nga-pung") nyaéta ...',
        optionsFaseA: [
            { key: 'A', text: '8-u' },
            { key: 'B', text: '12-a' },
            { key: 'C', text: '6-i' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '8-u' },
            { key: 'B', text: '8-i' },
            { key: 'C', text: '10-a' },
            { key: 'D', text: '12-u' }
        ],
        correctAnswer: 'A',
        explanation: '"Bu-dak-leu-tik-bi-sa-nga-pung" aya 8 engang (guru wilangan 8) kalawan vokal tungtung "u" (8-u).',
        cognitiveLevel: 'HOTS',
        topic: 'Pupuh Kinanti'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Dina tata basa Sunda aya kecap rajékan anu ngulang engang mimiti kecap dasarna, contona "babalik" atawa "tatanya" tina kecap "tanya".',
        question: 'Kecap rajékan anu dibentuk ku cara ngulang engang mimiti kecap dasar saperti "tatanya" jeung "kokolot" disebut kecap rajékan ...',
        optionsFaseA: [
            { key: 'A', text: 'Dwipurwa' },
            { key: 'B', text: 'Dwilingga' },
            { key: 'C', text: 'Trilingga' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Dwipurwa' },
            { key: 'B', text: 'Dwimadya' },
            { key: 'C', text: 'Dwilingga' },
            { key: 'D', text: 'Trilingga' }
        ],
        correctAnswer: 'A',
        explanation: 'Dwipurwa hartina ngulang suku kata mimiti kecap dasar (purwa = mimiti), contona tanya -> tatanya.',
        cognitiveLevel: 'MOTS',
        topic: 'Kecap Rajékan Dwipurwa'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Dina warta basa Sunda ngeunaan bencana banjir di hiji kacamatan, wartawan nyatet unsur 5W+1H (Naon, Saha, Dimana, Iraha, Ku naon, Kumaha).',
        question: 'Unsur warta anu dipaké pikeun nanyakeun sabab-musabab kajadian banjir bisa lumangsung nyaéta ...',
        optionsFaseA: [
            { key: 'A', text: 'Ku naon (Naha)' },
            { key: 'B', text: 'Iraha' },
            { key: 'C', text: 'Saha' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Ku naon / Naha' },
            { key: 'B', text: 'Iraha' },
            { key: 'C', text: 'Saha' },
            { key: 'D', text: 'Dimana' }
        ],
        correctAnswer: 'A',
        explanation: 'Kecap pananya "Ku naon" atawa "Naha" (Why) dipaké pikeun ngagali alesan atawa sabab kajadian.',
        cognitiveLevel: 'LOTS',
        topic: 'Unsur Warta'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Dina tulisan Aksara Sunda Kaganga, rarangkén panyecek (tanda titik di luhureun aksara ngalagena "ka") ngarobah sora jadi ...',
        question: 'Bunyi suku kata anu dihasilkeun lamun aksara ngalagena "ka" dibéré rarangkén panyecek di luhurna nyaéta ...',
        optionsFaseA: [
            { key: 'A', text: 'Kang' },
            { key: 'B', text: 'Kar' },
            { key: 'C', text: 'Kah' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Kang' },
            { key: 'B', text: 'Kar' },
            { key: 'C', text: 'Kah' },
            { key: 'D', text: 'Ki' }
        ],
        correctAnswer: 'A',
        explanation: 'Rarangkén panyecek nambahkeun sora konsonan tungtung "-ng", sedengkeun panglayar "-r" jeung pangwisad "-h".',
        cognitiveLevel: 'HOTS',
        topic: 'Rarangkén Aksara Sunda'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Baca paribasa Sunda ieu: "Cikaracak ninggang batu laun-laun jadi legok."',
        question: 'Pesen moral anu dikandung ku paribasa Sunda di luhur pikeun murid sakola nyaéta ...',
        optionsFaseA: [
            { key: 'A', text: 'Sanajan élmu téh hésé, lamun dipigawé kalawan suhud tur sabar pasti bakal bisa' },
            { key: 'B', text: 'Ulah daék ngalawan kana pagawéan nu hésé' },
            { key: 'C', text: 'Batu anu teuas teu perlu disiraman cai' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Lamun diajar kalawan tekun, sabar, jeung terus-terusan, perkara hésé ogé pasti bakal kahontal' },
            { key: 'B', text: 'Lamun manggih soal hésé leuwih hadé langsung ditinggalkeun' },
            { key: 'C', text: 'Cai hujan ngan ukur ngarusak tatangkalan di gunung' },
            { key: 'D', text: 'Ulah ngandelkeun babaturan dina diskusi kelas' }
        ],
        correctAnswer: 'A',
        explanation: 'Paribasa éta ngajarkeun yén katekunan jeung kasabaran bisa ngéléhkeun kasusah naon baé.',
        cognitiveLevel: 'HOTS',
        topic: 'Paribasa Sunda'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Di Tatar Sunda aya kasenian tradisional anu maké wayang tina bahan kai sarta dipaénkeun ku saurang dalang bari dibarengan gamelan saléndro.',
        question: 'Ngaran kasenian tradisional Sunda anu ngagunakeun bonéka tina kai kasebut nyaéta ...',
        optionsFaseA: [
            { key: 'A', text: 'Wayang Golék' },
            { key: 'B', text: 'Wayang Kulit' },
            { key: 'C', text: 'Reog Ponorogo' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Wayang Golék' },
            { key: 'B', text: 'Wayang Kulit' },
            { key: 'C', text: 'Lenong Betawi' },
            { key: 'D', text: 'Ludruk Jawa' }
        ],
        correctAnswer: 'A',
        explanation: 'Wayang Golék mangrupa seni pintonan wayang kai tilu diménsi has budaya Sunda.',
        cognitiveLevel: 'LOTS',
        topic: 'Kasenian Sunda Wayang Golék'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Sari nulis surat resmi uleman pikeun ngondang komite sakola dina acara pasanggiri pupuh tingkat kacamatan.',
        question: 'Dina kalimah panutup surat resmi dina Basa Sunda, ungkapan panghormat anu merenah nyaéta ...',
        optionsFaseA: [
            { key: 'A', text: 'Sakitu nu kapihatur, mugia Bapa/Ibu tiasa sumping dina waktosna. Hatur nuhun.' },
            { key: 'B', text: 'Pokona kudu datang isukan, ulah telat nya!' },
            { key: 'C', text: 'Wilujeng tuang sadayana di bumi masing-masing.' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Sakitu nu kapihatur, kana perhatosanana sim kuring ngahaturkeun nuhun.' },
            { key: 'B', text: 'Pokona wajib hadir isukan, mun henteu rék didenda.' },
            { key: 'C', text: 'Héy babaturan, hayu urang ulin ka lapangan.' },
            { key: 'D', text: 'Wassalam, geura balik masing-masing.' }
        ],
        correctAnswer: 'A',
        explanation: 'Surat resmi kudu maké basa lemes baku anu sopan tur hormat ka nu narima uleman.',
        cognitiveLevel: 'MOTS',
        topic: 'Nulis Surat Basa Sunda'
    },
    {
        minGrade: 5, maxGrade: 6,
        stimulus: 'Bangunan imah adat tradisional Sunda miboga ciri has wangun hateupna anu mirip jangjang manuk keur hiber.',
        question: 'Ngaran wangun suhunan imah adat Sunda anu jiga jangjang manuk keur hiber disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Julang Ngapak' },
            { key: 'B', text: 'Joglo' },
            { key: 'C', text: 'Rumah Gadang' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Julang Ngapak' },
            { key: 'B', text: 'Joglo Jawa' },
            { key: 'C', text: 'Rumah Gadang' },
            { key: 'D', text: 'Honai Papua' }
        ],
        correctAnswer: 'A',
        explanation: 'Julang Ngapak nyaéta wangun suhunan imah adat Sunda anu bagian kénca-katuhuna rubak kawas jangjang manuk julang.',
        cognitiveLevel: 'MOTS',
        topic: 'Arsitéktur Imah Adat Sunda'
    }
];
