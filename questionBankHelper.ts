import { QuestionPG, QuestionIsian, QuestionUraian, VisualType } from './NaskahSumatifGenerator';

/**
 * Normalizes question and stimulus text to create a robust fingerprint for detecting duplicate questions.
 */
export function getQuestionFingerprint(question?: string, stimulus?: string): string {
    const combined = `${question || ''} ${stimulus || ''}`;
    return combined
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 220);
}

/**
 * Normalizes ONLY the question stem to prevent identical question wording across different stimuli.
 */
export function getQuestionStemFingerprint(question?: string): string {
    return (question || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 180);
}

export function isDuplicateQuestion(seen: Set<string>, question?: string, stimulus?: string): boolean {
    const fullFp = getQuestionFingerprint(question, stimulus);
    const stemFp = getQuestionStemFingerprint(question);
    if (!stemFp) return true;
    return seen.has(fullFp) || seen.has(`full:${fullFp}`) || seen.has(`stem:${stemFp}`);
}

export function markQuestionSeen(seen: Set<string>, question?: string, stimulus?: string): void {
    const fullFp = getQuestionFingerprint(question, stimulus);
    const stemFp = getQuestionStemFingerprint(question);
    if (fullFp) {
        seen.add(fullFp);
        seen.add(`full:${fullFp}`);
    }
    if (stemFp) {
        seen.add(`stem:${stemFp}`);
    }
}


export interface QuestionBankItemPG {
    stimulus?: string;
    question: string;
    optionsFaseA: { key: string; text: string }[];
    optionsFaseBC: { key: string; text: string }[];
    correctAnswer: string;
    explanation: string;
    cognitiveLevel: 'LOTS' | 'MOTS' | 'HOTS';
    topic: string;
    visualType?: VisualType;
    visualTitle?: string;
}

export interface QuestionBankItemIsian {
    stimulus?: string;
    question: string;
    correctAnswer: string;
    cognitiveLevel: 'LOTS' | 'MOTS' | 'HOTS';
    topic: string;
}

export interface QuestionBankItemUraian {
    stimulus?: string;
    question: string;
    correctAnswer: string;
    cognitiveLevel: 'LOTS' | 'MOTS' | 'HOTS';
    topic: string;
    rubric: {
        score3: string;
        score2: string;
        score1: string;
        score0: string;
    };
}

// ==========================================
// 1. EXTENSIVE QUESTION BANKS (MATEMATIKA)
// ==========================================
const MATH_PG_BANK: QuestionBankItemPG[] = [
    {
        visualType: 'clock_0900',
        visualTitle: 'Perhatikan gambar jarum jam dinding berikut!',
        stimulus: 'Pada pukul 09.00 tepat, siswa kelas mulai melaksanakan kegiatan literasi bersama di perpustakaan.',
        question: 'Berdasarkan posisi jarum jam pada gambar, jenis sudut yang dibentuk antara jarum pendek dan jarum panjang adalah sudut ...',
        optionsFaseA: [
            { key: 'A', text: 'Lancip (kurang dari 90°)' },
            { key: 'B', text: 'Siku-siku (tepat 90°)' },
            { key: 'C', text: 'Tumpul (lebih dari 90°)' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Lancip (kurang dari 90°)' },
            { key: 'B', text: 'Siku-siku (tepat 90°)' },
            { key: 'C', text: 'Tumpul (antara 90° dan 180°)' },
            { key: 'D', text: 'Lurus (180°)' }
        ],
        correctAnswer: 'B',
        explanation: 'Jarum jam pada pukul 09.00 tepat saling tegak lurus membentuk sudut siku-siku sebesar 90 derajat.',
        cognitiveLevel: 'LOTS',
        topic: 'Pengukuran Sudut'
    },
    {
        visualType: 'clock_0200',
        visualTitle: 'Perhatikan gambar jam dinding pukul 02.00 berikut!',
        stimulus: 'Jam dinding ruang kelas menunjukkan waktu istirahat kedua tepat pukul 02.00 siang.',
        question: 'Besar sudut terkecil yang terbentuk antara jarum pendek dan jarum panjang pada jam tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: '30°' },
            { key: 'B', text: '60°' },
            { key: 'C', text: '90°' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '30°' },
            { key: 'B', text: '60°' },
            { key: 'C', text: '90°' },
            { key: 'D', text: '120°' }
        ],
        correctAnswer: 'B',
        explanation: 'Setiap 1 jam mewakili 360° / 12 = 30°. Pada pukul 02.00 sudutnya adalah 2 x 30° = 60° (sudut lancip).',
        cognitiveLevel: 'MOTS',
        topic: 'Pengukuran Sudut'
    },
    {
        visualType: 'fraction_circle',
        visualTitle: 'Perhatikan gambar lingkaran yang dibagi sama besar berikut!',
        stimulus: 'Sebuah loyang pizza dipotong menjadi 6 bagian sama besar. Siti memakan 2 bagian seperti terlihat pada area yang diarsir.',
        question: 'Pecahan yang menyatakan banyaknya bagian pizza yang telah dimakan Siti adalah ...',
        optionsFaseA: [
            { key: 'A', text: '1/6 bagian' },
            { key: 'B', text: '2/6 bagian (senilai 1/3)' },
            { key: 'C', text: '3/6 bagian' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '1/6 bagian' },
            { key: 'B', text: '2/6 bagian (senilai 1/3)' },
            { key: 'C', text: '3/6 bagian (senilai 1/2)' },
            { key: 'D', text: '4/6 bagian' }
        ],
        correctAnswer: 'B',
        explanation: 'Bagian yang diarsir ada 2 dari total 6 bagian, bernilai 2/6 atau senilai 1/3.',
        cognitiveLevel: 'LOTS',
        topic: 'Pecahan Sederhana'
    },
    {
        visualType: 'fraction_rect',
        visualTitle: 'Perhatikan gambar persegi panjang berpita arsiran berikut!',
        stimulus: 'Sebuah pita kain dibagi menjadi 8 petak sama panjang. Budi mewarnai 3 petak dengan warna biru.',
        question: 'Berapakah nilai pecahan petak pita yang telah diwarnai oleh Budi?',
        optionsFaseA: [
            { key: 'A', text: '1/8 petak' },
            { key: 'B', text: '3/8 petak' },
            { key: 'C', text: '5/8 petak' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '2/8 petak' },
            { key: 'B', text: '3/8 petak' },
            { key: 'C', text: '5/8 petak' },
            { key: 'D', text: '8/3 petak' }
        ],
        correctAnswer: 'B',
        explanation: 'Petak yang diwarnai berjumlah 3 dari total 8 petak, sehingga pecahannya adalah 3/8.',
        cognitiveLevel: 'LOTS',
        topic: 'Pecahan'
    },
    {
        visualType: 'shape_rect',
        visualTitle: 'Perhatikan bangun datar persegi panjang di bawah ini!',
        stimulus: 'Papan tulis mini di kelas memiliki ukuran panjang 12 cm dan lebar 6 cm.',
        question: 'Berdasarkan ukuran pada gambar, berapakah luas permukaan papan tulis mini tersebut?',
        optionsFaseA: [
            { key: 'A', text: '36 cm²' },
            { key: 'B', text: '72 cm²' },
            { key: 'C', text: '18 cm²' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '36 cm²' },
            { key: 'B', text: '72 cm²' },
            { key: 'C', text: '18 cm²' },
            { key: 'D', text: '144 cm²' }
        ],
        correctAnswer: 'B',
        explanation: 'Luas persegi panjang = Panjang x Lebar = 12 cm x 6 cm = 72 cm².',
        cognitiveLevel: 'MOTS',
        topic: 'Luas Bangun Datar'
    },
    {
        visualType: 'shape_triangle',
        visualTitle: 'Perhatikan gambar segitiga siku-siku berikut!',
        stimulus: 'Penggaris segitiga milik Edo memiliki panjang alas 8 cm, tinggi 6 cm, dan sisi miring 10 cm.',
        question: 'Berapakah luas segitiga penggaris tersebut?',
        optionsFaseA: [
            { key: 'A', text: '24 cm²' },
            { key: 'B', text: '48 cm²' },
            { key: 'C', text: '14 cm²' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '24 cm²' },
            { key: 'B', text: '48 cm²' },
            { key: 'C', text: '40 cm²' },
            { key: 'D', text: '80 cm²' }
        ],
        correctAnswer: 'A',
        explanation: 'Luas segitiga = 1/2 x alas x tinggi = 1/2 x 8 cm x 6 cm = 24 cm².',
        cognitiveLevel: 'MOTS',
        topic: 'Luas Bangun Datar'
    },
    {
        visualType: 'chart_bar',
        visualTitle: 'Perhatikan diagram batang peminjaman buku perpustakaan berikut!',
        stimulus: 'Petugas perpustakaan mencatat jumlah peminjam buku dari hari Senin sampai Kamis: Senin 15 orang, Selasa 25 orang, Rabu 10 orang, Kamis 20 orang.',
        question: 'Berdasarkan data diagram batang di atas, selisih jumlah peminjam buku antara hari Selasa dan hari Rabu adalah ...',
        optionsFaseA: [
            { key: 'A', text: '10 orang' },
            { key: 'B', text: '15 orang' },
            { key: 'C', text: '25 orang' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '10 orang' },
            { key: 'B', text: '15 orang' },
            { key: 'C', text: '20 orang' },
            { key: 'D', text: '25 orang' }
        ],
        correctAnswer: 'B',
        explanation: 'Selisih peminjam buku = 25 (Selasa) - 10 (Rabu) = 15 orang.',
        cognitiveLevel: 'MOTS',
        topic: 'Pengolahan Data'
    },
    {
        visualType: 'shape_cube',
        visualTitle: 'Perhatikan gambar kubus mainan berikut!',
        stimulus: 'Sebuah kotak kado mainan berbentuk kubus memiliki panjang rusuk 5 cm.',
        question: 'Berapakah volume kotak kado mainan tersebut?',
        optionsFaseA: [
            { key: 'A', text: '25 cm³' },
            { key: 'B', text: '125 cm³' },
            { key: 'C', text: '150 cm³' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '25 cm³' },
            { key: 'B', text: '75 cm³' },
            { key: 'C', text: '125 cm³' },
            { key: 'D', text: '150 cm³' }
        ],
        correctAnswer: 'C',
        explanation: 'Volume kubus = s x s x s = 5 x 5 x 5 = 125 cm³.',
        cognitiveLevel: 'MOTS',
        topic: 'Volume Bangun Ruang'
    },
    {
        visualType: 'cube_net',
        visualTitle: 'Perhatikan gambar jaring-jaring kubus berikut!',
        stimulus: 'Sebuah pola karton dibuat dengan 6 buah persegi bernomor 1 sampai 6 untuk dirangkai menjadi kotak kubus.',
        question: 'Jika persegi nomor 1 dijadikan sebagai sisi alas, maka persegi yang akan menjadi sisi tutup atas kubus adalah nomor ...',
        optionsFaseA: [
            { key: 'A', text: 'Nomor 2' },
            { key: 'B', text: 'Nomor 3' },
            { key: 'C', text: 'Nomor 4' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Nomor 2' },
            { key: 'B', text: 'Nomor 3' },
            { key: 'C', text: 'Nomor 4' },
            { key: 'D', text: 'Nomor 5' }
        ],
        correctAnswer: 'B',
        explanation: 'Pada jaring-jaring kubus pola standar, sisi alas nomor 1 berhadapan lurus dengan sisi nomor 3 sebagai tutup.',
        cognitiveLevel: 'HOTS',
        topic: 'Jaring-jaring Bangun Ruang'
    },
    {
        stimulus: 'Paman memanen 145 buah mangga dari pohon pertama dan 235 buah mangga dari pohon kedua. Seluruh mangga dimasukkan sama rata ke dalam 5 keranjang.',
        question: 'Banyaknya buah mangga yang ada di dalam setiap keranjang adalah ...',
        optionsFaseA: [
            { key: 'A', text: '74 buah' },
            { key: 'B', text: '76 buah' },
            { key: 'C', text: '78 buah' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '74 buah' },
            { key: 'B', text: '76 buah' },
            { key: 'C', text: '78 buah' },
            { key: 'D', text: '82 buah' }
        ],
        correctAnswer: 'B',
        explanation: 'Total mangga = 145 + 235 = 380 buah. Dibagi ke 5 keranjang = 380 / 5 = 76 buah.',
        cognitiveLevel: 'MOTS',
        topic: 'Operasi Hitung Campuran'
    },
    {
        stimulus: 'Lani memiliki seutas pita sepanjang 3,5 meter. Ia menggunakan 1,75 meter untuk menghias kado ulang tahun adiknya.',
        question: 'Panjang sisa pita yang masih dimiliki oleh Lani adalah ...',
        optionsFaseA: [
            { key: 'A', text: '1,50 meter' },
            { key: 'B', text: '1,75 meter' },
            { key: 'C', text: '2,25 meter' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '1,25 meter' },
            { key: 'B', text: '1,50 meter' },
            { key: 'C', text: '1,75 meter' },
            { key: 'D', text: '2,25 meter' }
        ],
        correctAnswer: 'C',
        explanation: 'Sisa pita = 3,50 - 1,75 = 1,75 meter.',
        cognitiveLevel: 'LOTS',
        topic: 'Operasi Bilangan Desimal'
    },
    {
        stimulus: 'Andi berenang setiap 4 hari sekali, sedangkan Budi berenang setiap 6 hari sekali di kolam yang sama.',
        question: 'Jika pada tanggal 2 Mei mereka berenang bersama-sama untuk pertama kali, pada tanggal berapa mereka akan berenang bersama lagi?',
        optionsFaseA: [
            { key: 'A', text: '10 Mei' },
            { key: 'B', text: '14 Mei' },
            { key: 'C', text: '24 Mei' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '10 Mei' },
            { key: 'B', text: '12 Mei' },
            { key: 'C', text: '14 Mei' },
            { key: 'D', text: '18 Mei' }
        ],
        correctAnswer: 'C',
        explanation: 'KPK dari 4 dan 6 adalah 12 hari. Tanggal bersama lagi = 2 Mei + 12 hari = 14 Mei.',
        cognitiveLevel: 'HOTS',
        topic: 'KPK dan FPB'
    },
    {
        stimulus: 'Ibu memiliki 24 kue bolu dan 36 pastel. Ibu ingin membagikan kue tersebut ke dalam piring-piring dengan jumlah dan jenis yang sama banyak tanpa sisa.',
        question: 'Berapakah jumlah piring terbanyak yang harus disiapkan oleh Ibu?',
        optionsFaseA: [
            { key: 'A', text: '6 piring' },
            { key: 'B', text: '12 piring' },
            { key: 'C', text: '18 piring' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '6 piring' },
            { key: 'B', text: '8 piring' },
            { key: 'C', text: '12 piring' },
            { key: 'D', text: '16 piring' }
        ],
        correctAnswer: 'C',
        explanation: 'FPB dari 24 dan 36 adalah 12. Jadi piring terbanyak yang dibutuhkan adalah 12 buah.',
        cognitiveLevel: 'HOTS',
        topic: 'KPK dan FPB'
    },
    {
        stimulus: 'Di sebuah toko buku, harga sebuah tas sekolah adalah Rp120.000,00. Menjelang tahun ajaran baru, toko memberikan diskon sebesar 20%.',
        question: 'Berapa rupiah uang yang harus dibayarkan pembeli setelah mendapatkan diskon?',
        optionsFaseA: [
            { key: 'A', text: 'Rp96.000,00' },
            { key: 'B', text: 'Rp100.000,00' },
            { key: 'C', text: 'Rp104.000,00' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Rp90.000,00' },
            { key: 'B', text: 'Rp96.000,00' },
            { key: 'C', text: 'Rp100.000,00' },
            { key: 'D', text: 'Rp104.000,00' }
        ],
        correctAnswer: 'B',
        explanation: 'Besar diskon = 20% x 120.000 = 24.000. Uang dibayar = 120.000 - 24.000 = Rp96.000,00.',
        cognitiveLevel: 'MOTS',
        topic: 'Persentase dan Diskon'
    },
    {
        stimulus: 'Data nilai ulangan matematika dari 8 siswa adalah: 70, 80, 75, 90, 80, 85, 80, 95.',
        question: 'Nilai modus (nilai yang paling sering muncul) dari data ulangan matematika tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: '75' },
            { key: 'B', text: '80' },
            { key: 'C', text: '85' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '75' },
            { key: 'B', text: '80' },
            { key: 'C', text: '85' },
            { key: 'D', text: '90' }
        ],
        correctAnswer: 'B',
        explanation: 'Nilai 80 muncul sebanyak 3 kali, paling banyak dibandingkan nilai lainnya.',
        cognitiveLevel: 'LOTS',
        topic: 'Statistika Data'
    }
];

// ==========================================
// 2. EXTENSIVE QUESTION BANKS (BAHASA INDONESIA)
// ==========================================
const INDO_PG_BANK: QuestionBankItemPG[] = [
    {
        stimulus: 'Bacalah paragraf berikut dengan cermat:\n"Hutan bakau di tepi pantai memiliki peran sangat penting dalam menjaga kelestarian lingkungan pesisir. Akar pohon bakau yang kokoh dapat menahan hempasan ombak besar sehingga mencegah terjadinya abrasi pantai. Selain itu, kawasan bakau menjadi tempat hidup dan berkembang biak bagi kepiting, udang, dan berbagai jenis ikan kecil."',
        question: 'Ide pokok paragraf bacaan di atas adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Manfaat penting hutan bakau bagi lingkungan pesisir' },
            { key: 'B', text: 'Hewan kepiting yang hidup di laut' },
            { key: 'C', text: 'Bahaya ombak besar di tepi pantai' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Peran dan manfaat penting hutan bakau bagi kelestarian pesisir' },
            { key: 'B', text: 'Kehidupan udang dan kepiting di kawasan perairan payau' },
            { key: 'C', text: 'Cara menanam pohon bakau agar akarnya kokoh menahan ombak' },
            { key: 'D', text: 'Dampak buruk ombak besar terhadap para nelayan di laut' }
        ],
        correctAnswer: 'A',
        explanation: 'Kalimat utama terletak di awal paragraf yang membahas manfaat dan peran penting hutan bakau.',
        cognitiveLevel: 'MOTS',
        topic: 'Ide Pokok Paragraf'
    },
    {
        stimulus: 'Bacalah teks berikut:\n"Setiap pagi sebelum bel masuk berbunyi, siswa kelas 5 melaksanakan kegiatan piket kebersihan. Ada yang menyapu lantai kelas, merapikan meja guru, dan membuang sampah ke tempatnya. Berkat kerja sama semua siswa, ruang kelas menjadi bersih dan nyaman untuk belajar."',
        question: 'Kalimat utama dari paragraf tersebut terletak pada ...',
        optionsFaseA: [
            { key: 'A', text: 'Awal paragraf (kalimat pertama)' },
            { key: 'B', text: 'Tengah paragraf (kalimat kedua)' },
            { key: 'C', text: 'Akhir paragraf (kalimat terakhir)' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Awal paragraf (kalimat deduktif)' },
            { key: 'B', text: 'Tengah paragraf' },
            { key: 'C', text: 'Akhir paragraf (kalimat induktif)' },
            { key: 'D', text: 'Awal dan akhir paragraf (campuran)' }
        ],
        correctAnswer: 'A',
        explanation: 'Kalimat utama ada di awal paragraf: kegiatan piket kebersihan kelas oleh siswa setiap pagi.',
        cognitiveLevel: 'LOTS',
        topic: 'Kalimat Utama'
    },
    {
        stimulus: 'Perhatikan kalimat rumpang berikut ini:\n"[ ... ] cara membuat pupuk kompos sederhana dari dedaunan kering yang berguguran di halaman sekolah?"',
        question: 'Kata tanya yang tepat untuk melengkapi kalimat tanya di atas adalah kata tanya ...',
        optionsFaseA: [
            { key: 'A', text: 'Siapa' },
            { key: 'B', text: 'Bagaimana' },
            { key: 'C', text: 'Kapan' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Kapan' },
            { key: 'B', text: 'Bagaimana' },
            { key: 'C', text: 'Di mana' },
            { key: 'D', text: 'Mengapa' }
        ],
        correctAnswer: 'B',
        explanation: 'Kata tanya "Bagaimana" digunakan untuk menanyakan cara, metode, atau proses pembuatan sesuatu.',
        cognitiveLevel: 'LOTS',
        topic: 'Kata Tanya'
    },
    {
        stimulus: 'Perhatikan kalimat berikut:\n"Para warga desa bergotong royong melakukan reboisasi di lereng bukit yang gundul untuk mencegah longsor."',
        question: 'Makna istilah kata "reboisasi" pada kalimat di atas adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Penebangan pohon secara liar' },
            { key: 'B', text: 'Penanaman kembali hutan yang gundul' },
            { key: 'C', text: 'Pembakaran lahan perkebunan' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Penebangan pohon hutan secara liar' },
            { key: 'B', text: 'Penanaman kembali lahan atau hutan yang gundul' },
            { key: 'C', text: 'Pembangunan perumahan di daerah perbukitan' },
            { key: 'D', text: 'Pembersihan semak belukar untuk jalan desa' }
        ],
        correctAnswer: 'B',
        explanation: 'Reboisasi artinya penanaman kembali hutan atau bukit yang telah gundul agar tanah menjadi kokoh.',
        cognitiveLevel: 'MOTS',
        topic: 'Makna Kata dan Kosakata'
    },
    {
        stimulus: 'Cermati kalimat petunjuk acak membuat segelas teh manis hangat:\n(1) Tuangkan air panas ke dalam cangkir secara hati-hati.\n(2) Siapkan cangkir, kantong teh celup, dan gula pasir.\n(3) Masukkan satu kantong teh celup dan satu sendok gula.\n(4) Aduk air teh hingga gula larut sempurna dan siap disajikan.',
        question: 'Urutan petunjuk membuat teh manis yang runtut dan benar adalah ...',
        optionsFaseA: [
            { key: 'A', text: '(2) - (1) - (3) - (4)' },
            { key: 'B', text: '(2) - (3) - (1) - (4)' },
            { key: 'C', text: '(1) - (2) - (3) - (4)' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '(2) - (1) - (3) - (4)' },
            { key: 'B', text: '(2) - (3) - (1) - (4)' },
            { key: 'C', text: '(3) - (2) - (1) - (4)' },
            { key: 'D', text: '(1) - (3) - (2) - (4)' }
        ],
        correctAnswer: 'B',
        explanation: 'Urutan logis: siapkan bahan (2) -> masukkan teh dan gula (3) -> tuang air panas (1) -> aduk rata (4).',
        cognitiveLevel: 'HOTS',
        topic: 'Teks Prosedur / Petunjuk'
    },
    {
        stimulus: 'Perhatikan kalimat berikut:\n"Pohon kelapa melambai-lambai di tepi pantai tertiup angin sepoi-sepoi."',
        question: 'Gaya bahasa (majas) yang digunakan pada kalimat di atas adalah majas ...',
        optionsFaseA: [
            { key: 'A', text: 'Hiperbola (berlebih-lebihan)' },
            { key: 'B', text: 'Personifikasi (benda mati berperilaku seperti manusia)' },
            { key: 'C', text: 'Metafora (perbandingan langsung)' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Hiperbola' },
            { key: 'B', text: 'Personifikasi' },
            { key: 'C', text: 'Metafora' },
            { key: 'D', text: 'Litotes' }
        ],
        correctAnswer: 'B',
        explanation: 'Pohon kelapa seolah-olah memiliki tangan yang melambai seperti manusia, merupakan ciri majas personifikasi.',
        cognitiveLevel: 'MOTS',
        topic: 'Gaya Bahasa / Majas'
    },
    {
        stimulus: 'Bacalah kutipan fabel berikut:\n"Meskipun tubuhnya kecil, Semut pantang menyerah mengangkat remah roti ke sarangnya untuk bekal musim hujan. Belalang yang malas hanya tidur-tiduran sambil menertawakan kerja keras Semut."',
        question: 'Pesan moral (amanat) yang terkandung dalam kutipan cerita fabel tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Kita harus rajin bekerja dan tidak boleh bermalas-malasan' },
            { key: 'B', text: 'Kita boleh tidur saat orang lain bekerja' },
            { key: 'C', text: 'Menertawakan teman yang sedang berusaha adalah perbuatan baik' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Bekerja keras dan mempersiapkan masa depan lebih baik daripada bermalas-malasan' },
            { key: 'B', text: 'Tidurlah sebanyak-banyaknya sebelum musim hujan tiba' },
            { key: 'C', text: 'Hindari bekerja sama dengan teman yang bertubuh kecil' },
            { key: 'D', text: 'Makanan enak hanya boleh dinikmati sendirian' }
        ],
        correctAnswer: 'A',
        explanation: 'Cerita mengajarkan nilai ketekunan Semut dan akibat buruk dari sikap malas Belalang.',
        cognitiveLevel: 'HOTS',
        topic: 'Amanat Cerita'
    },
    {
        stimulus: 'Perhatikan kalimat berikut:\n"andi membeli obat di apotik kemarin sore."',
        question: 'Penulisan huruf kapital dan kata baku yang benar pada kalimat di atas adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Andi membeli obat di apotik kemarin sore.' },
            { key: 'B', text: 'Andi membeli obat di apotek kemarin sore.' },
            { key: 'C', text: 'andi Membeli obat di Apotek kemarin sore.' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Andi membeli obat di apotik kemarin sore.' },
            { key: 'B', text: 'Andi membeli obat di apotek kemarin sore.' },
            { key: 'C', text: 'andi Membeli obat di Apotek kemarin sore.' },
            { key: 'D', text: 'ANDI membeli obat di apotik kemarin Sore.' }
        ],
        correctAnswer: 'B',
        explanation: 'Nama orang "Andi" diawali huruf kapital dan kata baku sesuai KBBI adalah "apotek" (bukan apotik).',
        cognitiveLevel: 'LOTS',
        topic: 'Kata Baku dan Ejaan'
    }
];

