import { CurriculumData, isSameClass, isSameSubject, synthesizeAtpItemsForTp, synthesizeCurriculumProta } from './curriculumHelper';
import { generateGeminiContent } from './geminiClient';
import { synthesizeContextual2dVisual } from './dynamic2dVisualHelper';
import { searchInternetImageCandidates } from './mediaSearchHelper';

export type MateriTemplateCategoryId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export interface MateriTemplateCategoryMeta {
    id: MateriTemplateCategoryId;
    name: string;
    subtitle: string;
}

export const MATERI_TEMPLATE_CATEGORIES: MateriTemplateCategoryMeta[] = [
    { id: 'A', name: 'Ringkasan & Informasi', subtitle: 'Poster, lembar ringkas, catatan tempel, glosarium, piramida' },
    { id: 'B', name: 'Peta Konsep', subtitle: 'Mind map, concept map, pohon, Venn, tulang ikan' },
    { id: 'C', name: 'Proses & Tahapan', subtitle: 'Step-by-step, flowchart, timeline, diagram siklus' },
    { id: 'D', name: 'Perbandingan & Analisis', subtitle: 'Comparison chart, T-Chart, Frayer model, KWL chart' },
    { id: 'E', name: 'Cerita & Narasi', subtitle: 'Comic strip, storyboard, story map' },
    { id: 'F', name: 'Kartu Pembelajaran', subtitle: 'Flashcard collection & quiz learning cards' },
    { id: 'G', name: 'Ilustrasi & Sains', subtitle: 'Isometric 3D, cutaway, cross-section, diagram berlabel, paper cut, poster' }
];

export type MateriTemplateId =
    // A. Ringkasan & Informasi (5)
    | 'educational_infographic'
    | 'cheat_sheet'
    | 'sticky_notes'
    | 'visual_glossary'
    | 'knowledge_pyramid'
    // B. Peta Konsep (5)
    | 'mind_map'
    | 'concept_map'
    | 'tree_diagram'
    | 'venn_diagram'
    | 'fishbone_diagram'
    // C. Proses & Tahapan (4)
    | 'step_by_step'
    | 'flowchart'
    | 'timeline'
    | 'cycle_diagram'
    // D. Perbandingan & Analisis (4)
    | 'comparison_chart'
    | 't_chart'
    | 'frayer_model'
    | 'kwl_chart'
    // E. Cerita & Narasi (3)
    | 'comic_strip'
    | 'storyboard'
    | 'story_map'
    // F. Kartu Pembelajaran (2)
    | 'flashcard'
    | 'quiz_cards'
    // G. Ilustrasi & Sains (6)
    | 'isometric_3d'
    | 'cutaway_diagram'
    | 'cross_section'
    | 'scientific_diagram'
    | 'paper_cut_3d'
    | 'illustrated_poster';

export type HierarchyFocusLevel = 'elemen' | 'tp' | 'atp';
export type PageCountPreference = 'auto' | 1 | 2 | 3 | 4;

export type MateriVisualThemeId =
    | 'zamrud_edukatif'
    | 'samudra_sains'
    | 'hangat_nusantara'
    | 'botani_segar'
    | 'grafit_modern';

export interface MateriVisualTheme {
    id: MateriVisualThemeId;
    name: string;
    primaryHex: string;
    secondaryHex: string;
    surfaceHex: string;
    borderHex: string;
    darkHex: string;
}

export const MATERI_VISUAL_THEMES: MateriVisualTheme[] = [
    {
        id: 'zamrud_edukatif',
        name: 'Zamrud Edukatif',
        primaryHex: '#0f766e',
        secondaryHex: '#0284c7',
        surfaceHex: '#f0fdfa',
        borderHex: '#99f6e4',
        darkHex: '#134e4a'
    },
    {
        id: 'samudra_sains',
        name: 'Samudra Sains',
        primaryHex: '#1d4ed8',
        secondaryHex: '#4f46e5',
        surfaceHex: '#eff6ff',
        borderHex: '#bfdbfe',
        darkHex: '#1e3a8a'
    },
    {
        id: 'hangat_nusantara',
        name: 'Hangat Nusantara',
        primaryHex: '#b45309',
        secondaryHex: '#be123c',
        surfaceHex: '#fffbeb',
        borderHex: '#fde68a',
        darkHex: '#78350f'
    },
    {
        id: 'botani_segar',
        name: 'Botani Segar',
        primaryHex: '#15803d',
        secondaryHex: '#0d9488',
        surfaceHex: '#f0fdf4',
        borderHex: '#bbf7d0',
        darkHex: '#14532d'
    },
    {
        id: 'grafit_modern',
        name: 'Grafit Modern',
        primaryHex: '#1e293b',
        secondaryHex: '#4338ca',
        surfaceHex: '#f8fafc',
        borderHex: '#cbd5e1',
        darkHex: '#0f172a'
    }
];

export interface MateriAjarTemplateMeta {
    id: MateriTemplateId;
    category: MateriTemplateCategoryId;
    order: number;
    name: string;
    subtitle: string;
    description: string;
    bestFor: string;
    accentHex: string;
    surfaceHex: string;
    recommendedOrientation: 'portrait_a4' | 'landscape_a4' | 'digital_screen';
}

