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

/**
 * Extracts a compact semantic core fingerprint (stripping filler framing words) for AI prompt & device history comparison.
 */
export function getQuestionCoreFingerprint(question?: string): string {
    const cleaned = (question || '')
        .toLowerCase()
        .replace(/\b(dalam|pada|perhatikan|bacalah|berdasarkan|berikut|sebuah|suatu|merupakan|adalah|dinamakan|disebut|yang|dari|untuk|dengan|siswa|peserta|didik|kelas|sekolah|kegiatan|materi|pembelajaran|pertanyaan|berapakah|apakah|manakah|tuliskan|jelaskan|sebutkan|uraikan)\b/g, ' ')
        .replace(/[^a-z0-9]/g, '');
    return cleaned.slice(0, 140);
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


export function parseGradeFromClassName(className?: string, isFaseA?: boolean): number {
    const match = (className || '').match(/\b([1-6])\b/);
    if (match) return parseInt(match[1], 10);
    return isFaseA ? 1 : 4;
}

export interface GradeScopedItem {
    minGrade?: number;
    maxGrade?: number;
}

function rotateArrayByOffset<T>(arr: T[], offset: number): T[] {
    if (arr.length <= 1) return arr;
    const norm = ((offset % arr.length) + arr.length) % arr.length;
    if (norm === 0) return arr;
    return [...arr.slice(norm), ...arr.slice(0, norm)];
}

function filterAndPrioritizeByGrade<T extends GradeScopedItem>(items: T[], grade: number): T[] {
    const matched = items.filter(item => {
        const minG = item.minGrade ?? 1;
        const maxG = item.maxGrade ?? 6;
        if (grade < minG || grade > maxG) return false;
        const qText = (item as any).question || (item as any).q || '';
        const stimText = (item as any).stimulus || '';
        const topicText = (item as any).topic || '';
        if (qText && isGradeMismatchedQuestion(qText, stimText, grade)) return false;
        if (topicText && isGradeMismatchedQuestion(topicText, '', grade)) return false;
        return true;
    });

    // Group by specificity span so narrower grade-tailored items stay prioritized,
    // while deterministically rotating items within each specificity band by grade
    // so Kelas 1..6 never receive the same starting slice of questions.
    const buckets = new Map<number, T[]>();
    for (const item of matched) {
        const span = (item.maxGrade ?? 6) - (item.minGrade ?? 1);
        const list = buckets.get(span) || [];
        list.push(item);
        buckets.set(span, list);
    }

    const sortedSpans = Array.from(buckets.keys()).sort((a, b) => a - b);
    const ordered: T[] = [];
    sortedSpans.forEach((span, bandIdx) => {
        const bucket = buckets.get(span) || [];
        const offset = (grade - 1) * 5 + bandIdx * 2;
        ordered.push(...rotateArrayByOffset(bucket, offset));
    });
    return ordered;
}

export interface QuestionBankItemPG extends GradeScopedItem {
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

export interface QuestionBankItemIsian extends GradeScopedItem {
    stimulus?: string;
    question: string;
    correctAnswer: string;
    cognitiveLevel: 'LOTS' | 'MOTS' | 'HOTS';
    topic: string;
}

export interface QuestionBankItemUraian extends GradeScopedItem {
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
    // --- KELAS 1 - 2 (FASE A) ---
    {
        minGrade: 1,
        maxGrade: 2,
        visualType: 'clock_0900',
        visualTitle: 'Perhatikan gambar jam dinding di bawah ini!',
        stimulus: 'Jarum pendek pada jam dinding menunjuk angka 9 dan jarum panjang menunjuk tepat ke angka 12.',
        question: 'Waktu yang ditunjukkan oleh jam dinding pada gambar di atas adalah pukul ...',
        optionsFaseA: [
            { key: 'A', text: '03.00' },
            { key: 'B', text: '09.00' },
            { key: 'C', text: '12.00' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '03.00' },
            { key: 'B', text: '09.00' },
            { key: 'C', text: '10.00' },
            { key: 'D', text: '12.00' }
        ],
        correctAnswer: 'B',
        explanation: 'Jarum pendek di angka 9 dan jarum panjang di angka 12 menunjukkan tepat pukul 09.00.',
        cognitiveLevel: 'LOTS',
        topic: 'Membaca Jam Analog'
    },
    {
        minGrade: 1,
        maxGrade: 2,
        visualType: 'clock_0200',
        visualTitle: 'Perhatikan gambar jam dinding berikut!',
        stimulus: 'Siti pulang sekolah dan mulai beristirahat siang saat jarum pendek menunjuk angka 2 dan jarum panjang menunjuk angka 12.',
        question: 'Jam dinding di atas menunjukkan pukul ...',
        optionsFaseA: [
            { key: 'A', text: '01.00' },
            { key: 'B', text: '02.00' },
            { key: 'C', text: '04.00' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '01.00' },
            { key: 'B', text: '02.00' },
            { key: 'C', text: '03.00' },
            { key: 'D', text: '12.00' }
        ],
        correctAnswer: 'B',
        explanation: 'Jarum pendek menunjuk angka 2 dan jarum panjang di angka 12 artinya pukul 02.00.',
        cognitiveLevel: 'LOTS',
        topic: 'Membaca Jam Analog'
    },
    {
        minGrade: 1,
        maxGrade: 2,
        visualType: 'shape_triangle',
        visualTitle: 'Perhatikan gambar bangun datar berikut!',
        stimulus: 'Edo memiliki penggaris berbentuk bangun datar dengan tiga sisi lurus.',
        question: 'Nama bangun datar pada gambar yang memiliki 3 sisi dan 3 sudut tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Segitiga' },
            { key: 'B', text: 'Lingkaran' },
            { key: 'C', text: 'Persegi panjang' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Segitiga' },
            { key: 'B', text: 'Lingkaran' },
            { key: 'C', text: 'Persegi' },
            { key: 'D', text: 'Trapesium' }
        ],
        correctAnswer: 'A',
        explanation: 'Bangun datar yang dibatasi oleh 3 sisi lurus dan memiliki 3 titik sudut disebut segitiga.',
        cognitiveLevel: 'LOTS',
        topic: 'Bangun Datar Sederhana'
    },
    {
        minGrade: 1,
        maxGrade: 2,
        stimulus: 'Di meja belajar Andi ada 14 pensil warna. Ibu membelikan lagi 12 pensil warna baru untuk Andi.',
        question: 'Berapa jumlah seluruh pensil warna Andi sekarang?',
        optionsFaseA: [
            { key: 'A', text: '24 pensil' },
            { key: 'B', text: '26 pensil' },
            { key: 'C', text: '28 pensil' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '24 pensil' },
            { key: 'B', text: '26 pensil' },
            { key: 'C', text: '28 pensil' },
            { key: 'D', text: '30 pensil' }
        ],
        correctAnswer: 'B',
        explanation: 'Jumlah seluruh pensil = 14 + 12 = 26 pensil warna.',
        cognitiveLevel: 'LOTS',
        topic: 'Penjumlahan Bilangan Cacah'
    },
    {
        minGrade: 1,
        maxGrade: 2,
        stimulus: 'Lani memetik 28 buah stroberi di kebun. Sebanyak 13 buah diberikan kepada adiknya.',
        question: 'Berapa buah sisa stroberi yang masih dimiliki Lani?',
        optionsFaseA: [
            { key: 'A', text: '13 buah' },
            { key: 'B', text: '15 buah' },
            { key: 'C', text: '17 buah' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '13 buah' },
            { key: 'B', text: '15 buah' },
            { key: 'C', text: '16 buah' },
            { key: 'D', text: '18 buah' }
        ],
        correctAnswer: 'B',
        explanation: 'Sisa stroberi Lani = 28 - 13 = 15 buah.',
        cognitiveLevel: 'LOTS',
        topic: 'Pengurangan Bilangan Cacah'
    },
    {
        minGrade: 1,
        maxGrade: 2,
        stimulus: 'Sebuah bilangan dua angka tersusun dari 4 puluhan dan 7 satuan.',
        question: 'Bilangan yang terbentuk dari 4 puluhan dan 7 satuan tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: '47' },
            { key: 'B', text: '74' },
            { key: 'C', text: '11' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '47' },
            { key: 'B', text: '74' },
            { key: 'C', text: '407' },
            { key: 'D', text: '11' }
        ],
        correctAnswer: 'A',
        explanation: '4 puluhan bernilai 40 ditambah 7 satuan menjadi bilangan 47.',
        cognitiveLevel: 'LOTS',
        topic: 'Nilai Tempat Bilangan'
    },
    {
        minGrade: 1,
        maxGrade: 2,
        stimulus: 'Sebuah kue bolu dipotong menjadi 2 bagian yang sama besar. Beni memakan 1 bagian kue tersebut.',
        question: 'Bagian kue yang dimakan Beni bernilai pecahan ...',
        optionsFaseA: [
            { key: 'A', text: 'Setengah (1/2)' },
            { key: 'B', text: 'Seperempat (1/4)' },
            { key: 'C', text: 'Satu utuh (1/1)' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '1/2' },
            { key: 'B', text: '1/3' },
            { key: 'C', text: '1/4' },
            { key: 'D', text: '2/3' }
        ],
        correctAnswer: 'A',
        explanation: 'Satu bagian dari dua potong sama besar disebut setengah atau 1/2.',
        cognitiveLevel: 'LOTS',
        topic: 'Mengenal Pecahan Setengah'
    },
    // --- KELAS 3 - 4 (FASE B) & UMUM ---
    {
        minGrade: 3,
        maxGrade: 6,
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
        minGrade: 4,
        maxGrade: 6,
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
        minGrade: 3,
        maxGrade: 5,
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
        minGrade: 3,
        maxGrade: 5,
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
        minGrade: 3,
        maxGrade: 6,
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
        minGrade: 3,
        maxGrade: 4,
        stimulus: 'Ibu membeli 2 kg gula pasir dan 500 gram tepung terigu di pasar untuk membuat kue.',
        question: 'Berat seluruh belanjaan Ibu jika dinyatakan dalam satuan gram adalah ...',
        optionsFaseA: [
            { key: 'A', text: '2.050 gram' },
            { key: 'B', text: '2.500 gram' },
            { key: 'C', text: '700 gram' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '700 gram' },
            { key: 'B', text: '2.050 gram' },
            { key: 'C', text: '2.500 gram' },
            { key: 'D', text: '25.000 gram' }
        ],
        correctAnswer: 'C',
        explanation: '1 kg = 1.000 gram, maka 2 kg = 2.000 gram. Total berat = 2.000 + 500 = 2.500 gram.',
        cognitiveLevel: 'MOTS',
        topic: 'Satuan Berat Baku'
    },
    {
        minGrade: 3,
        maxGrade: 4,
        stimulus: 'Pada garis bilangan pola kelipatan 4 tertulis barisan angka: 4, 8, 12, [ ... ], 20, 24.',
        question: 'Bilangan yang tepat untuk mengisi kotak rumpang pada pola bilangan di atas adalah ...',
        optionsFaseA: [
            { key: 'A', text: '14' },
            { key: 'B', text: '16' },
            { key: 'C', text: '18' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '14' },
            { key: 'B', text: '15' },
            { key: 'C', text: '16' },
            { key: 'D', text: '18' }
        ],
        correctAnswer: 'C',
        explanation: 'Pola bilangan selalu bertambah 4 (+4), sehingga setelah 12 adalah 12 + 4 = 16.',
        cognitiveLevel: 'LOTS',
        topic: 'Pola Bilangan'
    },
    {
        minGrade: 4,
        maxGrade: 6,
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
        minGrade: 3,
        maxGrade: 6,
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
    // --- KELAS 5 - 6 (FASE C) ---
    {
        minGrade: 5,
        maxGrade: 6,
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
        minGrade: 5,
        maxGrade: 6,
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
        minGrade: 3,
        maxGrade: 6,
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
        minGrade: 5,
        maxGrade: 6,
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
        minGrade: 4,
        maxGrade: 6,
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
        minGrade: 4,
        maxGrade: 6,
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
        minGrade: 5,
        maxGrade: 6,
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
        minGrade: 5,
        maxGrade: 6,
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
    // --- KELAS 1 - 2 (FASE A) ---
    {
        minGrade: 1,
        maxGrade: 2,
        stimulus: 'Perhatikan kalimat sederhana berikut: "budi bermain bola di halaman."',
        question: 'Huruf pertama di awal kalimat dan nama orang tersebut seharusnya ditulis menggunakan huruf ...',
        optionsFaseA: [
            { key: 'A', text: 'Huruf kapital (Budi)' },
            { key: 'B', text: 'Huruf kecil semua' },
            { key: 'C', text: 'Tanda tanya (?)' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Huruf kapital (Budi)' },
            { key: 'B', text: 'Huruf kecil semua' },
            { key: 'C', text: 'Tanda seru (!)' },
            { key: 'D', text: 'Huruf miring' }
        ],
        correctAnswer: 'A',
        explanation: 'Awal kalimat dan nama orang wajib ditulis dengan huruf kapital.',
        cognitiveLevel: 'LOTS',
        topic: 'Huruf Kapital Sederhana'
    },
    {
        minGrade: 1,
        maxGrade: 2,
        stimulus: 'Saat pensilmu terjatuh dan temanmu membantu mengambilkannya, kamu harus mengucapkan kata santun.',
        question: 'Ungkapan sopan yang tepat diucapkan kepada teman yang telah menolong kita adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Terima kasih banyak ya!' },
            { key: 'B', text: 'Permisi mau lewat.' },
            { key: 'C', text: 'Selamat tidur malam.' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Terima kasih banyak ya!' },
            { key: 'B', text: 'Permisi mau lewat.' },
            { key: 'C', text: 'Selamat pagi.' },
            { key: 'D', text: 'Tolong ambilkan lagi.' }
        ],
        correctAnswer: 'A',
        explanation: 'Ketika dibantu orang lain, kita mengucapkan "terima kasih" dengan santun.',
        cognitiveLevel: 'LOTS',
        topic: 'Ungkapan Santun'
    },
    {
        minGrade: 1,
        maxGrade: 2,
        stimulus: 'Perhatikan kalimat berikut: "Di mana rumah nenekmu [ ... ]"',
        question: 'Tanda baca yang tepat untuk melengkapi akhir kalimat tanya tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Tanda titik (.)' },
            { key: 'B', text: 'Tanda tanya (?)' },
            { key: 'C', text: 'Tanda koma (,)' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Tanda titik (.)' },
            { key: 'B', text: 'Tanda tanya (?)' },
            { key: 'C', text: 'Tanda seru (!)' },
            { key: 'D', text: 'Tanda koma (,)' }
        ],
        correctAnswer: 'B',
        explanation: 'Kalimat tanya selalu diakhiri dengan tanda tanya (?).',
        cognitiveLevel: 'LOTS',
        topic: 'Tanda Baca Dasar'
    },
    {
        minGrade: 1,
        maxGrade: 2,
        stimulus: 'Perhatikan penggalan kata berikut: "se - ko - lah".',
        question: 'Jumlah suku kata yang menyusun kata "sekolah" tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: '2 suku kata' },
            { key: 'B', text: '3 suku kata' },
            { key: 'C', text: '4 suku kata' }
        ],
        optionsFaseBC: [
            { key: 'A', text: '2 suku kata' },
            { key: 'B', text: '3 suku kata' },
            { key: 'C', text: '4 suku kata' },
            { key: 'D', text: '5 suku kata' }
        ],
        correctAnswer: 'B',
        explanation: 'Kata "sekolah" terdiri dari tiga suku kata yaitu se - ko - lah.',
        cognitiveLevel: 'LOTS',
        topic: 'Suku Kata'
    },
    // --- KELAS 3 - 6 ---
    {
        minGrade: 3,
        maxGrade: 6,
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
        minGrade: 3,
        maxGrade: 6,
        stimulus: 'Bacalah teks berikut:\n"Setiap pagi sebelum bel masuk berbunyi, para siswa melaksanakan kegiatan piket kebersihan. Ada yang menyapu lantai kelas, merapikan meja guru, dan membuang sampah ke tempatnya. Berkat kerja sama semua siswa, ruang kelas menjadi bersih dan nyaman untuk belajar."',
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
        minGrade: 2,
        maxGrade: 6,
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
        minGrade: 3,
        maxGrade: 6,
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
        minGrade: 3,
        maxGrade: 6,
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
        minGrade: 4,
        maxGrade: 6,
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
        minGrade: 1,
        maxGrade: 2,
        visualType: 'plant_anatomy',
        visualTitle: 'Perhatikan gambar bagian-bagian tumbuhan di bawah ini!',
        stimulus: 'Tanaman di halaman sekolah memiliki akar, batang, daun, dan bunga yang saling bekerja sama menjaga tumbuhan tetap segar.',
        question: 'Bagian tumbuhan yang berada di dalam tanah dan bertanda nomor (4) berguna untuk ...',
        optionsFaseA: [
            { key: 'A', text: 'Menyerap air dari dalam tanah' },
            { key: 'B', text: 'Menghasilkan kelopak bunga' },
            { key: 'C', text: 'Menangkap cahaya bulan di malam hari' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menyerap air dan zat hara dari tanah' },
            { key: 'B', text: 'Membentuk biji buah baru' },
            { key: 'C', text: 'Mengubah warna kelopak bunga' },
            { key: 'D', text: 'Menggugurkan daun di musim kemarau' }
        ],
        correctAnswer: 'A',
        explanation: 'Akar tumbuhan berada di dalam tanah untuk menyerap air serta memperkokoh berdirinya tanaman.',
        cognitiveLevel: 'LOTS',
        topic: 'Bagian Tumbuhan'
    },
    {
        minGrade: 1,
        maxGrade: 2,
        stimulus: 'Rafi mendengar suara bel masuk sekolah berbunyi nyaring dari ruang kelasnya.',
        question: 'Alat indra pada tubuh manusia yang digunakan untuk mendengar bunyi adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Mata' },
            { key: 'B', text: 'Telinga' },
            { key: 'C', text: 'Hidung' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Mata' },
            { key: 'B', text: 'Telinga' },
            { key: 'C', text: 'Hidung' },
            { key: 'D', text: 'Kulit' }
        ],
        correctAnswer: 'B',
        explanation: 'Telinga merupakan alat indra pendengaran pada tubuh manusia.',
        cognitiveLevel: 'LOTS',
        topic: 'Panca Indra'
    },
    {
        minGrade: 1,
        maxGrade: 2,
        stimulus: 'Di halaman rumah terdapat kucing, batu kerikil, pohon mangga, dan sepeda kayu.',
        question: 'Contoh makhluk hidup yang membutuhkan makanan dan dapat tumbuh besar adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Batu kerikil dan sepeda' },
            { key: 'B', text: 'Kucing dan pohon mangga' },
            { key: 'C', text: 'Sepeda dan batu kerikil' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Batu kerikil dan sepeda' },
            { key: 'B', text: 'Kucing dan pohon mangga' },
            { key: 'C', text: 'Kursi kayu dan bola' },
            { key: 'D', text: 'Sepatu dan tas sekolah' }
        ],
        correctAnswer: 'B',
        explanation: 'Hewan dan tumbuhan merupakan makhluk hidup yang bernapas, makan, dan tumbuh.',
        cognitiveLevel: 'LOTS',
        topic: 'Makhluk Hidup'
    },
    {
        minGrade: 1,
        maxGrade: 2,
        stimulus: 'Pada siang hari yang panas, sinar matahari terasa hangat menerangi halaman sekolah sehingga baju yang basah dapat cepat kering.',
        question: 'Sumber panas dan cahaya alami terbesar bagi kehidupan di bumi pada siang hari adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Lampu meja' },
            { key: 'B', text: 'Matahari' },
            { key: 'C', text: 'Lilin kecil' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Lampu meja' },
            { key: 'B', text: 'Matahari' },
            { key: 'C', text: 'Lilin kecil' },
            { key: 'D', text: 'Senter baterai' }
        ],
        correctAnswer: 'B',
        explanation: 'Matahari adalah sumber energi panas dan cahaya alami utama bagi bumi.',
        cognitiveLevel: 'LOTS',
        topic: 'Sumber Energi Sederhana'
    },
    {
        minGrade: 1,
        maxGrade: 2,
        stimulus: 'Air minum yang dituangkan ke dalam gelas memiliki bentuk mengikuti wadahnya dan dapat mengalir.',
        question: 'Air minum dan minyak goreng termasuk kelompok benda berwujud ...',
        optionsFaseA: [
            { key: 'A', text: 'Cair' },
            { key: 'B', text: 'Padat' },
            { key: 'C', text: 'Keras' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Cair' },
            { key: 'B', text: 'Padat' },
            { key: 'C', text: 'Gas' },
            { key: 'D', text: 'Kristal' }
        ],
        correctAnswer: 'A',
        explanation: 'Benda cair bentuknya selalu menyesuaikan tempatnya dan mengalir ke tempat rendah.',
        cognitiveLevel: 'LOTS',
        topic: 'Wujud Benda Sekitar'
    },
    {
        minGrade: 3,
        maxGrade: 6,
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
        minGrade: 3,
        maxGrade: 5,
        stimulus: 'Di pagi hari yang cerah, ibu menjemur pakaian basah di halaman rumah. Siang harinya pakaian tersebut sudah kering.',
        question: 'Perubahan wujud air yang ada pada pakaian basah menjadi uap air karena panas matahari disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Menguap' },
            { key: 'B', text: 'Membeku' },
            { key: 'C', text: 'Mencair' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menguap' },
            { key: 'B', text: 'Membeku' },
            { key: 'C', text: 'Mencair' },
            { key: 'D', text: 'Mengembun' }
        ],
        correctAnswer: 'A',
        explanation: 'Perubahan wujud dari benda cair menjadi gas (uap air) akibat pemanasan disebut menguap.',
        cognitiveLevel: 'LOTS',
        topic: 'Perubahan Wujud Benda'
    },
    {
        minGrade: 3,
        maxGrade: 5,
        stimulus: 'Dalam daur hidupnya, kupu-kupu mengalami empat tahap perubahan bentuk mulai dari telur, ulat (larva), kepompong (pupa), hingga menjadi kupu-kupu dewasa.',
        question: 'Urutan daur hidup kupu-kupu yang mengalami perubahan bentuk berbeda jauh di tiap fasenya disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Metamorfosis sempurna' },
            { key: 'B', text: 'Metamorfosis tidak sempurna' },
            { key: 'C', text: 'Fotosintesis' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Metamorfosis sempurna' },
            { key: 'B', text: 'Metamorfosis tidak sempurna' },
            { key: 'C', text: 'Tunas adventif' },
            { key: 'D', text: 'Simbiosis komensalisme' }
        ],
        correctAnswer: 'A',
        explanation: 'Kupu-kupu melewati fase pupa/kepompong dengan bentuk sangat berbeda dari larva, disebut metamorfosis sempurna.',
        cognitiveLevel: 'LOTS',
        topic: 'Daur Hidup Hewan'
    },
    {
        minGrade: 5,
        maxGrade: 6,
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
        minGrade: 5,
        maxGrade: 6,
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
        minGrade: 1,
        maxGrade: 5,
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
        minGrade: 3,
        maxGrade: 6,
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
        minGrade: 4,
        maxGrade: 6,
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
        minGrade: 5,
        maxGrade: 6,
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
        minGrade: 3,
        maxGrade: 6,
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
// 4B. QUESTION BANK: PJOK (SD FASE A-C)
// ==========================================
const PJOK_PG_BANK: QuestionBankItemPG[] = [
    {
        stimulus: 'Sebelum melakukan olahraga inti di lapangan sekolah, Pak Guru membimbing siswa melakukan peregangan otot tangan, leher, pinggang, dan kaki selama 10 menit.',
        question: 'Tujuan utama melakukan pemanasan sebelum berolahraga adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Agar cepat merasa lelah dan mengantuk' },
            { key: 'B', text: 'Melenturkan otot dan mencegah cedera saat olahraga' },
            { key: 'C', text: 'Membuat baju olahraga menjadi basah' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Membuat tubuh cepat kelelahan sebelum bertanding' },
            { key: 'B', text: 'Menaikkan suhu tubuh, melenturkan otot, dan mencegah cedera' },
            { key: 'C', text: 'Menurunkan detak jantung agar tubuh langsung tertidur' },
            { key: 'D', text: 'Mengurangi kelincahan dan keseimbangan tubuh' }
        ],
        correctAnswer: 'B',
        explanation: 'Pemanasan mempersiapkan otot, sendi, dan jantung sebelum aktivitas berat sehingga risiko cedera berkurang.',
        cognitiveLevel: 'LOTS',
        topic: 'Pemanasan dan Kebugaran'
    },
    {
        stimulus: 'Dalam pelajaran PJOK, Edo berlari cepat mengelilingi lapangan, lalu melompati rintangan kardus rendah, dan berjalan mundur menuju garis awal.',
        question: 'Gerakan berpindah tempat dari satu titik ke titik lain seperti berjalan, berlari, dan melompat termasuk gerak dasar ...',
        optionsFaseA: [
            { key: 'A', text: 'Gerak lokomotor' },
            { key: 'B', text: 'Gerak nonlokomotor' },
            { key: 'C', text: 'Gerak diam' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Gerak lokomotor' },
            { key: 'B', text: 'Gerak nonlokomotor' },
            { key: 'C', text: 'Gerak statis' },
            { key: 'D', text: 'Gerak pasif' }
        ],
        correctAnswer: 'A',
        explanation: 'Gerak lokomotor adalah gerak tubuh yang disertai perpindahan tempat, seperti berjalan, berlari, dan melompat.',
        cognitiveLevel: 'LOTS',
        topic: 'Gerak Dasar Lokomotor'
    },
    {
        stimulus: 'Siti berdiri tegak di tempat sambil memutar kedua bahu, membungkukkan badan menyentuh ujung kaki, dan mengayunkan kedua lengan tanpa berpindah posisi.',
        question: 'Gerakan menekuk, memutar, dan mengayunkan anggota tubuh tanpa berpindah tempat dinamakan gerak ...',
        optionsFaseA: [
            { key: 'A', text: 'Gerak lokomotor' },
            { key: 'B', text: 'Gerak nonlokomotor' },
            { key: 'C', text: 'Gerak manipulatif' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Gerak lokomotor' },
            { key: 'B', text: 'Gerak nonlokomotor' },
            { key: 'C', text: 'Gerak manipulatif' },
            { key: 'D', text: 'Gerak atletik' }
        ],
        correctAnswer: 'B',
        explanation: 'Gerak nonlokomotor dilakukan di tempat tanpa menyebabkan perpindahan posisi tubuh secara keseluruhan.',
        cognitiveLevel: 'LOTS',
        topic: 'Gerak Dasar Nonlokomotor'
    },
    {
        stimulus: 'Andi menendang bola ke arah teman, kemudian temannya menangkap dan memantulkan bola basket ke lantai.',
        question: 'Keterampilan gerak yang melibatkan penggunaan alat atau objek tertentu seperti bola dan raket disebut gerak ...',
        optionsFaseA: [
            { key: 'A', text: 'Lokomotor' },
            { key: 'B', text: 'Nonlokomotor' },
            { key: 'C', text: 'Manipulatif' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Lokomotor' },
            { key: 'B', text: 'Nonlokomotor' },
            { key: 'C', text: 'Manipulatif' },
            { key: 'D', text: 'Ritmik' }
        ],
        correctAnswer: 'C',
        explanation: 'Gerak manipulatif adalah gerak dasar menguasai atau menggerakkan objek/alat, misalnya melempar, menangkap, dan menendang bola.',
        cognitiveLevel: 'LOTS',
        topic: 'Gerak Dasar Manipulatif'
    },
    {
        stimulus: 'Dalam permainan sepak bola antar kelas, seorang pemain mengoper bola jarak pendek dan datar kepada rekan setimnya yang berdiri di dekatnya.',
        question: 'Bagian kaki yang paling tepat dan akurat digunakan untuk mengumpan (passing) bola jarak pendek adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Ujung jari kaki' },
            { key: 'B', text: 'Kaki bagian dalam' },
            { key: 'C', text: 'Tumit kaki belakang' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Ujung jari kaki depan' },
            { key: 'B', text: 'Kaki bagian dalam' },
            { key: 'C', text: 'Tumit bagian belakang' },
            { key: 'D', text: 'Telapak lutut kaki' }
        ],
        correctAnswer: 'B',
        explanation: 'Kaki bagian dalam memiliki permukaan kontak yang luas dan rata sehingga kontrol arah umpan menjadi sangat akurat.',
        cognitiveLevel: 'MOTS',
        topic: 'Permainan Bola Besar (Sepak Bola)'
    },
    {
        stimulus: 'Saat bermain bola voli mini, bola datang melambung rendah setinggi pinggang ke arah Lani. Ia merapatkan kedua lengan lurus ke depan dan memantulkan bola ke atas.',
        question: 'Teknik dasar permainan bola voli yang dipraktikkan oleh Lani tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Passing bawah' },
            { key: 'B', text: 'Smes keras' },
            { key: 'C', text: 'Blok net' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Passing bawah' },
            { key: 'B', text: 'Passing atas' },
            { key: 'C', text: 'Servis lompat' },
            { key: 'D', text: 'Blocking di atas net' }
        ],
        correctAnswer: 'A',
        explanation: 'Passing bawah dilakukan dengan merapatkan kedua lengan lurus ke depan untuk menerima bola yang datang rendah atau servis.',
        cognitiveLevel: 'MOTS',
        topic: 'Permainan Bola Besar (Voli)'
    },
    {
        stimulus: 'Pada pertandingan bola basket, Beni menggiring bola sambil berlari melewati lawan lalu mengoper bola datar setinggi dada kepada rekannya.',
        question: 'Teknik mengoper bola basket lurus setinggi dada dengan kedua tangan disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Bounce pass' },
            { key: 'B', text: 'Chest pass' },
            { key: 'C', text: 'Overhead pass' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Bounce pass (umpan pantul)' },
            { key: 'B', text: 'Chest pass (umpan setinggi dada)' },
            { key: 'C', text: 'Overhead pass (umpan di atas kepala)' },
            { key: 'D', text: 'Lay up shoot' }
        ],
        correctAnswer: 'B',
        explanation: 'Chest pass adalah umpan datar cepat yang didorong dari depan dada menggunakan kedua tangan menuju dada rekan setim.',
        cognitiveLevel: 'MOTS',
        topic: 'Permainan Bola Besar (Basket)'
    },
    {
        stimulus: 'Siswa kelas melaksanakan permainan bola kasti di halaman sekolah. Setiap regu secara bergantian bertugas sebagai regu pemukul dan regu penjaga.',
        question: 'Gerak dasar utama yang wajib dikuasai agar berhasil bermain kasti dengan baik adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Menendang, menyundul, dan menggiring' },
            { key: 'B', text: 'Melempar, menangkap, dan memukul bola' },
            { key: 'C', text: 'Meluncur, mengayuh, dan menyelam' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menendang, menyundul, dan melempar ke dalam' },
            { key: 'B', text: 'Melempar, menangkap, dan memukul bola' },
            { key: 'C', text: 'Servis atas, smash, dan membendung net' },
            { key: 'D', text: 'Tolakan, melayang di udara, dan mendarat' }
        ],
        correctAnswer: 'B',
        explanation: 'Permainan bola kecil kasti mengandalkan kombinasi gerak melempar, menangkap, dan memukul bola serta berlari menuju tiang hinggap.',
        cognitiveLevel: 'LOTS',
        topic: 'Permainan Bola Kecil (Kasti)'
    },
    {
        stimulus: 'Dalam perlombaan atletik cabang lari jarak pendek (sprint) 60 meter, peserta berada di belakang garis start menunggu aba-aba dari wasit.',
        question: 'Jenis start yang paling tepat digunakan pada perlombaan lari jarak pendek adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Start berdiri' },
            { key: 'B', text: 'Start jongkok' },
            { key: 'C', text: 'Start melayang' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Start berdiri (standing start)' },
            { key: 'B', text: 'Start jongkok (crouch start)' },
            { key: 'C', text: 'Start melayang (flying start)' },
            { key: 'D', text: 'Start berjalan santai' }
        ],
        correctAnswer: 'B',
        explanation: 'Start jongkok memberi tolakan awal yang kuat sehingga pelari jarak pendek dapat langsung mencapai kecepatan maksimal.',
        cognitiveLevel: 'LOTS',
        topic: 'Atletik (Lari Cepat)'
    },
    {
        stimulus: 'Tono berlatih lompat jauh di bak pasir sekolah. Setelah berlari cepat pada lintasan awalan, ia menolak sekuat tenaga tepat di papan tumpu.',
        question: 'Tumpuan kaki yang benar saat melakukan tolakan pada papan tumpu lompat jauh menggunakan ...',
        optionsFaseA: [
            { key: 'A', text: 'Satu kaki yang paling kuat' },
            { key: 'B', text: 'Kedua kaki secara bersamaan' },
            { key: 'C', text: 'Kedua tangan menumpu ke tanah' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Satu kaki terkuat secara eksplosif' },
            { key: 'B', text: 'Kedua kaki dirapatkan bersamaan' },
            { key: 'C', text: 'Tumit belakang tanpa menekuk lutut' },
            { key: 'D', text: 'Melompat mundur ke belakang papan' }
        ],
        correctAnswer: 'A',
        explanation: 'Tolakan lompat jauh dilakukan dengan satu kaki terkuat agar momentum lari berubah optimal menjadi lompatan jauh ke depan atas.',
        cognitiveLevel: 'MOTS',
        topic: 'Atletik (Lompat Jauh)'
    },
    {
        stimulus: 'Dalam latihan seni bela diri pencak silat, pesilat berdiri dengan kedua kaki ditekuk kuat dan jarak kaki melebar untuk menjaga keseimbangan tubuh.',
        question: 'Posisi dasar menapakkan kaki untuk memperkokoh tubuh saat menyerang atau bertahan dalam pencak silat disebut sikap ...',
        optionsFaseA: [
            { key: 'A', text: 'Sikap lilin' },
            { key: 'B', text: 'Sikap kuda-kuda' },
            { key: 'C', text: 'Sikap kayang' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Sikap pasang lilin' },
            { key: 'B', text: 'Sikap kuda-kuda' },
            { key: 'C', text: 'Sikap melayang' },
            { key: 'D', text: 'Sikap jongkok senam' }
        ],
        correctAnswer: 'B',
        explanation: 'Sikap kuda-kuda adalah posisi dasar kaki dalam pencak silat untuk menjaga keseimbangan dan kekuatan tumpuan.',
        cognitiveLevel: 'LOTS',
        topic: 'Bela Diri Pencak Silat'
    },
    {
        stimulus: 'Di atas matras senam lantai, Udin meletakkan kedua telapak tangan di matras, menundukkan dagu hingga menyentuh dada, lalu menggulingkan badan ke depan.',
        question: 'Bagian tubuh yang pertama kali menyentuh matras setelah kedua tangan menumpu pada gerakan guling depan (forward roll) adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Tengkuk atau punggung atas' },
            { key: 'B', text: 'Ubun-ubun kepala bagian tengah' },
            { key: 'C', text: 'Dahi dan hidung' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Tengkuk dan bahu bagian atas' },
            { key: 'B', text: 'Ubun-ubun kepala bagian atas' },
            { key: 'C', text: 'Dahi dan tulang wajah' },
            { key: 'D', text: 'Kedua lutut secara langsung' }
        ],
        correctAnswer: 'A',
        explanation: 'Menempelkan dagu ke dada melindungi leher agar bagian tengkuk dan bahu atas mendarat mulus di matras, bukan ubun-ubun.',
        cognitiveLevel: 'HOTS',
        topic: 'Senam Lantai'
    },
    {
        stimulus: 'Setiap pagi hari Jumat, seluruh siswa mengikuti kegiatan senam kesegaran jasmani di halaman sekolah dengan iringan musik yang ceria.',
        question: 'Unsur penting yang membedakan aktivitas gerak berirama (senam irama) dengan senam biasa adalah keserasian gerak dengan ...',
        optionsFaseA: [
            { key: 'A', text: 'Irama musik atau ketukan hitungan' },
            { key: 'B', text: 'Jumlah penonton yang hadir' },
            { key: 'C', text: 'Warna sepatu yang dipakai' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Irama musik, ketukan, atau nyanyian' },
            { key: 'B', text: 'Berat badan masing-masing peserta' },
            { key: 'C', text: 'Luas lapangan upacara' },
            { key: 'D', text: 'Kecepatan lari paling kencang' }
        ],
        correctAnswer: 'A',
        explanation: 'Senam irama menekankan keluwesan, kontinuitas, dan ketepatan gerakan tubuh mengikuti irama musik atau ketukan.',
        cognitiveLevel: 'LOTS',
        topic: 'Aktivitas Gerak Berirama'
    },
    {
        stimulus: 'Untuk mengukur kekuatan dan daya tahan otot lengan serta dada, guru PJOK meminta siswa melakukan gerakan naik-turun tubuh bertumpu pada kedua telapak tangan dan ujung jari kaki.',
        question: 'Bentuk latihan kebugaran jasmani untuk melatih kekuatan otot lengan dan bahu tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Sit-up' },
            { key: 'B', text: 'Push-up' },
            { key: 'C', text: 'Lari maraton' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Sit-up' },
            { key: 'B', text: 'Push-up' },
            { key: 'C', text: 'Back-up' },
            { key: 'D', text: 'Lari jarak jauh' }
        ],
        correctAnswer: 'B',
        explanation: 'Push-up melatih kekuatan otot lengan, bahu, dan dada, sedangkan sit-up melatih otot perut.',
        cognitiveLevel: 'LOTS',
        topic: 'Kebugaran Jasmani'
    },
    {
        stimulus: 'Saat berlatih renang gaya dada (gaya katak) di kolam renang dangkal, siswa diajarkan melakukan gerak meluncur, kayuhan tangan, dan tendangan kaki secara berirama.',
        question: 'Cara mengambil napas yang benar saat berenang gaya dada adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Menghirup udara melalui mulut saat kepala diangkat ke atas permukaan air' },
            { key: 'B', text: 'Menghirup air kolam melalui hidung di dalam air' },
            { key: 'C', text: 'Menahan napas terus menerus hingga selesai satu putaran' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menghirup udara melalui mulut ketika kepala diangkat ke permukaan dan menghembuskan di dalam air' },
            { key: 'B', text: 'Menghirup udara melalui hidung saat wajah berada di dalam air' },
            { key: 'C', text: 'Membuka mulut lebar saat menyelam di dasar kolam' },
            { key: 'D', text: 'Berhenti di tengah kolam dan menengadah ke samping terus-menerus' }
        ],
        correctAnswer: 'A',
        explanation: 'Dalam renang gaya dada, perenang menghirup udara lewat mulut saat kepala terangkat dan membuangnya perlahan di dalam air.',
        cognitiveLevel: 'MOTS',
        topic: 'Aktivitas Air / Renang'
    },
    {
        stimulus: 'Ketika sedang bermain di halaman sekolah, lutut Rina terjatuh dan mengalami luka lecet ringan yang sedikit berdarah.',
        question: 'Langkah pertolongan pertama (P3K) yang paling tepat dilakukan terhadap luka lecet tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Membersihkan luka dengan air bersih mengalir lalu mengoleskan antiseptik' },
            { key: 'B', text: 'Menutup luka langsung dengan tanah agar darah cepat kering' },
            { key: 'C', text: 'Membiarkan luka kotor terkena debu lapangan' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Membersihkan luka dengan air bersih mengalir, mengoleskan cairan antiseptik, lalu menutupnya dengan plester steril' },
            { key: 'B', text: 'Menaburkan pasir atau debu pada luka untuk menghentikan darah' },
            { key: 'C', text: 'Menggosok luka keras-keras dengan kain kotor' },
            { key: 'D', text: 'Membiarkan luka terbuka tanpa dibersihkan sama sekali' }
        ],
        correctAnswer: 'A',
        explanation: 'Membersihkan luka dengan air mengalir dan antiseptik mencegah infeksi kuman sebelum ditutup perban atau plester bersih.',
        cognitiveLevel: 'HOTS',
        topic: 'Kesehatan dan P3K'
    },
    {
        stimulus: 'Dalam penyuluhan kesehatan di sekolah, petugas puskesmas menjelaskan bahaya kebiasaan merokok dan zat adiktif (NAPZA) bagi pelajar.',
        question: 'Dampak buruk zat nikotin dan tar dalam asap rokok bagi kesehatan tubuh manusia terutama merusak organ ...',
        optionsFaseA: [
            { key: 'A', text: 'Paru-paru dan jantung' },
            { key: 'B', text: 'Kuku jari kaki' },
            { key: 'C', text: 'Rambut kepala' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Organ pernapasan (paru-paru) dan sistem peredaran darah (jantung)' },
            { key: 'B', text: 'Pertumbuhan rambut dan kuku jari saja' },
            { key: 'C', text: 'Kekuatan tulang lutut saat berjalan' },
            { key: 'D', text: 'Kemampuan mendengar suara jauh' }
        ],
        correctAnswer: 'A',
        explanation: 'Zat beracun pada asap rokok merusak jaringan paru-paru dan mengganggu kerja jantung serta pembuluh darah.',
        cognitiveLevel: 'MOTS',
        topic: 'Pencegahan Bahaya Rokok & NAPZA'
    },
    {
        stimulus: 'Setelah seluruh rangkaian permainan dan latihan atletik selesai, guru mengajak siswa berjalan santai sambil mengatur napas panjang dan melemaskan otot.',
        question: 'Manfaat melakukan gerakan pendinginan (cooling down) setelah berolahraga adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Mengembalikan detak jantung dan suhu tubuh secara bertahap menjadi normal' },
            { key: 'B', text: 'Meningkatkan ketegangan otot agar semakin kaku' },
            { key: 'C', text: 'Memulai pertandingan ulang dari awal' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menurunkan detak jantung, suhu tubuh, serta mengurangi rasa pegal dan kekakuan otot' },
            { key: 'B', text: 'Membuat denyut nadi semakin cepat memuncak' },
            { key: 'C', text: 'Menghentikan aliran darah menuju otak secara mendadak' },
            { key: 'D', text: 'Menambah kelelahan berat pada otot betis' }
        ],
        correctAnswer: 'A',
        explanation: 'Pendinginan membantu tubuh bertransisi kembali ke kondisi istirahat dengan lancar dan mencegah kram atau pusing setelah olahraga.',
        cognitiveLevel: 'MOTS',
        topic: 'Pendinginan Olahraga'
    }
];

