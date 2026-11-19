import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    BookOpen, CheckCircle2, ChevronRight, Download, FileText, FolderOpen,
    GitBranch, Layers, LayoutGrid, Loader2, Lock, Printer, RefreshCw,
    Sparkles, Trash2, Unlock, Compass, Box, Clock, MessageSquare,
    StickyNote, Table2, ListChecks, Zap, GraduationCap
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
import { MateriAjarTemplateRenderer } from './MateriAjarTemplateRenderers';
import { exportMateriAjarToPdf } from './materiAjarPdfExporter';

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
    const cityName = identity.location || identity.city || 'Sukatinggal';
    const todayStr = formatIndonesianDate();

    return (
        <div className="space-y-4 text-slate-900 bg-white">
            {/* BLOK 1: KOP & IDENTITAS STANDAR PPA */}
            <div data-pdf-block="true" className="border border-slate-300 rounded-2xl overflow-hidden bg-white">
                <div className="bg-slate-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="text-[11px] font-semibold text-emerald-300">
                            Bahan Ajar Kurikulum Merdeka · Standar PPA BSKAP 046/H/KR/2025
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5 leading-snug">{data.title}</h2>
                        <p className="text-xs text-slate-300 mt-0.5">{data.subtitle}</p>
                    </div>
                    <div className="text-left sm:text-right">
                        <div className="text-[10px] font-semibold text-slate-400">Gaya Penyajian</div>
                        <div className="text-xs font-bold text-white">{tplMeta.name} ({tplMeta.subtitle})</div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-xs border-t border-slate-200">
                    <div className="flex justify-between gap-2 border-b border-slate-200/70 pb-1">
                        <span className="text-slate-500">Satuan Pendidikan</span>
                        <span className="font-bold text-slate-900 text-right">{identity.institutionName || 'SD Negeri'}</span>
                    </div>
                    <div className="flex justify-between gap-2 border-b border-slate-200/70 pb-1">
                        <span className="text-slate-500">NPSN</span>
                        <span className="font-bold text-slate-900 tabular-nums text-right">{identity.npsn || '-'}</span>
                    </div>
                    <div className="flex justify-between gap-2 border-b border-slate-200/70 pb-1">
                        <span className="text-slate-500">Mata Pelajaran</span>
                        <span className="font-bold text-slate-900 text-right">{data.subject}</span>
                    </div>
                    <div className="flex justify-between gap-2 border-b border-slate-200/70 pb-1">
                        <span className="text-slate-500">Kelas / Fase</span>
                        <span className="font-bold text-slate-900 text-right">{data.className} ({data.fase})</span>
                    </div>
                    <div className="flex justify-between gap-2 border-b border-slate-200/70 pb-1">
                        <span className="text-slate-500">Tahun Ajaran / Smt</span>
                        <span className="font-bold text-slate-900 tabular-nums text-right">{data.academicYear} · Smt {data.semester}</span>
                    </div>
                    <div className="flex justify-between gap-2 border-b border-slate-200/70 pb-1">
                        <span className="text-slate-500">Alokasi Waktu</span>
                        <span className="font-bold text-emerald-800 tabular-nums text-right">{data.alokasiWaktu || '3 JP'}</span>
                    </div>
                    <div className="flex justify-between gap-2 sm:col-span-2 lg:col-span-3 pt-0.5">
                        <span className="text-slate-500">Penyusun / Guru Pengampu</span>
                        <span className="font-bold text-slate-900 text-right">
                            {identity.authorName || 'Guru Kelas'} {identity.nip ? `(NIP. ${identity.nip})` : ''}
                        </span>
                    </div>
                </div>
            </div>

            {/* BLOK 2: SISTEMATIKA HIERARKI PPA (ELEMEN -> CP -> TP -> ATP) */}
            <div data-pdf-block="true" className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-900">A. Keselarasan Hierarki Kurikulum Merdeka (PPA)</h3>
                    <span className="text-[11px] font-semibold text-slate-500">
                        Fokus Pilihan: {data.focusLevel === 'elemen' ? 'Keseluruhan Elemen' : data.focusLevel === 'tp' ? 'Tujuan Pembelajaran (TP)' : 'Butir Alur Tujuan Pembelajaran (ATP)'}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                        <div className="text-[11px] font-bold text-slate-600">1. Elemen &amp; Capaian Pembelajaran (CP)</div>
                        <div className="font-bold text-slate-900">{data.elementName}</div>
                        <p className="text-slate-700 leading-relaxed">{data.capaianPembelajaran}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                        <div>
                            <div className="text-[11px] font-bold text-slate-600">2. Tujuan Pembelajaran (TP)</div>
                            <p className="text-slate-900 font-medium leading-relaxed mt-0.5">{data.tpText}</p>
                        </div>
                        <div className="pt-1.5 border-t border-slate-200">
                            <div className="text-[11px] font-bold text-emerald-800">3. Alur Tujuan Pembelajaran (ATP)</div>
                            <p className="text-slate-800 leading-relaxed mt-0.5">{data.atpText}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1">
                        <div className="text-[11px] font-bold text-emerald-900">Pemahaman Bermakna</div>
                        <p className="text-xs text-slate-800 leading-relaxed">{data.pemahamanBermakna}</p>
                    </div>
                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-1">
                        <div className="text-[11px] font-bold text-amber-900">Pertanyaan Pemantik</div>
                        <ul className="space-y-1">
                            {(data.pertanyaanPemantik || []).map((q, i) => (
                                <li key={i} className="text-xs text-slate-800 leading-relaxed flex items-start gap-1.5">
                                    <span className="font-bold text-amber-700 shrink-0 tabular-nums">{i + 1}.</span>
                                    <span>{q}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* BLOK 3: KONSEP INTI & KATA KUNCI */}
            <div data-pdf-block="true" className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
                <div className="pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-900">B. Pengantar Konsep &amp; Glosarium Kata Kunci</h3>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{data.ringkasanKonsepInti}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(data.kataKunci || []).map((kw, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                            <div className="text-xs font-bold text-slate-900">{kw.term}</div>
                            <div className="text-[11.5px] text-slate-600 mt-0.5 leading-relaxed">{kw.meaning}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* BLOK 4+: KONTEN UTAMA SESUAI GAYA TEMPLATE */}
            <div className="space-y-3">
                <div data-pdf-block="true" className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold text-slate-900">
                        C. Sajian Utama Materi Ajar ({tplMeta.name} — {tplMeta.subtitle})
                    </h3>
                    {data.selectionMode === 'rekomendasi' && (
                        <span className="text-[11px] font-medium text-emerald-700">Dipilih via Rekomendasi PPA</span>
                    )}
                </div>
                <MateriAjarTemplateRenderer data={data} isPrintMode={isPrintMode} />
            </div>

            {/* BLOK 5: AKTIVITAS PEMBELAJARAN MENDALAM & LATIHAN FORMATIF */}
            <div data-pdf-block="true" className="border border-slate-200 rounded-2xl p-4 bg-white space-y-4">
                <div className="pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-900">D. Aktivitas Pembelajaran &amp; Asesmen Formatif PPA</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {(data.aktivitasPembelajaran || []).map((act, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                            <div className="text-xs font-bold text-slate-900">{act.tahap}</div>
                            <p className="text-[11.5px] text-slate-700 leading-relaxed">{act.kegiatan}</p>
                        </div>
                    ))}
                </div>

                <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-900">Latihan Pemahaman Siswa</div>
                    <div className="space-y-2">
                        {(data.latihanFormatif || []).map((lat) => (
                            <div key={lat.no} className="border border-slate-200 rounded-xl p-3 bg-white space-y-1">
                                <div className="text-xs font-semibold text-slate-900 flex items-start gap-2">
                                    <span className="font-bold text-slate-700 tabular-nums">{lat.no}.</span>
                                    <span>{lat.pertanyaan}</span>
                                </div>
                                <div className="text-[11px] text-emerald-800 pl-4">
                                    <span className="font-bold">Panduan Jawaban: </span>{lat.kunciSingkat}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                    <div className="text-xs font-bold text-slate-900">Refleksi Diri Peserta Didik</div>
                    <ul className="space-y-1">
                        {(data.refleksiSiswa || []).map((refItem, idx) => (
                            <li key={idx} className="text-[11.5px] text-slate-700">• {refItem}</li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* BLOK 6: LEMBAR PENGESAHAN RESMI PPA */}
            <div data-pdf-block="true" className="border border-slate-200 rounded-2xl p-5 bg-white">
                <div className="grid grid-cols-2 gap-6 text-xs text-center text-slate-800">
                    <div className="space-y-12">
                        <div>
                            <div>Mengetahui,</div>
                            <div className="font-semibold">Kepala {identity.institutionName || 'Sekolah Dasar'}</div>
                        </div>
                        <div>
                            <div className="font-bold underline">{identity.kepalaSekolah || '..........................................'}</div>
                            <div className="text-[11px] text-slate-600">NIP. {identity.nipKepalaSekolah || '....................................'}</div>
                        </div>
                    </div>
                    <div className="space-y-12">
                        <div>
                            <div>{cityName}, {todayStr}</div>
                            <div className="font-semibold">Guru Kelas / Pengampu</div>
                        </div>
                        <div>
                            <div className="font-bold underline">{identity.authorName || '..........................................'}</div>
                            <div className="text-[11px] text-slate-600">NIP. {identity.nip || '....................................'}</div>
                        </div>
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

    // Generation, Preview, Archive & PDF Export State
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
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
            const filename = `Materi_Ajar_${safeSubject}_${safeClass}_${safeTpl}_${paperSize}.pdf`;

            await exportMateriAjarToPdf(pdfCaptureRef.current, {
                filename,
                paperSize,
                institutionName: userIdentity.institutionName || 'SD Negeri',
                subject: generatedMateri.subject,
                className: generatedMateri.className
            });
            notify(`File PDF (${paperSize}) berhasil diunduh!`, 'success');
        } catch (err) {
            console.error('PDF export error:', err);
            notify('Gagal mengekspor PDF. Pastikan browser tidak memblokir unduhan.', 'error');
        } finally {
            setIsExportingPdf(false);
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

            {/* STEP 3: PRATINJAU DOKUMEN PPA & EKSPOR PDF */}
            {generatedMateri && (
                <section className="space-y-4">
                    {/* Export Controls Bar */}
                    <div className="no-print bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-0.5">
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Pratinjau Dokumen Materi Ajar Siap Ekspor PDF</span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                Dokumen tersusun sesuai tata letak PPA dan terpaginasi otomatis agar kartu serta diagram tidak terpotong di PDF.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
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
                                        Kertas {sz}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={handlePrint}
                                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                            >
                                <Printer className="w-4 h-4" />
                                <span>Cetak</span>
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
                                    <><Download className="w-4 h-4" /> <span>Unduh PDF ({paperSize})</span></>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Interactive Screen Preview */}
                    <div className="print-area bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs">
                        <PpaDocumentSheet data={generatedMateri} identity={userIdentity} isPrintMode={false} />
                    </div>

                    {/* Offscreen Print-Safe Mirror (renders Flashcards front+back side by side for crisp PDF export) */}
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

            {/* STEP 4: ARSIP MATERI AJAR LOKAL PER PENGGUNA */}
            <section className="no-print bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <FolderOpen className="w-4 h-4 text-slate-700" />
                            <span>Arsip Materi Ajar Tersimpan ({archiveList.length})</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Tersimpan otomatis di perangkat Anda khusus untuk akun aktif ({user?.email || registeredClass}).
                        </p>
                    </div>
                </div>

                {archiveList.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
                        Belum ada materi ajar yang dibuat. Pilih fokus Elemen/TP/ATP dan gaya template di atas, lalu tekan &ldquo;Buat Materi Ajar PPA&rdquo;.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {archiveList.map(item => {
                            const tplMeta = MATERI_AJAR_TEMPLATES.find(t => t.id === item.templateId);
                            const isActive = generatedMateri?.id === item.id;
                            return (
                                <div
                                    key={item.id}
                                    className={`rounded-2xl border p-3.5 flex flex-col justify-between gap-3 ${
                                        isActive ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-200 bg-white'
                                    }`}
                                >
                                    <div className="space-y-1">
                                        <div className="text-[11px] font-semibold text-slate-500">
                                            {item.subject} · {item.className} · {tplMeta?.name || item.templateId}
                                        </div>
                                        <div className="text-xs font-bold text-slate-900 line-clamp-2">{item.title}</div>
                                        <div className="text-[11px] text-slate-600 line-clamp-1">Elemen: {item.elementName}</div>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => setGeneratedMateri(item)}
                                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                            <span>Buka</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteArchive(item.id)}
                                            aria-label="Hapus arsip materi ajar"
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};