// ==========================================
// 3. EXTENSIVE QUESTION BANKS (PENDIDIKAN PANCASILA)
// ==========================================
const PANCASILA_PG_BANK: QuestionBankItemPG[] = [
    {
        visualType: 'garuda_bintang',
        visualTitle: 'Perhatikan gambar lambang sila Pancasila berikut!',
        stimulus: 'Sebelum memulai kegiatan pembelajaran di kelas, seluruh siswa selalu berdoa bersama sesuai dengan keyakinan masing-masing.',
        question: 'Sikap berdoa sebelum belajar tersebut merupakan wujud nyata pengamalan sila Pancasila yang dilambangkan dengan simbol pada gambar, yaitu sila ...',
        optionsFaseA: [
            { key: 'A', text: 'Pertama: Ketuhanan Yang Maha Esa' },
            { key: 'B', text: 'Kedua: Kemanusiaan yang Adil dan Beradab' },
            { key: 'C', text: 'Ketiga: Persatuan Indonesia' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Pertama: Ketuhanan Yang Maha Esa' },
            { key: 'B', text: 'Kedua: Kemanusiaan yang Adil dan Beradab' },
            { key: 'C', text: 'Ketiga: Persatuan Indonesia' },
            { key: 'D', text: 'Kelima: Keadilan Sosial bagi Seluruh Rakyat' }
        ],
        correctAnswer: 'A',
        explanation: 'Bintang Emas melambangkan Sila Pertama: Ketuhanan Yang Maha Esa.',
        cognitiveLevel: 'LOTS',
        topic: 'Pengamalan Sila 1'
    },
    {
        visualType: 'garuda_rantai',
        visualTitle: 'Perhatikan simbol sila Pancasila di bawah ini!',
        stimulus: 'Melihat teman sebangkunya tidak membawa pensil, Rian dengan ikhlas meminjamkan pensil cadangan miliknya.',
        question: 'Tindakan saling peduli dan tolong-menolong terhadap sesama manusia merupakan pengamalan sila kedua Pancasila yang dilambangkan oleh simbol ...',
        optionsFaseA: [
            { key: 'A', text: 'Bintang Emas' },
            { key: 'B', text: 'Rantai Emas' },
            { key: 'C', text: 'Pohon Beringin' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Bintang Emas' },
            { key: 'B', text: 'Rantai Emas' },
            { key: 'C', text: 'Pohon Beringin' },
            { key: 'D', text: 'Kepala Banteng' }
        ],
        correctAnswer: 'B',
        explanation: 'Rantai Emas melambangkan Sila Kedua: Kemanusiaan yang Adil dan Beradab.',
        cognitiveLevel: 'LOTS',
        topic: 'Pengamalan Sila 2'
    },
    {
        visualType: 'garuda_beringin',
        visualTitle: 'Perhatikan gambar simbol sila Pancasila berikut!',
        stimulus: 'Para siswa di sekolah berasal dari beragam suku, seperti suku Sunda, Jawa, Batak, dan Minang, namun mereka tetap rukun dan saling menghormati.',
        question: 'Nilai kerukunan dan persatuan bangsa di tengah keberagaman mencerminkan pengamalan sila Pancasila dengan simbol pohon beringin, yaitu sila ke- ...',
        optionsFaseA: [
            { key: 'A', text: 'Satu' },
            { key: 'B', text: 'Dua' },
            { key: 'C', text: 'Tiga' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Satu' },
            { key: 'B', text: 'Dua' },
            { key: 'C', text: 'Tiga' },
            { key: 'D', text: 'Empat' }
        ],
        correctAnswer: 'C',
        explanation: 'Pohon Beringin melambangkan Sila Ketiga: Persatuan Indonesia.',
        cognitiveLevel: 'LOTS',
        topic: 'Pengamalan Sila 3'
    },
    {
        visualType: 'garuda_banteng',
        visualTitle: 'Perhatikan gambar simbol sila Pancasila berikut!',
        stimulus: 'Dalam menentukan ketua kelas dan jadwal piket kebersihan, siswa kelas mengadakan musyawarah untuk mencapai kata mufakat bersama.',
        question: 'Musyawarah untuk mufakat merupakan ciri khas pengamalan sila keempat Pancasila yang dilambangkan oleh ...',
        optionsFaseA: [
            { key: 'A', text: 'Bintang Emas' },
            { key: 'B', text: 'Kepala Banteng' },
            { key: 'C', text: 'Padi dan Kapas' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Bintang Emas' },
            { key: 'B', text: 'Kepala Banteng' },
            { key: 'C', text: 'Rantai Emas' },
            { key: 'D', text: 'Pohon Beringin' }
        ],
        correctAnswer: 'B',
        explanation: 'Kepala Banteng melambangkan Sila Keempat: Kerakyatan yang Dipimpin oleh Hikmat Kebijaksanaan dalam Permusyawaratan/Perwakilan.',
        cognitiveLevel: 'LOTS',
        topic: 'Pengamalan Sila 4'
    },
    {
        visualType: 'garuda_padi_kapas',
        visualTitle: 'Perhatikan lambang sila Pancasila di bawah ini!',
        stimulus: 'Guru membagikan tugas piket dan buku bacaan secara adil kepada seluruh siswa tanpa membeda-bedakan perlakuan.',
        question: 'Perilaku adil dan tidak bersikap boros merupakan pengamalan sila kelima Pancasila yang dilambangkan oleh simbol ...',
        optionsFaseA: [
            { key: 'A', text: 'Bintang Emas' },
            { key: 'B', text: 'Rantai Emas' },
            { key: 'C', text: 'Padi dan Kapas' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Pohon Beringin' },
            { key: 'B', text: 'Kepala Banteng' },
            { key: 'C', text: 'Padi dan Kapas' },
            { key: 'D', text: 'Bintang Emas' }
        ],
        correctAnswer: 'C',
        explanation: 'Padi dan Kapas melambangkan sandang dan pangan pada Sila Kelima: Keadilan Sosial bagi Seluruh Rakyat Indonesia.',
        cognitiveLevel: 'LOTS',
        topic: 'Pengamalan Sila 5'
    },
    {
        visualType: 'traffic_sign',
        visualTitle: 'Perhatikan rambu lalu lintas berikut!',
        stimulus: 'Setiap warga negara wajib mematuhi aturan dan tata tertib di jalan raya demi keselamatan diri sendiri dan orang lain.',
        question: 'Arti dari rambu lalu lintas huruf P dengan garis silang merah pada gambar adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Boleh parkir bebas' },
            { key: 'B', text: 'Dilarang parkir di area sekitar rambu' },
            { key: 'C', text: 'Tempat istirahat kendaraan' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Boleh memarkir kendaraan secara bebas' },
            { key: 'B', text: 'Dilarang memarkir kendaraan di sekitar area rambu' },
            { key: 'C', text: 'Tempat khusus bagi pejalan kaki menyeberang' },
            { key: 'D', text: 'Pemberhentian sementara bagi angkutan umum' }
        ],
        correctAnswer: 'B',
        explanation: 'Rambu huruf P dicoret artinya dilarang parkir.',
        cognitiveLevel: 'LOTS',
        topic: 'Norma dan Aturan'
    },
    {
        stimulus: 'Sebagai seorang peserta didik di sekolah, Edo memiliki hak dan kewajiban yang harus dijalankan secara seimbang.',
        question: 'Contoh kewajiban utama seorang peserta didik saat berada di lingkungan sekolah adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Mendapatkan nilai ulangan yang bagus' },
            { key: 'B', text: 'Menjaga kebersihan dan mematuhi tata tertib sekolah' },
            { key: 'C', text: 'Menggunakan fasilitas perpustakaan sekolah' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Mendapatkan pengajaran dan bimbingan dari guru' },
            { key: 'B', text: 'Menjaga kebersihan ruang kelas dan mematuhi tata tertib sekolah' },
            { key: 'C', text: 'Meminjam buku pelajaran di perpustakaan' },
            { key: 'D', text: 'Bermain dengan leluasa di halaman saat jam istirahat' }
        ],
        correctAnswer: 'B',
        explanation: 'Kewajiban adalah hal yang wajib dikerjakan, seperti menjaga kebersihan dan menaati tata tertib sekolah.',
        cognitiveLevel: 'MOTS',
        topic: 'Hak dan Kewajiban'
    },
    {
        stimulus: 'Semboyan "Bhinneka Tunggal Ika" tertulis pada pita yang dicengkeram oleh burung Garuda Pancasila.',
        question: 'Makna yang terkandung dalam semboyan Bhinneka Tunggal Ika adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Bersatu kita teguh bercerai kita runtuh' },
            { key: 'B', text: 'Berbeda-beda tetapi tetap satu jua' },
            { key: 'C', text: 'Maju terus pantang mundur membela kebenaran' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Bersatu kita teguh, bercerai kita runtuh' },
            { key: 'B', text: 'Berbeda-beda tetapi pada hakikatnya tetap satu jua' },
            { key: 'C', text: 'Rela berkorban demi kepentingan golongan sendiri' },
            { key: 'D', text: 'Maju tak gentar membela yang bayar' }
        ],
        correctAnswer: 'B',
        explanation: 'Bhinneka Tunggal Ika bermakna berbeda-beda suku, agama, dan budaya, namun tetap satu bangsa Indonesia.',
        cognitiveLevel: 'LOTS',
        topic: 'Keberagaman Indonesia'
    }
];

// ==========================================
// 4. EXTENSIVE QUESTION BANKS (IPAS)
// ==========================================
const IPAS_PG_BANK: QuestionBankItemPG[] = [
    {
        visualType: 'plant_anatomy',
        visualTitle: 'Perhatikan gambar bagian-bagian tumbuhan di bawah ini!',
        stimulus: 'Tumbuhan hijau dapat membuat makanannya sendiri melalui proses fotosintesis.',
        question: 'Bagian tumbuhan yang bertanda nomor (2) adalah daun yang memiliki fungsi utama sebagai ...',
        optionsFaseA: [
            { key: 'A', text: 'Menyerap air dan garam mineral dari dalam tanah' },
            { key: 'B', text: 'Tempat berlangsungnya fotosintesis memasak makanan' },
            { key: 'C', text: 'Menopang tumbuhan agar tegak berdiri kokoh' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menyerap air dan unsur hara dari dalam tanah' },
            { key: 'B', text: 'Tempat terjadinya fotosintesis untuk menghasilkan makanan' },
            { key: 'C', text: 'Alat perkembangbiakan generatif tanaman' },
            { key: 'D', text: 'Menyalurkan hasil fotosintesis ke seluruh organ tumbuhan' }
        ],
        correctAnswer: 'B',
        explanation: 'Daun mengandung klorofil untuk menangkap cahaya matahari dan melangsungkan fotosintesis.',
        cognitiveLevel: 'LOTS',
        topic: 'Bagian Tumbuhan'
    },
    {
        visualType: 'food_chain',
        visualTitle: 'Perhatikan skema rantai makanan ekosistem sawah berikut!',
        stimulus: 'Di ekosistem sawah terdapat rantai makanan: Padi -> Belalang -> Katak -> Ular -> Elang.',
        question: 'Jika populasi katak menurun drastis karena ditangkapi pemburu, dampak langsung yang akan terjadi adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Populasi belalang meningkat pesat merusak padi' },
            { key: 'B', text: 'Tanaman padi tumbuh semakin lebat' },
            { key: 'C', text: 'Populasi ular sawah bertambah banyak' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Populasi belalang melonjak naik sehingga menjadi hama bagi padi' },
            { key: 'B', text: 'Populasi ular bertambah banyak karena katak berkurang' },
            { key: 'C', text: 'Tanaman padi semakin subur tanpa dimakan belalang' },
            { key: 'D', text: 'Keseimbangan rantai makanan tidak terganggu' }
        ],
        correctAnswer: 'A',
        explanation: 'Katak adalah predator belalang. Jika katak berkurang, populasi belalang akan meledak dan memakan padi.',
        cognitiveLevel: 'HOTS',
        topic: 'Rantai Makanan dan Ekosistem'
    },
    {
        visualType: 'water_cycle',
        visualTitle: 'Perhatikan diagram tahapan siklus air berikut!',
        stimulus: 'Air di bumi tidak pernah habis karena terus bersirkulasi dalam siklus hidrologi alam.',
        question: 'Proses penguapan air laut dan sungai menjadi uap air akibat panas matahari dinamakan proses ...',
        optionsFaseA: [
            { key: 'A', text: 'Evaporasi (Penguapan)' },
            { key: 'B', text: 'Kondensasi (Pengembunan)' },
            { key: 'C', text: 'Presipitasi (Hujan)' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Evaporasi (Penguapan air permukaan)' },
            { key: 'B', text: 'Kondensasi (Pembentukan awan dingin)' },
            { key: 'C', text: 'Presipitasi (Turunnya titik air hujan)' },
            { key: 'D', text: 'Infiltrasi (Penyerapan air ke dalam tanah)' }
        ],
        correctAnswer: 'A',
        explanation: 'Evaporasi adalah perubahan zat cair menjadi uap gas akibat pemanasan oleh energi matahari.',
        cognitiveLevel: 'MOTS',
        topic: 'Siklus Air'
    },
    {
        stimulus: 'Saat membuat es lilin, cairan sirup dimasukkan ke dalam kantong plastik lalu ditaruh di dalam freezer lemari pendingin hingga mengeras.',
        question: 'Perubahan wujud zat dari cair menjadi padat pada pembuatan es lilin tersebut dinamakan ...',
        optionsFaseA: [
            { key: 'A', text: 'Membeku' },
            { key: 'B', text: 'Mencair' },
            { key: 'C', text: 'Menguap' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Membeku' },
            { key: 'B', text: 'Mencair' },
            { key: 'C', text: 'Menguap' },
            { key: 'D', text: 'Menyublim' }
        ],
        correctAnswer: 'A',
        explanation: 'Membeku adalah perubahan wujud dari zat cair menjadi zat padat akibat pendinginan.',
        cognitiveLevel: 'LOTS',
        topic: 'Perubahan Wujud Benda'
    },
    {
        stimulus: 'Budi mengayuh sepedanya dengan kencang di jalanan menurun. Saat mendekati persimpangan, ia menarik tuas rem sehingga laju sepedanya melambat dan berhenti.',
        question: 'Gaya yang bekerja pada kampas rem sehingga sepeda dapat berhenti adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Gaya magnet' },
            { key: 'B', text: 'Gaya gesek' },
            { key: 'C', text: 'Gaya gravitasi' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Gaya magnet' },
            { key: 'B', text: 'Gaya gesek' },
            { key: 'C', text: 'Gaya gravitasi' },
            { key: 'D', text: 'Gaya pegas' }
        ],
        correctAnswer: 'B',
        explanation: 'Gesekan antara kampas rem dengan pelek roda menimbulkan gaya gesek yang memperlambat laju sepeda.',
        cognitiveLevel: 'MOTS',
        topic: 'Gaya dan Gerak'
    },
    {
        stimulus: 'Bunglon memiliki kemampuan mengubah warna kulitnya sesuai dengan lingkungan tempat ia berpijak untuk mengelabui musuhnya.',
        question: 'Kemampuan adaptasi penyamaran warna kulit pada hewan bunglon tersebut dinamakan ...',
        optionsFaseA: [
            { key: 'A', text: 'Kamuflase / Mimikri' },
            { key: 'B', text: 'Autotomi' },
            { key: 'C', text: 'Hibernasi' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Mimikri' },
            { key: 'B', text: 'Autotomi' },
            { key: 'C', text: 'Hibernasi' },
            { key: 'D', text: 'Ekolokasi' }
        ],
        correctAnswer: 'A',
        explanation: 'Mimikri adalah penyesuaian diri hewan dengan mengubah warna tubuh sesuai tempat berada.',
        cognitiveLevel: 'LOTS',
        topic: 'Adaptasi Makhluk Hidup'
    },
    {
        stimulus: 'Bumi berputar pada porosnya dari arah barat ke timur membutuhkan waktu sekitar 24 jam untuk satu kali putaran penuh.',
        question: 'Peristiwa alam yang terjadi akibat dari perputaran bumi pada porosnya (rotasi bumi) adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Pergantian musim kemarau dan hujan' },
            { key: 'B', text: 'Terjadinya siang dan malam' },
            { key: 'C', text: 'Perubahan lamanya waktu siang dan malam' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Pergantian empat musim di bumi' },
            { key: 'B', text: 'Terjadinya siang dan malam secara bergantian' },
            { key: 'C', text: 'Gerak semu tahunan matahari' },
            { key: 'D', text: 'Perubahan rasi bintang setiap bulan' }
        ],
        correctAnswer: 'B',
        explanation: 'Rotasi bumi pada porosnya menyebabkan pergantian siang dan malam serta gerak semu harian matahari.',
        cognitiveLevel: 'MOTS',
        topic: 'Bumi dan Alam Semesta'
    },
    {
        stimulus: 'Pak Danu adalah seorang pengrajin bambu yang membuat anyaman topi dan keranjang belanja untuk dijual ke pasar tradisional.',
        question: 'Dalam kegiatan ekonomi masyarakat, kegiatan yang dilakukan oleh Pak Danu termasuk ke dalam kegiatan ...',
        optionsFaseA: [
            { key: 'A', text: 'Konsumsi' },
            { key: 'B', text: 'Produksi' },
            { key: 'C', text: 'Distribusi' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Konsumsi' },
            { key: 'B', text: 'Produksi' },
            { key: 'C', text: 'Distribusi' },
            { key: 'D', text: 'Investasi' }
        ],
        correctAnswer: 'B',
        explanation: 'Produksi adalah kegiatan menghasilkan barang atau jasa untuk memenuhi kebutuhan manusia.',
        cognitiveLevel: 'LOTS',
        topic: 'Kegiatan Ekonomi'
    }
];

// ==========================================
// 5. EXTENSIVE QUESTION BANKS (ISIAN SINGKAT)
// ==========================================
const ISIAN_POOL_MATEMATIKA: QuestionBankItemIsian[] = [
    { question: 'Sudut yang ukuran besarnya tepat 90 derajat dinamakan sudut ...', correctAnswer: 'Siku-siku', cognitiveLevel: 'LOTS', topic: 'Sudut' },
    { question: 'Sudut yang besarnya lebih kecil dari 90 derajat dinamakan sudut ...', correctAnswer: 'Lancip', cognitiveLevel: 'LOTS', topic: 'Sudut' },
    { question: 'Sudut yang besarnya antara 90 derajat sampai 180 derajat dinamakan sudut ...', correctAnswer: 'Tumpul', cognitiveLevel: 'LOTS', topic: 'Sudut' },
    { question: 'Bangun datar yang memiliki 4 sisi sama panjang dan 4 sudut siku-siku adalah ...', correctAnswer: 'Persegi (Bujur sangkar)', cognitiveLevel: 'LOTS', topic: 'Bangun Datar' },
    { question: 'Sebuah persegi panjang memiliki panjang 15 cm dan lebar 8 cm. Luas persegi panjang tersebut adalah ... cm².', correctAnswer: '120', cognitiveLevel: 'MOTS', topic: 'Luas' },
    { question: 'Sebuah segitiga memiliki panjang alas 12 cm dan tinggi 10 cm. Luas segitiga tersebut adalah ... cm².', correctAnswer: '60', cognitiveLevel: 'MOTS', topic: 'Luas' },
    { question: 'Panjang rusuk kubus adalah 6 cm. Volume kubus tersebut adalah ... cm³.', correctAnswer: '216', cognitiveLevel: 'MOTS', topic: 'Volume' },
    { question: 'Bentuk pecahan paling sederhana dari 15/20 adalah ...', correctAnswer: '3/4', cognitiveLevel: 'LOTS', topic: 'Pecahan' },
    { question: 'Hasil dari operasi hitung 25 x 4 + 75 adalah ...', correctAnswer: '175', cognitiveLevel: 'MOTS', topic: 'Operasi Campuran' },
    { question: 'Faktor Persekutuan Terbesar (FPB) dari bilangan 18 dan 24 adalah ...', correctAnswer: '6', cognitiveLevel: 'HOTS', topic: 'KPK dan FPB' },
    { question: 'Kelipatan Persekutuan Terkecil (KPK) dari bilangan 6 dan 8 adalah ...', correctAnswer: '24', cognitiveLevel: 'HOTS', topic: 'KPK dan FPB' },
    { question: 'Bentuk desimal dari pecahan 3/5 adalah ...', correctAnswer: '0,6', cognitiveLevel: 'LOTS', topic: 'Desimal' },
    { question: 'Sebuah tali panjangnya 2 meter 50 centimeter. Panjang tali tersebut jika diubah ke satuan centimeter adalah ... cm.', correctAnswer: '250', cognitiveLevel: 'LOTS', topic: 'Satuan Panjang' },
    { question: 'Pak Budi membeli beras 3 kilogram. Berat beras tersebut setara dengan ... gram.', correctAnswer: '3.000', cognitiveLevel: 'LOTS', topic: 'Satuan Berat' },
    { question: 'Satu jam terdiri dari ... menit.', correctAnswer: '60', cognitiveLevel: 'LOTS', topic: 'Satuan Waktu' }
];

const ISIAN_POOL_INDO: QuestionBankItemIsian[] = [
    { question: 'Gagasan utama atau inti pembahasan yang menjiwai seluruh isi sebuah paragraf dinamakan ...', correctAnswer: 'Ide pokok (Gagasan utama)', cognitiveLevel: 'LOTS', topic: 'Ide Pokok' },
    { question: 'Paragraf yang kalimat utamanya terletak di bagian awal paragraf disebut paragraf ...', correctAnswer: 'Deduktif', cognitiveLevel: 'LOTS', topic: 'Jenis Paragraf' },
    { question: 'Paragraf yang kalimat utamanya terletak di bagian akhir paragraf disebut paragraf ...', correctAnswer: 'Induktif', cognitiveLevel: 'LOTS', topic: 'Jenis Paragraf' },
    { question: 'Kata tanya yang digunakan untuk menanyakan alasan atau sebab terjadinya suatu peristiwa adalah kata tanya ...', correctAnswer: 'Mengapa', cognitiveLevel: 'LOTS', topic: 'Kata Tanya' },
    { question: 'Kata tanya yang digunakan untuk menanyakan waktu terjadinya suatu peristiwa adalah kata tanya ...', correctAnswer: 'Kapan', cognitiveLevel: 'LOTS', topic: 'Kata Tanya' },
    { question: 'Kata tanya yang digunakan untuk menanyakan pelaku orang yang terlibat dalam suatu peristiwa adalah kata tanya ...', correctAnswer: 'Siapa', cognitiveLevel: 'LOTS', topic: 'Kata Tanya' },
    { question: 'Persamaan kata (arti yang bermakna sama) dalam bahasa Indonesia disebut dengan istilah ...', correctAnswer: 'Sinonim', cognitiveLevel: 'LOTS', topic: 'Kosakata' },
    { question: 'Lawan kata (arti yang berlawanan) dalam bahasa Indonesia disebut dengan istilah ...', correctAnswer: 'Antonim', cognitiveLevel: 'LOTS', topic: 'Kosakata' },
    { question: 'Pesan mendidik yang ingin disampaikan oleh pengarang kepada pembaca melalui sebuah cerita dinamakan ...', correctAnswer: 'Amanat (Pesan moral)', cognitiveLevel: 'MOTS', topic: 'Unsur Cerita' },
    { question: 'Gaya bahasa yang mengibaratkan benda mati dapat berperilaku seperti manusia hidup dinamakan majas ...', correctAnswer: 'Personifikasi', cognitiveLevel: 'MOTS', topic: 'Majas' },
    { question: 'Teks yang memuat penjelasan mengenai langkah-langkah atau tahapan dalam membuat/melakukan sesuatu secara berurutan dinamakan teks ...', correctAnswer: 'Prosedur (Petunjuk)', cognitiveLevel: 'LOTS', topic: 'Teks Prosedur' },
    { question: 'Tanda baca yang wajib diletakkan di akhir kalimat perintah atau seruan adalah tanda ...', correctAnswer: 'Seru (!)', cognitiveLevel: 'LOTS', topic: 'Tanda Baca' }
];

const ISIAN_POOL_PANCASILA: QuestionBankItemIsian[] = [
    { question: 'Dasar negara kesatuan Republik Indonesia adalah ...', correctAnswer: 'Pancasila', cognitiveLevel: 'LOTS', topic: 'Dasar Negara' },
    { question: 'Sila pertama Pancasila dilambangkan dengan simbol ...', correctAnswer: 'Bintang Emas', cognitiveLevel: 'LOTS', topic: 'Simbol Pancasila' },
    { question: 'Sila kedua Pancasila dilambangkan dengan simbol ...', correctAnswer: 'Rantai Emas', cognitiveLevel: 'LOTS', topic: 'Simbol Pancasila' },
    { question: 'Sila ketiga Pancasila dilambangkan dengan simbol ...', correctAnswer: 'Pohon Beringin', cognitiveLevel: 'LOTS', topic: 'Simbol Pancasila' },
    { question: 'Sila keempat Pancasila dilambangkan dengan simbol ...', correctAnswer: 'Kepala Banteng', cognitiveLevel: 'LOTS', topic: 'Simbol Pancasila' },
    { question: 'Sila kelima Pancasila dilambangkan dengan simbol ...', correctAnswer: 'Padi dan Kapas', cognitiveLevel: 'LOTS', topic: 'Simbol Pancasila' },
    { question: 'Kegiatan berunding bersama untuk mengambil keputusan yang disetujui bersama di kelas dinamakan ...', correctAnswer: 'Musyawarah untuk mufakat', cognitiveLevel: 'MOTS', topic: 'Musyawarah' },
    { question: 'Sikap saling menghormati dan menghargai perbedaan keyakinan dan suku bangsa disebut sikap ...', correctAnswer: 'Toleransi', cognitiveLevel: 'LOTS', topic: 'Toleransi' },
    { question: 'Bekerja bersama-sama tanpa pamrih untuk menyelesaikan pekerjaan umum demi kepentingan bersama dinamakan ...', correctAnswer: 'Gotong royong', cognitiveLevel: 'LOTS', topic: 'Gotong Royong' },
    { question: 'Sesuatu yang mutlak harus kita terima dan dapatkan sejak lahir disebut ...', correctAnswer: 'Hak', cognitiveLevel: 'LOTS', topic: 'Hak dan Kewajiban' },
    { question: 'Sesuatu yang wajib dilaksanakan dengan penuh tanggung jawab disebut ...', correctAnswer: 'Kewajiban', cognitiveLevel: 'LOTS', topic: 'Hak dan Kewajiban' },
    { question: 'Semboyan persatuan bangsa yang dicengkeram oleh burung Garuda Pancasila adalah ...', correctAnswer: 'Bhinneka Tunggal Ika', cognitiveLevel: 'LOTS', topic: 'Semboyan Bangsa' }
];

const ISIAN_POOL_IPAS: QuestionBankItemIsian[] = [
    { question: 'Bagian tumbuhan yang berfungsi menyerap air dan unsur hara dari dalam tanah adalah ...', correctAnswer: 'Akar', cognitiveLevel: 'LOTS', topic: 'Bagian Tumbuhan' },
    { question: 'Zat hijau daun pada tumbuhan yang berfungsi menangkap sinar matahari dinamakan ...', correctAnswer: 'Klorofil', cognitiveLevel: 'LOTS', topic: 'Fotosintesis' },
    { question: 'Proses memasak makanan pada tumbuhan hijau dengan bantuan cahaya matahari dinamakan ...', correctAnswer: 'Fotosintesis', cognitiveLevel: 'LOTS', topic: 'Fotosintesis' },
    { question: 'Peristiwa perubahan wujud zat dari cair menjadi padat dinamakan ...', correctAnswer: 'Membeku', cognitiveLevel: 'LOTS', topic: 'Wujud Zat' },
    { question: 'Peristiwa perubahan wujud zat dari padat menjadi cair dinamakan ...', correctAnswer: 'Mencair (Melebur)', cognitiveLevel: 'LOTS', topic: 'Wujud Zat' },
    { question: 'Peristiwa perubahan wujud zat dari cair menjadi gas/uap dinamakan ...', correctAnswer: 'Menguap', cognitiveLevel: 'LOTS', topic: 'Wujud Zat' },
    { question: 'Peristiwa perubahan wujud zat dari gas menjadi cair dinamakan ...', correctAnswer: 'Mengembun (Kondensasi)', cognitiveLevel: 'LOTS', topic: 'Wujud Zat' },
    { question: 'Hewan pemakan tumbuhan digolongkan ke dalam kelompok hewan ...', correctAnswer: 'Herbivora', cognitiveLevel: 'LOTS', topic: 'Penggolongan Hewan' },
    { question: 'Hewan pemakan daging digolongkan ke dalam kelompok hewan ...', correctAnswer: 'Karnivora', cognitiveLevel: 'LOTS', topic: 'Penggolongan Hewan' },
    { question: 'Hewan pemakan segala (tumbuhan dan hewan lain) digolongkan ke dalam kelompok hewan ...', correctAnswer: 'Omnivora', cognitiveLevel: 'LOTS', topic: 'Penggolongan Hewan' },
    { question: 'Gaya tarik bumi yang menyebabkan benda jatuh menuju pusat bumi dinamakan gaya ...', correctAnswer: 'Gravitasi', cognitiveLevel: 'LOTS', topic: 'Gaya' },
    { question: 'Perputaran bumi pada porosnya sendiri dinamakan peristiwa ...', correctAnswer: 'Rotasi bumi', cognitiveLevel: 'LOTS', topic: 'Tata Surya' }
];

// ==========================================
// 6. EXTENSIVE QUESTION BANKS (SOAL URAIAN)
// ==========================================
const URAIAN_POOL_MATEMATIKA: QuestionBankItemUraian[] = [
    {
        question: 'Pak Budi memiliki kebun sayur berbentuk persegi panjang dengan ukuran panjang 15 meter dan lebar 8 meter. Kebun tersebut akan dipasangi pagar kawat di sekelilingnya. Hitunglah keliling dan luas kebun sayur milik Pak Budi beserta langkah perhitungannya!',
        correctAnswer: 'Langkah Penyelesaian:\n1. Keliling = 2 x (Panjang + Lebar) = 2 x (15 + 8) = 2 x 23 = 46 meter.\n2. Luas = Panjang x Lebar = 15 m x 8 m = 120 m².\nJadi, panjang kawat pagar adalah 46 meter dan luas kebun adalah 120 m².',
        cognitiveLevel: 'HOTS',
        topic: 'Luas dan Keliling',
        rubric: {
            score3: 'Menuliskan rumus, langkah perhitungan keliling dan luas dengan benar, serta menyertakan satuan secara tepat.',
            score2: 'Perhitungan benar tetapi langkah atau salah satu satuan belum dituliskan secara lengkap.',
            score1: 'Hanya menuliskan rumus atau terdapat kesalahan hitung mendasar.',
            score0: 'Tidak ada jawaban atau jawaban salah sama sekali.'
        }
    },
    {
        question: 'Di perpustakaan sekolah terdapat 12 rak buku. Setiap rak berisi 45 eksemplar buku cerita. Jika sebanyak 80 buku dipinjam oleh siswa kelas 4 dan 5, berapa sisa buku yang masih ada di perpustakaan? Tuliskan kalimat matematika dan langkah penyelesaiannya!',
        correctAnswer: 'Langkah Penyelesaian:\n1. Total buku awal = 12 x 45 = 540 buku.\n2. Sisa buku setelah dipinjam = 540 - 80 = 460 buku.\nJadi, sisa buku yang masih ada di perpustakaan adalah 460 buku.',
        cognitiveLevel: 'HOTS',
        topic: 'Operasi Campuran',
        rubric: {
            score3: 'Menuliskan kalimat matematika dengan benar, menghitung perkalian dan pengurangan dengan teliti, dan menyertakan kesimpulan.',
            score2: 'Langkah perhitungan benar tetapi terdapat sedikit kekeliruan pengurangan akhir.',
            score1: 'Hanya menghitung salah satu operasi hitung.',
            score0: 'Jawaban salah atau tidak dijawab.'
        }
    },
    {
        question: 'Ibu memiliki 3 1/2 kg tepung terigu. Sebanyak 1 1/4 kg digunakan untuk membuat kue bolu dan 3/4 kg untuk membuat gorengan. Berapa kg sisa tepung terigu yang masih dimiliki Ibu? Tuliskan langkah penyelesaian pecahannya!',
        correctAnswer: 'Langkah Penyelesaian:\n1. Tepung yang digunakan = 1 1/4 + 3/4 = 2 kg.\n2. Sisa tepung = 3 1/2 - 2 = 1 1/2 kg.\nJadi, sisa tepung terigu yang masih dimiliki Ibu adalah 1 1/2 kg (atau 1,5 kg).',
        cognitiveLevel: 'HOTS',
        topic: 'Operasi Pecahan',
        rubric: {
            score3: 'Menyamakan penyebut pecahan dengan benar dan menyelesaikan pengurangan secara tepat beserta kesimpulan.',
            score2: 'Langkah benar namun salah menyederhanakan pecahan akhir.',
            score1: 'Konsep penjumlahan atau pengurangan pecahan keliru.',
            score0: 'Tidak menjawab.'
        }
    },
    {
        question: 'Siti ingin membuat kotak mainan berbentuk kubus dari bahan karton tebal dengan panjang rusuk 10 cm. Hitunglah luas permukaan karton yang dibutuhkan untuk membuat kotak kubus tersebut!',
        correctAnswer: 'Langkah Penyelesaian:\n1. Luas satu sisi persegi = s x s = 10 cm x 10 cm = 100 cm².\n2. Kubus memiliki 6 sisi yang sama luas.\n3. Luas permukaan kubus = 6 x s² = 6 x 100 cm² = 600 cm².\nJadi, luas karton yang dibutuhkan adalah 600 cm².',
        cognitiveLevel: 'HOTS',
        topic: 'Luas Permukaan Kubus',
        rubric: {
            score3: 'Memahami rumus luas permukaan kubus (6 x s²) dan menghitung secara benar hingga 600 cm².',
            score2: 'Perhitungan benar tetapi lupa mengalikan dengan 6 sisi kubus.',
            score1: 'Salah rumus luas.',
            score0: 'Tidak ada jawaban.'
        }
    },
    {
        question: 'Lampu merah menyala setiap 8 detik sekali, sedangkan lampu hijau menyala setiap 12 detik sekali. Jika kedua lampu menyala bersamaan pada detik ke-0, pada detik ke berapa kedua lampu tersebut akan menyala bersamaan untuk yang kedua kalinya? Jelaskan menggunakan konsep KPK!',
        correctAnswer: 'Langkah Penyelesaian:\n1. Kelipatan 8: 8, 16, 24, 32, 40...\n2. Kelipatan 12: 12, 24, 36, 48...\n3. KPK dari 8 dan 12 adalah 24.\nJadi, kedua lampu akan menyala bersamaan lagi pada detik ke-24.',
        cognitiveLevel: 'HOTS',
        topic: 'KPK',
        rubric: {
            score3: 'Menentukan faktor/kelipatan dengan benar dan menemukan KPK 24 secara sistematis.',
            score2: 'Menjawab 24 tetapi tanpa menyertakan langkah kelipatan.',
            score1: 'Salah menentukan KPK.',
            score0: 'Kosong.'
        }
    }
];

const URAIAN_POOL_INDO: QuestionBankItemUraian[] = [
    {
        question: 'Tuliskan dan jelaskan 3 ciri-ciri utama dari teks laporan hasil observasi yang membedakannya dengan teks cerita fiksi!',
        correctAnswer: 'Ciri-ciri teks laporan hasil observasi:\n1. Bersifat objektif dan faktual (ditulis berdasarkan fakta nyata hasil pengamatan langsung, bukan karangan/khayalan).\n2. Disusun secara sistematis (memiliki struktur jelas yaitu pernyataan umum, deskripsi bagian, dan deskripsi manfaat).\n3. Menggunakan bahasa baku dan ilmiah sesuai kaidah tata bahasa.',
        cognitiveLevel: 'HOTS',
        topic: 'Teks Laporan Observasi',
        rubric: {
            score3: 'Menjelaskan 3 ciri dengan tepat, runtut, dan menyertakan alasan perbedaan faktual dan fiksi.',
            score2: 'Menyebutkan 2 ciri dengan benar.',
            score1: 'Hanya menyebutkan 1 ciri atau penjelasan kurang tepat.',
            score0: 'Jawaban salah atau tidak menjawab.'
        }
    },
    {
        question: 'Jelaskan perbedaan antara kalimat fakta dan kalimat opini! Berikan masing-masing 1 contoh kalimat nyata yang sering ditemukan dalam kehidupan sehari-hari!',
        correctAnswer: 'Perbedaan Fakta dan Opini:\n1. Kalimat Fakta adalah kalimat yang berisi kenyataan yang benar-benar terjadi dan dapat dibuktikan kebenarannya. Contoh: "Matahari terbit dari sebelah timur."\n2. Kalimat Opini adalah kalimat yang berisi pendapat, pandangan, atau perasaan pribadi seseorang yang kebenarannya masih relatif. Contoh: "Bunga mawar merah adalah bunga yang paling indah di dunia."',
        cognitiveLevel: 'HOTS',
        topic: 'Fakta dan Opini',
        rubric: {
            score3: 'Mendefinisikan kedua konsep secara tepat dan memberikan contoh kalimat fakta dan opini yang sangat relevan.',
            score2: 'Definisi tepat tetapi contoh tertukar atau kurang tepat.',
            score1: 'Hanya menjelaskan salah satu konsep.',
            score0: 'Tidak ada jawaban.'
        }
    },
    {
        question: 'Mengapa dalam sebuah teks petunjuk (prosedur) kita harus menuliskan urutan langkah secara sistematis dan jelas? Apa akibatnya jika langkah-langkah tersebut ditulis secara acak?',
        correctAnswer: 'Penjelasan:\n1. Langkah harus sistematis agar pembaca dapat mempraktikkan atau membuat sesuatu dengan benar, aman, dan berhasil sesuai tujuan.\n2. Akibat jika acak: Pembaca akan bingung, terjadi kegagalan dalam proses pembuatan, atau bahkan dapat membahayakan keselamatan (misalnya pada petunjuk penggunaan alat elektronik atau obat).',
        cognitiveLevel: 'HOTS',
        topic: 'Teks Prosedur',
        rubric: {
            score3: 'Memberikan alasan fungsi teks prosedur dan menganalisis dampak negatif jika langkah acak secara mendalam.',
            score2: 'Penjelasan benar tetapi analisis dampak masih singkat.',
            score1: 'Penjelasan kurang relevan.',
            score0: 'Tidak dijawab.'
        }
    },
    {
        question: 'Buatlah sebuah paragraf pendek (minimal 4 kalimat) bertema "Pentingnya Menjaga Kebersihan Kelas" yang memuat kalimat utama deduktif di awal paragraf dan kalimat penjelas yang padu!',
        correctAnswer: 'Contoh Paragraf:\n"Menjaga kebersihan ruang kelas merupakan tanggung jawab bersama seluruh warga sekolah. Ruang kelas yang bersih dan rapi membuat suasana belajar menjadi nyaman dan menyenangkan. Selain itu, ruangan yang bebas dari sampah dan debu akan menghindarkan kita dari berbagai sumber penyakit. Oleh karena itu, seluruh siswa harus disiplin menjalankan piket harian."',
        cognitiveLevel: 'HOTS',
        topic: 'Menulis Paragraf',
        rubric: {
            score3: 'Paragraf memenuhi minimal 4 kalimat, kalimat utama deduktif jelas di awal, kalimat penjelas saling padu dan menggunakan ejaan baku.',
            score2: 'Paragraf padu tetapi kalimat utama kurang jelas atau ejaan kurang rapi.',
            score1: 'Kalimat tidak padu atau kurang dari 3 kalimat.',
            score0: 'Kosong.'
        }
    }
];

const URAIAN_POOL_PANCASILA: QuestionBankItemUraian[] = [
    {
        question: 'Jelaskan 3 (tiga) contoh perilaku nyata yang mencerminkan pengamalan sila kedua Pancasila ("Kemanusiaan yang adil dan beradab") dalam kehidupan di sekolah sehari-hari!',
        correctAnswer: 'Contoh perilaku nyata sila kedua di sekolah:\n1. Menolong teman yang terjatuh atau tertimpa musibah tanpa membeda-bedakan status sosialnya.\n2. Bersikap santun, menghargai sesama teman, dan tidak melakukan ejekan atau perundungan (anti-bullying).\n3. Meminjamkan alat tulis atau berbagi makanan dengan teman yang membutuhkan.',
        cognitiveLevel: 'HOTS',
        topic: 'Pengamalan Sila 2',
        rubric: {
            score3: 'Menuliskan 3 contoh konkret, aplikatif, dan sesuai dengan esensi nilai kemanusiaan dan empati di sekolah.',
            score2: 'Menuliskan 2 contoh yang tepat.',
            score1: 'Hanya menuliskan 1 contoh.',
            score0: 'Tidak ada jawaban.'
        }
    },
    {
        question: 'Mengapa musyawarah sangat penting dalam mengambil keputusan bersama di kelas? Jelaskan apa yang harus kita lakukan jika pendapat pribadi kita tidak disetujui dalam musyawarah!',
        correctAnswer: 'Penjelasan:\n1. Musyawarah penting agar keputusan yang diambil adil, mewakili kepentingan bersama, dan dapat dijalankan dengan penuh kesadaran tanpa paksaan.\n2. Sikap jika pendapat tidak disetujui: Kita harus berjiwa besar, berlapang dada, menghormati hasil musyawarah, dan tetap berkomitmen menjalankan keputusan bersama dengan sebaik-baiknya.',
        cognitiveLevel: 'HOTS',
        topic: 'Musyawarah Mufakat',
        rubric: {
            score3: 'Menjelaskan tujuan musyawarah dan sikap berjiwa besar/tanggung jawab secara lengkap dan mendalam.',
            score2: 'Menjelaskan musyawarah dengan baik namun sikap terhadap perbedaan pendapat kurang tuntas.',
            score1: 'Penjelasan sangat singkat.',
            score0: 'Tidak ada jawaban.'
        }
    },
    {
        question: 'Indonesia memiliki keragaman suku, bahasa daerah, dan budaya yang sangat kaya. Jelaskan 2 manfaat keragaman budaya tersebut bagi bangsa Indonesia, serta bagaimana cara kita menjaga persatuan di tengah perbedaan tersebut!',
        correctAnswer: 'Penjelasan:\n1. Manfaat keberagaman: Memperkaya kebudayaan nasional, menjadi daya tarik pariwisata dunia, dan memupuk rasa bangga sebagai bangsa yang majemuk.\n2. Cara menjaga persatuan: Menumbuhkan sikap toleransi, tidak memandang rendah budaya daerah lain, menggunakan bahasa Indonesia sebagai bahasa pemersatu, dan membiasakan gotong royong.',
        cognitiveLevel: 'HOTS',
        topic: 'Keberagaman Bangsa',
        rubric: {
            score3: 'Menyebutkan manfaat keragaman dan cara menjaga persatuan dengan bahasa yang runtut dan jelas.',
            score2: 'Penjelasan benar namun hanya menyebutkan salah satu aspek.',
            score1: 'Jawaban kurang tepat.',
            score0: 'Kosong.'
        }
    }
];

const URAIAN_POOL_IPAS: QuestionBankItemUraian[] = [
    {
        question: 'Jelaskan proses terjadinya fotosintesis pada tumbuhan hijau! Tuliskan bahan-bahan apa saja yang dibutuhkan dan hasil apa saja yang dikeluarkan dalam proses tersebut!',
        correctAnswer: 'Penjelasan Fotosintesis:\n1. Bahan yang dibutuhkan: Air (diserap akar dari dalam tanah), Gas Karbondioksida / CO2 (diserap daun dari udara), dan Cahaya Matahari (ditangkap oleh klorofil).\n2. Proses: Di dalam daun, klorofil menggunakan energi cahaya untuk mereaksikan air dan karbondioksida.\n3. Hasil fotosintesis: Glukosa/karbohidrat (sebagai sumber makanan tumbuhan) dan Gas Oksigen / O2 (dilepaskan ke udara untuk pernapasan manusia dan hewan).',
        cognitiveLevel: 'HOTS',
        topic: 'Fotosintesis',
        rubric: {
            score3: 'Menjelaskan bahan baku, proses klorofil, dan hasil fotosintesis (glukosa dan oksigen) secara lengkap dan tepat.',
            score2: 'Bahan dan hasil benar tetapi penjelasan proses kurang detail.',
            score1: 'Hanya menyebutkan sebagian bahan fotosintesis.',
            score0: 'Salah atau tidak dijawab.'
        }
    },
    {
        question: 'Di sebuah ekosistem sawah terjadi penurunan drastis populasi ular sawah karena ditangkapi secara liar oleh manusia. Jelaskan dampak berantai yang akan terjadi terhadap populasi tikus dan hasil panen padi milik petani!',
        correctAnswer: 'Dampak Berantai:\n1. Ular sawah berperan sebagai predator alami bagi hama tikus sawah.\n2. Jika ular berkurang drastis, populasi tikus akan berkembang biak dengan sangat cepat tanpa ada pemangsa alami (terjadi ledakan populasi tikus).\n3. Akibatnya, gerombolan tikus akan memakan batang dan bulir padi petani sehingga menyebabkan gagal panen dan kerugian besar bagi para petani.',
        cognitiveLevel: 'HOTS',
        topic: 'Keseimbangan Ekosistem',
        rubric: {
            score3: 'Menjelaskan hubungan predator-mangsa dan dampak ekologis hingga menyebabkan gagal panen secara logis dan runtut.',
            score2: 'Menyebutkan tikus bertambah dan padi rusak tetapi tidak menjelaskan peran predator ular.',
            score1: 'Hanya menyebutkan padi gagal panen.',
            score0: 'Tidak ada jawaban.'
        }
    },
    {
        question: 'Jelaskan tahapan siklus air (daur hidrologi) mulai dari penguapan air di permukaan bumi hingga terjadinya hujan! Mengapa air di bumi tidak pernah habis meskipun digunakan setiap hari?',
        correctAnswer: 'Tahapan Siklus Air:\n1. Evaporasi: Panas matahari menguapkan air dari laut, danau, dan sungai ke atmosfer.\n2. Kondensasi: Uap air yang naik ke udara dingin mengalami pengembunan membentuk awan.\n3. Presipitasi: Butiran air awan yang sudah jenuh dan berat jatuh ke bumi sebagai hujan.\n4. Infiltrasi: Sebagian air hujan meresap ke dalam tanah dan sebagian mengalir kembali ke sungai dan laut.\nAlasan tidak habis: Karena air mengalami daur atau siklus yang terus berputar secara alami dan berkesinambungan.',
        cognitiveLevel: 'HOTS',
        topic: 'Siklus Air',
        rubric: {
            score3: 'Menjelaskan tahapan evaporasi, kondensasi, presipitasi, infiltrasi secara sistematis dan menjawab alasan kelestarian air.',
            score2: 'Menyebutkan tahapan siklus air tetapi melewatkan istilah ilmiahnya.',
            score1: 'Penjelasan siklus air kurang tepat.',
            score0: 'Kosong.'
        }
    }
];

// Helper to pick bank based on subject
function getPgBankForSubject(subject: string): QuestionBankItemPG[] {
    const s = subject.toLowerCase();
    if (s.includes('matematika') || s.includes('hitung') || s.includes('angka')) return MATH_PG_BANK;
    if (s.includes('pancasila') || s.includes('ppkn') || s.includes('kewarganegaraan')) return PANCASILA_PG_BANK;
    if (s.includes('ipas') || s.includes('alam') || s.includes('sosial') || s.includes('ipa') || s.includes('ips')) return IPAS_PG_BANK;
    return INDO_PG_BANK;
}

function getIsianBankForSubject(subject: string): QuestionBankItemIsian[] {
    const s = subject.toLowerCase();
    if (s.includes('matematika') || s.includes('hitung') || s.includes('angka')) return ISIAN_POOL_MATEMATIKA;
    if (s.includes('pancasila') || s.includes('ppkn') || s.includes('kewarganegaraan')) return ISIAN_POOL_PANCASILA;
    if (s.includes('ipas') || s.includes('alam') || s.includes('sosial') || s.includes('ipa') || s.includes('ips')) return ISIAN_POOL_IPAS;
    return ISIAN_POOL_INDO;
}

function getUraianBankForSubject(subject: string): QuestionBankItemUraian[] {
    const s = subject.toLowerCase();
    if (s.includes('matematika') || s.includes('hitung') || s.includes('angka')) return URAIAN_POOL_MATEMATIKA;
    if (s.includes('pancasila') || s.includes('ppkn') || s.includes('kewarganegaraan')) return URAIAN_POOL_PANCASILA;
    if (s.includes('ipas') || s.includes('alam') || s.includes('sosial') || s.includes('ipa') || s.includes('ips')) return URAIAN_POOL_IPAS;
    return URAIAN_POOL_INDO;
}

// Generate parameterized variant for math when bank is exhausted
function createDynamicMathVariant(index: number, _isFaseA: boolean): QuestionBankItemPG {
    const cycle = Math.floor((index - 1) / 8);
    const mode = (index - 1) % 8;

    const namesA = ['Andi', 'Siti', 'Edo', 'Lani', 'Beni', 'Rina'];
    const namesB = ['Budi', 'Dayu', 'Udin', 'Tono', 'Dewi', 'Fajar'];
    const n1 = namesA[cycle % namesA.length];
    const n2 = namesB[(cycle + 1) % namesB.length];

    if (mode === 0) {
        const items = ['kelereng', 'stiker', 'kartu bergambar', 'biji congklak', 'batu hias'];
        const itemObj = items[cycle % items.length];
        const num1 = 14 + (index * 7);
        const num2 = 18 + (index * 5);
        const sum = num1 + num2;
        return {
            stimulus: `${n1} memiliki ${num1} buah ${itemObj} dan ${n2} memiliki ${num2} buah ${itemObj}. Mereka menggabungkan semua ${itemObj} tersebut ke dalam satu kotak.`,
            question: `Berapakah jumlah keseluruhan ${itemObj} milik ${n1} (${num1} buah) dan ${n2} (${num2} buah) setelah digabungkan?`,
            optionsFaseA: [
                { key: 'A', text: `${sum - 2} buah` },
                { key: 'B', text: `${sum} buah` },
                { key: 'C', text: `${sum + 4} buah` }
            ],
            optionsFaseBC: [
                { key: 'A', text: `${sum - 3} buah` },
                { key: 'B', text: `${sum} buah` },
                { key: 'C', text: `${sum + 2} buah` },
                { key: 'D', text: `${sum + 5} buah` }
            ],
            correctAnswer: 'B',
            explanation: `Perhitungan penjumlahan: ${num1} + ${num2} = ${sum} buah ${itemObj}.`,
            cognitiveLevel: 'LOTS',
            topic: 'Operasi Penjumlahan'
        };
    } else if (mode === 1) {
        const containers = ['kotak pensil', 'kantong jeruk', 'rak buku', 'bungkus permen', 'dus roti'];
        const contents = ['batang pensil warna', 'buah jeruk manis', 'eksemplar buku cerita', 'butir permen rasa buah', 'potong roti cokelat'];
        const units = ['batang', 'buah', 'eksemplar', 'butir', 'potong'];
        const pick = cycle % containers.length;
        const factor1 = 4 + index;
        const perBox = 6 + (cycle % 4);
        const prod = factor1 * perBox;
        return {
            stimulus: `Di koperasi sekolah tersedia ${factor1} ${containers[pick]}. Setiap ${containers[pick].split(' ')[0]} berisi ${perBox} ${contents[pick]}.`,
            question: `Jika seluruh isi ${factor1} ${containers[pick]} (@${perBox} ${units[pick]}) digabungkan, banyaknya ${contents[pick]} seluruhnya adalah ...`,
            optionsFaseA: [
                { key: 'A', text: `${prod - 3} ${units[pick]}` },
                { key: 'B', text: `${prod} ${units[pick]}` },
                { key: 'C', text: `${prod + 6} ${units[pick]}` }
            ],
            optionsFaseBC: [
                { key: 'A', text: `${prod - perBox} ${units[pick]}` },
                { key: 'B', text: `${prod} ${units[pick]}` },
                { key: 'C', text: `${prod + 4} ${units[pick]}` },
                { key: 'D', text: `${prod + perBox} ${units[pick]}` }
            ],
            correctAnswer: 'B',
            explanation: `Perhitungan perkalian: ${factor1} x ${perBox} = ${prod} ${units[pick]}.`,
            cognitiveLevel: 'MOTS',
            topic: 'Operasi Perkalian'
        };
    } else if (mode === 2) {
        const objects = ['ubin keramik', 'kertas origami', 'papan catur mini', 'bingkai foto', 'saputangan kain'];
        const sqObj = objects[cycle % objects.length];
        const side = 5 + index;
        const area = side * side;
        return {
            stimulus: `Sebuah ${sqObj} berbentuk persegi memiliki panjang setiap sisi tepat ${side} cm.`,
            question: `Berapakah luas permukaan ${sqObj} berbentuk persegi dengan ukuran sisi ${side} cm tersebut?`,
            optionsFaseA: [
                { key: 'A', text: `${side * 2} cm²` },
                { key: 'B', text: `${area} cm²` },
                { key: 'C', text: `${area + 5} cm²` }
            ],
            optionsFaseBC: [
                { key: 'A', text: `${side * 4} cm²` },
                { key: 'B', text: `${area} cm²` },
                { key: 'C', text: `${area + 6} cm²` },
                { key: 'D', text: `${area + 10} cm²` }
            ],
            correctAnswer: 'B',
            explanation: `Luas persegi = sisi x sisi = ${side} x ${side} = ${area} cm².`,
            cognitiveLevel: 'MOTS',
            topic: 'Luas Persegi'
        };
    } else if (mode === 3) {
        const places = ['taman bunga', 'lapangan voli', 'kebun sekolah', 'kolam ikan', 'halaman kelas'];
        const rectObj = places[cycle % places.length];
        const p = 10 + index * 2;
        const l = 5 + cycle;
        const kel = 2 * (p + l);
        return {
            stimulus: `Sekolah memiliki ${rectObj} berbentuk persegi panjang berukuran panjang ${p} meter dan lebar ${l} meter.`,
            question: `Keliling ${rectObj} berukuran ${p} m x ${l} m tersebut adalah ...`,
            optionsFaseA: [
                { key: 'A', text: `${p + l} meter` },
                { key: 'B', text: `${kel} meter` },
                { key: 'C', text: `${kel + 8} meter` }
            ],
            optionsFaseBC: [
                { key: 'A', text: `${p + l} meter` },
                { key: 'B', text: `${kel - 4} meter` },
                { key: 'C', text: `${kel} meter` },
                { key: 'D', text: `${p * l} meter` }
            ],
            correctAnswer: 'C',
            explanation: `Keliling persegi panjang = 2 x (p + l) = 2 x (${p} + ${l}) = ${kel} meter.`,
            cognitiveLevel: 'MOTS',
            topic: 'Keliling Bangun Datar'
        };
    } else if (mode === 4) {
        const fruits = ['buah mangga', 'buah apel', 'kue bolu', 'buku tulis', 'buah jeruk'];
        const obj = fruits[cycle % fruits.length];
        const divisor = 4 + (cycle % 5);
        const perChild = 7 + index;
        const total = divisor * perChild;
        return {
            stimulus: `${n1} menyiapkan ${total} ${obj} untuk dibagikan sama rata kepada ${divisor} orang temannya saat kerja kelompok.`,
            question: `Jika ${total} ${obj} dibagikan sama rata kepada ${divisor} anak, berapa banyak yang diterima masing-masing anak?`,
            optionsFaseA: [
                { key: 'A', text: `${perChild - 2}` },
                { key: 'B', text: `${perChild}` },
                { key: 'C', text: `${perChild + 3}` }
            ],
            optionsFaseBC: [
                { key: 'A', text: `${perChild - 2}` },
                { key: 'B', text: `${perChild}` },
                { key: 'C', text: `${perChild + 2}` },
                { key: 'D', text: `${perChild + 4}` }
            ],
            correctAnswer: 'B',
            explanation: `Pembagian sama rata: ${total} : ${divisor} = ${perChild}.`,
            cognitiveLevel: 'LOTS',
            topic: 'Operasi Pembagian'
        };
    } else if (mode === 5) {
        const startVal = 85 + (index * 9);
        const usedVal = 27 + (cycle * 6);
        const rem = startVal - usedVal;
        return {
            stimulus: `${n2} memiliki persediaan ${startVal} lembar kertas warna. Sebanyak ${usedVal} lembar digunakan untuk membuat kerajinan kelas.`,
            question: `Berapa lembar sisa kertas warna milik ${n2} dari persediaan awal ${startVal} lembar setelah terpakai ${usedVal} lembar?`,
            optionsFaseA: [
                { key: 'A', text: `${rem - 4} lembar` },
                { key: 'B', text: `${rem} lembar` },
                { key: 'C', text: `${rem + 5} lembar` }
            ],
            optionsFaseBC: [
                { key: 'A', text: `${rem - 5} lembar` },
                { key: 'B', text: `${rem} lembar` },
                { key: 'C', text: `${rem + 3} lembar` },
                { key: 'D', text: `${rem + 8} lembar` }
            ],
            correctAnswer: 'B',
            explanation: `Sisa kertas warna = ${startVal} - ${usedVal} = ${rem} lembar.`,
            cognitiveLevel: 'LOTS',
            topic: 'Operasi Pengurangan'
        };
    } else if (mode === 6) {
        const hours = 2 + (cycle % 4);
        const extraMins = 10 + ((index * 5) % 45);
        const totalMins = hours * 60 + extraMins;
        return {
            stimulus: `${n1} berlatih membaca puisi dan matematika selama ${hours} jam ${extraMins} menit tanpa henti.`,
            question: `Jika dikonversi ke dalam satuan menit, durasi latihan selama ${hours} jam ${extraMins} menit sama dengan ...`,
            optionsFaseA: [
                { key: 'A', text: `${totalMins - 20} menit` },
                { key: 'B', text: `${totalMins} menit` },
                { key: 'C', text: `${totalMins + 30} menit` }
            ],
            optionsFaseBC: [
                { key: 'A', text: `${totalMins - 30} menit` },
                { key: 'B', text: `${totalMins} menit` },
                { key: 'C', text: `${totalMins + 15} menit` },
                { key: 'D', text: `${totalMins + 40} menit` }
            ],
            correctAnswer: 'B',
            explanation: `${hours} jam = ${hours} x 60 = ${hours * 60} menit. Total = ${hours * 60} + ${extraMins} = ${totalMins} menit.`,
            cognitiveLevel: 'MOTS',
            topic: 'Konversi Satuan Waktu'
        };
    } else {
        const cubes = ['kotak mainan', 'akuarium mini', 'kardus kado', 'bak air kubus', 'wadah pensil kubus'];
        const cubeObj = cubes[cycle % cubes.length];
        const edge = 4 + (index % 7) + cycle;
        const vol = edge * edge * edge;
        return {
            stimulus: `Sebuah ${cubeObj} berbentuk kubus sempurna memiliki panjang rusuk ${edge} cm.`,
            question: `Berapakah volume ${cubeObj} berbentuk kubus yang memiliki panjang rusuk ${edge} cm tersebut?`,
            optionsFaseA: [
                { key: 'A', text: `${edge * edge} cm³` },
                { key: 'B', text: `${vol} cm³` },
                { key: 'C', text: `${vol + 12} cm³` }
            ],
            optionsFaseBC: [
                { key: 'A', text: `${edge * edge * 6} cm³` },
                { key: 'B', text: `${vol - 10} cm³` },
                { key: 'C', text: `${vol} cm³` },
                { key: 'D', text: `${vol + 16} cm³` }
            ],
            correctAnswer: 'C',
            explanation: `Volume kubus = r x r x r = ${edge} x ${edge} x ${edge} = ${vol} cm³.`,
            cognitiveLevel: 'HOTS',
            topic: 'Volume Kubus'
        };
    }
}

// Generate parameterized variant for Indonesian when bank is exhausted
function createDynamicIndoVariant(index: number, isFaseA: boolean): QuestionBankItemPG {
    const variants: QuestionBankItemPG[] = [
        {
            stimulus: 'Dalam teks laporan observasi terdapat kalimat: "Para peneliti menciptakan teknologi inovasi pengolahan limbah plastik."',
            question: 'Makna kata "inovasi" pada kalimat di atas adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Barang tiruan yang sudah usang' },
                { key: 'B', text: 'Penemuan atau pembaharuan gagasan baru' },
                { key: 'C', text: 'Kerusakan lingkungan yang parah' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Barang tiruan yang sudah usang' },
                { key: 'B', text: 'Penemuan baru atau pembaharuan gagasan' },
                { key: 'C', text: 'Kerusakan lingkungan alam' },
                { key: 'D', text: 'Pencemaran udara dan air' }
            ],
            correctAnswer: 'B',
            explanation: 'Inovasi bermakna penemuan atau pembaharuan ide baru yang bermanfaat.',
            cognitiveLevel: 'MOTS',
            topic: 'Kosakata Baku'
        },
        {
            stimulus: 'Bacalah kalimat berikut: "Siti adalah anak yang sangat rajin belajar, sedangkan adiknya bersikap sebaliknya."',
            question: 'Lawan kata (antonim) yang tepat dari kata "rajin" pada kalimat tersebut adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Pandai' },
                { key: 'B', text: 'Malas' },
                { key: 'C', text: 'Cepat' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Pandai' },
                { key: 'B', text: 'Malas' },
                { key: 'C', text: 'Cepat' },
                { key: 'D', text: 'Teliti' }
            ],
            correctAnswer: 'B',
            explanation: 'Lawan kata dari rajin adalah malas.',
            cognitiveLevel: 'LOTS',
            topic: 'Antonim'
        },
        {
            stimulus: 'Perhatikan kalimat berikut: "Budi dikenal sebagai anak yang ringan tangan di kelasnya karena sering membantu teman."',
            question: 'Arti dari ungkapan "ringan tangan" pada kalimat tersebut adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Suka berkelahi dan memukul' },
                { key: 'B', text: 'Suka menolong sesama yang membutuhkan' },
                { key: 'C', text: 'Suka mengambil barang milik orang lain' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Suka memukul dan berkelahi' },
                { key: 'B', text: 'Suka menolong sesama dengan ikhlas' },
                { key: 'C', text: 'Suka mencuri barang teman' },
                { key: 'D', text: 'Tidak mau mengerjakan tugas' }
            ],
            correctAnswer: 'B',
            explanation: 'Ungkapan ringan tangan bermakna suka membantu atau menolong orang lain.',
            cognitiveLevel: 'MOTS',
            topic: 'Ungkapan / Idiom'
        },
        {
            stimulus: 'Perhatikan kalimat rumpang berikut: "[ ... ] yang menjadi ketua kelompok dalam kegiatan drama pentas seni sekolah?"',
            question: 'Untuk menanyakan orang atau pelaku pada kalimat rumpang tersebut, kata tanya yang paling tepat digunakan adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Kapan' },
                { key: 'B', text: 'Siapa' },
                { key: 'C', text: 'Berapa' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Kapan' },
                { key: 'B', text: 'Siapa' },
                { key: 'C', text: 'Berapa' },
                { key: 'D', text: 'Mengapa' }
            ],
            correctAnswer: 'B',
            explanation: 'Kata tanya "Siapa" digunakan untuk menanyakan orang atau pelaku.',
            cognitiveLevel: 'LOTS',
            topic: 'Kata Tanya'
        },
        {
            stimulus: 'Perhatikan kalimat berikut: "Setiap hari minggu pagi andi bersepeda keliling kota bandung."',
            question: 'Perbaikan penggunaan huruf kapital yang benar pada kalimat di atas adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Setiap hari Minggu pagi Andi bersepeda keliling kota Bandung.' },
                { key: 'B', text: 'Setiap hari minggu pagi andi Bersepeda keliling Kota bandung.' },
                { key: 'C', text: 'Setiap Hari Minggu Pagi Andi bersepeda keliling kota Bandung.' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Setiap hari Minggu pagi Andi bersepeda keliling kota Bandung.' },
                { key: 'B', text: 'setiap hari minggu pagi Andi bersepeda keliling kota Bandung.' },
                { key: 'C', text: 'Setiap hari minggu pagi andi Bersepeda keliling Kota bandung.' },
                { key: 'D', text: 'Setiap Hari Minggu Pagi Andi bersepeda keliling Kota Bandung.' }
            ],
            correctAnswer: 'A',
            explanation: 'Huruf kapital dipakai pada awal kalimat, nama hari (Minggu), nama orang (Andi), dan nama kota geografis (Bandung).',
            cognitiveLevel: 'MOTS',
            topic: 'Ejaan dan Huruf Kapital'
        },
        {
            stimulus: 'Bacalah teks berikut: "1) Hari ini cuaca di luar ruangan tampak sangat panas. 2) Suhu udara terukur mencapai 33 derajat Celsius pada alat termometer."',
            question: 'Berdasarkan kutipan teks di atas, kalimat nomor 2 merupakan jenis kalimat ...',
            optionsFaseA: [
                { key: 'A', text: 'Kalimat Opini (pendapat)' },
                { key: 'B', text: 'Kalimat Fakta (kenyataan terbukti)' },
                { key: 'C', text: 'Kalimat Perintah' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Kalimat Opini' },
                { key: 'B', text: 'Kalimat Fakta' },
                { key: 'C', text: 'Kalimat Perintah' },
                { key: 'D', text: 'Kalimat Ajakan' }
            ],
            correctAnswer: 'B',
            explanation: 'Kalimat nomor 2 merupakan fakta karena memuat data angka yang dapat diukur dan dibuktikan dengan termometer.',
            cognitiveLevel: 'MOTS',
            topic: 'Fakta dan Opini'
        },
        {
            stimulus: 'Bacalah kutipan fabel berikut: "Kura-kura terus berjalan dengan sabar dan langkah perlahan tanpa pernah berhenti, hingga akhirnya berhasil mencapai garis finis mendahului Kelinci yang sombong tertidur di bawah pohon."',
            question: 'Pesan moral utama yang dapat dipetik dari fabel tersebut adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Kesabaran dan keuletan dapat mengalahkan kesombongan' },
                { key: 'B', text: 'Tidurlah jika merasa diri kita sudah paling pintar' },
                { key: 'C', text: 'Berjalan cepat selalu lebih baik daripada berjalan lambat' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Kesabaran dan ketekunan yang konsisten dapat mengalahkan sikap sombong' },
                { key: 'B', text: 'Beristirahatlah saat lomba sedang berlangsung' },
                { key: 'C', text: 'Jangan pernah menolong hewan yang berjalan lambat' },
                { key: 'D', text: 'Kemenangan hanya milik hewan yang bertubuh besar' }
            ],
            correctAnswer: 'A',
            explanation: 'Kisah kura-kura dan kelinci mengajarkan nilai ketekunan yang mengalahkan kesombongan.',
            cognitiveLevel: 'HOTS',
            topic: 'Amanat Fabel'
        },
        {
            stimulus: 'Perhatikan kalimat rumpang berikut: "Ibu guru meminta Dayu untuk [ ... ] sebuah puisi tentang keindahan alam."',
            question: 'Kata berimbuhan yang paling tepat untuk melengkapi kalimat di atas adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Membacakan' },
                { key: 'B', text: 'Membaca-baca' },
                { key: 'C', text: 'Terbaca' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Membacakan' },
                { key: 'B', text: 'Membaca-baca' },
                { key: 'C', text: 'Terbaca' },
                { key: 'D', text: 'Pembacaan' }
            ],
            correctAnswer: 'A',
            explanation: 'Kata berimbuhan yang tepat secara semantik adalah "membacakan".',
            cognitiveLevel: 'LOTS',
            topic: 'Imbuhan'
        },
        {
            stimulus: 'Perhatikan kutipan dialog berikut: "Ibu berkata: [ ... ] Tolong ambilkan piring di dapur, Nak! [ ... ]"',
            question: 'Tanda baca yang tepat untuk mengapit kalimat langsung yang diucapkan Ibu adalah tanda ...',
            optionsFaseA: [
                { key: 'A', text: 'Tanda Petik ("...")' },
                { key: 'B', text: 'Tanda Kurung ((...))' },
                { key: 'C', text: 'Tanda Tanya (?)' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Tanda Petik ("...")' },
                { key: 'B', text: 'Tanda Kurung ((...))' },
                { key: 'C', text: 'Tanda Hubung (-)' },
                { key: 'D', text: 'Tanda Titik Koma (;)' }
            ],
            correctAnswer: 'A',
            explanation: 'Tanda petik dipakai untuk mengapit petikan langsung dari pembicaraan seseorang.',
            cognitiveLevel: 'LOTS',
            topic: 'Tanda Baca'
        },
        {
            stimulus: 'Bacalah teks petunjuk berikut:\n1) Masukkan steker ke stopkontak.\n2) Tekan tombol power untuk menyalakan kipas angin.\n3) Pilih nomor kecepatan putaran baling-baling.\n4) Cabut steker jika kipas angin sudah selesai digunakan.',
            question: 'Teks petunjuk di atas berisi tentang langkah-langkah ...',
            optionsFaseA: [
                { key: 'A', text: 'Memperbaiki kipas angin yang rusak' },
                { key: 'B', text: 'Menggunakan kipas angin dengan aman dan benar' },
                { key: 'C', text: 'Membersihkan baling-baling kipas angin' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Cara merakit bagian-bagian kipas angin' },
                { key: 'B', text: 'Petunjuk menggunakan kipas angin secara aman dan benar' },
                { key: 'C', text: 'Langkah membersihkan motor kipas angin' },
                { key: 'D', text: 'Cara mematikan aliran listrik di rumah' }
            ],
            correctAnswer: 'B',
            explanation: 'Teks prosedur tersebut menjelaskan tata cara pengoperasian kipas angin.',
            cognitiveLevel: 'MOTS',
            topic: 'Teks Petunjuk'
        },
        {
            stimulus: 'Perhatikan kalimat berikut: "Lani merasa sangat gembira karena mendapatkan juara pertama dalam lomba menyanyi."',
            question: 'Persamaan kata (sinonim) dari kata "gembira" pada kalimat di atas adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Sedih' },
                { key: 'B', text: 'Bahagia' },
                { key: 'C', text: 'Takut' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Sedih' },
                { key: 'B', text: 'Bahagia' },
                { key: 'C', text: 'Cemas' },
                { key: 'D', text: 'Gelisah' }
            ],
            correctAnswer: 'B',
            explanation: 'Sinonim atau persamaan makna dari gembira adalah bahagia atau senang.',
            cognitiveLevel: 'LOTS',
            topic: 'Sinonim'
        },
        {
            stimulus: 'Perhatikan kalimat berikut: "Ombak laut bergulung-gulung saling berkejaran menuju ke bibir pantai."',
            question: 'Majas yang digunakan pada kalimat di atas yang menggambarkan ombak seolah-olah bernyawa dan saling mengejar adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Metafora' },
                { key: 'B', text: 'Personifikasi' },
                { key: 'C', text: 'Hiperbola' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Metafora' },
                { key: 'B', text: 'Personifikasi' },
                { key: 'C', text: 'Hiperbola' },
                { key: 'D', text: 'Ironi' }
            ],
            correctAnswer: 'B',
            explanation: 'Gaya bahasa yang memperlakukan benda mati seperti manusia disebut majas personifikasi.',
            cognitiveLevel: 'MOTS',
            topic: 'Majas'
        }
    ];

    const pickIdx = (index - 1) % variants.length;
    const cycle = Math.floor((index - 1) / variants.length);
    const base = variants[pickIdx];
    if (cycle === 0) {
        return base;
    }
    const contexts = [
        'Pada wacana latihan kelas',
        'Berdasarkan penggalan bacaan sastra anak',
        'Dalam catatan kegiatan literasi sekolah',
        'Merujuk pada paragraf informasi terkini',
        'Pada teks bacaan modul kurikulum',
        'Sesuai contoh kalimat bahasa baku berikut'
    ];
    const ctxTag = contexts[(cycle - 1) % contexts.length];
    return {
        ...base,
        stimulus: `${ctxTag}: ${base.stimulus || ''}`,
        question: `${ctxTag}, ${base.question.charAt(0).toLowerCase()}${base.question.slice(1)}`
    };
}

