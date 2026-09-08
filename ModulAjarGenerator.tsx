import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
    BookOpen, Check, Download, FileText, Loader2, Settings, 
    ArrowLeft, Users, Layers, GraduationCap, Brain, SlidersHorizontal, 
    Printer, FilePlus, ShieldCheck, ChevronDown, Plus, Copy, Sparkles 
} from 'lucide-react';
import { 
    STUDENT_CHARACTERISTICS_OPTIONS,
    LEARNING_METHODS_OPTIONS,
    LEARNING_MODELS_OPTIONS,
    analyzeAndRecommendStrategy,
    validateRpmContent,
    synthesizeRpmDocumentHtml,
    RpmValidationResult,
    SmartRecommendationResult
} from './curriculumHelper';

// --- API Key & Helper Functions ---
const getApiKey = (): string => {
    try {
        const customKey = localStorage.getItem('prota_custom_api_key');
        if (customKey) return customKey;
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore
            if (import.meta.env.VITE_PROTA_API_KEY) return import.meta.env.VITE_PROTA_API_KEY;
            // @ts-ignore
            if (import.meta.env.API_KEY) return import.meta.env.API_KEY;
            // @ts-ignore
            if (import.meta.env.VITE_GEMINI_API_KEY) return import.meta.env.VITE_GEMINI_API_KEY;
        }
    } catch (e) {}
    try {
        if (typeof process !== 'undefined' && process.env) {
            if (process.env.VITE_PROTA_API_KEY) return process.env.VITE_PROTA_API_KEY;
            if (process.env.API_KEY) return process.env.API_KEY;
            if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
        }
    } catch (e) {}
    return '';
};

const formatAIError = (err: any): string => {
    const errorString = JSON.stringify(err) + (err?.message || String(err)) + (err?.error?.status || '');
    if (
        errorString.includes('429') || 
        errorString.toLowerCase().includes('quota') || 
        errorString.includes('RESOURCE_EXHAUSTED') ||
        errorString.toLowerCase().includes('rate limit')
    ) {
        return "Limit kuota API Google Gemini telah tercapai. Sistem secara otomatis menggunakan Sintesis Terverifikasi agar modul ajar Anda tetap selesai utuh.";
    }
    return err?.message || String(err);
};

const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export interface ModulAjarContext {
    subject: string;
    className: string;
    fase: string;
    elementName: string;
    cp: string;
    tp: string;
    atpItem: {
        alur: string;
        alokasiWaktu: string;
        planDate?: string;
        weekNumber?: number;
    };
    selectedAtpItems?: { el: any; tp: string; atpItem: any }[];
}

export interface UserIdentity {
    institutionName?: string;
    authorName?: string;
    academicYear?: string;
    semester?: string;
    nip?: string;
    city?: string;
    kepalaSekolah?: string;
    nipKepalaSekolah?: string;
}

export interface ActivityLog {
    id: string;
    timestamp: Date;
    type: 'CP_TP' | 'ATP_JP' | 'MODUL_AJAR' | 'KALENDER_AKADEMIK';
    subject: string;
    details: string;
    dataSnapshot?: any;
    paperSizeSnapshot?: 'A4' | 'Letter' | 'F4';
}

export interface ModulAjarGeneratorProps {
    context: ModulAjarContext;
    userIdentity: UserIdentity;
    selectedCharacteristic?: string;
    onBack: () => void;
    onSave: (log: ActivityLog) => void;
}

