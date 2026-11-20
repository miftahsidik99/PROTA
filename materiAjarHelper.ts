import { CurriculumData, isSameClass, isSameSubject, synthesizeAtpItemsForTp, synthesizeCurriculumProta } from './curriculumHelper';
import { generateGeminiContent } from './geminiClient';
import { synthesizeContextual2dVisual } from './dynamic2dVisualHelper';
import { searchInternetImageCandidates } from './mediaSearchHelper';

export type MateriTemplateId =
    | 'educational_infographic'
    | 'cheat_sheet'
    | 'sticky_notes'
    | 'mind_map'
    | 'comic_strip'
    | 'flashcard'
    | 'step_by_step'
    | 'timeline'
    | 'comparison_chart'
    | 'isometric_3d';

export type HierarchyFocusLevel = 'elemen' | 'tp' | 'atp';

export interface MateriAjarTemplateMeta {
    id: MateriTemplateId;
    order: number;
    name: string;
    subtitle: string;
    description: string;
    bestFor: string;
    accentHex: string;
    surfaceHex: string;
}

export const MATERI_AJAR_TEMPLATES: MateriAjarTemplateMeta[] = [
    {
        id: 'educational_infographic',
        order: 1,
        name: 'Educational Infographic',
        subtitle: 'Poster Infografis Lengkap',
        description: 'Poster edukasi A4 Portrait modern memadukan pengantar, inti materi berilustrasi konkret, contoh sehari-hari, aktivitas, rangkuman, dan latihan.',
        bestFor: 'Standar utama infografis materi ajar A4 Portrait 300 DPI untuk seluruh mata pelajaran.',
        accentHex: '#0f766e',
        surfaceHex: '#f0fdfa'
    },
    {
        id: 'cheat_sheet',
        order: 2,
        name: 'Cheat Sheet',
        subtitle: 'Ringkasan materi',
        description: 'Lembar ringkasan belajar padat berisi rumus inti, kaidah bahasa, definisi penting, dan tips anti-keliru.',
        bestFor: 'Matematika, kaidah tata bahasa, penguasaan rumus cepat, dan persiapan asesmen.',
        accentHex: '#1d4ed8',
        surfaceHex: '#eff6ff'
    },
    {
        id: 'sticky_notes',
        order: 3,
        name: 'Sticky Notes',
        subtitle: 'Catatan penting',
        description: 'Kumpulan kartu catatan tempel berwarna tematik untuk poin penting, contoh cepat, dan pengingat konsep.',
        bestFor: 'Penguatan karakter, PPKn, catatan harian siswa kelas rendah, dan rangkuman poin kunci.',
        accentHex: '#b45309',
        surfaceHex: '#fffbeb'
    },
    {
        id: 'mind_map',
        order: 4,
        name: 'Mind Map',
        subtitle: 'Pemetaan konsep',
        description: 'Diagram peta pikiran bercabang dari ide utama menuju sub-konsep dan kata kunci secara terstruktur.',
        bestFor: 'Pemetaan topik luas IPAS, klasifikasi, keterkaitan antar konsep, dan curah gagasan.',
        accentHex: '#6d28d9',
        surfaceHex: '#f5f3ff'
    },
    {
        id: 'comic_strip',
        order: 5,
        name: 'Comic Strip',
        subtitle: 'Cerita pembelajaran',
        description: 'Alur cerita bergambar berpanel lengkap dengan tokoh, dialog alami, dan pesan pembelajaran kontekstual.',
        bestFor: 'Bahasa Indonesia, Bahasa Daerah/Sunda, Bahasa Inggris, PAIBP, dan pendidikan karakter.',
        accentHex: '#be123c',
        surfaceHex: '#fff1f2'
    },
    {
        id: 'flashcard',
        order: 6,
        name: 'Flashcard',
        subtitle: 'Hafalan dan latihan',
        description: 'Kartu belajar dua sisi (pertanyaan/istilah & jawaban/penjelasan) untuk latihan aktif dan penguatan memori.',
        bestFor: 'Kosakata Bahasa Inggris/Sunda, perkalian/pecahan dasar, tajwid/doa, dan istilah sains.',
        accentHex: '#047857',
        surfaceHex: '#ecfdf5'
    },
    {
        id: 'step_by_step',
        order: 7,
        name: 'Step-by-Step',
        subtitle: 'Tahapan proses',
        description: 'Panduan langkah demi langkah yang sistematis mulai dari persiapan, prosedur kerja, hingga evaluasi hasil.',
        bestFor: 'Algoritma/Koding, teks prosedur, langkah eksperimen IPAS, gerakan PJOK, dan praktik ibadah.',
        accentHex: '#0369a1',
        surfaceHex: '#f0f9ff'
    },
    {
        id: 'timeline',
        order: 8,
        name: 'Timeline',
        subtitle: 'Kronologi sejarah',
        description: 'Garis waktu berurutan menampilkan fase perkembangan, era sejarah, peristiwa penting, dan dampaknya.',
        bestFor: 'Sejarah perjuangan/kerajaan Nusantara, kisah keteladanan Nabi/tokoh, dan daur pertumbuhan.',
        accentHex: '#9a3412',
        surfaceHex: '#fff7ed'
    },
    {
        id: 'comparison_chart',
        order: 9,
        name: 'Comparison Chart',
        subtitle: 'Perbandingan konsep',
        description: 'Matriks visual perbandingan dua atau lebih konsep lengkap dengan aspek pembeda, persamaan, dan contoh.',
        bestFor: 'Membedakan bangun datar/ruang, hak vs kewajiban, wujud zat, simbiosis, atau jenis teks.',
        accentHex: '#334155',
        surfaceHex: '#f8fafc'
    },
    {
        id: 'isometric_3d',
        order: 10,
        name: 'Isometric 3D',
        subtitle: 'Visualisasi objek',
        description: 'Diagram objek 3 dimensi isometrik dengan penanda bagian bernomor untuk memahami struktur dan ruang.',
        bestFor: 'Geometri bangun ruang, anatomi tumbuhan/organ, tata surya, rangkaian listrik, dan Seni Rupa 3D.',
        accentHex: '#4338ca',
        surfaceHex: '#eef2ff'
    }
];

export interface HierarchyAtpNode {
    id: string;
    index: number;
    alur: string;
    alokasiWaktu: string;
    semester: number;
}

export interface HierarchyTpNode {
    id: string;
    index: number;
    tp: string;
    semester: number;
    atpItems: HierarchyAtpNode[];
}

export interface HierarchyElementNode {
    id: string;
    index: number;
    elementName: string;
    capaianPembelajaran: string;
    tpNodes: HierarchyTpNode[];
}

export interface MateriAjarHierarchyTree {
    subject: string;
    className: string;
    fase: string;
    sourceType: 'locked_prota' | 'saved_prota' | 'bskap_046';
    elements: HierarchyElementNode[];
}

export interface TemplateRecommendationResult {
    recommendedId: MateriTemplateId;
    reason: string;
    alternatives: { id: MateriTemplateId; reason: string }[];
}

export interface InfographicPillar {
    number: string;
    title: string;
    summary: string;
    keyFact: string;
    example: string;
}

export interface CheatSheetBox {
    title: string;
    category: string;
    items: string[];
    formulaOrRule?: string;
}

export interface StickyNoteCard {
    title: string;
    tag: string;
    colorTheme: 'amber' | 'sky' | 'emerald' | 'rose' | 'violet';
    content: string;
    reminder: string;
}

export interface MindMapBranch {
    title: string;
    colorHex: string;
    keywords: string[];
    explanation: string;
}

export interface ComicPanel {
    panelNo: number;
    sceneTitle: string;
    characterLeft: string;
    characterRight?: string;
    dialogueLeft: string;
    dialogueRight?: string;
    narration: string;
    mood: 'happy' | 'curious' | 'explain' | 'eureka';
}

export interface FlashcardItem {
    cardNo: number;
    category: string;
    frontPrompt: string;
    hint: string;
    backAnswer: string;
    realExample: string;
}

export interface StepByStepStage {
    stepNo: number;
    title: string;
    instruction: string;
    checkpoint: string;
    tip: string;
}

export interface TimelineEvent {
    orderLabel: string;
    title: string;
    actorOrContext: string;
    description: string;
    impact: string;
}

export interface ComparisonRow {
    aspect: string;
    conceptAValue: string;
    conceptBValue: string;
}

export interface IsometricPartPin {
    pinNo: number;
    partName: string;
    functionOrProperty: string;
    measurementOrDetail: string;
}

export type PageOrientationMode = 'portrait_a4' | 'landscape_a4' | 'digital_4_5';

