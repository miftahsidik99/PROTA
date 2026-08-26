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
# MASTER PROMPT â€” GENERATOR RENCANA PEMBELAJARAN MENDALAM (RPM) BERBASIS ATP

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
   - **LAMPIRAN 1 â€” RINGKASAN MATERI / BAHAN AJAR**: Materi lengkap, sistematis, dan aplikatif untuk guru dan peserta didik.
   - **LAMPIRAN 2 â€” SOAL ASESMEN AWAL (DIAGNOSTIK)**: Minimal 5 soal nyata lengkap dengan kunci jawaban dan pedoman penskoran.
   - **LAMPIRAN 3 â€” MEDIA PEMBELAJARAN**: Tabel (No | Nama Media | Deskripsi & Cara Penggunaan dalam Pembelajaran).
   - **LAMPIRAN 4 â€” SOAL ASESMEN FORMATIF**: Tabel (Pertemuan/TP | Butir Soal Formatif | Bentuk & Kunci Jawaban).
   - **LAMPIRAN 5 â€” RUBRIK PENILAIAN LENGKAP**:
     * A. Rubrik Sikap / Profil Lulusan (Skala 1 - 4: Perlu Bimbingan, Cukup, Baik, Sangat Baik beserta deskriptor jelas).
     * B. Rubrik Pengetahuan (Kriteria & rentang skor).
     * C. Rubrik Keterampilan / Kinerja Produk (Aspek, kriteria, dan deskripsi capaian).
   - **LAMPIRAN 6 â€” LEMBAR KERJA MURID (LKM / LKPD) PER PERTEMUAN**:
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
    // Derive active class strictly from user's assigned class in profile or selectedClass
    const activeClass = identity.assignedClass || initialClass || 'Kelas 1';

    useEffect(() => {
        if (activeClass && setSelectedClass && initialClass !== activeClass) {
            setSelectedClass(activeClass);
        }
    }, [activeClass, initialClass, setSelectedClass]);

    // Active rombel index state (for switching between parallel rombels in the assigned class)
    const [activeRombelIdx, setActiveRombelIdx] = useState<number>(0);

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
        if (activeRombelIdx >= count) {
            setActiveRombelIdx(0);
        }
    };

    const handleRombelLabelChange = (index: number, val: string) => {
        const next = [...rombelLabels];
        next[index] = val;
        setRombelLabels(next);
        localStorage.setItem(`${rombelStorageKey}_labels`, JSON.stringify(next));
    };

    const currentRombelLabel = rombelLabels[activeRombelIdx] || rombelLabels[0] || `${activeClass}A`;

    const storageKey = activeRombelIdx === 0 
        ? `prota_students_${activeClass}` 
        : `prota_students_${activeClass}_rombel_${activeRombelIdx}`;

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

    // Reload students when active class or active rombel changes
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
    }, [activeClass, storageKey]);

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

        const rombelLabel = currentRombelLabel;
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

            {/* Assigned Class Status Banner & Rombel Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                        <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Kelas yang Diampu (Sesuai Ikhtisar Profil Guru)</div>
                        <div className="text-sm font-black text-emerald-950">{activeClass} â€” {currentRombelLabel}</div>
                    </div>
                </div>
                {rombelCount > 1 && (
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-emerald-200 shadow-2xs">
                        <span className="text-[11px] font-bold text-slate-500 px-2">Pilih Rombel:</span>
                        {Array.from({ length: rombelCount }).map((_, idx) => {
                            const rLabel = rombelLabels[idx] || `${activeClass}${String.fromCharCode(65 + idx)}`;
                            const isRombelActive = activeRombelIdx === idx;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setActiveRombelIdx(idx)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        isRombelActive
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {rLabel}
                                </button>
                            );
                        })}
                    </div>
                )}
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
                            Daftar Siswa {currentRombelLabel} <span className="text-slate-400 font-normal text-xs">({students.length} baris)</span>
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
                        <b><u>${identity?.kepalaSekolah || identity?.headmasterName || 'Yuni Sri Rahayu, S.Pd.'}</u></b><br/>
                        NIP. ${identity?.nipKepalaSekolah || identity?.headmasterNip || '198706162019032007'}
                    </td>
                    <td width="50%">
                        ${schoolName.replace(/SDN|SD|Sekolah/gi, '').trim()}, .................... 2026<br/>
                        Guru Mata Pelajaran / Kelas (${selectedClass})<br/><br/><br/><br/>
                        <b><u>${teacherName}</u></b><br/>
                        NIP. ${identity?.nip || '199602152025211094'}
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
        if (scheduledSubjects.includes(initialSubject)) return initialSubject;
        return scheduledSubjects[0] || "Bahasa Indonesia";
    });

    const handleSelectSubject = (subj: string) => {
        setActiveSubject(subj);
        if (setSelectedSubject) setSelectedSubject(subj);
    };

    // Semester state: 1 = Ganjil, 2 = Genap
    const [semester, setSemester] = useState<1 | 2>(() => {
        const rawSem = identity?.semester || 'Ganjil';
        return (rawSem.includes('2') || rawSem.toLowerCase().includes('genap')) ? 2 : 1;
    });

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
    const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(1); // Default Agustus / Februari
    const activeMonthObj = currentMonthsList[selectedMonthIdx] || currentMonthsList[0];

    // Notification toast
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastType, setToastType] = useState<'success' | 'info' | 'warning'>('success');
    const notify = (msg: string, type: 'success' | 'info' | 'warning' = 'success') => {
        setToastMessage(msg);
        setToastType(type);
    };
    useEffect(() => {
        if (toastMessage) {
            const t = setTimeout(() => setToastMessage(null), 3500);
            return () => clearTimeout(t);
        }
    }, [toastMessage]);

    // Students list for attendance calculations
    const studentsStorageKey = `prota_students_${selectedClass}`;
    const [students, setStudents] = useState<StudentRecord[]>(() => {
        try {
            const saved = localStorage.getItem(studentsStorageKey);
            if (saved) return JSON.parse(saved);
        } catch (e) {}
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

    useEffect(() => {
        try {
            const saved = localStorage.getItem(studentsStorageKey);
            if (saved) setStudents(JSON.parse(saved));
        } catch (e) {}
    }, [studentsStorageKey]);

    // Attendance Matrix storage key
    const subjectCleanKey = activeSubject.replace(/[^a-zA-Z0-9]/g, '_');
    const attendanceStorageKey = `prota_attendance_matrix_${selectedClass}_${subjectCleanKey}`;
    const [attendanceMatrix, setAttendanceMatrix] = useState<Record<string, Record<string, 'H' | 'S' | 'I' | 'A'>>>(() => {
        try {
            const saved = localStorage.getItem(attendanceStorageKey);
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return {};
    });

    useEffect(() => {
        try {
            const saved = localStorage.getItem(attendanceStorageKey);
            if (saved) {
                setAttendanceMatrix(JSON.parse(saved));
                return;
            }
        } catch (e) {}
        setAttendanceMatrix({});
    }, [attendanceStorageKey]);

    // Weekly Schedule for scheduled days detection
    const weeklySchedule: Record<string, ScheduleSlot[]> = useMemo(() => {
        try {
            const saved = localStorage.getItem(`prota_weekly_roster_${selectedClass}`);
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return {
            'Senin': [{ time: '07:30 - 08:40', subject: 'Bahasa Indonesia' }, { time: '08:40 - 09:50', subject: 'Matematika' }],
            'Selasa': [{ time: '07:30 - 08:40', subject: 'Pendidikan Agama Islam' }, { time: '08:40 - 09:50', subject: 'Pendidikan Pancasila' }],
            'Rabu': [{ time: '07:30 - 08:40', subject: 'IPAS' }, { time: '08:40 - 09:50', subject: 'Bahasa Indonesia' }],
            'Kamis': [{ time: '07:30 - 08:40', subject: 'Matematika' }, { time: '08:40 - 09:50', subject: 'Seni Rupa' }],
            'Jumat': [{ time: '07:30 - 08:40', subject: 'PJOK' }, { time: '08:40 - 09:15', subject: 'Koding & Kecerdasan Artifisial' }],
            'Sabtu': [{ time: '07:30 - 08:40', subject: 'Muatan Lokal (Bahasa Sunda / Daerah)' }, { time: '08:40 - 09:50', subject: 'Bahasa Inggris' }]
        };
    }, [selectedClass]);

    // Find scheduled days for active subject
    const scheduledDaysForSubject = useMemo(() => {
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

        return scheduledDaysSet.size > 0 ? Array.from(scheduledDaysSet) : ['Senin'];
    }, [activeSubject, weeklySchedule, schoolDaysCount]);

    // Extract ATPs from PROTA (data snapshot or activities)
    const protaAtpList = useMemo(() => {
        let activeCurriculum: CurriculumData | null = null;
        if (data && data.elements && data.subject?.toLowerCase().trim() === activeSubject.toLowerCase().trim()) {
            activeCurriculum = data;
        } else if (activities && activities.length > 0) {
            const match = activities.find(act => 
                (act.type === 'ATP_JP' || act.type === 'CP_TP') && 
                act.subject?.toLowerCase().trim() === activeSubject.toLowerCase().trim() &&
                act.dataSnapshot && Array.isArray(act.dataSnapshot.elements)
            );
            if (match && match.dataSnapshot) {
                activeCurriculum = match.dataSnapshot;
            }
        }

        let atps: { element: string; title: string; planDate?: string }[] = [];
        if (activeCurriculum && Array.isArray(activeCurriculum.elements)) {
            activeCurriculum.elements.forEach(el => {
                (el.allocations || []).forEach(alloc => {
                    const matchesClass = isSameClass(alloc.className, selectedClass) || !alloc.className;
                    if (matchesClass && alloc.structuredAtp && alloc.structuredAtp.length > 0) {
                        alloc.structuredAtp.forEach(grp => {
                            (grp.atpItems || []).forEach(item => {
                                const rawTopic = item.alur ? item.alur.replace(/^-\s*/, '') : grp.tp;
                                atps.push({
                                    element: el.elementName,
                                    title: rawTopic,
                                    planDate: item.planDate
                                });
                            });
                        });
                    }
                });
            });
        }
        return atps;
    }, [activeSubject, selectedClass, data, activities]);

    const hasSavedProta = protaAtpList.length > 0;

    // Journal storage key
    const journalStorageKey = `prota_jurnal_entries_${selectedClass}_${subjectCleanKey}`;
    const [savedJournals, setSavedJournals] = useState<Record<string, Partial<JournalRecord>>>(() => {
        try {
            const saved = localStorage.getItem(journalStorageKey);
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return {};
    });

    // Model Pembelajaran Preset Options
    const LEARNING_MODELS = [
        "Problem Based Learning (PBL)",
        "Project Based Learning (PjBL)",
        "Discovery Learning",
        "Inquiry Learning",
        "Direct Instruction (Pengajaran Langsung)",
        "Contextual Teaching and Learning (CTL)",
        "Cooperative Learning (STAD / Jigsaw)",
        "Pembelajaran Berdiferensiasi (TaRL)",
        "Gamifikasi & Eksplorasi Konsep",
        "Praktik Langsung / Eksperimen Konkret"
    ];

    // Predikat / Ketercapaian Refleksi Options
    const ACHIEVEMENT_OPTIONS = [
        "Sangat Baik: Seluruh siswa tuntas mencapai TP dan menunjukkan pemahaman mendalam (Extended Abstract)",
        "Baik: Mayoritas siswa tuntas mencapai TP dengan aktif dan mandiri (Relational)",
        "Cukup: Sebagian besar siswa mencapai TP, beberapa siswa memerlukan pendampingan (Multistructural)",
        "Perlu Bimbingan: Sebagian siswa belum mencapai TP, diperlukan penguatan materi dan remedial (Unistructural)",
        "Tuntas 100%: KBM berjalan efektif, seluruh indikator ketercapaian terpenuhi",
        "Pengayaan: Siswa menyelesaikan materi dengan cepat dan diberikan materi pengayaan",
        "Remedial Terarah: Dilakukan pendampingan khusus pada materi esensial bagi siswa tertentu"
    ];

    // Calculate all dates in the selected month that match the schedule
    const monthlyJournalList = useMemo(() => {
        // Jangan muatkan data secara otomatis jika pengguna belum menghasilkan dan menyimpan tabel PROTA
        if (!hasSavedProta) {
            return [];
        }

        const dNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const mNamesIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        
        const checkConflict = (dateStr: string): CalendarEvent | null => {
            return calendarEvents.find(ev => dateStr >= ev.start && dateStr <= ev.end && (ev.type === 'holiday' || ev.type === 'activity')) || null;
        };

        const academicStartStr = `${academicYearStart}-07-14`;
        const academicEndStr = `${academicYearStart + 1}-06-27`;

        const year = activeMonthObj.year;
        const month = activeMonthObj.monthIndex;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const list: JournalRecord[] = [];
        let hebMeetingCounter = 0;

        for (let d = 1; d <= daysInMonth; d++) {
            const curDate = new Date(year, month, d);
            const dateStr = formatDateLocal(curDate);
            const dayName = dNames[curDate.getDay()];
            const isWeekend = schoolDaysCount === 5 ? (curDate.getDay() === 0 || curDate.getDay() === 6) : curDate.getDay() === 0;
            const isWithinAcademic = dateStr >= academicStartStr && dateStr <= academicEndStr;

            if (scheduledDaysForSubject.includes(dayName) && !isWeekend) {
                const conflict = checkConflict(dateStr);
                const isHeb = !conflict && isWithinAcademic;
                let nonHebReason = '';

                if (!isWithinAcademic) {
                    nonHebReason = 'Di luar Kalender Tahun Ajaran Efektif';
                } else if (conflict) {
                    nonHebReason = conflict.description || (conflict.type === 'holiday' ? 'Libur Nasional / Sekolah' : 'Kegiatan Khusus Sekolah');
                }

                // Compute Attendance Summary from matrix
                let hCount = 0;
                let sCount = 0;
                let iCount = 0;
                let aCount = 0;
                const totalStudents = students.length || 1;

                if (isHeb) {
                    students.forEach(st => {
                        const status = attendanceMatrix[st.id]?.[dateStr] || 'H';
                        if (status === 'H') hCount++;
                        else if (status === 'S') sCount++;
                        else if (status === 'I') iCount++;
                        else if (status === 'A') aCount++;
                    });
                }

                // Match ATP sequentially
                let defaultAtpTopic = '';
                let defaultElement = 'Umum';
                if (isHeb) {
                    hebMeetingCounter++;
                    if (protaAtpList.length > 0) {
                        const atpIndex = (hebMeetingCounter - 1) % protaAtpList.length;
                        defaultAtpTopic = protaAtpList[atpIndex]?.title || '';
                        defaultElement = protaAtpList[atpIndex]?.element || 'Elemen Pembelajaran';
                    } else {
                        defaultAtpTopic = `Pembelajaran ${activeSubject} Pertemuan ke-${hebMeetingCounter}`;
                    }
                } else {
                    defaultAtpTopic = `KBM Ditiadakan (Non HEB: ${nonHebReason})`;
                }

                // Check previously saved user customization
                const saved = savedJournals[dateStr] || {};
                const finalAtpTopic = saved.atpTopic !== undefined ? saved.atpTopic : defaultAtpTopic;
                const finalLearningModel = saved.learningModel !== undefined ? saved.learningModel : (isHeb ? "Problem Based Learning (PBL)" : "-");
                const finalAchievement = saved.atpAchievement !== undefined ? saved.atpAchievement : (isHeb ? ACHIEVEMENT_OPTIONS[1] : "-");
                const finalNotes = saved.notes !== undefined ? saved.notes : (isHeb ? "KBM terlaksana lancar, siswa aktif berpartisipasi." : `Non HEB: Menginjak pada hari ${dayName}, ${d} ${mNamesIndo[month]} (${nonHebReason})`);
                const finalElement = saved.element || defaultElement;

                list.push({
                    id: `jurnal-${dateStr}`,
                    date: dateStr,
                    dayName,
                    formattedDate: `${dayName}, ${d < 10 ? `0${d}` : d} ${mNamesIndo[month]} ${year}`,
                    timeSlot: '07:30 - 09:00',
                    subject: activeSubject,
                    topic: finalAtpTopic,
                    activity: finalLearningModel,
                    notes: finalNotes,
                    isHeb,
                    nonHebReason,
                    element: finalElement,
                    atpTopic: finalAtpTopic,
                    learningModel: finalLearningModel,
                    atpAchievement: finalAchievement,
                    attendanceSummary: {
                        h: hCount,
                        s: sCount,
                        i: iCount,
                        a: aCount,
                        total: totalStudents
                    },
                    jpCount: 2
                });
            }
        }

        return list;
    }, [hasSavedProta, activeMonthObj, scheduledDaysForSubject, schoolDaysCount, calendarEvents, academicYearStart, students, attendanceMatrix, protaAtpList, savedJournals, activeSubject]);

    // Handle field updates
    const handleUpdateJournalRow = (dateStr: string, field: keyof JournalRecord, value: any) => {
        setSavedJournals(prev => {
            const updated = {
                ...prev,
                [dateStr]: {
                    ...(prev[dateStr] || {}),
                    [field]: value
                }
            };
            try {
                localStorage.setItem(journalStorageKey, JSON.stringify(updated));
            } catch (e) {}
            return updated;
        });
    };

    // Save All journals explicitly
    const handleSaveAll = () => {
        if (!hasSavedProta) {
            notify(`Tabel PROTA untuk ${activeSubject} belum dihasilkan & disimpan. Silakan buat PROTA terlebih dahulu.`, 'warning');
            return;
        }
        try {
            localStorage.setItem(journalStorageKey, JSON.stringify(savedJournals));
            notify(`Data Jurnal Mengajar ${activeSubject} (${activeMonthObj.monthName} ${activeMonthObj.year}) berhasil disimpan!`, 'success');
        } catch (e) {
            notify('Gagal menyimpan ke penyimpanan lokal.', 'warning');
        }
    };

    // Reset customizations for this month
    const handleResetMonth = () => {
        if (!hasSavedProta || monthlyJournalList.length === 0) {
            notify('Tidak ada data jurnal yang dapat direset.', 'warning');
            return;
        }
        if (confirm(`Reset seluruh perubahan jurnal ${activeSubject} bulan ${activeMonthObj.monthName}?`)) {
            const next = { ...savedJournals };
            monthlyJournalList.forEach(item => {
                delete next[item.date];
            });
            setSavedJournals(next);
            try {
                localStorage.setItem(journalStorageKey, JSON.stringify(next));
            } catch (e) {}
            notify(`Jurnal bulan ${activeMonthObj.monthName} telah direset ke nilai awal.`, 'info');
        }
    };

    // Word Download Modal State & Handler
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [downloadPaperSize, setDownloadPaperSize] = useState<'A4' | 'F4'>('A4');
    const [downloadOrientation, setDownloadOrientation] = useState<'landscape' | 'portrait'>('landscape');

    const handleDownloadWordDoc = () => {
        if (!hasSavedProta || monthlyJournalList.length === 0) {
            notify(`Tabel PROTA untuk ${activeSubject} belum dihasilkan & disimpan. Silakan buat PROTA terlebih dahulu sebelum mengunduh jurnal.`, 'warning');
            setShowDownloadModal(false);
            return;
        }
        const isLandscape = downloadOrientation === 'landscape';
        const isF4 = downloadPaperSize === 'F4';
        
        // Page geometry
        const pageWidth = isLandscape ? (isF4 ? '330mm' : '297mm') : (isF4 ? '215mm' : '210mm');
        const pageHeight = isLandscape ? (isF4 ? '215mm' : '210mm') : (isF4 ? '330mm' : '297mm');

        const pageStyle = `
            @page {
                size: ${pageWidth} ${pageHeight};
                margin: 1.5cm 1.5cm 1.5cm 1.5cm;
                mso-page-orientation: ${downloadOrientation};
            }
            @page Section1 {
                size: ${pageWidth} ${pageHeight};
                margin: 1.5cm 1.5cm 1.5cm 1.5cm;
                mso-header-margin: 36pt;
                mso-footer-margin: 36pt;
                mso-paper-source: 0;
            }
            div.Section1 { page: Section1; }
        `;

        const teacherName = identity?.authorName || 'Acep Miftah Hilah Ash-shidiq, S.Pd.';
        const nipTeacher = identity?.nip || '199602152025211094';
        const headmasterName = identity?.kepalaSekolah || 'Yuni Sri Rahayu, S.Pd.';
        const nipHeadmaster = identity?.nipKepalaSekolah || '198706162019032007';
        const schoolName = identity?.institutionName || 'SDN SUKATINGGAL';
        const npsn = identity?.npsn || '20206022';
        const academicYear = identity?.academicYear || `${academicYearStart}-${academicYearStart + 1}`;

        const hebCount = monthlyJournalList.filter(j => j.isHeb).length;
        const nonHebCount = monthlyJournalList.filter(j => !j.isHeb).length;

        // Generate rows
        let rowHtml = '';
        monthlyJournalList.forEach((j, idx) => {
            const rowBg = j.isHeb ? (idx % 2 === 0 ? '#ffffff' : '#f8fafc') : '#fffbeb';
            const statusBadge = j.isHeb 
                ? '<span style="color: #047857; font-weight: bold; font-size: 8pt; background: #d1fae5; padding: 2px 6px; border-radius: 4px;">HEB</span>' 
                : '<span style="color: #b45309; font-weight: bold; font-size: 8pt; background: #fef3c7; padding: 2px 6px; border-radius: 4px;">NON HEB</span>';

            const attendanceText = j.isHeb && j.attendanceSummary
                ? `<b>H:</b> ${j.attendanceSummary.h} &nbsp; <b>S:</b> ${j.attendanceSummary.s} &nbsp; <b>I:</b> ${j.attendanceSummary.i} &nbsp; <b>A:</b> ${j.attendanceSummary.a}`
                : `<i style="color: #94a3b8;">-</i>`;

            rowHtml += `
                <tr style="background: ${rowBg};">
                    <td style="border: 1px solid #94a3b8; padding: 7px 5px; text-align: center; font-weight: bold; font-size: 9pt;">
                        ${idx + 1}
                    </td>
                    <td style="border: 1px solid #94a3b8; padding: 7px 8px; font-size: 9pt; vertical-align: top;">
                        <div style="font-weight: bold; color: #0f172a;">${j.formattedDate}</div>
                        <div style="margin-top: 3px;">${statusBadge}</div>
                    </td>
                    <td style="border: 1px solid #94a3b8; padding: 7px 8px; font-size: 9pt; vertical-align: top;">
                        ${j.isHeb ? `
                            <div style="font-size: 8pt; font-weight: bold; color: #0284c7; margin-bottom: 2px;">ELEMEN: ${j.element?.toUpperCase() || 'PEMBELAJARAN'}</div>
                            <div style="font-weight: 600; color: #0f172a; line-height: 1.35;">${j.atpTopic || j.topic}</div>
                        ` : `
                            <div style="color: #b45309; font-weight: bold; font-size: 8.5pt;">${j.nonHebReason}</div>
                            <div style="font-size: 8pt; color: #78350f; margin-top: 2px;">Kegiatan Belajar Mengajar Ditiadakan</div>
                        `}
                    </td>
                    <td style="border: 1px solid #94a3b8; padding: 7px 8px; font-size: 9pt; vertical-align: top; color: #334155;">
                        ${j.isHeb ? (j.learningModel || '-') : '<i style="color: #94a3b8;">-</i>'}
                    </td>
                    <td style="border: 1px solid #94a3b8; padding: 7px 6px; font-size: 8.5pt; text-align: center; vertical-align: middle;">
                        ${attendanceText}
                    </td>
                    <td style="border: 1px solid #94a3b8; padding: 7px 8px; font-size: 8.5pt; vertical-align: top; line-height: 1.35;">
                        ${j.isHeb ? `
                            <div style="font-weight: bold; color: #047857; margin-bottom: 2px;">${j.atpAchievement || ''}</div>
                            <div style="color: #475569; font-size: 8pt;">${j.notes || ''}</div>
                        ` : `
                            <div style="color: #b45309; font-size: 8pt;">${j.notes || ''}</div>
                        `}
                    </td>
                    <td style="border: 1px solid #94a3b8; padding: 7px 4px; text-align: center; vertical-align: middle; width: 60px;">
                        <span style="color: #cbd5e1; font-size: 8pt;">[ Paraf ]</span>
                    </td>
                </tr>
            `;
        });

        const html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>Jurnal Mengajar ${activeSubject} - ${activeMonthObj.monthName} ${activeMonthObj.year}</title>
                <style>
                    ${pageStyle}
                    body { font-family: 'Arial', sans-serif; font-size: 9.5pt; color: #0f172a; line-height: 1.3; }
                    table { border-collapse: collapxœì½ûzÛH®8øž¢ÚÓI‰$ßrUç'ÛJ¢øº–Ü}z3ùZ¢,F©!©8ž´¿obŸpŸdÔ…Ud‘’ìtOŸsF3Kd]Q 
@¨Ø}Á®¼a2n±Í¿¿`S'ºô‚FÎðÉìÛvsY>É˜}g£0HW®w9NZì"ô‡E¥›c×ºQã"üÕ÷[Òp|ï2h±$n¤ú½“$œB×[ØõEñZü!<cqè{Cö·ÑæÓ-ç›9Ã¡\ª"ÏŠGÜô‚QØHœß…1“æý´Xnn(Ô$Í4öþå¶ØóY²LÉz1ƒåÙ°5òr=N®}wçžù¡—yv¯wòõ‡ÞW6ð8~µÖs‰›kùbÙ¢éê¦
ã-F£{µ¦AcsÁÁAÖbð¿m>9Zä$r‚xF ÆùlæF'v_ØÐÆw@ƒF<s¡æc {Éhðóþüì¸}ÈÞµÏºícvÐyÛm÷áËnç°ý¾}ÆŽ:ÇoéKõ`÷¨V<¯õñVÙ¬·m³Þ,˜µejƒÐþ¶én=ß¾X4§ÝóC˜ÂÏßX¼¯î47>¹øÒœâ—cgê6“ð!¹¬Önò%¯]'²c§˜ìvÉd'ò³}‹‘¤yôôñã'ÏMäåÅÎÏßãÁ8}÷ÍËõ‹V=>í·`ÐÁ,njìþÅÜ÷_°~ûÝù1ÃµstœzƒßLF[€Ûü•ý'Où)Á–a~-˜+;1”Wk›Ïþ¾¶s?r‡º¾óÅÀÉ¿\O†K7³½Í´Ôêöæ_€œoVjC¥çNÝ¨ëöƒˆEìÕ«Wl“½f•MV}ë_<¿Va-VÙ‚ŸnàÌj•C„·%°\Ð8£€kÌÖÙ ‚¥g%fâÝá.ÿ4ñó÷K7ÁvÞ„=¬EjÍ€#ï2ÀÈúaâø°îQâNç+¬;ŽˆÜ¿~Î£Àñ½8iúnp™ŒoÒYõçïc÷b/œÉ{×Ù•44ïÔ›ã0À·µ?c9ÞÎ£9Œ0¸t¦³ùjSN\g0v£ã•€üÎ‰<Öw£/ÎðÊñWD èn8÷Ýá¾sÃšÊj~	½ Z©³JíÖo‘”ò2`çwù|™H²çg0¹Œ`­‡À‘Ý-÷Ùh#åÐB:ZÀ¡E¯ªE!«l¦RÖ“GO=»Ð…Ø#”‡„ø´M¢MžÓ¶g´}¬íŸ „ÆÈ˜žhcÚÌÊwG‰uH(:  ©áíÛöá6¼gK¨}x~ÆúçïÏa#<í	Q~TÛýÓõ¨Ýïœuÿ@>ZG'ûCcÄØuüÛÜ\OÏ:½Îq¯ËªïÖ{ëÝõví]q1È­­åá¸lŸ„YXæ½öi%ÛuvÖysØ9èýqë®õñãU`
kýfñ°l4ë˜ßËÄ®ïèŸŸ¿GáÕ»dê³ßgÜ»P”–JEðjíéš„‰mf
ºâi€mp1|ìnÂŒûÞÐ™0gè0¾ÿ°™;½‚6ä0Ø‘á«xMÚKhò•2I¶dzvMbÏ«îúzY$x6ôâ™ï\·ØÈw¡ø—yœx£ëÆ ª\ZÕ1·qá&W®”m'/EqU¥6 µRBÀz‰“Ìãé@LùÈhOïŒÜ	Œ€írpJÑæÃñÉ1£R‡ÞÅ<z8p/=°v0žÇó˜õÜIè;ãÛè
Y(êØ¡·„¢s¹±ÄŸÐ;ö
¦3ô¢:ëÁ×ž3ñ’:ëÂ×î¿¼ ÎÚð­íœ?H³óXlà D¡Íò®ºO†Ùð^ld&õè1Œé+ˆ´ÞÀñeNÎÎ²„sr§›8ã¹Wy±`¬4^DÄ™ã;ipÍ–¨ìDûo™n^ÎwPVw†S•'!ãÎwH`]¦ãîiåzoöNµRÌE¨×¥Ô;ër)|ù;@ýíüIËÞs‚$Œz‰©¤È8²ìú‘Z#UM]½ùã°ÅT‡n…*}ÞÄ]ðd	'ÿ"Ç²`ì¹Míåú6èôÙç)+ƒ]'NØ…^ Ü+¶_«*ÿ˜ÜÑT3¬ú±Žöãë JÅ™Í|À$4r®Oã+ÀÂ
»©½È48|hïüì°9ˆ\'qOHßƒßUì*WÜÂÃp0ŸêŠßÅ_ÕŠSÑŠ;ÍqäŽ 4t ?†W:Cxóù=)òŸEá~ö)cÎiF.l¿·ºþøáú%(ŸŸ@ýü”µR|*Añü;Bqx,ÇqêÌÜ¨¤¥?<‰<˜îF<øœÎ@MW¯	0vƒáÞØó‡UÇ˜ý `?©ÖŠ*Fî4üêæ+ÆnÒ‡Wûb GáÐñ«#Ç]­P¢Rý¼N°IÆáÈ$Ù¯°ÖhÉÏ‘5˜u–³i]¸ÑØ‰=d Ð¡çãŸ>øãù`àÆ±\æëëlÏñ Ô%.ëÍ§°^“ã¼4ˆ{E¬M«Àhî¥èC©‘$v "Õj½Úaß3H— ÕèÈuA±t¡!(‹­c÷‚[œ¬uFžì·ú»üÒôâwîE­ !n;Z²­Ÿ
S_|WÌ
…¡ùç§a{(®¯—@¼lŽ?ýn°«_šNìÐ	®X¯Z¦~Ä ¾b–
MmZF5ò‚zTÈ¬›2cäOYŽ£Z8$ ³“¶Á^³#'7ÉÚS­ŠQ¯›kìÊz5F"_Ú}ä& Kdš:ŽÕæÔõ¥¯gs#è Î>äWæ£œŠè¢ªúL–G€pÙ¸{@;4wØØþæ‘TñÅH[­ ßÆ·˜ÍÙtØš5žÄú­qÕx
Õ¦ßÎ<	…jrÝx’‘¾¯?`ý“v¯ÏŽOúÝ7]P¨» =<X77ÄïIâÔ»sé²û÷µÑÌâûç‘÷Í2~,ØxÂ•øû¯Æã6ûÖxÄf×m5Ç-¬œ‹š-êY 1\6b—Î*Ñ9™‡Œ
Ä"àIóˆ¸Vc B€@A_ã©—Ü©‡'LÀðì'´8Ã>l•dµW¼Yãç5«ÀJÁ^9þ°ñ|ccý¹è]>Ì’&=…bOà©3˜£pÖ¸ðçQc:¬öÒÊìÊ‰ÀÉâ|\(Ù‘1*þDp‹aûõöù­}þ`éöo>ßHQ{cw0Ùó¢<ˆâtr84†ÿ˜?"šˆ¼`ÒØXcë-¢cÇ@jéá2¢Zíæ^ŽˆÞuÚû3vŸµ÷‚z9ÊR9á6þÓ¸Šœ™‰åÒ² L	„õÔñ¾	_øì¢ñØ¢d»”L`ñ·6Äùm5m}µq„U‚4by¼‘ágòr4#äG Œ.ü§±öOR~¸õ-^d‡ØÃÉ‘M€Iã}Ã}\ˆ:Tu±ydAßã-½OÎ²|Å²hæÈ³ˆ_iÄä¶„®'Ä?49ªNb'pè{jz[ ð”òS‰Y~±>ÖÇ°4‰©2ãt‰qŸ¹gæ% 7Æ;Ø=‚ÖÄ™UMðáÈ›à+<Å[—'vu‚†®ÏpRuØ[c&Pf‚Æ³3s u6$óbâ^FX&ÌO,öâ+§¹ ³[áAÁ«"{Ô*Ì¡œ¿‡Á±óÕ»DÙÛºO«./æ°3—£Aì¡Úòê;—ÃÓ¦«	DÐÀJ›Ð&›þvó1nû[LÉ8cP{¢–ÚP›ÉS‰C)! ’I±X*.P CleeˆÁ<ŠÃ¨1O¢µÒ9%^‚†œÝùÄáHË¤E“õ¥Šk/ ©óØâÂ-NÑU)s¢†p+ÓÛ{Ã!ì#ñ´å¾¸k;ûäp!†]´÷©öÖ9²ØK`À"SÈ5v‚¡ïžÁPÒ‹jidŠÂ8‹K¸9ð÷ôJüñKàAƒy1rpu<b¯U²lg ¥$îÞàÊÄ)Üÿ-ßå#å.Ž¯…ÊÑgE<é9_Ý¶ï/‹$ŠèR‚BM.çëÏ©)R•ë®}É:àŒ-Lañâíô¼)®!þ„âÛ„Õf•Ds·d«(Z4Ð\sÅèÉ_y¹Þx¾‹s¿Ý’£uMXìÐÔX»Ý²YÌyÙ5—ÞùîûÎ^Ÿõ:‡ðçäŒUßœ±_;ƒÃßØÙI¯ß9«-Tg¤n±µ„R,ÕK…G.£U
~R(çX–}Å7Ë5TNf®msúÆ+zÔî·Ù©òLh¾oïÿÚ>dÕŒáºÖ*_ë’wÙyÓ0?lnÎ¾}Ô!÷hi™ÜôkÈ5¯±ÎµåÅ
Î‚VP½éñrj*CŽ1ò‘ô¹´dXy¢Ð÷/œ¨‘Œ½ HŒVó‰›SgVçyªþá6J/öíWj4“ð0¼’ÆôfySd”¯^1óxÃV,oT•ŸœÑ
Ù%„|üLÜëWßa¨å²<~2¼^ìÉ„Çb¤J~tSaÊò5¾çÄì9£	BRŒ2œ»LŽ®KoÆÀìG.èR…ñcŸ˜Û•è_3z¬ƒ¬ß¢mnl},¶¾e?º5nSß'•°ºþ4§SˆµëÏ6w|ó¹|m—8½Íp«ïŸa-€»¦«?šÃbþü]‘‡&¯"fœš’6*0¤E‘êw‡Ð|‘ÂCÅKe"üPçûWÙ;GÜsÙ}vtrÜÇÞtñç¢X×¡‹Ø0¯¡UQnÜÛËnÜ+Ø,mmªiJ'ù~xyé»¹é•ŽÁèY©EÚšÆT`ó_ÎDxóÈbV‚’±˜vu³„·å¹ˆ@šqwø­º± ÞÍ²ö˜”íâ®˜ç¶jþe¹€¼ÍDD,ÅÝ–a¡°†%'4ú¸F±1@YWËÙ_ë+ç%
ÙÓ@[[¨Ä›[ÿkqsë1nª¨¤[¢f™³%q|rîÀ™}õÜ+6ó`¹nÏõÓmH(ñY$)aîßÇNŒV•ái&¬æ)zu™†ì“5TÙÔä1ùì™¹EŸŒÝF›5Yxª,‚«)¸9€t…‹Ü”îz$Ö»Îî2bµµl¹PWGÞ
æüI)Äy‘ï¶³_Þ¼Ë[C[sIQ‘l¬JÎß¥æ£?ädžÓ!NJN%~¼-ç'HK{âŠ€>pÇè¡î-&`nxþÜüýG‚ùeÉÐÐai³Zš&ž4ñ|1Mlßq8=ôñXúr)ŠxºäBñE:=;é·1b>eû€üNÂÖáKLFðå _^¦è kµ³^Ü
Ibb}ç"¶î€ÙÝï2ò†ÿi`|,g<m¥?Ÿð°H×‰(‚•¢.còDKVuZgÞðÛáPš³¤¤‡­ŒÐGb´ôgZª¦šKïª+›ÜŠ€XÑbugðŒh+k³Ò]SLv©¨*(ni‹”œÅŠ6)]UÖ­(,kÔef
Ùâ´‚ë[š×áª†*êýÁ”ÊOª³›«?Å,•!:aCßž}û¸¶c ÜÿŸnå¥‡"õÆC/wôï²R‘iêð7öþ„gé·w;KŸ=ú§DE‡@ãíÔ¥hö(éYáŽVÄN©‡=ÇÇÍ?úA'DûÎ(ÆRQŸèT•DëØƒuJOŠ’™dô¡r¿!ëYÓ]|¿HpÅ#¦’”<TO¥Þó0ÒjNÕÐ²;”ÆeÚm1ìŠ‰%¿¿ÿ´œvYèö-xá–ü2tâ1yRgÔÝ=|†–úîÃ]À-àRæ½š'¢7ü£‹íe5×M1°eÜ4ó§±Oa0Oïê¤iõ](É¾?2ØT_áú†—¥Ê‘]Ÿ™,ÅÛL€Öî+!vÁN0~tGŸM\Cßu(EXäú:ðsDš—\/üoÙî…:ä¼mfð¶yÌ'Ð2›©Pp¤ÿlú ù„âÇ‡Þåù0	§GÄ&È´K4¸]Ü†\ð‡¦ç¯Í`(Ê|ìøÎ`±ôãõI¯3ˆ5K€’ÓƒØQz§ïQxUJ!eG(ò³´¿§ß’‚6~Jý?·-rþ”Så^{¦]l§¬Ò³á¢£_Áì@ ¸ƒÃ'~–4ôfN4ñ]›çŠ6r/½r  3Çðž;AJ¹\ÞØ°H6ÄOÉ®îàŒö‰ÂM\Dg-·f½7ô½e±[fiˆ~šÑL®8Raª…^¢ Yß™-dä<%‘õHv3§Ñh¨këÀù¨$€ˆ¼ƒ	²å+o(uKîß³TÖ¢%B¢ÅZÅP+M¦ !`kù¼D1<™„î¯–I¨ Á©ÀõaÓï|üÁ)
çðxëöI|
Ý~¢ƒ[KÀÓëö~mÿ =ã@²æÍ¹¿jÞœÒ$5¢Ä2Yº0Z0pÀòÆ5_RZ- Ä¦Ní÷‰:ó€Ÿ,2€éi•‚½¢½†Ç×.>+MkÃ–¿{‰µ©•L7U-û;Û"ƒÛ†aÍÉíœÑJS1œƒàÑ#ËËK+EÙOK‹.Ì4©>U!€~¶æ‹÷66*/ì‡„ÙÏR†Cýƒ	ßÈ@H‹3„ißV;Êy´{y£Ë”ä'.Š=,ú 	äø¤ðø²x€Ã2kÕ%P™¦ä˜fÉ“c¨s²ÍÇJI/V†ŠÉÙ„ÔäÙòJšµé¬© ÄNnÿ·è?ù0‹/ž÷Wër&Æ\µ[ÕÂÏwÎ‘…—vžµñ0‘FÁ‘Ï·xÏFî<B®[OóŽ Ó²ãþ¥Ogã™3)<‘ºý‰x)œvèŒVdðZú”¶°É;Ô_|¤XÚó]ÝjLz¾Ì‚‹X)NoÜÔwæ:q¬ÈËsS*>¶Obõ#ûRîëä¿þ6uËm„w%»ÿ•6•;òÍUCô—j³ $CI†?D±ªyá‡ƒÉ™+'Q—'†¢|“<I”^’ñqáŒïJ5'r‹s.óùê 0;r’Y?œyšìf†Ÿ0Ø;Á%4]uµ ‹ó
¸B·9¯ªJè­³Šì¿Rgn¦vé&Mß-ˆ\ÿ€ü¿ú¾u·F(‹×pÐ^­õç¾£™»íÏ#ÖŸ™g¤Š;L-òØ5À4C|	ÕšÍæbÛ]Ù'ošé!ÅKø”[ét®æqK¢k?ô3wþØrÎÚF1I èA˜ë¯q}û‰Þr‹º¥z{‰"g<—vâÔkéI6ºAˆéÑrY2âÄ­…zÛàŸo·¡=þQS¥ò¨E7¸ô‚/Î„Yä«»K)·ÖS¨ºÝ±"vT^ž˜œhš ¨yÇ•H³OT.]ÌPßflŠ–z•¬¤üh©t^·Ëm)õO1	ä¥ÿ$¸;áÜK/˜Í“;¡,¦ýä´q·Rk|—g;¢œ;ÿ&ÙÆÄpÙ„OSOXþß[ÜÐ¥Š?]˜ÀÏKî=ú|\úcÃáÉ½(ÚÓˆ’²'x’5W=/úÜQ	gh›K½¶†žxh;Ü9õ|oÌørSö¢(òå:/G%õ°Ó>;î¿ýDûUŽŠ¦ˆËmrÐÜCùFâéôfþû1C¬Ý™@f#Úûï¢	X©Ç¬ä‚^rÀ`m§q[™ôÏÌ£Ü+þgÆ·îßgÂp‘IÐûWŒÊC#¶„™YçwËDÞ¦ëÙ7âÄZ³trËÂÀ¿;`àç]‹}·¯b³$«ÚRs¿›ÆFM”ƒOžFãÄïýÀõŠÿÕG&ÜÜTP=ï‡@­[5ï¯5™!Ð„=UP£_?jíb¨9ÿV¨ý1VK¸Ë]m1<^ ˆ	w÷§LœÿL1ÿ•¸¨´À7í1•…ûö¯h8BîGáŒ.õðâ„h™W†]v¼wdÉ>¹ë/w2™:?•M²éÅ°ïâôÉ¡7q2 k÷O[wäÊ4í»åïn8ÁOæŒ²={î×ôXöŽÖüÜò´RÉ6¡à§ÄŒ¢yB>]&/½´¦Èðu±„!Û?ÿ£,+ø¹;®oï½ëv~éuŽûŸNNéÊ2x„³dy“Ç¢aïÊ(‚ßwèßcÁÏ]Œ#4Ø;HxÅ	p–ùÐîç$tº´ÎÎd.û}7žDÞoz¼ÿþáNA˜¸ñ¿ËêJÿõÝäz& ¹:0-Æ¯Ñ
/b7úŠ·P¤šº·àæYÃÿ&†;SÙ§°¿uÝ™²
‘Y…”ØŽŠP:uùèzT½•fµBé%ã¿–HûgK‘é¬üîéÂ;1ùËÂ¨Â¥ƒèU¸K†RJŸgy<”þÙr‘ôe¡¹*EÄRžýB¤Œš.ã«KƒÚW‰=&^ §–öÐÉ¤ûæñÒ·K@Q²îeáéË\'´`6GK…“Ë(q>Ó‰ŸÐ½µ™„ì|o%†óçNÄ0—z NhÝ¨ØÝ§0Š¼Ë3¹S
2¯ìŸüz|xÒÞg¿žœí³½“ã7Ý·çgüÞ¾£“}KÌÍ÷8{ÃRWø­ñü¼ v“Æ¿¸Ï¸ù-w­›õŽ…LPûÌšüÅÖýmîAäYŸ¤YÄ^!iö1soŠ•¼€œ!ýýWNáoãùãô*Á­R|[ýFƒÒËÛù/™ñ~™P`ûítçÙ-2äerí”GTñ\ü‚yU­qÑEQzÕÛé–Ìn°Ì•%üšÝUò‚­©£Ç”­çR¹>5l	å"Æ+ð_«Þ^Gµç^ ËfvZÒÑönÖÏ¼%ÑŠz”ëžÇ/œOæ¸+¸QâÄ­¥mrK7/k<^%õ~¸¯´¼(šGíýì½ÏÕJûÑ²¹;ðcd¾33ÞÉ›ZMðËxwÍÍ¬r·WóûPa&+‹Û<vÚ<8•?õÓl<YC¦WîÔÆ^”ñ.{‘Ãæ2IðägQ2<ùYA‡°î¡€Ù~´¢Š½jV<í¿µÙÜ`ßØÖóæS6˜®ÐérYPTé¿¾ùC£oþC£¹ÏŸH£o±uö&ô½ðÏ£ÕÇ@«ÛÛ@²­.•s±9þÏCN"õÇØc{nâLþ—
"
Ètªß	†ñ Æ[n§M‡ó»tJÿa{™ÏŸÈöå*°*|'Î¬ö£ùŸž¾Îà€û^ŒV(´/ñd‡òÎÿ¡b‹AÑ³0:ó’ÿ9­fôzÎ|þDz>‹Àª§a¹É§æiæ¥òa £Ä›8>‹-ûÿÄ¤(#–¸âº$bh•$ä5öòb‡¬ó§Ò:ß"[|Î>¿tZul‘ŸOÜg}g<7\![öJ=à!è)sR òNC!îÊ§³N“}/¿â^ÿ cµEÚTÊZ+p"ÉÙ¬ÙöþÍFXýé²›1‹SrÊ(NVñßZŒR»@þM´TjUPó³	c4¿ï‡ƒUÁûøÏ½ŸûÇ‚þ¥œümSôêu¯’’wi£û
¯,5bÑÞÖ^Ü»yqïÏBÙžÍØ+–ÞÿŸÇng4Âë{õyñ“ÙãÝJP	ÔXÇï%aä\ºÍK7éÂr‰lÐŸ ¨"|¼«ªz5-Ãf]gòmòNfNÓ3ï{'ÇMú¥5`:&`ã¢üýûì'þµéNÏ¯Y’yêï¡ƒÊå<šÿ÷›3ùnsN+fë&5 WÂˆþ
ÒTò.±!ØF¡]<CeìóZ½7x54 ÿ‚TRÒŒ½œHw¤å%×ÕYä~%WO»ŒÜl6±DÝúÒè¬ÅlC(¨8OÆa„4§jð]œ°·fúÞ^ßTñ’9JæF#™çª½Ìó\›7YH¥‹ÃN23tšÊ#l¨ãFQU+o ­ ñ†q'FÄPg®Ö>oÿ½©³k”•cÿg6ë%@Su\§¶øñ°ÚÁ‹Ý—?¼ô‚
ûU"÷ÒÃ+éÌ.Œ<Ç§žX]úqé žÂ[úå§P}Ç o‘au1Q££5
Nî†¦(æÅë×Œñg­Xœ ‚ArLÈó:}žYAõÖçw€ÔµSÅ90××Y£Ñ`‡86öZœhÓÕ“.¾JJãO‹Ð˜ÍgÆðÍw¡M`êœMcœ˜&ãÓHuZQ£X¨Ž˜¥†mX½EÎuÓ‹é¯daÈ3Ù¤yÙkøÙŒ@YntÌÙï¼iŸö?ž¼ízsØî½ÛkŸí÷rxÁÅï_ ?Cì8žg. ¸eÁíÛV~%æA<Ç¬ÍaÐœY<“ê0T‡}0›}‚R#ï²Rxm¬GaY¬—Iošî7 È¸Z3yï|ˆºÏ+&‹âÏªÁv¨!‡ß¼c.>m’HDË–þ4–ÎdOyDÖ›1Ù™ñÌ¬stãôú‚Þ¬ÑîÍ½ì7`xU`— JFzåDAµ²ÎABÂ„aà’ GÍŽÅb[È^£T6¸QßdâhêŽ–^ÂÛÆÔÍQ¼ñ"7€¸ªF|„Ø(7œ–Æá3|]°¢6r]¶{=®Æª ßDÉ`žÚ:ƒ5Í³$|ž2#ü¥S…¸b™WHœYß›ºá<9sG¼|yé×ŠDdQ.öË&á£ŸÑVSÜ¨Á“œˆeS(0f-A—&²ó^j}¾êi€æöÆÆFM¤7ÊHéÅ$ó Ôè†^>d›:'¥W;¯ØS\´½¶*6H‘m˜ÌP=ÇÅ@©Ò¶ŸOÜëžûÏ¹Üta8áà¶AHR.tó;p¯É[¶NøuÞu¾ÒâhÓÇJ‚ýDg\Z ¦a>W²ƒäø:~"Éé'·	ãÏ¾WƒÁôh&U*ÇÝÓkÍ$<¯ÜheTc;‰|;Æm:~r€­›|”ÚÅñylPýœULö¦VâUs6ÇØ@Ž§Ú
+¾¹•å›¶ÒñØ%ÕæVÜÉPU« 1¥ì$!ž•ƒ2×á2mÆÒ/¬Ì‡™­›ÿ¼òP²›ÎãÎ!1XÐj*Ð
Z½'c0RÑFäNA×_¡dŠMæØó(¯!@—ø;eâe“óF;²¢¬IøŠ_„z?¾¿Òè ÷\“¡³¯Äz(ü×¨’:9Fƒ°ïý‹$0A
8„×érÑ„bS‰HœÔÌ¦LrR4º8wWò
>¥ØŒLÆ@i×‹‘wášbÀŽ´i©hÑ°X‹ÁbuäûrYçB,cwÈ_¤É<¯›Ââ+‹¼ÈÕç‰ÖD™ìórŸ¼a%/Oi¾“ie)­ rF³D–`ÌÄY­´'ó€µƒ!æ{ô1›:ño'ÃÎœàr"¯ƒ‘yÌÁÜîÌw¼ ‰Èí> ï½ ß8Ôµf>ƒ² K8ên³f%#£©½·Í".Á¹ƒ"úëæÔM„üëæ(
§{Î`œÑeOÿšÏŽ]ßÅK~¡’‡£)ÆJ\3UJ«¢h6fálŽ&Ó!ˆRØ Ö\†ÞØÍ@Èsð‡4ÉÌ\‹fšJ‘WI$Ëà(L¦šxÀ„è+B/0®‡MÃ!üˆ`ÓN®ÂhÄS€­ ÇÁÛ"Ý8£cMc¼¨…:BHÆ1ò"mSÇ‚rM/øó¡W+¢?àPÔ|5œ¯@±ýb{pÁ¨’!+sÖ×Ü”[ÃÄaš	º`ñu0@:ª™Û‚dƒ—Ýš&:“¤kbÑo$¯ç&€Ç×…š]g0™£êà Y‘æ¦Ù.‰­Ê¹Â#Aâ+^â¹ñþ®âé¶@àN·FÞÀ…¢J¸Wl¾V?X´›:iœu>ÖÙw:6o‘Æè{:^ÿ‡°½¤º‡`¿ZÏÏ›ƒÈä:¡#.ø]Å^3……rˆñ‰(Ïó£-9)…8ÍqÄåüÈOŸÉ3kxþù‚ û‰3ÇŸ¿§ó¿_üF¼Žä9]ç¿€ß4qŸe£j,ÉÕ„ÉºÁpoìùÃª£f€
)F˜•¸­„ð Ñ<œhð€É˜º™®š	†òÖ¹t|6f2™#çäó¬h*ÇMÉÎ„§°îÌ<iòhH`^¾ëv1Õª øÎ"\ò±ˆŠ¿‰_7?l|´ã(¾G&b”‡Òf©„k-“±HŸT3Xb³ù`9CÖ¶|L†b!˜8G0uf±wK‹U³ÄÅríºržºR—FZú©¢±Œ0«êŠÃv¿úó+ˆ7Cm£¸1‘%Š
ÑEï\G©–ðE©e‚\ñ„ "õ9eõ@¢%DZõÛÐÎË„•ÁF3ýM}i™ï –èƒ´x»©¬g>3úâ'£–ê}@ŠLm|TV™ÏïˆorÚÅ“ŒWpÁx>À{2.Ó6É-ÐÁ(„-1³ØT+Ç,Î5Ú‰°yô´F§g°]GÃ—Ò(œùyÂ>è;;;Õï7ióRÄççØþ™þÄè€7µS­Ð!?Û¬Öy¡_ýâ¹WÔÎ^úÛ´Ñc€)©èüØCtä¦yGæþ't† Ÿ-J?ø•¹ŸbL`Ex¬â'àO—ªÆØ‰¼O.¿>ˆÌ0j{ôc2If¼*yT`^éÈt³,bMÑÓ(D’31/ûÂŠA)ŒÄNaúÎ‡“ùÌ„•ãó3¡åY†ƒ½†‰ã€ñµ1Týð¬ž;N³®&-Ê¨R;|¢Ã`N•oÚ½N¸t“žÃ¶OáêÙã9F¼ûìÝŽm<ÂÆ’xfŒªw¾û¾³×ïe¦åÅ=oè^8Þ¶Mtõ'FI47Ö>æåä²÷ÔOsÅ…•ÝXiýaÙE™2ó>Œh0GmNÿ-UôÜj;§ÞZZ‰èÖ2vDól×Ö„·¶‰	‰Y/m¬	
vÄáÈöIßË‰ÐIf‡Z¶úi!,SVpÁ½;á‹Qùž7˜ûó)Ýñ]ÔÀL†P+*ÄD†ö#ZûC7‘Ôÿæ" †¦imÑÎBítðÛ*óHeœº)»ˆÇ× vj¦YÑñé½0Häžz¤=0š¡m`Ïâeá¨å¾ŸïŽÐv§¸­ö¬|±ÉXUmù`zªÓŽàô'« ÷bîOÞòýÔ ¬2ç`Þµ¼(ÛË¿3±»¶ 'ÌÇÂÏð(bú7ã=·"µä¾_'~£”£KiÀ \ÏùêöCØqäÔ+è
™`Cz6{˜õÔ#Û³èMw¤ú¹ycðâ"ÆdzÔ ô@ÅÁ­–³*XNž/WAÅA,Åq#u¼¹I¯X¯Â "û”Uñâ9"f{¢Gyuvà8¬Ä›ÔÖ¨G}Ã:rÐ#,ÀìŸ˜^lZ™§«-ë:Þ3¥ês³Ñ?½ã:íðžvÌ—f®¹Ö(ÿùÀ ¥þBJ(ÊG÷)•¨Ü'ô¨šD{àÎØ‘¢ã˜½óÐìÖŽÇxì½ÖY¯y
:”4ŸÞ¬¼ù€Ž,°ÙÍçÏŸllm>ÞÚØz¼µ¹¹ñü‘j%ç‹SÖ¢VXuoÿ˜õÎÚý.]›Žp†%D#0¶ä–ª=qgŽïôÜIp(o†ýó²¢ÁßæÇz‘ÇÎœ±s=·€ï`ù ´½—ÍçÏžn<Ù|²µ±ù|c{kcã©êÁ8Cwê~‚_€¢ä'thNáñ¤ÿ¤íÅ‚¸ËÛ’¥D3oà(ñUÉØf- é ¶ªH«´,Ùž;ùá5Z`ø†QÞdZúçü¢Õ7˜ê¤j—+Ý\™-oÓ®žß.bã²YIÃx6;§\ZÃÓ‰;{Àmxß‰Š‰—9bèÄ^g¢¦æ*gX€äk@»Zi«HãikX|™±äè8m"Ãì£ª]0,¤km\XÁÖ’AãåMf¨/mÜl£ ŠËwd!uÂÖþJ—Þ omñ5±TCŠ¶Ó6ä£åbR±6«ûªÃ,m—Ã0OÛi_¹–ÔEò°m¸°^úá†èèÊ3µ@’xHäñvå2(çÁ½Â-Ó(qðÍ©åÀÉT±zõÚ[Ðd¾tâm?ùD’FÎéŒÕ^Œ.K—”ÅIŸRÆ';wºM<Í8T/?ÐÖ#þâß™V ?Íf“ežsçÐ<sËÌ‰ü'W1³gY!¬×¹É¬¹k³3æ^†ÒÂ8s¼¤·d4¥}%;µ\”¼SyÞ—ÞXˆå¼¬Iÿô¥<u®Å“­¯Òµ+(¿ôÔ_f%ë¢•ŸÕL…¨,-ªã>®-:jkáUµf)|c[Þ¬`UsÖ0×¤Ö§ ¤çÁª6?ÂæžŠÖµ&ŒHM¹ÿ`ŠÍdìÜhyrñÅ<r7?ˆ­²œ-"ß¥$Õš€CÈVêÄ.,¼±Î€hl®tzrEöAº÷qƒ¸XÅr³Î¨¶A)7†T&´™Ù5³Íô–êÆîpî£M“í‘…T3¼#º«Üîn<*³¾(ŸÄ¬±„ZÝ‡¹_¿?MÛV8›á6<š1­'Ë{ÈÓH>±çO_féA °ð&^ç]áY‹}çN	åvœ2Öé;ÇÄu(Õ”·›þÔ0ÄHC7>ÇÆ	dZ[õWeÑ+AS4úÉ¥u-à@À¶ ¼@?©·†ìµ;Çûí³O_:Çý|4€(4&Èm¼–æé#R]/‰´8’`¸ÏŸiQ#îWøa´’;ƒÔÌÄ)ï‡N"qÄ›}jC`uÍ"†!l0Cß¹Ž÷Â¹˜SÏ|f´óFõäö¤Á»ü¼Ž?°ñBê Eì	_Ç:ÛÜ¨Á6Ê¨ ”'w¤“ü@`êæ¼A|¾’)¡dŠ¤Þ¡ï\æF…ƒùáq‰R¼³®Z×éÂ‚¤¹a¤m¤ƒ±‘vaÄÖ@JÉ AØ%0c´†#ÙÄä8ƒ[Ö>¹ÆÑÑ`Öí•¡}*üJF	á½U'u­ÒíÔº¬’6µ˜ò&ršêiÍ¯3ÝGT?vŸ2cTén¼–¶KA»¦ÛYCíJ\‰ÓfÈXý’G…è¼‘õYÇs²š<'KÙŠNyÌ™Ò_é}Œ¼`X…ß8&U4ÑÓB¤9ìŸ~zZ£Ó^ì~êŸV(:HÕÅ1?ùµ*mT3sll-H-j(Ë]Ñòê•ŽÅYàXœéjäg›yaiÉâ,O¶Má-Ý‚2ŽE*´
»¦%²-Xö V¥§«dø1^W'éJ–)¨¦¥*ƒsº@‡¢Ø›(œž…\HËjÎ‰Y¥n‰Ýà3g3W®;9%¢Ö?ýœÉQñ9ç".Ô;ä­”‡ò÷åãÎSq•×«5GaÔq@F¨Æ~˜Ä6Ÿrs0¦çUÊ!‚†ø^õ¿Ê5a,‡NðWH¹¢’Â	bJK ×¶XAŠ:—`Äºw¾‘SÄù–èø§<®¤N²àâqœò-Q´ŒleÑÀË2C½³khÙÒf©4ÊÅð+ÖlV–™ñfÛ´1RCø½ &<©Æˆ2–¥0Ìlü¯¦rÍ¦JZ&Î.œ'™(;ƒrùYb‘² h>ìAŠ/K3"ŒxL-;Zdc|JÖ%|¬j+–&äçì	øOZ¥7`AÝüþôS¯ßF`¿÷A« Üf™öPVTgÈZ“Á_Fk'Y·°4*G[©ùR¸”{‘‚öÄwæ	NY48É4CÈG¦oÕšŸzbö8šÿë_×Ö©Ñ”ìú§cª‚wie>À¬j úþýwµ`:v ·O¶~(ñ$Ý[ÌðŸ©e·=áÛaˆÊPzL7Vp¹âZ¼^†Æm-ç«Ç¾7p«u¬ž¥jñçjŒöœ²®3=ÛÌ®å‡8JüÏ²½æmtb¹r%þ©ø¦Øií›ºˆiQñ,¯3Øœ	oI×Ååi:Hâü¿æ0)`š®L³#³Ñ,ÿÄB¶0WTÌÆ¹èUVÌ5‰sÔ“uëÜ™^³+wök¼3ËnÐÎ­î,œå7n‹czv`9EéDyØzŠ­53ÈjKƒ*±!Š6¸ø¨Ì…’&Ù‘ÀðÄŒ¿xã"–hƒ¥x!ó~oa. 6`Ð\>ˆ§$tÇ¦Ú®ÈcZ«Š“&Ø”Mû¤"šò`[v³Æ‡9ece•u”¾Meå?3`®*‹	‚Bº)Ní‡jÅÕ‚/}®¢{¥R!YåèdÿüðSû}ûí4|“LgC7!ÇÚMåÊJòK-ãñ¯äÀŒB;Kò†úÙˆf$’‡*6#Cú&©œ\„Ò&~ŠY¨ŸÆ4¥Æ¢¨¦š¨¬­<ZÓ&Ô#}Ý¬¦JU ›f!‚g}P5|ÏD®eYq3Õ`\—Y›´òK†ûdýQ²èo¾_ï?‡^ËdÌx!0Ù&vTB¬D‹‘ðß°0È¿ê*èûÔ5úX–B_œg,H±B7ø® ¥ýž°©¡9ÌãAÞžÛ¿Â¢p —Q‡¾$äÜöýðR‹±äì}¯`K\qÎ4û6¨MZÌ“A‡H¼¯.™®_ÑÖ¯ŸÕ2Ç=EÚª¨fÕT¥<fœÈq•,¢kü 1Q3ÉÐ3Ø9œ(¹™èÍKù©éV—hƒ¼¦Tub.|LµíÜyž­ ‡Y;‚×—s ÚZÏ¼€ñØÁogÎ½:p¦víý|ê$TÆ¹Hæk3“ÅV1àƒŒ‰0¤jí£e¬ôÉÒ©rg¦R‚ÅxÀrff˜àw–Î·Î¾Ì¤_?»É[M¹ISÚK3GË ˆ w@YBùOü8ã©š`±áT\™¡ÔnÔJWÓ¨ ¤ÌÃ0R¶ëÞ@¯Ù‡
-9æ)ãKŽßpÉñ/-9~¡%¯|Ô«¶VªŠe[*_˜£K¬lß8Ø3¶QŸ…ÏŽ0¹ˆÝ?@¬¢Ö8T”…d¼¢4Ce}- Ÿ¯?f÷	ŽOðæ=fØÐ_,gLæÆ.|‰!à¦	9›¤!;BDþCaš2ÍÇ\êÒfxˆ²ÑPJoKµ#-àZ€aÙvÿÝ¢©Õ4[´Y·f¯œ)¥ÅÓé­˜ø‚=|ÅŽ	O¨NóËŒëfv††¢œ£ZÞ”%a³â57”C¥ sHÍî¬Õ¬]Ë’àŠûœ©[ûOÍO&°6i½jº}P¼LPEv4CîªrË¤p°B¸ÁdÆð=: ^´9äø‹ôÝ Ü}_±Ï?ÏytÜ46ž66}¶WîÃâª˜Gª?il=ÍT§_ˆ#Äöñ{?äÙ5²«½`FeáµRV•+5)‚Äë–ñÚ@/)I|áIà8wG)½¤ZÍp+¤Ö­&¬(Â4¢è#æeOƒ)žTú©šÙ³Á—%›¹¤¸ûJývÁQJ9Þ €šr'1\:‘«þ$[¶°)Þõ—1 Žì¢.¡ú¶)`DŒÓç=’ÔÈ‰#aØ\-œ‡(“ÙÑÁ·j†K|hMAÏ»–[‰DÖZ{2W‚[xœŒ0Ñ;® ˆ Š²"ˆ¦ó˜\TÜ‘3÷6r|UÖ,,ßíKa˜‹ÀËJÒ’”ÉRn±mÓW£ƒ7¢¹rzÀIª^m¤#.£ÙLp°VÔ¿ÝHÑ×ää“Ž‚H(³nå¤$‡PLNøY‚¤|
H?¹ì,(Í¦²ä¦žÛÉNoQ‘ RÒ~* «eÂÁ[mÝ6•€—þH7SÍTqìµe…Ïe‚×öòVäP–šÈo÷¦<IL-’z*ÌßµÜ!u^^ú®”HöëÅsµxSzñ™<2zµX>2ÐX-‘ø“ó¯Î%£M»k/Ø•2¦Š‚¸œŽ4Ï¾«51×BëÍ²ëãTLþVpÚ¥l÷’ËBoZÓêÍ8Œ’jÕ©³÷~û·Þ§“7Ÿ~ít |C÷ÛÉ¨êÔXÃþæ¢ðœ³hrr<7VŠIÅIÒÓ´åF‡š"Qôu“1Ã•– 	…í¶;JèCÕ[ŠJDsœV¶³ñL¦¶c¦0Í7ÝÞÉ¯ “©IØ™lö%Gg"£Â`ÚjÚ6Š <ïÂyã©ºø®€Ú4n·Ø =½¦‡OjìïìiÆÕùMc4¢†ø¢l^­QÏ²N›Ðâ‘“Œ›tÃLµª*ò™À ¨imnl={òh?ðvêWU‘Ì¡èÓ‚]v@	1¥ýQ¦Ô(7“i†KYáÌQþÉ[.og+¾kåGÚÃne+²‰ÝÆ*v'»Ø°ŒÝÂ6vGëØrö±[XÈJldË»\®n'ûa–²…¶²%[¹ƒ¥ìŽ¶²;ZËV´—eeØ¬Ü»Àj¶ªÝlË™‘Ü¸–#¶È¹êÝÚ„¶Œm53Z‘Y¯À<“}¹…&S8R¦ï‘ÛˆìXo]‚iBÞ—W u“à¬=]ap;ðÚMƒ«3¬’»J~«ÒÉ³–‚sÇï=éÆMlã5³¹¤Â	ÍÑlÀh7
¡~KäM·4Bfj¯`…Ì ÷
ÊÔÕ–i­{b«ÑÀE¡"LzsŸ{z}O­D|“A.0,â¡*†Ò+4¼Îåo”{n¢Ò=‚L¨Rl£ÉgCWô‘lý[G"|1ñrÐ}éj•Ù÷éžR)fÅ:%#ícuï‚âå—04LJ¬@˜\M]£.1çPŒÍ¶ÛønèŠÌaxíÅ›gñ'Ê:u£#ÑÀ«ÔÆ§¹|>¡ûÃ¶€Ž¶µ,md^ÚÌ¼²¡ùv¦fc9C’Õ„+|Ø*Þ°ÑÝ¯`P;¦kÓ¼fêš²T`ÜÈTr;¯ñý6½o ±«LLxÎ ÅÞÏýëÆ¾;À<i–¦:{ï÷óÀ5žoÙdCùòÓ­Â„} øì¼bOPÖ^¥úíf9^…+½	+½U2ŸTÅãÐž—*©
ä7P:lß|NDø‡DNž>Èµùh“Zì%‰¨ƒ[jyë
JõEÜB3ˆû7Ya&·¢ÝÃ~ç¬Åº#	†dVäƒ½¶ç€ŒŒò¼cëÕ§†^Lr Ž•‡6l8+*èöÝB9^‘·’6ò_«hº¢7Þªm°¯ñ„ÐÅëfœëUFŒO¹.sSCßƒñ a±ËDfšh£,ÓEñTÆé/Ž¯Žy„p´ØBË>ùðaAY;z6Ü+¬œÙÒÁ‘›QÁ;”rjüÂ,{«<ã®ä€›¥ágÆ†¿äÀóõ´/.ª
†Q³f6 íÀ¨¥KXÐB‰ó¦ý­[Nlë®ÛºÝÄòËçZ€‚fg«òÅø'Fê”ÔÕÔh¶8…‹ÍÌ%Í
g…P§Ù™P[ªnF!N¯Õ±0#+ kGÇA¬ƒ÷å`Ž1MåªÃ¶Ç(AçXÈä“Í#	ÓeƒÜ0ò†®ï%×ùŽ~ØÔ¾8?han±(æz¬v’ml»†Üû+ÙÂ×Ù…ƒ© 1Ó5@’ÌfF Þ1Rµ‹xVìýË…ñÓ>ÈJõÜJ§)­¶^¹*¯™¹3ªîº­V­@-`ÖËÍïE®™­òfŠ  Ú‘§@ÆºÓtäôZÍÞ<31XÏ7cîÂ–&ØÌ
-0öR[-sÞf)fcÐët9Êlà)šË3	¡•}K0Õò@õþi,e{@‹Y3¸×…Õq/{Z‘õ)—íiWþhºüîœ¸fF£	ÃdÊÑÈÉ–HOÎ0”'ÒÚ™ÅLvž>tñì0_4ÖpPð.™Y^Üèå8”Zbt†¥ž,3’‰IG’òQnæi¶€éúÝá·L²xÑ¤RVôXž3«zô®.æ’«—r`¸1OVøŠô©ËSFRÝ¦æd“YÔB“³þÉŒSwýÙ¤£ÔL/‹±>DÛ)šÌ¿ÌàÔ…uññZ'È%™Õq­à±~b+œ¢šZÊ‡‹2öqüƒ~ß›¸HK]\XGM¹´e]‹¢4gk1Ûîœ}fÎå_EÄ`EN]úÊ¾wé‘uFÞ2É’¨šÅ-m[8ðsw‘Ì`(]k>ÊžÊÐ4T~,¾âgIœ¥	-‹·øY„»øY	ñ³óa,Äcü©V¿WTBá¸q¡¡€ð‹{¦'ÝJáîádu¡SáWvÅ¡‹x_·È†ŽÔ½;u&ß‹C‡×ÚÙýiN½¸èfÃÏJÜÄ’^žÃÔ­&zâé¾»ýð<¦Û[µá!ÎéÙŒõ:â#[MŒZ¯)	® »	ˆc	J˜Î¨<yºy¥óO¼@%ã(¼"ã-ŸÇZû´‹×T³·.^ó)®pâñxs_“:qâá~ú%ªx±,û¥Ûï|zÛ9êw?ACŸ:¿áÝªnðÕ‹Â Ñ–}u"…·X‹ócö„ùm^úî[7hwAéSÉ{àÃ5u˜žÔ–ÛŽúðoó„RÅ¤h>‹Â™ñ„†«tæø®×îõÏºÇoÓëJñƒºD1Ã¶µ°´d±Y7#­Zûì¬ý›I¯¸¹*¥Ó/‚1.>.¹X
gæx&S]º®¶YØ½¬ÊP
Š%²XÄDSÉ:—ÛÚ!Ÿw1Ÿ5ðä3´ì°	:¯ÔÙ»öÙyuÐ)vÀb .P"¯Å~þ^U¬åµº(Kldtmù¿Áx­vó¹ wËbˆñç¶Èe§Ë¨¸¨\§åPÃ
¤µ}ºWõiÌØÈã™{#o²V4cûFeï9rÿ9÷"¼âÃšZwŒÀÌƒgí£¥…|g9ÏãlÇz—b§ÃÇõda"ÐºÔ;ü[D´Â¿’'áwmT/7Fä3áfœ¢Û.’ìB^÷Â¹æîŒ}Mæ‘7Á]–ÑÉä¶6Â ÐaÕõþÈ†îÄa”¡µ©šîÏ/˜»ÜyH {<&:T÷Nk@/‹æÓyŒ]Ø¦Ú?Õ>…gS—\óÞ»Á'¸d½ý:£=ûçïÍQ"J´sSgGÎÌõá½¾uÃc~=Ê2´Š£RMÇÑ˜FóI´®žm6a0_ºuÜ'°$x¹Ç/,Ÿ¢À2“ÓJ[ÚÒjñëq©·½SØ¶£'š7Ó¶agw°ZðvŠÓ‡m»fÐ—öä!%é¯öaMoT§Î §9¬9ñw>AqÉsfœÑñŠCÄ~uXÕš\øøµý¾»£EÃ áJ, æ°­â¡[Æ1;efža•<‰Wšì}ûømû˜vÎŽÛïHÚ	ãa”US°}¤IMá<™ÍñÜ6žIQpî5AI- Ôå{Ñ‰$Ì
/…³,¨hœ b™ŸÇçÙFn<ƒ/nš¹ÇkâmY~ÜÌÈÙš†CZx1*Âº±Ý 9=7ÐÚs¯*)ðª@©œ=oFÞ%nrGÞÔíÓ¶°–½˜{­®JõHÞkI¹Ïâ8ŽÖžˆ\pm¦2)lš>µäÄ€wÐõùÎ²·&¿ðw¶öýfMÓµ¢ê{3rg¾3p«ëŸ?ÆQ¯_zuºpC±~ÉŸe}Ó›·ªyÊólŸ‹æµ&Ð®—þT*<>·<.	cyÕ€:˜ê¯6zñ×šD"×
¿Üçˆ'Þ÷QÀaí._†igMÖó|©g^8Ìw.=MyÈ$ƒ“ÉaÓÙª’Z–¥ªH«T7t®:ûœî+§ì>ëŸ
‚Ò6 âÿ7ŸëÌÒƒÅd¦IUíþ©y©µ)M'™u²7d2sÈû²§sØ }&!ì
^Œ¹ËD)¼îIÄ#M;í[’~ÁB&Ù¯~]‚R„¹N»ÛQE²þiÆŽîóè§ÐÒ´ìô[H„ej°¸êKg÷:Ë2©Ñp^~xYý|ª®ÌYïDbAêDßl6?§F€ôžÖjÖ²š5Ü“lÇ‘^Ž¦ëK"**Ç¢#u`TÓ6´èLÝXø“Ö4»ÈvˆUô¡Ø’°¥Sµøe¨Ù~¦.t‚†³AYOòTR5Ã
û¬UBláÄ2bÇÁC[¯ÉN(Â$­­œìNšKIØ{ÅG<oÌ‘d¤®ŽCôDÃgºá~ Ÿg8Ê›xÒ¾(JK™—ÝnÓ±ÔsÙWLÎ/ZÊ®’Y¢Œ	ý•Ê\¦›[#X)e‘§\ˆ³a(‰†|'ñÆNìùd½’É„Tøqú¬".»u%‚TÐfûãi:ó2Èkæ…§?ëë(¡÷ŽÚg}ôºÜkî¶ûÝ“cEÁIz ¼µùDäXìY}„°Y"…~Ót£ÖR.“¡OÛ‘Ó¡,íCcVœ8K¢üþ½RÑ^!û£¸#Œ§ýO}mNÏx–[œä‹c@«Eñ‹F£ÆÅD%!Š²{[NËåC—V\5\‘iáô,Ö`ËWf”þ+š¥W6L'@­»{Ô9ìwØÛÎqçŒAê£"£ÑY%`Av<‘kJÎYOm“rI¼r‰½Rá£Î
9ƒv®ÅÕ´>-Ð£ÜîŽÜ	hý\5­fë9‚#|q†W  
ÝvæùÞ8eÅ3TÞcõ	.nÄà)º$O8÷¦Ò¼Ê‚¦MóÈu`ÊQß¸‡Hš“FÅZrÙ¢/Š‘ž&¼;EÆÊeÈ’7šõ8§€-|•!.£SÕ•ÎD'¤ìÊó)¹=¹C‘>9P1‡sÐ0×OAZà·“Ï§è¶ÔÔzÔC|³ì]f{«E›á¢Ê^ƒ#¸²Ÿk™øÕÊ%Ê‚•M‰à&WÕj@ÄÏ)Îq‹µÑl˜šïƒ<p„äW±²}'FŠZh=ÄOÿüm»×æ®BCÁœ	iŒNÜPßØÄà½ÊmnµF¯·Ã¢±¤ø989îwz-ãaƒ›9¸³”{ƒö±tW­ejò%Tû°uÉ2UÞÏ§7Ä!{„|ý°[Ø%U…%ŠØdìÉ¸“™¬)Z‚Òg.f8œZ1öÛoúí3TªÝýü­™ðH)ÄðÏð¬éI¨5“à·VþTj7Å}u{ý³óƒ^×ìd¶]Ô0Ûã„ŒÈésÆÕëô»íS$bB’ÓøX=:ûãûXð6B*‰;.pIµv«ê™‚]}ô¤éÌG:£‹í&“c1íoÐn€W(=äñf[p“k;d"	žì-1ŽA ”PC¼»ÄE‰ÚÒ¼9L†äzŒ—À·Ø[Xx¾ýp’âŠF>4°+¤VÜ é7ël«Î>.ÕšìžDžRÞèL&ÇG9ÍØÁ­ Žl€Oœ¶§é–V¸ðÆhp%˜Q[´¥T'°1µˆ¿¡ÅŸ¿"¦´@#r\ ùaÈã	8»xZg4_ {ÔTy®?Dƒî<’–ÜÔÚŸÎ=o~Ÿ„Áô³áÇMv–Þ(n“€“gžó±nXæVgèÌMÄ„YwÈÑŽNáÒáÒçFl±Ç‹|: Ïù€Ðüù=~œÙ–ŸÕ.<R^îPyÁ±òÃ\~ÈF£ âÌéñùÑnç¬ž9	íîsâkÑ?]+;EÅ~áGù 2³+’þY°‚æOÿ,HýƒÔd=xÎu©-„±þÁ\MK,dxò”3ÉµÒ»šÒÏ’ƒÐyxšûef=¯Î´_Z¢ømÉ¸ô± ŽÓùuš=Ú>¦E§è™þÌùÚÎÆo
dÖµ#àC ¯€H×î
¶+MrhLÏ\Ir‡Ó3ü,}‚&ú*8EoÅIZTË­V3ÏÚL°k:K&˜Ÿ$àxL>,øW´ê&+ä™OqF
Ùˆ™O‡³âñAmÉ#¼åOðä0õOÁ	^ÞÇZÒiçuºó¬Í“uÙã8s‘hÆº‚(Ð%‹hŠå?ÏAÉþRŽJÐí n,ÊQ‘rJ7~Òðm—ê¬~Thš®+oC*ëäø³Nïü°ÏvÛ{¬*H¿ÍP3ØëŸŸu
ôÅWhÖ›úŽ‘dA<\Dïù Áoî7æÓÀ$©ãHä‘ÅïXÄ„ø©-_ß~5uwàL. ÔrÐÒoøgCÕÔ18[‘ÛâÈkZ}ØNfVkK9a/ã·ùy_«aöŸð›j?Õ™W+0ƒrD™	OfK«¼‘lˆK),;ÎM.Ÿ]iþšãœ!†Ï&»OaNÃ’-Ai™@§£ÌjG.zß¸.G˜>áØž8á‚Ÿ_Q`ÙÈ†ŽÙ:;²f?ˆÜ)=fgG™³¡ô2d¬e?/¡ó>´fRÃÈCÂCVÅZØÏ&°QÈ ¬q¬@9Gl‡ƒ2‰Á|›ÔÞ<á~uaèŸþÀoŽ,g§r†xË¤È‘‚IÐˆHä»Ð*HÛ*Œ,;(½¿ÛSoõƒËXƒm~´s;:[¢{ó(#3—K–ÛTG@i%±J°ËÙêPfù…2ã€»CAemNo* +·ªæ’S™éÏt0ñKÓiÖõ)?Tã¶%°ÒÊ½R-aóÒôßV,“‹™]òµ¸ü™®©i’ŽŒæs´Sf7Óno{eôðZ»UQž{åÚ Óýâ;Í)Çæu¾^‹ã\ôEíV0¹KU4L&ÖÐ³Æä¯à.‹ŽG¤uƒ¡µÕFßµ#º
1íoÑNçV3Æ Oú¡-õšú,ŸÇÞe¹n^¶Àæ´¿z:²É¿1Iq™0%üpQ<?ZÚ•	Ã×$p9M,ª_ë¤BŠütëy­ht¢Q¡lq; Žûü4G´×Y)B©,¡Âª×Ußb8ô?›Î÷ÒÐ½ .?¸«@ö¡_¹D:mB8Ë†"×ERï²b­EPý€àåes–Hü ¤‰E,Ñ+Jš4×Úœ¬¶EërœºÁ^øï¤ÅEqác]A@Þˆh\Ïãy€'Þ}t[yÏO^”Ó“‘ðUµ ýéŠ]üÊœü4¼Ï!×Å
Ýÿò¾~%Î@Y¿pæGápîW0zF2©¢5M¯%?rä\ue
š``Úu®Jà±žô«à®‘¬BëWžÀ,²>+ZÎ6º’òµá‹kDGÕ.SkÝÃÓ8ÚÅ
œ0Ò>.#	"ø¶Pd€2MIÚ85àÖÉV¼„ì!Á>‘9ÆF˜UŒ¿‰¦n>—l“ÆÅÔrñ>L
r‹e>id
\+Äœ'F‹™§ÄáŸB³iÁMåWƒ¤¾¼fÖt5ØbGÇw£¤º¦œ/È»BÆMÐ¹²“ê @…'9ä
0	ýpÊŠN»¥;ÞÐCN€¥²6¼ÍÜålú|f.R„ÓPs†ýpæPBR³!£ ®tª­ 6x\.»i2ŽíH61†_Ø;"ÿG~ó0:ßTEÈªÑ16MþžØ4PmqÃ{«7tn‰óZ¦³Žä*«÷¨š¥=á¥ìIüQyBÉýDé“ªmIæ²}ß´¤PW¤UÌ,W*» JV×ÿ1|¸n Žì”6ÞØkžñ´$<_Å‡5=m¡ý~ª,Z ‘#’‚PMæõÝC4åfV@äaâi3‡ºOïcY*e€šåˆÒK’Ó)Ä˜Ó¨ŠÎ¾™g
*„™o3q-^1ŽRß0í!jæ5G"<Ý¬f„g±ÎhÖÒI@•h¯úæ+µ5dY1—‡M®Ãrr¯@ò¨þü=ÃoRW—ZNNÅßtau¦«—×ö}!RÈž4ìS+·Ç·ž_<÷ªZ™â2~Bú®än";ÁÐwwçþDº$Ó¢ƒ¬#ÓÅ,%è¬,§è•ÇNÌ+r‹‡Hm»eœÝBk:ºß¿ŸÉ‚”+L®óäÝú5Ë`ÈÜ¬wüÞ³Œ—Ê¥™H}¡£y ­2‡tqKìN÷Æ¡7À¼˜›týûVÅXö³˜ûo@ŸÿHÖÿ‘¬ùç”¬Ì&—~(9óÔfuqBÈ
ÅB¸ŸÇ*j€¸ ¶}»,Â´;ÏŒ9h¹¬…¢g€ÎX.EHÎNx®áÍŠJûÆÙyÅž"Aò_/_±Í­<CLËneŸÊ_@
Kø­gd,«¬$ë—-XDM	ˆæ_¢ÓEîö|Çû\àb/|Se:ÏŸ¿«iÜdÂìJ®©óö.‚.YÜaO­ÚÐ\Œ´Î2C·íãz«KLwné¨Ê7ö’Ùñ’Sw
'ÃÝPÀ}Nà,7wÇÌ­·—€ÛCo,A7f¸Ü,)•8	Ÿ-®ut|È×Ü[ Å0}T [ôi±5r:‹BŒ2l6Sg°MH
’±ƒW×÷¹ 1òKL¹1Œ†”Ÿ4Z¹[^yÁ0¼¢”µÁu­yph_„ ñ‚Wüæ¶ê‚b"pÈë²Œ,0}¾%pð¨|ºèÊ;È‰G–}—L‘­V*jÖö+áËƒ‰þšáDË¥5´¯N+IÅHo9µ¿·¨òÙª’çæï_7m¹[3ŒóJÛ¹|JôBRÐÄ ±ufyÓ/ë¼’…ÑCqèÂ®Û‡þän²N2³—ä·™fR‹FõÃ‡µõœôÁ/?¥†jº‘C7ÄËÆyZ7/'kÈ…«BC®vþRGmÁ)×y¥J¯fñXl%æÙLŒÒ+ÙN²ƒH§¢†¢õ§MÔ´ºe˜J9{4"g-÷Ô/Ü}ì±§ò±ö0ÝPˆùfv”SÚIPÁ¦K±Ïk7y'Ë}nÆâ­´Yâg©5™m2úè1WòÑYÖŒwhwyö"o"$…¨|Â.‹96`pþbM‹”Ÿª¸³SêmÓÖß57)øˆ/R ãQ+Á5ìf§_vëìÿé“¹yuØ`PÈúÎ¼ú¾´8ÈÄPéáœJ1•áàYß˜U‹ý#€:_»i²á$ÁhØ¬Ø)ìüQâ@÷CoÒ"ÁI$ép…—@½÷ÎlN†UÂ$dH§%ÀJFwÄý”?¤?>®}.Ù˜tgÂýV¸×ŠQÜWqòN`¸â]n)Z¬ìZŸ•Ü«EŸÂÅZÃ	³XNg´ÍUŽ:õ<.¼=YŽ‚æ8K : ™{¾;¬«¶ó.´Ú¥‹0_DÃ´ Ä¹ñ„ ÏÈ(º*ka£cGí^¿sÆNÏNŽNûìÿûþ_{}rÆÎ:Ç{íã6;íívÛïÛgícvÔ9Þo¶Xõìô¨ÆÞ¶wÏ)É×nçl·ÝëöP3¹wïoãa¨“$Ü#aÐRJÆ€)³;ã:ˆHz„ÞpF}<x ƒæÑœõö×º8‡‘Ãâ€’ÅeÍ©8ØgÃp2Ç”m B8<ÏEÌ|?õ8Wš'sÐÉDìW.ó6ä‚¨ƒebÌ6s&ðŸCÐ¨@Ð‰ËŽ¼lá(a¿†Ñõª
½“˜‘óû8ô).£ó&b42­è¡Ó£iÇ¿÷Îáë} ûÛóC å½ ëÔ¦˜ðo2tbœÕq8¨mn‡Ãd1L÷Á(yŠ1à0äyPË¾bûÎ);ì´ÏŽ»ÇokTïÁƒgÀø åØÃ”¾#Ïg‡s;Áƒõ¹	ÜÒõ¦Nàð$x8÷+‡g¨ÃšÎXìý†=rÆëÄù°…¯œèÊÞyò`µh}"/ñP»z…"×QC÷(öî ô@„ßO°è}èa!<xŠbwŒ3…ŸÏ°ütx(8Òt¶aÌffG)5«]7š¸1L€"—@6Íý8¼›:ÀÊê‘ë°ƒ‰WÛH€ ;CÃ^D6õêûðš^Š®qG€^àÍ.ïšUu¾x¨çôxr¹ô(EiÆ gµ=Àhº½›S+@ñçCü_Ð­tb˜8Ž¼1VÍük,:	Â+`x—.ÞÁÐõ9¯þ–Äj‘;ÂY¨ÕA»±C] o4ÂtOèÃ†,Ñ=j\‚.˜ŒùTÁ*„ÖÁ¬ftŠ,í­Cç2¼…ºÊù›4W m€J1C9vâ€Æ2u(‚Y@¿šÄ¡©—DN.Ôü-hc:¼!Ž0q"ù#ŒÈ*2wÂ3 ±Ä¼1ï#qÊLco¼S0Æ!8¨O3øú8êuwr.SãØzŠÈ8rû%Oè’`ôÿ}¤ü€ê±ô"ë!¡wßœœ«í²…³±ýöY©þí[ z¨Š~@ XpjlIO%Ü
æ ¡tAÜH¼äºéÌ“q‘„Uº§ mìw»ÐøÉaç{{~vþ^ÈÿuÊŒé±—k	èþÒ•²9ÎVNuO:³síÞ;:óD´ÿ<©`u™tl-`×ðÝÈ8T5$¶”Û¬Z†ÑêFö'Ž9ã¨Vùúà‚ß[±9`d<»—“þ NqêÓ·JnÔ*Jµ‡ÀS”öÀZ4bªDãmDê-,ù®{AØ”< =~¥5àö9œùHÁQswÓ‘prÊz=æe(z+q—¡s‰ûð/^Ygí9Èe!
ë0AX4h±+HÞîŸãvÃ³‹r)p’’6·îSxð@$=‚íé¼Ýg§‡í½Î»“Ã} ÀÞ´¡Jïäø-ð#m—dCºÑÞk0ÊzJÿC"?Lx>ÁWqèøôM˜†žaö“þhoÎ§Óë&`mò¢¡:Õž1˜Ž}'¨³h~!kÀ†N÷1üž¸y‚	b%ïÒ…9J²zá±è½-œ¹ Nfø¶}ˆ~‡§8AÁ.M²C•g@ËP5¤n¢B­	úY¥¶c§ ÷÷ö›÷¶±ÓÝ³Nû`ÿäWè÷üý9É©\€Ý«¬˜..AæÃÄ0q¥˜Ñ³2ÀÃ>@%Œ'v8ƒS™je€<0A$–QªböM(èÎ¾8Få‡”¾ÁMHþÀ°¿ÅÞ:‰·°TðDX¬+Ãï`›áâ%§ ¸‚HƒxsÊöOÎAÚa 5Â¾KxÌø!€qè]ÿèƒTkÝ»÷N$8“éeé-l$ìŒCï+‰Ù€9 ÄtêRÄs.ÙËq2õwÖ_^„ÃëšÊH‹)ˆÑÖ93Læ	tDØ¿wò ú}ö®ÓFŒ‡Qòý’ÒŠ€ ß‚F7¡‰kß}µ6‚®#
ükPË~›³·a2²<ïV€#Ú¨€7Ä€³7zÁ¨<^)Õb›Of‰xpåz—cÐ..@}ÁPhÀŠ_âu.^¬ñÈ!pÞ¿mnn>ÛzúÈ!ºô¼¸wƒ=5aCTƒM8ˆQÕm±ùÍó˜ omgaìŸ2|ûr}¼¹ÃçŒÙØÄ´ÖbÞ¶1ò¹áûÃ-×˜óÝÄùÊ‰l?}´ùxSN¤q&IƒÞÜ‚Bk;ºš‚9q:g8ØîÈáˆ9Ç'G ø xÝ~w~LâuVl~¹£SØ"eboÄd³h½h©·º`»­Õ3;\º7Ê®&Sb›ylêé9OUß3á…r½kbCè‡¸R·Éºû˜äM÷ ™5ÎºxÔo÷ØùÑyŠ£}¶N"[î'BX^%©ELºžÊ0u”Mò¢IvÒr†ëŒgnT3[Ï
#õÌ&_Oeéº}Ó|Ïˆ(	³$‚[O¶žØdmÇ`­/×±úNÝÜº3ûuÉDPUb»Ý,XO;½ÎY¿Íö»€i%ðiv~gíxæNàošZáøšEÊ¨h€&6Fa¤þë¿³êyäÐÑ‹`¢hâÊØí5 ó¼p¥„Ôàöý¯”X
Li Ay©Äh­ËLFS*03Ø¼­Y¾½j-¸¨€k*Ò}ØçG “À€-k;…ê PÇg4‚%"¿ž¡^š[BÖù	 þÎ'ØÛ½G|)ºÂÜï¸­±¨ê#X xXþºfYµRCÒæïˆZ%ÿ}ÀM	éß ¢ðUÁ¯0rø—´ˆPe‚æ¹<dPh›ÉŠüÊ,$oÍ„VK‘V‰ÖÃyÄ+’N6y‡þòwkVúê¢^‚°à¨/¥	+ˆ_ ¢6ñpu”¶8#³’êãåÇå_šì™‚çéÙÉ›î!;<?<ï‘˜±¬¦á£·èH‚–ÛƒÌK¨x3Üx>X3Íèƒ,‰%h,kÚ8ê¤R“=°5xAÃ¬Áé†ÑšnÚRã†¨¥Ì÷ž °Öû^»›“æ8˜AÔlÚÔ÷øT×$œº(ÙýnUm(üœÉ|†eÎ…„,y¢&Ê.)Ý¸5îGšù^Àºþt®%³öm ›t’"AÚîžÅÂ`L05†Ù‹¿ý©/½'~g=aà/…dO´‚0¦Lv‰´Ãt8ûEv
mL ƒœû@Œ#n´ ?òÇ	i<}´`¤‹0€]W… ÝÃµÈ¦ShåÐ†Âwaôè	£ÇijôèH£çI´™Ü×h¡8Ç.Ò~ßXM#ú:“­Ò*+Í'¿ƒ>9´£¡îµß¤ÖØRŸÒ?$íð]Cü5ù¹È8ò\¿st®èç©ó@§CMP¬©‘£NÕ`U…ë±PÓwiÂ>që…LÏé¡¦É™Jš Îw®ƒa-q Újå þëÁdûDV&#‰ ~¸_¸‚“×©^Þ0P—¸®×Açm·ZQûWÐF«›BuÄM0f»lèà®üx)ZÉ1#ÞLî¸“8!ƒ ÃF€ H’jëHÄE+ø¯v˜†Àlv’kgÊÍ0<…’Mî§i¤êt¤8Ÿ8\ÿWfWÊí‡cnÓ<·zPÕí¹µuþ„¬¸ü—i¸åÏ²Ì›?M9níA`]ëJÜ¬«Û%4yn™½&ÏYìÂ)Ã¹ÏÚ*o–¹Án¼Ý>žç^zJA·ÚŸ­üOŒ´Ò£ÎQû]ûˆ&•„‹*dSå¦ŒŽ¬SÜ¢3pêtJ{ç„¾]z¤dŒhuaú˜‹$µ=Äcipð:6ÅÛxøÆ<C©ï¶øÐŽß¶OIˆ.Þídtqø½_Š:›Ìu]X•YH£ª¢!B9L¥ý¯ÇOàÈÇ*³Ÿ3.T®OœèZbÛ|g7‡ƒò!‚¸N–öX:«I|§¾<tb£þ8d2ÃL0kn€øPÝÈ¤$´?ÎÒ˜…´ÞuÏ€¶74ÚñÂ›Îæ>'×1 F1n(Âˆ>Ÿ"Ÿ¿p0Ûû„CÐþ%©uº<(ÑMÍ†ß_t|™'&¡sWZEà91,
ÁXý3Îê×ãE¨/Ãã­¢%ßnÛ h<5S{ç} š	7<á÷EáÛû°MÀôRÒLÕ0^}ßs.ƒ¬§UÔ¶jDÒŠñFÃ¿ël2÷(¨,«÷¡ñIÒËîÃ“aˆ3 –ïûy ówMÁ¾O.€û}%\r¢%+BZ‰åh¨„5„ö&Âäö;ì@¸UÍûl0v;^û€÷‰áqì]_œü0zs1ŠödìE8ˆ>à0¬'7„®"¡/¸e$\“Û'° i³+StÊíª¸ôˆúŠÆP£x.€vü£Ó.””ýTaì»ÆÔÓ¶nD®iR°ª»I§Ú˜¸ð€ÎZ…6¸ÎvíS£HB•S§QÀ¤`ÆpnýU§Äúa47’j*p3×ýuß;mV"5ßs÷»í·Ç'½~÷€(óHÄå<æÐâÜCÙ—¹.m§Eç‰ ñ$”·˜Ø¦u ¿œýWgÇ!,wX!1M7<ÜÏ‰gyU¬–ïõQ~ÚtÖï¾±i"ë¤‚pléáüÚk¤{@ÓÏ§oéó1_éóÝ³î®uÛ]x,FàchHg{‚w=»ÁV{˜$ Nƒ=B"òçl×ÃC2;íô(²ë ÍSèâÌ£Ëqƒ)ê·dêÚlWu­›pªÒÌÚ6ÇÂõLëí©z¤áý>1A±§œ€¸p_WvsŽ¼i6\áƒhÞ‚Þ!`PÙAçì}íäÝ} ¸´
"W©!óÍ1`Ÿl±P‹Ÿ”|8jŸvQo9 ”ë±ÿ…ßû'§Ýƒ¾D*ü(«§6TR‚Z„Â2¨Dá¦¶~mUñ©›pöG@ð¤oé½Î¯E$SãIÍ\Ò!ÈžÍqHÛ’•IÑ“;¨|ØA†%e€ƒsâµÍ¡d³Äû¿]@…ípsƒŒ+ÿ³mÙ²_Ú‡Ý}´'žôO’z€-½ó££öÙoÚa‚Úí{ˆl˜DÒê6í¥wÚ9HA´ßîŸÃIÎº;mï¼<òàä¸×íõ;Ç¸v{ V `qÐ9…
ïøÍ~óyÓ4žn°3R¶öÔ¶sŠÑgda9@©,€mÐV‰µ©1öú¿â¨|Ç§'@ÜDç([Y«ïÆãçOž<7Ï¶ÎIÄÑAÎZlkkö-w˜ðŸ‹@3Pƒ*M W‡ÕH‡Y¹ $ªÈ6¶¸â™ÏÚÎ=:Ei¨Ó£íì¬å©Nî´dÁ¬7m³~të1
}š£1¡#?GÞ“dÏàÌb
™æß^°+o˜ŒaL— …_)LÃÇî¦9g–ño¦ Øh>VÀX~N÷”"Ÿðm,×`Î`ráí	ýÑæèñè¹Øbý[ì	Ìƒ[21ýLÌwGÚa×Æhóé–ó‚ÃXgÃY©ƒ¯˜zàø² !¶y"NEÛÇ¿µq­æ3ô_º|	ñÐNœ•‹ªóRØ{|— Ýâ³á˜(²à’×B6r"r¡:EU<É¾ŠçôXÂT‘èÊ}=.r}„¯·6àSà„+rÊnDTíO¢í¼+zÞý–nÙ8ý¬ì„Ë?åÙŽr<ïqÁ{‚ó¯z?œ¸˜…øÙæó­¢m1¤öðÑt¥0Š+JZžWÓ¹¢w¯
CÈä•u1X±ê¾–ymÑ‡EÄ˜¸5ùŽZxÝä¾·<mƒuÈ"z5>Ã 	oê¡Ç¬Ö{Óþ«jåÑÖó
]1¦¿NÂÃðÊö`?¨Ö´Âÿœ‡‰³|qJ3ìc÷ù:i©³Nïäül¯ó©ó_ïÚç°_ïÛç„
œ>£û÷YŠ÷›ÅÁÇHMˆÓ}oªò¤¦T…ÕÙ$°Â€céš}åDAõó™š{	]¶‘ã¢‡·H¨nÖ‘áoÜ`T¥¤ãl°Í5hd†µì‰Ö­êÊ­
/K?«‡g÷Ò‹Ù£*îFMöÞ:üZo@c<SÉCxYÚ¥(s„âÔ
”V§ö¹0¶ÛÈ"?œeazò{€…òÜ„!$œ'ø¤®Ð ¸©”íªY<d›3Xÿˆ	5ÖÈó²ü‚2ùuŽ¥PÍ,›)rù§˜ÇB†Ÿ‹‚ü¬r¸	SÀˆ"ÓµÀÍÏ`3±µ–¯1Û”»Çë4âålÇLÇº›/×g;FL„úðoó!ûüò"Ú¡ÿ4ÿšðÅÆEä:“†3"§KÇ¿r®ã”Ô=Bù$ƒØÆÝ\dŸ­ýiñ©2F`ãyA¤§ˆQ4¦3á
µ°1sn¬[ÊYB‘-¥Tt2Ð¦µ€²lÛ3Z‡¼r§ù¹{kZšjÐùêÊü‡‡áep¨Rc|_3¯`IB±-â¦HÜÔ˜a8Õ_m?©¡ß]«Os©J1¿2Ìc:Ó,ä
Ñ
²ß}B»SNˆY6~€	:žBÉçƒ¹°b§ùgZ7ck$|>}vÛ@Ñ‡‰]4Ò2ËXSA©™(7fÕŸ­˜#Îã†tFbn™´m+>åxz
uËJ™}¾”Ü#¤nÑ)¬VP\ž%J·ñZ`´,'åÅ¥èÜß’!›Ëðú\š*<ÀìÚ—.v¥ý¨b•ÁœxÊtæ—>¨µèâ¯ï„=xBNl '…$ð½¢ÝÁîNPAcï`¥Âèº™Jh¥YEÕ@Dd*ú¦ ­¬E}åÓ†b§ÿþÁÓ+‰K¾æCØœÔí<y“ºóVô‚†áûsOÞí{N{ÚT«ûáà[M[ñºx^Û†BNðxÁ÷X€'À"<
y[á!ÉµcL;ŸÙôO¿3ÙxYTðZžû¦h—ÏD¶^~èÛ¾¿8Y]cö4U"
+¦‰G´<Ø"±ešÖñ¦‰Ü—ghÑ0
ýZ©ªÓÔYàëfŠ¾X3ýŠrœªÚýÝÐpY»r–ÄÚ1ceEE3á‹>ãÅI_v]¼¿s£h´inôõFÞµÖP×¸èŒi-ø	Gä\„áƒÒ\¼\¢”õunâÄ)$c7r+1sF»Ë5»6Ö•âàÅy¡³œ´ž#ß„&ßEÔxôZ&½4yÁãÓöiçìS¯ûwzf’˜Â`$bsmÛ,kdÃpø^}C/´½bòDÕo\ÅôÙXuµLc‚zA:M½`Êmrj¬Ô™ÛˆÃ(Á…Ü‰\	c×x&ê~[G!‡U1Ž3¦{4@ÒÁos†5cxD¦ ,ð(°ã§äŠ·^èKû±á±›Éýa«žf-ƒÍ^Î¸ÎGhMY¦âÁÅM<Z5PöüB#Õ›üîaºÂµ–/é£
è*in"®§ šRÉ÷ -¡ÐTlé9hnì¥é]E–"³“?J"´Êò©AT8K	@ý¶^2–²oS?ˆ[á«
p“¿9,nLehqfÓ
1 Ó*¢ÆÕ5®Âh(Ê¿ªŒ“dÖZ_¿ººj^m7Ãèr½¶~ÖÙkà0mTv´¹ÎpG›ÚK¼ÌV³«$Ðo2j<«€¨}wG1<ÈÑ˜†Î^®ó²zmZ”¶ÿW(Ÿ„÷ÀÍáo“nä¯1Øo²+4Ã-vyx´ÊoœÕGŽ—#þ²5˜êÿÙÓ@CÖØÆ¨K1ÎQ#ù˜Ñ<Â|•S‰)Ý¢m=˜Ò3ŒJÏ½]ã<£òÎõ¿ºhõgÇîÜ­˜'–¶µÓ£Ìk¼e§1Ç›ÍGóT/N£F[Ï·Ÿ–Mm¼¹ÚÄ,‡3ÅCœzþd&«ÀæÃ‘Š&ÇÚ
ð)§²u`=E,ÓÖ¦­æm •9g½Ý,™yi#óHÏRbáÙkN14Ob·²Mf@¿ý‚ÞB\K¾ÿ<7ÂóQùägu öÜüõ>¶Wïb!1Ç`~¸ÜŠ3õÃä’y,F=4ógËeÖAî,˜‰í˜ÖŽ¸-ý°§ùÁXuK†cJá‘ö­¹ƒ8¯6ßæÎ·K†9b
ý;â …ÁI6€ýðŸ•¯7½´á[£»$~ƒâí€Sßò[Ä’aŽ¤Öæ(¿›ü ˆÏs~ž«/T„Ó)Zç'O·žLDt¾$zóÒ¥¤ôr=#>¾\7åWî ×XpœA—­ŠÎPÖV»ü‹ì>¸¶sp~tz~Ø>^*’5TÚès;Ûçc¤	ÆPÖ²àãfžãÌœA&oçúše»Úâ]å¹ÜÚN6UÇË‹›™ Q®.v(¾‹òƒP9]7 —iFz¯L7øõJcñe8¶Q$Ç-	gã…‰z0æœCV–»Ó´Öõ†Ó¼¨XÞØÑ©‚²¼È«Þâ¢…yÿ?{×ÞÜ¶Ä¿
£ñ•RêåØW'–¯rì¤MìÆãÇÜ®Ç¡DJbC‰JŠ­jüÝ»» ˆAJ>»ÎÝ%ÓT‚ÀÅb±ÄcwñÛ ãZ.;RgÙ÷­•4· ýä'¨^[&‚ƒ(ŒqÂ7ç¬ûáØ© 5v=™Pu1€ 4•‡ñÅ¸þý‹1Ý‹“G%=„Õk÷×Å ¸ÛŽ]o^i³	wí¨é±Ç3:oŠC°I½HÑ¬pu~RïãåÈ×Ã÷*¶oT†-ÁWD£Nú>?çðôU×—fd¬Y¥á ªCZqÀ±ª-ë^´[:šÞâÑôvkUÍëé)œÆb5õ¯³—”ÆúÖ­=Ü*[PXQ[à£ŸY².áÕA|á$x7Šâ Š,ëÝêƒh¿J|^ýÑ4'ßBãÑ¼1újŠÑŽˆºÍüL öJšqJ§–0p{ùCÜË‚€e¿ËçÕ Ç:J·fXKÍ\Ñd ÇŠ9—½ŽøÔ“Ö	^oôT/®Ë7ðÿ5çùF"Ç3ÌwÑš-³\y&µBi¾q¸š’÷°ùÅ>~áÉO4Aý]òÔèÙÌ,5v[=a5G|ÈM
Oð"Ü*giBJ³&©K¡òi:dDÁYâ¥´~ëÃ$1ßù1F§â7Ù©{–RÐÄÝ÷¿’i¨¡¢Æ +þõQUwŠìß2û÷í(²È.—p¿hY4-÷H¯­!©,ñ*]GräÏ@¶†ØOTçÉ{¿L5Ñ3ÿM—e¹Cr6i=-eQ
‘Ì×‘^ Hr¬÷Â¯k©Òý$’
ä"A%t–Æ°o	(u°pÉ	jIºf„ãåæø|tÙÂ%l'@Áõ&žÒ ïž½Ž½i•ˆ˜)3Õ3¹Ú³äAŽscŠ§Ã)Ï2ax›«MÑ54ÿ<ás$ÑA° Tý~–Ò!ø(âS0Ú°:Ìæs¡4"ÁB«öÊÈ•®|¤,É¬¹÷Q:›ƒªg¨J5Î‡šf¦Ä»B˜ê¨Íj~-ŽÍ­Uxã\¯xŠ.˜†D\°=vr°ìÈ>Ð(cFTOp™KŒI2óÇÂKÿÁŸüÅpú€ÕÍŸæ¼6Ba"1ÝFY
(à;J™›%{ÒF_>8¦,$2Iyí¥¨ý~ÇˆJXü€ÒãêóŽì¢/|I¯Škx¥k0rB.K4saø\/j×¬²²Å_ZŠä¼KNª¹Å½„(÷¶®¾Å²7iN
_àœÐ©p¬ýý{¨”ƒm&$<YN’—/ÑØ9~#öFé ¨oOØq°—6öñHJ¾¡N¥]a-;x +”sžŸ*¬kJÑ@ãp)¯ë8T‘š~oh(ý¦».ï—>‡<ªOyV×0‰„Ì;™÷’ööÐ4ÂB6‚H¸Ó÷Ñ[Ò‹B6£»‘™jB&þüv³ÓÇ_Ó¦b8Ù°†mÒ·Ö4ºÿkŽn8ƒSÌ êðïÙùçËníq¾mîÍf0]…}±Õ¿µz}gy—Üb$H4\šî•¶I™{T6¾‚gø”îsô¸cÃf¸Æ[ ªçâÞ®¼ß„ÕÑÆ¿v`KË¥;h9ðò&àÖN¾ŸõˆWÄ£ªs©’G Ö$™„ºŒ›%”EÌìÉL¸(ur(´È©ð&sf»¬0ÁYâí¼A¼r oÆ‡óî)»Œ8KâUµ72oß•OWç?º:¹:uNÏŽ?uM“uÎ\À¼]ž}³”ý’Àl¹iNÅbL¡v²_p*-!&P¹52e&{mÍXGìDÔÔè+ñyÁ5ápoDÔÀã,æ<‡¾)Û½´„t7¸–0”™#Ê•¤À”wûÜÛÜ>¯êïPõnÝéž|&ÜÏw?]^9Ç§Ç˜döµ]ç½5{1Ì€oK¦é¯¬	|]3—Há$j}XŒMÁOœþð×€ÄGëê~ôƒ;?Þ¨&ì~:<ÞŒ("’ ÌÞYm“ú³µ¬n¡®6ææ®A’6§Mý×5‚,ÛãU2!;-§Ê¦5Rý'ÜZ1›Ôl­(¶ÒÈRŒ¶™7ìáéÍ)ÖVÞª‡2«é’Œ(Íghk}×0“}à/éZýzäÃ¶êãY.WsíªÑçm!ÆŸ)ÿ0‚3ÃÇ³õÒ(ÒSÆÁó¨\Tíÿ%×þ¿ÆòxN+[köð¯{{M·€3Ž¼¶š¬X8J5’òÓ[Â/aÃy‚Ç´}Ž¡ÞìÍ%Ôe^>¼%Ë‘mÑÙló³f/ƒPJúîÝÜÄØ7Íû%+d‰æŒØ‰¨SÙþGåà—¤tq–•[ÿ„ÚÌŠˆheåkº|¬Ý„ÇŠò¹lHcitÑÌe%ÔÝœöaÍvDé1ÊGdNãàX›>Š¯Û®l¦mcZ¼ãÙZe¦%Ó¤hQÙœº>9‚¥(„¥$påï²Bå[ãp©FŸüõ‘%†ãy¦íCÓ	|ÄBJ¨;^ÌÑªE÷ý`M\iûæÞËý.–ù³Q/ñÓÀI&‡°FtVÕ‡šèr*Uïü 8§PëövX-º›¨•§áñÓŒær‚ ¿ÒB†	ƒ³Z•š‡'DMƒ“É;_gÅâˆæ¥?ÕÕ<$˜[aby3P˜¢zCo˜úÞEñæ‰×KL£ëÍ0êÀÛi:X/èã ïé\?™ƒÏckóÛb6Kñuê½F¤{„œÌB2ˆ“;oplFðƒY’zSØE@ÝJÆ¥þÖ®ß;‡ÙŠí…ý$åúïz×¤9…õÏïÁu1Ñtç]{0ÇÜP¯ø|çíí:#ü:Ok7›µÞ`ÇÎ8º‡_@«¼1&ž›ÆK‡]k…W{‘zÛ÷±“Lý~4_¢`|ÄÊqá[X1cßJ9dë›`Œv	V.u˜<+Ÿ|¥]­x1ˆö¡R`.jÏ`îy°uDïh'“zN!ñO„à~Œô9oœæ+g‰v ž«ÏyÓê·¨¾µ:]Þˆ°y|N°‹TÍúŽ­º”ýêËÝÖJ¼~ÿr\
–öÆ¹TÙ—xè> èïF é½&|ƒTŠD’#Rž|˜*½6|daaƒð§ÞòøÆø‹Îf~Ñ2µ†Þ?ãM÷¼Ý‚½ªùøÔÛÎ~WQ¤¶d?ŠO¢Vc»Y²Þ?L’¯Ÿ§øRËvî £#ø¶ªÔýŠÓ(`1¯a%Åùz£¶&ÜÅÑl
ZÌZÇ‘¡Rø’ú¸±gå\xô™Ít?€@@–í‚ÎªºrbXì#	`¯CƒüÁœ¶Y7õœÊk¢ÍÎLÁÍJG
xÜa<îò²ñ¼žb*:	€0ô¿"hCJP¢‹™]3GÖJ?Á
ùÅt<]pºŸf:y&0u!"±Ã"à¾SnXZ;>=0ƒDhL÷ñ–Üdr±è£ygåÏ–“>%V6¢FB‚NÀ€ÆpàÃ¬§GXˆ{ã)Æm„uŽ´Ã‚0Ù;b"š/ßÙåa ¸{Ï¿V±ÜÒRêßáà„>l^Ã?ªnˆ¥®å‰WÇ_2PàÒÏ]»¬ü'©LA[p—(Ã¹ôæÅï<êÎÆ´À€ÎY°^¾þ„U®JÆ3\†Œo„pcåu(Wk5Ö¥:T%(ˆq?ºX•ÂûÍ©èºyC!.ðFÙøQERPªXÃ-TAnpºŠX»L.üo!b±‹pCB,MXKûXÿ’ÅÂI6™°‘1¢ï˜”rÑq©| ìWîŠËôfN7à{w Ò<Åñiþt{l8“¿&{\	v¡»oø”¾T°øZ=ÿ@–R˜Hé(éŸ‡ƒ?   ÿÿì½ërÛÈ¶0ö*=úæŒ¨D¢Dêb›#i%ÙebÊ{Ÿ/ó¹4	‘0AËÚÚ®:¿R•_©JU*ù‘ªTWÈŸ<Ï~ä²ÖêÐ ºIíÙÆÔX$ôuõº_¸\Ó]o²u¼‚\U\ßI2ž41& 
´ÚÊZW¾šfÅ¹	Ÿb^›ª¡¦É×Ÿ9ùul6÷0w¨5œ…Lì@Œ>Ï|Ÿ„ÇÄäWËBîXÛƒÙñ^—ðîÂ½J§§4ùÜ¶?`‡xPkè®VLßD9°µÁ„ºÕÆnÅ›Ð)ÿÔÎp Žä‹¾ÿl<)ÎÀ±Ï<Në˜·éjÝ4oX—ÑóYþ1ÝØñª‚ÊüØVÉÅA3æÁ9èDAa6 ¢¨/2eÓd?M®¤y7•`-Ï5ïS/–
A›ˆuq{ ‡®6	’ýX»wÐYŸ•C¬ø­ZpÍ—gy9ä®Eãêæ–z)ZSYÄÕîíÕƒÌ·:M@&OëF£7¼³Éë‹e×7Ú³¬¥\ò$É+UÑÕhâi¸ÍµWœò&±½t6óÄ¹—íð&+ìE/Û.-nÂKœ3<¥g'0/ÁPºæ!4«9}?å¢*Â|TŽO!Õp²˜ú4¨uí†|:WÎh½4Ã…M¶ëŠ„<õÉ†-Þ¤¨²™BÆÂÍ•‚T6SÀY|ˆâœ]ÝÁA£Õä'q‰½á'k’³mT.xõ-,JUÂÃƒ¤Ü:îJËl¤×Ð¥§…îîð7É+'µR×Ì[É—Æ,2^¹ñÊ|s$RóŽÔv&!×^ºåuoå’tÖv¡A~Uô³v2÷8	%T'ë¦æª“Ó yzH.‚Pq¥‹„Û£bh
$m]ÉvWö¸ešÛü›9c®$¶`¢‘K½è¬dn9‚Ð˜Š	MQm‡ ½	ƒv*ÈöJmë›}ûšØß2#%ÍcEÌ”ÔâŠ*©eC¦ª×Rs^uLMÍkEž§æñ€z*«}[ËP=ž,0O5Ïkx«*œ· ×õyE½°¨…ØdF$<â¸úgI	»LÅ6ˆ”k(ÕD8h©Íá6šûJYèB¾qæ›«æÌ8à‡ÞÐoŒõÃXÿ3r½…{#ø¦b¯V±sÃHÓÞ\n*#‰Ý|rx×l úµ€ØŸÆó¤L+75a"qžyßYp¬ôÏ!„4ãºà¸8åy#^@R
bšSâFq£ê½¼ÎARçV½$¥÷Win«û3çÝ›ñíZž]s»ŽW_5Ÿ¾8Þˆ?¯äÍ´=Ê³é›<#l\©áÑuüùªxsÍíExr~òtçÚàØU®*Naå,y#v\1•ÅÎ1åó*†|f\ÜZld-¹„¾Ü“TI®Dlz¡!Út+ÉMö¿NjPµUÕXNv¨äz%9`^ÃÊ54n)J>ŒI›õ}ç¥}×«ÌŽÆŸ¼²|çjjß%^Z:„]µ]™,«éQ#Î6W+‚S)^²©¸å	U²ÓªNÅæ×y‰…#‡Mmz0i¨E…™’Ê„°¥ùÁ%ƒH}v%7ÈÐ·†öÖÝÖúˆ+|ñºÿ.ñv¶¹¥Ý™Ãªð*î*[ý=åRAci„×°ÃSîŽù1äž¦ädšæ“G?åá#ÀnQÞ›ó€{svÖŽ±¸<;·±"9pÿÖÌÿ‘=·]+8Ü¦æÌ±0rísx¡ó÷0]3{aN3Å×ŒžìdRŒžÎù“_¶ÿqkùw[Ýö~ê¢\òªæKˆîð7œ¤2[]ù‹ZHHÒð'w½8¢<$˜¤Br&ß*sú~´“ºÚM†²æM°<Op´†1>Þ¤ÇNb8¾„Þ&´/FíúÖ4þÒÉUS<óùa:1Ýl³,»Ä—ÒúÙ5—²gìµ=¶‡uØ+F1µþô[GaÊè§k;ºµíyeì°4@Ê—Íî_f÷gäp/²i›7TŠHã<x&à¡h²<1çŸ._ŠµãgÞ4Ù
xIaèsm:óC]ˆHÎˆá?Pní²±åkC0Š×}ÿüüªÿ—þ‹óþÉùÓ«Óóþ`ðt@!í­¡j“Mª¯$ /a¤K.ß¼ú`ØvJÅ$ôW)vÏä:¼Ž£È›7z/à"îù«ìoê‹£PÞ³F¯4 1œ|#¯]‹j£ù°ä°-_ƒ7	ˆ1¼¯ˆìòq†ì{s`¯$z¯ŸØºw•ÅE1wãO"øj6*…auwt²AýÕ£þ9â¼Ã&Ùƒ;³u ßí‘0ß£ºþô{³Í6;òòU
ŽKÑ¹ lÌµ-^±£*×Ž“³¡	.kØßýïÔÍo˜ÑáÅ¦˜¶;CÀ°ºW%-èÜ‚õi>¼P°g4Ì“õb£¾Àü·9f0«Öé_Ÿp‚Áxk9ÔðšÎ•7«yŽ‡â¢ÉžXK^MxeŽàI¥UÃ$sæ˜?Yù ;ü§`ƒsìïX£¹hÓ‡@*ú·›¾ÒOŸÒ^¢u¤ÔQ½ˆfn‰mÍâÒ‡¿¿r@G¼X¸|ŠâF-
têß8†×/+ßÑ‚s+öS±òw…¸ó”ÿ ;ò‘´7ŠŽ>¼•qêÅOë;ŠyÁGÚâ»-Ì0‹`suÙ(äKÊ±ÖS[–£ˆöŸQh8ÆGÇ®å VÅÇŠi¾K:b‹éÂƒ™b‹¼Lì±è®KP:OÑB…&Ï™§ÌöãùEÊÝŸhÂò3ïêÉ|-àáU0R¥·4˜4Ë
Ž!IØbŠ'f. ƒBp& ä ”ýŠÙ$h£tb¡þ<Vs/òz
P9,tæM„Àªj+™³By²äf9CÉv–Ì£ a˜‰å,Ôdˆ9rþ4ÄcÿÕ‹/ãk`úP¦šj%·.'ñìzŽ.'L0²QJ×rO[“¶¢æ¾pK®X¡ÔëW¦ÁKŸ~dW™O¯†)HðÒ§!9Ød#žNe§ÝQæ$Á+lžçÀn‡‘ç_Ðÿ˜šji ¸ŒgyÖ’=@œtüs©FÊ i–2DKéOTyNvrYQü­}ÎzþÖA‚¯³\#tž æÞ¯J0¢JR¥{Cv†«è¶nË7Ò(ÕwB­´«ªkÞCâKQö—(]Iì#QÓÏ¸·—ÆuIQrP³Ç&ðÿãºbD}üˆôQ›µ%×®™4i¦²¥''»eU&’~U—,wKÊã’´¯Xµ&ªEé>9¶KpÜìRXXéGsMæ€ã#ñ£>gG˜t0Á/)w$IÊ¥Òñúæ‹WË›O¬‰²ZQÚSód™=§‡dfœxBŒëL1å¦Å¢”} ‚zmÝS’¤Â™ÅHg}±±.°caL¹îÂ¯×ñ±à¡y[IBËÓZVKA(5ù9±®0Y‡X@jª“œc EjÉ€¥fÒÕ Qgï©1t¼d_»l6ê
{5³,ÍLˆ<6™3úhhHà‚6rŠ%L5Œ€+Š€+ú¿ÏOåÒÖµHü–?&ÿÄ~Ç’"ao{Û™Ûw¼‹öÐ›mp¶¿¿Ï}Úžüûˆ§Hj¿÷Ç¿³žp¯í¹‘ÝBbÅŒÙ*h-`7ÿþw\fsE&+×þ9rä¹€ÁÚ^+Z.Viïtu¼–êÒóoš)È'Í,èý-¶¬>z«|¡0Dˆc¯¼‘åòjkæv*¼‚Ô×­3–¥I3ðÆÂ³×€U§è7÷ðG;Øœ{}c]l¡ñÓv-‡V¼ØOU4¹ÔxÔ‰·&†ŒÇ:þòîNI?Q³m3açÍŒsæd…»ÎAï‰$¶½˜a"Ò¢ÔVu‘t*{X¡o£-Nƒ…œ’R¬'¨0+¬ÁŠ¸Ýtv)öü©¡–¦ØÕÌ×£x…Áð(íûÓbmXn$p$ÕpjnèÁ«,&Nø²÷h}@Þ¡KÀ0"Rà&öepÍTi	ŠDæ£¹¡/Ì&êÑškýí®y2‰|Q¶¹¥‹ùµ«L™‹ÂÈÇJ2¶>á)t3ˆo–D·^‰W;•²à'¥çDÔDl4JÉ´¤icïÉÊ®•Ü¬d$>v7åã½¹g`ÁX;¾$Î<‘ËšÊaéøš[B7>ÕsOò…èõ¹€ö+œ/ÜŒ&¨•Æ©ËìÌøoí2âðHõyP&@pä_ºŒtš}ób¦Û|°“ÃÉí½ÕwÓÇ—â” Ùa¦P8L‚Í® ^ùªÔÑ&(í%Éh³À!+ãŠNX§()•@µc,<ÕÐþŽ
mwòwE§ûeæ#Åã»FR râ¤R*õ³ˆÃÂbðyéùìF;ö€KkÔ¢®«’‘£¶‡2‘w•~„(­vA•bIR+ñÃÿh¿¨ÃeP¬V3Í*Êš‰¤*ßpQ +Në–ü/'ô¯êp!œ'9ÎýÄÄT‹Ñ¼8÷5Là4ý_…=F;›F²(ŸPZyv&ùªAYd­'[:¥¬7Ó—ÚW€m'§$l¿N\ƒ Œ¥¡ï~‚'i÷…‰ëÝü†7’ü2…ï™ìW®­PÙc9Á¼@kpøó|îbÒiG“=c¥(òß2	LÙ\¤¼äœ-ÍÐ,S2à¦ƒá</ 5KkªRŒÕ×Rçx¡Ž˜!¡¢ˆòúÎNû”˜ÚÄIìd'Qèá—Ç:’’ÛÍtÿWÇÀìuÙÍ¤!t„ –…]µ ™Q$íeQéÄPzÚSî_®ÒAÈœKÞ®áÓÐÝÜrÏ±ÜPy-iùNâ©õ£L³Geÿˆº§k´›Un¯Užºjº¡¥UDùÜ¢yŽdûÚûÈH_\vÑ°
e†Öý¢è×p¯òløQ©»Fü¤ÑãÊ8Âùd>‘öþG£»ó®^¢’ÙŠ<?ÎHç’p”÷lDSi©«ÒzUøRh·yaÇÂ"ä´©²ëEQ³ª-P“zù³œ#	•NÉÑpi]þæûçÌ·žì7u˜+ó{™Fø±©pœP Äÿ²4—Uy| žŒç(0?¨5$ªç×ÉLûîÀŸ[¦¢¸Šr‘dD˜Nüî®Ö¥#ï¨QŽ¿H–ní¸„N“Tï`b37ÛË&K|hF­°dÞQynhÿ2ãÿ"ªJs´ÆMe¦A¨îÑZbQc™EÍìíd‚IX@AI+1|åXè”7×(7ÌÖ¡ãhÙôÜˆ,8àV×¿lxzô<)°O‰eð‰skr5ÁS¸Å*©©46"&Ô :Lœ­åËp?ÿ-¿‰ˆMQI`SmxQ3–:ë(q'u>+j÷%.Ú02~:7ÏhÁÉ¼™ú ÜÞÞ&>([soèyS‡;£`ñÙÑö÷Æúé'+FÈÛQçÄuÅ2yº‹ã¥iz 
?Î]<-Ø®£5k8´];ðf6ifÉ´~„nŸênÝpL~dö|ÜùjYA€¶~dã»À‡€âd¾3Œâ ™®-ññGvk_o;:ÐxžÁ<Tñ³öšscfQ­¶ 61‚æ"ä¢‚³J.ê»yèìš«fú¬y«òZ‚zÆÇÀ¥:2—›—æFðZ„#Ák9®¯¼x?‰Õ’8çœI«6T6X$Ü‹–éêmk¥X¢U{Ý˜p ¤5aÂÒ\Ð%pA'Àª+L¸“zæzÅŠ
•†BñëFE‰å,Ç•ðUSH®(wœ•6Îkµ‹óØŠ§Ó è(  T®ôãÀ,ö;Ÿy?q@’ª×U.Î«4ŠãPØ«Ù†wÈ³R E­g‹
$Sµá-^ YTþmÿNÄß¢©”ˆ((ª'Žp„H§-’Â²¶Drå@iœ]§¨‘œtwŸ”þ*|p–êBU’«=©ùÜÍêRwM–Ýß]ná+f³§Mmèây#ýÑ"}ÜB¶'¾ÝI¬C‚ àM]‹(ä§Šø¿uGd*Äâì:ØyÌ×yOK

1Ñ*¹dáPH6i¤Ô~1R
µŠÉü«œòÓ×S¯R]Øf?¼ÛsÌx¢¡çö-¬h¬¢@ÄÚÓÅãê¶Ôu½ñZm`jXæ‘[8 Î™“ÉP6ºgápy`˜”»¾'ûË%žóP'ÇŸVÍ|+˜ºv¨rÎÉ5AË_ì tØ‰Yl‹]ÚAÂ—`
Ò›57¡ïôÓ¤SÚŠIñãtP®ÈÍç›ß’Î#*¶iëÎ^?[®·ÉÞØ)E¹‘3ýÐH°}\²§Á.¡(¶…}ñeÇ¸‚O]øÔ%ö3/¡.,¯	Þ®²]nO:ÆñØÀ›&+‡:}ãŸì%}WB²ù”=©-±+2fÚWV€é;±Ä7`Ù÷ða
<¶àüÎ-èbF¼èØ‰,žQþÚæUÄÓ°*€™(¦râð–sˆ¡ð>j\ë=ÕG§$g®}íLØÐö­h	fÖtnm²üX>ö}M‘åSè‰Í(l~fÏïâ0žcrseF[lkYö¬qÆ‹g`»=öƒŒžÙŠÛj—ˆÚ°$EÒ¡"Ü1âùŽ¢Î£9ãµHà3^àh¼
x:xÞÌálmü3^ªxãâ@OPìoÝÀž½#Í€@	¿í\=ö?^íÃsŒ¯[;›ô_{goãŽÊòˆT¦LÃœ+ü$µÂ²F°¯²#|ªÐ·‹šŠÝnÊtwŠ*X#xã¸dæÄUÛ•Ì™
·Ñýo§«›ÕíVç -:‡ùtJx§P)d`ãpj»DGD8óy!®!—ý££žnT’ám+…ªÜÌv²-\ò³¯Ô)Õ­¨"º›ËŒsÞ«…^;¾@|Éú!æÆ€¿/ª­nUIA$*xõ}×™Z€ÜjŒœ„2 žGêÂ,1:?p®1ƒ46PÓ ñþÌšX3‡Z¾å]—¨IëôbƒM`Lc+£ýË‹Môlˆ]Ö‡Ç8]¹xóëeŸ
¨Æ&&™b›É8`‹â±2k4ƒ1ò’17	%›S^ë÷V<¤³Ys5ñá;«ÑðÕ!¼¼±Ç@õþÄ û¬˜ØÈ[¹£?=g·“¯	UH¾vÂ Ó„6LÛbå©/’<¼´C;Œ	³&Hç³PˆgŠd†;Œ¼	øä0‹ãk.4Œœ	Îr}x˜U´IÅr­´àÕé@ÄæTŠ œiì’ô A/Múp8Þ›O/ûlgï`ûçí—o°¸Ä>Èoü·6DA<E3Œ a×#RvkÁxß·BNcBÇò‘ZŒ¬™%l8ù Š°bG-^Ù‘7²Iâµ1Aœ>šê+"»ßÈÆŠÉ†Ð ÿ¹¨†4)¸+¾%4C|ýì$#¤Å8	,gþEÒŠžù,”bÀ‹ÊÌÇ W @ƒ &´./R>øÿÍT¦è¿à¼>¾1ŽçeÑ:$Ô=ùHxRjpiMCoîÁó'®çÍà¼~pBBäv ?°ØK€æÉ­7qS*±IB
 6DÁùàDI:\HB	<â€ä0b$SoŒxö&yÎ‡Yq=š…j7Ò]’liº¡¥ìÄ* 'ÙRm%Áº—ÎÌFm¸Z!¶ á@ämÙi?ÑâwUI2¾Zª²·ÙØš Ï‚×•IÊnJRf£ž+#-]$+û%Ú²´…”‚*
Ó€TètñÝÒùÛ•tñ{J]|â#;Üdšø"F8§c4a¯ˆ{e“®°BW=$#£KR÷	F’.ÁµXÕîe!ˆü{Ï¿Î\@Ûâ³„¤?nùqÖÉSBcžÝÉùI'$Î_üÐ¡äc‘%÷3¥f{7¥\ÒÝ|~¾kîUh"qÔKnñj xÇzdœÈ .´9Ñ[Ú—¾@[3¬rš8Eh´Îƒ*íá¾¤=,†Ö§”Möóá>à4aêBhê‘¶ã
ä€¦³ÝÍ~E§‹^ñWâ„ëLFûëó±:U×0LœßYÀ	ô;lÃñ/[{€˜ÑŒzÉí}¸»Ëï¢]BŽIs eIU¼H§f©á¢÷Ÿlvvw6»{€î:Ðµ@†‚BŒ¨*[dÞ¡ý1wúë®Ÿ ÿY“XTáA™Í,"SËß2yµãÓxŠù¦q¡ž9ƒ‚©½ýTµ9">GdùB&qËµÙK|ƒtš¼œ!jLñEÔ…‚0J²²7ák…þTˆÆ ÊÖ';|(gè´%hÁ~Ñ†üÕ ®­&¸«ûã®'€»vº€»:_2îr¬ %œW ÐA^¸¼xhÔEIV#ov!ï-çš­=G¯_’;½À¹kmÉÜÄqa*òZøŠEöu	dEƒGUZ"Â]Æïã®±ŽãÁ÷„G¤- •ßðÖCã­T±"«Y¾&¼Õmí~Åh«sðxóñ> ­G_0Úº´QÑç÷kt‹áå¨³ypÌe¡Ø{Þ#jƒ¯Oõz¼	VŒ×Œëó§ˆëÖ‰Q™ý
xV(ß"DTyŒ,Û ;)"ÖM©Ï	°i‰+ú;}C_¾2cbÎ¶ø5!°FŒ×ÞWÁ6;€Á:Ý'_083Ä&ÜËäî]òÐl`E1ÇI®5vxRû1"’ˆŠ‚Ü^° bç;.7¾Ç»vB+'1Žaã	»<863v	(pŽ¼Mh° k¡r€Þ­…ÍäH‹#ghGÖôA‘—QÎ¥"„yôÔ‚ôK¸D‹ÌÃ[r|ÎÞ#“ç—Yd&Ñdï7×dW»©vÉMõ±pS]Ðc¾²dLf~mïmyg§€*Æ§E¨Bƒv÷6;Om>ÙCú màVA2¶¡î¡ýþ!â‚ÃÛ¯· –L§¦Ón]ºåG˜NÕQ{¸¿’iŸ×pËöF&Æ„ÂøOäH¹ÄÃ·¾Æ†iBšæÊÝ²¹¢ÖµE €3eÍ²Æ®Ê:±_27`ºŽfŸÂÈ
"Ú¦]XÇrÞ6LËp»…Q9ä$ÌŒeÉNÐÎUGœ+w€ö7Þ%pÅ¶oQÙ“0~âéOaÂq?u¸L*G¨œ{.Ð×ù*áÂ™C÷ß±èÖ3Ú‡¼:së8H\’à$Mâk¤ŸßÏ=¦â 8h Œì™3ýz×á×8Â*Ÿ!ÒÌˆÔ5Âj“$Éß‰ˆ¯w¢}ÜïÆZœ“¶*aëQ°í	_ š-@9Z9g°ã€f„±~äKyÍnÇš¢ª•üÏªÉ«‡\]E_»{O6;ýÍn÷³X1ÀR
+mO‰Ä¦+ƒ}1¿ñ>7}=µ"r6ü;3ty©óýsÚlêpNî(åH-Ç*Ti,Š'ä’äÍí)H`j;J´C3À8„}@Ès>a]Á¤y )ºíÎ T&èÏëŒbßažkOR¬þÅ´| ‡Çx8CÉÑ
²öH8´C{ŠáŠXöíÀ1ÄµŒ½^gŠþÃ#
A„Ÿ#æ“¼û>¦Í¯vyÑÝ¸µy<F“;ÌD6–¼9ôíÐ¹q¦ìULGõÜƒÅbg– X E¨ˆe-¾!ÿá¿Ðâw«Z+‘:ø"B.D
ò·ŒÚ8^hA¤U@…“ºä+>óã ƒMçÀŸí5²¶ó÷B›Ë—îE ÆÄYÍ@®Ðåñ?×V-sWKðË·k•§TØÚc˜çMS3cyO¼?ÆïQsõE!¬¿A]Ûº<|†	&LüÏ¹SxÊ2i3]}DÆÅGrWÈ'UJ¦Wò)W&.î…$~ÓìçÄ½ï ÊÙÝÜC¬ÓÝx§*žÞy0çõÄŸ¯²àRÁLTµÉ”x#a	Õem:ùØÅº6ÚaST˜QDø~ƒÂ+ÂŸ nfiX;)o“*ñÕh—R¼¡”	2ÆtÙÞn¡ßüA>¸l‹h×qÄ»;ÕµŸª³TV%÷¾"áEª_;~þ¦ùbÀþñÿÉ.­¹o±Çò‡>¨ }£š§6ê?ÿKÑR4÷w~æy¸‘ÛìÌ›[Jt«Î4YõÑÿK³è*X
rM%)†‚&	ÒÌQYù&Óoxv,7=C­¡]ûÊŠ®8°n^}°‚ÖÖVt›3LGnÀù—j›uDm39OFÑ“Õ0Ï_±_L”«ZnPý¬a¾”Ë°£uÒ–43Xór¹‡§ÞÍm+‘òYX3à'’”+æFYââ‘BÄ¾ï£u9±Ù™ýÁv=ßª¨ÕiœÉË58ºµ#-xq¬gñufÀŒs.ÃÓ“øðsGoF3‚|º¶Yf¨®¤¿Bpõ(UÇR%é9³›"€·Ço{&eEu5Eg£|MÑÔÍ¼ÀŠˆÊjÞÀTª.E³0v»9PÒšµãüÿ›I¡õÔfSNyí€´Ë £qöÒó‘ˆIMKiþy¤ÛÿúÊ¹‰¬Iˆa8Ož¤"¨aAëoÐ³èÙªŸÿïÿú_ÿï„Ÿ7öÔžæyn5 ÇÝÝN·ódïàqçøüaà£Á3ÿçÿüÿþ?ÿË‚Ê€Ô-?°—¨J­Ycp‘ÐÍÁ“ýÏ,ÇÅ4Ú« ªŸÚ–7^$ì{•{öÃÐóï~d÷sûÓ¡Ù­öØŽ0ÿôµËÜøÄøLÙ §Úf} 2„Àý…vðÁérz™f•-Ü2Ì,›ÉùiôRnYÅzf—mV÷WŸ‹V“}ö[*YÃêSÉVtùT²YÊÕ-Ò!Õ[œêÓÇvþðô±¥ìig 4iJšÉò×ûRiòŠ6u¤25¢f¼%]ZRRR›º5WAÉ“[Ð)gq¯jN­%±„Š„$­M™)¯¥ñHK¦^ÛÓú~Öfë?|h¿Q¾ƒ*.IõÜÌ´ù‚+D1•œ\ôAÍÕ@P“üÂÀ‡œÛ¨ãó1H/ÂÌ0“º„6À3Ú<áeNF+Ú ˜ñ$ãË§¿ä™ÒÔ˜ºUª‡ÀÔôZ¡v©`D\rG•œë§y¦"5¨×_;†×,iå©ÁŠ9úªT²u¼ºv¶Vý`é8'Y~wåâ:úÆÆaÓÃÁ¶K_Òpe/ŽHGE4·À@'ˆ©ºÞ€ïÂîL`íìàhíÓ›ôØI<rÐ¬y¡·Éí‹Q»º•Œèè>†³'€ý®ècâ8ùê’Þüýbì´|po¥†Z~`Àû­ûv»_6YÖvÙm^h¢Mƒø´QaYÑ €ŽöáóÅ<ŒpïØ6ªê=×š|Óü¥ÓÁ{m1Ø¦ƒ1‹˜F¦9˜WcÏÃÀj¡ƒìç€Xe­ùf™I(>æññä—ræ`úâòt>­~~ôX²p¿Q¼VsU0ÕKÃu§±:…3ÏÙÜ­«ÃÕ??¿êÿ¥ÿâ¼rþôêô¼?<´g–ßjÝ×>­l¯¡ðÆœp`»ö0±íˆåÑr:ã¹=:ÅÑ’°
m·Qu•Y¼¬þVr£gñšÚwG÷|$*5®r‡WÙ>¯9Â,£7ò¢õÄŠ±Ê£[¼2è¸ÿ—-cÖTT£û¾ä+†F¯áõ[O$ëBx›¬¾;ÈÔ}³4Ü-ùe»»³Þ¸ßõË{*x¤&5‰å•ywŸÂÕb%WIuR*ešDb	á ú¦å¦óýÜÿ.Wôþþ^:ÿ°…–Am7¯[‡u0ï¯gX—Œ†~Ÿ^48³êd›TTÄëAkd©:Ÿ‡?Uù­¦ÓôÄòÜ%Eà±|µtŒº5à,ñ2æ.ñúò9L¼”\&æpÅD®õï+Å !EoQa]J†¤q—x-‘ò à=³Ã½¾AnÕ¥„Üçè†ê‚PùÜž[þbàŠxÐMZÿƒÀöó	úºbakä¢þÒ¾ƒ=ÂRìW?„Ý·\¨ó1,VJ¦®E2î½vÜ:s|;p))9®GXƒin1C+Øÿ€íBèY¡¦Á‡±ÞÂøsiú/þfî d›ë`l pö}7øïgëë«W/È}¬B·€—B¼D½v|r5)š8æQ˜OàÐâud×’âÎ–FñÈñÚcÏ»¼®³åûð¿âßZ±`lR6­ÿªü÷S/d ·~íø9õ€±êk˜ês4ö_SyNpg	?ªæúLŠ¸Ôza¯&÷9éúºB	…7óŒÞÉð1ýž—z×¹Ê¦³^ºõuà°ëõ€1-wy5¶Û=ƒ={±µî£cÎòÕ†·¾|kÒ„WÕd²\Ww°^+h/Yì4Å÷ã
Òœ¤º+rßã%
÷ÖÝÌ”ßÉ‹Û©Ú­X0¹ µ<|D¥Ë¼^C`«ù¾ŒÌÁ¸·
ž N’lv0­ðn>d¦Ç“«ä8vj·*Šä¨5„@º#µÉ4Ö™¦ÐWè£tÐ
0Ï’½åÏ`qN>[²ŸôlºHî/;±áWtÖ 	8š6!‰þ‡Úl5k_z=-ô¹‚¿Ï¼ Ü4WÛúGi£ƒ„WÕzð_aÓr½ÕÏþ³]Ôn5Õ²ˆ™z7_NöÃ4Ñ¶þ}¦ëw†OâÅquðzŽ°ˆ°Û4€ŸxÏœµÝhGÞ¹wk§2ð-pf-ƒ	Ë³ú.íhC˜Ìßç#ÅayÃ7öuä[£ëM¶Žwñ˜eÍ7n×»°î\ÏB›J3üœx.Æå£mÄ§6›iö‹l]êmÖtù“Ž|ÃvrL¦_7k4ãS•Ø¹Yc0§c`?Àú¡“i{îÝ¶6Ìmæ dÝZNJ ¤­X7ó Ö<	ýzý St‚v‚î²ˆ­ùÝqkðÇc™´nŠb
óCIpv:ŠMF&¶¤õMü’?g&bEr50ÅI'zDþbG|$8ÒÍ&‡µê”4;œMÀHˆ{-iÖ©ŠŽâMþ2øõu;$<ïÜÜåú1ìèZÑpÂZ ¹7ÜÏµÛðš´ÖŸ¤Ø#R'†[„%ÞÕøÃÐõâ¢öÀtêÅ€ç¢ºÇ<gµW+Ê™K^äÝÝIe¯ê¢’Ø%çÍÌ°È¼»“ÉdtóQª8ÉTìäcyQkVë³É#"W#Í½ôæ7N€I$ØÖÌÿ‘½²ÂxÊÞÄè*BºPe$¹V©®%nªBcUÄ?q/p,w}ã“Bó9‹¶öL—· QØy]³Y:¾~çèhÒ&N‚åƒež]c”©Í.Åø5¦]Nµ'·:|:÷lV‘s8©Œ•ÈDd…~ÈeùN?À˜ìDUùÊY®ˆ}N¼[.&ðŸ€¿Î¼]ªƒ"þ¶õÛ“wõ[I‡ÏN±¢ gä]ÆÃYê$ïÀ¬€=Â¿i€S1lX3.;\<€s.å³Q9 $·Œº¬»ÒÿæQŠ­'Eç^úkø³ma+uáî>œÝŠÔræ
ˆ‡]L5-oBé(†¾­àÁLC $/4`ä£JQ6¼=ÄÜ!ä™2ývWç]ì¡ìH‘¥¨DJDÈMnlEq )ó¹QJ—ˆ«ÂL8›PÞLÏµÒå¢ÜšŠ	¨oêTvet<ÈìÖ¾Â6’ÛXôu,ÔãìÉ•5šXV“CÅÌÿMEÌÊ[¯Fº	(àžx£;ƒ3xÀ²Di’Ã•ªÎ$!R’šPº(Ù‰5«
ú•\•àdéÝß ‚4Ÿ^o9^v\©ÚP‘pîÞ&‡.TeN}Ë’ÑJÑP/ó“ËZÉB[Ó#ñ¸ì¦ô½ºo4³Ÿ”N™‡T'ú”òshsIÈÉë³ìôrJ¬³SUvVÎ!(õ"y	t¡ÈC¥Cjú9½†jºÊë§t/Efý)ò§“‹\&¿î°økÙ7VìFJã¯Þõ¸”×óR÷åç¥áa¶Ú!óí}°¨ÏL1Ó\r_ÊRFû¶ÎVìá—Àó ‘_Ï´'•‚(‹óš×hcæeQã)ö+|%ŠÝSû[k‚ñmÍj7¤8
¤÷XØgÈ³ø¼²ÃÐRb½{‹Óñ@Ž•L;Q`F/¦1ç^R_fCÁC*]†sCl£^ãán®ü˜eê–²sc ›*Ùz—<LtF¢~ÒU O;Â/ånð®¶lƒ§ÇI[á_Ëíðû]•»°Æ–.Ü&}|ª8Å"¢ÔLkìD^BkMâKNÚ£{äXäjc
Š¼—ìÔ>z!Ny26JÚ</ÈIè™c€Ö² iL jø•¾VÉaPùYÅ¾oCtLN0o‘&ÝS…(f®ñŠÒ¿Q3÷ä:¥Ü ò˜’ÎK˜œá•Øc™3•Ze$Ü8,Òâ«ŸS¹õ³—Zy‡!»PÎê•·†Âí0u˜ÚP«€þ_.ú"ia­Ø®‰¿'sbeß0á½—ŠÍ\{âÍ½‚L5õQªˆz©V©’[>ZßåáE³[ªHžž`—2`á |
•ínÑ«°¤\Bæ^5ÒñENä*{€)ŠçwTÚü%z|œ_Z3ßq“;ªixœRó‡Oïì_on4ˆúÂ4¿ª™…FxQ)ÿÖé`@FAugÂÅá‘Âã5r8/à0Ärê.%ÝVc·1ã™0ÏnoƒW2tFÖ”' aEzg†ª<ÎT1ß™ÀS;rÆŠrð
IÏ=ýˆù¥a<çÀÕà}?B§îrŸ–bù*Þ/x*žþ…žê{&9*ž5ÍH™0Kšƒü‘JDÁcWôb,C‰r¾L]àÓsöÿ%Ø/yi>O½4‹ž’ìÿÓÿ® 
Ë(D>á:<ªjH
¨Ø­Hs™i%oËÊð„åµçªãÓL°SòæÕÈÜÐEsEÞ!š½^ùdm0£Ây³¾ç„O½':¯9 ï£ãÀ3|Kàj¸ÅÃ6“b˜¹0<â²p[ï1ZŸ¹9ñÇJ!2ìK¶­’!g IrwÈÂµ~‰ç}8ê*L¡aÈ/+Ìg‘‰ÓÏ¸jJN´Š©4%Z ]\+ª_}sVðý,¸Œ>Zv?Ìã‰)¬VDÝtåÔ‡]8y©QÐµÄ™WºB¡…xKo(oäû–´¶:‘Ìj!D‘(J¸Äï‰:nÆâŒˆ_Á4›7X, IT»è­í~fd:õB
'”ªÀ¤±V!TÅ]%’Íò}	ÅxÙ@²wTžéªððšh÷ØWÍ Ytl?•7õj 5¶¨ÏX•8PÖ¡ ÃôË{ƒ¬§=Új£ô/~ö@3£ôÁn”®·JW¥÷>òO4§˜¼«6Q×ÚuÑ¢•¨ 25%Ï—Wo6VùTt¦5"žxÞôW2ª½"¡7Ù:TÖÚò¹¢Á=ÁõDÖ|„¼P<©s8VÓ8p¦±‹´“ÝcUn±Ë)1O-AZèô0KÊlg:²BLöÚk³Î.¯ëJqÑ(,rÀÖ¹ÎèõŸƒ<\'ÜGÑ¸ž¢œtßª-°°Üÿ¦]çt–TÙÊøl«+Í;J•g"é+"»^Q^˜¡¶äÃad]z|9ä=åÉd5ÄÚ˜ØÖHkÁOµÌ™Z5Ù„ÎÎŽöTUæ¸9Œ‚cèVÅNîJ°(ú×Ž_ab;)}A4Ñ¿/g:ÌZ4‹¿Ú]üÕÝÅ_Ý[üÕ}ãW“7øÛ°;Z`Ù&h© ¦kô0zÈw€R CŒ äþ×ë÷ö0jÃðÇ[¿\\.û¯ÏúoÎ<ÒoaLÏlòÎìðÝ&sF	«Ô¤&ðãy†D2®¹‡6Ø¿°.Ù¤v„5ŠÈÖº0îÜ±þ	ÖvTÂr:çAK›”vK:Ò7¥Þá{1çßÒ ±w+i§»¢vvWÔÎÞŠÚÙoÒNùõƒôõª³WEœ5¼ŠGCçpJˆÜ4ßfù¦9“yJådEP2˜é¯y]Ø—È^.Å_î/Ç_> ƒ™øeõæT2Œ1«™lä™u>»ù2©MÜµ‰³,9æŒæ ËN¶§.¼QÙ%7+wg‡±E†¢¬fòöàøEÔÔsž5¬g²P_ß©±*pž’œ¢òÔãÍ¼²02*™õ):Ùµ¤CñØSJé~tŸÿþIûž7Ç ªd¹1Xc›Ìþ¬üÓ¬Ù||*·×ºgÒ“˜¬«¦ý7hÐN:!Á³ôýùè¬i¯=VÕFUò09€m€mÝ—ni_FmPù}Õ]}Ã‰ç¹xÔO6ñíüª¾¥wK÷”¯—íÞÊ
º$ö†Ñ¦”‰“­Øº¢Á¦–J=nD¥öŠ‰Üu!Ù*S©ZýCiJñ?M±¨:ßí³‰Ô™Q-] xÛ·×Öd;±9D”Õš£{‰6å‰t—%¸~ý“Ö\ãÝ£O„R—;Ì(ßR‰Ñ–óÞqrB%r‡‰GÜEÑÂÈGköî€¼–h[ÿÂ½n4+ûS›»+ÿýïLù„À7ª8 
#àÊ *æN-Uà*S¸ýQ›€©Â%·Í¼¦› _µ[áöo»ÄwI>éöØ¡ÂÎÛìù­¦;Æ}×ÄŽìph¼eøpàøä7Àód©3ÚÑ°ØÏÈ¾±î¬MLëïÀGþtâ`¥S¾öO²{µ‚¹ûõ€vìF‡,¤ÔÉ>÷j¼Qô4mQjyßY_ùQ©…)xT¸äZ6”µãWTŒ¼Ååµ%’éms˜9<lnó×›÷â£„FÝ\ ¿Ó6ã½½ŠGVÒe€Kô’Uu_;þ>ßÙ¬ÕmÒÀoK¿ÍÞ¾‡¿Kô”-ø‰Ä¬•"€—“8Þ`›Q(ûÌ¶–Y¸´žòÚñÛùºÂ`3,t ½Æù°`fÀzŒqfo,¬?ºDÜºûÙyoAý[d(’X”XÀí»8õr¸ÍMc ÿ¡\*í@­0ÐE"ò«‚Ë«Ò†jdãº@}îä0·o¹ ÈŽ
’bûÆqø[66fcŽôïŽŽ4”øÃwð{mÈ>ðð¹÷ÂVÚ{í»•^¢Ñ+^µ¬œô ëÆdŒJ	“|ú«^þôI¥”ì²:/&àýsîNÝbä7±öuIÏ0”ë0Ó è„Em²Ãêzzí‹~­tË‘£#¹ÙµG~öäùc’<|©S@^ÎpZ# a3é1ÌÍµñãÉÝ‹Qk]pAëÌ
ÙÏ—¯ÎÉH<²Á=îë`‹²"QWIF$ëD­5‰qãî¾ 	ÚÆ]FÖjV:Ê=–¯Í²9£žîdÿ„'˜„ß‘¿ ™­ïï³Ô:Ÿ~7IÐC²T¯zyé™Êõ5é	Æ^Ó<±t/ÛãÀcò1\5££g²ññÔmÍ(|‘€çpº«+¢P›¯¦L+t¤Ê`l?	Ú3*ƒF;ê	¿üÄ?v³•A¿Å«Ç~k·Ûùö7yï¾‘'5yRå£QáçÔO,‡ ¹×U†nÆTUû_åuŽ	“ÎøQ¡@Î¢âÑGÇ—ù8y4{²™ÿU3ÕãçH
‚…œ,ßŸ6ÅG›Ñc¡”,8¦:¸ü±[Ö/ÖÙ‘”_¢a‰ü$-¬Ùn¬ö”ùX˜
%ŽàúšúŽëLÒdr™ñiL~©ØÂÇEÅËÙ£+’0*•.·ap£,íwÑì&ÏçBÌçç£Xâ¾ò‰(Â0É:†¢ƒ¡y@á@ù¾Yla¥ê@¶¨îæ`)x/c—Ž	4s)-‰œ'À‰­kýÅ	cËÝdý0®8›ì%4Ð¶œ©ÑsÕi¡ë²€OE@@= ÐÇ”È3No+k–¼™3·æX_¼é;†tJö‚x>fpŽn¶A°‡Xë†ÿEñ„ÂÒ<¬CÈÇ×š†ŒkÁÛœX3hàÔÆ´¹Æ#kK½íc2œ;î¹öµ3ÙÀô8½Øhpr“Hªg¾ÃU³\!ÓÂJ‘A“FïùÆão Î«ù[úaéuÊøÆ4¾1UŸQ” tÀt>Œ-ñßKÃÔ¶ŸV§%Ñ¥ÿ¢ŒdUafJ‰4M[¥Ö—˜&RI>œ“M;NVÇ¨¸)ÀšÇõ,‚“Ø>ç‰ñÑ´ûM¶ÞQÅ,(|ú¸µ"Ÿ „\32Tæä2O~ò¸Á¬Àü©¹V ‰öN÷]Mu¸Rž¬Sbì4~º¦í.½£"5Z£=•Ò©=ô®vW¼«µ{`¸vÝîRåÙ(a€í ê'µÓWÅ U¦ïÒÞ¨fúsË½‰–dKü²H6ÃG_WàÈÁ—8"ÎÖÒ¡#V€\u´›_É·,;ø»ó!9A©_ßÀbn_.ÌýùÈg¶W€ºOìÿñŸì+ÔÿÔÎ\ŸéË­«ÔÆ_SÌHNzÉq1³Q>Þ-Á‚J˜¼oUé«IsŒëž*Žq±ÔúNàËÜˆu†1Æê&
£dÑ[¹½ÝD:+ÙÕŠøÖïxËé@Š+#;sû_"ÎöÚñ/Öw'¶¸÷Ì!/¶¦ìDm‘âÃjkbqh	’õn·:Û»i~Dµ£Vu[)>Ãd§eœ†ÂlNì'»c`NöTçT§TÈ"{H‡¢-QwxIb¼"†²„¶Ù#V)[F²g8þÆŽdõmÔ#k?Ç@í„_iûVÖìÓºqà‚_zfÉE÷„§‰ks}!t³žË>‚Ç·v|ÏOe;Âô?XŽ‹±×C_PÓ,WÂØ|§ëþçØ¨åÖ?`§ø$ËõôæÆ¦´«µí)lèKÝ©$¸ACò(.ËüðûÇ‘ØKÏróa¹°w|¿\|¾jûròÛføhU‰ëÜsK’2£è?©»#d¥°Y‰Ž¥œ§bCtEÊ
±ÊØÜ$¼¶:6WÑh1XWÆUˆ«´Jéº4=^Š8]`«“}Ž€1{ š2Ô4‘©sÌ`ipóOfí‹—ºõq©å¡×ª*æª\- –pTœnÁKG&úŠ(ÅÂúH¹Ú´’Ø®:m;¡¾¡z4o®«l®ÑF˜.B ®j8u\Ý2Èí=À:d~^$J“/éökP,L¾‰òÚÌ½ùÓÜ®RhÝò-w+[nzzõÁ²Š‡5Á³¥ÿ©ˆ\ã‡éß+ˆò—Bf;sÐ³ä:Áø/+±Uûæ¯bÐ¿ ¯‘u—U5Iø?ÜÞdCO{gó¯/å €v>5ãiýnH¨Wešz5›J[„7M§W«Wl²9U­ßnu :íý\jœ®­ †]°gUïÞìíëz…Ñæ¡½g·Î(šôØïßß·r¶ww6þ;ê§ù}ú¤ 6Ô¯êkä=gnM$%ñÅ,œ¹0Œ4rÃWªªÎ/Ð¬Ác&¾J³×•4{&Ê¦êÖí\m¦~SJA;Í}Fœý¥JøM A-Å&ÞGs/˜YnÁ,&Ÿoÿ#°¨¦MŽÛÚñsôÄ +JÝÆk8äcúGvd9®é0Í(Ð!_’4yE8œØ£ØµGÈ„ñlq/ü-§»~‡þÉ¿½ûTênã]‰­“¦Sæ?îl‘ç~±x¸ŸOEZ—œ”)+ÀbVTÇ”öÑçü2 ‘o¬ Óô&¥&}`ý`¯brUñIÉrEFB‘ÚìÅà×­Ç;6“)1„¨äc—	ø …˜Å‘5³Ê>%Êá#ýÏêßT†ýV	E6Ïí"Û€_¡ãFIÂ_€’[$íSÏu-?tPÑ÷}6 ©öÚ’K±©Ø8Ö*Ü¬úÍª"YYêž·‡H­Yd˜bŠd–Vv	¿9¡¸M)ñJÉ—^ÇêÚ‰$fEZi1å&”íˆ/äQ¤I@ÔÖ1™\Nð·-øÇ÷„¹¹Tü­Üô¶‚`LìrÐ0œƒÈRÄFU`*ùn°ßGFá1ávë·ÝòËJ%˜$Eþ¬ÊÚˆdûÉŽl]Çù7@&ð%A3»$ ‰*N›%·¿@<¼#n 9±Ew‘~ø7Þ1ôÞá38ŸîNÉ\_H	š:ìjÅ+rìð&Š¶^aZÌ.ÁëD†/â\á†~RÊÉÂ{¥e¼Î/^Ç„ÔW'øQ÷m^–°ª•Û­'€¢ŸäªjŒs…¿$‡¡Z—Îë Ô§¾0¥Ü®RÛÛ]qøðy`bÚáSËÏ^W¯Ð‚þ6ã6óIºiº0ÏÀ*–œy’fµžeg"ªI›Ôwˆ8Ã~ñôMÿõó—ýKÖÿ¥ÿX›®Á0´¾–Êú7{•õog¬?¼ÀTz—µÔ°–ÌUÿ¬óß’/Cl\ÙFîˆæJ5f‡R.¥¥®ÔXSñÄ´¢1^¼êÉÚeÅ)á[´2–îûxór‰ÞúÓ`TâX‹A/çÅN­`¤-é(ÚR¡J-†L‰FMaI}û¥S <—UGAÄQ\<}ýüùÛ×ý:X~ tüöðq^M"!äÔ “ÜxTI^ŠZl)ãv-½I‡ˆiÎ\ýª°n.0Æ™_Ég¤,Sj ïÌ¦(PÀÉA<bî˜ãûXÊÞÞvâäî‹ù+úCÛg¯œ›$†ŸÌÐ'[!°Î¿o²AûbÔÖg<ª™bLtm•˜DŒÞ‘j¡aa_
jZgê¤ú¥ÛÆúè¢Zà–ãUúW?Â¬ ´»hjl¬Š(l”=ó]ïƒWEaYÜ®gØï¥3³×¹Gáó8ˆYaƒÃÐÏíå¬ —’$©Æº²UHÚŸëPïkëƒ3æe%14dçN#_!»Q%`¢Ùâa‘<Â±Óc¯P|~‹â³v ªA$=ÕëÀìtœ0)N{íøÕÓ×oÙÛËþ«¾‰fÄKœ0LüÌ
'×Ò¾ªyÓ*ÊÉWÃäüÂ¸â8 ²ÿâØ·­õQ2,}µŠü…n—·Î¸ñ¶3ŸÛÁ_QÎYg§»·¡ã¸ê›ÖTç‘¯l[ïOT
E9	9
5õ„ÐX³v²RŒ_Y/âûûa¶t¼Æh¶|å’Ï9û8ç?‘ŠÃa~}¼C‰ó
œcÅ¼Ñ¿W¯vúÙ›Ù…õåÚ·Ú)ç&y°SòÞÐHKI¨4='&¨5cIÍÎaÏ!Pæ øèð¶QûìQÄ‘]…8²o§q±Ó(­àW} ‘oÍOdaÚp(³Cóçr·W6<}Y‡3±Þ|;˜‹Ìtõ¾êC™šÏenÖ+?“Yj›Ì½‘2X&£­¿¬cùžw5ƒûv:9ÅEüSÒ¢“ZåIU­ÀÊlá =ÄqÝïå~¾¬³Š®›WÂÿí .rPs+øUŸREáºÊZšùÊOgÓ@¹¦Gó Ç.;Äúw_Ö±ôÅ¨¾ÉEŽdºz_õq0òIéÒˆjææ¾ò™ž–“:á‘ôÆ5ã•'­9k]`–D½GÚÕyBÇ<µ‹÷½]èˆfË÷UŸÑgŽk_B?¦§3?í8ž¹“óçóq§od}”;[o.^}a“’8^}<=™Òú}ÕGsà[ÁÔµ¶…y¯ülJ§ÍCÍ'=öòååÅ—u§ÓÈÿv9ˆ´r_õ,e’©<€é|W¯•ÅSñÖH·ƒ–QXJÓ³×Ùé±_â`žKÉ¦iúÕÅÒ˜¾À…T°|í¾ê#ˆ:W@í‘±Ú5›õêµ­ü„,¨m­sÃ2rw"oƒÈ¢
Dó¡5â55r{b~„‰oøþF%ØÏìuÖ¿ìã,Ÿ¾>íŸõ_?ï¿6ðw[-âšXó‘kŸÀc¿	
X+b€œowzüsŒùã^qªt±ô€eÊnãM\ÂÁ™w;w½|j—Û­]ò»Äóm]Ç_c‚ìR·rþú/ucL¼7üYù7vâ¼m¼ôô¦\GñÆqí5f‡¶­µß‡Þ|MÊ»ÏÏè%—Ã@ÄØ×{m‹ZŸ•)éûÎKûŽŠé´r¥PÆ…R(T@èÊò«©}·¾ÁD²/i?¯ì0„Æë‹žäÞÅBáâ}J7ñÊ¹›/ö-‹Ú`ÕV~¶0<ÅŠbL&ß¿x±JÄ¶%;÷Æ^¬¯³^Ëmw¶ÕI%¸\ù·¥¶Y™É:l¬Ã¯qT¹ÝIþ BšíÆMYBýu~ùåÛ‹›ÿAòÎ²pb°±†Ú_½`JlaŽ‘<¤e¯ý$(FÀ†.Éì}øk9]	E^ï´§ÒcÊ¹;"xâ(J¡‰ƒöæëCJ€ðsí§®ÚRœß@1}ðuRä§åø®&”œ¢6ˆ«¨[ˆö-J?ÞÉIŸb‘
yÆ£¿Ô…DåÑã™úœ?„p0ìHTð’ãSlRŠ3AÁ)*â*Š3K¢Ä£(g–ô(ê°4v‚%kè7:šÃ]i–/Ijvù	-®
d¬Iõ#)j¢Ö(ì)N«FŒ‰þã?þÓìÁ¬
Ž³²u-Æ,ÝÎáÈê…Bˆ4À€/õ¥A\¥ç¼¹„nê‘æysšE¥²dmZþY™6°«u /Í&3ºzÎ¹:*ì—âé¬.WòBþNù“U­›¥ìnP˜aâ+ð¹¦—49àë³>ÄÊ^¤—Š÷4µFÒÔCÅTDŠç«³•ž7ÊJTžM]–¢…×f.¸Ëe¢\t4]ÿÈ¥À‚Ý—niz9³÷î—Ñ‡øV~6öG€@Ò‡s_W±S•¥—J÷f‡‹n…íEŸ=á²÷íä+Ÿ7„¡?3–Hl}ØAC]5Ð<ü–><xþ3‘¼°nÌR5r>€ë}~8®,³n©ýðøJÏ¾•Ÿ{V ¿$BæÂÛ~²i%õgh$¶4gVh·‡ünÅ{¢exqðöä—§§—ƒ?WØôä•ªÓs`­yË›Ÿaé/¡ŽÂ¢`“ÙÙYYMþžIO²OJ1Û}ƒF¬¤qÊDz–¾75í­ÇªÚPŽcA|dGýò‹ª»Ÿ“›×Vn#`Qÿ¤Á‚ö¥ub!¸¡Y—ôq	¼´oxs´M_zÏÏgI-£s¨Wœ	Ç×aüÐú`÷96¿;÷Æ0Ìüf8[výá^"žÔþ£2'OtñLg[ÆãCþòÑ½Ü”BÞdÊ|‘«²Íý¤áWÒuÖT…ý3±,µòmÞw
bi\9”©K)6·Ì®µ5 )$¹òX.¿Ù<‘ÜçÖº%Ûaé¬Pû¤Ä¶´á Ž£	;f;jÛˆ|Uþ¸ºº¥Âž9 eRruµ‚!\.—¯o!WÅ["…9_åÌfîXU´vB4)ú@O”,2‡œk`iêWªÖ¦™>YrÊi¼v^€d9]<ñ5·zâ^“åkî““®æ¯qäkÊ´ž²›Ñ‚RÛ¤ŸßEákSû`ñ`]`(ú®ÛÏÄ¥¶Xx
èÝâ`\V˜Ç†ÅmüÙòãË¬ÅÖŠŽDï§ÆŒªÏË«/F¬eWŒŠT)0ÛŠì^êDœ/<^eeìw[N›ÙL_Ú³kËuØÔf);¢YÝBëL+·ÊT
ëúÀ×êb>Yáx´íŒr+,õ˜V.x_[Ñ'_'G	ƒ¡A¿¡ßnÁ©ÃÌjŠÚ¢Ñ›wÁŒž÷¿—ÝŠiHÙ÷´Èˆ$9ßõê×³·çW˜¼:q}÷ãÀwí,W­øþHx„'¥?Óß“‚˜è~œ¶Þ¨†¶jI®RÉšhÝÁÚdÖÌoGÞ9:¢DRdkc•¹@é1³R0RVZ_V	Ý¨ÎIMùõƒr¼ÜJøiÙtßôˆ1s‚Ÿ¸h}¸Øj¹Ötˆf0Dª±¹™ßjrñ‚é>Ì1ú+EÇ°#&Âd<t×Y_ßdëW×®5Ÿšºª&FÜHo4Y6º¡pE;bÀ&æ–5ÚNx»S8Ë¥_†ÞìÚ™Û£Ÿ£™'¹ô;/Î&¼ÜšM/ibí‘7Œ1Ëoû6 `jýÞ¸1¼'0PóÍ/¿Þ¨X¨²	Jü~ü}î\³-DÕË¾þ2žù1@‡9MˆSúŠÅ&©ååFGå.–k¯õ­±ÍîYèüÍî±þÞlfcgÞcÝÙìGVï[wQÖ{N™n¬™ãÞÁzP€œ¥è2p³só#£¼Úk+ôX§}ð##ZÝcÿewww#i'''­tì_VÑ2/|Ÿ¸y…XÐäÓ+ïq´É¢IÚ%4ìd¡ç:#ö_vvv~ÄjIX«¢ÇöýËv¤u9hr¸Ôy<4¯ªm"%vGkÖàp‹Ÿ–(ø—öÇ–?“	ÁáDGL²ä>áÚÖljs<ïö²qbá}XÃÿÞìâ¥¤NCtan5lÍü}*Kõ‚™.H…âîc©ìŒ,fLù¾$×K|úŠEûäºì¨ ­¢v$Ý}»8{¶n¾6æ*°ôU0w‚BR§ê¢ñôÍÕàÅÿøtðÛzoý]C¸â!Ÿ¦YS^‡¸öqæÎÃžw´óÖ:œYáÖÌ^èÝD°}³žwsãmñg]¼qkðÆ­‡^¸ôüÑú$ŠüÞööíímûv·íãíË7Ûožžná0övÖ›žÆ¹¬Ã1l8±‚ÐŽ`ÑÍÖãÆ}§ZÆZ-ÌX-ÎLåÙ§ïïño›Hý§äçh>cz[øø–8 .T¢Ç|/€£êDãÕÞß.Èz)™­~àXnÙâjDu§ãG%îk±þÿF¨!ë3r†–»e¹Î–7òüEú]ZŒóYß©M–“›®×bœà	~oJá9*¾v½kÀÁs Z'ð±õÛú‹oì›€|	K¿ÛÈA­Ë÷šÐAÜž…U~jÌ_ðÞãÀ…Îß¾9oÛŠl^ü¾·p\6
‡r
­f<5ýÔµñ[kÝ¸NAva‹íI`ß@³0ä…^%±í@ðû^!ö½ÊIÊ >¾kíÖöÿûí1jMÖ7>!÷ÕxwÓÙ#HµaÏìùètâ¸£Žf±"Ñ”ù+%°gÀ-4wX4lJ7+xÃÔ8úðÖÐäz;Å„=Ã§«¸+_¥Èu<#xÐ¸Ø*¢<©ªr?ª6­`æI-<šÝ¢ßåÍJµé+Þ«‹Øu&S«>î¹5Z½œ#Ûµ£Ôõ£Å­8*ð¶îŠEè0ó‹Ó.†A——!)ËÈÍŒÂbë¥Ya<ó%[¼žØ†¶ ¨X¯ñQ&Ÿê}„·.“ìdr)YÎÁu“Óg'õèøÝúÌ7?sÏžBõ¹.ŸëJ†Ž] ‚¤õìzk·>ÕEÙr’Ö´—ÎÜÚñ‰íÂÑÃÊáVâbS_8\×úžt²±àÚqâ¿ãÛ³ëP	<GŠ)úôÌ©W¸7‹çCQFÈ	s§ºÿ*À(Ã…âéª€Ï«¤ÖE©'ÆÄ‹BÌTLt–cŽ&6‹)÷
ÖÒžYJŒ–»º)*ã´±>y \(W=êÑçÀ»ÅÏ•Þ^Té¼A©RãBx
W±nâ+¦L÷ÄK\æÊ/á¥H‰	ï ÎÝA>4ù TçÑ<CmfÍbúX®*Rç|6+æX_dYqv«²«ì×â0¼ªgjDt`9. Ê¬y,TOÙŒ#îiÊ,‘/Ô°=XÉ|™Vy‘[è„@Ž)ËYÿ»¶ÀÙ ðø}; lÞ§l7./Ú5ú:$¥wVñ†`˜—½‡Õ<7Ì£
×ºóâ oÄÈ—*l”›-;ó·å7/ßKE‘-ÀÖ\ÈýÿE`„gPfÇÈ«£“Eîp>§LbËømÏ¨¶¯IAîä*{8ÑÔ0óê>UI:T—ìr"s¬e÷5‹Ù¿¿÷“¾ùQ‚þ…÷	'¥œ‹ÚL‹é’­&É"^fdïëåwòÙgÞÉg_ßN>Ûc­gžëx«åûkqÏ	µ…ƒBÇEÍùvvC"uØ(GŸ¾S3Ô{Û,…BJ¶…Š­e
„#'D}ñèè™F fjF³¤8ûIFÙœ,žÑ‘È c›é…èn¶õ¤P3»p&’)õ<àA F©ª˜K‘ø$`»³S³/3ÈNÖNäá9òäAŽ%M˜¾ÐwæLv&íé¸Çô³]JêúÈàmî£grÔŠy£J+ ³3ók²¿RÇ¦§ Œ‡1óÆÂ\zVÕåuJ®Õ€²¬ùüÅ%xî4„çìª3c
ÜÊ©šJ|—Vœµ;Loù¥ãS¡¤¥“ÓÊE7G°ß©ã¢U×ŠÑk&ÞèøãeQëžµ®
‰jòøš+©çüVŽõÔ%GÔ+x¼Àùì¨å2[]vî„ónØ+Ì¨}a»xPxçf$3˜Œ8ÔWŠY^ó³/i~}L•´×8°N·£tX_*Ÿ÷ÚñÅ‹ó?÷_³W˜Ëûâé9úIÃ×V!úÃ7ÖP¡aMÁ<§`&°ÎFºmY;ÆX~–ìŸCÏõ©ìj”äÕ2¿‰6ì~LÑÕÕŸd)[œÒ
ãkC7"nŽuBÍŽŠHþæê-€ÅÁÜÔýÝ0{mrQ ÃÜ\¯àcò3£E2o¯ Wîñ¼”z©ò£!Çñ}3W¯d§»PÔW€(WyÄÚõÆöŠòr&÷Ï™B678HÌx™›‚ÍáÌ\RcAWe}È:YŒÖÙAàÍLh™]2ñfwG
Å|Ä»tv%¯#09vÎœuiïAªc/íÐr­	òÊÍmYmÈç]FTmŠR/'ñ™¥8þ\«ÕÉî3`	û£‚¨‹É+ö»ÕA»üSqðñ8æxS=!¾
sæâÆšÇ0¨Çm3}Í, ¦HÜx²[Ú@ŒËT‡È­k2n“=s&B7p¸=Ù](X.5ùÊFY¬ˆÂ--^ÕG+pd]£~	7™k¹1›ºÎ”­åõk,N,4±k9Ì·çwqHƒO--×vp/…¬ÿÂÀ¢l°1ªÊÊ·ÚÐ»IKí þ
ê³ºÜÒâ´°(T_]]Âê< Ÿþ	ÿðÿ  ÿÿä]ýnÛ8ÿŸ‚	z°…µe;iS\š¤È¦»·-¶»E›ÃP­l3‰Y2ô±qÎ0pïp÷ç=Ý>ÉÍðC¢d}ÒRÓb	´±e‰Räpf8ó›v²<¤-cîo¡t•Û¬wÏg®UNö"QvO‹™¶R¼™ßy+ÀÃÐS‚`T–I¹[c€€Øï?fà-hŸ:,~œ:&¼{ûjÆw\Ùî¼oávð`­ö-3¦hgÏÍ ô£ˆßt~.KdÂF#ò3uðÐ&GçÀ“Ì€bT2\ßƒÚƒÎÆÎ}EßQ-OýÂêá£ ¡¯0¦ÙªUŒ-ÝRÅèõÊ¥)NÈ\¸Ì"º–¤ Bã.Ð1“º¼†•~SåK)Õž9;%G‹Y„dBú³ÜÏ¶Ã}ðÒ\¢®µ4JÈß<+6ûÕR°Øx‚lJ­	ÐP ‚œëÊ–&@Dš Ìª„‹¦$£ö–B /¬ƒJ 	h‚“Þõ3»=°tA¯ƒÝHëH¸5,‡câ+£ÿÇ¿ÿKz£D_C.`´ÕÞËµ)Ôõ«‘¥Ü”	ÁÚjÇ¹ÇÔi¯414gK®á#Že.<?y>g­	7­i€Î–Dò˜& KZa¼ëÿðÜä¦a½ÀÕ´´ò8NŽ«uŽ±7ÃÐúäÊ÷iñÅ†Ôr²¢Œzžã×[$pa&yÄwfêžŒŸÔ99Œ¯¥ŸÝþ7âz.­¶|g‹^üfÝØà¤7õÜ{G1[$y-´Ø"0M³{]©ñüÍWlãðÇÆ}hÌxbÚvá&X¶¼íEšYb ÌÞ&vá6_Ãnv
·ÀÐö+n‰o½1Déì1b£PÐjùCÎÀô—>ý‰kh¿dž——•‹y$EXö¢ÂBU—°îÉ>âÌË¹=…}
Ess³1ŒyáŠJ§’H^m±!QeŽ>µmÃzšØUêœ¤å•bÊÿY˜Ç\oRk/¸–oÞPý&ª¼Ô¢ºþ3µˆ)=V	ºŽ•Šlyn*JÜž|ƒueIP!ÓvgN4§ê>oBL"V^×¯læueçëö=çÖX“cõNzF#¬ÍÂi™©¦ýÎ§@J°.hî—XŠ¸°jûÚk›A‰Z+y”rßÃ±©
Ç ámÂåÐôÉäëæ\Xr©|ûKí “¥ÜÞ·½Î°ÊÊE&oúvVØÁ×½Â"Õ¬½.ša½ÛªÍá­+ ÛV°£æÍHµ„‰âÇêøÃ²†øÁ×Ê‰êøÕ©8Ÿ´ÀKNôä¯z7¼•~R;`,·új»V ^/¹B¥ŠUM1SØÞ6dnùvåŒ4CÔ††]U»øoAÓÔs<>®Š4tÃžüE§Ä²í£ov–,·ƒì17¼Þ¬e[î¶ëÖ†þÞ"bW«^¾-/fÌ”·D Rü|ÃûRê[ñwÄ"‘©Ð!†¦UòûÔ±»ËZÿõ:ÈfN×1<á§Gõ§Ð§:Ùé³E“1d¦‘5<'ÁÄv<ÒM90ˆDØûgšp{:s^ã‘ÜÒ2ÌE¢º¯¤\uZ7î™‰)
ÕöýŸ-<
#÷ú:ÁIm×¾¸Ä¨Rº`ÁçwÖm‘)B½K.»vh’W‹…oQ-™[ÄÔ÷îèÆ­›ûM…›
ˆôÍõOkêÝZÇ–’µñ’­í÷ÂjáWÛL4…Þì X{«Ø{¶þÀ…&•áƒñy¡r¸öTÂ ð$ñI§iÞ¼¯ƒÒv“§Û¦Ž4>“»"|ÄþÙ¯ÞÉ(¼i‘šfŒŽöÏ8
ÓÃ’ñxÿìµ>"t1MÜò/ÞNÙeô9Ú"ìò+ ìÜ‰|’KÝyûäiOóƒ1RêÝZM^½éžªRbžÀš{KÝ™åZä¶ŽkËiN<Ñ€`ý óNB†~¨ô8¾=•ŽˆºŒoï Äb¨3 Ôy9_é ’BqhH˜kTN@ÅžN/Az]Õwwj“‹^D1)'Â
—O‚?41TúÇÍ›åîD¬ŽÂx/›hŠÒ*ºµÇž]£0¿Y‰Q9¥,uH€ðûXgÚ©Éåch†ŒÁ¤ø‹2oàVv0IÂå€Xáò%jÇð3Ùè¼:NpïÐ$p*h4¨hFû}k6k6Cá#ù]co€ŽUÿÚ”‹w:€: cCcxÄàŠ¶Ùê¸ö¡{ðŸþúHzÇ1Ö·e–hf3~žú…À`®áEþ1Á¬g¥ÿ@i®{d£1—”n2rx/ñã€]Ø­ŸI_]ÏýñêŠÊh#¬Ú\:Ë´	ÝÐÙí¯Ê=Ì{/u:pòi®KI£H¥¢2#÷³]–±ÉÍðÑšOü$Æló)‡+ç2ÊÅ€Ó·-Ë"(IpÔ=u€ÕÂî¤ÆU…s¹ÎO×âÃ¦L2*ØÖÅæÏ@q‡¡·ÌT°[nµðÙ ¬h²{2Y@dØ1éGª¶ÝGú!GWŠ+Ì»òÏ0Ä)CMEçPæÀ?D[ÝŠÎ;èWÁÔ­þO1à*ƒ>Ð9À(¥4Je¾tì Îí`†ŽÄã³šIÞ[­Ú¦¸ª²NÉ8°õ‹m¿Ý"[NXj?ØC¡™ÍÙúÚ—›“‘c·ß¯"èQÝr2ŠvHâ´][[K¡‰ŸVQia¨v® —s^Äuv)ù£ëùËáò|Íb‡}ö«êÁ/Ü>²ÞeLNEÉü9ÞÈc\úã9¨"õV«UÏ0D(¶pöa2 ÌA˜DiŽ&<õ`+³bVÀÚ´»Ã™OÄéËußöÎT£Ð>³Yx;a‚<µ/S|¦ÞJó€­ª°ê\Î^¸Z½z
ƒ#WðÓû
çCËÜU–$µqŸî¨}VñÇ‡	SjÂÌ½¦¡).í–‘ª¬(È8ìŠowgMb‘Žã6’vJï´),ènŸq{—þõ·]¹FŽåìê””n"«YÇ|W«ânhV=¢B–-}>î””Ë1ð#Ç9àWÞ,
Žq'Wvç,>—žaYiAŽSKÛâo!~â”3€à”“BycÒ©¼7¿å•–VxÄ@ÅÂÿ~²1u­´ˆ*S9°Q"ëFôìžn2¯|AÙ}Kt×‰©[¶^Ÿí²|eSÇ›Ý’x3%T Ñ%&ãñèé8/C:òº»á•ÝÕÚÀòÇÿþ#ü_Ø]ØÍ€u4o[·´ºZ¬OÊ˜ÆãØLæ©%b¦Åàï>TÜàÑ²•@ë€`aÏçÍE7LAµp›BK«Gòáäà®]½¼”©0Fnft=†»†‡ÊƒHäÞ´E¹Òqö°µ’e{ ÌÐûÅ»£þ……9nöÝû¼ì¡ee{d™·éÖåyõ¦&r\Ò&[ÂÚj„_oõ0«,6Åµ¼\¾„ù*-Ä"äV÷‚óvvÖÛemwnÄB”®XŠ1˜½£ä€„Ëÿb2*!dš¿œábøÃ£uÊ9­´Ièøc.hÉ´m*b,™q+nîžäµ2<è”ßa}Àà¤*ÐèÜ#É+[¶9Pø÷%Næµ¡xo1ÃÈ v§’ž3±kÉ ±·±~t`OlY¡î@ÏÉ¼»nÙ%•<ñ[7R{^³)ØÜ,€RgZ
â&¿°î‘Ž~–v026².øÉˆVó‚#Š¡šØ³çÃ—/z˜wna^j7¶bÏàÊ!ÄàJpãù!|¿§–¯ÜP
üºKéHgU§ßåúS¾–*lná›”,Ò\öM%²á„‰†½¬•&IÉ#³6G9®SZ;ÇË+ëŠaø¦æWÕ¶< iáËñh±¾bÁã(‘G&y‰fÛ¨je<>s0ÞË?w¨^Øþ,UtÈLñøpãc(ãX25wîþè¬IR„°ªïÑ.1óí%ú`~K–ÑçvË¦õ×kÐˆì’Eó¼k£ñ\ÓgšÈ0?R7.‘Å¶¼PqKA—7FÒsîE–‰ZQh_E	¢ÙŒ	1Wq=¸jó€‹Â¼-ë@ÍoÕ0ÿÊ^±ÔÑaè-†À13(üýC9-D–I†s¤W…8ÐÀeÈñ›Ñ¦Ù\î*þ¥z6g†Ã˜u³±¤¤zžÖrƒý3Q"“HGS„÷ç åY õ)õv:Â@²ŒY{;$Z©—UZ¹ëd´°ì¸-åÞø#LYDèýn4">E-ÍóQe`É¾ç…Dø&'ãV¼‡S†*ìÍ"üˆØÂâê÷/çýÞÖ3öž)OaÀP8ðãÇ·?ž_\~|ûÛo—?¢n?c4¼…ÛûJK@dÅ£§¬	èþ1}
ÓÁïŸœ/— %Ïþ  ÿÿ ºB	ü