// ==========================================
// 4C. QUESTION BANK: SENI BUDAYA (RUPA, MUSIK, TARI, TEATER)
// ==========================================
const SENI_PG_BANK: QuestionBankItemPG[] = [
    {
        stimulus: 'Dalam pelajaran seni rupa, siswa mencampurkan cat air warna merah dengan warna kuning di atas palet sehingga muncul warna baru.',
        question: 'Warna dasar asli yang tidak dapat diperoleh dari pencampuran warna lain (merah, kuning, biru) disebut warna ...',
        optionsFaseA: [
            { key: 'A', text: 'Warna primer' },
            { key: 'B', text: 'Warna sekunder' },
            { key: 'C', text: 'Warna tersier' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Warna primer' },
            { key: 'B', text: 'Warna sekunder' },
            { key: 'C', text: 'Warna tersier' },
            { key: 'D', text: 'Warna netral' }
        ],
        correctAnswer: 'A',
        explanation: 'Warna primer terdiri atas merah, kuning, dan biru sebagai warna dasar pembentuk warna-warna lainnya.',
        cognitiveLevel: 'LOTS',
        topic: 'Unsur Warna Seni Rupa'
    },
    {
        stimulus: 'Dayu membuat gambar dekoratif pemandangan dengan menyusun unsur titik, garis lurus, garis lengkung, dan bidang lingkaran.',
        question: 'Unsur seni rupa paling sederhana yang menjadi awal terbentuknya sebuah garis dan bidang gambar adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Titik' },
            { key: 'B', text: 'Tekstur' },
            { key: 'C', text: 'Gelap terang' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Titik' },
            { key: 'B', text: 'Ruang tiga dimensi' },
            { key: 'C', text: 'Tekstur kasar' },
            { key: 'D', text: 'Gelap terang' }
        ],
        correctAnswer: 'A',
        explanation: 'Titik adalah unsur seni rupa paling dasar; kumpulan titik yang berderet akan membentuk garis.',
        cognitiveLevel: 'LOTS',
        topic: 'Unsur Seni Rupa'
    },
    {
        stimulus: 'Siswa kelas membuat karya kerajinan tangan dengan cara menempelkan potongan kertas warna, daun kering, dan biji-bijian pada pola gambar.',
        question: 'Karya seni rupa menempelkan berbagai potongan bahan (biji-bijian, daun kering, atau kertas) pada satu permukaan gambar disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Kolase' },
            { key: 'B', text: 'Patung pahat' },
            { key: 'C', text: 'Lukisan basah' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Kolase' },
            { key: 'B', text: 'Seni pahat patung' },
            { key: 'C', text: 'Seni grafis cetak saring' },
            { key: 'D', text: 'Relief batu candi' }
        ],
        correctAnswer: 'A',
        explanation: 'Kolase adalah teknik karya seni tempel yang memadukan berbagai jenis bahan berbeda di atas satu bidang gambar.',
        cognitiveLevel: 'MOTS',
        topic: 'Karya Seni Rupa 2D'
    },
    {
        stimulus: 'Saat mengamati patung tanah liat dan kendi keramik di museum daerah, pengrajin menunjukkan bahwa benda tersebut memiliki ukuran panjang, lebar, dan tinggi.',
        question: 'Karya seni rupa yang memiliki tiga ukuran ruang (panjang, lebar, dan tinggi/volume) sehingga dapat dilihat dari berbagai arah disebut karya ...',
        optionsFaseA: [
            { key: 'A', text: 'Dua dimensi' },
            { key: 'B', text: 'Tiga dimensi' },
            { key: 'C', text: 'Satu dimensi' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Karya seni dua dimensi (dwimatra)' },
            { key: 'B', text: 'Karya seni tiga dimensi (trimatra)' },
            { key: 'C', text: 'Karya gambar sketsa datar' },
            { key: 'D', text: 'Karya ilustrasi poster' }
        ],
        correctAnswer: 'B',
        explanation: 'Karya seni tiga dimensi memiliki isi/volume dan dapat dinikmati keindahannya dari depan, samping, maupun belakang.',
        cognitiveLevel: 'LOTS',
        topic: 'Karya Seni Rupa 3D'
    },
    {
        stimulus: 'Dalam latihan paduan suara menyanyikan lagu "Hari Merdeka" dengan semangat, dirigen mengarahkan penyanyi untuk bernyanyi cepat dan lantang.',
        question: 'Istilah untuk cepat atau lambatnya lagu dinyanyikan dalam seni musik disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Tempo' },
            { key: 'B', text: 'Nada dasar' },
            { key: 'C', text: 'Lirik lagu' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Tempo lagu' },
            { key: 'B', text: 'Harmoni akor' },
            { key: 'C', text: 'Warna suara (timbre)' },
            { key: 'D', text: 'Notasi balok' }
        ],
        correctAnswer: 'A',
        explanation: 'Tempo adalah ukuran kecepatan dalam birama lagu (cepat, sedang, atau lambat), sedangkan dinamika adalah keras-lembut suara.',
        cognitiveLevel: 'LOTS',
        topic: 'Unsur Musik (Tempo)'
    },
    {
        stimulus: 'Kelompok musik kelas memainkan alat musik rekorder, pianika, gendang, dan tamborin secara bersama-sama mengiringi lagu daerah.',
        question: 'Alat musik yang tidak memiliki nada (berfungsi mengatur ketukan irama) seperti gendang, drum, dan tamborin disebut alat musik ...',
        optionsFaseA: [
            { key: 'A', text: 'Alat musik ritmis' },
            { key: 'B', text: 'Alat musik melodis' },
            { key: 'C', text: 'Alat musik gesek' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Alat musik ritmis' },
            { key: 'B', text: 'Alat musik melodis' },
            { key: 'C', text: 'Alat musik harmonis' },
            { key: 'D', text: 'Alat musik elektronik' }
        ],
        correctAnswer: 'A',
        explanation: 'Alat musik ritmis tidak membunyikan nada do-re-mi melainkan berfungsi menjaga ketukan dan irama musik.',
        cognitiveLevel: 'LOTS',
        topic: 'Alat Musik Ritmis dan Melodis'
    },
    {
        stimulus: 'Lagu daerah "Yamko Rambe Yamko" dari Papua dinyanyikan dengan penuh keceriaan, sedangkan lagu "Syukur" dinyanyikan dengan khidmat.',
        question: 'Tangga nada diatonis yang bersifat gembira, riang, dan bersemangat dinamakan tangga nada ...',
        optionsFaseA: [
            { key: 'A', text: 'Diatonis mayor' },
            { key: 'B', text: 'Diatonis minor' },
            { key: 'C', text: 'Pentatonis sedih' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Tangga nada diatonis mayor' },
            { key: 'B', text: 'Tangga nada diatonis minor' },
            { key: 'C', text: 'Tangga nada kromatis bebas' },
            { key: 'D', text: 'Tangga nada slendro sedih' }
        ],
        correctAnswer: 'A',
        explanation: 'Tangga nada diatonis mayor berjarak 1-1-1/2-1-1-1-1/2 dan lazimnya bernuansa riang gembira serta bersemangat.',
        cognitiveLevel: 'MOTS',
        topic: 'Tangga Nada Musik'
    },
    {
        stimulus: 'Pada pementasan tari kreasi di aula sekolah, enam orang penari berbaris membentuk garis lurus sejajar dari depan ke belakang lalu berubah membentuk lingkaran.',
        question: 'Garis imajiner di atas lantai panggung yang dilalui dan dibentuk oleh formasi para penari disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Pola lantai' },
            { key: 'B', text: 'Kostum tari' },
            { key: 'C', text: 'Iringan musik' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Pola lantai tari' },
            { key: 'B', text: 'Tata rias wajah' },
            { key: 'C', text: 'Properti panggung' },
            { key: 'D', text: 'Durasi pertunjukan' }
        ],
        correctAnswer: 'A',
        explanation: 'Pola lantai (horizontal, vertikal, diagonal, melingkar) memperindah komposisi kelompok penari di panggung.',
        cognitiveLevel: 'LOTS',
        topic: 'Pola Lantai Seni Tari'
    },
    {
        stimulus: 'Seorang penari membawakan tari tradisional dengan gerak tubuh yang luwes, selaras dengan tabuhan gamelan, dan menghayati makna tarian.',
        question: 'Tiga unsur utama keindahan dalam seni tari Nusantara yang dikenal sebagai Wiraga, Wirama, dan Wirasa secara berurutan berarti ...',
        optionsFaseA: [
            { key: 'A', text: 'Gerak tubuh, irama musik, dan penghayatan rasa' },
            { key: 'B', text: 'Panggung, lampu sorot, dan penonton' },
            { key: 'C', text: 'Selendang, kipas, dan mahkota' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Keterampilan gerak raga, kesesuaian irama, dan penghayatan ekspresi rasa' },
            { key: 'B', text: 'Tata panggung, pencahayaan lampu, dan dekorasi latar' },
            { key: 'C', text: 'Ukuran panggung, harga tiket, dan jumlah penari' },
            { key: 'D', text: 'Alat musik tiup, petik, dan pukul' }
        ],
        correctAnswer: 'A',
        explanation: 'Wiraga berarti penguasaan gerak tubuh, Wirama berarti keselarasan dengan irama, dan Wirasa berarti penjiwaan emosi tarian.',
        cognitiveLevel: 'MOTS',
        topic: 'Unsur Utama Seni Tari'
    },
    {
        stimulus: 'Dalam pertunjukan seni teater di sekolah, seorang pemain tampil seorang diri di atas panggung tanpa mengeluarkan sepatah kata pun, hanya mengandalkan ekspresi wajah dan gerak tubuh.',
        question: 'Seni pertunjukan teater tanpa dialog kata-kata yang mengandalkan olah gerak tubuh dan ekspresi mimik wajah dinamakan ...',
        optionsFaseA: [
            { key: 'A', text: 'Pantomim' },
            { key: 'B', text: 'Paduan suara' },
            { key: 'C', text: 'Orkestra musik' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Pantomim' },
            { key: 'B', text: 'Deklamasi puisi' },
            { key: 'C', text: 'Sendratari suara' },
            { key: 'D', text: 'Opera bernyanyi' }
        ],
        correctAnswer: 'A',
        explanation: 'Pantomim menyampaikan cerita dan emosi murni melalui gestur, bahasa tubuh, dan mimik wajah tanpa kata terucap.',
        cognitiveLevel: 'LOTS',
        topic: 'Seni Teater (Pantomim)'
    },
    {
        stimulus: 'Edo berlatih membacakan naskah drama bertema persahabatan. Ia berlatih mengatur kejelasan pengucapan huruf vokal dan konsonan serta tinggi-rendah suara.',
        question: 'Kejelasan pengucapan kata dan huruf oleh pemeran teater agar terdengar jelas oleh penonton disebut latihan ...',
        optionsFaseA: [
            { key: 'A', text: 'Artikulasi' },
            { key: 'B', text: 'Koreografi' },
            { key: 'C', text: 'Aransemen' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Artikulasi vokal' },
            { key: 'B', text: 'Koreografi tari' },
            { key: 'C', text: 'Komposisi warna' },
            { key: 'D', text: 'Perspektif gambar' }
        ],
        correctAnswer: 'A',
        explanation: 'Artikulasi adalah kejelasan pelafalan kata dan suku kata dalam seni peran/teater maupun olah vokal.',
        cognitiveLevel: 'MOTS',
        topic: 'Teknik Pemeranan Teater'
    },
    {
        stimulus: 'Pengrajin batik di daerah pesisir menggambar motif di atas kain mori putih menggunakan alat canting berisi malam (lilin cair panas).',
        question: 'Karya seni rupa terapan khas Indonesia yang telah diakui UNESCO sebagai warisan budaya dunia tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Batik tulis' },
            { key: 'B', text: 'Lukisan akrilik' },
            { key: 'C', text: 'Origami kertas' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Batik tulis tradisional' },
            { key: 'B', text: 'Lukisan kanvas minyak' },
            { key: 'C', text: 'Seni lipat kertas origami' },
            { key: 'D', text: 'Kerajinan gips cetak' }
        ],
        correctAnswer: 'A',
        explanation: 'Batik tulis dibuat dengan menorehkan lilin malam panas memakai canting pada kain sebagai teknik perintang warna.',
        cognitiveLevel: 'LOTS',
        topic: 'Kriya dan Budaya Nusantara'
    },
    {
        stimulus: 'Ketika menggambar poster bertema "Ayo Hemat Energi Listrik!", Rani memadukan huruf judul yang besar dan gambar lampu yang jelas agar seimbang.',
        question: 'Prinsip seni rupa yang mengatur susunan objek gambar di sisi kiri dan kanan agar tampak harmonis serta tidak berat sebelah adalah prinsip ...',
        optionsFaseA: [
            { key: 'A', text: 'Keseimbangan (balance)' },
            { key: 'B', text: 'Pengulangan acak' },
            { key: 'C', text: 'Kekacauan bentuk' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Keseimbangan (balance)' },
            { key: 'B', text: 'Ketidakserasian ukuran' },
            { key: 'C', text: 'Kesuraman warna' },
            { key: 'D', text: 'Kerumitan sketsa' }
        ],
        correctAnswer: 'A',
        explanation: 'Keseimbangan (simetris maupun asimetris) menjaga bobot visual karya gambar agar nyaman dan enak dipandang.',
        cognitiveLevel: 'MOTS',
        topic: 'Prinsip Seni Rupa'
    },
    {
        stimulus: 'Tari Saman yang berasal dari Provinsi Aceh dimainkan oleh sekelompok penari yang duduk berbanjar rapat sambil menepuk dada dan tangan secara serempak.',
        question: 'Ciri utama pola lantai yang digunakan dalam pementasan Tari Saman adalah pola lantai ...',
        optionsFaseA: [
            { key: 'A', text: 'Garis lurus horizontal' },
            { key: 'B', text: 'Lingkaran besar terpisah' },
            { key: 'C', text: 'Angka delapan acak' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Garis lurus horizontal (berjajar ke samping)' },
            { key: 'B', text: 'Lingkaran besar berputar-putar' },
            { key: 'C', text: 'Spiral acak tanpa barisan' },
            { key: 'D', text: 'Garis zig-zag berdiri berjauhan' }
        ],
        correctAnswer: 'A',
        explanation: 'Tari Saman khas Aceh terkenal dengan kekompakan gerak penari yang duduk berjajar rapi membentuk pola lantai garis lurus horizontal.',
        cognitiveLevel: 'HOTS',
        topic: 'Tari Daerah Nusantara'
    }
];

// ==========================================
// 4D. QUESTION BANK: BAHASA INGGRIS (SD FASE A-C)
// ==========================================
const INGGRIS_PG_BANK: QuestionBankItemPG[] = [
    {
        stimulus: 'Read the short dialogue carefully!\nSiti: "Good morning, Mr. Ahmad. How are you today?"\nMr. Ahmad: "Good morning, Siti. I am very well, thank you."',
        question: 'What time of the day does the conversation happen?',
        optionsFaseA: [
            { key: 'A', text: 'In the morning' },
            { key: 'B', text: 'In the evening' },
            { key: 'C', text: 'At midnight' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'In the morning' },
            { key: 'B', text: 'In the afternoon' },
            { key: 'C', text: 'In the evening' },
            { key: 'D', text: 'At midnight' }
        ],
        correctAnswer: 'A',
        explanation: 'Ungkapan "Good morning" digunakan untuk menyapa pada pagi hari.',
        cognitiveLevel: 'LOTS',
        topic: 'Greetings and Introductions'
    },
    {
        stimulus: 'Look at the classroom description: "Beni puts his red pencil case inside his blue school bag, and puts his dictionary on the wooden desk."',
        question: 'Where is Beni’s dictionary located?',
        optionsFaseA: [
            { key: 'A', text: 'Under the chair' },
            { key: 'B', text: 'On the wooden desk' },
            { key: 'C', text: 'Behind the door' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Under the wooden desk' },
            { key: 'B', text: 'On the wooden desk' },
            { key: 'C', text: 'Inside the blue school bag' },
            { key: 'D', text: 'Beside the whiteboard' }
        ],
        correctAnswer: 'B',
        explanation: 'Teks menyatakan "...puts his dictionary on the wooden desk" yang berarti di atas meja kayu.',
        cognitiveLevel: 'LOTS',
        topic: 'Prepositions of Place'
    },
    {
        stimulus: 'Read the sentence: "Every Sunday morning, Lani and her brother ... badminton together in the park."',
        question: 'The correct verb to complete the daily habit sentence is ...',
        optionsFaseA: [
            { key: 'A', text: 'play' },
            { key: 'B', text: 'plays' },
            { key: 'C', text: 'played' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'play' },
            { key: 'B', text: 'plays' },
            { key: 'C', text: 'playing' },
            { key: 'D', text: 'is play' }
        ],
        correctAnswer: 'A',
        explanation: 'Subjek jamak "Lani and her brother" dalam Simple Present Tense menggunakan kata kerja dasar tanpa -s (play).',
        cognitiveLevel: 'MOTS',
        topic: 'Simple Present Tense'
    },
    {
        stimulus: 'Dialogue at the canteen:\nEdo: "Do you like fried rice or chicken noodles, Dayu?"\nDayu: "I like chicken noodles, because it is very delicious."',
        question: 'What food does Dayu prefer to eat?',
        optionsFaseA: [
            { key: 'A', text: 'Fried rice' },
            { key: 'B', text: 'Chicken noodles' },
            { key: 'C', text: 'Bread and jam' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Fried rice' },
            { key: 'B', text: 'Chicken noodles' },
            { key: 'C', text: 'Meatball soup' },
            { key: 'D', text: 'Fried banana' }
        ],
        correctAnswer: 'B',
        explanation: 'Dayu menjawab "I like chicken noodles" (mi ayam).',
        cognitiveLevel: 'LOTS',
        topic: 'Food and Drinks Preferences'
    },
    {
        stimulus: 'Look at the number calculation in English: "Rina has twelve apples and buys eight more apples from the fruit stall."',
        question: 'How many apples does Rina have in total?',
        optionsFaseA: [
            { key: 'A', text: 'Eighteen' },
            { key: 'B', text: 'Twenty' },
            { key: 'C', text: 'Sixteen' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Eighteen (18)' },
            { key: 'B', text: 'Nineteen (19)' },
            { key: 'C', text: 'Twenty (20)' },
            { key: 'D', text: 'Twenty-two (22)' }
        ],
        correctAnswer: 'C',
        explanation: 'Twelve (12) + eight (8) = twenty (20).',
        cognitiveLevel: 'MOTS',
        topic: 'Numbers and Counting'
    },
    {
        stimulus: 'Read the short passage about an animal: "I am a tall wild animal from Africa. I have a very long neck so I can eat fresh leaves on top of tall trees."',
        question: 'Which animal is described in the passage?',
        optionsFaseA: [
            { key: 'A', text: 'An elephant' },
            { key: 'B', text: 'A giraffe' },
            { key: 'C', text: 'A rabbit' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'An elephant' },
            { key: 'B', text: 'A giraffe' },
            { key: 'C', text: 'A crocodile' },
            { key: 'D', text: 'A kangaroo' }
        ],
        correctAnswer: 'B',
        explanation: 'Hewan tinggi berleher sangat panjang pemakan daun di pucuk pohon adalah jerapah (giraffe).',
        cognitiveLevel: 'LOTS',
        topic: 'Descriptive Text (Animals)'
    },
    {
        stimulus: 'Complete the past activity sentence: "Yesterday afternoon, Budi ... his homework carefully before playing with his friends."',
        question: 'The correct past tense verb for "yesterday afternoon" is ...',
        optionsFaseA: [
            { key: 'A', text: 'finished' },
            { key: 'B', text: 'finishes' },
            { key: 'C', text: 'finishing' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'finished' },
            { key: 'B', text: 'finishes' },
            { key: 'C', text: 'finish' },
            { key: 'D', text: 'will finish' }
        ],
        correctAnswer: 'A',
        explanation: 'Keterangan waktu lampau "Yesterday afternoon" menggunakan kata kerja bentuk lampau (Verb 2: finished).',
        cognitiveLevel: 'MOTS',
        topic: 'Simple Past Tense'
    },
    {
        stimulus: 'Look at the school notice: "PLEASE KEEP SILENT IN THE LIBRARY!"',
        question: 'What does the notice mean for students?',
        optionsFaseA: [
            { key: 'A', text: 'Students must not make loud noise inside the library' },
            { key: 'B', text: 'Students can sing loudly in the library' },
            { key: 'C', text: 'The library is closed forever' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Students must stay quiet and avoid making noise in the library' },
            { key: 'B', text: 'Students are allowed to eat and shout inside the library' },
            { key: 'C', text: 'Students cannot borrow any books from the library' },
            { key: 'D', text: 'Students must clean the school yard immediately' }
        ],
        correctAnswer: 'A',
        explanation: 'Keep silent berarti menjaga ketenangan dan tidak berisik saat berada di perpustakaan.',
        cognitiveLevel: 'MOTS',
        topic: 'Functional Text (Notices)'
    },
    {
        stimulus: 'Read the family tree statement: "Mrs. Dewi is my mother. She has an older brother named Mr. Hendra."',
        question: 'Who is Mr. Hendra to me?',
        optionsFaseA: [
            { key: 'A', text: 'My uncle' },
            { key: 'B', text: 'My grandfather' },
            { key: 'C', text: 'My cousin' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'My uncle' },
            { key: 'B', text: 'My grandfather' },
            { key: 'C', text: 'My nephew' },
            { key: 'D', text: 'My cousin' }
        ],
        correctAnswer: 'A',
        explanation: 'Kakak laki-laki dari ibu (older brother of mother) dalam bahasa Inggris disebut uncle (paman).',
        cognitiveLevel: 'MOTS',
        topic: 'Family Members'
    },
    {
        stimulus: 'Look at the clock schedule: "The English class starts at seven thirty (07.30) and ends at eight thirty (08.30)."',
        question: 'How long is the English class?',
        optionsFaseA: [
            { key: 'A', text: 'One hour' },
            { key: 'B', text: 'Two hours' },
            { key: 'C', text: 'Thirty minutes' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'One hour (60 minutes)' },
            { key: 'B', text: 'Two hours (120 minutes)' },
            { key: 'C', text: 'Thirty minutes' },
            { key: 'D', text: 'Ninety minutes' }
        ],
        correctAnswer: 'A',
        explanation: 'Dari pukul 07.30 sampai 08.30 durasinya tepat satu jam (one hour).',
        cognitiveLevel: 'MOTS',
        topic: 'Telling Time'
    },
    {
        stimulus: 'Udin wants to borrow a ruler from his classmate. Udin says: "Excuse me, Rani. May I borrow your ruler, please?"',
        question: 'What is the polite response if Rani agrees to lend her ruler?',
        optionsFaseA: [
            { key: 'A', text: 'Sure, here you are.' },
            { key: 'B', text: 'No, go away.' },
            { key: 'C', text: 'I am sleeping.' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Sure, here you are.' },
            { key: 'B', text: 'Sorry, you are late.' },
            { key: 'C', text: 'See you next year.' },
            { key: 'D', text: 'Good night, Udin.' }
        ],
        correctAnswer: 'A',
        explanation: '"Sure, here you are" adalah ungkapan sopan ketika memberikan barang yang dipinjam teman.',
        cognitiveLevel: 'LOTS',
        topic: 'Polite Expressions'
    },
    {
        stimulus: 'Read the weather sentence: "Look at the dark clouds and heavy rain outside! Don’t forget to bring your ... before going to school."',
        question: 'The most suitable item to bring on a rainy day is ...',
        optionsFaseA: [
            { key: 'A', text: 'an umbrella' },
            { key: 'B', text: 'sunglasses' },
            { key: 'C', text: 'a kite' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'an umbrella or raincoat' },
            { key: 'B', text: 'a pair of sunglasses' },
            { key: 'C', text: 'a wooden kite' },
            { key: 'D', text: 'a swimming goggles' }
        ],
        correctAnswer: 'A',
        explanation: 'Saat cuaca hujan (heavy rain), benda yang tepat dibawa adalah payung (umbrella) atau jas hujan.',
        cognitiveLevel: 'LOTS',
        topic: 'Weather and Seasons'
    }
];

// ==========================================
// 4E. QUESTION BANK: PENDIDIKAN AGAMA ISLAM (PAI)
// ==========================================
const PAI_PG_BANK: QuestionBankItemPG[] = [
    {
        stimulus: 'Seorang anak muslim meyakini bahwa Allah Swt. Maha Melihat setiap perbuatan baik maupun buruk yang dilakukan manusia, meskipun tidak ada orang lain di sekitarnya.',
        question: 'Nama baik Allah (Asmaul Husna) yang berarti Allah Maha Melihat segala sesuatu adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Al-Basir' },
            { key: 'B', text: 'Al-Kholiq' },
            { key: 'C', text: 'Al-Quddus' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Al-Basir (Maha Melihat)' },
            { key: 'B', text: 'As-Sami (Maha Mendengar)' },
            { key: 'C', text: 'Al-Malik (Maha Merajai)' },
            { key: 'D', text: 'Al-Mumit (Maha Mematikan)' }
        ],
        correctAnswer: 'A',
        explanation: 'Al-Basir artinya Allah Maha Melihat seluruh perbuatan makhluk-Nya tanpa ada yang tersembunyi.',
        cognitiveLevel: 'LOTS',
        topic: 'Asmaul Husna'
    },
    {
        stimulus: 'Dalam rukun Islam yang kedua, umat Islam diwajibkan mendirikan salat fardu lima waktu sehari semalam dengan penuh kekhusyukan.',
        question: 'Urutan salat wajib yang dilaksanakan pada waktu terbenamnya matahari sebanyak tiga rakaat adalah salat ...',
        optionsFaseA: [
            { key: 'A', text: 'Magrib' },
            { key: 'B', text: 'Subuh' },
            { key: 'C', text: 'Isya' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Salat Magrib (3 rakaat)' },
            { key: 'B', text: 'Salat Subuh (2 rakaat)' },
            { key: 'C', text: 'Salat Zuhur (4 rakaat)' },
            { key: 'D', text: 'Salat Asar (4 rakaat)' }
        ],
        correctAnswer: 'A',
        explanation: 'Salat Magrib dilaksanakan setelah matahari terbenam di ufuk barat dengan jumlah 3 rakaat.',
        cognitiveLevel: 'LOTS',
        topic: 'Salat Fardu'
    },
    {
        stimulus: 'Siti menemukan dompet berisi uang terjatuh di halaman sekolah, lalu ia segera menyerahkan dompet tersebut kepada guru piket agar dikembalikan kepada pemiliknya.',
        question: 'Perilaku terpuji Siti yang berani berkata benar dan tidak mengambil hak orang lain mencerminkan sifat ...',
        optionsFaseA: [
            { key: 'A', text: 'Jujur dan amanah' },
            { key: 'B', text: 'Sombong dan kikir' },
            { key: 'C', text: 'Riya dan iri hati' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Jujur (siddiq) dan dapat dipercaya (amanah)' },
            { key: 'B', text: 'Takabur dan ingin dipuji' },
            { key: 'C', text: 'Kikir dan pemarah' },
            { key: 'D', text: 'Putus asa dan malas' }
        ],
        correctAnswer: 'A',
        explanation: 'Mengembalikan barang temuan kepada pemiliknya menunjukkan kejujuran dan sikap amanah.',
        cognitiveLevel: 'MOTS',
        topic: 'Akhlak Terpuji'
    },
    {
        stimulus: 'Sebelum mengerjakan salat, seorang muslim wajib bersuci dari hadas kecil dengan berwudu menggunakan air bersih dan menyucikan.',
        question: 'Berikut ini yang termasuk rukun wajib dalam gerakan berwudu adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Membasuh muka dan kedua tangan sampai siku' },
            { key: 'B', text: 'Berlari mengelilingi masjid' },
            { key: 'C', text: 'Menyisir rambut dengan minyak wangi' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Niat, membasuh wajah, kedua tangan hingga siku, mengusap kepala, dan membasuh kaki hingga mata kaki' },
            { key: 'B', text: 'Mencuci pakaian seragam sekolah hingga bersih' },
            { key: 'C', text: 'Membaca doa sesudah makan bersama keluarga' },
            { key: 'D', text: 'Berpuasa sunah Senin dan Kamis terlebih dahulu' }
        ],
        correctAnswer: 'A',
        explanation: 'Rukun wudu meliputi niat, membasuh muka, membasuh kedua tangan sampai siku, mengusap sebagian kepala, membasuh kedua kaki hingga mata kaki, dan tertib.',
        cognitiveLevel: 'LOTS',
        topic: 'Taharah / Wudu'
    },
    {
        stimulus: 'Dalam Surah Al-Hujurat ayat 13, Allah menjelaskan bahwa manusia diciptakan berbangsa-bangsa dan bersuku-suku agar saling mengenal.',
        question: 'Sikap yang tepat terhadap teman di kelas yang berbeda suku bangsa dan daerah asal sesuai pesan Surah Al-Hujurat ayat 13 adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Saling menghargai dan berteman dengan rukun' },
            { key: 'B', text: 'Menjauhi teman yang berbeda bahasa daerah' },
            { key: 'C', text: 'Merasa suku sendiri paling mulia' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Saling mengenal, menghargai perbedaan, dan menumbuhkan toleransi' },
            { key: 'B', text: 'Membentuk kelompok belajar yang hanya menerima satu suku saja' },
            { key: 'C', text: 'Mengejek logat bahasa daerah teman' },
            { key: 'D', text: 'Menghindari kerja sama saat tugas piket kelas' }
        ],
        correctAnswer: 'A',
        explanation: 'Allah menciptakan keberagaman agar manusia saling mengenal (taaruf) dan saling menghormati, karena kemuliaan diukur dari ketakwaan.',
        cognitiveLevel: 'HOTS',
        topic: 'Keragaman dalam Al-Qur’an'
    },
    {
        stimulus: 'Setiap bulan Ramadan tiba, umat Islam melaksanakan ibadah puasa wajib selama sebulan penuh dan menutupnya dengan mengeluarkan zakat fitrah.',
        question: 'Tujuan utama diwajibkannya zakat fitrah menjelang Hari Raya Idulfitri adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Menyucikan jiwa dan membantu fakir miskin agar bergembira di hari raya' },
            { key: 'B', text: 'Memamerkan kekayaan di hadapan tetangga' },
            { key: 'C', text: 'Mengumpulkan barang bekas di gudang' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menyucikan diri orang yang berpuasa dan mencukupi kebutuhan fakir miskin di hari raya' },
            { key: 'B', text: 'Mengurangi persediaan makanan pokok keluarga' },
            { key: 'C', text: 'Menjadi syarat membeli pakaian baru' },
            { key: 'D', text: 'Menggantikan kewajiban salat lima waktu' }
        ],
        correctAnswer: 'A',
        explanation: 'Zakat fitrah berfungsi membersihkan jiwa orang yang berpuasa sekaligus memberi makanan kepada fakir miskin saat Idulfitri.',
        cognitiveLevel: 'MOTS',
        topic: 'Zakat dan Kepedulian Sosial'
    },
    {
        stimulus: 'Nabi Muhammad saw. sejak masa mudanya sudah mendapatkan gelar terhormat "Al-Amin" dari penduduk Kota Makkah.',
        question: 'Makna dari gelar "Al-Amin" yang diberikan kepada Nabi Muhammad saw. adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Orang yang dapat dipercaya' },
            { key: 'B', text: 'Orang yang paling kaya' },
            { key: 'C', text: 'Orang yang paling tinggi' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Orang yang sangat jujur dan dapat dipercaya' },
            { key: 'B', text: 'Panglima perang yang ditakuti' },
            { key: 'C', text: 'Pedagang paling kaya di kota' },
            { key: 'D', text: 'Penyair terpopuler di jazirah Arab' }
        ],
        correctAnswer: 'A',
        explanation: 'Al-Amin berarti orang yang terpercaya karena Nabi Muhammad saw. selalu menjaga amanah dan kejujuran dalam ucapan maupun perbuatan.',
        cognitiveLevel: 'LOTS',
        topic: 'Keteladanan Nabi Muhammad saw.'
    },
    {
        stimulus: 'Ketika berangkat ke sekolah, Ahmad selalu mencium tangan kedua orang tuanya, memohon doa restu, dan berbicara dengan lemah lembut.',
        question: 'Perbuatan berbakti, menghormati, dan memuliakan kedua orang tua dalam ajaran Islam dikenal dengan istilah ...',
        optionsFaseA: [
            { key: 'A', text: 'Birrul walidain' },
            { key: 'B', text: 'Ukhuwah wathaniyah' },
            { key: 'C', text: 'Tawakal' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Birrul walidain' },
            { key: 'B', text: 'Husnudzan' },
            { key: 'C', text: 'Istiqamah' },
            { key: 'D', text: 'Qanaah' }
        ],
        correctAnswer: 'A',
        explanation: 'Birrul walidain adalah kewajiban berbuat baik, santun, dan berbakti kepada kedua orang tua.',
        cognitiveLevel: 'LOTS',
        topic: 'Berbakti kepada Orang Tua'
    },
    {
        stimulus: 'Dalam Rukun Iman, umat Islam wajib mengimani sepuluh malaikat Allah beserta tugas-tugas mulia yang diembannya.',
        question: 'Malaikat Allah yang bertugas menyampaikan wahyu kepada para nabi dan rasul adalah Malaikat ...',
        optionsFaseA: [
            { key: 'A', text: 'Jibril' },
            { key: 'B', text: 'Mikail' },
            { key: 'C', text: 'Israfil' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Malaikat Jibril' },
            { key: 'B', text: 'Malaikat Mikail' },
            { key: 'C', text: 'Malaikat Israfil' },
            { key: 'D', text: 'Malaikat Raqib' }
        ],
        correctAnswer: 'A',
        explanation: 'Malaikat Jibril bertugas menyampaikan wahyu Allah kepada para nabi dan rasul.',
        cognitiveLevel: 'LOTS',
        topic: 'Iman kepada Malaikat'
    },
    {
        stimulus: 'Surah Al-Ma’un mengajarkan agar umat Islam peduli kepada anak yatim serta tidak menghardik orang miskin.',
        question: 'Menurut kandungan Surah Al-Ma’un, salah satu ciri orang yang mendustakan agama adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Menghardik anak yatim dan enggan memberi makan orang miskin' },
            { key: 'B', text: 'Rajin bersedekah kepada tetangga yang membutuhkan' },
            { key: 'C', text: 'Menjalankan salat tepat pada waktunya' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menghardik anak yatim, enggan menolong fakir miskin, dan lalai dari salatnya' },
            { key: 'B', text: 'Berinfak dengan tulus setiap hari Jumat' },
            { key: 'C', text: 'Memelihara kebersihan masjid dan mushola sekolah' },
            { key: 'D', text: 'Saling memaafkan saat terjadi kesalahpahaman' }
        ],
        correctAnswer: 'A',
        explanation: 'Surah Al-Ma’un mengecam orang yang menghardik anak yatim, tidak mendorong memberi makan orang miskin, serta lalai dan riya dalam salatnya.',
        cognitiveLevel: 'MOTS',
        topic: 'Kandungan Surah Al-Ma’un'
    }
];

// ==========================================
// 4F. QUESTION BANK: KODING & KECERDASAN ARTIFISIAL
// ==========================================
const KODING_PG_BANK: QuestionBankItemPG[] = [
    {
        stimulus: 'Sebelum membuat program robot berjalan menuju kotak tujuan di kelas koding, siswa menuliskan daftar langkah berurutan: 1) Maju 2 langkah, 2) Belok kanan, 3) Maju 1 langkah.',
        question: 'Urutan langkah logis dan terstruktur untuk menyelesaikan suatu masalah atau tugas komputer disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Algoritma' },
            { key: 'B', text: 'Monitor' },
            { key: 'C', text: 'Baterai' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Algoritma' },
            { key: 'B', text: 'Perangkat keras (hardware)' },
            { key: 'C', text: 'Jaringan kabel listrik' },
            { key: 'D', text: 'Layar sentuh monitor' }
        ],
        correctAnswer: 'A',
        explanation: 'Algoritma adalah urutan instruksi langkah demi langkah yang jelas dan terstruktur untuk menyelesaikan masalah.',
        cognitiveLevel: 'LOTS',
        topic: 'Algoritma dan Berpikir Komputasional'
    },
    {
        stimulus: 'Untuk merancang acara pentas seni sekolah yang terasa rumit, panitia kelas memecahnya menjadi tugas-tugas kecil: bagian panggung, bagian kostum, dan bagian konsumsi.',
        question: 'Strategi berpikir komputasional dengan memecah masalah besar menjadi bagian-bagian kecil yang mudah dikelola disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Dekomposisi' },
            { key: 'B', text: 'Perulangan (loop)' },
            { key: 'C', text: 'Kesalahan (bug)' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Dekomposisi (decomposition)' },
            { key: 'B', text: 'Perulangan tanpa henti (loop)' },
            { key: 'C', text: 'Kesalahan program (bug)' },
            { key: 'D', text: 'Penyimpanan cloud' }
        ],
        correctAnswer: 'A',
        explanation: 'Dekomposisi memecah persoalan besar atau kompleks menjadi sub-bagian yang lebih kecil agar mudah diselesaikan.',
        cognitiveLevel: 'MOTS',
        topic: 'Dekomposisi'
    },
    {
        stimulus: 'Dalam proyek animasi blok kode visual (seperti Scratch), karakter kucing diminta melangkah maju 10 langkah dan mengulanginya terus sebanyak 5 kali.',
        question: 'Blok perintah yang berfungsi mengulang instruksi yang sama secara berulang kali tanpa menulis ulang perintah satu per satu disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Perulangan (Loop / Repeat)' },
            { key: 'B', text: 'Penghapusan (Delete)' },
            { key: 'C', text: 'Pemberhentian (Stop)' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Perulangan (Loop / Repeat)' },
            { key: 'B', text: 'Pencetakan (Print)' },
            { key: 'C', text: 'Penghapusan file (Delete)' },
            { key: 'D', text: 'Pematikan daya (Shut down)' }
        ],
        correctAnswer: 'A',
        explanation: 'Konsep perulangan (looping) menghemat kode karena instruksi yang sama dapat dijalankan berulang secara otomatis.',
        cognitiveLevel: 'LOTS',
        topic: 'Perulangan (Looping)'
    },
    {
        stimulus: 'Saat menguji permainan buatan sendiri, Siti menyadari karakter pemain tidak melompat ketika tombol spasi ditekan karena salah memasang blok kode.',
        question: 'Proses mencari, menemukan, dan memperbaiki kesalahan logika pada kode program disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Debugging' },
            { key: 'B', text: 'Downloading' },
            { key: 'C', text: 'Printing' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Debugging' },
            { key: 'B', text: 'Installing' },
            { key: 'C', text: 'Streaming' },
            { key: 'D', text: 'Browsing' }
        ],
        correctAnswer: 'A',
        explanation: 'Kesalahan dalam kode disebut bug, sedangkan proses melacak dan memperbaikinya dinamakan debugging.',
        cognitiveLevel: 'MOTS',
        topic: 'Debugging Program'
    },
    {
        stimulus: 'Perhatikan logika percabangan sederhana pada lampu taman otomatis: "JIKA lingkungan terdeteksi gelap, MAKA nyalakan lampu; JIKA TIDAK, matikan lampu."',
        question: 'Konsep pemrograman yang menentukan aksi berdasarkan terpenuhi atau tidaknya suatu kondisi tersebut dinamakan ...',
        optionsFaseA: [
            { key: 'A', text: 'Percabangan (Kondisional IF-ELSE)' },
            { key: 'B', text: 'Urutan acak tanpa aturan' },
            { key: 'C', text: 'Penggandaan layar' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Percabangan kondisional (If-Then-Else)' },
            { key: 'B', text: 'Pengulangan tak terbatas' },
            { key: 'C', text: 'Penyalinan dokumen teks' },
            { key: 'D', text: 'Pengiriman surat elektronik' }
        ],
        correctAnswer: 'A',
        explanation: 'Struktur kondisional (IF-ELSE) membuat program mengambil keputusan berbeda tergantung kondisi sensor atau data masukan.',
        cognitiveLevel: 'MOTS',
        topic: 'Kondisional (Percabangan)'
    },
    {
        stimulus: 'Aplikasi pemutar musik dan video edukasi dapat merekomendasikan tontonan matematika yang sesuai dengan riwayat video belajar yang sering ditonton pengguna.',
        question: 'Teknologi komputer yang belajar dari pola data untuk mengenali suara, gambar, atau memberi rekomendasi cerdas disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Kecerdasan Artifisial (AI)' },
            { key: 'B', text: 'Mesin tik manual' },
            { key: 'C', text: 'Kalkulator mekanik biasa' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Kecerdasan Artifisial (Artificial Intelligence / AI)' },
            { key: 'B', text: 'Mesin cetak koran konvensional' },
            { key: 'C', text: 'Jam dinding mekanik biasa' },
            { key: 'D', text: 'Papan tulis kapur manual' }
        ],
        correctAnswer: 'A',
        explanation: 'Kecerdasan Artifisial (AI) memproses data dalam jumlah besar untuk mengenali pola dan membuat prediksi atau rekomendasi cerdas.',
        cognitiveLevel: 'LOTS',
        topic: 'Pengenalan Kecerdasan Artifisial'
    },
    {
        stimulus: 'Saat menggunakan aplikasi berbasis AI di tablet, sistem meminta pengguna mengunggah foto wajah atau menyebutkan alamat rumah lengkap.',
        question: 'Sikap bijak dan aman terkait privasi data pribadi ketika berinteraksi dengan aplikasi digital maupun AI adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Tidak sembarangan membagikan data rahasia (alamat, nomor telepon, kata sandi) kepada aplikasi umum' },
            { key: 'B', text: 'Membagikan kata sandi akun kepada semua teman bermain' },
            { key: 'C', text: 'Mengunggah foto identitas keluarga ke halaman publik' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Melindungi data pribadi (alamat rumah, nomor telepon, kata sandi) dan meminta izin orang tua atau guru sebelum memakai aplikasi baru' },
            { key: 'B', text: 'Menyebarkan informasi pribadi agar aplikasi berjalan lebih cepat' },
            { key: 'C', text: 'Menggunakan satu kata sandi mudah seperti 12345 untuk semua akun' },
            { key: 'D', text: 'Menekan tombol izinkan pada semua tautan asing tanpa membaca' }
        ],
        correctAnswer: 'A',
        explanation: 'Etika dan keamanan digital mewajibkan kita menjaga kerahasiaan data pribadi agar terhindar dari penyalahgunaan digital.',
        cognitiveLevel: 'HOTS',
        topic: 'Etika dan Keamanan Digital AI'
    },
    {
        stimulus: 'Seorang siswa melatih model klasifikasi gambar sederhana dengan memasukkan 50 foto daun sehat dan 50 foto daun berlubang dimakan ulat.',
        question: 'Kumpulan contoh data foto yang digunakan untuk melatih sistem Kecerdasan Artifisial agar mampu membedakan dua kondisi daun disebut ...',
        optionsFaseA: [
            { key: 'A', text: 'Data latih (Training data)' },
            { key: 'B', text: 'Kabel daya listrik' },
            { key: 'C', text: 'Kertas hasil cetak' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Data latih (training data)' },
            { key: 'B', text: 'Perangkat pengeras suara' },
            { key: 'C', text: 'Tinta printer warna' },
            { key: 'D', text: 'Kipas pendingin prosesor' }
        ],
        correctAnswer: 'A',
        explanation: 'AI belajar mengenali ciri gambar dari kumpulan data latih; semakin berkualitas datanya, semakin akurat pula prediksinya.',
        cognitiveLevel: 'MOTS',
        topic: 'Cara Kerja AI (Data Latih)'
    }
];

// ==========================================
// 4G. QUESTION BANK: MUATAN LOKAL (BAHASA & BUDAYA DAERAH)
// ==========================================
const MULOK_PG_BANK: QuestionBankItemPG[] = [
    {
        stimulus: 'Di lingkungan sekolah dan keluarga, siswa dibiasakan menggunakan bahasa daerah yang halus dan sopan saat berbicara kepada orang tua maupun Bapak/Ibu guru.',
        question: 'Manfaat utama membiasakan berbicara menggunakan ragam bahasa daerah yang santun kepada orang yang lebih tua adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Menunjukkan rasa hormat, budi pekerti luhur, dan melestarikan budaya daerah' },
            { key: 'B', text: 'Membuat percakapan menjadi sulit dimengerti teman sebaya' },
            { key: 'C', text: 'Menghilangkan kebiasaan berbahasa Indonesia baku' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Menumbuhkan sikap sopan santun (unggah-ungguh), rasa hormat, sekaligus melestarikan bahasa daerah' },
            { key: 'B', text: 'Membatasi pergaulan dengan siswa dari daerah lain' },
            { key: 'C', text: 'Menggantikan kedudukan bahasa persatuan Indonesia di sekolah' },
            { key: 'D', text: 'Mengurangi minat membaca buku perpustakaan' }
        ],
        correctAnswer: 'A',
        explanation: 'Penggunaan bahasa daerah yang santun mencerminkan tata krama (adab) dan menjaga kelestarian warisan budaya lokal.',
        cognitiveLevel: 'MOTS',
        topic: 'Tata Krama dan Bahasa Daerah'
    },
    {
        stimulus: 'Pada jam istirahat, anak-anak bermain permainan tradisional "Gobak Sodor" dan "Engklek" di halaman sekolah dengan gembira.',
        question: 'Nilai karakter positif yang dilatih melalui permainan tradisional daerah bersama teman-teman tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Kerja sama, sportivitas, ketangkasan, dan kerukunan' },
            { key: 'B', text: 'Sikap egois ingin menang sendiri' },
            { key: 'C', text: 'Kecanduan menatap layar gawai sepanjang hari' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Kerja sama tim, kejujuran, sportivitas, dan kebugaran fisik' },
            { key: 'B', text: 'Sikap individualis tanpa peduli teman' },
            { key: 'C', text: 'Kebiasaan bertengkar jika mengalami kekalahan' },
            { key: 'D', text: 'Ketergantungan bermain permainan daring sendirian' }
        ],
        correctAnswer: 'A',
        explanation: 'Permainan tradisional mengajarkan interaksi sosial langsung, kejujuran terhadap aturan, kekompakan, dan kebugaran fisik.',
        cognitiveLevel: 'LOTS',
        topic: 'Permainan Tradisional Daerah'
    },
    {
        stimulus: 'Dalam acara pentas budaya sekolah, kelompok seni daerah menampilkan alat musik tradisional berbahan bilah bambu yang menghasilkan nada indah ketika digoyangkan (Angklung).',
        question: 'Sikap yang tepat sebagai generasi muda terhadap kesenian dan alat musik tradisional daerah di Nusantara adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Bangga mempelajari, menjaga, dan memperkenalkan kesenian daerah' },
            { key: 'B', text: 'Meninggalkannya karena dianggap kuno' },
            { key: 'C', text: 'Merusak alat musik tradisional di sanggar' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Turut bangga mempelajari, melestarikan, dan menghargai keunikan kesenian daerah' },
            { key: 'B', text: 'Menganggap budaya daerah tidak berguna di masa modern' },
            { key: 'C', text: 'Hanya menyukai budaya asing dan melupakan budaya sendiri' },
            { key: 'D', text: 'Melarang teman berlatih tarian tradisional di sekolah' }
        ],
        correctAnswer: 'A',
        explanation: 'Melestarikan kesenian daerah menjaga jati diri bangsa agar warisan leluhur tidak punah tergerus zaman.',
        cognitiveLevel: 'MOTS',
        topic: 'Kesenian Tradisional Daerah'
    },
    {
        stimulus: 'Siswa membaca cerita rakyat nusantara tentang seorang anak yang patuh kepada ibunya dan rajin menolong warga desa yang sedang kesusahan.',
        question: 'Tujuan utama mempelajari cerita rakyat dan dongeng daerah dalam pelajaran muatan lokal adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Mengambil teladan amanat moral dan mengenal kearifan lokal' },
            { key: 'B', text: 'Menghafalkan nama tokoh untuk mengejek teman' },
            { key: 'C', text: 'Membuktikan cerita fiksi selalu nyata' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Memetik nilai moral, budi pekerti luhur, serta memahami kearifan lokal masyarakat' },
            { key: 'B', text: 'Mengabaikan pesan kebaikan yang tersirat di dalamnya' },
            { key: 'C', text: 'Meniru sifat tokoh jahat dalam cerita' },
            { key: 'D', text: 'Membandingkan mana daerah yang paling unggul' }
        ],
        correctAnswer: 'A',
        explanation: 'Cerita rakyat sarat akan pesan moral (amanat) dan nilai kearifan lokal yang membentuk karakter baik peserta didik.',
        cognitiveLevel: 'MOTS',
        topic: 'Cerita Rakyat Daerah'
    },
    {
        stimulus: 'Setiap daerah di Indonesia memiliki makanan tradisional khas berbahan pangan lokal, seperti singkong, sagu, ketan, dan rempah-rempah.',
        question: 'Keuntungan mengonsumsi dan melestarikan makanan khas tradisional daerah buatan masyarakat sekitar adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Mendukung perekonomian warga lokal dan menjaga cita rasa kuliner daerah' },
            { key: 'B', text: 'Mengurangi penghasilan petani daerah sendiri' },
            { key: 'C', text: 'Menghilangkan bahan pangan alami Nusantara' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Memberdayakan petani dan pengrajin lokal serta melestarikan kekayaan kuliner daerah' },
            { key: 'B', text: 'Membuat produk pangan impor semakin sulit dicari' },
            { key: 'C', text: 'Mengurangi variasi bahan makanan bergizi' },
            { key: 'D', text: 'Meningkatkan ketergantungan makanan cepat saji' }
        ],
        correctAnswer: 'A',
        explanation: 'Membeli dan melestarikan kuliner tradisional membantu ekonomi lokal sekaligus merawat identitas budaya daerah.',
        cognitiveLevel: 'HOTS',
        topic: 'Kuliner & Ekonomi Lokal'
    },
    {
        stimulus: 'Pada hari Minggu, warga kampung bergotong royong membersihkan selokan, memangkas ranting pohon, dan merapikan pos ronda lingkungan setempat.',
        question: 'Nilai kearifan lokal yang tercermin dalam kegiatan kerja bakti membersihkan lingkungan desa tersebut adalah ...',
        optionsFaseA: [
            { key: 'A', text: 'Kebersamaan, kepedulian lingkungan, dan semangat gotong royong' },
            { key: 'B', text: 'Sikap masa bodoh terhadap kebersihan desa' },
            { key: 'C', text: 'Persaingan memperebutkan hadiah uang' }
        ],
        optionsFaseBC: [
            { key: 'A', text: 'Semangat gotong royong, kerukunan bertetangga, dan kepedulian lingkungan' },
            { key: 'B', text: 'Sikap acuh tak acuh terhadap masalah lingkungan bersama' },
            { key: 'C', text: 'Kebiasaan menunda pekerjaan hingga terjadi banjir' },
            { key: 'D', text: 'Keinginan menonjolkan diri tanpa bekerja nyata' }
        ],
        correctAnswer: 'A',
        explanation: 'Gotong royong adalah kearifan lokal bangsa Indonesia yang membuat pekerjaan berat terasa ringan dan mempererat persaudaraan.',
        cognitiveLevel: 'LOTS',
        topic: 'Kearifan Lokal & Gotong Royong'
    }
];