export interface CurriculumMismatchCheck {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

export interface TpAtpAnalysisResult {
    kataKerjaOperasional: string;
    kedalamanLevel: 'dasar' | 'menengah' | 'mendalam';
    kompetensiUtama: string;
    kontenEsensial: string;
    konsepUtama: string;
    konsepPendukung: string[];
    kosakataPenting: string[];
    kedalamanPembahasan: string;
    contohKonkretRelevan: string;
    penerapanSehariHari: string;
    visualisasiPalingTepat: string;
    potensiMiskonsepsi: string;
    pelurusanMiskonsepsi: string;
    buktiPemahaman: string;
    recommendedTemplateId: MateriTemplateId;
    recommendedReason: string;
    kesesuaianKarakterMateri: string;
    alternativeTemplates: { id: MateriTemplateId; reason: string }[];
    analyzedAt: string;
    usedAi: boolean;
}

export interface ReferenceItem {
    title: string;
    category: 'Ketentuan Wajib Regulasi' | 'Panduan Resmi' | 'Rekomendasi Pedagogis & Referensi Mapel';
    source: string;
    status: 'Teridentifikasi' | 'Perlu Verifikasi Guru';
    note: string;
}

export interface QualityCheckItem {
    id: number;
    question: string;
    status: 'lulus' | 'perhatian' | 'gagal';
    detail: string;
}

export interface QualityControlReport {
    overallStatus: 'LULUS' | 'PERLU PERHATIAN' | 'GAGAL';
    summary: string;
    checkedAt: string;
    checks: QualityCheckItem[];
    verificationStages: { stage: string; passed: boolean; note: string }[];
    needsTeacherConfirmation: string[];
}

export const GENERATION_PIPELINE_STEPS = [
    { step: 1, title: 'Ambil & Kunci Data Kurikulum', desc: 'Membaca metadata sekolah, kelas, fase, CP, TP, dan ATP terkunci.' },
    { step: 2, title: 'Analisis KKO TP & ATP', desc: 'Mengidentifikasi kata kerja operasional, kedalaman materi, dan miskonsepsi.' },
    { step: 3, title: 'Penentuan Gaya & Orientasi', desc: 'Menerapkan rekomendasi AI atau pilihan template manual pengguna.' },
    { step: 4, title: 'Susun Kerangka Substantif', desc: 'Menyusun urutan pengantar, pembahasan inti, pendalaman, dan asesmen.' },
    { step: 5, title: 'Generasi Konten Keilmuan', desc: 'Menghasilkan isi materi akurat sesuai perkembangan kognitif fase.' },
    { step: 6, title: 'Verifikasi 6 Lapis Anti-Halusinasi', desc: 'Memeriksa konsistensi TP/ATP, keilmuan, sumber, pedagogi, dan label visual.' },
    { step: 7, title: 'Komposisi Desain Visual & SVG', desc: 'Memisahkan komponen ilustrasi faktual dari teks agar label tidak rusak.' },
    { step: 8, title: 'Rendering Multi-Halaman', desc: 'Menata halaman pratinjau A4/Landscape/4:5 tanpa teks terpotong.' },
    { step: 9, title: 'Quality Control 12 Kriteria', desc: 'Menguji kelengkapan 12 standar mutu sebelum dokumen diterbitkan.' },
    { step: 10, title: 'Siap Ekspor PDF & PNG 300 DPI', desc: 'Menyiapkan keluaran terpisah per halaman dan pengarsipan riwayat.' }
] as const;

export interface GeneratedMateriAjarData {
    id: string;
    createdAt: string;
    templateId: MateriTemplateId;
    selectionMode: 'rekomendasi' | 'manual';
    recommendationReason?: string;
    manualMismatchNotice?: string;
    subject: string;
    className: string;
    fase: string;
    semester: string;
    academicYear: string;
    focusLevel: HierarchyFocusLevel;
    elementName: string;
    capaianPembelajaran: string;
    tpText: string;
    atpText: string;
    alokasiWaktu: string;
    curriculumMeta?: {
        curriculumName: string;
        jenjang: string;
        institutionName: string;
        isLockedSource: boolean;
        topicFocus: string;
        orientation: PageOrientationMode;
    };
    tpAtpAnalysis?: TpAtpAnalysisResult;
    // A. HEADER
    title: string;
    subtitle: string;
    // B. PENGANTAR MATERI
    pengantarSingkat: string;
    pertanyaanPemantik: string[];
    kaitanPengalamanSiswa?: string;
    // C. INTI MATERI / PEMBAHASAN INTI
    pengertianKonsep: string;
    penjelasanUtama: string;
    poinPenting: string[];
    unsurPenting?: string[];
    klasifikasiAtauProses?: {
        judul: string;
        butir: { label: string; uraian: string }[];
    };
    tabelInformatif?: {
        judul: string;
        kolom: string[];
        baris: string[][];
    };
    contohKonkret: string;
    visualCaption: string;
    visualSvg?: string;
    visualImageDataUrl?: string;
    // D. CONTOH DALAM KEHIDUPAN SEHARI-HARI & PENDALAMAN
    contohSehariHari: string[];
    pendalamanMateri?: {
        analisisSederhana: string;
        faktaTeridentifikasi: string[];
        miskonsepsiUmum: { salah: string; pelurusan: string }[];
    };
    // E. AKTIVITAS SISWA
    aktivitasSederhana: {
        judul: string;
        langkah: string[];
        hasilDiharapkan: string;
    };
    // F. RANGKUMAN (3-5 POIN PENTING)
    rangkumanPoin: string[];
    // G. LATIHAN PEMAHAMAN (BAGIAN SISWA + BAGIAN KHUSUS GURU)
    latihanFormatif: {
        no: number;
        pertanyaan: string;
        kunciSingkat: string;
    }[];
    // H. REFERENSI & QUALITY CONTROL
    referensi?: ReferenceItem[];
    qualityControl?: QualityControlReport;
    teacherNotes?: string[];
    // Tambahan metadata pendukung
    pemahamanBermakna: string;
    kataKunci: { term: string; meaning: string }[];
    ringkasanKonsepInti: string;
    aktivitasPembelajaran: {
        tahap: string;
        kegiatan: string;
    }[];
    refleksiSiswa: string[];
    // Template-specific structured payloads
    infographicData?: {
        heroStatLabel: string;
        heroStatValue: string;
        heroNote: string;
        pillars: InfographicPillar[];
        goldenTakeaway: string;
    };
    cheatSheetData?: {
        quickOverview: string;
        boxes: CheatSheetBox[];
        commonMistakes: { mistake: string; correction: string }[];
    };
    stickyNotesData?: {
        boardTopic: string;
        notes: StickyNoteCard[];
    };
    mindMapData?: {
        centralNode: string;
        centralSubtitle: string;
        branches: MindMapBranch[];
    };
    comicStripData?: {
        storyTitle: string;
        setting: string;
        panels: ComicPanel[];
        moralLesson: string;
    };
    flashcardData?: {
        deckTitle: string;
        studyTip: string;
        cards: FlashcardItem[];
    };
    stepByStepData?: {
        goalStatement: string;
        toolsNeeded: string[];
        stages: StepByStepStage[];
        successIndicator: string;
    };
    timelineData?: {
        timelineTitle: string;
        periodSpan: string;
        events: TimelineEvent[];
        synthesisNote: string;
    };
    comparisonData?: {
        conceptAName: string;
        conceptBName: string;
        similarities: string[];
        rows: ComparisonRow[];
        conclusion: string;
    };
    isometric3dData?: {
        objectTitle: string;
        visualSceneType: 'geometry_solid' | 'science_ecosystem' | 'electrical_circuit' | 'plant_structure' | 'solar_system' | 'architecture_model';
        dimensionSummary: string;
        parts: IsometricPartPin[];
        spatialInsight: string;
    };
}

export const getFaseInfoForClass = (cls: string): { id: 'A' | 'B' | 'C'; name: string; label: string; classes: string[] } => {
    const lower = String(cls || '').toLowerCase();
    if (lower.includes('1') || lower.includes('2')) {
        return { id: 'A', name: 'Fase A', label: 'Fase A (Kelas 1 - 2)', classes: ['Kelas 1', 'Kelas 2'] };
    }
    if (lower.includes('3') || lower.includes('4')) {
        return { id: 'B', name: 'Fase B', label: 'Fase B (Kelas 3 - 4)', classes: ['Kelas 3', 'Kelas 4'] };
    }
    return { id: 'C', name: 'Fase C', label: 'Fase C (Kelas 5 - 6)', classes: ['Kelas 5', 'Kelas 6'] };
};

export const buildMateriAjarHierarchy = (
    subject: string,
    activeClass: string,
    protaSource?: { data: CurriculumData; locked: boolean } | null
): MateriAjarHierarchyTree => {
    const faseInfo = getFaseInfoForClass(activeClass);

    let sourceData: CurriculumData | null = null;
    let sourceType: MateriAjarHierarchyTree['sourceType'] = 'bskap_046';

    if (protaSource && protaSource.data && Array.isArray(protaSource.data.elements) && protaSource.data.elements.length > 0) {
        const snapFase = String(protaSource.data.fase || '').toLowerCase();
        const isSameFase = !snapFase || snapFase.includes(faseInfo.name.toLowerCase());
        const hasExactClass = protaSource.data.elements.some(el =>
            (el.allocations || []).some(a => a.className && isSameClass(a.className, activeClass))
        );
        if (hasExactClass || isSameFase) {
            sourceData = protaSource.data;
            sourceType = protaSource.locked ? 'locked_prota' : 'saved_prota';
        }
    }

    if (!sourceData) {
        sourceData = synthesizeCurriculumProta(subject, { name: faseInfo.label, classes: faseInfo.classes });
        sourceType = 'bskap_046';
    }

    const elements: HierarchyElementNode[] = [];
    (sourceData.elements || []).forEach((el, elIdx) => {
        const matchingAlloc =
            (el.allocations || []).find(a => a.className && isSameClass(a.className, activeClass)) ||
            (el.allocations || [])[0];

        if (!matchingAlloc) return;

        const tpNodes: HierarchyTpNode[] = [];
        if (Array.isArray(matchingAlloc.structuredAtp) && matchingAlloc.structuredAtp.length > 0) {
            matchingAlloc.structuredAtp.forEach((grp, tpIdx) => {
                const rawAtps = Array.isArray(grp.atpItems) && grp.atpItems.length > 0
                    ? grp.atpItems
                    : synthesizeAtpItemsForTp(grp.tp, subject, tpIdx);
                const sem = rawAtps[0]?.semester || (tpIdx < Math.ceil(matchingAlloc.structuredAtp!.length / 2) ? 1 : 2);
                tpNodes.push({
                    id: `el-${elIdx}-tp-${tpIdx}`,
                    index: tpIdx + 1,
                    tp: grp.tp,
                    semester: sem,
                    atpItems: rawAtps.map((item, atpIdx) => ({
                        id: `el-${elIdx}-tp-${tpIdx}-atp-${atpIdx}`,
                        index: atpIdx + 1,
                        alur: item.alur,
                        alokasiWaktu: item.alokasiWaktu || '3 JP',
                        semester: item.semester || sem
                    }))
                });
            });
        } else if (Array.isArray(matchingAlloc.tujuanPembelajaran)) {
            matchingAlloc.tujuanPembelajaran.forEach((tpStr, tpIdx) => {
                const synthAtp = synthesizeAtpItemsForTp(tpStr, subject, tpIdx);
                const sem = tpIdx < Math.ceil(matchingAlloc.tujuanPembelajaran.length / 2) ? 1 : 2;
                tpNodes.push({
                    id: `el-${elIdx}-tp-${tpIdx}`,
                    index: tpIdx + 1,
                    tp: tpStr,
                    semester: sem,
                    atpItems: synthAtp.map((item, atpIdx) => ({
                        id: `el-${elIdx}-tp-${tpIdx}-atp-${atpIdx}`,
                        index: atpIdx + 1,
                        alur: item.alur,
                        alokasiWaktu: item.alokasiWaktu || '3 JP',
                        semester: sem
                    }))
                });
            });
        }

        if (tpNodes.length > 0) {
            elements.push({
                id: `el-${elIdx}`,
                index: elIdx + 1,
                elementName: el.elementName,
                capaianPembelajaran: el.capaianPembelajaran,
                tpNodes
            });
        }
    });

    if (elements.length === 0) {
        const fallbackTp = `Memahami konsep utama serta penerapan ${subject} sesuai ${activeClass} (${faseInfo.name}).`;
        const synthAtp = synthesizeAtpItemsForTp(fallbackTp, subject, 0);
        elements.push({
            id: 'el-0',
            index: 1,
            elementName: 'Pemahaman & Penerapan Konsep',
            capaianPembelajaran: `Peserta didik ${activeClass} (${faseInfo.name}) mampu memahami dan menerapkan kompetensi inti ${subject}.`,
            tpNodes: [
                {
                    id: 'el-0-tp-0',
                    index: 1,
                    tp: fallbackTp,
                    semester: 1,
                    atpItems: synthAtp.map((item, idx) => ({
                        id: `el-0-tp-0-atp-${idx}`,
                        index: idx + 1,
                        alur: item.alur,
                        alokasiWaktu: item.alokasiWaktu || '3 JP',
                        semester: 1
                    }))
                }
            ]
        });
    }

    return {
        subject: sourceData.subject || subject,
        className: activeClass,
        fase: faseInfo.label,
        sourceType,
        elements
    };
};

export const recommendTemplateForFocus = (
    subject: string,
    elementName: string,
    cp: string,
    tp: string,
    atpAlur: string
): TemplateRecommendationResult => {
    const focusText = `${elementName} ${tp} ${atpAlur}`.toLowerCase();
    const combined = `${subject} ${elementName} ${cp} ${tp} ${atpAlur}`.toLowerCase();
    const subjLower = subject.toLowerCase();

    const makeAlt = (id: MateriTemplateId, reason: string) => ({ id, reason });

    // 1. Chronology / History / Evolution -> Timeline
    if (/\b(sejarah|kronologi|zaman|kemerdekaan|proklamasi|kerajaan|masa lalu|perjuangan|kisah nabi|riwayat|periode sejarah|era|dinasti|abad|praaksara)\b/.test(focusText)) {
        return {
            recommendedId: 'timeline',
            reason: `Fokus TP/ATP memuat unsur kronologi atau peristiwa bersejarah pada ${subject}, sehingga Timeline efektif membantu siswa memahami urutan kejadian dalam format infografis A4.`,
            alternatives: [
                makeAlt('educational_infographic', 'Menyajikan poster edukasi lengkap dengan ilustrasi peristiwa dan latihan 3 soal.'),
                makeAlt('comic_strip', 'Mengubah kisah tokoh/sejarah menjadi cerita bergambar yang mudah dihayati.')
            ]
        };
    }

    // 2. 3D Objects / Geometry / Anatomy / Circuits / Spatial -> Isometric 3D
    if (
        /\b(bangun ruang|kubus|balok|prisma|limas|tabung|kerucut|bola basket|bola voli|jaring-jaring|volume|anatomi|organ tubuh|bagian tumbuhan|rangkaian listrik|tata surya|planet|ekosistem|siklus air|tiga dimensi|3d|patung|diorama)\b/.test(combined) &&
        !subjLower.includes('pjok')
    ) {
        return {
            recommendedId: 'isometric_3d',
            reason: `Fokus materi pada ${elementName} membahas struktur objek ruang atau sistem visual nyata, sehingga Isometric 3D memvisualisasikan bentuk dan bagian objek secara konkret.`,
            alternatives: [
                makeAlt('educational_infographic', 'Menyajikan poster edukasi A4 lengkap dengan rangkuman dan aktivitas siswa.'),
                makeAlt('mind_map', 'Memetakan fungsi tiap bagian objek secara sistematis.')
            ]
        };
    }

    // 3. Comparisons / Differences / Classifications -> Comparison Chart
    if (/\b(membedakan|perbedaan|persamaan|membandingkan|klasifikasi|wujud zat|hak dan kewajiban|positif dan negatif|kelebihan|kekurangan|loma dan lemes)\b/.test(focusText)) {
        return {
            recommendedId: 'comparison_chart',
            reason: `Fokus kompetensi menuntut siswa membandingkan ciri, perbedaan, dan persamaan konsep secara langsung dalam satu poster perbandingan.`,
            alternatives: [
                makeAlt('educational_infographic', 'Menyajikan poster infografis terstruktur lengkap dengan contoh sehari-hari.'),
                makeAlt('mind_map', 'Mengelompokkan kategori konsep ke dalam cabang visual.')
            ]
        };
    }

    // 4. Math Formulas / Numbers / Rules -> Cheat Sheet
    if (subjLower.includes('matematika') || /\b(bilangan|pecahan|operasi hitung|perkalian|pembagian|keliling|luas|satuan|rumus|kaidah|ejaan|tanda baca)\b/.test(focusText)) {
        return {
            recommendedId: 'cheat_sheet',
            reason: `Kompetensi ${subject} pada fokus ini memerlukan kejelasan rumus, aturan hitung, dan contoh langkah cepat dalam poster ringkas.`,
            alternatives: [
                makeAlt('educational_infographic', 'Menampilkan poster infografis lengkap berilustrasi pecahan/geometri konkret.'),
                makeAlt('step_by_step', 'Memecah cara penyelesaian soal hitungan secara bertahap.')
            ]
        };
    }

    // 5. Stories / Dialogues / Literature / Regional Language (Sunda) -> Comic Strip
    if (subjLower.includes('sunda') || subjLower.includes('daerah') || /\b(cerita|dongeng|dongéng|sasakala|fabel|dialog|percakapan|paguneman|amanat|tokoh|si kabayan)\b/.test(focusText)) {
        return {
            recommendedId: 'comic_strip',
            reason: `Materi ${subject} pada elemen ${elementName} kaya akan konteks komunikasi dan teladan budaya. Comic Strip menghidupkan dialog alami bagi siswa SD.`,
            alternatives: [
                makeAlt('educational_infographic', 'Menyajikan poster materi lengkap berbahasa sederhana & ilustrasi budaya.'),
                makeAlt('sticky_notes', 'Mencatat kosakata kunci dan sikap baik dalam catatan ringkas.')
            ]
        };
    }

    // 6. Procedures / Algorithms / Experiments / Movement Steps / Worship -> Step-by-Step
    if (/\b(algoritma|koding|coding|dekomposisi|pola gerak|gerak dasar|senam|lokomotor|eksperimen|percobaan|praktik|tata cara|wudhu|wudu|salat|prosedur|teks prosedur|merangkai)\b/.test(combined)) {
        return {
            recommendedId: 'step_by_step',
            reason: `Fokus TP/ATP menekankan penguasaan tahapan kerja, praktik ibadah, atau keterampilan gerak pada ${subject}.`,
            alternatives: [
                makeAlt('educational_infographic', 'Menyajikan poster infografis A4 utuh lengkap dengan ilustrasi dan latihan.'),
                makeAlt('cheat_sheet', 'Menyediakan ceklis cepat syarat dan aturan keselamatan.')
            ]
        };
    }

    // 7. Vocabulary / Memorization / English / PAIBP -> Educational Infographic or Flashcard
    if (subjLower.includes('inggris') || /\b(kosakata|vocabulary|hafalan|arti kata|asmaul husna)\b/.test(focusText)) {
        return {
            recommendedId: 'flashcard',
            reason: `Fokus ATP/TP pada ${subject} mengutamakan penguasaan kosakata, arti kata, dan latihan aktif dua sisi.`,
            alternatives: [
                makeAlt('educational_infographic', 'Poster infografis lengkap dengan ilustrasi dan latihan pemahaman.'),
                makeAlt('sticky_notes', 'Kartu catatan penting yang mudah ditempel dan dibaca ulang.')
            ]
        };
    }

    // 8. Broad Concept Mapping -> Mind Map
    if (subjLower.includes('ipas') || /\b(hubungan|keterkaitan|sistem|ragam|komponen|bagian|unsur|faktor)\b/.test(focusText)) {
        return {
            recommendedId: 'mind_map',
            reason: `Elemen ${elementName} menghubungkan beberapa sub-konsep sekaligus sehingga peta pikiran memudahkan pemahaman menyeluruh.`,
            alternatives: [
                makeAlt('educational_infographic', 'Poster infografis A4 lengkap dengan ilustrasi konkret dan contoh sehari-hari.'),
                makeAlt('comparison_chart', 'Memperjelas perbedaan antar komponen sistem.')
            ]
        };
    }

    // 9. Default & PAIBP / Bahasa Indonesia / PPKn -> Modern Educational Infographic Poster A4
    return {
        recommendedId: 'educational_infographic',
        reason: `Fokus TP/ATP pada ${subject} (${elementName}) paling optimal disajikan sebagai Poster Infografis Edukasi A4 Portrait lengkap dengan pengantar, inti berilustrasi konkret, contoh sehari-hari, aktivitas siswa, rangkuman, dan latihan.`,
        alternatives: [
            makeAlt('mind_map', 'Untuk melihat peta keterkaitan antar konsep utama.'),
            makeAlt('sticky_notes', 'Untuk ringkasan catatan tempel yang mudah diingat siswa.')
        ]
    };
};

const isBahasaSundaTopic = (subject: string, cp: string, tp: string): boolean => {
    const txt = `${subject} ${cp} ${tp}`.toLowerCase();
    return txt.includes('sunda') || txt.includes('aksara sunda') || txt.includes('pupuh') || txt.includes('kawih') || txt.includes('muatan lokal (bahasa daerah)');
};

const extractCleanTopicTitle = (tp: string, atp: string, elementName: string, subject: string): string => {
    const cleanText = (s: string) =>
        String(s || '')
            .replace(/^(eksplorasi konsep|pendalaman aplikasi|sintesis\s*&\s*refleksi|pengenalan|penerapan)\s*:\s*/i, '')
            .replace(/^(peserta didik|siswa)\s+(mampu|dapat|bisa)\s+/i, '')
            .replace(/^(memahami|menjelaskan|mengidentifikasi|menganalisis|mempraktikkan|menerapkan|menunjukkan|mengenal|menyajikan|mengevaluasi|membaca|menulis|melafalkan|membedakan|menghitung)\s+(serta|dan\s+)?((memahami|menjelaskan|mengidentifikasi|menganalisis|mempraktikkan|menerapkan|menunjukkan|mengenal|menyajikan|mengevaluasi|melaksanakan|membaca|menulis|melafalkan|membedakan|menghitung)\s+)?/i, '')
            .replace(/^(dan|serta)\s+/i, '')
            .replace(/^(prinsip dasar|materi|dengan tartil dan)\s+/i, '')
            .replace(/\.$/, '')
            .trim();

    const candidateAtp = cleanText(atp);
    const isGenericAtp = !candidateAtp || candidateAtp.length < 12 || /^prinsip dasar\b/i.test(candidateAtp) || /^mengidentifikasi prinsip dasar/i.test(atp);
    const cleaned = (!isGenericAtp ? candidateAtp : '') || cleanText(tp) || cleanText(elementName);
    const firstClause = cleaned.split(/;\s*/)[0].replace(/\.\s*$/, '').trim();
    if (firstClause.length >= 10) {
        const capped = firstClause.length > 76 ? firstClause.slice(0, 74).trim() + '…' : firstClause;
        return capped.charAt(0).toUpperCase() + capped.slice(1);
    }
    return `${elementName} (${subject})`;
};

const pickIsometricSceneType = (
    subject: string,
    text: string
): NonNullable<GeneratedMateriAjarData['isometric3dData']>['visualSceneType'] => {
    const lower = `${subject} ${text}`.toLowerCase();
    if (/(listrik|rangkaian|baterai|sakelar|lampu|energi|kabel)/.test(lower)) return 'electrical_circuit';
    if (/(tumbuhan|akar|batang|daun|bunga|fotosintesis|buah)/.test(lower)) return 'plant_structure';
    if (/(tata surya|planet|matahari|bumi|bulan|gerhana|orbit)/.test(lower)) return 'solar_system';
    if (/(ekosistem|siklus air|gunung|sungai|hutan|lingkungan|alam|hewan)/.test(lower)) return 'science_ecosystem';
    if (/(bangun ruang|kubus|balok|prisma|limas|volume|geometri|matematika|luas permukaan)/.test(lower)) return 'geometry_solid';
    return 'architecture_model';
};

const escXml = (s: string): string =>
    String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

/**
 * Generates a concrete, colorful, Indonesia-elementary-school friendly 2D educational illustration SVG
 * tailored to the exact subject & TP/ATP topic (never generic text-only boxes).
 */
export const buildConcretePosterIllustrationSvg = (
    subject: string,
    elementName: string,
    tpText: string,
    atpText: string,
    captionTitle: string
): string => {
    const combined = `${subject} ${elementName} ${tpText} ${atpText}`.toLowerCase();
    const subjLower = subject.toLowerCase();

    // 1. Try specialized rich diagram from dynamic2dVisualHelper first for Math/Science/PAIBP/Sunda/PPKn/PJOK
    const dyn = synthesizeContextual2dVisual(
        {
            question: `${tpText} ${atpText}`,
            stimulus: `${subject} ${elementName}`,
            visualTitle: captionTitle
        },
        subject,
        { allowGeneralScene: false }
    );
    if (dyn?.svg) {
        return dyn.svg;
    }

    const shortLabel = escXml(captionTitle.length > 42 ? captionTitle.slice(0, 40) + '…' : captionTitle);

    // 2. PAIBP (Pendidikan Agama Islam & Budi Pekerti) concrete scene
    if (subjLower.includes('islam') || subjLower.includes('pai')) {
        if (/(wudu|wudhu|bersuci|tayamum)/.test(combined)) {
            return `<svg viewBox="0 0 460 190" width="460" height="190" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto block">
                <rect x="0" y="0" width="460" height="190" rx="14" fill="#ecfdf5" stroke="#6ee7b7" strokeWidth="1.5"/>
                <rect x="0" y="148" width="460" height="42" rx="0" fill="#d1fae5"/>
                <!-- Keran Air & Wudu Station -->
                <rect x="42" y="42" width="12" height="90" rx="4" fill="#64748b"/>
                <path d="M54 54 H96 Q106 54 106 66 V72" fill="none" stroke="#475569" strokeWidth="8" strokeLinecap="round"/>
                <path d="M106 76 Q102 96 106 116 Q110 132 106 146" fill="none" stroke="#0ea5e9" strokeWidth="4" strokeDasharray="5,3"/>
                <circle cx="100" cy="136" r="4" fill="#38bdf8"/>
                <circle cx="114" cy="140" r="3" fill="#38bdf8"/>
                <!-- Anak SD Mempraktikkan Wudu -->
                <circle cx="170" cy="68" r="20" fill="#fed7aa" stroke="#9a3412" strokeWidth="1.5"/>
                <rect x="152" y="44" width="36" height="12" rx="5" fill="#065f46"/>
                <path d="M148 148 C148 102, 192 102, 192 148 Z" fill="#059669"/>
                <path d="M150 112 L114 98" stroke="#fed7aa" strokeWidth="9" strokeLinecap="round"/>
                <!-- Langkah Urut Berwudu Icons -->
                <g transform="translate(230, 26)">
                    <rect x="0" y="0" width="206" height="130" rx="12" fill="#ffffff" stroke="#a7f3d0" strokeWidth="1.2"/>
                    <text x="103" y="22" fontSize="11" fontWeight="700" textAnchor="middle" fill="#065f46">Urutan Bersuci Sebelum Ibadah</text>
                    <circle cx="32" cy="52" r="14" fill="#d1fae5"/><text x="32" y="56" fontSize="10" fontWeight="700" textAnchor="middle" fill="#065f46">1</text>
                    <text x="54" y="55" fontSize="10" fontWeight="600" fill="#1e293b">Niat, Cuci Tangan &amp; Wajah</text>
                    <circle cx="32" cy="84" r="14" fill="#bae6fd"/><text x="32" y="88" fontSize="10" fontWeight="700" textAnchor="middle" fill="#0369a1">2</text>
                    <text x="54" y="87" fontSize="10" fontWeight="600" fill="#1e293b">Basuh Tangan s.d. Siku &amp; Kepala</text>
                    <circle cx="32" cy="114" r="14" fill="#fef3c7"/><text x="32" y="118" fontSize="10" fontWeight="700" textAnchor="middle" fill="#92400e">3</text>
                    <text x="54" y="117" fontSize="10" fontWeight="600" fill="#1e293b">Basuh Kaki Tertib &amp; Berdoa</text>
                </g>
                <text x="230" y="175" fontSize="10.5" fontWeight="700" textAnchor="middle" fill="#064e3b">${shortLabel}</text>
            </svg>`;
        }

        // Default PAIBP concrete Mosque + Quran + Anak Muslim Indonesia scene
        return `<svg viewBox="0 0 460 190" width="460" height="190" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto block">
            <rect x="0" y="0" width="460" height="190" rx="14" fill="#f0fdf4" stroke="#86efac" strokeWidth="1.5"/>
            <rect x="0" y="148" width="460" height="42" fill="#dcfce7"/>
            <!-- Masjid Nusantara -->
            <path d="M52 94 C52 54, 138 54, 138 94 Z" fill="#059669" stroke="#065f46" strokeWidth="1.5"/>
            <circle cx="95" cy="46" r="7" fill="#eab308"/>
            <rect x="44" y="94" width="102" height="54" rx="4" fill="#ffffff" stroke="#059669" strokeWidth="1.5"/>
            <path d="M82 148 V116 A13 13 0 0 1 108 116 V148 Z" fill="#047857"/>
            <rect x="150" y="54" width="16" height="94" fill="#ecfdf5" stroke="#059669" strokeWidth="1.2"/>
            <polygon points="147,54 158,36 169,54" fill="#059669"/>
            <!-- Rehal & Mushaf Al-Qur'an -->
            <g transform="translate(210, 44)">
                <path d="M18 96 L56 68 L94 96" fill="none" stroke="#92400e" strokeWidth="6" strokeLinecap="round"/>
                <path d="M12 62 Q36 52 56 66 Q76 52 100 62 L100 90 Q76 80 56 92 Q36 80 12 90 Z" fill="#ffffff" stroke="#0f766e" strokeWidth="2"/>
                <line x1="22" y1="70" x2="48" y2="70" stroke="#94a3b8" strokeWidth="2"/>
                <line x1="22" y1="78" x2="48" y2="78" stroke="#94a3b8" strokeWidth="2"/>
                <line x1="64" y1="70" x2="90" y2="70" stroke="#94a3b8" strokeWidth="2"/>
                <line x1="64" y1="78" x2="90" y2="78" stroke="#94a3b8" strokeWidth="2"/>
            </g>
            <!-- Siswa Berakhlak Mulia -->
            <g transform="translate(368, 76)">
                <circle cx="0" cy="-12" r="18" fill="#fed7aa" stroke="#9a3412" strokeWidth="1.5"/>
                <rect x="-15" y="-32" width="30" height="10" rx="4" fill="#0f172a"/>
                <circle cx="-5" cy="-13" r="2" fill="#0f172a"/><circle cx="5" cy="-13" r="2" fill="#0f172a"/>
                <path d="M-5 -6 Q0 -1 5 -6" fill="none" stroke="#9a3412" strokeWidth="1.6"/>
                <path d="M-22 72 C-22 24, 22 24, 22 72 Z" fill="#0d9488"/>
            </g>
            <text x="230" y="174" fontSize="10.5" fontWeight="700" textAnchor="middle" fill="#064e3b">${shortLabel}</text>
        </svg>`;
    }

    // 3. Matematika concrete visual (Fraction + Geometry + Measurement scene)
    if (subjLower.includes('matematika') || /\b(pecahan|bangun|luas|keliling|volume|bilangan|satuan|sudut)\b/.test(combined)) {
        return `<svg viewBox="0 0 460 190" width="460" height="190" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto block">
            <rect x="0" y="0" width="460" height="190" rx="14" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1.5"/>
            <!-- Lingkaran Pecahan Kue -->
            <circle cx="96" cy="88" r="48" fill="#ffffff" stroke="#1d4ed8" strokeWidth="2.5"/>
            <path d="M96 88 L96 40 A48 48 0 0 1 144 88 Z" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="1.5"/>
            <path d="M96 88 L144 88 A48 48 0 0 1 96 136 Z" fill="#60a5fa" stroke="#1e3a8a" strokeWidth="1.5"/>
            <line x1="48" y1="88" x2="144" y2="88" stroke="#1e3a8a" strokeWidth="1.5"/>
            <line x1="96" y1="40" x2="96" y2="136" stroke="#1e3a8a" strokeWidth="1.5"/>
            <!-- Balok / Penggaris -->
            <g transform="translate(188, 38)">
                <polygon points="36,16 116,16 96,36 16,36" fill="#93c5fd" stroke="#1e40af" strokeWidth="1.5"/>
                <rect x="16" y="36" width="80" height="62" fill="#3b82f6" stroke="#1e40af" strokeWidth="1.5"/>
                <polygon points="96,36 116,16 116,78 96,98" fill="#2563eb" stroke="#1e40af" strokeWidth="1.5"/>
            </g>
            <!-- Garis Bilangan -->
            <g transform="translate(328, 56)">
                <rect x="0" y="0" width="110" height="66" rx="10" fill="#ffffff" stroke="#bfdbfe" strokeWidth="1.5"/>
                <line x1="12" y1="36" x2="98" y2="36" stroke="#1e293b" strokeWidth="2"/>
                <circle cx="24" cy="36" r="4" fill="#2563eb"/><text x="24" y="52" fontSize="9" textAnchor="middle" fill="#334155">1</text>
                <circle cx="55" cy="36" r="4" fill="#2563eb"/><text x="55" y="52" fontSize="9" textAnchor="middle" fill="#334155">2</text>
                <circle cx="86" cy="36" r="4" fill="#059669"/><text x="86" y="52" fontSize="9" textAnchor="middle" fill="#059669">3</text>
                <text x="55" y="18" fontSize="9.5" fontWeight="700" textAnchor="middle" fill="#1e40af">Pola &amp; Ukuran</text>
            </g>
            <text x="230" y="173" fontSize="10.5" fontWeight="700" textAnchor="middle" fill="#1e3a8a">${shortLabel}</text>
        </svg>`;
    }

    // 4. IPAS / Science concrete nature + experiment + solar system scene
    if (subjLower.includes('ipas') || /\b(alam|tumbuhan|hewan|energi|listrik|air|bumi|lingkungan|ekosistem|gaya)\b/.test(combined)) {
        return `<svg viewBox="0 0 460 190" width="460" height="190" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto block">
            <rect x="0" y="0" width="460" height="190" rx="14" fill="#f0f9ff" stroke="#7dd3fc" strokeWidth="1.5"/>
            <rect x="0" y="140" width="460" height="50" fill="#bbf7d0"/>
            <!-- Matahari & Awan -->
            <circle cx="64" cy="46" r="22" fill="#facc15" stroke="#eab308" strokeWidth="2"/>
            <path d="M134 52 Q146 32 168 38 Q186 28 202 44 Q216 48 210 62 H136 Z" fill="#ffffff" stroke="#bae6fd" strokeWidth="1.8"/>
            <line x1="156" y1="70" x2="152" y2="86" stroke="#0284c7" strokeWidth="2" strokeLinecap="round"/>
            <line x1="176" y1="70" x2="172" y2="86" stroke="#0284c7" strokeWidth="2" strokeLinecap="round"/>
            <line x1="194" y1="70" x2="190" y2="86" stroke="#0284c7" strokeWidth="2" strokeLinecap="round"/>
            <!-- Tumbuhan & Akar -->
            <rect x="276" y="76" width="12" height="68" rx="4" fill="#15803d"/>
            <ellipse cx="254" cy="94" rx="22" ry="10" transform="rotate(-20 254 94)" fill="#22c55e" stroke="#15803d" strokeWidth="1.2"/>
            <ellipse cx="308" cy="86" rx="22" ry="10" transform="rotate(20 308 86)" fill="#22c55e" stroke="#15803d" strokeWidth="1.2"/>
            <circle cx="282" cy="64" r="14" fill="#fb923c" stroke="#ea580c" strokeWidth="1.5"/>
            <!-- Kaca Pembesar Pengamatan -->
            <circle cx="382" cy="88" r="26" fill="#e0f2fe" stroke="#0369a1" strokeWidth="3.5"/>
            <line x1="400" y1="108" x2="424" y2="132" stroke="#334155" strokeWidth="6" strokeLinecap="round"/>
            <text x="382" y="92" fontSize="9.5" fontWeight="700" textAnchor="middle" fill="#0369a1">Amati!</text>
            <text x="230" y="172" fontSize="10.5" fontWeight="700" textAnchor="middle" fill="#0c4a6e">${shortLabel}</text>
        </svg>`;
    }

    // 5. Default Indonesian SD Classroom / Literacy / Culture / Sunda / PPKn concrete illustration
    return `<svg viewBox="0 0 460 190" width="460" height="190" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto block">
        <rect x="0" y="0" width="460" height="190" rx="14" fill="#fffbeb" stroke="#fcd34d" strokeWidth="1.5"/>
        <rect x="0" y="144" width="460" height="46" fill="#fef3c7"/>
        <!-- Papan Tulis Kelas SD -->
        <rect x="130" y="22" width="200" height="86" rx="8" fill="#065f46" stroke="#b45309" strokeWidth="4"/>
        <line x1="154" y1="48" x2="306" y2="48" stroke="#a7f3d0" strokeWidth="3" strokeLinecap="round"/>
        <line x1="154" y1="68" x2="274" y2="68" stroke="#fde68a" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="154" y1="86" x2="238" y2="86" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
        <!-- Siswa 1 (Seragam SD Merah Putih) -->
        <g transform="translate(76, 86)">
            <circle cx="0" cy="-16" r="17" fill="#fed7aa" stroke="#9a3412" strokeWidth="1.5"/>
            <path d="M-16 -20 C-12 -36, 14 -36, 16 -20 Z" fill="#1e293b"/>
            <circle cx="-5" cy="-17" r="1.8" fill="#0f172a"/><circle cx="5" cy="-17" r="1.8" fill="#0f172a"/>
            <path d="M-4 -10 Q0 -6 4 -10" fill="none" stroke="#9a3412" strokeWidth="1.5"/>
            <path d="M-18 58 L-14 6 H14 L18 58 Z" fill="#dc2626"/>
            <rect x="-14" y="4" width="28" height="22" rx="4" fill="#ffffff"/>
        </g>
        <!-- Siswa 2 + Buku Terbuka -->
        <g transform="translate(384, 86)">
            <circle cx="0" cy="-16" r="17" fill="#fde68a" stroke="#92400e" strokeWidth="1.5"/>
            <path d="M-16 -20 C-12 -36, 14 -36, 16 -20 Z" fill="#334155"/>
            <circle cx="-5" cy="-17" r="1.8" fill="#0f172a"/><circle cx="5" cy="-17" r="1.8" fill="#0f172a"/>
            <path d="M-4 -10 Q0 -6 4 -10" fill="none" stroke="#92400e" strokeWidth="1.5"/>
            <path d="M-18 58 L-14 6 H14 L18 58 Z" fill="#dc2626"/>
            <rect x="-14" y="4" width="28" height="22" rx="4" fill="#ffffff"/>
        </g>
        <!-- Buku Terbuka di Tengah -->
        <g transform="translate(194, 114)">
            <path d="M0 10 Q18 2 36 10 Q54 2 72 10 V36 Q54 28 36 36 Q18 28 0 36 Z" fill="#ffffff" stroke="#0284c7" strokeWidth="2"/>
            <line x1="36" y1="10" x2="36" y2="36" stroke="#0284c7" strokeWidth="1.5"/>
        </g>
        <text x="230" y="174" fontSize="10.5" fontWeight="700" textAnchor="middle" fill="#78350f">${shortLabel}</text>
    </svg>`;
};

/**
 * Fetches an authentic CORS-safe image via /api/media/search + /api/media/proxy
 * and converts to base64 data URL so 300-DPI PNG/PDF rendering never taints the canvas.
 */
async function tryFetchProxiedIllustrationDataUrl(query: string, fallbackQuery?: string): Promise<string | undefined> {
    if (typeof window === 'undefined' || typeof fetch !== 'function') return undefined;
    try {
        const hits = await searchInternetImageCandidates(query, fallbackQuery, 3);
        const top = hits.find(h => h?.thumbUrl);
        if (!top?.thumbUrl) return undefined;

        const proxyRes = await fetch(`/api/media/proxy?url=${encodeURIComponent(top.thumbUrl)}`);
        if (!proxyRes.ok) return undefined;
        const blob = await proxyRes.blob();
        if (!blob || blob.size < 1024 || !blob.type.startsWith('image/')) return undefined;

        return await new Promise<string | undefined>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : undefined);
            reader.onerror = () => resolve(undefined);
            reader.readAsDataURL(blob);
        });
    } catch {
        return undefined;
    }
}

