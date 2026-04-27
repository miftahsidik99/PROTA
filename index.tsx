import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { motion } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { BookOpen, CheckCircle, Download, FileText, Layout, Loader2, RefreshCw, Settings, ChevronRight, Sparkles, Clock, Calculator, ShieldCheck, History, X, Activity, Eye, FileDown, ArrowLeft, Home, Calendar, AlertCircle, ArrowRight, Zap, Star, FileOutput, CalendarCheck, GraduationCap, SlidersHorizontal, Info, Table, Lightbulb, TrendingUp, AlertTriangle, Check, CalendarDays, BarChart3, ChevronDown, ChevronUp, Target, ChevronLeft, FilePlus, Save, Image as ImageIcon, Printer, User, Edit, Brain, ThumbsUp, Coffee, LogOut, Trash2 } from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, getDocs, where, deleteDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);                
export const auth = getAuth();

// --- API Key Helper ---
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

// --- Error Helper ---
const formatAIError = (err: any): string => {
    const errorString = JSON.stringify(err) + (err?.message || String(err)) + (err?.error?.status || '');
    if (
        errorString.includes('429') || 
        errorString.toLowerCase().includes('quota') || 
        errorString.includes('RESOURCE_EXHAUSTED') ||
        errorString.toLowerCase().includes('rate limit')
    ) {
        return "Limit API Google Gemini telah tercapai. Jika ini limit per menit, mohon tunggu 1-2 menit sebelum mencoba lagi. Jika jatah harian habis, limit akan di-reset besok (sekitar pk 14.00/15.00 WIB).";
    }
    return err?.message || String(err);
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
// These are default fallbacks now, mostly replaced by academicYearStart
const DEFAULT_ACADEMIC_START_DATE = '2025-07-14';
const DEFAULT_ACADEMIC_END_DATE = '2026-06-27';

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

export interface CalendarEvent {
  id: string;
  start: string;
  end: string;
  description: string;
  type: 'holiday' | 'exam' | 'activity';
  color: string;
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
    className: string;
    fase: string;
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

export const DEFAULT_CALENDAR_EVENTS: CalendarEvent[] = [
  { id: 'ev-1', start: '2025-07-01', end: '2025-07-13', description: 'Libur Akhir Tahun Pelajaran', type: 'holiday', color: 'bg-red-500' },
  { id: 'ev-2', start: '2025-07-15', end: '2025-07-16', description: 'Masa Pengenalan Lingkungan Sekolah', type: 'activity', color: 'bg-green-500' },
  { id: 'ev-3', start: '2025-08-17', end: '2025-08-18', description: 'Libur Hari Proklamasi Kemerdekaan RI', type: 'holiday', color: 'bg-red-500' },
  { id: 'ev-4', start: '2025-09-05', end: '2025-09-05', description: 'Libur Maulid Nabi', type: 'holiday', color: 'bg-red-500' },
  { id: 'ev-5', start: '2025-10-06', end: '2025-10-10', description: 'Kemungkinan Penilaian Tengah Semester', type: 'exam', color: 'bg-orange-500' },
  { id: 'ev-6', start: '2025-12-08', end: '2025-12-12', description: 'Prakiraan Penilaian Akhir Semester 1', type: 'exam', color: 'bg-orange-500' },
  { id: 'ev-7', start: '2025-12-15', end: '2025-12-20', description: 'Prakiraan Pengolahan Nilai PAS 1', type: 'activity', color: 'bg-purple-500' },
  { id: 'ev-8', start: '2025-12-23', end: '2026-01-09', description: 'Libur Semester 1', type: 'holiday', color: 'bg-pink-500' },
  { id: 'ev-9', start: '2026-01-16', end: '2026-01-16', description: 'Libur Isra Mi\'raj', type: 'holiday', color: 'bg-red-500' },
  { id: 'ev-10', start: '2026-02-17', end: '2026-02-17', description: 'Libur Tahun Baru Imlek', type: 'holiday', color: 'bg-red-500' },
  { id: 'ev-11', start: '2026-02-20', end: '2026-02-23', description: 'Prakiraan Libur Awal Ramadan 1447 H', type: 'holiday', color: 'bg-red-500' },
  { id: 'ev-12', start: '2026-03-04', end: '2026-03-13', description: 'Pesantren Ramadhan 1447 H', type: 'activity', color: 'bg-teal-500' },
  { id: 'ev-13', start: '2026-03-16', end: '2026-03-29', description: 'Prakiraan Libur Hari Raya Idul Fitri', type: 'holiday', color: 'bg-red-500' },
  { id: 'ev-14', start: '2026-06-09', end: '2026-06-12', description: 'Prakiraan Penilaian Akhir Tahun', type: 'exam', color: 'bg-orange-500' },
  { id: 'ev-15', start: '2026-06-15', end: '2026-06-26', description: 'Prakiraan Pengolahan Nilai PSAT', type: 'activity', color: 'bg-purple-500' },
  { id: 'ev-16', start: '2026-06-29', end: '2026-06-30', description: 'Libur Akhir Tahun Pelajaran', type: 'holiday', color: 'bg-red-500' }
];

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
    calendarEvents,
    academicYearStart,
    schoolDaysCount
}: { 
    scheduledDays: string[], 
    calendarEvents: CalendarEvent[],
    academicYearStart: number,
    schoolDaysCount: 5 | 6
}) => {
    const [viewDate, setViewDate] = useState(new Date(academicYearStart, 6, 1)); 

    const checkStatus = (dateStr: string): CalendarEvent | null => {
        return calendarEvents.find(range => dateStr >= range.start && dateStr <= range.end) || null;
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

        const academicStartStr = `${academicYearStart}-07-14`;
        const academicEndStr = `${academicYearStart + 1}-06-27`;

        for (let d = 1; d <= lastDay.getDate(); d++) {
            const currentDate = new Date(year, month, d);
            const dateStr = formatDateLocal(currentDate);
            const dayName = getDayName(currentDate);
            const conflict = checkStatus(dateStr);
            const isScheduled = scheduledDays.includes(dayName);
            const isWithinAcademicYear = dateStr >= academicStartStr && dateStr <= academicEndStr;
            const isWeekend = currentDate.getDay() === 0 || (schoolDaysCount === 5 && currentDate.getDay() === 6);

            let status: 'effective' | 'noneffective' | 'off' = 'off';
            let tooltip = '';
            
            // Generate detailed tooltip
            if (!isWithinAcademicYear) {
                status = 'off';
                tooltip = `${dayName}, ${d} ${viewDate.toLocaleString('id-ID', { month: 'long'})} ${year}\nStatus: Diluar Tahun Ajaran`;
            } else if (isWeekend) {
                status = 'noneffective'; // weekends are non-effective
                tooltip = `${dayName}, ${d} ${viewDate.toLocaleString('id-ID', { month: 'long'})} ${year}\nStatus: LIBUR (Akhir Pekan)`;
                if(conflict) tooltip += `\nKeterangan: ${conflict.description}`;
            } else if (conflict) {
                status = 'noneffective';
                tooltip = `${dayName}, ${d} ${viewDate.toLocaleString('id-ID', { month: 'long'})} ${year}\nStatus: TIDAK EFEKTIF (Jadwal Terganggu)\nKeterangan: ${conflict.description}`;
            } else if (isScheduled) {
                status = 'effective';
                tooltip = `${dayName}, ${d} ${viewDate.toLocaleString('id-ID', { month: 'long'})} ${year}\nStatus: EFEKTIF BELAJAR\nJadwal Rutin: ${dayName}`;
            } else {
                status = 'noneffective';
                tooltip = `${dayName}, ${d} ${viewDate.toLocaleString('id-ID', { month: 'long'})} ${year}\nStatus: Tidak Ada Jadwal (Hari Tidak Terjadwal)`;
            }

            days.push({ 
                type: 'day', key: dateStr, date: d, status, tooltip, 
                isHoliday: conflict?.type === 'holiday' || isWeekend, isSunday: currentDate.getDay() === 0, isOutside: !isWithinAcademicYear
            });
        }
        return days;
    }, [viewDate, scheduledDays, calendarEvents, academicYearStart, schoolDaysCount]);

    const handlePrev = () => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
        if (newDate >= new Date(academicYearStart, 6, 1)) setViewDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
        if (newDate <= new Date(academicYearStart + 1, 6, 1)) setViewDate(newDate);
    };

    return (
        <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-indigo-50/50 border-b border-indigo-100">
                <button onClick={handlePrev} className="p-1 hover:bg-white rounded" disabled={viewDate.getMonth() === 6 && viewDate.getFullYear() === academicYearStart}><ChevronLeft className="w-5 h-5 text-indigo-600" /></button>
                <h3 className="font-bold text-gray-800 text-lg">{viewDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={handleNext} className="p-1 hover:bg-white rounded" disabled={viewDate.getMonth() === 6 && viewDate.getFullYear() === academicYearStart + 1}><ChevronRight className="w-5 h-5 text-indigo-600" /></button>
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

// --- Master Calendar Config ---
const MasterCalendarConfig = ({ 
    calendarEvents, 
    onDateClick,
    academicYearStart,
    setAcademicYearStart,
    schoolDaysCount,
    setSchoolDaysCount
}: { 
    calendarEvents: CalendarEvent[], 
    onDateClick: (dateStr: string, ev: CalendarEvent | undefined) => void,
    academicYearStart: number,
    setAcademicYearStart: (year: number) => void,
    schoolDaysCount: 5 | 6,
    setSchoolDaysCount: (count: 5 | 6) => void
}) => {
    const months = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(academicYearStart, 6 + i, 1);
        return { y: date.getFullYear(), m: date.getMonth() };
    });

    const getDaysInMonth = (year: number, month: number) => {
        const date = new Date(year, month, 1);
        const days = [];
        while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    };

    const getEventForDate = (dateStr: string) => {
        return calendarEvents.find(ev => dateStr >= ev.start && dateStr <= ev.end);
    };

    const padDays = (firstDay: Date) => {
        let start = firstDay.getDay();
        if (start === 0) start = 7;
        return Array.from({ length: start - 1 }, (_, i) => i);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center bg-gray-100 p-4 rounded-lg gap-4">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-gray-800">Tahun Ajaran</h3>
                    <select 
                        value={academicYearStart} 
                        onChange={(e) => setAcademicYearStart(Number(e.target.value))}
                        className="p-2 border border-gray-300 rounded font-semibold text-gray-700 focus:ring-blue-500 bg-white"
                    >
                        {[2024, 2025, 2026, 2027, 2028].map(y => (
                            <option key={y} value={y}>{y}/{y+1}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-gray-800">Sistem Hari</h3>
                    <div className="flex bg-white rounded-lg border border-gray-300 overflow-hidden">
                        <button 
                            onClick={() => setSchoolDaysCount(5)} 
                            className={`px-4 py-2 text-sm font-semibold transition-colors ${schoolDaysCount === 5 ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            5 Hari (Sen-Jum)
                        </button>
                        <button 
                            onClick={() => setSchoolDaysCount(6)} 
                            className={`px-4 py-2 text-sm font-semibold transition-colors ${schoolDaysCount === 6 ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            6 Hari (Sen-Sab)
                        </button>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-blue-600"/> SEMESTER 1 (Juli - Des {academicYearStart})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {months.slice(0, 6).map((item, idx) => {
                        const days = getDaysInMonth(item.y, item.m);
                        const firstDay = days[0];
                        return (
                            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
                                <div className="bg-blue-50/80 px-4 py-2 font-bold text-blue-900 border-b border-blue-100 text-center uppercase tracking-wider text-sm">
                                    {firstDay.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                                </div>
                                <div className="p-3">
                                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                                        {['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'].map((d, i) => <div key={i} className={`text-[10px] font-bold ${d==='Mg' || (schoolDaysCount === 5 && d==='Sb') ? 'text-red-500' : 'text-gray-500'}`}>{d}</div>)}
                                    </div>
                                    <div className="grid grid-cols-7 gap-1 text-center">
                                        {padDays(firstDay).map(p => <div key={'pad'+p} className="p-1"></div>)}
                                        {days.map(d => {
                                            const dateStr = formatDateLocal(d);
                                            const ev = getEventForDate(dateStr);
                                            const isWeekend = d.getDay() === 0 || (schoolDaysCount === 5 && d.getDay() === 6);
                                            const bgClass = ev ? ev.color : (isWeekend ? 'bg-red-50 text-red-600' : 'hover:bg-gray-100');
                                            const textClass = ev ? 'text-white' : (isWeekend ? 'text-red-500 font-bold' : 'text-gray-700');
                                            
                                            return (
                                                <button 
                                                    key={d.getDate()} 
                                                    onClick={() => onDateClick(dateStr, ev)}
                                                    className={`p-1.5 text-xs rounded transition-all ${bgClass} ${textClass} relative ${ev ? 'shadow-sm transform hover:scale-110 z-10 font-bold' : 'hover:bg-gray-200'}`}
                                                    title={ev ? ev.description : 'Kosong'}
                                                >
                                                    {d.getDate()}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-indigo-600"/> SEMESTER 2 (Jan - Jun {academicYearStart + 1})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {months.slice(6, 12).map((item, idx) => {
                        const days = getDaysInMonth(item.y, item.m);
                        const firstDay = days[0];
                        return (
                            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
                                <div className="bg-indigo-50/80 px-4 py-2 font-bold text-indigo-900 border-b border-indigo-100 text-center uppercase tracking-wider text-sm">
                                    {firstDay.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                                </div>
                                <div className="p-3">
                                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                                        {['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'].map((d, i) => <div key={i} className={`text-[10px] font-bold ${d==='Mg' || (schoolDaysCount === 5 && d==='Sb') ? 'text-red-500' : 'text-gray-500'}`}>{d}</div>)}
                                    </div>
                                    <div className="grid grid-cols-7 gap-1 text-center">
                                        {padDays(firstDay).map(p => <div key={'pad'+p} className="p-1"></div>)}
                                        {days.map(d => {
                                            const dateStr = formatDateLocal(d);
                                            const ev = getEventForDate(dateStr);
                                            const isWeekend = d.getDay() === 0 || (schoolDaysCount === 5 && d.getDay() === 6);
                                            const bgClass = ev ? ev.color : (isWeekend ? 'bg-red-50 text-red-600' : 'hover:bg-gray-100');
                                            const textClass = ev ? 'text-white' : (isWeekend ? 'text-red-500 font-bold' : 'text-gray-700');
                                            
                                            return (
                                                <button 
                                                    key={d.getDate()} 
                                                    onClick={() => onDateClick(dateStr, ev)}
                                                    className={`p-1.5 text-xs rounded transition-all ${bgClass} ${textClass} relative ${ev ? 'shadow-sm transform hover:scale-110 z-10 font-bold' : 'hover:bg-gray-200'}`}
                                                    title={ev ? ev.description : 'Kosong'}
                                                >
                                                    {d.getDate()}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

// --- Modul Ajar Generator Component ---

const ModulAjarGenerator = ({ 
    context, 
    userIdentity,
    onBack, 
    onSave 
}: { 
    context: ModulAjarContext, 
    userIdentity: UserIdentity,
    onBack: () => void, 
    onSave: (log: ActivityLog) => void 
}) => {
    const [formData, setFormData] = useState<ModulAjarData>({
        className: context.className,
        fase: context.fase,
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

    const handleGetRecommendation = async () => {
        setRecLoading(true);
        setAiRecommendations([]);
        try {
            const apiKey = getApiKey();
            if (!apiKey) throw new Error("API Key Gemini tidak ditemukan. Pastikan Anda telah mengatur VITE_GEMINI_API_KEY di environment variables.");
            const ai = new GoogleGenAI({ apiKey });

            const prompt = `
                Bertindaklah sebagai Konsultan Kurikulum Merdeka (Sesuai Permendikdasmen No. 13 Tahun 2025).
                Berikan 3 REKOMENDASI Model Pembelajaran beserta METODE/TEKNIK Pembelajaran yang spesifik, efektif, dan mengintegrasikan prinsip Mindful Learning, Joyful Learning, serta Meaningful Learning untuk materi berikut.
                
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
            alert("Gagal mendapatkan rekomendasi: " + formatAIError(e));
        } finally {
            setRecLoading(false);
        }
    };

    const handleGenerateModul = async () => {
        setLoading(true);
        setGeneratedImageUrl(null);
        try {
            const apiKey = getApiKey();
            if (!apiKey) throw new Error("API Key Gemini tidak ditemukan. Pastikan Anda telah mengatur VITE_GEMINI_API_KEY di environment variables.");
            const ai = new GoogleGenAI({ apiKey });

            const prompt = `
                Bertindaklah sebagai Guru Profesional ahli Kurikulum Merdeka (Sesuai Permendikdasmen No. 13 Tahun 2025).
                Buatlah MODUL AJAR lengkap dan komprehensif.
                SANGAT PENTING: 
                - Modul Ajar harus secara eksplisit mengintegrasikan 3 prinsip utama BSKAP 032 HKR 2025 yaitu Mindful Learning (Pembelajaran Berkesadaran Penuh), Joyful Learning (Pembelajaran Menyenangkan/Sukacita), dan Meaningful Learning (Pembelajaran Bermakna) pada setiap tahapan kegiatan.
                - Gunakan pendekatan/model pembelajaran yang paling sesuai, bervariasi, dan direkomendasikan berdasarkan tingkat SD Kelas ${formData.className} dan Fase ${formData.fase}. Jangan hanya terpaku pada satu model.
                
                INFORMASI UMUM:
                - Penyusun: ${userIdentity.authorName}
                - Instansi: ${userIdentity.institutionName}
                - Jenjang/Kelas: SD / ${formData.className} (${formData.fase})
                - Mapel: ${formData.subject}
                - Alokasi Waktu: ${formData.allocation}
                - Tanggal: ${formData.date}
                - Topik/Materi: ${formData.topic}
                - Model/Pendekatan Pembelajaran: (Tentukan/Pilihkan model yang paling tepat lalu tuliskan)
                
                KOMPONEN INTI:
                - Capaian Pembelajaran (CP): ${context.cp}
                - Tujuan Pembelajaran (TP): ${context.tp}
                - Pemahaman Bermakna
                - Pertanyaan Pemantik
                - Kegiatan Pembelajaran (Pendahuluan, Inti, Penutup) terpadu dengan 3 prinsip di atas.
                
                LAMPIRAN (Sajikan dalam format tabel HTML modern jika memungkinkan):
                ${formData.components.includeMaterials ? '- Materi Ajar (Ringkasan/Bahan Ajar)' : ''}
                ${formData.components.includeLKPD ? '- Lembar Kerja Peserta Didik (LKPD) - Buatkan instruksi detail.' : ''}
                ${formData.components.includeAssessment ? '- Instrumen Penilaian (Rubrik/Soal)' : ''}
                - Jurnal Mengajar/Sikap (Disajikan dalam bentuk tabel format pengisian).
                
                OUTPUT FORMAT:
                Berikan output dalam format HTML (tanpa tag <html>/<body>, hanya konten div) yang siap di-render. Gunakan styling inline CSS minimalis untuk tabel (border-collapse, padding: 5px, border: 1px solid black, width: 100%).
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
                try {
                    const imgPrompt = `Buatkan gambar lampiran visual modul ajar LKPD untuk materi pembelajaran SD.

Topik: "${formData.topic}"
Capaian Pembelajaran: "${context.cp}"
Tujuan Pembelajaran: "${context.tp}"

Gaya visual:
- ilustrasi edukatif, rapi, bersih, ramah anak/sekolah
- warna cerah namun tetap profesional
- detail cukup, tidak berlebihan
- komposisi seimbang dan mudah dipahami
- cocok untuk dicetak di lembar kerja siswa (LKPD)

Isi visual utama:
- tampilkan tokoh/objek utama yang sedang melakukan aktivitas Lembar Kerja (LKPD) sesuai dengan Topik dan Tujuan Pembelajaran di atas.
- sertakan latar/tempat yang relevan dengan skenario pembelajaran.
- bila perlu tambahkan elemen pendukung seperti alat, buku, papan tulis, angka, simbol, tanaman, atau alat peraga yang relevan dengan Tujuan Pembelajaran.

Ketentuan penting:
- PENTING: DILARANG keras menampilkan tulisan, kata-kata, huruf alfabet, huruf Arab/hijaiyah, angka, atau teks apa pun di dalam gambar (ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS).
- gambar harus sesuai dengan konteks LKPD dan topik.
- jangan menampilkan elemen yang tidak ada hubungannya dengan materi
- jangan terlalu ramai
- gunakan sudut pandang yang mudah dipahami siswa

Hasil akhir:
- ilustrasi resolusi tinggi
- format horizontal
- terlihat seperti gambar untuk lampiran lembar kerja peserta didik formal`;
                    let imgResponse;
                    try {
                        imgResponse = await ai.models.generateContent({
                            model: 'gemini-2.5-flash-image',
                            contents: { parts: [{ text: imgPrompt }] },
                            config: {
                                imageConfig: {
                                    aspectRatio: "1:1",
                                    imageSize: "1K"
                                }
                            }
                        });
                    } catch (fallbackError) {
                        console.warn("Fallback to gemini-3.1-flash-image-preview:", fallbackError);
                        imgResponse = await ai.models.generateContent({
                            model: 'gemini-3.1-flash-image-preview',
                            contents: { parts: [{ text: imgPrompt }] },
                            config: {
                                imageConfig: {
                                    aspectRatio: "1:1",
                                    imageSize: "1K"
                                }
                            }
                        });
                    }
                    
                    for (const part of imgResponse.candidates?.[0]?.content?.parts || []) {
                        if (part.inlineData) {
                            imgData = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                            setGeneratedImageUrl(imgData);
                            break;
                        }
                    }
                } catch (imgError) {
                    console.error("Gagal membuat gambar AI:", imgError);
                }
            }

            onSave({
                id: Date.now().toString(),
                timestamp: new Date(),
                type: 'MODUL_AJAR',
                subject: formData.subject,
                details: `Modul Ajar: ${formData.topic}`,
                dataSnapshot: { ...formData, semester: userIdentity.semester, content: html, generatedImages: imgData ? [imgData] : [] },
                paperSizeSnapshot: paperSize
            });

        } catch (e: any) {
            console.error(e);
            alert("Gagal: " + formatAIError(e));
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadDoc = () => {
        if (!resultContent) return;
        const size = PAPER_SIZES[paperSize];
        const footerText = `Modul Ajar - ${formData.subject} - ${formData.className} | Disusun oleh: ${userIdentity.authorName}`;

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
                <h3 style="margin: 5pt 0;">${userIdentity.institutionName.toUpperCase()}</h3>
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
                                <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-purple-500" /> Informasi Umum</h3>
                                <div className="space-y-3">
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
                            <button onClick={handleGenerateModul} disabled={loading || !userIdentity.authorName} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}{loading ? 'Sedang Menyusun...' : 'Generate Modul Ajar'}</button>
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
                                     <div className="text-center mb-6 pb-4 border-b border-gray-300"><h1 className="text-xl font-bold uppercase mb-1">Modul Ajar {formData.subject}</h1><p className="text-sm text-gray-600">{userIdentity.institutionName} | Tahun Ajaran {userIdentity.academicYear}</p></div>
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

interface CustomHoliday {
    id: string;
    description: string;
    start: string;
    end?: string;
}

interface UserIdentity {
    authorName: string;
    institutionName: string;
    academicYear: string;
    semester: string;
    customApiKey?: string;
}

const App = () => {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
      } else {
        signInAnonymously(auth).catch(err => {
            console.error("Failed to sign in anonymously", err);
        });
      }
    });

    return () => unsubscribe();
  }, []);
  const [appStage, setAppStage] = useState<'login' | 'register' | 'tutorial' | 'identity' | 'generator'>(() => {
    return localStorage.getItem('prota_user') ? 'generator' : 'login';
  });
  const [user, setUser] = useState<{ name: string, email: string } | null>(null);
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
  const [bulkGenerationStatus, setBulkGenerationStatus] = useState<Record<string, { current: number, total: number, percent: number, active: boolean, statusText?: string }>>({});
  const [pendingSemesterSelection, setPendingSemesterSelection] = useState<string | null>(null);
  
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(() => localStorage.getItem('prota_maintenance_bypass') !== 'true');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+m or Ctrl+M
      if (event.ctrlKey && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        setIsMaintenanceMode(false);
        localStorage.setItem('prota_maintenance_bypass', 'true');
        alert("Mode Maintenance Dinonaktifkan. Halaman akan dimuat ulang.");
        window.location.reload(); 
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isMaintenanceMode) {
      return (
        <div className="flex flex-col items-center justify-center h-screen w-full bg-gray-50 text-center p-6 bg-gradient-to-b from-blue-50 to-white">
          <div className="bg-white p-8 rounded-2xl shadow-xl ring-1 ring-gray-200 max-w-md">
             <h1 className="text-3xl font-bold text-gray-800 mb-4">Mohon maaf sistem sedang dalam perbaikan</h1>
             <p className="text-gray-600">Terima kasih atas kesabaran Anda.</p>
          </div>
        </div>
      );
  }
  
  const [userIdentity, setUserIdentity] = useState<UserIdentity>(() => ({
      authorName: localStorage.getItem('prota_author_name') || '',
      institutionName: localStorage.getItem('prota_institution_name') || '',
      academicYear: localStorage.getItem('prota_academic_year') || '',
      semester: localStorage.getItem('prota_semester') || '',
      customApiKey: localStorage.getItem('prota_custom_api_key') || ''
  }));

  // Schedules & Config
  const [classSchedules, setClassSchedules] = useState<Record<string, string[]>>({});
  const [classDailyJP, setClassDailyJP] = useState<Record<string, Record<string, number>>>(() => {
      const saved = localStorage.getItem('prota_class_daily_jp');
      return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
      localStorage.setItem('prota_class_daily_jp', JSON.stringify(classDailyJP));
  }, [classDailyJP]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    try {
        const saved = localStorage.getItem('prota_calendar_events');
        if (saved) return JSON.parse(saved);
    } catch(e) {}
    return DEFAULT_CALENDAR_EVENTS;
  });
  const [editingCalendarEvent, setEditingCalendarEvent] = useState<{dateStr: string, ev?: CalendarEvent} | null>(null);
  const [academicYearStart, setAcademicYearStart] = useState<number>(2025);
  const [schoolDaysCount, setSchoolDaysCount] = useState<5 | 6>(() => {
      const saved = localStorage.getItem('prota_school_days_count');
      return saved ? parseInt(saved, 10) as 5 | 6 : 6;
  });

  useEffect(() => {
      localStorage.setItem('prota_school_days_count', schoolDaysCount.toString());
  }, [schoolDaysCount]);

  // Helper
  useEffect(() => {
    const savedUser = localStorage.getItem('prota_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    const savedActivities = localStorage.getItem('prota_activities');
    if (savedActivities) {
      try {
        const parsed = JSON.parse(savedActivities);
        // Convert string dates back to Date objects
        const withDates = parsed.map((a: any) => ({ ...a, timestamp: new Date(a.timestamp) }));
        setActivities(withDates);
      } catch (e) {
        console.error("Failed to parse activities", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('prota_user');
    setUser(null);
    setAppStage('login');
  };

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

  const saveActivitiesToStorage = (activities: ActivityLog[]) => {
      let currentActivities = [...activities];
      if (currentActivities.length > 20) {
          currentActivities = currentActivities.slice(0, 20);
      }
      
      while (currentActivities.length > 0) {
          try {
              localStorage.setItem('prota_activities', JSON.stringify(currentActivities));
              return currentActivities;
          } catch (e: any) {
              const msg = e?.message?.toLowerCase() || '';
              if (e.name === 'QuotaExceededError' || msg.includes('quota') || msg.includes('exceeded')) {
                  console.warn("Storage quota exceeded, removing oldest activity...");
                  currentActivities.pop();
              } else {
                  console.error("Failed to save activities to localStorage:", e);
                  return currentActivities;
              }
          }
      }
      return [];
  };

  // Activity Management
  // Fetch activities from Firestore
  useEffect(() => {
    const fetchActivities = async () => {
      if (!firebaseUser) return;
      try {
        const q = query(
          collection(db, 'users', firebaseUser.uid, 'activities'),
          orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedActivities: ActivityLog[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            timestamp: data.timestamp.toDate(),
            type: data.type,
            subject: data.subject,
            details: data.details,
            dataSnapshot: data.dataSnapshot,
            paperSizeSnapshot: data.paperSizeSnapshot
          };
        });
        setActivities(fetchedActivities);
      } catch (e) {
        console.error("Failed to fetch activities from Firestore", e);
      }
    };
    fetchActivities();
  }, [firebaseUser]);

  const addActivity = async (type: 'CP_TP' | 'ATP_JP' | 'MODUL_AJAR', subject: string, details: string, dataSnapshot: any) => {
    if (!user) return;
    const newActivity: ActivityLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      subject,
      details,
      dataSnapshot: JSON.parse(JSON.stringify(dataSnapshot)),
      paperSizeSnapshot: paperSize
    };
    
    try {
        await addDoc(collection(db, 'users', auth.currentUser?.uid || 'anonymous', 'activities'), {
            ...newActivity,
            timestamp: serverTimestamp()
        });
        setActivities(prev => [newActivity, ...prev]);
    } catch (e) {
        console.error("Failed to add activity to Firestore", e);
    }
  };
  
  const saveActivityLog = async (log: ActivityLog) => {
    if (!user) return;
    try {
        await addDoc(collection(db, 'users', auth.currentUser?.uid || 'anonymous', 'activities'), {
            ...log,
            timestamp: serverTimestamp()
        });
        setActivities(prev => [log, ...prev]);
    } catch (e) {
        console.error("Failed to save activity log to Firestore", e);
    }
  };

  const deleteActivity = async (id: string) => {
    if (!user) return;
    try {
        const q = query(collection(db, 'users', auth.currentUser?.uid || 'anonymous', 'activities'), where("id", "==", id));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
        });
        setActivities(prev => prev.filter(act => act.id !== id));
    } catch (e) {
        console.error("Failed to delete activity from Firestore", e);
    }
  };

  const clearAllActivities = async () => {
    if (!user) return;
    try {
        const q = query(collection(db, 'users', auth.currentUser?.uid || 'anonymous', 'activities'));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
        });
        setActivities([]);
    } catch (e) {
        console.error("Failed to clear activities from Firestore", e);
    }
  };

  const checkNonEffectiveDate = (dateStr: string): CalendarEvent | null => {
      if (!dateStr) return null;
      return calendarEvents.find(range => dateStr >= range.start && dateStr <= range.end) || null;
  };

  const getDayName = (date: Date): string => {
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      return days[date.getDay()];
  };

  const getEffectiveDates = (className: string): { date: Date, jp: number }[] => {
      const selectedDays = classSchedules[className] || [];
      const dailyJP = classDailyJP[className] || {};
      const dates: { date: Date, jp: number }[] = [];
      const academicStartStr = `${academicYearStart}-07-14`;
      const academicEndStr = `${academicYearStart + 1}-06-27`;
      const startDate = parseDateToLocal(academicStartStr); 
      const endDate = parseDateToLocal(academicEndStr); 

      const validDays = schoolDaysCount === 5 ? selectedDays.filter(d => d !== 'Sabtu') : selectedDays;

      let current = new Date(startDate);
      while (current <= endDate) {
          const dayName = getDayName(current);
          const dateStr = formatDateLocal(current);
          const conflict = checkNonEffectiveDate(dateStr);
          if (validDays.includes(dayName) && (!conflict)) {
              const jp = dailyJP[dayName] || 3;
              if (jp > 0) {
                dates.push({ date: new Date(current), jp });
              }
          }
          current.setDate(current.getDate() + 1);
      }
      return dates;
  };

  const updateDailyJP = (className: string, day: string, jp: number) => {
    setClassDailyJP(prev => ({
        ...prev,
        [className]: {
            ...(prev[className] || {}),
            [day]: jp
        }
    }));
  };

  const toggleScheduleDay = (className: string, day: string) => {
      const isRemoving = (classSchedules[className] || []).includes(day);
      
      setClassSchedules(prev => {
          const currentDays = prev[className] || [];
          if (isRemoving) {
              return { ...prev, [className]: currentDays.filter(d => d !== day) };
          } else {
              const newDays = [...currentDays, day].sort((a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b));
              return { ...prev, [className]: newDays };
          }
      });

      if (!isRemoving && !(classDailyJP[className]?.[day])) {
          setClassDailyJP(prev => ({
              ...prev,
              [className]: {
                  ...(prev[className] || {}),
                  [day]: 3 
              }
          }));
      }
  };

  const getISOWeek = (d: Date) => {
      const date = new Date(d.getTime());
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
      const week1 = new Date(date.getFullYear(), 0, 4);
      return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  const calculateCalendarAnalysis = (className: string, subject: string): AnalysisResult | null => {
        const rawSelectedDays = classSchedules[className] || [];
        const selectedDays = schoolDaysCount === 5 ? rawSelectedDays.filter(d => d !== 'Sabtu') : rawSelectedDays;
        
        if (selectedDays.length === 0) return null;

        const subjectKey = getSubjectKey(subject);
        const annualTargetJP = subjectKey ? JP_STANDARDS[subjectKey]?.[className] || 0 : 0;
        
        const academicStartStr = `${academicYearStart}-07-14`;
        const academicEndStr = `${academicYearStart + 1}-06-27`;
        const startDate = parseDateToLocal(academicStartStr);
        const endDate = parseDateToLocal(academicEndStr);
        
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
            
            // Fixed Semester Logic: July-Dec is Semester 1, Jan-June is Semester 2
            const semester = (current.getMonth() >= 6 && current.getFullYear() === academicYearStart) ? 1 : 2;
            
            const weekKey = `${getISOWeek(current)}-${current.getFullYear()}`; 

            if (!monthDetails[monthKey]) {
                monthDetails[monthKey] = { monthName: monthKey, semester, effectiveDays: 0, nonEffectiveDetails: [] };
            }

            // FILTER: If 5 days, force Saturday as non-effective
            const isSabtu = dayName === 'Sabtu';
            const isSabtuNonEffective = schoolDaysCount === 5 && isSabtu;

            if (selectedDays.includes(dayName)) {
                 const conflict = checkNonEffectiveDate(dateStr) || (isSabtuNonEffective ? { description: 'Libur Sabtu', type: 'holiday' } : null);
                 if (!conflict) {
                     const dailyJPVal = (classDailyJP[className] || {})[dayName] || 3;
                     totalAvailableSlots++;
                     monthDetails[monthKey].effectiveDays++;
                     dayDistribution[dayName] = (dayDistribution[dayName] || 0) + 1;

                     if (semester === 1) {
                         semester1Data.effectiveDays++;
                         semester1Data.uniqueWeeks.add(weekKey);
                         semester1Data.availableJP += dailyJPVal;
                     } else {
                         semester2Data.effectiveDays++;
                         semester2Data.uniqueWeeks.add(weekKey);
                         semester2Data.availableJP += dailyJPVal;
                     }
                 } else {
                     monthDetails[monthKey].nonEffectiveDetails.push({ date: dateStr, reason: conflict.description });
                     if (semester === 1) semester1Data.nonEffectiveDays++;
                     else semester2Data.nonEffectiveDays++;
                 }
            } else if (isSabtuNonEffective) {
                 // Even if not in selectedDays, we count Sabtu as a non-effective day for data fidelity
                 monthDetails[monthKey].nonEffectiveDetails.push({ date: dateStr, reason: 'Libur Sabtu' });
                 if (semester === 1) semester1Data.nonEffectiveDays++;
                 else semester2Data.nonEffectiveDays++;
            }
            current.setDate(current.getDate() + 1);
        }

        // Calculate Weekly Target based on effective weeks
        const totalEffectiveWeeks = semester1Data.uniqueWeeks.size + semester2Data.uniqueWeeks.size;
        const weeklyTargetJP = totalEffectiveWeeks > 0 ? Math.round(annualTargetJP / totalEffectiveWeeks) : 0;
        
        semester1Data.effectiveWeeks = semester1Data.uniqueWeeks.size;
        semester2Data.effectiveWeeks = semester2Data.uniqueWeeks.size;

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
      if (!apiKey) throw new Error("API Key Gemini tidak ditemukan. Pastikan Anda telah mengatur VITE_GEMINI_API_KEY di environment variables.");
      const ai = new GoogleGenAI({ apiKey });

      const schema = {
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
                      className: { 
                        type: Type.STRING,
                        description: `Nama kelas, HARUS persis salah satu dari: ${selectedFase.classes.join(" atau ")}`
                      },
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
        Tugas: Analisis Capaian Pembelajaran (CP) dan rumuskan Tujuan Pembelajaran (TP).
        Parameter: Jenjang SD, Fase ${selectedFase.name}, Mapel ${selectedSubject}, Kelas ${selectedFase.classes.join(" dan ")}.
        Instruksi: 
        1. Tuliskan deskripsi singkat mata pelajaran.
        2. Tuliskan Elemen dan CP terbaru. 
        3. Pecah CP menjadi Tujuan Pembelajaran (TP) pembelajaran yang spesifik, aplikatif, dan terukur untuk setiap kelas yang diminta (${selectedFase.classes.join(" dan ")}). Anda WAJIB memberikan minimal 2 Tujuan Pembelajaran (TP) untuk setiap kelas dalam array 'tujuanPembelajaran'. JANGAN PERNAH mengosongkan array 'tujuanPembelajaran'.
        4. Pastikan output sesuai dengan skema JSON yang diminta, dengan array 'elements' yang berisi 'allocations' untuk setiap kelas.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: schema }
      });

      let resultData: CurriculumData;
      try {
        let cleanText = response.text || "{}";
        cleanText = cleanText.replace(/```json/gi, '').replace(/```/g, '').trim();
        resultData = JSON.parse(cleanText) as CurriculumData;
        if (!resultData || !resultData.elements || resultData.elements.length === 0) {
            throw new Error("Data kosong");
        }
      } catch (e) {
        throw new Error("Gagal parsing respon JSON dari AI atau data kosong. Silakan coba lagi.");
      }
      
      setData(resultData);
      addActivity('CP_TP', selectedSubject, `Analisis CP & TP untuk ${selectedFase.name}`, resultData);

    } catch (err: any) {
      console.error(err);
      setError(formatAIError(err));
    } finally {
      setLoading(false);
    }
  };

  const generateATP = async (className: string) => {
    if (!data) {
        console.error("Data CP/TP belum tersedia.");
        return;
    }
    console.log(`Memulai generateATP untuk ${className}...`);
    setAtpLoading(className);
    setError(null);
    
    // 1. SMART JP CALCULATION
    let targetJP = 216; 
    const subjectKey = getSubjectKey(selectedSubject) || getSubjectKey(data.subject);
    if (subjectKey) {
        targetJP = JP_STANDARDS[subjectKey]?.[className] || 216;
    }
    console.log(`Target JP untuk ${className}: ${targetJP}`);

    let selectedDays = classSchedules[className] || [];
    const effectiveWeeks = className.includes('6') ? 32 : 36;
    const weeklyLoad = Math.ceil(targetJP / effectiveWeeks);
    const MAX_JP_PER_DAY = 3; 
    
    // Auto-select days if not enough
    const minDaysNeeded = Math.ceil(weeklyLoad / MAX_JP_PER_DAY);
    if (selectedDays.length < minDaysNeeded) {
        console.log(`Menambah hari jadwal otomatis karena kurang (butuh ${minDaysNeeded}, ada ${selectedDays.length})`);
        let candidateDays = ["Senin", "Rabu", "Jumat", "Selasa", "Kamis", "Sabtu"];
        if (schoolDaysCount === 5) {
            candidateDays = candidateDays.filter(d => d !== "Sabtu");
        }
        const needed = minDaysNeeded - selectedDays.length;
        const available = candidateDays.filter(d => !selectedDays.includes(d));
        selectedDays = [...selectedDays, ...available.slice(0, needed)];
        selectedDays.sort((a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b));
        setClassSchedules(prev => ({ ...prev, [className]: selectedDays }));
    }

    try {
        const apiKey = getApiKey();
        if (!apiKey) throw new Error("API Key Gemini tidak ditemukan. Pastikan Anda telah mengatur VITE_GEMINI_API_KEY di environment variables.");
        const ai = new GoogleGenAI({ apiKey });

        // 2. TIMELINE GENERATION based on Calendar
        const allEffectiveDates = getEffectiveDates(className);
        if (allEffectiveDates.length === 0) {
            throw new Error("Tidak ada hari efektif yang tersedia untuk jadwal yang dipilih. Silakan periksa kalender akademik atau pilih hari lain.");
        }
        
        const timelineSlots: { date: string, allocatedJP: number }[] = allEffectiveDates.map(slot => ({
            date: formatDateLocal(slot.date),
            allocatedJP: slot.jp
        }));
        
        const accumulatedJP = timelineSlots.reduce((sum, s) => sum + s.allocatedJP, 0);
        console.log(`Total JP tersedia pada timeline: ${accumulatedJP} JP`);
        
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
        
        (data.elements || []).forEach((el, elIdx) => {
            (el.allocations || []).forEach((alloc, allocIdx) => {
                // Flexible matching for class names
                const normalizedAllocClass = alloc.className.toLowerCase().replace(/\s+/g, '');
                const normalizedTargetClass = className.toLowerCase().replace(/\s+/g, '');
                const hasRomawi = (idx: string, text: string) => {
                   const r = ['i', 'ii', 'iii', 'iv', 'v', 'vi'];
                   const numMatch = text.match(/\d/);
                   if (numMatch) {
                       const num = parseInt(numMatch[0]);
                       return text.replace(num.toString(), r[num-1] || num.toString());
                   }
                   return text;
                };
                
                const classWithoutSpaces = className.toLowerCase().replace(/\s+/g, ''); // "kelas1"
                const allocWithoutSpaces = alloc.className.toLowerCase().replace(/\s+/g, '');

                if (
                    allocWithoutSpaces === classWithoutSpaces ||
                    allocWithoutSpaces.includes(classWithoutSpaces.replace('kelas', '')) ||
                    classWithoutSpaces.includes(allocWithoutSpaces.replace('kelas', '')) ||
                    alloc.className.toLowerCase().includes(className.toLowerCase().replace('kelas ', ''))
                ) {
                    (alloc.tujuanPembelajaran || []).forEach((tp, tpIdx) => {
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

        console.log(`Flat TPs found: ${flatTPs.length}`);

        if (flatTPs.length === 0) {
            const availableClasses = Array.from(new Set(
                (data.elements || []).flatMap(el => (el.allocations || []).map(a => a.className))
            )).join(', ');
            throw new Error(`Data Tujuan Pembelajaran (TP) untuk ${className} tidak ditemukan dalam hasil analisis CP & TP. Kelas yang tersedia dari hasil AI: ${availableClasses}. Pastikan langkah 1 (Genearte CP & TP) menghasilkan data untuk kelas ini.`);
        }

        const prompt = `
            PERAN: Ahli Kurikulum & Penjadwalan Sekolah Dasar (Kurikulum Merdeka 2025).
            TUGAS: Pecah Tujuan Pembelajaran (TP) menjadi aktivitas-aktivitas kecil (Alur Tujuan Pembelajaran/ATP).
            
            KONTEKS:
            - Mapel: ${data.subject} (${className})
            - Total Target JP: ${accumulatedJP} JP
            - Jumlah Slot Pertemuan: ${timelineSlots.length} (dengan variasi JP per pertemuan sesuai jadwal pengguna)
            
            DAFTAR TP (ID: TP):
            ${flatTPs.map(f => `${f.id}: ${f.tp}`).join('\n')}
            
            INSTRUKSI:
            1. Buat rangkaian aktivitas untuk SETIAP TP di atas.
            2. Satu TP bisa dipecah menjadi beberapa aktivitas (beberapa pertemuan) jika kompleks.
            3. Distribusikan TP ini ke dalam total ${accumulatedJP} JP yang tersedia. Pastikan total JP dari semua aktivitas diakumulasikan tepat ${accumulatedJP} JP.
               PENTING: Gunakan alokasi JP per-aktivitas yang wajar (misal: 1, 2, atau 3 JP). Hindari membuat satu aktivitas dengan JP yang sangat besar yang tidak mungkin selesai dalam satu hari (kapasitas harian ${classSchedules[className]?.map(d => `${d}: ${classDailyJP[className]?.[d] || 3} JP`).join(', ')}).
            4. Gunakan field 'alur' untuk deskripsi aktivitas pembelajaran yang konkret.
            5. Return JSON object dengan properti 'allocations' yang berisi array pemetaan tpId ke daftar aktivitas sesuai skema yang diberikan.
        `;

        const schema = {
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

        console.log("Memanggil AI untuk generate ATP...");
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { 
                responseMimeType: "application/json", 
                responseSchema: schema
            }
        });

        let result: { allocations: { tpId: number, activities: { alur: string, jp: number }[] }[] };
        try {
            let cleanText = response.text || "{}";
            cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();
            result = JSON.parse(cleanText);
            if (!result || !result.allocations) {
                throw new Error("Data kosong");
            }
            console.log(`AI berhasil generate ${result.allocations.length} alokasi TP.`);
        } catch (e: any) {
            console.error("JSON Parse Error:", e);
            throw new Error("Gagal parsing respon JSON dari AI: " + e.message);
        }

        // 4. MAP RESULT BACK TO DATA STRUCTURE
        const newData = JSON.parse(JSON.stringify(data));
        
        // Ensure structure exists
        flatTPs.forEach(f => {
             const el = newData.elements[f.elementIndex];
             const alloc = el.allocations[f.allocIndex];
             if (!alloc.structuredAtp) {
                 alloc.structuredAtp = new Array(alloc.tujuanPembelajaran.length).fill(null).map((_, i) => ({
                     tp: alloc.tujuanPembelajaran[i],
                     atpItems: []
                 }));
             }
        });

        let slotCursor = 0;
        let remainingJPInCurrentSlot = 0;

        // Iterate flatTPs to ensure every TP is handled
        flatTPs.forEach(f => {
            const aiAllocation = result.allocations?.find(a => a.tpId === f.id);
            const activities = aiAllocation?.activities || [];
            
            const processedItems: AtpItem[] = [];

            if (activities.length > 0) {
                 activities.forEach(act => {
                      let jpToAllocate = act.jp;
                      
                      while (jpToAllocate > 0 && slotCursor < timelineSlots.length) {
                          if (remainingJPInCurrentSlot <= 0) {
                              remainingJPInCurrentSlot = timelineSlots[slotCursor].allocatedJP;
                          }
                          
                          const date = timelineSlots[slotCursor].date;
                          const take = Math.min(jpToAllocate, remainingJPInCurrentSlot);
                          
                          processedItems.push({
                              alur: act.alur + (act.jp > take ? ` (Bag. ${act.jp - jpToAllocate + take}/${act.jp} JP)` : ''),
                              alokasiWaktu: `${take} JP`,
                              planDate: date
                          });
                          
                          jpToAllocate -= take;
                          remainingJPInCurrentSlot -= take;
                          
                          if (remainingJPInCurrentSlot <= 0) {
                              slotCursor++;
                              remainingJPInCurrentSlot = 0;
                          }
                      }
                 });
            } else {
                // Fallback for missing TPs
                let date = '';
                let jpVal = 2;
                if (remainingJPInCurrentSlot <= 0 && slotCursor < timelineSlots.length) {
                    remainingJPInCurrentSlot = timelineSlots[slotCursor].allocatedJP;
                }
                if (slotCursor < timelineSlots.length) {
                    date = timelineSlots[slotCursor].date;
                    jpVal = remainingJPInCurrentSlot;
                    slotCursor++;
                    remainingJPInCurrentSlot = 0;
                }
                processedItems.push({
                     alur: `Pembelajaran: ${f.tp}`,
                     alokasiWaktu: `${jpVal} JP`,
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
        addActivity('ATP_JP', newData.subject, `Penyusunan ATP & Jadwal Otomatis ${className}`, newData);

    } catch (err: any) {
        console.error(err);
        setError("Gagal membuat ATP: " + formatAIError(err));
    } finally {
        setAtpLoading(null);
    }
  };

  const handleBulkGenerateModulForClass = (className: string) => {
      setPendingSemesterSelection(className);
  };

  const runBulkGeneration = async (className: string, semChoice: '1' | '2') => {
      const rawItems: { el: any, tp: any, atpItem: any }[] = [];
      (data?.elements || []).forEach((el) => {
          (el.allocations || []).forEach((alloc) => {
              if (alloc.structuredAtp) {
                  alloc.structuredAtp.forEach((grp: any) => {
                       grp.atpItems.forEach((atpItem: any) => {
                           rawItems.push({ el, tp: grp.tp, atpItem });
                       });
                  });
              }
          });
      });

      const itemsToGenerateFinal = rawItems.filter(item => {
          const date = item.atpItem.planDate ? new Date(item.atpItem.planDate) : new Date();
          const month = date.getMonth() + 1;
          if (semChoice === '1') return month >= 7 && month <= 12;
          return month >= 1 && month <= 6;
      });

      const allDates = getEffectiveDates(className);
      const semDates = allDates.filter(d => {
          const month = d.date.getMonth() + 1;
          if (semChoice === '1') return month >= 7 && month <= 12;
          return month >= 1 && month <= 6;
      });

      if (semDates.length === 0) {
          alert(`Tidak ada hari efektif untuk Semester ${semChoice}.`);
          return;
      }

      setBulkGenerationStatus(prev => ({
          ...prev,
          [className]: { current: 0, total: semDates.length, percent: 0, active: true, statusText: "Memulai proses..." }
      }));

      // Ensure that cancellation flag is reset for this class
      (window as any).bulkAbortedMap = { ...((window as any).bulkAbortedMap || {}), [className]: false };
      const collectedModulesData: any[] = [];
      let collectedHtml = '';

      try {
          const apiKey = getApiKey();
          if (!apiKey) throw new Error("API Key Gemini tidak ditemukan. Pastikan Anda telah mengatur VITE_GEMINI_API_KEY di environment variables.");
          const ai = new GoogleGenAI({ apiKey });

          const maxModules = Math.min(itemsToGenerateFinal.length, semDates.length);
          for (let i = 0; i < maxModules; i++) {
              if ((window as any).bulkAbortedMap?.[className]) {
                  setBulkGenerationStatus(prev => ({...prev, [className]: {...prev[className], active: false, statusText: "Proses dibatalkan."}}));
                  return;
              }
              
              setBulkGenerationStatus(prev => ({
                  ...prev,
                  [className]: { ...prev[className], statusText: `Memproses modul ${i + 1} dari ${maxModules}...` }
              }));

              const { el, tp, atpItem } = itemsToGenerateFinal[i];
              const topic = atpItem.alur;
              const allocation = atpItem.alokasiWaktu;
              const date = atpItem.planDate || formatDateLocal(new Date());

              try {
                  const prompt = `
                      Bertindaklah sebagai Guru Profesional ahli Kurikulum Merdeka (Sesuai Permendikdasmen No. 13 Tahun 2025).
                      Buatlah MODUL AJAR lengkap dan komprehensif.
                      SANGAT PENTING: 
                      - Modul Ajar harus secara eksplisit mengintegrasikan 3 prinsip utama BSKAP 032 HKR 2025 yaitu Mindful Learning (Pembelajaran Berkesadaran Penuh), Joyful Learning (Pembelajaran Menyenangkan/Sukacita), dan Meaningful Learning (Pembelajaran Bermakna) pada setiap tahapan kegiatan.
                      - Gunakan pendekatan/model pembelajaran yang paling sesuai, bervariasi, dan direkomendasikan berdasarkan tingkat Kelas ${className} dan Fase ${data?.fase} (Misalnya: TaRL, CRT, PjBL, PBL, dll). Jangan hanya terpaku pada satu model.
                      
                      INFORMASI UMUM:
                      - Penyusun: ${userIdentity.authorName}
                      - Instansi: ${userIdentity.institutionName}
                      - Jenjang/Kelas: SD / ${className} (${data?.fase})
                      - Mapel: ${data?.subject}
                      - Alokasi Waktu: ${allocation}
                      - Tanggal: ${date}
                      - Topik/Materi: ${topic}
                      - Model/Pendekatan Pembelajaran: (Pilihkan satu yang paling tepat dan sebutkan)
                      
                      KOMPONEN INTI:
                      - Capaian Pembelajaran (CP): ${el.capaianPembelajaran}
                      - Tujuan Pembelajaran (TP): ${tp}
                      - Pemahaman Bermakna
                      - Pertanyaan Pemantik
                      - Kegiatan Pembelajaran (Pendahuluan, Inti, Penutup) terpadu dengan 3 prinsip di atas.
                      
                      LAMPIRAN (Sajikan dalam format tabel HTML modern jika memungkinkan):
                      - Materi Ajar (Ringkasan/Bahan Ajar)
                      - Lembar Kerja Peserta Didik (LKPD) - Buatkan instruksi detail.
                      - Instrumen Penilaian (Rubrik/Soal)
                      - Jurnal Mengajar/Sikap (Disajikan dalam bentuk tabel format pengisian).
                      
                      OUTPUT FORMAT:
                      Berikan output dalam format HTML (tanpa tag <html>/<body>, hanya konten div) yang siap di-render. Gunakan styling inline CSS minimalis untuk tabel (border-collapse, padding: 5px, border: 1px solid black, width: 100%).
                      Gunakan tag <h3> untuk judul bagian.
                  `;

                  let response;
                  let retries = 6;
                  let success = false;
                  let delayMs = 20000;
                  let isRateLimited = false;
                  
                  while (retries > 0 && !success) {
                      try {
                          response = await ai.models.generateContent({
                              model: 'gemini-3-flash-preview',
                              contents: prompt,
                          });
                          success = true;
                      } catch (e: any) {
                          const errorString = JSON.stringify(e) + (e?.message || String(e)) + (e?.error?.status || '');
                          const isRateLimit = errorString.includes('429') || errorString.toLowerCase().includes('quota') || errorString.toLowerCase().includes('rate limit') || errorString.includes('RESOURCE_EXHAUSTED');
                          if (isRateLimit && retries > 1) {
                              isRateLimited = true;
                              let waitTime = Math.max(delayMs, 60000);
                              console.warn(`Rate limit hit. Retrying in ${waitTime / 1000}s... (${retries - 1} retries left)`);
                              setBulkGenerationStatus(prev => ({
                                  ...prev,
                                  [className]: { ...prev[className], statusText: `Mencegah limit server. Jeda pendinginan ${waitTime / 1000} detik... (${retries - 1} percobaan tersisa)` }
                              }));
                              await new Promise(res => setTimeout(res, waitTime));
                              delayMs = waitTime + 15000;
                              retries--;
                          } else {
                              throw e;
                          }
                      }
                  }

                  if (!success) {
                       throw new Error(`Gagal memproses setelah percobaan berulang: ${topic}`);
                  }

                  const html = response?.text || "<p>Gagal membuat konten.</p>";

                  collectedHtml += html + `<br><br><div style="page-break-after: always; clear: both;"></div><br><br>`;
                  collectedModulesData.push({ topic, html });

                  setBulkGenerationStatus(prev => ({
                      ...prev,
                      [className]: { 
                          current: i + 1, 
                          total: itemsToGenerateFinal.length, 
                          percent: Math.round(((i + 1) / itemsToGenerateFinal.length) * 100), 
                          active: true,
                          statusText: `Modul ${i + 1} selesai. Menjeda untuk modul berikutnya...`
                      }
                  }));
                  
                  const nextDelay = isRateLimited ? 60000 : 20000;
                  if (i < itemsToGenerateFinal.length - 1) {
                       setBulkGenerationStatus(prev => ({
                           ...prev,
                           [className]: { ...prev[className], statusText: `Modul selesai. Menyiapkan modul berikutnya dalam ${nextDelay/1000} detik...` }
                       }));
                       await new Promise(res => setTimeout(res, nextDelay));
                  }
              } catch (err: any) {
                  console.error(`Error generating module ${i+1}: ${err}`);
              }
          }

          saveActivityLog({
              id: Date.now().toString() + Math.random().toString(36).substring(7),
              timestamp: new Date(),
              type: 'MODUL_AJAR',
              subject: data?.subject || '',
              details: `Kumpulan Modul Ajar: ${className} (Semester ${semChoice})`,
              dataSnapshot: {
                  className: className,
                  semester: semChoice,
                  isBulk: true,
                  combinedHtml: collectedHtml,
                  modulesList: collectedModulesData,
                  components: {
                      includeLKPD: true,
                      includeMaterials: true,
                      includeAssessment: true,
                      generateImage: false,
                  }
              },
              paperSizeSnapshot: 'A4'
          });

          alert('Berhasil membuat semua Modul Ajar untuk kelas ' + className + '. Silakan cek tab History.');
      } catch (err: any) {
          alert('Proses terhenti: ' + formatAIError(err) + '\n\nModul yang sudah berhasil dibuat dapat diunduh melalui tombol Unduh Semua Modul (Docx). Anda dapat mencobanya kembali nanti untuk menyelesaikan sisanya.');
      } finally {
          setBulkGenerationStatus(prev => ({
              ...prev,
              [className]: { ...prev[className], percent: 100, active: false, statusText: "" }
          }));
      }
  };

  const handleDownloadAllModulForClass = (className: string, semester: '1' | '2') => {
      const classModules = activities.filter(a => 
          a.type === 'MODUL_AJAR' && 
          (a.dataSnapshot?.className === className || a.details.includes(className)) &&
          (a.dataSnapshot?.semester || '1') === semester
      );

      if (classModules.length === 0) {
          alert(`Belum ada Modul Ajar Semester ${semester} yang di-generate untuk kelas ini dalam riwayat aktivitas.`);
          return;
      }

      // Check if there's a bulk activity
      const bulkActivity = classModules.find(a => a.dataSnapshot?.isBulk);
      let combinedHtml = '';
      const size = PAPER_SIZES['A4'];

      if (bulkActivity) {
          combinedHtml = bulkActivity.dataSnapshot.combinedHtml;
      } else {
          // Re-sort them ascending by index/time (oldest to newest generated)
          const chronologicalModules = [...classModules].reverse();
          const footerText = `Kumpulan Modul Ajar - ${data?.subject || ''} - ${className} | Disusun oleh: ${userIdentity.authorName}`;

          chronologicalModules.forEach((modActivity, index) => {
              const modData = modActivity.dataSnapshot;
              const html = modData.resultContent || modData.content || '<p>Tidak ada konten</p>';
              combinedHtml += html;
              if (index < chronologicalModules.length - 1) {
                  combinedHtml += `<br><br><div style="page-break-after: always; clear: both;"></div><br><br>`;
              }
          });
      }

      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Kumpulan Modul Ajar ${className}</title>
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
              <h2 style="margin: 0;">KUMPULAN MODUL AJAR KURIKULUM MERDEKA</h2>
              <h3 style="margin: 5pt 0;">${userIdentity.institutionName.toUpperCase()}</h3>
              <p style="margin: 0;">Mata Pelajaran: <b>${data?.subject || '-'}</b></p>
              <p style="margin: 0;">Kelas: <b>${className}</b></p>
          </div>
          <hr/><br/>
          ${combinedHtml}
          <div style='mso-element:footer' id='f1'><div class='f1'>${footerText} - Halaman <span style='mso-field-code:" PAGE "'></span></div></div>
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff', htmlContent], {
          type: 'application/msword'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Semua_Modul_Ajar_${(data?.subject || 'Mapel').replace(/\s+/g, '_')}_${className.replace(/\s+/g, '_')}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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

  const handleDownloadProta = (className: string) => {
      if (!data) return;
      
      const calAnalysis = calculateCalendarAnalysis(className, data.subject);
      const savedAuthor = localStorage.getItem('prota_author_name') || 'Guru Kelas';
      const savedInst = localStorage.getItem('prota_institution_name') || 'Sekolah Dasar';
      
      let tableRows = '';
      let no = 1;
      
      (data.elements || []).forEach((el) => {
          const alloc = (el.allocations || []).find(a => {
              const normalizedAllocClass = a.className.toLowerCase().replace(/\s+/g, '');
              const normalizedTargetClass = className.toLowerCase().replace(/\s+/g, '');
              return normalizedAllocClass === normalizedTargetClass;
          });
          if (!alloc || !alloc.structuredAtp) return;
          
          const groups = alloc.structuredAtp;
          const totalItemsInElement = groups.reduce((acc, g) => acc + Math.max((g.atpItems || []).length, 1), 0);
          
          let elementFirstRow = true;

          groups.forEach((grp) => {
              const items = (grp.atpItems || []).length > 0 ? grp.atpItems : [{ alur: '', alokasiWaktu: '-' }];
              let grpFirstRow = true;

              items.forEach((item) => {
                  let semester = 'Ganjil / Genap';
                  if (item.planDate) {
                      const d = new Date(item.planDate);
                      const m = d.getMonth();
                      const y = d.getFullYear();
                      semester = (m >= 6 && y === academicYearStart) ? 'Ganjil (Sems 1)' : 'Genap (Sems 2)';
                  }
                  
                  tableRows += `<tr>`;
                  if (elementFirstRow) {
                      tableRows += `<td rowspan="${totalItemsInElement}" style="text-align: center; vertical-align: top;">${no++}</td>`;
                      tableRows += `<td rowspan="${totalItemsInElement}" style="vertical-align: top;"><b>${el.elementName}</b><br/><font size="2">${el.capaianPembelajaran}</font></td>`;
                      elementFirstRow = false;
                  }
                  if (grpFirstRow) {
                      tableRows += `<td rowspan="${items.length}" style="vertical-align: top;">${grp.tp}</td>`;
                      grpFirstRow = false;
                  }
                  tableRows += `<td style="vertical-align: top;">${item.alur || '<i style="color: #999;">Belum digenerate</i>'}</td>`;
                  tableRows += `<td style="text-align: center; vertical-align: top;">${item.alokasiWaktu || '-'}</td>`;
                  tableRows += `<td style="text-align: center; vertical-align: top;">${item.planDate || '-'}</td>`;
                  tableRows += `<td style="text-align: center; vertical-align: top;">${semester}</td>`;
                  tableRows += `</tr>`;
              });
          });
      });

      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Program Tahunan (PROTA)</title>
          <style>
            @page { size: landscape; margin: 1cm; }
            body { font-family: 'Arial', sans-serif; font-size: 10pt; line-height: 1.2; }
            table { border-collapse: collapse; width: 100%; margin-top: 10px; }
            td, th { border: 1px solid #000; padding: 5px; vertical-align: top; }
            th { background-color: #f2f2f2; text-align: center; font-weight: bold; }
            .header { text-align: center; margin-bottom: 15px; }
            .identity { margin-bottom: 15px; }
            .identity table { width: auto; border: none; margin-top: 0; }
            .identity td { border: none; padding: 1px 10px 1px 0; }
          </style>
        </head>
        <body>
          <div class="header">
              <h2 style="margin: 0;">PROGRAM TAHUNAN (PROTA)</h2>
              <h3 style="margin: 5px 0;">KURIKULUM MERDEKA</h3>
          </div>
          
          <div class="identity">
              <table>
                  <tr><td>Mata Pelajaran</td><td>: ${data.subject}</td></tr>
                  <tr><td>Instansi</td><td>: ${userIdentity.institutionName || '-'}</td></tr>
                  <tr><td>Kelas/Fase</td><td>: ${className} / ${data.fase}</td></tr>
                  <tr><td>Tahun Pelajaran</td><td>: ${userIdentity.academicYear || '-'}</td></tr>
                  <tr><td>Penyusun</td><td>: ${userIdentity.authorName || '-'}</td></tr>
              </table>
          </div>

          <div style="margin-bottom: 20px;">
              <h4 style="margin-bottom: 5px;">A. ALOKASI WAKTU SEMESTER</h4>
              <table style="width: 100%; border: 1px solid black; border-collapse: collapse;">
                  <thead style="background-color: #f2f2f2;">
                      <tr>
                          <th>Semester</th>
                          <th>Jadwal</th>
                          <th>Jml HBE</th>
                          <th>Jam Pel (JP)</th>
                          <th>Total JP</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr>
                          <td style="text-align: center;">Semester 1 (Ganjil)</td>
                          <td style="text-align: center;">${(classSchedules[className] || []).join(', ')}</td>
                          <td style="text-align: center;">${calAnalysis?.semester1.effectiveDays || 0}</td>
                          <td style="text-align: center;">${(classSchedules[className] || []).map(day => (classDailyJP[className] || {})[day] || 3).join('/')}</td>
                          <td style="text-align: center;">${calAnalysis?.semester1.availableJP || 0}</td>
                      </tr>
                      <tr>
                          <td style="text-align: center;">Semester 2 (Genap)</td>
                          <td style="text-align: center;">${(classSchedules[className] || []).join(', ')}</td>
                          <td style="text-align: center;">${calAnalysis?.semester2.effectiveDays || 0}</td>
                          <td style="text-align: center;">${(classSchedules[className] || []).map(day => (classDailyJP[className] || {})[day] || 3).join('/')}</td>
                          <td style="text-align: center;">${calAnalysis?.semester2.availableJP || 0}</td>
                      </tr>
                      <tr style="background-color: #f9f9f9; font-weight: bold;">
                          <td colspan="4" style="text-align: right; padding-right: 10px;">TOTAL JP SETAHUN</td>
                          <td style="text-align: center;">${(calAnalysis?.semester1.availableJP || 0) + (calAnalysis?.semester2.availableJP || 0)}</td>
                      </tr>
                  </tbody>
              </table>
          </div>

          <h4 style="margin-bottom: 5px;">B. PROGRAM TAHUNAN</h4>
          <table>
              <thead>
                  <tr>
                      <th width="3%">No</th>
                      <th width="17%">Elemen & CP</th>
                      <th width="20%">Tujuan Pembelajaran (TP)</th>
                      <th width="30%">Alur Tujuan Pembelajaran (ATP)</th>
                      <th width="7%">JP</th>
                      <th width="13%">Rencana Tanggal</th>
                      <th width="10%">Semester</th>
                  </tr>
              </thead>
              <tbody>
                  ${tableRows}
              </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob(['\\ufeff', htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PROTA_${data.subject}_${className}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- Render ---

  if (appStage === 'login' || appStage === 'register') {
    const isLogin = appStage === 'login';
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" style={{ animationDelay: '2s' }}></div>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 relative z-10"
            >
                <div className="flex justify-center mb-6">
                    <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30">
                        <BookOpen className="w-8 h-8 text-white" />
                    </div>
                </div>
                
                <h2 className="font-display text-3xl font-extrabold text-center text-slate-800 mb-2">
                    {isLogin ? 'Selamat Datang' : 'Buat Akun'}
                </h2>
                <p className="text-center text-slate-500 mb-8">
                    {isLogin ? 'Masuk untuk melanjutkan ke platform' : 'Daftar untuk menyimpan perangkat ajar Anda'}
                </p>

                <form 
                    onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.currentTarget as HTMLFormElement;
                        
                        try {
                            await signInAnonymously(auth);
                        } catch (err) {
                            console.error("Failed to sign in anonymously. Firestore saving might not work.", err);
                        }

                        const formData = new FormData(form);
                        const email = formData.get('email') as string;
                        const name = formData.get('name') as string || email.split('@')[0];
                        
                        const userData = { name, email };
                        localStorage.setItem('prota_user', JSON.stringify(userData));
                        setUser(userData);
                        setAppStage('tutorial');
                    }}
                    className="space-y-5"
                >
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                            <input 
                                type="text" 
                                name="name"
                                required 
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50"
                                placeholder="Masukkan nama Anda"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                        <input 
                            type="email" 
                            name="email"
                            required 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50"
                            placeholder="nama@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Kata Sandi</label>
                        <input 
                            type="password" 
                            required 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50"
                            placeholder="••••••••"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5"
                    >
                        {isLogin ? 'Masuk' : 'Daftar Sekarang'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-slate-600">
                        {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
                        <button 
                            onClick={() => setAppStage(isLogin ? 'register' : 'login')}
                            className="ml-2 text-blue-600 font-bold hover:text-blue-800 transition-colors"
                        >
                            {isLogin ? 'Daftar di sini' : 'Masuk'}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
  }

  if (appStage === 'tutorial') {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 relative overflow-hidden flex flex-col font-sans">
            {/* Aurora Glassmorphism Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-50">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-300 mix-blend-multiply opacity-30 blur-[100px] animate-blob"></div>
                <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] rounded-full bg-indigo-300 mix-blend-multiply opacity-30 blur-[100px] animate-blob" style={{ animationDelay: '2s' }}></div>
                <div className="absolute -bottom-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-purple-300 mix-blend-multiply opacity-30 blur-[100px] animate-blob" style={{ animationDelay: '4s' }}></div>
            </div>
            
            <div className="max-w-6xl mx-auto px-4 py-20 flex-1 w-full z-10 relative">
                <button onClick={() => setAppStage('identity')} className="absolute top-8 left-4 flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-colors bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/50 shadow-sm">
                    <ArrowLeft className="w-4 h-4" /> Lewati Tutorial
                </button>
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white/40 shadow-sm mb-6 text-sm font-medium text-blue-800">
                        <Sparkles className="w-4 h-4 text-blue-600" /> Versi Beta - Terus Berkembang
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight text-slate-900 drop-shadow-sm">
                        Halo, Rekan Pendidik! <br/><span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Selamat Datang.</span>
                    </h1>
                    <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto text-slate-700 leading-relaxed font-medium">
                        Mari kenali sejenak bagaimana teman digital ini bekerja untuk membantu Anda merancang pembelajaran yang lebih cepat, bermakna, dan rapi sebelum kita mulai menyusun perangkat ajar.
                    </p>
                </motion.div>

                {/* Bento Grid Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
                    {/* Fungsi */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 group hover:bg-white/80 transition-all duration-300 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -z-10 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:-translate-y-1 transition-transform border border-blue-100/50">
                            <Settings className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-slate-800 tracking-tight">Peran Asisten AI</h3>
                        <p className="text-slate-600 leading-relaxed font-medium">
                            Aplikasi ini dirancang sebagai asisten pribadi Anda. Dari memahami Capaian Pembelajaran (CP) hingga menyusun ATP, Modul Ajar, dan PROTA, semuanya kami rancang agar tugas administratif Anda menjadi jauh lebih ringan.
                        </p>
                    </motion.div>

                    {/* Regulasi */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 group hover:bg-white/80 transition-all duration-300 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -z-10 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:-translate-y-1 transition-transform border border-emerald-100/50">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-slate-800 tracking-tight">Kesesuaian Regulasi</h3>
                        <p className="text-slate-600 leading-relaxed font-medium">
                            Pikiran tenang, karena semua yang dihasilkan di sini sudah sejalan dengan denyut nadi kurikulum terbaru: panduan <strong>BSKAP 046/H/KR/2025</strong>. Strukturnya valid, alokasi waktunya pas, dan siap mendampingi Anda di kelas.
                        </p>
                    </motion.div>

                    {/* Metode Pendekatan */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 group hover:bg-white/80 transition-all duration-300 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -z-10 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:-translate-y-1 transition-transform border border-purple-100/50">
                            <Brain className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-slate-800 tracking-tight">Metode Pendekatan</h3>
                        <p className="text-slate-600 leading-relaxed font-medium">
                            Saat mengurai materi (TP menjadi ATP), asisten AI kami menggunakan kerangka berpikir <strong>Taksonomi Bloom revisi Anderson & Krathwohl</strong>, memastikan aktivitas yang tersusun memiliki gradasi kognitif yang tepat untuk anak didik kita.
                        </p>
                    </motion.div>
                </div>

                {/* Cara Menggunakan - Modern Timeline */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="bg-white/80 backdrop-blur-2xl rounded-[3rem] p-8 md:p-16 shadow-[0_20px_50px_rgb(0,0,0,0.05)] mb-24 border border-white relative overflow-hidden"
                >
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-12 text-center text-slate-900 tracking-tight">Langkah Mudah Memulai</h2>
                    
                    <div className="space-y-12 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-blue-200 before:via-indigo-200 before:to-transparent">
                        
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            <div className="flex items-center justify-center w-12 h-12 rounded-2xl border-[3px] border-white bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-xl transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">1</div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-3xl bg-white shadow-sm border border-slate-100 group-hover:shadow-[0_8px_30px_rgb(59,130,246,0.1)] group-hover:-translate-y-1 transition-all duration-300">
                                <h4 className="font-extrabold text-xl text-slate-800 mb-2">Beritahu Kelas Anda</h4>
                                <p className="text-slate-500 font-medium leading-relaxed">Cukup beri tahu kami mata pelajaran dan kelas apa yang Anda ampu. Kami akan langsung mencari dan menyiapkan dokumen Capaian Pembelajaran (CP) terbarunya.</p>
                            </div>
                        </div>

                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            <div className="flex items-center justify-center w-12 h-12 rounded-2xl border-[3px] border-white bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-xl transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">2</div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-3xl bg-white shadow-sm border border-slate-100 group-hover:shadow-[0_8px_30px_rgb(99,102,241,0.1)] group-hover:-translate-y-1 transition-all duration-300">
                                <h4 className="font-extrabold text-xl text-slate-800 mb-2">Biar AI Meracik TP</h4>
                                <p className="text-slate-500 font-medium leading-relaxed">Klik tombol ajaib "Generate CP & TP". Asisten AI kami akan membaca CP tersebut dan meraciknya menjadi Tujuan Pembelajaran (TP) yang jelas dan terukur.</p>
                            </div>
                        </div>

                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            <div className="flex items-center justify-center w-12 h-12 rounded-2xl border-[3px] border-white bg-gradient-to-br from-purple-500 to-purple-600 text-white font-bold shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-xl transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">3</div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-3xl bg-white shadow-sm border border-slate-100 group-hover:shadow-[0_8px_30px_rgb(168,85,247,0.1)] group-hover:-translate-y-1 transition-all duration-300">
                                <h4 className="font-extrabold text-xl text-slate-800 mb-2">Tentukan Jadwal & ATP</h4>
                                <p className="text-slate-500 font-medium leading-relaxed">Kapan jadwal mengajar Anda? Beri tahu sistem, dan klik "Susun ATP Otomatis". TP tadi akan langsung dirangkai menjadi draf jadwal mengajar harian yang rapi.</p>
                            </div>
                        </div>

                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            <div className="flex items-center justify-center w-12 h-12 rounded-2xl border-[3px] border-white bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-xl transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">4</div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-3xl bg-white shadow-sm border border-slate-100 group-hover:shadow-[0_8px_30px_rgb(16,185,129,0.1)] group-hover:-translate-y-1 transition-all duration-300">
                                <h4 className="font-extrabold text-xl text-slate-800 mb-2">Simpan Modul & PROTA</h4>
                                <p className="text-slate-500 font-medium leading-relaxed">Satu klik lagi di bagian tabel ATP, Modul Ajar pun jadi! Anda juga bisa langsung mengunduh Program Tahunan (PROTA) dalam format Word yang siap dicetak.</p>
                            </div>
                        </div>

                    </div>
                </motion.div>

                {/* Kelebihan dan Kekurangan - Glassmorphic Cards */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24"
                >
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 border border-green-100 shadow-[0_8px_30px_rgb(34,197,94,0.06)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-green-50 rounded-full mix-blend-multiply blur-3xl opacity-60 -z-10 group-hover:scale-125 transition-transform duration-700"></div>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-green-100 rounded-2xl text-green-600"><ThumbsUp className="w-8 h-8" /></div>
                            <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">Kelebihan</h3>
                        </div>
                        <ul className="space-y-5 text-slate-600 font-medium">
                            <li className="flex items-start gap-3"><div className="mt-1.5 w-2 h-2 rounded-full bg-green-500 shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div> Seperti asisten pribadi yang bekerja amat cepat, menyusun semuanya dari nol.</li>
                            <li className="flex items-start gap-3"><div className="mt-1.5 w-2 h-2 rounded-full bg-green-500 shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div> Pintar! Ia paham hari libur karena terhubung langsung dengan kalender akademik.</li>
                            <li className="flex items-start gap-3"><div className="mt-1.5 w-2 h-2 rounded-full bg-green-500 shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div> Output sangat terstruktur, rapi, dan siap unduh.</li>
                            <li className="flex items-start gap-3"><div className="mt-1.5 w-2 h-2 rounded-full bg-green-500 shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div> Antarmuka yang kami usahakan sehangat dan semudah mungkin untuk digunakan.</li>
                        </ul>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 border border-orange-100 shadow-[0_8px_30px_rgb(249,115,22,0.06)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-50 rounded-full mix-blend-multiply blur-3xl opacity-60 -z-10 group-hover:scale-125 transition-transform duration-700"></div>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-orange-100 rounded-2xl text-orange-500"><Info className="w-8 h-8" /></div>
                            <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">Catatan & Limitasi</h3>
                        </div>
                        <ul className="space-y-5 text-slate-600 font-medium">
                            <li className="flex items-start gap-3"><div className="mt-1.5 w-2 h-2 rounded-full bg-orange-500 shrink-0 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div> Sangat membutuhkan koneksi internet yang ramah dan stabil.</li>
                            <li className="flex items-start gap-3"><div className="mt-1.5 w-2 h-2 rounded-full bg-orange-500 shrink-0 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div> Versi ini masih dihidupi oleh <strong>API AI versi gratis</strong>, sehingga mungkin sesekali ada batasan kuota jika sedang padat pengunjung.</li>
                            <li className="flex items-start gap-3"><div className="mt-1.5 w-2 h-2 rounded-full bg-orange-500 shrink-0 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div> Belum sepenuhnya menyediakan mata pelajaran spesifik Muatan Lokal Daerah tertentu (masih terus kami kembangkan!).</li>
                            <li className="flex items-start gap-3 font-semibold italic text-orange-700"><div className="mt-1.5 w-2 h-2 rounded-full bg-orange-600 shrink-0"></div> Versi ini belumlah sempurna, namun kami berjanji akan terus bertumbuh untuk menjadi lebih baik.</li>
                        </ul>
                    </div>
                </motion.div>

                {/* Call to Action */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    className="text-center mb-10"
                >
                    <button 
                        onClick={() => setAppStage('identity')}
                        className="group relative inline-flex items-center justify-center px-10 py-5 font-bold text-white transition-all duration-300 bg-slate-900 rounded-[2rem] hover:bg-slate-800 hover:shadow-[0_20px_40px_rgba(15,23,42,0.2)] hover:-translate-y-1 overflow-hidden"
                    >
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="relative flex items-center text-lg">
                            Mulai Buat Perangkat Ajar Sekarang
                            <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1.5 transition-transform duration-300" />
                        </span>
                    </button>
                    <p className="mt-6 text-sm font-medium text-slate-500">GRATIS • Tanpa Biaya Langganan</p>
                </motion.div>
            </div>

            {/* Modern Footer / Donation */}
            <div className="bg-white border-t border-slate-200 py-16 relative overflow-hidden mt-auto z-10 w-full">
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-100 via-transparent to-transparent"></div>
                <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 mb-8 px-6 py-2 rounded-full bg-slate-50 border border-slate-200">
                        <Coffee className="w-5 h-5 text-amber-600" />
                        <span className="font-bold text-slate-700 tracking-tight">Support The Developer</span>
                    </div>
                    
                    <h4 className="text-2xl font-extrabold text-slate-800 mb-8 tracking-tight">Dukung Pengembangan Aplikasi Ini</h4>
                    
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                        <div className="flex items-center gap-3 bg-white px-8 py-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group hover:-translate-y-1 duration-300">
                            <span className="text-2xl group-hover:scale-110 group-hover:rotate-6 transition-transform">☕</span>
                            <span className="text-slate-500 font-medium text-left">Traktir Kopi<br/><strong className="text-slate-800 text-lg">@Miftahsidik99</strong></span>
                        </div>
                        <div className="flex items-center gap-3 bg-white px-8 py-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group hover:-translate-y-1 duration-300">
                            <span className="text-2xl group-hover:scale-110 group-hover:-rotate-6 transition-transform">💳</span>
                            <span className="text-slate-500 font-medium text-left">Rekening Dana<br/><strong className="text-slate-800 text-lg">082312194681</strong></span>
                        </div>
                        <div className="flex items-center gap-3 bg-white px-8 py-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group hover:-translate-y-1 duration-300">
                            <span className="text-2xl group-hover:scale-110 transition-transform">✉️</span>
                            <span className="text-slate-500 font-medium text-left">Saran & Kerjasama<br/><strong className="text-slate-800 text-lg">Miftahsidik695@gmail.com</strong></span>
                        </div>
                    </div>
                    <div className="mt-16 text-sm font-bold text-slate-400">
                        &copy; {new Date().getFullYear()} Miftah Sidik. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
  }

  if (appStage === 'identity') {
      return (
          <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
             <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-50">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-300 mix-blend-multiply opacity-30 blur-[100px] animate-blob"></div>
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-300 mix-blend-multiply opacity-30 blur-[100px] animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-purple-300 mix-blend-multiply opacity-30 blur-[100px] animate-blob animation-delay-4000"></div>
             </div>

             <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] shadow-xl border border-white/50 w-full max-w-lg z-10"
             >
                 <div className="text-center mb-8">
                     <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-blue-100 to-indigo-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-white">
                         <User className="w-8 h-8" />
                     </div>
                     <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Identitas Penyusun</h2>
                     <p className="text-slate-500 mt-2 text-sm">Lengkapi data diri untuk disematkan otomatis pada seluruh dokumen perangkat ajar Anda.</p>
                 </div>
                 
                 <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Penyusun</label>
                        <input 
                            type="text" 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                            placeholder="Contoh: Budi Santoso, S.Pd."
                            value={userIdentity.authorName}
                            onChange={(e) => setUserIdentity(prev => ({...prev, authorName: e.target.value}))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Instansi / Sekolah</label>
                        <input 
                            type="text" 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                            placeholder="Contoh: SD Negeri 1 Merdeka"
                            value={userIdentity.institutionName}
                            onChange={(e) => setUserIdentity(prev => ({...prev, institutionName: e.target.value}))}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Tahun Pelajaran</label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                                placeholder="Contoh: 2025/2026"
                                value={userIdentity.academicYear}
                                onChange={(e) => setUserIdentity(prev => ({...prev, academicYear: e.target.value}))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Semester</label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                                placeholder="Contoh: Ganjil / Genap"
                                value={userIdentity.semester}
                                onChange={(e) => setUserIdentity(prev => ({...prev, semester: e.target.value}))}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">API Key Gemini Opsional <span className="text-xs text-slate-400 font-normal italic">(Diperlukan jika terkena limit Quota)</span></label>
                        <input 
                            type="password" 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                            placeholder="AIzaSy..."
                            value={userIdentity.customApiKey || ''}
                            onChange={(e) => setUserIdentity(prev => ({...prev, customApiKey: e.target.value}))}
                        />
                        <p className="text-xs text-slate-500 mt-2">Dapatkan API Key gratis di <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Google AI Studio</a>.</p>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                        <button 
                            onClick={() => {
                                setUserIdentity({ authorName: '', institutionName: '', academicYear: '', semester: '', customApiKey: '' });
                                localStorage.removeItem('prota_author_name');
                                localStorage.removeItem('prota_institution_name');
                                localStorage.removeItem('prota_academic_year');
                                localStorage.removeItem('prota_semester');
                                localStorage.removeItem('prota_custom_api_key');
                            }}
                            className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Bersihkan
                        </button>
                        <button 
                            onClick={() => {
                                localStorage.setItem('prota_author_name', userIdentity.authorName);
                                localStorage.setItem('prota_institution_name', userIdentity.institutionName);
                                localStorage.setItem('prota_academic_year', userIdentity.academicYear);
                                localStorage.setItem('prota_semester', userIdentity.semester);
                                if (userIdentity.customApiKey) {
                                    localStorage.setItem('prota_custom_api_key', userIdentity.customApiKey);
                                } else {
                                    localStorage.removeItem('prota_custom_api_key');
                                }
                                setAppStage('generator');
                            }}
                            className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                        >
                            Konfirmasi &amp; Lanjut <ArrowRight className="w-5 h-5"/>
                        </button>
                    </div>
                    
                    <button onClick={() => setAppStage('tutorial')} className="w-full mt-4 flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 font-medium">
                        <ArrowLeft className="w-4 h-4"/> Kembali ke Tutorial
                    </button>
                 </div>
             </motion.div>
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
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
               <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-blue-50 shrink-0">
                  <div className="flex items-center gap-3"><CalendarDays className="w-6 h-6 text-blue-600" /><div><h3 className="text-xl font-bold text-gray-900">Kalender Akademik 2025/2026</h3><p className="text-sm text-gray-500">Sentuh/klik tanggal untuk menyesuaikan hari libur/non-efektif</p></div></div>
                  <button onClick={() => setShowCalendar(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-6 h-6 text-gray-500" /></button>
               </div>
               <div className="p-6 overflow-y-auto bg-gray-50/50">
                   <MasterCalendarConfig 
                       calendarEvents={calendarEvents} 
                       onDateClick={(dateStr, ev) => setEditingCalendarEvent({ dateStr, ev })} 
                       academicYearStart={academicYearStart}
                       setAcademicYearStart={setAcademicYearStart}
                       schoolDaysCount={schoolDaysCount}
                       setSchoolDaysCount={setSchoolDaysCount}
                   />
               </div>
            </div>
         </div>
      )}

      {/* Editing Event Modal */}
      {editingCalendarEvent && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{editingCalendarEvent.ev ? 'Ubah/Hapus Keterangan' : 'Tambah Keterangan Libur'}</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                          <input type="date" id="ev-start" defaultValue={editingCalendarEvent.ev?.start || editingCalendarEvent.dateStr} className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai</label>
                          <input type="date" id="ev-end" defaultValue={editingCalendarEvent.ev?.end || editingCalendarEvent.dateStr} className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                          <input type="text" id="ev-desc" defaultValue={editingCalendarEvent.ev?.description || ''} placeholder="Contoh: Libur Nasional" className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Warna / Tipe</label>
                          <select id="ev-color" defaultValue={editingCalendarEvent.ev?.color || 'bg-red-500'} className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500">
                              <option value="bg-red-500">Merah (Libur Nasional/Umum)</option>
                              <option value="bg-orange-500">Oranye (Ujian/Asesmen)</option>
                              <option value="bg-blue-500">Biru (Kegiatan Khusus)</option>
                              <option value="bg-purple-500">Ungu (Pengolahan Nilai)</option>
                              <option value="bg-green-500">Hijau (Awal Masuk/MPLS)</option>
                          </select>
                      </div>
                  </div>
                  <div className="mt-6 flex justify-between gap-3">
                      {editingCalendarEvent.ev ? (
                          <button onClick={() => {
                              const newEvents = calendarEvents.filter(e => e.id !== editingCalendarEvent.ev!.id);
                              setCalendarEvents(newEvents);
                              localStorage.setItem('prota_calendar_events', JSON.stringify(newEvents));
                              setEditingCalendarEvent(null);
                          }} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-medium">Hapus</button>
                      ) : <div></div>}
                      <div className="flex gap-2">
                          <button onClick={() => setEditingCalendarEvent(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium">Batal</button>
                          <button onClick={() => {
                              const title = (document.getElementById('ev-desc') as HTMLInputElement).value;
                              if (!title) return alert("Keterangan tidak boleh kosong");
                              const newEv: CalendarEvent = {
                                  id: editingCalendarEvent.ev?.id || `ev-custom-${Date.now()}`,
                                  start: (document.getElementById('ev-start') as HTMLInputElement).value,
                                  end: (document.getElementById('ev-end') as HTMLInputElement).value,
                                  description: title,
                                  color: (document.getElementById('ev-color') as HTMLSelectElement).value,
                                  type: 'holiday'
                              };
                              const newEvents = editingCalendarEvent.ev 
                                  ? calendarEvents.map(e => e.id === newEv.id ? newEv : e) 
                                  : [...calendarEvents, newEv];
                              setCalendarEvents(newEvents);
                              localStorage.setItem('prota_calendar_events', JSON.stringify(newEvents));
                              setEditingCalendarEvent(null);
                          }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Simpan</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Semester Selection Modal */}
      {pendingSemesterSelection && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Pilih Semester</h3>
            <p className="text-sm text-gray-600 mb-6 text-center">Pilih semester untuk menghasilkan modul ajar sesuai dengan rencana tanggal di Prota.</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  const className = pendingSemesterSelection;
                  setPendingSemesterSelection(null);
                  runBulkGeneration(className, '1');
                }}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md transform hover:scale-[1.02] transition-all"
              >
                Semester 1
              </button>
              <button 
                onClick={() => {
                  const className = pendingSemesterSelection;
                  setPendingSemesterSelection(null);
                  runBulkGeneration(className, '2');
                }}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md transform hover:scale-[1.02] transition-all"
              >
                Semester 2
              </button>
              <button 
                onClick={() => setPendingSemesterSelection(null)}
                className="w-full py-2 text-gray-500 hover:text-gray-700 font-medium text-sm mt-2"
              >
                Batal
              </button>
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
                                <VisualCalendar scheduledDays={classSchedules[analysisModal] || []} calendarEvents={calendarEvents} academicYearStart={academicYearStart} schoolDaysCount={schoolDaysCount} />
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
                    <h1 className="font-display text-xl font-bold">Perangkat Ajar AI 2025</h1>
                    <p className="text-blue-200 text-xs">Generator CP, TP, ATP & Modul Ajar</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex bg-blue-800/50 p-1 rounded-lg gap-2">
                    <button onClick={() => setCurrentView('generator')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${currentView === 'generator' ? 'bg-white text-blue-700' : 'text-blue-100 hover:bg-blue-700/50'}`}>
                        <Zap className="w-4 h-4" /> Generator
                    </button>
                    <button onClick={() => setCurrentView('history')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${currentView === 'history' ? 'bg-white text-blue-700' : 'text-blue-100 hover:bg-blue-700/50'}`}>
                        <History className="w-4 h-4" /> Riwayat ({activities.length})
                    </button>
                </div>
                {user && (
                    <div className="flex items-center gap-3 pl-4 border-l border-blue-600">
                        <div className="hidden md:block text-right">
                            <div className="text-sm font-bold">{user.name}</div>
                            <div className="text-xs text-blue-200">{user.email}</div>
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="p-2 bg-blue-800 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
                            title="Keluar"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="hidden md:inline text-sm font-medium">Keluar</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        {currentView === 'modul_ajar' && modulContext ? (
            <ModulAjarGenerator 
                context={modulContext} 
                userIdentity={userIdentity}
                onBack={() => setCurrentView('generator')}
                onSave={saveActivityLog}
            />
        ) : currentView === 'history' ? (
            <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-3">
                        Riwayat Aktivitas
                        {activities.length > 0 && (
                            <button onClick={clearAllActivities} className="text-xs flex items-center gap-1 font-semibold bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                                <Trash2 className="w-3.5 h-3.5" /> Hapus Semua
                            </button>
                        )}
                    </h2>
                    <button onClick={() => setCurrentView('generator')} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Generator
                    </button>
                </div>
                <div className="space-y-4">
                    {activities.map(act => (
                        <div key={act.id} className="border p-4 rounded-lg flex justify-between items-center hover:bg-gray-50 transition-colors group">
                            <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${act.type === 'MODUL_AJAR' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{act.type}</span>
                                    <span className="text-xs text-gray-500">{act.timestamp.toLocaleString()}</span>
                                </div>
                                <h4 className="font-bold text-gray-800 truncate">{act.subject}</h4>
                                <p className="text-sm text-gray-600 truncate">{act.details}</p>
                            </div>
                            <div className="flex items-center justify-end gap-3 shrink-0">
                                {act.type === 'MODUL_AJAR' && (
                                    <>
                                        <button onClick={() => {
                                            const printWindow = window.open('', '_blank');
                                            if (printWindow) {
                                                const content = act.dataSnapshot.isBulk ? act.dataSnapshot.combinedHtml : act.dataSnapshot.resultContent;
                                                printWindow.document.write(`
                                                    <html>
                                                        <head>
                                                            <title>${act.subject} - ${act.dataSnapshot.isBulk ? 'Kumpulan Modul Ajar' : 'Modul Ajar'}</title>
                                                            <style>
                                                                @page { size: A4; margin: 20mm; }
                                                                body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; }
                                                                .content { width: 100%; }
                                                                table { border-collapse: collapse; width: 100%; }
                                                                td, th { border: 1px solid #000; padding: 5px; }
                                                            </style>
                                                        </head>
                                                        <body>
                                                            <div class="content">${content}</div>
                                                            <script>
                                                                window.onload = () => { window.print(); };
                                                            </script>
                                                        </body>
                                                    </html>
                                                `);
                                                printWindow.document.close();
                                            }
                                        }} className="text-purple-600 hover:text-purple-800 text-sm font-medium bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors">
                                            Preview {act.dataSnapshot.isBulk ? 'Semua' : 'PDF'}
                                        </button>
                                        <button onClick={() => {
                                             const size = PAPER_SIZES['A4'];
                                             const htmlContent = `
                                              <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                                              <head>
                                                <meta charset='utf-8'>
                                                <title>Modul Ajar</title>
                                                <style>
                                                  @page { size: ${size.width} ${size.height}; mso-page-orientation: portrait; margin: 2.54cm; }
                                                  body { font-family: 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; }
                                                  table { border-collapse: collapse; width: 100%; }
                                                  td, th { border: 1px solid #000; padding: 5px; vertical-align: top; }
                                                </style>
                                              </head>
                                              <body>
                                                ${act.dataSnapshot.isBulk ? act.dataSnapshot.combinedHtml : act.dataSnapshot.resultContent}
                                              </body>
                                              </html>`;
                                              const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
                                              const url = URL.createObjectURL(blob);
                                              const link = document.createElement('a');
                                              link.href = url;
                                              link.download = `Modul_Ajar_${act.subject.replace(/\s+/g, '_')}.doc`;
                                              document.body.appendChild(link);
                                              link.click();
                                              document.body.removeChild(link);
                                        }} className="text-green-600 hover:text-green-800 text-sm font-medium bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors">
                                            Unduh Word
                                        </button>
                                    </>
                                )}
                                <button onClick={() => { setData(act.dataSnapshot); setCurrentView('generator'); }} className="text-blue-600 hover:blue-800 text-sm font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                                    Pulihkan
                                </button>
                                <button onClick={() => deleteActivity(act.id)} className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Hapus Riwayat">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {activities.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">Belum ada aktivitas.</p>
                            <p className="text-gray-400 text-sm mt-1">Riwayat pembuatan perangkat Anda akan muncul di sini.</p>
                        </div>
                    )}
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

                    <div className="bg-blue-50/50 p-6 rounded-lg border border-blue-100 flex items-center justify-between">
                         <div className="flex flex-col">
                             <div className="flex items-center gap-2 text-blue-800 font-semibold mb-1">
                                 <SlidersHorizontal className="w-5 h-5" /> Konfigurasi Kalender Akademik
                             </div>
                             <p className="text-sm text-gray-600">Sesuaikan jadwal libur, ujian, dan kegiatan non-efektif per-tanggal.</p>
                         </div>
                         <button onClick={() => setShowCalendar(true)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                             <CalendarDays className="w-5 h-5" /> Atur Kalender Master
                         </button>
                    </div>
                </section>

                {/* Results */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
                        <p className="font-medium">Terjadi Kesalahan</p>
                        <p className="text-sm">{error}</p>
                        <p className="text-xs mt-2 text-red-500">Debug: API Key is {getApiKey() ? 'Set' : 'Not Set'}</p>
                    </div>
                )}
                {data && selectedFase.classes.map((className) => {
                    const hasATP = (data.elements || []).some(el => (el.allocations || []).find(a => a.className === className)?.structuredAtp);
                    return (
                        <div key={className} className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                            <div className="p-4 bg-gray-50 border-b flex flex-wrap justify-between items-center gap-4">
                                <div>
                                    <h3 className="font-bold text-lg border-l-4 border-blue-600 pl-3">{className}</h3>
                                    <div className="flex flex-wrap items-center gap-2 mt-2 ml-4">
                                        <span className="text-xs font-medium text-gray-600">Jadwal & JP:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {DAYS_OF_WEEK.filter(day => schoolDaysCount === 6 || day !== 'Sabtu').map(day => {
                                                const isSelected = (classSchedules[className] || []).includes(day);
                                                return (
                                                    <div key={day} className="flex flex-col items-center gap-1">
                                                        <button 
                                                            onClick={() => toggleScheduleDay(className, day)} 
                                                            className={`px-2 py-1 text-[10px] rounded border transition-all ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                                        >
                                                            {day}
                                                        </button>
                                                        {isSelected && (
                                                            <div className="flex items-center gap-1 bg-white border border-blue-200 rounded px-1 group shadow-sm animate-in zoom-in-95 duration-200">
                                                                <input 
                                                                    type="number" 
                                                                    min="1" 
                                                                    max="10"
                                                                    value={(classDailyJP[className] || {})[day] || 3}
                                                                    onChange={(e) => updateDailyJP(className, day, parseInt(e.target.value) || 0)}
                                                                    className="w-6 text-[9px] font-bold text-blue-700 text-center focus:outline-none bg-transparent"
                                                                    title="Tentukan JP untuk hari ini"
                                                                />
                                                                <span className="text-[8px] text-blue-400 font-bold pr-0.5">JP</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {!hasATP && (
                                        <button onClick={() => generateATP(className)} disabled={atpLoading === className} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50">
                                            {atpLoading === className ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />} 2. Susun ATP Otomatis
                                        </button>
                                    )}
                                    {hasATP && (
                                        <>
                                            <button onClick={() => handleDownloadProta(className)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700 transition-colors">
                                                <Download className="w-4 h-4" /> Unduh Prota
                                            </button>
                                            <button 
                                                onClick={() => handleBulkGenerateModulForClass(className)} 
                                                disabled={bulkGenerationStatus[className]?.active}
                                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                                            >
                                                {bulkGenerationStatus[className]?.active ? <Loader2 className="animate-spin w-4 h-4" /> : <FilePlus className="w-4 h-4" />} 
                                                {bulkGenerationStatus[className]?.active ? 'Sedang Membuat Modul...' : '3. Buat Semua Modul Ajar Sekaligus'}
                                            </button>
                                            {bulkGenerationStatus[className]?.active && (
                                                <button 
                                                    onClick={() => { (window as any).bulkAbortedMap = { ...((window as any).bulkAbortedMap || {}), [className]: true }; setBulkGenerationStatus(prev => ({...prev, [className]: {...prev[className], active: false, statusText: "Proses dibatalkan."}}))}}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-red-700 transition-all border border-red-700 shadow-sm"
                                                >
                                                    <X className="w-4 h-4" /> Batal
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {activities.some(a => a.type === 'MODUL_AJAR' && (a.dataSnapshot?.className === className || a.details.includes(className))) && (
                                        <div className="flex flex-col gap-2">
                                            {activities.filter(a => a.type === 'MODUL_AJAR' && a.dataSnapshot?.className === className && a.dataSnapshot?.semester === '1').length > 0 && (
                                                <button 
                                                    onClick={() => handleDownloadAllModulForClass(className, '1')} 
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 transition-all border border-indigo-700 shadow-sm"
                                                >
                                                    <Download className="w-4 h-4" /> Unduh Modul Sem 1
                                                </button>
                                            )}
                                            {activities.filter(a => a.type === 'MODUL_AJAR' && a.dataSnapshot?.className === className && a.dataSnapshot?.semester === '2').length > 0 && (
                                                <button 
                                                    onClick={() => handleDownloadAllModulForClass(className, '2')} 
                                                    className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-sky-700 transition-all border border-sky-700 shadow-sm"
                                                >
                                                    <Download className="w-4 h-4" /> Unduh Modul Sem 2
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {bulkGenerationStatus[className]?.active && (
                                <div className="p-6 bg-purple-50/50 border-b border-purple-200">
                                    <div className="max-w-xl mx-auto space-y-3">
                                        <div className="flex justify-between text-sm font-bold text-purple-900">
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="animate-spin w-4 h-4" />
                                                Memproses Modul Ajar ({bulkGenerationStatus[className].current} dari {bulkGenerationStatus[className].total} ATP)
                                            </span>
                                            <span>{bulkGenerationStatus[className].percent}%</span>
                                        </div>
                                        <div className="w-full bg-purple-200 rounded-full h-4 overflow-hidden shadow-inner">
                                            <div 
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300 ease-out flex items-center justify-center relative overflow-hidden" 
                                                style={{ width: `${bulkGenerationStatus[className].percent}%` }}
                                            >
                                                <div className="absolute inset-0 bg-white/20 animate-pulse w-full"></div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-purple-700 italic text-center font-medium">
                                            {bulkGenerationStatus[className].statusText || "Harap tunggu, proses ini dapat memakan waktu beberapa menit. Jangan menutup tab browser Anda."}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                {(classSchedules[className] && classSchedules[className].length > 0) && (() => {
                                    const result = calculateCalendarAnalysis(className, data.subject);
                                    if (!result) return null;
                                    return (
                                        <div className="p-6 bg-indigo-50/20 border-b border-gray-200 animate-in fade-in duration-300">
                                            <div className="flex items-center gap-2 mb-4">
                                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                                <h3 className="text-md font-bold text-gray-800">Analisis Hari Efektif Belajar & Alokasi Waktu ({className})</h3>
                                            </div>
                                            <div className="flex flex-col lg:flex-row gap-6">
                                                <div className="w-full lg:w-1/3 flex flex-col gap-4">
                                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
                                                        <h4 className="text-xs font-bold text-gray-700 uppercase mb-3 flex items-center gap-2"><Target className="w-3 h-3 text-indigo-600"/> Perhitungan Alokasi</h4>
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center p-2 bg-indigo-50 rounded-lg">
                                                                <span className="text-xs font-medium text-gray-600">Total Hari Efektif</span>
                                                                <span className="text-sm font-bold text-indigo-700">{result.totalAvailableSlots} Hari</span>
                                                            </div>
                                                            <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                                                                <span className="text-xs font-medium text-gray-600">Total Pekan Efektif</span>
                                                                <span className="text-sm font-bold text-green-700">{result.totalEffectiveWeeks} Pekan</span>
                                                            </div>
                                                            <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg border border-blue-100">
                                                                <span className="text-xs font-medium text-gray-600">Target Kurikulum</span>
                                                                <span className="text-sm font-bold text-blue-700">{result.totalTargetJP} JP/Thn</span>
                                                            </div>
                                                            <div className="flex justify-between items-center p-2 bg-amber-50 rounded-lg border border-amber-100">
                                                                <span className="text-xs font-medium text-gray-600">Alokasi per Minggu</span>
                                                                <span className="text-sm font-bold text-amber-700">{result.weeklyTargetJP} JP/Mg</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                                        <h4 className="text-xs font-bold text-gray-700 uppercase mb-3 flex items-center gap-2"><Table className="w-3 h-3 text-gray-500"/> Alokasi Waktu Semester</h4>
                                                        <table className="w-full text-xs text-left">
                                                            <thead className="bg-gray-100 text-gray-700 font-bold uppercase">
                                                                <tr>
                                                                    <th className="p-2">Uraian</th>
                                                                    <th className="p-2 text-center">Jadwal</th>
                                                                    <th className="p-2 text-center">Jml HBE</th>
                                                                    <th className="p-2 text-center">Jam Pel</th>
                                                                    <th className="p-2 text-center">Total JP</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y text-gray-600">
                                                                <tr>
                                                                    <td className="p-2 font-bold text-blue-800">Semester 1</td>
                                                                    <td className="p-2 text-center">{(classSchedules[className] || []).join(', ')}</td>
                                                                    <td className="p-2 text-center font-bold">{result.semester1.effectiveDays}</td>
                                                                    <td className="p-2 text-center font-bold">{(classSchedules[className] || []).map(day => (classDailyJP[className] || {})[day] || 3).join('/')}</td>
                                                                    <td className="p-2 text-center font-bold text-blue-700">{result.semester1.availableJP}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="p-2 font-bold text-indigo-800">Semester 2</td>
                                                                    <td className="p-2 text-center">{(classSchedules[className] || []).join(', ')}</td>
                                                                    <td className="p-2 text-center font-bold">{result.semester2.effectiveDays}</td>
                                                                    <td className="p-2 text-center font-bold">{(classSchedules[className] || []).map(day => (classDailyJP[className] || {})[day] || 3).join('/')}</td>
                                                                    <td className="p-2 text-center font-bold text-indigo-700">{result.semester2.availableJP}</td>
                                                                </tr>
                                                                <tr className="bg-blue-50/50 font-bold border-t-2 border-blue-100">
                                                                    <td className="p-2 text-blue-900 uppercase text-[10px]">Total Setahun</td>
                                                                    <td className="p-2 text-center">-</td>
                                                                    <td className="p-2 text-center text-blue-900">{result.semester1.effectiveDays + result.semester2.effectiveDays} Hari</td>
                                                                    <td className="p-2 text-center">-</td>
                                                                    <td className="p-2 text-center text-blue-900 font-extrabold">{result.semester1.availableJP + result.semester2.availableJP} JP</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                <div className="w-full lg:w-2/3 space-y-4">
                                                    <h4 className="text-sm font-bold text-gray-800 flex items-center justify-between">
                                                        <span className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-gray-500" /> Visualisasi Kalender</span>
                                                        <span className="text-[10px] font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">Gerakkan kursor pada tanggal untuk detail</span>
                                                    </h4>
                                                    <VisualCalendar scheduledDays={classSchedules[className] || []} calendarEvents={calendarEvents} academicYearStart={academicYearStart} schoolDaysCount={schoolDaysCount} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
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
                                        {(data.elements || []).map((el, elIdx) => {
                                            const allocIdx = (el.allocations || []).findIndex(a => a.className === className);
                                            const alloc = (el.allocations || [])[allocIdx];
                                            if (!alloc) return null;

                                            const groups = alloc.structuredAtp || (alloc.tujuanPembelajaran || []).map(tp => ({ tp, atpItems: [] }));
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
                                                                        <div className="flex items-center gap-2">
                                                                            <input 
                                                                                type="date" 
                                                                                className={`flex-1 text-xs p-1 border rounded ${nonEffective ? 'border-red-400 bg-red-50 text-red-700 font-bold' : ''}`}
                                                                                value={item.planDate || ''}
                                                                                onChange={(e) => handleUpdateDate(className, elIdx, allocIdx, grpIdx, itemIdx, e.target.value)}
                                                                            />
                                                                            {item.planDate && <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{getDayName(new Date(item.planDate))}</span>}
                                                                        </div>
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

// Create or get the root element
const rootElement = document.getElementById('root')!;
const root = (window as any).__REACT_ROOT__ || createRoot(rootElement);
(window as any).__REACT_ROOT__ = root;

root.render(<App />);