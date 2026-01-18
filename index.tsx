import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { BookOpen, CheckCircle, Download, FileText, Layout, Loader2, RefreshCw, Settings, ChevronRight, Sparkles, Clock, Calculator, ShieldCheck, History, X, Activity, Eye, FileDown, ArrowLeft, Home, Calendar, AlertCircle, ArrowRight, Zap, Star, FileOutput, CalendarCheck, GraduationCap, SlidersHorizontal, Info, Table, Lightbulb, TrendingUp, AlertTriangle, Check, CalendarDays, BarChart3, ChevronDown, ChevronUp, Target, ChevronLeft, FilePlus, Save, Image as ImageIcon, Printer, User, Edit, Brain, ThumbsUp } from 'lucide-react';

// --- API Key Helper ---
const getApiKey = (): string => {
  try {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env) {
          // @ts-ignore
          if (import.meta.env.VITE_PROTA_API_KEY) return import.meta.env.VITE_PROTA_API_KEY;
          // @ts-ignore
          if (import.meta.env.API_KEY) return import.meta.env.API_KEY;
      }
  } catch (e) {}
  
  try {
      if (typeof process !== 'undefined' && process.env) {
          if (process.env.VITE_PROTA_API_KEY) return process.env.VITE_PROTA_API_KEY;
          if (process.env.API_KEY) return process.env.API_KEY;
      }
  } catch (e) {}

  return 'AlzaSyDsa90NXniw52Wb8PvPpPMsoqsatiDPgLg';
};

// --- Date Helpers ---
const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseDateToLocal = (dateStr: string): Date => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
};

// --- Constants & Configuration ---
const ACADEMIC_START_DATE = '2025-07-14';
const ACADEMIC_END_DATE = '2026-06-27';

// --- Types ---
interface AtpItem {
  alur: string;
  alokasiWaktu: string;
  planDate?: string;
  weekNumber?: number;
}

interface TpGroup {
  tp: string;
  atpItems: AtpItem[];
}

interface Allocation {
  className: string;
  tujuanPembelajaran: string[];
  structuredAtp?: TpGroup[];
  scheduleDays?: string[];
}

interface ElementData {
  elementName: string;
  capaianPembelajaran: string;
  allocations: Allocation[];
}

interface CurriculumData {
  subject: string;
  fase: string;
  description: string;
  elements: ElementData[];
}

interface ActivityLog {
  id: string;
  timestamp: Date;
  type: 'CP_TP' | 'ATP_JP' | 'MODUL_AJAR';
  subject: string;
  details: string;
  dataSnapshot: any; // Flexible to store CurriculumData or ModulAjarData
  paperSizeSnapshot: 'A4' | 'Letter' | 'F4';
}

interface NonEffectiveRange {
  start: string;
  end: string;
  description: string;
  type: 'holiday' | 'exam' | 'activity';
  category?: string;
  variant?: string;
}

interface AnalysisResult {
    totalTargetJP: number;
    weeklyTargetJP: number;
    totalAvailableSlots: number;
    totalEffectiveWeeks: number;
    semester1: SemesterAnalysis;
    semester2: SemesterAnalysis;
    details: MonthAnalysis[];
    dayDistribution: Record<string, number>; // Summary of effective days (e.g., Senin: 18, Selasa: 17)
}

interface SemesterAnalysis {
    effectiveDays: number;
    nonEffectiveDays: number;
    effectiveWeeks: number;
    availableJP: number; // New field for calculated JP based on slots
}

interface MonthAnalysis {
    monthName: string;
    semester: 1 | 2;
    effectiveDays: number;
    nonEffectiveDetails: { date: string, reason: string }[];
}

// Interface for Modul Ajar Context (Passed from ATP)
interface ModulAjarContext {
    subject: string;
    className: string;
    fase: string;
    elementName: string;
    cp: string;
    tp: string;
    atpItem: AtpItem;
}

// Interface for Modul Ajar Form Data
interface ModulAjarData {
    authorName: string;
    institutionName: string;
    className: string;
    fase: string;
    academicYear: string;
    semester: string;
    subject: string;
    topic: string;
    allocation: string;
    date: string;
    modelMethod: string;
    components: {
        includeLKPD: boolean;
        includeMaterials: boolean;
        includeAssessment: boolean;
        generateImage: boolean;
    };
    content?: string; // Generated HTML content
    generatedImages?: string[]; // Base64 strings
}

interface AIModelRecommendation {
    name: string;
    methods: string;
    reason: string;
    score: number;
}

// --- Constants Data ---

const SUBJECTS = [
  "Bahasa Indonesia",
  "Matematika",
  "IPAS (Ilmu Pengetahuan Alam dan Sosial)",
  "PPKn (Pendidikan Pancasila)",
  "Seni Rupa",
  "Seni Musik",
  "Seni Tari",
  "Seni Teater",
  "PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan)",
  "Bahasa Inggris",
  "Pendidikan Agama Islam",
  "Pendidikan Agama Kristen",
  "Pendidikan Agama Katolik",
  "Pendidikan Agama Hindu",
  "Pendidikan Agama Buddha",
  "Pendidikan Agama Khonghucu",
  "Muatan Lokal"
];

const FASES = [
  { id: 'A', name: 'Fase A (Kelas 1 - 2)', classes: ['Kelas 1', 'Kelas 2'] },
  { id: 'B', name: 'Fase B (Kelas 3 - 4)', classes: ['Kelas 3', 'Kelas 4'] },
  { id: 'C', name: 'Fase C (Kelas 5 - 6)', classes: ['Kelas 5', 'Kelas 6'] },
];

const DAYS_OF_WEEK = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const PAPER_SIZES = {
  'A4': { width: '210mm', height: '297mm' },
  'Letter': { width: '215.9mm', height: '279.4mm' },
  'F4': { width: '215.9mm', height: '330.2mm' }
};

const MODEL_RECOMENDATIONS = [
    "Problem Based Learning (PBL)",
    "Project Based Learning (PjBL)",
    "Discovery Learning",
    "Inquiry Learning",
    "Cooperative Learning",
    "Contextual Teaching and Learning (CTL)",
    "Pembelajaran Berdiferensiasi"
];

