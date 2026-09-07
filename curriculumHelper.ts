// Curriculum Helper for Kurikulum Merdeka 2025 - Program Tahunan (Prota) Integration

export interface AtpItem {
  alur: string;
  alokasiWaktu: string;
  planDate?: string;
  semester?: number;
}

export interface TpGroup {
  tp: string;
  atpItems: AtpItem[];
}

export interface Allocation {
  className: string;
  tujuanPembelajaran: string[];
  structuredAtp?: TpGroup[];
  scheduleDays?: string[];
}

export interface ElementData {
  elementName: string;
  capaianPembelajaran: string;
  allocations: Allocation[];
}

export interface CurriculumData {
  subject: string;
  fase: string;
  description: string;
  elements: ElementData[];
}

export const JP_STANDARDS: Record<string, Record<string, number>> = {
    "Bahasa Indonesia": { "Kelas 1": 216, "Kelas 2": 216, "Kelas 3": 216, "Kelas 4": 216, "Kelas 5": 216, "Kelas 6": 192 },
    "Matematika": { "Kelas 1": 144, "Kelas 2": 180, "Kelas 3": 180, "Kelas 4": 180, "Kelas 5": 180, "Kelas 6": 160 },
    "IPAS (Ilmu Pengetahuan Alam dan Sosial)": { "Kelas 1": 0, "Kelas 2": 0, "Kelas 3": 180, "Kelas 4": 180, "Kelas 5": 180, "Kelas 6": 160 },
    "PPKn (Pendidikan Pancasila)": { "Kelas 1": 144, "Kelas 2": 144, "Kelas 3": 144, "Kelas 4": 144, "Kelas 5": 144, "Kelas 6": 128 },
    "Seni Budaya": { "Kelas 1": 108, "Kelas 2": 108, "Kelas 3": 108, "Kelas 4": 108, "Kelas 5": 108, "Kelas 6": 96 },
    "Seni Rupa": { "Kelas 1": 108, "Kelas 2": 108, "Kelas 3": 108, "Kelas 4": 108, "Kelas 5": 108, "Kelas 6": 96 },
    "Seni Musik": { "Kelas 1": 108, "Kelas 2": 108, "Kelas 3": 108, "Kelas 4": 108, "Kelas 5": 108, "Kelas 6": 96 },
    "Seni Tari": { "Kelas 1": 108, "Kelas 2": 108, "Kelas 3": 108, "Kelas 4": 108, "Kelas 5": 108, "Kelas 6": 96 },
    "Seni Teater": { "Kelas 1": 108, "Kelas 2": 108, "Kelas 3": 108, "Kelas 4": 108, "Kelas 5": 108, "Kelas 6": 96 },
    "PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan)": { "Kelas 1": 108, "Kelas 2": 108, "Kelas 3": 108, "Kelas 4": 108, "Kelas 5": 108, "Kelas 6": 96 },
    "Bahasa Inggris": { "Kelas 1": 72, "Kelas 2": 72, "Kelas 3": 72, "Kelas 4": 72, "Kelas 5": 72, "Kelas 6": 64 },
    "Pendidikan Agama Islam": { "Kelas 1": 108, "Kelas 2": 108, "Kelas 3": 108, "Kelas 4": 108, "Kelas 5": 108, "Kelas 6": 96 },
    "Pendidikan Agama Kristen": { "Kelas 1": 108, "Kelas 2": 108, "Kelas 3": 108, "Kelas 4": 108, "Kelas 5": 108, "Kelas 6": 96 },
    "Pendidikan Agama Katolik": { "Kelas 1": 108, "Kelas 2": 108, "Kelas 3": 108, "Kelas 4": 108, "Kelas 5": 108, "Kelas 6": 96 },
    "Pendidikan Agama Hindu": { "Kelas 1": 108, "Kelas 2": 108, "Kelas 3": 108, "Kelas 4": 108, "Kelas 5": 108, "Kelas 6": 96 },
    "Pendidikan Agama Buddha": { "Kelas 1": 108, "Kelas 2": 108, "Kelas 3": 108, "Kelas 4": 108, "Kelas 5": 108, "Kelas 6": 96 },
    "Pendidikan Agama Khonghucu": { "Kelas 1": 108, "Kelas 2": 108, "Kelas 3": 108, "Kelas 4": 108, "Kelas 5": 108, "Kelas 6": 96 },
    "Koding & Kecerdasan Artifisial": { "Kelas 1": 72, "Kelas 2": 72, "Kelas 3": 72, "Kelas 4": 72, "Kelas 5": 72, "Kelas 6": 64 },
    "Koding kecerdasan artifisial": { "Kelas 1": 72, "Kelas 2": 72, "Kelas 3": 72, "Kelas 4": 72, "Kelas 5": 72, "Kelas 6": 64 },
    "Muatan Lokal": { "Kelas 1": 72, "Kelas 2": 72, "Kelas 3": 72, "Kelas 4": 72, "Kelas 5": 72, "Kelas 6": 64 }
};