// ==========================================
// 7. CORE GENERATOR FUNCTIONS
// ==========================================
export function generateAuthenticPgQuestions(
    subject: string,
    className: string,
    targetTps: any[],
    count: number,
    isFaseA: boolean,
    includeVisuals: boolean,
    weights: { lots: number; mots: number; hots: number },
    existingFingerprints?: Set<string>,
    renderVisualSvgFn?: (type?: VisualType, title?: string) => string
): QuestionPG[] {
    const bank = getPgBankForSubject(subject);
    const seen = new Set<string>(existingFingerprints || []);
    const result: QuestionPG[] = [];
    const isMath = subject.toLowerCase().includes('matematika');

    let bankIndex = 0;
    let variantIndex = 1;

    while (result.length < count && (bankIndex < bank.length || variantIndex < 150)) {
        let item: QuestionBankItemPG;

        if (bankIndex < bank.length) {
            item = bank[bankIndex];
            bankIndex++;
        } else {
            // Generate distinct parameterized variant
            if (isMath) {
                item = createDynamicMathVariant(variantIndex++, isFaseA);
            } else {
                item = createDynamicIndoVariant(variantIndex++, isFaseA);
            }
        }

        if (isDuplicateQuestion(seen, item.question, item.stimulus)) {
            continue;
        }

        markQuestionSeen(seen, item.question, item.stimulus);
        const tpItem = targetTps[result.length % targetTps.length] || { tp: 'Tujuan Pembelajaran Kurikulum Merdeka', element: subject };
        const visual = includeVisuals && item.visualType ? item.visualType : 'none';

        result.push({
            no: result.length + 1,
            stimulus: item.stimulus || '',
            question: item.question,
            options: isFaseA ? item.optionsFaseA : item.optionsFaseBC,
            correctAnswer: item.correctAnswer,
            explanation: item.explanation,
            cognitiveLevel: item.cognitiveLevel,
            tp: tpItem.tp,
            indikator: `Disajikan stimulus terkait ${item.topic}, peserta didik dapat menjawab pertanyaan dengan tepat.`,
            materi: item.topic || tpItem.element || subject,
            visualType: visual,
            visualTitle: item.visualTitle || '',
            visualSvg: visual !== 'none' && renderVisualSvgFn ? renderVisualSvgFn(visual, item.visualTitle) : undefined
        });
    }

    return result;
}

