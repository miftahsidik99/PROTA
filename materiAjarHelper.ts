import { CurriculumData, isSameClass, isSameSubject, synthesizeAtpItemsForTp, synthesizeCurriculumProta } from './curriculumHelper';
import { generateGeminiContent } from './geminiClient';

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
        subtitle: 'Materi lengkap',
        description: 'Penyajian materi utuh memadukan data kunci, pilar konsep visual, ilustrasi diagram, dan rangkuman inti.',
        bestFor: 'Pengenalan topik baru secara menyeluruh, literasi terpadu, dan materi multi-konsep.',
        accentHex: '#0f766e',
        surfaceHex: '#f0fdfa'
    },
    {
        id: 'cheat_sheet',
        order: 2,
        name: 'Cheat Sheet',
        subtitle: 'Ringkasan materi',
        description: 'Lembar contekan belajar padat berisi rumus inti, kaidah bahasa, definisi penting, dan tips anti-keliru.',
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
        bestFor: 'Bahasa Indonesia, Bahasa Daerah/Sunda, Bahasa Inggris, PAI, dan pendidikan karakter.',
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

export interface GeneratedMateriAjarData {
    id: string;
    createdAt: string;
    templateId: MateriTemplateId;
    selectionMode: 'rekomendasi' | 'manual';
    recommendationReason?: string;
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
    title: string;
    subtitle: string;
    pemahamanBermakna: string;
    pertanyaanPemantik: string[];
    kataKunci: { term: string; meaning: string }[];
    ringkasanKonsepInti: string;
    aktivitasPembelajaran: {
        tahap: string;
        kegiatan: string;
    }[];
    latihanFormatif: {
        no: number;
        pertanyaan: string;
        kunciSingkat: string;
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

    // 1. Chronology / History / Evolution -> Timeline (use strict word boundaries)
    if (/\b(sejarah|kronologi|zaman|kemerdekaan|proklamasi|kerajaan|masa lalu|perjuangan|kisah nabi|riwayat|periode sejarah|era|dinasti|abad|praaksara)\b/.test(focusText)) {
        return {
            recommendedId: 'timeline',
            reason: `Fokus TP/ATP memuat unsur kronologi, peristiwa bersejarah, atau alur waktu pada ${subject}, sehingga Timeline paling efektif membantu siswa memahami urutan kejadian dan dampaknya.`,
            alternatives: [
                makeAlt('comic_strip', 'Mengubah kisah sejarah/tokoh menjadi cerita bergambar yang mudah dihayati siswa SD.'),
                makeAlt('educational_infographic', 'Menyajikan ringkasan lengkap peristiwa beserta fakta-fakta penting.')
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
            reason: `Fokus materi pada ${elementName} membahas struktur objek ruang atau sistem visual nyata, sehingga Isometric 3D memberikan gambaran bentuk, bagian, dan keterkaitan spasial secara konkret.`,
            alternatives: [
                makeAlt('mind_map', 'Memetakan fungsi tiap bagian objek/organ secara sistematis.'),
                makeAlt('educational_infographic', 'Memberikan penjelasan naratif lengkap mendampingi gambar objek.')
            ]
        };
    }

    // 3. Comparisons / Differences / Classifications -> Comparison Chart
    if (/\b(membedakan|perbedaan|persamaan|membandingkan|klasifikasi|wujud zat|hak dan kewajiban|positif dan negatif|kelebihan|kekurangan|loma dan lemes)\b/.test(focusText)) {
        return {
            recommendedId: 'comparison_chart',
            reason: `Fokus kompetensi menuntut siswa membandingkan ciri, perbedaan, dan persamaan dua konsep atau lebih, sehingga Comparison Chart paling cepat mempertajam analisis siswa.`,
            alternatives: [
                makeAlt('mind_map', 'Mengelompokkan kategori konsep ke dalam cabang-cabang visual.'),
                makeAlt('flashcard', 'Menguji ketepatan siswa membedakan kedua konsep melalui kartu soal.')
            ]
        };
    }

    // 4. Math Formulas / Numbers / Rules / Grammar -> Cheat Sheet (check before "soal cerita")
    if (subjLower.includes('matematika') || /\b(bilangan|pecahan|operasi hitung|perkalian|pembagian|keliling|luas|satuan|rumus|kaidah|ejaan|tanda baca)\b/.test(focusText)) {
        return {
            recommendedId: 'cheat_sheet',
            reason: `Kompetensi ${subject} pada fokus ini memerlukan kejelasan rumus, aturan hitung, dan contoh langkah cepat. Cheat Sheet merangkumnya dalam lembar referensi super ringkas.`,
            alternatives: [
                makeAlt('step_by_step', 'Memecah cara penyelesaian soal hitungan secara bertahap.'),
                makeAlt('flashcard', 'Membantu latihan cepat hafalan konsep dasar atau perkalian.')
            ]
        };
    }

    // 5. Stories / Dialogues / Literature / Regional Language (Sunda) -> Comic Strip
    if (subjLower.includes('sunda') || subjLower.includes('daerah') || /\b(cerita|dongeng|dongéng|sasakala|fabel|dialog|percakapan|paguneman|amanat|tokoh|si kabayan)\b/.test(focusText)) {
        return {
            recommendedId: 'comic_strip',
            reason: `Materi ${subject} pada elemen ${elementName} kaya akan konteks komunikasi, cerita, dan teladan budaya. Comic Strip menghidupkan dialog alami agar siswa SD cepat memahami makna.`,
            alternatives: [
                makeAlt('sticky_notes', 'Mencatat poin sikap baik dan kosakata kunci dalam catatan ringkas.'),
                makeAlt('flashcard', 'Melatih hafalan kosakata atau undak-usuk basa secara aktif.')
            ]
        };
    }

    // 6. Procedures / Algorithms / Experiments / Movement Steps / Worship -> Step-by-Step
    if (/\b(algoritma|koding|coding|dekomposisi|pola gerak|gerak dasar|senam|lokomotor|eksperimen|percobaan|praktik|tata cara|wudhu|wudu|salat|prosedur|teks prosedur|merangkai)\b/.test(combined)) {
        return {
            recommendedId: 'step_by_step',
            reason: `Fokus TP/ATP menekankan penguasaan tahapan kerja, prosedur, atau keterampilan praktik pada ${subject}. Template Step-by-Step memandu siswa secara runtut tanpa melewatkan detail penting.`,
            alternatives: [
                makeAlt('cheat_sheet', 'Menyediakan ceklis cepat syarat dan aturan keselamatan tiap prosedur.'),
                makeAlt('comic_strip', 'Menunjukkan contoh praktik langsung melalui tokoh siswa.')
            ]
        };
    }

    // 7. Vocabulary / Memorization / English / PAI -> Flashcard
    if (subjLower.includes('inggris') || subjLower.includes('agama') || /\b(kosakata|vocabulary|hafalan|arti kata|ayat|surat|doa|asmaul husna|rukun)\b/.test(focusText)) {
        return {
            recommendedId: 'flashcard',
            reason: `Fokus ATP/TP pada ${subject} mengutamakan penguasaan istilah, kosakata, dan ingatan aktif, sehingga Flashcard dua sisi memicu daya ingat siswa jauh lebih efektif.`,
            alternatives: [
                makeAlt('sticky_notes', 'Menampilkan pengingat inti yang mudah ditempel dan dibaca ulang.'),
                makeAlt('comic_strip', 'Menempatkan kosakata/nilai ke dalam percakapan nyata.')
            ]
        };
    }

    // 8. Broad Concept Mapping -> Mind Map
    if (subjLower.includes('ipas') || /\b(hubungan|keterkaitan|sistem|ragam|komponen|bagian|unsur|faktor)\b/.test(focusText)) {
        return {
            recommendedId: 'mind_map',
            reason: `Elemen ${elementName} menghubungkan beberapa sub-konsep sekaligus, sehingga Mind Map memudahkan siswa melihat gambaran besar dan cabang hubungannya dalam satu pandangan.`,
            alternatives: [
                makeAlt('educational_infographic', 'Menambah kedalaman penjelasan data dan ilustrasi tiap cabang.'),
                makeAlt('comparison_chart', 'Memperjelas perbedaan antar komponen di dalam sistem.')
            ]
        };
    }

    // 9. Civic / Reminders -> Sticky Notes
    if (subjLower.includes('pancasila') || subjLower.includes('ppkn')) {
        return {
            recommendedId: 'sticky_notes',
            reason: `Materi ${subject} berisi poin-poin nilai, aturan, dan contoh perilaku penting yang cocok disajikan lewat Sticky Notes agar mudah diingat siswa sebagai pedoman harian.`,
            alternatives: [
                makeAlt('comic_strip', 'Mengilustrasikan penerapan sila Pancasila dalam situasi kelas/rumah.'),
                makeAlt('educational_infographic', 'Merangkum materi lengkap secara terstruktur.')
            ]
        };
    }

    // 10. Default comprehensive -> Educational Infographic
    return {
        recommendedId: 'educational_infographic',
        reason: `Fokus ATP/TP pada ${subject} (${elementName}) membutuhkan sajian materi utuh yang memadukan konsep inti, data visual, dan contoh kontekstual dalam format Educational Infographic.`,
        alternatives: [
            makeAlt('mind_map', 'Untuk melihat peta keterkaitan antar sub-konsep secara cepat.'),
            makeAlt('cheat_sheet', 'Untuk meringkas poin penting menjadi lembar belajar ringkas.')
        ]
    };
};

const isBahasaSundaTopic = (subject: string, cp: string, tp: string): boolean => {
    const txt = `${subject} ${cp} ${tp}`.toLowerCase();
    return txt.includes('sunda') || txt.includes('aksara sunda') || txt.includes('pupuh') || txt.includes('kawih') || txt.includes('muatan lokal (bahasa daerah)');
};

const extractCleanTopicTitle = (tp: string, atp: string, elementName: string, subject: string): string => {
    const raw = (atp || tp || elementName || subject).trim();
    const cleaned = raw
        .replace(/^(peserta didik|siswa)\s+(mampu|dapat|bisa)\s+/i, '')
        .replace(/^(memahami|menjelaskan|mengidentifikasi|menganalisis|mempraktikkan|menerapkan|menunjukkan|mengenal|menyajikan|mengevaluasi)\s+/i, '')
        .replace(/\.$/, '')
        .trim();
    const firstClause = cleaned.split(/[,;]/)[0].trim();
    if (firstClause.length >= 12) {
        return firstClause.charAt(0).toUpperCase() + firstClause.slice(1);
    }
    return `${elementName}: ${subject}`;
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

    const domainTerms = (() => {
        const lower = `${subject} ${elementName} ${tpText} ${atpText}`.toLowerCase();
        if (isSunda) {
            return [
                { term: 'Undak-usuk Basa', meaning: 'Tatacara ngagunakeun basa Sunda nu merenah luyu jeung lawan nyarita (lemes jeung loma).' },
                { term: 'Kecap Rajékan / Pupuh', meaning: 'Wangun kecap atawa puisi tradisional Sunda anu ngandung wirahma jeung piwuruk kahirupan.' },
                { term: 'Kalimah Wawaran', meaning: 'Kalimah anu eusina méré béja atawa katerangan kalayan sopan tur jéntré.' },
                { term: 'Silih Asah, Silih Asih, Silih Asuh', meaning: 'Ajén budaya Sunda pikeun silih tulungan, silih ajénan, jeung diajar babarengan.' }
            ];
        }
        if (lower.includes('matematika') || /(pecahan|bangun|bilangan|satuan|data|luas|keliling)/.test(lower)) {
            return [
                { term: 'Konsep Bilangan / Satuan', meaning: 'Dasar ukuran atau nilai kuantitatif yang dipakai untuk menyatakan jumlah atau besaran.' },
                { term: 'Operasi & Pola', meaning: 'Aturan langkah pengerjaan hitung terstruktur untuk menemukan hasil yang tepat.' },
                { term: 'Representasi Visual', meaning: 'Penyajian masalah angka ke dalam gambar, model, garis bilangan, atau bangun ruang.' },
                { term: 'Verifikasi Hasil', meaning: 'Kebiasaan mengecek ulang jawaban agar logis dan sesuai satuan pada soal.' }
            ];
        }
        if (lower.includes('ipas') || /(alam|energi|tumbuhan|ekosistem|zat|gaya|sejarah)/.test(lower)) {
            return [
                { term: 'Fenomena Alam / Sosial', meaning: 'Kejadian nyata di lingkungan sekitar yang dapat diamati dan diselidiki sebab-akibatnya.' },
                { term: 'Komponen Utama', meaning: 'Bagian-bagian penyusun sistem yang saling bekerja sama menjaga keseimbangan.' },
                { term: 'Hubungan Sebab-Akibat', meaning: 'Keterkaitan logis antara perubahan suatu kondisi dengan dampak yang ditimbulkannya.' },
                { term: 'Penerapan Berkelanjutan', meaning: 'Sikap bijak menjaga alam dan lingkungan sosial berdasarkan pemahaman ilmiah.' }
            ];
        }
        if (lower.includes('pancasila') || lower.includes('ppkn')) {
            return [
                { term: 'Nilai Luhur Pancasila', meaning: 'Pedoman sikap ketuhanan, kemanusiaan, persatuan, musyawarah, dan keadilan sosial.' },
                { term: 'Hak & Kewajiban', meaning: 'Keseimbangan antara sesuatu yang patut diterima dengan tanggung jawab yang wajib dilaksanakan.' },
                { term: 'Musyawarah Mufakat', meaning: 'Cara mengambil keputusan bersama dengan saling menghargai pendapat seluruh anggota.' },
                { term: 'Toleransi & Gotong Royong', meaning: 'Kerja sama tulus di tengah keberagaman budaya, agama, dan kebiasaan di sekolah/rumah.' }
            ];
        }
        if (lower.includes('inggris')) {
            return [
                { term: 'Key Vocabulary (Kosakata Inti)', meaning: 'Kata-kata utama bahasa Inggris yang sering dipakai pada konteks kehidupan sehari-hari.' },
                { term: 'Expression Pattern (Pola Ungkapan)', meaning: 'Susunan kalimat sederhana yang sopan untuk menyapa, bertanya, atau memberi informasi.' },
                { term: 'Pronunciation & Meaning', meaning: 'Cara pelafalan yang tepat beserta padanan makna dalam Bahasa Indonesia.' },
                { term: 'Contextual Dialogue', meaning: 'Penggunaan ungkapan secara alami saat bercakap-cakap dengan teman atau guru.' }
            ];
        }
        if (lower.includes('pjok')) {
            return [
                { term: 'Pemanasan (Warming Up)', meaning: 'Gerakan awal untuk menyiapkan otot dan sendi agar aman dan terhindar dari cedera.' },
                { term: 'Teknik Gerak Inti', meaning: 'Posisi tubuh, koordinasi mata-tangan/kaki, dan keseimbangan yang benar saat bergerak.' },
                { term: 'Sportivitas', meaning: 'Sikap jujur, menaati aturan permainan, menghargai lawan, dan bekerja sama dalam tim.' },
                { term: 'Pendinginan (Cooling Down)', meaning: 'Gerakan santai pasca olahraga untuk menormalkan napas dan detak jantung.' }
            ];
        }
        return [
            { term: 'Gagasan Pokok', meaning: 'Inti informasi utama yang menjadi dasar pembahasan dalam topik pembelajaran.' },
            { term: 'Bukti & Contoh Nyata', meaning: 'Ilustrasi situasi sehari-hari yang membuktikan dan memperjelas konsep yang dipelajari.' },
            { term: 'Keterampilan Proses', meaning: 'Langkah mengamati, menanya, mengolah informasi, dan menyajikan kesimpulan dengan jelas.' },
            { term: 'Makna & Penerapan', meaning: 'Manfaat langsung materi pelajaran bagi kebiasaan belajar dan sikap peserta didik.' }
        ];
    })();

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
        title: isSunda
            ? `Bahan Ajar Basa Sunda: ${topicTitle}`
            : `Materi Ajar ${subject}: ${topicTitle}`,
        subtitle: `Disusun berdasarkan hirarki PPA Kurikulum Merdeka (${elementName}) untuk ${className} (${fase})`,
        pemahamanBermakna: isSunda
            ? `Ku ngawasa materi "${topicTitle}", murid ${className} henteu ngan ukur apal kana téori basa, tapi ogé bisa ngagunakeun basa Sunda anu merenah, sopan, tur nyaah kana budaya lokal dina kahirupan sapopoé.`
            : `Dengan memahami "${topicTitle}", peserta didik ${className} mampu menghubungkan konsep pada elemen ${elementName} dengan situasi nyata di lingkungan rumah, sekolah, dan masyarakat secara mandiri serta bernalar kritis.`,
        pertanyaanPemantik: isSunda
            ? [
                `Kumaha cara nyarita anu sopan ka kolot atawa ka guru dina basa Sunda?`,
                `Naon waé conto kecap atawa kajadian dina kahirupan sapopoé anu patali jeung "${topicTitle}"?`,
                `Naha urang kudu ngalestarikeun basa jeung budaya Sunda ti keur leutik kénéh?`
            ]
            : [
                `Pernahkah kalian menjumpai peristiwa di sekitar rumah atau sekolah yang berkaitan dengan ${topicTitle}?`,
                `Mengapa kita perlu memahami konsep pada elemen ${elementName} dengan urutan yang benar?`,
                `Bagaimana cara menerapkan pemahaman ini untuk membantu memecahkan masalah sehari-hari?`
            ],
        kataKunci: domainTerms,
        ringkasanKonsepInti: isSunda
            ? `Materi ieu museur kana Tujuan Pembelajaran (TP): "${tpText}". Dina Alur Tujuan Pembelajaran (ATP): "${shortFocus}", murid diajak pikeun mikawanoh harti kecap, struktur ungkara, sarta prakték komunikasi basa Sunda anu luyu jeung tatakrama.`
            : `Materi ajar ini berfokus pada pencapaian TP: "${tpText}" melalui alur belajar "${shortFocus}". Peserta didik membangun pemahaman mulai dari pengenalan konsep inti, analisis contoh kontekstual, hingga praktik pemecahan masalah sesuai tahap perkembangan ${className}.`,
        aktivitasPembelajaran: isSunda
            ? [
                { tahap: '1. Niténan & Maca (Eksplorasi)', kegiatan: `Murid maca atawa ngaregepkeun conto wacana pondok ngeunaan ${topicTitle} kalayan bimbingan guru.` },
                { tahap: '2. Sawala & Tanya Jawab (Elaborasi)', kegiatan: 'Murid babarengan néangan kecap-kecap penting jeung hartina dina kelompok leutik.' },
                { tahap: '3. Prakték & Refléksi (Aplikasi)', kegiatan: 'Murid nyusun kalimah atawa dialog basajan maké basa Sunda anu sopan tur merenah.' }
            ]
            : [
                { tahap: '1. Memahami (Stimulus & Eksplorasi)', kegiatan: `Peserta didik mengamati visual materi ${topicTitle} dan mengidentifikasi gagasan utama berdasarkan pertanyaan pemantik.` },
                { tahap: '2. Mengaplikasi (Latihan Terbimbing)', kegiatan: `Peserta didik bekerja dalam kelompok kecil untuk menyelesaikan tantangan berbasis ${atpText || tpText}.` },
                { tahap: '3. Merefleksi (Umpan Balik PPA)', kegiatan: 'Peserta didik menyimpulkan temuan kunci dan menuliskan bagian yang sudah dikuasai maupun yang perlu pendalaman.' }
            ],
        latihanFormatif: isSunda
            ? [
                { no: 1, pertanyaan: `Jéntrékeun ku basa sorangan naon maksud utama tina materi "${topicTitle}"!`, kunciSingkat: 'Nyaritakeun eusi poko materi maké kalimah basa Sunda anu bener jeung sopan.' },
                { no: 2, pertanyaan: `Tuliskeun 2 conto kecap atawa kalimah basa Sunda anu luyu jeung conto dina bahan ajar ieu!`, kunciSingkat: 'Conto kalimah merenah luyu jeung undak-usuk basa pikeun ka kolot atawa babaturan.' },
                { no: 3, pertanyaan: `Kumaha sikep urang sangkan basa Sunda tetep dipaké dina kahirupan sapopoé?`, kunciSingkat: 'Ngabiasakeun nyarita ku basa Sunda di imah jeung di sakola kalayan reueus.' }
            ]
            : [
                { no: 1, pertanyaan: `Jelaskan dengan bahasamu sendiri pengertian inti dari materi "${topicTitle}"!`, kunciSingkat: `Siswa mampu menyebutkan gagasan utama elemen ${elementName} secara runtut dan tepat.` },
                { no: 2, pertanyaan: `Sebutkan 2 contoh penerapan nyata "${topicTitle}" yang dapat kamu temukan di sekolah atau rumah!`, kunciSingkat: 'Dua contoh konkret yang relevan dengan konteks keseharian siswa SD.' },
                { no: 3, pertanyaan: isLowerGrade ? `Tuliskan satu hal baru yang paling kamu sukai dari pelajaran hari ini!` : `Mengapa langkah atau aturan pada materi ini penting dilakukan secara berurutan? Jelaskan alasanmu!`, kunciSingkat: isLowerGrade ? 'Siswa menyebutkan satu konsep/contoh baru dengan kalimat sederhana.' : 'Siswa menjelaskan hubungan sebab-akibat pentingnya keteraturan konsep untuk mencegah kesalahan.' }
            ],
        refleksiSiswa: isSunda
            ? [
                'Bagian mana tina bahan ajar ieu anu paling gampang dipikaharti ku kuring?',
                'Kecap atawa materi naon anu kénéh perlu ditanyakeun ka Ibu/Bapa Guru?'
            ]
            : [
                'Saya sudah memahami ide utama dan contoh materi hari ini dengan baik.',
                'Satu hal yang masih ingin saya tanyakan atau pelajari lebih lanjut adalah...'
            ]
    };

    // Populate template-specific payload for EVERY template cleanly
    if (templateId === 'educational_infographic') {
        baseData.infographicData = {
            heroStatLabel: 'Fokus Jam Pelajaran & Cakupan',
            heroStatValue: alokasiWaktu || '3 JP · Terintegrasi PPA',
            heroNote: `Mengacu langsung pada CP Elemen "${elementName}" jenjang ${className}`,
            pillars: [
                {
                    number: '01',
                    title: 'Konsep Dasar & Makna',
                    summary: `Memahami fondasi utama dari ${topicTitle} sesuai tuntutan Capaian Pembelajaran ${fase}.`,
                    keyFact: domainTerms[0]?.meaning || 'Pondasi pemahaman awal siswa.',
                    example: isSunda ? 'Conto: Ngagunakeun kecap lemes "pun bapa" atawa "wilujeng énjing" ka guru.' : `Contoh nyata pada ${subject} di lingkungan kelas dan keluarga.`
                },
                {
                    number: '02',
                    title: 'Struktur & Unsur Penting',
                    summary: `Mengenali bagian-bagian pokok yang membangun topik ${topicTitle} secara utuh.`,
                    keyFact: domainTerms[1]?.meaning || 'Unsur pembentuk materi saling melengkapi.',
                    example: `Hubungan antara ${domainTerms[0]?.term} dan ${domainTerms[1]?.term} dalam praktik.`
                },
                {
                    number: '03',
                    title: 'Langkah Analisis & Praktik',
                    summary: `Menerapkan ${shortFocus} melalui pengamatan, diskusi, dan latihan terbimbing.`,
                    keyFact: domainTerms[2]?.meaning || 'Latihan bertahap memperkuat pemahaman.',
                    example: 'Dilakukan lewat pengamatan contoh konkret sebelum mengerjakan soal mandiri.'
                },
                {
                    number: '04',
                    title: 'Sikap & Manfaat Nyata',
                    summary: `Menjadikan pemahaman ${topicTitle} sebagai kebiasaan positif dan keterampilan hidup.`,
                    keyFact: domainTerms[3]?.meaning || 'Ilmu bermanfaat saat diamalkan sehari-hari.',
                    example: 'Mampu menjelaskan kembali kepada teman atau orang tua dengan percaya diri.'
                }
            ],
            goldenTakeaway: `Inti Pembelajaran PPA: Kuasai konsep dasar terlebih dahulu, pahami keterkaitannya melalui contoh nyata, lalu uji kemampuanmu lewat latihan formatif!`
        };
    } else if (templateId === 'cheat_sheet') {
        baseData.cheatSheetData = {
            quickOverview: `Lembar ringkas siap belajar untuk menguasai "${topicTitle}" (${alokasiWaktu}). Baca cepat bagian Rumus/Aturan Kunci sebelum latihan!`,
            boxes: [
                {
                    title: 'Definisi & Kata Kunci Utama',
                    category: 'Konsep Inti',
                    items: domainTerms.map(t => `${t.term}: ${t.meaning}`),
                    formulaOrRule: `Fokus TP: ${tpText}`
                },
                {
                    title: 'Aturan Emas & Pola Cepat',
                    category: 'Strategi Paham',
                    items: [
                        `Mulai dengan mengidentifikasi tujuan utama pada ${elementName}.`,
                        `Perhatikan kata penanda atau satuan penting di dalam soal/wacana.`,
                        `Hubungkan informasi baru dengan pengalaman sehari-hari siswa ${className}.`,
                        `Selalu periksa kesesuaian jawaban dengan pertanyaan sebelum menyimpulkan.`
                    ],
                    formulaOrRule: isSunda
                        ? 'Rumus Basa: Saha nu nyarita + Ka saha nyaritana = Pilih Basa Loma / Lemes!'
                        : `Alur Cepat: Amati Data/Teks → Terapkan Konsep → Cek Kembali Hasilnya`
                },
                {
                    title: 'Contoh Kasus & Penyelesaian Singkat',
                    category: 'Contoh Cepat',
                    items: [
                        isSunda
                            ? 'Conto 1: "Punten Pa, abdi badé naroskeun pancén dinten ieu." (Basa lemes ka guru).'
                            : `Contoh 1: Mengidentifikasi ciri utama ${topicTitle} dari gambar atau teks singkat.`,
                        isSunda
                            ? 'Conto 2: "Hayu urang diajar babarengan di perpustakaan!" (Basa loma ka babaturan).'
                            : `Contoh 2: Menerapkan langkah ${atpText || tpText} pada situasi sehari-hari di kelas.`
                    ]
                },
                {
                    title: 'Ceklis Siap Asesmen PPA',
                    category: 'Target Kuasai',
                    items: [
                        `Mampu menjelaskan ulang pengertian ${topicTitle} tanpa menyalin persis buku.`,
                        `Mampu memberi minimal 2 contoh benar yang relevan.`,
                        `Mampu menjawab 3 soal latihan formatif dengan teliti.`
                    ]
                }
            ],
            commonMistakes: [
                {
                    mistake: 'Langsung menghafal istilah atau rumus tanpa memahami konteks penggunaannya.',
                    correction: 'Baca contoh nyata terlebih dahulu agar tahu kapan konsep tersebut digunakan.'
                },
                {
                    mistake: 'Terburu-buru menjawab tanpa memperhatikan rincian soal atau instruksi ATP.',
                    correction: 'Garis bawahi kata kunci soal dan cocokkan dengan aturan emas di Cheat Sheet.'
                }
            ]
        };
    } else if (templateId === 'sticky_notes') {
        baseData.stickyNotesData = {
            boardTopic: `Papan Catatan Penting: ${topicTitle}`,
            notes: [
                {
                    title: 'Catatan 1: Apa Itu?',
                    tag: 'Definisi Inti',
                    colorTheme: 'amber',
                    content: `${tpText}`,
                    reminder: `Ingat kata kunci: ${domainTerms[0]?.term || topicTitle}`
                },
                {
                    title: 'Catatan 2: Mengapa Penting?',
                    tag: 'Makna Belajar',
                    colorTheme: 'sky',
                    content: baseData.pemahamanBermakna,
                    reminder: 'Selalu kaitkan dengan pengalamanmu di rumah dan sekolah!'
                },
                {
                    title: 'Catatan 3: Poin Wajib Tahu',
                    tag: 'Fokus ATP',
                    colorTheme: 'emerald',
                    content: `${atpText || shortFocus} (${alokasiWaktu}). Perhatikan urutan atau syarat utama agar pemahamanmu utuh.`,
                    reminder: 'Jangan loncati tahap dasar sebelum paham benar.'
                },
                {
                    title: 'Catatan 4: Contoh Nyata',
                    tag: 'Aplikasi',
                    colorTheme: 'rose',
                    content: isSunda
                        ? 'Dina paguneman sapopoé, gunakeun kecap "punten", "hatur nuhun", jeung "mangga" sangkan sopan.'
                        : `Bayangkan kamu mempraktikkan ${topicTitle} saat membantu orang tua, berdiskusi kelompok, atau mengamati lingkungan sekitar.`,
                    reminder: 'Coba ceritakan satu contoh versimu sendiri!'
                },
                {
                    title: 'Catatan 5: Trik Ingat Cepat',
                    tag: 'Tips Belajar',
                    colorTheme: 'violet',
                    content: `Ucapkan kembali 3 kata kunci: ${domainTerms.slice(0, 3).map(d => d.term).join(' · ')}.`,
                    reminder: 'Ulangi 5 menit sebelum tidur agar menempel kuat di ingatan.'
                }
            ]
        };
    } else if (templateId === 'mind_map') {
        baseData.mindMapData = {
            centralNode: topicTitle.length > 36 ? topicTitle.slice(0, 34) + '…' : topicTitle,
            centralSubtitle: `${subject} · ${className}`,
            branches: [
                {
                    title: '1. Pengertian & Tujuan',
                    colorHex: '#0284c7',
                    keywords: ['Definisi Pokok', elementName, 'Makna Belajar'],
                    explanation: `Menjelaskan inti kompetensi yang dituju pada TP: ${tpText}`
                },
                {
                    title: '2. Unsur & Konsep Kunci',
                    colorHex: '#059669',
                    keywords: domainTerms.slice(0, 3).map(d => d.term),
                    explanation: `Komponen utama yang membangun pemahaman ${topicTitle} secara menyeluruh.`
                },
                {
                    title: '3. Langkah / Alur ATP',
                    colorHex: '#7c3aed',
                    keywords: ['Amati', 'Pahami', 'Praktikkan', alokasiWaktu],
                    explanation: `Rangkaian kegiatan belajar: ${atpText || shortFocus}`
                },
                {
                    title: '4. Contoh Kontekstual',
                    colorHex: '#d97706',
                    keywords: ['Di Sekolah', 'Di Rumah', 'Masyarakat'],
                    explanation: isSunda
                        ? 'Conto nyata ngagunakeun basa Sunda dina paguneman kulawarga jeung babaturan sakola.'
                        : `Penerapan langsung ${topicTitle} dalam aktivitas keseharian siswa ${className}.`
                },
                {
                    title: '5. Evaluasi & Sikap',
                    colorHex: '#e11d48',
                    keywords: ['Mandiri', 'Bernalar Kritis', 'Refleksi'],
                    explanation: 'Mengukur ketercapaian belajar melalui soal formatif dan pembiasaan sikap baik.'
                }
            ]
        };
    } else if (templateId === 'comic_strip') {
        baseData.comicStripData = isSunda
            ? {
                storyTitle: `Diajar ${topicTitle} Bareng Dadan jeung Neng Sari`,
                setting: 'Di buruan sakola jeung di jero kelas nu asri',
                panels: [
                    {
                        panelNo: 1,
                        sceneTitle: 'Pagi di Sakola',
                        characterLeft: 'Dadan',
                        characterRight: 'Neng Sari',
                        dialogueLeft: 'Wilujeng énjing, Sari! Dinten ieu urang diajar ngeunaan naon nya?',
                        dialogueRight: 'Wilujeng énjing, Dan! Ibu Guru bade ngajarkeun materi penting ngeunaan budaya jeung basa Sunda.',
                        narration: 'Dadan jeung Sari sasalaman kalayan sopan saméméh asup ka kelas.',
                        mood: 'happy'
                    },
                    {
                        panelNo: 2,
                        sceneTitle: 'Patarosan Panasaran',
                        characterLeft: 'Dadan',
                        characterRight: 'Ibu Guru',
                        dialogueLeft: `Bu, naon sih ari poko bahasan "${topicTitle}" téh?`,
                        dialogueRight: `Patarosan alus, Dan! Ieu téh patali jeung cara urang ngagunakeun basa nu merenah dina kahirupan sapopoé.`,
                        narration: 'Ibu Guru muka bahan ajar Kurikulum Merdeka kalayan sumanget.',
                        mood: 'curious'
                    },
                    {
                        panelNo: 3,
                        sceneTitle: 'Conto Kahirupan Nyata',
                        characterLeft: 'Ibu Guru',
                        characterRight: 'Neng Sari',
                        dialogueLeft: `Upamana lamun nyarita ka kolot atawa ka guru, urang kudu maké basa lemes nu sopan.`,
                        dialogueRight: `Oh kitu! Sapertos kecap "punten", "hatur nuhun", jeung "mangga" nya, Bu?`,
                        narration: `Murid-murid nyatet conto kecap jeung alur materi: ${shortFocus}.`,
                        mood: 'explain'
                    },
                    {
                        panelNo: 4,
                        sceneTitle: 'Siap Ngamalkeun!',
                        characterLeft: 'Dadan',
                        characterRight: 'Neng Sari',
                        dialogueLeft: 'Ayeuna abdi ngartos pisan! Hayu urang biasakeun nyarita basa Sunda nu saé unggal dinten.',
                        dialogueRight: 'Satuju pisan, Dan! Basa téh cicirén bangsa jeung budaya urang.',
                        narration: 'Sakabéh murid kelas ngarasa reueus tur gumbira diajar basa Sunda.',
                        mood: 'eureka'
                    }
                ],
                moralLesson: 'Ngalestarikeun basa Sunda dimimitian ku sikep sopan, soméah, jeung wanoh kana maknana unggal poé.'
            }
            : {
                storyTitle: `Petualangan Belajar: Memahami ${topicTitle}`,
                setting: `Ruang Kelas ${className} dan Halaman Sekolah`,
                panels: [
                    {
                        panelNo: 1,
                        sceneTitle: 'Menemukan Masalah',
                        characterLeft: 'Raka',
                        characterRight: 'Sinta',
                        dialogueLeft: `Sinta, lihat! Bagaimana ya cara kita menjelaskan tentang ${topicTitle}?`,
                        dialogueRight: `Ayo kita amati petunjuknya bersama-sama supaya tidak salah paham, Raka!`,
                        narration: `Raka dan Sinta membuka catatan materi ${subject} pada elemen ${elementName}.`,
                        mood: 'curious'
                    },
                    {
                        panelNo: 2,
                        sceneTitle: 'Penjelasan Konsep Inti',
                        characterLeft: 'Bu Guru',
                        characterRight: 'Raka',
                        dialogueLeft: `Anak-anak, kunci utamanya adalah ${domainTerms[0]?.term}: ${domainTerms[0]?.meaning}`,
                        dialogueRight: `Oh, jadi kita harus paham dasarnya dulu sebelum mencoba soal ya, Bu?`,
                        narration: 'Bu Guru memberi contoh sederhana yang dekat dengan kehidupan siswa SD.',
                        mood: 'explain'
                    },
                    {
                        panelNo: 3,
                        sceneTitle: 'Mencoba Langkah Nyata',
                        characterLeft: 'Sinta',
                        characterRight: 'Raka',
                        dialogueLeft: `Lihat Raka! Kalau mengikuti alur "${shortFocus.slice(0, 70)}", hasilnya jadi jelas!`,
                        dialogueRight: `Betul sekali! Ternyata mudah kalau langkahnya urut dan teliti.`,
                        narration: 'Keduanya bekerja sama menguji pemahaman dengan contoh konkret.',
                        mood: 'happy'
                    },
                    {
                        panelNo: 4,
                        sceneTitle: 'Berhasil & Siap Berbagi',
                        characterLeft: 'Raka',
                        characterRight: 'Sinta',
                        dialogueLeft: `Aku sudah paham sekarang! Yuk kita kerjakan latihan formatifnya dengan percaya diri.`,
                        dialogueRight: `Ayo! Jangan lupa periksa lagi jawaban kita sebelum dikumpulkan.`,
                        narration: `Belajar ${subject} menjadi seru saat konsepnya terhubung dengan dunia nyata.`,
                        mood: 'eureka'
                    }
                ],
                moralLesson: `Memahami ${topicTitle} akan terasa mudah jika dimulai dari rasa ingin tahu, pengamatan teliti, dan kerja sama yang baik.`
            };
    } else if (templateId === 'flashcard') {
        baseData.flashcardData = {
            deckTitle: `Dek Kartu Hafalan & Latihan: ${topicTitle}`,
            studyTip: 'Baca sisi depan kartu terlebih dahulu, jawab di dalam hati selama 5 detik, lalu cocokkan dengan sisi belakang!',
            cards: [
                {
                    cardNo: 1,
                    category: 'Konsep Dasar',
                    frontPrompt: `Apa tujuan utama belajar "${topicTitle}" pada elemen ${elementName}?`,
                    hint: `Ingat Capaian Pembelajaran ${fase}`,
                    backAnswer: tpText,
                    realExample: `Diterapkan pada kegiatan ${atpText || shortFocus}.`
                },
                ...domainTerms.map((dt, idx) => ({
                    cardNo: idx + 2,
                    category: 'Istilah Kunci',
                    frontPrompt: `Apa yang dimaksud dengan "${dt.term}" dalam materi ${subject}?`,
                    hint: `Kata kunci ke-${idx + 1} pada modul ${className}`,
                    backAnswer: dt.meaning,
                    realExample: isSunda
                        ? 'Dipraktékkeun dina paguneman sopan di imah atawa sakola.'
                        : `Dapat diamati saat diskusi kelas dan pengerjaan LKPD ${subject}.`
                })),
                {
                    cardNo: domainTerms.length + 2,
                    category: 'Uji Pemahaman',
                    frontPrompt: baseData.latihanFormatif[0]?.pertanyaan || `Sebutkan kesimpulan utama dari ${topicTitle}!`,
                    hint: 'Gunakan kata-katamu sendiri yang jelas.',
                    backAnswer: baseData.latihanFormatif[0]?.kunciSingkat || baseData.pemahamanBermakna,
                    realExample: 'Cocokkan jawabanmu dengan catatan inti PPA.'
                }
            ]
        };
    } else if (templateId === 'step_by_step') {
        baseData.stepByStepData = {
            goalStatement: `Menguasai dan menerapkan "${topicTitle}" secara runtut sesuai tuntutan ${tpText}`,
            toolsNeeded: isSunda
                ? ['Buku catetan Basa Sunda', 'Daftar kecap loma & lemes', 'Téks bacaan pondok ti guru']
                : [`Buku catatan ${subject}`, 'Alat tulis & penggaris', 'Lembar pengamatan / contoh nyata di kelas'],
            stages: [
                {
                    stepNo: 1,
                    title: 'Persiapan & Pengamatan Awal',
                    instruction: `Baca tujuan pembelajaran dan amati contoh atau objek terkait ${topicTitle} dengan saksama.`,
                    checkpoint: 'Kamu sudah dapat menyebutkan topik utama yang akan dipelajari.',
                    tip: 'Catat satu pertanyaan tentang hal yang paling membuatmu penasaran.'
                },
                {
                    stepNo: 2,
                    title: 'Mengenali Kata Kunci & Aturan Pokok',
                    instruction: `Pelajari istilah utama (${domainTerms.slice(0, 2).map(d => d.term).join(' dan ')}) beserta maknanya.`,
                    checkpoint: 'Bisa menjelaskan arti istilah inti tanpa melihat buku.',
                    tip: 'Gunakan contoh benda atau situasi di rumah agar lebih mudah diingat.'
                },
                {
                    stepNo: 3,
                    title: 'Menerapkan Alur Inti (ATP)',
                    instruction: `Ikuti kegiatan utama: ${atpText || tpText}. Kerjakan langkah demi langkah secara tenang dan teliti.`,
                    checkpoint: 'Semua tahapan inti selesai dijalankan sesuai urutan yang benar.',
                    tip: 'Jika menemui kesulitan di satu langkah, ulangi contoh sebelumnya.'
                },
                {
                    stepNo: 4,
                    title: 'Pemeriksaan & Uji Latihan',
                    instruction: 'Periksa kembali hasil kerjamu dan selesaikan 3 soal latihan formatif singkat.',
                    checkpoint: 'Tidak ada langkah yang terlewat dan hasil sudah sesuai konteks soal.',
                    tip: 'Diskusikan hasilmu dengan teman sebangku atau guru untuk umpan balik.'
                },
                {
                    stepNo: 5,
                    title: 'Kesimpulan & Pembiasaan',
                    instruction: 'Tuliskan satu kalimat kesimpulan bermakna dan terapkan dalam kegiatan sehari-hari.',
                    checkpoint: 'Siap melangkah ke ATP berikutnya dengan percaya diri!',
                    tip: 'Simpan lembar ini sebagai panduan belajar ulang di rumah.'
                }
            ],
            successIndicator: `Siswa ${className} tuntas apabila mampu menyelesaikan langkah 1 sampai 5 dengan hasil rapi, tepat konsep, dan dapat menjelaskannya kembali.`
        };
    } else if (templateId === 'timeline') {
        baseData.timelineData = {
            timelineTitle: `Garis Waktu Perkembangan & Alur: ${topicTitle}`,
            periodSpan: `${fase} · Urutan Fase Awal hingga Penerapan`,
            events: [
                {
                    orderLabel: 'Tahap 1 · Awal / Latar Belakang',
                    title: 'Munculnya Konsep / Situasi Awal',
                    actorOrContext: `Konteks Dasar ${subject}`,
                    description: `Berawal dari pengenalan keadaan awal sebelum perubahan terjadi, yaitu pemahaman tentang ${domainTerms[0]?.term || topicTitle}.`,
                    impact: 'Menjadi titik mula terbentuknya kebutuhan belajar dan pemahaman.'
                },
                {
                    orderLabel: 'Tahap 2 · Proses / Perkembangan',
                    title: 'Peristiwa & Perubahan Kunci',
                    actorOrContext: `Elemen ${elementName}`,
                    description: `Pada tahap ini unsur-unsur penting mulai berinteraksi dan membentuk pola utama sesuai ${tpText}.`,
                    impact: 'Terlihat perbedaan jelas antara kondisi awal dengan tahap perkembangan.'
                },
                {
                    orderLabel: 'Tahap 3 · Puncak / Titik Penting',
                    title: 'Inti Capaian & Pembuktian',
                    actorOrContext: `${atpText || shortFocus}`,
                    description: `Tahap paling menentukan di mana konsep inti diwujudkan dalam tindakan nyata atau peristiwa bersejarah penting.`,
                    impact: 'Memberikan hasil langsung yang dapat dipelajari manfaatnya.'
                },
                {
                    orderLabel: 'Tahap 4 · Dampak & Masa Kini',
                    title: 'Makna & Pelestarian Masa Depan',
                    actorOrContext: `Kehidupan Siswa ${className}`,
                    description: baseData.pemahamanBermakna,
                    impact: 'Menumbuhkan kesadaran kritis dan sikap tanggung jawab siswa masa kini.'
                }
            ],
            synthesisNote: `Setiap titik pada garis waktu saling terhubung sebab-akibat: memahami tahap awal membuat kita mengerti mengapa kondisi sekarang terbentuk.`
        };
    } else if (templateId === 'comparison_chart') {
        const lower = `${subject} ${tpText} ${atpText}`.toLowerCase();
        let conceptAName = 'Konsep / Kelompok A';
        let conceptBName = 'Konsep / Kelompok B';
        if (isSunda) {
            conceptAName = 'Basa Loma (Ka Babaturan)';
            conceptBName = 'Basa Lemes (Ka Kolot / Guru)';
        } else if (lower.includes('hak') && lower.includes('kewajiban')) {
            conceptAName = 'Hak Peserta Didik';
            conceptBName = 'Kewajiban Peserta Didik';
        } else if (lower.includes('bangun datar') || lower.includes('bangun ruang')) {
            conceptAName = 'Bangun Datar (2 Dimensi)';
            conceptBName = 'Bangun Ruang (3 Dimensi)';
        } else if (lower.includes('wujud') || lower.includes('padat') || lower.includes('cair')) {
            conceptAName = 'Benda Padat';
            conceptBName = 'Benda Cair & Gas';
        } else {
            conceptAName = `Pemahaman Konsep (${domainTerms[0]?.term || 'Teori'})`;
            conceptBName = `Penerapan Praktis (${domainTerms[1]?.term || 'Aplikasi'})`;
        }

        baseData.comparisonData = {
            conceptAName,
            conceptBName,
            similarities: [
                `Keduanya berada dalam ruang lingkup materi ${topicTitle} pada elemen ${elementName}.`,
                `Sama-sama dibutuhkan peserta didik ${className} untuk mencapai TP secara seimbang.`
            ],
            rows: [
                {
                    aspect: 'Pengertian Utama',
                    conceptAValue: `${conceptAName} menekankan pada ciri dasar, struktur, atau kedudukan awal sesuai materi.`,
                    conceptBValue: `${conceptBName} menekankan pada pelaksanaan, pasangan penyeimbang, atau penggunaan konteks yang tepat.`
                },
                {
                    aspect: 'Ciri Pembeda Kunci',
                    conceptAValue: isSunda ? 'Dipaké pikeun babaturan sapantar anu geus akrab.' : 'Memiliki ukuran, sifat, atau fungsi dasar yang bersifat pokok.',
                    conceptBValue: isSunda ? 'Dipaké pikeun hormat ka kolot, guru, atawa jalma anyar.' : 'Menunjukkan hubungan timbal balik, ukuran ruang, atau kondisi lanjutan.'
                },
                {
                    aspect: 'Contoh Nyata di Sekitar',
                    conceptAValue: isSunda ? '"Manéh rék indit ka mana?" / "Abdi dahar heula."' : `Contoh konkret pertama yang sering dijumpai siswa di ruang kelas.`,
                    conceptBValue: isSunda ? '"Bapa badé angkat ka mana?" / "Abdi neda heula."' : `Contoh konkret kedua yang melengkapi penerapan di lingkungan rumah.`
                },
                {
                    aspect: 'Tips Membedakan Cepat',
                    conceptAValue: 'Amati kata kunci utama atau bentuk dasarnya terlebih dahulu.',
                    conceptBValue: 'Perhatikan situasi penggunaan, lawan bicara, atau satuannya.'
                }
            ],
            conclusion: `Membandingkan ${conceptAName} dan ${conceptBName} secara berdampingan membuat kita tidak tertukar saat mengerjakan soal maupun mempraktikkannya.`
        };
    } else if (templateId === 'isometric_3d') {
        const sceneType = pickIsometricSceneType(subject, `${elementName} ${tpText} ${atpText}`);
        const sceneLabelMap: Record<NonNullable<GeneratedMateriAjarData['isometric3dData']>['visualSceneType'], string> = {
            geometry_solid: 'Model Bangun Ruang 3D (Panjang × Lebar × Tinggi)',
            science_ecosystem: 'Model Ruang Ekosistem & Siklus Alam 3D',
            electrical_circuit: 'Model Rangkaian Listrik 3D Interaktif',
            plant_structure: 'Model Struktur Bagian Tumbuhan 3D',
            solar_system: 'Model Orbit & Susunan Tata Surya 3D',
            architecture_model: `Model Struktur Konsep 3D: ${topicTitle}`
        };

        baseData.isometric3dData = {
            objectTitle: sceneLabelMap[sceneType],
            visualSceneType: sceneType,
            dimensionSummary: `Tampilan Isometrik 30° · ${className} (${fase})`,
            parts: [
                {
                    pinNo: 1,
                    partName: sceneType === 'geometry_solid' ? 'Sisi Alas & Dasar' : sceneType === 'plant_structure' ? 'Akar & Penyerap Hara' : sceneType === 'electrical_circuit' ? 'Sumber Energi (Baterai)' : 'Fondasi Konsep Utama',
                    functionOrProperty: 'Bagian penopang utama atau sumber awal sistem bekerja.',
                    measurementOrDetail: domainTerms[0]?.term || 'Dasar sistem'
                },
                {
                    pinNo: 2,
                    partName: sceneType === 'geometry_solid' ? 'Rusuk Tegak & Tinggi' : sceneType === 'plant_structure' ? 'Batang & Pengangkut' : sceneType === 'electrical_circuit' ? 'Penghantar & Sakelar' : 'Jalur Proses Inti (ATP)',
                    functionOrProperty: 'Menghubungkan bagian dasar dengan bagian atas secara terstruktur.',
                    measurementOrDetail: domainTerms[1]?.term || 'Penghubung aktif'
                },
                {
                    pinNo: 3,
                    partName: sceneType === 'geometry_solid' ? 'Sisi Atas & Ruang Isi (Volume)' : sceneType === 'plant_structure' ? 'Daun & Fotosintesis' : sceneType === 'electrical_circuit' ? 'Beban Kerja (Lampu)' : 'Hasil / Output Nyata',
                    functionOrProperty: 'Tempat terjadinya hasil utama atau pengisian ruang menyeluruh.',
                    measurementOrDetail: domainTerms[2]?.term || 'Hasil utama'
                },
                {
                    pinNo: 4,
                    partName: sceneType === 'geometry_solid' ? 'Titik Sudut & Jaring-jaring' : 'Lingkungan Sekitar & Manfaat',
                    functionOrProperty: 'Menjaga keterpaduan bentuk keseluruhan saat dilihat dari segala arah.',
                    measurementOrDetail: domainTerms[3]?.term || 'Keseimbangan penuh'
                }
            ],
            spatialInsight: `Dengan melihat objek secara 3 dimensi (Isometrik), siswa ${className} dapat membayangkan posisi depan, samping, dan atas sekaligus serta memahami fungsi tiap bagian bernomor 1–4.`
        };
    }

    return baseData;
};

/**
 * Generates PPA-compliant Materi Ajar using Gemini AI with automatic structured fallback.
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
}): Promise<{ data: GeneratedMateriAjarData; usedFallback: boolean }> => {
    const baseline = synthesizeAuthenticMateriAjar(params);
    const tplMeta = MATERI_AJAR_TEMPLATES.find(t => t.id === params.templateId) || MATERI_AJAR_TEMPLATES[0];
    const isSunda = isBahasaSundaTopic(params.subject, params.capaianPembelajaran, params.tpText);

    const templateSchemaHint: Record<MateriTemplateId, string> = {
        educational_infographic: `"infographicData": { "heroStatLabel": "...", "heroStatValue": "...", "heroNote": "...", "pillars": [{ "number": "01", "title": "...", "summary": "...", "keyFact": "...", "example": "..." }], "goldenTakeaway": "..." } (isi tepat 4 pillars yang padat dan jelas)`,
        cheat_sheet: `"cheatSheetData": { "quickOverview": "...", "boxes": [{ "title": "...", "category": "...", "items": ["...", "..."], "formulaOrRule": "..." }], "commonMistakes": [{ "mistake": "...", "correction": "..." }] } (isi 4 boxes dan 2 commonMistakes)`,
        sticky_notes: `"stickyNotesData": { "boardTopic": "...", "notes": [{ "title": "...", "tag": "...", "colorTheme": "amber|sky|emerald|rose|violet", "content": "...", "reminder": "..." }] } (isi tepat 5 sticky notes)`,
        mind_map: `"mindMapData": { "centralNode": "...", "centralSubtitle": "...", "branches": [{ "title": "...", "colorHex": "#0284c7", "keywords": ["...", "..."], "explanation": "..." }] } (isi 4-5 branches dengan warna hex kontras berbeda)`,
        comic_strip: `"comicStripData": { "storyTitle": "...", "setting": "...", "panels": [{ "panelNo": 1, "sceneTitle": "...", "characterLeft": "...", "characterRight": "...", "dialogueLeft": "...", "dialogueRight": "...", "narration": "...", "mood": "happy|curious|explain|eureka" }], "moralLesson": "..." } (isi tepat 4 panels berurutan)`,
        flashcard: `"flashcardData": { "deckTitle": "...", "studyTip": "...", "cards": [{ "cardNo": 1, "category": "...", "frontPrompt": "...", "hint": "...", "backAnswer": "...", "realExample": "..." }] } (isi 6 cards bervariasi)`,
        step_by_step: `"stepByStepData": { "goalStatement": "...", "toolsNeeded": ["...", "..."], "stages": [{ "stepNo": 1, "title": "...", "instruction": "...", "checkpoint": "...", "tip": "..." }], "successIndicator": "..." } (isi 5 stages urut)`,
        timeline: `"timelineData": { "timelineTitle": "...", "periodSpan": "...", "events": [{ "orderLabel": "...", "title": "...", "actorOrContext": "...", "description": "...", "impact": "..." }], "synthesisNote": "..." } (isi 4-5 events kronologis)`,
        comparison_chart: `"comparisonData": { "conceptAName": "...", "conceptBName": "...", "similarities": ["...", "..."], "rows": [{ "aspect": "...", "conceptAValue": "...", "conceptBValue": "..." }], "conclusion": "..." } (isi 4-5 rows perbandingan spesifik topik)`,
        isometric_3d: `"isometric3dData": { "objectTitle": "...", "visualSceneType": "geometry_solid|science_ecosystem|electrical_circuit|plant_structure|solar_system|architecture_model", "dimensionSummary": "...", "parts": [{ "pinNo": 1, "partName": "...", "functionOrProperty": "...", "measurementOrDetail": "..." }], "spatialInsight": "..." } (isi 4 parts sesuai topik)`
    };

    const prompt = `Anda adalah Pakar Pengembang Kurikulum Merdeka SD/MI sesuai Panduan Pembelajaran dan Asesmen (PPA) & BSKAP No. 046/H/KR/2025.
Buatlah MATERI AJAR berkualitas tinggi, faktual, ramah anak SD (${params.className}, ${params.fase}), bebas placeholder, dan mengikuti hierarki resmi berikut:
- Mata Pelajaran: ${params.subject}
- Kelas / Fase: ${params.className} (${params.fase})
- Semester / TA: Semester ${params.semester} (${params.academicYear})
- Tingkat Fokus: ${params.focusLevel.toUpperCase()}
- Elemen: ${params.elementName}
- Capaian Pembelajaran (CP): ${params.capaianPembelajaran}
- Tujuan Pembelajaran (TP): ${params.tpText}
- Alur Tujuan Pembelajaran (ATP): ${params.atpText} (${params.alokasiWaktu})
- Gaya Template yang Dipilih: ${tplMeta.name} (${tplMeta.subtitle})

${isSunda ? 'PENTING KHUSUS BAHASA SUNDA: Untuk contoh kalimat, dialog komik, pertanyaan pemantik, dan istilah materi, WAJIB menggunakan Bahasa Sunda yang baik, alami, sesuai undak-usuk basa anak SD (bukan sekadar terjemahan kaku atau petunjuk soal saja)!' : ''}

Kembalikan HANYA JSON murni (tanpa markdown codefence) dengan struktur persis:
{
  "title": "Judul Materi Ajar yang menarik & spesifik",
  "subtitle": "Subjudul singkat sesuai TP/ATP",
  "pemahamanBermakna": "1-2 kalimat pemahaman bermakna PPA",
  "pertanyaanPemantik": ["Pertanyaan 1", "Pertanyaan 2", "Pertanyaan 3"],
  "kataKunci": [{ "term": "Istilah 1", "meaning": "Penjelasan ramah siswa SD" }, { "term": "Istilah 2", "meaning": "..." }, { "term": "Istilah 3", "meaning": "..." }, { "term": "Istilah 4", "meaning": "..." }],
  "ringkasanKonsepInti": "Penjelasan konsep inti 2-3 kalimat yang sangat jelas dan aplikatif",
  "aktivitasPembelajaran": [
    { "tahap": "1. Memahami", "kegiatan": "..." },
    { "tahap": "2. Mengaplikasi", "kegiatan": "..." },
    { "tahap": "3. Merefleksi", "kegiatan": "..." }
  ],
  "latihanFormatif": [
    { "no": 1, "pertanyaan": "...", "kunciSingkat": "..." },
    { "no": 2, "pertanyaan": "...", "kunciSingkat": "..." },
    { "no": 3, "pertanyaan": "...", "kunciSingkat": "..." }
  ],
  "refleksiSiswa": ["Pernyataan refleksi 1", "Pernyataan refleksi 2"],
  ${templateSchemaHint[params.templateId]}
}`;

    try {
        const res = await generateGeminiContent({
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                temperature: 0.55
            }
        });

        const rawText = (res.text || '').trim();
        if (!rawText) throw new Error('Empty AI response');

        const cleanedJson = rawText
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```$/i, '')
            .trim();

        const parsed = JSON.parse(cleanedJson);

        const merged: GeneratedMateriAjarData = {
            ...baseline,
            title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : baseline.title,
            subtitle: typeof parsed.subtitle === 'string' && parsed.subtitle.trim() ? parsed.subtitle.trim() : baseline.subtitle,
            pemahamanBermakna: typeof parsed.pemahamanBermakna === 'string' && parsed.pemahamanBermakna.trim() ? parsed.pemahamanBermakna.trim() : baseline.pemahamanBermakna,
            pertanyaanPemantik: Array.isArray(parsed.pertanyaanPemantik) && parsed.pertanyaanPemantik.length > 0 ? parsed.pertanyaanPemantik : baseline.pertanyaanPemantik,
            kataKunci: Array.isArray(parsed.kataKunci) && parsed.kataKunci.length > 0 ? parsed.kataKunci : baseline.kataKunci,
            ringkasanKonsepInti: typeof parsed.ringkasanKonsepInti === 'string' && parsed.ringkasanKonsepInti.trim() ? parsed.ringkasanKonsepInti.trim() : baseline.ringkasanKonsepInti,
            aktivitasPembelajaran: Array.isArray(parsed.aktivitasPembelajaran) && parsed.aktivitasPembelajaran.length > 0 ? parsed.aktivitasPembelajaran : baseline.aktivitasPembelajaran,
            latihanFormatif: Array.isArray(parsed.latihanFormatif) && parsed.latihanFormatif.length > 0 ? parsed.latihanFormatif : baseline.latihanFormatif,
            refleksiSiswa: Array.isArray(parsed.refleksiSiswa) && parsed.refleksiSiswa.length > 0 ? parsed.refleksiSiswa : baseline.refleksiSiswa
        };

        if (params.templateId === 'educational_infographic' && parsed.infographicData?.pillars?.length) {
            merged.infographicData = parsed.infographicData;
        } else if (params.templateId === 'cheat_sheet' && parsed.cheatSheetData?.boxes?.length) {
            merged.cheatSheetData = parsed.cheatSheetData;
        } else if (params.templateId === 'sticky_notes' && parsed.stickyNotesData?.notes?.length) {
            merged.stickyNotesData = parsed.stickyNotesData;
        } else if (params.templateId === 'mind_map' && parsed.mindMapData?.branches?.length) {
            merged.mindMapData = parsed.mindMapData;
        } else if (params.templateId === 'comic_strip' && parsed.comicStripData?.panels?.length) {
            merged.comicStripData = parsed.comicStripData;
        } else if (params.templateId === 'flashcard' && parsed.flashcardData?.cards?.length) {
            merged.flashcardData = parsed.flashcardData;
        } else if (params.templateId === 'step_by_step' && parsed.stepByStepData?.stages?.length) {
            merged.stepByStepData = parsed.stepByStepData;
        } else if (params.templateId === 'timeline' && parsed.timelineData?.events?.length) {
            merged.timelineData = parsed.timelineData;
        } else if (params.templateId === 'comparison_chart' && parsed.comparisonData?.rows?.length) {
            merged.comparisonData = parsed.comparisonData;
        } else if (params.templateId === 'isometric_3d' && parsed.isometric3dData?.parts?.length) {
            merged.isometric3dData = parsed.isometric3dData;
        }

        return { data: merged, usedFallback: false };
    } catch {
        return { data: baseline, usedFallback: true };
    }
};

export const getMateriAjarArchiveKey = (user: any, activeClass: string): string => {
    const rawId = String(user?.email || user?.name || activeClass || 'default')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
    return `materi_ajar_ppa_archive_${rawId}`;
};
