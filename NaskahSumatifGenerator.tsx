import React, { useState, useMemo, useEffect } from 'react';
import { 
    FileText, Download, Sparkles, CheckCircle2, AlertCircle, ChevronRight, 
    Printer, Copy, Check, Eye, RefreshCw, Settings, SlidersHorizontal,
    BookOpen, Layers, Award, FileQuestion, GraduationCap, CheckSquare,
    HelpCircle, ArrowRight, Lock, Unlock, ExternalLink, Calendar,
    FileSpreadsheet, PenLine, FileDown, Image as ImageIcon, Sparkle,
    Edit3, Trash2, Plus, X, ChevronDown, ChevronUp, Palette
} from 'lucide-react';
import { generateGeminiContent } from './geminiClient';
import { CurriculumData, ElementData, Allocation, TpGroup, AtpItem, isSameSubject, isSameClass, getSubjectKey } from './curriculumHelper';
import {
    deduplicateAndEnsureCountPg,
    deduplicateAndEnsureCountIsian,
    deduplicateAndEnsureCountUraian,
    generateAuthenticPgQuestions as generateAuthenticPgQuestionsFromBank,
    generateAuthenticIsianQuestions as generateAuthenticIsianQuestionsFromBank,
    generateAuthenticUraianQuestions as generateAuthenticUraianQuestionsFromBank
} from './questionBankHelper';

export interface UserIdentity {
    authorName: string;
    nip: string;
    institutionName: string;
    npsn: string;
    kepalaSekolah: string;
    nipKepalaSekolah: string;
    location: string;
    assignedClass?: string;
    semester?: string;
    academicYear?: string;
    [key: string]: any;
}

export type AssessmentType = 'harian' | 'asas' | 'asat' | 'asaj';
export type OptionsLayout = 'horizontal' | 'vertikal';
export type FontFamily = 'Times New Roman' | 'Calibri' | 'Arial' | 'Comic Sans MS' | 'Bookman Old Style';
export type FontSize = '10pt' | '11pt' | '12pt' | '14pt';

export type VisualType = 
    | 'none'
    | 'clock_0900'
    | 'clock_0200'
    | 'fraction_circle'
    | 'fraction_rect'
    | 'shape_rect'
    | 'shape_triangle'
    | 'shape_cube'
    | 'cube_net'
    | 'plant_anatomy'
    | 'water_cycle'
    | 'food_chain'
    | 'garuda_bintang'
    | 'garuda_rantai'
    | 'garuda_beringin'
    | 'garuda_banteng'
    | 'garuda_padi_kapas'
    | 'traffic_sign'
    | 'chart_bar';

export interface QuestionPG {
    no: number;
    stimulus?: string;
    question: string;
    options: { key: string; text: string }[];
    correctAnswer: string;
    explanation: string;
    cognitiveLevel: 'LOTS' | 'MOTS' | 'HOTS';
    tp: string;
    indikator: string;
    materi: string;
    visualType?: VisualType;
    visualTitle?: string;
    visualSvg?: string;
}

export interface QuestionIsian {
    no: number;
    stimulus?: string;
    question: string;
    correctAnswer: string;
    cognitiveLevel: 'LOTS' | 'MOTS' | 'HOTS';
    tp: string;
    indikator: string;
    materi: string;
}

export interface QuestionUraian {
    no: number;
    stimulus?: string;
    question: string;
    correctAnswer: string;
    cognitiveLevel: 'LOTS' | 'MOTS' | 'HOTS';
    tp: string;
    indikator: string;
    materi: string;
    rubric: {
        score3: string;
        score2: string;
        score1: string;
        score0: string;
    };
}

export interface GeneratedAssessmentData {
    id: string;
    createdAt: string;
    assessmentType: AssessmentType;
    subject: string;
    className: string;
    semester: number;
    academicYear: string;
    tpSelected?: string;
    fontFamily: FontFamily;
    fontSize: FontSize;
    optionsLayout: OptionsLayout;
    pgQuestions: QuestionPG[];
    isianQuestions: QuestionIsian[];
    uraianQuestions: QuestionUraian[];
    totalScoreMax: number;
    difficultyWeights: { lots: number; mots: number; hots: number };
}

interface NaskahSumatifGeneratorProps {
    user: any;
    userIdentity: UserIdentity;
    selectedClass: string;
    selectedSubject: string;
    activities: any[];
    lockedProtas: Record<string, boolean>;
    currentProtaData: CurriculumData | null;
    onNavigate: (view: any) => void;
    notify: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

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
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env) {
            // @ts-ignore
            if (process.env.VITE_PROTA_API_KEY) return process.env.VITE_PROTA_API_KEY;
            // @ts-ignore
            if (process.env.API_KEY) return process.env.API_KEY;
            // @ts-ignore
            if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
        }
    } catch (e) {}
    return '';
};

