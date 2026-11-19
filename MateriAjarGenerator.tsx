import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    BookOpen, CheckCircle2, ChevronRight, Download, FolderOpen,
    GitBranch, Layers, LayoutGrid, Loader2, Lock, Printer,
    Sparkles, Trash2, Unlock, Compass, Box, Clock, MessageSquare,
    StickyNote, Table2, ListChecks, Zap, GraduationCap, Image as ImageIcon
} from 'lucide-react';
import { CurriculumData, isSameClass, isSameSubject } from './curriculumHelper';
import {
    MATERI_AJAR_TEMPLATES,
    MateriTemplateId,
    HierarchyFocusLevel,
    GeneratedMateriAjarData,
    buildMateriAjarHierarchy,
    recommendTemplateForFocus,
    generateMateriAjarContent,
    getMateriAjarArchiveKey
} from './materiAjarHelper';
import { MateriAjarTemplateRenderer, PosterIllustrationFrame } from './MateriAjarTemplateRenderers';
import { exportMateriAjarToPdf, exportMateriAjarPosterPng } from './materiAjarPdfExporter';

export interface MateriAjarUserIdentity {
    authorName: string;
    nip?: string;
    institutionName: string;
    npsn?: string;
    kepalaSekolah?: string;
    nipKepalaSekolah?: string;
    location?: string;
    city?: string;
    assignedClass?: string;
    semester?: string;
    academicYear?: string;
    [key: string]: any;
}