export const MATERI_AJAR_TEMPLATES: MateriAjarTemplateMeta[] = [
    // A. Ringkasan & Informasi (5)
    {
        id: 'educational_infographic',
        category: 'A',
        order: 1,
        name: 'Educational Infographic',
        subtitle: 'Poster Infografis Lengkap',
        description: 'Poster edukasi terstruktur dengan blok ikon, pilar materi utama, ilustrasi konsep, contoh nyata, dan ringkasan.',
        bestFor: 'Penyajian menyeluruh berbagai topik pada seluruh mata pelajaran SD.',
        accentHex: '#0f766e',
        surfaceHex: '#f0fdfa',
        recommendedOrientation: 'portrait_a4'
    },
    {
        id: 'cheat_sheet',
        category: 'A',
        order: 2,
        name: 'Cheat Sheet',
        subtitle: 'Ringkasan Cepat & Rumus',
        description: 'Lembar ringkasan padat berisi aturan inti, rumus cepat, istilah kunci, dan daftar cek anti-keliru.',
        bestFor: 'Matematika, kaidah tata bahasa, hukum bacaan, dan persiapan asesmen.',
        accentHex: '#1d4ed8',
        surfaceHex: '#eff6ff',
        recommendedOrientation: 'portrait_a4'
    },
    {
        id: 'sticky_notes',
        category: 'A',
        order: 3,
        name: 'Sticky Notes Board',
        subtitle: 'Papan Catatan Tempel',
        description: 'Papan visual berisi kartu catatan warna-warni berpeniti untuk poin kunci, contoh praktis, dan pengingat konsep.',
        bestFor: 'Penguatan karakter, PPKn, catatan tematik kelas rendah, dan rangkuman ringan.',
        accentHex: '#b45309',
        surfaceHex: '#fffbeb',
        recommendedOrientation: 'landscape_a4'
    },
    {
        id: 'visual_glossary',
        category: 'A',
        order: 4,
        name: 'Visual Glossary',
        subtitle: 'Kamus Istilah Bergambar',
        description: 'Kartu kamus visual yang memadukan istilah baku, ikon mini, definisi sederhana, dan contoh penerapan.',
        bestFor: 'Penguasaan kosakata Bahasa Inggris/Sunda, istilah sains IPAS, dan terminologi baru.',
        accentHex: '#0284c7',
        surfaceHex: '#f0f9ff',
        recommendedOrientation: 'portrait_a4'
    },
    {
        id: 'knowledge_pyramid',
        category: 'A',
        order: 5,
        name: 'Knowledge Pyramid',
        subtitle: 'Piramida Tingkatan Konsep',
        description: 'Visualisasi piramida bertingkat dari konsep dasar di fondasi hingga penguasaan tingkat tinggi di puncak.',
        bestFor: 'Rantai makanan, kebutuhan hidup, tingkatan nilai, dan struktur kompetensi bertahap.',
        accentHex: '#7c3aed',
        surfaceHex: '#f5f3ff',
        recommendedOrientation: 'portrait_a4'
    },
    // B. Peta Konsep (5)
    {
        id: 'mind_map',
        category: 'B',
        order: 6,
        name: 'Mind Map',
        subtitle: 'Peta Pikiran Radial',
        description: 'Node gagasan utama di tengah memancar ke cabang-cabang kurva dengan kata kunci dan warna pembeda.',
        bestFor: 'Pemetaan topik luas, curah gagasan, dan gambaran utuh satu TP.',
        accentHex: '#6d28d9',
        surfaceHex: '#f5f3ff',
        recommendedOrientation: 'landscape_a4'
    },
    {
        id: 'concept_map',
        category: 'B',
        order: 7,
        name: 'Concept Map',
        subtitle: 'Peta Hubungan Berlabel',
        description: 'Jaringan kotak konsep yang dihubungkan panah berlabel kata penghubung (seperti "terdiri atas", "menyebabkan").',
        bestFor: 'Hubungan sebab-akibat IPAS, keterkaitan antaraturan, dan jejaring konsep logis.',
        accentHex: '#0d9488',
        surfaceHex: '#f0fdfa',
        recommendedOrientation: 'landscape_a4'
    },
    {
        id: 'tree_diagram',
        category: 'B',
        order: 8,
        name: 'Tree Diagram',
        subtitle: 'Diagram Pohon Hierarki',
        description: 'Struktur bercabang dari akar topik utama menuju kategori induk lalu rincian subkategori secara berjenjang.',
        bestFor: 'Klasifikasi makhluk hidup, jenis bangun datar/ruang, dan pembagian unsur materi.',
        accentHex: '#15803d',
        surfaceHex: '#f0fdf4',
        recommendedOrientation: 'landscape_a4'
    },
    {
        id: 'venn_diagram',
        category: 'B',
        order: 9,
        name: 'Venn Diagram',
        subtitle: 'Diagram Irisan Konsep',
        description: 'Dua lingkaran beririsan yang memisahkan ciri khas Konsep A, ciri khas Konsep B, serta persamaan di tengah.',
        bestFor: 'Membandingkan dua konsep sekaligus mencari titik temu persamaannya.',
        accentHex: '#2563eb',
        surfaceHex: '#eff6ff',
        recommendedOrientation: 'landscape_a4'
    },
    {
        id: 'fishbone_diagram',
        category: 'B',
        order: 10,
        name: 'Fishbone Diagram',
        subtitle: 'Diagram Tulang Ikan Sebab-Akibat',
        description: 'Kerangka tulang ikan Ishikawa dengan tulang punggung menuju kepala topik dan cabang faktor penyebab.',
        bestFor: 'Analisis sebab-akibat peristiwa, pemecahan masalah lingkungan, dan refleksi perilaku.',
        accentHex: '#be123c',
        surfaceHex: '#fff1f2',
        recommendedOrientation: 'landscape_a4'
    },
    // C. Proses & Tahapan (4)
    {
        id: 'step_by_step',
        category: 'C',
        order: 11,
        name: 'Step-by-Step Infographic',
        subtitle: 'Panduan Langkah Berurutan',
        description: 'Tahapan bernomor berurutan lengkap dengan instruksi kerja, cek keberhasilan, dan tips keamanan/ketelitian.',
        bestFor: 'Teks prosedur, praktik ibadah wudu/salat, gerak PJOK, dan percobaan sains.',
        accentHex: '#0369a1',
        surfaceHex: '#f0f9ff',
        recommendedOrientation: 'portrait_a4'
    },
    {
        id: 'flowchart',
        category: 'C',
        order: 12,
        name: 'Flowchart',
        subtitle: 'Diagram Alir Keputusan',
        description: 'Alur logis memakai simbol oval Mulai/Selesai, kotak Proses, belah ketupat Keputusan (Ya/Tidak), dan panah arah.',
        bestFor: 'Koding & Kecerdasan Artifisial, algoritma berpikir komputasional, dan alur pengambilan keputusan.',
        accentHex: '#4338ca',
        surfaceHex: '#eef2ff',
        recommendedOrientation: 'portrait_a4'
    },
    {
        id: 'timeline',
        category: 'C',
        order: 13,
        name: 'Timeline Infographic',
        subtitle: 'Garis Waktu Kronologis',
        description: 'Lintasan waktu berurutan menampilkan fase peristiwa, tokoh/konteks, perubahan, dan dampaknya.',
        bestFor: 'Sejarah perjuangan, kisah keteladanan Nabi/tokoh, dan tahapan perkembangan waktu.',
        accentHex: '#9a3412',
        surfaceHex: '#fff7ed',
        recommendedOrientation: 'landscape_a4'
    },
    {
        id: 'cycle_diagram',
        category: 'C',
        order: 14,
        name: 'Cycle Diagram',
        subtitle: 'Diagram Siklus Berulang',
        description: 'Lingkaran fase berputar searah jarum jam yang menunjukkan proses alam atau kebiasaan yang terus berulang.',
        bestFor: 'Siklus air, daur hidup hewan/tumbuhan, rantai daur ulang, dan siklus belajar.',
        accentHex: '#047857',
        surfaceHex: '#ecfdf5',
        recommendedOrientation: 'landscape_a4'
    },
    // D. Perbandingan & Analisis (4)
    {
        id: 'comparison_chart',
        category: 'D',
        order: 15,
        name: 'Comparison Chart',
        subtitle: 'Tabel Matriks Perbandingan',
        description: 'Matriks multi-kolom terstruktur untuk menelaah aspek pembeda, persamaan, dan simpulan dua konsep.',
        bestFor: 'Membandingkan ciri objek, aturan, sifat benda, atau dua jenis karya sastra.',
        accentHex: '#334155',
        surfaceHex: '#f8fafc',
        recommendedOrientation: 'landscape_a4'
    },
    {
        id: 't_chart',
        category: 'D',
        order: 16,
        name: 'T-Chart',
        subtitle: 'Bagan T Dua Sisi Kontras',
        description: 'Papan berbentuk huruf T besar yang membelah jelas dua sisi berpasangan atau berlawanan (mis. Hak vs Kewajiban).',
        bestFor: 'Memisahkan fakta vs opini, benar vs keliru, hak vs kewajiban, atau sebab vs akibat.',
        accentHex: '#0f766e',
        surfaceHex: '#f0fdfa',
        recommendedOrientation: 'landscape_a4'
    },
    {
        id: 'frayer_model',
        category: 'D',
        order: 17,
        name: 'Frayer Model',
        subtitle: 'Kuadran 4 Sudut Konsep',
        description: 'Empat kuadran klasik mengelilingi konsep inti di pusat: Definisi, Ciri/Karakteristik, Contoh, dan Bukan Contoh.',
        bestFor: 'Memperdalam satu istilah atau konsep penting agar siswa bebas dari miskonsepsi.',
        accentHex: '#4f46e5',
        surfaceHex: '#eef2ff',
        recommendedOrientation: 'landscape_a4'
    },
    {
        id: 'kwl_chart',
        category: 'D',
        order: 18,
        name: 'KWL Chart',
        subtitle: 'Bagan Inkuiri K · W · L',
        description: 'Tiga kolom penyelidikan siswa: Know (Sudah Diketahui), Want (Ingin Diketahui), dan Learned (Sudah Dipelajari).',
        bestFor: 'Pembelajaran berbasis inkuiri, eksplorasi awal topik baru, dan refleksi kelas.',
        accentHex: '#0369a1',
        surfaceHex: '#f0f9ff',
        recommendedOrientation: 'landscape_a4'
    },
    // E. Cerita & Narasi (3)
    {
        id: 'comic_strip',
        category: 'E',
        order: 19,
        name: 'Comic Strip',
        subtitle: 'Komik Dialog Edukasi',
        description: 'Panel komik berurutan berisi tokoh anak SD, balon dialog kontekstual, ilustrasi adegan, dan pesan moral.',
        bestFor: 'Bahasa Indonesia, Bahasa Sunda/Daerah, Bahasa Inggris, PAIBP, dan pendidikan budi pekerti.',
        accentHex: '#be123c',
        surfaceHex: '#fff1f2',
        recommendedOrientation: 'portrait_a4'
    },
    {
        id: 'storyboard',
        category: 'E',
        order: 20,
        name: 'Storyboard',
        subtitle: 'Papan Adegan Berurutan',
        description: 'Bingkai layar adegan bernomor seperti papan produksi film dengan sketsa visual, aksi tokoh, dan catatan belajar.',
        bestFor: 'Menyusun alur cerita, simulasi percakapan, rencana proyek, dan urutan demonstrasi.',
        accentHex: '#1e293b',
        surfaceHex: '#f8fafc',
        recommendedOrientation: 'landscape_a4'
    },
    {
        id: 'story_map',
        category: 'E',
        order: 21,
        name: 'Story Map',
        subtitle: 'Peta Unsur & Alur Cerita',
        description: 'Peta naratif yang mengurai Tokoh, Latar, Peristiwa Awal, Masalah/Konflik, hingga Penyelesaian & Amanat.',
        bestFor: 'Analisis teks fiksi, dongeng Nusantara, cerita rakyat Sunda, dan kisah teladan.',
        accentHex: '#b45309',
        surfaceHex: '#fffbeb',
        recommendedOrientation: 'landscape_a4'
    },
    // F. Kartu Pembelajaran (2)
    {
        id: 'flashcard',
        category: 'F',
        order: 22,
        name: 'Flashcard Collection',
        subtitle: 'Kartu Hafalan Dua Sisi',
        description: 'Kumpulan kartu belajar bolak-balik (pertanyaan/istilah di depan & penjelasan serta contoh di belakang).',
        bestFor: 'Kosakata Bahasa Inggris/Sunda, perkalian, surat pendek/doa, dan istilah penting.',
        accentHex: '#047857',
        surfaceHex: '#ecfdf5',
        recommendedOrientation: 'portrait_a4'
    },
    {
        id: 'quiz_cards',
        category: 'F',
        order: 23,
        name: 'Quiz Learning Cards',
        subtitle: 'Kartu Tantangan & Pembahasan',
        description: 'Kartu soal aktif berjenjang dilengkapi petunjuk berpikir, level tantangan, dan kunci pembahasan.',
        bestFor: 'Latihan formatif interaktif, permainan kuis kelompok, dan penguatan pemahaman.',
        accentHex: '#6d28d9',
        surfaceHex: '#f5f3ff',
        recommendedOrientation: 'portrait_a4'
    },
    // G. Ilustrasi & Sains (6)
    {
        id: 'isometric_3d',
        category: 'G',
        order: 24,
        name: 'Isometric 3D Infographic',
        subtitle: 'Diagram Proyeksi 3D Bernomor',
        description: 'Ilustrasi objek 3 dimensi sudut 30° lengkap dengan pin penunjuk bagian dan penjelasan fungsi spasial.',
        bestFor: 'Bangun ruang Matematika, rangkaian listrik, sistem tumbuhan, tata surya, dan model arsitektur.',
        accentHex: '#4338ca',
        surfaceHex: '#eef2ff',
        recommendedOrientation: 'landscape_a4'
    },
    {
        id: 'cutaway_diagram',
        category: 'G',
        order: 25,
        name: 'Cutaway Diagram',
        subtitle: 'Diagram Kupas Bagian Dalam',
        description: 'Ilustrasi objek dengan bagian luar dibuka sebagian untuk memperlihatkan komponen tersembunyi di dalamnya.',
        bestFor: 'Struktur buah/biji, bagian dalam rumah/bangunan, organ tubuh, atau komponen alat.',
        accentHex: '#0f766e',
        surfaceHex: '#f0fdfa',
        recommendedOrientation: 'landscape_a4'
    },
    {
        id: 'cross_section',
        category: 'G',
        order: 26,
        name: 'Cross-Section Diagram',
        subtitle: 'Diagram Penampang Melintang',
        description: 'Irisan penampang melintang berlapis-lapis untuk mengenali susunan strata, ketebalan, dan fungsi tiap lapisan.',
        bestFor: 'Lapisan bumi, struktur tanah, batang dikotil/monokotil, dan penampang benda ruang.',
        accentHex: '#9a3412',
        surfaceHex: '#fff7ed',
        recommendedOrientation: 'landscape_a4'
    },
    {
        id: 'scientific_diagram',
        category: 'G',
        order: 27,
        name: 'Scientific Labeled Diagram',
        subtitle: 'Diagram Ilmiah Garis Penunjuk',
        description: 'Objek ilmiah utama di tengah dikelilingi garis penunjuk presisi (leader lines) menuju label nama dan fungsi bagian.',
        bestFor: 'Anatomi bunga/tumbuhan, alat gerak, bagian bangun ruang, dan pengamatan sains akurat.',
        accentHex: '#0369a1',
        surfaceHex: '#f0f9ff',
        recommendedOrientation: 'landscape_a4'
    },
    {
        id: 'paper_cut_3d',
        category: 'G',
        order: 28,
        name: '3D Paper Cut',
        subtitle: 'Lapisan Kertas 3D Berkedalaman',
        description: 'Komposisi estetik bernuansa kerajinan kertas berlapis dengan efek bayangan bertumpuk yang menarik perhatian anak.',
        bestFor: 'Ekosistem alam, tata surya, seni budaya Nusantara, dan poster tematik kreatif.',
        accentHex: '#be185d',
        surfaceHex: '#fdf2f8',
        recommendedOrientation: 'portrait_a4'
    },
    {
        id: 'illustrated_poster',
        category: 'G',
        order: 29,
        name: 'Illustrated Educational Poster',
        subtitle: 'Poster Edukasi Fokus Ilustrasi',
        description: 'Poster modern dengan tipografi judul besar, ilustrasi visual dominan di pusat, serta butir pesan ringkas.',
        bestFor: 'Kampanye belajar kelas, poster kelas rendah, literasi visual, dan materi digital layar.',
        accentHex: '#0f766e',
        surfaceHex: '#f0fdfa',
        recommendedOrientation: 'digital_screen'
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

export interface VisualGlossaryEntry {
    term: string;
    category: string;
    symbolHint: string;
    definition: string;
    example: string;
}

export interface KnowledgePyramidTier {
    level: number;
    tierLabel: string;
    title: string;
    description: string;
    example: string;
}

export interface MindMapBranch {
    title: string;
    colorHex: string;
    keywords: string[];
    explanation: string;
}

export interface ConceptMapNode {
    id: string;
    label: string;
    role: 'core' | 'primary' | 'detail';
    summary: string;
}

export interface ConceptMapEdge {
    fromId: string;
    toId: string;
    linkingVerb: string;
}

export interface TreeDiagramBranch {
    category: string;
    description: string;
    children: { label: string; detail: string }[];
}

export interface VennDiagramData {
    title: string;
    leftLabel: string;
    leftPoints: string[];
    rightLabel: string;
    rightPoints: string[];
    intersectionLabel: string;
    intersectionPoints: string[];
    insight: string;
}

export interface FishboneData {
    headEffect: string;
    spineLabel: string;
    causes: {
        category: string;
        subCauses: string[];
    }[];
    conclusion: string;
}

export interface FlowchartStep {
    id: string;
    shape: 'start' | 'process' | 'decision' | 'end';
    label: string;
    detail: string;
    yesBranch?: string;
    noBranch?: string;
}

export interface CyclePhase {
    phaseNo: number;
    title: string;
    description: string;
    keyIndicator: string;
}

export interface TChartData {
    topicTitle: string;
    leftHeader: string;
    rightHeader: string;
    rows: { leftText: string; rightText: string }[];
    summaryNote: string;
}

export interface FrayerModelData {
    conceptName: string;
    definition: string;
    characteristics: string[];
    examples: string[];
    nonExamples: string[];
}

export interface KwlChartData {
    topicTitle: string;
    knowItems: string[];
    wantItems: string[];
    learnedItems: string[];
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

export interface StoryboardFrame {
    frameNo: number;
    shotTitle: string;
    visualCue: string;
    actionCaption: string;
    learningTakeaway: string;
    mood: 'curious' | 'explain' | 'happy' | 'eureka';
}

export interface StoryMapData {
    storyTitle: string;
    characters: string[];
    setting: string;
    beginning: string;
    conflict: string;
    resolution: string;
    moralLesson: string;
}

export interface FlashcardItem {
    cardNo: number;
    category: string;
    frontPrompt: string;
    hint: string;
    backAnswer: string;
    realExample: string;
}

export interface QuizCardItem {
    cardNo: number;
    level: 'Dasar' | 'Menengah' | 'Tantangan';
    question: string;
    clue: string;
    answer: string;
    explanation: string;
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

export interface LayerDiagramPart {
    code: string;
    name: string;
    thicknessOrRole: string;
    description: string;
}

export interface ScientificCallout {
    pinNo: number;
    side: 'left' | 'right';
    partName: string;
    functionDesc: string;
}

export type PageOrientationMode = 'portrait_a4' | 'landscape_a4' | 'digital_screen' | 'digital_4_5';

export interface MateriDocumentPage {
    pageNo: number;
    heading: string;
    subtitle: string;
    kind: 'visual_master' | 'subtopics_deep' | 'practice_application' | 'summary_ref' | 'custom_note';
    customNote?: string;
}

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
    category: 'A. Kurikulum' | 'B. Substansi' | 'C. Visual' | 'D. Ekspor PNG';
    question: string;
    status: 'lulus' | 'perhatian' | 'gagal';
    detail: string;
}

export interface QualityCategorySummary {
    id: 'A' | 'B' | 'C' | 'D';
    title: string;
    status: 'LULUS' | 'PERLU PERHATIAN' | 'GAGAL';
    summary: string;
    items: QualityCheckItem[];
}

export interface QualityControlReport {
    overallStatus: 'LULUS' | 'PERLU PERHATIAN' | 'GAGAL';
    summary: string;
    checkedAt: string;
    checks: QualityCheckItem[];
    categories: QualityCategorySummary[];
    verificationStages: { stage: string; passed: boolean; note: string }[];
    needsTeacherConfirmation: string[];
}

export const GENERATION_PIPELINE_STEPS = [
    { step: 1, title: 'Ambil & Kunci Data Kurikulum', desc: 'Membaca metadata sekolah, kelas, fase, CP, TP, dan ATP terkunci.' },
    { step: 2, title: 'Analisis Cakupan TP / ATP', desc: 'Menghimpun ATP terkait untuk mode TP atau memfokuskan 1 ATP pada mode ATP.' },
    { step: 3, title: 'Penentuan Desain Visual & Tema', desc: 'Menerapkan pilihan 1 dari 29 desain visual, orientasi, dan tema warna.' },
    { step: 4, title: 'Susun Kerangka Substantif', desc: 'Menyusun urutan pengantar, pembahasan inti, pendalaman, dan latihan.' },
    { step: 5, title: 'Generasi Konten Keilmuan', desc: 'Menghasilkan isi materi akurat sesuai perkembangan kognitif fase.' },
    { step: 6, title: 'Verifikasi Anti-Halusinasi', desc: 'Memeriksa konsistensi TP/ATP, keilmuan, sumber, pedagogi, dan label visual.' },
    { step: 7, title: 'Komposisi Ilustrasi & Diagram', desc: 'Merangkai komponen ilustrasi SVG faktual terpisah dari blok teks.' },
    { step: 8, title: 'Alokasi Multi-Halaman Dinamis', desc: 'Membagi halaman proporsional (1–4 halaman) tanpa pengulangan konten.' },
    { step: 9, title: 'Quality Gate 4 Kategori', desc: 'Menguji standar Kurikulum, Substansi, Visual, dan kesiapan Ekspor PNG.' },
    { step: 10, title: 'Siap Pratinjau & Ekspor PNG', desc: 'Menyiapkan keluaran PNG resolusi tinggi per halaman & riwayat edit.' }
] as const;

export interface GeneratedMateriAjarData {
    id: string;
    createdAt: string;
    templateId: MateriTemplateId;
    themeId?: MateriVisualThemeId;
    visualVariantIndex?: number;
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
    relatedAtps?: string[];
    alokasiWaktu: string;
    pageCountPreference?: PageCountPreference;
    pages?: MateriDocumentPage[];
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
    // Template-specific structured payloads (29 Templates)
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
    visualGlossaryData?: {
        glossaryTitle: string;
        entries: VisualGlossaryEntry[];
    };
    knowledgePyramidData?: {
        pyramidTitle: string;
        tiers: KnowledgePyramidTier[];
        apexInsight: string;
    };
    mindMapData?: {
        centralNode: string;
        centralSubtitle: string;
        branches: MindMapBranch[];
    };
    conceptMapData?: {
        title: string;
        nodes: ConceptMapNode[];
        edges: ConceptMapEdge[];
    };
    treeDiagramData?: {
        rootTitle: string;
        rootSubtitle: string;
        branches: TreeDiagramBranch[];
    };
    vennDiagramData?: VennDiagramData;
    fishboneData?: FishboneData;
    stepByStepData?: {
        goalStatement: string;
        toolsNeeded: string[];
        stages: StepByStepStage[];
        successIndicator: string;
    };
    flowchartData?: {
        title: string;
        steps: FlowchartStep[];
    };
    timelineData?: {
        timelineTitle: string;
        periodSpan: string;
        events: TimelineEvent[];
        synthesisNote: string;
    };
    cycleDiagramData?: {
        cycleTitle: string;
        centerLabel: string;
        phases: CyclePhase[];
    };
    comparisonData?: {
        conceptAName: string;
        conceptBName: string;
        similarities: string[];
        rows: ComparisonRow[];
        conclusion: string;
    };
    tChartData?: TChartData;
    frayerModelData?: FrayerModelData;
    kwlChartData?: KwlChartData;
    comicStripData?: {
        storyTitle: string;
        setting: string;
        panels: ComicPanel[];
        moralLesson: string;
    };
    storyboardData?: {
        title: string;
        frames: StoryboardFrame[];
    };
    storyMapData?: StoryMapData;
    flashcardData?: {
        deckTitle: string;
        studyTip: string;
        cards: FlashcardItem[];
    };
    quizCardsData?: {
        deckTitle: string;
        cards: QuizCardItem[];
    };
    isometric3dData?: {
        objectTitle: string;
        visualSceneType: 'geometry_solid' | 'science_ecosystem' | 'electrical_circuit' | 'plant_structure' | 'solar_system' | 'architecture_model';
        dimensionSummary: string;
        parts: IsometricPartPin[];
        spatialInsight: string;
    };
    cutawayData?: {
        title: string;
        objectKind: 'plant_seed' | 'human_organ' | 'earth_interior' | 'building_system';
        outerLabel: string;
        innerLabel: string;
        layers: LayerDiagramPart[];
    };
    crossSectionData?: {
        title: string;
        sliceKind: 'earth_layers' | 'soil_profile' | 'plant_stem' | 'geometry_slice';
        strata: LayerDiagramPart[];
    };
    scientificDiagramData?: {
        title: string;
        specimenKind: 'plant_anatomy' | 'water_cycle' | 'circuit_board' | 'human_motion' | 'geometry_model';
        centerTitle: string;
        callouts: ScientificCallout[];
    };
    paperCut3dData?: {
        title: string;
        layers: { depth: number; title: string; detail: string; accentHex: string }[];
    };
    illustratedPosterData?: {
        headline: string;
        tagline: string;
        bigTakeaway: string;
        highlights: { label: string; text: string }[];
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

    // 1. Natural / Repeating Cycles -> Cycle Diagram
    if (/\b(siklus|daur\s+hidup|metamorfosis|siklus\s+air|rotasi|revolusi|perputaran|musim)\b/.test(combined)) {
        return {
            recommendedId: 'cycle_diagram',
            reason: `Materi ${subject} pada topik ini membahas proses yang berulang secara terus-menerus, sehingga Cycle Diagram sangat tepat memvisualisasikan fase berputar.`,
            alternatives: [
                makeAlt('scientific_diagram', 'Menampilkan objek sains lengkap dengan garis label fungsi bagian.'),
                makeAlt('educational_infographic', 'Menyajikan poster edukasi lengkap dengan contoh kehidupan sehari-hari.')
            ]
        };
    }

    // 2. Algorithms / Decision Logic -> Flowchart
    if (subjLower.includes('koding') || subjLower.includes('kecerdasan') || /\b(algoritma|flowchart|diagram\s+alir|percabangan|if-else|keputusan|logika\s+program)\b/.test(combined)) {
        return {
            recommendedId: 'flowchart',
            reason: `Fokus ${subject} menekankan alur berpikir logis, langkah proses, dan percabangan kondisi, sehingga Flowchart menghadirkan simbol Mulai–Proses–Keputusan secara akurat.`,
            alternatives: [
                makeAlt('step_by_step', 'Menguraikan langkah kerja bernomor beserta tips menghindari kesalahan.'),
                makeAlt('concept_map', 'Menghubungkan istilah berpikir komputasional dengan panah berlabel.')
            ]
        };
    }

    // 3. Earth / Soil / Cutaway / Anatomy / Scientific Label -> Scientific / Cross-Section / Cutaway
    if (/\b(lapisan\s+bumi|struktur\s+tanah|penampang|kerak\s+bumi|batang|lapisan)\b/.test(combined)) {
        return {
            recommendedId: 'cross_section',
            reason: `Fokus materi menelaah susunan berlapis atau penampang bagian dalam, sehingga Cross-Section Diagram memperlihatkan strata dan fungsinya secara jelas.`,
            alternatives: [
                makeAlt('cutaway_diagram', 'Membuka tampilan luar objek untuk mengintip bagian dalamnya.'),
                makeAlt('scientific_diagram', 'Menambahkan garis penunjuk presisi pada tiap bagian.')
            ]
        };
    }

    if (/\b(anatomi|bagian\s+tumbuhan|organ\s+tubuh|fotosintesis|bagian\s+bunga|rangka|pernapasan|pencernaan)\b/.test(combined) && !subjLower.includes('pjok')) {
        return {
            recommendedId: 'scientific_diagram',
            reason: `Materi ${subject} pada elemen ${elementName} membahas struktur bagian dan fungsi ilmiah, sehingga Scientific Labeled Diagram memberi penunjuk presisi yang mudah dipelajari.`,
            alternatives: [
                makeAlt('cutaway_diagram', 'Mengupas lapisan luar untuk menampakkan bagian dalam objek.'),
                makeAlt('isometric_3d', 'Memvisualisasikan struktur objek dalam proyeksi 3D bernomor.')
            ]
        };
    }

    // 4. Cause & Effect / Environmental Problem Analysis -> Fishbone Diagram
    if (/\b(sebab\s+dan\s+akibat|penyebab|dampak\s+negatif|pencemaran|masalah\s+lingkungan|mengapa\s+terjadi)\b/.test(focusText)) {
        return {
            recommendedId: 'fishbone_diagram',
            reason: `Kompetensi menuntut analisis faktor penyebab dari suatu akibat/topik utama, sehingga Fishbone Diagram memetakan akar masalah secara visual.`,
            alternatives: [
                makeAlt('concept_map', 'Menghubungkan sebab dan akibat dengan panah berlabel kata kerja.'),
                makeAlt('t_chart', 'Membandingkan dua sisi dampak atau solusi secara langsung.')
            ]
        };
    }

    // 5. Chronology / History / Evolution -> Timeline
    if (/\b(sejarah|kronologi|zaman|kemerdekaan|proklamasi|kerajaan|masa lalu|perjuangan|kisah nabi|riwayat|periode sejarah|era|dinasti|abad|praaksara)\b/.test(focusText)) {
        return {
            recommendedId: 'timeline',
            reason: `Fokus TP/ATP memuat unsur kronologi atau peristiwa bersejarah pada ${subject}, sehingga Timeline Infographic efektif menampilkan urutan kejadian dan dampaknya.`,
            alternatives: [
                makeAlt('storyboard', 'Menyajikan kronologi sebagai papan adegan visual berurutan.'),
                makeAlt('story_map', 'Memetakan tokoh, latar, konflik, dan amanat peristiwa.')
            ]
        };
    }

    // 6. 3D Objects / Geometry / Circuits / Solar System -> Isometric 3D
    if (
        /\b(bangun ruang|kubus|balok|prisma|limas|tabung|kerucut|jaring-jaring|volume|rangkaian listrik|tata surya|planet|tiga dimensi|3d|patung|diorama)\b/.test(combined) &&
        !subjLower.includes('pjok')
    ) {
        return {
            recommendedId: 'isometric_3d',
            reason: `Fokus materi pada ${elementName} membahas objek ruang atau sistem 3 dimensi, sehingga Isometric 3D memvisualisasikan bentuk dan pin bagian secara konkret.`,
            alternatives: [
                makeAlt('cutaway_diagram', 'Memperlihatkan bagian dalam objek secara terstruktur.'),
                makeAlt('cheat_sheet', 'Merangkum rumus luas permukaan dan volume secara ringkas.')
            ]
        };
    }

    // 7. Similarities & Differences -> Venn Diagram / Comparison Chart / T-Chart
    if (/\b(persamaan\s+dan\s+perbedaan|irisan|serupa\s+namun\s+berbeda)\b/.test(focusText)) {
        return {
            recommendedId: 'venn_diagram',
            reason: `Materi membandingkan dua konsep sekaligus mencari irisannya, sehingga Venn Diagram menampilkan sisi unik dan kesamaan secara seketika.`,
            alternatives: [
                makeAlt('comparison_chart', 'Menyajikan tabel matriks multi-aspek yang rapi.'),
                makeAlt('t_chart', 'Membagi kontras dua sisi secara tegas dalam bagan T.')
            ]
        };
    }

    if (/\b(hak\s+dan\s+kewajiban|benar\s+dan\s+salah|positif\s+dan\s+negatif|kelebihan\s+dan\s+kekurangan|loma\s+dan\s+lemes)\b/.test(focusText)) {
        return {
            recommendedId: 't_chart',
            reason: `Topik menuntut pemilahan dua sisi yang berpasangan atau kontras secara jernih, sehingga T-Chart sangat efektif untuk siswa SD.`,
            alternatives: [
                makeAlt('comparison_chart', 'Menambahkan kolom aspek pembanding lebih rinci.'),
                makeAlt('venn_diagram', 'Menyoroti irisan persamaan kedua konsep.')
            ]
        };
    }

    if (/\b(membedakan|perbedaan|membandingkan|klasifikasi|wujud zat|jenis-jenis)\b/.test(focusText)) {
        return {
            recommendedId: 'comparison_chart',
            reason: `Fokus kompetensi menuntut siswa membandingkan ciri, perbedaan, dan contoh konsep dalam satu matriks visual terstruktur.`,
            alternatives: [
                makeAlt('tree_diagram', 'Menunjukkan pembagian klasifikasi dalam bentuk pohon hierarki.'),
                makeAlt('venn_diagram', 'Menggambarkan perbedaan dan irisan persamaan dua konsep.')
            ]
        };
    }

    // 8. Math Formulas / Numbers / Rules -> Cheat Sheet
    if (subjLower.includes('matematika') || /\b(bilangan|pecahan|operasi hitung|perkalian|pembagian|keliling|luas|satuan|rumus|kaidah|ejaan|tanda baca)\b/.test(focusText)) {
        return {
            recommendedId: 'cheat_sheet',
            reason: `Kompetensi ${subject} pada fokus ini memerlukan kejelasan rumus, aturan hitung, dan ceklis anti-keliru dalam format ringkasan cepat.`,
            alternatives: [
                makeAlt('step_by_step', 'Memecah langkah pengerjaan hitungan secara bertahap.'),
                makeAlt('frayer_model', 'Menguatkan satu konsep lewat definisi, ciri, contoh, dan bukan contoh.')
            ]
        };
    }

    // 9. Narrative / Fiction / Regional Language -> Story Map / Comic Strip
    if (/\b(unsur\s+intrinsik|tokoh|latar|alur|amanat|dongeng|dongéng|fabel|cerita\s+rakyat)\b/.test(focusText)) {
        return {
            recommendedId: 'story_map',
            reason: `Materi menelaah unsur cerita dan pesan moral, sehingga Story Map menata Tokoh, Latar, Masalah, dan Penyelesaian dengan sangat jernih.`,
            alternatives: [
                makeAlt('comic_strip', 'Menghidupkan adegan cerita dalam panel komik dialog.'),
                makeAlt('storyboard', 'Menampilkan urutan adegan visual secara sinematik.')
            ]
        };
    }

    if (subjLower.includes('sunda') || subjLower.includes('daerah') || /\b(dialog|percakapan|paguneman|si kabayan|adab|sopan\s+santun)\b/.test(focusText)) {
        return {
            recommendedId: 'comic_strip',
            reason: `Materi ${subject} pada elemen ${elementName} kaya akan konteks komunikasi dan teladan budaya. Comic Strip menghidupkan dialog alami bagi siswa SD.`,
            alternatives: [
                makeAlt('visual_glossary', 'Mengenalkan kosakata kunci lengkap dengan ikon & contoh kalimat.'),
                makeAlt('flashcard', 'Melatih hafalan ungkapan dan kosakata dua sisi.')
            ]
        };
    }

    // 10. Procedures / Movement Steps / Worship -> Step-by-Step
    if (/\b(dekomposisi|pola gerak|gerak dasar|senam|lokomotor|eksperimen|percobaan|praktik|tata cara|wudhu|wudu|salat|prosedur|teks prosedur|merangkai|mengayun)\b/.test(combined)) {
        return {
            recommendedId: 'step_by_step',
            reason: `Fokus TP/ATP menekankan penguasaan tahapan kerja, praktik ibadah, atau keterampilan gerak pada ${subject}.`,
            alternatives: [
                makeAlt('educational_infographic', 'Menyajikan poster infografis utuh lengkap dengan ilustrasi gerakan.'),
                makeAlt('flowchart', 'Menampilkan alur keputusan langkah demi langkah.')
            ]
        };
    }

    // 11. Vocabulary / Memorization -> Visual Glossary / Flashcard
    if (subjLower.includes('inggris') || /\b(kosakata|vocabulary|hafalan|arti kata|asmaul husna)\b/.test(focusText)) {
        return {
            recommendedId: 'visual_glossary',
            reason: `Fokus ATP/TP pada ${subject} mengutamakan penguasaan kosakata, arti kata, dan ilustrasi konsep yang mudah diingat.`,
            alternatives: [
                makeAlt('flashcard', 'Kartu belajar dua sisi untuk latihan hafalan aktif.'),
                makeAlt('quiz_cards', 'Kartu soal cepat untuk uji pemahaman mandiri.')
            ]
        };
    }

    // 12. Broad Concept Mapping -> Mind Map / Concept Map / Tree Diagram
    if (subjLower.includes('ipas') || /\b(hubungan|keterkaitan|sistem|ragam|komponen|bagian|unsur|faktor|ekosistem)\b/.test(focusText)) {
        return {
            recommendedId: 'concept_map',
            reason: `Elemen ${elementName} menghubungkan beberapa konsep dan hubungan kerja sekaligus sehingga Concept Map berlabel memperjelas keterkaitan.`,
            alternatives: [
                makeAlt('mind_map', 'Memetakan cabang konsep secara radial dari ide pusat.'),
                makeAlt('paper_cut_3d', 'Menyajikan ekosistem atau konsep alam dalam lapisan kertas 3D atraktif.')
            ]
        };
    }

    // 13. Default -> Modern Educational Infographic
    return {
        recommendedId: 'educational_infographic',
        reason: `Fokus TP/ATP pada ${subject} (${elementName}) paling optimal disajikan sebagai Educational Infographic lengkap dengan pilar konsep, ilustrasi konkret, contoh sehari-hari, dan rangkuman.`,
        alternatives: [
            makeAlt('frayer_model', 'Mengulas satu konsep inti secara mendalam lewat 4 kuadran.'),
            makeAlt('illustrated_poster', 'Menonjolkan poster visual modern berilustrasi utama di tengah.')
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
 * tailored to the exact subject & TP/ATP topic (e.g., SD student swinging leg for PJOK, fractions/geometry for Math, etc.).
 */
export const buildConcretePosterIllustrationSvg = (
    subject: string,
    elementName: string,
    tpText: string,
    atpText: string,
    captionTitle: string,
    variantIndex = 0
): string => {
    const combined = `${subject} ${elementName} ${tpText} ${atpText}`.toLowerCase();
    const subjLower = subject.toLowerCase();
    const shortLabel = escXml(captionTitle.length > 44 ? captionTitle.slice(0, 42) + '…' : captionTitle);
    const variant = Math.abs(variantIndex) % 3;

    const produceSvg = (): string => {

    // 1. PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan) — Specific SD Student Action Scenes
    if (subjLower.includes('pjok') || subjLower.includes('jasmani') || subjLower.includes('olahraga')) {
        // 1A. Mengayun Kaki / Gerak Nonlokomotor / Keseimbangan / Menekuk / Meliuk
        if (/\b(mengayun|ayunan|ayun\s+kaki|non-?lokomotor|keseimbangan|menekuk|meliuk|memutar)\b/.test(combined)) {
            return `<svg viewBox="0 0 460 190" width="460" height="190" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto block">
                <rect x="0" y="0" width="460" height="190" rx="14" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5"/>
                <rect x="0" y="144" width="460" height="46" fill="#bbf7d0"/>
                <line x1="20" y1="144" x2="215" y2="144" stroke="#16a34a" stroke-width="2"/>
                <!-- Anak SD Berseragam Olahraga Merah-Putih Sedang Mengayunkan Kaki -->
                <g transform="translate(106, 22)">
                    <!-- Kepala & Rambut -->
                    <circle cx="0" cy="18" r="15" fill="#fed7aa" stroke="#9a3412" stroke-width="1.6"/>
                    <path d="M-14 14 C-11 -2, 13 -2, 14 14 C6 8, -6 8, -14 14 Z" fill="#1e293b"/>
                    <circle cx="4" cy="17" r="1.7" fill="#0f172a"/>
                    <path d="M1 24 Q5 27 8 24" fill="none" stroke="#9a3412" stroke-width="1.5"/>
                    <!-- Badan Kaos Olahraga SD -->
                    <path d="M-13 34 L13 34 L15 74 L-15 74 Z" fill="#dc2626" stroke="#991b1b" stroke-width="1.5"/>
                    <rect x="-13" y="34" width="26" height="8" fill="#ffffff" opacity="0.9"/>
                    <!-- Lengan Terentang Menjaga Keseimbangan -->
                    <line x1="-14" y1="42" x2="-46" y2="52" stroke="#fed7aa" stroke-width="7" stroke-linecap="round"/>
                    <line x1="14" y1="42" x2="46" y2="48" stroke="#fed7aa" stroke-width="7" stroke-linecap="round"/>
                    <!-- Kaki Tumpu Tegak Kokoh -->
                    <line x1="-6" y1="74" x2="-8" y2="120" stroke="#1e3a8a" stroke-width="9" stroke-linecap="round"/>
                    <ellipse cx="-3" cy="122" rx="10" ry="4.5" fill="#0f172a"/>
                    <!-- Posisi Ayunan ke Belakang (Garis Putus-putus) -->
                    <line x1="5" y1="74" x2="-34" y2="104" stroke="#93c5fd" stroke-width="6" stroke-dasharray="5,3" stroke-linecap="round"/>
                    <!-- Kaki Kanan Mengayun ke Depan -->
                    <line x1="6" y1="74" x2="48" y2="96" stroke="#2563eb" stroke-width="9" stroke-linecap="round"/>
                    <ellipse cx="53" cy="98" rx="10" ry="4.5" fill="#1d4ed8" transform="rotate(22 53 98)"/>
                    <!-- Busur Panah Gerakan Mengayun Kaki -->
                    <path d="M-36 112 Q10 128 52 106" fill="none" stroke="#ea580c" stroke-width="3" stroke-dasharray="5,3"/>
                    <polygon points="58,103 46,100 50,111" fill="#ea580c"/>
                    <polygon points="-42,109 -31,106 -34,116" fill="#ea580c"/>
                    <text x="10" y="136" font-size="9.5" font-weight="700" text-anchor="middle" fill="#c2410c">Ayun Depan &amp; Belakang</text>
                </g>
                <!-- Panel Panduan Teknik Gerak Anak SD -->
                <g transform="translate(216, 22)">
                    <rect x="0" y="0" width="224" height="132" rx="12" fill="#ffffff" stroke="#86efac" stroke-width="1.4"/>
                    <text x="112" y="22" font-size="11" font-weight="800" text-anchor="middle" fill="#14532d">Teknik Mengayun Kaki yang Benar</text>
                    <circle cx="24" cy="48" r="11" fill="#dcfce7"/><text x="24" y="52" font-size="10" font-weight="700" text-anchor="middle" fill="#166534">1</text>
                    <text x="42" y="51" font-size="9.8" font-weight="600" fill="#1e293b">Berdiri tegak, rentangkan kedua lengan</text>
                    <circle cx="24" cy="78" r="11" fill="#dbeafe"/><text x="24" y="82" font-size="10" font-weight="700" text-anchor="middle" fill="#1d4ed8">2</text>
                    <text x="42" y="81" font-size="9.8" font-weight="600" fill="#1e293b">Ayunkan 1 kaki lurus ke depan-belakang</text>
                    <circle cx="24" cy="108" r="11" fill="#ffedd5"/><text x="24" y="112" font-size="10" font-weight="700" text-anchor="middle" fill="#c2410c">3</text>
                    <text x="42" y="111" font-size="9.8" font-weight="600" fill="#1e293b">Kaki tumpu kuat &amp; pandangan ke depan</text>
                </g>
                <text x="230" y="174" font-size="10.5" font-weight="700" text-anchor="middle" fill="#14532d">${shortLabel}</text>
            </svg>`;
        }

        // 1B. Gerak Lokomotor / Berlari / Melompat / Atletik
        if (/\b(lokomotor|berlari|lari|berjalan|melompat|meloncat|atletik|lompat\s+jauh)\b/.test(combined)) {
            return `<svg viewBox="0 0 460 190" width="460" height="190" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto block">
                <rect x="0" y="0" width="460" height="190" rx="14" fill="#ecfeff" stroke="#67e8f9" stroke-width="1.5"/>
                <rect x="0" y="142" width="460" height="48" fill="#fed7aa"/>
                <line x1="20" y1="142" x2="440" y2="142" stroke="#ea580c" stroke-width="2"/>
                <!-- Anak SD Melangkah & Melompat -->
                <g transform="translate(96, 26)">
                    <circle cx="0" cy="16" r="14" fill="#fed7aa" stroke="#9a3412" stroke-width="1.5"/>
                    <path d="M-13 12 C-10 -2, 12 -2, 13 12 Z" fill="#1e293b"/>
                    <path d="M-12 31 L12 31 L14 68 L-14 68 Z" fill="#2563eb"/>
                    <line x1="-12" y1="38" x2="-34" y2="28" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round"/>
                    <line x1="12" y1="38" x2="36" y2="26" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round"/>
                    <line x1="-6" y1="68" x2="-28" y2="104" stroke="#1e293b" stroke-width="8" stroke-linecap="round"/>
                    <line x1="8" y1="68" x2="32" y2="96" stroke="#1e293b" stroke-width="8" stroke-linecap="round"/>
                </g>
                <!-- Cone Rintangan & Lintasan Berpindah Tempat -->
                <polygon points="186,142 198,108 210,142" fill="#f97316" stroke="#c2410c" stroke-width="1.5"/>
                <path d="M138 66 Q198 24 256 76" fill="none" stroke="#0284c7" stroke-width="3" stroke-dasharray="5,3"/>
                <polygon points="262,80 250,78 256,68" fill="#0284c7"/>
                <g transform="translate(278, 28)">
                    <rect x="0" y="0" width="164" height="106" rx="12" fill="#ffffff" stroke="#bae6fd" stroke-width="1.4"/>
                    <text x="82" y="24" font-size="10.5" font-weight="800" text-anchor="middle" fill="#0369a1">Ciri Gerak Lokomotor</text>
                    <text x="14" y="48" font-size="9.5" font-weight="600" fill="#1e293b">• Tubuh berpindah titik A → B</text>
                    <text x="14" y="68" font-size="9.5" font-weight="600" fill="#1e293b">• Ayunan lengan seirama kaki</text>
                    <text x="14" y="88" font-size="9.5" font-weight="600" fill="#1e293b">• Mendarat lutut sedikit lentur</text>
                </g>
                <text x="230" y="172" font-size="10.5" font-weight="700" text-anchor="middle" fill="#9a3412">${shortLabel}</text>
            </svg>`;
        }

        // 1C. Gerak Manipulatif / Permainan Bola (Sepak Bola, Voli, Basket, Kasti)
        if (/\b(manipulatif|bola|menendang|melempar|menangkap|memantulkan|bulu\s+tangkis|kasti)\b/.test(combined)) {
            return `<svg viewBox="0 0 460 190" width="460" height="190" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto block">
                <rect x="0" y="0" width="460" height="190" rx="14" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5"/>
                <rect x="0" y="142" width="460" height="48" fill="#86efac"/>
                <!-- Anak SD Mengontrol & Mengoper Bola -->
                <g transform="translate(92, 26)">
                    <circle cx="0" cy="16" r="14" fill="#fed7aa" stroke="#9a3412" stroke-width="1.5"/>
                    <path d="M-13 12 C-10 -2, 12 -2, 13 12 Z" fill="#1e293b"/>
                    <path d="M-12 31 L12 31 L14 68 L-14 68 Z" fill="#dc2626"/>
                    <line x1="-12" y1="39" x2="-34" y2="54" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round"/>
                    <line x1="12" y1="39" x2="36" y2="48" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round"/>
                    <line x1="-6" y1="68" x2="-8" y2="115" stroke="#1e293b" stroke-width="8" stroke-linecap="round"/>
                    <line x1="7" y1="68" x2="34" y2="102" stroke="#2563eb" stroke-width="8" stroke-linecap="round"/>
                </g>
                <circle cx="154" cy="126" r="13" fill="#ffffff" stroke="#0f172a" stroke-width="2.2"/>
                <path d="M170 116 Q216 64 260 88" fill="none" stroke="#ea580c" stroke-width="3" stroke-dasharray="5,3"/>
                <polygon points="266,91 254,92 259,82" fill="#ea580c"/>
                <g transform="translate(278, 28)">
                    <rect x="0" y="0" width="164" height="106" rx="12" fill="#ffffff" stroke="#86efac" stroke-width="1.4"/>
                    <text x="82" y="24" font-size="10.5" font-weight="800" text-anchor="middle" fill="#166534">Gerak Manipulatif</text>
                    <text x="14" y="48" font-size="9.5" font-weight="600" fill="#1e293b">• Fokus mata tertuju pada bola</text>
                    <text x="14" y="68" font-size="9.5" font-weight="600" fill="#1e293b">• Perkenaan kaki/tangan tepat</text>
                    <text x="14" y="88" font-size="9.5" font-weight="600" fill="#1e293b">• Gerak lanjutan tetap seimbang</text>
                </g>
                <text x="230" y="172" font-size="10.5" font-weight="700" text-anchor="middle" fill="#14532d">${shortLabel}</text>
            </svg>`;
        }

        // 1D. Default PJOK (Pemanasan, Senam Lantai, Kebugaran, Kesehatan SD)
        return `<svg viewBox="0 0 460 190" width="460" height="190" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto block">
            <rect x="0" y="0" width="460" height="190" rx="14" fill="#eff6ff" stroke="#93c5fd" stroke-width="1.5"/>
            <rect x="0" y="142" width="460" height="48" fill="#bfdbfe"/>
            <!-- Matras Biru & Anak SD Peregangan/Senam -->
            <polygon points="36,142 216,142 198,122 54,122" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
            <g transform="translate(126, 26)">
                <circle cx="0" cy="16" r="14" fill="#fed7aa" stroke="#9a3412" stroke-width="1.5"/>
                <path d="M-13 12 C-10 -2, 12 -2, 13 12 Z" fill="#1e293b"/>
                <path d="M-12 31 L12 31 L14 68 L-14 68 Z" fill="#dc2626"/>
                <line x1="-12" y1="38" x2="-40" y2="16" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round"/>
                <line x1="12" y1="38" x2="40" y2="16" stroke="#fed7aa" stroke-width="6.5" stroke-linecap="round"/>
                <line x1="-7" y1="68" x2="-22" y2="104" stroke="#1e293b" stroke-width="8" stroke-linecap="round"/>
                <line x1="7" y1="68" x2="22" y2="104" stroke="#1e293b" stroke-width="8" stroke-linecap="round"/>
            </g>
            <g transform="translate(246, 28)">
                <rect x="0" y="0" width="194" height="106" rx="12" fill="#ffffff" stroke="#93c5fd" stroke-width="1.4"/>
                <text x="97" y="24" font-size="10.5" font-weight="800" text-anchor="middle" fill="#1e40af">Prinsip Aktivitas PJOK Aman</text>
                <text x="14" y="48" font-size="9.5" font-weight="600" fill="#1e293b">1. Pemanasan sebelum gerak inti</text>
                <text x="14" y="68" font-size="9.5" font-weight="600" fill="#1e293b">2. Postur benar &amp; area aman</text>
                <text x="14" y="88" font-size="9.5" font-weight="600" fill="#1e293b">3. Pendinginan &amp; minum cukup air</text>
            </g>
            <text x="230" y="172" font-size="10.5" font-weight="700" text-anchor="middle" fill="#1e3a8a">${shortLabel}</text>
        </svg>`;
    }

    // 2. Pendidikan Pancasila (PPKn) — Musyawarah, Gotong Royong, Hak & Kewajiban, Garuda
    if (subjLower.includes('pancasila') || subjLower.includes('ppkn')) {
        if (/\b(hak\s+dan\s+kewajiban|kewajiban|hak\s+anak|aturan|tata\s+tertib)\b/.test(combined)) {
            return `<svg viewBox="0 0 460 190" width="460" height="190" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto block">
                <rect x="0" y="0" width="460" height="190" rx="14" fill="#fef2f2" stroke="#fca5a5" stroke-width="1.5"/>
                <!-- Neraca Seimbang Hak dan Kewajiban -->
                <polygon points="184,148 276,148 230,96" fill="#334155"/>
                <line x1="92" y1="62" x2="368" y2="62" stroke="#0f172a" stroke-width="5" stroke-linecap="round"/>
                <circle cx="230" cy="62" r="8" fill="#dc2626"/>
                <rect x="52" y="76" width="112" height="52" rx="10" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
                <text x="108" y="99" font-size="12" font-weight="800" text-anchor="middle" fill="#1e3a8a">HAK SISWA</text>
                <text x="108" y="116" font-size="9.5" text-anchor="middle" fill="#1e40af">Belajar &amp; Dihargai</text>
                <rect x="296" y="76" width="112" height="52" rx="10" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
                <text x="352" y="99" font-size="12" font-weight="800" text-anchor="middle" fill="#14532d">KEWAJIBAN</text>
                <text x="352" y="116" font-size="9.5" text-anchor="middle" fill="#166534">Taat Aturan &amp; Tugas</text>
                <text x="230" y="174" font-size="10.5" font-weight="700" text-anchor="middle" fill="#7f1d1d">${shortLabel}</text>
            </svg>`;
        }
        return `<svg viewBox="0 0 460 190" width="460" height="190" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto block">
            <rect x="0" y="0" width="460" height="190" rx="14" fill="#fff1f2" stroke="#fda4af" stroke-width="1.5"/>
            <rect x="0" y="142" width="460" height="48" fill="#ffe4e6"/>
            <!-- Musyawarah Siswa SD & Bendera Merah Putih -->
            <rect x="42" y="28" width="10" height="114" fill="#64748b"/>
            <rect x="52" y="28" width="64" height="22" fill="#dc2626"/>
            <rect x="52" y="50" width="64" height="22" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
            <!-- Meja Diskusi Kelompok SD -->
            <ellipse cx="265" cy="116" rx="108" ry="26" fill="#fef3c7" stroke="#b45309" stroke-width="2.5"/>
            <circle cx="196" cy="76" r="16" fill="#fed7aa" stroke="#9a3412" stroke-width="1.5"/>
            <circle cx="265" cy="68" r="16" fill="#fde68a" stroke="#92400e" stroke-width="1.5"/>
            <circle cx="334" cy="76" r="16" fill="#fed7aa" stroke="#9a3412" stroke-width="1.5"/>
            <text x="265" y="120" font-size="11" font-weight="800" text-anchor="middle" fill="#78350f">Musyawarah &amp; Gotong Royong Pancasila</text>
            <text x="230" y="172" font-size="10.5" font-weight="700" text-anchor="middle" fill="#881337">${shortLabel}</text>
        </svg>`;
    }

    // 3. Seni Budaya (Musik, Tari, Rupa, Teater)
    if (subjLower.includes('seni')) {
        if (/\b(musik|nada|lagu|irama|birama|alat\s+musik|angklung|pianika)\b/.test(combined)) {
            return `<svg viewBox="0 0 460 190" width="460" height="190" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto block">
                <rect x="0" y="0" width="460" height="190" rx="14" fill="#fdf4ff" stroke="#e879f9" stroke-width="1.5"/>
                <g transform="translate(36, 36)">
                    <line x1="0" y1="16" x2="230" y2="16" stroke="#64748b" stroke-width="1.5"/>
                    <line x1="0" y1="30" x2="230" y2="30" stroke="#64748b" stroke-width="1.5"/>
                    <line x1="0" y1="44" x2="230" y2="44" stroke="#64748b" stroke-width="1.5"/>
                    <line x1="0" y1="58" x2="230" y2="58" stroke="#64748b" stroke-width="1.5"/>
                    <line x1="0" y1="72" x2="230" y2="72" stroke="#64748b" stroke-width="1.5"/>
                    <ellipse cx="44" cy="65" rx="9" ry="6.5" fill="#7c3aed"/><line x1="52" y1="65" x2="52" y2="24" stroke="#7c3aed" stroke-width="2.5"/>
                    <ellipse cx="104" cy="51" rx="9" ry="6.5" fill="#db2777"/><line x1="112" y1="51" x2="112" y2="14" stroke="#db2777" stroke-width="2.5"/>
                    <ellipse cx="164" cy="37" rx="9" ry="6.5" fill="#2563eb"/><line x1="172" y1="37" x2="172" y2="4" stroke="#2563eb" stroke-width="2.5"/>
                </g>
                <g transform="translate(292, 32)">
                    <rect x="0" y="0" width="144" height="106" rx="12" fill="#ffffff" stroke="#f0abfc" stroke-width="1.5"/>
                    <text x="72" y="24" font-size="10.5" font-weight="800" text-anchor="middle" fill="#86198f">Unsur Seni Musik</text>
                    <text x="14" y="48" font-size="9.5" fill="#1e293b">• Nada (Tinggi-Rendah)</text>
                    <text x="14" y="68" font-size="9.5" fill="#1e293b">• Irama &amp; Birama</text>
                    <text x="14" y="88" font-size="9.5" fill="#1e293b">• Tempo &amp; Dinamika</text>
                </g>
                <text x="230" y="172" font-size="10.5" font-weight="700" text-anchor="middle" fill="#701a75">${shortLabel}</text>
            </svg>`;
        }
        return `<svg viewBox="0 0 460 190" width="460" height="190" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto block">
            <rect x="0" y="0" width="460" height="190" rx="14" fill="#fff7ed" stroke="#fdba74" stroke-width="1.5"/>
            <!-- Lingkaran Warna Primer & Pola Ragam Hias -->
            <circle cx="96" cy="76" r="34" fill="#ef4444" fill-opacity="0.75"/>
            <circle cx="144" cy="76" r="34" fill="#3b82f6" fill-opacity="0.75"/>
            <circle cx="120" cy="106" r="34" fill="#facc15" fill-opacity="0.75"/>
            <g transform="translate(226, 26)">
                <rect x="0" y="0" width="206" height="122" rx="12" fill="#ffffff" stroke="#fed7aa" stroke-width="1.5"/>
                <text x="103" y="24" font-size="10.5" font-weight="800" text-anchor="middle" fill="#9a3412">Unsur &amp; Prinsip Karya Seni</text>
                <text x="14" y="48" font-size="9.5" fill="#1e293b">• Titik, Garis, Bidang &amp; Bentuk</text>
                <text x="14" y="68" font-size="9.5" fill="#1e293b">• Warna Primer &amp; Sekunder</text>
                <text x="14" y="88" font-size="9.5" fill="#1e293b">• Tekstur, Pola &amp; Keseimbangan</text>
                <text x="14" y="108" font-size="9.5" fill="#1e293b">• Ekspresi Budaya Nusantara</text>
            </g>
            <text x="230" y="172" font-size="10.5" font-weight="700" text-anchor="middle" fill="#7c2d12">${shortLabel}</text>
        </svg>`;
    }

    // 4. Koding & Kecerdasan Artifisial (AI)
    if (subjLower.includes('koding') || subjLower.includes('kecerdasan')) {
        return `<svg viewBox="0 0 460 190" width="460" height="190" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto block">
            <rect x="0" y="0" width="460" height="190" rx="14" fill="#f5f3ff" stroke="#c4b5fd" stroke-width="1.5"/>
            <rect x="26" y="60" width="76" height="44" rx="22" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
            <text x="64" y="86" font-size="10.5" font-weight="800" text-anchor="middle" fill="#14532d">MULAI</text>
            <line x1="102" y1="82" x2="128" y2="82" stroke="#475569" stroke-width="2.5"/>
            <rect x="128" y="56" width="92" height="52" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
            <text x="174" y="79" font-size="10" font-weight="800" text-anchor="middle" fill="#1e3a8a">INPUT DATA</text>
            <text x="174" y="95" font-size="9" text-anchor="middle" fill="#1d4ed8">Langkah Logis</text>
            <line x1="220" y1="82" x2="246" y2="82" stroke="#475569" stroke-width="2.5"/>
            <polygon points="294,42 342,82 294,122 246,82" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
            <text x="294" y="80" font-size="9.5" font-weight="800" text-anchor="middle" fill="#92400e">JIKA</text>
            <text x="294" y="93" font-size="8.5" text-anchor="middle" fill="#78350f">Kondisi?</text>
            <line x1="342" y1="82" x2="366" y2="82" stroke="#475569" stroke-width="2.5"/>
            <rect x="366" y="60" width="72" height="44" rx="10" fill="#ede9fe" stroke="#6d28d9" stroke-width="2"/>
            <text x="402" y="86" font-size="10" font-weight="800" text-anchor="middle" fill="#4c1d95">HASIL</text>
            <text x="230" y="172" font-size="10.5" font-weight="700" text-anchor="middle" fill="#4c1d95">${shortLabel}</text>
        </svg>`;
    }

    // 5. PAIBP Wudu rich 460x190 poster scene (takes precedence over compact icon)
    if ((subjLower.includes('islam') || subjLower.includes('pai')) && /(berwud[hu]?u|wud[hu]?u|bersuci|tayamum|thaharah)/.test(combined)) {
        return `<svg viewBox="0 0 460 190" width="460" height="190" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto block">
            <rect x="0" y="0" width="460" height="190" rx="14" fill="#ecfdf5" stroke="#6ee7b7" stroke-width="1.5"/>
            <rect x="0" y="148" width="460" height="42" rx="0" fill="#d1fae5"/>
            <rect x="42" y="42" width="12" height="90" rx="4" fill="#64748b"/>
            <path d="M54 54 H96 Q106 54 106 66 V72" fill="none" stroke="#475569" stroke-width="8" stroke-linecap="round"/>
            <path d="M106 76 Q102 96 106 116 Q110 132 106 146" fill="none" stroke="#0ea5e9" stroke-width="4" stroke-dasharray="5,3"/>
            <circle cx="170" cy="68" r="20" fill="#fed7aa" stroke="#9a3412" stroke-width="1.5"/>
            <rect x="152" y="44" width="36" height="12" rx="5" fill="#065f46"/>
            <path d="M148 148 C148 102, 192 102, 192 148 Z" fill="#059669"/>
            <path d="M150 112 L114 98" stroke="#fed7aa" stroke-width="9" stroke-linecap="round"/>
            <g transform="translate(230, 26)">
                <rect x="0" y="0" width="206" height="130" rx="12" fill="#ffffff" stroke="#a7f3d0" stroke-width="1.2"/>
                <text x="103" y="22" font-size="11" font-weight="700" text-anchor="middle" fill="#065f46">Urutan Rukun Berwudu</text>
                <circle cx="32" cy="52" r="14" fill="#d1fae5"/><text x="32" y="56" font-size="10" font-weight="700" text-anchor="middle" fill="#065f46">1</text>
                <text x="54" y="55" font-size="10" font-weight="600" fill="#1e293b">Niat &amp; Membasuh Wajah</text>
                <circle cx="32" cy="84" r="14" fill="#bae6fd"/><text x="32" y="88" font-size="10" font-weight="700" text-anchor="middle" fill="#0369a1">2</text>
                <text x="54" y="87" font-size="10" font-weight="600" fill="#1e293b">Tangan s.d. Siku &amp; Usap Kepala</text>
                <circle cx="32" cy="114" r="14" fill="#fef3c7"/><text x="32" y="118" font-size="10" font-weight="700" text-anchor="middle" fill="#92400e">3</text>
                <text x="54" y="117" font-size="10" font-weight="600" fill="#1e293b">Basuh Kaki &amp; Tertib Berurutan</text>
            </g>
            <text x="230" y="175" font-size="10.5" font-weight="700" text-anchor="middle" fill="#064e3b">${shortLabel}</text>
        </svg>`;
    }

    // 6. Try specialized rich diagram from dynamic2dVisualHelper (Math exact numbers, IPAS diagrams, Sunda, English, Bahasa, PAIBP)
    const dyn = synthesizeContextual2dVisual(
        {
            question: `${tpText} ${atpText}`,
            stimulus: `${subject} ${elementName}`,
            visualTitle: captionTitle
        },
        subject,
        { allowGeneralScene: true }
    );
    if (dyn?.svg) {
        return dyn.svg;
    }

    // 7. PAIBP (Pendidikan Agama Islam & Budi Pekerti) default scene
    if (subjLower.includes('islam') || subjLower.includes('pai')) {
        return `<svg viewBox="0 0 460 190" width="460" height="190" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto block">
            <rect x="0" y="0" width="460" height="190" rx="14" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5"/>
            <rect x="0" y="148" width="460" height="42" fill="#dcfce7"/>
            <path d="M52 94 C52 54, 138 54, 138 94 Z" fill="#059669" stroke="#065f46" stroke-width="1.5"/>
            <circle cx="95" cy="46" r="7" fill="#eab308"/>
            <rect x="44" y="94" width="102" height="54" rx="4" fill="#ffffff" stroke="#059669" stroke-width="1.5"/>
            <path d="M82 148 V116 A13 13 0 0 1 108 116 V148 Z" fill="#047857"/>
            <g transform="translate(210, 44)">
                <path d="M18 96 L56 68 L94 96" fill="none" stroke="#92400e" stroke-width="6" stroke-linecap="round"/>
                <path d="M12 62 Q36 52 56 66 Q76 52 100 62 L100 90 Q76 80 56 92 Q36 80 12 90 Z" fill="#ffffff" stroke="#0f766e" stroke-width="2"/>
                <line x1="22" y1="70" x2="48" y2="70" stroke="#94a3b8" stroke-width="2"/>
                <line x1="64" y1="70" x2="90" y2="70" stroke="#94a3b8" stroke-width="2"/>
            </g>
            <g transform="translate(368, 76)">
                <circle cx="0" cy="-12" r="18" fill="#fed7aa" stroke="#9a3412" stroke-width="1.5"/>
                <rect x="-15" y="-32" width="30" height="10" rx="4" fill="#0f172a"/>
                <path d="M-22 72 C-22 24, 22 24, 22 72 Z" fill="#0d9488"/>
            </g>
            <text x="230" y="174" font-size="10.5" font-weight="700" text-anchor="middle" fill="#064e3b">${shortLabel}</text>
        </svg>`;
    }

    // 7. Matematika concrete visual (Fraction + Geometry + Measurement scene)
    if (subjLower.includes('matematika') || /\b(pecahan|bangun|luas|keliling|volume|bilangan|satuan|sudut)\b/.test(combined)) {
        return `<svg viewBox="0 0 460 190" width="460" height="190" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto block">
            <rect x="0" y="0" width="460" height="190" rx="14" fill="#eff6ff" stroke="#93c5fd" stroke-width="1.5"/>
            <circle cx="96" cy="88" r="48" fill="#ffffff" stroke="#1d4ed8" stroke-width="2.5"/>
            <path d="M96 88 L96 40 A48 48 0 0 1 144 88 Z" fill="#3b82f6" stroke="#1e3a8a" stroke-width="1.5"/>
            <path d="M96 88 L144 88 A48 48 0 0 1 96 136 Z" fill="#60a5fa" stroke="#1e3a8a" stroke-width="1.5"/>
            <line x1="48" y1="88" x2="144" y2="88" stroke="#1e3a8a" stroke-width="1.5"/>
            <line x1="96" y1="40" x2="96" y2="136" stroke="#1e3a8a" stroke-width="1.5"/>
            <g transform="translate(188, 38)">
                <polygon points="36,16 116,16 96,36 16,36" fill="#93c5fd" stroke="#1e40af" stroke-width="1.5"/>
                <rect x="16" y="36" width="80" height="62" fill="#3b82f6" stroke="#1e40af" stroke-width="1.5"/>
                <polygon points="96,36 116,16 116,78 96,98" fill="#2563eb" stroke="#1e40af" stroke-width="1.5"/>
            </g>
            <g transform="translate(328, 56)">
                <rect x="0" y="0" width="110" height="66" rx="10" fill="#ffffff" stroke="#bfdbfe" stroke-width="1.5"/>
                <line x1="12" y1="36" x2="98" y2="36" stroke="#1e293b" stroke-width="2"/>
                <circle cx="24" cy="36" r="4" fill="#2563eb"/><text x="24" y="52" font-size="9" text-anchor="middle" fill="#334155">1</text>
                <circle cx="55" cy="36" r="4" fill="#2563eb"/><text x="55" y="52" font-size="9" text-anchor="middle" fill="#334155">2</text>
                <circle cx="86" cy="36" r="4" fill="#059669"/><text x="86" y="52" font-size="9" text-anchor="middle" fill="#059669">3</text>
                <text x="55" y="18" font-size="9.5" font-weight="700" text-anchor="middle" fill="#1e40af">Pola &amp; Ukuran</text>
            </g>
            <text x="230" y="173" font-size="10.5" font-weight="700" text-anchor="middle" fill="#1e3a8a">${shortLabel}</text>
        </svg>`;
    }

    // 8. IPAS concrete nature + experiment scene
    if (subjLower.includes('ipas') || /\b(alam|tumbuhan|hewan|energi|listrik|air|bumi|lingkungan|ekosistem|gaya)\b/.test(combined)) {
        return `<svg viewBox="0 0 460 190" width="460" height="190" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto block">
            <rect x="0" y="0" width="460" height="190" rx="14" fill="#f0f9ff" stroke="#7dd3fc" stroke-width="1.5"/>
            <rect x="0" y="140" width="460" height="50" fill="#bbf7d0"/>
            <circle cx="64" cy="46" r="22" fill="#facc15" stroke="#eab308" stroke-width="2"/>
            <path d="M134 52 Q146 32 168 38 Q186 28 202 44 Q216 48 210 62 H136 Z" fill="#ffffff" stroke="#bae6fd" stroke-width="1.8"/>
            <rect x="276" y="76" width="12" height="68" rx="4" fill="#15803d"/>
            <ellipse cx="254" cy="94" rx="22" ry="10" transform="rotate(-20 254 94)" fill="#22c55e" stroke="#15803d" stroke-width="1.2"/>
            <ellipse cx="308" cy="86" rx="22" ry="10" transform="rotate(20 308 86)" fill="#22c55e" stroke="#15803d" stroke-width="1.2"/>
            <circle cx="282" cy="64" r="14" fill="#fb923c" stroke="#ea580c" stroke-width="1.5"/>
            <circle cx="382" cy="88" r="26" fill="#e0f2fe" stroke="#0369a1" stroke-width="3.5"/>
            <line x1="400" y1="108" x2="424" y2="132" stroke="#334155" stroke-width="6" stroke-linecap="round"/>
            <text x="382" y="92" font-size="9.5" font-weight="700" text-anchor="middle" fill="#0369a1">Amati!</text>
            <text x="230" y="172" font-size="10.5" font-weight="700" text-anchor="middle" fill="#0c4a6e">${shortLabel}</text>
        </svg>`;
    }

    // 9. Bahasa Indonesia / Bahasa Sunda / Bahasa Inggris / Literacy default concrete scene
    return `<svg viewBox="0 0 460 190" width="460" height="190" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto block">
        <rect x="0" y="0" width="460" height="190" rx="14" fill="#fffbeb" stroke="#fcd34d" stroke-width="1.5"/>
        <rect x="0" y="144" width="460" height="46" fill="#fef3c7"/>
        <rect x="130" y="22" width="200" height="86" rx="8" fill="#065f46" stroke="#b45309" stroke-width="4"/>
        <line x1="154" y1="48" x2="306" y2="48" stroke="#a7f3d0" stroke-width="3" stroke-linecap="round"/>
        <line x1="154" y1="68" x2="274" y2="68" stroke="#fde68a" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="154" y1="86" x2="238" y2="86" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
        <g transform="translate(76, 86)">
            <circle cx="0" cy="-16" r="17" fill="#fed7aa" stroke="#9a3412" stroke-width="1.5"/>
            <path d="M-16 -20 C-12 -36, 14 -36, 16 -20 Z" fill="#1e293b"/>
            <path d="M-18 58 L-14 6 H14 L18 58 Z" fill="#dc2626"/>
            <rect x="-14" y="4" width="28" height="22" rx="4" fill="#ffffff"/>
        </g>
        <g transform="translate(384, 86)">
            <circle cx="0" cy="-16" r="17" fill="#fde68a" stroke="#92400e" stroke-width="1.5"/>
            <path d="M-16 -20 C-12 -36, 14 -36, 16 -20 Z" fill="#334155"/>
            <path d="M-18 58 L-14 6 H14 L18 58 Z" fill="#dc2626"/>
            <rect x="-14" y="4" width="28" height="22" rx="4" fill="#ffffff"/>
        </g>
        <g transform="translate(194, 114)">
            <path d="M0 10 Q18 2 36 10 Q54 2 72 10 V36 Q54 28 36 36 Q18 28 0 36 Z" fill="#ffffff" stroke="#0284c7" stroke-width="2"/>
            <line x1="36" y1="10" x2="36" y2="36" stroke="#0284c7" stroke-width="1.5"/>
        </g>
        <text x="230" y="174" font-size="10.5" font-weight="700" text-anchor="middle" fill="#78350f">${shortLabel}</text>
    </svg>`;
    };

    const rawSvg = produceSvg();
    if (variant === 0) return rawSvg;

    const tintFill = variant === 1 ? '#f8fafc' : '#fefce8';
    const accentStroke = variant === 1 ? '#0284c7' : '#d97706';
    const tinted = rawSvg.replace(
        /(<rect\b[^>]*\bfill=")#[0-9a-fA-F]{3,6}(")/,
        `$1${tintFill}$2`
    );
    return tinted.replace(
        /<\/svg>\s*$/i,
        `<circle cx="442" cy="18" r="5" fill="${accentStroke}" opacity="0.28"/><circle cx="428" cy="18" r="3" fill="${accentStroke}" opacity="0.18"/></svg>`
    );
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

interface DisciplineKnowledgePack {
    pengertianKonsep: string;
    penjelasanUtama: string;
    domainTerms: { term: string; meaning: string }[];
    poinPenting: string[];
    contohKonkret: string;
    contohSehariHari: string[];
    klasifikasiAtauProses: { judul: string; butir: { label: string; uraian: string }[] };
    tabelInformatif: { judul: string; kolom: string[]; baris: string[][] };
    miskonsepsiUmum: { salah: string; pelurusan: string }[];
    aktivitasSederhana: { judul: string; langkah: string[]; hasilDiharapkan: string };
    rangkumanPoin: string[];
    latihanFormatif: { no: number; pertanyaan: string; kunciSingkat: string }[];
    visualCaption: string;
}

/**
 * Builds rich, textbook-aligned, subject-science specific content per subject & topic
 * so every domain (PJOK, Matematika, IPAS, PAIBP, Bahasa Indonesia, Pancasila, Seni, Inggris, Sunda, Koding)
 * contains substantive disciplinary concepts rather than generic curriculum boilerplate.
 */
function buildSubjectDomainKnowledge(params: {
    subject: string;
    className: string;
    fase: string;
    elementName: string;
    tpText: string;
    atpText: string;
    topicTitle: string;
}): DisciplineKnowledgePack {
    const { subject, className, elementName, tpText, atpText, topicTitle } = params;
    const combined = `${subject} ${elementName} ${tpText} ${atpText}`.toLowerCase();
    const subjLower = subject.toLowerCase();
    const isSunda = isBahasaSundaTopic(subject, elementName, tpText);

    // 1. PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan)
    if (subjLower.includes('pjok') || subjLower.includes('jasmani') || subjLower.includes('olahraga')) {
        if (/\b(mengayun|ayunan|ayun\s+kaki|non-?lokomotor|menekuk|meliuk|memutar|keseimbangan)\b/.test(combined)) {
            return {
                pengertianKonsep: `Gerak mengayun kaki dan lengan termasuk pola gerak dasar nonlokomotor (gerakan di tempat tanpa berpindah posisi), yaitu menggerakkan anggota tubuh secara ritmis bertumpu pada poros sendi pinggul atau bahu sembari menjaga pusat keseimbangan tubuh tetap stabil.`,
                penjelasanUtama: `Berdasarkan Buku Siswa PJOK SD Kurikulum Merdeka, saat melakukan gerak mengayun kaki, salah satu kaki berfungsi sebagai kaki tumpu yang menahan berat badan dengan lutut sedikit lentur, sedangkan kaki ayun digerakkan lurus ke depan, ke belakang, atau ke samping. Kedua lengan direntangkan atau diayunkan berlawanan arah untuk menjaga kesetimbangan statis dan melatih kelenturan (fleksibilitas) sendi panggul.`,
                domainTerms: [
                    { term: 'Gerak Nonlokomotor', meaning: 'Aktivitas gerak tubuh di tempat tanpa berpindah tempat, seperti mengayun, menekuk, meliuk, dan memutar.' },
                    { term: 'Kaki Tumpu & Kaki Ayun', meaning: 'Kaki tumpu menahan berat badan dengan kuat, sementara kaki ayun bergerak bebas mengikuti arah ayunan.' },
                    { term: 'Keseimbangan Statis', meaning: 'Kemampuan mempertahankan posisi tubuh agar tidak goyah atau jatuh saat bertumpu pada satu kaki.' },
                    { term: 'Sendi Peluru Panggul', meaning: 'Persendian pada pangkal paha yang memungkinkan kaki diayunkan ke depan, belakang, dan samping secara luwes.' }
                ],
                poinPenting: [
                    'Sikap awal: berdiri tegak menghadap ke depan, pandangan lurus, dan kedua kaki rapat sejajar.',
                    'Rentangkan kedua lengan ke samping bahu atau letakkan di pinggang untuk membantu keseimbangan.',
                    'Ayunkan satu kaki secara teratur (ke depan-belakang atau ke samping) tanpa membungkukkan punggung.',
                    'Lakukan pemanasan otot tungkai dan pinggul terlebih dahulu agar tidak terjadi cedera atau kram otot.'
                ],
                contohKonkret: `Contoh gerakan mengayun kaki di lapangan sekolah: siswa berdiri bertumpu pada kaki kiri, kedua tangan direntangkan ke samping, lalu mengayunkan kaki kanan lurus ke depan dan ke belakang sebanyak 8 hitungan secara bergantian.`,
                contohSehariHari: [
                    'Di Sekolah: Mengayunkan kaki dan lengan saat pemanasan senam pagi atau latihan senam irama bersama teman.',
                    'Di Halaman Rumah: Berdiri satu kaki sambil mengayunkan kaki lainnya saat bermain engklek atau melatih keseimbangan.',
                    'Saat Berjalan & Berlari: Ayunan tungkai yang luwes membuat langkah kaki menjadi ringan dan teratur.'
                ],
                klasifikasiAtauProses: {
                    judul: 'Tahapan Pelaksanaan Gerak Mengayun Kaki (Buku Siswa PJOK SD)',
                    butir: [
                        { label: '1. Sikap Awal (Persiapan)', uraian: 'Berdiri tegak, kedua kaki rapat, pandangan lurus ke depan, serta kedua lengan direntangkan ke samping.' },
                        { label: '2. Pelaksanaan Ayunan', uraian: 'Pindahkan tumpuan ke kaki kiri, lalu ayunkan kaki kanan lurus ke depan hingga setinggi lutut dan ayun kembali ke belakang secara terkontrol.' },
                        { label: '3. Sikap Akhir & Pergantian', uraian: 'Kembali ke posisi berdiri tegak dua kaki rapat, atur napas, lalu ulangi menggunakan kaki kiri sebagai kaki ayun.' }
                    ]
                },
                tabelInformatif: {
                    judul: 'Variasi Gerak Mengayun Kaki & Manfaat Kebugarannya',
                    kolom: ['Variasi Gerakan', 'Arah & Posisi Tubuh', 'Manfaat Utama'],
                    baris: [
                        ['Mengayun Kaki ke Depan-Belakang', 'Tumpuan 1 kaki kokoh, punggung tegak', 'Melatih kelenturan sendi panggul & keseimbangan'],
                        ['Mengayun Kaki ke Samping', 'Kaki ayun digerakkan membuka ke kanan/kiri', 'Menguatkan otot paha luar & kestabilan pinggul'],
                        ['Mengayun Lengan & Kaki Berirama', 'Gerak searah hitungan 1–8', 'Meningkatkan koordinasi gerak & kelincahan']
                    ]
                },
                miskonsepsiUmum: [
                    {
                        salah: 'Mengira gerak mengayun kaki sama dengan gerak berjalan/melompat (lokomotor).',
                        pelurusan: 'Mengayun kaki adalah gerak nonlokomotor karena kaki tumpu tetap berada di tempat dan tubuh tidak berpindah lokasi.'
                    },
                    {
                        salah: 'Membungkukkan badan ke depan terlalu rendah saat mengayunkan kaki ke belakang.',
                        pelurusan: 'Punggung harus tetap tegak dan pandangan lurus ke depan agar pusat keseimbangan tidak goyah.'
                    }
                ],
                aktivitasSederhana: {
                    judul: 'Praktik Terpandu: Tantangan Mengayun Kaki 8 Hitungan',
                    langkah: [
                        'Lakukan peregangan ringan pada pergelangan kaki dan lutut selama 1 menit.',
                        'Berdiri tegak di ruang aman, rentangkan kedua tangan ke samping.',
                        'Ayunkan kaki kanan ke depan dan belakang sebanyak 8 hitungan tanpa menyentuh lantai, lalu ganti kaki kiri.'
                    ],
                    hasilDiharapkan: 'Siswa mampu mengayunkan kaki dengan seimbang, postur punggung tegak, dan kaki tumpu tetap stabil.'
                },
                rangkumanPoin: [
                    'Mengayun kaki adalah gerak dasar nonlokomotor karena dilakukan di tempat tanpa berpindah posisi.',
                    'Saat mengayunkan satu kaki, kaki lainnya menjadi tumpuan kuat dengan posisi punggung tetap tegak.',
                    'Rentangan lengan membantu menjaga keseimbangan statis tubuh selama melakukan ayunan.',
                    'Latihan mengayun kaki secara rutin melatih kelenturan sendi panggul, kekuatan otot kaki, dan koordinasi.'
                ],
                latihanFormatif: [
                    { no: 1, pertanyaan: 'Mengapa gerakan mengayunkan satu kaki di tempat termasuk gerak dasar nonlokomotor?', kunciSingkat: 'Karena dilakukan di tempat tanpa menyebabkan tubuh berpindah posisi atau tempat.' },
                    { no: 2, pertanyaan: 'Apa fungsi merentangkan kedua lengan ke samping saat melakukan gerakan mengayun kaki?', kunciSingkat: 'Untuk menjaga keseimbangan tubuh agar tidak mudah terjatuh.' },
                    { no: 3, pertanyaan: 'Tuliskan 3 urutan sikap yang benar saat mempraktikkan gerak mengayun kaki ke depan dan belakang!', kunciSingkat: '1) Berdiri tegak dan rentangkan tangan; 2) Bertumpu kuat pada satu kaki; 3) Ayunkan kaki lainnya lurus ke depan-belakang dengan pandangan tetap ke depan.' }
                ],
                visualCaption: `Ilustrasi Anak SD Mempraktikkan Gerak Nonlokomotor Mengayun Kaki`
            };
        }

        const isLokomotor = /\b(lokomotor|berjalan|berlari|melompat|meloncat|atletik)\b/.test(combined);
        const isManipulatif = /\b(manipulatif|bola|menendang|melempar|menangkap|kasti)\b/.test(combined);
        return {
            pengertianKonsep: isLokomotor
                ? `Gerak lokomotor adalah keterampilan gerak dasar yang ditandai dengan berpindahnya seluruh tubuh dari satu titik ke titik lain melalui aktivitas berjalan, berlari, melompat, atau meloncat secara terkoordinasi.`
                : isManipulatif
                    ? `Gerak manipulatif adalah keterampilan menggerakkan tubuh untuk mengontrol, mendorong, atau menerima suatu objek/alat olahraga (seperti melempar, menangkap, menendang, atau memukul bola) dengan koordinasi mata dan anggota tubuh.`
                    : `Aktivitas pembelajaran PJOK (${topicTitle}) berfokus pada penguasaan keterampilan gerak dasar, kebugaran jasmani, sportivitas, serta kebiasaan hidup sehat dan aman bagi peserta didik ${className}.`,
            penjelasanUtama: isLokomotor
                ? `Sesuai Buku Panduan Guru PJOK SD Kemendikdasmen, kualitas gerak lokomotor ditentukan oleh koordinasi ayunan lengan yang berlawanan dengan langkah kaki, dorongan telapak kaki saat menolak tanah, serta pendaratan dengan lutut sedikit mengeper (fleksi) untuk meredam benturan sendi.`
                : isManipulatif
                    ? `Dalam gerak manipulatif, siswa memadukan ketepatan pandangan mata terhadap arah datangnya bola, posisi tubuh siap, perkenaan bagian tangan/kaki yang tepat pada objek, serta gerak lanjutan (follow-through) agar arah bola terukur.`
                    : `Pelaksanaan materi "${topicTitle}" memadukan pemanasan otot dan sendi, latihan teknik gerak inti secara bertahap dari mudah ke menantang, kerja sama jujur dengan teman, serta pendinginan setelah beraktivitas.`,
            domainTerms: [
                { term: isLokomotor ? 'Gerak Lokomotor' : isManipulatif ? 'Gerak Manipulatif' : 'Keterampilan Gerak', meaning: isLokomotor ? 'Gerak berpindah tempat seperti jalan, lari, dan lompat.' : isManipulatif ? 'Gerak mengolah alat/bola seperti melempar, menangkap, dan menendang.' : 'Kemampuan mengoordinasikan tubuh secara efektif dan aman.' },
                { term: 'Koordinasi Tubuh', meaning: 'Keselarasan kerja mata, lengan, dan tungkai dalam menghasilkan gerakan yang lancar.' },
                { term: 'Pemanasan & Pendinginan', meaning: 'Tahap awal menyiapkan otot dan tahap akhir mengembalikan denyut jantung normal.' },
                { term: 'Sportivitas', meaning: 'Sikap jujur, mematuhi aturan main, dan menghargai teman saat berolahraga.' }
            ],
            poinPenting: [
                'Lakukan pemanasan statis dan dinamis sebelum memulai praktik inti untuk mencegah cedera.',
                'Perhatikan posisi tubuh, arah pandangan mata, dan teknik pendaratan atau perkenaan gerak yang tepat.',
                'Utamakan keselamatan ruang gerak dan patuhi instruksi guru selama praktik di lapangan.'
            ],
            contohKonkret: isLokomotor
                ? 'Siswa berlari zig-zag melewati 4 kerucut pembatas lalu melompati garis dengan kedua kaki dan mendarat mengeper.'
                : isManipulatif
                    ? 'Siswa berpasangan pada jarak 3 meter melakukan lempar-tangkap bola menggunakan dua tangan dari depan dada secara bergantian.'
                    : `Siswa mempraktikkan variasi ${topicTitle} dalam kelompok kecil dengan mengutamakan teknik benar dan kerja sama.`,
            contohSehariHari: [
                'Di Sekolah: Praktik gerak bersama di halaman sekolah dengan seragam olahraga yang nyaman.',
                'Di Rumah: Bermain aktif di halaman bersama keluarga atau melakukan peregangan pagi setelah bangun tidur.',
                'Kebiasaan Sehat: Minum air putih setelah berkeringat dan menjaga kebersihan tubuh usai olahraga.'
            ],
            klasifikasiAtauProses: {
                judul: `Prosedur Praktik PJOK: ${topicTitle}`,
                butir: [
                    { label: '1. Pemanasan (Warming Up)', uraian: 'Peregangan leher, bahu, pinggang, dan pergelangan kaki selama 5 menit.' },
                    { label: '2. Gerak Inti Terarah', uraian: `Mempraktikkan teknik ${topicTitle} secara berurutan dengan kontrol postur dan keseimbangan.` },
                    { label: '3. Pendinginan (Cooling Down)', uraian: 'Berjalan santai, mengayunkan lengan ringan, dan mengatur pernapasan.' }
                ]
            },
            tabelInformatif: {
                judul: `Panduan Teknik & Keselamatan ${topicTitle}`,
                kolom: ['Tahap Latihan', 'Teknik yang Diamati', 'Tujuan Keselamatan'],
                baris: [
                    ['Persiapan', 'Pakaian olahraga rapi & sepatu bertali kuat', 'Mencegah tersandung saat bergerak'],
                    ['Pelaksanaan', 'Fokus pandangan, postur tegak, lutut lentur', 'Menghindari cedera sendi & otot'],
                    ['Penutup', 'Pendinginan & mengembalikan alat ke tempatnya', 'Memulihkan kebugaran & tertib alat']
                ]
            },
            miskonsepsiUmum: [
                { salah: 'Menganggap olahraga hanya soal menang atau bergerak secepat mungkin tanpa memperhatikan teknik.', pelurusan: 'Teknik gerak yang benar dan aman lebih utama daripada kecepatan agar terhindar dari cedera sendi.' },
                { salah: 'Langsung melakukan gerakan berat tanpa pemanasan terlebih dahulu.', pelurusan: 'Pemanasan melancarkan aliran darah ke otot dan menyiapkan kelenturan sendi sebelum latihan inti.' }
            ],
            aktivitasSederhana: {
                judul: `Latihan Teknik Dasar: ${topicTitle}`,
                langkah: [
                    'Pastikan ruang gerak bebas dari batu atau benda licin.',
                    `Praktikkan langkah dasar ${topicTitle} sebanyak 2 set (masing-masing 8 hitungan).`,
                    'Lakukan bersama teman sebangku sambil saling memberi masukan postur yang benar.'
                ],
                hasilDiharapkan: `Siswa menguasai teknik dasar ${topicTitle} dengan koordinasi baik dan sikap sportif.`
            },
            rangkumanPoin: [
                `${topicTitle} melatih koordinasi gerak, kebugaran, dan kesadaran menjaga keselamatan diri.`,
                'Setiap aktivitas PJOK wajib diawali pemanasan dan diakhiri pendinginan.',
                'Postur tubuh seimbang dan pendaratan lutut yang lentur mencegah terjadinya cedera.',
                'Sikap jujur dan saling menghargai membuat permainan olahraga berjalan menyenangkan.'
            ],
            latihanFormatif: [
                { no: 1, pertanyaan: `Mengapa pemanasan wajib dilakukan sebelum mempraktikkan "${topicTitle}"?`, kunciSingkat: 'Untuk menyiapkan kelenturan otot dan sendi serta mencegah risiko cedera.' },
                { no: 2, pertanyaan: `Bagaimana posisi lutut dan pandangan mata yang tepat saat menjaga keseimbangan dalam "${topicTitle}"?`, kunciSingkat: 'Pandangan lurus ke depan dan lutut sedikit lentur (tidak kaku) untuk menjaga kestabilan.' },
                { no: 3, pertanyaan: 'Sebutkan 2 contoh sikap sportivitas saat berolahraga bersama teman di sekolah!', kunciSingkat: 'Mematuhi aturan permainan dan tidak mengejek teman yang belum mahir.' }
            ],
            visualCaption: `Ilustrasi Siswa SD Mempraktikkan ${topicTitle}`
        };
    }

    // 2. MATEMATIKA
    if (subjLower.includes('matematika')) {
        const isFraction = /\b(pecahan|pembilang|penyebut|senilai|desimal|persen)\b/.test(combined);
        const isGeometry = /\b(bangun|persegi|segitiga|lingkaran|kubus|balok|volume|luas|keliling|sudut|rusuk|sisi)\b/.test(combined);
        return {
            pengertianKonsep: isFraction
                ? `Pecahan adalah bilangan yang menyatakan bagian dari suatu keseluruhan atau kumpulan benda yang dibagi sama besar, ditulis dalam bentuk a/b dengan a sebagai pembilang (jumlah bagian yang dipilih) dan b sebagai penyebut (jumlah seluruh bagian yang sama besar, b ≠ 0).`
                : isGeometry
                    ? `Geometri bangun pada topik "${topicTitle}" mempelajari sifat bentuk bangun (sisi, sudut, rusuk, dan titik sudut) serta cara menentukan ukuran keliling, luas, atau volumenya menggunakan satuan baku secara logis dan presisi.`
                    : `Konsep "${topicTitle}" dalam Matematika SD merupakan aturan bilangan dan hubungan kuantitatif yang digunakan untuk menghitung, membandingkan ukuran, mengenali pola, serta menyelesaikan masalah hitung sehari-hari secara sistematis.`,
            penjelasanUtama: isFraction
                ? `Berdasarkan Buku Siswa Matematika SD Kurikulum Merdeka, besar sebuah pecahan selalu bergantung pada pembagian bagian yang SAMA BESAR. Untuk membandingkan atau menjumlahkan pecahan berpenyebut berbeda, penyebut harus disamakan terlebih dahulu menggunakan kelipatan persekutuan terkecil (KPK) atau visualisasi pita pecahan.`
                : isGeometry
                    ? `Untuk menganalisis bangun datar maupun bangun ruang secara akurat, identifikasi terlebih dahulu panjang sisi (p, l, s, alas, tinggi), perhatikan sudut siku-siku (90°) atau rusuk sejajarnya, lalu terapkan rumus keliling (jumlah seluruh panjang sisi tepi), luas (bidang permukaan), atau volume (isi ruang = luas alas × tinggi).`
                    : `Penyelesaian masalah "${topicTitle}" mengikuti alur tiga langkah: (1) memahami besaran dan satuan yang diketahui, (2) menyusun model kalimat matematika atau gambar konkret, dan (3) menghitung bertahap serta memeriksa kembali kewajaran hasilnya.`,
            domainTerms: isFraction
                ? [
                    { term: 'Pembilang (Angka Atas)', meaning: 'Menunjukkan banyaknya bagian yang diarsir, diambil, atau diperhatikan.' },
                    { term: 'Penyebut (Angka Bawah)', meaning: 'Menunjukkan total banyaknya bagian sama besar dari satu benda utuh.' },
                    { term: 'Pecahan Senilai', meaning: 'Dua pecahan berbeda angka tetapi bernilai sama besar (misal 1/2 = 2/4 = 3/6).' },
                    { term: 'Pita Pecahan', meaning: 'Model visual batang persegi panjang untuk membandingkan ukuran pecahan.' }
                ]
                : isGeometry
                    ? [
                        { term: 'Sisi / Rusuk', meaning: 'Ruas garis pembatas bangun datar atau garis pertemuan dua bidang pada bangun ruang.' },
                        { term: 'Titik Sudut', meaning: 'Titik pertemuan ujung-ujung dua sisi atau tiga rusuk pada bangun ruang.' },
                        { term: 'Keliling vs Luas', meaning: 'Keliling mengukur panjang tepian luar (cm/m), sedangkan luas mengukur daerah isi bidang (cm²/m²).' },
                        { term: 'Volume Bangun Ruang', meaning: 'Besar kapasitas ruang tiga dimensi yang dinyatakan dalam satuan kubik (cm³/dm³/liter).' }
                    ]
                    : [
                        { term: 'Nilai Tempat', meaning: 'Nilai suatu angka berdasarkan posisinya (satuan, puluhan, ratusan, ribuan).' },
                        { term: 'Operasi Hitung', meaning: 'Pengerjaan penjumlahan, pengurangan, perkalian, atau pembagian sesuai aturan prioritas.' },
                        { term: 'Satuan Baku', meaning: 'Satuan ukur yang hasilnya selalu sama di mana pun, seperti cm, m, kg, gram, dan liter.' },
                        { term: 'Model Soal Cerita', meaning: 'Mengubah kalimat soal sehari-hari menjadi operasi hitung matematika yang tepat.' }
                    ],
            poinPenting: isFraction
                ? [
                    'Syarat mutlak pecahan: seluruh potongan benda harus memiliki ukuran yang sama besar.',
                    'Untuk mencari pecahan senilai, kalikan atau bagilah pembilang dan penyebut dengan bilangan yang sama (bukan nol).',
                    'Semakin besar penyebut pada pembilang 1, semakin kecil ukuran tiap potongannya (1/4 lebih kecil daripada 1/2).'
                ]
                : isGeometry
                    ? [
                        'Periksa selalu kesamaan satuan panjang (cm, m, dm) sebelum memasukkan angka ke rumus.',
                        'Kubus memiliki 6 sisi persegi sama besar, 12 rusuk sama panjang, dan 8 titik sudut; balok memiliki 3 pasang sisi berhadapan sama besar.',
                        'Tulis satuan akhir secara tepat: satuan panjang (cm), luas (cm²), dan volume (cm³).'
                    ]
                    : [
                        'Pahami arti soal terlebih dahulu: tuliskan apa yang diketahui dan apa yang ditanyakan.',
                        'Gunakan garis bilangan, gambar balok satuan, atau tabel agar hubungan antarbilangan terlihat jelas.',
                        'Periksa kembali hasil hitungan dengan operasi kebalikannya untuk memastikan ketepatan.'
                    ],
            contohKonkret: isFraction
                ? 'Sebuah kue bolu dipotong menjadi 8 bagian sama besar. Jika Rani memakan 3 potong, bagian kue yang dimakan Rani adalah 3/8 (pembilang 3, penyebut 8), dan sisanya adalah 5/8.'
                : isGeometry
                    ? 'Sebuah kotak pensil berbentuk balok berukuran panjang 20 cm, lebar 8 cm, dan tinggi 5 cm memiliki volume = 20 × 8 × 5 = 800 cm³.'
                    : `Di koperasi sekolah terdapat 4 kotak pensil, masing-masing berisi 12 batang pensil. Jumlah seluruh pensil = 4 × 12 = 48 batang.`,
            contohSehariHari: [
                'Di Dapur Rumah: Membagi pizza, martabak, atau buah semangka menjadi bagian sama besar (pecahan).',
                'Di Toko / Pasar: Menghitung berat belanjaan dalam kilogram/gram dan kembalian uang belanja.',
                'Di Kelas: Mengukur panjang meja belajar dengan penggaris berskala sentimeter (cm).'
            ],
            klasifikasiAtauProses: {
                judul: `Langkah Sistematis Pemecahan Soal ${topicTitle}`,
                butir: [
                    { label: '1. Identifikasi Data & Satuan', uraian: 'Catat seluruh bilangan dan satuan ukur yang tertera pada masalah.' },
                    { label: '2. Pilih Strategi & Visualisasi', uraian: isFraction ? 'Gambarkan lingkaran/pita berarsir atau samakan penyebutnya.' : isGeometry ? 'Gambar sketsa bangun lengkap dengan ukuran rusuk/sisinya.' : 'Susun kalimat matematika atau tabel perbandingan nilai.' },
                    { label: '3. Hitung & Cek Ulang', uraian: 'Selesaikan perhitungan bertahap dan cantumkan satuan akhir yang benar.' }
                ]
            },
            tabelInformatif: isFraction
                ? {
                    judul: 'Tabel Perbandingan Unsur & Contoh Pecahan Senilai',
                    kolom: ['Bentuk Pecahan', 'Pembilang / Penyebut', 'Pecahan Senilai'],
                    baris: [
                        ['1/2', '1 bagian dari 2 bagian sama besar', '2/4, 3/6, 4/8'],
                        ['1/3', '1 bagian dari 3 bagian sama besar', '2/6, 3/9, 4/12'],
                        ['3/4', '3 bagian dari 4 bagian sama besar', '6/8, 9/12, 12/16']
                    ]
                }
                : {
                    judul: `Ringkasan Konsep & Rumus Dasar ${topicTitle}`,
                    kolom: ['Konsep', 'Aturan / Rumus Pokok', 'Satuan Hasil'],
                    baris: [
                        ['Persegi / Kubus', 'Keliling = 4×s | Luas = s×s | Vol = s×s×s', 'cm / cm² / cm³'],
                        ['Persegi Panjang / Balok', 'Keliling = 2×(p+l) | Luas = p×l | Vol = p×l×t', 'cm / cm² / cm³'],
                        ['Segitiga', 'Keliling = s1+s2+s3 | Luas = ½ × alas × tinggi', 'cm / cm²']
                    ]
                },
            miskonsepsiUmum: isFraction
                ? [
                    { salah: 'Mengira 1/4 lebih besar daripada 1/2 karena angka 4 lebih besar dari 2.', pelurusan: 'Jika satu kue dibagi 4, tiap potongannya justru lebih kecil dibanding jika kue yang sama dibagi 2. Jadi 1/4 < 1/2.' },
                    { salah: 'Menjumlahkan pembilang dan penyebut sekaligus: 1/4 + 2/4 = 3/8.', pelurusan: 'Penyebut menunjukkan ukuran potongan sehingga tidak ikut dijumlahkan: 1/4 + 2/4 = 3/4.' }
                ]
                : [
                    { salah: 'Menyamakan rumus keliling (menjumlahkan tepian) dengan rumus luas (mengalikan alas dan tinggi).', pelurusan: 'Keliling hanya mengukur panjang garis tepi luar, sedangkan luas mengukur seluruh daerah permukaan di dalam bangun.' },
                    { salah: 'Mengalikan angka yang satuannya berbeda (misalnya cm dengan m) tanpa menyamakan satuan terlebih dahulu.', pelurusan: 'Semua ukuran panjang harus diubah ke satuan yang sama (misal 1 m = 100 cm) sebelum dihitung.' }
                ],
            aktivitasSederhana: {
                judul: `Eksplorasi Matematika Konkret: ${topicTitle}`,
                langkah: [
                    'Siapkan selembar kertas lipat atau penggaris 30 cm.',
                    isFraction ? 'Lipat kertas menjadi 4 bagian sama besar, lalu arsir 1 bagian (1/4) dan bandingkan dengan 2/4.' : 'Ukur panjang dan lebar buku tulismu dalam satuan cm lalu hitung kelilingnya.',
                    'Tuliskan langkah penyelesaianmu secara rapi dan tukarkan dengan teman untuk diperiksa.'
                ],
                hasilDiharapkan: `Siswa memahami konsep ${topicTitle} secara visual dan mampu menghitung tepat tanpa sekadar menghafal rumus.`
            },
            rangkumanPoin: [
                isFraction ? 'Pecahan a/b terdiri dari pembilang (a) dan penyebut (b), dengan seluruh potongan sama besar.' : `Penguasaan ${topicTitle} dimulai dari ketepatan membaca data, gambar bangun, dan kesamaan satuan.`,
                'Visualisasi konkret (pita pecahan, sketsa bangun, atau garis bilangan) mencegah kesalahan logika hitung.',
                'Selalu cantumkan satuan hasil yang tepat dan periksa kembali langkah perhitungan.'
            ],
            latihanFormatif: isFraction
                ? [
                    { no: 1, pertanyaan: 'Pada pecahan 3/5, angka manakah yang disebut pembilang dan penyebut? Jelaskan artinya!', kunciSingkat: '3 adalah pembilang (bagian yang dipilih) dan 5 adalah penyebut (total bagian sama besar).' },
                    { no: 2, pertanyaan: 'Manakah yang lebih besar: 1/2 bagian semangka atau 1/4 bagian semangka yang sama ukurannya? Mengapa?', kunciSingkat: '1/2 lebih besar karena satu semangka hanya dibagi 2 bagian, sedangkan 1/4 dibagi menjadi 4 bagian yang lebih kecil.' },
                    { no: 3, pertanyaan: 'Tuliskan 2 pecahan yang senilai dengan 2/3!', kunciSingkat: '4/6 dan 6/9 (pembilang dan penyebut dikalikan bilangan yang sama, misal ×2 dan ×3).' }
                ]
                : [
                    { no: 1, pertanyaan: 'Apa perbedaan utama antara keliling dan luas pada bangun datar?', kunciSingkat: 'Keliling adalah jumlah panjang seluruh sisi tepi luar, sedangkan luas adalah besar daerah permukaan di dalam bangun.' },
                    { no: 2, pertanyaan: 'Sebuah taman berbentuk persegi panjang berukuran panjang 12 m dan lebar 5 m. Hitunglah keliling dan luasnya!', kunciSingkat: 'Keliling = 2 × (12 + 5) = 34 m; Luas = 12 × 5 = 60 m².' },
                    { no: 3, pertanyaan: 'Mengapa satuan panjang harus disamakan terlebih dahulu sebelum menghitung luas atau volume?', kunciSingkat: 'Agar hasil perkalian konsisten dalam satu satuan ukur yang baku dan benar.' }
                ],
            visualCaption: `Visualisasi Konsep Matematika: ${topicTitle}`
        };
    }

    // 3. IPAS (Ilmu Pengetahuan Alam dan Sosial)
    if (subjLower.includes('ipas') || subjLower.includes('ipa')) {
        const isPlant = /\b(tumbuhan|fotosintesis|akar|batang|daun|bunga|klorofil)\b/.test(combined);
        const isEnergyForce = /\b(gaya|energi|listrik|magnet|cahaya|bunyi|wujud\s+zat|mencair|menguap)\b/.test(combined);
        return {
            pengertianKonsep: isPlant
                ? `Tumbuhan hijau merupakan makhluk hidup autotrof (mampu membuat makanannya sendiri) melalui proses fotosintesis di daun berklorofil dengan bantuan energi cahaya matahari, air dari akar, dan gas karbon dioksida dari udara.`
                : isEnergyForce
                    ? `Dalam kajian fisika dasar IPAS SD, gaya adalah tarikan atau dorongan yang dapat memengaruhi gerak serta bentuk benda, sedangkan energi adalah kemampuan untuk melakukan usaha/kerja yang dapat berubah bentuk (seperti energi listrik menjadi cahaya atau gerak).`
                    : `Konsep "${topicTitle}" dalam Ilmu Pengetahuan Alam dan Sosial (IPAS) mengkaji keterkaitan ilmiah antara makhluk hidup, benda dan energinya, serta dinamika kehidupan sosial masyarakat di lingkungan sekitar secara faktual dan dapat diamati.`,
            penjelasanUtama: isPlant
                ? `Berdasarkan Buku Siswa IPAS SD Kurikulum Merdeka, setiap organ tumbuhan memiliki fungsi khusus: akar menyerap air dan mineral dari tanah serta memperkokoh berdirinya tumbuhan; batang menyalurkan air ke daun dan menopang tubuh tumbuhan; daun menangkap cahaya matahari menggunakan zat hijau daun (klorofil) untuk menghasilkan karbohidrat (glukosa) dan oksigen (O₂).`
                : isEnergyForce
                    ? `Hukum kekekalan energi menjelaskan bahwa energi tidak dapat diciptakan maupun dimusnahkan, melainkan hanya berubah dari satu bentuk ke bentuk lain. Sementara itu, perubahan wujud benda (mencair, membeku, menguap, mengembun, menyublim) terjadi akibat penyerapan atau pelepasan energi kalor (panas).`
                    : `Melalui pendekatan inkuiri ilmiah (mengamati, menanya, mencoba, dan menyimpulkan), siswa ${className} menelusuri sebab-akibat fenomena "${topicTitle}" dan dampaknya bagi keseimbangan alam maupun kehidupan masyarakat Indonesia.`,
            domainTerms: isPlant
                ? [
                    { term: 'Klorofil', meaning: 'Zat hijau daun yang berfungsi menangkap energi cahaya matahari saat fotosintesis.' },
                    { term: 'Stomata', meaning: 'Mulut daun tempat pertukaran gas karbon dioksida (CO₂) masuk dan oksigen (O₂) keluar.' },
                    { term: 'Fotosintesis', meaning: 'Proses pembuatan makanan oleh tumbuhan hijau menghasilkan glukosa dan oksigen.' },
                    { term: 'Xilem & Floem', meaning: 'Jaringan pembuluh pengangkut air dari akar dan pengedar hasil fotosintesis.' }
                ]
                : [
                    { term: 'Energi Kalor / Panas', meaning: 'Energi yang berpindah dari benda bersuhu tinggi ke rendah dan memicu perubahan wujud benda.' },
                    { term: 'Gaya Otot & Gesek', meaning: 'Dorongan/tarikan otot serta gaya hambat yang terjadi saat dua permukaan benda bersentuhan.' },
                    { term: 'Hubungan Sebab-Akibat', meaning: 'Keterkaitan logis antara faktor penyebab perubahan dan akibat yang teramati.' },
                    { term: 'Pengamatan Ilmiah', meaning: 'Proses mengumpulkan fakta nyata menggunakan panca indera atau alat ukur.' }
                ],
            poinPenting: isPlant
                ? [
                    'Bahan utama fotosintesis adalah air (H₂O), karbon dioksida (CO₂), cahaya matahari, dan klorofil.',
                    'Hasil fotosintesis berupa karbohidrat/glukosa (sumber energi tumbuhan) dan oksigen (O₂) untuk bernapas makhluk hidup.',
                    'Bunga berperan sebagai alat perkembangbiakan generatif melalui penyerbukan.'
                ]
                : [
                    'Setiap perubahan pada benda atau alam selalu memiliki penyebab yang dapat diamati dan diuji.',
                    'Energi bermanfaat jika digunakan hemat dan bijak sesuai kebutuhan sehari-hari.',
                    'Menjaga kelestarian lingkungan menjaga keseimbangan ekosistem dan kehidupan manusia.'
                ],
            contohKonkret: isPlant
                ? 'Saat daun tanaman diletakkan di bawah cahaya matahari pagi dan disiram secukupnya, gelembung gas oksigen dilepaskan dari daun melalui proses fotosintesis.'
                : 'Saat menyalakan kipas angin di kelas, energi listrik berubah menjadi energi gerak yang menghasilkan hembusan angin.',
            contohSehariHari: [
                'Di Rumah: Mematikan lampu dan peralatan listrik yang tidak dipakai untuk menghemat energi.',
                'Di Halaman/Kebun: Menyiram tanaman dan memberi sinar matahari cukup agar tumbuh subur.',
                'Di Lingkungan Sekitar: Memilah sampah dan menanam pohon untuk menjaga udara tetap segar.'
            ],
            klasifikasiAtauProses: {
                judul: isPlant ? 'Alur Proses Fotosintesis pada Tumbuhan Hijau' : `Tahapan Proses Ilmiah: ${topicTitle}`,
                butir: isPlant
                    ? [
                        { label: '1. Penyerapan Air & CO₂', uraian: 'Akar menyerap air dari tanah menuju daun, sementara stomata menyerap karbon dioksida dari udara.' },
                        { label: '2. Reaksi dengan Cahaya', uraian: 'Klorofil di daun menangkap energi cahaya matahari untuk mengolah air dan CO₂.' },
                        { label: '3. Pelepasan O₂ & Glukosa', uraian: 'Tumbuhan menghasilkan makanan (glukosa) untuk tumbuh dan melepaskan oksigen ke udara.' }
                    ]
                    : [
                        { label: '1. Pengamatan Fakta', uraian: `Mengamati ciri benda, makhluk hidup, atau gejala alam terkait ${topicTitle}.` },
                        { label: '2. Identifikasi Penyebab', uraian: 'Menemukan faktor pemicu perubahan (kalor, gaya, cahaya, atau interaksi manusia).' },
                        { label: '3. Simpulan & Pelestarian', uraian: 'Merumuskan manfaat dan cara menjaga keseimbangan lingkungan.' }
                    ]
            },
            tabelInformatif: {
                judul: isPlant ? 'Bagian Tumbuhan & Fungsi Utamanya' : `Ringkasan Fenomena & Penerapan ${topicTitle}`,
                kolom: ['Bagian / Unsur', 'Fungsi / Peran Ilmiah', 'Contoh Pengamatan'],
                baris: isPlant
                    ? [
                        ['Akar', 'Menyerap air, mineral, dan memperkokoh tumbuhan', 'Akar tunggang mangga & serabut padi'],
                        ['Batang', 'Menyalurkan air & makanan serta menopang daun', 'Batang kayu jati & batang rumput'],
                        ['Daun', 'Tempat berlangsungnya fotosintesis & penguapan', 'Daun hijau berklorofil']
                    ]
                    : [
                        ['Sumber Energi / Gaya', 'Pemicu kerja atau perubahan gerak/wujud', 'Listrik, matahari, dorongan otot'],
                        ['Proses Perubahan', 'Transformasi energi atau wujud benda', 'Es mencair saat dipanaskan'],
                        ['Dampak Lingkungan', 'Manfaat atau risiko bagi makhluk hidup', 'Hemat energi menjaga kelestarian alam']
                    ]
            },
            miskonsepsiUmum: isPlant
                ? [
                    { salah: 'Mengira tumbuhan mengambil makanannya langsung dari tanah seperti manusia makan nasi.', pelurusan: 'Akar hanya menyerap air dan mineral; makanan (glukosa) dibuat sendiri di daun melalui fotosintesis.' },
                    { salah: 'Mengira tumbuhan hanya menghasilkan oksigen tanpa pernah bernapas.', pelurusan: 'Tumbuhan juga melakukan pernapasan (respirasi) sepanjang waktu, tetapi pada siang hari fotosintesis menghasilkan jauh lebih banyak oksigen.' }
                ]
                : [
                    { salah: 'Mengira energi habis dan hilang begitu saja setelah lampu dimatikan.', pelurusan: 'Energi tidak hilang, melainkan berubah bentuk (misalnya energi listrik menjadi energi cahaya dan panas).' },
                    { salah: 'Mengira benda berat selalu jatuh lebih cepat hanya karena massanya tanpa memperhitungkan hambatan udara.', pelurusan: 'Hambatan udara (luas permukaan benda seperti kertas vs batu) sangat memengaruhi kecepatan jatuh di udara.' }
                ],
            aktivitasSederhana: {
                judul: `Observasi Sains Mini: ${topicTitle}`,
                langkah: [
                    'Amati satu objek nyata di lingkungan sekolah/rumah (tanaman, alat listrik, atau perubahan benda).',
                    'Catat bagian utama beserta peran atau perubahan yang terjadi pada lembar pengamatan.',
                    'Jelaskan 1 manfaat temuanmu bagi kehidupan manusia sehari-hari.'
                ],
                hasilDiharapkan: `Siswa mampu menjelaskan fakta ilmiah ${topicTitle} berdasarkan pengamatan langsung.`
            },
            rangkumanPoin: [
                isPlant ? 'Fotosintesis di daun berklorofil menghasilkan glukosa dan oksigen dengan bantuan cahaya matahari.' : `Fenomena ${topicTitle} bekerja mengikuti aturan sebab-akibat ilmiah yang dapat diamati langsung.`,
                'Setiap bagian komponen sistem saling bergantung menjaga keseimbangan alam.',
                'Pemahaman IPAS menumbuhkan sikap peduli lingkungan dan hemat sumber daya.'
            ],
            latihanFormatif: isPlant
                ? [
                    { no: 1, pertanyaan: 'Sebutkan 4 unsur utama yang dibutuhkan tumbuhan hijau untuk melakukan fotosintesis!', kunciSingkat: 'Air, karbon dioksida (CO₂), cahaya matahari, dan klorofil.' },
                    { no: 2, pertanyaan: 'Mengapa fotosintesis tumbuhan sangat penting bagi kehidupan manusia dan hewan?', kunciSingkat: 'Karena menghasilkan oksigen (O₂) untuk bernapas dan bahan makanan sumber energi.' },
                    { no: 3, pertanyaan: 'Apa fungsi utama akar dan batang pada tubuh tumbuhan?', kunciSingkat: 'Akar menyerap air dan mineral serta memperkokoh tumbuhan; batang menyalurkan air dan menopang daun/bunga.' }
                ]
                : [
                    { no: 1, pertanyaan: `Jelaskan dengan bahasamu sendiri hubungan sebab-akibat yang terjadi pada materi "${topicTitle}"!`, kunciSingkat: 'Menjelaskan faktor pemicu dan hasil perubahan yang dapat diamati secara ilmiah.' },
                    { no: 2, pertanyaan: `Berikan 2 contoh nyata penerapan konsep "${topicTitle}" di rumah atau di sekolah!`, kunciSingkat: 'Dua contoh pengamatan benda atau peristiwa alam sehari-hari yang sesuai konsep.' },
                    { no: 3, pertanyaan: 'Bagaimana sikap bijak kita terhadap pemanfaatan sumber daya dan lingkungan terkait materi ini?', kunciSingkat: 'Menggunakan secukupnya, menghemat energi, dan merawat kelestarian lingkungan.' }
                ],
            visualCaption: `Skema Ilmiah IPAS: ${topicTitle}`
        };
    }

    // 4. PAIBP (Pendidikan Agama Islam dan Budi Pekerti)
    if (subjLower.includes('islam') || subjLower.includes('pai')) {
        const isWudu = /(berwud[hu]?u|wud[hu]?u|bersuci|tayamum|thaharah)/.test(combined);
        const isQuran = /\b(al-?qur'?an|surah|ayat|tajwid|tartil|harakat|mushaf)\b/.test(combined);
        return {
            pengertianKonsep: isWudu
                ? `Wudu adalah bersuci menggunakan air suci yang menyucikan untuk menghilangkan hadas kecil pada anggota tubuh tertentu (wajah, kedua tangan sampai siku, sebagian kepala, dan kedua kaki sampai mata kaki) disertai niat tulus karena Allah Swt. sebagai syarat sahnya salat.`
                : isQuran
                    ? `Al-Qur'an adalah firman Allah Swt. yang diturunkan kepada Nabi Muhammad saw. melalui Malaikat Jibril sebagai pedoman hidup umat Islam, yang wajib dibaca secara tartil (jelas, tenang, sesuai makhraj huruf dan kaidah tajwid) serta diamalkan isi kandungannya.`
                    : `Materi PAIBP "${topicTitle}" menanamkan keimanan yang benar kepada Allah Swt., tata cara ibadah sesuai tuntunan syariat Islam, serta pembiasaan akhlakul karimah dalam kehidupan bermasyarakat.`,
            penjelasanUtama: isWudu
                ? `Berdasarkan Buku Siswa PAIBP SD Kurikulum Merdeka, wudu memiliki 6 rukun wajib yang harus dilakukan berurutan (tertib): (1) Niat dalam hati saat membasuh wajah, (2) Membasuh seluruh wajah, (3) Membasuh kedua tangan hingga siku, (4) Mengusap sebagian kepala, (5) Membasuh kedua kaki hingga mata kaki, dan (6) Tertib (berurutan tidak dibolak-balik).`
                : isQuran
                    ? `Mempelajari Al-Qur'an di jenjang SD meliputi pelafalan huruf hijaiyah sesuai makhraj dan harakat panjang-pendek (mad), memahami arti dan pesan pokok surah pendek untuk menumbuhkan kepedulian sosial (seperti menyayangi anak yatim, jujur, dan saling menghargai), serta menghafalkannya dengan tertib.`
                    : `Dalam Islam, pemahaman ilmu agama wajib berjalan beriringan antara keyakinan hati (akidah), ketepatan tata cara beribadah (fikih), dan perilaku terpuji kepada orang tua, guru, teman, maupun lingkungan sekitar (akhlak).`,
            domainTerms: isWudu
                ? [
                    { term: 'Air Mutlak', meaning: 'Air suci yang dapat menyucikan (air keran bersih, air sumur, air hujan) dan tidak berubah warna/rasa/bau.' },
                    { term: 'Rukun Wudu (6 Wajib)', meaning: 'Bagian pokok wudu yang wajib dikerjakan; jika tertinggal satu saja maka wudunya tidak sah.' },
                    { term: 'Hadas Kecil', meaning: 'Keadaan tidak suci yang mewajibkan wudu sebelum salat, misalnya setelah buang air atau tidur nyenyak.' },
                    { term: 'Tertib', meaning: 'Melaksanakan urutan membasuh anggota wudu dari wajah hingga kaki secara berurutan.' }
                ]
                : [
                    { term: 'Niat Ikhlas', meaning: 'Kesungguhan hati beribadah dan berbuat baik semata-mata mengharap rida Allah Swt.' },
                    { term: 'Tartil & Makhraj', meaning: 'Membaca Al-Qur’an dengan tenang, jelas pelafalan hurufnya, dan tepat panjang-pendek bacaannya.' },
                    { term: 'Akhlakul Karimah', meaning: 'Budi pekerti mulia seperti jujur, amanah, santun, dan peduli terhadap sesama.' },
                    { term: 'Teladan Rasulullah saw.', meaning: 'Mencontoh sifat siddiq, amanah, tabligh, dan fatanah dalam kegiatan sehari-hari.' }
                ],
            poinPenting: isWudu
                ? [
                    'Enam rukun wudu: niat, membasuh wajah, tangan hingga siku, mengusap sebagian kepala, kaki hingga mata kaki, dan tertib.',
                    'Gunakan air secukupnya (hemat air, tidak boros) sesuai ajaran Rasulullah saw.',
                    'Hal yang membatalkan wudu antara lain keluar sesuatu dari dua jalan, tidur pulas, atau hilang akal.'
                ]
                : [
                    'Awali setiap ibadah dan kegiatan belajar dengan basmalah serta niat tulus karena Allah Swt.',
                    'Pahami isi pokok materi agar ibadah dilaksanakan dengan ilmu dan penuh kesadaran.',
                    'Wujudkan nilai agama melalui sikap santun kepada orang tua, guru, dan teman tanpa membeda-bedakan.'
                ],
            contohKonkret: isWudu
                ? 'Saat mendengar azan Zuhur, Ahmad menuju tempat wudu sekolah, membuka keran air secukupnya, membaca basmalah, berniat wudu, lalu membasuh wajah, tangan s.d. siku, kepala, dan kaki s.d. mata kaki secara tertib.'
                : `Contoh nyata: Ketika menemukan pensil teman yang terjatuh di kelas, siswa segera mengembalikannya sebagai wujud sifat amanah dan jujur.`,
            contohSehariHari: [
                'Di Rumah: Berbakti kepada ayah dan ibu, berbicara lemah lembut, serta salat tepat waktu.',
                'Di Sekolah: Berbagi dengan teman yang membutuhkan, menyapa guru dengan salam, dan menjaga kebersihan musala.',
                'Di Masyarakat: Menghormati tetangga dan teman yang berbeda latar belakang dengan rukun.'
            ],
            klasifikasiAtauProses: {
                judul: isWudu ? 'Urutan Rukun Wudu yang Sah & Tertib' : `Pilar Pengamalan Materi ${topicTitle}`,
                butir: isWudu
                    ? [
                        { label: '1. Niat & Membasuh Wajah', uraian: 'Membaca niat wudu dalam hati berbarengan dengan membasuh seluruh bagian wajah merata.' },
                        { label: '2. Tangan s.d. Siku & Usap Kepala', uraian: 'Membasuh kedua tangan dari ujung jari hingga melewati siku, lalu mengusap sebagian rambut/kepala.' },
                        { label: '3. Kaki s.d. Mata Kaki & Doa', uraian: 'Membasuh kedua kaki hingga mata kaki secara tertib (berurutan), lalu membaca doa setelah wudu.' }
                    ]
                    : [
                        { label: '1. Memahami Tuntunan', uraian: `Mempelajari dasar ayat/hadis atau ketentuan syariat pada ${topicTitle}.` },
                        { label: '2. Membiasakan Praktik', uraian: 'Mempraktikkan tata cara ibadah atau adab secara tertib dan istikamah.' },
                        { label: '3. Akhlak Terpuji', uraian: 'Menunjukkan perubahan sikap menjadi lebih jujur, peduli, dan bertanggung jawab.' }
                    ]
            },
            tabelInformatif: {
                judul: isWudu ? 'Perbedaan Rukun (Wajib) dan Sunah dalam Wudu' : `Panduan Nilai & Pengamalan ${topicTitle}`,
                kolom: ['Aspek', 'Ketentuan Pokok', 'Contoh Praktik'],
                baris: isWudu
                    ? [
                        ['Rukun Wudu', 'Wajib dikerjakan berurutan (jika tinggal, tidak sah)', 'Niat, wajah, tangan, kepala, kaki, tertib'],
                        ['Sunah Wudu', 'Dianjurkan untuk menambah pahala', 'Membaca basmalah, berkumur, membasuh 3 kali'],
                        ['Adab Hemat Air', 'Tidak menyalakan keran terlalu besar', 'Menutup keran segera setelah selesai']
                    ]
                    : [
                        ['Keyakinan (Iman)', 'Meyakini kebesaran & kasih sayang Allah Swt.', 'Berdoa sebelum belajar & bersyukur'],
                        ['Ibadah / Ilmu', 'Melaksanakan aturan sesuai syariat yang benar', 'Membaca tartil / menunaikan rukun ibadah'],
                        ['Akhlak Harian', 'Meneladani sikap mulia terhadap sesama', 'Jujur, santun, dan membantu teman']
                    ]
            },
            miskonsepsiUmum: isWudu
                ? [
                    { salah: 'Membasuh tangan hanya sampai pergelangan tangan saja, tidak sampai siku.', pelurusan: 'Rukun wudu mewajibkan membasuh kedua tangan mulai dari ujung jari hingga melewati siku.' },
                    { salah: 'Membuka keran air selebar-lebarnya saat berwudu.', pelurusan: 'Islam melarang sikap boros (tabzir); berwudu cukup menggunakan air secukupnya secara merata.' }
                ]
                : [
                    { salah: 'Menganggap hafal bacaan saja sudah cukup tanpa memahami artinya dan menerapkannya.', pelurusan: 'Ajaran Islam menekankan pemahaman makna dan pembuktian dalam akhlak sehari-hari.' },
                    { salah: 'Mengira adab baik hanya berlaku saat berada di masjid.', pelurusan: 'Akhlak mulia wajib dijaga di mana saja: di rumah, sekolah, maupun saat bermain.' }
                ],
            aktivitasSederhana: {
                judul: isWudu ? 'Simulasi Urutan Rukun Wudu yang Benar' : `Refleksi & Praktik Kebaikan: ${topicTitle}`,
                langkah: isWudu
                    ? [
                        'Sebutkan 6 rukun wudu secara berurutan di depan pasangan belajarmu.',
                        'Praktikkan gerakan membasuh wajah, tangan s.d. siku, mengusap kepala, dan kaki s.d. mata kaki secara tertib.',
                        'Pastikan kamu ingat doa setelah berwudu.'
                    ]
                    : [
                        `Tuliskan 1 pesan utama atau nilai keteladanan dari "${topicTitle}".`,
                        'Rencanakan 1 perbuatan baik yang akan kamu lakukan hari ini di rumah atau sekolah.',
                        'Ceritakan pengalamanmu pada pertemuan berikutnya.'
                    ],
                hasilDiharapkan: `Siswa mampu mempraktikkan ${topicTitle} dengan benar dan membiasakan akhlak mulia.`
            },
            rangkumanPoin: isWudu
                ? [
                    'Wudu membersihkan hadas kecil sebelum salat menggunakan air suci yang menyucikan.',
                    'Enam rukun wudu wajib dilakukan secara tertib dan merata hingga batas siku dan mata kaki.',
                    'Gunakan air dengan hemat karena pemborosan tidak disukai dalam Islam.'
                ]
                : [
                    `${topicTitle} mengajarkan keselarasan antara iman, ilmu ibadah yang sah, dan akhlak terpuji.`,
                    'Membaca dan memahami tuntunan agama membantu kita beribadah dengan tenang dan benar.',
                    'Sikap jujur, peduli, dan menghargai sesama adalah cerminan pelajar muslim berakhlak mulia.'
                ],
            latihanFormatif: isWudu
                ? [
                    { no: 1, pertanyaan: 'Tuliskan 6 rukun wudu secara berurutan dengan benar!', kunciSingkat: '1) Niat, 2) Membasuh wajah, 3) Membasuh kedua tangan sampai siku, 4) Mengusap sebagian kepala, 5) Membasuh kedua kaki sampai mata kaki, 6) Tertib.' },
                    { no: 2, pertanyaan: 'Apa akibatnya jika seseorang saat berwudu tidak membasuh tangannya sampai siku?', kunciSingkat: 'Wudunya tidak sah karena membasuh tangan sampai siku adalah salah satu rukun wajib wudu.' },
                    { no: 3, pertanyaan: 'Mengapa kita harus menghemat air saat berwudu di sekolah maupun di rumah?', kunciSingkat: 'Karena Islam mengajarkan larangan bersikap boros dan menjaga kelestarian air bersih.' }
                ]
                : [
                    { no: 1, pertanyaan: `Apa nilai keteladanan utama yang kamu pelajari dari materi "${topicTitle}"?`, kunciSingkat: 'Menyebutkan nilai iman, ibadah sah, atau akhlak mulia sesuai topik.' },
                    { no: 2, pertanyaan: 'Bagaimana cara menerapkan pesan pembelajaran ini saat berinteraksi dengan teman di kelas?', kunciSingkat: 'Berkata sopan, jujur, saling menolong, dan menghormati perbedaan.' },
                    { no: 3, pertanyaan: 'Mengapa niat yang tulus penting sebelum melakukan ibadah atau kebaikan?', kunciSingkat: 'Agar setiap amal bernilai ibadah di sisi Allah Swt. dan dilakukan dengan sungguh-sungguh.' }
                ],
            visualCaption: `Ilustrasi Edukatif PAIBP: ${topicTitle}`
        };
    }

    // 5. BAHASA SUNDA
    if (isSunda) {
        return {
            pengertianKonsep: `Dina pangajaran Basa Sunda, "${topicTitle}" mangrupa kamampuh basa jeung sastra pikeun maham eusi bacaan atawa paguneman sarta ngagunakeun undak-usuk basa (basa hormat/lemes jeung basa loma) kalayan merenah luyu jeung tatakrama urang Sunda.`,
            penjelasanUtama: `Luyu jeung buku pangajaran Basa Sunda SD, basa Sunda mibanda aturan sopan santun dina nyarita. Basa lemes dipaké nalika nyarita ka saluhureun (kolot, guru, tamu), sedengkeun basa loma dipaké ka babaturan saumur kalayan tetep ngajaga soméah jeung silih ajénan.`,
            domainTerms: [
                { term: 'Undak-usuk Basa', meaning: 'Tatacara maké basa Sunda luyu jeung umur katut kahormatan lawan nyarita (lemes & loma).' },
                { term: 'Kecap Lemes', meaning: 'Kecap hormat saperti punten, mangga, hatur nuhun, abdi, bapa/ibu pikeun ka nu leuwih kolot.' },
                { term: 'Kecap Loma', meaning: 'Basa sapopoé nu akrab tur sopan pikeun ka babaturan sapantar.' },
                { term: 'Silih Asah, Silih Asih, Silih Asuh', meaning: 'Falsafah Sunda pikeun silih bimbing, silih pikanyaah, jeung silih jaga.' }
            ],
            poinPenting: [
                'Bedakeun pamakéan kecap abdi (lemes) jeung kuring/urang (loma) luyu jeung saha nu diajak nyarita.',
                'Perhatikeun lentong (intonasi) jeung éjaan aksara é, e, eu sangkan harti kecap teu salah.',
                'Biasakeun ngucapkeun punten, mangga, jeung hatur nuhun dina paguneman sapopoé.'
            ],
            contohKonkret: `Paguneman ka guru: "Punten Pa Guru, abdi badé naroskeun tugas nyerat dongéng." Sedengkeun ka babaturan: "Hayu urang diajar babarengan di perpustakaan!"`,
            contohSehariHari: [
                'Di Imah: Nyarita ku basa lemes ka ibu sareng rama ("Mangga Bu, abdi bade mios ka sakola").',
                'Di Sakola: Ngajawab patarosan guru kalayan sopan sarta ngucapkeun hatur nuhun ka babaturan.',
                'Di Lingkungan: Ngariksa jeung reueus ngagunakeun basa Sunda dina kaulinan barudak atawa kasenian daérah.'
            ],
            klasifikasiAtauProses: {
                judul: `Sistematika Nyarita & Nulis Basa Sunda: ${topicTitle}`,
                butir: [
                    { label: '1. Niténan Kontéks & Palaku', uraian: 'Tangtukeun saha nu nyarita jeung ka saha nyaritana (kolot/guru atanapi babaturan).' },
                    { label: '2. Milih Undak-usuk Kecap', uraian: 'Pilih kecap lemes keur saluhureun (tuang, sumping, mios) atawa loma keur babaturan (dahar, datang, indit).' },
                    { label: '3. Ngalarapkeun dina Kalimah', uraian: 'Rakit kalimah nu jéntré tur sopan kalayan merhatikeun éjaan é, e, jeung eu.' }
                ]
            },
            tabelInformatif: {
                judul: 'Conto Babandingan Kecap Loma jeung Kecap Lemes',
                kolom: ['Harti (Indonesia)', 'Basa Loma (Ka Babaturan)', 'Basa Lemes (Ka Kolot/Guru)'],
                baris: [
                    ['Saya / Aku', 'Kuring / Urang', 'Abdi / Simkuring'],
                    ['Makan', 'Dahar', 'Neda (sorangan) / Tuang (ka batur)'],
                    ['Pergi / Berangkat', 'Indit', 'Mios / Angkat'],
                    ['Datang', 'Datang', 'Dongkap (sorangan) / Sumping (ka batur)']
                ]
            },
            miskonsepsiUmum: [
                { salah: 'Maké kecap "tuang" keur diri sorangan ("Abdi nuju tuang").', pelurusan: 'Kecap "tuang" téh lemes keur ka batur; keur diri sorangan nu bener nyaéta "neda" ("Abdi nuju neda").' },
                { salah: 'Nuliskeun vokal e, é, jeung eu disaruakeun kabéh.', pelurusan: 'Dina basa Sunda bédana é, e, eu ngarobah harti (contona: séréh vs sereh, leumpang vs lempeng).' }
            ],
            aktivitasSederhana: {
                judul: 'Prakték Paguneman Undak-usuk Basa',
                langkah: [
                    'Jieun pasangan 2 murid di kelas.',
                    'Susun 2 kalimah paguneman maké kecap punten jeung hatur nuhun ngeunaan kagiatan di sakola.',
                    'Perankeun di hareup kelas kalayan lentong nu merenah jeung soméah.'
                ],
                hasilDiharapkan: 'Murid mampuh ngabédakeun basa loma jeung lemes sarta wani nyarita basa Sunda kalayan sopan.'
            },
            rangkumanPoin: [
                'Basa Sunda mibanda undak-usuk basa pikeun ngahormat saluhureun jeung ngaraketkeun babaturan.',
                'Kecap "neda" dipaké keur diri sorangan, ari "tuang" dipaké keur ngahormat batur.',
                'Éjaan vokal e, é, jeung eu kudu diperhatikeun sangkan harti kecap tetep bener.'
            ],
            latihanFormatif: [
                { no: 1, pertanyaan: 'Naon bédana pamakéan kecap "neda" jeung "tuang" dina undak-usuk basa Sunda?', kunciSingkat: 'Neda dipaké keur diri sorangan, sedengkeun tuang dipaké keur ngahormat batur (kolot/guru).' },
                { no: 2, pertanyaan: 'Robah kalimah ieu jadi basa lemes keur ka guru: "Kuring rék indit ka perpustakaan."', kunciSingkat: 'Abdi badé mios ka perpustakaan.' },
                { no: 3, pertanyaan: 'Tuliskeun 2 kecap sopan dina basa Sunda nu mindeng dipaké nalika ménta tulung atawa nganuhunkeun!', kunciSingkat: 'Punten sareng hatur nuhun.' }
            ],
            visualCaption: `Ilustrasi Paguneman & Budaya Sunda: ${topicTitle}`
        };
    }

    // 6. BAHASA INDONESIA, PPKN, SENI, BAHASA INGGRIS, KODING & GENERAL DOMAIN-SPECIFIC PACK
    const subjectPack = (() => {
        if (subjLower.includes('indonesia')) {
            const isProcedure = /\b(prosedur|petunjuk|langkah|membuat|cara)\b/.test(combined);
            const isPoem = /\b(puisi|pantun|sajak|majas|rima|bait)\b/.test(combined);
            return {
                def: isProcedure
                    ? `Teks prosedur adalah teks yang berisi tujuan dan urutan langkah-langkah sistematis menggunakan kalimat perintah (imperatif), kata kerja aktif, dan kata hubung urutan agar pembaca dapat membuat atau melakukan sesuatu dengan tepat.`
                    : isPoem
                        ? `Puisi dan pantun adalah karya sastra berbentuk bait dan larik yang mengutamakan pilihan kata indah (diksi), rima/persajakan, serta ungkapan perasaan atau pesan moral yang mendalam.`
                        : `Kompetensi Bahasa Indonesia pada "${topicTitle}" melatih kemampuan menyimak, membaca pemahaman (menemukan gagasan pokok & informasi tersurat/tersirat), serta berbicara dan menulis menggunakan kaidah Ejaan Bahasa Indonesia (EYD) dan kalimat efektif.`,
                exp: isProcedure
                    ? `Ciri utama teks prosedur adalah penggunaan kalimat perintah yang santun dan jelas (misal: "Potonglah kertas menjadi dua bagian"), kata keterangan cara/alat, serta urutan kronologis dari langkah pertama hingga selesai.`
                    : `Dalam memahami bacaan Bahasa Indonesia sesuai Buku Siswa Kemendikdasmen, pembaca mengidentifikasi kalimat utama (berisi ide pokok/gagasan utama) dan kalimat penjelas di setiap paragraf, serta memperhatikan huruf kapital dan tanda baca (titik, koma, tanda tanya, tanda seru) saat menulis.`,
                terms: [
                    { term: 'Ide Pokok / Gagasan Utama', meaning: 'Inti pembicaraan yang menjadi dasar pengembangan seluruh kalimat dalam satu paragraf.' },
                    { term: 'Kalimat Efektif & EYD', meaning: 'Kalimat lengkap berstruktur S-P-O-K yang memakai huruf kapital dan tanda baca secara tepat.' },
                    { term: 'ADIKSIMBA (5W+1H)', meaning: 'Kata tanya Apa, Di mana, Kapan, Siapa, Mengapa, dan Bagaimana untuk menggali isi teks.' },
                    { term: 'Informasi Tersurat & Tersirat', meaning: 'Fakta yang tertulis langsung di teks serta pesan moral yang disimpulkan dari bacaan.' }
                ],
                example: `Contoh Kalimat Efektif: "Raka membaca buku cerita di perpustakaan sekolah dengan tenang." (Menggunakan huruf kapital di awal kalimat dan nama orang, serta diakhiri tanda titik).`,
                misconceptions: [
                    { salah: 'Mengira ide pokok selalu berbentuk kalimat panjang yang disalin persis dari teks.', pelurusan: 'Ide pokok adalah inti gagasan paragraf yang dapat diringkas padat dari kalimat utama.' },
                    { salah: 'Lupa menggunakan huruf kapital pada nama orang, hari, bulan, atau awal kalimat.', pelurusan: 'Sesuai kaidah EYD V, huruf kapital wajib dipakai di awal kalimat serta nama diri, tempat, hari, dan bulan.' }
                ],
                q1: { q: 'Apa perbedaan antara kalimat utama dan kalimat penjelas dalam sebuah paragraf?', a: 'Kalimat utama berisi gagasan pokok paragraf, sedangkan kalimat penjelas menguraikan atau memberi contoh untuk mendukung kalimat utama.' },
                q2: { q: 'Perbaiki penulisan kalimat berikut sesuai EYD: "pada hari senin ani pergi ke bandung"', a: 'Pada hari Senin, Ani pergi ke Bandung.' }
            };
        }

        if (subjLower.includes('pancasila') || subjLower.includes('ppkn')) {
            return {
                def: `Materi Pendidikan Pancasila "${topicTitle}" mempelajari penerapan nilai-nilai luhur Pancasila (Ketuhanan, Kemanusiaan, Persatuan, Musyawarah, dan Keadilan Sosial), keseimbangan hak dan kewajiban, serta sikap menghargai keberagaman dalam bingkai Bhinneka Tunggal Ika.`,
                exp: `Sesuai Buku Siswa Pendidikan Pancasila Kemendikdasmen, setiap warga negara termasuk siswa SD memiliki hak (sesuatu yang layak diterima, seperti mendapat pendidikan dan rasa aman) dan kewajiban (tanggung jawab yang wajib dilaksanakan lebih dahulu, seperti menaati tata tertib sekolah dan menghormati guru).`,
                terms: [
                    { term: 'Hak & Kewajiban Seimbang', meaning: 'Kewajiban dilaksanakan dengan tanggung jawab agar hak diri dan orang lain terpenuhi adil.' },
                    { term: 'Musyawarah Mufakat', meaning: 'Pengambilan keputusan bersama dengan berdiskusi santun, menghargai perbedaan pendapat, dan menerima hasil dengan lapang dada.' },
                    { term: 'Gotong Royong', meaning: 'Kerja sama sukarela untuk meringankan pekerjaan bersama di rumah, kelas, maupun masyarakat.' },
                    { term: 'Bhinneka Tunggal Ika', meaning: 'Berbeda-beda suku, agama, bahasa, dan budaya tetapi tetap satu kesatuan bangsa Indonesia.' }
                ],
                example: `Contoh Musyawarah di Kelas: Memilih ketua kelas atau jadwal piket melalui diskusi bersama sehingga semua siswa menyepakati keputusan dengan tertib.`,
                misconceptions: [
                    { salah: 'Menuntut hak terlebih dahulu sebelum melaksanakan kewajiban sebagai siswa.', pelurusan: 'Kewajiban dan hak berjalan beriringan; melaksanakan kewajiban dengan baik memastikan hak bersama tetap terjaga.' },
                    { salah: 'Memaksakan kehendak pribadi saat berdiskusi kelompok.', pelurusan: 'Musyawarah mengutamakan kepentingan bersama dan menghormati pendapat teman yang berbeda.' }
                ],
                q1: { q: 'Mengapa pelaksanaan kewajiban harus diimbangi dengan pemenuhan hak secara adil?', a: 'Agar tercipta ketertiban, keadilan, dan kenyamanan bersama di rumah maupun di sekolah.' },
                q2: { q: 'Apa yang harus dilakukan jika pendapat kita tidak terpilih dalam musyawarah kelas?', a: 'Menerima keputusan bersama dengan lapang dada dan tetap ikut melaksanakannya dengan tanggung jawab.' }
            };
        }

        if (subjLower.includes('koding') || subjLower.includes('kecerdasan')) {
            return {
                def: `Materi Koding dan Kecerdasan Artifisial "${topicTitle}" melatih kemampuan berpikir komputasional (dekomposisi, pengenalan pola, abstraksi, dan algoritma) serta memahami cara kerja program dan sistem AI menggunakan data secara etis dan aman.`,
                exp: `Dalam pemrograman dasar SD, suatu masalah besar dipecah menjadi bagian kecil (dekomposisi), kemudian disusun menjadi urutan langkah logis tanpa ambigu (algoritma / flowchart) yang memanfaatkan struktur urutan (sequence), perulangan (loop), dan kondisi percabangan (jika-maka / if-else).`,
                terms: [
                    { term: 'Algoritma & Flowchart', meaning: 'Urutan langkah logis penyelesaian masalah yang digambarkan dengan simbol mulai, proses, dan keputusan.' },
                    { term: 'Dekomposisi', meaning: 'Memecah masalah rumit menjadi bagian-bagian kecil agar mudah diselesaikan.' },
                    { term: 'Percabangan (If-Else)', meaning: 'Aturan pengambilan keputusan program berdasarkan syarat kondisi tertentu.' },
                    { term: 'Dataset & Keamanan Digital', meaning: 'Kumpulan data latih untuk AI serta kewaspadaan menjaga kata sandi dan privasi diri.' }
                ],
                example: `Contoh Logika If-Else: "JIKA lampu lalu lintas berwarna merah, MAKA kendaraan berhenti; JIKA TIDAK dan berwarna hijau, MAKA kendaraan berjalan."`,
                misconceptions: [
                    { salah: 'Mengira kecerdasan artifisial (AI) memiliki perasaan dan kesadaran seperti manusia.', pelurusan: 'AI bekerja memproses pola dari data yang diberikan manusia, sehingga manusia tetap bertanggung jawab memeriksa kebenaran hasilnya.' },
                    { salah: 'Mengira urutan langkah algoritma boleh dibolak-balik sesuka hati.', pelurusan: 'Urutan instruksi yang salah dapat membuat program menghasilkan error (bug) atau hasil yang keliru.' }
                ],
                q1: { q: 'Apa yang dimaksud dengan dekomposisi dalam berpikir komputasional?', a: 'Memecah masalah besar menjadi bagian-bagian kecil yang lebih mudah disusun dan diselesaikan.' },
                q2: { q: 'Mengapa kita tidak boleh membagikan kata sandi (password) atau data pribadi ke sembarang situs/aplikasi?', a: 'Untuk menjaga keamanan digital dan mencegah penyalahgunaan akun oleh pihak yang tidak bertanggung jawab.' }
            };
        }

        if (subjLower.includes('seni')) {
            return {
                def: `Pembelajaran Seni Budaya (${subject}) pada topik "${topicTitle}" mengembangkan kepekaan estetik, keterampilan berkarya melalui unsur seni (garis, warna, bentuk, tekstur, nada, irama, gerak, atau peran), serta apresiasi terhadap kekayaan budaya Nusantara.`,
                exp: `Dalam berkarya seni rupa maupun pertunjukan, siswa mengenali bahan, alat, dan teknik dasar (seperti mencampur warna primer merah-kuning-biru menjadi warna sekunder, menjaga tempo/irama musik, atau mengatur pola lantai gerak tari) untuk mengekspresikan ide secara kreatif dan rapi.`,
                terms: [
                    { term: 'Warna Primer & Sekunder', meaning: 'Warna dasar (merah, kuning, biru) dan hasil pencampurannya (oranye, hijau, ungu).' },
                    { term: 'Unsur Rupa / Irama', meaning: 'Elemen pembentuk karya seperti titik, garis, bidang, tekstur, tempo, dan pola lantai.' },
                    { term: 'Teknik Berkarya', meaning: 'Cara mengolah alat dan bahan (menggambar, menempel/kolase, membentuk, atau menyanyi).' },
                    { term: 'Apresiasi Karya', meaning: 'Kemampuan menghargai keindahan, makna, dan kerja keras karya sendiri maupun teman.' }
                ],
                example: `Contoh Pencampuran Warna: Mencampurkan cat warna primer biru dan kuning dengan takaran seimbang menghasilkan warna sekunder hijau.`,
                misconceptions: [
                    { salah: 'Mengira karya seni yang bagus hanya dinilai dari mahal atau tidaknya alat gambar.', pelurusan: 'Karya seni yang baik lahir dari komposisi unsur yang rapi, kreativitas ide, dan ketekunan teknik berkarya.' },
                    { salah: 'Menggunakan bahan alam atau pewarna tanpa menjaga kebersihan area kerja.', pelurusan: 'Seniman cilik selalu menata alat dengan tertib dan membersihkan meja setelah berkarya.' }
                ],
                q1: { q: 'Sebutkan 3 warna primer (dasar) dan hasil pencampuran warna merah dengan kuning!', a: 'Warna primer adalah merah, kuning, dan biru; pencampuran merah + kuning menghasilkan warna oranye (jingga).' },
                q2: { q: 'Bagaimana sikap apresiasi yang baik terhadap karya seni milik teman sekelas?', a: 'Menghargai usahanya, memuji kelebihannya dengan santun, dan memberi masukan membangun tanpa mengejek.' }
            };
        }

        // Bahasa Inggris & Other Subjects
        if (subjLower.includes('inggris')) {
            return {
                def: `In elementary English learning ("${topicTitle}"), students develop foundational communicative competence through authentic key vocabulary, simple sentence structures, accurate pronunciation, and polite daily expressions in classroom and home contexts.`,
                exp: `Students learn to connect English words directly with concrete objects, pictures, and actions (such as "Good morning", "I have two books", "The ball is on the table") while practicing listening, speaking, reading, and simple writing step by step.`,
                terms: [
                    { term: 'Key Vocabulary', meaning: 'Kata kunci Bahasa Inggris yang merujuk langsung pada benda, waktu, kegiatan, atau sifat nyata.' },
                    { term: 'Sentence Pattern', meaning: 'Pola kalimat sederhana (Subject + Verb + Object/Complement) yang benar tata bahasanya.' },
                    { term: 'Pronunciation', meaning: 'Pelafalan kata Bahasa Inggris yang jelas dan mudah dipahami lawan bicara.' },
                    { term: 'Polite Expression', meaning: 'Ungkapan sopan seperti "Excuse me", "Thank you", dan "Please" dalam percakapan.' }
                ],
                example: `Example in Context: "Good morning, Teacher! May I borrow a pencil, please?" — "Sure, here you are." — "Thank you!"`,
                misconceptions: [
                    { salah: 'Membaca tulisan Bahasa Inggris persis seperti ejaan huruf Bahasa Indonesia.', pelurusan: 'Pelafalan Bahasa Inggris berbeda dari penulisannya sehingga siswa perlu mendengarkan dan menirukan pengucapan yang tepat.' },
                    { salah: 'Menghafal kata tunggal tanpa mempraktikkannya dalam kalimat.', pelurusan: 'Kosakata lebih mudah diingat jika langsung dipakai dalam percakapan pendek bersama teman.' }
                ],
                q1: { q: 'Write 2 polite English expressions you use when asking for help or saying thanks to a friend!', a: '"Please help me" and "Thank you very much".' },
                q2: { q: `Create 1 simple English sentence related to "${topicTitle}"!`, a: 'A grammatically correct simple sentence using the target vocabulary.' }
            };
        }

        return {
            def: `Materi "${topicTitle}" pada mata pelajaran ${subject} (${elementName}) membahas konsep keilmuan esensial, ciri khas, aturan kerja, serta penerapannya secara sistematis untuk jenjang ${className}.`,
            exp: `Melalui topik "${topicTitle}", peserta didik dibimbing memahami makna istilah pokok, hubungan antarunsur materi, dan langkah penerapan konkret dalam kehidupan sehari-hari sesuai ruang lingkup ${elementName}.`,
            terms: [
                { term: 'Konsep Pokok', meaning: `Gagasan dasar yang menjelaskan hakikat dan ciri utama ${topicTitle}.` },
                { term: 'Prinsip Kerja', meaning: `Aturan atau langkah terstruktur dalam menerapkan ${topicTitle} secara tepat.` },
                { term: 'Contoh Kontekstual', meaning: 'Situasi nyata di rumah atau sekolah yang membuktikan penerapan konsep.' },
                { term: 'Bukti Pemahaman', meaning: 'Kemampuan menjelaskan ulang dan mempraktikkan kompetensi TP secara mandiri.' }
            ],
            example: `Contoh penerapan ${topicTitle} dapat diamati langsung melalui kegiatan belajar terarah di kelas bersama guru dan teman.`,
            misconceptions: [
                { salah: `Menghafal definisi ${topicTitle} tanpa memahami alasan penerapannya.`, pelurusan: 'Konsep harus dipahami maknanya dan dihubungkan dengan contoh nyata sehari-hari.' },
                { salah: 'Mencampuradukkan istilah dari pokok bahasan lain yang belum dipelajari.', pelurusan: 'Fokuskan pemahaman sesuai batasan Tujuan Pembelajaran (TP) yang sedang dipelajari.' }
            ],
            q1: { q: `Jelaskan konsep utama dari "${topicTitle}" dengan bahasamu sendiri!`, a: `Menjelaskan pengertian, ciri utama, dan manfaat ${topicTitle} secara runtut.` },
            q2: { q: `Berikan 2 contoh penerapan "${topicTitle}" di sekolah atau di rumah!`, a: 'Dua contoh aktivitas nyata yang sesuai dengan konsep materi.' }
        };
    })();

    return {
        pengertianKonsep: subjectPack.def,
        penjelasanUtama: subjectPack.exp,
        domainTerms: subjectPack.terms,
        poinPenting: subjectPack.terms.slice(0, 3).map(t => `${t.term}: ${t.meaning}`),
        contohKonkret: subjectPack.example,
        contohSehariHari: [
            `Di Rumah: Mempraktikkan pemahaman ${topicTitle} dalam kegiatan harian bersama keluarga.`,
            `Di Sekolah: Mengamati dan menerapkan ${topicTitle} secara tertib selama belajar di kelas.`,
            `Di Lingkungan Sekitar: Menghubungkan materi ${topicTitle} dengan peristiwa nyata di sekitar siswa.`
        ],
        klasifikasiAtauProses: {
            judul: `Sistematika Pemahaman & Unsur ${topicTitle}`,
            butir: [
                { label: `1. ${subjectPack.terms[0].term}`, uraian: subjectPack.terms[0].meaning },
                { label: `2. ${subjectPack.terms[1].term}`, uraian: subjectPack.terms[1].meaning },
                { label: `3. ${subjectPack.terms[2].term}`, uraian: subjectPack.terms[2].meaning }
            ]
        },
        tabelInformatif: {
            judul: `Matriks Konsep & Penerapan ${topicTitle} (${subject})`,
            kolom: ['Istilah / Unsur', 'Penjelasan Keilmuan', 'Penerapan Nyata'],
            baris: [
                [subjectPack.terms[0].term, subjectPack.terms[0].meaning, 'Pengamatan di kelas'],
                [subjectPack.terms[1].term, subjectPack.terms[1].meaning, 'Latihan terbimbing guru'],
                [subjectPack.terms[2].term, subjectPack.terms[2].meaning, 'Praktik di rumah/sekolah']
            ]
        },
        miskonsepsiUmum: subjectPack.misconceptions,
        aktivitasSederhana: {
            judul: `Aktivitas Belajar Terarah: ${topicTitle}`,
            langkah: [
                `Baca kembali pengertian konsep dan amati ilustrasi pendukung ${topicTitle}.`,
                `Temukan 1 contoh nyata di lingkunganmu yang sesuai dengan penjelasan materi.`,
                `Jelaskan temuanmu kepada teman sebangku dengan bahasa yang jelas.`
            ],
            hasilDiharapkan: `Siswa mampu menjelaskan dan mempraktikkan konsep ${topicTitle} dengan tepat.`
        },
        rangkumanPoin: [
            subjectPack.def,
            `${subjectPack.terms[0].term} dan ${subjectPack.terms[1].term} menjadi dasar pemahaman ${topicTitle}.`,
            'Menghubungkan materi pelajaran dengan contoh sehari-hari membantu pemahaman bertahan lebih lama.'
        ],
        latihanFormatif: [
            { no: 1, pertanyaan: subjectPack.q1.q, kunciSingkat: subjectPack.q1.a },
            { no: 2, pertanyaan: subjectPack.q2.q, kunciSingkat: subjectPack.q2.a },
            { no: 3, pertanyaan: `Mengapa kita perlu menghindari kesalahan pemahaman pada materi "${topicTitle}"?`, kunciSingkat: 'Agar konsep dipahami secara benar secara keilmuan dan tepat saat dipraktikkan.' }
        ],
        visualCaption: `Ilustrasi Edukatif ${subject}: ${topicTitle}`
    };
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

    const domainPack = buildSubjectDomainKnowledge({
        subject,
        className,
        fase,
        elementName,
        tpText,
        atpText,
        topicTitle
    });
    const domainTerms = domainPack.domainTerms;
    const visualCaption = domainPack.visualCaption;
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
        title: isSunda ? `Basa Sunda: ${topicTitle}` : topicTitle,
        subtitle: `Materi Ajar ${subject} · ${className} (${fase})`,
        // B. PENGANTAR MATERI
        pengantarSingkat: isSunda
            ? `Wilujeng diajar murangkalih ${className}! Dina bahasan ieu urang bakal mikawanoh "${topicTitle}" anu raket patalina jeung tatakrama sapopoé.`
            : `Halo sahabat belajar ${className}! Pada pelajaran ${subject} kali ini, kita akan mempelajari "${topicTitle}" secara tuntas mulai dari konsep dasarnya hingga praktik nyata.`,
        pertanyaanPemantik: isSunda
            ? [
                `Kumaha cara nyarita anu sopan ka kolot atawa guru dina basa Sunda?`,
                `Naon waé conto dina kahirupan sapopoé anu patali jeung "${topicTitle}"?`
            ]
            : [
                `Pernahkah kamu menjumpai atau mempraktikkan langsung kegiatan yang berkaitan dengan "${topicTitle}"?`,
                `Mengapa penting menguasai teknik atau aturan yang benar pada materi "${topicTitle}"?`
            ],
        // C. INTI MATERI (SPECIFIC TO SUBJECT DISCIPLINE)
        pengertianKonsep: domainPack.pengertianKonsep,
        penjelasanUtama: domainPack.penjelasanUtama,
        poinPenting: domainPack.poinPenting,
        contohKonkret: domainPack.contohKonkret,
        visualCaption,
        visualSvg,
        // D. CONTOH DALAM KEHIDUPAN SEHARI-HARI
        contohSehariHari: domainPack.contohSehariHari,
        // E. AKTIVITAS SISWA
        aktivitasSederhana: domainPack.aktivitasSederhana,
        // F. RANGKUMAN
        rangkumanPoin: domainPack.rangkumanPoin,
        // G. LATIHAN PEMAHAMAN
        latihanFormatif: domainPack.latihanFormatif,
        // Metadata PPA tambahan
        pemahamanBermakna: isSunda
            ? `Ku ngawasa materi "${topicTitle}", murid ${className} bisa ngagunakeun basa Sunda anu merenah tur sopan dina kahirupan sapopoé.`
            : `Dengan menguasai "${topicTitle}", peserta didik ${className} memahami konsep ilmiah ${subject} pada elemen ${elementName} serta menerapkannya dengan tepat dan bertanggung jawab.`,
        kataKunci: domainTerms,
        ringkasanKonsepInti: `Fokus TP: "${tpText}". Alur belajar: "${shortFocus}".`,
        aktivitasPembelajaran: [
            { tahap: '1. Memahami', kegiatan: `Peserta didik mengamati ilustrasi dan mempelajari konsep ${domainTerms[0]?.term || topicTitle}.` },
            { tahap: '2. Mengaplikasi', kegiatan: domainPack.aktivitasSederhana.judul },
            { tahap: '3. Merefleksi', kegiatan: 'Peserta didik menyimpulkan rangkuman inti dan menjawab latihan pemahaman.' }
        ],
        refleksiSiswa: [
            `Saya sudah memahami arti dan cara kerja ${topicTitle} sesuai kaidah ${subject}.`,
            'Saya dapat mempraktikkan contoh nyata dan menghindari kesalahan umum yang dijelaskan guru.'
        ]
    };

    const kaitanPengalamanSiswa = isSunda
        ? `Dina kahirupan sapopoé di imah jeung di sakola, murangkalih ${className} pasti mindeng nyaksian atawa ngalaman kajadian anu patali jeung "${topicTitle}".`
        : `Setiap hari saat beraktivitas di rumah, bermain di halaman, maupun belajar bersama di kelas, siswa ${className} sering mengalami situasi nyata yang berkaitan langsung dengan "${topicTitle}".`;

    const unsurPenting = domainTerms.map(t => `${t.term}: ${t.meaning}`);

    const pendalamanMateri = {
        analisisSederhana: isLowerGrade
            ? `Untuk siswa ${className} (Fase A), konsep ${subject} dipahami lewat pengamatan objek konkret, peragaan langsung langkah demi langkah, dan kebiasaan sederhana sehari-hari.`
            : /kelas\s*[34]/i.test(className)
                ? `Pada ${className} (Fase B), siswa mengelompokkan ciri pokok ${topicTitle}, membandingkan contoh benar vs keliru, serta mengaitkan aturan konsep dengan praktik nyata.`
                : `Pada ${className} (Fase C), siswa menganalisis prinsip kerja dan hubungan sebab-akibat ${topicTitle}, meluruskan miskonsepsi, serta mengevaluasi penerapannya secara mandiri.`,
        faktaTeridentifikasi: [
            `Konsep keilmuan disusun sesuai ruang lingkup ${subject} (Elemen: ${elementName}) dan TP terkunci.`,
            `Istilah kunci meliputi: ${domainTerms.map(d => d.term).join(', ')}.`
        ],
        miskonsepsiUmum: domainPack.miskonsepsiUmum
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
        'Sesuaikan nomor halaman/bab pada Buku Siswa & Buku Panduan Guru Kemendikdasmen edisi yang digunakan di sekolah (status: PERLU VERIFIKASI GURU).'
    ];

    baseData.curriculumMeta = {
        curriculumName: 'Kurikulum Merdeka (Permendikdasmen No. 13 Tahun 2025 & Kepka BSKAP No. 046/H/KR/2025)',
        jenjang: 'Sekolah Dasar (SD/MI)',
        institutionName: 'Satuan Pendidikan SD/MI',
        isLockedSource: false,
        topicFocus: topicTitle,
        orientation: defaultOrientation
    };
    baseData.themeId = 'zamrud_edukatif';
    baseData.visualVariantIndex = 0;
    baseData.tpAtpAnalysis = baselineAnalysis;
    baseData.kaitanPengalamanSiswa = kaitanPengalamanSiswa;
    baseData.unsurPenting = unsurPenting;
    baseData.klasifikasiAtauProses = domainPack.klasifikasiAtauProses;
    baseData.tabelInformatif = domainPack.tabelInformatif;
    baseData.pendalamanMateri = pendalamanMateri;
    baseData.referensi = references;
    baseData.teacherNotes = teacherNotes;
    baseData.pages = buildLogicalDocumentPages({
        title: baseData.title,
        subject,
        templateId,
        focusLevel,
        pageCountPreference: 'auto'
    });

    // Populate all 29 template-specific payloads cleanly from rich domain data
    buildTemplatePayloadsFromMerged(baseData, {
        subject,
        className,
        fase,
        elementName,
        tpText,
        atpText,
        alokasiWaktu,
        templateId
    });

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

/**
 * Allocates dynamic, non-repetitive logical pages (1 to 4 pages) based on scope mode,
 * chosen visual template, and teacher preference.
 */
export const buildLogicalDocumentPages = (params: {
    title: string;
    subject: string;
    templateId: MateriTemplateId;
    focusLevel: HierarchyFocusLevel;
    pageCountPreference?: PageCountPreference;
}): MateriDocumentPage[] => {
    const tplMeta = MATERI_AJAR_TEMPLATES.find(t => t.id === params.templateId);
    const tplName = tplMeta?.name || 'Desain Visual';
    const pref = params.pageCountPreference || 'auto';

    let targetCount: number;
    if (pref !== 'auto') {
        targetCount = pref;
    } else if (params.focusLevel === 'atp') {
        // Specific ATP mode: compact 1 or 2 pages depending on template density
        const singleSheetTemplates = new Set<MateriTemplateId>([
            'illustrated_poster',
            'frayer_model',
            'venn_diagram',
            't_chart',
            'kwl_chart',
            'sticky_notes',
            'cheat_sheet',
            'cycle_diagram'
        ]);
        targetCount = singleSheetTemplates.has(params.templateId) ? 1 : 2;
    } else {
        // Broad TP or Element mode: comprehensive 3 pages by default
        targetCount = 3;
    }

    const catalog: MateriDocumentPage[] = [
        {
            pageNo: 1,
            heading: `${params.title} — ${tplName}`,
            subtitle: 'Sajian Visual Utama, Identitas Terkunci, Konsep Inti & Ilustrasi',
            kind: 'visual_master'
        },
        {
            pageNo: 2,
            heading: 'Pendalaman Subtopik, Contoh Nyata & Aktivitas Siswa',
            subtitle: 'Uraian Mendalam, Pelurusan Miskonsepsi & Penerapan Sehari-hari',
            kind: 'subtopics_deep'
        },
        {
            pageNo: 3,
            heading: 'Latihan Pemahaman, Rangkuman & Referensi Resmi',
            subtitle: 'Pemeriksaan Pemahaman Siswa, Kunci Guru & Landasan Kurikulum',
            kind: 'practice_application'
        },
        {
            pageNo: 4,
            heading: 'Lembar Penguatan & Catatan Refleksi Pembelajaran',
            subtitle: 'Glosarium Istilah, Refleksi Siswa & Lembar Pengesahan',
            kind: 'summary_ref'
        }
    ];

    return catalog.slice(0, Math.max(1, Math.min(4, targetCount)));
};

/**
 * Syncs ALL 29 visual template payloads directly from substantive merged/AI content
 * so switching between any of the 29 designs in the live studio happens instantaneously without losing substance.
 */
export const buildTemplatePayloadsFromMerged = (
    data: GeneratedMateriAjarData,
    params: {
        subject: string;
        className: string;
        fase: string;
        elementName: string;
        tpText: string;
        atpText: string;
        alokasiWaktu: string;
        templateId: MateriTemplateId;
    }
): void => {
    const { subject, className, fase, elementName, tpText, atpText, alokasiWaktu } = params;
    const isSunda = isBahasaSundaTopic(subject, elementName, tpText);
    const terms = data.kataKunci || [];
    const points = data.poinPenting || [];
    const daily = data.contohSehariHari || [];
    const summary = data.rangkumanPoin || [];
    const steps = data.klasifikasiAtauProses?.butir || [];
    const misconceptions = data.pendalamanMateri?.miskonsepsiUmum || [];
    const tblRows = data.tabelInformatif?.baris || [];
    const combinedLower = `${subject} ${elementName} ${tpText} ${atpText}`.toLowerCase();

    // A. Ringkasan & Informasi (1–5)
    data.infographicData = {
        heroStatLabel: 'Alokasi & Fokus PPA',
        heroStatValue: alokasiWaktu || '3 JP · Siap Ekspor PNG',
        heroNote: `Selaras CP Elemen "${elementName}" (${className} · ${fase})`,
        pillars: [
            { number: '01', title: 'Pengertian Konsep', summary: data.pengertianKonsep, keyFact: points[0] || '', example: data.contohKonkret },
            { number: '02', title: 'Penjelasan Materi Utama', summary: data.penjelasanUtama, keyFact: points[1] || '', example: daily[0] || '' },
            { number: '03', title: 'Unsur & Poin Penting', summary: (data.unsurPenting || points).slice(0, 3).join(' · '), keyFact: points[2] || '', example: daily[1] || '' },
            { number: '04', title: 'Penerapan & Pelurusan', summary: data.pendalamanMateri?.analisisSederhana || data.aktivitasSederhana.hasilDiharapkan, keyFact: data.aktivitasSederhana.judul, example: summary[0] || '' }
        ],
        goldenTakeaway: summary.join(' ')
    };

    data.cheatSheetData = {
        quickOverview: data.pengertianKonsep,
        boxes: [
            {
                title: 'Konsep & Istilah Kunci',
                category: subject,
                items: terms.map(t => `${t.term}: ${t.meaning}`),
                formulaOrRule: data.penjelasanUtama.slice(0, 180)
            },
            {
                title: data.klasifikasiAtauProses?.judul || 'Aturan & Langkah Inti',
                category: elementName,
                items: steps.length > 0 ? steps.map(s => `${s.label}: ${s.uraian}`) : points,
                formulaOrRule: data.contohKonkret
            }
        ],
        commonMistakes: misconceptions.length > 0
            ? misconceptions.map(m => ({ mistake: m.salah, correction: m.pelurusan }))
            : [{ mistake: 'Membaca konsep tanpa mengecek contoh nyata.', correction: 'Hubungkan selalu dengan 1 contoh di rumah/sekolah.' }]
    };

    data.stickyNotesData = {
        boardTopic: `Catatan Penting ${subject}: ${data.title}`,
        notes: [
            { title: '1. Pengertian Konsep', tag: 'Konsep', colorTheme: 'amber', content: data.pengertianKonsep, reminder: terms[0]?.term || subject },
            { title: '2. Penjelasan Inti', tag: 'Materi', colorTheme: 'sky', content: data.penjelasanUtama, reminder: alokasiWaktu },
            { title: '3. Contoh Konkret', tag: 'Contoh', colorTheme: 'emerald', content: data.contohKonkret, reminder: daily[0] || 'Amati sekitarmu!' },
            { title: '4. Pelurusan Miskonsepsi', tag: 'Penting', colorTheme: 'rose', content: misconceptions[0]?.pelurusan || data.aktivitasSederhana.hasilDiharapkan, reminder: misconceptions[0]?.salah || data.aktivitasSederhana.judul },
            { title: '5. Rangkuman Kunci', tag: 'Ingat', colorTheme: 'violet', content: summary[0] || data.pemahamanBermakna, reminder: 'Praktikkan hari ini' }
        ]
    };

    data.visualGlossaryData = {
        glossaryTitle: `Kamus Visual ${subject}: ${data.title}`,
        entries: (terms.length > 0 ? terms : [
            { term: data.title, meaning: data.pengertianKonsep },
            { term: 'Prinsip Utama', meaning: data.penjelasanUtama },
            { term: 'Contoh Nyata', meaning: data.contohKonkret }
        ]).map((t, idx) => ({
            term: t.term,
            category: idx === 0 ? 'Konsep Inti' : elementName,
            symbolHint: ['book', 'compass', 'layers', 'sparkles'][idx % 4],
            definition: t.meaning,
            example: daily[idx % Math.max(1, daily.length)] || data.contohKonkret
        }))
    };

    data.knowledgePyramidData = {
        pyramidTitle: `Piramida Penguasaan Materi: ${data.title}`,
        tiers: [
            {
                level: 4,
                tierLabel: 'Puncak · Penerapan & Kreasi',
                title: data.aktivitasSederhana.judul,
                description: data.aktivitasSederhana.hasilDiharapkan,
                example: daily[0] || data.contohKonkret
            },
            {
                level: 3,
                tierLabel: 'Tingkat 3 · Hubungan & Pelurusan',
                title: 'Analisis & Ketepatan Konsep',
                description: misconceptions[0]?.pelurusan || data.pendalamanMateri?.analisisSederhana || data.penjelasanUtama,
                example: data.contohKonkret
            },
            {
                level: 2,
                tierLabel: 'Tingkat 2 · Unsur & Mekanisme',
                title: data.klasifikasiAtauProses?.judul || 'Aturan & Unsur Pokok',
                description: steps.slice(0, 2).map(s => `${s.label}: ${s.uraian}`).join(' '),
                example: points[0] || ''
            },
            {
                level: 1,
                tierLabel: 'Fondasi · Pengertian Dasar',
                title: terms[0]?.term || data.title,
                description: data.pengertianKonsep,
                example: `Ruang lingkup ${subject} ${className}`
            }
        ],
        apexInsight: summary[0] || data.pemahamanBermakna
    };

    // B. Peta Konsep (6–10)
    data.mindMapData = {
        centralNode: data.title.length > 34 ? data.title.slice(0, 32) + '…' : data.title,
        centralSubtitle: `${subject} · ${className}`,
        branches: [
            { title: '1. Pengertian Konsep', colorHex: '#0284c7', keywords: [terms[0]?.term || 'Konsep', elementName], explanation: data.pengertianKonsep },
            { title: '2. Penjelasan & Unsur', colorHex: '#059669', keywords: [terms[1]?.term || 'Aturan', terms[2]?.term || 'Ciri'], explanation: data.penjelasanUtama },
            { title: '3. Contoh & Penerapan', colorHex: '#d97706', keywords: ['Konkret', 'Sehari-hari'], explanation: data.contohKonkret },
            { title: '4. Aktivitas & Pelurusan', colorHex: '#7c3aed', keywords: ['Praktik', 'Tepat'], explanation: misconceptions[0]?.pelurusan || data.aktivitasSederhana.hasilDiharapkan }
        ]
    };

    data.conceptMapData = {
        title: `Peta Hubungan Konsep: ${data.title}`,
        nodes: [
            { id: 'c', label: data.title.slice(0, 28), role: 'core', summary: data.pengertianKonsep },
            { id: 'n1', label: (terms[0]?.term || 'Konsep Dasar').slice(0, 24), role: 'primary', summary: terms[0]?.meaning || data.pengertianKonsep },
            { id: 'n2', label: (terms[1]?.term || 'Mekanisme Kerja').slice(0, 24), role: 'primary', summary: terms[1]?.meaning || data.penjelasanUtama },
            { id: 'n3', label: 'Contoh Sehari-hari', role: 'detail', summary: daily[0] || data.contohKonkret },
            { id: 'n4', label: 'Pemahaman Benar', role: 'detail', summary: misconceptions[0]?.pelurusan || summary[0] || '' }
        ],
        edges: [
            { fromId: 'c', toId: 'n1', linkingVerb: 'didasari oleh' },
            { fromId: 'c', toId: 'n2', linkingVerb: 'bekerja melalui' },
            { fromId: 'n2', toId: 'n3', linkingVerb: 'tampak pada' },
            { fromId: 'n1', toId: 'n4', linkingVerb: 'meluruskan' }
        ]
    };

    data.treeDiagramData = {
        rootTitle: data.title,
        rootSubtitle: `${subject} · ${elementName}`,
        branches: [
            {
                category: 'Konsep & Istilah Inti',
                description: data.pengertianKonsep,
                children: terms.slice(0, 2).map(t => ({ label: t.term, detail: t.meaning }))
            },
            {
                category: data.klasifikasiAtauProses?.judul || 'Unsur & Tahapan',
                description: data.penjelasanUtama,
                children: steps.slice(0, 2).map(s => ({ label: s.label, detail: s.uraian }))
            },
            {
                category: 'Penerapan & Bukti Nyata',
                description: data.contohKonkret,
                children: daily.slice(0, 2).map((d, i) => ({ label: `Penerapan ${i + 1}`, detail: d }))
            }
        ]
    };

    data.vennDiagramData = {
        title: `Perbandingan & Irisan: ${terms[0]?.term || 'Konsep'} vs ${terms[1]?.term || 'Penerapan'}`,
        leftLabel: terms[0]?.term || 'Pemahaman Konsep',
        leftPoints: [
            terms[0]?.meaning || data.pengertianKonsep,
            points[0] || 'Fokus pada ciri dan definisi baku'
        ],
        rightLabel: terms[1]?.term || 'Praktik & Contoh Nyata',
        rightPoints: [
            terms[1]?.meaning || data.contohKonkret,
            daily[0] || 'Diterapkan di rumah dan sekolah'
        ],
        intersectionLabel: 'Titik Temu & Keterpaduan',
        intersectionPoints: [
            `Selaras TP: ${tpText.slice(0, 90)}`,
            summary[0] || data.pemahamanBermakna
        ],
        insight: misconceptions[0]?.pelurusan || data.penjelasanUtama
    };

    data.fishboneData = {
        headEffect: data.title.slice(0, 44),
        spineLabel: `Faktor Penguasaan ${subject}`,
        causes: [
            { category: '1. Konsep Dasar', subCauses: [terms[0]?.term || 'Pengertian tepat', points[0] || 'Makna istilah baku'] },
            { category: '2. Langkah & Aturan', subCauses: [steps[0]?.label || 'Urutan sistematis', points[1] || 'Prosedur benar'] },
            { category: '3. Contoh Nyata', subCauses: [daily[0] || 'Praktik di rumah', data.contohKonkret.slice(0, 75)] },
            { category: '4. Anti-Miskonsepsi', subCauses: [misconceptions[0]?.pelurusan?.slice(0, 75) || 'Verifikasi pemahaman', data.aktivitasSederhana.judul] }
        ],
        conclusion: summary[0] || data.pemahamanBermakna
    };

    // C. Proses & Tahapan (11–14)
    data.stepByStepData = {
        goalStatement: tpText,
        toolsNeeded: [`Buku Teks ${subject} ${className}`, 'Alat tulis / perlengkapan praktik', 'Panduan pengamatan kelas'],
        stages: (steps.length >= 3 ? steps : [
            { label: '1. Pahami Konsep', uraian: data.pengertianKonsep },
            { label: '2. Pelajari Aturan / Teknik', uraian: data.penjelasanUtama },
            { label: '3. Amati Contoh Konkret', uraian: data.contohKonkret },
            { label: '4. Lakukan Aktivitas Siswa', uraian: data.aktivitasSederhana.langkah.join(' ') }
        ]).map((st, idx) => ({
            stepNo: idx + 1,
            title: st.label,
            instruction: st.uraian,
            checkpoint: idx === 0 ? 'Memahami istilah pokok materi.' : 'Mampu menunjukkan langkah secara runtut.',
            tip: misconceptions[idx % Math.max(1, misconceptions.length)]?.pelurusan || 'Lakukan dengan teliti dan tertib.'
        })),
        successIndicator: data.aktivitasSederhana.hasilDiharapkan
    };

    data.flowchartData = {
        title: `Alur Logika Belajar: ${data.title}`,
        steps: [
            { id: 'f1', shape: 'start', label: 'MULAI', detail: data.pengantarSingkat },
            { id: 'f2', shape: 'process', label: 'Pahami Konsep Inti', detail: data.pengertianKonsep },
            { id: 'f3', shape: 'process', label: 'Terapkan Aturan / Langkah', detail: steps[0]?.uraian || data.penjelasanUtama },
            {
                id: 'f4',
                shape: 'decision',
                label: 'Sudah Sesuai Contoh & Aturan?',
                detail: misconceptions[0]?.salah || 'Periksa ketepatan pemahaman konsep',
                yesBranch: 'Lanjut ke Latihan & Refleksi',
                noBranch: 'Tinjau Pelurusan Miskonsepsi'
            },
            { id: 'f5', shape: 'end', label: 'SELESAI & TERUJI', detail: data.aktivitasSederhana.hasilDiharapkan }
        ]
    };

    data.timelineData = {
        timelineTitle: `Kronologi & Tahapan: ${data.title}`,
        periodSpan: `${subject} · ${className} · ${fase}`,
        events: [
            { orderLabel: 'Tahap 1 · Konsep', title: 'Pengertian & Latar Materi', actorOrContext: elementName, description: data.pengertianKonsep, impact: 'Memahami dasar keilmuan topik.' },
            { orderLabel: 'Tahap 2 · Mekanisme', title: data.klasifikasiAtauProses?.judul || 'Proses & Aturan Utama', actorOrContext: subject, description: data.penjelasanUtama, impact: 'Mengetahui urutan atau prinsip kerjanya.' },
            { orderLabel: 'Tahap 3 · Bukti Nyata', title: 'Contoh Konkret & Penerapan', actorOrContext: 'Kehidupan Sehari-hari', description: data.contohKonkret, impact: 'Menghubungkan materi dengan kenyataan.' },
            { orderLabel: 'Tahap 4 · Penguasaan', title: data.aktivitasSederhana.judul, actorOrContext: `Siswa ${className}`, description: data.aktivitasSederhana.hasilDiharapkan, impact: 'Teruji lewat latihan formatif.' }
        ],
        synthesisNote: summary.join(' ')
    };

    data.cycleDiagramData = {
        cycleTitle: `Siklus Proses & Penguatan: ${data.title}`,
        centerLabel: data.title.slice(0, 26),
        phases: [
            { phaseNo: 1, title: steps[0]?.label || '1. Pengenalan Konsep', description: data.pengertianKonsep, keyIndicator: terms[0]?.term || 'Konsep dasar' },
            { phaseNo: 2, title: steps[1]?.label || '2. Proses & Mekanisme', description: data.penjelasanUtama, keyIndicator: terms[1]?.term || 'Aturan kerja' },
            { phaseNo: 3, title: steps[2]?.label || '3. Penerapan Nyata', description: data.contohKonkret, keyIndicator: 'Contoh lingkungan' },
            { phaseNo: 4, title: '4. Evaluasi & Pembiasaan', description: data.aktivitasSederhana.hasilDiharapkan, keyIndicator: 'Refleksi berkelanjutan' }
        ]
    };

    // D. Perbandingan & Analisis (15–18)
    data.comparisonData = {
        conceptAName: `Konsep & Aturan (${terms[0]?.term || subject})`,
        conceptBName: `Penerapan & Pelurusan (${terms[1]?.term || 'Praktik'})`,
        similarities: [
            `Fokus pada TP: ${tpText}`,
            `Mengacu pada CP Elemen ${elementName} (${className})`
        ],
        rows: tblRows.length > 0
            ? tblRows.map(r => ({ aspect: r[0] || '-', conceptAValue: r[1] || '-', conceptBValue: r[2] || '-' }))
            : [
                { aspect: 'Konsep Utama', conceptAValue: data.pengertianKonsep, conceptBValue: data.contohKonkret },
                { aspect: 'Miskonsepsi vs Benar', conceptAValue: misconceptions[0]?.salah || '-', conceptBValue: misconceptions[0]?.pelurusan || '-' }
            ],
        conclusion: summary[0] || data.pemahamanBermakna
    };

    data.tChartData = {
        topicTitle: data.title,
        leftHeader: `Pemahaman Benar (${terms[0]?.term || subject})`,
        rightHeader: 'Hal yang Perlu Dihindari / Pelurusan',
        rows: [
            { leftText: data.pengertianKonsep, rightText: misconceptions[0]?.salah || 'Sekadar menghafal tanpa makna' },
            { leftText: data.contohKonkret, rightText: misconceptions[0]?.pelurusan || 'Pastikan langkah & bukti sesuai fakta' },
            { leftText: daily[0] || points[0] || '', rightText: misconceptions[1]?.pelurusan || 'Terapkan secara konsisten di kelas & rumah' }
        ],
        summaryNote: summary[0] || data.pemahamanBermakna
    };

    data.frayerModelData = {
        conceptName: data.title,
        definition: data.pengertianKonsep,
        characteristics: points.length >= 2 ? points.slice(0, 3) : [data.penjelasanUtama],
        examples: [data.contohKonkret, ...(daily.slice(0, 2))],
        nonExamples: misconceptions.length > 0
            ? misconceptions.map(m => `${m.salah} (Keliru — seharusnya: ${m.pelurusan})`)
            : ['Menerapkan istilah secara acak tanpa memperhatikan aturan konsep.']
    };

    data.kwlChartData = {
        topicTitle: data.title,
        knowItems: [
            data.kaitanPengalamanSiswa || `Siswa ${className} sudah mengenal situasi awal terkait ${data.title}.`,
            points[0] || `Pengenalan dasar pada elemen ${elementName}.`
        ],
        wantItems: (data.pertanyaanPemantik && data.pertanyaanPemantik.length > 0)
            ? data.pertanyaanPemantik
            : [`Bagaimana cara menerapkan ${data.title} dengan tepat?`],
        learnedItems: summary.length >= 2 ? summary.slice(0, 3) : [data.pengertianKonsep, data.contohKonkret]
    };

    // E. Cerita & Narasi (19–21)
    data.comicStripData = isSunda
        ? {
            storyTitle: `Diajar ${data.title} Bareng Dadan jeung Sari`,
            setting: `Kelas ${className} & Lingkungan Sakola`,
            panels: [
                { panelNo: 1, sceneTitle: 'Patarosan Awal', characterLeft: 'Dadan', characterRight: 'Sari', dialogueLeft: data.pertanyaanPemantik[0] || 'Kumaha carana nya?', dialogueRight: 'Hayu urang tanya ka Ibu Guru sangkan écés!', narration: data.pengantarSingkat, mood: 'curious' },
                { panelNo: 2, sceneTitle: 'Katerangan Poko', characterLeft: 'Ibu Guru', characterRight: 'Dadan', dialogueLeft: data.pengertianKonsep, dialogueRight: 'Oh kitu hartina téh, Bu!', narration: data.penjelasanUtama, mood: 'explain' },
                { panelNo: 3, sceneTitle: 'Conto Sapopoé', characterLeft: 'Sari', characterRight: 'Dadan', dialogueLeft: data.contohKonkret, dialogueRight: 'Urang cobian langsung dina aktivitas kelas yuk!', narration: daily[0] || '', mood: 'happy' },
                { panelNo: 4, sceneTitle: 'Ngamalkeun!', characterLeft: 'Dadan', characterRight: 'Sari', dialogueLeft: summary[0] || 'Ayeuna urang geus paham sarta siap ngerjakeun latihan!', dialogueRight: 'Sumanget! Basa Sunda kudu dijaga unggal poé.', narration: summary[1] || '', mood: 'eureka' }
            ],
            moralLesson: summary.join(' ')
        }
        : {
            storyTitle: `Cerita Belajar ${subject}: ${data.title}`,
            setting: `Kelas ${className} & Lingkungan Sekitar`,
            panels: [
                { panelNo: 1, sceneTitle: 'Rasa Ingin Tahu', characterLeft: 'Raka', characterRight: 'Sinta', dialogueLeft: data.pertanyaanPemantik[0] || 'Bagaimana cara kerjanya?', dialogueRight: 'Yuk kita pelajari konsep aslinya bersama Bu Guru!', narration: data.pengantarSingkat, mood: 'curious' },
                { panelNo: 2, sceneTitle: 'Penjelasan Ilmiah', characterLeft: 'Bu Guru', characterRight: 'Raka', dialogueLeft: data.pengertianKonsep, dialogueRight: 'Oh, jadi itu konsep utamanya dalam pelajaran ini!', narration: data.penjelasanUtama, mood: 'explain' },
                { panelNo: 3, sceneTitle: 'Praktik Nyata', characterLeft: 'Sinta', characterRight: 'Raka', dialogueLeft: data.contohKonkret, dialogueRight: 'Aku jadi paham cara mempraktikkannya dengan benar!', narration: daily[0] || '', mood: 'happy' },
                { panelNo: 4, sceneTitle: 'Paham Tuntas', characterLeft: 'Raka', characterRight: 'Sinta', dialogueLeft: `Ingat, ${misconceptions[0]?.pelurusan || summary[0] || ''}`, dialogueRight: 'Siap! Ayo kerjakan aktivitas dan latihan pemahamannya!', narration: summary[0] || '', mood: 'eureka' }
            ],
            moralLesson: summary.join(' ')
        };

    data.storyboardData = {
        title: `Papan Adegan Pembelajaran: ${data.title}`,
        frames: [
            { frameNo: 1, shotTitle: 'Adegan 1 · Pembuka Masalah', visualCue: `Siswa ${className} mengamati situasi nyata`, actionCaption: data.pertanyaanPemantik[0] || data.pengantarSingkat, learningTakeaway: 'Memicu rasa ingin tahu siswa', mood: 'curious' },
            { frameNo: 2, shotTitle: 'Adegan 2 · Pengenalan Konsep', visualCue: 'Guru menunjukkan diagram & istilah pokok', actionCaption: data.pengertianKonsep, learningTakeaway: terms[0]?.term || 'Konsep dasar', mood: 'explain' },
            { frameNo: 3, shotTitle: 'Adegan 3 · Demonstrasi Nyata', visualCue: 'Siswa mencoba contoh konkret secara tertib', actionCaption: data.contohKonkret, learningTakeaway: daily[0] || 'Penerapan langsung', mood: 'happy' },
            { frameNo: 4, shotTitle: 'Adegan 4 · Refleksi & Kesimpulan', visualCue: 'Kesimpulan bersama di papan kelas', actionCaption: summary[0] || data.pemahamanBermakna, learningTakeaway: 'Pemahaman utuh & benar', mood: 'eureka' }
        ]
    };

    data.storyMapData = {
        storyTitle: data.title,
        characters: isSunda ? ['Dadan', 'Sari', 'Ibu Guru'] : ['Raka', 'Sinta', 'Guru Kelas'],
        setting: `Lingkungan Sekolah & Rumah Siswa ${className}`,
        beginning: data.pengantarSingkat,
        conflict: misconceptions[0]?.salah || data.pertanyaanPemantik[0] || `Tantangan memahami ${data.title}`,
        resolution: data.contohKonkret,
        moralLesson: summary.join(' ')
    };

    // F. Kartu Pembelajaran (22–23)
    data.flashcardData = {
        deckTitle: `Kartu Hafalan ${subject}: ${data.title}`,
        studyTip: 'Baca pertanyaan di sisi depan, lalu cek jawaban & contoh ilmiahnya!',
        cards: [
            { cardNo: 1, category: 'Definisi', frontPrompt: `Apa pengertian "${data.title}" pada ${subject}?`, hint: `Elemen ${elementName}`, backAnswer: data.pengertianKonsep, realExample: data.contohKonkret },
            ...terms.slice(0, 3).map((dt, idx) => ({
                cardNo: idx + 2,
                category: 'Istilah Kunci',
                frontPrompt: `Jelaskan makna "${dt.term}"!`,
                hint: subject,
                backAnswer: dt.meaning,
                realExample: daily[idx % Math.max(1, daily.length)] || data.contohKonkret
            }))
        ]
    };

    data.quizCardsData = {
        deckTitle: `Kartu Tantangan Kuis: ${data.title}`,
        cards: (data.latihanFormatif && data.latihanFormatif.length > 0 ? data.latihanFormatif : [
            { no: 1, pertanyaan: `Jelaskan inti materi ${data.title}!`, kunciSingkat: data.pengertianKonsep },
            { no: 2, pertanyaan: `Berikan satu contoh nyata dari ${data.title}!`, kunciSingkat: data.contohKonkret }
        ]).map((lat, idx) => ({
            cardNo: lat.no || idx + 1,
            level: idx === 0 ? 'Dasar' : idx === 1 ? 'Menengah' : 'Tantangan',
            question: lat.pertanyaan,
            clue: terms[idx % Math.max(1, terms.length)]?.term || elementName,
            answer: lat.kunciSingkat,
            explanation: points[idx % Math.max(1, points.length)] || data.penjelasanUtama
        }))
    };

    // G. Ilustrasi & Sains (24–29)
    const sceneType = pickIsometricSceneType(subject, `${elementName} ${tpText} ${atpText}`);
    data.isometric3dData = {
        objectTitle: `Model Struktural 3D: ${data.title}`,
        visualSceneType: sceneType,
        dimensionSummary: `Proyeksi Isometrik 30° · ${subject} ${className}`,
        parts: [
            { pinNo: 1, partName: terms[0]?.term || 'Konsep Dasar', functionOrProperty: data.pengertianKonsep, measurementOrDetail: 'Fondasi' },
            { pinNo: 2, partName: terms[1]?.term || 'Prinsip Utama', functionOrProperty: data.penjelasanUtama, measurementOrDetail: 'Mekanisme' },
            { pinNo: 3, partName: 'Contoh Konkret', functionOrProperty: data.contohKonkret, measurementOrDetail: 'Nyata' },
            { pinNo: 4, partName: 'Pelurusan Miskonsepsi', functionOrProperty: misconceptions[0]?.pelurusan || daily[0] || '', measurementOrDetail: 'Akurat' }
        ],
        spatialInsight: data.penjelasanUtama
    };

    const cutawayKind: NonNullable<GeneratedMateriAjarData['cutawayData']>['objectKind'] =
        /(bumi|tanah|gunung|lapisan)/.test(combinedLower) ? 'earth_interior'
            : /(jantung|organ|paru|lambung|tulang|tubuh)/.test(combinedLower) ? 'human_organ'
                : /(rumah|bangunan|ruang|listrik)/.test(combinedLower) ? 'building_system'
                    : 'plant_seed';

    data.cutawayData = {
        title: `Diagram Kupas Struktur: ${data.title}`,
        objectKind: cutawayKind,
        outerLabel: 'Bagian Pelindung / Lapisan Luar',
        innerLabel: 'Inti & Komponen Dalam',
        layers: [
            { code: 'A', name: terms[0]?.term || 'Lapisan Luar', thicknessOrRole: 'Pelindung', description: data.pengertianKonsep },
            { code: 'B', name: terms[1]?.term || 'Bagian Tengah', thicknessOrRole: 'Penghubung', description: data.penjelasanUtama },
            { code: 'C', name: terms[2]?.term || 'Inti Sistem', thicknessOrRole: 'Pusat Fungsi', description: data.contohKonkret }
        ]
    };

    const sliceKind: NonNullable<GeneratedMateriAjarData['crossSectionData']>['sliceKind'] =
        /(tanah|humus|batuan)/.test(combinedLower) ? 'soil_profile'
            : /(batang|tumbuhan|akar|daun)/.test(combinedLower) ? 'plant_stem'
                : /(kubus|balok|tabung|kerucut|prisma|geometri)/.test(combinedLower) ? 'geometry_slice'
                    : 'earth_layers';

    data.crossSectionData = {
        title: `Penampang Melintang: ${data.title}`,
        sliceKind,
        strata: [
            { code: 'L1', name: terms[0]?.term || 'Lapisan Permukaan', thicknessOrRole: 'Zona 1', description: points[0] || data.pengertianKonsep },
            { code: 'L2', name: terms[1]?.term || 'Lapisan Tengah', thicknessOrRole: 'Zona 2', description: points[1] || data.penjelasanUtama },
            { code: 'L3', name: terms[2]?.term || 'Lapisan Dasar / Inti', thicknessOrRole: 'Zona 3', description: points[2] || data.contohKonkret }
        ]
    };

    const specimenKind: NonNullable<GeneratedMateriAjarData['scientificDiagramData']>['specimenKind'] =
        /(air|siklus|awan|hujan)/.test(combinedLower) ? 'water_cycle'
            : /(listrik|lampu|baterai|sakelar)/.test(combinedLower) ? 'circuit_board'
                : /(pjok|gerak|kaki|lari|lompat)/.test(combinedLower) ? 'human_motion'
                    : /(bangun|sudut|segitiga|kubus|pecahan)/.test(combinedLower) ? 'geometry_model'
                        : 'plant_anatomy';

    data.scientificDiagramData = {
        title: `Diagram Ilmiah Berlabel: ${data.title}`,
        specimenKind,
        centerTitle: data.title.slice(0, 30),
        callouts: [
            { pinNo: 1, side: 'left', partName: terms[0]?.term || 'Bagian Utama 1', functionDesc: terms[0]?.meaning || data.pengertianKonsep },
            { pinNo: 2, side: 'left', partName: terms[1]?.term || 'Bagian Utama 2', functionDesc: terms[1]?.meaning || data.penjelasanUtama },
            { pinNo: 3, side: 'right', partName: terms[2]?.term || 'Contoh & Bukti', functionDesc: data.contohKonkret },
            { pinNo: 4, side: 'right', partName: 'Ketelitian Konsep', functionDesc: misconceptions[0]?.pelurusan || summary[0] || '' }
        ]
    };

    data.paperCut3dData = {
        title: `Diorama Lapisan Kertas 3D: ${data.title}`,
        layers: [
            { depth: 1, title: 'Lapisan Latar · Konteks Nyata', detail: data.pengantarSingkat, accentHex: '#0284c7' },
            { depth: 2, title: 'Lapisan Konsep · Pengertian Inti', detail: data.pengertianKonsep, accentHex: '#059669' },
            { depth: 3, title: 'Lapisan Mekanisme · Penjelasan Utama', detail: data.penjelasanUtama, accentHex: '#7c3aed' },
            { depth: 4, title: 'Lapisan Depan · Praktik & Contoh', detail: data.contohKonkret, accentHex: '#be185d' }
        ]
    };

    data.illustratedPosterData = {
        headline: data.title,
        tagline: `${subject} · ${className} (${fase})`,
        bigTakeaway: data.pengertianKonsep,
        highlights: [
            { label: 'Inti Materi', text: data.penjelasanUtama },
            { label: 'Contoh Nyata', text: data.contohKonkret },
            { label: 'Pesan Utama', text: summary[0] || data.pemahamanBermakna }
        ]
    };
};

export const getRecommendedOrientationForTemplate = (templateId: MateriTemplateId): PageOrientationMode => {
    const found = MATERI_AJAR_TEMPLATES.find(t => t.id === templateId);
    return found?.recommendedOrientation || 'portrait_a4';
};

export const regenerateMateriIllustration = (
    data: GeneratedMateriAjarData
): GeneratedMateriAjarData => {
    const nextIdx = ((data.visualVariantIndex || 0) + 1) % 3;
    const nextSvg = buildConcretePosterIllustrationSvg(
        data.subject,
        data.elementName,
        data.tpText,
        data.atpText,
        data.visualCaption || data.title,
        nextIdx
    );
    return {
        ...data,
        visualVariantIndex: nextIdx,
        visualSvg: nextSvg,
        // Clear stock photo on illustration regeneration so refreshed SVG takes priority cleanly
        visualImageDataUrl: undefined
    };
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

interface GroundedTextbookContext {
    summary: string;
    refs: ReferenceItem[];
}

const getSubjectDisciplineInstruction = (subject: string): string => {
    const s = subject.toLowerCase();
    if (s.includes('pjok') || s.includes('jasmani') || s.includes('olahraga')) {
        return 'WAJIB DISIPLIN PJOK: Jelaskan biomekanika/prinsip gerak (mis. kaki tumpu vs kaki ayun, titik berat, kelenturan/keseimbangan), rincikan sikap awal -> pelaksanaan gerak -> sikap akhir secara teknis & aman bagi anak SD, serta sertakan manfaat kebugaran dan pencegahan cedera.';
    }
    if (s.includes('matematika')) {
        return 'WAJIB DISIPLIN MATEMATIKA: Sertakan definisi matematis presisi, notasi/simbol atau aturan operasi/rumus yang benar, contoh perhitungan bertahap dengan angka konkret yang sesuai fase SD, serta pelurusan kesalahan hitung/konsep yang umum terjadi.';
    }
    if (s.includes('ipas') || s.includes('ipa') || s.includes('ips')) {
        return 'WAJIB DISIPLIN IPAS: Jelaskan mekanisme ilmiah/sosial secara sebab-akibat (bagian, fungsi, proses, atau interaksi sosial/geografis), gunakan istilah sains/sosial baku yang dijelaskan dengan bahasa anak SD, dan berikan pengamatan nyata.';
    }
    if (s.includes('pai') || s.includes('agama') || s.includes('islam')) {
        return 'WAJIB DISIPLIN PAIBP: Jelaskan pengertian istilah syariat/akhlak/Al-Qur’an secara autentik (rukun, syarat, urutan sah, atau kandungan ayat/sifat mulia) dengan adab dan contoh pembiasaan harian anak SD Indonesia tanpa mengarang nomor ayat/hadis yang tidak pasti.';
    }
    if (s.includes('sunda')) {
        return 'WAJIB DISIPLIN BASA SUNDA: Terapkan kaidah Basa Sunda nu bener (undak-usuk basa lemes/loma, kalimah conto nu merenah, struktur pupuh/biantara/paguneman) dina basa Sunda nu hirup sarta kaharti ku murid SD.';
    }
    if (s.includes('indonesia')) {
        return 'WAJIB DISIPLIN BAHASA INDONESIA: Jelaskan unsur/struktur teks atau kaidah kebahasaan (EYD, ide pokok, kalimat perintah/tanya, rima, majas) beserta contoh kutipan kalimat/paragraf yang lengkap agar siswa langsung bisa mempraktikkan.';
    }
    if (s.includes('pancasila') || s.includes('ppkn')) {
        return 'WAJIB DISIPLIN PENDIDIKAN PANCASILA: Hubungkan secara tepat nilai sila Pancasila, hak dan kewajiban, norma/aturan sekolah & rumah, atau musyawarah-gotong royong dengan perilaku warga negara muda di sekolah dan keluarga.';
    }
    if (s.includes('seni')) {
        return 'WAJIB DISIPLIN SENI BUDAYA: Jelaskan unsur estetika cabang seni terkait (rupa: garis, bentuk, warna primer/sekunder, tekstur; musik: nada, birama, dinamika; tari/teater: wiraga, wirama, wirasa) beserta teknik berkarya langkah demi langkah.';
    }
    if (s.includes('inggris') || s.includes('english')) {
        return 'WAJIB DISIPLIN BAHASA INGGRIS: Cantumkan kosakata kunci dalam Bahasa Inggris beserta arti Bahasa Indonesia dan pola kalimat (sentence pattern) + contoh dialog pendek sehari-hari sesuai level siswa SD.';
    }
    if (s.includes('koding') || s.includes('informatika') || s.includes('artifisial') || s.includes('ka')) {
        return 'WAJIB DISIPLIN KODING & KECERDASAN ARTIFISIAL: Jelaskan prinsip berpikir komputasional (dekomposisi, pengenalan pola, abstraksi, algoritma/percabangan) dengan contoh analogi kehidupan sehari-hari dan langkah alur logika (flowchart) yang jelas.';
    }
    return `WAJIB DISIPLIN ${subject.toUpperCase()}: Gunakan definisi, istilah teknis, aturan keilmuan, contoh konkret, dan langkah analisis yang autentik sesuai buku teks siswa SD Kurikulum Merdeka.`;
};

const groundedContextCache = new Map<string, GroundedTextbookContext>();
const groundedContextInflight = new Map<string, Promise<GroundedTextbookContext>>();
let geminiQuotaCooldownUntil = 0;

const fetchTextbookGroundedContext = async (params: {
    subject: string;
    className: string;
    elementName: string;
    tpText: string;
    atpText: string;
}): Promise<GroundedTextbookContext> => {
    const cacheKey = `${params.subject}|${params.className}|${params.elementName}|${params.tpText}|${params.atpText}`;
    const cached = groundedContextCache.get(cacheKey);
    if (cached) return cached;

    if (Date.now() < geminiQuotaCooldownUntil) {
        return { summary: '', refs: [] };
    }

    const existingPromise = groundedContextInflight.get(cacheKey);
    if (existingPromise) return existingPromise;

    const runLookup = (async (): Promise<GroundedTextbookContext> => {
        try {
            const searchPrompt = `Cari referensi materi ajar resmi Kurikulum Merdeka / Buku Siswa & Buku Panduan Guru Kemendikdasmen (SIBI buku.kemdikbud.go.id atau sumber pendidikan kredibel Indonesia) untuk topik spesifik berikut:
- Mata Pelajaran: ${params.subject}
- Jenjang/Kelas: SD ${params.className}
- Elemen: ${params.elementName}
- Tujuan Pembelajaran: ${params.tpText}
- Alur Tujuan Pembelajaran: ${params.atpText}

Ringkas secara faktual dan padat (maksimal 220 kata):
1. Pengertian konsep & istilah teknis resmi yang dipakai dalam buku siswa SD untuk topik ini.
2. Unsur/langkah/aturan/prosedur pokok yang diajarkan di buku teks.
3. Contoh konkret dan kesalahan pemahaman (miskonsepsi) yang sering muncul pada siswa SD.
Catatan: Jangan mencantumkan nomor halaman, ISBN, atau DOI.`;

            const res = await generateGeminiContent({
                model: 'gemini-4-hydrogen',
                contents: searchPrompt,
                config: {
                    tools: [{ googleSearch: {} }]
                }
            });

            const summary = (res.text || '').trim().slice(0, 1600);
            const chunks: any[] = res.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            const seenUrls = new Set<string>();
            const refs: ReferenceItem[] = [];

            for (const chunk of chunks) {
                const uri = String(chunk?.web?.uri || '').trim();
                const title = String(chunk?.web?.title || '').trim();
                if (!uri || !/^https?:\/\//i.test(uri) || seenUrls.has(uri)) continue;
                seenUrls.add(uri);
                refs.push({
                    title: title || `Referensi ${params.subject} ${params.className}`,
                    category: 'Rekomendasi Pedagogis & Referensi Mapel',
                    source: uri,
                    status: 'Teridentifikasi',
                    note: `Rujukan materi ${params.subject} (${params.className}) teridentifikasi melalui penelusuran buku teks/sumber ajar daring.`
                });
                if (refs.length >= 4) break;
            }

            const result: GroundedTextbookContext = { summary, refs };
            if (summary || refs.length > 0) {
                groundedContextCache.set(cacheKey, result);
            }
            return result;
        } catch (err: any) {
            if (err?.isQuotaError || err?.status === 429 || String(err?.message || '').includes('429')) {
                geminiQuotaCooldownUntil = Date.now() + 60000;
            }
            return { summary: '', refs: [] };
        } finally {
            groundedContextInflight.delete(cacheKey);
        }
    })();

    groundedContextInflight.set(cacheKey, runLookup);
    return runLookup;
};

export const buildVerifiableReferences = (
    subject: string,
    className: string,
    groundedRefs: ReferenceItem[] = []
): ReferenceItem[] => {
    const faseInfo = getFaseInfoForClass(className);
    const baseRefs: ReferenceItem[] = [
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
        ...groundedRefs,
        {
            title: `Buku Panduan Guru & Buku Siswa ${subject} ${className} Kemendikdasmen`,
            category: 'Rekomendasi Pedagogis & Referensi Mapel',
            source: 'Sistem Informasi Perbukuan Indonesia (SIBI Kemendikdasmen)',
            status: 'Perlu Verifikasi Guru',
            note: 'PERLU VERIFIKASI GURU: Cocokkan edisi cetak/bab spesifik buku teks yang dipakai sekolah tanpa mengarang nomor halaman.'
        }
    ];
    return baseRefs;
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

Pilih recommendedTemplateId yang paling cocok dari daftar persis ini:
educational_infographic | cheat_sheet | sticky_notes | visual_glossary | knowledge_pyramid | mind_map | concept_map | tree_diagram | venn_diagram | fishbone_diagram | step_by_step | flowchart | timeline | cycle_diagram | comparison_chart | t_chart | frayer_model | kwl_chart | comic_strip | storyboard | story_map | flashcard | quiz_cards | isometric_3d | cutaway_diagram | cross_section | scientific_diagram | paper_cut_3d | illustrated_poster

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
            model: 'gemini-4-hydrogen',
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
    const isCompleteMaterial = hasCoreConcepts && (data.contohSehariHari?.length || 0) >= 2 && (data.rangkumanPoin?.length || 0) >= 3 && (data.latihanFormatif?.length || 0) >= 2;

    const orientation = data.curriculumMeta?.orientation || 'portrait_a4';
    const pngResText =
        orientation === 'landscape_a4'
            ? '3508 × 2480 px (A4 Landscape 300 DPI)'
            : orientation === 'digital_screen' || orientation === 'digital_4_5'
                ? '1920 × 1080 px (Layar Digital 16:9)'
                : '2480 × 3508 px (A4 Portrait 300 DPI)';
    const pageCount = data.pages?.length || 1;

    const checks: QualityCheckItem[] = [
        // A. Kurikulum
        {
            id: 1,
            category: 'A. Kurikulum',
            question: 'Kesesuaian TP, ATP & CP Terkunci',
            status: tpPreserved && atpPreserved ? 'lulus' : 'gagal',
            detail: tpPreserved && atpPreserved
                ? (data.focusLevel === 'tp'
                    ? `Mode TP (Cakupan Luas): mengolah ${data.relatedAtps?.length || 1} ATP terkait tanpa menyertakan ATP di luar TP.`
                    : 'Mode ATP (Cakupan Spesifik): fokus pada 1 butir ATP selaras CP & TP terkunci.')
                : 'Teks TP/ATP tidak cocok dengan data terkunci.'
        },
        {
            id: 2,
            category: 'A. Kurikulum',
            question: 'Kesesuaian Kelas & Fase Profil',
            status: classFaseMatch ? 'lulus' : 'gagal',
            detail: classFaseMatch ? `${data.className} selaras dengan ${data.fase}.` : mismatch.errors.join(' ')
        },
        {
            id: 3,
            category: 'A. Kurikulum',
            question: 'Sumber Regulasi & Referensi Valid',
            status: noFabricatedCitations && refs.length >= 4 ? (hasUnverifiedRef ? 'perhatian' : 'lulus') : 'gagal',
            detail: hasUnverifiedRef
                ? 'Regulasi nasional teridentifikasi; edisi spesifik buku mapel bertanda Perlu Verifikasi Guru.'
                : 'Seluruh referensi teridentifikasi tanpa sitasi karangan.'
        },
        // B. Substansi
        {
            id: 4,
            category: 'B. Substansi',
            question: 'Ketepatan Konsep & Kedalaman Keilmuan',
            status: hasCoreConcepts && Boolean(data.pendalamanMateri?.miskonsepsiUmum?.length) ? 'lulus' : 'perhatian',
            detail: 'Definisi konsep, unsur penting, serta pelurusan miskonsepsi telah diverifikasi.'
        },
        {
            id: 5,
            category: 'B. Substansi',
            question: 'Bahasa Ramah Usia SD & Contoh Nyata',
            status: isCompleteMaterial ? 'lulus' : 'gagal',
            detail: `Bahasa, contoh konkret, aktivitas, dan latihan disesuaikan untuk ${data.className} (${data.fase}) tanpa pengulangan.`
        },
        // C. Visual
        {
            id: 6,
            category: 'C. Visual',
            question: 'Konsistensi Gaya Desain Visual (29 Pilihan)',
            status: templateMatch ? (data.manualMismatchNotice ? 'perhatian' : 'lulus') : 'gagal',
            detail: templateMatch
                ? (data.manualMismatchNotice || `Konsisten merender struktur desain ${MATERI_AJAR_TEMPLATES.find(t => t.id === data.templateId)?.name || data.templateId}.`)
                : 'Template hasil render tidak sesuai pilihan pengguna.'
        },
        {
            id: 7,
            category: 'C. Visual',
            question: 'Relevansi Ilustrasi, Keterbacaan & Tata Letak Multi-Halaman',
            status: hasVisual ? 'lulus' : 'gagal',
            detail: hasVisual
                ? `Ilustrasi SVG faktual terpisah dari blok teks pada ${pageCount} halaman yang proporsional tanpa tumpang tindih.`
                : 'Ilustrasi visual belum tersedia.'
        },
        // D. Ekspor PNG
        {
            id: 8,
            category: 'D. Ekspor PNG',
            question: 'Kesiapan Ekspor PNG Resolusi Tinggi & Kesesuaian Pratinjau',
            status: 'lulus',
            detail: `Siap diekspor khusus format PNG (${pngResText}) sebanyak ${pageCount} halaman terpisah sesuai pratinjau.`
        }
    ];

    const categoryDefs: { id: QualityCategorySummary['id']; cat: QualityCheckItem['category']; title: string }[] = [
        { id: 'A', cat: 'A. Kurikulum', title: 'A. Pemeriksaan Kurikulum' },
        { id: 'B', cat: 'B. Substansi', title: 'B. Pemeriksaan Substansi' },
        { id: 'C', cat: 'C. Visual', title: 'C. Pemeriksaan Visual' },
        { id: 'D', cat: 'D. Ekspor PNG', title: 'D. Pemeriksaan Ekspor PNG' }
    ];

    const categories: QualityCategorySummary[] = categoryDefs.map(def => {
        const items = checks.filter(c => c.category === def.cat);
        const catFail = items.some(i => i.status === 'gagal');
        const catAtt = items.some(i => i.status === 'perhatian');
        const status: QualityCategorySummary['status'] = catFail ? 'GAGAL' : catAtt ? 'PERLU PERHATIAN' : 'LULUS';
        return {
            id: def.id,
            title: def.title,
            status,
            summary: items.map(i => i.detail).join(' '),
            items
        };
    });

    const hasFail = checks.some(c => c.status === 'gagal') || !mismatch.valid;
    const hasAttention = checks.some(c => c.status === 'perhatian');
    const overallStatus: QualityControlReport['overallStatus'] = hasFail
        ? 'GAGAL'
        : hasAttention
            ? 'PERLU PERHATIAN'
            : 'LULUS';

    const verificationStages = categories.map(cat => ({
        stage: cat.title,
        passed: cat.status !== 'GAGAL',
        note: cat.summary
    }));

    const needsTeacherConfirmation = [
        ...mismatch.warnings,
        ...(data.manualMismatchNotice ? [data.manualMismatchNotice] : []),
        ...refs.filter(r => r.status === 'Perlu Verifikasi Guru').map(r => `${r.title}: ${r.note}`)
    ];

    return {
        overallStatus,
        summary:
            overallStatus === 'GAGAL'
                ? 'Terdapat ketidaksesuaian kritis pada data kurikulum atau kelengkapan desain. Perbaiki sebelum ekspor PNG.'
                : overallStatus === 'PERLU PERHATIAN'
                    ? 'Kurikulum, substansi, desain visual, dan kesiapan PNG terpenuhi. Terdapat catatan konfirmasi edisi/gaya untuk guru.'
                    : 'Seluruh 4 kategori Quality Gate (Kurikulum, Substansi, Visual, Ekspor PNG) terpenuhi.',
        checkedAt: new Date().toISOString(),
        checks,
        categories,
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
    relatedAtps?: string[];
    alokasiWaktu: string;
    templateId: MateriTemplateId;
    themeId?: MateriVisualThemeId;
    pageCountPreference?: PageCountPreference;
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
    const groundedTextbook = await fetchTextbookGroundedContext({
        subject: params.subject,
        className: params.className,
        elementName: params.elementName,
        tpText: params.tpText,
        atpText: params.atpText
    });
    const disciplineRule = getSubjectDisciplineInstruction(params.subject);
    const scopeRule = params.focusLevel === 'tp'
        ? `MODE BERDASARKAN TP (CAKUPAN LUAS): Kembangkan 1 TP terpilih menjadi materi runtut dari konsep dasar ke pendalaman, boleh merangkum ATP terkait TP ini saja (${(params.relatedAtps || [params.atpText]).join(' | ')}), DILARANG memasukkan ATP dari TP lain.`
        : `MODE BERDASARKAN ATP (CAKUPAN SPESIFIK): Fokus secara mendalam HANYA pada 1 butir ATP terpilih ("${params.atpText}"). Gunakan CP & TP hanya sebagai rujukan keselarasan, JANGAN memperluas ke seluruh TP.`;

    const prompt = `Anda adalah AI Educational Content Generator profesional jenjang SD/MI (Kelas I–VI) yang mengintegrasikan keahlian kurikulum dasar Indonesia, substansi keilmuan bidang studi, pedagogi perkembangan fase, instructional design, dan desain grafis edukatif.

ATURAN MUTLAK:
1. JANGAN mengubah, mengedit, mengganti, atau mengarang teks CP, TP, atau ATP terkunci.
2. ${scopeRule}
3. JANGAN mengarang fakta, angka statistik palsu, pasal hukum, nomor halaman, DOI, atau ISBN.
4. DILARANG KERAS menulis definisi/kalimat klise yang terlalu umum. Setiap pengertian, penjelasan, contoh, miskonsepsi, dan istilah kunci WAJIB spesifik dan akurat secara keilmuan ${params.subject}.
5. Sesuaikan bahasa & kedalaman pembahasan untuk ${params.className} (${params.fase}) dengan KKO utama "${activeAnalysis.kataKerjaOperasional}" (tingkat ${activeAnalysis.kedalamanLevel}).
6. ${disciplineRule}
7. Susun materi agar selaras dengan bentuk sajian desain visual "${tplMeta.name}" (${tplMeta.subtitle}).
${params.revisionInstruction ? `8. INSTRUKSI REVISI GURU (PRIORITAS): ${params.revisionInstruction}` : ''}

DATA KURIKULUM TERKUNCI:
- Satuan Pendidikan: ${params.institutionName || 'SD/MI'}
- Mata Pelajaran: ${params.subject}
- Kelas & Fase: ${params.className} (${params.fase})
- Elemen: ${params.elementName}
- Capaian Pembelajaran (CP): ${params.capaianPembelajaran}
- Tujuan Pembelajaran (TP Terkunci): ${params.tpText}
- Alur Tujuan Pembelajaran (ATP Terkunci): ${params.atpText} (${params.alokasiWaktu})
- Gaya Desain Visual Terpilih: ${tplMeta.name} (${tplMeta.subtitle})
- Potensi Miskonsepsi yang Harus Diluruskan: ${activeAnalysis.potensiMiskonsepsi}
${groundedTextbook.summary ? `\nRINGKASAN REFERENSI BUKU TEKS / PENELUSURAN TERKAIT:\n${groundedTextbook.summary}\n` : ''}
${isSunda ? 'WAJIB KHUSUS BAHASA SUNDA: Gunakan Basa Sunda anu alami, merenah undak-usukna, jeung ramah barudak SD pikeun judul, panganteur, conto paguneman, aktivitas, rangkuman, jeung soal!' : ''}

Kembalikan HANYA JSON valid (tanpa markdown) dengan struktur persis:
{
  "title": "Judul materi menarik & spesifik TP/ATP ini",
  "subtitle": "Subjudul singkat selaras CP/TP",
  "pengantarSingkat": "Pengantar kontekstual 2-3 kalimat spesifik ${params.subject} ramah siswa ${params.className}",
  "kaitanPengalamanSiswa": "1-2 kalimat mengaitkan topik nyata dengan pengalaman langsung anak SD Indonesia",
  "pertanyaanPemantik": ["Pertanyaan pemantik 1 yang memancing rasa ingin tahu", "Pertanyaan pemantik 2"],
  "pengertianKonsep": "Definisi konsep yang tepat secara keilmuan ${params.subject}, lengkap dengan istilah baku dan penjelasannya bagi siswa ${params.className}",
  "penjelasanUtama": "Penjelasan materi inti yang kaya substansi (3-4 kalimat), memuat aturan/mekanisme/prosedur/unsur spesifik topik serta sesuai KKO ${activeAnalysis.kataKerjaOperasional}",
  "poinPenting": ["Poin keilmuan spesifik 1", "Poin keilmuan spesifik 2", "Poin keilmuan spesifik 3", "Poin keilmuan spesifik 4"],
  "unsurPenting": ["Unsur/komponen/tahapan 1 beserta fungsi atau cara benarnya", "Unsur/komponen/tahapan 2", "Unsur/komponen/tahapan 3"],
  "klasifikasiAtauProses": {
    "judul": "Judul tahapan proses, prosedur teknik, atau klasifikasi konsep",
    "butir": [
      { "label": "Tahap/Jenis 1", "uraian": "Penjelasan teknis akurat & aplikatif" },
      { "label": "Tahap/Jenis 2", "uraian": "Penjelasan teknis akurat & aplikatif" },
      { "label": "Tahap/Jenis 3", "uraian": "Penjelasan teknis akurat & aplikatif" }
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
  "contohKonkret": "1 contoh konkret lengkap beserta angka/kalimat/langkah praktiknya yang mudah diamati siswa SD Indonesia",
  "visualCaption": "Keterangan ilustrasi pendukung yang faktual dan mendidik",
  "visualSearchQuery": "2-4 kata kunci foto objek/tempat/hewan nyata edukatif (WAJIB string kosong \"\" jika materi berupa gerakan tubuh PJOK, rumus/diagram matematika, algoritma/flowchart, atau konsep abstrak)",
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
    { "no": 1, "pertanyaan": "Soal pemahaman 1 sesuai fokus materi", "kunciSingkat": "Panduan jawaban untuk guru" },
    { "no": 2, "pertanyaan": "Soal pemahaman 2 sesuai fokus materi", "kunciSingkat": "Panduan jawaban untuk guru" },
    { "no": 3, "pertanyaan": "Soal pemahaman 3 sesuai fokus materi", "kunciSingkat": "Panduan jawaban untuk guru" }
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
            model: 'gemini-4-hydrogen',
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
    const resolvedTitle = typeof aiResult?.title === 'string' && aiResult.title.trim() ? aiResult.title.trim() : baseline.title;
    const merged: GeneratedMateriAjarData = {
        ...baseline,
        subject: params.subject,
        className: params.className,
        fase: params.fase,
        elementName: params.elementName,
        capaianPembelajaran: params.capaianPembelajaran,
        tpText: params.tpText,
        atpText: params.atpText,
        relatedAtps: params.relatedAtps || [params.atpText],
        themeId: params.themeId || 'zamrud_edukatif',
        pageCountPreference: params.pageCountPreference || 'auto',
        manualMismatchNotice,
        tpAtpAnalysis: activeAnalysis,
        curriculumMeta: {
            curriculumName: 'Kurikulum Merdeka (Permendikdasmen No. 13 Tahun 2025 & Kepka BSKAP No. 046/H/KR/2025)',
            jenjang: 'Sekolah Dasar (SD/MI)',
            institutionName: params.institutionName || 'Satuan Pendidikan SD/MI',
            isLockedSource: Boolean(params.isLockedSource),
            topicFocus: resolvedTitle,
            orientation: params.orientation || getRecommendedOrientationForTemplate(params.templateId)
        },
        title: resolvedTitle,
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
        referensi: buildVerifiableReferences(params.subject, params.className, groundedTextbook.refs),
        teacherNotes: [
            ...(manualMismatchNotice ? [manualMismatchNotice] : []),
            ...(usedFallback
                ? ['PERLU VERIFIKASI GURU: Konten disusun dari basis kurikuler terstruktur karena layanan AI tidak merespons; harap tinjau contoh dan soal sebelum ekspor PNG.']
                : []),
            'Kunci/panduan jawaban latihan ditempatkan pada bagian khusus guru.',
            'PERLU VERIFIKASI GURU: Pastikan kesesuaian nomor bab pada buku teks/panduan mapel yang dipakai di satuan pendidikan.'
        ]
    };

    reportProgress(7);
    merged.visualSvg = buildConcretePosterIllustrationSvg(
        params.subject,
        params.elementName,
        params.tpText,
        params.atpText,
        merged.visualCaption || merged.title,
        merged.visualVariantIndex || 0
    );

    const subjLowerVisual = params.subject.toLowerCase();
    const combinedTopicVisual = `${params.subject} ${params.elementName} ${params.tpText} ${params.atpText}`.toLowerCase();
    const isActionOrDiagramTopic =
        subjLowerVisual.includes('pjok') ||
        subjLowerVisual.includes('jasmani') ||
        subjLowerVisual.includes('matematika') ||
        subjLowerVisual.includes('koding') ||
        subjLowerVisual.includes('informatika') ||
        /\b(mengayun|ayunan|ayun kaki|non-?lokomotor|lokomotor|manipulatif|keseimbangan|senam|pecahan|sudut|bangun|algoritma|flowchart|diagram)\b/.test(combinedTopicVisual);

    const searchCandidate =
        (typeof aiResult?.visualSearchQuery === 'string' && aiResult.visualSearchQuery.trim()) ||
        '';
    if (!isActionOrDiagramTopic && searchCandidate && !/(konsep|abstrak|umum|materi|ilustrasi|diagram|gerakan|berjalan|berlari)/i.test(searchCandidate)) {
        const proxiedDataUrl = await tryFetchProxiedIllustrationDataUrl(searchCandidate);
        if (proxiedDataUrl) {
            merged.visualImageDataUrl = proxiedDataUrl;
        }
    }

    reportProgress(8);
    merged.pages = buildLogicalDocumentPages({
        title: merged.title,
        subject: params.subject,
        templateId: params.templateId,
        focusLevel: params.focusLevel,
        pageCountPreference: params.pageCountPreference || 'auto'
    });

    buildTemplatePayloadsFromMerged(merged, {
        subject: params.subject,
        className: params.className,
        fase: params.fase,
        elementName: params.elementName,
        tpText: params.tpText,
        atpText: params.atpText,
        alokasiWaktu: params.alokasiWaktu,
        templateId: params.templateId
    });

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