function createDynamicIsianVariant(subject: string, index: number): QuestionBankItemIsian {
    const s = subject.toLowerCase();
    if (s.includes('matematika') || s.includes('hitung') || s.includes('angka')) {
        const mode = (index - 1) % 5;
        if (mode === 0) {
            const numA = 5 + index * 3;
            const numB = 4 + (index % 5);
            return {
                question: `Hasil dari operasi hitung perkalian ${numA} x ${numB} adalah ...`,
                correctAnswer: `${numA * numB}`,
                cognitiveLevel: 'LOTS',
                topic: 'Operasi Perkalian'
            };
        } else if (mode === 1) {
            const side = 6 + index;
            return {
                question: `Sebuah persegi memiliki panjang sisi ${side} cm. Luas persegi tersebut adalah ... cm².`,
                correctAnswer: `${side * side}`,
                cognitiveLevel: 'MOTS',
                topic: 'Luas Persegi'
            };
        } else if (mode === 2) {
            const kg = 2 + index;
            return {
                question: `Berat sebuah paket beras adalah ${kg} kg. Jika diubah ke satuan gram, beratnya menjadi ... gram.`,
                correctAnswer: `${kg * 1000}`,
                cognitiveLevel: 'LOTS',
                topic: 'Satuan Berat'
            };
        } else if (mode === 3) {
            const jam = 2 + (index % 6) + Math.floor(index / 6);
            return {
                question: `Waktu selama ${jam} jam jika dinyatakan dalam satuan menit adalah ... menit.`,
                correctAnswer: `${jam * 60}`,
                cognitiveLevel: 'LOTS',
                topic: 'Satuan Waktu'
            };
        } else {
            const div = 3 + (index % 4);
            const ans = 8 + index;
            return {
                question: `Hasil pembagian bilangan ${div * ans} : ${div} adalah ...`,
                correctAnswer: `${ans}`,
                cognitiveLevel: 'LOTS',
                topic: 'Operasi Pembagian'
            };
        }
    }

    const indoBank: QuestionBankItemIsian[] = [
        { question: 'Kalimat yang hanya memiliki satu pola inti subjek dan predikat serta mudah dipahami disebut kalimat ...', correctAnswer: 'Efektif (Tunggal)', cognitiveLevel: 'LOTS', topic: 'Tata Kalimat' },
        { question: 'Huruf pertama pada awal kalimat dan nama tempat geografis wajib ditulis menggunakan huruf ...', correctAnswer: 'Kapital (Besar)', cognitiveLevel: 'LOTS', topic: 'Ejaan' },
        { question: 'Karangan singkat yang berisi cerita hewan berperilaku layaknya manusia disebut ...', correctAnswer: 'Fabel', cognitiveLevel: 'LOTS', topic: 'Teks Fiksi' },
        { question: 'Daftar kata sulit beserta artinya yang tersusun urut abjad di bagian akhir buku disebut ...', correctAnswer: 'Glosarium (Kamus mini)', cognitiveLevel: 'MOTS', topic: 'Literasi Buku' },
        { question: 'Teks yang berisi ajakan atau bujukan halus kepada pembaca agar mau mengikuti sesuatu disebut teks ...', correctAnswer: 'Persuasi', cognitiveLevel: 'MOTS', topic: 'Jenis Teks' },
        { question: 'Awalan "me-" apabila bertemu dengan kata dasar "sapu" akan luluh menjadi kata ...', correctAnswer: 'Menyapu', cognitiveLevel: 'MOTS', topic: 'Imbuhan' }
    ];

    const ipasBank: QuestionBankItemIsian[] = [
        { question: 'Sumber energi panas dan cahaya terbesar yang menyinari planet bumi adalah ...', correctAnswer: 'Matahari', cognitiveLevel: 'LOTS', topic: 'Energi' },
        { question: 'Perubahan wujud benda dari padat langsung menjadi gas seperti pada kapur barus disebut ...', correctAnswer: 'Menyublim', cognitiveLevel: 'LOTS', topic: 'Wujud Zat' },
        { question: 'Alat indra pada manusia yang berfungsi untuk mendengar getaran suara adalah ...', correctAnswer: 'Telinga', cognitiveLevel: 'LOTS', topic: 'Panca Indra' },
        { question: 'Bagian bunga yang berfungsi sebagai alat perkembangbiakan jantan karena menghasilkan serbuk sari adalah ...', correctAnswer: 'Benang sari', cognitiveLevel: 'MOTS', topic: 'Perkembangbiakan Tumbuhan' },
        { question: 'Hubungan saling menguntungkan antara dua makhluk hidup yang berbeda jenis disebut simbiosis ...', correctAnswer: 'Mutualisme', cognitiveLevel: 'LOTS', topic: 'Ekosistem' },
        { question: 'Benda langit yang menjadi satelit alami planet bumi dan tampak bersinar di malam hari adalah ...', correctAnswer: 'Bulan', cognitiveLevel: 'LOTS', topic: 'Tata Surya' }
    ];

    const pancasilaBank: QuestionBankItemIsian[] = [
        { question: 'Lagu kebangsaan negara Republik Indonesia yang diciptakan oleh W.R. Supratman berjudul ...', correctAnswer: 'Indonesia Raya', cognitiveLevel: 'LOTS', topic: 'Identitas Nasional' },
        { question: 'Warna bendera negara Republik Indonesia adalah merah yang berarti berani dan putih yang berarti ...', correctAnswer: 'Suci', cognitiveLevel: 'LOTS', topic: 'Simbol Negara' },
        { question: 'Aturan tertulis atau tidak tertulis yang berlaku dan disepakati bersama dalam masyarakat disebut ...', correctAnswer: 'Norma', cognitiveLevel: 'LOTS', topic: 'Norma' },
        { question: 'Menjaga kebersihan halaman sekolah bersama teman-teman tanpa membeda-bedakan suku merupakan wujud sila ke-...', correctAnswer: 'Tiga (Persatuan Indonesia)', cognitiveLevel: 'MOTS', topic: 'Pancasila' },
        { question: 'Pemilihan ketua kelas secara adil dengan mengambil suara terbanyak disebut ...', correctAnswer: 'Voting (Pemungutan suara)', cognitiveLevel: 'MOTS', topic: 'Demokrasi' },
        { question: 'Sikap bersikap adil dan tidak pilih kasih kepada semua teman merupakan cerminan sila ke-...', correctAnswer: 'Lima (Keadilan sosial)', cognitiveLevel: 'MOTS', topic: 'Pancasila' }
    ];

    const selectedPool = s.includes('ipas') || s.includes('ipa') || s.includes('ips')
        ? ipasBank
        : s.includes('pancasila') || s.includes('ppkn')
            ? pancasilaBank
            : indoBank;

    const picked = selectedPool[(index - 1) % selectedPool.length];
    const cycle = Math.floor((index - 1) / selectedPool.length);
    if (cycle === 0) return picked;
    const regions = ['Bandung', 'Surabaya', 'Yogyakarta', 'Semarang', 'Medan', 'Makassar'];
    return {
        ...picked,
        question: `Dalam konteks pembelajaran di sekolah wilayah ${regions[cycle % regions.length]}, ${picked.question.charAt(0).toLowerCase()}${picked.question.slice(1)}`
    };
}

