import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Compass, Download,
    Edit3, FileSearch, FolderOpen, Image as ImageIcon, Layers, Loader2, Lock,
    Plus, RefreshCw, RotateCcw, Search, ShieldAlert, ShieldCheck, Sparkles,
    Trash2, Unlock, ZoomIn, ZoomOut, GraduationCap
} from 'lucide-react';
import { CurriculumData, isSameClass, isSameSubject } from './curriculumHelper';
import {
    MATERI_AJAR_TEMPLATES,
    MATERI_TEMPLATE_CATEGORIES,
    MATERI_VISUAL_THEMES,
    MateriTemplateCategoryId,
    MateriTemplateId,
    MateriVisualTheme,
    MateriVisualThemeId,
    HierarchyFocusLevel,
    PageCountPreference,
    PageOrientationMode,
    MateriDocumentPage,
    TpAtpAnalysisResult,
    GeneratedMateriAjarData,
    GENERATION_PIPELINE_STEPS,
    buildMateriAjarHierarchy,
    buildLogicalDocumentPages,
    recommendTemplateForFocus,
    generateMateriAjarContent,
    regenerateMateriIllustration,
    getMateriAjarArchiveKey,
    getFaseInfoForClass,
    getRecommendedOrientationForTemplate,
    checkTemplateSuitability,
    validateLockedCurriculumInputs,
    analyzeTpAtpDeterministic,
    analyzeTpAtpWithAi,
    evaluateMateriQualityControl,
    buildMateriAjarFilename,
    buildVerifiableReferences
} from './materiAjarHelper';
import { MateriAjarTemplateRenderer, PosterIllustrationFrame } from './MateriAjarTemplateRenderers';
import { TemplateWireframeThumbnail } from './MateriAjarThumbnails';
import {
    getPngTargetSpec,
    exportMateriAjarPagesPng,
    exportSingleMateriPagePng,
    verifyRenderedMateriDom,
    DomVerificationResult
} from './materiAjarPdfExporter';

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

const ORIENTATION_OPTIONS: { id: PageOrientationMode; label: string; resLabel: string; desc: string }[] = [
    { id: 'portrait_a4', label: 'A4 Portrait', resLabel: '2480 × 3508 px', desc: 'Poster vertikal & lembar cetak 300 DPI' },
    { id: 'landscape_a4', label: 'A4 Landscape', resLabel: '3508 × 2480 px', desc: 'Peta konsep lebar, matriks & alur' },
    { id: 'digital_screen', label: 'Layar Digital 16:9', resLabel: '1920 × 1080 px', desc: 'Proyektor kelas & presentasi layar' }
];

const PAGE_PREFERENCE_OPTIONS: { id: PageCountPreference; label: string }[] = [
    { id: 'auto', label: 'Otomatis AI' },
    { id: 1, label: '1 Halaman' },
    { id: 2, label: '2 Halaman' },
    { id: 3, label: '3 Halaman' },
    { id: 4, label: '4 Halaman' }
];

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
    orientation: PageOrientationMode;
    theme: MateriVisualTheme;
    visiblePageNo?: number | null;
}