// --- AUTHENTIC ELEMENTARY VISUAL GENERATOR LIBRARY ---
export const renderVisualSvg = (type?: VisualType, title?: string): string => {
    if (!type || type === 'none') return '';

    switch (type) {
        case 'clock_0900':
            return `
            <svg viewBox="0 0 160 160" width="130" height="130" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
                <circle cx="80" cy="80" r="72" fill="#f8fafc" stroke="#1e293b" stroke-width="4"/>
                <circle cx="80" cy="80" r="66" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
                <circle cx="80" cy="80" r="4.5" fill="#ef4444"/>
                <text x="80" y="27" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">12</text>
                <text x="135" y="85" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">3</text>
                <text x="80" y="143" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">6</text>
                <text x="25" y="85" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">9</text>
                <!-- Hands showing 09.00 -->
                <line x1="80" y1="80" x2="80" y2="34" stroke="#0f172a" stroke-width="4" stroke-linecap="round"/>
                <line x1="80" y1="80" x2="38" y2="80" stroke="#2563eb" stroke-width="5" stroke-linecap="round"/>
                <!-- 90 Degree Angle Marker -->
                <rect x="68" y="68" width="12" height="12" fill="none" stroke="#ef4444" stroke-width="2"/>
                <text x="80" y="156" font-size="10" font-weight="bold" text-anchor="middle" fill="#64748b">Pukul 09.00 (Sudut Siku-Siku)</text>
            </svg>`;

        case 'clock_0200':
            return `
            <svg viewBox="0 0 160 160" width="130" height="130" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
                <circle cx="80" cy="80" r="72" fill="#f8fafc" stroke="#1e293b" stroke-width="4"/>
                <circle cx="80" cy="80" r="66" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
                <circle cx="80" cy="80" r="4.5" fill="#ef4444"/>
                <text x="80" y="27" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">12</text>
                <text x="135" y="85" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">3</text>
                <text x="80" y="143" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">6</text>
                <text x="25" y="85" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">9</text>
                <text x="115" y="44" font-size="11" font-weight="bold" text-anchor="middle" fill="#64748b">1</text>
                <text x="133" y="62" font-size="11" font-weight="bold" text-anchor="middle" fill="#2563eb">2</text>
                <!-- Hands showing 02.00 (Angle 60 deg) -->
                <line x1="80" y1="80" x2="80" y2="34" stroke="#0f172a" stroke-width="4" stroke-linecap="round"/>
                <line x1="80" y1="80" x2="118" y2="58" stroke="#2563eb" stroke-width="5" stroke-linecap="round"/>
                <!-- Angle arc -->
                <path d="M 80 60 A 20 20 0 0 1 97 69" fill="none" stroke="#ef4444" stroke-width="2.5"/>
                <text x="80" y="156" font-size="10" font-weight="bold" text-anchor="middle" fill="#64748b">Pukul 02.00 (Sudut Lancip)</text>
            </svg>`;

        case 'fraction_circle':
            return `
            <svg viewBox="0 0 160 160" width="130" height="130" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
                <circle cx="80" cy="80" r="68" fill="#ffffff" stroke="#0f172a" stroke-width="2.5"/>
                <!-- 6 slices, 2 shaded blue = 2/6 = 1/3 -->
                <path d="M80,80 L148,80 A68,68 0 0,0 114,21 Z" fill="#3b82f6" stroke="#0f172a" stroke-width="2"/>
                <path d="M80,80 L114,21 A68,68 0 0,0 46,21 Z" fill="#60a5fa" stroke="#0f172a" stroke-width="2"/>
                <path d="M80,80 L46,21 A68,68 0 0,0 12,80 Z" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
                <path d="M80,80 L12,80 A68,68 0 0,0 46,139 Z" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
                <path d="M80,80 L46,139 A68,68 0 0,0 114,139 Z" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
                <path d="M80,80 L114,139 A68,68 0 0,0 148,80 Z" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
                <circle cx="80" cy="80" r="4" fill="#0f172a"/>
                <text x="80" y="156" font-size="10" font-weight="bold" text-anchor="middle" fill="#1e293b">2 bagian diarsir dari 6 bagian</text>
            </svg>`;

        case 'fraction_rect':
            return `
            <svg viewBox="0 0 200 90" width="170" height="76" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
                <rect x="10" y="15" width="180" height="50" fill="#ffffff" stroke="#0f172a" stroke-width="2" rx="3"/>
                <!-- 8 vertical bars: 3 shaded -->
                <rect x="10" y="15" width="22.5" height="50" fill="#3b82f6" stroke="#0f172a" stroke-width="1.5"/>
                <rect x="32.5" y="15" width="22.5" height="50" fill="#3b82f6" stroke="#0f172a" stroke-width="1.5"/>
                <rect x="55" y="15" width="22.5" height="50" fill="#3b82f6" stroke="#0f172a" stroke-width="1.5"/>
                <rect x="77.5" y="15" width="22.5" height="50" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
                <rect x="100" y="15" width="22.5" height="50" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
                <rect x="122.5" y="15" width="22.5" height="50" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
                <rect x="145" y="15" width="22.5" height="50" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
                <rect x="167.5" y="15" width="22.5" height="50" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>
                <text x="100" y="80" font-size="10" font-weight="bold" text-anchor="middle" fill="#1e293b">3 petak diarsir dari 8 petak sama besar</text>
            </svg>`;

        case 'shape_rect':
            return `
            <svg viewBox="0 0 200 120" width="160" height="96" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
                <rect x="25" y="22" width="140" height="68" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5" rx="3"/>
                <text x="95" y="16" font-size="11" font-weight="bold" text-anchor="middle" fill="#0369a1">Panjang = 12 cm</text>
                <text x="182" y="60" font-size="11" font-weight="bold" text-anchor="middle" fill="#0369a1" transform="rotate(90, 182, 60)">Lebar = 6 cm</text>
                <rect x="25" y="22" width="9" height="9" fill="none" stroke="#0369a1" stroke-width="1.5"/>
                <rect x="156" y="22" width="9" height="9" fill="none" stroke="#0369a1" stroke-width="1.5"/>
                <rect x="25" y="81" width="9" height="9" fill="none" stroke="#0369a1" stroke-width="1.5"/>
                <rect x="156" y="81" width="9" height="9" fill="none" stroke="#0369a1" stroke-width="1.5"/>
                <text x="95" y="60" font-size="11" font-style="italic" text-anchor="middle" fill="#0f172a">Luas = ... cm²</text>
            </svg>`;

        case 'shape_triangle':
            return `
            <svg viewBox="0 0 180 140" width="150" height="116" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
                <polygon points="30,110 150,110 30,20" fill="#fef3c7" stroke="#d97706" stroke-width="2.5"/>
                <!-- Right angle marker -->
                <rect x="30" y="100" width="10" height="10" fill="none" stroke="#d97706" stroke-width="1.5"/>
                <text x="90" y="126" font-size="10.5" font-weight="bold" text-anchor="middle" fill="#b45309">Alas = 8 cm</text>
                <text x="18" y="70" font-size="10.5" font-weight="bold" text-anchor="middle" fill="#b45309" transform="rotate(-90, 18, 70)">Tinggi = 6 cm</text>
                <text x="105" y="55" font-size="10" font-weight="bold" fill="#78350f">Miring = 10 cm</text>
            </svg>`;

        case 'shape_cube':
            return `
            <svg viewBox="0 0 160 140" width="140" height="122" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
                <!-- Front face -->
                <rect x="30" y="50" width="70" height="70" fill="#e0e7ff" stroke="#4338ca" stroke-width="2.5"/>
                <!-- Top face -->
                <polygon points="30,50 65,20 135,20 100,50" fill="#c7d2fe" stroke="#4338ca" stroke-width="2.5"/>
                <!-- Right face -->
                <polygon points="100,50 135,20 135,90 100,120" fill="#a5b4fc" stroke="#4338ca" stroke-width="2.5"/>
                <text x="65" y="90" font-size="11" font-weight="bold" text-anchor="middle" fill="#312e81">s = 5 cm</text>
                <text x="80" y="136" font-size="10" font-weight="bold" text-anchor="middle" fill="#475569">Volume = s x s x s</text>
            </svg>`;

        case 'cube_net':
            return `
            <svg viewBox="0 0 180 150" width="150" height="125" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
                <!-- Net of cube cross shape -->
                <rect x="65" y="10" width="35" height="35" fill="#fdf4ff" stroke="#c026d3" stroke-width="2"/>
                <rect x="65" y="45" width="35" height="35" fill="#f0abfc" stroke="#c026d3" stroke-width="2"/>
                <rect x="65" y="80" width="35" height="35" fill="#fdf4ff" stroke="#c026d3" stroke-width="2"/>
                <rect x="65" y="115" width="35" height="35" fill="#fdf4ff" stroke="#c026d3" stroke-width="2"/>
                <rect x="30" y="45" width="35" height="35" fill="#fdf4ff" stroke="#c026d3" stroke-width="2"/>
                <rect x="100" y="45" width="35" height="35" fill="#fdf4ff" stroke="#c026d3" stroke-width="2"/>
                <text x="82" y="67" font-size="10" font-weight="bold" text-anchor="middle" fill="#86198f">Alas</text>
                <text x="82" y="137" font-size="10" font-weight="bold" text-anchor="middle" fill="#86198f">Tutup (?)</text>
            </svg>`;

        case 'plant_anatomy':
            return `
            <svg viewBox="0 0 180 180" width="140" height="140" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
                <path d="M 50 145 L 60 175 L 120 175 L 130 145 Z" fill="#b45309" stroke="#78350f" stroke-width="2"/>
                <ellipse cx="90" cy="145" rx="40" ry="7" fill="#522e1b"/>
                <path d="M 90 145 Q 92 90 90 42" stroke="#15803d" stroke-width="5" fill="none" stroke-linecap="round"/>
                <path d="M 90 105 Q 45 90 50 115 Q 75 120 90 105" fill="#22c55e" stroke="#166534" stroke-width="1.5"/>
                <path d="M 90 80 Q 135 65 130 90 Q 105 95 90 80" fill="#22c55e" stroke="#166534" stroke-width="1.5"/>
                <circle cx="90" cy="42" r="14" fill="#facc15" stroke="#ca8a04" stroke-width="1.5"/>
                <circle cx="90" cy="22" r="8" fill="#ef4444" opacity="0.9"/>
                <circle cx="110" cy="42" r="8" fill="#ef4444" opacity="0.9"/>
                <circle cx="90" cy="62" r="8" fill="#ef4444" opacity="0.9"/>
                <circle cx="70" cy="42" r="8" fill="#ef4444" opacity="0.9"/>
                <!-- Numbers / labels -->
                <text x="145" y="42" font-size="10" font-weight="bold" fill="#dc2626">(1) Bunga</text>
                <text x="22" y="105" font-size="10" font-weight="bold" fill="#15803d">(2) Daun</text>
                <text x="145" y="115" font-size="10" font-weight="bold" fill="#166534">(3) Batang</text>
                <text x="90" y="170" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle">(4) Akar</text>
            </svg>`;

        case 'water_cycle':
            return `
            <svg viewBox="0 0 200 140" width="165" height="115" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
                <!-- Sun -->
                <circle cx="30" cy="25" r="14" fill="#f59e0b" stroke="#d97706" stroke-width="2"/>
                <!-- Cloud -->
                <path d="M 120 30 Q 110 20 125 15 Q 140 10 150 20 Q 165 20 165 35 Q 165 45 150 45 L 125 45 Q 115 45 120 30 Z" fill="#93c5fd" stroke="#2563eb" stroke-width="1.5"/>
                <!-- Rain drops -->
                <line x1="130" y1="52" x2="125" y2="65" stroke="#2563eb" stroke-width="2" stroke-dasharray="2,3"/>
                <line x1="145" y1="52" x2="140" y2="65" stroke="#2563eb" stroke-width="2" stroke-dasharray="2,3"/>
                <line x1="160" y1="52" x2="155" y2="65" stroke="#2563eb" stroke-width="2" stroke-dasharray="2,3"/>
                <!-- Ocean / river -->
                <path d="M 0 105 Q 50 95 100 105 T 200 105 L 200 140 L 0 140 Z" fill="#38bdf8"/>
                <!-- Evaporation arrows -->
                <path d="M 50 95 Q 55 65 50 45" stroke="#ef4444" stroke-width="2" fill="none" marker-end="url(#arrow)"/>
                <text x="52" y="60" font-size="9" font-weight="bold" fill="#b91c1c">(A) Evaporasi</text>
                <text x="145" y="15" font-size="9" font-weight="bold" fill="#1e3a8a">(B) Kondensasi</text>
                <text x="175" y="75" font-size="9" font-weight="bold" fill="#0369a1">(C) Presipitasi</text>
            </svg>`;

        case 'food_chain':
            return `
            <svg viewBox="0 0 240 70" width="200" height="58" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
                <rect x="5" y="15" width="40" height="30" rx="4" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/>
                <text x="25" y="34" font-size="9" font-weight="bold" text-anchor="middle" fill="#14532d">Padi</text>
                <text x="55" y="34" font-size="12" font-weight="bold" fill="#475569">→</text>
                
                <rect x="70" y="15" width="42" height="30" rx="4" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
                <text x="91" y="34" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#78350f">Belalang</text>
                <text x="120" y="34" font-size="12" font-weight="bold" fill="#475569">→</text>

                <rect x="135" y="15" width="40" height="30" rx="4" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/>
                <text x="155" y="34" font-size="9" font-weight="bold" text-anchor="middle" fill="#075985">Katak</text>
                <text x="185" y="34" font-size="12" font-weight="bold" fill="#475569">→</text>

                <rect x="198" y="15" width="38" height="30" rx="4" fill="#fee2e2" stroke="#dc2626" stroke-width="1.5"/>
                <text x="217" y="34" font-size="9" font-weight="bold" text-anchor="middle" fill="#991b1b">Ular</text>
                <text x="120" y="60" font-size="8.5" font-style="italic" text-anchor="middle" fill="#64748b">Skema Rantai Makanan Sawah</text>
            </svg>`;

        case 'garuda_bintang':
            return `
            <svg viewBox="0 0 140 140" width="115" height="115" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
                <rect x="15" y="15" width="110" height="110" rx="14" fill="#0f172a" stroke="#d97706" stroke-width="3"/>
                <!-- Gold Star -->
                <polygon points="70,28 75,50 98,50 80,64 86,86 70,72 54,86 60,64 42,50 65,50" fill="#facc15" stroke="#ca8a04" stroke-width="1.5"/>
                <text x="70" y="112" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#ffffff">Sila Pertama</text>
                <text x="70" y="123" font-size="8" text-anchor="middle" fill="#cbd5e1">Ketuhanan YME</text>
            </svg>`;

        case 'garuda_rantai':
            return `
            <svg viewBox="0 0 140 140" width="115" height="115" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
                <rect x="15" y="15" width="110" height="110" rx="14" fill="#dc2626" stroke="#b91c1c" stroke-width="3"/>
                <!-- Chain rings gold -->
                <circle cx="50" cy="55" r="16" fill="none" stroke="#facc15" stroke-width="5"/>
                <rect x="62" y="45" width="28" height="20" rx="5" fill="none" stroke="#facc15" stroke-width="5"/>
                <circle cx="88" cy="75" r="16" fill="none" stroke="#facc15" stroke-width="5"/>
                <text x="70" y="112" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#ffffff">Sila Kedua</text>
                <text x="70" y="123" font-size="8" text-anchor="middle" fill="#fecaca">Kemanusiaan Adil & Beradab</text>
            </svg>`;

        case 'garuda_beringin':
            return `
            <svg viewBox="0 0 140 140" width="115" height="115" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
                <rect x="15" y="15" width="110" height="110" rx="14" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
                <!-- Banyan Tree -->
                <path d="M 66 90 L 66 65 Q 60 55 50 60 M 74 90 L 74 65 Q 80 55 90 60" stroke="#78350f" stroke-width="5" fill="none"/>
                <circle cx="70" cy="45" r="24" fill="#15803d"/>
                <circle cx="52" cy="50" r="16" fill="#16a34a"/>
                <circle cx="88" cy="50" r="16" fill="#16a34a"/>
                <circle cx="70" cy="32" r="16" fill="#22c55e"/>
                <text x="70" y="112" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#1e293b">Sila Ketiga</text>
                <text x="70" y="123" font-size="8" text-anchor="middle" fill="#64748b">Persatuan Indonesia</text>
            </svg>`;

        case 'garuda_banteng':
            return `
            <svg viewBox="0 0 140 140" width="115" height="115" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
                <rect x="15" y="15" width="110" height="110" rx="14" fill="#dc2626" stroke="#991b1b" stroke-width="3"/>
                <!-- Bull Head -->
                <path d="M 45 45 Q 30 25 25 35 Q 35 45 48 55 M 95 45 Q 110 25 115 35 Q 105 45 92 55" stroke="#ffffff" stroke-width="5" fill="none" stroke-linecap="round"/>
                <ellipse cx="70" cy="65" rx="22" ry="18" fill="#0f172a"/>
                <ellipse cx="70" cy="74" rx="15" ry="10" fill="#334155"/>
                <circle cx="63" cy="74" r="2.5" fill="#ffffff"/>
                <circle cx="77" cy="74" r="2.5" fill="#ffffff"/>
                <text x="70" y="112" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#ffffff">Sila Keempat</text>
                <text x="70" y="123" font-size="8" text-anchor="middle" fill="#fecaca">Kerakyatan & Musyawarah</text>
            </svg>`;

        case 'garuda_padi_kapas':
            return `
            <svg viewBox="0 0 140 140" width="115" height="115" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
                <rect x="15" y="15" width="110" height="110" rx="14" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
                <!-- Rice (left) & Cotton (right) -->
                <path d="M 55 90 Q 40 60 50 35" stroke="#ca8a04" stroke-width="3" fill="none"/>
                <circle cx="45" cy="40" r="4" fill="#facc15"/>
                <circle cx="42" cy="52" r="4" fill="#facc15"/>
                <circle cx="45" cy="65" r="4" fill="#facc15"/>
                
                <path d="M 85 90 Q 100 60 90 35" stroke="#15803d" stroke-width="3" fill="none"/>
                <circle cx="95" cy="40" r="5" fill="#f8fafc" stroke="#16a34a" stroke-width="1.5"/>
                <circle cx="98" cy="52" r="5" fill="#f8fafc" stroke="#16a34a" stroke-width="1.5"/>
                <circle cx="95" cy="65" r="5" fill="#f8fafc" stroke="#16a34a" stroke-width="1.5"/>
                <text x="70" y="112" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#1e293b">Sila Kelima</text>
                <text x="70" y="123" font-size="8" text-anchor="middle" fill="#64748b">Keadilan Sosial</text>
            </svg>`;

        case 'traffic_sign':
            return `
            <svg viewBox="0 0 160 120" width="140" height="105" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
                <!-- Dilarang Parkir Sign -->
                <circle cx="80" cy="55" r="42" fill="#2563eb" stroke="#ffffff" stroke-width="3"/>
                <circle cx="80" cy="55" r="40" fill="#dc2626"/>
                <circle cx="80" cy="55" r="32" fill="#ffffff"/>
                <text x="80" y="68" font-size="34" font-weight="bold" text-anchor="middle" fill="#0f172a">P</text>
                <line x1="56" y1="31" x2="104" y2="79" stroke="#dc2626" stroke-width="7"/>
                <text x="80" y="112" font-size="10" font-weight="bold" text-anchor="middle" fill="#1e293b">Rambu: Dilarang Parkir</text>
            </svg>`;

        case 'chart_bar':
            return `
            <svg viewBox="0 0 200 130" width="165" height="107" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:6px auto;">
                <line x1="30" y1="10" x2="30" y2="105" stroke="#334155" stroke-width="2"/>
                <line x1="30" y1="105" x2="185" y2="105" stroke="#334155" stroke-width="2"/>
                <line x1="30" y1="35" x2="185" y2="35" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="2,2"/>
                <line x1="30" y1="70" x2="185" y2="70" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="2,2"/>
                <text x="24" y="38" font-size="9" text-anchor="end" fill="#64748b">20</text>
                <text x="24" y="73" font-size="9" text-anchor="end" fill="#64748b">10</text>
                <text x="24" y="108" font-size="9" text-anchor="end" fill="#64748b">0</text>
                <!-- Bars: Senin=15, Selasa=25, Rabu=10, Kamis=20 -->
                <rect x="45" y="52" width="22" height="53" fill="#3b82f6" rx="2"/>
                <rect x="80" y="20" width="22" height="85" fill="#10b981" rx="2"/>
                <rect x="115" y="70" width="22" height="35" fill="#f59e0b" rx="2"/>
                <rect x="150" y="35" width="22" height="70" fill="#8b5cf6" rx="2"/>
                <text x="56" y="120" font-size="9" font-weight="bold" text-anchor="middle" fill="#1e293b">Senin</text>
                <text x="91" y="120" font-size="9" font-weight="bold" text-anchor="middle" fill="#1e293b">Selasa</text>
                <text x="126" y="120" font-size="9" font-weight="bold" text-anchor="middle" fill="#1e293b">Rabu</text>
                <text x="161" y="120" font-size="9" font-weight="bold" text-anchor="middle" fill="#1e293b">Kamis</text>
                <text x="56" y="47" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#1e3a8a">15</text>
                <text x="91" y="15" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#065f46">25</text>
                <text x="126" y="65" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#92400e">10</text>
                <text x="161" y="30" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#5b21b6">20</text>
            </svg>`;

        default:
            return '';
    }
};