export function generateAuthenticIsianQuestions(
    subject: string,
    className: string,
    targetTps: any[],
    count: number,
    existingFingerprints?: Set<string>
): QuestionIsian[] {
    const bank = getIsianBankForSubject(subject);
    const seen = existingFingerprints || new Set<string>();
    const result: QuestionIsian[] = [];

    let idx = 0;
    while (result.length < count && idx < bank.length) {
        const item = bank[idx++];
        if (isDuplicateQuestion(seen, item.question, item.stimulus)) continue;

        markQuestionSeen(seen, item.question, item.stimulus);
        const tpItem = targetTps[result.length % targetTps.length] || { tp: 'Tujuan Pembelajaran Kurikulum Merdeka', element: subject };

        result.push({
            no: result.length + 1,
            stimulus: item.stimulus || '',
            question: item.question,
            correctAnswer: item.correctAnswer,
            cognitiveLevel: item.cognitiveLevel,
            tp: tpItem.tp,
            indikator: `Peserta didik mampu melengkapi isian terkait ${item.topic}.`,
            materi: item.topic || tpItem.element || subject
        });
    }

    // Dynamic generation if count exceeds base bank
    let dynIndex = 1;
    while (result.length < count && dynIndex < 150) {
        const dynItem = createDynamicIsianVariant(subject, dynIndex++);
        if (isDuplicateQuestion(seen, dynItem.question, dynItem.stimulus)) continue;

        markQuestionSeen(seen, dynItem.question, dynItem.stimulus);
        const tpItem = targetTps[result.length % targetTps.length] || { tp: 'Tujuan Pembelajaran Kurikulum Merdeka', element: subject };

        result.push({
            no: result.length + 1,
            stimulus: dynItem.stimulus || '',
            question: dynItem.question,
            correctAnswer: dynItem.correctAnswer,
            cognitiveLevel: dynItem.cognitiveLevel,
            tp: tpItem.tp,
            indikator: `Peserta didik mampu melengkapi isian terkait ${dynItem.topic}.`,
            materi: dynItem.topic || tpItem.element || subject
        });
    }

    return result;
}