// ==========================================
// 5. EXTENSIVE QUESTION BANKS (ISIAN SINGKAT)
// ==========================================
const ISIAN_POOL_MATEMATIKA: QuestionBankItemIsian[] = [
    { minGrade: 1, maxGrade: 2, question: 'Hasil penjumlahan bilangan 15 + 12 adalah ...', correctAnswer: '27', cognitiveLevel: 'LOTS', topic: 'Penjumlahan' },
    { minGrade: 1, maxGrade: 2, question: 'Hasil pengurangan bilangan 30 - 14 adalah ...', correctAnswer: '16', cognitiveLevel: 'LOTS', topic: 'Pengurangan' },
    { minGrade: 1, maxGrade: 2, question: 'Bangun datar yang memiliki 3 sisi dan 3 sudut disebut ...', correctAnswer: 'Segitiga', cognitiveLevel: 'LOTS', topic: 'Bangun Datar' },
    { minGrade: 1, maxGrade: 2, question: 'Pada bilangan 48, angka 4 menempati nilai tempat ...', correctAnswer: 'Puluhan', cognitiveLevel: 'LOTS', topic: 'Nilai Tempat' },
    { minGrade: 1, maxGrade: 2, question: 'Satu minggu terdiri dari ... hari.', correctAnswer: '7', cognitiveLevel: 'LOTS', topic: 'Satuan Waktu' },
    { minGrade: 3, maxGrade: 6, question: 'Sudut yang ukuran besarnya tepat 90 derajat dinamakan sudut ...', correctAnswer: 'Siku-siku', cognitiveLevel: 'LOTS', topic: 'Sudut' },
    { minGrade: 3, maxGrade: 6, question: 'Sudut yang besarnya lebih kecil dari 90 derajat dinamakan sudut ...', correctAnswer: 'Lancip', cognitiveLevel: 'LOTS', topic: 'Sudut' },
    { minGrade: 3, maxGrade: 6, question: 'Sudut yang besarnya antara 90 derajat sampai 180 derajat dinamakan sudut ...', correctAnswer: 'Tumpul', cognitiveLevel: 'LOTS', topic: 'Sudut' },
    { minGrade: 1, maxGrade: 6, question: 'Bangun datar yang memiliki 4 sisi sama panjang dan 4 sudut siku-siku adalah ...', correctAnswer: 'Persegi (Bujur sangkar)', cognitiveLevel: 'LOTS', topic: 'Bangun Datar' },
    { minGrade: 3, maxGrade: 6, question: 'Sebuah persegi panjang memiliki panjang 15 cm dan lebar 8 cm. Luas persegi panjang tersebut adalah ... cm².', correctAnswer: '120', cognitiveLevel: 'MOTS', topic: 'Luas' },
    { minGrade: 4, maxGrade: 6, question: 'Sebuah segitiga memiliki panjang alas 12 cm dan tinggi 10 cm. Luas segitiga tersebut adalah ... cm².', correctAnswer: '60', cognitiveLevel: 'MOTS', topic: 'Luas' },
    { minGrade: 5, maxGrade: 6, question: 'Panjang rusuk kubus adalah 6 cm. Volume kubus tersebut adalah ... cm³.', correctAnswer: '216', cognitiveLevel: 'MOTS', topic: 'Volume' },
    { minGrade: 4, maxGrade: 6, question: 'Bentuk pecahan paling sederhana dari 15/20 adalah ...', correctAnswer: '3/4', cognitiveLevel: 'LOTS', topic: 'Pecahan' },
    { minGrade: 3, maxGrade: 6, question: 'Hasil dari operasi hitung 25 x 4 + 75 adalah ...', correctAnswer: '175', cognitiveLevel: 'MOTS', topic: 'Operasi Campuran' },
    { minGrade: 4, maxGrade: 6, question: 'Faktor Persekutuan Terbesar (FPB) dari bilangan 18 dan 24 adalah ...', correctAnswer: '6', cognitiveLevel: 'HOTS', topic: 'KPK dan FPB' },
    { minGrade: 4, maxGrade: 6, question: 'Kelipatan Persekutuan Terkecil (KPK) dari bilangan 6 dan 8 adalah ...', correctAnswer: '24', cognitiveLevel: 'HOTS', topic: 'KPK dan FPB' },
    { minGrade: 5, maxGrade: 6, question: 'Bentuk desimal dari pecahan 3/5 adalah ...', correctAnswer: '0,6', cognitiveLevel: 'LOTS', topic: 'Desimal' },
    { minGrade: 3, maxGrade: 6, question: 'Sebuah tali panjangnya 2 meter 50 centimeter. Panjang tali tersebut jika diubah ke satuan centimeter adalah ... cm.', correctAnswer: '250', cognitiveLevel: 'LOTS', topic: 'Satuan Panjang' },
    { minGrade: 3, maxGrade: 6, question: 'Pak Budi membeli beras 3 kilogram. Berat beras tersebut setara dengan ... gram.', correctAnswer: '3.000', cognitiveLevel: 'LOTS', topic: 'Satuan Berat' },
    { minGrade: 2, maxGrade: 6, question: 'Satu jam terdiri dari ... menit.', correctAnswer: '60', cognitiveLevel: 'LOTS', topic: 'Satuan Waktu' }
];