export const getSubjectKey = (subjectName: string): string | null => {
    if (!subjectName) return null;
    const lower = String(subjectName).toLowerCase().trim();

    if (JP_STANDARDS[subjectName]) return subjectName;
    const keys = Object.keys(JP_STANDARDS);
    const directKey = keys.find(k => String(k).toLowerCase() === lower);
    if (directKey) return directKey;

    const fuzzyKey = keys.find(k => {
        const kLower = String(k).toLowerCase();
        return lower.includes(kLower) || kLower.includes(lower);
    });
    if (fuzzyKey) return fuzzyKey;

    // Direct domain mappings
    if (lower.includes('pjok') || lower.includes('jasmani') || lower.includes('olahraga')) {
        return "PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan)";
    }
    if (lower.includes('pancasila') || lower.includes('ppkn') || lower.includes('pkn')) {
        return "PPKn (Pendidikan Pancasila)";
    }
    if (lower.includes('ipas') || lower.includes('alam dan sosial') || lower.includes('sains')) {
        return "IPAS (Ilmu Pengetahuan Alam dan Sosial)";
    }
    if (lower.includes('indonesia')) {
        return "Bahasa Indonesia";
    }
    if (lower.includes('matematika') || lower.includes('mtk')) {
        return "Matematika";
    }
    if (lower.includes('inggris') || lower.includes('english')) {
        return "Bahasa Inggris";
    }
    if (lower.includes('koding') || lower.includes('kecerdasan artifisial') || lower.includes('ai') || lower.includes('informatika')) {
        return "Koding & Kecerdasan Artifisial";
    }
    if (lower.includes('seni rupa') || lower.includes('rupa')) {
        return "Seni Rupa";
    }
    if (lower.includes('seni musik') || lower.includes('musik')) {
        return "Seni Musik";
    }
    if (lower.includes('seni tari') || lower.includes('tari')) {
        return "Seni Tari";
    }
    if (lower.includes('seni teater') || lower.includes('teater')) {
        return "Seni Teater";
    }
    if (lower.includes('seni budaya') || lower.includes('budaya')) {
        return "Seni Budaya";
    }
    if (lower.includes('islam') || lower.includes('pai')) {
        return "Pendidikan Agama Islam";
    }
    if (lower.includes('kristen')) {
        return "Pendidikan Agama Kristen";
    }
    if (lower.includes('katolik')) {
        return "Pendidikan Agama Katolik";
    }
    if (lower.includes('hindu')) {
        return "Pendidikan Agama Hindu";
    }
    if (lower.includes('buddha')) {
        return "Pendidikan Agama Buddha";
    }
    if (lower.includes('khonghucu')) {
        return "Pendidikan Agama Khonghucu";
    }
    if (lower.includes('muatan lokal') || lower.includes('mulok') || lower.includes('daerah') || lower.includes('sunda') || lower.includes('jawa')) {
        return "Muatan Lokal";
    }

    return null;
};

export const isSameSubject = (subA: string, subB: string): boolean => {
    if (!subA || !subB) return false;
    const cleanA = String(subA).toLowerCase().trim();
    const cleanB = String(subB).toLowerCase().trim();
    if (cleanA === cleanB) return true;

    const keyA = getSubjectKey(subA);
    const keyB = getSubjectKey(subB);
    if (keyA && keyB && keyA === keyB) return true;

    // Word token overlap check
    const extractTokens = (s: string) => s.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    const tokensA = extractTokens(cleanA);
    const tokensB = extractTokens(cleanB);
    const shared = tokensA.filter(t => tokensB.includes(t));
    if (shared.length >= 2 || (shared.length === 1 && (shared[0] === 'pjok' || shared[0] === 'ipas' || shared[0] === 'matematika' || shared[0] === 'pancasila' || shared[0] === 'koding' || shared[0] === 'inggris'))) {
        return true;
    }

    if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) return true;

    return false;
};