export function generateAuthenticUraianQuestions(
    subject: string,
    className: string,
    targetTps: any[],
    count: number,
    existingFingerprints?: Set<string>
): QuestionUraian[] {
    const bank = getUraianBankForSubject(subject);
    const seen = existingFingerprints || new Set<string>();
    const result: QuestionUraian[] = [];

    let idx = 0;
    while (result.length < count && idx < bank.length) {
        const item = bank[idx++];
        if (isDuplicateQuestion(seen, item.question, item.stimulus)) continue;

        markQuestionSeen(seen, item.question, item.stimulus);
        const tpItem = targetTps[result.length % targetTps.length] || { tp: 'Tujuan Pembelajaran Kurikulum Merdeka', element: subject };

        result.push({
            no: result.length + 1,
            stimulus: item.stimulus || '',
            question: item.question,
            correctAnswer: item.correctAnswer,
            cognitiveLevel: item.cognitiveLevel,
            tp: tpItem.tp,
            indikator: `Peserta didik mampu menguraikan solusi mendalam terkait ${item.topic}.`,
            materi: item.topic || tpItem.element || subject,
            rubric: item.rubric
        });
    }

    // Dynamic generation if count exceeds base uraian bank
    let dynIdx = 1;
    while (result.length < count && dynIdx < 100) {
        const dynItem = createDynamicUraianVariant(subject, dynIdx++);
        if (isDuplicateQuestion(seen, dynItem.question, dynItem.stimulus)) continue;

        markQuestionSeen(seen, dynItem.question, dynItem.stimulus);
        const tpItem = targetTps[result.length % targetTps.length] || { tp: 'Tujuan Pembelajaran Kurikulum Merdeka', element: subject };

        result.push({
            no: result.length + 1,
            stimulus: dynItem.stimulus || '',
            question: dynItem.question,
            correctAnswer: dynItem.correctAnswer,
            cognitiveLevel: 'HOTS',
            tp: tpItem.tp,
            indikator: `Peserta didik mampu menguraikan solusi mendalam terkait ${dynItem.topic}.`,
            materi: dynItem.topic || tpItem.element || subject,
            rubric: dynItem.rubric
        });
    }

    return result;
}

