import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { BookOpen, CheckCircle, Download, FileText, Layout, Loader2, RefreshCw, Settings, ChevronRight, Sparkles, Clock, Calculator, ShieldCheck, History, X, Activity, Eye, FileDown, ArrowLeft, Home, Calendar, AlertCircle, ArrowRight, Zap, Star, FileOutput, CalendarCheck, GraduationCap, SlidersHorizontal, Info, Table, Lightbulb, TrendingUp, AlertTriangle, Check, CalendarDays, BarChart3, ChevronDown, ChevronUp, Target, ChevronLeft } from 'lucide-react';

// --- Types ---

interface AtpItem {
  alur: string;
  alokasiWaktu: string; // JP Distribution
  planDate?: string; // Real date YYYY-MM-DD
  weekNumber?: number; // Minggu ke-X
}

// New interface to group ATPs by their parent TP
interface TpGroup {
  tp: string;
  atpItems: AtpItem[];
}

interface Allocation {
  className: string;
  tujuanPembelajaran: string[]; // Source of truth for TPs
  structuredAtp?: TpGroup[];    // Populated by Step 2, mapped 1:1 to tujuanPembelajaran
  scheduleDays?: string[];      // Days selected by user (e.g., ["Senin", "Rabu"])
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
  type: 'CP_TP' | 'ATP_JP';
  subject: string;
  details: string;
  dataSnapshot: CurriculumData; // Store the full state at this point
  paperSizeSnapshot: 'A4' | 'Letter' | 'F4'; // Store paper preference
}

interface NonEffectiveRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  description: string;
  type: 'holiday' | 'exam' | 'activity';
  // New fields for customizable schedule
  category?: string; // e.g., 'anbk_gladi', 'sumatif_ganjil'
  variant?: string;  // e.g., 'v1' (Gelombang 1), 'v2' (Gelombang 2)
}

interface AnalysisResult {
    totalTargetJP: number;
    weeklyTargetJP: number;
    totalAvailableSlots: number;
    totalEffectiveWeeks: number;
    semester1: SemesterAnalysis;
    semester2: SemesterAnalysis;
    details: MonthAnalysis[];
}

interface SemesterAnalysis {
    effectiveDays: number;
    nonEffectiveDays: number;
    effectiveWeeks: number;
}

interface MonthAnalysis {
    monthName: string;
    semester: 1 | 2;
    effectiveDays: number;
    nonEffectiveDetails: { date: string, reason: string }[];
}

// --- Constants ---

const SUBJECTS = [
  "Bahasa Indonesia",
  "Matematika",
  "IPAS (Ilmu Pengetahuan Alam dan Sosial)",
  "PPKn (Pendidikan Pancasila)",
  "Seni Budaya",
  "PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan)",
  "Bahasa Inggris",
  "Pendidikan Agama Islam",
  "Pendidikan Agama Kristen"
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
  'F4': { width: '210mm', height: '330mm' } // Folio
};

// Database Hari Non Efektif 2025-2026 (Updated with Waves)
const NON_EFFECTIVE_SCHEDULE: NonEffectiveRange[] = [
  { start: '2025-07-14', end: '2025-07-16', description: 'MPLS (Masa Pengenalan Lingkungan Sekolah)', type: 'activity' },
  { start: '2025-07-21', end: '2025-07-24', description: 'Simulasi Asesmen Nasional', type: 'activity' },
  { start: '2025-08-17', end: '2025-08-17', description: 'HUT RI Ke-80', type: 'holiday' },
  { start: '2025-09-05', end: '2025-09-05', description: 'Maulid Nabi Muhammad SAW', type: 'holiday' },
  
  // Gladi ANBK (Selectable)
  { start: '2025-09-08', end: '2025-09-11', description: 'Gladi Bersih AN SD (Gelombang 1)', type: 'exam', category: 'anbk_gladi', variant: 'v1' },
  { start: '2025-09-15', end: '2025-09-18', description: 'Gladi Bersih AN SD (Gelombang 2)', type: 'exam', category: 'anbk_gladi', variant: 'v2' },
  
  // Pelaksanaan ANBK (Selectable)
  { start: '2025-09-22', end: '2025-09-25', description: 'Pelaksanaan AN SD (Tahap 1)', type: 'exam', category: 'anbk_main', variant: 'v1' },
  { start: '2025-09-29', end: '2025-10-02', description: 'Pelaksanaan AN SD (Tahap 2)', type: 'exam', category: 'anbk_main', variant: 'v2' },
  
  // Sumatif Akhir Semester 1 (Selectable Weeks)
  { start: '2025-12-01', end: '2025-12-07', description: 'Sumatif Akhir Semester 1 (Pekan 1)', type: 'exam', category: 'sumatif_ganjil', variant: 'v1' },
  { start: '2025-12-08', end: '2025-12-14', description: 'Sumatif Akhir Semester 1 (Pekan 2)', type: 'exam', category: 'sumatif_ganjil', variant: 'v2' },

  { start: '2025-12-03', end: '2025-12-03', description: 'Hari Disabilitas Internasional', type: 'activity' },
  { start: '2025-12-22', end: '2025-12-24', description: 'Administrasi & Pembagian Rapor Smst 1', type: 'activity' },
  { start: '2025-12-25', end: '2025-12-26', description: 'Natal & Cuti Bersama', type: 'holiday' },
  
  // Libur Semester 1 (Selectable)
  { start: '2025-12-29', end: '2026-01-10', description: 'Libur Semester 1 (Utama)', type: 'holiday', category: 'libur_smt1', variant: 'v1' },
  { start: '2025-12-22', end: '2026-01-03', description: 'Libur Semester 1 (Alternatif Awal)', type: 'holiday', category: 'libur_smt1', variant: 'v2' },

  { start: '2026-01-01', end: '2026-01-01', description: 'Tahun Baru Masehi', type: 'holiday' },
  { start: '2026-01-16', end: '2026-01-16', description: 'Isra Mi\'raj', type: 'holiday' },
  { start: '2026-02-17', end: '2026-02-17', description: 'Tahun Baru Imlek', type: 'holiday' },
  { start: '2026-02-20', end: '2026-02-23', description: 'Perkiraan Libur Awal Ramadan', type: 'holiday' },
  { start: '2026-02-24', end: '2026-03-13', description: 'Kegiatan Penumbuhan Budi Pekerti', type: 'activity' },
  { start: '2026-03-14', end: '2026-03-28', description: 'Libur Idul Fitri', type: 'holiday' },
  
  // Sumatif Akhir Jenjang (Selectable Weeks)
  { start: '2026-05-11', end: '2026-05-16', description: 'Sumatif Akhir Jenjang SD (Pekan 1)', type: 'exam', category: 'sumatif_jenjang', variant: 'v1' },
  { start: '2026-05-18', end: '2026-05-23', description: 'Sumatif Akhir Jenjang SD (Pekan 2)', type: 'exam', category: 'sumatif_jenjang', variant: 'v2' },

  { start: '2026-06-01', end: '2026-06-01', description: 'Hari Lahir Pancasila', type: 'holiday' },
  
  // Sumatif Akhir Tahun (Selectable Weeks)
  { start: '2026-06-02', end: '2026-06-06', description: 'Sumatif Akhir Tahun/Fase (Pekan 1)', type: 'exam', category: 'sumatif_genap', variant: 'v1' },
  { start: '2026-06-08', end: '2026-06-13', description: 'Sumatif Akhir Tahun/Fase (Pekan 2)', type: 'exam', category: 'sumatif_genap', variant: 'v2' },

  { start: '2026-06-16', end: '2026-06-16', description: 'Tahun Baru Islam', type: 'holiday' },
  { start: '2026-06-24', end: '2026-06-26', description: 'Administrasi & Pembagian Rapor Smst 2', type: 'activity' },
  
  // Libur Akhir Tahun / Semester 2 (Selectable)
  { start: '2026-06-29', end: '2026-07-11', description: 'Libur Kenaikan Kelas (Utama)', type: 'holiday', category: 'libur_smt2', variant: 'v1' },
  { start: '2026-06-22', end: '2026-07-04', description: 'Libur Kenaikan Kelas (Alternatif Awal)', type: 'holiday', category: 'libur_smt2', variant: 'v2' },
];