const NON_EFFECTIVE_SCHEDULE: NonEffectiveRange[] = [
  { start: '2025-07-14', end: '2025-07-16', description: 'MPLS (Masa Pengenalan Lingkungan Sekolah)', type: 'activity' },
  { start: '2025-07-21', end: '2025-07-24', description: 'Simulasi Asesmen Nasional', type: 'activity' },
  { start: '2025-08-17', end: '2025-08-17', description: 'HUT RI Ke-80', type: 'holiday' },
  { start: '2025-09-05', end: '2025-09-05', description: 'Maulid Nabi Muhammad SAW', type: 'holiday' },
  { start: '2025-09-08', end: '2025-09-11', description: 'Gladi Bersih AN SD (Gelombang 1)', type: 'exam', category: 'anbk_gladi', variant: 'v1' },
  { start: '2025-09-15', end: '2025-09-18', description: 'Gladi Bersih AN SD (Gelombang 2)', type: 'exam', category: 'anbk_gladi', variant: 'v2' },
  { start: '2025-09-22', end: '2025-09-25', description: 'Pelaksanaan AN SD (Tahap 1)', type: 'exam', category: 'anbk_main', variant: 'v1' },
  { start: '2025-09-29', end: '2025-10-02', description: 'Pelaksanaan AN SD (Tahap 2)', type: 'exam', category: 'anbk_main', variant: 'v2' },
  { start: '2025-12-01', end: '2025-12-07', description: 'Sumatif Akhir Semester 1 (Pekan 1)', type: 'exam', category: 'sumatif_ganjil', variant: 'v1' },
  { start: '2025-12-08', end: '2025-12-14', description: 'Sumatif Akhir Semester 1 (Pekan 2)', type: 'exam', category: 'sumatif_ganjil', variant: 'v2' },
  { start: '2025-12-03', end: '2025-12-03', description: 'Hari Disabilitas Internasional', type: 'activity' },
  { start: '2025-12-22', end: '2025-12-24', description: 'Administrasi & Pembagian Rapor Smst 1', type: 'activity' },
  { start: '2025-12-25', end: '2025-12-26', description: 'Natal & Cuti Bersama', type: 'holiday' },
  { start: '2025-12-29', end: '2026-01-10', description: 'Libur Semester 1 (Utama)', type: 'holiday', category: 'libur_smt1', variant: 'v1' },
  { start: '2025-12-22', end: '2026-01-03', description: 'Libur Semester 1 (Alternatif Awal)', type: 'holiday', category: 'libur_smt1', variant: 'v2' },
  { start: '2026-01-01', end: '2026-01-01', description: 'Tahun Baru Masehi', type: 'holiday' },
  { start: '2026-01-16', end: '2026-01-16', description: 'Isra Mi\'raj', type: 'holiday' },
  { start: '2026-02-17', end: '2026-02-17', description: 'Tahun Baru Imlek', type: 'holiday' },
  { start: '2026-02-20', end: '2026-02-23', description: 'Perkiraan Libur Awal Ramadan', type: 'holiday' },
  { start: '2026-02-24', end: '2026-03-13', description: 'Kegiatan Penumbuhan Budi Pekerti', type: 'activity' },
  { start: '2026-03-14', end: '2026-03-28', description: 'Libur Idul Fitri', type: 'holiday' },
  { start: '2026-05-11', end: '2026-05-16', description: 'Sumatif Akhir Jenjang SD (Pekan 1)', type: 'exam', category: 'sumatif_jenjang', variant: 'v1' },
  { start: '2026-05-18', end: '2026-05-23', description: 'Sumatif Akhir Jenjang SD (Pekan 2)', type: 'exam', category: 'sumatif_jenjang', variant: 'v2' },
  { start: '2026-06-01', end: '2026-06-01', description: 'Hari Lahir Pancasila', type: 'holiday' },
  { start: '2026-06-02', end: '2026-06-06', description: 'Sumatif Akhir Tahun/Fase (Pekan 1)', type: 'exam', category: 'sumatif_genap', variant: 'v1' },
  { start: '2026-06-08', end: '2026-06-13', description: 'Sumatif Akhir Tahun/Fase (Pekan 2)', type: 'exam', category: 'sumatif_genap', variant: 'v2' },
  { start: '2026-06-16', end: '2026-06-16', description: 'Tahun Baru Islam', type: 'holiday' },
  { start: '2026-06-24', end: '2026-06-26', description: 'Administrasi & Pembagian Rapor Smst 2', type: 'activity' },
  { start: '2026-06-29', end: '2026-07-11', description: 'Libur Kenaikan Kelas (Utama)', type: 'holiday', category: 'libur_smt2', variant: 'v1' },
  { start: '2026-06-22', end: '2026-07-04', description: 'Libur Kenaikan Kelas (Alternatif Awal)', type: 'holiday', category: 'libur_smt2', variant: 'v2' },
];

const SCHEDULE_OPTIONS: Record<string, { id: string, label: string }[]> = {
  libur_smt1: [
    { id: 'v1', label: 'Utama (29 Des - 10 Jan)' },
    { id: 'v2', label: 'Alternatif (22 Des - 3 Jan)' }
  ],
  libur_smt2: [
    { id: 'v1', label: 'Utama (29 Jun - 11 Jul)' },
    { id: 'v2', label: 'Alternatif (22 Jun - 4 Jul)' }
  ],
  anbk_gladi: [
    { id: 'v1', label: 'Gelombang 1 (8-11 Sep)' },
    { id: 'v2', label: 'Gelombang 2 (15-18 Sep)' }
  ],
  anbk_main: [
    { id: 'v1', label: 'Tahap 1 (22-25 Sep)' },
    { id: 'v2', label: 'Tahap 2 (29 Sep - 2 Okt)' }
  ],
  sumatif_ganjil: [
    { id: 'v1', label: 'Pekan 1 (1-7 Des)' },
    { id: 'v2', label: 'Pekan 2 (8-14 Des)' }
  ],
  sumatif_jenjang: [
    { id: 'v1', label: 'Pekan 1 (11-16 Mei)' },
    { id: 'v2', label: 'Pekan 2 (18-23 Mei)' }
  ],
  sumatif_genap: [
    { id: 'v1', label: 'Pekan 1 (2-6 Jun)' },
    { id: 'v2', label: 'Pekan 2 (8-13 Jun)' }
  ]
};

const JP_STANDARDS: Record<string, Record<string, number>> = {
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
    "Muatan Lokal": { "Kelas 1": 72, "Kelas 2": 72, "Kelas 3": 72, "Kelas 4": 72, "Kelas 5": 72, "Kelas 6": 64 }
};

// --- Visual Calendar Component ---