function createDynamicUraianVariant(subject: string, index: number): QuestionBankItemUraian {
    const s = subject.toLowerCase();
    if (s.includes('matematika') || s.includes('hitung') || s.includes('angka')) {
        const mode = (index - 1) % 4;
        const cycle = Math.floor((index - 1) / 4);
        if (mode === 0) {
            const places = ['lapangan futsal sekolah', 'kolam renang desa', 'taman bacaan terbuka', 'aula pertemuan', 'halaman upacara'];
            const place = places[cycle % places.length];
            const p = 14 + index * 3;
            const l = 7 + index;
            return {
                stimulus: `Sebuah ${place} berbentuk persegi panjang memiliki ukuran panjang ${p} meter dan lebar ${l} meter.`,
                question: `Hitunglah keliling dan luas ${place} berukuran ${p} m x ${l} m tersebut secara lengkap beserta langkah-langkah rumusnya!`,
                correctAnswer: `Keliling = 2 x (${p} + ${l}) = ${2 * (p + l)} meter. Luas = ${p} x ${l} = ${p * l} m².`,
                cognitiveLevel: 'HOTS',
                topic: 'Pengukuran Luas dan Keliling',
                rubric: {
                    score3: 'Menuliskan rumus keliling dan luas secara lengkap dan menghitung hasil secara tepat.',
                    score2: 'Perhitungan benar tetapi salah satu rumus terlewat.',
                    score1: 'Hanya menuliskan rumus tanpa hasil yang benar.',
                    score0: 'Jawaban salah atau tidak menjawab.'
                }
            };
        } else if (mode === 1) {
            const boxes = 6 + index;
            const perBox = 12 + (cycle * 3);
            const sold = 18 + (index * 2);
            const total = boxes * perBox;
            const rem = total - sold;
            return {
                stimulus: `Koperasi sekolah membeli ${boxes} kardus buku tulis. Setiap kardus berisi ${perBox} buku. Pada minggu pertama terjual sebanyak ${sold} buku.`,
                question: `Tuliskan kalimat matematika dan hitunglah sisa buku dari ${boxes} kardus (@${perBox} buku) setelah terjual ${sold} buku tersebut!`,
                correctAnswer: `Total awal = ${boxes} x ${perBox} = ${total} buku. Sisa buku = ${total} - ${sold} = ${rem} buku.`,
                cognitiveLevel: 'HOTS',
                topic: 'Operasi Hitung Campuran',
                rubric: {
                    score3: 'Menuliskan kalimat matematika perkalian dan pengurangan dengan tepat serta menghitung sisa secara akurat.',
                    score2: 'Langkah benar namun terdapat kesalahan hitung akhir.',
                    score1: 'Hanya menyelesaikan satu tahap operasi.',
                    score0: 'Tidak menjawab atau jawaban keliru.'
                }
            };
        } else if (mode === 2) {
            const edge = 7 + index;
            const vol = edge * edge * edge;
            const area = 6 * edge * edge;
            return {
                stimulus: `Sebuah bak penampungan air berbentuk kubus memiliki panjang rusuk bagian dalam ${edge} dm.`,
                question: `Tentukan volume penuh air (dalam liter/dm³) dan luas permukaan kubus dengan panjang rusuk ${edge} dm tersebut!`,
                correctAnswer: `Volume = ${edge} x ${edge} x ${edge} = ${vol} dm³ (liter). Luas permukaan = 6 x ${edge} x ${edge} = ${area} dm².`,
                cognitiveLevel: 'HOTS',
                topic: 'Bangun Ruang Kubus',
                rubric: {
                    score3: 'Menghitung volume dan luas permukaan kubus secara runtut dengan satuan yang tepat.',
                    score2: 'Salah satu besaran (volume atau luas permukaan) benar.',
                    score1: 'Hanya menuliskan rumus kubus.',
                    score0: 'Jawaban salah atau kosong.'
                }
            };
        } else {
            const a = 3 + index;
            const b = 5 + index;
            const kpk = (a * b) / (function gcd(x: number, y: number): number { return y === 0 ? x : gcd(y, x % y); })(a, b);
            return {
                stimulus: `Jadwal latihan ekstrakurikuler pramuka diadakan setiap ${a} hari sekali, sedangkan latihan seni tari setiap ${b} hari sekali.`,
                question: `Apabila kedua kegiatan tersebut dilaksanakan bersamaan pada hari ini, berapa hari lagi kedua latihan (${a} hari sekali dan ${b} hari sekali) akan berlangsung bersamaan kembali? Jelaskan menggunakan cara KPK!`,
                correctAnswer: `Dengan mencari kelipatan persekutuan terkecil (KPK) dari ${a} dan ${b}, diperoleh KPK = ${kpk}. Jadi, kedua latihan akan bersamaan lagi dalam ${kpk} hari.`,
                cognitiveLevel: 'HOTS',
                topic: 'KPK dalam Kehidupan Sehari-hari',
                rubric: {
                    score3: 'Menjabarkan kelipatan/faktorisasi prima secara sistematis dan menemukan KPK yang benar.',
                    score2: 'Hasil KPK benar tetapi langkah kurang lengkap.',
                    score1: 'Salah menentukan kelipatan bilangan.',
                    score0: 'Kosong.'
                }
            };
        }
    }

    const indoTopics = [
        {
            topic: 'Menulis Kalimat Efektif',
            q: 'Jelaskan apa yang dimaksud dengan kalimat efektif dalam bahasa Indonesia! Tuliskan 2 contoh kalimat tidak efektif beserta perbaikannya menjadi kalimat efektif yang tepat!',
            ans: 'Kalimat efektif adalah kalimat yang disusun secara singkat, padat, jelas, dan mudah dipahami pembaca tanpa menimbulkan makna ganda. Contoh: "Para siswa-siswa sedang belajar" diperbaiki menjadi "Para siswa sedang belajar".'
        },
        {
            topic: 'Teks Cerita dan Amanat',
            q: 'Ceritakan secara ringkas sebuah pengalaman berkesan saat kamu bekerja sama dalam menyelesaikan tugas kelompok di kelas! Pelajaran berharga apa yang kamu peroleh dari pengalaman tersebut?',
            ans: 'Menceritakan pengalaman kerja kelompok secara runtut, menjelaskan pembagian tugas yang adil, serta menyebutkan nilai kerja sama dan saling menghargai pendapat.'
        },
        {
            topic: 'Membuat Kalimat Tanya ADIKSIMBA',
            q: 'Buatlah 3 buah kalimat tanya baku menggunakan kata tanya "Mengapa", "Bagaimana", dan "Di mana" bertema kegiatan penghijauan sekolah!',
            ans: '1. Mengapa kita harus menanam pohon di halaman sekolah? 2. Bagaimana cara merawat tanaman pot agar tumbuh subur? 3. Di mana letak taman apotek hidup sekolah kita?'
        },
        {
            topic: 'Ringkasan Paragraf',
            q: 'Jelaskan 3 langkah mudah untuk menemukan ide pokok dan membuat ringkasan yang baik dari sebuah teks bacaan panjang!',
            ans: '1. Membaca seluruh teks dengan saksama. 2. Menandai kalimat utama pada tiap paragraf. 3. Merangkai kembali inti gagasan utama tersebut menggunakan kalimat sendiri secara padu.'
        },
        {
            topic: 'Majas dalam Puisi Anak',
            q: 'Apa perbedaan antara majas personifikasi dan majas hiperbola? Berikan masing-masing 1 contoh kalimatnya!',
            ans: 'Personifikasi mengibaratkan benda mati seolah bernyawa ("Angin malam berbisik lembut"), sedangkan hiperbola melebih-lebihkan kenyataan ("Suaranya menggelegar membelah angkasa").'
        }
    ];

    const ipasTopics = [
        {
            topic: 'Analisis Hubungan Sebab Akibat Ekosistem',
            q: 'Jelaskan bagaimana proses terjadinya siklus air dapat terganggu akibat penggundulan hutan! Apa dampaknya terhadap ketersediaan air bersih bagi manusia?',
            ans: 'Akar pohon berfungsi menyerap air hujan ke dalam tanah (infiltrasi). Jika hutan gundul, air langsung mengalir menyebabkan banjir dan cadangan air tanah berkurang drastis.'
        },
        {
            topic: 'Perubahan Energi',
            q: 'Sebutkan dan jelaskan 3 contoh alat elektronik di rumah yang mengalami perubahan energi listrik menjadi bentuk energi lain beserta manfaatnya!',
            ans: '1. Setrika (listrik -> panas) untuk merapikan pakaian. 2. Kipas angin (listrik -> gerak) untuk menyejukkan ruangan. 3. Lampu LED (listrik -> cahaya) untuk menerangi ruangan.'
        },
        {
            topic: 'Pelestarian Sumber Daya Alam',
            q: 'Bedakan antara sumber daya alam yang dapat diperbarui dan tidak dapat diperbarui beserta masing-masing 2 contohnya, lalu jelaskan cara menghematnya!',
            ans: 'Dapat diperbarui: air, hutan, sinar matahari. Tidak dapat diperbarui: minyak bumi, batu bara, emas. Cara menghemat: matikan lampu bila tidak dipakai, kurangi kendaraan bermotor pribadi.'
        },
        {
            topic: 'Daur Hidup Hewan',
            q: 'Jelaskan perbedaan antara metamorfosis sempurna dan metamorfosis tidak sempurna pada serangga beserta contoh hewannya!',
            ans: 'Metamorfosis sempurna memiliki 4 tahap (telur-larva-pupa-dewasa) seperti kupu-kupu, sedangkan tidak sempurna memiliki 3 tahap tanpa pupa (telur-nimfa-dewasa) seperti belalang.'
        },
        {
            topic: 'Gaya dan Gerak',
            q: 'Berikan 3 contoh peristiwa di sekolah yang menunjukkan bahwa gaya dapat mengubah bentuk benda dan arah gerak benda!',
            ans: '1. Plastisin ditekan berubah bentuk. 2. Bola ditendang mengubah arah gerak bola. 3. Sepeda direm menjadi melambat lalu berhenti.'
        }
    ];

    const pancasilaTopics = [
        {
            topic: 'Refleksi Karakter Gotong Royong',
            q: 'Mengapa sikap gotong royong dan kepedulian terhadap sesama sangat penting untuk diterapkan di lingkungan sekolah? Berikan 2 contoh tindakan nyata yang dapat kamu lakukan!',
            ans: 'Gotong royong penting agar tercipta kerukunan dan pekerjaan berat cepat selesai. Contoh: ikut kerja bakti membersihkan kelas dan membantu teman yang kesulitan.'
        },
        {
            topic: 'Hak dan Kewajiban Siswa',
            q: 'Tuliskan masing-masing 2 hak dan 2 kewajiban peserta didik di lingkungan sekolah, lalu jelaskan mengapa kewajiban harus didahulukan sebelum menuntut hak!',
            ans: 'Hak: mendapat ilmu dan fasilitas belajar. Kewajiban: menaati tata tertib dan menjaga kebersihan. Kewajiban didahulukan agar tercipta keteraturan dan tanggung jawab.'
        },
        {
            topic: 'Makna Bhinneka Tunggal Ika',
            q: 'Jelaskan arti semboyan "Bhinneka Tunggal Ika" dan berikan 2 contoh sikap toleransi dalam berteman di kelas meskipun berbeda suku atau agama!',
            ans: 'Artinya berbeda-beda tetapi tetap satu jua. Contoh: tidak mengejek logat bahasa daerah teman dan mempersilakan teman beribadah sesuai keyakinannya.'
        },
        {
            topic: 'Penerapan Norma di Masyarakat',
            q: 'Mengapa aturan lalu lintas dan norma kesopanan wajib dipatuhi oleh semua warga? Apa dampaknya jika masyarakat melanggar aturan tersebut?',
            ans: 'Aturan menjaga keselamatan, ketertiban, dan keharmonisan bersama. Jika dilanggar akan timbul kekacauan, perselisihan, dan kecelakaan.'
        },
        {
            topic: 'Menghargai Pendapat Orang Lain',
            q: 'Bagaimana sikap yang bijaksana ketika pendapat temanmu dalam diskusi kelompok berbeda dengan pendapatmu?',
            ans: 'Mendengarkan dengan tenang tanpa memotong pembicaraan, menghargai alasannya, serta mencari jalan tengah terbaik melalui musyawarah.'
        }
    ];

    const selectedTopics = s.includes('ipas') || s.includes('ipa') || s.includes('ips')
        ? ipasTopics
        : s.includes('pancasila') || s.includes('ppkn')
            ? pancasilaTopics
            : indoTopics;

    const picked = selectedTopics[(index - 1) % selectedTopics.length];
    const cycle = Math.floor((index - 1) / selectedTopics.length);
    const questionText = cycle === 0
        ? picked.q
        : `Berdasarkan studi kasus pembelajaran ke-${cycle + 1} tentang ${picked.topic.toLowerCase()}, ${picked.q.charAt(0).toLowerCase()}${picked.q.slice(1)}`;

    return {
        question: questionText,
        correctAnswer: picked.ans,
        cognitiveLevel: 'HOTS',
        topic: picked.topic,
        rubric: {
            score3: 'Menguraikan jawaban secara terperinci, runtut, logis, dan relevan dengan konteks materi.',
            score2: 'Jawaban benar secara substansi namun penjelasan kurang mendalam.',
            score1: 'Jawaban sangat singkat dan kurang terstruktur.',
            score0: 'Tidak ada jawaban.'
        }
    };
}

