import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { motion } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
    BookOpen, CheckCircle, Download, FileText, Layout, Loader2, RefreshCw, Settings, 
    ChevronRight, Sparkles, Clock, Calculator, ShieldCheck, History, X, Activity, 
    Eye, EyeOff, Key, FileDown, ArrowLeft, Home, Calendar, AlertCircle, ArrowRight, 
    Zap, Star, FileOutput, CalendarCheck, GraduationCap, SlidersHorizontal, Info, 
    Table, Lightbulb, TrendingUp, AlertTriangle, Check, CalendarDays, BarChart3, 
    ChevronDown, ChevronUp, Target, ChevronLeft, FilePlus, Save, Image as ImageIcon, 
    Printer, User, Edit, Brain, ThumbsUp, Coffee, LogOut, Trash2, Search, Lock, 
    Plus, Menu, Users, ClipboardCheck, BookMarked, CalendarRange, Award, CheckSquare, 
    Layers, PenLine, CheckCheck, Upload
} from 'lucide-react';


import localforage from 'localforage';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);




                

export const activitiesDB = localforage.createInstance({ name: 'ProtaApp', storeName: 'activities' });
export const usersDB = localforage.createInstance({ name: 'ProtaApp', storeName: 'users' });


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
  type: 'CP_TP' | 'ATP_JP' | 'MODUL_AJAR' | 'KALENDER_AKADEMIK';
  subject: string;
  details: string;
  dataSnapshot?: any; // Flexible to store CurriculumData or ModulAjarData
  paperSizeSnapshot?: 'A4' | 'Letter' | 'F4';
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
    selectedAtpItems?: { el: any; tp: string; atpItem: AtpItem }[];
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
  "Koding & Kecerdasan Artifisial",
  "Muatan Lokal (Bahasa Daerah)",
  "Muatan Lokal (Guru Mengaji)",
  "Kokurikuler 7 Kebiasaan Indonesia Hebat"
];

const isExcludedSubject = (subjName: string): boolean => {
    if (!subjName) return true;
    const s = subjName.toLowerCase().trim();
    return s.includes('kokurikuler') ||
           s.includes('7 kebiasaan') ||
           s.includes('kebiasaan') ||
           s.includes('pramuka') ||
           s.includes('mengaji') ||
           s.includes('upacara') ||
           s.includes('istirahat') ||
           s.includes('ekstrakurikuler') ||
           s.includes('pembiasaan');
};

const FASES = [
  { id: 'A', name: 'Fase A (Kelas 1 - 2)', classes: ['Kelas 1', 'Kelas 2'] },
  { id: 'B', name: 'Fase B (Kelas 3 - 4)', classes: ['Kelas 3', 'Kelas 4'] },
  { id: 'C', name: 'Fase C (Kelas 5 - 6)', classes: ['Kelas 5', 'Kelas 6'] },
];

export const ALL_AVAILABLE_CLASSES = [
  { id: 'Kelas 1', faseId: 'A', faseName: 'Fase A (Kelas 1 - 2)' },
  { id: 'Kelas 2', faseId: 'A', faseName: 'Fase A (Kelas 1 - 2)' },
  { id: 'Kelas 3', faseId: 'B', faseName: 'Fase B (Kelas 3 - 4)' },
  { id: 'Kelas 4', faseId: 'B', faseName: 'Fase B (Kelas 3 - 4)' },
  { id: 'Kelas 5', faseId: 'C', faseName: 'Fase C (Kelas 5 - 6)' },
  { id: 'Kelas 6', faseId: 'C', faseName: 'Fase C (Kelas 5 - 6)' },
];

export const normalizeClassStr = (str: string): string => {
    if (!str) return '';
    let s = String(str).toLowerCase().trim().replace(/\s+/g, '');
    s = s.replace(/kelas/g, '').replace(/kls/g, '').replace(/sd/g, '');
    const romanMap: Record<string, string> = {
        'i': '1', 'ii': '2', 'iii': '3', 'iv': '4', 'v': '5', 'vi': '6'
    };
    if (romanMap[s]) return romanMap[s];
    const numMatch = s.match(/\d/);
    if (numMatch) return numMatch[0];
    return s;
};

export const isSameClass = (classA: string, classB: string): boolean => {
    if (!classA || !classB) return false;
    const normA = normalizeClassStr(classA);
    const normB = normalizeClassStr(classB);
    return normA !== '' && normA === normB;
};

export const getFaseForClass = (className: string) => {
    const found = FASES.find(f => f.classes.some(c => isSameClass(c, className)));
    return found || FASES[0];
};

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
    "Koding & Kecerdasan Artifisial": { "Kelas 1": 72, "Kelas 2": 72, "Kelas 3": 72, "Kelas 4": 72, "Kelas 5": 72, "Kelas 6": 64 },
    "Koding kecerdasan artifisial": { "Kelas 1": 72, "Kelas 2": 72, "Kelas 3": 72, "Kelas 4": 72, "Kelas 5": 72, "Kelas 6": 64 },
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

// --- Helpers for Academic Calendar Events & Word Document Export ---
const getMonthEvents = (year: number, month: number, calendarEvents: CalendarEvent[]): CalendarEvent[] => {
    const monthStartStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const monthEndStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    return calendarEvents.filter(ev => {
        return ev.start <= monthEndStr && ev.end >= monthStartStr;
    }).sort((a, b) => a.start.localeCompare(b.start));
};

const formatEventDateRange = (ev: CalendarEvent): string => {
    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    const sParts = ev.start.split('-');
    const eParts = ev.end.split('-');
    if (sParts.length < 3 || eParts.length < 3) return ev.start;
    
    const sYear = parseInt(sParts[0], 10);
    const sMonth = parseInt(sParts[1], 10) - 1;
    const sDay = parseInt(sParts[2], 10);
    const eYear = parseInt(eParts[0], 10);
    const eMonth = parseInt(eParts[1], 10) - 1;
    const eDay = parseInt(eParts[2], 10);

    if (ev.start === ev.end) {
        return `${sDay} ${monthNamesShort[sMonth] || ''} ${sYear}`;
    }

    if (sMonth === eMonth && sYear === eYear) {
        return `${sDay} - ${eDay} ${monthNamesShort[sMonth] || ''} ${sYear}`;
    }

    return `${sDay} ${monthNamesShort[sMonth] || ''} - ${eDay} ${monthNamesShort[eMonth] || ''} ${eYear}`;
};

const generateCalendarDocHtml = (
    academicYearStart: number,
    schoolDaysCount: 5 | 6,
    calendarEvents: CalendarEvent[],
    userIdentity: UserIdentity,
    selectedClass: string
) => {
    const months = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(academicYearStart, 6 + i, 1);
        return { y: date.getFullYear(), m: date.getMonth(), date };
    });

    const getDaysInMonth = (year: number, month: number) => {
        const date = new Date(year, month, 1);
        const days: Date[] = [];
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

    const dayHeaders = ['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'];

    const renderMonthCard = (item: { y: number; m: number; date: Date }) => {
        const days = getDaysInMonth(item.y, item.m);
        const firstDay = days[0];
        const monthTitle = firstDay.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        const monthEvents = getMonthEvents(item.y, item.m, calendarEvents);
        
        const padCount = padDays(firstDay).length;
        let cellsHtml = '';
        let currentCol = 0;

        cellsHtml += '<tr>';
        for (let p = 0; p < padCount; p++) {
            cellsHtml += '<td style="border: 1px solid #e2e8f0; padding: 4px; background-color: #f8fafc; color: transparent; font-size: 8pt;">-</td>';
            currentCol++;
        }

        days.forEach(d => {
            if (currentCol === 7) {
                cellsHtml += '</tr><tr>';
                currentCol = 0;
            }

            const dateStr = formatDateLocal(d);
            const ev = getEventForDate(dateStr);
            const isSunday = d.getDay() === 0;
            const isSaturday = d.getDay() === 6;
            const isWeekend = isSunday || (schoolDaysCount === 5 && isSaturday);

            let bgColor = '#ffffff';
            let textColor = '#1e293b';
            let fontWeight = 'normal';

            if (ev) {
                fontWeight = 'bold';
                if (ev.color.includes('red')) {
                    bgColor = '#ffe4e6';
                    textColor = '#be123c';
                } else if (ev.color.includes('green')) {
                    bgColor = '#dcfce7';
                    textColor = '#15803d';
                } else if (ev.color.includes('orange')) {
                    bgColor = '#ffedd5';
                    textColor = '#c2410c';
                } else if (ev.color.includes('blue')) {
                    bgColor = '#dbeafe';
                    textColor = '#1d4ed8';
                } else if (ev.color.includes('purple')) {
                    bgColor = '#f3e8ff';
                    textColor = '#7e22ce';
                } else if (ev.color.includes('pink')) {
                    bgColor = '#fce7f3';
                    textColor = '#be185d';
                } else {
                    bgColor = '#fee2e2';
                    textColor = '#b91c1c';
                }
            } else if (isWeekend) {
                bgColor = '#fff1f2';
                textColor = '#e11d48';
                fontWeight = 'bold';
            }

            cellsHtml += `<td style="border: 1px solid #cbd5e1; padding: 4px 2px; text-align: center; font-size: 8.5pt; font-weight: ${fontWeight}; background-color: ${bgColor}; color: ${textColor};">${d.getDate()}</td>`;
            currentCol++;
        });

        while (currentCol > 0 && currentCol < 7) {
            cellsHtml += '<td style="border: 1px solid #e2e8f0; padding: 4px; background-color: #f8fafc; color: transparent; font-size: 8pt;">-</td>';
            currentCol++;
        }
        cellsHtml += '</tr>';

        let eventListHtml = '';
        if (monthEvents.length > 0) {
            eventListHtml += `
                <div style="margin-top: 6px; padding-top: 5px; border-top: 1px dashed #94a3b8; font-size: 7.5pt; text-align: left;">
                    <div style="font-weight: bold; color: #334155; margin-bottom: 2px; font-size: 8pt;">Keterangan / Hari Libur:</div>
                    <ol style="margin: 0; padding-left: 14px; color: #0f172a; line-height: 1.35;">
                        ${monthEvents.map(ev => {
                            const dateLabel = formatEventDateRange(ev);
                            return `<li style="margin-bottom: 2px;"><b>${dateLabel}</b>: ${ev.description}</li>`;
                        }).join('')}
                    </ol>
                </div>
            `;
        } else {
            eventListHtml += `
                <div style="margin-top: 6px; padding-top: 5px; border-top: 1px dashed #cbd5e1; font-size: 7.5pt; text-align: center; color: #94a3b8; font-style: italic;">
                    - Tidak ada agenda libur/khusus -
                </div>
            `;
        }

        return `
            <td style="width: 33.33%; vertical-align: top; border: 1px solid #94a3b8; padding: 6px; background-color: #ffffff; border-radius: 4px;">
                <div style="background-color: #eff6ff; color: #1e3a8a; font-weight: bold; font-size: 9.5pt; text-align: center; padding: 4px; border: 1px solid #bfdbfe; margin-bottom: 6px; text-transform: uppercase;">
                    ${monthTitle}
                </div>
                <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 8pt; margin-bottom: 4px;">
                    <thead>
                        <tr style="background-color: #f1f5f9;">
                            ${dayHeaders.map((dh, di) => {
                                const isRed = di === 6 || (schoolDaysCount === 5 && di === 5);
                                return `<th style="border: 1px solid #cbd5e1; padding: 3px 1px; font-size: 7.5pt; color: ${isRed ? '#e11d48' : '#475569'};">${dh}</th>`;
                            }).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${cellsHtml}
                    </tbody>
                </table>
                ${eventListHtml}
            </td>
        `;
    };

    const s1Months = months.slice(0, 6);
    const s2Months = months.slice(6, 12);

    const s1Rows = `
        <tr>
            ${renderMonthCard(s1Months[0])}
            ${renderMonthCard(s1Months[1])}
            ${renderMonthCard(s1Months[2])}
        </tr>
        <tr>
            ${renderMonthCard(s1Months[3])}
            ${renderMonthCard(s1Months[4])}
            ${renderMonthCard(s1Months[5])}
        </tr>
    `;

    const s2Rows = `
        <tr>
            ${renderMonthCard(s2Months[0])}
            ${renderMonthCard(s2Months[1])}
            ${renderMonthCard(s2Months[2])}
        </tr>
        <tr>
            ${renderMonthCard(s2Months[3])}
            ${renderMonthCard(s2Months[4])}
            ${renderMonthCard(s2Months[5])}
        </tr>
    `;

    const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    return `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Kalender Akademik ${academicYearStart}/${academicYearStart + 1}</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page {
                size: A4 landscape;
                margin: 0.8cm 0.8cm 0.8cm 0.8cm;
                mso-page-orientation: landscape;
            }
            body {
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 9pt;
                color: #0f172a;
                line-height: 1.2;
                background-color: #ffffff;
            }
            h2, h3, h4 { margin: 0; padding: 0; }
            table { border-collapse: collapse; }
            .page-break { page-break-before: always; }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 12px; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px;">
            <h2 style="font-size: 15pt; color: #1e3a8a; font-weight: bold; letter-spacing: 0.5px;">KALENDER AKADEMIK</h2>
            <h3 style="font-size: 12pt; color: #334155; font-weight: bold; margin-top: 3px;">TAHUN AJARAN ${academicYearStart}/${academicYearStart + 1}</h3>
            <div style="font-size: 10pt; color: #475569; margin-top: 2px;">${userIdentity.institutionName || 'Sekolah Dasar'}</div>
          </div>

          <table style="width: 100%; border: none; margin-bottom: 12px; font-size: 8.5pt;">
            <tr>
              <td style="width: 50%; border: none; vertical-align: top;">
                <table style="border: none; width: 100%;">
                  <tr><td style="border: none; width: 120px; font-weight: bold; color: #475569;">Satuan Pendidikan</td><td style="border: none;">: ${userIdentity.institutionName || '-'}</td></tr>
                  <tr><td style="border: none; font-weight: bold; color: #475569;">Kelas Terampu</td><td style="border: none;">: ${selectedClass || '-'}</td></tr>
                </table>
              </td>
              <td style="width: 50%; border: none; vertical-align: top;">
                <table style="border: none; width: 100%;">
                  <tr><td style="border: none; width: 120px; font-weight: bold; color: #475569;">Guru Kelas / Pengampu</td><td style="border: none;">: ${userIdentity.authorName || '-'}</td></tr>
                  <tr><td style="border: none; font-weight: bold; color: #475569;">Sistem Pembelajaran</td><td style="border: none;">: ${schoolDaysCount} Hari Belajar (Senin - ${schoolDaysCount === 5 ? 'Jumat' : 'Sabtu'})</td></tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- SEMESTER 1 -->
          <div style="background-color: #1e3a8a; color: #ffffff; padding: 6px 12px; font-size: 10.5pt; font-weight: bold; border-radius: 4px; margin-bottom: 8px;">
            SEMESTER 1 (GANJIL) • JULI - DESEMBER ${academicYearStart}
          </div>
          <table style="width: 100%; border-collapse: separate; border-spacing: 8px; margin-bottom: 15px;">
            ${s1Rows}
          </table>

          <div style="page-break-before: always; margin-top: 15px;"></div>

          <!-- SEMESTER 2 -->
          <div style="background-color: #3730a3; color: #ffffff; padding: 6px 12px; font-size: 10.5pt; font-weight: bold; border-radius: 4px; margin-bottom: 8px;">
            SEMESTER 2 (GENAP) • JANUARI - JUNI ${academicYearStart + 1}
          </div>
          <table style="width: 100%; border-collapse: separate; border-spacing: 8px; margin-bottom: 20px;">
            ${s2Rows}
          </table>

          <!-- Signatures -->
          <table style="width: 100%; border: none; margin-top: 30px; font-size: 9pt;">
            <tr>
              <td style="width: 50%; border: none; text-align: center; vertical-align: top;">
                Mengetahui,<br/>
                <b>Kepala ${userIdentity.institutionName || 'Sekolah'}</b>
                <br/><br/><br/><br/><br/>
                <u><b>${(userIdentity as any).kepalaSekolah || '...........................................'}</b></u><br/>
                NIP. ${(userIdentity as any).nipKepalaSekolah || '...........................................'}
              </td>
              <td style="width: 50%; border: none; text-align: center; vertical-align: top;">
                ${(userIdentity as any).city || '................'}, ${todayStr}<br/>
                <b>Guru Kelas / Pengampu</b>
                <br/><br/><br/><br/><br/>
                <u><b>${userIdentity.authorName || '...........................................'}</b></u><br/>
                NIP. ${(userIdentity as any).nip || '...........................................'}
              </td>
            </tr>
          </table>
        </body>
        </html>
    `;
};

