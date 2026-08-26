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
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);




                

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

  const handleAddOrUpdateFlashcard = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fcTitle.trim()) {
      notifyFc('Judul flashcard/video tidak boleh kosong.', 'warning');
      return;
    }
    if (!fcLink.trim()) {
      notifyFc('Link/tautan URL tidak boleh kosong.', 'warning');
      return;
    }

    let updatedList: LoginFlashcardItem[] = [];

    if (editingFcId) {
      // Update existing item
      updatedList = flashcards.map(item => {
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
      setFlashcards(updatedList);
      setEditingFcId(null);
      setFcTitle('');
      setFcLink('');
      setFcCategory('Tutorial Guru');
      setFcDuration('');
      notifyFc('Flashcard berhasil diperbarui dan disimpan!', 'success');
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
      updatedList = [newItem, ...flashcards];
      setFlashcards(updatedList);
      setFcTitle('');
      setFcLink('');
      setFcCategory('Tutorial Guru');
      setFcDuration('');
      notifyFc('Flashcard baru berhasil ditambahkan dan disimpan!', 'success');
    }

    // Auto-save to LocalStorage & Firestore Server
    try {
      localStorage.setItem('prota_login_flashcards', JSON.stringify(updatedList));
      await setDoc(doc(db, 'app_config', 'login_flashcards'), {
        items: updatedList,
        updatedAt: Date.now()
      });
    } catch (err) {
      console.warn('Auto-save flashcards error:', err);
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

  const handleDeleteFlashcard = async (id: string) => {
    const targetItem = flashcards.find(f => f.id === id);
    const updated = flashcards.filter(f => f.id !== id);
    setFlashcards(updated);
    
    // Clear input form if the deleted item was currently being edited
    if (editingFcId === id) {
      handleCancelEditFc();
    }

    // Instantly save to local storage
    try {
      localStorage.setItem('prota_login_flashcards', JSON.stringify(updated));
    } catch (e) {}

    // Instantly sync deletion to Firestore Server
    try {
      await setDoc(doc(db, 'app_config', 'login_flashcards'), {
        items: updated,
        updatedAt: Date.now()
      });
      const itemTitle = targetItem ? targetItem.title : 'Item';
      notifyFc('Berhasil menghapus flashcard & link dari tabel dan database!', 'success');
    } catch (err: any) {
      console.warn('Delete sync error:', err);
      notifyFc('Flashcard dihapus dari cache lokal browser.', 'info');
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

  const handleResetDefaultFlashcards = async () => {
    setFlashcards(DEFAULT_LOGIN_FLASHCARDS);
    handleCancelEditFc();
    try {
      localStorage.setItem('prota_login_flashcards', JSON.stringify(DEFAULT_LOGIN_FLASHCARDS));
      await setDoc(doc(db, 'app_config', 'login_flashcards'), {
        items: DEFAULT_LOGIN_FLASHCARDS,
        updatedAt: Date.now()
      });
      notifyFc('Flashcard berhasil dikembalikan ke data panduan bawaan dan disinkronkan ke server.', 'info');
    } catch (err) {
      notifyFc('Flashcard dikembalikan ke data awal lokal.', 'info');
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
                            <div style="font-wexœì½ûzÛH®8øž¢ÚÓIiI¾åÖJìüd[I_×’»Oo&_BK”Åˆ"5$Ç“ö÷íCìî“,€º°Š,R’îésÎh¦c‰¬+
@( å]“»ýá6ý0j±¿m<~öüÉ³lêDW^Ð¸“$œ¶ØÖìë‹µÝ¿}n:É¬={îwê	ûýwV©Ü¾\z_v°’ÏK(ÁâäÆwwÖdgŸ=yòôçlI#öþå¶ØóY":
ÂÄ—kÿk±O+÷~ùøÉöÆ÷èýÖúêåz2´Wz™åX.ÃhèÂ`6g_YúÞýíçÇÎöåólæ‡^pÕbÏàÝc€?KÜ¯IÃñ½« Å |7zÁ¾¸Qâ_>ŸzÃ¡ï¾`×Þ0·ØÓZ¸Â±¿ŒgNÌàrøÄÝ´ æ=;s"gÄ>¼\Çz³³ÎžFæÓO/ÔÏÛÚ‹êÇ â„“©Ïv2«ú’ž~úAÜ
w*ó(hÅƒ±;uâÆÔDaŽ’Æ ð5¼+þTDë%j\Ãzˆò;•q’ÌZëë×××Íëíf]­÷Ï×Ï;ûÆãÊnfp®c›øÔM6;Qì&0‚dÔx^±K¼ÄwwßÁŸ»Á•óÙ‰ØßœAâ}q{óËÏî ¹eõèVg|zù¹9Å/'ÎÔ½Í¿»qð—7žï”Þ¾Œ?~›9WnØñû2Þ°oIFÎÔóoZ¬ÒŽ<Ç¯ÔYìq#v#od ÑÏÍ'€H)³m>Ûr^0ßÜÆØõˆm6·_0{—‰sé»Ð'§X7ßwf1´+¿)¼ßÜØø»bbI8Ã'HBíŽåD®Å 8S´—nâBC÷—áW¨f#ÊóÜDî)­qTIñ‚âU‘çÅ#nzÁ(lHx“–,%77jR_\ŽÅ] Ãú–iX±'œÈ†­`yôz¹ž'“—ˆJìDž=ð8ÞYëò{a°YÀÊô¢éê”ñ½ñ–äz46·d-¶ÿÛæ“£EN"@êQç³™D8ÚønhÐ 9 m Ö—raü¼»8?i±·íónû„vÞtÛ}ø²×9j¿kŸ³ãÎÉúR=Ü;®Ïk}¼U6ëmÛ¬7fm™š¤ÜMwëçíËEsÚ»8‚)3¬f^ $÷’ÕZû*›ìvÉdµ-¿˜	dÁD^^‚P GúÄh_®_î²êÉYï¤ƒfqp[c/ç¾ÿ‚õÛo/N®•˜; #ì5¿-˜J¡ˆ!^HDžóS‚-Ãüì>œ/0äegmóùß×vaîÇlag®[’àä‹…K3Û[ÐL+·—­Ô†JÄÎ¨ëîƒˆElgg‡m²W¬²Éªoœà³ç×* HV¶à§8³ZeÁó2Ù÷b@ãŒ®1[g¯–ž•˜‰pt‡û¸ü·ÐÄß®ÜÛyFô°j©5Ž¼Ët #ë‡	È"g aºÓù
ëNƒ#"÷oÞ…$ÑyqÒôAªIÆ·i‹¬úã·±{¹ÎmÞvö$M…Á[õæ$ðmíÏXŽ7óh#ùk:›¯6åÄu@¶ŒNVò['òXß>;ÃkÇ_ »áÜw‡ÎMk.(«ù9ô‚*Ha•Ú1Þ #)å;eÀ¶Ãf™HiAÎ`rÁZ#»[îóÑFNH\À¡E¯%zÕÓÇÏ?¿Ô—çR¯âÓöF‘’¥+B´}¬ížœ„ÆÈ˜žjcÚÌÊwG‰uH(:  ©áÍ›öÑ6¼çK¨}tqÎúï.`#<ëQ~TÛý³õ¸Ýïœwÿ@>^Ç§#cÄØuüÛÜ\ÏÎ;½ÎI¯Ëªo×{ëÝõví]q1È­­åá¸lŸ„YXæýöY%ÛuvÞy}Ô9ìýqë®õÉ“U`
kýzñ°l4ë˜ßËÄ®ïèŸ¿Eáõ[´v 	
÷.e€%¢ÝegíÙš„‰mf
ºâi€MXxÖvûÞÐ™0gè0¾ÿ°™;½”‚6ä0Ø‘á«xMÚKhò•2I¶dzvMbÏ«îkTV‚gC/žùÎM‹|ŠžÇ‰7ºi À¥ÅPs—nríºA©Ml±-¥6 µRBÀz‰“ÌãéïALùÀhOïŒÜ	Œ€íqpJÑæýÉé	£RGÞå<z8t¯<°v8žÇó˜õÜIè;ã»è
Y(êØ¡·„¢s¹±ÄŸÐ[¶ÓzQõàkÏ™xIuák÷_^PgmøÖöGÎ¤Ùˆy,6p¢l/²v.£ûd˜ïÅFfbPŸü=o†…áäì,KH0h÷sg<÷ê//Œ•Æ‹ˆ8s|G"®Ùµ€hÿ-ÓÍËù.ÊêÎpê ò$dÜù.	¬Ë´qÒ=k¢\ïÍÞªVŠ¹õº”zg].…/¨ß£?iÙ{N„±S¿‹mwÉõ#µFªšºzóÇa‹©Ý	Uú¼‰ûàÉ*NþEŽeÁØs›ÚËu<HŸ}Êb\úá%ðÇÀ½f{ðµú¾òùÈ@5Ãªêh?¾™¢TœÙÌLB#çú4æÇx,b68ðPäâü¨9ˆ\'qOIßƒßUì*WÜÂÃp0Ç“:Q£ãÓ¹]µâT´âNs¹#(èO‡áuà‡ÎObøÑÄGy4ñ1cÎiF.l¿·ºþø§õ+P>?‚úù1k¥øX‚âùw„âðXŽãÌ™¹QHKxy0#Ý-Œx ,©Éãê5Æn0Ü{þ°ê³ ì'ÕZQÅÈ†_Ü|ÅØMzãðú@ä8:~uäø±«
B”CªŸÂ	6É²G<¿ÂZ£!$?G:ì±Ì2c6­±K7;±çƒ:ô|üÃ' <Ü8–Ë|+°s}í;þ „ºÄe½ùöÏa<—1p¯ˆµi-Ãƒb(#’Äî1@¤Z­±]ö-ƒt	ZŽ]7K‚²Ø:v/¹ÅÉZgäùÀ~«Ÿ±ËÏM/~ë^Ö
â¶£%Ûú¡°1õÅwÅ¬PÚx‘~Æ±‡âŠñzÙI Ä;ÀæøÓo‹ñ±ŠGî Á`àŠõªeŠáGð§f©ÐÔ¦eTP#/¨G…Ìº)3¶Û¦-œ ‡ÙÉ.Û`¯Ø±“Œ›dí©VÅ¨×Í‚5öe½#‘/í>r€%2MÇê
sêúÒ×3ƒ¹tPgïó+óANEtQU}¦GKÈ£@@¸j\= š;llõ…H*øb¤­ÆÖÆ‹ÇÐoãkÌf'l:lÍÏAbýÚ¸n<ƒjÓ¯gž„B5¹i<ÍÈ
ßÖ±þi»×g'§ýîë.(Ô]Ð­›â·$qêˆÝ¹rÙÃ‡ÚèfñíÓÈûê?l<åÊüýWãÉ›}m<f³›Æ¶šãVÎEÍõ,˜Æ.±+g•èœÌCFbð¤yD\«± !
À  ¯ñTˆKîÔÃ&`xöZœa¶J²Ú+ÞÆ¬…ñóŠU`¥`¯‹ØøyccýgÑ»|˜%L>zÅžÂSg0Fá¬qéÏ£ÆtX)ì¥•Øµ€“Å5ø¸P²#cTü‰6&þà#Âö9êíó'ZûüÁÒíß~º-¢öÇî`²ïEyÅéäphÿ0L4yÁ¤±±ÆÖZ$ß©o‹N,¢ZíöAŽˆÞvÚsöµ÷‘‚z9ÊR9á6þÓ¸Žœ™‰åÒ² L	„õÕñ¾	_øì²ñÄ¢d»”L`ñ·6Äùm5m}µq„U‚4by²‘ágòr4#äG Œ.ü§±öOS~¸õ5^d‡ØÃÉ±M€Iã}Ã}Rˆ:Tu±ydAßã-½OÎ²|Å²hæÈ³ˆ_iÄä¶„®'Ä?49ªNb'pè{jz[ ð”òS‰Y~±>Ö'°4‰©2ãt‰qŸ»gæ% 7Æ;Ü;†ÖÄ™UMðáÈ›à+<Å[—'vu‚†®ÏpRuØ[c&Pf‚Æ³3s u6$óbâ^EX&ÌO,öâk§¹ ³;áAÁ«"{Ô*Ì¡œ¿…Á‰óÅ»BÙÛºO«./ç°3—£Aì£Ú²óËáiÓÕŠ"h`¥Mh“‚M»ù·ý-¦dœ1¨=QKm(OŒÍä™Ä¡” É$ƒX,(!¶²2Ä`ÅaÔ˜…ˆ'ÑZéœÈ×mgmo>q8Ò2iÑd=D©âÚhê"v£¸p‹StUÊœ¨!ò¹ÔÚ{Ã!ì#ñ´åè
·¶{@bØeÎ–ÔÞ:G{‰X„`
¹ÆN0ôÝsJBú`1B-LQgq	7þžR‰¿ ~	Ü"h0/F®ŽGìµJ–í´”ÄÝ\›8…€ã¿å»Üb$â£ÜÃñ•ûë–¡ÏŠxÒs¾¸mß_I+Ñ¥…(š\Î×Ÿ#R)R¤*×w\û’uÀ[˜ÂâÅÛíyS\C.ü	+Ä·	«Í*‰ænÉVQ´h -¸æŠÑ“¿òr½ö|ç~·%»@ëš°Ø¡©±v·e³˜ó²j.½‹½wý>ëuŽàÏé9«¾>?=f¿v:‡G¿±óÓ^¿s^[¨ÎHÝbk	=¤Xª—
\F«ü´P
Î±,ûŠo–k0¨œÎ\Ûæô%Vô¸Ýo³3å™Ð|×>øµ}ÄªÃu­U¾Ö%ï²ó¦a¾ßÜœ}ý CîñÒ2¹é3Ök^ck»Ë9Šœ­ zÓãåÔT†cä#éshÉ°ò,D¡ï_:Q#{A‘­æ#&7§Î¬Ï/ó&TýÃm”^,ìÛ;j4“ð(¼–ÆôfySd”;;Ì<Þ°ËUå'gF´Bv	!?÷fçµ\–ÇO†×‹=™ðXÌ´@)Àn*LY¾Æ·ó<€˜=g4AHŠQ†sa‚ÉÑué­À˜ýÈ]ª0~LãàSs»ýkFuUãã»@´Í­ÅÖ·ìG·Æmêû¤V×Ÿåtª±výùÆâŽo‚Ñäg‰ÓÛ·úö	Ö¸kºú£9,æßqhð*bÆ©)i£CZ¤©~w	Í)<T¼T&ÂOuÞZ°•ý¸sÜÁ=—=dÇ§'ý·ìu÷.ÚuºxóZåÆ½½ìÆ½‚ÍÒÖ¦š¦t’ï‡WW¾››^éŒž•úW¤­iL6ÿåL„w0,f%(‹iW7Kx»Qž‹¤w‡_«êÝ.kIÙ.îŠyn+¡æ_•ÈËðÐLDÄRÜm
kXrB£€k”uµœý•±¾r^¢=¹£±…JüÑ¸¹õ¿7·þã¦ŠJº#j–9[Ç'çœÙÏ½f3–ëî\?Ý†„ŸE’æþmìÄhUžEaâÀj.¢W—iÈ>)ñWC•MM“Ïž›[TñÉØ]´Yc…©Ê"¸š‚›ƒ HW¸ÈMé.¡Gb½íì-#vQ[Ë–[ uuä­`ÎŸ”Bœù.ðnû0û%àÍ»¼3´5—ÉÆªäü]j>ú#@Næ9âô àTâ»ÀÛr~’´´'®èCwŒêNÐbæ†çÏíß¿'˜_––0«¥iâ¹A?/¦‰í{®§‡>K_-EÏ–\(¾Hgç§ý6CÌ§ì ßIØ:|‰É¾àËËt­vÖ‹[!IL¬ï\ÆÖ0»û]EÞá?˜"†åŒ§­ôçS¾éZ E°RÔeL>‚hÉªNëÌ~] Js–”ôÐ •úHl‚–þLKÕTsé]Õbe“[+Z¬nðžmemVºkŠiÃ.UÅ-m‘’³XÑ&¥«Êº…eº,ÂL![üVp}Kó:\ÕPE½£?˜²SãIuvÓbõ§˜¥2D'lèÛ³¯Öv”["UIƒEFyé¡H½‰´:‹]‰þMV*2MýÆÞò¬"ýöÞQgéS¢Çßã”¨èh¼ƒºtÍ%=/ÜÑŠØ)õ°ïø¸ùGßé„èÀ%ÐX**£óª³’h‚DLe'HEÉL2úP¹ßõ¬é>¾_$¸âÓnIJ*ˆ§Rïxi5§jhÙJã2í¶vÅÄ’ßßXN»,tû¼pK~:ñ˜<©3ê‰î>CK}÷á.àðÇ)ó^ÍÑþÑEÈŒö²šë¦Ø2nšùÓØg0˜g÷uÒ´úÆ.”d_Žlªˆ¯p}Ã‰ËRåÈH‚®ÏL–âm&@k•»`'?¾§Ï&®¡ï:”",r}ø9"M‡K®~È·ì3÷BrÞ63xÛ<HæhŠÍT(8Ò6}Ð|BñãCoŠò|˜„SŒ#bdZÓµ)¸]Ü†\ð‡¦ç¯Í`(Ê|ìøÎ`±ôãõI¯3ˆ5K€’ÓƒØQz§ïQx]J!eG(ò³´¿§ß’‚6~Jý?·-rþ”Så^{¦]l§¬Ò³á¢£_Áì@ ¸‡Ã'~–4ôfN4ñ]›çŠ6r/}r  3Çðž;AJ¹ZÞØ°H6ÄOÉ®îàŒö‰ÂM\Dg-·f½7ô½e±[fiˆ~šÑL®8Raª…^™,‹6ÊÊa=’ÝÌi4êÚã:p>*	 "ï`‚lùÚJÝ’û÷,•µh‰h1ƒV1ÔJ“)@ØZ>/QAƒ@E&¡‡«e*hpê°A½ßÂô;¾sJ Â9<Ùº{ŸÂF·ŸêàÖðôº½_ÛßHÏ9¬ys®š7§4I(±L–.Êóª8`yã†‰/)­PbS'Èö…ûDyÀOÀô4†JÁvh¯áñµ‹ÏJÓÚ°åï]amjeÓM•FËþÎ¶Èà¶aXsr;ç´ÒTç xôØ²Çò’ÅJQöÓÒ¢3Mª‡ÏT Ÿ†­ùâýãÊû!aö³”áPÿ`Â72ÒâaÚ·†ÕŽrí]Ýê² %ù‰‹b‹>h99-<¾,à°ŒÁZu	T¦)ùf Yò$Ä*ÇœŸØæŠc¥¤+CÅäìßBjòly%ÍÚtÖÀTb'·ÿ;tŽ|˜ÅÏˆ†ˆ…«u9c®ÚjáççH‹ŽÂK;ÏZ†x˜H£àÈç[<„g#wHž?!×­§yGiÙqÿRƒ§³ñÌ™žHÝýD¼N»tF+2x-}J[Øä=ê/>R,íù¾‹n5&ý¼Ì‚‹X)NoÜÔwî:q¬ÈËsS*>¶Obõ#ûRî
ëä¿þ6uÇm„w%»ÿ•6•{òÍUCô—j³ $CI†?D±ªyé‡ƒÉ=™+'Q×O/táI¢Œ€ô’Œg|_ªAX8‘[œcp™Ï€)Ø‘“ÌúáÌˆû]îÕnìà
š®ºZÐÅÅ\¡Ûœ‡×U%ôÖYEö_©3·	S»r“&ïD®@~Žw¾mÝ¯Êâ5t£µþÜ÷b4s·ýyÄúóÏóL¢‚Tq‡©E»X€fˆ/¡Z³Ù\l»+ûäí@3=¤x	Ÿr‹!ÎÃÁ<n‰Ctí‡~æÎ[ãÃyBÛ(&	=sý5nî>Ñ;nQw”Bï.QäŒçÒNœz-=ÍF7¨1=ºA.KFœ¸³PoÜ"ãóÝ6£Ç?Êaª´SµèW^ðÙ™0‹|u)åÎz
U·;V¤ÑŽÊË“M5ï¹iã‰Ê¥‹JàÛŒMÑR¯’•”-•Îëî`¹+¥þ)&¼¡ôƒw/œ{é³yr/”Å´Ÿœ6î·AêbïòìcÇ”sçß$ÛƒøÞŽ!›ðiê	Ëÿ{‹ºTñ§øyÉ½GÿƒKlø"<¹E{QRö„ O³¢æª§âEŸ{Š ámób©×ÖÐ“m‡»gžï_nÊ^” E¾\çåï©¤uÚç'Ý“7i¿êÑQÑq`¹Aš{(ßJ<ÞîÂßgˆµ{ ÈlD{ÿ]4«#õ˜•\ÐK@¬í6î*“þ9"y”û}ÅãÌø®âÏÃ‡L.2	zÿj‚QyhÄ–03ëün™ˆÀ»t=ûJœCk–NnYøwïü¼m±oöUl–dU[jî÷ÓØ¨‰rðÉÓãÂh¼‚ø½ï¸^1àâ¿:àÈ„›ƒ›
ª³á}¨u‹¡æýÕ¡&3šP£§
jôë»C­]5çß
µ?Æ*c	w¹¯-†Ç1áîþ”‰ó¿“)æ?¢•ø¦ý1¦£²pŸÂÁþGÁƒ(œÑ¥^œ°C-òÊ°ËŽ÷ž,Ù'wýåN&Sç§ò£I6½üö]ü€>9ô&NdíþYëž\™¦}_£üý'øÉœQ¶cÏý’ËÞÓz‚Ÿ;žVj#ùÞ&ü”˜Q4OÈgËä¥—Ö~ .–0dûŸÿ(Ë
~îëßÚûo»_:Ç“þÇÓ3º²€á,YÞä±èc˜Dà»2Šà÷]ú÷ûFðsãö^ÞBqœe>´û9	.­³s™ËþÀ'‘7Ã›ïÅ¿¿»“C&nüï²ºRç}÷¹ž	h®L‹ñk´ÂËØ¾àm©¦î-øŸyÖð¿ÉƒáÞTöÝ)ì/A]÷¦¬BdVa%¶£"”NÝC¾#ºÞUï¤Y­PzÉø¯%ÒþÙÒFd:+¿{ºðNLþ²0ªpé zî’†¡„ÒçY¥¾\$}Yh®JqŽ”g¿)£¦ËøêÒ öUbÏã…‰È©¥=t2é¾y¼ôÝP”¬{Yxú2×	-˜ÍñRáä2JœÏt"ƒÃ'tom&!;ß›C`‰¡Çü¹1Ì¥„ˆZ`7*v÷)Œ"/ÂòLî”‚Ì+§¿ž¶Ø¯§çlÿôäu÷ÍÅ9¿·ïøôÀsó-Î^Ç°Ô~kü?/ˆÝ¤±Á/î3n~Ë]ëf½c!Ô>³&±u—{yVã§iÖ±WHš}ÂœÀ›b%/`#gHÿ†SøÛøùIz•àV)¾­~£Aéåm‹‚ü—Ìx¿L(°ýv
ºóìò2¹vÊ#ªx.~Á…¼ªÖ¸è¢(=êm‰tHKf7XæÊ~Íî*yÁÖÔÑcÊÖs©\Ÿ¶„rc‰ø¯Uo¯£Z‹s/Ðe3;-éh{?ëgÞ’hE=ÊuÏã.&sÜÝ(qâÖÒ6¹¥Ž›—5¯’z?ÜƒWZ^Í£öAöÞçj¥ýxÙÜø12ß™ïäM­&øe
¼ûæfÖ?¹Û«ù}¨0“•Åm;mœÊŸú‰i6ž,‚!Ó+wjc/Êx—½Èas™$xò³(žü¬ CØ÷PÀl?^QÅ^5+žŒößÚln°¯lëçæ36˜®ÐérYPTé¿¾þC£¯ÿC£¹ÏŸH£¯³uö:ô½ðÏ£Õ'@«ÛÛ@²­.•s±9þÏCN#õÇØcûnâLþ—
"
Ètªß	†ñ Æ[n§M‡ó»tJÿa{™ÏŸÈöŽä*°*|'Î¬ö½ùŸž¾Îà€^ŒV(´/ñd‡òÎÿ¡b‹AÑ³0:ó’ÿ9­fôzÎ|þDz>‹Àªga¹Éw§æiæ5¥òa £Ä›8>‹-ûÿÄ¤(#–¸âº$bh•$ä5öòr—¬ógÒ:ß"[|Î>¿tZul‘ŸO<d}g<7\![öJ=â!è)sR òNC!îÊ§³N“}/¿â^cµEÚTÊZ+p"ÉÙ¬ÙöþÍFXýé²›1‹SrÊ(NVñßZŒR{@þ=M´TjUPó³	c4¿„ƒUÁûäÏ½Ÿûû‚þ¥œü]Sôêu¯’’wi£û
¯,5bÑÞÖ^<¸}ñàÏBÙžÍØKo„ÿÏc·3áõ½ú…¼xŒÉìñn%¨j¬ã÷’0r®Üæ•›ta¹D6èÐFT>ÞˆUU½š–a3‰n2ù6y'3'Šé‚™w½Ó“&ýÒ0°qQþáCöÿÚt§Žç×,É<õ÷ÐAåjÍÿûÕ™Î|·9§³u“€+áD…i*yWØl£Ð.ž¡2öŠy­Þk¼€ŽA*)iÆÞN¤;Òò’›ê,r¿«§]Fn6›X¢n}itÖb¶!Tœ'ã0BšSµø.NØ[3}o¯ïªxÉ%s£‘ÌsÕ^æy®ÍÛ,¤ÒÅ¿e'Œ:Må6Ôq£(Œª•×€V€‰xÃ8†“#b¨3WkŸ·ÿÞÖÙû5JƒÊ±ÿ½3›õ ©:®S[üø Ø
íàÅ‰îËŠ^yA…ýÎ*‘{åá•ôfFžãÓO¬.ý¸rPOá-ýr†S¨¾kÐ·È°º˜¨QÑšƒ'wKSóÀâu‰kÆø¿±€V,NPÁÈ 9¦?äy•>Ï¬ zëó;@êÚ­â¿˜ëë¬Ñh°#{-N4ŒéêI_¥¥ñ§EhÌGæ3cøæ;„Ðû&0uÎ¦1ÎL“Æñq¤:­(„Q,TÇ¿ÌRÃ6¬ÞŽ"ç¦éÅôW²0ä™‚lÒ¼ì5‰ülF ¬N
·:æt^·/ŽúNßtO>¾>j÷Þî·Ïz9¼àâ÷/€Ÿ!	vÏ3 Ü²àöm+¿ó žcÖæ0èÎ,‡IuªÃKŒ>˜Í>B©‘wU©¼6Ö£Î°,ÖË$‹F‹7M÷+Pd\­™¼‚w>DÝg‡É¢ø³j°jÈá7ï˜K†O›$Ñ²¥?¥3ÙS‘õfLvg`f¼ 3ëÝ8ý¾ 7k´{û û^Øe€’‘^;QP­ì‡sƒ0a¸äÈQ³c€d±XÁ²×(•nÕ7™8šº£¥—ð¶1us¯½È ®ê‡Ÿ!6Ê§¥qø_¬¨\—íÝÌ€«±*è7Q2˜'¤¶Î`Mó,	Ÿ§ÌéT!®XægÖ÷¦n8OÎÝ/_^:Á"Y”‹ý²ICøãèg´Õwj0Â$'¢@AÙ
ŒYKÐå‰lÄ¼—ZŸ¯ºF ¹½±±QéÂ2Rz1É< õº¡—?±M“Ò«ÝöL'm¯­ŠRCdF&3TÏ±E1Pªt«íç÷¦çþsî7]N8¸m’”Ý|ÅÝòÖ‚ƒ­~]†€w/´8Úôq†R„`?Ð—€i˜Ï•ì 9¾¤HrúÁmÂø³ïÕÄ`0=šI•Êq÷ôZ3	Âk7ÚGÕØÃ@ÆN"ÆŽƒq›ŽŸbë&¥vq|^T?g“½i€•xÕœÍã16ã©¶ÂŠoneù¦­t<öFIµ€¹wòTÕ* EL);‰Eˆgå ÌõA¸L›±ô+óþCfëæ?¯½ ”ì¦3ä¸sD´š
´‚VoàcÂ‰ÁŒT´¹SÐõWh™¢ÄA“9ö<ÊkÈÅ Ð¥AþN™¸AÙä¼ÑN#„¬(k¾â¡ÞÁO…ï;äžk2tö•X…ÿUR''hö½‘&H‡ð*CŽ šPl*‰“šÙ”InBjFÂçîJ^Á§›‘iÀ(ízñ ò.]SìØ‘6--šk1ØA,¢Ž|_.ë\Šeì9ã‹4™çUSX|e‘¹ú\ Ñš(“c^î£7¬äå)m Àw2í¢,¥@Îh–È¬ƒ™8«•öd°v0Ä|¾3fS'žãídxÁ™\MäÕc029˜ÛùŽ4¹=Ðà½à'€Z ÖÌgPd	GÝmÖ¬dd4µwã¶YÄ%8wPd@Õœº‰ƒÕEátßŒ3º,ÐáiàßðÙ±¡ë»xÉ/´Bòp4ÅX‰†¡j@iUÍæÁ,œÍÑd:Q
Ôš+ ÒÐ;À£Yc.þ&™™kÑLS)Râ*‰d…Éô@˜P}E¨ó…£Æõ°i8„lÚÉuM€Ø`Š°ä8x[¤gt¬iŒµPGÉ8Fþ@¤mêXP®é>tãjEôÜŠš¯æó(£_l¯.U2denÂúš›rëI˜x làB3A,¾	(¢BG5s[ÌÂ`ð²[ÓD§q’tM,á­äõÜáøºP³ç&sB +ÒÜ2Û%¡U9×x$H|ÅK<7>ØS\"ÝÜéÖÈ¸ôCT	÷šíÁ×ê{‹vS'³ÂÂ‡:ûFÇæ-Ò}o@çÃëŸã¶—T÷ì7BKãÅùQs¹€\§tÄ¿«Øk¦°PÑ!>åy~t %'¥§9Ž¸œùé3yfÏ?]`?ræøã·tþ·ð‹ßH‚×‘!§«â¼ñðñÛ&Îâ“lT#¹š0Y7î=Xu´Áð@!Å³²• š‡0S7ÓU3ÁPÞ8WŽÏ¦ÀL&säœ|žMå¸Í!Ù¹Ðâ–ÁÂ»€'MIÌË·ýã£.¦Z ß]„‹B>Q‘#à7ñ«æûvÅ÷ÈDŒòPÚ,•p­…c2iâ“jKl6,gÈÚVƒÉP,ç¦Î,öni±¡j6ƒ¸X®=7âQÎSWêÒHK?T4ö‘fU]qØN€ãW~ñf¨m·&²DQ!ºèëÈ"Õ¾(µL+žT¤>§¬³H´„(Â@«~Úy™°2˜Ãh¦¡© -ó ‚Ã}`o75õÌgF_üdÔR½H‘©Ê*óùóMN›¡x’±ã
.ÏxOÆeÚ&¹:…°å f›jå˜Å¹F;6žöÀèô¶ëhøR…3?/CØ`ww·úí6m^Šøü<Û?×Ÿð¦v«:äg›Ã:/ô«_<÷šÚÙO›6z0%Ýb€{ˆŽÜ4âÈÜÿˆÎôs ¢Eé¿2÷cŒ	¬èUüüéJÕ;‘÷Ñå×ÑƒfCb~L&ÉŒW%Ïƒ
Ì+™n–E¬é€ z…Hr&æe_X1(…‘˜Ã Lß¹äp2Ÿ™°r|~f2´<Ëp`°70q0¾6†ªžÕsÇiÖÕä¢EUÊc‡tÌ©òu»×é—nÒ3bØ¶à)\={<gÀˆwŸ=°ûÃ±GøÑCÏŒQõ.öÞuöû½Ì´¼¸çÝK'ÂÛ¶©‘®þÄh"‰æÆÚÇ¼œ\öžúi®¸°²+m ?,»(SfÞ§ƒæ¨Íé¿% Šž[mç´Ã[K+ÝÀÀZÆŽhžíÚ’ðÖ61!1ë¥5AÁŽ8Ù>é{9:ÉìH«ÓV?-ä‘eÊª.ø¢w'|1*"ßós>¥;¾‹˜ÉðjEƒ˜ÈÐ~Lkä&’ú_?FÀÐ4­-ÚY¨~[e©ŒS7e£ñøÔNÍ4+š >½‰ÜSµF3ô¢ìY¼,²Üw³sàÝÚî·Õž•¯16 «ª-,@AuÚœþdà^ÎýÉ¾¿„UæÌ{–e{ù7&v×ô„ù8@xàåOLÿf¼çV¤–Ü÷ë¤ÀÏc”r´óa)€ë9_Ü~;Ž‚œzb]!lHoÀf³žzd{½©ãŽ´C?7a^B\Ä˜ŒA€ ’¨8¸ÕrV‹ÃÉ³àå*È 8#ˆ%°8n¢Ž707iã•ë5P@dŸ²ê/^<GÄlÏAô#¯Î½ ‡•x“Úõ¨oXÇz„˜ýSÂ‹M+ótµe]Ç{¦T}n6ºä§w\§>ÐŽùÒÁÌ5×åÿ  Ô_H	Eùàèþ1¥r•ûˆB“hÜ;ö@t³·šÝÚñ¸½¡÷Ï:ë5Ï@‡’æ³À›•7Ð‘6»ùóÏO7¶6Ÿlml=ÙÚÜÜøù±j%ç‹SÖ¢VXuïà„õ.Ûý.]›Žp†%D#0¶ä–ª=qgŽïôÜIp(o†ýó²¢ÁßæÇz‘ÇÎ±s3·€ïpù ´½—ÍŸŸ?Ûxºùtkcóçí­gªgàÝ©7ø~"ˆ’Ñ¡9…ÇÓü“¶â.oK–Í¼q‚Ï ÄW%g`›µt€¦Øª"­Ò²d{îtæ‡7háFy“iéœó‹V_cªdª]®tse¶¼M»zþ@¸ˆeŒKÈf%ãÙìœri[L'îì·á}'j(&^æˆ¡{‰šš«œa’¯íj¥­"§­añeÆ’£ã´‰?°
¨vÁ°®µqa[K—7™¡¾´q³(.ß‘…ÔZû+]zƒ¼µÅ×ÄR)ÚNÛ–ˆIÅÚH¬î«:³´]Ã<m§}åZRÉÃ¶}èÂxå‡—¢£+cÌÔI>à!‘ÇOHØµÊ œ÷
·L£ÄÁ7§þ•'SÅêÕkoA“ùÒ‰·ý8äIB}8§<2V{1º,]Q'}JŸìÜé6ñ4ãP½ü@[oDŒ\ø‹cZü4›M~@”yÎCóÌ-W0'vðŸ\ÅÌže…°^ç6³^ä®ÍÎ˜{JWàÌñ’Þ’Ñ”ö•ìÔrQòNåy_zc!–ó°&ýÓ—òÌ¹L¶¾J×® üÒKXP™•,¬kˆV6~ZT3¢²´¨ŒCø¸¶è¨­„×Õš¥ð­mx/°‚UÍYÃ\“ZSœ‚zhœ«Úü›{*Z×š0"=6åþƒ)z4“±p£åéågóÈÝü ¶Êr¶ˆ|—’PToh ![©»0°ðÖ:¢°¹ÒéÉuÙYèÞO<vÆâbËÍ:£Ú¥ÜR™Ðff×Ì6·Ò[ª7»Ã¹6M¶ORÍðŽè®
p»»ñ¨Ìú¢|³Æjõ æ~óî,mS<Xál†ÛlðhÆ´ž,ï!O#ù8Äž?~ž¥Â6Â›x•w…g-ö;%”ÛqÊXw¦ï×¡TSÞnúSÃ#ÝtøG$ü‘imÕ_•E¬MÑèG—:Ôp´€Û‚ðý¤Þ°ß>êœ´Ï?v~éœôóÑ . <@Ð˜ ·ñZ^˜§Hu½$ÒâH‚á¦E¸_à‡ÑJîR3§¼:‰Äoö©1ÕU4‹†°Á8ýç&ÞçbN=ó™ÑÎÕÓ»“ïðó&þ8ÀÆ©ƒ±$|ëls£Û(£þPžÞ“Nò©›óñQøJ¦„’)’z‡¾uý™æ»Ç%JñÎ|h¸h]§
Dä†‘¶‘ÆFÚ…?Z)%a—ÀŒÒŽd“ãnYäGGƒY·7T†¨ðŽŒÂ{!ªNêZ¥=Ú©3tY%m:k1åMä4ÕÓš^gº¨~ì>eÆ¨ÒÝx-l—‚vM¶³†Ú•¸§Í;°ú%
Ñ/x#ë³Žçd5yN–²þò˜3¥9îè}Œ¼`X…ß8&U4ÑÓB¤9ìŸ}|wV£Ó^ìŸ}ìŸU(:HÕÅ1?ùµ*mT3sll-H-j(Ë]Ñòê•ŽÅYàXœéjäg›yaiÉâ,O¶Má-Ý‚2ŽE*´
»¦%²-Xö V¥§«dø1^W'éJ–)¨¦¥*ƒsº@‡¢Øë(œž‡\HËjÎ‰Y¥n‰Ýàg3×®;9%¢Ö?þ˜ÉQñ)ç".Ô;ä­”‡ò÷åãÎSq•×«5GaÔq@F¨Æ~˜Ä6Ÿrs0¦çUÊ!‚†ø^õ¿Ê5a,‡NðWH¹¢’Â	bJK ×¶XAŠ:—`Äºw¾’SÄù–èø‡<®¤N²àâqœò-Q´ŒleÑÀË2C½³khÙÒf©4ÊÅð+ÖlV–™ñfÛ´1RCø½ &<©Æˆ2–¥0Ìlü¯¦rÍ¦JZ&Î.œ'™(;ƒrùYb‘² h>ìAŠ/K3"ŒxL-;Zdc|J‡Ö%|¢j+–&äçì	øZ¥7`AÝüîìc¯ßFà ÷^« Üf™öPVTgÈZ“Á_Fk'Y·°4*G[©ùR¸”{‘‚öÄwæ	NY48É4CÈG¦oÕšŸzbö8šÿë_7Ö©Ñ”ìú§cª‚wie>À¬j úþýwµ`:v ·O¶~(ñ$Ý[ÌðŸ©e·=áÛaˆÊïQzL7Vp¹âZ¼^†Æm-ç«Ç¾7p«u¬ž¥jñçzŒöœ²®3=ÛÌ®å‡8JüÏ²½æmtb¹r%þ©ø¦Øií›ºˆiQñ,¯2Øœ	oI×Ååi:Hâü¿æ0)`š®L³#³Ñ,ÿÄB¶0WTÌÆ¹èUVÌ5‰sÔ“uëÜ™^³+wö¼3ËnÐÎ­î,œå7n‹czv`9EéDyØzŠ­53ÈjKƒ*±!Š6¸ø¨Ì…’&Ù±ÀðÄŒ¿xí"–hƒ¥x!óþ`a. 6`Ð\>ˆ§$tÇ¦Ú®ÈcZ«Š“&Ø”Mû¤"šò`[v³Æû9ece•u”¾Meå?3`®*‹	‚Bº)Ní‡jÅÕ‚/}®¢{¥R!Yåøôàâècû]ûí4|“LgC7!ÇÚMåÊJòK-ãñ¯åÀŒB;Kò†úÙˆf$’‡*6#Cú&©œ\„Ò&~ŠY¨ŸÆ4¥Æ¢¨¦š¨¬­<ZÓ&Ô#}Ý¬¦JU ›f!‚g}P5|ÏD®eYq3Õ`\—Y›´òK†ûdýQ²èo¾_ï?‡^ËdÌx!0Ù&vTB¬D‹‘ðß°0È¿ê*èûÔúX–B_œg,H±B7ø® ¥ýž°©¡9ÌãAÞžÛ¿Â¢p —Q‡¾$äÜöýðR‹±äì}¯`K\qÎ4û6¨MZÌ“Aœ„H¼/.™®whë×Ïj™ãž"mUT³jªR3Nä¸JÑ5~Ð˜¨™dèìN”ˆÜLôæ¥|ÔŠt«+´AÞPª:1¾¦Úvî<ÏVÃ¬Ãë«9 m­ç^À¿øNìà·sç’^:S»ön>u*ã\&óµ™Éb«ðAÆDRµöÁ2VúdéT¹3S)Áb<`933LðKç[gŸgÒ¯ŸÝæ­¦Ü¤)í¥™£eD€; ,¡ü'¾ŸñTM°Øpª®ÌPj7j¥«ŠiTRæa)[Oto Wì}…–ó”ñ%Ço¸äø—–¿Ð’W>èU[+UÅ2ˆ-•/ÌÑŠ%V¶olÛ¨ÀÏÂgÇ˜\Äî VQ	k*ÊÂ²^Ñ‚¡²¾€Ï7²ûÇ'xó3lè/–3&sc¾ÄpÓ„œMÒ!"ÿ‘0M™æã.ui3<DÙh(¥·¥Ú‘p­À°l»¿ÿnÑTjš-Ú¬[³WÎ”ÒâéôVÌ|Á~Úa'„'T§ùyFŒu3;CCQÎQ-oÊ’0YñšÊ¡R9¤æ·Ãk5k×²„$¸âgêÖþSó“Él…MZ¯š.Aï/T‘Í»ªÜq )l£n0™1|ËA„¨m9þ"}7ÈCwßöéÇo9ŽÛÆÆ³ÆæãOöÊ`X\óÈAõ§­g™ê´óq„Ø>~ï‡<»Fv`µÌ¨,¼VÊªòaaE£&åCxcÝ2^è%…á!‰/<	çîè!¥—T+¢nE‚ÒºÕ„E˜¦S}Ä¼ìi0¥À“J?U3{`!ø²d3—×ÁàaßC©ß.8J©1ÇPSî$†K'rÕdË6Å»þ<#À‘]Ô%Tß¶ñáÏŒˆq:à¼GÒ‚Z 9q$›k£…óÐ e2;:øVÍp‰­)ˆãy×ra`+q‚ÈZkOBæJp“&zÇT± CVÑt“‹Š;ræ~ÂFŽï££Êšeå»)søCYIZ’2¹C
Ò-¶mzâjtðZ4WNø1iBÕ+¢tÄeô!›)ÒÊ‚úw¢‰#úšÜ|ÒQ	eÖ­œ”äŠÉ	?K”‚Oiá'w‚¥ÙT–ÜÔs;Ùé-*TJZÂOtµL8x«­Û¦’ðÒéfª™
2Ž½¶¬ð¹LðÚ^ÞÊ€ÊRùíÞô‘'‰©CRO…ù»–;¤NÂ«+ß•És³x®oJ/>—GF;‹å#Õ‰?9ÿê\2Ú´[±ö‚]Y cª(ˆËéHóø,ðá›Zs-´Þ,»>NÅäo§]Êv/¹,ô¦5M þÐŒÃ(©V:»$p´ë}<}ýñ×NçÀ7t¿žŽªN5ìo.Ï9‹&'Çsk¥˜Tœ$=M[nt¨)E_5	3\i	šPØn»#¡„>T½¥¨D4Çie;Ïdj;f: Ó|Óíþ
ú1™š„Éf_"qTqÆ!2*¦­¦m“¡Àó6œG1žª‹ÿç
¨MÃàvÛ€ÚÓzø´ÆþÎže<1Pß4F#jaˆ/ÊæÕõü8ëÔ°	-;É¸I7ÌT«ª"Ÿ	€šÖæÆÖÙó§7ðo·¡~UÉŒŠ>Ëñ'Øe”SÚeJr3™f¸”ÎÝåŸ¼åòn¶°â»V¾§=ìN±"›Ø]¬b÷²‹}ËØlc÷´Ž-g»ƒ…¬ÄF¶¼Ëåêv²ïf)[h+[²•{XÊîi+»§µlE{YV†ÍÊ½¬f«ÚÍV±œÉk9b‹œëÞMhËÑV3£™õ
Ì3™Ñ—[h2…S eúy°ÈŽõÖ5 ˜–!ä}yZ7	Îz°ÑÓw¯Ý4¸Šq0Ã*¹«¤á·*<kÙ)8A0wü>Ñ“nÜÄ6^1›K*¼A‘ÐÍŒv£êw4@ÞÛyG#d¦ö
VÈ< p¯ L]m™Öº'¶\ú Â¤7¸§×·ÔJÄ7IäÃâ ªb(½òGóÀûç\þFé°ç&*Ý#È„*Å6š|6teAÉÖ¿u$Â/=®V™}Ÿî)•raV¬S2ÒæQ÷.)^~YÑCÃ¤Ä
D€ÉÕØÔu1ês> Åø7l«±ï†®È†×îP¼yb ¬37:ì¤6>Íåó)Ý¶t´­di#óÒfæ•Íw35È’´¨&œx\áÃVñ†îAƒÚ©0]›à5S7”} käFÞ ’Ûyè·é}‰]ebÂ{p-önîß4ÜæùH³4ÕÙ;'h¼›®ñ|Ë&Ê—;L·
öâ³»Ãž¢þ¬½Jõ/ÚÍr¼
WzVz«d>©ŠÇ¡</URÈo tØ:¾ý”‰ð‰œ:=½—kóÁ&µØK;P7·ÔòÖ”ê‹¸…$f÷o³ÂLnE»GýÎy‹uG É¬È{mÏåy'ÆÖªO½˜ä.@(m.<ØpVTÐí»…r
,¼(þ"n%mä-¾VÑtE;3n¼UÛ`_á	¡‹×Ì8×«ŒŸr]æ¦‡¾ãÂb-–‰Ì4ÑFY¦‹â©Œ#Ò__óáh±…>–}ò§Ÿ
ÊÚÑ³ià^aåÌ®ŽÜŒ
Þ¡”SãfÙ[åw%¯ ìØ,?36ü%ž¯§m°xqQU0Œ²˜5³mF(]Â‚Jœÿ3íoÝqb[÷ØÖÝ&–\>×´0;óXE/Æg81R§¤®¦F³Å)\lhf.iV8+„:ÍÎ„ÚRu3
qz­Ž…Yi X;:b¼/sŒi*W¶=F	8ÇB&ï˜lI˜.¤à†‘7t}/¹ÉwôÝÖÈà öÅùNs‡E1×cµ“lcÛ5äÞ_ÉÆ¸nÈ.L­ ˆ™®’d63ñðŽ¡ª]Ä³bï_.Œ§˜ö±@VªçV:MiµõÊUyÍÌQu×mµjzl³^n~/rÍl•7SÕŽ<2Ö¦#§×Êhöæ™‰	Àz¾s¶0ÁfPÐh™€±—Új™ó6K©03€^§ëÌyPfOÑ\žI­ìk‚©–_ª÷Ïb)Ûã ZÌšÁ½.¬ŽûÙÓŠ¬O¹l‡L»òGÓåwçÄ53Mà&SŽFH¶|@zr†¡<‘ÖÎ,f²óô™è ‹g‡ù ±†ƒ‚wÉÌòâV¿(oÄ¡Ô£3,õdá˜‘LL:’”r3O³¸ L×ï¿f’À‹&”²¢ÇòœYÕ£wu1—\ít¸”Ãy²ÂÐ§.OIu›š“MfQMÎú'3NÝõg“ŽR3½X,Æúm[¤h2ÿ<w‚3ÖÅÇkMœ ”dVÇ´‚C~Äú‰=®p~ˆjj)ú©(cÇ?è·ð½‰‹´ÔÅ…uÔ”K[Öµ(Js¶³íÎÙg¦á\þUD,VäÔ¥¡xWYgä-“Üñ!‰ªYÜÒö±Õ‰?÷'9Á†Ò¸æ£ì©M³ðHåûâ+~–ÄYšÐ²x‹ŸE¸‹Ÿ•ð?«á0ÆB<ÆO‘`ÅñE%Ž
¿x`zBÐ­î>ÞÐAVG:~qaWº˜÷U‹láHÝ»Sgò½8tx¥ÝŸEáÔ‹‹nF1ü¬ÄM,éå9LÝj¢'îî‹±Û/bº½UâœžÍX¯#N1²ÕÄ¨õšâ‘à
º›€8– „éÜ€Ê“§›W:ÿÀÔX2ŽÂk2Þòy¬µÏºxM5{ãâ5Ÿâ
·!Þ7÷5Ù™'Þá§_¢Š[Á²±_ºýÎÇ7ãîI÷#4ôñ°óÞ­ê_¼(mÙ'òPx‹µ81fO˜‘ß„á•ï¾qƒv”1•¼>ìQS‡éIm¹í¨ÿ6O)ULŠæ³(œ¹Oxa¸
IgŽozí^ÿ¼{ò&½®?¸ K3l[KK›u3ÒªµÏÏÛ¿™ôŠ«‘«R:ýr cáâãÂ‘‹¥pfŽg2Õ¥ëj›…ÝËª¥ X Ë€EL4•¬s±­òyóYO>AË› óJ½mŸ_ôðX]b	,êå!òZìÇoUÅZ^©‹²ÄFF×–¯ñŒ×j·Ÿ
z·,†n‹\vº|Š‹ÊuZ5¬@Z; {õXŸÉŒ<ž¹±7ò&kE3¶oTöž#÷Ÿs/ÂÛ Þ¯©uÇÌ<xÖ>XZÈw–ó<Îv¬w©Ñ!vj!1|¬QOfö(­K½3Áÿ°ED+ü+y~×@õr›aÄ@>ÓnÆ)ºí!9Áþ0!äu/+`îÎØ÷ØdyÜeLi+i#`V=TïÝhèNFZ›ªéþüÊ‰¹Ë‡²ÏÁc¢Cuÿ¬ô°h>ÇØ…iªý3­á3x6uÉ5ï|v‚+Ö;¨3Ú³ü¦Ñ%Ò¡D;·uvìÌ\Þë[7<æ×£,C«8J Õt]€i4ŸÄ@ëêÙf& ó¥[ÇÝxK‚·‘{üÂò)
,39­´¥-­¿—zÛ?ƒm;ºt¢y3íavvw «o§8}Ø¶‹`}iOnR’þðÚhÖ4ñFuêzšÃš3ç—<gÆ¯8ô@Ì€áWW€U­É…_Ûïº{0Z4¡ÄjÛ*ºeC`±Sæ`æVÉ“x¥ÉÞµOÞ´OØYçü¤ý–¤0öAY5ÛÇšÔÎ“ÙÏmã9Ä'à^”dÐÙÒ J]¾HÂ¬ðR8kÀ‚ŠÆ	*–ùÉq|ÊmäÆ3øâ¦™{¼&Þ–åÇÍŒœ­i8T …£"¬ÛÓãq}¡=÷º’ò˜¯
”ÊÙƒñfä]áV GpìMÝ>mkÙ‹¹×êªTä½–”û,Žãhí‰È×f*“Â¦éSKNx]Ÿßá,{kò+ gkßn×4ÝX+ª¾7#wæ;·ºþéÓ'õú•W§7ôëWüYÖg1±ép«š§<Ïö¹a^kízéO¥ÂãsËã’À0–W¨ƒ	¡þša£­I$r­ðËqŽèpÂáÍqÖîrñe˜vÖd=Ïwzá¥Ã|çÊÓ”‡L28™6­*©eYªŠ´JuCçª³Oé¾rÆ²þ™ (m þû©Î,=XQLfêTÕîŸ™7‘Z›RÐt’Y'{ÓA&3‡¼/{z9‡í ÚgaÂ®àÅ˜»L4ÂëD<Ò´Ó¾!é,d’Ñ™ýê×%(E˜;à´»U$ëáŸfì¸å>~
-MËN/Q°…D(P¦F ‹«¾Ô qv¯²!“çå‡WÕOÇ êúÀœõN$¤NôÍfóSjHïi­f-«YÁÉvé5áhº¾$â¡¢r,:R'æÑ@5mC‹ÎÔ…?h½@³‹l‡XEŠ-	[:U‹_†ší'ê@'h8tõ$O%Uc1¬°ÏZ%ÄN,#v<´õšìTÐ€"AÒÚÊÉî¤¹”„½n8âycFˆ$#u•p¢'>Ó÷ø<ÃQÞÄ“öEPZÊ¼ìv›Ž¥žË¾br~ÑRv•ÌeLè¯ŒPæ2ÝÞÁJ(‹<åBœ#@H4¼à;‰7vbÏ'ë•ÜH& ¤2ÀËÐgqÙ­+¤‚6+Øç€LÓ™—A^3/<ýY_G	½wÜ>ï£×å~ûhÿâ¨Ýïžž(
NÒá­Í§"—ÀbÏèÌê#„Í)ô›¦µ–r™}ÚŽœeij³âÄYå‡ðïl”Šö
ÙÅ)€d<íxêks²xÆ[°ÌhÜâ$_Z-Š_45.F :(	Q”ÝÛrZ.¨Xª¸D°âªáŠL§_`É0 `°[Þ¸2£ô_Ñ,½²aš8jÝÝãÎQ÷¤ÃÞtN:çÄReˆÎÚ(²ã‰\SrÎzjƒ˜”Kâ•Kì•
uVÈ$°s-®¦ôi	€öåvwäN@ëçª)hý0[Ïá³3¼Uè¶3Ï÷Æ)+ž¡òƒ¬Opq#OÑ%yÂ¹7•æ]€P4mšG.¨SŽú^À=DÒœ4*Ö’kÌî}QŒô4y˜àÝ)2V.C–¼Ñ¬Ç9lá«qŠ¨®t&:!eW~0˜OÉíiÈŠôÉŠ9œƒ†	¼~
Ò¿|>E·¥¦Ö£â›eßè2ƒÜ[-ÚUö‚ÜÁ-”ýTËÄ÷¨ÖPŽ`(YPÞ¬lJ·¹ªV"~Î€tNZ¬fÃÔ,øä€# ¸Š•81RÔBë!~úoÚ½–0wÊÒæLHctâ†úÆ&î ïUnûs«5z½m%ÅÏáéI¿sØkÜ”ÈÁ¥Ü[´¥»j-S“/¡Ú‡­K–©òn>E¸!ÁØ#ä£hì‡ÝÚÀ.±h¬*,QÄ&cOÆÌdMiÐ”>s1ÃaàÔŠpÐ~ÝoŸ£‚Pí´àoÍ„GŠ8H$†‚gMoHBÅ¨™Ì —¸e°ò R»-î«{ÒëŸ_öºf ³í¡^€Ù'dDN—˜3®^§ßmŸá ’Ô˜Æ?ÀêÑÙß_zÀÂ€·RIÜ¹t³€Hªµ[UÏìjì3ì\ 'Mg>úÓ]l7™ô‹iƒ¾pœ¸Bé!7Û‚›œXÛ!Iðdo‰qÚ ¡ì„âÝ%.JÔ–æÍa2$×¼¾ÅÞÀÂ“ðí‡“W4ò¡]#­°êàH¿Yg[uÎð1p©Ödoñü ò”òFG`Ú09>ÊiÆnõ pd|â´=Mç°´Â…7Fƒ+ÁŒÚ¢-¥:¥ˆ©Eü-þøÍ1¥‘p(cà‚ È÷COÀÙ¥ÀÓ:« ùÚ Ýã¦‚ØÈsý!tç‘´ä¦Öþtîyóû$& —˜?i²óô@q[˜œ<óÌ˜uÃ2·:Cgnâ &ÌºCŽvt
—G>7b‹=^XäÓ}Ê„æÏïñ³àÌ¶ü¬vá‘òr‡ÊŽ•—æòC6gÎHO.Ž÷:çõÌIh÷€¯X‹þÙZÙ)*~ô?Ê‘™]	ôÏB€4¿xúgy@ê¤&ëÁs¨Hm!ŒõæjZb!;À“§œI®•ÞÕ”~–„~È‹ ÀÓÜÏ3ëyu¦ýÒÅoKÆ¥qœÎ¯ÓìÑö1-:EÏôgÎ×v6~[ ³®yDºvW°]i’CczæJ’{œžágé4ÑWÁ)šx+NÒr Zîh­°šyÖf‚]ÓY2ÁÀü$ÇcòaÁ×¸¢U7Y‘ Ï|Š3RÈnÍ@Ì|:œïjKá-‚' ‡©
Nðò>ÖâN;¯Ógmž¬ËÇ™‹D3Ö4@q€.YDS,ÿñ[~Jö—rP‚n]pcQæˆŠD3ºñ“†o»Tgõ£B@kÐt]yRaàÈXÇ ÇŸwzG}¶×Þ?dýSPAúm†šÁ~ÿâ¼Sh¤/¾jD³ÖØÔwŒ$âyä"zÏ	~s¿‚4Ÿ&IGz ,~Ç"&ÄOmùêüöý¨©»gr¥–£p€–~Ã?ª¦ŽÁÙŠÜG^ÓjèÃv2³zX[Ê	{¿Í§ÈûZ X³§øü(€ßTû±Î¼Z”#ÊLx2[Z}ï}(Øˆ`C\JyoÙqnsùìJó×œä1|6Ù}âsl	JË*8e¦P;pÙÐûÆu9Æô	'öÄ	—üüŠËF~4tÂÖÙ±5ûAäN¡è	û;;Îœ… —!cõ(üy	E˜÷ÓOÖBjø y¨@Cø‰U±vÁ³	l2(k+PÎ1Ûe' Lb0ß&õ‚7O¸_\ØúgßqÀ›…#ËÙ©œ!Þ2)r¤`RE4"ù.´
Ò¶
#ËJ/ÅïöÔ[}oÃ2Ö`›ìÜŽÎV èþ<ŠÃÈÌå’å6ÕPZI¬ìÄr¶:Ô†Y~¡ÌxàÃîPPY›Ó›
ÈÊíªù‚äTfú3LüRÀtšu}Ê?©qÛXiåvTAKØ¼4ý·ËäâEf—|%.¦kjš¤#£ùíT…ÙÍ´ÛÛvŒ^i·*Ês¯\dº_|Ç¡9åØ¼Î—Ãkqœ‹ž£¨=À
&w©Šf€ÉÄzÖØ£üÜeÑñˆ´n0´v¡úÀÈàûvDW!¦á-ÚéÜjÆôIÿdK½¦>‹ÀçÄ±wd®›×†-°9í¯ž¤l2ÅoLR\&L	?\Ï–veÂðµ	\N‹êÆ×Å:©"ÝzÞB+hGd([ÜˆãÁ?Í‘-ÅuVŠP*K¨°êuÕwX ýO¦ó½4t/€Ëwî*½GèW.‘N›Î²¡HÁu‘Ô»¬XkTß#xyÙœ%?(ibKôŠ’&Íµ6'«mÑº§n°þ;i1ÃGQ\øXW7$"š7óxà‰wÝVÞñ“åôd$|U-Hºb¿2'?ÍC'ïsÈu±B÷¿¼¯_‰3PÖß/œ¹Áq8œûÂU'Œ^‡‘LªhMÓkÉ9×]…‚&˜v«øE¬'ý*¸«D$«Ðú•'0‹¬ÏŠ–³®¤|eøâQ§ÅQµKÅÔZ÷ð4Žv±g#Œ´«H‚¾- LS’†6N¸u²/!{H°OdŽ1‚fãÁo¢©ÛO%Û¤q1µ\¼÷“‚Üb™D™‚×
qç‰ÑÂbfÅ)qø§ÐlZpSAùÕ ©/¯™5]¶Ø‘ÃñÝ(©®)çò®qt.†ì¤: PáI¹LB?œ²¢ÓnéŽ7ô`£D©¬o3w9›>Ÿ™‹ÔáôÔœa?œy”ÔlÈ(€+j+€—Ën›Œ£D;’MÌ£áöŽÈÿ‘ß<ŒÎ7U‘²jtŒM“¿'6T[Üðþê[â¼–é¬#¹Êê=jfiOxD){TžPr?Qú¤j[’¹l_Ç7-éÔi3Ë•Ê.h ‚’ÕõZ7PGöJoìÏxÚž¯âýÆ‡šž¶Ð~?U­ÈIA¨&óúî…!šr3+ ò0ñ´™CÝŠ§÷±,•2@ÍòDé%ÉébÌéTEg
_Í3ÂÌ·™8¯Ç	©o˜öG5óš#žnV3Â‚³Xg´?ké$ ¿J´W}ó•Ú²¬˜ËÃ&WÈŠa9¹W 	ù?Tü–aˆ·©«K-'§âoº°:ÓÕËkû¾)dOö©•Ûç[Ï/ž{]­Lq?"}Wr7Œ`è»{s"]’iÑAÖ‘éb–tV–SôÊc'æ¹ÅC¤6‚Ý2În¡5Ý>ÌdAÊ&×yòný’e0dnÖ;þïYÆÀKåÒL$ˆ¾ÐÑ<ÐV™Cº8Š%v§ûãÐ`^ÌMºþ}«b,û¿YÌý7 Ï$ëÿHÖüóGJÖf“‡K?”œù5j³º8!d…b!HÜÏc5@\PÛ¾]aÚgÆ´\ÖBÑ3@g,—"$g'<×ðfE¥}ãìî°gHü×Ë¶¹•gˆiÙM£ìÓBùHa	¿õŒŒc••d}ã²‹¨)Ñü+‚BtºÈÝžïxŸ
\ì…oªLçùã75ÛL˜]©Â5u¾ÒÞEÐ%‹;ì©Uš‹‘ÖYfè¶}\ou‰‰áÎ-UùÆ^2;^rêN¡àÄc¸Û£
¸ÏÀ	œåæò˜¹õö b{è%èÆ·‘›%¥'á³¥ÁµŽŽ¯ùš{´¦ªãñt‹Þ!-¶&CNgQˆQ†Ífêv«i©CA2vðâª`àú> F¾s…éâ#7Æ€Ñ0‚2ð“F+wËk/†×”²6¸©5/íË$â!^ð±Ãon«.(&‡L@P°.ËÈƒÐç[‚ Ê§‹®±ƒœxdÙ·ÉÙj¥¢fm¿¾<˜è¯N´|@QZCûÊá”±’TŒ4ñF‘3û{‹*Ÿ­*ynþþuÓÆ‘»5Ã8¯´Ë§ÄQp@Ï!$ÅM[g–7½÷²Î+Yý"N]ØuûÐ?‚œ`£ÃMÖIfö’ü¶ÓcÓ¬QjÑ¨þcøSm='}ðËO©¡šnäPÆñò½qÞŸÖÍË	ÆráªÐÂ«¿ÔQ[pÊu^`©Ò«G<[‰9ÂE6£ôJ¶“ì Ò©¨¡hýi5­n¦RÎÈYË=õw{ì©|¬=L7b¾™åŒvTpéRìóÚmÞÅÉrŸ›±x+m–øYêBMf›Œ>zLÁÀ•|t–5ãÚ]ž½È›I!*Ÿ°+çrŽÜŸ¿XÓ"%BÃg*îìŒzÛ´õwÃM
>â‹ÀxÔJp»ÙÙç½£:;ÃºÁdîE^v˜D²¾so†¾/-21Tz8§RL¥F8xÖ7fÕbÿ ŽÁ×n›ìF8I0Z6+v;”8ÐýÐ›´HpIF@z\áåPïs›“ƒa•0	Âi	p‡’Ñs?å÷ékŸJ6&Ý¹p¿îµ"F÷Uœ¼®¸E—[Š–+»Vãg%÷jÑ§p±ÖpÂ,–Óms•£N=K'oO–# 9ÎèN@æžïëê‚í¼í_ƒviÀ"ÌÑ0-ÀÀcqn<!è32Š®JÃZØèßØq»×ïœ³³óÓã³>ûÿþŸÿWÆ^Ÿž³óÎÉ~û¤ÍÎ:Ç{£ö»öyû„wNÚGícV=?;®±7í½Jòµ×9ßk÷º=ÔL<øÛßx*Ã$	Ht†”’ñÑ#àDÊìÇÎ¹b’c 7œQÉà‚y4g½ƒõã.ÎaäÆ°8 dqYs*öÙ0œÌ1e¨ÏóFs ßO=Î•æÉt2û•Ë¼†¹ ê`™³Íœ	EÀüç4ªtâ²co ÛE8JØ¯a4D½j†Bï$fäü>}ŠËÆè¼‰LëB :Bèô(CÚÉo½‹øúÀþæâ@ù À:s£)&ü›guNj›ÛÀ!Ç0YÓ}ôJža8ÌyÔ²¯ØA§sÆŽ:íó“îÉ›Õ{ôè90>h9ö0¥ïÈóÙÑÜŸÇNðèF}n·t½©8<	Þ!ÎýÚáêÆ°¦3ÖŸ;d¿!d±Ã:1F>laÅk'º‚²Dž<X-ZßÃÈK<Ô®C¡ÈuDÔÐŠ½;}Äá÷SlzzdžáƒØãLáçs,?
Ž4m˜†³™ÙQJÍjÏ&n ÈåcMFs¿Æï¦Î°²zì:ì`âÕ6 èÎÐ°‘M½ú.¼¡—¢kÜ x³Ç»fÕ_ÏÞ%ê9=ž\.=JQcÁ@š±èYm0‡nïæÔŠPü9Çàt+&Ž…#oŒUg3ÿ‹N‚ðÞ•‹w° t}Î«¿&±šCäŽ0djuÐnìPÂ¨À0Ýú°áËC4dW &c>ÕÇ°
¡u0«áK{ëÐ¹
¯@¡®rþ&ÍH[ RÌPŽ8 ±LÝŠ`–Ð¯&qhê%‘“5Ú˜Î#oˆ#LœHþ#²ŠÌ¤pÄ@,1ï#ÌûHœ2ÓØk/ÆŒqêÓ~…>ŽzÝ†œËÔ8¶ž!2ŽÄ>FÉÓº€$ýÿ)? zl½ÈzHèÝ“×§çÀj»¬Gálì }ÞEªóˆª¢ –„œ[gÒS	·‚9H(]7/¹i:ódF$a•îHÝ.4~zÔyËÞ\œ_|€2Ä2c:AìåZ:¿t¥†lŽ³•3Ý“Îì\»÷ŽÎ<‘­Ã?O+X]f ]ç[Ø5|72U‰­F#å6«–a´z€‘ý‰cŽÅ8ªE@>ƒ>¸à÷Fl…@Ïä¤?¨Sœúô’µŠRí!ð¥=°Ö˜*Qàx[„‘zK¾ç^R 6%H_i¸}g>RpÔÜÝt$œœ²^y™ŠÞIÜ¥ÅFè\á>ü‹‡dÖY{rYˆÂú!LZ¬ÁÊ#’·û¸Ýðì¢\Š œ¤¤'­À=	Aa{ºh÷ÙÙQ{¿óöôè (0†7‡m¨Ò;=y¼ÆHÆÙ®D´÷Ú{Œ²žÒÂÀÈ÷S'žOðU:>=BS ¦á…g˜ý¤ÿÀÚ›‡óéô¦	XG›¼h¨NugÌƒ¦c Aß	ê,š_FÈ°¡£Ã³¿'nž`‚XÉ»tá@Ž’¬^x,ú`g.€Ó‡¾i¡ßáNPF°K“ìPåÐ² T©›¨Pk‚þEV©í'Ø)Èý½ƒæƒmìtï¼Ó><8ýú½xwArF*`÷*k#¦‹Kùð 1LÜ@)fô¬ð°CI ã‰ÎàT¦Z LD‰e”ª˜ýÄ&tçFŸ£òO”¾ÁMHþÀ°¿ÅÞ:‰·°TðDX¬+Ãï`›áâ%§ ¸‚HƒxsÆN/@Úa 5Â¾KxÌø!€qèmÿøˆ_€Tk=xðV$8“éeé-l$ìŒCï‰Ù€9 ÄtêRÄs®ØËq2õw×_^†Ã›ÝšÊH‹)ˆÑÖ93Læ	tDØ¿ú úCö¶ÓFŒ‡Qòý’ÒŠ€ ß‚F7¡‰ßÝYA×þ¨e¿ÍÙ›0Y^t+@†mTÀâÀÙ½`T¯”j±Í§³D<¸v½«1h— Š¾`(4`Å¯ð‚:/Öxä8ïß677Ÿo={ä]y^Ü»Áƒš°!ªÁ&Ä¨ê¶Ø|†æyLÐ·¶»ŒŽ°ÎŽO.Ž¾}¹>ÞÜåsÆllbÚk1oÛùÜð}‹á–ëÌùnâ|åD¶Ÿ=Þ|²)'Ò¸“$„AonA¡µ]]MÁœ8sl÷äpÄœ“ÓcP|P¼n¿½8!ñ:+6¿\‡ÑŠ)ì‘2±7b²Y´^´ÔÎ[]°ÝÖê™.ÝåW“)±Í<6õôœ§ªï™ðBŠ¹Þ5±¡ôC\©ÛdÝÌ?òº{ˆÌ	g]<ê·{ìâø"ÅÑ¾['‘­÷!,¯’Ô"&]Oe˜:Ê&yÑ$;i9ÃuÆ37ª™­g…‘zf“¯§²tÝ¾i¾ŒgD”„YA†ƒ­§[Om²¶k°Ö—ëX}·nnÝ™ýºÎd"(„*±Ýn¬g^ç¼ßf]À´xŠ4;¿³v<s'ð7M­prC‰"eT4@£0ÒFÿõßYõ"rèèE0Q4ñeìö ˆy^¸RBjpûþJŒN¬¦´Pˆ ¼Tb´Öe&£)˜lÞÖ,ß^µ–ÝKTÀ5é!ìó#ÐI`À–µÎ€Bu¨ã3Á‘_ÏP/Í-!ëüÿçìíÁc¾]aîwHÜÖXTõ1¬P<¬]³¬‹Z©!iów†D­’ÿ>ä¦„tŽ¯QøªàW9üËZD¨2Aó\2(´ÍdEþe’·fB«¥H«Dëá<â•ŽH'ƒ¼CùŽ»Î5+}uQ‹¯@XðFÔ—Ò„Ä/QQ›x¸:J[œ‘ÙI
õq‚ò‚ò/Mö\Áóìüôu÷ˆ]]ôHÌXVÓðÀÑ[t$AËíAæ%T¼nƒF<Ÿ¬ŠftŒA–‰Äˆ4–5mwÒ
©IƒXŒ¼ aÖàtÃ†hM7mˆG©qCÔRæOØ ëƒN¯ÝÍIsÌ j6mj
Š{|	ªŠkÎ]”ì~·ª6þÎd>Ã2BBˆ‚<Qe”nÜ€#Í|/`]:×Æ’Ù û‚6M:I‘ mwßba0&˜Ãì†Åß…þÔ—Þ¿³ž°GðGB²'ZAS&»DÚa:œƒ";…6&ÐŒAÎN‹½'Æ17ZÐùã”4ž>Z0R‹ÅÀž+ŽBPŠîáZä Ó)´rhCá»‹0zô„Ñã,5zt¤Ñƒó$ÚLj4‰Pœci¿¯­¦}ÉF‚Vi••æ“ßAÚÑPw‚Ú¯Së	l©Ïé‘vø¶!þšü\dœy®ß9¾PôÀóÔy Ó¡&(ÖÔÈQ§j°ªÂõX¨†i‚»4aŸ¸õBH¦çôPÓäL%Mç[×A‹°–8mµr ÿõè²}"H«@“‘D ?Ü/ ÜCÁÉëT/o¨KÜN×ë°ó¦ÛF­¨ý+h£ÕM¡:â&˜3„]6tp×~¼­ä˜o&wÜIœA ƒ‡a#@ $Iµu$â¢ü‹W;LC`‰¶;É3åfž‹BÉ&Ó4Ru:RœO®ÿ+³+åöÃŽ1·é%ž[=ªêöÜÚ£:BV\þË4ÜògYæÍŸ¦·ö(°.ˆu%nÖÕíš<·Ì^“ç,vá”á<dm•7ËÜà
7HÞnÏs¯<¥ [íÏVþ'FZéqç¸ý¶}L“JÂE²©rSFGÖ)nÑ8u:%½sBß®<R2F´º0}ÌE’Zâ±48x›âm<|cžŠ¡‰Ôw[|h'oÚgG$D—oŠv
2º8üÞ/E…Mæˆº.¬Ê,¤QUÑ¡¦Ò…þ×c'päc•ÙÏ*×'Nt#1Èm>ÈóÎë£ÎaùA\'K{,Õ$¾S_:±Q²™a&˜57@|¨ndRÚŒçiÌBÚ‡o»ç@ÛmƒxáMgsŸ“kŠ £7aDŸO‘Ï_:˜í}Â!è ÿŠÔ:]”è¦fÃï¯º>Ï“Ð¹À+­"ðœ˜…`¬þ9gõÀëñ"ÔÇ—áñVÑ’o·m 4žš©½ó!Íˆžðû¢ðíCØ&`z)i¦j¯~à9WAHÖÓ*j[5"iÅø £áßu6™{”T–ÕûÐø$éeáÉ0DÈ Ë÷ýš¼Ðy‚»¦`ß§—Àý¾.9Q‚’!­Är4TÂB{arûv
 Üˆ…ªæC6»ƒ	Œ¯}ÀûÄð8v‚Æ®ÏN~½¹E{2ö"DpÖ“B×‘ÐÜ2®ÉíÍØÐ´ŠÙ•©:åvU\zD}Ec¨Qü,€vüã³.””ýTaì{ˆÆÔ³¶nD®iR°ª»I§Ú˜¸ðÎZ…6¸Îö€íP£HB•S§QÀ¤`ÆpnýU§Äúa47’j*p3×ýuß;…mV"5ßsºí7'§½~÷(óXÄå<áÐâÜCÙ—¹.m§Eç‰ ñ$”·˜Ø¦w ¿œýWg'!,wX!1M7<<Ì‰gyU¬–ïõq~ÚtÖï¾¶i"ë¤‚pléáüÚk¤{HÓÇ§oéó	_é‹½óî!®uÚ]x,FàchHç{‚w=»ÁV{˜$ Nƒ=F"òçlÏÃC2;íƒô(²ç ÍSèâÌ£Ëqƒ)ê3·dêÚGlOu­›pª‡ÒÌÚ6ÇÂõLëí«z¤áý>1CA±gœ€¸p_WvsŽ¼i6\áƒhÞS‚Þ`PÙaçü]íäÝ ¸C´
"W©!óÍ1`Ÿl±P‹Ÿ”¼?nŸuŽPo9”ë±÷ÿ…ßû§gÝÃ¾D*ü «§6TR‚Z„Â2¨Dá¦¶~mUñ™›pöG@ð¤oé½Î¯E$Sã%IÍ\Ò!ÈžÏqHÛ’•IÑ“;¨|ØA†%e€ÃâµÍ¡d³Äû¿]@…ípsƒŒ+ÿ³mÙ²_ÚGÝ´'žöO‘’z€-½‹ããöùoÚa‚Úí{ˆl˜DÒê6í¥wÖ9LA´ßî_ÀIÎº;mï¢<òðô¤×íõ;'¸vû V `qØ9ƒ
oùÍ~óyÓ4žn°sR¶öÕ¶s†Ñgda9D©,€mÐV‰µ©1öú¿á¨|Ç§'@—ÜDç([Y«ïÆ“ŸŸ>ýÙ<7Ø.8'GI8k±­­Ù×ÜaÂs|V|,ÍD@ª84\V#få¨"ÛØâŠg>k»è¥¡N¶³³–§:¹Ó’³Þ´ÍúñÇ(ôiŽÆ„Žü@zO
a<ƒ3‹)dš{Á®½a2†1mlü]‚~¥0\Ÿ¸›æž[Æ¿™N@€b£ùDcù9=PŠ|Â·±d\ƒ	8ƒÉU„·74$ôG›£'£Ÿ­ÀëßbOa4Ø’‰égb¾;Ò»6F›Ï¶œÆj8CÎJ|ÁôÐÇ— ±ÍSq*Ú>ù­k5Ÿ¡ÿÚÐåKˆ‡vâ¬´àXT—ÂÞã»!è†ìŸÇD‘—¼²‘‘Õ)ªâiöU< Ç¦ŠDWîìë!p‘›c|½µŸ'\‘sPv#¢jmç]Ñóî·üsçÌÆége'\þ)Ïvl”ãyÞÓœ¯|ÕûáÄÅ,ÄÏ7Þ*jÐCjMW
£¸r¡¤å)qÕè1+z÷ª0„L^Yƒ«î+™×}XDŒ‰[“ï¨…WMî{ËÓ6X‡,¢Wãs’ð¦zÌj½7½`àÏA°ªVoý\¡+Æô×Ix^»Ñ>ìÕšVøŸó0q–/Ni†}ì>_'-uÞé^œïw>vþëmûöëûœPÓgôð!Kñ~³8ø©	qºïMUžTÀ”ª °:{ŠVp,]³¯(¨~:WSbc/¡Ë"r\ôð	ÕÍ:2ü[Œê£”bœ¶y«Ì°–½!QÃºU]¹õOáÅaégõðŒ`à^9c1{TÅÝ¨ÉÞ¹C‡_ëhŒg*y( /K@»´€eŽðRœZÒêÔ>Æv[Yä‡³,BO~°0Bž»‹0Ä„óŸÔ7•²]5‹ŸØæ“Ö?bB†5ò¼,¿ L~c)T3ËfŠ\þ)æ±áç¢ ?©nÂ”0¢HÇt-p³Ä3ØLl­%ÂkÌã6åîñ*ƒx9Û5“Åñ£îæËõÙ®aÆ€þ´ÃÛü‰}zyíÒšÍøbã2rIÃ‘Ó¥ã_;7ñJê¡|’ŒAlãn.²…OÖþ´øT™ £Š°…ñ¼ ÒSÄ(Ó­ð…ZØ˜¹7ÖƒŒ-å,¡È–R*:hÓZÀY¶m‡™À-ˆC^¹ÓüT†½5-Í5è|qeþÃ£ð*8T©1¾¯„×°¿$¡ØqS$njÌ0œê¯¶ŸÖÐ‰ï®Õg¹T¥˜_æ1é	r…è…
Ùï>¢Ý)'Ä,›…	?ÀÏ¡äÓá\X±Óü3­Œ›±5>Ÿ¾»í hŒÃÄ.i™e¬© ÔL”³êÏVÌ‹ç‹qC:#1·LÚ¶Ÿr<=…ºe¥Ì‚>HßNJn„Ò·èV+È¨.Ï¥Ûx-0Z–“òâRtîNoÉÍex}.M`ö@íK»Ò~\1ˆÊ`N<åº@óKÔ…ZtñWŠwÂ<!'¶
Ð“Bø^Ñî`w'¨ ±·°RatÓL%´Ò¬¢j "2}SÐVÖ¢¾òiC±Óÿàé•Ä%_ó!lNêö
ž¼IÝù
+zAÃðý¹'ïö½ ‡=mªÕƒpðµ&‚­x]</‡íC!'x¼à{,À`H…¼ŒŽ­ðäÆ1¦Ïlú§†ß™l¼,*x-Ï}S´Ëg";¯?t†mß_œˆ¬®1{š*…ÓÄ#Zl‘Ø…2MëxÓDîË3´h…~­TÕiê,ðU3E_¬™þŽE9NUíþnh¸¬]9Kbí˜1†²ˆ‹‡¢¢™ðEŸñâ¤/{.Þ_‰¹Q4Ú47úz+ïZk¨k\t
Æ´ü„#ò@.ÂðAi.^.QÊú:7qâ’±¹•˜9£ÝåšÝëJqðâ…¼ÐYNZÏ‘oB“ï"j<zŠ	-ˆÞš¼àñYû¬sþ±×ý¿;½÷È 3IÌFa0±¹¶m–5²a8|¯¾¥ÚŒÞ1y"ƒê7.‹búd¬ºZ&‰1A½ ¦^0å695VêÜmÄa”àBîÄ®„±Ë<u¿®£ÃªÇÓ= éà7‰9Ãš1<"SPxØÀñSrÅ[/ô¥ýÐŒðNŽØÍäþ°UO³–Áf/g\ç#´¦,Sñàâ&­š({~¡‘ˆêM~wƒ0]áZËƒôQt•47×SPM©ä{Ð–Ph*¶ô47öÒŽô."K‘ÙÉ¥ZeùÔ *œ¥ ~[/KÙ×©Ä­p§Ü¤Åo‹SZÜ€Ù´BÈtÅŸŠ¨q½Dë0Šò;•q’ÌZëë×××Íëíf]­÷Ï×Ï;ûÆãÊ®60×îjS{‰—YÂj`v•úMFç£ µïî*†9ÓÐ9ÃËu^V¯M‹²kÀöÿà
åá¸9ümÒÁÀ­ü5&ûmv…¦qØ Å#Vù‚3 úÈñr$ Ã_¶Sý?[£c:hÈÛuc)Æ9êÂb$Ÿ3šG˜¯2c*1¥[´­ç Sz†Qé¹W¡kœgTÞºþ­þìÄ»ó„ÃÒ¶vz”y·ì4þöŽµ©m$ùWw¶7ÈHxùÊ6»6º,Edä‡6²å’í ëâ¿_wÏŒ¤yèA [[w¢Ç¨§§§g¦§»§{ÌÍíÆÆ¦>ê¹5jèlwÞå5mÜ~^ÃÆ™lÔ7uÔuËŒºÕ#e5Ž™Ú2ø)9NeªÀhEÌ#“óÉä4¾‡PŠõûZiÉFHÓP‘Mz†…¶Wmc([b¤BúÎ$½ap•&|ÿqz¶
é¹‘ßøÙ:v­ýé::Ï¯¢p‘qX`|8‡ló±R0mLÎiG1ë™¨©Û–óâ­ƒÜ™Ñ“™ÖÌ¸;Ôc½Ó‘1usÐ1 ’iÒþîÙÛ«å·š};Í%¦0x!&81`ý@ü÷ù}çOFìîüŸ0k• žzÐ—ˆ’!cRkc¨¯¦Ò|5Ï3ÞÖß¦;*ÂædõóVÿó>£!¼ò’ìÍJç¥½¦">î5eù•y#¤¿(8p¬°‹Ó¢³Ã
‚©ÃÚñ*¿«®ƒ•îñÕéÙÕIï·Rá”ŒG¥¥:;j›ì¶rü²æ>n,Â+\ƒ™ÁdòqG«k¦Vå°ªôY®ÒUCuìõ»&5]…ªú]:ßEñA¨\zo@/“ˆ ô>VÝàkÜWJ/ŽcÇ$ŠÞbà´veÖœ5‡,uv§f5Ó€“¸¸±|2³SeyW}‡‰þUË÷ö«Ãv•í?©±ì~m•¨[Pò÷L[&€Càìv*ÖYïã‘Uhìx2ß Êd BI,ý‹~9üþ‹bº„}•ô .k×Õß—ÃÁpÈÍv|ëz³.Í&Ü´“N=™Ó~Sl‚•˜ÔËÕ
Wç';<9`ëá¾†õ+…A$øŠÑ¨Ã;tŸ_ðOxúŒZÕMÔÈX²1ŽC(UH=®ˆMë²na ÝÒÖô·¦·k«šÎ§§°Òi¬Ÿ¿¥4Ö·ÕúÓmŠc3J §Øð¸‹5q“°‡@¾ÁÔû0ö¯†(ËÍºÒ~MâóÊŸFƒIøm |ª+£¯fxíQ7©Ÿ)ˆ}*Í8¥K?aÁí“{â>yà±ìwz^2¬#uëŠ¶TÍM
z,˜ÄBÖ²×žrÒ:ëœ*àÍ5Cù&üÍq¾I"Ç³˜ï¢6Sf¹üLj™ÔÜ±8›’õbó‹—.Þðä'¡þ.yjäìFj–s[9a1G\h“Âó¼³ÊYÓ$uÉd>‰A@Æ(8x(mïî`’X>¸zGâ]R±{œRP»ï~$Õ6@CF.€WÜEÔGbÔª3Dÿ–é¿o§ ‘yvU)î-‹ªæâQ¢©%>W„#9tç@[…ØwTçá½ößLÃt¢gþM—y¹C4´œ–2+…HlëÐœ($9–{ã6$ƒÔ›Äü$’
hž 	S4– ·x”:X˜äDêt]qÇÓæxÝ»N­áÄ	`p¹Š—TÀ›gnÃþ¾¹ê4Ù13ÉTÏèjJÌ¢9Öúw‡3žeB°«•&ïšò9Ñ ·ÔÜ»;Xrˆ‡àRø§ ·amÏç‚iD‚…v}]É•žº¤,É¬ºŸýh¾ VQSÅ8é439ÖŠ©ŽÜœÎ/#£ÅcsKv¬ëOÑÓ°’ˆÄcëIËŽèŒ<Ô©Gå7¾ºÄ¨ c{,úîô?€Ý¬nîL³Ú†ñåˆé&È	<.Q&¹Yâ/Mð“'”…$I@’_úQ”þy•0ûƒT‹kÌ;²…¶ðG>é¸†˜Qº='è‚¾Dsà±*t_•HÄ9u#­Lþ—†GÉ¼KFª…Á¼„?”{[fßlÚ«0=+‚Ø'ìWx¬yü=UòöÁ&î,§áÛ·hÇñÌ¿s¥´”Å¶ìGÍînIÉ6´_q*¬ AR°`7s}ª0®)YÝ•®ßÙU~:ý^i(ý¦»Îo—<‡<«M:ªù"a³ûê¹¤ímT0—Ïæô½¦ß­æ´"çð®¯¦šH?¾Þx÷ñ×Ô™Rœ”¬§iš…dÑÁ˜F÷ÍÐ{QäNXˆ:<Á{vþù²Wžm›[³'¼9LWƒ$úbûn²k´ú*Æ&².U³#A¢âR5¯8*dnQ)}O±)=hð¸aÃ¤¸ÆS iËÅƒ™y¶	£5ÂÁ_s`KÃ¡;hƒðr	p{SogÃçÊU ñ¬â‚àœªdˆ‰5§™Æ­H^ŠÌìË˜¸Hu2(´É¨ð*s¦»¬0ÂâŽ®¯tad|<ï²SÁgI•±SJ½ý@PŽ¯Î=¾:¹:µNÎŽ{ªÊZSg /h§£OÝ¢>eo¢.ÌÀŠ’›æT|,SÇQ;ÙœJs€‰¨Ü˜<•½´fA'=B#jJðSþyM5Åá.T‰Ç™¹%¼,Ú"zièØo°0<S{”3I†)H7û<˜Ì>å7©x¯aõN>SÜÏ÷Ž/¯¬‹£Ó#L²»aæ9¯à s?€p7gšÖpeUàpM"™“¨ñcÑ7¯8ü®°× ÅÇEe?¹Þ½”*	2Ã/Gå€bD³wV/S^ÄlÍ+›É«Í…*5$ ÕiS~[@È<¯Ùj[5¶1­ë¿ äÚŠé¤.@´"ßJ%K1ê2’¼aO/¯.¥mM<ÂÛA’Õô‘”(­W¨«¸i˜ÉÞséX½=tA¬út¦åj®_C1ºî‚4$=Üo€ÎŸÎŠ©‘Å§ƒ×a9Xõÿ%çüŸãz¼&Çå­5ÛøkŽ½]Ð, Á”#F•sG‰½F"¾ÛaKø%œ'¡óâˆ¤Ð×èêr#—¢”¤y~÷æ,G¦E§œðS Ë`(%YzW…³Ð¼—³BæpÎ˜íˆö+Tº¿…¹‹sR¸ýJ3-"F+Ë_Ó“Ïœ|–•Ï¥$ŒÂè¡šË¨W¶¡@Iµé#2§ñàXe?EŒ‹ÄµaÚÔ§ÙÏÚ*V-©*EËjìúb–,–Ç•¿›Ë
m”o•ÍeÚûä¯÷,i6-Û¶1mªNàRBÝÙìbZ-:oèzZMtßÜz¹×Ãç‡î|ÜÝÈ³Âé¬û«Z‡šèq(µ*žù°OíRíæzX):›(=#ŒßÅ(ˆh.'øÚ+`18ªµ„óp‡(qp8ý€äÛ_1¿‚yéÎd6;	æV˜XÇö¦¨þÈE®‡gQìEh÷#ÓèÚsô:°7[>–t9ô×Ofà³Ùdý±œ/üá£¸ÙéCÎ,ÌB2Â{{ì{°mÆàó0²g E@ÙJŒ¥<jWÍŸ¬ƒxÅ¶waÄ-ô?5å¦%êÖ>·Ôåb€ª;ûÚ†9æ†üxÅõ½½½eñ4žç´ZÕ3ðìá2¬‰ÿ o€«ì	&ž›;Ö
C{Ù‡À
gî¿xDÂ¸+È…£°¢ú¾åbÈÖ7I	F,1$ê(|U<ùJ»ZñÇ@ÚC•s‘3‡¹çÉÔ¹U@;œ64†Äc€»ÂçìX­uëõ \+Ïq“Ê·©¼±8Þð±züN°ƒT­Æ¦©xBûÕ—{Fºµ•~ÿ²ªä,mO<2©²›`T}BÒßÓ›Û-Røz°‘(+z©<»0UÚ\2…ˆÐ‹°Ïø3û}2&þ„>þ"£©/Z*×ÐøSFÚ¤ooeÈªêç3»3üVŠ‘œý`$®D©f§•#
ï„á×Ï3ÔI=÷ÐÐ1ü#Q•š_±š(ê–óX/7v$ú ïùóp1«{†žÂMä¢`ÏžsâÑ5›éÞA€–NFcÓ¼r1@·Øz€¬CƒÜá‚Ä,ò›ú'÷œÒ9Ñ¤g&çæTC2pÜd8nñg“¸žb*:kù   ÿÿì½ÛrÛÈ¶ ø+Yê:5#Q"u±Í’T›’l—Ë²KcÊ{Ÿîj‡
"!&HààbY¥­ˆó4ó4Ñ1ó0q~a^æ{öÌ|B¯µ2$€L AQe»¶QQ	y]¹î—$ÂØšbÒ†€R‰ò\Ì<ÌÓ(ð™Pù	~S¦[3?M`Ò}r¦c"OPf$fÜî‘a©œ¸Xt¡=ÝÇ¬ds½ù ¾œ9ÑÁ­ÞÌ‡TX¹à5bSêth´¯,Àzy‹$n<@¿»-2íp'$,öŽ¹1›¯`„Ô¯
7Päßž‹¯-¼¯è)°®ŸÍ@pB¶xÝ?Z«6Þ]U¼a‹Ç‘ñó®¤ôsÇÁUØ»ô~Oò‚ËZñZKÌÜ¹òÝ'¿¯;Õ@ žX¡0rî¬W~~ÎneOó2¤ãÆnü~îÌZkk|*Ò˜P‹Ö@Ê÷—U|Žß…óëDtë×­÷äâ'J5É ¡[é¥û¡¢UX7®íy¬{ë£M	±8Ç=Ü°!^&¬“Ûõ^¿I}á²ar à;Sð¾ã«TòŽ+4Uvä ~•ç]YåpQü%¦;HÊ<ëüørötõ|Ty&yþ>B6j¿tìBs	FøS*<T@|•–M"Ël1±¥oø–Z£Ëu¶ŠwC«Šë£ó;IÆ“&Æ@V[YëÊWÓ¬8Wá3ÌkS5Ô4¹àês'°1¿ŽÍææµ†²° Ã‚‰ˆÑç™ï³‚ð˜ØüjYÈk{0;Þë=¼»p¯Ò©Ã)M>·íO Ø!ÔºKÓ7Ql­q¡nµ±[ñ&tÊ?µ3Ü¨#ù¢ï?OŠ3°C¬ÇóÓ*æmºX5ÍÖ¥„Dô|–L7v¼ª 2?¶å@grqÐŒy°D:QgPX‡u¨(ê‹ŒAÙÄ4ÙO“+iÞM%XËsÍÀûØ‹¥BÐ&b]Ü ä¡ëÅ£u‚d@ÖîtÖgå+~«…\³ÄåY@^¹kÑ¸º9¤%‚^ŠÖTqµ{{õ ó­ÎESÉÓÅú†ÑèMïlòúbÙõÍ…ö,k)—<IòJAtC5šxnCsí§¼N,G/]£õ<qîe;¼Î
{ÑË¶K‹›ðçOéÉÌ‹G0”ÆÁ‚.yÍrN_ÅO¹¨Š0UC…ãSH5œ,¦>j]»!ŸÎ…3Z-ÍpáF“íº áO}²a‹7)ª¬§±ps¥ •õp¢8g7pÐh5ùI¼ÇÞð“µJÉÙÖ*¼ú%ƒˆªNááARnw¥e¶?ÒkèÒÓBwwø›ä•“Z©kæäKc–/ƒ\Èxe¾9
©yG‹Fj;“k/Ýòº·rI:k»Ð ¿*úY»™Š{œ„ª“uSsÕÉi<=$A¨¸ÒYÂíQ14…’¶®d»+{ÜÄ2Í‚m~ÄfÎ˜ëI‡-˜häR/:+™[ÎŸ 4¦bABDTÛ>H/‡EÂ 
²½R›Àúfß¾&ö·ÌHIóX3%µ¸d†JjÙ©jÆµÔœWSSóZ‘ç©y< ž
ÄjßÖ2T‡'ÌSÍóÞª
ç-Èu}^Q/,j!Ö™	O…8®þ¹§‡]¦bDÊ5‰j¢GHt©Íá6šûRYèB¾qæ›«æÌ8à‡ÞÐoŒõÃXÿ3r½…{#ø¦b¯V±sÃHÓÞ\n*#‰Ý|rx×l úµ€ØŸÆó¤L+75a"qžyßYp¬ôÏ!„4ãºà¸8åy#^@R
bšSâFq£ê½¼ÎARçV½$¥÷Win«û3çÝ›ñíZž]s»ŽW_6Ÿ¾8Þˆ?¯äÍ´=Ê³éë<#l\©áÑuüù²xsÍíExr~òtçÚàØU®*Naé,y#v\1•ÅÎ1åó*†|f\ÜZld-¹„¾Ü“TI®Dlz¡!Út+ÉMö¿NjPµUÕXNv¨äz%9`^ÃÊ54î^”|“6ëûÎ+û¦W™?yaùÎÅÔ¾I¼´t»j»2YVÓ£Fœm®V§R¼dSqËªd§UŠÍ®ó=
G›Ú$ô`ÒP‹
3%•	-`KóƒK‘úìJn¡oí›ôWøâuû]âílsK»3ûUáUÜU¶ú	zÊ¥‚ÆÒ/a‡§ÜóSÈ=MÉÉ4Í'~ÊÃ)F€];£¼7ç÷æì¬bqyvjcEràþ­™ÿ{a»V°¿IÌ™caäÚçðBç=îaºböÂœfŠÿ®=Øÿ;È¤=ó&¿lÿÓÆóo6ºíÝÔE¹äUÍ—Ýá¯<8I=d6ºò´<¤áOîzqDyH0I…äL¾Tæôýx+uµ5šeÍ›`yžà`c|¼IÅp"|	½u6hŸÚõ­iü¥“«:§xæóÃtbºÙdYv‰/¤%ô²k.%dNØ{lë°×6Œbjýé!¶ŽÂ0”ÑO—vtmÛóÊØai€”/›;Ü¿ÊîOÈá^dÓ6o¨?ÆyðLÀCÑdybÎ>]¾+‡Ï½i²·ðŠÂÐçÚtæ‡º‘2œÃ0 ,ÜØfcË×†`¯ÛþééEÿ¯ý—§ý£ÓgÇ§ýÁàÙ€BÚ[C7Ô&›T_I@^ÂH—\¾yõÁ°í”ŠIè¯RìžÉµG‘7oô^ÀEÜòVÙßÔG¡¼g3Œ _i b8ùV^»ÕZóaÉa[¾ocx_ÙåãÙ÷æÀ _H,ô:^?²U9î*‹‹b2îÆŸDðÕlT
Ãênédƒú«GýsÄÿd‹M0 ³w8fë@¿%Ú#a¾Ç[t}÷[³Í6;òòU
ŽKÑ¹ lÌµ-^±£*W“³¡	.kØßíoÔÍ¯˜Ñá=Å¦˜¶;CÀ°ºW%-èÜ‚õi>¼P°g4Ì“õr£¾Àü÷79f0«Öé_w8Á`¼5ìkxMçÊ›Õ<ÇCqÑdO¬%¯&¼2Gð¤Òªa’9sÌŸ¬|ÐŒþS°Á9öw¬Ñ_B.Ú´ÃáŠþíf¯ôÓg´Wh])uT/¢™ƒ[b[3‚¸ôáo@Ç¯ÐQ /.ŸâF…¸Q‹ú7ŽáõËÊw4¤àÜŠýT¬üM!î<å?èÎã<G$íM¢£oeœzqÁÓúŽ¢G^ð‘¶øfóÌ"Ø\]6
ùÒŸ…r¬õÔ–å(¢ý'ŽñÑ±k9¨Á@ñ±"Fšï’ŽØbºð`¦ØÀ"/{"ºë”ƒÎS´P!„Ésæ)³ýx~c‘r÷Gšð€üä»z2_xx•ŒTé-&Í²‚cH¶˜â‰™À œ	 9 e¿b¶ 	Ú(X¨?ÕÜ‹¼žTF¹C!°ªZÀJæ¬Pž,¹YÎP²™%ó(@fby5bŽœ¿ñØöâóøÒ˜>T„©¦ZÉ­óI<»œ£ËÉ Œ¬•ÒµÜÒÖ¤-†¨¹/Ü’+V(õú•©GðÒ§ÙVæÁ«a
¼ôiHöÖÙˆ§SÙjw”9IðÊ ›ç9°Ûaäùgô?¦¦Z.ãYžµd'ÿ\ª‘2hš¥‘ÅÆRúUž“½­\Vc—…³ž¿±—àë,×¤§€¹w«Œ¨R TéÞá*ºëÀò4JõP+íªêÚ‚÷øÇR”ý%JWûÅãHÔô3®Äí¥qaR”Ôì°	üå¸®QF?!}ÔfmÉµk&Mš©léÉÉvY•‰¤_•Ç%ËÝ’ò¸$í+V­‰j‘ÆAºOŽí÷ˆk#ýh®Ép|"~Ôçìˆ “N&ø%åŽ„¢!#I¹4P:^¿Á|ñ*`yó‰5QV+J{jž,³' àòáÐ‚Ìì‘Ï@ˆq)¦Ü´X”¡´ƒ@P/­k`J’T8³é¬/6Öv,Œi#×]øõ2žB#<4o+IhyZ÷ÕRÐ#JM~N¬+Ì_Vã!–ÚF€êäD#çÀG‘Z'E`2`©™t5hÔÙ{jL$/Ù×.›zEƒÂNÍ,K3$"uæŒ>¸ œb	S#àŠ"àŠþÊïóÂS¹ô‡u-$¿£ÄIã?²ß°¤HØÛÜtfãöï¢=ôf›ÍïoÅsw›“ñIíþø7ÖŽáµ=7²[H¬˜1Â [­ìæßÿŽËl®ÈbåÚ?!GŽ<0XÀk…CËÅ
#í­®Ž×R]zþ­Q3ù¤™¥½¿Å–ÕGo•/†È‘`ìµ7²\^mÍÜN…—AƒúºvæÀ²´±"iÞXxö°ê½ñæþhës/°¯ì °+‚-4£3~ºÁ®åÐŠû©Š&—Oƒ:1# àÖÂDÃñ¸BÇÁßABÞÝ*é'ªób²m&ì¼™qÎœì£p×Ùë=•Ä¶—3LDZ”Úª®"’Ne+ôía´Ái°SRŠõf…5X·›Î.Åž?6´ÂÒ´ »šùz¯0¤}ß-Ö†åFGR§æ†¼Êbâ„ÿñ({/€ÖGäú7#"nbW×L•– Hd>šŠñÂlÂÀ ¬¸Öï7Í›0Iä‹²ÍÝÛ¸˜_»Ê”¹(Œ|t¬$cëSžB7ƒøfItë•xµS)~RzNDMÄF£˜|A‹@š6öÉ–‘¨ìZÉÍ
IFâc·S>Þ›{Œ•ÃsâÌ¹¬©–Ž¯¹%tí®ž{’/D¯/¬°_à|áf4A­4N]ö`gÄc«‡GªÏƒ2‚#ÿÒ%`¤Óì[˜3Ýæ½­Hnïä¨–¸›¦8n¼ÇÉö3…ÚÀalqðÒW¥Ž–0Ai7(™hHF›YWt:pÀ:E	L©ªcÉà‘¨†v·Th»“¿+:Ý-3)ß6’• •R©ŸEƒÏsÏgÇ0Ú± \Z£†|u]•Œµ=”‰¼«ô#Diµ³ªK’Z‰þÇ»En(ƒbµšiVaPÖL$Uù†‹XqZ×ä9¡U‡á<ÉqîÇ Î ¦ZŒ6àÅ¹¯a ‘èÿ*ì1ÚÙ,0’EáøˆÒÊ³qÈ—Ê"k=ÙÒ)e½™n¼Ô¾l;9}¨ a»•pZà`Üúøî'x’v_˜¸þØÍoøx#É/SøžØÈ~åÚ
•=–Ì´‡?Ïç.æ!v4Ù1VŠ"ÿ-“À”ÍEÊKÎÐÒÍ2%nê1ÎãñP³°´¦*ÅX}ÝëÏ"Ôs"$TQ^¿ÑÙªbŸS›8‰ì$
=üý1Ž¤äv3Ýÿå10Û@]¶3i!€eagd-hfI{YT:1”žv”{Å—«t2'ä’÷Â‚køìt7·ÜS,7T^KZ¾£xj}Á(ÓìQÙ?¢îéíf•Ûk•g ®Z†nhEiQ>·hž"Ù¾ô>1Ò—]4¬‚FYã…¡u¿(ú5Üª<~Pê®ÑF?iô¸2Žp>™O¤½ßáht·Þ×KT2[‘ç‡Ãé\’òžèo*-uUZ¯
_
í6/ìøQX„œ6Uv½(jVµjR/–s$¡Ò)9.­Ëï°Î|ãénS‡¹2Ï°“i„Ÿ˜
Ç	Jü/KsY–ÇàÉxŽ óƒZC¢z~Ì´¯ñ !á> ü¹a*Š«(IFÄ€éÄïîr]:òŽåø‹déVKèD0Iõ¾ &6s³½l²ÄûfÔ
Kæ”ç†ö/3þ/¢ª4+ÜTf„ê¬$5–YÔÌÞ.Af!è±„E ”´#!ÁWŽ…NysrÃl]:Vm@ÏÈ‚nqýË†§GÏ³Ëð”X™8·&Wó<…[¬’ššAcØ BQ`B ÃÄÙZ¾÷ó_ó›ˆˆÐÕ™6Õ†5sa©³ŽwRç³¢v/Qâ¢5#ãç¾sÀðŒœÌ›©Êõõuâƒ²1÷†ž7u¸3
Ÿm~ßh¬w?Z10B@Þ:×Ëäé.Ž3t”¦é(ü8wahð´\`»V¬áÐvíÀ›ÙX¤™%Óúºq|ª7ºqÀ1ùÙóapãG¨eÚúo/ŠÿùÎ0Šdº6ÄÇØµ}¹ì\`è@ãyóPÅÏÚwjÎ™EµÚ‚ÚÄš‹d‹
.Ì*uº¨Cîæ- ³K.¬š5êW°>ä­Êk	ê—BêÈ\n¾77‚×"	^÷ãJðÊ«w“X-‰sÎ™´
aCeƒEÂ½hy‘®Þ¶VŠ%Z¶×	BZ&,ÝÀt\¡ºÂ„;©g®—¬¨Pi(¿®U”XÎr\	_5uäŠrÇYiã¼ÖX[°8­x:€ŽBåJ?¼Àb/°ó™øä ©Šq]åâ¼J£8…½šm`x‡<+ZÔÚq6¨@2UÞà’Eåá_wðïDü-šÚH‰ˆò€¢úpâ8 Gˆt*Ð"),kK$W”ÆÙ¥qŠÉÉ@·wù@éoq Âç>C]¨Jrõ¢'5Ÿ»Y]ê®É²ûqà»÷[øŠÙìhgS[ºxÞH´‡HŸ6íÉ‚o·ë`xS×FÅ"
ù©"þoÕ™
±8»vžðuÞÑ’‚BL´Jc.Y8’M)µ[Œ”B­b2ÿ*§üôõÔ«T¶Ùïú3žh(Ç©}+š«(±6Ätñ¸ºu]o¼–Xg –9FäÄ€sæd2ÔncÇY8\f#å®ïÈ¾Är‰ç<ÔÉñ§UAsß
¦®ªœsr@MÐòW;vdGÛ`çv‡ð%˜‚ôfÍÇMè;ý4é”6‚bGü8í•+róùæã·¤óˆŠmZÀºs×O–ë­³·6FÊcQngäL¿4l–ìi°K(Šm`_¼CÙ1®àS$>u‰ýÌK¨Kçk‚·«lWû›“Žq<6ð¦ÉÊ¡N_àø§[BIß•l>eOjËFìŠL…™öµ`úN,ñXö|˜-8¿sº˜/:v"‹g”¿´yñ4¬
`&Š©œ8|ƒåb(¼š ×ú@õÑ)É™k_:6´}+Z‡F‚™5[ël¿–}_Rdùzb3
›ŸÙó›8ŒçX„ÜÂ\™ÃÛšEV†=kcœñ"ÇØn½À £ç¶…â¶Ú%¢6,I‡´G¨HgD wŒx>†£¨óÁ¨EÎx-øŒ×8¯žN#ž×s8[ÿŒ—*Þ¸„8Ðûk7°gïI3 PÂ¯[OüOÛÀð\ãËÖÖ:ý×ÞÚY{¯£²<â#•)Ó0ç
?I­„p_#XŽWÙ>UhÛFMÅv7eº;E¬‚¼r\2sâªmKHæÌ……Ûèî–·¿ŽÓÕÍêz£³‡Š–=Ã|:%¼ÇS¨20Èq8µ†]¢#"œù¼×ËþÑQO7*Éð6•BUnæ;Š Ù.ùÙWê”êVTÝÍeF9ïT‡B¯ž!¾dýscÀß—ÕV·ª¤ ¼ú¾ëL-@nH5FNB Ï#ua–8—˜A	H¨i€xfM¬™ÃŽ-ßrˆ®KÔ¤u|¶Æ&0¦±•QˆþùÙ:z6Ä.ëÃcœ®œ½ýå¼OTc“L±Íd0ˆ€EñØ
™5šÁyÉ˜«„’Í)¯õ+žÒ…Ù€¬¹šøðÕhøjˆ^H
ÞÚc zbÐýF–Llä­ÜÑŸŒÈ³‚ÛÉ×„*$ß?;aÆiB&ŽíŽŽ±òÔI^Ù¡Æ„Y¤óY(Ä™3E² ÃF^ür˜Åñ5FÎçN¹><Ì*Z¤b¹VZðj„t bs*EÎ4vIzÐ‰ —&}ØïÍÇ‡GƒWý3¶µ³·ùÓæ«·X\bä7þ[›¢ ž¢†HÆG‹°ˆë)»¶à¼ï[!§1¡cùH-FÖÌÇ6œ|PEX±‡£¯íÈÙ$ñÚ˜ NMõ‘íodcÉdChÿ\TCšÜßš!¾~v’‘Ò€b–3ÿ"iE	Ï|J1àEeæc€+ AZçg)ŸüÿÚz*Sô_r^ßÇs‹²h
êž|$<)58·¦¡7÷àù#×ófp^?:!!r;€Ø#ö
 yríMÜ”J¬“ „MQp>:Q’Î’P8 9ÉÇÔ#ž½JžóaV\f¡Út—¤ »7ÝÐÀŠRvbÐ“l©6’`Ýsgf£6\­[Ðp ò¶lµŸjñ»†ª$_-	UÙYolMÐgÁëÊ$e;%)³QÏGŒ•‘–.’•ÝmÙÚBJA…i@*tºønéümKºø¥.>qŒ‘n2M|#œÒ1š°×Äˆ½¶IWX¡«’‘Ñ%©û#I—àÒ¬j÷²Dþ=€ç_g. mñYBÒŸ6üO8ëä)¡1Ïîäü¤“ç/þèPò±Hˆ’û™R³½ˆ›R.én>
¿ß5÷*4H‘8ê%·x5¼ãF=2ÎäÚœèÝÛ—¾@[3¬rš8Eh´Îƒ*íá®¤=,†Ö§”Möóá>à4aêBhê‘¶ã
ä€¦³ÙÍ~E§‹^ñWâ„ëLFûëó±:U×0LœßYÀ	ô;lÃñ/;€˜ÑŒzÉí]¸»Íï¢]BŽIs eIU¼H§f©á¢wŸ®w¶·Ö»;{€î:Ðµ@†‚BŒ¨*[dÞ¡ý	wúë®ÿY“XTáA™Í,"SËß2y•ÃãxŠù¦q¡ž9ƒ‚©½ýTµ9">GdùB&qËµÙ+|ƒtš¼œ!jLñEÔ…‚0J²²7ák…þTˆÆ ÊÖ';|(gè´%hÁnÑ†üÕ ®&¸«ûã®§€»¶º€»:_2îr¬ %œ× ÐA^8?{hÔEIV#ov‰!,ç’­¼@¯_’;>Ã¹g+mÉÜÄqa*òZøŠEöe	dEƒGUZ"ÂÇâ®±ŽãÁ„G¤- •ßðÖCã­T±"«Y¾&¼ÕmmÅh«³÷dýÉ. ­Ç_0Ú:·QÑç÷gktáå¨³ypÌe¡ØÞ#jƒ¯Oõ#z¼	VŒ×Œëó§ˆëV‰Q™ýxV(ß"DTyŒ,Û ;)"ÖU©Ï	°i‰+ú;}C_¾2cbÎ¶ø5!°FŒ×ÎWÁÖ;€Á:Ý§_083Ä&ÜËä÷.yh6°¢˜ã$×;<©ýIDEÁ
n/X€1ó—?Äc‹]:¡•“Ç°‹ñ„›;8G^‹&´XÐµÐ9@ïÖ¿Áfr¤E†Î‘3´#kú ÈË(ç‰R‘Â<zêAú•\¢Eæá9>gˆ
ï‘ÆÉóË,2“h²w›k²«ÝT»ä¦úD¸©.è1_Y2&3¿¶w…¶¼³U@cŒÓ"T¡AÛ;ë§×Ÿî }Ðƒ6p«Ž ÛPwÐþÿqÁáíÖ[PK¦Ó½
Ói·.ÝòãL§ê¨…Üß'É´Ïk¸e{#cBaü'r†ß§\âá;_cÃ4!M
såvÙ\QëÚ"P@™²fYcWeØ-™0÷]G³OadmÓ6¬c9o¦e¸Þ@†¨r’@æVÆ²d'hë¢#Î•;@»kï¸bÛ·ƒ¨ìŒI?ñô§0á¸Ÿ:\¦N•#Ô?Î=h‚ë|•‹pæÌ¡ûïØKtë™ íC^¹Îe$.Ip’&ñ%ÒÏŒïçžGSq 4
FöÌ™~½ëðKa•ÏifDêáµN‹äïDÄ×;Ñ>î÷c­	ÎI[‡°õ(Ø…ö„/ Í ­œ3Øq@3ÂX?r„¥¼f	ö7cMQÕJþgÙäÕC.È®¢¯Ý§ëÎîz·ûY¬à?)…•¶§DbÓ•Á¾œ_yŸ›¾[9>b§Î]^ê<Gÿ„6Û‡:œ“;J9RË±
U‹â	¹$ys{J˜ÂŽíÐ0aòœÏGX—0ihŠn»3 •	úó:£Øw˜çÚ“Ô«ö­éá1ÎPr´„,‚=íÐžb¸"–}»pq-c/×™¢ÿðˆBáçˆù$ï~ˆ)Dó«]G^t7nmO„Ñä3‘%oD};t®œ){ÓQ=õ`±Ø‰e V h*bY‹oHDÁ¿DEø/´øÝÚ²ÖJ¤Î ¾ˆ‘‚ü-£6ŽƒZÐ=iAGá¤.ùŠÏü8À`Ó¹0Äg{‰¬íüƒÐæòe€{ˆ1qV3+tyüÏ¥UËÜÕüòíZ¥Æ1¶öæyÓÔÌ¸¿'Þãˆ÷¸¹ú¢Öß ®m]>Ã&þçÜ)<e™´Š‰®>!ãâ#¹+ä“*%Ó+ù”+“À
÷B¿'iv‹‚sâNŠwål¯ï Öé®½WOï<˜ózâÏWYp©à &ªÚdJ¼‘°„ê²6|ìb]í°‹)*Ì("|¿†Aáá 7³³4¬”·I•øj´K©@ÞRÊcº€l¯7Ðo~/Ÿ\¶E´ë8âí­êÚOÕY*«’û_‘ð"Õ¯¾xÛ?9`ÿø÷ÿ`çÖÜ·Ø‘cùCT¾QÍSõŸÿ¥Œh)š†û;?÷<ÜÈMvâÍ-%ºÕ	gš¬úèÿ‰¥Y÷ô,¹¦’ÃA“„Niæ¨¬|ŒéW<;–›ž¡ÖÐ	†®}aEX×/>ZAkc#ºÎÎ¦£×àüKµÍ:¢¶™œ'£èÉj˜‰ç¯Ø-&	ÊU-7¨~Ö0_ÊeØÑž:iKš¬y¹ÜýcïêÊ¶‰Hù,¬ðIÊs£,qñX!Šbß÷€Ñ:ŸØìÄþh»žoÕT‹ê4ÎäåÝZ‰‘¼8Ö“xŠ:³3`Æ9—‰áéI|øË¹£7£Á@>]Û,3TWÒ_!¸z”ªã^%é9³›"€·'o;&eEu5Eg£|MÑÔÍ¼ÀŠˆÊjÞÀTª.E³0v»ÙSÒš•ÃüŸÿÝ¤Ðƒzj³)§¼ö@Úy€Ñ8{åùŽHD‚¤¦¥4ÿ<Òí¿¼v®"kbÎÓ§©jXÐúô,z6jÀçÿÿ¿ÿÛÿó€ðóÖžÚsÀ\ 0Ï­¦ ´õ¤»Ýévžîì=é|Ÿ?|4xæÿúßþ¿ÿ÷@Pºå{…ª„Ðš5	Ýì=ÝýËxf9.¦Ñ^èTý¤Ð¶¸ñ"aß©Ü³GCÏ¿ùÝÎíkL‡f·ÖÚc;ÂüÓÿÙ.síŽñ™²NµÍú 8dûíà£=Òåô2Í*[¸e˜Y6“óÓ*è¥Ü²Šõ2Ì.Û¬î¯>­&ûì·T²†Õ§’­èýSÉf)W7H†ToqªOÛùÃÓÇ–f°£Ò¤)i&Ë\ïK¥É+ÚÔ‘ÊÔˆšð–tiIIImêÖ\%wLRlA7¦@œÅ½.¨9µ–Ä*’´6eB¤H¼–Æ#Ý3õÚŽÖ÷³6[ÿþ;@ûòTqIº¨çf¦Í—œX!Š©ää¢j®öè‚šä>äÔFŸAzf†	œÔ ´žÑþà	/s2Z±ÐÀŒ'i_>ý%Ï”¦öÀÔ­R=¦¦×
µK#â’;ª|à\o8Í3©¨ Ø@½þÊ!¼fI+OVtèÌÑW¥’­ãÕu°³•êspHÇ9Éò»-Ð±ÐWÞ0{˜¶]ú’†+{qD:*¢¹:ALÕõ|vgkg+Ç°˜Þ¤ÇŽâ‘ƒfåÈ½u6hŸÚÕ­|´`D·1œ=ì7m@/ÀÉW—ŒðæÇèc§åë€Ëx'5Ôòû#ÞoÝ¶Ûmü²Î²¶{ÌnóBmÄÝZ…eEƒj8Ú‡Î—ó0Â½c›¨ª÷\kòLó—L'ì=Æ`›Æ,b™æ`
\-üq<«…–°Ÿb•µæ›Ud&¡øÇÇ“_Ê‰ƒaè‹ËÓù´úùÑcÉnÀývDñZIÌUÁ@V/×ÆêÎ<gs·®Wÿôô¢ÿ×þËÓþÑé³‹ãÓþ`ðlÐžY~«5tC^û´²¼†ÀsÂíÚÃÄ¶–GËaèŒçöèGKÂ*´ÝvFÕUfñR°úKXÉžÅkjßÜò‘4¨0Ô¸Ê^eû¼æ³ŒÞÈ‹Ö+Æ*nñÊ ãö7^´ŒYSP2ìûz0¯½†×l5‘¬ám²ún/S÷ÍÒp·ä—ÍîÖjã~{Ô/ï©àušÔ$
”GTæÝÝ„«ÄJ®’ê¤TÊ4‰ÄÂAôMËMçû¹ýM®èýý­tþa3,	‚Ú*.n^·
ë`Þ5^Ï±.ý
>½lpfÕÉ6©¨ˆ×ƒÖÈ6Ru0>ª*ò[M§é‰ûs—ÄNxðÕÒ1êÖ€³ÄË˜»ÄëËç0ñRr™˜Ã¹îÕ¿¯ƒ†½1D…uý)YH’zhÄ]âu, ì™Fè}ðr«.%ä¾@7T„ÊöÜòßPlÀÃ€nÒú¶ŸOÐ×[!õWöì–
`¿ø!ì¾åjDOa±R2u-’)p/è•ÃÖ‰ãÛKI1Èq=ÂLs‹¹ZÁþôh_BÏ5>ŒõÀŸKÛÐù»5¸m®[€±ÀÙ÷Üà¿ÿ­®._½ ÷±Ý^
tð]ôÊá	ÈÕ¤hNà˜GY`>}‹×‘]IŠ;[NÅ#Çk=oìòºÎ–ïÃÿˆ+Å‚±I!Ø´þ«ZðßM½tÜú•ÃÔÆ~¨K¬aªÏ-ÐØMå9Á%ü¨šë3)â^Pë…½"˜Üæ¤««
%ÞÌ3x'ÃÇô{^ê]å*›ÎjèVWÃ®× Æ´ÜAäÖØnööì% ÄÖªŽ9|ÈsÞêý[“&¼¬&“åº¸õZB{Éb/¡)¾p.à$Õ5X‘û/9P¸·ng¦üN^ÜNÕnÅ‚É©½àá#*]æõz[Í÷adÆ½Uðu’d³ƒi…7ó!3=ž\%Ç±›P»UéäP$G­!d "Ð©u¦±Î4…¾B¥ƒVè¨€yîÙ[þç$á³{ö“žÍBÉýûNClø5èDƒ¦MB¢ÿ¡6[ÍÚ—^GEO}®àïs/(·ÍÕ¶‡þQZÆhÍàáUµžüWØ´\oõ³¿c¶‹Ú­æ£º/b¦ÞÍ—“=zDmÛèßgºŽQpcø$^wQo0 ç ‹Ø »Mø‘÷ÌYÛµväz×vpŒ ßgÖ2˜°<«ïÒŽÖ„¹Áü}>RÖ‰7|k_ÁPGÞ°5º\g«xYÖ|ãvý±3ëÆõ,´©4ÓÀÏ‰çÒ `\>ÚF|j½™f¿ÈÖU¡ÞfM˜?éÈ7l'Çdjñu³F3>U‰›5sŠ0ö#¬:™¶çÞukÍÜ†`JÖµå$ @ÚÊ€u=`Á“ÐÐ/— 2E'ñ'Gè.‹øhßšß¶<–Ië¦(¦0_1”g§£XgdbKZ_Ç/ùsf"V$WSœt¢Gä/vÀG‚#]orX«NI³ÃÙŒ„¸×’fÐ`ªè(ŽÐäÏƒ_Þ´CÂóÎÕM®ÃŽîØÐŠ†ÖÉ½	ÔàÖx®Ý†×¼ µú Åa:1Üb ,ñ®Æ†®µ¦‹P(48Õ=æ9«½ZQÎ\ò"ïîN*{U¥Ä.9×hf†Å@æí­L&£›SÅI. b+Ë‹Z³ZŸM¹iî•7¿rL"ÁY3ÿöÚ
ã){£«EDèB•EäJ¥r¸2”¸©HUÿpÄ½À±ÜÕµ;…æsmì˜.oAÿ&¢°óºf³t6|ýNÑÑ 7¤LœËË<»Ä<(S›‹ñkL»œjOnuøtîÙ,¬"çpR+‘ˆÈ
ýËò~€1Ù‰ªòµ7²\)û6œx×\Là?y»TEü¾ñëÓ­÷õ[I‡ÏN±¢ gä]ÆÃYê$ïÀ¬€=Â¿i€S1lX3.;\<€s.å³Q9 $·Œº¬»Ò÷¨
ÅÆÓ¢s¯}‡5üÉ¶°•ºpwÎnEj†Ç9óÇDˆÃ.¦š–7¡tCß‚Vð`¦! ’—?0òÑ ¥(ÞbîòL™~»«‰ó®öPv¤ÈÒT"%"ä&7¶¢8”ùÜ(¥KÄUa&HœM(o¦çZi‹rQnMŠÅÔ7u*»2:ävëÊ	_aÉm,ú:êqv‰äÊM	,«É¡bæÿª"få­W#ÝŠp
¼ÑÁÜcY¢4ÉáJUg’)IM(]‡ìÈUýJ®Jp²ôîo AšŒO
¯·/;®Ô	­©H8wo“ŠCª2§¾eÉ'è?¥h¨—ùÉe­d¡­é‘xRöNSú^Ý6šÙJ§Ì}ª}Lù9´¹$ääõYvú¹@%ÖYƒ©*;+ç”z‘¼ºPä¡Ò!5}Ž‹œ^Ã5]åÕcº—"³þHùÓÉE.“_7XüµNì++v£5¥ñWïz\ÊkƒŒy)ûýç¥áa¶gÚ!óí}°¨ÏL1Ó\r_ÊRFû¶ÎVìgá—Àó ‘_Ï´'•‚(‹óš×hcæeQã)ö+|%ŠÝSûkk‚ñmÍj7¤8
¤÷XØ+gÈ³ø¼¶ÃÐRb½[‹Óñ@Ž•L;Q`F/¦1ç^R_fCÁC*]†sCl£^ãán®
ü˜eê–²sc ›*Ùz—<LtF¢~ÒU O;Â/ånð®¶lƒ§ÇI[á_Ëíðû]•»°Æ–.Ü&}ÜUœâ
Qj¦5v"/!Šµ&ñ%'íÑ=r,rµ1E^‚KvjŸ½§<k%ížŠ—ä$ôÜ±@kY€4&P5üJ_«ä0¨ü¬bß·ƒ!:&§˜×ÎH“î)B3×xEéŠß¨™{rRnyLIç9ÌÎ€ðJì±Ì™J­2îFiñÕÏ©\ŠúÙK­¼ÃÆ](çõZƒ…[Cáv˜:L­©U@
ÿ/ý¿‘´°ÖlÛÄŒß“9±²o˜ðÞKÅf®=ñæ^A¦š‡ú(UD½Ô«TÉ-­ïòð¢Ù-U¤?OO°M°pP>…Êf·èUXR.!ó¯éø"'r•À=ÀÅó*mþ
=¾ ÎÏ­™ï¸ÉÕŒ4<N©ùýg7ö/WWÄ}áš_ÕÌB#¼¨”‡ít0 £ º3áâðHáñ9œ—pb9u—’î«ƒ±Û˜ñL˜g··Æ+:#kÊÐŽ°"½3CUgª˜ïLàÇ©9cE9x‹¤ç…ž}ÂüÒ0žSàêð¾¡Sw¹OK± |ï¼	OÿBÏGõ=“Ïšæ¤L˜%MÈ^þH%¢`±+z1–†¡D9ß
¦.ðé9ÈF	{‚ÿì—¼4_¤^šEOIöÿõÿP …e"ŸðU5$TlW¤¹Ì´’×åexÂòÚsÕñi&Ø)yójdnè¢¹$ïÍ^­|²6˜Qá¼YßsÂ§Þƒ×÷Ñq	à¾%p5ÜâÇa›É1Ì…\qY¸­÷­ÏÜœx‹c¥v%ÛVI„3$¹;ä áZ¿Dó>u¦Ð0äçæ³‰ÈÄé'\5%'ZE‡Tš-Ð.®Õ¯¾†9+ø~\Fßw?Ìã‘)¬VDÝtåÔ‡]8y©QÐµÄ™WºB¡…xKo(oäû–´¶<‘Ìj!D‘(J¸Äï‰:nÆâŒˆ_Á4›WX, IT»è-í~fd:õB
'”ªÀ¤±V!TÅ]%’Íò]	ÅxÙ@²wTžéªððšh÷ØWÍ Yul?•7õj 5¶¨ÏX•8PÖ¡ Ãôó{‹¬§=Új£ôÏ~ö@3£ôÞn”®·JW¥w>ñO4§œ¼¯6Q×ÚuÑ¢•¨ 25%Ï—Wo6VùTt¦5"ïyÞô2ª½"¡7Ù:TÖÚò¹¢Á=ÅõDÖ|„¼P<©—s8VÓ8p¦±‹´“íCUn±Ë)1O-AZèô0KÊlg:²BLöÆk³Î6¯ëJqÑ(,rÀÖ¹ÎèõŸƒ<\'ÜGÑ¸ž¢œtßª-°°Üÿª]çt–TÙÊøl«+ÍJ•g"é+"»^Q^˜¡¶äÃ~d]z|9ä=åÉd5ÄÚ˜ØÖHkÁOµÌ™Z5Ù„ÎÖ–öTUæ¸Ù‚CèVÅNnK°(úW_cb;)}A4Ñ¿/g:ÌZ4‹¿Ú]üÕíÅ_ÝYüÕ]ãW“7öø›°;Z`Ù$h© ¦Kô0zÈw€R CŒ äö—Ëö0jÃðÇ[?Ÿ]ÎûoNúoOk<Ò¯aLÏ¬óÎìðý:sFŸ«Ô¤&ðãy†D2®¹…6Ø¿°.Ù¤¶„5ŠÈÖª0îÜ±zk;ª a9s‚ ¥MJ;‡%é›Rïð­˜ó¯i€Øû¥´Ó]R;ÛKjggIíì6i§üú^úzÕÙ€«"Î^Å£¡s8%Dnšo³|ÓœÉ<¦r²À"(Ìô×¼.ìKd/ïÅ_îÞ¿| 3ñÊêÍ©dcV3ÙÈë&|8vóUR›¸/jgYrÌÍ–œlN]x=¢²KnVïÆc‹EYÍäÍ9Àð‹¨¨ç<kXÏd¡¾¾ScU2à<%9Eå©Ç›ymadT2ëct²kI‡â±g”Òýà6ÿýNûž7Ç ªd¹1XcëÌþ˜¬ü³¬Ù||,·×ºeÒ“˜¬«¦ý·hÐN:!Á“ôýùè¤i¯=VÕFUò09€m€mÜ–ni_FmPù}Õ]}Ã‰ç¹xÔ6ñíüª¾¥wK÷”¯—íÞÊ
º$ö†Ñ¦”‰“­Øº¢Á¦–J=iD¥vŠ‰Üu!Ù*S©ZýCiJñ?M±¨:ßí³‰Ô™Q-] xÛw—Öd3±9D”Õš£{Ž6å‰t—%¸~õNë®ñîÑ'B©Ëf”o©ÄhËyï89¡’ˆ¹ÃDŽ#î¢hadŠƒû#w@^I´­å^7š•ý±ÍÝ•ÿþw¦|BàU…pe€ s§–Š*p•)Üþ¨MÀTá=·Í¼¦› _µ[áöo»ÄwI>éöØ¡ÂÎ›ìù­¦;Æ}×ÄŽìph¼eøpàøä7Àód©3ÚÑ°ØOÈ¾µn¬uLëïÀGþtâ`¥S¾òO²{³‚¹ûõ
€vìF‡,¤ÔÉ>÷j¼Qô4mQjyßZ]úQ©…)xT¸äJ6”•Ã×TŒ¼Åå%’émr˜9<¬íoò×›÷â£„FÝœ¡¿Ó&ã½½ŽGVÒe€÷è%«ê¾rø|¾±Y«Ú¤ß” ~“½û ïÑS¶àGN³VŠ ^MâxƒMF¡ì3ÛFh¸ÏÂ¥õ”WßÍÇÐ›a¡èìÎ‡=‚™ë1Æ™½µ°þè=úã®èÔÝOÎúë_#;@‘Ä¢ÄnßÙéÀ¨—ýM~hã ýåRi{j….‘_\^•6T#×ês'‡¹}ÍAvPÛWŽÀß²±1s¤wp ¡Ä¿ƒßkCö‡Ï½¶ÒÞkß­ôš^ðªeå¤Y7&cTJ˜äÓ_õòÝJ)Ùeu^LÀûçÜºÅÈobíë’ža(×~¦AÑ	‹Úd‡ÕõôÚýZé–#GGr³jüìÉóÇ$yø½Ny9Ã	h€†Í¤Ç07×ÆG7/G­UÁ­®1+d?¿>%o ñÈ÷¸¯ƒ-ÊŠD]%‘¬[µV$Æ»û‚$hOwY©Zé(÷X^¼6ËnäŒzº“ý#ž|`~Cþ‚d6¾¿ÍRëÜýf’ ‡d©^õòÒ3•ëkÒŒ½¦xâÞ½H<nÉ[ÄpÕŒŽžÉÆÇS·5 ðEžÀé¦®ˆBm¾š2­Ð‘*ƒ±ýX$4hÌ¨í¨'üò#ÿØÍVý¯ûµÝnçÛ_çm¼ÿFžÔäI•F…ŸS?±‚æ^WuºSUí•×9&L:ãG…9‹ŠG_æãäÑìÉfþWÍTŸ#)r6²|ÚlFO„R²à|@6˜FèàòÇnY¿XgGÚS6|Ž†%ò“´°f»8°ÚSæcE`*”8‚oèkê;®3I“ÉeÆ§1ù¥b3G,g®4JÂ¨TºÜ†Á²´ßE³›<Ÿ31Ÿœ>`QˆûÊC&¢Ã$Wè:Š†æ…åûf±…•ªÙ¢ºg€¥à½Œ	¼wL ™KiIä<NllÍXë¯N[î:ëÇ€q½ÀYg¯ i€.Ø°5àLž«–H]Œx*ê€>¦DžYpz[Y³läÍœ¹5_ÃúâMßi4¤c²Äó1;ƒstµ	‚=üÀZ¯1ü/Š'–æarø@>¾Ö4t`\¾ØhpØæÄšAÇ6¦È5YóˆXêM“áÜXpÏµ/É¦ÇYèÅFƒ“›<CR=ó®šå
™VŠb˜4zÏG0u^ÍßÒK¯ëPÆ7n¥ñi¬úŒ¢ü ¥¦óal‰ÿ^¦¶ý´:-‰.ý—e$«
3SJ¤iÚ*µ¾Ä4YJòáœlÚ!p²:æ@ÅM~<Ó<®gÁàÅîôO,ˆ¦Ý¯³ÕŽ*fAáÓ¯À­ù%äš‘¡2'—yò“ÄfæO…ÈµH´·ºïk"¨ËÀ•òdc§ñÓý3íh÷Þ;*R£5ÚS)ÚCïjwÉ»Z»†k×-à.Už’Øª~R;}UZeú.í
i¦?·Ü›hI†±Ä/‹d3|üuŽì}i#âlÝ;tÄ
«Ž¶óà+ù–eaw>„ !(õë{Ü æøùÌÜŸ|f{¨»cÿø÷ÿ`·X¡þÇvæú¼xØH_n]¥6þšbFrÒKŽ‹™zô9ð®	TÂäm«J_Mšc\÷TqŒ‹¥Ö÷pz _æFÜ¨3Œ1V7Q%‹ÞÊíí:zÐYÉ®VÄ·~Ç[NR\Ù™ÛÇøq¶W¶Fh¸;²]À½'	ì|±5e'j‹ïW[‹CKÌ¨w½ÑÙÜNó#ªµªÛJñ&;-ã4fsb¯8Ù‹¸èp²£:§:¥BÙC:m‰ºýsã1”%´yÈÞ:±JÙâx0`Ãñ7v$«o£Yû9j× üJÛ·²fŸÖìðÜ‹0K.º'<K\›ë¡›õ\öÌ8¾•Ã[~*ÛŽ ÿÑr\ŒE¸zøâ€šä~%ŒÍw*±îŽ:³QnývŠO²¼QÏ®®lJ»ú7ÛžÂFÑ€¾ÔJ‚$1$â²<Á¿‰½â±ñì!7/–{Ç‡ðóÙðU›ç“‡Ü6ÃG«J\çž»')3Šþ“º{0BV
›•èXÊéq*6DW¤¬ ±1«ŒÍMÂk«csƒuå`\…¸J«”®KÓã¥ˆÓ¶:Ùç³wú )CM™:1Çf‘& 7ÿdÖ¾x©[—ZzM ªb®ÚÈÕY`	GÅé¼td¢¯ˆR,¬”«=A+‰íªÓ¶º€áê GóæºÊæm„é"ê²VSÇå-ƒÜÞ¬CæçE¢4ù’n¾µÁÂä›(¯ÍÜ›?Ëí*…ÖÝ¿åneËMO¯>XVñ°&x¶ôà?‘Kcü0ý{±CþRÈl'z–\Æ¡#ÿûJlÕ¾ù«ô/ÀkdÝ$ÃBUMþ·×ÙÃÓÞ›Äü«ÆK9  »f<­ ß	õªLS¯fSi`‹ð¦éôjõŠM6§ªõë.T§½›K’ÓµÔ°ö¬ê}Â;½½s]¯°0ºÁ<´·ìÚE“ûíûÛAÎæöÖÚÿC½û—ßØÝ>‚Ø`P÷xU_» ï9sh")‰/f) àÌ…a¤ù¾RUu~f3ÁðUš½®¤Ù3Q6P·nçj3õ›R
Úiî3â„è/U
Àoj)6ñ>š{ÁÌrf1ù|ûŸ€=@5mrÜV_ 'y\Qê6^Ã!Ó?²#ËqM‡iFöù’¤É+ÂáÄÅ®=B&ä€góˆ{á¯9Ýõ{ôOþõý]m¨»QŒw}$¶>~LšN™ÿ¸±]Dž»Åââ~>Yi]rR¦x¬ ‹YQSJ°ßGŸóó D¾±Z€NÓW˜L”šôõ€½ŠÉUÅ'1@$wÈ	Ej³—ƒ_6žìmuÚLv¤Ä¢BSŒ]&àƒbGÖÌ*û”(‡cŒdô?«Sö×Z%Ù<·‹l~Ž[%	J®´=×µüÐAmDß÷Ù ¤ÚKK.Å¦bàX¨p³êc4«Šde©{Þ"M´f‘aŠ)J YZÙ%üæ„â6¥Ä+%_Vhx«K&’X˜i¥Å|”›P¶#¾”G‘&Q[Çtfr9eÀïð;î	ss©ø[¹éMÁÚ˜Ùå¡a8‘3¤þˆ"ŒªÀTòWÜ`¿‹ŒÂÂõÆ¯Û[ä—•J0IŠ$üY•µÉæÓ-ÙºŽ=òo€LàK‚f¶I Uœ
6KnxxGÜ@sb‹î"ýð?­½gè:½Ágp>Ý­’¹¾4uØÖŠWäØ-àMl½Æ"´˜]‚×‰'^Ä¹Â5%ü¤0”“…wJËx™_¼Ž	©¯Nð£îÛ¼,aU+×OE?ÍUÕç
ICµ.œ×A¨O}aJ¹]¥¶7»&âðþ‹ÀÅ´ÃÇ–Ÿ¼®^¡ümÆmæ“tÓtažU,9ó4Íj=Ë
ÎDT“6©ïq†ýìÙÛþ›¯úç¬ÿsÿ-°6]ƒah}-•õov*ëßNX0x‰©ôÎk©a-™«þYç¿%_†Ø¸²ÜÍ•jÌ¥\JK]©±¦â‰iEc¼xÕ“•ó8ŠSÂ·hd,Ý÷1ðæå½õ§Á¨Ä±ƒž	Î‹[ÁH[ÒQ´¥B•Z™šÂ’úöK§@y.«Ž‚ˆ£8{öæÅ‹woúu°ü@èø	ìá“¼šDBÈ©A'¹ñ¸’¼µØRÆíZz“Óœ+¸úeaÝ\`Œ3¾’ÏHY¦Ô@Þ™MQ. €“ƒx>ÄÜ1‡·±”½½<ìÄÈÝóWô‡¶Ï^;WH?9˜ N6B`?œ[gƒöÙ¨­ÏxT3Å˜èÚ*1‰½%ÕB-ÂÂ®Ô´ ÏÔIõK7÷ŒõÑEµÀ5Ç«ô¯~„YAh?vÑÔØXQØ({æ»Þ¯ŠÂ²¸]Ï±ßsgf¯rÂq³Â‡¡3žÛ#ÊYA/%IRueËµ?×¡Þ7ÖGgÌËJb(hÈN02F¾Bv+:¢JÀD³ÅÃ"y„c§Ç^£øüÅgí TƒHzª;×€Ùé8aRœöîÊáëgoÞ±wçý×}Í ‰—8a˜ø‰N.=¤}Uó¦9T”’¯†Éø…qÅq dÿÕ±¯[«£dXújùÝ.¯9pãmg>·ƒ¿¡
œí³ÎVwgMÇqÕ7­©Î#_Ù¶Þþ–¨>Šrrjê	¡±fm
d¥¿²^Ä÷·ÃléxÑlùÊ%ŸsöIÎ"‡Ã
üúd‹ç8Ç7Šy£«^;ìô“7³ëËµoµSÎMro«4ä- ‘–’PizNLPkÆ’šÃ.žC ÌðÑáu5
¢öÿØ£ˆ#»qdßNãb§QZÁ¯ú@"ßšŸÈÂ´àPf‡æ!Îåv¯lxú²gb½ùv09˜éê}Õ‡25žËÜ¬—~&²Ô6=˜;=&"e°LF[YÇòîb&÷ít.r:‹‹ø§8¤E'µÊ“ªZ¥ØÂAzˆãºÛËü|Yg]7/„!þÛA]ä æVð«>¥ŠÂu•´4ó¥ŸÎ¦rMæ^vˆõï¾¬cé‹Q};’‹Étõ¾êã`ä“Ò¥ÕÌÍ}é2=-&u>Æ#ékÆ+OZsÖ:Ã,‰z'Ž´«?ò„Žyjï{»ÐÍ–ï«>£Ï×>‡~LOg~Úp<s'ç!Îç“OßÈú(w¶Þž½þÂ&%q¼ø&x.z2¥õûªæÀ·‚©k+ló^úÙ”Nš‡8šO{ìÕ«ó³/ë8N§‘ÿí .riå¾ê#XÊ$Sy Óù._+‹§âÖH·ƒ–QXJÓ³×Ùê±Ÿã`žKÉ¦iúÕÅÒ˜¾À…T°|í¾ê#ˆ:×@í‘±Ú5›õòµ­ü„,¨m­sÃ2rw"oƒÈ¢
Dó¡5â55r{b~„‰oøþF%ØÏìuÒ?ïã,Ÿ½9îŸôß¼è¿1ðw[.âšXó‘kÁc¿	
X)b€œowzüsŒùã^qªt±ô€eÊnãM\ÂÁ‰w=w½|j—ëmò»Äóm]Ç_c‚ì%R·rþú/ucL¼7üYù·vâ¼m¼ôô¦\GñÊqíf‡¶¬´?„Þ|EÊ»ÏÏè%—Ã@ÄØ×{m‹ZŸ•)éûÎ+û†Šé´r¥PÆ…R(T@èÂò‹©}³ºÆD²/i?¯í0„Æë‹žäÞÅBáâ}J7ñÒ¹›/öÝµÁª-ýlaxŠÅ˜L¾ör™ˆm1Jvê½X_g;½î·ÝÙV'•àråßîµÍÊLÖùË`s`~‰£ÊíNò5Òl7nÊêŸ¨óË/ß¦XÜürw–…»ƒ5ÔþæSbsŒä>Ø({í'A16tIfoCÀGXËé,ðH(òz§=•SÎÝÁ¹P
M´7XS„Ÿk_8v½Ð–âüŠ	èƒ¯"/8-Çw5¡ä´µA\Å@ÝB´o9PúÉVNú¤‹TÈÓ0uø¥.$’(ÏÔçü!„ƒaG¢‚—ÿ›b“Rœ‘
N‘PWQœY%¾E©8³¤GQ‡¥±#,YCð¸™ÐÑîÊhH³|IªP³½DÈOhqU cMªIqPµFaOipZ5bäHôÿþffU pœ•­k1févGVÇ(²@¤ôx©/â*=çÍ%tS‡ˆ4‡Ì›‹Ð,*•%kÓòÏÊ´õX­xiÆø3™ÑÕsÎmÐAa¿Ogu¹’òwÊï˜¬jÝ,ewƒÂ_Ï5½¤ÉÏXŸõ!nTö"½T¼§©5’¦*¦"R<_…¨ô¼QV¢òlê²=@(¼6pÁ].à2 £éúGÞx,x äà¶tKÓË‰å¸7?Ÿ‰>Ä·ò³±?’>œûºŒB¨,½Tº÷0;\tû+l/úì	—½o'_ù¼!ý™±Dbë+Àêªæá·ôáÁóŸ‰\à…uc¨(j¬‘ó¤\‡ìóÃqe™u«H•è‡oÀWzþð-øäØ³ø%2gÖØþó“M+©?C#±¥é<·B»=äw+Þ-Ã‹ƒwG??;>üù¸Â¦'¯TžkÍ[ÞüK	uhëÌþ˜ÈÎÊjò·Lz’Ý)Åhl÷-±’Æ)éIúÞ|tÒ´·«jC9Žñ‘õË/ªî~Nn^[¹€Eý“ÚçÖebˆ…à†f]ÒÇ%ðÒ¾áÍÑ6}î½H<Ÿ%µŒÎ¡^qr$_‡ñCë£ÝçØüæÔÃ0ó7šálÙ-ôÑ#^"žÔþŸ¢2'OtñLg[ÆãCþòÁ­Ü”BÞdÊ|‘«²Íý¤á×ÒuÖT…ý3±Ükå'Ú¼oÄÒ¸r(S—Rln%˜]jk RHrå±\~³y"¹·Îµu#J¶ÃÒY¡öI‰miÃAGvÈ¶Ô¶ùªüqyuJ…=sAÊ¤äêjC¸\._ßB®Š·D
s2¾Ê™ÍÜ±ª0hí„hRôž<(7Xd9—ÀÒÔ¯T­M3}²ä”Óxí¼ ÉrºxâknõÄ½&Ë×Ü'']Í_âÈ×”i=e7£¥¶ÿH?¾‹Â×¦öÁâÁºÀPô]·Ÿ‰!÷Úbá) w#xˆƒqXa·ñ'ËC,³[K:u¾Ÿ3ª>/¯¾±–]16*R¥Àl+²{©q¾ðx••±Þu9elf3}eÏ.-×aS›¥ìˆf-t­3ý5¬Ü*S)¬ë_«‹ùd…{àÑ¶3Ê­°0ÔcþY¹à}mEŸ|h<%6†ý†~»§?0«)bh‹FoÞ3zÞþVv+R¤!eßÓ"#’ä|×ë_NÞ^`òêÄõÝßµ³\µâûcáž”þLO
b¢søaÚz£6Úª%¹J%+¢uk“Y3¿y§è\ˆ!H‘­µeæ¥ÇÌJÁHYiq|Y%t£:'5å×÷Êðr+áÝ}Ó}Ó#ÆÌ1~"à¢Aöá
`«åZÓ!šÁ=ªÆæf~«ÉÅ¦û0ÇèoÃ˜“ñÐ]guu­^\ºÖ|jêªš\q#5¼ÖpdÙè†Âí€@ ›4˜[>Ö@h;áQìNá,—~z³Kgn~Šf.œäÒï¼8›ðrk61¼¤‰µGÞ0Æ,¿íë €©õ[ãÆðÚŸÀ@Í7¿üz£b¡Ê&(ñûá÷¹sÍ6U/ûê«xæÇ Rä4!Né+›¤–ï7:*wq¿6ðú‹omvËBçw»Çú;?°™Œyu·f³X½lÝEeXo9eº²fŽ{ëAzp–B ËÀÍÎÕŒòjOl¬­ÐcöÞŒhuý§íííeŒ¤œœ´rÐ±YFË¼4ðmâR8äz`A“O?,½ÇÑ:‹&i—Ð°ÿ‰…žëŒØÚÚÚú«%a­ŠÛõ?Ý·C ­÷ƒ6 ‡÷:ûæÕCµM¤Äî`EÀÁ
nññîÿÒÂaàøÑýÏdBpx Ñ„,¹O¸¶µ›ÚOçÆ»yßƒ8±ð¾ H,„ákHvñRR§!º0·¶f~ŽîÊR½`¦R¡¸ûD*;#Ë‡S¾+ÉõŸ¾dÑ>¹Îû#*h«¨I÷DßÎNž¯š¯¹
,}cÌàŸÔÁ©:ëŸ={{1xù_ž~]íï¬¾oW¼1âã”!kÊë—Ã>ÍÜyØóVã`ÞÃZ‡3+Ü˜9ÃÀ½«¶oÖó®®œ¡-þ¬Š7®Þ¸öÐ—ž?XD‘ßÛÜ¼¾¾n_o·½`¼yþvóí³ãÆÎÖjÓÓ¸ —µ?!†'VÚÌ!ºÚxÒ¸ï”AËX«…«Å™©<ûôý-þm©¿K¾qŽæ«ÐÛÀÇ7¼Àp¡Š=æ{U'’¯öîÎpAÖKÉlõÇrÌW#Ò¨;?*q_»‹õÿG0BYÀ˜‘3´ÜËuÆ°¼‘ç/Òï‚<ÐbœÏ‚üN•hr?‰°éz-Æžà·¦ž£âK×»<¢u[¿®þ×øÊ¾ºÈ—°ôûu€ÔJÀÁ°|¨	ÄÍYÈQå]cþ‚÷.tþîíi{ØVdóâçð½…ãZ°Q8”Sh5ãY¨ég®ßZ«Æu
²[lOû
š…!/ôú(‰m‚GØ÷±ïENRðñ]kh·6ÿkø?oŽQk²ºv‡ÜWãÝMg Õ†=³ç£ã‰ãŽZ8šÅV`ˆ\DSæ¯8”Àž?¶ÐPÜaÑ°)Ý¬àSãèÃ[C“ëÝ|O0rô@Ÿ®â®|”"×ñŒhàAãb«ˆò@¤ªÊý¨Ú´‚™'µðhv‹~—7+Õ¦/y¯Îb×™L­ú¸çÖhõrŽl×ŽR×·â¬©ÀÛº)d¡ÃÌ/N»]^†¤,#73
7ŠûX/Í
ã™/ÙâõÄÖ4°­ð AÅzˆ2ùŒPï#¼u™d'“KÉr®›|À˜>;©GÇ_èÖg¾ù‰{öªÏu±ø\W2tl$å¨g—Ûõ©.Ê–“´¦½tæVlŽV·›úÂáºÖw¤“Å Wÿßž]Æ€J°à9úSLÑ§gN½Â½Y<‚Œ2r@N˜;ÕýWF.OW5 |^}$µ.J=¹0&^b¦b¢³¤s4±YL¹W°–öÌjPb´äØÕMAP§õÉ³ åB¹êQ>Þ5~®ôö¢JçJ•ÂS¸Šu_1eº'^â2WnøÞXŠ”˜pðöàÜíåC“÷JuÍó8ÔfÖ,¦åª"uÎg³bŽõE–g·*»Ên-Ã«z¦FD–ãÌ¢ÌúçgÀBEñ”Í8Òàž¦ÌùBÛƒ•<Â—iõ˜y°…Nä˜²œõ_²K; œ` _ß·Êæ}|ÆFpãü¬]£¯3ARzgE@o	†yÙ{XýÀsÃ<ªp­/Ž úFŒ|©ÂF¹Ù²3X~óò½TÙlÍõÜÿ_FxevŒ¼::YQäçsÊ$¶ŒßvŒjûšäN®²‡M} 3o¡îS•¤CuÉ.'2ÇZv?Qó°˜ñû[?é›%è_xŸpPÊ¹¨Í´˜.Ùr’,âeÆAöw€±¾ÿN>ÿÌ;ùüëÛÉç;¬õÜsom¹|-î9¢¶°`Pè¸ˆ£9"ßÌnHd¡åèÓwŠ`†zo›û@¡’m¡bk™áÈ	Q_<:¸E¦è‚™šÑ,)În’Q6'‹gô_ä2È˜ÃÃfz!º›m<-ÔÌ.œ‰dJ=8EˆQª*$æ‡ F$>IØìlUçìÂË²“5…¹Š<ycI¦/ô9“I{:î1}Äl—’º>2x›ûè™µbÞ¨Ò
HÇlàÌüšì¯Ô±é)(ãaÌ<ƒ±0çžFuy’k9 ,k>q	ž;á¹ »êLÇ˜·rª¦ß¥%gíN@ Ó[~éø”G($)déä´rQÀÍìwê¸hÕµdôš‰·:þä¾¨uGZ—…D5y|Í•…Ôs~KÇ‚úê’#ê<^àü;j¹ÄV—:aÄ¼+ö3jŸÙ.žÞ¹™É&ã#õ•bî¯ùÙ•4?‰>¦JÚkX§ÛQ:¬ß+Ÿ÷ÊáÙËÓ—?õß°×˜ËûìÙ)úIÃ×V!úÍ7ÖP¡aMÁ<§`&°ÎFºmY9ÄX~–ìŸCÏõ©ìj”äÕ2¿‰6ìvLÑÕÕŸd)[kœÒ
ãKC7"nŽuBÍŠHþæê-€ÅÁÜÔýÝ0{mrQ ÃÜ\¯àcò3£E2o¯ Wîð¼”z©ò“!Çñ}3W¯d§»PÔW€(WyÄÚÕÆöŠòr&÷Ï™B678HÌx™›‚ÍáÌ\RcAWe}È:YŒÖÙAàÍLh™]2ñfwK
Å|Ì»t¶%¯#09vÎœun@ªc¯ìÐr­	òÊÍmYmÈç-‡ý   ÿÿä]ýnÛ8ÿŸ‚5z°…µe;iÓ½4I‘MwoSlw‹6‡; (ZÙfb5²dècãœaàÞáîÏ{º}’›!)‰ú–h©Ùb	4µe‰Räpf8ó›ÂqËû©Hõârf&Ž?QkùäÁ„Ô	ÂóÇQ *&/ÝþÝhŠç"ð§dáãrLÈ¦ÅB„ø*Ž3Õk¾¢¾kx6£ôµ2`7ÅÍ½ÁËÃÌÄ¸Ìü¹^:W!ág²/Í¥°œŒ—‡JÁrÑ‘¯|(‹QøIKJV]ã)°oÌð~ñ†Ä2¬€ÜZæ-é%í=„'4e˜dMíûÀcÄG'-3êÎà!œ_Ö8Q®ñbMYã[e
v7iè£…Ê_Ê|V…--V+L–Ó×A`uR>(ŒŸþíf;xH+ZÊ4<È t•Û¬÷Ïg®UNö"1ìž$3m¥x3¾ó†‡‡¡§Á¨r·F±ßÐtÏYÑµXü8µtx÷÷ÕŒî¸6íÅÀÀLïÀZzDÑ0&NÓ^èžïs¿éâÜ_—È…?ŒÇä'já¡!L4ŽÎ'™Å¨d¸º¸µ­ûŠ¾£Z"žú™ÕÃG!„¾Â˜f-üP­¢`lé#ñ¸ªý~¹4Å	Y—YD×
)¨Ãøƒ+tLÅ¤.¯a¥/«|)CµgEÎNÉ‘Æ¢GV>™’Áßû³iqß ¼t —¨m¬µòwÏ‹Í~µ¬v š »R«D4T ˆ çº¶€¥	‘æÀ s +á¢…I©½¥ÐÈë „4ÁIîú©ÝXº ×Ân$u$ÜÖˆÀ’‚Ã1ñ¥Ñÿýßÿ%½Q¢¯!0ÚêGïåÚêúÕ„¥Ü”	ÁÚjÇ¹GÔ)¯414§K®á#Že.<?:.g­17­i€N—Xò˜Å Kç~à½êÿðBç¦aµÀÕ¤´ò$JŽ«u±7#ß¹äÚuVIñÅùÔ°Ò¢Œ|žã×[$pa&yÄwfêžNžÖ99Œ®%ŸÍþÀ±›V[¾ÓE-~³îì@pR›zî¿£˜-’¼ZlèºÞ¼®äxþæ+¶qøcã>4f<mûp,o{‘f–(³÷šŽ]8‡¤Ä×°›Â-0´ƒŠÛ@âÛî´!‘:{ŒØ(d´Z~Ÿ30ƒµKcâãZÀ/©çÃËÒÅax$EXö¢!ÂBUW°îIqæåÂœÁ>…¢¹ÞÛí4­F^¸¢RÄ©B$¯¶Ø¨2GŸÊÚ°žÅv•:'iye˜òfÂ1W›ÔÊ®å›7T¿‰*ï¹È®ÿL-bJQ‚®c$"[^è’’·Çß`]!¨nÚs+XPyŸ×4!¦+¯ë×¦óº²óuûžsk¤É±z§}­Öfá€´ÌT“þç–U ¥Y÷K,EÜ	Xµyã´Í D­•<JºïáØT…c€ð6árhúdúÇæ\Xr©|ýKí “¥æÝÞ·½Î°ÊÊEÞôõ¬°ƒ?ö
kˆ0T³öºh†õn«6‡·®€d­`G	Ì›±l	ÄÕñ‡eñƒ¯Ôñ%ªSq.>i—œèÉ_õ$j8“~R9`,·új»R ^¯¹B%ŠUM1]ØÞvda¸fåŒÔ}Ô††]U»øg† Žiâ9WE:ƒaOþ¢ÒŽbYöè›eÇËí }Ì¯7mÙwÓ¶kCgˆØ×ª—oË‹˜3å­¨?/y_J}KþŽX$25<:ÂÐ´ÊC~—Zcwië¿ZÂÌé6‚'üô¸þúT';}º(2†Ô42fžc ˜˜¶GýQìÀGº	‘»w¦·§2çÉ!Má!Ã¼0@P$²ûJÂU§uãž›¢PmïýdàiØ77ÁNjÚ&ðÅ5F•Ò>¿3ný€Ìèê]pÙ6}¼2Xœ(|ü`ÍÜ"f®sçA/0n]ï5n* ’7×?­©wk[JzÖFK¶¶ß«…#\e™h½ÙB°öV±÷lýóL*Å£óBépíYƒÀ“¤Ä'•¦yó®
JÛ2O·9L,œÐøXLjäBŠð½³_œ“±¿l‘šfŒzg…éaÉxÒ;»€Em¢]Íb·ü‹7ÚƒSv|2„]ý;·—äRwÞ>yÊÓü`‚”:·†g’Woº§ª”˜§°æÞR{nØ¹‚­ãÆ°šSO4` X#è¼Ÿ¡JýŽo.@¥#âƒ*ãÛæ;(±j	µ.@R(õ	sm‚*Ð	¨ØÓé¤×M}w§æ0¹èE‘r"¬pùôHøCSM¦Ò¼YîNÄê(€÷aMQZE·±ç#×(ÌoVâBTN)Kâ!ü>Ö™t*Crùê>c0	þ"Í¸•L=$†¿¾D-ã~&;•WÇ)îšN:Ìé``ÌçCrÃf(|$ß¢kìèØnô°qñN‡ðB‡d¢)\Ñ6[7.tþ¨¯¸wLc}[§‰f6ã‰_æ^QàÌÚ`pVú”†áÊ¨Ov
sIê&#‡÷?Ù…ýú÷Õvì®¯im„UëkË`™6¡£ó%ßþ"ÝÃ¼÷w¡'Ÿæª”4ŠT** 3r?;Ðe›Üoù„ÀObÌvŸ’y¸Òq.ã\8uÛrX%1Žš §°Z£QØŸÔ¨*®óÓ­ø°+“Œ
¶u±ù3PÜ‘ï¬ó%,Ã†[.|6 +šîŸ!, 2ì™ô#QÛþ#ý£Š+Ì»òÏ0Ä	CMEgQæÀ?B[Ý†.:è9WÁä­þO1à2ƒ>P9À(¥4Hd¾´LÏ-LoŽŽÄO¢³šiÞ[¬Ê¦¸ª²MÈ8°õ‹m¿Ý"]NXj?ØC¡™ÝÙöF÷×»“±e¶ß¯"èQÕr2öHâ”­­­¥ÐÄO«¨´0T{W€Ë9/âº	»ù£í¸+Ãâò|Í"‡}ö«ìÁ/Ü>ÒÞeLNEÉüÞÈc\“!9œh¨"õ7›M_ÓD(¶pöa2`˜ƒ0ŽÒOyêÁVfÅ6"¬4€µi)v‡ÓŸŠÓ%–ë¾í©*F¡}f%²ðvÂyj_¦øÌœâ[UaÕ3¸œGàhõò)Ž\ÁOï+tœ-s×°Ä©tOí³ªˆˆ?>L ˜Rfîõuqi¿ŒTeEB¦Àa—|»;kKè8Þi#I§ôN›Â‚îö)·÷Ð¿¾ó¶+×Èq8»:%¥›…ÈjV1ßÕª¸še(ŸeFŸ;)årü#ÄˆÃI8Âµ3¼cÜÉ¥Ý9Ï¥æBXVZãäÒ¶ø[ˆ_„8å ¸å¤PÞ˜v*oDÍg¼ÒòÁ
X ¨XøßNwºª³•Qeêb,6JdÝˆžýÓMæ•/(»gDw•H‘º%óúL›å+›YÎü–”À›I¡±.1LÆÏ&yÒ‘×Ý®Í®Ö–ßÿ÷áïøÒÄèÂn¬£yÛº} ÕeÐbux|RÆ4žD`aŽ˜Z"fZþþCÅ-[	”VæbaÑ\tÃT·)´´zB>Üµ«——2æÀÈÍŒ¶Ãp’ðPy‰Ü›¶"7tœ=lm€Â’(Ýw~vî¨{a`ŽÛ˜}÷?¯ûhYÉŽ,ó6Í\Þ‘Woj"ÇÕ)m²%\¡ý‘Bøu–¨‡Ye‘)®ååò%ÌWI!!·ºœ³Ù5Zo—µÝ¹Qvº2`IÆ`öŽâ.ÿ‹É(…hnürŠ‹á·	ç´ÒÆ¡ãO¸ ¦m“#ÉŒ[qs÷œH ¯•áA¥üë'éPFçI^ÉØæx@áß×8	˜×†ä½Å#ÃÈ*ôœ‰\K†±½õ£{bË
uzNêÝucÈ.Á¨ä‰ßº‘ÚóšMÀæ¦”:ÓR7ù¥qt"x°¤ƒ‘¶’mÁoLþ@´š—QÕÄ¾¹]¾ìcþÝ…y©í ØŠ9‡++„ƒ+ÞÒq}ø~OWº¡øuŸÒ‘ÎªN¾Ëí§|-UØÜÂ7)i¤¹ô›ŠeÃ)ûi+Mœ’'ÌvÚå¸Nií/¯l+†á«š_TÛò $e„/Ç£ÅúŠ£X™æ%šm£²e”ñøÔÁxW,ÿÜ¢®aºótTÑ!3Åã_oéb(ã$drîÜÞø¬IR„°ÊïQ.1wÍ5ú`~M–ÑçvË¦õ×=kPˆì
‹ây×Ná¹¦Ï4‘`0~¤n\"‹lx¡â–‚.ï´"¤çÜ‹,5ß¼,âó9õ<âc®*b;pÕä…y[¶žœßª`þµ¹a©£}ßY€ÿbfPøÿ_å´A:L2t˜ƒ ½)Äþ†Ïà±9mšÍå¡Rà_Ò¨âÁFáÌ°3`³j6–„TÏ³Ó¶×;%00‰t0CxZžPŸQ—a§#$Ë˜õhD+õ²JKwŒW†µ%Ý}„)‹½ßŒÇäÂ¥¨¥9.Ê¡,ÙuŸßäoÂ¸Ççá”>‚
;ó ?"¶°¸úýýåbÐÇÛúÚ£çÒS0”üøñíçWßþúëÕÇ¨ÛÏoáöÔYñè)k:‚ÿé.…éàNÎ×kÐ’µçÿ  ÿÿ ¢†Y»