// ==========================================
// 8. ZERO-DUPLICATE POST-PROCESSORS
// ==========================================
export function deduplicateAndEnsureCountPg(
    items: QuestionPG[],
    targetCount: number,
    subject: string,
    className: string,
    targetTps: any[],
    isFaseA: boolean,
    includeVisuals: boolean,
    weights: { lots: number; mots: number; hots: number },
    renderVisualSvgFn?: (type?: VisualType, title?: string) => string,
    sharedSeenFingerprints?: Set<string>
): QuestionPG[] {
    const uniqueResult: QuestionPG[] = [];
    const seenFingerprints = sharedSeenFingerprints || new Set<string>();

    // 1. Keep valid unique items
    for (const item of items) {
        if (!item || !item.question || item.question.trim().length < 5) continue;
        if (!Array.isArray(item.options) || item.options.length < 3) continue;
        if (!isDuplicateQuestion(seenFingerprints, item.question, item.stimulus)) {
            markQuestionSeen(seenFingerprints, item.question, item.stimulus);
            uniqueResult.push(item);
            if (uniqueResult.length >= targetCount) break;
        }
    }

    // 2. If short of targetCount, fill with guaranteed unique questions
    if (uniqueResult.length < targetCount) {
        const needed = targetCount - uniqueResult.length;
        const fillers = generateAuthenticPgQuestions(
            subject,
            className,
            targetTps,
            needed,
            isFaseA,
            includeVisuals,
            weights,
            seenFingerprints,
            renderVisualSvgFn
        );
        for (const candidate of fillers) {
            uniqueResult.push(candidate);
            if (uniqueResult.length >= targetCount) break;
        }
    }

    // 3. Sequential 1..N re-numbering and SVG assignment
    return uniqueResult.slice(0, targetCount).map((q, idx) => ({
        ...q,
        no: idx + 1,
        visualSvg: q.visualType && q.visualType !== 'none' && renderVisualSvgFn
            ? renderVisualSvgFn(q.visualType, q.visualTitle)
            : q.visualSvg
    }));
}

export function deduplicateAndEnsureCountIsian(
    items: QuestionIsian[],
    targetCount: number,
    subject: string,
    className: string,
    targetTps: any[],
    sharedSeenFingerprints?: Set<string>
): QuestionIsian[] {
    const uniqueResult: QuestionIsian[] = [];
    const seenFingerprints = sharedSeenFingerprints || new Set<string>();

    for (const item of items) {
        if (!item || !item.question || item.question.trim().length < 5) continue;
        if (!isDuplicateQuestion(seenFingerprints, item.question, item.stimulus)) {
            markQuestionSeen(seenFingerprints, item.question, item.stimulus);
            uniqueResult.push(item);
            if (uniqueResult.length >= targetCount) break;
        }
    }

    if (uniqueResult.length < targetCount) {
        const needed = targetCount - uniqueResult.length;
        const fillers = generateAuthenticIsianQuestions(subject, className, targetTps, needed, seenFingerprints);
        for (const candidate of fillers) {
            uniqueResult.push(candidate);
            if (uniqueResult.length >= targetCount) break;
        }
    }

    return uniqueResult.slice(0, targetCount).map((q, idx) => ({
        ...q,
        no: idx + 1
    }));
}

export function deduplicateAndEnsureCountUraian(
    items: QuestionUraian[],
    targetCount: number,
    subject: string,
    className: string,
    targetTps: any[],
    sharedSeenFingerprints?: Set<string>
): QuestionUraian[] {
    const uniqueResult: QuestionUraian[] = [];
    const seenFingerprints = sharedSeenFingerprints || new Set<string>();

    for (const item of items) {
        if (!item || !item.question || item.question.trim().length < 5) continue;
        if (!isDuplicateQuestion(seenFingerprints, item.question, item.stimulus)) {
            markQuestionSeen(seenFingerprints, item.question, item.stimulus);
            uniqueResult.push(item);
            if (uniqueResult.length >= targetCount) break;
        }
    }

    if (uniqueResult.length < targetCount) {
        const needed = targetCount - uniqueResult.length;
        const fillers = generateAuthenticUraianQuestions(subject, className, targetTps, needed, seenFingerprints);
        for (const candidate of fillers) {
            uniqueResult.push(candidate);
            if (uniqueResult.length >= targetCount) break;
        }
    }

    return uniqueResult.slice(0, targetCount).map((q, idx) => ({
        ...q,
        no: idx + 1
    }));
}