const handleDownloadCalendarDoc = (
    academicYearStart: number,
    schoolDaysCount: 5 | 6,
    calendarEvents: CalendarEvent[],
    userIdentity: UserIdentity,
    selectedClass: string
) => {
    const htmlContent = generateCalendarDocHtml(
        academicYearStart,
        schoolDaysCount,
        calendarEvents,
        userIdentity,
        selectedClass
    );
    const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeInst = (userIdentity.institutionName || 'Sekolah').replace(/[^a-zA-Z0-9]/g, '_');
    a.download = `Kalender_Akademik_${academicYearStart}_${academicYearStart + 1}_${safeInst}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// --- Master Calendar Config with Drag-to-Select & Per-Month Details ---
const MasterCalendarConfig = ({ 
    calendarEvents, 
    onDateClick,
    onDateRangeClick,
    academicYearStart,
    setAcademicYearStart,
    schoolDaysCount,
    setSchoolDaysCount,
    onAddNewEvent,
    onSaveCalendar,
    onDownloadDoc
}: { 
    calendarEvents: CalendarEvent[], 
    onDateClick: (dateStr: string, ev: CalendarEvent | undefined) => void,
    onDateRangeClick?: (startDateStr: string, endDateStr: string, ev?: CalendarEvent) => void,
    academicYearStart: number,
    setAcademicYearStart: (year: number) => void,
    schoolDaysCount: 5 | 6,
    setSchoolDaysCount: (count: 5 | 6) => void,
    onAddNewEvent?: () => void,
    onSaveCalendar?: () => void,
    onDownloadDoc?: () => void
}) => {
    // Drag-to-select state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<string | null>(null);
    const [dragCurrent, setDragCurrent] = useState<string | null>(null);

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

    // Calculate selection bounds
    const dragRange = useMemo(() => {
        if (!isDragging || !dragStart || !dragCurrent) return null;
        const min = dragStart < dragCurrent ? dragStart : dragCurrent;
        const max = dragStart < dragCurrent ? dragCurrent : dragStart;
        return { min, max };
    }, [isDragging, dragStart, dragCurrent]);

    const isDateInDragRange = (dateStr: string) => {
        if (!dragRange) return false;
        return dateStr >= dragRange.min && dateStr <= dragRange.max;
    };

    const handleCellMouseDown = (dateStr: string) => {
        setIsDragging(true);
        setDragStart(dateStr);
        setDragCurrent(dateStr);
    };

    const handleCellMouseEnter = (dateStr: string) => {
        if (isDragging) {
            setDragCurrent(dateStr);
        }
    };

    const handleCellMouseUp = (dateStr: string) => {
        if (isDragging && dragStart) {
            const min = dragStart < dateStr ? dragStart : dateStr;
            const max = dragStart < dateStr ? dateStr : dragStart;
            setIsDragging(false);
            setDragStart(null);
            setDragCurrent(null);

            if (min !== max && onDateRangeClick) {
                const existingEv = getEventForDate(min);
                onDateRangeClick(min, max, existingEv);
            } else {
                const existingEv = getEventForDate(min);
                onDateClick(min, existingEv);
            }
        }
    };

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isDragging) {
                if (dragStart && dragCurrent && dragStart !== dragCurrent && onDateRangeClick) {
                    const min = dragStart < dragCurrent ? dragStart : dragCurrent;
                    const max = dragStart < dragCurrent ? dragCurrent : dragStart;
                    const existingEv = getEventForDate(min);
                    onDateRangeClick(min, max, existingEv);
                }
                setIsDragging(false);
                setDragStart(null);
                setDragCurrent(null);
            }
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, [isDragging, dragStart, dragCurrent, onDateRangeClick]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 select-none">
            {/* Top Toolbar & Quick Actions */}
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center bg-gray-50 border border-gray-200 p-4 rounded-xl gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700">Tahun Ajaran:</span>
                        <select 
                            value={academicYearStart} 
                            onChange={(e) => setAcademicYearStart(Number(e.target.value))}
                            className="p-1.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            {[2024, 2025, 2026, 2027, 2028].map(y => (
                                <option key={y} value={y}>{y}/{y+1}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700">Sistem Hari:</span>
                        <div className="flex bg-white rounded-lg border border-gray-300 overflow-hidden shadow-2xs">
                            <button 
                                onClick={() => setSchoolDaysCount(5)} 
                                className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${schoolDaysCount === 5 ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                5 Hari (Sen-Jum)
                            </button>
                            <button 
                                onClick={() => setSchoolDaysCount(6)} 
                                className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${schoolDaysCount === 6 ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                6 Hari (Sen-Sab)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Direct Action Buttons: Download Word */}
                <div className="flex flex-wrap items-center gap-2">
                    {onDownloadDoc && (
                        <button
                            onClick={onDownloadDoc}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                            title="Unduh file dokumen Word kalender akademik beserta rincian kegiatannya"
                        >
                            <FileDown className="w-4 h-4" />
                            Unduh Kalender (Word)
                        </button>
                    )}
                </div>
            </div>

            {/* Instruction Tip for Cursor Blocking / Drag */}
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                    <p className="font-bold">Tips Pengaturan Agenda & Libur:</p>
                    <p className="text-blue-800">
                        • <b>Klik 1 tanggal</b> atau <b>tahan dan seret (blok) kursor</b> melintasi beberapa tanggal untuk menentukan rentang kegiatan/libur sekaligus.
                    </p>
                    <p className="text-blue-800">
                        • Klik daftar keterangan di bawah setiap bulan untuk mengubah atau menghapus agenda.
                    </p>
                </div>
            </div>

            {/* SEMESTER 1 */}
            <div>
                <div className="flex items-center justify-between border-b pb-2 mb-4">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-blue-600"/> SEMESTER 1 (Ganjil) • Juli - Desember {academicYearStart}
                    </h3>
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                        6 Bulan
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {months.slice(0, 6).map((item, idx) => {
                        const days = getDaysInMonth(item.y, item.m);
                        const firstDay = days[0];
                        const monthEvents = getMonthEvents(item.y, item.m, calendarEvents);

                        return (
                            <div key={idx} className="bg-white rounded-xl shadow-2xs border border-gray-200 overflow-hidden flex flex-col hover:border-blue-300 transition-colors">
                                <div className="bg-blue-50/90 px-4 py-2 font-bold text-blue-900 border-b border-blue-100 text-center uppercase tracking-wider text-xs">
                                    {firstDay.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                                </div>
                                <div className="p-3">
                                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                                        {['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'].map((d, i) => (
                                            <div key={i} className={`text-[10px] font-bold ${d==='Mg' || (schoolDaysCount === 5 && d==='Sb') ? 'text-red-500' : 'text-gray-500'}`}>{d}</div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-1 text-center">
                                        {padDays(firstDay).map(p => <div key={'pad'+p} className="p-1"></div>)}
                                        {days.map(d => {
                                            const dateStr = formatDateLocal(d);
                                            const ev = getEventForDate(dateStr);
                                            const isWeekend = d.getDay() === 0 || (schoolDaysCount === 5 && d.getDay() === 6);
                                            const isSelectedInRange = isDateInDragRange(dateStr);

                                            let bgClass = 'hover:bg-gray-100';
                                            let textClass = 'text-gray-700';

                                            if (isSelectedInRange) {
                                                bgClass = 'bg-blue-600 text-white font-bold ring-2 ring-blue-400 scale-105 z-20 shadow-xs';
                                                textClass = 'text-white';
                                            } else if (ev) {
                                                bgClass = `${ev.color} text-white shadow-2xs font-bold hover:brightness-110`;
                                                textClass = 'text-white';
                                            } else if (isWeekend) {
                                                bgClass = 'bg-red-50 text-red-600 hover:bg-red-100 font-bold';
                                                textClass = 'text-red-600';
                                            }
                                            
                                            return (
                                                <button 
                                                    key={d.getDate()} 
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        handleCellMouseDown(dateStr);
                                                    }}
                                                    onMouseEnter={() => handleCellMouseEnter(dateStr)}
                                                    onMouseUp={() => handleCellMouseUp(dateStr)}
                                                    className={`p-1.5 text-xs rounded-md transition-all ${bgClass} ${textClass} relative cursor-pointer active:scale-95`}
                                                    title={ev ? `${dateStr}: ${ev.description}` : dateStr}
                                                >
                                                    {d.getDate()}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Month Details / Keterangan List under each month */}
                                <div className="mt-auto border-t border-gray-100 bg-gray-50/70 p-3 text-xs">
                                    <div className="font-bold text-gray-700 text-[11px] mb-1.5 flex items-center justify-between">
                                        <span>Keterangan / Hari Libur:</span>
                                        <span className="text-[10px] text-gray-500 font-normal">{monthEvents.length} agenda</span>
                                    </div>
                                    {monthEvents.length > 0 ? (
                                        <ul className="space-y-1.5">
                                            {monthEvents.map((ev, eIdx) => {
                                                const dateLabel = formatEventDateRange(ev);
                                                return (
                                                    <li 
                                                        key={ev.id || eIdx}
                                                        onClick={() => onDateClick(ev.start, ev)}
                                                        className="flex items-start gap-1.5 p-1 rounded hover:bg-white hover:shadow-2xs cursor-pointer transition-all group"
                                                        title="Klik untuk ubah/hapus agenda ini"
                                                    >
                                                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-blue-600 mt-0.5">{eIdx + 1}.</span>
                                                        <span className={`w-2 h-2 rounded-full ${ev.color} mt-1.5 shrink-0`} />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[11px] font-bold text-gray-800 leading-tight">
                                                                {dateLabel}: <span className="font-normal text-gray-600">{ev.description}</span>
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p className="text-[11px] text-gray-400 italic py-1 text-center">Tidak ada agenda libur/khusus</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* SEMESTER 2 */}
            <div>
                <div className="flex items-center justify-between border-b pb-2 mb-4">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-indigo-600"/> SEMESTER 2 (Genap) • Januari - Juni {academicYearStart + 1}
                    </h3>
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                        6 Bulan
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {months.slice(6, 12).map((item, idx) => {
                        const days = getDaysInMonth(item.y, item.m);
                        const firstDay = days[0];
                        const monthEvents = getMonthEvents(item.y, item.m, calendarEvents);

                        return (
                            <div key={idx} className="bg-white rounded-xl shadow-2xs border border-gray-200 overflow-hidden flex flex-col hover:border-indigo-300 transition-colors">
                                <div className="bg-indigo-50/90 px-4 py-2 font-bold text-indigo-900 border-b border-indigo-100 text-center uppercase tracking-wider text-xs">
                                    {firstDay.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                                </div>
                                <div className="p-3">
                                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                                        {['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'].map((d, i) => (
                                            <div key={i} className={`text-[10px] font-bold ${d==='Mg' || (schoolDaysCount === 5 && d==='Sb') ? 'text-red-500' : 'text-gray-500'}`}>{d}</div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-1 text-center">
                                        {padDays(firstDay).map(p => <div key={'pad'+p} className="p-1"></div>)}
                                        {days.map(d => {
                                            const dateStr = formatDateLocal(d);
                                            const ev = getEventForDate(dateStr);
                                            const isWeekend = d.getDay() === 0 || (schoolDaysCount === 5 && d.getDay() === 6);
                                            const isSelectedInRange = isDateInDragRange(dateStr);

                                            let bgClass = 'hover:bg-gray-100';
                                            let textClass = 'text-gray-700';

                                            if (isSelectedInRange) {
                                                bgClass = 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-400 scale-105 z-20 shadow-xs';
                                                textClass = 'text-white';
                                            } else if (ev) {
                                                bgClass = `${ev.color} text-white shadow-2xs font-bold hover:brightness-110`;
                                                textClass = 'text-white';
                                            } else if (isWeekend) {
                                                bgClass = 'bg-red-50 text-red-600 hover:bg-red-100 font-bold';
                                                textClass = 'text-red-600';
                                            }
                                            
                                            return (
                                                <button 
                                                    key={d.getDate()} 
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        handleCellMouseDown(dateStr);
                                                    }}
                                                    onMouseEnter={() => handleCellMouseEnter(dateStr)}
                                                    onMouseUp={() => handleCellMouseUp(dateStr)}
                                                    className={`p-1.5 text-xs rounded-md transition-all ${bgClass} ${textClass} relative cursor-pointer active:scale-95`}
                                                    title={ev ? `${dateStr}: ${ev.description}` : dateStr}
                                                >
                                                    {d.getDate()}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Month Details / Keterangan List under each month */}
                                <div className="mt-auto border-t border-gray-100 bg-gray-50/70 p-3 text-xs">
                                    <div className="font-bold text-gray-700 text-[11px] mb-1.5 flex items-center justify-between">
                                        <span>Keterangan / Hari Libur:</span>
                                        <span className="text-[10px] text-gray-500 font-normal">{monthEvents.length} agenda</span>
                                    </div>
                                    {monthEvents.length > 0 ? (
                                        <ul className="space-y-1.5">
                                            {monthEvents.map((ev, eIdx) => {
                                                const dateLabel = formatEventDateRange(ev);
                                                return (
                                                    <li 
                                                        key={ev.id || eIdx}
                                                        onClick={() => onDateClick(ev.start, ev)}
                                                        className="flex items-start gap-1.5 p-1 rounded hover:bg-white hover:shadow-2xs cursor-pointer transition-all group"
                                                        title="Klik untuk ubah/hapus agenda ini"
                                                    >
                                                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-indigo-600 mt-0.5">{eIdx + 1}.</span>
                                                        <span className={`w-2 h-2 rounded-full ${ev.color} mt-1.5 shrink-0`} />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[11px] font-bold text-gray-800 leading-tight">
                                                                {dateLabel}: <span className="font-normal text-gray-600">{ev.description}</span>
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p className="text-[11px] text-gray-400 italic py-1 text-center">Tidak ada agenda libur/khusus</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// --- Integrated Calendar Page View Component ---
interface CalendarPageViewProps {
    selectedClass: string;
    setSelectedClass: (cls: string) => void;
    selectedSubject: string;
    setSelectedSubject: (subj: string) => void;
    availableClasses: string[];
    availableSubjects: string[];
    classSchedules: Record<string, string[]>;
    toggleScheduleDay: (className: string, day: string) => void;
    classDailyJP: Record<string, Record<string, number>>;
    updateDailyJP: (className: string, day: string, jp: number) => void;
    calendarEvents: CalendarEvent[];
    setCalendarEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
    onDateClick: (dateStr: string, ev: CalendarEvent | undefined) => void;
    onDateRangeClick: (startDateStr: string, endDateStr: string, ev?: CalendarEvent) => void;
    academicYearStart: number;
    setAcademicYearStart: (year: number) => void;
    schoolDaysCount: 5 | 6;
    setSchoolDaysCount: (count: 5 | 6) => void;
    calculateCalendarAnalysis: (className: string, subject: string) => AnalysisResult | null;
    activeTab: 'all' | 'master' | 'analysis';
    setActiveTab: (tab: 'all' | 'master' | 'analysis') => void;
    onBackToGenerator: () => void;
    userIdentity: UserIdentity;
    saveActivityLog: (log: ActivityLog) => void;
}

const CalendarPageView = ({
    selectedClass,
    setSelectedClass,
    selectedSubject,
    setSelectedSubject,
    availableClasses,
    availableSubjects,
    classSchedules,
    toggleScheduleDay,
    classDailyJP,
    updateDailyJP,
    calendarEvents,
    setCalendarEvents,
    onDateClick,
    onDateRangeClick,
    academicYearStart,
    setAcademicYearStart,
    schoolDaysCount,
    setSchoolDaysCount,
    calculateCalendarAnalysis,
    activeTab,
    setActiveTab,
    onBackToGenerator,
    userIdentity,
    saveActivityLog
}: CalendarPageViewProps) => {
    const [saveToast, setSaveToast] = useState<string | null>(null);

    const analysisResult = useMemo(() => {
        return calculateCalendarAnalysis(selectedClass, selectedSubject);
    }, [selectedClass, selectedSubject, classSchedules, classDailyJP, calendarEvents, academicYearStart, schoolDaysCount]);

    const handleSaveCalendar = () => {
        try {
            localStorage.setItem('prota_calendar_events', JSON.stringify(calendarEvents));
            localStorage.setItem('prota_school_days_count', schoolDaysCount.toString());
            localStorage.setItem('prota_class_schedules', JSON.stringify(classSchedules));
            localStorage.setItem('prota_class_daily_jp', JSON.stringify(classDailyJP));

            saveActivityLog({
                id: `cal-save-${Date.now()}`,
                timestamp: new Date(),
                type: 'KALENDER_AKADEMIK',
                subject: selectedSubject || 'Kalender Akademik',
                details: `Simpan Kalender Akademik TA ${academicYearStart}/${academicYearStart + 1} (${calendarEvents.length} agenda/libur aktif)`,
                dataSnapshot: { calendarEvents, schoolDaysCount, classSchedules, classDailyJP },
                paperSizeSnapshot: 'A4'
            });

            setSaveToast('Data Kalender Akademik berhasil disimpan dengan sukses!');
            setTimeout(() => {
                setSaveToast(null);
            }, 3500);
        } catch(e) {
            alert('Gagal menyimpan data kalender.');
        }
    };

    const handleDownloadWord = () => {
        handleDownloadCalendarDoc(
            academicYearStart,
            schoolDaysCount,
            calendarEvents,
            userIdentity,
            selectedClass
        );
    };

    const handleAddNewEventDirect = () => {
        const defaultDate = `${academicYearStart}-07-15`;
        onDateRangeClick(defaultDate, defaultDate, undefined);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Save Notification Toast */}
            {saveToast && (
                <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 text-sm font-bold">
                        <CheckCircle className="w-5 h-5 text-emerald-100" />
                        <span>{saveToast}</span>
                    </div>
                    <button onClick={() => setSaveToast(null)} className="text-emerald-100 hover:text-white p-1">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* SECTION 1: KALENDER MASTER AKADEMIK */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <CalendarDays className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Kalender Master Akademik</h3>
                            <p className="text-xs text-gray-500">Klik tanggal atau blok beberapa tanggal dengan kursor untuk menetapkan hari libur / kegiatan khusus.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleSaveCalendar}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-green-600 text-white hover:bg-green-700 font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
                        >
                            <Save className="w-3.5 h-3.5" /> Simpan Data
                        </button>
                        <button 
                            onClick={handleDownloadWord}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                            title="Unduh Kalender Akademik format Microsoft Word (.doc)"
                        >
                            <FileDown className="w-3.5 h-3.5" /> Unduh Word (.doc)
                        </button>
                        <button 
                            onClick={onBackToGenerator}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Generator
                        </button>
                        <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-2 rounded-xl border border-indigo-100">
                            TA {academicYearStart}/{academicYearStart + 1} • {schoolDaysCount} Hari Sekolah
                        </span>
                    </div>
                </div>

                {/* Master Calendar Config Grid with Drag Selection & Details */}
                <MasterCalendarConfig 
                    calendarEvents={calendarEvents} 
                    onDateClick={onDateClick} 
                    onDateRangeClick={onDateRangeClick}
                    academicYearStart={academicYearStart}
                    setAcademicYearStart={setAcademicYearStart}
                    schoolDaysCount={schoolDaysCount}
                    setSchoolDaysCount={setSchoolDaysCount}
                    onAddNewEvent={handleAddNewEventDirect}
                    onSaveCalendar={handleSaveCalendar}
                    onDownloadDoc={handleDownloadWord}
                />
            </div>
        </div>
    );
};

// --- Modul Ajar Generator Component ---

const ModulAjarGenerator = ({ 
    context, 
    userIdentity,
    selectedCharacteristic = 'Beragam (Visual, Auditori, Kinestetik)',
    onBack, 
    onSave 
}: { 
    context: ModulAjarContext, 
    userIdentity: UserIdentity,
    selectedCharacteristic?: string,
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
                Bertindaklah sebagai Konsultan Kurikulum Merdeka & Pembelajaran Mendalam (Deep Learning) sesuai Permendikdasmen No. 13 Tahun 2025.
                Berikan 3 REKOMENDASI Model Pembelajaran beserta METODE/TEKNIK Pembelajaran yang spesifik, efektif, dan mengintegrasikan 3 Prinsip Pembelajaran Mendalam (Mindful/Berkesadaran, Meaningful/Bermakna, Joyful/Menggembirakan) serta 3 Pengalaman Belajar (Memahami, Mengaplikasi, Merefleksi) untuk materi berikut.
                
                KONTEKS:
                - Jenjang: SD/MI
                - Kelas: ${context.className} (${context.fase})
                - Mapel: ${context.subject}
                - Topik/ATP: ${context.atpItem.alur}
                - CP: ${context.cp}

                INSTRUKSI:
                1. Analisis kesesuaian materi dengan model Pembelajaran Mendalam (misalnya: Problem Based Learning, Project Based Learning, Discovery Learning, Inquiry Learning, Contextual Teaching and Learning, Cooperative Learning).
                2. Berikan 3 opsi model berbeda dengan sintaks yang jelas.
                3. Untuk setiap model, tentukan METODE/TEKNIK konkret yang mendukung pengalaman belajar Memahami-Mengaplikasi-Merefleksi (contoh: Diskusi Terarah, Eksperimen Nyata, Studi Kasus Kontekstual, Simulasi Peran, Gallery Walk, Presentasi Karya).
                4. Berikan skor kecocokan (0-100) dan alasan pedagogis singkat.

                OUTPUT JSON Format:
                {
                  "recommendations": [
                    {
                      "name": "Nama Model (contoh: Problem Based Learning)",
                      "methods": "Daftar Metode Konkret (contoh: Diskusi Kelompok, Analisis Masalah Nyata, Presentasi & Refleksi)",
                      "reason": "Alasan pedagogis mengapa kombinasi model dan metode ini tepat untuk pembelajaran mendalam.",
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
# MASTER PROMPT — GENERATOR RENCANA PEMBELAJARAN MENDALAM (RPM) BERBASIS ATP

## PERAN ANDA
Anda adalah **AI Generator Rencana Pembelajaran Mendalam (RPM)** untuk guru SD/MI profesional. Anda menyusun dokumen perangkat ajar resmi yang utuh, konkret, aplikatif, dan menyeluruh, siap pakai dan siap dicetak ke Microsoft Word tanpa teks placeholder atau kerangka kosong.

## LANDASAN PENYUSUNAN & REGULASI
- **Permendikdasmen Nomor 13 Tahun 2025**
- Pendekatan: **PEMBELAJARAN MENDALAM (DEEP LEARNING)**
- **8 Dimensi Profil Lulusan**:
  1. Keimanan dan Ketakwaan terhadap Tuhan Yang Maha Esa
  2. Kewargaan
  3. Penalaran Kritis
  4. Kreativitas
  5. Kolaborasi
  6. Kemandirian
  7. Kesehatan
  8. Komunikasi
- **3 Prinsip Pembelajaran Mendalam**:
  1. Berkesadaran (Mindful)
  2. Bermakna (Meaningful)
  3. Menggembirakan (Joyful)
- **3 Pengalaman Belajar (Wajib di Setiap Pertemuan)**:
  1. Memahami (Acquiring & constructing understanding)
  2. Mengaplikasi (Applying knowledge in real contexts)
  3. Merefleksi (Evaluating process, difficulties, and self-growth)
- **4 Kerangka Pembelajaran**:
  1. Praktik Pedagogis (Model terpilih, sintaks lengkap, metode, alasan)
  2. Kemitraan Pembelajaran (Guru-murid, antar-murid, orang tua, komunitas)
  3. Lingkungan Pembelajaran (Fisik, sosial, psikologis/emosional)
  4. Pemanfaatan Digital (Media & teknologi fungsional)

## INFORMASI SUMBER DARI PENGGUNA & ATP:
- Nama Guru / Penyusun: ${userIdentity.authorName}
- NIP: [DIISI OLEH GURU]
- Sekolah / Instansi: ${userIdentity.institutionName}
- Tahun Pelajaran: ${userIdentity.academicYear || '2025/2026'}
- Jenjang / Kelas: SD / ${formData.className} (${formData.fase})
- Semester: ${userIdentity.semester || '1'}
- Mata Pelajaran: ${formData.subject}
- Elemen CP: ${context.elementName}
- Capaian Pembelajaran (CP): ${context.cp}
- Tujuan Pembelajaran (TP) Utama dari ATP: ${context.tp}
- Materi / Topik / Alur (ATP): ${formData.topic}
- Alokasi Waktu & Beban JP: ${formData.allocation}
- Tanggal Pelaksanaan: ${formData.date}
- Model Pembelajaran: ${formData.modelMethod || 'Problem Based Learning (PBL)'}
- Karakteristik Peserta Didik: ${selectedCharacteristic || 'Beragam (Visual, Auditori, Kinestetik)'}

## ATURAN WAJIB GENERASI KONTEN:
1. **JANGAN MEMBUAT PLACEHOLDER / KERANGKA KOSONG**: Dilarang menggunakan "[isi materi]", "[masukkan soal]", "...", "dan lain-lain", teks dummy. Seluruh materi, soal, kunci jawaban, rubrik, dan LKPD wajib ditulis lengkap dan siap digunakan mengajar.
2. **ATURAN TANGGAL & JP**: Gunakan tanggal dan JP persis dari ATP (${formData.date}, ${formData.allocation}). Hitung: 1 JP = 35 menit SD.
3. **BREAKDOWN TUJUAN PEMBELAJARAN**: Analisis TP utama dari ATP dan pecah menjadi TP Turunan operasional terukur dengan pola: *Peserta didik + kata kerja operasional + kompetensi + kondisi/konteks + kriteria keberhasilan* (Kode: TP X.1.a, TP X.1.b, dst.).

## STRUKTUR LENGKAP DOKUMEN RPM (WAJIB BERURUTAN DALAM HTML MURNI):

Hasilkan output HTML murni (div kontainer utama, tanpa tag <html>/<body>) dengan struktur rapi berikut:

1. **COVER & HEADER RPM**:
   - Judul: <h1 style="font-family: 'Yu Gothic UI', Arial, sans-serif; font-size: 16pt; font-weight: bold; text-align: center; color: #111827; margin: 0 0 4pt 0; text-transform: uppercase;">RENCANA PEMBELAJARAN MENDALAM (RPM) / MODUL AJAR</h1>
   - Subjudul: <div style="text-align: center; font-style: italic; font-size: 11pt; color: #374151; margin-bottom: 12pt;">BERBASIS ATP & PERMENDIKDASMEN NOMOR 13 TAHUN 2025 (DEEP LEARNING)</div>
   - Blok Identitas Cover: Sekolah (${userIdentity.institutionName}), Mata Pelajaran (${formData.subject}), Kelas (${formData.className}), Semester (${userIdentity.semester || '1'}), Penyusun (${userIdentity.authorName}).

2. **I. IDENTIFIKASI RPM / IDENTITAS UMUM**:
   - Tabel HTML 2-kolom rapi (Nama Sekolah, Nama Guru, NIP [DIISI OLEH GURU], Mata Pelajaran, Kelas / Fase, Semester / Tahun Pelajaran, BAB / Topik, Pertemuan, Tanggal Pelaksanaan: <span style="color: #dc2626; font-weight: bold;">${formData.date}</span>, Alokasi Waktu: ${formData.allocation}, Total JP).

3. **II. IDENTIFIKASI PESERTA DIDIK**:
   - Tabel HTML 2-kolom:
     | Aspek | Deskripsi Nyata |
     | Pengetahuan Awal | (Uraikan kondisi awal dan prasyarat belajar yang relevan dengan ATP) |
     | Minat Belajar | (Uraikan variasi minat peserta didik yang relevan dengan materi) |
     | Kebutuhan Belajar & Diferensiasi | (Uraikan strategi scaffolding, diferensiasi konten/proses/produk) |

4. **III. MATERI PEMBELAJARAN (4 DIMENSI MATERI)**:
   - Tabel HTML:
     | Dimensi Materi | Uraian Materi Konkret |
     | Faktual | (Fakta-fakta nyata terkait materi) |
     | Konseptual | (Konsep, teori, prinsip utama) |
     | Prosedural | (Langkah-langkah kerja/metode) |
     | Metakognitif | (Kesadaran strategi berpikir & refleksi penerapan diri) |

5. **IV. 8 DIMENSI PROFIL LULUSAN**:
   - Tabel HTML:
     | Dimensi Profil Lulusan | Penerapan Konkret dalam Pembelajaran |
     Pilih dan uraikan dimensi yang relevan secara nyata:
     - Keimanan dan Ketakwaan terhadap Tuhan YME
     - Kewargaan
     - Penalaran Kritis
     - Kreativitas
     - Kolaborasi
     - Kemandirian
     - Kesehatan
     - Komunikasi

6. **V. DESAIN PEMBELAJARAN**:
   - **A. Tujuan Pembelajaran**: Tabel (Pertemuan | Kode TP | Tujuan Pembelajaran - mencakup TP Utama dan TP Turunan operasional terukur).
   - **B. Lintas Disiplin Ilmu**: Tabel (Mata Pelajaran Terkait | Keterkaitan Konkret).
   - **C. Praktik Pedagogis**: Tabel (Pendekatan: Pembelajaran Mendalam | Model Terpilih | Sintaks Model Lengkap | Metode | Alasan Pedagogis).
   - **D. Kemitraan Pembelajaran**: Tabel (Jenis Kemitraan [Guru-Murid, Murid-Murid, Orang Tua, Lingkungan] | Bentuk Kerja Sama Konkret).
   - **E. Lingkungan Pembelajaran**: Tabel (Aspek Fisik, Sosial, Psikologis/Emosional | Kondisi & Penerapan Mendukung).
   - **F. Pemanfaatan Digital**: Tabel (Media / Perangkat Digital | Cara Penggunaan Fungsional).

7. **VI. LANGKAH-LANGKAH PEMBELAJARAN SETIAP PERTEMUAN**:
   Buat rincian lengkap untuk SETIAP PERTEMUAN dengan struktur:
   - Header Pertemuan: **PERTEMUAN X** (Kode TP, Tanggal Pelaksanaan ${formData.date}, Alokasi Waktu, Level Kognitif, TP, Model Pembelajaran, Sintaks).
   - **KEGIATAN AWAL (15 menit)**: Salam, doa, presensi, apersepsi kontekstual, pertanyaan pemantik berpikir tingkat tinggi, motivasi, penyampaian tujuan belajar & aktivitas, pembuka menggembirakan. Disertai label: *(Berkesadaran)*, *(Bermakna)*, *(Menggembirakan)*, *(Penalaran Kritis)*, *(Komunikasi)*.
   - **KEGIATAN INTI**: Wajib menggunakan Tabel HTML 3 Kolom:
     | Pengalaman Belajar | Sintaks & Aktivitas Pembelajaran | Dimensi Profil Lulusan |
     Terbagi menjadi 3 Pengalaman Belajar Pembelajaran Mendalam:
     1. **MEMAHAMI**: Aktivitas nyata murid mengamati, membaca, menyimak, mengidentifikasi, mengajukan pertanyaan, menganalisis informasi secara mendalam.
     2. **MENGAPLIKASI**: Aktivitas nyata murid memecahkan masalah kontekstual, berdiskusi kelompok, melakukan eksperimen/simulasi, menghasilkan produk/karya nyata.
     3. **MEREFLEKSI**: Aktivitas nyata murid mengevaluasi proses belajar, menilai hasil, menyadari kesulitan, merumuskan strategi perbaikan diri.
   - **KEGIATAN AKHIR (10 menit)**: Kesimpulan pembelajaran bersama murid, umpan balik konstruktif guru, refleksi pengalaman belajar, tindak lanjut, penyampaian materi berikutnya, doa penutup.

8. **VII. ASESMEN PEMBELAJARAN SETIAP PERTEMUAN**:
   - Tabel HTML:
     | Jenis Asesmen | Bentuk & Teknik | Instrumen & Bukti Belajar |
     | Asesmen Diagnostik (Awal) | Pertanyaan lisan / kuis diagnostik | Instrumen pertanyaan awal & pedoman tindak lanjut |
     | Asesmen Formatif (Proses) | Observasi partisipasi, diskusi LKPD, unjuk kerja | Lembar observasi & checklist indikator kinerja |
     | Asesmen Sumatif (Akhir) | Tes tertulis / produk / presentasi | Butir soal sumatif atau rubrik penilaian produk |

9. **VIII. LAMPIRAN MODUL AJAR (LENGKAP & TANPA PLACEHOLDER)**:
   - **LAMPIRAN 1 — RINGKASAN MATERI / BAHAN AJAR**: Materi lengkap, sistematis, dan aplikatif untuk guru dan peserta didik.
   - **LAMPIRAN 2 — SOAL ASESMEN AWAL (DIAGNOSTIK)**: Minimal 5 soal nyata lengkap dengan kunci jawaban dan pedoman penskoran.
   - **LAMPIRAN 3 — MEDIA PEMBELAJARAN**: Tabel (No | Nama Media | Deskripsi & Cara Penggunaan dalam Pembelajaran).
   - **LAMPIRAN 4 — SOAL ASESMEN FORMATIF**: Tabel (Pertemuan/TP | Butir Soal Formatif | Bentuk & Kunci Jawaban).
   - **LAMPIRAN 5 — RUBRIK PENILAIAN LENGKAP**:
     * A. Rubrik Sikap / Profil Lulusan (Skala 1 - 4: Perlu Bimbingan, Cukup, Baik, Sangat Baik beserta deskriptor jelas).
     * B. Rubrik Pengetahuan (Kriteria & rentang skor).
     * C. Rubrik Keterampilan / Kinerja Produk (Aspek, kriteria, dan deskripsi capaian).
   - **LAMPIRAN 6 — LEMBAR KERJA MURID (LKM / LKPD) PER PERTEMUAN**:
     * Header LKPD: LKPD [MAPEL] | KELAS [X] | TOPIK: [MATERI]
     * Identitas Murid: Nama, Kelas, Tanggal.
     * A. Tujuan Pembelajaran
     * B. Petunjuk Pengerjaan
     * C. Aktivitas / Tugas / Tabel Pengamatan / Ruang Kerja
     * D. Kesimpulan
     * E. **REFLEKSIKU** (Pertanyaan refleksi pengalaman belajar bermakna dan menggembirakan).

10. **IX. TABEL VALIDASI OTOMATIS & SUMMARY RPM**:
    - Tabel Validasi HTML (3 kolom: ASPEK VALIDASI | STATUS [LENGKAP / SESUAI / KONSISTEN] | CATATAN KEPATUHAN PERMENDIKDASMEN NO. 13 TAHUN 2025).
    - Ringkasan Checklist Pemenuhan Komponen RPM Pembelajaran Mendalam.

## ATURAN STYLING HTML:
- Judul Bab Utama: <h2 style="color: #059669; font-size: 13pt; font-weight: bold; margin-top: 22px; margin-bottom: 8px; text-transform: uppercase; border-bottom: 2px solid #059669; padding-bottom: 3px; font-family: 'Yu Gothic UI', Arial, sans-serif;">
- Sub-Judul: <h3 style="color: #111827; font-size: 11pt; font-weight: bold; margin-top: 12px; margin-bottom: 4px; font-family: 'Yu Gothic UI', Arial, sans-serif;">
- Seluruh TABEL HTML wajib berformat: border-collapse: collapse; width: 100%; border: 1px solid #cbd5e1; margin-top: 8px; margin-bottom: 14px; font-size: 10.5pt; font-family: 'Yu Gothic UI', Arial, sans-serif;
- Header tabel (th): background-color: #f1f5f9; font-weight: bold; padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left; color: #0f172a;
- Sel tabel (td): padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: top;
- Output HANYA berupa kode HTML div murni (tanpa tag <html>/<body>, tanpa triple backticks).
`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    maxOutputTokens: 8192,
                }
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
                details: `RPM Modul Ajar: ${formData.topic}`,
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
        const footerText = `RPM Modul Ajar (Deep Learning) - ${formData.subject} - ${formData.className} | Disusun oleh: ${userIdentity.authorName}`;

        const htmlContent = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head>
            <meta charset='utf-8'>
            <title>RPM Modul Ajar ${formData.subject}</title>
            <style>
              @page {
                size: ${size.width} ${size.height};
                mso-page-orientation: portrait;
                margin: 2cm 2cm 2cm 2cm;
                mso-header-margin: 36pt;
                mso-footer-margin: 36pt;
                mso-paper-source: 0;
              }
              body {
                font-family: 'Yu Gothic UI', 'Segoe UI', Arial, 'Helvetica Neue', sans-serif;
                font-size: 11pt;
                line-height: 1.45;
                color: #1f2937;
              }
              h1 {
                font-family: 'Yu Gothic UI', Arial, sans-serif;
                font-size: 15pt;
                font-weight: bold;
                text-align: center;
                color: #111827;
                margin: 0 0 4pt 0;
                text-transform: uppercase;
              }
              h2 {
                font-family: 'Yu Gothic UI', Arial, sans-serif;
                font-size: 12.5pt;
                font-weight: bold;
                color: #059669;
                text-transform: uppercase;
                margin-top: 16pt;
                margin-bottom: 6pt;
                border-bottom: 2px solid #059669;
                padding-bottom: 2pt;
              }
              h3 {
                font-family: 'Yu Gothic UI', Arial, sans-serif;
                font-size: 11pt;
                font-weight: bold;
                color: #111827;
                margin-top: 10pt;
                margin-bottom: 4pt;
              }
              p, li {
                margin-top: 3pt;
                margin-bottom: 4pt;
                line-height: 1.45;
              }
              table {
                border-collapse: collapse;
                width: 100%;
                margin-top: 6pt;
                margin-bottom: 10pt;
                font-size: 10.5pt;
              }
              td, th {
                border: 1px solid #cbd5e1;
                padding: 5pt 7pt;
                vertical-align: top;
              }
              th {
                background-color: #f1f5f9;
                font-weight: bold;
                color: #0f172a;
                text-align: left;
              }
              ul, ol {
                margin-top: 3pt;
                margin-bottom: 5pt;
                padding-left: 18pt;
              }
              img {
                max-width: 100%;
                height: auto;
                margin: 10px 0;
                border: 1px solid #cbd5e1;
              }
              div.f1 {
                margin-top: 15pt;
                font-size: 9pt;
                text-align: right;
                color: #6b7280;
                border-top: 1px solid #cbd5e1;
                padding-top: 5pt;
              }
            </style>
          </head>
          <body>
            ${resultContent}
            ${generatedImageUrl ? `<br/><h2>LAMPIRAN VISUAL LKPD</h2><div style="text-align: center;"><img src="${generatedImageUrl}" alt="Ilustrasi Materi" width="400" /></div>` : ''}
            <div style='mso-element:footer' id='f1'><div class='f1'>${footerText} - Halaman <span style='mso-field-code:" PAGE "'></span></div></div>
          </body>
          </html>
        `;

        const cleanTopic = formData.topic.replace(/[\\/:*?"<>|\r\n]+/g, '_').substring(0, 25);
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

// --- Admin Dashboard Component ---
const AdminDashboard = ({ onBack }: { onBack: () => void }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editAssignedClass, setEditAssignedClass] = useState('Kelas 1');
  const [editInstitution, setEditInstitution] = useState('');
  
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const fbUsers: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() || {};
        fbUsers.push({ 
          id: doc.id, 
          email: typeof data.email === 'string' ? data.email : doc.id, 
          ...data 
        });
      });

      const localKeys = await usersDB.keys();
      for (const key of localKeys) {
        if (!key || typeof key !== 'string') continue;
        const localUser = await usersDB.getItem<any>(key);
        if (localUser && !fbUsers.find(u => u && u.email && typeof u.email === 'string' && String(u.email).toLowerCase() === String(key).toLowerCase())) {
          const emailNormalized = String(key).toLowerCase();
          const userDocRef = doc(db, 'users', emailNormalized);
          const newUserData = {
            email: emailNormalized,
            name: localUser.name || emailNormalized.split('@')[0],
            password: localUser.password || '',
            assignedClass: localUser.assignedClass || 'Kelas 1',
            institutionName: localUser.institutionName || 'Sekolah Dasar',
            activeSessionId: localUser.activeSessionId || '',
            lastActive: Date.now()
          };
          await setDoc(userDocRef, newUserData);
          fbUsers.push(newUserData);
        }
      }
      setUsers(fbUsers);
    } catch (e) {
      console.error("Gagal mengambil data user", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveEdit = async () => {
    if (!editingUser || !editingUser.email || typeof editingUser.email !== 'string') return;
    try {
      const emailNormalized = editingUser.email.toLowerCase().trim();
      const userDocRef = doc(db, 'users', emailNormalized);
      const updateData = {
        name: editName,
        password: editPassword,
        assignedClass: editAssignedClass,
        institutionName: editInstitution,
        activeSessionId: ''
      };
      await updateDoc(userDocRef, updateData);
      const prevLocal = await usersDB.getItem<any>(emailNormalized) || {};
      await usersDB.setItem(emailNormalized, {
        ...prevLocal,
        email: emailNormalized,
        ...updateData
      });
      setEditingUser(null);
      fetchUsers();
    } catch (e) {
      console.error("Gagal memperbarui user", e);
      alert("Gagal memperbarui user: " + (e as Error).message);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser || !deletingUser.email || typeof deletingUser.email !== 'string') return;
    try {
      const emailNormalized = deletingUser.email.toLowerCase().trim();
      await deleteDoc(doc(db, 'users', emailNormalized));
      await usersDB.removeItem(emailNormalized);
      setDeletingUser(null);
      fetchUsers();
    } catch (e) {
      console.error("Gagal menghapus user", e);
      alert("Gagal menghapus user: " + (e as Error).message);
    }
  };

  const handleForceLogout = async (userEmail: string) => {
    if (!userEmail || typeof userEmail !== 'string') return;
    try {
      const emailNormalized = userEmail.toLowerCase().trim();
      const userDocRef = doc(db, 'users', emailNormalized);
      await updateDoc(userDocRef, {
        activeSessionId: ''
      });
      const localData = await usersDB.getItem<any>(emailNormalized);
      if (localData) {
        await usersDB.setItem(emailNormalized, { ...localData, activeSessionId: '' });
      }
      fetchUsers();
      alert("Sesi pengguna berhasil diputus secara paksa!");
    } catch (e) {
      console.error("Gagal mengeluarkan user", e);
      alert("Gagal mengeluarkan user: " + (e as Error).message);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = String(searchTerm || '').toLowerCase();
    return users.filter(u => {
      if (!u) return false;
      const email = typeof u.email === 'string' ? u.email : '';
      const name = typeof u.name === 'string' ? u.name : '';
      const assignedClass = typeof u.assignedClass === 'string' ? u.assignedClass : '';
      const inst = typeof u.institutionName === 'string' ? u.institutionName : '';
      return String(email).toLowerCase().includes(q) || 
             String(name).toLowerCase().includes(q) ||
             String(assignedClass).toLowerCase().includes(q) ||
             String(inst).toLowerCase().includes(q);
    });
  }, [users, searchTerm]);

  const togglePasswordVisibility = (email: string) => {
    setShowPasswordMap(prev => ({ ...prev, [email]: !prev[email] }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col p-4 md:p-8 animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Header Panel */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-all border border-slate-200 text-slate-600">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900">Panel Admin</h1>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Berdaulat
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm">Kelola pengguna terdaftar, kelas yang diampu, dan sesi perangkat aktif</p>
            </div>
          </div>
          <button onClick={fetchUsers} disabled={loading} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 text-slate-700 disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
          </button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-xs">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Pengguna</p>
              <h3 className="text-2xl font-black text-slate-800">{users.length}</h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-xs">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Sesi Terkoneksi</p>
              <h3 className="text-2xl font-black text-slate-800">{users.filter(u => !!u.activeSessionId).length}</h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-xs">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Database Terhubung</p>
              <h3 className="text-2xl font-black text-slate-800">Firestore Cloud</h3>
            </div>
          </div>
        </div>

        {/* Users List Card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
            <h3 className="font-extrabold text-slate-800 text-lg">Daftar Pengguna Terdaftar</h3>
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, email, kelas..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <p className="text-sm font-semibold">Mengambil data dari server...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <User className="w-12 h-12 text-slate-300" />
              <p className="text-sm font-semibold">Tidak ada pengguna yang cocok dengan kriteria pencarian.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-100 uppercase tracking-wider">
                    <th className="px-6 py-4">Nama Lengkap</th>
                    <th className="px-6 py-4">Kelas Diampu</th>
                    <th className="px-6 py-4">Alamat Email</th>
                    <th className="px-6 py-4">Kata Sandi</th>
                    <th className="px-6 py-4">Sesi Aktif</th>
                    <th className="px-6 py-4 text-right">Aksi & Kontrol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredUsers.map(u => (
                    <tr key={u.email} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{u.name}</div>
                        {u.institutionName && <div className="text-xs text-slate-400 font-normal">{u.institutionName}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {u.assignedClass || 'Kelas 1'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-xs">{u.email}</td>
                      <td className="px-6 py-4 text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">
                            {showPasswordMap[u.email] ? u.password : '••••••••'}
                          </span>
                          <button onClick={() => togglePasswordVisibility(u.email)} className="p-1 hover:bg-slate-200 rounded transition-all text-slate-400 hover:text-slate-600 cursor-pointer">
                            {showPasswordMap[u.email] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {u.activeSessionId ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-mono text-slate-500 truncate max-w-[120px]" title={u.activeSessionId}>
                              {u.activeSessionId.substring(0, 12)}...
                            </span>
                            <button onClick={() => handleForceLogout(u.email)} className="text-[10px] bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 px-2 py-0.5 rounded transition-all cursor-pointer font-bold ml-1">
                              Putus Sesi
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Offline</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setEditName(u.name || '');
                              setEditPassword(u.password || '');
                              setEditAssignedClass(u.assignedClass || 'Kelas 1');
                              setEditInstitution(u.institutionName || '');
                            }}
                            className="p-2 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-xl text-blue-600 transition-all cursor-pointer"
                            title="Edit Pengguna"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingUser(u)}
                            className="p-2 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-xl text-red-600 transition-all cursor-pointer"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">Perbarui Akun Pengguna</h3>
              <button onClick={() => setEditingUser(null)} className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Kelas yang Diampu</label>
                <select
                  value={editAssignedClass}
                  onChange={e => setEditAssignedClass(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all font-semibold"
                >
                  {['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'].map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Nama Sekolah / Instansi</label>
                <input
                  type="text"
                  value={editInstitution}
                  onChange={e => setEditInstitution(e.target.value)}
                  placeholder="Contoh: SD Negeri 1 Merdeka"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Kata Sandi Baru</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all font-mono"
                />
              </div>
              <p className="text-[10px] text-amber-600 font-bold leading-relaxed flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Catatan: Memperbarui profil akan secara otomatis memutuskan sesi aktif pengguna ini agar mereka harus login kembali.
              </p>
              <div className="pt-4 border-t flex justify-end gap-2">
                <button onClick={() => setEditingUser(null)} className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer">
                  Batal
                </button>
                <button onClick={handleSaveEdit} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer">
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 animate-in zoom-in-95">
            <div className="p-5 bg-red-600 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">Hapus Akun Pengguna?</h3>
              <button onClick={() => setDeletingUser(null)} className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-600 text-sm leading-relaxed">
                Apakah Anda yakin ingin menghapus akun milik <strong className="text-slate-800">{deletingUser.name || deletingUser.email}</strong>? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
              </p>
              <div className="pt-4 border-t flex justify-end gap-2">
                <button onClick={() => setDeletingUser(null)} className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer">
                  Batal
                </button>
                <button onClick={handleDeleteUser} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer">
                  Ya, Hapus Permanen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
    nip?: string;
    institutionName: string;
    npsn?: string;
    kepalaSekolah?: string;
    nipKepalaSekolah?: string;
    academicYear: string;
    semester: string;
    assignedClass: string;
    employmentStatus?: string;
    customApiKey?: string;
}

interface StudentRecord {
    id: string;
    nisn: string;
    nis: string;
    name: string;
    gender: 'L' | 'P';
    notes?: string;
}

interface JournalRecord {
    id: string;
    date: string;
    timeSlot: string;
    subject: string;
    topic: string;
    activity: string;
    notes: string;
}

// --- Edit Profile Modal ---
const EditProfileModal: React.FC<{
    identity: UserIdentity;
    onSave: (updated: UserIdentity) => void;
    onClose: () => void;
}> = ({ identity, onSave, onClose }) => {
    const [form, setForm] = useState<UserIdentity>({
        authorName: identity.authorName || 'Acep Miftah Hilah Ash-shidiq, S.Pd.',
        nip: identity.nip || '199602152025211094',
        institutionName: identity.institutionName || 'SDN SUKATINGGAL',
        npsn: identity.npsn || '20206022',
        kepalaSekolah: identity.kepalaSekolah || 'Yuni Sri Rahayu, S.Pd.',
        nipKepalaSekolah: identity.nipKepalaSekolah || '198706162019032007',
        academicYear: identity.academicYear || '2026-2027',
        semester: identity.semester || 'Ganjil (Semester 1)',
        assignedClass: identity.assignedClass || 'Kelas 1',
        employmentStatus: identity.employmentStatus || 'Full Time',
        customApiKey: identity.customApiKey || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Perbarui Profil Pengguna</h3>
                            <p className="text-xs text-slate-500">Sesuaikan data identitas guru dan sekolah Anda</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-bold text-slate-700 mb-1">Nama Guru & Gelar</label>
                            <input 
                                type="text" 
                                required
                                value={form.authorName} 
                                onChange={e => setForm({...form, authorName: e.target.value})}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                                placeholder="Acep Miftah Hilah Ash-shidiq, S.Pd."
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1">NIP Guru</label>
                            <input 
                                type="text" 
                                value={form.nip || ''} 
                                onChange={e => setForm({...form, nip: e.target.value})}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                                placeholder="199602152025211094"
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1">Nama Sekolah / Instansi</label>
                            <input 
                                type="text" 
                                required
                                value={form.institutionName} 
                                onChange={e => setForm({...form, institutionName: e.target.value})}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                                placeholder="SDN SUKATINGGAL"
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1">NPSN Sekolah</label>
                            <input 
                                type="text" 
                                value={form.npsn || ''} 
                                onChange={e => setForm({...form, npsn: e.target.value})}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                                placeholder="20206022"
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1">Nama Kepala Sekolah</label>
                            <input 
                                type="text" 
                                value={form.kepalaSekolah || ''} 
                                onChange={e => setForm({...form, kepalaSekolah: e.target.value})}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                                placeholder="Yuni Sri Rahayu, S.Pd."
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1">NIP Kepala Sekolah</label>
                            <input 
                                type="text" 
                                value={form.nipKepalaSekolah || ''} 
                                onChange={e => setForm({...form, nipKepalaSekolah: e.target.value})}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                                placeholder="198706162019032007"
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1">Tahun Pelajaran</label>
                            <input 
                                type="text" 
                                value={form.academicYear} 
                                onChange={e => setForm({...form, academicYear: e.target.value})}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                                placeholder="2026-2027"
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1">Semester</label>
                            <select
                                value={form.semester}
                                onChange={e => setForm({...form, semester: e.target.value})}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                            >
                                <option value="Ganjil (Semester 1)">Ganjil (Semester 1)</option>
                                <option value="Genap (Semester 2)">Genap (Semester 2)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1">Kelas yang Diampu</label>
                            <select
                                value={form.assignedClass}
                                onChange={e => setForm({...form, assignedClass: e.target.value})}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                            >
                                {['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1">Status Kepegawaian</label>
                            <select
                                value={form.employmentStatus || 'Full Time'}
                                onChange={e => setForm({...form, employmentStatus: e.target.value})}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                            >
                                <option value="Full Time">Full Time</option>
                                <option value="PNS">PNS</option>
                                <option value="PPPK">PPPK</option>
                                <option value="Guru Honorer">Guru Honorer</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <Check className="w-4 h-4" /> Simpan Perubahan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Dashboard View Component ---
const DashboardView: React.FC<{
    identity: UserIdentity;
    onEditProfile: () => void;
    onNavigate: (view: any) => void;
}> = ({ identity, onEditProfile, onNavigate }) => {
    return (
        <div className="max-w-5xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
            {/* Main Profile Card (Mirroring screenshot) */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 md:p-8 relative overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">Ikhtisar Profil</h2>
                        <p className="text-xs md:text-sm text-slate-500 mt-0.5">Informasi data diri dan sekolah Anda.</p>
                    </div>
                    <button
                        onClick={onEditProfile}
                        className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-2 transition-all cursor-pointer hover:border-slate-300"
                    >
                        <Edit className="w-3.5 h-3.5 text-slate-500" />
                        <span>Perbarui Profil</span>
                    </button>
                </div>

                {/* 2-Column Info Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-4 mt-6">
                    <div className="bg-slate-50/60 border border-slate-200/70 rounded-2xl p-4 transition-all hover:bg-slate-50">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NAMA GURU</div>
                        <div className="text-sm font-bold text-slate-800 mt-1">{identity.authorName || 'Acep Miftah Hilah Ash-shidiq, S.Pd.'}</div>
                    </div>

                    <div className="bg-slate-50/60 border border-slate-200/70 rounded-2xl p-4 transition-all hover:bg-slate-50">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NIP GURU</div>
                        <div className="text-sm font-bold text-slate-800 mt-1">{identity.nip || '199602152025211094'}</div>
                    </div>

                    <div className="bg-slate-50/60 border border-slate-200/70 rounded-2xl p-4 transition-all hover:bg-slate-50">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SEKOLAH</div>
                        <div className="text-sm font-bold text-slate-800 mt-1">{identity.institutionName || 'SDN SUKATINGGAL'}</div>
                    </div>

                    <div className="bg-slate-50/60 border border-slate-200/70 rounded-2xl p-4 transition-all hover:bg-slate-50">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NPSN</div>
                        <div className="text-sm font-bold text-slate-800 mt-1">{identity.npsn || '20206022'}</div>
                    </div>

                    <div className="bg-slate-50/60 border border-slate-200/70 rounded-2xl p-4 transition-all hover:bg-slate-50">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KEPALA SEKOLAH</div>
                        <div className="text-sm font-bold text-slate-800 mt-1">{identity.kepalaSekolah || 'Yuni Sri Rahayu, S.Pd.'}</div>
                    </div>

                    <div className="bg-slate-50/60 border border-slate-200/70 rounded-2xl p-4 transition-all hover:bg-slate-50">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NIP KEPALA SEKOLAH</div>
                        <div className="text-sm font-bold text-slate-800 mt-1">{identity.nipKepalaSekolah || '198706162019032007'}</div>
                    </div>

                    <div className="bg-slate-50/60 border border-slate-200/70 rounded-2xl p-4 md:col-span-2 transition-all hover:bg-slate-50">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TAHUN PELAJARAN & KELAS AMPU</div>
                        <div className="text-sm font-bold text-slate-800 mt-1 flex items-center justify-between">
                            <span>{identity.academicYear || '2026-2027'} • {identity.semester || 'Ganjil (Semester 1)'}</span>
                            <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-extrabold">{identity.assignedClass || 'Kelas 1'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Access Feature Grid */}
            <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 px-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Akses Cepat Modul & Fitur Utama</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div 
                        onClick={() => onNavigate('generator')}
                        className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                    >
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <FileText className="w-5 h-5" />
                            </div>
                            <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm">Program Tahunan (Prota)</h4>
                            <p className="text-xs text-slate-500 mt-1">Generasi otomatis CP, TP, ATP, dan Prota Kurikulum Merdeka.</p>
                        </div>
                        <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600">Buka Menu <ChevronRight className="w-3.5 h-3.5" /></span>
                    </div>

                    <div 
                        onClick={() => onNavigate('modul_ajar')}
                        className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                    >
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <h4 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors text-sm">Modul Ajar RPM</h4>
                            <p className="text-xs text-slate-500 mt-1">Rencana Pembelajaran Mendalam (Permendikdasmen No. 13/2025).</p>
                        </div>
                        <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-purple-600">Buka Modul <ChevronRight className="w-3.5 h-3.5" /></span>
                    </div>

                    <div 
                        onClick={() => onNavigate('calendar')}
                        className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                    >
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <h4 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors text-sm">Kalender Akademik</h4>
                            <p className="text-xs text-slate-500 mt-1">Perhitungan Pekan/Hari Efektif Belajar & Agenda Sekolah.</p>
                        </div>
                        <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-amber-600">Lihat Kalender <ChevronRight className="w-3.5 h-3.5" /></span>
                    </div>

                    <div 
                        onClick={() => onNavigate('daftar_siswa')}
                        className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                    >
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <Users className="w-5 h-5" />
                            </div>
                            <h4 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors text-sm">Daftar Siswa & Presensi</h4>
                            <p className="text-xs text-slate-500 mt-1">Manajemen roster siswa dan pencatatan presensi kelas.</p>
                        </div>
                        <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-600">Kelola Siswa <ChevronRight className="w-3.5 h-3.5" /></span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Daftar Siswa View Component ---
const DaftarSiswaView: React.FC<{
    selectedClass: string;
    identity: UserIdentity;
}> = ({ selectedClass, identity }) => {
    const [students, setStudents] = useState<StudentRecord[]>(() => {
        try {
            const saved = localStorage.getItem(`prota_students_${selectedClass}`);
            if (saved) return JSON.parse(saved);
        } catch(e) {}
        return [
            { id: '1', nisn: '0123456701', nis: '1001', name: 'Ahmad Rizky Pratama', gender: 'L', notes: 'Aktif' },
            { id: '2', nisn: '0123456702', nis: '1002', name: 'Aisyah Nur Syafiqah', gender: 'P', notes: 'Aktif' },
            { id: '3', nisn: '0123456703', nis: '1003', name: 'Bagas Aditya Putra', gender: 'L', notes: 'Aktif' },
            { id: '4', nisn: '0123456704', nis: '1004', name: 'Citra Dewi Kirana', gender: 'P', notes: 'Aktif' },
            { id: '5', nisn: '0123456705', nis: '1005', name: 'Dafa Alamsyah', gender: 'L', notes: 'Aktif' },
        ];
    });

    useEffect(() => {
        localStorage.setItem(`prota_students_${selectedClass}`, JSON.stringify(students));
    }, [students, selectedClass]);

    const [newName, setNewName] = useState('');
    const [newNisn, setNewNisn] = useState('');
    const [newNis, setNewNis] = useState('');
    const [newGender, setNewGender] = useState<'L' | 'P'>('L');
    const [search, setSearch] = useState('');

    const handleAddStudent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        const newStudent: StudentRecord = {
            id: Date.now().toString(),
            nisn: newNisn || `012345${Math.floor(1000+Math.random()*9000)}`,
            nis: newNis || `${1000 + students.length + 1}`,
            name: newName,
            gender: newGender,
            notes: 'Aktif'
        };
        setStudents([...students, newStudent]);
        setNewName('');
        setNewNisn('');
        setNewNis('');
    };

    const handleDelete = (id: string) => {
        setStudents(students.filter(s => s.id !== id));
    };

    const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.nisn.includes(search));

    const handleDownloadDoc = () => {
        const rows = students.map((s, idx) => `
            <tr>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${idx+1}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${s.nisn}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${s.nis}</td>
                <td style="border: 1px solid #000; padding: 6px;">${s.name}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${s.gender}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${s.notes || 'Aktif'}</td>
            </tr>
        `).join('');

        const html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
            <head><meta charset='utf-8'><title>Daftar Siswa - ${selectedClass}</title>
            <style>
                @page { size: A4 portrait; margin: 2cm; }
                body { font-family: 'Arial', sans-serif; font-size: 11pt; }
                table { border-collapse: collapse; width: 100%; margin-top: 15px; }
                th { border: 1px solid #000; background: #e2e8f0; padding: 8px; text-align: center; }
            </style>
            </head>
            <body>
                <h2 style="text-align: center; font-size: 14pt; margin-bottom: 4px;">DAFTAR SISWA AMPU ${selectedClass.toUpperCase()}</h2>
                <h3 style="text-align: center; font-size: 12pt; margin-top: 0; font-weight: normal;">${identity.institutionName || 'SDN SUKATINGGAL'} - TAHUN PELAJARAN ${identity.academicYear}</h3>
                <p><b>Wali Kelas / Guru:</b> ${identity.authorName} | <b>NIP:</b> ${identity.nip || '-'}</p>
                <table>
                    <thead>
                        <tr>
                            <th width="5%">NO</th>
                            <th width="20%">NISN</th>
                            <th width="15%">NIS</th>
                            <th>NAMA LENGKAP SISWA</th>
                            <th width="12%">L/P</th>
                            <th width="15%">KETERANGAN</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Daftar_Siswa_${selectedClass.replace(/\s+/g, '_')}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 md:p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-emerald-600" />
                        <span>Daftar Siswa ({selectedClass})</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Data roster siswa terdaftar untuk kelas ampu aktif Anda.</p>
                </div>
                <button
                    onClick={handleDownloadDoc}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                    <Download className="w-4 h-4" /> Unduh Format Word
                </button>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleAddStudent} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                <input 
                    type="text" 
                    placeholder="Nama Lengkap Siswa"
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                    className="p-2.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500 md:col-span-2"
                />
                <input 
                    type="text" 
                    placeholder="NISN"
                    value={newNisn} 
                    onChange={e => setNewNisn(e.target.value)} 
                    className="p-2.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <select 
                    value={newGender} 
                    onChange={e => setNewGender(e.target.value as 'L' | 'P')}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                </select>
                <button 
                    type="submit" 
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                    <Plus className="w-4 h-4" /> Tambah
                </button>
            </form>

            {/* Filter Search */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-xs">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input 
                        type="text" 
                        placeholder="Cari siswa..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <div className="text-xs font-bold text-slate-500 flex gap-3">
                    <span>Total: <strong className="text-slate-800">{students.length}</strong></span>
                    <span>L: <strong className="text-blue-600">{students.filter(s => s.gender === 'L').length}</strong></span>
                    <span>P: <strong className="text-pink-600">{students.filter(s => s.gender === 'P').length}</strong></span>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                        <tr>
                            <th className="p-3 text-center w-12">No</th>
                            <th className="p-3">NISN</th>
                            <th className="p-3">NIS</th>
                            <th className="p-3">Nama Lengkap</th>
                            <th className="p-3 text-center w-20">L/P</th>
                            <th className="p-3 text-center w-24">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                        {filtered.map((s, idx) => (
                            <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                                <td className="p-3 font-mono text-slate-600">{s.nisn}</td>
                                <td className="p-3 font-mono text-slate-600">{s.nis}</td>
                                <td className="p-3 font-bold text-slate-800">{s.name}</td>
                                <td className="p-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${s.gender === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                        {s.gender}
                                    </span>
                                </td>
                                <td className="p-3 text-center">
                                    <button onClick={() => handleDelete(s.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer" title="Hapus">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-400">Belum ada data siswa untuk kelas ini.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Presensi View Component ---
const PresensiView: React.FC<{
    selectedClass: string;
    identity: UserIdentity;
}> = ({ selectedClass, identity }) => {
    const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState<Record<string, 'H' | 'S' | 'I' | 'A'>>({});

    const sampleStudents = [
        { id: '1', name: 'Ahmad Rizky Pratama' },
        { id: '2', name: 'Aisyah Nur Syafiqah' },
        { id: '3', name: 'Bagas Aditya Putra' },
        { id: '4', name: 'Citra Dewi Kirana' },
        { id: '5', name: 'Dafa Alamsyah' },
    ];

    const toggleStatus = (id: string, status: 'H' | 'S' | 'I' | 'A') => {
        setAttendance(prev => ({ ...prev, [id]: status }));
    };

    const countStatus = (s: 'H' | 'S' | 'I' | 'A') => Object.values(attendance).filter(v => v === s).length;

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 md:p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                        <span>Presensi Kehadiran Siswa ({selectedClass})</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Pencatatan rekapitulasi kehadiran harian peserta didik.</p>
                </div>
                <div className="flex items-center gap-3">
                    <input 
                        type="date" 
                        value={date} 
                        onChange={e => setDate(e.target.value)} 
                        className="p-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                    />
                </div>
            </div>

            {/* Summary Counters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                    <div className="font-extrabold text-emerald-700 text-lg">{countStatus('H')}</div>
                    <div className="text-[10px] font-bold text-emerald-600 uppercase">Hadir (H)</div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-center">
                    <div className="font-extrabold text-blue-700 text-lg">{countStatus('S')}</div>
                    <div className="text-[10px] font-bold text-blue-600 uppercase">Sakit (S)</div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                    <div className="font-extrabold text-amber-700 text-lg">{countStatus('I')}</div>
                    <div className="text-[10px] font-bold text-amber-600 uppercase">Izin (I)</div>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-center">
                    <div className="font-extrabold text-red-700 text-lg">{countStatus('A')}</div>
                    <div className="text-[10px] font-bold text-red-600 uppercase">Alpa (A)</div>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                        <tr>
                            <th className="p-3 text-center w-12">No</th>
                            <th className="p-3">Nama Siswa</th>
                            <th className="p-3 text-center">Status Kehadiran</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                        {sampleStudents.map((s, idx) => {
                            const status = attendance[s.id] || 'H';
                            return (
                                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                                    <td className="p-3 font-bold text-slate-800">{s.name}</td>
                                    <td className="p-3 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            {(['H', 'S', 'I', 'A'] as const).map(st => (
                                                <button
                                                    key={st}
                                                    onClick={() => toggleStatus(s.id, st)}
                                                    className={`w-8 h-8 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                                                        status === st 
                                                            ? st === 'H' ? 'bg-emerald-600 text-white shadow-xs' 
                                                            : st === 'S' ? 'bg-blue-600 text-white shadow-xs' 
                                                            : st === 'I' ? 'bg-amber-600 text-white shadow-xs' 
                                                            : 'bg-red-600 text-white shadow-xs' 
                                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {st}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Jadwal Mengajar View Component ---