/**
 * Synthesizes high-quality, concrete pedagogical ATP activity items from a given Tujuan Pembelajaran (TP).
 * Ensures that ATP is never empty, providing structured progressive learning flow with reasonable JP.
 */
export const synthesizeAtpItemsForTp = (tp: string, subject: string, index: number): AtpItem[] => {
    const cleanTp = (tp || "").replace(/^-\s*/, '').replace(/^\d+[\.\)]\s*/, '').trim();
    const subKey = getSubjectKey(subject) || subject;
    const defaultJp = subKey.includes('Bahasa Indonesia') || subKey.includes('Matematika') ? '4 JP' : '3 JP';

    if (!cleanTp) {
        return [
            { alur: "Mempelajari konsep dasar dan eksplorasi materi pembelajaran", alokasiWaktu: defaultJp },
            { alur: "Latihan pemahaman terbimbing dan diskusi kelompok", alokasiWaktu: defaultJp },
            { alur: "Penerapan praktis, simulasi karya, dan evaluasi hasil belajar", alokasiWaktu: defaultJp }
        ];
    }

    // Extract core clause or topic
    let coreTopic = cleanTp;
    const connectors = [" dalam ", " dengan ", " pada ", " melalui ", " secara ", " tentang "];
    for (const conn of connectors) {
        if (cleanTp.toLowerCase().includes(conn)) {
            const parts = cleanTp.split(new RegExp(conn, 'i'));
            if (parts[1] && parts[1].length > 10) {
                coreTopic = parts[1].trim();
                break;
            }
        }
    }

    // Deconstruct into 2 or 3 sequential learning activities
    const items: AtpItem[] = [
        {
            alur: `Eksplorasi Konsep: Mengidentifikasi prinsip dasar, terminologi, dan langkah-langkah ${coreTopic.length > 70 ? coreTopic.substring(0, 70) + '...' : coreTopic}`,
            alokasiWaktu: defaultJp
        },
        {
            alur: `Latihan & Praktik Terbimbing: Mempraktikkan keterampilan dan mendemonstrasikan secara berpasangan/kelompok materi ${cleanTp.length > 80 ? cleanTp.substring(0, 80) + '...' : cleanTp}`,
            alokasiWaktu: defaultJp
        },
        {
            alur: `Penerapan Kontekstual & Asesmen: Menganalisis hasil penerapan serta menyelesaikan proyek/tugas formatif terkait ${cleanTp.length > 70 ? cleanTp.substring(0, 70) + '...' : cleanTp}`,
            alokasiWaktu: defaultJp
        }
    ];

    return items;
};

/**
 * Maps academic calendar effective date slots to structured ATP items.
 * Guarantees that every item receives a valid ISO planDate (YYYY-MM-DD) and standardized JP.
 */
export const distributeDatesToStructuredAtp = (
    structuredAtp: TpGroup[],
    classDates: { date: Date, jp: number }[],
    className: string,
    subjectName: string,
    academicYearStart: number = 2025
) => {
    if (!structuredAtp || structuredAtp.length === 0) return;

    const allItems: AtpItem[] = [];
    structuredAtp.forEach(grp => {
        (grp.atpItems || []).forEach(item => {
            allItems.push(item);
        });
    });

    if (allItems.length === 0) return;

    let datesList = classDates;
    if (!datesList || datesList.length === 0) {
        const start = new Date(academicYearStart, 6, 14); // 14 July
        const end = new Date(academicYearStart + 1, 5, 27); // 27 June
        const cur = new Date(start);
        datesList = [];
        while (cur <= end) {
            if (cur.getDay() === 1) { // Monday
                datesList.push({ date: new Date(cur), jp: 3 });
            }
            cur.setDate(cur.getDate() + 1);
        }
    }

    const totalSlots = datesList.length;
    const totalItems = allItems.length;

    allItems.forEach((item, idx) => {
        const slotIdx = Math.min(Math.floor((idx / totalItems) * totalSlots), totalSlots - 1);
        const slot = datesList[slotIdx];
        if (slot) {
            const d = slot.date;
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            item.planDate = `${year}-${month}-${day}`;
            item.alokasiWaktu = `${slot.jp || 3} JP`;
            item.semester = (d.getMonth() >= 6 && year === academicYearStart) ? 1 : 2;
        }
    });
};

