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
    Layers, PenLine, CheckCheck, Upload, RotateCcw, ClipboardPaste, FileSpreadsheet, Copy,
    Play, ExternalLink, Video, Youtube, Tv, Link as LinkIcon
} from 'lucide-react';


import localforage from 'localforage';
import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true
}, firebaseConfig.firestoreDatabaseId);




                

export interface LoginFlashcardItem {
    id: string;
    title: string;
    link: string;
    category?: string;
    duration?: string;
    createdAt?: number;
}

export const extractYoutubeVideoId = (url: string): string | null => {
    if (!url || typeof url !== 'string') return null;
    const cleaned = url.trim();
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
    const match = cleaned.match(regExp);
    return (match && match[1] && match[1].length === 11) ? match[1] : null;
};

export const DEFAULT_LOGIN_FLASHCARDS: LoginFlashcardItem[] = [
    {
        id: 'fc-1',
        title: 'Panduan Praktis Pembuatan Modul Ajar & PROTA Kurikulum Merdeka BSKAP 046',
        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        category: 'Tutorial Guru',
        duration: '12:45',
        createdAt: 1700000000000
    },
    {
        id: 'fc-2',
        title: 'Cara Cepat Generate Capaian Pembelajaran (CP) dan Alur Tujuan Pembelajaran (ATP)',
        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        category: 'Panduan Cepat',
        duration: '08:30',
        createdAt: 1700000001000
    }
];

export const flashcardsDB = localforage.createInstance({ name: 'ProtaApp', storeName: 'flashcards' });
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
    babTopik: string;
    allocation: string;
    date: string;
    pengetahuanAwal: string;
    minatBelajar: string;
    kebutuhanBelajar: string;
    pendekatan: string;
    modelPembelajaran: string;
    metodePembelajaran: string;
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
            SEMESTER 1 (GANJIL) â€¢ JULI - DESEMBER ${academicYearStart}
          </div>
          <table style="width: 100%; border-collapse: separate; border-spacing: 8px; margin-bottom: 15px;">
            ${s1Rows}
          </table>

          <div style="page-break-before: always; margin-top: 15px;"></div>

          <!-- SEMESTER 2 -->
          <div style="background-color: #3730a3; color: #ffffff; padding: 6px 12px; font-size: 10.5pt; font-weight: bold; border-radius: 4px; margin-bottom: 8px;">
            SEMESTER 2 (GENAP) â€¢ JANUARI - JUNI ${academicYearStart + 1}
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
                        â€¢ <b>Klik 1 tanggal</b> atau <b>tahan dan seret (blok) kursor</b> melintasi beberapa tanggal untuk menentukan rentang kegiatan/libur sekaligus.
                    </p>
                    <p className="text-blue-800">
                        â€¢ Klik daftar keterangan di bawah setiap bulan untuk mengubah atau menghapus agenda.
                    </p>
                </div>
            </div>

            {/* SEMESTER 1 */}
            <div>
                <div className="flex items-center justify-between border-b pb-2 mb-4">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-blue-600"/> SEMESTER 1 (Ganjil) â€¢ Juli - Desember {academicYearStart}
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
                        <CalendarDays className="w-5 h-5 text-indigo-600"/> SEMESTER 2 (Genap) â€¢ Januari - Juni {academicYearStart + 1}
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
                            TA {academicYearStart}/{academicYearStart + 1} â€¢ {schoolDaysCount} Hari Sekolah
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

const PENDEKATAN_OPTIONS = [
    "Pembelajaran Mendalam (Deep Learning) â€” Permendikdasmen No. 13 Tahun 2025",
    "Pendekatan Saintifik (5M: Mengamati, Menanya, Mencoba, Menalar, Mengomunikasikan)",
    "Pendekatan Berdiferensiasi (Teaching at the Right Level - TaRL)",
    "Pendekatan Kontekstual & Konstruktivisme (Contextual Teaching & Learning)",
    "Pendekatan Terpadu STEAM (Science, Technology, Engineering, Art, Math)"
];

const MODEL_PRESETS = [
    "Problem Based Learning (PBL)",
    "Project Based Learning (PjBL)",
    "Discovery Learning",
    "Inquiry Learning (Inkuiri Terbimbing)",
    "Contextual Teaching and Learning (CTL)",
    "Cooperative Learning (STAD / Jigsaw)",
    "Teaching at the Right Level (TaRL)"
];

const METODE_TAGS = [
    "Diskusi Kelompok",
    "Tanya Jawab",
    "Demonstrasi Konkret",
    "Penugasan Terbimbing",
    "Unjuk Kerja & Presentasi",
    "Eksperimen / Simulasi",
    "Observasi Objek Nyata",
    "Permainan Edukatif",
    "Refleksi Bermakna"
];

const ModulAjarGenerator = ({ 
    context, 
    userIdentity,
    selectedCharacteristic = 'Beragam (Visual, Auditori, Kinestetik, Konkret-Operasional)',
    onBack, 
    onSave 
}: { 
    context: ModulAjarContext, 
    userIdentity: UserIdentity,
    selectedCharacteristic?: string,
    onBack: () => void, 
    onSave: (log: ActivityLog) => void 
}) => {
    const selectedCount = context.selectedAtpItems?.length || 1;
    const initialBab = `BAB 1: ${context.atpItem.alur.split(/[\n,.]/)[0].trim() || context.subject}`;
    const initialAllocation = selectedCount > 1 
        ? `${selectedCount} Pertemuan Ã— 3 JP (1 JP = 35 menit) = ${selectedCount * 3} JP (${selectedCount * 105} menit)`
        : (context.atpItem.alokasiWaktu || '3 JP (1 Pertemuan Ã— 35 menit = 105 menit)');

    const [formData, setFormData] = useState<ModulAjarData>({
        className: context.className,
        fase: context.fase,
        subject: context.subject,
        topic: context.atpItem.alur,
        babTopik: initialBab,
        allocation: initialAllocation,
        date: context.atpItem.planDate || formatDateLocal(new Date()),
        pengetahuanAwal: "1. Peserta didik telah mengenal konsep dasar dan kosakata awal terkait materi pada fase sebelumnya.\n2. Sebagian peserta didik mampu menyebutkan contoh nyata di lingkungan sekitar.\n3. Sebagian peserta didik masih membutuhkan penguatan pemahaman konsep dan bimbingan.",
        minatBelajar: "1. Sangat tertarik pada media visual konkret, tayangan video edukatif, dan gambar ilustrasi kontekstual.\n2. Antusias dalam kegiatan berpasangan/kelompok, tanya jawab interaktif, dan simulasi.\n3. Gemar mengaitkan materi dengan pengalaman nyata di sekolah maupun rumah.",
        kebutuhanBelajar: "1. Peserta Didik Visual: Memerlukan infografis, kartu bergambar, dan lembar kerja terstruktur.\n2. Peserta Didik Auditori: Memerlukan penjelasan lisan, tanya jawab, dan diskusi terarah.\n3. Peserta Didik Kinestetik: Memerlukan aktivitas unjuk kerja, manipulasi benda, dan gerakan fisik interaktif.\n4. Diferensiasi: Bimbingan perancah (scaffolding) untuk siswa yang butuh pendampingan ekstra.",
        pendekatan: "Pembelajaran Mendalam (Deep Learning) â€” Permendikdasmen No. 13 Tahun 2025",
        modelPembelajaran: "Problem Based Learning (PBL)",
        metodePembelajaran: "Diskusi Kelompok, Tanya Jawab, Demonstrasi Konkret, Penugasan Terbimbing, Unjuk Kerja & Presentasi, Refleksi Bermakna",
        modelMethod: "Problem Based Learning (PBL) (Metode: Diskusi Kelompok, Tanya Jawab, Unjuk Kerja)",
        components: {
            includeLKPD: true,
            includeMaterials: true,
            includeAssessment: true,
            generateImage: false,
        }
    });

    const [loading, setLoading] = useState(false);
    const [aiProfilLoading, setAiProfilLoading] = useState(false);
    const [resultContent, setResultContent] = useState<string | null>(null);
    const [paperSize, setPaperSize] = useState<'A4' | 'Letter' | 'F4'>('A4');
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    
    // AI Recommendation State
    const [recLoading, setRecLoading] = useState(false);
    const [aiRecommendations, setAiRecommendations] = useState<AIModelRecommendation[]>([]);

    const handleAutoGenerateProfile = async () => {
        setAiProfilLoading(true);
        try {
            const apiKey = getApiKey();
            if (!apiKey) throw new Error("API Key Gemini tidak ditemukan. Pastikan Anda telah mengatur VITE_GEMINI_API_KEY di environment variables.");
            const ai = new GoogleGenAI({ apiKey });

            const prompt = `
                Anda adalah Pakar Asesmen Diagnostik Awal & Kurikulum Merdeka Sekolah Dasar (SD/MI).
                Berdasarkan data berikut:
                - Kelas: ${formData.className} (${formData.fase})
                - Mata Pelajaran: ${formData.subject}
                - BAB / Topik: ${formData.babTopik}
                - Alur Tujuan Pembelajaran: ${formData.topic}
                - CP: ${context.cp}

                Buatkan deskripsi realistis, operasional, dan berbasis data kelas SD untuk 3 aspek berikut:
                1. "pengetahuanAwal": 3-4 butir nomor tentang kesiapan dan pemahaman prasyarat murid sebelum mempelajari materi ini.
                2. "minatBelajar": 3 butir nomor tentang ketertarikan, preferensi aktivitas (visual/video/permainan/cerita/kelompok).
                3. "kebutuhanBelajar": 3-4 butir nomor tentang gaya belajar (visual, auditori, kinestetik) dan diferensiasi bimbingan yang dibutuhkan.

                Format respon HANYA JSON:
                {
                  "pengetahuanAwal": "1. ...\\n2. ...\\n3. ...",
                  "minatBelajar": "1. ...\\n2. ...\\n3. ...",
                  "kebutuhanBelajar": "1. ...\\n2. ...\\n3. ...\\n4. ..."
                }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3.7-flash',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });

            let cleanText = (response.text || "{}").replace(/```json/g, '').replace(/```/g, '').trim();
            const res = JSON.parse(cleanText);
            if (res.pengetahuanAwal && res.minatBelajar && res.kebutuhanBelajar) {
                setFormData(prev => ({
                    ...prev,
                    pengetahuanAwal: res.pengetahuanAwal,
                    minatBelajar: res.minatBelajar,
                    kebutuhanBelajar: res.kebutuhanBelajar
                }));
            }
        } catch (e: any) {
            alert("Gagal menganalisis profil: " + formatAIError(e));
        } finally {
            setAiProfilLoading(false);
        }
    };

    const handleToggleMetode = (tag: string) => {
        const currentList = formData.metodePembelajaran.split(',').map(s => s.trim()).filter(Boolean);
        let updated: string[];
        if (currentList.includes(tag)) {
            updated = currentList.filter(s => s !== tag);
        } else {
            updated = [...currentList, tag];
        }
        const str = updated.join(', ');
        setFormData(prev => ({
            ...prev,
            metodePembelajaran: str,
            modelMethod: `${prev.modelPembelajaran} (Metode: ${str})`
        }));
    };

    const handleGetRecommendation = async () => {
        setRecLoading(true);
        setAiRecommendations([]);
        try {
            const apiKey = getApiKey();
            if (!apiKey) throw new Error("API Key Gemini tidak ditemukan. Pastikan Anda telah mengatur VITE_GEMINI_API_KEY di environment variables.");
            const ai = new GoogleGenAI({ apiKey });

            const prompt = `
                Bertindaklah sebagai Konsultan Ahli Kurikulum Merdeka & Pembelajaran Mendalam (Deep Learning) Jenjang Sekolah Dasar (SD/MI) sesuai Permendikdasmen No. 13 Tahun 2025.
                Berikan 3 REKOMENDASI Model Pembelajaran beserta METODE/TEKNIK Pembelajaran yang spesifik, efektif, dan mengintegrasikan 3 Prinsip Pembelajaran Mendalam (Mindful/Berkesadaran, Meaningful/Bermakna, Joyful/Menggembirakan) serta 3 Pengalaman Belajar (Memahami, Mengaplikasi, Merefleksi) yang sangat ramah dan sesuai untuk siswa SD.
                
                KONTEKS:
                - Jenjang: SD/MI
                - Kelas: ${context.className} (${context.fase})
                - Mapel: ${context.subject}
                - BAB / Topik: ${formData.babTopik}
                - Topik/ATP: ${formData.topic}
                - CP: ${context.cp}

                INSTRUKSI:
                1. Analisis kesesuaian materi dengan model Pembelajaran Mendalam ramah anak SD (misalnya: Problem Based Learning, Project Based Learning, Discovery Learning, Inquiry Learning, Contextual Teaching and Learning, Cooperative Learning).
                2. Berikan 3 opsi model berbeda dengan sintaks yang jelas dan operasional untuk guru SD.
                3. Untuk setiap model, tentukan METODE/TEKNIK konkret yang mendukung pengalaman belajar Memahami-Mengaplikasi-Merefleksi (contoh: Diskusi Terarah & Media Gambar Konkret, Eksperimen/Praktik Nyata, Studi Kasus Kontekstual Anak, Simulasi Peran/Permainan Edukatif, Gallery Walk, Presentasi Karya).
                4. Berikan skor kecocokan (0-100) dan alasan pedagogis singkat.

                OUTPUT JSON Format:
                {
                  "recommendations": [
                    {
                      "name": "Nama Model (contoh: Problem Based Learning)",
                      "methods": "Daftar Metode Konkret (contoh: Diskusi Terarah, Observasi Objek Nyata, Demonstrasi, Refleksi Bermakna)",
                      "reason": "Alasan pedagogis mengapa kombinasi model dan metode ini tepat untuk pembelajaran mendalam di SD.",
                      "score": 95
                    }
                  ]
                }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3.7-flash',
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

            const atpItemsList = (context.selectedAtpItems && context.selectedAtpItems.length > 0)
                ? context.selectedAtpItems.map((item, idx) => `Pertemuan ${idx + 1}:
- TP: ${item.tp}
- Alur Tujuan Pembelajaran (ATP): ${item.atpItem.alur}
- Alokasi JP: ${item.atpItem.alokasiWaktu || '3 JP'}
- Tanggal Pelaksanaan: ${item.atpItem.planDate || formData.date}`).join('\n\n')
                : `Pertemuan 1:
- TP: ${context.tp}
- Alur Tujuan Pembelajaran (ATP): ${formData.topic}
- Alokasi JP: ${formData.allocation}
- Tanggal Pelaksanaan: ${formData.date}`;

            const prompt = `
# MASTER PROMPT â€” GENERATOR MODUL AJAR (RPM) RESMI PEMBELAJARAN MENDALAM (DEEP LEARNING)
# KEPATUHAN PENUH: PERMENDIKDASMEN NOMOR 13 TAHUN 2025 & KEPUTUSAN BSKAP NO. 032/H/KR/2024

## MANDAT UTAMA DAN ATURAN KELENGKAPAN WAJIB (ANTI-TERPOTONG):
Anda adalah **Guru Sekolah Dasar (SD/MI) Profesional dan Pakar Kurikulum Nasional**.
Anda WAJIB menghasilkan dokumen Modul Ajar / Rencana Pembelajaran Mendalam (RPM) secara **LENGKAP, UTUH, DAN TUNTAS DARI AWAL SAMPAI AKHIR TANPA TERPOTONG**.
Dokumen yang Anda buat HARUS memuat seluruh rangkaian struktur resmi:
- **I. IDENTIFIKASI MODUL** (A. Identitas Umum, B. Identifikasi Peserta Didik, C. Materi Pembelajaran 4 Dimensi, D. 8 Dimensi Profil Lulusan)
- **II. DESAIN PEMBELAJARAN** (A. Capaian & Tujuan Pembelajaran ABCD, B. Lintas Disiplin Ilmu, C. 4 Kerangka Pembelajaran, D. 3 Prinsip Pembelajaran Mendalam)
- **III. LANGKAH-LANGKAH PEMBELAJARAN (Pertemuan 1 s.d. ${selectedCount})** (Kegiatan Awal 15 mnt, Kegiatan Inti 80 mnt berbasis 3 Pengalaman Belajar 3M & 8 DPL, Kegiatan Akhir 10 mnt)
- **IV. ASESMEN PEMBELAJARAN** (A. Asesmen Diagnostik Awal + Tabel Pengelompokan Kesiapan Belajar, B. Asesmen Formatif 3M & 8 DPL, C. Asesmen Sumatif + Tabel KKTP Interval Nilai)
- **LAMPIRAN MODUL AJAR (LENGKAP 7 LAMPIRAN TANPA MELEWATKAN SATU PUN)**:
  1. Ringkasan Materi / Bahan Ajar Mendalam
  2. Instrumen Soal Asesmen Diagnostik Awal (5 Soal + Kunci & Panduan)
  3. Media Pembelajaran & Panduan Penggunaan
  4. Instrumen Soal Asesmen Formatif per Pertemuan
  5. Rubrik Penilaian Lengkap 4 Skala (Sikap/8 DPL, Pengetahuan, Keterampilan)
  6. Lembar Kerja Peserta Didik (LKPD) Siap Cetak untuk Setiap Pertemuan
  7. Lembar Pengesahan Resmi (Kepala Sekolah & Guru) + Sitasi Regulasi Sah

DILARANG BERHENTI DI TENGAH JALAN (misalnya hanya sampai Lintas Disiplin Ilmu). Tuliskan seluruh tabel dan uraian secara tuntas dan rapi!

## 4 PILAR PEMBELAJARAN MENDALAM (PERMENDIKDASMEN NO. 13 TAHUN 2025):
1. **8 Dimensi Profil Lulusan (8 DPL)**:
   (1) Keimanan dan ketakwaan terhadap Tuhan YME, (2) Kewargaan, (3) Penalaran kritis, (4) Kreativitas, (5) Kolaborasi, (6) Kemandirian, (7) Komunikasi, (8) Kesehatan.
2. **3 Prinsip Pembelajaran**:
   - **Bermakna (Meaningful)**: Terhubung erat dengan kehidupan nyata & konteks peserta didik SD.
   - **Berkesadaran (Mindful)**: Peserta didik menyadari tujuan belajar dan proses berpikirnya.
   - **Menggembirakan (Joyful)**: Suasana belajar antusias, penuh rasa ingin tahu, aman, dan menyenangkan.
3. **3 Pengalaman Belajar (3M)**:
   - **Memahami**: Konseptualisasi, orientasi masalah nyata, dan pemahaman esensial.
   - **Mengaplikasikan**: Penerapan pengetahuan, penyelidikan kontekstual, kerja kelompok kolaboratif.
   - **Merefleksi**: Evaluasi diri, umpan balik konstruktif, penguatan konsep, refleksi metakognitif.
4. **4 Kerangka Pembelajaran**:
   (1) Praktik Pedagogis, (2) Kemitraan Pembelajaran, (3) Lingkungan Pembelajaran Inklusif, (4) Pemanfaatan Teknologi Digital.

## INFORMASI DOKUMEN DARI GURU:
- **Nama Sekolah**: ${userIdentity.institutionName || 'SD Negeri / Swasta'}
- **Nama Guru / Penyusun**: ${userIdentity.authorName}
- **NIP Guru**: ${userIdentity.nip || '[NIP GURU]'}
- **Mata Pelajaran**: ${formData.subject}
- **Kelas / Fase**: ${formData.className} (${formData.fase})
- **Semester / TP**: ${userIdentity.semester || 'Semester 1'} / ${userIdentity.academicYear || '2026/2027'}
- **BAB / Topik**: ${formData.babTopik}
- **Alokasi Waktu**: ${formData.allocation}
- **Tanggal Pelaksanaan**: ${formData.date}
- **Pendekatan**: ${formData.pendekatan}
- **Model Pembelajaran**: ${formData.modelPembelajaran}
- **Metode**: ${formData.metodePembelajaran}
- **Kondisi Murid**: Pengetahuan Awal (${formData.pengetahuanAwal}), Minat Belajar (${formData.minatBelajar}), Kebutuhan/Diferensiasi (${formData.kebutuhanBelajar})

## ELEMEN CP & DAFTAR PERTEMUAN ATP TERPILIH:
- **Elemen CP**: ${context.elementName}
- **Capaian Pembelajaran (CP)**: ${context.cp}
- **Daftar Pertemuan & ATP**:
${atpItemsList}

---

## STRUKTUR LENGKAP DOKUMEN RPM (WAJIB TERTULIS SEMUA DALAM HTML MURNI):

### HEADER DOKUMEN
<div style="text-align: center; margin-bottom: 20px;">
  <h1 style="font-family: 'Yu Gothic UI', Arial, sans-serif; font-size: 16pt; font-weight: bold; color: #1F4E79; margin: 0; text-transform: uppercase;">MODUL AJAR / RENCANA PEMBELAJARAN MENDALAM (RPM)</h1>
  <div style="font-family: 'Yu Gothic UI', Arial, sans-serif; font-size: 11pt; color: #1F4E79; font-weight: 600; margin-top: 4px;">${formData.subject.toUpperCase()} &nbsp;|&nbsp; KELAS ${formData.className} (${formData.fase})</div>
  <div style="font-family: 'Yu Gothic UI', Arial, sans-serif; font-size: 10pt; color: #475569; font-style: italic; margin-top: 2px;">Pedoman Pembelajaran Mendalam (Deep Learning) â€” Permendikdasmen Nomor 13 Tahun 2025</div>
</div>

### I. IDENTIFIKASI MODUL
<h2 style="font-family: 'Yu Gothic UI', Arial, sans-serif; font-size: 12pt; font-weight: bold; color: #1F4E79; margin-top: 18px; margin-bottom: 6px; text-transform: uppercase;">I. IDENTIFIKASI MODUL</h2>

**A. Identitas Umum**
Tabel HTML 2 kolom (Komponen | Keterangan) memuat: Satuan Pendidikan, Penyusun, NIP Guru, Mata Pelajaran, Kelas/Fase, Semester/Tahun Pelajaran, BAB/Topik, Alokasi Waktu, Tanggal Pelaksanaan.

**B. Identifikasi Peserta Didik**
Tabel HTML 2 kolom (Aspek | Deskripsi Nyata):
- Pengetahuan Awal (Kondisi kesiapan awal murid)
- Minat Belajar (Ketertarikan dan preferensi media murid)
- Kebutuhan Belajar & Diferensiasi (Strategi scaffolding dan diferensiasi konten, proses, produk)

**C. Materi Pembelajaran (4 Dimensi Pengetahuan)**
Tabel HTML 2 kolom (Dimensi Materi | Uraian Konkret):
- Faktual: Fakta nyata kontekstual lingkungan peserta didik SD
- Konseptual: Konsep esensial, definisi ilmiah, dan prinsip utama materi
- Prosedural: Langkah-langkah kerja atau investigasi sistematis
- Metakognitif: Strategi pemahaman diri dan penerapan kontekstual dalam keseharian

**D. 8 Dimensi Profil Lulusan (Permendikdasmen No. 13 Tahun 2025)**
Tabel HTML 4 kolom (No | Dimensi Profil Lulusan | Tujuan Capaian Kompetensi & Karakter | Penerapan Konkret dalam Pembelajaran):
Uraikan ke-8 dimensi secara lengkap: 1. Keimanan dan ketakwaan terhadap Tuhan YME, 2. Kewargaan, 3. Penalaran kritis, 4. Kreativitas, 5. Kolaborasi, 6. Kemandirian, 7. Komunikasi, 8. Kesehatan.

### II. DESAIN PEMBELAJARAN
<h2 style="font-family: 'Yu Gothic UI', Arial, sans-serif; font-size: 12pt; font-weight: bold; color: #1F4E79; margin-top: 18px; margin-bottom: 6px; text-transform: uppercase;">II. DESAIN PEMBELAJARAN</h2>

**A. Capaian & Tujuan Pembelajaran (ABCD)**
Tabel HTML 3 kolom (Pertemuan | Kode TP | Tujuan Pembelajaran Operasional mencakup Audience, Behavior, Condition, Degree untuk seluruh pertemuan 1 s.d. ${selectedCount}).

**B. Lintas Disiplin Ilmu**
Tabel HTML 2 kolom (Mata Pelajaran Terkait | Keterkaitan Interdisipliner Konkret).

**C. 4 Kerangka Pembelajaran (Ekosistem Pendukung Pembelajaran)**
Tabel HTML 4 kolom (No | Kerangka Pembelajaran | Fokus Ekosistem Pendukung | Implementasi Konkret di Satuan Pendidikan):
1. Praktik Pedagogis (Pendekatan, Model ${formData.modelPembelajaran} bersintaks, Metode ${formData.metodePembelajaran})
2. Kemitraan Pembelajaran (Kolaborasi Guru-Murid, Antarmurid, Orang Tua, dan Lingkungan)
3. Lingkungan Pembelajaran (Aspek Fisik, Sosial, dan Psikologis/Emosional Inklusif)
4. Pemanfaatan Teknologi Digital (Pemanfaatan media/teknologi digital penguat pembelajaran)

**D. 3 Prinsip Pembelajaran Mendalam (Mindful, Joyful, Meaningful)**
Tabel HTML 4 kolom (No | Prinsip Pembelajaran | Makna Prinsip | Penerapan Nyata dalam Skenario Pembelajaran):
1. Bermakna (Meaningful)
2. Berkesadaran (Mindful)
3. Menggembirakan (Joyful)

### III. LANGKAH-LANGKAH PEMBELAJARAN (PERTEMUAN 1 s.d. ${selectedCount})
<h2 style="font-family: 'Yu Gothic UI', Arial, sans-serif; font-size: 12pt; font-weight: bold; color: #1F4E79; margin-top: 18px; margin-bottom: 6px; text-transform: uppercase;">III. LANGKAH-LANGKAH PEMBELAJARAN</h2>

Tuliskan rincian langkah pembelajaran LENGKAP untuk SETIAP PERTEMUAN (dari Pertemuan 1 sampai ${selectedCount}):
- Banner Pertemuan: <div style="background-color: #1F4E79; color: #FFFFFF; font-weight: bold; padding: 6px 10px; font-size: 11pt; margin-top: 18px;">PERTEMUAN [X] &nbsp;|&nbsp; TP [KODE]: [JUDUL TP]</div>
- Tabel Identitas Pertemuan: Alokasi Waktu (3 JP = 105 menit), Level Kognitif, Tujuan Pembelajaran Pertemuan, Model Pembelajaran & Sintaks.
- Sub-bar: <div style="background-color: #1F4E79; color: #FFFFFF; font-weight: bold; padding: 5px 8px; font-size: 10pt;">KEGIATAN AWAL (15 menit)</div>
  Tabel memuat: Prinsip Deep Learning (Berkesadaran, Bermakna, Menggembirakan) dan Rincian 6 Langkah Kegiatan (Salam & doa [Keimanan], Presensi & kesiapan belajar [Kesehatan], Apersepsi bermakna [Bermakna], Pertanyaan pemantik [Penalaran Kritis], Penyampaian alur tujuan, Ice breaking penyemangat [Menggembirakan]).
- Sub-bar: <div style="background-color: #1F4E79; color: #FFFFFF; font-weight: bold; padding: 5px 8px; font-size: 10pt;">KEGIATAN INTI (80 menit) â€” 3 PENGALAMAN BELAJAR (3M)</div>
  Tabel HTML 4 Kolom: (3 Pengalaman Belajar 3M | Sintaks Model | Rincian Aktivitas Nyata Murid & Guru | Dimensi Profil Lulusan 8 DPL).
  Wajib menguraikan 3 tahapan 3M secara konkret:
  1. **Memahami** (Eksplorasi konsep, orientasi fenomena nyata, penyelidikan fakta dasar) -> DPL: Penalaran Kritis, Komunikasi
  2. **Mengaplikasikan** (Diskusi kelompok kolaboratif, penyelidikan kontekstual, pembuatan karya/LKPD) -> DPL: Kolaborasi, Kreativitas, Kemandirian
  3. **Merefleksi** (Presentasi karya, evaluasi bersama, penguatan konsep guru, refleksi metakognitif) -> DPL: Komunikasi, Penalaran Kritis, Kemandirian
- Sub-bar: <div style="background-color: #1F4E79; color: #FFFFFF; font-weight: bold; padding: 5px 8px; font-size: 10pt;">KEGIATAN AKHIR / PENUTUP (10 menit)</div>
  Tabel memuat: Simpulan bersama, umpan balik apresiatif guru, refleksi diri murid, tindak lanjut dan materi pertemuan berikutnya, doa dan salam penutup.

### IV. ASESMEN PEMBELAJARAN (LENGKAP & SISTEMATIS)
<h2 style="font-family: 'Yu Gothic UI', Arial, sans-serif; font-size: 12pt; font-weight: bold; color: #1F4E79; margin-top: 18px; margin-bottom: 6px; text-transform: uppercase;">IV. ASESMEN PEMBELAJARAN</h2>

**A. Asesmen Awal (Diagnostik)**
- Tabel: Jenis & Teknik Asesmen | Tujuan | Bentuk Instrumen
- Tabel Pengelompokan Kesiapan Belajar & Rencana Scaffolding Diferensiasi:
  (Kelompok: Paham Utuh, Paham Sebagian, Belum Paham | Ciri Kemampuan Awal | Rencana Tindak Lanjut Diferensiasi Guru).

**B. Asesmen Formatif (Proses Pembelajaran)**
- Tabel: Pertemuan | Fokus Penilaian (3M & 8 DPL) | Teknik Asesmen | Bentuk Instrumen & Bukti Belajar (Observasi sikap 8 DPL, kinerja kelompok, lembar formatif).

**C. Asesmen Sumatif (Akhir BAB / Topik)**
- Tabel: Bentuk Asesmen Sumatif | Teknik & Cakupan Materi | Instrumen (Tes Tertulis HOTS Pilihan Ganda & Uraian Kontekstual, Penilaian Kinerja/Produk).
- Tabel Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) berbasis Interval Nilai:
  (0-60%: Belum Tuntas / Remidial Penuh; 61-70%: Belum Tuntas / Remidial Parsial; 71-85%: Tuntas / Penguatan; 86-100%: Tuntas / Pengayaan Mandiri).

### LAMPIRAN MODUL AJAR (LENGKAP 7 LAMPIRAN TANPA TERPOTONG)
<h2 style="font-family: 'Yu Gothic UI', Arial, sans-serif; font-size: 12pt; font-weight: bold; color: #1F4E79; margin-top: 24px; margin-bottom: 8px; text-transform: uppercase;">LAMPIRAN MODUL AJAR (RENCANA PEMBELAJARAN MENDALAM)</h2>

- **LAMPIRAN 1: RINGKASAN MATERI (BAHAN AJAR MENDALAM)**: Uraian bahan ajar kontekstual, sistematis, ramah anak SD, dan kaya konsep faktual-konseptual.
- **LAMPIRAN 2: INSTRUMEN SOAL ASESMEN AWAL (5 SOAL DIAGNOSTIK + KUNCI JAWABAN)**: Tabel 5 butir soal diagnostik nyata + kunci jawaban dan analisis kesiapan.
- **LAMPIRAN 3: MEDIA PEMBELAJARAN & PANDUAN PENGGUNAAN**: Tabel (No | Nama Media | Jenis Digital/Konkret | Panduan Penggunaan dalam Pembelajaran).
- **LAMPIRAN 4: INSTRUMEN SOAL ASESMEN FORMATIF PER PERTEMUAN**: Tabel (Pertemuan | Butir Soal Formatif | Kunci Jawaban & Bobot Skor).
- **LAMPIRAN 5: RUBRIK PENILAIAN LENGKAP 4 SKALA (Sangat Baik [4], Baik [3], Cukup [2], Perlu Bimbingan [1])**:
  * A. Rubrik Sikap (8 Dimensi Profil Lulusan)
  * B. Rubrik Pengetahuan (Pemahaman Konsep)
  * C. Rubrik Keterampilan / Unjuk Kerja
- **LAMPIRAN 6: LEMBAR KERJA PESERTA DIDIK (LKPD) SIAP PAKAI SETIAP PERTEMUAN**:
  Format LKPD siap cetak untuk setiap pertemuan: Header LKPD, Identitas Murid, Tujuan Pembelajaran, Petunjuk Pengerjaan, Aktivitas Penyelidikan / Pertanyaan Interaktif dengan garis pengerjaan (........................................................), dan Kotak Refleksi Diri "âœ¦ REFLEKSIKU".
- **LAMPIRAN 7: LEMBAR PENGESAHAN RESMI & SITASI KURIKULUM**:
  * Sitasi: Permendikdasmen No. 13 Tahun 2025 tentang Pedoman Pembelajaran Mendalam, Keputusan Kepala BSKAP No. 032/H/KR/2024.
  * Lembar Pengesahan:
    <table style="width: 100%; border: none; margin-top: 25px;">
      <tr>
        <td style="width: 50%; border: none; text-align: center; vertical-align: top;">
          Mengetahui,<br>Kepala Sekolah ${userIdentity.institutionName || '[Nama Sekolah]'}<br><br><br><br><br>
          <strong>${userIdentity.kepalaSekolah ? `<u>${userIdentity.kepalaSekolah}</u>` : '( ............................................................ )'}</strong><br>
          NIP. ${userIdentity.nipKepalaSekolah || '.....................................................'}
        </td>
        <td style="width: 50%; border: none; text-align: center; vertical-align: top;">
          ${formData.date}<br>Guru Mata Pelajaran / Kelas<br><br><br><br><br>
          <strong><u>${userIdentity.authorName}</u></strong><br>
          NIP. ${userIdentity.nip || '[NIP GURU]'}
        </td>
      </tr>
    </table>

---

## ATURAN STYLING HTML:
- Warna tema utama: Navy Blue #1F4E79
- Seluruh TABEL HTML berformat: border-collapse: collapse; width: 100%; border: 1px solid #1F4E79; font-size: 10.5pt; margin-bottom: 10px; font-family: 'Yu Gothic UI', Arial, sans-serif;
- Header tabel (th): background-color: #1F4E79; color: #FFFFFF; font-weight: bold; padding: 6px 8px; border: 1px solid #1F4E79; text-align: left;
- Sel tabel (td): padding: 6px 8px; border: 1px solid #94A3B8; vertical-align: top; color: #1E293B; line-height: 1.45;
- Dokumen bebas dari bingkai gambar tepi.
- Output HANYA berupa kode HTML <div> murni tanpa tag markdown code blocks.
`;
const response = await ai.models.generateContent({
                model: 'gemini-3.7-flash',
                contents: prompt,
                config: {
                    maxOutputTokens: 65536,
                    thinkingConfig: {
                        thinkingBudget: 0
                    }
                }
            });
            let cleanHtml = (response.text || "").trim();
            cleanHtml = cleanHtml.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
            if (!cleanHtml) {
                cleanHtml = "<p>Gagal membuat konten modul ajar.</p>";
            }
            setResultContent(cleanHtml);

            let imgData = null;

            onSave({
                id: Date.now().toString(),
                timestamp: new Date(),
                type: 'MODUL_AJAR',
                subject: formData.subject,
                details: `RPM Modul Ajar: ${formData.babTopik} - ${formData.topic.substring(0, 50)}`,
                dataSnapshot: { 
                    ...formData, 
                    semester: userIdentity.semester, 
                    content: cleanHtml, 
                    resultContent: cleanHtml, 
                    generatedImages: imgData ? [imgData] : [] 
                },
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
                color: #1e293b;
              }
              h1 {
                font-family: 'Yu Gothic UI', Arial, sans-serif;
                font-size: 16pt;
                font-weight: bold;
                text-align: center;
                color: #1F4E79;
                margin: 0 0 4pt 0;
                text-transform: uppercase;
              }
              h2 {
                font-family: 'Yu Gothic UI', Arial, sans-serif;
                font-size: 12pt;
                font-weight: bold;
                color: #1F4E79;
                text-transform: uppercase;
                margin-top: 16pt;
                margin-bottom: 6pt;
              }
              h3 {
                font-family: 'Yu Gothic UI', Arial, sans-serif;
                font-size: 11pt;
                font-weight: bold;
                color: #1F4E79;
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
                border: 1px solid #1F4E79;
              }
              td, th {
                border: 1px solid #94A3B8;
                padding: 6pt 8pt;
                vertical-align: top;
              }
              th {
                background-color: #1F4E79;
                font-weight: bold;
                color: #ffffff;
                text-align: left;
                border: 1px solid #1F4E79;
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
                border: 1px solid #94a3b8;
              }
              div.f1 {
                margin-top: 15pt;
                font-size: 9pt;
                text-align: right;
                color: #64748b;
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

        const cleanTopic = formData.babTopik.replace(/[\\/:*?"<>|\r\n]+/g, '_').substring(0, 30);
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
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            Generator Modul Ajar (RPM) 
                            <span className="text-xs bg-indigo-100 text-indigo-800 font-semibold px-2.5 py-0.5 rounded border border-indigo-300">Deep Learning</span>
                        </h1>
                        <p className="text-xs text-gray-500">Permendikdasmen No. 13 Tahun 2025 â€” {formData.subject} ({formData.className})</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={onBack} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">Tutup</button>
                </div>
            </div>

            <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col lg:flex-row flex-1 overflow-hidden">
                    {/* Left Form Panel */}
                    <div className="w-full lg:w-1/3 p-6 border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto max-h-[85vh] bg-slate-50/50 space-y-5">
                        
                        {/* Pedoman Resmi Permendikdasmen No. 13 Tahun 2025 */}
                        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl p-4 text-white shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-mono">
                                    Permendikdasmen No. 13/2025
                                </span>
                                <span className="text-[10px] text-indigo-200 font-medium">Deep Learning SD/MI</span>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-white leading-snug">Standar Rencana Pembelajaran Mendalam (RPM)</h4>
                                <p className="text-[11px] text-indigo-200/90 mt-0.5 leading-relaxed">
                                    Dokumen resmi otomatis mengintegrasikan 4 pilar kurikulum nasional:
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                                <div className="bg-white/10 p-2 rounded-lg border border-white/10">
                                    <span className="font-bold text-amber-300 block">âœ¦ 8 Dimensi Lulusan</span>
                                    <span className="text-slate-200 text-[9.5px]">Iman/Taqwa, Kewargaan, Kritis, Kreatif, Kolaborasi, Mandiri, Komunikasi, Sehat</span>
                                </div>
                                <div className="bg-white/10 p-2 rounded-lg border border-white/10">
                                    <span className="font-bold text-emerald-300 block">âœ¦ 3 Prinsip Belajar</span>
                                    <span className="text-slate-200 text-[9.5px]">Bermakna, Berkesadaran (Mindful), Menggembirakan (Joyful)</span>
                                </div>
                                <div className="bg-white/10 p-2 rounded-lg border border-white/10">
                                    <span className="font-bold text-sky-300 block">âœ¦ 3 Pengalaman (3M)</span>
                                    <span className="text-slate-200 text-[9.5px]">Memahami, Mengaplikasikan, dan Merefleksi</span>
                                </div>
                                <div className="bg-white/10 p-2 rounded-lg border border-white/10">
                                    <span className="font-bold text-purple-300 block">âœ¦ 4 Kerangka Kerja</span>
                                    <span className="text-slate-200 text-[9.5px]">Pedagogis, Kemitraan, Lingkungan Inklusif, Digital</span>
                                </div>
                            </div>
                        </div>

                        {/* Section 1: Informasi Dokumen & ATP */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                                    <BookOpen className="w-4 h-4 text-indigo-600" /> Identitas Modul & ATP
                                </h3>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    {selectedCount} ATP Terpilih
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">BAB / Topik Utama Modul</label>
                                <input 
                                    type="text" 
                                    value={formData.babTopik} 
                                    onChange={(e) => setFormData({...formData, babTopik: e.target.value})} 
                                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                    placeholder="Contoh: BAB 1: Bangga Menjadi Anak Indonesia"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Alokasi Waktu</label>
                                    <input 
                                        type="text" 
                                        value={formData.allocation} 
                                        onChange={(e) => setFormData({...formData, allocation: e.target.value})} 
                                        className="w-full text-xs p-2 border border-gray-300 rounded-lg bg-white"
                                        placeholder="Contoh: 3 Pertemuan Ã— 3 JP = 9 JP"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Pelaksanaan</label>
                                    <input 
                                        type="text" 
                                        value={formData.date} 
                                        onChange={(e) => setFormData({...formData, date: e.target.value})} 
                                        className="w-full text-xs p-2 border border-gray-300 rounded-lg bg-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Rincian ATP yang Dipilih</label>
                                <div className="text-[11px] text-gray-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 max-h-24 overflow-y-auto whitespace-pre-line leading-relaxed">
                                    {formData.topic}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Data Tabel Pendahuluan (Peserta Didik) */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-indigo-600" /> Profil Peserta Didik
                                </h3>
                                <button 
                                    onClick={handleAutoGenerateProfile} 
                                    disabled={aiProfilLoading}
                                    className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                                    title="Analisis otomatis karakteristik siswa SD berdasarkan materi ATP ini"
                                >
                                    {aiProfilLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-amber-600" />}
                                    <span>AI Autofill</span>
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-500">Sesuaikan data awal murid SD untuk tabel identifikasi peserta didik modul ajar:</p>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">1. Pengetahuan Awal (Prasyarat)</label>
                                <textarea 
                                    rows={3} 
                                    value={formData.pengetahuanAwal} 
                                    onChange={(e) => setFormData({...formData, pengetahuanAwal: e.target.value})} 
                                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                    placeholder="Uraikan kesiapan awal murid..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">2. Minat Belajar</label>
                                <textarea 
                                    rows={3} 
                                    value={formData.minatBelajar} 
                                    onChange={(e) => setFormData({...formData, minatBelajar: e.target.value})} 
                                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                    placeholder="Uraikan preferensi minat belajar murid..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">3. Kebutuhan Belajar & Diferensiasi</label>
                                <textarea 
                                    rows={3} 
                                    value={formData.kebutuhanBelajar} 
                                    onChange={(e) => setFormData({...formData, kebutuhanBelajar: e.target.value})} 
                                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                    placeholder="Uraikan gaya belajar visual, auditori, kinestetik..."
                                />
                            </div>
                        </div>

                        {/* Section 3: Pendekatan, Model, & Metode Pembelajaran */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                                    <Target className="w-4 h-4 text-indigo-600" /> Praktik Pedagogis
                                </h3>
                                <button 
                                    onClick={handleGetRecommendation} 
                                    disabled={recLoading} 
                                    className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 flex items-center gap-1 transition-colors disabled:opacity-50 text-[10px] font-bold"
                                >
                                    {recLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                                    <span>Tanya AI Model</span>
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Model Pendekatan Pembelajaran</label>
                                <select 
                                    value={formData.pendekatan} 
                                    onChange={(e) => setFormData({...formData, pendekatan: e.target.value})} 
                                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    {PENDEKATAN_OPTIONS.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Model Pembelajaran</label>
                                <div className="space-y-1.5">
                                    <select 
                                        value={MODEL_PRESETS.includes(formData.modelPembelajaran) ? formData.modelPembelajaran : 'custom'} 
                                        onChange={(e) => {
                                            if (e.target.value !== 'custom') {
                                                setFormData(prev => ({
                                                    ...prev, 
                                                    modelPembelajaran: e.target.value,
                                                    modelMethod: `${e.target.value} (Metode: ${prev.metodePembelajaran})`
                                                }));
                                            }
                                        }} 
                                        className="w-full text-xs p-2 border border-gray-300 rounded-lg bg-white"
                                    >
                                        {MODEL_PRESETS.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                        <option value="custom">Ketik Model Lainnya...</option>
                                    </select>
                                    <input 
                                        type="text" 
                                        value={formData.modelPembelajaran} 
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev, 
                                            modelPembelajaran: e.target.value,
                                            modelMethod: `${e.target.value} (Metode: ${prev.metodePembelajaran})`
                                        }))} 
                                        placeholder="Nama Model Pembelajaran"
                                        className="w-full text-xs p-2 border border-gray-300 rounded-lg bg-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Metode Pembelajaran</label>
                                <input 
                                    type="text" 
                                    value={formData.metodePembelajaran} 
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev, 
                                        metodePembelajaran: e.target.value,
                                        modelMethod: `${prev.modelPembelajaran} (Metode: ${e.target.value})`
                                    }))} 
                                    placeholder="Contoh: Diskusi, Tanya Jawab, Unjuk Kerja..."
                                    className="w-full text-xs p-2 border border-gray-300 rounded-lg bg-white mb-2"
                                />
                                <div className="flex flex-wrap gap-1.5">
                                    {METODE_TAGS.map(tag => {
                                        const isSelected = formData.metodePembelajaran.includes(tag);
                                        return (
                                            <button 
                                                key={tag} 
                                                type="button" 
                                                onClick={() => handleToggleMetode(tag)}
                                                className={`text-[10px] px-2 py-1 rounded-md font-medium border transition-colors ${
                                                    isSelected 
                                                        ? 'bg-indigo-600 text-white border-indigo-700 font-semibold' 
                                                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                                                }`}
                                            >
                                                {isSelected ? 'âœ“ ' : '+ '}{tag}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* AI Recommendations List */}
                            {aiRecommendations.length > 0 && (
                                <div className="space-y-2 mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-amber-500" /> Rekomendasi Model AI
                                    </p>
                                    {aiRecommendations.map((rec, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => {
                                                setFormData(prev => ({
                                                    ...prev, 
                                                    modelPembelajaran: rec.name,
                                                    metodePembelajaran: rec.methods,
                                                    modelMethod: `${rec.name} (Metode: ${rec.methods})`
                                                }));
                                            }} 
                                            className={`p-3 border rounded-lg cursor-pointer transition-all group ${
                                                formData.modelPembelajaran === rec.name 
                                                    ? 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-400' 
                                                    : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-xs text-indigo-900 group-hover:text-indigo-700">{rec.name}</h4>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${rec.score >= 90 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {rec.score}% Match
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-800 font-medium mb-1"><span className="text-gray-500 font-normal">Metode:</span> {rec.methods}</p>
                                            <p className="text-[10px] text-gray-600 leading-snug">{rec.reason}</p>
                                            {formData.modelPembelajaran === rec.name && (
                                                <div className="mt-1.5 text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                                                    <Check className="w-3 h-3" /> Model Terpilih
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Process Button */}
                        <button 
                            onClick={handleGenerateModul} 
                            disabled={loading || !userIdentity.authorName} 
                            className="w-full py-3.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            {loading ? 'Sedang Menyusun Dokumen RPM Lengkap...' : 'Proses Buat Modul Ajar (RPM)'}
                        </button>
                    </div>

                    {/* Right Preview Panel */}
                    <div className="w-full lg:w-2/3 p-6 bg-slate-100/70 overflow-y-auto max-h-[85vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm sticky top-0 z-10">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-700" /> Preview Dokumen RPM
                            </h3>
                            <div className="flex items-center gap-2">
                                <select 
                                    value={paperSize} 
                                    onChange={(e) => setPaperSize(e.target.value as any)} 
                                    className="text-sm border border-gray-300 rounded p-1 bg-white"
                                >
                                    <option value="A4">A4</option>
                                    <option value="Letter">Letter</option>
                                    <option value="F4">F4</option>
                                </select>
                                <button 
                                    onClick={handleDownloadDoc} 
                                    disabled={!resultContent} 
                                    className="flex items-center gap-2 px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                                >
                                    <Download className="w-4 h-4" /> Unduh Dokumen (.doc)
                                </button>
                            </div>
                        </div>

                        <div className="border border-slate-300 rounded-xl shadow-sm bg-white p-8 sm:p-12 min-h-[600px] max-w-4xl mx-auto font-['Yu_Gothic_UI',Arial,sans-serif] text-[11pt] leading-[1.45] text-slate-800 [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_td]:border [&_td]:border-slate-300 [&_td]:p-2.5 [&_th]:border [&_th]:border-[#1F4E79] [&_th]:bg-[#1F4E79] [&_th]:p-2.5 [&_th]:font-bold [&_th]:text-white [&_h1]:text-center [&_h1]:font-bold [&_h1]:text-[16pt] [&_h1]:text-[#1F4E79] [&_h2]:text-[12pt] [&_h2]:font-bold [&_h2]:text-[#1F4E79] [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-[11pt] [&_h3]:font-bold [&_h3]:text-[#1F4E79] [&_h3]:mt-3 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">
                            {resultContent ? (
                                <div>
                                    <div dangerouslySetInnerHTML={{__html: resultContent}} />
                                    {generatedImageUrl && (
                                        <div className="mt-6 text-center">
                                            <h4 className="font-bold text-sm mb-2 text-left text-indigo-900 border-b border-indigo-700 pb-1">LAMPIRAN VISUAL LKPD</h4>
                                            <img src={generatedImageUrl} alt="Generated" className="max-w-md mx-auto rounded shadow-sm border border-gray-300 my-4" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[500px] text-gray-400">
                                    <FilePlus className="w-16 h-16 mb-4 opacity-20 text-indigo-700" />
                                    <p className="font-medium text-slate-600 text-base">Dokumen Modul Ajar (RPM) Siap Disusun.</p>
                                    <p className="text-xs text-slate-400 mt-1.5 max-w-md text-center">
                                        Periksa identitas modul, sesuaikan data profil murid, pendekatan, dan model/metode pembelajaran di panel kiri, lalu klik <strong>"Proses Buat Modul Ajar (RPM)"</strong>.
                                    </p>
                                </div>
                            )}
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

  // --- Flashcard Links & Titles State ---
  const [flashcards, setFlashcards] = useState<LoginFlashcardItem[]>(() => {
    try {
      const saved = localStorage.getItem('prota_login_flashcards');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_LOGIN_FLASHCARDS;
  });
  const [fcTitle, setFcTitle] = useState('');
  const [fcLink, setFcLink] = useState('');
  const [fcCategory, setFcCategory] = useState('Tutorial Guru');
  const [fcDuration, setFcDuration] = useState('');
  const [editingFcId, setEditingFcId] = useState<string | null>(null);
  const [fcNotification, setFcNotification] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);
  const [isSavingFc, setIsSavingFc] = useState(false);

  const notifyFc = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setFcNotification({ message, type });
    setTimeout(() => setFcNotification(null), 3500);
  };

  // Fetch flashcards from Firestore cloud config
  const fetchCloudFlashcards = async () => {
    try {
      const docSnap = await getDoc(doc(db, 'app_config', 'login_flashcards'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          setFlashcards(data.items);
          localStorage.setItem('prota_login_flashcards', JSON.stringify(data.items));
        }
      }
    } catch (e) {
      console.warn('Could not fetch cloud flashcards, using local cache:', e);
    }
  };

  useEffect(() => {
    fetchCloudFlashcards();
  }, []);

  const handleAddOrUpdateFlashcard = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fcTitle.trim()) {
      notifyFc('Judul flashcard/video tidak boleh kosong.', 'warning');
      return;
    }
    if (!fcLink.trim()) {
      notifyFc('Link/tautan URL tidak boleh kosong.', 'warning');
      return;
    }

    if (editingFcId) {
      // Update existing item
      const updated = flashcards.map(item => {
        if (item.id === editingFcId) {
          return {
            ...item,
            title: fcTitle.trim(),
            link: fcLink.trim(),
            category: fcCategory.trim() || 'Tutorial Guru',
            duration: fcDuration.trim() || (extractYoutubeVideoId(fcLink.trim()) ? 'YouTube' : 'Tautan')
          };
        }
        return item;
      });
      setFlashcards(updated);
      setEditingFcId(null);
      setFcTitle('');
      setFcLink('');
      setFcCategory('Tutorial Guru');
      setFcDuration('');
      notifyFc('Flashcard berhasil diperbarui di tabel! Klik "Simpan ke Server" untuk menyimpannya.', 'info');
    } else {
      // Add new item
      const newItem: LoginFlashcardItem = {
        id: 'fc-' + Date.now(),
        title: fcTitle.trim(),
        link: fcLink.trim(),
        category: fcCategory.trim() || 'Tutorial Guru',
        duration: fcDuration.trim() || (extractYoutubeVideoId(fcLink.trim()) ? 'YouTube' : 'Tautan'),
        createdAt: Date.now()
      };
      setFlashcards([newItem, ...flashcards]);
      setFcTitle('');
      setFcLink('');
      setFcCategory('Tutorial Guru');
      setFcDuration('');
      notifyFc('Flashcard baru berhasil ditambahkan ke tabel! Klik "Simpan ke Server" untuk menampilkannya di login.', 'info');
    }
  };

  const handleEditFlashcard = (item: LoginFlashcardItem) => {
    setEditingFcId(item.id);
    setFcTitle(item.title);
    setFcLink(item.link);
    setFcCategory(item.category || 'Tutorial Guru');
    setFcDuration(item.duration || '');
    const formEl = document.getElementById('flashcard-form-section');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEditFc = () => {
    setEditingFcId(null);
    setFcTitle('');
    setFcLink('');
    setFcCategory('Tutorial Guru');
    setFcDuration('');
  };

  const handleDeleteFlashcard = (id: string) => {
    if (confirm('Hapus item flashcard ini?')) {
      const updated = flashcards.filter(f => f.id !== id);
      setFlashcards(updated);
      if (editingFcId === id) {
        handleCancelEditFc();
      }
      notifyFc('Flashcard berhasil dihapus dari tabel.', 'info');
    }
  };

  const handleSaveFlashcardsToCloud = async () => {
    setIsSavingFc(true);
    try {
      localStorage.setItem('prota_login_flashcards', JSON.stringify(flashcards));
      await setDoc(doc(db, 'app_config', 'login_flashcards'), {
        items: flashcards,
        updatedAt: Date.now()
      });
      notifyFc(`Sukses! ${flashcards.length} Flashcard & Video tersimpan ke server dan siap muncul di halaman login.`, 'success');
    } catch (e: any) {
      console.error('Error saving flashcards to Firestore:', e);
      localStorage.setItem('prota_login_flashcards', JSON.stringify(flashcards));
      notifyFc('Tersimpan di cache lokal browser (' + (e?.message || 'Offline') + ')', 'warning');
    } finally {
      setIsSavingFc(false);
    }
  };

  const handleResetDefaultFlashcards = () => {
    if (confirm('Kembalikan flashcard ke data panduan bawaan sistem?')) {
      setFlashcards(DEFAULT_LOGIN_FLASHCARDS);
      handleCancelEditFc();
      notifyFc('Flashcard dikembalikan ke data awal.', 'info');
    }
  };

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
                            {showPasswordMap[u.email] ? u.password : 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢'}
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

        {/* Flashcard & Video YouTube Manager Card */}
        <div id="flashcard-form-section" className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-6 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <Youtube className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    Kelola Flashcard & Video YouTube (Halaman Login)
                  </h3>
                  <span className="px-2.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                    Thumbnail Otomatis
                  </span>
                </div>
                <p className="text-slate-500 text-xs mt-0.5">
                  Tabel input judul & tautan video/link. Saat disimpan, akan tampil sebagai flashcard thumbnail YouTube animatif & modern di halaman login.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleResetDefaultFlashcards}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Default
              </button>
              <button
                type="button"
                onClick={handleSaveFlashcardsToCloud}
                disabled={isSavingFc}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md shadow-red-600/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSavingFc ? 'Menyimpan...' : 'Simpan ke Server'}
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {fcNotification && (
            <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
              fcNotification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
              fcNotification.type === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-200' :
              'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              {fcNotification.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{fcNotification.message}</span>
            </div>
          )}

          {/* Input Form Section */}
          <form onSubmit={handleAddOrUpdateFlashcard} className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                {editingFcId ? <Edit className="w-4 h-4 text-blue-600" /> : <Plus className="w-4 h-4 text-red-600" />}
                {editingFcId ? 'Edit Judul / Link Flashcard' : 'Input Judul & Link Baru'}
              </span>
              {editingFcId && (
                <span className="text-[11px] bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-bold">
                  Sedang Mengedit Baris
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
              <div className="md:col-span-5 space-y-1">
                <label className="font-bold text-slate-700">Judul Flashcard / Video <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Contoh: Tutorial Penyusunan Modul Ajar BSKAP 046"
                  value={fcTitle}
                  onChange={e => setFcTitle(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-red-500 text-xs"
                />
              </div>

              <div className="md:col-span-4 space-y-1">
                <label className="font-bold text-slate-700">Link URL / Video YouTube <span className="text-red-500">*</span></label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... atau link web"
                  value={fcLink}
                  onChange={e => setFcLink(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="font-bold text-slate-700">Kategori / Label</label>
                <select
                  value={fcCategory}
                  onChange={e => setFcCategory(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-xs outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                >
                  <option value="Tutorial Guru">Tutorial Guru</option>
                  <option value="Panduan Praktis">Panduan Praktis</option>
                  <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
                  <option value="Tips & Trik">Tips & Trik</option>
                  <option value="Informasi Resmi">Informasi Resmi</option>
                </select>
              </div>
            </div>

            {/* Live YouTube Thumbnail Detection Bar */}
            {fcLink && extractYoutubeVideoId(fcLink) && (
              <div className="flex items-center gap-3 p-3 bg-red-50/80 border border-red-200/80 rounded-xl">
                <img
                  src={`https://img.youtube.com/vi/${extractYoutubeVideoId(fcLink)}/hqdefault.jpg`}
                  alt="Preview thumbnail"
                  className="w-20 h-12 object-cover rounded-lg shadow-xs border border-red-300"
                />
                <div className="text-xs">
                  <p className="font-bold text-red-900 flex items-center gap-1.5">
                    <Youtube className="w-4 h-4 text-red-600" />
                    <span>ID YouTube Terverifikasi:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-red-200 text-red-700">{extractYoutubeVideoId(fcLink)}</span>
                  </p>
                  <p className="text-slate-500 text-[11px] mt-0.5">Thumbnail YouTube di atas akan otomatis menjadi gambar flashcard di halaman login.</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              {editingFcId && (
                <button
                  type="button"
                  onClick={handleCancelEditFc}
                  className="px-4 py-2 border border-slate-300 hover:bg-white rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Batal Edit
                </button>
              )}
              <button
                type="submit"
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md shadow-red-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {editingFcId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{editingFcId ? 'Simpan Perubahan Baris' : 'Tambahkan ke Tabel'}</span>
              </button>
            </div>
          </form>

          {/* Table List of Flashcards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Table className="w-4 h-4 text-slate-500" />
                <span>Tabel Judul & Link Flashcard ({flashcards.length} Item)</span>
              </h4>
              <span className="text-xs text-slate-500 font-medium">
                Kelola item: Edit atau Hapus baris di bawah ini
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#0f172a] text-white font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3 text-center w-12">NO</th>
                    <th className="py-3 px-3 w-28 text-center">THUMBNAIL</th>
                    <th className="py-3 px-4 min-w-[200px]">JUDUL FLASHCARD</th>
                    <th className="py-3 px-4 min-w-[240px]">LINK / TAUTAN</th>
                    <th className="py-3 px-3 text-center min-w-[120px]">KATEGORI</th>
                    <th className="py-3 px-3 text-center min-w-[110px]">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {flashcards.map((item, idx) => {
                    const videoId = extractYoutubeVideoId(item.link);
                    const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
                    const isEditingThis = editingFcId === item.id;

                    return (
                      <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${isEditingThis ? 'bg-blue-50/60' : ''}`}>
                        <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 text-center">
                          <div className="w-20 aspect-video rounded-lg overflow-hidden bg-slate-900 mx-auto relative border border-slate-200 shadow-2xs group">
                            {thumbUrl ? (
                              <img src={thumbUrl} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400">
                                <Play className="w-4 h-4" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-4 h-4 text-white fill-white" />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 leading-snug">{item.title}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-blue-600">
                            <span className="truncate max-w-[220px]" title={item.link}>{item.link}</span>
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-blue-100 rounded text-blue-700 transition-colors"
                              title="Buka tautan di tab baru"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full font-bold text-[10px]">
                            {item.category || 'Tutorial Guru'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEditFlashcard(item)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-lg transition-colors cursor-pointer"
                              title="Edit Judul & Link"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFlashcard(item.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Flashcard"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {flashcards.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Belum ada data judul dan link flashcard. Silakan tambahkan pada form di atas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
    authorCity?: string;
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
    nipd?: string;
    name: string;
    gender: 'L' | 'P';
    birthPlace?: string;
    birthDate?: string;
    nik?: string;
    religion?: string;
    address?: string;
    photo?: string;
    notes?: string;
}

interface JournalRecord {
    id: string;
    date: string;
    dayName?: string;
    formattedDate?: string;
    timeSlot?: string;
    subject: string;
    topic?: string;
    activity?: string;
    notes: string;
    isHeb?: boolean;
    nonHebReason?: string;
    element?: string;
    atpTopic?: string;
    learningModel?: string;
    atpAchievement?: string;
    attendanceSummary?: {
        h: number;
        s: number;
        i: number;
        a: number;
        total: number;
    };
    jpCount?: number;
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
                            <span>{identity.academicYear || '2026-2027'} â€¢ {identity.semester || 'Ganjil (Semester 1)'}</span>
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
    setSelectedClass?: (c: string) => void;
    identity: UserIdentity;
}> = ({ selectedClass: initialClass, setSelectedClass, identity }) => {
    const classList = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
    const [activeClass, setActiveClass] = useState<string>(initialClass || 'Kelas 1');

    useEffect(() => {
        if (initialClass && initialClass !== activeClass) {
            setActiveClass(initialClass);
        }
    }, [initialClass]);

    const handleSelectClass = (cls: string) => {
        setActiveClass(cls);
        if (setSelectedClass) {
            setSelectedClass(cls);
        }
    };

    // Default sample students for Kelas 1 to match official display
    const getDefaultStudents = (cls: string): StudentRecord[] => {
        if (cls === 'Kelas 1') {
            return [
                { id: '1', name: 'Adittia', nipd: '262701001', nis: '262701001', gender: 'L', nisn: '', birthPlace: 'Bandung', birthDate: '2019-09-15', nik: '3204311509190001', religion: 'Islam', address: 'Kp Sukatinggal Rt 003 Rw 006' },
                { id: '2', name: 'Alfath Fatir Abdurahman', nipd: '262701002', nis: '262701002', gender: 'L', nisn: '', birthPlace: 'Bandung', birthDate: '2019-11-02', nik: '3204310211190002', religion: 'Islam', address: 'Kp Sukatinggal Rt 003 Rw 006' },
                { id: '3', name: 'Algifari Ramdan', nipd: '262701003', nis: '262701003', gender: 'L', nisn: '', birthPlace: 'Bandung', birthDate: '2020-05-05', nik: '3204310505200001', religion: 'Islam', address: 'Kp Sukatinggal Rt 002 Rw 006' },
                { id: '4', name: 'Alvino Febriansyah', nipd: '262701004', nis: '262701004', gender: 'L', nisn: '', birthPlace: 'Bandung', birthDate: '2020-02-08', nik: '3204310802200002', religion: 'Islam', address: 'Kp Sukatinggal Rt 001 Rw 006' },
                { id: '5', name: 'Fauzan Nizam', nipd: '262701005', nis: '262701005', gender: 'L', nisn: '3191707564', birthPlace: 'Kabupaten Cianjur', birthDate: '2019-07-27', nik: '3203232707190003', religion: 'Islam', address: 'Kp Sukatinggal' },
                { id: '6', name: 'Nur Rizki Firdaus', nipd: '262701006', nis: '262701006', gender: 'L', nisn: '', birthPlace: 'Bandung', birthDate: '2020-03-24', nik: '3204312403200001', religion: 'Islam', address: 'Kp Sukatinggal Rt 001 Rw 006' },
                { id: '7', name: 'Muhammad Kaysa Nadeem Saputra', nipd: '262701007', nis: '262701007', gender: 'L', nisn: '', birthPlace: 'Bandung', birthDate: '', nik: '', religion: 'Islam', address: 'Kp Sukatinggal' }
            ];
        }
        return [];
    };

    const storageKey = `prota_students_${activeClass}`;
    const [students, setStudents] = useState<StudentRecord[]>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch(e) {}
        return getDefaultStudents(activeClass);
    });

    // Reload students when active class changes
    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setStudents(parsed);
                    return;
                }
            }
        } catch(e) {}
        setStudents(getDefaultStudents(activeClass));
    }, [activeClass]);

    // Rombel configuration state
    const rombelStorageKey = `prota_rombel_settings_${activeClass}`;
    const [rombelCount, setRombelCount] = useState<number>(() => {
        try {
            const saved = localStorage.getItem(`${rombelStorageKey}_count`);
            if (saved) return parseInt(saved, 10) || 1;
        } catch(e) {}
        return 1;
    });

    const [rombelLabels, setRombelLabels] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem(`${rombelStorageKey}_labels`);
            if (saved) return JSON.parse(saved);
        } catch(e) {}
        return [`${activeClass}A`, `${activeClass}B`, `${activeClass}C`, `${activeClass}D`];
    });

    useEffect(() => {
        try {
            const savedCount = localStorage.getItem(`${rombelStorageKey}_count`);
            const savedLabels = localStorage.getItem(`${rombelStorageKey}_labels`);
            setRombelCount(savedCount ? parseInt(savedCount, 10) || 1 : 1);
            setRombelLabels(savedLabels ? JSON.parse(savedLabels) : [`${activeClass}A`, `${activeClass}B`, `${activeClass}C`, `${activeClass}D`]);
        } catch(e) {}
    }, [activeClass]);

    const handleRombelCountChange = (count: number) => {
        setRombelCount(count);
        localStorage.setItem(`${rombelStorageKey}_count`, count.toString());
    };

    const handleRombelLabelChange = (index: number, val: string) => {
        const next = [...rombelLabels];
        next[index] = val;
        setRombelLabels(next);
        localStorage.setItem(`${rombelStorageKey}_labels`, JSON.stringify(next));
    };

    // Notification toast state
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastType, setToastType] = useState<'success' | 'info' | 'warning'>('success');
    const notify = (msg: string, type: 'success' | 'info' | 'warning' = 'success') => {
        setToastMessage(msg);
        setToastType(type);
    };
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    // Modal state for Excel Paste
    const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
    const [pasteText, setPasteText] = useState<string>('');

    // Update single field of a student
    const updateStudentField = (id: string, field: keyof StudentRecord, value: any) => {
        setStudents(prev => prev.map(s => {
            if (s.id === id) {
                return { ...s, [field]: value, nis: field === 'nipd' ? value : s.nis };
            }
            return s;
        }));
    };

    // Delete single student
    const handleDeleteRow = (id: string) => {
        setStudents(prev => prev.filter(s => s.id !== id));
    };

    // Add empty rows
    const handleAddRows = (count: number = 1) => {
        const newRows: StudentRecord[] = [];
        const baseIndex = students.length;
        for (let i = 0; i < count; i++) {
            newRows.push({
                id: (Date.now() + i).toString(),
                name: '',
                nipd: '',
                nis: '',
                gender: 'L',
                nisn: '',
                birthPlace: '',
                birthDate: '',
                nik: '',
                religion: 'Islam',
                address: '',
                photo: '',
                notes: 'Aktif'
            });
        }
        setStudents(prev => [...prev, ...newRows]);
    };

    // Save Data
    const handleSaveData = () => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(students));
            notify(`Data siswa ${activeClass} (${students.length} baris) berhasil disimpan!`, 'success');
        } catch(e) {
            notify('Gagal menyimpan data siswa ke penyimpanan lokal.', 'warning');
        }
    };

    // Clear Data
    const handleClearData = () => {
        if (students.length === 0) {
            notify('Tabel data siswa sudah kosong.', 'info');
            return;
        }
        if (confirm(`Apakah Anda yakin ingin mengosongkan seluruh data siswa untuk ${activeClass}?`)) {
            setStudents([]);
            localStorage.removeItem(storageKey);
            notify(`Data siswa ${activeClass} berhasil dikosongkan.`, 'info');
        }
    };

    // Handle Image Upload for Student Photo (3x4)
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activePhotoStudentId, setActivePhotoStudentId] = useState<string | null>(null);
    const [previewPhotoModal, setPreviewPhotoModal] = useState<{ name: string; photo: string } | null>(null);

    const handleTriggerPhotoUpload = (studentId: string) => {
        setActivePhotoStudentId(studentId);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activePhotoStudentId) return;

        if (file.size > 2 * 1024 * 1024) {
            notify('Ukuran file foto maksimal 2 MB.', 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            if (base64) {
                updateStudentField(activePhotoStudentId, 'photo', base64);
                notify('Foto 3x4 siswa berhasil diunggah.', 'success');
            }
        };
        reader.readAsDataURL(file);
    };

    // Smart Paste Parser for Excel / Sheets / Dapodik Table
    const handleProcessPasteData = () => {
        if (!pasteText.trim()) {
            notify('Silakan tempelkan (paste) data teks dari Excel terlebih dahulu.', 'warning');
            return;
        }

        try {
            const lines = pasteText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
            if (lines.length === 0) {
                notify('Data yang ditempel kosong.', 'warning');
                return;
            }

            const parsedStudents: StudentRecord[] = [];

            lines.forEach((line, lineIdx) => {
                // Split by Tab (Excel default) or semicolon/comma/pipe if no tab
                let cols = line.split('\t').map(c => c.trim());
                if (cols.length === 1 && line.includes(';')) {
                    cols = line.split(';').map(c => c.trim());
                } else if (cols.length === 1 && line.includes(',')) {
                    cols = line.split(',').map(c => c.trim());
                } else if (cols.length === 1 && line.includes('|')) {
                    cols = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
                }

                // Check if this is a header row (skip if line 0 contains keywords like nama, nipd, nisn, etc.)
                const joinedLower = cols.join(' ').toLowerCase();
                if (lineIdx === 0 && (
                    joinedLower.includes('nama') || 
                    joinedLower.includes('nipd') || 
                    joinedLower.includes('nisn') || 
                    joinedLower.includes('tempat lahir') || 
                    joinedLower.includes('nik')
                )) {
                    return; // skip header line
                }

                if (cols.length === 0) return;

                // Detect if first column is row number (e.g. 1, 2, 3...)
                let startIdx = 0;
                if (/^\d{1,3}$/.test(cols[0]) && cols.length > 1 && !/^\d{1,3}$/.test(cols[1])) {
                    startIdx = 1;
                }

                const name = cols[startIdx] || '';
                if (!name) return; // ignore rows without name

                const nipd = cols[startIdx + 1] || '';
                
                // Gender detection
                let rawGender = (cols[startIdx + 2] || '').toUpperCase();
                let gender: 'L' | 'P' = 'L';
                if (rawGender.startsWith('P') || rawGender.includes('PEREMPUAN') || rawGender.includes('FEMALE')) {
                    gender = 'P';
                }

                const nisn = cols[startIdx + 3] || '';
                const birthPlace = cols[startIdx + 4] || '';
                const birthDate = cols[startIdx + 5] || '';
                const nik = cols[startIdx + 6] || '';
                let religion = cols[startIdx + 7] || 'Islam';
                if (!religion) religion = 'Islam';
                const address = cols[startIdx + 8] || '';

                parsedStudents.push({
                    id: (Date.now() + Math.random() * 10000 + lineIdx).toFixed(0),
                    name,
                    nipd,
                    nis: nipd,
                    gender,
                    nisn,
                    birthPlace,
                    birthDate,
                    nik,
                    religion,
                    address,
                    photo: '',
                    notes: 'Aktif'
                });
            });

            if (parsedStudents.length === 0) {
                notify('Tidak dapat membaca data siswa dari teks yang ditempel. Pastikan susunan kolom sesuai panduan.', 'warning');
                return;
            }

            // Replace or append
            setStudents(parsedStudents);
            localStorage.setItem(storageKey, JSON.stringify(parsedStudents));
            setShowPasteModal(false);
            setPasteText('');
            notify(`Berhasil memasukkan ${parsedStudents.length} data siswa dari Excel ke ${activeClass}!`, 'success');
        } catch(e: any) {
            notify(`Gagal memproses data paste: ${e.message}`, 'warning');
        }
    };

    // Download official Word document
    const handleDownloadDoc = () => {
        if (students.length === 0) {
            notify('Belum ada data siswa untuk diunduh.', 'warning');
            return;
        }

        const rombelLabel = rombelLabels[0] || activeClass;
        const rowsHtml = students.map((s, idx) => `
            <tr>
                <td style="border: 1px solid #000; padding: 6px 4px; text-align: center; font-size: 9pt;">${idx + 1}</td>
                <td style="border: 1px solid #000; padding: 6px 6px; font-weight: bold; font-size: 9pt;">${s.name || '-'}</td>
                <td style="border: 1px solid #000; padding: 6px 4px; text-align: center; font-size: 9pt;">${s.nipd || s.nis || '-'}</td>
                <td style="border: 1px solid #000; padding: 6px 4px; text-align: center; font-size: 9pt;">${s.gender || 'L'}</td>
                <td style="border: 1px solid #000; padding: 6px 4px; text-align: center; font-size: 9pt;">${s.nisn || '-'}</td>
                <td style="border: 1px solid #000; padding: 6px 6px; font-size: 9pt;">${s.birthPlace || '-'}</td>
                <td style="border: 1px solid #000; padding: 6px 4px; text-align: center; font-size: 9pt;">${s.birthDate || '-'}</td>
                <td style="border: 1px solid #000; padding: 6px 4px; text-align: center; font-size: 9pt;">${s.nik || '-'}</td>
                <td style="border: 1px solid #000; padding: 6px 4px; text-align: center; font-size: 9pt;">${s.religion || 'Islam'}</td>
                <td style="border: 1px solid #000; padding: 6px 6px; font-size: 9pt;">${s.address || '-'}</td>
            </tr>
        `).join('');

        const html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>Daftar Siswa - ${rombelLabel}</title>
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
                    @page { size: 330mm 215mm; margin: 1.5cm 1.5cm 1.5cm 1.5cm; mso-page-orientation: landscape; }
                    @page Section1 { size: 330mm 215mm; margin: 1.5cm 1.5cm 1.5cm 1.5cm; mso-header-margin: 36.0pt; mso-footer-margin: 36.0pt; mso-paper-source: 0; }
                    div.Section1 { page: Section1; }
                    body { font-family: 'Arial', sans-serif; font-size: 10pt; color: #000; }
                    table { border-collapse: collapse; width: 100%; margin-top: 12px; }
                    th { border: 1px solid #000; background: #0f172a; color: #ffffff; padding: 8px 4px; text-align: center; font-size: 9pt; font-weight: bold; }
                    .header-box { text-align: center; margin-bottom: 12px; }
                    .header-title { font-size: 13pt; font-weight: bold; margin: 0; text-transform: uppercase; }
                    .header-sub { font-size: 11pt; font-weight: bold; margin: 2px 0 0 0; }
                    .header-meta { font-size: 9.5pt; margin-top: 4px; }
                </style>
            </head>
            <body>
                <div class="Section1">
                    <div class="header-box">
                        <div class="header-title">DAFTAR PESERTA DIDIK ROMBONGAN BELAJAR ${rombelLabel.toUpperCase()}</div>
                        <div class="header-sub">${(identity.institutionName || 'SDN SUKATINGGAL').toUpperCase()} - TAHUN PELAJARAN ${identity.academicYear || '2025/2026'}</div>
                        <div class="header-meta"><b>Guru / Wali Kelas:</b> ${identity.authorName || '-'} &nbsp;&nbsp;|&nbsp;&nbsp; <b>NIP:</b> ${identity.nip || '-'} &nbsp;&nbsp;|&nbsp;&nbsp; <b>Total Siswa:</b> ${students.length} Peserta Didik</div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th width="3%">NO</th>
                                <th width="18%">NAMA LENGKAP</th>
                                <th width="9%">NIPD</th>
                                <th width="4%">JK</th>
                                <th width="10%">NISN</th>
                                <th width="12%">TEMPAT LAHIR</th>
                                <th width="9%">TGL LAHIR</th>
                                <th width="13%">NIK</th>
                                <th width="7%">AGAMA</th>
                                <th width="15%">ALAMAT</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                    <table style="width: 100%; margin-top: 25px; border: none;">
                        <tr style="border: none;">
                            <td style="border: none; width: 50%; text-align: center; font-size: 9.5pt;">
                                Mengetahui,<br>Kepala Sekolah<br><br><br><br><br>
                                <b><u>${identity.headmasterName || '...........................................'}</u></b><br>
                                NIP. ${identity.headmasterNip || '...........................................'}
                            </td>
                            <td style="border: none; width: 50%; text-align: center; font-size: 9.5pt;">
                                ${identity.city || 'Sukatinggal'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br>
                                Guru Kelas / Wali Kelas<br><br><br><br><br>
                                <b><u>${identity.authorName || '...........................................'}</u></b><br>
                                NIP. ${identity.nip || '...........................................'}
                            </td>
                        </tr>
                    </table>
                </div>
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Daftar_Siswa_${rombelLabel.replace(/\s+/g, '_')}_Dapodik.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        notify(`Dokumen Word Daftar Siswa ${rombelLabel} siap dicetak!`, 'success');
    };

    const filledCount = students.filter(s => s.name && s.name.trim().length > 0).length;
    const currentRombelLabel = rombelLabels[0] || `${activeClass}A`;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Hidden File Input for 3x4 Photo Upload */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoFileChange} 
                accept="image/*" 
                className="hidden" 
            />

            {/* Notification Toast */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 animate-bounce">
                    <div className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold text-white ${
                        toastType === 'success' ? 'bg-emerald-600 border-emerald-500' :
                        toastType === 'warning' ? 'bg-amber-600 border-amber-500' : 'bg-slate-800 border-slate-700'
                    }`}>
                        {toastType === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        <span>{toastMessage}</span>
                    </div>
                </div>
            )}

            {/* Top Header Card */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 mb-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>Manajemen Data Siswa</span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Daftar Siswa</h1>
                    <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                        Kelola data lengkap peserta didik (NIPD, JK, NISN, NIK, Alamat, dan Foto 3x4), tempel langsung dari spreadsheet/Excel, serta ekspor dokumen Word siap cetak.
                    </p>
                </div>

                {/* Top Action Buttons */}
                <div className="flex items-center flex-wrap gap-2.5">
                    <button
                        onClick={() => setShowPasteModal(true)}
                        className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                        <ClipboardPaste className="w-4 h-4 text-emerald-600" />
                        <span>Paste dari Excel</span>
                    </button>
                    <button
                        onClick={handleClearData}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Clear Data</span>
                    </button>
                    <button
                        onClick={handleSaveData}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                        <Save className="w-4 h-4" />
                        <span>Simpan Data</span>
                    </button>
                    <button
                        onClick={handleDownloadDoc}
                        className="px-4 py-2 bg-[#0f172a] hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                        <Download className="w-4 h-4" />
                        <span>Unduh Word</span>
                    </button>
                </div>
            </div>

            {/* Class Pill Tabs (Kelas 1 - Kelas 6) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {classList.map(cls => {
                    const isActive = cls === activeClass;
                    return (
                        <button
                            key={cls}
                            onClick={() => handleSelectClass(cls)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                isActive 
                                    ? 'bg-emerald-600 text-white shadow-xs' 
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                            }`}
                        >
                            {cls}
                        </button>
                    );
                })}
            </div>

            {/* Pengaturan Rombongan Belajar (Rombel) Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <Layers className="w-4 h-4 text-emerald-600" />
                            <span>Pengaturan Rombongan Belajar (Rombel) {activeClass}</span>
                        </h3>
                        <p className="text-xs text-slate-500">
                            Tentukan jumlah rombel dan sesuaikan label setiap kelas (contoh: Kelas 1A, Kelas 1B).
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 font-medium">Jumlah Rombel:</span>
                        <select
                            value={rombelCount}
                            onChange={e => handleRombelCountChange(parseInt(e.target.value, 10))}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        >
                            <option value={1}>1 Rombel</option>
                            <option value={2}>2 Rombel</option>
                            <option value={3}>3 Rombel</option>
                            <option value={4}>4 Rombel</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                    {Array.from({ length: rombelCount }).map((_, idx) => (
                        <div key={idx} className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-600">
                                Rombel {idx + 1} Label:
                            </label>
                            <input
                                type="text"
                                value={rombelLabels[idx] || `${activeClass}${String.fromCharCode(65 + idx)}`}
                                onChange={e => handleRombelLabelChange(idx, e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                                placeholder={`Contoh: ${activeClass}${String.fromCharCode(65 + idx)}`}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Student List Table Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                {/* Card Table Header with Badge */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[11px] font-bold">
                            {activeClass.replace(/\D/g, '') || '1'}
                        </span>
                        <h3 className="font-bold text-slate-800 text-sm">
                            Daftar Siswa {activeClass} <span className="text-slate-400 font-normal text-xs">({students.length} baris)</span>
                        </h3>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50/80 text-emerald-800 border border-emerald-200/80 rounded-full text-[11px] font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Sesuai Format Lampiran Dapodik (Nama, NIPD, JK, NISN, Tempat Lahir, Tanggal Lahir, NIK, Agama, Alamat, Foto)</span>
                    </div>
                </div>

                {/* Dark Table Responsive */}
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-[#0f172a] text-white font-bold text-[11px] uppercase tracking-wider">
                            <tr>
                                <th className="py-3 px-2 text-center w-10">NO</th>
                                <th className="py-3 px-2.5 min-w-[170px]">NAMA</th>
                                <th className="py-3 px-2 min-w-[110px]">NIPD</th>
                                <th className="py-3 px-2 text-center min-w-[70px]">JK</th>
                                <th className="py-3 px-2 min-w-[110px]">NISN</th>
                                <th className="py-3 px-2.5 min-w-[130px]">TEMPAT LAHIR</th>
                                <th className="py-3 px-2 min-w-[120px]">TANGGAL LAHIR</th>
                                <th className="py-3 px-2 min-w-[150px]">NIK</th>
                                <th className="py-3 px-2 min-w-[100px]">AGAMA</th>
                                <th className="py-3 px-2.5 min-w-[190px]">ALAMAT</th>
                                <th className="py-3 px-2 text-center min-w-[80px]">FOTO (3X4)</th>
                                <th className="py-3 px-2 text-center min-w-[50px]">AKSI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {students.map((s, idx) => (
                                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="py-2.5 px-2 text-center text-slate-500 font-bold">
                                        {idx + 1}
                                    </td>
                                    <td className="py-2 px-2">
                                        <input
                                            type="text"
                                            value={s.name}
                                            onChange={e => updateStudentField(s.id, 'name', e.target.value)}
                                            placeholder="Nama Lengkap Siswa"
                                            className="w-full px-2.5 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </td>
                                    <td className="py-2 px-2">
                                        <input
                                            type="text"
                                            value={s.nipd || s.nis || ''}
                                            onChange={e => updateStudentField(s.id, 'nipd', e.target.value)}
                                            placeholder="NIPD"
                                            className="w-full px-2 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/80 rounded-lg text-xs font-mono text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </td>
                                    <td className="py-2 px-1 text-center">
                                        <select
                                            value={s.gender || 'L'}
                                            onChange={e => updateStudentField(s.id, 'gender', e.target.value)}
                                            className="px-2 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/80 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                                        >
                                            <option value="L">L</option>
                                            <option value="P">P</option>
                                        </select>
                                    </td>
                                    <td className="py-2 px-2">
                                        <input
                                            type="text"
                                            value={s.nisn || ''}
                                            onChange={e => updateStudentField(s.id, 'nisn', e.target.value)}
                                            placeholder="NISN"
                                            className="w-full px-2 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/80 rounded-lg text-xs font-mono text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </td>
                                    <td className="py-2 px-2">
                                        <input
                                            type="text"
                                            value={s.birthPlace || ''}
                                            onChange={e => updateStudentField(s.id, 'birthPlace', e.target.value)}
                                            placeholder="Bandung"
                                            className="w-full px-2.5 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/80 rounded-lg text-xs text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </td>
                                    <td className="py-2 px-2">
                                        <input
                                            type="text"
                                            value={s.birthDate || ''}
                                            onChange={e => updateStudentField(s.id, 'birthDate', e.target.value)}
                                            placeholder="DD/MM/YYYY"
                                            className="w-full px-2 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/80 rounded-lg text-xs font-mono text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </td>
                                    <td className="py-2 px-2">
                                        <input
                                            type="text"
                                            value={s.nik || ''}
                                            onChange={e => updateStudentField(s.id, 'nik', e.target.value)}
                                            placeholder="NIK (16 Digit)"
                                            className="w-full px-2 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/80 rounded-lg text-xs font-mono text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </td>
                                    <td className="py-2 px-2">
                                        <select
                                            value={s.religion || 'Islam'}
                                            onChange={e => updateStudentField(s.id, 'religion', e.target.value)}
                                            className="w-full px-2 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/80 rounded-lg text-xs text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                                        >
                                            <option value="Islam">Islam</option>
                                            <option value="Kristen">Kristen</option>
                                            <option value="Katolik">Katolik</option>
                                            <option value="Hindu">Hindu</option>
                                            <option value="Buddha">Buddha</option>
                                            <option value="Khonghucu">Khonghucu</option>
                                        </select>
                                    </td>
                                    <td className="py-2 px-2">
                                        <input
                                            type="text"
                                            value={s.address || ''}
                                            onChange={e => updateStudentField(s.id, 'address', e.target.value)}
                                            placeholder="Alamat Lengkap"
                                            className="w-full px-2.5 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/80 rounded-lg text-xs text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                        {s.photo ? (
                                            <div className="relative group inline-block">
                                                <img 
                                                    src={s.photo} 
                                                    alt="Foto 3x4" 
                                                    onClick={() => setPreviewPhotoModal({ name: s.name, photo: s.photo! })}
                                                    className="w-8 h-10 object-cover rounded border border-slate-300 shadow-2xs mx-auto cursor-pointer hover:opacity-80 transition-opacity" 
                                                />
                                                <button
                                                    onClick={() => updateStudentField(s.id, 'photo', '')}
                                                    className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                                                    title="Hapus foto"
                                                >
                                                    <X className="w-2.5 h-2.5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleTriggerPhotoUpload(s.id)}
                                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer text-[10px]"
                                                title="Upload Foto 3x4"
                                            >
                                                <ImageIcon className="w-3.5 h-3.5" />
                                                <span>3x4</span>
                                            </button>
                                        )}
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteRow(s.id)}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                            title="Hapus baris"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {students.length === 0 && (
                                <tr>
                                    <td colSpan={12} className="p-8 text-center text-slate-400">
                                        Belum ada data siswa untuk {activeClass}. Gunakan tombol <b>Paste dari Excel</b> atau <b>+ Tambah 1 Baris</b> untuk mulai mengisi data.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer with Add Row Buttons & Count Info */}
                <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleAddRows(1)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah 1 Baris</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAddRows(5)}
                            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+5 Baris</span>
                        </button>
                    </div>

                    <div className="text-xs text-slate-500 font-medium">
                        Total baris: <b>{students.length}</b> &nbsp;|&nbsp; Siswa terisi: <b>{filledCount}</b>
                    </div>
                </div>
            </div>

            {/* MODAL: PASTE DATA SISWA DARI EXCEL / SPREADSHEET (GAMBAR 2) */}
            {showPasteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-150">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                    <FileSpreadsheet className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-slate-900 text-base">
                                    Paste Data Siswa dari Excel / Spreadsheet
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowPasteModal(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Format Guidance Box */}
                        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-2 text-xs">
                            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                                <Info className="w-4 h-4 text-emerald-600" />
                                <span>Susunan Kolom yang Didukung:</span>
                            </div>
                            <div className="font-mono text-[11px] bg-white/90 px-3 py-2 rounded-xl border border-emerald-200 text-emerald-800 overflow-x-auto whitespace-nowrap">
                                [No] &nbsp;|&nbsp; Nama &nbsp;|&nbsp; NIPD &nbsp;|&nbsp; JK (L/P) &nbsp;|&nbsp; NISN &nbsp;|&nbsp; Tempat Lahir &nbsp;|&nbsp; Tanggal Lahir &nbsp;|&nbsp; NIK &nbsp;|&nbsp; Agama &nbsp;|&nbsp; Alamat
                            </div>
                            <p className="text-emerald-700 text-[11px] leading-relaxed">
                                Cukup salin (Copy / Ctrl+C) tabel dari Excel atau Dapodik Anda, lalu tempelkan (Paste / Ctrl+V) pada kotak teks di bawah ini. Sistem secara otomatis mendeteksi kolom dan mengisi data ke tabel siswa.
                            </p>
                        </div>

                        {/* Textarea */}
                        <div>
                            <textarea
                                value={pasteText}
                                onChange={e => setPasteText(e.target.value)}
                                rows={8}
                                placeholder="Tempelkan data yang Anda copy dari Excel di sini..."
                                className="w-full p-4 border border-slate-200 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-400 bg-slate-50/50 focus:bg-white resize-y"
                            />
                        </div>

                        {/* Modal Actions */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowPasteModal(false)}
                                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleProcessPasteData}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                            >
                                <Check className="w-4 h-4" />
                                <span>Proses & Masukkan Data</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: PREVIEW FOTO 3X4 */}
            {previewPhotoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 text-center space-y-4 animate-in fade-in zoom-in duration-150">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <h4 className="font-bold text-slate-800 text-sm">Foto 3x4: {previewPhotoModal.name}</h4>
                            <button
                                onClick={() => setPreviewPhotoModal(null)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="py-2">
                            <img
                                src={previewPhotoModal.photo}
                                alt="Foto Siswa"
                                className="w-48 h-64 object-cover rounded-2xl mx-auto border-2 border-slate-200 shadow-md"
                            />
                        </div>
                        <button
                            onClick={() => setPreviewPhotoModal(null)}
                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Presensi View Component (Tampilan Presensi Sesuai Hari Efektif Mapel & Kalender) ---
const PresensiView: React.FC<{
    selectedClass: string;
    setSelectedClass?: (c: string) => void;
    selectedSubject?: string;
    setSelectedSubject?: (s: string) => void;
    classSchedules?: Record<string, string[]>;
    calendarEvents?: CalendarEvent[];
    academicYearStart?: number;
    schoolDaysCount?: 5 | 6;
    identity: UserIdentity;
}> = ({ 
    selectedClass, 
    setSelectedClass,
    selectedSubject: initialSubject = "Bahasa Indonesia",
    setSelectedSubject,
    classSchedules = {},
    calendarEvents = DEFAULT_CALENDAR_EVENTS,
    academicYearStart = 2025,
    schoolDaysCount = 6,
    identity 
}) => {
    // Paper size state
    const [paperSize, setPaperSize] = useState<'A4' | 'F4'>('A4');
    const [semester, setSemester] = useState<1 | 2>(1);
    
    // Available subjects for the class
    const weeklyRosterKey = `prota_weekly_roster_${selectedClass}`;
    const [weeklySchedule, setWeeklySchedule] = useState<Record<string, ScheduleSlot[]>>(() => {
        try {
            const saved = localStorage.getItem(weeklyRosterKey);
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return getDefaultScheduleForClass(schoolDaysCount);
    });

    useEffect(() => {
        try {
            const saved = localStorage.getItem(weeklyRosterKey);
            if (saved) {
                setWeeklySchedule(JSON.parse(saved));
                return;
            }
        } catch (e) {}
        setWeeklySchedule(getDefaultScheduleForClass(schoolDaysCount));
    }, [selectedClass, schoolDaysCount]);

    // Extract unique scheduled subjects for this class
    const availableSubjects = useMemo(() => {
        const set = new Set<string>();
        const days = schoolDaysCount === 5 
            ? ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] 
            : ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        
        days.forEach(d => {
            (weeklySchedule[d] || []).forEach(slot => {
                if (slot.subject && !slot.subject.includes('Istirahat') && !slot.subject.includes('Upacara')) {
                    set.add(slot.subject);
                }
            });
        });

        // Always ensure essential subjects are included
        const fallbackList = [
            "Pendidikan Agama Islam dan Budi Pekerti",
            "Pendidikan Pancasila",
            "Bahasa Indonesia",
            "Matematika",
            "IPAS (Ilmu Pengetahuan Alam dan Sosial)",
            "PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan)",
            "Seni Rupa",
            "Bahasa Inggris",
            "Koding & Kecerdasan Artifisial",
            "Muatan Lokal (Bahasa Daerah / Bahasa Sunda / Jawa)"
        ];

        fallbackList.forEach(s => set.add(s));
        return Array.from(set);
    }, [weeklySchedule, schoolDaysCount]);

    const [activeSubject, setActiveSubject] = useState<string>(() => {
        if (availableSubjects.includes(initialSubject)) return initialSubject;
        return availableSubjects[0] || "Bahasa Indonesia";
    });

    const handleSelectSubject = (subj: string) => {
        setActiveSubject(subj);
        if (setSelectedSubject) setSelectedSubject(subj);
    };

    // Month Selector state
    const semester1Months = [
        { monthName: 'Juli', monthIndex: 6, year: academicYearStart },
        { monthName: 'Agustus', monthIndex: 7, year: academicYearStart },
        { monthName: 'September', monthIndex: 8, year: academicYearStart },
        { monthName: 'Oktober', monthIndex: 9, year: academicYearStart },
        { monthName: 'November', monthIndex: 10, year: academicYearStart },
        { monthName: 'Desember', monthIndex: 11, year: academicYearStart },
    ];

    const semester2Months = [
        { monthName: 'Januari', monthIndex: 0, year: academicYearStart + 1 },
        { monthName: 'Februari', monthIndex: 1, year: academicYearStart + 1 },
        { monthName: 'Maret', monthIndex: 2, year: academicYearStart + 1 },
        { monthName: 'April', monthIndex: 3, year: academicYearStart + 1 },
        { monthName: 'Mei', monthIndex: 4, year: academicYearStart + 1 },
        { monthName: 'Juni', monthIndex: 5, year: academicYearStart + 1 },
    ];

    const currentMonthsList = semester === 1 ? semester1Months : semester2Months;
    const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(1); // Default Agustus (index 1 di semester 1)

    // Sync selected month if semester changes
    useEffect(() => {
        setSelectedMonthIdx(0);
    }, [semester]);

    const activeMonthObj = currentMonthsList[selectedMonthIdx] || currentMonthsList[0];

    // Students state
    const studentsStorageKey = `prota_students_${selectedClass}`;
    const [students, setStudents] = useState<StudentRecord[]>(() => {
        try {
            const saved = localStorage.getItem(studentsStorageKey);
            if (saved) return JSON.parse(saved);
        } catch(e) {}
        return [
            { id: '1', nisn: '0123456701', nis: '1001', name: 'Adittia', gender: 'L', notes: 'Aktif' },
            { id: '2', nisn: '0123456702', nis: '1002', name: 'Alfath Fatir Abdurahman', gender: 'L', notes: 'Aktif' },
            { id: '3', nisn: '0123456703', nis: '1003', name: 'Algifari Ramdan', gender: 'L', notes: 'Aktif' },
            { id: '4', nisn: '0123456704', nis: '1004', name: 'Alvino Febriansyah', gender: 'L', notes: 'Aktif' },
            { id: '5', nisn: '0123456705', nis: '1005', name: 'Fauzan Nizam', gender: 'L', notes: 'Aktif' },
            { id: '6', nisn: '0123456706', nis: '1006', name: 'Nur Rizki Firdaus', gender: 'L', notes: 'Aktif' },
            { id: '7', nisn: '0123456707', nis: '1007', name: 'Muhammad Kaysa Nadeem Saputra', gender: 'L', notes: 'Aktif' },
        ];
    });

    const handleSyncStudents = () => {
        try {
            const saved = localStorage.getItem(studentsStorageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setStudents(parsed);
                    setToastMessage(`Berhasil menarik ${parsed.length} data siswa dari Roster ${selectedClass}`);
                    return;
                }
            }
        } catch(e) {}
        setToastMessage(`Roster data siswa sudah mutakhir.`);
    };

    // Calculate effective dates for the active subject in the selected month
    const effectiveDates = useMemo(() => {
        // Find which weekdays this subject is scheduled on
        const scheduledDaysSet = new Set<string>();
        const days = schoolDaysCount === 5 
            ? ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] 
            : ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        
        days.forEach(d => {
            const hasSubject = (weeklySchedule[d] || []).some(slot => {
                if (!slot.subject) return false;
                const s1 = slot.subject.toLowerCase().trim();
                const s2 = activeSubject.toLowerCase().trim();
                return s1 === s2 || s1.includes(s2) || s2.includes(s1);
            });
            if (hasSubject) {
                scheduledDaysSet.add(d);
            }
        });

        // Fallback: If no day has this subject in the schedule yet, default to Senin / Hari pertama agar kalender tetap terisi
        const targetDays = scheduledDaysSet.size > 0 
            ? Array.from(scheduledDaysSet) 
            : ['Senin'];

        const getDayName = (date: Date): string => {
            const dNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
            return dNames[date.getDay()];
        };

        const getDayShort = (dayName: string): string => {
            switch(dayName) {
                case 'Senin': return 'Sen';
                case 'Selasa': return 'Sel';
                case 'Rabu': return 'Rab';
                case 'Kamis': return 'Kam';
                case 'Jumat': return 'Jum';
                case 'Sabtu': return 'Sab';
                default: return 'Min';
            }
        };

        const checkConflict = (dateStr: string): CalendarEvent | null => {
            return calendarEvents.find(ev => dateStr >= ev.start && dateStr <= ev.end && (ev.type === 'holiday' || ev.type === 'activity')) || null;
        };

        const academicStartStr = `${academicYearStart}-07-14`;
        const academicEndStr = `${academicYearStart + 1}-06-27`;

        const year = activeMonthObj.year;
        const month = activeMonthObj.monthIndex;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const dates: { dateStr: string; dayNum: string; dayShort: string; dayName: string; formatted: string }[] = [];

        for (let d = 1; d <= daysInMonth; d++) {
            const curDate = new Date(year, month, d);
            const dateStr = formatDateLocal(curDate);
            const dayName = getDayName(curDate);
            const isWeekend = schoolDaysCount === 5 ? (curDate.getDay() === 0 || curDate.getDay() === 6) : curDate.getDay() === 0;
            const isWithinAcademic = dateStr >= academicStartStr && dateStr <= academicEndStr;

            if (targetDays.includes(dayName) && !isWeekend && isWithinAcademic) {
                const conflict = checkConflict(dateStr);
                if (!conflict) {
                    dates.push({
                        dateStr,
                        dayNum: d < 10 ? `0${d}` : `${d}`,
                        dayShort: getDayShort(dayName),
                        dayName,
                        formatted: `${d < 10 ? `0${d}` : `${d}`} ${activeMonthObj.monthName} ${year}`
                    });
                }
            }
        }

        return dates;
    }, [activeSubject, activeMonthObj, weeklySchedule, calendarEvents, academicYearStart, schoolDaysCount]);

    // Attendance state: record of studentId -> (record of dateStr -> 'H' | 'S' | 'I' | 'A')
    const attendanceStorageKey = `prota_attendance_matrix_${selectedClass}_${activeSubject.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const [attendanceMatrix, setAttendanceMatrix] = useState<Record<string, Record<string, 'H' | 'S' | 'I' | 'A'>>>(() => {
        try {
            const saved = localStorage.getItem(attendanceStorageKey);
            if (saved) return JSON.parse(saved);
        } catch(e) {}
        return {};
    });

    useEffect(() => {
        try {
            const saved = localStorage.getItem(attendanceStorageKey);
            if (saved) {
                setAttendanceMatrix(JSON.parse(saved));
                return;
            }
        } catch(e) {}
        setAttendanceMatrix({});
    }, [attendanceStorageKey]);

    // Toast state
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    useEffect(() => {
        if (toastMessage) {
            const t = setTimeout(() => setToastMessage(null), 3500);
            return () => clearTimeout(t);
        }
    }, [toastMessage]);

    // Set or cycle attendance
    const handleSetStatus = (studentId: string, dateStr: string, status: 'H' | 'S' | 'I' | 'A') => {
        setAttendanceMatrix(prev => {
            const studentAtt = { ...(prev[studentId] || {}) };
            studentAtt[dateStr] = status;
            return { ...prev, [studentId]: studentAtt };
        });
    };

    const handleCycleStatus = (studentId: string, dateStr: string) => {
        const current = attendanceMatrix[studentId]?.[dateStr] || 'H';
        const nextMap: Record<'H' | 'S' | 'I' | 'A', 'H' | 'S' | 'I' | 'A'> = {
            'H': 'S',
            'S': 'I',
            'I': 'A',
            'A': 'H'
        };
        handleSetStatus(studentId, dateStr, nextMap[current]);
    };

    // Quick action: Centang Semua Hadir for the entire month
    const handleCheckAllPresentMonth = () => {
        if (effectiveDates.length === 0) {
            setToastMessage('Tidak ada tanggal hari efektif pada bulan ini.');
            return;
        }
        setAttendanceMatrix(prev => {
            const next = { ...prev };
            students.forEach(s => {
                const sAtt = { ...(next[s.id] || {}) };
                effectiveDates.forEach(d => {
                    sAtt[d.dateStr] = 'H';
                });
                next[s.id] = sAtt;
            });
            return next;
        });
        setToastMessage(`Semua siswa berhasil ditandai HADIR untuk bulan ${activeMonthObj.monthName} ${activeMonthObj.year}!`);
    };

    // Quick action: Mark all students 'H' for a specific date column
    const handleCheckAllPresentForDate = (dateStr: string, dayNum: string) => {
        setAttendanceMatrix(prev => {
            const next = { ...prev };
            students.forEach(s => {
                const sAtt = { ...(next[s.id] || {}) };
                sAtt[dateStr] = 'H';
                next[s.id] = sAtt;
            });
            return next;
        });
        setToastMessage(`Semua siswa ditandai HADIR pada tanggal ${dayNum} ${activeMonthObj.monthName}`);
    };

    // Save Data Handler
    const handleSaveData = () => {
        try {
            localStorage.setItem(attendanceStorageKey, JSON.stringify(attendanceMatrix));
            setToastMessage(`Data presensi ${activeSubject} (${selectedClass}) berhasil disimpan!`);
        } catch(e) {
            alert('Gagal menyimpan data presensi ke memori lokal.');
        }
    };

    // Reset Data Handler
    const handleResetData = () => {
        if (confirm(`Apakah Anda yakin ingin mereset seluruh data presensi ${activeSubject} untuk bulan ${activeMonthObj.monthName}?`)) {
            setAttendanceMatrix(prev => {
                const next = { ...prev };
                students.forEach(s => {
                    if (next[s.id]) {
                        const sAtt = { ...next[s.id] };
                        effectiveDates.forEach(d => {
                            delete sAtt[d.dateStr];
                        });
                        next[s.id] = sAtt;
                    }
                });
                try {
                    localStorage.setItem(attendanceStorageKey, JSON.stringify(next));
                } catch(e) {}
                return next;
            });
            setToastMessage(`Data presensi bulan ${activeMonthObj.monthName} berhasil direset.`);
        }
    };

    // Refresh Effective Days
    const handleRefreshEffectiveDays = () => {
        setToastMessage(`Hari efektif berhasil disinkronkan (${effectiveDates.length} hari pertemuan teridentifikasi).`);
    };

    // Download Monthly Word (.doc)
    const handleDownloadMonthlyDoc = () => {
        const schoolName = identity.institutionName || 'SDN SUKATINGGAL';
        const academicYear = identity.academicYear || '2026-2027';
        const teacherName = identity.authorName || 'Acep Miftah Hilah Ash-shidiq, S.Pd.';
        const nipTeacher = identity.nip || '-';
        const headmasterName = identity.kepalaSekolah || 'Yuni Sri Rahayu, S.Pd.';
        const nipHeadmaster = identity.nipKepalaSekolah || '-';

        const pageStyle = paperSize === 'F4' 
            ? `@page { size: 21.5cm 33.0cm landscape; margin: 1.5cm; }`
            : `@page { size: 21.0cm 29.7cm landscape; margin: 1.5cm; }`;

        const dateHeaders = effectiveDates.map(d => `
            <th style="border: 1px solid #334155; padding: 6px 4px; text-align: center; font-size: 9pt; background: #f1f5f9; min-width: 32px;">
                <div style="font-weight: bold;">${d.dayNum}</div>
                <div style="font-size: 8pt; color: #475569;">${d.dayShort}</div>
            </th>
        `).join('');

        const studentRows = students.map((s, idx) => {
            let h = 0, sc = 0, i = 0, a = 0;
            const dateCells = effectiveDates.map(d => {
                const st = attendanceMatrix[s.id]?.[d.dateStr] || 'H';
                if (st === 'H') h++;
                else if (st === 'S') sc++;
                else if (st === 'I') i++;
                else if (st === 'A') a++;

                const bg = st === 'H' ? '#ecfdf5' : st === 'S' ? '#fffbeb' : st === 'I' ? '#eff6ff' : '#fff1f2';
                const col = st === 'H' ? '#047857' : st === 'S' ? '#b45309' : st === 'I' ? '#1d4ed8' : '#be123c';

                return `<td style="border: 1px solid #334155; padding: 6px 2px; text-align: center; font-weight: bold; background: ${bg}; color: ${col}; font-size: 9.5pt;">${st}</td>`;
            }).join('');

            const total = effectiveDates.length;
            const percent = total > 0 ? Math.round((h / total) * 100) : 100;

            return `
                <tr>
                    <td style="border: 1px solid #334155; padding: 6px; text-align: center; font-size: 9pt;">${idx + 1}</td>
                    <td style="border: 1px solid #334155; padding: 6px 8px; font-weight: bold; font-size: 9.5pt;">${s.name}</td>
                    <td style="border: 1px solid #334155; padding: 6px; text-align: center; font-size: 9pt;">${s.gender || 'L'}</td>
                    <td style="border: 1px solid #334155; padding: 6px; text-align: center; font-size: 9pt;">${s.nisn || '-'}</td>
                    ${dateCells}
                    <td style="border: 1px solid #334155; padding: 6px; text-align: center; font-weight: bold; font-size: 9.5pt; color: #047857;">${h}</td>
                    <td style="border: 1px solid #334155; padding: 6px; text-align: center; font-weight: bold; font-size: 9.5pt; color: #b45309;">${sc}</td>
                    <td style="border: 1px solid #334155; padding: 6px; text-align: center; font-weight: bold; font-size: 9.5pt; color: #1d4ed8;">${i}</td>
                    <td style="border: 1px solid #334155; padding: 6px; text-align: center; font-weight: bold; font-size: 9.5pt; color: #be123c;">${a}</td>
                    <td style="border: 1px solid #334155; padding: 6px; text-align: center; font-weight: bold; font-size: 9.5pt;">${percent}%</td>
                </tr>
            `;
        }).join('');

        const html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>Rekap Presensi ${activeSubject} - ${activeMonthObj.monthName} ${activeMonthObj.year}</title>
                <style>
                    ${pageStyle}
                    body { font-family: 'Arial', sans-serif; font-size: 10pt; color: #0f172a; line-height: 1.3; }
                    table { border-collapse: collapse; width: 100%; margin-top: 12px; }
                    th { font-weight: bold; }
                    .header-box { text-align: center; margin-bottom: 16px; }
                    .info-table { width: 100%; border: none; margin-bottom: 8px; font-size: 9.5pt; }
                    .info-table td { border: none; padding: 3px 0; }
                </style>
            </head>
            <body>
                <div class="header-box">
                    <h2 style="font-size: 13pt; margin: 0 0 4px 0; text-transform: uppercase;">DAFTAR HADIR / PRESENSI PESERTA DIDIK</h2>
                    <h3 style="font-size: 11pt; margin: 0 0 4px 0; font-weight: bold;">BULAN ${activeMonthObj.monthName.toUpperCase()} ${activeMonthObj.year}</h3>
                    <div style="font-size: 9.5pt; color: #334155;">${schoolName} - TAHUN AJARAN ${academicYear}</div>
                </div>

                <table class="info-table">
                    <tr>
                        <td width="18%"><b>Mata Pelajaran</b></td>
                        <td width="32%">: ${activeSubject}</td>
                        <td width="18%"><b>Semester</b></td>
                        <td width="32%">: ${semester === 1 ? '1 (Ganjil)' : '2 (Genap)'}</td>
                    </tr>
                    <tr>
                        <td><b>Kelas / Rombel</b></td>
                        <td>: ${selectedClass}</td>
                        <td><b>Total Hari Efektif</b></td>
                        <td>: ${effectiveDates.length} Hari Pertemuan</td>
                    </tr>
                </table>

                <table>
                    <thead>
                        <tr style="background: #e2e8f0;">
                            <th rowspan="2" style="border: 1px solid #334155; padding: 8px; text-align: center; width: 30px;">NO</th>
                            <th rowspan="2" style="border: 1px solid #334155; padding: 8px; text-align: left; min-width: 180px;">NAMA SISWA</th>
                            <th rowspan="2" style="border: 1px solid #334155; padding: 8px; text-align: center; width: 35px;">L/P</th>
                            <th rowspan="2" style="border: 1px solid #334155; padding: 8px; text-align: center; width: 90px;">NISN</th>
                            <th colspan="${Math.max(1, effectiveDates.length)}" style="border: 1px solid #334155; padding: 6px; text-align: center; background: #cbd5e1;">TANGGAL HARI EFEKTIF BELAJAR</th>
                            <th colspan="4" style="border: 1px solid #334155; padding: 6px; text-align: center; background: #cbd5e1;">REKAPITULASI</th>
                            <th rowspan="2" style="border: 1px solid #334155; padding: 8px; text-align: center; width: 45px;">%</th>
                        </tr>
                        <tr>
                            ${dateHeaders || '<th style="border: 1px solid #334155; padding: 6px; text-align: center;">-</th>'}
                            <th style="border: 1px solid #334155; padding: 6px; text-align: center; width: 28px; background: #ecfdf5; color: #047857;">H</th>
                            <th style="border: 1px solid #334155; padding: 6px; text-align: center; width: 28px; background: #fffbeb; color: #b45309;">S</th>
                            <th style="border: 1px solid #334155; padding: 6px; text-align: center; width: 28px; background: #eff6ff; color: #1d4ed8;">I</th>
                            <th style="border: 1px solid #334155; padding: 6px; text-align: center; width: 28px; background: #fff1f2; color: #be123c;">A</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${studentRows}
                    </tbody>
                </table>

                <div style="margin-top: 14px; font-size: 8.5pt; color: #475569;">
                    <b>Keterangan:</b> [H] Hadir &bull; [S] Sakit &bull; [I] Izin &bull; [A] Alfa / Tanpa Keterangan
                </div>

                <table style="width: 100%; border: none; margin-top: 35px;">
                    <tr>
                        <td style="border: none; text-align: center; width: 45%; vertical-align: top;">
                            Mengetahui,<br>
                            <b>Kepala Sekolah</b>
                            <br><br><br><br>
                            <b><u>${headmasterName}</u></b><br>
                            NIP. ${nipHeadmaster}
                        </td>
                        <td style="border: none; width: 10%;"></td>
                        <td style="border: none; text-align: center; width: 45%; vertical-align: top;">
                            Santosa, ${effectiveDates.length > 0 ? effectiveDates[effectiveDates.length - 1].formatted : `31 ${activeMonthObj.monthName} ${activeMonthObj.year}`}<br>
                            <b>Guru Kelas / Mata Pelajaran</b>
                            <br><br><br><br>
                            <b><u>${teacherName}</u></b><br>
                            NIP. ${nipTeacher}
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Presensi_${activeSubject.replace(/\s+/g, '_')}_${selectedClass}_${activeMonthObj.monthName}_${activeMonthObj.year}_${paperSize}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setToastMessage(`Rekap bulanan Word (${paperSize}) berhasil diunduh!`);
    };

    // Download Semester Word (.doc)
    const handleDownloadSemesterDoc = () => {
        const schoolName = identity.institutionName || 'SDN SUKATINGGAL';
        const academicYear = identity.academicYear || '2026-2027';
        const teacherName = identity.authorName || 'Acep Miftah Hilah Ash-shidiq, S.Pd.';
        const nipTeacher = identity.nip || '-';
        const headmasterName = identity.kepalaSekolah || 'Yuni Sri Rahayu, S.Pd.';
        const nipHeadmaster = identity.nipKepalaSekolah || '-';

        const pageStyle = paperSize === 'F4' 
            ? `@page { size: 21.5cm 33.0cm landscape; margin: 1.5cm; }`
            : `@page { size: 21.0cm 29.7cm landscape; margin: 1.5cm; }`;

        const monthCols = currentMonthsList.map(m => `
            <th colspan="4" style="border: 1px solid #334155; padding: 6px; text-align: center; background: #e2e8f0; font-size: 9pt;">${m.monthName}</th>
        `).join('');

        const subHeaders = currentMonthsList.map(() => `
            <th style="border: 1px solid #334155; padding: 4px; text-align: center; font-size: 8pt; background: #ecfdf5; color: #047857;">H</th>
            <th style="border: 1px solid #334155; padding: 4px; text-align: center; font-size: 8pt; background: #fffbeb; color: #b45309;">S</th>
            <th style="border: 1px solid #334155; padding: 4px; text-align: center; font-size: 8pt; background: #eff6ff; color: #1d4ed8;">I</th>
            <th style="border: 1px solid #334155; padding: 4px; text-align: center; font-size: 8pt; background: #fff1f2; color: #be123c;">A</th>
        `).join('');

        const studentRows = students.map((s, idx) => {
            let totalH = 0, totalS = 0, totalI = 0, totalA = 0;

            const monthCells = currentMonthsList.map(m => {
                // Approximate / actual count for each month
                let h = 0, sc = 0, i = 0, a = 0;
                // If it's active month, read exact values
                if (m.monthIndex === activeMonthObj.monthIndex) {
                    effectiveDates.forEach(d => {
                        const st = attendanceMatrix[s.id]?.[d.dateStr] || 'H';
                        if (st === 'H') h++;
                        else if (st === 'S') sc++;
                        else if (st === 'I') i++;
                        else if (st === 'A') a++;
                    });
                } else {
                    h = 4; // default effective sessions
                }
                totalH += h;
                totalS += sc;
                totalI += i;
                totalA += a;

                return `
                    <td style="border: 1px solid #334155; padding: 4px; text-align: center; font-size: 9pt;">${h}</td>
                    <td style="border: 1px solid #334155; padding: 4px; text-align: center; font-size: 9pt;">${sc}</td>
                    <td style="border: 1px solid #334155; padding: 4px; text-align: center; font-size: 9pt;">${i}</td>
                    <td style="border: 1px solid #334155; padding: 4px; text-align: center; font-size: 9pt;">${a}</td>
                `;
            }).join('');

            const sumAll = totalH + totalS + totalI + totalA;
            const pct = sumAll > 0 ? Math.round((totalH / sumAll) * 100) : 100;

            return `
                <tr>
                    <td style="border: 1px solid #334155; padding: 6px; text-align: center; font-size: 9pt;">${idx + 1}</td>
                    <td style="border: 1px solid #334155; padding: 6px 8px; font-weight: bold; font-size: 9pt;">${s.name}</td>
                    <td style="border: 1px solid #334155; padding: 6px; text-align: center; font-size: 9pt;">${s.gender || 'L'}</td>
                    <td style="border: 1px solid #334155; padding: 6px; text-align: center; font-size: 9pt;">${s.nisn || '-'}</td>
                    ${monthCells}
                    <td style="border: 1px solid #334155; padding: 6px; text-align: center; font-weight: bold; font-size: 9pt; color: #047857;">${totalH}</td>
                    <td style="border: 1px solid #334155; padding: 6px; text-align: center; font-weight: bold; font-size: 9pt; color: #b45309;">${totalS}</td>
                    <td style="border: 1px solid #334155; padding: 6px; text-align: center; font-weight: bold; font-size: 9pt; color: #1d4ed8;">${totalI}</td>
                    <td style="border: 1px solid #334155; padding: 6px; text-align: center; font-weight: bold; font-size: 9pt; color: #be123c;">${totalA}</td>
                    <td style="border: 1px solid #334155; padding: 6px; text-align: center; font-weight: bold; font-size: 9.5pt;">${pct}%</td>
                </tr>
            `;
        }).join('');

        const html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>Rekapitulasi Presensi Semester ${semester} - ${activeSubject}</title>
                <style>
                    ${pageStyle}
                    body { font-family: 'Arial', sans-serif; font-size: 9.5pt; color: #0f172a; line-height: 1.3; }
                    table { border-collapse: collapse; width: 100%; margin-top: 12px; }
                    th { font-weight: bold; }
                    .header-box { text-align: center; margin-bottom: 16px; }
                </style>
            </head>
            <body>
                <div class="header-box">
                    <h2 style="font-size: 13pt; margin: 0 0 4px 0; text-transform: uppercase;">REKAPITULASI PRESENSI KEHADIRAN SEMESTER ${semester === 1 ? 'I (GANJIL)' : 'II (GENAP)'}</h2>
                    <h3 style="font-size: 11pt; margin: 0 0 4px 0; font-weight: bold;">MATA PELAJARAN: ${activeSubject.toUpperCase()} (${selectedClass.toUpperCase()})</h3>
                    <div style="font-size: 9.5pt; color: #334155;">${schoolName} - TAHUN AJARAN ${academicYear}</div>
                </div>

                <table>
                    <thead>
                        <tr style="background: #cbd5e1;">
                            <th rowspan="2" style="border: 1px solid #334155; padding: 6px; text-align: center; width: 25px;">NO</th>
                            <th rowspan="2" style="border: 1px solid #334155; padding: 6px; text-align: left; min-width: 160px;">NAMA SISWA</th>
                            <th rowspan="2" style="border: 1px solid #334155; padding: 6px; text-align: center; width: 30px;">L/P</th>
                            <th rowspan="2" style="border: 1px solid #334155; padding: 6px; text-align: center; width: 80px;">NISN</th>
                            ${monthCols}
                            <th colspan="4" style="border: 1px solid #334155; padding: 6px; text-align: center; background: #cbd5e1;">TOTAL</th>
                            <th rowspan="2" style="border: 1px solid #334155; padding: 6px; text-align: center; width: 40px;">%</th>
                        </tr>
                        <tr>
                            ${subHeaders}
                            <th style="border: 1px solid #334155; padding: 4px; text-align: center; font-size: 8pt; background: #ecfdf5; color: #047857;">H</th>
                            <th style="border: 1px solid #334155; padding: 4px; text-align: center; font-size: 8pt; background: #fffbeb; color: #b45309;">S</th>
                            <th style="border: 1px solid #334155; padding: 4px; text-align: center; font-size: 8pt; background: #eff6ff; color: #1d4ed8;">I</th>
                            <th style="border: 1px solid #334155; padding: 4px; text-align: center; font-size: 8pt; background: #fff1f2; color: #be123c;">A</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${studentRows}
                    </tbody>
                </table>

                <table style="width: 100%; border: none; margin-top: 30px;">
                    <tr>
                        <td style="border: none; text-align: center; width: 45%; vertical-align: top;">
                            Mengetahui,<br>
                            <b>Kepala Sekolah</b>
                            <br><br><br><br>
                            <b><u>${headmasterName}</u></b><br>
                            NIP. ${nipHeadmaster}
                        </td>
                        <td style="border: none; width: 10%;"></td>
                        <td style="border: none; text-align: center; width: 45%; vertical-align: top;">
                            Santosa, Juni ${academicYearStart + 1}<br>
                            <b>Guru Kelas / Mata Pelajaran</b>
                            <br><br><br><br>
                            <b><u>${teacherName}</u></b><br>
                            NIP. ${nipTeacher}
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Rekap_Semester_${semester}_${activeSubject.replace(/\s+/g, '_')}_${selectedClass}_${paperSize}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setToastMessage(`Rekap semester Word (${paperSize}) berhasil diunduh!`);
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 md:p-8 max-w-7xl mx-auto space-y-6">
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-2 border border-slate-700">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Header Section */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2.5">
                        <ClipboardCheck className="w-6 h-6 text-emerald-600" />
                        <span>Presensi Kehadiran Siswa</span>
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        Kelola daftar hadir harian berdasarkan hari efektif belajar.
                    </p>
                </div>

                {/* Top-Right Action Controls */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Paper Size Selector */}
                    <div className="bg-slate-100 p-1 rounded-full flex items-center border border-slate-200/80 text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => setPaperSize('A4')}
                            className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                                paperSize === 'A4'
                                    ? 'bg-white text-emerald-800 shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            A4
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaperSize('F4')}
                            className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                                paperSize === 'F4'
                                    ? 'bg-white text-emerald-800 shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            F4 (Folio)
                        </button>
                    </div>

                    {/* Simpan Data Button */}
                    <button
                        type="button"
                        onClick={handleSaveData}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95 border border-emerald-200/80 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    >
                        <Save className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Simpan Data</span>
                    </button>

                    {/* Unduh Rekap Bulanan Button */}
                    <button
                        type="button"
                        onClick={handleDownloadMonthlyDoc}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 active:scale-95 border border-blue-200/80 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                        <span>Unduh Rekap Bulanan ({paperSize})</span>
                    </button>

                    {/* Unduh Rekap Semester Button */}
                    <button
                        type="button"
                        onClick={handleDownloadSemesterDoc}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95 border border-emerald-200/80 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Unduh Rekap Semester ({paperSize})</span>
                    </button>

                    {/* Reset Data Button */}
                    <button
                        type="button"
                        onClick={handleResetData}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 active:scale-95 border border-rose-200/80 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Reset Data</span>
                    </button>
                </div>
            </div>

            {/* Scheduled Subjects Selection Row (Ganti Button Kelas) */}
            <div className="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        PILIHAN MATA PELAJARAN TERJADWAL ({selectedClass.toUpperCase()})
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                        Pilih mapel untuk memuat jadwal efektif
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {availableSubjects.map(sub => {
                        const isActive = activeSubject === sub;
                        return (
                            <button
                                key={sub}
                                type="button"
                                onClick={() => handleSelectSubject(sub)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-500 shadow-xs'
                                        : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-100/50'
                                }`}
                            >
                                {sub}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Second Control Row: Semester, Month Picker, Badges, & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Semester Switcher */}
                    <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200 text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => setSemester(1)}
                            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                                semester === 1 
                                    ? 'bg-emerald-700 text-white shadow-2xs font-extrabold' 
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Semester I
                        </button>
                        <button
                            type="button"
                            onClick={() => setSemester(2)}
                            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                                semester === 2 
                                    ? 'bg-emerald-700 text-white shadow-2xs font-extrabold' 
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Semester II
                        </button>
                    </div>

                    {/* Month Picker Dropdown */}
                    <div className="relative">
                        <select
                            value={selectedMonthIdx}
                            onChange={e => setSelectedMonthIdx(parseInt(e.target.value, 10))}
                            className="appearance-none bg-white border border-slate-200 rounded-2xl px-4 py-2.5 pr-10 text-xs font-bold text-slate-800 shadow-2xs outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        >
                            {currentMonthsList.map((m, idx) => (
                                <option key={m.monthName} value={idx}>
                                    ðŸ“… {m.monthName} {m.year}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Total Hari Efektif Badge */}
                    <div className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-xs font-bold text-emerald-800">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Total Hari Efektif: {effectiveDates.length} Hari</span>
                    </div>
                </div>

                {/* Right Buttons: Centang Semua Hadir, Tarik Data Siswa, Tarik Hari Efektif */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handleCheckAllPresentMonth}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                        <Check className="w-4 h-4" />
                        <span>Centang Semua Hadir</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleSyncStudents}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    >
                        <Users className="w-4 h-4 text-slate-500" />
                        <span>Tarik Data Siswa</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleRefreshEffectiveDays}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    >
                        <RefreshCw className="w-4 h-4 text-slate-500" />
                        <span>Tarik Hari Efektif</span>
                    </button>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
                <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50/90 text-slate-700 font-extrabold uppercase border-b border-slate-200">
                        <tr>
                            <th className="p-3 text-center w-12 border-r border-slate-200/60">NO</th>
                            <th className="p-3 min-w-[200px] border-r border-slate-200/60">NAMA SISWA</th>
                            <th className="p-3 text-center w-14 border-r border-slate-200/60">L/P</th>
                            <th className="p-3 text-center w-28 border-r border-slate-200/60">NISN</th>
                            
                            {effectiveDates.length > 0 ? (
                                effectiveDates.map(d => (
                                    <th key={d.dateStr} className="p-2.5 text-center min-w-[72px] border-r border-slate-200/60 bg-white">
                                        <div className="text-sm font-black text-slate-900 leading-tight">{d.dayNum}</div>
                                        <div className="text-[10px] font-semibold text-slate-500">{d.dayShort}</div>
                                        <button
                                            type="button"
                                            onClick={() => handleCheckAllPresentForDate(d.dateStr, d.dayNum)}
                                            className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                                            title={`Klik untuk tandai semua HADIR pada tgl ${d.dayNum}`}
                                        >
                                            <Check className="w-2.5 h-2.5" />
                                            <span>Semua H</span>
                                        </button>
                                    </th>
                                ))
                            ) : (
                                <th className="p-4 text-center text-slate-400 font-medium">
                                    Tidak ada jadwal hari efektif terdeteksi pada bulan {activeMonthObj.monthName}
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium bg-white">
                        {students.length > 0 ? (
                            students.map((s, idx) => (
                                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="p-3 text-center text-slate-400 font-bold border-r border-slate-100">
                                        {idx + 1}
                                    </td>
                                    <td className="p-3 font-bold text-slate-800 border-r border-slate-100">
                                        {s.name}
                                    </td>
                                    <td className="p-3 text-center text-slate-600 font-semibold border-r border-slate-100">
                                        {s.gender || 'L'}
                                    </td>
                                    <td className="p-3 text-center text-slate-500 text-[11px] font-mono border-r border-slate-100">
                                        {s.nisn || '-'}
                                    </td>

                                    {effectiveDates.length > 0 ? (
                                        effectiveDates.map(d => {
                                            const status = attendanceMatrix[s.id]?.[d.dateStr] || 'H';
                                            return (
                                                <td key={d.dateStr} className="p-2 text-center border-r border-slate-100">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCycleStatus(s.id, d.dateStr)}
                                                        className={`w-10 h-7 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center mx-auto shadow-2xs ${
                                                            status === 'H'
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                                                : status === 'S'
                                                                ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                                                : status === 'I'
                                                                ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                                                                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                                        }`}
                                                        title={`Klik untuk mengganti status kehadiran (Saat ini: ${status})`}
                                                    >
                                                        {status}
                                                    </button>
                                                </td>
                                            );
                                        })
                                    ) : (
                                        <td className="p-3 text-center text-slate-400 text-xs italic">
                                            -
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4 + Math.max(1, effectiveDates.length)} className="p-8 text-center text-slate-400">
                                    Belum ada data siswa terdaftar. Klik <b>Tarik Data Siswa</b> untuk memuat daftar peserta didik.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Bottom Status Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-bold">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                        H
                    </span>
                    <span className="text-slate-600">HADIR</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs">
                        S
                    </span>
                    <span className="text-slate-600">SAKIT</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-black text-xs">
                        I
                    </span>
                    <span className="text-slate-600">IZIN</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-black text-xs">
                        A
                    </span>
                    <span className="text-slate-600">ALFA</span>
                </div>
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
                'Senin': 'ðŸ“˜ SENIN',
                'Selasa': 'ðŸ“™ SELASA',
                'Rabu': 'ðŸ§‘â€ðŸ¤â€ðŸ§‘ RABU',
                'Kamis': 'ðŸ’› KAMIS',
                'Jumat': 'â­ JUMAT',
                'Sabtu': 'ðŸš© SABTU'
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
                    rowTimes.push(`ðŸ•’ ${cellSample.jamKeStr}<br/><span style="font-size: 7.5pt; font-weight: 800; color: #78350F;">${cellSample.timeRange}</span>`);
                } else {
                    rowTimes.push(`ðŸ•’ Jam ${r + 1}`);
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
                                ISTIRAHAT â˜•
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
                            <div class="school-tag">ðŸ« ${schoolName}</div>
                            <h2 class="page2-title">RINCIAN JADWAL PELAJARAN HARIAN & REKAPITULASI JP (${selectedClass.toUpperCase()})</h2>
                            <div class="page2-sub">Tahun Pelajaran ${academicYear} &bull; Kurikulum Merdeka (${faseName})</div>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <h3 style="font-size: 10pt; font-weight: 900; color: #1E3A8A; margin: 0 0 6px 0; text-transform: uppercase;">
                                ðŸ“‹ TABEL RINCIAN JADWAL PELAJARAN HARIAN (AKURAT DENGAN PENGATURAN WAKTU & JAM KE)
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
                                ðŸ“Š REKAPITULASI ALOKASI BEBAN JP MENGAJAR KELAS
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
                            <span>ðŸ“„ Pratinjau Dokumen PDF - Jadwal Pelajaran (${selectedClass})</span>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn-print" onclick="window.print();">ðŸ–¨ï¸ Simpan / Cetak PDF</button>
                            <button class="btn-close" onclick="window.close();">Tutup</button>
                        </div>
                    </div>

                    <!-- HALAMAN 1: JADWAL PELAJARAN ( STRICT 1 PAGE FIT ) -->
                    <div class="pdf-page page-1">
                        <div class="header-banner">
                            <div class="school-box">
                                <div class="school-name">ðŸ« ${schoolName}</div>
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
                                        â±ï¸ WAKTU
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
                                <div class="card-title">ðŸ“Œ Catatan:</div>
                                <div class="card-desc">
                                    <div>â­ <strong>Disiplin waktu:</strong> Kunci keberhasilan belajar.</div>
                                    <div>â¤ï¸ <strong>Kesehatan & Kebersihan:</strong> Saling menghargai & menjaga kebersihan.</div>
                                    <div>ðŸ“š <strong>Semangat Belajar:</strong> Raih masa depan gemilang!</div>
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
                'Senin': 'ðŸ“˜ SENIN',
                'Selasa': 'ðŸ“™ SELASA',
                'Rabu': 'ðŸ§‘â€ðŸ¤â€ðŸ§‘ RABU',
                'Kamis': 'ðŸ’› KAMIS',
                'Jumat': 'â­ JUMAT',
                'Sabtu': 'ðŸš© SABTU'
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
                    rowTimes.push(`ðŸ•’ ${cellSample.jamKeStr}<br/><span style="font-size: 7.5pt; font-weight: 800; color: #78350F;">${cellSample.timeRange}</span>`);
                } else {
                    rowTimes.push(`ðŸ•’ Jam ${r + 1}`);
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
                                ISTIRAHAT â˜•
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
                            <div style="font-size: 11pt; font-weight: 900; color: #1E3A8A; text-transform: uppercase;">ðŸ« ${schoolName}</div>
                            <h2 style="font-size: 15pt; font-weight: 900; color: #0F172A; margin: 6px 0 2px 0;">RINCIAN JADWAL PELAJARAN HARIAN & REKAPITULASI JP (${selectedClass.toUpperCase()})</h2>
                            <div style="font-size: 9.5pt; color: #475569;">Tahun Pelajaran ${academicYear} &bull; Kurikulum Merdeka (${faseName})</div>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <h3 style="font-size: 10pt; font-weight: 900; color: #1E3A8A; margin: 10px 0 6px 0;">ðŸ“‹ TABEL RINCIAN JADWAL PELAJARAN HARIAN (JAM KE & WAKTU)</h3>
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
                            <h3 style="font-size: 10pt; font-weight: 900; color: #1E3A8A; margin: 10px 0 6px 0;">ðŸ“Š REKAPITULASI ALOKASI BEBAN JP MINGGUAN</h3>
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
                                <div style="font-size: 13pt; font-weight: 900; color: #1E3A8A; text-transform: uppercase;">ðŸ« ${schoolName}</div>
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
                                    â±ï¸ WAKTU
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
                                        ðŸ“Œ Catatan:
                                    </div>
                                    <div style="font-size: 7.5pt; color: #334155; line-height: 1.3;">
                                        <div>â­ <strong>Disiplin waktu:</strong> Kunci keberhasilan belajar.</div>
                                        <div>â¤ï¸ <strong>Kesehatan & Kebersihan:</strong> Saling menghargai.</div>
                                        <div>ðŸ“š <strong>Semangat Belajar:</strong> Raih masa depan gemilang!</div>
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
                        ðŸ—“ï¸ 5 Hari Kerja (Senin - Jumat)
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
                        ðŸ—“ï¸ 6 Hari Kerja (Senin - Sabtu)
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
interface KKTPStudentScore {
    studentId: string;
    studentName: string;
    gender: 'L' | 'P';
    nisn?: string;
    nis?: string;
    criteria: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan';
    description: string;
}

interface KKTPRubric {
    perluBimbingan: string;
    cukup: string;
    baik: string;
    sangatBaik: string;
}

interface KKTPRecord {
    id: string;
    subject: string;
    className: string;
    date: string;
    formattedDate: string;
    dayNumber: string;
    element: string;
    atpId: string;
    atpTitle: string;
    rubric: KKTPRubric;
    studentScores: KKTPStudentScore[];
    createdAt: string;
}

interface DisplayAtpItem {
    id: string;
    no: number;
    element: string;
    title: string;
    rawTopic: string;
    dateStr: string;
    formattedDate: string;
    dayNumber: string;
    processed: boolean;
}

const generateSoloRubric = (topic: string): KKTPRubric => {
    let clean = topic.trim();
    if (clean.endsWith('.')) clean = clean.slice(0, -1);
    clean = clean.replace(/^[A-Z]/, c => c.toLowerCase());

    return {
        perluBimbingan: `Belum mampu ${clean}.`,
        cukup: `Mampu ${clean}, namun masih terbatas pada aspek dasar (Unistructural).`,
        baik: `Mampu ${clean}, dengan mengaitkan beberapa aspek relevan (Multistructural/Relational).`,
        sangatBaik: `Sangat mahir ${clean}, dan mampu mengaplikasikannya dalam konteks yang lebih luas (Extended Abstract).`
    };
};

const generateStudentDescription = (topic: string, criteria: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan'): string => {
    let clean = topic.trim();
    if (clean.endsWith('.')) clean = clean.slice(0, -1);

    if (criteria === 'Sangat Baik') {
        return `Sangat mahir ${clean}, dan mampu mengembangkannya secara mandiri.`;
    } else if (criteria === 'Baik') {
        return `Mampu memahami ${clean}, dengan baik.`;
    } else if (criteria === 'Cukup') {
        return `Mampu memahami ${clean}, namun masih memerlukan sedikit bimbingan pada aspek tertentu.`;
    } else {
        return `Memerlukan bimbingan lebih lanjut dalam ${clean}.`;
    }
};

const KKTPView: React.FC<{
    selectedSubject: string;
    setSelectedSubject?: (s: string) => void;
    selectedClass: string;
    setSelectedClass?: (c: string) => void;
    classSchedules?: Record<string, string[]>;
    calendarEvents?: CalendarEvent[];
    academicYearStart?: number;
    schoolDaysCount?: 5 | 6;
    identity: UserIdentity;
    data?: CurriculumData | null;
    activities?: ActivityLog[];
    onNavigate?: (view: any) => void;
}> = ({ 
    selectedSubject, 
    setSelectedSubject, 
    selectedClass, 
    setSelectedClass,
    classSchedules = {},
    calendarEvents = [],
    academicYearStart = 2025,
    schoolDaysCount = 6,
    identity,
    data,
    activities,
    onNavigate
}) => {
    const [viewMode, setViewMode] = useState<'list' | 'assess' | 'history'>('list');
    const [selectedAtpIds, setSelectedAtpIds] = useState<Record<string, boolean>>({});
    const [activeAssessmentAtp, setActiveAssessmentAtp] = useState<DisplayAtpItem | null>(null);
    const [assessmentDate, setAssessmentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
    const [expandedHistoryIds, setExpandedHistoryIds] = useState<Record<string, boolean>>({});
    const [searchHistory, setSearchHistory] = useState<string>('');
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

    const notify = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3500);
    };

    // Scheduled subjects list
    const scheduledSubjects = useMemo(() => {
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
    }, [selectedClass]);

    // Active Subject
    const currentSubject = useMemo(() => {
        if (scheduledSubjects.includes(selectedSubject)) return selectedSubject;
        return scheduledSubjects[0] || selectedSubject;
    }, [scheduledSubjects, selectedSubject]);

    // Storage keys
    const historyStorageKey = `kktp_history_${selectedClass}_${currentSubject}`;
    const studentsStorageKey = `prota_students_${selectedClass}`;

    // Load History
    const [kktpHistory, setKktpHistory] = useState<KKTPRecord[]>(() => {
        try {
            const saved = localStorage.getItem(`kktp_history_${selectedClass}_${currentSubject}`);
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return [];
    });

    // Reload history when subject or class changes
    useEffect(() => {
        try {
            const saved = localStorage.getItem(historyStorageKey);
            if (saved) {
                setKktpHistory(JSON.parse(saved));
            } else {
                setKktpHistory([]);
            }
        } catch (e) {
            setKktpHistory([]);
        }
    }, [historyStorageKey]);

    // Save history helper
    const saveKktpHistory = (records: KKTPRecord[]) => {
        setKktpHistory(records);
        try {
            localStorage.setItem(historyStorageKey, JSON.stringify(records));
        } catch (e) {}
    };

    // Load students
    const [students, setStudents] = useState<StudentRecord[]>(() => {
        try {
            const saved = localStorage.getItem(studentsStorageKey);
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return [
            { id: '1', name: 'Adittia', gender: 'L', nisn: '0123456701', nis: '1001', notes: 'Aktif' },
            { id: '2', name: 'Alfath Fatir Abdurahman', gender: 'L', nisn: '0123456702', nis: '1002', notes: 'Aktif' },
            { id: '3', name: 'Algifari Ramdan', gender: 'L', nisn: '0123456703', nis: '1003', notes: 'Aktif' },
            { id: '4', name: 'Alvino Febriansyah', gender: 'L', nisn: '0123456704', nis: '1004', notes: 'Aktif' },
            { id: '5', name: 'Fauzan Nizam', gender: 'L', nisn: '0123456705', nis: '1005', notes: 'Aktif' },
            { id: '6', name: 'Nur Rizki Firdaus', gender: 'L', nisn: '0123456706', nis: '1006', notes: 'Aktif' },
            { id: '7', name: 'Muhammad Kaysa Nadeem Saputra', gender: 'L', nisn: '0123456707', nis: '1007', notes: 'Aktif' }
        ];
    });

    useEffect(() => {
        try {
            const saved = localStorage.getItem(studentsStorageKey);
            if (saved) {
                setStudents(JSON.parse(saved));
            }
        } catch (e) {}
    }, [studentsStorageKey]);

    // Extract ATPs for active subject ONLY from generated & saved PROTA
    const atpList: DisplayAtpItem[] = useMemo(() => {
        let activeCurriculum: CurriculumData | null = null;
        if (data && data.elements && data.subject?.toLowerCase().trim() === currentSubject.toLowerCase().trim()) {
            activeCurriculum = data;
        } else if (activities && activities.length > 0) {
            const match = activities.find(act => 
                (act.type === 'ATP_JP' || act.type === 'CP_TP') && 
                act.subject?.toLowerCase().trim() === currentSubject.toLowerCase().trim() &&
                act.dataSnapshot && Array.isArray(act.dataSnapshot.elements)
            );
            if (match && match.dataSnapshot) {
                activeCurriculum = match.dataSnapshot;
            }
        }

        let extractedItems: DisplayAtpItem[] = [];
        if (activeCurriculum && Array.isArray(activeCurriculum.elements)) {
            let counter = 1;
            activeCurriculum.elements.forEach((el, elIdx) => {
                (el.allocations || []).forEach((alloc) => {
                    const matchesClass = isSameClass(alloc.className, selectedClass) || !alloc.className;
                    if (matchesClass && alloc.structuredAtp && alloc.structuredAtp.length > 0) {
                        alloc.structuredAtp.forEach((grp, grpIdx) => {
                            (grp.atpItems || []).forEach((item, itemIdx) => {
                                const rawTopic = item.alur ? item.alur.replace(/^-\s*/, '') : grp.tp;
                                const dateStr = item.planDate || '';
                                let formattedDate = 'Tanggal belum dijadwalkan';
                                let dayNumber = `${counter}`;
                                if (dateStr) {
                                    try {
                                        const d = new Date(dateStr);
                                        if (!isNaN(d.getTime())) {
                                            const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                                            const indonesianMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
                                            formattedDate = `${indonesianDays[d.getDay()]}, ${d.getDate()} ${indonesianMonths[d.getMonth()]} ${d.getFullYear()}`;
                                            dayNumber = `${d.getDate()}`;
                                        } else {
                                            formattedDate = dateStr;
                                        }
                                    } catch (e) {
                                        formattedDate = dateStr;
                                    }
                                }

                                extractedItems.push({
                                    id: `ext-${elIdx}-${grpIdx}-${itemIdx}`,
                                    no: counter++,
                                    element: el.elementName,
                                    title: rawTopic,
                                    rawTopic: rawTopic,
                                    dateStr,
                                    formattedDate,
                                    dayNumber,
                                    processed: false
                                });
                            });
                        });
                    }
                });
            });
        }

        // Mark processed items from history
        return extractedItems.map(item => {
            const isProcessed = kktpHistory.some(h => 
                h.atpId === item.id || 
                h.atpTitle.trim().toLowerCase() === item.title.trim().toLowerCase()
            );
            return { ...item, processed: isProcessed };
        });
    }, [currentSubject, selectedClass, data, activities, kktpHistory]);

    // Selected ATP count
    const selectedAtpCount = useMemo(() => {
        return Object.values(selectedAtpIds).filter(Boolean).length;
    }, [selectedAtpIds]);

    const handleSelectAll = (checked: boolean) => {
        const next: Record<string, boolean> = {};
        if (checked) {
            atpList.forEach(item => {
                next[item.id] = true;
            });
        }
        setSelectedAtpIds(next);
    };

    const handleToggleAtp = (id: string) => {
        setSelectedAtpIds(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Assessment State
    const [assessmentScores, setAssessmentScores] = useState<KKTPStudentScore[]>([]);

    const startAssessment = () => {
        const selectedList = atpList.filter(item => selectedAtpIds[item.id]);
        if (selectedList.length === 0) {
            notify("Silakan pilih minimal 1 ATP untuk dinilai.", "info");
            return;
        }

        const targetAtp = selectedList[0];
        setActiveAssessmentAtp(targetAtp);
        setAssessmentDate(targetAtp.dateStr || new Date().toISOString().split('T')[0]);

        // Init scores
        const initScores: KKTPStudentScore[] = students.map(st => ({
            studentId: st.id,
            studentName: st.name,
            gender: st.gender || 'L',
            nisn: st.nisn,
            nis: st.nis,
            criteria: 'Baik',
            description: generateStudentDescription(targetAtp.title, 'Baik')
        }));
        setAssessmentScores(initScores);
        setViewMode('assess');
    };

    const handleScoreCriteriaChange = (index: number, criteria: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan') => {
        if (!activeAssessmentAtp) return;
        setAssessmentScores(prev => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                criteria,
                description: generateStudentDescription(activeAssessmentAtp.title, criteria)
            };
            return updated;
        });
    };

    const handleScoreDescChange = (index: number, description: string) => {
        setAssessmentScores(prev => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                description
            };
            return updated;
        });
    };

    const handleBatchCriteria = (criteria: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan') => {
        if (!activeAssessmentAtp) return;
        setAssessmentScores(prev => prev.map(s => ({
            ...s,
            criteria,
            description: generateStudentDescription(activeAssessmentAtp.title, criteria)
        })));
        notify(`Semua siswa diatur ke predikat: ${criteria}`);
    };

    const handleSaveAssessment = () => {
        if (!activeAssessmentAtp) return;

        const rubric = generateSoloRubric(activeAssessmentAtp.title);
        
        let formattedDateStr = assessmentDate;
        let dayNum = '1';
        try {
            const d = new Date(assessmentDate);
            if (!isNaN(d.getTime())) {
                const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                const indonesianMonths = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                formattedDateStr = `${indonesianDays[d.getDay()]}, ${d.getDate()} ${indonesianMonths[d.getMonth()]} ${d.getFullYear()}`;
                dayNum = `${d.getDate()}`;
            }
        } catch (e) {}

        const newRecord: KKTPRecord = {
            id: `kktp-${Date.now()}`,
            subject: currentSubject,
            className: selectedClass,
            date: assessmentDate,
            formattedDate: formattedDateStr,
            dayNumber: dayNum,
            element: activeAssessmentAtp.element,
            atpId: activeAssessmentAtp.id,
            atpTitle: activeAssessmentAtp.title,
            rubric,
            studentScores: assessmentScores,
            createdAt: new Date().toISOString()
        };

        const updatedHistory = [newRecord, ...kktpHistory.filter(h => h.atpId !== activeAssessmentAtp.id)];
        saveKktpHistory(updatedHistory);
        notify("Penilaian KKTP berhasil disimpan!");
        setViewMode('history');
    };

    const handleDeleteRecord = (id: string) => {
        if (confirm("Apakah Anda yakin ingin menghapus catatan penilaian KKTP ini?")) {
            const updated = kktpHistory.filter(h => h.id !== id);
            saveKktpHistory(updated);
            notify("Catatan penilaian KKTP telah dihapus.");
        }
    };

    const handleDeleteAllHistory = () => {
        if (confirm(`Apakah Anda yakin ingin menghapus seluruh riwayat KKTP ${currentSubject} (${selectedClass})?`)) {
            saveKktpHistory([]);
            notify("Seluruh riwayat KKTP telah dibersihkan.");
        }
    };

    // Word Document (.doc) Export
    const downloadDocFile = (record: KKTPRecord) => {
        const schoolName = identity.institutionName || 'SDN SUKATINGGAL';
        const academicYear = identity.academicYear || '2026/2027';
        const semester = identity.semester || 'Ganjil';
        const headmaster = identity.kepalaSekolah || 'Yuni Sri Rahayu, M.Pd.';
        const headmasterNip = identity.nipKepalaSekolah || '198706162019032007';
        const teacherName = identity.authorName || 'Acep Miftah Hilah Ash-shidiq, S.Pd.';
        const teacherNip = identity.nip || '199602152025211094';

        const html = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset="utf-8">
            <title>Penilaian KKTP - ${record.atpTitle}</title>
            <style>
                @page {
                    size: 21.0cm 29.7cm;
                    margin: 2.0cm 2.0cm 2.0cm 2.0cm;
                    mso-page-orientation: portrait;
                }
                body {
                    font-family: 'Times New Roman', Times, serif;
                    font-size: 11pt;
                    line-height: 1.3;
                    color: #000;
                }
                .header-title {
                    text-align: center;
                    font-weight: bold;
                    font-size: 13pt;
                    margin-bottom: 2px;
                    text-transform: uppercase;
                }
                .header-sub {
                    text-align: center;
                    font-weight: bold;
                    font-size: 12pt;
                    margin-bottom: 15px;
                    text-transform: uppercase;
                }
                .meta-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 15px;
                    font-size: 10.5pt;
                }
                .meta-table td {
                    padding: 3px 0;
                    vertical-align: top;
                }
                .table-data {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                    margin-bottom: 15px;
                    font-size: 10pt;
                }
                .table-data th {
                    border: 1px solid #000;
                    padding: 6px 4px;
                    background-color: #f2f2f2;
                    text-align: center;
                    font-weight: bold;
                }
                .table-data td {
                    border: 1px solid #000;
                    padding: 5px 6px;
                    vertical-align: top;
                }
                .rubric-box {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                    margin-bottom: 15px;
                    font-size: 9.5pt;
                }
                .rubric-box th {
                    border: 1px solid #000;
                    padding: 5px;
                    background-color: #e6f4ea;
                    text-align: center;
                    font-weight: bold;
                }
                .rubric-box td {
                    border: 1px solid #000;
                    padding: 6px;
                    vertical-align: top;
                }
                .sig-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 30px;
                    font-size: 11pt;
                }
                .sig-table td {
                    text-align: center;
                    vertical-align: top;
                    padding: 0;
                }
            </style>
        </head>
        <body>
            <div class="header-title">PENILAIAN KRITERIA KETUNTASAN TUJUAN PEMBELAJARAN (KKTP)</div>
            <div class="header-sub">${schoolName} â€” ${record.className.toUpperCase()}</div>

            <table class="meta-table">
                <tr>
                    <td style="width: 22%;"><b>Mata Pelajaran</b></td>
                    <td style="width: 3%;">:</td>
                    <td style="width: 45%;">${record.subject}</td>
                    <td style="width: 15%;"><b>Tahun Ajaran</b></td>
                    <td style="width: 3%;">:</td>
                    <td style="width: 12%;">${academicYear}</td>
                </tr>
                <tr>
                    <td><b>Fase / Kelas</b></td>
                    <td>:</td>
                    <td>${record.className}</td>
                    <td><b>Semester</b></td>
                    <td>:</td>
                    <td>${semester}</td>
                </tr>
                <tr>
                    <td><b>Elemen</b></td>
                    <td>:</td>
                    <td colspan="4">${record.element}</td>
                </tr>
                <tr>
                    <td><b>Alur Tujuan Pembelajaran</b></td>
                    <td>:</td>
                    <td colspan="4"><b>${record.atpTitle}</b></td>
                </tr>
                <tr>
                    <td><b>Hari / Tanggal</b></td>
                    <td>:</td>
                    <td colspan="4">${record.formattedDate}</td>
                </tr>
            </table>

            <div style="font-weight: bold; font-size: 10.5pt; margin-top: 10px; margin-bottom: 4px;">A. Rubrik Penilaian (SOLO Taxonomy)</div>
            <table class="rubric-box">
                <thead>
                    <tr>
                        <th style="width: 25%;">PERLU BIMBINGAN (0 - 60)</th>
                        <th style="width: 25%;">CUKUP (61 - 70)</th>
                        <th style="width: 25%;">BAIK (71 - 85)</th>
                        <th style="width: 25%;">SANGAT BAIK (86 - 100)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${record.rubric.perluBimbingan}</td>
                        <td>${record.rubric.cukup}</td>
                        <td>${record.rubric.baik}</td>
                        <td>${record.rubric.sangatBaik}</td>
                    </tr>
                </tbody>
            </table>

            <div style="font-weight: bold; font-size: 10.5pt; margin-top: 15px; margin-bottom: 4px;">B. Hasil Penilaian Ketercapaian Peserta Didik</div>
            <table class="table-data">
                <thead>
                    <tr>
                        <th style="width: 5%;">NO</th>
                        <th style="width: 28%;">NAMA SISWA</th>
                        <th style="width: 6%;">JK</th>
                        <th style="width: 18%;">KRITERIA PENILAIAN</th>
                        <th style="width: 43%;">DESKRIPSI KETERCAPAIAN</th>
                    </tr>
                </thead>
                <tbody>
                    ${record.studentScores.map((st, i) => `
                        <tr>
                            <td style="text-align: center;">${i + 1}</td>
                            <td><b>${st.studentName}</b></td>
                            <td style="text-align: center;">${st.gender || '-'}</td>
                            <td style="text-align: center; font-weight: bold;">${st.criteria}</td>
                            <td>${st.description}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <table class="sig-table">
                <tr>
                    <td style="width: 50%;">
                        Mengetahui,<br/>
                        Kepala Sekolah ${schoolName}
                        <br/><br/><br/><br/><br/>
                        <b><u>${headmaster}</u></b><br/>
                        NIP. ${headmasterNip}
                    </td>
                    <td style="width: 50%;">
                        Ditetapkan di Sukatinggal,<br/>
                        Guru Mata Pelajaran / Kelas
                        <br/><br/><br/><br/><br/>
                        <b><u>${teacherName}</u></b><br/>
                        NIP. ${teacherNip}
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;

        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const sanitizedTitle = record.atpTitle.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
        a.download = `KKTP_${record.className}_${record.subject.replace(/[^a-zA-Z0-9]/g, '_')}_${sanitizedTitle}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        notify("Dokumen Word KKTP berhasil diunduh!");
    };

    // Filtered history list
    const filteredHistory = useMemo(() => {
        if (!searchHistory.trim()) return kktpHistory;
        const q = searchHistory.toLowerCase();
        return kktpHistory.filter(h => 
            h.atpTitle.toLowerCase().includes(q) || 
            h.formattedDate.toLowerCase().includes(q) ||
            h.element.toLowerCase().includes(q)
        );
    }, [kktpHistory, searchHistory]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            {/* Toast Notification */}
            {notification && (
                <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-2 text-sm font-medium">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>{notification.message}</span>
                </div>
            )}

            {/* Top Navigation Bar: Header + Main Actions */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 md:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
                                <Target className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                                    {viewMode === 'assess' ? 'Penilaian KKTP' : 'KKTP'}
                                </h1>
                                <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                                    {viewMode === 'assess' 
                                        ? `${selectedClass} â€¢ ${selectedAtpCount || 1} ATP terpilih â€¢ ${currentSubject}`
                                        : 'Pilih ATP untuk menentukan Kriteria Ketuntasan Tujuan Pembelajaran.'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons depending on mode */}
                    {viewMode === 'list' && (
                        <div className="flex flex-wrap items-center gap-2.5">
                            <button
                                onClick={() => setViewMode('history')}
                                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
                            >
                                <FileText className="w-4 h-4 text-slate-500" />
                                <span>Riwayat KKTP</span>
                                {kktpHistory.length > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                                        {kktpHistory.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    if (atpList.length > 0) {
                                        notify("Sinkronisasi ATP dengan kalender hari efektif selesai!");
                                    } else {
                                        notify("Data PROTA belum ditemukan untuk mata pelajaran ini. Silakan buat di Program Tahunan.", "info");
                                    }
                                }}
                                className="px-4 py-2.5 bg-white hover:bg-emerald-50/50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
                            >
                                <RefreshCw className="w-4 h-4 text-emerald-600" />
                                <span>Sinkron ATP</span>
                            </button>
                            <button
                                onClick={startAssessment}
                                disabled={selectedAtpCount === 0}
                                className={`px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                                    selectedAtpCount > 0 
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200' 
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                }`}
                            >
                                <PenLine className="w-4 h-4" />
                                <span>Buat KKTP ({selectedAtpCount} ATP)</span>
                            </button>
                        </div>
                    )}

                    {viewMode === 'assess' && (
                        <div className="flex flex-wrap items-center gap-2.5">
                            <button
                                onClick={() => {
                                    if (confirm("Reset seluruh data penilaian siswa ke awal?")) {
                                        handleBatchCriteria('Baik');
                                    }
                                }}
                                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                                <span>Clear Data</span>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5 text-slate-400" />
                                <span>Batal</span>
                            </button>
                            <button
                                onClick={handleSaveAssessment}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                            >
                                <Check className="w-4 h-4" />
                                <span>Simpan</span>
                            </button>
                        </div>
                    )}

                    {viewMode === 'history' && (
                        <div className="flex flex-wrap items-center gap-2.5">
                            <button
                                onClick={() => setViewMode('list')}
                                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Kembali ke ATP</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Subject Selector Buttons Row (Replaces Class Buttons as requested) */}
                {viewMode !== 'assess' && (
                    <div className="mt-5">
                        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-600">
                            <span>Pilih Mata Pelajaran:</span>
                            <span className="text-slate-400 font-normal">({selectedClass})</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {scheduledSubjects.map((subj) => {
                                const isCurrent = currentSubject === subj;
                                return (
                                    <button
                                        key={subj}
                                        onClick={() => {
                                            if (setSelectedSubject) {
                                                setSelectedSubject(subj);
                                            }
                                            setSelectedAtpIds({});
                                        }}
                                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                            isCurrent
                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/80'
                                        }`}
                                    >
                                        {subj}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* VIEW 1: ATP SELECTION LIST (Image 1) */}
                {viewMode === 'list' && (
                    <div className="mt-6">
                        {atpList.length > 0 ? (
                            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="p-3 text-center w-12">
                                                <input 
                                                    type="checkbox"
                                                    checked={atpList.length > 0 && selectedAtpCount === atpList.length}
                                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                                    title="Pilih Semua"
                                                />
                                            </th>
                                            <th className="p-3 text-center w-12 text-slate-500">NO</th>
                                            <th className="p-3 w-48 text-slate-700">ELEMEN</th>
                                            <th className="p-3 text-slate-700">
                                                ALUR TUJUAN PEMBELAJARAN (TOTAL: {atpList.length} ATP)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium">
                                        {atpList.map((item, index) => {
                                            const isChecked = !!selectedAtpIds[item.id];
                                            const isEvenGroup = Math.floor(index / 4) % 2 === 0;
                                            const rowBg = isChecked 
                                                ? 'bg-emerald-50/60' 
                                                : (isEvenGroup ? 'bg-rose-50/20 hover:bg-rose-50/40' : 'bg-purple-50/20 hover:bg-purple-50/40');

                                            return (
                                                <tr key={item.id} className={`${rowBg} transition-colors`}>
                                                    <td className="p-3.5 text-center">
                                                        <input 
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => handleToggleAtp(item.id)}
                                                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="p-3.5 text-center text-slate-500 font-bold">
                                                        {item.no}
                                                    </td>
                                                    <td className="p-3.5 font-bold text-slate-900">
                                                        {item.element}
                                                    </td>
                                                    <td className="p-3.5 space-y-1.5">
                                                        <div className="font-bold text-slate-900 text-[13px] leading-snug">
                                                            {item.title}
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="text-emerald-700 font-semibold text-[11px]">
                                                                {item.formattedDate}
                                                            </span>
                                                            {item.processed && (
                                                                <span className="px-2 py-0.5 bg-slate-200/70 text-slate-700 font-bold rounded-md text-[10px]">
                                                                    Sudah Diproses
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto space-y-4">
                                <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto text-amber-600 shadow-2xs">
                                    <BookMarked className="w-7 h-7" />
                                </div>
                                <div className="space-y-1.5">
                                    <h3 className="text-base md:text-lg font-bold text-slate-800">
                                        Data PROTA Belum Tersedia untuk {currentSubject} ({selectedClass})
                                    </h3>
                                    <p className="text-xs md:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
                                        Tabel Elemen, Alur Tujuan Pembelajaran (ATP), dan jadwal tanggal pelaksanaan hanya dimuat setelah Anda membuat atau menghasilkan Program Tahunan (PROTA) pada mata pelajaran ini dan menyimpannya.
                                    </p>
                                </div>
                                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                                    {onNavigate && (
                                        <button
                                            onClick={() => onNavigate('generator')}
                                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                                        >
                                            <PenLine className="w-4 h-4" />
                                            <span>Buat PROTA di Program Tahunan</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setViewMode('history')}
                                        className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
                                    >
                                        <FileText className="w-4 h-4 text-slate-500" />
                                        <span>Lihat Riwayat KKTP ({kktpHistory.length})</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* VIEW 2: PENILAIAN KKTP FORM (Image 2) */}
                {viewMode === 'assess' && activeAssessmentAtp && (
                    <div className="mt-6 space-y-6">
                        {/* Rubrik Penilaian SOLO Taxonomy Card */}
                        <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-5 md:p-6 space-y-3">
                            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                                <Table className="w-4 h-4 text-emerald-600" />
                                <span>Rubrik Penilaian (SOLO Taxonomy)</span>
                            </div>
                            <div className="text-xs font-bold text-slate-800 border-b border-emerald-200/50 pb-2">
                                {activeAssessmentAtp.title}
                            </div>
                            
                            {(() => {
                                const rubric = generateSoloRubric(activeAssessmentAtp.title);
                                return (
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1 text-xs">
                                        <div className="p-3 bg-white/80 rounded-xl border border-emerald-100">
                                            <div className="font-bold text-red-700 mb-1 text-[11px]">PERLU BIMBINGAN</div>
                                            <div className="text-slate-600 leading-relaxed text-[11px]">{rubric.perluBimbingan}</div>
                                        </div>
                                        <div className="p-3 bg-white/80 rounded-xl border border-emerald-100">
                                            <div className="font-bold text-amber-700 mb-1 text-[11px]">CUKUP</div>
                                            <div className="text-slate-600 leading-relaxed text-[11px]">{rubric.cukup}</div>
                                        </div>
                                        <div className="p-3 bg-white/80 rounded-xl border border-emerald-100">
                                            <div className="font-bold text-blue-700 mb-1 text-[11px]">BAIK</div>
                                            <div className="text-slate-600 leading-relaxed text-[11px]">{rubric.baik}</div>
                                        </div>
                                        <div className="p-3 bg-white/80 rounded-xl border border-emerald-100">
                                            <div className="font-bold text-emerald-700 mb-1 text-[11px]">SANGAT BAIK</div>
                                            <div className="text-slate-600 leading-relaxed text-[11px]">{rubric.sangatBaik}</div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Date Picker & Selected ATP Bar */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    HARI / TANGGAL
                                </label>
                                <input 
                                    type="date"
                                    value={assessmentDate}
                                    onChange={(e) => setAssessmentDate(e.target.value)}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-emerald-500"
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    ATP TERPILIH
                                </label>
                                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-950 truncate">
                                    {activeAssessmentAtp.title}
                                </div>
                            </div>
                        </div>

                        {/* Quick Action Buttons for Batch Grading */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                            <span className="text-xs font-bold text-slate-600">Aksi Cepat Penilaian:</span>
                            <div className="flex flex-wrap gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => handleBatchCriteria('Sangat Baik')}
                                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                >
                                    Semua Sangat Baik
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleBatchCriteria('Baik')}
                                    className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                >
                                    Semua Baik
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleBatchCriteria('Cukup')}
                                    className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                >
                                    Semua Cukup
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleBatchCriteria('Perlu Bimbingan')}
                                    className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                >
                                    Semua Perlu Bimbingan
                                </button>
                            </div>
                        </div>

                        {/* Student Assessment Table */}
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="p-3 text-center w-12">NO</th>
                                        <th className="p-3 w-56">NAMA SISWA</th>
                                        <th className="p-3 text-center w-14">JK</th>
                                        <th className="p-3 w-44">KRITERIA PENILAIAN</th>
                                        <th className="p-3">DESKRIPSI KETERCAPAIAN</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {assessmentScores.map((st, idx) => (
                                        <tr key={st.studentId} className="hover:bg-slate-50/70">
                                            <td className="p-3 text-center text-slate-500 font-bold">
                                                {idx + 1}
                                            </td>
                                            <td className="p-3 font-bold text-slate-900">
                                                {st.studentName}
                                            </td>
                                            <td className="p-3 text-center text-slate-600 font-semibold">
                                                {st.gender}
                                            </td>
                                            <td className="p-3">
                                                <select
                                                    value={st.criteria}
                                                    onChange={(e) => handleScoreCriteriaChange(idx, e.target.value as any)}
                                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
                                                >
                                                    <option value="Sangat Baik">Sangat Baik</option>
                                                    <option value="Baik">Baik</option>
                                                    <option value="Cukup">Cukup</option>
                                                    <option value="Perlu Bimbingan">Perlu Bimbingan</option>
                                                </select>
                                            </td>
                                            <td className="p-3">
                                                <input 
                                                    type="text"
                                                    value={st.description}
                                                    onChange={(e) => handleScoreDescChange(idx, e.target.value)}
                                                    className="w-full p-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:bg-white focus:border-emerald-500 font-normal"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* VIEW 3: RIWAYAT KKTP (Image 3) */}
                {viewMode === 'history' && (
                    <div className="mt-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <div className="font-bold text-slate-800 text-sm">
                                Riwayat KKTP {selectedClass} â€” {currentSubject}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                                    <input 
                                        type="text"
                                        placeholder="Cari riwayat..."
                                        value={searchHistory}
                                        onChange={(e) => setSearchHistory(e.target.value)}
                                        className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-emerald-500 w-44"
                                    />
                                </div>
                                {kktpHistory.length > 0 && (
                                    <button
                                        onClick={handleDeleteAllHistory}
                                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 flex items-center gap-1.5 transition-all cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Hapus Semua Riwayat</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {filteredHistory.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-slate-200/80 space-y-2">
                                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                                <div className="text-sm font-bold text-slate-700">Belum ada riwayat penilaian KKTP</div>
                                <p className="text-xs text-slate-500 max-w-md mx-auto">
                                    Pilih ATP pada tab utama dan klik tombol "Buat KKTP" untuk melakukan penilaian ketercapaian siswa.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredHistory.map((rec) => {
                                    const isExpanded = !!expandedHistoryIds[rec.id];

                                    return (
                                        <div key={rec.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all">
                                            {/* Accordion Header Row */}
                                            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/40 hover:bg-slate-50">
                                                <div className="flex items-center gap-3.5">
                                                    {/* Day circle */}
                                                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center shrink-0 border border-emerald-200">
                                                        {rec.dayNumber || '20'}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-900">
                                                            {rec.formattedDate}
                                                        </div>
                                                        <div className="text-xs text-slate-600 line-clamp-1 font-medium mt-0.5">
                                                            {rec.atpTitle}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 self-end md:self-center">
                                                    {/* Unduh Word Button */}
                                                    <button
                                                        onClick={() => downloadDocFile(rec)}
                                                        title="Unduh Dokumen Word (.doc)"
                                                        className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200 transition-all cursor-pointer"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>

                                                    {/* Delete record */}
                                                    <button
                                                        onClick={() => handleDeleteRecord(rec.id)}
                                                        title="Hapus Catatan"
                                                        className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-200 transition-all cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>

                                                    {/* Expand / Collapse Toggle */}
                                                    <button
                                                        onClick={() => setExpandedHistoryIds(prev => ({
                                                            ...prev,
                                                            [rec.id]: !prev[rec.id]
                                                        }))}
                                                        className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 transition-all cursor-pointer"
                                                    >
                                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Expanded Accordion Body */}
                                            {isExpanded && (
                                                <div className="p-5 border-t border-slate-100 space-y-5 bg-white">
                                                    {/* Table of Students & Criteria Badges */}
                                                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                                                        <table className="w-full text-left text-xs border-collapse">
                                                            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                                                                <tr>
                                                                    <th className="p-2.5 w-48">NAMA</th>
                                                                    <th className="p-2.5 w-32 text-center">PREDIKAT</th>
                                                                    <th className="p-2.5">DESKRIPSI</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100 font-medium">
                                                                {rec.studentScores.map((st) => {
                                                                    let badgeBg = 'bg-blue-50 text-blue-700 border-blue-200';
                                                                    if (st.criteria === 'Sangat Baik') badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                                                    if (st.criteria === 'Cukup') badgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
                                                                    if (st.criteria === 'Perlu Bimbingan') badgeBg = 'bg-rose-50 text-rose-700 border-rose-200';

                                                                    return (
                                                                        <tr key={st.studentId} className="hover:bg-slate-50/50">
                                                                            <td className="p-2.5 font-bold text-slate-900">
                                                                                {st.studentName}
                                                                            </td>
                                                                            <td className="p-2.5 text-center">
                                                                                <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] border ${badgeBg}`}>
                                                                                    {st.criteria}
                                                                                </span>
                                                                            </td>
                                                                            <td className="p-2.5 text-slate-600 text-[11px] leading-relaxed">
                                                                                {st.description}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {/* Rubrik Penilaian Box */}
                                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                                                        <div className="flex items-center gap-2 font-bold text-slate-800">
                                                            <Table className="w-3.5 h-3.5 text-slate-500" />
                                                            <span>Rubrik Penilaian (SOLO Taxonomy)</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-1 text-[11px]">
                                                            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                                                                <div className="font-bold text-red-700 mb-0.5">PERLU BIMBINGAN</div>
                                                                <div className="text-slate-600">{rec.rubric.perluBimbingan}</div>
                                                            </div>
                                                            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                                                                <div className="font-bold text-amber-700 mb-0.5">CUKUP</div>
                                                                <div className="text-slate-600">{rec.rubric.cukup}</div>
                                                            </div>
                                                            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                                                                <div className="font-bold text-blue-700 mb-0.5">BAIK</div>
                                                                <div className="text-slate-600">{rec.rubric.baik}</div>
                                                            </div>
                                                            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                                                                <div className="font-bold text-emerald-700 mb-0.5">SANGAT BAIK</div>
                                                                <div className="text-slate-600">{rec.rubric.sangatBaik}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Jurnal View Component ---
const JurnalView: React.FC<{
    selectedSubject: string;
    setSelectedSubject?: (subject: string) => void;
    selectedClass: string;
    setSelectedClass?: (className: string) => void;
    classSchedules?: Record<string, any>;
    calendarEvents?: CalendarEvent[];
    academicYearStart?: number;
    schoolDaysCount?: number;
    identity: UserIdentity;
    data?: CurriculumData | null;
    activities?: ActivityLog[];
    onNavigate?: (view: any) => void;
}> = ({ 
    selectedSubject: initialSubject, 
    setSelectedSubject, 
    selectedClass, 
    setSelectedClass,
    classSchedules,
    calendarEvents = [],
    academicYearStart = 2026,
    schoolDaysCount = 6,
    identity,
    data,
    activities,
    onNavigate
}) => {
    // Scheduled subjects from weekly roster
    const scheduledSubjects = useMemo(() => {
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
    }, [selectedClass]);

    const [activeSubject, setActiveSubject] = useState<string>(() => {
        if (schedxœì½ëzÛ8²(ú?OöôDÒD–ï¹(q²ÛI_¥LŸ9o›–h‹Ejx‰ãvûûöCœ'<Orª
 	€ %Ùéž^kf:–H\
…ªBU¡PH}wÐM/¿ºý$nyAßOn\÷/ñ_¼h4Xä&i0ýùë'L|Äë¸?t©Òâéòûí7¶ðÞ:±ÃvƒA¸±ç,ðª÷×OèK?â„`à»]×‡ª¢¶Éê1|m³8‰¼àºÁ6ß²»¬ßØM:ýÄûæŠâT¶‘Ãå]Au7áMf`5Xñ™Zó^@µ´ÄºîØ7‚îÄm³ è£|õü&[ÅïnàL”!œÆ¢B“÷ÁœAÉ4v»ØÆ›ö[}[¯Cáõ#ç*Aqoà‰—Ü¾kÉ‘5Þw­€ù:¯˜Ï`mµÖÀâyî‡7n´åÄn½¡”ºFøk0Áï`80<ë¼HVÂ Æ ÝiÖÿãÃCgØ©}N}¯Öä`²Ýïmö¼Én]'j3§ïÜ±×ÿüLD	»o–4Ó¹Nã$–^< ¥®;IÜñ¥m½|@[G£$,¶ôê-†ßl@­,? ­m7¶¶µ2µ­3ë$¯NŸd'HÈœç
ØŸÛ”ÂÿÁ½Œ,ÍU€_ÙÜa´µúÀ¶:“xMokí¡p¹æ×ØÒç40›Ú˜©)}¾ûiˆá³½ïÅ(j3Q³¹¹	õÞ8¿m’Ék]öq‘J¯vß›ªœ•5Y¤Hºoë+×(m·Ý+'õ&øŸ-1IJ7	|jîèò+´VIZ„ŠÅ–ÏrA&Þ•×w/X:q¢ŽŒ¸qì\»4ªžò@_¦@Ä©ï¿­ã¿×…¦z·¥ü¥5R‹Ó~¯A;5/¸
éËÐvím={¯5ànqÅÇ×rÁl²Z²©l*åm–Xu°Ø¶²ÀªC¨cOùŠ`D;WW¸¼šË®Ì*VÊ»|Hœ(“ž7vÃT6bBD8n²µåe2üÈÅ‘ªõ}`
ÙR¢”¼ç7õi>k(Z@’âr3ùä*Œ˜“$n0p‚¾ËúŽßO}"œX•§¢N7	#hnÏÅ™¹˜DaâœËwç?ßIRÝò8¾¿ÐùIã|$~h„"ž¸ý0œžµŠ$ºµ"6v¾¹hÉ|bëÚMvaµ¬A7ðJj¶)†Ÿ»G‡­‰zÁ_(è%ý!«ãß›ŠË©Öðè=@«+ ß/àëòÊêÚúÆóËâ¾]æ?„x	è¤ð t™B°¶oÃÄÅÂ0EM•¦J?«–~VÕ~V•~ü+'²0Ñë\ÒÈŽàAý®Yú]Sû]Sû½ö®@²g<x`ë–þÖÕþÖÕþ¾yAH‚×s‚øÖ>¨ËK—j—y—œôW'`‡Þ¯ÎøA=·tö\íìyÞÙa±ï×‘Ç>xÑÀ!-sþ_Xz|¡öø"ïñ :ã±3`{Î-A‡°DƒŠßu&iÍA·g†n^.[w¦WÄQ½ÀùÕ¬b¶Ø•*l;¹h=p`û¢”Ê±‘{«
Xn¸mX¸tuTS°¹ßé»õ¥Óÿí,þÚYü–_-Á‚X;××Í\–Ûduþö|Là„6>Ða1äxÞÉóŽñP“ë\ ¿‘K¸ñ³ö‰ï.ý»Kÿvjoßþ éoCÇï'ÿïî_²žo4zóø±ÌT%ÉëÃÓŸßOÃ‰­³»{©R5UJ²óÎ/®;òoYWøaHUÉœ2l ò‡ÜÊŠB¡7TMÖj›ô&_tý0%ƒê;Ì	Fã@œG!šEÍèw$A­áZ×•¸Öf§w,ñH€/¿h¯-³E¶ü²½¾2Zp;¼1ýZ(°Y^Ëc½Wí½Ì­ÒÄa³¦	 ŒØ™‚c o `59c€%öa¥ö1P•{¾¢ç2žÝãNwÖÞ-Ø3{ÞsÆ^<c×Rg §š¤[ÏŸShkÖIø|´WÚçÊ†Vv/ ø”í¹}g.Bã0àÛÈÁ¹LfÅþAê$ÐÞ~8r|Vøí¦ 2À–Þv\ÐYsÏÎõus €åü”K$KUQôÁ¦ì!Ë‰iÙºžË²ÛPôCåà2ic©×u±BàÞ0ø&ØÛº"
x‚f«†¡õ¶Â4HÈí±Á4ô¿c§B"43Îl
ŽhJúlJr9Ó+·çªÜ”s}–ƒ›}Aˆ[€¿§?¬t<äã‚SçºX?äô¬ÑŠÃ1IæÅvðƒ²õ'|ÝŠ¥Ã\ˆÊ+ÇÝâb'&ãj5Ãë“1®[–JQ{µ ÁÍV]î=¬ÐôA30Èx%÷qÇ«äW•G+F;÷–Õ%Ç¥U/0¨®åõÙlÎ1’3TˆÍ&bïW—½eË@t(rn[WQŠ¹Q¬¡Õ™¢¨¨kKzÓ$u•Sw¾ƒÓé‹B—ìøä¨×aõÎ$©HÞõÏ
ãÒòÝI&Â‰XÆ­¾+}w[iyýÔOÇm–ßÆÞ¸ßYþèû8ÍÓ§ÿ¶@êŒÉ##’{g%¢Œé´eÎ³	-€…}©z…ü@Ðå¨Aò_-ß®“!N«ÝÅ5&ÍdS­r¢Dü_´ÐÓFƒªÁ¤>®!…ë/¶ŽÏ{ÇµBShKþ„AãÖ¶K]I7  §f/¦¿u³D6™­1Kr\AƒôEkÄÆ£–ù+V,åØ':å&0Ëï˜€UºW_Ã:š Ê,‚Í %»ïä#vŠ¦Ýé™NÍØlhÒJähšF§YÉlÁp}»¤‡-ÇG­œÜ—r}Õè•½&~vcR pã2î:c—~ñú­>~ÇÍ´{mÄòOF™¢|×&_öƒ<FÉiÄ©; 	Tò¸‚54ZjJL\G“r<dØ„R- ´j
¸ôÜ×ÖDŽÖÈ¹é…¯(…ª0MiCö=÷oüïÅÆ[í¡†KÂLìhÔFÝš¤ñ°>"üd„$#¾ÓœÎTY0‰Ól•$+µù åÏ©uÍÅ|ž÷eïîOÍ’÷…üˆ¥‘]ºTkLÑ¤%¦©,ÙR«xhÞãªÄ¡®¾
¡çËûç  sÀîEûÊßÚ<__éÍ9Lt`Ìïö"+\ô.ö0Ô'U¯c'Â8“7¢,ûÃ<\…1ÿî-˜ƒp òøwí}ç«¡ñ¹€v41w‘öw:'‡»‡ÏŽ¶wö»Ú®üÀ%p"{kò€í»|3Õßï7šZ92	
å¾·½¸~s§²úv7øWê•¼Ûö"ìa7àâ7QëÇ@Œb|ûNp§ÁµÖÛV$î÷$Úì¹ "&'PÜêí5Â	Ø°d@æ¥º½Î6˜·Ÿ½ëØ¹Ñ®âø=XÛÞ•¹Ú±Çê=çDoþ#ØcWÞ_>e;£xâÀ=˜
w¢cÔ%Þ(tå]ÐŠÜ Ë`þ¨¼²Ç³Œ¾–Jï¹‰õ‰ãd'î•ïŽ £âüw¶>íîü}ç`ç°w~tÜÛ=:4h 88µÞ¨6/,éÅ^|ã°ô|'f uÄzÇ [ü_Ó:}&î¬ü1:p|gÌê`à†Ä€u.c24ñŽœÛ0ò°õò®pöAòá>ïæÖ‹ ï'.ß-u|}rÓQ:Á1\:×ˆ•K7v"Ñ¾Òp^\LœìÝØü”1žxÔsý õO.çFgÇX…½÷Æ—TXé–7
d:™ÖíÀ›(ý\sO(%0é4¾àxèwù”uÛãxZY^þk›í½?€~¢¯€ö€¹W.bŠVšC°VÀê©´_¡÷tèé£AÜ:4‰¯[Ö±C®=	$Ÿ‘¾;q‚xàA÷j‰‰lGmüDŽ«Xœa›m{¾3*"|4Lã4fgàÈAª!·ù‘+iÅ€À’´À[b#ÝEM—A°¥<ñÐÍ–Hõi8Ñ[aå*|Cåü[±~L±Lq‘thc˜U·|Ý>Œ—…Iˆ^Å˜}TŠ®Ó@¡ë!ºMy-â£[o<Á™r.QÌ£)­iþ?i+¸©Êmñ3U›0½W¨xQ„ÖÂ‡à,4A C€A?~C?þ%?~!?•A?Ó‚Ò‡À5ŒþXl\	ôR£´²«,>J7ÉÈ$¨„ñiqxJ 	—G²Ùü_"hièöG°n\ùwq!•t“(m#!QF;ß€È2‚©w4÷ÕÂÂðv¿aqÑ0{»ÉÜo``,÷5Ðã7ôêâC¨¢ÞÃÐ÷Î-™äÚ¡ÒÝb¸åo¿Žû×æ,ËX.ŠãÂ>A1ûù®áu¿¸übqeýÂœKYp'”WÆð0hàùâê‹‹ R–ùäd¼UŸè†¸²P4Q³ù_wƒQÝµ¨Ù×±mÙ†5Á^C¥Þ5
ða0N›i*bÁÔFÓ}è^¸näA®/oËôcü WºŽQa\yÞlªÂ“gÏìÎ›~!p%c€5ÃÐ,åè9mb×À‘XoÕºh¯¤Ö-²':¡ˆMOEaŽ¡ÛzãÌVË‹qO	µÌÝýŽÕÍ–èÍ²š+¾yŽv¦½N	^Ú]GPw£Iî*¹Îe:+³†RÔíÛ¹³Wà<a?eè°9ÄœæâE7RÖ”z°½ø“{	µ~ÊZ€ÍÁ+#åa uO\'ÅDEÍ¨ìOfseþ³Ámù ¿Ù	<`ž3LÖáªñW>jEà§ÕŒ]Êâ-˜ƒ~ä‘f‹•µc™ïXmß»L#vk*jˆCðG¡ïk7Ï\ÐÑPïÚãº†|g™“û"QÇÇ“V	2é¦ã±fy¾yˆ‡uŽ†‚iL"—ïã)ï½)ïŠ÷"ô?‹EÜÌB¥ÙØ])!¢Í²™ËÚ‘¾ª¸dcHD¤‡ßrûÎÞµNËÐÆSí“…¾Te{HŸjðgÏÊke´©VíBÕøaUw¡ª÷°ª¨êTVµ¹–ìDz@šmŒ¨ØýWŠç@@!¾µÍ€GLw’‰tÖ,XVJîp×ü2NÇ–ÂSÉ¥°ž–[*qOUùaeTÖ„TÔòŠ+ø"[i°¿Úœ_åóVÄ•ZýTvtKîJ¢Ù
’- ´¬5á-¥öxiÍùSÒ…¼åh*çBów º§øï¡S0¼ÀÂKÍ]üù®€Ôû‹HÊV;l¸ÐÒÝÆ“cí¤ú!,ŸvÞ·FuÕ¸oX (‘ã¸2ÆÝo^˜Æþ­pø…fƒÉæýêdQNêG÷j>JM\IÏ]±.X	Ž¯Ú@¿?ðˆƒ¦ŠAïÌ×mA•ÝH/÷Ê¾|í©½C½L[ð4¼®vBÉ…Å…R‡½?ôÜo’ì³ñ©K‘ R€²ø¹NWÎfæf30(|¶¤wþNÅÒ%¾ïŒbLzC ðäù)¸ç
ìÑ	:£co*Iñs‘‘ïH/øêŒ¸ÓcˆaÚ?ß	…ó¾‰ßïáŸÜ¬>%»àìžÕ”_=Ê\Êð±(2E—C–õí¤ªh¾àÎþE„žxàþÂ¾I3 Q¨¬ÈmùÎ·xT×±¡]ì[Áø‡‹eÄÝrK	¾CK«LŒnÂpE5ZêU{y¹f/žE=é[3ö¦‘iÛº°—”ÛÂËö"ú;'l{1"à²rª²—È6òTÂ*€ÞL£ÕÎìCÖeB» aÊje°\}oW¬”Ã¶Ð%Ë÷éñ”"^[è†åEœ¶ÐË‹ßÖUyûªkoãë„:h³ÕâJY}Tˆ=B™oHjÉ¦áÆi–Eæ‚Šš†?­Y<Ødù¡¦bX¼ªA5™±¨±¦¿ô‰Žá¸>h r+®`~ªü=—Î¢ðÆâ<lò&Ú¸C^éŽ¥&ûæø),'¸-Óö5ë¨•”èqðPó(’k«ÕÂªÅyÏô’2"‡šÔ«¡À4ì$tJÃ„ÆhH…Kû¥ÓTq¿?Ú.k\¶ËÚäÛ¨ÙÞÕm] ÃŸ/ÙQÅ ^QQñžZNîÃœ°ŽïËî˜¹ß'¾×Õþ¶@X¸Cqg¶sŠÕ{~ì²~ÑËýý |$é¨¨ó=ƒ—í<…1m´XwUpß+uÑê&î¥7„%u˜úië¢™Ù´u´… §ìÓ¥ñ£9iÅ÷™Gˆà""êò‰î+&=€ÞÑBß@UŒ—áì'Ä‡q¶@@6(kk€/ß«¹¸±ÃÀOã§[5;¶ïMJ;¡½{Íêà¡ÎÉÐ‹¹'¸@pTGú¿§ÓòsqKKÚÓäy-jÏ£‹¡zJ›Z\Ïc·hü‡v=
>(n5qIÇ ërsâFé¥Ã•}Ù!õ;ÕB
ï.
±nâ¨³ûuá;”|YšòÊ‚´éY «¸‰KœRèJÃ»n.¶…U k7~GáIíÏ.9%
ÖœŠz=¾3”Ä€|ò˜sœ|GgÈ«ØâX6Ùvxø¡3À è–‚}@êñ%;RØâ4†7²4æCæS5j¨Náèúñú(|ì ýu½_ù1ûmó©~Ü¾³N‡è>¬ãÙzøaoò(ò@q!þÖUžëÍŠqº¤Ö'a”DŽ—`ù[Ù0bp0W	ñ,\€­|»s\&T­h¶Ù×f\~Ê¥“Ü—Ù—èÆ­§â¬qn>'æn¥XWjfDÄëÕXö«1Ü£í®ÝpìãMNàÝ/Þ€Ä¿
ß;ôN@oïXmmmy<¦]ÕW/à[ƒ».øËÕ•ùr‹N¸`Ÿ\ïz˜”÷PhDí¡Ð}aÿ»è&·>bõB›‘ÿ…¯l‡& ièôËF/~pH-70í®½ ÍVZýqñ_K…8\ÄÃ|~±KË´ÝÝ[†ÐåG%Wþ}cº`AE‹²îÚóIb/x†ÉL'H¾‹1‰>`¹
	ï[+GMx;ÃÉk¥p1x Áˆ>7;Öy6+'M†!ŒþðNß°ï*µæ“‡+N'.ÆCoàý«Éº­ãA«ÀŽ7éñÖµ–á15¹òêÕóe íÕåÕÕ••åWë…©cÏ™à¹ÇwÄ¾"µ÷4ðX—0Û´ªOY³&`{…VW^½|±ü|åùêòÊ«åµUL`¶È­ë„¼ó’ç Ccwûu¿ìuz»‡?vö‹ÀMâ@‡	`MÀÒ2 kµPE5ÝõT_@ö ”²`“"¥ÝK¹óiÓÖ<ðYÿŠëß×ß—*ìôÈü7èúš±­Ÿ
©¢û£`œ©Ë¢ð&wÏà6<ø”Œ}c£­BÍ¬mò¾7Ê<ÐàûkhNÀCòyðýÓËQÈâ¿\Ñ‡¤ñ_®^^9W}ÖôâÒ½4¶ÔíÙ÷ÎàÚUš/ˆhþMŒ6PŒ¢|s¡úaÔfY^ñrãÅk0d‚dñ†dZ›]†þ@<âòï%HvéôG×à} õ+WŽ»ñ=âxÐµÍV'ßÙóÉw(êHžÈxiÜfëðláí§÷o–°ÿ·µ"líØ.×7Ö–_ÍÛ•{µÖ13l‡G‡LÏp­›É#zÜ&‘ˆ~ú¾Ü”ô_¼¹|û©ýféò-, –*-XYž—ñä5ƒ’Ýª’±Zr·ª¤§–ìT•tî/,órñÆ3'åÕº³vùÐ¶øfÉ{{a`KòÍ3SWÀÏ›$’­©óõó1Ç=´iud½IY5š?X[aBcŒ&ÉàÉ'û¼ÛÀÉÆ¨óEÇ÷®aì»¸õ9”^)• ŸŸïeQ¼Ùá\J?l/qhì›%˜‘rTI8©‚÷,ì²_ËÀ3pµòbÕ†2´›û7KÐÄlpd@­„øêç;E6U5õ§C"BŠé"W¢X‘IU(_}¹ŽJ í2L’pLr
ÀÚÙÇÒ6A!vqðøæ—ÉDžË¤%ýxçàýÎ~çsç¤sX›6SVX%lÏ——ÔÀ|/pA-å%VZk‚@²n€ák‹vÉ¦uŽû{³£qNéßÚ ¦EÐ´­Ö‡ D™<	Å‹—kËWÙLyóiÊ‚ÔÞóXŒÜšÇ@LCÌŸIdC^[[_ÙØ˜•?ê_¤ÍE®·L[=jÀøŸãçc]L¬Œ½ÁÀw«¡+ÿ†ùã±Î¨‡¡W"ä„jirB”¨q"ˆ5/ßÊÎÖ_ll<UP¥`À™Úÿ²ê1½ÿ´^¦•?»A·®4qåÊ€M…ï_6ÜbNñð§sÅÎ„Ú=Ç¸ái¤?UâÉî‹¬!7äôY}CO¿ý n‡›50èÚ¸ÿvý"³Q‡WÉbè5¼ºòú®øS5nf¨qó!ÊoÖ†I2i/-ÝÜÜ´nÖZat½Ô;Y:ÙÙZD0Ö—koà\Ç6ð±›8¬?Äª	@\-¾¬YŠQ\ãÛ©»s‹•öí9À=5^ì”&Þ>ÜaF>D;}_†ƒ[vÇ‰äÊ{þ-¦FŒ0QÆñbìFÞ•¾Žq¹7Mmym‰kÄOâ\ú.ô),BhÆw&1´+¿et§øôõ9¡¬Ý¡ˆ.í¥[Âïw~Ç\M¦4„çÊªbÆ*Ur¼Dƒàø¬ÈËrˆ[¸Å³(ñ¡ZŠP¬Ü(VÅbz °îŒ†5;}ÙÖ‰"y½Y*²É$%u¢Ì¦ä›Ò±Yfm*EóÙ©’{ÃU‹¹²†ènÚeøßMrQ£©Õf)ªõ}	ÎB6¾› »DdŸ0´ÜÚ¨–Âøùüåä°³Ï>uNv;‡loçãn§_„µÀÀ¸øH_ê{ïåãZ®VzÍ6ê•’QW¨	+îê«µËiczÿe†P.°t©L|UvmCÚ*‚„
2e o.Ñ0Î|¾÷ä“©wÉâC‡í}ƒ=½ÄSƒ¬×ùôåqé®Öª¡TÚôªD“ ö”Ÿ3lå›ëp±À€”Í…•—]xc?Àè„c½Žƒ/Wn,Í¬­B3íÂZ6WymÇÃ($Ò¯­°:¿»£Á÷Ôà'^½Ñ¨M±¨Óè}OG4ŽhÏc:}`‚™G%F¢æü€&~¾»vlçCñ,?zRŸVÀ‰w– ²BæGæ®tÃ[=ìP§£´-pî\ÉC2[¼AÝ?b:>¦QÊèÐþx’Î7de_mv$ÂÀô¦Ü8þœPr¾òkèuŒj<˜‚á
’J¹S…l»2¬—±:–ÿâ®º/¯Š¾­)ZôZaW=_±þòRQ\^J»J¨OkË•hÝuuxþ.0=W`Z)å»W‰$T@€Ö€ûŒ¿x/g¨³ÿå„õ¾|þ¡êødõNï¸ tz;'»"×gG$åóÑ þÝ@Téoee<>ÙéîvwYýÓRwiw©Óø}g\ ¹º:;·@ƒí‘2Ó¼Õ9î f»ÄNv>ìïìu¿yW‘ºQ½«dàæúÃt°¦,4KS„ß›Änï¨Ú^£M9tAáÚ…ªˆDô»l.¼X8±,C†jxjhž…·y*_0ëP~L‘NNñpD/ðZ´–ÐàK|ÀbøåÃ›²ª”ìLq¾(söK'âÀ‹'¾ƒz|ŠMc¡[ìc&+J
	æ˜»xé&7®LÛ›jP’(ž˜¦Kf|ŸöÔ”3Fkº8¸Ÿí4ÕæTì\Ÿ1~šóMYÎ?ÄV0±¨RG„vÜ†å;bèÛ„á¼¨É0»U×yI“íÂ×Ý_½ É:ð¯_ù,1Žé¾…9ÍÛ9‹ícÞ‹ÍPë-ñäÏ¾I-?è÷sg˜zÍ7—S`%x‘1|IÎÙµ@œ(ÿÍÒÍ›ô-êêjlè–é[RXgiãp÷¸…z½ŠU.E¨×™Ì;ëteôòWÀú#Úùƒ¦½ëI;Í‡øvgœ?2k¤©©š7¿µèæÐƒHEÄ>†Nf0qŠ/
"`/,jo–p VŸ»ôÃK‘è=|­ŸÖþ™^¹WW`šaÕ3ÊõÏ¯€s&x Šb_—Æ1ß†¸/D§nŠ|9Ùoõ#×IÜ#²÷àw»*w(2ºŸâN¨!Î”ÖkŽ—ì´†‘{…ò‘¯>•‘¹¸Ã·&ÎåÖÄ¹áÎÉsÞþ3~&¯ò¹·e&-%ñâ;"ñó<B8ïVªaÃ q_ÙXÊ³×»Á`kèùƒº£¾¸©	ìõŠ‘;¿¹ÅŠ3…Ág§¯Â6Y8€Eg1ê¶1Òfe”†ÛT;}Eü¶ÃW÷¶d~2¿ª0èK}~8ŠßÛËŒãQO½óŽÏŠì±=ØÓ#:t/¹ÇéÇ›ÎØV1ØT6–}ÁØRÕ'=Pöü8Œcï’‚í—«OmƒÑ¨_‹a¨x–ÄøgËÐ" |¶imlYR¯è—Ô£B¥G—‹Û¶yÇ”¥Kï„ßŸpà$Ãy{êuõ’^°Áþ†º†£ÀŸ¼{™¸W§±fF9Muê›0ÊÅ(Å™ÉÎ,Ëk)³>ó­%”Q  \/Þ=
?Æ4ƒÅµï¾PIå_Œ¼µ¸º¼Ìâ¡ü»ø=f“Å6´'‹/Acý¾x³øª¿/:i
Óävñ¹¡+Ü-ýõŽ:Ý;<êí~Øƒz¬‡¿-éâz7&%=¬ØK£QÜ]\yßÝãÛ‚‹Ï¹q ]ÜXf“ï‹ëlr»¸–q€•cÉF‹v¥ÿŽ¹nÄ®	T¢}2Õ"%M#’Z‹k€R¨ €
ú…ºäŽ=Üagß¡•™òs=Ù…©¥Ëþ;Vƒ™Âô³Ž?X|µ¼¼ôJô.ŸeÉ	“^@±çË—<ˆÂÉâ¥ŸF‹ãA­´—¶	˜</5.sijPñ'
LüÁ Âö9ªíó'JûüÁÌíß_Ü—hQ”îgË‹úr#ŠóÉÐÐþÓp¾N<yÁhqy-•´H±%Qß—œXTµ†‘•™èÓNg{ç„=e-ž§Ùd!“Ë‰¶ñŸÅ›È™èT.=Â•@T¿žmïëøE„O.7,F€Ù¥Ó÷¸ì·Ú²õUÖÆ ³ÿ(Ì²±lÈ3ù%š*ŠdNþS›ûç¹<\ýOóC¼ÃÑ@Hiðn ¸¥¤CU§»G¦ô=\Uûä"ËÏDeÉ+…¹€Ýf°õ„ú‡."L.ïŠGŽžxlŠÁSµÉO%&ÅÄ*¬04ÌŽg€ûÄ9/½³®óäLÜgØd#|(²³ã.Þ’Ü±Ãd«^ŠƒjÂÚ*r©«Y³›”šÙz¹¦„îá~â™žZS1y”¼*óGÍ#ªyðÏ…}ó®é¤µmÎº¼Lae®&ƒ0ØB³eóŽëáyÓõšD"X`•M(ƒ‚E­µËþ*Ëtœ!Þ8ÐÎ”m1y!i(g 2) ¦kE JtˆUS‡è§QF‹“é$Z¨Åºm.¼OG'Z&=š<{yí)<õ%v£¸t‰ËøªR8QCs©´3ôXGâqÛ0ná-eê`W[R{KœXì%J(`eÄeæÄ('¨™‰)
c“–pqàïé!•øÒ— -žL/…òí{­Ši;	1ÁVÿF§)DÜÿ­^å¦‡ò=ÂW¯[E>sÒ‰HÖ3+‘¬g$¢j	¡(z9ŸNH•D‘›\?pî+ær…ÂôÉ{Ûåùm¸BðÌ_&¬>«$JÝŠ¥¢lÒÀZpõ£'æéúàñ›²/”ƒ{ìÐÕØxØ´YÌEÝ-—î—÷Ÿw¶z¬»³ŽNXýÃÉÑûeggoÿìä¨ÛÛ9iL5g¤m±:ƒR®ÕKƒGN£U~^ªD–}ÆWª-4Ž&®möÆ3zÐéuØq™ØüÜÙþ¥³Ïê†ãºÑ®žëŠwæ¸	ÌÓ••É÷3së3ëäzÌXD@¡yEt.¼-P¬d/hÓ›Ïf¦2”W>²>÷•3Ïâ~úþ¥-b*ý25:HÜ;“zœ^Î’Ý‹…{s‹>æŽÍòÔ7¢³3(ùø¹·›xŸ[µ.CÖ‹5™èXŒ‘4Å(Àê*ÌE¾"·‹2€„=4AH†‘!¹Ë(A—èªöVâ4?rBg*ŒÝ9ø\_®DÿŠÓc	tÕÓgÓ¶–WÏÊ½oæGõÆ­¨ëd¦¬.½(ØT%jíÒËåéß—F“ŸvoiuwsÒ5Ÿý+¼µçç»Œ86	y51âÜ•´\¦YDY¿o‰Ì§<T¼R'ÂOÙm‘êŸg=Þ9ØÁ5—=eG‡½OìÃî>þœ¶«6tùkî5ô*Ê…{mÖ…{Ÿ¥­Íl˜2H¾^_ûnax•0h=gæ_™µ¦Xügs>À=2]” f,†]7/!/-ÏU²ŒwßëËÓî7Õ“‹]\‹ÒVbÍ¿®Vg‘¡Æ‰ˆ™¤Û,"æ°b‡Fý€Ô(wdÞÕjñW%úªeIFìùA:[¨ÄïM›«ÿcisõ0mf§’HšUÁ–$ñ)¸GöÍsoØÄƒéz¸ÔÏ—!aÄ›DR!Üïôä™ï¦iÑóë4äŸ”ô«ÊŠ¢Ég/õ%ª|gì!Ö¬déFjæœÏÀ-`à-åö‰[2\B=‰•çÒšŽÍYËMÁz¶åáœ?©Ä8/òCðÝñaô3à›wù`l+!)ÙI6V§àïJ÷ÑïrrÏ©§•§?ß–ýÓÒŸ8'¢÷Ü!F¨ã»çZäÏý_$šßT€FIZçÛû)å‰—O¼šÎkœ#Î=Ü–¾ž‰#^Ì8Q|’xòá÷”jxÛ£|ÄKð…'*žñÕeÊ6ºæÛëÅ¥ç~ï9—±u4W¿ëÈ0üRÄ0ñ¸ÿ|ÎWÀ2[4¢fŠºŒ)F=YõqYbJõ#ÝYRÓC‡–¡ô‘Ú-ý‘žª±Ò;¯ÇÊ¦·""æôXÝâ<#Þ2}VjhŠîÃ®TUÇÍì‘’£˜Ó'¥šÊª…™N]†¹æÑ)ƒ”‚K«JÔá¼Ž*êãÁ2?•On³ë«?Ä-e0ð¡¯M¾Ÿ-¼ÕHn†\T.—9åe„"õ&ÒêL%ú7y©È5µÿöùˆgéuÞïïÌ¼K´þ#v‰Ê6†k¬Ë Ps+éeéŠV&N©yËøÚ!Úv®h,W•1ø‰vÕYÅi’DLU;HeÉL{¨:nÈº×ô˜Ø¯¿ëÍåÛŠ”ü¨ îJ}æÇHëSCÉîP¡WY·å¸+g–âúþÓlÖeiØ·…«òËÀ‰‡Im˜'jxø#,ÕÕ‡‡€["À×sá=_'’7ü£ª†õ2_è¦ l–0Íânì æÅcƒ4­±±S5Ù7ÃuML•Éno8qUªùQ/á
¬rÛ†Tb§¬ÃõGÆlâú®C)Â"×w0€ŸÒx0ã|ág[¹jhÀeÛD“müž‘1›dGÁ‘ÿÍô=Àó	xcÔçÃ$ã9"6r@§u0][†7yK	)þÐtš]R"ïçô1Ábéß'ê“^„5I€“óÐØQ{§ïQxSÉ!U[(ò3s¼gßŒŠ6~*ã?A¶Mþ”ÝåQ{º_l– ¬Ê½á²­_!ì@xDÀ'~ftt'N4ò][çœ>
/}
z@v¯N×!§\Ïîl˜¦â§bçpFÿDùEDütÖlË¡½¡®-ÓÃ2+èçÍäüÐ†3¦ÉÈËÈ9ma ¬Ö-Ù•‚E£®ý\Ž'KˆÄÛ¡X¾ñÒ¶äñ=3e-šáH´Æ«xÔJÑ)@	X=/QIƒÀë"“ÐÓù2	•48öX NW1ýÎÙN	T:†Õ‡'ñ)mtí¹Šn%Ow·ûKç‡ é%G’5oÎÓyóæT&©%fÉÒEy^€A •/Þ2ñ%ç¡ù”ØÌ	ò}á:ÑdÈ“i0õ#a˜{“Ö~¾vú^i^[Þ÷RrKÙ¯…Ahõ‹aŠqï¹›fiu¹¦Á£uËËK–Eæ§­œ.4šÌ¾ÈŽ úù±5_¼__^6ïR)ûÌä8T?˜ð„Ù½÷š×N^)¢ê”ä'.;{XöAÈáQéöe9€ƒ*kµ%Ð˜¦ä˜fÆTN9¥÷“”ÂJI/æÆŠ.Ù†²Á³Ù4kÓ¦ƒ©äˆ\þÐ~8ñé¦Ìël.ÆBµÕÂÏ]vqÃƒªSç¦gˆY,Ù2Bçù*?Â³\Ø$/î«ÞÓb È¸j»&àioÜØ“Â©‡ïˆWâé-íÑŠ^3ïÒ–6ùˆúÓ·+{~ì¤[I¯f™pqVŠó›vÉË#ç§|Û>'ˆù·ì+1øVx'ÿ­„ð‡ˆ©.+ ¼gºûŸiQy¤Üœ÷ˆþLm–œ18I‹‡(75/ý°?z¤på,*.­¢|“<I”v ½"ããÔ?–kNä–çœåóÍd
q¤^‡U{ÄÈð[C'¸†¦ñfïìÐÅ—	*¸Â¶9	oê™ÒÛd5Ù­ÉÜíÚMZß˜\ýà˜›w«k„²xÝhs¡—ú^ŒnîŽŸF¬—~MD¹áC‹<qy½‡/¡Z«Õšî»«úý@õHñ1åG:í+†ý4n‹Mtå‡ºçÎ[6ãÃ4¡e“‚„¹þo>Ð.QÔB®QœçÒOœG-=7O7dbêé9-†:ñ`¥ÞÜ4çóÃ­Çß+`ª²S~jÑ®½à«3býêñZÊƒíªn¬ÈO;fQž˜œhœ ªùÈ™È³²\º˜¡¾MØ=õY²’ê­¥Êq=-åÔ?Ä%Pt”þOÐàEso¼`’&"YLûÉyãq¤ªÖ¯tü7è6?ZÁÑt>L5aùmuCÕ*þpe?oxôèèqæ^D$÷´ÓžÚ)){B€ç¦ª9ï®xÙç‘*H8Aß¼˜ê…ŒäÀMÛÁÛcÏ÷†ŒO7e/J€#ß,ñò4R÷w:'‡»‡Ïi½êÒVÑi`¶…AÍ#”ï%ŽïßÂ?ÄÆ#ˆ	t6â½ÿ*–€Õ‰‘GÌJ)è% ôéâà‡é¤Œ
¤oåþXõGÛ3~¨úóô)Ž#AïŸM1ª>±*ÜÌª¼›åDàCºž|'IŒGkfNnYzðïÑøùÔfwöYlUdU›iì³Ø¨‰jôÉÝãÒÓx%ç÷~âºåˆ‹ÿìˆ#noÙ¡:û!¼‚µÝr¬yv¬É:Öèi†5úõÃ±Ö)ÇšóoÅÚïã•±wy¬/†Ÿ(CbÂÃý)ç%WÌT%®*M‰Mû}\GUÇ}Jý3:ŽƒÛQ8¡K=¼8a{J&ä¹qgÂûH‘ìS¸þl;“yðSõÖ$_þ ÿ.~Àžx#Ç@Y§wÜ~¤T¦a?Ö)ÿxÇ	~Œ=ÊNè¹ßòmÙGzOðóÀÝJ’íBÁO…E‰„|1K^zéM‘Ç²‹%4ÝþÕïåYÁÏãiý®³õiwçï;;‡½ó£cº²€á$™Ýå1í£¹Dà{æÁïoéßãÁÏcœ#ì£$¼…ò8³|hõsÚ]Zb'2—ý¶"o‚7=>J~ÿð ‡ LÜøßåu¥Îÿüár>°\ã×h…—±}ÃÛè¤ZvoÁÏ½†ÿIæ²Îa
îz4g•svì ÂwTFÒyxÈ$×êƒ,«9JÏxþk†´¶´FgÕwO—Þ‰É_–ž*œù}vÜ%?†Rr”¾(òøQú—³¤¯:š›¥ˆ8AÎ³_ˆd˜éò|uå¡öyÎžÇS/PPKgàé¾ùyé‡% ¨˜÷ªãé³\'4e43'—§ÄùHGòpøˆî­5²óµ$–xÌOˆa.%Œ@Ñ»Qy¸Oé)ò2*7r§”d^Ù>úåpÿ¨³Í~9:Ùf[G‡v?~9á÷öm[ÎÜÜÅæu3]á·Àoðó‚ØM—ùÅ}ÚÍo…kÝ¬w,‡Ú'Öä/¶îr"Ïjü<ÏZ Ö
É³Ì	¼1Vòvåèï¯a8†¿‹¯6ò«W+émþ*/o›vÈÆŒ÷³¶ßNAwž= Cž‘k§úDÏ…Á/¸WÕj]”¥§Éz›!ÒŒÙf¹²„_³;O^°…lë1ë…T®/4_BµŠ1ÃüßóÞ^Gµ¦çžbË–fvš1ÐöqÞÏ¢'ÑJz”ëžŸ_ø2JqUØs£Ä‰Û3ûäfÚnžÕy<Oêüð>^ivU´HÚÛæ½ÏõZg}ÖÜøÑ2ßéïäM­:úe
¼ÇæfV?…Û«ù}¨0’¹Õm~vZß8•?ÕS3ž,‚G¦çîT?Œ=-ãy‘ÃÊ,IðägZ2<ù™Ã†°mî¡‚ÙYŸÓÄž7+ž<í¿ºÒZfßÙê«ÖÖÏÑélYP²Òýðß†G?ü‡GŸ?G?¬³%ö!ô½ðãÕàÕµ5`Ùß‰WgJ9ÝÿG«!G‘‡öcì±-7qFÿC:õšïƒ¸ã¿¬´S†Ãå]>¤ÿˆ=ãóŠ½}9¬_ã‘3iühù§¦¯Ó$à¶£
ýK<Ù¡¼ƒó¿©Ú¢qô$Œ€Ï¼ä¿Cg#ú?Ÿ?ŸÅ$°úq˜DnòÃ¹¹D›ù@©|à(ñFŽÏâÄAÏþ%µ9J¥ˆ®¸®814O’
Š{sù–¼óÇÒ;ß&_|Á??sZul‘ïO<e=g˜êÎ‘-{®÷p“@ôdìˆ¼ÓPˆG§òBåé¬ódß³Ïø”×?ÀYí‘6•²Ö
šH
>ëi¾½³V½@ºêfÌò”œrJá“yâ·¦“Ô{`ÿ‘.Z*5/ªùÞ¿Ä1ºß·Ãþ¼èÝøcïçþ±¨#ÿÐ½êEÝó¤äÙé>Ç+Ëc…Y”·×Oî_?yÂ³Pv&¶Éò›áÿiìî\]áõ½ê…¼xŒÉìñn%¨f¬ãw“0r®ÝÖµ›ìÂt‰lÐçÐFT1Þ«gõJ†Í$º5òmòN&NÓ3Ÿ»G‡-ú¥4 &`ã¢üÓ§ì'þµåŽÏoX’yªï¡ƒÚu¥ÿËýîŒ'¾Ûê‡ãšÞºÎ •Ñ_) - %ï:‚
åâ*c¯XŒÀPê}À«¡éø´’Šfìíà@vÀZ^r[ŸDî7
õ´ëÈ­VK4­/µÎÚÌBIÅ4†ò\V+€â„½µò÷öúŠ—¤¨™kÏ³öŒç…6ïMLå“ÏúNÒ2š*l¤ãFQÕk€¬€ñ†q†³#fh2WiŸ·ÿÞ7ÙéYƒÒ rê?u&“n<ÕÄyêˆg@­Ð^œè¾©ùáµÔØo¬¹×^ÙH?`taä9>ýðÄìÒk7 óÞÒ/g0†êo5þV§35Ú1Js``phpp÷4D1,Þ”´¦ÁÇš±8A0ƒì˜ÿÔˆç]þÜ˜ÁìÌÏo, ­ëmÿåÈ\Zb‹‹‹lac ¥aß‰1]=éâ«P‚?/B0ïëÏ4ðõwˆ¡Ó3™ªdSç¡Ipœ_eÖ2‚ÉD¨JS„¥BmX½EÎmË‹é¯a(3ÛäyÙ’øÙŒ Y•îUÊÙÞùÐù²ß;ß?ú¸{xþa¿Óý´Õ9Ùîè‚«ßúI±ãtn<œ‚pË„Û—­âL¤AœbÖæ0èÎ$†I}öëƒK<}0™œC©+ïºÖt­ÍG“aY¬g$‹F‹7-÷;pd\oè²‚w>@Ûg“É¢ø³®‰jÈá7ïèS†O[¤Ñ´å?µ©ÓÅS‘Õftq§Qf<…2›œÜ8ÿ½ 6«µ{ÿÄü¯âÒ@ ¤7NÔk[a
b&.¹JT˜@‹l£xrÝà>û&GSw4õß6¡®CñÁ‹Üâfý0’ó ÄFpÚŠ„7äºE”ºìýí¤«ƒ}%ý4!³usZIø<FøKå
qÅ2¯8“ž7vÃ49q¯x!øòÆ	n3‘E¹Ú/›Ô”?N~Z[-qg ‚#Lr"
””Í±À˜µ]˜ÈFô{©Õñf×H6×–——"]¸VFj/:›`^@7ôò[Q%)½z»É^¨ì¢¬µu±@*„,ÈhY†ÙslQ J•î•õ|äÞvÝ¥nÐwó‰áŒƒËIµÒÍglÏ½¥h-˜0X:á×et·ó&G>ŽPªì'ÚƒàÚýy¦;H‰¯"é'Òœ~r[ ¿ù> Ó¥‘Ô©Oo´’p?¼q£-ÔQµ5tì$òvÆm9~²‡­ër”ÚEø¼6˜ýœÔtñ¦ VÒUk’ÆCl  Sm…3¹¹jÊM[éxè]%õáVÞÉW0Uë€1$sÓÏ*A™ëƒr™7céfæôÌXºùÏ/ #»å8íì“€«¦­ ×ä˜FpMŠ6"w¶þÍ P”4¨Ç®Gy¹ ¶4¨€ ß)7›\6Úy„ˆuM¢Wü"Ì;ø™Ñû¦Â…çŠm¾ó‘Ñ¿Â•ÔÉ!:„}ïWÒÀ+ ïr
Ñ‚bcIHœÕô¦tvZ4ºö¹tÏô|Jg3Œ4@iÕ‹û‘wéêj Ž¼iihÑ°X›Á
bQuäûj]çRLãî€¾HÑyÞµ„ÇWy]¨Ï¥‰*Ý9æåÎ½A­¨O)€€Ü1ÚE]J)€’Q/a2¬ƒ™8ëµÎ(X'`¾Gß²±§x;^pæ×#yõ@æ1s»3ßñ‚·ö ¼÷|ãPÌšteA—p²»ÍZ5CGËÖn\6Ë¤—[ ÒßµÆnâ æßµ®¢p¼åô‡†-|xø·|tlàú.^ò­>ñ¬Ä-Ã£jÀiuTÍÒ`NRt™@•Â•æJ4ð†ÈhJÖ+D@?dIc-i®EJZ%•Ì QL,ñ %ÐW„6_xu…çzØ8Àíä&ŒFÀl0Ä Ä
J¼-ÒkãE-Ôb2ŽQ>kë6”kyAßOn\¯‰þ@z@QýU8ß€cñô‹íuÂ£šÁVú"¬Î¹®·†‰ÊN4|ÁâÛ **tÔÐ—),4/»Õ]tŠ$ÉçÄbÞKYÏ] †ÄW•š÷N”¢ê €¬ÌrËˆÙ®‰«Ê¹Á-A’+^â¹ñöûLJäË¡;_y—~ˆ&aàÞ°÷ðµ~j±nšdq6AY8k²;Ú6o“Åè{}Ú^ú‡°¼ä¶‡¿z¿œì·ú‘ÄuD[\ð»Ž½……qˆñ‰(Ïó£/99‡8­aÄõüÈÏŸÉ=kx~qIˆ=çÂñç»|ü÷ð‹ßH‚×‘ì£¤«ã¸ñÈñûŽâB6šÁ‚'¹Z0X7l=Pw`ú¸¡S„^‰+	f%Ä¨æáHÁF·ÍTÓL”Îµã³1“QŠ’“³¦˜÷";V\Fe0q'.ÐI‹Ÿ†$æÍ§ÞÁþ.¦Z;…~,NE^¼‰ßµN—Ïì4ŠïQˆhå¡´^*áV§d,ÒÂ'uƒJl>,§éÚV‡.P,¦É,þné±¡j6‡¸˜®÷nÄO9]iK#/ýTSÄ‡¡ÌfuÅf;!Ž_ýùÔ›²PÜëÄE¥ä¢v®‹4Kø¤4ŒC®¸CP“ö\æõ@£%BÚì·fW)+ý ŸCSç -ó †`‰>ðo7wuõgZ_|gÔR½DaÔÆGU•ùøø"§ŒP<1ü¸B
Æi¿ïÉ¹LË$÷@W!,9H™å®Z	³Ø×è$ÂçÑUhžÀrÞH§°ñó2„uÐ	Þ¾}[¿»Ï›—*>ßÀöOÔ'Z¼©·õmò³•šæöÕß=÷†ÚÙÊë>z<`J&ºÅ?ô¹kÔ‘Ô?Ç`úÙ§Eé¿2÷<ÆVô€ŸU<ùtÕ:‘wîòëƒèÁ³¡±G?F£dÂ«RäAÆ•C¦ºe‘jv@=ŽBd9òÌV
Êq$ÆpÓs.9žôg:®ŸïY€-÷2 öŽ ãkTuó¬YØN³Î&W-ª¸Rn;œÓf0çÊîN¤t‹ž‘À¶‚»pMs{NÃïÞÜ°ûàØàq4Hâ™U÷ËûÏ;[½®1,/îz÷Ò‰ð¶mjdW}¢5‘D©6÷1/'§½›ýÔg\xÙµ™ÖÈ¦]”©rïÓÆˆ‚s´æÔßQeÏ­¾sZá­¥3]£À†áGÔ÷vmI|+‹˜Ð˜ÕÒÚœ bGŽ|Ÿô½š	d²¯Ôéd?-ìa
å¬®øbt'|Ñ*¢Üóú©ŸŽéŽï²&òøµ’Ñ‰¡³Ns¿ï&’û?¬#àÑ4¥-ZY¨ü6Ï8r§©ë.Z#âñ-˜ŠkV4Arz+¹¦(´fèEÄ³xY
ŠÜÏ“Ýúî2i«<«žcl@
Ö¬¶|0…<×)[pê“y{™ú£|}3«¤Íï-/ªÖò;&V×6ô„ù8@yàåOLÿ¦½ç^¤¶\÷›dÀ§1j9Êþ°Ô4Äuon/„'Ã\öÄŠºR!$ÄÚ€ÍfÝõ0{½eÛy#š}®oÂh²„¤ˆ64 %]0qp©å¢
&‡³gÉËyˆ!“Œ –Àä¸¨:^__¤µW®À` •}Ìê÷â	³“‚êF^“íy‚•x£Æõ¨.XF„˜ýSÂ‹EËx:ß´.á=SY}î6ºä»wÜ¦<Q¶ùr`R%´&‹4Tª/¤†’Åà¨ñ1•z•;Çˆ
aItúî„x :Ù'Ýnx¸½÷¯&ë¶ŽÁ†’î³À›T7Ð–6»òêÕóåÕ•ÕåÕÕ••åWëY+…Xœª•Â*ÔÝíCÖý²×éíÒu±9„“8˜"” lË äjV{äNßéº£ðPÝ/zó²¢Á¤Çº‘ÇNœ¡s›ZÐ·7{PÚÞËÊ«—/–Ÿ¯<_]^yµ¼¶º¼ü"ëÁé;wìõÿ?…DÉshÎññ|þÉÛ‹sW·%K‰f>:ÁW0âëR2°•F  6¯J›YY²=w<ñÃ[ôÀð£ºÉ¼ô9—ü¢Õ˜êdÖ.7º¹1[Ý¦Ý<"BÄçŠYÉÃ¸7›R.­A›©ÌmnpkÑw¢F&Ä«1Tfo2QS	•Ó<@ò5]£²Uäñ¼5,>,>Î›0ä*àÚ)`!_+pa[KW7ip_Þ¸ÞF	÷fïÈÂê†÷¬ýUN½ÆÞÊä+b¦†2ÞÎÛfDçbkøªŠC“·«qXäí¼¯BK¯sî²9,ø^î;wûC4u´ÙÙšŠÇàíQ•›Ew˜j'µºíxþíçã¼Mñ`/×~ÑÉ¥ë¡³Ç$çìùüë$w©
-“7ñ®TÈÚìŽoïTkÄUójô]ˆ%S±ÔÈâÔ§šJ+]äÆ5g¤Û­ê«ª¸Í¹°)=w©Cu+S	Ý¸-	ÔT÷<¬•[ýÃíÎÉùÎßw{Å¸JH0¨[Ë–ºyª›DJDn@·ÕÃ3%þÖý?´V
Þ\ÅàÎ¥t	g¹ùTCPuLÍ¤èÁºÛvnã­0cêêÏ´v6 ªçgÞÐçm|ÞÇÆK¹ƒ&q7Hø<6ÙÊrÔ!Fý£<$Ÿ¡ëãn%¡ˆ:ÉÅ(’ÇÙ|r}°ŸKùá'<äy	ë1mFé:wÍL wéÀÈÛh”ìdO‰VÈ90«žý”~d›˜¶ 1@u›‚ÈÉjÜxÉp›
oÊxkÌ°]wò ›úž³pš7ÿa¹ƒ]–íË:­ìiC?¨ oÄeýØwç5¨òcæ±…µê±ë¡…Š ¬¼
¬Ê~I§+FX-›ÑèqlHc.VTþ+RÎ˜Æ¸©öqåƒ:üF˜²úø …{V"aTïøüóqM@§¼Ø:>ï×(Î:«‹%bîC·ÆsQMÃo-H-*$Ë‡®èÅGÉ-9–°„E,/,-YÂ	Ã–¢f„Ia‹6RÇ®iŠlfº´³M‰|–´ˆk’ê¤]É²1…'·3…J“œ.ð¡(ö!
Ç'!7kó²J˜‡yÔl†Õà‚‹™×žQëç?§}/
Áf…cj‡¼•êÃüÃ£"ø6t\çõ­«0Úq@G¨Ç~˜Ä¶è<=€*A!	|Ÿõ¿ÊÚÖŒåp{þJ)ïCÇ2Ä˜¦@­­HVw.À³^¼ó¶g$õÈ·ÄÇ?i%ßÎ‘§ÃMx*¶DqÇ²•i€W±-{womÕ,­—Êã…µ-Õg]I™l¶c^Å"Æ³À“zŒ$c™
åXˆ;_l67ÒŒašç4Îå^Ù2%eJÑb ©T_‘¦ÅjópâB¼?Š1>¤=
—H>TŽ¼e"MèÏæ^ÂOJÌnÀ‚ªQýùø¼Ûë E°Ý=U*dHLy¨Ü[­BÈà/­5#ÜÈÇ%,oVa«ˆlÎ‚ó¼(ÃöÄWæY482š!â£N5'BÖP6¾ì‰ÞãUúë¯·Ö©ÑœíKú'‡_É»¼2Ð4²¾û-›0•:PÚç
[/‰t’/‹m¦íD6ÌeOì’iªò)jùÂª"®P\9ù`ð¸­åbõØ÷ún}¹‰ÕM®n†¶UÕµÑsñ0ø4wX¦þf¯ÅCÐbº
%5ù™ÉM±ÒÚuœE¿3¨ÙÎçÅåžIãü¿RM×¡¹#B¨Ì¸àa![À°+*šÃ* Y|ð‚¤9jŽÉºM¾«…B	/,‰³ÀÀ[¼}ÄºügwNŠ·%ÄÏ¬`ˆ Ÿ(Š"? ˜SC{A?O=ßÄP¶…Rçe®>fîBÉ“ìÀ	 ô=ò\¤XŠ¼ÎN>™šUá
Ðx®]m3mç
‰Ö½UåÇOmF„b}RÅx°M»^ãô¬`lÌm²^Ø·™¬ü§æzæ1ATÈMÜLR;ƒA6ãÙ„ˆxGnb JfB²ÚÁÑö—ýóÎçÎ	úiø"™;Ïn ÇÊÅä25ù’©–'o$`ÚBPf¤2h“ã „7¸,gN"¹fs2ä/aÙv¡0ÚÄO1Šì§6Å¨±ª¹%*kg±AyÙ#uÞ¬®:ô	‹f)›Ñ<
½g ²H}¾·€‹©‚ã¦Ì¡”Ÿ1pÚÜÙ3É_?'Ý}fzÁ8{üZP²Mí¤"”Xˆ¦á¿a6 È?ë,¨ëÔ-
·L…:ü`UQ° Ç
ÛàO8”@EXxÂ§†î0—óTÜþ&…#¹Š;Ô)¡XªŽïOY€gšŒG¯­{%Kâœc¦QØ—AeÐbÄx¬ö0¸Bâ}sÉu½IK¿ºÔ0¶{Ê¬UQÍj©J}LÛ‘ã&YD"Ac¢>žÉ§g°r8Q"²\Ð›7ò4Ò(³­®ÑyKIÄXø*˜[Û…ý Ü[A	³p ¯¯S@ÚB×¼€ñØÁo'Î%½ÚsÆ"vás:v*ã\&éÂ™1XlCgÉ™ ÕgX5ì“§3ËB–k	ç+¸™a€w,o“}ÈIv_ôšr—¦ô—[Ë ˆ€t@]âþÇ;O³–;NUàª¥v§V>«x 1¥o†‘±µÁ”®ß±ÓM9f|áSŽßpÊñ/M9~¡)¯©UÛsUÅ2H-µ³×:´bŠ3ß7[âÆÖ*ð½ðÉÓ¶ÇˆYÌ”5Ž•ÌÃL¯è ÁPY çÛ3sàôo>ãÎeõÅlÎdîìÂ—x˜Nw!›Ç]M‘ø÷…kJwWø¤ôføa/­¡œßfjGzÀ•6€ÂÌvûÍb©jÕ_´^·a¯l”RN&¨­–¸ø„=Ûd‡D'T§õuB‚uÅ¡f(¸–7eI=Ä¬tÍåP©€ÈQs‚ÛäÀZÝÚ“‘„TÜæBÝÚî~Ò…€­°Îëu=$è4“e‚+Lh<Tå€äx°A!Â`î
¡êi‹CA¾ÈØŠÐÀÕw“]ü|Wˆè¸_\~±¸²~a¯¼Ê«bF¨þ|qõ…QV~¡ŽØÇï½ŸS6k¼fZeµRU•ƒ…µšt²TÒuÉx§‘—T†¤¾ðt:\ºc„”Z2›Åq+Žš“Õ8ãÝuŠª—=¡˜Txrí§®ça2	‚O‹y¼¼Ãò=ÔúíŠ£Ô²!Cj.¸´#WÿI¶lS¼ë¯ œØE]"õ5›þZ"ˆç.{$/d ŽŒaÙf³ù		@™ˆ6¾³f¸Æ‡Þ¤qÅ¥èËšò6Ý[{2W¢[Dœ\aÊ\œAPA3 éŠ š¦1…¨¸WNê'ìÊñ}TY°L°|·-•a®ŸU•¤)©Ò;¤"ÝfkìÞÔ²>ˆæªù?:OdõÊx#‡¸Š?d3%ÊÁT^™RÿA|#iD“°O±1oÕ¬$A(g'üÌÀR~JX?…l•zS&»eÏíl§¶˜±`f¤%|W@5Ë¸Ûa;[ºm& /ÿ‘/¦Š«Àìµå×-äÔUÖò¶r(KM—{=3.iLm ){*ÜßÂ&u^_û®ÔH¶ÛécµDSzñ‰Ü2Úœ®idœM‘øSˆ¯.¤õË»s/Ä•3º‰‚´œCZ¤gAwÙœès¡ôfYõq(º|+ÙíÊ|÷RÊBoJÓ„ê³VFI½î4Ù%¡{»óîùÑ‡ó_vvö }÷ûÑUÝi°Eû›ËÒ}Î²ÁIxî­“«“d§)Ó5eªè»¢!•fà‰ŒÚmÙ¦+ø#«7—ˆæ8¯¬1ãníè+u÷Ín÷è°ÉÕ$üL6ÿ©£™d  ÂcIõ¼mrz>…iã®ºø¡@¶hhÒn¨AyzKŸ7Ø_Ù#ÍùQK¡n^oPÏëfPÃ
´xà$Ãåê¯×³Š|$  5­Œ-±—Ï×—ño× ~=+bÀE_ä¬²}J-&ýòprµ›Lq\Ê
'nŒúOÑsù0_XyÖúé{G¬Ì'ö¯Ø£üb?À3ö ßØ#½c³ùÇà!«ð‘Ír9¿Ÿì‡yÊ¦úÊflåž²GúÊé-›Ó_fê°¦Þ;Åk6¯ßlÏ™–&²Q`¶È¹é>Ø…6‹m>7Z™[¯Ä=c@_í¡1
çH2ú¾ò`‘«­+HÐ=C(ûŠ´êœta¡§dÐC¯Ý58sÐ•<TR‹[•AžsN¤Žß#~R›ØÆ;fI…7¨êÐ,´Ë¥X òÑ.È:!Úsx!‹Àµ‚ržtd‚Ð®XjtÑÑqdwe›GzÝå^"¾H‚"hñ0+†Ú+”Þ¿RùµÃ®›d‰³@'Ì’•¢ËgY5THVÿ­ˆXL¼fm[†Zë>Ýø&õBS­Ët¤mÌHë]ÒáõYU<&5V`LSÃÆ®‹§.1Y2pŒËV×ðÝÀ9XðÌêÔ0é'Î:v£ÑÀfîãSB>ŸÓM,«ÀGk
 3;™gv3Ïíh~˜«Y›@.¤G5áÌãŠ¶š7XÜÝ®a¶ *LÐxaÇ-¥È¨Á¹‘×¯V^íÆmzßAcÏrZàý6ûœú·‹ÛnŸ±‘ç»h²ÏN°ø9\íùªM7”/7™ê&êÃçí&{Žö³ò*·¿h5+È*œé˜éÕŠñä&ÇÈ¼ÜHÍP~¿F‡­ãû‹|K„HåTùéTÎÍ™Mk±—$qÝ½ØÎ¦·™a©9MZHfuÿÞTf
3º»ßÛ9i³Ý+P	äVâƒµ¶ë€ŽŒú¼cë‹YŸz1é	\:Ì"´¹ò`£YQAõï–ê)0ñ¢øë"º3m£èñµª¦sú™qá­Û€}‡;„.&vžp©WÛ1>ä¦Ìò9}àÆbmfœÌÔÉ&óL—§Ò¶HÿîøÙ6PŽ¦{¨ácY'Ÿ=+)k'Ï–F{¥•U!ŽÂŒJÞ¡–ÓàWØ[å¹¥¬ êX©<~¦-ø3^¬§,°xD]Œª3kzÊ
ŒQ>…%-Tÿí¯>p`«ØêÃV|\=Ö´;}[E°/žÏpbäNÉ]-…gK¶W˜Ìô)5•³R¬Óèt¬ÍT×0ˆó
,ÂÈÊ Ú1pëàÍ^ ™\MXö%Hà…¼£‹ydaº¶‰7\y×÷’ÛbG?lŽ4	jŸœ41˜}>æÛÉÖ–]Mïý…|aŒÛ†ìÒÁÔ
@˜ù Kš™H†ïh† ™Úe2+ö~užrÞÇ¦VÏ½tŠÑjë•›òŠ›Û0u—lµ%vl‰°žm|¯Í¬V7S†…¬¹¤Í;G¯mXöúž‰ŽÀf±}¶ÐÑ¦È°ÑÖc/µÚÖÇ­—ÊŽÙèèU¾6öƒŒ<'s¹'!¬²ï	&­ü ¤Þ;Ž¥n ´™5nSx·ÌÝ
3¦\¶C®]ù£åò[â†~MÐ]|å€fËR“3äŽ´²g1‘çÏD»¸wX¬kØ/y—L,/îÕ+‡®8–Ú:ÍSOŽ	éÄd#Iý¨0ò<ÛÈtýÝÁw#Ù¼h ”_6–ûÌY=z×c)ÔÎÁ¥nL3áª4vyöfªÛR‚lŒI-u9«N5ôg…¶R^,cDÛ) MÒ¯©»0/>&ˆw‚R’IgÐŠùó'Ö¸Òñ!©eSùì™ýž^ü ýA¿¥ïuZ¤©./¬’¦œÚª®EQ³µ˜mu6ŸéŽsù7cb‰°² .ueÛ»öÈ;#ïëâIT7iKYÇægü<žAä 
¥ËõGæ®³tKåÇÒ+~f¤YÐ¬t‹Ÿi´‹Ÿ¹è?óÑ0c*ã§Ì°Òø“²kWC	óëãóHÊïína®sò:Š£Sá7VÅ‹™ìßµÉ‡^e74™|/6Þ){÷ÇQ8öâ²óZœ•ÈiŸ_CÀ²üðjâ¾»½ðKL÷à)à!Í©‰÷Õ:bÃ¬& VkŠGB*/æ7«p*OC«_Žù/Ð`É0
oÈyËÇ±Ð9ÞÅ?ÙG/L—áð¶]¼©ÅŽ8ñð6$õ::¼"¦ý}··sþqç`÷p÷:ßÛùÞRçß¼(lÙ7'òPy‹•sþfO¸‘?†áµï~tƒÎ.=b(Å|X£ÆŽr™	ßQþmQª˜œÌ'Q8q#žðB’Áwjínïd÷ðc~ñ~pBg(¦ù¶¦––"Ö3RªuNN:ÿÐù•î>.F&U¿	,\}œ
¹˜
gâxºP¹®²XØ£¬ª‘P‰Š2ZÄ@sÍúÎŒã²vÈÇ].g5:¹€–6Âà•&ûÔ9ùÒÅmAŠd°¸Œ‡Èk³Ÿïê™hy—]9"2º vß¹Ð¸¿(éÝ2þÂ9ëpù••ó4iX‘´°M7±É´…<ž¸±wåÊFl_¨ì=Gî¿R/Â¼Ú§Ù¼ã	Ì"zÎ,-;+D›«]*|ˆZX+Üc a?E t©v&ä¶ˆd…¥LÂïÊd½Ü‚Øg<ÁÅ8'·÷ÈN°>ŒˆxÝKç„»3ô=6J#o„«,£É-% m„L Ãê{Ùû7¸#‡Q†ÖVÖt/½vbrç!ƒlqôèäPß:n ¿,JÇiŒ]Øˆ¦Þ;V>†gc—Bó>»ÁW'¸fÝí&£5ûç;…ç(‘%Ú¹o²gâúð^]ºá1O4?¯"”Àª9»€Ó(ÅÀëÙ³• ÆK÷·ºñ¦ïuõøÕ¯cTX&rXyK«J-~Ñ õ¶uËvtéDi+ïaVv·³oÇ8|X¶Ëp})OnS’ÿðNæ4ñ®šÔô”Âœ3PÓªKž3á‚ŽWx f øõ9pÕhqåã—ÎçÝ÷ -:ˆŽPc3‡­–ƒnc "vÌÌ<ÃjE¯µØçÎáÇÎ!;Þ99ì|"m'ŒCÄ}PU-Ãíº¢5…i2Iqß6N%¨8ô¡&ƒÁ–Ršò½èD2f—ÂQÔIP³ŒOÂqa°mäÆøâæ™{¼Þ;âÇ-CÏV,*ÐÆ+æ×‹k­‹ ©ÇÃZ.]ú¼ð(Ú›+ïÙ÷7v{´ ,˜—›.4³R]ÒôÚRã³„Œ£Ÿ'¢à[›“Lª™z4-…/à=>=~¦ì­Å¯Qú-ÜÝ/(V±R4ûÞŠÜ‰ïôÝúÒÅÅB½tí5énõÅÒ5fF+æë¡¶Yó”áÙ>¡Æ+M G/ÿ™ïøÜò¸âH+ÔÁˆˆ~AóÎ‹¿Öô…Vø™8F5áøæTªëìrÅewÖÂ«•éÖê~xé0ß¹ö³ÁH'ÓÂæ£ÍJ*ù•ê"¡RS³¶šì"_QŽÙSÖ;¬¤ˆ~’ü÷MféÁJb2G‡ä§NïX¿ÍÍÚT†M'™ì¨÷ŒJÞUrrÈ;GÇ—),Ð~vŸ7f-äøz"	lì¼oÁHù<F‘‘†Nï×UZÍL`zÓÙÝÉŠ˜±ýy®Ž{íèçØRìëüúÛaˆ•¹ùo	Ò—¶3Žî)Œ¤h8.?¼®_€‘ëƒXV;‘T‡Ï·Z­‹ÜüÏïº«›>UÓ9ðDŠGÆK8Š•/™xq9½Êö ôMzÞ†r.Suþ¤ôÍNób[úµ|¨–ˆŒl´Ô% Nð°yÜ`úÕâ4VÜ›þ±x“È×Ü·Ø‘àŒ1K+3'»“ŽRRó6¹ËˆgŒ¹B"¹Ê®cŒCŒAÃgªË¾¯"Ÿç6*:wò¾è”’,Ï\hsXš…¼+ºä-™³¤Q–(£cn‚Ò§éþÁVI@&ñT«o6Š 3 Qè‚¯$]M~+¹Œ@=e@—¡ÏjâÂ@WH½U°>¦@Lã‰g¯žžþ,-¡nÞ=èœô0Þr«³¿õe¿ÓÛ=:Ì88É·‚WWž‹,Óc¢ÙGë%rì·ô j%Ù2¹ø”9eæèi„9“Ä&‹òí÷Ï6NEO…ìNe1bì§Äè+c²ÄÄ[¨LkÜ_~ú³^vrQkT»ø âp¢ìÞ–Ír¶#Š¥‡g8¦8ïAE¦¤ŸâÃÐ° ‰[Æ¸*wôŸÑ!=·Kš$ÚÛ»;û»‡;ìãÎáÎ		‚<:Ež/Ä0mÔ€Ûñ®9;›1Ú &ÒwRzåÊG“•J‰ìB‹óY=š°×3q87JÁÞ‡ÑzŽüqiÕN<ßæ¢x‚f{º>áÅ<Å`ä—ÞTšwJYÐ²Y…ã˜lÔ÷’g£ÉNYr[Ù`Š–˜¦ˆ¼5Ež’3Ø’7jÆšÓQ-|e0—Ö©8Ï•De$sæûýtLOJ¤LÌA
&Èú1hü†×tŒK-¥Gõp¯)¾1X¥w6iœTÙJp‚{({Ñ0Nöd­¡ÁP³ Œ!XY×îU­®Cüë¶Y†¹Cð)è'( qÛvbä¨©~Cüô¾|ìtÛÂÑUªcH÷—3"‹Ñ‰³oläöñnÊŽŸZýÐKÍ¥¨M)~öŽ{;{Ý¶öp‘;9ºMÎ½GÏX¾ª6Œš|
³uØ:eF•Ïéñ†4°G(GÑÍ«µF]bÒX]ø HLÆž<q2‘5¥+KpúÄÅÜ†Ó(GÂvçC¯s‚B}w»:>rÂA$5üžµ¼)W­d´Ä}‚µµÆ}y_»‡ÝÞÉ—½î®ÞèlïÑ.À<#rçSÌWw§·Û9F ‘’ÜÆ? ê1Ìß_z Â@¶QIÚ¹tA²€Jª´[Ïže¸k°¯°r4žøI§u±Öb2V,¦õúÂpä
£‡bÝl®Kbe…L$Ã“¿%F ¡ìˆâÝ%.jÔ–æu0²ë!^¤ÛfaâIùöÃQN+
û`7È+¬>¼Ñ¯4Ùj“|<²Ôh±O¸sy™ñF›_
˜œå0c—z@8Š>pZžÆ)L­ÞÑÕJ8£¶hI©`*bjC‹?ßi*¦ô=#r
œrôñtÀOpq)è´Éjè¸ÖP·ÞÊ0vå¹þ ]¹i$}¸¹Ÿ?{Ññ>
ƒØ%zÃ-v’ßÿ'î	“ˆ“»†ãXu)s3tæ&RÂdwÀÉŽößrpës÷µXã…/>è¢x´¸sŸ)»µÕ»´S7“gÛNž²¡<˜³ƒ¬5
(6vG¿¼ß9i{ »ÛœyÅ\ôŽªöOñ£^õQ„1º
$©Ÿ©+i~òÔÏìˆT?ÈMÖ-g©ÛSXm*ŽÕfiša"w@&¹\¨¼¥)ÿÌ„º½‹(À}Ü¯ëNµÑ~e‰ò·p©° ÓÎuž7ÚÓ´ýs£?}¼¶]ñûuá äè+ Òuv…Ø•.9t¦—‘<bß?3ì‰^JöÏÄ[±‡V@Òl›j¥Õô]6áŠµb æ{.…Dã&VSB‚1‹iÍÈ»×_SàÌ¹qGX›qónö½;9L÷S²wWŒ«ÛsÊN0k‹^u#NŸ$±jšqvÉšÓ÷ÏwE2­_jpÀªtÊ-EÆæ)ÇtË'o»HgþMB k°q]yRéa!Ð®@ƒ?Ùé~Ùï±÷­=Ö;ã£×ahlõ¾œì”ºçË¯Qü46ÃOq¹HÞi?ÁoîwÐãóÃHÒº‘QÇW–XcqÄÏ½øÙÎíéUK6òÿä>£°>~-&ªæÁÀfEî…£HéôA'™X£ª-å„§ŒßàSq-¬S|¾	Ào§=o2¯Qâ å„2ÑË–VO½³’%È1Äõ“SËZs_ÈaW™³æ°à‚á£1WˆÌC ù>Ì”Š	ŒoÚÄÌ±v ð²¬öór€)íÉ.ùÎ&»òCà¡C¶Ä¬"wEÙ_Ù±+‚E†‚Õ£ìðçaÞ³gÖ¬Aø€y¨@ <cu¬…]ðË¥Êzv8ç€½e‡`Fâ¾êo›p¿¹°ôŽ À+¥<TÎ o–yQ0‘¢F
‰JéUÈL ÔRü>OµÕS•±E¶rf—v´«E·Ò(#=‹)mêWÀiç“`%–£U±60åEæÀëƒv‚Ë:œß²CX…50k¾$!•žòLE¿0fSò³n[Ò*¥ÜfVÐrT^:ý;™Èäê…±J¾>ÓÕ4-²ŽÑqŽªÒŒfÊm›Zï”›åŽW¡rÚO¿×Pr¬_áËñ5ýl‹š—¨ÓÇ
ºt©‹f@ÈÄ
y6ØßŠ×nWˆG¢uƒµ‹¬<üØŽèúÃ¼#¼9;[CƒAô3[ºµì3}N{×qÅ¼¶ æ¼¿fHÕ`Êßè¬8ËÑ$üpU¼-­ÊDá‹¤p9-,ªº]§[£B‹ü¬ê´þ3ÚüP6'ÈE6½PÇƒm¾#·XÊëÌu*©*‰Â¼WT?`8ö/ô€{éâž‚—‚Üy0ûˆã^…ä9"8Ë‚"×iZï¬j­EQ=Eôò²$~PÓÄ"–+™6©Ïµ>Xe‰Võ¸ìÖz¹“Ó¢Å%ÍòVD$“à6Ó ÷º{°ò™ï¹dáNZ’×¬IWÜWÞ§Äæ£¹-VøWŒò«2#ýÂ‰„ƒÔA:aô!Œd"Ekj^KNäÈ¹Ù•'OÐùÃnrS¿ˆù¤_%÷“ˆJ¿r FaF«(yÚèÊwZ®vÒ´ü$íLçh­kx~vvºgcŒ¼ëH¢¾MU LK²†§‚Ü&y‰gÐ=$ÚG2¯á3‰q@ð›hêþ¢b™Ô.£–“w:*É'f|$ÑÈ´+8WH38N<!,FVž‡J¦%·T_’Gñê™Ò3`ËC8ß’úBvAqò¬íˆ¡8©÷U¸‡CA £ÐÇ¬lŸ[â<”Ø(q*ëÀ[ãþf=ÚÓ¸<­Ž/ÁÌôÂ‰×G)9p¦sk¨ÁãzÙ}‹q2dGº‰¾)üÚÞE>òÛ†1ì¦.ò>ÖµŽ±iŠôÄ¦ÓÞš¿aàsËÙ®Y:Û‘Reþ•ÃeyO¸9){²Ü x’Ù“YÛ’Íeû*½)‰. ®H¥hLW®» JÖ—þ9x¶¤‘ŽìŒ6ÞØ;žåt7HxŽŠÓå³†šªÐ~'•IVJ$DRjÈ\¾ïÃ]¹ÆˆÜK<Uæ@â)},ÓA¥4T³bèP~1r>„ó8WÑnÂw}7!;¶Ì—™8?!^Ó¶ò¨0å!?ÉÌk^‰#éz5í(°IuZû“¶Êê«DyÕÓ_eKƒ)Š¹>¬KS+è½‚L(ò¡þó!ïó —FAÎÕß|bU¡«–WÖ}¡RÈžêËfn‹/=÷Ü›zmŒÓxŽü]+Ü>0t‚ï¾Oý‘F¦I]G¦ˆ™IÑ™[OQ+˜Wä‘ÎVËØ\B*¹?}jd>*¦ yŠkýf
r7«ÿ‰×,ðJ½Ô8¢Nt”Ê,sL—Ÿ_‰ÝñÖ0ôú˜s…®|_­iÓþoVsÿäóÍú?š5ÿüžšµFÙÛÒ¥dþ€Ö¬ªN]¡\	wòXUP²eß®‹0åž3mJþj¡‡¨YŸÏ¥ÈýÈÅ	Ï/¼RËR½ñFÞn²Èü×›M¶²ZˆyÙ­ìóRýXa†ˆuCÇXe%Y_»`Á¢jJD´þŒ¨N´ç+ÞEIp½ˆJ•)<¾Ë†qo°«4¸ÆÎwZ»»äq‡5µn#si“ ÛÖqµÕ†+·Qå{ÅèxÉ±;†‚#ájN(>}'pf;ècúÒÛM@ƒˆí‡n,Çmôƒ6r±¤ôá¤|¶¼61äµ/_óh6Ã”QMÜ^€n1:¤ÍäaÓIâùÂV+»W¬€<  :xYUÐw}Ÿ+W¾s)â#7Æ£¢aeà'A+WË/„7”¦6¸m´.Ë4â^ê±Éok«O)&Žéˆ cºÌÐú¡Ï—~Ÿ.·ÒÔ
â‘e?%c«µZ6jû5ðÕÇˆþœ‰f?J”×P¾r<^’š–^+rlo1åÍªRæï\×}…›2´ýJÛ¾|Î%ôCRPÔ ±tš²éÔ3ƒWL=gƒ×UÿÐ?ƒ‚b£âMÖI&ö’ü†ÓÝ­QéÑ¨ÿsð¬±TÐ>ø…§ÔPCurdÎñòTÛïÏëõm¹rUêa(Ô.^ä¨L8å7/ñT©Õ´-‹¯D‡pšÏD+=—ïÄ"JŠÒŸ2PÝëf•jñ¨™µÜM?uõ±Ÿ:••‡ù‚BÂ×XQŽi%A„.z^¸/†8YîpÓ&o®Å?3]¢ÉlƒQ¡ÇäÜÈÇ0Yý¤Cg—g,òFBSH€ËGìÚ¹LñHë/^¦iÑ¡áãìÄÙ1õ¶bëï–»|¤©€ñó*Á-¬fÇ_ßï7Ù1þ³ŒR/òšxT§éÀ ë9'ðfàûÒã “Aå›sYZ©Ü	ÏzÚ¨ÚìŸÔÑäÚ}‹í„£ÏiÀbÅŽaåºx£6)N"½h@+¼\ê}vn`qrð@%Bá¼´C	èx„òiþãlá¢ba"Ôˆð[^+N‡âºŠƒw-·ìBKÑRî jüÌX-zÁÕ
5èÅ
Ö¢m”Þ<æ¸rØö9røJÈ,!8´îùî ™]§]žýsp-,Žö"°´w vŒG„}FîÐy¹W9*úvÐéövNØñÉÑÁqýÿçÿ•ç­NØÉÎáVç°ÃŽwÞïìw>wN:‡ì`çp»³ß9`õ“ãƒûØyÿ…Rz½ß9yßéîvÑ&v÷vŽ;½/Ÿ(××á—Om<‰ŠUw÷¶;]øÂ ‹•5Öë|úrHgLÙS¬ö¥÷¥‹íu÷:ÇPªÅ–×V—>-í,A™õ'Oþò~ª•m#4˜x¡Õöw?BxÄs™Õ;‡½ÝEÚñQïèðc£ý„tQg@Y ÿö7„™×‘pH?Áz€'Ìñ¤ôo“§Ò(eÝí¥ƒ]Dä•…€ÇUÝ±ˆ+`ƒp”b–8°`žZŽŽêy1ö¸PL“LBqè¬ìrAÓÂ21& ›8#:zðŸ0èà’‘Ë¼>¬VáUÂ~	£šuÔ¹G1£ØûaèÓp<8ÐÈ|2O¶˜g¨KŒ°q<©£¥Œn‘×~²ÒŒí¶Øî6žOü°»ÍŽ¶¿ìZêxB0¡Ã>_Æx†ú½|tåQð»&\›l«…3HTãëð ‰qh±—ò&¾ò|¶ŸúiÊÒ“UàÙÞévv5ú É\†O­‡“;ï·¶	È}F	KŽøØ®?N	¼uXj®ÔšØ ä\;½4ž¬qø ÀýRå§EñWç$q0ˆ¹·sð…ƒ¾ç^{0U "†£¬l°q`DñTZ½\Æ§xáÒÁ,[kxšû»†ï9<lí Æ(<ÞWªwFC/b+T¿ñdÀü;nw‡XÒ‚Ç¨AH Ûžs„´PdÏ`m†¡SÏ®ò$Dso3ONr(Ç²‰´@Âú¯‚¶•¿ï¦üµlzo¯wŒv£oÐá¡~ãÉÂÒçx1(˜ž½`ò‚G’!!§¥I'ChJË3¶—} ·5­xn_ŸíuQEÂÞ¤¡éeD
C€0ÝvGÐE“=‡ß;Þf]dÑcâX<ám›5Ù(=8Ç\Lp>…
	²É‰{M‡†­'O¶w÷q>¢`ý„lÇ¶wYdôð¡bfÇ\T°Kçáç¬QÓK0k¥dfÌÄ“§J,Â|o@‚°1½èhàÐ,†-ÚÎ¤
íIäuvŒð–-EáßÒE?ÈçE˜Ù2žgu¢Âm˜ßšÄ.@¡$¼qxŠÌ!Hø	0=Žç;MV_ýÿi»Úå´•$ú?O1›­ëÈ.°ùˆƒ³©6¶Àv¸wS©T­d£%PWyßdïƒí“ì9=#!	Ìõ¦jù¡ÑLÏôt÷93êáíntïr ¬ê.EÆpqÎ‘¿ô¸ZÃM‘çšWq¡ŽáÄ2qi¬Ÿ‚:G>ßpÆ…·¼aÏÄÀáÿÇ¼aá9ÑöE˜Ív‚"´Ð©n ‡cõ<w†Øø.žì–x9ÀPŒt…€’¾Þc& <ÂdÏú>ò‡´–õÙoU{ÒW|+oìN}ýícät^ˆ¼;¾+ïëç<cñø”ÆÉ¢ñ#÷>¼g‡¡/üeäk‰õ>`$oÝc 9nØ‹w®Ø£ÌÂ	ž¨äØ¸QQ&çêüú¶GÓ—>áéoÆC„#;²_–àšÉ¤¶$.C§îÆø¤Ç}ŒþÊ11WIÂÙþÙ›&O¸ G?PÉžÀµòn¼‡‘ qn¤ÄÚm3_Ø½7ŸÏM¿î¶/ÕÅðvøEjÒæ&»75_IæôHyg#ž†OòèhÔD‚ï¹ì]Ví¢PÂ7s4ð+fÉXºù¶ä6?˜[èŸ”º0!&œ³L¨Wkx
ežO |‘"±LÁ„Hîy.…ÈÆ’ƒ©O§ì°ÍvBA9ZÞWIj ‰8Vd4ãMÉX7•Ý[µD‡áÅ}Äë±8ný% )ƒ‹™îÞ3´üÝç1³%eÇÀ;!áobÐðÄ]Œ<§ƒäÝoSwwvÝÒŠ".U–Ý0K j‰Šiq/½®êo¯XV¿^ÿŽ©´£.Ûö¾ 0æ6Á™ F4ÕûqäqâýíõðEù–cò8ø)VárŒÆ7h,L ÚŒ\”!³w¢ä~_ÕT•Æ|i.<xþýØæ+bÐE€Wv'þ=ÃóèØOH\‡ÐÏ¿VÎkí·ïNÔvÚŸñàCUH94Å`kfBì¦Šç\`JÀ×^‚Pt¤ªøëûƒqåƒ–™ùßŒØ#ÿG"÷¦6jÙø{SÑHùßòòV(o"HµZ«Ôë‰ å¯ár¢Ñ•#Üôú,h8-êù
hœyÞ~Ùf²5…hlÝÿNXrøý0Rµ0VÑx3Íícm·‰\‘È…•9IŒÂn’‹;ŸF§´Zl²²ff·”ZÔµÚ3•¡ÎÑxa4€­ˆ2è™t¤(Ê~TÖ›V"wî+K»-|ieæKb¾_n¸‹½’tÁÒ™%SÑŠ¾T0œ¥XŸRÞ–˜NyÂ®ØŠ®žéKâ¼%iÀDógÀ¥i¨Þñ¾“f¢ˆ<ñab”šúŸoVŠßvŸkÄ9åbÝÚÑ¹þ.dë(Ž¤MŒåÂûÂ²»U…[Ð û“µØššiMw§ŒÍ¹£|Ì|á¬JYÝ
2³j¹Áw­j´Òà_=Aê‘ÇäCOý]×´çš¤¦©æ~bÍÔV˜ÄD”ä Q5óñó»F‘^42O€òv4	‘à-á ®ª–*V1:TŸ7ùË/ÿ· 1§'Î7´?	Æóñw1ê¦ªý*®m¹õ4Ñ”‰ôê8U¿\–¬´Q°KÏed-HïQÊ@+ÕFS°(èjï¡µ™a%)·ñÀ°QÍ‚Åªk;íÇf|aÿawÁê¤¨ü¥Ì­¾Æ×£}8ç
:§é&”a¾&&ÆåQ,³Ã,´`BRé’È½$G4ÆZÍáF¹
-õ]p4â@·,4Ú³òc¸ÛÂhî­æc[$WD0ñ¾UA&„á”NÁUÖ¤,R™žãbž’5½ý¤ì4?Ž(†F!;y[ŽÛž±z›TlÞõÚ=ûÒî9lY;XÌ'‚\¹ÝÛ“`	‚ “;=å'}$z—™Š™oÎÊ›
’#“ƒêHW„¹éŠ—îˆvSw˜³%óÏ„‘	b·áˆ¸±T0µ(ß\HNsr	š‰1›¡•fnôè
£bê¯êúoÛçÝv§ïhlJ}ytV)ÄàTÖœÌ‘f³•1õ© Ò‚€9`"It/áA‚‰Õ4ãˆ”Áý&CçÒBT³³ÁŸÎã‰¨}´`à1#TRñTæ‚Ë¬É™F+ž¯ôÇÌ>(£Óú8š‘ïñRfËÀuÏa¢êÛ8½@ì¨¾Ó‡±N?ïË2NH>kÅ”e^ŸªÂ›v^DÂCƒPC!¼õ÷¾§©*ÎPfšÔWŸÔ)zYxt¡xÌ„™ïsïî€"8¦œ)9Ÿ¸Æ0Zfý6·Æ¾’ ë’ÏC(h†Ë³Vìä.ý4œ9OSÃÚ+æ:Û	-Žc"mÖ‡™MKó¯-»•àêL£ÌƒeJIv2U^^úyš4å‚ó|©²ËÃßJªQ)¿åß·•òqåÊááotj£º‚JÊZgWtþh«kŸ¶/¯»€‘»õIïªˆídz0ØY¤´oÈÜ²¹ $OO@š°TÚF%1cw„ßK—F’#YüÅ4âl­â#©Xgª¤ò÷¯á«’™ ×™c_\]÷NGú¾®äwÅ\¡K²Áê;x¹è&gY$Þl½ÖªÔÚkãÑùékn_õ˜pWÚ\šXí*„>éb±·0öiö´u
¥•™Å ë­m“V4€)F¹Pd-.=€´,åÉnFÒM@ÕC ÚM©ë¶n…uº¶“±75Õï`°•Õ×)&[Üð¹†P«âÛiÄsõùè£½h«–O²‡A!wï=SjOÙ)ß÷©/Öó+E¦D+KÚ§(ÈêD>Ï…`‘yûa„QZì4-&Ñ3óØÓ®G}wYÝ(Öz£!½Ñ…*@Ñ;íÛÔ‹>ÆÀVgÎzÈ¢OÛ…fÄgwlg}”dA–úôB_î4¢UÊØtÉNsú÷nDºN+(Ë¿ÊÚÿÅ>õ+YùÞÞþõo•¸ÝÎpoo]Þf…¦¾6q¶ßBñ8ÂúÎ*2ì{ÚU._´Æ MÙ°^'oªXo§™Ò;‰“ f†–>uyH6²Ç¸ÑŒ¥˜ñÒe¾¶+÷Ç£jMb/á£„CÕK+óZ{0¶Éf„2ÏËÜ~éÎò†—þv¢üÑrÜT4³'æ>üoþ!O‘ñ*/ÃySÏnbŽ~æù¦ÃýzÊ°½œ¢{•‚‰¥6 Ëñ.p¿÷ÓL—‹TÜId0%›ª9¤±[ËRiï.Ã‘ËçD÷nÚœšó¢
ÞÕìjëøDý`Ëoî$©]˜!ÛGïª­E„[)*ûµ:«½ÖG‡A=?ÙÎxNEŒ’ñ%ˆ˜mæ›µtH0
fê!rÉ=î¿úÇÉ+“±Oðmq—'°t¤Ó”4Š?-âoÌvÀ´VÜvVüÐÀ}ìñç£C|žÙ0dò#%Õ˜7€þbž½¾mn}«þürþÅÕçØ0¤?Ûs2æîÓÙ·¼½2uê‘„Ç\‰z½ÚØ–§d@ÁN_ðôìý­x·ÑT‡[îîUšM×7¿]³Rnr_{ÓfSÆÀÿ  ÿÿì½ënÛÈ¶0ø*l£OK>Û’,ù’Äm»·b§Óé\Ú9{Ÿor‡–h‰%òðÇÛÛÀù5Àüú€Ìü`€ó
ógžg¿ÀÌ#ÌZ«ªÈ*²ŠÙî$½ÃFÇEÖuÕº_òÏv‡.P©—f.ížƒ±mç'‘öuŸÜ×Y¿Q?u™ƒ‹jÕ™÷D¯Ñ‡Ô]P…t©÷¬ºxk{ð¨EµWäŸcÿ…é„Gvä´×¥‡ÿ#ºSÿqÊÂèa÷Åw²§€ýöæõÑ“³'ÿöËðÈ?Çú9!§.Ïè‡¬ì¨õÍ±Yx€ñ3’Æ„ØŸÚüPŽgÚ%ü×..µß¿N§dÍÜ˜²P‡W¸Ÿ.¦×N»é!Ù¼Á ŠØåãìXý›tÐˆ|×ó¥£$¨kêï&_ÆŠ*ÙÕÜ{u9v¦¨ £ÙõDßµ~u&6«t
`¼´u« èXÝR ÅÈ?ç.ÀÍÛëïÍçµèç+.†%ÑKš×:Ç
yT-Â¡øIŒw6R007•aút²ú;9¤/_|BŽ60¯,ý’ÈZ@)ôfÍ˜ü")$ÄHc
A"ïÓ7,,×ˆA²½@Ê‹ÚÐ\è‘Æ~ÆÂZÁú)sÝÕ\:Ì3²»ßÇQ5DæO¬Í?Yï÷ÏÃCú_2€;ç¡cÏ;öYÐmïÒ¾Š~¤œ·!òCñìÇµCfz-¼×ö'…ïˆ`MtºÕdaÓÂDléFuÚ¼'T2ÑXr–æ9M¤–æ©4xÎ¦ö%¢KGsÞ±’§«¨EÐÍ×å.z¿Ê+itDz¨þ´°pîdÂºKÿèKìs²ˆD‘°yh/'þBþikw¤Œº¶2¹aúI˜Ç"ãOQŠéé^ÎPwPàžê&©À ízÀ½žpMdž¿—óÑ
³;`·£%63?ÖsMRà½6SF:“Ô'%íO[Œ>B˜7Ã†ðÁÃ¼§žmÝã§/Ü(ÞÓžLC€m³jB¬œ»@iÝ<XéA¦ê²q{j<=Äz‰(ÇånýÙð–ˆh©ƒëY<ÐB313ÛìÖp»¥*9±ˆTôgaÚ÷´ÒUDÉàŽë/X™èœ§HàsK*NëÌQ ´~òÃ«nÆ¡•&]KÂ¿èˆò=ê«˜U;ý÷å¿³ì¼úI2â”&÷f¹-Òbˆ  'ÃèÙ^âŠ¢‡oèæHšjûØEµÙ»°{Hî0RdŽÏµ–hââ+Â½—‘#'°&ð¤2íbâ·ß5FAEãeASkEì›]1QË1ˆÔžoO†žW§eCBú,<H_Ìâ²¥4¡<îqÊpÓEìËØ%ŒL¿ôTÛîÊ(WU'ðÅ7³o€‘áQ†3ÑC*l
—µ+fI¨ê)É*¿É_TãáåWÇÄ3s†ŽKgS%ôñF¡é¤YîåŒQ¿Ìg)t/ÂðaÎ¬GÞëYG3g<Ç)Ä3'tZ‘e[(öìJÙW
ä?ˆJ—bÒr
au5IÇ#GàJÒr?¨bƒÛ'Ã“'¯ÏFÏþç'£·ˆ s9^.|Öˆ0éÈ¬ÕÉûT2Z}C?H¼ùHè7+s=}¯ìº¼ù²ÖÊå•ÕéÊfØ¦ FÀN½v:‘Æ¸Q ;Ñ˜	aÖùÀÁÄùÔC&ÇjcœIDiÆÓq¤Ó“uextLAX`NcÛËŽ+&—·ö]7Ä”å‘“Ö½ž%ub/f¼ÁF¨Íè’†ËñBÒkÊBéÃ—¹DÂ_ï²ÔÖ\[†{-~g·Z «d©˜œ‚bJ«Øƒ´…\RÑE/ÓÜ¬}ýrd©ÎMš"µ“û’ƒ¬r„¸«*œ¥X@¹Œá>-õ§…·Œöüƒ`“=VX%ê,DèSf³ç_\`–'ö§Åß¸¬ñÆ¥Nøó­Y{½Þååe÷r«ë‡ÓÞéëÞë'GÆöfëP˜cO¥©í£Ó ìŸÇÐo|ÑyØR€Cí9‡)Â@^	iÈ˜a¿Çž•ß¦M9TÖöÏ¸CÅ8i2 6‡¿]2DÜˆoL~“ß¡Eäwh³¹{+­À©m·p„—î`¼ÿ×5:#›CG¼±…ÎÁšÇF­|ŒøS@FIˆé¼rª•»=÷'E­w©Í¤5r¦¾£ØOZ¿8ÞG­Ö+'qZªEEÓ¶äœûYcˆPH-ƒG[Ê¦6ë7›˜ÆdúNqèEKP^€-zM›&×ï?<0ÁSæõ­ë@ë^¶Lƒ{\¦Aw•…Ë°¹óhw÷ÑŠ³´›a_wTT¢æ	n¸O2ëš~hÜ0'½—.ýÖ=.½æpÕ^ø2øãë¹Y¹žÛå“6à°æ/÷±Õ¼‹J¢Ž!Æô9…1˜ÍÕ¹eãuÉ<ªAO·šE[vÙD&Àwf¢˜…Çç“§Ph"µ(C?Öƒâ`tFä²áh†R4¡_ô/v.
g¨>v¸è?ØeH–ìé%ÃLà0ùÞ-aPƒàÀþañ–ï»˜j†ð©S]¾AðñMT`êS‘DÔ„u„Àµv/ŠÔTÁ&<Ï øQñWy£BœŽiŸwÏ&Â;¯	ÞìéÒ£´ßË±û=•ÝGŽIá7+â¢rà2Ø¤§Ü ¥˜²”Êÿ˜§ƒk‡Ïß¼<yó‚Ü…VŒèRúÜÊ÷¹ÃbÉÒ(­Ûý>ô[Õý7Hƒ™ÁxòÙV¡¯ ßÕ€uUÄrk‡ù¸ËýóCš Ó‚®Î)jƒ‚=é9Y6 ³ðNú=UÝàÏ(W*›/BÄÒ%
Å¸ÅÁÙüQ=sž)(`wšVOn8ÒDÁòFN-äåyÚÙ=Æú·,wrÐºè·˜üI“eß¿¿ÎÔ-¨?ù…{GïGèd,5H•ŸOœ½5ëdøô‰µ­õð1! ªË ¥€<ì/ŒY|ŸËÀyîùç<iÛcøØ~Ûú÷äÂ¹¸àf;.º¾ÛP°	7íÈÕCÉ›BÎ¥ìLBT+¼yý¢;Æxt‡åõ…ïmì?÷0°sLÖéÑ/8æ¯ðìâí–©‘ñÉî,t.àqèB¹=áŠXY—uíŒDÓ3MÏ¾¿náô%Hcž\åóß£?Q•Ï³ÖúÍ™±†' €%°…qŒSÍA:%Ü¡.º]-'G3×›´qÈê´Æ°´ó,}¡újè,üNîÕ¢2úM€qxÇ,Ç¬NýL9~¥*¬T%G¾ÃrÿfßyàìÆ„*¦'Ã:®îzN[š/¥I
z|0KY(îCãTkúˆ±¾S3)÷–ù]šù-ó»,±.K‰+zÓÞ)/4c\Í=‹ƒ)Yß(u±øÑÆ/<7¼²P_JµøC>‰¿>ÅŸšÏ_›Â>Bóü÷Â¬rú49ïÀ§À 0ÈÃ¥í]¡#ü~’ˆ#ÛÃ¸¢Pü–õEàžV\Ê§%¶?’jZC@õF +ö”ãb´[ÿŒé¿Ï–Ð"óìjQ˜‘Å¼æÅ‰Š&%/·+<‡íÖ6·”÷%ª×þ¥šYúrLþ‡ÐeYjõ‚NZ­ÚeÊ°žÚ:
Î”±•*"Û]Å õ]f~9—Î§Ù –h,õ€o™PeEa’I:³¦×sîx_ô®Ë÷p
ì ¸ÚÅm:àÓÓÏáà@ßµÜˆê˜™òeëªË[_ÌYØS”ž„;ßÀ…§É»†ðñ³%Ç‘˜§—Ú€5˜$°m{<’C0…
z¶§)>@#òO÷×7r¥d¥TD’u÷³F1€zêˆ*=ÆÇ!gá/±®PÊY„f9ý¾:,žºTy`Ïz+J›ÎÕ)öØº)d­ÅáCeC§Uóÿ»y“o2µÇÂ¡j/?¸H@Ýì `µ ãª	eu-g4áe–º>}S×~öâ‚’´gùÙËŸ¾Oÿœx¦˜1¿ Í¸½À´ì»h¿¢ã#'©aÁÍuØ9±.èKŒµ`ûZ´DüÖ`]»V:ÿKÍ­ï’‘*Ö˜—ð¢Ò¤*øš×>ßæÄ
áÈ	k<å‚zþnÖÊä`
	%Ë¥ÿ§?¡g¢ñí¢ï”A•=aâàyØ;ÜG‘”lCkƒ5ö †SðÁÃò‘Q…–¦˜6·K:®+n•+W'ªXªÎÕ@Ëç¥âFs*µb@®È§Í¬Ã®x^h)=BÕsÙ˜¸Âœ¾ßs[%³0£	ìºùLÜ™bâþûM¥ß§OIqR³Ÿž©¬ƒ¶Êà?›¡dih/X$åjyýÛép½™m›[³&& +'KÕ/~ÔZ}sÆ&².µÌ	«Pq™7¯ò-s‹Jí¿œMéS¡=nØÐ)®1
@¶\|2»mZkÄ ÿÓçßÒù©v™Z®¡îïçÙu¹ršhô¸Xp¾ªdHké/u7KZšHËÌÞLW
}2*Ü…Êœé.×ØÂiâƒ¢B|íNÆÓ×Ã—,%æðUvTfƒZêíOÔJ]k½|òúøÉóa^e]P/Ö®8|Ú–ü]öKx8§ä&œŠ·E–Á4ŸûQiIc(ÐÃ©u•f*³;
šQÕ:éz˜ÊKi_òÏë‰QSRÅZæ™G^HùXwØ"¯ZIÓ©ß`eÃp/¿£H¦ ¢Ùç“Îì³mx~‡ÇT#/~£Do>?}cž¼|‚™È`·õ0'Ú«¬>÷ þX‚¦ce]àqMM"F$ª}Yìá'Þþ¡°×ÀŠÏªžeõÈk=	<Ã/ŸÔktpiµ=Y¯ó<Ë¯ùëIÙ³FXíÅy®!k:6Õ_+²ŒÇ[KÙê[m&˜®èß¢Éï¯™Nj¬ùVæŠ8¢.#+«rsûî$mkæÞï:YÑ·+R¢lÞA_ÕSÃB¿ûŠÂ
è×cØª_O
¥,×ßÂcôyK,Hï>×ÃþAÌðëIõj˜à”àn@n  ‡z?Ä¾A\n=îâÊhÍ#üOÇœÉ˜4Á”#ÛZ•sGI½FB.í0~
ç,ý<zB\è]lu½“KYj®yùö–#Ñ©ÇüTð2»VŽ{Ï31z¦y¿„B–@ÎŒIDk[ÿ²vøÊ/%ÎÙÃýð4Ó"br©ršž½6Ø„×LÉ¹k¶±…m˜jI³„â5[Â9T°#ÒŒq}Dþ8ž³î«8â*vÍÀLëöÔÌñ|ª–ò*EÈÀõÖ,&–Ç•/Íe…å³œp){Ÿüþž%½žÕét0y!ªNà#Þ¤zƒA0ŠQ«Eñ†ödá.[™î›[/÷‡xÿØŽfç¾N,ùhÄÁu{§šòVÚ-Œù@N=¤Þõý°§(6Q¹:S!<‚Èæò_@{¥¦¶|¨íòPBT Ø_áò\3¿jóÔT0O7	p+ ÖY'€ u>íLC{‚±(Øïœ‡VìDèuÐÙÙ´ðž—ÐÇÏùDÿ ýd¾£AÖ‡$ŠÝ‹+ñ5èlÃÀ±âëGÇÂsžÙ™¹›1ùAä‡ ¸xv-¥zj¯{ÿj=N)¶uìŒý[èÿµ§N-S§°ùÙç  &±ƒª»ÎÛà˜wäÇ+>_víZ3ü&O“lnZÔ3é\$žg-ÜOð@Ug‘x±xWk…£„­OžåöØ¯paì¥‹Ù_;x
×ò¾o¥#dôMŒ¸í(ÝåÄúw:NNi¯¯ùmXÚcL•¸hî¹ÑMDfö—Ý@âåbBWÛÃöù¨¸ðê1 ñÂó|lÊó}z^û8o¸Ø=¾9ÍY ÕfwG÷x¶ö×ï/ÙÒ}-ŽßOV‹œ¥;‹	™TÙoÚºÁ¥¿œ¤÷m’ÂwHÑÒÂÊŠÀUŽf6 ÊÎ >2…ˆÐ‹°×añƒÎÃìLüöø½:Ì"ÑÊC¿ÜI[œwv¼jþõ ³•ü®HƒløÞT|Oõ¶6KXáýÇ¾?ÿ-ÀCõs	ÁÿÄªÒô×¬žaˆE+¹]|n6PÖ¹ø‰ Å¬wÜº_B{vŸ/}f˜î!,¬åÀ0YVFºÅÆèI ¼AÖÄ±/bb³xziæ9U„Dž™œ›¥‰Æ¸ÃÆ¸Ëï-jŒõ¥%ó,ÂÔžcÒ†0Áó9eÖdaæ˜FÍ„*Œ²›<0Só&0«¸OyZ1›¤¨À9²˜ÜR„¥vâÁaÞI„ötc°ÄæúËQr¾pãƒk;ºZŽ©údÎkÄ¡Ô	èÐè\Ø€õT7¢ß†Óå™v˜ÖÂÅÄƒ˜w•3BúW¹(òo?ó¯TœXÓSh_>Y€à„6lþ(º´[ÞmiÞpøãÈøùRHú™ã`ö.½¿—«ÍkK´ —˜¹s©Ý‹ß¹×n ÐK¬9sÖ+>¿d·³§yÒqc
7v¿wíõu6éL¨Mk eŒûsŸcwáüº1Ýz»ùŽ\\àDéÆ#$L« =¢u?Ô="®	y¬ú#û£C	±Ç<Ü°!VŸ¤¯l~¯_¥¾pÙ0°Éyß±U*xÇåšÒÖlfyWZnX±øsLw ÊPšüø{º~>ºÔ–,!½_	:v¡¹#ü)•* ¾ZË¿!wf¶˜ØÒ±?~M‚
ˆíÉù†ÕÂ»ÈUùõ1ùˆñ¤¹8P ÕvÖºöÕ4+ÎEôóÚ”5M.ØúÙÌ¯ãXKÓ•ÚãYX€aÁÄÄè[cÌÏ‘UÍÅÄäWkEÌ±vfÇz½…wîU:u8¥âs×ù€áA­p ;çX1}åÀö:SšV»åoB§ìS7Ã])"3÷Ÿ%Å9my†Ç©…y›ÎZuó†(!=Ÿå3¯2¨TÇv7Ð).š	–P u¹uØ° ÅCž1(›˜!û©¸RfÝ”‚µ<×¼üX*m"Öùí@{~2Ù HôG`í]!@g}–±ä·JhÁ5.ÏòänDãúæ–pzÉ[ÓÖ;Ôº·—RmuÉ›ÊŒJ«F£7¼³É›+V79‹¬%%y’ä•Ê‚è†Zkâi¸Íu/?åb9öÒ5ÚP‰ó^¶ÃVn/ö²í2â&¼ø9ÃSzüæÅ"
ã`Aç,„ænN_ÉOJTE¤FUàPáøäR‹Å4§A­j7bÓ9s'­ÂWnTl×	7xêÅ†­Þ¤¨²‘BÆÊÍ‚T6RÀY}ˆüœ]ÁA£Õd'ñ{ÃNV‹’³­—.xõ,JeÂÃ#Q;w¥]o¤×Ð¥§îîðWä•“Z©jæäKS/2^5r!ã•ùæH(¤â#©ìLB®{é–W½¥$é¬ìÂ€üÊègåd*î©%Ô'ë¦æÊ“Ó YzH&‚ ü%X<›q{T°J#ƒ¤­kÙîÒ{X’³Í?XwÊô€¤ÃæL4r©ç ¥Ì-ãOS±@ÐÕ¶ÒËaž0§‚l¯Ô&°¾Ù·¯‰ý-2RÒ<îˆ™’Z¼c†Jj¹&SÕŒk©8¯&¦¦âµ<ÏSñ¸  =ˆU¾md¨îOæ˜§Šç¼UÎ[‘ëú¼¢^”×BlXµHx*Ä1õÏ-%8ì2Û,@¤LC!T{ÄÄ·‘Új2Üµæ~§,ô=!ß8ó†Í•sæ58àûÞÐoŒõïÃXÿ3r½¹{%#ø¦b/W±3ÃHÓÞ\^WF¨%tóUÊyà]³˜×†âpž,E©BfjÂDâ,ó¾=±àXèŸCiÆu¯Àq×â”—UŒxIilˆehN‹ù²÷Tƒ¤Î-{IJï¯ÓÜ–÷WŸwoÆ·yvÃí*^ý®ùôÕyôFüy)o.LÐÎDeÓ7XFÙ¸RÁ£›øó»âÍ·WáÉÙÉ3ëÇ®ôp•q
wÎ’7bÇ5SY­a…)_–1ä+0ãüÖj#ËiÉ%ôµâž¤Jr-b3™ÀpïÐfšXA^h²ÿURƒ®­²ÆÙ¡”ë•ä€e+ÿÕÐ¸[QòqLÚb¸Ï«½ÒìhìÉ3;pÏæÎ•ðÒ2!ì²íÊdXMŸ20Ôâl•ZŒJ±’Mù-TÉI«:å›ç\ç)zN\¬àŽB&µ©0“¨Lh[ªN"õÙ•Ü £À;«Î6úˆk|ñºþNx;ÛÜ6îÌ~Yxs•-‚žò¨€²4ÂsØá9sÇü1OSr2MóÉ£ŸòëÚb*fÕ›s—ysö×©2ý^_ü{üh=u<;ÜïQ‡5æ.±Êråsx¡óó0]«÷Â’fŠÿ®Õz>tþ#q‘I©õ´â7L~ÙÁ§Î¶\uÝÔE¹àUÍ–Ýá/|8I{È0tò´ iøÅ]?‰)	&©œÉ;ÀAeNß6SWÛZ“¡¬y3,Ï¬aŒ?Û³'p"F6|‰ükÔ=™t«[3øK‹«:§yæóÃ´0Ýô¬,»Ä—ÒúÙ—²GÇÖ+gê„®Õ·^:0Š¹ý‡‡lØ:
ÃÐF?;ñ¥ã,Kc‡¥R¾læpÿ<s¸?&‡{žM»~C…ø4Îƒ%`Š&ËsvØtÙR¬þìÏ“ÈzMaÏ), }®ëŽ¡þ¡ÎE¤LCwbá?Pu¶¬©C0ò×õðÅ‹³á_†Ï^¿xrvôb8=QH{{ìEÆd“úKä	FºàòÍªF]·PLÂ|b÷ê\ûçIûËFïà\äÁ5a™ýM1Êz®‡ä+@L'_Ëk×f£Zo>,9l+0àMbïË#;5ÎÐú¾>0ÈW+½Ž×OVKŽ»Êâ¢,wãO<øj1)„a6M²AõµGý3ÄÿpÓša@æÜa˜­ýh„ùl®ÐõÍûf›]ïÈËW!8.Eçœ°Yžc³ŠU¹v(Î†!¸¬a×ï©›·˜ÑáÅ¦˜¶;CÀ°ºW%-è6Ü‚õi>¼P°·h*˜'ëÙ
G}…ùï÷f¨ÿV¥Ó»njà„ã­xdßÀs:×Þ,ç9î‹‹&{b%y­Ã+3O*­
&™1ÇìÉÒë±Ã6Xa§Àý9b¢M7Ï ©˜ßnøJ?}H{ŽÖ5R'Õ"Z}p¶µZ—>üèØ¥ òbáò9nT„µ*ÐécÞ¼¬lG#
Î-ÙOÍÊ_åâÎSþƒî<P9"ior}xKãÔóžÖwä=²‚´ÅWÌ°ˆasMÙ(äË|Š±ÖsG–£ˆöSh8ÆG'ží¢VÅ§ši¶K&b‹éÂÃ…fó¼Lì¡ènJP:OÑB‰&Ï™¥Ì’å•MÊÝŸhÂ#ò3ïšÉ|%àáU0R¥·4˜4Ë
ŽA$l©‹' ƒFp& d ”ýŠÙ$h£tb‘ù<–s/òzrP™¸Vä.]šUÙ–2g¹òdâf1CI/Kæ‘ƒ0ÌÄò3,ÔlŒ9rþ4Ä·þ›Ÿœ&çÀô	 "L5Õ·NgÉâ|‰.'#L0²^H×rM[“¶¡æ>wK®X¡Õë—¦ÁËœ~dK›O¯†)Hð2§!ÙÝ°&,Êf·¯ÍI‚WØ,ÏÓb?8	¡ÿ)5Õ6@pÏ²¬%Û€8éø+©FŠ Y/eˆ,6ÒŸèòœìn*YQ‚ÎŽ-ö‚Î®À×Y®:H sï”%Ñ¥@)Ó½!;ÃTtËÐji”ª;¡Vºe5µï!ñŽ%/ûK”® öóÇ‘¨™g\ŠÛã:Á¤(
Ôl[3øÿÂõ<>¢Œ>~BúhÌÚ¢´[Oš¬§²¥'g[EU&’~]—,wKÊã’´¯Yµ&ªEé>¶8îë”[XéG•&àøDühÀØ&}&ø%åŽ¸¢!#IJ(¯ß`¾xå°|ý‰5QVkJ{ž,²' àäòáÐ‚,œ‰›,@ˆñÜ9¦Ü´­8%Bi žÛ—À”ˆT8‹élÀ7Öv,J€i#×]øõ<™C#6<´ìjIhqZ·ÕRÐ#ZM¾"Öåæ/«ñKHm!@õU 1È95à#O­E˜X*&]Uöž
“AÉKöu`-&{yƒÂvÅ,3$"Ë|ªiH`‚6rŠ%L5Ž+Š+ú»Ï
O)é«Z$H~C‰Eã?Yï±¤H´×ë¹‹i÷ŠuÑû‹ÞG·÷ý5î¦7û	K‘ÔýLß[{Ü1¼²çFv‰«0ÈVAk»ù÷¿ã2×Wd±òœ_#Gž¬ðZÑØö°ÂHws`âµt—™kÔLN>ifi@ïo¾eÕÑ[Å…!ò@${éOlU[«o§Â«Fƒþºt—À²t±"iÞXxö°ê½ñ–>þè„K?t.œ0tJ‚-£«ýtƒ]SÐŠŸ©ŠFIg@˜sk‘Ð0d<.×q°w6ú‰ò¼˜¹l›‚¯gœ«OöQ¸ëïî=’Ä¶gLDš—ÚÊ®<’Ne;
œqÜa4˜Ë))Åz„
³ÜÜ·›Î.Åž?5´ÂÒ´ »ÖóõÈ_Q8>Hû¾Y­Û‹9Ž¤NÍ=xÅÄûãSö^ ­È#ôw8#"nbG×L•&P$2ÍÅxa6a`PÖ<ûoWÍ›¨!“Èe›»µqQ]»Ò”¹(Œ|tm‘±õK¡›A|³$ºÕJ¼Ê©?)='¢&b£Q
_Ð"¦}¸YKÔv­åf¹$#ñ±[)ï/ýŒµÃSâÌ…\ÖTKÇ×Üº~SÍ=É¢×§V¬ßà|áf4A­4NSö`w	Ä¿³™È˜Á#ÕçA™ Á‘}0ÒilÌ‹™nóî¦‚Äím…jñ»iŠãÆKqDìL0S¨&Áæc¦ ¾óU©¢%§´J&‘Ñf…CVÄý>°~^Ó**ÇX0xÕÐÎ¦m÷Õ»¼Ó"ó‘âñ­ZR vâ÷¤R*ô³ŠÃÂjðyêÖŒvê‡ —ö¤!D]—%#Gme"hýQZí¯‚:Å’¤Vb‡ÿÁN^‡É X®fZ””IU¾Ñª –ŸÖ%ù_Îè_ÝáB89ÎƒÄÄT«Ñ¼÷5ð€BÿWb1Îf…‘¬
Ç)­¼uÌù]ƒ2ÏZO¶tJY_O7^h_¶}EÊIØN)œæ¸·†>¶ûOÒîs×ï»ùo$ùe
ßc'Ù¯X[¡´Çb‚yŽÖàð«|îjÒiG³íÚJQä¿e˜²¹HyÉ9ZZ Y¦`ÀM=£e2]jV–Öt¥Ë¯[ãEŒ:bF„¸Š"VõýÍ2öI˜ÚøIìg'‘ëáo	L$EÙÍtÿïŽÙê²•ICè,‹uBÖ‚fF‘´—U¥“šÒÓ¶v¯ØrBæ„\ð^XqŸ|‚î–¶÷Ë×’–ïq2·¿`”YïQÙ?¢êé
íf™Ûk™g ©Z†ihyiQ>³h¾@²}î²H_\tÑ°seƒ†Ñý"ï×p­óløQ«»FüdÐãÊ8Âýd^H{ƒ£1Ø|W-QÉl…ÊGÒ¹’òžMèo*-tZ¯_
ã6¯ìø‘[E›*»^ä5«Æ5©—¿¥8’Pé…†Këò7Ø?wÙy´ÓÔa®È3lgá‡u…cA„ÿea.wåñx2Y¢`a¥!Q?¿~fÚ7x€pþìÔÅu”‹$#bÀLâ÷àn]:TGbü…XºµÃ:áLRµ/@›y½½l²Äûõ¨–Ì;(Îí_õø¿˜ªÒ¬1SYÝ Tï`MXÔ¬Ì¢Vïídæ‚HX@NI+1|),tÊ›”õÖ¡ã`ÙôÜˆm8àv˜T¿\óô˜yR`Õ<%v‡ê8·Š«yžÆ-VKMëAcØ B‘cBk@Ggkùª¹Ÿÿ¦n""Âº¨®N`SexQ3–*ë(q'U>+z÷-.Z¯eüÜw/B^­'ófêƒryy)|P:Kìûs—9£`ñÙIïûFc½ùÉN€òvÐÿq]¾Lžéb8ÃDiš€œÁq5ž¶l×Áš=;žú‹4[bZ?B7n@õF;—!“-g9¯‚µ¬ @Û?ZÓ«ÐÆ€â´w'!2]þñGëÒ9ï ;Öt ñüóQÅÏÊw*ÎM=‹j¹µ‰T‰d‹
®Ì*õ¨C¨ÐÅ9Vë5”°>ä­Êj	šŸ.…ÔQ}¹ùÖÜ^«p$xÝŽ+ÁKUïˆX-‰sVLZ¹°¡¢ÁBp/F^d`¶­b‰îÚë¦BZ‹[º:.è1pA5Õu¸“jæúŽ:…æ×õ’ËYŽ+î«¦/\Rî8+m¬j‹UlÅÒi tä*W†Iè‡¶õ;_øa0sA’ªWU.VUùqhìÕVÃ;äYiÐ¢ÑŽÓ¡ÉTm¸Ã
$óÊÃo·ñïŒÿÍ›ÚH‰ˆò€¦ú°p€#D:h‘–•%’KJãÐ8yd1Ð­6Pú›(÷Á¹ÍPWª’\¾è¢æó «K=¨³ìAÞí¾d6ÛÆÙT–ÎŸ7Òíb Ò§²=Yðí¦°qv€€7umÔ,"—ŸJâÿZ.ÏTˆÅÙM°ó­ó¶‘äb¢usÉÂ¡‘lÒH©|¤jÅüËœòÓ×S¯RSØæ0ýË˜ñÄ@9^8—°¢i°ŠCLW«ëèëzãu·u5TÃ2ÇˆœØÊpî’L†&°1mì4‡Sa1Ñîú¶ìK,—xV¡NŽ?-šv8÷œHçœ£ 5AË_œ0r­ÇNl[ëÔ	“¾„sÞìå´	}§ŸfýÂFPLâ„§ÝbEn6_5~K:¨Ø¦¬:xýb{þ†õÚÁHy,ÊíNÜùw€FÂÞaÁž»„¢XûbÊŽq9ŸºPøÔ	û™/¨K«5Á»e¶«ýÞ¬_;xS±r¨Óç8þÑ&WÒ$$«¦ìImÙˆ]‘©¨g }i‡˜¾K|–ý æ ÁSÎïÒ†.Ä‹NÝØfåÏVE<«˜‰*'ß`9Ç
 &À³?P}tJræ9çîÌ;o@#áÂž/ík¿‡v€}ŸSdùz²6¿p–WI”,±¹¹2c[ìYölŒqÆ‹g`»}ë)ýìØ(në]"*Ã’4qH»„ŠLFrÇH–S8Š&ŒJäŒ×*Ïx­€£ñÊáé4âyCÁÙÆøg¼tñÆÄ	€.PìÛAè,Þ‘f€£„·›gƒOg[Àðœ…Óóöæý×ÝÜ^g¢²,â#•)Ó0ç?I£„p[#˜Â«lrŸ*´Çm¡¦bk2Ýý¼
VÃ^¸™9qÕ¶$¤sfÂ‚Æmtg³†·¿‰Ó5Íê²ÓßEEË®Éa>Þc)Trä8œJÃ.Ñîr™‹kP²ôõÓUAE¯§ª”™œ8d›#¸äg_ªSªZQM,ô@ÉŒsÞ.…^;<A|i#ÌŸ•[ÝÊ’‚¬HTðž;·¹!Õ˜¸‚2 žGêbÙ|tAèžci$ ] ¦!âý…=³®ud¶Kt]¢&í£“ukcšÚ…žžl gCâYCxŒÑ•“×¿©€jbcb’9¶)Æƒ­8™Ú‘eO0FV2æBP²%åµþ`'3Nº0½Ô¶³_ÂIÁkg
TïAßˆÁy+oò£ò¬à¶ø*¨‚øþÙ	ƒ4Î:´aæ:Þä+O}‘äá¹9QB˜U ÏB!NÜ9’î0òàgÃl†¯™Ð0qg08oÎôáQVÑ
$Û³Ó‚W¤±µ¤RIèÎ¤çöÒ¤û€ãýåôðñèùðÄÚÜÞíýÒ{þ‹Kì€üÆ~ëZ£8Læ¨a’ñÄ"¬âùDÊ.møïvÄhLäÚR‹‰½°„#TVìþ¨ÅK'ö'I¼&ˆ3GS}EdcëÙ¸c²Á5È,ª!M
îòo‚fð¯Ÿddƒ¬A1‡¶»ü"iEÏ|J1bEe–S€+ AÚ§')ŸüÿúF*SŸ1^ß˜&K›²hrêž$<)58µç‘¿ôáùÇžï/à¼~t#BäN?X?XÏšg—þÌK©Ä	) @Ø4÷£‹tþ0¸ˆ„xÄÈµˆ‘|Ìý)âÙñ\ ³bz4Õn¤»$Ø­é†V´°#«€ždKÕÁº§îÂAm¸^!¶¢á€çmÙì>2âwU_jZUÙÞhlM0gÁÈ$e+%)‹É^€+#-$+;Ú²´…”‚:
Ó€T˜tñƒÂùÛ’tñÛZ]¼pŒ‘n2M|#¼ c4³^#öÒ!]-`…~HµŒ.¢îŒ$]‚s°ª³—… ²ïi<ûºð móÏ’þÔ	>á¬ÅS\cžÝQü¤EÂù‹}:$>æ	‘¸Ÿ)µ0Û¿)å‚îªQø%ø®¹Wa‰“=q‹UÁ;þd²GÆÙa â"‡½[ûÒçhkæ€UL³§ÖÊ1(ÓîHÚÃ|h}JÙd?æN¦.¸¦i;®€4ýÞ û.öò¿'$¬3í¯ÌÇpèT]Á0Qp~'x@:Ðï¸Ç¿t¶1!¢™ì‰Û;pw‹ÝE»„7’æ@Ê’ºx‘~.ÌÒÀEï<Úèomn¶wÝõ¡»zlÔ

r1¢ºl‘ªCûCæô7X;|üClÏ^…e¶z™Fþ&—™0Ïë¬%sÌ7…ŒõÌLí¤ªÍ	ñ)8";à0‰“X¨k=Ç7ˆ@§ÉÁ£Æ_D](£$+ûó¾–èO¹h¢lu²Ãûr†þgA[œìämÈ_êê4Á]ƒ¯w=Üµ9 ÜÕÿ’q—k‡(á¼fòÂéÉ}£.J²û‹s	ü`»çÖÚSôúÅ ¹£Ì‘{²Ö•ÌM·¦"ÿ€±¡Xäœ'1GV4xT¥	î4ùpˆu~ ´8!ma¨4ü†·îo¥ŠYÍò5á­&hkë+F[ýÝ‡w m=ø‚ÑÖ©ƒŠ8¿¿Ú“K/GÍ½c.=À>°Q„x…xªŸÐã³b„¸LŸ?G\·6Feë7À{°B 8ø#¢RY0²lƒ@ì¦ˆlÚ…>gÀ¦	W(ôwú†¾î}eÆDÅ¶ø5!°FŒ×öWÁ6ú€ÁúƒG_0¹Ä&ÌËäæ]rßldÇ	ÃIž=uYRû)"’˜Š‚åÜ^° b÷;&7~H¦¶uîF¶"1Na“™uúplÖ) À%òZ4¡uÀ‚ž^È!z·þ6“!-2tNÜ±Ûó{E^µržhÙ Ì£§¤Ÿ;À%ÚdîÈñ9cTxONž_f‘¡ÉÞi®É.wS›êCî¦º¢Ç|iÉ˜ÌüÚÝáÚòþfUL1N‹P…=lmoô=Øx´ô]@ÆÀ­*‚TÛ†ºö7ø‡ˆo§Ú‚Z0î–˜NUé–¬`:ÕG-lãþ>lH¦VÃ-Û™
c?‘3ü>åÞfÒ¤1WnÍ•®-T˜)+–5ñtÖ‰|ÐP}æ¾çö)Ší0¦mÚ‚u,æmÃ´—dˆŠ!'273–%;A›g}~~lå í¬¿peœÀ	ã¢3&a|áéOaÜq?u¸L*'¨\úÐÏý*áÄ]B÷ßYÏÐ­g´yuËsÏ“P¸$ÁIš%çH?3¾ŸyÍmÄpÐ@*˜8wþõ®ÃoIŒU>#¤™1©k¸#ÔI,’¿1_ïD‡¸ßŒµ&8'mUÁÖ£`93¶ 4[€r´r.`ÇÍpcýÄå–òŠ%Øï%†¢ª¥üÏ]“W¹ §Œ¾¶môû;ƒÁg!°|€ÿ¤VÚž‰MWúlyánúzdÇäløƒõÂ] ËK•çèƒÐfûP…s”£¤Z†U¨ÒXœÌÈ%É_:s
ÀÔN,´CÀ8„}@Ès?a½ƒI³@StÛ] ¨ÌÐŸ×$kùž3K°†'ÏÐjð‘žâáŒ$G+@È<Øƒ#áÈ‰œ9†+bÙ·s Ç×2ñcxÝ9úO(~Ž­€äÝ	…h~µëÈŠîFÀ­-“7š\aæ ²±¨Fä(p"÷Â[/:ª/|X,ëØvB + ´±V›mHLÁ¿Dyø/´øÝú]­O|!"ù[Fm¯´ »Ò‚j ŽÂI=ò_IˆÁ¦K`ˆÍöYÛå®ÍeË ÷bc’¬f Sè²øŸs»’¹«$øÅÛ•J#*lí[˜çÍP3ãöžx¿#Þƒæê‹\Xƒº¶Uyøj&˜¨ãÎœÂS–É˜A Ÿèê2.’»\>©B2½‚O¹6	,wqÏ%ñ{˜f·È9'n§xQÎÖÆ6bÁú;]ñôþ½9¯¾Ò‚K90^Õ&3PâÁêËÚôÕØùº6ÆaçS”˜Qxø~ƒÂ*Â?Ül¤aí¤¼UâËÑ.¥yM)dŒé²½ì ßü®š\¶Et«8â­ÍòÚOåYJ«’9_’ð"Õ¯>}=<}6²þñŸÿeÚËÀ¶»6?ôAéÕ<•Qÿê/EDKÑ4ÌßùgßÇìYÇþÒÖ¢[“pfÈªþŸXšu×,PÁRk*I1ì4Iè”fŽÊÊ7Á˜ÞâÙ±½ôµÇn8öœ3;>cÀºqöÑÛN|™3LG­Ãù—j›õym39OFÞ“µf:$–¿b'Ÿ$H©Z^£úYÃ|-(—aG»ú¤-if°æår÷ü‹ÇÑ$"e³°ÀOˆ”+õŒ¶ÄÅ(6J‚ÀFëtæXÇÎGÇó',? FTgp&/ÖàTJŒ´àù±'sÔ™ 3Î¸LOñáÏ–®ÙŒVÔtm‹ÌP]J¹à>Ù£T·*IÏ˜Ý ¼=DxÛ®SVÔTSt1QkŠ¦næ9¾ WDTŽPË‘ð¦R})
œEm·›]-­Y;üÇÿñ¿Õ)ô ÞlÊ(¯svb4Nh=÷—'"AÒÐRšéöŸ_º±=‹0çÑ£T­YÐúôÜ	ôt*Àçÿû¿þÇÿ}ðóÚ™;KÀ\ 0/í¦ ´ùp°Õômï>ìŸß|xæÿü_ÿßÿç¿ß#¨ŒHÝòƒõU	‘½h.ºÙ}´óçéÂv=L£} Sö“FÛ’ãÆó„}»tÏ~ûÁÕÖõÒ¹ÄthN{½;ubÌ?ýßà2×o,6Sk„SíZC 2DÀýENøÑ™˜rzÕÍ*›»U3³l&ç§UÐ¹e5ëU3»l³º¿æ\´†ì³ßRÉÖ¨9•lé@oŸJ6K¹Ú!"P³Å©:}lÿwO[˜Á¶qZ“¦¤™,p³/•!¯hSGªºFÔ,€· K%%©[•
JÞ”¤ØœnLƒ8ó{Ss-‰TÄ%icÊ„X“x-Gºeêµm£ïge¶þý7€öå;(ã’LQÏÍL›Ï1°#SÉÉÅÔ\îÑ	Uä>ä…ƒ:¾ ƒôbÌº©Aä <£ýÁç^æd´²" 3™¥a|júK–)MïiZ¥jLM¯%j—FÄ#wTùÀyþx®2©(§Ø@½þÚ!¼fK+O–tè.ÑW¥”­cÕu°³µò8¤ã,²ünÉÅL,ô…?N¢=LÛ.}IÃ•ý$&ÑÜ-Sy½ÀƒÝ™ÁÚ9áÁÚ,¦?Û³'ÍÊ±ùÖ¨{2é–·òÑ†\'pö8°_u}Ìü'_^2Â_¡_Œ“–¯.ãÔP;x¿}ÝívñË†•µ½g9]Vh¢Kƒ¸Y/±¬P@G{ÿÀùlÅ¸wVUõ¾gÏ¾©ziÁttl½r¦lÓÇ˜EL#ÓL«…¿	Žç~`5×Áìç€Xm­ùf™I(>dññä—rìbúêò´šV_=–ìÜïÄ¯%b®r²ji¸ê4–§pf9›Uu¸†/^œÿ2|öbøøÅ“³£ÃÑèÉ¨»°ƒv{ìE¬öiix}€7ËFŽçŒcÛ,-G‘;]:“#-	«Ðv×”W™ÅK#Àš/n%¯õ,^sçêàš¤A…¡ÆUîð*ÚçGØÊè¼h{|Å¬Ò£›¿2è¸~ÏÊ1kªªP†}_ò•C£×ðúÉj	É:Þ&«ïv3uß"w¿ô›­ÆýîQ¿¬§œ×AjR“(Š¨êwwS³ \u –¸
ª“B)S‰Å…ôMËM«ý\¿—+z-ØÂK‚ ÖÂÅU5p-X‡ú]ãõ3Ö%£¡_À§gÎl£:Ùu**âu¯5²k©:sŸ…?•ù-§ÓôÄí¹KŠÀbÇ=ø*éu[ƒ³Ä«6w‰×—Ïaâ¥å21‡+&rÝ­~_+)zcŒ
ëêS²’0$õÐˆ»ÄëY  9'ŠÑûàä–]ZÈ}Šn¨•O¥¬¾ß€û]Ñúï¶ŸOÐ7[#õçÎì–
°~"Ø}Û3ˆ:Ÿ¢|¥dêš'S`^Ðk‡íc7pB’bãzŒ5˜–¶åah…õ?¡Gû:zîPÓÀX/á ü±´Ãg³GW ²Íu068‡‹ü÷¿[­ÖÝ«ä>îB·€—F­žÐE¯ƒ\MŠfÇ,Êó	ìÛ¬Žìš(îl»QœL\¿;õý©Çê:ÛA ÿ» þ­åÆŠB°iýW½à¿“z!#è„¸õk‡O©ŒýQ—XÃÔœ[ ±ÿšÎs‚9Kq9×W§ˆ{N@­öò`r­(H[-
oªŒÞÉð1ý®J½-¦²é·ò@×j‡]­? Œi{£Øí©ÓìÙ3@ˆíV€Ž9glÈgK^ëö­I¾«&År]ÁzÝA{b±ï )¶gpÎà$U5X’û/9»·ne¦ü¾*n§j·|ÁäœÔžóðá•.U½†Á–ó}12ãÞJx‚*I²ÙÁ´£«åØª{<™JŽa7®v+ÓÉ!¡G­!d "0©Ë`i
}¹>
-×QóÜ²7õæç$á³[ö“žÍ\âþm§Á7üŒÎt"G¦ë¡ÿ¡6ÛÍÚ—^GEO}®àïÏ~Xlš«lý£ŒŒÑz„WÙzæð_nÓ”Þªgc9j·šê¶ˆ™z¯¿œÖ?ÐD»ú÷Õ]Ç8¼ªù$^wQ¯0 ç ‹Ø »Mø‰õÌXÛõnì¿ð/ðA¾…î¢]cÂò¬¾K;Zçæ†úï³‘â°Žýñkç†:ñÇíÉù†ÕÂ»xÌ²æ·L€ŒØWžo£M¥™~I<—ãòÑ6âSÍ4ûy¶®õ6k:ÇüIG¾a;
“iÄ×ÍÍøT-vnÖÌ)ÆØ°~èdÚ]ú—íõú6„ú d_Ú® % Òv¬*€5OBC¿ Èä Ä?FwYÄGûöòê°½
øã±­×E1¹ùò¡œŽbÃ"›h}¿¨ç¬ŽX!®¦8éDOÈ_ì€GºÑä°–’f‡³	qq¯-Í Á:•ÑQ! É_G¿½êF„çÝ‹+¥ŸšÝXc;Ï¬6HîM ·Æ÷œ.¼æ‡íÖÏ )ÎƒÔ‰áæ±„w5þ0öüd‚¨=¬»Õ€Rƒ+QÝS–³Ú¯åêK^äÝÝOe¯ò¢’Ø%çÍÌ°È¼µ™ÉdtóAª8Q*6ÕX^ÔšUúl²ˆÈ»‘æžûË7Ä$Öö"øÑziGÉÜz «ED˜B•yäZ©r¸4”¸©ˆeÿpÄýÐµ½ÖúFó¹ˆ;Ûu—7§ãQØª®¹^:¶~/ÐÑ@Ò6&N‚åƒe^œc”¹còñÌ¸œzOn}ø´òlV¡8œ”ÆJ¨Y¡rY¾’Ã0&[¨*_úÛ“±¯£™ÉÄöð×™·KyPÄß:om¾«ÞJ:|öxŽ18Cu©“¼³öÿ¦Nù°acÌ¸ìpÍñ ~T\Ê“b@ˆ²Œ¦¬»ÒÿæSŠÎ£¼s/}‡5üÅ±±•ªp÷ ÎnIj†Šƒùƒ"ÄaçSMË›P8
5Cßj­àÁLC $/4`¨Ñ …(Ö¢rY¦…L¿=0Äy—{h;Òdé*‘r“›ÚqJÊ|f”2%â*1gÊ›é{vÚ¢\”ÛbA3ýM“Ê®ˆŽGêÁn_Ø ákl#ÊÆ¢¯c®ç —H®¨Ñ”À²œjfþo:bVÜz=Ò-I@§ð±?¹ªqw­,Qšäp¥«3Iˆ”¤&(]œDÖc{2Õô+¸*ÁÉ2»¿2>i¼Þ^vZªZ×‘pæÞ&‡ÎUeN}ËÄ‡è?¥ih/ó“ËZÉB[Ó#ñ°è¦õ½ºn4³Ÿ´N™ûT'úˆòssIÈÉë³ìô1rZ¬³SÕvVÌ!(õ"y	ÖèB“‡Ê„ÔÌ9.½jºÊ­#º—"³áHùÓÉE.Å¯£+,þ`µ;ñâu­ñ×ìz\ÈkƒŒy!ûíçeàa¶'¡9‘8ú`Sž…f¦Jr_ÊQFû®ÉVìWî—Àò ‘_Ë´Ç•Â(‹³š×hcfeQ“9öË}%òÝSûK{†ñ]Ãj7¤8¤÷
XØwÌ²ø¼t¢ÈÖb½k›Ñþ€ÂJ¦h0£ŒS„¨¸—T—ÙÐðZ—aeˆ]tâ`ÑËQ2ÃÍÇY¦n);7ºé’­ÈÃ´Ag$ê‹®B˜xÚ~)vƒw`,=NÚ
ûZl‡ÝèÜ…î°,pá:7èã¦ä—ˆˆR3í%°ª„È×šÄEÚ£{äXäc
ò¼“ìô>f!N{2ÖÚ<ÏÈIèg× ­dÒ˜@ÝðK}­ÄaÐùY%Aà„ctLN0/Ý‰!Ý“ŠB437xE™Šßè™{rÒnyLIç)ÌÎ ÷JÜ³2g*½Êˆ»1X¤Å×?§s)f/µU‡!ƒ»âõÒ€…Ûcîv˜:L­ëU@ÿ/ý¿Bž´°Òl«Ž»'sbEß0î½—ŠÍL{â/ýœL7ýQ*‰z©V)“[>Úß©ðbØ-]¤?KO°E°pšB¥7È{”KÈ¼Á«µt|±{ZàaŠâå•6Ž_ ç§ö"p=qG7#Sh~ÿÉ•óÛÅ…ñA_ø€áW=³Ð/jåá·ý>däTwu¸8<Rx¼&.ã¥ ÆXNÝ£¤»Àê`ì6f<ãæÎí­³J†îÄž³´¬Hï.P•Ç˜*+pgðãÜ‰Ý©¦¼†E2óBO>a~iÏàêkàý F§îbŸ¶fùjÞÏyjžàþ…~€ê{Kr4Ô<[7/ eÂ,hBvÕ#%DÁc—÷b,C‹rFÎ=àÓÈF	{†ÿì¼4Ÿ¦^šyOIëÿËÿ®
»>Pð|Âéðèª!i b«$Íe¦•¼í€+ÃËë,uÇ§™`§åÍË‘yMÍ;òÉÑìVé“•ÁŒçÍêžŸzMt^sAÞGÇ%€gø&àj¸%H¢®%Ä07+bÂð„ÉÂ]³Çhuæfá-Ž1”\dØ‘l[BÎ@"rwÈÂ•~‰ç}8ê:La`ÈOC;R³‰ÈÄé\5-'ZF‡tš#Ð®®5¯¾9Ëù~æ\FÜv?ê!ÆÇv¬±Z•õº+§?ìÜÉHí‚‚®%Î¼Ô
ý+ø[fCy#ß7ÑÚÝá1«•…P&pˆß3;r½ŒÅ™¿‚i6/°X@	’(wÑ»;´û™‘éÜ|*œPD¨“rÄZ†P5wµHV=ä;ŠÍñ0²dï(=ÓeááÑî°¯žA²?šØ~‹WÞ4«ôØ¢:O`Yâ@Y‡‚Ó¯'Ökd=åØÑ¥²š¥ww£tµUºÄ(½ý‰}š¡9ýãì]¹‰ºÒ®‹-¡ÈÔ”,_^µÙXç?PÒ™Ñˆ¼ÿØ÷ç¿”Qnèå	½ÉÖ¡³ÖÏî®ÿ(¶—Ìà…âaä"H=[Â±š'¡;O< mêr‹-,EÑˆyj	Ò"w³¤,€Ávç;Âta¯ü®Õßbu]).…EØ&×³þs¤Âµà>òÆõå¤ûVn…åþ7ã:§³¤ÊVµÏ¶°RÐ¼¢Tyu@$}…g×Ë+Ðs34–|Øíó¼Q-‡¼§,™¬A3Çž-ø©–9S«ŠMèonOUiŽ›ý8<„nuìä–ÛBÑ¿vøÛIéâ™ù}9ÓaÖ¤YýÕÁê¯n­þêöê¯îÔ~U¼±ËÞèÁî¥GÐRLçèa õï¥@.†>ÔëßÎ?8ã¸Ã]'jÿzr6:¾:¾>­³LHo£„žÙ`9Ñ»Ë|"¬R‘šÀåâMÈ¸æÚ°þÅMj“[£ˆlµ¸qŸãŽÖ¬í¤„åtÎAK›”vK:17¥ßák>ç·i€Ø»;igpGílÝQ;ÛwÔÎN“vŠ¯ï¦¯—¸Jâ¬áU<&‡SBäuómoÖg2¨œ,°Z3ýUÕ…}‰ìå­øËÛñ—÷À`
Ÿ¡¬ÞœN†©ÍjŠ<¶¯¢ûc7Ÿ‹ÚÄC^›8Ë’SŸÑa¹ÀYoîÁë1•]ò²òxWN”Ød(Êj&÷– À/¢~ šó¬`=ÅB}1|§ÁªTƒó”ä§kæ¥‘QbÖGèd?5’ŽùcO(¥ûÁµúýÆøž¿Ä *±Ü¬1ŠÃËù(VþÉÖl9=’Ûk_[Ò“˜¬«¢ý×hÐ‡àqúþrrÜ´×=«¬²äar ÛÛ8¸.Ü2¾ŒÚ âûº»æ&Æ3ß÷ð¨lâÛê²¾G…w÷´¯íÞ5”!%t‰ïE›R$NŽfëò›J*õ°•ÚÎ'rÔ…d«H¥*õ¤)uÄ~†bQU¾Û9f3¨3£[º. 4ð¶oÎíYOØbÊ…j/‰Ñ=E›òLºk	\ßº1ú¼{Ì‰Pªr‡ÕÊ·T`´å¼wŒœPIÄ¹ÃxŽ#æ¢hadŠƒ5ç#s@^ÚÖ¿0¯ÃÊþÔeîÊÿ»¥}‚ã]…0e •úN-%UàJS¸ý^›€©¢[nšyën|5nA†Û¿íÛ%ù¤;S—
;÷¬Èo5Ý1æ»ÆwlâDãÚ[†‡n@~,O–>£Ëú9Â×ö•½iý]8â¨ÂŸÏ\¬tÊ"À×þIvï¯v¸´a¿žÐNý°Ö!‹(µ‡Ø'â^ko=M[”ZÞ7[w~TÊDa
>æ¹–eíð%#o3@yeódz=3…ëû=özó^”Ð¨›ôwêY¬·—ÉÄ]
 ¼E/YU÷µÃßàó•cµ‡‘Cøžñ=ëÍø{‹ž²ì†‰ÕNÀóYoÐ³(”}á8·Y¸´žòÚá›åºÂ`3,t ½ÂùX?ÀÌ€õ˜âÌ^ÛXôý1Wtêî÷ƒý/‘ Hb^b·ïäÅ¨V/û=vhã óÅRi»z…)‘]%\^™6Ô Wê3'‡¥sÉAë ')v/\€¿í`cæHÿîàÀ@‰?~¿W†ì¯¼µÓÞ+ß-õšàž±ªeÅ¤Y7uÆ¨•0É§¿ìå›Rr`Uy1ï¯¸;ò‘ßÄÚW%=ÃP®ýLƒbÉËë˜µ/æµ2-‡BG”Ùsµ‡:{òü©“<üV§€¼œá´'@ÃÒS˜›çàÇÇWÏ&íç‚Zë–Y¿œ¾|AÞ@ü‘uæq_[”‰º‘,X·0n¯IŒs÷IÐ™YÌed­h¥£¼g©âu½ìFîdÏt²Â“LÂ{ä/ÈA¦óýu–Zçæ}=$Kí•//=Sº¾uz‚±WôOÜº‰ÇÝcÀSç-b¸*FGÏdãc©Ûšû"ÏàtUUD¡2_M‘V˜HU±ý”'4hÌ¨í¨'üòûØÍÑýæ¯=ëm·ÛUÛß`m¼ûFžôäI—F‡ŸS?1A3¯«*ÝŒ©*÷¿RuŽ‚I·ØQ¡@Î¼â1@Ç—åT<š=ÙÌÿª™êñs$Aƒ‚b#Sû3¦øh`3zÈ•’9ç²AÀ4"—?ñŠúÅ*;Ò®¶áS4,‘Ÿ¤5ÛÐ…Õž[V¦B‰ø†¾¦ë¹³4™\f|š’_*¶°ÀqQqÄböèR£$ŒJ§ËmÜ(Kû4»Éó9áó9Æù˜¹¸¯=d<Š0¹BgÐÁ˜w0®P8Ò¾_/¶°Tu [T·TX
ÞË˜À[ÇÖs)-ˆœ›Ú«ý7JloÃ&€qýÐÝ°žCÓ ]°aëÀ™Öz®\"Íu=B0f©¨G ú˜yaÃémgÍZá.íå:ÖoúN£!‘½ YN­8G=ìá«ýÃÿâdFai>Ö!‡äãkÏ#Æµâ‹‡mÎì4pä`Z¥ñØ^ÆÄR÷L†seÃ=Ï9wgë˜g¥NnòIõ"p™j–)dÚX)2L`Òè=Ãx‚uÔy5Ë<,³®Cß¸™Æ7¦±êŠò”˜.€±	ÿ=¥¶ý´:-‰.ÃgE$«3ÓJ¤iÚ*½¾¤n² äÃ8Ù´CàdMÌŽ›üxbxÜÌ‚Á!xœxó§,± >šv¿aµúº˜O¿·–ä”kF†Šœ\æÉO>˜˜=!×
 ÑÝ¼«ˆ .WÊ“õŒÁO÷´£ƒ[ï(OÖhO¥tj÷½«ƒ;ÞÕÊ=¨¹vƒîÒåÙ(a€í ê'•Ó×Å •¦ï2Þ(‘f†KÛ»Š ‰d›ÿ²J6Ã_WàÈî—8ÂÏÖ­CGì¹êxK_É·,;ø+»ó!¹A©_ßÀbn_Oêûó‘Ïì^ên¬üçY×X¡þ§næú¼zØÈPn]§6þšbFéEáb“=úú—:aòº]¦¯&Í1®{ª8ÆÅÒë{=/óbfÔ'«+FbÑÛÊÞn -vµ$¾õ;Ör:üÊÈÎÜÆ—ð³½vø«=AÃÝcÇÜ{ì’ÀÎÛPv¢²Hñ~¹51?4d&{—~o+Í¨wÔ*o+Åg˜ì´ˆÓP˜UÄ^~²û5,â¼ÃÙ¶îœš”
YdéPŒ%êöOIŒ×ÄP0PïÐzíbÄ*e‹cÁh€A¶kŽ¿±#YuÕÈ:P¨áWÆ¾µ5ûŒn¸`‡§~ŒYrÑ=á‰pm®.„^¯ç¢`Æñ­^³SÙqÃ¶ëa,ÂÈóÑÃÔt ·+a\§„uÿslÔ‰ƒrëï°Sl’ÅzrqáPÚÕ¿:Î6Šô¥î”nÄÅey‚ïÿ{Î"b“Å}nž–s{Ç†ðëÉðU½ÓÙ}n[ÍGËJ\+ÏÝ’”ÕŠþ“º»7BV›•èXÊé1*6FW¤¬ qm"V›+ÂkËcs5æƒuå`\¸J«”®KÓã¥‰Ó¶ZìsŒÙ›}Ð´¡¦B¦æ˜Ñ"6àªOfíó—Õq©Å¡WªjæjŒ\Í!–p’ŸnÎKG&úš(ÅÜúH¹ÚZ¶«~×tÃ7ôAõ›h›k´u!GPïju¼»eÛ»‡uÈü¼H”&_ÒÞ+P,ŒÚDqm–þò‰²«Zwû–¥-7=½æ`YÍÃ†àÙÂƒÿTD.ñÃôï%ÄùK.³»èYržD.güo+±•ûªW>èŸƒ×Ä¾ÃBUÿ‡ÛÖÃÓÞÕ‰ù×—r @;7ÍxZN¿êU›¦^Ï¦ÒÀVáMÓéUê›lNYë—T¿»£¤Qtm95ìŠ=ëzŸ±doo¥ë5+Š¯0íµuéNâÙžõþûë6ANoksý_a¨7ÿòÞº¹1G×Ô-^5×.P=g.…&’’øb–
Î\Fš¹á+eUçWh¶Æcu0|™fo iöê(›r¨Û´s•™úëR
Úiæ3âFè/UÀoz)Vx-ýpa{9³˜|¾ƒOÀ šV·µÃ§è‰AW”ºÕpPcú'Nl»^ÝaÖ£@ûlIÒäÑxæLÏ™ rÀ²yŒø½è­¢»~‡þÉoßÝT†º×Šñ®ŽÄ6ÇIÓ)òWŽ‡Ès'_¼€ßW“E‘ÖE‘2ùc9XÌŠêÔ¥ûCô9?Aä›êè4}E‰R“°þ!°W	¹ª$ðäJ‘‘ˆ§6{6ú­ópw³ßµdÇAJÁ+„ 9ÅØe>h!±’Ø^ØEŸípj#óÏúßt†ýõvE6Ïí"Û€_¢ãFIÂ_€’K$í#ßóì rQ1kRí¹-—bÓ±p¬	T˜YõšUy²²Ô=o‘&Z³È0eiJ YZÛ%üæFü6¥Ä+$_ÖhX«s&",Ìš´Ò|>ÚM(ÚŸÉ£H“€è­c&3¹œ2àoøÇ›îqss¡ø[±éž†`íLOœbÐ0œƒØSÄ1FU`*ùf°ßAFá!á²óvk“ü²R	F¤HÂŸuY{‘ômÊÖuì‘}d_šÙ"ˆWqÊÙ,™ýhàá~Í‰mº‹ô#ø´þÎBÿÐù>ƒólÌõ¹” ©ÓÀ–Q¼"Çno¼è`û%¡Åì¬Nd4ócÆ®ká'…!EÞ.,ã¹ºxý:¤¾<Á¾ïúe	ËZ¹ì<ýH©ª1U
IC•.Œ×A¨O}a
¹]¥¶{ƒ:âðþÓÐž$´ÃGv ÞT/×Bü]ÛT“tÓtaž¡/9ó(Íj½È
ÎÄT“VÔwˆÃ~òäõðÕÓçÃSkøëð5°6ƒÃ0úZjëßl—Ö¿[ÃÑè¦Ò;­¤†•d®üg“ÿ–|ÕÄÆ¥m(GT)Õ˜J¹”–¾RcEÅ“ºñbUOÖN“8I	ßª5±tßÇÐ_KôVŸ†Z%Žô„s^Ö‘NŒ%y[:TiÄ)Ñ¨(,in¿p
´ç²ì(ð8Š“'¯ž>}ójXË÷„ŽÂ>TÕ$BN:âÆƒRò’×bK·+éM:DLs®áêï
ë*1îøJ6#m1˜Bª3›¦\@'‡ÉrŒ¹c¯){{xØ™’»/æ¯ŽÀzé^Ä 1üâb>€a4ëDÀ~¸ÿ±aº'“®9ãQÅc`¢+«Ä1zSª…š‡…(èiÊÔIõK{»µõÑyµÀ%Ã«ô¯y„YAè ñÐÔØX‘Û(gxþ¯òÂ²¸]?c¿§îÂi1Â§I˜X¹Ž"wºt&”³‚^IRkëÊîB
4þ\…z_ÙÝ)++‰¡ ‘õÂâÚÈ—ËnyCT	ÔÑl±°HáØß³^¢øüÅgã tƒ=Uë{Àìtœ0)Nwgíðå“Wo¬7§Ã—Ã:šA/qÂ0ñc;šûHûÊæMs()$_“°ãŠ“0Èþ‹ë\¶[1,sµ
õB·ËKw	Üx×].ð¯¨·ö­þæ`{ÝÄqU7m¨Î#_Ù¶^¿*ƒO …¼œ„…šzB¬Y[¹Y)Æ/­ñýõ8[:Vc4[¾bÉgÁ>Tü'Rq8*Á¯7)q^ŽsÌq£˜7ú}ùÚÕÀN¿ø'·¾LûV9ee’»›…!ooÒ ki)	•¦ç¤jÍXÒzçp€ç(s|ttYŽ‚¨ýß÷(âÈÎ"Ù·Ó¸Úi”Vð«>È7GõOdnÚ÷p(³Csçrk¯hxú²§°Þ|;˜«Ìtõ¾êC™škžKeÖw~&W²Ô6=˜Û{”Á2amýeË4¸³Ü·Ó¹ÊéÌ/ââæÔJOªnîüÀæÒ}×=%àçË:«èºyÆñßê*UYÁ¯ú”j
×•ÐÂÌïüt6”kz4w÷¬“Ð‰°þÝ—u,>ªoGr•#™®ÞW}ŒRº4¢šÊÜïü@¦§åÞ¤Îx$ýih/XåI{iµO0K¢Ù‰#íê÷<¡S–ÚÅÿÆÞ®tD³åûªÏèÏ®çœB?uO§:í{8žÊÉ¹óùp¥o´†(w¶_Ÿ¼üÂ&%q<û&x®z2¥õûªæ(°Ã¹çÔVØææ}çgS:5phîãh>Ú³ž??=ù²Žã|ßâ*‘Vî«>‚…L2¥0ïÝkeñTü€5Òð£]+,¥éÙëoîY¿&áRIÉfhúwÕÅÒ˜¾À•T°lí¾ê#ˆ:—@Imµk6ë»×¶²²¢¶µÊ«–»yÄ6U ZŽí	«©±’Û“Ä˜ø†ío\ðýÌ^QÇÃÓ!ÎòÉ«£áñðÕÓá«þnw‹¸förâ9aŒIÐ¬å1€âÛ%Q=î%§ÊKX¦è6ÞÄ%¼Æ!8ö/—ž¯¦v¹ìl‘ß%þ«nt­è:v°Ødß!u+æ¯ÿR7¦Ž÷Fp/+ÿÚ‰@œwj/=½)×Q¼p=gÍ²Çc'ˆÖº"¹&åÝggˆ÷¢ä0à1öÕ^Û¼VÀgeJ†ûÜ¹¢b:m¥Ê4W
…
Ù{6w®Zë¬@dMö%íç¥EÐxuÑå],Îß§t£q˜Ü9wóÅž Û¢6Xµ;?[žbÇ	&“ž<»KÄ¶%{áOýÄ\g;½n·ÝÙV‹JpJù·[m³6“µzÕØX‡ß’¸t»Eþ Bšã%MYBóU~ùÅÛ‹«þ ygY¸s1ØXCí¯~8'¶Pa$÷©ÀFÑk_ÅpØ0%™½Ž a-§“ÐG"¡ÉëöTxL;w—O(¡†8h9²?¦?W¾päù‘#Åù40_ç E^pZŽï*BÉi!*ƒ¸òº¹hßb ôÃMEú¤‹TÈ30Uø¥*$’(ÏTçü!„ƒaG¼‚—ÿ›b“Bœ
N‘PWQœ™ˆ_¢”œYÒ£èÃÒ¬ÇX²†`q3‘k8Ü¥Ñõò%éBÍv…/hqY cEªIqPµFaOipZ9bdHôÿù_õÌª@á8K[7bÌÂmG–Ç(ä²@¤ôx¡/â*<ç/%tS…ˆ‡Ì_òÐ,*•%kÓÔgeÚ`íY•à…ãÏdF×ÏYÙ ƒÜ~ižÎêr‰Ô;Åwê¬jÕ,ewƒÜ…¯ÀçšžhrÄ2Ög}ð¥½H/åïj¤©‡ò©ˆ4Ï—g!*<_++Qq6UYŠî 4^›9¸`.—BxÐÑtýc:–†? rp]¸eèåØv½«_Oxü[ñÙ$˜ IV¾ÞÅN!T^*Ü»ŸÎ»ýå¶}ö¸ËÞ·“Ïüÿ   ÿÿì]érÛH’þ?OQÖx†d´ê²º‡–ÔKËöØÝv·BRÇl¬ÇaƒdQD$8,©ŒØwØý¹O7O²™u …» ‚vS¶H¨UYy~™¹_sýž©„´õ¥ÖêÊÍö_éö—çé¸À‚ycNYR ¼¾Ö'"pâÏÛãÊbëVúTb?ü{ñeîÿ÷âkmñ©±g©å'#d.Ìúû?6M™†õ„*ÃyiúÔ˜ð«%Ï‰šáÁ«Ÿž}÷âüúê÷ÇÖÝy™ìô|±V<å,Ÿcê/¡ŽÂ]Þ.¡Ÿ¤ìœ›M~E”;É:WŒÆz/Ñˆ%+gH¤Ï£ç–Óçu[’²:rûÑÑ`”}0ïê—äæ3·±Å’ÿS¤×æ8^bH…àBÁ¼D·+Ë«ð	g‰¶ékçïÒóYQË9Ôçì…ÆWQ|ßüDGœš?¼qn ›Éõh¶êú×¿òñLíd©8óñDÏh´Y:>áŸ®ÔªrÔáu†Ì'¹Ü([ßOžx«ô±Èššcÿ”¶ƒf~n¡Íû!ç°ÔÎJòS)Ö·,Æ…9 S’\y¬¦ß¬$wiÝ™"e;LéÞ©°-lÄ›`NÎÈ^¾mD-¥?¶—W “Ø3á”Jž –2„«iá’ù-Ôl xI@˜3ã«Šlfßä%­} 'O”,b‡œ1°4Õ3UiÓŒîÌ8åÔž;ÇÃc9š<ñ51{âZé«ï“Íæaà”Ù|ªn6ZÊêþœ~6ü-
_›ÊÓcbC1²íQ,†lôŠ…§@±Á66ÆµgúIj˜~¯L7ô1ÍZh¶´%ª|?Ì¨Å¸¼ÅÉˆÙm£"Ë¿ŠøZäDœL<^feyžs—…Œm¦ßÓÅØ´-rKIÄŽÌEÑD™þjfnUO)Ìë_Ë“ùÄ‰{àVÃš&fXêVMx_™Ñ'™'7G†‚Ý@…nM¿Ý”S‡ëéåÑ´E£7oCDÏÕÇ¬[Q)yÌ&‰$ç»Þþøü§7¼Zº¾»¡çÚ4Æªß¿á2õgô»Lˆ‰ÎágQíµrØf-Id*Ùµ[˜›Ì\¸Fà¼AçB”AŠìöÚÄe·é¥‚QPi±q&t­<'é×³ðt+þzS¸ov‹6s‚Ÿ¸¨>\²Ø*¹Ö¨‹zkˆÝšOÍõüVeá	Ó]cðCN‰“qÐ]§ÓÙ%cÛ\ÞêºªÊ‚7JÅ½š=‹{7®h§„-`“®–¦‹9ËÚ·°—3¿LœÅØZÒé«`aÃNÎüÎ“³	/·zÃ¢Ì˜:“Q~;S÷cíÊ°œÌ¡£ú/?ûx­d¡¹U0à÷³Ç‰}Mú‚ˆæO{çûpá†°:”ÈiF8•¯˜l’Õ¼YïXº‹ÍêÀò®yCÉŠøÖ/tHFGOÉÂôn¬åì-OIµlUaiXWüdš™Ë~€ù`z°—|8—›õ¬ÙSÂpµçs+É¾qü”°³zHþ|xxØFO¹s¢ÌqpŽý¥šyjà•t)œð=0¡òÓÓÖ[œî’`5	»÷ÄwlkJþ¼··÷³%a®Š!yâÞoÚ ­›­687Ú'úÙC«ˆ»Ó±v`s‹ëþE-øÏrƒÍ÷¤<px Ñ)™¼Îhm·/µ>Nôw°i‡Aœhü^`I4¢ðk»XrO§	º0wkÖ¦¿ÖY©^0Ó)©P\ýFI;£Ê‡1SþD‘ë>½eÑ^–~BmÙiÇ¤{v¾]<ÙÑŸ}XôDÌàŸð¨ƒ]u1ºxqùáêõ½¸z×uÞ×\W¼2\ÄçCV—×a\¹_ØKèœvBo9Ä\‡Óï/¬‰çøÎ,€×·:³™5¡âOG<q§ñÄƒ^¸ìþÓÎ<Üá`pwwgÜŽw3¸¾\¾8ïc7Žö:uwcC.ëdB™ÌMÏ§Œ!˜õ¿©ÝvÄ Å¬UcÆª93•dŸ¯ð¯ÁŽúµüÆ9š50V¾ÓÇÛûŽgÁra!†Äu<ØªV 0^Æ“£ICÖ+—Ùy–i§˜-®Fd½Þßwƒ÷õ¤YûŸƒªÉú Å¬‰i÷MÛºé·I»y fœOC~§L4ÙL"¬;_Í8Á|¬{ÂsR<¶1Ðà%ZÏàc÷]çŸáŒÎf°ò*ý~Vj%`c˜®§	Ûˆƒ…ÏIåº6Á[=ÿéò1ñ¨Pžü¾w±_+…MyµÆ<«ú…Mñ[·£§ .X£1÷èª….7z|*cÛáÀcÔ÷Rß	I–k›ÚüÓÿjpƒZ“NoÜWí·—”ïŒ.§çsËžv±7Íf`‚\D]æ/Ý.€kÔ•î0mØT.–ð†‘qtûÖPY~ZNÃ9BN·ÄðeÜU‹F*ò"ž<h\ì¦IˆTeØy/-eæ‰,<o‹ý®¾¬H›Þò»ºmk~kVÇ=×°FçOç”Ú4ˆ\?ºÜŠÓË[ÞæC:!£&nzØé0èì4È´ŒÜÌ(Ü(6±^ê%ÆÓŸ²æùÄzk;Çë> ¹à3B½ëí€(v25•,çàäŒé£2à ùæ÷ìIeŸ;ÀäsŠ¡ãLG½÷«¡.²–“(§½²çvÎžQ¶f7¥‹Muâð¢Ú”É wÎ¤ÿŽKãH	&<GŠ[ôéY²VáÚ"\N@F™Z ',­òöËFv]äÜ]VðyÕ‘ÔEQê²`L¼HÄÌ’‰.d2æ`NIÈ°W0—öÂ¬‘b4ãØu-ÁÜ8mÌO(§ÒUO‡ì³çÜáçRo/–é¼FªRíDx9®bÒW,î‰§¸L¤ÞÀ+6Þ1ì»ãdhòq&Ï£>ŽC%²f>–«Šò1Ÿõ’9V'YÎÙ»eè*O*i–ò‘j:0Êdt},TÞ’'ÜÓ”˜/T³>˜Égø0›=â¼BË‡ã˜¡œ^“1õ€fÃ2€¯ÀïS¡yŸ_)\¸¾0*ôu:DªØYHÄ%[Ã<í=Ì¾çØ~’TØæƒ°ú¦„ùRùµ°Ùâ=ç™nýô½,)²	Ôšë¹ÿ¿Œp4ÒìhyuìÇI‘÷9Ÿ“=b³ôíH+·¯NBnY²NlèW0ò.ê>ó@:òŠêr¢r¬Y÷“|Ñ¯\Ù6ßJÐ¾ð>áG@s±i1š²v@±èq££-0Ö›¿É—_øM¾üí½É—G¤ûÒ±-§×.ß_I{ž±º0aoÙH£9!Ä”c¡Š%Î§G9ÁÕÞ6›¬B!%S¡bëê.Â©å£¾xzºB¦Î=5£(Î‰(›Åãó_`i æð°™¡îfý¿¥rf§ö„ÒÐNb”ªRÀ\b@Ä'¥ƒý½rÌ.,z+[Î)ìÈ“7È“{	–T2}¾k-‰êL:,â£[ôÞ’Ìë£.o}=­–ÆÊÌ€²Í®¬…[þÊÖÝY:ŒÈ3sí˜~P…ë$K;KY]¬IüâÌzÞ¯¹žSk7é!pK‡ª+Qð·Ô2j·\±Þò×NOy„‚„e;§›ˆ®O`åÇEç•–Ék,Þ¦Îño6%­GÅ¤µ-"Z€ã«¯,d•°å/¿Ö©`qUàˆÅ
Ç³~7jÚÄV›¼±ü€83òµ/¨;…wnæÁc†-LÂ{ìgŠÙ\óóDÑüH}L™´W;°J·“ë°¾ž÷ÎÙÅë7¯_~ oËûâÅô“†¯ÝTôO‹6Vv0GBþšpLÁX`]L‹^ËÎÆò“ddÿZ®†²«P’—Ëü:Ú°Õ‹®fQý¥ÀïöXpJ×ÇšnDÜkù<$šœ¦˜üÕU[ =„ÞR×ý]½VHÝÐ7×çð1É‘±IÒ¯/%Wq\Êb©ò^“ãx\ÏÕK¾©Ú.Õ ²Y±¶S»ÁaZ^ŽåÞô>Ë„õÎ3}S°þ:ÓW…TXÐóPâFšuÔó¯ž	-¶K&	"^<ØSB1¿æ†]¶	•%_uÀ$TØ	sÖ5õ~©Ž|O}Ó6çÈ+×·ea´!wyQ¹)*:Ÿ™‰ãOÔZn<Ø#,´?æ°U1yéöïúûhÿJ6>nÇoZÌDˆ¯ÂœÙÜXótê›š¶™A_NS<Üktx~˜y—™"·“ÎUH¸Mö¹5º“Áü°Q°\dòU²˜…[ZR¼ª‹VàÀ£~ñw‰mÚ!¹µ­[²“ÔSìPZhBÛ´ˆK—¡Ï:YZÆÔÃC>½Ö°(k¼˜†ª‡¬ò­²†z7eê¢Ká/¥>«Â–»KŽêë °:ÉÆÏ
ÿv³|I-ZJ5ÜÍ t•ë¬7Ïg®UNö"QOa‹™´R|˜ßyÓGcè)A0*Ó Ü­ÑG@ìwï{†ï,h—Ú,~œÚ¼{‡ûjFwÌ¬å´kâ–`­vM#êÑnÜ¹^ï[Ã¼pì7Ž·„×(üa0 ¯¨FCXh-™>Å¨d¸:} ±í‡Š±£X"žzÃêá³ ¡¯0¦¹'?T‹([úH<Þ“"F§SÎMñŽL…Ë,¢kÉT°aüÁ:¦bR—·°ÓçU¾”RìY³SrÜcÑ#‹€ì“îßÍåÏ–Í}ðÒ\¢KÓí•tý´Xí§%`Å°ÑY—j%b ¡F)×Ì’&@Dê Ì*„‹Æ$%ö–B -ÔA%¨‚“<õS§=tÑ_‡‘”‘ðhpm`‡câ+³ÿ¯ÿþ_ÂÐÕ z¾€õM?z/W§ ëW#K¹?‚´iÇ¹G½k¼RGÑœ.¹ŠgŒ8"”¹ð¼t<NZcjª©€N—˜óÇ I¿
Ì ôßEõ¿ÿÖàªáf«Inå(JŽ»uŠ±7ýÀé{dæ9‹$ûâôjÚiVFµ€çøõ1$œ™‰Yñ©º÷÷žèX£kÉg³?ðF–Î’Vk¾Ó¥Yü¦îÜãÔléÕèpçŠb¶HòV8h±M`F'òºRãùëïØÚáµÇP›ðD}Û„š`ÉxÛ‹4³ÄôA˜}è8„À%¾…Óìn©íVÜßjÝÛ%Ê`‡ˆB@­å³œ‰éºýÄØÇ´€_RÏËËÊÅ]i’",{Ñ.ÂBU×°ï‡dqÖåÔÃ9…¬¹±³^÷zyáŠJ¥’H^m‘!QeŽ<•Õa}ëUt,iyeƒ˜òÿ,Ì„sÞlQ7Þp54ß¼!ý&ª¼Ô¢ºþ3±ˆ	=f	ºŽ™ˆlùÖP„4¸=þûÊ” B†µœØá”ªç|¯×€‰iƒÅÊúÌ²a]W^wì9·F’«w¿Ó«…µY8!-Õ¤ÀÈ¶¸´]6„†ç%–"ê¤ÚºqÚ&P¢ÖJ¥Ü÷åÈT…c€ð6á|Húdÿ×M¹°|É­vðÛßj[ÙjþíCÛû«¬Üdò¦ßÎ;øuï°šCšµë¢êÝV­o] ÉjÁŽ˜7U&>ˆ«ãËâ†¯{;2èøéTœ‹OZà%'Fò·Z#‰Î¤Ÿl0–[}±½Q ^»\ RÅª–˜!tok25=«rEbÃÃ®ª]ü3SPÇ4ñ«ê:ƒáHþÒ¤ˆeYÓ7³eÇÛí mæ†×›ÖlËÁZ.µ¡¿3ØT«—¯Ë‹ˆSå¹TŠŸç|,¥¾¥!G,™š>íchZ¥‘ß£¶ÉÈ]Zûßl€aætÁ~|¬¿„>êd§O—†„!µŒÌ±ïØ!0&ÖÒ§A?và@“nÂA$ÂÞ9k·×dÍ7x$7„4…‡ëÂF‘¨î+	WÖ•{F¬ŠB±}ç•‰Ö  \ÞÜ„»DPRki]t1ª”.Xðùy„dLÇP¯kÂå¥ä;“Å‰Â·0]æ1öœ;FqëÆN]æ¦Â"y³¾µFïV]JzÕF[VÛï…ÕÂ®²D4Þl#X{
«Ø{Vâ“JÑÁÈ^¨×¾–0<I@Š}jÒ4oÞk‚Ò6Ï“mG*‹»¹"|ÄÎÙÎÉ ˜·Ø›z=ïœq¦/Û£³sØÔúˆÐÅ8vË?¿è}ñž]‡?‡™Ž]ÿ
:6²CäönÔ~÷/óƒ=ì©skúùîbû½*íÌØs—t91—&¹†£ãÆ´ë÷ž¨A@°þZÐy'C?TÆßš‚HGÄ‡¦„o•ï Äb¨½K¨ýzzßŠMÂ\› 
t*ötzÜë½¾»S}˜\ô"Šºr"´pùýQð‡ö{jÿ÷ê7ËÝ‰X…ðN6Q¥Uë{>rÂüf%.Då=e©C|„ßÇ:“NeØ]>‡FÀL‚¾(ëne†I¸»ÄÜ×(eág²nòêxÏ€»B•À©è£
'´Û5'“]rÃV(|$_¡kìúqß½1dãâîÂÝ%{½Ó#&W´ÍvÇÃƒÿšïxtLccsÓf:ão¿˜Ì¼¢ÐÌÚ`rRúä†áJ¿CÖÖ’2LÖ>Jü¸Ë.l6Îx¬Kgùb6£2Ú«6\Ûd™6a “9Üþ ÜÃ¼÷w¡'_æM{R+R©¨ ÏÈýì@–edrÝ¼â?‰9[LæáJÇ¹r1àšë–e=‰qÔDt€ÕjÍÂæ]ª
¦rŸŸ®Ä‡ugTp¬‹ÃŸâöÇÍT°[˜nµðÕ ¤hód² Ë°aÒDm›Ïô—œ]É®0ïÊ?Â'5qM™uu÷tº…‰žpL=êÿ®èƒ&ŒÒž†‰Ì—¶åý©åOÐ‘ø(²Õìç½õHûÑXWUV	Ž~qì·sZ¤Ë	Kíg(4³>[Ý»>ØVûã*‚mZNáIœ²µµµêøi•¦jã
p;çE\×!—’>.oaÚC¾–¯Yä°Ï~U=ø…ÛGÚ»Œñ©È™‹7ò—îÞ.9Üë¡ˆÔ¹¿¿ïôz"[8û0Pæ Œ£4û<õ`+«bu¬4€µn)v‡3žëËußöÉT£Ð>±Yx·Byj_&øŒû†¶ªÂªgp9"ÀêU+Î\ÁOï*dœ÷-SWYâÔÆ]º¡ôYUDÄŸ&L©+÷††¸´YFª²¢ Sà´+¾Ý[k‹tßj#I§ô­6…ÝíSnïÒ¿~ëmWî‘¡\][íÊv6"«¹‰úN«âíôYõˆ
X¶`ôù¸SR.GÀ?‚8ÜËG˜9“ÐâI®œÎi|®f.„e¥>N-m³¿…øEˆSÎ ‚· œòû[å7¢æ3^iù`…Ç, Tlü¯ö×FSg«F*c>°V"ëZýÙ<Ýd^ùŒ¼{†uo)¢[2¯ÏZ²|ecÛ™Ü’x3%T –%ö÷ö_ïåeHGZw×ŸYÛÚXþõÿ#üŸ[]¸	ÛÒºm]?Ðê6h±:4Ÿ”£ÈLæ¥%b¦Åäo>U\áÑ²– ‘`aM§6ÍE7L@µpBK»GÒáØp×®\^JT˜#W3.†»„‡ÊƒHäÞ´E¹Òqö°µ	’%;QFà¼qî¨wnbŽÛ˜|w~v;¨YÉÎ,ó6Í\^“ï.4‘ãtJ›d	wh§ß ü:Û©/³Ë"U\ËÛås¨¯’L,BnmŸqÎf×h½]ÖöÖ•Xˆ²³-–¢fï(6pþ_,F%„¬@rã—STx¼J8' –6?âŒ–LÛ¦!Fœ×âæž9C®•á¡Iùû&'éPJçI^Éèæx@áO..æµ¡xo1ÅÈnäN%=g"×’ÝXßÆÆ±}bËõäœÔ»ÛŽ"»£’'~Û×ž×l67 ´5)q“Ÿ›Øn–t0ê­wÉªà7Æ ZÍsŽ(†bbÇšö_?ï`þÝ©‰y©—!kW!Wü¹ãðýšžrC)ðë&eKb8«:ù.Wó¥T¡s«	o\§¤‘æÒo*æ÷kØIkiâ”<2Ûi}”cÒš/¯¬*¦á7µ¾¶PmËä>û+b<Žc~d?/Ñl¬U5£ŒÆ§ãÛ"ù#›zÁ¹åMÒQE‡LÿûsC÷$±PsçîÎ¶ÃIŠVõ=@%&žå¢æoI3ÚâÚnYÃÔ¢üºa"»dihïZ7x®î3uø˜ŒÑKdq€­ /TÜR0äu¯é9÷"K„DÍ0°f¡Müp2¡¾OÌUE–\µxÀEaÞ–•¯æ·ª˜?³îYêè p} ¿˜þþÂPN¤e’¡ÃéûBh 2äxMhÝl.w•ÿ’J=‰…3ÃÉ€aÌM³±$¸zžÖ\ú;gÀ£„&&‘ÇïÏAËÓ êcê1ìt„d³mhE/«´r×É`aZQ[Ê½ÑGX²ˆÐû§Á€œ{¥4ÇC>”%{Žá›ü'·â<œ2@PagâGÄWŸ=¼žv;x[§÷è©ò¥€?|¸|1:¿þpùã×> l?a}¸„Û»JKÐÉŠGOY0ücx–ƒ×=¹.HÉ½§ÿ  ÿÿ @Í%T