const VisualCalendar = ({ 
    scheduledDays, 
    scheduleConfig 
}: { 
    scheduledDays: string[], 
    scheduleConfig: Record<string, string> 
}) => {
    const [viewDate, setViewDate] = useState(new Date(2025, 6, 1)); // Start July 2025

    const checkStatus = (dateStr: string): NonEffectiveRange | null => {
        return NON_EFFECTIVE_SCHEDULE.find(range => {
            const inRange = dateStr >= range.start && dateStr <= range.end;
            if (!inRange) return false;
            if (range.category && range.variant) {
                return scheduleConfig[range.category] === range.variant;
            }
            return true;
        }) || null;
    };

    const getDayName = (date: Date): string => {
        const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        return days[date.getDay()];
    };

    const daysInMonth = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const days = [];
        let startDay = firstDay.getDay(); 
        if (startDay === 0) startDay = 7; 
        const padding = startDay === 0 ? 6 : startDay - 1;

        for (let i = 0; i < padding; i++) {
            days.push({ type: 'empty', key: `pad-${i}` });
        }

        for (let d = 1; d <= lastDay.getDate(); d++) {
            const currentDate = new Date(year, month, d);
            const dateStr = formatDateLocal(currentDate);
            const dayName = getDayName(currentDate);
            const conflict = checkStatus(dateStr);
            const isScheduled = scheduledDays.includes(dayName);
            const isWithinAcademicYear = dateStr >= ACADEMIC_START_DATE && dateStr <= ACADEMIC_END_DATE;

            let status: 'effective' | 'noneffective' | 'off' = 'off';
            let tooltip = '';
            
            // Generate detailed tooltip
            if (!isWithinAcademicYear) {
                status = 'off';
                tooltip = `${dayName}, ${d} ${viewDate.toLocaleString('id-ID', { month: 'long'})} ${year}\nStatus: Diluar Tahun Ajaran`;
            } else if (isScheduled) {
                if (conflict) {
                    status = 'noneffective';
                    tooltip = `${dayName}, ${d} ${viewDate.toLocaleString('id-ID', { month: 'long'})} ${year}\nStatus: TIDAK EFEKTIF (Jadwal Terganggu)\nKeterangan: ${conflict.description}`;
                } else {
                    status = 'effective';
                    tooltip = `${dayName}, ${d} ${viewDate.toLocaleString('id-ID', { month: 'long'})} ${year}\nStatus: EFEKTIF BELAJAR\nJadwal Rutin: ${dayName}`;
                }
            } else {
                if (conflict) {
                    tooltip = `${dayName}, ${d} ${viewDate.toLocaleString('id-ID', { month: 'long'})} ${year}\nStatus: LIBUR/KEGIATAN\nKeterangan: ${conflict.description}`;
                } else {
                    tooltip = `${dayName}, ${d} ${viewDate.toLocaleString('id-ID', { month: 'long'})} ${year}\nStatus: Tidak Ada Jadwal`;
                }
            }

            days.push({ 
                type: 'day', key: dateStr, date: d, status, tooltip, 
                isHoliday: conflict?.type === 'holiday', isSunday: currentDate.getDay() === 0, isOutside: !isWithinAcademicYear
            });
        }
        return days;
    }, [viewDate, scheduledDays, scheduleConfig]);

    const handlePrev = () => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
        if (newDate >= new Date(2025, 6, 1)) setViewDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
        if (newDate <= new Date(2026, 6, 1)) setViewDate(newDate);
    };

    return (
        <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-indigo-50/50 border-b border-indigo-100">
                <button onClick={handlePrev} className="p-1 hover:bg-white rounded" disabled={viewDate.getMonth() === 6 && viewDate.getFullYear() === 2025}><ChevronLeft className="w-5 h-5 text-indigo-600" /></button>
                <h3 className="font-bold text-gray-800 text-lg">{viewDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={handleNext} className="p-1 hover:bg-white rounded" disabled={viewDate.getMonth() === 6 && viewDate.getFullYear() === 2026}><ChevronRight className="w-5 h-5 text-indigo-600" /></button>
            </div>
            <div className="p-4">
                <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-gray-400">
                    {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => <div key={d} className={d === 'Min' ? 'text-red-500' : ''}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {daysInMonth.map((day: any) => {
                        if (day.type === 'empty') return <div key={day.key} />;
                        return (
                            <div key={day.key} title={day.tooltip} className={`h-10 rounded border flex items-center justify-center text-sm font-bold cursor-help transition-colors ${
                                day.isOutside ? 'bg-gray-100 text-gray-300' :
                                day.status === 'effective' ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' :
                                day.status === 'noneffective' ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' :
                                day.isHoliday || day.isSunday ? 'text-red-400 border-gray-100 hover:bg-red-50' : 'text-gray-400 border-gray-100 hover:bg-gray-50'
                            }`}>
                                {day.date}
                            </div>
                        );
                    })}
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-xs justify-center border-t pt-3">
                     <div className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 border border-green-200 rounded"></span> Efektif</div>
                     <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 border border-red-200 rounded"></span> Libur/Ujian (Kena Jadwal)</div>
                     <div className="flex items-center gap-1"><span className="w-3 h-3 bg-white border border-gray-200 text-red-400 rounded flex items-center justify-center text-[8px]"></span> Libur Lain</div>
                </div>
            </div>
        </div>
    );
};

// --- Modul Ajar Generator Component ---

const ModulAjarGenerator = ({ 
    context, 
    onBack, 
    onSave 
}: { 
    context: ModulAjarContext, 
    onBack: () => void, 
    onSave: (log: ActivityLog) => void 
}) => {
    const [formData, setFormData] = useState<ModulAjarData>({
        authorName: '',
        institutionName: '',
        className: context.className,
        fase: context.fase,
        academicYear: '2025/2026',
        semester: new Date(context.atpItem.planDate || new Date()).getMonth() < 6 ? 'Genap' : 'Ganjil',
        subject: context.subject,
        topic: context.atpItem.alur,
        allocation: context.atpItem.alokasiWaktu,
        date: context.atpItem.planDate || formatDateLocal(new Date()),
        modelMethod: '',
        components: {
            includeLKPD: true,
            includeMaterials: true,
            includeAssessment: true,
            generateImage: false,
        }
    });

    const [loading, setLoading] = useState(false);
    const [resultContent, setResultContent] = useState<string | null>(null);
    const [paperSize, setPaperSize] = useState<'A4' | 'Letter' | 'F4'>('A4');
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    
    // AI Recommendation State
    const [recLoading, setRecLoading] = useState(false);
    const [aiRecommendations, setAiRecommendations] = useState<AIModelRecommendation[]>([]);

    // Auto-load Identity
    useEffect(() => {
        const savedAuthor = localStorage.getItem('prota_author_name');
        const savedInst = localStorage.getItem('prota_institution_name');
        if (savedAuthor || savedInst) {
            setFormData(prev => ({
                ...prev,
                authorName: savedAuthor || prev.authorName,
                institutionName: savedInst || prev.institutionName
            }));
        }
    }, []);

    // Auto-save Identity
    const handleIdentityChange = (field: 'authorName' | 'institutionName', value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        localStorage.setItem(`prota_${field === 'authorName' ? 'author_name' : 'institution_name'}`, value);
    };

    const handleGetRecommendation = async () => {
        setRecLoading(true);
        setAiRecommendations([]);
        try {
            const apiKey = getApiKey();
            if (!apiKey) throw new Error("API Key not found");
            const ai = new GoogleGenAI({ apiKey });

            const prompt = `
                Bertindaklah sebagai Konsultan Kurikulum Merdeka.
                Berikan 3 REKOMENDASI Model Pembelajaran beserta METODE/TEKNIK Pembelajaran yang spesifik dan efektif untuk materi berikut.
                
                KONTEKS:
                - Jenjang: SD
                - Kelas: ${context.className} (${context.fase})
                - Mapel: ${context.subject}
                - Topik/ATP: ${context.atpItem.alur}
                - CP: ${context.cp}

                INSTRUKSI:
                1. Analisis kesesuaian materi dengan model pembelajaran.
                2. Berikan 3 opsi model berbeda.
                3. Untuk setiap model, tentukan METODE/TEKNIK konkret yang mendukung sintaks model tersebut (contoh: jika Model PBL, metodenya bisa Diskusi Kelompok & Presentasi Karya).
                4. Berikan skor kecocokan (0-100) dan alasan singkat.

                OUTPUT JSON Format:
                {
                  "recommendations": [
                    {
                      "name": "Nama Model (contoh: Project Based Learning)",
                      "methods": "Daftar Metode Konkret (contoh: Diskusi, Eksperimen Sederhana, Gallery Walk)",
                      "reason": "Alasan singkat mengapa kombinasi model dan metode ini tepat.",
                      "score": 95
                    },
                    ... (2 opsi lainnya)
                  ]
                }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });

            let cleanText = response.text || "{}";
            cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();
            const result = JSON.parse(cleanText);

            if (result.recommendations && Array.isArray(result.recommendations)) {
                setAiRecommendations(result.recommendations);
            } else {
                throw new Error("Format respon AI tidak sesuai");
            }

        } catch (e: any) {
            alert("Gagal mendapatkan rekomendasi: " + e.message);
        } finally {
            setRecLoading(false);
        }
    };

    const handleGenerateModul = async () => {
        setLoading(true);
        setGeneratedImageUrl(null);
        try {
            const apiKey = getApiKey();
            if (!apiKey) throw new Error("API Key not found");
            const ai = new GoogleGenAI({ apiKey });

            const prompt = `
                Bertindaklah sebagai Guru Profesional ahli Kurikulum Merdeka (BSKAP 046/2025).
                Buatlah MODUL AJAR lengkap dan komprehensif.
                INFORMASI UMUM:
                - Penyusun: ${formData.authorName}
                - Instansi: ${formData.institutionName}
                - Jenjang/Kelas: SD / ${formData.className} (${formData.fase})
                - Mapel: ${formData.subject}
                - Alokasi Waktu: ${formData.allocation}
                - Tanggal: ${formData.date}
                - Topik/Materi: ${formData.topic}
                - Model Pembelajaran: ${formData.modelMethod || 'Pilih yang sesuai (PBL/PjBL/Inquiry)'}
                KOMPONEN INTI:
                - Capaian Pembelajaran (CP): ${context.cp}
                - Tujuan Pembelajaran (TP): ${context.tp}
                - Pemahaman Bermakna
                - Pertanyaan Pemantik
                - Kegiatan Pembelajaran (Pendahuluan, Inti, Penutup)
                LAMPIRAN (Sajikan dalam format tabel HTML modern jika memungkinkan):
                ${formData.components.includeMaterials ? '- Materi Ajar (Ringkasan)' : ''}
                ${formData.components.includeLKPD ? '- Lembar Kerja Peserta Didik (LKPD) - Buatkan instruksi detail.' : ''}
                ${formData.components.includeAssessment ? '- Instrumen Penilaian (Rubrik/Soal)' : ''}
                OUTPUT FORMAT:
                Berikan output dalam format HTML (tanpa tag <html>/<body>, hanya konten div) yang siap di-render. Gunakan styling inline CSS minimalis untuk tabel (border-collapse, padding: 5px, border: 1px solid black).
                Gunakan tag <h3> untuk judul bagian.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });

            const html = response.text || "<p>Gagal membuat konten.</p>";
            setResultContent(html);

            let imgData = null;
            if (formData.components.generateImage) {
                const imgPrompt = `Ilustrasi edukatif untuk materi pelajaran SD: ${formData.topic}. Gaya kartun ramah anak, berwarna cerah, jelas.`;
                const imgResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [{ text: imgPrompt }] }
                });
                
                for (const part of imgResponse.candidates?.[0]?.content?.parts || []) {
                    if (part.inlineData) {
                        imgData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                        setGeneratedImageUrl(imgData);
                    }
                }
            }

            onSave({
                id: Date.now().toString(),
                timestamp: new Date(),
                type: 'MODUL_AJAR',
                subject: formData.subject,
                details: `Modul Ajar: ${formData.topic}`,
                dataSnapshot: { ...formData, content: html, generatedImages: imgData ? [imgData] : [] },
                paperSizeSnapshot: paperSize
            });

        } catch (e: any) {
            console.error(e);
            alert("Gagal: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadDoc = () => {
        if (!resultContent) return;
        const size = PAPER_SIZES[paperSize];
        const footerText = `Modul Ajar - ${formData.subject} - ${formData.className} | Disusun oleh: ${formData.authorName}`;

        const htmlContent = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head>
            <meta charset='utf-8'>
            <title>Modul Ajar</title>
            <style>
              @page { size: ${size.width} ${size.height}; mso-page-orientation: portrait; margin: 2.54cm; mso-page-footer: f1; }
              div.f1 { margin-bottom: 20pt; font-size: 9pt; text-align: right; color: #666; border-top: 1px solid #ccc; padding-top: 5pt; }
              body { font-family: 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; }
              table { border-collapse: collapse; width: 100%; margin-bottom: 15px; }
              td, th { border: 1px solid #000; padding: 5px; vertical-align: top; }
              img { max-width: 100%; height: auto; margin: 10px 0; border: 1px solid #ddd; }
            </style>
          </head>
          <body>
            <div style="text-align: center; margin-bottom: 20pt;">
                <h2 style="margin: 0;">MODUL AJAR KURIKULUM MERDEKA</h2>
                <h3 style="margin: 5pt 0;">${formData.institutionName.toUpperCase()}</h3>
            </div>
            <hr/><br/>
            ${resultContent}
            ${generatedImageUrl ? `<br/><h3>Lampiran Visual</h3><img src="${generatedImageUrl}" alt="Ilustrasi Materi" width="400" />` : ''}
            <div style='mso-element:footer' id='f1'><div class='f1'>${footerText} - Halaman <span style='mso-field-code:" PAGE "'></span></div></div>
          </body>
          </html>
        `;

        const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Modul_Ajar_${formData.subject}_${formData.topic.substring(0,20)}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="animate-in slide-in-from-right duration-300">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="p-1 hover:bg-white/20 rounded-full transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                        <div><h2 className="text-lg font-bold">Generator Modul Ajar AI</h2><p className="text-blue-100 text-xs">{context.subject} - {context.className}</p></div>
                    </div>
                    <Settings className="w-5 h-5 opacity-80" />
                </div>
                <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)]">
                    <div className="w-full lg:w-1/3 bg-gray-50 p-6 overflow-y-auto border-r border-gray-200">
                         <div className="space-y-4">
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2"><User className="w-4 h-4 text-blue-500" /> Identitas Penyusun</h3>
                                <div className="space-y-3">
                                    <div><label className="text-xs font-medium text-gray-600 block mb-1">Nama Penyusun</label><input type="text" value={formData.authorName} onChange={(e) => handleIdentityChange('authorName', e.target.value)} className="w-full text-sm p-2 border border-gray-300 rounded" placeholder="Contoh: Budi Santoso, S.Pd." /></div>
                                    <div><label className="text-xs font-medium text-gray-600 block mb-1">Nama Instansi</label><input type="text" value={formData.institutionName} onChange={(e) => handleIdentityChange('institutionName', e.target.value)} className="w-full text-sm p-2 border border-gray-300 rounded" placeholder="Contoh: SD Negeri 1 Merdeka" /></div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-purple-500" /> Informasi Umum</h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><label className="text-xs font-medium text-gray-600 block mb-1">Tahun Ajaran</label><select value={formData.academicYear} onChange={(e) => setFormData({...formData, academicYear: e.target.value})} className="w-full text-sm p-2 border border-gray-300 rounded"><option>2025/2026</option><option>2026/2027</option></select></div>
                                        <div><label className="text-xs font-medium text-gray-600 block mb-1">Semester</label><select value={formData.semester} onChange={(e) => setFormData({...formData, semester: e.target.value})} className="w-full text-sm p-2 border border-gray-300 rounded"><option>Ganjil</option><option>Genap</option></select></div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 block mb-1">Model Pembelajaran</label>
                                        <div className="flex gap-2 mb-2">
                                            <input list="models" type="text" value={formData.modelMethod} onChange={(e) => setFormData({...formData, modelMethod: e.target.value})} className="w-full text-sm p-2 border border-gray-300 rounded" placeholder="Pilih atau ketik..." />
                                            <button onClick={handleGetRecommendation} disabled={recLoading} className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded hover:bg-indigo-100 flex items-center gap-1 transition-colors disabled:opacity-50 shadow-sm">
                                                {recLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                                                <span className="text-xs font-bold whitespace-nowrap">Tanya AI</span>
                                            </button>
                                        </div>
                                        <datalist id="models">{MODEL_RECOMENDATIONS.map(m => <option key={m} value={m} />)}</datalist>

                                        {/* AI Recommendations List */}
                                        {aiRecommendations.length > 0 && (
                                            <div className="space-y-2 mt-3 animate-in fade-in slide-in-from-top-4">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-500" /> Rekomendasi AI</p>
                                                {aiRecommendations.map((rec, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        onClick={() => setFormData({...formData, modelMethod: `${rec.name} (Metode: ${rec.methods})`})} 
                                                        className={`p-3 border rounded-lg cursor-pointer transition-all group ${formData.modelMethod.includes(rec.name) ? 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-400' : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-sm'}`}
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className="font-bold text-xs text-indigo-900 group-hover:text-indigo-700">{rec.name}</h4>
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${rec.score >= 90 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{rec.score}% Match</span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-800 font-medium mb-1"><span className="text-gray-500 font-normal">Metode:</span> {rec.methods}</p>
                                                        <p className="text-[10px] text-gray-600 leading-snug">{rec.reason}</p>
                                                        {formData.modelMethod.includes(rec.name) && <div className="mt-2 text-[10px] font-bold text-indigo-600 flex items-center gap-1"><Check className="w-3 h-3" /> Terpilih</div>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2"><Layout className="w-4 h-4 text-green-500" /> Komponen Modul</h3>
                                <div className="space-y-2">
                                    {[{ id: 'includeMaterials', label: 'Buat Materi Ajar' }, { id: 'includeLKPD', label: 'Buat LKPD' }, { id: 'includeAssessment', label: 'Buat Instrumen Penilaian' }, { id: 'generateImage', label: 'Buat Gambar Ilustrasi (AI)' }].map(opt => (
                                        <label key={opt.id} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={(formData.components as any)[opt.id]} onChange={(e) => setFormData({...formData, components: {...formData.components, [opt.id]: e.target.checked}})} className="rounded text-blue-600" /><span className="text-sm text-gray-700">{opt.label}</span></label>
                                    ))}
                                </div>
                            </div>
                            <button onClick={handleGenerateModul} disabled={loading || !formData.authorName} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}{loading ? 'Sedang Menyusun...' : 'Generate Modul Ajar'}</button>
                         </div>
                    </div>
                    <div className="w-full lg:w-2/3 p-6 bg-white overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2"><FileText className="w-5 h-5 text-gray-500" /> Preview Dokumen</h3>
                            <div className="flex items-center gap-2">
                                <select value={paperSize} onChange={(e) => setPaperSize(e.target.value as any)} className="text-sm border border-gray-300 rounded p-1"><option value="A4">A4</option><option value="Letter">Letter</option><option value="F4">F4</option></select>
                                <button onClick={handleDownloadDoc} disabled={!resultContent} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded shadow-sm disabled:opacity-50"><Download className="w-4 h-4" /> Unduh .doc</button>
                            </div>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-8 min-h-[600px] shadow-inner bg-gray-50">
                             {resultContent ? (
                                 <div className="prose max-w-none font-serif">
                                     <div className="text-center mb-6 pb-4 border-b border-gray-300"><h1 className="text-xl font-bold uppercase mb-1">Modul Ajar {formData.subject}</h1><p className="text-sm text-gray-600">{formData.institutionName} | Tahun Ajaran {formData.academicYear}</p></div>
                                     <div dangerouslySetInnerHTML={{__html: resultContent}} />
                                     {generatedImageUrl && (<div className="mt-6 text-center"><h4 className="font-bold text-sm mb-2 text-left">Lampiran Visual</h4><img src={generatedImageUrl} alt="Generated" className="max-w-md mx-auto rounded shadow-sm border border-gray-300" /></div>)}
                                 </div>
                             ) : (<div className="flex flex-col items-center justify-center h-full text-gray-400"><FilePlus className="w-16 h-16 mb-4 opacity-20" /><p>Isi form di samping dan klik "Generate" untuk melihat hasil.</p></div>)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- App Component ---

const App = () => {
  const [appStage, setAppStage] = useState<'landing' | 'tutorial' | 'generator'>('landing');
  const [currentView, setCurrentView] = useState<'generator' | 'history' | 'modul_ajar'>('generator');
  const [selectedFase, setSelectedFase] = useState(FASES[0]);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [loading, setLoading] = useState(false);
  const [atpLoading, setAtpLoading] = useState<string | null>(null);
  const [data, setData] = useState<CurriculumData | null>(null);
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter' | 'F4'>('A4');
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [modulContext, setModulContext] = useState<ModulAjarContext | null>(null);
  const [showJpReference, setShowJpReference] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [analysisModal, setAnalysisModal] = useState<string | null>(null);
  
  // Schedules & Config
  const [classSchedules, setClassSchedules] = useState<Record<string, string[]>>({});
  const [scheduleConfig, setScheduleConfig] = useState<Record<string, string>>({
    libur_smt1: 'v1', libur_smt2: 'v1', anbk_gladi: 'v1', anbk_main: 'v1', sumatif_ganjil: 'v1', sumatif_jenjang: 'v1', sumatif_genap: 'v1'
  });

  // Helper
  const getSubjectKey = (subjectName: string): string | null => {
      if (!subjectName) return null;
      if (JP_STANDARDS[subjectName]) return subjectName;
      const keys = Object.keys(JP_STANDARDS);
      const lower = subjectName.toLowerCase().trim();
      const directKey = keys.find(k => k.toLowerCase() === lower);
      if (directKey) return directKey;
      const fuzzyKey = keys.find(k => lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower));
      return fuzzyKey || null;
  };

  const addActivity = (type: 'CP_TP' | 'ATP_JP' | 'MODUL_AJAR', subject: string, details: string, dataSnapshot: any) => {
    const newActivity: ActivityLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      subject,
      details,
      dataSnapshot: JSON.parse(JSON.stringify(dataSnapshot)),
      paperSizeSnapshot: paperSize
    };
    setActivities(prev => [newActivity, ...prev]);
  };
  
  const saveActivityLog = (log: ActivityLog) => {
    setActivities(prev => [log, ...prev]);
  };

  const checkNonEffectiveDate = (dateStr: string): NonEffectiveRange | null => {
      if (!dateStr) return null;
      return NON_EFFECTIVE_SCHEDULE.find(range => {
          const inRange = dateStr >= range.start && dateStr <= range.end;
          if (!inRange) return false;
          if (range.category && range.variant) {
              return scheduleConfig[range.category] === range.variant;
          }
          return true;
      }) || null;
  };

  const getDayName = (date: Date): string => {
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      return days[date.getDay()];
  };

  const getEffectiveDates = (selectedDays: string[]): Date[] => {
      const dates: Date[] = [];
      const startDate = parseDateToLocal(ACADEMIC_START_DATE); 
      const endDate = parseDateToLocal(ACADEMIC_END_DATE); 

      let current = new Date(startDate);
      while (current <= endDate) {
          const dayName = getDayName(current);
          const dateStr = formatDateLocal(current);
          const conflict = checkNonEffectiveDate(dateStr);
          if (selectedDays.includes(dayName) && (!conflict)) {
              dates.push(new Date(current));
          }
          current.setDate(current.getDate() + 1);
      }
      return dates;
  };

  const toggleScheduleDay = (className: string, day: string) => {
      setClassSchedules(prev => {
          const currentDays = prev[className] || [];
          if (currentDays.includes(day)) {
              return { ...prev, [className]: currentDays.filter(d => d !== day) };
          } else {
              const newDays = [...currentDays, day].sort((a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b));
              return { ...prev, [className]: newDays };
          }
      });
  };

  const getISOWeek = (d: Date) => {
      const date = new Date(d.getTime());
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
      const week1 = new Date(date.getFullYear(), 0, 4);
      return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  const calculateCalendarAnalysis = (className: string, subject: string): AnalysisResult | null => {
        const selectedDays = classSchedules[className] || [];
        if (selectedDays.length === 0) return null;

        const subjectKey = getSubjectKey(subject);
        const annualTargetJP = subjectKey ? JP_STANDARDS[subjectKey]?.[className] || 0 : 0;
        
        const startDate = parseDateToLocal(ACADEMIC_START_DATE);
        const endDate = parseDateToLocal(ACADEMIC_END_DATE);
        
        const liburSmt1Variant = scheduleConfig['libur_smt1'];
        const liburRange = NON_EFFECTIVE_SCHEDULE.find(r => r.category === 'libur_smt1' && r.variant === liburSmt1Variant);
        let semester2StartDate = parseDateToLocal('2026-01-01');
        if (liburRange) {
            const liburEnd = parseDateToLocal(liburRange.end);
            semester2StartDate = new Date(liburEnd);
            semester2StartDate.setDate(semester2StartDate.getDate() + 1); 
        }

        let totalAvailableSlots = 0;
        let semester1Data = { effectiveDays: 0, nonEffectiveDays: 0, effectiveWeeks: 0, uniqueWeeks: new Set<string>(), availableJP: 0 };
        let semester2Data = { effectiveDays: 0, nonEffectiveDays: 0, effectiveWeeks: 0, uniqueWeeks: new Set<string>(), availableJP: 0 };
        const monthDetails: Record<string, MonthAnalysis> = {};
        const dayDistribution: Record<string, number> = {};

        // Calculate JP per meeting (usually 2-3 JP depending on load)
        const estJPPerMeeting = className.includes('6') ? 2 : 3;

        let current = new Date(startDate);
        while (current <= endDate) {
            const dayName = getDayName(current);
            const dateStr = formatDateLocal(current);
            const monthKey = current.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
            const semester = current < semester2StartDate ? 1 : 2;
            const weekKey = `${getISOWeek(current)}-${current.getFullYear()}`; 

            if (!monthDetails[monthKey]) {
                monthDetails[monthKey] = { monthName: monthKey, semester, effectiveDays: 0, nonEffectiveDetails: [] };
            }

            if (selectedDays.includes(dayName)) {
                 const conflict = checkNonEffectiveDate(dateStr);
                 if (!conflict) {
                     totalAvailableSlots++;
                     monthDetails[monthKey].effectiveDays++;
                     dayDistribution[dayName] = (dayDistribution[dayName] || 0) + 1;

                     if (semester === 1) {
                         semester1Data.effectiveDays++;
                         semester1Data.uniqueWeeks.add(weekKey);
                     } else {
                         semester2Data.effectiveDays++;
                         semester2Data.uniqueWeeks.add(weekKey);
                     }
                 } else {
                     monthDetails[monthKey].nonEffectiveDetails.push({ date: dateStr, reason: conflict.description });
                     if (semester === 1) semester1Data.nonEffectiveDays++;
                     else semester2Data.nonEffectiveDays++;
                 }
            }
            current.setDate(current.getDate() + 1);
        }

        // Calculate Weekly Target based on effective weeks
        const totalEffectiveWeeks = semester1Data.uniqueWeeks.size + semester2Data.uniqueWeeks.size;
        const weeklyTargetJP = totalEffectiveWeeks > 0 ? Math.round(annualTargetJP / totalEffectiveWeeks) : 0;
        
        // Approx JP calc
        semester1Data.availableJP = semester1Data.effectiveDays * Math.round(weeklyTargetJP / selectedDays.length || 1);
        semester2Data.availableJP = semester2Data.effectiveDays * Math.round(weeklyTargetJP / selectedDays.length || 1);

        return {
            totalTargetJP: annualTargetJP,
            weeklyTargetJP,
            totalAvailableSlots,
            totalEffectiveWeeks,
            semester1: semester1Data,
            semester2: semester2Data,
            details: Object.values(monthDetails),
            dayDistribution
        };
  };

  const generateContent = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const apiKey = getApiKey();
      if (!apiKey) throw new Error("API Key not found");
      const ai = new GoogleGenAI({ apiKey });

      const schema: Schema = {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          fase: { type: Type.STRING },
          description: { type: Type.STRING },
          elements: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                elementName: { type: Type.STRING },
                capaianPembelajaran: { type: Type.STRING },
                allocations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      className: { type: Type.STRING },
                      tujuanPembelajaran: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING },
                        description: "Daftar Tujuan Pembelajaran spesifik"
                      }
                    },
                    required: ["className", "tujuanPembelajaran"]
                  }
                }
              },
              required: ["elementName", "capaianPembelajaran", "allocations"]
            }
          }
        },
        required: ["subject", "fase", "elements", "description"]
      };

      const prompt = `
        Bertindaklah sebagai ahli kurikulum pendidikan Indonesia (Kurikulum Merdeka 2025).
        Tugas: Analisis CP dan rumuskan Tujuan Pembelajaran (TP). JANGAN buat ATP dulu.
        Parameter: Jenjang SD, Fase ${selectedFase.name}, Mapel ${selectedSubject}, Kelas ${selectedFase.classes.join(" dan ")}.
        Instruksi: Tuliskan Elemen dan CP terbaru. Pecah CP menjadi Tujuan Pembelajaran (TP) spesifik.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: schema, maxOutputTokens: 8192 }
      });

      let resultData: CurriculumData;
      try {
        resultData = JSON.parse(response.text || "{}") as CurriculumData;
      } catch (e) {
        throw new Error("Gagal parsing respon JSON dari AI. Silakan coba lagi.");
      }
      
      setData(resultData);
      addActivity('CP_TP', selectedSubject, `Analisis CP & TP untuk ${selectedFase.name}`, resultData);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal membuat konten.");
    } finally {
      setLoading(false);
    }
  };

  const generateATP = async (className: string) => {
    if (!data) return;
    setAtpLoading(className);
    
    // 1. SMART JP CALCULATION
    let targetJP = 216; 
    const subjectKey = getSubjectKey(selectedSubject) || getSubjectKey(data.subject);
    if (subjectKey) {
        targetJP = JP_STANDARDS[subjectKey]?.[className] || 216;
    }

    let selectedDays = classSchedules[className] || [];
    const effectiveWeeks = className.includes('6') ? 32 : 36;
    const weeklyLoad = Math.ceil(targetJP / effectiveWeeks);
    const MAX_JP_PER_DAY = 3; 
    
    // Auto-select days if not enough
    const minDaysNeeded = Math.ceil(weeklyLoad / MAX_JP_PER_DAY);
    if (selectedDays.length < minDaysNeeded) {
        const candidateDays = ["Senin", "Rabu", "Jumat", "Selasa", "Kamis", "Sabtu"];
        const needed = minDaysNeeded - selectedDays.length;
        const available = candidateDays.filter(d => !selectedDays.includes(d));
        selectedDays = [...selectedDays, ...available.slice(0, needed)];
        selectedDays.sort((a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b));
        setClassSchedules(prev => ({ ...prev, [className]: selectedDays }));
    }

    try {
        const apiKey = getApiKey();
        const ai = new GoogleGenAI({ apiKey });

        // 2. TIMELINE GENERATION based on Calendar
        const allEffectiveDates = getEffectiveDates(selectedDays);
        const totalAvailableSlots = allEffectiveDates.length;
        
        let baseJP = 0;
        let remainder = 0;
        if (totalAvailableSlots > 0) {
            baseJP = Math.floor(targetJP / totalAvailableSlots);
            remainder = targetJP % totalAvailableSlots;
        }
        
        const timelineSlots: { date: string, allocatedJP: number }[] = [];
        let accumulatedJP = 0;
        
        for (let i = 0; i < totalAvailableSlots; i++) {
             if (accumulatedJP >= targetJP) break; 
             const allocated = i < remainder ? baseJP + 1 : baseJP;
             if (allocated > 0) {
                 timelineSlots.push({
                    date: formatDateLocal(allEffectiveDates[i]),
                    allocatedJP: allocated
                 });
                 accumulatedJP += allocated;
             }
        }

        // 3. PREPARE FLATTENED TP LIST (Optimization for Token Limits)
        interface FlatTP {
            id: number;
            tp: string;
            elementIndex: number;
            allocIndex: number;
            tpIndex: number;
        }
        
        const flatTPs: FlatTP[] = [];
        let tpCounter = 1;
        
        data.elements.forEach((el, elIdx) => {
            el.allocations.forEach((alloc, allocIdx) => {
                if (alloc.className === className) {
                    alloc.tujuanPembelajaran.forEach((tp, tpIdx) => {
                        flatTPs.push({
                            id: tpCounter++,
                            tp: tp,
                            elementIndex: elIdx,
                            allocIndex: allocIdx,
                            tpIndex: tpIdx
                        });
                    });
                }
            });
        });

        const prompt = `
            PERAN: Ahli Kurikulum & Penjadwalan Sekolah Dasar (Kurikulum Merdeka 2025).
            TUGAS: Pecah Tujuan Pembelajaran (TP) menjadi aktivitas-aktivitas kecil (Alur Tujuan Pembelajaran/ATP).
            
            KONTEKS:
            - Mapel: ${data.subject} (${className})
            - Total Target JP: ${targetJP} JP
            - Jumlah Slot Pertemuan: ${timelineSlots.length}
            
            DAFTAR TP (ID: TP):
            ${flatTPs.map(f => `${f.id}: ${f.tp}`).join('\n')}
            
            INSTRUKSI:
            1. Buat rangkaian aktivitas untuk SETIAP TP di atas.
            2. Satu TP bisa dipecah menjadi beberapa aktivitas (beberapa pertemuan) jika kompleks.
            3. Estimasi JP per aktivitas rata-rata ${Math.round(targetJP / timelineSlots.length) || 2} JP.
            4. Gunakan field 'alur' untuk deskripsi aktivitas pembelajaran yang konkret.
            5. Return JSON array yang memetakan tpId ke daftar aktivitas.
        `;

        const schema: Schema = {
            type: Type.OBJECT,
            properties: {
                allocations: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            tpId: { type: Type.NUMBER, description: "ID dari daftar TP" },
                            activities: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        alur: { type: Type.STRING, description: "Deskripsi aktivitas pembelajaran" },
                                        jp: { type: Type.NUMBER, description: "Estimasi JP" }
                                    },
                                    required: ["alur", "jp"]
                                }
                            }
                        },
                        required: ["tpId", "activities"]
                    }
                }
            },
            required: ["allocations"]
        };

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { 
                responseMimeType: "application/json", 
                responseSchema: schema,
                maxOutputTokens: 8192
            }
        });

        let result: { allocations: { tpId: number, activities: { alur: string, jp: number }[] }[] };
        try {
            let cleanText = response.text || "{}";
            cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();
            result = JSON.parse(cleanText);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            throw new Error("Gagal parsing respon ATP. Silakan coba lagi.");
        }

        // 4. MAP RESULT BACK TO DATA STRUCTURE
        const newData = JSON.parse(JSON.stringify(data));
        
        // Ensure structure exists
        flatTPs.forEach(f => {
             const alloc = newData.elements[f.elementIndex].allocations[f.allocIndex];
             if (!alloc.structuredAtp) alloc.structuredAtp = new Array(alloc.tujuanPembelajaran.length);
        });

        let slotCursor = 0;

        // Iterate flatTPs to ensure every TP is handled
        flatTPs.forEach(f => {
            const aiAllocation = result.allocations?.find(a => a.tpId === f.id);
            const activities = aiAllocation?.activities || [];
            
            const processedItems: AtpItem[] = [];

            if (activities.length > 0) {
                 activities.forEach(act => {
                     let date = '';
                     let jp = `${act.jp} JP`;

                     if (slotCursor < timelineSlots.length) {
                         const slot = timelineSlots[slotCursor];
                         date = slot.date;
                         jp = `${slot.allocatedJP} JP`; // Align JP with timeline slot
                         slotCursor++;
                     }

                     processedItems.push({
                         alur: act.alur,
                         alokasiWaktu: jp,
                         planDate: date
                     });
                 });
            } else {
                // Fallback for missing TPs
                let date = '';
                let jp = '2 JP';
                if (slotCursor < timelineSlots.length) {
                     const slot = timelineSlots[slotCursor];
                     date = slot.date;
                     jp = `${slot.allocatedJP} JP`;
                     slotCursor++;
                }
                processedItems.push({
                     alur: `Pembelajaran: ${f.tp}`,
                     alokasiWaktu: jp,
                     planDate: date
                });
            }

            // Assign
            const alloc = newData.elements[f.elementIndex].allocations[f.allocIndex];
            alloc.structuredAtp[f.tpIndex] = {
                tp: f.tp,
                atpItems: processedItems
            };
        });

        setData(newData);
        addActivity('ATP_JP', data.subject, `Penyusunan ATP & Jadwal Otomatis ${className}`, newData);

    } catch (err: any) {
        console.error(err);
        setError("Gagal membuat ATP: " + err.message);
    } finally {
        setAtpLoading(null);
    }
  };

  const handleUpdateDate = (className: string, elIdx: number, allocIdx: number, grpIdx: number, itemIdx: number, date: string) => {
      if (!data) return;
      const newData = { ...data };
      newData.elements[elIdx].allocations[allocIdx].structuredAtp![grpIdx].atpItems[itemIdx].planDate = date;
      setData(newData);
  };

  const openModulGenerator = (className: string, el: ElementData, tp: string, atp: AtpItem) => {
      setModulContext({
          subject: data?.subject || '',
          className,
          fase: data?.fase || '',
          elementName: el.elementName,
          cp: el.capaianPembelajaran,
          tp,
          atpItem: atp
      });
      setCurrentView('modul_ajar');
  };

  // --- Render ---

  if (appStage === 'landing') {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex flex-col items-center justify-center text-white">
            <h1 className="text-5xl font-bold mb-6">Perangkat Ajar AI 2025</h1>
            <button onClick={() => setAppStage('generator')} className="px-8 py-4 bg-white text-blue-900 rounded-xl font-bold text-lg shadow-xl hover:bg-blue-50 transition-all">Mulai Sekarang</button>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative bg-gray-50">
      {/* JP Reference Modal */}
      {showJpReference && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                 <div className="flex items-center gap-3"><BookOpen className="w-6 h-6 text-blue-600" /><div><h3 className="text-xl font-bold text-gray-900">Standar Alokasi JP Intrakurikuler</h3><p className="text-sm text-gray-500">Referensi: Permendikdasmen No. 13 Tahun 2025</p></div></div>
                 <button onClick={() => setShowJpReference(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-6 h-6 text-gray-500" /></button>
              </div>
              <div className="p-6 overflow-y-auto">
                 <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm text-left">
                       <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
                          <tr><th className="px-4 py-3 font-bold border-r">Mata Pelajaran</th><th className="px-4 py-3 text-center border-r">Kelas 1</th><th className="px-4 py-3 text-center border-r">Kelas 2</th><th className="px-4 py-3 text-center border-r">Kelas 3</th><th className="px-4 py-3 text-center border-r">Kelas 4</th><th className="px-4 py-3 text-center border-r">Kelas 5</th><th className="px-4 py-3 text-center">Kelas 6</th></tr>
                       </thead>
                       <tbody className="divide-y divide-gray-200">
                          {Object.entries(JP_STANDARDS).map(([subject, classes], idx) => (
                             <tr key={subject} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}><td className="px-4 py-3 font-medium text-gray-900 border-r">{subject}</td><td className="px-4 py-3 text-center border-r">{classes['Kelas 1']}</td><td className="px-4 py-3 text-center border-r">{classes['Kelas 2']}</td><td className="px-4 py-3 text-center border-r">{classes['Kelas 3']}</td><td className="px-4 py-3 text-center border-r">{classes['Kelas 4']}</td><td className="px-4 py-3 text-center border-r">{classes['Kelas 5']}</td><td className="px-4 py-3 text-center">{classes['Kelas 6']}</td></tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendar && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
               <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-blue-50">
                  <div className="flex items-center gap-3"><CalendarDays className="w-6 h-6 text-blue-600" /><div><h3 className="text-xl font-bold text-gray-900">Kalender Akademik 2025/2026</h3><p className="text-sm text-gray-500">Daftar hari libur dan kegiatan non-efektif</p></div></div>
                  <button onClick={() => setShowCalendar(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-6 h-6 text-gray-500" /></button>
               </div>
               <div className="p-6 overflow-y-auto">
                   <div className="space-y-4">
                       {NON_EFFECTIVE_SCHEDULE.map((range, index) => {
                           if (range.category && range.variant !== scheduleConfig[range.category]) return null;
                           return (
                               <div key={index} className="flex items-start gap-4 p-3 rounded-lg border bg-blue-50 border-blue-100">
                                   <div className="p-2 rounded-full shrink-0 bg-blue-100 text-blue-600"><CalendarCheck className="w-5 h-5" /></div>
                                   <div><h4 className="font-bold text-sm text-blue-800">{range.description}</h4><p className="text-xs text-gray-600 mt-1">{range.start} - {range.end}</p></div>
                               </div>
                           )
                       })}
                   </div>
               </div>
            </div>
         </div>
      )}

      {/* Analysis Modal */}
      {analysisModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-indigo-50">
                 <div className="flex items-center gap-3"><BarChart3 className="w-6 h-6 text-indigo-600" /><div><h3 className="text-xl font-bold text-gray-900">Analisis Kalender & Beban JP</h3><p className="text-sm text-gray-500">Kelas: {analysisModal} • {data?.subject}</p></div></div>
                 <button onClick={() => setAnalysisModal(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-6 h-6 text-gray-500" /></button>
              </div>
              <div className="p-6 overflow-y-auto bg-gray-50 flex flex-col md:flex-row gap-6">
                {(() => {
                    if (!data) return null;
                    const result = calculateCalendarAnalysis(analysisModal, data.subject);
                    if (!result) return <div className="text-center py-10 w-full">Jadwal Belum Dipilih</div>;

                    return (
                        <>
                            <div className="w-full md:w-1/3 space-y-6">
                                <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-100">
                                    <h4 className="text-sm font-bold text-gray-700 uppercase mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-indigo-600"/> Ringkasan Alokasi</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-600">Total Hari Efektif</span>
                                            <span className="text-lg font-bold text-indigo-700">{result.totalAvailableSlots} Hari</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-600">Total Pekan Efektif</span>
                                            <span className="text-lg font-bold text-green-700">{result.totalEffectiveWeeks} Pekan</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                                            <span className="text-sm font-medium text-gray-600">Target Kurikulum</span>
                                            <span className="text-lg font-bold text-blue-700">{result.totalTargetJP} JP/Thn</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                                    <h4 className="text-sm font-bold text-gray-700 uppercase mb-4 flex items-center gap-2"><Table className="w-4 h-4 text-gray-500"/> Rincian Semester</h4>
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-gray-100 text-gray-700 font-bold uppercase">
                                            <tr><th className="p-2 rounded-tl">Uraian</th><th className="p-2 text-center">Smt 1</th><th className="p-2 text-center rounded-tr">Smt 2</th></tr>
                                        </thead>
                                        <tbody className="divide-y text-gray-600">
                                            <tr><td className="p-2 font-medium">Hari Efektif</td><td className="p-2 text-center font-bold">{result.semester1.effectiveDays}</td><td className="p-2 text-center font-bold">{result.semester2.effectiveDays}</td></tr>
                                            <tr><td className="p-2 font-medium">Pekan Efektif</td><td className="p-2 text-center font-bold">{result.semester1.effectiveWeeks}</td><td className="p-2 text-center font-bold">{result.semester2.effectiveWeeks}</td></tr>
                                            <tr><td className="p-2 font-medium text-red-500">Libur/Non-Efektif</td><td className="p-2 text-center text-red-500">{result.semester1.nonEffectiveDays} hari</td><td className="p-2 text-center text-red-500">{result.semester2.nonEffectiveDays} hari</td></tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                                    <h4 className="text-sm font-bold text-gray-700 uppercase mb-4 flex items-center gap-2"><CalendarCheck className="w-4 h-4 text-green-600"/> Distribusi Hari</h4>
                                    <div className="space-y-2">
                                        {Object.entries(result.dayDistribution).map(([day, count]) => (
                                            <div key={day} className="flex justify-between items-center text-xs">
                                                <span className="font-medium text-gray-600">{day}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${(count/30)*100}%` }}></div>
                                                    </div>
                                                    <span className="font-bold text-gray-800 w-6 text-right">{count}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="w-full md:w-2/3 space-y-4">
                                <h4 className="font-bold text-gray-800 flex items-center justify-between">
                                    <span>Visualisasi Kalender Akademik</span>
                                    <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">Gerakkan kursor pada tanggal untuk detail</span>
                                </h4>
                                <VisualCalendar scheduledDays={classSchedules[analysisModal] || []} scheduleConfig={scheduleConfig} />
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800 flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <p>Perhitungan pekan efektif menggunakan standar ISO-8601. Konfigurasi libur dapat diubah pada menu utama.</p>
                                </div>
                            </div>
                        </>
                    );
                })()}
              </div>
           </div>
        </div>
      )}

      <header className="bg-blue-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8" />
                <div>
                    <h1 className="text-xl font-bold">Perangkat Ajar AI 2025</h1>
                    <p className="text-blue-200 text-xs">Generator CP, TP, ATP & Modul Ajar</p>
                </div>
            </div>
            <div className="flex bg-blue-800/50 p-1 rounded-lg gap-2">
                <button onClick={() => setCurrentView('generator')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${currentView === 'generator' ? 'bg-white text-blue-700' : 'text-blue-100 hover:bg-blue-700/50'}`}>
                    <Zap className="w-4 h-4" /> Generator
                </button>
                <button onClick={() => setCurrentView('history')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${currentView === 'history' ? 'bg-white text-blue-700' : 'text-blue-100 hover:bg-blue-700/50'}`}>
                    <History className="w-4 h-4" /> Riwayat ({activities.length})
                </button>
            </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        {currentView === 'modul_ajar' && modulContext ? (
            <ModulAjarGenerator 
                context={modulContext} 
                onBack={() => setCurrentView('generator')}
                onSave={saveActivityLog}
            />
        ) : currentView === 'history' ? (
            <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-bold mb-4">Riwayat Aktivitas</h2>
                <div className="space-y-4">
                    {activities.map(act => (
                        <div key={act.id} className="border p-4 rounded-lg flex justify-between items-center hover:bg-gray-50">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${act.type === 'MODUL_AJAR' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{act.type}</span>
                                    <span className="text-xs text-gray-500">{act.timestamp.toLocaleString()}</span>
                                </div>
                                <h4 className="font-bold text-gray-800">{act.subject}</h4>
                                <p className="text-sm text-gray-600 truncate max-w-md">{act.details}</p>
                            </div>
                            <button onClick={() => { setData(act.dataSnapshot); setCurrentView('generator'); }} className="text-blue-600 hover:underline text-sm font-medium">Lihat/Pulihkan</button>
                        </div>
                    ))}
                    {activities.length === 0 && <p className="text-gray-500 text-center py-8">Belum ada aktivitas.</p>}
                </div>
            </div>
        ) : (
            <div className="space-y-6 animate-in fade-in">
                {/* Generator Controls */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold flex items-center gap-2"><Settings className="w-5 h-5 text-blue-600" /> Konfigurasi Awal</h2>
                        <div className="flex gap-2">
                            <button onClick={() => setShowJpReference(true)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg"><Table className="w-4 h-4" /> Tabel JP</button>
                            <button onClick={() => setShowCalendar(true)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg"><CalendarDays className="w-4 h-4" /> Kalender</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">Fase & Kelas</label>
                            <select value={selectedFase.id} onChange={(e) => setSelectedFase(FASES.find(f => f.id === e.target.value) || FASES[0])} className="w-full p-2.5 bg-gray-50 border rounded-lg">
                                {FASES.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">Mata Pelajaran</label>
                            <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="w-full p-2.5 bg-gray-50 border rounded-lg">
                                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button onClick={generateContent} disabled={loading} className="w-full p-2.5 bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50">
                                {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />} 1. Generate CP & TP
                            </button>
                        </div>
                    </div>

                    <div className="bg-blue-50/50 p-6 rounded-lg border border-blue-100 space-y-4">
                         <div className="flex items-center gap-2 text-blue-800 font-semibold text-sm mb-2"><SlidersHorizontal className="w-4 h-4" /> Konfigurasi Kalender Akademik (Libur & Ujian)</div>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(SCHEDULE_OPTIONS).map(([key, options]) => (
                                <div key={key} className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">{key.replace('_', ' ')}</label>
                                    <select value={scheduleConfig[key]} onChange={(e) => setScheduleConfig({...scheduleConfig, [key]: e.target.value})} className="w-full p-2 text-sm bg-white border border-gray-200 rounded-md">
                                        {options.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                                    </select>
                                </div>
                            ))}
                         </div>
                    </div>
                </section>

                {/* Results */}
                {data && selectedFase.classes.map((className) => {
                    const hasATP = data.elements.some(el => el.allocations.find(a => a.className === className)?.structuredAtp);
                    return (
                        <div key={className} className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                            <div className="p-4 bg-gray-50 border-b flex flex-wrap justify-between items-center gap-4">
                                <div>
                                    <h3 className="font-bold text-lg border-l-4 border-blue-600 pl-3">{className}</h3>
                                    <div className="flex items-center gap-2 mt-2 ml-4">
                                        <span className="text-xs font-medium text-gray-600">Jadwal:</span>
                                        {DAYS_OF_WEEK.map(day => (
                                            <button key={day} onClick={() => toggleScheduleDay(className, day)} className={`px-2 py-1 text-[10px] rounded border transition-all ${(classSchedules[className] || []).includes(day) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>{day}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setAnalysisModal(className)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-sm font-medium rounded-lg"><BarChart3 className="w-4 h-4" /> Analisis Kalender</button>
                                    {!hasATP && (
                                        <button onClick={() => generateATP(className)} disabled={atpLoading === className} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50">
                                            {atpLoading === className ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />} 2. Susun ATP Otomatis
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 text-gray-700 uppercase">
                                        <tr>
                                            <th className="px-4 py-3 border">Elemen & CP</th>
                                            <th className="px-4 py-3 border w-1/4">Tujuan Pembelajaran (TP)</th>
                                            <th className="px-4 py-3 border w-1/4">Alur Tujuan Pembelajaran (ATP)</th>
                                            <th className="px-4 py-3 border text-center">JP</th>
                                            <th className="px-4 py-3 border w-48 text-center">Rencana Tanggal & Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {data.elements.map((el, elIdx) => {
                                            const allocIdx = el.allocations.findIndex(a => a.className === className);
                                            const alloc = el.allocations[allocIdx];
                                            if (!alloc) return null;

                                            const groups = alloc.structuredAtp || alloc.tujuanPembelajaran.map(tp => ({ tp, atpItems: [] }));
                                            const rowSpan = groups.reduce((acc, g) => acc + Math.max(g.atpItems.length, 1), 0);

                                            return groups.map((grp, grpIdx) => {
                                                const items = grp.atpItems.length > 0 ? grp.atpItems : [{ alur: '', alokasiWaktu: '-' }];
                                                return items.map((item, itemIdx) => {
                                                    const nonEffective = item.planDate ? checkNonEffectiveDate(item.planDate) : null;
                                                    return (
                                                        <tr key={`${elIdx}-${grpIdx}-${itemIdx}`} className="hover:bg-gray-50">
                                                            {grpIdx === 0 && itemIdx === 0 && (
                                                                <td rowSpan={rowSpan} className="px-4 py-3 border align-top">
                                                                    <div className="font-bold text-gray-800 mb-1">{el.elementName}</div>
                                                                    <div className="text-xs text-gray-600">{el.capaianPembelajaran}</div>
                                                                </td>
                                                            )}
                                                            {itemIdx === 0 && (
                                                                <td rowSpan={Math.max(items.length, 1)} className="px-4 py-3 border align-top bg-blue-50/20">
                                                                    <ul className="list-disc pl-4 text-gray-700"><li>{grp.tp}</li></ul>
                                                                </td>
                                                            )}
                                                            <td className="px-4 py-3 border align-top bg-green-50/20">
                                                                {item.alur ? <div className="flex gap-2"><span className="font-bold text-green-600">{itemIdx+1}.</span>{item.alur}</div> : <span className="text-gray-400 italic">Belum digenerate</span>}
                                                            </td>
                                                            <td className="px-4 py-3 border text-center align-top">{item.alokasiWaktu}</td>
                                                            <td className="px-4 py-3 border align-top">
                                                                {item.alur ? (
                                                                    <div className="flex flex-col gap-2">
                                                                        <input 
                                                                            type="date" 
                                                                            className={`w-full text-xs p-1 border rounded ${nonEffective ? 'border-red-400 bg-red-50 text-red-700 font-bold' : ''}`}
                                                                            value={item.planDate || ''}
                                                                            onChange={(e) => handleUpdateDate(className, elIdx, allocIdx, grpIdx, itemIdx, e.target.value)}
                                                                        />
                                                                        {nonEffective && <div className="text-[10px] text-red-600 bg-red-100 p-1 rounded flex gap-1"><AlertCircle className="w-3 h-3"/> {nonEffective.description}</div>}
                                                                        {item.planDate && (
                                                                            <button 
                                                                                onClick={() => openModulGenerator(className, el, grp.tp, item)}
                                                                                className="group flex items-center justify-center gap-2 w-full py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold rounded shadow hover:shadow-lg hover:scale-105 transition-all animate-in zoom-in duration-300"
                                                                            >
                                                                                <FilePlus className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                                                                                Buat Modul Ajar
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ) : '-'}
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            });
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);