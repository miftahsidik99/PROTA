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
    // A. HEADER
    title: string;
    subtitle: string;
    // B. PENGANTAR MATERI
    pengantarSingkat: string;
    pertanyaanPemantik: string[];
    // C. INTI MATERI
    pengertianKonsep: string;
    penjelasanUtama: string;
    poinPenting: string[];
    contohKonkret: string;
    visualCaption: string;
    visualSvg?: string;
    visualImageDataUrl?: string;
    // D. CONTOH DALAM KEHIDUPAN SEHARI-HARI
    contohSehariHari: string[];
    // E. AKTIVITAS SISWA
    aktivitasSederhana: {
        judul: string;
        langkah: string[];
        hasilDiharapkan: string;
    };
    // F. RANGKUMAN (3-5 POIN PENTING)
    rangkumanPoin: string[];
    // G. LATIHAN PEMAHAMAN (3 SOAL SEDERHANA)
    latihanFormatif: {
        no: number;
        pertanyaan: string;
        kunciSingkat: string;
    }[];
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

    return baseData;
};

/**
 * Generates one TP/ATP-scoped Educational Infographic Materi Ajar (with concrete illustration + 7-section structure)
 * using Gemini AI with automatic structured fallback & CORS-safe visual illustration resolution.
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

    const prompt = `Bertindaklah sebagai ahli pengembang kurikulum jenjang dikdasmen, ahli pedagogik, penulis materi ajar SD, sekaligus desainer grafis pendidikan profesional.
Kembangkan SATU Tujuan Pembelajaran (TP) / ATP berikut menjadi materi ajar infografis yang informatif, modern, ramah anak usia ${params.className}, dan 100% sesuai ruang lingkup TP (JANGAN memasukkan materi dari TP/ATP berikutnya, JANGAN mengarang fakta, hindari salah ejaan, dan hindari paragraf terlalu panjang).

DATA IDENTITAS KURIKULUM:
- Mata Pelajaran: ${params.subject}
- Kelas & Fase: ${params.className} (${params.fase})
- Elemen: ${params.elementName}
- Capaian Pembelajaran (CP): ${params.capaianPembelajaran}
- Tujuan Pembelajaran (TP): ${params.tpText}
- Fokus ATP: ${params.atpText} (${params.alokasiWaktu})
- Gaya Visual Tambahan: ${tplMeta.name} (${tplMeta.subtitle})

${isSunda ? 'WAJIB KHUSUS BAHASA SUNDA: Gunakan Basa Sunda anu alami, merenah, jeung ramah barudak SD pikeun judul, panganteur, conto paguneman, aktivitas, rangkuman, jeung soal!' : ''}

Kembalikan HANYA JSON valid (tanpa markdown codeblock) sesuai struktur persis ini:
{
  "title": "Judul materi menarik & spesifik TP ini",
  "subtitle": "Subjudul singkat selaras CP/TP",
  "pengantarSingkat": "1-2 kalimat pengantar singkat ramah anak ${params.className}",
  "pertanyaanPemantik": ["Pertanyaan pemantik 1", "Pertanyaan pemantik 2"],
  "pengertianKonsep": "Pengertian konsep singkat, valid ilmiah, dan jelas untuk anak ${params.className}",
  "penjelasanUtama": "Penjelasan inti materi 2-3 kalimat ringkas tanpa paragraf panjang",
  "poinPenting": ["Poin penting 1", "Poin penting 2", "Poin penting 3"],
  "contohKonkret": "1 contoh konkret yang sangat mudah dibayangkan siswa SD Indonesia",
  "visualCaption": "Keterangan singkat ilustrasi pendukung yang konkret dan membantu pemahaman",
  "visualSearchQuery": "2-4 kata kunci pencarian gambar edukatif bahasa Indonesia jika relevan dengan objek nyata (atau kosongkan jika konsep abstrak)",
  "contohSehariHari": [
    "Di Rumah: contoh nyata dekat dengan siswa Indonesia",
    "Di Sekolah: contoh nyata dekat dengan siswa Indonesia",
    "Di Lingkungan Sekitar: contoh nyata dekat dengan siswa Indonesia"
  ],
  "aktivitasSederhana": {
    "judul": "Judul aktivitas sederhana siswa",
    "langkah": ["Langkah 1", "Langkah 2", "Langkah 3"],
    "hasilDiharapkan": "Hasil pemahaman yang dicapai siswa"
  },
  "rangkumanPoin": [
    "Poin rangkuman 1",
    "Poin rangkuman 2",
    "Poin rangkuman 3",
    "Poin rangkuman 4"
  ],
  "latihanFormatif": [
    { "no": 1, "pertanyaan": "Soal sederhana 1 sesuai TP", "kunciSingkat": "Kunci singkat" },
    { "no": 2, "pertanyaan": "Soal sederhana 2 sesuai TP", "kunciSingkat": "Kunci singkat" },
    { "no": 3, "pertanyaan": "Soal sederhana 3 sesuai TP", "kunciSingkat": "Kunci singkat" }
  ],
  "kataKunci": [
    { "term": "Istilah 1", "meaning": "Arti singkat" },
    { "term": "Istilah 2", "meaning": "Arti singkat" },
    { "term": "Istilah 3", "meaning": "Arti singkat" }
  ]
}`;

    let aiResult: any = null;
    let usedFallback = false;

    try {
        const res = await generateGeminiContent({
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                temperature: 0.5
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

    const merged: GeneratedMateriAjarData = {
        ...baseline,
        title: typeof aiResult?.title === 'string' && aiResult.title.trim() ? aiResult.title.trim() : baseline.title,
        subtitle: typeof aiResult?.subtitle === 'string' && aiResult.subtitle.trim() ? aiResult.subtitle.trim() : baseline.subtitle,
        pengantarSingkat: typeof aiResult?.pengantarSingkat === 'string' && aiResult.pengantarSingkat.trim() ? aiResult.pengantarSingkat.trim() : baseline.pengantarSingkat,
        pertanyaanPemantik: Array.isArray(aiResult?.pertanyaanPemantik) && aiResult.pertanyaanPemantik.length > 0 ? aiResult.pertanyaanPemantik.slice(0, 3) : baseline.pertanyaanPemantik,
        pengertianKonsep: typeof aiResult?.pengertianKonsep === 'string' && aiResult.pengertianKonsep.trim() ? aiResult.pengertianKonsep.trim() : baseline.pengertianKonsep,
        penjelasanUtama: typeof aiResult?.penjelasanUtama === 'string' && aiResult.penjelasanUtama.trim() ? aiResult.penjelasanUtama.trim() : baseline.penjelasanUtama,
        poinPenting: Array.isArray(aiResult?.poinPenting) && aiResult.poinPenting.length > 0 ? aiResult.poinPenting.slice(0, 4) : baseline.poinPenting,
        contohKonkret: typeof aiResult?.contohKonkret === 'string' && aiResult.contohKonkret.trim() ? aiResult.contohKonkret.trim() : baseline.contohKonkret,
        visualCaption: typeof aiResult?.visualCaption === 'string' && aiResult.visualCaption.trim() ? aiResult.visualCaption.trim() : baseline.visualCaption,
        contohSehariHari: Array.isArray(aiResult?.contohSehariHari) && aiResult.contohSehariHari.length > 0 ? aiResult.contohSehariHari.slice(0, 3) : baseline.contohSehariHari,
        aktivitasSederhana:
            aiResult?.aktivitasSederhana?.judul && Array.isArray(aiResult?.aktivitasSederhana?.langkah) && aiResult.aktivitasSederhana.langkah.length > 0
                ? aiResult.aktivitasSederhana
                : baseline.aktivitasSederhana,
        rangkumanPoin: Array.isArray(aiResult?.rangkumanPoin) && aiResult.rangkumanPoin.length >= 3 ? aiResult.rangkumanPoin.slice(0, 5) : baseline.rangkumanPoin,
        latihanFormatif: Array.isArray(aiResult?.latihanFormatif) && aiResult.latihanFormatif.length > 0 ? aiResult.latihanFormatif.slice(0, 3) : baseline.latihanFormatif,
        kataKunci: Array.isArray(aiResult?.kataKunci) && aiResult.kataKunci.length > 0 ? aiResult.kataKunci.slice(0, 4) : baseline.kataKunci
    };

    // Always rebuild concrete SVG illustration tailored to final title & TP, plus try fetching proxied real educational image when query is specific
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

    // Re-sync template payload with merged high-quality fields so ALL 10 template styles stay cohesive
    const resynced = synthesizeAuthenticMateriAjar({ ...params });
    merged.infographicData = {
        ...resynced.infographicData!,
        pillars: [
            { number: '01', title: 'Pengertian Konsep', summary: merged.pengertianKonsep, keyFact: merged.poinPenting[0] || '', example: merged.contohKonkret },
            { number: '02', title: 'Penjelasan Utama', summary: merged.penjelasanUtama, keyFact: merged.poinPenting[1] || '', example: merged.contohSehariHari[0] || '' },
            { number: '03', title: 'Poin-Poin Penting', summary: merged.poinPenting.join(' '), keyFact: merged.poinPenting[2] || '', example: merged.contohSehariHari[1] || '' },
            { number: '04', title: 'Penerapan Harian', summary: merged.contohSehariHari[2] || merged.aktivitasSederhana.hasilDiharapkan, keyFact: merged.aktivitasSederhana.judul, example: merged.rangkumanPoin[0] || '' }
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

    return { data: merged, usedFallback };
};

export const getMateriAjarArchiveKey = (user: any, activeClass: string): string => {
    const rawId = String(user?.email || user?.name || activeClass || 'default')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
    return `materi_ajar_ppa_archive_${rawId}`;
};
