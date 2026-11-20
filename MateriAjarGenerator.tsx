import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertTriangle, BookOpen, CheckCircle2, ChevronRight, Download, FolderOpen,
    GitBranch, Layers, LayoutGrid, Loader2, Lock, Printer, RefreshCw, ShieldAlert,
    ShieldCheck, Sparkles, Trash2, Unlock, Compass, Box, Clock, MessageSquare,
    StickyNote, Table2, ListChecks, Zap, GraduationCap, Image as ImageIcon, FileSearch, Files
} from 'lucide-react';
import { CurriculumData, isSameClass, isSameSubject } from './curriculumHelper';
import {
    MATERI_AJAR_TEMPLATES,
    MateriTemplateId,
    HierarchyFocusLevel,
    PageOrientationMode,
    TpAtpAnalysisResult,
    GeneratedMateriAjarData,
    GENERATION_PIPELINE_STEPS,
    buildMateriAjarHierarchy,
    recommendTemplateForFocus,
    generateMateriAjarContent,
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
import {
    exportMateriAjarToPdf,
    exportMateriAjarPagesPng,
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

const ORIENTATION_OPTIONS: { id: PageOrientationMode; label: string; desc: string }[] = [
    { id: 'portrait_a4', label: 'A4 Portrait', desc: 'Standar cetak & poster vertikal 210×297 mm' },
    { id: 'landscape_a4', label: 'A4 Landscape', desc: 'Diagram lebar, peta konsep, & perbandingan' },
    { id: 'digital_4_5', label: '4:5 Digital', desc: 'Rasio layar tablet & proyektor kelas' }
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
}

const PpaDocumentSheet: React.FC<PpaDocumentSheetProps> = ({ data, identity, isPrintMode, orientation }) => {
    const tplMeta = MATERI_AJAR_TEMPLATES.find(t => t.id === data.templateId) || MATERI_AJAR_TEMPLATES[0];
    const accentHex = tplMeta.accentHex || '#0f766e';
    const cityName = identity.location || identity.city || 'Sukatinggal';
    const todayStr = formatIndonesianDate();

    const faseInfo = getFaseInfoForClass(data.className);
    const bodyTextClass = faseInfo.id === 'A' ? 'text-[13px]' : faseInfo.id === 'B' ? 'text-[12.5px]' : 'text-xs';
    const headingTextClass = faseInfo.id === 'A' ? 'text-sm' : 'text-xs';
    const isLandscape = orientation === 'landscape_a4';

    const introText =
        data.pengantarSingkat ||
        data.pemahamanBermakna ||
        data.ringkasanKonsepInti ||
        `Mari kita pelajari materi ${data.title} secara runtut sesuai pengalaman belajar di kelas.`;

    const experienceHook =
        data.kaitanPengalamanSiswa ||
        `Pernahkah kalian mengamati penerapan ${data.title} di rumah atau sekolah?`;

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

    return (
        <div className="space-y-6">
            {/* ==================== HALAMAN 1: IDENTITAS, PENGANTAR, INTI MATERI & VISUALISASI ==================== */}
            <div
                data-materi-page="1"
                className="rounded-3xl border-2 bg-white p-4 sm:p-6 space-y-4 text-slate-900 shadow-xs"
                style={{ borderColor: accentHex }}
            >
                {/* 1. IDENTITAS MATERI LENGKAP */}
                <div data-pdf-block="true" className="rounded-2xl overflow-hidden border border-slate-200 bg-white">
                    <div className="px-5 py-4 text-white space-y-2.5" style={{ backgroundColor: accentHex }}>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-white/90">
                            <span>{data.subject} · {data.className} ({data.fase}) · Jenjang SD/MI</span>
                            <span className="tabular-nums">Halaman 1 / 3 · Gaya {tplMeta.name}</span>
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
                                {data.title}
                            </h2>
                            {data.subtitle && (
                                <p className="text-xs text-white/90 mt-1 leading-snug">{data.subtitle}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                            <div className="rounded-xl bg-white/15 border border-white/25 px-3.5 py-2.5 text-xs">
                                <div className="text-[10.5px] font-bold uppercase tracking-wide text-white/85">
                                    Tujuan Pembelajaran (TP Terkunci)
                                </div>
                                <p className="text-white font-medium leading-relaxed mt-0.5">{data.tpText}</p>
                            </div>
                            <div className="rounded-xl bg-white/15 border border-white/25 px-3.5 py-2.5 text-xs">
                                <div className="text-[10.5px] font-bold uppercase tracking-wide text-white/85">
                                    Alur Tujuan Pembelajaran (ATP Terkunci)
                                </div>
                                <p className="text-white font-medium leading-relaxed mt-0.5">
                                    {data.atpText || data.tpText}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                        <div>
                            <strong className="text-slate-900">{identity.institutionName || data.curriculumMeta?.institutionName || 'Satuan Pendidikan SD/MI'}</strong>
                            {identity.npsn ? ` · NPSN ${identity.npsn}` : ''}
                        </div>
                        <div>
                            Elemen: <strong className="text-slate-900">{data.elementName}</strong>
                        </div>
                        <div className="sm:text-right tabular-nums">
                            TA {data.academicYear} (Smt {data.semester}) · {data.alokasiWaktu || '3 JP'}
                        </div>
                    </div>
                </div>

                {/* 2. PENGANTAR MATERI & KAITAN PENGALAMAN SISWA */}
                <div data-pdf-block="true" className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-teal-700 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">02</span>
                            <h3 className={`${headingTextClass} font-extrabold text-teal-950 uppercase tracking-wide`}>
                                Pengantar &amp; Pengalaman Siswa
                            </h3>
                        </div>
                        <p className={`${bodyTextClass} text-slate-800 leading-relaxed`}>{introText}</p>
                        <div className="bg-white border border-teal-200/80 rounded-xl p-2.5 text-[11.5px] text-teal-950">
                            <span className="font-bold">Kaitan Pengalaman Nyata: </span>
                            {experienceHook}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-amber-600 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">?</span>
                            <h3 className={`${headingTextClass} font-extrabold text-amber-950 uppercase tracking-wide`}>
                                Pertanyaan Pemantik &amp; Arah KKO
                            </h3>
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
                            <div className="bg-white border border-amber-200/80 rounded-xl px-2.5 py-2 text-[11px] text-slate-700">
                                <span className="font-bold text-amber-900">Target KKO ({data.tpAtpAnalysis.kataKerjaOperasional}): </span>
                                {data.tpAtpAnalysis.buktiPemahaman}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. PEMBAHASAN INTI (KONSEP, PENJELASAN SISTEMATIS, UNSUR, KLASIFIKASI, TABEL, CONTOH) */}
                <div data-pdf-block="true" className="rounded-2xl border border-sky-200 bg-sky-50/40 p-4 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-sky-200/80">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-sky-700 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">03</span>
                            <h3 className={`${headingTextClass} font-extrabold text-sky-950 uppercase tracking-wide`}>
                                Pembahasan Inti Materi
                            </h3>
                        </div>
                        <span className="text-[11px] font-medium text-sky-900">
                            CP: {data.capaianPembelajaran.length > 100 ? `${data.capaianPembelajaran.slice(0, 98)}…` : data.capaianPembelajaran}
                        </span>
                    </div>

                    <div className={`grid grid-cols-1 ${isLandscape ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-3`}>
                        <div className="bg-white border border-sky-200 rounded-xl p-3.5 space-y-1.5">
                            <div className="text-[11px] font-extrabold text-sky-800 uppercase">Pengertian Konsep</div>
                            <p className={`${bodyTextClass} text-slate-800 leading-relaxed`}>{conceptDefinition}</p>
                        </div>
                        <div className={`bg-white border border-sky-200 rounded-xl p-3.5 space-y-1.5 ${isLandscape ? 'md:col-span-2' : ''}`}>
                            <div className="text-[11px] font-extrabold text-sky-800 uppercase">Penjelasan Sistematis</div>
                            <p className={`${bodyTextClass} text-slate-800 leading-relaxed`}>{mainExplanation}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                            <div className="text-[11px] font-extrabold text-slate-800 uppercase">Unsur &amp; Poin Penting</div>
                            <ul className="space-y-1.5">
                                {unsurPenting.slice(0, 4).map((pt, idx) => (
                                    <li key={idx} className={`${bodyTextClass} text-slate-700 leading-snug flex items-start gap-2`}>
                                        <span className="w-4 h-4 rounded-md bg-sky-100 text-sky-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                                            {idx + 1}
                                        </span>
                                        <span>{pt}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-1.5">
                            <div className="text-[11px] font-extrabold text-emerald-900 uppercase">Contoh Konkret Terpilih</div>
                            <p className={`${bodyTextClass} text-slate-800 leading-relaxed`}>{concreteExample}</p>
                            {data.klasifikasiAtauProses && (
                                <div className="pt-2 border-t border-emerald-200/80 space-y-1">
                                    <div className="text-[11px] font-bold text-emerald-900">{data.klasifikasiAtauProses.judul}:</div>
                                    <div className="space-y-1">
                                        {data.klasifikasiAtauProses.butir.slice(0, 3).map((b, idx) => (
                                            <div key={idx} className="text-[11px] text-slate-700 leading-snug">
                                                <span className="font-bold text-emerald-950">{b.label}: </span>{b.uraian}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {data.tabelInformatif && data.tabelInformatif.baris?.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                            <div className="px-3.5 py-2 bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-800">
                                {data.tabelInformatif.judul}
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        {(data.tabelInformatif.kolom || []).map((col, idx) => (
                                            <th key={idx} className="px-3 py-2 text-[11px] font-bold text-slate-700">{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {(data.tabelInformatif.baris || []).map((row, rIdx) => (
                                        <tr key={rIdx}>
                                            {row.map((cell, cIdx) => (
                                                <td key={cIdx} className={`px-3 py-2 ${bodyTextClass} text-slate-700 align-top leading-snug`}>
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

                {/* 4. VISUALISASI MATERI TERPISAH DARI TEKS */}
                <div data-pdf-block="true">
                    <PosterIllustrationFrame data={data} accentHex={accentHex} />
                </div>
            </div>

            {/* ==================== HALAMAN 2: TEMPLATE VISUAL, PENDALAMAN & PENGUATAN ==================== */}
            <div
                data-materi-page="2"
                className="rounded-3xl border-2 bg-white p-4 sm:p-6 space-y-4 text-slate-900 shadow-xs"
                style={{ borderColor: accentHex }}
            >
                <div data-pdf-block="true" className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                    <div>
                        <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: accentHex }}>
                            {data.subject} · {data.className} ({data.fase})
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900">{data.title} — Sajian Visual &amp; Pendalaman</h3>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 tabular-nums">Halaman 2 / 3 · {tplMeta.name}</span>
                </div>

                {/* SAJIAN TEMPLATE PILIHAN PENGGUNA / REKOMENDASI */}
                <MateriAjarTemplateRenderer data={data} isPrintMode={isPrintMode} />

                {/* 5. PENDALAMAN PEMAHAMAN & PELURUSAN MISKONSEPSI */}
                {data.pendalamanMateri && (
                    <div data-pdf-block="true" className="rounded-2xl border border-indigo-200 bg-indigo-50/45 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-700 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">05</span>
                            <h3 className={`${headingTextClass} font-extrabold text-indigo-950 uppercase tracking-wide`}>
                                Pendalaman Pemahaman &amp; Pelurusan Miskonsepsi
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white border border-indigo-200 rounded-xl p-3 space-y-1.5">
                                <div className="text-[11px] font-bold text-indigo-900">Analisis Sederhana &amp; Fakta Teridentifikasi</div>
                                <p className={`${bodyTextClass} text-slate-700 leading-relaxed`}>
                                    {data.pendalamanMateri.analisisSederhana}
                                </p>
                                <ul className="space-y-1 pt-1">
                                    {(data.pendalamanMateri.faktaTeridentifikasi || []).map((f, i) => (
                                        <li key={i} className="text-[11.5px] text-slate-700 flex items-start gap-1.5">
                                            <span className="font-bold text-indigo-700">•</span>
                                            <span>{f}</span>
                                        </li>
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

                {/* 6. PENGUATAN: CONTOH SEHARI-HARI, GLOSARIUM, AKTIVITAS SISWA, RANGKUMAN & REFLEKSI */}
                <div data-pdf-block="true" className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/55 p-3.5 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">06A</span>
                            <h3 className={`${headingTextClass} font-extrabold text-emerald-950 uppercase tracking-wide`}>
                                Penerapan Kehidupan Sehari-hari
                            </h3>
                        </div>
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
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-violet-700 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">06B</span>
                                <h3 className={`${headingTextClass} font-extrabold text-violet-950 uppercase tracking-wide`}>
                                    Aktivitas Siswa Terarah
                                </h3>
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
                        <div className="bg-violet-100/70 border border-violet-200 rounded-xl px-3 py-2 text-[11px] text-violet-950">
                            <span className="font-bold">Hasil Diharapkan: </span>{studentActivity.hasilDiharapkan}
                        </div>
                    </div>
                </div>

                <div data-pdf-block="true" className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="rounded-2xl border border-slate-300 bg-slate-50 p-3.5 space-y-2">
                        <div className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">Rangkuman Inti Materi</div>
                        <ul className="space-y-1.5">
                            {summaryPoints.map((pt, idx) => (
                                <li key={idx} className={`bg-white border border-slate-200 rounded-xl px-3 py-2 ${bodyTextClass} text-slate-800 leading-snug flex items-start gap-2`}>
                                    <span className="w-5 h-5 rounded-md bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0 tabular-nums">
                                        {idx + 1}
                                    </span>
                                    <span>{pt}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50/45 p-3.5 space-y-2.5">
                        <div>
                            <div className="text-xs font-extrabold text-amber-950 uppercase tracking-wide mb-1.5">
                                Glosarium Kosakata Penting
                            </div>
                            <div className="space-y-1">
                                {(data.kataKunci || []).slice(0, 4).map((kw, i) => (
                                    <div key={i} className="bg-white border border-amber-200/80 rounded-lg px-2.5 py-1.5 text-[11.5px] text-slate-800">
                                        <span className="font-bold text-amber-900">{kw.term}: </span>{kw.meaning}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {(data.refleksiSiswa || []).length > 0 && (
                            <div className="pt-1 border-t border-amber-200/80">
                                <div className="text-[11px] font-bold text-amber-950 mb-1">Refleksi Singkat Siswa</div>
                                <ul className="space-y-1">
                                    {(data.refleksiSiswa || []).slice(0, 2).map((refItem, idx) => (
                                        <li key={idx} className="text-[11px] text-slate-700">• {refItem}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ==================== HALAMAN 3: PEMERIKSAAN PEMAHAMAN, BAGIAN KHUSUS GURU, REFERENSI & PENGESAHAN ==================== */}
            <div
                data-materi-page="3"
                className="rounded-3xl border-2 bg-white p-4 sm:p-6 space-y-4 text-slate-900 shadow-xs"
                style={{ borderColor: accentHex }}
            >
                <div data-pdf-block="true" className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                    <div>
                        <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: accentHex }}>
                            {data.subject} · {data.className} ({data.fase})
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900">
                            Pemeriksaan Pemahaman, Panduan Guru &amp; Referensi Resmi
                        </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 tabular-nums">Halaman 3 / 3</span>
                </div>

                {/* 7A. LEMBAR LATIHAN SISWA (BERSIH TANPA KUNCI JAWABAN) */}
                <div data-pdf-block="true" className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-blue-700 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">07</span>
                            <h3 className={`${headingTextClass} font-extrabold text-blue-950 uppercase tracking-wide`}>
                                Pemeriksaan Pemahaman Siswa (Latihan Formatif)
                            </h3>
                        </div>
                        <span className="text-[11px] font-semibold text-blue-800">Untuk dikerjakan peserta didik</span>
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

                {/* 7B. BAGIAN KHUSUS GURU (KUNCI / PANDUAN JAWABAN TERPISAH) */}
                <div data-pdf-block="true" className="rounded-2xl border border-slate-300 bg-slate-100/80 p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
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
                    {(data.teacherNotes || []).length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                            <div className="text-[11px] font-bold text-amber-900">Catatan Verifikasi Guru:</div>
                            {(data.teacherNotes || []).map((note, idx) => (
                                <div key={idx} className="text-[11px] text-amber-950 leading-snug">• {note}</div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 8. REFERENSI RESMI & LANDASAN KURIKULUM */}
                <div data-pdf-block="true" className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-slate-800 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">08</span>
                            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                                Daftar Referensi &amp; Landasan Kurikulum Resmi
                            </h3>
                        </div>
                        <span className="text-[11px] text-slate-500">Tanpa sitasi karangan/DOI fiktif</span>
                    </div>
                    <div className="space-y-1.5">
                        {references.map((refItem, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                <div className="space-y-0.5">
                                    <div className="font-bold text-slate-900">
                                        {idx + 1}. {refItem.title}
                                    </div>
                                    <div className="text-slate-600">
                                        {refItem.category} · Sumber: {refItem.source} — {refItem.note}
                                    </div>
                                </div>
                                <span
                                    className={`text-[10.5px] font-bold shrink-0 px-2 py-0.5 rounded-md ${
                                        refItem.status === 'Teridentifikasi'
                                            ? 'bg-emerald-100 text-emerald-900'
                                            : 'bg-amber-100 text-amber-900'
                                    }`}
                                >
                                    {refItem.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* PENGESAHAN RESMI PPA */}
                <div data-pdf-block="true" className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5">
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

    const hierarchyTree = useMemo(
        () => buildMateriAjarHierarchy(activeSubject, activeClass, matchingProtaSource),
        [activeSubject, activeClass, matchingProtaSource]
    );

    const [selectedElementId, setSelectedElementId] = useState<string>('');
    const [selectedTpId, setSelectedTpId] = useState<string>('');
    const [selectedAtpId, setSelectedAtpId] = useState<string>('');
    const [focusLevel, setFocusLevel] = useState<HierarchyFocusLevel>('atp');

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

    const lockedAtpText = useMemo(() => {
        if (!activeElement || !activeTp) return '';
        if (focusLevel === 'elemen') {
            return activeElement.tpNodes.map((t, i) => `TP ${i + 1}: ${t.tp}`).join(' | ');
        }
        if (focusLevel === 'tp') {
            return (activeTp.atpItems || []).map(a => a.alur).join(' → ') || activeTp.tp;
        }
        return activeAtp?.alur || activeTp.tp;
    }, [activeElement, activeTp, activeAtp, focusLevel]);

    // Section B: Strict Locked Curriculum Mismatch Validation
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

    // Section E: Automatic + AI TP/ATP Analyzer
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

    // Section F: Dual Template Mode + Orientation + Revision State
    const [selectionMode, setSelectionMode] = useState<'rekomendasi' | 'manual'>('rekomendasi');
    const [manualTemplateId, setManualTemplateId] = useState<MateriTemplateId>('educational_infographic');
    const [orientation, setOrientation] = useState<PageOrientationMode>('portrait_a4');
    const [orientationPinned, setOrientationPinned] = useState<boolean>(false);
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

    const manualSuitabilityNotice = useMemo(() => {
        if (selectionMode !== 'manual') return undefined;
        return checkTemplateSuitability(
            manualTemplateId,
            smartRecommendation.recommendedId,
            activeSubject,
            activeTp?.tp || ''
        );
    }, [selectionMode, manualTemplateId, smartRecommendation.recommendedId, activeSubject, activeTp?.tp]);

    // Generation, Pipeline Progress, Preview, DOM Verification, Archive & Export
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [pipelineProgress, setPipelineProgress] = useState<{ step: number; label: string }>({ step: 0, label: '' });
    const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
    const [isExportingPng, setIsExportingPng] = useState<boolean>(false);
    const [isExportingBoth, setIsExportingBoth] = useState<boolean>(false);
    const [paperSize, setPaperSize] = useState<'A4' | 'F4'>('A4');
    const [generatedMateri, setGeneratedMateri] = useState<GeneratedMateriAjarData | null>(null);
    const [domCheck, setDomCheck] = useState<DomVerificationResult | null>(null);
    const [archiveList, setArchiveList] = useState<GeneratedMateriAjarData[]>([]);
    const [showQcDetails, setShowQcDetails] = useState<boolean>(true);

    const pdfCaptureRef = useRef<HTMLDivElement | null>(null);
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

    // Run real DOM readability & multi-page verification whenever preview changes
    useEffect(() => {
        if (!generatedMateri) {
            setDomCheck(null);
            return;
        }
        const timer = setTimeout(() => {
            setDomCheck(verifyRenderedMateriDom(pdfCaptureRef.current));
        }, 180);
        return () => clearTimeout(timer);
    }, [generatedMateri, orientation]);

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
                    ? `Analisis TP/ATP selesai! KKO utama "${result.kataKerjaOperasional}" & rekomendasi gaya teridentifikasi.`
                    : `Analisis TP/ATP kurikuler selesai dengan KKO "${result.kataKerjaOperasional}".`,
                'success'
            );
        } catch {
            setAiAnalysis(baselineAnalysis);
            notify('Analisis TP/ATP disusun dengan analisis kurikuler lokal.', 'info');
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
                alokasiWaktu: totalJpDisplay,
                templateId: targetTemplateId,
                selectionMode: targetSelectionMode,
                recommendationReason: targetSelectionMode === 'rekomendasi' ? smartRecommendation.reason : undefined,
                institutionName: userIdentity.institutionName || 'SD Negeri',
                isLockedSource: hierarchyTree.sourceType === 'locked_prota',
                orientation,
                analysis: currentAnalysis,
                revisionInstruction: useRevision ? (revisionNote.trim() || 'Perjelas kedalaman pembahasan, contoh konkret, dan pelurusan miskonsepsi sesuai TP terkunci.') : undefined,
                onProgress: (step, label) => setPipelineProgress({ step, label })
            });

            setGeneratedMateri(data);
            saveToArchive(data);

            const tplName = MATERI_AJAR_TEMPLATES.find(t => t.id === targetTemplateId)?.name || targetTemplateId;
            if (data.qualityControl?.overallStatus === 'GAGAL') {
                notify(`Materi Ajar (${tplName}) selesai tetapi Quality Control menemukan item GAGAL. Silakan perbaiki atau revisi.`, 'warning');
            } else {
                notify(
                    usedFallback
                        ? `Materi Ajar (${tplName}) disusun sesuai standar PPA & BSKAP 046/H/KR/2025.`
                        : `Materi Ajar (${tplName}) selesai dihasilkan melalui 10 tahap verifikasi!`,
                    'success'
                );
            }
        } catch (err) {
            console.error(err);
            notify('Gagal menyusun materi ajar. Silakan coba kembali.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const activeOrientation: PageOrientationMode =
        generatedMateri?.curriculumMeta?.orientation || orientation;

    // Effective QC report merged with real DOM check on QC #12
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
            if (chk.id !== 12) return chk;
            if (domCheck.ok) {
                return {
                    ...chk,
                    status: 'lulus' as const,
                    detail: `Terverifikasi ${domCheck.pageCount} halaman utuh di DOM tanpa potongan teks atau gambar rusak.`
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
    }, [generatedMateri, domCheck]);

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

    const handleDownloadPdf = async () => {
        if (!generatedMateri || !pdfCaptureRef.current || isDownloadBlocked) return;
        setIsExportingPdf(true);
        try {
            await exportMateriAjarToPdf(pdfCaptureRef.current, {
                filename: `${autoFilenameBase}.pdf`,
                paperSize,
                orientation: activeOrientation,
                institutionName: userIdentity.institutionName || 'SD Negeri',
                subject: generatedMateri.subject,
                className: generatedMateri.className
            });
            notify(`File PDF (${autoFilenameBase}.pdf) berhasil diunduh!`, 'success');
        } catch (err) {
            console.error('PDF export error:', err);
            notify('Gagal mengekspor PDF. Pastikan browser tidak memblokir unduhan.', 'error');
        } finally {
            setIsExportingPdf(false);
        }
    };

    const handleDownloadPng = async () => {
        if (!generatedMateri || !pdfCaptureRef.current || isDownloadBlocked) return;
        setIsExportingPng(true);
        try {
            const result = await exportMateriAjarPagesPng(pdfCaptureRef.current, {
                baseFilename: autoFilenameBase,
                orientation: activeOrientation
            });
            notify(
                `Berhasil mengunduh ${result.pageCount} file PNG terpisah (300 DPI): ${result.downloadedFiles.join(', ')}`,
                'success'
            );
        } catch (err) {
            console.error('PNG export error:', err);
            notify('Gagal mengekspor PNG per halaman.', 'error');
        } finally {
            setIsExportingPng(false);
        }
    };

    const handleDownloadBoth = async () => {
        if (!generatedMateri || !pdfCaptureRef.current || isDownloadBlocked) return;
        setIsExportingBoth(true);
        try {
            await exportMateriAjarToPdf(pdfCaptureRef.current, {
                filename: `${autoFilenameBase}.pdf`,
                paperSize,
                orientation: activeOrientation,
                institutionName: userIdentity.institutionName || 'SD Negeri',
                subject: generatedMateri.subject,
                className: generatedMateri.className
            });
            await new Promise(resolve => setTimeout(resolve, 350));
            const pngResult = await exportMateriAjarPagesPng(pdfCaptureRef.current, {
                baseFilename: autoFilenameBase,
                orientation: activeOrientation
            });
            notify(
                `Paket lengkap berhasil diunduh: 1 PDF (${autoFilenameBase}.pdf) & ${pngResult.pageCount} PNG terpisah (300 DPI)!`,
                'success'
            );
        } catch (err) {
            console.error('Combined export error:', err);
            notify('Gagal mengunduh paket PDF + PNG.', 'error');
        } finally {
            setIsExportingBoth(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const recommendedMeta = MATERI_AJAR_TEMPLATES.find(t => t.id === smartRecommendation.recommendedId) || MATERI_AJAR_TEMPLATES[0];
    const activeTemplateMeta = MATERI_AJAR_TEMPLATES.find(t => t.id === effectiveTemplateId) || MATERI_AJAR_TEMPLATES[0];
    const captureStageWidth = activeOrientation === 'landscape_a4' ? 1123 : 794;

    return (
        <div className="space-y-6 pb-16">
            {/* TOP HERO & LOCKED PROFILE IDENTITY */}
            <section className="no-print bg-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-1.5 max-w-3xl">
                        <div className="text-xs font-medium text-emerald-300 flex flex-wrap items-center gap-2">
                            <span>Permendikdasmen 10, 12, 13/2025 &amp; 1/2026</span>
                            <span aria-hidden="true">·</span>
                            <span>BSKAP 046/H/KR/2025</span>
                            <span aria-hidden="true">·</span>
                            <span>PPA Edisi Revisi 2025</span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1">
                                {hierarchyTree.sourceType === 'locked_prota' ? (
                                    <><Lock className="w-3.5 h-3.5" /> Prota/ATP Terkunci</>
                                ) : hierarchyTree.sourceType === 'saved_prota' ? (
                                    <><Unlock className="w-3.5 h-3.5 text-amber-300" /> Prota Tersimpan</>
                                ) : (
                                    <><GraduationCap className="w-3.5 h-3.5 text-sky-300" /> Basis Resmi BSKAP 046</>
                                )}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                            AI Educational Content Generator — Materi Ajar SD/MI
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            Mengolah data kurikulum terkunci (Kelas, Fase, Elemen, CP, TP, ATP) menjadi materi ajar substantif, akurat secara keilmuan, bebas sitasi fiktif, terverifikasi 6 lapis &amp; 12 kriteria mutu, siap ekspor PDF dan PNG 300 DPI per halaman.
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

            {/* MISMATCH / LOCKED DATA WARNING BANNER (SECTION B) */}
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

            {/* STEP 1: HIERARKI KURIKULUM & DATA TERKUNCI + TOMBOL ANALISIS TP/ATP */}
            <section className="no-print bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-emerald-700" />
                            <span>1. Fokus Hierarki Kurikulum &amp; Data Terkunci (CP → Elemen → TP → ATP)</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Data TP dan ATP di bawah ini dikunci penuh untuk menjaga keutuhan kompetensi dan ruang lingkup kelas/fase.
                        </p>
                    </div>

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

                {/* Hierarchy Selectors */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/40">
                        <div className="text-xs font-bold text-slate-800">Tingkat 1 · Elemen &amp; CP</div>
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

                    <div className={`border border-slate-200 rounded-2xl p-4 space-y-3 ${focusLevel === 'elemen' ? 'opacity-65 bg-slate-50' : 'bg-slate-50/40'}`}>
                        <div className="text-xs font-bold text-slate-800">Tingkat 2 · Tujuan Pembelajaran (TP)</div>
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

                    <div className={`border border-slate-200 rounded-2xl p-4 space-y-3 ${focusLevel !== 'atp' ? 'opacity-65 bg-slate-50' : 'bg-slate-50/40'}`}>
                        <div className="text-xs font-bold text-slate-800">Tingkat 3 · Butir ATP</div>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
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

                {/* Panel Ringkasan Data Kurikulum Terkunci + Tombol "ANALISIS TP/ATP" */}
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
                                <><Loader2 className="w-4 h-4 animate-spin" /> <span>Menganalisis TP/ATP...</span></>
                            ) : (
                                <><FileSearch className="w-4 h-4" /> <span>ANALISIS TP/ATP</span></>
                            )}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                        <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                            <div className="text-[10.5px] font-bold text-slate-500">Satuan Pendidikan &amp; Tahun Ajaran</div>
                            <div className="font-semibold text-slate-900 mt-0.5">
                                {userIdentity.institutionName || 'SD Negeri'} · TA {userIdentity.academicYear || '2025/2026'}
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                            <div className="text-[10.5px] font-bold text-slate-500">Kurikulum · Jenjang · Kelas · Fase</div>
                            <div className="font-semibold text-slate-900 mt-0.5">
                                Kurikulum Merdeka · SD/MI · {activeClass} ({hierarchyTree.fase})
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                            <div className="text-[10.5px] font-bold text-slate-500">Mapel · Elemen · Gaya Terpilih</div>
                            <div className="font-semibold text-slate-900 mt-0.5 truncate">
                                {activeSubject} · {activeElement?.elementName} · {activeTemplateMeta.name}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 text-xs">
                        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
                            <div className="text-[10.5px] font-bold text-slate-500 uppercase">Capaian Pembelajaran (CP)</div>
                            <p className="text-slate-700 leading-relaxed">{activeElement?.capaianPembelajaran}</p>
                        </div>
                        <div className="bg-white border border-blue-200 rounded-xl p-3 space-y-1">
                            <div className="text-[10.5px] font-bold text-blue-800 uppercase">Tujuan Pembelajaran (TP Terkunci)</div>
                            <p className="text-slate-900 font-semibold leading-relaxed">{activeTp?.tp}</p>
                        </div>
                        <div className="bg-white border border-indigo-200 rounded-xl p-3 space-y-1">
                            <div className="text-[10.5px] font-bold text-indigo-800 uppercase">Alur Tujuan Pembelajaran (ATP Terkunci)</div>
                            <p className="text-slate-800 font-medium leading-relaxed">{lockedAtpText}</p>
                        </div>
                    </div>
                </div>

                {/* Panel Analisis TP & ATP Otomatis (Section E — 10 Dimensi Pedagogis) */}
                <div className="bg-emerald-50/45 border border-emerald-200 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-extrabold text-emerald-950 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-700" />
                            <span>
                                Hasil Analisis TP &amp; ATP {currentAnalysis.usedAi ? '(Analisis Mendalam AI)' : '(Analisis Otomatis Kurikuler)'}
                            </span>
                        </div>
                        <div className="text-[11px] font-bold text-emerald-900">
                            KKO Terdeteksi: <span className="underline">{currentAnalysis.kataKerjaOperasional}</span> · Kedalaman: <span className="uppercase">{currentAnalysis.kedalamanLevel}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                        <div className="bg-white border border-emerald-200/80 rounded-xl p-2.5 space-y-0.5">
                            <div className="text-[10.5px] font-bold text-emerald-800">1. Kompetensi &amp; KKO</div>
                            <p className="text-[11.5px] text-slate-700 leading-snug">{currentAnalysis.kompetensiUtama}</p>
                        </div>
                        <div className="bg-white border border-emerald-200/80 rounded-xl p-2.5 space-y-0.5">
                            <div className="text-[10.5px] font-bold text-emerald-800">2. Konsep Utama &amp; Pendukung</div>
                            <p className="text-[11.5px] text-slate-700 leading-snug">{currentAnalysis.konsepUtama}</p>
                        </div>
                        <div className="bg-white border border-emerald-200/80 rounded-xl p-2.5 space-y-0.5">
                            <div className="text-[10.5px] font-bold text-emerald-800">3. Miskonsepsi &amp; Pelurusan</div>
                            <p className="text-[11.5px] text-slate-700 leading-snug">{currentAnalysis.pelurusanMiskonsepsi}</p>
                        </div>
                        <div className="bg-white border border-emerald-200/80 rounded-xl p-2.5 space-y-0.5">
                            <div className="text-[10.5px] font-bold text-emerald-800">4. Bukti Pemahaman &amp; Visual</div>
                            <p className="text-[11.5px] text-slate-700 leading-snug">{currentAnalysis.visualisasiPalingTepat}</p>
                        </div>
                    </div>

                    <div className="text-[11px] text-emerald-950 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span><strong>Kedalaman KKO:</strong> {currentAnalysis.kedalamanPembahasan}</span>
                        <span><strong>Kosakata Kunci:</strong> {currentAnalysis.kosakataPenting.join(', ')}</span>
                    </div>
                </div>
            </section>

            {/* STEP 2: PILIHAN GAYA TEMPLATE, ORIENTASI & GENERATOR 10 TAHAP */}
            <section className="no-print bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Compass className="w-5 h-5 text-indigo-700" />
                            <span>2. Pilihan Gaya Template, Orientasi Halaman &amp; Generasi</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Pilih mode rekomendasi otomatis AI atau tentukan manual dari 10 gaya desain. Pilihan manual Anda selalu dihormati tanpa penggantian diam-diam.
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
                            1. Rekomendasi Otomatis AI
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
                                    <span>Rekomendasi AI Berdasarkan Karakter Materi &amp; KKO TP/ATP</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <span>{recommendedMeta.order}. {recommendedMeta.name}</span>
                                    <span className="text-sm font-medium text-emerald-800">({recommendedMeta.subtitle})</span>
                                </h3>
                                <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
                                    {smartRecommendation.reason}
                                </p>
                                <p className="text-[11px] font-medium text-emerald-900">
                                    Kesesuaian Karakter: {currentAnalysis.kesesuaianKarakterMateri}
                                </p>
                            </div>
                            <div className="shrink-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setManualTemplateId(recommendedMeta.id);
                                        setSelectionMode('manual');
                                    }}
                                    className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-100/60 whitespace-nowrap cursor-pointer"
                                >
                                    Ubah ke Mode Manual
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
                    <div className="space-y-3">
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
                                                Rekomendasi Utama AI
                                            </div>
                                        )}
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

                {/* Orientasi Dokumen & Catatan Revisi Opsional */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                    <div className="space-y-1.5">
                        <div className="text-xs font-bold text-slate-800">Orientasi &amp; Rasio Dokumen</div>
                        <div className="grid grid-cols-3 gap-2">
                            {ORIENTATION_OPTIONS.map(opt => {
                                const active = orientation === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => {
                                            setOrientation(opt.id);
                                            setOrientationPinned(true);
                                        }}
                                        className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                                            active
                                                ? 'bg-slate-900 border-slate-900 text-white'
                                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="text-xs font-bold">{opt.label}</div>
                                        <div className={`text-[10.5px] mt-0.5 leading-tight ${active ? 'text-slate-300' : 'text-slate-500'}`}>
                                            {opt.desc}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-800">
                            Catatan Penyesuaian / Revisi Guru (Opsional)
                        </label>
                        <input
                            type="text"
                            value={revisionNote}
                            onChange={(e) => setRevisionNote(e.target.value)}
                            placeholder="Contoh: Gunakan contoh benda sekitar rumah pedesaan dan perkuat soal HOTS sederhana..."
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                        />
                    </div>
                </div>

                {/* Action Bar: GENERATE MATERI AJAR & REVISI */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-slate-600">
                        Template Aktif: <strong className="text-slate-900">{activeTemplateMeta.name}</strong> · Orientasi:{' '}
                        <strong className="text-slate-900">{ORIENTATION_OPTIONS.find(o => o.id === orientation)?.label}</strong>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {generatedMateri && (
                            <button
                                type="button"
                                onClick={() => handleGenerateMateri(true)}
                                disabled={isGenerating || !curriculumCheck.valid}
                                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Revisi / Regenerasi (Pertahankan Template)</span>
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
                                <><Sparkles className="w-4 h-4" /> <span>GENERATE MATERI AJAR</span></>
                            )}
                        </button>
                    </div>
                </div>

                {/* 10-STEP PIPELINE PROGRESS INDICATOR (SECTION J) */}
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
                        <span>ARSIP MATERI AJAR TERSIMPAN ({archiveList.length})</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                        Tersimpan lokal untuk akun aktif ({user?.email || registeredClass})
                    </span>
                </div>

                {archiveList.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-500">
                        Belum ada materi ajar tersimpan. Klik &ldquo;GENERATE MATERI AJAR&rdquo; untuk menyusun dokumen 3 halaman lengkap.
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

            {/* STEP 3: QUALITY CONTROL REPORT (12 KRITERIA & 6 LAPIS VERIFIKASI) + EXPORT BAR + MULTI-PAGE PREVIEW */}
            {generatedMateri && effectiveQualityControl && (
                <section className="space-y-4">
                    {/* QUALITY CONTROL GATE PANEL (SECTION L) */}
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
                                    <span>
                                        Status Quality Control: {effectiveQualityControl.overallStatus}
                                    </span>
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
                                    {showQcDetails ? 'Sembunyikan Detail 12 QC' : 'Lihat Detail 12 QC'}
                                </button>
                            </div>
                        </div>

                        {showQcDetails && (
                            <div className="space-y-3 pt-2 border-t border-black/10">
                                {/* 6 Lapis Verifikasi */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {effectiveQualityControl.verificationStages.map((st, idx) => (
                                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-2.5 text-[11px]">
                                            <div className="font-bold text-slate-900 flex items-center justify-between gap-2">
                                                <span>{st.stage}</span>
                                                <span className={st.passed ? 'text-emerald-700' : 'text-rose-700'}>
                                                    {st.passed ? 'Lolos' : 'Gagal'}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 mt-0.5 leading-snug">{st.note}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* 12 Checklist Mutu */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {effectiveQualityControl.checks.map(chk => (
                                        <div key={chk.id} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] flex items-start justify-between gap-2">
                                            <div className="space-y-0.5">
                                                <div className="font-bold text-slate-900 tabular-nums">
                                                    {chk.id}. {chk.question}
                                                </div>
                                                <div className="text-slate-600 leading-snug">{chk.detail}</div>
                                            </div>
                                            <span
                                                className={`font-extrabold uppercase shrink-0 ${
                                                    chk.status === 'lulus'
                                                        ? 'text-emerald-700'
                                                        : chk.status === 'perhatian'
                                                            ? 'text-amber-700'
                                                            : 'text-rose-700'
                                                }`}
                                            >
                                                {chk.status === 'lulus' ? 'LULUS' : chk.status === 'perhatian' ? 'PERHATIAN' : 'GAGAL'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* EXPORT CONTROLS BAR (SECTION K & M) */}
                    <div className="no-print bg-white border border-slate-200 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>
                                    Pratinjau Dokumen 3 Halaman · Nama File Otomatis:{' '}
                                    <span className="font-mono text-emerald-800">{autoFilenameBase}</span>
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                Tersedia unduhan PDF utuh, PNG 300 DPI terpisah per halaman (Hal 1, Hal 2, Hal 3), atau unduh keduanya sekaligus.
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
                                onClick={handleDownloadPdf}
                                disabled={isExportingPdf || isExportingBoth || isDownloadBlocked}
                                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                            >
                                {isExportingPdf ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> <span>Menyiapkan PDF...</span></>
                                ) : (
                                    <><Download className="w-4 h-4" /> <span>Unduh PDF</span></>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleDownloadPng}
                                disabled={isExportingPng || isExportingBoth || isDownloadBlocked}
                                className="px-3.5 py-2 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-900 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                            >
                                {isExportingPng ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> <span>Mengekspor PNG...</span></>
                                ) : (
                                    <><ImageIcon className="w-4 h-4" /> <span>Unduh PNG (Per Halaman 300 DPI)</span></>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleDownloadBoth}
                                disabled={isExportingPdf || isExportingPng || isExportingBoth || isDownloadBlocked}
                                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                            >
                                {isExportingBoth ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> <span>Mengunduh Paket...</span></>
                                ) : (
                                    <><Files className="w-4 h-4" /> <span>Unduh Keduanya (PDF + PNG)</span></>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* MULTI-PAGE SCREEN PREVIEW */}
                    <div className="print-area bg-slate-100/75 border border-slate-200 rounded-3xl p-3 sm:p-5 overflow-x-auto">
                        <div className={`${activeOrientation === 'landscape_a4' ? 'max-w-[1123px]' : 'max-w-[820px]'} mx-auto`}>
                            <PpaDocumentSheet
                                data={generatedMateri}
                                identity={userIdentity}
                                isPrintMode={false}
                                orientation={activeOrientation}
                            />
                        </div>
                    </div>

                    {/* OFFSCREEN 300-DPI RENDER STAGE */}
                    <div
                        aria-hidden="true"
                        style={{
                            position: 'fixed',
                            left: '-14000px',
                            top: 0,
                            width: `${captureStageWidth}px`,
                            backgroundColor: '#ffffff',
                            pointerEvents: 'none'
                        }}
                    >
                        <div ref={pdfCaptureRef}>
                            <PpaDocumentSheet
                                data={generatedMateri}
                                identity={userIdentity}
                                isPrintMode={true}
                                orientation={activeOrientation}
                            />
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};