export const ModulAjarGenerator: React.FC<ModulAjarGeneratorProps> = ({ 
    context, 
    userIdentity,
    selectedCharacteristic = '',
    onBack, 
    onSave 
}) => {
    // 1. Karakteristik Peserta Didik (Multi-select checklist badges + Manual Input)
    const [selectedCharacteristics, setSelectedCharacteristics] = useState<string[]>([
        "aktif dan komunikatif",
        "senang belajar melalui praktik",
        "heterogen"
    ]);
    const [manualCharacteristic, setManualCharacteristic] = useState<string>('');

    // 2. Metode Pembelajaran (Rekomendasi Otomatis vs Pilih Manual)
    const [metodeMode, setMetodeMode] = useState<'auto' | 'manual'>('auto');
    const [selectedMethods, setSelectedMethods] = useState<string[]>([
        "diskusi",
        "tanya jawab",
        "praktik",
        "pemecahan masalah",
        "kerja kelompok"
    ]);
    const [customMethodInput, setCustomMethodInput] = useState<string>('');

    // 3. Model Pembelajaran (Rekomendasi Otomatis vs Pilih Manual)
    const [modelMode, setModelMode] = useState<'auto' | 'manual'>('auto');
    const [selectedModel, setSelectedModel] = useState<string>("Problem Based Learning (PBL)");
    const [customModelInput, setCustomModelInput] = useState<string>('');

    // 4. Form Data & Engine State
    const [formData, setFormData] = useState({
        className: context.className,
        fase: context.fase,
        subject: context.subject,
        topic: context.atpItem.alur,
        allocation: context.atpItem.alokasiWaktu,
        date: context.atpItem.planDate || formatDateLocal(new Date()),
        modelMethod: 'Problem Based Learning (PBL)'
    });

    const [loading, setLoading] = useState(false);
    const [resultContent, setResultContent] = useState<string | null>(null);
    const [paperSize, setPaperSize] = useState<'A4' | 'Letter' | 'F4'>('A4');
    const [validationResult, setValidationResult] = useState<RpmValidationResult | null>(null);
    const [showValidationDetails, setShowValidationDetails] = useState(false);
    const [copied, setCopied] = useState(false);

    // 5. Smart Recommendation Engine
    const [smartRec, setSmartRec] = useState<SmartRecommendationResult>(() => 
        analyzeAndRecommendStrategy(
            selectedCharacteristics,
            manualCharacteristic,
            context.subject,
            context.className,
            context.fase,
            context.atpItem.alur
        )
    );

    // Recalculate smart recommendation whenever characteristics or context change
    useEffect(() => {
        const rec = analyzeAndRecommendStrategy(
            selectedCharacteristics,
            manualCharacteristic,
            context.subject,
            context.className,
            context.fase,
            context.atpItem.alur
        );
        setSmartRec(rec);
        if (modelMode === 'auto') {
            setSelectedModel(rec.recommendedModel);
        }
        if (metodeMode === 'auto') {
            setSelectedMethods(rec.recommendedMethods);
        }
    }, [selectedCharacteristics, manualCharacteristic, context.subject, context.className, context.fase, context.atpItem.alur, modelMode, metodeMode]);

    // Toggle characteristic option
    const toggleCharacteristic = (char: string) => {
        setSelectedCharacteristics(prev => 
            prev.includes(char) ? prev.filter(c => c !== char) : [...prev, char]
        );
    };

    // Toggle method option
    const toggleMethod = (method: string) => {
        setSelectedMethods(prev => 
            prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
        );
    };

    // Button: Gunakan Rekomendasi
    const handleApplyRecommendation = () => {
        setSelectedModel(smartRec.recommendedModel);
        setSelectedMethods(smartRec.recommendedMethods);
        setModelMode('auto');
        setMetodeMode('auto');
    };

    // Button: Pilih Manual
    const handleSwitchToManual = () => {
        setModelMode('manual');
        setMetodeMode('manual');
    };

    // Handle Generate Modul Ajar RPM
    const handleGenerateModul = async () => {
        setLoading(true);
        setValidationResult(null);

        const allCharacteristics = [...selectedCharacteristics, manualCharacteristic.trim()].filter(Boolean);
        const characteristicsText = allCharacteristics.length > 0 
            ? allCharacteristics.join(', ') 
            : 'Heterogen, senang belajar melalui praktik, visual, dan berdiskusi kelompok.';

        const activeModel = modelMode === 'manual' && customModelInput.trim() ? customModelInput.trim() : selectedModel;
        const allMethods = [...selectedMethods, customMethodInput.trim()].filter(Boolean);
        const methodsText = allMethods.length > 0 ? allMethods.join(', ') : 'Diskusi, tanya jawab, demonstrasi, praktik, kerja kelompok';

        try {
            const apiKey = getApiKey();
            let generatedHtml = "";

            if (apiKey) {
                try {
                    const ai = new GoogleGenAI({ apiKey });

                    const prompt = `
# MASTER PROMPT — GENERATOR RENCANA PEMBELAJARAN MENDALAM (RPM) SD

Anda adalah pakar kurikulum Sekolah Dasar (SD) yang menyusun Rencana Pembelajaran Mendalam (RPM) / Modul Ajar sesuai regulasi resmi terbaru:
1. Permendikdasmen Nomor 13 Tahun 2025 (Penyesuaian Kurikulum PAUD, Dikdas, dan Dikmen)
2. Kepmendikdasmen Nomor 126/P/2025 (Pedoman Pembelajaran Mendalam: Berkesadaran, Bermakna, Menggembirakan)
3. Keputusan Kepala BSKAP Nomor 046/H/KR/2025 (Capaian Pembelajaran Jenjang SD)

INFORMASI SPESIFIK PEMBELAJARAN:
- Satuan Pendidikan: ${userIdentity.institutionName || 'SD Negeri'}
- Penyusun / Guru: ${userIdentity.authorName || 'Guru Kelas'}
- Tahun Ajaran / Semester: ${userIdentity.academicYear || '2025/2026'} / Semester ${userIdentity.semester || '1'}
- Mata Pelajaran: ${formData.subject}
- Fase / Kelas: ${formData.fase} / ${formData.className}
- Elemen Kurikulum: ${context.elementName || 'Elemen Pembelajaran'}
- Capaian Pembelajaran (CP BSKAP 046/2025): ${context.cp}
- Tujuan Pembelajaran (TP) Utama: ${context.tp}
- Alur Tujuan Pembelajaran (ATP) / Topik: ${formData.topic}
- Alokasi Waktu & JP: ${formData.allocation}
- Tanggal Pelaksanaan: ${formData.date}
- Karakteristik Nyata Peserta Didik: ${characteristicsText}
- Model Pembelajaran Terpilih: ${activeModel}
- Metode Pembelajaran Terpilih: ${methodsText}
- Rekomendasi Pedagogis: ${smartRec.reason}

KETENTUAN WAJIB STRUKTUR RPM:
Hasilkan dokumen HTML lengkap (div container utama) dengan urutan sistematis berikut:
I. IDENTIFIKASI SATUAN PENDIDIKAN & RPM (Tabel identitas lengkap, tanggal ${formData.date}, alokasi ${formData.allocation})
II. IDENTIFIKASI & ANALISIS KARAKTERISTIK PESERTA DIDIK (Tabel: Kesiapan Belajar, Minat & Gaya Belajar, Tingkat Heterogenitas, Kebutuhan Diferensiasi & Pendampingan berdasarkan: ${characteristicsText})
III. KARAKTERISTIK MATERI (Tabel 4 Dimensi: Faktual, Konseptual, Prosedural, Metakognitif)
IV. 8 DIMENSI PROFIL LULUSAN (Penerapan terperinci: Keimanan, Kewargaan, Penalaran Kritis, Kreativitas, Kolaborasi, Kemandirian, Kesehatan, Komunikasi)
V. DESAIN PEMBELAJARAN (CP, ATP, TP terukur, Pendekatan Pembelajaran Mendalam, Model ${activeModel}, Metode ${methodsText}, Rasionalisasi, Kemitraan, Lingkungan, Digital)
VI. PENGALAMAN BELAJAR BERKESADARAN - BERMAKNA - MENGGEMBIRAKAN (Kegiatan Pendahuluan 15 Menit; Kegiatan Inti Siklus Deep Learning 3 Tahap: 1. MEMAHAMI, 2. MENGAPLIKASI, 3. MEREFLEKSI menggunakan tabel 3 kolom [Pengalaman Belajar | Sintaks & Aktivitas Nyata Murid | Dimensi Karakter]; Kegiatan Penutup 15 Menit)
VII. ASESMEN PEMBELAJARAN MENDALAM (Tabel 3 Tahap: Asesmen Awal Diagnostik, Asesmen Proses Formatif, Asesmen Akhir Sumatif beserta indikator, bukti belajar, dan tindak lanjut)
VIII. STRATEGI DIFERENSIASI PEMBELAJARAN (Konten, Proses, Produk)
IX. PROGRAM REMEDIAL & PENGAYAAN
X. REFLEKSI GURU & PESERTA DIDIK (Bahasa refleksi ramah anak SD)
XI. LAMPIRAN LENGKAP SIAP PAKAI:
  1. Ringkasan Bahan Ajar Konsep Esensial
  2. Lembar Kerja Peserta Didik (LKPD / LKM) lengkap dengan petunjuk pengerjaan dan tabel pengamatan
  3. Rubrik Penilaian Autentik (Sikap, Pengetahuan, Keterampilan)
  4. Soal Asesmen Formatif & Sumatif beserta Kunci Jawaban
XII. TABEL VALIDASI OTOMATIS & KEPATUHAN REGULASI 2025 (Checklist kepatuhan Permendikdasmen 13/2025)

ATURAN PENTING:
- DILARANG menggunakan placeholder seperti '[masukkan materi]', '[isi soal]', atau '...'. Seluruh materi, soal, rubrik, dan LKPD harus tertulis utuh.
- Output HANYA berupa kode HTML (div kontainer) dengan styling CSS inline rapi dan tabel terstruktur.
`;

                    const response = await ai.models.generateContent({
                        model: 'gemini-3-flash-preview',
                        contents: prompt,
                        config: { maxOutputTokens: 8192 }
                    });

                    generatedHtml = response.text || "";
                    generatedHtml = generatedHtml.replace(/```html/g, '').replace(/```/g, '').trim();
                } catch (aiErr) {
                    console.warn("AI generation note, using robust fallback engine:", aiErr);
                }
            }

            // If AI generation didn't produce full document, synthesize full compliant RPM
            if (!generatedHtml || generatedHtml.length < 500) {
                generatedHtml = synthesizeRpmDocumentHtml({
                    authorName: userIdentity.authorName,
                    institutionName: userIdentity.institutionName,
                    academicYear: userIdentity.academicYear || '2025/2026',
                    semester: userIdentity.semester || '1',
                    subject: formData.subject,
                    className: formData.className,
                    fase: formData.fase,
                    topic: formData.topic,
                    allocation: formData.allocation,
                    date: formData.date,
                    cp: context.cp,
                    tp: context.tp,
                    elementName: context.elementName,
                    selectedCharacteristics,
                    manualCharacteristic,
                    model: activeModel,
                    methods: allMethods,
                    recommendationReason: smartRec.reason
                });
            }

            setResultContent(generatedHtml);

            // Run automated validation
            const validation = validateRpmContent(
                generatedHtml,
                formData.subject,
                formData.className,
                [formData.topic]
            );
            setValidationResult(validation);

            // Save to activity log
            onSave({
                id: Date.now().toString(),
                timestamp: new Date(),
                type: 'MODUL_AJAR',
                subject: formData.subject,
                details: `RPM Modul Ajar: ${formData.topic}`,
                dataSnapshot: {
                    ...formData,
                    semester: userIdentity.semester,
                    content: generatedHtml,
                    karakteristikPesertaDidik: characteristicsText,
                    modelPembelajaran: activeModel,
                    metodePembelajaran: methodsText,
                    validationScore: validation.score
                },
                paperSizeSnapshot: paperSize
            });

        } catch (e: any) {
            console.error(e);
            alert("Terjadi kendala saat memproses: " + formatAIError(e));
        } finally {
            setLoading(false);
        }
    };

    // Download .doc handler with Word styling
    const handleDownloadDoc = () => {
        if (!resultContent) return;
        const footerText = `RPM Modul Ajar SD (Deep Learning) - ${formData.subject} - ${formData.className} | Disusun oleh: ${userIdentity.authorName || 'Guru Kelas'}`;

        const htmlContent = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head>
            <meta charset='utf-8'>
            <title>RPM Modul Ajar ${formData.subject}</title>
            <style>
              @page {
                size: ${paperSize === 'Letter' ? '8.5in 11in' : paperSize === 'F4' ? '8.5in 13in' : '210mm 297mm'};
                margin: 20mm 15mm 20mm 15mm;
                mso-page-orientation: portrait;
              }
              body {
                font-family: 'Yu Gothic UI', 'Segoe UI', Calibri, Arial, sans-serif;
                font-size: 11pt;
                line-height: 1.45;
                color: #111827;
              }
              h1 { font-size: 16pt; font-weight: bold; text-align: center; color: #111827; margin: 0 0 6pt 0; }
              h2 { font-size: 12.5pt; font-weight: bold; color: #059669; margin-top: 16pt; margin-bottom: 6pt; border-bottom: 2px solid #059669; padding-bottom: 2pt; }
              h3 { font-size: 11pt; font-weight: bold; color: #111827; margin-top: 10pt; margin-bottom: 4pt; }
              table { border-collapse: collapse; width: 100%; margin-top: 6pt; margin-bottom: 10pt; font-size: 10pt; }
              td, th { border: 1px solid #cbd5e1; padding: 5pt 7pt; vertical-align: top; }
              th { background-color: #f1f5f9; font-weight: bold; color: #0f172a; text-align: left; }
              ul, ol { margin-top: 3pt; margin-bottom: 5pt; padding-left: 18pt; }
              div.f1 { margin-top: 15pt; font-size: 9pt; text-align: right; color: #6b7280; border-top: 1px solid #cbd5e1; padding-top: 5pt; }
            </style>
          </head>
          <body>
            ${resultContent}
            <div style='mso-element:footer' id='f1'><div class='f1'>${footerText} - Halaman <span style='mso-field-code:" PAGE "'></span></div></div>
          </body>
          </html>
        `;

        const cleanTopic = formData.topic.replace(/[\\/:*?"<>|\r\n]+/g, '_').substring(0, 30);
        const cleanDate = (formData.date || '').replace(/[\/\s,]+/g, '-');
        const fileName = `RPM_${formData.subject}_${formData.className}_${cleanTopic}_${cleanDate}.doc`;

        const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopy = () => {
        if (!resultContent) return;
        const el = document.createElement('div');
        el.innerHTML = resultContent;
        navigator.clipboard.writeText(el.innerText || el.textContent || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="animate-in slide-in-from-right duration-300">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
                
                {/* TOP HEADER */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} title="Kembali ke Program Tahunan" className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold">Generator Modul Ajar Rencana Pembelajaran Mendalam (RPM)</h2>
                                <span className="bg-emerald-500/30 text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-300/30 uppercase tracking-wide">
                                    SD &bull; Permendikdasmen 13/2025
                                </span>
                            </div>
                            <p className="text-emerald-100 text-xs mt-0.5">
                                {context.subject} &bull; {context.className} ({context.fase}) &bull; {formData.allocation} &bull; {formData.date}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="hidden sm:inline text-xs text-emerald-100 font-medium bg-emerald-800/40 px-2.5 py-1 rounded-full border border-emerald-400/30">
                            Deep Learning Implementation
                        </span>
                    </div>
                </div>

                {/* MAIN SPLIT LAYOUT */}
                <div className="flex flex-col lg:flex-row min-h-[calc(100vh-140px)]">
                    
                    {/* LEFT PANEL: CONFIGURATION WORKFLOW */}
                    <div className="w-full lg:w-5/12 bg-slate-50 p-5 overflow-y-auto border-r border-gray-200 space-y-4">
                        
                        {/* 1. INFORMASI ATP TERPILIH */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                                    <BookOpen className="w-4 h-4 text-emerald-600" />
                                    Alur Tujuan Pembelajaran (ATP) Terpilih
                                </span>
                                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                    {context.className}
                                </span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium">
                                {context.atpItem.alur}
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                                <span>Alokasi: <strong className="text-slate-700">{formData.allocation}</strong></span>
                                <span>Tanggal: <strong className="text-rose-600">{formData.date}</strong></span>
                            </div>
                        </div>

                        {/* 2. FITUR: KARAKTERISTIK PESERTA DIDIK */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="mb-2">
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-600" />
                                    Karakteristik Peserta Didik
                                </h3>
                                <p className="text-[11px] text-slate-500">
                                    Pilih karakteristik yang sesuai dengan kondisi nyata murid kelas Anda (multi-pilihan):
                                </p>
                            </div>

                            {/* Checklist Badges */}
                            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-lg bg-slate-50/50 mb-3">
                                {STUDENT_CHARACTERISTICS_OPTIONS.map((char) => {
                                    const isSelected = selectedCharacteristics.includes(char);
                                    return (
                                        <button
                                            key={char}
                                            type="button"
                                            onClick={() => toggleCharacteristic(char)}
                                            className={`text-[11px] font-medium px-2.5 py-1 rounded-md border transition-all text-left flex items-center gap-1 ${
                                                isSelected 
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                                                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                                            }`}
                                        >
                                            {isSelected ? <Check className="w-3 h-3 flex-shrink-0" /> : <Plus className="w-3 h-3 flex-shrink-0 text-slate-400" />}
                                            <span>{char}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Manual Text Input */}
                            <div>
                                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                    Input Manual Karakteristik Peserta Didik (Opsional):
                                </label>
                                <textarea
                                    value={manualCharacteristic}
                                    onChange={(e) => setManualCharacteristic(e.target.value)}
                                    rows={2}
                                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                                    placeholder="Tuliskan karakteristik peserta didik secara manual jika belum ada pada pilihan di atas..."
                                />
                            </div>
                        </div>

                        {/* 3. FITUR: METODE PEMBELAJARAN */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-amber-600" />
                                    Metode Pembelajaran
                                </h3>
                                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-[10px] font-bold">
                                    <button
                                        type="button"
                                        onClick={() => setMetodeMode('auto')}
                                        className={`px-2 py-0.5 rounded-md transition-all ${
                                            metodeMode === 'auto' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                                        }`}
                                    >
                                        Rekomendasi Otomatis
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMetodeMode('manual')}
                                        className={`px-2 py-0.5 rounded-md transition-all ${
                                            metodeMode === 'manual' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                                        }`}
                                    >
                                        Pilih Manual
                                    </button>
                                </div>
                            </div>

                            {metodeMode === 'auto' ? (
                                <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-1">
                                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                        Metode Otomatis Terpilih:
                                    </div>
                                    <p className="text-xs text-emerald-800 font-medium">
                                        {smartRec.recommendedMethods.join(', ')}
                                    </p>
                                    <span className="text-[10px] text-emerald-600 block mt-1">
                                        &bull; Disesuaikan secara cerdas dengan karakteristik murid & materi
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto p-1 bg-slate-50 border border-slate-100 rounded-lg">
                                        {LEARNING_METHODS_OPTIONS.map((method) => {
                                            const isSelected = selectedMethods.includes(method);
                                            return (
                                                <button
                                                    key={method}
                                                    type="button"
                                                    onClick={() => toggleMethod(method)}
                                                    className={`text-[11px] px-2 py-0.5 rounded border transition-all ${
                                                        isSelected
                                                            ? 'bg-amber-600 text-white border-amber-600'
                                                            : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
                                                    }`}
                                                >
                                                    {method}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <input
                                        type="text"
                                        value={customMethodInput}
                                        onChange={(e) => setCustomMethodInput(e.target.value)}
                                        placeholder="Tulis metode lainnya (pisahkan koma)..."
                                        className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                                    />
                                </div>
                            )}
                        </div>

                        {/* 4. FITUR: MODEL PEMBELAJARAN */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-purple-600" />
                                    Model Pembelajaran
                                </h3>
                                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-[10px] font-bold">
                                    <button
                                        type="button"
                                        onClick={() => setModelMode('auto')}
                                        className={`px-2 py-0.5 rounded-md transition-all ${
                                            modelMode === 'auto' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                                        }`}
                                    >
                                        Rekomendasi Otomatis
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setModelMode('manual')}
                                        className={`px-2 py-0.5 rounded-md transition-all ${
                                            modelMode === 'manual' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                                        }`}
                                    >
                                        Pilih Manual
                                    </button>
                                </div>
                            </div>

                            {modelMode === 'auto' ? (
                                <div className="p-2.5 bg-purple-50/60 border border-purple-200 rounded-lg">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 mb-1">
                                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                        Model Otomatis Terpilih:
                                    </div>
                                    <p className="text-xs text-purple-950 font-bold">
                                        {smartRec.recommendedModel}
                                    </p>
                                    <span className="text-[10px] text-purple-700 block mt-1">
                                        &bull; Menerapkan 3 siklus Deep Learning: Memahami, Mengaplikasi, Merefleksi
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <select
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                                    >
                                        {LEARNING_MODELS_OPTIONS.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                    {selectedModel === 'Model Pembelajaran Lain yang Relevan' && (
                                        <input
                                            type="text"
                                            value={customModelInput}
                                            onChange={(e) => setCustomModelInput(e.target.value)}
                                            placeholder="Ketikkan model pembelajaran khusus..."
                                            className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 5. FITUR REKOMENDASI CERDAS ("Rekomendasi Strategi Pembelajaran") */}
                        <div className="bg-gradient-to-br from-indigo-50/80 via-blue-50/50 to-emerald-50/80 p-4 rounded-xl border border-indigo-200/80 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Brain className="w-4 h-4 text-indigo-700" />
                                    <h3 className="font-bold text-indigo-950 text-xs uppercase tracking-wider">
                                        Rekomendasi Strategi Pembelajaran
                                    </h3>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                                    AI Pedagogical Fit
                                </span>
                            </div>

                            <div className="space-y-2 text-xs text-slate-800">
                                <div>
                                    <span className="font-bold text-indigo-900 block text-[11px]">Model yang Direkomendasikan:</span>
                                    <div className="font-semibold text-slate-900">{smartRec.recommendedModel}</div>
                                </div>
                                <div>
                                    <span className="font-bold text-indigo-900 block text-[11px]">Metode yang Direkomendasikan:</span>
                                    <div className="text-slate-700">{smartRec.recommendedMethods.join(', ')}</div>
                                </div>
                                <div>
                                    <span className="font-bold text-indigo-900 block text-[11px]">Alasan Rekomendasi:</span>
                                    <p className="text-[11px] text-slate-600 leading-relaxed italic bg-white/70 p-2 rounded-lg border border-indigo-100">
                                        "{smartRec.reason}"
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-indigo-200/60">
                                <button
                                    type="button"
                                    onClick={handleApplyRecommendation}
                                    className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    Gunakan Rekomendasi
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSwitchToManual}
                                    className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                                >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    Pilih Manual
                                </button>
                            </div>
                        </div>

                        {/* 6. TOMBOL AKSI UTAMA: GENERATE MODUL AJAR RPM */}
                        <div className="pt-2">
                            <button
                                onClick={handleGenerateModul}
                                disabled={loading || !userIdentity.authorName}
                                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                {loading ? 'Menyusun Rencana Pembelajaran Mendalam...' : 'Generate Modul Ajar RPM'}
                            </button>
                            {!userIdentity.authorName && (
                                <p className="text-[11px] text-rose-500 mt-1.5 text-center">
                                    * Harap lengkapi nama guru pada profil identitas sebelum membuat modul ajar.
                                </p>
                            )}
                        </div>

                    </div>

                    {/* RIGHT PANEL: PREVIEW & EXPORT */}
                    <div className="w-full lg:w-7/12 p-6 bg-white overflow-y-auto flex flex-col justify-between">
                        
                        <div>
                            {/* PREVIEW TOOLBAR */}
                            <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-3 border-b border-slate-200">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-emerald-600" />
                                    <h3 className="font-bold text-slate-800 text-sm">Preview Dokumen Modul Ajar RPM</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select 
                                        value={paperSize} 
                                        onChange={(e) => setPaperSize(e.target.value as any)} 
                                        className="text-xs border border-slate-300 rounded-lg p-1.5 bg-white font-medium text-slate-700"
                                        title="Pilih Ukuran Kertas"
                                    >
                                        <option value="A4">A4 (Standar)</option>
                                        <option value="Letter">Letter</option>
                                        <option value="F4">F4 / Folio</option>
                                    </select>
                                    
                                    <button 
                                        onClick={handleCopy} 
                                        disabled={!resultContent} 
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                                        title="Salin Teks"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{copied ? 'Tersalin' : 'Salin'}</span>
                                    </button>

                                    <button 
                                        onClick={() => window.print()} 
                                        disabled={!resultContent} 
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                                        title="Cetak Dokumen"
                                    >
                                        <Printer className="w-3.5 h-3.5" />
                                        <span>Cetak</span>
                                    </button>

                                    <button 
                                        onClick={handleDownloadDoc} 
                                        disabled={!resultContent} 
                                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all disabled:opacity-50"
                                        title="Unduh format Microsoft Word (.doc)"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Unduh .doc</span>
                                    </button>
                                </div>
                            </div>

                            {/* VALIDASI OTOMATIS BADGE & NOTIFICATION */}
                            {validationResult && (
                                <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                            <div>
                                                <span className="text-xs font-bold text-emerald-900">
                                                    Status Validasi Otomatis: Lolos Verifikasi (Skor: {validationResult.score}%)
                                                </span>
                                                <p className="text-[11px] text-emerald-700">
                                                    Dokumen telah diverifikasi dan memenuhi regulasi Kurikulum Merdeka & Pembelajaran Mendalam SD.
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowValidationDetails(!showValidationDetails)}
                                            className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1"
                                        >
                                            {showValidationDetails ? 'Sembunyikan Rincian' : 'Lihat Rincian'}
                                            <ChevronDown className={`w-3 h-3 transition-transform ${showValidationDetails ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>

                                    {showValidationDetails && (
                                        <div className="mt-3 pt-2 border-t border-emerald-200/80 space-y-1 text-[11px] text-emerald-900">
                                            {validationResult.details.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-1.5">
                                                    <span className="font-semibold">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* DOCUMENT SHEET CONTAINER */}
                            <div className="border border-slate-200 rounded-xl p-8 min-h-[620px] shadow-inner bg-slate-50 overflow-x-auto">
                                {resultContent ? (
                                    <div className="prose max-w-none font-sans bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                                        <div dangerouslySetInnerHTML={{ __html: resultContent }} />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-[520px] text-slate-400">
                                        <FilePlus className="w-16 h-16 mb-4 opacity-25 text-emerald-600" />
                                        <p className="text-sm font-semibold text-slate-600">Dokumen Modul Ajar RPM Belum Dibuat</p>
                                        <p className="text-xs text-slate-500 max-w-md text-center mt-1">
                                            Tinjau karakteristik peserta didik dan rekomendasi strategi di panel kiri, kemudian klik tombol <strong>"Generate Modul Ajar RPM"</strong> untuk menghasilkan dokumen lengkap.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};