export const NaskahSumatifGenerator: React.FC<NaskahSumatifGeneratorProps> = ({
    user,
    userIdentity,
    selectedClass: initialClass,
    selectedSubject: initialSubject,
    activities,
    lockedProtas,
    currentProtaData,
    onNavigate,
    notify
}) => {
    // 1. Identify User's Registered Class & Class Options
    const registeredClass = initialClass || userIdentity.assignedClass || user?.assignedClass || 'Kelas 1';
    const [activeClass, setActiveClass] = useState<string>(registeredClass);
    const [activeSubject, setActiveSubject] = useState<string>(initialSubject || 'Pendidikan Pancasila');

    // Sync if parent selected class or subject changes
    useEffect(() => {
        if (registeredClass) {
            setActiveClass(registeredClass);
        }
    }, [registeredClass]);

    useEffect(() => {
        if (initialSubject) {
            setActiveSubject(initialSubject);
        }
    }, [initialSubject]);

    // Semantic lock checker (handles subject name variations like "PJOK" vs "PJOK (...)" and class "6" vs "Kelas 6")
    const isKeyLocked = (subject: string, className: string): boolean => {
        if (!lockedProtas || !subject || !className) return false;
        if (lockedProtas[`${subject}_${className}`]) return true;
        return Object.entries(lockedProtas).some(([k, val]) => {
            if (!val) return false;
            const lastUnderscore = k.lastIndexOf('_');
            if (lastUnderscore === -1) return false;
            const kSubj = k.slice(0, lastUnderscore);
            const kClass = k.slice(lastUnderscore + 1);
            return isSameSubject(kSubj, subject) && isSameClass(kClass, className);
        });
    };

    // 2. Discover Protas from memory & database / activities
    const lockedProtaList = useMemo(() => {
        const list: { subject: string; className: string; data: CurriculumData; locked: boolean }[] = [];
        const seenCanonSubjects = new Map<string, number>();

        const addOrPreferRecord = (subj: string, cName: string, dataSnap: CurriculumData) => {
            if (!subj || !dataSnap || !Array.isArray(dataSnap.elements)) return;
            const canonSubj = getSubjectKey(subj) || subj.toLowerCase().trim();
            const isLocked = isKeyLocked(subj, activeClass) || isKeyLocked(subj, cName) || isKeyLocked(dataSnap.subject || subj, activeClass);
            const existingIdx = seenCanonSubjects.get(canonSubj);
            if (existingIdx === undefined) {
                seenCanonSubjects.set(canonSubj, list.length);
                list.push({
                    subject: subj,
                    className: cName,
                    data: dataSnap,
                    locked: isLocked
                });
            } else if (isLocked && !list[existingIdx].locked) {
                list[existingIdx] = {
                    subject: subj,
                    className: cName,
                    data: dataSnap,
                    locked: true
                };
            }
        };

        // Check currently active prota in memory first
        if (currentProtaData && currentProtaData.elements) {
            const subj = currentProtaData.subject || activeSubject;
            addOrPreferRecord(subj, activeClass, currentProtaData);
        }

        // Check activities DB for saved Protas
        if (Array.isArray(activities)) {
            activities.forEach(act => {
                if ((act.type === 'ATP_JP' || act.type === 'CP_TP') && act.dataSnapshot && act.dataSnapshot.elements) {
                    const subj = act.subject || act.dataSnapshot.subject;
                    const cName = act.dataSnapshot.className || activeClass;
                    addOrPreferRecord(subj, cName, act.dataSnapshot);
                }
            });
        }

        return list;
    }, [currentProtaData, activities, lockedProtas, activeClass, activeSubject]);

    // Active prota record for the chosen subject & class
    const activeProtaRecord = useMemo(() => {
        const found = lockedProtaList.find(p => isSameSubject(p.subject, activeSubject));
        return found || null;
    }, [lockedProtaList, activeSubject]);

    // Check if current subject Prota is locked
    const isProtaLocked = useMemo(() => {
        if (isKeyLocked(activeSubject, activeClass)) return true;
        if (activeProtaRecord && (activeProtaRecord.locked || isKeyLocked(activeProtaRecord.subject, activeClass))) {
            return true;
        }
        return false;
    }, [activeProtaRecord, lockedProtas, activeSubject, activeClass]);

    // 3. Extract TPs and Semesters from active Prota
    const extractedTpList = useMemo(() => {
        if (!activeProtaRecord || !activeProtaRecord.data || !Array.isArray(activeProtaRecord.data.elements)) {
            return [];
        }
        const tps: { id: number; element: string; cp: string; tp: string; semester: number; alur: string[] }[] = [];
        let counter = 1;
        activeProtaRecord.data.elements.forEach(el => {
            (el.allocations || []).forEach(alloc => {
                if (isSameClass(alloc.className, activeClass) || !alloc.className) {
                    if (Array.isArray(alloc.structuredAtp) && alloc.structuredAtp.length > 0) {
                        alloc.structuredAtp.forEach(grp => {
                            const sem = grp.atpItems && grp.atpItems[0]?.semester ? grp.atpItems[0].semester : 1;
                            const alurList = (grp.atpItems || []).map(i => i.alur).filter(Boolean);
                            tps.push({
                                id: counter++,
                                element: el.elementName,
                                cp: el.capaianPembelajaran,
                                tp: grp.tp,
                                semester: sem,
                                alur: alurList
                            });
                        });
                    } else if (Array.isArray(alloc.tujuanPembelajaran)) {
                        alloc.tujuanPembelajaran.forEach((tpStr, idx) => {
                            tps.push({
                                id: counter++,
                                element: el.elementName,
                                cp: el.capaianPembelajaran,
                                tp: tpStr,
                                semester: idx < alloc.tujuanPembelajaran.length / 2 ? 1 : 2,
                                alur: []
                            });
                        });
                    }
                }
            });
        });
        return tps;
    }, [activeProtaRecord, activeClass]);

    // 4. Form State for Configuration
    const [assessmentType, setAssessmentType] = useState<AssessmentType>('harian');
    const [selectedTpId, setSelectedTpId] = useState<number>(1);
    const [fontFamily, setFontFamily] = useState<FontFamily>('Times New Roman');
    const [fontSize, setFontSize] = useState<FontSize>('11pt');
    const [optionsLayout, setOptionsLayout] = useState<OptionsLayout>('horizontal');
    const [pgCount, setPgCount] = useState<number>(10);
    const [isianCount, setIsianCount] = useState<number>(5);
    const [uraianCount, setUraianCount] = useState<number>(5);
    const [difficultyWeights, setDifficultyWeights] = useState<{ lots: number; mots: number; hots: number }>({
        lots: 20,
        mots: 50,
        hots: 30
    });
    const [includeVisuals, setIncludeVisuals] = useState<boolean>(true);
    const [paperSize, setPaperSize] = useState<'A4' | 'F4'>('A4');

    // UI View State
    const [activeDocTab, setActiveDocTab] = useState<'naskah_soal' | 'kisi_kisi' | 'kunci_jawaban' | 'rubrik_skor'>('naskah_soal');
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [generatedAssessment, setGeneratedAssessment] = useState<GeneratedAssessmentData | null>(null);

    // Editing State for manual refinements
    const [editingQuestionModal, setEditingQuestionModal] = useState<{
        type: 'pg' | 'isian' | 'uraian';
        index: number;
        data: any;
    } | null>(null);

    // Rule Check: Class 6 vs Class 1-5 permissions according to PPA 2026:
    const isClass6 = activeClass.toLowerCase().includes('6');

    // Handle Assessment Type Switch with safety guard
    const handleSelectAssessmentType = (type: AssessmentType) => {
        if (type === 'asat' && isClass6) {
            notify("Pilihan ASAT (Asesmen Sumatif Akhir Tahun) khusus untuk Guru Kelas 1 s/d Kelas 5. Untuk Kelas 6, silakan pilih ASAJ (Asesmen Sumatif Akhir Jenjang).", "warning");
            return;
        }
        if (type === 'asaj' && !isClass6) {
            notify("Pilihan ASAJ (Asesmen Sumatif Akhir Jenjang) khusus bagi Kelas 6 sebagai asesmen kelulusan akhir jenjang SD.", "warning");
            return;
        }
        setAssessmentType(type);
    };

    // Auto-adjust default question counts when assessment type changes
    useEffect(() => {
        if (assessmentType === 'harian') {
            setPgCount(10);
            setIsianCount(5);
            setUraianCount(3);
        } else if (assessmentType === 'asas' || assessmentType === 'asat') {
            setPgCount(20);
            setIsianCount(10);
            setUraianCount(5);
        } else if (assessmentType === 'asaj') {
            setPgCount(25);
            setIsianCount(10);
            setUraianCount(5);
        }
    }, [assessmentType]);

    // 5. Intelligent Gemini AI & Authentic Curriculum Question Synthesizer
    const handleGenerateAssessment = async () => {
        if (!isProtaLocked && lockedProtaList.length === 0) {
            notify("Harap buat dan kunci Program Tahunan (PROTA) terlebih dahulu pada halaman Program Tahunan.", "warning");
            return;
        }

        setIsGenerating(true);
        try {
            // Target TPs based on assessment type
            let targetTps = extractedTpList;
            if (assessmentType === 'harian') {
                const single = extractedTpList.find(t => t.id === selectedTpId) || extractedTpList[0];
                targetTps = single ? [single] : [];
            } else if (assessmentType === 'asas') {
                targetTps = extractedTpList.filter(t => t.semester === 1);
                if (targetTps.length === 0) targetTps = extractedTpList.slice(0, Math.ceil(extractedTpList.length / 2));
            } else if (assessmentType === 'asat') {
                targetTps = extractedTpList.filter(t => t.semester === 2);
                if (targetTps.length === 0) targetTps = extractedTpList.slice(Math.floor(extractedTpList.length / 2));
            } else if (assessmentType === 'asaj') {
                targetTps = extractedTpList;
            }

            if (targetTps.length === 0) {
                targetTps = [{
                    id: 1,
                    element: 'Materi Pokok',
                    cp: 'Peserta didik menguasai kompetensi dasar materi kurikulum merdeka.',
                    tp: `Memahami konsep pokok dan penerapan materi ${activeSubject} dalam konteks kehidupan nyata peserta didik jenjang Sekolah Dasar.`,
                    semester: 1,
                    alur: []
                }];
            }

            const isFaseA = activeClass.includes('1') || activeClass.includes('2');
            const optionKeys = isFaseA ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];
            const apiKey = getApiKey();

            let generatedPg: QuestionPG[] = [];
            let generatedIsian: QuestionIsian[] = [];
            let generatedUraian: QuestionUraian[] = [];
            let aiSucceeded = false;

            // --- ATTEMPT SERVER GEMINI AI GENERATION ---
            try {
                const tpSummary = targetTps.map(t => `- [${t.element}] TP: ${t.tp}`).join('\n');
                    const prompt = `Anda adalah Tim Ahli Penyusun Naskah Asesmen Sumatif Standar Nasional Jenjang Sekolah Dasar (SD) Berdasarkan Panduan Pembelajaran dan Asesmen (PPA) Tahun 2026 Kurikulum Merdeka.
Tugas Anda: Susunlah naskah soal asesmen sumatif yang SAH, VALID, RELEVAN, MENDIDIK, dan 100% SIAP PAKAI untuk dibagikan kepada peserta didik.

DATA KONFIGURASI:
- Mata Pelajaran: ${activeSubject}
- Jenjang & Kelas: ${activeClass} (${isFaseA ? 'Fase A: Opsi jawaban hanya A, B, C' : 'Fase B/C: Opsi jawaban A, B, C, D'})
- Jenis Asesmen: ${assessmentType.toUpperCase()}
- Capaian & Tujuan Pembelajaran (TP) Acuan dari PROTA:
${tpSummary}

JUMLAH BUTIR SOAL YANG WAJIB DISUSUN:
- Pilihan Ganda (PG): ${pgCount} butir soal
- Isian Singkat: ${isianCount} butir soal
- Uraian / Soal Cerita: ${uraianCount} butir soal
- Komposisi Kesulitan: ${difficultyWeights.lots}% LOTS (C1-C2), ${difficultyWeights.mots}% MOTS (C3), ${difficultyWeights.hots}% HOTS (C4-C5)

ATURAN WAJIB PADA GAMBAR & BUTIR SOAL:
1. Soal HARUS BENAR-BENAR BERISI TEKS SOAL ASLI (bukan template, bukan placeholder generik, bukan kalimat kosong).
2. Jika suatu butir soal PG memerlukan konteks gambar visual bagi anak SD, pilihlah salah satu dari kode visual berikut yang PALING COCOK:
   - "clock_0900" (Jam dinding pukul 09.00 / sudut siku-siku 90 derajat)
   - "clock_0200" (Jam dinding pukul 02.00 / sudut lancip 60 derajat)
   - "fraction_circle" (Lingkaran pecahan 2/6 = 1/3 diarsir)
   - "fraction_rect" (Persegi panjang petak 3/8 diarsir)
   - "shape_rect" (Bangun datar persegi panjang 12 cm x 6 cm)
   - "shape_triangle" (Segitiga siku-siku alas 8 cm, tinggi 6 cm, miring 10 cm)
   - "shape_cube" (Kubus rusuk 5 cm)
   - "cube_net" (Jaring-jaring kubus)
   - "plant_anatomy" (Struktur tumbuhan bunga, daun, batang, akar dengan nomor)
   - "water_cycle" (Siklus air: evaporasi, kondensasi, presipitasi)
   - "food_chain" (Rantai makanan sawah: padi -> belalang -> katak -> ular)
   - "garuda_bintang" (Simbol Sila 1 Bintang Emas)
   - "garuda_rantai" (Simbol Sila 2 Rantai Emas)
   - "garuda_beringin" (Simbol Sila 3 Pohon Beringin)
   - "garuda_banteng" (Simbol Sila 4 Kepala Banteng)
   - "garuda_padi_kapas" (Simbol Sila 5 Padi dan Kapas)
   - "traffic_sign" (Rambu lalu lintas dilarang parkir)
   - "chart_bar" (Diagram batang data peminjaman buku perpustakaan)
   - "none" (Jika soal berupa stimulus cerita teks murni tanpa gambar)
3. PENTING: Jika visualType BUKAN "none", teks stimulus dan pertanyaan HARUS SECARA LANGSUNG MEMBAHAS DAN MENANYAKAN GAMBAR TERSEBUT! Contoh: "Perhatikan gambar jam dinding berikut! Jenis sudut yang dibentuk adalah..."
4. PERATURAN MUTLAK ANTI-DUPLIKASI (ZERO DUPLICATE POLICY):
   - DILARANG KERAS MENGHASILKAN SOAL KEMBAR ATAU DUPLIKAT SAMA SEKALI!
   - Setiap nomor butir soal (baik PG nomor 1 sampai ${pgCount}, Isian nomor 1 sampai ${isianCount}, dan Uraian nomor 1 sampai ${uraianCount}) WAJIB 100% UNIK, BERBEDA, dan mengeksplorasi indikator, stimulus cerita, angka/data, atau konsep yang berlainan.
   - Tidak boleh ada 2 butir soal dengan teks pertanyaan yang sama persis, atau hanya berbeda 1-2 kata, atau menanyakan hal yang sama berulang kali.
   - Distribusikan butir soal secara merata ke seluruh materi dan TP yang tersedia (${tpSummary}).

KEMBALIKAN OUTPUT HANYA DALAM FORMAT JSON BERIKUT:
{
  "pg": [
    {
      "no": 1,
      "stimulus": "Teks stimulus cerita / skenario pengantar (jika ada)",
      "question": "Pertanyaan soal yang spesifik dan jelas",
      "options": [
        {"key": "A", "text": "Pilihan A"},
        {"key": "B", "text": "Pilihan B"},
        {"key": "C", "text": "Pilihan C"}${!isFaseA ? ',\n        {"key": "D", "text": "Pilihan D"}' : ''}
      ],
      "correctAnswer": "A",
      "explanation": "Pembahasan rinci kunci jawaban",
      "cognitiveLevel": "LOTS",
      "tp": "Tujuan Pembelajaran terkait",
      "indikator": "Indikator spesifik butir soal",
      "materi": "Lingkup materi",
      "visualType": "none",
      "visualTitle": "Judul gambar jika ada"
    }
  ],
  "isian": [
    {
      "no": 1,
      "question": "Pertanyaan isian singkat...",
      "correctAnswer": "Jawaban singkat tepat",
      "cognitiveLevel": "LOTS",
      "tp": "Tujuan Pembelajaran terkait",
      "indikator": "Indikator butir soal",
      "materi": "Lingkup materi"
    }
  ],
  "uraian": [
    {
      "no": 1,
      "question": "Pertanyaan uraian atau pemecahan masalah kontekstual...",
      "correctAnswer": "Pedoman jawaban lengkap dan runtut",
      "cognitiveLevel": "HOTS",
      "tp": "Tujuan Pembelajaran terkait",
      "indikator": "Indikator butir soal",
      "materi": "Lingkup materi",
      "rubric": {
        "score3": "Kriteria skor 3 sangat lengkap",
        "score2": "Kriteria skor 2 cukup lengkap",
        "score1": "Kriteria skor 1 kurang lengkap",
        "score0": "Kriteria skor 0 salah / tidak dijawab"
      }
    }
  ]
}`;

                    const response = await generateGeminiContent({
                        model: 'gemini-4-hydrogen',
                        contents: prompt,
                        config: {
                            responseMimeType: 'application/json'
                        }
                    });

                    if (response && response.text) {
                        let rawJson = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
                        const firstBrace = rawJson.indexOf('{');
                        const lastBrace = rawJson.lastIndexOf('}');
                        if (firstBrace !== -1 && lastBrace > firstBrace) {
                            rawJson = rawJson.slice(firstBrace, lastBrace + 1);
                        }
                        const parsed = JSON.parse(rawJson);
                        if (Array.isArray(parsed.pg) && parsed.pg.length > 0) {
                            generatedPg = parsed.pg.map((q: any, idx: number) => ({
                                no: idx + 1,
                                stimulus: q.stimulus || '',
                                question: q.question,
                                options: q.options || [],
                                correctAnswer: q.correctAnswer || 'A',
                                explanation: q.explanation || '',
                                cognitiveLevel: q.cognitiveLevel || 'MOTS',
                                tp: q.tp || targetTps[0].tp,
                                indikator: q.indikator || `Peserta didik mampu menjawab butir soal terkait ${targetTps[0].element}`,
                                materi: q.materi || targetTps[0].element,
                                visualType: q.visualType || 'none',
                                visualTitle: q.visualTitle || '',
                                visualSvg: renderVisualSvg(q.visualType, q.visualTitle)
                            }));

                            if (Array.isArray(parsed.isian)) {
                                generatedIsian = parsed.isian.map((q: any, idx: number) => ({
                                    no: idx + 1,
                                    stimulus: q.stimulus || '',
                                    question: q.question,
                                    correctAnswer: q.correctAnswer,
                                    cognitiveLevel: q.cognitiveLevel || 'LOTS',
                                    tp: q.tp || targetTps[0].tp,
                                    indikator: q.indikator || `Peserta didik mampu melengkapi isian terkait ${targetTps[0].element}`,
                                    materi: q.materi || targetTps[0].element
                                }));
                            }

                            if (Array.isArray(parsed.uraian)) {
                                generatedUraian = parsed.uraian.map((q: any, idx: number) => ({
                                    no: idx + 1,
                                    stimulus: q.stimulus || '',
                                    question: q.question,
                                    correctAnswer: q.correctAnswer,
                                    cognitiveLevel: q.cognitiveLevel || 'HOTS',
                                    tp: q.tp || targetTps[0].tp,
                                    indikator: q.indikator || `Peserta didik mampu menguraikan solusi terkait ${targetTps[0].element}`,
                                    materi: q.materi || targetTps[0].element,
                                    rubric: q.rubric || {
                                        score3: 'Jawaban sangat lengkap, benar secara konsep dan runtut.',
                                        score2: 'Jawaban benar secara umum namun kurang mendalam.',
                                        score1: 'Jawaban hanya menyebutkan sebagian kecil fakta.',
                                        score0: 'Jawaban salah atau tidak menjawab.'
                                    }
                                }));
                            }

                            aiSucceeded = true;
                        }
                    }
                } catch (aiErr: any) {
                    console.warn("AI generation encountered issue, using authentic curriculum bank fallback:", aiErr);
                    const errMsg = String(aiErr?.message || aiErr || '');
                    if (errMsg.includes('API Key') || errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('404')) {
                        notify(`Mode Bank Soal Otomatis digunakan (${errMsg.slice(0, 110)}). Pastikan GEMINI_API_KEY aktif di server/Vercel atau Pengaturan API Key.`, "warning");
                    }
                }

            // --- GUARANTEED ZERO-DUPLICATE DEDUPLICATION & COMPLETION PASS ---
            const sessionSeenFingerprints = new Set<string>();
            generatedPg = deduplicateAndEnsureCountPg(
                generatedPg,
                pgCount,
                activeSubject,
                activeClass,
                targetTps,
                isFaseA,
                includeVisuals,
                difficultyWeights,
                renderVisualSvg,
                sessionSeenFingerprints
            );
            generatedIsian = deduplicateAndEnsureCountIsian(
                generatedIsian,
                isianCount,
                activeSubject,
                activeClass,
                targetTps,
                sessionSeenFingerprints
            );
            generatedUraian = deduplicateAndEnsureCountUraian(
                generatedUraian,
                uraianCount,
                activeSubject,
                activeClass,
                targetTps,
                sessionSeenFingerprints
            );

            const totalScore = (generatedPg.length * 1) + (generatedIsian.length * 2) + (generatedUraian.length * 3);

            const assessmentData: GeneratedAssessmentData = {
                id: `sumatif_${Date.now()}`,
                createdAt: new Date().toISOString(),
                assessmentType,
                subject: activeSubject,
                className: activeClass,
                semester: assessmentType === 'asat' ? 2 : 1,
                academicYear: userIdentity.academicYear || '2025/2026',
                tpSelected: assessmentType === 'harian' ? (extractedTpList.find(t => t.id === selectedTpId)?.tp) : undefined,
                fontFamily,
                fontSize,
                optionsLayout,
                pgQuestions: generatedPg,
                isianQuestions: generatedIsian,
                uraianQuestions: generatedUraian,
                totalScoreMax: totalScore,
                difficultyWeights
            };

            setGeneratedAssessment(assessmentData);

            // Persist to local storage history
            try {
                const prevHistory = JSON.parse(localStorage.getItem('prota_sumatif_history') || '[]');
                const updated = [assessmentData, ...prevHistory.filter((h: any) => h.id !== assessmentData.id)].slice(0, 15);
                localStorage.setItem('prota_sumatif_history', JSON.stringify(updated));
            } catch (e) {}

            notify(`Naskah Asesmen Sumatif (${assessmentType.toUpperCase()}) Sah & Siap Pakai Berhasil Dihasilkan!`, 'success');
        } catch (err: any) {
            console.error("Error generating assessment:", err);
            notify("Terjadi kesalahan saat menyusun naskah. Silakan coba kembali.", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    // Helper to update a question directly (Inline Editing)
    const handleUpdateQuestion = (updatedQ: any) => {
        if (!generatedAssessment || !editingQuestionModal) return;
        const copy = { ...generatedAssessment };

        if (editingQuestionModal.type === 'pg') {
            copy.pgQuestions = copy.pgQuestions.map((q, idx) => {
                if (idx === editingQuestionModal.index) {
                    return {
                        ...updatedQ,
                        visualSvg: renderVisualSvg(updatedQ.visualType, updatedQ.visualTitle)
                    };
                }
                return q;
            });
        } else if (editingQuestionModal.type === 'isian') {
            copy.isianQuestions = copy.isianQuestions.map((q, idx) => idx === editingQuestionModal.index ? updatedQ : q);
        } else if (editingQuestionModal.type === 'uraian') {
            copy.uraianQuestions = copy.uraianQuestions.map((q, idx) => idx === editingQuestionModal.index ? updatedQ : q);
        }

        setGeneratedAssessment(copy);
        setEditingQuestionModal(null);
        notify("Perubahan butir soal berhasil disimpan!", "success");
    };

    // 6. Word Document Export Engines (.doc with MSOffice XML namespaces & CSS)
    const exportWordDocument = (type: 'kisi_kisi' | 'naskah_soal' | 'kunci_jawaban' | 'rubrik_skor' | 'all') => {
        if (!generatedAssessment) {
            notify("Silakan hasilkan naskah asesmen terlebih dahulu.", "warning");
            return;
        }

        const data = generatedAssessment;
        const fontName = data.fontFamily;
        const fontSizeStr = data.fontSize;
        const locationStr = userIdentity.location || localStorage.getItem('prota_location') || 'Sukatinggal';
        const schoolName = userIdentity.institutionName || 'SDN SUKATINGGAL';
        const teacherName = userIdentity.authorName || 'A. Miftah Hilah Ash-Shidiq, S.Pd.';
        const teacherNip = userIdentity.nip || '199602152025211094';
        const headmasterName = userIdentity.kepalaSekolah || 'Yuni Sri Rahayu, S.Pd.';
        const headmasterNip = userIdentity.nipKepalaSekolah || '198706162019032007';

        const typeLabel = 
            data.assessmentType === 'harian' ? 'ASESMEN SUMATIF HARIAN' :
            data.assessmentType === 'asas' ? 'ASESMEN SUMATIF AKHIR SEMESTER (ASAS)' :
            data.assessmentType === 'asat' ? 'ASESMEN SUMATIF AKHIR TAHUN (ASAT)' :
            'ASESMEN SUMATIF AKHIR JENJANG (ASAJ)';

        const isLandscape = type === 'kisi_kisi';
        const paperWidth = paperSize === 'F4' ? '21.5cm' : '21.0cm';
        const paperHeight = paperSize === 'F4' ? '33.0cm' : '29.7cm';

        const commonKop = `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; border-bottom: 3px double #000; padding-bottom: 8px;">
                <tr>
                    <td style="width: 15%; text-align: center; vertical-align: middle;">
                        <div style="font-size: 26pt; font-weight: bold; color: #1e3a8a;">SD</div>
                    </td>
                    <td style="width: 85%; text-align: center; vertical-align: middle;">
                        <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">PEMERINTAH KABUPATEN BANDUNG</div>
                        <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">DINAS PENDIDIKAN</div>
                        <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase;">${schoolName}</div>
                        <div style="font-size: 9pt; font-style: italic;">Kurikulum Merdeka BSKAP 046 - Panduan Pembelajaran dan Asesmen (PPA) Jenjang SD 2026</div>
                    </td>
                </tr>
            </table>
        `;

        const renderSignatures = () => {
            const today = new Date();
            const indonesianMonths = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            const formattedDate = `${today.getDate()} ${indonesianMonths[today.getMonth()]} ${today.getFullYear()}`;

            return `
                <table style="width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 10pt; page-break-inside: avoid;">
                    <tr>
                        <td style="width: 50%; text-align: center; vertical-align: top;">
                            <div>Mengetahui,</div>
                            <div style="font-weight: bold;">Kepala Sekolah</div>
                            <div style="height: 60px;"></div>
                            <div style="font-weight: bold; text-decoration: underline;">${headmasterName}</div>
                            <div>NIP. ${headmasterNip}</div>
                        </td>
                        <td style="width: 50%; text-align: center; vertical-align: top;">
                            <div>${locationStr}, ${formattedDate}</div>
                            <div style="font-weight: bold;">Guru Kelas / Penyusun</div>
                            <div style="height: 60px;"></div>
                            <div style="font-weight: bold; text-decoration: underline;">${teacherName}</div>
                            <div>NIP. ${teacherNip}</div>
                        </td>
                    </tr>
                </table>
            `;
        };

        // 1. KISI-KISI HTML
        const renderKisiKisiHtml = () => `
            <div style="page-break-after: always;">
                ${commonKop}
                <div style="text-align: center; font-weight: bold; font-size: 12pt; text-transform: uppercase; margin-bottom: 4px;">
                    KISI-KISI PENULISAN SOAL ${typeLabel}
                </div>
                <div style="text-align: center; font-size: 10pt; font-weight: bold; margin-bottom: 14px;">
                    MATA PELAJARAN: ${data.subject.toUpperCase()} | KELAS: ${data.className.toUpperCase()} | TAHUN AJARAN: ${data.academicYear}
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 9.5pt;">
                    <thead>
                        <tr style="background-color: #f1f5f9; text-align: center;">
                            <th style="border: 1px solid #000; padding: 6px; width: 5%;">No</th>
                            <th style="border: 1px solid #000; padding: 6px; width: 22%;">Tujuan Pembelajaran (TP)</th>
                            <th style="border: 1px solid #000; padding: 6px; width: 18%;">Lingkup Materi</th>
                            <th style="border: 1px solid #000; padding: 6px; width: 32%;">Indikator Soal</th>
                            <th style="border: 1px solid #000; padding: 6px; width: 9%;">Level</th>
                            <th style="border: 1px solid #000; padding: 6px; width: 8%;">Bentuk</th>
                            <th style="border: 1px solid #000; padding: 6px; width: 6%;">No Soal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.pgQuestions.map((q, idx) => `
                            <tr>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center;">${idx + 1}</td>
                                <td style="border: 1px solid #000; padding: 5px;">${q.tp}</td>
                                <td style="border: 1px solid #000; padding: 5px;">${q.materi}</td>
                                <td style="border: 1px solid #000; padding: 5px;">${q.indikator}</td>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">${q.cognitiveLevel}</td>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center;">PG</td>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">${q.no}</td>
                            </tr>
                        `).join('')}
                        ${data.isianQuestions.map((q, idx) => `
                            <tr>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center;">${data.pgQuestions.length + idx + 1}</td>
                                <td style="border: 1px solid #000; padding: 5px;">${q.tp}</td>
                                <td style="border: 1px solid #000; padding: 5px;">${q.materi}</td>
                                <td style="border: 1px solid #000; padding: 5px;">${q.indikator}</td>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">${q.cognitiveLevel}</td>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center;">Isian</td>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">${q.no}</td>
                            </tr>
                        `).join('')}
                        ${data.uraianQuestions.map((q, idx) => `
                            <tr>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center;">${data.pgQuestions.length + data.isianQuestions.length + idx + 1}</td>
                                <td style="border: 1px solid #000; padding: 5px;">${q.tp}</td>
                                <td style="border: 1px solid #000; padding: 5px;">${q.materi}</td>
                                <td style="border: 1px solid #000; padding: 5px;">${q.indikator}</td>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">${q.cognitiveLevel}</td>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center;">Uraian</td>
                                <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">${q.no}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                ${renderSignatures()}
            </div>
        `;

        // 2. NASKAH SOAL HTML
        const renderNaskahSoalHtml = () => `
            <div style="page-break-after: always;">
                ${commonKop}
                <div style="text-align: center; font-weight: bold; font-size: 13pt; text-transform: uppercase; margin-bottom: 2px;">
                    ${typeLabel}
                </div>
                <div style="text-align: center; font-size: 10pt; font-weight: bold; margin-bottom: 12px;">
                    TAHUN AJARAN ${data.academicYear}
                </div>

                <table style="width: 100%; border: 1px solid #000; border-collapse: collapse; margin-bottom: 14px; font-size: 10pt;">
                    <tr>
                        <td style="padding: 4px 8px; width: 18%; font-weight: bold;">Mata Pelajaran</td>
                        <td style="padding: 4px 8px; width: 32%;">: ${data.subject}</td>
                        <td style="padding: 4px 8px; width: 18%; font-weight: bold;">Nama Siswa</td>
                        <td style="padding: 4px 8px; width: 32%;">: ............................................</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 8px; font-weight: bold;">Kelas / Semester</td>
                        <td style="padding: 4px 8px;">: ${data.className} / Semester ${data.semester}</td>
                        <td style="padding: 4px 8px; font-weight: bold;">Nomor Absen</td>
                        <td style="padding: 4px 8px;">: ............................................</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 8px; font-weight: bold;">Hari / Tanggal</td>
                        <td style="padding: 4px 8px;">: ............................................</td>
                        <td style="padding: 4px 8px; font-weight: bold;">Waktu</td>
                        <td style="padding: 4px 8px;">: 90 Menit</td>
                    </tr>
                </table>

                <div style="font-weight: bold; font-size: 10pt; margin-bottom: 6px; text-decoration: underline;">PETUNJUK UMUM:</div>
                <ol style="margin-top: 0; padding-left: 18px; font-size: 9.5pt; margin-bottom: 16px; line-height: 1.4;">
                    <li>Berdoalah sebelum mengerjakan soal.</li>
                    <li>Tuliskan nama dan nomor absen pada lembar identitas yang disediakan.</li>
                    <li>Bacalah setiap butir soal dengan teliti dan cermat.</li>
                    <li>Kerjakan terlebih dahulu soal-soal yang kamu anggap mudah.</li>
                    <li>Periksa kembali semua jawabanmu sebelum diserahkan kepada Bapak/Ibu Guru.</li>
                </ol>

                <!-- BAGIAN I: PILIHAN GANDA -->
                <div style="font-weight: bold; font-size: 11pt; margin-bottom: 10px; background-color: #f1f5f9; padding: 4px 8px; border-left: 4px solid #0284c7;">
                    I. Berilah tanda silang (X) pada huruf ${data.className.includes('1') || data.className.includes('2') ? 'A, B, atau C' : 'A, B, C, atau D'} di depan jawaban yang paling tepat!
                </div>

                <div style="margin-bottom: 20px;">
                    ${data.pgQuestions.map(q => `
                        <div style="margin-bottom: 14px; page-break-inside: avoid;">
                            <div style="display: flex; gap: 8px;">
                                <div style="font-weight: bold; width: 22px;">${q.no}.</div>
                                <div style="flex: 1;">
                                    ${q.stimulus ? `<div style="font-style: italic; color: #334155; margin-bottom: 4px;">${q.stimulus}</div>` : ''}
                                    ${q.visualSvg ? `
                                        <div style="text-align: center; margin: 6px 0;">
                                            ${q.visualTitle ? `<div style="font-size: 9pt; font-weight: bold; color: #475569; margin-bottom: 3px;">${q.visualTitle}</div>` : ''}
                                            ${q.visualSvg}
                                        </div>
                                    ` : ''}
                                    <div style="margin-bottom: 6px; font-weight: 500;">${q.question}</div>
                                    
                                    ${data.optionsLayout === 'horizontal' ? `
                                        <table style="width: 100%; border-collapse: collapse; margin-top: 4px;">
                                            <tr>
                                                ${q.options.map(opt => `
                                                    <td style="padding: 2px 8px 2px 0; vertical-align: top; width: ${100 / q.options.length}%;">
                                                        <b>${opt.key}.</b> ${opt.text}
                                                    </td>
                                                `).join('')}
                                            </tr>
                                        </table>
                                    ` : `
                                        <div style="margin-top: 4px; padding-left: 4px;">
                                            ${q.options.map(opt => `
                                                <div style="padding: 2px 0;">
                                                    <b>${opt.key}.</b> ${opt.text}
                                                </div>
                                            `).join('')}
                                        </div>
                                    `}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- BAGIAN II: ISIAN SINGKAT -->
                ${data.isianQuestions.length > 0 ? `
                    <div style="font-weight: bold; font-size: 11pt; margin-top: 16px; margin-bottom: 10px; background-color: #f1f5f9; padding: 4px 8px; border-left: 4px solid #0284c7;">
                        II. Isilah titik-titik di bawah ini dengan jawaban yang singkat dan tepat!
                    </div>
                    <div style="margin-bottom: 20px;">
                        ${data.isianQuestions.map(q => `
                            <div style="margin-bottom: 10px; page-break-inside: avoid; display: flex; gap: 8px;">
                                <div style="font-weight: bold; width: 22px;">${q.no}.</div>
                                <div style="flex: 1;">
                                    ${q.stimulus ? `<div style="font-style: italic; color: #334155; margin-bottom: 2px;">${q.stimulus}</div>` : ''}
                                    ${q.question}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <!-- BAGIAN III: URAIAN -->
                ${data.uraianQuestions.length > 0 ? `
                    <div style="font-weight: bold; font-size: 11pt; margin-top: 16px; margin-bottom: 10px; background-color: #f1f5f9; padding: 4px 8px; border-left: 4px solid #0284c7;">
                        III. Jawablah pertanyaan-pertanyaan berikut dengan jelas, tepat, dan runtut!
                    </div>
                    <div style="margin-bottom: 20px;">
                        ${data.uraianQuestions.map(q => `
                            <div style="margin-bottom: 18px; page-break-inside: avoid; display: flex; gap: 8px;">
                                <div style="font-weight: bold; width: 22px;">${q.no}.</div>
                                <div style="flex: 1;">
                                    ${q.stimulus ? `<div style="font-style: italic; color: #334155; margin-bottom: 3px;">${q.stimulus}</div>` : ''}
                                    <div style="margin-bottom: 6px;">${q.question}</div>
                                    <div style="border-bottom: 1px dotted #94a3b8; height: 24px; width: 100%;"></div>
                                    <div style="border-bottom: 1px dotted #94a3b8; height: 24px; width: 100%;"></div>
                                    <div style="border-bottom: 1px dotted #94a3b8; height: 24px; width: 100%;"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        // 3. KUNCI JAWABAN HTML
        const renderKunciJawabanHtml = () => `
            <div style="page-break-after: always;">
                ${commonKop}
                <div style="text-align: center; font-weight: bold; font-size: 13pt; text-transform: uppercase; margin-bottom: 2px;">
                    KUNCI JAWABAN & PEDOMAN KOREKSI ${typeLabel}
                </div>
                <div style="text-align: center; font-size: 10pt; font-weight: bold; margin-bottom: 14px;">
                    MATA PELAJARAN: ${data.subject.toUpperCase()} | KELAS: ${data.className.toUpperCase()}
                </div>

                <div style="font-weight: bold; font-size: 11pt; margin-bottom: 6px; background-color: #f1f5f9; padding: 4px 8px; border-left: 4px solid #0284c7;">
                    I. KUNCI JAWABAN PILIHAN GANDA (PG)
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10pt; text-align: center;">
                    <tr style="background-color: #f8fafc; font-weight: bold;">
                        ${data.pgQuestions.slice(0, 10).map(q => `<th style="border: 1px solid #000; padding: 4px;">No ${q.no}</th>`).join('')}
                    </tr>
                    <tr style="font-weight: bold; font-size: 11pt; color: #1e3a8a;">
                        ${data.pgQuestions.slice(0, 10).map(q => `<td style="border: 1px solid #000; padding: 6px;">${q.correctAnswer}</td>`).join('')}
                    </tr>
                    ${data.pgQuestions.length > 10 ? `
                        <tr style="background-color: #f8fafc; font-weight: bold;">
                            ${data.pgQuestions.slice(10, 20).map(q => `<th style="border: 1px solid #000; padding: 4px;">No ${q.no}</th>`).join('')}
                        </tr>
                        <tr style="font-weight: bold; font-size: 11pt; color: #1e3a8a;">
                            ${data.pgQuestions.slice(10, 20).map(q => `<td style="border: 1px solid #000; padding: 6px;">${q.correctAnswer}</td>`).join('')}
                        </tr>
                    ` : ''}
                    ${data.pgQuestions.length > 20 ? `
                        <tr style="background-color: #f8fafc; font-weight: bold;">
                            ${data.pgQuestions.slice(20, 30).map(q => `<th style="border: 1px solid #000; padding: 4px;">No ${q.no}</th>`).join('')}
                        </tr>
                        <tr style="font-weight: bold; font-size: 11pt; color: #1e3a8a;">
                            ${data.pgQuestions.slice(20, 30).map(q => `<td style="border: 1px solid #000; padding: 6px;">${q.correctAnswer}</td>`).join('')}
                        </tr>
                    ` : ''}
                </table>

                ${data.isianQuestions.length > 0 ? `
                    <div style="font-weight: bold; font-size: 11pt; margin-top: 14px; margin-bottom: 6px; background-color: #f1f5f9; padding: 4px 8px; border-left: 4px solid #0284c7;">
                        II. KUNCI JAWABAN ISIAN SINGKAT
                    </div>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10pt;">
                        <thead>
                            <tr style="background-color: #f8fafc;">
                                <th style="border: 1px solid #000; padding: 5px; width: 10%; text-align: center;">No Soal</th>
                                <th style="border: 1px solid #000; padding: 5px; text-align: left;">Kunci Jawaban</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.isianQuestions.map(q => `
                                <tr>
                                    <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">${q.no}</td>
                                    <td style="border: 1px solid #000; padding: 5px; font-weight: bold; color: #047857;">${q.correctAnswer}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : ''}

                ${data.uraianQuestions.length > 0 ? `
                    <div style="font-weight: bold; font-size: 11pt; margin-top: 14px; margin-bottom: 6px; background-color: #f1f5f9; padding: 4px 8px; border-left: 4px solid #0284c7;">
                        III. PEDOMAN JAWABAN SOAL URAIAN
                    </div>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10pt;">
                        <thead>
                            <tr style="background-color: #f8fafc;">
                                <th style="border: 1px solid #000; padding: 5px; width: 10%; text-align: center;">No Soal</th>
                                <th style="border: 1px solid #000; padding: 5px; text-align: left;">Rambu-rambu Kunci Jawaban & Penjelasan</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.uraianQuestions.map(q => `
                                <tr>
                                    <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; vertical-align: top;">${q.no}</td>
                                    <td style="border: 1px solid #000; padding: 6px; line-height: 1.4;">
                                        <div style="white-space: pre-line; color: #1e3a8a; font-weight: 500;">${q.correctAnswer}</div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : ''}
            </div>
        `;

        // 4. RUBRIK PENILAIAN & PENSKORAN HTML
        const renderRubrikSkorHtml = () => `
            <div>
                ${commonKop}
                <div style="text-align: center; font-weight: bold; font-size: 13pt; text-transform: uppercase; margin-bottom: 2px;">
                    PEDOMAN PENSKORAN & RUBRIK PENILAIAN ${typeLabel}
                </div>
                <div style="text-align: center; font-size: 10pt; font-weight: bold; margin-bottom: 14px;">
                    KURIKULUM MERDEKA SESUAI PANDUAN PEMBELAJARAN DAN ASESMEN (PPA) 2026
                </div>

                <div style="font-weight: bold; font-size: 11pt; margin-bottom: 6px; background-color: #f1f5f9; padding: 4px 8px; border-left: 4px solid #0284c7;">
                    A. BOBOT NILAI DAN SKOR MAKSIMAL TIAP BENTUK SOAL
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10pt; text-align: center;">
                    <thead>
                        <tr style="background-color: #f8fafc;">
                            <th style="border: 1px solid #000; padding: 6px;">Bentuk Soal</th>
                            <th style="border: 1px solid #000; padding: 6px;">Jumlah Butir</th>
                            <th style="border: 1px solid #000; padding: 6px;">Skor Tiap Butir</th>
                            <th style="border: 1px solid #000; padding: 6px;">Skor Maksimal</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px; text-align: left; font-weight: bold;">I. Pilihan Ganda (PG)</td>
                            <td style="border: 1px solid #000; padding: 6px;">${data.pgQuestions.length}</td>
                            <td style="border: 1px solid #000; padding: 6px;">1</td>
                            <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">${data.pgQuestions.length * 1}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px; text-align: left; font-weight: bold;">II. Isian Singkat</td>
                            <td style="border: 1px solid #000; padding: 6px;">${data.isianQuestions.length}</td>
                            <td style="border: 1px solid #000; padding: 6px;">2</td>
                            <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">${data.isianQuestions.length * 2}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px; text-align: left; font-weight: bold;">III. Uraian</td>
                            <td style="border: 1px solid #000; padding: 6px;">${data.uraianQuestions.length}</td>
                            <td style="border: 1px solid #000; padding: 6px;">3</td>
                            <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">${data.uraianQuestions.length * 3}</td>
                        </tr>
                        <tr style="background-color: #f1f5f9; font-weight: bold;">
                            <td style="border: 1px solid #000; padding: 6px; text-align: left;" colspan="3">TOTAL SKOR MAKSIMAL</td>
                            <td style="border: 1px solid #000; padding: 6px; font-size: 11pt; color: #1e3a8a;">${data.totalScoreMax}</td>
                        </tr>
                    </tbody>
                </table>

                <div style="font-weight: bold; font-size: 11pt; margin-bottom: 6px; background-color: #f1f5f9; padding: 4px 8px; border-left: 4px solid #0284c7;">
                    B. FORMULA PERHITUNGAN NILAI AKHIR (NA)
                </div>
                <div style="border: 1px solid #cbd5e1; background-color: #f8fafc; padding: 12px; margin-bottom: 16px; border-radius: 4px; font-size: 10.5pt; text-align: center;">
                    <div style="font-weight: bold; margin-bottom: 4px;">
                        Nilai Akhir (NA) = <span style="display: inline-block; vertical-align: middle; text-align: center;"><span style="border-bottom: 1px solid #000; display: block;">Skor Perolehan Siswa</span><span style="display: block;">Skor Maksimal (${data.totalScoreMax})</span></span> &times; 100
                    </div>
                </div>

                <div style="font-weight: bold; font-size: 11pt; margin-bottom: 6px; background-color: #f1f5f9; padding: 4px 8px; border-left: 4px solid #0284c7;">
                    C. PEDOMAN PEMBERIAN SKOR SOAL URAIAN
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9.5pt;">
                    <thead>
                        <tr style="background-color: #f8fafc;">
                            <th style="border: 1px solid #000; padding: 6px; width: 12%;">Skor</th>
                            <th style="border: 1px solid #000; padding: 6px; width: 25%;">Kategori</th>
                            <th style="border: 1px solid #000; padding: 6px; width: 63%;">Deskripsi Ketercapaian Indikator</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; font-size: 11pt; color: #047857;">3</td>
                            <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Sangat Lengkap & Tepat</td>
                            <td style="border: 1px solid #000; padding: 6px;">Jawaban sangat lengkap, tepat sesuai konsep, langkah terstruktur dan mencerminkan pemahaman mendalam.</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; font-size: 11pt; color: #0284c7;">2</td>
                            <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Cukup Lengkap</td>
                            <td style="border: 1px solid #000; padding: 6px;">Jawaban benar secara umum namun penjelasan kurang mendalam atau langkah penyelesaian belum tuntas.</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; font-size: 11pt; color: #d97706;">1</td>
                            <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Kurang Lengkap</td>
                            <td style="border: 1px solid #000; padding: 6px;">Hanya menyebutkan sebagian kecil fakta, masih terdapat kekeliruan konsep pokok.</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; font-size: 11pt; color: #dc2626;">0</td>
                            <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Tidak Menjawab / Salah</td>
                            <td style="border: 1px solid #000; padding: 6px;">Tidak ada jawaban yang relevan atau tidak menjawab sama sekali.</td>
                        </tr>
                    </tbody>
                </table>

                ${renderSignatures()}
            </div>
        `;

        let docBody = '';
        let fileSuffix = '';
        if (type === 'kisi_kisi') {
            docBody = renderKisiKisiHtml();
            fileSuffix = 'Kisi_Kisi';
        } else if (type === 'naskah_soal') {
            docBody = renderNaskahSoalHtml();
            fileSuffix = 'Naskah_Soal';
        } else if (type === 'kunci_jawaban') {
            docBody = renderKunciJawabanHtml();
            fileSuffix = 'Kunci_Jawaban';
        } else if (type === 'rubrik_skor') {
            docBody = renderRubrikSkorHtml();
            fileSuffix = 'Rubrik_Penilaian';
        } else {
            docBody = `
                ${renderKisiKisiHtml()}
                ${renderNaskahSoalHtml()}
                ${renderKunciJawabanHtml()}
                ${renderRubrikSkorHtml()}
            `;
            fileSuffix = 'Paket_Lengkap_Asesmen';
        }

        const fullHtml = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset="utf-8">
                <title>${typeLabel} - ${data.subject}</title>
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
                        size: ${isLandscape ? `${paperHeight} ${paperWidth}` : `${paperWidth} ${paperHeight}`};
                        margin: 2.0cm 2.0cm 2.0cm 2.0cm;
                        mso-page-orientation: ${isLandscape ? 'landscape' : 'portrait'};
                    }
                    body {
                        font-family: '${fontName}', serif;
                        font-size: ${fontSizeStr};
                        line-height: 1.35;
                        color: #000;
                    }
                    table {
                        border-collapse: collapse;
                    }
                </style>
            </head>
            <body>
                ${docBody}
            </body>
            </html>
        `;

        try {
            const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const sanitizedSubject = data.subject.replace(/[^a-zA-Z0-9]/g, '_');
            const sanitizedClass = data.className.replace(/[^a-zA-Z0-9]/g, '_');
            a.download = `${fileSuffix}_${data.assessmentType.toUpperCase()}_${sanitizedSubject}_${sanitizedClass}_${paperSize}.doc`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            notify(`Dokumen Word (${fileSuffix}) siap pakai berhasil diunduh!`, 'success');
        } catch (e) {
            console.error("Export error:", e);
            notify("Gagal mengunduh dokumen. Silakan coba kembali.", "error");
        }
    };

    return (
        <div className="space-y-6 pb-16">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                            Kurikulum Merdeka BSKAP 046 &bull; PPA SD 2026 Sah & Siap Pakai
                        </span>
                        {isProtaLocked ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                                <Lock className="w-3 h-3 text-emerald-400" />
                                Database Prota Terkunci & Siap Digunakan
                            </span>
                        ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30 flex items-center gap-1">
                                <Unlock className="w-3 h-3 text-amber-400" />
                                Prota Belum Dikunci
                            </span>
                        )}
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Pembuat Naskah Asesmen Sumatif Sah & Siap Pakai
                    </h1>
                    <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                        Hasilkan naskah soal yang valid, bermakna, dan relevan dengan stimulus visual kontekstual asli sesuai capaian pembelajaran jenjang SD. Siap cetak dan siap dibagikan ke siswa.
                    </p>

                    {/* Class & Subject Selector Quick Bar */}
                    <div className="mt-5 flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-semibold">
                            <span className="text-slate-300">Kelas Terdaftar:</span>
                            <span className="font-bold text-amber-300">{activeClass}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-semibold">
                            <span className="text-slate-300">Mata Pelajaran:</span>
                            {lockedProtaList.length > 0 ? (
                                <select
                                    value={activeSubject}
                                    onChange={(e) => setActiveSubject(e.target.value)}
                                    className="bg-slate-900/70 text-blue-100 font-bold text-xs px-2 py-0.5 rounded-lg border border-white/20 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                                >
                                    {!lockedProtaList.some(p => isSameSubject(p.subject, activeSubject)) && (
                                        <option value={activeSubject}>{activeSubject}</option>
                                    )}
                                    {lockedProtaList.map((p, i) => (
                                        <option key={`${p.subject}-${i}`} value={p.subject}>
                                            {p.subject} {p.locked ? '(Terkunci)' : '(Belum Dikunci)'}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <span className="font-bold text-blue-200">{activeSubject}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-semibold">
                            <span className="text-slate-300">Lokasi Titimangsa:</span>
                            <span className="font-bold text-emerald-300">{userIdentity.location || 'Sukatinggal'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Warning if no locked Prota exists */}
            {!isProtaLocked && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-amber-900 text-sm">Program Tahunan (Prota) Belum Dikunci</h4>
                            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                                Untuk memastikan keselarasan TP dan ATP yang resmi, silakan kunci Prota <b>{activeSubject} ({activeClass})</b> pada menu Program Tahunan.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => onNavigate('generator')}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                        <span>Buka Halaman Prota</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Step 1: PILIHAN JENIS ASESMEN SUMATIF */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-blue-600" />
                            <span>1. Pilih Jenis Naskah Asesmen Sumatif</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Pilihan aktif disesuaikan dengan regulasi jenjang kelas dan panduan asesmen PPA 2026.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Option 1: Sumatif Harian */}
                    <div 
                        onClick={() => handleSelectAssessmentType('harian')}
                        className={`rounded-2xl p-4.5 border-2 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                            assessmentType === 'harian' 
                                ? 'border-blue-600 bg-blue-50/50 shadow-sm' 
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                    >
                        {assessmentType === 'harian' && (
                            <div className="absolute top-2 right-2">
                                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                            </div>
                        )}
                        <div>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 tracking-wider">
                                Kelas 1 - 6 Aktif
                            </span>
                            <h3 className="font-extrabold text-sm text-slate-900 mt-2">
                                1. Sumatif Harian
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Asesmen per Lingkup Materi / Tujuan Pembelajaran (TP) spesifik untuk evaluasi belajar berkala.
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                            <span>Pilih per TP/Alur</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                    </div>

                    {/* Option 2: ASAS Semester 1 */}
                    <div 
                        onClick={() => handleSelectAssessmentType('asas')}
                        className={`rounded-2xl p-4.5 border-2 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                            assessmentType === 'asas' 
                                ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                    >
                        {assessmentType === 'asas' && (
                            <div className="absolute top-2 right-2">
                                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                            </div>
                        )}
                        <div>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 tracking-wider">
                                Kelas 1 - 6 Aktif
                            </span>
                            <h3 className="font-extrabold text-sm text-slate-900 mt-2">
                                2. Asesmen Sumatif (ASAS) Semester 1
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Evaluasi komprehensif seluruh TP yang dipelajari pada Semester 1 (Ganjil).
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
                            <span>Semester 1</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                    </div>

                    {/* Option 3: ASAT Semester 2 (Kelas 1 - 5) */}
                    <div 
                        onClick={() => handleSelectAssessmentType('asat')}
                        className={`rounded-2xl p-4.5 border-2 transition-all flex flex-col justify-between relative overflow-hidden ${
                            isClass6 
                                ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed' 
                                : assessmentType === 'asat' 
                                    ? 'border-emerald-600 bg-emerald-50/50 shadow-sm cursor-pointer' 
                                    : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                        }`}
                    >
                        {assessmentType === 'asat' && !isClass6 && (
                            <div className="absolute top-2 right-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider ${
                                    isClass6 ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                    {isClass6 ? 'Khusus Kelas 1 - 5' : 'Kelas 1 - 5 Aktif'}
                                </span>
                            </div>
                            <h3 className="font-extrabold text-sm text-slate-900 mt-2">
                                3. Asesmen Sumatif Akhir Tahun (ASAT)
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                {isClass6 
                                    ? 'Kelas 6 menggunakan ASAJ (Asesmen Sumatif Akhir Jenjang) sesuai regulasi kelulusan.' 
                                    : 'Evaluasi kenaikan kelas mencakup seluruh TP Semester 2 (Genap) untuk Kelas 1 s/d 5.'}
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                            <span>{isClass6 ? 'Nonaktif untuk Kelas 6' : 'Semester 2 Kenaikan Kelas'}</span>
                        </div>
                    </div>

                    {/* Option 4: ASAJ Untuk Kelas 6 */}
                    <div 
                        onClick={() => handleSelectAssessmentType('asaj')}
                        className={`rounded-2xl p-4.5 border-2 transition-all flex flex-col justify-between relative overflow-hidden ${
                            !isClass6 
                                ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed' 
                                : assessmentType === 'asaj' 
                                    ? 'border-purple-600 bg-purple-50/50 shadow-sm cursor-pointer' 
                                    : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                        }`}
                    >
                        {assessmentType === 'asaj' && isClass6 && (
                            <div className="absolute top-2 right-2">
                                <CheckCircle2 className="w-5 h-5 text-purple-600" />
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider ${
                                    !isClass6 ? 'bg-slate-200 text-slate-600' : 'bg-purple-100 text-purple-800'
                                }`}>
                                    {isClass6 ? 'Khusus Kelas 6 Aktif' : 'Khusus Kelas 6'}
                                </span>
                            </div>
                            <h3 className="font-extrabold text-sm text-slate-900 mt-2">
                                4. Asesmen Sumatif Akhir Jenjang (ASAJ)
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                {!isClass6 
                                    ? 'Pilihan khusus bagi peserta didik Kelas 6 sebagai penentu kelulusan akhir jenjang SD.' 
                                    : 'Asesmen kelulusan akhir jenjang SD mencakup penguasaan materi esensial secara menyeluruh.'}
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-purple-600 flex items-center gap-1">
                            <span>{isClass6 ? 'Kelulusan SD' : 'Nonaktif untuk Kelas 1 - 5'}</span>
                        </div>
                    </div>
                </div>

                {/* Sub-selection for Sumatif Harian: Pick TP */}
                {assessmentType === 'harian' && extractedTpList.length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Pilih Tujuan Pembelajaran (TP) / Lingkup Materi yang Diuji:
                        </label>
                        <select
                            value={selectedTpId}
                            onChange={(e) => setSelectedTpId(Number(e.target.value))}
                            className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                        >
                            {extractedTpList.map((tp) => (
                                <option key={tp.id} value={tp.id}>
                                    TP {tp.id} (Sem {tp.semester} - {tp.element}): {tp.tp}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Step 2: KONFIGURASI TATA LETAK, FONT & KOMPOSISI SOAL */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div>
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <SlidersHorizontal className="w-5 h-5 text-emerald-600" />
                        <span>2. Konfigurasi Naskah & Butir Soal</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Atur jenis huruf, ukuran font, tata letak opsi jawaban A-B-C-D, jumlah soal, dan tingkat kesulitan.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* 1. Font Family & Font Size */}
                    <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                        <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <PenLine className="w-3.5 h-3.5 text-blue-600" />
                            <span>Jenis & Ukuran Font</span>
                        </h4>
                        
                        <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jenis Huruf (Font):</label>
                            <select
                                value={fontFamily}
                                onChange={(e) => setFontFamily(e.target.value as FontFamily)}
                                className="w-full text-xs font-medium p-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="Times New Roman">Times New Roman (Standar Formal)</option>
                                <option value="Calibri">Calibri (Modern Bersih)</option>
                                <option value="Arial">Arial (Standar Jelas)</option>
                                <option value="Comic Sans MS">Comic Sans MS (Ramah Siswa Rendah)</option>
                                <option value="Bookman Old Style">Bookman Old Style (Klasik)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Ukuran Huruf (Font Size):</label>
                            <div className="grid grid-cols-4 gap-1.5">
                                {(['10pt', '11pt', '12pt', '14pt'] as FontSize[]).map(sz => (
                                    <button
                                        key={sz}
                                        type="button"
                                        onClick={() => setFontSize(sz)}
                                        className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                            fontSize === sz 
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs' 
                                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        {sz}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 2. Opsi Pilihan Jawaban A, B, C, D Layout */}
                    <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                        <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Tata Letak Opsi (A, B, C, D)</span>
                        </h4>

                        <div className="space-y-2">
                            <label 
                                onClick={() => setOptionsLayout('horizontal')}
                                className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                                    optionsLayout === 'horizontal' 
                                        ? 'bg-indigo-50 border-indigo-400 text-indigo-900' 
                                        : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                                }`}
                            >
                                <input 
                                    type="radio" 
                                    name="optionsLayout" 
                                    checked={optionsLayout === 'horizontal'} 
                                    onChange={() => setOptionsLayout('horizontal')} 
                                    className="mt-0.5 text-indigo-600"
                                />
                                <div>
                                    <div className="text-xs font-bold">Satu Baris Sejajar Horizontal</div>
                                    <div className="text-[10.5px] text-slate-500 font-mono mt-0.5">A. ... &nbsp; B. ... &nbsp; C. ... &nbsp; D. ...</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">Menghemat halaman kertas cetak ujian.</div>
                                </div>
                            </label>

                            <label 
                                onClick={() => setOptionsLayout('vertikal')}
                                className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                                    optionsLayout === 'vertikal' 
                                        ? 'bg-indigo-50 border-indigo-400 text-indigo-900' 
                                        : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                                }`}
                            >
                                <input 
                                    type="radio" 
                                    name="optionsLayout" 
                                    checked={optionsLayout === 'vertikal'} 
                                    onChange={() => setOptionsLayout('vertikal')} 
                                    className="mt-0.5 text-indigo-600"
                                />
                                <div>
                                    <div className="text-xs font-bold">Vertikal ke Bawah (Satu Baris per Opsi)</div>
                                    <div className="text-[10.5px] text-slate-500 font-mono mt-0.5">A. ...<br/>B. ...<br/>C. ...</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">Sangat ramah anak, mudah dibaca.</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* 3. Jumlah Soal (PG, Isian, Uraian) */}
                    <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                        <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <FileQuestion className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Jumlah Butir Soal</span>
                        </h4>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-700">Pilihan Ganda (PG):</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={5}
                                        max={35}
                                        value={pgCount}
                                        onChange={(e) => setPgCount(Math.max(1, parseInt(e.target.value) || 0))}
                                        className="w-16 text-center text-xs font-bold p-1 rounded-lg border border-slate-300 bg-white"
                                    />
                                    <span className="text-xs text-slate-500">butir</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-700">Isian Singkat:</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={0}
                                        max={15}
                                        value={isianCount}
                                        onChange={(e) => setIsianCount(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="w-16 text-center text-xs font-bold p-1 rounded-lg border border-slate-300 bg-white"
                                    />
                                    <span className="text-xs text-slate-500">butir</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-700">Uraian / Soal Cerita:</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={0}
                                        max={10}
                                        value={uraianCount}
                                        onChange={(e) => setUraianCount(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="w-16 text-center text-xs font-bold p-1 rounded-lg border border-slate-300 bg-white"
                                    />
                                    <span className="text-xs text-slate-500">butir</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Settings: Difficulty Weights, Visual Graphics, Paper Size */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2 border-t border-slate-100">
                    {/* Komposisi Tingkat Kesulitan HOTS, MOTS, LOTS */}
                    <div className="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700">Komposisi Kesulitan:</span>
                            <span className="text-[11px] font-extrabold text-blue-700">
                                {difficultyWeights.lots}% LOTS / {difficultyWeights.mots}% MOTS / {difficultyWeights.hots}% HOTS
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                            <button
                                type="button"
                                onClick={() => setDifficultyWeights({ lots: 20, mots: 50, hots: 30 })}
                                className="px-2 py-1.5 text-[10.5px] font-bold rounded-lg border bg-white hover:bg-slate-100 border-slate-200 text-slate-700 text-center cursor-pointer"
                            >
                                Standar PPA (20/50/30)
                            </button>
                            <button
                                type="button"
                                onClick={() => setDifficultyWeights({ lots: 10, mots: 40, hots: 50 })}
                                className="px-2 py-1.5 text-[10.5px] font-bold rounded-lg border bg-white hover:bg-slate-100 border-slate-200 text-slate-700 text-center cursor-pointer"
                            >
                                Dominan HOTS (10/40/50)
                            </button>
                            <button
                                type="button"
                                onClick={() => setDifficultyWeights({ lots: 40, mots: 40, hots: 20 })}
                                className="px-2 py-1.5 text-[10.5px] font-bold rounded-lg border bg-white hover:bg-slate-100 border-slate-200 text-slate-700 text-center cursor-pointer"
                            >
                                Dasar (40/40/20)
                            </button>
                        </div>
                    </div>

                    {/* Gambar Animasi / Visual Soal PPA 2026 */}
                    <div className="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                                    <span>Gambar Visual Kontekstual Edukatif:</span>
                                </span>
                                <input
                                    type="checkbox"
                                    checked={includeVisuals}
                                    onChange={(e) => setIncludeVisuals(e.target.checked)}
                                    className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                                />
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                Gambar otomatis diselaraskan secara akurat dan valid dengan pertanyaan soal (sudut jam, pecahan, geometri, anatomi, siklus, perisai Garuda, diagram data).
                            </p>
                        </div>
                        <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-block w-fit">
                            Relevan &bull; Terhubung Langsung ke Butir Soal
                        </span>
                    </div>

                    {/* Ukuran Kertas Cetak */}
                    <div className="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-bold text-slate-700">Ukuran Kertas Ekspor Word:</span>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setPaperSize('A4')}
                                    className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                        paperSize === 'A4' 
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs' 
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    A4 (21 x 29.7 cm)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaperSize('F4')}
                                    className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                        paperSize === 'F4' 
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs' 
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    F4 / Folio (21.5 x 33 cm)
                                </button>
                            </div>
                        </div>
                        <span className="text-[10px] text-slate-400">Format margin rapi & siap sebar/cetak.</span>
                    </div>
                </div>

                {/* Primary Action Button: Hasilkan Naskah Asesmen */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-slate-500">
                        Total butir soal yang akan disusun: <b>{pgCount + isianCount + uraianCount} Butir</b> ({pgCount} PG, {isianCount} Isian, {uraianCount} Uraian).
                    </div>
                    
                    <button
                        onClick={handleGenerateAssessment}
                        disabled={isGenerating}
                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Menyusun Naskah Asesmen Valid & Relevan...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 text-amber-300" />
                                <span>Hasilkan Naskah Soal Sah & Siap Pakai</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Step 3: OUTPUT DOKUMEN PREVIEW & UNDUH WORD */}
            {generatedAssessment && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                                    {generatedAssessment.assessmentType.toUpperCase()}
                                </span>
                                <span className="text-xs font-bold text-slate-800">
                                    {generatedAssessment.subject} &bull; {generatedAssessment.className}
                                </span>
                                <span className="text-xs text-slate-400">
                                    TA {generatedAssessment.academicYear}
                                </span>
                                <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                    Sah & Siap Disebarkan
                                </span>
                            </div>
                            <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                                Dokumen Output Asesmen Lengkap Siap Unduh
                            </h3>
                        </div>

                        {/* Download Complete Package Button */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={() => exportWordDocument('all')}
                                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                                title="Unduh Paket Lengkap (Kisi-kisi, Naskah Soal, Kunci Jawaban, dan Rubrik)"
                            >
                                <FileDown className="w-4 h-4" />
                                <span>Unduh Paket Lengkap (4 Dokumen .doc)</span>
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs for 4 Documents */}
                    <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
                        <button
                            onClick={() => setActiveDocTab('naskah_soal')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                activeDocTab === 'naskah_soal' 
                                    ? 'bg-blue-600 text-white shadow-sm' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span>1. Naskah Soal Ujian</span>
                        </button>

                        <button
                            onClick={() => setActiveDocTab('kisi_kisi')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                activeDocTab === 'kisi_kisi' 
                                    ? 'bg-blue-600 text-white shadow-sm' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            <span>2. Kisi-kisi Soal</span>
                        </button>

                        <button
                            onClick={() => setActiveDocTab('kunci_jawaban')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                activeDocTab === 'kunci_jawaban' 
                                    ? 'bg-blue-600 text-white shadow-sm' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>3. Kunci Jawaban</span>
                        </button>

                        <button
                            onClick={() => setActiveDocTab('rubrik_skor')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                activeDocTab === 'rubrik_skor' 
                                    ? 'bg-blue-600 text-white shadow-sm' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <Award className="w-3.5 h-3.5" />
                            <span>4. Rubrik & Penskoran</span>
                        </button>

                        {/* Separate Download Button for Active Tab */}
                        <div className="ml-auto">
                            <button
                                onClick={() => exportWordDocument(activeDocTab)}
                                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Unduh Dokumen Ini (.doc)</span>
                            </button>
                        </div>
                    </div>

                    {/* PREVIEW CONTAINER */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 overflow-x-auto max-h-[750px] overflow-y-auto">
                        {/* TAB 1: NASKAH SOAL PREVIEW */}
                        {activeDocTab === 'naskah_soal' && (
                            <div 
                                className="bg-white p-6 sm:p-8 rounded-xl shadow-xs border border-slate-200 mx-auto max-w-4xl"
                                style={{ fontFamily: generatedAssessment.fontFamily, fontSize: generatedAssessment.fontSize }}
                            >
                                <div className="text-center font-bold text-base sm:text-lg uppercase">
                                    {generatedAssessment.assessmentType === 'harian' ? 'ASESMEN SUMATIF HARIAN' :
                                     generatedAssessment.assessmentType === 'asas' ? 'ASESMEN SUMATIF AKHIR SEMESTER (ASAS)' :
                                     generatedAssessment.assessmentType === 'asat' ? 'ASESMEN SUMATIF AKHIR TAHUN (ASAT)' :
                                     'ASESMEN SUMATIF AKHIR JENJANG (ASAJ)'}
                                </div>
                                <div className="text-center text-xs sm:text-sm font-semibold text-slate-600 mb-4">
                                    {userIdentity.institutionName || 'SDN SUKATINGGAL'} &bull; TAHUN AJARAN {generatedAssessment.academicYear}
                                </div>

                                {/* Identity Bar */}
                                <div className="grid grid-cols-2 gap-2 text-xs border border-slate-300 p-3 rounded-lg mb-6 bg-slate-50/50">
                                    <div><b>Mata Pelajaran:</b> {generatedAssessment.subject}</div>
                                    <div><b>Nama Peserta Didik:</b> ....................................</div>
                                    <div><b>Kelas / Semester:</b> {generatedAssessment.className} / Sem {generatedAssessment.semester}</div>
                                    <div><b>Nomor Absen:</b> ....................................</div>
                                </div>

                                {/* Bagian I: PG */}
                                <div className="font-bold text-sm mb-4 bg-slate-100 p-2 rounded flex items-center justify-between">
                                    <span>I. Berilah tanda silang (X) pada huruf {generatedAssessment.className.includes('1') || generatedAssessment.className.includes('2') ? 'A, B, atau C' : 'A, B, C, atau D'} pada jawaban yang paling benar!</span>
                                </div>

                                <div className="space-y-6">
                                    {generatedAssessment.pgQuestions.map((q, idx) => (
                                        <div key={q.no} className="text-xs sm:text-sm space-y-2 p-3 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50/50 transition-colors group relative">
                                            <div className="flex gap-2">
                                                <span className="font-bold">{q.no}.</span>
                                                <div className="flex-1">
                                                    {q.stimulus && (
                                                        <div className="italic text-slate-700 font-medium mb-1.5 leading-relaxed bg-slate-50 p-2 rounded-lg border-l-3 border-blue-400">
                                                            {q.stimulus}
                                                        </div>
                                                    )}
                                                    {q.visualSvg && (
                                                        <div className="my-2.5 p-3 bg-white border border-slate-200 rounded-xl text-center shadow-2xs max-w-xs mx-auto">
                                                            {q.visualTitle && (
                                                                <div className="text-[11px] font-bold text-slate-700 mb-1">
                                                                    {q.visualTitle}
                                                                </div>
                                                            )}
                                                            <div dangerouslySetInnerHTML={{ __html: q.visualSvg }} />
                                                        </div>
                                                    )}
                                                    <div className="font-semibold text-slate-900 leading-snug">{q.question}</div>

                                                    {generatedAssessment.optionsLayout === 'horizontal' ? (
                                                        <div className="flex flex-wrap gap-4 mt-2.5">
                                                            {q.options.map(opt => (
                                                                <span key={opt.key} className="inline-block">
                                                                    <b>{opt.key}.</b> {opt.text}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1.5 mt-2 pl-2">
                                                            {q.options.map(opt => (
                                                                <div key={opt.key}>
                                                                    <b>{opt.key}.</b> {opt.text}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Edit Question Action Button */}
                                                <button
                                                    onClick={() => setEditingQuestionModal({ type: 'pg', index: idx, data: { ...q } })}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-blue-600 rounded-md hover:bg-white self-start"
                                                    title="Edit butir soal ini"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Bagian II: Isian Singkat */}
                                {generatedAssessment.isianQuestions.length > 0 && (
                                    <div className="mt-8 space-y-4">
                                        <div className="font-bold text-sm bg-slate-100 p-2 rounded">
                                            II. Isilah titik-titik di bawah ini dengan jawaban yang singkat dan tepat!
                                        </div>
                                        <div className="space-y-3">
                                            {generatedAssessment.isianQuestions.map((q, idx) => (
                                                <div key={q.no} className="flex gap-2 text-xs sm:text-sm p-2 rounded-lg hover:bg-slate-50 group">
                                                    <span className="font-bold">{q.no}.</span>
                                                    <span className="flex-1">
                                                        {q.stimulus && <span className="italic text-slate-600 block mb-1">{q.stimulus}</span>}
                                                        {q.question}
                                                    </span>
                                                    <button
                                                        onClick={() => setEditingQuestionModal({ type: 'isian', index: idx, data: { ...q } })}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-blue-600 self-start"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Bagian III: Uraian */}
                                {generatedAssessment.uraianQuestions.length > 0 && (
                                    <div className="mt-8 space-y-4">
                                        <div className="font-bold text-sm bg-slate-100 p-2 rounded">
                                            III. Jawablah pertanyaan-pertanyaan berikut dengan jelas, tepat, dan runtut!
                                        </div>
                                        <div className="space-y-5">
                                            {generatedAssessment.uraianQuestions.map((q, idx) => (
                                                <div key={q.no} className="text-xs sm:text-sm space-y-2 p-2 rounded-lg hover:bg-slate-50 group">
                                                    <div className="flex gap-2">
                                                        <span className="font-bold">{q.no}.</span>
                                                        <span className="flex-1">
                                                            {q.stimulus && <span className="italic text-slate-600 block mb-1">{q.stimulus}</span>}
                                                            {q.question}
                                                        </span>
                                                        <button
                                                            onClick={() => setEditingQuestionModal({ type: 'uraian', index: idx, data: { ...q } })}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-blue-600 self-start"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <div className="border-b border-dotted border-slate-300 h-6 w-full"></div>
                                                    <div className="border-b border-dotted border-slate-300 h-6 w-full"></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 2: KISI-KISI PREVIEW */}
                        {activeDocTab === 'kisi_kisi' && (
                            <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200">
                                <h4 className="font-bold text-sm text-center mb-4 uppercase">
                                    Tabel Kisi-Kisi Penulisan Soal {generatedAssessment.assessmentType.toUpperCase()}
                                </h4>
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100 text-slate-700">
                                            <th className="border p-2 text-center">No</th>
                                            <th className="border p-2 text-left">Tujuan Pembelajaran (TP)</th>
                                            <th className="border p-2 text-left">Lingkup Materi</th>
                                            <th className="border p-2 text-left">Indikator Soal</th>
                                            <th className="border p-2 text-center">Level</th>
                                            <th className="border p-2 text-center">Bentuk</th>
                                            <th className="border p-2 text-center">No Soal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {generatedAssessment.pgQuestions.map(q => (
                                            <tr key={`pg_${q.no}`}>
                                                <td className="border p-2 text-center">{q.no}</td>
                                                <td className="border p-2">{q.tp}</td>
                                                <td className="border p-2">{q.materi}</td>
                                                <td className="border p-2">{q.indikator}</td>
                                                <td className="border p-2 text-center font-bold">{q.cognitiveLevel}</td>
                                                <td className="border p-2 text-center">PG</td>
                                                <td className="border p-2 text-center font-bold">{q.no}</td>
                                            </tr>
                                        ))}
                                        {generatedAssessment.isianQuestions.map(q => (
                                            <tr key={`is_${q.no}`}>
                                                <td className="border p-2 text-center">{generatedAssessment.pgQuestions.length + q.no}</td>
                                                <td className="border p-2">{q.tp}</td>
                                                <td className="border p-2">{q.materi}</td>
                                                <td className="border p-2">{q.indikator}</td>
                                                <td className="border p-2 text-center font-bold">{q.cognitiveLevel}</td>
                                                <td className="border p-2 text-center">Isian</td>
                                                <td className="border p-2 text-center font-bold">{q.no}</td>
                                            </tr>
                                        ))}
                                        {generatedAssessment.uraianQuestions.map(q => (
                                            <tr key={`ur_${q.no}`}>
                                                <td className="border p-2 text-center">{generatedAssessment.pgQuestions.length + generatedAssessment.isianQuestions.length + q.no}</td>
                                                <td className="border p-2">{q.tp}</td>
                                                <td className="border p-2">{q.materi}</td>
                                                <td className="border p-2">{q.indikator}</td>
                                                <td className="border p-2 text-center font-bold">{q.cognitiveLevel}</td>
                                                <td className="border p-2 text-center">Uraian</td>
                                                <td className="border p-2 text-center font-bold">{q.no}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* TAB 3: KUNCI JAWABAN PREVIEW */}
                        {activeDocTab === 'kunci_jawaban' && (
                            <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200 space-y-6">
                                <h4 className="font-bold text-sm text-center uppercase">
                                    Kunci Jawaban & Pembahasan {generatedAssessment.assessmentType.toUpperCase()}
                                </h4>

                                <div>
                                    <div className="font-bold text-xs bg-slate-100 p-2 rounded mb-3">
                                        Kunci Jawaban Pilihan Ganda:
                                    </div>
                                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                        {generatedAssessment.pgQuestions.map(q => (
                                            <div key={q.no} className="border border-slate-200 rounded-xl p-2 text-center">
                                                <div className="text-[10px] text-slate-400 font-semibold">No {q.no}</div>
                                                <div className="text-sm font-bold text-blue-700">{q.correctAnswer}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {generatedAssessment.isianQuestions.length > 0 && (
                                    <div>
                                        <div className="font-bold text-xs bg-slate-100 p-2 rounded mb-3">
                                            Kunci Jawaban Isian Singkat:
                                        </div>
                                        <div className="space-y-1 text-xs">
                                            {generatedAssessment.isianQuestions.map(q => (
                                                <div key={q.no} className="p-2 border-b border-slate-100 flex gap-2">
                                                    <span className="font-bold w-12">No {q.no}:</span>
                                                    <span className="font-semibold text-emerald-700">{q.correctAnswer}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {generatedAssessment.uraianQuestions.length > 0 && (
                                    <div>
                                        <div className="font-bold text-xs bg-slate-100 p-2 rounded mb-3">
                                            Pedoman Jawaban Soal Uraian:
                                        </div>
                                        <div className="space-y-3 text-xs">
                                            {generatedAssessment.uraianQuestions.map(q => (
                                                <div key={q.no} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                                                    <div className="font-bold text-slate-800">Soal No {q.no}: {q.question}</div>
                                                    <div className="text-blue-900 whitespace-pre-line font-medium pl-2 border-l-2 border-blue-500">
                                                        {q.correctAnswer}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 4: RUBRIK & PENSKORAN PREVIEW */}
                        {activeDocTab === 'rubrik_skor' && (
                            <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200 space-y-6">
                                <h4 className="font-bold text-sm text-center uppercase">
                                    Pedoman Penskoran dan Rubrik Penilaian Asesmen Sumatif
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                                        <div className="text-xs text-blue-700 font-semibold">Skor Pilihan Ganda</div>
                                        <div className="text-xl font-extrabold text-blue-900 mt-0.5">{generatedAssessment.pgQuestions.length * 1} Poin</div>
                                        <div className="text-[10px] text-blue-600">1 Poin per butir</div>
                                    </div>
                                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                                        <div className="text-xs text-indigo-700 font-semibold">Skor Isian Singkat</div>
                                        <div className="text-xl font-extrabold text-indigo-900 mt-0.5">{generatedAssessment.isianQuestions.length * 2} Poin</div>
                                        <div className="text-[10px] text-indigo-600">2 Poin per butir</div>
                                    </div>
                                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                                        <div className="text-xs text-purple-700 font-semibold">Skor Uraian</div>
                                        <div className="text-xl font-extrabold text-purple-900 mt-0.5">{generatedAssessment.uraianQuestions.length * 3} Poin</div>
                                        <div className="text-[10px] text-purple-600">3 Poin per butir</div>
                                    </div>
                                </div>

                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                                    <div className="text-xs font-bold text-emerald-800">Rumus Penentuan Nilai Akhir (NA):</div>
                                    <div className="text-sm font-extrabold text-emerald-950 mt-1">
                                        NA = (Total Skor Perolehan / Skor Maksimal {generatedAssessment.totalScoreMax}) &times; 100
                                    </div>
                                </div>

                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100 text-slate-700">
                                            <th className="border p-2 text-center width-12">Skor</th>
                                            <th className="border p-2 text-left width-24">Kategori</th>
                                            <th className="border p-2 text-left">Deskripsi Kriteria Ketercapaian</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border p-2 text-center font-bold text-emerald-700 text-sm">3</td>
                                            <td className="border p-2 font-bold">Sangat Lengkap & Tepat</td>
                                            <td className="border p-2">Jawaban sangat lengkap, tepat sesuai konsep, langkah terstruktur dan mencerminkan pemahaman mendalam.</td>
                                        </tr>
                                        <tr>
                                            <td className="border p-2 text-center font-bold text-blue-700 text-sm">2</td>
                                            <td className="border p-2 font-bold">Cukup Lengkap</td>
                                            <td className="border p-2">Jawaban benar secara umum namun penjelasan kurang mendalam atau langkah belum tuntas.</td>
                                        </tr>
                                        <tr>
                                            <td className="border p-2 text-center font-bold text-amber-700 text-sm">1</td>
                                            <td className="border p-2 font-bold">Kurang Lengkap</td>
                                            <td className="border p-2">Hanya menyebutkan sebagian kecil fakta, masih terdapat kekeliruan konsep pokok.</td>
                                        </tr>
                                        <tr>
                                            <td className="border p-2 text-center font-bold text-red-700 text-sm">0</td>
                                            <td className="border p-2 font-bold">Tidak Menjawab / Salah</td>
                                            <td className="border p-2">Tidak ada jawaban yang relevan atau tidak menjawab sama sekali.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL EDIT BUTIR SOAL */}
            {editingQuestionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Edit3 className="w-4 h-4 text-blue-600" />
                                <span>Edit Butir Soal #{editingQuestionModal.data.no} ({editingQuestionModal.type.toUpperCase()})</span>
                            </h3>
                            <button 
                                onClick={() => setEditingQuestionModal(null)}
                                className="text-slate-400 hover:text-slate-700 p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Stimulus / Teks Pengantar (Opsional):</label>
                                <textarea
                                    value={editingQuestionModal.data.stimulus || ''}
                                    onChange={(e) => setEditingQuestionModal({
                                        ...editingQuestionModal,
                                        data: { ...editingQuestionModal.data, stimulus: e.target.value }
                                    })}
                                    rows={2}
                                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    placeholder="Contoh: Perhatikan gambar jam dinding berikut..."
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Pertanyaan Soal:</label>
                                <textarea
                                    value={editingQuestionModal.data.question || ''}
                                    onChange={(e) => setEditingQuestionModal({
                                        ...editingQuestionModal,
                                        data: { ...editingQuestionModal.data, question: e.target.value }
                                    })}
                                    rows={3}
                                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* If PG: Options & Visual Type */}
                            {editingQuestionModal.type === 'pg' && (
                                <>
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">Pilihan Gambar Visual:</label>
                                        <select
                                            value={editingQuestionModal.data.visualType || 'none'}
                                            onChange={(e) => setEditingQuestionModal({
                                                ...editingQuestionModal,
                                                data: { ...editingQuestionModal.data, visualType: e.target.value as VisualType }
                                            })}
                                            className="w-full p-2 border border-slate-300 rounded-xl bg-white"
                                        >
                                            <option value="none">Tanpa Gambar Visual (Teks Murni)</option>
                                            <option value="clock_0900">Jam Dinding Pukul 09.00 (Sudut Siku-siku)</option>
                                            <option value="clock_0200">Jam Dinding Pukul 02.00 (Sudut Lancip)</option>
                                            <option value="fraction_circle">Lingkaran Pecahan (2/6 = 1/3 diarsir)</option>
                                            <option value="fraction_rect">Persegi Panjang Pecahan (3/8 diarsir)</option>
                                            <option value="shape_rect">Persegi Panjang (12 cm x 6 cm)</option>
                                            <option value="shape_triangle">Segitiga Siku-siku (Alas 8 cm, Tinggi 6 cm)</option>
                                            <option value="shape_cube">Kubus (Rusuk 5 cm)</option>
                                            <option value="cube_net">Jaring-jaring Kubus</option>
                                            <option value="plant_anatomy">Anatomi Bagian Tumbuhan (Bunga, Daun, Batang, Akar)</option>
                                            <option value="water_cycle">Siklus Air / Daur Air (Evaporasi, Kondensasi, Presipitasi)</option>
                                            <option value="food_chain">Rantai Makanan Sawah (Padi - Belalang - Katak - Ular)</option>
                                            <option value="garuda_bintang">Simbol Pancasila: Sila 1 (Bintang Emas)</option>
                                            <option value="garuda_rantai">Simbol Pancasila: Sila 2 (Rantai Emas)</option>
                                            <option value="garuda_beringin">Simbol Pancasila: Sila 3 (Pohon Beringin)</option>
                                            <option value="garuda_banteng">Simbol Pancasila: Sila 4 (Kepala Banteng)</option>
                                            <option value="garuda_padi_kapas">Simbol Pancasila: Sila 5 (Padi & Kapas)</option>
                                            <option value="traffic_sign">Rambu Lalu Lintas (Dilarang Parkir)</option>
                                            <option value="chart_bar">Diagram Batang Data Peminjaman Buku</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block font-bold text-slate-700">Opsi Jawaban:</label>
                                        {(editingQuestionModal.data.options || []).map((opt: any, optIdx: number) => (
                                            <div key={opt.key} className="flex items-center gap-2">
                                                <span className="font-bold w-6">{opt.key}.</span>
                                                <input
                                                    type="text"
                                                    value={opt.text}
                                                    onChange={(e) => {
                                                        const newOpts = [...editingQuestionModal.data.options];
                                                        newOpts[optIdx] = { ...opt, text: e.target.value };
                                                        setEditingQuestionModal({
                                                            ...editingQuestionModal,
                                                            data: { ...editingQuestionModal.data, options: newOpts }
                                                        });
                                                    }}
                                                    className="flex-1 p-2 border border-slate-300 rounded-xl"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block font-bold text-slate-700 mb-1">Kunci Jawaban Benar:</label>
                                            <select
                                                value={editingQuestionModal.data.correctAnswer}
                                                onChange={(e) => setEditingQuestionModal({
                                                    ...editingQuestionModal,
                                                    data: { ...editingQuestionModal.data, correctAnswer: e.target.value }
                                                })}
                                                className="w-full p-2 border border-slate-300 rounded-xl font-bold text-blue-700"
                                            >
                                                {(editingQuestionModal.data.options || []).map((opt: any) => (
                                                    <option key={opt.key} value={opt.key}>Opsi {opt.key}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block font-bold text-slate-700 mb-1">Level Kognitif:</label>
                                            <select
                                                value={editingQuestionModal.data.cognitiveLevel}
                                                onChange={(e) => setEditingQuestionModal({
                                                    ...editingQuestionModal,
                                                    data: { ...editingQuestionModal.data, cognitiveLevel: e.target.value }
                                                })}
                                                className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                                            >
                                                <option value="LOTS">LOTS (Mengingat / C1-C2)</option>
                                                <option value="MOTS">MOTS (Menerapkan / C3)</option>
                                                <option value="HOTS">HOTS (Menganalisis / C4-C5)</option>
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* If Isian or Uraian */}
                            {editingQuestionModal.type !== 'pg' && (
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Kunci Jawaban / Pedoman:</label>
                                    <textarea
                                        value={editingQuestionModal.data.correctAnswer || ''}
                                        onChange={(e) => setEditingQuestionModal({
                                            ...editingQuestionModal,
                                            data: { ...editingQuestionModal.data, correctAnswer: e.target.value }
                                        })}
                                        rows={3}
                                        className="w-full p-2 border border-slate-300 rounded-xl font-medium text-emerald-800"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t">
                            <button
                                type="button"
                                onClick={() => setEditingQuestionModal(null)}
                                className="px-4 py-2 border rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={() => handleUpdateQuestion(editingQuestionModal.data)}
                                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center gap-1.5"
                            >
                                <Check className="w-4 h-4" />
                                <span>Simpan Perubahan</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- AUTHENTIC ELEMENTARY CURRICULUM QUESTION ENGINE (ZERO-DUPLICATE GUARANTEE) ---
export function generateAuthenticPgQuestions(
    subject: string,
    className: string,
    targetTps: any[],
    count: number,
    isFaseA: boolean,
    includeVisuals: boolean,
    weights: { lots: number; mots: number; hots: number }
): QuestionPG[] {
    return generateAuthenticPgQuestionsFromBank(
        subject,
        className,
        targetTps,
        count,
        isFaseA,
        includeVisuals,
        weights,
        undefined,
        renderVisualSvg
    );
}

export function generateAuthenticIsianQuestions(
    subject: string,
    className: string,
    targetTps: any[],
    count: number
): QuestionIsian[] {
    return generateAuthenticIsianQuestionsFromBank(subject, className, targetTps, count);
}

export function generateAuthenticUraianQuestions(
    subject: string,
    className: string,
    targetTps: any[],
    count: number
): QuestionUraian[] {
    return generateAuthenticUraianQuestionsFromBank(subject, className, targetTps, count);
}