const PpaDocumentSheet: React.FC<PpaDocumentSheetProps> = ({
    data,
    identity,
    isPrintMode,
    orientation,
    theme,
    visiblePageNo = null
}) => {
    const tplMeta = MATERI_AJAR_TEMPLATES.find(t => t.id === data.templateId) || MATERI_AJAR_TEMPLATES[0];
    const cityName = identity.location || identity.city || 'Sukatinggal';
    const todayStr = formatIndonesianDate();

    const faseInfo = getFaseInfoForClass(data.className);
    const bodyTextClass = faseInfo.id === 'A' ? 'text-[13px]' : faseInfo.id === 'B' ? 'text-[12.5px]' : 'text-xs';
    const headingTextClass = faseInfo.id === 'A' ? 'text-sm' : 'text-xs';
    const isLandscape = orientation === 'landscape_a4' || orientation === 'digital_screen' || orientation === 'digital_4_5';

    const pages: MateriDocumentPage[] = useMemo(() => {
        if (Array.isArray(data.pages) && data.pages.length > 0) {
            return data.pages;
        }
        return buildLogicalDocumentPages({
            title: data.title,
            subject: data.subject,
            templateId: data.templateId,
            focusLevel: data.focusLevel,
            pageCountPreference: data.pageCountPreference || 'auto'
        });
    }, [data.pages, data.title, data.subject, data.templateId, data.focusLevel, data.pageCountPreference]);

    const totalPages = pages.length;

    const introText =
        data.pengantarSingkat ||
        data.pemahamanBermakna ||
        data.ringkasanKonsepInti ||
        `Mari pelajari materi ${data.title} secara runtut sesuai pengalaman belajar di kelas.`;

    const experienceHook =
        data.kaitanPengalamanSiswa ||
        `Pernahkah kalian mengamati penerapan ${data.title} di lingkungan sekolah atau rumah?`;

    const conceptDefinition =
        data.pengertianKonsep ||
        data.ringkasanKonsepInti ||
        `${data.title} merupakan kompetensi inti pada mata pelajaran ${data.subject} (${data.elementName}).`;

    const mainExplanation =
        data.penjelasanUtama ||
        data.ringkasanKonsepInti ||
        `Peserta didik memahami konsep utama secara runtut sesuai ${data.className} dan menerapkannya secara tepat.`;

    const keyPoints = (data.poinPenting && data.poinPenting.length > 0)
        ? data.poinPenting
        : (data.kataKunci || []).map(k => `${k.term}: ${k.meaning}`);

    const unsurPenting = (data.unsurPenting && data.unsurPenting.length > 0)
        ? data.unsurPenting
        : keyPoints.slice(0, 3);

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

    const practiceQuestions = (data.latihanFormatif || []).slice(0, 4);
    const references = (data.referensi && data.referensi.length > 0)
        ? data.referensi
        : buildVerifiableReferences(data.subject, data.className);

    const renderPageHeader = (page: MateriDocumentPage) => (
        <div
            className="rounded-2xl overflow-hidden border bg-white"
            style={{ borderColor: theme.borderHex }}
        >
            <div className="px-5 py-4 text-white space-y-2" style={{ backgroundColor: theme.primaryHex }}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-white/90">
                    <span>
                        {data.subject} · {data.className} ({data.fase}) · {tplMeta.name}
                    </span>
                    <span className="tabular-nums">
                        Halaman {page.pageNo} / {totalPages}
                    </span>
                </div>
                <div>
                    <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-tight">
                        {page.pageNo === 1 ? data.title : page.heading}
                    </h2>
                    <p className="text-xs text-white/90 mt-0.5 leading-snug">
                        {page.pageNo === 1 ? (data.subtitle || page.subtitle) : `${data.title} — ${page.subtitle}`}
                    </p>
                </div>

                {page.pageNo === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                        <div className="rounded-xl bg-white/15 border border-white/25 px-3.5 py-2 text-xs">
                            <div className="text-[10.5px] font-bold text-white/85">
                                Tujuan Pembelajaran (TP Terkunci)
                            </div>
                            <p className="text-white font-medium leading-relaxed mt-0.5">{data.tpText}</p>
                        </div>
                        <div className="rounded-xl bg-white/15 border border-white/25 px-3.5 py-2 text-xs">
                            <div className="text-[10.5px] font-bold text-white/85">
                                {data.focusLevel === 'tp'
                                    ? `Cakupan Luas TP (${data.relatedAtps?.length || 1} ATP Terkait)`
                                    : 'Fokus Spesifik Butir ATP Terkunci'}
                            </div>
                            <p className="text-white font-medium leading-relaxed mt-0.5">
                                {data.atpText || data.tpText}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                <span>
                    <strong className="text-slate-900">{identity.institutionName || data.curriculumMeta?.institutionName || 'Satuan Pendidikan SD/MI'}</strong>
                    {identity.npsn ? ` · NPSN ${identity.npsn}` : ''}
                </span>
                <span>Elemen: <strong className="text-slate-900">{data.elementName}</strong></span>
                <span className="tabular-nums">TA {data.academicYear} (Smt {data.semester}) · {data.alokasiWaktu || '3 JP'}</span>
            </div>
        </div>
    );

    const renderPageFooter = (pageNo: number) => (
        <div className="pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-slate-500">
            <span>
                {identity.institutionName || 'SD/MI'} · {data.subject} ({data.className}) · Materi Ajar Visual Kurikulum Merdeka
            </span>
            <span className="tabular-nums font-semibold">Halaman {pageNo} dari {totalPages}</span>
        </div>
    );

    const visiblePages = visiblePageNo
        ? pages.filter(p => p.pageNo === visiblePageNo)
        : pages;

    return (
        <div className="space-y-6">
            {visiblePages.map((page) => {
                // Page 1: visual_master
                if (page.kind === 'visual_master') {
                    return (
                        <div
                            key={page.pageNo}
                            data-materi-page={page.pageNo}
                            className="rounded-3xl border-2 bg-white p-4 sm:p-6 space-y-4 text-slate-900 shadow-xs"
                            style={{ borderColor: theme.primaryHex }}
                        >
                            {renderPageHeader(page)}

                            {/* Pengantar & Pemantik */}
                            <div className={`grid grid-cols-1 ${isLandscape ? 'md:grid-cols-2' : 'md:grid-cols-2'} gap-3`}>
                                <div className="rounded-2xl border p-3.5 space-y-2" style={{ backgroundColor: theme.surfaceHex, borderColor: theme.borderHex }}>
                                    <div className="text-xs font-extrabold" style={{ color: theme.darkHex }}>
                                        Pengantar &amp; Konteks Pengalaman Siswa
                                    </div>
                                    <p className={`${bodyTextClass} text-slate-800 leading-relaxed`}>{introText}</p>
                                    <div className="bg-white border rounded-xl p-2.5 text-[11.5px]" style={{ borderColor: theme.borderHex, color: theme.darkHex }}>
                                        <span className="font-bold">Kaitan Nyata: </span>
                                        {experienceHook}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 space-y-2">
                                    <div className="text-xs font-extrabold text-amber-950">
                                        Pertanyaan Pemantik &amp; Target KKO
                                    </div>
                                    <ul className="space-y-1.5">
                                        {(data.pertanyaanPemantik || []).slice(0, 3).map((q, idx) => (
                                            <li key={idx} className={`${bodyTextClass} text-slate-800 leading-snug flex items-start gap-2`}>
                                                <span className="font-extrabold text-amber-700 shrink-0 tabular-nums">{idx + 1}.</span>
                                                <span>{q}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    {data.tpAtpAnalysis && (
                                        <div className="bg-white border border-amber-200/80 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-700">
                                            <span className="font-bold text-amber-900">Target KKO ({data.tpAtpAnalysis.kataKerjaOperasional}): </span>
                                            {data.tpAtpAnalysis.buktiPemahaman}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Pembahasan Inti */}
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                                    <h3 className={`${headingTextClass} font-extrabold text-slate-900`}>
                                        Pembahasan Inti Materi
                                    </h3>
                                    <span className="text-[11px] text-slate-600">
                                        CP: {data.capaianPembelajaran.length > 96 ? `${data.capaianPembelajaran.slice(0, 94)}…` : data.capaianPembelajaran}
                                    </span>
                                </div>

                                <div className={`grid grid-cols-1 ${isLandscape ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-3`}>
                                    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
                                        <div className="text-[11px] font-extrabold" style={{ color: theme.primaryHex }}>Pengertian Konsep</div>
                                        <p className={`${bodyTextClass} text-slate-800 leading-relaxed`}>{conceptDefinition}</p>
                                    </div>
                                    <div className={`bg-white border border-slate-200 rounded-xl p-3 space-y-1 ${isLandscape ? 'md:col-span-2' : ''}`}>
                                        <div className="text-[11px] font-extrabold" style={{ color: theme.primaryHex }}>Penjelasan Sistematis</div>
                                        <p className={`${bodyTextClass} text-slate-800 leading-relaxed`}>{mainExplanation}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1.5">
                                        <div className="text-[11px] font-extrabold text-slate-800">Unsur &amp; Poin Penting</div>
                                        <ul className="space-y-1">
                                            {unsurPenting.slice(0, 4).map((pt, idx) => (
                                                <li key={idx} className={`${bodyTextClass} text-slate-700 leading-snug flex items-start gap-2`}>
                                                    <span className="font-extrabold shrink-0 tabular-nums" style={{ color: theme.primaryHex }}>{idx + 1}.</span>
                                                    <span>{pt}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1.5">
                                        <div className="text-[11px] font-extrabold text-emerald-900">Contoh Konkret Terpilih</div>
                                        <p className={`${bodyTextClass} text-slate-800 leading-relaxed`}>{concreteExample}</p>
                                    </div>
                                </div>

                                {data.tabelInformatif && data.tabelInformatif.baris?.length > 0 && (
                                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                        <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-800">
                                            {data.tabelInformatif.judul}
                                        </div>
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                    {(data.tabelInformatif.kolom || []).map((col, idx) => (
                                                        <th key={idx} className="px-3 py-1.5 text-[11px] font-bold text-slate-700">{col}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {(data.tabelInformatif.baris || []).map((row, rIdx) => (
                                                    <tr key={rIdx}>
                                                        {row.map((cell, cIdx) => (
                                                            <td key={cIdx} className={`px-3 py-1.5 ${bodyTextClass} text-slate-700 align-top leading-snug`}>
                                                                {cIdx === 0 ? <strong className="text-slate-900">{cell}</strong> : cell}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* SAJIAN DESAIN VISUAL UTAMA (29 TEMPLATES) */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-700">
                                    <span>Sajian Desain Visual: {tplMeta.name} ({tplMeta.subtitle})</span>
                                    <span className="text-[11px] font-medium text-slate-500">Tema {theme.name}</span>
                                </div>
                                <MateriAjarTemplateRenderer data={data} theme={theme} isPrintMode={isPrintMode} />
                            </div>

                            {/* ILUSTRASI PENDUKUNG KONSEP */}
                            <PosterIllustrationFrame data={data} theme={theme} />

                            {/* Jika mode 1 halaman penuh, tampilkan ringkasan & latihan singkat agar lengkap */}
                            {totalPages === 1 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5">
                                        <div className="text-xs font-extrabold text-slate-900">Rangkuman Inti</div>
                                        <ul className="space-y-1">
                                            {summaryPoints.slice(0, 4).map((pt, i) => (
                                                <li key={i} className="text-[11.5px] text-slate-700 leading-snug">
                                                    <span className="font-bold tabular-nums">{i + 1}. </span>{pt}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-1.5">
                                        <div className="text-xs font-extrabold text-slate-900">Latihan Pemahaman Cepat</div>
                                        <ul className="space-y-1">
                                            {practiceQuestions.slice(0, 3).map((lat) => (
                                                <li key={lat.no} className="text-[11.5px] text-slate-700 leading-snug">
                                                    <span className="font-bold tabular-nums">{lat.no}. </span>{lat.pertanyaan}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {renderPageFooter(page.pageNo)}
                        </div>
                    );
                }

                // Page 2: subtopics_deep
                if (page.kind === 'subtopics_deep') {
                    return (
                        <div
                            key={page.pageNo}
                            data-materi-page={page.pageNo}
                            className="rounded-3xl border-2 bg-white p-4 sm:p-6 space-y-4 text-slate-900 shadow-xs"
                            style={{ borderColor: theme.primaryHex }}
                        >
                            {renderPageHeader(page)}

                            {data.focusLevel === 'tp' && data.relatedAtps && data.relatedAtps.length > 0 && (
                                <div className="rounded-2xl border p-4 space-y-2" style={{ backgroundColor: theme.surfaceHex, borderColor: theme.borderHex }}>
                                    <div className="text-xs font-extrabold" style={{ color: theme.darkHex }}>
                                        Peta Keterkaitan Alur Tujuan Pembelajaran (Mode TP Cakupan Luas)
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {data.relatedAtps.map((atpStr, idx) => (
                                            <div key={idx} className="bg-white border rounded-xl px-3 py-2 text-xs text-slate-800 flex items-start gap-2" style={{ borderColor: theme.borderHex }}>
                                                <span className="font-bold tabular-nums shrink-0" style={{ color: theme.primaryHex }}>ATP {idx + 1}.</span>
                                                <span>{atpStr}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {data.klasifikasiAtauProses && (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-2.5">
                                    <div className="text-xs font-extrabold text-slate-900">{data.klasifikasiAtauProses.judul}</div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                                        {(data.klasifikasiAtauProses.butir || []).map((b, idx) => (
                                            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
                                                <div className="text-xs font-bold" style={{ color: theme.primaryHex }}>{b.label}</div>
                                                <p className="text-xs text-slate-700 leading-relaxed">{b.uraian}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {data.pendalamanMateri && (
                                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/45 p-4 space-y-3">
                                    <h3 className={`${headingTextClass} font-extrabold text-indigo-950`}>
                                        Pendalaman Pemahaman &amp; Pelurusan Miskonsepsi
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="bg-white border border-indigo-200 rounded-xl p-3 space-y-1.5">
                                            <div className="text-[11px] font-bold text-indigo-900">Analisis &amp; Fakta Teridentifikasi</div>
                                            <p className={`${bodyTextClass} text-slate-700 leading-relaxed`}>
                                                {data.pendalamanMateri.analisisSederhana}
                                            </p>
                                            <ul className="space-y-1 pt-1">
                                                {(data.pendalamanMateri.faktaTeridentifikasi || []).map((f, i) => (
                                                    <li key={i} className="text-[11.5px] text-slate-700">• {f}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="bg-white border border-indigo-200 rounded-xl p-3 space-y-2">
                                            <div className="text-[11px] font-bold text-indigo-900">Miskonsepsi Umum &amp; Pelurusan Ilmiah</div>
                                            <div className="space-y-2">
                                                {(data.pendalamanMateri.miskonsepsiUmum || []).map((m, idx) => (
                                                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1 text-[11.5px]">
                                                        <div className="text-rose-800 font-semibold">Keliru dipahami: {m.salah}</div>
                                                        <div className="text-emerald-800 font-semibold">Pemahaman benar: {m.pelurusan}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/55 p-3.5 space-y-2">
                                    <h3 className={`${headingTextClass} font-extrabold text-emerald-950`}>
                                        Penerapan Kehidupan Sehari-hari
                                    </h3>
                                    <ul className="space-y-1.5">
                                        {dailyExamples.slice(0, 4).map((ex, idx) => (
                                            <li key={idx} className={`bg-white border border-emerald-200/80 rounded-xl px-3 py-2 ${bodyTextClass} text-slate-800 leading-snug flex items-start gap-2`}>
                                                <span className="font-extrabold text-emerald-700 shrink-0 tabular-nums">{idx + 1}.</span>
                                                <span>{ex}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="rounded-2xl border border-violet-200 bg-violet-50/55 p-3.5 space-y-2 flex flex-col justify-between">
                                    <div className="space-y-2">
                                        <h3 className={`${headingTextClass} font-extrabold text-violet-950`}>
                                            Aktivitas Siswa Terarah
                                        </h3>
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
                                    <div className="bg-violet-100/70 border border-violet-200 rounded-xl px-3 py-2 text-[11px] text-violet-950">
                                        <span className="font-bold">Hasil Diharapkan: </span>{studentActivity.hasilDiharapkan}
                                    </div>
                                </div>
                            </div>

                            {totalPages === 2 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5">
                                        <div className="text-xs font-extrabold text-slate-900">Rangkuman Poin Utama</div>
                                        <ul className="space-y-1">
                                            {summaryPoints.map((pt, idx) => (
                                                <li key={idx} className="text-[11.5px] text-slate-700 leading-snug">
                                                    <span className="font-bold tabular-nums">{idx + 1}. </span>{pt}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-3.5 space-y-1.5">
                                        <div className="text-xs font-extrabold text-blue-950">Latihan Pemahaman &amp; Kunci Singkat</div>
                                        <ul className="space-y-1.5">
                                            {practiceQuestions.slice(0, 3).map((lat) => (
                                                <li key={lat.no} className="text-[11.5px] text-slate-800 leading-snug">
                                                    <span className="font-bold text-blue-800 tabular-nums">{lat.no}. </span>{lat.pertanyaan}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {renderPageFooter(page.pageNo)}
                        </div>
                    );
                }

                // Page 3: practice_application
                if (page.kind === 'practice_application') {
                    return (
                        <div
                            key={page.pageNo}
                            data-materi-page={page.pageNo}
                            className="rounded-3xl border-2 bg-white p-4 sm:p-6 space-y-4 text-slate-900 shadow-xs"
                            style={{ borderColor: theme.primaryHex }}
                        >
                            {renderPageHeader(page)}

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                                <div className="text-xs font-extrabold text-slate-900">Rangkuman Inti Materi</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {summaryPoints.map((pt, idx) => (
                                        <div key={idx} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 flex items-start gap-2">
                                            <span className="font-extrabold tabular-nums shrink-0" style={{ color: theme.primaryHex }}>{idx + 1}.</span>
                                            <span>{pt}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Lembar Latihan Siswa */}
                            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-2.5">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className={`${headingTextClass} font-extrabold text-blue-950`}>
                                        Pemeriksaan Pemahaman Siswa (Latihan Formatif)
                                    </h3>
                                    <span className="text-[11px] font-semibold text-blue-800">Dikerjakan peserta didik</span>
                                </div>
                                <div className="space-y-2">
                                    {practiceQuestions.map((lat) => (
                                        <div key={lat.no} className="bg-white border border-blue-200/80 rounded-xl p-3 space-y-2">
                                            <div className={`${bodyTextClass} font-semibold text-slate-900 flex items-start gap-2 leading-snug`}>
                                                <span className="font-extrabold text-blue-700 shrink-0 tabular-nums">{lat.no}.</span>
                                                <span>{lat.pertanyaan}</span>
                                            </div>
                                            <div className="h-5 border-b border-dashed border-slate-300 ml-5" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Bagian Khusus Guru */}
                            <div className="rounded-2xl border border-slate-300 bg-slate-100/80 p-4 space-y-2.5">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="text-xs font-extrabold text-slate-900">
                                        Bagian Khusus Guru — Panduan Kunci Jawaban &amp; Verifikasi
                                    </div>
                                    <span className="text-[11px] font-semibold text-slate-600">Terpisah dari lembar siswa</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                                    {practiceQuestions.map((lat) => (
                                        <div key={lat.no} className="bg-white border border-slate-200 rounded-xl p-2.5 text-[11.5px] text-slate-700">
                                            <span className="font-bold text-slate-900">Kunci No. {lat.no}: </span>
                                            {lat.kunciSingkat}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Referensi Resmi */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-xs font-extrabold text-slate-900">Daftar Referensi &amp; Landasan Kurikulum Resmi</h3>
                                    <span className="text-[11px] text-slate-500">Tanpa sitasi karangan</span>
                                </div>
                                <div className="space-y-1.5">
                                    {references.map((refItem, idx) => (
                                        <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                            <div className="space-y-0.5">
                                                <div className="font-bold text-slate-900">{idx + 1}. {refItem.title}</div>
                                                <div className="text-slate-600">{refItem.category} · Sumber: {refItem.source} — {refItem.note}</div>
                                            </div>
                                            <span className={`text-[10.5px] font-bold shrink-0 ${refItem.status === 'Teridentifikasi' ? 'text-emerald-800' : 'text-amber-800'}`}>
                                                {refItem.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {totalPages === 3 && (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
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
                            )}

                            {renderPageFooter(page.pageNo)}
                        </div>
                    );
                }

                // Page 4: summary_ref
                if (page.kind === 'summary_ref') {
                    return (
                        <div
                            key={page.pageNo}
                            data-materi-page={page.pageNo}
                            className="rounded-3xl border-2 bg-white p-4 sm:p-6 space-y-4 text-slate-900 shadow-xs"
                            style={{ borderColor: theme.primaryHex }}
                        >
                            {renderPageHeader(page)}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                <div className="rounded-2xl border border-amber-200 bg-amber-50/45 p-4 space-y-2">
                                    <div className="text-xs font-extrabold text-amber-950">Glosarium Kosakata Penting</div>
                                    <div className="space-y-1.5">
                                        {(data.kataKunci || []).map((kw, i) => (
                                            <div key={i} className="bg-white border border-amber-200/80 rounded-xl px-3 py-2 text-xs text-slate-800">
                                                <span className="font-bold text-amber-900">{kw.term}: </span>{kw.meaning}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-2xl border p-4 space-y-2" style={{ backgroundColor: theme.surfaceHex, borderColor: theme.borderHex }}>
                                    <div className="text-xs font-extrabold" style={{ color: theme.darkHex }}>Refleksi Pembelajaran Siswa</div>
                                    <ul className="space-y-2">
                                        {(data.refleksiSiswa || []).map((refItem, idx) => (
                                            <li key={idx} className="bg-white border rounded-xl p-2.5 text-xs text-slate-800" style={{ borderColor: theme.borderHex }}>
                                                <div className="font-semibold mb-1">{idx + 1}. {refItem}</div>
                                                <div className="h-4 border-b border-dashed border-slate-300" />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {(data.teacherNotes || []).length > 0 && (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                                    <div className="text-xs font-bold text-slate-900">Catatan Verifikasi &amp; Penggunaan Guru</div>
                                    {(data.teacherNotes || []).map((note, idx) => (
                                        <div key={idx} className="text-xs text-slate-700 leading-relaxed">• {note}</div>
                                    ))}
                                </div>
                            )}

                            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                                <div className="grid grid-cols-2 gap-4 text-[11px] text-center text-slate-700">
                                    <div>
                                        <div>Mengetahui, Kepala {identity.institutionName || 'Sekolah Dasar'}</div>
                                        <div className="font-bold text-slate-900 mt-6 underline">{identity.kepalaSekolah || '..........................................'}</div>
                                        <div className="text-[10px] text-slate-500">NIP. {identity.nipKepalaSekolah || '....................................'}</div>
                                    </div>
                                    <div>
                                        <div>{cityName}, {todayStr} · Guru Kelas / Pengampu</div>
                                        <div className="font-bold text-slate-900 mt-6 underline">{identity.authorName || '..........................................'}</div>
                                        <div className="text-[10px] text-slate-500">NIP. {identity.nip || '....................................'}</div>
                                    </div>
                                </div>
                            </div>

                            {renderPageFooter(page.pageNo)}
                        </div>
                    );
                }

                // Custom Added Page (page.kind === 'custom_note')
                return (
                    <div
                        key={page.pageNo}
                        data-materi-page={page.pageNo}
                        className="rounded-3xl border-2 bg-white p-4 sm:p-6 space-y-4 text-slate-900 shadow-xs"
                        style={{ borderColor: theme.primaryHex }}
                    >
                        {renderPageHeader(page)}
                        <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: theme.surfaceHex, borderColor: theme.borderHex }}>
                            <div className="text-xs font-extrabold" style={{ color: theme.darkHex }}>
                                Catatan Pengayaan &amp; Ruang Kerja Peserta Didik
                            </div>
                            <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                                {page.customNote || `Gunakan halaman tambahan ini untuk diskusi kelompok, menggambar pengamatan, atau menuliskan kesimpulan pribadi siswa mengenai topik "${data.title}".`}
                            </p>
                            <div className="bg-white border rounded-xl p-4 space-y-3" style={{ borderColor: theme.borderHex }}>
                                <div className="text-[11px] font-bold text-slate-500">Lembar Catatan Siswa</div>
                                {[1, 2, 3, 4, 5].map(line => (
                                    <div key={line} className="h-6 border-b border-dashed border-slate-300" />
                                ))}
                            </div>
                        </div>
                        {renderPageFooter(page.pageNo)}
                    </div>
                );
            })}
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

    const hierarchyTree = useMemo(
        () => buildMateriAjarHierarchy(activeSubject, activeClass, matchingProtaSource),
        [activeSubject, activeClass, matchingProtaSource]
    );

    const [selectedElementId, setSelectedElementId] = useState<string>('');
    const [selectedTpId, setSelectedTpId] = useState<string>('');
    const [selectedAtpId, setSelectedAtpId] = useState<string>('');
    const [focusLevel, setFocusLevel] = useState<HierarchyFocusLevel>('tp');

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

    const relatedAtpList = useMemo(
        () => (activeTp?.atpItems || []).map(a => a.alur).filter(Boolean),
        [activeTp]
    );

    const lockedAtpText = useMemo(() => {
        if (!activeElement || !activeTp) return '';
        if (focusLevel === 'tp') {
            return relatedAtpList.join(' → ') || activeTp.tp;
        }
        return activeAtp?.alur || activeTp.tp;
    }, [activeElement, activeTp, activeAtp, focusLevel, relatedAtpList]);

    const curriculumCheck = useMemo(() => {
        return validateLockedCurriculumInputs({
            subject: activeSubject,
            className: activeClass,
            fase: hierarchyTree.fase,
            elementName: activeElement?.elementName || '',
            capaianPembelajaran: activeElement?.capaianPembelajaran || '',
            tpText: activeTp?.tp || '',
            atpText: lockedAtpText,
            focusLevel,
            sourceFase: matchingProtaSource?.data?.fase,
            isProtaLocked: hierarchyTree.sourceType === 'locked_prota'
        });
    }, [activeSubject, activeClass, hierarchyTree, activeElement, activeTp, lockedAtpText, focusLevel, matchingProtaSource]);

    const baselineAnalysis = useMemo(() => {
        return analyzeTpAtpDeterministic(
            activeSubject,
            activeClass,
            activeElement?.elementName || '',
            activeElement?.capaianPembelajaran || '',
            activeTp?.tp || '',
            lockedAtpText
        );
    }, [activeSubject, activeClass, activeElement, activeTp, lockedAtpText]);

    const [aiAnalysis, setAiAnalysis] = useState<TpAtpAnalysisResult | null>(null);
    const [isAnalyzingTp, setIsAnalyzingTp] = useState<boolean>(false);

    useEffect(() => {
        setAiAnalysis(null);
    }, [activeSubject, activeClass, activeElement?.id, activeTp?.id, activeAtp?.id, focusLevel]);

    const currentAnalysis = aiAnalysis || baselineAnalysis;

    // 29-Template Mode, Catalog Filter, Orientation, Page Count & Theme
    const [selectionMode, setSelectionMode] = useState<'rekomendasi' | 'manual'>('rekomendasi');
    const [manualTemplateId, setManualTemplateId] = useState<MateriTemplateId>('educational_infographic');
    const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<'ALL' | MateriTemplateCategoryId>('ALL');
    const [catalogSearch, setCatalogSearch] = useState<string>('');
    const [orientation, setOrientation] = useState<PageOrientationMode>('portrait_a4');
    const [orientationPinned, setOrientationPinned] = useState<boolean>(false);
    const [pageCountPref, setPageCountPref] = useState<PageCountPreference>('auto');
    const [selectedThemeId, setSelectedThemeId] = useState<MateriVisualThemeId>('zamrud_edukatif');
    const [revisionNote, setRevisionNote] = useState<string>('');

    const smartRecommendation = useMemo(() => {
        const baseRec = recommendTemplateForFocus(
            activeSubject,
            activeElement?.elementName || '',
            activeElement?.capaianPembelajaran || '',
            activeTp?.tp || '',
            focusLevel === 'atp' ? (activeAtp?.alur || '') : ''
        );
        if (aiAnalysis) {
            return {
                recommendedId: aiAnalysis.recommendedTemplateId,
                reason: aiAnalysis.recommendedReason,
                alternatives: aiAnalysis.alternativeTemplates?.length ? aiAnalysis.alternativeTemplates : baseRec.alternatives
            };
        }
        return baseRec;
    }, [activeSubject, activeElement, activeTp, activeAtp, focusLevel, aiAnalysis]);

    const effectiveTemplateId: MateriTemplateId =
        selectionMode === 'rekomendasi' ? smartRecommendation.recommendedId : manualTemplateId;

    useEffect(() => {
        if (!orientationPinned) {
            setOrientation(getRecommendedOrientationForTemplate(effectiveTemplateId));
        }
    }, [effectiveTemplateId, orientationPinned]);

    const filteredTemplates = useMemo(() => {
        const q = catalogSearch.trim().toLowerCase();
        return MATERI_AJAR_TEMPLATES.filter(tpl => {
            const catOk = catalogCategoryFilter === 'ALL' || tpl.category === catalogCategoryFilter;
            if (!catOk) return false;
            if (!q) return true;
            return (
                tpl.name.toLowerCase().includes(q) ||
                tpl.subtitle.toLowerCase().includes(q) ||
                tpl.description.toLowerCase().includes(q) ||
                tpl.bestFor.toLowerCase().includes(q)
            );
        });
    }, [catalogCategoryFilter, catalogSearch]);

    const manualSuitabilityNotice = useMemo(() => {
        if (selectionMode !== 'manual') return undefined;
        return checkTemplateSuitability(
            manualTemplateId,
            smartRecommendation.recommendedId,
            activeSubject,
            activeTp?.tp || ''
        );
    }, [selectionMode, manualTemplateId, smartRecommendation.recommendedId, activeSubject, activeTp?.tp]);

    // Studio State: Preview, Zoom, Live Editor, Undo History, Archive, PNG Export
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [pipelineProgress, setPipelineProgress] = useState<{ step: number; label: string }>({ step: 0, label: '' });
    const [isExportingSingle, setIsExportingSingle] = useState<boolean>(false);
    const [isExportingAll, setIsExportingAll] = useState<boolean>(false);

    const [generatedMateri, setGeneratedMateri] = useState<GeneratedMateriAjarData | null>(null);
    const [historyStack, setHistoryStack] = useState<GeneratedMateriAjarData[]>([]);
    const [previewViewMode, setPreviewViewMode] = useState<'all' | 'single'>('all');
    const [activePreviewPage, setActivePreviewPage] = useState<number>(1);
    const [zoomScale, setZoomScale] = useState<number>(1);
    const [isLiveEditing, setIsLiveEditing] = useState<boolean>(false);

    const [domCheck, setDomCheck] = useState<DomVerificationResult | null>(null);
    const [archiveList, setArchiveList] = useState<GeneratedMateriAjarData[]>([]);
    const [showQcDetails, setShowQcDetails] = useState<boolean>(false);

    const pngCaptureRef = useRef<HTMLDivElement | null>(null);
    const archiveStorageKey = useMemo(
        () => getMateriAjarArchiveKey(user, registeredClass),
        [user?.email, user?.name, registeredClass]
    );

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

    const activeOrientation: PageOrientationMode =
        generatedMateri?.curriculumMeta?.orientation || orientation;

    const activeTheme: MateriVisualTheme = useMemo(() => {
        const id = generatedMateri?.themeId || selectedThemeId;
        return MATERI_VISUAL_THEMES.find(t => t.id === id) || MATERI_VISUAL_THEMES[0];
    }, [generatedMateri?.themeId, selectedThemeId]);

    const activePages: MateriDocumentPage[] = useMemo(() => {
        if (!generatedMateri) return [];
        if (Array.isArray(generatedMateri.pages) && generatedMateri.pages.length > 0) {
            return generatedMateri.pages;
        }
        return buildLogicalDocumentPages({
            title: generatedMateri.title,
            subject: generatedMateri.subject,
            templateId: generatedMateri.templateId,
            focusLevel: generatedMateri.focusLevel,
            pageCountPreference: generatedMateri.pageCountPreference || 'auto'
        });
    }, [generatedMateri]);

    useEffect(() => {
        if (activePages.length > 0 && activePreviewPage > activePages.length) {
            setActivePreviewPage(activePages.length);
        }
    }, [activePages.length, activePreviewPage]);

    useEffect(() => {
        if (!generatedMateri) {
            setDomCheck(null);
            return;
        }
        const timer = setTimeout(() => {
            setDomCheck(verifyRenderedMateriDom(pngCaptureRef.current));
        }, 180);
        return () => clearTimeout(timer);
    }, [generatedMateri, activeOrientation, activeTheme.id]);

    const saveToArchive = (item: GeneratedMateriAjarData) => {
        setArchiveList(prev => {
            const next = [item, ...prev.filter(x => x.id !== item.id)].slice(0, 20);
            try {
                localStorage.setItem(archiveStorageKey, JSON.stringify(next));
            } catch {}
            return next;
        });
    };

    const commitMateriEdit = (updater: (prev: GeneratedMateriAjarData) => GeneratedMateriAjarData) => {
        if (!generatedMateri) return;
        setHistoryStack(prev => [generatedMateri, ...prev].slice(0, 15));
        const nextRaw = updater(generatedMateri);
        const rechecked = {
            ...nextRaw,
            qualityControl: evaluateMateriQualityControl(nextRaw, {
                subject: nextRaw.subject,
                className: nextRaw.className,
                fase: nextRaw.fase,
                elementName: nextRaw.elementName,
                capaianPembelajaran: nextRaw.capaianPembelajaran,
                tpText: nextRaw.tpText,
                atpText: nextRaw.atpText,
                templateId: nextRaw.templateId,
                selectionMode: nextRaw.selectionMode
            })
        };
        setGeneratedMateri(rechecked);
        saveToArchive(rechecked);
    };

    const handleUndo = () => {
        if (historyStack.length === 0) return;
        const [previous, ...rest] = historyStack;
        setHistoryStack(rest);
        setGeneratedMateri(previous);
        saveToArchive(previous);
        notify('Perubahan dikembalikan ke versi sebelumnya.', 'info');
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

    const handleAnalyzeTpAtp = async () => {
        if (!curriculumCheck.valid || !activeElement || !activeTp) {
            notify('Periksa ketidaksesuaian data kurikulum terkunci terlebih dahulu sebelum analisis.', 'warning');
            return;
        }
        setIsAnalyzingTp(true);
        try {
            const result = await analyzeTpAtpWithAi({
                subject: activeSubject,
                className: activeClass,
                fase: hierarchyTree.fase,
                elementName: activeElement.elementName,
                capaianPembelajaran: activeElement.capaianPembelajaran,
                tpText: activeTp.tp,
                atpText: lockedAtpText
            });
            setAiAnalysis(result);
            notify(
                result.usedAi
                    ? `Analisis selesai! KKO "${result.kataKerjaOperasional}" & rekomendasi desain siap digunakan.`
                    : `Analisis kurikuler selesai dengan KKO "${result.kataKerjaOperasional}".`,
                'success'
            );
        } catch {
            setAiAnalysis(baselineAnalysis);
            notify('Analisis TP/ATP disusun dengan basis kurikuler lokal.', 'info');
        } finally {
            setIsAnalyzingTp(false);
        }
    };

    const handleGenerateMateri = async (useRevision = false) => {
        if (!curriculumCheck.valid || !activeElement || !activeTp) {
            notify('Proses dihentikan karena terdapat ketidaksesuaian atau kekosongan data kurikulum terkunci.', 'error');
            return;
        }

        setIsGenerating(true);
        setPipelineProgress({ step: 1, label: '1. Ambil & Kunci Data Kurikulum' });

        try {
            const semesterVal = String(activeTp.semester || userIdentity.semester || '1');
            const totalJpDisplay = focusLevel === 'atp'
                ? (activeAtp?.alokasiWaktu || '3 JP')
                : `${(activeTp.atpItems || []).length * 3 || 4} JP`;

            const targetTemplateId = useRevision && generatedMateri ? generatedMateri.templateId : effectiveTemplateId;
            const targetSelectionMode = useRevision && generatedMateri ? generatedMateri.selectionMode : selectionMode;

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
                atpText: lockedAtpText,
                relatedAtps: focusLevel === 'tp' ? relatedAtpList : undefined,
                alokasiWaktu: totalJpDisplay,
                templateId: targetTemplateId,
                themeId: selectedThemeId,
                selectionMode: targetSelectionMode,
                recommendationReason: targetSelectionMode === 'rekomendasi' ? smartRecommendation.reason : undefined,
                institutionName: userIdentity.institutionName || 'SD Negeri',
                isLockedSource: hierarchyTree.sourceType === 'locked_prota',
                orientation,
                pageCountPreference: pageCountPref,
                analysis: currentAnalysis,
                revisionInstruction: useRevision ? (revisionNote.trim() || 'Perkuat kejelasan visual dan kedalaman contoh sesuai TP/ATP terkunci.') : undefined,
                onProgress: (step, label) => setPipelineProgress({ step, label })
            });

            if (generatedMateri) {
                setHistoryStack(prev => [generatedMateri, ...prev].slice(0, 15));
            }
            setGeneratedMateri(data);
            setActivePreviewPage(1);
            saveToArchive(data);

            const tplName = MATERI_AJAR_TEMPLATES.find(t => t.id === targetTemplateId)?.name || targetTemplateId;
            if (data.qualityControl?.overallStatus === 'GAGAL') {
                notify(`Materi Ajar Visual (${tplName}) selesai tetapi Quality Gate menemukan item GAGAL.`, 'warning');
            } else {
                notify(
                    usedFallback
                        ? `Materi Ajar Visual (${tplName}) selesai disusun (${data.pages?.length || 1} halaman) dan siap diekspor PNG.`
                        : `Materi Ajar Visual (${tplName}) selesai melalui 10 tahap verifikasi (${data.pages?.length || 1} halaman)!`,
                    'success'
                );
            }
        } catch (err) {
            console.error(err);
            notify('Gagal menyusun materi ajar visual. Silakan coba kembali.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleLiveTemplateSwitch = (nextTemplateId: MateriTemplateId) => {
        if (!generatedMateri) return;
        const tplName = MATERI_AJAR_TEMPLATES.find(t => t.id === nextTemplateId)?.name || nextTemplateId;
        commitMateriEdit((prev) => ({
            ...prev,
            templateId: nextTemplateId,
            selectionMode: 'manual'
        }));
        notify(`Desain visual diganti seketika ke "${tplName}" tanpa menghapus isi materi.`, 'success');
    };

    const handleCycleDesignOnly = () => {
        if (!generatedMateri) return;
        const currentTpl = MATERI_AJAR_TEMPLATES.find(t => t.id === generatedMateri.templateId);
        const sameCategory = MATERI_AJAR_TEMPLATES.filter(t => t.category === currentTpl?.category);
        const pool = sameCategory.length > 1 ? sameCategory : MATERI_AJAR_TEMPLATES;
        const curIdx = pool.findIndex(t => t.id === generatedMateri.templateId);
        const nextTpl = pool[(curIdx + 1) % pool.length];
        handleLiveTemplateSwitch(nextTpl.id);
    };

    const handleRegenerateIllustration = () => {
        if (!generatedMateri) return;
        commitMateriEdit((prev) => regenerateMateriIllustration(prev));
        notify('Ilustrasi pendukung diperbarui ke varian visual baru.', 'success');
    };

    const handleThemeSwitch = (themeId: MateriVisualThemeId) => {
        setSelectedThemeId(themeId);
        if (!generatedMateri) return;
        commitMateriEdit((prev) => ({
            ...prev,
            themeId
        }));
    };

    const handleOrientationSwitchLive = (nextOrientation: PageOrientationMode) => {
        setOrientation(nextOrientation);
        setOrientationPinned(true);
        if (!generatedMateri) return;
        commitMateriEdit((prev) => ({
            ...prev,
            curriculumMeta: {
                curriculumName: prev.curriculumMeta?.curriculumName || 'Kurikulum Merdeka',
                jenjang: prev.curriculumMeta?.jenjang || 'SD/MI',
                institutionName: prev.curriculumMeta?.institutionName || userIdentity.institutionName || 'SD Negeri',
                isLockedSource: Boolean(prev.curriculumMeta?.isLockedSource),
                topicFocus: prev.curriculumMeta?.topicFocus || prev.title,
                orientation: nextOrientation
            }
        }));
    };

    const handleAddCustomPage = () => {
        if (!generatedMateri) return;
        const nextNo = activePages.length + 1;
        const newPage: MateriDocumentPage = {
            pageNo: nextNo,
            heading: `Lembar Pengayaan & Aktivitas Tambahan (${nextNo})`,
            subtitle: 'Catatan Guru & Ruang Kerja Siswa',
            kind: 'custom_note',
            customNote: `Tuliskan hasil pengamatan atau rangkuman mandiri kalian tentang "${generatedMateri.title}" pada ruang di bawah ini.`
        };
        commitMateriEdit((prev) => ({
            ...prev,
            pages: [...activePages, newPage]
        }));
        setActivePreviewPage(nextNo);
        notify(`Halaman ${nextNo} ditambahkan ke dokumen.`, 'success');
    };

    const handleRemoveCurrentPage = () => {
        if (!generatedMateri || activePages.length <= 1) return;
        const targetNo = previewViewMode === 'single' ? activePreviewPage : activePages[activePages.length - 1].pageNo;
        const remaining = activePages
            .filter(p => p.pageNo !== targetNo)
            .map((p, idx) => ({ ...p, pageNo: idx + 1 }));
        commitMateriEdit((prev) => ({
            ...prev,
            pages: remaining
        }));
        setActivePreviewPage(Math.min(activePreviewPage, remaining.length));
        notify('Halaman dihapus dari dokumen.', 'info');
    };

    const effectiveQualityControl = useMemo(() => {
        if (!generatedMateri) return null;
        const baseQc = generatedMateri.qualityControl || evaluateMateriQualityControl(generatedMateri, {
            subject: generatedMateri.subject,
            className: generatedMateri.className,
            fase: generatedMateri.fase,
            elementName: generatedMateri.elementName,
            capaianPembelajaran: generatedMateri.capaianPembelajaran,
            tpText: generatedMateri.tpText,
            atpText: generatedMateri.atpText,
            templateId: generatedMateri.templateId,
            selectionMode: generatedMateri.selectionMode
        });

        if (!domCheck) return baseQc;

        const updatedChecks = baseQc.checks.map(chk => {
            if (chk.id !== 8) return chk;
            if (domCheck.ok) {
                return {
                    ...chk,
                    status: 'lulus' as const,
                    detail: `Terverifikasi ${domCheck.pageCount} halaman utuh di DOM tanpa luapan horizontal atau gambar rusak (${getPngTargetSpec(activeOrientation).label}).`
                };
            }
            return {
                ...chk,
                status: 'perhatian' as const,
                detail: domCheck.issues.join(' ')
            };
        });

        const hasFail = updatedChecks.some(c => c.status === 'gagal');
        const hasAttention = updatedChecks.some(c => c.status === 'perhatian');
        return {
            ...baseQc,
            checks: updatedChecks,
            overallStatus: hasFail ? 'GAGAL' : hasAttention ? 'PERLU PERHATIAN' : 'LULUS'
        } as NonNullable<GeneratedMateriAjarData['qualityControl']>;
    }, [generatedMateri, domCheck, activeOrientation]);

    const isDownloadBlocked = effectiveQualityControl?.overallStatus === 'GAGAL';

    const autoFilenameBase = useMemo(() => {
        if (!generatedMateri) return 'MATERI_AJAR';
        return buildMateriAjarFilename(
            generatedMateri.subject,
            generatedMateri.className,
            generatedMateri.title,
            generatedMateri.academicYear
        );
    }, [generatedMateri]);

    const handleDownloadSinglePng = async () => {
        if (!generatedMateri || !pngCaptureRef.current || isDownloadBlocked) return;
        const pageNum = previewViewMode === 'single' ? activePreviewPage : 1;
        setIsExportingSingle(true);
        try {
            const res = await exportSingleMateriPagePng(pngCaptureRef.current, pageNum, {
                baseFilename: autoFilenameBase,
                orientation: activeOrientation
            });
            notify(`Berhasil mengunduh PNG Halaman ${pageNum} (${res.width} × ${res.height} px): ${res.filename}`, 'success');
        } catch (err) {
            console.error('Single PNG export error:', err);
            notify('Gagal mengekspor halaman PNG.', 'error');
        } finally {
            setIsExportingSingle(false);
        }
    };

    const handleDownloadAllPng = async () => {
        if (!generatedMateri || !pngCaptureRef.current || isDownloadBlocked) return;
        setIsExportingAll(true);
        try {
            const res = await exportMateriAjarPagesPng(pngCaptureRef.current, {
                baseFilename: autoFilenameBase,
                orientation: activeOrientation
            });
            notify(
                `Berhasil mengunduh ${res.pageCount} file PNG (${res.spec.width} × ${res.spec.height} px): ${res.downloadedFiles.join(', ')}`,
                'success'
            );
        } catch (err) {
            console.error('Multi PNG export error:', err);
            notify('Gagal mengekspor seluruh halaman PNG.', 'error');
        } finally {
            setIsExportingAll(false);
        }
    };

    const recommendedMeta = MATERI_AJAR_TEMPLATES.find(t => t.id === smartRecommendation.recommendedId) || MATERI_AJAR_TEMPLATES[0];
    const activeTemplateMeta = MATERI_AJAR_TEMPLATES.find(t => t.id === effectiveTemplateId) || MATERI_AJAR_TEMPLATES[0];
    const pngSpec = getPngTargetSpec(activeOrientation);
    const currentPreviewPageObj = activePages.find(p => p.pageNo === activePreviewPage) || activePages[0];

    return (
        <div className="space-y-6 pb-16">
            {/* TOP HERO & READ-ONLY PROFILE IDENTITY */}
            <section className="no-print bg-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-1.5 max-w-3xl">
                        <div className="text-xs font-medium text-emerald-300 flex flex-wrap items-center gap-2">
                            <span>Generator Materi Ajar Visual SD/MI</span>
                            <span aria-hidden="true">·</span>
                            <span>29 Desain Visual Pendidikan</span>
                            <span aria-hidden="true">·</span>
                            <span>Ekspor Eksklusif PNG 300 DPI</span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1">
                                {hierarchyTree.sourceType === 'locked_prota' ? (
                                    <><Lock className="w-3.5 h-3.5" /> Prota/ATP Terkunci</>
                                ) : hierarchyTree.sourceType === 'saved_prota' ? (
                                    <><Unlock className="w-3.5 h-3.5 text-amber-300" /> Prota Tersimpan</>
                                ) : (
                                    <><GraduationCap className="w-3.5 h-3.5 text-sky-300" /> Basis BSKAP 046</>
                                )}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                            Generator Materi Ajar Visual — Kurikulum Merdeka
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            Ubah TP atau ATP terkunci menjadi materi ajar visual berdesain struktur berbeda (Infografis, Peta Konsep, Proses, Perbandingan, Cerita, Kartu, hingga Diagram Sains) dengan pratinjau interaktif dan unduhan PNG resolusi tinggi.
                        </p>
                    </div>

                    <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5 text-xs space-y-1 shrink-0 min-w-[250px]">
                        <div className="text-[11px] font-semibold text-slate-400">Identitas Profil Terkunci</div>
                        <div className="font-bold text-white truncate">{userIdentity.institutionName || 'Satuan Pendidikan Belum Diisi'}</div>
                        <div className="text-slate-300 truncate">{userIdentity.authorName || 'Guru Pengampu'} · {activeClass} · TA {userIdentity.academicYear || '2025/2026'}</div>
                        <button
                            type="button"
                            onClick={() => onNavigate('dashboard')}
                            className="text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 underline cursor-pointer pt-0.5"
                        >
                            Kelola Identitas di Profil / Dasbor
                        </button>
                    </div>
                </div>

                {/* Read-Only Class Info (No Dropdown!) + Subject Selector */}
                <div className="pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <div className="block text-[11px] font-semibold text-slate-400 mb-1">Kelas &amp; Fase Target (Terkunci dari Profil)</div>
                        <div className="w-full h-10 px-3 rounded-xl bg-slate-800/70 border border-slate-700 text-xs font-bold text-amber-300 flex items-center justify-between gap-2">
                            <span className="truncate">{activeClass} · {hierarchyTree.fase}</span>
                            <span className="text-[11px] font-medium text-emerald-300 shrink-0">Profil Aktif</span>
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

            {/* MISMATCH / LOCKED DATA WARNING BANNER */}
            {(!curriculumCheck.valid || curriculumCheck.warnings.length > 0) && (
                <section
                    className={`no-print rounded-2xl p-4 border space-y-2 ${
                        !curriculumCheck.valid
                            ? 'bg-rose-50 border-rose-300 text-rose-950'
                            : 'bg-amber-50 border-amber-300 text-amber-950'
                    }`}
                >
                    <div className="flex items-center gap-2 text-xs font-bold">
                        <AlertTriangle className={`w-4 h-4 shrink-0 ${!curriculumCheck.valid ? 'text-rose-700' : 'text-amber-700'}`} />
                        <span>
                            {!curriculumCheck.valid
                                ? 'Peringatan Ketidaksesuaian Data Kurikulum Terkunci — Proses Generasi Dihentikan'
                                : 'Catatan Sumber Kurikulum Terkunci'}
                        </span>
                    </div>
                    {curriculumCheck.errors.map((err, i) => (
                        <p key={i} className="text-xs font-semibold leading-relaxed pl-6">• {err}</p>
                    ))}
                    {curriculumCheck.warnings.map((warn, i) => (
                        <p key={i} className="text-xs leading-relaxed pl-6">• {warn}</p>
                    ))}
                </section>
            )}

            {/* STEP 1: MODE CAKUPAN (TP LUAS vs ATP SPESIFIK) & DATA TERKUNCI */}
            <section className="no-print bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-emerald-700" />
                            <span>1. Mode Cakupan &amp; Fokus Kurikulum Terkunci</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Pilih mode cakupan luas berbasis 1 TP (menghimpun ATP terkait) atau fokus spesifik pada 1 butir ATP.
                        </p>
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
                        <button
                            type="button"
                            onClick={() => setFocusLevel('tp')}
                            className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                                focusLevel === 'tp'
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-700 hover:text-slate-900'
                            }`}
                        >
                            Mode TP (Cakupan Luas)
                        </button>
                        <button
                            type="button"
                            onClick={() => setFocusLevel('atp')}
                            className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                                focusLevel === 'atp'
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-700 hover:text-slate-900'
                            }`}
                        >
                            Mode ATP (Cakupan Spesifik)
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Level 1: Elemen & CP */}
                    <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/40">
                        <div className="text-xs font-bold text-slate-800">1. Elemen &amp; Capaian Pembelajaran</div>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
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
                    </div>

                    {/* Level 2: TP */}
                    <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/40">
                        <div className="text-xs font-bold text-slate-800">2. Tujuan Pembelajaran (TP Terkunci)</div>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                            {(activeElement?.tpNodes || []).map(tpNode => {
                                const active = tpNode.id === activeTp?.id;
                                return (
                                    <button
                                        key={tpNode.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedTpId(tpNode.id);
                                            if (tpNode.atpItems[0]) setSelectedAtpId(tpNode.atpItems[0].id);
                                        }}
                                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                                            active
                                                ? 'bg-blue-50 border-blue-500 text-blue-950 font-semibold'
                                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2 text-[11px] text-blue-700 font-bold mb-0.5">
                                            <span>TP {tpNode.index}</span>
                                            <span>Semester {tpNode.semester} · {tpNode.atpItems.length} ATP</span>
                                        </div>
                                        <div className="leading-relaxed">{tpNode.tp}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Level 3: Mode TP Auto-Gathered ATPs OR Mode ATP Single Selector */}
                    <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/40">
                        <div className="text-xs font-bold text-slate-800">
                            {focusLevel === 'tp'
                                ? `3. ATP Terkait Terhimpun Otomatis (${relatedAtpList.length})`
                                : '3. Pilih 1 Butir ATP Spesifik'}
                        </div>
                        {focusLevel === 'tp' ? (
                            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                {(activeTp?.atpItems || []).map(atp => (
                                    <div key={atp.id} className="bg-white border border-emerald-200 rounded-xl p-2.5 text-xs text-slate-800">
                                        <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-emerald-800 mb-0.5">
                                            <span>Alur {atp.index} (Terkait TP {activeTp?.index})</span>
                                            <span className="tabular-nums">{atp.alokasiWaktu}</span>
                                        </div>
                                        <div className="leading-relaxed">{atp.alur}</div>
                                    </div>
                                ))}
                                <p className="text-[11px] text-slate-500 pt-1">
                                    Mode TP menghimpun seluruh ATP yang berada di bawah TP terpilih saja tanpa menyertakan ATP dari TP lain.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                {(activeTp?.atpItems || []).map(atp => {
                                    const active = atp.id === activeAtp?.id;
                                    return (
                                        <button
                                            key={atp.id}
                                            type="button"
                                            onClick={() => setSelectedAtpId(atp.id)}
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
                        )}
                    </div>
                </div>

                {/* Panel Ringkasan Data Kurikulum Terkunci + Tombol ANALISIS TP/ATP */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-200">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                            <Lock className="w-4 h-4 text-emerald-700" />
                            <span>Ringkasan Data Kurikulum Terkunci (Tidak Dapat Diubah AI)</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleAnalyzeTpAtp}
                            disabled={!curriculumCheck.valid || isAnalyzingTp}
                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                            {isAnalyzingTp ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> <span>Menganalisis...</span></>
                            ) : (
                                <><FileSearch className="w-4 h-4" /> <span>ANALISIS TP/ATP</span></>
                            )}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 text-xs">
                        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
                            <div className="text-[10.5px] font-bold text-slate-500">Capaian Pembelajaran (CP)</div>
                            <p className="text-slate-700 leading-relaxed">{activeElement?.capaianPembelajaran}</p>
                        </div>
                        <div className="bg-white border border-blue-200 rounded-xl p-3 space-y-1">
                            <div className="text-[10.5px] font-bold text-blue-800">Tujuan Pembelajaran (TP Terkunci)</div>
                            <p className="text-slate-900 font-semibold leading-relaxed">{activeTp?.tp}</p>
                        </div>
                        <div className="bg-white border border-indigo-200 rounded-xl p-3 space-y-1">
                            <div className="text-[10.5px] font-bold text-indigo-800">
                                {focusLevel === 'tp' ? 'Rangkaian ATP Terkait (Mode TP)' : 'Fokus Butir ATP (Mode Spesifik)'}
                            </div>
                            <p className="text-slate-800 font-medium leading-relaxed">{lockedAtpText}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs pt-1">
                        <div className="bg-white border border-emerald-200 rounded-xl p-2.5 space-y-0.5">
                            <div className="text-[10.5px] font-bold text-emerald-800">KKO &amp; Kedalaman ({currentAnalysis.kedalamanLevel})</div>
                            <p className="text-[11.5px] text-slate-700 leading-snug">{currentAnalysis.kompetensiUtama}</p>
                        </div>
                        <div className="bg-white border border-emerald-200 rounded-xl p-2.5 space-y-0.5">
                            <div className="text-[10.5px] font-bold text-emerald-800">Konsep Utama</div>
                            <p className="text-[11.5px] text-slate-700 leading-snug">{currentAnalysis.konsepUtama}</p>
                        </div>
                        <div className="bg-white border border-emerald-200 rounded-xl p-2.5 space-y-0.5">
                            <div className="text-[10.5px] font-bold text-emerald-800">Pelurusan Miskonsepsi</div>
                            <p className="text-[11.5px] text-slate-700 leading-snug">{currentAnalysis.pelurusanMiskonsepsi}</p>
                        </div>
                        <div className="bg-white border border-emerald-200 rounded-xl p-2.5 space-y-0.5">
                            <div className="text-[10.5px] font-bold text-emerald-800">Rekomendasi Visualisasi</div>
                            <p className="text-[11.5px] text-slate-700 leading-snug">{currentAnalysis.visualisasiPalingTepat}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* STEP 2: KATALOG 29 DESAIN VISUAL, ORIENTASI, JUMLAH HALAMAN, TEMA & GENERASI */}
            <section className="no-print bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Compass className="w-5 h-5 text-indigo-700" />
                            <span>2. Pilihan Desain Visual (29 Bentuk), Tata Letak &amp; Tema Warna</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Gunakan rekomendasi otomatis AI berdasarkan karakter materi atau jelajahi katalog 29 desain visual dalam 7 kategori.
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
                            1. Rekomendasi AI
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
                            2. Katalog Manual (29 Desain)
                        </button>
                    </div>
                </div>

                {selectionMode === 'rekomendasi' ? (
                    <div className="space-y-4">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                            <div className="md:col-span-3">
                                <TemplateWireframeThumbnail
                                    templateId={recommendedMeta.id}
                                    accentHex={recommendedMeta.accentHex}
                                    active={false}
                                />
                            </div>
                            <div className="md:col-span-7 space-y-1.5">
                                <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4" />
                                    <span>Rekomendasi Terbaik AI · Kategori {recommendedMeta.category}</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    {recommendedMeta.order}. {recommendedMeta.name} ({recommendedMeta.subtitle})
                                </h3>
                                <p className="text-xs text-slate-700 leading-relaxed">{smartRecommendation.reason}</p>
                                <p className="text-[11px] font-medium text-emerald-900">
                                    Kesesuaian Karakter: {currentAnalysis.kesesuaianKarakterMateri}
                                </p>
                            </div>
                            <div className="md:col-span-2 flex md:justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setManualTemplateId(recommendedMeta.id);
                                        setSelectionMode('manual');
                                    }}
                                    className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-100/60 whitespace-nowrap cursor-pointer"
                                >
                                    Buka Katalog
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {smartRecommendation.alternatives.map((alt) => {
                                const altMeta = MATERI_AJAR_TEMPLATES.find(t => t.id === alt.id) || MATERI_AJAR_TEMPLATES[0];
                                return (
                                    <button
                                        key={alt.id}
                                        type="button"
                                        onClick={() => {
                                            setManualTemplateId(alt.id);
                                            setSelectionMode('manual');
                                        }}
                                        className="text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3 transition-colors cursor-pointer grid grid-cols-12 gap-3 items-center"
                                    >
                                        <div className="col-span-4">
                                            <TemplateWireframeThumbnail templateId={altMeta.id} accentHex={altMeta.accentHex} />
                                        </div>
                                        <div className="col-span-8">
                                            <div className="text-xs font-bold text-slate-900">
                                                Alternatif {altMeta.order}: {altMeta.name}
                                            </div>
                                            <div className="text-[11px] font-medium text-slate-500">{altMeta.subtitle}</div>
                                            <p className="text-[11px] text-slate-600 mt-1 leading-snug">{alt.reason}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Category Filter Tabs A-G + Search */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setCatalogCategoryFilter('ALL')}
                                    className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
                                        catalogCategoryFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Semua (29)
                                </button>
                                {MATERI_TEMPLATE_CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setCatalogCategoryFilter(cat.id)}
                                        className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
                                            catalogCategoryFilter === cat.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        {cat.id}. {cat.name}
                                    </button>
                                ))}
                            </div>

                            <div className="relative min-w-[220px]">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={catalogSearch}
                                    onChange={(e) => setCatalogSearch(e.target.value)}
                                    placeholder="Cari gaya desain..."
                                    className="w-full h-9 pl-8 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-h-[460px] overflow-y-auto pr-1">
                            {filteredTemplates.map((tpl) => {
                                const isSelected = manualTemplateId === tpl.id;
                                const isRecommended = smartRecommendation.recommendedId === tpl.id;
                                return (
                                    <button
                                        key={tpl.id}
                                        type="button"
                                        onClick={() => setManualTemplateId(tpl.id)}
                                        className={`text-left rounded-2xl p-3 border transition-colors cursor-pointer flex flex-col justify-between gap-2.5 ${
                                            isSelected
                                                ? 'border-slate-900 bg-slate-900 text-white'
                                                : 'border-slate-200 bg-white hover:border-slate-400 text-slate-900'
                                        }`}
                                    >
                                        <div className="space-y-2">
                                            <TemplateWireframeThumbnail
                                                templateId={tpl.id}
                                                accentHex={tpl.accentHex}
                                                active={isSelected}
                                            />
                                            <div className="flex items-center justify-between gap-2 text-[10.5px] font-bold">
                                                <span className={isSelected ? 'text-emerald-300' : 'text-slate-500'}>
                                                    Kategori {tpl.category} · {String(tpl.order).padStart(2, '0')}
                                                </span>
                                                {isRecommended && (
                                                    <span className={isSelected ? 'text-amber-300' : 'text-emerald-700'}>
                                                        Rekomendasi AI
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold leading-snug">{tpl.name}</div>
                                                <div className={`text-[11px] font-medium ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                                    {tpl.subtitle}
                                                </div>
                                            </div>
                                            <p className={`text-[11px] leading-relaxed line-clamp-2 ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                                                {tpl.description}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {manualSuitabilityNotice && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                                <span>{manualSuitabilityNotice}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Orientasi PNG, Jumlah Halaman, Tema Warna & Catatan Revisi */}
                <div className="pt-4 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                    <div className="lg:col-span-5 space-y-1.5">
                        <div className="text-xs font-bold text-slate-800">Orientasi &amp; Resolusi PNG</div>
                        <div className="grid grid-cols-3 gap-2">
                            {ORIENTATION_OPTIONS.map(opt => {
                                const active = orientation === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => handleOrientationSwitchLive(opt.id)}
                                        className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                                            active
                                                ? 'bg-slate-900 border-slate-900 text-white'
                                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="text-xs font-bold truncate">{opt.label}</div>
                                        <div className={`text-[10.5px] font-mono tabular-nums mt-0.5 ${active ? 'text-emerald-300' : 'text-slate-600'}`}>
                                            {opt.resLabel}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-1.5">
                        <div className="text-xs font-bold text-slate-800">Alokasi Jumlah Halaman</div>
                        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl">
                            {PAGE_PREFERENCE_OPTIONS.map(opt => (
                                <button
                                    key={String(opt.id)}
                                    type="button"
                                    onClick={() => setPageCountPref(opt.id)}
                                    className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
                                        pageCountPref === opt.id
                                            ? 'bg-white text-slate-900 shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-3 space-y-1.5">
                        <div className="text-xs font-bold text-slate-800">Tema Warna Visual</div>
                        <div className="flex items-center gap-2 pt-1">
                            {MATERI_VISUAL_THEMES.map(th => {
                                const active = selectedThemeId === th.id;
                                return (
                                    <button
                                        key={th.id}
                                        type="button"
                                        title={th.name}
                                        onClick={() => handleThemeSwitch(th.id)}
                                        className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-transform cursor-pointer ${
                                            active ? 'border-slate-900 scale-105' : 'border-slate-200 hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: th.primaryHex }}
                                    >
                                        {active && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center pt-3 border-t border-slate-100">
                    <div className="lg:col-span-7">
                        <input
                            type="text"
                            value={revisionNote}
                            onChange={(e) => setRevisionNote(e.target.value)}
                            placeholder="Catatan penyesuaian guru (opsional): mis. tambahkan contoh kehidupan desa atau perkuat latihan HOTS..."
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                        />
                    </div>
                    <div className="lg:col-span-5 flex flex-wrap items-center justify-end gap-2">
                        {generatedMateri && (
                            <button
                                type="button"
                                onClick={() => handleGenerateMateri(true)}
                                disabled={isGenerating || !curriculumCheck.valid}
                                className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Revisi Konten</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => handleGenerateMateri(false)}
                            disabled={isGenerating || !curriculumCheck.valid}
                            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                        >
                            {isGenerating ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> <span>Memproses ({pipelineProgress.step}/10)...</span></>
                            ) : (
                                <><Sparkles className="w-4 h-4" /> <span>GENERATE MATERI AJAR VISUAL</span></>
                            )}
                        </button>
                    </div>
                </div>

                <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>Desain Aktif: <strong className="text-slate-900">{activeTemplateMeta.name}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Resolusi PNG: <strong className="text-slate-900 font-mono tabular-nums">{pngSpec.label}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Tema: <strong className="text-slate-900">{activeTheme.name}</strong></span>
                </div>

                {isGenerating && (
                    <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-bold text-emerald-300">{pipelineProgress.label || '1. Memulai alur 10 tahap...'}</span>
                            <span className="font-bold tabular-nums">{pipelineProgress.step * 10}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${Math.max(10, pipelineProgress.step * 10)}%` }}
                            />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {GENERATION_PIPELINE_STEPS.map(st => {
                                const done = st.step < pipelineProgress.step;
                                const active = st.step === pipelineProgress.step;
                                return (
                                    <div
                                        key={st.step}
                                        className={`rounded-xl px-2.5 py-2 text-[10.5px] border ${
                                            active
                                                ? 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold'
                                                : done
                                                    ? 'bg-slate-800 border-slate-700 text-slate-300'
                                                    : 'bg-slate-900 border-slate-800 text-slate-500'
                                        }`}
                                    >
                                        <div className="tabular-nums">{st.step}. {st.title}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </section>

            {/* ARSIP MATERI AJAR TERSIMPAN */}
            <section className="no-print bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-emerald-700" />
                        <span>ARSIP MATERI AJAR VISUAL ({archiveList.length})</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                        Tersimpan lokal untuk akun aktif ({user?.email || registeredClass})
                    </span>
                </div>

                {archiveList.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-500">
                        Belum ada materi ajar visual tersimpan. Klik &ldquo;GENERATE MATERI AJAR VISUAL&rdquo; untuk menyusun dokumen siap ekspor PNG.
                    </div>
                ) : (
                    <div className="flex gap-3 overflow-x-auto pb-1">
                        {archiveList.map(item => {
                            const tplMeta = MATERI_AJAR_TEMPLATES.find(t => t.id === item.templateId);
                            const isActive = generatedMateri?.id === item.id;
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => {
                                        setGeneratedMateri(item);
                                        setActivePreviewPage(1);
                                        setHistoryStack([]);
                                    }}
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
                                            {item.subject} · {item.className}
                                        </div>
                                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                            {tplMeta?.name || item.templateId} · {item.pages?.length || 1} Hal
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

            {/* STEP 3: STUDIO PRATINJAU INTERAKTIF, SUNTING LANGSUNG, QUALITY GATE 4 KATEGORI & EKSPOR PNG */}
            {generatedMateri && effectiveQualityControl && (
                <section className="space-y-4">
                    {/* QUALITY GATE 4 KATEGORI */}
                    <div
                        className={`no-print rounded-2xl border p-4 sm:p-5 space-y-3 ${
                            effectiveQualityControl.overallStatus === 'GAGAL'
                                ? 'bg-rose-50 border-rose-300'
                                : effectiveQualityControl.overallStatus === 'PERLU PERHATIAN'
                                    ? 'bg-amber-50 border-amber-300'
                                    : 'bg-emerald-50 border-emerald-300'
                        }`}
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                                    {effectiveQualityControl.overallStatus === 'GAGAL' ? (
                                        <ShieldAlert className="w-5 h-5 text-rose-700" />
                                    ) : effectiveQualityControl.overallStatus === 'PERLU PERHATIAN' ? (
                                        <AlertTriangle className="w-5 h-5 text-amber-700" />
                                    ) : (
                                        <ShieldCheck className="w-5 h-5 text-emerald-700" />
                                    )}
                                    <span>Quality Gate 4 Kategori: {effectiveQualityControl.overallStatus}</span>
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed">{effectiveQualityControl.summary}</p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {isDownloadBlocked && (
                                    <button
                                        type="button"
                                        onClick={() => handleGenerateMateri(true)}
                                        disabled={isGenerating}
                                        className="px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        <span>Perbaiki &amp; Regenerasi</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setShowQcDetails(v => !v)}
                                    className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-semibold whitespace-nowrap cursor-pointer"
                                >
                                    {showQcDetails ? 'Tutup Detail Uji Mutu' : 'Lihat Detail 4 Kategori'}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                            {(effectiveQualityControl.categories || []).map(cat => (
                                <div key={cat.id} className="bg-white border border-slate-200 rounded-xl p-3 text-[11px] space-y-1">
                                    <div className="flex items-center justify-between gap-2 font-bold">
                                        <span className="text-slate-900">{cat.title}</span>
                                        <span className={
                                            cat.status === 'LULUS' ? 'text-emerald-700' : cat.status === 'PERLU PERHATIAN' ? 'text-amber-700' : 'text-rose-700'
                                        }>
                                            {cat.status}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 leading-snug line-clamp-2">{cat.summary}</p>
                                </div>
                            ))}
                        </div>

                        {showQcDetails && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-black/10">
                                {effectiveQualityControl.checks.map(chk => (
                                    <div key={chk.id} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] flex items-start justify-between gap-2">
                                        <div className="space-y-0.5">
                                            <div className="font-bold text-slate-900">
                                                {chk.category} · {chk.question}
                                            </div>
                                            <div className="text-slate-600 leading-snug">{chk.detail}</div>
                                        </div>
                                        <span className={`font-extrabold uppercase shrink-0 ${
                                            chk.status === 'lulus' ? 'text-emerald-700' : chk.status === 'perhatian' ? 'text-amber-700' : 'text-rose-700'
                                        }`}>
                                            {chk.status === 'lulus' ? 'LULUS' : chk.status === 'perhatian' ? 'PERHATIAN' : 'GAGAL'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* STUDIO TOOLBAR & PNG-ONLY EXPORT BAR */}
                    <div className="no-print bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="space-y-0.5">
                                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span>
                                        Studio Pratinjau · {activePages.length} Halaman · Format PNG Eksklusif ({pngSpec.label})
                                    </span>
                                </div>
                                <div className="text-[11px] text-slate-500">
                                    Nama Berkas: <span className="font-mono text-emerald-800">{autoFilenameBase}.png</span>
                                </div>
                            </div>

                            {/* PNG-ONLY EXPORT BUTTONS */}
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleDownloadSinglePng}
                                    disabled={isExportingSingle || isExportingAll || isDownloadBlocked}
                                    className="px-3.5 py-2 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-900 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                                >
                                    {isExportingSingle ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> <span>Menyiapkan PNG...</span></>
                                    ) : (
                                        <><ImageIcon className="w-4 h-4" /> <span>Unduh Halaman Ini (Hal {previewViewMode === 'single' ? activePreviewPage : 1} PNG)</span></>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDownloadAllPng}
                                    disabled={isExportingSingle || isExportingAll || isDownloadBlocked}
                                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                                >
                                    {isExportingAll ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> <span>Mengekspor Semua PNG...</span></>
                                    ) : (
                                        <><Download className="w-4 h-4" /> <span>Unduh Semua Halaman ({activePages.length} PNG)</span></>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Interactive Controls Row */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            {/* View Mode + Page Switcher + Zoom */}
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setPreviewViewMode('all')}
                                        className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
                                            previewViewMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                                        }`}
                                    >
                                        Semua Halaman
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewViewMode('single')}
                                        className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg whitespace-nowrap cursor-pointer ${
                                            previewViewMode === 'single' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                                        }`}
                                    >
                                        Satu Halaman
                                    </button>
                                </div>

                                {previewViewMode === 'single' && (
                                    <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                                        <button
                                            type="button"
                                            onClick={() => setActivePreviewPage(p => Math.max(1, p - 1))}
                                            disabled={activePreviewPage <= 1}
                                            className="p-1.5 rounded-lg hover:bg-white disabled:opacity-40 cursor-pointer"
                                            aria-label="Halaman sebelumnya"
                                        >
                                            <ArrowLeft className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="px-2 text-[11px] font-bold tabular-nums text-slate-800">
                                            Hal {activePreviewPage} / {activePages.length}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setActivePreviewPage(p => Math.min(activePages.length, p + 1))}
                                            disabled={activePreviewPage >= activePages.length}
                                            className="p-1.5 rounded-lg hover:bg-white disabled:opacity-40 cursor-pointer"
                                            aria-label="Halaman berikutnya"
                                        >
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                                    <button
                                        type="button"
                                        onClick={() => setZoomScale(z => Math.max(0.6, Number((z - 0.1).toFixed(2))))}
                                        className="p-1.5 rounded-lg hover:bg-white cursor-pointer"
                                        aria-label="Perkecil pratinjau"
                                    >
                                        <ZoomOut className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setZoomScale(1)}
                                        className="px-2 text-[11px] font-bold tabular-nums text-slate-800 hover:bg-white rounded-lg py-1 cursor-pointer"
                                    >
                                        {Math.round(zoomScale * 100)}%
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setZoomScale(z => Math.min(1.3, Number((z + 0.1).toFixed(2))))}
                                        className="p-1.5 rounded-lg hover:bg-white cursor-pointer"
                                        aria-label="Perbesar pratinjau"
                                    >
                                        <ZoomIn className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Live Template Switcher, Theme Dots, Regenerate Design/Illustration, Add/Remove Page, Edit, Undo */}
                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    value={generatedMateri.templateId}
                                    onChange={(e) => handleLiveTemplateSwitch(e.target.value as MateriTemplateId)}
                                    aria-label="Ganti desain visual instan"
                                    className="h-9 px-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 cursor-pointer max-w-[230px]"
                                >
                                    {MATERI_TEMPLATE_CATEGORIES.map(cat => (
                                        <optgroup key={cat.id} label={`${cat.id}. ${cat.name}`}>
                                            {MATERI_AJAR_TEMPLATES.filter(t => t.category === cat.id).map(tpl => (
                                                <option key={tpl.id} value={tpl.id}>
                                                    {tpl.order}. {tpl.name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>

                                <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-xl">
                                    {MATERI_VISUAL_THEMES.map(th => (
                                        <button
                                            key={th.id}
                                            type="button"
                                            title={`Tema ${th.name}`}
                                            onClick={() => handleThemeSwitch(th.id)}
                                            className={`w-5 h-5 rounded-full border cursor-pointer ${
                                                activeTheme.id === th.id ? 'border-slate-900 scale-110' : 'border-white'
                                            }`}
                                            style={{ backgroundColor: th.primaryHex }}
                                        />
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCycleDesignOnly}
                                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-[11px] font-bold flex items-center gap-1 whitespace-nowrap cursor-pointer"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>Regenerasi Desain</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleRegenerateIllustration}
                                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-[11px] font-bold flex items-center gap-1 whitespace-nowrap cursor-pointer"
                                >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    <span>Regenerasi Ilustrasi</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleAddCustomPage}
                                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-[11px] font-bold flex items-center gap-1 whitespace-nowrap cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Halaman</span>
                                </button>

                                {activePages.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveCurrentPage}
                                        className="px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-[11px] font-bold flex items-center gap-1 whitespace-nowrap cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Hapus Hal</span>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setIsLiveEditing(v => !v)}
                                    className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                                        isLiveEditing
                                            ? 'bg-slate-900 border-slate-900 text-white'
                                            : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800'
                                    }`}
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>{isLiveEditing ? 'Tutup Editor' : 'Sunting Konten'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleUndo}
                                    disabled={historyStack.length === 0}
                                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-800 text-[11px] font-bold flex items-center gap-1 whitespace-nowrap cursor-pointer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Undo ({historyStack.length})</span>
                                </button>
                            </div>
                        </div>

                        {/* INLINE LIVE EDITOR PANEL */}
                        {isLiveEditing && (
                            <div className="pt-3 border-t border-slate-200 bg-slate-50 rounded-2xl p-4 space-y-3">
                                <div className="text-xs font-extrabold text-slate-900">
                                    Penyuntingan Konten Langsung (Perubahan Tersinkron ke Pratinjau &amp; PNG)
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-bold text-slate-700">Judul Materi</label>
                                        <input
                                            type="text"
                                            value={generatedMateri.title}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                commitMateriEdit(prev => ({ ...prev, title: val }));
                                            }}
                                            className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white text-slate-900"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-bold text-slate-700">Subjudul</label>
                                        <input
                                            type="text"
                                            value={generatedMateri.subtitle}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                commitMateriEdit(prev => ({ ...prev, subtitle: val }));
                                            }}
                                            className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white text-slate-900"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-bold text-slate-700">Pengertian Konsep</label>
                                        <textarea
                                            rows={3}
                                            value={generatedMateri.pengertianKonsep}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                commitMateriEdit(prev => ({ ...prev, pengertianKonsep: val }));
                                            }}
                                            className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 leading-relaxed"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-bold text-slate-700">Penjelasan Sistematis</label>
                                        <textarea
                                            rows={3}
                                            value={generatedMateri.penjelasanUtama}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                commitMateriEdit(prev => ({ ...prev, penjelasanUtama: val }));
                                            }}
                                            className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 leading-relaxed"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-bold text-slate-700">Contoh Konkret</label>
                                        <textarea
                                            rows={2}
                                            value={generatedMateri.contohKonkret}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                commitMateriEdit(prev => ({ ...prev, contohKonkret: val }));
                                            }}
                                            className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 leading-relaxed"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-bold text-slate-700">
                                            Rangkuman Poin Penting (1 baris = 1 poin)
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={(generatedMateri.rangkumanPoin || []).join('\n')}
                                            onChange={(e) => {
                                                const lines = e.target.value.split('\n').filter(l => l.trim().length > 0);
                                                commitMateriEdit(prev => ({ ...prev, rangkumanPoin: lines }));
                                            }}
                                            className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 leading-relaxed"
                                        />
                                    </div>

                                    {currentPreviewPageObj && (
                                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                                            <div className="space-y-1">
                                                <label className="block text-[11px] font-bold text-slate-700">
                                                    Judul Halaman {currentPreviewPageObj.pageNo}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={currentPreviewPageObj.heading}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        commitMateriEdit(prev => ({
                                                            ...prev,
                                                            pages: activePages.map(p =>
                                                                p.pageNo === currentPreviewPageObj.pageNo ? { ...p, heading: val } : p
                                                            )
                                                        }));
                                                    }}
                                                    className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white text-slate-900"
                                                />
                                            </div>
                                            {currentPreviewPageObj.kind === 'custom_note' && (
                                                <div className="space-y-1">
                                                    <label className="block text-[11px] font-bold text-slate-700">
                                                        Isi Catatan Halaman {currentPreviewPageObj.pageNo}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={currentPreviewPageObj.customNote || ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            commitMateriEdit(prev => ({
                                                                ...prev,
                                                                pages: activePages.map(p =>
                                                                    p.pageNo === currentPreviewPageObj.pageNo ? { ...p, customNote: val } : p
                                                                )
                                                            }));
                                                        }}
                                                        className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white text-slate-900"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* MULTI-PAGE SCREEN PREVIEW WITH ZOOM */}
                    <div className="print-area bg-slate-100/75 border border-slate-200 rounded-3xl p-3 sm:p-5 overflow-x-auto">
                        <div
                            className="mx-auto transition-transform origin-top"
                            style={{
                                maxWidth: `${pngSpec.stageWidthPx}px`,
                                transform: zoomScale !== 1 ? `scale(${zoomScale})` : undefined
                            }}
                        >
                            <PpaDocumentSheet
                                data={generatedMateri}
                                identity={userIdentity}
                                isPrintMode={false}
                                orientation={activeOrientation}
                                theme={activeTheme}
                                visiblePageNo={previewViewMode === 'single' ? activePreviewPage : null}
                            />
                        </div>
                    </div>

                    {/* OFFSCREEN EXACT-RESOLUTION PNG RENDER STAGE (ALL PAGES) */}
                    <div
                        aria-hidden="true"
                        style={{
                            position: 'fixed',
                            left: '-14000px',
                            top: 0,
                            width: `${pngSpec.stageWidthPx}px`,
                            backgroundColor: '#ffffff',
                            pointerEvents: 'none'
                        }}
                    >
                        <div ref={pngCaptureRef}>
                            <PpaDocumentSheet
                                data={generatedMateri}
                                identity={userIdentity}
                                isPrintMode={true}
                                orientation={activeOrientation}
                                theme={activeTheme}
                                visiblePageNo={null}
                            />
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};