const ISIAN_POOL_INDO: QuestionBankItemIsian[] = [
    { minGrade: 3, maxGrade: 6, question: 'Gagasan utama atau inti pembahasan yang menjiwai seluruh isi sebuah paragraf dinamakan ...', correctAnswer: 'Ide pokok (Gagasan utama)', cognitiveLevel: 'LOTS', topic: 'Ide Pokok' },
    { minGrade: 4, maxGrade: 6, question: 'Paragraf yang kalimat utamanya terletak di bagian awal paragraf disebut paragraf ...', correctAnswer: 'Deduktif', cognitiveLevel: 'LOTS', topic: 'Jenis Paragraf' },
    { minGrade: 4, maxGrade: 6, question: 'Paragraf yang kalimat utamanya terletak di bagian akhir paragraf disebut paragraf ...', correctAnswer: 'Induktif', cognitiveLevel: 'LOTS', topic: 'Jenis Paragraf' },
    { question: 'Kata tanya yang digunakan untuk menanyakan alasan atau sebab terjadinya suatu peristiwa adalah kata tanya ...', correctAnswer: 'Mengapa', cognitiveLevel: 'LOTS', topic: 'Kata Tanya' },
    { question: 'Kata tanya yang digunakan untuk menanyakan waktu terjadinya suatu peristiwa adalah kata tanya ...', correctAnswer: 'Kapan', cognitiveLevel: 'LOTS', topic: 'Kata Tanya' },
    { question: 'Kata tanya yang digunakan untuk menanyakan pelaku orang yang terlibat dalam suatu peristiwa adalah kata tanya ...', correctAnswer: 'Siapa', cognitiveLevel: 'LOTS', topic: 'Kata Tanya' },
    { question: 'Persamaan kata (arti yang bermakna sama) dalam bahasa Indonesia disebut dengan istilah ...', correctAnswer: 'Sinonim', cognitiveLevel: 'LOTS', topic: 'Kosakata' },
    { question: 'Lawan kata (arti yang berlawanan) dalam bahasa Indonesia disebut dengan istilah ...', correctAnswer: 'Antonim', cognitiveLevel: 'LOTS', topic: 'Kosakata' },
    { minGrade: 2, maxGrade: 6, question: 'Pesan mendidik yang ingin disampaikan oleh pengarang kepada pembaca melalui sebuah cerita dinamakan ...', correctAnswer: 'Amanat (Pesan moral)', cognitiveLevel: 'MOTS', topic: 'Unsur Cerita' },
    { minGrade: 4, maxGrade: 6, question: 'Gaya bahasa yang mengibaratkan benda mati dapat berperilaku seperti manusia hidup dinamakan majas ...', correctAnswer: 'Personifikasi', cognitiveLevel: 'MOTS', topic: 'Majas' },
    { minGrade: 3, maxGrade: 6, question: 'Teks yang memuat penjelasan mengenai langkah-langkah atau tahapan dalam membuat/melakukan sesuatu secara berurutan dinamakan teks ...', correctAnswer: 'Prosedur (Petunjuk)', cognitiveLevel: 'LOTS', topic: 'Teks Prosedur' },
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
    { minGrade: 3, maxGrade: 6, question: 'Sesuatu yang mutlak harus kita terima dan dapatkan sejak lahir disebut ...', correctAnswer: 'Hak', cognitiveLevel: 'LOTS', topic: 'Hak dan Kewajiban' },
    { minGrade: 3, maxGrade: 6, question: 'Sesuatu yang wajib dilaksanakan dengan penuh tanggung jawab disebut ...', correctAnswer: 'Kewajiban', cognitiveLevel: 'LOTS', topic: 'Hak dan Kewajiban' },
    { question: 'Semboyan persatuan bangsa yang dicengkeram oleh burung Garuda Pancasila adalah ...', correctAnswer: 'Bhinneka Tunggal Ika', cognitiveLevel: 'LOTS', topic: 'Semboyan Bangsa' }
];

const ISIAN_POOL_IPAS: QuestionBankItemIsian[] = [
    { question: 'Bagian tumbuhan yang berfungsi menyerap air dan unsur hara dari dalam tanah adalah ...', correctAnswer: 'Akar', cognitiveLevel: 'LOTS', topic: 'Bagian Tumbuhan' },
    { minGrade: 3, maxGrade: 6, question: 'Zat hijau daun pada tumbuhan yang berfungsi menangkap sinar matahari dinamakan ...', correctAnswer: 'Klorofil', cognitiveLevel: 'LOTS', topic: 'Fotosintesis' },
    { minGrade: 3, maxGrade: 6, question: 'Proses memasak makanan pada tumbuhan hijau dengan bantuan cahaya matahari dinamakan ...', correctAnswer: 'Fotosintesis', cognitiveLevel: 'LOTS', topic: 'Fotosintesis' },
    { question: 'Peristiwa perubahan wujud zat dari cair menjadi padat dinamakan ...', correctAnswer: 'Membeku', cognitiveLevel: 'LOTS', topic: 'Wujud Zat' },
    { question: 'Peristiwa perubahan wujud zat dari padat menjadi cair dinamakan ...', correctAnswer: 'Mencair (Melebur)', cognitiveLevel: 'LOTS', topic: 'Wujud Zat' },
    { question: 'Peristiwa perubahan wujud zat dari cair menjadi gas/uap dinamakan ...', correctAnswer: 'Menguap', cognitiveLevel: 'LOTS', topic: 'Wujud Zat' },
    { minGrade: 3, maxGrade: 6, question: 'Peristiwa perubahan wujud zat dari gas menjadi cair dinamakan ...', correctAnswer: 'Mengembun (Kondensasi)', cognitiveLevel: 'LOTS', topic: 'Wujud Zat' },
    { minGrade: 3, maxGrade: 6, question: 'Hewan pemakan tumbuhan digolongkan ke dalam kelompok hewan ...', correctAnswer: 'Herbivora', cognitiveLevel: 'LOTS', topic: 'Penggolongan Hewan' },
    { minGrade: 3, maxGrade: 6, question: 'Hewan pemakan daging digolongkan ke dalam kelompok hewan ...', correctAnswer: 'Karnivora', cognitiveLevel: 'LOTS', topic: 'Penggolongan Hewan' },
    { minGrade: 3, maxGrade: 6, question: 'Hewan pemakan segala (tumbuhan dan hewan lain) digolongkan ke dalam kelompok hewan ...', correctAnswer: 'Omnivora', cognitiveLevel: 'LOTS', topic: 'Penggolongan Hewan' },
    { minGrade: 3, maxGrade: 6, question: 'Gaya tarik bumi yang menyebabkan benda jatuh menuju pusat bumi dinamakan gaya ...', correctAnswer: 'Gravitasi', cognitiveLevel: 'LOTS', topic: 'Gaya' },
    { minGrade: 5, maxGrade: 6, question: 'Perputaran bumi pada porosnya sendiri dinamakan peristiwa ...', correctAnswer: 'Rotasi bumi', cognitiveLevel: 'LOTS', topic: 'Tata Surya' }
];

const ISIAN_POOL_PJOK: QuestionBankItemIsian[] = [
    { question: 'Latihan pelemasan dan peregangan otot sebelum melakukan olahraga inti disebut ...', correctAnswer: 'Pemanasan (Warming up)', cognitiveLevel: 'LOTS', topic: 'Pemanasan' },
    { question: 'Gerak dasar berpindah tempat seperti berjalan, berlari, dan melompat disebut gerak ...', correctAnswer: 'Lokomotor', cognitiveLevel: 'LOTS', topic: 'Gerak Lokomotor' },
    { question: 'Gerak dasar di tempat tanpa berpindah posisi seperti membungkuk dan mengayun disebut gerak ...', correctAnswer: 'Nonlokomotor', cognitiveLevel: 'LOTS', topic: 'Gerak Nonlokomotor' },
    { question: 'Gerak dasar menggunakan objek atau alat seperti melempar dan menendang bola disebut gerak ...', correctAnswer: 'Manipulatif', cognitiveLevel: 'LOTS', topic: 'Gerak Manipulatif' },
    { question: 'Induk organisasi cabang olahraga sepak bola di seluruh Indonesia bernama ...', correctAnswer: 'PSSI', cognitiveLevel: 'LOTS', topic: 'Permainan Bola Besar' },
    { question: 'Jumlah pemain inti dalam satu regu permainan sepak bola di lapangan adalah ... orang.', correctAnswer: '11', cognitiveLevel: 'LOTS', topic: 'Sepak Bola' },
    { question: 'Dalam permainan bola basket, teknik menggiring bola dengan cara memantulkannya ke lantai disebut ...', correctAnswer: 'Dribbling', cognitiveLevel: 'MOTS', topic: 'Bola Basket' },
    { question: 'Sikap awal yang digunakan pada cabang olahraga atletik lari jarak pendek (sprint) adalah start ...', correctAnswer: 'Jongkok', cognitiveLevel: 'LOTS', topic: 'Atletik' },
    { question: 'Seni bela diri asli warisan budaya bangsa Indonesia adalah ...', correctAnswer: 'Pencak silat', cognitiveLevel: 'LOTS', topic: 'Bela Diri' },
    { question: 'Alat alas empuk yang digunakan untuk menjaga keselamatan saat latihan senam lantai disebut ...', correctAnswer: 'Matras', cognitiveLevel: 'LOTS', topic: 'Senam Lantai' },
    { question: 'Bentuk latihan kebugaran jasmani untuk melatih kekuatan otot perut dengan berbaring lalu bangkit duduk disebut ...', correctAnswer: 'Sit-up', cognitiveLevel: 'LOTS', topic: 'Kebugaran Jasmani' },
    { question: 'Bentuk pertolongan sementara yang diberikan secara cepat sebelum korban dibawa ke dokter atau rumah sakit disingkat ...', correctAnswer: 'P3K (Pertolongan Pertama Pada Kecelakaan)', cognitiveLevel: 'LOTS', topic: 'Kesehatan & P3K' }
];