/**
 * Standard Kurikulum Merdeka 2025 Curriculum Blueprint for all elementary subjects.
 * Serves as an instant, bulletproof fallback and baseline for complete Prota tables.
 */
export const synthesizeCurriculumProta = (
    subjectName: string,
    fase: { name: string, classes: string[] }
): CurriculumData => {
    const subKey = getSubjectKey(subjectName) || subjectName;
    const targetClasses = (fase?.classes && fase.classes.length > 0) ? fase.classes : ["Kelas 5", "Kelas 6"];

    // Default 4 elements tailored to the subject
    let elementsList: { name: string, cp: string, tps: string[] }[] = [];

    if (subKey.includes("PJOK") || subKey.includes("Jasmani")) {
        elementsList = [
            {
                name: "Keterampilan Gerak",
                cp: "Peserta didik menunjukkan kemampuan dalam mempraktikkan modifikasi pola gerak dasar dan keterampilan gerak spesifik berupa permainan dan olahraga, aktivitas senam, aktivitas gerak berirama, serta aktivitas permainan dan olahraga air secara mandiri.",
                tps: [
                    "Mempraktikkan variasi dan kombinasi keterampilan gerak spesifik melempar, menangkap, dan memukul dalam permainan bola kecil (kasti/rounders) dengan koordinasi yang baik.",
                    "Mempraktikkan variasi dan kombinasi pola gerak dominan senam lantai meliputi guling depan, guling belakang, dan meroda secara tepat dan percaya diri."
                ]
            },
            {
                name: "Pengetahuan Gerak",
                cp: "Peserta didik memahami prosedur dan fakta penerapan modifikasi pola gerak dasar, keterampilan gerak spesifik permainan, aktivitas senam, aktivitas berirama, dan aktivitas air.",
                tps: [
                    "Menganalisis prosedur dan aturan sederhana keterampilan gerak salah satu gaya renang (gaya dada atau gaya bebas) dengan koordinasi tubuh yang benar.",
                    "Menjelaskan strategi sederhana penyerangan dan pertahanan dalam permainan bola besar dan bola voli untuk meraih poin secara sportif."
                ]
            },
            {
                name: "Pemanfaatan Gerak",
                cp: "Peserta didik mengukur dan mempraktikkan latihan kebugaran jasmani terkait kesehatan serta menjaga pola hidup sehat untuk kebugaran tubuh.",
                tps: [
                    "Mempraktikkan aktivitas pengembangan kebugaran jasmani terkait kesehatan (daya tahan jantung dan kekuatan otot) sesuai kapasitas diri.",
                    "Memahami dan mendemonstrasikan tindakan pemeliharaan kebersihan alat reproduksi serta bahaya zat adiktif bagi kesehatan tubuh."
                ]
            },
            {
                name: "Pengembangan Karakter dan Nilai Gerak",
                cp: "Peserta didik menunjukkan perilaku bertanggung jawab secara personal dan sosial, menghargai perbedaan, serta menjunjung tinggi sportivitas dalam aktivitas jasmani.",
                tps: [
                    "Menunjukkan sikap sportivitas, kejujuran, dan kepatuhan terhadap peraturan dalam setiap permainan jasmani tim.",
                    "Bekerja sama secara inklusif dan saling menghargai kemampuan teman dalam aktivitas gerak dan permainan tradisional."
                ]
            }
        ];
    } else if (subKey.includes("Bahasa Indonesia")) {
        elementsList = [
            {
                name: "Menyimak",
                cp: "Peserta didik mampu menganalisis informasi berupa fakta, prosedur, dan ide pokok dari teks lisan, audio, dan teks aural secara kritis dan apresiatif.",
                tps: [
                    "Menganalisis ide pokok dan informasi faktual dari teks lisan berupa laporan hasil pengamatan atau wawancara.",
                    "Menyimpulkan isi pesan tersirat dan amanat dari cerita anak atau cerita rakyat yang diperdengarkan."
                ]
            },
            {
                name: "Membaca dan Memirsa",
                cp: "Peserta didik mampu membaca kata-kata dengan fasih, memahami pesan dan informasi teks narasi dan eksposisi, serta mengevaluasi akurasi teks.",
                tps: [
                    "Membedakan fakta dan opini dalam teks eksplanasi atau artikel berita anak dengan cermat.",
                    "Menganalisis unsur intrinsik (tokoh, alur, latar, konflik) dan pesan moral dalam teks fiksi."
                ]
            },
            {
                name: "Berbicara dan Mempresentasikan",
                cp: "Peserta didik mampu menyampaikan gagasan, pendapat, dan tanggapan secara santun, terstruktur, serta menyajikan presentasi dengan percaya diri.",
                tps: [
                    "Menyampaikan pendapat atau tanggapan kritis dalam forum diskusi kelas dengan etika berbahasa yang santun.",
                    "Mempresentasikan hasil pengamatan proyek sederhana menggunakan bantuan media visual atau bagan informatif."
                ]
            },
            {
                name: "Menulis",
                cp: "Peserta didik mampu menulis teks narasi, deskripsi, dan eksposisi dengan kaidah kebahasaan ejaan yang benar serta kosakata yang kaya.",
                tps: [
                    "Menulis teks deskripsi yang rinci tentang objek lingkungan sekitar menggunakan kalimat efektif dan tanda baca yang tepat.",
                    "Menyusun teks eksplanasi ilmiah sederhana berdasarkan hubungan sebab-akibat dengan runtut."
                ]
            }
        ];
    } else if (subKey.includes("Matematika")) {
        elementsList = [
            {
                name: "Bilangan",
                cp: "Peserta didik menunjukkan pemahaman pecahan senilai, operasi hitung pecahan, desimal, rasio, dan perbandingan untuk menyelesaikan masalah kontekstual.",
                tps: [
                    "Menyelesaikan operasi hitung penjumlahan dan pengurangan pecahan dengan penyebut berbeda dalam kehidupan sehari-hari.",
                    "Menganalisis dan menyelesaikan permasalahan rasio dan proporsi skala pada denah atau peta."
                ]
            },
            {
                name: "Aljabar",
                cp: "Peserta didik dapat menemukan pola bilangan berulang, pola membesar dan mengecil, serta model matematika sederhana berbentuk kalimat terbuka.",
                tps: [
                    "Mengidentifikasi dan memprediksi pola bilangan membesar dan mengecil serta deret sederhana secara logis.",
                    "Menyatakan relasi dan kalimat terbuka menggunakan simbol atau variabel matematika sederhana."
                ]
            },
            {
                name: "Pengukuran",
                cp: "Peserta didik dapat menghitung luas permukaan dan volume bangun ruang gabungan serta satuan baku yang sesuai.",
                tps: [
                    "Menghitung volume bangun ruang kubus, balok, dan gabungan bangun ruang menggunakan satuan kubik.",
                    "Menentukan luas bangun datar beraturan dan tidak beraturan menggunakan estimasi satuan luas."
                ]
            },
            {
                name: "Geometri",
                cp: "Peserta didik dapat mengonstruksi, membedakan jaring-jaring, dan mengidentifikasi karakteristik bangun ruang serta sudut koordinat.",
                tps: [
                    "Menganalisis sifat-sifat bangun ruang prisma, tabung, dan limas beserta jaring-jaring pembentuknya.",
                    "Menentukan posisi letak suatu objek atau titik koordinat pada bidang Kartesius kuadran I."
                ]
            },
            {
                name: "Analisis Data dan Peluang",
                cp: "Peserta didik dapat mengumpulkan, menyajikan, dan menafsirkan data dalam bentuk diagram batang, diagram garis, dan piktogram.",
                tps: [
                    "Menyajikan kumpulan data konkret ke dalam bentuk diagram batang ganda dan diagram garis dengan skala yang sesuai.",
                    "Menafsirkan dan membandingkan modus, rata-rata (mean), dan median dari sajian data kontekstual."
                ]
            }
        ];
    } else if (subKey.includes("IPAS") || subKey.includes("Alam dan Sosial")) {
        elementsList = [
            {
                name: "Pemahaman IPAS",
                cp: "Peserta didik memahami sistem organ tubuh manusia, interaksi ekosistem lingkungan, energi dan perubahannya, serta sejarah kebudayaan dan letak geografis Nusantara.",
                tps: [
                    "Menganalisis hubungan antara struktur dan fungsi sistem organ pernapasan, pencernaan, dan peredaran darah manusia.",
                    "Menyelidiki perpindahan energi dalam rantai makanan dan jaring-jaring kehidupan di suatu ekosistem darat maupun perairan.",
                    "Menjelaskan pengaruh kondisi geografis Indonesia terhadap keanekaragaman sosial budaya dan kegiatan ekonomi masyarakat."
                ]
            },
            {
                name: "Keterampilan Proses",
                cp: "Peserta didik mampu mengamati, mempertanyakan, merencanakan penyelidikan ilmiah, memproses data, serta mengomunikasikan hasil penemuan sains.",
                tps: [
                    "Merancang dan melakukan percobaan sederhana tentang sifat-sifat cahaya dan bunyi secara mandiri atau kelompok.",
                    "Merekam hasil pengamatan, mengolah data penyelidikan, dan membuat kesimpulan ilmiah yang terverifikasi."
                ]
            }
        ];
    } else if (subKey.includes("Pancasila") || subKey.includes("PPKn")) {
        elementsList = [
            {
                name: "Pancasila",
                cp: "Peserta didik memahami hubungan antar-sila Pancasila dan meneladani makna nilai-nilai Pancasila dalam kehidupan bermasyarakat.",
                tps: [
                    "Menganalisis contoh penerapan nilai-nilai luhur Pancasila dalam pengambilan keputusan musyawarah mufakat di sekolah dan masyarakat.",
                    "Meneladani sikap para pendiri bangsa dalam perumusan Pancasila sebagai dasar negara."
                ]
            },
            {
                name: "Undang-Undang Dasar NRI 1945",
                cp: "Peserta didik memahami norma, aturan, hak, dan kewajiban sebagai warga sekolah, warga masyarakat, dan warga negara.",
                tps: [
                    "Menganalisis pelaksanaan hak dan kewajiban warga negara secara seimbang dalam kehidupan bermasyarakat.",
                    "Menunjukkan sikap patuh terhadap norma kesopanan, kesusilaan, dan hukum yang berlaku di lingkungan sekitar."
                ]
            },
            {
                name: "Bhinneka Tunggal Ika",
                cp: "Peserta didik menghargai keberagaman suku, budaya, agama, dan gender serta menumbuhkan sikap toleransi.",
                tps: [
                    "Mengidentifikasi keragaman budaya, rumah adat, pakaian adat, dan tradisi lokal di berbagai provinsi Indonesia.",
                    "Mempromosikan sikap toleransi dan moderasi beragama dalam pergaulan sehari-hari antar-teman sebaya."
                ]
            },
            {
                name: "Negara Kesatuan Republik Indonesia",
                cp: "Peserta didik memahami arti penting persatuan dan kesatuan serta menjaga kedaulatan wilayah NKRI.",
                tps: [
                    "Menjelaskan peran penting generasi muda dalam menjaga persatuan dan keutuhan wilayah NKRI dari ancaman perpecahan.",
                    "Mempraktikkan kegiatan gotong royong dan bela negara sederhana di lingkungan sekolah dan tempat tinggal."
                ]
            }
        ];
    } else if (subKey.includes("Koding") || subKey.includes("AI") || subKey.includes("Artifisial")) {
        elementsList = [
            {
                name: "Berpikir Komputasional (Computational Thinking)",
                cp: "Peserta didik mampu menerapkan dekomposisi, pengenalan pola, abstraksi, dan perancangan algoritma dalam menyelesaikan tantangan kehidupan sehari-hari.",
                tps: [
                    "Mendekomposisi masalah kompleks menjadi langkah-langkah terstruktur yang logis dan efisien.",
                    "Mengenali pola dan merumuskan abstraksi data untuk menyusun prosedur instruksi bertahap."
                ]
            },
            {
                name: "Algoritma & Pemrograman Visual Blok",
                cp: "Peserta didik mampu merancang, memodifikasi, dan menjalankan program visual menggunakan blok kode untuk menghasilkan animasi atau game edukatif sederhana.",
                tps: [
                    "Menyusun urutan perintah (sekuens) dan percabangan (kondisi IF-ELSE) dalam lingkungan pemrograman visual blok.",
                    "Menggunakan perulangan (loop) dan variabel untuk mengendalikan gerak sprite dalam pembuatan proyek interaktif."
                ]
            },
            {
                name: "Pemanfaatan Kecerdasan Artifisial & Literasi Digital",
                cp: "Peserta didik memahami konsep dasar kecerdasan artifisial, etika pemanfaatan AI, serta menjaga keamanan data pribadi di ruang digital.",
                tps: [
                    "Menjelaskan cara kerja sederhana AI dalam mengenali gambar, suara, atau teks berdasarkan data latih.",
                    "Menerapkan prinsip etika, kejujuran akademik, dan perlindungan privasi saat menggunakan perangkat AI digital."
                ]
            }
        ];
    } else {
        // Generic rich curriculum builder for any subject
        elementsList = [
            {
                name: `Pemahaman Konsep ${subjectName}`,
                cp: `Peserta didik memahami prinsip esensial, terminologi, dan fakta kontekstual pada mata pelajaran ${subjectName} sesuai standar Kurikulum Merdeka.`,
                tps: [
                    `Mengidentifikasi dan menjelaskan konsep dasar serta prinsip utama pada materi ${subjectName}.`,
                    `Menganalisis hubungan antar-konsep materi ${subjectName} dengan fenomena kehidupan sehari-hari.`
                ]
            },
            {
                name: `Keterampilan Penerapan & Praktik`,
                cp: `Peserta didik mampu mendemonstrasikan prosedur kerja, eksplorasi keterampilan, dan unjuk karya pada ${subjectName}.`,
                tps: [
                    `Mempraktikkan teknik dan prosedur terstruktur dalam pemecahan masalah ${subjectName}.`,
                    `Menciptakan karya atau solusi aplikatif yang terencana secara mandiri atau kelompok.`
                ]
            },
            {
                name: `Analisis & Evaluasi`,
                cp: `Peserta didik mengevaluasi hasil kerja, merefleksikan proses belajar, dan menarik kesimpulan kritis.`,
                tps: [
                    `Mengevaluasi kelebihan dan kekurangan solusi yang diterapkan dalam konteks ${subjectName}.`,
                    `Menyusun laporan refleksi pembelajaran dan mendiskusikannya dengan rekan sejawat.`
                ]
            },
            {
                name: `Penanaman Karakter & Sikap Positif`,
                cp: `Peserta didik menunjukkan kemandirian, gotong royong, integritas, dan kebiasaan bernalar kritis.`,
                tps: [
                    `Menunjukkan sikap tanggung jawab, disiplin, dan etika positif selama pembelajaran ${subjectName}.`,
                    `Berkolaborasi secara aktif dalam proyek tim dengan saling menghargai pendapat.`
                ]
            }
        ];
    }

    const elements: ElementData[] = elementsList.map((el, elIdx) => {
        const allocations: Allocation[] = targetClasses.map(cls => {
            const classTps = el.tps.map((tpText, tpIdx) => {
                return tpText.replace(/Kelas \d+/g, cls);
            });

            const structuredAtp: TpGroup[] = classTps.map((tp, tpIdx) => ({
                tp,
                atpItems: synthesizeAtpItemsForTp(tp, subjectName, tpIdx)
            }));

            return {
                className: cls,
                tujuanPembelajaran: classTps,
                structuredAtp
            };
        });

        return {
            elementName: el.name,
            capaianPembelajaran: el.cp,
            allocations
        };
    });

    return {
        subject: subjectName,
        fase: fase.name,
        description: `Program Tahunan (Prota) terintegrasi mata pelajaran ${subjectName} untuk jenjang Sekolah Dasar (${fase.name}) sesuai Kepmendikdasmen Kurikulum Merdeka 2025.`,
        elements
    };
};