interface ScheduleSlot {
    id: string;
    jamKe: string;
    time: string;
    subject: string;
    jp: number;
    notes?: string;
}

export const MAPEL_CATEGORIES = [
    {
        category: "Mata Pelajaran Umum & Agama",
        options: [
            "Pendidikan Agama Islam dan Budi Pekerti",
            "Pendidikan Agama Kristen dan Budi Pekerti",
            "Pendidikan Agama Katolik dan Budi Pekerti",
            "Pendidikan Agama Hindu dan Budi Pekerti",
            "Pendidikan Agama Buddha dan Budi Pekerti",
            "Pendidikan Agama Khonghucu dan Budi Pekerti",
            "Pendidikan Pancasila",
            "Bahasa Indonesia",
            "Matematika",
            "IPAS (Ilmu Pengetahuan Alam dan Sosial)",
            "PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan)",
            "Seni Rupa",
            "Seni Musik",
            "Seni Tari",
            "Seni Teater",
            "Bahasa Inggris",
            "Koding & Kecerdasan Artifisial"
        ]
    },
    {
        category: "Muatan Lokal (Mulok)",
        options: [
            "Muatan Lokal (Bahasa Daerah / Bahasa Sunda / Jawa)",
            "Muatan Lokal (Guru Mengaji)"
        ]
    },
    {
        category: "Kokurikuler Gerakan 7 Kebiasaan Indonesia Hebat",
        options: [
            "Kokurikuler 7 Kebiasaan Indonesia Hebat: Bangun Pagi",
            "Kokurikuler 7 Kebiasaan Indonesia Hebat: Tidur Cepat",
            "Kokurikuler 7 Kebiasaan Indonesia Hebat: Beribadah",
            "Kokurikuler 7 Kebiasaan Indonesia Hebat: Gemar Belajar",
            "Kokurikuler 7 Kebiasaan Indonesia Hebat: Berolahraga",
            "Kokurikuler 7 Kebiasaan Indonesia Hebat: Makan Sehat dan Bergizi",
            "Kokurikuler 7 Kebiasaan Indonesia Hebat: Bermasyarakat"
        ]
    },
    {
        category: "Projek, Ekstrakurikuler & Pembiasaan",
        options: [
            "P5 (Projek Penguatan Profil Pelajar Pancasila)",
            "Ekstrakurikuler / Pembiasaan",
            "Istirahat / Upacara"
        ]
    }
];

const ALL_MAPEL_OPTIONS = MAPEL_CATEGORIES.flatMap(cat => cat.options);

const getDefaultScheduleForClass = (workingDays: number): Record<string, ScheduleSlot[]> => {
    const days = workingDays === 5 ? ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] : ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const defaultData: Record<string, ScheduleSlot[]> = {
        'Senin': [
            { id: '1', jamKe: '1', time: '07.00 - 07.40', subject: 'Istirahat / Upacara', jp: 1, notes: 'Lapangan Sekolah' },
            { id: '2', jamKe: '2', time: '07.40 - 08.15', subject: 'Kokurikuler 7 Kebiasaan Indonesia Hebat: Bangun Pagi', jp: 1, notes: 'Ruang Kelas' },
            { id: '3', jamKe: '3 - 5', time: '08.15 - 10.00', subject: 'PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan)', jp: 3, notes: 'Lapangan Sekolah' },
            { id: '4', jamKe: '6', time: '10.00 - 10.45', subject: 'Istirahat / Upacara', jp: 1, notes: 'Kantin / Istirahat' },
            { id: '5', jamKe: '7 - 10', time: '10.45 - 13.05', subject: 'Bahasa Indonesia', jp: 4, notes: 'Ruang Kelas' },
            { id: '6', jamKe: '11', time: '13.05 - 13.40', subject: 'Koding & Kecerdasan Artifisial', jp: 1, notes: 'Lab Komputer' }
        ],
        'Selasa': [
            { id: '1', jamKe: '1', time: '07.00 - 07.40', subject: 'Kokurikuler 7 Kebiasaan Indonesia Hebat: Gemar Belajar', jp: 1, notes: 'Ruang Kelas' },
            { id: '2', jamKe: '2 - 5', time: '07.40 - 10.00', subject: 'Pendidikan Pancasila', jp: 4, notes: 'Ruang Kelas' },
            { id: '3', jamKe: '6', time: '10.00 - 10.45', subject: 'Istirahat / Upacara', jp: 1, notes: 'Kantin / Istirahat' },
            { id: '4', jamKe: '7 - 10', time: '10.45 - 13.05', subject: 'Matematika', jp: 4, notes: 'Ruang Kelas' }
        ],
        'Rabu': [
            { id: '1', jamKe: '1', time: '07.00 - 07.40', subject: 'Kokurikuler 7 Kebiasaan Indonesia Hebat: Berolahraga', jp: 1, notes: 'Lapangan' },
            { id: '2', jamKe: '2', time: '07.40 - 08.15', subject: 'Kokurikuler 7 Kebiasaan Indonesia Hebat: Bermasyarakat', jp: 1, notes: 'Ruang Kelas' },
            { id: '3', jamKe: '3 - 4', time: '08.15 - 09.25', subject: 'IPAS (Ilmu Pengetahuan Alam dan Sosial)', jp: 2, notes: 'Ruang Kelas / Lab' },
            { id: '4', jamKe: '5', time: '09.25 - 10.00', subject: 'Seni Rupa', jp: 1, notes: 'Ruang Kelas' },
            { id: '5', jamKe: '6', time: '10.00 - 10.45', subject: 'Istirahat / Upacara', jp: 1, notes: 'Kantin / Istirahat' },
            { id: '6', jamKe: '7', time: '10.45 - 11.20', subject: 'IPAS (Ilmu Pengetahuan Alam dan Sosial)', jp: 1, notes: 'Ruang Kelas' },
            { id: '7', jamKe: '8 - 9', time: '11.20 - 12.30', subject: 'Seni Rupa', jp: 2, notes: 'Ruang Kelas' },
            { id: '8', jamKe: '10 - 12', time: '12.30 - 14.15', subject: 'Bahasa Indonesia', jp: 3, notes: 'Ruang Kelas' }
        ],
        'Kamis': [
            { id: '1', jamKe: '1', time: '07.00 - 07.40', subject: 'Kokurikuler 7 Kebiasaan Indonesia Hebat: Makan Sehat dan Bergizi', jp: 1, notes: 'Ruang Kelas' },
            { id: '2', jamKe: '2 - 3', time: '07.40 - 08.50', subject: 'Bahasa Inggris', jp: 2, notes: 'Ruang Kelas' },
            { id: '3', jamKe: '4 - 5', time: '08.50 - 10.00', subject: 'Muatan Lokal (Bahasa Daerah / Bahasa Sunda / Jawa)', jp: 2, notes: 'Ruang Kelas' },
            { id: '4', jamKe: '6', time: '10.00 - 10.45', subject: 'Istirahat / Upacara', jp: 1, notes: 'Kantin / Istirahat' },
            { id: '5', jamKe: '7 - 9', time: '10.45 - 12.30', subject: 'Pendidikan Agama Islam dan Budi Pekerti', jp: 3, notes: 'Musholla / Kelas' },
            { id: '6', jamKe: '10 - 11', time: '12.30 - 13.40', subject: 'Ekstrakurikuler / Pembiasaan', jp: 2, notes: 'Pramuka / Lapangan' }
        ],
        'Jumat': [
            { id: '1', jamKe: '1', time: '07.00 - 07.40', subject: 'Kokurikuler 7 Kebiasaan Indonesia Hebat: Beribadah', jp: 1, notes: 'Musholla' },
            { id: '2', jamKe: '2 - 3', time: '07.40 - 08.50', subject: 'Muatan Lokal (Guru Mengaji)', jp: 2, notes: 'Musholla' },
            { id: '3', jamKe: '4 - 5', time: '08.50 - 10.00', subject: 'IPAS (Ilmu Pengetahuan Alam dan Sosial)', jp: 2, notes: 'Ruang Kelas' },
            { id: '4', jamKe: '6', time: '10.00 - 10.45', subject: 'Istirahat / Upacara', jp: 1, notes: 'Kantin / Istirahat' },
            { id: '5', jamKe: '7', time: '10.45 - 11.20', subject: 'Pendidikan Pancasila', jp: 1, notes: 'Ruang Kelas' }
        ],
        'Sabtu': [
            { id: '1', jamKe: '1 - 3', time: '07.00 - 08.45', subject: 'Ekstrakurikuler / Pembiasaan', jp: 3, notes: 'Pramuka / Kebersihan' },
            { id: '2', jamKe: '4 - 5', time: '09.00 - 10.10', subject: 'Muatan Lokal (Bahasa Daerah / Bahasa Sunda / Jawa)', jp: 2, notes: 'Ruang Kelas' }
        ]
    };

    const res: Record<string, ScheduleSlot[]> = {};
    days.forEach(day => {
        res[day] = defaultData[day] || [];
    });
    return res;
};

// --- Time Calculation Helpers (1 JP = 35 Menit) ---
const parseTimeToMinutes = (timeStr: string, defaultMinutes: number = 450): number => {
    if (!timeStr) return defaultMinutes;
    const clean = timeStr.trim().replace(':', '.');
    const parts = clean.split('.');
    if (parts.length >= 2) {
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
    }
    return defaultMinutes;
};

const formatMinutesToTime = (totalMinutes: number): string => {
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    const hStr = h < 10 ? `0${h}` : `${h}`;
    const mStr = m < 10 ? `0${m}` : `${m}`;
    return `${hStr}.${mStr}`;
};

const autoRecalculateDaySlots = (
    slots: ScheduleSlot[],
    startTimeStr: string = "07.30"
): ScheduleSlot[] => {
    let currentMinutes = parseTimeToMinutes(startTimeStr, 450);
    let currentJamKe = 1;

    return slots.map((slot) => {
        const jpVal = Math.max(1, Number(slot.jp) || 1);
        const durationMinutes = jpVal * 35; // 1 JP = 35 Menit SD/MI
        
        const startFormatted = formatMinutesToTime(currentMinutes);
        const endMinutes = currentMinutes + durationMinutes;
        const endFormatted = formatMinutesToTime(endMinutes);

        let jamKeStr = `${currentJamKe}`;
        if (jpVal > 1) {
            jamKeStr = `${currentJamKe} - ${currentJamKe + jpVal - 1}`;
            currentJamKe += jpVal;
        } else {
            currentJamKe += 1;
        }

        currentMinutes = endMinutes;

        return {
            ...slot,
            jp: jpVal,
            jamKe: jamKeStr,
            time: `${startFormatted} - ${endFormatted}`
        };
    });
};