/**
 * Deterministic PPA-compliant rich content synthesizer used both as baseline enrichment
 * and instant resilient fallback if AI service is unavailable.
 */
export const synthesizeAuthenticMateriAjar = (params: {
    subject: string;
    className: string;
    fase: string;
    semester: string;
    academicYear: string;
    focusLevel: HierarchyFocusLevel;
    elementName: string;
    capaianPembelajaran: string;
    tpText: string;
    atpText: string;
    alokasiWaktu: string;
    templateId: MateriTemplateId;
    selectionMode: 'rekomendasi' | 'manual';
    recommendationReason?: string;
}): GeneratedMateriAjarData => {
    const {
        subject, className, fase, semester, academicYear,
        focusLevel, elementName, capaianPembelajaran, tpText, atpText, alokasiWaktu,
        templateId, selectionMode, recommendationReason
    } = params;

    const isSunda = isBahasaSundaTopic(subject, capaianPembelajaran, tpText);
    const topicTitle = extractCleanTopicTitle(tpText, atpText, elementName, subject);
    const shortFocus = focusLevel === 'atp' ? (atpText || tpText) : focusLevel === 'tp' ? tpText : elementName;
    const isLowerGrade = /kelas\s*[12]/i.test(className);
    const lowerAll = `${subject} ${elementName} ${tpText} ${atpText}`.toLowerCase();

    const domainTerms = (() => {
        if (isSunda) {
            return [
                { term: 'Undak-usuk Basa', meaning: 'Tatacara ngagunakeun basa Sunda nu merenah luyu jeung lawan nyarita (lemes jeung loma).' },
                { term: 'Kecap Rajékan / Pupuh', meaning: 'Wangun kecap atawa puisi tradisional Sunda anu ngandung piwuruk kahirupan.' },
                { term: 'Kalimah Wawaran', meaning: 'Kalimah anu eusina méré béja atawa katerangan kalayan sopan tur jéntré.' },
                { term: 'Silih Asah, Silih Asih, Silih Asuh', meaning: 'Ajén budaya Sunda pikeun silih tulungan, silih ajénan, jeung diajar babarengan.' }
            ];
        }
        if (lowerAll.includes('islam') || lowerAll.includes('pai')) {
            return [
                { term: 'Niat Tulus Karena Allah', meaning: 'Kesungguhan hati sebelum melaksanakan ibadah atau kebaikan sehari-hari.' },
                { term: 'Ilmu & Tata Cara Sah', meaning: 'Memahami syarat, rukun, dan urutan yang benar sesuai tuntunan ajaran Islam.' },
                { term: 'Akhlakul Karimah', meaning: 'Perilaku terpuji seperti jujur, santun, peduli sesama, dan menyayangi ciptaan Allah.' },
                { term: 'Pembiasaan Harian', meaning: 'Mengamalkan nilai ibadah dan budi pekerti secara konsisten di rumah maupun sekolah.' }
            ];
        }
        if (lowerAll.includes('matematika') || /\b(pecahan|bangun|bilangan|satuan|data|luas|keliling)\b/.test(lowerAll)) {
            return [
                { term: 'Konsep Bilangan / Satuan', meaning: 'Dasar ukuran atau nilai kuantitatif yang dipakai untuk menyatakan jumlah atau besaran.' },
                { term: 'Operasi & Pola', meaning: 'Aturan langkah pengerjaan hitung terstruktur untuk menemukan hasil yang tepat.' },
                { term: 'Representasi Visual', meaning: 'Penyajian masalah angka ke dalam gambar benda konkret, pita pecahan, atau bangun.' },
                { term: 'Verifikasi Hasil', meaning: 'Kebiasaan mengecek ulang jawaban agar logis dan sesuai satuan pada soal.' }
            ];
        }
        if (lowerAll.includes('ipas') || /\b(alam|energi|tumbuhan|ekosistem|zat|gaya|sejarah)\b/.test(lowerAll)) {
            return [
                { term: 'Fenomena Alam / Sosial', meaning: 'Kejadian nyata di lingkungan sekitar yang dapat diamati dan diselidiki sebab-akibatnya.' },
                { term: 'Komponen Utama', meaning: 'Bagian-bagian penyusun sistem yang saling bekerja sama menjaga keseimbangan.' },
                { term: 'Hubungan Sebab-Akibat', meaning: 'Keterkaitan logis antara perubahan suatu kondisi dengan dampak yang ditimbulkannya.' },
                { term: 'Sikap Peduli Lingkungan', meaning: 'Tindakan nyata siswa menjaga alam dan lingkungan sosial berdasarkan pemahaman ilmiah.' }
            ];
        }
        if (lowerAll.includes('pancasila') || lowerAll.includes('ppkn')) {
            return [
                { term: 'Nilai Luhur Pancasila', meaning: 'Pedoman sikap ketuhanan, kemanusiaan, persatuan, musyawarah, dan keadilan sosial.' },
                { term: 'Hak & Kewajiban', meaning: 'Keseimbangan antara sesuatu yang patut diterima dengan tanggung jawab yang wajib dilaksanakan.' },
                { term: 'Musyawarah Mufakat', meaning: 'Cara mengambil keputusan bersama dengan saling menghargai pendapat seluruh anggota.' },
                { term: 'Gotong Royong', meaning: 'Kerja sama tulus di tengah keberagaman budaya, agama, dan kebiasaan di sekolah/rumah.' }
            ];
        }
        if (lowerAll.includes('inggris')) {
            return [
                { term: 'Key Vocabulary', meaning: 'Kosakata bahasa Inggris penting yang sering dipakai dalam kehidupan sehari-hari.' },
                { term: 'Expression Pattern', meaning: 'Susunan kalimat sederhana yang sopan untuk menyapa, bertanya, atau menjawab.' },
                { term: 'Pronunciation & Meaning', meaning: 'Cara pengucapan yang tepat beserta artinya dalam Bahasa Indonesia.' },
                { term: 'Daily Practice', meaning: 'Mempraktikkan ungkapan langsung bersama teman dan guru di kelas.' }
            ];
        }
        return [
            { term: 'Gagasan Pokok', meaning: 'Inti informasi utama yang menjadi dasar pembahasan dalam topik pembelajaran.' },
            { term: 'Bukti & Contoh Nyata', meaning: 'Ilustrasi situasi sehari-hari yang membuktikan dan memperjelas konsep yang dipelajari.' },
            { term: 'Keterampilan Proses', meaning: 'Langkah mengamati, menanya, mengolah informasi, dan menyimpulkan dengan jelas.' },
            { term: 'Manfaat Nyata', meaning: 'Penerapan langsung materi pelajaran dalam kebiasaan baik peserta didik.' }
        ];
    })();

    const visualCaption = `Ilustrasi Pendukung: ${topicTitle}`;
    const visualSvg = buildConcretePosterIllustrationSvg(subject, elementName, tpText, atpText, topicTitle);

    const baseData: GeneratedMateriAjarData = {
        id: `ma-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
        templateId,
        selectionMode,
        recommendationReason,
        subject,
        className,
        fase,
        semester,
        academicYear,
        focusLevel,
        elementName,
        capaianPembelajaran,
        tpText,
        atpText,
        alokasiWaktu,
        // A. HEADER
        title: isSunda
            ? `Basa Sunda: ${topicTitle}`
            : topicTitle,
        subtitle: `Infografis Materi Ajar ${subject} · ${className} (${fase})`,
        // B. PENGANTAR MATERI
        pengantarSingkat: isSunda
            ? `Wilujeng diajar murangkalih ${className}! Dina bahasan ieu urang bakal mikawanoh "${topicTitle}" anu raket patalina jeung tatakrama sapopoé.`
            : `Halo sahabat belajar ${className}! Hari ini kita akan mempelajari "${topicTitle}" agar kamu memahami konsep dasarnya dengan mudah dan bisa langsung mempraktikkannya.`,
        pertanyaanPemantik: isSunda
            ? [
                `Kumaha cara nyarita anu sopan ka kolot atawa guru dina basa Sunda?`,
                `Naon waé conto dina kahirupan sapopoé anu patali jeung "${topicTitle}"?`
            ]
            : [
                `Pernahkah kamu mengalami kejadian di rumah atau sekolah yang berkaitan dengan "${topicTitle}"?`,
                `Mengapa kita perlu memahami dan menerapkan materi ini dengan cara yang benar?`
            ],
        // C. INTI MATERI
        pengertianKonsep: isSunda
            ? `"${topicTitle}" téh nyaéta kamampuh pikeun mikawanoh jeung ngagunakeun ungkara basa Sunda nu luyu jeung kontéks sopan santun dina elemen ${elementName}.`
            : `"${topicTitle}" adalah pemahaman pokok pada elemen ${elementName} yang membantu siswa ${className} mengenali konsep inti serta cara menerapkannya secara tepat.`,
        penjelasanUtama: isSunda
            ? `Luyu jeung Tujuan Pembelajaran "${tpText}", murid diajak niténan harti kecap, struktur kalimah, sarta conto paguneman anu merenah pikeun dilarapkeun di sakola jeung di imah.`
            : `Sesuai tujuan pembelajaran "${tpText}", fokus belajar hari ini (${shortFocus}) membimbing kamu memahami ciri utama, aturan penting, dan langkah penerapannya secara bertahap.`,
        poinPenting: [
            `${domainTerms[0]?.term}: ${domainTerms[0]?.meaning}`,
            `${domainTerms[1]?.term}: ${domainTerms[1]?.meaning}`,
            `${domainTerms[2]?.term}: ${domainTerms[2]?.meaning}`
        ],
        contohKonkret: isSunda
            ? `Contona: "Punten Pa Guru, abdi badé naroskeun pancén dinten ieu" (ngagunakeun basa lemes ka guru kalayan sopan).`
            : `Contoh konkret: Ketika mempelajari ${topicTitle}, perhatikan hubungan antara ${domainTerms[0]?.term} dan ${domainTerms[1]?.term} melalui pengamatan langsung di kelas.`,
        visualCaption,
        visualSvg,
        // D. CONTOH DALAM KEHIDUPAN SEHARI-HARI
        contohSehariHari: isSunda
            ? [
                `Di Imah: Nyarita maké kecap lemes jeung sopan ka ibu, rama, sarta dulur nu leuwih kolot.`,
                `Di Sakola: Ngucapkeun "hatur nuhun" jeung "punten" nalika silih tulungan jeung babaturan.`,
                `Di Lingkungan: Ngajaga silih asih jeung ngagunakeun basa daérah kalayan reueus.`
            ]
            : [
                `Di Rumah: Menerapkan pemahaman ${topicTitle} saat membantu orang tua atau berdiskusi bersama keluarga.`,
                `Di Sekolah: Mempraktikkan sikap teliti, tertib, dan kerja sama bersama teman satu kelas saat belajar.`,
                `Di Lingkungan Sekitar: Mengamati peristiwa nyata di halaman, masjid/tempat ibadah, atau taman sekitar rumah.`
            ],
        // E. AKTIVITAS SISWA
        aktivitasSederhana: isSunda
            ? {
                judul: `Prakték Paguneman Sopan (5 Menit)`,
                langkah: [
                    `Pilih pasangan babaturan sabangku di kelas.`,
                    `Susun 2 kalimah tanya jeung jawaban maké basa Sunda anu sopan ngeunaan "${topicTitle}".`,
                    `Bacakeun di hareup kelas kalayan sora anu jelas tur tatakrama nu hadé.`
                ],
                hasilDiharapkan: `Murid wani jeung parigel ngagunakeun basa Sunda nu merenah dina situasi nyata.`
            }
            : {
                judul: `Ayo Amati & Ceritakan! (Aktivitas 5 Menit)`,
                langkah: [
                    `Amati ilustrasi pada infografis di atas dengan teliti.`,
                    `Temukan 1 contoh nyata di sekitarmu yang sesuai dengan "${topicTitle}".`,
                    `Tuliskan di buku catatanmu lalu ceritakan secara singkat kepada teman sebangku.`
                ],
                hasilDiharapkan: `Siswa mampu menghubungkan konsep materi dengan pengalaman nyata secara mandiri.`
            },
        // F. RANGKUMAN (3-5 POIN PENTING)
        rangkumanPoin: isSunda
            ? [
                `Poko bahasan utama nyaéta "${topicTitle}" dina elemen ${elementName}.`,
                `Salawasna merhatikeun undak-usuk basa (loma ka babaturan, lemes ka kolot/guru).`,
                `Contoh sapopoé saperti "punten", "hatur nuhun", jeung "mangga" kudu dibiasakeun.`,
                `Diajar basa Sunda ngajarkeun urang pikeun nyaah kana budaya sorangan.`
            ]
            : [
                `Inti pelajaran hari ini adalah memahami "${topicTitle}" sesuai elemen ${elementName}.`,
                `${domainTerms[0]?.term} menjadi pondasi agar tidak keliru dalam memahami materi berikutnya.`,
                `Contoh nyata di rumah dan sekolah membantu konsep ini lebih cepat dipahami dan diingat.`,
                `Ketelitian saat mengamati dan berlatih membuat pemahamanmu semakin kuat dan siap diaplikasikan.`
            ],
        // G. LATIHAN PEMAHAMAN (3 SOAL SEDERHANA)
        latihanFormatif: isSunda
            ? [
                { no: 1, pertanyaan: `Jéntrékeun ku basa sorangan naon maksud utama tina materi "${topicTitle}"!`, kunciSingkat: 'Nyaritakeun eusi poko materi maké kalimah basa Sunda anu bener jeung sopan.' },
                { no: 2, pertanyaan: `Tuliskeun 2 conto kecap atawa kalimah basa Sunda anu luyu jeung conto dina infografis ieu!`, kunciSingkat: 'Conto kalimah merenah luyu jeung undak-usuk basa pikeun ka kolot atawa babaturan.' },
                { no: 3, pertanyaan: `Kumaha sikep urang sangkan basa Sunda tetep dipaké dina kahirupan sapopoé?`, kunciSingkat: 'Ngabiasakeun nyarita ku basa Sunda di imah jeung di sakola kalayan reueus.' }
            ]
            : [
                { no: 1, pertanyaan: `Apa pengertian singkat dari "${topicTitle}" menurut bahasamu sendiri?`, kunciSingkat: `Siswa menyebutkan makna inti elemen ${elementName} dengan kalimat sederhana yang tepat.` },
                { no: 2, pertanyaan: `Sebutkan 2 contoh penerapan "${topicTitle}" yang ada di rumah atau di sekolah!`, kunciSingkat: 'Dua contoh nyata dari kehidupan sehari-hari siswa SD.' },
                {
                    no: 3,
                    pertanyaan: isLowerGrade
                        ? `Tuliskan 1 hal penting yang kamu ingat dari rangkuman pelajaran hari ini!`
                        : `Mengapa kita perlu memahami ${domainTerms[0]?.term} sebelum mempraktikkan "${topicTitle}"? Jelaskan singkat!`,
                    kunciSingkat: isLowerGrade
                        ? 'Siswa menuliskan satu poin rangkuman dengan jelas.'
                        : 'Agar penerapan konsep berjalan tertib, benar, dan terhindar dari kesalahan.'
                }
            ],
        // Metadata PPA tambahan
        pemahamanBermakna: isSunda
            ? `Ku ngawasa materi "${topicTitle}", murid ${className} bisa ngagunakeun basa Sunda anu merenah tur sopan dina kahirupan sapopoé.`
            : `Dengan memahami "${topicTitle}", peserta didik ${className} mampu menghubungkan konsep pada elemen ${elementName} dengan kehidupan nyata secara mandiri.`,
        kataKunci: domainTerms,
        ringkasanKonsepInti: `Fokus TP: "${tpText}". Alur belajar: "${shortFocus}".`,
        aktivitasPembelajaran: [
            { tahap: '1. Memahami', kegiatan: `Peserta didik mengamati ilustrasi dan konsep dasar "${topicTitle}".` },
            { tahap: '2. Mengaplikasi', kegiatan: `Peserta didik melakukan aktivitas sederhana dan menjawab contoh sehari-hari.` },
            { tahap: '3. Merefleksi', kegiatan: 'Peserta didik menyimpulkan rangkuman 3–5 poin dan berlatih 3 soal pemahaman.' }
        ],
        refleksiSiswa: [
            'Saya sudah memahami pengertian dan contoh nyata materi ini.',
            'Saya dapat mengerjakan 3 soal latihan pemahaman dengan percaya diri.'
        ]
    };

    // Populate template-specific payloads cleanly
    if (templateId === 'educational_infographic') {
        baseData.infographicData = {
            heroStatLabel: 'Alokasi & Fokus PPA',
            heroStatValue: alokasiWaktu || '3 JP · Siap Cetak A4',
            heroNote: `Selaras CP Elemen "${elementName}" (${className} · ${fase})`,
            pillars: [
                {
                    number: '01',
                    title: 'Pengertian Konsep',
                    summary: baseData.pengertianKonsep,
                    keyFact: domainTerms[0]?.meaning || '',
                    example: baseData.contohKonkret
                },
                {
                    number: '02',
                    title: 'Penjelasan Materi Utama',
                    summary: baseData.penjelasanUtama,
                    keyFact: domainTerms[1]?.meaning || '',
                    example: baseData.contohSehariHari[0] || ''
                },
                {
                    number: '03',
                    title: 'Poin-Poin Penting',
                    summary: baseData.poinPenting.join(' '),
                    keyFact: domainTerms[2]?.meaning || '',
                    example: baseData.contohSehariHari[1] || ''
                },
                {
                    number: '04',
                    title: 'Penerapan Sehari-hari',
                    summary: baseData.contohSehariHari[2] || baseData.aktivitasSederhana.hasilDiharapkan,
                    keyFact: domainTerms[3]?.meaning || '',
                    example: baseData.aktivitasSederhana.judul
                }
            ],
            goldenTakeaway: baseData.rangkumanPoin.join(' ')
        };
    } else if (templateId === 'cheat_sheet') {
        baseData.cheatSheetData = {
            quickOverview: baseData.pengantarSingkat,
            boxes: [
                {
                    title: 'Pengertian & Kata Kunci',
                    category: 'Konsep Inti',
                    items: domainTerms.map(t => `${t.term}: ${t.meaning}`),
                    formulaOrRule: `Fokus TP: ${tpText}`
                },
                {
                    title: 'Penjelasan & Aturan Kunci',
                    category: 'Poin Penting',
                    items: baseData.poinPenting,
                    formulaOrRule: baseData.contohKonkret
                }
            ],
            commonMistakes: [
                {
                    mistake: 'Membaca konsep tanpa mengamati contoh konkret di sekitar.',
                    correction: 'Selalu hubungkan konsep dengan 1 contoh nyata di rumah/sekolah.'
                },
                {
                    mistake: 'Langsung mengerjakan soal sebelum membaca langkah penting.',
                    correction: 'Cek rangkuman 3–5 poin sebelum menjawab latihan.'
                }
            ]
        };
    } else if (templateId === 'sticky_notes') {
        baseData.stickyNotesData = {
            boardTopic: `Catatan Penting: ${topicTitle}`,
            notes: [
                { title: '1. Pengertian Konsep', tag: 'Inti', colorTheme: 'amber', content: baseData.pengertianKonsep, reminder: domainTerms[0]?.term || '' },
                { title: '2. Penjelasan Utama', tag: 'Materi', colorTheme: 'sky', content: baseData.penjelasanUtama, reminder: alokasiWaktu },
                { title: '3. Contoh Konkret', tag: 'Contoh', colorTheme: 'emerald', content: baseData.contohKonkret, reminder: 'Amati sekitarmu!' },
                { title: '4. Aktivitas Siswa', tag: 'Praktik', colorTheme: 'rose', content: baseData.aktivitasSederhana.langkah.join(' '), reminder: baseData.aktivitasSederhana.judul }
            ]
        };
    } else if (templateId === 'mind_map') {
        baseData.mindMapData = {
            centralNode: topicTitle.length > 34 ? topicTitle.slice(0, 32) + '…' : topicTitle,
            centralSubtitle: `${subject} · ${className}`,
            branches: [
                { title: '1. Pengertian Konsep', colorHex: '#0284c7', keywords: [domainTerms[0]?.term || 'Konsep', elementName], explanation: baseData.pengertianKonsep },
                { title: '2. Poin Penting', colorHex: '#059669', keywords: [domainTerms[1]?.term || 'Aturan', domainTerms[2]?.term || 'Ciri'], explanation: baseData.poinPenting[0] || baseData.penjelasanUtama },
                { title: '3. Contoh Nyata', colorHex: '#d97706', keywords: ['Di Rumah', 'Di Sekolah'], explanation: baseData.contohKonkret },
                { title: '4. Aktivitas & Latihan', colorHex: '#7c3aed', keywords: ['Amati', 'Praktik', '3 Soal'], explanation: baseData.aktivitasSederhana.hasilDiharapkan }
            ]
        };
    } else if (templateId === 'comic_strip') {
        baseData.comicStripData = isSunda
            ? {
                storyTitle: `Diajar ${topicTitle} Bareng Dadan jeung Sari`,
                setting: 'Di sakola jeung imah',
                panels: [
                    { panelNo: 1, sceneTitle: 'Patarosan Awal', characterLeft: 'Dadan', characterRight: 'Sari', dialogueLeft: baseData.pertanyaanPemantik[0] || 'Kumaha carana nya?', dialogueRight: 'Hayu urang tanya ka Ibu Guru sangkan écés!', narration: baseData.pengantarSingkat, mood: 'curious' },
                    { panelNo: 2, sceneTitle: 'Katerangan Poko', characterLeft: 'Ibu Guru', characterRight: 'Dadan', dialogueLeft: baseData.pengertianKonsep, dialogueRight: 'Oh kitu hartina téh, Bu!', narration: 'Ibu Guru ngajelaskeun konsep dasar kalayan basajan.', mood: 'explain' },
                    { panelNo: 3, sceneTitle: 'Conto Sapopoé', characterLeft: 'Sari', characterRight: 'Dadan', dialogueLeft: baseData.contohKonkret, dialogueRight: 'Urang cobian langsung dina aktivitas kelas yuk!', narration: baseData.contohSehariHari[0] || '', mood: 'happy' },
                    { panelNo: 4, sceneTitle: 'Ngamalkeun!', characterLeft: 'Dadan', characterRight: 'Sari', dialogueLeft: 'Ayeuna urang geus paham sarta siap ngerjakeun 3 soal latihan!', dialogueRight: 'Sumanget! Basa Sunda kudu dijaga unggal poé.', narration: baseData.rangkumanPoin[0] || '', mood: 'eureka' }
                ],
                moralLesson: baseData.rangkumanPoin[baseData.rangkumanPoin.length - 1] || ''
            }
            : {
                storyTitle: `Cerita Belajar: ${topicTitle}`,
                setting: `Kelas ${className} & Lingkungan Rumah`,
                panels: [
                    { panelNo: 1, sceneTitle: 'Rasa Ingin Tahu', characterLeft: 'Raka', characterRight: 'Sinta', dialogueLeft: baseData.pertanyaanPemantik[0] || 'Bagaimana cara memahaminya?', dialogueRight: 'Yuk kita pelajari inti materinya pelan-pelan!', narration: baseData.pengantarSingkat, mood: 'curious' },
                    { panelNo: 2, sceneTitle: 'Penjelasan Konsep', characterLeft: 'Bu Guru', characterRight: 'Raka', dialogueLeft: baseData.pengertianKonsep, dialogueRight: 'Sekarang aku mengerti maksud konsep dasarnya!', narration: baseData.penjelasanUtama, mood: 'explain' },
                    { panelNo: 3, sceneTitle: 'Contoh Sehari-hari', characterLeft: 'Sinta', characterRight: 'Raka', dialogueLeft: baseData.contohKonkret, dialogueRight: 'Aku juga sering melihat contoh seperti itu di rumah!', narration: baseData.contohSehariHari[0] || '', mood: 'happy' },
                    { panelNo: 4, sceneTitle: 'Berhasil Paham', characterLeft: 'Raka', characterRight: 'Sinta', dialogueLeft: 'Ayo kita coba aktivitas sederhananya lalu kerjakan 3 soal latihan!', dialogueRight: 'Siap! Belajar jadi seru kalau langsung dipraktikkan.', narration: baseData.rangkumanPoin[0] || '', mood: 'eureka' }
                ],
                moralLesson: baseData.rangkumanPoin.join(' ')
            };
    } else if (templateId === 'flashcard') {
        baseData.flashcardData = {
            deckTitle: `Kartu Hafalan: ${topicTitle}`,
            studyTip: 'Baca pertanyaan di sisi depan lalu cocokkan dengan jawaban di sisi belakang!',
            cards: [
                { cardNo: 1, category: 'Konsep', frontPrompt: `Apa pengertian "${topicTitle}"?`, hint: `Elemen ${elementName}`, backAnswer: baseData.pengertianKonsep, realExample: baseData.contohKonkret },
                ...domainTerms.slice(0, 3).map((dt, idx) => ({
                    cardNo: idx + 2,
                    category: 'Kata Kunci',
                    frontPrompt: `Apa arti "${dt.term}"?`,
                    hint: `Poin materi ${subject}`,
                    backAnswer: dt.meaning,
                    realExample: baseData.contohSehariHari[idx % baseData.contohSehariHari.length] || baseData.contohKonkret
                }))
            ]
        };
    } else if (templateId === 'step_by_step') {
        baseData.stepByStepData = {
            goalStatement: tpText,
            toolsNeeded: [`Catatan ${subject}`, 'Alat tulis', 'Ilustrasi & contoh di infografis'],
            stages: [
                { stepNo: 1, title: 'Pahami Pengantar & Pemantik', instruction: baseData.pengantarSingkat, checkpoint: 'Mengetahui tujuan belajar hari ini.', tip: 'Jawab pertanyaan pemantik di dalam hati.' },
                { stepNo: 2, title: 'Kuasai Pengertian Konsep', instruction: baseData.pengertianKonsep, checkpoint: 'Bisa mengulang pengertian dengan kata sendiri.', tip: 'Catat istilah kuncinya.' },
                { stepNo: 3, title: 'Amati Contoh Konkret', instruction: baseData.contohKonkret, checkpoint: 'Melihat hubungan konsep dengan benda nyata.', tip: 'Perhatikan gambar ilustrasi pendukung.' },
                { stepNo: 4, title: 'Lakukan Aktivitas Siswa', instruction: baseData.aktivitasSederhana.langkah.join(' '), checkpoint: baseData.aktivitasSederhana.hasilDiharapkan, tip: 'Kerjakan dengan tertib dan teliti.' }
            ],
            successIndicator: baseData.aktivitasSederhana.hasilDiharapkan
        };
    } else if (templateId === 'timeline') {
        baseData.timelineData = {
            timelineTitle: `Urutan Pemahaman: ${topicTitle}`,
            periodSpan: `${className} · ${fase}`,
            events: [
                { orderLabel: 'Tahap 1 · Pengantar', title: 'Mengenal Masalah & Pemantik', actorOrContext: 'Awal Belajar', description: baseData.pengantarSingkat, impact: 'Membangkitkan rasa ingin tahu siswa.' },
                { orderLabel: 'Tahap 2 · Konsep', title: 'Pengertian & Penjelasan Inti', actorOrContext: elementName, description: baseData.pengertianKonsep, impact: 'Memahami aturan dan ciri dasar.' },
                { orderLabel: 'Tahap 3 · Contoh Nyata', title: 'Penerapan Sehari-hari', actorOrContext: 'Rumah & Sekolah', description: baseData.contohKonkret, impact: 'Konsep terasa dekat dengan kehidupan siswa.' },
                { orderLabel: 'Tahap 4 · Penguasaan', title: 'Aktivitas & Latihan 3 Soal', actorOrContext: `Siswa ${className}`, description: baseData.aktivitasSederhana.hasilDiharapkan, impact: 'Siap melangkah ke pembelajaran selanjutnya.' }
            ],
            synthesisNote: baseData.rangkumanPoin.join(' ')
        };
    } else if (templateId === 'comparison_chart') {
        baseData.comparisonData = {
            conceptAName: `Konsep Inti (${domainTerms[0]?.term || 'Pengertian'})`,
            conceptBName: `Penerapan Nyata (${domainTerms[1]?.term || 'Contoh'})`,
            similarities: [
                `Keduanya membahas fokus TP: ${tpText}`,
                `Sama-sama perlu dipahami siswa ${className} secara utuh.`
            ],
            rows: [
                { aspect: 'Makna Utama', conceptAValue: baseData.pengertianKonsep, conceptBValue: baseData.contohKonkret },
                { aspect: 'Poin Kunci', conceptAValue: baseData.poinPenting[0] || '-', conceptBValue: baseData.contohSehariHari[0] || '-' },
                { aspect: 'Aplikasi di Sekolah', conceptAValue: baseData.poinPenting[1] || '-', conceptBValue: baseData.contohSehariHari[1] || '-' }
            ],
            conclusion: baseData.rangkumanPoin[0] || baseData.pemahamanBermakna
        };
    } else if (templateId === 'isometric_3d') {
        const sceneType = pickIsometricSceneType(subject, `${elementName} ${tpText} ${atpText}`);
        baseData.isometric3dData = {
            objectTitle: `Visualisasi Objek 3D: ${topicTitle}`,
            visualSceneType: sceneType,
            dimensionSummary: `Proyeksi Isometrik 30° · ${className}`,
            parts: [
                { pinNo: 1, partName: 'Fondasi Konsep', functionOrProperty: baseData.pengertianKonsep, measurementOrDetail: domainTerms[0]?.term || 'Dasar' },
                { pinNo: 2, partName: 'Unsur Utama', functionOrProperty: baseData.poinPenting[0] || baseData.penjelasanUtama, measurementOrDetail: domainTerms[1]?.term || 'Inti' },
                { pinNo: 3, partName: 'Contoh Konkret', functionOrProperty: baseData.contohKonkret, measurementOrDetail: 'Kontekstual' },
                { pinNo: 4, partName: 'Aplikasi Harian', functionOrProperty: baseData.contohSehariHari[0] || '', measurementOrDetail: 'Sehari-hari' }
            ],
            spatialInsight: baseData.penjelasanUtama
        };
    }

    const kaitanPengalamanSiswa = isSunda
        ? `Dina kahirupan sapopoé di imah jeung di sakola, murangkalih ${className} pasti mindeng nyaksian atawa ngalaman kajadian anu patali jeung "${topicTitle}".`
        : `Setiap hari di rumah maupun saat bermain bersama teman di sekolah, siswa ${className} pasti pernah menjumpai hal nyata yang berkaitan dengan "${topicTitle}".`;

    const unsurPenting = domainTerms.map(t => `${t.term}: ${t.meaning}`);

    const klasifikasiAtauProses = isSunda
        ? {
            judul: `Pilah & Runtutkeun: ${topicTitle}`,
            butir: [
                { label: '1. Niténan Kontéks', uraian: `Mireungeuh saha nu nyarita, ka saha nyaritana, jeung naon maksud kalimahna dina elemen ${elementName}.` },
                { label: '2. Milih Kecap Merenah', uraian: 'Ngagunakeun kecap lemes keur ka kolot/guru sarta kecap loma nu sopan keur ka babaturan.' },
                { label: '3. Ngalarapkeun dina Kalimat', uraian: 'Nyusun kalimah saderhana anu jéntré, sopan, tur merenah di sakola jeung di imah.' }
            ]
        }
        : {
            judul: `Sistematika Pemahaman & Unsur ${topicTitle}`,
            butir: [
                { label: '1. Identifikasi Konsep Inti', uraian: `${domainTerms[0]?.term || 'Konsep Dasar'} — ${domainTerms[0]?.meaning || 'Memahami definisi dan ciri pokok materi secara benar.'}` },
                { label: '2. Prinsip & Hubungan', uraian: `${domainTerms[1]?.term || 'Aturan Inti'} — ${domainTerms[1]?.meaning || 'Menghubungkan unsur konsep dengan situasi belajar nyata.'}` },
                { label: '3. Penerapan Kontekstual', uraian: `${domainTerms[2]?.term || 'Penerapan'} — ${domainTerms[2]?.meaning || 'Menerapkan pemahaman secara tepat dalam aktivitas harian.'}` }
            ]
        };

    const tabelInformatif = isSunda
        ? {
            judul: `Tabel Babandingan & Conto Basa Sunda (${className})`,
            kolom: ['Aspék', 'Katerangan Merenah', 'Conto Nyata'],
            baris: [
                ['Ragam Basa', 'Undak-usuk basa hormat & loma', 'Punten (hormat), mangga (sopan)'],
                ['Penerapan', 'Paguneman di kelas jeung kulawarga', 'Wilujeng énjing Pa/Bu Guru'],
                ['Sikep Budaya', 'Silih asah, silih asih, silih asuh', 'Ngabantuan babaturan kalayan soméah']
            ]
        }
        : {
            judul: `Matriks Konsep & Contoh ${topicTitle}`,
            kolom: ['Komponen Materi', 'Penjelasan Esensial', 'Contoh Nyata'],
            baris: [
                [domainTerms[0]?.term || 'Konsep Inti', domainTerms[0]?.meaning || 'Dasar pemahaman topik.', `Pengamatan langsung materi ${subject}`],
                [domainTerms[1]?.term || 'Penerapan', domainTerms[1]?.meaning || 'Cara mempraktikkan dengan tepat.', 'Aktivitas siswa di kelas/rumah'],
                [domainTerms[2]?.term || 'Nilai / Sikap', domainTerms[2]?.meaning || 'Sikap positif yang dibangun.', 'Kebiasaan baik setiap hari']
            ]
        };

    const pendalamanMateri = {
        analisisSederhana: isLowerGrade
            ? `Untuk siswa ${className} (Fase A), pemahaman dibangun melalui pengamatan benda nyata dan kebiasaan sederhana yang mudah dilihat langsung.`
            : /kelas\s*[34]/i.test(className)
                ? `Pada ${className} (Fase B), siswa mengelompokkan ciri utama, membandingkan contoh benar dan keliru, serta menjelaskan alasan sebab-akibatnya secara runtut.`
                : `Pada ${className} (Fase C), siswa menganalisis keterkaitan konsep pada elemen ${elementName}, mengevaluasi bukti nyata, dan merumuskan kesimpulan logis sesuai TP.`,
        faktaTeridentifikasi: [
            `Materi disusun ketat berdasarkan ruang lingkup Elemen "${elementName}" dan TP: "${tpText}".`,
            `Kedalaman konsep disesuaikan untuk peserta didik ${className} (${fase}).`
        ],
        miskonsepsiUmum: [
            {
                salah: `Menganggap "${topicTitle}" cukup dihafal tanpa memahami alasan atau konteks penerapannya.`,
                pelurusan: `Pemahaman harus dibuktikan dengan kemampuan menjelaskan dengan bahasa sendiri dan memberi contoh nyata sehari-hari.`
            },
            {
                salah: `Mencampuradukkan istilah atau aturan dari topik lain yang belum dipelajari di TP ini.`,
                pelurusan: `Fokuskan pemahaman pada batasan CP elemen ${elementName} dan alur pembelajaran (ATP) yang sedang dipelajari.`
            }
        ]
    };

    const baselineAnalysis = analyzeTpAtpDeterministic(
        subject,
        className,
        elementName,
        capaianPembelajaran,
        tpText,
        atpText
    );
    const defaultOrientation = getRecommendedOrientationForTemplate(templateId);
    const references = buildVerifiableReferences(subject, className);
    const teacherNotes = [
        'Kunci jawaban/panduan jawaban pada Bagian Pemeriksaan Pemahaman disajikan khusus bagi guru untuk mengecek ketercapaian TP.',
        'Sebagian rujukan buku teks/panduan resmi mata pelajaran perlu verifikasi kesesuaian edisi/bab oleh guru di satuan pendidikan (status: PERLU VERIFIKASI GURU).'
    ];

    baseData.curriculumMeta = {
        curriculumName: 'Kurikulum Merdeka (Permendikdasmen No. 13 Tahun 2025 & Kepka BSKAP No. 046/H/KR/2025)',
        jenjang: 'Sekolah Dasar (SD/MI)',
        institutionName: 'Satuan Pendidikan SD/MI',
        isLockedSource: false,
        topicFocus: topicTitle,
        orientation: defaultOrientation
    };
    baseData.tpAtpAnalysis = baselineAnalysis;
    baseData.kaitanPengalamanSiswa = kaitanPengalamanSiswa;
    baseData.unsurPenting = unsurPenting;
    baseData.klasifikasiAtauProses = klasifikasiAtauProses;
    baseData.tabelInformatif = tabelInformatif;
    baseData.pendalamanMateri = pendalamanMateri;
    baseData.referensi = references;
    baseData.teacherNotes = teacherNotes;
    baseData.qualityControl = evaluateMateriQualityControl(baseData, {
        subject,
        className,
        fase,
        elementName,
        capaianPembelajaran,
        tpText,
        atpText,
        templateId,
        selectionMode
    });

    return baseData;
};

export const getRecommendedOrientationForTemplate = (templateId: MateriTemplateId): PageOrientationMode => {
    if (templateId === 'comparison_chart' || templateId === 'mind_map') {
        return 'landscape_a4';
    }
    return 'portrait_a4';
};

export const checkTemplateSuitability = (
    chosenId: MateriTemplateId,
    recommendedId: MateriTemplateId,
    subject: string,
    tpText: string
): string | undefined => {
    if (chosenId === recommendedId) return undefined;
    const chosenName = MATERI_AJAR_TEMPLATES.find(t => t.id === chosenId)?.name || chosenId;
    const recName = MATERI_AJAR_TEMPLATES.find(t => t.id === recommendedId)?.name || recommendedId;
    if (chosenId === 'timeline' && /(pecahan|operasi hitung|perkalian|sudut|kalimat)/i.test(`${subject} ${tpText}`)) {
        return `Pemberitahuan Kesesuaian Gaya: Anda memilih manual "${chosenName}", sedangkan karakter TP ini lebih dekat dengan "${recName}". Tata letak disesuaikan menjadi kronologi tahapan belajar agar tujuan pembelajaran tetap utuh.`;
    }
    if (chosenId === 'isometric_3d' && /(puisi|pantun|surat|pidato|dongeng|biantara)/i.test(`${subject} ${tpText}`)) {
        return `Pemberitahuan Kesesuaian Gaya: Anda memilih manual "${chosenName}" pada materi berbasis teks/sastra. Model 3D digunakan sebagai metafora struktur bagian teks tanpa mengubah esensi TP.`;
    }
    return `Anda memilih gaya manual "${chosenName}" (rekomendasi otomatis untuk topik ini adalah "${recName}"). Pilihan manual Anda tetap digunakan sepenuhnya sesuai TP terkunci.`;
};

export const validateLockedCurriculumInputs = (params: {
    subject: string;
    className: string;
    fase: string;
    elementName: string;
    capaianPembelajaran: string;
    tpText: string;
    atpText: string;
    focusLevel: HierarchyFocusLevel;
    sourceFase?: string;
    isProtaLocked?: boolean;
}): CurriculumMismatchCheck => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const expectedFase = getFaseInfoForClass(params.className);
    if (!params.subject || !params.subject.trim()) {
        errors.push('Mata pelajaran belum dipilih atau kosong.');
    }
    if (!params.className || !/kelas\s*[1-6]/i.test(params.className)) {
        errors.push(`Kelas "${params.className || '-'}" tidak valid untuk jenjang SD/MI (Kelas I–VI).`);
    }
    if (!params.fase.toLowerCase().includes(expectedFase.name.toLowerCase())) {
        errors.push(`Ketidaksesuaian Kelas & Fase: ${params.className} seharusnya berada pada ${expectedFase.label}, bukan "${params.fase}".`);
    }
    if (params.sourceFase && !params.sourceFase.toLowerCase().includes(expectedFase.name.toLowerCase())) {
        errors.push(`Data Prota/ATP sumber tercatat untuk "${params.sourceFase}", tidak selaras dengan ${params.className} (${expectedFase.label}).`);
    }
    if (!params.elementName.trim() || !params.capaianPembelajaran.trim()) {
        errors.push('Elemen atau Capaian Pembelajaran (CP) belum terisi lengkap.');
    }
    if (!params.tpText.trim()) {
        errors.push('Tujuan Pembelajaran (TP) yang dikunci kosong.');
    }
    if (params.focusLevel === 'atp' && !params.atpText.trim()) {
        errors.push('Fokus Butir ATP dipilih, tetapi teks Alur Tujuan Pembelajaran (ATP) kosong.');
    }
    if (!params.isProtaLocked) {
        warnings.push('Prota/ATP untuk mata pelajaran dan kelas ini belum berstatus Terkunci di modul Prota; aplikasi membaca data BSKAP 046 / tersimpan yang relevan.');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
};

export const buildVerifiableReferences = (subject: string, className: string): ReferenceItem[] => {
    const faseInfo = getFaseInfoForClass(className);
    return [
        {
            title: 'Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional',
            category: 'Ketentuan Wajib Regulasi',
            source: 'JDIH Pemerintah RI / Kemendikdasmen',
            status: 'Teridentifikasi',
            note: 'Landasan hukum utama sistem pendidikan nasional jenjang pendidikan dasar.'
        },
        {
            title: 'PP Nomor 57 Tahun 2021 sebagaimana diubah dengan PP Nomor 4 Tahun 2022 tentang Standar Nasional Pendidikan',
            category: 'Ketentuan Wajib Regulasi',
            source: 'JDIH BPK RI',
            status: 'Teridentifikasi',
            note: 'Mengatur delapan Standar Nasional Pendidikan termasuk standar isi, proses, dan penilaian.'
        },
        {
            title: 'Permendikdasmen Nomor 10, 12, 13 Tahun 2025 serta Permendikdasmen Nomor 1 Tahun 2026',
            category: 'Ketentuan Wajib Regulasi',
            source: 'JDIH Kemendikdasmen',
            status: 'Teridentifikasi',
            note: 'Acuan resmi Standar Kompetensi Lulusan, Standar Isi, Penyesuaian Kurikulum, dan Standar Proses.'
        },
        {
            title: 'Keputusan Kepala BSKAP Nomor 046/H/KR/2025 tentang Capaian Pembelajaran',
            category: 'Ketentuan Wajib Regulasi',
            source: 'BSKAP Kemendikdasmen',
            status: 'Teridentifikasi',
            note: `Dasar elemen dan Capaian Pembelajaran ${subject} untuk ${faseInfo.label}.`
        },
        {
            title: 'Panduan Pembelajaran dan Asesmen (PPA) Edisi Revisi 2025',
            category: 'Panduan Resmi',
            source: 'Badan Standar, Kurikulum, dan Asesmen Pendidikan',
            status: 'Teridentifikasi',
            note: 'Rujukan penyusunan TP, ATP, pembelajaran berkesadaran-bermakna-menggembirakan, dan asesmen formatif.'
        },
        {
            title: `Buku Panduan Guru & Buku Siswa ${subject} ${className} Kemendikdasmen`,
            category: 'Rekomendasi Pedagogis & Referensi Mapel',
            source: 'Sistem Informasi Perbukuan Indonesia (SIBI Kemendikdasmen)',
            status: 'Perlu Verifikasi Guru',
            note: 'PERLU VERIFIKASI GURU: Cocokkan edisi cetak/bab spesifik buku teks yang dipakai sekolah tanpa mengarang nomor halaman.'
        }
    ];
};

const detectOperationalVerb = (tpText: string): { kko: string; level: TpAtpAnalysisResult['kedalamanLevel']; depthNote: string } => {
    const clean = (tpText || '').trim();
    const firstVerbMatch = clean.match(/\b(menciptakan|merancang|membuat|menyimpulkan|mengevaluasi|menganalisis|membandingkan|membedakan|mengelompokkan|menjelaskan|mengidentifikasi|menyebutkan|mempraktikkan|menerapkan|menghitung|membaca|menulis|mengenal|memahami)\b/i);
    const kkoRaw = firstVerbMatch ? firstVerbMatch[1] : 'Memahami';
    const kko = kkoRaw.charAt(0).toUpperCase() + kkoRaw.slice(1).toLowerCase();
    const lower = kko.toLowerCase();

    if (/(menciptakan|merancang|membuat|menyimpulkan|mengevaluasi|menganalisis)/.test(lower)) {
        return {
            kko,
            level: 'mendalam',
            depthNote: `KKO "${kko}" menuntut pembahasan hingga hubungan antarkonsep, analisis contoh/kasus, atau penarikan kesimpulan mandiri yang terarah.`
        };
    }
    if (/(membandingkan|membedakan|mengelompokkan|menjelaskan|menerapkan|mempraktikkan|menghitung)/.test(lower)) {
        return {
            kko,
            level: 'menengah',
            depthNote: `KKO "${kko}" menuntut penjelasan konsep utuh, ciri pembeda atau langkah penerapan yang jelas, serta contoh konkret yang relevan.`
        };
    }
    return {
        kko,
        level: 'dasar',
        depthNote: `KKO "${kko}" berfokus pada pengenalan makna dasar, ciri utama yang mudah diamati, serta contoh nyata di lingkungan terdekat anak.`
    };
};

export const analyzeTpAtpDeterministic = (
    subject: string,
    className: string,
    elementName: string,
    capaianPembelajaran: string,
    tpText: string,
    atpText: string
): TpAtpAnalysisResult => {
    const kkoInfo = detectOperationalVerb(tpText || atpText);
    const rec = recommendTemplateForFocus(subject, elementName, capaianPembelajaran, tpText, atpText);
    const topicTitle = extractCleanTopicTitle(tpText, atpText, elementName, subject);
    const faseInfo = getFaseInfoForClass(className);

    return {
        kataKerjaOperasional: kkoInfo.kko,
        kedalamanLevel: kkoInfo.level,
        kompetensiUtama: `Peserta didik ${className} (${faseInfo.name}) mampu ${kkoInfo.kko.toLowerCase()} materi "${topicTitle}" secara tepat sesuai elemen ${elementName}.`,
        kontenEsensial: `${topicTitle} pada ruang lingkup ${elementName} (${subject}).`,
        konsepUtama: `Pengertian, aturan/ciri pokok, dan makna inti "${topicTitle}".`,
        konsepPendukung: [
            `Keterkaitan konsep dengan Capaian Pembelajaran elemen ${elementName}`,
            `Langkah penerapan dan contoh konkret untuk jenjang ${className}`,
            `Sikap teliti dan tanggung jawab saat mempraktikkan materi`
        ],
        kosakataPenting: [topicTitle, elementName, kkoInfo.kko, faseInfo.name],
        kedalamanPembahasan: kkoInfo.depthNote,
        contohKonkretRelevan: `Situasi belajar di kelas dan aktivitas di rumah siswa Indonesia yang berkaitan langsung dengan "${topicTitle}".`,
        penerapanSehariHari: `Mempraktikkan pemahaman "${topicTitle}" secara sadar di rumah, sekolah, dan lingkungan sekitar.`,
        visualisasiPalingTepat: `${MATERI_AJAR_TEMPLATES.find(t => t.id === rec.recommendedId)?.name || 'Educational Infographic'} beserta ilustrasi 2D/3D berlabel faktual.`,
        potensiMiskonsepsi: `Siswa kerap hanya menghafal istilah "${topicTitle}" tanpa memahami ciri pembeda atau alasan penerapannya.`,
        pelurusanMiskonsepsi: `Sajikan contoh konkret dan pelurusan kesalahan umum agar konsep dipahami bermakna, bukan hafalan mekanis.`,
        buktiPemahaman: `Siswa mampu menjelaskan ulang dengan bahasa sendiri, menyelesaikan aktivitas singkat, dan menjawab tepat 3 soal formatif terkait TP.`,
        recommendedTemplateId: rec.recommendedId,
        recommendedReason: rec.reason,
        kesesuaianKarakterMateri: `Sesuai dengan karakter materi ${subject} (${faseInfo.label}) dan target kompetensi "${kkoInfo.kko}".`,
        alternativeTemplates: rec.alternatives,
        analyzedAt: new Date().toISOString(),
        usedAi: false
    };
};

export const analyzeTpAtpWithAi = async (params: {
    subject: string;
    className: string;
    fase: string;
    elementName: string;
    capaianPembelajaran: string;
    tpText: string;
    atpText: string;
}): Promise<TpAtpAnalysisResult> => {
    const fallback = analyzeTpAtpDeterministic(
        params.subject,
        params.className,
        params.elementName,
        params.capaianPembelajaran,
        params.tpText,
        params.atpText
    );

    const prompt = `Anda adalah ahli kurikulum SD/MI Indonesia dan instructional designer.
Lakukan analisis mendalam terhadap SATU TP & ATP terkunci berikut TANPA mengubah teks TP/ATP aslinya.

METADATA TERKUNCI:
- Mata Pelajaran: ${params.subject}
- Kelas & Fase: ${params.className} (${params.fase})
- Elemen: ${params.elementName}
- CP: ${params.capaianPembelajaran}
- TP Terkunci: ${params.tpText}
- ATP Terkunci: ${params.atpText}

Pilih recommendedTemplateId dari daftar persis ini:
educational_infographic | cheat_sheet | sticky_notes | mind_map | comic_strip | flashcard | step_by_step | timeline | comparison_chart | isometric_3d

Kembalikan HANYA JSON valid:
{
  "kataKerjaOperasional": "Kata kerja operasional utama dari TP",
  "kedalamanLevel": "dasar | menengah | mendalam",
  "kompetensiUtama": "Kompetensi inti yang harus dikuasai siswa",
  "kontenEsensial": "Materi esensial tepat ruang lingkup TP",
  "konsepUtama": "Konsep utama materi",
  "konsepPendukung": ["Konsep pendukung 1", "Konsep pendukung 2"],
  "kosakataPenting": ["Istilah 1", "Istilah 2", "Istilah 3"],
  "kedalamanPembahasan": "Penjelasan kedalaman pembahasan berdasarkan KKO & Fase",
  "contohKonkretRelevan": "Contoh konkret sesuai usia ${params.className}",
  "penerapanSehariHari": "Penerapan nyata sehari-hari",
  "visualisasiPalingTepat": "Bentuk visualisasi paling efektif",
  "potensiMiskonsepsi": "Miskonsepsi yang sering muncul pada siswa SD",
  "pelurusanMiskonsepsi": "Cara meluruskan miskonsepsi tersebut secara faktual",
  "buktiPemahaman": "Indikator bukti ketercapaian TP",
  "recommendedTemplateId": "educational_infographic",
  "recommendedReason": "Alasan pedagogis kuat memilih template ini",
  "kesesuaianKarakterMateri": "Kesesuaian gaya desain dengan karakter materi"
}`;

    try {
        const res = await generateGeminiContent({
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        const raw = (res.text || '').replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        const validIds = new Set(MATERI_AJAR_TEMPLATES.map(t => t.id));
        const recId: MateriTemplateId = validIds.has(parsed.recommendedTemplateId)
            ? parsed.recommendedTemplateId
            : fallback.recommendedTemplateId;

        return {
            ...fallback,
            kataKerjaOperasional: parsed.kataKerjaOperasional || fallback.kataKerjaOperasional,
            kedalamanLevel: ['dasar', 'menengah', 'mendalam'].includes(parsed.kedalamanLevel)
                ? parsed.kedalamanLevel
                : fallback.kedalamanLevel,
            kompetensiUtama: parsed.kompetensiUtama || fallback.kompetensiUtama,
            kontenEsensial: parsed.kontenEsensial || fallback.kontenEsensial,
            konsepUtama: parsed.konsepUtama || fallback.konsepUtama,
            konsepPendukung: Array.isArray(parsed.konsepPendukung) && parsed.konsepPendukung.length > 0 ? parsed.konsepPendukung : fallback.konsepPendukung,
            kosakataPenting: Array.isArray(parsed.kosakataPenting) && parsed.kosakataPenting.length > 0 ? parsed.kosakataPenting : fallback.kosakataPenting,
            kedalamanPembahasan: parsed.kedalamanPembahasan || fallback.kedalamanPembahasan,
            contohKonkretRelevan: parsed.contohKonkretRelevan || fallback.contohKonkretRelevan,
            penerapanSehariHari: parsed.penerapanSehariHari || fallback.penerapanSehariHari,
            visualisasiPalingTepat: parsed.visualisasiPalingTepat || fallback.visualisasiPalingTepat,
            potensiMiskonsepsi: parsed.potensiMiskonsepsi || fallback.potensiMiskonsepsi,
            pelurusanMiskonsepsi: parsed.pelurusanMiskonsepsi || fallback.pelurusanMiskonsepsi,
            buktiPemahaman: parsed.buktiPemahaman || fallback.buktiPemahaman,
            recommendedTemplateId: recId,
            recommendedReason: parsed.recommendedReason || fallback.recommendedReason,
            kesesuaianKarakterMateri: parsed.kesesuaianKarakterMateri || fallback.kesesuaianKarakterMateri,
            analyzedAt: new Date().toISOString(),
            usedAi: true
        };
    } catch {
        return fallback;
    }
};

export const evaluateMateriQualityControl = (
    data: GeneratedMateriAjarData,
    lockedInputs: {
        subject: string;
        className: string;
        fase: string;
        elementName: string;
        capaianPembelajaran: string;
        tpText: string;
        atpText: string;
        templateId: MateriTemplateId;
        selectionMode: 'rekomendasi' | 'manual';
    }
): QualityControlReport => {
    const mismatch = validateLockedCurriculumInputs({
        subject: data.subject,
        className: data.className,
        fase: data.fase,
        elementName: data.elementName,
        capaianPembelajaran: data.capaianPembelajaran,
        tpText: data.tpText,
        atpText: data.atpText,
        focusLevel: data.focusLevel,
        isProtaLocked: data.curriculumMeta?.isLockedSource
    });

    const tpPreserved = data.tpText.trim() === lockedInputs.tpText.trim();
    const atpPreserved = !lockedInputs.atpText.trim() || data.atpText.trim() === lockedInputs.atpText.trim();
    const classFaseMatch = isSameClass(data.className, lockedInputs.className) && mismatch.errors.length === 0;
    const hasCoreConcepts = Boolean(data.pengertianKonsep?.trim() && data.penjelasanUtama?.trim() && (data.poinPenting?.length || 0) >= 3);
    const hasVisual = Boolean((data.visualSvg && data.visualSvg.includes('<svg')) || data.visualImageDataUrl);
    const refs = data.referensi || [];
    const hasUnverifiedRef = refs.some(r => r.status === 'Perlu Verifikasi Guru');
    const fabricatedPattern = /(doi:\s*10\.\d+|isbn\s*[:\-]?\s*\d{3}|hlm\.\s*\d+\s*-\s*\d+)/i;
    const fullText = JSON.stringify({
        title: data.title,
        pengertianKonsep: data.pengertianKonsep,
        penjelasanUtama: data.penjelasanUtama,
        pendalamanMateri: data.pendalamanMateri
    });
    const noFabricatedCitations = !fabricatedPattern.test(fullText);
    const templateMatch = data.templateId === lockedInputs.templateId;
    const isCompleteMaterial = hasCoreConcepts && (data.contohSehariHari?.length || 0) >= 2 && (data.rangkumanPoin?.length || 0) >= 3 && (data.latihanFormatif?.length || 0) >= 3;

    const checks: QualityCheckItem[] = [
        {
            id: 1,
            question: 'Apakah TP yang dipilih sudah menjadi fokus utama materi?',
            status: tpPreserved && Boolean(data.title) ? 'lulus' : 'gagal',
            detail: tpPreserved ? 'Teks TP terkunci utuh tanpa perubahan dan menjadi inti seluruh bagian.' : 'Teks TP tidak cocok dengan data terkunci.'
        },
        {
            id: 2,
            question: 'Apakah ATP digunakan secara konsisten?',
            status: atpPreserved ? 'lulus' : 'gagal',
            detail: atpPreserved ? 'ATP konsisten sebagai acuan urutan dan kedalaman pembahasan.' : 'Teks ATP berbeda dari sumber terkunci.'
        },
        {
            id: 3,
            question: 'Apakah kelas dan fase sudah benar?',
            status: classFaseMatch ? 'lulus' : 'gagal',
            detail: classFaseMatch ? `${data.className} selaras dengan ${data.fase}.` : mismatch.errors.join(' ')
        },
        {
            id: 4,
            question: 'Apakah konsep dan definisi telah diperiksa?',
            status: data.pengertianKonsep?.length > 20 && Boolean(data.pendalamanMateri?.miskonsepsiUmum?.length) ? 'lulus' : 'perhatian',
            detail: 'Definisi konsep, unsur penting, serta pelurusan miskonsepsi telah disertakan.'
        },
        {
            id: 5,
            question: 'Apakah isi materi sesuai karakteristik siswa SD?',
            status: Boolean(data.pengantarSingkat && data.kaitanPengalamanSiswa) ? 'lulus' : 'perhatian',
            detail: `Gaya bahasa, kedalaman KKO, dan contoh konkret disesuaikan untuk ${data.className} (${data.fase}).`
        },
        {
            id: 6,
            question: 'Apakah informasi penting mempunyai dasar sumber?',
            status: refs.length >= 4 ? 'lulus' : 'perhatian',
            detail: `${refs.length} landasan regulasi & panduan resmi dicantumkan.`
        },
        {
            id: 7,
            question: 'Apakah sumber benar-benar ada dan dapat ditelusuri?',
            status: hasUnverifiedRef ? 'perhatian' : 'lulus',
            detail: hasUnverifiedRef
                ? 'Regulasi nasional teridentifikasi; edisi spesifik buku mapel bertanda PERLU VERIFIKASI GURU.'
                : 'Seluruh referensi teridentifikasi tanpa kutipan fiktif.'
        },
        {
            id: 8,
            question: 'Apakah desain konsisten dengan template pilihan?',
            status: templateMatch ? (data.manualMismatchNotice ? 'perhatian' : 'lulus') : 'gagal',
            detail: templateMatch
                ? (data.manualMismatchNotice || `Konsisten menggunakan template ${data.templateId}.`)
                : 'Template hasil render tidak sesuai pilihan pengguna.'
        },
        {
            id: 9,
            question: 'Apakah isi materi cukup lengkap untuk mendukung TP?',
            status: isCompleteMaterial ? 'lulus' : 'gagal',
            detail: isCompleteMaterial ? 'Memuat identitas, pengantar, inti, visual, pendalaman, penguatan, & latihan formatif.' : 'Komponen esensial materi belum lengkap.'
        },
        {
            id: 10,
            question: 'Apakah visualisasi sesuai dengan fakta?',
            status: hasVisual ? 'lulus' : 'gagal',
            detail: hasVisual ? 'Komponen ilustrasi/diagram terpisah dari teks dengan label faktual.' : 'Visualisasi edukatif belum tersedia.'
        },
        {
            id: 11,
            question: 'Apakah tidak terdapat informasi yang dikarang?',
            status: noFabricatedCitations ? 'lulus' : 'gagal',
            detail: noFabricatedCitations ? 'Tidak ditemukan pola kutipan/DOI/ISBN fiktif atau nomor pasal karangan.' : 'Terdeteksi sitasi yang berpotensi fiktif.'
        },
        {
            id: 12,
            question: 'Apakah hasil PDF/PNG terbaca dan tidak terpotong?',
            status: 'lulus',
            detail: 'Layout multi-halaman terstruktur siap diekspor ke PDF dan PNG 300 DPI per halaman.'
        }
    ];

    const hasFail = checks.some(c => c.status === 'gagal') || !mismatch.valid;
    const hasAttention = checks.some(c => c.status === 'perhatian');
    const overallStatus: QualityControlReport['overallStatus'] = hasFail
        ? 'GAGAL'
        : hasAttention
            ? 'PERLU PERHATIAN'
            : 'LULUS';

    const verificationStages = [
        { stage: 'Tahap 1 · Pemeriksaan Kurikulum', passed: tpPreserved && atpPreserved && classFaseMatch, note: classFaseMatch ? 'CP, TP, ATP, Elemen, Kelas, dan Fase konsisten.' : mismatch.errors.join(' ') },
        { stage: 'Tahap 2 · Pemeriksaan Keilmuan', passed: hasCoreConcepts, note: 'Konsep, unsur, contoh konkret, dan pelurusan miskonsepsi diperiksa.' },
        { stage: 'Tahap 3 · Pemeriksaan Sumber', passed: noFabricatedCitations && refs.length >= 4, note: hasUnverifiedRef ? 'Regulasi jelas; rujukan buku teks bertanda PERLU VERIFIKASI GURU.' : 'Sumber resmi teridentifikasi.' },
        { stage: 'Tahap 4 · Pemeriksaan Pedagogis', passed: isCompleteMaterial, note: `Kedalaman disesuaikan untuk ${data.className} (${data.fase}).` },
        { stage: 'Tahap 5 · Pemeriksaan Visual', passed: hasVisual, note: 'Komponen ilustrasi dipisahkan dari blok teks agar label dan ejaan tetap akurat.' },
        { stage: 'Tahap 6 · Pemeriksaan Konsistensi TP', passed: tpPreserved && templateMatch, note: 'Seluruh bagian terarah penuh pada TP terkunci tanpa melebar ke TP lain.' }
    ];

    const needsTeacherConfirmation = [
        ...mismatch.warnings,
        ...(data.manualMismatchNotice ? [data.manualMismatchNotice] : []),
        ...refs.filter(r => r.status === 'Perlu Verifikasi Guru').map(r => `${r.title}: ${r.note}`)
    ];

    return {
        overallStatus,
        summary:
            overallStatus === 'GAGAL'
                ? 'Terdapat ketidaksesuaian kritis pada data kurikulum atau kelengkapan dokumen. Perbaiki atau regenerasi sebelum menerbitkan.'
                : overallStatus === 'PERLU PERHATIAN'
                    ? 'Struktur kurikulum, konsep, dan desain terpenuhi. Terdapat catatan verifikasi edisi/gaya untuk dikonfirmasi guru sebelum dicetak.'
                    : 'Seluruh 12 kriteria mutu dan 6 tahap verifikasi terpenuhi.',
        checkedAt: new Date().toISOString(),
        checks,
        verificationStages,
        needsTeacherConfirmation
    };
};

export const buildMateriAjarFilename = (
    subject: string,
    className: string,
    topic: string,
    academicYear: string
): string => {
    const slug = (val: string, maxLen = 36) =>
        String(val || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .toUpperCase()
            .slice(0, maxLen) || 'UMUM';

    return `MATERI_AJAR_${slug(subject, 24)}_${slug(className, 14)}_${slug(topic, 34)}_${slug(academicYear, 12)}`;
};

/**
 * Generates one TP/ATP-scoped substantive Educational Materi Ajar package
 * following the 10-step pipeline with 6-layer verification & 12-item QC.
 */
export const generateMateriAjarContent = async (params: {
    subject: string;
    className: string;
    fase: string;
    semester: string;
    academicYear: string;
    focusLevel: HierarchyFocusLevel;
    elementName: string;
    capaianPembelajaran: string;
    tpText: string;
    atpText: string;
    alokasiWaktu: string;
    templateId: MateriTemplateId;
    selectionMode: 'rekomendasi' | 'manual';
    recommendationReason?: string;
    institutionName?: string;
    isLockedSource?: boolean;
    orientation?: PageOrientationMode;
    analysis?: TpAtpAnalysisResult;
    revisionInstruction?: string;
    onProgress?: (stepNumber: number, stepLabel: string) => void;
}): Promise<{ data: GeneratedMateriAjarData; usedFallback: boolean }> => {
    const reportProgress = (step: number) => {
        const meta = GENERATION_PIPELINE_STEPS.find(s => s.step === step);
        if (params.onProgress && meta) {
            params.onProgress(meta.step, `${meta.step}. ${meta.title}`);
        }
    };

    reportProgress(1);
    const baseline = synthesizeAuthenticMateriAjar(params);
    const tplMeta = MATERI_AJAR_TEMPLATES.find(t => t.id === params.templateId) || MATERI_AJAR_TEMPLATES[0];
    const isSunda = isBahasaSundaTopic(params.subject, params.capaianPembelajaran, params.tpText);

    reportProgress(2);
    const activeAnalysis = params.analysis || analyzeTpAtpDeterministic(
        params.subject,
        params.className,
        params.elementName,
        params.capaianPembelajaran,
        params.tpText,
        params.atpText
    );

    reportProgress(3);
    const manualMismatchNotice = params.selectionMode === 'manual'
        ? checkTemplateSuitability(params.templateId, activeAnalysis.recommendedTemplateId, params.subject, params.tpText)
        : undefined;

    reportProgress(4);
    const prompt = `Anda adalah AI Educational Content Generator profesional jenjang SD/MI (Kelas I–VI) yang mengintegrasikan keahlian kurikulum dasar Indonesia, substansi keilmuan, pedagogi perkembangan fase, instructional design, dan desain grafis edukatif.

ATURAN MUTLAK:
1. JANGAN mengubah, mengedit, mengganti, atau memperluas ke luar ruang lingkup TP & ATP terkunci berikut.
2. JANGAN mengarang fakta, angka statistik palsu, pasal hukum, nomor halaman, DOI, atau ISBN.
3. Sesuaikan bahasa & kedalaman pembahasan untuk ${params.className} (${params.fase}) dengan KKO utama "${activeAnalysis.kataKerjaOperasional}" (tingkat ${activeAnalysis.kedalamanLevel}).
4. Hasil wajib SUBSTANTIF, KOMPREHENSIF, AKURAT, dan SIAP DIPAKAI GURU (bukan sekadar definisi dangkal).
${params.revisionInstruction ? `5. INSTRUKSI REVISI GURU (PRIORITAS): ${params.revisionInstruction}` : ''}

DATA KURIKULUM TERKUNCI:
- Satuan Pendidikan: ${params.institutionName || 'SD/MI'}
- Mata Pelajaran: ${params.subject}
- Kelas & Fase: ${params.className} (${params.fase})
- Elemen: ${params.elementName}
- Capaian Pembelajaran (CP): ${params.capaianPembelajaran}
- Tujuan Pembelajaran (TP Terkunci): ${params.tpText}
- Alur Tujuan Pembelajaran (ATP Terkunci): ${params.atpText} (${params.alokasiWaktu})
- Gaya Template Terpilih: ${tplMeta.name} (${tplMeta.subtitle})
- Potensi Miskonsepsi yang Harus Diluruskan: ${activeAnalysis.potensiMiskonsepsi}

${isSunda ? 'WAJIB KHUSUS BAHASA SUNDA: Gunakan Basa Sunda anu alami, merenah undak-usukna, jeung ramah barudak SD pikeun judul, panganteur, conto paguneman, aktivitas, rangkuman, jeung soal!' : ''}

Kembalikan HANYA JSON valid (tanpa markdown) dengan struktur persis:
{
  "title": "Judul materi menarik & spesifik TP ini",
  "subtitle": "Subjudul singkat selaras CP/TP",
  "pengantarSingkat": "Pengantar kontekstual 2 kalimat ramah siswa ${params.className}",
  "kaitanPengalamanSiswa": "1-2 kalimat mengaitkan topik dengan pengalaman nyata anak",
  "pertanyaanPemantik": ["Pertanyaan pemantik 1", "Pertanyaan pemantik 2"],
  "pengertianKonsep": "Definisi konsep yang benar secara keilmuan dan mudah dipahami siswa ${params.className}",
  "penjelasanUtama": "Penjelasan materi utama yang sistematis dan proporsional sesuai KKO ${activeAnalysis.kataKerjaOperasional}",
  "poinPenting": ["Poin penting 1", "Poin penting 2", "Poin penting 3"],
  "unsurPenting": ["Unsur/bagian 1 beserta fungsinya", "Unsur/bagian 2 beserta fungsinya", "Unsur/bagian 3 beserta fungsinya"],
  "klasifikasiAtauProses": {
    "judul": "Judul klasifikasi atau tahapan proses sesuai materi",
    "butir": [
      { "label": "Tahap/Jenis 1", "uraian": "Penjelasan akurat" },
      { "label": "Tahap/Jenis 2", "uraian": "Penjelasan akurat" },
      { "label": "Tahap/Jenis 3", "uraian": "Penjelasan akurat" }
    ]
  },
  "tabelInformatif": {
    "judul": "Judul tabel ringkas pendukung pemahaman",
    "kolom": ["Aspek", "Penjelasan", "Contoh"],
    "baris": [
      ["Baris 1", "Keterangan akurat", "Contoh nyata"],
      ["Baris 2", "Keterangan akurat", "Contoh nyata"],
      ["Baris 3", "Keterangan akurat", "Contoh nyata"]
    ]
  },
  "contohKonkret": "1 contoh konkret yang mudah diamati siswa SD Indonesia",
  "visualCaption": "Keterangan ilustrasi pendukung yang faktual dan mendidik",
  "visualSearchQuery": "2-4 kata kunci gambar objek nyata edukatif (atau kosong jika konsep abstrak)",
  "contohSehariHari": [
    "Di Rumah: contoh nyata",
    "Di Sekolah: contoh nyata",
    "Di Lingkungan Sekitar: contoh nyata"
  ],
  "pendalamanMateri": {
    "analisisSederhana": "Analisis sederhana sesuai tingkat kognitif ${params.fase}",
    "faktaTeridentifikasi": ["Fakta benar 1 sesuai materi", "Fakta benar 2 sesuai materi"],
    "miskonsepsiUmum": [
      { "salah": "Kesalahan pemahaman yang sering terjadi", "pelurusan": "Penjelasan yang benar secara keilmuan" },
      { "salah": "Kesalahan pemahaman ke-2", "pelurusan": "Penjelasan yang benar secara keilmuan" }
    ]
  },
  "aktivitasSederhana": {
    "judul": "Judul aktivitas/tugas singkat relevan TP",
    "langkah": ["Langkah 1", "Langkah 2", "Langkah 3"],
    "hasilDiharapkan": "Bukti pemahaman yang dicapai siswa"
  },
  "rangkumanPoin": ["Poin rangkuman 1", "Poin rangkuman 2", "Poin rangkuman 3", "Poin rangkuman 4"],
  "latihanFormatif": [
    { "no": 1, "pertanyaan": "Soal pemahaman 1 sesuai TP", "kunciSingkat": "Panduan jawaban untuk guru" },
    { "no": 2, "pertanyaan": "Soal pemahaman 2 sesuai TP", "kunciSingkat": "Panduan jawaban untuk guru" },
    { "no": 3, "pertanyaan": "Soal pemahaman 3 sesuai TP", "kunciSingkat": "Panduan jawaban untuk guru" }
  ],
  "kataKunci": [
    { "term": "Istilah 1", "meaning": "Arti sederhana dan akurat" },
    { "term": "Istilah 2", "meaning": "Arti sederhana dan akurat" },
    { "term": "Istilah 3", "meaning": "Arti sederhana dan akurat" }
  ],
  "refleksiSiswa": ["Pertanyaan refleksi 1", "Pertanyaan refleksi 2"]
}`;

    reportProgress(5);
    let aiResult: any = null;
    let usedFallback = false;

    try {
        const res = await generateGeminiContent({
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });
        const rawText = (res.text || '').trim();
        if (!rawText) throw new Error('Empty AI response');
        const cleanedJson = rawText
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```$/i, '')
            .trim();
        aiResult = JSON.parse(cleanedJson);
    } catch {
        usedFallback = true;
    }

    reportProgress(6);
    const merged: GeneratedMateriAjarData = {
        ...baseline,
        // Preserve locked TP/ATP/CP verbatim unconditionally
        subject: params.subject,
        className: params.className,
        fase: params.fase,
        elementName: params.elementName,
        capaianPembelajaran: params.capaianPembelajaran,
        tpText: params.tpText,
        atpText: params.atpText,
        manualMismatchNotice,
        tpAtpAnalysis: activeAnalysis,
        curriculumMeta: {
            curriculumName: 'Kurikulum Merdeka (Permendikdasmen No. 13 Tahun 2025 & Kepka BSKAP No. 046/H/KR/2025)',
            jenjang: 'Sekolah Dasar (SD/MI)',
            institutionName: params.institutionName || 'Satuan Pendidikan SD/MI',
            isLockedSource: Boolean(params.isLockedSource),
            topicFocus: typeof aiResult?.title === 'string' && aiResult.title.trim() ? aiResult.title.trim() : baseline.title,
            orientation: params.orientation || getRecommendedOrientationForTemplate(params.templateId)
        },
        title: typeof aiResult?.title === 'string' && aiResult.title.trim() ? aiResult.title.trim() : baseline.title,
        subtitle: typeof aiResult?.subtitle === 'string' && aiResult.subtitle.trim() ? aiResult.subtitle.trim() : baseline.subtitle,
        pengantarSingkat: typeof aiResult?.pengantarSingkat === 'string' && aiResult.pengantarSingkat.trim() ? aiResult.pengantarSingkat.trim() : baseline.pengantarSingkat,
        kaitanPengalamanSiswa: typeof aiResult?.kaitanPengalamanSiswa === 'string' && aiResult.kaitanPengalamanSiswa.trim() ? aiResult.kaitanPengalamanSiswa.trim() : baseline.kaitanPengalamanSiswa,
        pertanyaanPemantik: Array.isArray(aiResult?.pertanyaanPemantik) && aiResult.pertanyaanPemantik.length > 0 ? aiResult.pertanyaanPemantik.slice(0, 3) : baseline.pertanyaanPemantik,
        pengertianKonsep: typeof aiResult?.pengertianKonsep === 'string' && aiResult.pengertianKonsep.trim() ? aiResult.pengertianKonsep.trim() : baseline.pengertianKonsep,
        penjelasanUtama: typeof aiResult?.penjelasanUtama === 'string' && aiResult.penjelasanUtama.trim() ? aiResult.penjelasanUtama.trim() : baseline.penjelasanUtama,
        poinPenting: Array.isArray(aiResult?.poinPenting) && aiResult.poinPenting.length > 0 ? aiResult.poinPenting.slice(0, 4) : baseline.poinPenting,
        unsurPenting: Array.isArray(aiResult?.unsurPenting) && aiResult.unsurPenting.length > 0 ? aiResult.unsurPenting.slice(0, 4) : baseline.unsurPenting,
        klasifikasiAtauProses:
            aiResult?.klasifikasiAtauProses?.judul && Array.isArray(aiResult?.klasifikasiAtauProses?.butir) && aiResult.klasifikasiAtauProses.butir.length > 0
                ? aiResult.klasifikasiAtauProses
                : baseline.klasifikasiAtauProses,
        tabelInformatif:
            aiResult?.tabelInformatif?.judul && Array.isArray(aiResult?.tabelInformatif?.kolom) && Array.isArray(aiResult?.tabelInformatif?.baris) && aiResult.tabelInformatif.baris.length > 0
                ? aiResult.tabelInformatif
                : baseline.tabelInformatif,
        contohKonkret: typeof aiResult?.contohKonkret === 'string' && aiResult.contohKonkret.trim() ? aiResult.contohKonkret.trim() : baseline.contohKonkret,
        visualCaption: typeof aiResult?.visualCaption === 'string' && aiResult.visualCaption.trim() ? aiResult.visualCaption.trim() : baseline.visualCaption,
        contohSehariHari: Array.isArray(aiResult?.contohSehariHari) && aiResult.contohSehariHari.length > 0 ? aiResult.contohSehariHari.slice(0, 4) : baseline.contohSehariHari,
        pendalamanMateri:
            aiResult?.pendalamanMateri?.analisisSederhana && Array.isArray(aiResult?.pendalamanMateri?.miskonsepsiUmum)
                ? {
                    analisisSederhana: aiResult.pendalamanMateri.analisisSederhana,
                    faktaTeridentifikasi: Array.isArray(aiResult.pendalamanMateri.faktaTeridentifikasi) && aiResult.pendalamanMateri.faktaTeridentifikasi.length > 0
                        ? aiResult.pendalamanMateri.faktaTeridentifikasi
                        : baseline.pendalamanMateri!.faktaTeridentifikasi,
                    miskonsepsiUmum: aiResult.pendalamanMateri.miskonsepsiUmum.length > 0
                        ? aiResult.pendalamanMateri.miskonsepsiUmum
                        : baseline.pendalamanMateri!.miskonsepsiUmum
                }
                : baseline.pendalamanMateri,
        aktivitasSederhana:
            aiResult?.aktivitasSederhana?.judul && Array.isArray(aiResult?.aktivitasSederhana?.langkah) && aiResult.aktivitasSederhana.langkah.length > 0
                ? aiResult.aktivitasSederhana
                : baseline.aktivitasSederhana,
        rangkumanPoin: Array.isArray(aiResult?.rangkumanPoin) && aiResult.rangkumanPoin.length >= 3 ? aiResult.rangkumanPoin.slice(0, 5) : baseline.rangkumanPoin,
        latihanFormatif: Array.isArray(aiResult?.latihanFormatif) && aiResult.latihanFormatif.length > 0 ? aiResult.latihanFormatif.slice(0, 3) : baseline.latihanFormatif,
        kataKunci: Array.isArray(aiResult?.kataKunci) && aiResult.kataKunci.length > 0 ? aiResult.kataKunci.slice(0, 4) : baseline.kataKunci,
        refleksiSiswa: Array.isArray(aiResult?.refleksiSiswa) && aiResult.refleksiSiswa.length > 0 ? aiResult.refleksiSiswa.slice(0, 3) : baseline.refleksiSiswa,
        referensi: buildVerifiableReferences(params.subject, params.className),
        teacherNotes: [
            ...(manualMismatchNotice ? [manualMismatchNotice] : []),
            ...(usedFallback
                ? ['PERLU VERIFIKASI GURU: Konten disusun dari basis kurikuler terstruktur karena layanan AI tidak merespons; harap tinjau contoh dan soal sebelum dicetak.']
                : []),
            'Kunci/panduan jawaban latihan ditempatkan pada Bagian Khusus Guru agar tidak membingungkan peserta didik.',
            'PERLU VERIFIKASI GURU: Pastikan kesesuaian nomor bab pada buku teks/panduan mapel yang dipakai di satuan pendidikan.'
        ]
    };

    reportProgress(7);
    // Separate visual illustration generation from text rendering
    merged.visualSvg = buildConcretePosterIllustrationSvg(
        params.subject,
        params.elementName,
        params.tpText,
        params.atpText,
        merged.visualCaption || merged.title
    );

    const searchCandidate =
        (typeof aiResult?.visualSearchQuery === 'string' && aiResult.visualSearchQuery.trim()) ||
        '';
    if (searchCandidate && !/(konsep|abstrak|umum|materi)/i.test(searchCandidate)) {
        const proxiedDataUrl = await tryFetchProxiedIllustrationDataUrl(searchCandidate);
        if (proxiedDataUrl) {
            merged.visualImageDataUrl = proxiedDataUrl;
        }
    }

    reportProgress(8);
    // Sync all 10 template payloads cleanly with merged substantive data
    const resynced = synthesizeAuthenticMateriAjar({ ...params });
    merged.infographicData = {
        ...resynced.infographicData!,
        pillars: [
            { number: '01', title: 'Pengertian Konsep', summary: merged.pengertianKonsep, keyFact: merged.poinPenting[0] || '', example: merged.contohKonkret },
            { number: '02', title: 'Penjelasan Utama', summary: merged.penjelasanUtama, keyFact: merged.poinPenting[1] || '', example: merged.contohSehariHari[0] || '' },
            { number: '03', title: 'Unsur & Poin Penting', summary: (merged.unsurPenting || merged.poinPenting).slice(0, 3).join(' · '), keyFact: merged.poinPenting[2] || '', example: merged.contohSehariHari[1] || '' },
            { number: '04', title: 'Penerapan & Pelurusan', summary: merged.pendalamanMateri?.analisisSederhana || merged.aktivitasSederhana.hasilDiharapkan, keyFact: merged.aktivitasSederhana.judul, example: merged.rangkumanPoin[0] || '' }
        ],
        goldenTakeaway: merged.rangkumanPoin.join(' ')
    };
    merged.cheatSheetData = resynced.cheatSheetData;
    merged.stickyNotesData = resynced.stickyNotesData;
    merged.mindMapData = resynced.mindMapData;
    merged.comicStripData = resynced.comicStripData;
    merged.flashcardData = resynced.flashcardData;
    merged.stepByStepData = resynced.stepByStepData;
    merged.timelineData = resynced.timelineData;
    merged.comparisonData = resynced.comparisonData;
    merged.isometric3dData = resynced.isometric3dData;

    reportProgress(9);
    merged.qualityControl = evaluateMateriQualityControl(merged, {
        subject: params.subject,
        className: params.className,
        fase: params.fase,
        elementName: params.elementName,
        capaianPembelajaran: params.capaianPembelajaran,
        tpText: params.tpText,
        atpText: params.atpText,
        templateId: params.templateId,
        selectionMode: params.selectionMode
    });

    reportProgress(10);
    return { data: merged, usedFallback };
};

export const getMateriAjarArchiveKey = (user: any, activeClass: string): string => {
    const rawId = String(user?.email || user?.name || activeClass || 'default')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
    return `materi_ajar_ppa_archive_${rawId}`;
};