interface MateriAjarGeneratorProps {
    user: any;
    userIdentity: MateriAjarUserIdentity;
    selectedClass: string;
    selectedSubject: string;
    availableSubjects: string[];
    activities: any[];
    lockedProtas: Record<string, boolean>;
    currentProtaData: CurriculumData | null;
    onNavigate: (view: any) => void;
    onClassChange?: (cls: string) => void;
    onSubjectChange?: (subj: string) => void;
    notify: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const TEMPLATE_ICONS: Record<MateriTemplateId, React.ReactNode> = {
    educational_infographic: <LayoutGrid className="w-4 h-4" />,
    cheat_sheet: <Zap className="w-4 h-4" />,
    sticky_notes: <StickyNote className="w-4 h-4" />,
    mind_map: <GitBranch className="w-4 h-4" />,
    comic_strip: <MessageSquare className="w-4 h-4" />,
    flashcard: <BookOpen className="w-4 h-4" />,
    step_by_step: <ListChecks className="w-4 h-4" />,
    timeline: <Clock className="w-4 h-4" />,
    comparison_chart: <Table2 className="w-4 h-4" />,
    isometric_3d: <Box className="w-4 h-4" />
};

const formatIndonesianDate = (date = new Date()): string => {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

interface PpaDocumentSheetProps {
    data: GeneratedMateriAjarData;
    identity: MateriAjarUserIdentity;
    isPrintMode: boolean;
}

const PpaDocumentSheet: React.FC<PpaDocumentSheetProps> = ({ data, identity, isPrintMode }) => {
    const tplMeta = MATERI_AJAR_TEMPLATES.find(t => t.id === data.templateId) || MATERI_AJAR_TEMPLATES[0];
    const accentHex = tplMeta.accentHex || '#0f766e';
    const cityName = identity.location || identity.city || 'Sukatinggal';
    const todayStr = formatIndonesianDate();

    const introText =
        data.pengantarSingkat ||
        data.pemahamanBermakna ||
        data.ringkasanKonsepInti ||
        `Mari kita pelajari materi ${data.title} dengan bahasa sederhana dan contoh nyata sehari-hari.`;

    const conceptDefinition =
        data.pengertianKonsep ||
        data.ringkasanKonsepInti ||
        `${data.title} merupakan kompetensi inti pada mata pelajaran ${data.subject} (${data.elementName}).`;

    const mainExplanation =
        data.penjelasanUtama ||
        data.ringkasanKonsepInti ||
        `Peserta didik memahami konsep utama secara runtut sesuai ${data.className} dan menerapkannya dengan tepat.`;

    const keyPoints = (data.poinPenting && data.poinPenting.length > 0)
        ? data.poinPenting
        : (data.kataKunci || []).map(k => `${k.term}: ${k.meaning}`);

    const concreteExample =
        data.contohKonkret ||
        (data.contohSehariHari && data.contohSehariHari[0]) ||
        `Contoh konkret penerapan ${data.title} di kelas dan rumah.`;

    const dailyExamples = (data.contohSehariHari && data.contohSehariHari.length > 0)
        ? data.contohSehariHari
        : [concreteExample];

    const studentActivity = data.aktivitasSederhana || {
        judul: `Praktik Sederhana: ${data.title}`,
        langkah: (data.aktivitasPembelajaran || []).map(a => `${a.tahap}: ${a.kegiatan}`),
        hasilDiharapkan: `Siswa mampu menunjukkan pemahaman ${data.title} secara mandiri.`
    };

    const summaryPoints = (data.rangkumanPoin && data.rangkumanPoin.length >= 3)
        ? data.rangkumanPoin.slice(0, 5)
        : [
            ...(keyPoints.slice(0, 3)),
            data.pemahamanBermakna || `Terapkan nilai dan konsep ${data.title} dalam kehidupan sehari-hari.`
        ].slice(0, 5);

    const practiceQuestions = (data.latihanFormatif || []).slice(0, 3);
    const activeTpDisplay = data.focusLevel === 'atp' && data.atpText
        ? `${data.tpText} (Fokus Alur: ${data.atpText})`
        : data.tpText;

    return (
        <div
            className="rounded-3xl border-2 bg-white p-4 sm:p-5 space-y-3.5 text-slate-900"
            style={{ borderColor: accentHex }}
        >
            {/* A. HEADER POSTER INFOGRAFIS */}
            <div
                data-pdf-block="true"
                className="rounded-2xl overflow-hidden border border-slate-200 bg-white"
            >
                <div
                    className="px-5 py-4 text-white space-y-2.5"
                    style={{ backgroundColor: accentHex }}
                >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-white/90">
                        <span>{data.subject} · {data.className} ({data.fase})</span>
                        <span>Infografis Materi Ajar · {tplMeta.name}</span>
                    </div>

                    <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
                            {data.title}
                        </h2>
                        {data.subtitle && (
                            <p className="text-xs text-white/90 mt-0.5 leading-snug">{data.subtitle}</p>
                        )}
                    </div>

                    <div className="rounded-xl bg-white/15 border border-white/25 px-3.5 py-2.5 text-xs">
                        <div className="text-[10.5px] font-bold uppercase tracking-wide text-white/85">
                            Tujuan Pembelajaran (TP / ATP)
                        </div>
                        <p className="text-white font-medium leading-relaxed mt-0.5">
                            {activeTpDisplay}
                        </p>
                    </div>
                </div>

                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] text-slate-600">
                    <span>
                        <strong className="text-slate-900">{identity.institutionName || 'SD Negeri'}</strong>
                        {identity.npsn ? ` · NPSN ${identity.npsn}` : ''}
                    </span>
                    <span>
                        Elemen: <strong className="text-slate-900">{data.elementName}</strong>
                    </span>
                    <span className="tabular-nums">
                        {identity.authorName || 'Guru Kelas'} · TA {data.academicYear} (Smt {data.semester}) · {data.alokasiWaktu || '3 JP'}
                    </span>
                </div>
            </div>

            {/* B. PENGANTAR MATERI */}
            <div data-pdf-block="true" className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-teal-700 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">B1</span>
                        <h3 className="text-xs font-extrabold text-teal-950 uppercase tracking-wide">Pengantar Materi</h3>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed">{introText}</p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-600 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">B2</span>
                        <h3 className="text-xs font-extrabold text-amber-950 uppercase tracking-wide">Pertanyaan Pemantik</h3>
                    </div>
                    <ul className="space-y-1">
                        {(data.pertanyaanPemantik || []).slice(0, 3).map((q, idx) => (
                            <li key={idx} className="text-xs text-slate-800 leading-snug flex items-start gap-1.5">
                                <span className="font-extrabold text-amber-700 shrink-0 tabular-nums">{idx + 1}.</span>
                                <span>{q}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* C. INTI MATERI (KONSEP, PENJELASAN, POIN PENTING, CONTOH KONKRET & ILUSTRASI PENDUKUNG) */}
            <div data-pdf-block="true" className="rounded-2xl border border-sky-200 bg-sky-50/40 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-sky-200/80">
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-sky-700 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">C</span>
                        <h3 className="text-xs font-extrabold text-sky-950 uppercase tracking-wide">Inti Materi &amp; Visualisasi Konsep</h3>
                    </div>
                    <span className="text-[11px] font-semibold text-sky-800">
                        CP: {data.capaianPembelajaran.length > 90 ? `${data.capaianPembelajaran.slice(0, 88)}…` : data.capaianPembelajaran}
                    </span>
                </div>

                {/* Pengertian Konsep & Penjelasan Utama */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white border border-sky-200 rounded-xl p-3 space-y-1">
                        <div className="text-[11px] font-extrabold text-sky-800 uppercase">Pengertian Konsep</div>
                        <p className="text-xs text-slate-800 leading-relaxed">{conceptDefinition}</p>
                    </div>
                    <div className="bg-white border border-sky-200 rounded-xl p-3 space-y-1">
                        <div className="text-[11px] font-extrabold text-sky-800 uppercase">Penjelasan Materi Utama</div>
                        <p className="text-xs text-slate-800 leading-relaxed">{mainExplanation}</p>
                    </div>
                </div>

                {/* Poin Penting & Contoh Konkret */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1.5">
                        <div className="text-[11px] font-extrabold text-slate-800 uppercase">Poin-Poin Penting</div>
                        <ul className="space-y-1">
                            {keyPoints.slice(0, 4).map((pt, idx) => (
                                <li key={idx} className="text-xs text-slate-700 leading-snug flex items-start gap-2">
                                    <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                                        {idx + 1}
                                    </span>
                                    <span>{pt}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1.5">
                        <div className="text-[11px] font-extrabold text-emerald-900 uppercase">Contoh Konkret</div>
                        <p className="text-xs text-slate-800 leading-relaxed">{concreteExample}</p>
                        {(data.kataKunci || []).length > 0 && (
                            <div className="pt-1.5 border-t border-emerald-200/80 grid grid-cols-1 gap-1">
                                {(data.kataKunci || []).slice(0, 2).map((kw, i) => (
                                    <div key={i} className="text-[11px] text-emerald-950">
                                        <span className="font-bold">{kw.term}:</span> {kw.meaning}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Ilustrasi Pendukung Konkret (2D Edukatif / Internet Terverifikasi) */}
                <PosterIllustrationFrame data={data} accentHex={accentHex} />
            </div>

            {/* Sajian Visual Template Terpilih (Educational Infographic Pillars / Mind Map / Comic / Step-by-Step / dll) */}
            <MateriAjarTemplateRenderer data={data} isPrintMode={isPrintMode} />

            {/* D. CONTOH DALAM KEHIDUPAN SEHARI-HARI & E. AKTIVITAS SISWA */}
            <div data-pdf-block="true" className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">D</span>
                        <h3 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wide">Contoh dalam Kehidupan Sehari-hari</h3>
                    </div>
                    <ul className="space-y-1.5">
                        {dailyExamples.slice(0, 4).map((ex, idx) => (
                            <li key={idx} className="bg-white border border-emerald-200/80 rounded-xl px-3 py-2 text-xs text-slate-800 leading-snug flex items-start gap-2">
                                <span className="font-extrabold text-emerald-700 shrink-0 tabular-nums">{idx + 1}.</span>
                                <span>{ex}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-3.5 space-y-2 flex flex-col justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-violet-700 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">E</span>
                            <h3 className="text-xs font-extrabold text-violet-950 uppercase tracking-wide">Aktivitas Siswa</h3>
                        </div>
                        <div className="bg-white border border-violet-200/80 rounded-xl p-3 space-y-1.5">
                            <div className="text-xs font-bold text-violet-950">{studentActivity.judul}</div>
                            <ol className="space-y-1">
                                {(studentActivity.langkah || []).slice(0, 4).map((step, i) => (
                                    <li key={i} className="text-[11.5px] text-slate-700 leading-snug flex items-start gap-1.5">
                                        <span className="font-bold text-violet-700 shrink-0 tabular-nums">{i + 1}.</span>
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                    <div className="bg-violet-100/70 border border-violet-200 rounded-xl px-3 py-1.5 text-[11px] text-violet-950">
                        <span className="font-bold">Hasil Diharapkan: </span>{studentActivity.hasilDiharapkan}
                    </div>
                </div>
            </div>

            {/* F. RANGKUMAN (3-5 POIN) & G. LATIHAN PEMAHAMAN (3 SOAL) */}
            <div data-pdf-block="true" className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-300 bg-slate-50 p-3.5 space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">F</span>
                        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">Rangkuman Penting</h3>
                    </div>
                    <ul className="space-y-1.5">
                        {summaryPoints.map((pt, idx) => (
                            <li key={idx} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 leading-snug flex items-start gap-2">
                                <span className="w-5 h-5 rounded-md bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0 tabular-nums">
                                    {idx + 1}
                                </span>
                                <span>{pt}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-3.5 space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-700 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">G</span>
                        <h3 className="text-xs font-extrabold text-blue-950 uppercase tracking-wide">Latihan Pemahaman (3 Soal)</h3>
                    </div>
                    <div className="space-y-1.5">
                        {practiceQuestions.map((lat) => (
                            <div key={lat.no} className="bg-white border border-blue-200/80 rounded-xl p-2.5 space-y-0.5">
                                <div className="text-xs font-semibold text-slate-900 flex items-start gap-1.5 leading-snug">
                                    <span className="font-extrabold text-blue-700 shrink-0 tabular-nums">{lat.no}.</span>
                                    <span>{lat.pertanyaan}</span>
                                </div>
                                <div className="text-[10.5px] text-emerald-800 pl-4">
                                    <span className="font-bold">Kunci Singkat: </span>{lat.kunciSingkat}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FOOTER PENGESAHAN PPA RINGKAS */}
            <div data-pdf-block="true" className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <div className="grid grid-cols-2 gap-4 text-[11px] text-center text-slate-700">
                    <div>
                        <div>Mengetahui, Kepala {identity.institutionName || 'Sekolah Dasar'}</div>
                        <div className="font-bold text-slate-900 mt-5 underline">{identity.kepalaSekolah || '..........................................'}</div>
                        <div className="text-[10px] text-slate-500">NIP. {identity.nipKepalaSekolah || '....................................'}</div>
                    </div>
                    <div>
                        <div>{cityName}, {todayStr} · Guru Kelas / Pengampu</div>
                        <div className="font-bold text-slate-900 mt-5 underline">{identity.authorName || '..........................................'}</div>
                        <div className="text-[10px] text-slate-500">NIP. {identity.nip || '....................................'}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const MateriAjarGenerator: React.FC<MateriAjarGeneratorProps> = ({
    user,
    userIdentity,
    selectedClass: initialClass,
    selectedSubject: initialSubject,
    availableSubjects,
    activities,
    lockedProtas,
    currentProtaData,
    onNavigate,
    onClassChange,
    onSubjectChange,
    notify
}) => {
    const userAssignedClass = userIdentity?.assignedClass || user?.assignedClass;
    const activeClass = userAssignedClass || initialClass || 'Kelas 1';
    const registeredClass = activeClass;
    const [activeSubject, setActiveSubject] = useState<string>(initialSubject || availableSubjects[0] || 'Bahasa Indonesia');

    useEffect(() => {
        if (initialSubject) {
            setActiveSubject(initialSubject);
        }
    }, [initialSubject]);

    // Check locked & saved Prota sources matching activeClass + activeSubject
    const matchingProtaSource = useMemo(() => {
        const isKeyLocked = (subj: string, cls: string) => {
            if (!lockedProtas) return false;
            if (lockedProtas[`${subj}_${cls}`]) return true;
            return Object.entries(lockedProtas).some(([k, val]) => {
                if (!val) return false;
                const idx = k.lastIndexOf('_');
                if (idx === -1) return false;
                return isSameSubject(k.slice(0, idx), subj) && isSameClass(k.slice(idx + 1), cls);
            });
        };

        if (currentProtaData && currentProtaData.elements && isSameSubject(currentProtaData.subject, activeSubject)) {
            return {
                data: currentProtaData,
                locked: isKeyLocked(activeSubject, activeClass) || isKeyLocked(currentProtaData.subject, activeClass)
            };
        }

        if (Array.isArray(activities)) {
            const match = activities.find(act =>
                (act.type === 'ATP_JP' || act.type === 'CP_TP') &&
                act.dataSnapshot?.elements &&
                isSameSubject(act.subject || act.dataSnapshot.subject, activeSubject)
            );
            if (match) {
                const subjName = match.subject || match.dataSnapshot.subject || activeSubject;
                return {
                    data: match.dataSnapshot as CurriculumData,
                    locked: isKeyLocked(activeSubject, activeClass) || isKeyLocked(subjName, activeClass)
                };
            }
        }
        return null;
    }, [currentProtaData, activities, lockedProtas, activeSubject, activeClass]);

    // Build 4-tier Curriculum Hierarchy Tree: Puncak (Mapel/Kelas/Fase) -> Elemen -> TP -> ATP
    const hierarchyTree = useMemo(
        () => buildMateriAjarHierarchy(activeSubject, activeClass, matchingProtaSource),
        [activeSubject, activeClass, matchingProtaSource]
    );

    const [selectedElementId, setSelectedElementId] = useState<string>('');
    const [selectedTpId, setSelectedTpId] = useState<string>('');
    const [selectedAtpId, setSelectedAtpId] = useState<string>('');
    const [focusLevel, setFocusLevel] = useState<HierarchyFocusLevel>('atp');

    // Keep hierarchy selections valid whenever subject/class changes
    useEffect(() => {
        const firstEl = hierarchyTree.elements[0];
        if (!firstEl) return;
        const validEl = hierarchyTree.elements.find(e => e.id === selectedElementId) || firstEl;
        if (validEl.id !== selectedElementId) setSelectedElementId(validEl.id);

        const firstTp = validEl.tpNodes[0];
        if (!firstTp) return;
        const validTp = validEl.tpNodes.find(t => t.id === selectedTpId) || firstTp;
        if (validTp.id !== selectedTpId) setSelectedTpId(validTp.id);

        const firstAtp = validTp.atpItems[0];
        if (!firstAtp) return;
        const validAtp = validTp.atpItems.find(a => a.id === selectedAtpId) || firstAtp;
        if (validAtp.id !== selectedAtpId) setSelectedAtpId(validAtp.id);
    }, [hierarchyTree, selectedElementId, selectedTpId, selectedAtpId]);

    const activeElement = useMemo(
        () => hierarchyTree.elements.find(e => e.id === selectedElementId) || hierarchyTree.elements[0],
        [hierarchyTree, selectedElementId]
    );
    const activeTp = useMemo(
        () => activeElement?.tpNodes.find(t => t.id === selectedTpId) || activeElement?.tpNodes[0],
        [activeElement, selectedTpId]
    );
    const activeAtp = useMemo(
        () => activeTp?.atpItems.find(a => a.id === selectedAtpId) || activeTp?.atpItems[0],
        [activeTp, selectedAtpId]
    );

    // Template Selection State: Mode 1 (Rekomendasi) vs Mode 2 (Manual 10 Gaya)
    const [selectionMode, setSelectionMode] = useState<'rekomendasi' | 'manual'>('rekomendasi');
    const [manualTemplateId, setManualTemplateId] = useState<MateriTemplateId>('educational_infographic');

    const smartRecommendation = useMemo(() => {
        return recommendTemplateForFocus(
            activeSubject,
            activeElement?.elementName || '',
            activeElement?.capaianPembelajaran || '',
            activeTp?.tp || '',
            focusLevel === 'atp' ? (activeAtp?.alur || '') : ''
        );
    }, [activeSubject, activeElement, activeTp, activeAtp, focusLevel]);

    const effectiveTemplateId: MateriTemplateId =
        selectionMode === 'rekomendasi' ? smartRecommendation.recommendedId : manualTemplateId;

    // Generation, Preview, Archive & PDF/PNG Export State
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
    const [isExportingPng, setIsExportingPng] = useState<boolean>(false);
    const [paperSize, setPaperSize] = useState<'A4' | 'F4'>('A4');
    const [generatedMateri, setGeneratedMateri] = useState<GeneratedMateriAjarData | null>(null);
    const [archiveList, setArchiveList] = useState<GeneratedMateriAjarData[]>([]);

    const pdfCaptureRef = useRef<HTMLDivElement | null>(null);
    const archiveStorageKey = useMemo(
        () => getMateriAjarArchiveKey(user, registeredClass),
        [user?.email, user?.name, registeredClass]
    );

    // Load per-user archive from localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem(archiveStorageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    setArchiveList(parsed);
                    if (parsed.length > 0) {
                        setGeneratedMateri(parsed[0]);
                        return;
                    }
                }
            }
        } catch {}
        setArchiveList([]);
        setGeneratedMateri(null);
    }, [archiveStorageKey]);

    const saveToArchive = (item: GeneratedMateriAjarData) => {
        setArchiveList(prev => {
            const next = [item, ...prev.filter(x => x.id !== item.id)].slice(0, 20);
            try {
                localStorage.setItem(archiveStorageKey, JSON.stringify(next));
            } catch {}
            return next;
        });
    };

    const handleDeleteArchive = (id: string) => {
        setArchiveList(prev => {
            const next = prev.filter(x => x.id !== id);
            try {
                localStorage.setItem(archiveStorageKey, JSON.stringify(next));
            } catch {}
            return next;
        });
        if (generatedMateri?.id === id) {
            setGeneratedMateri(null);
        }
        notify('Item arsip materi ajar berhasil dihapus.', 'info');
    };

    const handleGenerateMateri = async () => {
        if (!activeElement || !activeTp) {
            notify('Silakan pilih Elemen dan Tujuan Pembelajaran terlebih dahulu.', 'warning');
            return;
        }
        setIsGenerating(true);
        try {
            const semesterVal = String(activeTp.semester || userIdentity.semester || '1');
            const atpDisplay = focusLevel === 'elemen'
                ? activeElement.tpNodes.map((t, i) => `TP ${i + 1}: ${t.tp}`).join(' | ')
                : focusLevel === 'tp'
                    ? (activeTp.atpItems || []).map(a => a.alur).join(' → ')
                    : (activeAtp?.alur || activeTp.tp);

            const totalJpDisplay = focusLevel === 'atp'
                ? (activeAtp?.alokasiWaktu || '3 JP')
                : `${(activeTp.atpItems || []).length * 3 || 4} JP`;

            const { data, usedFallback } = await generateMateriAjarContent({
                subject: activeSubject,
                className: activeClass,
                fase: hierarchyTree.fase,
                semester: semesterVal,
                academicYear: userIdentity.academicYear || '2025/2026',
                focusLevel,
                elementName: activeElement.elementName,
                capaianPembelajaran: activeElement.capaianPembelajaran,
                tpText: activeTp.tp,
                atpText: atpDisplay,
                alokasiWaktu: totalJpDisplay,
                templateId: effectiveTemplateId,
                selectionMode,
                recommendationReason: selectionMode === 'rekomendasi' ? smartRecommendation.reason : undefined
            });

            setGeneratedMateri(data);
            saveToArchive(data);
            const tplName = MATERI_AJAR_TEMPLATES.find(t => t.id === effectiveTemplateId)?.name || effectiveTemplateId;
            notify(
                usedFallback
                    ? `Materi Ajar (${tplName}) berhasil disusun sesuai standar PPA BSKAP 046.`
                    : `Materi Ajar (${tplName}) berhasil dibuat dengan AI & tersimpan di arsip!`,
                'success'
            );
        } catch (err) {
            console.error(err);
            notify('Gagal menyusun materi ajar. Silakan coba kembali.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!generatedMateri || !pdfCaptureRef.current) return;
        setIsExportingPdf(true);
        try {
            const safeSubject = generatedMateri.subject.replace(/[^a-zA-Z0-9]+/g, '_');
            const safeClass = generatedMateri.className.replace(/[^a-zA-Z0-9]+/g, '_');
            const safeTpl = generatedMateri.templateId.replace(/[^a-zA-Z0-9]+/g, '_');
            const filename = `Infografis_Materi_Ajar_${safeSubject}_${safeClass}_${safeTpl}_${paperSize}.pdf`;

            await exportMateriAjarToPdf(pdfCaptureRef.current, {
                filename,
                paperSize,
                institutionName: userIdentity.institutionName || 'SD Negeri',
                subject: generatedMateri.subject,
                className: generatedMateri.className
            });
            notify(`File PDF (${paperSize} Portrait · 300 DPI) berhasil diunduh!`, 'success');
        } catch (err) {
            console.error('PDF export error:', err);
            notify('Gagal mengekspor PDF. Pastikan browser tidak memblokir unduhan.', 'error');
        } finally {
            setIsExportingPdf(false);
        }
    };

    const handleDownloadPng = async () => {
        if (!generatedMateri || !pdfCaptureRef.current) return;
        setIsExportingPng(true);
        try {
            const safeSubject = generatedMateri.subject.replace(/[^a-zA-Z0-9]+/g, '_');
            const safeClass = generatedMateri.className.replace(/[^a-zA-Z0-9]+/g, '_');
            const safeTpl = generatedMateri.templateId.replace(/[^a-zA-Z0-9]+/g, '_');
            const filename = `Poster_Infografis_${safeSubject}_${safeClass}_${safeTpl}_300DPI.png`;

            await exportMateriAjarPosterPng(pdfCaptureRef.current, { filename });
            notify('Gambar Poster A4 Portrait (300 DPI PNG) berhasil diunduh!', 'success');
        } catch (err) {
            console.error('PNG export error:', err);
            notify('Gagal mengekspor gambar PNG poster.', 'error');
        } finally {
            setIsExportingPng(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const recommendedMeta = MATERI_AJAR_TEMPLATES.find(t => t.id === smartRecommendation.recommendedId)!;

    return (
        <div className="space-y-6 pb-16">
            {/* TOP HERO & CONTEXT SELECTOR */}
            <section className="no-print bg-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-1.5 max-w-3xl">
                        <div className="text-xs font-medium text-emerald-300 flex flex-wrap items-center gap-2">
                            <span>Kurikulum Merdeka BSKAP 046/H/KR/2025</span>
                            <span aria-hidden="true">·</span>
                            <span>Standar PPA SD/MI</span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1">
                                {hierarchyTree.sourceType === 'locked_prota' ? (
                                    <><Lock className="w-3.5 h-3.5" /> Prota Terkunci</>
                                ) : hierarchyTree.sourceType === 'saved_prota' ? (
                                    <><Unlock className="w-3.5 h-3.5 text-amber-300" /> Prota Tersimpan</>
                                ) : (
                                    <><GraduationCap className="w-3.5 h-3.5 text-sky-300" /> Referensi Resmi BSKAP 046</>
                                )}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                            Generator Materi Ajar Hierarkis &amp; Ekspor PDF
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            Susun bahan ajar modern sesuai standar Panduan Pembelajaran dan Asesmen (PPA) berdasarkan fokus Elemen, TP, atau ATP dengan identitas sekolah dan guru otomatis dari profil Anda.
                        </p>
                    </div>

                    <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5 text-xs space-y-1 shrink-0 min-w-[240px]">
                        <div className="text-[11px] font-semibold text-slate-400">Identitas Profil Aktif</div>
                        <div className="font-bold text-white truncate">{userIdentity.institutionName || 'Satuan Pendidikan Belum Diisi'}</div>
                        <div className="text-slate-300 truncate">{userIdentity.authorName || 'Guru Pengampu'} · {activeClass} · {userIdentity.academicYear || '2025/2026'}</div>
                        <button
                            type="button"
                            onClick={() => onNavigate('dashboard')}
                            className="text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 underline cursor-pointer pt-0.5"
                        >
                            Kelola Identitas di Profil / Dasbor
                        </button>
                    </div>
                </div>

                {/* Profile Class Info & Subject Selector Strip */}
                <div className="pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <div className="block text-[11px] font-semibold text-slate-400 mb-1">Kelas &amp; Fase (Sesuai Profil)</div>
                        <div className="w-full h-10 px-3 rounded-xl bg-slate-800/70 border border-slate-700 text-xs font-bold text-amber-300 flex items-center justify-between gap-2">
                            <span className="truncate">{activeClass} · {hierarchyTree.fase}</span>
                            <span className="text-[11px] font-medium text-emerald-300 shrink-0">Dari Profil</span>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Mata Pelajaran</label>
                        <select
                            value={activeSubject}
                            onChange={(e) => {
                                const s = e.target.value;
                                setActiveSubject(s);
                                if (onSubjectChange) onSubjectChange(s);
                            }}
                            className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        >
                            {!availableSubjects.some(s => isSameSubject(s, activeSubject)) && (
                                <option value={activeSubject}>{activeSubject}</option>
                            )}
                            {availableSubjects.map(subj => (
                                <option key={subj} value={subj}>{subj}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </section>

            {/* STEP 1: PEMETAAN HIERARKI KURIKULUM (PUNCAK -> ELEMEN -> TP -> ATP) */}
            <section className="no-print bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-emerald-700" />
                            <span>1. Pemilihan Fokus Hierarki Kurikulum (Puncak hingga Elemen &amp; ATP)</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Ikuti alur sistematika dari Mata Pelajaran &amp; Fase menuju Elemen, Capaian Pembelajaran, TP, hingga butir ATP.
                        </p>
                    </div>

                    {/* Focus Granularity Control */}
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
                        {([
                            { id: 'elemen', label: 'Fokus Elemen' },
                            { id: 'tp', label: 'Fokus TP' },
                            { id: 'atp', label: 'Fokus Butir ATP' }
                        ] as { id: HierarchyFocusLevel; label: string }[]).map(opt => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setFocusLevel(opt.id)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                                    focusLevel === opt.id
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Visual Breadcrumb Puncak -> Elemen -> TP -> ATP */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs flex flex-wrap items-center gap-2 text-slate-700">
                    <span className="font-bold text-slate-900">{hierarchyTree.subject} ({hierarchyTree.className})</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-emerald-800">{activeElement?.elementName}</span>
                    {focusLevel !== 'elemen' && activeTp && (
                        <>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold text-blue-800">TP {activeTp.index} (Smt {activeTp.semester})</span>
                        </>
                    )}
                    {focusLevel === 'atp' && activeAtp && (
                        <>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold text-indigo-800">ATP {activeAtp.index} ({activeAtp.alokasiWaktu})</span>
                        </>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Tier 2: Elemen & CP */}
                    <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/40">
                        <div className="text-xs font-bold text-slate-800">Tingkat 1 · Pilih Elemen &amp; CP</div>
                        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                            {hierarchyTree.elements.map(el => {
                                const active = el.id === activeElement?.id;
                                return (
                                    <button
                                        key={el.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedElementId(el.id);
                                            const firstTp = el.tpNodes[0];
                                            if (firstTp) {
                                                setSelectedTpId(firstTp.id);
                                                if (firstTp.atpItems[0]) setSelectedAtpId(firstTp.atpItems[0].id);
                                            }
                                        }}
                                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                                            active
                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold'
                                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="font-bold">{el.index}. {el.elementName}</div>
                                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{el.capaianPembelajaran}</div>
                                    </button>
                                );
                            })}
                        </div>
                        {activeElement && (
                            <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-[11px] text-slate-700 leading-relaxed">
                                <span className="font-bold text-slate-900">CP Elemen: </span>
                                {activeElement.capaianPembelajaran}
                            </div>
                        )}
                    </div>

                    {/* Tier 3: Tujuan Pembelajaran (TP) */}
                    <div className={`border border-slate-200 rounded-2xl p-4 space-y-3 ${focusLevel === 'elemen' ? 'opacity-60 bg-slate-50' : 'bg-slate-50/40'}`}>
                        <div className="flex items-center justify-between">
                            <div className="text-xs font-bold text-slate-800">Tingkat 2 · Pilih Tujuan Pembelajaran (TP)</div>
                            {focusLevel === 'elemen' && <span className="text-[11px] text-slate-500">Semua TP tercakup</span>}
                        </div>
                        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                            {(activeElement?.tpNodes || []).map(tpNode => {
                                const active = tpNode.id === activeTp?.id;
                                return (
                                    <button
                                        key={tpNode.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedTpId(tpNode.id);
                                            if (tpNode.atpItems[0]) setSelectedAtpId(tpNode.atpItems[0].id);
                                            if (focusLevel === 'elemen') setFocusLevel('tp');
                                        }}
                                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                                            active
                                                ? 'bg-blue-50 border-blue-500 text-blue-950 font-semibold'
                                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2 text-[11px] text-blue-700 font-bold mb-0.5">
                                            <span>TP {tpNode.index}</span>
                                            <span>Semester {tpNode.semester}</span>
                                        </div>
                                        <div className="leading-relaxed">{tpNode.tp}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tier 4: Alur Tujuan Pembelajaran (ATP) */}
                    <div className={`border border-slate-200 rounded-2xl p-4 space-y-3 ${focusLevel !== 'atp' ? 'opacity-65 bg-slate-50' : 'bg-slate-50/40'}`}>
                        <div className="flex items-center justify-between">
                            <div className="text-xs font-bold text-slate-800">Tingkat 3 · Pilih Butir ATP</div>
                            {focusLevel !== 'atp' && <span className="text-[11px] text-slate-500">Opsional saat fokus TP/Elemen</span>}
                        </div>
                        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                            {(activeTp?.atpItems || []).map(atp => {
                                const active = atp.id === activeAtp?.id;
                                return (
                                    <button
                                        key={atp.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedAtpId(atp.id);
                                            setFocusLevel('atp');
                                        }}
                                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                                            active
                                                ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-semibold'
                                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-indigo-700 mb-0.5">
                                            <span>Alur {atp.index}</span>
                                            <span className="tabular-nums">{atp.alokasiWaktu}</span>
                                        </div>
                                        <div className="leading-relaxed">{atp.alur}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* STEP 2: PILIHAN GAYA TEMPLATE (REKOMENDASI OTOMATIS VS MANUAL 10 GAYA) */}
            <section className="no-print bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Compass className="w-5 h-5 text-indigo-700" />
                            <span>2. Pilihan Gaya Template Materi Ajar</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Gunakan rekomendasi cerdas sesuai karakter ATP/TP atau pilih manual salah satu dari 10 gaya visual modern.
                        </p>
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
                        <button
                            type="button"
                            onClick={() => setSelectionMode('rekomendasi')}
                            className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                                selectionMode === 'rekomendasi'
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-700 hover:text-slate-900'
                            }`}
                        >
                            1. Rekomendasi Otomatis
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectionMode('manual')}
                            className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                                selectionMode === 'manual'
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-700 hover:text-slate-900'
                            }`}
                        >
                            2. Pilih Manual (10 Gaya)
                        </button>
                    </div>
                </div>

                {selectionMode === 'rekomendasi' ? (
                    <div className="space-y-4">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1.5">
                                <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4" />
                                    <span>Rekomendasi Terbaik untuk Fokus ATP/TP Terpilih</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <span>{recommendedMeta.order}. {recommendedMeta.name}</span>
                                    <span className="text-sm font-medium text-emerald-800">({recommendedMeta.subtitle})</span>
                                </h3>
                                <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
                                    {smartRecommendation.reason}
                                </p>
                            </div>
                            <div className="shrink-0 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setManualTemplateId(recommendedMeta.id);
                                        setSelectionMode('manual');
                                    }}
                                    className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-100/60 whitespace-nowrap cursor-pointer"
                                >
                                    Ubah ke Manual
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {smartRecommendation.alternatives.map((alt) => {
                                const altMeta = MATERI_AJAR_TEMPLATES.find(t => t.id === alt.id)!;
                                return (
                                    <button
                                        key={alt.id}
                                        type="button"
                                        onClick={() => {
                                            setManualTemplateId(alt.id);
                                            setSelectionMode('manual');
                                        }}
                                        className="text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3.5 transition-colors cursor-pointer flex items-start gap-3"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                                            {TEMPLATE_ICONS[alt.id]}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-900">
                                                Alternatif {altMeta.order}: {altMeta.name} ({altMeta.subtitle})
                                            </div>
                                            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{alt.reason}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {MATERI_AJAR_TEMPLATES.map((tpl) => {
                            const isSelected = manualTemplateId === tpl.id;
                            const isRecommended = smartRecommendation.recommendedId === tpl.id;
                            return (
                                <button
                                    key={tpl.id}
                                    type="button"
                                    onClick={() => setManualTemplateId(tpl.id)}
                                    className={`text-left rounded-2xl p-3.5 border transition-colors cursor-pointer flex flex-col justify-between gap-2 ${
                                        isSelected
                                            ? 'border-slate-900 bg-slate-900 text-white'
                                            : 'border-slate-200 bg-white hover:border-slate-400 text-slate-900'
                                    }`}
                                >
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <span
                                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                                    isSelected ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-700'
                                                }`}
                                            >
                                                {TEMPLATE_ICONS[tpl.id]}
                                            </span>
                                            <span className={`text-[11px] font-bold tabular-nums ${isSelected ? 'text-emerald-300' : 'text-slate-400'}`}>
                                                {String(tpl.order).padStart(2, '0')}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold leading-snug">{tpl.name}</div>
                                            <div className={`text-[11px] font-medium ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                                {tpl.subtitle}
                                            </div>
                                        </div>
                                        <p className={`text-[11px] leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                                            {tpl.description}
                                        </p>
                                    </div>
                                    {isRecommended && (
                                        <div className={`text-[10.5px] font-semibold pt-1.5 border-t ${isSelected ? 'border-white/15 text-emerald-300' : 'border-slate-100 text-emerald-700'}`}>
                                            Disarankan PPA untuk topik ini
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Action Bar: Generate Button */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-slate-600">
                        Template aktif: <span className="font-bold text-slate-900">
                            {MATERI_AJAR_TEMPLATES.find(t => t.id === effectiveTemplateId)?.name}
                        </span> · Fokus: <span className="font-bold text-slate-900">{activeElement?.elementName}</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleGenerateMateri}
                        disabled={isGenerating}
                        className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                    >
                        {isGenerating ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> <span>Menyusun Materi Ajar PPA...</span></>
                        ) : (
                            <><Sparkles className="w-4 h-4" /> <span>{generatedMateri ? 'Buat Ulang Materi Ajar' : 'Buat Materi Ajar PPA'}</span></>
                        )}
                    </button>
                </div>
            </section>

            {/* ARSIP MATERI AJAR TERSIMPAN PER PENGGUNA (LOCAL STORAGE) */}
            <section className="no-print bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-emerald-700" />
                        <span>ARSIP MATERI AJAR TERSIMPAN ({archiveList.length})</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                        Tersimpan lokal untuk akun aktif ({user?.email || registeredClass})
                    </span>
                </div>

                {archiveList.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-500">
                        Belum ada materi ajar tersimpan. Pilih fokus TP/ATP di atas lalu tekan &ldquo;Buat Materi Ajar PPA&rdquo;.
                    </div>
                ) : (
                    <div className="flex gap-3 overflow-x-auto pb-1">
                        {archiveList.map(item => {
                            const tplMeta = MATERI_AJAR_TEMPLATES.find(t => t.id === item.templateId);
                            const isActive = generatedMateri?.id === item.id;
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => setGeneratedMateri(item)}
                                    className={`shrink-0 min-w-[230px] max-w-[280px] rounded-xl border px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                        isActive
                                            ? 'bg-emerald-50/80 border-emerald-500 shadow-2xs'
                                            : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <div className={`text-xs font-extrabold truncate ${isActive ? 'text-emerald-950' : 'text-slate-800'}`}>
                                            {item.title}
                                        </div>
                                        <div className={`text-[11px] font-medium mt-0.5 truncate ${isActive ? 'text-emerald-800' : 'text-slate-600'}`}>
                                            {item.subject} &bull; {item.className}
                                        </div>
                                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                            {tplMeta?.name || item.templateId} &bull; {item.elementName}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteArchive(item.id);
                                        }}
                                        aria-label="Hapus arsip materi ajar"
                                        title="Hapus arsip ini"
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* STEP 3: PRATINJAU POSTER INFOGRAFIS A4 PORTRAIT & EKSPOR PDF / PNG */}
            {generatedMateri && (
                <section className="space-y-4">
                    {/* Export Controls Bar */}
                    <div className="no-print bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-0.5">
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Pratinjau Poster Infografis Materi Ajar A4 Portrait (300 DPI)</span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                Format poster edukasi modern lengkap (Header, Pengantar, Inti Berilustrasi, Contoh Harian, Aktivitas, Rangkuman, &amp; 3 Soal Latihan) siap cetak PDF maupun gambar PNG.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                                {(['A4', 'F4'] as const).map(sz => (
                                    <button
                                        key={sz}
                                        type="button"
                                        onClick={() => setPaperSize(sz)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap cursor-pointer ${
                                            paperSize === sz ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                                        }`}
                                    >
                                        {sz}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={handlePrint}
                                className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                            >
                                <Printer className="w-4 h-4" />
                                <span>Cetak</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleDownloadPng}
                                disabled={isExportingPng}
                                className="px-3.5 py-2 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-60 text-emerald-900 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                            >
                                {isExportingPng ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> <span>Menyiapkan PNG...</span></>
                                ) : (
                                    <><ImageIcon className="w-4 h-4" /> <span>Unduh PNG (300 DPI)</span></>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleDownloadPdf}
                                disabled={isExportingPdf}
                                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer"
                            >
                                {isExportingPdf ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> <span>Menyiapkan PDF...</span></>
                                ) : (
                                    <><Download className="w-4 h-4" /> <span>Unduh PDF ({paperSize} · 300 DPI)</span></>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Interactive Screen Preview */}
                    <div className="print-area bg-slate-100/70 border border-slate-200 rounded-3xl p-3 sm:p-5">
                        <div className="max-w-[820px] mx-auto">
                            <PpaDocumentSheet data={generatedMateri} identity={userIdentity} isPrintMode={false} />
                        </div>
                    </div>

                    {/* Offscreen 794px A4 Portrait Stage (renders 2480px wide 300 DPI PNG / crisp PDF) */}
                    <div
                        aria-hidden="true"
                        style={{
                            position: 'fixed',
                            left: '-12000px',
                            top: 0,
                            width: '794px',
                            backgroundColor: '#ffffff',
                            pointerEvents: 'none'
                        }}
                    >
                        <div ref={pdfCaptureRef}>
                            <PpaDocumentSheet data={generatedMateri} identity={userIdentity} isPrintMode={true} />
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};