const JadwalMengajarView: React.FC<{
    selectedClass: string;
    classSchedules: Record<string, string[]>;
    toggleScheduleDay: (cls: string, day: string) => void;
    classDailyJP: Record<string, Record<string, number>>;
    updateDailyJP: (cls: string, day: string, jp: number) => void;
    schoolDaysCount: number;
    setSchoolDaysCount?: (days: number) => void;
    identity?: UserIdentity;
}> = ({ selectedClass, classSchedules, toggleScheduleDay, classDailyJP, updateDailyJP, schoolDaysCount, setSchoolDaysCount, identity }) => {
    const storageKey = `prota_weekly_roster_${selectedClass}`;
    const [weeklySchedule, setWeeklySchedule] = useState<Record<string, ScheduleSlot[]>>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return getDefaultScheduleForClass(schoolDaysCount);
    });

    const [dayStartTimes, setDayStartTimes] = useState<Record<string, string>>({
        'Senin': '07.00',
        'Selasa': '07.30',
        'Rabu': '07.30',
        'Kamis': '07.30',
        'Jumat': '07.00',
        'Sabtu': '07.00'
    });

    const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

    // Export Options Modal States
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportPaperSize, setExportPaperSize] = useState<'A4' | 'F4'>('A4');
    const [exportOrientation, setExportOrientation] = useState<'landscape' | 'portrait'>('landscape');
    const [includeSignature, setIncludeSignature] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                setWeeklySchedule(JSON.parse(saved));
                return;
            }
        } catch (e) {}
        setWeeklySchedule(getDefaultScheduleForClass(schoolDaysCount));
    }, [selectedClass, schoolDaysCount]);

    const saveSchedule = (newSched: Record<string, ScheduleSlot[]>) => {
        setWeeklySchedule(newSched);
        try {
            localStorage.setItem(storageKey, JSON.stringify(newSched));
        } catch (e) {}
    };

    const handleExplicitSave = () => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(weeklySchedule));
            activeDaysList.forEach(day => {
                const totalJp = getDailyTotalJP(day);
                if (updateDailyJP) {
                    updateDailyJP(selectedClass, day, totalJp);
                }
            });
            setSaveSuccessMessage(`Jadwal pelajaran ${selectedClass} berhasil disimpan!`);
            setTimeout(() => {
                setSaveSuccessMessage(null);
            }, 4000);
        } catch (e) {
            console.error('Failed to save schedule:', e);
            alert('Gagal menyimpan jadwal pelajaran. Silakan coba lagi.');
        }
    };

    const activeDaysList = schoolDaysCount === 5 
        ? ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] 
        : ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    const handleUpdateDayStartTime = (day: string, newStartTime: string) => {
        setDayStartTimes(prev => ({ ...prev, [day]: newStartTime }));
        const currentSlots = weeklySchedule[day] || [];
        if (currentSlots.length > 0) {
            const updatedSlots = autoRecalculateDaySlots(currentSlots, newStartTime);
            saveSchedule({ ...weeklySchedule, [day]: updatedSlots });
        }
    };

    const handleAutoRecalculateDay = (day: string) => {
        const currentSlots = weeklySchedule[day] || [];
        if (currentSlots.length === 0) return;
        const startTime = dayStartTimes[day] || '07.30';
        const updatedSlots = autoRecalculateDaySlots(currentSlots, startTime);
        saveSchedule({ ...weeklySchedule, [day]: updatedSlots });
    };

    const handleAutoRecalculateAllDays = () => {
        const newSched: Record<string, ScheduleSlot[]> = {};
        activeDaysList.forEach(day => {
            const currentSlots = weeklySchedule[day] || [];
            const startTime = dayStartTimes[day] || '07.30';
            newSched[day] = autoRecalculateDaySlots(currentSlots, startTime);
        });
        saveSchedule(newSched);
        setSaveSuccessMessage('Seluruh alokasi waktu jam pelajaran berhasil dihitung ulang otomatis (1 JP = 35 Menit)!');
        setTimeout(() => setSaveSuccessMessage(null), 4000);
    };

    const handleAddSlot = (day: string) => {
        const currentSlots = weeklySchedule[day] || [];
        const newSlot: ScheduleSlot = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
            jamKe: '1',
            time: '07.30 - 08.40',
            subject: ALL_MAPEL_OPTIONS[0],
            jp: 2,
            notes: 'Ruang Kelas'
        };
        const startTime = dayStartTimes[day] || '07.30';
        const updatedSlots = autoRecalculateDaySlots([...currentSlots, newSlot], startTime);
        saveSchedule({ ...weeklySchedule, [day]: updatedSlots });
    };

    const handleUpdateSlot = (day: string, slotId: string, field: keyof ScheduleSlot, value: any) => {
        const currentSlots = weeklySchedule[day] || [];
        let updatedSlots = currentSlots.map(s => s.id === slotId ? { ...s, [field]: value } : s);
        if (field === 'jp') {
            const startTime = dayStartTimes[day] || '07.30';
            updatedSlots = autoRecalculateDaySlots(updatedSlots, startTime);
        }
        saveSchedule({ ...weeklySchedule, [day]: updatedSlots });
    };

    const handleDeleteSlot = (day: string, slotId: string) => {
        const currentSlots = weeklySchedule[day] || [];
        const updatedSlots = currentSlots.filter(s => s.id !== slotId);
        const startTime = dayStartTimes[day] || '07.30';
        const recalculated = autoRecalculateDaySlots(updatedSlots, startTime);
        saveSchedule({ ...weeklySchedule, [day]: recalculated });
    };

    const handleResetSchedule = () => {
        if (confirm(`Apakah Anda yakin ingin meriset jadwal pelajaran ${selectedClass} ke pengaturan awal?`)) {
            const def = getDefaultScheduleForClass(schoolDaysCount);
            saveSchedule(def);
        }
    };

    const getDailyTotalJP = (day: string) => {
        return (weeklySchedule[day] || []).reduce((acc, s) => acc + (Number(s.jp) || 0), 0);
    };

    const totalWeeklyJp = activeDaysList.reduce((acc, day) => acc + getDailyTotalJP(day), 0);

    const subjectJpSummary = useMemo(() => {
        const map: Record<string, { totalJp: number; days: string[] }> = {};
        activeDaysList.forEach(day => {
            (weeklySchedule[day] || []).forEach(slot => {
                if (!slot.subject || slot.subject.includes('Istirahat')) return;
                if (!map[slot.subject]) {
                    map[slot.subject] = { totalJp: 0, days: [] };
                }
                map[slot.subject].totalJp += Number(slot.jp) || 0;
                if (!map[slot.subject].days.includes(day)) {
                    map[slot.subject].days.push(day);
                }
            });
        });
        return map;
    }, [weeklySchedule, activeDaysList]);

    const handleExportPdf = (
        paperSize: 'A4' | 'F4' = exportPaperSize,
        orientation: 'landscape' | 'portrait' = exportOrientation,
        includeExtra: boolean = includeSignature
    ) => {
        try {
            const teacherName = identity?.authorName || 'Acep Miftah Hilah Ash-shidiq, S.Pd.';
            const nip = identity?.nip || '199602152025211094';
            const schoolName = identity?.institutionName || 'SDN SUKATINGGAL';
            const schoolAddress = identity?.schoolAddress || 'Desa Santosa, Kecamatan Kertasari, Kabupaten Bandung';
            const headmaster = identity?.headmasterName || 'Kepala Sekolah S.Pd., M.Pd.';
            const headmasterNip = identity?.headmasterNip || '-';
            const academicYear = identity?.academicYear || '2025/2026';

            // Determine Fase based on selectedClass
            let faseName = "Fase A";
            let subFaseText = "Kelas 1 & 2";
            if (selectedClass.includes("3") || selectedClass.includes("4")) {
                faseName = "Fase B";
                subFaseText = "Kelas 3 & 4";
            } else if (selectedClass.includes("5") || selectedClass.includes("6")) {
                faseName = "Fase C";
                subFaseText = "Kelas 5 & 6";
            } else if (selectedClass.includes("1") || selectedClass.includes("2")) {
                faseName = "Fase A";
                subFaseText = "Kelas 1 & 2";
            }

            const days = activeDaysList;

            // Map day headers with icons matching JADWAL FASE C.png
            const dayHeadersMap: Record<string, string> = {
                'Senin': '📘 SENIN',
                'Selasa': '📙 SELASA',
                'Rabu': '🧑‍🤝‍🧑 RABU',
                'Kamis': '💛 KAMIS',
                'Jumat': '⭐ JUMAT',
                'Sabtu': '🚩 SABTU'
            };

            const isLandscape = orientation === 'landscape';
            const cellPadding = isLandscape ? '4px 6px' : '3px 4px';
            const cellFontSize = isLandscape ? '8.5pt' : '8pt';
            const headerFontSize = isLandscape ? '9.5pt' : '8.5pt';

            const dayHeadersHtml = days.map(d => `
                <th style="padding: ${cellPadding}; text-align: center; border: 1.5px solid #1E3A8A; background-color: #0F172A; color: #FFFFFF; font-weight: 900; font-size: ${headerFontSize}; text-transform: uppercase;">
                    ${dayHeadersMap[d] || d.toUpperCase()}
                </th>
            `).join('');

            // Build Expanded 1-JP Cell Matrix for each active day
            interface ExpandedCell {
                subject: string;
                notes?: string;
                jamKeStr: string;
                timeRange: string;
                isBreak: boolean;
                isRedSpecial: boolean;
            }

            const expandedDaysMap: Record<string, ExpandedCell[]> = {};
            let maxRows = 0;

            days.forEach(day => {
                const slots = weeklySchedule[day] || [];
                const expanded: ExpandedCell[] = [];

                slots.forEach(slot => {
                    const jpCount = Math.max(1, Number(slot.jp) || 1);
                    const subj = slot.subject || '';
                    const lowerSubj = subj.toLowerCase();
                    const isBreak = lowerSubj.includes('istirahat');
                    const isRedSpecial = lowerSubj.includes('upacara') ||
                                         lowerSubj.includes('gemar belajar') ||
                                         lowerSubj.includes('berolahraga') ||
                                         lowerSubj.includes('makan sehat') ||
                                         lowerSubj.includes('beribadah') ||
                                         lowerSubj.includes('bermasyarakat') ||
                                         lowerSubj.includes('bangun pagi') ||
                                         lowerSubj.includes('pramuka') ||
                                         lowerSubj.includes('ekstrakurikuler') ||
                                         lowerSubj.includes('kokurikuler') ||
                                         lowerSubj.includes('matematika');

                    let startM = 7 * 60;
                    let endM = startM + jpCount * 35;
                    if (slot.time && slot.time.includes('-')) {
                        const parts = slot.time.split('-');
                        startM = parseTimeToMinutes(parts[0], startM);
                        endM = parseTimeToMinutes(parts[1], startM + jpCount * 35);
                    }

                    let startJamNum = 1;
                    if (slot.jamKe) {
                        const match = slot.jamKe.match(/\d+/);
                        if (match) {
                            startJamNum = parseInt(match[0], 10);
                        }
                    }

                    const totalSlotMinutes = endM - startM;
                    const durPerJp = totalSlotMinutes > 0 ? (totalSlotMinutes / jpCount) : 35;

                    for (let j = 0; j < jpCount; j++) {
                        const uStart = startM + Math.round(j * durPerJp);
                        const uEnd = startM + Math.round((j + 1) * durPerJp);
                        const uTimeRange = `${formatMinutesToTime(uStart)} - ${formatMinutesToTime(uEnd)}`;
                        const uJamNum = startJamNum + j;

                        expanded.push({
                            subject: subj,
                            notes: slot.notes,
                            jamKeStr: `Jam ${uJamNum}`,
                            timeRange: uTimeRange,
                            isBreak,
                            isRedSpecial
                        });
                    }
                });

                expandedDaysMap[day] = expanded;
                if (expanded.length > maxRows) {
                    maxRows = expanded.length;
                }
            });

            // Date formatting
            const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            const cityStr = schoolAddress.split(',')[0].replace(/Desa|Kelurahan|Kecamatan/gi, '').trim() || 'Kertasari';

            // Determine Paper Dimensions and CSS Size based on paperSize and orientation
            const targetWidth = paperSize === 'A4'
                ? (orientation === 'landscape' ? '297mm' : '210mm')
                : (orientation === 'landscape' ? '330mm' : '215mm');

            const targetHeight = paperSize === 'A4'
                ? (orientation === 'landscape' ? '210mm' : '297mm')
                : (orientation === 'landscape' ? '215mm' : '330mm');

            const paperCssSize = paperSize === 'A4'
                ? (orientation === 'landscape' ? '297mm 210mm' : '210mm 297mm')
                : (orientation === 'landscape' ? '330mm 215mm' : '215mm 330mm');

            // Calculate exact row time strings based on configured slot times
            const rowTimes: string[] = [];
            for (let r = 0; r < maxRows; r++) {
                let cellSample: ExpandedCell | undefined = undefined;
                for (const d of days) {
                    if (expandedDaysMap[d]?.[r]) {
                        cellSample = expandedDaysMap[d][r];
                        break;
                    }
                }
                if (cellSample) {
                    rowTimes.push(`🕒 ${cellSample.jamKeStr}<br/><span style="font-size: 7.5pt; font-weight: 800; color: #78350F;">${cellSample.timeRange}</span>`);
                } else {
                    rowTimes.push(`🕒 Jam ${r + 1}`);
                }
            }

            // Build Detailed Daily Schedule Table HTML (Strictly aligned with user-configured Jam Ke & Waktu)
            let detailedScheduleRowsHtml = '';
            days.forEach(day => {
                const slots = weeklySchedule[day] || [];
                if (slots.length === 0) return;
                slots.forEach((slot, idx) => {
                    const isFirst = idx === 0;
                    detailedScheduleRowsHtml += `
                        <tr>
                            ${isFirst ? `<td rowspan="${slots.length}" style="border: 1px solid #CBD5E1; padding: 6px 8px; font-weight: 900; background-color: #F8FAFC; text-align: center; vertical-align: middle; color: #1E3A8A;">${day.toUpperCase()}</td>` : ''}
                            <td style="border: 1px solid #CBD5E1; padding: 6px 8px; text-align: center; font-weight: 800; color: #0F172A; white-space: nowrap;">${slot.jamKe || '-'}</td>
                            <td style="border: 1px solid #CBD5E1; padding: 6px 8px; text-align: center; font-weight: 900; color: #0369A1; white-space: nowrap; background-color: #F0F9FF;">${slot.time || '-'}</td>
                            <td style="border: 1px solid #CBD5E1; padding: 6px 10px; font-weight: 700; color: #0F172A;">${slot.subject || '-'}</td>
                            <td style="border: 1px solid #CBD5E1; padding: 6px 8px; text-align: center; font-weight: 800; color: #D97706;">${slot.jp || 1} JP</td>
                            <td style="border: 1px solid #CBD5E1; padding: 6px 10px; color: #475569; font-size: 8.5pt;">${slot.notes || '-'}</td>
                        </tr>
                    `;
                });
            });

            // Build Matrix Rows
            let tableRowsHtml = '';
            for (let r = 0; r < maxRows; r++) {
                let dayCellsHtml = '';
                days.forEach(day => {
                    const cell = expandedDaysMap[day]?.[r];
                    if (!cell || !cell.subject) {
                        dayCellsHtml += `<td style="padding: ${cellPadding}; text-align: center; border: 1px solid #CBD5E1; color: #94A3B8; font-size: ${cellFontSize};">-</td>`;
                    } else if (cell.isBreak) {
                        dayCellsHtml += `
                            <td style="padding: ${cellPadding}; text-align: center; border: 1px solid #7DD3FC; background-color: #E0F2FE; color: #0284C7; font-weight: 900; font-size: ${cellFontSize};">
                                ISTIRAHAT ☕
                            </td>`;
                    } else if (cell.isRedSpecial) {
                        dayCellsHtml += `
                            <td style="padding: ${cellPadding}; text-align: center; border: 1px solid #CBD5E1; background-color: #FEF2F2; color: #DC2626; font-weight: 800; font-size: ${cellFontSize}; line-height: 1.2;">
                                ${cell.subject}
                            </td>`;
                    } else {
                        dayCellsHtml += `
                            <td style="padding: ${cellPadding}; text-align: center; border: 1px solid #CBD5E1; color: #0F172A; font-weight: 700; font-size: ${cellFontSize}; line-height: 1.2;">
                                ${cell.subject}
                            </td>`;
                    }
                });

                tableRowsHtml += `
                    <tr>
                        <td style="padding: ${cellPadding}; text-align: center; border: 1px solid #F59E0B; background-color: #FEF3C7; color: #78350F; font-weight: 900; font-size: ${cellFontSize}; white-space: nowrap;">
                            ${rowTimes[r]}
                        </td>
                        ${dayCellsHtml}
                    </tr>
                `;
            }

            // Subject Summary Rows for Page 2
            let subjectSummaryRowsHtml = '';
            Object.entries(subjectJpSummary).forEach(([sub, info]: [string, any], idx) => {
                subjectSummaryRowsHtml += `
                    <tr>
                        <td style="text-align: center; border: 1px solid #CBD5E1; padding: 8px; font-weight: bold;">${idx + 1}</td>
                        <td style="border: 1px solid #CBD5E1; padding: 8px 12px; font-weight: bold; color: #0F172A;">${sub}</td>
                        <td style="border: 1px solid #CBD5E1; padding: 8px 12px; color: #334155;">${info.days.join(', ')}</td>
                        <td style="text-align: center; border: 1px solid #CBD5E1; padding: 8px; font-weight: bold; color: #0369A1;">${info.totalJp} JP / Pekan</td>
                    </tr>
                `;
            });

            // Build Page 2 HTML (Rincian Jadwal Harian & Rekapitulasi Alokasi Beban JP Mingguan)
            let page2Html = '';
            if (includeExtra) {
                page2Html = `
                    <div class="pdf-page page-2">
                        <div class="page2-header">
                            <div class="school-tag">🏫 ${schoolName}</div>
                            <h2 class="page2-title">RINCIAN JADWAL PELAJARAN HARIAN & REKAPITULASI JP (${selectedClass.toUpperCase()})</h2>
                            <div class="page2-sub">Tahun Pelajaran ${academicYear} &bull; Kurikulum Merdeka (${faseName})</div>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <h3 style="font-size: 10pt; font-weight: 900; color: #1E3A8A; margin: 0 0 6px 0; text-transform: uppercase;">
                                📋 TABEL RINCIAN JADWAL PELAJARAN HARIAN (AKURAT DENGAN PENGATURAN WAKTU & JAM KE)
                            </h3>
                            <table class="summary-table">
                                <thead>
                                    <tr>
                                        <th style="width: 12%;">HARI</th>
                                        <th style="width: 12%;">JAM KE-</th>
                                        <th style="width: 18%;">WAKTU</th>
                                        <th>MATA PELAJARAN / KEGIATAN</th>
                                        <th style="width: 12%;">BEBAN JP</th>
                                        <th style="width: 22%;">KETERANGAN / RUANG</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${detailedScheduleRowsHtml}
                                </tbody>
                            </table>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <h3 style="font-size: 10pt; font-weight: 900; color: #1E3A8A; margin: 0 0 6px 0; text-transform: uppercase;">
                                📊 REKAPITULASI ALOKASI BEBAN JP MENGAJAR KELAS
                            </h3>
                            <table class="summary-table">
                                <thead>
                                    <tr>
                                        <th style="width: 8%;">NO</th>
                                        <th style="width: 38%;">MATA PELAJARAN / KEGIATAN</th>
                                        <th>HARI PELAKSANAAN</th>
                                        <th style="width: 22%;">TOTAL BEBAN JP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${subjectSummaryRowsHtml}
                                    <tr class="total-row">
                                        <td colspan="3" style="text-align: right; padding: 10px 14px;">TOTAL BEBAN MENGAJAR MINGGUAN KELAS:</td>
                                        <td style="text-align: center; padding: 10px; font-size: 11pt;">${totalWeeklyJp} JP / Pekan</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="signature-container">
                            <table class="signature-table">
                                <tr>
                                    <td style="width: 50%; text-align: center; vertical-align: top;">
                                        Mengetahui,<br/>
                                        <strong>Kepala ${schoolName}</strong><br/><br/><br/><br/><br/>
                                        <strong><u>${headmaster}</u></strong><br/>
                                        NIP. ${headmasterNip}
                                    </td>
                                    <td style="width: 50%; text-align: center; vertical-align: top;">
                                        ${cityStr}, ${todayStr}<br/>
                                        <strong>Wali Kelas ${selectedClass}</strong><br/><br/><br/><br/><br/>
                                        <strong><u>${teacherName}</u></strong><br/>
                                        NIP. ${nip}
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </div>
                `;
            }

            const pdfHtml = `
                <!DOCTYPE html>
                <html lang="id">
                <head>
                    <meta charset="utf-8">
                    <title>Jadwal_Pelajaran_${selectedClass.replace(/\s+/g, '_')}_PDF</title>
                    <style>
                        @page {
                            size: ${paperCssSize};
                            margin: 0;
                        }
                        * {
                            box-sizing: border-box;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        body {
                            font-family: 'Segoe UI', Roboto, Arial, sans-serif;
                            color: #0F172A;
                            background-color: #F8FAFC;
                            margin: 0;
                            padding: 0;
                        }

                        /* Floating Non-Print Action Bar */
                        .no-print-bar {
                            position: fixed;
                            top: 0;
                            left: 0;
                            right: 0;
                            background: #0F172A;
                            color: #FFFFFF;
                            padding: 12px 24px;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            z-index: 9999;
                            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                        }
                        .no-print-bar button {
                            cursor: pointer;
                            border: none;
                            padding: 8px 18px;
                            border-radius: 8px;
                            font-weight: 800;
                            font-size: 13px;
                            transition: all 0.2s;
                        }
                        .btn-print {
                            background: #2563EB;
                            color: #FFFFFF;
                        }
                        .btn-print:hover {
                            background: #1D4ED8;
                        }
                        .btn-close {
                            background: #334155;
                            color: #94A3B8;
                        }

                        /* Page Wrapper */
                        .pdf-page {
                            width: ${targetWidth};
                            min-height: ${targetHeight};
                            background: #FFFFFF;
                            padding: 8mm 10mm;
                            margin: 20px auto;
                            position: relative;
                            box-sizing: border-box;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                        }

                        /* Page 1 Specific Layout for strict 1-page fit */
                        .page-1 {
                            height: ${targetHeight};
                            max-height: ${targetHeight};
                            display: flex;
                            flex-direction: column;
                            justify-content: space-between;
                            page-break-after: always;
                            break-after: page;
                        }

                        /* Header Banner */
                        .header-banner {
                            width: 100%;
                            border: 2px solid #1E3A8A;
                            background: linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%);
                            border-radius: 12px;
                            padding: 8px 14px;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            margin-bottom: 8px;
                        }
                        .school-box {
                            width: 30%;
                        }
                        .school-name {
                            font-size: 13pt;
                            font-weight: 900;
                            color: #1E3A8A;
                            text-transform: uppercase;
                            line-height: 1.1;
                        }
                        .school-addr {
                            font-size: 8pt;
                            color: #475569;
                            margin-top: 3px;
                        }
                        .title-box {
                            width: 40%;
                            text-align: center;
                        }
                        .main-title {
                            font-size: 18pt;
                            font-weight: 900;
                            color: #0F172A;
                            letter-spacing: 0.5px;
                            text-transform: uppercase;
                            line-height: 1;
                        }
                        .badge-class {
                            background: #F59E0B;
                            color: #0F172A;
                            font-size: 9.5pt;
                            font-weight: 900;
                            padding: 2px 14px;
                            border-radius: 12px;
                            display: inline-block;
                            margin-top: 4px;
                        }
                        .badge-year {
                            background: #1E3A8A;
                            color: #FFFFFF;
                            font-size: 8pt;
                            font-weight: 800;
                            padding: 2px 10px;
                            border-radius: 10px;
                            display: inline-block;
                            margin-top: 3px;
                        }
                        .fase-box {
                            width: 25%;
                            text-align: right;
                        }
                        .fase-badge {
                            background: #E0F2FE;
                            border: 1.5px solid #38BDF8;
                            padding: 4px 12px;
                            border-radius: 12px;
                            display: inline-block;
                            text-align: center;
                        }
                        .fase-name {
                            font-size: 11pt;
                            font-weight: 900;
                            color: #0369A1;
                        }
                        .fase-sub {
                            font-size: 8pt;
                            font-weight: 800;
                            color: #0284C7;
                        }

                        /* Matrix Table */
                        .matrix-table {
                            width: 100%;
                            border-collapse: collapse;
                            border: 1.5px solid #0F172A;
                            margin-bottom: 8px;
                        }
                        .matrix-table th {
                            border: 1.5px solid #1E3A8A;
                        }
                        .matrix-table td {
                            border: 1px solid #CBD5E1;
                        }

                        /* Footer Cards (3 Boxes) */
                        .footer-cards {
                            display: flex;
                            gap: 10px;
                            margin-bottom: 2px;
                        }
                        .card-box {
                            flex: 1;
                            border-radius: 10px;
                            padding: 8px 12px;
                        }
                        .card-notes {
                            background: #F0F9FF;
                            border: 1.5px solid #7DD3FC;
                        }
                        .card-teacher {
                            background: #F8FAFC;
                            border: 1.5px solid #94A3B8;
                            text-align: center;
                        }
                        .card-motto {
                            background: #FEFCE8;
                            border: 1.5px solid #FDE047;
                            text-align: center;
                        }
                        .card-title {
                            font-size: 8.5pt;
                            font-weight: 900;
                            color: #0369A1;
                            text-transform: uppercase;
                            margin-bottom: 4px;
                            border-bottom: 1px solid #BAE6FD;
                            padding-bottom: 2px;
                        }
                        .card-desc {
                            font-size: 7.5pt;
                            color: #334155;
                            line-height: 1.3;
                        }

                        /* Page 2 Styling */
                        .page-2 {
                            min-height: 100vh;
                            padding-top: 15mm;
                            page-break-before: always;
                            break-before: page;
                        }
                        .page2-header {
                            text-align: center;
                            margin-bottom: 20px;
                            border-bottom: 2px solid #0F172A;
                            padding-bottom: 12px;
                        }
                        .school-tag {
                            font-size: 11pt;
                            font-weight: 900;
                            color: #1E3A8A;
                            text-transform: uppercase;
                        }
                        .page2-title {
                            font-size: 16pt;
                            font-weight: 900;
                            color: #0F172A;
                            margin: 6px 0 2px 0;
                        }
                        .page2-sub {
                            font-size: 9.5pt;
                            color: #475569;
                        }
                        .summary-table {
                            width: 100%;
                            border-collapse: collapse;
                            border: 1.5px solid #0F172A;
                            margin-bottom: 30px;
                            font-size: 9pt;
                        }
                        .summary-table th {
                            background: #0F172A;
                            color: #FFFFFF;
                            padding: 10px;
                            border: 1px solid #334155;
                            text-align: center;
                            font-weight: 900;
                        }
                        .summary-table td {
                            border: 1px solid #CBD5E1;
                            padding: 8px 12px;
                        }
                        .total-row {
                            background: #E2E8F0;
                            font-weight: 900;
                            color: #0F172A;
                        }
                        .signature-container {
                            margin-top: 40px;
                        }
                        .signature-table {
                            width: 100%;
                            border: none;
                            font-size: 10pt;
                            color: #0F172A;
                        }
                        .signature-table td {
                            border: none;
                            padding: 0;
                        }

                        @media print {
                            .no-print-bar {
                                display: none !important;
                            }
                            body {
                                background: #FFFFFF !important;
                                margin: 0 !important;
                                padding: 0 !important;
                            }
                            .pdf-page {
                                width: ${targetWidth} !important;
                                height: ${targetHeight} !important;
                                padding: 8mm 10mm !important;
                                margin: 0 !important;
                                box-shadow: none !important;
                            }
                            .page-1 {
                                height: ${targetHeight} !important;
                                max-height: ${targetHeight} !important;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="no-print-bar">
                        <div style="font-weight: 800; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                            <span>📄 Pratinjau Dokumen PDF - Jadwal Pelajaran (${selectedClass})</span>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn-print" onclick="window.print();">🖨️ Simpan / Cetak PDF</button>
                            <button class="btn-close" onclick="window.close();">Tutup</button>
                        </div>
                    </div>

                    <!-- HALAMAN 1: JADWAL PELAJARAN ( STRICT 1 PAGE FIT ) -->
                    <div class="pdf-page page-1">
                        <div class="header-banner">
                            <div class="school-box">
                                <div class="school-name">🏫 ${schoolName}</div>
                                <div class="school-addr">${schoolAddress}</div>
                            </div>
                            <div class="title-box">
                                <div class="main-title">JADWAL PELAJARAN</div>
                                <div>
                                    <span class="badge-class">${selectedClass.toUpperCase()} (${faseName.toUpperCase()})</span>
                                </div>
                                <div>
                                    <span class="badge-year">TAHUN PELAJARAN ${academicYear}</span>
                                </div>
                            </div>
                            <div class="fase-box">
                                <div class="fase-badge">
                                    <div class="fase-name">${faseName}</div>
                                    <div class="fase-sub">${subFaseText}</div>
                                </div>
                            </div>
                        </div>

                        <table class="matrix-table">
                            <thead>
                                <tr>
                                    <th style="width: 15%; padding: ${cellPadding}; text-align: center; background-color: #FBBF24; color: #0F172A; font-weight: 900; font-size: ${headerFontSize}; text-transform: uppercase;">
                                        ⏱️ WAKTU
                                    </th>
                                    ${dayHeadersHtml}
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRowsHtml}
                            </tbody>
                        </table>

                        <div class="footer-cards">
                            <div class="card-box card-notes">
                                <div class="card-title">📌 Catatan:</div>
                                <div class="card-desc">
                                    <div>⭐ <strong>Disiplin waktu:</strong> Kunci keberhasilan belajar.</div>
                                    <div>❤️ <strong>Kesehatan & Kebersihan:</strong> Saling menghargai & menjaga kebersihan.</div>
                                    <div>📚 <strong>Semangat Belajar:</strong> Raih masa depan gemilang!</div>
                                </div>
                            </div>

                            <div class="card-box card-teacher">
                                <div style="background-color: #1E3A8A; color: #FFFFFF; font-size: 8pt; font-weight: 800; padding: 1px 10px; border-radius: 8px; display: inline-block; margin-bottom: 4px;">
                                    WALI KELAS
                                </div>
                                <div style="font-size: 9.5pt; font-weight: 900; color: #0F172A; margin-top: 2px;">
                                    ${teacherName}
                                </div>
                                <div style="font-size: 7.5pt; color: #475569; margin-top: 1px;">
                                    NIP. ${nip}
                                </div>
                            </div>

                            <div class="card-box card-motto">
                                <div style="background-color: #CA8A04; color: #FFFFFF; font-size: 8pt; font-weight: 800; padding: 1px 10px; border-radius: 8px; display: inline-block; margin-bottom: 4px;">
                                    MOTTO
                                </div>
                                <div style="font-size: 8.5pt; font-style: italic; font-weight: 800; color: #854D0E; line-height: 1.3; margin-top: 2px;">
                                    "Berakhlak Mulia, Berprestasi, Berbudaya, dan Peduli Lingkungan"
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- HALAMAN 2: REKAPITULASI ALOKASI BEBAN JP MINGGUAN -->
                    ${page2Html}

                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                            }, 500);
                        };
                    </script>
                </body>
                </html>
            `;

            const printWin = window.open('', '_blank');
            if (printWin) {
                printWin.document.write(pdfHtml);
                printWin.document.close();
                printWin.focus();
            } else {
                alert('Gagal membuka jendela pratinjau PDF. Mohon izinkan popup di peramban Anda.');
            }
        } catch (e) {
            console.error('Gagal mengekspor PDF Jadwal Pelajaran:', e);
            alert('Gagal mengekspor PDF Jadwal Pelajaran. Silakan coba lagi.');
        }
    };

    const handleExportWord = (
        paperSize: 'A4' | 'F4' = exportPaperSize,
        orientation: 'landscape' | 'portrait' = exportOrientation,
        includeExtra: boolean = includeSignature
    ) => {
        try {
            const teacherName = identity?.authorName || 'Acep Miftah Hilah Ash-shidiq, S.Pd.';
            const nip = identity?.nip || '199602152025211094';
            const schoolName = identity?.institutionName || 'SDN SUKATINGGAL';
            const schoolAddress = identity?.schoolAddress || 'Desa Santosa, Kecamatan Kertasari, Kabupaten Bandung';
            const headmaster = identity?.headmasterName || 'Kepala Sekolah S.Pd., M.Pd.';
            const headmasterNip = identity?.headmasterNip || '-';
            const academicYear = identity?.academicYear || '2025/2026';

            let faseName = "Fase A";
            let subFaseText = "Kelas 1 & 2";
            if (selectedClass.includes("3") || selectedClass.includes("4")) {
                faseName = "Fase B";
                subFaseText = "Kelas 3 & 4";
            } else if (selectedClass.includes("5") || selectedClass.includes("6")) {
                faseName = "Fase C";
                subFaseText = "Kelas 5 & 6";
            } else if (selectedClass.includes("1") || selectedClass.includes("2")) {
                faseName = "Fase A";
                subFaseText = "Kelas 1 & 2";
            }

            const days = activeDaysList;

            const dayHeadersMap: Record<string, string> = {
                'Senin': '📘 SENIN',
                'Selasa': '📙 SELASA',
                'Rabu': '🧑‍🤝‍🧑 RABU',
                'Kamis': '💛 KAMIS',
                'Jumat': '⭐ JUMAT',
                'Sabtu': '🚩 SABTU'
            };

            const isLandscape = orientation === 'landscape';
            const cellPadding = isLandscape ? '6px 8px' : '4px 6px';
            const cellFontSize = isLandscape ? '9.5pt' : '8.5pt';
            const headerFontSize = isLandscape ? '10pt' : '9pt';

            const dayHeadersHtml = days.map(d => `
                <th style="padding: ${cellPadding}; text-align: center; border: 1.5px solid #1E3A8A; background-color: #0F172A; color: #FFFFFF; font-weight: 900; font-size: ${headerFontSize}; text-transform: uppercase;">
                    ${dayHeadersMap[d] || d.toUpperCase()}
                </th>
            `).join('');

            interface ExpandedCell {
                subject: string;
                notes?: string;
                jamKeStr: string;
                timeRange: string;
                isBreak: boolean;
                isRedSpecial: boolean;
            }

            const expandedDaysMap: Record<string, ExpandedCell[]> = {};
            let maxRows = 0;

            days.forEach(day => {
                const slots = weeklySchedule[day] || [];
                const expanded: ExpandedCell[] = [];

                slots.forEach(slot => {
                    const jpCount = Math.max(1, Number(slot.jp) || 1);
                    const subj = slot.subject || '';
                    const lowerSubj = subj.toLowerCase();
                    const isBreak = lowerSubj.includes('istirahat');
                    const isRedSpecial = lowerSubj.includes('upacara') ||
                                         lowerSubj.includes('gemar belajar') ||
                                         lowerSubj.includes('berolahraga') ||
                                         lowerSubj.includes('makan sehat') ||
                                         lowerSubj.includes('beribadah') ||
                                         lowerSubj.includes('bermasyarakat') ||
                                         lowerSubj.includes('bangun pagi') ||
                                         lowerSubj.includes('pramuka') ||
                                         lowerSubj.includes('ekstrakurikuler') ||
                                         lowerSubj.includes('kokurikuler') ||
                                         lowerSubj.includes('matematika');

                    let startM = 7 * 60;
                    let endM = startM + jpCount * 35;
                    if (slot.time && slot.time.includes('-')) {
                        const parts = slot.time.split('-');
                        startM = parseTimeToMinutes(parts[0], startM);
                        endM = parseTimeToMinutes(parts[1], startM + jpCount * 35);
                    }

                    let startJamNum = 1;
                    if (slot.jamKe) {
                        const match = slot.jamKe.match(/\d+/);
                        if (match) {
                            startJamNum = parseInt(match[0], 10);
                        }
                    }

                    const totalSlotMinutes = endM - startM;
                    const durPerJp = totalSlotMinutes > 0 ? (totalSlotMinutes / jpCount) : 35;

                    for (let j = 0; j < jpCount; j++) {
                        const uStart = startM + Math.round(j * durPerJp);
                        const uEnd = startM + Math.round((j + 1) * durPerJp);
                        const uTimeRange = `${formatMinutesToTime(uStart)} - ${formatMinutesToTime(uEnd)}`;
                        const uJamNum = startJamNum + j;

                        expanded.push({
                            subject: subj,
                            notes: slot.notes,
                            jamKeStr: `Jam ${uJamNum}`,
                            timeRange: uTimeRange,
                            isBreak,
                            isRedSpecial
                        });
                    }
                });

                expandedDaysMap[day] = expanded;
                if (expanded.length > maxRows) {
                    maxRows = expanded.length;
                }
            });

            const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            const cityStr = schoolAddress.split(',')[0].replace(/Desa|Kelurahan|Kecamatan/gi, '').trim() || 'Kertasari';

            const rowTimes: string[] = [];
            for (let r = 0; r < maxRows; r++) {
                let cellSample: ExpandedCell | undefined = undefined;
                for (const d of days) {
                    if (expandedDaysMap[d]?.[r]) {
                        cellSample = expandedDaysMap[d][r];
                        break;
                    }
                }
                if (cellSample) {
                    rowTimes.push(`🕒 ${cellSample.jamKeStr}<br/><span style="font-size: 7.5pt; font-weight: 800; color: #78350F;">${cellSample.timeRange}</span>`);
                } else {
                    rowTimes.push(`🕒 Jam ${r + 1}`);
                }
            }

            let detailedScheduleRowsHtml = '';
            days.forEach(day => {
                const slots = weeklySchedule[day] || [];
                if (slots.length === 0) return;
                slots.forEach((slot, idx) => {
                    const isFirst = idx === 0;
                    detailedScheduleRowsHtml += `
                        <tr>
                            ${isFirst ? `<td rowspan="${slots.length}" style="border: 1px solid #CBD5E1; padding: 6px 8px; font-weight: 900; background-color: #F8FAFC; text-align: center; vertical-align: middle; color: #1E3A8A;">${day.toUpperCase()}</td>` : ''}
                            <td style="border: 1px solid #CBD5E1; padding: 6px 8px; text-align: center; font-weight: 800; color: #0F172A; white-space: nowrap;">${slot.jamKe || '-'}</td>
                            <td style="border: 1px solid #CBD5E1; padding: 6px 8px; text-align: center; font-weight: 900; color: #0369A1; white-space: nowrap; background-color: #F0F9FF;">${slot.time || '-'}</td>
                            <td style="border: 1px solid #CBD5E1; padding: 6px 10px; font-weight: 700; color: #0F172A;">${slot.subject || '-'}</td>
                            <td style="border: 1px solid #CBD5E1; padding: 6px 8px; text-align: center; font-weight: 800; color: #D97706;">${slot.jp || 1} JP</td>
                            <td style="border: 1px solid #CBD5E1; padding: 6px 10px; color: #475569; font-size: 8.5pt;">${slot.notes || '-'}</td>
                        </tr>
                    `;
                });
            });

            let tableRowsHtml = '';
            for (let r = 0; r < maxRows; r++) {
                let dayCellsHtml = '';
                days.forEach(day => {
                    const cell = expandedDaysMap[day]?.[r];
                    if (!cell || !cell.subject) {
                        dayCellsHtml += `<td style="padding: ${cellPadding}; text-align: center; border: 1px solid #CBD5E1; color: #94A3B8; font-size: ${cellFontSize};">-</td>`;
                    } else if (cell.isBreak) {
                        dayCellsHtml += `
                            <td style="padding: ${cellPadding}; text-align: center; border: 1px solid #7DD3FC; background-color: #E0F2FE; color: #0284C7; font-weight: 900; font-size: ${cellFontSize};">
                                ISTIRAHAT ☕
                            </td>`;
                    } else if (cell.isRedSpecial) {
                        dayCellsHtml += `
                            <td style="padding: ${cellPadding}; text-align: center; border: 1px solid #CBD5E1; background-color: #FEF2F2; color: #DC2626; font-weight: 800; font-size: ${cellFontSize}; line-height: 1.2;">
                                ${cell.subject}
                            </td>`;
                    } else {
                        dayCellsHtml += `
                            <td style="padding: ${cellPadding}; text-align: center; border: 1px solid #CBD5E1; color: #0F172A; font-weight: 700; font-size: ${cellFontSize}; line-height: 1.2;">
                                ${cell.subject}
                            </td>`;
                    }
                });

                tableRowsHtml += `
                    <tr>
                        <td style="padding: ${cellPadding}; text-align: center; border: 1px solid #F59E0B; background-color: #FEF3C7; color: #78350F; font-weight: 900; font-size: ${cellFontSize}; white-space: nowrap;">
                            ${rowTimes[r]}
                        </td>
                        ${dayCellsHtml}
                    </tr>
                `;
            }

            let subjectSummaryRowsHtml = '';
            Object.entries(subjectJpSummary).forEach(([sub, info]: [string, any], idx) => {
                subjectSummaryRowsHtml += `
                    <tr>
                        <td style="text-align: center; border: 1px solid #CBD5E1; padding: 8px; font-weight: bold;">${idx + 1}</td>
                        <td style="border: 1px solid #CBD5E1; padding: 8px 12px; font-weight: bold; color: #0F172A;">${sub}</td>
                        <td style="border: 1px solid #CBD5E1; padding: 8px 12px; color: #334155;">${info.days.join(', ')}</td>
                        <td style="text-align: center; border: 1px solid #CBD5E1; padding: 8px; font-weight: bold; color: #0369A1;">${info.totalJp} JP / Pekan</td>
                    </tr>
                `;
            });

            let page2Html = '';
            if (includeExtra) {
                page2Html = `
                    <br clear="all" style="page-break-before:always" />
                    <div style="margin-top: 20px;">
                        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0F172A; padding-bottom: 12px;">
                            <div style="font-size: 11pt; font-weight: 900; color: #1E3A8A; text-transform: uppercase;">🏫 ${schoolName}</div>
                            <h2 style="font-size: 15pt; font-weight: 900; color: #0F172A; margin: 6px 0 2px 0;">RINCIAN JADWAL PELAJARAN HARIAN & REKAPITULASI JP (${selectedClass.toUpperCase()})</h2>
                            <div style="font-size: 9.5pt; color: #475569;">Tahun Pelajaran ${academicYear} &bull; Kurikulum Merdeka (${faseName})</div>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <h3 style="font-size: 10pt; font-weight: 900; color: #1E3A8A; margin: 10px 0 6px 0;">📋 TABEL RINCIAN JADWAL PELAJARAN HARIAN (JAM KE & WAKTU)</h3>
                            <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #0F172A; margin-bottom: 20px; font-size: 8.5pt;">
                                <thead>
                                    <tr style="background-color: #0F172A; color: #FFFFFF;">
                                        <th style="width: 12%; padding: 8px; border: 1px solid #334155; text-align: center; font-weight: 900;">HARI</th>
                                        <th style="width: 12%; padding: 8px; border: 1px solid #334155; text-align: center; font-weight: 900;">JAM KE-</th>
                                        <th style="width: 18%; padding: 8px; border: 1px solid #334155; text-align: center; font-weight: 900;">WAKTU</th>
                                        <th style="padding: 8px; border: 1px solid #334155; text-align: center; font-weight: 900;">MATA PELAJARAN / KEGIATAN</th>
                                        <th style="width: 12%; padding: 8px; border: 1px solid #334155; text-align: center; font-weight: 900;">BEBAN JP</th>
                                        <th style="width: 20%; padding: 8px; border: 1px solid #334155; text-align: center; font-weight: 900;">KETERANGAN / RUANG</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${detailedScheduleRowsHtml}
                                </tbody>
                            </table>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <h3 style="font-size: 10pt; font-weight: 900; color: #1E3A8A; margin: 10px 0 6px 0;">📊 REKAPITULASI ALOKASI BEBAN JP MINGGUAN</h3>
                            <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #0F172A; margin-bottom: 30px; font-size: 9pt;">
                                <thead>
                                    <tr style="background-color: #0F172A; color: #FFFFFF;">
                                        <th style="width: 8%; padding: 10px; border: 1px solid #334155; text-align: center; font-weight: 900;">NO</th>
                                        <th style="width: 38%; padding: 10px; border: 1px solid #334155; text-align: center; font-weight: 900;">MATA PELAJARAN / KEGIATAN</th>
                                        <th style="padding: 10px; border: 1px solid #334155; text-align: center; font-weight: 900;">HARI PELAKSANAAN</th>
                                        <th style="width: 22%; padding: 10px; border: 1px solid #334155; text-align: center; font-weight: 900;">TOTAL BEBAN JP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${subjectSummaryRowsHtml}
                                    <tr style="background: #E2E8F0; font-weight: 900; color: #0F172A;">
                                        <td colspan="3" style="text-align: right; padding: 10px 14px; border: 1px solid #CBD5E1;">TOTAL BEBAN MENGAJAR MINGGUAN KELAS:</td>
                                        <td style="text-align: center; padding: 10px; font-size: 11pt; border: 1px solid #CBD5E1;">${totalWeeklyJp} JP / Pekan</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div style="margin-top: 40px;">
                            <table style="width: 100%; border: none; font-size: 10pt; color: #0F172A;">
                                <tr>
                                    <td style="width: 50%; text-align: center; vertical-align: top; border: none;">
                                        Mengetahui,<br/>
                                        <strong>Kepala ${schoolName}</strong><br/><br/><br/><br/><br/>
                                        <strong><u>${headmaster}</u></strong><br/>
                                        NIP. ${headmasterNip}
                                    </td>
                                    <td style="width: 50%; text-align: center; vertical-align: top; border: none;">
                                        ${cityStr}, ${todayStr}<br/>
                                        <strong>Wali Kelas ${selectedClass}</strong><br/><br/><br/><br/><br/>
                                        <strong><u>${teacherName}</u></strong><br/>
                                        NIP. ${nip}
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </div>
                `;
            }

            const paperWidthCm = paperSize === 'A4'
                ? (orientation === 'landscape' ? '29.7' : '21.0')
                : (orientation === 'landscape' ? '33.0' : '21.5');

            const paperHeightCm = paperSize === 'A4'
                ? (orientation === 'landscape' ? '21.0' : '29.7')
                : (orientation === 'landscape' ? '21.5' : '33.0');

            const wordHtml = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office'
                      xmlns:w='urn:schemas-microsoft-com:office:word'
                      xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                    <meta charset="utf-8">
                    <title>Jadwal_Pelajaran_${selectedClass.replace(/\s+/g, '_')}</title>
                    <!--[if gte mso 9]>
                    <xml>
                    <w:WordDocument>
                        <w:View>Print</w:View>
                        <w:Zoom>100</w:Zoom>
                        <w:DoNotOptimizeForCustomXLS/>
                    </w:WordDocument>
                    </xml>
                    <![endif]-->
                    <style>
                        @page {
                            size: ${paperWidthCm}cm ${paperHeightCm}cm;
                            mso-page-orientation: ${orientation};
                            margin: 1.0cm 1.2cm 1.0cm 1.2cm;
                        }
                        @page Section1 {
                            size: ${paperWidthCm}cm ${paperHeightCm}cm;
                            mso-page-orientation: ${orientation};
                            margin: 1.0cm 1.2cm 1.0cm 1.2cm;
                        }
                        div.Section1 {
                            page: Section1;
                        }
                        body {
                            font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
                            color: #0F172A;
                            margin: 0;
                            padding: 0;
                        }
                        table {
                            border-collapse: collapse;
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                        }
                    </style>
                </head>
                <body>
                    <div class="Section1">
                    <!-- HEADER BANNER -->
                    <table style="width: 100%; border: 2px solid #1E3A8A; background-color: #EFF6FF; border-radius: 8px; margin-bottom: 12px; padding: 10px;">
                        <tr>
                            <td style="width: 30%; border: none; vertical-align: middle;">
                                <div style="font-size: 13pt; font-weight: 900; color: #1E3A8A; text-transform: uppercase;">🏫 ${schoolName}</div>
                                <div style="font-size: 8.5pt; color: #475569; margin-top: 3px;">${schoolAddress}</div>
                            </td>
                            <td style="width: 40%; text-align: center; border: none; vertical-align: middle;">
                                <div style="font-size: 18pt; font-weight: 900; color: #0F172A; text-transform: uppercase;">JADWAL PELAJARAN</div>
                                <div style="margin-top: 4px;">
                                    <span style="background-color: #F59E0B; color: #0F172A; font-size: 9.5pt; font-weight: 900; padding: 2px 14px; border-radius: 12px; display: inline-block;">
                                        ${selectedClass.toUpperCase()} (${faseName.toUpperCase()})
                                    </span>
                                </div>
                                <div style="margin-top: 3px;">
                                    <span style="background-color: #1E3A8A; color: #FFFFFF; font-size: 8pt; font-weight: 800; padding: 2px 10px; border-radius: 10px; display: inline-block;">
                                        TAHUN PELAJARAN ${academicYear}
                                    </span>
                                </div>
                            </td>
                            <td style="width: 25%; text-align: right; border: none; vertical-align: middle;">
                                <div style="background-color: #E0F2FE; border: 1.5px solid #38BDF8; padding: 6px 14px; border-radius: 12px; display: inline-block; text-align: center;">
                                    <div style="font-size: 11pt; font-weight: 900; color: #0369A1;">${faseName}</div>
                                    <div style="font-size: 8pt; font-weight: 800; color: #0284C7;">${subFaseText}</div>
                                </div>
                            </td>
                        </tr>
                    </table>

                    <!-- MATRIX TABLE -->
                    <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #0F172A; margin-bottom: 12px;">
                        <thead>
                            <tr>
                                <th style="width: 15%; padding: ${cellPadding}; text-align: center; border: 1.5px solid #1E3A8A; background-color: #FBBF24; color: #0F172A; font-weight: 900; font-size: ${headerFontSize}; text-transform: uppercase;">
                                    ⏱️ WAKTU
                                </th>
                                ${dayHeadersHtml}
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRowsHtml}
                        </tbody>
                    </table>

                    <!-- FOOTER CARDS -->
                    <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 10px;">
                        <tr>
                            <td style="width: 33%; padding: 4px; border: none; vertical-align: top;">
                                <div style="background-color: #F0F9FF; border: 1.5px solid #7DD3FC; border-radius: 8px; padding: 8px 10px;">
                                    <div style="font-size: 8.5pt; font-weight: 900; color: #0369A1; text-transform: uppercase; margin-bottom: 4px; border-bottom: 1px solid #BAE6FD; padding-bottom: 2px;">
                                        📌 Catatan:
                                    </div>
                                    <div style="font-size: 7.5pt; color: #334155; line-height: 1.3;">
                                        <div>⭐ <strong>Disiplin waktu:</strong> Kunci keberhasilan belajar.</div>
                                        <div>❤️ <strong>Kesehatan & Kebersihan:</strong> Saling menghargai.</div>
                                        <div>📚 <strong>Semangat Belajar:</strong> Raih masa depan gemilang!</div>
                                    </div>
                                </div>
                            </td>
                            <td style="width: 33%; padding: 4px; border: none; vertical-align: top;">
                                <div style="background-color: #F8FAFC; border: 1.5px solid #94A3B8; border-radius: 8px; padding: 8px 10px; text-align: center;">
                                    <div style="background-color: #1E3A8A; color: #FFFFFF; font-size: 8pt; font-weight: 800; padding: 1px 10px; border-radius: 8px; display: inline-block; margin-bottom: 4px;">
                                        WALI KELAS
                                    </div>
                                    <div style="font-size: 9.5pt; font-weight: 900; color: #0F172A; margin-top: 2px;">
                                        ${teacherName}
                                    </div>
                                    <div style="font-size: 7.5pt; color: #475569; margin-top: 1px;">
                                        NIP. ${nip}
                                    </div>
                                </div>
                            </td>
                            <td style="width: 34%; padding: 4px; border: none; vertical-align: top;">
                                <div style="background-color: #FEFCE8; border: 1.5px solid #FDE047; border-radius: 8px; padding: 8px 10px; text-align: center;">
                                    <div style="background-color: #CA8A04; color: #FFFFFF; font-size: 8pt; font-weight: 800; padding: 1px 10px; border-radius: 8px; display: inline-block; margin-bottom: 4px;">
                                        MOTTO
                                    </div>
                                    <div style="font-size: 8.5pt; font-style: italic; font-weight: 800; color: #854D0E; line-height: 1.3; margin-top: 2px;">
                                        "Berakhlak Mulia, Berprestasi, Berbudaya, dan Peduli Lingkungan"
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </table>

                    <!-- PAGE 2 REKAPITULASI & TANDA TANGAN -->
                    ${page2Html}
                    </div>
                </body>
                </html>
            `;

            const blob = new Blob(['\ufeff' + wordHtml], {
                type: 'application/msword;charset=utf-8'
            });
            const fileName = `Jadwal_Pelajaran_${selectedClass.replace(/\s+/g, '_')}_${academicYear.replace(/\//g, '-')}.doc`;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Gagal mengekspor Word Jadwal Pelajaran:', e);
            alert('Gagal mengekspor Dokumen Word Jadwal Pelajaran. Silakan coba lagi.');
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 md:p-8 max-w-6xl mx-auto space-y-6">
            {/* Header Title & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
                        <CalendarCheck className="w-6 h-6 text-emerald-600" />
                        <span>Jadwal Pelajaran & Alokasi Mengajar ({selectedClass})</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Pilih alokasi hari kerja, tetapkan mata pelajaran lengkap, serta tentukan beban JP harian.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={handleAutoRecalculateAllDays}
                        className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        title="Hitung ulang otomatis alokasi waktu seluruh hari berdasarkan 1 JP = 35 Menit"
                    >
                        <Clock className="w-4 h-4 text-amber-600" /> Hitung Otomatis (1 JP = 35 m)
                    </button>
                    <button
                        onClick={handleExplicitSave}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                        title="Simpan Jadwal Pelajaran"
                    >
                        <Save className="w-4 h-4" /> Simpan
                    </button>
                    <button
                        onClick={handleResetSchedule}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        title="Riset ke jadwal default"
                    >
                        Reset Jadwal
                    </button>
                    <button
                        onClick={() => setShowExportModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                        title="Unduh Jadwal Pelajaran Output Word Modern & Rapi"
                    >
                        <FileDown className="w-4 h-4" /> Unduh Jadwal Pelajaran
                    </button>
                </div>
            </div>

            {/* Success Notification Banner */}
            {saveSuccessMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in duration-200 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>{saveSuccessMessage}</span>
                    </div>
                    <button 
                        onClick={() => setSaveSuccessMessage(null)}
                        className="p-1 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Auto Time Allocation Banner & Settings Bar */}
            <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
                        <Clock className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                        <span className="text-xs font-extrabold text-slate-900 block flex items-center gap-2">
                            <span>Pengaturan Alokasi Waktu Otomatis (1 JP = 35 Menit SD/MI)</span>
                            <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] rounded-full uppercase">Otomatis Active</span>
                        </span>
                        <span className="text-[11px] text-slate-600">
                            Mengatur alokasi waktu (`Waktu`) dan urutan jam ke- (`Jam Ke-`) secara otomatis begitu Beban JP dipilih.
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleAutoRecalculateAllDays}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                        <Clock className="w-4 h-4" /> Alokasikan Semua Hari
                    </button>
                </div>
            </div>

            {/* School Days Selection Bar */}
            <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div>
                    <span className="text-xs font-bold text-slate-700 block">Pilihan Jadwal Hari Kerja:</span>
                    <span className="text-[11px] text-slate-500">Tentukan apakah sekolah menerapkan 5 hari kerja (Senin-Jumat) atau 6 hari kerja (Senin-Sabtu).</span>
                </div>
                <div className="inline-flex rounded-xl p-1 bg-slate-200/80 border border-slate-300/60">
                    <button
                        onClick={() => {
                            if (setSchoolDaysCount) setSchoolDaysCount(5);
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                            schoolDaysCount === 5 
                                ? 'bg-emerald-600 text-white shadow-xs' 
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        🗓️ 5 Hari Kerja (Senin - Jumat)
                    </button>
                    <button
                        onClick={() => {
                            if (setSchoolDaysCount) setSchoolDaysCount(6);
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                            schoolDaysCount === 6 
                                ? 'bg-emerald-600 text-white shadow-xs' 
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        🗓️ 6 Hari Kerja (Senin - Sabtu)
                    </button>
                </div>
            </div>

            {/* Schedule Cards for Each Active Day */}
            <div className="space-y-6">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                    <span>Tabel Jadwal Pelajaran Harian ({selectedClass})</span>
                </h3>

                <div className="grid grid-cols-1 gap-5">
                    {activeDaysList.map(day => {
                        const slots = weeklySchedule[day] || [];
                        const dailyJp = getDailyTotalJP(day);
                        const startTime = dayStartTimes[day] || '07.30';

                        return (
                            <div key={day} className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 md:p-5 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                        <h4 className="font-extrabold text-sm text-slate-900">{day}</h4>
                                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                                            {dailyJp} JP
                                        </span>

                                        {/* Input Jam Mulai KBM per Hari */}
                                        <div className="flex items-center gap-1.5 ml-2 bg-white border border-slate-200 px-2 py-1 rounded-xl">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Jam Mulai:</span>
                                            <input 
                                                type="text" 
                                                value={startTime}
                                                onChange={e => handleUpdateDayStartTime(day, e.target.value)}
                                                className="w-14 text-xs font-extrabold text-emerald-800 bg-transparent text-center outline-none"
                                                placeholder="07.30"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleAutoRecalculateDay(day)}
                                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                            title="Hitung ulang alokasi waktu hari ini (1 JP = 35m)"
                                        >
                                            <Clock className="w-3.5 h-3.5 text-amber-600" /> Auto Waktu (35m)
                                        </button>
                                        <button
                                            onClick={() => handleAddSlot(day)}
                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Tambah Sesi
                                        </button>
                                    </div>
                                </div>

                                {slots.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-slate-400 italic bg-white rounded-xl border border-dashed border-slate-200">
                                        Belum ada jadwal pelajaran untuk hari {day}. Klik "Tambah Sesi Pelajaran" di atas.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {slots.map((slot) => (
                                            <div key={slot.id} className="bg-white border border-slate-200 rounded-2xl p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center shadow-2xs">
                                                {/* Jam Ke & Time */}
                                                <div className="md:col-span-3 grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Jam Ke-</label>
                                                        <input 
                                                            type="text" 
                                                            value={slot.jamKe} 
                                                            onChange={e => handleUpdateSlot(day, slot.id, 'jamKe', e.target.value)}
                                                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                                                            placeholder="1 - 2"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Waktu</label>
                                                        <input 
                                                            type="text" 
                                                            value={slot.time} 
                                                            onChange={e => handleUpdateSlot(day, slot.id, 'time', e.target.value)}
                                                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                                                            placeholder="07.30 - 08.40"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Dropdown Mata Pelajaran Lengkap */}
                                                <div className="md:col-span-4">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Mata Pelajaran (Dropdown)</label>
                                                    <select
                                                        value={slot.subject}
                                                        onChange={e => handleUpdateSlot(day, slot.id, 'subject', e.target.value)}
                                                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                                                    >
                                                        {MAPEL_CATEGORIES.map(cat => (
                                                            <optgroup key={cat.category} label={cat.category}>
                                                                {cat.options.map(mapel => (
                                                                    <option key={mapel} value={mapel}>{mapel}</option>
                                                                ))}
                                                            </optgroup>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Beban JP Dropdown */}
                                                <div className="md:col-span-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Beban JP</label>
                                                    <select
                                                        value={slot.jp}
                                                        onChange={e => handleUpdateSlot(day, slot.id, 'jp', parseInt(e.target.value) || 1)}
                                                        className="w-full p-2 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-extrabold outline-none focus:ring-2 focus:ring-emerald-500"
                                                    >
                                                        {[1, 2, 3, 4, 5, 6].map(num => (
                                                            <option key={num} value={num}>{num} JP</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Notes / Lokasi & Actions */}
                                                <div className="md:col-span-3 flex items-center gap-2">
                                                    <div className="flex-1">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Keterangan / Ruang</label>
                                                        <input 
                                                            type="text" 
                                                            value={slot.notes || ''} 
                                                            onChange={e => handleUpdateSlot(day, slot.id, 'notes', e.target.value)}
                                                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                                                            placeholder="Ruang Kelas / Lapangan"
                                                        />
                                                    </div>
                                                    <div className="pt-4">
                                                        <button
                                                            onClick={() => handleDeleteSlot(day, slot.id)}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                                            title="Hapus Sesi Ini"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Summary Rekapitulasi Beban JP per Mata Pelajaran Table */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Table className="w-4 h-4 text-emerald-600" />
                        <span>Rekapitulasi Alokasi Beban JP Mingguan ({selectedClass})</span>
                    </span>
                    <span className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-full font-bold">
                        Total {totalWeeklyJp} JP / Pekan
                    </span>
                </h3>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                            <tr>
                                <th className="p-3 text-center w-12">No</th>
                                <th className="p-3">Mata Pelajaran</th>
                                <th className="p-3">Hari Pelaksanaan</th>
                                <th className="p-3 text-center w-36">Total Beban JP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {Object.keys(subjectJpSummary).length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-6 text-center text-slate-400 italic">Belum ada mata pelajaran yang dijadwalkan.</td>
                                </tr>
                            ) : (
                                Object.entries(subjectJpSummary).map(([sub, info]: [string, any], idx) => (
                                    <tr key={sub} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                                        <td className="p-3 font-bold text-slate-800">{sub}</td>
                                        <td className="p-3 text-slate-600 font-semibold">{info.days.join(', ')}</td>
                                        <td className="p-3 text-center">
                                            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                                                {info.totalJp} JP / Pekan
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                            <tr className="bg-slate-100/80 font-bold text-slate-900">
                                <td colSpan={3} className="p-3 text-right">TOTAL BEBAN MENGAJAR MINGGUAN KELAS:</td>
                                <td className="p-3 text-center text-emerald-800 font-extrabold text-sm">{totalWeeklyJp} JP / Pekan</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom Action Card with Simpan Button */}
            <div className="p-4 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3 text-xs text-emerald-950 font-medium">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                        <span className="font-extrabold block text-slate-900 text-xs">Simpan Jadwal Pelajaran ({selectedClass})</span>
                        <span className="text-[11px] text-slate-600">Klik tombol <strong>Simpan</strong> untuk menyimpan seluruh susunan jadwal dan alokasi JP ke penyimpanan lokal.</span>
                    </div>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => setShowExportModal(true)}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                        title="Unduh Jadwal Pelajaran Output Word Modern & Rapi"
                    >
                        <FileDown className="w-4 h-4" /> Unduh Jadwal Pelajaran
                    </button>
                    <button
                        onClick={handleExplicitSave}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                        <Save className="w-4 h-4" /> Simpan
                    </button>
                </div>
            </div>

            {/* Modal Pengaturan Unduh Jadwal Pelajaran (Word & PDF) */}
            {showExportModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 md:p-7 space-y-6"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-extrabold text-slate-900">Unduh Jadwal Pelajaran (Word & PDF)</h3>
                                    <p className="text-xs text-slate-500">Pilih format Dokumen Word (.doc), ukuran kertas, dan orientasi halaman.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowExportModal(false)}
                                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form Options */}
                        <div className="space-y-4">
                            {/* 1. Ukuran Kertas */}
                            <div>
                                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block mb-2">
                                    Ukuran Kertas (Layout Paper Size):
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setExportPaperSize('A4')}
                                        className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                                            exportPaperSize === 'A4'
                                                ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                                                : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300'
                                        }`}
                                    >
                                        <div>
                                            <div className="text-xs font-extrabold">A4</div>
                                            <div className="text-[10px] text-slate-500">21.0 x 29.7 cm</div>
                                        </div>
                                        {exportPaperSize === 'A4' && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setExportPaperSize('F4')}
                                        className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                                            exportPaperSize === 'F4'
                                                ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                                                : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300'
                                        }`}
                                    >
                                        <div>
                                            <div className="text-xs font-extrabold">F4 / Folio</div>
                                            <div className="text-[10px] text-slate-500">21.5 x 33.0 cm</div>
                                        </div>
                                        {exportPaperSize === 'F4' && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                                    </button>
                                </div>
                            </div>

                            {/* 2. Orientasi Halaman */}
                            <div>
                                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block mb-2">
                                    Orientasi Halaman (Orientation):
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setExportOrientation('landscape')}
                                        className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                                            exportOrientation === 'landscape'
                                                ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                                                : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300'
                                        }`}
                                    >
                                        <div>
                                            <div className="text-xs font-extrabold flex items-center gap-1.5">
                                                <span>Landscape</span>
                                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] rounded-md font-extrabold">Pas 1 Halaman</span>
                                            </div>
                                            <div className="text-[10px] text-slate-500">Mendatar (Rekomendasi)</div>
                                        </div>
                                        {exportOrientation === 'landscape' && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setExportOrientation('portrait')}
                                        className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                                            exportOrientation === 'portrait'
                                                ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                                                : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300'
                                        }`}
                                    >
                                        <div>
                                            <div className="text-xs font-extrabold">Portrait</div>
                                            <div className="text-[10px] text-slate-500">Tegak (Vertikal)</div>
                                        </div>
                                        {exportOrientation === 'portrait' && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                                    </button>
                                </div>
                            </div>

                            {/* 3. Opsi Tambahan */}
                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                                <label className="flex items-center gap-2.5 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={includeSignature}
                                        onChange={(e) => setIncludeSignature(e.target.checked)}
                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-xs font-bold text-slate-800">
                                        Sertakan Halaman 2: Rekapitulasi JP & Tanda Tangan
                                    </span>
                                </label>
                                <p className="text-[10px] text-slate-500 ml-6 mt-0.5">
                                    {includeSignature ? 'Halaman 1 memuat poster Jadwal Pelajaran (1 halaman pas), Halaman 2 memuat Rekapitulasi Alokasi Beban JP Mingguan & Tanda Tangan Kepala Sekolah/Wali Kelas.' : 'Satu halaman pas hanya poster Jadwal Pelajaran.'}
                                </p>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowExportModal(false)}
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowExportModal(false);
                                    handleExportPdf(exportPaperSize, exportOrientation, includeSignature);
                                }}
                                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                            >
                                <FileDown className="w-4 h-4" /> Pratinjau / PDF
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowExportModal(false);
                                    handleExportWord(exportPaperSize, exportOrientation, includeSignature);
                                }}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                            >
                                <FileText className="w-4 h-4" /> Unduh Dokumen Word (.doc)
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

// --- Hari Efektif View Component ---
interface HariEfektifViewProps {
    selectedClass?: string;
    setSelectedClass?: (cls: string) => void;
    selectedSubject?: string;
    setSelectedSubject?: (sub: string) => void;
    classSchedules?: Record<string, string[]>;
    classDailyJP?: Record<string, Record<string, number>>;
    calendarEvents?: CalendarEvent[];
    academicYearStart?: number;
    schoolDaysCount?: number;
    identity: UserIdentity;
}

const HariEfektifView: React.FC<HariEfektifViewProps> = ({
    selectedClass = 'Kelas 1',
    setSelectedClass,
    selectedSubject = 'Bahasa Indonesia',
    setSelectedSubject,
    classSchedules = {},
    classDailyJP = {},
    calendarEvents = DEFAULT_CALENDAR_EVENTS,
    academicYearStart = 2025,
    schoolDaysCount = 5,
    identity
}) => {
    const [activeSubject, setActiveSubject] = useState<string>(selectedSubject);

    useEffect(() => {
        if (selectedSubject) setActiveSubject(selectedSubject);
    }, [selectedSubject]);

    const handleSubjectChange = (newSubject: string) => {
        setActiveSubject(newSubject);
        if (setSelectedSubject) setSelectedSubject(newSubject);
    };

    // Calculate effective Days, Weeks, Meetings, and JP
    const analysisData = useMemo(() => {
        // Read weekly schedule from localStorage for selectedClass
        let weeklyRoster: Record<string, ScheduleSlot[]> = {};
        try {
            const saved = localStorage.getItem(`prota_weekly_roster_${selectedClass}`);
            if (saved) weeklyRoster = JSON.parse(saved);
        } catch (e) {}

        const daysList = schoolDaysCount === 5 
            ? ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] 
            : ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

        const subjectScheduledDays: string[] = [];
        const subjectDailyJpMap: Record<string, number> = {};

        // Find days and JP per day specifically for activeSubject in selectedClass
        daysList.forEach(day => {
            const slots = weeklyRoster[day] || [];
            let dayJp = 0;
            slots.forEach(slot => {
                if (!slot.subject) return;
                const slotSubjLower = slot.subject.toLowerCase().trim();
                const targetSubjLower = activeSubject.toLowerCase().trim();
                if (slotSubjLower === targetSubjLower ||
                    slotSubjLower.includes(targetSubjLower) ||
                    targetSubjLower.includes(slotSubjLower)) {
                    dayJp += Number(slot.jp) || 1;
                }
            });
            if (dayJp > 0) {
                subjectScheduledDays.push(day);
                subjectDailyJpMap[day] = dayJp;
            }
        });

        // Use subject-specific schedule from weeklyRoster, or fallback to classSchedules & classDailyJP
        const scheduledDays = subjectScheduledDays.length > 0 
            ? subjectScheduledDays 
            : (schoolDaysCount === 5 ? (classSchedules[selectedClass] || []).filter(d => d !== 'Sabtu') : (classSchedules[selectedClass] || []));

        const dailyJpMap = subjectScheduledDays.length > 0 
            ? subjectDailyJpMap 
            : (classDailyJP[selectedClass] || {});

        const getSubKey = (sub: string) => {
            if (!sub) return null;
            if (JP_STANDARDS[sub]) return sub;
            const keys = Object.keys(JP_STANDARDS);
            const lower = String(sub).toLowerCase().trim();
            const direct = keys.find(k => k.toLowerCase() === lower);
            if (direct) return direct;
            return keys.find(k => lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)) || null;
        };

        const subKey = getSubKey(activeSubject);
        const annualTargetJp = subKey ? JP_STANDARDS[subKey]?.[selectedClass] || 180 : 180;

        const checkEventConflict = (dateStr: string): CalendarEvent | null => {
            return calendarEvents.find(range => dateStr >= range.start && dateStr <= range.end) || null;
        };

        const getDayNameLocal = (date: Date): string => {
            const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
            return days[date.getDay()];
        };

        const getIsoWeekLocal = (d: Date) => {
            const date = new Date(d.getTime());
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
            const week1 = new Date(date.getFullYear(), 0, 4);
            return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
        };

        const startDate = new Date(academicYearStart, 6, 14); // 14 Juli academicYearStart
        const endDate = new Date(academicYearStart + 1, 5, 27);  // 27 Juni academicYearStart + 1

        interface MonthData {
            monthKey: string;
            monthName: string;
            semester: 1 | 2;
            totalDays: number;
            schoolDays: number;
            effectiveSchoolDays: number; // HEB
            nonEffectiveSchoolDays: number;
            effectiveWeeksCount: number; // PEB
            subjectMeetingsCount: number; // Pertemuan Mapel
            subjectJpTotal: number; // Total JP Mapel
            subjectConflictDetails: { date: string; day: string; reason: string; lostJp: number }[];
            subjectEffectiveDates?: Record<string, number[]>;
        }

        const monthMap: Record<string, MonthData> = {};

        let current = new Date(startDate);
        while (current <= endDate) {
            const dateStr = formatDateLocal(current);
            const monthName = current.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
            const semester: 1 | 2 = (current.getMonth() >= 6 && current.getFullYear() === academicYearStart) ? 1 : 2;
            const dayName = getDayNameLocal(current);
            const isWeekend = schoolDaysCount === 5 ? (dayName === 'Sabtu' || dayName === 'Minggu') : (dayName === 'Minggu');
            const isSchoolWorkingDay = !isWeekend;

            if (!monthMap[monthName]) {
                monthMap[monthName] = {
                    monthKey: monthName,
                    monthName,
                    semester,
                    totalDays: 0,
                    schoolDays: 0,
                    effectiveSchoolDays: 0,
                    nonEffectiveSchoolDays: 0,
                    effectiveWeeksCount: 0,
                    subjectMeetingsCount: 0,
                    subjectJpTotal: 0,
                    subjectConflictDetails: [],
                    subjectEffectiveDates: {}
                };
            }

            const mData = monthMap[monthName];
            mData.totalDays++;

            if (isSchoolWorkingDay) {
                mData.schoolDays++;
                const conflict = checkEventConflict(dateStr);
                if (!conflict) {
                    mData.effectiveSchoolDays++;
                } else {
                    mData.nonEffectiveSchoolDays++;
                }

                if (scheduledDays.includes(dayName)) {
                    const dailyJpVal = dailyJpMap[dayName] || 3;
                    if (!conflict) {
                        mData.subjectMeetingsCount++;
                        mData.subjectJpTotal += dailyJpVal;

                        if (!mData.subjectEffectiveDates) {
                            mData.subjectEffectiveDates = {};
                        }
                        if (!mData.subjectEffectiveDates[dayName]) {
                            mData.subjectEffectiveDates[dayName] = [];
                        }
                        mData.subjectEffectiveDates[dayName].push(current.getDate());
                    } else {
                        mData.subjectConflictDetails.push({
                            date: dateStr,
                            day: dayName,
                            reason: conflict.description,
                            lostJp: dailyJpVal
                        });
                    }
                }
            }

            current.setDate(current.getDate() + 1);
        }

        // Compute Pekan Efektif (PEB) per month based on unique ISO weeks with at least 1 effective day
        Object.keys(monthMap).forEach(mKey => {
            const mData = monthMap[mKey];
            const [mName, yStr] = mKey.split(' ');
            const yearNum = parseInt(yStr);
            const monthIdx = new Date(Date.parse(`${mName} 1, ${yearNum}`)).getMonth();

            const uniqueWeeksInMonth = new Set<number>();
            let dIter = new Date(yearNum, monthIdx, 1);
            while (dIter.getMonth() === monthIdx) {
                const dayName = getDayNameLocal(dIter);
                const isWeekend = schoolDaysCount === 5 ? (dayName === 'Sabtu' || dayName === 'Minggu') : (dayName === 'Minggu');
                if (!isWeekend) {
                    const dStr = formatDateLocal(dIter);
                    if (!checkEventConflict(dStr)) {
                        uniqueWeeksInMonth.add(getIsoWeekLocal(dIter));
                    }
                }
                dIter.setDate(dIter.getDate() + 1);
            }
            mData.effectiveWeeksCount = uniqueWeeksInMonth.size;
        });

        const monthsList = Object.values(monthMap);

        const sem1Months = monthsList.filter(m => m.semester === 1);
        const sem2Months = monthsList.filter(m => m.semester === 2);

        const sumSem = (list: MonthData[]) => ({
            heb: list.reduce((a, b) => a + b.effectiveSchoolDays, 0),
            peb: list.reduce((a, b) => a + b.effectiveWeeksCount, 0),
            meetings: list.reduce((a, b) => a + b.subjectMeetingsCount, 0),
            jp: list.reduce((a, b) => a + b.subjectJpTotal, 0),
            conflicts: list.flatMap(b => b.subjectConflictDetails)
        });

        const sem1 = sumSem(sem1Months);
        const sem2 = sumSem(sem2Months);

        const totalHeb = sem1.heb + sem2.heb;
        const totalPeb = sem1.peb + sem2.peb;
        const totalMeetings = sem1.meetings + sem2.meetings;
        const totalJp = sem1.jp + sem2.jp;
        const allConflicts = [...sem1.conflicts, ...sem2.conflicts];

        const weeklyMeetingsCount = scheduledDays.length;
        const weeklyJpTotal = scheduledDays.reduce((acc, day) => acc + (dailyJpMap[day] || 3), 0);

        return {
            scheduledDays,
            dailyJpMap,
            weeklyMeetingsCount,
            weeklyJpTotal,
            annualTargetJp,
            sem1Months,
            sem2Months,
            sem1,
            sem2,
            totalHeb,
            totalPeb,
            totalMeetings,
            totalJp,
            allConflicts
        };
    }, [selectedClass, activeSubject, classSchedules, classDailyJP, calendarEvents, academicYearStart, schoolDaysCount]);

    const getSubjectMeetingsDetail = (mData: any) => {
        const dayOrder = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
        const detailParts: string[] = [];
        const datesObj = mData.subjectEffectiveDates || {};
        dayOrder.forEach(day => {
            const dates = datesObj[day];
            if (dates && dates.length > 0) {
                detailParts.push(`${day} ${dates.length} HEB (tgl ${dates.join(', ')})`);
            }
        });
        return detailParts.join(', ');
    };

    // Export to Word Handler
    const handleExportWord = () => {
        const schoolName = identity.institutionName || 'SD Negeri 1 Merdeka';
        const teacherName = identity.authorName || 'Guru Kelas';

        let html = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset='utf-8'>
            <title>Analisis Hari & Pekan Efektif - ${activeSubject} ${selectedClass}</title>
            <style>
                @page { size: A4 portrait; margin: 1.5cm; }
                body { font-family: 'Arial', sans-serif; font-size: 10pt; line-height: 1.3; color: #1e293b; }
                h1, h2, h3 { margin: 0; padding: 0; }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .header-box { border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px; text-align: center; }
                table { border-collapse: collapse; width: 100%; margin-top: 10px; margin-bottom: 16px; }
                td, th { border: 1px solid #000; padding: 5px 8px; font-size: 9pt; vertical-align: middle; }
                th { background-color: #f1f5f9; text-align: center; font-weight: bold; text-transform: uppercase; }
                .bg-total { background-color: #e2e8f0; font-weight: bold; }
                .sign-table { border: none; margin-top: 24px; }
                .sign-table td { border: none; padding: 4px; text-align: center; }
            </style>
        </head>
        <body>
            <div class="header-box">
                <h2 style="font-size: 13pt;">ANALISIS HARI EFEKTIF (HEB) & PEKAN EFEKTIF BELAJAR (PEB)</h2>
                <h3 style="font-size: 11pt;">SATUAN PENDIDIKAN: ${schoolName.toUpperCase()}</h3>
                <p style="font-size: 9pt; margin-top: 4px;">
                    Mata Pelajaran: <b>${activeSubject}</b> | Kelas: <b>${selectedClass}</b> | Tahun Ajaran: <b>${identity.academicYear}</b>
                </p>
            </div>

            <table style="margin-bottom: 12px;">
                <tr>
                    <td width="20%" class="font-bold">Mata Pelajaran</td><td width="30%">${activeSubject}</td>
                    <td width="20%" class="font-bold">Beban Mingguan</td><td width="30%">${analysisData.weeklyMeetingsCount} Pertemuan (${analysisData.weeklyJpTotal} JP / Pekan)</td>
                </tr>
                <tr>
                    <td class="font-bold">Kelas / Fase</td><td>${selectedClass} (${getFaseForClass(selectedClass).name})</td>
                    <td class="font-bold">Jadwal Mengajar</td><td>${analysisData.scheduledDays.map(d => `${d}${analysisData.dailyJpMap[d] ? ` (${analysisData.dailyJpMap[d]} JP)` : ''}`).join(', ') || 'Belum diatur'}</td>
                </tr>
                <tr>
                    <td class="font-bold">Nama Guru</td><td>${teacherName}</td>
                    <td class="font-bold">Target Kurikulum</td><td><b>${analysisData.annualTargetJp} JP / Tahun</b></td>
                </tr>
            </table>

            <h3 style="font-size: 10.5pt; margin-top: 12px; margin-bottom: 6px;">I. RINCIAN PERHITUNGAN EFEKTIF SEMESTER GANJIL (SEMESTER 1)</h3>
            <table>
                <thead>
                    <tr>
                        <th width="5%">NO</th>
                        <th>BULAN & TAHUN</th>
                        <th width="15%">HARI KERJA</th>
                        <th width="15%">HEB SEKOLAH</th>
                        <th width="15%">PEB SEKOLAH</th>
                        <th width="18%">PERTEMUAN MAPEL</th>
                        <th width="15%">TOTAL JP MAPEL</th>
                    </tr>
                </thead>
                <tbody>`;

        analysisData.sem1Months.forEach((m, idx) => {
            const detailStr = getSubjectMeetingsDetail(m);
            html += `
            <tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td><b>${m.monthName}</b></td>
                <td style="text-align:center;">${m.schoolDays} Hari</td>
                <td style="text-align:center;">${m.effectiveSchoolDays} Hari</td>
                <td style="text-align:center;">${m.effectiveWeeksCount} Pekan</td>
                <td style="text-align:center; font-weight:bold;">
                    ${m.subjectMeetingsCount} Pertemuan
                    ${detailStr ? `<div style="font-size:8pt; font-weight:normal; color:#16a34a; margin-top:2px; text-align:center;">${detailStr}</div>` : ''}
                </td>
                <td style="text-align:center; font-weight:bold; color:#047857;">${m.subjectJpTotal} JP</td>
            </tr>`;
        });

        html += `
                <tr class="bg-total">
                    <td colSpan="2" style="text-align:right;">SUBTOTAL SEMESTER GANJIL:</td>
                    <td style="text-align:center;">${analysisData.sem1Months.reduce((a, b) => a + b.schoolDays, 0)} Hari</td>
                    <td style="text-align:center;">${analysisData.sem1.heb} Hari</td>
                    <td style="text-align:center;">${analysisData.sem1.peb} Pekan</td>
                    <td style="text-align:center;">${analysisData.sem1.meetings} Pertemuan</td>
                    <td style="text-align:center;">${analysisData.sem1.jp} JP</td>
                </tr>
                </tbody>
            </table>

            <h3 style="font-size: 10.5pt; margin-top: 16px; margin-bottom: 6px;">II. RINCIAN PERHITUNGAN EFEKTIF SEMESTER GENAP (SEMESTER 2)</h3>
            <table>
                <thead>
                    <tr>
                        <th width="5%">NO</th>
                        <th>BULAN & TAHUN</th>
                        <th width="15%">HARI KERJA</th>
                        <th width="15%">HEB SEKOLAH</th>
                        <th width="15%">PEB SEKOLAH</th>
                        <th width="18%">PERTEMUAN MAPEL</th>
                        <th width="15%">TOTAL JP MAPEL</th>
                    </tr>
                </thead>
                <tbody>`;

        analysisData.sem2Months.forEach((m, idx) => {
            const detailStr = getSubjectMeetingsDetail(m);
            html += `
            <tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td><b>${m.monthName}</b></td>
                <td style="text-align:center;">${m.schoolDays} Hari</td>
                <td style="text-align:center;">${m.effectiveSchoolDays} Hari</td>
                <td style="text-align:center;">${m.effectiveWeeksCount} Pekan</td>
                <td style="text-align:center; font-weight:bold;">
                    ${m.subjectMeetingsCount} Pertemuan
                    ${detailStr ? `<div style="font-size:8pt; font-weight:normal; color:#1d4ed8; margin-top:2px; text-align:center;">${detailStr}</div>` : ''}
                </td>
                <td style="text-align:center; font-weight:bold; color:#1d4ed8;">${m.subjectJpTotal} JP</td>
            </tr>`;
        });

        html += `
                <tr class="bg-total">
                    <td colSpan="2" style="text-align:right;">SUBTOTAL SEMESTER GENAP:</td>
                    <td style="text-align:center;">${analysisData.sem2Months.reduce((a, b) => a + b.schoolDays, 0)} Hari</td>
                    <td style="text-align:center;">${analysisData.sem2.heb} Hari</td>
                    <td style="text-align:center;">${analysisData.sem2.peb} Pekan</td>
                    <td style="text-align:center;">${analysisData.sem2.meetings} Pertemuan</td>
                    <td style="text-align:center;">${analysisData.sem2.jp} JP</td>
                </tr>
                <tr style="background-color:#059669; color:#ffffff; font-weight:bold; font-size:10pt;">
                    <td colSpan="2" style="text-align:right; padding:8px;">GRAND TOTAL 1 TAHUN AJARAN:</td>
                    <td style="text-align:center;">${analysisData.sem1Months.reduce((a, b) => a + b.schoolDays, 0) + analysisData.sem2Months.reduce((a, b) => a + b.schoolDays, 0)} Hari</td>
                    <td style="text-align:center;">${analysisData.totalHeb} Hari</td>
                    <td style="text-align:center;">${analysisData.totalPeb} Pekan</td>
                    <td style="text-align:center;">${analysisData.totalMeetings} Pertemuan</td>
                    <td style="text-align:center;">${analysisData.totalJp} JP</td>
                </tr>
                </tbody>
            </table>

            <h3 style="font-size: 10.5pt; margin-top: 16px; margin-bottom: 6px;">III. REKAPITULASI KETERCAPAIAN BEBAN MENGAJAR</h3>
            <table>
                <tr>
                    <td width="35%" class="font-bold">Standar Target Kurikulum Nasional</td>
                    <td><b>${analysisData.annualTargetJp} JP / Tahun</b></td>
                </tr>
                <tr>
                    <td class="font-bold">Realisasi Jam Pelajaran (JP) Efektif</td>
                    <td><b>${analysisData.totalJp} JP / Tahun</b> (${analysisData.totalMeetings} Pertemuan)</td>
                </tr>
                <tr>
                    <td class="font-bold">Status Ketercapaian Target</td>
                    <td><b>${analysisData.totalJp >= analysisData.annualTargetJp ? 'MEMENUHI STANDAR KURIKULUM (' + Math.round((analysisData.totalJp / analysisData.annualTargetJp) * 100) + '%)' : 'PENYESUAIAN DIPERLUKAN (' + Math.round((analysisData.totalJp / analysisData.annualTargetJp) * 100) + '%)'}</b></td>
                </tr>
            </table>

            <table class="sign-table" style="margin-top: 30px;">
                <tr>
                    <td width="50%">
                        Mengetahui,<br/>
                        Kepala ${schoolName}<br/><br/><br/><br/>
                        <b><u>..........................................</u></b><br/>
                        NIP. ..........................................
                    </td>
                    <td width="50%">
                        ${schoolName.replace(/SDN|SD|Sekolah/gi, '').trim()}, .................... 2025<br/>
                        Guru Mata Pelajaran / Kelas<br/><br/><br/><br/>
                        <b><u>${teacherName}</u></b><br/>
                        NIP. ..........................................
                    </td>
                </tr>
            </table>
        </body>
        </html>`;

        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Analisis_Hari_Efektif_${activeSubject.replace(/\s+/g, '_')}_${selectedClass.replace(/\s+/g, '_')}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 md:p-8 max-w-6xl mx-auto space-y-6">
            {/* Header Title & Navigation Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
                        <CalendarDays className="w-6 h-6 text-emerald-600" />
                        <span>Analisis Hari & Pekan Efektif Belajar ({selectedClass})</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Perhitungan otomatis ketersediaan Hari Efektif Belajar (HEB), Pekan Efektif (PEB), serta Alokasi Pertemuan & JP per Mata Pelajaran.</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportWord}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                        <Download className="w-4 h-4" /> Unduh Analisis (.doc)
                    </button>
                </div>
            </div>

            {/* Filter Selection Bar (Subject Selector ONLY) */}
            <div className="p-4 bg-slate-50/90 border border-slate-200 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 text-xs items-center">
                <div>
                    <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Pilih Mata Pelajaran</label>
                    <select
                        value={activeSubject}
                        onChange={e => handleSubjectChange(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                    >
                        {SUBJECTS.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                </div>

                <div className="p-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl">
                    <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">Jadwal Mengajar Mapel Ini ({selectedClass}):</span>
                    <span className="text-xs font-extrabold text-emerald-950">
                        {analysisData.scheduledDays.length > 0 
                            ? `${analysisData.scheduledDays.join(', ')} (${analysisData.weeklyMeetingsCount}x / ${analysisData.weeklyJpTotal} JP seminggu)` 
                            : 'Belum diatur di Jadwal Mengajar'}
                    </span>
                </div>
            </div>

            {/* KPI Summary Banner (4 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
                    <div>
                        <div className="text-[10px] font-extrabold text-emerald-800 uppercase">Pertemuan / Minggu</div>
                        <div className="text-lg font-black text-emerald-950 mt-0.5">{analysisData.weeklyMeetingsCount} Pertemuan <span className="text-xs font-bold text-emerald-700">({analysisData.weeklyJpTotal} JP)</span></div>
                        <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Hari: {analysisData.scheduledDays.join(', ') || '-'}</div>
                    </div>
                    <Clock className="w-7 h-7 text-emerald-500/50" />
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200/80 rounded-2xl flex items-center justify-between">
                    <div>
                        <div className="text-[10px] font-extrabold text-blue-800 uppercase">Pekan Efektif (PEB)</div>
                        <div className="text-lg font-black text-blue-950 mt-0.5">{analysisData.totalPeb} Pekan <span className="text-xs font-bold text-blue-700">/ 1 Tahun</span></div>
                        <div className="text-[10px] text-blue-700 font-semibold mt-0.5">Smt 1: {analysisData.sem1.peb} Pekan | Smt 2: {analysisData.sem2.peb} Pekan</div>
                    </div>
                    <Calendar className="w-7 h-7 text-blue-500/50" />
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200/80 rounded-2xl flex items-center justify-between">
                    <div>
                        <div className="text-[10px] font-extrabold text-purple-800 uppercase">Hari Efektif Belajar (HEB)</div>
                        <div className="text-lg font-black text-purple-950 mt-0.5">{analysisData.totalHeb} Hari <span className="text-xs font-bold text-purple-700">Sekolah</span></div>
                        <div className="text-[10px] text-purple-700 font-semibold mt-0.5">Smt 1: {analysisData.sem1.heb} Hari | Smt 2: {analysisData.sem2.heb} Hari</div>
                    </div>
                    <CalendarCheck className="w-7 h-7 text-purple-500/50" />
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center justify-between">
                    <div>
                        <div className="text-[10px] font-extrabold text-amber-800 uppercase">Total Pertemuan & JP Mapel</div>
                        <div className="text-lg font-black text-amber-950 mt-0.5">{analysisData.totalMeetings} Sesi <span className="text-xs font-bold text-amber-700">({analysisData.totalJp} JP)</span></div>
                        <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Standar Target: {analysisData.annualTargetJp} JP / Thn</div>
                    </div>
                    <BarChart3 className="w-7 h-7 text-amber-500/50" />
                </div>
            </div>

            {/* Tables for Semester 1 and Semester 2 */}
            <div className="space-y-6">
                {/* Semester 1 Table */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            <span>I. Semester Ganjil (Juli - Desember {academicYearStart})</span>
                        </h3>
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                            {analysisData.sem1.meetings} Pertemuan ({analysisData.sem1.jp} JP Efektif)
                        </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 text-slate-700 uppercase font-extrabold text-[10px]">
                                <tr>
                                    <th className="p-3 text-center border-b border-slate-200" width="4%">No</th>
                                    <th className="p-3 border-b border-slate-200">Bulan & Tahun</th>
                                    <th className="p-3 text-center border-b border-slate-200">Hari Kerja</th>
                                    <th className="p-3 text-center border-b border-slate-200">HEB Sekolah</th>
                                    <th className="p-3 text-center border-b border-slate-200">PEB Sekolah</th>
                                    <th className="p-3 text-center border-b border-slate-200">Pertemuan ({activeSubject})</th>
                                    <th className="p-3 text-center border-b border-slate-200">Total JP Efektif</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {analysisData.sem1Months.map((m, idx) => (
                                    <tr key={m.monthKey} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-3 text-center text-slate-500">{idx + 1}</td>
                                        <td className="p-3 font-bold text-slate-800">{m.monthName}</td>
                                        <td className="p-3 text-center text-slate-600">{m.schoolDays} Hari</td>
                                        <td className="p-3 text-center font-semibold text-slate-800">{m.effectiveSchoolDays} Hari</td>
                                        <td className="p-3 text-center font-semibold text-slate-800">{m.effectiveWeeksCount} Pekan</td>
                                        <td className="p-3 text-center">
                                            <div className="font-extrabold text-slate-900">{m.subjectMeetingsCount} Pertemuan</div>
                                            {getSubjectMeetingsDetail(m) && (
                                                <div className="text-[10px] text-emerald-700 font-semibold mt-1 bg-emerald-50/50 rounded px-2 py-0.5 inline-block text-left max-w-xs leading-normal">
                                                    {getSubjectMeetingsDetail(m)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3 text-center font-extrabold text-emerald-700 bg-emerald-50/50">{m.subjectJpTotal} JP</td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-100 font-black text-slate-900">
                                    <td colSpan={2} className="p-3 text-right uppercase text-[10px] tracking-wider">Subtotal Semester Ganjil:</td>
                                    <td className="p-3 text-center">{analysisData.sem1Months.reduce((a, b) => a + b.schoolDays, 0)} Hari</td>
                                    <td className="p-3 text-center text-emerald-800">{analysisData.sem1.heb} Hari</td>
                                    <td className="p-3 text-center text-blue-800">{analysisData.sem1.peb} Pekan</td>
                                    <td className="p-3 text-center text-purple-800">{analysisData.sem1.meetings} Pertemuan</td>
                                    <td className="p-3 text-center text-emerald-800 bg-emerald-100">{analysisData.sem1.jp} JP</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Semester 2 Table */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                            <span>II. Semester Genap (Januari - Juni {academicYearStart + 1})</span>
                        </h3>
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-extrabold">
                            {analysisData.sem2.meetings} Pertemuan ({analysisData.sem2.jp} JP Efektif)
                        </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 text-slate-700 uppercase font-extrabold text-[10px]">
                                <tr>
                                    <th className="p-3 text-center border-b border-slate-200" width="4%">No</th>
                                    <th className="p-3 border-b border-slate-200">Bulan & Tahun</th>
                                    <th className="p-3 text-center border-b border-slate-200">Hari Kerja</th>
                                    <th className="p-3 text-center border-b border-slate-200">HEB Sekolah</th>
                                    <th className="p-3 text-center border-b border-slate-200">PEB Sekolah</th>
                                    <th className="p-3 text-center border-b border-slate-200">Pertemuan ({activeSubject})</th>
                                    <th className="p-3 text-center border-b border-slate-200">Total JP Efektif</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {analysisData.sem2Months.map((m, idx) => (
                                    <tr key={m.monthKey} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-3 text-center text-slate-500">{idx + 1}</td>
                                        <td className="p-3 font-bold text-slate-800">{m.monthName}</td>
                                        <td className="p-3 text-center text-slate-600">{m.schoolDays} Hari</td>
                                        <td className="p-3 text-center font-semibold text-slate-800">{m.effectiveSchoolDays} Hari</td>
                                        <td className="p-3 text-center font-semibold text-slate-800">{m.effectiveWeeksCount} Pekan</td>
                                        <td className="p-3 text-center">
                                            <div className="font-extrabold text-slate-900">{m.subjectMeetingsCount} Pertemuan</div>
                                            {getSubjectMeetingsDetail(m) && (
                                                <div className="text-[10px] text-blue-700 font-semibold mt-1 bg-blue-50/50 rounded px-2 py-0.5 inline-block text-left max-w-xs leading-normal">
                                                    {getSubjectMeetingsDetail(m)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3 text-center font-extrabold text-blue-700 bg-blue-50/50">{m.subjectJpTotal} JP</td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-100 font-black text-slate-900">
                                    <td colSpan={2} className="p-3 text-right uppercase text-[10px] tracking-wider">Subtotal Semester Genap:</td>
                                    <td className="p-3 text-center">{analysisData.sem2Months.reduce((a, b) => a + b.schoolDays, 0)} Hari</td>
                                    <td className="p-3 text-center text-emerald-800">{analysisData.sem2.heb} Hari</td>
                                    <td className="p-3 text-center text-blue-800">{analysisData.sem2.peb} Pekan</td>
                                    <td className="p-3 text-center text-purple-800">{analysisData.sem2.meetings} Pertemuan</td>
                                    <td className="p-3 text-center text-blue-800 bg-blue-100">{analysisData.sem2.jp} JP</td>
                                </tr>
                                <tr className="bg-emerald-600 text-white font-black text-xs">
                                    <td colSpan={2} className="p-3.5 text-right uppercase tracking-wider">GRAND TOTAL 1 TAHUN AJARAN:</td>
                                    <td className="p-3.5 text-center">{analysisData.sem1Months.reduce((a, b) => a + b.schoolDays, 0) + analysisData.sem2Months.reduce((a, b) => a + b.schoolDays, 0)} Hari</td>
                                    <td className="p-3.5 text-center">{analysisData.totalHeb} Hari</td>
                                    <td className="p-3.5 text-center">{analysisData.totalPeb} Pekan</td>
                                    <td className="p-3.5 text-center">{analysisData.totalMeetings} Pertemuan</td>
                                    <td className="p-3.5 text-center text-emerald-100 bg-emerald-700">{analysisData.totalJp} JP</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Evaluation & Holiday Impacts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                {/* Target Curriculum Comparison Card */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Ketercapaian Standar Kurikulum</span>
                    </h4>
                    <div className="space-y-2">
                        <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-600">Target Kurikulum Nasional:</span>
                            <span className="font-bold text-slate-900">{analysisData.annualTargetJp} JP / Tahun</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-200">
                            <span className="text-slate-600">Realisasi JP Efektif Mengajar:</span>
                            <span className="font-bold text-emerald-700">{analysisData.totalJp} JP ({analysisData.totalMeetings} Pertemuan)</span>
                        </div>
                        <div className="flex justify-between py-1.5 items-center">
                            <span className="text-slate-600">Persentase Ketercapaian:</span>
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-black text-xs">
                                {Math.round((analysisData.totalJp / analysisData.annualTargetJp) * 100)}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Holiday Conflicts Impact Card */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span>Daftar Hari Libur Memotong Jadwal ({analysisData.allConflicts.length} Hari)</span>
                    </h4>

                    {analysisData.allConflicts.length === 0 ? (
                        <p className="text-slate-500 italic text-[11px]">Tidak ada hari libur atau kegiatan sekolah yang terpotong pada jadwal mata pelajaran ini.</p>
                    ) : (
                        <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                            {analysisData.allConflicts.map((c, i) => (
                                <div key={i} className="p-2 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-[11px]">
                                    <div>
                                        <span className="font-bold text-slate-800">{c.day}, {c.date}</span>
                                        <span className="text-slate-500 block text-[10px]">{c.reason}</span>
                                    </div>
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-bold text-[10px]">
                                        -{c.lostJp} JP
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- KKTP View Component ---
const KKTPView: React.FC<{
    selectedSubject: string;
    selectedClass: string;
    identity: UserIdentity;
}> = ({ selectedSubject, selectedClass, identity }) => {
    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 md:p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Target className="w-5 h-5 text-emerald-600" />
                        <span>Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Rubrik interval ketuntasan belajar {selectedSubject} ({selectedClass}).</p>
                </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 text-xs">
                <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                        <tr>
                            <th className="p-3 w-1/3">Tujuan Pembelajaran (TP)</th>
                            <th className="p-3 text-center bg-red-50 text-red-700">0 - 60%<br/><span className="text-[9px]">Perlu Bimbingan</span></th>
                            <th className="p-3 text-center bg-amber-50 text-amber-700">61 - 70%<br/><span className="text-[9px]">Cukup</span></th>
                            <th className="p-3 text-center bg-blue-50 text-blue-700">71 - 85%<br/><span className="text-[9px]">Baik</span></th>
                            <th className="p-3 text-center bg-emerald-50 text-emerald-700">86 - 100%<br/><span className="text-[9px]">Sangat Baik</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                        <tr>
                            <td className="p-3 font-bold text-slate-800">Menjelaskan materi dasar dan menerapkan nilai karakter utama.</td>
                            <td className="p-3 text-center text-slate-500">Remedial seluruh bagian</td>
                            <td className="p-3 text-center text-slate-500">Remedial di bagian tertentu</td>
                            <td className="p-3 text-center text-slate-500">Sudah mencapai ketuntasan</td>
                            <td className="p-3 text-center text-slate-500">Perlu pengayaan / tantangan</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Jurnal View Component ---
const JurnalView: React.FC<{
    selectedSubject: string;
    selectedClass: string;
    identity: UserIdentity;
}> = ({ selectedSubject, selectedClass, identity }) => {
    const [journals, setJournals] = useState<JournalRecord[]>(() => [
        {
            id: '1',
            date: new Date().toISOString().split('T')[0],
            timeSlot: '07:30 - 09:00',
            subject: selectedSubject,
            topic: 'Mengenal Lingkungan Belajar dan Karakter Utama',
            activity: 'Diskusi kelompok dan pemutaran video edukatif',
            notes: 'Siswa antusias dan aktif berdiskusi'
        }
    ]);

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [topic, setTopic] = useState('');
    const [activity, setActivity] = useState('');
    const [notes, setNotes] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic) return;
        const newJ: JournalRecord = {
            id: Date.now().toString(),
            date,
            timeSlot: '07:30 - 09:00',
            subject: selectedSubject,
            topic,
            activity,
            notes
        };
        setJournals([newJ, ...journals]);
        setTopic('');
        setActivity('');
        setNotes('');
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 md:p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <BookMarked className="w-5 h-5 text-emerald-600" />
                        <span>Jurnal Pembelajaran Harian ({selectedClass})</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Catatan pelaksanaan KBM harian dan refleksi pembelajaran.</p>
                </div>
            </div>

            <form onSubmit={handleAdd} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="block font-bold text-slate-700 mb-1">Tanggal</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">Materi Pokok / TP</label>
                        <input type="text" placeholder="Topik pembelajaran hari ini" value={topic} onChange={e => setTopic(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block font-bold text-slate-700 mb-1">Uraian Kegiatan</label>
                        <input type="text" placeholder="Ringkasan kegiatan KBM" value={activity} onChange={e => setActivity(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none" />
                    </div>
                    <div>
                        <label className="block font-bold text-slate-700 mb-1">Catatan / Refleksi</label>
                        <input type="text" placeholder="Refleksi ketercapaian siswa" value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none" />
                    </div>
                </div>
                <div className="flex justify-end">
                    <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer">
                        <Plus className="w-4 h-4" /> Simpan Jurnal
                    </button>
                </div>
            </form>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 text-xs">
                <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                        <tr>
                            <th className="p-3">Tanggal</th>
                            <th className="p-3">Materi / TP</th>
                            <th className="p-3">Uraian Kegiatan</th>
                            <th className="p-3">Catatan / Refleksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                        {journals.map(j => (
                            <tr key={j.id} className="hover:bg-slate-50">
                                <td className="p-3 font-bold text-slate-600">{j.date}</td>
                                <td className="p-3 font-bold text-slate-900">{j.topic}</td>
                                <td className="p-3 text-slate-700">{j.activity}</td>
                                <td className="p-3 text-emerald-700">{j.notes}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const App = () => {
  
  useEffect(() => {
    const savedUser = localStorage.getItem('prota_user');
    if (savedUser) {
        try {
            const parsed = JSON.parse(savedUser);
            if (parsed && !parsed.email) {
                parsed.email = 'guru@example.com';
            }
            setUser(parsed);
            if (parsed.assignedClass) {
                setSelectedClass(parsed.assignedClass);
                setSelectedFase(getFaseForClass(parsed.assignedClass));
                setUserIdentity(prev => ({
                    ...prev,
                    assignedClass: parsed.assignedClass,
                    authorName: parsed.name || prev.authorName,
                    institutionName: parsed.institutionName || prev.institutionName
                }));
            }
        } catch (e) {
            console.error('Failed to parse saved user', e);
        }
    }
  }, []);

  const [appStage, setAppStage] = useState<'login' | 'register' | 'tutorial' | 'identity' | 'generator' | 'admin'>(() => {
    return localStorage.getItem('prota_user') ? 'generator' : 'login';
  });
  const [user, setUser] = useState<{ name: string, email: string, assignedClass?: string, institutionName?: string } | null>(null);

  // --- Admin Bypass (Shortcut & Taps) ---
  const [loginTaps, setLoginTaps] = useState(0);
  const tapTimeoutRef = useRef<any>(null);
  const handleLoginTap = () => {
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = setTimeout(() => {
      setLoginTaps(0);
    }, 3000);

    setLoginTaps(prev => {
      const next = prev + 1;
      if (next >= 7) {
        setAppStage('admin');
        return 0;
      }
      return next;
    });
  };

  const keySequence = useRef<string[]>([]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (appStage !== 'login' && appStage !== 'register') return;
      if (!e || !e.key) return;
      const key = String(e.key || '').toLowerCase();
      if (e.ctrlKey && e.altKey) {
        if (key === 'i' || key === 'p') {
          keySequence.current.push(key);
          if (keySequence.current.length > 2) {
            keySequence.current.shift();
          }
          if (keySequence.current.join('') === 'ip') {
            setAppStage('admin');
          }
        }
      } else {
        keySequence.current = [];
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appStage]);

  // --- Single Active Session Checker ---
  useEffect(() => {
    if (!user || !user.email || appStage === 'login' || appStage === 'register' || appStage === 'admin') return;

    const checkSession = async () => {
      try {
        const emailNormalized = String(user?.email || '').toLowerCase().trim();
        if (!emailNormalized) return;
        const userDocRef = doc(db, 'users', emailNormalized);
        const userSnap = await getDoc(userDocRef);
        
        if (userSnap.exists()) {
          const dbSessionId = userSnap.data()?.activeSessionId;
          const localSessionId = localStorage.getItem('prota_session_id');
          if (dbSessionId && localSessionId && dbSessionId !== localSessionId) {
            alert('Akun Anda telah masuk di perangkat atau sesi aktif lain. Sesi saat ini akan ditutup secara otomatis.');
            handleLogout();
          }
        } else {
          // If deleted by admin
          alert('Akun Anda telah dihapus oleh Administrator.');
          handleLogout();
        }
      } catch (e) {
        console.error('Failed to verify active session', e);
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 10000);
    return () => clearInterval(interval);
  }, [user, appStage]);

  const handleBackup = async () => {
    try {
      if (!user) return;
      const data = await activitiesDB.getItem(user.email) || [];
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_prota_${user.email}_${formatDateLocal(new Date())}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch(e) {
      alert('Gagal melakukan backup');
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!user || !e.target.files?.[0]) return;
      const file = e.target.files[0];
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
          await activitiesDB.setItem(user.email, parsed);
          setActivities(parsed);
          alert('Berhasil merestore data!');
      } else {
          alert('Format file tidak valid.');
      }
    } catch(err) {
      alert('Gagal merestore data');
    }
    if (e.target) e.target.value = '';
  };

const [apiKeyInput, setApiKeyInput] = useState(localStorage.getItem('prota_custom_api_key') || '');
const [showApiKeyModal, setShowApiKeyModal] = useState(false);
const [showApiKeyText, setShowApiKeyText] = useState(false);
const [apiKeyMessage, setApiKeyMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
const [selectedAtps, setSelectedAtps] = useState<Record<string, Record<string, boolean>>>({});
const [registerClass, setRegisterClass] = useState<string>('Kelas 1');

  const [currentView, setCurrentView] = useState<'dashboard' | 'generator' | 'history' | 'modul_ajar' | 'calendar' | 'daftar_siswa' | 'jadwal_mengajar' | 'hari_efektif' | 'presensi' | 'kktp' | 'jurnal'>('dashboard');
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [calendarPageTab, setCalendarPageTab] = useState<'all' | 'master' | 'analysis'>('all');
  const [selectedClass, setSelectedClass] = useState<string>(() => localStorage.getItem('prota_assigned_class') || FASES[0].classes[0]);
  const [selectedFase, setSelectedFase] = useState(() => getFaseForClass(localStorage.getItem('prota_assigned_class') || FASES[0].classes[0]));
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'config' | 'analysis' | 'calendar'>('config');

  useEffect(() => {
    if (selectedFase && selectedFase.classes && selectedFase.classes.length > 0) {
      if (!selectedFase.classes.includes(selectedClass)) {
        setSelectedClass(selectedFase.classes[0]);
      }
    }
  }, [selectedFase]);
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
  const [showSaveToast, setShowSaveToast] = useState(false);

  useEffect(() => {
      if (showSaveToast) {
          const t = setTimeout(() => setShowSaveToast(false), 3000);
          return () => clearTimeout(t);
      }
  }, [showSaveToast]);
  const [pendingSemesterSelection, setPendingSemesterSelection] = useState<string | null>(null);
  const [selectedCharacteristic, setSelectedCharacteristic] = useState("Beragam (Visual, Auditori, Kinestetik)");
  
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  useEffect(() => {
    // Maintenance mode bypass removed
  }, []);


  const [userIdentity, setUserIdentity] = useState<UserIdentity>(() => ({
      authorName: localStorage.getItem('prota_author_name') || 'Acep Miftah Hilah Ash-shidiq, S.Pd.',
      nip: localStorage.getItem('prota_nip') || '199602152025211094',
      institutionName: localStorage.getItem('prota_institution_name') || 'SDN SUKATINGGAL',
      npsn: localStorage.getItem('prota_npsn') || '20206022',
      kepalaSekolah: localStorage.getItem('prota_kepala_sekolah') || 'Yuni Sri Rahayu, S.Pd.',
      nipKepalaSekolah: localStorage.getItem('prota_nip_kepala_sekolah') || '198706162019032007',
      academicYear: localStorage.getItem('prota_academic_year') || '2026-2027',
      semester: localStorage.getItem('prota_semester') || 'Ganjil (Semester 1)',
      assignedClass: localStorage.getItem('prota_assigned_class') || 'Kelas 1',
      employmentStatus: localStorage.getItem('prota_employment_status') || 'Full Time',
      customApiKey: localStorage.getItem('prota_custom_api_key') || ''
  }));

  const handleSaveIdentity = (updated: UserIdentity) => {
      setUserIdentity(updated);
      localStorage.setItem('prota_author_name', updated.authorName);
      if (updated.nip) localStorage.setItem('prota_nip', updated.nip);
      localStorage.setItem('prota_institution_name', updated.institutionName);
      if (updated.npsn) localStorage.setItem('prota_npsn', updated.npsn);
      if (updated.kepalaSekolah) localStorage.setItem('prota_kepala_sekolah', updated.kepalaSekolah);
      if (updated.nipKepalaSekolah) localStorage.setItem('prota_nip_kepala_sekolah', updated.nipKepalaSekolah);
      localStorage.setItem('prota_academic_year', updated.academicYear);
      localStorage.setItem('prota_semester', updated.semester);
      localStorage.setItem('prota_assigned_class', updated.assignedClass);
      if (updated.employmentStatus) localStorage.setItem('prota_employment_status', updated.employmentStatus);
      setShowEditProfileModal(false);
  };

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
  const [editingCalendarEvent, setEditingCalendarEvent] = useState<{dateStr: string, endDateStr?: string, ev?: CalendarEvent} | null>(null);
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

  useEffect(() => {
    if (!activities || activities.length === 0) {
        if (data) setData(null);
        return;
    }
    const match = activities.find(act => 
        (act.type === 'ATP_JP' || act.type === 'CP_TP') && 
        act.subject.toLowerCase().trim() === selectedSubject.toLowerCase().trim()
    );
    if (match && match.dataSnapshot) {
        if (JSON.stringify(data) !== JSON.stringify(match.dataSnapshot)) {
            setData(match.dataSnapshot);
        }
    } else {
        if (data !== null) setData(null);
    }
  }, [selectedSubject, activities]);

  const getScheduledSubjects = (): string[] => {
      let subjectsFromRoster: string[] = [];
      try {
          const saved = localStorage.getItem(`prota_weekly_roster_${selectedClass}`);
          if (saved) {
              const roster = JSON.parse(saved);
              Object.values(roster).forEach((slots: any) => {
                  if (Array.isArray(slots)) {
                      slots.forEach(slot => {
                          if (slot && slot.subject) {
                              const trimmed = slot.subject.trim();
                              if (trimmed && !isExcludedSubject(trimmed) && !subjectsFromRoster.includes(trimmed)) {
                                  subjectsFromRoster.push(trimmed);
                              }
                          }
                      });
                  }
              });
          }
      } catch (e) {}

      if (subjectsFromRoster.length === 0) {
          subjectsFromRoster = SUBJECTS.filter(s => !isExcludedSubject(s));
      }
      return subjectsFromRoster;
  };

  const handleLogout = () => {
    localStorage.removeItem('prota_user');
    localStorage.removeItem('prota_session_id');
    setUser(null);
    setAppStage('login');
  };

  const getSubjectKey = (subjectName: string): string | null => {
      if (!subjectName) return null;
      if (JP_STANDARDS[subjectName]) return subjectName;
      const keys = Object.keys(JP_STANDARDS);
      const lower = String(subjectName).toLowerCase().trim();
      const directKey = keys.find(k => String(k).toLowerCase() === lower);
      if (directKey) return directKey;
      const fuzzyKey = keys.find(k => lower.includes(String(k).toLowerCase()) || String(k).toLowerCase().includes(lower));
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
      if (!user) return;
      try {
        const data = await activitiesDB.getItem(user.email);
        if (data && Array.isArray(data)) {
            setActivities(data);
        } else {
            setActivities([]);
        }
      } catch (e) {
        console.error("Failed to fetch activities", e);
      }
    };
    fetchActivities();
  }, [user]);


  
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
        const prev = (await activitiesDB.getItem<ActivityLog[]>(user.email)) || [];
        const updated = [newActivity, ...prev];
        await activitiesDB.setItem(user.email, updated);
        setActivities(updated);
    } catch (e) {
        console.error("Failed to add activity", e);
    }
  };

  
  
  const saveActivityLog = async (log: ActivityLog) => {
    if (!user) return;
    try {
        const prev = (await activitiesDB.getItem<ActivityLog[]>(user.email)) || [];
        const updated = [log, ...prev];
        await activitiesDB.setItem(user.email, updated);
        setActivities(updated);
    } catch (e) {
        console.error("Failed to save activity log", e);
    }
  };


  
  const deleteActivity = async (id: string) => {
    if (!user) return;
    try {
        const prev = (await activitiesDB.getItem<ActivityLog[]>(user.email)) || [];
        const updated = prev.filter(act => act.id !== id);
        await activitiesDB.setItem(user.email, updated);
        setActivities(updated);
    } catch (e) {
        console.error("Failed to delete activity", e);
    }
  };


  
  const clearAllActivities = async () => {
    if (!user) return;
    try {
        await activitiesDB.setItem(user.email, []);
        setActivities([]);
    } catch (e) {
        console.error("Failed to clear activities", e);
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

  const getEffectiveDates = (className: string, subjectName: string = selectedSubject): { date: Date, jp: number }[] => {
      let weeklyRoster: Record<string, any[]> = {};
      try {
          const saved = localStorage.getItem(`prota_weekly_roster_${className}`);
          if (saved) weeklyRoster = JSON.parse(saved);
      } catch (e) {}

      const daysList = schoolDaysCount === 5 
          ? ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] 
          : ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

      const subjectScheduledDays: string[] = [];
      const subjectDailyJpMap: Record<string, number> = {};

      daysList.forEach(day => {
          const slots = weeklyRoster[day] || [];
          let dayJp = 0;
          slots.forEach(slot => {
              if (!slot || !slot.subject) return;
              const slotSubjLower = slot.subject.toLowerCase().trim();
              const targetSubjLower = subjectName.toLowerCase().trim();
              if (slotSubjLower === targetSubjLower ||
                  slotSubjLower.includes(targetSubjLower) ||
                  targetSubjLower.includes(slotSubjLower)) {
                  dayJp += Number(slot.jp) || 1;
              }
          });
          if (dayJp > 0) {
              subjectScheduledDays.push(day);
              subjectDailyJpMap[day] = dayJp;
          }
      });

      const selectedDays = subjectScheduledDays.length > 0 
          ? subjectScheduledDays 
          : (classSchedules[className] || []);

      const dailyJP = subjectScheduledDays.length > 0 
          ? subjectDailyJpMap 
          : (classDailyJP[className] || {});

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

      if (dates.length === 0) {
          console.warn("No effective dates found for", className, subjectName, "using default fallback");
          const fallbackDays = ["Senin"];
          const fallbackDailyJP: Record<string, number> = { "Senin": 3 };
          let currentFallback = new Date(startDate);
          while (currentFallback <= endDate) {
              const dayName = getDayName(currentFallback);
              const dateStr = formatDateLocal(currentFallback);
              const conflict = checkNonEffectiveDate(dateStr);
              if (fallbackDays.includes(dayName) && (!conflict)) {
                  const jp = fallbackDailyJP[dayName] || 3;
                  if (jp > 0) {
                    dates.push({ date: new Date(currentFallback), jp });
                  }
              }
              currentFallback.setDate(currentFallback.getDate() + 1);
          }
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
        let weeklyRoster: Record<string, any[]> = {};
        try {
            const saved = localStorage.getItem(`prota_weekly_roster_${className}`);
            if (saved) weeklyRoster = JSON.parse(saved);
        } catch (e) {}

        const daysList = schoolDaysCount === 5 
            ? ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] 
            : ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

        const subjectScheduledDays: string[] = [];
        const subjectDailyJpMap: Record<string, number> = {};

        daysList.forEach(day => {
            const slots = weeklyRoster[day] || [];
            let dayJp = 0;
            slots.forEach(slot => {
                if (!slot || !slot.subject) return;
                const slotSubjLower = slot.subject.toLowerCase().trim();
                const targetSubjLower = subject.toLowerCase().trim();
                if (slotSubjLower === targetSubjLower ||
                    slotSubjLower.includes(targetSubjLower) ||
                    targetSubjLower.includes(slotSubjLower)) {
                    dayJp += Number(slot.jp) || 1;
                }
            });
            if (dayJp > 0) {
                subjectScheduledDays.push(day);
                subjectDailyJpMap[day] = dayJp;
            }
        });

        const rawSelectedDays = subjectScheduledDays.length > 0 
            ? subjectScheduledDays 
            : (classSchedules[className] || []);

        const selectedDays = schoolDaysCount === 5 ? rawSelectedDays.filter(d => d !== 'Sabtu') : rawSelectedDays;
        
        const finalDays = selectedDays.length > 0 ? selectedDays : ["Senin"];
        const dailyJpSource = subjectScheduledDays.length > 0 
            ? subjectDailyJpMap 
            : (classDailyJP[className] || {});

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

            if (finalDays.includes(dayName)) {
                 const conflict = checkNonEffectiveDate(dateStr) || (isSabtuNonEffective ? { description: 'Libur Sabtu', type: 'holiday' } : null);
                 if (!conflict) {
                     const dailyJPVal = dailyJpSource[dayName] || 3;
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

const extractFlatTPs = (currData: CurriculumData | null, targetClassName: string) => {
    if (!currData || !currData.elements) return [];
    
    interface FlatTP {
        id: number;
        tp: string;
        elementIndex: number;
        allocIndex: number;
        tpIndex: number;
    }

    const flatTPs: FlatTP[] = [];
    let tpCounter = 1;

    currData.elements.forEach((el, elIdx) => {
        (el.allocations || []).forEach((alloc, allocIdx) => {
            const matchesClass = isSameClass(alloc.className, targetClassName) ||
                                (el.allocations.length === 1 && !alloc.className);
            if (matchesClass) {
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

    if (flatTPs.length === 0) {
        const targetDigit = normalizeClassStr(targetClassName);
        currData.elements.forEach((el, elIdx) => {
            (el.allocations || []).forEach((alloc, allocIdx) => {
                if (alloc.className && alloc.className.includes(targetDigit)) {
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
    }

    return flatTPs;
};

  const generateContent = async (overrideFase?: typeof FASES[0], overrideSubject?: string): Promise<CurriculumData | null> => {
    setLoading(true);
    setError(null);
    const faseToUse = overrideFase || selectedFase;
    const subjectToUse = overrideSubject || selectedSubject;

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
                        description: `Nama kelas, HARUS persis salah satu dari: ${(faseToUse?.classes || []).join(" atau ")}`
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
        Parameter: Jenjang SD, Fase ${faseToUse?.name || ''}, Mapel ${subjectToUse}, Kelas ${(faseToUse?.classes || []).join(" dan ")}.
        Instruksi: 
        1. Tuliskan deskripsi singkat mata pelajaran.
        2. Tuliskan Elemen dan CP terbaru. 
        3. Pecah CP menjadi Tujuan Pembelajaran (TP) pembelajaran yang spesifik, aplikatif, dan terukur untuk setiap kelas yang diminta (${(faseToUse?.classes || []).join(" dan ")}). Anda WAJIB memberikan minimal 2 Tujuan Pembelajaran (TP) untuk setiap kelas dalam array 'tujuanPembelajaran'. JANGAN PERNAH mengosongkan array 'tujuanPembelajaran'.
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
      addActivity('CP_TP', subjectToUse, `Analisis CP & TP untuk ${faseToUse.name}`, resultData);
      
      try {
          await generateATP(selectedClass, resultData);
      } catch (atpErr) {
          console.error("Gagal membuat ATP otomatis:", atpErr);
      }

      return resultData;

    } catch (err: any) {
      console.error(err);
      setError(formatAIError(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateATP = async (className: string, overrideData?: CurriculumData) => {
    console.log(`Memulai generateATP untuk ${className}...`);
    setAtpLoading(className);
    setError(null);

    let activeData = overrideData || data;
    let flatTPs = extractFlatTPs(activeData, className);

    if (!activeData || flatTPs.length === 0) {
        if (overrideData) {
            setAtpLoading(null);
            setError(`Data TP kosong.`);
            return;
        }
        console.log(`TP untuk ${className} tidak ditemukan dalam data saat ini. Otomatis membuat CP & TP...`);
        const targetFase = FASES.find(f => f.classes.some(c => isSameClass(c, className))) || selectedFase;
        const newData = await generateContent(targetFase, selectedSubject);
        if (newData) {
            activeData = newData;
            flatTPs = extractFlatTPs(activeData, className);
        }
    }

    if (!activeData || flatTPs.length === 0) {
        setAtpLoading(null);
        setError(`Data Tujuan Pembelajaran (TP) untuk ${className} tidak dapat ditemukan atau dihasilkan. Silakan klik tombol 'Generate CP & TP' di menu samping.`);
        return;
    }

    // 1. SMART JP CALCULATION
    let targetJP = 216; 
    const subjectKey = getSubjectKey(selectedSubject) || getSubjectKey(activeData.subject);
    if (subjectKey) {
        targetJP = JP_STANDARDS[subjectKey]?.[className] || 216;
    }
    console.log(`Target JP untuk ${className}: ${targetJP}`);

    let selectedDays = classSchedules[className] || [];
    if (selectedDays.length === 0) {
        selectedDays = ["Senin"];
        setClassSchedules(prev => ({ ...prev, [className]: selectedDays }));
        if (!(classDailyJP[className]?.["Senin"])) {
            setClassDailyJP(prev => ({
                ...prev,
                [className]: {
                    ...(prev[className] || {}),
                    "Senin": 3
                }
            }));
        }
    }

    try {
        const apiKey = getApiKey();
        if (!apiKey) throw new Error("API Key Gemini tidak ditemukan. Pastikan Anda telah mengatur VITE_GEMINI_API_KEY di environment variables.");
        const ai = new GoogleGenAI({ apiKey });

        // 2. TIMELINE GENERATION based on Calendar (using subject from activeData)
        const allEffectiveDates = getEffectiveDates(className, activeData.subject);
        if (allEffectiveDates.length === 0) {
            throw new Error("Tidak ada hari efektif yang tersedia untuk jadwal yang dipilih. Silakan periksa kalender akademik atau pilih hari lain.");
        }
        
        const timelineSlots: { date: string, allocatedJP: number }[] = allEffectiveDates.map(slot => ({
            date: formatDateLocal(slot.date),
            allocatedJP: slot.jp
        }));
        
        const accumulatedJP = timelineSlots.reduce((sum, s) => sum + s.allocatedJP, 0);
        console.log(`Total JP tersedia pada timeline: ${accumulatedJP} JP`);

        console.log(`Flat TPs found: ${flatTPs.length}`);

        const prompt = `
            PERAN: Ahli Kurikulum & Penjadwalan Sekolah Dasar (Kurikulum Merdeka 2025).
            TUGAS: Pecah Tujuan Pembelajaran (TP) menjadi aktivitas-aktivitas kecil (Alur Tujuan Pembelajaran/ATP).
            
            KONTEKS:
            - Mapel: ${activeData.subject} (${className})
            - Total Target JP: ${accumulatedJP} JP
            - Jumlah Slot Pertemuan: ${timelineSlots.length} (dengan variasi JP per pertemuan sesuai jadwal pengguna)
            
            DAFTAR TP (ID: TP):
            ${flatTPs.map(f => `${f.id}: ${f.tp}`).join('\n')}
            
            INSTRUKSI:
            1. Buat rangkaian aktivitas untuk SETIAP TP di atas.
            2. Satu TP bisa dipecah menjadi beberapa aktivitas (beberapa pertemuan) jika kompleks.
            3. Distribusikan TP ini ke dalam total ${accumulatedJP} JP yang tersedia. Pastikan total JP dari semua aktivitas diakumulasikan tepat ${accumulatedJP} JP.
               PENTING: Gunakan alokasi JP per-aktivitas yang wajar (misal: 1, 2, atau 3 JP). Hindari membuat satu aktivitas dengan JP yang sangat besar yang tidak mungkin selesai dalam satu hari (kapasitas harian ${(selectedDays || []).map(d => `${d}: ${(classDailyJP[className] || {})[d] || 3} JP`).join(', ')}).
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
        const newData = JSON.parse(JSON.stringify(activeData));
        
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

        const N = timelineSlots.length;
        const M = flatTPs.length;
        const slotsPerTP = new Array(M).fill(0);

        if (M <= N) {
            const base = Math.floor(N / M);
            const rem = N % M;
            for (let i = 0; i < M; i++) {
                slotsPerTP[i] = base + (i < rem ? 1 : 0);
            }
        } else {
            // M > N: Give 1 slot to every TP
            for (let i = 0; i < M; i++) {
                slotsPerTP[i] = 1;
            }
        }

        const paddedSlots = [...timelineSlots];
        while (paddedSlots.length < M) {
            paddedSlots.push(timelineSlots[timelineSlots.length - 1]);
        }

        let slotCursor = 0;
        flatTPs.forEach((f, idx) => {
            const numSlots = slotsPerTP[idx];
            const processedItems: AtpItem[] = [];

            if (numSlots > 0) {
                const slots = paddedSlots.slice(slotCursor, slotCursor + numSlots);
                slotCursor += numSlots;

                const aiAllocation = result.allocations?.find(a => a.tpId === f.id);
                const activities = aiAllocation?.activities || [];

                if (activities.length > 0) {
                    slots.forEach((slot, slotIdx) => {
                         const startActIdx = Math.floor((slotIdx / slots.length) * activities.length);
                         let endActIdx = Math.floor(((slotIdx + 1) / slots.length) * activities.length);
                         if (endActIdx === startActIdx) endActIdx = startActIdx + 1;
                         
                         const assignedActivities = activities.slice(startActIdx, endActIdx);
                         
                         processedItems.push({
                                alur: assignedActivities.map(a => "- " + a.alur).join('\n'),
                                alokasiWaktu: `${slot.allocatedJP} JP`,
                                planDate: slot.date
                         });
                    });
                } else {
                    slots.forEach(slot => {
                        processedItems.push({
                             alur: `Pembelajaran: ${f.tp}`,
                             alokasiWaktu: `${slot.allocatedJP} JP`,
                             planDate: slot.date
                        });
                    });
                }
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

  const openModulGeneratorForSelected = (className: string) => {
      const rawItems: { el: any, tp: any, atpItem: any }[] = [];
      const currentSelected = selectedAtps[className] || {};

      (data?.elements || []).forEach((el, elIdx) => {
          (el.allocations || []).forEach((alloc) => {
              if (alloc.structuredAtp) {
                  alloc.structuredAtp.forEach((grp: any, grpIdx) => {
                       grp.atpItems.forEach((atpItem: any, itemIdx) => {
                           const key = `${elIdx}-${grpIdx}-${itemIdx}`;
                           if (currentSelected[key]) {
                               rawItems.push({ el, tp: grp.tp, atpItem });
                           }
                       });
                  });
              }
          });
      });

      if (rawItems.length === 0) {
          alert("Silakan pilih minimal satu ATP (centang pada kolom Alur Tujuan Pembelajaran) untuk dibuatkan Modul Ajar.");
          return;
      }

      const combinedTopics = rawItems.map((item, idx) => `${idx + 1}. ${item.atpItem.alur}`).join('\n');
      const combinedTPs = Array.from(new Set(rawItems.map(item => item.tp))).join('\n');
      const combinedCPs = Array.from(new Set(rawItems.map(item => item.el.capaianPembelajaran))).join('\n');
      const combinedElements = Array.from(new Set(rawItems.map(item => item.el.elementName))).join(', ');
      
      let totalJP = 0;
      rawItems.forEach(item => {
          const match = String(item.atpItem.alokasiWaktu).match(/\d+/);
          totalJP += match ? parseInt(match[0]) : 2;
      });

      const dates = rawItems.map(item => item.atpItem.planDate).filter(Boolean);
      const dateString = dates.length > 0 ? Array.from(new Set(dates)).join(', ') : formatDateLocal(new Date());

      setModulContext({
          subject: data?.subject || '',
          className,
          fase: data?.fase || '',
          elementName: combinedElements,
          cp: combinedCPs,
          tp: combinedTPs,
          atpItem: {
              alur: combinedTopics,
              alokasiWaktu: `${totalJP} JP (${rawItems.length} Pertemuan)`,
              planDate: dateString
          },
          selectedAtpItems: rawItems
      });
      setCurrentView('modul_ajar');
  };

  const handleBulkGenerateModulForClass = (className: string) => {
      const currentSelected = selectedAtps[className] || {};
      const hasSelection = Object.keys(currentSelected).length > 0 && Object.values(currentSelected).some(v => v);
      
      if (!hasSelection) {
          alert("Silakan pilih minimal satu ATP (centang pada kolom Alur Tujuan Pembelajaran) untuk dibuatkan Modul Ajar.");
          return;
      }
      
      openModulGeneratorForSelected(className);
  };

  const runBulkGeneration = async (className: string, semChoice: '1' | '2') => {
      
      const rawItems: { el: any, tp: any, atpItem: any }[] = [];
      const currentSelected = selectedAtps[className] || {};
      const hasSelection = Object.keys(currentSelected).length > 0 && Object.values(currentSelected).some(v => v);

      (data?.elements || []).forEach((el, elIdx) => {
          (el.allocations || []).forEach((alloc) => {
              if (alloc.structuredAtp) {
                  alloc.structuredAtp.forEach((grp: any, grpIdx) => {
                       grp.atpItems.forEach((atpItem: any, itemIdx) => {
                           const key = `${elIdx}-${grpIdx}-${itemIdx}`;
                           if (currentSelected[key]) {
                               rawItems.push({ el, tp: grp.tp, atpItem });
                           }
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

      const maxModules = Math.min(itemsToGenerateFinal.length, semDates.length);
      
      if (maxModules === 0) {
          alert(`Tidak ada ATP yang terpilih untuk Semester ${semChoice} yang memiliki tanggal rencana.`);
          return;
      }

      setBulkGenerationStatus(prev => ({
          ...prev,
          [className]: { current: 0, total: maxModules, percent: 0, active: true, statusText: "Memulai proses..." }
      }));

      // Ensure that cancellation flag is reset for this class
      (window as any).bulkAbortedMap = { ...((window as any).bulkAbortedMap || {}), [className]: false };
      const collectedModulesData: any[] = [];
      let collectedHtml = '';

      try {
          const apiKey = getApiKey();
          if (!apiKey) throw new Error("API Key Gemini tidak ditemukan. Pastikan Anda telah mengatur VITE_GEMINI_API_KEY di environment variables.");
          const ai = new GoogleGenAI({ apiKey });
          
          let combinedTopics = '';
          let combinedTPs = '';
          let totalJP = 0;
          let combinedDates = [];
          let combinedCPs = new Set<string>();

          for (let i = 0; i < maxModules; i++) {
              const { el, tp, atpItem } = itemsToGenerateFinal[i];
              combinedTopics += `- ${atpItem.alur}\n`;
              combinedTPs += `- ${tp}\n`;
              const jpMatch = String(atpItem.alokasiWaktu).match(/(\d+)/);
              if (jpMatch) totalJP += parseInt(jpMatch[1]);
              if (atpItem.planDate) combinedDates.push(formatDateLocal(new Date(atpItem.planDate)));
              combinedCPs.add(el.capaianPembelajaran);
          }

          const dateString = combinedDates.length > 0 ? Array.from(new Set(combinedDates)).join(', ') : formatDateLocal(new Date());
          const combinedCPString = Array.from(combinedCPs).join('\n');

          if ((window as any).bulkAbortedMap?.[className]) {
              setBulkGenerationStatus(prev => ({...prev, [className]: {...prev[className], active: false, statusText: "Proses dibatalkan."}}));
              return;
          }

          setBulkGenerationStatus(prev => ({
              ...prev,
              [className]: { ...prev[className], statusText: `Memilih model pembelajaran AI terbaik untuk topik gabungan...` }
          }));

          const modelPrompt = `Pilih 1 model pembelajaran yang paling efektif (misalnya: PjBL, PBL, Inkuiri, Discovery, TaRL, dll) untuk Kelas ${className}, Fase ${data?.fase}, Topik gabungan: \n${combinedTopics}. Karakteristik Peserta Didik: ${selectedCharacteristic}. Jawablah hanya dengan format: "Nama Model: [Nama Model]"`;
          
          let modelResponseText = "Tidak ditentukan";
          try {
            const modelRec = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: modelPrompt,
            });
             modelResponseText = modelRec.text || "Tidak ditentukan";
          } catch (e) {
            console.error("Model rec failed, fallback:", e);
          }

          setBulkGenerationStatus(prev => ({
              ...prev,
              [className]: { ...prev[className], statusText: `Model dipilih: ${modelResponseText}. Membuat konten modul gabungan...` }
          }));

          const prompt = `
# MASTER PROMPT — GENERATOR RENCANA PEMBELAJARAN MENDALAM (RPM) GABUNGAN BERBASIS ATP

## PERAN ANDA
Anda adalah **AI Generator Rencana Pembelajaran Mendalam (RPM)** untuk guru SD/MI profesional. Anda menyusun dokumen perangkat ajar resmi yang utuh, konkret, aplikatif, dan menyeluruh, siap pakai dan siap dicetak ke Microsoft Word tanpa teks placeholder atau kerangka kosong.

## LANDASAN PENYUSUNAN & REGULASI
- **Permendikdasmen Nomor 13 Tahun 2025**
- Pendekatan: **PEMBELAJARAN MENDALAM (DEEP LEARNING)**
- **8 Dimensi Profil Lulusan**:
  1. Keimanan dan Ketakwaan terhadap Tuhan Yang Maha Esa
  2. Kewargaan
  3. Penalaran Kritis
  4. Kreativitas
  5. Kolaborasi
  6. Kemandirian
  7. Kesehatan
  8. Komunikasi
- **3 Prinsip Pembelajaran Mendalam**:
  1. Berkesadaran (Mindful)
  2. Bermakna (Meaningful)
  3. Menggembirakan (Joyful)
- **3 Pengalaman Belajar (Wajib di Setiap Pertemuan)**:
  1. Memahami (Acquiring & constructing understanding)
  2. Mengaplikasi (Applying knowledge in real contexts)
  3. Merefleksi (Evaluating process, difficulties, and self-growth)
- **4 Kerangka Pembelajaran**:
  1. Praktik Pedagogis (Model terpilih, sintaks lengkap, metode, alasan)
  2. Kemitraan Pembelajaran (Guru-murid, antar-murid, orang tua, komunitas)
  3. Lingkungan Pembelajaran (Fisik, sosial, psikologis/emosional)
  4. Pemanfaatan Digital (Media & teknologi fungsional)

## INFORMASI SUMBER DARI PENGGUNA & ATP:
- Nama Guru / Penyusun: ${userIdentity.authorName}
- NIP: [DIISI OLEH GURU]
- Sekolah / Instansi: ${userIdentity.institutionName}
- Tahun Pelajaran: ${userIdentity.academicYear || '2025/2026'}
- Jenjang / Kelas: SD / ${className} (${data?.fase})
- Semester: ${semChoice}
- Mata Pelajaran: ${data?.subject}
- Materi / Topik Gabungan (ATP): 
${combinedTopics}
- Capaian Pembelajaran (CP) Gabungan: 
${combinedCPString}
- Tujuan Pembelajaran (TP) Gabungan: 
${combinedTPs}
- Total Alokasi Waktu & Beban JP: ${totalJP} JP
- Tanggal Pelaksanaan: ${dateString}
- Model Pembelajaran: ${modelResponseText}
- Karakteristik Peserta Didik: ${selectedCharacteristic || 'Beragam (Visual, Auditori, Kinestetik)'}

## ATURAN WAJIB GENERASI KONTEN:
1. **JANGAN MEMBUAT PLACEHOLDER / KERANGKA KOSONG**: Dilarang menggunakan "[isi materi]", "[masukkan soal]", "...", "dan lain-lain", teks dummy. Seluruh materi, soal, kunci jawaban, rubrik, dan LKPD wajib ditulis lengkap dan siap digunakan mengajar.
2. **ATURAN TANGGAL & JP**: Gunakan tanggal dan total alokasi JP (${totalJP} JP, ${dateString}). 1 JP = 35 menit SD.
3. **BREAKDOWN TUJUAN PEMBELAJARAN**: Analisis TP utama dari ATP dan pecah menjadi TP Turunan operasional terukur dengan pola: *Peserta didik + kata kerja operasional + kompetensi + kondisi/konteks + kriteria keberhasilan*.

## STRUKTUR LENGKAP DOKUMEN RPM (WAJIB BERURUTAN DALAM HTML MURNI):

Hasilkan output HTML murni (div kontainer utama, tanpa tag <html>/<body>) dengan struktur rapi berikut:

1. **COVER & HEADER RPM**:
   - Judul: <h1 style="font-family: 'Yu Gothic UI', Arial, sans-serif; font-size: 16pt; font-weight: bold; text-align: center; color: #111827; margin: 0 0 4pt 0; text-transform: uppercase;">RENCANA PEMBELAJARAN MENDALAM (RPM) / MODUL AJAR</h1>
   - Subjudul: <div style="text-align: center; font-style: italic; font-size: 11pt; color: #374151; margin-bottom: 12pt;">BERBASIS ATP & PERMENDIKDASMEN NOMOR 13 TAHUN 2025 (DEEP LEARNING)</div>
   - Blok Identitas Cover: Sekolah (${userIdentity.institutionName}), Mata Pelajaran (${data?.subject}), Kelas (${className}), Semester (${semChoice}), Penyusun (${userIdentity.authorName}).

2. **I. IDENTIFIKASI RPM / IDENTITAS UMUM**:
   - Tabel HTML 2-kolom rapi (Nama Sekolah, Nama Guru, NIP [DIISI OLEH GURU], Mata Pelajaran, Kelas / Fase, Semester / Tahun Pelajaran, Topik Gabungan, Pertemuan, Tanggal Pelaksanaan: <span style="color: #dc2626; font-weight: bold;">${dateString}</span>, Alokasi Waktu: ${totalJP} JP, Total JP).

3. **II. IDENTIFIKASI PESERTA DIDIK**:
   - Tabel HTML 2-kolom:
     | Aspek | Deskripsi Nyata |
     | Pengetahuan Awal | (Uraikan kondisi awal dan prasyarat belajar yang relevan dengan ATP) |
     | Minat Belajar | (Uraikan variasi minat peserta didik yang relevan dengan materi) |
     | Kebutuhan Belajar & Diferensiasi | (Uraikan strategi scaffolding, diferensiasi konten/proses/produk) |

4. **III. MATERI PEMBELAJARAN (4 DIMENSI MATERI)**:
   - Tabel HTML:
     | Dimensi Materi | Uraian Materi Konkret |
     | Faktual | (Fakta-fakta nyata terkait materi) |
     | Konseptual | (Konsep, teori, prinsip utama) |
     | Prosedural | (Langkah-langkah kerja/metode) |
     | Metakognitif | (Kesadaran strategi berpikir & refleksi penerapan diri) |

5. **IV. 8 DIMENSI PROFIL LULUSAN**:
   - Tabel HTML:
     | Dimensi Profil Lulusan | Penerapan Konkret dalam Pembelajaran |
     Pilih dan uraikan dimensi yang relevan secara nyata:
     - Keimanan dan Ketakwaan terhadap Tuhan YME
     - Kewargaan
     - Penalaran Kritis
     - Kreativitas
     - Kolaborasi
     - Kemandirian
     - Kesehatan
     - Komunikasi

6. **V. DESAIN PEMBELAJARAN**:
   - **A. Tujuan Pembelajaran**: Tabel (Pertemuan | Kode TP | Tujuan Pembelajaran - mencakup TP Utama dan TP Turunan operasional terukur).
   - **B. Lintas Disiplin Ilmu**: Tabel (Mata Pelajaran Terkait | Keterkaitan Konkret).
   - **C. Praktik Pedagogis**: Tabel (Pendekatan: Pembelajaran Mendalam | Model Terpilih | Sintaks Model Lengkap | Metode | Alasan Pedagogis).
   - **D. Kemitraan Pembelajaran**: Tabel (Jenis Kemitraan [Guru-Murid, Murid-Murid, Orang Tua, Lingkungan] | Bentuk Kerja Sama Konkret).
   - **E. Lingkungan Pembelajaran**: Tabel (Aspek Fisik, Sosial, Psikologis/Emosional | Kondisi & Penerapan Mendukung).
   - **F. Pemanfaatan Digital**: Tabel (Media / Perangkat Digital | Cara Penggunaan Fungsional).

7. **VI. LANGKAH-LANGKAH PEMBELAJARAN SETIAP PERTEMUAN**:
   Buat rincian lengkap untuk SETIAP PERTEMUAN (mencakup seluruh rangkaian pertemuan dalam alokasi ${totalJP} JP dan tanggal ${dateString}):
   - Header Pertemuan: **PERTEMUAN X** (Kode TP, Tanggal Pelaksanaan, Alokasi Waktu, Level Kognitif, TP, Model Pembelajaran, Sintaks).
   - **KEGIATAN AWAL (15 menit)**: Salam, doa, presensi, apersepsi kontekstual, pertanyaan pemantik berpikir tingkat tinggi, motivasi, penyampaian tujuan belajar & aktivitas, pembuka menggembirakan. Disertai label: *(Berkesadaran)*, *(Bermakna)*, *(Menggembirakan)*, *(Penalaran Kritis)*, *(Komunikasi)*.
   - **KEGIATAN INTI**: Wajib menggunakan Tabel HTML 3 Kolom:
     | Pengalaman Belajar | Sintaks & Aktivitas Pembelajaran | Dimensi Profil Lulusan |
     Terbagi menjadi 3 Pengalaman Belajar Pembelajaran Mendalam:
     1. **MEMAHAMI**: Aktivitas nyata murid mengamati, membaca, menyimak, mengidentifikasi, mengajukan pertanyaan, menganalisis informasi secara mendalam.
     2. **MENGAPLIKASI**: Aktivitas nyata murid memecahkan masalah kontekstual, berdiskusi kelompok, melakukan eksperimen/simulasi, menghasilkan produk/karya nyata.
     3. **MEREFLEKSI**: Aktivitas nyata murid mengevaluasi proses belajar, menilai hasil, menyadari kesulitan, merumuskan strategi perbaikan diri.
   - **KEGIATAN AKHIR (10 menit)**: Kesimpulan pembelajaran bersama murid, umpan balik konstruktif guru, refleksi pengalaman belajar, tindak lanjut, penyampaian materi berikutnya, doa penutup.

8. **VII. ASESMEN PEMBELAJARAN SETIAP PERTEMUAN**:
   - Tabel HTML:
     | Jenis Asesmen | Bentuk & Teknik | Instrumen & Bukti Belajar |
     | Asesmen Diagnostik (Awal) | Pertanyaan lisan / kuis diagnostik | Instrumen pertanyaan awal & pedoman tindak lanjut |
     | Asesmen Formatif (Proses) | Observasi partisipasi, diskusi LKPD, unjuk kerja | Lembar observasi & checklist indikator kinerja |
     | Asesmen Sumatif (Akhir) | Tes tertulis / produk / presentasi | Butir soal sumatif atau rubrik penilaian produk |

9. **VIII. LAMPIRAN MODUL AJAR (LENGKAP & TANPA PLACEHOLDER)**:
   - **LAMPIRAN 1 — RINGKASAN MATERI / BAHAN AJAR**: Materi lengkap, sistematis, dan aplikatif untuk guru dan peserta didik.
   - **LAMPIRAN 2 — SOAL ASESMEN AWAL (DIAGNOSTIK)**: Minimal 5 soal nyata lengkap dengan kunci jawaban dan pedoman penskoran.
   - **LAMPIRAN 3 — MEDIA PEMBELAJARAN**: Tabel (No | Nama Media | Deskripsi & Cara Penggunaan dalam Pembelajaran).
   - **LAMPIRAN 4 — SOAL ASESMEN FORMATIF**: Tabel (Pertemuan/TP | Butir Soal Formatif | Bentuk & Kunci Jawaban).
   - **LAMPIRAN 5 — RUBRIK PENILAIAN LENGKAP**:
     * A. Rubrik Sikap / Profil Lulusan (Skala 1 - 4: Perlu Bimbingan, Cukup, Baik, Sangat Baik beserta deskriptor jelas).
     * B. Rubrik Pengetahuan (Kriteria & rentang skor).
     * C. Rubrik Keterampilan / Kinerja Produk (Aspek, kriteria, dan deskripsi capaian).
   - **LAMPIRAN 6 — LEMBAR KERJA MURID (LKM / LKPD) PER PERTEMUAN**:
     * Header LKPD: LKPD [MAPEL] | KELAS [X] | TOPIK: [MATERI]
     * Identitas Murid: Nama, Kelas, Tanggal.
     * A. Tujuan Pembelajaran
     * B. Petunjuk Pengerjaan
     * C. Aktivitas / Tugas / Tabel Pengamatan / Ruang Kerja
     * D. Kesimpulan
     * E. **REFLEKSIKU** (Pertanyaan refleksi pengalaman belajar bermakna dan menggembirakan).

10. **IX. TABEL VALIDASI OTOMATIS & SUMMARY RPM**:
    - Tabel Validasi HTML (3 kolom: ASPEK VALIDASI | STATUS [LENGKAP / SESUAI / KONSISTEN] | CATATAN KEPATUHAN PERMENDIKDASMEN NO. 13 TAHUN 2025).
    - Ringkasan Checklist Pemenuhan Komponen RPM Pembelajaran Mendalam.

## ATURAN STYLING HTML:
- Judul Bab Utama: <h2 style="color: #059669; font-size: 13pt; font-weight: bold; margin-top: 22px; margin-bottom: 8px; text-transform: uppercase; border-bottom: 2px solid #059669; padding-bottom: 3px; font-family: 'Yu Gothic UI', Arial, sans-serif;">
- Sub-Judul: <h3 style="color: #111827; font-size: 11pt; font-weight: bold; margin-top: 12px; margin-bottom: 4px; font-family: 'Yu Gothic UI', Arial, sans-serif;">
- Seluruh TABEL HTML wajib berformat: border-collapse: collapse; width: 100%; border: 1px solid #cbd5e1; margin-top: 8px; margin-bottom: 14px; font-size: 10.5pt; font-family: 'Yu Gothic UI', Arial, sans-serif;
- Header tabel (th): background-color: #f1f5f9; font-weight: bold; padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left; color: #0f172a;
- Sel tabel (td): padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: top;
- Output HANYA berupa kode HTML div murni (tanpa tag <html>/<body>, tanpa triple backticks).
`;

          let response;
          let retries = 6;
          let success = false;
          let delayMs = 20000;
          
          while (retries > 0 && !success) {
              try {
                  response = await ai.models.generateContent({
                      model: 'gemini-3-flash-preview',
                      contents: prompt,
                      config: {
                          maxOutputTokens: 8192,
                      }
                  });
                  success = true;
              } catch (e: any) {
                  const errorString = JSON.stringify(e) + (e?.message || String(e)) + (e?.error?.status || '');
                  const isRateLimit = errorString.includes('429') || errorString.toLowerCase().includes('quota') || errorString.toLowerCase().includes('rate limit') || errorString.includes('RESOURCE_EXHAUSTED');
                  if (isRateLimit && retries > 1) {
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
               throw new Error(`Gagal memproses setelah percobaan berulang.`);
          }

          const html = response?.text || "<p>Gagal membuat konten.</p>";
          collectedHtml += html + `<br><br><div style="page-break-after: always; clear: both;"></div><br><br>`;
          collectedModulesData.push({ topic: 'Modul Gabungan', html });

          setBulkGenerationStatus(prev => ({
              ...prev,
              [className]: { 
                  current: maxModules, 
                  total: maxModules, 
                  percent: 100, 
                  active: true,
                  statusText: `Modul gabungan selesai.`
              }
          }));


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
      const footerText = `Kumpulan Modul Ajar - ${data?.subject || ''} - ${className} | Disusun oleh: ${userIdentity.authorName}`;

      if (bulkActivity) {
          combinedHtml = bulkActivity.dataSnapshot.combinedHtml;
      } else {
          // Re-sort them ascending by index/time (oldest to newest generated)
          const chronologicalModules = [...classModules].reverse();

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
          <title>Kumpulan RPM Modul Ajar ${className}</title>
          <style>
            @page {
              size: ${size.width} ${size.height};
              mso-page-orientation: portrait;
              margin: 2cm 2cm 2cm 2cm;
              mso-header-margin: 36pt;
              mso-footer-margin: 36pt;
              mso-paper-source: 0;
            }
            body {
              font-family: 'Yu Gothic UI', 'Segoe UI', Arial, 'Helvetica Neue', sans-serif;
              font-size: 11pt;
              line-height: 1.45;
              color: #1f2937;
            }
            h1 {
              font-family: 'Yu Gothic UI', Arial, sans-serif;
              font-size: 15pt;
              font-weight: bold;
              text-align: center;
              color: #111827;
              margin: 0 0 4pt 0;
              text-transform: uppercase;
            }
            h2 {
              font-family: 'Yu Gothic UI', Arial, sans-serif;
              font-size: 12.5pt;
              font-weight: bold;
              color: #059669;
              text-transform: uppercase;
              margin-top: 16pt;
              margin-bottom: 6pt;
              border-bottom: 2px solid #059669;
              padding-bottom: 2pt;
            }
            h3 {
              font-family: 'Yu Gothic UI', Arial, sans-serif;
              font-size: 11pt;
              font-weight: bold;
              color: #111827;
              margin-top: 10pt;
              margin-bottom: 4pt;
            }
            p, li {
              margin-top: 3pt;
              margin-bottom: 4pt;
              line-height: 1.45;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin-top: 6pt;
              margin-bottom: 10pt;
              font-size: 10.5pt;
            }
            td, th {
              border: 1px solid #cbd5e1;
              padding: 5pt 7pt;
              vertical-align: top;
            }
            th {
              background-color: #f1f5f9;
              font-weight: bold;
              color: #0f172a;
              text-align: left;
            }
            ul, ol {
              margin-top: 3pt;
              margin-bottom: 5pt;
              padding-left: 18pt;
            }
            img {
              max-width: 100%;
              height: auto;
              margin: 10px 0;
              border: 1px solid #cbd5e1;
            }
            div.f1 {
              margin-top: 15pt;
              font-size: 9pt;
              text-align: right;
              color: #6b7280;
              border-top: 1px solid #cbd5e1;
              padding-top: 5pt;
            }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 20pt;">
              <h1 style="margin: 0; color: #059669;">KUMPULAN RENCANA PEMBELAJARAN MENDALAM (RPM) / MODUL AJAR</h1>
              <h3 style="margin: 5pt 0; color: #374151;">${userIdentity.institutionName.toUpperCase()}</h3>
              <p style="margin: 2pt 0; font-size: 10.5pt;">Mata Pelajaran: <b>${data?.subject || '-'}</b> | Kelas: <b>${className}</b> | Semester: <b>${semester}</b></p>
          </div>
          <hr style="border: 0; border-top: 1.5px solid #059669; margin-bottom: 15pt;"/>
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
      link.download = `Kumpulan_RPM_Modul_Ajar_${(data?.subject || 'Mapel').replace(/\s+/g, '_')}_${className.replace(/\s+/g, '_')}_Sem${semester}.doc`;
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
              if (!a || !a.className || !className) return false;
              const normalizedAllocClass = String(a.className).toLowerCase().replace(/\s+/g, '');
              const normalizedTargetClass = String(className).toLowerCase().replace(/\s+/g, '');
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

  if (appStage === 'admin') {
      return <AdminDashboard onBack={() => setAppStage('login')} />;
  }

  if (appStage === 'login' || appStage === 'register') {
    const isLogin = appStage === 'login';
    return (
        <div 
            onClick={handleLoginTap}
            className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-4 relative overflow-hidden cursor-pointer"
        >
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" style={{ animationDelay: '2s' }}></div>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`w-full ${isLogin ? 'max-w-md' : 'max-w-lg'} bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 relative z-10`}
            >
                <div className="flex justify-center mb-6">
                    <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30">
                        <BookOpen className="w-8 h-8 text-white" />
                    </div>
                </div>
                
                <h2 className="font-display text-3xl font-extrabold text-center text-slate-800 mb-2">
                    {isLogin ? 'Selamat Datang' : 'Pendaftaran Guru & Kelas'}
                </h2>
                <p className="text-center text-slate-500 mb-6 text-sm">
                    {isLogin ? 'Masuk untuk mengakses ruang kerja kelas Anda' : 'Pilih kelas yang diampu untuk personalisasi otomatis Prota & Modul Ajar'}
                </p>

                
  <form 
      onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget as HTMLFormElement;
          const formData = new FormData(form);
          const rawEmail = formData.get('email');
          const email = typeof rawEmail === 'string' ? rawEmail : '';
          const password = String(formData.get('password') || '');
          const rawName = formData.get('name');
          const name = (typeof rawName === 'string' && rawName.trim()) ? rawName.trim() : (email.includes('@') ? email.split('@')[0] : 'Guru');
          const institution = String(formData.get('institution') || 'Sekolah Dasar');
          const assignedClassToSave = registerClass || 'Kelas 1';
          
          const emailNormalized = String(email || '').toLowerCase().trim();
          if (!emailNormalized) {
              setError('Email tidak boleh kosong.');
              return;
          }
          
          try {
              if (isLogin) {
                  const userDocRef = doc(db, 'users', emailNormalized);
                  const userSnap = await getDoc(userDocRef);
                  
                  if (userSnap.exists()) {
                      const dbData = userSnap.data() || {};
                      if (dbData && dbData.password === password) {
                          const activeSessionId = 'sess_' + Math.random().toString(36).substring(2) + '_' + Date.now();
                          await updateDoc(userDocRef, { activeSessionId, lastActive: Date.now() });
                          
                          const userClass = dbData.assignedClass || 'Kelas 1';
                          const instName = dbData.institutionName || 'Sekolah Dasar';
                          const userName = dbData.name || emailNormalized.split('@')[0];
                          const acadYear = dbData.academicYear || '2025/2026';
                          const sem = dbData.semester || 'Ganjil (Semester 1)';

                          const userData = { email: emailNormalized, name: userName, assignedClass: userClass, institutionName: instName };
                          await usersDB.setItem(emailNormalized, { ...dbData, activeSessionId, lastActive: Date.now() });
                          
                          localStorage.setItem('prota_user', JSON.stringify(userData));
                          localStorage.setItem('prota_session_id', activeSessionId);
                          localStorage.setItem('prota_assigned_class', userClass);
                          localStorage.setItem('prota_author_name', userName);
                          localStorage.setItem('prota_institution_name', instName);
                          localStorage.setItem('prota_academic_year', acadYear);
                          localStorage.setItem('prota_semester', sem);

                          setUser(userData);
                          setSelectedClass(userClass);
                          setSelectedFase(getFaseForClass(userClass));
                          setUserIdentity(prev => ({
                              ...prev,
                              authorName: userName,
                              institutionName: instName,
                              academicYear: acadYear,
                              semester: sem,
                              assignedClass: userClass
                          }));
                          setAppStage('generator');
                      } else {
                          alert('Email atau Password salah.');
                      }
                  } else {
                      // Fallback & migration from local database
                      const storedUser = await usersDB.getItem<any>(emailNormalized);
                      if (storedUser && storedUser.password === password) {
                          const activeSessionId = 'sess_' + Math.random().toString(36).substring(2) + '_' + Date.now();
                          const userClass = storedUser.assignedClass || 'Kelas 1';
                          const instName = storedUser.institutionName || 'Sekolah Dasar';
                          const userName = storedUser.name || emailNormalized.split('@')[0];

                          const userData = { 
                              email: emailNormalized, 
                              name: userName, 
                              password: storedUser.password, 
                              assignedClass: userClass,
                              institutionName: instName,
                              activeSessionId, 
                              lastActive: Date.now() 
                          };
                          
                          await setDoc(userDocRef, userData);
                          await usersDB.setItem(emailNormalized, userData);
                          
                          localStorage.setItem('prota_user', JSON.stringify({ email: emailNormalized, name: userName, assignedClass: userClass, institutionName: instName }));
                          localStorage.setItem('prota_session_id', activeSessionId);
                          localStorage.setItem('prota_assigned_class', userClass);
                          localStorage.setItem('prota_author_name', userName);
                          localStorage.setItem('prota_institution_name', instName);

                          setUser({ email: emailNormalized, name: userName, assignedClass: userClass, institutionName: instName });
                          setSelectedClass(userClass);
                          setSelectedFase(getFaseForClass(userClass));
                          setUserIdentity(prev => ({
                              ...prev,
                              authorName: userName,
                              institutionName: instName,
                              assignedClass: userClass
                          }));
                          setAppStage('generator');
                      } else {
                          alert('Email atau Password salah.');
                      }
                  }
              } else {
                  const userDocRef = doc(db, 'users', emailNormalized);
                  const userSnap = await getDoc(userDocRef);
                  const storedUser = await usersDB.getItem(emailNormalized);
                  
                  if (userSnap.exists() || storedUser) {
                      alert('Akun dengan email ini sudah ada.');
                  } else {
                      const activeSessionId = 'sess_' + Math.random().toString(36).substring(2) + '_' + Date.now();
                      const userData = { 
                          email: emailNormalized, 
                          password, 
                          name, 
                          assignedClass: assignedClassToSave,
                          institutionName: institution,
                          academicYear: '2025/2026',
                          semester: 'Ganjil (Semester 1)',
                          activeSessionId, 
                          lastActive: Date.now() 
                      };
                      
                      await setDoc(userDocRef, userData);
                      await usersDB.setItem(emailNormalized, userData);
                      
                      localStorage.setItem('prota_user', JSON.stringify({ name, email: emailNormalized, assignedClass: assignedClassToSave, institutionName: institution }));
                      localStorage.setItem('prota_session_id', activeSessionId);
                      localStorage.setItem('prota_assigned_class', assignedClassToSave);
                      localStorage.setItem('prota_author_name', name);
                      localStorage.setItem('prota_institution_name', institution);
                      localStorage.setItem('prota_academic_year', '2025/2026');
                      localStorage.setItem('prota_semester', 'Ganjil (Semester 1)');

                      setUser({ name, email: emailNormalized, assignedClass: assignedClassToSave, institutionName: institution });
                      setSelectedClass(assignedClassToSave);
                      setSelectedFase(getFaseForClass(assignedClassToSave));
                      setUserIdentity({
                          authorName: name,
                          institutionName: institution,
                          academicYear: '2025/2026',
                          semester: 'Ganjil (Semester 1)',
                          assignedClass: assignedClassToSave,
                          customApiKey: localStorage.getItem('prota_custom_api_key') || ''
                      });
                      setAppStage('tutorial');
                  }
              }
          } catch(err) {
              console.error(err);
              alert('Terjadi kesalahan saat memproses akun');
          }
      }}
      className="space-y-4"
  >

                    {!isLogin && (
                        <>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Nama Lengkap &amp; Gelar</label>
                                <input 
                                    type="text" 
                                    name="name"
                                    required 
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/70 text-sm"
                                    placeholder="Contoh: Budi Santoso, S.Pd."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Nama Sekolah / Instansi</label>
                                <input 
                                    type="text" 
                                    name="institution"
                                    required 
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/70 text-sm"
                                    placeholder="Contoh: SD Negeri 1 Merdeka"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                                    <span>Pilih Kelas yang Diampu</span>
                                    <span className="text-blue-600 font-semibold normal-case text-xs">Fokus Ruang Kerja Guru</span>
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {ALL_AVAILABLE_CLASSES.map((cls) => {
                                        const isSelected = registerClass === cls.id;
                                        return (
                                            <button
                                                key={cls.id}
                                                type="button"
                                                onClick={() => setRegisterClass(cls.id)}
                                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                                                        : 'bg-white/80 hover:bg-slate-100 border-slate-200 text-slate-700'
                                                }`}
                                            >
                                                <div className="font-bold text-sm leading-tight">{cls.id}</div>
                                                <div className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                                                    Fase {cls.faseId}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                    
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Email</label>
                        <input 
                            type="email" 
                            name="email"
                            required 
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/70 text-sm"
                            placeholder="guru@sekolah.sch.id"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Kata Sandi</label>
                        <input 
                            type="password" 
                            name="password"
                            required 
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/70 text-sm"
                            placeholder="Masukkan kata sandi"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 mt-2 cursor-pointer"
                    >
                        {isLogin ? 'Masuk ke Ruang Kerja' : 'Daftar & Mulai Sekarang'}
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

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                            <span>Kelas yang Diampu</span>
                            <span className="text-blue-600 font-semibold text-xs">Penetapan Otomatis Perangkat Ajar</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {ALL_AVAILABLE_CLASSES.map((cls) => {
                                const isSelected = userIdentity.assignedClass === cls.id;
                                return (
                                    <button
                                        key={cls.id}
                                        type="button"
                                        onClick={() => setUserIdentity(prev => ({ ...prev, assignedClass: cls.id }))}
                                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                            isSelected
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                        }`}
                                    >
                                        <div className="font-bold text-sm leading-tight">{cls.id}</div>
                                        <div className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                                            Fase {cls.faseId}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
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
                                setUserIdentity({ authorName: '', institutionName: '', academicYear: '', semester: '', assignedClass: 'Kelas 1', customApiKey: '' });
                                localStorage.removeItem('prota_author_name');
                                localStorage.removeItem('prota_institution_name');
                                localStorage.removeItem('prota_academic_year');
                                localStorage.removeItem('prota_semester');
                                localStorage.removeItem('prota_custom_api_key');
                            }}
                            className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                            Bersihkan
                        </button>
                        <button 
                            onClick={async () => {
                                const targetClass = userIdentity.assignedClass || 'Kelas 1';
                                localStorage.setItem('prota_author_name', userIdentity.authorName);
                                localStorage.setItem('prota_institution_name', userIdentity.institutionName);
                                localStorage.setItem('prota_academic_year', userIdentity.academicYear);
                                localStorage.setItem('prota_semester', userIdentity.semester);
                                localStorage.setItem('prota_assigned_class', targetClass);
                                
                                setSelectedClass(targetClass);
                                setSelectedFase(getFaseForClass(targetClass));

                                if (userIdentity.customApiKey) {
                                    localStorage.setItem('prota_custom_api_key', userIdentity.customApiKey);
                                } else {
                                    localStorage.removeItem('prota_custom_api_key');
                                }

                                if (user && user.email) {
                                    try {
                                        const emailNorm = String(user?.email || '').toLowerCase().trim();
                                        if (!emailNorm) return;
                                        const userDocRef = doc(db, 'users', emailNorm);
                                        const updatePayload = {
                                            name: userIdentity.authorName || user.name,
                                            institutionName: userIdentity.institutionName,
                                            assignedClass: targetClass,
                                            academicYear: userIdentity.academicYear,
                                            semester: userIdentity.semester,
                                            lastActive: Date.now()
                                        };
                                        await updateDoc(userDocRef, updatePayload);
                                        const localObj = await usersDB.getItem<any>(emailNorm);
                                        if (localObj) {
                                            await usersDB.setItem(emailNorm, { ...localObj, ...updatePayload });
                                        }
                                        const updatedUser = { ...user, name: userIdentity.authorName || user.name, assignedClass: targetClass, institutionName: userIdentity.institutionName };
                                        setUser(updatedUser);
                                        localStorage.setItem('prota_user', JSON.stringify(updatedUser));
                                    } catch (err) {
                                        console.error('Failed to sync updated identity to cloud', err);
                                    }
                                }

                                setAppStage('generator');
                            }}
                            className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            Konfirmasi &amp; Masuk Ruang Kerja <ArrowRight className="w-5 h-5"/>
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
      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
                  <Key className="w-6 h-6 text-blue-200" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Pengaturan API Key Gemini</h3>
                  <p className="text-xs text-blue-100">Kelola API Key pribadi Anda</p>
                </div>
              </div>
              <button 
                onClick={() => setShowApiKeyModal(false)}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 bg-slate-50/50">
              {/* Active Status Badge */}
              <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
                localStorage.getItem('prota_custom_api_key') 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                {localStorage.getItem('prota_custom_api_key') ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block text-sm">
                    {localStorage.getItem('prota_custom_api_key') ? 'Custom API Key Aktif' : 'Menggunakan API Key System (Default)'}
                  </span>
                  <p className="mt-0.5 leading-relaxed">
                    {localStorage.getItem('prota_custom_api_key')
                      ? 'Proses pemrosesan AI menggunakan API Key pribadi yang Anda simpan.'
                      : 'Jika terjadi limit kuota pada server, Anda dapat memasukkan Gemini API Key pribadi di bawah ini.'}
                  </p>
                </div>
              </div>

              {/* Notification Message */}
              {apiKeyMessage && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in ${
                  apiKeyMessage.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
                  apiKeyMessage.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
                  'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  <span>{apiKeyMessage.text}</span>
                  <button onClick={() => setApiKeyMessage(null)} className="text-gray-500 hover:text-gray-700 ml-2">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Input Field */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKeyText ? "text" : "password"}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Masukkan Gemini API Key (contoh: AIzaSy...)"
                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white font-mono transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKeyText(!showApiKeyText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    title={showApiKeyText ? "Sembunyikan Key" : "Tampilkan Key"}
                  >
                    {showApiKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Key ini disimpan secara lokal di peramban (localStorage) dan tidak akan dikirim ke server pihak ketiga.
                </p>
              </div>

              {/* External Link */}
              <div className="pt-1">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Dapatkan API Key Gratis di Google AI Studio ↗
                </a>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-2 justify-end">
                {localStorage.getItem('prota_custom_api_key') && (
                  <button
                    onClick={() => {
                      localStorage.removeItem('prota_custom_api_key');
                      setApiKeyInput('');
                      setUserIdentity(prev => ({ ...prev, customApiKey: '' }));
                      setApiKeyMessage({ type: 'info', text: 'API Key dihapus. Menggunakan key system default.' });
                    }}
                    className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> Hapus Key
                  </button>
                )}
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    const trimmed = apiKeyInput.trim();
                    if (trimmed) {
                      localStorage.setItem('prota_custom_api_key', trimmed);
                      setUserIdentity(prev => ({ ...prev, customApiKey: trimmed }));
                      setApiKeyMessage({ type: 'success', text: 'API Key berhasil disimpan dan diaktifkan!' });
                    } else {
                      localStorage.removeItem('prota_custom_api_key');
                      setUserIdentity(prev => ({ ...prev, customApiKey: '' }));
                      setApiKeyMessage({ type: 'info', text: 'API Key dikosongkan. Menggunakan key default system.' });
                    }
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Simpan API Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                       onDateRangeClick={(startDateStr, endDateStr, ev) => setEditingCalendarEvent({ dateStr: startDateStr, endDateStr, ev })}
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
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{editingCalendarEvent.ev ? 'Ubah/Hapus Keterangan' : 'Tambah Keterangan Kalender'}</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                          <input type="date" id="ev-start" defaultValue={editingCalendarEvent.ev?.start || editingCalendarEvent.dateStr} className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai</label>
                          <input type="date" id="ev-end" defaultValue={editingCalendarEvent.ev?.end || editingCalendarEvent.endDateStr || editingCalendarEvent.dateStr} className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan Kegiatan / Libur</label>
                          <input type="text" id="ev-desc" defaultValue={editingCalendarEvent.ev?.description || ''} placeholder="Contoh: Libur Hari Raya, Penilaian Akhir Semester" className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Warna / Kategori</label>
                          <select id="ev-color" defaultValue={editingCalendarEvent.ev?.color || 'bg-red-500'} className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500">
                              <option value="bg-red-500">Merah (Libur Nasional / Hari Besar)</option>
                              <option value="bg-pink-500">Pink / Merah Muda (Libur Semester)</option>
                              <option value="bg-orange-500">Oranye (Asesmen / Penilaian / Ujian)</option>
                              <option value="bg-blue-500">Biru (Kegiatan Khusus / Classmeeting)</option>
                              <option value="bg-purple-500">Ungu (Pengolahan Nilai & Pembagian Raport)</option>
                              <option value="bg-green-500">Hijau (Awal Masuk Sekolah / MPLS)</option>
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
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Konfigurasi Modul</h3>
            <p className="text-sm text-gray-600 mb-4 text-center">Tentukan karakteristik peserta didik dan pilih semester untuk menghasilkan modul ajar.</p>
            
            <div className="mb-6">
                <label className="block text-xs font-bold text-gray-700 mb-2">Karakteristik Peserta Didik</label>
                <select 
                    value={selectedCharacteristic}
                    onChange={(e) => setSelectedCharacteristic(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                    <option value="Beragam (Visual, Auditori, Kinestetik)">Beragam (Visual, Auditori, Kinestetik)</option>
                    <option value="Sangat Aktif dan Suka Bermain (Kinestetik dominan)">Sangat Aktif dan Suka Bermain (Kinestetik dominan)</option>
                    <option value="Cenderung Pasif/Pemalu (Membutuhkan dorongan interaksi)">Cenderung Pasif/Pemalu (Membutuhkan dorongan interaksi)</option>
                    <option value="Pemahaman Cepat (Membutuhkan tantangan/pengayaan lebih)">Pemahaman Cepat (Membutuhkan tantangan/pengayaan lebih)</option>
                    <option value="Membutuhkan Pendampingan Khusus (Instruksi bertahap)">Membutuhkan Pendampingan Khusus (Instruksi bertahap)</option>
                </select>
                <p className="text-[10px] text-gray-500 mt-1">Model pembelajaran akan disesuaikan otomatis oleh AI.</p>
            </div>

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



      {/* Main Container with Collapsible App Sidebar */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full p-4 md:p-6 gap-6 relative">
        {/* App Sidebar */}
        {isSidebarOpen && (
            <>
                {/* Mobile backdrop */}
                <div 
                    onClick={() => setIsSidebarOpen(false)} 
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs" 
                />

                <aside className="fixed lg:static top-0 bottom-0 left-0 z-50 w-80 lg:w-[300px] bg-white border-r lg:border border-slate-200/90 shadow-2xl lg:shadow-xs lg:rounded-3xl shrink-0 flex flex-col max-h-[100vh] lg:max-h-[calc(100vh-100px)] sticky lg:top-20 overflow-hidden transition-all duration-300">
                    {/* Sidebar Header (Matching screenshot style) */}
                    <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-600/20">
                                <GraduationCap className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-extrabold text-slate-900 text-sm tracking-tight leading-tight">PERANGKAT AJAR</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SD ASSISTANT</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
                            title="Tutup Sidebar"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Pengguna Card Badge */}
                    <div className="p-4 border-b border-slate-100 shrink-0 bg-slate-50/50">
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">PENGGUNA</div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                                <User className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-xs text-slate-900 truncate">{userIdentity.authorName || 'Acep Miftah Hilah Ash-shidiq, S.Pd.'}</h3>
                                <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span>{userIdentity.employmentStatus || 'Full Time'} • Guru {userIdentity.assignedClass || 'Kelas 1'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Items List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-4">
                        {/* Section 1: Menu Utama */}
                        <div className="space-y-1">
                            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 mb-1.5">MENU UTAMA</div>

                            {/* Menu 1: Dashboard */}
                            <button
                                onClick={() => {
                                    setCurrentView('dashboard');
                                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                }}
                                className={`w-full px-3 py-2.5 rounded-2xl text-left flex items-center gap-3 font-semibold text-xs transition-all cursor-pointer ${currentView === 'dashboard' ? 'bg-emerald-50 text-emerald-800 font-bold shadow-2xs border border-emerald-200/80' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <Home className={`w-4 h-4 ${currentView === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span>Dashboard</span>
                            </button>

                            {/* Menu 2: Daftar Siswa */}
                            <button
                                onClick={() => {
                                    setCurrentView('daftar_siswa');
                                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                }}
                                className={`w-full px-3 py-2.5 rounded-2xl text-left flex items-center gap-3 font-semibold text-xs transition-all cursor-pointer ${currentView === 'daftar_siswa' ? 'bg-emerald-50 text-emerald-800 font-bold shadow-2xs border border-emerald-200/80' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <Users className={`w-4 h-4 ${currentView === 'daftar_siswa' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span>Daftar Siswa</span>
                            </button>

                            {/* Menu 3: Kalender Akademik */}
                            <button
                                onClick={() => {
                                    setCurrentView('calendar');
                                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                }}
                                className={`w-full px-3 py-2.5 rounded-2xl text-left flex items-center gap-3 font-semibold text-xs transition-all cursor-pointer ${currentView === 'calendar' ? 'bg-emerald-50 text-emerald-800 font-bold shadow-2xs border border-emerald-200/80' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <Calendar className={`w-4 h-4 ${currentView === 'calendar' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span>Kalender Akademik</span>
                            </button>

                            {/* Menu 4: Jadwal Mengajar */}
                            <button
                                onClick={() => {
                                    setCurrentView('jadwal_mengajar');
                                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                }}
                                className={`w-full px-3 py-2.5 rounded-2xl text-left flex items-center gap-3 font-semibold text-xs transition-all cursor-pointer ${currentView === 'jadwal_mengajar' ? 'bg-emerald-50 text-emerald-800 font-bold shadow-2xs border border-emerald-200/80' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <CalendarCheck className={`w-4 h-4 ${currentView === 'jadwal_mengajar' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span>Jadwal Mengajar</span>
                            </button>

                            {/* Menu 5: Hari Efektif */}
                            <button
                                onClick={() => {
                                    setCurrentView('hari_efektif');
                                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                }}
                                className={`w-full px-3 py-2.5 rounded-2xl text-left flex items-center gap-3 font-semibold text-xs transition-all cursor-pointer ${currentView === 'hari_efektif' ? 'bg-emerald-50 text-emerald-800 font-bold shadow-2xs border border-emerald-200/80' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <BookOpen className={`w-4 h-4 ${currentView === 'hari_efektif' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span>Hari Efektif</span>
                            </button>

                            {/* Menu 6: Presensi */}
                            <button
                                onClick={() => {
                                    setCurrentView('presensi');
                                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                }}
                                className={`w-full px-3 py-2.5 rounded-2xl text-left flex items-center gap-3 font-semibold text-xs transition-all cursor-pointer ${currentView === 'presensi' ? 'bg-emerald-50 text-emerald-800 font-bold shadow-2xs border border-emerald-200/80' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <ClipboardCheck className={`w-4 h-4 ${currentView === 'presensi' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span>Presensi Siswa</span>
                            </button>

                            {/* Menu 7: Program Tahunan (Prota) */}
                            <button
                                onClick={() => {
                                    setCurrentView('generator');
                                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                }}
                                className={`w-full px-3 py-2.5 rounded-2xl text-left flex items-center gap-3 font-semibold text-xs transition-all cursor-pointer ${currentView === 'generator' ? 'bg-emerald-50 text-emerald-800 font-bold shadow-2xs border border-emerald-200/80' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <FileText className={`w-4 h-4 ${currentView === 'generator' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span>Program Tahunan</span>
                            </button>

                            {/* Menu 8: Modul Ajar (RPM) */}
                            <button
                                onClick={() => {
                                    setCurrentView('modul_ajar');
                                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                }}
                                className={`w-full px-3 py-2.5 rounded-2xl text-left flex items-center gap-3 font-semibold text-xs transition-all cursor-pointer ${currentView === 'modul_ajar' ? 'bg-emerald-50 text-emerald-800 font-bold shadow-2xs border border-emerald-200/80' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <Sparkles className={`w-4 h-4 ${currentView === 'modul_ajar' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span>Modul Ajar RPM</span>
                            </button>

                            {/* Menu 9: KKTP */}
                            <button
                                onClick={() => {
                                    setCurrentView('kktp');
                                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                }}
                                className={`w-full px-3 py-2.5 rounded-2xl text-left flex items-center gap-3 font-semibold text-xs transition-all cursor-pointer ${currentView === 'kktp' ? 'bg-emerald-50 text-emerald-800 font-bold shadow-2xs border border-emerald-200/80' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <Target className={`w-4 h-4 ${currentView === 'kktp' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span>KKTP & Interval</span>
                            </button>

                            {/* Menu 10: Jurnal */}
                            <button
                                onClick={() => {
                                    setCurrentView('jurnal');
                                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                }}
                                className={`w-full px-3 py-2.5 rounded-2xl text-left flex items-center gap-3 font-semibold text-xs transition-all cursor-pointer ${currentView === 'jurnal' ? 'bg-emerald-50 text-emerald-800 font-bold shadow-2xs border border-emerald-200/80' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <BookMarked className={`w-4 h-4 ${currentView === 'jurnal' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span>Jurnal Mengajar</span>
                            </button>


                        </div>

                        {/* Section 2: Data & Pencadangan */}
                        <div className="space-y-1 pt-3 border-t border-slate-100">
                            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 mb-1.5">DATA & PENCADANGAN</div>
                            
                            <button
                                onClick={handleBackup}
                                className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5 text-slate-400" />
                                <span>Backup Data</span>
                            </button>

                            <label className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                                <Upload className="w-3.5 h-3.5 text-slate-400" />
                                <span>Restore Data</span>
                                <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                            </label>

                            <button
                                onClick={() => {
                                    setApiKeyInput(localStorage.getItem('prota_custom_api_key') || '');
                                    setApiKeyMessage(null);
                                    setShowApiKeyModal(true);
                                }}
                                className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                                <Key className="w-3.5 h-3.5 text-slate-400" />
                                <span>Pengaturan API</span>
                            </button>

                            <button
                                onClick={handleLogout}
                                className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer mt-2"
                            >
                                <LogOut className="w-3.5 h-3.5 text-red-500" />
                                <span>Keluar</span>
                            </button>
                        </div>
                    </div>
                </aside>
            </>
        )}

        {/* Main Content Workspace */}
        <main className="flex-1 min-w-0 w-full space-y-6">
            {showEditProfileModal && (
                <EditProfileModal 
                    identity={userIdentity} 
                    onSave={handleSaveIdentity} 
                    onClose={() => setShowEditProfileModal(false)} 
                />
            )}

            {!isSidebarOpen && (
                <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                    >
                        <Menu className="w-4 h-4" /> Buka Menu Navigasi
                    </button>
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                        <span className="font-bold text-emerald-800">{userIdentity.authorName || 'Guru S.Pd.'}</span>
                        <span>•</span>
                        <span>{selectedClass}</span>
                    </div>
                </div>
            )}

        {currentView === 'dashboard' ? (
            <DashboardView 
                identity={userIdentity}
                onEditProfile={() => setShowEditProfileModal(true)}
                onNavigate={setCurrentView}
            />
        ) : currentView === 'daftar_siswa' ? (
            <DaftarSiswaView 
                selectedClass={selectedClass}
                identity={userIdentity}
            />
        ) : currentView === 'presensi' ? (
            <PresensiView 
                selectedClass={selectedClass}
                identity={userIdentity}
            />
        ) : currentView === 'jadwal_mengajar' ? (
            <JadwalMengajarView 
                selectedClass={selectedClass}
                classSchedules={classSchedules}
                toggleScheduleDay={toggleScheduleDay}
                classDailyJP={classDailyJP}
                updateDailyJP={updateDailyJP}
                schoolDaysCount={schoolDaysCount}
                setSchoolDaysCount={setSchoolDaysCount}
                identity={userIdentity}
            />
        ) : currentView === 'hari_efektif' ? (
            <HariEfektifView 
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
                selectedSubject={selectedSubject}
                setSelectedSubject={setSelectedSubject}
                classSchedules={classSchedules}
                classDailyJP={classDailyJP}
                calendarEvents={calendarEvents}
                academicYearStart={academicYearStart}
                schoolDaysCount={schoolDaysCount}
                identity={userIdentity}
            />
        ) : currentView === 'kktp' ? (
            <KKTPView 
                selectedSubject={selectedSubject}
                selectedClass={selectedClass}
                identity={userIdentity}
            />
        ) : currentView === 'jurnal' ? (
            <JurnalView 
                selectedSubject={selectedSubject}
                selectedClass={selectedClass}
                identity={userIdentity}
            />
        ) : currentView === 'calendar' ? (
            <CalendarPageView 
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
                selectedSubject={selectedSubject}
                setSelectedSubject={setSelectedSubject}
                availableClasses={selectedFase.classes}
                availableSubjects={SUBJECTS}
                classSchedules={classSchedules}
                toggleScheduleDay={toggleScheduleDay}
                classDailyJP={classDailyJP}
                updateDailyJP={updateDailyJP}
                calendarEvents={calendarEvents}
                setCalendarEvents={setCalendarEvents}
                onDateClick={(dateStr, ev) => setEditingCalendarEvent({ dateStr, ev })}
                onDateRangeClick={(startDateStr, endDateStr, ev) => setEditingCalendarEvent({ dateStr: startDateStr, endDateStr, ev })}
                academicYearStart={academicYearStart}
                setAcademicYearStart={setAcademicYearStart}
                schoolDaysCount={schoolDaysCount}
                setSchoolDaysCount={setSchoolDaysCount}
                calculateCalendarAnalysis={calculateCalendarAnalysis}
                activeTab={calendarPageTab}
                setActiveTab={setCalendarPageTab}
                onBackToGenerator={() => setCurrentView('generator')}
                userIdentity={userIdentity}
                saveActivityLog={saveActivityLog}
            />
        ) : currentView === 'modul_ajar' && modulContext ? (
            <ModulAjarGenerator 
                context={modulContext} 
                userIdentity={userIdentity}
                onBack={() => {
                    setCurrentView('modul_ajar');
                    setModulContext(null);
                }}
                onSave={saveActivityLog}
            />
        ) : currentView === 'history' ? (
            <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-3">
                        Riwayat Aktivitas
                        {activities.length > 0 && (
                            
                            <div className="flex items-center gap-2">
                                <button onClick={handleBackup} className="text-xs flex items-center gap-1 font-semibold bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors">
                                    <FileDown className="w-3.5 h-3.5" /> Backup Database
                                </button>
                                <label className="text-xs flex items-center gap-1 font-semibold bg-orange-50 text-orange-600 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                                    <FileOutput className="w-3.5 h-3.5" /> Restore Database
                                    <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                                </label>
                                <button onClick={clearAllActivities} className="text-xs flex items-center gap-1 font-semibold bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" /> Hapus Semua
                                </button>
                            </div>

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
                <div className="space-y-6">
                    {/* Header Card matching the uploaded image */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-emerald-600 animate-pulse" />
                                <span>{currentView === 'modul_ajar' ? 'Modul Ajar (RPM)' : 'Program Tahunan (Prota)'}</span>
                            </h2>
                            <p className="text-xs font-semibold text-slate-500">
                                {currentView === 'modul_ajar' 
                                    ? 'Pilih ATP Untuk membuat modul ajar RPM' 
                                    : 'Buat Prota otomatis dengan AI berdasarkan referensi CP dan TP.'}
                            </p>
                        </div>

                        {/* Right side controls matching the layout and labels */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Paper size toggle selector */}
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/40">
                                <button 
                                    onClick={() => setPaperSize('A4')} 
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${paperSize === 'A4' ? 'bg-white text-emerald-800 shadow-2xs border border-slate-200' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    A4
                                </button>
                                <button 
                                    onClick={() => setPaperSize('F4')} 
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${paperSize === 'F4' ? 'bg-white text-emerald-800 shadow-2xs border border-slate-200' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    F4 (Folio)
                                </button>
                            </div>

                            {/* Button: Hasilkan Prota / Hasilkan modul ajar */}
                            {currentView !== 'modul_ajar' && (
                                <button 
                                    onClick={() => generateContent()} 
                                    disabled={loading}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-full transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-emerald-600/10"
                                >
                                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                    <span>Hasilkan Prota</span>
                                </button>
                            )}

                            {/* Button: Simpan */}
                            <button 
                                onClick={() => setShowSaveToast(true)}
                                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 rounded-full transition-all cursor-pointer border border-emerald-100"
                            >
                                <span>Simpan</span>
                            </button>

                            {/* Button: Unduh Word */}
                            {currentView !== 'modul_ajar' && (
                                <button 
                                    onClick={() => handleDownloadProta(selectedClass)} 
                                    disabled={!data}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 rounded-full transition-all disabled:opacity-40 cursor-pointer shadow-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Unduh Word</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Horizontal Pill List of Mata Pelajaran (replacing Class buttons) */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">PILIHAN MATA PELAJARAN ({selectedClass})</span>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">Fase {selectedFase.name}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {getScheduledSubjects().map((sub) => {
                                const isActive = selectedSubject === sub;
                                return (
                                    <button
                                        key={sub}
                                        onClick={() => setSelectedSubject(sub)}
                                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                                            isActive
                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs'
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        {sub}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                            <p className="font-medium">Terjadi Kesalahan</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {!data ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-4">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                <Sparkles className="w-8 h-8 animate-pulse" />
                            </div>
                            <div className="max-w-md mx-auto">
                                <h3 className="text-lg font-bold text-gray-800">Program Tahunan Belum Dihasilkan</h3>
                                <p className="text-gray-500 text-sm mt-1.5">Pilih Mata Pelajaran pada tab di atas, lalu klik "Hasilkan Prota" untuk memulai penyusunan otomatis berbasis AI.</p>
                            </div>
                            <button 
                                onClick={() => generateContent()}
                                disabled={loading}
                                className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-2 mx-auto cursor-pointer"
                            >
                                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                Hasilkan Prota ({selectedSubject})
                            </button>
                        </div>
                    ) : (() => {
                        const className = selectedClass;
                        const hasATP = (data.elements || []).some(el => (el.allocations || []).find(a => isSameClass(a.className, className))?.structuredAtp);
                        
                        // Helper to label the semester dynamically
                        const getSemesterLabel = (dateStr: string): string => {
                            if (!dateStr) return '';
                            const d = new Date(dateStr);
                            const m = d.getMonth();
                            return (m >= 6) ? 'Smt 1 (Ganjil)' : 'Smt 2 (Genap)';
                        };

                        return (
                            <div key={className} className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                                <div className="p-4 bg-slate-50 border-b flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <h3 className="font-bold text-lg border-l-4 border-emerald-600 pl-3 text-slate-800">{className} — {data.subject}</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        {currentView === 'modul_ajar' && hasATP && (
                                            <>
                                                <button 
                                                    onClick={() => handleBulkGenerateModulForClass(className)} 
                                                    disabled={bulkGenerationStatus[className]?.active}
                                                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                                                >
                                                    {bulkGenerationStatus[className]?.active ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />} 
                                                    {bulkGenerationStatus[className]?.active ? 'Sedang Membuat Modul...' : 'Buat Modul Ajar'}
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
                                            <div className="flex gap-2">
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
                                    <table className="w-full text-sm text-left border-collapse border border-slate-200">
                                        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3 text-center border-r border-b border-slate-200 text-xs w-12">No</th>
                                                <th className="px-4 py-3 border-r border-b border-slate-200 text-xs w-1/6">Elemen</th>
                                                <th className="px-4 py-3 border-r border-b border-slate-200 text-xs w-1/4">Capaian Pembelajaran (CP)</th>
                                                <th className="px-4 py-3 border-r border-b border-slate-200 text-xs w-1/4">Tujuan Pembelajaran (TP)</th>
                                                <th className="px-4 py-3 border-r border-b border-slate-200 text-xs w-1/4">Alur Tujuan Pembelajaran (ATP)</th>
                                                <th className="px-4 py-3 text-center border-r border-b border-slate-200 text-xs w-20">Alokasi JP</th>
                                                <th className="px-4 py-3 text-center border-b border-slate-200 text-xs w-52">Rencana Tanggal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {(data.elements || []).map((el, elIdx) => {
                                                let allocIdx = (el.allocations || []).findIndex(a => isSameClass(a.className, className));
                                                if (allocIdx < 0 && (el.allocations || []).length === 1) allocIdx = 0;
                                                const alloc = (el.allocations || [])[allocIdx];
                                                if (!alloc) return null;

                                                const groups = alloc.structuredAtp || (alloc.tujuanPembelajaran || []).map(tp => ({ tp, atpItems: [] }));
                                                const rowSpan = groups.reduce((acc, g) => acc + Math.max(g.atpItems.length, 1), 0);

                                                return groups.map((grp, grpIdx) => {
                                                    const items = grp.atpItems.length > 0 ? grp.atpItems : [{ alur: '', alokasiWaktu: '-' }];
                                                    return items.map((item, itemIdx) => {
                                                        const nonEffective = item.planDate ? checkNonEffectiveDate(item.planDate) : null;
                                                        return (
                                                            <tr key={`${elIdx}-${grpIdx}-${itemIdx}`} className="hover:bg-slate-50/50 transition-colors">
                                                                {grpIdx === 0 && itemIdx === 0 && (
                                                                    <>
                                                                        <td rowSpan={rowSpan} className="px-4 py-3 border border-slate-200 text-center align-top font-bold text-slate-800 text-sm">
                                                                            {elIdx + 1}
                                                                        </td>
                                                                        <td rowSpan={rowSpan} className="px-4 py-3 border border-slate-200 align-top font-bold text-slate-800 text-sm">
                                                                            {el.elementName}
                                                                        </td>
                                                                        <td rowSpan={rowSpan} className="px-4 py-3 border border-slate-200 align-top text-xs text-slate-600 leading-relaxed">
                                                                            {el.capaianPembelajaran}
                                                                        </td>
                                                                        <td rowSpan={rowSpan} className="px-4 py-3 border border-slate-200 align-top bg-slate-50/20">
                                                                            <ul className="list-disc pl-4 space-y-1 text-xs text-slate-700 font-medium">
                                                                                {groups.map((g, idx) => (
                                                                                    <li key={idx}>{g.tp}</li>
                                                                                ))}
                                                                            </ul>
                                                                        </td>
                                                                    </>
                                                                )}
                                                                
                                                                <td className={`px-4 py-3 border border-slate-200 align-top text-xs leading-normal ${activities.some(a => a.type === 'MODUL_AJAR' && a.subject === data.subject && a.details.includes(item.alur?.substring(0, 30) || 'xxx')) ? 'bg-indigo-50/50' : 'bg-emerald-50/10'}`}>
                                                                    {item.alur ? (
                                                                        <div className="flex gap-2.5 items-start">
                                                                            {currentView === 'modul_ajar' && (
                                                                                <input 
                                                                                    type="checkbox" 
                                                                                    checked={!!(selectedAtps[className] && selectedAtps[className][`${elIdx}-${grpIdx}-${itemIdx}`])}
                                                                                    onChange={(e) => {
                                                                                        const checked = e.target.checked;
                                                                                        setSelectedAtps(prev => ({
                                                                                            ...prev,
                                                                                            [className]: {
                                                                                                ...(prev[className] || {}),
                                                                                                [`${elIdx}-${grpIdx}-${itemIdx}`]: checked
                                                                                            }
                                                                                        }));
                                                                                    }}
                                                                                    className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                                                />
                                                                            )}
                                                                            <div className="flex flex-col gap-1">
                                                                                <div className="flex gap-1.5 items-start">
                                                                                    <span className="font-bold text-emerald-600">{itemIdx+1}.</span>
                                                                                    <span className="text-slate-700 font-medium">{item.alur}</span>
                                                                                </div>
                                                                                {activities.some(a => a.type === 'MODUL_AJAR' && a.subject === data.subject && a.details.includes(item.alur.substring(0, 30))) && (
                                                                                    <span className="inline-block text-[10px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md w-fit">
                                                                                        ✓ Modul Dibuat
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ) : <span className="text-slate-400 italic">Belum digenerate</span>}
                                                                </td>

                                                                <td className="px-4 py-3 border border-slate-200 text-center align-middle font-extrabold text-emerald-700 text-xs">
                                                                    {item.alokasiWaktu ? (
                                                                        <span className="inline-block whitespace-nowrap bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 shadow-3xs">
                                                                            {item.alokasiWaktu.toLowerCase().includes('jp') ? item.alokasiWaktu : `${item.alokasiWaktu} JP`}
                                                                        </span>
                                                                    ) : '-'}
                                                                </td>

                                                                <td className="px-4 py-3 border border-slate-200 align-top">
                                                                    {item.alur ? (
                                                                        <div className="flex flex-col gap-1.5">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <input 
                                                                                    type="date" 
                                                                                    className={`flex-1 text-xs p-1.5 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500 ${nonEffective ? 'border-red-400 bg-red-50 text-red-700 font-bold' : 'border-slate-200 text-slate-700'}`}
                                                                                    value={item.planDate || ''}
                                                                                    onChange={(e) => handleUpdateDate(className, elIdx, allocIdx, grpIdx, itemIdx, e.target.value)}
                                                                                />
                                                                            </div>
                                                                            {item.planDate && (
                                                                                <div className="text-center mt-1">
                                                                                    <div className="text-xs font-bold text-slate-800">
                                                                                        {getDayName(new Date(item.planDate))}, {new Date(item.planDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                                    </div>
                                                                                    <div className={`text-[10px] font-bold mt-0.5 ${
                                                                                        getSemesterLabel(item.planDate).includes('1') ? 'text-emerald-600' : 'text-blue-600'
                                                                                    }`}>
                                                                                        {getSemesterLabel(item.planDate)}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            {nonEffective && (
                                                                                <div className="text-[10px] text-red-600 bg-red-100 p-1.5 rounded-lg flex gap-1 items-start mt-1 leading-normal">
                                                                                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500"/> 
                                                                                    <span>{nonEffective.description}</span>
                                                                                </div>
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
                    })()}
                    
                    {/* Beautiful success toast notification */}
                    {showSaveToast && (
                        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-bounce">
                            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                            <span className="text-xs font-bold font-sans">Semua perubahan pada Program Tahunan berhasil disimpan!</span>
                        </div>
                    )}
                </div>
            )}
        </main>
      </div>
    </div>
  );
};


// Create or get the root element
const rootElement = document.getElementById('root')!;
const root = (window as any).__REACT_ROOT__ || createRoot(rootElement);
(window as any).__REACT_ROOT__ = root;

root.render(<App />);