const ISIAN_POOL_SENI: QuestionBankItemIsian[] = [
    { question: 'Tiga warna dasar (merah, kuning, dan biru) yang tidak berasal dari campuran warna lain disebut warna ...', correctAnswer: 'Primer', cognitiveLevel: 'LOTS', topic: 'Warna' },
    { question: 'Hasil pencampuran warna primer merah dengan warna kuning akan menghasilkan warna sekunder yaitu ...', correctAnswer: 'Jingga (Oranye)', cognitiveLevel: 'MOTS', topic: 'Warna' },
    { question: 'Karya seni menempelkan potongan kertas, daun kering, atau biji-bijian pada satu bidang gambar disebut ...', correctAnswer: 'Kolase', cognitiveLevel: 'LOTS', topic: 'Seni Rupa 2D' },
    { question: 'Patung dan keramik yang memiliki panjang, lebar, dan tinggi termasuk karya seni rupa ... dimensi.', correctAnswer: 'Tiga', cognitiveLevel: 'LOTS', topic: 'Seni Rupa 3D' },
    { question: 'Ukuran cepat atau lambatnya suatu lagu saat dinyanyikan atau dimainkan disebut ...', correctAnswer: 'Tempo', cognitiveLevel: 'LOTS', topic: 'Seni Musik' },
    { question: 'Alat musik yang berfungsi mengatur ketukan irama seperti gendang dan tamborin disebut alat musik ...', correctAnswer: 'Ritmis', cognitiveLevel: 'LOTS', topic: 'Alat Musik' },
    { question: 'Garis lintasan di lantai yang dibentuk oleh formasi para penari di atas panggung disebut ...', correctAnswer: 'Pola lantai', cognitiveLevel: 'LOTS', topic: 'Seni Tari' },
    { question: 'Seni pertunjukan teater yang hanya menggunakan gerak tubuh dan mimik wajah tanpa mengucapkan kata-kata disebut ...', correctAnswer: 'Pantomim', cognitiveLevel: 'LOTS', topic: 'Seni Teater' },
    { question: 'Alat khusus berbentuk seperti pena berujung tembaga untuk melukis malam panas pada kain batik disebut ...', correctAnswer: 'Canting', cognitiveLevel: 'LOTS', topic: 'Seni Kriya' },
    { question: 'Tari Saman yang dimainkan secara kompak dengan posisi duduk berjajar lurus berasal dari Provinsi ...', correctAnswer: 'Aceh', cognitiveLevel: 'LOTS', topic: 'Tari Daerah' }
];

const ISIAN_POOL_INGGRIS: QuestionBankItemIsian[] = [
    { question: 'Ucapan salam dalam bahasa Inggris yang diucapkan ketika bertemu guru pada pagi hari adalah "Good ...".', correctAnswer: 'Morning', cognitiveLevel: 'LOTS', topic: 'Greetings' },
    { question: 'Arti kata "Library" dalam bahasa Indonesia adalah ...', correctAnswer: 'Perpustakaan', cognitiveLevel: 'LOTS', topic: 'School Places' },
    { question: 'Bahasa Inggris dari angka dua puluh lima (25) adalah ...', correctAnswer: 'Twenty-five', cognitiveLevel: 'LOTS', topic: 'Numbers' },
    { question: 'Kata depan bahasa Inggris yang bermakna "di bawah" (misalnya bola di bawah meja) adalah ...', correctAnswer: 'Under', cognitiveLevel: 'LOTS', topic: 'Prepositions' },
    { question: 'Hari setelah hari Rabu (Wednesday) dalam bahasa Inggris adalah hari ...', correctAnswer: 'Thursday', cognitiveLevel: 'LOTS', topic: 'Days of the Week' },
    { question: 'Lawan kata (opposite) dari kata "Tall" (tinggi) dalam bahasa Inggris adalah ...', correctAnswer: 'Short', cognitiveLevel: 'LOTS', topic: 'Adjectives' },
    { question: 'Bentuk kata kerja lampau (Verb 2) dari kata "go" (pergi) adalah ...', correctAnswer: 'Went', cognitiveLevel: 'MOTS', topic: 'Simple Past Tense' },
    { question: 'Ibu dari ibu atau ayah kita dalam bahasa Inggris disebut ...', correctAnswer: 'Grandmother', cognitiveLevel: 'LOTS', topic: 'Family Members' },
    { question: 'Arti kalimat perintah "Open the window, please!" adalah ...', correctAnswer: 'Tolong buka jendelanya!', cognitiveLevel: 'MOTS', topic: 'Imperative Sentences' },
    { question: 'Benda yang dipakai saat hari hujan untuk melindungi tubuh agar tidak basah dalam bahasa Inggris disebut ...', correctAnswer: 'Umbrella / Raincoat', cognitiveLevel: 'LOTS', topic: 'Weather' }
];

const ISIAN_POOL_PAI: QuestionBankItemIsian[] = [
    { question: 'Asmaul Husna "Al-Basir" memiliki arti bahwa Allah Swt. Maha ...', correctAnswer: 'Melihat', cognitiveLevel: 'LOTS', topic: 'Asmaul Husna' },
    { question: 'Salat fardu yang dikerjakan pada waktu fajar menjelang terbit matahari sebanyak 2 rakaat adalah salat ...', correctAnswer: 'Subuh', cognitiveLevel: 'LOTS', topic: 'Salat Wajib' },
    { question: 'Kegiatan menyucikan diri dari hadas kecil sebelum melaksanakan salat menggunakan air bersih disebut ...', correctAnswer: 'Wudu', cognitiveLevel: 'LOTS', topic: 'Taharah' },
    { question: 'Gelar kehormatan yang diberikan masyarakat Makkah kepada Nabi Muhammad saw. karena kejujurannya adalah ...', correctAnswer: 'Al-Amin', cognitiveLevel: 'LOTS', topic: 'Keteladanan Nabi' },
    { question: 'Malaikat Allah yang bertugas menyampaikan wahyu kepada para nabi dan rasul adalah Malaikat ...', correctAnswer: 'Jibril', cognitiveLevel: 'LOTS', topic: 'Iman kepada Malaikat' },
    { question: 'Zakat yang wajib dikeluarkan umat Islam menjelang Hari Raya Idulfitri berupa makanan pokok adalah zakat ...', correctAnswer: 'Fitrah', cognitiveLevel: 'LOTS', topic: 'Zakat' },
    { question: 'Kitab suci yang diturunkan Allah Swt. kepada Nabi Muhammad saw. sebagai penyempurna kitab terdahulu adalah ...', correctAnswer: 'Al-Qur’an', cognitiveLevel: 'LOTS', topic: 'Iman kepada Kitab' },
    { question: 'Sikap saling menghargai perbedaan agama, suku, dan budaya dalam kehidupan bermasyarakat disebut ...', correctAnswer: 'Toleransi (Tasamuh)', cognitiveLevel: 'LOTS', topic: 'Akhlak Mulia' },
    { question: 'Surah Al-Fatihah sebagai pembuka kitab suci Al-Qur’an terdiri dari ... ayat.', correctAnswer: '7 (Tujuh)', cognitiveLevel: 'LOTS', topic: 'Al-Qur’an' },
    { question: 'Berbakti dan berbuat baik kepada kedua orang tua dalam ajaran Islam dikenal dengan istilah ...', correctAnswer: 'Birrul walidain', cognitiveLevel: 'MOTS', topic: 'Berbakti kepada Orang Tua' }
];

const ISIAN_POOL_KODING: QuestionBankItemIsian[] = [
    { question: 'Urutan langkah-langkah logis dan sistematis untuk menyelesaikan suatu persoalan komputasi disebut ...', correctAnswer: 'Algoritma', cognitiveLevel: 'LOTS', topic: 'Algoritma' },
    { question: 'Teknik memecah masalah besar menjadi bagian-bagian kecil agar lebih mudah diselesaikan disebut ...', correctAnswer: 'Dekomposisi', cognitiveLevel: 'MOTS', topic: 'Berpikir Komputasional' },
    { question: 'Perintah pemrograman untuk mengulang suatu blok instruksi berkali-kali secara otomatis disebut ...', correctAnswer: 'Perulangan (Loop)', cognitiveLevel: 'LOTS', topic: 'Looping' },
    { question: 'Kegiatan menemukan dan memperbaiki kesalahan (bug) dalam baris kode program disebut ...', correctAnswer: 'Debugging', cognitiveLevel: 'MOTS', topic: 'Debugging' },
    { question: 'Struktur pengambilan keputusan dalam program menggunakan kondisi "JIKA ... MAKA ..." disebut ...', correctAnswer: 'Percabangan (Kondisional IF)', cognitiveLevel: 'MOTS', topic: 'Kondisional' },
    { question: 'Kumpulan data contoh yang dipakai untuk melatih sistem Kecerdasan Artifisial (AI) agar pintar mengenali pola disebut ...', correctAnswer: 'Data latih (Training data)', cognitiveLevel: 'MOTS', topic: 'Kecerdasan Artifisial' },
    { question: 'Kata rahasia rahasia (sandi) akun digital pribadi sebaiknya tidak dibagikan kepada orang lain demi menjaga ...', correctAnswer: 'Keamanan dan privasi data', cognitiveLevel: 'LOTS', topic: 'Keamanan Digital' },
    { question: 'Simbol diagram langkah yang berbentuk panah berfungsi menunjukkan arah ... program.', correctAnswer: 'Alur proses', cognitiveLevel: 'LOTS', topic: 'Diagram Alir' }
];

const ISIAN_POOL_MULOK: QuestionBankItemIsian[] = [
    { question: 'Penggunaan bahasa daerah yang halus ketika berbicara dengan orang tua dan guru mencerminkan sikap ...', correctAnswer: 'Sopan santun (Tata krama)', cognitiveLevel: 'LOTS', topic: 'Tata Krama' },
    { question: 'Alat musik tradisional khas Indonesia yang terbuat dari susunan bilah bambu dan dibunyikan dengan cara digoyangkan adalah ...', correctAnswer: 'Angklung', cognitiveLevel: 'LOTS', topic: 'Musik Daerah' },
    { question: 'Permainan tradisional anak yang dimainkan dengan melompati kotak-kotak gambar di halaman menggunakan satu kaki disebut ...', correctAnswer: 'Engklek', cognitiveLevel: 'LOTS', topic: 'Permainan Tradisional' },
    { question: 'Pesan kebaikan atau nasihat moral yang terkandung di dalam sebuah cerita rakyat daerah disebut ...', correctAnswer: 'Amanat', cognitiveLevel: 'LOTS', topic: 'Cerita Rakyat' },
    { question: 'Kegiatan bekerja bersama-sama membersihkan lingkungan kampung secara sukarela demi kepentingan bersama disebut ...', correctAnswer: 'Gotong royong (Kerja bakti)', cognitiveLevel: 'LOTS', topic: 'Kearifan Lokal' },
    { question: 'Kain tradisional bercorak khas Nusantara yang dibuat dengan teknik melukis lilin malam memakai canting adalah ...', correctAnswer: 'Batik', cognitiveLevel: 'LOTS', topic: 'Kerajinan Daerah' },
    { question: 'Bahasa resmi pemersatu antar-suku bangsa yang digunakan di seluruh wilayah Negara Kesatuan Republik Indonesia adalah bahasa ...', correctAnswer: 'Indonesia', cognitiveLevel: 'LOTS', topic: 'Bahasa dan Budaya' },
    { question: 'Membeli kue tradisional buatan tetangga dan petani desa membantu meningkatkan perekonomian ...', correctAnswer: 'Lokal (Masyarakat sekitar)', cognitiveLevel: 'MOTS', topic: 'Ekonomi Lokal' }
];

// ==========================================
// 6. EXTENSIVE QUESTION BANKS (SOAL URAIAN)
// ==========================================
const URAIAN_POOL_MATEMATIKA: QuestionBankItemUraian[] = [
    {
        minGrade: 1,
        maxGrade: 2,
        question: 'Siti memiliki 24 stiker bintang, lalu Kakak memberinya 15 stiker lagi. Sebanyak 10 stiker diberikan kepada adiknya. Berapa banyak stiker Siti sekarang? Tuliskan cara menghitungnya!',
        correctAnswer: 'Langkah Penyelesaian:\n1. Jumlah stiker setelah diberi Kakak = 24 + 15 = 39 stiker.\n2. Sisa stiker setelah diberikan kepada adik = 39 - 10 = 29 stiker.\nJadi, stiker Siti sekarang berjumlah 29 buah.',
        cognitiveLevel: 'MOTS',
        topic: 'Penjumlahan dan Pengurangan Sederhana',
        rubric: {
            score3: 'Menuliskan langkah penjumlahan dan pengurangan berurutan dengan hasil 29 secara tepat.',
            score2: 'Langkah benar namun terdapat kesalahan hitung akhir.',
            score1: 'Hanya mengerjakan satu langkah hitung.',
            score0: 'Tidak menjawab atau salah seluruhnya.'
        }
    },
    {
        minGrade: 1,
        maxGrade: 2,
        question: 'Sebutkan 3 benda di dalam ruang kelasmu yang berbentuk bangun datar segiempat dan lingkaran!',
        correctAnswer: 'Contoh jawaban:\n- Segiempat: papan tulis, permukaan meja, jendela, atau buku tulis.\n- Lingkaran: jam dinding kelas atau uang koin.',
        cognitiveLevel: 'LOTS',
        topic: 'Mengenal Bangun Datar Sekitar',
        rubric: {
            score3: 'Menyebutkan 3 benda kelas sesuai bentuk segiempat dan lingkaran dengan benar.',
            score2: 'Menyebutkan 2 benda yang tepat.',
            score1: 'Hanya menyebutkan 1 benda yang tepat.',
            score0: 'Tidak ada jawaban.'
        }
    },
    {
        minGrade: 3,
        maxGrade: 6,
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
        minGrade: 3,
        maxGrade: 6,
        question: 'Di perpustakaan sekolah terdapat 12 rak buku. Setiap rak berisi 45 eksemplar buku cerita. Jika sebanyak 80 buku dipinjam oleh siswa, berapa sisa buku yang masih ada di perpustakaan? Tuliskan kalimat matematika dan langkah penyelesaiannya!',
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
        minGrade: 5,
        maxGrade: 6,
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
        minGrade: 5,
        maxGrade: 6,
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
        minGrade: 4,
        maxGrade: 6,
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
    },
    {
        minGrade: 1, maxGrade: 2,
        question: 'Sebutkan 3 bagian tubuh tumbuhan yang sering kamu lihat di halaman rumah beserta kegunaan masing-masing bagian tersebut!',
        correctAnswer: '1. Akar: menyerap air dan menguatkan batang di tanah.\n2. Batang: menopang tumbuhan dan menyalurkan air ke daun.\n3. Daun: tempat membuat makanan dan membuat tumbuhan tampak hijau segar.',
        cognitiveLevel: 'MOTS',
        topic: 'Bagian Tubuh Tumbuhan',
        rubric: {
            score3: 'Menyebutkan 3 bagian tumbuhan dan menjelaskan kegunaannya dengan bahasa sederhana yang benar.',
            score2: 'Menyebutkan 2 bagian tumbuhan dan kegunaannya dengan tepat.',
            score1: 'Hanya menyebutkan nama bagian tumbuhan tanpa kegunaan.',
            score0: 'Kosong.'
        }
    },
    {
        minGrade: 1, maxGrade: 2,
        question: 'Bagaimana cara merawat hewan peliharaan dan tanaman di rumah agar tetap tumbuh sehat? Tuliskan masing-masing 2 contohnya!',
        correctAnswer: 'Merawat hewan: memberi makan dan minum teratur, serta membersihkan kandangnya.\nMerawat tanaman: menyiram secara teratur pagi atau sore hari dan memberi pupuk.',
        cognitiveLevel: 'MOTS',
        topic: 'Merawat Makhluk Hidup',
        rubric: {
            score3: 'Menuliskan 2 cara merawat hewan dan 2 cara merawat tanaman dengan tepat.',
            score2: 'Menuliskan cara merawat hewan dan tanaman masing-masing 1 contoh.',
            score1: 'Hanya menjelaskan salah satu saja.',
            score0: 'Kosong.'
        }
    }
];

const URAIAN_POOL_PJOK: QuestionBankItemUraian[] = [
    {
        question: 'Jelaskan mengapa kita wajib melakukan pemanasan sebelum berolahraga dan pendinginan setelah berolahraga! Sebutkan pula masing-masing 2 contoh gerakannya!',
        correctAnswer: 'Penjelasan:\n1. Pemanasan berfungsi meningkatkan suhu tubuh, melenturkan otot dan sendi, serta mencegah cedera otot. Contoh: lari di tempat dan peregangan lengan/kaki.\n2. Pendinginan berfungsi menurunkan detak jantung secara bertahap dan mengurangi pegal otot. Contoh: berjalan santai dan mengatur napas dalam.',
        cognitiveLevel: 'HOTS',
        topic: 'Pemanasan dan Pendinginan',
        rubric: {
            score3: 'Menjelaskan fungsi pemanasan dan pendinginan secara tepat serta memberikan 2 contoh gerakan masing-masing.',
            score2: 'Fungsi benar tetapi contoh gerakan hanya menyebutkan 1 atau kurang lengkap.',
            score1: 'Hanya menjelaskan salah satu (pemanasan atau pendinginan).',
            score0: 'Tidak ada jawaban.'
        }
    },
    {
        question: 'Bedakan pengertian gerak dasar lokomotor, nonlokomotor, dan manipulatif dalam PJOK! Berikan masing-masing 2 contoh gerakannya dalam kehidupan sehari-hari atau olahraga!',
        correctAnswer: 'Perbedaan Gerak Dasar:\n1. Lokomotor: Gerak berpindah tempat (contoh: berlari, melompat).\n2. Nonlokomotor: Gerak di tempat tanpa berpindah posisi (contoh: membungkuk, memutar badan).\n3. Manipulatif: Gerak mengendalikan objek/alat (contoh: melempar bola, menendang bola).',
        cognitiveLevel: 'HOTS',
        topic: 'Kombinasi Gerak Dasar',
        rubric: {
            score3: 'Menjelaskan ketiga jenis gerak dasar dengan akurat beserta contoh masing-masing yang tepat.',
            score2: 'Menjelaskan ketiga gerak tetapi salah satu contoh kurang sesuai.',
            score1: 'Hanya menjelaskan sebagian konsep gerak dasar.',
            score0: 'Salah atau tidak menjawab.'
        }
    },
    {
        question: 'Saat temanmu jatuh berlari di halaman sekolah dan lututnya mengalami luka lecet berdarah ringan, jelaskan langkah-langkah pertolongan pertama (P3K) yang benar dan higienis untuk menolongnya!',
        correctAnswer: 'Langkah P3K Luka Lecet:\n1. Cuci tangan penolong terlebih dahulu.\n2. Bersihkan kotoran pada luka memakai air bersih mengalir.\n3. Keringkan perlahan dengan kain kasa bersih, lalu oleskan cairan antiseptik.\n4. Tutup luka menggunakan plester atau kasa steril agar tidak terkena debu/kuman.',
        cognitiveLevel: 'HOTS',
        topic: 'Pertolongan Pertama (P3K)',
        rubric: {
            score3: 'Menuliskan urutan P3K secara higienis, runtut, dan aman mulai dari mencuci luka hingga menutupnya.',
            score2: 'Langkah utama benar namun urutan atau aspek kebersihan kurang terinci.',
            score1: 'Hanya menuliskan 1 langkah umum.',
            score0: 'Tidak ada jawaban.'
        }
    },
    {
        minGrade: 4, maxGrade: 6,
        question: 'Sebutkan 3 cara menjaga kesehatan dan kebugaran jasmani bagi siswa SD dalam keseharian, serta jelaskan mengapa merokok dan zat adiktif harus dijauhi sejak usia sekolah!',
        correctAnswer: 'Cara Menjaga Kebugaran:\n1. Olahraga teratur 30 menit per hari.\n2. Mengonsumsi makanan bergizi seimbang dan minum cukup air putih.\n3. Istirahat dan tidur cukup (8-9 jam per hari).\nAlasan menjauhi rokok: Nikotin dan tar merusak paru-paru, jantung, menurunkan stamina belajar, dan menyebabkan ketergantungan berbahaya.',
        cognitiveLevel: 'HOTS',
        topic: 'Pola Hidup Sehat',
        rubric: {
            score3: 'Menyebutkan 3 pola hidup sehat dan menjelaskan dampak buruk rokok terhadap organ dan prestasi siswa.',
            score2: 'Menyebutkan pola hidup sehat dengan baik tetapi alasan menjauhi rokok masih singkat.',
            score1: 'Jawaban kurang relevan atau terlalu singkat.',
            score0: 'Kosong.'
        }
    },
    {
        minGrade: 1, maxGrade: 2,
        question: 'Tuliskan 3 kebiasaan menjaga kebersihan diri sebelum makan dan setelah bermain di luar rumah agar tubuh tetap sehat!',
        correctAnswer: '1. Mencuci tangan memakai sabun dan air mengalir setelah bermain dan sebelum makan.\n2. Memotong kuku secara rutin agar kotoran tidak menempel.\n3. Mandi teratur dua kali sehari dan mengganti pakaian yang kotor.',
        cognitiveLevel: 'LOTS',
        topic: 'Kebersihan Diri Anak',
        rubric: {
            score3: 'Menyebutkan 3 kebiasaan kebersihan diri dengan jelas dan relevan.',
            score2: 'Menyebutkan 2 kebiasaan yang benar.',
            score1: 'Hanya menyebutkan 1 kebiasaan.',
            score0: 'Kosong.'
        }
    },
    {
        minGrade: 1, maxGrade: 2,
        question: 'Mengapa saat duduk belajar di kursi dan berjalan menuju sekolah tubuh kita harus tegak? Berikan 2 contoh sikap tubuh yang baik!',
        correctAnswer: 'Tubuh harus tegak agar tulang punggung tumbuh sehat, tidak mudah pegal, dan pernapasan lancar.\nContoh: duduk menempel punggung ke sandaran kursi saat menulis dan berjalan menghadap ke depan tanpa membungkuk.',
        cognitiveLevel: 'MOTS',
        topic: 'Sikap Tubuh yang Benar',
        rubric: {
            score3: 'Menjelaskan manfaat sikap tubuh tegak dan memberikan 2 contoh sikap duduk/berjalan yang benar.',
            score2: 'Alasan tepat dengan 1 contoh sikap tubuh.',
            score1: 'Penjelasan sangat singkat.',
            score0: 'Kosong.'
        }
    },
    {
        question: 'Dalam permainan beregu seperti sepak bola, bola voli, atau kasti, sikap sportivitas sangat diutamakan. Jelaskan apa arti sportivitas dan berikan 2 contoh perilaku sportif saat menang maupun saat kalah bertanding!',
        correctAnswer: 'Arti Sportivitas: Sikap jujur, adil, mematuhi aturan pertandingan, dan menghormati lawan maupun wasit.\nContoh:\n- Saat menang: Tidak mengejek atau menyombongkan diri di hadapan tim lawan, serta memberi salam kepada lawan.\n- Saat kalah: Mengakui keunggulan lawan dengan berjiwa besar, tetap berjabat tangan, dan menjadikannya motivasi berlatih lebih giat.',
        cognitiveLevel: 'HOTS',
        topic: 'Nilai Sportivitas Olahraga',
        rubric: {
            score3: 'Mendefinisikan sportivitas dengan tepat dan memberikan contoh konkret saat menang maupun kalah.',
            score2: 'Definisi benar namun contoh hanya mencakup kondisi menang atau kalah saja.',
            score1: 'Hanya menuliskan contoh umum tanpa penjelasan sportivitas.',
            score0: 'Tidak ada jawaban.'
        }
    }
];

const URAIAN_POOL_SENI: QuestionBankItemUraian[] = [
    {
        question: 'Jelaskan perbedaan antara karya seni rupa dua dimensi (2D) dan karya seni rupa tiga dimensi (3D)! Berikan masing-masing 2 contoh hasil karyanya!',
        correctAnswer: 'Perbedaan:\n1. Karya 2D hanya memiliki ukuran panjang dan lebar serta dinikmati dari satu arah depan (contoh: lukisan, poster, gambar ilustrasi).\n2. Karya 3D memiliki panjang, lebar, tinggi/volume, serta dinikmati dari segala arah (contoh: patung tanah liat, gerabah/kendi, anyaman keranjang).',
        cognitiveLevel: 'HOTS',
        topic: 'Karya Seni Rupa 2D dan 3D',
        rubric: {
            score3: 'Menjelaskan perbedaan dimensi dan sudut pandang secara tepat disertai 2 contoh karya masing-masing.',
            score2: 'Perbedaan benar tetapi contoh hanya 1 atau kurang lengkap.',
            score1: 'Hanya menjelaskan salah satu jenis karya.',
            score0: 'Tidak ada jawaban.'
        }
    },
    {
        question: 'Dalam seni musik, mengapa alat musik ritmis dan alat musik melodis sering dimainkan bersama dalam sebuah pementasan lagu? Jelaskan fungsi masing-masing beserta 2 contoh alat musiknya!',
        correctAnswer: 'Penjelasan:\n1. Alat musik ritmis (contoh: gendang, tamborin) berfungsi menjaga ketukan, irama, dan tempo lagu.\n2. Alat musik melodis (contoh: pianika, rekorder, gitar) berfungsi memainkan rangkaian nada lagu.\nJika dipadukan, musik terdengar harmonis, berirama mantap, dan indah.',
        cognitiveLevel: 'HOTS',
        topic: 'Ansambel Musik Sederhana',
        rubric: {
            score3: 'Menjelaskan peran ritmis dan melodis beserta perpaduannya dengan 2 contoh alat musik tiap kategori.',
            score2: 'Fungsi dan contoh benar tetapi penjelasan perpaduan kurang mendalam.',
            score1: 'Hanya menyebutkan contoh alat musik.',
            score0: 'Kosong.'
        }
    },
    {
        question: 'Jelaskan 3 unsur utama dalam seni tari Nusantara (Wiraga, Wirama, dan Wirasa), serta mengapa penari berkelompok membutuhkan pola lantai saat tampil di panggung?',
        correctAnswer: 'Unsur Tari:\n1. Wiraga: Keterampilan olah gerak tubuh penari.\n2. Wirama: Kesesuaian gerak terhadap irama dan tempo musik.\n3. Wirasa: Penghayatan ekspresi dan perasaan tarian.\nFungsi pola lantai: Menata perpindahan posisi penari agar rapi, tidak bertabrakan, dinamis, dan indah dipandang.',
        cognitiveLevel: 'HOTS',
        topic: 'Unsur Tari dan Pola Lantai',
        rubric: {
            score3: 'Menguraikan Wiraga-Wirama-Wirasa secara tepat beserta fungsi pola lantai dalam tari kelompok.',
            score2: 'Menjelaskan 3 unsur dengan baik namun fungsi pola lantai belum tuntas.',
            score1: 'Hanya menyebutkan istilah tanpa uraian.',
            score0: 'Tidak menjawab.'
        }
    },
    {
        question: 'Bagaimana cara seorang pemain pantomim menyampaikan isi cerita kepada penonton tanpa berbicara? Jelaskan 3 hal yang harus dilatih agar pementasan pantomim berhasil memukau penonton!',
        correctAnswer: 'Cara penyampaian pantomim: Melalui gerak tubuh (gestur), imajinasi benda tak kasat mata, dan mimik wajah yang ekspresif.\nYang harus dilatih:\n1. Olah tubuh dan kelenturan gerak.\n2. Olah mimik/ekspresi wajah (sedih, senang, terkejut).\n3. Daya imajinasi dan kreativitas alur cerita.',
        cognitiveLevel: 'HOTS',
        topic: 'Seni Teater Pantomim',
        rubric: {
            score3: 'Menjelaskan teknik non-verbal pantomim dan menyebutkan 3 unsur latihan secara jelas.',
            score2: 'Menyebutkan 2 hal yang perlu dilatih dengan tepat.',
            score1: 'Penjelasan sangat singkat.',
            score0: 'Kosong.'
        }
    }
];

