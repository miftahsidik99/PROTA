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
    onEditProfile?: () => void;
}> = ({ selectedClass: initialClass, setSelectedClass, identity, onEditProfile }) => {
    // Single active class determined by user profile / assigned class
    const activeClass = identity?.assignedClass || initialClass || 'Kelas 1';

    useEffect(() => {
        if (setSelectedClass && activeClass && activeClass !== initialClass) {
            setSelectedClass(activeClass);
        }
    }, [activeClass]);

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

    // Reload students when active class changes (e.g. from profile update)
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

    // Rombel name customization state for the single class
    const rombelStorageKey = `prota_rombel_label_${activeClass}`;
    const [rombelLabel, setRombelLabel] = useState<string>(() => {
        try {
            const saved = localStorage.getItem(rombelStorageKey);
            if (saved) return saved;
        } catch(e) {}
        return `${activeClass}A`;
    });

    useEffect(() => {
        try {
            const saved = localStorage.getItem(rombelStorageKey);
            setRombelLabel(saved || `${activeClass}A`);
        } catch(e) {}
    }, [activeClass]);

    const handleRombelLabelChange = (val: string) => {
        setRombelLabel(val);
        localStorage.setItem(rombelStorageKey, val);
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
        for (let i = 0; i < count; i++) {
            newRows.push({
                id: (Date.now() + i + Math.random() * 100).toString(),
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
                let cols = line.split('\t').map(c => c.trim());
                if (cols.length === 1 && line.includes(';')) {
                    cols = line.split(';').map(c => c.trim());
                } else if (cols.length === 1 && line.includes(',')) {
                    cols = line.split(',').map(c => c.trim());
                } else if (cols.length === 1 && line.includes('|')) {
                    cols = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
                }

                const joinedLower = cols.join(' ').toLowerCase();
                if (lineIdx === 0 && (
                    joinedLower.includes('nama') || 
                    joinedLower.includes('nipd') || 
                    joinedLower.includes('nisn') || 
                    joinedLower.includes('tempat lahir') || 
                    joinedLower.includes('nik')
                )) {
                    return;
                }

                if (cols.length === 0) return;

                let startIdx = 0;
                if (/^\d{1,3}$/.test(cols[0]) && cols.length > 1 && !/^\d{1,3}$/.test(cols[1])) {
                    startIdx = 1;
                }

                const name = cols[startIdx] || '';
                if (!name) return;

                const nipd = cols[startIdx + 1] || '';
                
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

        const effectiveRombel = rombelLabel || activeClass;
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
                <title>Daftar Siswa - ${effectiveRombel}</title>
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
                    body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.3; color: #000; }
                    table { border-collapse: collapse; width: 100%; margin-top: 10px; }
                    th, td { border: 1px solid #000; padding: 6px 4px; }
                    th { background-color: #f2f2f2; text-align: center; font-weight: bold; font-size: 9.5pt; }
                    .header-table { border: none; width: 100%; margin-bottom: 12px; }
                    .header-table td { border: none; padding: 2px 0; font-size: 10.5pt; }
                    .sign-table { border: none; width: 100%; margin-top: 30px; }
                    .sign-table td { border: none; text-align: center; font-size: 10.5pt; padding: 0; }
                </style>
            </head>
            <body>
                <div class="Section1">
                    <div style="text-align: center; margin-bottom: 15px;">
                        <h2 style="margin: 0; font-size: 14pt; font-weight: bold; text-transform: uppercase;">DAFTAR PESERTA DIDIK (SISWA)</h2>
                        <h3 style="margin: 3px 0 0 0; font-size: 12pt; font-weight: bold; text-transform: uppercase;">${identity.institutionName || 'SDN SUKATINGGAL'}</h3>
                        <div style="font-size: 10pt; font-style: italic; margin-top: 2px;">Tahun Pelajaran: ${identity.academicYear || '2026-2027'} &bull; Semester: ${identity.semester || 'Ganjil'}</div>
                    </div>

                    <table class="header-table">
                        <tr>
                            <td style="width: 15%;"><strong>Kelas / Rombel</strong></td>
                            <td style="width: 35%;">: ${activeClass} (${effectiveRombel})</td>
                            <td style="width: 15%;"><strong>Wali Kelas</strong></td>
                            <td style="width: 35%;">: ${identity.authorName || 'Acep Miftah Hilah Ash-shidiq, S.Pd.'}</td>
                        </tr>
                        <tr>
                            <td><strong>NPSN</strong></td>
                            <td>: ${identity.npsn || '20206022'}</td>
                            <td><strong>NIP Wali Kelas</strong></td>
                            <td>: ${identity.nip || '-'}</td>
                        </tr>
                    </table>

                    <table>
                        <thead>
                            <tr>
                                <th style="width: 30px;">NO</th>
                                <th>NAMA LENGKAP SISWA</th>
                                <th style="width: 85px;">NIPD / NIS</th>
                                <th style="width: 40px;">JK</th>
                                <th style="width: 85px;">NISN</th>
                                <th style="width: 100px;">TEMPAT LAHIR</th>
                                <th style="width: 80px;">TGL LAHIR</th>
                                <th style="width: 110px;">NIK</th>
                                <th style="width: 70px;">AGAMA</th>
                                <th>ALAMAT</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>

                    <table class="sign-table">
                        <tr>
                            <td style="width: 50%;">
                                Mengetahui,<br>
                                Kepala ${identity.institutionName || 'SDN SUKATINGGAL'}<br><br><br><br><br>
                                <strong><u>${identity.kepalaSekolah || 'Yuni Sri Rahayu, S.Pd.'}</u></strong><br>
                                NIP. ${identity.nipKepalaSekolah || '198706162019032007'}
                            </td>
                            <td style="width: 50%;">
                                Bandung, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br>
                                Guru / Wali ${activeClass}<br><br><br><br><br>
                                <strong><u>${identity.authorName || 'Acep Miftah Hilah Ash-shidiq, S.Pd.'}</u></strong><br>
                                NIP. ${identity.nip || '-'}
                            </td>
                        </tr>
                    </table>
                </div>
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Daftar_Siswa_${activeClass.replace(/\s+/g, '_')}_${effectiveRombel.replace(/\s+/g, '_')}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        notify(`Dokumen Word Daftar Siswa ${activeClass} siap dicetak!`, 'success');
    };

    const filledCount = students.filter(s => s.name && s.name.trim().length > 0).length;

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
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <span>Daftar Siswa</span>
                        <span className="px-3 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300/80 rounded-full text-xs font-black tracking-wide">
                            {activeClass}
                        </span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                        Tabel tunggal pengelolaan data lengkap peserta didik untuk <strong>{activeClass}</strong> sesuai kelas yang diampu pada profil guru.
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

            {/* Profile Synchronized Class Badge Banner */}
            <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white rounded-2xl border border-emerald-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                        {activeClass.replace(/\D/g, '') || '1'}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-emerald-900 uppercase tracking-wide">
                                Kelas yang Diampu: {activeClass}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                                <Check className="w-3 h-3 text-emerald-600" /> Terhubung Profil
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                            Wali / Guru Pengampu: <strong>{identity?.authorName || 'Acep Miftah Hilah Ash-shidiq, S.Pd.'}</strong> &bull; {identity?.institutionName || 'SDN SUKATINGGAL'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                        <span className="text-slate-500 font-medium">Nama Rombel:</span>
                        <input
                            type="text"
                            value={rombelLabel}
                            onChange={e => handleRombelLabelChange(e.target.value)}
                            placeholder={`${activeClass}A`}
                            className="w-24 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-800 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                    {onEditProfile && (
                        <button
                            type="button"
                            onClick={onEditProfile}
                            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                        >
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <span>Ganti di Profil</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Main Student List Table Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                {/* Card Table Header */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 bg-[#0f172a] text-white rounded-lg flex items-center justify-center text-xs font-bold">
                            {activeClass.replace(/\D/g, '') || '1'}
                        </span>
                        <h3 className="font-bold text-slate-800 text-sm">
                            Tabel Data Siswa {activeClass} <span className="text-slate-400 font-normal text-xs">({students.length} baris &bull; {filledCount} terisi)</span>
                        </h3>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50/80 text-emerald-800 border border-emerald-200/80 rounded-full text-[11px] font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Format Standar Dapodik (Nama, NIPD, JK, NISN, Tempat/Tgl Lahir, NIK, Agama, Alamat, Foto)</span>
                    </div>
                </div>

                {/* Dark Table Responsive */}
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-[#0f172a] text-white font-bold text-[11px] uppercase tracking-wider">
                            <tr>
                                <th className="py-3 px-2 text-center w-10">NO</th>
                                <th className="py-3 px-2.5 min-w-[170px]">NAMA PESERTA DIDIK</th>
                                <th className="py-3 px-2 min-w-[110px]">NIPD / NIS</th>
                                <th className="py-3 px-2 text-center min-w-[65px]">JK</th>
                                <th className="py-3 px-2 min-w-[110px]">NISN</th>
                                <th className="py-3 px-2.5 min-w-[130px]">TEMPAT LAHIR</th>
                                <th className="py-3 px-2 min-w-[120px]">TANGGAL LAHIR</th>
                                <th className="py-3 px-2 min-w-[150px]">NIK (16 DIGIT)</th>
                                <th className="py-3 px-2 min-w-[100px]">AGAMA</th>
                                <th className="py-3 px-2.5 min-w-[190px]">ALAMAT LENGKAP</th>
                                <th className="py-3 px-2 text-center min-w-[80px]">FOTO (3X4)</th>
                                <th className="py-3 px-2 text-center min-w-[50px]">AKSI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan={12} className="py-12 text-center text-slate-400 bg-slate-50/50">
                                        <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                                        <p className="font-bold text-slate-600 text-sm">Belum ada data siswa untuk {activeClass}</p>
                                        <p className="text-xs text-slate-400 mt-1 mb-4">Tambahkan baris data secara manual atau tempelkan tabel dari file Excel Dapodik Anda.</p>
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleAddRows(1)}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <Plus className="w-4 h-4" />
                                                <span>Tambah Baris</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowPasteModal(true)}
                                                className="px-4 py-2 bg-white hover:bg-slate-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-300 shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <ClipboardPaste className="w-4 h-4" />
                                                <span>Paste dari Excel</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                students.map((s, idx) => (
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
                                                placeholder="YYYY-MM-DD"
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
                                                <option value="Konghucu">Konghucu</option>
                                            </select>
                                        </td>
                                        <td className="py-2 px-2">
                                            <input
                                                type="text"
                                                value={s.address || ''}
                                                onChange={e => updateStudentField(s.id, 'address', e.target.value)}
                                                placeholder="Alamat Tinggal Siswa"
                                                className="w-full px-2.5 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/80 rounded-lg text-xs text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500"
                                            />
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                            {s.photo ? (
                                                <div className="relative inline-block group">
                                                    <img 
                                                        src={s.photo} 
                                                        alt={s.name} 
                                                        onClick={() => setPreviewPhotoModal({ name: s.name, photo: s.photo! })}
                                                        className="w-8 h-10 object-cover rounded border border-slate-300 shadow-2xs mx-auto cursor-pointer hover:opacity-80 transition-opacity" 
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => updateStudentField(s.id, 'photo', '')}
                                                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                                                        title="Hapus foto"
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleTriggerPhotoUpload(s.id)}
                                                    className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 rounded-lg text-[10px] font-bold border border-dashed border-slate-300 hover:border-emerald-400 transition-all cursor-pointer inline-flex items-center gap-1"
                                                >
                                                    <Upload className="w-3 h-3" />
                                                    <span>3x4</span>
                                                </button>
                                            )}
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteRow(s.id)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                title="Hapus Baris Siswa"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer Actions */}
                <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
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

            {/* MODAL: PASTE DATA SISWA DARI EXCEL / SPREADSHEET */}
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
                                    Paste Data Siswa dari Excel / Spreadsheet ({activeClass})
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
                                Cukup salin (Copy / Ctrl+C) tabel dari Excel atau Dapodik Anda, lalu tempelkan (Paste / Ctrl+V) pada kotak teks di bawah ini. Sistem secara otomatis mendeteksi kolom dan mengisi data ke tabel siswa {activeClass}.
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
    // Scheduled subjects from weekly rostexœì½ézÛ8Ò0ú¿¯íé‰¤‰,ïYÔY>ÅvÇK|,eúÌñä³i‰¶Q¤†K·ÇÏó]Ä¹Âs%§ª  R”^Þ÷Ít,‘X
…B¡6¢|†a',ŽÝQê»£~zñÅ&1{ÉÒØ=t§a³Ùb/_±[*ß…ò¢ØÛ(œž„qâF]'‘\~†ª§ŸÎŠ'ÑRYéÒùêŽ ¬¿Ÿ„‘såv®Üd/q§ÍóY&ÎÙµëNü›³ˆz8ûé6v}èÕmûNß·~ÖÚõ.Y“Zmæò– ×ýG™Å®¨òs¡ÆGbç«ã§nÜä5[Ë0Úu†ãf3öÃ$î2'¸1ðc‚Ô‹"ç¦ãÅô—WkÙ ”*‘õƒ¿ÊÛ×†Ž%=¢ú1AUýè˜É›NiBÔú|Ü´ Ç€l`øÑ‹w¿ýt”Q”|Û¢×Eúéx•³‚u`'|Ûš¥ñ8kg>ðw•%ÊßÞ•´]¬a–ÌKÜ±¡“Ç¬éÂxï~ÈžÓŒGæ»ÁU2f/_¾d«&‚ŠÅa6ûŸÞ|ØÝô;—žOš1“ez€&ssð"7I£ÀÒ4/|×f§Ú¢ü­(|åÔ&ÞWWtÒf±›ôÔ'Ÿ9Ÿé'Nâ¾àäUá*L•Ó‹x‰,DP|KÂ¬?ÿ¹0$³ÅÓÕÏìßÿfKoœ±;l/…{Î’ª>²±Œ|·Oc-ÀXhÊ$+4†aŽÊ*H§aºI_ SŽ‡Ÿ©5ïT++¬ïN]šõÑÙek Ð;'øâùm¶ŽßÝÀ™©“‹
mÞÿ¡MÉû7[/Îˆ`¦Î5T‚âÞÈ/¹yÝ‘-""¼ïFóM^1ŸÁÆz£…5Äó$<¯ÝhÛæÜRJ]!ü˜à×0žu^$k‡aŒq;Íú¿eS|xäL;©ï5ÚüL¶û­Ëž´ÙëÀ^æ‘;õ†ÿ€_€‰(J/i¦w•ÆI-=½GK}w{ß…m=»G['IXléù=Z:
¿Ú€Z[½G[;nlmkmn[Ÿ­“¼>’ u"sž+`Ë¦þ·îEdi®üÊæXF[ë÷l«7‹`­émmÜ.×áæ=[úfS[µšÒç{˜F°>Û^Œ¬6c5¸®O0W~×$“ŸuÞÇY*½Ú}k«|V>Ôxa"é¾j®µ~Fn»ã^:©Ÿ0±þÙ
“Ô¡tÃ·?jÄIh­0’ ´	‹­~ÎýQ˜x—È^°$tâD=8tãjÕ@y`ÙpÅ©ï¿jâ¿­ŸMnfJ;øKk¤§Ã!4Þ€v^pÒ—k'
 íÆ«fö^k:À!ÜàŽ9¯ä†Ùf	´dSÙ$TÊÛ,l±ê`±meƒU‡ÐÄžò-ÿÀˆv//q{µ	 *VMÁKHÐD”ÉÀ›ºa*1!"·ÙÆÖêª!ÊÍ‘ª}X²¥¤ ™¡Ø¥”I]($)nÇ1óq€Áœ$qƒ‘]5ýaêáÄ*?u„¶ïâÌL¾+ª_úzÅø:?4BOÜaN?¥Š{iŠEÐËµBâ
ÝÏÆ¹9Õ¾¹huø[àÅ|]][ßØÜzòtU<Ã·«ü‡`Ò#/™€,3B¥¹q€oÃÄÅÂ½	,Š†ÊM•~Ö-ý¬«ý¬+ýø—h	oa¢#Ö»¥‘3ž:Á½úÝ°ô»¡ö»¡ö{å]d'ÎttÏþ6-ýmªýmªý}õ‚¯çñ3¾W—[–.·Ô.·ò.ß:é¯NÀŽ¼_é½:{béì‰ÚÙ“¼³£4b'Þ¯½õ¢‘CRæâ=>µôøTíñiÞãa:v¦SgÄöP‚Ž`‹¿ïÌÒ$Z€n?²y9oýÍ½ÂŽš…•_½ôI»-t¥2Û^ÎZØÃ¾+¥rlâÞ¨–+nÛÀÖÎ]5Å¸¹3ßºÍ•Óÿí,ÿÚ[þV—Ÿ^±q¦ï›9/·ñêüíÙ”À)0m| Ãbðñ¼	> ®³5¾Îú¹…?ïióîÓ¿{ôo¯ñêÕwâþ6tüvüÿöî·%ëÅFS´ŽYfª’äõáÕ´PUuv+í\¸rl£Q×Î/dÜe}a‡!Q%3Ê°ð6r@.+
…r›°¬Õ5éM¾èûaBF…û1L?˜µ†}DâF—Þ²Ä#¾ú´»±Ê–Ùê³îæ*ðh±Úái×B†ÍòzXë=ïnéõ`n]à&Þk|n› Àˆš=x#h( ­É™,±»hM8”ÚÇ@UNìù6ˆNœ‹´&<{Ç½~ÝÞ-Ø3{Þw¦^\³k©µ À©f'éÌÖó‡Úª;	>î—ö¹¶¥•ÝG¨ >bûîÐ$Æ™‹Pùø6rp.’ºØ?LÚ;'ŽÏš¿ýXèÒ;Ž2kkáÙ¹ºŠ` °|=Í³T+zë#“÷æD›´ìGÝÏeÙ(ú6Œrp·±Ôë»X!p¯|Ë¬ß
+àuš—X5}¬·¦ABf-¦¡ÿ5;¡­Ì¶XmIŸmI.ŸõÊÝ…*·å\+ž¾ìBœ9°FEï•´ ÇŠá\gë§#2ƒœ~nuâpêVxÁ·þ¨»¼«¼tüØ-nvb"Ö
ž.Íê\æ÷µ×\½êÒ÷°FÓÍÀ ãµÜÆ¯“!<^W­™¾#Ëî’ãÒ*T×qF£¦éS6|¹2TˆÍ&bïW—½b«@tÜÁy…Ó¦Y¬¥ÕgE4Ð½BúÜ·MRWWêî7ÐC€bzƒcX¢Ð%;>ù8è±æ˜	‹gTäÚõÏ[ÊÂ¥í»—Ì„±ÊÇÍÜN£È¦~:í²üûöÆíf¸„áîÇ!h=bø·\gJù@Ük+ÑeÌ§-sžMh,ìK•+\X]Ž)ÿ%½‹¯Š¾EŽ½)I&/Õ*—À:±AÄ_ððE-m4¨LÚÙ‡ãR¸þbûølpÜ ×p¡,ù=[ÛF,õ%Ý  º»Þ,‘MfKkÌ²$9® Aú¢5b[£–ù+V,]±?è”›Ì@-¿eVi^ýöÑEfùtÎ (Ù}-±»BøFF/*l64i%r4Í£Ó¬d¶a¸¾ÓÃ‹Žã£TNæK¹?Èjôª<RB!`7& —qß™ºô‹×ïñ;:/PïU¤bË?eìÞÿlòe?¸Æ¨" 9;uGÀJW¬A–šWÑl~Ä–ê ¡ VSÀ¥— _w^9Z#çzÎ¼!¢ªÂ4¥lÙ÷Ü¾ñ¿—ÿÿm¤‡nC2› Íƒ:ê…„d„$#¾ÓœÖª,‰S½Jr)uù åÏ¹uËBHê¼@øIU¬"»t«ÖE›¶˜¶²á(– z{Œ».‡ºû*„žoïB€ Ô»ík³|}¡7g0Ñ€±¸Ù‹´pÑ»ða¨Oª^ÇN„q&/DYþö»Y¸
cþÍ[0!‡áøñ1zí}ç‹¡ò¹€öqfz‘v{'G{GïÎ?îìô5¯üÀ¬Dööä;p¹35ß´–ÚZ9R	
å¾w¼x~u§²úv/øWê•¼Ûñ"ìa/àì¨Íc F1¾'¸ŠÓàJëm;÷[’m\`‘“¨ nŒátXR óRýAoÔÛÞUì\ëWqü´mïÒÜ íØcÍs¢7ÿô±Ko‚/±ÝI<ó@àÇ>L…;Ó1êLo’ºÇò.HEn€å'0ÿKT^ñ1Ã,£­%ÒûnâFCgæx Ù‰{é»è¨8ÿ½í÷{»ß=Ü=œ}<ì}<2h 88µÞ¤:/lé˜Å^|í°ä|'f uÄÇÀ[ü_Ò	}fî´ü):r|gÊš  CbÄz1)ŽxG‡ÎMyØzyW8ûÀùÐÁû…¹õ"Àû‰Ë½¥Ž¯On:Ig8†ç
±ráÆN$ÚWnÃ‹ ‚™“½›º‘ŸòáÀ ¦3zn¦~âÉíÜèì«°7Þô‚
+ÝòFl@&Óºy3¥Ÿ+ni¡&Æ#í.Ÿ‚²nOk««í²ý7‡ÐOôÐ0÷ÒELÑn@s: Ò
h]•Và+ôžŽ=}40ˆ‡Æ!ñuÌ:vÈ´'ä32tgNB<è^-1“í¨ŸÈq ë‘3î²Ïw&E„OÆiœÆlæŒÙ p5\m>CäJZq# °$-,máHwQÃmt)F<v³-’G½À#G*NôVh¹Êº¡rþØ?æh¦¸I:4„)Ì*Ž‹k¾îÆËÂ$D«bÌ¾ ªEWi PÈÕÍ¦¼­£o:Ã™r.Í£*­Iþ?j;¸)J·øgUš0­W(xQ„ÖÒ¡‡à,µ A€A;~C;þ%;~!;•A;Ó’Ò‡À5ŒöXl\	ôR£´²«,>J7ÉÈ$¨„ñiqxJ 	—G²Ùì_"hiì'°o\ú7q!•ô“,R¾ÕE*B¢Œv¿‘eöSîhª……âí~Åâ¢aöê%s¿‚R€±TÜÖ@_Ðc¨‹¡Š¢xCß97¤’k/„Hwƒá–ÿþ·aá¸ûÙœeËEq\Ø'f?Ý"¼î–WŸ.¯mž›s)î£òÊ<Y^z^  CÊ2›œŒ·êàÓÝÐª,ÍCÔlö×½àPTCs-JöMl[D¶!dmÐ×Ph£w­|ŒÓešˆXPµQu»‡®› yé‹B¸W•ÖÐ*ÝÄ‚(0®ý^¼T!„'Û7Ã4BàJÆ {†!YÊÑs"z‰]ÃŠÄz(¨6E{%µnpy¢Š–é©(Ì1tÓl}¶Õòbô	"¡–™»_³¦Ù…AsÅ7OPÏ´×)ÁK@ºë	êãf4¹º
d®¯2Œ•YÃÅ®»rc¯À[Kœ¡è(?Ï2ÌÙ‹Æn$¯)µ`{ñ{÷jý˜µ =šƒ/VFÊÂ êž¸N‚3°Š†1P9ØÍæÊìfƒ;ó³}bx°Î8X‹Æ»\øhS,œrT5»”Å;0ÃÈ#É)*kÇÆ2_³Æw‘FìöT”†àOBß7:Ï\ÑPîÚç²†|g™“»"QÆ§³¬dÒO§SÔ²|óëÅ¢1‰\¾ç¼÷æ¼w*Þ‹hHü,ñeb(Õ~ÀîZ	ám–Í\ÖNv@jÎñ(áè`îKfÆ·œÆ°üFŸ_wNÅ’!ÇSã½…¾Te{Hï-ðÇËke´©VíCÕø~U÷ ªw¿ª=¨êTVµ™–ìDzH’m”¨ØýWŠç@@ ¾±ÍˆGL÷’™46,XVJîrÓü4M§–ÂsÉ¥°Ÿ–[*1OUÙaeTÖŒD”òŠ;ø2[k±¿ÚŒ_åóVÄ•ZýTvtKæJ¢Ù
’- ´¬5a-¥öxiÍøSÒ…à¼åh*ç\³w ¸§Øï SP¼@ÃMÍ]þé¶€Ô»óHÊv;l¸PÓÝÁ“c#õ¤ælïwßtFu×¸kY (áã¸3ÆÝ¯^˜Æþ0ø†dƒÊæýêdQNêG·j6J]IË]±.h	Ž¯Ú@»?ð#°ƒ¦ŠA¯Í×]A•ÝH+·Ê¾|í©½C½LW¬ix]m6„’KËK¥2ûpì¹_%ÙgãS—"A-¤ e±s®}®ÌÌf`PølIïüŠ	¤K |ß™Ä¨ô>†@áÉ=²SpËè£34FÇÞD’âç<#ßCà8^ðÅ™p£ÇÃ´ºç]¿ßÁ?¹Z}JzÁç;Ö,P~õ(s.ÃÇ¢ðYöÔ“ª<=Ð|ÎýË=­»s»“fDQ¨¬ÈM¹gˆk<	ŠëØÐ¹.ö‚­aüÃù*âîWK	ºEM«LŒnÂpE5Zêywuµa/žE=é®{Ó¸h»:°—”
×²–í5DôwNØöbDÀe-äTe/‘9òTÂ*€^­Ñj§þužÐ-p˜²ZY ,ß»;å¸+dÉr¿# =žSÄë
Ù°¼ˆÓ2`y’á»º(oßuím|™Q]¶^Ü)Ë£
±GÈr‡¤f‘lfœvYd^!¨¨mØÓÚÅóˆm–j*†Å«T›þCmiªñKïéØ8Žëƒ0#Ã±b
æ§Ê?Ñsi,
¯-ÆÃ6o¢‹ÒðR7,µå¬°å¦0ýšM”JÊô8x(yÉµÓé`Õâ¼grI‘CMêÕ`Zv:¥aBc4$‹À¥ýÒiªèoÅæeË¼¬mîFåÈö.ošfø|‰G?‚zEEÅzj9¹sÂz¾/=Ü1s¿Í|o¢ýM:°pâÎlç«-öüØeó|ÛûAøHÒIQç>ƒ‘—yÁ˜ÜÖG¯
ú½R'Í lâ^xcØRÇ©ŸvÎÛù‘MëQG[BqÊî9]Úz4'Mb¢ø>ðˆƒCá ."¢)Ÿè¶b’Xámô-ÅqÎ~D|Gadƒ²ñÎ¹ør_ÍÄEÇÿ?}ŒŸî4ìØ¾3)í„|÷šÖÁC“±sKpà¨Ž´Ï§9\ÏE—Veæ9ÔJCñ”œZ\Îc7Hü#‡<”·š¸¤aÐ‹¦ÍsŽéÀœ¹QzáÀpeŸÅåúŠžj!…×ç…X7qÔÙý†²ð-r>,M~eAÚü€,UÜÄ¥NN)ô¹a]77ÛÂ.€µ[¿!ó¤öësN¹>ÅÒœ‹zà=¾3–Ä$ þä1çV®;:C^µ,~m“í„×:#zn)Ø¸ß²#eYœÆãðZ–¦Â<bÈ|ªF5)]?^?… ¿¾÷+?f¿c>ÕÛ÷6éÝÛM<[?ìM~Œ<\h}k*ÏõfÅ£x]Rë³0J"ÇK°ü-Žl1¸ƒ˜¿)‡ø6.ÀVî.Å¸ç	U;šmöµ—Ÿrî$ý2Ýèz*Î·àæsbz+½øí¦R3#"^¨Æâ¯ÆpŒ¶»rÃ©ßhrï~ñFÄþUø^£uz{Í«Ó)y=ÖŸ?…o-nºà/××¶äË5,V8á‚¼w½«qRÞC¡µ‡B÷ÿ+vÑOn|Äê¹6#ÿ_ÙM ÒÐè—þNüàZ,n Ú]yA—­u¶†Óâ¿–
q¸Œ-.‡ùüb—–i7º»³¡ÏJ®ýqc» AEË²îÆ“Yb/x†I­‚3$ßå˜Ä°Z…„‘÷µ“£€&¼›áäg¥p1x Áˆ>7ë<›•“&ã?F{xoèÎØ¡w™À^óÞÃ§—ã±7òþÕfýÎñ¨SXŽ7ðÖµ–á15¹öüù“U íõÕõ­õµµÕç›…©SÏ™à›¸3Çw„_‘ÚûGx¬O	ÆÎMZÕû¬Y°ýB«kÏŸ=]}²öd}uíùêÆ:&0[äÚuBÞyIŠs¡±¿sÄúŸö{ƒ½£wïzEàfq Ã„°&`iÐµ^¨¢ªîúª/ 	{PJY°I‘RÆî…ô|Ú¤5žbïî_:Ü/UðôÈü7húªÙÖ…ÆTÖýÎ0ÎÔeQx›gÐÞ'Sßp´Uˆ™Í/m@Þ7KBK™>óúÍ4'à!þ<úÆþŠéå(
xñ_.éCÜø/—Ï.Ë!1kzqá^.$Õ=ûÆ]¹Jó– Í¿ˆQŠ‘•¿\†~uÙ_V7Ÿ>Ûzú3(2A²|M<­Ë.B$qþ÷¸»p†“«ð>‚z£µKÇÝú-âxÐµËÖgßØ“Ù7(âpžÈyiÜe›ðléÕûÝ7/V°ÿW"lÝØ.6·6VŸ/Û¥{¹1|Z¶£GLÏ0­›É#\'‘ˆ~ô¾Ì”ôŸ¿¸xõ¾ûbåâl –*ØYñìg%ûU%cµä^UIO-Ù«*éÜ[æåü…gNÊóMgãâ mùÅŠ÷êÜÀ–\7MY?/’H¶¦Î×O·´8î M«!ëE2ÊªÑüÁÞ
c4IO>ÙOáÝN6F/;¾wûäÐE×ç<Rz¤T~~ºÅ%‹ìÍçJ2ún#x†#0@c_Ý(ñ@”£JÂY¼/`c—ýZž±€Ëµ§ë4„”¡9nî^¬@õ:àÉ2€R	­«ŸnÞTÕÔŸqˆÉ¦‹d\‰b…'U¡|ýÙ&r(´‹0IÂ)ñ) k÷ ¤]‚Bxqðøæ§ÙLžË¤-ýx÷ðÍîAïCï¤wÔ˜7SVX%lOVWÔÀ|/pA,å%Ö:[‚@27Àð¥C^²y£¯>äþ-Z´šæj½B”É“P<}¶±µz™Í‘7Ÿ¦,HíÅÈí yÄ<Äü™I6äÍµ­­ºë£ùÅˆA@Ú\ærË¼Ý£ñ;Œÿ‰1~N0ÖÍÁÄÊÔ|·º`ðÌ§uFmkø·`z%LNˆ–V&'X‰'BX‹®[ÙÙæÓ­­'Ï‚¡dR«ýïÀ«Òûï@@›e²Q	ù³k4{à.AW.ØDøáÅhË]³ æ:—ì³»7<ô§J<Ù]Ñ€5æŠœ>«/èé·©ÄÝðeº.ú¿A¯_e6
ãð2Y½†——ÞÐ¢Æu×0¢üËÆ8IfÝ••ëëëÎõF'Œ®V'+'»ÛËÆæjã•œëØ>u‡Çx@5’ËågK1Šk|5×;·\é°»ç ÷Ôx±Sšxû4rƒÙíô}ŽnØ-'’Kgêù7˜1ÂDIÄË±y—ú>ÆùÞ<±åç’KçÂw¡O¡B3¾3‹¡]ù-£{<Å§ïÿk¸ÊÚËèLÑ^º#ì~á7ÌÕdY”ó\[WÔX…£Ê/Ñ V|VäY9Ätñ,K|hƒ–,+· ŠU°˜ß0¬[£aMO_µ5L¢H^/VŠËä’’…:‘gSò‰—KÒ°Y¦m*EóÙ©â{ãu‹¹¶èfÚUøßMrQ£ªÕe)ŠõC	ÎB6¾› ¹Xä0´ÚÙªæÂøùðéä¨wÀÞ÷NözGl÷Ý^o _„¶À@¹xG_šûo[åãZ¯WzÃ6êµ’QWˆ	kîúó‹yczóé †PÎ°t©Œ}UvcEÚÊ‚„2g /.P1Îl¾wd“i÷IãCƒí]‹=ºÀSƒlÐ{ÿéˆqé¦Öª¡T(ÚôªD’ å)(?_°U”oîÃÅ#ÎP^.­=ûëÒ+û!F'Ëèu|¹pcifcšéö²…Ú Èk;îD!‘~c5ùÝ-îSƒŸxõF«1Ä¢L£÷=Ñ8¢}<ŒéôaÔ•‰šóšøéöÊM°·aÄ³üèI}:'Þ: d„Ì&,\©Ã[=ìÐ¤£ä¸Cs®\C2[¼AÝ­ßc:Þ¥QÊèÐþt–.6dÅ¯VÉï10}€©F×Ž¿ ”œ¯üzAc†Z÷¦`xƒŒ¤’ïT!Û.ëe¬†å¿¸ëî³Ë¢mk‡½VèUO6Ÿn>»P—gR¯âÓÆj¥Z7]}˜ž(0­òÝËÄ
ŠÀ@j@?ãoÞ³Ú õ>°Á§Ÿ`#TŸ¬Ù· ÔÃÞ`÷dï÷Aäf}DR>âßD•þÖÖ!Àã“ÝþîQ5ß¯ôWöVz­ßvÆëëõñ¸ì€„Y˜æíÞq%Ûv²ûö`w¿ÿÛÍ»ŠÔ­j¯’S˜ë·óÁš³Ñ¬Ìa~/»¾£~È½FN94AáÞ…¢°D´»¼\zº$qbY†UñÔÐ&,<K¯òT¾ÿ`Ö¡ü˜"œâáˆ^àuh/¡Á—Ø€ÅðË‡7gW)ñLñuQfì—FÄ‘Ï|ôø.ÿ’ÆB·<ÄLV”Ô1wùÂM®]7˜ç›«P’(ž˜¦O3î§=1å3£=]ÜÏ<B´9žëÏŒŸ¦Ç|SÖƒó÷ÑL,ªÔ¡WCÑ¡|gAìñ½g/a8#/j3ÌnÕw&^Òf{ðuïW/h³|ÃëW~#ÍFŒc¾ƒ»0çY;ëè>³á½Ø–™ jsë¯%–üúNjùA»Ÿ›8ãÔk¿¸˜+Á‹„ˆáK’hpÎjÔv¢üW§›é+”ÕÕØ,-ÓW$°Öiãhï¸ƒr½ŠU}i=õÎ:]½ü°þ€v~§iï;AÆNû>¶ÝšóGjT5Uõæ·£]º©ˆXÂ‡ÐI§ø¢À² öÂ¦öbý ù³bøÜ…^ˆüCoàkó´ñÏôÒ½¼Õ«~¦\ÿü
8g† (öues7Ä]!r8Ð)òéä 3Œ\'qùÍð»‰]Š;=LÑS'jˆ3¥Í†£Æ%;qä^b€|ä«Oed.zb¸kâLº&ÎsNžóöŸñcy•Ï-3i)‰ß‰ŸåÂYx·úPˆ‡Šc)<Î^pì£í±çšŽ6ú!à~¢&°×+Fî4üê+Ö
ƒÏN_…l²p ‹Îb4mc$ge”†ÙT;}Eü¶ÃWw¶d~2¿Š0ÈKC~8ŠßÛËãQTuSº’	Gd¯ˆíÁžöÑ±{Á-Nß'Ø´f[Å`SÙXöcKiTïõ@Ùóã0Ž½
¶_­<µBF£~)†¡âYKàŸ-C‹ ðñK[hcÇ’zE‡¼¤*=º\tÛæ-S–.½~Â¡“Œ;díi6Ô+zÁûÊzŽòîeâ^ÆÚå´Õ©oÀ(£g&;³,¯¥ÌúÌ]KÈ£@@¸Z¾{~Œi,FËß|!’J_Œkky}u•ÅcÖïò·˜Í–·ØtÔ-?‰õÛòõòS¨6ý¶ì¤I(T“›å'†¬p»ò76øØëØÑÇÁÞÛ=P¨÷@{øÛŠ¾!ÞªwcRÒÃ
_âöüÒûæŽw.?áÊüýuyk•Í¾-o²ÙÍòF6Æu VŽ%-êY”þ;^æ²»rfP‰üd2ªeJšFÄµ–7 !$P: ô5ž
qÉzèa†g÷ÐÊ‹Lù¹žìÂÔÒmÿ5kÀLaúYÇ-?_]]y.z—Ï€²ä„ÉGO¡Ø“UŠKEálùÂO£åé¨QÚK×Lž—š—ƒ¹45¨ø&þàaûœÕöù¥}þ vûwçw%R¥ûÙö¢¡tDñur44†ÿ4œoÒšˆ¼`²¼ºÄVJZ¤Ø¨ïÊN,¢ZËÈJ„‹èýnog÷„=b½mž§Ù\Bæ*'ÚÆ–¯#g¦S¹´,SQýfæÞ×ñ‹Ÿ],oY” ³KÉæû¸Ëo½cë«¬k f	þQËÖªÁÏääh*G(B]øOmîŸäüpý[<Ïñ&'‡N4&¥Á»àn•’Uo™Ó÷x]í“³,?cY4räYÄ¯”ÅË­†®'Ä?4aryW$8rôÄcsž*'?•˜G«°nÁdÐ 0t:­÷‰;qf^r#f]çÉ™¸Í°Í&øPdgG/ÞŠôØa²U/ÅAµao¹ÔÕ¬ÙmJÍì½\QB÷™0?ñLO9ˆ˜Ý‹J^•Ù£aÕkðÏ…}õ®è¤µmŸÎº¼Hag®&ƒ0ØFµåå-—Ãó¦›‰DÐÀ*›P›þFg·ýu–É8c¼q ›m([ÚfòTÒP¾€È$ƒ˜/(‘!ÖMb˜Fq-ÏB¤“h©rLëöréM:q8Ñ2iÑä	ØËkÏYSŸb7ŠK·¸l]U2'jˆb.•vÆÞhûH<íz†Â-½¢Lìª`Kjo…‹½D	Ì#°Œ¸ÌœåU›˜¢06i	7þžR‰?!}	ÚâÉ4ðRÈ wØkULÛIˆ©¶‡×:M!âÆøoõ.7Ÿˆ8”o¾êxÝ*òYND²žºD²™‘ˆ*%d„¢Èå|þ9!UE®r}Ç¹¯˜ÊeTd
ó'ïUŸç·áÁï0C|›°Ú¬’(u+¶Š²ImÁÕgŒžü™§ë­ÇsxÜoÊ>Q~n±CScë~Óf50eÔ\úŸÞ|ØÝ°þîüùxÂšoO>²_vw÷þÁN>ö»'­¹êŒÔ-Ökè!åR½Txä4Z¥à'¥RpeÙg|­ZƒAÅàãÌµM`Aß¨1£‡½Ag‘)€Í½_z¬i®[Ýê¹®xgŽ›À<][›}û¬bn³¶L®ÇŒušWXçÒ«zb%¾ Toz\OMeÈ1.}\úÜZ2Ì<‹‡QèûN´Œ©ôËÄèl<b qgêÌšqzQ'7ºûöKÌ-ú;6ËPÌˆVÌÖòñ3qo^â}nÕ²<~^/öd¢c1DÒ¥ ?ª©0gù
ß.ò böœÑ!)Fç.££«Ò[‰1ÐüÈ	­U?ºqð‰¾]‰þ£Ç
Èª1¦Ï„EÛY]ÿ\n}3?ª5nMÝ'3auåiA§*kWž­Îïø®ä0šüÔðÞÜêöæ¸k>û—xkÏO·Ù2âØ$ä5ÄˆsSÒj@š§eý¾"2Ÿ§ðPñJ™?e·EZ¨‘ýx÷p÷\öˆ~<¼go÷ðç¼XÕ¡Ë'X3¯¡UQnÜu7îl–¶6³aÊ ùAxuå»…áUÂ õœ©eÚšÂT`ó¯g"¼‡yd>+AÉX»i^B^Zž‹¤ï¾5WçÝoZ×“³]Ü‹ÜVbÍ¿ªëðPãDD-îV‡…ÂVxhÔprc@f]­fU¬¯š—dÄž¹§±…JüÖ´¹þ?–6×ÿÓfv*éž¤YlIŸ‚;pd_=÷šÍ<˜®ûsý|J¼I$ÌýVOžùzž½¸LCöII¿
©¬)ò˜|öLß¢Ê=c÷Ñf5 K©™Ep1·€W”Û'îÈp	õ$VžKk>6ë–›ƒõÌåáœ?©Ä8/ò]ðÝóaô5ðÍ»¼7¶•”ì$kRðw¥ùè·@9™çTŒÓƒJ„S‰ï‚o‹ÿÄÀ´´'.ˆè}wŒêxÅ®À¹ùs÷×ï‰æ Q’ÖÅ|?¥kâ™¶&žÏ_œ#¾è–¾ªµ"žÖœ(>I<ùðJ5¼ãQ>âøÂ×C|u™2G×b¾^Ü
yî÷s[w@s÷»Š¼Ã0!EÓO»ùÏ'|,Óµ@"Š`¦¨Ë˜bÑ’Õœ–%¦T?Òœ%%=4hB‰MÐÒïi©š*!½‹Z¬lr+"bA‹Õúà­-Óf¥†¦è6ìJQU¬¸Ú)9ŠmRªª¬ZQ˜iÔe˜k2øG)¸²®D.j¨¢Þ1,³Siðä:»n±ú]ÌRÆ¢6ôÙ·ÏK¯4’«‘‹ª¢ÁÕ2£¼ŒP¤ÞDZù¡D•ŠLSÿ`>ò¬"ƒÞ›ƒÝÚ^¢Íïá%*s7
X—A ¦+éYéŽVÆN©yËøwòí8—	4–‹ÊüD^uVqZ§$S•©,™‰¡UÇY}M‰ýðK±^\¼ªHéÀ
¢Wê?FÚ,¨Jv‡
Á¸J»-Ç]ùb)îï?ÖÓ.KÃ¾/\—_FN<¦HjC=QÃÃga©î><Ü¾™3ïÅÂ8‘¼áU„4´—ÅB7`uÂ4‹ÞØ§ ÌÓ‡iZccçJ²/Æ››*ã+\ßpâªT9ò£^Â!Xå¶)ÄÎÙ	Æ›ŒÙÄ9ô]‡R„E®ï` ?'¤é¨æ|ágG¹jhÄyÛLãmüž‘)›eGÁqý›é{`Í't~|äMQž“pŠçˆØÄ™ÖÁtmÞä-%$øCÓivI‰¼ŸÓw¦‹¥›¨OzmÖ,•œ;N@bGé¾Gáuå
©r¡ÈOíxÏ¾š‚6~*ã?·Íþ”]åQ{º]¬NPV¥o¸Ìõ+˜ øÄOMsAæDßµEq.hs ðÒG d÷êôÝ	®”«úÆ†y²!~*æpñ g´O”_DÄOgÕÛÍèuo™–YyD?Ïh&ç‡ÎDT˜j$#/#ä¼²rX]²kF!]û¹O–‰w8A¶|í¤nÉã{je-ªq$ZŒ@[«xÔJ‘)@X¯Ÿ—¨¤AX›"“Ð£Å2	•48õØ N×1ýÎçïœ¨t[ë÷OâSÚèÆÝJžþ^ÿ—ÞwAÒ3Ž$kÞœG‹æÍ©LR#JÔÉÒEy^€ •/ß0ñ%_C‹(±©dûÂ}¢Í<à'ó`êGÃ0öKÚkøùÚù¾Ò¼¶¼ï¥ä:–²^ƒÐêÃãÞs3ÍÊújC‚G›–=–—,WŠÌOW9]h4™=|šôóck¾x¿¹ºjÞ¥Rö©e8T?˜ð„Ù½wšÕN^)¢Ê”ä'.;{XöAÈÑÇR÷e9€£*kÕ%P™¦ä˜¦¦'D•SNéý$¥°RÒ‹…±¢söï¡lð¬¾’fmÚ40•±“Ûÿ=ºÀ'>ýÂ”Åa­gb,T»W-üÜf7Ü«:unZ†ø1‘å—Ï×ùžÕ‚“¼è!W­§Å@i•»¿ðä7|Rè‘º¿G¼O¯ÈG+2xÕöÒ–6ù€úó]Š•=?tÒ­Æ¤çu&\œ•âëM»äåóSî¶Ï	bq—}%_	ëäJ¿›ºç¶Â{&»ÿ™6•òÍEè×j³ä4ˆ±’´xˆrUóÂ‡“2W¾DÅ¥U”o’'‰Ò¤Wd|œ;â‡®Ä…¹å9ë|¾:€LÁŽÔë°~Â`{ìWÐ4Þìºø4CWè6'áu3zÛ¬!ûo´™Û¡]¹I‡à»Ç"W?x#æËÛõ‡5BY¼Æ@ƒnôriú^ŒfîžŸFl~ID¹âC‹<qy½‡/¡Z§Ó™o»«úí@3õHq˜r‹!üŠá0»Â‰®üP}îü±Å¦	m£˜$ô Ìõ·|sÿÞs‹º§z‰¢`<—vâ<jé‰yº!sˆ©§ä´âÄ½…zpóŒÏ÷ÛP´«€©ÊNù©E7¸ò‚/Î„Yä«‡K)÷ÖS¨º=°"?í˜Eybr¢i‚¢æg"Ïb<Éréb†ø6cS´ÔgÉJª]K•ãº?Zî»R“@ÑPú?A‚{Í½ð‚Yš<ˆd1í'_Û U±¦x¥ã Ûh@|oG“Mø0Õ„åÿµÅUªøÝ…	ü¼àÑ£ÿ¡ÇÚ½ˆHîy§=µSRö„ OLQsQ¯xÙç"H8CÛ¼˜ê¥%Œä@§íèÕ±ç{cÆ§›²%°"_¬ðòTRv{'G{GïÎh¿ê“«hŠ4Poc@óå;I§Ó»Wðß÷±õ b™ÖÞMÀjÄÈ#f%ô†tqðýdÒßGÒ]¹ßWüÑ|Æ÷=bÂpa$èý³	FÕG#Ö…™YåwuNÞ§ëÙ7âÄx´¦vrËÒƒv`àç}—ÝÚg±S‘U­ÖØ¦±QÕè“ÞãÒÓx%ç÷¾âúåˆ‹ÿìˆ#noÙ¡:û!¼ï‚µ½r¬yv¬É:Öèi†5úõÝ±Ö+Çšó‡bí·±ÊXŽ»<ÔÃÏ”!1ááþ”‰ó¿’)æ?¢•æÄ¦ý6¦£ªã>¥ÀþGˆÁ(œÑ¥^œ°}%òÂ¸3á} Kö)\¿žg2~ªvM²éÅw°ïâôÉ‘7q”õÇÝreöCò7œàÇðQö†cÏýš»eh=ÁÏ=½•
$ßÛ„‚Ÿ
3Š	ù´N^ziM‘Ç²‹%4ÙþùoeYÁÏÃiý¶·ý~o÷ï»‡»Gƒ³Çte<ÂYRßä1ï£™Dà{fÁï¯èßïcÁÏCŒ#ìƒ$¼…ò8u>´û9	y—VØ‰Ìe¿ãÆ“È›áMâßß=È!7þ£¬®ÔùŸ?¼AÎgš«Ãbü­ð"v£¯xTËî-øïékøŸÁðàUöÝWØŸbu=xe•svì ÂvTFÒyxÈw$×{ê½4«J×<ÿU#íŸ-m„ÑYõÝÓ¥wbò—¥§
k¢ÏŽ»äÇPJŽÒY?Jÿ¬ÞIúª£¹YŠˆ\yö‘5]ž¯®<Ô¾ÈÙóxnâ
jé#Ý7?/}¿ó^u<½ÎuBsFsXë8¹<%ÎG:‘‡Ã'to­‘ïÍÀ!°ÄÈc~êDs)aâ„&ØÊÃ}JO‘—Q¹‘;¥$óÊÎÇ_Ž>övØ/OvØöÇ£·{ï>ð{û?îXÎÜÜÆæuµ®ð[â7øyAì&Ë«üâ>íæ·ÂµnÖ;ŒCí3kò[÷÷¹‘g5~’g-{…\³[Ì	¼)VòvéŒèï¯a8…¿ËÏ·ò«×+émñ*/o›wÈ¿fÆû:Gí·SÐg÷ÈgäÚ©>QÅsað.äUµÚEeéi²Þj¤Cª™Ý Î•%üšÝEò‚-e®Çœ­R¹>Õl	Õ"Fø¿½½ŽjÍÏ1<G—-ÍìT3ÐöaÖÏ¢%ÑJz”ëžŸ_ø4IqWØw£Ä‰»µmrµÜÍuÇ‹¤ÞÀàã•ê‹¢EÒÞ1ï}n6z›uswàGË|§g¼“7µêè—)ðš›Yýn¯æ÷¡ÂH·ùÙiÝq*ªS3ž,‚G¦îT?Œ=/ãy‘ÃZ$xò3/žü, CØœ{(`ö6T±ÍŠ'Oû¯¯uVÙ7¶þ¼ó”§tZ/JVúÏ³Fßþ·Y£oÿ³FŸßq¾Ýd+ìmè{áï·V·`­nlÀ’ýÖj­Ô˜óÍñ¿·ò1òPŒ=¶í&Îä¨ "°€L§Ùð`aü—åvÊp8¿Ë‡ô¶g|~G¶w g5ák<qf­ïÍÿÔôuÜñb´B¡}‰';”wpþ7[´=#Xg^òßgAg#úÏz6>¿ãz>“ÀšÇa¹Éw_Í%ÒÌ[JåÃ G‰7q|'Zöÿ+‰5¸¢TŠ¨qÅuÅ‰¡E’TPÔØ‹‹Wd?–Öù.ÙâöùÚiÕ±EîŸxÄÎ8Õ\ [öB=î£“@ôdx
DÞi(Ä£Sy¡òtÖy²ïú3>çõw0V»ÁH¤M¥¬µ‚&’‚Ízžmï6ÂªHWÝŒYž’S: ”u²HüÖ|’zËÁ ‰–J-Šjîû—8FóûN8\½[¿ïýÜßõ/äàï›¢W½¨{‘”¼µî¼²<V‹ò¶õów?ÿðÏBÙ›ÍØK–ßÿOcw÷ò¯ïU/äÅcLfw+A%Pc¿Ÿ„‘såv®Üd¦Kdƒ>ƒ6¢†ˆ!ð.Y3«×R2l&Ñ‘o“w2s¢˜.˜ùÐÿxÔ¡_Jz`6.Ê?zÄ~ä_;îÔñü–%™§ú:h\¥Qú¿ÜoÎtæ»a8mè­ë«¸B ú+¤¤ä]bC°A¡\<Ceì‹J½·x54 ÿ‚TRÑŒ½ÈÞ––—Ü4g‘û•B=í2r§ÓÁmëK­³.³PR1MÆa„k.«ÀqÂÞ:ù{{}HÅKR”ÌµFŒçY{ÆóB›w&¦òÉ¿cC'ŽM	6Òq£(Œš·@V@‰xÃ8Ã—£ÅÐf®Ò>oÿ½k³ÓÏ-JƒÊ©ÿÔ™Íú	¬©6ÎSOüøÔ
íàÅ‰î‹†^yAƒý›5"÷ÊÃ+éŒ.Œ<Ç§ž˜]úqå žÂ[úåŒ¦Pý•¶¾E†Õù‹õ¥9P0848¸;¢oKZÓà¿eÍXœ ‚˜Áå˜ÿÔˆçuþÜ˜ÁìÌÏ¿Y R×«&þË‘¹²Â–——ÙÂÆÞBKã¡bºzÒÅW9 ^„`>ÐŸiàëïC§ŸudªœMaœs˜&Áqv™uÚÈ&c¡*ýÍa–
µaõ^97/¦¿’…!ÏË&ÏËÞ’´ÀßÈfÉªKáN¥œÝ·½Oƒ³ƒïöŽÎÞôúï·{';ý]pñûï@Ÿ!	vœÎ‡sn™pû¶Uœ‰4ˆSÌÚýÀ™Åã0iŽÂast§f³3(ué]5Ú‚®µùh3,‹õŒdÑˆañ¦ã~ƒ7[:¯àP÷yÉdQüÙÔØ5äð›wô)Ã§‰hÚòŸÚÔéì©HÈj3:»Ó(3žC™mNn|ý¾ 6«µ{÷ƒù^Ø¥@ÉH¯(h6¶Ã$Ä L\rä¨&0,3ØEöå²Á]öM&Ž¦îhê%¾mL]‡â­¹1 ÄÍúaÄçAˆ
àtoðuÁŠzÈuÙ››p5Öý&J†iBjëæ´È’ðyÎŒð—º*ÄË¼BâÌÞÔÓäÄ½ä…àË'¸É–ˆ,ÊÅ~Ù¤&üqòÓÚêˆ;a’Q ¤lŽÆ¬%èòÀD6¢ßK­Ž7»F°¹±ººÚéÂµ2RzÑ—y êtC/³5•“Ò«W/ÙSu¹({mSl
!2ZÕ™aö[€R¥;e?Ÿ¸7}÷_©Ý|bøÂÁmƒˆ¤Zèæ3¶ïÞP´Llðë"ºÛýJ“£G(Eö#ù ¸´ LCžÉ’ã«Hú‘$§ÝÀo¾ÏÀôi$M*ÇÃÓ[$<¯ÝheTm;‰|€q;ŽŸìcë:¥v>¯f?g½)ˆ•tÕ™¥ñ(ðT[áŒo®›|ÓV:{—I³„¹•wòTÕ& EÉÄ<Â³rPæú \æÍXú…™9ýllÝüçµ€’ÝqFœvˆÁ‚VÓ€VÐê|L#8ŒÆHE‘;]f)JÔ™cß£¼†\ ]D@àï”‰”MÎík„ˆeM¢Wü"Ô;ø™ÑûKež+2´ùJÌGFÿÊª¤NŽÐ ì{¿’&–‚ð:‡¡° :Pl*	‰/5½)}¹	©Ý	‡œ»gò
>¥³F ´ëÅÃÈ»pu±GPGÞ´T´hX¬Ë`±ˆ:ò}µ¬s!¦qoÄ_¤È<¯;Ââ+‹ü\¨Ï¥‰*Ù9æåÎ¼Q£(O)€ ß1ÚEYJ)€œQ/a.X3q6½I°^0Â|¾3fS'Nñv2¼àÌ	®&òê1€Ìcævg¾ã$nôxïøÆ	 ¨5éÊ‚,ádw›u†Œ–íÝ¸m–q	Î²eHÝ™º‰ƒ˜Ý¹ŒÂé¶3º,¬ÃÃGÇF®ïâ%¿Ð
ÉÃÑÏJÜ0<ª+­‰¢YÌÂYŠ&ÓˆRØ Ò\	’FÞØÍ@Èsè‡4Ic¬e#Í¥HI«$’4
ƒéƒ&$0 úŠPç//ñ\›†#øÁ¦\‡Ñ1 ¶‚o‹tcCÇšÆxQu„˜Œcä´´uÊu¼`è§#7n6DÀ= ¨þ*œ¯°bñô‹íuÂ£†±¬ôMXs]n=
„œh&Ö‹o‚!Š¨ÐQKß$³Ð¼ìV7Ñ)œ$Ÿ‹Fx'y=7_jÞ8ÃIŠB¨ƒ ²2Í-#f»$"´*ç]‚ÄW¼Äsã7—È·Bw¾5ò.üUÂÀ½foàkóÔ¢Ý´Iãlƒ°ð¹ÍnÉmÞ%Ñ÷†ä^ù‡°½äº‡`¿Z?t†‘Äõ‘\\ð»‰½……rˆñ‰(Ïó£ÃZròâtÆ—ó#?&}Öðüü‚{Æ™ãO·ùøïà¿‘¯#9@N×Äqã/àãwÅ¹l4ƒOru`°n0Ú{þ¨é(ÀÑ¡S„^‰	f%ÄˆæáDÁF×ÍTÕL0”wÎ•ã³)0“IŠœ“³¡¨w";Z\Fe0q'.ÐI‡Ÿ†$æÅûÁáÁ¦Z5…|,NE^¿‰_wNW?Ûiß#ÑÊCi½TÂµNÉX¤ƒOš•Øl>XN“µ­¡XL\X0mf±wK‹U³ÄÅt½q#~ÊyêJ]×Ò…}ÂlVW8Û	qüêÏ¯ ÞŒ”âN'–(*%µs•X¤ZÂ'¥erEACês™uÖ‰–Eh³ßšv^%¬S€fzM´Ìw€‚%úÀCZ¼ÝÜ@Ö×Ÿi}qÏ¨¥ú ˆÂ¨ª*óñòMN¡xbØqŒÓáÞ“q™¶In.CØr2ËMµfá×è%ÂæÑWhžÀv^H£°ñó"„}Ð	^½zÕ¼½Ë›—">÷G`û'ê­ÞÔ«fƒœül­¡Yç…~õwÏ½¦v¶óßº˜’Šn1À=$Gnšq$õÏ0‚~ÅiQúÁ¯Ì=‹1=àgÏ€?]e5ÆNä¹üú z0Ãl¨AìÑÉ$™ñªyÐ€qå©fY¤š]D£—œNyæ+å8c8‚8Oú3WŽÏ} CK_†ÀÞÀÀ`|­ª:ÏÚwšu6¹hQµ*¥ÛáŒœÁ|U¾íõwûÀ¥;ôŒ¶ôÂµM÷œ†#Þ½é°ûàØàq4Hâ™UÿÓ›»Ûƒ¾1,/î{#÷Â‰ð¶mjdO}¢5‘D©6÷1/'§½ŸýÔg\XÙµ™ÖÈ¦]”©2ï“cDÁ9jsêo‰¨²çVÛ9íðÖÒ™ˆ®Q`Ë°#ê¾][CßÊ&&$fµ´6'(Ø‡#Û'}¯^„N2;Pêô²Ÿ–åa2å¬.øbt'|Ñ*"ßó†©ŸNéŽï²fòøµ’Ñ‰¡·Isà&rõ¿ÝDÀ£iJ[´³P;»øm‘qä2N[—]´FÄãP;Ó¬h‚øôv$rO=ThÍÐ‹°gñ²*d¹f'À»#´ÝeÜVyV=ÇØ€d¬Ymù`yˆU§¸àÔ'‹ ÷"õ'ïøþjVI9šßX^Tíå·Lì®]è	óq€ðÀ3<ÊŸ˜þM{Ï­H]¹ï·IOc”rÿ°”4Äõ¯î „'Ã\öÄŠºR&$ØÚ€Ífõz˜=‹Þ2wGÞˆ¦ŸëN—Ñ£­G @ITÜj9«‚ÉáË³äå"ÄqFK`rÜDo¨oÒÚ+×K 0€È>eÍ¿{qŠ„ÙKAô#¯Íö½ ÁJ¼Ik‰zT7¬C#ÂÌþ‰)áÅ¦e<]lZWðž©¬>7]pï×iG?(n¾˜T	­Éâä•ê)¡d18j|L¥œ@åÎ0¢Bh½¡;c‡ˆŽcöÞC³[//Çcoäý«ÍúcÐ¡¤ù,ðfÕÍä²Àf×ž?²º¾¶µ¾º¾µ¾¶¶ú|3k¥‹SÕ¢RX…º¿sÄúŸö{ƒ=º.6‡ps@„¢€m€\ÏjOÜ™ã;}wª›áEÏb^V4ø4ðX?òØ‰3vnRúöë÷ ¥í½¬=ötõÉÚ“õÕµç«ë««O³œ¡3r§Þð°àç‚(y†Í9>ž,Ã?y{±XÜÕmÉR¢™wNð”ø¦äl­•¨€-*ÒfZ–lÏÎüð-0|Ã¨n2/}Æ9¿hõ-¦ú@™µË•n®ÌV·iWÏ!b†q	Ù¬\Ãè›M)—Ö¨ËÔÅm:¸µè;Q#câUêbo3QS	•Ó,@ò5]«²U\ãykX¼,…uœ7að;T°jç€…ëZ+ØZÒÖxu“ÆêË×Û(Áâ~ýŽ,K]Ãð¾µ¿Ê©×–·2ù
ƒ¨ÕP¶¶ó6ä£z€è«XÄ¾ªâÐ\ÛÕ8,®í¼¯BK¶î*qjZõ Œ*Öè[{†žÇÊ,*Š„~'ãýáØUÕW¶MÊ°bcÁÖ³ÜÄ¢=ª´³ðS.¦VwÏ¿ùpœ·),`†ãâ9ZátA¹~0$Ar6ÂžÏ¾Ìr›¯ƒy¯‹Q¬Ën¹ÿ©Zd¯"<£ïB°›Š¥VØ >ÕdniÓ ?C¬YÃø#]±V_U–.„MÑè™Kª¾V%¶Tà¶$’TuÊX#?·{»G;½“³Ý¿ïŠŸ.<`P Wç-/tC3®¬~)!ÃÁh‡?S„Ý¯ðCk¥`nV,9Û„N"aÍ7Ÿj`ªn¢¬é<Ã1¨Ÿ;ÎM¼¦bL}ý™ÖÎ@õäþKƒwôyŸ±ñÒÕA“¸$|Ûlmµò£þa¡<yà:)C×ÇÝIB“/£HôÞõAÁ/æ»A‘:¬çL4/‘Òun;š@ns*€‘·Ñ*qµÏ	îVÈW2`v	<œ*¸lbò‘bíEAØŒp¸ö’ñ~)Â1xÓÉ#€š·xÄi3ŒN€ýx
Šcæ8v:ÙÓ–~’B÷fýØÃ4¨òsKæ¹ŠµKê¹
ë©ŠŠ¨±¼ŠüÊ~I«0†€­šá‰hmI“hÎVÔõW¤œ)ñ¥ÚÇ¥ŒšðaÊêãƒ:ÕDF«ÁñÙ‡ã†€Ny±}|68nP xVKÄÜÈo8£š†‡ÀZZTH–]Ñ
à’1d&r,q-
©2^XZ²ÄE†-EÍ˜‚9‹¢Ç®iŠlfÚÜ3¯I>KZÈÊqu’®dÙ˜â§»™@¥qNÖ¡(ö6
§'!×»ó²JŠy®ÆnpÎÙÌµëN@N‰¨õ³ŸŒãÈç…h¸Â9µCÞJõiþáaÜO7y½Vç2Œvš±&±-|PFR JBPHßg}à¯²¶µc9ôÿÀ_¹@ÊûÐñbJS ÖÖ"8«;—àáD/ÞýFþ#I=ò-­ã‹´’û›dÁùpžŠ-Q`´leàU‡€ËÞÝY[5Kë¥ò€f-„L5ªGRÆ›mÃÆ \áâÄ€xÒŒ‘d,SaÑÔ¤0Uh6WÒŒ#aš*´•ËÍÆeBÊœ¢ÅW)¾(,M&çñÎ…	ÈÆøö)‚_"ùH9“—±4!?›ÎŽ•:™Þ€U5üÃñYÐC`§ªTÈ"¤˜òPpš¸7ÈZ“Á_ZkF<”[X€­ÂVzEzQ†ì‰ïÌ²hpb4CÄGjf‡¬¡l|Ù½ÇËô×_o¬R£ù²/éŸ,’%ïòÊ@S5Èúþ÷¿³	S©¹}.°BAH'ù¶Øeš«´en{Â§‰Ê§(=æ«Š¸Bqåh†±Æm-«Ç¾7t›«m¬n®jñçzŒqeU]=O«Ï³×eâÑ€`öZ<¥-¦«PRãŸß;­}SáËYèòkƒšHæ|^\~"›$Îÿ+…AÓt]`š»"ÆË\þ²E4»¢¢Ò¬š0/Iš£æ˜¬Ûæn7dJx£JœE.Þàõ(Öí§8»³pVÜ¸-1ˆ&`E×‰"(òŠ95t—ôß‹M,eÛ(õµÌÅÇÌ\(×$;t £üÅ[©D–BÃ³ã?ÌMûp‰hk®¯]¥mSmŠÙÖ­UåçcmJ„¢}REy°M»^ãôsAÙXXe½4°oSYùOÍÍÌb‚¨^æŒS;£Q6ãÙ„ˆ€L®b$M¦B²ÆáÇOg½½´ÓðM27žÜ@Ž•ŠÊeJò%S-^^KÀ´ ÌHeÔ%ÃA'¯q[ÎŒDÒ[g32ä/a™?S(mâ§EöSƒ¢ÔXÕ\•µ³à¥¼‰ì‘:oVÓJ…M³”ÀÍp#…ÞC
ÙQîaÀÍTÁq[&èPÊ×Œì6]&ùëï¤{ ÏŒC/‡£”l;©‚!V#¢ùDøÌ ùguŸºÁSë–©P'‚Ÿü*2\±B7øÎ exž°©¡9Ìãçù<·†IáH®Zê”P°WÏ÷çlÀµ&£æèµ}¯dK\pÌ4
û6¨ZŒÏý…H¼¯.™®_ÒÖ¯úZ†»§L[Õ¬šª”Ç4WÉ"º±	õ1i =ƒÃ‰‘†ƒÞ¼o ‘V™nu…6ÈÊJ$ÆÂwÁ\Û.øƒÐ·‚fé^_¥€´¥¾xÿâ;±ƒßNœzµïL=DìÒ‡tê$TÆ¹HÒ¥ÏÆ`±UŒí%c"€Ôl}¶ÀªaŸ,Yš´\J°XÁÌ¼eùxÛìËL†p²»¢Õ”›4¥½Ôp-ƒ Üe‰»ïo<ÍXn8U«2”ÚZù¬â‰yÄ”î#ek‹)]¿f§šrLIÃ§¿á”ã_šrüBSÞø¬Ví.TË µ4>ÿ¬C+¦8³}#°%fl­÷…Ïñ¹=>@Ìb&¬q¬d^x`xEh†Êê\ =ß|6÷	NOðæ2]U_Ô3&sc¾ÄÓ~º	Ù<kBˆÄ LSºù¸Â&¥7ÃO£iåë­V;Ò®´f¶ûï[4U­šb‹Öë¶ì•RÊÑ	µÕs Ÿ°Ç/ÙÑ	Õé|™c]3G¨)Ê…UË›²äFbVºæ†r¨T@d¨9Á½äÀZÍÚ-s!	®¸Ã™ºµÿÜü¤3[a}­7õ ÓŒ—‰UaB3â¡*÷$Çƒ
cÀp[À9¨çmþ"c7(Bwß—ìü§ÛBDÇÝòêÓåµÍs{åÝ`T^SAõ'ËëOê´óq„Ø>~„ü µ	Xëg¦UQ+UU9XXQ«IG_%ÝX·Œ×yIaxDâÏ÷Ã¹;FH©%³Q·â,<iÝÙ€³¡›NQôã²g<“O.ý4õDQ&Aði1©—×Ásb¾‡R¿]p”Rc7dHÍ¹“ —<rÍeË6Å»þ2#À‰]Ô%Rß°ñá/%ŒˆñuÀy\ÙÈãÂ°¸ÙlvBPæ-"ÇwÖ—øÐš‚4®Ø¡y™CSîhÓ­µG!s%ºEÄÉ%æôÅ4cš¬¢iSˆŠ{é¤~Â.ßÇ@•%ËËw;Ræ"ðçª’4%Ur‡¤»lƒÝ™ƒ@Ö[Ñ\õzÀ¾&²zek#‡¸j}ÈfJ„ƒ¹keNý{­I#êœÜcùäPÐ2æ­z)IÊ—~j,©?%K?¶‰J½)s¹eÏíËNm1[‚™’–p¯€ª–q³ÃN¶uÛT2@^þ#ßLSØkK \Hú«ìå]åP–š(n÷zê^’˜º RöT˜¿['u^]ù®”Hvœ›ùcµDSzñ‰t½œ/idœM‘øSˆ¯.äÌ»s/Ø•3ºŠ‚´œCZ¤gA·Ùœès¡ôfÙõq(:+ñve¶{Ée¡7¥iBõçNFI³é´Ù¡{§÷þÙÇ·g¿ìîîúFî·—M§Å–ío.Jýœeƒ“ðÜYWL.N’ž¦L7Ô”‰¢¯;DˆWª±&2j·¥Ã®XY½Z«D4Ç×Ê3ÞéÚŽ~òS7ßìõ?þú1™š„Éf_"q4ãŒ#dTxnª™·M†"@Ïû0bôª‹ÿ
d›†Æí6€”§7ôðI‹ý•=5"1P_Ó µð4ÊæÍõ¼i5¬A‹‡N2îÐeÍfV‘  ¦•±±öìÉæ*~àíÔofE¡èÓ‚]vH¹Ï¤ýQžž®6“)†KYáÄQþ)Z.ïg+O«ÿ=ía÷²ˆ•ÙÄîc{]ì;XÆîa{ u¬ž}ì²
YýËÅídßÍR6×VV³•XÊh+{ µlA{™)Ãšrï«Ù¢v³E,gZËVa±EÎuÿÞ&´:F´ÅÌhef½óŒ}µ…Æ(œ#ÉèûÒƒmDv¬¶® A·!ï+*ÐªIpÖ‡ž²Uß½vÓà"ÆAƒUòPI-nUy¶Ì!8A:þ€Ö“jÜÄ6^3[H*¼A‘P‡f ]-Åú=6AÞÓiÔ^À
YD î””¥'3˜öÅV£ ‹Ž>ˆ3Åk;<Òë6·ñM¹@³8ˆ‡Y1”^ù£4ðþ•Êß(öÝ$Ëì2a–MM>«ª² B²þ‡B"b1ñ¸jeìût%”M±.“‘v0e®wA§ëëŠx4LJ¬°0›º.žºÄlÎ°bü¶¾¼ïF®Hƒ7,`Ú©–I?1¬¬c7:¼Ìm|JÈçº*fÖÑ†Hm#sm3óÂ†æû™šµ	äIZT¾x\ÃÖðFË{;LgD…é†œ o¹¡˜#7ò†ÂÎ«ýÀ¸MïHìYÒ¼ò`ØeRÿfyÇ2P6ò„möÁ	–?¤«=_·É†òåK¦Z…‰ú@ñyõ’=AýYy•ë_´›xÎôÌôzÅxrcx^®¤f(¿[¥ÃÖñÝyîá9Õõt*çæ³Mj±—$v]ÙÍ¦·a©=[ÈÅâþ)Ìftï`°{Òe{— ŒÈ¬Ä{mßåy'ÆÖ—³>-8ôb’¸ u”EhsáÁF³¢‚jß-•S`âEñŸ‹èÎ¤¢Å×*š.hgÆ·iö5z]Ì<=ã\¯q 0b|Èm™†túÀ‹u™q2S'›Ì2]vžJs‘þÝñ37Žæ[¨ácÙ'?.)k'ÏŽF{¥•]!ŽÂŒJÞ¡”Óâw£Ø[åÉ%¯ êX«<~¦mø5/ÖS6X¼£¢)FÕ™5½eF(ŸÂ’*‚ÿö×ï9°õ‡lý~+>®k		Z˜îVËÏg81®N¹º:Êš-q¯0;™éSj
g¥X§ÑéX«U×Pˆó,ÌÈº€µcà ÖÁ«¼@S¹Ú°í1JÀ92yGgó¸„é^):Üpé\ßKnŠ}·9Ò8¨}r¾ÓÄÜcRôùXÌ“­m»šÜûÙÂ×Ù…ƒ©€0ó9À%ifF ¾«)¤j—ñ¬ØûÕxÊ×>0¥zn¥S”V[¯\•WÌÜ†ª»b«Õ*ÑcK˜u½ñý\hf½º™2,díH/6ï49¼®¡Ùë>íb3ú.l) £M/a£«#Æ^j½«[/•³ÑÐ«ëÚðxNæÒ'!´²o	fÕ|¤>8Ž¥l t™5Yo[X·Mo…S.Û!Ó®üÑqù5	qK?&hŒîg¾t@²å ©ÉFÒ#­ø,f²óü™è`}‡Å ±†Ã’wÉÌòâN½é’c©+ Ó,õdá˜‘LL:’”
#Ï³¸€L×ß}3’À‹J	pcégÎêÑ»¶K¡v.åÀpcš)€w¥©Ë³ŽQÝŽdcLj©ÉYýpª¡?käJ5z±XŒUm[¤ 4I¿¤NpìÂ¼ø˜ÁÞ	
HIfmœA+:äGÌŸØãJÇ‡¤–MåãÇö‹„ñƒôý–¾×i‘¦º¼°Jšrj«ºEiÌÖb¶ÝÙ|¦ÎåßlK„•u©.”ïÊ#ëŒ¼PŒ>$QÓ¤-e[|qàçáDÐ PºíPdzeh˜¥.•ïK¯ø©I³4 ºt‹Ÿy´‹Ÿ…è?‹Ñ0c.ã§L°Òøe%2×î®æ÷Ûç‘”€ÜÝÆdìduG§Â¯.ìŠ#“8¾î’!¼Ì®Xh3ù^8^+¾ûã(œzqY|-ÎJ$ÝÏïI`Y{5q‡_ŒÝAø)¦‹úðæÔ›Ô:Â‹aVP«5Å#ÁŠ7#ó«_¸•çÉÕoïü‘h±d…×d¼åãXêïá¤ì‹7º‰ÛzFx0^ÒÔaÇNœxx]“z_ÞaÓÆþ¾7Ø={·{¸w´wíïþ¯Ñsƒ¯^H¶ì«y(¼ÅÊ9³'ÌÈïÂðÊwß¹Ao”1”b>ìQSG9ˆÌ„íh ÿv>Rª˜œÌgQ8s#žðB’Á·jíþàdïè]~3~pBkÓl[sKKk†)Õz''½èë•.g.F&U¿	,\|œ¹˜
gæx:S­]WÙ,ìQVÕH¨DEM„ÔA‹h.Yßšq\Öù¸Ëù¬F'çÐ²Ã&¼Òfï{'ŸúèÖÁ¤ØÁÃêå!òºì§ÛfÆZ^gw¢ˆŒn¨]â—U.µîÎKz·L†€¿°EÖ.Ÿ ò¢ržê‘†IK;t…LÛÈã™{—Þd©lÄöÊÞsäþ+õ"Lü}º”Í;žÀ,¢gé³¥…bg…Èc³cµKeb§–%†•Õc a?E t©v&ø¶ˆd…%OÂïÊd½ÜŒ–Ït†›qNnop9Áþ0!âu/œ+`îÎØ÷Ø$¼	î²Œ<“#ÚJ@Ú˜@‡5÷³÷‡n4r'£­¬éAzåÄ<äÎÃ²ÍÑ£“Csû¸ë%`Q:McìÂF4ÍÁ±Òð1<›ºš÷Á¾8Áëï´íÙ?Ý*kŽéP¢»6;tf®ïÕ­óLøuÖ*B	K5‡cp¥“Özöl­€ñÒ³n<)Á‹g=~7í–™VÞÒºR‹ß„H½mÃ¶]8QÚÉ{Ø€ÝÂlÁÛ)¶í2œA_Ê“Ä”\xC¨sšx—mêzJaÎˆ¿éÅ%Ï™qFÇ+Ž<3 üæ¸ju¸ðñKïÃÞ€DG(±€šÃÖËA·À1;efžaâotØ‡ÞÑ»Þ;Þ=9ê½'i'ŒCÄ}PU-Ãí¦"5…i2KÑo§°$F(8÷š $ƒÁ–RÚò½èD.Ì/…£*h(œ aŸ„ãÜX¶‘Ïà‹›gîñ:x1Šw9[Ñp¨@ïÀC\/otž.ƒ¤9wòJ°F9cÐÞ\zW¸	È¾½©; aÉ¼}u©•ê“¤×•Ÿ%dí<ßÚŒdRÌÔ£i)|/ð‹:eo~ÏÓ¿ÙÒíÝ’¢+E³ïÈùÎÐm®œŸŸ#Ô+W^›®	W_¬\ñgf´b±j›5Ožícb¼ÒZôòŸ™òŽÏ-+Ž„±¢R@Lˆè—4ë¼økMQh…ßà‰cÄPŽoNõ(Ú°Þ\Fyg¼û™®Õ†ó+OQŒ4p2-l>Ú¬¤’_©)*µ5m«ÍÎóå˜=bƒc±”ÖOœÿî¼Í,=XILæèë©78Ö¯›³6•aÓIf»êE¨rí*99ä¥¨Ó‹6h?»p³–‰r|ý 	tì¼o±òyŒ"#Þ¯«´š©À<ô¦··›1cûó\w<ÚÑÏ±¥è×ùõ	¶Ã*sõß¤/ugÝk“!IÑp\~xÕ<?%×¶¬v"© Ÿït:ç¹úŸ_Æ×4mª¦qàÉv/á(Z¾\Ä£l•cÑËÌ ;šyÊ¹LÕLø£Ò4;ÏjˆUTPlé×ò¡Z"2²ÑžS—€:±†Íãóï>§É°âÞ´GˆÍ›XFì8è®õ:ì£XÙÂKZ™9Ù4”’˜÷’›ŒxÆ˜K$’Ëì¾È8Ä4|¦šì‡*òyn£¢q'ï‹Ž@)ÉòÌ6‡¥]È»¢s~Ñ’9Ke‰2:ö&(}šîîM`•dOµøf£P….øNâÑÕd·’ÉÄSôqú¬!n4t%4ÐZûc
Ä4yñêáéÏÊ
ÊæýÃÞÉ ã-·{ÛŸzƒ½GÙ
NrWðúÚ‘E`~L´1ûˆa½DŽýŽ@­$[&Ÿ²#ç ÔŽžF˜3Nl.Qî~ÿ`[©h©ýÑ‰£!FŒýœ}eL–˜x•i[ÂãËO6ËN.jjW"Ð:¨8œ(»·e³¬wD±ôbcŠ‹TdÊAú96k°eŒ«2GÿÒ›¤‰ ¾½w¸{°w´ËÞííž#È£SäùBÓF	X,;žÂ5_ÎfŒ6ˆI…ô]…”^¹ðÑf¥œA"»ÐâbÚÀ€¦Àlã}åLÜWÎ•RÐ÷a´ž#8¿ä\jµ3Ï÷Æ9+ž¡Úƒ¬Oxq#O1yÂ¹7•æ]€PtlšGá8&õ½€Ç†äÙh²S–\WvG…¢%¦)âoM‘§äŒeÉ5cÍé¨¾2—Ö©8Ï•D]HæÌ‡é”žF<”H¨˜£4LàõSø´é–:Jêá^“}c°rïlÒf8©²äàwPö¼eœìÉZC9‚¡dAC°².ÜªZM‡ø9†¥sÔe=4æÁG œ €xÄ}{lÇ‰qEÍµâgðé]¯ß†®RCš¿œ	iŒN¼œ}cwˆ—göüÔj‡^éi&EmJñ³ÿñh°»ßïj—¹‘£Û\¹whËwÕ–Q“Oa¶[§Ì¨ò!"Þ† öù(šùa·Ö¨KLk
±ÉØ“'Nf²¦4e‰•>s1·aà´Ê‘°Ó{;è ‚ÐÜÛéÂß–Žœpp’~Ï:Þˆ„ŠËN2Zâ6ÁÆ?ƒFë®¼¯½£þàäÓ~Oïd¶7¨`žÇ	™ó)æŒ«¿;Øë#H	InFã`õæï/<`aÀÛˆ¨$í\¸ÀY@$UÚmfÏ2ÜµØØ¹@OšÎ|Œ¤ÓºØè0+Óþ}á8q…ÒC±n¶	×9±²C&rÁ“½%F ¡ì„âÝ%.JÔ–æu0.×#¼é·ËÞÁÄ“ðí‡“œV”åC€]ãZaÍ)àˆ~­ÍÖÛœáã‘¥V‡½GÏAäeÊ9¿09=ÊaÆnõ€pd|à´=MS˜Z¼£©•pFmÑ–ÒœÀTÄÔ"þ†ºÕDLi{F"	"ä8çèãéˆŸ$àìRÐi›5Ðp­¡n³“aìÒsýšrÓHÚps;>ö¢á}ÐKô†·:ì$¿ÿOÜ&'½†áX5)s{3tæ&RÂloÄÉŽüo98bésóµØã…->è¼x´è¹ÇÏomµ—v®3¹ž;yŽC¹˜õAÖÞÑ£O‡ovOÚ†to‡/^1ƒã¥*ÿ)~Ô«>ª0FW$õ3a%ÍÏCžú©Hõƒ«Éêr6‘º3g©ÍÅ±úÁ,M5&rxò”3É¥Ê[šòOM T÷.¢ ý¸_fVOµÑ~e‰ò·p©° “ç:Ïm‡ižÿÜèO¯Í+~W"³.yDºÞž`»Ò$‡Ætã2’øÍðSÃw&z)ñŸ‰·Â‡V@R=§Zi5ÝË¦#\ÑVŒÀÜ‡€ðèXp4®bµu&$f1­©bwúáËb
œw„µšÎ»ú¾;9L÷Sâ»+ÆU÷œâ©SfmÑ«uqú$ÑˆUÕˆ°K¶Ðœ¾º-ÂIýR‚ƒ5 Z@çÜRd8§Hø8¦[>	|ÛE:‹;	¬AÇuåH¥‡…@º:	þd·ÿé`ÀÞô¶÷Ùà#(ƒC`{ðéd·Ô<_~½ˆb§±)îxz,ˆÓÈEòN‡	~s¿ŸF’ÚŒ:¾´Ä‹s ~nÅÏ<·§—5ØÈÿ“ÛŒÂ!Úøµ˜l¨š›¹Ž"¥3ÐG½dfª¶”–2~ƒOYÄµ °fLñ¹€ßN{Öf^«Ä Ê	e&¢—-­žzŸK¶ Ø—ON-{Í]!‡]eÎš£‚	†ÆÜ!1fû0KP*&P¾É‰™cíPàeUíçåS&Ù“%\pÏ&»ôCXCGl…Z3DîŠ±¿²CÃ+‚F†ŒÕ£ìðçaÞãÇÖ¬Aø€y¨@ <fM¬…]ð«¥ÊzvVÎ!{ÅŽ@Ä|kÔÞ6á~uaG€×J!+X¨œÞ,)ò¢`"E”E$r\(¤U 3RKñû<ÕVOmTÆ–ÙÚg;·#¯
ÝN£8Œôü-&·i^ÂJ«8Ÿ;±­Šµ‘É/2Þø°;«¬Ç×[v«°fÍ—$¤ÒSž©hâæÃl«C~œÁmKZ¥”{™´•—Fÿ^Æ2¹xaì’¯Å…Ït5M‡´c4œ£…ª4£™rcÛK­‡×ÊMŠÒãUhƒŒöóï5Ô‡ëWør|Í?Û¢æ%ê±‚Î]š¢`2±Bž-ö·âµÛU'â‘hÝ`dí"ëO?´#ºþ0ïoÎÎÇÖÒ`PýØ–n-ûÌCŸÇÞU`\1¯€-¨9ï¯R5˜ò7úR¬s4	?\/BK»2QøÒ2	\N‹ªf×ùÚ¨"­:í¢ýŒœŠs‚LdóÛq<Øá~éb)¯³Ð©¤ª$
‹^Q}	àØ?×î¥‰{^¾rÁìŽ{’çôˆà,Š\çI½uÅZ‹ zŠèåe6Hü ¤‰E,'V2iRŸk}°Ê­ÊqÙ­õ"r'/¦E'ŠKÛä­ˆH&ÁM§úº°òû\²p'-ÉkÖ‚Œ¤+î«
ïSbsŠÑ†\+ü+FùU„™‘~áÌÃQê‹ 0zF2‘¢55¯%'rä\ïÉ“'h|a·¹*_Ä|Ò¯’ûID‚
¥_é#€Q˜Ñ*Jž6º†òµ…«4-?I[ë­uÏÏÎÎWàl#ïã*’(‚osE(Ó‘KCSAn›¬Ä5d‰ö‰Ì+F8ÂLbü&šº;¯Ø&µË¨åäNJò‰I42í
ÎÒŽO‹‘•§ÁáŸRƒiÉíÕ×äQ¼z¦ôØòÇw£¤¹”…]P\…<+A1d'Í! 
}80	ýpÊÊüÜ2oä!'ÀFi¥²¼5îoÖ£=ËÓ†áôÔœÑ œyC”²ÑQ g:×V€<.—Ýu'Iv$›èNáŸíQä#¿mÃnš"ïcSë›¦HOlPk~ÃÛ‹7ëÜr¶«Ng»’«,Þ£r¸,ï	“²'ñ'ËJ'™>™µ-—¹l_¥7%ÑÔ©éÊe4 AÉæÊ?GW4Ò‘ýƒÒÆ{Í³œî	ÏQqºú¹¥¦*´ßIe’•†	‘„Z2—ï›0DS®1"÷O•9RC§xJËtP)Õ¬:”_Œœ!Æ<Ž°ªÈ›ðM÷&dÇ–ù6ç'Äš;!
Sò“Ì¼æ¥8’®WÓŽ›T§µ?ëªK@}•(¯ú«lk0Y1—‡u®`Ša¹W	E>4º5â]äÒ*HÃ¹ø›O¬ÊtÕòÊ¾/D
Ù“B}ÙÌmó­çïž{ÝlLqÏp}7
·Œ`ä»oR"ƒ‘iÒAÖ‘)bj	:Ë)jå±óŠÜâ!ÒÁn›[hK%÷GŒÌG…Â4Oq­_MCæfµã?ñž¥^)—g@Ô‰ŽÒ@™eŽéòó+±;Ý‡Þsa®Ñ•ïëmÚÿ`1÷ ŸÿHÖÿ‘¬ùç·”¬5Ê¦Ø–A(9ó[ÔfUqBÈ
åB¸“Ç*j€¸mûvY„)÷œicPòW9DÍúlX.EîGÎNx~áµF–ê7òê%{Š’ÿzñ’­­b^vM+û¤Tþ‚¥P#bÝ± VYIÖ×.X°ˆš?#*D§óíùŽw^\/¢Re
ÏŸn³aÜì*®©óö.Â.YÜaOmÚÈ\@Úfè¶}\mµÆÀpç–!ª|c¯/9u§Ppâ1ÜíÑÜgèN½±ƒ<¦o½ý$ˆØ~èÆrÜF?h#7KJNÂgWÁkC^‡ò5è2LÕF÷t‹Ñ!]¶$›Î¢Ïv:yØ¢äÉØÁËª‚¡ëû\€¸ô+L¹1#(?	Z¹[^{Á(¼¦4µÁM«sxè]„ ðR—ü¶¶æœbâÈŽ:¦ËY`ú|Kèàçñér+Mì  Yö}2E¶Úhd£¶__}ŒèÏy¨þQ¢¼†ò•ãÉ°’4´ÔðZ‘cû{‹*oV•<·xçºnã(Ü”¡ù+m~ù|q”8è9†¤8 ˆbë4yÓ©g¯˜8z"Î2¯«ö¡ÁFÅ›¬“Ìì%ù§‡ºY£Ò¢Ñüçèqk¥ }ðO©¡–jäÈŒâå©æïÏëåm¹pUja(Ô.^ä¨L8å7/±T©Õ4ÅV¢C8Ïf¢•^Èvb‘%EéO¨nu3˜J5{ÔÎÌZî¦Ÿ»ûØOÊÇÊÃ|C!ækì(Ç´“ ‚L—N=/ÝCœ,w¸i“·Ðf‰ŸZ—h2Û`Tè1ùWò1LV?éÐÛã‹¼‰Xåvå\¤x¤õ/Ó´H‰Ððqvâì˜z[³õwÃM
>Ò‹Àøy•àv³ã/oÚìÿÙ&©ym<ª3Äô	 œx3ò}iqÉ rç\–V*7ÂÁ³6ª.ûg u4¾v×aû á$Ás°Y±cØù£ÄîGÞ¤K‚“H/Ò#Ð
/7„zœkØœ<P	ƒ‡AøZÚ¡t‡<Bù4ÿñyé¼bc"Ôˆð[^+N‡â¾Šƒw-·ìBKÑÒpá jüÔ¬½‰àj…ôbmÑ6J	os\9l{‚9|%d–+tÜóÝQ;»N»<ûçXµ°8Ú‹XÀÐÞ¡ðOûŒÌ¡‹®^å¨è_Øa¯?Ø=aÇ'ìÿû?ÿ¯<oýñ„ìm÷Žzìx÷ðÍîAïCï¤wÄwvz½CÖ<9>l±w½7Ÿ(¥×›Ý“7½þ^uhw÷¸7øôžr}}zßÅ“¨Xuo§×‡/ìèã!t±¶Á½÷ŸŽèŒ){„Õ>>õ±½þ~ïJuØêÆúÊû•ý“(³ùÃù?ÕÊvL¼0€j»Gï <â¹Ìš½£ÁÞ2íøãàãÑ»V÷’EeüÛß€fVGvÂU ýë!ž0Ç“n4Ð¿ýMžjH£”õwV÷‘—n:u§"®€ÂIŠYâ@ƒqxj9:ªêÅÔãL1MRP	Å¡³B²7lÈIËÄ˜€læLèè]ÀŽ@¡K`•L\vèa·
/öKP­›¡Ì=‰ÅÞCŸ„ã±À‰€Fæ“ùaG€Éq†²ÄÇ“j0ZÊèyÝÖ:€±½ÛÛÁó‰o÷öa¢ÙáÇO€–f^ Lè°Ï§)ž¡~#]zü®1×6Ûî ÆUÇø&¼hbÜ:ì™ü…‰…/=Ÿ¤~ƒ°ôÃ:ðììö{{G}
€d.ÃGÖÃÉ½7Û;äG£„-ÇülÏŸ¦Þ&l5WjMl ò ®™^Z?lpø ÀƒRåûeñW_Iâ`,ó`÷ð}ß½ò`ª DGYÛbÓ Áˆâ)ˆ´{¶ŠOñÂ…ƒY¶6ð4÷v%ÞpxØÆ!ŒPx| TïMÆ^ÄÖ¨~ë‡Móï@ºý]Z’<ö@BÙñœ« ¤’ {{3zv}à'!ª{û˜yr–CA8–M¼¥ö´íü}?å¯eÓûûƒc°}…<Ðð[?l!ÌÀ}Ž÷ƒbÑ³§L>B°ñH²3Æá""ä´´é¤qM)cyÌöÓ`ô¶¬Ïíë³½)ªHØÛt 4½ˆH`&¢Ûþºh³'0ãûÇ;¬Kô˜V,žðÎÜfmöJ@NÄ1œ B‚Ëääÿ§íêšÓF²è{~EW¦Æ.0ÆÆvÖÉ¦JŒÀvñ1»S©<Èƒ E€(“r•÷Ÿìóþ°ý%{Îí–ÐxR©ÚyP«ûvß{î=·¥ÛÞT^.¼yÓtº\‡6õŽf§šŽB`¨Ñg ð}Šf¯5T¨'wÊñ˜÷¬émXµ26fVâÙ•J,ŽƒvŸ	Ç¾`yÑ`ìÊ*Ý‡'Úî(GÐ>D®«GŽ÷«(‚ÿIúÏ¬ì!›W–èPøë[‚¢ùPv3ä€HøÝÕ%2g@øŒžòüÞk••uÆË¿»ÑÔåXç%ŠŒå¢Í‘¿ñ×ø¶Ž‹"Ï5¯,â‹|Î]0—xd]ò.èsìóg|qÅÛ¥ þýž¬½íD„Ù¡Iu8«ç¹KÄÆ“í¼Tæ×–b¬(ô@”ô÷=VÀ-üHvð¬Ïá3Hz)Z¿uÞ“¹â[y3wáë{h#ï¤ó‹È›ð]y_ßç âñ.Œ“EãÇî4œrÂ0þ&rsÀZ& N	F²àˆèIzä,N\Á£¡,Ã9î¨äØ¸QQ&çþö¡ß£ÈŸðô}‡qD»=B8r$ÏËaÐ\³x€ô×Àeè´…»1>éùk€¿rLÌ}\pvÐ|÷¯ømzôªŠŸ	,´w·›Y	Û`çQZ.[ú’Ý{÷¥é8úC·u§Ú£þè«ô¤æ1ýlj¶“Ôé‘rZ#žKi×Ñ­j
tŸ3Õ»¬*¡Qœ¾Î¤ß°JÆÆÍŽ%óðƒ¹„þ¹j¨TÛ„˜p
¬2¡ÞøÚ. ÜN˜XªaœHé9TBdoËá£ô§KvØæ;IA9Þ“5B»dtÆ›’@7‘ÝÛD‡áùçˆ‹±8.ý))‹Kw§-óyÌlYÙ[ðô·±h¸c	+OsºÃQ?qwÍ‡Îˆ(Š¸TY:tƒ•@Õ†qï†½®êú÷UÇo7¿Á”ŽÔ]ËnâÃ¶IXÈ4âZ}œÕ@IžçÞßßNÀ/* Çütð÷­j‡›?rÞa°€@Œ3¸®@fòAÉõ<¾êZÕ.WóÅwÏŸÎÀmžƒ~P$xwîOyžGÇþ‰ëúùKí¶ÞºúÛµ NûK|ªê )§¦°f¹&Å¾VÛ·Xðí§a(U©*þú±:«}Ò2³þ›{ìÿË½oŒZ6þ~­RþYyk”7äü¼^»¸ˆ©<…›MˆA×ÎpÑÛO@Ðp‘×óÑhzÞ
~Ù–òh
ÙXÑÿ.@X2øc©0†]4~Ôö±^ÇDîHdAa'1(”âZÜÙ2:åÝf“•†™R9AÔBï)De¨sö
½0
Â–gôL:Re?«è‡V"wå+K»-|yóeïîü¬ÄSPUº²d"z5ðåp– }ÊY,Ë˜.yÂ©x•]˜Kâ¼iÈDó—à¥I¨ÞñžÈISQÄî8A˜€F¥¦ÿôÍJø[éÐ n)ûîGWú³$[ÇÛHÆÄX.œ.–Mv¾Â)Ø_D¨ùÑÔÍhbº»`lÎÇ9*ïY/œ@)Ï_%™iµÜã»v=ZIð¯^ õØcñ¡—½þ®kÆóÀ¤N+SÍ,ü>Æšê-gÄCD”Ì¢kÖãçgÍ"½hlî åíè$Df_	uWõD±òÑ¡ú²Ï_~ý¿=ùr¾güq0ž¿óQ7qªþ³¼^´¥ïƒib(s™ÕY¢~™*YI#£`wž;N3ÈkŒ ¹FýSRZ©öLQ0ÕÞŸ¤ÖÆÂÊÒ®ñ Ø¨fÁz7µVÛ±_Øÿ°»à`LQù±­æ×ãs¸â:Íôe²O1Ä¸<ŠÅcuÉ_k ,HÃTº2ÄBo˜#Z„ cB­Vp#Â\%-õMx47¶$ÜÒÔèØÊ®ánms«y\Ì!Ç¶˜\ÁÄûžë`0!NYá„\¥!…d‘Êt(óÏ¨™íe'õqD149Êb9.;€zš›RlÞõZ=ûÎî9Y+X¯æÂ\ù¸·'Àâ,‚L>é)?é#q0»¬TÌzsîBLl!©Ô™Tgº#ÌÈcW¼tG´›ºÃšml™½'@&Ør¹MŽˆ–
§å[I’Óœ\‚abÍffie=»’Q1ýŸëþû­Ûn«3p47¥¾‰<º*‡4bp*{NæHó°•1õ© 2‚€5`")4•ð æÄj‘rDÊðþ=ÆÐ¹s µÓ´5ø‹Õv.j­x,¶‘?.«íBlÁeÕäÔ ò¯vúcì†7Jé´>†0òm»«c¸î êâµœ^B ŽÔÀ Cì¡3Èú²8'I>k—)K)¼>U…ýP‚95’„·þ<ðtªŠÊJ“úÛuƒY–<¦P<fœ™üáN&`\SZJÆ'2Œ–Ù¿Íì±ï$H»äÛ
šÊåY»ìd‰~Î†9OÓÃÆ+pž„×1–6íCó™MKç_v#æÕ©A™çÚ”ã¥º¼{²iÒ$œÍ—*ë´ryúkY]Ö*Wü{U«¼¿Àß÷—•Úéé¯tj—™ŒêŽ*)«˜]UÐùG°­®}Óº{è‚F–Rê“\Uìdy0`„lÒ[}27lnÉÝc’&Y*Q±CLáŽä÷’­‘øHýÑ<)t|&ëJ•TþÁ|Ul	Úq5»}ÿ0:™ûµf~Wà
S0¬¾qƒ×$Ýø,‹Ø›{=—^{-Ü:kn@sû¾9Ò{`’»Òpibµûú¤7ˆoöIõ´#u¥ËbP‰?òýÖ_“V2h SŒ(2¡H!.­J@Ú Œ²ÉnF2ŸÍ|@ÕCÚ=C¹Ð+>jô…uº¶“Â›ºt°ØÊè“>ð¥ŽP:Ç§›m°]©/g_íEó­jøLö0(äÓ;FÏ”:Vv’‚øÔëðN‘iÑH'ídu"ŸŠçB°È¼ý°Â(iv“4“è™uì‰ëUÉÑDß\v7Þ…Ù¸”ÙèB èVÿ3õb€5°UÓib†,ú´@˜ŸÝ±â*É>‚lõé¾ÌiD»’±É–ÎéOÝˆé~8­ "ÿWÖÉOþ§Oý
Bv~|üßÿGÅn·3:>.ªÀUZhê;h­½}tÄãÿ  ÿÿì½ÛrI– ö¾_QÍèm€;H€IÉT«Õº4-P3»Ö*¨"PJ( jë"’ÃaÄ>9ÂOŽp„Ã~p„#öüâïÙ°?ÁçœÌ¬Ê¬Ê¬HvK=ª‰iuÉëÉs¿ Xÿò€È»Wï^3R×²1ÐP4öŠDDª´_:ÍTÝñƒ ¨?œ¾#¶üôß^a‘<dØP{üW;\ ¡Î_Û˜¯íýùÚ:ôGè£H‡ÊL+§8×ŒÙd+œ=€•ö¼ƒî—vQ„ûë©uéŽãé®…hö)~W€p€åÉk¼:±ìZƒ+æèJÕ7mt·S[}Ý?¥ÂDÌ@<]…	Ø£Ù$Ä4Ó¼*N£ÁÃ$2p$w­˜¶db²*Ís.$ÙOt=e«›gÃ©ÕÁ“­Áæáã§ÖgÌc9²=Ñ	,¡¤P|Ö²yøÔB	·3å³èu·¶±Û_Yé0 Ïàv&ˆQ´¿¨žmár[:lÈlì_.¬ËÐFÝc÷Ÿ>>ý'ž±äÛ¼—'ÈÒ!KS²“%#Ìv€i­Ðí,ÿDûú5>îoÀepâù‘D7<è;ÞvÑm®è*Ä®¥ó/fW‡!v•çdTÞcÙK¢WæöÛÉSæ`®ÄííÍ²<p@3 °£­Ëï&c »ÖFÉû¦PÝ}}tMèä^ˆ´)ÏÈ.ží] R/Í\Ú=c9ÚÎ"íê>¹®³*žQ?v™ƒ‹jÕ™÷DoÑ‡ÔS…t©÷¬ºxk«ÿ¤EµWäÇ±ÿÊ¿tÂ#;rÚ«ÒËÿ‘ Ý©ÿ:eaô°ûâ7Ù[@‰~}÷öèÙÙ³ýyðäŸcýœS—gôÃVvÔzæØ,<ÀxŒNIcBì«6?ÔÀ…ã™6Æc	ÿµK KíoÓ)YS7¦,Ôá5î§‹éµÓnÖ‘ÀlÜbÐEìòqv¬Þm:hD¾«ùÒQÔ5õw“/cE•ìjî½º9TÑìz¢ïZ¿8c›U:0^ØºU ô	,n)ÐbäŸsàæíÕæóZôóÃ’è%Íkc…<ªáÐ@ü$Æ;k)˜›Ê0}:‹?Y½íÒ—/>¡NG˜W–~Iä- ú2fL~‘b¤1… ‘iŠ–ƒkD Ù^ åEmh.ôHã ?ea-‚`ý˜9‹îj.æÙÝ[ÇQ5DæOû¬Í?Y÷ÎÃú¿d /vÎCÇžuì² ÛÞ¥}=¥œ·!òCñôéÊ3½‰>jû“ÂwD°&:]€j²°ia"¶Æt«:m>?ª™‹h,9Kóž&RKóV¼gSû‚Ñ¥#‡9ïXÉÓUÔ"èæër½_å•´?;"=Ô+RX8w¼KáÝ…	ô%ö9YD¢HØ<´c.?ÚÜYE)£®íG…Ln˜~æ1äøÓÂK”bºEº—3Ô¸§ºI*ð$h»pC_&\™…çïæ|F´‚ÅìØíp‚ÍÔõ\“x¯Í”‘Î$õIIûÓ£æÍ°!<Að0ïªg[÷úœÁé+7Šwµ'ÓÐ`Æ¬š+ç.PZ7Vz‘©ºlÜžo°^"ŠÄqùë‚[1¼%"ZêàúB´ÐAÌÌ6»5Øj)‡JAN,"ýY˜ö=­4BQ2¸ãúV&ºç)ø»%§uf(Z?ÃNùáu7ãÐJ“®¥áŠ_tDù.õUÌª†þûâßYö	^ý$qJ“{³Üi1DŒaôl/qEÑÃwts(Mµ}ì®DQmö-ì’;Œ™¡Ãs­š¸øŠ0GoÄeäÈ	¬	¼©L»˜øí7QPÑxYÐÔJûf`WLÔr"µçÛãçUçiY“‡>‹RÃ³¸l)M({§Dœ2Ütû² v	#Ó/½Õ¶»2
äUÕ	|ñËì`dx•aàLô
›BÃeíŠYjÇ€zJ²ÊoòÕxxyÆÕ1ñÌÜ‚¡ãÒÙT‰ ýy+ŠÐtÒ,÷ò	Æ¨_æ³ºÀaxƒ0gÖ‹#__·Ž¦Îh†Sˆ§Nè´"Ë¶0PìÙµ²¯&ÈˆJ—bÒr
au5IÇ#GàJÒr?¨bƒÛ'ƒ“goÏ†/þÇgÃ÷ˆ s9^.|Öˆ0éÈ¬ÕÉûT2Z}K$ŒÞˆ|¤@ô›–¹ž~Tv]^|Yke‚ò‹Êêtå3lS#`§Þ:ÈcÜ(€hÄ„0ëüà`ì\­#“cµ1Î$¢4ãÀé8Réñª2<:¦ ,0'Ž‘íeÇ“‚Ë[û¡bÊòÈÉ…Fë>Ï’º ±3^c#ÔftIÃåx¡é3e¡ôáË\"áŸwYjk®-Ã½FÙ­È*Yê&§ ˜Ò*ö m!—TtÑË47kO¿Yªs“¦Híä¡ä «!î*‡
g)P.c¸GK}5÷Ñ®¿ßl²Ë
«D¹}êÀlvý‹ÌòÄþiñ/.k|qé‡cþþ~kÇÁîúúååe÷r³ë‡“õÓ·ëoŸup[­i`Ž=>¦¶‡N°|C¿ñEçqKyµç¤x%¤!c†½uö®ü5mÊ²¶Æ*ÆI“¡ °9üÛ%CÄ­øÅTá·ùšG~‡6›»‡°ÒJœúÐvG@xéöGsùÿºF§dsèˆ/6Ñ9XóÃ¨•¯
È(	1WNU¢r·çþ¸¨õ.µ™´†ÎÄwûIëgÇûì •Ázã$NKµ¨hÚ–\‚s5†õ…ÔrqÑ²ù¨ljÓ^³‰iŒAæ¡o‡^´åØ¢×´ir½Þãþ#<e^ßº´>àeËÔÀeêw—Y(±ÛOvvž,9KK±ötGE5!jÞà†KñF?³®é‡ÆsÒqéÒo>àÒkWí…/ƒ?¾ž•ë¹U>ù`{aþr›Í»¨D êbLŸSƒÙ\{Q6^—Ì£ôt«Y´e—Md¼|§a&ŠYxt>Þv
…&R‹2ôc=*FgD.Žf(EúEïbû¢p†êc‡‹Þ£¾]†dÉž^2Ì“ïÝ5N ìÿqùÞ¹ó‰fWèð‚o¢ SWEQ"Ô×Ú½(RS˜ð<ƒà'Å§òF…8Ó>ïœ?ê?6L„w^¼ÙÛ¥Gio=Ç>î­«üërL
¿Y•—þ…8å(Å”¥Tþiž®¼|÷úäÝ+rZ2¢Kés3ßç6‹%K£´mõ¶{ÐoyXT7öß!fgàÉ§›…¾‚|W}ÖUË­äã.÷Îtj‚Nº:? ¨
ö¤÷dÙ€fáô<UÝàc”+•Í!bé…bÜâàl<UAÆœg

Ø¦µ.7œi¢`y«§òò<íì.cý[–;Þo]ôZLþ¤É²ßßßdêÔŸüÌ½£÷"t2–¤ÊÏ€ƒÇÎîŠu2xþÌZÖÖñ5! ªË ¥€<ì/ŒYüþ˜ËÀyîùç<iÛ!üÙ~ßú÷äÂ¹¸àf;.º~XS°	7íÈÕCçÉ›BÎ¥ìLBT+¼{ûª;Âxt‡åõ…ßmì?÷2°3LÖéÐ/8æŸðìâí–©‘ñÍî4t.àuèB¹=æŠXY—uíŒDÓ3MÏ¾¿iáô5Hcž\åóß£?Q•Ï³Öêí™±†7 €%°…qŒRÍA:%Ü¡.º]-ÆGS×·qÈê´F°´³,}¡úièÌýÏNîÓ¢2ú]€qxÇ,Ç¬NýL9~¥*¬T%G¾Ãrÿf¿yàìÆ˜*¦'Ã:®îjN[š/¥I
z|1KY(îCãTkúˆ±~P3)÷žùCšù=ó‡,±.K‰+zÓÞ)/4c\Í]‹ƒ)Yß(u±xhãž^Y¨/%¿Zü!ŸÄ_ŸâOÍç¯MáBóü÷Â¬rú49ïÀ§À 0Èƒ…í]£#ü>þ’ˆ#ÛÃ¸¢P<Ëú"pO+.åÓÛŸIµ­! zC€{B	‡q1Ú­ ‡Æôßgh‘yvµ(LŠÈb^sbŒDE“‰—ÛžÃÇvk›[Êû‰Õ[ÿRÍ
ŠO¾\“ÿCè²,µzA'­Ví2eXOmçÊØJ‘í®bú.3?‰œËçÓl 4–zÀ·Œ©²¢0É‰$YÓ«9w¼Ž/z×å{8v \íâ.ðééç°¿¯ïZnDuÌÌ
ù²uÕå­/æ€,ì)J‡OÂoàiámò®!|übÁq$æé¥6`Æ	,AÛ€äÁŸÂ?½Û“Ÿ ù§{«k¹R²ÒŸTD’u÷“F1€zêˆ*½ÆÇ!gá/±®PÊY„f9ý¾:,žºTya×z/J›ÎÕ)öØº-d­ÅáCeC§Uóÿ»y“o2µÇÂ¡n/>¹H@Ýì `µ ãª	eu-g4æe–º>ýR×~öáœ’´gùÙËß¾oÿ”x¦˜1 Í¸=Ç´ì;h¿¦ã#'©bÁÍUØ9±.èKŒµ`ûZ´DüVU»V:ÿKÍ­ï’‘*Ö˜—ð¢Ò¤*øš×>ßæØ
áÈ	û+<å‚zþnWÊä`
	%Ë…ÿ§?¡g¬ñÝ¢ï”A•=aâày¸~°‡")Ù†öWú+ìE§à‹å#/¢
-M1m4n—t\—Ü*W®NT±4T«–ÏKÅ!æTjÅ€\‘O›Y‡]ñ¾ÐR<y‚ªæ²1v…9}oÝ=h•ÌÂ8Œ&°ëæ3qgŠ‰‡ï7•>~›>%ÅIÍ~ÖuXHe´UÿÑÝ ƒLB{Î"ù(WËÛ_O«ÍlÛÜš01Ž ]9Y’¨ÞhþTkõÍ›ÈºÔ2'¬BÅeÞ¼ÒÏ·Ì-*µCþr6¥«B{Ü°¡S\c€l¹¸2»mZkDÿ§Ï¿¥	òSí2>´\CÜÛ.Î³ërå*4Ñèu±à|UÉ".ÖÂ_8êo”´4––™}™..®:zdT¸•9Ó]®°…Ó(ÄûE…øÊœŒço¯YJÌÁ›ì¨LûµÔÛWÔJ]k½~ööøÙËA^e]P/Ö®8|Ú–ü]ö$< œSrNÅÛ"Ë`šOŒ=ATZÒ
ôpj]¥™ÊìŽ‚fTµNz„uLå¥´/ùç­‹QSRÅZæ™G^HùXwØ"¯ZIÓ©ß`eÃp/¿£H¦ ¢ÙçJgöÙ2¼¿M¯cª‘W¿R¢·¿^ž¾³†Ï^?ÃLä °[z˜íUVŸ{€Ÿ– éÂXYx\S“ˆ‰j?{cxÄÛ?öXñiÕ»¬y­7gøùðY½Fç—Vû—“Õ:ï³üš¿œ”½k„Õõ8Ï5dMçÑ¦ú´b!Ëx¼•t‘­žÕf‚é*þšüþ†é¤†ÀZ‘oe®ˆ#ê2²²*·wïNÒ¶fá½®“}»&%ÊÆ=ôU=5,ô;¶¯)¬€žÛÀVýrR(e¹ú^£¿7Å‚¬?äzØŸa ˆ~9©^œ²ÜÈõäPïñ¸þ7ˆË­Ç}B\­y‚ÿÓ1çFò#¦M0åÈ–VeÅÜQR¯‘K;Œ„ŸÃù
K?Ÿz[]ïäRÖšk^¾½%äHGtê1?¼Ìa×Êqïy&FÏ4ï•PÈÈ™2‰heóŸWÞø¥Ä9{¹÷ÞfZDL.UNÓ³Ïúð™)9wÍ66±S-i–P¼fK8‡
vDš1®ÈÇscÖýG\Å®˜iÝžš9žïoRÕR^¥¨Ù¸ÞÙƒÅäÂRâ¸ò¥¹¬ |–.eï“ßÞ³d}Ýêt:˜¼U'ð'Þ¤zƒA0ŒQ«Eñ†öxî.Z™î›[/÷xÿØŽ¦ç¾Ž-q4bÿ¦½ÊSMx+íÆü@ §Pïú~Ø[›¨Ü‰‹žAdsy… ½RÓ[>Ôvy(!*ì/Žpùöo˜_µyj*˜§›¸ë´@ Š:Ÿt&¡=ÆX”NìwÎC«v"ô:èloXxÏKèÏÏ¹¢ÿ ýd¾£AÖ§$ŠÝ‹kñ3èlÁÀ±âëgÇÂsžÙ™ºc›1ùAä‡ ¸xw%¥zjoÖÿÅ:L)¶uìŒü[èÿe]Z¦Naó³ÏA@MbUw÷À1ÈWü}Ùy²cMñ?0yš\cÃ¢~œqç"ñ<kî^Á€ªÎ<ñb7ð®-Ö
G;	;›WžåöÈ¯qaì…‹Ù_;x
Wò¾o¥#dôMŒ¸í(ÝÅØø÷:NNionømXÚcL•¸¨î¹ÕMDföÝ@âåbBWÛÃöù¨¸ð5ê1 ñÂû|lÊû=z_û:o¸Ø=~9ÍY ÕFw[÷z¶ö7/ÙÒ}#ŽßV‹œ¥;ó1™TÙoÒºÅ¥¿œ¤¯?Ù …ï8¢¥…•;«Mm@•>üÉ"B/Â>‡Å:³3ñ7Øãê0‹D+5tþr'm~ÞÙ1ðªùÏƒÎf
ð; õ³á{ñ—xk}s£„Þ;ôýÙ¯ê¬ŸK˜èþO¬*MÅZ7±a%·‹ïMûÊú ?v£  ˜õŽ;CwáGh#cÏîóÅ£¿¦{kÙ7LV†•¡ƒn±1z ¯Cƒ5qì‹˜Ø,ž^šyN!Q§g&çfi"†1n³1îð{óc}mGÉ,K€0±g˜´!L0ä|F™5Y˜9¦Q`3¡
£ì&LÇÁ¼	Ì*îSžVÌ&éêpŽ,æ÷ƒa©xpw¡=ÝÃ,±¹þb˜œÏÝxÿÆŽ®#ª>™óq(u:4:6`=ÕÃBÄ‡è·áty¦æ„„µp1ñ æ]åŒþSîŠüÛOü''ÖôÚ—Ïæ 8¡›¿Šîí–ƒw[š/þ:2~þ…Ô ’~æ8Ø‚½KïïæjcóÚ’ -È%fî\j÷â9÷ºÓz`‰r#gÎzÅ÷ìåv6ð4/C:nLáÆîwáÎ¼½ºÊ¦"Ý	µi¤Œqná{ì.œ_7¦[ï7>‹œ(Ýx$ƒ„i¤W´î‡º¢çQÒµ3&µShv(!ãà˜‡6Äê“ô”­Ñïõ›Ô.&¶39ï;¶Jï¸\SÚšÍ,ïJ‹Á+ŽéDJ“ŸbO×ÏG—Ú’åï#d£÷+AÇ.4—`„?¥’ÁCÄWkù7äÎÌ[:öGoIP¡=>_³Zx7¹*¿>&¿1ž4' 
´ÚÎZ×~šfÅ¹ˆža^›²¡¦É[?¹¡ƒùukácºR{4%0,˜Ø}k„ù9²ª¹˜Øüj­ˆ9ÖîÂìX¯wðîÂ½J§§TüÝu® °#<¨tç+¦_¢Ø^e
BÓjc·üKè”ýÕÍp×þ~ŠÈÌýgc`Iq†N„E[^àqjaÞ¦³VÝ¼a}JHDïgùÇLcÇ«*Õ±ÝtŠ‹fÂ‚%èDAnÖ,@Eñ€gÊ&fÈ~*®¤Y7¥`-Ï5ï#?–
A›ˆu~{ GžŸŒ×’ýX{×ÐYŸ¥C,yV	-¸fÂå™Cž‚Üh\ßÒN/ykÚz‡Z÷öòAª­.xS9QébuÃhô&ƒw6ysåÃêæ"gžµ¤$O’¼R¹AÝPkM<·¡¹îæ§¼F,ÇnºFk*qÞÍvxÍÊíÅn¶]FÜ„?gxJa^,‚¡0tÎBhîçô•<R¢*"5ª‡
Ç'—jX,¦9jU»›Î™;nf¸t£b»ÎH¸ÁS/6lù&¥@•µ2–n®¤²–ÎòCäçìì­&;‰wØv²Z”œmµôpÁ§ï`Q2ˆ(ë^ŠÚ™¸+ízû#}†.=mtw‡E^9©•ªfÞI¾4õò ãU#2^™oŽ„B*¾1¢‘ÊÎ$äº›nyÕWJ’ÎÊ.È¯Œ~Vî@¦âžˆPB}²nj®<ù1’¥‡d"À_‚Å³·G«42HÚº–í.íqëCr¶ùkîN˜tØœ‰F.õ ³”¹eü	Bc*šÀ£Úö@z9ÈãTí•ÚÖ7ûõ5±¿EFJšÇ=1SR‹÷ÌPI-×dªšq-çÕÄÔT|–çy*^ ´«±Ê¯ÕÃáÉóTñ¾·*ÃyKr]¿¯¨åµkV-ž
qLýsG	»LÅ6)ÓPÕÄ.q ñ]¤¶šw­¹ß+ýÀBÈ7Î¼asåœyø¡7ôcýÛ0Öÿˆ\oî^É¾©ØËUìÌpÃÅÒ´7W§×•j‰Ý|•rx×l æµá€8˜%Qª™š0‘8Ë¼om8V úï!„4ãº—à¸kqÊ‹*F<‡¤46Ä24§ÅüFÙwªÎARç–}$¥÷×inËû«Ï»7ãÛ<»áv¯~ß|úò<z#þ¼”7&hg¬²ék,#l\©àÑMüù}ñæ†ÛËðäìä™ÎucWz¸Ê8…{gÉ±ãš©,×°Â”/Êò%˜q~k¹‘å´äúZrOR%¹±™…†L`xph3M¬ /4Ùÿ*©A×VYcŠìPÊõJrÀ¢‚•ÿjhÜ(ù(&m>Ü—Îõniv4öæ™¸g3çZxi™vÙve²¬¦Ojq¶J­F¥XÉ¦ü–ªä¤UòÍs®ó=
Ç.VpG¡“†ÚT˜IT&´-U'‘úìJnQ`œÎug}Ä5¾ƒxÝ|'¼mnwf¯,¼Š¹Ê–¿AoyT@Yá9ìðŒ¹c^EÌÓ”œLÓ|òè§<Âº¶˜ŠYõæÜaÞœ½•ªLÿŠ×ÿÁžO­çŽg‡{ëÔa¹¬²\ù^è¼Ç<LWê}° ™âWj½:ÿ‘¸È¤Ôz[ñ&¿ìàª³e×~w;uQ.xU³%DwøNÒ.2¾üƒ-ˆD~q×ObÊC‚I*$gòpP™Ó÷£ÔÕ¶Öd(kÞËó„û+ããOw­ÃNÄÐ†‘¿f»'ãnukiqCç4ïüþ0-L7ëV–]âËi‰ }ƒìŠKÙÃcë3qB×êY¯ÅÌþÃC6l…ah£ŸÎøÒq¥±ÃÒ )_6s¸™9Ü“Ã=Ï¦]¿¡Bü@çÁ0E“e‰9;lºl)V~ògId½¥°€—€>×uÇPÿPç"R&¡;¶ð?Pu6­‰C0ò×ÍàÕ«³Á_/^_=;;z5Ÿ)¤½=ò"c²Iý%ò#]pùfÕ£®[(&a¾
±{u®½ó$ŽýE£oð.rÿ†°Ìþ¦¿
e=×Ãò• ¦“oåµk³Q­6–¶ð&1†÷å‘gh}_ä+‰¥>ÇëG«%Ç]eqQ–Œ»ñ¾šaXý“lP}íRÿñ?Þ°¦¹wfëA¿Ú#a¾GKt}û±Ùf×;òòUŽKÑ9'l–çØ¬bFU®ˆ³a.kØßÍGêæ=ftø@±„)æ€íÎ0¬.ÅUIº·`}š/ì-š
æÉz±ÄQ_bþ{ë3ÔÿªÒé]·5pBñV¼²gà9ko–óÅE“=±’¼Öá•‚'•V“Ì˜cöfé‹õØá?¬°¿`þ1Ñ¦¦€TÌ_7|¥G¿¤½DëH©ãj­>¸	ÛZ-ˆK_þtìR€Žy±pù7*ÂZèôÏ†7/+ÛÑˆ‚sKöS³ò×¹¸ó”ÿ ;TŽHÚ›EGÞÒ8õü‚§õy¬à#mñuóÌcØ\S6
ù2Ÿ…b¬õÌ‘å(¢ýÇŽñÑ‰g»¨Á@ñ‰&Fší’‰Øbºðp®ÙÀ</{,º›ƒÎS´P"„Ésf)³ƒdqm“r÷Gšðüä»f2_	xxŒTé-&Í²‚c	[êâ‰¹À œ	  eO1[€m”N,2ŸÇrîE^O*c×ŠÜ…K!°*[ÀRæ,WžLÜ,f(YÏ’yä 3±ü5aŽœ¿ ñ­ó“ÓäÜ˜>T„©¦ÚâÖé4™Ÿ/Ðådˆ	FVéZnhkÒ#ÔÜçnÉ+´zýÒÔ#x™Óljó‰àÕ0	^æ4$;kÖ˜¥SÙèö´9IðÊ ›å9pºQì'!ô?¡¦Ú.âY–µd'%ÕH4ë¥‘ÅÆBú]ž“%+JÐÙ¶¢ùnÐÙø:Ë5Bé	`îí²#º(eº7dg˜Š®sÚA-Ru'ÔJ·l ¦¶à;$~À±äe‰ÒÄ~þ:5óŒKq{a\'˜Eš-k
ÿ¿p=(£WHY[”vëI“õT¶ôæt³¨ÊDÒ¯Ëã’ånIy\’ö5«ÖDµHã Ý'ÃvÇý`rk#ý¨Ò¤WÄŒá`Ò`‚?Rîˆ+2’¤¤2ñúæ‹WË×ŸXeµ¦´§áÍ"{N.-ÈÜ»É„ÏaÊMÛŠS"ô™vê¹}	L‰H…3OÎ|c=`Ç¢˜6rÝ…§çÉ±á¥EWKB‹Óº«–‚^Ñjò±.7Y‡X@jª§ˆAÎ©yj-ŠÀdÀR1érÐ¨²÷T˜zH^²Ÿ}k>ÞÍ¶*fY˜!™y¬Yîøª¦!ÚÈ)–0Õ(®(®è/ì>+<¥¤?¬j‘ ù%~ÿh}Ä’"Ñîúº;Ÿt¯YÝ‘?_ÿì®Ãß»]ŸþÇ˜¥Hê~
&­]î^Ùs#»…ÄŠÕFd« µ€Ýüûßq™ë+2XyÎÏÈ‘#ÏVx­hd{Xa¤»Ñ7ñZºËÌ¿5j&'Ÿ4³4 ÷7ß²êè­â…Ây Œ½öÇ¶Çª­Õ·SáU#ÈA]º`YºX‘4o,<{Xu†Þx:áÚÂ'’`Ãèj¿Ý`×´â'Aª¢QRãP'fäÜZ$4Ëuì$äý‚~¢</f.Û¦`çëçê“}îz;»O$±íÅ‘æ¥¶²+¤SÙÃŽgwærJJ±ž Â,·÷Äí¦³K±ç­°4-À®õ|=òWŽöÓ¾o—kÃöbŽ#©†SsC^E1qÊþñ){/€Ögäú;†‘7±-ƒk¦J(™æ†b¼0›00¨û+žý·ëæMÔIä‹²ÍÝÙ¸¨®]iÊ\F>»¶ÈØú„¥ÐÍ ¾YÝj%^åTŠ‚Ÿ”žQ±Ñ(ŠhHÓÆ>Þ¨%j»Ör³\’‘øØÍ”÷~ÆÊÁ)qæB.k*‡¥ãkn	]½­æžäÑës+Ö¯p¾p3š V§){°» âßÙÈdÌà‘êó L€àÈ~ô	é46æÅL·ygCÁâö–BµøÝ4Åqã¥8"HvÆ˜)Ô“`ó)€ï}Uªh‰Å)m‡’‰Fd´YâqE¯¬——À´J Ê1B5´½¡CÛ=õ.ït»È|¤x|³–¨ø©”
ý,ã°°|žúu£ø!À¥=nÈQ×eÉÈQÛC™ÈûZ?B”V{Ë€ N±$©•Øá´×áF2(–«™æ%eÃDR•o´,€å§uIþ—Sú¯îp!œ‹çAâbªåh^Œû	xÀ ¡ÿ+±Çg³ÄH–…ãCJ+oóC~ß Ì³Ö“-RÖ×ÓÚ×€mOÑ‡r¶]
§9®Æ¡í¾À“´ûÜÄõÛn~Ã×I~™Â÷Ø‰Aö+ÖV(í±˜`ž£58ü*Ÿ»œ‡tÚÑt«¶Rùo™¦l.R^rÎ€–æh–)pSÁh‘L–€š¥¥5])ÆòëNçx£Ž˜!®¢ˆUýFo£Œ}¦6~{ÙIäzø»cIQv3Ýÿûc`6ºlfÒ:B Ëbµ ™Q$íeYé¤¦ô´¥Ý+¶\…ƒ9!¼–\ÃgWÐÝÂö^a¹¡âZÒò&3ûF™õ^•ý#ªÞ®Ðn–¹½–yšªe˜†–—Vå3‹æ+$Ûçþ•Eúâ¢‹†Ó(¼0Œîy¿†gÃS­îmðÈ Ç•q„{d^H{ƒ£ÑßøP-QÉl…ÊGsÒ¹’òžéßTZêë´^%¾Æm^Úñ#·Š6Uv½ÈkVjR/Kq$¡Ò)
—Öåo>°î¢ód»©Ã\‘gØÊ4Âë
Ç‚	ÿËÂ\îËãðd²@	À
ÂJC¢~~½Ì´oð !á>üÙ©+Šë(IFÄ€™Äïþýºt¨ŽÅø±t+tÂ™¤j_€:6óz{Ùd‰÷êQ+,™·_œÚ¿êñ1U¥Ù_a¦²ºA¨ÞþŠ°¨Y™E­Þ×ÈÌ=’° €œ’Vb$$øRXè”77(7ê­BÇþ
²è¹ÛpÀí0©þ¸æé1ó,¤ÀªyJì/ÕqnWó<[¬–šÖƒÆ&°A„"Ç„Ö€Ž:ÎÖòUs?ÿUÝDD„uQ]À¦Êð¢f.,UÖQâNª|Vôî%Z\´ZËø¹ç^„0¼ZNæÍÔåòòRø tþÈ÷g.sFÁâ³ãõïõöG;FÈÛ~ïÄuù2y¦‹á¥iz r?Æ]Ô4xÚ°]û+öhäxNèÏ,Òl‰i=…nÜ€êv.C8&O-g1
¯ƒµ¬ @ÛO­ÉuèG#@ñO­ÀÅIˆLW‡ÿùÔºtÎ;ÀÎ…5h<?Á<†Tñ³ò›ŠsSÏ¢ZnAmbU"ä¢‚K³J½>êûªt~Î„Õz%¬y«²Z‚fÆ§†K!uT_n¾37‚×2	^wãJðRÕÀÛ"VKâœ“V.l¨h°Ü‹‘é›mk…X¢ûöº©ÃÖÄâ–nà‚N:.¨¦º¢wRÍ\ß³¢B§¡Ð<]-)±œå¸â¾júÉ%åŽ³ÒÆªÖØX°XÅV,@G¡re„~h[Ï±ó¹Sä ©ŠqUåbU¥‘‡Æ^mu0¼Cž•-í8*LÕ†;¬@2¯<ü~ÿòó¦6R"¢< ©>,à‘NZ$…ee‰äÒÒ8û4N^#Yts›”þÍ”ûàÜe¨KUI._tQó¹ŸÕ¥î×Yö 	ïn_2›-ãl*Ë@çÏév0éªƒlO|»!¬Cœ àM]5‹Èå§’ø¿–Ë3bqvì<fë¼e$¹˜hÆ\²ph$›4Rj;)…ZE1ÿ2§üôóÔ«Ô¶9Cÿòf<1PŽWÎ%¬h¬¢AÄÆÓåãê:úºÞxÝo`]Õ°Ì1"'¶t œ» “¡	lL;ÉÂáT`˜µ»¾%ûË%žU¨“ãOË‚æ†Î<'Ò9ç(@MÐò'Œ\ëÐ‰m«c:aÁpÒ›½˜4¡ïôhÚ+lÅ$ŽÙqÚ)VäfóUã·¤óˆŠmZÀªs×Ï¶ç¯YoŒ”Ç¢ÜîØ}h$\?(ØÓ`—Pë`_¬CÙ1.çS
Ÿ:a?óu¡`iµ&x·Ìvµ·>íÕŽÇÞT¬êô9Ž²Á•ô}	Éª){R[6bWd*êh_Û!¦ïÄß€e?Á3€à‰çwaCsâE'nl³Œòç«"ž†UÌÄ	•‡_°œ#…PàÙŸ¨>:%9óœswjœÀŽ× ‘pnÏöš5†ç¡`ßçY>ƒž¬9…ÍÏÅu%,Bnc®ÌØÂ»†EÖ†=cœñ"ÇØnßzŽAF?96ŠÛz—ˆÊ°$MÒ¡"“Ü1’ÅŽ¢É£9ãµLà3^Kàh¼rx:x^Sp¶1þ/]¼qq û¾:ó¤à(áýÆÙãàêlž³prÞÞX£ÿu7¶V?˜¨,‹øHeÊ4Ì¹ÄOÒ(!ÜÕ¦ð*Ü§
íq›¨©Øì§Lw/¯‚Õ0‚®GfN\µM	iÀœ™° qÝÞ¨áíoâtM³ºìôvPÑ²cr˜O§„÷X
•\9§Ò°Kt„C„»Xäâ”ì=ýtUPÃ[×
UÊÌ‡N²Í\ò³/Õ)U­¨&º¯dF9o•‡B¯œ ¾´æÆ€_”[ÝÊ’‚,ITðž;³¹!Õ»‚2 žGêbÙ|tAèžci$ ] ¦!âý¹=µç®ud¶Kt]¢&í£“Uk
cšØ…œž¬¡gCâYxÑ•“·¿ž¨€jbcb’¶)Æƒ­8™Ø‘eç0FV2æBP²åµþd'SNº0½Ð¶³_ÂIÁ[gTïAúßˆÁ=y+oü£ò¬à¶ø)¨‚øý»iœuhÃÔu¼ñVžú"ÉÃK'r¢„0«@:¿…8qgH`¸ÀÈk€ŸA³¾fBÃØÂà¼Ó‡GYE+TlÏN^‘ÄÖ‚J$¡;K<’žCt"ØM“>ìŽ÷“ƒÃáËÁ‰µ±µ³þóúË·X\bä7ö¬kã0™¡†HÆg‹°ˆç)»´áÞìˆÑ˜Èµ¤c{`	F>¨"¬ØÃQ‹×Nì’xLgŽ¦úŠÈÆæ7²qÏdƒkÿXTCšÜå¿Íà?w’‘²Å8mwñEÒŠžù](Å•YL ®@>€ALhŸž¤|:ðÿ«k©L1xÁx}üb’,lÊ¢ÉuH¨{
ð¤ÔàÔžEþÂ‡÷=ßŸÃyýìF„ÈX?X/š§—þÔK©Ä	) @Ø4÷³‹tþ0¸ˆ„xÅÈµˆ‘|Ìü	âÙñ^ ³bz4Õn¤»$Øé†V´°#«€ždKÕÁº§îÜAm¸^!¶¤á€çmÙè>1âwU_jZUÙZklM0gÁëË$e3%)óñn€+#-}$+ÛÚ²´…”‚:
Ó€T˜tñýÂùÛ”tñ[Z]¼pŒ‘n2M|#¼¢c4µ^#öÚ!]-`…¾~HµŒ.¢îŒ$]‚s°ª³›… ²ßi<û9÷ mó¿%$}Õ	®pÖâ-®1Ïî(~Ò¢áüÅ~æ	‘¸Ÿ)µ0Û¿)å‚îªQø%ø®¹Wa‰ã]q‹UÁ;þx¼KÆÙa â"‡½;ûÒçhkæ€UL³§ÖÊ1(ÓnKÚÃ|h}JÙd?æN¦.¸¦i;®€4½õ~ö.vóO‰Ö™ŒöWæc	8tª®`˜(8¿·„< èwÔ†ãŸ;[€˜ÑŒwÅím¸»Éî¢]BŽIs eI]¼H/fià¢·Ÿ¬õ67Öú[;€îzÐ]=6j‰¹Q]¶HÕ¡ý1súë¯ÿÛÓ„WáA™­^D¦‘¿Ée&Ìó:+GÉóM!ãB=3S{©jsL|
ŽÈ¸Lâ$–êZ/ñ"ÐiòB`pF¨1ÅQ
Â(ÉÊþ,Ÿ%úS.ƒ([ìð¡œ¡ÿQÐ§ÛyòWƒº:MpWÿ+Æ]O wmôwõ¾dÜåÚ!J8¯A ¼pzòÐ¨‹’¬ÆþüC?Ùî¹µò½~1Hîèsäž¬t%sÃm„©È?`dãk(9çIÌ‘UiB„;M>%\bÃƒŸ-ŽI[*¿á­‡Æ[©bEV³|Mx«	ÚÚüŠÑVoçñÚãm@[¾`´uê ¢Îï/öøÃËQgóà˜ËF°O¬GÔ!^!žêGôxã¬!®9ÓçÏ×­…QÙúð¬P~Åˆ¨TŒ,Û »)"‡öE¡Ï)°iÂ
ý¾¡¯‡F_™1Q±-~M¬ãµõUc°µ`°^ÿÉŒÁ†î±	ó2ùy—<4ÚqÂp’gO\–Ô~‚ˆ$¦¢`9·,Àƒ˜ÇýŽÉŸ’‰m»‘­HŒØÅdj„>›¹u
(p¼Mh° g£rˆÞ­…ÍdH‹cwäÄöìA‘W­œ'ZE6óè©Ãé—p‰6™‡;r|ÎÞcƒ“ç—YdFh²·›k²ËÝTûä¦ú˜»©.é1_Z2&3¿v·¹¶¼·‘CŒÓ"Ta@›[k½'Öžl¡}Ðƒ1p«Š Õ¶¡n¡ýþCÄ‡·]mA-˜NwJL§ýªtË–0ê£¶p7$Ó«á–íLŒ	…±Gä¿G¹Ä£wÁ†Y‡4iÌ•›EsE¥kGfÊŠeM<ub;4Tß€¹ç¹†}Šb;Œi›6a‹yÛ0-Ãe¢bÈ‰€ÌŒeÉNÐÆYŸ[9@Û«\YC'pÂ¸èŒI_xúS˜wÜO.S§Ê1ê¾4Ás¿ÊE8qÐýwÖtë™íC^ÝòÜó$.Ip’¦É9ÒÏŒïgžG3q 4
ÆÎÜ}½ëðkc•ÏifLêîµF‹äïDÄ×;Ñî÷c­	ÎI[•D°õ(ØEÎ”- Í ­œsØq@3ÜX?v¹¥¼b	öÖCQÕRþç¾É«\SF_û[OÖz½íµ~ÿw!°|€ÿ VÚž‰MWúbqáÿÞôõÈŽÉÙðë•;G——*ÏÑ?¡Íö¡
ç(GI!µ«P¥±8™’K’¿pf ©!œXh‡æ€qû€çþ~„õ&ÍMÑmw 2E^wœ®å{Î4uÀœ¼@«Ágzy‚‡3’­ !ó`Ž„#'rf®ˆeßÎ#\ËÄAàugè?<¦Dx[É»Ÿ
Ñüj×‘Ý€[[$Sn4¹ÆÌAdcQÈQàDî…;³^'tT_ù°XÖ±í„ V h1*b­6Û˜‚‰òð_hñ»ÕûZ+ž:ø"B.D
ò·ŒÚ^jAw¤Õ@…“zä+>’ƒM6À›í9²¶‹O\›Ë–îÅ Æ$YÍ@¦Ðeñ?çv%sWIð‹·+•GTØÚ·0Ï›¡fÆÝ=ñ~G¼GÍÕ¹°þum«òðÕL0QÇÿœ9…§,“1ƒ@>ÑÕ2.’»\>©B2½‚O¹6	,wqÏ%ñ{œf·È9'n¥xQÎæÚbþê]ñôÞƒ9¯¾Ò‚K90^Õ&3PâÁêËÚôÔØùº6ÆaçS”˜Qxø~ƒÂ*Ân¶NÒ°vRÞŠ*ñåh—R¼¥”	2Æô Ù^vÐo~GÍ.Û"ºUñæFyí§ò,¥UÉƒ‚/Ix‘êÆWž¿œ¾ZÿýŸÿeÚ‹À¶]Èú ‚ôjžÊ¨õIÑR4ówþÉ÷q#×­cakÑ­I83dÕGÿO,Íºc¨`)È5•¤vš$tJ3Geå›`LïñìØ^z†Ú#7yÎ™Ÿ1`];ûl‡íN'¾ÌÎ¦£ŽVáüKµÍz¼¶™œ'#ïÉZ3Ë_±O¤T-¯Qý¬a¾”Ë°£}Ò–43Xór¹{GþÅ…ãh‘²YØsà'DÊ•úF[ââ‘F&Aà£u:u¬cç³ãù–P#ª38“kpô+%FZðüX“êÌN€g\&†§‹øð×lF«jº¶yf¨.¥¿\pïRªŽ;•¤gÌnŠ Þ#¼mÕ)+jª):«5ES7ó_+"*G¨åHxS©¾Î¢¶ÛÍŽ–Ö¬ü÷ÿñ¿Õ)ô ÞlÊ(¯svb4Nh½ô—'"AÒÐRšéöŸ_»±=0çÉ“T­YÐúôÜôt*Àçÿû¿þ×ÿûáç­3s€¹@`^ØMhãq³×ï=ÙÚyÜû>¿øðÌÿù?ÿ¿ÿÏÿò€ 2$uËÖKT%Dö¼1¸HèfçÉöŸ'sÛõ0ö}€NÙ#¶%Çç	ûVéžý0òƒë§ÖÍÂ¹ÄthN{µ;qbÌ?ýop™«·›©5Ä©v­ "àþ"'üìŒM9½êf•ÍÝª™Y6“óÓ*è…Ü²šõª™]¶YÝ_s.ZCöÙo©dkÔœJ¶t wO%›¥\í¨ÙâT>¶÷›§-Ì`Ë8­ISÒL¸Ù—ÊW´©#U]#jÀ[Ð¥‰’’ÆÔ­J%oBRlN7¦Aœù½Î©9–Ä*â’´1eB¬I¼–Æ#Ý1õÚ–Ñ÷³2[ÿÞ;@ûò”qI¦¨çf¦ÍŒØŠ©ääbj.÷è‚*òòÊA_€Az1f†	ÝÔ r žÑþàs/s2ZY‘€™LÓ0>5ý%Ë”¦÷À4­R5¦¦×µK	#â‘;ª|à<4S™ŠÔ”Sl ^å >³¥•§K:tè«RÊÖ±ê:ØÙJù‹
ÒqY~7åâ&úÂ%Ñ.¦‡ƒm—~¤áÊ~“ŽŠhnŽˆ©¼Þ@àÁîLaíœpåÓŸîZ‡ÉØE³rìGþš5ìžŒ»å­|¶aDû7	œ=ì×]@S?ÄÉ——ŒðGèã¤åë€Ëx'5ÔBç3Þoßt»]ü±femïZN—šèÒ nWK,+PÁÑ><p¾XD1îµŽªzß³§ßÀT½´`:<¶Þ8¶éaÌ"¦‘i¦ÀÕÂ¿	Žça`5×Á=ìï±ÚZóÍ*2“P|ÀâãÉ/åØÅ0ôååi5­¾:z,Ù¸ß‰)^KÄ\ådÕÒpÕi,OáÌr6÷«êp^½:üeðâÕàðÕ³³£WƒáðÙ°;·ƒv{äE¬öiix|€7Ë†ŽçŒbÛö--G‘;Y8ã#-	«Ðv×—W™ÅK#Àš/n%¯õ.^3çzÿ†¤A…¡ÆUîð*ÚçGØÊè¼h»|Å¬Ò£›¿2è¸ùÈÊ1kªªP†}_ò•C£ÏðúÑj	É:Þ&«ïv2uß<wOÖû­ÆýîR¿¬§œ×AjR“(Š¨êww[³ \u –¸
ª“B)S‰Å…ôMËM«ýÜ|”+z#ØÂK‚ ÖÂÅU5p-X‡ú]ãõÖ%£¡_À_/œÙFu²ëTTÄëAkd×Ruæ0>*+ò[N§é»s—ÄŽ{ðUÒ1ê¶g‰Wmî¯/ŸÃÄKËebWLäºSý½VQôÆÖÕ§d)aHê¡w‰×²@þ <tæN£÷Á7È-»´ûÝP=*Ÿ;;X|#¾º¢õßl?AßT,l…\Ô_:×°GX*Àú5ˆ`÷mÏ ê\EùJÉÔ5O¦À¼ WÚÇnà„%Å Çõk0-lËÃÐ
ë@öU.ôÜ£¦!€±^Âøci/þf¯d›ë`l p7øï·Z­ûW/È}Ü‡n/Z<¡‹^98¹šÍŽY”æØ³YÙQÜÙv£8»~wâûÕu¶ƒ þï‚ø·’/+
Á¦õ_õ‚ÿvê…Œ âÖ¯<§0öcH]bSsnÆþk:Ï	æ,Äå\_"î9µZØËƒÉ¢ mµ4J(¼©2x'ÃÇô\•z[LeÓkå®Õ»Z Óö†±Ú§:sØ³€Û­ sÎØÏ0¼ÖÝ[“&|_MŠå:»†õº‡öÄbßCSl?Îà ÁIªj°$÷=^r !woÝÌLù=UÜNÕnù‚É9©=çáÃ+]ªz3‚-çû12ãÞJx‚*I²ÙÁ´£ëÅÈª{<™JŽa7®v+ÓÉ!¡G­!d "0©5Ë`i
}¹>
-×QóÜ±7õæç$á³;ö“žÍ\âþ]§Á7üŒÎt"G¦ë¡ÿ¡6ÛÍÚ—>GEO}®àßŸü°Ø4WÙúG£Õ'¯²õÌá¿Ü¦)½UÏþÖr<Ôn5Õ]3õ^9­~ ‰vôï«»Žqx]óM¼î¢Þ`@Ï>±v›ð#ë™±¶«ÝØå_:á‚ü
Ýy»Æ„åY}—v´ÊÍõ¿g#Åaû£·ÎuìÚãó5«…wñ˜eÍ7n7;±¯=ßF›J3ü‚x.Æå£mÄ·Öšiöól]êmÖtŽù“Ž|Ãv&Óˆ¯›5šñ©ZìÜ¬1˜SŒ1°ŸaýÐÉ´»ð/Û«õmõAÉ¾´]J ¤íX×T kž„†~=ÿÉ;Aˆ?>DwYÄG{öâú ½øã±­×E1¹ùò¡œŽbÍ"›h}¨ç¬ŽX!®¦8éDÉ_lŸGºÖä°–’f‡³	qq¯-Í Á:•ÑQ! É_†¿¾éF„çÝ‹k¥ŸšÝZ#;M­6HîM ·Æ÷œ.|æ‡íÖO )ÎƒÔ‰áæ±„w5>y~2FÔÖ]„j@©Aƒ•¨î	ËYíWŠrõ%/òîî¥²WyQ
Iì’sffXdÞÜÈd2ºù(Uœ(j,/jÍ*}6YDäýHs/ýÅ…b	ë{<µ^ÛQ2³Þ&è*B¦Pe$¹Rª.%nªâBcYÄ?q?tm¯µz«Ñ|ÎãÎVÝåÍéßx¶ªk®—Î†­ß+t4P†´…‰“`ù`™çç˜eæX§|ü†3.§Þ“[>­¼›…U('¥±j@DVè‡\–¯åðŒÉªÊ×þØö¤@ì›hê_21=þ:óv)Šø[çý“Õ[I‡ÏÍ°¢ g¨.ãÑ<u’waVÀá¿i€S>lØ3.;\s<€*.åóq1 DYFSÖ]i„ó©
EçIÞ¹—‡¾ÃþìØØJU¸{ g·$5Ã#ÅÁüQâ°ó©¦åM(…š¡o5‚Vð`¦! ’—?0Ôh€B”kQ9„,ÓB¦ßîâ¼K‚=´i²t•H‰¹ÉMì8	%e>3J™q•˜	„³	åÍô=;mQ.ÊmH± ™€þ¦IeWDÇCõ`·/lð5¶ecÑ×1W³ŸK$WÔhJ`YN53ÿW1+n½é–$ €Sxè¯kœÁ+K”&9\éêL"%©ÉJ'‘uh'º‚~W%8Yf÷7€ CÆ'×›ÂËNJuB«:ÎÜÛ¤âÐ¹ªÌ©o™¸ñý§4íf~rY+Yhkz$½Ó´¾W7fö£Ö)sêDQ~c.	9y}–>F.P‹uVaªÚÎŠ9¥^$/Á]hòP™š9Ç…b 7ðBMW¹uD÷Rd6˜É!:¹È¥x:¼ÆâVûØ¹°/^ÕÍ®Ç…¼6È˜Ò¸ß}^.f{ú‘Y3§?lªÀ3×ÌTIîKùá#Êhß5ybÂŠýÂýX4òK`™öx RøeqVómÌ¬,j2Ã~¹¯D¾{ÊaiO1þ¯kXí†GƒôÞ {áŽXŸ×NÙZ¬wc3zÃ_PXÉ´f”ñbŠ÷’ê2Rë2¬±‹N,z9JF#¸Ùâø1ËÔ-eçÆ@7]²õ>y˜6èŒD}ÑUO;ÂÅnð®±lƒ¥ÇI[a?‹í°û}»°Á–.Üä&}Ü–œâQj¦½ vB•ùZ“ø¢H{t‹<cLAž—`’ÞçÃ,ÄiOÆjA;‚§â9	ýä:  •,@¨~©¯•8:?«$œp„ŽÉi æ¥;6¤{RQˆfæ¯(Sñ=sO®SÚ")Ià<…¹Àà^‰»VæL¥Wqw#‹´øú÷t.Eƒì£¶ê0dpRü¡^°p{ÄÝS‡©U½
Hãÿå¡ÿWÈ“VzmÖñc÷dN¬èÆ½÷R±™iOü…ŸS€éæ¡?J%Q/ÕÁ*erÂGû;^»¥‹ôgé	6)cRS¨¬÷ó^…å2oði-_ìÆž¸‡˜¢xqM¥Í_¢ÇÀù©=\OÜÑÍÈÀãšß{víüzqa@|Ð¾`xªgáE­<ü¾×Ã€Œœê®‡G
×Øe¼€ÃË©{”tXŒÝÆŒgÜ<Ã¹½UVÉÐÛ3–€vŒéÝ9ªòSeîÎœØhÊÁkX$3/ôì
óKÃx^W_ï1:uû´5ÐÈwPó}Î›Pó÷/ôTß[’£¡æÝºy)fA²£)!
æ»¼caZ”3ìpæŸ®@6JØSü/Á~ÁKóyê¥™÷”´þûúß5@a×
žOø®’*6KÒ\fZÉËÐ¸2\°¼ÎBw|š	vZÞ¼™×tÑ¼'ïÍn•¾YÌ¨qÞ¬îYð©7DÇà3ä}t\x†_®Æ€[‚$êZ²@s³"&™,Ü5{ŒVgnÞâCÉE†mÉ¶U!ä$"w‡ \é—hpÞ‡£®Ã†ü4´#5›ˆLœ~ÆUÓr¢etH§)1íòZQóê˜³œïgÎeôÑ]÷£b<´cÕª„¨×]9ýaçNž@jçt-qæ¥®Pè_Á¿2Êù¾‰ÖîGˆY-…(„2¡€+@üžÚ‘ëe,Î˜øL³yÅJD¹‹Þý¡Ýß™ÎüÈ§Â	E„Ê1)G¬eUsW‹dÕC¾-¡Ø#;HöŽÒ3]^íÞ ûê$û³‰í·xåM³@-ªó–%”u(È0ýrb½EÖÓYŒ½Qú— {¡™Qzç77JW[¥KŒÒ[Wì¯)šÓ?O?”›¨+íºhÑ*€LMÉòåU›uþ%È{‡¾?û¤ŒrC/OèM¶µ¶x®hpOpý‡±½c/#AêÅŽÕ,	ÝYâa ító@—[ln)ŠFÌSK¹»˜%e¶;Û¦{ãw­Þ&«ëJqÑ(,2À6¹Î˜õŸC®÷‘7®§('Ý·r,,÷¿×9%U¶ª}¶õ€•‚æ5¥Ê«"é'<»^^ž›¡±äÃ^lŸçzl9ä=eÉdÄÚ˜:öØhÁOµÌ™ZUlBocÃxªJsÜìÅát«c'7%ØŠþ•ƒ×˜ØNJ_OÍßË™³x ÍòŸö—ÿtsùO·–ÿt»ö§â‹öÅ:ìŽXÖ	ZJ€é=¤ò] ÈÅÐµ äæ×óOÎ(îÂðB×‰Ú¿œœOoŽo‡«,Òû(¡wÖXgNôaÍrÇW„U*Rø±<C¼	×Ü@Ö?[}²Impk‘­7îsÜÑº…µ—€°œÎY hi“ÒÎaIÇæ¦ô;|Ãçü>ûp/íôï©Í{jgëžÚÙnÒNñóôó²³WIœ5|ŠGÃäpJˆ¼n¾ÍâÍúLæ•“AË`¦OU]Ø—È^Þ‰¿Ü¾ù ¦ðÊêÍéd˜Ú¬¦ØÈcû:z8vó¥¨M<àµ‰³,9õÍ!–œ®Ï<ø<¦²K^VïÚ‰›EYÍäõÀð‹¨¨æ<+XO±P_ßi°*Õà<%9Eç©Çšymcd”˜õ:ÙOŒ¤#þÚ3Jé¾£þ¾5~ç/0€J,7kãpÍr>‹•6†5[LŽäöÚ7–ô&&ëªhÿ-´E'ä!xœ~¿7íu×*k£,y˜À6Ä6öo
·Œ£6¨ø½î®¹‰ÑÔ÷=<êG ›øµz£¬ïaáÛÂ=íçE»weH	]â{cÑ¦‰“£Ùº¼Á¦’J=nD¥¶ò‰Üu!Ù*R©JýCiJñ…„¡XT•ïvŽÙÄêÀÌè–® ¼í»s{º.l1åBµÄèž¢My*Ýµ®oÝýÀÞ=æD(U¹Ãjå[*0ÚrÞ;FN¨$bÜa<ÇsÑ@´°2ÅþŠó™9 ¯më_˜×aeì2wå¿ÿÝÒ¾Áñ.ˆÂ˜2€ƒJ}§–’*p¥)Ü~«MÀTÑ·Í¼u7~· Ãíßv‰í’|Ò‰K…×­WÈo5Ý1æ»ÆwlìD£Ú[†/‡n@~,O–>£Ëú9Â·öµ½†iý]8â¨ÂŸM]¬tÊ"ÀWþAvï¯v¸°a¿^ÐNü°Ö!‹(µ‡Ø'â^ko½M[”ZÞ7Z÷~TÊDa
>æ¹’eåà5#o3@ycódzëf…«{ëìóæ½(¡Q7'èï´n±Þ^'c[t) ð½dUÝW~…¿¯«=ˆÒÀ¯K¿n½ûÿÞ¡§lÁÝ0±Ú)x9M"àÖ-
eŸ;BÃ].­§¼rðn1®0Ø@gop>Ö03`=&8³·6Ö½CÌºûÙýdCƒKd(’˜—XÀí;y5¬ÕËÞ:;4q€ùA±TÚŽ^a`ŠDdW	—W¦5ÈÆUúÌÉaá\2AÐÚÏIŠÝ×ào;Ø˜ƒ9Ò¿Ûß7PâÏßÁóÊ}àá•ï¢vÚ{å·¥^¼Ñ3Vµ¬˜ô ë¦Îµ&ùô—}|{«SJö­*/&àýw§~>ò›Xûª¤gÊµ—iPLÂ¢1Ùay=³öÅ¼V¦åPèˆ2{®öPgOž?u’‡ßé—3œ€öhØAzsóüóðúÅ¸Ýâ\PkÕ²#ëçÓ×¯Èˆ¿²Ê<î«`‹²"QW"#’ëÆí‰qcî¾ 	:S‹¹Œ¬T­t”w-U¼®—ÝÈïšNöxòIøˆü9Èt¾¿ÉRëÜ~¬“ ‡d©Ýòå¥wJ×·NO0öŠ~à;÷"ñ¸»xê|EWÅèèl|,u[ór_$à¹œ®«Š(Tæ«)Ò
©ª1¶ó„m•A£õ„?~dvs´A¿ùk×zßívÕö×X¾‘'=yÒå£ÑáçÔOLAÐÌëª
C7cªÊý¯T£`Ò-vT(3¯xÐñe1¯fo6ó¿j¦zü=’‚ AA±‘©ýS|4°=æJÉœóÙ `‘‹ËŸxEýb•iGÛð)–ÈOÒÆšíNèÂjÏ¬ +S¡Ä1üB_ÓÀõÜišL.3>MÈ/[˜ã¸¨8b1{t©QF¥Óå6n”¥ý>šÝäùœðùã|Ì‹\Ü×2E‰\¡Sè`Ä;Õ(j¿¯[Xª:-ª›*,ïeLàcë¹”DÎCàÄ&öÜjÿÅÛ[³	`\?t×¬—Ð4@lØ*p¦µÞ+—Hs]‘ŒY*ê!€>¦DžÛpzÛY³ÖØŸ»{±ŠõÅ›~ÓhHGd/HëÎÑÅ:öðÀj¿Æð¿8™RXšuÈáòñµg‘ãZòÃFƒÃ6§ö8r0­€Òxl/bb©×L†smÃ=Ï9w§«˜g©NnòIõ<p™j–)dÚX)2L`Òè=Ãx‚UÔy5ÿÊ<,³®Cß¸‘Æ7¦±êsŠò”˜.€±	ÿ=¥¶ý´:-‰.ƒE$«3ÓJ¤iÚ*½¾¤n² äÃ8Ù´CàdMÌŽ›üxbxÝÌ‚Á!8L¼Ùs–X_M»_³Z=]Ì‚Æ§_ƒ[Kò	JÈ5#CEN.óä'ˆÌ
ÌÞŠkènô?TDP+åÉzÆÎà§ûGÚÑþw”§Fk´§R:µ‡ÞÕþ=ïjåÔ\»~wéòlŒ0ÀvPõ“ÊéëbÐJÓwo”H3ƒ…í]G€D2ŒÍŸ,“ÍðÑ×8²ó¥Žð³uçÐ;D®:ÞTÁWò-ËþÒî|A.BPê×÷pƒ˜[à—“úþ|ä3»›ƒº[ë¿ÿó¿¬¬Pÿc7s}^>ld ·®SM1#Šô¢p1óñ.ýú—:aò¦]¦¯&Í1®{ª8ÆÅÒë{=/óbfÔ%«+FbÑÛÊÞ®¡-vµ$¾õ;Ör:üÊÈÎÜÆ—ð³½rð‹=FÃÝ¡ãî=vI`g‹m(;QY¤x¯Üš˜š@2ãÝËNo}3Í¨wÔ*o+Åg˜ì´ˆÓP˜UÄ^~²{5,â¼Ãé–îœš”
YdéPŒ%êöNIŒ×ÄP0ÐúõÖÅˆUÊÇ‚Ñ ƒlÕcG²ê6ª‘u 0PÛ5Â¯Œ}kköÝ8pÁNý³ä¢{Â3áÚ\]½^ÏEÁŒã[9¸a§²ãŸm×ÃX„¡ç£‡/¨é@îVÂ¸þN	ëþï±Q'Ê­¿ÁN±I7êÙÅ…CiWÿê83Ø(Ð—ºS"¸ACT—å	~øýcHì%‹ˆMæ¹yBXÎíÂ/'·ÀW­ŸNrÛj¾ZVâZyïŽ¤¬VôŸÔÝƒ²BØ¬DÇRNQ±º"eˆk±ÒØ\^[›«i4¬+ãjÄUZ¥t]š/Mœ.°ÕbŸc`ÌÞ…èƒ¦52µ0Çç±! W}3kŸÔ¯ŽK-½"PU3Wcäj,±„ãüts^:2Ñ×D)æÖGÊÕ.ÐŠ°]õºŽ ¾¡z¬ß\_Û\£¨»9‚z_«À¨ãý-ƒÜÞ¬CæçE¢4ù’®¿µÁÂ¨M×fá/ž)»J¡uwo¹_ÚrÓÓk–Õ¼lž-¼øEäÒ?Lÿ^Bì¿ä2Û±‹ž%çIärÆÿ®[¹o zåƒþ9xík1,TÕˆð¸½f0<íC˜Ýx) ´sÛŒ§åô»!! ^µiêõl*lÞ4^¥^±Éæ”µ~Ùé#@õºÛJjE×–SÃ.Ù³®÷)ë@ööVº^±¢øóÐÞX—î8žîZ¿¿iä¬on¬þõöŸ?Z··æâƒºÃ§æÚªçÌ¥ÐDR_ÌR@Á™KÃHó!7ü¤¬êüÍÖx­†/Óìõ%Í^eSu›v®2S]JA;Í|FÜý¥
øM A/Å
ï£…Îm/g“ÏwpìªiÅq[9xŽžäqE©ÛX5¦ìÄ¶ëÕf=
´Ç–$M^¦Î8ñœ12!û,›Çß‹Þ+ºëèŸüþÃme¨{­ïêHlsü˜4"ÿqíxˆ<·óÅø}5Yi])“¿–ƒÅ¬¨N]J°7@ŸóÓD¾‰^€NÓWÔ™(5 ë{•«J@b Oî ‰xj³Ã_;w6z]Kv¤Ä¼BSŒ]&àƒ+‰í¹]ô)Ñ§6’1?Ö?ÓöWÛÙ<·‹l~Ž[%	ÿ”\º iùžg‘‹ÚˆAXCjÏm¹›Ž]€cM ÂÌªÐ¬Ê“•¥îy[ˆ4ÑšE†)KSÌÒÚ.á™ñÛ”¯|Yc au¬Î]˜ˆ°0kÒJóùh7¡hG|!"M¢·Ž™ÌärÊ€¿uà?Þd—››ÅßŠM¯kÖÀôØ)öÃ9ˆÝeðGlcT¦’¿`ûmdÓ.;ï77È/+•`DŠ$|¬ËÚˆdýÉ†l]ÇÙ/@&ðC ™M€x§œÍ’ÙßF ¾á7ÐœØ¦»H?‚«Õú‡Î®ñœO£`®Ï¥M6â9vsxãEÛ¯±-f—`u"£©3®pU?))²ðVaÏÕÅëÕ!õå	~ô}×/KXÖÊeç	 è'JU‰RøKrªtù`¼B}êSÈí*µ½Þ¯#ï=íqB;|dêàMeðr-ÔÀßõ¸M5I7MæÚù’3OÒ¬Öó¬àLL5iE}‡˜1ì'ÏÞÞ<98µ¿ÞkÓ¯1£¯¥¶þÍViý›á±5_`*½ÓJjXIæÊ›ü·ä«&6.mC9¢J©ÆìPÊ¥´ô•+*žÔ­hŒ«z²ršÄIJø–­Œ¥û>‡þ¢X¢·ú4Ô*qlÄ 'œó²Žìpl,éÈÛÒ¡J#†L‰FEaIsû…S =—eGÇQœ<{óüù»7ƒ*X~ tüöð±ª&‘rjÐ7•’—¼[Ê¸]IoÒ!bšsW_XW	ŒqÀW²i‹ÁPÙ4år89L#Ìsp“HÙÛ»ÀÃNýÜ}1Å`äÖk÷"‰ágó¢i'öÃý5kØ=wÍ*¦]Y%FˆÑR-Ô<,lk@AOT¦Nª_º¾S[W\2¼Jÿ50+$š«"råÌÏ¿ÆàU^X·ë'ì÷Ô;-æQø<	+·ÁQäNÎ˜rVÐG"Ijm]Ù}HÆÇU¨÷ýÙ°²’
Y¯Ü(®|¹ì–w0D•@Í‹dŽ½]ë5ŠÏïP|6@7ÑSÕ¹~ ÌNÇ	“ât·W^?{óÎzw:x=¨£$ñ'?¶£é¹´¯lÞ4‡’ò@òÕ0¹ »0®8	C€ì¿¸Îe»5Ã2W«P/t»¼tÀwÝÅÂ	ÿŠ*pkÏêmô·VMWuÓ†ê<ò•mëÍG¡2¸(äå$ä(ÔÔÂ`ÍÚÌÈJ1~i½ˆïoFÙÒ±£ÙòK>+ö±â?‘ŠÃQ	~}¼A‰órœcŽÅ¼ÑË×®vúÙŸ;¹õeÚ·Ê)+“ÜÙ(ykƒXKKI¨4='uPkÆ’Ö;‡}<‡@™Cà££ËrDíÿ¶GGváÈ¾ÆåN£´‚_õD¾9ª"sÓ~€C™š‡8—›»EÃÓ—u8…õæÛÁ\æ`¦«÷UÊÔXó\*³¾÷3¹”¥¶éÁÜÚµx¤–	Ãhë/ëX~¢ÁÍùà¾ÎeNg~ÿ‡4ï¤VzRu+pï6wâ¸nï*?_ÖYE×Í3nˆÿvP—9¨Ê
~Õ§TS¸®ô€f~ï§³i \Ó£¹³k„N„õï¾¬cðQ};’ËÉtõ¾êã`Ò¥ÕTæ~ï2=-&u>Â#éOB{Î*OÚ«}‚YÍNiW¿å	°Ô.þ7öv©#š-ßW}Fr=çú©{:Õi?ÀñTNÎCœÏÇ»,}£5@¹³ýöäõv0)‰ãÙ7ÁsÙ“)­ßW}4‡Î<§¶Â67ï{?›Ò©CóGóÉ®õòåéÉ—ug³8øv—9ˆ´r_õ,d’)=€é|ï_+‹§â¬‘î„ŸíZa)MÏ^oc×ú%	JJ6CÓ¿©.–Æôí .¥‚ek÷UAÔé¼BèŒk«]³Yß¿¶•%µ­UnXµÜÈÛ ¶©ÑbdYM¥Üž¬ ÆÄ7lã‚ìïìu<8à,Ÿ½9Þ<¼©áïv¿ˆkj/ÆžscL‚&(`%ßîôø+Œêq/9U¦XzÀ2E·ñ&.á5Á±¹ð|5µËeg“ü.ñ¿êF×Š®c‹­1Aö=R·bþú/ucêxo²òoÄy§öÒÓ—rÅ×sV,{4r‚x¥û)ò+RÞ}v†x/Jc_íµÍkü®LÉ p_:×TL§­”B™äJ¡P¡3;pÏfÎuk•ˆ¬É¾¤ý¼v¢¯.z¢|‹…Âù÷”n4“{çn¾ØtWÔ«vïgÃSì8Ádòƒ“÷‰Ø–£d¯ü‰Ÿ˜ël§×Ý¶;ÛjQ	N)ÿv§mÖf²V¯›ëðk—n·ÈÔ@Hs¼¤)Kh~£Ê/¿x›bqÕrw–…;ƒ5Ôþê‡3bFr
l½öEP‡S’Ù›ðÖr:	}$š¼ÞiO…×´swyðÄ¾JaˆƒöCûsJ€ðïÊŽ<?r¤8¿¡fæàë¤ÈNËñ]E(9-DeW>P7í[”~¼¡HŸb‘
yÆ£
¿T…Då1ã™êœ?„p0ìˆWð’ãSlRˆ3âAÁ)Êã*Š3QâËQ”’3Kz}Xšuˆ%kè7¹†Ã]Y/_’.ÔlGù‚—2V¤ú‘Qkö”§•#F†Dÿû?ÿ«Þ‹Y(giëFŒY¸­àÈò…\ˆ4À€^/ôe@\…÷ü…„nª‘áùšE¥²dmšú®L¬]«Ò¼0c|Lftýœ•ÚÏí—æí¬.—ø@½SüF·ªÿ?   ÿÿì]ërÛF–þ?OÑÖx†dEu³’¡%eiÉ;±•¤Ôl­'eƒ$D"	.–«övîÓÍ“ì9}@h€`œËt•-ú†îÓçúmÌjÕLÉ.™YþŸkŠD•×õ>iƒ_(mEz({­ _I_”…3RÜ_Žd”»_Ù(?š*¤£F‹ªjA(<?3ë‚¹m
=b«£îü‡îll¿&ät•»TÐÊ…i;ß\ò6ø·ü½‘7"ßœúÚÆ›ÂU™{(wm;o8ë:˜y½è÷ÇÝþþ½ó•÷k®¡ß3•öÂÌÚAc_ù¢Ùþ+Ýþòü#X0÷Ì)M,¤êkhIç!ù¼=Î.±eO%úÃ¿_îþ/¾ÖŸ¿–Y~"ÊæÒœY¿ÿcÓ9lhO,i8¯ÌÀ2&ìjÉs¼fxðú‡ß¼<¿¹þýq…uw^.Ã=[¬O¹ËLÆUZØ¡ëÐß%Ö'!)*3Ò¯ˆt'Y+Eq¬÷
a¢rŠfz?·œ^ÔmmHÊêPö£!=²ÂQþAÕÕÏÉÍf£‹EýS´nÌq²Ä
Á…‚y‰o—–WáîíÛ7îß…÷´¤„(rÊWì‰ÆWQüÀüd5|ëÎ ›éõh¶ìZú×¿²4óÔtðæ©8õE7Ñx´y:>aŸ®äª*õ:Cf“\nØ­ïkO¼“úXd‘UØP…ýa£™ŸÛh7T–ÚÙG‰:c}KÃb\˜G0CÉÐr
Ïú`tWö½ùÈÓ¾ÃÔ™AáÛbÀFœ…srFöÔö¹”þØ^n‚\rÐ”W‘Ø\Â–1¦Ë©åÒ92äŒ¢x‰Ã S®ŒŽæÌTÉE+D…#èT`DeFÄ©g,MõLUÚEã;sŽ=µçÎõñXŽ'MÍ¿VgúêûõÄ³ù}z…Fi:Ÿ²«ŽÖ„ÒºI_ö¹¿NåÙ1q€¡9Î(C6zÅÜÛ ØaãÆ7ƒ45Ì¾Æ×¦˜ª-2[ÚUþ£¦Øblßâ„Æ…ìŠ¶a’fL^Er-vDN'//³TŽ|ß½ÏÃÎ&v×o­ÅØtlrg‘˜)˜‹¢‰.2ÖÌþ*ŸR˜¾–'J’ÿÀ­†=MÍ07ö#†­´h«³¥sMãæÈQ°TèÕôýÍ8†x¾^^M{6z7D]}Ì»&) LÉS:ÉH$ßõîû‹Þ~@ lá>ïE¾çX	Þ-ÿþ%÷*éCãßERMt0?‹k¯•§0óI*ÛÉ¯ÝÆüfæÂ3B÷-:(¢DRd·×&ž(½M/Œ„l‹ýK²©kåJ©Há~œo€¥l	Ö›B†Ó[´™cüxÐFã’ÅVÉµÆ]Ô[CôV55×ó}…%]÷`Œá?h„9%<ÔÆE—ŸNg—t>Œsy§ëî*
FíH÷jö,éÝ„»³º €Mº^šæQ0ìàEäÜÁ^Îý2qc{iM_‡vrîw–à{ÊÕi`ÆÔDˆlÜû°˜ºkW†ådÕùùÇk%UVAÁãÏž¦ö5és"ªžöÎ·ÑÂ‹`uHÑ×”pJ_1a%­y³ÞÑ”›Õå?<sf‘	ìŸ­!='ÓŸÙË!9Ø[,ž“j7ÚªBS¹®ØÉtk.lçæƒùÁ^
à\nÖ·oŸŠÍ=·0?ÃìÇÏ	=«‡äÏ‡‡‡môÄ;'Î>çØ_Ú¨™¥^	·Ä	Ëò*>=o½Åé.	çq“P±÷@×±§äÏ{{{Ï1ãæ»’gÞÃ¦ÂÑºÙjƒãp£ýx¢Ÿ´°Šø°;Ýáë`67ÿ¸Þ i`ÜB0ñm/Ü|OŠ‡!~‰ë”Öv{ðRëÓéT›vÄ‰Æï–D#
ÿ±æ±‹Ey:MÐº[³6ý}´ÎKõœ™ÎH…üêWRêY>L˜òg’\/ñé-‹ö¢\úÖ'TÐ–vTº§çÛåÅ«ŽþÜè«Àâ'Ú`î8ÿ„GìªËÑåË«×oþëåõûÎè¨ócÍuÅ*ÃE|3duyÊå‡…³†îi'ò—CÌ—¸0ƒþÂžønàÞ†ðúC÷öÖžXüO‡?q¯ñÄ½‹ž¼ôþÓÎ<½á`poÜ®?Ü\®^ž÷±G{º»±!—u² !†Læ¦X!Œ!¼íU»í˜AKX«ÆŒUsf*Í>=]á_ƒõkñq4k`¬··÷]ß†åB³J‰çú°UíPb¼ŒgG“†¬—’Ùù¶éd˜-¦F¤½Þß÷Â÷õ¬Yû¿#T“õŠÚÓé›Ž=ƒé]¯I»y fœOC~§L4ÙL"¬;_Í8Î|¬{Â3R<vÜ1Ðà%Z/àc÷}çŸÑ­u{+_¢Ò?îÂÊA­lÓóà4¡q°©\×æ/Xë‘ï@ã?\½5&¾e†K ß»Ø¯†•Â¦¼ƒZž…VýÒ±ð[·£ë )X£1÷­[¨ºÜèñ©ˆ‡RßH}?¤$eX>žcN¬îàŸÁƒjM:½5r_µßn<z\R¼3k9=ŸÛÎ´‹½i6ä"ê2Ù®øÖø±F]Qp‡YÃ¦t±„7Œ£Û·†ŠòÃrÍ1˜rº%†¯(k¯\4Ò™ñŒhàAãb7Kò@¤*ÃT½´Œ™'¶ð¼-ú»ü²bmzËïê2rìùY;]Ã­žÎ©åXaìúÑeVœžjy›Ù¤Ž<ü˜xÙagC©óÓ R;23#w£ØÄz©—\OÊšç$ë¬m…*Ö+|@” 6\½ëí€Hv29-ãàÄŒ´DN;öÀA5zÎkæÙ“É`w€	ì$CÇ!,‘Òz1îVÃeä-'ÂR$ï¹³–[³›ÂÅ¦:ùxQíGÒÎÆ„‚;gÂÇ³ãH	&MGŠ;ôéYÒVáÚ"ZN@F™Ú ',íòöËF~](î.« ø¼êhì¢HwQ0®ž's¦	I"¡s8·HDñ[0÷Â¬‘¦4çØu/Ae¬7æ8O‚œ3)¯§CúÙwïñs©·Í–^#Ý©v2=…«ØðSBF±4™©”Åxc)`5aãÃ¾;N‡7çrEêcAT¢sf!h™ªH­—²:Q³bï–!´<«¤aXÊGªuèÀt\Úp(“ÑÍ%°PatGŒh0OSbrÌQÍú`&_àÃtöˆºð
í ŽcŠ”6zCÆ–4–|~ßò)"øù%™Â…›K£B_§C¤ŠD\Ñ5ŒpÔbé»N&ŽùèF!¬¾)¡¾TA-|·dÏßû¦W?0M¬lµfú@æÿÏ#\T=Z^ûIbå}ÆçäØ<};ÒÊ¬“Ô[”¼‡ú5Œ¼‹ºOÐ‡ªÈ.'2Çšw?Qó°ˆèøtå‰¶ÙV‚ö¹÷	;r¸…hñ”µÔˆEƒm±ÞüM¾úÌoòÕoïM¾:"ÝW®c»½vùþJÚó‚Ö…I‡ÛAÍù ¹ UÔ(u>=Q3T{Ûl²
¹”lq[WwNí õÅÓÓ2p.è©õ€už	TÚ”,žœÿOHu‡…Ít7ëÿ-“w;³'Ä†.pŠ £T•÷â› zÄ?Iìï•ã~aÑ[ÙbNaGž¼EžÜO±¤‚é<{IdgÒa÷ß¢÷–Dn yyëûèélµ,öTn¤mvm/¼
YÚ°î.ÈÓaÄYÁX˜×Â*l(QÚYÊòbMc çÖó~ÍõœY»j´d„Ñ-ª®DÁÞRËÈßb	$zË_;=e
†–îœn*
¸>}¢Ž‹V•–Ék"ÞfÎñ¯6%­GÅ¤µ-"Z€¬¯,¤•Ðåœ,¿Ö©`qU ‹Å
×·†7j:ÄV‡¼µƒ¸·ä¢r_ZîÞ™™º0	ëqPœmfsÍÏ3Ió#ô1eÒ^íÀ*ÝŽÒa}#Lð³Ë7oß¼}GÞ!øåË·è'_»™èÿžm¬ì BB$þš0\ÂD`]L‹^ËÎÆò“tdÿZ®†Ã«P’—Ëü:Ú°ÕŒFWÓ¨~Rt{48¥DcM7"fŽµMN³
Tþêª-€¾FþR×ý]WHÝÐ7×+ø˜ôÈè$é×—‘+¶e±Tù Éq<­çê%ÞTmŠê,ùL’XÛ©Ýà0+/'rovŸ)a}ƒ³†ÄŒEß¬¿ÎôU!têCÒH³³Îò}×¯gBKì’i‚ˆö¤PÌ/™a—n‚CiÉW0)vÊœucù?TG¾µÓ1çÈ+×·ea´!wyQ¹)J=”ÏÌÅñ§j-7Hì–@Ø¬@UL^¶ýûþ>ÚEà¿’Û1Å›3ü+7g67Ö|úª¦m¦AÐ×Â„Ó÷žæ^ ÆeªCäv²ù	³É^Øs®8ÌËÅ&_Ù(‹YU˜¥%Ã«zhÍ1Úaá—`—8¦‘;Ç¾#;i=Å‰„…&rL›xÖò1
hçcKËØòÇðP@Fo4,Ê/¦¡ê!¯|«¬¡ÞMšz hÇBøË¨Ïªð©ùn…Å¢P}^§ùƒÂøYî?ÐnÆ„Ï©EË¨†»9”®rõF üÔU ÊÉžÇ#ŠáIl1•VŠsî;oh=%FeskTûý=#pV×rhü¸åðî]æ«ßqk/§]o°ƒkè mµkqv“Îõz_AèG`¿­é(ôJxÂòÚrÐh¡s %3°0*®NAìAgcç±bì(–ð§ÞÒzØ,è+Œiî‰Õ"
Æ–>á÷„ˆÑé”sS¬#Sî2‹èZ¢l{pŽ©˜æìôy•/¥{äì”÷hôÈ"$û¤ûwsù“í0ß ¼t —¬¥éõJº¿~^¬öÓ°Øx¬Kµ	ÐP#‚”ëÖ’ÆADê Ì,„óÆ$#ö–B -ÔA%¨‚“>õ3§=tÞ_‡‘–‘ðhð`%‡áêK³ÿ¯ÿþ_BÑå z¾€öM?zO©SÐõ«¥Ü„	NÚ´ãÜãÞ5^©£hÎ¥â#8ŽˆE]x^¹>#­	5ÕT@gKÂyŒ“F€¤_‡fïãúüÚ`ªáf«inå(N°»uŠ±7ýÐíûäÖwiöÅí‡–édYÙ®ðë-bH3“°<ü;Uuïï=Ó±Æ×ÒÏæ`,Ý¥U­ùÎ–fñ›º/pŒS³¥W£Ãk3N’wÜA‹nÃ0:±×•Ï_ÇÖ¬=†Ú„'îÛ&ÔKÎÛž§ª%f ÂìcÏÀ!Œà€ .ñœf§pLm·â6àøVëÞ.‘;DlxÔZ¾PLL×ó­O”}\Aø%ó¼¸,]Ü&)B3 í")Tuû~Hv€`]Ní1œSÈš;ëu¯§‘[®¨Q*äÕâU*ä©¼ëËD¯¢cIS•bÊÿ³0»Îy³EÝxÃÕÐ|³†ô›¨ò^‹ìúOÅ"*ô˜%è:f*²åkCÒàöäì+S€
örâDSK>ç{½LL,–jè·¶ëºrðºcWÜKr´ÞýN¯Öfá„´LTÓþ#Ç)àÒvéž—XŠ¨j{æ¶M x­•4Jºïó‘©
Ç îmÂøôÉþ¯›raùœ[íà·¿Õ¶²Õ‚»Ç¶÷VY¹ÉÄM¿vðëÞa5†4k×E3Ô»­ZÞº ’×‚§0o²&Œà?VÇ–5Ä_Nl8Ðñ%Ò©X‰OZà%ÇGò·Z#‰Î¥°l0¦¬¾†ØÞ¨¯=&PÉbUKÌàº·5™š¾]¹"Ð±aaWÕ.þ¹)¨cšzŽÅÇUuÁp$iÒNÄ²¼é›Ú²“ív5sÃëÍj¶Å‰`/—ÚÐß¹NlªÕSëòb¢AUy•âç9K©oiÄÞD¶ÌÀêchZ¥‘ß·“’»¬ö¿Ù )ÂÌé*†'üøT	}ÔÉpŸ-	Cf™ãÀu"`Lìe`…ýÄMº)žL{ç¬!Ü^“5ßàeiÖ…	Œ"‘ÝWR®:­+÷ŒD…bûÎk­Aa´œÍ¢]Â)©½´.zUj-hðù½yFdl¡^Ï„ËK;4È7&…oQyÔ-bì»÷ŒãÖºÌM…Dúf}kÞ­:º”ìª·¬¶ß­…!\å‰h
½ÙA°öV±÷¬þÄ…&•¡ƒ±½P2®})`X’€ûÔ¤iÖ¼ß¥m®’mSG(‹»»"|ÄÎÙwîÉ œ·Ø›z=ïœ1¦ÏÛ£³sØÔ6úˆX‹qâ–~Ùûì=»‰~Šr»ùtläD>QönÔ~÷/óƒ=ì©{g6ùærû½*íÌ3ØsWÖrb.MrGÇÌtê÷ž¨A@°þZÐy'!E?”Æßž‚HGø‡¦„o¥vP¢1–³K,çÍô¡	 )Ç
	um‚*Ð	¨ØÓép¯úîNõarÑ‹(îÊ	×Â©û#áí÷äþïÕo–¹Ñ:
'à½h¢.J+Öú|ì…ùÍJ\ˆÊ{JS‡¿u¦Ê°»l˜}‘ÖÜJ“$ôv‰zoPÊÂÏdÝäÕ±žw*SÞG:M¬n×œLvÉŒ®PøH¾@×Ø9ôã¡;3DãüîÂÝ%{½ÓÃ'—·MwÇÌ‡áÁÍ÷G2:*ˆÑ±yÙNSñ×©_Læ
^Qä	fm0)ýrÃp¥ß!ëkI&í%~Ü¥6g2Ö¥»|y{k‰h#¬Úð“fÚ„NæÖäî;éê½—º8Ù2oÚ“Z‘JExFæg²,%“ëþÓ[ø‰ÏÙúc:W6Îe Ä€k®[…÷$ÁQãýÑV«5›w5®*œŠ}~ºâÖeœQÁ±Î
ŠÛ]O(a¶0Ýra«HÑþæÉD–aÃ¤©Ú6ŸéÏ9»‚]¡Þ•„)N)j’(:Ç¢ü}ÔÕ=XÓ-Lô„‰`òQÿ‡˜p™@41`”ö4Je¾tì ìOí`‚ŽÄG±­f_õÖcíGcU\UY¥x8úù±ßÎi‘-'4µœ¡ÐÌúl53Bo}2pìöÇU=Ú´œ¢’8åkkk+ÔñÓ**-LÕÆàvVE\×!—‚>.]a:C¾–¯Yì°O•=ø¹ÛGÖ»Œò©È™7²—îÞ.9Üë¡ˆÔyxxèôz<›;ûPPä L¢4û,õ`+«bw¬4€µn)v‡3žqëÍußöÉT£Ð>±âYx·BYj_*øŒÝ‡†¶ªB«§p9ObÀêe+Î\ÁOï+dœ[¦®¢$©»Ö†ÒgUálš@0µX¹3+4ø¥Í2R•	™§]òíÞZ“X„ãøVI;¥oµ),ènŸq{þõ[o»rÅêÚjW¶³iÍMÔwZo§Ï²GTH³£ÏÇ½”r9þálÄážáÖDÁOrétÎâs5s!,+-ðqri›ý-Ä/Bœr
¼á¤ßØß*¿7ŸóJSƒÓ P¾ñ¿Ø_M­uªL\LøÀZ‰¬kõgót“ªòòî9Ö½I¤ˆnÉ½>{Ió•wrGJàÍ¤PD–ØßÛ|¹§ÊŽ´î¾koko`ù×ÿý÷w¼°1ºp;¶¥uÛº~ ÕmÐbuh>)#G±˜È1K‹ÇLóÉß|ª˜Â£e-A#ÁÂžNK‰n˜‚ja:…–v Ã‰á®]¹¼”¨PF¦f\ºw!¥‚HdÞ´E¹Âqö°µ	%?QFè¾uï-ÿÜÄ·	ùîüäuP³’ŸYêmš»¼&ß\j"Çé”6ÉîÐN¿Aøu¾SŸg—Åª¸–·Ë/¡¾J3±¹µ}Æ9Ÿ]£õviÛ[Wb!ÊÎ¶X’2˜¾£Ä@Âø¾¥²É]ÎP1üáé*åœ€ZÚ$tüˆ1Z"m›„sfL‹«<sb†\+ÃC“ò	öLNÚ¡•Î-UÉéæX@á.êµ!yoQÅÈnìN%<gb×’ÝDßFÇ±}bËõäœÌ»ÛŽ"»£’%~Û×®j6››PÚš”‚¸Éæ#ö£Ãƒ¥Œzë]²*øòˆVsÁÅPLìØÓþ›‹æßš˜—zY±'pebp%˜»~ß-Ó—n(~Ý¤lI§U§ßåê£ZJå:·šðÆuJi.û¦ÞpŸ²†¬–&IÉ#²ÖG9Ö)­ÙñTeU1¿©õµ…j[ž€4ðËÑh¾¿bÆã8áGöU‰fÝ¨¬¥4>cßÉ9–žÛþ$UtHUñø0÷1”qO9wîÎàl;œ$a•ß£TbâÛú`þ–4£-®í–5L-Ê¯ÖÐ ²K”†ö®uƒçê>S‡o€IÀøÝ¸DØ
ðBÅ-C^÷Šž•i"$ËŒBû6rHM&VsU‘¥WmpQ˜·eÈù­êæßÚ4utº‹>Ð_Ì
¦(§…Ò"ÉÐ¡Aú¡è£9Ãc«n6—{„Ji¥žÀƒÃ™ádÀ0æ¦ÙXR\=ËNk.ƒ3àQ"“HGc„÷g åY õ±åSìt„¤³žlhE/«´t×É`aÚq[Ò½ñGX²ˆÐû§Á€œûJi®|(Kö]7$Ü7ùO"nÅY8eˆ Âî$Âˆ-Ì¯¾x|3ívð¶NïÉsé)Ê ~øpõrt~óáêûïo>|@Ù~Bûp·w¥– “žÒ&` øÇð-X~÷däy %÷žÿ?   ÿÿ Q;¬Ÿ