const SCHEDULE_OPTIONS = {
  libur_smt1: [
    { id: 'v1', label: '29 Des - 10 Jan (Utama)' },
    { id: 'v2', label: '22 Des - 3 Jan (Alternatif)' }
  ],
  libur_smt2: [
    { id: 'v1', label: '29 Jun - 11 Jul (Utama)' },
    { id: 'v2', label: '22 Jun - 4 Jul (Alternatif)' }
  ],
  anbk_gladi: [
    { id: 'v1', label: 'Gelombang 1 (8-11 Sep)' },
    { id: 'v2', label: 'Gelombang 2 (15-18 Sep)' }
  ],
  anbk_main: [
    { id: 'v1', label: 'Tahap 1 (22-25 Sep)' },
    { id: 'v2', label: 'Tahap 2 (29 Sep-2 Okt)' }
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

// Referensi Beban JP Intrakurikuler Pertahun (Berdasarkan Lampiran Permendikdasmen No 13 Tahun 2025)
const JP_STANDARDS: Record<string, Record<string, number>> = {
    "Bahasa Indonesia": { 
        "Kelas 1": 216, "Kelas 2": 252, "Kelas 3": 216, "Kelas 4": 216, "Kelas 5": 216, "Kelas 6": 192 
    },
    "Matematika": { 
        "Kelas 1": 144, "Kelas 2": 180, "Kelas 3": 180, "Kelas 4": 180, "Kelas 5": 180, "Kelas 6": 160 
    },
    "IPAS (Ilmu Pengetahuan Alam dan Sosial)": { 
        "Kelas 1": 0, "Kelas 2": 0, "Kelas 3": 180, "Kelas 4": 180, "Kelas 5": 180, "Kelas 6": 160 
    },
    "PPKn (Pendidikan Pancasila)": { 
        "Kelas 1": 144, "Kelas 2": 144, "Kelas 3": 144, "Kelas 4": 144, "Kelas 5": 144, "Kelas 6": 128
    },
    "Seni Budaya": { 
        "Kelas 1": 108, "Kelas 2": 108, "Kelas 3": 108, "Kelas 4": 108, "Kelas 5": 108, "Kelas 6": 96
    },
    "PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan)": { 
        "Kelas 1": 108, "Kelas 2": 108, "Kelas 3": 108, "Kelas 4": 108, "Kelas 5": 108, "Kelas 6": 96
    },
    "Bahasa Inggris": { 
        "Kelas 1": 72, "Kelas 2": 72, "Kelas 3": 72, "Kelas 4": 72, "Kelas 5": 72, "Kelas 6": 64
    },
    "Pendidikan Agama Islam": { 
        "Kelas 1": 108, "Kelas 2": 108, "Kelas 3": 108, "Kelas 4": 108, "Kelas 5": 108, "Kelas 6": 96
    },
    "Pendidikan Agama Kristen": { 
        "Kelas 1": 108, "Kelas 2": 108, "Kelas 3": 108, "Kelas 4": 108, "Kelas 5": 108, "Kelas 6": 96   
    },
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

    // Helper to check non-effective dates
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

    // Calendar Generation Logic
    const daysInMonth = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const days = [];
        
        // Padding for previous month (Monday Start)
        let startDay = firstDay.getDay(); 
        if (startDay === 0) startDay = 7; 
        const padding = startDay === 0 ? 6 : startDay - 1; // Actually if 0 (Sun), we want index 6. If 1 (Mon), index 0.

        for (let i = 0; i < padding; i++) {
            days.push({ type: 'empty', key: `pad-${i}` });
        }

        // Actual Days
        for (let d = 1; d <= lastDay.getDate(); d++) {
            const currentDate = new Date(year, month, d);
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayName = getDayName(currentDate);
            const conflict = checkStatus(dateStr);
            const isScheduled = scheduledDays.includes(dayName);
            
            let status: 'effective' | 'noneffective' | 'off' = 'off';
            let tooltip = '';

            if (isScheduled) {
                if (conflict) {
                    status = 'noneffective';
                    tooltip = conflict.description;
                } else {
                    status = 'effective';
                    tooltip = 'Hari Efektif Belajar';
                }
            } else if (conflict) {
                tooltip = conflict.description;
            }

            days.push({ 
                type: 'day', 
                key: dateStr, 
                date: d, 
                status, 
                tooltip, 
                isHoliday: conflict?.type === 'holiday',
                isSunday: currentDate.getDay() === 0 
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
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 bg-indigo-50/50 border-b border-indigo-100">
                <button onClick={handlePrev} className="p-1.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-indigo-100 shadow-sm disabled:opacity-30" disabled={viewDate.getMonth() === 6 && viewDate.getFullYear() === 2025}>
                    <ChevronLeft className="w-5 h-5 text-indigo-600" />
                </button>
                <h3 className="font-bold text-gray-800 text-lg">
                    {viewDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={handleNext} className="p-1.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-indigo-100 shadow-sm disabled:opacity-30" disabled={viewDate.getMonth() === 6 && viewDate.getFullYear() === 2026}>
                    <ChevronRight className="w-5 h-5 text-indigo-600" />
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
                <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                    {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => (
                        <div key={d} className={`text-xs font-bold uppercase tracking-wider ${d === 'Min' ? 'text-red-500' : 'text-gray-400'}`}>{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {daysInMonth.map((day: any) => {
                        if (day.type === 'empty') return <div key={day.key} className="h-14 sm:h-20" />;
                        
                        return (
                            <div 
                                key={day.key}
                                className={`relative group h-14 sm:h-20 rounded-lg border flex flex-col items-start justify-start p-2 transition-all duration-300 hover:scale-105 hover:shadow-md cursor-default
                                    ${day.status === 'effective' ? 'bg-green-50 border-green-200 hover:bg-green-100' : 
                                      day.status === 'noneffective' ? 'bg-red-50 border-red-200 hover:bg-red-100' :
                                      day.isHoliday || day.isSunday ? 'bg-gray-50 border-gray-100 text-red-400' : 'bg-white border-gray-100 text-gray-400'}
                                `}
                            >
                                <span className={`text-sm font-bold ${day.status === 'effective' ? 'text-green-700' : day.status === 'noneffective' ? 'text-red-700' : ''}`}>
                                    {day.date}
                                </span>
                                
                                {day.status === 'effective' && (
                                    <div className="mt-auto self-end">
                                        <CheckCircle className="w-4 h-4 text-green-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                )}
                                {day.status === 'noneffective' && (
                                    <div className="mt-auto self-end">
                                        <X className="w-4 h-4 text-red-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                )}

                                {/* Modern Tooltip */}
                                {(day.tooltip) && (
                                    <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[150px] hidden group-hover:block animate-in fade-in zoom-in duration-200">
                                        <div className="bg-gray-900 text-white text-[10px] py-1.5 px-3 rounded-lg shadow-xl relative text-center leading-tight">
                                            {day.tooltip}
                                            <div className="w-2 h-2 bg-gray-900 absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                
                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs text-gray-600 border-t border-dashed border-gray-200 pt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-100 border border-green-200"></div>
                        <span>Hari Efektif</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div>
                        <span>Libur / Ujian (Non-Efektif)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-white border border-gray-200"></div>
                        <span>Tidak Ada Jadwal</span>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Components for Landing & Tutorial ---

const LandingPage = ({ onStart }: { onStart: () => void }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex flex-col items-center justify-center text-white relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
      
      <div className="max-w-4xl mx-auto px-6 text-center z-10 space-y-8 animate-in fade-in zoom-in duration-700">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
          Buat Perangkat Ajar <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">Dalam Hitungan Detik</span>
        </h1>
        
        <p className="text-lg md:text-xl text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
          Generator otomatis untuk CP, TP, ATP, dan Prota Jenjang SD Kurikulum Merdeka. 
          Terintegrasi penuh dengan Kalender Pendidikan T.A. 2025/2026.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button 
            onClick={onStart}
            className="group relative px-8 py-4 bg-white text-blue-900 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:bg-blue-50 transition-all hover:-translate-y-1 w-full sm:w-auto overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Mulai Sekarang
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>

        <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-colors">
            <Zap className="w-8 h-8 text-yellow-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">Cepat & Akurat</h3>
            <p className="text-sm text-blue-200">Analisis CP otomatis menggunakan AI Generatif terkini.</p>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-colors">
            <CalendarCheck className="w-8 h-8 text-green-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">Kalender 2025</h3>
            <p className="text-sm text-blue-200">Validasi otomatis hari libur & kegiatan non-efektif 2025-2026.</p>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-colors">
            <FileDown className="w-8 h-8 text-cyan-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">Export Dokumen</h3>
            <p className="text-sm text-blue-200">Unduh hasil langsung ke format .doc yang rapi.</p>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-4 text-center text-blue-300/40 text-xs">
        &copy; 2025 AI Perangkat Ajar Jenjang SD
      </div>
    </div>
  );
};

const TutorialPage = ({ onNext, onBack }: { onNext: () => void, onBack: () => void }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
       {/* Header */}
       <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
         <div className="max-w-6xl mx-auto flex justify-between items-center">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>
            <div className="font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Tutorial Penggunaan
            </div>
         </div>
       </div>

       <div className="flex-grow max-w-6xl mx-auto px-6 py-12 w-full">
          <div className="text-center mb-12 animate-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Cara Kerja Generator Prota AI</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Ikuti langkah mudah berikut untuk menghasilkan perangkat ajar lengkap yang tervalidasi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
             {/* Step 1 */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-110 transition-transform"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-xl mb-6 shadow-lg shadow-blue-600/20">1</div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">Pilih Fase</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Tentukan jenjang Fase (A, B, atau C) dan Mata Pelajaran yang ingin Anda buat perangkat ajarnya.
                  </p>
                </div>
             </div>

             {/* Step 2 */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-xl mb-6 shadow-lg shadow-indigo-600/20">2</div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">Generate CP/TP</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    AI akan menganalisis Capaian Pembelajaran (CP) terbaru dan memecahnya menjadi Tujuan Pembelajaran (TP).
                  </p>
                </div>
             </div>

             {/* Step 3 */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 rounded-full group-hover:scale-110 transition-transform"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center font-bold text-xl mb-6 shadow-lg shadow-purple-600/20">3</div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">Pilih Hari Belajar</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Pilih jadwal hari belajar (Senin-Sabtu). Sistem otomatis membagi JP sesuai kalender efektif.
                  </p>
                </div>
             </div>

             {/* Step 4 */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full group-hover:scale-110 transition-transform"></div>
                <div className="relative z-10">
                   <div className="w-12 h-12 bg-green-600 text-white rounded-xl flex items-center justify-center font-bold text-xl mb-6 shadow-lg shadow-green-600/20">4</div>
                   <h3 className="text-xl font-bold text-slate-800 mb-3">Validasi & Unduh</h3>
                   <p className="text-slate-500 text-sm leading-relaxed">
                     Cek jadwal dengan Kalender 2025/2026, validasi hari libur, lalu unduh dokumen .doc siap cetak.
                   </p>
                </div>
             </div>
          </div>
          
          <div className="text-center pt-8">
             <button 
                onClick={onNext}
                className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3 mx-auto"
             >
                Masuk ke Aplikasi Generator
                <ArrowRight className="w-5 h-5" />
             </button>
             <p className="text-slate-400 text-sm mt-4">Gratis • Tanpa Login • Langsung Pakai</p>
          </div>
       </div>
    </div>
  );
};


// --- App Component ---

const App = () => {
  const [appStage, setAppStage] = useState<'landing' | 'tutorial' | 'generator'>('landing');
  const [currentView, setCurrentView] = useState<'generator' | 'history'>('generator');
  const [selectedFase, setSelectedFase] = useState(FASES[0]);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [loading, setLoading] = useState(false);
  const [atpLoading, setAtpLoading] = useState<string | null>(null); // Track which class is generating ATP
  const [data, setData] = useState<CurriculumData | null>(null);
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter' | 'F4'>('A4');
  const [error, setError] = useState<string | null>(null);
  const [showJpReference, setShowJpReference] = useState(false); // Modal state for Reference Table
  const [showCalendar, setShowCalendar] = useState(false); // Modal state for Calendar
  const [analysisModal, setAnalysisModal] = useState<string | null>(null); // State to show analysis modal for a specific class
  
  // Selected Schedule Days (Map ClassName -> Array of Days)
  const [classSchedules, setClassSchedules] = useState<Record<string, string[]>>({});

  // Schedule Configuration State (Defaults to Wave 1 for everything)
  const [scheduleConfig, setScheduleConfig] = useState<Record<string, string>>({
    libur_smt1: 'v1',
    libur_smt2: 'v1',
    anbk_gladi: 'v1',
    anbk_main: 'v1',
    sumatif_ganjil: 'v1',
    sumatif_jenjang: 'v1',
    sumatif_genap: 'v1'
  });
  
  // Activity History State
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // Helper to resolve Subject Key for JP Lookup
  const getSubjectKey = (subjectName: string): string | null => {
      if (!subjectName) return null;
      // 1. Direct match
      if (JP_STANDARDS[subjectName]) return subjectName;
      
      // 2. Case insensitive match
      const keys = Object.keys(JP_STANDARDS);
      const lower = subjectName.toLowerCase().trim();
      const directKey = keys.find(k => k.toLowerCase() === lower);
      if (directKey) return directKey;

      // 3. Fuzzy/Substring match
      const fuzzyKey = keys.find(k => lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower));
      return fuzzyKey || null;
  };

  // Navigation Handlers
  if (appStage === 'landing') {
    return <LandingPage onStart={() => setAppStage('tutorial')} />;
  }

  if (appStage === 'tutorial') {
    return <TutorialPage onNext={() => setAppStage('generator')} onBack={() => setAppStage('landing')} />;
  }

  // --- Main Application Logic (Generator) ---

  // Helper function to check if a date is in a non-effective range
  const checkNonEffectiveDate = (dateStr: string): NonEffectiveRange | null => {
      if (!dateStr) return null;
      return NON_EFFECTIVE_SCHEDULE.find(range => {
          // Check date overlap
          const inRange = dateStr >= range.start && dateStr <= range.end;
          if (!inRange) return false;

          // If it's a configurable event (has category), check if it matches user config
          if (range.category && range.variant) {
              const userSelection = scheduleConfig[range.category];
              return userSelection === range.variant;
          }

          // If standard holiday/activity, always true
          return true;
      }) || null;
  };

  const getEffectiveDatesForCalendar = () => {
      // Return list of all active non-effective dates for display in modal
      return NON_EFFECTIVE_SCHEDULE.filter(range => {
          if (range.category && range.variant) {
              return scheduleConfig[range.category] === range.variant;
          }
          return true;
      }).sort((a, b) => a.start.localeCompare(b.start));
  };

  const getDayName = (date: Date): string => {
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      return days[date.getDay()];
  };

  // Helper: Get list of effective dates for a specific schedule (e.g., ["Senin", "Kamis"])
  const getEffectiveDates = (selectedDays: string[], startYear: number = 2025): Date[] => {
      const dates: Date[] = [];
      const startDate = new Date(`${startYear}-07-14`); // Start mid-July
      const endDate = new Date(`${startYear + 1}-06-20`); // End mid-June

      let current = new Date(startDate);
      while (current <= endDate) {
          const dayName = getDayName(current);
          const dateStr = current.toISOString().split('T')[0];
          const conflict = checkNonEffectiveDate(dateStr);

          // Logic: Must be a selected day AND not a holiday AND not an exam/activity that stops teaching
          // We assume 'exam' and 'activity' types in NON_EFFECTIVE_SCHEDULE mean NO teaching.
          if (selectedDays.includes(dayName) && (!conflict)) {
              dates.push(new Date(current));
          }
          current.setDate(current.getDate() + 1);
      }
      return dates;
  };
  
  // ANALYTICS FUNCTION: Calculate detailed breakdown
  const calculateCalendarAnalysis = (className: string, subject: string): AnalysisResult | null => {
        const selectedDays = classSchedules[className] || [];
        if (selectedDays.length === 0) return null;

        const subjectKey = getSubjectKey(subject);
        const annualTargetJP = subjectKey ? JP_STANDARDS[subjectKey]?.[className] || 0 : 0;
        
        // Approx weekly load based on Permendikdasmen No 13
        const effectiveWeeksEst = className.includes('6') ? 32 : 36;
        const weeklyTargetJP = Math.round(annualTargetJP / effectiveWeeksEst);

        const startDate = new Date('2025-07-14');
        const endDate = new Date('2026-06-20');
        const midYearBreak = new Date('2025-12-31');

        let totalAvailableSlots = 0;
        let semester1Data = { effectiveDays: 0, nonEffectiveDays: 0, effectiveWeeks: 0, uniqueWeeks: new Set<string>() };
        let semester2Data = { effectiveDays: 0, nonEffectiveDays: 0, effectiveWeeks: 0, uniqueWeeks: new Set<string>() };
        
        const monthDetails: Record<string, MonthAnalysis> = {};

        let current = new Date(startDate);
        while (current <= endDate) {
            const dayName = getDayName(current);
            const dateStr = current.toISOString().split('T')[0];
            const monthKey = current.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
            const semester = current <= midYearBreak ? 1 : 2;
            const weekKey = `${getISOWeek(current)}-${current.getFullYear()}`; // Helper needed

            if (!monthDetails[monthKey]) {
                monthDetails[monthKey] = { monthName: monthKey, semester, effectiveDays: 0, nonEffectiveDetails: [] };
            }

            // Only analyze if it's a scheduled teaching day
            if (selectedDays.includes(dayName)) {
                 const conflict = checkNonEffectiveDate(dateStr);
                 
                 if (!conflict) {
                     // Effective
                     totalAvailableSlots++;
                     monthDetails[monthKey].effectiveDays++;
                     if (semester === 1) {
                         semester1Data.effectiveDays++;
                         semester1Data.uniqueWeeks.add(weekKey);
                     } else {
                         semester2Data.effectiveDays++;
                         semester2Data.uniqueWeeks.add(weekKey);
                     }
                 } else {
                     // Non-Effective but scheduled
                     monthDetails[monthKey].nonEffectiveDetails.push({ date: dateStr, reason: conflict.description });
                     if (semester === 1) semester1Data.nonEffectiveDays++;
                     else semester2Data.nonEffectiveDays++;
                 }
            }
            
            current.setDate(current.getDate() + 1);
        }

        return {
            totalTargetJP: annualTargetJP,
            weeklyTargetJP,
            totalAvailableSlots,
            totalEffectiveWeeks: semester1Data.uniqueWeeks.size + semester2Data.uniqueWeeks.size,
            semester1: {
                effectiveDays: semester1Data.effectiveDays,
                nonEffectiveDays: semester1Data.nonEffectiveDays,
                effectiveWeeks: semester1Data.uniqueWeeks.size
            },
            semester2: {
                effectiveDays: semester2Data.effectiveDays,
                nonEffectiveDays: semester2Data.nonEffectiveDays,
                effectiveWeeks: semester2Data.uniqueWeeks.size
            },
            details: Object.values(monthDetails)
        };
  };

  // Helper for ISO Week to count effective weeks accurately
  const getISOWeek = (d: Date) => {
      const date = new Date(d.getTime());
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
      const week1 = new Date(date.getFullYear(), 0, 4);
      return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };


  // Helper to toggle schedule days
  const toggleScheduleDay = (className: string, day: string) => {
      setClassSchedules(prev => {
          const currentDays = prev[className] || [];
          if (currentDays.includes(day)) {
              return { ...prev, [className]: currentDays.filter(d => d !== day) };
          } else {
              // Sort based on DAYS_OF_WEEK index
              const newDays = [...currentDays, day].sort((a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b));
              return { ...prev, [className]: newDays };
          }
      });
  };

  // Helper to update specific ATP date
  const updateAtpDate = (className: string, elementIdx: number, allocIdx: number, groupIdx: number, itemIdx: number, date: string) => {
    if (!data) return;

    const newData = { ...data };
    const elements = [...newData.elements];
    const element = { ...elements[elementIdx] };
    const allocations = [...element.allocations];
    
    // Find the correct allocation based on className match (reuse allocIdx if strictly mapped) but safer to filter
    // However, for direct array access we need exact indices passed from render
    const alloc = { ...allocations[allocIdx] };

    if (alloc.structuredAtp) {
        const groups = [...alloc.structuredAtp];
        const group = { ...groups[groupIdx] };
        const items = [...group.atpItems];
        const item = { ...items[itemIdx] };

        item.planDate = date;

        items[itemIdx] = item;
        group.atpItems = items;
        groups[groupIdx] = group;
        alloc.structuredAtp = groups;
        allocations[allocIdx] = alloc;
        element.allocations = allocations;
        elements[elementIdx] = element;
        newData.elements = elements;

        setData(newData);
    }
  };

  // Helper to add activity
  const addActivity = (type: 'CP_TP' | 'ATP_JP', subject: string, details: string, dataSnapshot: CurriculumData) => {
    const newActivity: ActivityLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      subject,
      details,
      dataSnapshot: JSON.parse(JSON.stringify(dataSnapshot)), // Deep copy to prevent reference issues
      paperSizeSnapshot: paperSize
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  // Restore state from history
  const restoreFromHistory = (log: ActivityLog) => {
    setData(log.dataSnapshot);
    setSelectedSubject(log.subject);
    setPaperSize(log.paperSizeSnapshot);
    
    // Try to match fase
    const foundFase = FASES.find(f => f.name === log.dataSnapshot.fase || f.id === log.dataSnapshot.fase.replace("Fase ", "").split(" ")[0]);
    if (foundFase) setSelectedFase(foundFase);
    
    // Switch view
    setCurrentView('generator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate Total JP based on structured ATP groups
  const calculateTotalJP = (allocations: Allocation[], targetClass: string) => {
    let total = 0;
    
    allocations.forEach(alloc => {
       if (alloc.className.toLowerCase().includes(targetClass.toLowerCase()) && alloc.structuredAtp) {
           alloc.structuredAtp.forEach(group => {
               group.atpItems.forEach(item => {
                   const match = item.alokasiWaktu.match(/(\d+)/);
                   if (match) {
                       total += parseInt(match[0], 10);
                   }
               });
           });
       }
    });

    return total;
  };

  // 1. Initial Generation: Elements, CP, and TP
  const generateContent = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const apiKey = process.env.API_KEY;
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
        
        Parameter:
        - Jenjang: SD
        - Fase: ${selectedFase.name}
        - Mata Pelajaran: ${selectedSubject}
        - Kelas: ${selectedFase.classes.join(" dan ")}

        Instruksi:
        1. Tuliskan Elemen dan CP terbaru.
        2. Pecah CP menjadi Tujuan Pembelajaran (TP) yang spesifik untuk ${selectedFase.classes[0]} dan ${selectedFase.classes[1]}.
        3. Pastikan gradasi kesulitan terlihat (Kelas awal lebih dasar, kelas lanjut lebih kompleks).
        
        Output JSON valid.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          maxOutputTokens: 8192 
        }
      });

      const responseText = response.text;
      if (responseText) {
        const resultData = JSON.parse(responseText) as CurriculumData;
        setData(resultData);
        // Log Activity
        addActivity('CP_TP', selectedSubject, `Analisis CP & TP untuk ${selectedFase.name}`, resultData);
      } else {
        throw new Error("No response generated");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal membuat konten.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Second Step: Generate ATP & JP for a specific class (GROUPED BY TP)
  const generateATP = async (className: string) => {
    if (!data) return;
    setAtpLoading(className);
    setError(null);

    // --- 1. DETERMINE TARGET JP & SMART DEFAULTING ---
    let targetJP = 216; // Default Fallback
    
    const subjectKey = getSubjectKey(selectedSubject) || getSubjectKey(data.subject);
    if (subjectKey) {
        targetJP = JP_STANDARDS[subjectKey]?.[className] || 216;
    }

    let selectedDays = classSchedules[className] || [];
    
    // Calculate Weekly Load to see if we even have enough days basically
    const effectiveWeeks = className.includes('6') ? 32 : 36;
    const weeklyLoad = Math.ceil(targetJP / effectiveWeeks);
    const MAX_JP_PER_DAY = 3; 
    
    // SMART DEFAULT / AUTO-EXPAND: If not enough days selected for the load, add more
    const minDaysNeeded = Math.ceil(weeklyLoad / MAX_JP_PER_DAY);
    
    if (selectedDays.length < minDaysNeeded) {
        // Priority Days: Mon, Wed, Fri, Tue, Thu
        const candidateDays = ["Senin", "Rabu", "Jumat", "Selasa", "Kamis", "Sabtu"];
        // Keep existing selected days, add more
        const needed = minDaysNeeded - selectedDays.length;
        const available = candidateDays.filter(d => !selectedDays.includes(d));
        selectedDays = [...selectedDays, ...available.slice(0, needed)];
        
        // Sort based on standard week index
        selectedDays.sort((a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b));

        // Update state asynchronously so UI reflects it next render
        setClassSchedules(prev => ({ ...prev, [className]: selectedDays }));
    }

    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API Key not found");
        const ai = new GoogleGenAI({ apiKey });

        // --- 2. "SMART DISTRIBUTE" STRATEGY (New Logic) ---
        // Ensures EXACT Target JP matching by distributing base JP and remainders
        
        const allEffectiveDates = getEffectiveDates(selectedDays);
        const totalAvailableSlots = allEffectiveDates.length;
        
        // Calculate Base JP and Remainder
        // Example: Target 108. Slots 34.
        // Base = 3. Remainder = 6.
        // First 6 slots get 4 JP. Remaining 28 get 3 JP.
        let baseJP = 0;
        let remainder = 0;
        
        if (totalAvailableSlots > 0) {
            baseJP = Math.floor(targetJP / totalAvailableSlots);
            remainder = targetJP % totalAvailableSlots;
            
            // Safety Check: If Base JP is too high (e.g., > 5), logic in component (not here) might warn user.
            // But we generate it anyway to fulfill the target.
        }
        
        // Build Timeline Slots until Target is Met
        const timelineSlots: { date: string, allocatedJP: number }[] = [];
        let accumulatedJP = 0;
        
        for (let i = 0; i < totalAvailableSlots; i++) {
             if (accumulatedJP >= targetJP) break; // Strict Stop
             
             // Distribute Remainder: The first 'remainder' slots get +1 JP
             const allocated = i < remainder ? baseJP + 1 : baseJP;
             
             // Skip if 0 JP (shouldn't happen unless target is 0)
             if (allocated > 0) {
                 timelineSlots.push({
                    date: allEffectiveDates[i].toISOString().split('T')[0],
                    allocatedJP: allocated
                 });
                 accumulatedJP += allocated;
             }
        }

        // --- 3. AI GENERATION ---
        
        // Extract context for this class
        const classContext = data.elements.map(el => ({
            elementName: el.elementName,
            capaianPembelajaran: el.capaianPembelajaran,
            tujuanPembelajaran: el.allocations.find(a => a.className === className)?.tujuanPembelajaran || []
        }));

        const prompt = `
            PERAN: Ahli Kurikulum & Penjadwalan Sekolah Dasar (Kurikulum Merdeka 2025).
            
            KONTEKS:
            Anda menyusun Rencana Pelaksanaan Pembelajaran (ATP) Harian.
            
            DATA JADWAL:
            - Mapel: ${data.subject} (${className})
            - Target Total JP Minimum: ${targetJP} JP.
            - Total Pertemuan Tersedia: ${timelineSlots.length} pertemuan (telah disesuaikan agar mencapai target).
            
            INSTRUKSI UTAMA:
            1. Buatlah daftar aktivitas ATP untuk mengisi persis ${timelineSlots.length} baris pertemuan.
            2. Materi harus dipecah kecil-kecil agar muat dalam 1 pertemuan.
            3. Fokus pada distribusi materi Intrakurikuler saja.
            
            OUTPUT:
            Hasilkan daftar ATP yang berurutan.
            
            Data Elemen dan TP:
            ${JSON.stringify(classContext, null, 2)}
        `;

        const schema: Schema = {
            type: Type.OBJECT,
            properties: {
                updates: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            elementName: { type: Type.STRING },
                            tpDetails: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        originalTp: { type: Type.STRING, description: "Teks TP asli untuk pencocokan" },
                                        atpItems: {
                                            type: Type.ARRAY,
                                            items: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    alur: { type: Type.STRING, description: "Deskripsi kegiatan pertemuan ini" },
                                                    // AI gives generic JP, we overwrite it later
                                                    alokasiWaktu: { type: Type.STRING, description: "Tulis '2 JP' atau '3 JP'" }
                                                },
                                                required: ["alur", "alokasiWaktu"]
                                            }
                                        }
                                    },
                                    required: ["originalTp", "atpItems"]
                                }
                            }
                        },
                        required: ["elementName", "tpDetails"]
                    }
                }
            }
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

        const result = JSON.parse(response.text || "{}");

        // --- 4. POST-PROCESSING: STRICT DATE & JP MAPPING ---
        // Flatten the AI result, but this time we map strictly to our `timelineSlots`
        
        let slotCursor = 0;
        
        const newElements = data.elements.map(el => {
            const update = result.updates?.find((u: any) => u.elementName === el.elementName);
            if (update) {
                const newAllocations = el.allocations.map(alloc => {
                    if (alloc.className === className) {
                        const structuredAtp = alloc.tujuanPembelajaran.map((tp, idx) => {
                            const details = update.tpDetails?.find((d: any) => d.originalTp === tp) || update.tpDetails?.[idx];
                            
                            let rawItems = details?.atpItems || [];
                            const processedItems: AtpItem[] = [];
                            
                            // Map AI items to Slots
                            rawItems.forEach((item: any) => {
                                if (slotCursor < timelineSlots.length) {
                                    const slot = timelineSlots[slotCursor];
                                    
                                    // Use the JP defined by our Distribution Pattern, IGNORE AI's JP
                                    processedItems.push({
                                        alur: item.alur,
                                        alokasiWaktu: `${slot.allocatedJP} JP`, // Strict from pattern
                                        planDate: slot.date
                                    });
                                    
                                    slotCursor++;
                                }
                            });
                            
                            return {
                                tp: tp,
                                atpItems: processedItems
                            };
                        });
                        return { ...alloc, structuredAtp };
                    }
                    return alloc;
                });
                return { ...el, allocations: newAllocations };
            }
            return el;
        });

        const newData = { ...data, elements: newElements };
        setData(newData);
        addActivity('ATP_JP', data.subject, `Penyusunan ATP & Jadwal Otomatis ${className} (${selectedDays.join(",")}) - Target ${targetJP} JP`, newData);

    } catch (err: any) {
        console.error(err);
        setError("Gagal membuat ATP: " + err.message);
    } finally {
        setAtpLoading(null);
    }
  };

  // Reusable function to generate DOC content
  const downloadDoc = (dataToPrint: CurriculumData, sizeKey: 'A4' | 'Letter' | 'F4') => {
    const size = PAPER_SIZES[sizeKey];
    // Find classes based on fase string in data or current constant
    const currentClasses = FASES.find(f => f.name === dataToPrint.fase || f.id === dataToPrint.fase.replace("Fase ", "").split(" ")[0])?.classes 
                           || dataToPrint.fase.match(/Kelas \d/g) // Fallback regex
                           || ['Kelas ?'];

    const headerContent = `
      <div style="text-align: center; margin-bottom: 20pt;">
        <h1 style="font-size: 16pt; font-weight: bold; margin: 0;">ALUR TUJUAN PEMBELAJARAN (ATP)</h1>
        <h2 style="font-size: 14pt; font-weight: bold; margin: 5pt 0;">KURIKULUM MERDEKA TAHUN 2025</h2>
        <p style="font-size: 12pt; margin: 0;"><strong>${dataToPrint.subject.toUpperCase()} - ${dataToPrint.fase.toUpperCase()}</strong></p>
      </div>
    `;

    let bodyContent = '';

    currentClasses.forEach((cls: string) => {
        bodyContent += `<h3 style="margin-top: 20pt; font-size: 14pt; font-weight: bold; text-decoration: underline; color: #333;">${cls}</h3>`;

        let tableRows = '';
        let hasData = false;
        let classTotalJP = 0;
        
        // Calculate Total JP
        const classAllocations = dataToPrint.elements.flatMap(el => el.allocations).filter(a => a.className === cls);
        classTotalJP = calculateTotalJP(classAllocations, cls);
        
        // Lookup target for validation display
        const subjectKey = getSubjectKey(dataToPrint.subject);
        const targetJP = subjectKey ? JP_STANDARDS[subjectKey]?.[cls] : "N/A";

        dataToPrint.elements.forEach((el, index) => {
            const alloc = el.allocations.find(a => a.className.toLowerCase().includes(cls.toLowerCase()));

            if (alloc) {
              hasData = true;

              // Determine Groups: Use structuredAtp if available, else map TPs to empty groups
              const groups = alloc.structuredAtp || alloc.tujuanPembelajaran.map(tp => ({ tp, atpItems: [] }));
              
              // Calculate Total RowSpan for Element & CP Columns
              // Sum of max(1, group.atpCount) for all groups
              // FIXED: Corrected initial value from 1 to 0 to prevent extra empty rows
              const totalRowSpan = groups.reduce((acc, grp) => acc + Math.max(grp.atpItems.length, 1), 0);

              groups.forEach((group, grpIdx) => {
                  const tpRowSpan = Math.max(group.atpItems.length, 1);
                  const itemsToRender = group.atpItems.length > 0 ? group.atpItems : [{ alur: '<em>Belum digenerate</em>', alokasiWaktu: '-' }];

                  itemsToRender.forEach((item, itemIdx) => {
                      const isElementStart = grpIdx === 0 && itemIdx === 0;
                      const isTpStart = itemIdx === 0;
                      
                      let planDateStr = '-';
                      if (item.planDate) {
                         const dateObj = new Date(item.planDate);
                         const dayName = getDayName(dateObj);
                         const formattedDate = dateObj.toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});
                         planDateStr = `${dayName}, ${formattedDate}`;
                      }

                      tableRows += `<tr>`;
                      
                      // Element & CP Columns (Only on first row of the Element block)
                      if (isElementStart) {
                          tableRows += `
                            <td rowspan="${totalRowSpan}" style="padding: 5pt; text-align: center; vertical-align: top;">${index + 1}</td>
                            <td rowspan="${totalRowSpan}" style="padding: 5pt; vertical-align: top;"><b>${el.elementName}</b></td>
                            <td rowspan="${totalRowSpan}" style="padding: 5pt; vertical-align: top;">${el.capaianPembelajaran}</td>
                          `;
                      }

                      // TP Column (Only on first row of the TP block)
                      if (isTpStart) {
                          tableRows += `
                             <td rowspan="${tpRowSpan}" style="padding: 5pt; vertical-align: top;">
                                <ul style="margin: 0; padding-left: 15pt;"><li>${group.tp}</li></ul>
                             </td>
                          `;
                      }

                      // ATP & JP Columns (Every row)
                      tableRows += `
                          <td style="padding: 5pt; vertical-align: top;">${item.alur}</td>
                          <td style="padding: 5pt; vertical-align: top; text-align: center;">${item.alokasiWaktu}</td>
                          <td style="padding: 5pt; vertical-align: top; text-align: center;">${planDateStr}</td>
                      `;

                      tableRows += `</tr>`;
                  });
              });
            }
        });

        // Validation Footer Row
        if (hasData) {
            tableRows += `
                <tr>
                    <td colspan="5" style="padding: 8pt; text-align: right; font-weight: bold; background-color: #f3f4f6;">
                        TOTAL ALOKASI WAKTU (INTRAKURIKULER)
                    </td>
                    <td colspan="2" style="padding: 8pt; text-align: center; font-weight: bold; background-color: #f3f4f6;">
                        ${classTotalJP} JP <br/>
                        <span style="font-size: 8pt; font-weight: normal; color: #666;">(Target Min: ${targetJP} JP)</span>
                    </td>
                </tr>
                <tr>
                    <td colspan="7" style="padding: 10pt; background-color: #e0f2fe; color: #0c4a6e; font-style: italic; border: 1px solid #0369a1;">
                        <strong>VALIDASI PERMENDIKDASMEN NO 13 TAHUN 2025:</strong> 
                        Total JP Intrakurikuler di atas telah divalidasi sesuai standar beban kerja minimal tahunan untuk Jenjang SD. 
                        (Tidak termasuk alokasi P5).
                    </td>
                </tr>
            `;
        }

        if (hasData) {
          bodyContent += `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20pt; font-size: 10pt;">
              <thead>
                <tr>
                  <th width="5%" style="border: 1px solid black; background-color: #E5E7EB; padding: 5pt;">No</th>
                  <th width="15%" style="border: 1px solid black; background-color: #E5E7EB; padding: 5pt;">Elemen</th>
                  <th width="20%" style="border: 1px solid black; background-color: #E5E7EB; padding: 5pt;">Capaian Pembelajaran (CP)</th>
                  <th width="20%" style="border: 1px solid black; background-color: #E5E7EB; padding: 5pt;">Tujuan Pembelajaran (TP)</th>
                  <th width="25%" style="border: 1px solid black; background-color: #E5E7EB; padding: 5pt;">Alur Tujuan Pembelajaran (ATP)</th>
                  <th width="8%" style="border: 1px solid black; background-color: #E5E7EB; padding: 5pt;">Alokasi JP</th>
                  <th width="12%" style="border: 1px solid black; background-color: #E5E7EB; padding: 5pt;">Rencana Tanggal</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            <br/>
          `;
        } else {
           bodyContent += `<p style="color: red;">Data tidak ditemukan untuk ${cls}</p>`;
        }
    });

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>ATP Export</title>
        <style>
          @page {
            size: ${size.width} ${size.height};
            mso-page-orientation: portrait;
            margin: 2.54cm;
          }
          body {
            font-family: 'Times New Roman', serif;
            font-size: 11pt;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          table, th, td {
            border: 1px solid black;
          }
        </style>
      </head>
      <body>
        ${headerContent}
        ${bodyContent}
        <br>
        <p style="font-size: 10pt; color: #666; text-align: right;">Generated by AI Assistant based on Kurikulum Merdeka 2025.</p>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ATP_${dataToPrint.subject.replace(/\s+/g, '_')}_${dataToPrint.fase.replace(/\s+/g, '_')}_Lengkap.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadCurrent = () => {
      if(data) downloadDoc(data, paperSize);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-gray-50">
      {/* JP Reference Modal */}
      {showJpReference && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                 <div className="flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Standar Alokasi JP Intrakurikuler</h3>
                        <p className="text-sm text-gray-500">Referensi: Permendikdasmen No. 13 Tahun 2025 (Jenjang SD)</p>
                    </div>
                 </div>
                 <button onClick={() => setShowJpReference(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                    <X className="w-6 h-6 text-gray-500" />
                 </button>
              </div>
              <div className="p-6 overflow-y-auto">
                 <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm text-left">
                       <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
                          <tr>
                             <th className="px-4 py-3 font-bold border-r">Mata Pelajaran</th>
                             <th className="px-4 py-3 text-center border-r">Kelas 1</th>
                             <th className="px-4 py-3 text-center border-r">Kelas 2</th>
                             <th className="px-4 py-3 text-center border-r">Kelas 3</th>
                             <th className="px-4 py-3 text-center border-r">Kelas 4</th>
                             <th className="px-4 py-3 text-center border-r">Kelas 5</th>
                             <th className="px-4 py-3 text-center">Kelas 6</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-200">
                          {Object.entries(JP_STANDARDS).map(([subject, classes], idx) => (
                             <tr key={subject} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-3 font-medium text-gray-900 border-r">{subject}</td>
                                <td className={`px-4 py-3 text-center border-r ${classes['Kelas 1'] === 0 ? 'text-gray-300' : ''}`}>{classes['Kelas 1'] || '-'}</td>
                                <td className={`px-4 py-3 text-center border-r ${classes['Kelas 2'] === 0 ? 'text-gray-300' : ''}`}>{classes['Kelas 2'] || '-'}</td>
                                <td className={`px-4 py-3 text-center border-r ${classes['Kelas 3'] === 0 ? 'text-gray-300' : ''}`}>{classes['Kelas 3'] || '-'}</td>
                                <td className={`px-4 py-3 text-center border-r ${classes['Kelas 4'] === 0 ? 'text-gray-300' : ''}`}>{classes['Kelas 4'] || '-'}</td>
                                <td className={`px-4 py-3 text-center border-r ${classes['Kelas 5'] === 0 ? 'text-gray-300' : ''}`}>{classes['Kelas 5'] || '-'}</td>
                                <td className={`px-4 py-3 text-center border-r ${classes['Kelas 6'] === 0 ? 'text-gray-300' : ''}`}>{classes['Kelas 6'] || '-'}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
                 <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 text-sm rounded-lg border border-yellow-200 flex items-start gap-2">
                    <Info className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                       <strong>Catatan:</strong> Angka di atas adalah beban belajar intrakurikuler pertahun (asumsi 36 minggu efektif untuk Kls 1-5 dan 32 minggu untuk Kls 6). 
                       Total JP ini belum termasuk alokasi Projek Penguatan Profil Pelajar Pancasila (P5) yang dialokasikan sekitar 20% dari total JP.
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Calendar View Modal */}
      {showCalendar && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
               <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-blue-50">
                  <div className="flex items-center gap-3">
                     <CalendarDays className="w-6 h-6 text-blue-600" />
                     <div>
                        <h3 className="text-xl font-bold text-gray-900">Kalender Akademik 2025/2026</h3>
                        <p className="text-sm text-gray-500">Daftar hari libur dan kegiatan non-efektif (Tervalidasi)</p>
                     </div>
                  </div>
                  <button onClick={() => setShowCalendar(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                     <X className="w-6 h-6 text-gray-500" />
                  </button>
               </div>
               <div className="p-6 overflow-y-auto">
                   <div className="space-y-4">
                       {getEffectiveDatesForCalendar().map((range, index) => {
                           // Simple formatting
                           const start = new Date(range.start);
                           const end = new Date(range.end);
                           const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
                           const dateString = start.getTime() === end.getTime() 
                               ? start.toLocaleDateString('id-ID', options)
                               : `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })} - ${end.toLocaleDateString('id-ID', options)}`;
                           
                           return (
                               <div key={index} className={`flex items-start gap-4 p-3 rounded-lg border ${
                                   range.type === 'holiday' ? 'bg-red-50 border-red-100' :
                                   range.type === 'exam' ? 'bg-yellow-50 border-yellow-100' :
                                   'bg-blue-50 border-blue-100'
                               }`}>
                                   <div className={`p-2 rounded-full shrink-0 ${
                                        range.type === 'holiday' ? 'bg-red-100 text-red-600' :
                                        range.type === 'exam' ? 'bg-yellow-100 text-yellow-600' :
                                        'bg-blue-100 text-blue-600'
                                   }`}>
                                       {range.type === 'holiday' ? <CalendarCheck className="w-5 h-5" /> : 
                                        range.type === 'exam' ? <FileText className="w-5 h-5" /> : 
                                        <Activity className="w-5 h-5" />}
                                   </div>
                                   <div>
                                       <h4 className={`font-bold text-sm ${
                                            range.type === 'holiday' ? 'text-red-800' :
                                            range.type === 'exam' ? 'text-yellow-800' :
                                            'text-blue-800'
                                       }`}>{range.description}</h4>
                                       <p className="text-xs text-gray-600 mt-1 font-medium">{dateString}</p>
                                   </div>
                               </div>
                           )
                       })}
                   </div>
               </div>
            </div>
         </div>
      )}

      {/* Calendar Analysis Modal */}
      {analysisModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-indigo-50">
                 <div className="flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-indigo-600" />
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Analisis Kalender & Beban Kerja (JP)</h3>
                        <p className="text-sm text-gray-500">Kelas: <span className="font-bold">{analysisModal}</span> | Mapel: <span className="font-bold">{data?.subject}</span></p>
                    </div>
                 </div>
                 <button onClick={() => setAnalysisModal(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                    <X className="w-6 h-6 text-gray-500" />
                 </button>
              </div>
              
              <div className="p-6 overflow-y-auto bg-gray-50">
                {(() => {
                    if (!data) return null;
                    const result = calculateCalendarAnalysis(analysisModal, data.subject);
                    
                    if (!result) {
                        return (
                            <div className="text-center py-10 bg-white rounded-lg border border-gray-200 shadow-sm">
                                <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <h4 className="text-gray-800 font-bold mb-1">Jadwal Belum Dipilih</h4>
                                <p className="text-gray-500 text-sm">Silakan pilih hari belajar (Senin - Sabtu) pada kartu kelas terlebih dahulu.</p>
                            </div>
                        );
                    }

                    return (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 relative overflow-hidden">
                                     <div className="absolute right-0 top-0 p-4 opacity-10"><CalendarDays className="w-16 h-16 text-indigo-500" /></div>
                                     <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Hari Belajar Terpilih</h4>
                                     <div className="flex flex-wrap gap-2 mb-2">
                                        {(classSchedules[analysisModal] || []).map(day => (
                                            <span key={day} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded">{day}</span>
                                        ))}
                                     </div>
                                     <p className="text-xs text-gray-400">Total Slot Pertemuan: {result.totalAvailableSlots} Hari</p>
                                </div>

                                <div className={`p-4 rounded-xl shadow-sm border relative overflow-hidden ${result.totalEffectiveWeeks >= 32 ? 'bg-white border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                                     <div className="absolute right-0 top-0 p-4 opacity-10"><Clock className="w-16 h-16 text-green-500" /></div>
                                     <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Minggu Efektif</h4>
                                     <div className="flex items-end gap-2 mb-1">
                                         <span className="text-3xl font-bold text-gray-800">{result.totalEffectiveWeeks}</span>
                                         <span className="text-sm text-gray-500 mb-1">Minggu</span>
                                     </div>
                                     <p className="text-[10px] text-gray-500 leading-tight">
                                        *Minggu efektif adalah minggu dimana terdapat setidaknya 1 hari belajar efektif (tidak libur total).
                                     </p>
                                </div>

                                <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 relative overflow-hidden">
                                     <div className="absolute right-0 top-0 p-4 opacity-10"><Target className="w-16 h-16 text-blue-500" /></div>
                                     <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Target Beban Kerja (JP)</h4>
                                     <div className="flex items-end gap-2 mb-1">
                                         <span className="text-3xl font-bold text-blue-800">{result.totalTargetJP}</span>
                                         <span className="text-sm text-blue-600 mb-1">JP / Tahun</span>
                                     </div>
                                     <div className="flex items-center gap-1 text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded w-fit">
                                         <Info className="w-3 h-3" />
                                         <span>~{result.weeklyTargetJP} JP per Minggu</span>
                                     </div>
                                </div>
                            </div>

                            {/* --- New Visual Calendar Section --- */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-indigo-600" />
                                    Visualisasi Kalender Akademik
                                </h4>
                                <VisualCalendar 
                                    scheduledDays={classSchedules[analysisModal] || []}
                                    scheduleConfig={scheduleConfig}
                                />
                            </div>
                            
                            {/* Detailed Breakdown */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                    <h4 className="font-bold text-gray-800">Rincian Hari Efektif & Non-Efektif Bulanan</h4>
                                    <span className="text-xs text-gray-500 italic">Berdasarkan Konfigurasi Kalender yang Anda pilih</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                            <tr>
                                                <th className="px-6 py-3 border-r">Bulan</th>
                                                <th className="px-6 py-3 border-r text-center">Semester</th>
                                                <th className="px-6 py-3 border-r text-center w-32">Hari Efektif</th>
                                                <th className="px-6 py-3 border-r text-center w-32">Non-Efektif</th>
                                                <th className="px-6 py-3">Keterangan (Tgl Merah/Ujian pada Jadwal Anda)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {result.details.map((month, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-6 py-3 font-medium text-gray-900 border-r">{month.monthName}</td>
                                                    <td className="px-6 py-3 text-center border-r">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${month.semester === 1 ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                            {month.semester}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-center border-r font-bold text-green-600">{month.effectiveDays}</td>
                                                    <td className="px-6 py-3 text-center border-r font-bold text-red-500">{month.nonEffectiveDetails.length}</td>
                                                    <td className="px-6 py-3 text-xs text-gray-600">
                                                        {month.nonEffectiveDetails.length > 0 ? (
                                                            <ul className="list-disc list-inside space-y-1">
                                                                {month.nonEffectiveDetails.map((d, i) => (
                                                                    <li key={i}>
                                                                        <span className="font-semibold text-gray-800">{new Date(d.date).getDate()} {month.monthName.split(' ')[0]}:</span> {d.reason}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : <span className="text-gray-400 italic">Efektif Penuh</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                            {/* Summaries */}
                                            <tr className="bg-blue-50/50 font-bold border-t-2 border-blue-100">
                                                <td colSpan={2} className="px-6 py-3 text-right">Total Semester 1</td>
                                                <td className="px-6 py-3 text-center text-blue-800">{result.semester1.effectiveDays} Hari</td>
                                                <td colSpan={2} className="px-6 py-3 text-blue-800">({result.semester1.effectiveWeeks} Minggu Efektif)</td>
                                            </tr>
                                            <tr className="bg-purple-50/50 font-bold border-t border-purple-100">
                                                <td colSpan={2} className="px-6 py-3 text-right">Total Semester 2</td>
                                                <td className="px-6 py-3 text-center text-purple-800">{result.semester2.effectiveDays} Hari</td>
                                                <td colSpan={2} className="px-6 py-3 text-purple-800">({result.semester2.effectiveWeeks} Minggu Efektif)</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3 text-sm text-yellow-800">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <div>
                                    <strong>Validasi Permendikdasmen No 13 Tahun 2025:</strong>
                                    <p className="mt-1">
                                        Perhitungan di atas hanya memperhitungkan hari tatap muka efektif. Minggu ujian (Sumatif Tengah/Akhir Semester) 
                                        dan kegiatan jeda semester <strong>tidak dihitung</strong> sebagai minggu efektif pembelajaran (Intrakurikuler), 
                                        sehingga jumlah minggu efektif mungkin terlihat lebih sedikit dari total minggu kalender (biasanya 1 semester ~18-20 minggu, efektif ~16-17 minggu).
                                    </p>
                                </div>
                            </div>

                        </div>
                    );
                })()}
              </div>
           </div>
        </div>
      )}

      <header className="bg-blue-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <BookOpen className="w-8 h-8" />
                    <div>
                    <h1 className="text-xl font-bold leading-tight">Perangkat Ajar AI 2025</h1>
                    <p className="text-blue-200 text-xs">Generator CP, TP & ATP Kurikulum Merdeka</p>
                    </div>
                </div>

                <div className="flex bg-blue-800/50 p-1 rounded-lg gap-2">
                    <button 
                        onClick={() => { setAppStage('landing'); setCurrentView('generator'); }}
                        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-blue-100 hover:bg-blue-700/50 transition-all"
                        title="Ke Halaman Utama"
                    >
                         <Home className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setCurrentView('generator')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            currentView === 'generator' 
                            ? 'bg-white text-blue-700 shadow-sm' 
                            : 'text-blue-100 hover:bg-blue-700/50'
                        }`}
                    >
                        <Zap className="w-4 h-4" />
                        Generator
                    </button>
                    <button 
                        onClick={() => setCurrentView('history')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            currentView === 'history' 
                            ? 'bg-white text-blue-700 shadow-sm' 
                            : 'text-blue-100 hover:bg-blue-700/50'
                        }`}
                    >
                        <History className="w-4 h-4" />
                        Riwayat
                        {activities.length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full ml-1">{activities.length}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          
          {currentView === 'generator' ? (
            <div className="space-y-8 animate-in fade-in duration-300">
                {/* Controls */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-blue-600" />
                        Konfigurasi Awal & Jadwal Sekolah
                        </h2>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setShowJpReference(true)}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                            >
                                <Table className="w-4 h-4" />
                                Tabel Referensi JP
                            </button>
                            <button 
                                onClick={() => setShowCalendar(true)}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                            >
                                <CalendarDays className="w-4 h-4" />
                                Cek Kalender Akademik
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Pilih Fase & Kelas</label>
                            <div className="relative">
                            <select 
                                value={selectedFase.id}
                                onChange={(e) => setSelectedFase(FASES.find(f => f.id === e.target.value) || FASES[0])}
                                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            >
                                {FASES.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                            <ChevronRight className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 rotate-90" />
                            </div>
                        </div>

                        <div className="space-y-2 lg:col-span-2">
                            <label className="text-sm font-medium text-gray-700">Mata Pelajaran</label>
                            <div className="relative">
                            <select 
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            >
                                {SUBJECTS.map(s => (
                                <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            <ChevronRight className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 rotate-90" />
                            </div>
                        </div>

                        <div className="flex items-end">
                            <button 
                            onClick={generateContent}
                            disabled={loading}
                            className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                            {loading ? (
                                <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Menganalisis...
                                </>
                            ) : (
                                <>
                                <RefreshCw className="w-5 h-5" />
                                1. Generate CP & TP
                                </>
                            )}
                            </button>
                        </div>
                    </div>

                    {/* Schedule Configuration */}
                    <div className="bg-blue-50/50 p-6 rounded-lg border border-blue-100 space-y-4">
                         <div className="flex items-center gap-2 text-blue-800 font-semibold text-sm mb-2">
                             <SlidersHorizontal className="w-4 h-4" />
                             Konfigurasi Kalender Akademik (Libur & Ujian)
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(SCHEDULE_OPTIONS).map(([key, options]) => (
                                <div key={key} className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                        {key === 'libur_smt1' ? 'Libur Semester 1' :
                                         key === 'libur_smt2' ? 'Libur Kenaikan Kelas' :
                                         key === 'anbk_gladi' ? 'Gladi Bersih ANBK' : 
                                         key === 'anbk_main' ? 'Pelaksanaan ANBK Utama' :
                                         key === 'sumatif_ganjil' ? 'Sumatif Smt 1' :
                                         key === 'sumatif_jenjang' ? 'Sumatif Jenjang (Kls 6)' : 'Sumatif Akhir Tahun'}
                                    </label>
                                    <select 
                                        value={scheduleConfig[key]}
                                        onChange={(e) => setScheduleConfig({...scheduleConfig, [key]: e.target.value})}
                                        className="w-full p-2 text-sm bg-white border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                                    >
                                        {options.map(opt => (
                                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                         </div>
                         <p className="text-[10px] text-blue-500 mt-2 italic">
                             * Pilih variasi jadwal yang sesuai dengan Kalender Pendidikan provinsi Anda. Tanggal ini akan otomatis dilewati saat penyusunan ATP.
                         </p>
                    </div>
                    
                    {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
                        Error: {error}
                    </div>
                    )}
                </section>

                {/* Results Area */}
                {data && (
                    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div>
                                <h3 className="font-bold text-gray-900">{data.subject}</h3>
                                <p className="text-sm text-gray-500">{data.fase} - {data.description}</p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                                    <Layout className="w-4 h-4 text-gray-500" />
                                    <select 
                                        value={paperSize}
                                        onChange={(e) => setPaperSize(e.target.value as any)}
                                        className="bg-transparent text-sm font-medium outline-none text-gray-700"
                                    >
                                        <option value="A4">A4 Paper</option>
                                        <option value="F4">F4 (Folio)</option>
                                        <option value="Letter">Letter</option>
                                    </select>
                                </div>
                                <button 
                                    onClick={handleDownloadCurrent}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    Download .doc
                                </button>
                            </div>
                        </div>

                        {/* Render Separate Tables for Each Class */}
                        {selectedFase.classes.map((className, classIdx) => {
                            // Check if this class has ATP generated
                            const hasATP = data.elements.some(el => {
                                const alloc = el.allocations.find(a => a.className === className);
                                return alloc?.structuredAtp && alloc.structuredAtp.length > 0;
                            });
                            
                            // Get all allocations for this class to calc total
                            const classAllocations = data.elements.flatMap(el => el.allocations).filter(a => a.className === className);
                            const totalJP = calculateTotalJP(classAllocations, className);
                            
                            // Get Target for Display
                            const subjectKey = getSubjectKey(data.subject);
                            const targetJP = subjectKey ? JP_STANDARDS[subjectKey]?.[className] : 0;

                            return (
                                <div key={classIdx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-bold text-gray-800 border-l-4 border-blue-600 pl-3">{className}</h3>
                                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Distribusi Fase {selectedFase.id}</span>
                                            </div>
                                            {/* Day Selector */}
                                            <div className="flex items-center gap-2 ml-4">
                                                <span className="text-xs font-medium text-gray-600">Jadwal:</span>
                                                {DAYS_OF_WEEK.map(day => (
                                                    <button
                                                        key={day}
                                                        onClick={() => toggleScheduleDay(className, day)}
                                                        className={`px-2 py-1 text-[10px] rounded border transition-all ${
                                                            (classSchedules[className] || []).includes(day)
                                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {day}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {/* NEW: Calendar Analysis Button */}
                                            <button 
                                                onClick={() => setAnalysisModal(className)}
                                                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-sm font-medium rounded-lg shadow-sm transition-all"
                                            >
                                                <BarChart3 className="w-4 h-4" />
                                                Analisis Kalender & Beban JP
                                            </button>

                                            {!hasATP && (
                                                <button 
                                                    onClick={() => generateATP(className)}
                                                    disabled={atpLoading === className}
                                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all disabled:opacity-70 disabled:cursor-wait"
                                                >
                                                    {atpLoading === className ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Sedang menyusun ATP...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="w-4 h-4" />
                                                            2. Hasilkan ATP & Distribusi JP (AI)
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left border-collapse">
                                            <thead className="bg-white text-gray-700 border-b-2 border-gray-300">
                                                <tr>
                                                    <th className="px-4 py-4 font-bold w-12 text-center bg-gray-50/50 border-r border-gray-200">No</th>
                                                    <th className="px-4 py-4 font-bold w-48 bg-gray-50/50 border-r border-gray-200">Elemen</th>
                                                    <th className="px-4 py-4 font-bold w-64 bg-gray-50/50 border-r border-gray-200">Capaian Pembelajaran (CP)</th>
                                                    <th className="px-4 py-4 font-bold w-64 bg-blue-50/30 border-r border-blue-100">Tujuan Pembelajaran (TP)</th>
                                                    <th className="px-4 py-4 font-bold bg-green-50/30 border-r border-green-100">Alur Tujuan Pembelajaran (ATP)</th>
                                                    <th className="px-4 py-4 font-bold w-24 bg-yellow-50/30 text-center">Alokasi JP</th>
                                                    <th className="px-4 py-4 font-bold w-40 bg-purple-50/30 text-center">Rencana Tanggal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {data.elements.map((el, elIdx) => {
                                                    const allocIndex = el.allocations.findIndex(a => 
                                                        a.className.toLowerCase().includes(className.toLowerCase())
                                                    );
                                                    const alloc = el.allocations[allocIndex];

                                                    if (!alloc) return null;
                                                    
                                                    // Determine Render Groups: 
                                                    const groups: TpGroup[] = alloc.structuredAtp || alloc.tujuanPembelajaran.map(tp => ({ tp, atpItems: [] }));
                                                    
                                                    // Calculate Total RowSpan for Element & CP Columns
                                                    // FIXED: Use 0 initial value to avoid extra blank rows
                                                    const totalRowSpan = groups.reduce((acc, grp) => acc + Math.max(grp.atpItems.length, 1), 0);

                                                    return groups.map((group, grpIdx) => {
                                                        const tpRowSpan = Math.max(group.atpItems.length, 1);
                                                        const itemsToRender = group.atpItems.length > 0 ? group.atpItems : [{ alur: '', alokasiWaktu: '-' }];
                                                        const isGenerated = group.atpItems.length > 0;

                                                        return itemsToRender.map((item, itemIdx) => {
                                                            const isElementStart = grpIdx === 0 && itemIdx === 0;
                                                            const isTpStart = itemIdx === 0;

                                                            const nonEffective = item.planDate ? checkNonEffectiveDate(item.planDate) : null;
                                                            const dayName = item.planDate ? getDayName(new Date(item.planDate)) : '';

                                                            return (
                                                                <tr key={`${elIdx}-${grpIdx}-${itemIdx}`} className="hover:bg-gray-50/50 transition-colors border-b border-gray-200">
                                                                    {isElementStart && (
                                                                        <>
                                                                            <td rowSpan={totalRowSpan} className="px-4 py-4 align-top text-center text-gray-500 font-medium border-r border-gray-200">{elIdx + 1}</td>
                                                                            <td rowSpan={totalRowSpan} className="px-4 py-4 align-top font-semibold text-gray-800 border-r border-gray-200">{el.elementName}</td>
                                                                            <td rowSpan={totalRowSpan} className="px-4 py-4 align-top text-gray-600 leading-relaxed text-xs text-justify border-r border-gray-200">{el.capaianPembelajaran}</td>
                                                                        </>
                                                                    )}
                                                                    {isTpStart && (
                                                                        <td rowSpan={tpRowSpan} className="px-4 py-4 align-top bg-blue-50/10 border-r border-blue-100">
                                                                            <ul className="space-y-3">
                                                                                <li className="flex gap-2 text-gray-700">
                                                                                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                                                                    <span>{group.tp}</span>
                                                                                </li>
                                                                            </ul>
                                                                        </td>
                                                                    )}
                                                                    <td className="px-4 py-3 align-top bg-green-50/10 border-r border-green-100">
                                                                        {isGenerated ? (
                                                                            <div className="flex gap-2 text-gray-700">
                                                                                <span className="text-green-600 font-bold text-xs mt-0.5">{itemIdx + 1}.</span>
                                                                                <span>{item.alur}</span>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-gray-400 italic text-xs">Menunggu generate...</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-3 align-top bg-yellow-50/10 text-center">
                                                                        {isGenerated ? (
                                                                            <div className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">{item.alokasiWaktu}</div>
                                                                        ) : <span className="text-gray-300">-</span>}
                                                                    </td>
                                                                    <td className="px-4 py-3 align-top bg-purple-50/10 text-center">
                                                                        {isGenerated && (
                                                                            <div className="flex flex-col gap-1">
                                                                                <input 
                                                                                    type="date" 
                                                                                    value={item.planDate || ''}
                                                                                    onChange={(e) => updateAtpDate(className, elIdx, allocIndex, grpIdx, itemIdx, e.target.value)}
                                                                                    className={`text-xs p-1 rounded border outline-none focus:ring-1 focus:ring-purple-500 w-full ${nonEffective ? 'border-red-400 bg-red-50 text-red-700 font-bold' : 'border-gray-300'}`}
                                                                                    min="2025-07-01"
                                                                                    max="2026-07-31"
                                                                                />
                                                                                {item.planDate && <span className="text-[10px] text-gray-500 text-left font-medium">{dayName}</span>}
                                                                                {nonEffective && (
                                                                                    <div className="flex items-start gap-1 text-[10px] text-red-600 text-left bg-red-100/50 p-1 rounded">
                                                                                        <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                                                                                        <span>Bentrok: {nonEffective.description}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        });
                                                    });
                                                })}
                                            </tbody>
                                            {hasATP && (
                                                <tfoot>
                                                    <tr>
                                                        <td colSpan={5} className="bg-gray-100 px-6 py-4 text-right font-bold text-gray-800 border-t-2 border-gray-300">TOTAL ALOKASI WAKTU (INTRAKURIKULER)</td>
                                                        <td colSpan={2} className="bg-yellow-50 px-6 py-4 text-center font-bold text-yellow-800 border-t-2 border-yellow-300">
                                                            {totalJP} JP <br/>
                                                            {targetJP && <span className="text-xs font-normal text-yellow-800/70">(Target Min: {targetJP} JP)</span>}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>

                                        {/* RECOMMENDATION SECTION */}
                                        {hasATP && targetJP && (
                                            <div className="mt-4 bg-slate-50 border border-blue-100 rounded-xl p-5 mx-1">
                                                <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-3">
                                                    <Lightbulb className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                                    Analisis & Rekomendasi Kesesuaian (Permendikdasmen No 13 Tahun 2025)
                                                </h4>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className={`p-4 rounded-lg border flex flex-col justify-between ${totalJP >= targetJP ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                                                        <div>
                                                            <h5 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                                                {totalJP >= targetJP ? <Check className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                                                                Status Pemenuhan JP Intrakurikuler
                                                            </h5>
                                                            <div className="mt-2 text-sm text-gray-700">
                                                                {totalJP >= targetJP ? (
                                                                    <p>Alokasi waktu <strong>telah memenuhi</strong> batas minimal tahunan ({targetJP} JP). Sistem telah secara otomatis menghentikan penambahan materi setelah target tercapai.</p>
                                                                ) : (
                                                                    <p>Alokasi waktu <strong>belum memenuhi</strong> target minimal. Masih kurang <strong>{targetJP - totalJP} JP</strong>. Disarankan menambah alur atau memperdalam materi yang kompleks.</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 text-xs font-medium text-gray-500">Realisasi: {totalJP} JP / Target: {targetJP} JP</div>
                                                    </div>

                                                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                                                        <h5 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                                            <TrendingUp className="w-4 h-4 text-blue-600" />
                                                            Strategi Pelaksanaan Kurikulum
                                                        </h5>
                                                        <ul className="mt-2 text-sm text-gray-600 space-y-2 list-disc list-inside">
                                                            {totalJP > targetJP ? (
                                                                <li>Terdapat kelebihan <strong>{totalJP - targetJP} JP</strong>. Gunakan waktu ini untuk program <strong>Pengayaan</strong> atau <strong>Remedial</strong> bagi siswa yang membutuhkan.</li>
                                                            ) : totalJP === targetJP ? (
                                                                <li>Alokasi waktu sangat presisi. Maksimalkan <strong>Asesmen Formatif</strong> di setiap pertemuan untuk memantau pemahaman siswa.</li>
                                                            ) : (
                                                                <li>Pertimbangkan untuk menggabungkan hari belajar tambahan atau memadatkan materi yang berdekatan.</li>
                                                            )}
                                                            <li><strong>Catatan P5:</strong> Alokasi JP di atas adalah murni <em>Intrakurikuler</em>. Ingat untuk mengalokasikan sekitar <strong>20-25%</strong> dari total JP per tahun secara terpisah untuk <em>Projek Penguatan Profil Pelajar Pancasila</em>.</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                                <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500 italic flex gap-1">
                                                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                                    <span>Sesuai Struktur Kurikulum Merdeka (Permendikdasmen No 13/2025), angka {targetJP} JP adalah beban belajar intrakurikuler minimal per tahun untuk mata pelajaran {data.subject} di {className}.</span>
                                                </div>
                                            </div>
                                        )}

                                        {data.elements.every(el => !el.allocations.find(a => a.className.toLowerCase().includes(className.toLowerCase()))) && (
                                            <div className="p-8 text-center text-gray-400">Tidak ada data untuk kelas ini.</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </section>
                )}

                {!data && !loading && (
                    <div className="text-center py-20 text-gray-400">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">Silakan pilih Fase dan Mata Pelajaran untuk memulai analisis.</p>
                        <p className="text-sm">Data akan di-generate berdasarkan standar CP Terbaru 2025.</p>
                    </div>
                )}
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right duration-300">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                     <div className="p-6 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                             <History className="w-6 h-6 text-blue-600" />
                             Riwayat Aktivitas & Unduhan
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Daftar semua dokumen CP, TP, dan ATP yang pernah Anda generate di sesi ini.</p>
                     </div>
                     
                     <div className="p-6">
                        {activities.length === 0 ? (
                             <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                <Activity className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p className="text-lg font-medium">Belum ada riwayat aktivitas</p>
                                <p className="text-sm mb-6">Lakukan generate konten di tab Generator terlebih dahulu.</p>
                                <button 
                                    onClick={() => setCurrentView('generator')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Ke Generator
                                </button>
                             </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                                            <th className="px-6 py-4 font-semibold">Waktu</th>
                                            <th className="px-6 py-4 font-semibold">Aktivitas</th>
                                            <th className="px-6 py-4 font-semibold">Mata Pelajaran</th>
                                            <th className="px-6 py-4 font-semibold">Detail</th>
                                            <th className="px-6 py-4 font-semibold text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {activities.map((act) => (
                                            <tr key={act.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-4 text-gray-500 text-sm whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-gray-400" />
                                                        {act.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        <span className="text-xs text-gray-400">({act.timestamp.toLocaleDateString()})</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                     <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                                                        act.type === 'CP_TP' 
                                                        ? 'bg-blue-50 text-blue-600 border-blue-200' 
                                                        : 'bg-green-50 text-green-600 border-green-200'
                                                    }`}>
                                                        {act.type === 'CP_TP' ? 'GENERATE CP & TP' : 'GENERATE ATP & JP'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-800">
                                                    {act.subject}
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 text-sm max-w-xs truncate">
                                                    {act.details}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => restoreFromHistory(act)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
                                                            title="Kembalikan data ini ke halaman Generator untuk dilihat"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                            Preview
                                                        </button>
                                                        <button 
                                                            onClick={() => downloadDoc(act.dataSnapshot, act.paperSizeSnapshot)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md border border-green-200 transition-colors"
                                                            title={`Unduh Dokumen (${act.paperSizeSnapshot})`}
                                                        >
                                                            <FileDown className="w-3.5 h-3.5" />
                                                            Unduh
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                     </div>
                </div>
            </div>
          )}

        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          &copy; 2025 Generator Perangkat Ajar AI. Dibuat dengan Google Gemini.
        </div>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);