const URAIAN_POOL_INGGRIS: QuestionBankItemUraian[] = [
    {
        minGrade: 3, maxGrade: 6,
        question: 'Write a short self-introduction paragraph in English (at least 4 sentences) telling your name, your class, your school name, and your hobby!',
        correctAnswer: 'Example:\n"Hello friends, my name is Andi Pratama. I am an elementary school student at SDN Sukatinggal. I live near the school with my family. My favorite hobby is reading science books and playing badminton."',
        cognitiveLevel: 'HOTS',
        topic: 'Self Introduction Writing',
        rubric: {
            score3: 'Writes at least 4 grammatically clear English sentences covering name, grade, school, and hobby.',
            score2: 'Covers all points in 3 sentences with minor grammar/spelling slips.',
            score1: 'Incomplete information or fewer than 2 clear sentences.',
            score0: 'Blank or off-topic.'
        }
    },
    {
        minGrade: 2, maxGrade: 6,
        question: 'Mention 3 things you can find inside your classroom in English, then make 3 simple sentences describing their locations using "on", "in", or "under"!',
        correctAnswer: 'Objects: book, pencil, school bag.\nSentences:\n1. My English book is on the wooden desk.\n2. The pencils are in my pencil case.\n3. My school bag is under the chair.',
        cognitiveLevel: 'HOTS',
        topic: 'Classroom Objects & Prepositions',
        rubric: {
            score3: 'Lists 3 classroom objects and writes 3 accurate sentences using in, on, and under properly.',
            score2: 'Objects correct and 2 sentences use prepositions correctly.',
            score1: 'Only lists objects without complete sentences.',
            score0: 'Blank.'
        }
    },
    {
        minGrade: 3, maxGrade: 6,
        question: 'Write 3 sentences in English telling about your daily morning activities before going to school (Simple Present Tense)!',
        correctAnswer: 'Example:\n1. I wake up at five o’clock every morning.\n2. I take a bath and eat a healthy breakfast.\n3. I go to school with my friends at six thirty.',
        cognitiveLevel: 'HOTS',
        topic: 'Daily Routines (Simple Present)',
        rubric: {
            score3: 'Writes 3 clear, correctly structured Simple Present Tense sentences about morning routines.',
            score2: 'Writes 2–3 understandable sentences with minor verb errors.',
            score1: 'Only 1 sentence written accurately.',
            score0: 'Blank.'
        }
    },
    {
        minGrade: 1, maxGrade: 2,
        question: 'Write 3 names of fruits and 3 names of colors in English cleanly!',
        correctAnswer: 'Fruits: Apple, Banana, Mango (or Orange, Grape).\nColors: Red, Blue, Yellow (or Green, White).',
        cognitiveLevel: 'LOTS',
        topic: 'Fruits and Colors Vocabulary',
        rubric: {
            score3: 'Writes 3 English fruit names and 3 color names with accurate spelling.',
            score2: 'Writes 4-5 correct English words across fruits and colors.',
            score1: 'Only 1-3 words written accurately.',
            score0: 'Blank.'
        }
    },
    {
        minGrade: 1, maxGrade: 2,
        question: 'Complete and write 2 simple English greeting sentences: one for saying hello in the morning and one for telling your name!',
        correctAnswer: '1. Good morning, friends!\n2. Hello, my name is Siti. Nice to meet you.',
        cognitiveLevel: 'LOTS',
        topic: 'Simple Greetings and Name',
        rubric: {
            score3: 'Writes both simple greeting and name introduction sentences accurately in English.',
            score2: 'Writes one sentence clearly and the second with minor spelling errors.',
            score1: 'Incomplete or unclear words.',
            score0: 'Blank.'
        }
    }
];

const URAIAN_POOL_PAI: QuestionBankItemUraian[] = [
    {
        question: 'Mengapa sifat jujur dan amanah sangat penting dimiliki oleh seorang pelajar di sekolah maupun di rumah? Berikan 2 contoh perilaku jujur yang dapat kamu terapkan setiap hari!',
        correctAnswer: 'Pentingnya jujur dan amanah: Melahirkan kepercayaan dari orang tua, guru, dan teman, menjaga ketenangan hati, serta merupakan perintah Allah dan teladan Nabi Muhammad saw.\nContoh: Tidak mencontek saat ulangan dan mengembalikan barang teman yang dipinjam.',
        cognitiveLevel: 'HOTS',
        topic: 'Akhlak Jujur dan Amanah',
        rubric: {
            score3: 'Menjelaskan manfaat kejujuran serta memberikan 2 contoh nyata yang relevan bagi siswa SD.',
            score2: 'Alasan tepat tetapi hanya menyebutkan 1 contoh.',
            score1: 'Penjelasan sangat singkat.',
            score0: 'Kosong.'
        }
    },
    {
        question: 'Jelaskan secara urut tata cara pelaksanaan wudu dari awal hingga akhir agar wudu kita sah untuk melaksanakan salat!',
        correctAnswer: 'Urutan Wudu:\n1. Membaca Basmalah dan niat berwudu.\n2. Mencuci telapak tangan, berkumur, dan membersihkan lubang hidung (sunah).\n3. Membasuh seluruh wajah.\n4. Membasuh kedua tangan hingga siku.\n5. Mengusap sebagian rambut kepala dan telinga.\n6. Membasuh kedua kaki hingga mata kaki dengan tertib dan berdoa.',
        cognitiveLevel: 'MOTS',
        topic: 'Tata Cara Wudu',
        rubric: {
            score3: 'Menjelaskan urutan rukun wudu secara tepat dan runtut dari niat sampai membasuh kaki.',
            score2: 'Urutan hampir lengkap namun 1 bagian terlewat.',
            score1: 'Urutan acak atau hanya menyebutkan 2 langkah.',
            score0: 'Tidak menjawab.'
        }
    },
    {
        question: 'Apa hikmah di balik penciptaan manusia yang bersuku-suku dan berbangsa-bangsa menurut Surah Al-Hujurat ayat 13? Bagaimana cara menerapkan sikap saling menghargai di kelas?',
        correctAnswer: 'Hikmah: Agar manusia saling mengenal (taaruf), saling menolong, dan berlomba dalam ketakwaan kepada Allah.\nPenerapan di kelas: Tidak memilih-milih teman berdasarkan suku atau daerah, menghormati perbedaan kebiasaan, dan bekerja sama dalam tugas kelompok.',
        cognitiveLevel: 'HOTS',
        topic: 'Toleransi dan Ukhuwah',
        rubric: {
            score3: 'Menjelaskan hikmah Surah Al-Hujurat ayat 13 dan memberi contoh nyata sikap toleran di kelas.',
            score2: 'Salah satu aspek (hikmah atau contoh kelas) dijelaskan cukup baik.',
            score1: 'Jawaban masih terlalu umum.',
            score0: 'Kosong.'
        }
    }
];

const URAIAN_POOL_KODING: QuestionBankItemUraian[] = [
    {
        question: 'Tuliskan sebuah algoritma sederhana berisi minimal 5 langkah berurutan untuk membuat minuman teh hangat manis yang aman dan tepat!',
        correctAnswer: 'Algoritma Membuat Teh Hangat:\n1. Siapkan gelas bersih, sendok, teh celup, gula pasir, dan air panas.\n2. Masukkan 1 kantong teh celup ke dalam gelas.\n3. Tuangkan air panas secukupnya ke dalam gelas.\n4. Tambahkan 1–2 sendok gula pasir, lalu aduk merata.\n5. Angkat kantong teh celup, tunggu hingga agak hangat, dan teh siap disajikan.',
        cognitiveLevel: 'HOTS',
        topic: 'Menyusun Algoritma Sederhana',
        rubric: {
            score3: 'Menuliskan minimal 5 langkah secara logis, berurutan, jelas, dan aman.',
            score2: 'Langkah logis namun urutannya kurang rinci (3–4 langkah).',
            score1: 'Langkah masih acak atau tidak lengkap.',
            score0: 'Kosong.'
        }
    },
    {
        question: 'Jelaskan perbedaan cara kerja Kecerdasan Artifisial (AI) dalam membantu pekerjaan manusia beserta 2 contoh manfaat AI dan 2 hal yang harus diwaspadai saat menggunakannya!',
        correctAnswer: 'Cara kerja AI: Mempelajari pola dari data latih untuk mengenali gambar/suara atau memberi rekomendasi.\nManfaat: Asisten penerjemah bahasa dan rekomendasi materi belajar.\nHal yang diwaspadai: Jangan membagikan data pribadi rahasia (alamat/sandi) dan selalu periksa kebenaran informasi karena AI dapat membuat kekeliruan.',
        cognitiveLevel: 'HOTS',
        topic: 'Literasi & Etika AI',
        rubric: {
            score3: 'Menjelaskan prinsip AI, 2 manfaat nyata, serta 2 kehati-hatian privasi dan verifikasi fakta.',
            score2: 'Menyebutkan manfaat dan kehati-hatian dengan cukup baik namun prinsip kerja kurang jelas.',
            score1: 'Hanya menyebutkan contoh aplikasi.',
            score0: 'Tidak menjawab.'
        }
    }
];

const URAIAN_POOL_MULOK: QuestionBankItemUraian[] = [
    {
        question: 'Sebutkan 2 permainan tradisional daerah yang kamu ketahui beserta cara memainkannya secara singkat, lalu jelaskan nilai positif yang dipelajari dari permainan tersebut!',
        correctAnswer: 'Contoh: 1. Engklek (melompat satu kaki pada petak kotak di tanah secara bergiliran tanpa menginjak garis). 2. Congklak (membagikan biji pada lubang papan secara berhitung).\nNilai positif: Melatih ketangkasan, berhitung, kejujuran terhadap aturan, serta kerukunan berteman.',
        cognitiveLevel: 'HOTS',
        topic: 'Pelestarian Permainan Tradisional',
        rubric: {
            score3: 'Menyebutkan 2 permainan tradisional, menjelaskan cara mainnya, dan menguraikan nilai karakter positif.',
            score2: 'Menyebutkan 2 permainan tetapi penjelasan cara main atau nilai masih singkat.',
            score1: 'Hanya menyebutkan nama permainan.',
            score0: 'Kosong.'
        }
    },
    {
        question: 'Mengapa generasi muda perlu mempelajari dan menggunakan bahasa daerah serta menjaga sopan santun kepada orang yang lebih tua? Berikan 2 cara konkret melestarikan budaya daerah di sekolah!',
        correctAnswer: 'Alasan: Agar bahasa daerah sebagai jati diri budaya lokal tidak punah dan tata krama pergaulan tetap terjaga.\nCara di sekolah: Mengadakan hari berbahasa daerah atau mengikuti ekstrakurikuler tari, lagu, dan alat musik tradisional.',
        cognitiveLevel: 'HOTS',
        topic: 'Pelestarian Bahasa dan Budaya Lokal',
        rubric: {
            score3: 'Menjelaskan alasan pelestarian bahasa dan sopan santun serta memberi 2 contoh kegiatan konkret di sekolah.',
            score2: 'Alasan benar namun contoh hanya 1.',
            score1: 'Jawaban kurang terstruktur.',
            score0: 'Kosong.'
        }
    }
];

// Helper to pick bank based on subject
function detectSubjectCategory(subject: string):
    | 'math'
    | 'pancasila'
    | 'ipas'
    | 'pjok'
    | 'seni'
    | 'inggris'
    | 'pai'
    | 'koding'
    | 'mulok'
    | 'indo' {
    const s = (subject || '').toLowerCase();
    if (s.includes('matematika') || s.includes('hitung') || s.includes('angka')) return 'math';
    if (s.includes('pancasila') || s.includes('ppkn') || s.includes('kewarganegaraan')) return 'pancasila';
    if (s.includes('ipas') || s.includes('alam') || s.includes('sosial') || /\bipa\b/.test(s) || /\bips\b/.test(s)) return 'ipas';
    if (s.includes('pjok') || s.includes('jasmani') || s.includes('olahraga') || s.includes('kesehatan') || s.includes('penjaskes')) return 'pjok';
    if (s.includes('seni') || s.includes('rupa') || s.includes('musik') || s.includes('tari') || s.includes('teater') || s.includes('sbdp')) return 'seni';
    if (s.includes('inggris') || s.includes('english')) return 'inggris';
    if (s.includes('agama') || s.includes('pai') || s.includes('mengaji') || s.includes('islam') || s.includes('budi pekerti')) return 'pai';
    if (s.includes('koding') || s.includes('kecerdasan') || s.includes('artifisial') || s.includes('informatika') || s.includes('komputer')) return 'koding';
    if (s.includes('muatan lokal') || s.includes('mulok') || s.includes('bahasa daerah') || s.includes('sunda') || s.includes('jawa') || s.includes('bali')) return 'mulok';
    return 'indo';
}

function getPgBankForSubject(subject: string): QuestionBankItemPG[] {
    const cat = detectSubjectCategory(subject);
    switch (cat) {
        case 'math': return MATH_PG_BANK;
        case 'pancasila': return PANCASILA_PG_BANK;
        case 'ipas': return IPAS_PG_BANK;
        case 'pjok': return PJOK_PG_BANK;
        case 'seni': {
            const s = subject.toLowerCase();
            if (s.includes('musik')) {
                return [...SENI_PG_BANK].sort((a, b) => (b.topic.toLowerCase().includes('musik') ? 1 : 0) - (a.topic.toLowerCase().includes('musik') ? 1 : 0));
            }
            if (s.includes('tari')) {
                return [...SENI_PG_BANK].sort((a, b) => (b.topic.toLowerCase().includes('tari') ? 1 : 0) - (a.topic.toLowerCase().includes('tari') ? 1 : 0));
            }
            if (s.includes('teater')) {
                return [...SENI_PG_BANK].sort((a, b) => (b.topic.toLowerCase().includes('teater') ? 1 : 0) - (a.topic.toLowerCase().includes('teater') ? 1 : 0));
            }
            return SENI_PG_BANK;
        }
        case 'inggris': return INGGRIS_PG_BANK;
        case 'pai': return PAI_PG_BANK;
        case 'koding': return KODING_PG_BANK;
        case 'mulok': return MULOK_PG_BANK;
        default: return INDO_PG_BANK;
    }
}

function getIsianBankForSubject(subject: string): QuestionBankItemIsian[] {
    const cat = detectSubjectCategory(subject);
    switch (cat) {
        case 'math': return ISIAN_POOL_MATEMATIKA;
        case 'pancasila': return ISIAN_POOL_PANCASILA;
        case 'ipas': return ISIAN_POOL_IPAS;
        case 'pjok': return ISIAN_POOL_PJOK;
        case 'seni': return ISIAN_POOL_SENI;
        case 'inggris': return ISIAN_POOL_INGGRIS;
        case 'pai': return ISIAN_POOL_PAI;
        case 'koding': return ISIAN_POOL_KODING;
        case 'mulok': return ISIAN_POOL_MULOK;
        default: return ISIAN_POOL_INDO;
    }
}

function getUraianBankForSubject(subject: string): QuestionBankItemUraian[] {
    const cat = detectSubjectCategory(subject);
    switch (cat) {
        case 'math': return URAIAN_POOL_MATEMATIKA;
        case 'pancasila': return URAIAN_POOL_PANCASILA;
        case 'ipas': return URAIAN_POOL_IPAS;
        case 'pjok': return URAIAN_POOL_PJOK;
        case 'seni': return URAIAN_POOL_SENI;
        case 'inggris': return URAIAN_POOL_INGGRIS;
        case 'pai': return URAIAN_POOL_PAI;
        case 'koding': return URAIAN_POOL_KODING;
        case 'mulok': return URAIAN_POOL_MULOK;
        default: return URAIAN_POOL_INDO;
    }
}

const GRADE_NAME_ROSTERS_ID: Record<number, string[]> = {
    1: ['Rafi', 'Nisa', 'Dito', 'Tari', 'Kiki', 'Mila'],
    2: ['Bima', 'Zara', 'Kevin', 'Wulan', 'Arka', 'Salsa'],
    3: ['Nadia', 'Bagas', 'Citra', 'Galih', 'Hana', 'Raka'],
    4: ['Farhan', 'Alya', 'Dimas', 'Putri', 'Gilang', 'Nayla'],
    5: ['Reza', 'Kayla', 'Ilham', 'Maya', 'Fikri', 'Tiara'],
    6: ['Andi', 'Siti', 'Budi', 'Lani', 'Edo', 'Dayu']
};

const GRADE_NAME_ROSTERS_EN: Record<number, string[]> = {
    1: ['Tim', 'Mia', 'Leo', 'Amy'],
    2: ['Ben', 'Sara', 'Max', 'Lily'],
    3: ['Ryan', 'Chloe', 'Noah', 'Ella'],
    4: ['Liam', 'Nora', 'Jake', 'Zoe'],
    5: ['Evan', 'Ruby', 'Adam', 'Maya'],
    6: ['Kevin', 'Emma', 'Dan', 'Kate']
};

function swapNamesForGrade(text: string, grade: number, variantNum: number, isEnglish: boolean): string {
    if (!text) return text;
    if (isEnglish) {
        const sourceEn = ['Andi', 'Budi', 'Siti', 'Ani', 'Rina', 'Tono'];
        const targetEn = GRADE_NAME_ROSTERS_EN[grade] || GRADE_NAME_ROSTERS_EN[4];
        let out = text;
        sourceEn.forEach((src, i) => {
            const replacement = targetEn[(i + variantNum) % targetEn.length];
            out = out.replace(new RegExp(`\\b${src}\\b`, 'g'), replacement);
        });
        return out;
    }
    const sourceId = ['Andi', 'Siti', 'Budi', 'Lani', 'Edo', 'Dayu', 'Udin', 'Beni', 'Rina', 'Tono', 'Dewi', 'Fajar'];
    const targetId = GRADE_NAME_ROSTERS_ID[grade] || GRADE_NAME_ROSTERS_ID[4];
    let out = text;
    sourceId.forEach((src, i) => {
        const replacement = targetId[(i + variantNum) % targetId.length];
        out = out.replace(new RegExp(`\\b${src}\\b`, 'g'), replacement);
    });
    return out;
}

function rephraseQuestionNatural(
    baseQuestion: string,
    baseStimulus: string | undefined,
    topic: string,
    grade: number,
    passIndex: number,
    isEnglish: boolean
): { question: string; stimulus: string } {
    let q = swapNamesForGrade(baseQuestion.trim(), grade, passIndex, isEnglish);
    let stim = swapNamesForGrade((baseStimulus || '').trim(), grade, passIndex, isEnglish);
    const topicClean = (topic || 'materi pokok').trim();
    const safePass = Math.max(0, passIndex);

    if (isEnglish) {
        const enStarters = [
            `Focus on ${topicClean}: `,
            `Read carefully and answer about ${topicClean.toLowerCase()}: `,
            `Think about what you learned in ${topicClean.toLowerCase()}. `,
            `Reviewing ${topicClean.toLowerCase()}, `,
            `Answer this prompt on ${topicClean.toLowerCase()}: `,
            `In daily English practice for ${topicClean.toLowerCase()}, `,
            `Based on the topic of ${topicClean.toLowerCase()}, `,
            `Check your understanding of ${topicClean.toLowerCase()}: `,
            `From your ${topicClean.toLowerCase()} lesson today, `,
            `Use your English knowledge on ${topicClean.toLowerCase()}: `,
            `Look closely at this ${topicClean.toLowerCase()} task: `,
            `For the ${topicClean.toLowerCase()} exercise, `
        ];
        const enClosings = [
            '',
            ' Write your best answer.',
            ' Answer clearly in English.',
            ' Double-check your spelling before finishing.'
        ];
        const sIdx = (safePass + grade) % enStarters.length;
        const cIdx = Math.floor(safePass / enStarters.length) % enClosings.length;
        if (cIdx === 1 || cIdx === 3) {
            q = q
                .replace(/\bis located\b/gi, 'can be found')
                .replace(/\bMention\b/g, 'List')
                .replace(/\bWrite\b/g, 'Compose')
                .replace(/\bWhere is\b/g, 'In which place is')
                .replace(/\bthe polite expression to say\b/gi, 'the kind phrase we use');
        } else if (cIdx === 2) {
            q = q
                .replace(/\bfavorite\b/gi, 'preferred')
                .replace(/\bfind\b/gi, 'spot')
                .replace(/\bsimple sentences\b/gi, 'short English sentences')
                .replace(/\bWhen someone helps you\b/gi, 'If a friend helps you');
        }
        const starter = enStarters[sIdx];
        const closing = enClosings[cIdx];
        const body = starter.endsWith(', ') ? `${q.charAt(0).toLowerCase()}${q.slice(1)}` : q;
        return {
            question: `${starter}${body}${closing}`,
            stimulus: stim
        };
    }

    const gradeAnchors: Record<number, string[]> = {
        1: [
            `Saat belajar bersama tentang ${topicClean}, `,
            `Coba pahami hal sederhana mengenai ${topicClean}: `,
            `Perhatikan cerita singkat tentang ${topicClean} berikut! `,
            `Dalam kegiatan bermain sambil belajar ${topicClean}, `,
            `Ayo ingat kembali materi ${topicClean}, `,
            `Simak penjelasan ringan mengenai ${topicClean} ini: `,
            `Di dalam kelas saat membahas ${topicClean}, `,
            `Mari berlatih menjawab soal ${topicClean} berikut: `,
            `Perhatikan contoh sehari-hari terkait ${topicClean}! `,
            `Ingat kembali pelajaran ${topicClean} hari ini, `,
            `Ayo amati pertanyaan mudah tentang ${topicClean}: `,
            `Sesuai topik ${topicClean} yang dipelajari, `
        ],
        2: [
            `Pada kegiatan belajar materi ${topicClean}, `,
            `Cermati contoh mengenai ${topicClean} berikut! `,
            `Ketika membahas topik ${topicClean} di sekolah, `,
            `Pahami uraian materi ${topicClean} ini, lalu `,
            `Dalam latihan soal ${topicClean} hari ini, `,
            `Perhatikan pertanyaan tentang ${topicClean}: `,
            `Saat berdiskusi singkat mengenai ${topicClean}, `,
            `Simak petunjuk materi ${topicClean} berikut ini! `,
            `Amati situasi yang berkaitan dengan ${topicClean}: `,
            `Untuk mengingat pelajaran ${topicClean}, `,
            `Coba jawab latihan seputar ${topicClean} ini: `,
            `Melalui kegiatan belajar ${topicClean}, `
        ],
        3: [
            `Berdasarkan pemahaman tentang ${topicClean}, `,
            `Saat mengamati topik ${topicClean}, `,
            `Dalam pembahasan materi ${topicClean}, `,
            `Cermatilah pertanyaan terkait ${topicClean} berikut: `,
            `Merujuk pada pokok bahasan ${topicClean}, `,
            `Ketika mempelajari konsep ${topicClean}, `,
            `Pada uraian pembelajaran ${topicClean}, `,
            `Perhatikan konteks permasalahan ${topicClean} ini! `,
            `Melalui pengamatan terhadap ${topicClean}, `,
            `Untuk menguji pemahaman ${topicClean}, `,
            `Dalam rangkaian kegiatan belajar ${topicClean}, `,
            `Berkaitan dengan hal pokok pada ${topicClean}, `
        ],
        4: [
            `Pada pendalaman materi ${topicClean}, `,
            `Berdasarkan konsep ${topicClean} yang telah dipelajari, `,
            `Dalam analisis singkat mengenai ${topicClean}, `,
            `Telitilah pokok bahasan ${topicClean} berikut! `,
            `Dari pembelajaran materi ${topicClean}, `,
            `Berkaitan dengan pemahaman ${topicClean}, `,
            `Saat menelaah contoh kasus ${topicClean}, `,
            `Cermatilah persoalan seputar ${topicClean} di bawah ini: `,
            `Dalam penerapan pelajaran ${topicClean}, `,
            `Untuk memperdalam wawasan ${topicClean}, `,
            `Merujuk pada kaidah ${topicClean} yang tepat, `,
            `Melalui latihan pemecahan masalah ${topicClean}, `
        ],
        5: [
            `Berdasarkan kajian materi ${topicClean}, `,
            `Dalam penerapan konsep ${topicClean} di kehidupan sehari-hari, `,
            `Cermati konteks pembelajaran ${topicClean} berikut: `,
            `Saat mengidentifikasi persoalan ${topicClean}, `,
            `Merujuk pada prinsip dasar ${topicClean}, `,
            `Pada evaluasi pemahaman ${topicClean}, `,
            `Melalui telaah mendalam terhadap ${topicClean}, `,
            `Dalam studi konteks nyata mengenai ${topicClean}, `,
            `Perhatikan hubungan konsep pada ${topicClean} berikut! `,
            `Untuk membuktikan pemahaman tentang ${topicClean}, `,
            `Dari hasil pengamatan topik ${topicClean}, `,
            `Dalam penguasaan materi inti ${topicClean}, `
        ],
        6: [
            `Berdasarkan penguasaan konsep ${topicClean}, `,
            `Dalam pemahaman mendalam mengenai ${topicClean}, `,
            `Tinjauan materi ${topicClean} menunjukkan bahwa `,
            `Cermati uraian topik ${topicClean} di bawah ini! `,
            `Pada penalaran materi ${topicClean}, `,
            `Berkaitan dengan prinsip ${topicClean}, `,
            `Dalam analisis terpadu mengenai ${topicClean}, `,
            `Merujuk pada sintesis konsep ${topicClean}, `,
            `Saat mengevaluasi permasalahan ${topicClean}, `,
            `Perhatikan penjabaran logis tentang ${topicClean}: `,
            `Melalui pendalaman kompetensi ${topicClean}, `,
            `Sebagai bagian dari penguasaan ${topicClean}, `
        ]
    };

    const prefixes = gradeAnchors[grade] || gradeAnchors[4];
    const openIdx = (safePass + grade) % prefixes.length;
    const styleIdx = Math.floor(safePass / prefixes.length) % 4;

    if (styleIdx === 1 || styleIdx === 3) {
        q = q
            .replace(/\bdinamakan\b/g, 'disebut')
            .replace(/\bpeserta didik\b/gi, 'para siswa')
            .replace(/\bberfungsi untuk\b/gi, 'berperan penting untuk')
            .replace(/\bdigunakan untuk\b/gi, 'dimanfaatkan untuk')
            .replace(/\bpaling tepat\b/gi, 'paling sesuai');
        stim = stim
            .replace(/\bpeserta didik\b/gi, 'para siswa')
            .replace(/\bberfungsi untuk\b/gi, 'berperan untuk');
    } else if (styleIdx === 2) {
        q = q
            .replace(/\bdisebut\b/g, 'dikenal sebagai')
            .replace(/\bmerupakan\b/g, 'termasuk')
            .replace(/\bmemiliki\b/g, 'mempunyai')
            .replace(/\bmenggunakan\b/gi, 'memakai')
            .replace(/\bpaling benar\b/gi, 'paling tepat');
        stim = stim
            .replace(/\bmemiliki\b/g, 'mempunyai')
            .replace(/\bmenggunakan\b/gi, 'memakai');
    }

    const tailMarkers = ['', ' (pahami saksama)', ' secara cermat', ' dengan tepat'];
    if (styleIdx >= 2 && q.endsWith('!')) {
        q = `${q.slice(0, -1)}${tailMarkers[styleIdx]}!`;
    } else if (styleIdx >= 2 && q.endsWith('?') && !q.includes('...')) {
        q = `${q.slice(0, -1)}${tailMarkers[styleIdx]}?`;
    } else if (styleIdx === 3 && !stim) {
        stim = `Pelajari kembali pokok bahasan ${topicClean} sebelum menjawab soal berikut.`;
    }

    const prefix = prefixes[openIdx];
    const shouldLower = prefix.endsWith(', ') || prefix.endsWith('bahwa ');
    const adjustedQ = shouldLower ? `${q.charAt(0).toLowerCase()}${q.slice(1)}` : q;

    return {
        question: `${prefix}${adjustedQ}`,
        stimulus: stim
    };
}

