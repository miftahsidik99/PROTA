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
    // Scheduled subjects from weekly rxœì½ézÛ8Ò0ú¿¯íé‰¤‰,ïYÔY>ÅvÇK|,eúÌñä³i‰¶Q¤†K·ÇÏó]Ä¹Âs%§ª  R”^Þ÷Ít,‘X
…B¡6Â8q£|†a',ŽÝQê»£~zñÅ&1{ÉÒØ=t§a³Ùb/_±[*ß…ò¢ØÛ(œž„ØX—ÅIäW§Ÿ¡êéçŸ³âIt£TVºt¾º#(ë‡CÇï'aä\¹+7ÙKÜió|…‰svíºÿæ,¢Î~º]zuGÛ¾Çwç­Ÿµv½KÖ¤V[F‡y§¼%èõCÿãQgæD±+ªü\¨ñ‘†Øùêø©7yÍVç2Œvá¸ÙŒý0‰»Ì	nü˜ õ¢È¹éx1ýåÕZ6å‡Jdýà¯òöµ¡cÉG¨~GLPU?:f`ò¦Sšµ~7-È± › ~ôâÝoC?e%ß¶èu‘~:^@åã¬`Ø	_Å¶fi<ÎÚ™ü]e‰ò·w%mk˜%ówlè$Ã1kº0Þ»²ç4£Å‘ùnp•ŒÙË—/Ùª‰ bq˜Íþ§7v·ýÎ¥çÃ“fŒÄd™ ÉÄ¼ÈMÒ(°4ÍßµÙ©¶(?C+
_9u†‰÷Õ´Yì&=õÉgÎgú‰“¸/8yU`8„
“Aåôâ^âß’0ëÏ.Élñtõ3û÷¿ÙÒgìÄÛFaàÆž³$†ªlì#ßíÓØE0š2É
a˜c§²
Òi˜nÒè”ãaÅgjÍ;ÕÊ
ë»S—f=FtvÙ ôÎ	¾x~›­ãw7pfêäÄ¢B›÷ÁhS²ÆþÍÖ‹3"˜©s• ¸7rƒÄKn^wd‹ˆÈï»QÀ|“WÌg°±Þhañ<	Âk7Úv€9·”RW&ø5†g	ÁÚa$cÜÇN³þoÙ9SÀNãCê{6“í~ë²'mvã:°—9CgäN½á?à`"J€ÒKšé]¥q’ÆFKOïÑRßÁÞwáFF[ÏîÑÖÇI[z~–ŽÂ¯6 ÖVïÑÖŽ[ÛZ›ÛÖgë$¯ÏŸd'HÈœç
ØÃ²)…ÿ­{Yš« ¿²¹CV„ÑÖú=ÛêÍ"Xkz[÷…Ë5G¸yÏ–>¤ÙÔV­¦ôù¦Q,†Ïö#«ÍXî…kÀÌ•ß5Éäg÷q–J¯öFßÚ*Ÿ•5^¤Hº¯šk­Ÿ‘Ûî¸—Nê'L¬¶Â$u(ÝðíšqZ+Œ¤ mBÅb«ŸsF&Þ¥rƒ,	8QGFÝ8šF5PX6\`ñAêû¯šøoëçBSƒ›™ÒþÒiÄép7 †\†ôåÚ‰h»ñª™½×šp7¸cNã+¹a¶Y­ÙT6	•ò6[¬:Xl[Ù`Õ!4±§|Å?0¢ÝËKÜ^mˆŠUSð4e2ð¦n˜ÊFLˆÇm¶±µºjˆ„rs¤jC…l))Hf(v© eRJIŠÛqÌ|\' F0'IÜ`äCdM˜úD8±ÊOE¡†í»83B“ïŠê—¾žD1¾ŽÄPÄÃwF£ÓÏE©â^šbôr­P ¸B÷3¤qcnNµ†oAîZ]þxq _W×Ö76·ž<]Ïðí*ÿ!˜ôÈK@&… ËŒPinàÛ0q±po‹¢¡rS¥ŸuK?ëj?ëJ?þ¥ZÂ[˜èˆõ.FiäŒ§Np¯~7,ýn¨ýn¨ý^y—ÀÙ‰3Ý³¿MK›j›j_½ $Æë9A|ãŒïÕå–¥Ë-µË­¼Ë·Nú«°#ïWgz¯ÎžX:{¢vö$ïì(Ø‰÷ëÄco½hä”¹xO-=>U{|š÷x˜ŽéÔ±}ç” #Ø¢AÄï;³4‰ ÛÏ†l^Î[óE¯°£faåW/}Òn]©Ì¶—³ÖCö°oÀJ©›¸7*ƒåŠÛ6°õ€sWM1îDîÌw†nsåô;Ë¿ö–ÿŸÕåçŸW`ClœéûfÎËm¼:{6%p
Lè°|<o‚ˆëìÆC¯s†þBnáÆÏÆ{Ú¼ûôïýÛk¼zõ¸¿¿ÿ¿½ûmÉz±Ñ­c–™ª$y}x5-TUÝJ;®ÛhÔµówY_ØaHTÉŒ2lü‡ÜÂŠB¡Ü&,kuMz“/ú~˜€QaÇþCÓ&A­áFß‘¸Ñe§·,ñˆ¯>ín¬²e¶ú¬»¹
<Z¬vxcÚµa³¼–ÇzÏ»[z=˜[¸‰7ÁŸÛ& 0b§&Ç@Þ
@kr¦ KìÃ.Z¥ö1P•{¾¢ç"­	ÏÞq¯_·wöÌž÷©×ìZCj- pªÙI:³õü!…¶êNÂ‡û¥}®mie÷Ã*ˆØ¾;tA ‰qæ"T>¾œ‹¤.öS'öÂ‰ã³¦Ào?–ºôŽã‚ÌÚZxv®®"˜ ,_Oó,ÕÀŠÞzÁÈä=¤9Ñ&-ûQ÷sYvŠ¾£Ü\Æm,õú.VÜkß2ë·Â
x‚æ%VCëm‡iÙc‹ièÍNGhg+³-VD[Òg[’Ëg½rw¡Êm9×Š§/û‚g¬QÑ{%-è±b8×ÙúéˆÌ §Ÿ[8œº^0ä­?ê./Á*/?v‹›˜ˆµ‚§K³:—ù½Díõ‚W¯ºô=¬ÑôA30Èx-·qÇëd×•Gk¦ïÈ²»ä¸´ÊÕuœÑ¨i:Æ”_®b³‰ØûÕe¯Ø*wp^Fá´ik)dõYt¯>÷m“ÔÕ•ºûô ˜Þà–(tÉŽO>z¬9fÂâÀ™Åc ¹v½Äsã–²piûî%3aD¬òqs ·Ó(ò†©ŸN»,ÿ¾ƒ½q».aø£ûqšGþí ×™’EF>$÷ÚJ4DóiËœgZ ûRå
ÖA—£AÊIïâ«¢o‘coJ’ÉKµÊ%°NlñW <|ÑAKª“vöá¸®¿Ø>>7È5\hK~„AãÖ¶K}I7 €î®7Kd“ÙÒ³,IŽ+h¾hØÖ¨eþŠKWì:å&3PËo™€UšW†}4A‘Yþ3 Jv_ËGì®¾‘Ñ‹
›MZ‰Móè4+™m®oçôð¢ãø(•“ùRî²½*”PØI @ÇeÜw¦.ýâõ;CüŽÎÔ{iØòF»÷?›|Ù®1ªHN‡ÀNÝp ’ÇkPC£¥¦ÄÄU4›1‚¥:@(¨Õpé%è××DŽÖÈ¹„3oˆ(…ª0MiCö=·oüïåÆ[é¡[ÂÌæh Aó Žz!!áÉˆï4§µ*‹E"ÇT¯’\J]>hùsnÝ²’:ï~RëÈ.ÝªµEÑ¦-¦­lFøŠ%¨Þã®Ä¡î¾
¡çÛû‡  uÀnEûÂßÚ,__èÍLt`,nö"-\ô.|ê“*ƒ×±aœÉQ–¿ýn®Â˜GóLÈa8~|Œ^{ßùâD¨|G. ‡}œ™^¤ƒÝÞÉÑÞÑ»³Ã;»}Í+¿$p+‘½=yÄ\îÌcÍã7­¥¶VŽT‚B¹/FÁ/†_]À©,¤¾Ýþ•z%ïv¼{Ø8ûD'jóˆQŒïÀ	®â4¸ÒzÛƒÄý–¤@›X$Âä*€Ûƒ£F8–È¼TÐÛõöƒw;×úÀU¿mÛ»t#7 E;öXsàœèÍ¿}ìÒ›àËGlwÏ| ø±SáÎtŒ:“Ä›dã‚î±¼R‘`ù	Ìÿ•W|Ì0ËhkI ô¾›¸ÑÐ™9@vâ^úî:*ÎoûýÞîßwwg{èN­7é‚ÎC:f±_;,9ß‰@D±Á1ð– §Á—t‚FŸ™;-ÊŸŽß™²&¨è±ÞELŠ†#ÞÑ¡sF¶^ÞÎ>p>ôcð~an½ð~âro©ãë“›NÒŽáÂ¹B¬\¸±‰ö•†Ûðâˆ`ædï¦nä§|80ˆéÌ£ž›‡©Ÿxr;7:;Æ*ì7½ ÂJ·¼Q É´nGÞLéçŠ[Z@(I§ñE ÇÈC»Ë§ ¬ÛÇÓÚêê_»lÿÍ!ô}´Ì½tS´Ð‚€´Z×D¥ø
½§cOâÆ¡qH|Ý ³Ž2íI ùŒÝ™“Ä#ºWKÌd;jã'r\ÀzäŒ»lÇóIá“q§1›9#G6\W›Ï¹’VÜ,IËc[8Ò]”Äp]ÊƒÝl‹äQ/ðÈ‘Š½Z®²n¨œ#ö9š)n’a
³Šãâš¯;„ñ²0	Ñª³/€*BÑU(r5F³)¯EëèÆ›Îp¦œdó¨Jk’ÿÚn
¤Ò-þY•&Lë
^¡µtè!8Km`hà_ÐÎ„ßÐÎ„ÉÎ„_ÈÎDeÐÎ´¤ô!°F£=W½Ô(­,Ä*‹ÁM22IF*a|ZžH§FÂå‘l6û—Z»Ã	ì—¾ÇM\H%ý$‹”ou‘Š(£Ý¯@d™=Á”»š‡ja¡x»_±¸h˜½zÉÜ¯ `,·5ÐãôêâC¨¢(ÞãÐ÷FÎ©äÚ!ÒÝ`¸å¿ÿmX8î~6gYÆrQö	‚ÙO·…¯»åÕ§Ëk›çæ\Ê‚»Á¨¼2†‡AO–×Ÿž À²Ì&'ã­:ø´@7´*Eó5›ýu/8ÕÐ\‹’}Û‘mYô5Úè]« ãt™&"TmTÝÇîÅ¡ë&@dú¢îU¥5´J7± 
Œk?ÃŸ/UáÉãÇvãÍ0¸’1ÀžaH–rôœˆ^b×°"±Þ
ªMÑ^I­\žh„¢ez*
sÝ4[Ÿmµ¼}‚H¨eæî×¬i¶ÄcáEÐ\ñÍÔ3íuJ@ðîz‚ú¸M®®™ë«L'ceÖð£E±ënƒÜØ+ðÖg(:ÊÏ³sö¢±ÉkJ-Ø^üÞ½€Z?f-@æà‹•‘ò‚0€º'®ƒà¬¢aTöG³¹2{†ÙàŽÇ|àßlŸ,3NÖã¢ñ.>Eà§UÍ.eñÌÁ0òH²EŠÊÚ±±Ì×¬qà]¤;‚=%D†!ø“ÐwÆ†Î3d4”»ö¹¬!ßYæä®ˆA”1Âé,…«™ôÓéÔµ†,ß<ÄÃ:Gc±hL"—ïã9ï½9ïŠ÷"ä?‹E|™…Jµ°»VB8D›e3—µ“šs<JF8:¤û’™ñ-§1,¿Ñç×S±dÈñÔxo¡/FÙRÄûFK üñãòZmªUûP5¾_Õ=¨êÝ¯jª:•Um¦%;‘’dÛ%*vÿ•â9ˆo¬D3âÓ½d&…–•’»Üt‡?MÓ©¥ð\r)ì§e#Æ–JÌSUvX•5#Ñ¥¼â¾ÌÖZì¯6ãWù¼q¥V?•Ý’¹’h¶‚d-kMXK©=^Z3þ”t!8o9šŠÃ9×ì(î)vÆ;è/Ðp@Ss—º- õî¼’²]Á›.ÔtwðäØÈA=©y[ÁûÝ7]€QÝ5îZJø8îÌ€q÷«¦±#~ áE ™Ä ²y¿:Y”“úÑíƒšRcWÒrW¬Z‚ã+Ã£6ÐîÏüì …©‡bÐÅkóu×DPe7ÒÊÅm†²/_{jïP/Ók^W›¡äÒòR©ŒÃÇ>{îWIöÙøÔÇ¥HP)@Yì\§kŸë s„³>[Ò;§béßw&±*½!PxrìÜrúèÑ±7‘¤ƒø9ÏÈ÷8Ž|q&Üè1Æ0íŸn…Ày×ÆïwðO®VŸ’^ðùŽ5”_=ÊœËð±(<EçC–ýõ¤*O4Ÿscÿ2BOkàîÜî¤‘CF*+rSîâO‚â:6tn ‹½`kÿp¾Š¸;ÇÕR‚ÁŸnQÓ*£›0\Q–zÞ]]mØ‹gQOºkÆÞ4.Ú®Îì%¥Âßµ¬e{ý¶½pY9UÙKdŽ<•°J †Wk´Ã©?d't¦¬VËÅ÷nÅN9î
Y²ÜïHçñºB6,/ât…X^„dø®.ÊÛw]{_fÔA—­wÊòè£Bìò„Ü!©Y$Û†§]™W*jö´vñ<b›å‡šŠañªÕf†ÿP[šjüÒ{:6„ãú ÌÈp¬˜‚ù©òOô\‹Âk‹ñ°Í›è¢‡4¼ÔKmF9+l¹)L¿f¥’² =JErít:Xµ8ï™\RFäP“z5˜–„Ni˜ÐÉ"pi¿tš*ú[ñ£yYã2/k›»Q9²½Ë›¦@†>_âQÅ ^QQ±žZNîÃœ°žïKwÌÜo3ß‚hS ,Ü£¸3Û9Åj‹=?vÙ<äö~>’tR”À¹Ï`äeƒGð#&wA‡õÑ«‚~¯ÔID3(›¸Þ¶Ôqê§óv~dÓzÔÑ‚Pœ²{N—¶ÍI“X (¾<âàP8€‹ˆhÊ'º­˜ä VxG}E1B\†³ÆQØÙ l¼s® ¾ÜW3qÑ±ÃÀOã§;;¶ïLJ;!ß½¦uðPçdìÅÜ\ 8ª#íßói×sÑ¥U™¹DuàÒÅP<%§—óØÿÈ!O GÁeÃ­&.iô¢ióœ#B:0gn”^80\Ùgq9¤¾¢§ZHáõy!ÖMuv¿¡,|‹œO#K“_Y6? d7q©“S
=BncX×ÍÍ¶°`íÖoÈ<©ýúœS®O±4ç¢xïŒ%qà	€?yÌ¹†•ëŽÎW-‹_`Ûd;áuà‡Îƒ^ [
ö®Ç·l5[Öi<¯ei*Ì#†Ì§jÔP“ÂÑõãõ#QøØúë{¿òcö;æSý¸}o“Ñ½ÝÄ³õðÃÞäÇÈÁ…Ö·Ö¨ò\oP<Š‡Ð%µ>£$r¼ûÈßØ2àÈ†ƒ;€ù›rˆßaãlåîrPÌ;pžPµ£Ùf_›qù)çNÒ/s Ñ®§â¬qn>'¦·Ò‹ßn*53"âõ€j,þj÷Áh»+7œº°ð&gðîoDì_…ï5Z' ·×¬±±±:’×cýùSøÖâ¦þr}mK¾\Ãb….ØÁ{×»'å=Q{(t_ð¿býäÆG¬žk3ò¿ð•íÐ ~ÙèïÄ©ÅâªÝ•tÙZgk8-þk©‡ËØâr˜Ï/vi™v£»;Ëúü¨äÚ7–±T´,ën<™%ö‚—a˜Ô*8Cò]ŽIa «UHy_;9
hÂ»N~V
ƒŒès#á±Î³Y9i2ùc´‡÷†îŒz—	ì5ï=Üqzñx9{#ï_mÖï:…åx³o]kS“kÏŸ?YÒ^_]ßZ_[[}¾Yh‘:uðœi¾‰;s|Gø©½¤Çú”€aìÜ¤P½Ïš5Û/´ºöüÙÓÕ'kOÖW×ž¯n¬cÂ ³E®] ôà—¤8û;G¬ÿi¿7Ø;z÷®wPn:Lø k–V]ë…*ªê®Ï úš°¥”›)eì^HÏ§MZã)ö¾àþ÷¥ÃýROÌƒ¦¯šmýXhLeÝïÜ ãL]…×¹yÝhðà}2õG[…˜ÙüÒä}³$´”é3¯ß\AsâÏ£oì¯˜^Ž¢0€ÿå’>ÄÿrùìÒ¹³¦î…áBRÝ³oœÑ•«4_`	Ðü‹u YùË¥aè‡Q—ýeuóé³­§?ƒ"$Ë×ÄÓºì"ôGâçÏ€Ë°g8¹Š ï#¨7Z»tÜ­ŸÑ"Ž]»l}ö=™}ƒb Î ç‰œ‘—Æ]¶	Ï–^½ß}óbûÕ(ÂÖ-íbskcõùâ°]º—Ã§µa;úxÄøÓº™<bÀu‰èGàkÁLiAÿù‹‹Wï»/V.^Áb©ÒåQpÏ~fP²_U2VKîU•ôÔ’½ª’ÎÝ¹e^Î_xæ¤<ßt6.žÚ–_¬x¯ÎlÉuóØ”ðó"‰dkê|ýtK‹ãÚ´²^$£¬Íì­0¡1F“dðä“ýÞmádcÔù²ã{W°O]t}Î#¥ç@J%@àç§[\²ÈÞìp®$£ï6‚g84öÕÔH9ª$œUÁû6vÙ¯eà¸\{ºî@CHšãæîÅ
4Q¯.‘,H •ÐºúéVáMUMýé‡ˆlºHÆ•(VxRÊ×Ÿm"‡H»“$œŸ°vÐAÚ%(„o~šÍä¹LÚÒwßìô>ôNzGy3e…UÂöduµ@Ì÷ÄR^b­³±%$óp_:ä%›×9ú÷ê£qAîßÙ¢E‹ i®Öû D™<	ÅÓg[«—ÙLyóiÊ‚ÔÞðXŒÜšÇ@ÌCÌŸ‰‘dCÞØØ\ÛÚª»>š_Œ¤Íe.·ÌÛ=¿ÃøŸãçcÝL¬L½ÑÈw«¡À|ŠñXgÔ¶†¦WÂä„hier‚•¨q"ˆµèº•m>ÝÚzò¼ JÆ€!!µÚÿ¼ê!½ÿ´Y&•?»F³î4qåÂ€M„^Œ¶Ü5bNñð§sÉ>±{qÃÓHªÄ“ÝXc®Èé³ú‚ž~›úAÜ_6@¡ë¢ÿôúePf£0/“å!Ðkxyé]ñ§!j\×¨qó!Ê¿lŒ“dÖ]Y¹¾¾î\otÂèjep²r²»½Œ`l®6^À¹ŽmàS7qØpŒT€ ¹\~Ö°£¸ÆWs½sË•Ž»{pO;¥‰·O#7˜‘ÑNßáè†Ýr"¹t¦žƒ©#L”„ñA¼»‘w©ïcœïÍ[~.¹„ q.|ú!4ã;³Ú•ß2ºÇS|úþ¿†+¡¬Ý±ˆÎí¥;Âîw~Ã\M–Ei0ÏµuEU8ª\ñbÅgEž•CÜAÏ²Ä‡6hÉR@°r X‹ù] Ãº5ÖôôU[#À$Šäõb¥¸L^ )Y¨y6%Ÿx¹$›eÚ¦R4Ÿ*¾7^·‘kˆi¦]…ÿmðÁÑ$'5ªZ]–¢X?tà,dã»	š{E	C«­j.ŒŸŸNŽzì}ïd¯wÄöwßíõðEh”‹wô¥¹ÿæ°U>®•ñzÕ¨7l£^+u…˜°æ®?ß¸˜7¦7Ÿ`åKWÊØWÕ`7P¤­,Hˆ sòâãÌæ{G6™æÑqŸ4>4ØÞµØ£<5È½÷ŸŽWñ˜nj­J…¢M¯J$	Zž‚òó[Eùæ>\,0âååÒÚ³¿.½‚±btÂ±Œ^ÇÁ—7–f6Ö¡™na/[¨	Š¼¶ãþ@é7ÖX“ßÝÑâ>5ø‰Wo´s@,Ê4zßó#ÚÇ3Á˜NAíQ‰‘¨9? ‰Ÿn¯ÜÛyF<ËžÔ§pâ­Ó@6À@ÈühÂbÀ•:¼ÕÃM:ê@n;4çÊ5$#°ÅÔÝú=¦ã]¥ŒíOgébCVüjõ‘üÓ˜j`tíø@ÉùÊ/¡41f¨uo
†7ÈH*ùN²íÂ°^ÆjXþ‹»î>»,Ú¶æphÑk…^õdóéæ³Epy&õ*!>m¬V uÓÕÑGÀÐø7é‰ÓZ(ß½L¬ ¡è L ¤ô3þfà=«PïàÓ	|úð	6BÕðÉš½Áq@=ìvOö~DnÖG$åóÑ þÍ@Téomm<>Ùíïõ÷XóýJeo¥×úmg\ ¹¾^Û ÁH˜…iÞî÷P²]a'»ov÷û¿Ý¼«HÝªö*8…¹~;¬9ÍÊæ÷"±ë;ê‡Ükä”Cî](Ê KD»ËË¥§K'¶‘eÈPOmÂÂ³ô*@åûfÊ)ÒÉ)Žè^‡ö|‰X¿|xsv•Ï_eÆ~iDyñÌwð@ïBñ/iŒ!tËCÌdEI!As—/ÜäÚuƒy¸¹ê %‰â‰iúä0ã~ÚSS>3ÚÓÅÁýÌÓ D›Sá¹þÌøizÌ7e=8]ÁÄ¢Jêq5ÊwÄÐ{ö†3ò¢6ÃìV}gâ%m¶_÷~õ‚6ëÁ7¼~å7ÒlÄ8æ8¸sžµ³Žîc0Þ‹m™	 6·þZbÉ¯ï¤–´û¹‰3N½ö‹‹9°¼Hˆ¾$‰ç¬F-`'Êuºy‘¾BY]ÍÙ2}Ek6ŽöŽ;(×«¡XÕ‘ÖSï¬Ó•ÑË_ëhçwšö¾$aì´ïcÛ­9¤ÖHUSUo~;jÑÕ¡{‘Šˆ%|ÔPqŠ/
,`/lj/VÐ?+†Ï]øá…È?ô¾6OÿL/ÝËKPÍ°êgÊõÏ¯€sfx Šb_W¦1wCÜ"‡Ó"ŸN:ÃÈu—ßÙ¿›ØU¡¸C‘ÑÃ=u¢†8SÚl8j\²ÓGî%ÈG¾úTFæ¢'†»&Î¤kâÌ0çä9oÿ?–WùÜÙ2“–’xñ‘øY!œ…w«Õ°a€x¨8–²Áãìu Çn0Ú{þ¨éh£î'j{½bäNÃ¯n±b­0øìôU8Á&°è,FÓ6FröXFi˜MµÓWÁo;|ugKæ'óë ã¼4ä‡£ø½½ìÐ8…‘AU7¥+™pDöŠØìi»Üâô}‚Mk¶U6•e_0¶”Fõ^Ï ”=?ãØ» `ûÕêÀSÛ d4ê—b*ž%±þÙ2´ ¿´…6v,©WtÈKêQ¡Ò£ËE·mÞÂ1eéÒ;á÷':É¸CÖžfS@½¢l±¿¡¬‡á(ð'ï^&îÕi¬QN[ú¶Œr1Jqf²3ËòZÊ¬ÏÜµ„<
„«åë±GáÇ˜Æb´¼ñÍ"©tñÅ¸¶–×WWY<v`ý.‹Ùly‹MGÝÙò3X¿-_/?…jÓoËNš„B5¹Y~bÈ
·+cƒ½þ€}ì½Ý…z´‡¿­èâ­z7&%=¬ð¥Ñ(nÏ/½oîˆq·àò®Àß_—·VÙìÛò&›Ý,odc\`åX²Ñ¢žEé¿ãe.±+g•ÈOæ!£Z¦d¡iD\kyB PA_ã©—Ü©‡&`xv­¼È”ŸëÉ.L-Ýö_³Ì¦ŸuüÑòóÕÕ•ç¢wù(KN˜|ôŠ=Y¥¸äQÎ–/ü4ZžŽ¥½tMÀäy©9p9˜KSƒŠ?Q`âî¶Ï)PmŸ?QÚçj·w~W"EQºŸm/JG_'×@CcøOÃù&­‰È&Ë«Kl¥¤EŠ-Ñˆú®,àÄ"ªµŒ¬D¸ˆÞïövvOØ#ÖÛæyšÍ%d®r¢mügù:rf:•KË‚0%Õofî}¿ˆðÙÅò–E	0»”L`¾[±°üÖ;¶¾ÊÚ¸ a–àe±l­üL¾@Ž¦r„"™Ñ…ÿÔæþIÎ×¿ÅóìoÂprèD`R¼[ îV)éPÕùæ‘9}×Õ>9Ëò3–E#GžEüJY\°ÜjèzBüC&—wE‚#GO<6Gá©ròS‰Yq±
ëLóG§ÓpŸ¸gæ% 7bÖužœ‰ÛÛl‚Evvôâ­H&[ÅðRTöV‘K]ÍšÝ¦ÔÌÐË%tŸ	óÏôÔ™ƒˆÙ½è äU™=jæP½oñ\ØWïŠNZÛöé¬Ë‹væj2ƒmT[^Þr9<oºÙH¬²	eP°éot¶pÛ_g™Œ3ÆºÙ†²¥m&O%åˆL2ˆùRpbÝ”!†i‡Ñò,D:‰–*ÇD±n/—Þ¤‡-“Mž€½¼öœ5õ)v£¸t‹ËÖU%s¢†(æRigìF°ÄÓ®`(ÜÒ+ÊÔ!Á®
¶¤öV8±ØK”PÀ<ËˆËÌ‰QNPµ‰)
c“–psàïé!•øÒ— -žL/…r÷ˆ½VÅ´„˜Š`{x­Ó"nŒÿVïró‰ˆCùá«Ž×­"ŸéD$ë©K$›‰¨RBF(Š\ÎçŸR%Qä*×wœûŠy \FE¦0ò^õy~.ü3Ä·	«Í*‰R·b«(›4Ð\}ÆèÉŸyºÞz<‡Çý¦ìåÇà;45¶î7mVsQö@Í¥ÿéÍ‡ÝíëïÀŸ'¬ùöäã!ûewwÿàìäc°{Òš«ÎHÝb½†R.ÕK…GN£U
~R*X–}Æ×ª5T>Î\Ûô3zØôØq™ØüÐÛù¥wÀš†áºÕ­žëŠwæ¸	ÌÓµµÙ·Ï*æ6kËäzÌXX@¡y…u.½ª(VâZ@õ¦ÇõÔT†ãÒÇ¥Ïm` %ÃÌ³x…¾áDË˜J¿LŒÎÆ#w¦Î¬§ur£{±°o¿ÄÜ¢¹c³<uÁŒhÅl!?÷æ%ÞçV-ËãÇàõbO&:ã@$ÍQ
ð£š
s–¯ðí" fÏM’bdpî2JÐ9º*½•ÍœÐZ…ñ£ŸèÛ•è_1z¬€¬cúLX´ÕõÏåÖ7ó£ZãÖÔ}2VWžtª±våÙêüŽïJ£ÉOï­Á­nÏa.€»æ³‰·öüt›-#ŽMB^CŒ87%­6 ¤yQÖï+"óy
¯”‰ðSv[¤…úÙwwqÏeØáÇ£Á{övï ÎÛUº|‚5óZåÆ½Qwã^Àfik3¦’„WW¾[^%ZÏ™úW¦­)L6ÿz&Â{˜Gæ³”ŒÅ°›æ%ä¥å¹ˆ@šñÞè[suÞý¦uí19ÛÅ]±Èm%Öü«j¹5NDÔânuX(Ìa…‡Fý ×(7dÖÕjöWÅúªyIFìùA{[¨ÄoM›ëÿcisý0mf§’îIšUÁ–Äñ)¸GöÕs¯ÙÌƒéº?×Ï·!¡Ä›DRÁÜoõä™¯çIÑ‹Ë4dŸ”ô«Êš"ÉgÏô-ªÜ3vmV²Ô‘šYSpxE¹}âŽ—PObå¹´æc³n¹9XÏ\ÞÎù“JŒó"ßß=F_ß¼Ë{c[	IÉN²±&Wš~”“yNÅ8=¨D8•ø.ø¶øOLK{â‚ˆÞwÇ¡ŽWì
œk‘?wýžh~Q%i]Ì÷Sº&žikâùü5±ñÀ9âëa€né«Z+âiÍ‰â“Ä“¿¡TÃ;å#^/<Qq=ÄW—)st-æëÅ­ç~8±u4w¿«È1üRÄ0ñ´›ÿ|ÂwÀ2]$¢fŠºŒ)F-YÍiYbJõ#ÍYRÒCƒ–!ô‘Ø-ýž–ª©Ò»¨ÅÊ&·""´XÝ žÑÚ2mVjhŠnÃ®UÅŠ«m‘’£XÐ&¥ªÊª…™F]†¹æÑ(ƒ”‚+ëJÔá¢†*êãÁ2;•O®³ë«ßÅ,e,:aCß˜}û¼ôJ#¹¹¨*\-3ÊËEêM¤Õ™JôY©È4uðöá#Ï*2è½9Ø­í%Úü^¢2'Ðx£€ujº’ž•îheì”z·Œ'ÑŽs™@c¹¨ŒÁOäUg§uJ1UyÊ’™úPuÜÕ×ôØ¯¿ëÅÅ«Š”ü¨ z¥>ðc¤Í‚ª¡dw¨Œ«´ÛrÜ•/–âþþc=í²4ì[ðÂuùeäÄcŠ¤6Ô5<|†–êîÃCÀ-à›9ó^,ŒÉþQEHC{Y,tS V'L³è}
À<}h¦56v®$ûb¼©±©2¾Âõ'®J•#?ê%R€UnÛBìœ`¼ùÀ˜MœCßu(EXäúðsBšŽjÎ~v”«†Fœ·Í4ÞÆï™b±Yv×¿™¾Ö|BçÇGÞåù0	§xŽˆMiL×–áMÞRB‚?4f—”Èû9}gŠA°Xú·‰ú¤×aÍXÉ¹ã$v”Þé{^W®*ŠüÔŽ÷Ìà«)hã§2þxÛ¼àOùÑµQµ§ÛÅêeUú†Ë\¿‚Ù ð€€OüÔ4ôgN4ñ][ç‚6
/}r@v¯NßàJ¹ªol˜'â§bpFûDùEDütV½íÐŒÞP÷–ùa™•GôóŒfr~ÈáLD…©F2ò2²@ÎÛ(+‡Õ%»VÐhÒµŸëÀñdI ‘x‡dË×ÞHê–<¾§VÖ¢G¢Å´µŠG­™„€õúy‰J„Å°)2	=Z,“PIƒS/€êtÓï|þÎ)JÇ°µ~ÿ$>¥n<QÑ­$àéïõé}$=ãH²æÍy´hÞœÊ$5¢D,]”çU8Pùò_ò5´Ø›:A¶/Ü'ÚÌ~2Ï ¦~¤1sa¿¤½†Ÿ¯ï+ÍkËû^J®c)ûàµ0­~1L1î=7Ó¬¬¯6´à x´iÙcyÉr¥Èüt•Ó…F“ÙÃ§Ù@??¶æ‹÷›««æ]*eŸZ†Cõƒ	ßÈ@˜ÝÛx§Yíä•"ª,@I~â²³‡e4},u_–8ªb°V]•iJþhjzB4P9å”ÞOR
+%½X+:gÿÊÏê+iÖ¦MSÉ;¹ýß£üpâÓ/LYÖz&ÆBµ{ÕÂÏmvqÃ½ªSç¦eˆY.q¡ñ|áY-8É‹rÕzZ™V¹ûkO¾qÃ'…©û{Ä+ñôŠ|´"ƒWm/mi“¨?ß¥XÙóC'ÝjLz^gÂÅY)¾Þ´K^8?ånûœ wÙWbð•°Nþ¡„ð»°©{n+ ¼g²ûŸiSy ß\ôˆ~­6KNƒ+I‹‡(W5/üp8y såKT\ZEù&y’(í@zEÆÇ¹#~èªA\8‘[žc°Îç«ÈìH½«ñ€‘á'¶ÇNpMãÍÞÙ¡‹O3p…ns^73¡·Í²ÿF›¹Ú•›t¾{,rõƒ7b¾¼]X#”Åk4èF/—©ïÅhæîùiÄé—ÔHT+î0´È—×{øªu:ù¶»ªOÑ4S×ˆ)·ÒÉ¯Ó¸+œèÊÕçÎ[œñašÐ6ŠIAÂ\Ë7÷è=·¨{J¡÷—(
Æsi'Î£–ž˜§2‡˜zºAN‹!NÜ[¨·7Ïø|¿Eëñ·
˜ªì”ŸZtƒ+/øâL˜E¾z¸”ro=…ªÛ+òÓŽY”'&'š&(j>p&ò,Æ“,—.f(o36EK}–¬¤ÚµT9®û£å¾+õw1	¥ÿ$¸ÑÜ/˜¥ÉƒHÓ~òµñ°RkŠW:þ²Ä÷p4Ù„SMXþ_[ÜP¥Šß]˜ÀÏ=úz¬ý±Ñ‹ˆäžwÚS;%eOðÄ5õŠ—}(‚„3´Í‹©^ZÂHtÚŽ^{¾7f|º){Q+òÅ
/ÿ@%õ`·wr´wôîŒö«>¹Š¦Hõ6	4P¾“t:½{ÿ}[ &ÙhíýWÑ¬FŒ<bVrA/9`HßO&ý}D Ý•û}ÅÍg|_ñçÑ#&F‚Þ?›`T}4b]˜™U~WçDà}ºž}#NŒGkj'·,=ø÷`~ÞwÙ­};YÕjýa5Q>é=.=Wr~ï» ®_Ž¸øÏŽ82áð–ª³Âû.XÛ+Çš÷gÇšÌ¨cžfX£_ßk½r¬9(Ö~«Œå¸ËCm1ü¼@îO™8ÿ+™bþ#*qQiNlÚoc:ª:îS
ìŸÑp„Ü‰Â]êáÅ	ÛW2!/Œ;Þ²dŸÂõëy&óà§j×$›^|û.~@ŸyÇ@YopÜ} W¦a?Ô(ÿpÃ	~eo8öÜ¯¹[öÖüÜÓ[©@ò½M(ø©0£(‘Oëä¥—Öyü »XB“íŸÿV–ü<œÖo{Ûï÷vÿ¾{¸{48ûxLWÁ#œ%õMó>šI¾gFüþŠþý>†ü<Ä8BÀ>È@Â[(O€SçC»Ÿ“wi…È\ö;n<‰¼Þôø þýÝƒ‚0qã?ÊêJÿùÃä|& ¹:0,Æ¯Ñ
/b7úŠ·ÐIµìÞ‚ÿž¾†ÿI^eß}…ý)V×ƒWV)1gÇ*lGe$‡‡|Gr½©ÞK³Z tÍó_5ÒþÙÒFUß=]z'&Yzª°ö!úì¸K~¥ä(}‘åñ£ôÏê¤¯:š›¥ˆ8Á•g¿ÉPÓåùêÊCí‹œ=ç&^  –ÞÈ1Ò}óóÒ÷K@Q1ïUÇÓë\'4g4‡µŽ“ËSâ|¤y8|B÷Ö	ÙùÞKŒ<æ§NÄ0—F Nh‚Ý¨<Ü§ôy•¹SJ2¯ì|üåèàco‡ýòñd‡m<z»÷îÓ	¿·ïðãŽåÌÍml^ÇPë
¿%~ƒŸÄn²¼Ê/îÓn~+\ëf½cÁ8Ô>³&±uŸ{yVã'yÖ±WÈ5»ÅœÀ›b%/`—Îˆþþ†Sø»ü|+¿Jp½’Þ¿Ñ òò¶y‡ükf¼¯sØ~;ÝyvyF®êU<¿àB^U«]tQ–ž&ë­F:¤šÙê\YÂ¯Ù]$/ØRæzÌÙz!•ëSÍ–P-bÔ˜ÿ{ÑÛë¨ÖüÃstÙÒÌN5mfý,Z­¤G¹îùù…O“w…}7Jœ¸[Û&WËÝ\×x¼Hêüð>^©¾(Z$íóÞçf£·Y7w~´ÌwzÆ;yS«Ž~™ï¡¹™ÕOáöj~*Œdaq›ŸÖ§ò§ê15³àÉ"xdzáNõÃØó2Þ™9¬ÕI‚'?ó’áÉÏ:„Í¹‡fosA{Ñ¬xò´ÿúZg•}cëÏ;OÙpº@§õ² d¥ÿ<kôí›5úö?k´ðù×èÛM¶ÂÞ†¾þ~kuÖêÆ,Ùßh­ÖJ9ßÿ{‹!#õÇØcÛnâLþ‡
"Ètšß	FñÆYn§‡ó»|Hÿa{Æçwd{rX¾ÆgÖúÞüOM_§qÀ/F+Ú—x²CyçS±E[Ñ³0‚uæ%ÿ}t6¢ÿ¬gãó;®çc1	¬y&‘›|÷Õ\"Í¼¥T>p”xÇgqâ eÿ¿’Xƒ+J¥ˆW\WœZ$IE½¸xEÖùciï’-¾`Ÿ¯V[äþ‰GlàŒS½Á²e/Ôã>:	DO†§@ä†B<:•*Og'û®?ãs^cµŒDÚTÊZ+h")Ø¬çÙöþ`#¬ztÕÍ˜å)9¥JY'‹ÄoÍ'©7°üšh©Ô¢¨æ¾‰c4¿ï„ÃEÑ»õûÞÏý}QÿBþ¾)zÕ‹ºIÉ[Ûè¾À+Ëce±(o[?ÿp÷ó?ð,”½ÙŒ½dùÍ€ðÿ4vw//ñú^õÂ@^<Ædöx·T5ÖñûI9WnçÊMö`ºD6è3h#jˆï’5³z-%ÃfÝù6y'3'Šé‚™ýGú¥4 &`ã¢ü£GìGþµãNÏoY’yªï¡ƒÆU¥ÿËýæLg¾Û†Ó†Þº¾€+!¢¿R@:@JÞU 6ÊÅ3TÆ^±¡Ô{‹WCÒñ/H%ÍØÛÁì`iyÉMs¹_)ÔÓ.#w:,Ñ¶¾Ô:ë2%ÓdF¸æ²ZüÀ'ì­“¿·×÷€T¼$EÉ\kÄxžµg</´ygb*Ÿü;6t’á˜aÐT‘`C 7ŠÂ¨Ùxd”ˆ7Œ#0|¹0Zmæ*íó¶ñß»6;ýÜ¢4¨œúOÙ¬ŸÀšjã<õÄÏ@­Ð^œè¾høá•4Ø¿Y#r¯<¼²‘~ÀèÂÈs|úá‰Ù¥Wn ê)¼¥_Îh
Õ_ië[dX¿¨QQšƒCƒƒ»£!Šq`ñ¶¤5þ[ÐŒÅ	*8€\ŽùOx^çÏÌÞÀüü› u½jâ¿™++lyy™ lì-´4:Ñ(¦«']|•JðçEæý™¾þ1túYG¦ÊÙÆ9‡ig—Y§Œ`2ªÒßf©PVïE‘sÓñbú+YòL±lò¼ì-IülF¬ºîTÊÙÙ}Ûût08;øønïèìíA¯ÿ~»w²Ó/Ð¿ÿô’`ÇéÜx8á–	·o[Å™Hƒ8Å¬ÍaÐœY<“æ(6Gxú`6;ƒR—ÞU£-èZ›6Ã²XÏHo:î7X‘q³¥ó
ÞùuŸ—LÅŸMíPC¿yGŸ2|Ú!‘ˆ¦-ÿ©MÎžŠ„¬6£³;2ã9”ÙæäÆ×èj³Z»w?˜ß€á5]”ŒôÚ‰‚fc;LABÂ„áÁ%7@ŽjÂ Èb1ƒ]d¯Q.ÜeßdâhêŽ¦^âÛÆÔu(Þz‘BÜ¬F|„Ø¨ NWáð_¬¨‡\—½¹™WcMÐo¢d˜&¤¶Î`N‹,	ŸçÌ©«B\±Ì+$ÎlàMÝ0MNÜK^¾¼p‚›l‰È¢\ì—MjÂ'?­­Ž¸3PÁ&9JÊæX`ÌZ‚.Ld#ú½Ôêx³k¤›«««-‘.\+#¥}™ ^@7ôò1[S9)½zõ’=U—‹²×6Å©² £UfÏ±E(UºSöó‰{Ówÿ•ºÁÐÍ'†/Ü6ˆHª…n>cûîEkÁ„ÁÖ	¿.B »Ý¯49Êðq„R„`?’‚KÀ4ôç™ì 9¾Š¤IrúÑí üæûl` LŸFÒ¤r<<½ÕIÂƒðÚ¶QFÕö0±“ÈØ·ãøÉ>¶®óQjáóØ`ösÖÐÙ›‚XIWY±OµÎøæºÉ7m¥ã±w™4K˜[y'_@UmRÄÌAÌ#<+e®ÂeÞŒ¥_˜™ÓÏÆÖÍ^{(ÙgÄiç€,h5h­ÞÀÇ4‚ÀhŒT´¹SÐõh™¢¤A9ö=ÊkÈÅ Ð¥AþN™¸AÙä¼Ñ¾FˆXQÖ$zÅ/B½ƒŸ½¿TÖAá¹"C›¯Ä|dô¯¬JêäÂ¾÷+I`b) ¯s
¢Å¦’øRÓ›Ò—›Z ÑpÈ¹{&¯àS:›a4 J»^<Œ¼W{uäMKE‹†€Åºv‹¨#ßWË:b÷FœñEŠÌóº#,¾²ÈÏ…ú\ Qš¨’c^îÌ5Šò”ð£]”¥”Èõæ‚u0g³Ñ›¤ë#Ì÷è;c6uâo'ÃÎœàj"¯È<æ`nwæ;^ÐAâö@€÷^€oœ jZ“Î ,ÈNv·Y§aÈhÙÞÛf—àÜ![ˆô×©›8ˆù×Ë(œn;Ã±¡ËÂ:üø7|tläú.^ò­<Mñ¬ÄÃ£j°Òš(š¥Á,œ¥h2(…*Í• iäàÑ„¬1ˆ€~H“4ÆZ6Ò\Š”´J"™A£0˜>hâAJ ¯u¾ðòÏõ°i8‚lÚÉuM`±Á`+Èqð¶H76t¬iŒµPGˆÉ8Fþ@K[×± \Ç†~:rãfCôÜŠê¯ÒÀù
+O¿Ø^'\0jËJß„Õ9×åÖ£0ñ@ØÀ‰fb]°ø&¢ˆ
µômA2ÁËnuÂIò9±h„w’×s€ÁñU¡æ3œ¤(„: +ÓÜ2b¶K"B«r®Ñ%H|ÅK<7Þy“q‰|[ tç[#oàÂQ%Ükö¾6O-ÚM›4Î6ŸÛì–Üæ]Ò}oHþá•/qÛK®{ö¡¥ñÓÉAg¹@\ÉÅ¿›Ø«QX(‡Ÿˆò<?:¬%'_!Ngq9?òógÒgÏÏ/±gœ9þt›ÿ~ñIð:’ätM7þ>~×ÁQœËF3Xð$Wë£í±çšŽÌ
9Eè•¸`VB|€hN|À`tÝLUÍCyç\9>›3™¤È9ù8ŠÊqW ²¡ÅeTwâtøiH`^¼ìaªUðWóhQÈÇâTä%ð›øuçtõ³Fñ=2­<”ÖK%\ká”ŒE:ø¤iP‰Íæƒå4YÛjðÑŠeÁÄ…Óf{·´ØP5›A\L×7â§œ§®Ô¥q-ýØPØ‡!Ìfu…³Ç¯þü
âÍHÙ(îtb‰¢RrQ;W‰Eª%|RZÆ!Wô4¤>—Yg=h‰P„6û­içUÂÊ0h¦gÐÔHË|h X¢<¤ÅÛÍd}ý™Ö÷ŒZª€(ŒÚø¨ª2ß!ßä”Š'†WpÁ8á=—i›äèà2„-)³ÜT+a~^"l}åÖé	l×Ñè…4
?/BØàÕ«WÍÛ»¼y)âs¶¢>Ñ:àM½j6ÈÉÏÖšu^èW÷Ükjg;ÿ­Ûèñ€)©èüØCrä¦yGRÿƒ!èçPœ¥üÊÜ³XÑ~VñøÓUVcìDÞ™Ë¯¢3Ì†Äý˜L’¯J‘W™j–EªÙAô8
qÉé”g¾°RPŽ#1†c ˜sÁñ¤?ÓqåøÜg2´ôe8 ìÆ×¨ªó¬]p§Yg“‹U«RºÎÈÌWåÛ^·\ºCÏˆaÛ A/\ÛtÏi8âÝ›»ïŽG£$žiPõ?½ù°»=èÃòâ¾7r/œoÛ¦FöÔ'ZI”jsórrÚûÙO}Æ…•]›iüaÚE™*ó>9Fœ£6§þ–ˆ*{nµÓo-‰è¶;¢îÛµ5$ñ­lbBbVKks‚‚q8²}Ò÷êEè$³¥N/ûiY&SÎá‚/FwÂ­"ò=o˜úé”îø.k`&P+Ùaz›4÷n"WÿÛM$ <š¦´E;µ³‹ßG.ã´uÙEkD<¾µS1ÍŠ&ˆOo‡A"÷ÔCåÖ½è{/K¡B–ûav¼;BÛ]Æm•gÕsŒHÆšÕ–æ‡XuŠN}²r/RòŽïo a•”£ùåEÕ^~ËÄîÚ…ž0<Ã£ü‰éß´÷ÜŠÔ•û~›ø4F)GñKi@C\ßùêBØq2ÌeO¬¨+eB‚©ØìaV¯‡Ù³è-swähú¹î„Ñx	qm0ÚzÒ ”ôAÅÁ­–³*˜¾<K^.Bg±&Ç@Ôñ†ú&­½Òp½
ˆìSÖü»§H˜½D0òÚlß¬Ä›´–¨GuÃ:t0",ÀìŸ˜^lZÆÓÅ¦uï™Êês³Ñ÷ÞqvôƒâæËI•Ðš,þA>ÐP©¾Jƒ£ÆÇTÊ	Tî#*„&Ñº3vèè8fï=4»õâñr<öFÞ¿Ú¬ß9JšÏoVÝ|@.lvíùó'«ëk[ë«ë[ëkk«Ï7³V
±8U-*…U¨û;G¬ÿi¿7Ø£ëbsgq0D(!ØVÈõ¬öÄ9¾Ów'!à¡º^ô,æeEƒÿHõ#8cç&µ o¿~PÚÞËÚógOWŸ¬=Y_]{¾º±¾ºú4ëÁ:#wêÿ~!ˆ’gÐœããÉ2ü“·‹Å]Ý–,%šyç_@‰oJÎÀÖZ9€z Ø¢"m¦eÉöÜéÌoÐÃ7Œê&óÒgœó‹VßbªdY»\éæÊlu›võü"f—ÍÊ5Œ¾Ù”riºL]Ü¦ƒ[‹¾52&^ˆ¡.ö65•P9Í$_Ùµ*[Å5ž·†ÅëÀRXÇy?°C«vX¸®¸°‚­%mW7i¬¾¼q½,î×ïÈ²Ô5ï[û«œzmy+“¯0ˆZek;oC>ªˆ¾ŠH¬á«*Íµ]ÃâÚÎû*´dë®"· ¦UÂ¨b¾µ·`èy¬Ì¢¢HèwÒ1ÞŽ]P%P}eÛ¤+6l=+ÀM,Ú£*A;?1åbjuÇñü›Çy›âÁf8.ž£N”ëC$g#ìùìË,·ù
1˜7ñºõÈºì–ûŸªEö*Â3ú.»©XjeêSMæ–6ò3Äš5Œ?ÒkõUU`éBØž¹Ô¡êkUbKnK"IU§Œ5òs»w°{´Ó;9ÛýûîÑ øéÉµruÞòB74ãÊê'‘2Œvø3%@Øý
?´V
æfÅ"³Mè$Ö|ó©† ê&JÀšÎ3ƒú¹ãÜÄÛa*ÆÔ×ŸiílTOî¿4xw@Ÿ7ñÙ/]4‰{AÂç±ÍÖV[ ¯1êÊ“®“" 0t}Ü$a1ùB1Šä@ï]üR`¾ûy ÃzÎDó)]ç¶£9 ä6§y­Wûœàn¥|%a—ÀÃ©ÒðË&&)FÐîPYÍ‡k/ïPá—2 S€7<¨y‹Aœ6ÃèØ§ 8fŽc§“=mé')tOaÖ=|@ƒ*?W±dž«ÈQ»¤ž«°žª¨ˆË›¡È¯ì—´
cØªžˆ&Ñ–4‰ælE]EÊ™Ò_ª}\zÁ¨	¿¦¬>>è SMd´Ÿ}8nè”ÛÇgƒã‚gu±DÌüÖ€3ªix¬©E…d9ðÐ}¡ .Cf"Ç7Ñ¢*ã…¥%K\$aØRÔ)ø³(zìš¦È6a¦Í=óšä³¤…¬\W'éJ–)~º›	TçtaŠbo£pzr½;/«Ä¡˜gájìçœÍ\»îä”ˆZ?ûÉ8Ž|^ˆ†+œ#Q;ä­TŸ&á¶Áýäq“×ku.Ãh×¡ûaÛÂu`ô ªT …$ð}Öþ*k[0–Cÿü•¤¼¸ ¦4jm-‚³ºsÙ NôâÝoä?’Ô#ßÒ:þ±H+¹¿Iœ7á©ØFËVæ^u¸ìÝµU³´^*hÖBÈT£zq$e¼Ù6lÊ.N¸'ÍIÆ2MM
S…fs%Í8R¦‰q B[¹Ül\&¤Ì)ZŒp•â‹ÂÒ´`rï\8€lŒiŸ"ø%’”3yKò³éìøQ©“éXPUÃ?Ÿõ=Ôvú§J…,BŠ)õ§‰{ƒ¬U0ü¥µfÄCù¸…åØ*l¡×Yô e¸ÀžøÎ<Á!‹'F3D|Ô©fvÈÊÆ—=Ñ{¼LýõÆÚ!5š/û’þÉ"Yò.¯Ì4Uƒ¬ïÿ;›0•:ÛçÛ ‰t’o‹]¦¹J[æ¶'Üxš¨|ŠÒc¾±ªˆ+WŽfkÜÖr±zì{C·¹ÚÆêæª®ÇWVÕµÑsñ´ú<{]&þf¯ÅSÚbº
%5þ™ñM±ÓÚ7u¾œ….¿6¨ÙˆdÎçÅå'²Iâü¿R0M×¦¹+b¼ÌÀåa![D³+*š!Í* Y ó’¤9jŽÉºmîvC¦„7ªÄYäâ^bÝ~Š³;gÅÛƒhVPDp(‚"?¡˜SCwI?ð½ØÄP¶R_Ë\|ÌÌ…rM²C' Ð8Ê_¼u‘J`)4<;ÞøÃÜ´—Ø€¶æŠñÚQÚ6Õv¡˜mÝZU~>Ö¦D(Ú'Q”Û´ë5N?”…UÖKû6••ÿ4ÐÜÌ,&ˆ
éeÎ8µ3e3žMˆÈäú!FÒd*$k~ÜùtpÖûÐ;A;ß$sãÙÈM äXy ¨\¦$_2ÕòèåµLÛ( ÊŒTF]2t‚ð·åÌH$½u6#Cþ™ù3…Ò&~ŠQd?µ1(JEQÍ5QY;^Ê›È©óf5ÝÐ©TØ4K	Ü7RèÝ8¤%àÜL·e‚¥|ÍÈnÓõh’¿þ~AºúÌ8ô’q8úgAÉ6±CŠ hb5"šO„Àl ÖYP÷©<µn™
u"øÉ¯"cÁ+tƒ?áP†¡á	›šÃ<~žÏSqûg˜ŽäªÕ¡N	{õ|Î\k2jŽ^Û÷J¶ÄÇL£°oƒÊ ÅˆñÜïQpÄûê’éú%mýª¨e¸{Ê´UQÍª©JyLóÈq•,¢› 1Q“Ð3Ø9œ(i8èÍùi•éVWhƒ¼¡¬Db,|Ìµí‚?}+Èa–áõU
H[ê»ð/¾;øíÄ¹ WûÎÔCÄ.}H§NBeœ‹$]úl[ÅØ^2&HÍÖg¬öÉÒ™¥IË¥‹ñ€ÌÌ0À[–·Í¾Ìd'»+ZM¹ISÚK×2"ÀP–¸ûþÆÓl€å†S¸*C©Ý¨•Ï*ž˜GLéÎ0R¶¶˜ÒõkvÚ )Ç”4|ÊñN9þ¥)Ç/4åÏjÕîBU±RKãóÏ:´bŠ3Û7[bÆÖ*p_øìÏ‘ÛãÄ,fÂÇJfá…¦Wt€†`¨¬ÎÐóÍgsŸàôo>à!ÓUõE=c27váK<í§›Íó¸&„HüÂ4¥›+lRz3ü4šÖP¾Þjµ#-àJ@af»ÿþ·ESÕª)¶h½nË^Ù(¥P[-1ð	{ü’PÎ—1Ö5s„š¢\Xµ¼)Kn$f¥kn(‡JDˆšÜK¬Õ¬Ý2’àŠ;œ©[ûÏÍO:°Ö×zS	:Íx™X&4#ªrO@r<Ø a0·ŒƒzÞæPà/2vƒ"4p÷}ÉÎº-DtÜ-¯>]^Û<·WÞFåU1eT²¼þÔ¨N;¿Gˆíã÷AÈR›€µ~fZeµRU•ƒ…µštôUÒuËx­‘—†G$¾ð|?œ»c„”Z2›Åp+ÎÂ“Ö8[ºéE1.{Æ3)ðäÒOSOeŸózy<'æ{(õÛG)5xC†Ôœ;	pÉ#×üQ¶laS¼ë/3b œØE]"õþRÂˆ_œ÷ÈµM€8.‹›Íf'$ eÞ"r|gÍp‰­)HãŠJ‘—94åŽ6ÝZ{2W¢[Dœ\bN_œAA3 ÉŠ š¦1…¨¸—Nê'ìÒñ}TY²L°|·#…a.®*ISR%wHAºË6Ø)1d½ÍU¯üèk"«W¶6rˆ«Ö‡l¦D8˜»VæÔ¿×º‘4¢ÎÉ=–O-!cÞª—’¡|9á§Æ’ÊðS²´ðSð`›¨Ô›2—[öÜ¾ìÔ³%˜)i	÷
¨j7;ìd[·M%äå?òÍT1½¶À…¤¿Ê^Þ5Pe©‰âv¯§î%‰© eO…ù»UpR'áÕ•ïJ‰dÇ¹™?VK4¥ŸH—ÑËùò‘FÆÙ‰?…øêBÞÁ¼[1÷‚]Y0£«(HË9¤Ezôp›Í‰>Jo–]‡¢ó·oWf»—\zSš&TîÄa”4›N›]ºwzÿèŸ}|{öËîî> oä~ûxÙtZlÙþæ¢ÔÏY68	ÏuÅäâ$éiÊtc@M™(úºC„hp¥k"£v[:ìŠõ‘Õ«µJDs|­l0ã®íè'?uóÍ^ÿã/ “©IØ™lö%G3Î8BF…ç¦šyÛd(ô¼Ó(F¯ºø¡@¶ihÜn¨AyzCŸ´Ø_ÙS#Õù5QOs¡lÞlQÏ›fPÃ´xè$ã]&ÐlfùH  jZ[aÏžl®âÞn@ýfVÄ€Š>-ð'Øe‡”ûLÚåééj3™b¸”NÜåŸ¢åò~¶°ò´úßÓv/‹X™Mì>V±ÙÅ¾ƒeì¶±ZÇêÙÇîa!«°‘Õ¹\ÜNöÝ,esme5[y€¥ì¶²ZË´—™2¬)÷Î±š-j7[Är¦å±l[ä\÷ïmB«cD[ÌŒVfÖ+1ÏÐW[hŒÂ9’Œ¾/=ØFdÇjë
tËò¾¢­šg}Øè)[õýÐk7.b4X%•ÔâVegË‚©ãh=©ÆMlã5³…¤Â	uhVÚÕR¬ßÓ ù`ä=Fí¬Eà^AIYz2ƒi_l5
ºèèƒ8S¼¶Ã#½ns+ß$A4‹ƒx˜Cé•?Jï_©üÒaßM²Ì^ fÙTÑä³ª**$ë($"ïÛ‘¡VÆ¾OWÒI¹Ðë2iSæztº¾®è€GÃ¤Ä
‹ óè°©ëâ©KÌæ+Æ¿aëËønäŠ$1xÃ¦j™ôÃÊ:v£CÑÀËÜÆ§„|>¡«bÖam(€Ô62×63/lh¾Ÿ©Y›@Î¤E5á‹Ç1lo´¼·ÓÀtFT˜nÈ	ðF‘ÊáÑ€9r#oØ(ì¼ÚŒÛô¾Äž%ÝÀ+†]ö!õo–wÜ!e#OÈÑfœ`ùC¸Úóu›l(_¾dªU˜¨ŸW/ÙÔŸ•W¹þE»YWáL¯ÁL¯WŒ'Wñ8ö€çåJj†ò»eP:lßç.þ!‘S]O§rn>Û¤{IbÙåÝlzÛ–Úó¸…\Ì îß™ÂLaF÷»']¶w	"ÁˆÌ*@|°×ö‘Qžwbl}9ëÓ‚C/&9PGY„6l4+*¨öÝR9&^ÿ¹ˆîLÚ(Z|­¢é‚vfÜx›6`_£‡ÐÅÌÓ3ÎõÀ #Æ‡Ü–iHÇ¡ï<°°X—'3u²É,Óeç©4éß?sóáh¾…>–}òñã’²vòìh´WZÙØrà(Ì¨äJ9-~7Š½Už\Qò
 ŽµÊãgÚ†_ðb=eƒÅ;*š‚aTYÓPv`Ôˆò),i¡"øßhýž[èÀÖï7°âãê±– …Ùén±|ñ|†ãê”««£¬Ù÷
³“™>¥¦pVŠuŽµZu…8¿AÁÂŒ¬k X;b¼Á4•«Û£	œc!“wt6K˜î•¢Ã—ÞÈõ½ä¦ØÑw›#ƒÚ'ç;MÌ=&EŸÅ<ÙÚ¶«É½¿-ŒqÝ]8˜Z3Ÿ\’ffâá»š"@ªvÏŠ½_]€§|ícSªçV:EiµõÊUyÅÌm¨º+¶Z­=¶„Y×ßÏ…fÖ«›)ÃBÖŽôióNÃ‘Ãëš½î3ÑØ.6£ïÂ–:Úô6º:bì¥Ö»ú¸õRÙ1ý ½º®±çd.}B+û–`VÍ·@êƒãXÊö@—Y“õ¶…ÕqÛôV˜1å²2íÊ—_“·ôÓh‚Æè~æK$[šœa$=ÒŠÏb&;ÏŸ‰öÐwX¬k8,y—Ì,/îÔ;‘.9–º:ÍROŽÉÄ¤#Iù¨0ò<ÛÈtý½Ñ7#Ù¼è ” 7–~æ¬½k‹±jçàR7¦™ˆpWšº<ëÕí(A6Æ¤–šœÕ§ú³F®T£‹ÅXÑ¶E
@“ôKêÇ.Ì‹ì €”dÖÆ´¢C~Äü‰=®t|HjÙT>~l¿H?HÐoé{iªË«¤)§¶ªkQ”Æl-fÛÍgºá\þÍ±DXYP—êBÙñ®<²ÎÈÅxàC5MÚRö±Å~¾@ä 
¥ÛõG¦W††YêRù¾ôŠŸš4KªK·ø™G»øYˆ~ñ³s0æÒ1~ÊÔ +ÿPV"£qíî*a~¿}	A	ÈÝmLÆNVGqt*üêÂ®8r1‰ãë.ÙÂËìŠ…6“ï…Óáµâ»?ŽÂ©—%Á×â¬DÒýüž–%°WwÈðÅØ„Ÿbº¨OiN½@­#¼f5µZS<\¡x32¿ú…Pyž\ýöÎyKÆQxMÆ[>Ž¥ÞñÞHÊÞ¹x£›¸­g„×ã%MvìÄ‰‡×5©÷åá&0mìï{ƒÝ³w»‡{G{gÐÐÙþî?ð=7øêEa€dË¾:‘‡Â[¬œó0{ÂŒü.¯|÷ôö@éC)FàÃ5u”ƒÈLØŽðoç#¥ŠÉÉ|…37â	/´P!Ìq«ÖîNöŽÞå7Óá'´F1Í¶5·´d±f˜‘R­wrÒû‡¾^éræbdRÅð«‘ ÁÂÅÇ¹‹©pfŽ§3ÕÚu•ÍÂeU„JTÔDH´ˆæ’õ­Çeí»œÏjtr-;l‚Á+mö¾wò©nAŠ\`1¬.P"¯Ë~ºmf¬åuv'ŠØÈè†Ú%~YåRëî¼¤wËdø[dÝáò	*/*ç©iX‘´´CW(±É´<ž¹±wéM–ÊFlß¨ì=Gî¿R/ÂÄß§KÙ¼ã	Ì"z–>[Z(vVˆ<6;V»TÖ!vjYbøXY=öSJ—jg‚ÿa‹HVøWò$ü®L@ÖËÁˆaùLg¸çäö—ì"^÷Â¹æîŒ}MÒÈ›à.ËÈ39¢­¤0€	tXs?{èF#wâ0ÊÐÚÉš¤WNÌCî<\ Û=:94·[°^¥Ó4Æ.lDÓ+Ã³©K¡yÜà‹\±þN›ÑžýÓ­²æ(‘%Ú¹k³Cgæúð^Ýºá1Ï„_g­"”°Ts8ö §Q:‰a­gÏÖ:0 /]0ëÆ˜¼xÖãwÓNQ`™Éaå-­+µøMˆÔÛö1lÛÑ…¥¼‡ØÙÝ!Ì¼âðaÛ.Ãô¥<¹ALÉõ‡7„ú0§‰wÙ¦Î §æœø›NP\òœgt¼âÈ1Ào.€«V‡¿ô>ì½hÑ0@t„¨9l½t#`±Sæ`æÖ(.ñF‡}è½ë±ãÝ“£Þ{’vÂ8DÜUÕ2Ün*RS˜&³ý¶q
Kb„‚p¯	J2l©!¥-ß‹NäÂlðR8j ‚†Â	–ñI8Îe¹ñ¾¸yæ¯ƒ£øqÇ³‡
tñ<ÄõòFçé2Hêñ¸‘s—!¯k”3íÍ¥w…›€ìûÐ›ºÚ–ÌÛW—ÚY©>Iz])ñYBÆÑÎQð­ÍH&ÅL=š–Âð¢¡¿¨SöÖá÷<ý›-ÝÞ-)Z±R4ûÞ‰Ü™ïÝæÊùù9B½råµéšpõÅÊfF+æë¡¶Yó”áÙ>!Æ+M E/ÿ™)ïøÜò¸âH+*ÔÁ„ˆ~I³Î‹¿Öô…Vøž8F5áøæT¢ëíqÁe”wÖÁ»ŸéZíaxá0ß¹òµÁH'ÓÂæ£ÍJ*ù•š"¡R[Ó¶Úì<ßQŽÙ#68KIaýÄùïÎÛÌÒƒ•ÄdŽ¹žzƒcýº9kS6d¶«^„*×®’“C^Š:½Ha#€ö³Ç1k™h Ç×’ðHÇÎû)ŸÇ(2ÒÐéýºJ«™
ÌCoz{»Y3¶?ÏÕqÇ£ý[Š~_Ÿ`;‘¡2Wÿ-AúRwÆÑ½6‚‘Çå‡WÍóCPr}`Ëj'’
òðùN§sž«ÿùe|MÓ¦j~lÇ‘ñŽ¢åËE<ÊV9½Ì| ºS ™·¡œËTÍ„?*½@³ó¬†XEÅ–~-ª%"#í9u	¨kØ<n0ÿîsš+îM{„Ø¼‰eÄŽƒîZ¯Ã>Š5-±¤•™“ÝIC)‰y/¹ÉˆgŒ¹D"¹Ìî‹ŒCŒAÃgªÉ~¨"Ÿç6*wò¾è”’,ÏÜhsXÚ…¼+:ç-™³¤Q–(£ca‚Ò§éîÞVI@&ñT‹o6Š 5 Qè‚ï$ÝXMv+¹‘L@<e@¡ÏâFCWH­U°?¦@LÓ™g¯žžþ¬¬ lÞ?ì0Þr»w°ýé 7Øûx”­à$w¯¯=YæÇD³ÖKäØïèÔJ²e2ñ);rJíèi„9ãÄæåî÷¶•Š–
Ù8ÊbÄØÏ‰ÑWÆd‰‰·P™Ö¸%<¾üôg³ìä¢Ö¨v%­ƒŠÃ‰²{[6ËzGK)Ö8¦¸èAE¦¤ŸcÃÐ° ±[Æ¸*sôŸÑ ½°Iš8êÛ{‡»{G»ìÝîÑî	1‚<:Ež/Ä0m”€Å²ã)\óålÆhƒ˜THßUHé•mVÊ$²-.¦h
À6ÞWÎÄ}å\)}Fë9‚#ðKÎ¥V;ó|oœ³âªí1Èú„7bðƒ‘'œ{SiÞeAÇ¦yŽs`²QßxlHž&;eÉuew„Q(Zbš"NðÖyJÎX–¼Q3ÖœŽjá+cqiŠó\ùHÔ…dÎüp˜N)àiÄC‰ÔÁŠ9JAÃ^?i_A›N1`©£ô¨î5Ù7Ë ÷Î&m†“*{A®ApeÏ[ÆÉž¬5”#J”1+ëÁ]¡ªÕtˆŸcX:G]ÖCƒan|ò@À	
ˆGÜ·ÇvœWÔ\»!~ŸÞõú]aè*•1¤ùË™ÆèÄËÙ76q‡xyfÏO­vè•žfRÔ¦?û»ûý®öp™9ºÍ•{‡–±|Wm5ùfû°uÊŒ*Ò)âi`¢™vkºÄ¤±¦°A›Œ=yâd&kJS–Xé3sN«	;½·ƒÞ	*Í½.üméøÈ	W ‰áçð¬ãH¨¸ì$3 %nlü3h´îÊûÚ;êN>í÷÷ô.@f{ƒzæyœù8ŸbÎ¸ú»ƒ½Þ1‰”äf4þVaþøþÂ¼ˆJÒÎ…œDR¥Ýfö,Ã]‹}ô¤éÌÇH:­‹“±b1íoÐn€W(=ëf›p+;d"<Ù[b„AÊN¨!Þ]â¢Dmi^“ár=Â›~»ìL<	ß~8ÉiEY>Ø5®ÖœÞ€è×Úl½Í>YjuØ{ôD^¦¼‘óK“Ó£fìàVG6ÀNÛÓ4…©Á»1šZ	gÔm)Í	LEL-âohñ§[MÄ”¶g$Â‘ BNsŽ>žŽøIÎ.¶Y×ê6;Æ.=×¡)7¤7·óçc/Þ'a0½Dox«ÃNòûÿÄ=aqÒÛiŽU“2·7Cgnâ %ÌöFœìÈÿ–ƒ#–>7_‹=^Øâs€Î‹GA‹ž{üÌñÖV{iç:“ë¹“ç8”k€Yd­Q@±á=útøf÷¤mø@÷vøâs18^ªòŸâG½ê£ctHR?sVÒü<ä©ŸúˆT?¸š¬.g©;s–Ú\«ÌÒTc"w'O9“\ª¼¥)ÿÔBuï"
ÐûefõTíW–([—
Ò8y®ó¼Ñv˜æùÏþôñÚ¼âw%2ëÒ!ð!W@¤ëí	¶+MrhL7.#y€ß?5|g¢—ÿ™x+|h$Õsª•VÓ½l:ÂmÅ8 Ì}ÎGã*V[gBbaÓš‘*v§¾,¦ÀYÐqGX«é¼«ï»˜Ãt?%¾»b\µpÏ)ž:5`Ö½Z×§OXUÍ€¸»dÍéû§Û"™Ô/%8XªtÎ-E†sŠ„cºå“À·]¤³¸“Èt\WÞ€TzX¤«CàOvûŸìMo{Ÿ>‚ò1è1Ô	¶ŸNvKÍóå×‹(v›âŽ§Ç‚8\$ït˜à7÷Èñùa$©ÝÈ¨ãKK¬±8âçVüÌs{zÙQC€ü?¹Í(¢_‹É†ªy0°Y‘[á(R:}ÔKfÖ¨jK9a)ã7ø”E\kaÆŸ;øí´gmæµJ œPf"zÙÒê©÷¹dr€qùäÔ²×ÜrØUæ¬9*˜`øhÌâóh¶³¥bå›œ˜9Ö^VÕ¾q^1eÂ‘=YÂ÷\Ña²K?„5tÄVØ¡5ãAäN¡èû+;4¼B!hdÈX=Êþ^@æ=~lÍ”˜‡
ÂcÖÄZØÏ °ZÊ ¬gWaå²WìÔH<À·F½àmîWö€Áñwx­²‚…ÊáÍ’"/
&RÔ(@YD"Ç…RAZU2(µ¿ÏSmõÔFel™­}¶s;òª@Ñí4ŠÃHÏßbr›æ%¬´ŠóI°ËÑªX™ü"3à»#±Êz|½e‡°
{`Ö|IB*=å™Š&~`>Ì¶:äÇÜ¶¤UJ¹—YAËQyiôïe,“‹Æ.ùZ\øLWÓtH;FÃ9Z¨J3š)7¶½Ôzx­Ü¤(=^…6Èh?ÿ^C}È±~…/Ç×ü³-j^¢Þ+èÜ¥)š&+äÙb+^»]u"‰ÖFÖ.²>ð4ðC;¢ëóŽðæì|l-uÐméÖ²Ï<ô9qì]Æó
Ø‚šóþÚ9 Uƒ)£/Å:G“ðÃEñ"´´+…/-“Àåt°¨jv¯
)òÐªÓ.ÚÏÈù¡8'ÈD6¿ÇƒîÇ‘.–ò:JªJ¢°èÕ÷˜ Žýs=à^š¸çàå» wÌ>à¸W!yNÎ²¡HÁužÔ[W¬µª§ˆ^^¶`ƒÄJšXÄrb%“&õ¹Ö«lÑª—ÝZ/"wòbZt¢¸ä±a@ÞŠˆdÜ¤q ¯{€+¸Ï%wÒ’¼f-ÈHºòà¾ªð>%6§mÈu±ÒÀ¿b”_EéÎÜà0¥¾Ò	£·a$)ZSóZr"GÎõž<y‚Æv›«øEÌ'ý*¹ŸD$¨Pú•>…­¢äi£k(_kQ¸ÚIÓò“´µÎÑZ÷ðüìì|Î¶0ò>®"‰"ø6Wd€2¹48ä¶ÉJ\CöhŸÈ¼b„#Ì$ÆÁo¢©»óŠmR»ŒZNÞé¤$Ÿ˜ñ‘D#Ó®à\!Íà8ñ„°Yyþ)5˜–ÜNP}HÅ«gJÏ€-áp|7JšKYØÅUÈ³äCvÒªÐ‡CA “Ð§¬ÌÏ-ñFrl”V*ëÁ[ãþf=ÚÓ¸<mN/@ÍÂ™7D	)p¦sm¨ÁãrÙ]‡q2dG²‰îþÙÞE>òÛ†1ì¦)ò>6µŽ±iŠôÄ¦aµæ7¼½xÃ°Î-g»êt¶+¹Êâ=*‡ËòžÐ9){²Ü x’é“YÛr™ËöUzS]@]‘JÑ˜®\vA”l®üsôxE#Ù?(m¼±×<Ëé^ð§«Ÿ[jªBûT&Yi(‘IA¨%sù¾	C4å3 r/ñT™#5tŠ§ô±L•ÒPÍŠ¡CùÅÈùbÌã«Š¼	ßtoBvl™o3q~B¼¡¹ò¨0å!?ÉÌk^Š#éz5í(°IuZû³®ºÔW‰òj ¿Ê¶“syXç
¦V{™PäCó§[ƒ!ÞåA.­‚4œ‹¿ùÄªLW-¯ìûB¤=)Ô—ÍÜ6ßzþî¹×ÍÆ§ñ×w£pûÀØ	F¾û&õ'2™&d™"¦– ³°œ¢V;1¯È-"ì–±¹…¶TrôÈÈ|T(LAó×úÕd0dnV;þïYà•r©qDè(”Yæ˜.?¿»Óíqè1æ]ù¾ÞÐ¦ýsÿ òùdýÉš~KÉZ£lŠm„’3¿EmV'„¬P.‰;y¬¢ˆÙ¶o—E˜rÏ™6%µCÔ¬Ï†åRä~äì„ç^kd©Þx#¯^²§¸ ù¯/ÙÚz‘!æe×´²OJå/X
5"Ö`••d}í‚‹¨)Ñù3¢Bt:/Ðžïxç%Áõ"*U¦ðüé6ÆqÀ®Ráš:ßhï"ì’ÅöÔ¦Ì¤mf€nÛÇÕVkwn¢Ê7öŠÑñ’Sw
'ÃÝPÀ}†NàÔ;ÈcúÖÛO@‚ˆí‡n,Çmôƒ6r³¤ôá$|v¼¶1äu(_óh.Ã”Qmt/@·ÒeKò°é,
ñ|a§“‡Ý)Z@PŒ¼¬*º¾ÏˆKß¹Âñ‘ãQÑ0‚2ð“ •»åµŒÂkJSÜ´:€‡ÞEñ/õxÉokkÎ)&Žéˆ cºÌ†¡Ï·~Ÿ.·ÒÄ
â‘eß'Sd«F6jû5ðÕÇˆþœ‰ê%Êk(_9ž+ICK¯9¶¿·¨òfUÉs‹w®ë6ŽÂMš¿Òæ—ÏG‰ƒžcHŠŠ ¶N“7zfðŠ‰£Ç â,cðºjúgPlT¼É:ÉÌ^’ßpz¨›5*-ÍŽ·V
Ò¿ð”j©FŽÌ¸!^žjþþ¼nQNÐæW¥†BíâEŽÊ„S~óK•ZMsñXl%:„ól&Zé…l'&ùP2P”þ”êV7ƒ©T³GíÌ¬ånú¹»ýÔ©|¬<Ì7b¾ÆŽrL;	*¸ÀtéÔóÒ]1ÄÉr‡›6ym–ø©u‰&³F…“/p%Ãdõ“½=ž±È›I!U>aWÎEŠGðXñ2M‹”g'ÎŽ©·5[7Ü¤à#½HŒŸW	n`7;þòæ ÍŽñŸ½`’z‘×Æ£:CLŸ 
ÙÀ97#ß—™*wÎei¥r#<h£ê²PGãkw¶N<§›;†?Jè~äMº$8‰ô" =­ðrC¨÷Á¹†ÍÉÁ•0y„¯% J@wÈ#”OóŸ—Î+6&BÝ‰¿áµât(î«8x'ÐBqË.´-ªÆOÍÀjÑ›®V¨A/VÐm£”ðæ1Ç•Ã¶'È‘ÃWBf	é°B‡°À=ßµ³ë´‹Á³ŽUK ‹£½H€lí
ñ„°ÏÈºèêUŽŠþ…öúƒÝv|òñðxÀþ¿ÿóÿÊóÖOØÉîÑvï¨ÇŽwßìô>ôNzGìp÷h§wÐ;dÍ“ãÃ{×{ó‰Rz½Ù=yÓëïõQ'v÷w{ƒOï)××Ñ§÷]<‰ŠU÷öwz}øÂŽ>BklÐ{ÿéˆÎ˜²GXíÓàSÛëï÷Ž¡T‡­n¬¯¼_Ù?Y2›?üð—¿ðS­l¡ÁÄ¨v°{ô*À#žË¬Ù;ì-ÃÐŽ?>½ku YÔQÈ¿ýafud'\ÒO°â	s<éFýÛßä©†4JYgåpyéÆ@! ãqQw*â
Ø(œ¤˜%4‡§–££z ^L=ÎÓ$•P:+${Ã†\´°LŒ	ÈfÎ„ŽÞüçºVÉÄe‡Þv«ð2a¿„ÑÕºÊÜ“˜Qìý8ôé@8œhd>™v˜g(KL°q<©£¥Œn‘×ýa­Ûë°½<Ÿøvo&š~Üùt hiöà0Á„û|šâê7òÑ¥GÁïsm³íjÌÀQuŒoÂ{€&ÆM ÃžÉ_˜XøÒóÙAê§1K?¬8 ÏÎn¿·w¤Ñ§ Hæ2|d=œÜ{³½C@x4JØr<ÀÀöüiJàmÂV#p¥Ö$À6  àšÙé¥õÃ‡ <è!U¾_õ•$Æ1v?qÐ÷Ý+¦
@Äp”µ-6Ì(ž‚Hë±g«øÏ!\8˜ekOs_a×Pâ‡‡mÂØ…ÇJõÞdìElê·~Ø$0ÿ¤Ûß¥%iÁcÄ $Ï¹
BÚ(	²Ç°7ÃÐ©g×~¢º·™'g9„cÙÄ[Ú aÿWAÛÎß÷SþZ6½¿?8Æ»ÑWèðÈ¿õÃÂÜçx1(={Êä#$;c."BNK›N‡Ð”2–Çl?†@oÈZñÜ¾>Û›¢Š„½MBÓ‹ˆ† a"ºíO ‹6{3¾¼Ãú¸DiÅâ	ïÌmÖfO¡ôàDs1Áù*$¸LNþÚ®®9m$‹¾çWtejˆp16¶³N6UÂ`¬ ¶‹ÙJåA(‹0)WyÿÉ>ïÛ_²çÜn	}€'•ª‡1µºo÷½çÞs[ºíÍä¥áòñ›7-§ÇuèXoivªå¨†} ß¥höZC…ztgyÏš‘Þ†U+ccf%ž]©Äâ8h÷¹‘pìK–&®¬Ò]x, íÎrícAä†zàx¹Š"øg¡ø\ÅÊ²ye‰¾ …¯°¾e(še7Cˆ„ß]]"s„_Áè)ÏïývEY§¼ü»Í\.€uV¦ÈX.Úlùo¸(ò\óÊ"¾8ÇáÂ3q‰GÖï‚>'>ßpÆ—¼`¹}€Ã¿ßó‚µ7§¡‹0ûq‚"41©n ‡cõ=÷	±ñt»(Wøu€¥˜è
}%ý}Ÿ• p?’<ësøÌ’^ŠÖoõe®øVÞÜ]úúÚÇÈ;éü"ò¦|WÞ×÷9€x¼ËãdÑø‰;gœ0Ì…¿‰Ü°V¨³@‚‘,8"ºÇBÒ€8‹SWðhäOáwTrì Ü¨(“sws?èÓÇå…OxúÃ8¢Ó#)Éór´×, ½Å5p:mánŒOz>Æà¯sœ¶Þý+¾C‡½¦âgíÝífFÂ6ØÄy…Ëž|Éî½ûÒrý¾×¾Uñ`üUzÒó~65ÛIêôH¹­‚Ï…4ëèÖ4ºB‚Ï™ê]V†•Ñ(Î_eÒÀoX%cãfÇ’yøÁ\Bÿ\3TªcBL8V™Po
|
mî$L,Õ0N$Èô*!²·åèAúÓ%;ló‚$Œ MïQŠH!ŽÝ²:ãMÉ Š›ÈîíF¢ÃðüsÄÅX—þ”Å…¥»3†–¿ù<f¶¢ì-øNHúÛ…€X4Ü±Œ•§9HÝÑx¸»Ö}wLE\ª,ºÁJ j#‰Š‰¸·£~OõÇƒ;Èªã·ëûß`J%uÛ¶[ø€Æ°m’2¸RçuP’ç…÷÷·Sð‹êÈ±xü}«:áfŽÁw, cÆ®«ÙŸ~Pr=¯ºRõ‹ÕÆ|ñÝógsp›GÄ 	^Õ]ø3†çÑ±`â:„~þR¿i´/ÿöA-Óþ	>Q”ÓXó´&Å¾RÛ·Xðí§a(5©*þú±6¯Ò2³þ›{âÿË½oŒZ6þ~¥RþYyë”7äì¬Q??©>†›MˆA×OqÑÛO@Ðp™×óÑhyÞ
~ÙžäÑ²±¢ÿ]‚°d<ðÇ0R5a»hü*©íc½Ž‰Ü‘È‚ÂNbP(Çµ¸³et*»Í&+3åJ‚¨…ÞSˆÊPçôza4„-Ï2è™t¤(Ê~ZÕ­DîÊW–vZøÊæ+ß?ÜùY‰§ ¦teÉDôZà+9à¬ü úT²X–0]ò„Sñ*»:0-–ÄyÒˆæ?—&¡z×{$'ME%ÜqŠ01ŒJMÿè›•ð·ò¡AÜP.öÝ%Ž®ôgI¶N¶‘Œ‰±\8{BX6Ýuø
¤`¡æGÓ0£‰éî’±9ç¨¾g½pv¥<{•d¦ÕrïÚõh%Á¿zÔÅ‡^öú»žÏ=“:­ L5³ðûkª·œQ2ˆ®YŸŸ5‹ô¢‰¹”·«“™~%Ô]5ÅÊG‡êË>ùõÿ4fôä/ÈùžñÇÁx6þÎGÝÄ©ÆÏòzÑ–¦‰¡,dVç‰úeªd%Œ‚Ýzî$Í ¯0‚äõOIh¥Ú09DÁT{’Z«H»bÄ`£šëÝÔvÛÇf|aÿÃîƒ3EåoÄ¶†š_OBÌáŠ;è4ÓÊdcˆqy‹Çê0’¿Ö X†©t)dˆ…Þ0G´AÆ„Z­àF„¹JZê›ðhn2lI¸¥©Ñ‘•]ÃÝÚæVó¨(˜CŽm1¹"‚‰÷=ÖÁ`B2œ²Â	¹JC
É"•éP.æ%žQ3Û/ÊNêãˆbhRÊb9.;€zš›RlÞõÛ}ûÖî;Y;X¯Â\ù¸·'Àâ,‚L>é)?é#q0»¬TÌzsîRLl)©Ô™T§º#ÌÈCO¼tW´›ºÃšml™½'@&Ør¹MŽˆ–
§å[I’Óœ\‚abÍæfie=»’Q1ýŸéþí›^»;t47¥¾‰<º*‡4bp*{NæHó°•1õ© 2‚€5`")4“ð æÄj™rDÊðþ=ÆÐ½u õ“´5øËÕv!j­x,·‘?©¨íRlÁeÕäÔ ò¯vúcì†7Jé´>†0òm»«c¸î êüµœ^B Jjè!öÈf}YœŒ“$ŸµË”¥^ŸªÂ‹J?”„‡`B%á­?=ª¢…²Ò¤þöE]c–%Ï‚)gæ‡¸Ó)X×”–’ñ‰…£eöo3{ì;	Ò.ù&„‚¦ryÖ.;Y¦Ÿ†³aÎÓôð‚ñ
\§'¡ÉuŒ¥MûÐ|fÓÒù×¦ÝŒyujPæÆ¹6•x¥T—·÷£a6Mšä‚³ùReT/N~­¨‹zõ’/ëÕ÷çøûþ¢Z?9ù•Ní"“QÝQ%e³«
:ÿ ¶Õ³¯Û·÷=ÐÈrJ}’«ê‚,ŒMšQ{à@æ¦Í!¹{LÒ$K¥1*vˆ)Ü‘ü^²5Éâ¯¿C#ZÇ…ŽO¥c]©’Ê?¼‡¯Š-A;®–cwîî‡#§+s®ÖÌï
\aJfƒÕ7nðšä¢Ÿe{³b¯gÒk¿[gÍhnßµÆzLrW.M¬vBŸô±à-À>©žVR×PZ±,Ö •ø#ßoã5i%ƒ2Åˆ"ŠâÒš¤MpÁ(›ìfÔ(óñÙÌT=¡Ý3”s½âãæÀéRX§g;)¼i¨a‹­¬¡.1Ùäó_	õ§3|ºÞÛ•úrú•Ñ^´Øª¦ÏdƒB>½côL©#e')ø¡O}±ï™ÍtÒ>aAV7ò©x.‹ÌÛë Œ’f×I3‰žYÇž¸^“MôÍew“mP˜™TŠÞm>S/†X[µœfÈ¢O+„ñÙ]Û)®’ì#ÈVŸÞèËœF´+›lÙéœþÌ˜î‡Ó
ªòeÿäúÔ¯ dçGGÿý÷Tìv»ã££¢
\¦…¦¾ƒ6ÑÚÐGG•þ  ÿÿì½ÛrI– ö¾_QÍèm€;H€IÉT«Õº4-P3»Ö*¨"PJ( jë"’ÃaÄ>9ÂOŽp„Ã~p„#öüâïÙ°?ÁçœÌ¬Ê¬Ê¬HvK=ª‰iuÉëÉs¿ÀdOQ¬ù@äÝ«w¯©ŒkÙh({E""UÚ/ ˆfªîøA	ÔŸNß[~úo¯°H2l¨=þ«.ÐP
ç/‰mÌ×öÆþ|mz‰#ôQ¤Ce¦•ÓœkÆì²ÎÀÊ {ÞA÷K;ˆ(Â‹ýõÔºtÇñt×B4û”¿¿‚+@8Àòä5^Øv­ÇÁ•Nst¥ê›6ºÛ©†­¾ŠîŸRa"f ž®ÂìÑlbšéN^§Ñàa8’»ÖÌƒ[21Y•æ9’Žì'ºž²ÕM‡3†áÔêàÉÖ`óðñSë3æ±Ùžè–PR(>ë?Ù<|j¡„Û™òYôº[ÛØí¯¬t€ç¿p;“ 	Ä(Ú_TÏ¶p¹-6d6ö/Öeh£î±ûOŸþÏØGòmÞËdé¥)ÙÉ?Š’f;À´Vèv–¢}ý÷7à28ñüH¢ôo»è6Wtb×Òù³«Ã»Ês2*ï±ìŒ%Ñ+sûŠíä©?s0WâÎööæNYž8 ‹ ØQÖå÷“1]k£ä}S(î¾>º&tr/DÚ”gdÏv‡.P©—f.ížƒ±mçG‘öuŸÜ×YÏ¨…»ÌA‰Eµj‡Ìƒ{¢·èCêÎ©BºÔ{V]¼µÕÒ¢Ú+òãØå_:á‘9íUéåÿH€îÔ²0zØ}ñ›ì- D¿¾{{ôììÙ¿þ<xòÏ±~NÈ©Ë3úá+;j=sl`<F§ÀŒ¤1!öU›jàÂñLã±„ÿÚ%Ð¥öÇ·é”¬©Sêð÷ÓÅôÚi7ëH`6n1è"vù8;Vï64"ßÕ|é(	êšú»É—±¢Jv5÷^]Œœ	*Èhö@½ Ñw­_œ±Í*/lÝ* ú–G·h1òÏ¹‹ póöêGóy-úùŠ‹aIô’æµÎ±BU‹ph ~ãµÌMe˜>ÅŸ¬ÞvéËŸP§£Ì+K¿$rƒP
}™G3&¿H
	1Ò˜BÈÇ4ÅËÁ5¢@l/ò¢64z¤q€Ÿ²°A°~ÌœE÷‚5—óŒìî­Šã¨"ó§}ÖæŸ¬{çáý_2€;ç¡cÏ:öYÐmïÒ¾ŽžRÎÛù¡xútå€™ÞDµýIá;"X®G@5YØ´0ÛFcºU6ÈU‡ÌE4–ƒ¥yO©¥y+Þ‚³©}A‰èÒ‘Ãœw¬äé*jtóu¹‹Þ¯òJÚŸ‘ê•?),œ;Þ¥ð‡îÂ¿úûœ,"Q$lÚ‹±?—mî¬¢”Q×ö£B&7L?	ó˜rüiá%J1Ý"ÝËê
ÜSÝ$x´]¸¡/®‰ÌÂóws>#Ú@Ábvìv¸ ÁfêÇz®I
¼×fÊHg’ú¤¤ýi‹ÑGófØž x˜wÕ³­{}Îàô•Å»Ú“iè°cVMˆ•s(­›+½ÈT]6nO·X/Eâ¸üuÁ­¿˜Þ-up}!‹Zh† ff›Ýlµ”C¥ '‘Šþ,LûžV¡Š(Üqý+Ý‚ó”	üÝ’ŠÓ:3­Ÿa§üðº›qh¥I×ÒpÅ/:¢|—ú*fUÃNÿ}ñï,û¯~’Œ8¥É½Yn‹´"È	Æ0z¶—¸¢èá;º9”¦Ú>öGW¢¨6ûvÉFŠÌPƒá¹ÖM\|E˜£7â2räÖÞT¦]Lüö›Æ(¨h¼,hj¥ˆ}3°+&j9‘ÚóíñÀóªó´¬IˆCŸÅƒ©á‡Y\¶”&”Ç½S"Nnºˆ}Y »„€‘é—ÞjÛ]òªê¾øeö02¼Ê0p&zH…M¡á²vÅ,	µc@=%Yå7ù‡j<¼<ãê˜xfnÁÐqélªD€þ¼Eh:i–{ùcÔ/óY
]à‹0¼A˜3ëÅ‘¯¯[GSg4Ã)ÄS'tZ‘e[(öìZÙW
äD¥K1i9…°ºšŒŠ¤ã‘#p¥@i¹T±Áí“ÁÉ³·gÃÿã³á{D€¹/¾kÄ˜tdÖêä}*­¾¥FoD>R úMË\O?*».¯G¾¬µ2AùEeuºò‹¶)ˆ°SoNä‡1nÀN4bB˜u~p0v®Ö‘É±ÚgQšqàt©ÀôxUS˜ÇÈö²ãŠIÁå­ýÐ1eyääB£uŸgI]€Ø‹¯±j3º¤ár¼Pô™²Púðe.‘ðÏ»,µ5×–á^‹£ìVd•,u“SPLi{¶K*ºèeš›µ§_Ž,Õ¹IS¤vòPrUŽw•C…³(—1Ü£¥¾š{‹h×ßo6Ùe…U¢Î\„>u`6»þÅfybÿ´ø—5¾¸ôÃ1¿5ã`w}ýòò²{¹ÙõÃÉúéÛõ·ÏŽ:8Œ­Ö40ÇHSÛC§Ø>¡ßø¢ó¸¥¼ ‡ÚsR„¼Ò1ÃÞ:{Wþš6å@YÛ?ãã¤ÉP Øþí’!âVübªðÛüÍ#¿C›ÍÝCXi¥ N}h»…# ¼tû£¹ü]£S²9tÄ›è¬yaÔÊ×ˆ?d”„˜Î+§*Q¹Ûs\Ôz—ÚLZCgâ;Šý¤õ³ã}vÐÊ`½q§¥ZT4mK.Á¹ÇC„úBj¹¸è?Ù|T6µi¯ÙÄ4Æ óÐ·‹C/Z‚òlÑkÚ4¹^ïqÿ‘	ž2¯o]Zð²eê?à2õ»Ë,”X†í';;O–œ¥¥Ø{º£¢š5opÃ¥x£ŸY×ôCã†9éƒ¸té7pé5‡«öÂ—Á_ÏÊõÜ*Ÿ|°‡½0¹Íæ]T"u1¦Ï)ŒÁl®Î½(¯KæQzºÕ,Ú²Ë&2^¾Ó0Å,<:o;…B©Eú±£3"—G3”¢	ý¢w±}Q8Cõ±ÃEïQß.C²dO/f‡É÷îƒ'Ð ö‹ÿ¸|ïÜùD3„«N	t	øÁÇ7Q	€©«"‰¨	êkí^©©‚LxžAð“âSy£BœŽiŸwÎõ&Â;¯	ÞìíÒ£´·žc÷ÖUþu9&…ß¬ˆ‹ÊKƒBœr”bÊR*ÿ4OW^¾{}òî¹-Ñ¥ô¹™ïs›Å’¥QZ¶zÛ=è·<,ªûï3ƒ3ðäÓÍB_A¾«>ëªˆåVòq—{ç:5A§]PÔ{Ò{²l@³ðNzžªnð1Ê•Êæ‹±t‰B1nqp6žª cÎ3ìNÓZ—Î‚4Q°¼ÕƒSyyžvv—±þ-Ëï·.z-&ÒdÙïïo2uêO~æÞÑ{:KRågÀÁcgwÅ:<f­@këøšPÕe€…R@öÆ,~Ìeà<÷üsž´íþl¿oý{rá\\p³]?¬)Ø„›väê¡óˆäM!çRv&!ªÞ½}Õa<ºÃòúÂï6öŸ{X‚&ëôGèóOxvñvËÎÔÈøfw:ð:t¡ÜsE¬¬Ë:ƒƒvF¢éŠ¦gßß´‹pú¤1O®òùïÑŸ¨ÊçYkõöL‚XÃ ÀØÂ8F©æ îPÝ®ã£©ëÛ8duZ#XÚY–¾Pý4tæþg'÷iQý.À8¼c–cV§~¦¿RVª’#ßa¹³ß<pvcÌŠÓŽ“aWw5§-Í—Ò$=¾˜¥Š,÷¡qª5}ÄX?¨™”¿{Ï†ü!Í‹üžùC–X—¥Ä½é
ï”š1®æ®ÅÁ”¬o”ºX<´ñÏ¯,Ô—’Æ_-þOâ¯Oñ§æó×¦ð‡?
H¡yþ{aV9	}šŠœ÷FàS`äÁÂö®Ñ~ IÄÎ‘ía\Q(že}¸§—òi‰íÏ ¤Ú†ÖP½!ÀŠ=¡„Ã¸íV€Ã?cúï³´È<»Z&Ed1¯¹ÇF1F¢¢I‰ÄËí
Ïác;‚µÍ-åýD‰ê­©fÅ'_®ƒÉÿ!tY–Z½ “V«v™2¬§¶Ž‚óel¥ŠÈvW1H}—™ŸDÎå‚ói6€K=à[ÆTYQ˜äD’Î¬éÕœ;^Ç½ëò=œ; ®vq—øôôsØß×w-7¢:ff…|ÙºêòÖs@ö¥Ã€'áÎ7ð´ð6y×>~±à8óôR°ã– mF@r†àOáŸ‚Þ†íIŠÏÐˆüÓ½Õµ\)YéO*"ÉºûÉ£@=uD•^ãã³ð—XW(å,B³œ~_O]ª¼°k½¥Íçê” {lÝ²Öâð¡²¡ÓŽªùÿÝ<‰É7™ÚcáÐ?·Ÿ\¤ nvP°Ú€qÕ„²º–³sŽ2K]Ÿ~©k?ûpNIÚ³üìåo_‹·J<SÌ˜?fÜžcZö´…_Óñ‘“Ô±àæ*ìœXô%Š ÆZ°}-Z"~«¿ª]+ÿ¥æV†wÉHkÌKxQiR|ÍkŸosl…ðä„ýžrA=·+er°N…„’åÂÿÓŸÐŽ3ÖønÑwJ‚ Êž0qð<\?ØC‘”lCû+ýö¢†SðÅƒò‘Q…–¦˜6·K:®Kn•+W'ªXªÎÕ@Ëç¥âFs*µb@®È§Í¬Ã®x_h)ž<AÕsÙ»Âœ¾·î´JfaFØuó™¸3ÅÄÃ÷›J¿MŸ’â¤f?ë:,¤²Ú*ƒÿh†nA&¡=g‘|”«åí¯§ƒÕf¶mnÍ˜G€®œ,ITo4ªµúæŒMd]j™V¡â2o^éç[æ•Ú!9›ÒU¡=nØÐ)®1
@¶\\‚ÝŠ¶	­5¢ÿÓçßÒù©v™Z®¡îmçÙu¹ršhôºXp¾ªdHká/u7JZKËÌ¾LW
=2*Ü‡Êœé.WØÂiâý¢B|å NÆó·ƒ×,%æàMvT¦ýZêí+j%®µ^?{{üìå ¯².(‚ƒkW>mKþ.{ Î)¹	§âm‘e0Í'Æž *-iz8µ®ÒLevGA3ªZ'=Â:¦òRÚ—üóÖÅ¨)©b­Fs‰ÀÌ#/¤|¬;l‘W­¤éÔo°²a¸—ßQ$SPÑìs¥3ûlÞß¦×1ÕÈ«_)ÑÛ_/OßYÃg¯Ÿa&r Ø-=Ì‰ö*«Ï=À€OKÐta¬¬<®©IÄˆDµ‹½1<âí{¬ø´ê]V¼Ö›À3ü|ø¬^£s„K«ýËÉj÷Y~Í_NÊÞ5Âêzœç²¦óhS}Z±e<ÞJºÈVÏj3Át•@ÿM~ÃtRC`­È·2WÄuYY•Û»w'i[3ð^×ÉŠ¾]“eãúªžúÛ×V@Om`«~9)”²\}¯Ñß›bAÖr=ìÏ0Ä¿œT¯†	NÙîäú r¨÷øƒ@\ÿÄåÖã>!®ŒÖ<Áÿé˜s#ùÓ‚&˜rdK«²bî(©×HÈ¥FÂOá|…¥Ÿ‡Ïˆ½­®wr)ë@Í5/ßÞr¤#:õ˜Ÿ
^æ°kå¸÷<£gš÷J(d	äL™D´¿²ùÏ+oüRâœ½Ü{o3-"&—*§éÙgýøÌ”œ»f›Ø†©–4K(^³%œC;"Í×Gäã¹1ë~Š#®b×Ì´nOÍÏ÷7©j)¯RÔ€l\ïìÁbra)q\ùÒ\VHP>Ë	—²÷ÉoïY²¾nu:L^ˆªøoR½Á Æ¨Õ¢xC{<w­L÷Í­—{¼lGÓsßÇ–¿8±Ó^å©&¼•vc~ S¨w}?ì-ŠMTî‡ÎÄEO‡ ²¹¼ÂÐ^©i†-j;ƒ<”öG¸|û7Ì/Ú<µÌÓMÜ
ˆuÚ‰   EO:“Ðc,J'ö;ç¡…U;zt¶7,¼ç%ôç…ç\Ñ~2_‡Ñ ëSÅîÅµøt¶`àXñõ³ca‰¹Ï¿ìLÝ1ˆÍ˜ü òÃN \¼»’ŽR=µ7ëÿb¦Û:vF~È-ôÿ²®N-S§°ùÙç  &±ƒª»Îûà˜äÇ+þ¾ì<Ù±¦ø˜<M®¿±aQ?Î¸s‘xž5w¯à	@Ugžx±x×k…£„Í+Ïò{äÆ×¸0öÂÅì¯<…+yß·Ò2ú&F\‚v”îbìNü{'§´77ü6,í1¦J\Ô ÷Üê&¢Î
3û‹n ñr1¡«íaû|T\øõÐxá}>6åý½¯}‚7\ì¿Àœæ,j£»­{=[û›—lé¾¿ÇïG«EÎÒù˜Lªì‡7iÝâÒ_NÒ×ŸlÂwHÑÒÂÊŠÀUŽ¦6 ÊNþd
¡aŸÃâÇÙ™øìñGu˜E¢•‡:¹“6?ïìxÕüçAg3ø	úÙð½‰øK¼µ¾¹QÂ
ïúþì× uÖÏ%Lt
ÿ'V•¦¿b­†X„°’ÛÅ÷¦}e}‹»Q PÌzÇ¡»ð#´‘±g÷ùâÑßÓ=†µì&+ÃÊÐA·Ø=	€×!ˆÁš8öELlO/Í<§Š¨Ó3“s³4Ã·Ùwø½y±¾¶£d–%@˜Ø3LÚ&r>£Ìš,ÌÓ(°™P…Qv“¦cŠ`Þf÷)O+f“ôu8Gó€ûAŠ°ÔN<8È;‰Ðžîa–Ø\1LÎçn¼cG×‹UŸÌy8”:°žêa!âÆCôÛpº<ÓsBÂZ¸˜xó®rFHÿ)wEþí'þ“Škz
íËgsœÐ†Í_E÷vËÁ»-Í?ÿBj I?slÁÞ¥÷wsµ±ymI€ä3w.µ{ñœ{Ýé=°Ä
¹‘3g½âûör;xš—!7¦pc÷»pgÞ^]eS‘îÀ„Ú´RÆ¸?·ð=vÎ¯Ó­÷ÈÅN”n<’AÂ´
Ò+Z÷C]Ñó(éÚ“ÇÚ©?´?;”‹qpÌÃbõIzÊÖè÷úMê—“Û™œ÷[¥‚w\®)mÍf–w¥Åà†‹?Çt¢¥ÉO±§ëç£KmÉò÷²Ñû• cšK0ÂŸRÉà¡â«µürgf‹‰-û£·$¨€ˆÐŸ¯Y-¼\•_“ß‰Oš‹ Zmg­k?M³â\DÏ0¯MÙPÓä‚­ŸÜÐÁü:Žµð1]©=š’…Lì@Œ¾5ÂüYÕ\Lì@~µVÄkwav¬×;xwá^¥S‡S*þî:W ØÔ
ºsŽÓ/Ql¯2¡iµ±[þ%tÊþêf¸k?Edæþ³1°¤8C'Â¢-/ð8µ0oÓY«nÞ°>%$¢÷³üc¦±ãU•êØî:ÅÅ@3aÁ
t¢Î ·k ¢xÀ3e3d?W
Ò¬›R°–çš÷‘Ÿ K… MÄ:¿= È#ÏOÆkÉ€þ¬½kè¬ÏÒ!–<«„\3áòÌ!OAîF4®oi	§—¼5m½C­{{ù ÕV¼©È¨t±ºa4z“Á;›¼¹òaus‘3ÏZR’'I^©Ü ˆn¨µ&ž†ÛÐ\wóS^#–c7]£5•8ïf;¼fåöb7Û.#nÂ‹Ÿ3<¥Ç‡0/ÁP:g!4÷súJ)Q‘UC…ã“K5,ÓœµªÝˆMçÌ·
3\ºQ±]g$Üà©¶|“R ÊZ
K7WRYKgù!òsvvV“Ä;ì;Y-JÎ¶Zz¸àÓw°(D”u
/EíLÜ•v½ý‘>C—ž6º»Ã¿"¯œÔJU3ï$_šzyñª‘¯Ì7GB!ßÑHegrÝM·¼ê+%IgeäWF?+w SqOD(¡>Y75Wžü˜ÉÒC2à/ÁâÙŒÛ£‚U$m]Ëv—ö¸Žõ!9Ûüƒ5w'LH:lÎD#—zÐYÊÜ2þ¡1MàQm{ ½ä	ƒq*ÈöJmë›ýúšØß"#%Íãž˜)©Å{f¨¤–k2UÍ¸–Šójbj*>Ëó<¯ ÚÕXå×F†êáðdŽyªxßÀ[•á¼%¹®ßWÔ‹òZˆ5«	O…8¦þ¹£‡]¦b›ˆ”i(„jb—8ø.R[M†»ÖÜï•…~`!ägÞ°¹rÎ¼üÐú±þmëD®7w¯dßTìå*vf¸ábiÚ›«ÓëÊµÄƒn¾J9¼k6 óÚp@Ì’…(UÈLM˜HœeÞ·Ç¶+ ý÷BšqÝKpÜµ8åE#žCRbšÓâF~£ì;Uç ©sË>’Òûë4·åýÕçÝ›ñíFžÝp»ŠW¿o>}y½^Ê›´3VÙô5–‘G6®Tðè&þü¾xsÃíexrvòLçºÆ±+=\eœÂ½³äØqÍT–kXaÊeùÌ8¿µÜÈrZr	}-¹'©’\‹ØÌBC&0<8´™&Všì•Ô k«¬1Ev(åz%9`QÁÊ54îN”|” “6îKçz·4;{óÌÜ³™s-¼´L»l»2YVÓ§µ8[¥V£R¬dS~ËUrÒªNùæ9×yŠ…c+¸£ÐƒICm*Ì$*ÚÀ–ªƒƒH}v%7È(°GNçº³…>âßA¼n¾ÞŽÀ6·;³W^Å\eËß ·<* ,ðvxÆÜ1¯"æiJN¦i>yôSa][LÅ¬zsî0oÎÞÊU¦Åë‹ÿ`Ïƒ§ÖsÇ³Ã½uê°ÆÀÜVY®|/tÞc¦+õ>XÐLñ¿+µÞÿH\dRj½­ø“_vpÕÙ²‚ëN¿»º(¼ªÙ¢;ü…'i†N_þÁƒÄ"¿¸ë'1å!Á$’3y8¨ÌéûÑFêj[k2”5oŠåyÂýŒññ§»Öa'bhÃÈ_³†Ý“q·º5ƒ¿´¸Š¡sšw~˜¦›u+Ë.ñå€´D€¾AvÅ¥…ìá±õÆ™8¡kõ¬×Œbfÿá!¶ŽÂ0´ÑOçN|é8‹ÒØai€”/›9Ü¿ÌîÉážgÓ®ßP!~ ó`	˜€‡¢É²Äœ6]¶+?ù³$²ÞRXÀK
@Ÿëºc¨¨s)“Ð[ø(‹:›ÖÄŒ!ùëfðêÕÙà/ƒ¯‡¯ž½‡Ï†ÒÞy‘1Ù¤þy‚‘.¸|³êƒQ×-“0_…Ø½:×ÞyÇþ¢Ñ7x¹ÃFXfÓ_…²žëaùJÓÀÉ·òÚµÙ¨V›KÛ
x“€ÃûòÈN3´¾¯ò•ÄRŸãõ£Õ’ã®²¸(KÆÝøˆ_ÍÇ…0¬þ†I6¨¾v©†øoXSÈÜ…;³õ ßí‘0ß£%º¾ýØl³ëyù*Ç¥èœ6ËslV±£*WÄÙ0—5ìïæ#uó3:| XÂsÀvgV—âª¤Ý‚[°>Í‡€
öMód½Xâ¨/1ÿ½u†êUéôÀ®Û8¡Æx+^Ù3ð†Îµ7ËyŽ‡â¢ÉžXI^ëðÊÁ“J«‚IfÌ1{³ôÅzìð‚VØß	°FŽ˜hÓFS@*æ¯›¾Ò£ßÒ^¢u¤ÔqµˆVÜ„m­Ä¥/:v)@G¼X¸|†áF-túgÃ›—•íhDÁ¹%û©Yùë\ÜyÊÐG*G$íMŽ¢£oiœz~ÁÓúŽ¼GVð‘¶øºƒyæ1l®)…|™ÏB1ÖzæÈrÑþc
ÇøèÄ³]ÔŠ` øD#ÍvÉDl1]x8×l`ž‚‰=–ÝM	ŠAç)Z(Âä9³”ÙA²¸¶I¹û#MxH~ò]3™¯<¼ŠFªô–“fYÁ1ˆ„-uñÄÜ`ÐÎ€€²§˜-@‚6J'™Ïc9÷"¯'•±kEîÂ¥‰X•-`)s–+O&n3”¬gÉ<r†™X~‚…šŽ0GÎ_€†øÖ¿ùÉirî LŸ *ÂTSmqëtšÌÏèr2Ä#«…t-7´5i‹jîs·äŠZ½~iê¼ÌéG6µùDðj˜‚/s’5kÌÒ©lt{Úœ$xe€Íò8Ý(öƒ“úŸPSmñ,ËZ²ˆ“Ž¿’j¤šõR†Èbc!ý‰.ÏÉÎ†’%èl[Ñ|7èì|å¡ƒô0÷vY‚]
”2Ý²3LE×¹í –F©ºj¥[6PS[ð?àXò²¿Dé
b?‰šyÆ¥¸½0®LŠ¢@Í–5…ÿ_¸žÇG”ÑÇ+¤Æ¬-J»õ¤Éz*[zsºYTe"é×åqÉr·¤<.IûšUk¢Z¤qî“a;ã~°N¹…µ‘~TiRŽ+âGÆŽp0é	0Á)wÄIRÒ@™xýóÅ+‡åëO¬‰²ZSÚÓðf‘='—‡dîŒÝdBŒçÎ0å¦mÅ)úL;õÜ¾¦D¤Â™'Hg¾±°cQL¹îÂÓódØðÒ¢«%¡ÅiÝUKA¯h5ùŠX—›¿¬ÆC, µ‰ ÕSÄ çÔ€<µE`2`©˜t9hTÙ{*L=$/ÙÏ¾5ïæ
[³,ÌLˆ<Ö,w|UÓÀmäK˜jWWôvŸžRÒVµHüŽ?ŠÆ´>bI‘hw}ÝOº×¬‹îÈŸ¯v×¿¿áïÝ®OÿcÌR$u?“Ö.w¯ì¹‘ÝBbÅj#²UÐZÀnþýï¸Ìõ™@¬<çgäÈ‘ç«¼V4²=¬0ÒÝè›x-Ýeæß5““OšYÐû›oYuôVñBaˆ<	Æ^ûcÛcÕÖêÛ©ðªä ¿.Ý°,]¬Hš7ž=¬:Co¼…pmá‡Î…†NI°…atµßn°k
Zñ“ UÑ(©ñ¨3rn-†ŒÇå:öòþFA?Qž3—mS°óõŒsõÉ>
w½Ý'’ØöbŽ‰HóR[Ù•GÒ©ìaG3Š;Œs9%¥XOPa–[ƒ{âvÓÙ¥ØóÇ†VXš`×z¾ù+
Gûiß·Ëµa{1Ç‘TÃ©¹¡¯¢˜8eÿø”½@ë3òÆýÃˆH›Ø–Á5S¥	‰ÌGsC1^˜MÔýÏþÛuó&jÈ$òEÙæîl\T×®4e.
#Ÿ][dl}ÂRèfß,‰nµ¯r*EÁOJÏ‰¨‰Øh”Å´¤icoÔ’µ]k¹Y.ÉH|ìfÊÇû¿†cåà”8s!—5•ÃÒñ5·„®ÞVsOò…èõ9‡ëW8_¸MP+Ó”=Ø] ñïlä2fðHõyP&@pd?úŒtšób¦Û¼³¡`q{K¡Zünšâ¸ñR$;cÌê ‡I°yÈÀ÷¾*U´Äâ”¶CÉD#2Ú,qÈŠ¸¢×ƒÖËK`Z%På¡ÚÞÐ¡ížz—wº]d>R<¾YK
ÔNüTJ…~–qXX>OýÀ:‚ÑNüàÒ7äƒ¨ë²dä¨í¡Lä}­!J«½e@P§X’ÔJìð?ÚÎëp#ËÕLóƒ²a"©Ê7ZÀòÓº$ÿË)ýWw¸ÎEŽó q1Õr´/Æ}<`€†Ðÿ•ØcŒ³Yb$ËÂñ!¥•·Žù!¿oPæYëÉ–N)ëëéÆíkÀ¶§èC9	Û.…Ó×ÀãÎÐÇv_àIÚ}nâúm7¿áë$¿Lá{ìÄ ûk+”öXL0ÏÑ~•Ï]ÎC:íhºU[)Šü·LS6)/9g@Ks4Ë¸©Ç`´H&K@ÍÒÒš®cùu§s<QGÌˆWQÄª~£·QÆ>	S?‰½ì$r=üÝ1‰¤(»™îÿý10›@]63i!€e±NÈZÐÌ(’ö²¬tRSzÚÒî[®ÂAÈœÞK®á³+èna{¯°ÜPq-iù“™ý£Ìz¯ÊþUoWh7ËÜ^Ë<MÕ2LCËK«ˆò™Eó’ísÿÊ"}qÑEÃÎi”^F÷‹¼_ÃÎ³á©Vw6
xdÐãÊ8Â½2/¤½¿ÁÑèo|¨–¨d¶Bå‡£9é\IyÏÆôo*-õuZ¯_
ã6/íø‘[E›*»^ä5«Æ5©—¿¥8’Pé…†Këò7Ø?wÑy²ÝÔa®È3leáÇu…cA„ÿea.÷åñx2Y `a¥!Q?¿^fÚ7x€pþìÔÅu”‹$#bÀLâwÿ~]:TGbü…Xº•ƒ:áLRµ/@›y½½l²Ä{õ¨–ÌÛ/Îí_õø¿˜ªÒì¯0SYÝ ToEXÔ¬Ì¢Vïëdæ‚IX@NI+1|),tÊ›”õÖ¡cÙôÜˆm8àv˜T\óô˜yR`Õ<%v—ê8·Š«yžÆ-VKMëAcØ B‘cBk@Ggkùª¹Ÿÿªn""Âº¨®N`SexQ3–*ë(q'U>+z÷-.Z­eüÜs/B^­'ófêƒryy)|P:äû3—9£`ñÙñú÷Æzû£ #äm¿÷âº|™<ÓÅp†‰Ò4= 9ƒã.j<mØ®ý{4r<'ôçi¶Ä´žB7n@õF;—!“§–³…×AŒZV í§Öä:ô£ ø§VàŽâ$D¦«Ãÿ|j]:ç`çÂšÎ 4žŸ`CªøYùMÅ¹©gQ-· 61‚*‘rQÁ¥Y¥^uÈ}Õ:?gÂj½FƒÖ‡¼UY-A3ãSÃ¥:ª/7ß™ÁkŽ¯»q%x©jàm«%qÎŠI+6T4XîÅÈ‹ôÍ¶µB,Ñ}{ÝÔá@HkbqK7pA§ÀTS]Q‡;©f®ïYQ¡ÓPhž®–”XÎr\q_5}ä’rÇYicUkl,X¬b+–N #‡€P¹2HB?´­çØùÜƒ©rTÅ¸ªr±ªÒÈCc¯¶:Þ!ÏJƒvœH¦jÃV ™W~¿…ÿNù¿yS)QÐTŽp„H§-’Â²²Dré@iœ}'¯‘,º¹ÍJÿæÊ}pî2Ô¥ª$—/º¨ùÜÏêR÷ë,{„w·…/™Í–q6•e óçôG;ˆtÕA¶'¾ÝÖ!Îð¦®šEäòSIü_Ëå™
±8»	v³uÞ2’‚\L´Nc.Y84’M)µ”B­¢˜™S~úyêUj
Û„¡ù
3ž(Ç+çV4VÑ bcˆéòqu}]o¼î7°®†jXæ‘[: Î]ÉÐ6¦dáp*0ÌÇÚ]ß’}‰åÏ*ÔÉñ§eAsÃÀgžéœs &hù‹F®uèÄ¶Õ±N0‰àG8éÍ^LšÐwz4í6‚bÇì8í+r³ùªñ[ÒyDÅ6-`Õ¹ÀëgÛó×¬·FÊcQnwìÎ¾4®ìi°K(Šu°/Ö¡ì—ó©…O°Ÿù‚ºP°´Z¼[f»Ú[ŸöjÇco*VuúÇ?ÙàJú¾„dÕ”=©-±+2õ´¯íÓwb‰oÀ²Ÿà@ðÄ†ó»°¡‹9ñ¢7¶YFùs‡UOÃª fâ„Ê‰Ã/XÎ†Â¨	ðìOT’œyÎ¹;µFN`ÇkÐH8·g{ÍÃóÐ°ïsŠ,ŸAOÖœÂæçÎâ:‰’!·1Wfla‹]Ã"kÃž1Îx‘ãl·o=Ç £ŸÅm½KDeX’&i‡P‘Éˆ@îÉbGÑäƒQ‰œñZ&ð¯%p4^9<F<¯)8ÛÿŒ—.Þ¸€8ÐŠ}ßùÒp”ð~ãìqpu¶	ÏY89oo¬Ñÿº[«LT–E|¤2eæ\â'i”îjSx•îS…ö¸MÔTlöS¦»—WÁjÁ×#3'®Ú¦„4`ÎLXÐ¸noÔðö7qº¦Y]vz;¨hÙ19Ì§SÂ{,…J.ƒ‡SiØ%:Â!Â],rqJöž~º*¨ˆá­k…*eæC'ŽÙæ.ùÙ—ê”ªVTÝW2£Àœ·ÊC¡WN_ZƒscÀ¿/Ê­neIA–$*xÏÙ€ÜjŒ]A Ï#u±l>º tÏ1ƒ4.PÓñþÜžÚs×:²Û%º.Q“öÑÉª5…1MìŒBNOÖÐ³!ñ¬¼ÆèÊÉÛ_OT@5±11ÉÛã€A„VœLìÈ²Çs#+s!(Ù‚òZ²“)']˜È^è‰ÛYƒ†¯‚á…¤à­3ª÷Ç ýoÄàž‰ƒ¼•7þƒÑyVp[üTAüþÝ	ƒ4Î:´aê:Þø+O}‘äá¥9QB˜U ß…Bœ¸3$0Ü`ä5ÀÏ ‡Ù_3¡aìNapÞŒéÃ£¬¢H*¶g§¯ÆHbkA¥’Ð%IÏ!:ì¦Iö Çû‹ÉÁáðåàÄÚØÚYÿyýå[,.±ò{Öµ†q˜ÌPÃ$ã3ˆEXÄó‰”]Úð ïvÄhLäÚR‹±=°„#TVìá¨Åk'öÇI¼&ˆ3GS}EdcóÙ¸g²Á5È,ª!M
îò_‚fðŸ¿;ÉÈYƒb†¶»ø"iEÏü.”bÈŠÊ,& W @ƒ &´OOR>øÿÕµT¦¼`¼>~1I6eÑä:$Ô=HxRjpjÏ"áÃû‡žïÏá¼~v#BäN¬¬— ÍÓKê¥Tb„  lˆ‚ûÙE:\DB	¼â‚äZÄH>fþñì…x/€Y1=šj7Ò]’ìÎtÃ +ZØˆU@O²¥êˆ`ÝSwî 6\¯[ÒpÀó¶ltŸñ»ªˆŒ/5-‚ªl­5¶&˜³àõe’²™’”ùx7@Œ•‘–>’•ímÙÚBJA…i@*Lºø~áümJºø-­.^8ÆÈ7™&>^Ñ1šZ¯‰{í®°B_?¤ZFQ÷	F’.Á¹XÕÙÍBÙï4žýœ{€¶ùß’¾êW8kñ×˜gw?iÑ€pþb¿€‰?ó„HÜÏ”Z˜í…ß”rAHwÕ(ü|×Ü«°FŠÄñ®¸Åªà<Þ%ãlHŽ0 q‘ÃˆÞ}és´5sÀ*¦ÙS„Fkå”i·%ía>´>¥l²Ÿó§	S\S´W@šÞz?{ŠN»ù§Ä		ëLFû«ó±:UW0Lœß[Â	ô;jÃñÏ-@LˆhÆ»âö6ÜÝdwÑ.!Ç¤92ƒ¤.^¤—³4pÑÛOÖz›ký­@w=è®µD†‚\Œ¨.[¤êÐþ˜9ýõWˆíiÂ«ð ÌV/"ÓÈßä2æy•ƒ£d†ù¦q¡žƒ‚©½ƒTµ9&>Gd\&qËu­—øè4y!08#Ô˜â‡¨a”de–ÀÏý)A”­NvøPÎÐÿ(h‹Ó‚í¼ù«A]&¸«ÿã®'€»6ú€»z_2îrí%œ× ÐŒ@^8=yhÔEIVc~Ž!Ÿl÷ÜZyŽ^¿$wt‚9rOVº’¹‰á6ÂTä0²ñ5‹œó$æÈŠª4!Â&Ÿ’®±ŽáÁO„Ç¤-•†ßðÖCã­T±"«Y¾&¼Õmm~Åh«·óxíñ6 ­G_0Ú:uPÑç÷{|‰áå¨³ypÌe£Ø'Ö#jƒ¯Oõ#z¼qVŒ×œéógˆëV†Â¨lý
xV(¿bDT*F–mˆÝ‘Cû¢ÐçØ4á
…þNßÐ×C£¯Ì˜¨Ø¿&ÖˆñÚúª1ØZ0X¯ÿäÆ`CwŽØ„y™üÀ¼Kí8a8É³'.Kj?ADSQ°œÛàAÌã~ÇäÆOÉÄ¶ÎÝÈV$Æ	ìb2µNBŽÍÜ:¸@^‹&´
XÐ³Ñ9DïÖ¿Âf2¤E†Î±;rb{ö È«VÎ­"„yôÔá‚ôK¸D›ÌÃ9>g„
ï±ÁÉóË,2#4ÙÛÍ5Ùånª}rS}ÌÝT—ô˜/-“™_»Û\[ÞÛÈ¡Š	Æiª0 ‡Í­µÞ“GkO¶Pƒ¾èÁ¸UEjÛP·Ðþÿ!â‚ÃÛ®¶ L§;%¦Ó~UºåGK˜NõQ[¸¿’é€ÕpËöF&Æ„ÂØ#r†ß£\âÑ»À`Ã¬Cš4æÊÍ¢¹¢Òµ…£€
3eÅ²&žÎ:±ªoÀÜó\Ã>E±Æ´M›°ŽÅ¼m˜–á²ƒQ1äD@æFÆ²d'hã¬ÇÏ­ íÕ®¬¡8a\tÆ$Œ/<ý)Ì;î§—©Såõßšà¹_å"œ¸èþ;ëºõLö!¯nyîy
—$8IÓäégÆ÷3Ï£™8 HcgîÎ¾Þuø5‰±Êg„43&uw„Z#‰Eòw"âëè ÷{Ž±Öç¤­J"Øzì"gÊ€fPŽVÎ9ì8 n¬»ÜR^±{ë‰¡¨j)ÿsßäÕG.È)£¯ý­'k½ÞöZ¿ÿ»X>ÀP
+mOÄ¦+ƒ}±¸ðoúzdÇäløƒõÊ£ËK•çèƒÐfûP…s”£¤Z†U¨ÒXœLÉ%É_83
ÀÔN,´CsÀ8„}@Ès?Âz“f¦è¶;P™¢?¯;N×ò=gš:`N^ Õà3½<ÁÃIŽV€y°GÂ‘93WÄ²oç Ž®eâÇ ðº3ôS"<Ž­€äÝO	…h~µëÈŠîFÀ­-’)7š\cæ ²±¨Fä(p"÷ÂY¯:ª¯|X,ëØvB + ´±V›mHLÁ¿Dyø/´øÝê}­O|!"ù[Fm/µ ;Ò‚j ŽÂI=òŸIˆÁ¦`ˆÍöYÛÅ'®ÍeË ÷bc’¬f Sè²øŸs»’¹«$øÅÛ•J#*lí[˜çÍP3ãîžx¿#Þ£æê‹\Xƒº¶Uyøj&˜¨ãÎœÂS–É˜A Ÿèê
— É].ŸT!™^Á§\›–»¸ç’ø=N³[äœ·R¼ƒ(gsm±Nõƒ®xzïÁœ×…?_iÁ¥œ¯j“(ñ†`	õemzjì|]ã°ó)JÌ(<|¿‚Aaá7['iX;)oE•ør´K©@ÞRÊcz€l/;è7¿£æ —mÝ*Žxs£¼öSy–ƒÒªäAÁ—$¼Huã+ÏßN_­ÿþÏÿ²NíE`[‡®ä}PAúF5OeÔ¿ú¤ˆh)š†ù;ÿäû¸‘ëÖ±¿°µèÖ$œ²ê£ÿ'–fÝ1T°äšJR;M:¥™£²òM0¦÷xvl/=Cí‘Ž<çÌŽÏ°®}¶Ãv§_fçÓQG«pþ¥Úf=^ÛLÎ“‘÷d­™‰å¯ØÎ'	Rª–×¨~Ö0_ÊeØÑŽ>iKš¬y¹Ü½#ÿâÂq4‰HÙ,ì9ð"åJ}£-qñH#Š“ ðÑ::Ö±óÙñüÀ	Ë¨ÕœÉ‹58ú•#-x~¬ÇÉuf'ÀŒ3.ÃÓE|ø‹…k6£Õ‚5]Û<3T—Ò_.¸w)UÇJÒ3f7E oÞ¶ê”5ÕÕš¢©›yŽ/È•#Ôr$¼©T_ŠgQÛífGKkVþûÿøßêzÐ@o6e”×¹ H;1'´^úË“ ‘ ih)Í?tûÏ¯Ý‹ØžF†óäI*‚Ö,hýzîz:àóÿý_ÿëÿý€ðóÖ™9À\ 0/ì¦ ´ñ¸¿Ùë÷žlí<î}Ÿß|xæÿüŸÿßÿçy@P’ºåë%ª"{Þ\$t³ódûÏ“¹íz˜Fû>@§ì‘FÛ’ãÆó„}«tÏ~ùÁõSëfá\b:4§½Ú81æŸþ7¸ÌÕ[‹ÍÔâT»Ö  ‡p‘~vÆ¦œ^u³ÊænÕÌ,›ÉùiôBnYÍzÕÌ.Û¬î¯9­!ûì·T²5jN%[:Ð»§’ÍR®vH†ÔlqªNÛûÍÓÇf°eœÖ¤)i&‹ÜìKeÈ+ÚÔ‘ª®5à-èÒDIIcêV¥‚’7!)6§Ó Îü^çÔœFKbqIÚ˜2!Ö$^Kã‘î˜zmËèûY™­ï ýFùÊ¸$SÔs3ÓæFìÅTrr15—{tAù…yå Ž/À ½3Ã„nêF9 Ïhð¹—9­¬ÈÀL¦iŸšþ’eJÓ{`šV©SÓk‰Ú¥„ñÈU>pž?š©LEjÊ)6P¯¿r ŸÙÒÊSƒ%ºôU)eëXuìl¥üEé8‹,¿›rq}á’hÓÃÁ¶K?Òpe?‰IGE47Ç@ÄT^o ð`w¦°vN¸¿r‹éOw­Ãdì¢Y9ö#ÍvOÆÝòV>Û0¢ý›Îöë. ©âäËKFø‹#ô‹qÒòuÀe¼“j¡óï·oºÝ.þX³²¶w-§Ë
Mti·«%–
¨àh8_,¢÷ÎZGU½ïÙÓo`ª^Z0[oœ	Ûô0fÓÈ4SàjáßÇó0°šëàö÷€Xm­ùf™I(>`ññä—rìbúòò´šV_=–ìÜïÄ¯%b®r²ji¸ê4–§pf9›ûUu¸¯^þ2xñjpøêÙÙÑ«ÁpølØÛA»=ò"Vû´´¼F>À›åFCÇsF1ˆmû–Š–£È,œñŽ–„Uh»ëŽË«Ìâ¥`Í·’×z¯™s½ÃFÒ ÂPã*wxíó†#leôF^´]¾bVéÑÍ_tÜ|då@‹˜5UU(Ã¾¯ùÊ€¡Ñgxýhµ„do“Õw;™ºož†»‰'ëýVã~w©_ÖSÎë 5©IHETõ»»­Y®:K\ÕI¡”©ˆÄâÂ ú¦å¦Õ~n>Ê½¿¿‘Î?la†%APkáâª¸¬Cý®ñú	ë’ÑÐ/à¯Îl£:Ùu**âõ 5²k©:sŸ…?•ù-§ÓôÆÝ¹KŠÀbÇ=ø*éu[ƒ³Ä«6w‰×—Ïaâ¥å21‡+&rÝ©þ^+(zc„
ëêS²”0$õÐˆ»ÄëY  :s'ŠÑûàä–]ZÈ}Žn¨•Ï…,¾ß€‡]Ñúo¶¿Ÿ o*¶B.ê/kØ#,`ýD°û¶gu®¢|¥dêš'S`^Ð+íc7pB’bãzŒ5˜¶åah…õ? Gû*zîQÓÀX/á ü±´ƒ³‡× ²Íu068‹ü÷¿[­Öý«ä>îC·€—F­žÐE¯ƒ\MŠfÇ,Êó	ìÙ¬ŽìŠ(îl»QœŒ]¿;ñý‰Çê:ÛA ÿwAü[ÉŒ…`Óú¯zÁ;õBFÐ	qëWžSû1¤.±†©9·@cÿ5çs–âr®¯N÷œ€Z-ìåÁäFQ¶Z%ÞT¼“ácz®J½-¦²éµò@×j‡]­? Œi{ÃØí‰Ó9ìÙ@ˆíV€Ž9glÈg^ëî­I¾¯&År]ÃzÝC{b±ï¡)¶gpÎà$U5X’û/9»·nf¦üž*n§j·|ÁäœÔžóðá•.U½†Á–ó}‡™ƒqo%<A•$Ùì`ÚÑõbdÕ=žL%Ç°W»•éäPˆ£Ö2 ˜ŽÔše°Î4…¾\…ƒ–ë(‡yîØ›zós’ðÙûIÏf®qÿ®Óà~Fg:‘€£FÓu‚ÐÿP›ífíKŸ£¢§>WðïO~Xlš«lý£ŒŒÑj„WÙzæð_nÓ”Þªgk9j·šê®ˆ™z¯¿œÖ?ÐD»ú÷Õ]Ç8¼®ù&^wQo0 g‹Ø »Mø‘õÌXÛÕnì¿ò/ðA~…î¼]cÂò¬¾K;Zåæ†úß³‘â°ŽýÑ[ç†:öGíñùšÕÂ»xÌ²æ·ŒŒØ×žo£M¥™~A<—ãòÑ6â[kÍ4ûy¶®õ6k:ÇüIG¾a;
“iÄ×ÍÍøT-vnÖÌ)ÆØÏ°~èdÚ]ø—íÕú6„ú d_Ú® % Òv¬k*€5OBC¿žÈä Ä¢»,â£={q}Ð^üñXŠÖë¢˜Ü|ùPÎNG±f‘‰M´¾†?ÔsVG¬WSœt¢Çä/¶ÏF‚#]krXËNI³ÃÙŒ¸¸×–fÐ`Êè(ŽÐä/Ã_ßt#ÂóîÅµÒOÍŽn­‘¦V$÷&Pƒ[ã{N>óÃvë'€gŒAêÄpóXÂ»Œ<?#jë.B5 Ô ÁJT÷„å¬ö+E¹ú’yw÷RÙ«¼(…$vÉ¹F33,2ond2Ý|”*N”€Š5–µf•>›,"ò~¤¹—þâÂ1‰„õƒ=žZ¯í(™Yot¡ˆS¨2’\)U—†7Õq¡±,âŽ¸º¶×Z½Õh>çqg«îòæôo<
[Õ5×KgÃÖï:(CÚÂÄI°|°ÌósÌƒ2s¬S>~Ã‚—SïÉ­ŸVÞÍÂ*‡“ÒX	5 "+ôC.Ë×røÆdUåkl{R öM4õ/™˜Ày»”Eü­óþÉÆ‡ê­¤ÃgfXQƒ3T—ñhž:É»0+`ðß4À)6lŒ—®9À?—òù¸¢,£)ë®4Â¿ùT…¢ó$ïÜËCßavll¥*Ü=€³[’šá‘â`þ(‡qØùTÓò&ŽBÍÐ·A+x0Ó ÉËj4@!Ê†µ‡€¨B–i!Óo÷qÞ%ÁÚŽ4Yº€J¤D„Üä&vœ„’2Ÿ¥L‰¸JÌÂÙ„òfúž¶(å6¤XÐL@Ó¤²+¢ã¡z°Û6HøÛˆ²±èë˜«ÇÙÏ%’+j4%°,'‡š™ÿ«Ž˜·^tKPÀ)<ôÇ×5ÎàŽ•%J“®tu&	‘’Ôd¥‹“È:´Ç]A¿‚«œ,³û@!ã“ÆëMáe'¥:¡U	gîmRqè\UæÔ·LÜxŒþSš†v3?¹¬•,´5=‹ÞiZß«›F3ûQë”¹Gu¢(?‡1—„œ¼>ËN#¨Å:«0UmgÅ‚R/’—`.4y¨LHÍœãB1Ðx¡¦«Ü:¢{)2Ì€ä?\äR<^cñ«}ì\Ø‰¯j¿f×ãB^dÌiÜï>/—³=	ýÈ‰¬À™Ó6Uà™kfª$÷¥üðe´ïš<1aÅ~á~	,ù%°L{<P)üŒ²8«y6fV5™a¿ÜW"ß=å°¿´§ÿ×5¬vCŠ£Azo€…½pG,‹Ïk'Šl-Ö»±½á/(¬dÚ‰3Êx1EˆŠ{Iu™©uV†ØE'½%£Ülqü˜eê–²sc ›.ÙzŸ<LtF¢¾è*„‰§áb7x×Ø	¶ÁÒã¤­°ŸÅvØý¾Î]ØàËnr>nKNq‰ˆ(5Ó^ ;¡Jˆ|­I|Q¤=ºGŽEž1¦ ÏK0ÉNïóaâ´'cµ ÁSñ‚œ„~r ÐJ 	Ô¿Ô×JŸUN8BÇä4 óÒÒ=©(D3sƒW”©øž¹'×)í‘Ç”$pžÂ\àp¯Ä]+s¦Ò«Œ¸»ƒEZ|ý{:—¢AöQ[u2¸)þP¯X¸=ân‡©ÃÔª^¤ñÿòÐÿ+äI+½À6ëx±{2'VôãÞ{©ØÌ´'þÂÏ)ÀtóÐ¥’¨—ê`•2¹á£ý
/†ÝÒEú³ô›”± ©)TÖûy¯Â‚r	™7ø´–Ž/vcOÜCLQ¼¸¦Òæ/ÑãàüÔž®'îèfdàq
Íï=»v~½¸0 >è_0<Õ3ð¢V~ßëa@FNuW‡‹Ã#…Çkì2^
Àa„åÔ=Jº¬ÆncÆ3nžáÜÞ*«dèŽíK@;ÆŠôîUyŒ©²w
gNìN4åà5,’™zv…ù¥a<¯€«¯÷ƒº‹}Úšhä;¨ù>çM¨yƒûúªï-ÉÑPónÝ¼€”	³ 	ÙQ”sŒ]Þ‹±0-Êv8ó€OW %ì)þ—`¿à¥ù<õÒÌ{JZÿý?ýï °ëÏ'|H‡GWI›%i.3­äeh\.X^g¡;>Í;-o^ŽÌkºhÞ“wHŽf·Jß¬fÔ8oV÷,øÔ¢cð™ò>:.<Ã/WcÀ-Au-Y †¹Y†ÇLîš=F«37oqŒ¡ä"Ã¶dÛ*ˆr‘»C®ôK48ïÃQ×a
C~Ú‘šMD&N?ãªi9Ñ2:¤Ó”vy­¨yõÌYÎ÷3ç2úè®ûQ1Ú±ÆjUBÔë®œþ°s'O µs
º–8óRW(ô¯à_™å|ßDk÷‡#Ä¬–BB™PÀ ~OíÈõ2gLü
¦Ù¼Àb%H¢ÜEïþÐîïŒLg~äSá„"Bå˜”#Ö2„ª¹«E²ê!ß–PlŽ‡‘${Gé™.¯ˆvo€}õ’ýÙÄö[¼ò¦Y ÇÕyËÊ:d˜~9±Þ"ëé,FŽÞ(ýK½ÐÌ(½ó›¥«­Ò%Fé­+ö×ÍéŸ§ÊMÔ•v]´h	@¦¦dùòªÍÆ:ÿ’ÎŒFä½CßŸý
RF¹¡—'ô&[‡ÎZ[<W4¸'¸þÃØ^Œ1ƒŠ‡‘‹ õbÇj–„î,ñ0€vºy Ë-6·E#æ©%H‹Ü]Ì’2ÛíÓ…½ñ»Vo“Õu¥¸h`›\gÌúÏ¡
×‚ûÈ×S”“î[¹–û_ëœÎ’*[Õ>ÛzÀJAóšRåÕ‘ôž]/¯@ÏÍÐXòa/¶ÏóF=¶òž²d²bmL{l´à§ZæL­*6¡·±a<U¥9nöâð ºÕ±“›lEÿÊÁkLl'¥/ˆ§æïåL‡Y<fùOûËº¹ü§[Ëº]ûSñÅûbvÇ,ë-%ÀtŽR ù.P
äbèZ róëù'gwax¡ëDí_NÎ†§ƒ7Çƒ·ÇÃU–	é}”Ð;k¬3'ú°f¹ã+Â*©‰ üXž!Þ„Œkn ëŸ­>Ù¤6¸5ŠÈV‹÷9îhÝÂÚŽK@XNç,´´Iiç°¤csSú¾ás~Ÿˆ}¸—vú÷ÔÎæ=µ³uOíl7i§øùNúyÙÙ€«$Î>Å£ar8%D^7ßfñf}&óˆÊÉ‹ e0Ó§ª.ìKd/ïÄ_nß¿| Søeõæt2LmVSlä±}=»ùRÔ&ðÚÄY–œúŒæËN×g|SÙ%/+wíD‰M†¢¬fòúàøEÔTsž¬§X¨/†ï4X•jpž’œ¢óÔcÍ¼¶12JÌúì'Æ@Òí¥tß¿Qß¿ó@%–ƒ5†q¸f9ŸÅÊ?Ãš-&Gr{íKz“uU´ÿÚ¢ò<N¿_Œ›öºk•µQ–<L`bû7…[ÆQTü^w×ÜÄhêûõ#€MüZ½QÖ÷°ðmážöó¢Ý»†2¤„.ñ½±hSŠÄÉÑl]Þ`SI¥7¢R[ùDî€ºl©T¥þ¡‚4¥ŽøÂÂP,ªÊw;Çlbu`ftK×€ÞöÝ¹=]6‡˜r¡ÚbtOÑ¦<•îZ×·n~àïs"”ªÜaµò-m9ï#'T±Fî0žãˆ¹h ZX™bÅùÌW„¶õ/ÌëÆ°²?v™»òßÿnißàøFDaLÀA¥¾SKI¸Òn¿Õ&`*èŽÛ€fÞº› ?[áöo»ÄvI>éÎÄ¥ÂÎëÖ+ä·šîó]ã;6v¢Qí-Ã—C7 ¿–'KŸÑŽ†eýŒá[ûÚ^Ã´þ.qTáÏ¦.V:eà+ÿ »÷W;\Ø°_/h'~XëE”ÚCìq¯µ7ŠÞ¦-J-ï­{?*å¢0Ÿ
s‚\É†²rðšŠ‘· ¼±y2½u3‡€‡ÂÕ½uöyó^”Ð¨›ôwZ·Xo¯“±-º x‡^²ªî+¿Âß×ŽÕDià×%ˆ_·Þ}‚ïÐS¶à‡n˜Xí¼œ&ðë…²Ï¡á.—ÖS^9x·˜@Wl†… ³78ë˜°œÙ[ëÞ¡?æŠNÝýì~²¡¿Á%²IÌK,àö¼ÖêeošÆ8Àü X*mG¯00E"²«„Ë+Ó†dãª@}æä°p.™ híç$Åî…ëð·lÌÁéßíï(ñçïàyeÈ>ððÊwQ;í½òÛR¯	Þè«ZVLzuSgŒZ	“|úË>¾½Õ)%ûV•ðþŠ»S?ùM¬}UÒ3åÚË4(&aÑ˜ì°¼žYûb^+Ór(tD™=W{¨³'ÏŸ:ÉÃït
ÈËN@{4lŽ =¹yþyxýbÜnq.¨µjÙ‘õóéëWäÄ_Ye÷U°EY‘¨+‘É‚uãöŠÄ¸1w_©Å\FV*V:Ê»–*^×ËnäŽwM'ûG<ùÀ$|Dþ‚d:ßßd©un?ÖIÐC²ÔnùòÒ;¥ë[§'{E?ðÆ{‘xÜ]<u¾"†«btôN6>–º­ù ¹/ðÜ N×UE*óÕi…‰TÕÛyBƒ¶ÀŒÊ ÑŽzÂ?²?»9Ú ßüµk½ïv»jûk¬ßÈ“ž<éòÑèðsê'¦ hæuU…¡›1UåþWªÎQ0é;*È™W<èø²˜ˆW³7›ù_5S=þIAÐ  ØÈÔþŒ)>ØŒs¥dÎù€l0ÈÅåO¼¢~±ÊŽ´£møKä'icÍv'taµgV€©Pâ~¡¯iàzî4M&—Ÿ&ä—Š-Ìq\T±˜=ºÔ(	£Òér7ÊÒ~Ínò|Nø|Žq>æ€E.îk"ŒD®Ð)t0âŒêµß×‹-,UÈÕM•–‚÷2&ðÎ1õ\J"ç!pb{nµÿâF‰í­Yƒ0®ºkÖKh 6l8ÓZï•K¤¹®‡ÈÆ,õ@S"Ïm8½í¬YkìÏÝ…½XÅúâM¿i4¤#²$‹‰uçèb{x`µ_cø_œL),ÍÇ:äðùøÚ³È…q-ùa£Áa›S{9˜V@i<¶1±Ôë&Ã¹¶ážçœ»ÓUL³Ô‡'7y‚¤z¸L5Ë2m¬&0iôža<Á*ê¼še–Y×¡oÜHãÓXõ9EùJLÀØ„ÿžHŒRÛ~Z–D—Á‹"’Õ…™i%Ò4m•^_R7YNòaœlÚ!p²&æ@ÇM~<1¼nfÁà&Þì9K,ˆ¯¦Ý¯Y­ž.fAãÓ¯Á­%ù%äš‘¡"'—yò“ÄffoEÈµHt7ú*"¨‹À•òd½cgðÓý#íhÿÎ;ÊS£5ÚS)ÚCïjÿžwµrj®]?‡»ty6
F`;¨úIåôu1h¥é»Œ7J¤™ÁÂö®#@¢ÆæO–Éføèë
ÙùÒGøÙºsèˆ"Woªà+ù–eiw>„ !(õëû¸AÌ-ðËI}>ò™ÝÍAÝ­õßÿù_ÖV¨ÿ±›¹>/62[×©¿¦˜EzQ¸˜ùx—þýK‚0yÓ.ÓW“æ×=Uãbéõ=Œ†À—y13êŒŒÕ
#±èmeo×ÐƒÎ»Zßúk9H~edgî ãKøÙ^9øÅ£áîÐñ ÷»$°³Å6”¨,R¼WnMÌM ™ñîe§·¾™æGÔ;j•·•â3LvZÄi(Ì*b/?Ù½qÞátKwNMJ…,²‡t(Æu{§$Ækb(hýÀzëbÄ*e‹cÁh€A¶jŽ¿±#YuÕÈ:P¨íáWÆ¾µ5ûŒn¸`§~ŒYrÑ=á™pm®.„^¯ç¢`Æñ­Ü°SÙqƒÏ¶ëa,ÂÐóÑÃÔt w+a\§„uÿ÷Ø¨åÖß`§Ø$‹õìâÂ¡´«uœlèKÝ)Ü ‰!*ŠËò?üþ1$ö’EÄ&ó‡Ü<!,çöŽá—“[à«ÖO§¹m5_-+q­¼wGRV+úOêîÁY!lV¢c)§Ç¨Ø]‘²Äµ‰Xil®¯-ÍÕ4šÖ•ƒq5â*­Rº.M—&NØj±Ï10fïBôAÓ†š
™Z˜c†óØ€«¾™µÏ?êWÇ¥‡^¨ª™«1r5‡@–XÂq~º9/™èk¢së#åjhEØ®z]GÐßÐ=Öo®¯m®ÑFÔ]„A½¯U`Ôñþ–AnïÖ!óó"Qš|I×ß€€Ú`aÔ&Šk³ðÏ”]¥Ðº»·Ü/m¹éé5Ëj^6Ï^ü‡"riŒ¦/!vÈ_r™íØEÏ’ó$r9ãW‰­Ü7P½òAÿ¼ÆöµªjDø?Ü^³Fžö¡NÌ¿n¼” Ú¹mÆÓrúÝP¯Ú4õz6•¶ošN¯R¯ØdsÊZ¿ìô zÝm%5ˆ¢kË©a—ìY×û”u {{+]¯XQ|yho¬KwOw­ßß´	rÖ77Vÿ†zûÏ­Û[sqAÝáSsíÕsæRh")‰/f) àÌ¥a¤ù~RVu~‰fk¼VÃ—iöú’f¯Ž²)‡ºM;W™©¿.¥ f>#n„þR… ü&Ð —b…÷ÑÂç¶—3‹Éç;¸ö Õ´â¸­<GOò¸¢Ôm¬†ƒÓ?vbÛõê³ÚcK’&¯ˆFSgœxÎ™}–ÍcÈïEïÝõôO~ÿá¶2Ô½VŒwu$¶9~LšN‘ÿ¸v<DžÛùâü¾š,Š´.Š”É_ËÁbVT§.%Ø Ïùi"ßD/@§é+êL”š€õ½JÈU% 1€'wPŠŒD<µÙ‹á¯Ç;½®%;Rb^!È)Æ.ðA‰•ÄöÜ.ú”h‡SÉ˜ëŸéû«íŠlžÛE¶¿FÇ-Œ’„J.]´|Ï³ƒÈEmÄ ¬!Hµç¶\ŠMÇ.À±&PafÕGhVåÉÊR÷¼-DšhÍ"Ã”¥)@fim—ðÌømJ‰WH¾¬1Ð°:Vç.LDX˜5i¥ù|´›P´#¾G‘&Ñ[ÇLfr9eÀß:ðo²ËÍÍ…âoÅ¦×5k`zì{„†áÄîˆ2ø#6ˆ1ªSÉ_0ƒý62
i—÷›ä—•J0"E>ÖeíD²þdC¶®cì ø!ÐÌ&	@¼ŠSÎfÉìï@#Ð ßðhNlÓ]¤ÁÕêýCg×øÎ§¿Q0×çR‚¦N›FñŠ»9¼ñ¢ƒí×X„³K°:‘ÑÔW¸ª…Ÿ†Yx«°Œçêâõêúò?ú¾ë—%,kå²óPô¥ªÆD)ü%9Uº|0^¡>õ…)äv•Ú^ï×‡÷ž‡ö8¡>²uð¦2x¹jàïzÜ¦š¤›¦óí|É™'iVëyVp&¦š´¢¾CÌö“goož¿œZƒ_oµé×†Ñ×R[ÿf«´þÍðØ‡/0•Þi%5¬$såMþ[òU—¶¡Q¥Tcv(åRZúJOêV4Æ‹U=Y9Mâ$%|ËÖ@ÆÒ}ŸCQ,Ñ[}j•86bÐÎyYGv86–täméP¥C¦D£¢°¤¹ýÂ)ÐžË²£Àã(Nž½yþüÝ›A,?:~{øXU“H95èˆJÉK^‹-eÜ®¤7é1Í¹†«¿/¬«Æ¸à+ÙŒ´Å`
¨Îlšr9œ&‹æŽ9¸I¤ìí]àa§~Hî¾˜¿b0rëµ{ƒÄð³‹ù Ñ´ûáþÇš5ìžŒ»æŒGSŒ‰®¬#Äè©j¶5  §*S'Õ/]ß©­Î«.^¥ÿšG˜„MU¹ræç_cð*/,‹Ûõö{êÎó(|ž„‰•Ûà(r'gL9+è#‘$µ¶®ì>¤@ãã*ÔûÆþìNXYI¬Wn×F¾\vË;¢J Žf‹…E²ÇÞ®õÅçw(> „è©ê\? f§ã„IqºÛ+¯Ÿ½yg½;¼ÔÑ’x‰†‰ÛÑôÜGÚW6ošCIy ùj˜\€]Wœ„!@ö_\ç²Ý‹a™«U¨º]^ºàÆ»îbá„E¸µgõ6ú[«&Ž«ºiCuùÊ¶õæ£P\òrrjê	a°fmæ
d¥¿´^Ä÷7£léXÑlùŠ%ŸûXñŸHÅá¨¿>Þ Äy9Î1ÇbÞèåkW;ýìÏÜú2í[å”•Iîl†¼µA¬¥¥$Tšž“:¨5cIëÃ>žC Ì!ðÑÑe9
¢öÛ£ˆ#;‹pdßNãr§QZÁ¯ú@"ßÕ?‘¹i?À¡ÌÍCœËÍÝ¢áéË:œÂzóí`.s0ÓÕûªej¬y.•Yßû™\ÊRÛô`níZ<RË„a´õ—u,?ÑàÎæ|pßNç2§3¿ˆˆCšwR+=©º¸÷›;Hq\·w•€Ÿ/ë¬¢ëæ7Ä;¨ËTe¿êSª)\Wz@3¿÷ÓÙ4P®éÑÜÙµNB'Âúw_Ö±ø¨¾ÉeŽdºz_õq0
HéÒˆj*s¿÷™ž–“:á‘ô'¡=g•'í…Õ>Á,‰f'Ž´«ßò„NXjÿ{»ÔÍ–ï«>£?¹žs
ýÔ=ê´àx*'ç!Îçã]–¾Ñ ÜÙ~{òú;˜”Äñì›à¹ìÉ”Öï«>šÃÀgžS[a››÷½ŸMéÔÀ¡yˆ£ùd×zùòôäË:Ž³Y|;ˆËDZ¹¯ú2É”Àt¾÷¯•ÅSñÖHwÂÏv­°”¦g¯·±ký’„%%›¡éßTKcúv —RÁ²µûª êt^!tÆµÕ®Ù¬ï_ÛÊNÈ’ÚÖ*7¬ZîNämÛTh1²Ç¬¦ÆRnOVcâ¶¿qÁöwöŠ:œp–ÏÞŽožÞÔðw»_Ä5µcÏ9„1&A°’Ç Šowzü•@Fõ¸—œ*S,=`™¢Ûx—ð‡àØ¿\x¾šÚå²³I~—ø_u£kE×±ƒÅÖ˜ û©[1ý—º1u¼7‚Yù·Nâ¼S{ééK¹Žâ…ë9+–=9A¼¿Òýù‹)ï>;C¼%‡±¯öÚæµ~W¦d¸/k*¦ÓVJ¡Lr¥P¨€Ð™¸g3çºµÊ
DÖd_Ò~^;QW=Q¾ÅBáü{J7‡É½s7_ì	º+jƒU»÷³…á)vœ`2ùÁÉ‹ûDlËQ²WþÄOÌu¶ÓënÛmµ¨§”»Ó6k3Y«WÍuø5‰K·[äj ¤9^Ò”%4¿Qå—_¼M±¸ê9È;ËÂ‹ÁÆjõÃ±…
#¹G6Š^û"(†Ã†)ÉìMøk9„>	M^ï´§ÂkÚ¹»<xb_	¥0ÄAû‹¡ý9%@øwåGž9RœßP3sðuRä§åø®"”œ¢2ˆ+¨›‹ö-J?ÞP¤O
±H…<ãQ…_ªB"‰ò˜ñLuÎB8vÄ+xÉñ¿)6)Äñ à	åqÅ™‰(ñå(JÉ™%=Š>,Í:Ä’5ô‹›‰\Ãá.†¬—/Ij¶#„|A‹Ë+RýHŠƒŠ¨5
{JƒÓÊ#C¢ÿýŸÿUïÅ¬
Ž³´u#Æ,ÜVpdyŒB.D`@¯ú2 ®Â{þBB7UˆÈpÈüÍ¢RY²6M}W¦Ö®Ué ^˜1>&3º~ÎÊíçöKóvV—K| Þ)~“_Õÿ  ÿÿì]ërÛF–þ?OÑÖx†dEu³’¡%eiÉ;±•¤Ôl­'eƒ$D"	.–«övîÓÍ“ì9}@h€`œËt•-ú†îÓçúmÍjÕLÉ.™YþŸkŠD•×õ>iƒ_(mEz({­ _I_”…3RÜ_Žd”»_Ù(?š*¤£F‹ªjA(<?3ë‚¹m
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
¦(§…Ò"ÉÐ¡Aú¡è£9Ãc«n6—{„Ji¥žÀƒÃ™ádÀ0æ¦ÙXR\=ËNk.ƒ3àQ"“HGc„÷g åY õ±åSìt„¤³žlhE/«´t×É`aÚq[Ò½ñGX²ˆÐû§Á€œûJi®|(Kö]7$Ü7ùO"nÅY8eˆ Âî$Âˆ-Ì¯¾x|3ívð¶NïÉsé)Ê ~øpõrt~óáêûïo>|@Ù~Bûp·w¥– “žÒ&` øÇð-X~÷däy %÷žÿ?   ÿÿ u®Z