// Generate parameterized variant for math when bank is exhausted (strictly grade-appropriate & grade-unique!)
function createDynamicMathVariant(index: number, isFaseA: boolean, grade: number): QuestionBankItemPG {
    const allowedModes = grade <= 2
        ? [0, 5, 10, 11] // Grade 1-2: penjumlahan kecil, pengurangan kecil, pola bilangan loncat, jam tepat
        : grade <= 4
            ? [0, 1, 2, 3, 4, 5, 6] // Grade 3-4: operasi hitung, luas/keliling persegi/persegi panjang, pembagian, waktu
            : [0, 1, 2, 3, 4, 5, 6, 7]; // Grade 5-6: all including Volume Kubus

    const modeOffset = (grade - 1) % allowedModes.length;
    const mode = allowedModes[(index - 1 + modeOffset) % allowedModes.length];
    const cycle = Math.floor((index - 1) / allowedModes.length);
    const roster = GRADE_NAME_ROSTERS_ID[grade] || GRADE_NAME_ROSTERS_ID[4];
    const n1 = roster[(cycle + grade) % roster.length];
    const n2 = roster[(cycle + grade + 1) % roster.length];
    const gradeFactor = grade * 3 + index;

    if (mode === 0) {
        const items = ['kelereng', 'stiker bintang', 'kartu bergambar', 'biji congklak', 'kancing hias', 'pensil warna'];
        const itemObj = items[(cycle + grade) % items.length];
        const num1 = grade <= 2 ? (7 + ((gradeFactor * 3 + grade * 5) % 32)) : (15 + grade * 11 + index * 7);
        const num2 = grade <= 2 ? (5 + ((gradeFactor * 2 + grade * 4) % 28)) : (19 + grade * 9 + index * 5);
        const sum = num1 + num2;
        const qPhrasings = [
            `Berapakah total keseluruhan ${itemObj} milik ${n1} (${num1} buah) dan ${n2} (${num2} buah) setelah digabungkan?`,
            `Jika ${num1} ${itemObj} kepunyaan ${n1} ditambahkan dengan ${num2} ${itemObj} milik ${n2}, jumlah semuanya adalah ...`,
            `Hitunglah banyaknya ${itemObj} dalam kotak gabungan milik ${n1} dan ${n2} tersebut!`
        ];
        return {
            stimulus: `${n1} mengumpulkan ${num1} buah ${itemObj} dan ${n2} membawa ${num2} buah ${itemObj}. Semua ${itemObj} itu disatukan ke dalam wadah kelas.`,
            question: qPhrasings[(grade + cycle) % qPhrasings.length],
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
        const containers = ['kotak pensil', 'kantong jeruk', 'rak buku', 'bungkus permen', 'dus roti', 'keranjang bola'];
        const contents = ['batang pensil warna', 'buah jeruk manis', 'eksemplar buku cerita', 'butir permen rasa buah', 'potong roti cokelat', 'buah bola kecil'];
        const units = ['batang', 'buah', 'eksemplar', 'butir', 'potong', 'buah'];
        const pick = (cycle + grade) % containers.length;
        const factor1 = grade <= 3 ? (3 + ((index + grade) % 7)) : (4 + grade + index);
        const perBox = 4 + ((cycle + grade) % 6);
        const prod = factor1 * perBox;
        return {
            stimulus: `Di koperasi sekolah tersedia ${factor1} ${containers[pick]}. Setiap wadah berisi tepat ${perBox} ${contents[pick]}.`,
            question: `Apabila seluruh isi ${factor1} ${containers[pick]} (@${perBox} ${units[pick]}) dihitung bersama, jumlah ${contents[pick]} seluruhnya adalah ...`,
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
        const objects = ['ubin keramik', 'kertas origami', 'papan catur mini', 'bingkai foto', 'saputangan kain', 'taplak meja mini'];
        const sqObj = objects[(cycle + grade) % objects.length];
        const side = 4 + grade + index * 2;
        const area = side * side;
        return {
            stimulus: `${n1} mengukur sebuah ${sqObj} berbentuk persegi yang panjang tiap sisinya ${side} cm.`,
            question: `Berapa cm² luas permukaan ${sqObj} milik ${n1} yang panjang sisinya ${side} cm tersebut?`,
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
        const places = ['taman bunga', 'lapangan voli', 'kebun sekolah', 'kolam ikan', 'halaman kelas', 'taman baca'];
        const rectObj = places[(cycle + grade) % places.length];
        const p = 9 + grade * 2 + index * 2;
        const l = 4 + grade + cycle;
        const kel = 2 * (p + l);
        return {
            stimulus: `Sekolah memiliki ${rectObj} berbentuk persegi panjang berukuran panjang ${p} meter dan lebar ${l} meter.`,
            question: `Keliling ${rectObj} berukuran ${p} m x ${l} m tersebut apabila diukur mengitari seluruh tepinya adalah ...`,
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
        const fruits = ['buah mangga', 'buah apel', 'kue bolu', 'buku tulis', 'buah jeruk', 'pensil gambar'];
        const obj = fruits[(cycle + grade) % fruits.length];
        const divisor = 3 + ((cycle + grade) % 5);
        const perChild = 5 + grade + index;
        const total = divisor * perChild;
        return {
            stimulus: `${n1} menyiapkan ${total} ${obj} untuk dibagikan sama rata kepada ${divisor} orang temannya saat kerja kelompok.`,
            question: `Jika ${total} ${obj} dibagikan merata kepada ${divisor} anak, bagian yang diterima setiap anak adalah ...`,
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
        const startVal = grade <= 2 ? (32 + ((gradeFactor * 4 + grade * 7) % 45)) : (78 + grade * 12 + index * 9);
        const usedVal = grade <= 2 ? (11 + ((gradeFactor * 3 + grade * 3) % 20)) : (24 + grade * 4 + cycle * 6);
        const rem = startVal - usedVal;
        return {
            stimulus: `${n2} menyimpan persediaan ${startVal} lembar kertas warna. Sebanyak ${usedVal} lembar dipakai untuk membuat prakarya.`,
            question: `Berapa lembar sisa kertas warna milik ${n2} setelah ${usedVal} lembar dari ${startVal} lembar digunakan?`,
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
        const hours = 1 + ((cycle + grade) % 5);
        const extraMins = 5 + ((gradeFactor * 5) % 50);
        const totalMins = hours * 60 + extraMins;
        return {
            stimulus: `${n1} mengikuti kegiatan membaca dan berhitung selama ${hours} jam ${extraMins} menit.`,
            question: `Bila diubah ke satuan menit, lama waktu belajar ${n1} selama ${hours} jam ${extraMins} menit setara dengan ...`,
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
    } else if (mode === 10) {
        // Grade 1-2: pola bilangan loncat sederhana
        const step = 2 + ((cycle + grade) % 4);
        const start = 2 + ((index + grade * 3) % 9);
        const missing = start + step * 2;
        return {
            stimulus: `${n1} menyusun kartu bilangan secara teratur: ${start}, ${start + step}, [ ... ], ${start + step * 3}.`,
            question: `Bilangan yang tepat untuk mengisi kotak kosong pada pola ${start}, ${start + step}, [...], ${start + step * 3} milik ${n1} adalah ...`,
            optionsFaseA: [
                { key: 'A', text: `${missing - 1}` },
                { key: 'B', text: `${missing}` },
                { key: 'C', text: `${missing + 2}` }
            ],
            optionsFaseBC: [
                { key: 'A', text: `${missing - 1}` },
                { key: 'B', text: `${missing}` },
                { key: 'C', text: `${missing + 1}` },
                { key: 'D', text: `${missing + 2}` }
            ],
            correctAnswer: 'B',
            explanation: `Pola bertambah ${step} setiap langkah, sehingga setelah ${start + step} adalah ${missing}.`,
            cognitiveLevel: 'MOTS',
            topic: 'Pola Bilangan Sederhana'
        };
    } else if (mode === 11) {
        // Grade 1-2: membaca dan menghitung durasi jam tepat
        const startHr = 6 + ((index + grade) % 5);
        const dur = 1 + ((cycle + grade) % 3);
        const endHr = startHr + dur;
        return {
            stimulus: `${n2} mulai belajar menggambar di kelas pada pukul ${String(startHr).padStart(2, '0')}.00 selama ${dur} jam.`,
            question: `Pukul berapa ${n2} selesai menggambar apabila berlangsung selama ${dur} jam sejak pukul ${String(startHr).padStart(2, '0')}.00?`,
            optionsFaseA: [
                { key: 'A', text: `Pukul ${String(endHr - 1).padStart(2, '0')}.00` },
                { key: 'B', text: `Pukul ${String(endHr).padStart(2, '0')}.00` },
                { key: 'C', text: `Pukul ${String(endHr + 2).padStart(2, '0')}.00` }
            ],
            optionsFaseBC: [
                { key: 'A', text: `Pukul ${String(endHr - 1).padStart(2, '0')}.00` },
                { key: 'B', text: `Pukul ${String(endHr).padStart(2, '0')}.00` },
                { key: 'C', text: `Pukul ${String(endHr + 1).padStart(2, '0')}.00` },
                { key: 'D', text: `Pukul ${String(endHr + 2).padStart(2, '0')}.00` }
            ],
            correctAnswer: 'B',
            explanation: `${startHr}.00 ditambah ${dur} jam menjadi pukul ${String(endHr).padStart(2, '0')}.00.`,
            cognitiveLevel: 'LOTS',
            topic: 'Pengukuran Waktu Jam Tepat'
        };
    } else {
        const cubes = ['kotak mainan', 'akuarium mini', 'kardus kado', 'bak air kubus', 'wadah pensil kubus', 'kotak kayu'];
        const cubeObj = cubes[(cycle + grade) % cubes.length];
        const edge = 3 + (grade % 3) + ((index + cycle) % 8);
        const vol = edge * edge * edge;
        return {
            stimulus: `Sebuah ${cubeObj} berbentuk kubus memiliki panjang rusuk tepat ${edge} cm.`,
            question: `Berapa cm³ volume ${cubeObj} berbentuk kubus dengan panjang rusuk ${edge} cm tersebut?`,
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
function createDynamicIndoVariant(index: number, isFaseA: boolean, grade: number = 4): QuestionBankItemPG {
    const variants: (QuestionBankItemPG & GradeScopedItem)[] = [
        {
            minGrade: 1,
            maxGrade: 2,
            stimulus: 'Perhatikan kalimat berikut: "Terima kasih, Ibu, sudah menyiapkan sarapan pagi."',
            question: 'Kalimat di atas merupakan contoh ungkapan ...',
            optionsFaseA: [
                { key: 'A', text: 'Terima kasih' },
                { key: 'B', text: 'Permintaan maaf' },
                { key: 'C', text: 'Larangan' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Terima kasih' },
                { key: 'B', text: 'Permintaan maaf' },
                { key: 'C', text: 'Larangan' },
                { key: 'D', text: 'Perintah' }
            ],
            correctAnswer: 'A',
            explanation: 'Kata "Terima kasih" digunakan untuk mengucapkan rasa syukur atau penghargaan atas bantuan orang lain.',
            cognitiveLevel: 'LOTS',
            topic: 'Ungkapan Santun'
        },
        {
            minGrade: 1,
            maxGrade: 2,
            stimulus: 'Bacalah kalimat berikut: "Siti rajin menyiram bunga di taman setiap pagi [ ... ]"',
            question: 'Tanda baca yang tepat untuk mengakhiri kalimat berita di atas adalah ...',
            optionsFaseA: [
                { key: 'A', text: 'Tanda titik (.)' },
                { key: 'B', text: 'Tanda tanya (?)' },
                { key: 'C', text: 'Tanda seru (!)' }
            ],
            optionsFaseBC: [
                { key: 'A', text: 'Tanda titik (.)' },
                { key: 'B', text: 'Tanda tanya (?)' },
                { key: 'C', text: 'Tanda seru (!)' },
                { key: 'D', text: 'Tanda koma (,)' }
            ],
            correctAnswer: 'A',
            explanation: 'Kalimat berita atau pernyataan diakhiri dengan tanda titik (.).',
            cognitiveLevel: 'LOTS',
            topic: 'Tanda Baca Dasar'
        },
        {
            minGrade: 1,
            maxGrade: 2,
            stimulus: 'Perhatikan kata benda berikut: "bu - ku".',
            question: 'Jumlah suku kata pada kata "buku" adalah ...',
            optionsFaseA: [
                { key: 'A', text: '1 suku kata' },
                { key: 'B', text: '2 suku kata' },
                { key: 'C', text: '3 suku kata' }
            ],
            optionsFaseBC: [
                { key: 'A', text: '1 suku kata' },
                { key: 'B', text: '2 suku kata' },
                { key: 'C', text: '3 suku kata' },
                { key: 'D', text: '4 suku kata' }
            ],
            correctAnswer: 'B',
            explanation: 'Kata "buku" dipenggal menjadi "bu-ku", sehingga terdiri atas 2 suku kata.',
            cognitiveLevel: 'LOTS',
            topic: 'Suku Kata'
        },
        {
            minGrade: 3,
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
            minGrade: 3,
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
            stimulus: 'Perhatikan kalimat rumpang berikut: "[ ... ] yang menjadi ketua kelompok dalam kegiatan pentas seni sekolah?"',
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
            minGrade: 3,
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
            minGrade: 2,
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
            minGrade: 3,
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
            minGrade: 3,
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
            minGrade: 4,
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

    const filteredVariants = filterAndPrioritizeByGrade(variants, grade);
    const activeVariants = filteredVariants.length > 0 ? filteredVariants : variants;
    const pickIdx = (index - 1) % activeVariants.length;
    const cycle = Math.floor((index - 1) / activeVariants.length);
    const base = activeVariants[pickIdx];
    const rephrased = rephraseQuestionNatural(base.question, base.stimulus, base.topic, grade, cycle, false);
    return {
        ...base,
        stimulus: rephrased.stimulus,
        question: rephrased.question
    };
}

// Subject-aware dynamic PG variant generator when a subject's base bank is exhausted
function createDynamicSubjectPgVariant(subject: string, index: number, isFaseA: boolean, grade: number): QuestionBankItemPG {
    const cat = detectSubjectCategory(subject);
    if (cat === 'math') {
        return createDynamicMathVariant(index, isFaseA, grade);
    }
    if (cat === 'indo') {
        return createDynamicIndoVariant(index, isFaseA, grade);
    }

    const rawBank = getPgBankForSubject(subject);
    const filtered = filterAndPrioritizeByGrade(rawBank, grade);
    const bank = filtered.length > 0 ? filtered : rawBank;
    const pickIdx = (index - 1) % bank.length;
    const cycle = Math.floor((index - 1) / bank.length);
    const base = bank[pickIdx];

    const rephrased = rephraseQuestionNatural(
        base.question,
        base.stimulus,
        base.topic,
        grade,
        cycle,
        cat === 'inggris'
    );
    return {
        ...base,
        stimulus: rephrased.stimulus,
        question: rephrased.question
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
    const grade = parseGradeFromClassName(className, isFaseA);
    const rawBank = getPgBankForSubject(subject);
    const gradeBank = filterAndPrioritizeByGrade(rawBank, grade);
    const bank = gradeBank.length > 0 ? gradeBank : rawBank;
    const seen = existingFingerprints || new Set<string>();
    const result: QuestionPG[] = [];

    let bankIndex = 0;
    let variantIndex = 1;

    while (result.length < count && (bankIndex < bank.length || variantIndex < 500)) {
        let item: QuestionBankItemPG;

        if (bankIndex < bank.length) {
            item = bank[bankIndex];
            bankIndex++;
        } else {
            // Generate distinct subject-matched and grade-matched variant
            item = createDynamicSubjectPgVariant(subject, variantIndex++, isFaseA, grade);
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
            indikator: `Disajikan stimulus terkait ${item.topic}, peserta didik ${className} dapat menjawab pertanyaan dengan tepat.`,
            materi: item.topic || tpItem.element || subject,
            visualType: visual,
            visualTitle: item.visualTitle || '',
            visualSvg: visual !== 'none' && renderVisualSvgFn ? renderVisualSvgFn(visual, item.visualTitle) : undefined
        });
    }

    return result;
}

function createDynamicIsianVariant(subject: string, index: number, grade: number): QuestionBankItemIsian {
    const s = subject.toLowerCase();
    const gFactor = grade * 5 + index;
    if (s.includes('matematika') || s.includes('hitung') || s.includes('angka')) {
        if (grade <= 2) {
            const mode = (index - 1 + grade) % 4;
            if (mode === 0) {
                const a = 7 + ((gFactor * 3 + grade * 4) % 35);
                const b = 5 + ((gFactor * 2 + grade * 3) % 25);
                return {
                    question: `Jumlah dari bilangan ${a} ditambah ${b} adalah ...`,
                    correctAnswer: `${a + b}`,
                    cognitiveLevel: 'LOTS',
                    topic: 'Operasi Penjumlahan'
                };
            } else if (mode === 1) {
                const a = 32 + ((gFactor * 4 + grade * 5) % 40);
                const b = 6 + ((gFactor * 3 + grade * 2) % 20);
                return {
                    question: `Selisih dari pengurangan ${a} dikurangi ${b} adalah ...`,
                    correctAnswer: `${a - b}`,
                    cognitiveLevel: 'LOTS',
                    topic: 'Operasi Pengurangan'
                };
            } else if (mode === 2) {
                const startH = 6 + (grade % 3);
                const jam = 2 + ((index + grade) % 5);
                return {
                    question: `Waktu ${jam} jam sesudah pukul ${String(startH).padStart(2, '0')}.00 adalah pukul ...`,
                    correctAnswer: `${String(startH + jam).padStart(2, '0')}.00`,
                    cognitiveLevel: 'LOTS',
                    topic: 'Satuan Waktu'
                };
            } else {
                const puluhan = 2 + ((index + grade) % 7);
                const satuan = 1 + ((gFactor * 3) % 8);
                return {
                    question: `Lambang bilangan yang tersusun atas ${puluhan} puluhan dan ${satuan} satuan yaitu ...`,
                    correctAnswer: `${puluhan * 10 + satuan}`,
                    cognitiveLevel: 'LOTS',
                    topic: 'Nilai Tempat'
                };
            }
        }

        const mode = (index - 1 + grade) % 5;
        if (mode === 0) {
            const numA = 5 + grade * 4 + index * 3;
            const numB = 3 + ((index + grade) % 6);
            return {
                question: `Hasil perkalian antara ${numA} dengan ${numB} adalah ...`,
                correctAnswer: `${numA * numB}`,
                cognitiveLevel: 'LOTS',
                topic: 'Operasi Perkalian'
            };
        } else if (mode === 1) {
            const side = 5 + grade * 2 + index;
            return {
                question: `Diketahui sebuah bangun persegi mempunyai panjang sisi ${side} cm. Luas persegi itu adalah ... cm².`,
                correctAnswer: `${side * side}`,
                cognitiveLevel: 'MOTS',
                topic: 'Luas Persegi'
            };
        } else if (mode === 2) {
            const kg = 2 + grade + index;
            return {
                question: `Massa satu karung beras adalah ${kg} kilogram. Apabila diubah menjadi gram, beratnya setara dengan ... gram.`,
                correctAnswer: `${kg * 1000}`,
                cognitiveLevel: 'LOTS',
                topic: 'Satuan Berat'
            };
        } else if (mode === 3) {
            const jam = 2 + ((index + grade) % 6) + Math.floor(index / 6);
            return {
                question: `Durasi belajar selama ${jam} jam sama lamanya dengan ... menit.`,
                correctAnswer: `${jam * 60}`,
                cognitiveLevel: 'LOTS',
                topic: 'Satuan Waktu'
            };
        } else {
            const div = 3 + ((index + grade) % 5);
            const ans = 7 + grade + index;
            return {
                question: `Hasil operasi pembagian ${div * ans} dibagi ${div} adalah ...`,
                correctAnswer: `${ans}`,
                cognitiveLevel: 'LOTS',
                topic: 'Operasi Pembagian'
            };
        }
    }

    const cat = detectSubjectCategory(subject);
    const extraIsianMap: Record<string, QuestionBankItemIsian[]> = {
        indo: [
            { minGrade: 3, maxGrade: 6, question: 'Kalimat yang hanya memiliki satu pola inti subjek dan predikat serta mudah dipahami disebut kalimat ...', correctAnswer: 'Efektif (Tunggal)', cognitiveLevel: 'LOTS', topic: 'Tata Kalimat' },
            { question: 'Huruf pertama pada awal kalimat dan nama tempat geografis wajib ditulis menggunakan huruf ...', correctAnswer: 'Kapital (Besar)', cognitiveLevel: 'LOTS', topic: 'Ejaan' },
            { minGrade: 2, maxGrade: 6, question: 'Karangan singkat yang berisi cerita hewan berperilaku layaknya manusia disebut ...', correctAnswer: 'Fabel', cognitiveLevel: 'LOTS', topic: 'Teks Fiksi' },
            { minGrade: 3, maxGrade: 6, question: 'Daftar kata sulit beserta artinya yang tersusun urut abjad di bagian akhir buku disebut ...', correctAnswer: 'Glosarium (Kamus mini)', cognitiveLevel: 'MOTS', topic: 'Literasi Buku' },
            { minGrade: 4, maxGrade: 6, question: 'Teks yang berisi ajakan atau bujukan halus kepada pembaca agar mau mengikuti sesuatu disebut teks ...', correctAnswer: 'Persuasi', cognitiveLevel: 'MOTS', topic: 'Jenis Teks' },
            { minGrade: 3, maxGrade: 6, question: 'Awalan "me-" apabila bertemu dengan kata dasar "sapu" akan luluh menjadi kata ...', correctAnswer: 'Menyapu', cognitiveLevel: 'MOTS', topic: 'Imbuhan' }
        ],
        ipas: [
            { question: 'Sumber energi panas dan cahaya terbesar yang menyinari planet bumi adalah ...', correctAnswer: 'Matahari', cognitiveLevel: 'LOTS', topic: 'Energi' },
            { minGrade: 3, maxGrade: 6, question: 'Perubahan wujud benda dari padat langsung menjadi gas seperti pada kapur barus disebut ...', correctAnswer: 'Menyublim', cognitiveLevel: 'LOTS', topic: 'Wujud Zat' },
            { question: 'Alat indra pada manusia yang berfungsi untuk mendengar getaran suara adalah ...', correctAnswer: 'Telinga', cognitiveLevel: 'LOTS', topic: 'Panca Indra' },
            { minGrade: 3, maxGrade: 6, question: 'Bagian bunga yang berfungsi sebagai alat perkembangbiakan jantan karena menghasilkan serbuk sari adalah ...', correctAnswer: 'Benang sari', cognitiveLevel: 'MOTS', topic: 'Perkembangbiakan Tumbuhan' },
            { minGrade: 4, maxGrade: 6, question: 'Hubungan saling menguntungkan antara dua makhluk hidup yang berbeda jenis disebut simbiosis ...', correctAnswer: 'Mutualisme', cognitiveLevel: 'LOTS', topic: 'Ekosistem' },
            { minGrade: 5, maxGrade: 6, question: 'Benda langit yang menjadi satelit alami planet bumi dan tampak bersinar di malam hari adalah ...', correctAnswer: 'Bulan', cognitiveLevel: 'LOTS', topic: 'Tata Surya' }
        ],
        pancasila: [
            { question: 'Lagu kebangsaan negara Republik Indonesia yang diciptakan oleh W.R. Supratman berjudul ...', correctAnswer: 'Indonesia Raya', cognitiveLevel: 'LOTS', topic: 'Identitas Nasional' },
            { question: 'Warna bendera negara Republik Indonesia adalah merah yang berarti berani dan putih yang berarti ...', correctAnswer: 'Suci', cognitiveLevel: 'LOTS', topic: 'Simbol Negara' },
            { minGrade: 3, maxGrade: 6, question: 'Aturan tertulis atau tidak tertulis yang berlaku dan disepakati bersama dalam masyarakat disebut ...', correctAnswer: 'Norma', cognitiveLevel: 'LOTS', topic: 'Norma' },
            { question: 'Menjaga kebersihan halaman sekolah bersama teman-teman tanpa membeda-bedakan suku merupakan wujud sila ke-...', correctAnswer: 'Tiga (Persatuan Indonesia)', cognitiveLevel: 'MOTS', topic: 'Pancasila' },
            { minGrade: 3, maxGrade: 6, question: 'Pemilihan ketua kelas secara adil dengan mengambil suara terbanyak disebut ...', correctAnswer: 'Voting (Pemungutan suara)', cognitiveLevel: 'MOTS', topic: 'Demokrasi' },
            { question: 'Sikap bersikap adil dan tidak pilih kasih kepada semua teman merupakan cerminan sila ke-...', correctAnswer: 'Lima (Keadilan sosial)', cognitiveLevel: 'MOTS', topic: 'Pancasila' }
        ],
        pjok: [
            { question: 'Gerakan pelemasan otot dan pengaturan napas setelah berolahraga selesai disebut ...', correctAnswer: 'Pendinginan (Cooling down)', cognitiveLevel: 'LOTS', topic: 'Pendinginan' },
            { minGrade: 3, maxGrade: 6, question: 'Teknik menerima bola rendah menggunakan kedua lengan lurus yang dirapatkan dalam bola voli disebut passing ...', correctAnswer: 'Bawah', cognitiveLevel: 'MOTS', topic: 'Bola Voli' },
            { minGrade: 3, maxGrade: 6, question: 'Posisi kedua kaki ditekuk melebar untuk menjaga keseimbangan saat berlatih pencak silat disebut sikap ...', correctAnswer: 'Kuda-kuda', cognitiveLevel: 'LOTS', topic: 'Pencak Silat' },
            { minGrade: 3, maxGrade: 6, question: 'Latihan kebugaran jasmani naik-turun bertumpu pada telapak tangan dan ujung kaki untuk melatih otot lengan adalah ...', correctAnswer: 'Push-up', cognitiveLevel: 'LOTS', topic: 'Kebugaran Jasmani' },
            { minGrade: 4, maxGrade: 6, question: 'Zat berbahaya di dalam asap rokok yang merusak organ paru-paru dan menimbulkan kecanduan disebut ...', correctAnswer: 'Nikotin dan tar', cognitiveLevel: 'MOTS', topic: 'Kesehatan' },
            { minGrade: 3, maxGrade: 6, question: 'Saat melakukan guling depan di atas matras, dagu ditempelkan ke dada agar yang mendarat pertama kali adalah bagian ...', correctAnswer: 'Tengkuk / Punggung atas', cognitiveLevel: 'MOTS', topic: 'Senam Lantai' }
        ],
        seni: [
            { question: 'Unsur seni rupa terkecil yang menjadi awal terbentuknya garis adalah ...', correctAnswer: 'Titik', cognitiveLevel: 'LOTS', topic: 'Unsur Seni Rupa' },
            { minGrade: 3, maxGrade: 6, question: 'Tangga nada diatonis yang memiliki kesan ceria, gembira, dan bersemangat adalah tangga nada ...', correctAnswer: 'Mayor', cognitiveLevel: 'LOTS', topic: 'Tangga Nada' },
            { minGrade: 3, maxGrade: 6, question: 'Tiga unsur keindahan tari Nusantara yaitu Wiraga, Wirama, dan ...', correctAnswer: 'Wirasa', cognitiveLevel: 'MOTS', topic: 'Seni Tari' },
            { minGrade: 3, maxGrade: 6, question: 'Kejelasan pengucapan huruf vokal dan konsonan dalam seni peran teater atau bernyanyi disebut ...', correctAnswer: 'Artikulasi', cognitiveLevel: 'MOTS', topic: 'Seni Teater' },
            { minGrade: 3, maxGrade: 6, question: 'Prinsip susunan gambar kiri dan kanan yang tampak serasi dan tidak berat sebelah disebut ...', correctAnswer: 'Keseimbangan (Balance)', cognitiveLevel: 'MOTS', topic: 'Prinsip Seni Rupa' }
        ],
        inggris: [
            { question: 'When someone helps you pick up a fallen book, the polite expression to say is "Thank ...".', correctAnswer: 'You', cognitiveLevel: 'LOTS', topic: 'Polite Expressions' },
            { question: 'A wild tall animal with a very long neck that eats leaves on tall trees is called a ...', correctAnswer: 'Giraffe', cognitiveLevel: 'LOTS', topic: 'Animals' },
            { question: 'Before sleeping at night, we say "Good ..." to our parents.', correctAnswer: 'Night', cognitiveLevel: 'LOTS', topic: 'Greetings' },
            { question: 'The English word for "guru" who teaches students in the classroom is ...', correctAnswer: 'Teacher', cognitiveLevel: 'LOTS', topic: 'School Professions' },
            { question: 'The day right before Monday in English is ...', correctAnswer: 'Sunday', cognitiveLevel: 'LOTS', topic: 'Days' }
        ],
        pai: [
            { question: 'Salat wajib lima waktu yang dilaksanakan pada siang hari sebanyak 4 rakaat adalah salat ...', correctAnswer: 'Zuhur', cognitiveLevel: 'LOTS', topic: 'Salat Wajib' },
            { question: 'Sifat terpuji selalu berkata sesuai kenyataan dan tidak berbohong disebut ...', correctAnswer: 'Jujur (Siddiq)', cognitiveLevel: 'LOTS', topic: 'Akhlak Terpuji' },
            { question: 'Jumlah Rukun Iman yang wajib diyakini oleh setiap muslim adalah ... perkara.', correctAnswer: '6 (Enam)', cognitiveLevel: 'LOTS', topic: 'Rukun Iman' },
            { question: 'Jumlah Rukun Islam yang menjadi tiang ajaran agama Islam adalah ... perkara.', correctAnswer: '5 (Lima)', cognitiveLevel: 'LOTS', topic: 'Rukun Islam' },
            { minGrade: 3, maxGrade: 6, question: 'Apabila tidak ditemukan air untuk berwudu atau sedang sakit keras, bersuci boleh diganti menggunakan debu suci yang disebut ...', correctAnswer: 'Tayamum', cognitiveLevel: 'MOTS', topic: 'Taharah' }
        ],
        koding: [
            { question: 'Kesalahan logika atau penulisan instruksi pada kode program komputer sering disebut ...', correctAnswer: 'Bug', cognitiveLevel: 'LOTS', topic: 'Debugging' },
            { question: 'Kemampuan komputer meniru pola belajar manusia dari sekumpulan data disebut Kecerdasan ...', correctAnswer: 'Artifisial (Buatan)', cognitiveLevel: 'LOTS', topic: 'Kecerdasan Artifisial' },
            { minGrade: 3, maxGrade: 6, question: 'Pengenalan kesamaan ciri antar persoalan untuk mempermudah penyelesaian masalah disebut pengenalan ...', correctAnswer: 'Pola', cognitiveLevel: 'MOTS', topic: 'Berpikir Komputasional' },
            { minGrade: 3, maxGrade: 6, question: 'Proses menyaring informasi penting dan mengabaikan detail yang tidak perlu dalam berpikir komputasional disebut ...', correctAnswer: 'Abstraksi', cognitiveLevel: 'MOTS', topic: 'Berpikir Komputasional' }
        ],
        mulok: [
            { question: 'Sikap hormat, berbicara halus, dan menjaga adab kepada orang yang lebih tua disebut ...', correctAnswer: 'Tata krama (Unggah-ungguh)', cognitiveLevel: 'LOTS', topic: 'Tata Krama' },
            { question: 'Permainan tradisional melempar batu atau bola lalu melompati petak garis di lantai dengan satu kaki adalah ...', correctAnswer: 'Engklek', cognitiveLevel: 'LOTS', topic: 'Permainan Tradisional' },
            { question: 'Pementasan tarian, nyanyian, dan alat musik khas provinsi tertentu merupakan wujud kekayaan ... daerah.', correctAnswer: 'Kesenian / Budaya', cognitiveLevel: 'LOTS', topic: 'Budaya Daerah' },
            { question: 'Menjaga kelestarian cerita rakyat dan permainan tradisional bertujuan agar warisan budaya tidak ...', correctAnswer: 'Punah / Hilang', cognitiveLevel: 'LOTS', topic: 'Pelestarian Budaya' }
        ]
    };

    const combinedPool = filterAndPrioritizeByGrade(
        [...(extraIsianMap[cat] || []), ...getIsianBankForSubject(subject)],
        grade
    );
    const activePool = combinedPool.length > 0 ? combinedPool : (extraIsianMap[cat] || getIsianBankForSubject(subject));
    const picked = activePool[(index - 1) % activePool.length];
    const cycle = Math.floor((index - 1) / activePool.length);

    const rephrased = rephraseQuestionNatural(
        picked.question,
        picked.stimulus,
        picked.topic,
        grade,
        cycle,
        cat === 'inggris'
    );
    return {
        ...picked,
        stimulus: rephrased.stimulus,
        question: rephrased.question
    };
}

export function generateAuthenticIsianQuestions(
    subject: string,
    className: string,
    targetTps: any[],
    count: number,
    existingFingerprints?: Set<string>
): QuestionIsian[] {
    const grade = parseGradeFromClassName(className);
    const rawBank = getIsianBankForSubject(subject);
    const gradeBank = filterAndPrioritizeByGrade(rawBank, grade);
    const bank = gradeBank.length > 0 ? gradeBank : rawBank;
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
            indikator: `Peserta didik ${className} mampu melengkapi isian terkait ${item.topic}.`,
            materi: item.topic || tpItem.element || subject
        });
    }

    // Dynamic generation if count exceeds base bank
    let dynIndex = 1;
    while (result.length < count && dynIndex < 350) {
        const dynItem = createDynamicIsianVariant(subject, dynIndex++, grade);
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
            indikator: `Peserta didik ${className} mampu melengkapi isian terkait ${dynItem.topic}.`,
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
    const grade = parseGradeFromClassName(className);
    const rawBank = getUraianBankForSubject(subject);
    const gradeBank = filterAndPrioritizeByGrade(rawBank, grade);
    const bank = gradeBank.length > 0 ? gradeBank : rawBank;
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
            indikator: `Peserta didik ${className} mampu menguraikan solusi mendalam terkait ${item.topic}.`,
            materi: item.topic || tpItem.element || subject,
            rubric: item.rubric
        });
    }

    // Dynamic generation if count exceeds base uraian bank
    let dynIdx = 1;
    while (result.length < count && dynIdx < 250) {
        const dynItem = createDynamicUraianVariant(subject, dynIdx++, grade);
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
            indikator: `Peserta didik ${className} mampu menguraikan solusi mendalam terkait ${dynItem.topic}.`,
            materi: dynItem.topic || tpItem.element || subject,
            rubric: dynItem.rubric
        });
    }

    return result;
}

function createDynamicUraianVariant(subject: string, index: number, grade: number): QuestionBankItemUraian {
    const s = subject.toLowerCase();
    const roster = GRADE_NAME_ROSTERS_ID[grade] || GRADE_NAME_ROSTERS_ID[4];
    const name = roster[(index + grade) % roster.length];

    if (s.includes('matematika') || s.includes('hitung') || s.includes('angka')) {
        if (grade <= 2) {
            const mode = (index - 1 + grade) % 2;
            const cycle = Math.floor((index - 1) / 2);
            if (mode === 0) {
                const awal = 15 + grade * 4 + (index * 3);
                const beli = 10 + grade * 2 + (cycle * 2);
                const bagi = 5 + grade + (index % 5);
                const sisa = awal + beli - bagi;
                return {
                    stimulus: `${name} mengumpulkan ${awal} buah pensil warna. Ibu membelikan lagi ${beli} pensil. Kemudian ${bagi} pensil diberikan kepada temannya.`,
                    question: `Berapa banyak pensil warna milik ${name} sekarang dari ${awal} buah ditambah ${beli} lalu diberikan ${bagi} buah? Tuliskan cara menghitungnya!`,
                    correctAnswer: `Total awal = ${awal} + ${beli} = ${awal + beli} pensil. Sisa = ${awal + beli} - ${bagi} = ${sisa} pensil.`,
                    cognitiveLevel: 'MOTS',
                    topic: 'Penjumlahan dan Pengurangan',
                    rubric: {
                        score3: 'Menuliskan langkah penjumlahan dan pengurangan dengan tepat beserta hasilnya.',
                        score2: 'Langkah benar tetapi hasil hitung akhir kurang tepat.',
                        score1: 'Hanya menuliskan satu operasi hitung.',
                        score0: 'Tidak menjawab.'
                    }
                };
            } else {
                const startHr = 6 + ((index + grade) % 4);
                const dur = 1 + ((cycle + grade) % 2);
                return {
                    stimulus: `Kegiatan belajar kelompok ${name} dimulai pukul ${String(startHr).padStart(2, '0')}.00 pagi dan berlangsung selama ${dur} jam.`,
                    question: `Pukul berapa kegiatan belajar ${name} selesai jika dimulai pukul ${String(startHr).padStart(2, '0')}.00 selama ${dur} jam? Jelaskan langkah menghitungnya!`,
                    correctAnswer: `Waktu selesai = ${startHr}.00 + ${dur} jam = pukul ${String(startHr + dur).padStart(2, '0')}.00.`,
                    cognitiveLevel: 'LOTS',
                    topic: 'Pengukuran Waktu Sederhana',
                    rubric: {
                        score3: 'Menjawab waktu selesai dan langkah penjumlahan jam dengan benar.',
                        score2: 'Menjawab pukul selesai benar tanpa penjelasan.',
                        score1: 'Penjelasan masih keliru.',
                        score0: 'Kosong.'
                    }
                };
            }
        }

        const maxModes = grade <= 4 ? 2 : 4; // Grade 3-4: NO cube volume/surface area or KPK; use perimeter/area & mixed ops
        const mode = (index - 1 + grade) % maxModes;
        const cycle = Math.floor((index - 1) / maxModes);
        if (mode === 0) {
            const places = ['lapangan futsal sekolah', 'kolam renang desa', 'taman bacaan terbuka', 'aula pertemuan', 'halaman upacara', 'kebun apotek hidup'];
            const place = places[(cycle + grade) % places.length];
            const p = 12 + grade * 3 + index * 3;
            const l = 6 + grade + index;
            return {
                stimulus: `${name} mengukur sebuah ${place} berbentuk persegi panjang yang panjangnya ${p} meter dan lebarnya ${l} meter.`,
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
            const boxes = 5 + grade + index;
            const perBox = 10 + grade * 2 + (cycle * 3);
            const sold = 15 + grade * 2 + (index * 2);
            const total = boxes * perBox;
            const rem = total - sold;
            return {
                stimulus: `Koperasi sekolah menyimpan ${boxes} kardus buku tulis. Setiap kardus berisi ${perBox} buku. Pada minggu pertama terjual ${sold} buku.`,
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
            const edge = 5 + grade + index;
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
            const a = 3 + (grade % 2) + index;
            const b = 5 + (grade % 3) + index;
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

    const cat = detectSubjectCategory(subject);

    const extraTopicsByCat: Record<string, (GradeScopedItem & { topic: string; q: string; ans: string })[]> = {
        indo: [
            {
                minGrade: 3, maxGrade: 6,
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
                minGrade: 3, maxGrade: 6,
                topic: 'Ringkasan Paragraf',
                q: 'Jelaskan 3 langkah mudah untuk menemukan ide pokok dan membuat ringkasan yang baik dari sebuah teks bacaan panjang!',
                ans: '1. Membaca seluruh teks dengan saksama. 2. Menandai kalimat utama pada tiap paragraf. 3. Merangkai kembali inti gagasan utama tersebut menggunakan kalimat sendiri secara padu.'
            },
            {
                minGrade: 4, maxGrade: 6,
                topic: 'Majas dalam Puisi Anak',
                q: 'Apa perbedaan antara majas personifikasi dan majas hiperbola? Berikan masing-masing 1 contoh kalimatnya!',
                ans: 'Personifikasi mengibaratkan benda mati seolah bernyawa ("Angin malam berbisik lembut"), sedangkan hiperbola melebih-lebihkan kenyataan ("Suaranya menggelegar membelah angkasa").'
            }
        ],
        ipas: [
            {
                minGrade: 3, maxGrade: 6,
                topic: 'Analisis Hubungan Sebab Akibat Ekosistem',
                q: 'Jelaskan bagaimana proses terjadinya siklus air dapat terganggu akibat penggundulan hutan! Apa dampaknya terhadap ketersediaan air bersih bagi manusia?',
                ans: 'Akar pohon berfungsi menyerap air hujan ke dalam tanah (infiltrasi). Jika hutan gundul, air langsung mengalir menyebabkan banjir dan cadangan air tanah berkurang drastis.'
            },
            {
                minGrade: 3, maxGrade: 6,
                topic: 'Perubahan Energi',
                q: 'Sebutkan dan jelaskan 3 contoh alat elektronik di rumah yang mengalami perubahan energi listrik menjadi bentuk energi lain beserta manfaatnya!',
                ans: '1. Setrika (listrik -> panas) untuk merapikan pakaian. 2. Kipas angin (listrik -> gerak) untuk menyejukkan ruangan. 3. Lampu LED (listrik -> cahaya) untuk menerangi ruangan.'
            },
            {
                minGrade: 3, maxGrade: 6,
                topic: 'Pelestarian Sumber Daya Alam',
                q: 'Bedakan antara sumber daya alam yang dapat diperbarui dan tidak dapat diperbarui beserta masing-masing 2 contohnya, lalu jelaskan cara menghematnya!',
                ans: 'Dapat diperbarui: air, hutan, sinar matahari. Tidak dapat diperbarui: minyak bumi, batu bara, emas. Cara menghemat: matikan lampu bila tidak dipakai, kurangi kendaraan bermotor pribadi.'
            },
            {
                minGrade: 3, maxGrade: 6,
                topic: 'Daur Hidup Hewan',
                q: 'Jelaskan perbedaan antara metamorfosis sempurna dan metamorfosis tidak sempurna pada serangga beserta contoh hewannya!',
                ans: 'Metamorfosis sempurna memiliki 4 tahap (telur-larva-pupa-dewasa) seperti kupu-kupu, sedangkan tidak sempurna memiliki 3 tahap tanpa pupa (telur-nimfa-dewasa) seperti belalang.'
            },
            {
                topic: 'Gaya dan Gerak',
                q: 'Berikan 3 contoh peristiwa di sekolah yang menunjukkan bahwa gaya dapat mengubah bentuk benda dan arah gerak benda!',
                ans: '1. Plastisin ditekan berubah bentuk. 2. Bola ditendang mengubah arah gerak bola. 3. Sepeda direm menjadi melambat lalu berhenti.'
            }
        ],
        pancasila: [
            {
                topic: 'Refleksi Karakter Gotong Royong',
                q: 'Mengapa sikap gotong royong dan kepedulian terhadap sesama sangat penting untuk diterapkan di lingkungan sekolah? Berikan 2 contoh tindakan nyata yang dapat kamu lakukan!',
                ans: 'Gotong royong penting agar tercipta kerukunan dan pekerjaan berat cepat selesai. Contoh: ikut kerja bakti membersihkan kelas dan membantu teman yang kesulitan.'
            },
            {
                minGrade: 3, maxGrade: 6,
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
                minGrade: 3, maxGrade: 6,
                topic: 'Penerapan Norma di Masyarakat',
                q: 'Mengapa aturan lalu lintas dan norma kesopanan wajib dipatuhi oleh semua warga? Apa dampaknya jika masyarakat melanggar aturan tersebut?',
                ans: 'Aturan menjaga keselamatan, ketertiban, dan keharmonisan bersama. Jika dilanggar akan timbul kekacauan, perselisihan, dan kecelakaan.'
            },
            {
                topic: 'Menghargai Pendapat Orang Lain',
                q: 'Bagaimana sikap yang bijaksana ketika pendapat temanmu dalam diskusi kelompok berbeda dengan pendapatmu?',
                ans: 'Mendengarkan dengan tenang tanpa memotong pembicaraan, menghargai alasannya, serta mencari jalan tengah terbaik melalui musyawarah.'
            }
        ],
        pjok: [
            {
                minGrade: 3, maxGrade: 6,
                topic: 'Teknik Dasar Permainan Bola Besar',
                q: 'Jelaskan 2 teknik dasar permainan sepak bola atau bola voli (misalnya mengumpan dan mengontrol bola), lalu uraikan mengapa kerja sama tim lebih penting daripada bermain sendiri!',
                ans: 'Contoh: Passing dengan kaki bagian dalam dan menghentikan bola dengan telapak kaki. Kerja sama tim membuat aliran bola efektif, menjaga stamina, dan memudahkan pencapaian kemenangan secara sportif.'
            },
            {
                minGrade: 1, maxGrade: 2,
                topic: 'Gerak Berjalan dan Melompat',
                q: 'Sebutkan 2 contoh gerak berpindah tempat yang sering dilakukan saat bermain di halaman sekolah, lalu jelaskan cara melakukannya agar tidak terjatuh!',
                ans: 'Contoh: Berjalan santai dan melompat ke depan. Cara aman: melihat arah depan, memakai sepatu olahraga yang pas, dan menjaga keseimbangan badan.'
            },
            {
                topic: 'Keselamatan di Kolam Renang',
                q: 'Sebutkan 3 aturan keselamatan yang wajib dipatuhi siswa sebelum dan selama berlatih renang di kolam renang!',
                ans: '1. Melakukan pemanasan dan memakai pakaian renang sesuai ukuran. 2. Tidak berlari-lari di pinggir kolam yang licin atau bercanda mendorong teman. 3. Mematuhi kedalaman kolam sesuai kemampuan dan arahan guru.'
            },
            {
                minGrade: 3, maxGrade: 6,
                topic: 'Latihan Kebugaran Daya Tahan & Kekuatan',
                q: 'Sebutkan masing-masing 1 bentuk latihan untuk melatih kekuatan otot lengan, kekuatan otot perut, dan daya tahan jantung (kardiovaskular), serta manfaatnya bagi tubuh siswa!',
                ans: '1. Otot lengan: push-up. 2. Otot perut: sit-up. 3. Daya tahan jantung: jogging atau lari santai. Manfaat: tubuh bugar, tidak mudah lelah saat belajar, dan meningkatkan imunitas.'
            },
            {
                topic: 'Kebersihan Diri dan Gizi Seimbang',
                q: 'Jelaskan 3 manfaat mengonsumsi makanan bergizi seimbang (karbohidrat, protein, sayur, buah) dan minum air putih yang cukup setiap hari bagi siswa aktif berolahraga!',
                ans: '1. Memberi energi cukup untuk beraktivitas. 2. Membantu pertumbuhan tulang dan pemulihan otot setelah latihan. 3. Menjaga daya tahan tubuh agar tidak mudah sakit atau dehidrasi.'
            }
        ],
        seni: [
            {
                topic: 'Pencampuran Warna Primer & Sekunder',
                q: 'Sebutkan 3 warna primer dalam seni rupa dan tuliskan 3 warna sekunder yang dihasilkan apabila warna-warna primer tersebut dicampurkan berpasangan!',
                ans: 'Warna primer: Merah, Kuning, Biru. Warna sekunder: Merah + Kuning = Oranye (Jingga); Kuning + Biru = Hijau; Merah + Biru = Ungu.'
            },
            {
                topic: 'Apresiasi Karya Daerah Nusantara',
                q: 'Sebutkan 2 contoh seni kriya atau kesenian tradisional Nusantara (seperti batik, anyaman, atau tari daerah) serta jelaskan cara siswa melestarikannya di lingkungan sekolah!',
                ans: 'Contoh: Batik tulis dan Tari Pendet/Saman. Cara melestarikan: bangga mengenakan seragam batik, mengikuti kegiatan ekstrakurikuler seni, dan tampil dalam pentas seni sekolah.'
            }
        ],
        inggris: [
            {
                minGrade: 3, maxGrade: 6,
                topic: 'Healthy Food & Preferences',
                q: 'Write 3 sentences in English about your favorite healthy food and drink, and explain why you like them!',
                ans: 'Example: 1. My favorite food is vegetable soup because it is healthy and delicious. 2. I also like fresh orange juice. 3. I do not like drinking sweet soda every day.'
            },
            {
                minGrade: 1, maxGrade: 2,
                topic: 'Animals and Numbers in English',
                q: 'Write 3 names of animals you know in English and translate the numbers "dua", "lima", and "sepuluh" into English!',
                ans: 'Animals: Cat, Bird, Fish. Numbers: 2 = Two, 5 = Five, 10 = Ten.'
            },
            {
                minGrade: 4, maxGrade: 6,
                topic: 'Helping Parents at Home (Simple Past)',
                q: 'Write 3 sentences in English using Simple Past Tense about how you helped your parents last weekend!',
                ans: 'Example: 1. Last Sunday, I cleaned my bedroom in the morning. 2. I washed the dishes with my mother. 3. Then, I watered the flowers in the garden.'
            }
        ],
        pai: [
            {
                topic: 'Hikmah Salat Berjemaah',
                q: 'Jelaskan 3 hikmah dan manfaat melaksanakan salat secara berjemaah bersama teman atau keluarga di masjid maupun di rumah!',
                ans: '1. Mendapat pahala 27 derajat lebih utama daripada salat sendirian. 2. Mempererat tali persaudaraan dan kerukunan. 3. Melatih kedisiplinan waktu dan kekompakan.'
            },
            {
                topic: 'Adab Terhadap Guru dan Teman',
                q: 'Tuliskan 3 contoh adab sopan santun seorang siswa muslim kepada Bapak/Ibu guru serta teman sebaya di lingkungan sekolah!',
                ans: '1. Mengucapkan salam dan berbicara sopan kepada guru. 2. Mendengarkan penjelasan guru dengan sungguh-sungguh. 3. Saling menolong, tidak mengejek, dan mudah memaafkan teman.'
            }
        ],
        koding: [
            {
                minGrade: 3, maxGrade: 6,
                topic: 'Konsep Perulangan & Percabangan',
                q: 'Mengapa pemrogram menggunakan perulangan (loop) dan percabangan (IF-ELSE) dalam membuat permainan edukasi? Berikan masing-masing 1 contoh penggunaannya!',
                ans: 'Loop membuat perintah berulang lebih singkat (contoh: karakter berjalan 10 kali maju). IF-ELSE membuat keputusan otomatis (contoh: JIKA karakter menyentuh koin, MAKA skor bertambah 1).'
            },
            {
                topic: 'Dekomposisi Masalah Sehari-hari',
                q: 'Bagaimana kamu memecah (dekomposisi) kegiatan "Menyiapkan Perlengkapan Sekolah untuk Besok" menjadi 4 bagian tugas kecil yang teratur?',
                ans: '1. Memeriksa jadwal pelajaran besok. 2. Memasukkan buku paket dan buku tulis sesuai jadwal. 3. Mengecek isi kotak pensil. 4. Menyiapkan seragam, kaos kaki, dan botol minum.'
            }
        ],
        mulok: [
            {
                topic: 'Kearifan Lokal Lingkungan Sekitar',
                q: 'Jelaskan 2 contoh tradisi gotong royong atau kearifan lokal yang masih dijalankan masyarakat di daerah tempat tinggalmu beserta manfaatnya bagi kerukunan warga!',
                ans: 'Contoh: Kerja bakti membersihkan lingkungan dan musyawarah warga (rembuk desa). Manfaat: Mempererat kekeluargaan, menjaga kebersihan kampung, dan menumbuhkan kepedulian sosial.'
            }
        ]
    };

    const filteredTopics = filterAndPrioritizeByGrade(extraTopicsByCat[cat] || extraTopicsByCat.indo, grade);
    const selectedTopics = filteredTopics.length > 0 ? filteredTopics : (extraTopicsByCat[cat] || extraTopicsByCat.indo);
    const picked = selectedTopics[(index - 1) % selectedTopics.length];
    const cycle = Math.floor((index - 1) / selectedTopics.length);
    const rephrased = rephraseQuestionNatural(
        picked.q,
        '',
        picked.topic,
        grade,
        cycle,
        cat === 'inggris'
    );

    return {
        stimulus: rephrased.stimulus || undefined,
        question: rephrased.question,
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
// 8. ZERO-DUPLICATE & GRADE-GUARD POST-PROCESSORS
// ==========================================
export function isGradeMismatchedQuestion(question: string, stimulus: string | undefined, grade: number): boolean {
    const text = `${stimulus || ''} ${question || ''}`.toLowerCase();
    // Reject explicit mentions of a higher grade (e.g., "siswa kelas 6" when generating for Kelas 1-5)
    for (let g = grade + 1; g <= 6; g++) {
        if (new RegExp(`\\bkelas\\s*${g}\\b`).test(text)) {
            return true;
        }
    }
    // Reject Class 5-6 exclusive topics when generating for Class 1-4
    if (grade <= 4) {
        if (/volume\s+kubus|luas\s+permukaan\s+kubus|jaring-jaring\s+kubus|koordinat\s+kartesius|\bkartesius\b|rotasi\s+bumi|revolusi\s+bumi|gerhana\s+(matahari|bulan)|tata\s+surya|rata-rata\s*\(mean\)|nilai\s+median|\bmodus\b.*data|bilangan\s+bulat\s+negatif|luas\s+lingkaran|keliling\s+lingkaran|proklamasi\s+kemerdekaan|\basean\b/.test(text)) {
            return true;
        }
    }
    // Reject Class 3-6 topics when generating for Fase A (Class 1-2)
    if (grade <= 2) {
        if (/\bmajas\b|personifikasi|hiperbola|metafora|teks\s+eksplanasi|luas\s+segitiga|keliling\s+persegi\s+panjang|\bkpk\b|\bfpb\b|pecahan\s+desimal|fotosintesis|siklus\s+air|rantai\s+makanan/.test(text)) {
            return true;
        }
    }
    return false;
}

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
    const grade = parseGradeFromClassName(className);

    // 1. Keep valid unique & grade-appropriate items
    for (const item of items) {
        if (!item || !item.question || item.question.trim().length < 5) continue;
        if (!Array.isArray(item.options) || item.options.length < 3) continue;
        if (isGradeMismatchedQuestion(item.question, item.stimulus, grade)) continue;
        if (!isDuplicateQuestion(seenFingerprints, item.question, item.stimulus)) {
            markQuestionSeen(seenFingerprints, item.question, item.stimulus);
            uniqueResult.push(item);
            if (uniqueResult.length >= targetCount) break;
        }
    }

    // 2. If short of targetCount, fill with guaranteed unique grade-matched questions
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
    const grade = parseGradeFromClassName(className);

    for (const item of items) {
        if (!item || !item.question || item.question.trim().length < 5) continue;
        if (isGradeMismatchedQuestion(item.question, item.stimulus, grade)) continue;
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
    const grade = parseGradeFromClassName(className);

    for (const item of items) {
        if (!item || !item.question || item.question.trim().length < 5) continue;
        if (isGradeMismatchedQuestion(item.question, item.stimulus, grade)) continue;
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
