import {
    AlignmentType,
    BorderStyle,
    Document,
    ImageRun,
    Packer,
    PageOrientation,
    Paragraph,
    ShadingType,
    Table,
    TableCell,
    TableLayoutType,
    TableRow,
    TextRun,
    VerticalAlign,
    WidthType,
    convertMillimetersToTwip,
    ISectionOptions
} from 'docx';
import type { GeneratedAssessmentData, UserIdentity } from './NaskahSumatifGenerator';
import { isBahasaSundaSubject } from './questionBankHelper';

export type DocExportType = 'kisi_kisi' | 'naskah_soal' | 'kunci_jawaban' | 'rubrik_skor' | 'all';

interface RasterizedImage {
    data: Uint8Array;
    width: number;
    height: number;
}

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NO_BORDERS = {
    top: NO_BORDER,
    bottom: NO_BORDER,
    left: NO_BORDER,
    right: NO_BORDER,
    insideHorizontal: NO_BORDER,
    insideVertical: NO_BORDER
};
const CELL_THIN_BORDER = { style: BorderStyle.SINGLE, size: 6, color: '000000' };
const TABLE_SOLID_BORDERS = {
    top: CELL_THIN_BORDER,
    bottom: CELL_THIN_BORDER,
    left: CELL_THIN_BORDER,
    right: CELL_THIN_BORDER,
    insideHorizontal: CELL_THIN_BORDER,
    insideVertical: CELL_THIN_BORDER
};

/**
 * Normalizes SVG markup so XML/DOM image loaders never fail on unescaped entities or missing xmlns.
 */
export const sanitizeSvgMarkup = (rawSvg: string): string => {
    let s = String(rawSvg || '').trim();
    if (!s.includes('<svg')) return '';
    // Extract just the <svg>...</svg> element if wrapped in extra whitespace/tags
    const startIdx = s.indexOf('<svg');
    const endIdx = s.lastIndexOf('</svg>');
    if (startIdx !== -1 && endIdx !== -1) {
        s = s.slice(startIdx, endIdx + 6);
    }
    if (!/xmlns\s*=/.test(s)) {
        s = s.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!/font-family\s*=/.test(s)) {
        s = s.replace('<svg', '<svg font-family="Arial, Helvetica, sans-serif"');
    }
    // Escape bare ampersands not already part of a valid XML entity
    s = s.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');
    return s;
};

const parseSvgDimensions = (svgMarkup: string): { width: number; height: number } => {
    const wMatch = svgMarkup.match(/\bwidth\s*=\s*["']\s*([0-9.]+)/i);
    const hMatch = svgMarkup.match(/\bheight\s*=\s*["']\s*([0-9.]+)/i);
    if (wMatch && hMatch) {
        const w = Math.max(40, Math.round(parseFloat(wMatch[1])));
        const h = Math.max(30, Math.round(parseFloat(hMatch[1])));
        return { width: w, height: h };
    }
    const vbMatch = svgMarkup.match(/\bviewBox\s*=\s*["']\s*[0-9.-]+[\s,]+[0-9.-]+[\s,]+([0-9.]+)[\s,]+([0-9.]+)/i);
    if (vbMatch) {
        const vbW = Math.max(40, Math.round(parseFloat(vbMatch[1])));
        const vbH = Math.max(30, Math.round(parseFloat(vbMatch[2])));
        return { width: vbW, height: vbH };
    }
    return { width: 150, height: 120 };
};

const decodeDataUriToUint8Array = (dataUri: string): Uint8Array | null => {
    try {
        const commaIdx = dataUri.indexOf(',');
        if (commaIdx === -1) return null;
        const base64 = dataUri.slice(commaIdx + 1);
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    } catch {
        return null;
    }
};

/**
 * Converts an SVG string (or embedded data URI <img>) into a crisp 3x high-DPI PNG Uint8Array
 * so Microsoft Word, LibreOffice, WPS Office, and Google Docs all render it reliably.
 */
export const rasterizeVisualToPng = async (visualMarkup?: string): Promise<RasterizedImage | null> => {
    if (!visualMarkup || !visualMarkup.trim()) return null;

    // 1. Direct raster <img> data URI support (e.g. if custom PNG/JPEG data URI was embedded)
    const imgMatch = visualMarkup.match(/src\s*=\s*["'](data:image\/(?:png|jpeg|jpg);base64,[^"']+)["']/i);
    if (imgMatch && typeof document !== 'undefined') {
        const dataUrl = imgMatch[1];
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = async () => {
                try {
                    const displayW = Math.min(340, Math.max(60, img.naturalWidth || 160));
                    const displayH = Math.round((displayW / (img.naturalWidth || 160)) * (img.naturalHeight || 120));
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth || displayW;
                    canvas.height = img.naturalHeight || displayH;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        const raw = decodeDataUriToUint8Array(dataUrl);
                        resolve(raw ? { data: raw, width: displayW, height: displayH } : null);
                        return;
                    }
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob(async (blob) => {
                        if (!blob) {
                            resolve(null);
                            return;
                        }
                        const buf = await blob.arrayBuffer();
                        resolve({ data: new Uint8Array(buf), width: displayW, height: displayH });
                    }, 'image/png');
                } catch {
                    resolve(null);
                }
            };
            img.onerror = () => resolve(null);
            img.src = dataUrl;
        });
    }

    // 2. Inline <svg> rasterization via offscreen Canvas at 3x resolution
    const cleanSvg = sanitizeSvgMarkup(visualMarkup);
    if (!cleanSvg || typeof document === 'undefined') return null;

    const { width, height } = parseSvgDimensions(cleanSvg);
    const scale = 3;

    const loadImgFromUrl = (src: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(err);
            img.src = src;
        });

    let objectUrl: string | null = null;
    try {
        const svgBlob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' });
        objectUrl = URL.createObjectURL(svgBlob);
        let loadedImg: HTMLImageElement;
        try {
            loadedImg = await loadImgFromUrl(objectUrl);
        } catch {
            const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleanSvg)}`;
            loadedImg = await loadImgFromUrl(dataUri);
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(loadedImg, 0, 0, canvas.width, canvas.height);

        const pngBlob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (!pngBlob) return null;
        const buf = await pngBlob.arrayBuffer();
        return {
            data: new Uint8Array(buf),
            width,
            height
        };
    } catch (err) {
        console.warn('Failed to rasterize SVG visual to PNG for Word export:', err);
        return null;
    } finally {
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
        }
    }
};

const parseFontSizeHalfPoints = (fontSizeStr: string): number => {
    const pt = parseInt(String(fontSizeStr || '11pt').replace(/\D/g, ''), 10) || 11;
    return pt * 2;
};

const buildKopSurat = (schoolName: string, fontFamily: string): (Paragraph | Table)[] => {
    const kopTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        borders: {
            top: NO_BORDER,
            left: NO_BORDER,
            right: NO_BORDER,
            insideHorizontal: NO_BORDER,
            insideVertical: NO_BORDER,
            bottom: { style: BorderStyle.DOUBLE, size: 12, color: '000000' }
        },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 15, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        borders: NO_BORDERS,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: 'SD',
                                        bold: true,
                                        size: 52,
                                        color: '1E3A8A',
                                        font: fontFamily
                                    })
                                ]
                            })
                        ]
                    }),
                    new TableCell({
                        width: { size: 85, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        borders: NO_BORDERS,
                        margins: { bottom: 100 },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 20 },
                                children: [
                                    new TextRun({
                                        text: 'PEMERINTAH KABUPATEN BANDUNG',
                                        bold: true,
                                        size: 22,
                                        font: fontFamily
                                    })
                                ]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 20 },
                                children: [
                                    new TextRun({
                                        text: 'DINAS PENDIDIKAN',
                                        bold: true,
                                        size: 22,
                                        font: fontFamily
                                    })
                                ]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 40 },
                                children: [
                                    new TextRun({
                                        text: schoolName.toUpperCase(),
                                        bold: true,
                                        size: 28,
                                        font: fontFamily
                                    })
                                ]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 80 },
                                children: [
                                    new TextRun({
                                        text: 'Kurikulum Merdeka BSKAP 046 - Panduan Pembelajaran dan Asesmen (PPA) Jenjang SD 2026',
                                        italics: true,
                                        size: 18,
                                        font: fontFamily
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        ]
    });

    return [
        kopTable,
        new Paragraph({ spacing: { after: 140 }, children: [] })
    ];
};

const buildSignatures = (
    locationStr: string,
    headmasterName: string,
    headmasterNip: string,
    teacherName: string,
    teacherNip: string,
    fontFamily: string
): Table => {
    const today = new Date();
    const indonesianMonths = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const formattedDate = `${today.getDate()} ${indonesianMonths[today.getMonth()]} ${today.getFullYear()}`;

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        borders: NO_BORDERS,
        rows: [
            new TableRow({
                cantSplit: true,
                children: [
                    new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        borders: NO_BORDERS,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [new TextRun({ text: 'Mengetahui,', size: 20, font: fontFamily })]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 600 },
                                children: [new TextRun({ text: 'Kepala Sekolah', bold: true, size: 20, font: fontFamily })]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [new TextRun({ text: headmasterName, bold: true, underline: {}, size: 20, font: fontFamily })]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [new TextRun({ text: `NIP. ${headmasterNip}`, size: 20, font: fontFamily })]
                            })
                        ]
                    }),
                    new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        borders: NO_BORDERS,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [new TextRun({ text: `${locationStr}, ${formattedDate}`, size: 20, font: fontFamily })]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 600 },
                                children: [new TextRun({ text: 'Guru Kelas / Penyusun', bold: true, size: 20, font: fontFamily })]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [new TextRun({ text: teacherName, bold: true, underline: {}, size: 20, font: fontFamily })]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [new TextRun({ text: `NIP. ${teacherNip}`, size: 20, font: fontFamily })]
                            })
                        ]
                    })
                ]
            })
        ]
    });
};

const makeSectionBanner = (title: string, fontFamily: string, sizeHp: number): Paragraph =>
    new Paragraph({
        spacing: { before: 180, after: 140 },
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F1F5F9' },
        border: {
            left: { style: BorderStyle.SINGLE, size: 24, color: '0284C7' }
        },
        indent: { left: 100 },
        children: [
            new TextRun({
                text: ` ${title}`,
                bold: true,
                size: sizeHp,
                font: fontFamily
            })
        ]
    });

const makeCell = (
    text: string,
    options: {
        widthPct?: number;
        bold?: boolean;
        align?: (typeof AlignmentType)[keyof typeof AlignmentType];
        fill?: string;
        color?: string;
        sizeHp?: number;
        fontFamily: string;
        borders?: boolean;
    }
): TableCell =>
    new TableCell({
        width: options.widthPct ? { size: options.widthPct, type: WidthType.PERCENTAGE } : undefined,
        verticalAlign: VerticalAlign.CENTER,
        shading: options.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: options.fill } : undefined,
        borders: options.borders === false ? NO_BORDERS : TABLE_SOLID_BORDERS,
        margins: { top: 70, bottom: 70, left: 90, right: 90 },
        children: [
            new Paragraph({
                alignment: options.align || AlignmentType.LEFT,
                children: [
                    new TextRun({
                        text: text || '-',
                        bold: options.bold,
                        color: options.color,
                        size: options.sizeHp || 19,
                        font: options.fontFamily
                    })
                ]
            })
        ]
    });

export const exportAssessmentDocx = async (params: {
    data: GeneratedAssessmentData;
    type: DocExportType;
    userIdentity: UserIdentity;
    paperSize: 'A4' | 'F4';
    resolveVisualSvg?: (visualType?: any, visualTitle?: string) => string;
}): Promise<{ blob: Blob; filename: string }> => {
    const { data, type, userIdentity, paperSize, resolveVisualSvg } = params;
    const fontName = data.fontFamily || 'Times New Roman';
    const fontSizeHp = parseFontSizeHalfPoints(data.fontSize || '11pt');
    const locationStr = userIdentity.location || (typeof localStorage !== 'undefined' ? localStorage.getItem('prota_location') : '') || 'Sukatinggal';
    const schoolName = userIdentity.institutionName || 'SDN SUKATINGGAL';
    const teacherName = userIdentity.authorName || 'Guru Kelas';
    const teacherNip = userIdentity.nip || '-';
    const headmasterName = userIdentity.kepalaSekolah || 'Kepala Sekolah';
    const headmasterNip = userIdentity.nipKepalaSekolah || '-';

    const typeLabel =
        data.assessmentType === 'harian' ? 'ASESMEN SUMATIF HARIAN' :
        data.assessmentType === 'asas' ? 'ASESMEN SUMATIF AKHIR SEMESTER (ASAS)' :
        data.assessmentType === 'asat' ? 'ASESMEN SUMATIF AKHIR TAHUN (ASAT)' :
        'ASESMEN SUMATIF AKHIR JENJANG (ASAJ)';

    const pageWidthTwip = convertMillimetersToTwip(paperSize === 'F4' ? 215 : 210);
    const pageHeightTwip = convertMillimetersToTwip(paperSize === 'F4' ? 330 : 297);
    const marginTwip = convertMillimetersToTwip(20);

    // Pre-rasterize ALL visual SVGs across PG, Isian, and Uraian questions into PNG bytes
    const visualImageMap = new Map<string, RasterizedImage>();
    const collectAndRasterize = async (prefix: string, q: any) => {
        const rawSvg = q.visualSvg || (q.visualType && q.visualType !== 'none' && resolveVisualSvg ? resolveVisualSvg(q.visualType, q.visualTitle) : '');
        if (rawSvg && rawSvg.trim()) {
            const png = await rasterizeVisualToPng(rawSvg);
            if (png) {
                visualImageMap.set(`${prefix}_${q.no}`, png);
            }
        }
    };

    if (type === 'naskah_soal' || type === 'all') {
        await Promise.all([
            ...data.pgQuestions.map(q => collectAndRasterize('pg', q)),
            ...data.isianQuestions.map(q => collectAndRasterize('isian', q)),
            ...data.uraianQuestions.map(q => collectAndRasterize('uraian', q))
        ]);
    }

    // 1. KISI-KISI SECTION (Landscape)
    const buildKisiKisiChildren = (): (Paragraph | Table)[] => {
        const headers = [
            { label: 'No', width: 5 },
            { label: 'Tujuan Pembelajaran (TP)', width: 22 },
            { label: 'Lingkup Materi', width: 18 },
            { label: 'Indikator Soal', width: 32 },
            { label: 'Level', width: 9 },
            { label: 'Bentuk', width: 8 },
            { label: 'No Soal', width: 6 }
        ];

        const rows: TableRow[] = [
            new TableRow({
                tableHeader: true,
                children: headers.map(h =>
                    makeCell(h.label, {
                        widthPct: h.width,
                        bold: true,
                        align: AlignmentType.CENTER,
                        fill: 'F1F5F9',
                        sizeHp: 19,
                        fontFamily: fontName
                    })
                )
            })
        ];

        const addKisiRow = (idx: number, q: { tp: string; materi: string; indikator: string; cognitiveLevel: string; no: number }, bentuk: string) => {
            rows.push(
                new TableRow({
                    cantSplit: true,
                    children: [
                        makeCell(String(idx), { widthPct: 5, align: AlignmentType.CENTER, fontFamily: fontName }),
                        makeCell(q.tp, { widthPct: 22, fontFamily: fontName }),
                        makeCell(q.materi, { widthPct: 18, fontFamily: fontName }),
                        makeCell(q.indikator, { widthPct: 32, fontFamily: fontName }),
                        makeCell(q.cognitiveLevel, { widthPct: 9, bold: true, align: AlignmentType.CENTER, fontFamily: fontName }),
                        makeCell(bentuk, { widthPct: 8, align: AlignmentType.CENTER, fontFamily: fontName }),
                        makeCell(String(q.no), { widthPct: 6, bold: true, align: AlignmentType.CENTER, fontFamily: fontName })
                    ]
                })
            );
        };

        data.pgQuestions.forEach((q, idx) => addKisiRow(idx + 1, q, 'PG'));
        data.isianQuestions.forEach((q, idx) => addKisiRow(data.pgQuestions.length + idx + 1, q, 'Isian'));
        data.uraianQuestions.forEach((q, idx) => addKisiRow(data.pgQuestions.length + data.isianQuestions.length + idx + 1, q, 'Uraian'));

        return [
            ...buildKopSurat(schoolName, fontName),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 60 },
                children: [new TextRun({ text: `KISI-KISI PENULISAN SOAL ${typeLabel}`, bold: true, size: 24, font: fontName })]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                children: [
                    new TextRun({
                        text: `MATA PELAJARAN: ${data.subject.toUpperCase()} | KELAS: ${data.className.toUpperCase()} | TAHUN AJARAN: ${data.academicYear}`,
                        bold: true,
                        size: 20,
                        font: fontName
                    })
                ]
            }),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                layout: TableLayoutType.FIXED,
                borders: TABLE_SOLID_BORDERS,
                rows
            }),
            new Paragraph({ spacing: { after: 200 }, children: [] }),
            buildSignatures(locationStr, headmasterName, headmasterNip, teacherName, teacherNip, fontName)
        ];
    };

    // 2. NASKAH SOAL SECTION (Portrait, with PNG-embedded visuals!)
    const buildNaskahSoalChildren = (): (Paragraph | Table)[] => {
        const children: (Paragraph | Table)[] = [
            ...buildKopSurat(schoolName, fontName),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40 },
                children: [new TextRun({ text: typeLabel, bold: true, size: 26, font: fontName })]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 180 },
                children: [new TextRun({ text: `TAHUN AJARAN ${data.academicYear}`, bold: true, size: 20, font: fontName })]
            })
        ];

        // Student Identity Box
        const idRows: [string, string, string, string][] = [
            ['Mata Pelajaran', `: ${data.subject}`, 'Nama Siswa', ': ............................................'],
            ['Kelas / Semester', `: ${data.className} / Semester ${data.semester}`, 'Nomor Absen', ': ............................................'],
            ['Hari / Tanggal', ': ............................................', 'Waktu', ': 90 Menit']
        ];

        children.push(
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                layout: TableLayoutType.FIXED,
                borders: {
                    top: CELL_THIN_BORDER,
                    bottom: CELL_THIN_BORDER,
                    left: CELL_THIN_BORDER,
                    right: CELL_THIN_BORDER,
                    insideHorizontal: NO_BORDER,
                    insideVertical: NO_BORDER
                },
                rows: idRows.map(([k1, v1, k2, v2]) =>
                    new TableRow({
                        children: [
                            makeCell(k1, { widthPct: 18, bold: true, sizeHp: 20, fontFamily: fontName, borders: false }),
                            makeCell(v1, { widthPct: 32, sizeHp: 20, fontFamily: fontName, borders: false }),
                            makeCell(k2, { widthPct: 18, bold: true, sizeHp: 20, fontFamily: fontName, borders: false }),
                            makeCell(v2, { widthPct: 32, sizeHp: 20, fontFamily: fontName, borders: false })
                        ]
                    })
                )
            }),
            new Paragraph({ spacing: { after: 140 }, children: [] })
        );

        // Petunjuk Umum
        children.push(
            new Paragraph({
                spacing: { after: 60 },
                children: [new TextRun({ text: 'PETUNJUK UMUM:', bold: true, underline: {}, size: 20, font: fontName })]
            })
        );
        const instructions = [
            'Berdoalah sebelum mengerjakan soal.',
            'Tuliskan nama dan nomor absen pada lembar identitas yang disediakan.',
            'Bacalah setiap butir soal dengan teliti dan cermat.',
            'Kerjakan terlebih dahulu soal-soal yang kamu anggap mudah.',
            'Periksa kembali semua jawabanmu sebelum diserahkan kepada Bapak/Ibu Guru.'
        ];
        instructions.forEach((inst, i) => {
            children.push(
                new Paragraph({
                    indent: { left: 260, hanging: 220 },
                    spacing: { after: i === instructions.length - 1 ? 180 : 30 },
                    children: [new TextRun({ text: `${i + 1}. ${inst}`, size: 19, font: fontName })]
                })
            );
        });

        const buildQuestionRow = (
            no: number,
            stimulus: string | undefined,
            visualKey: string,
            visualTitle: string | undefined,
            questionText: string,
            extraParagraphsOrTables: (Paragraph | Table)[]
        ): Table => {
            const bodyItems: (Paragraph | Table)[] = [];

            if (stimulus && stimulus.trim()) {
                bodyItems.push(
                    new Paragraph({
                        spacing: { after: 80 },
                        children: [
                            new TextRun({
                                text: stimulus.trim(),
                                italics: true,
                                color: '334155',
                                size: fontSizeHp,
                                font: fontName
                            })
                        ]
                    })
                );
            }

            const imgData = visualImageMap.get(visualKey);
            if (imgData) {
                if (visualTitle && visualTitle.trim()) {
                    bodyItems.push(
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 40, after: 40 },
                            children: [
                                new TextRun({
                                    text: visualTitle.trim(),
                                    bold: true,
                                    color: '475569',
                                    size: Math.max(16, fontSizeHp - 2),
                                    font: fontName
                                })
                            ]
                        })
                    );
                }
                bodyItems.push(
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 60, after: 100 },
                        children: [
                            new ImageRun({
                                type: 'png',
                                data: imgData.data,
                                transformation: {
                                    width: imgData.width,
                                    height: imgData.height
                                }
                            })
                        ]
                    })
                );
            }

            bodyItems.push(
                new Paragraph({
                    spacing: { after: 80 },
                    children: [
                        new TextRun({
                            text: questionText,
                            size: fontSizeHp,
                            font: fontName
                        })
                    ]
                })
            );

            bodyItems.push(...extraParagraphsOrTables);

            return new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                layout: TableLayoutType.FIXED,
                borders: NO_BORDERS,
                rows: [
                    new TableRow({
                        cantSplit: true,
                        children: [
                            new TableCell({
                                width: { size: 5, type: WidthType.PERCENTAGE },
                                borders: NO_BORDERS,
                                verticalAlign: VerticalAlign.TOP,
                                margins: { top: 40, bottom: 80, left: 0, right: 60 },
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: `${no}.`,
                                                bold: true,
                                                size: fontSizeHp,
                                                font: fontName
                                            })
                                        ]
                                    })
                                ]
                            }),
                            new TableCell({
                                width: { size: 95, type: WidthType.PERCENTAGE },
                                borders: NO_BORDERS,
                                verticalAlign: VerticalAlign.TOP,
                                margins: { top: 40, bottom: 120, left: 0, right: 0 },
                                children: bodyItems
                            })
                        ]
                    })
                ]
            });
        };

        // BAGIAN I: PILIHAN GANDA
        const isFaseAClass = data.className.includes('1') || data.className.includes('2');
        const isSundaDoc = isBahasaSundaSubject(data.subject);
        children.push(
            makeSectionBanner(
                isSundaDoc
                    ? `I. Cakra (X) aksara ${isFaseAClass ? 'A, B, atawa C' : 'A, B, C, atawa D'} dina jawaban anu pangbenerna!`
                    : `I. Berilah tanda silang (X) pada huruf ${isFaseAClass ? 'A, B, atau C' : 'A, B, C, atau D'} di depan jawaban yang paling tepat!`,
                fontName,
                fontSizeHp
            )
        );

        data.pgQuestions.forEach(q => {
            const optionBlocks: (Paragraph | Table)[] = [];
            if (data.optionsLayout === 'horizontal' && q.options.length > 0) {
                const colWidth = Math.floor(100 / q.options.length);
                optionBlocks.push(
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        layout: TableLayoutType.FIXED,
                        borders: NO_BORDERS,
                        rows: [
                            new TableRow({
                                cantSplit: true,
                                children: q.options.map(opt =>
                                    new TableCell({
                                        width: { size: colWidth, type: WidthType.PERCENTAGE },
                                        borders: NO_BORDERS,
                                        margins: { top: 30, bottom: 30, left: 0, right: 80 },
                                        children: [
                                            new Paragraph({
                                                children: [
                                                    new TextRun({ text: `${opt.key}. `, bold: true, size: fontSizeHp, font: fontName }),
                                                    new TextRun({ text: opt.text, size: fontSizeHp, font: fontName })
                                                ]
                                            })
                                        ]
                                    })
                                )
                            })
                        ]
                    })
                );
            } else {
                q.options.forEach(opt => {
                    optionBlocks.push(
                        new Paragraph({
                            indent: { left: 100 },
                            spacing: { after: 30 },
                            children: [
                                new TextRun({ text: `${opt.key}. `, bold: true, size: fontSizeHp, font: fontName }),
                                new TextRun({ text: opt.text, size: fontSizeHp, font: fontName })
                            ]
                        })
                    );
                });
            }

            children.push(
                buildQuestionRow(
                    q.no,
                    q.stimulus,
                    `pg_${q.no}`,
                    q.visualTitle,
                    q.question,
                    optionBlocks
                )
            );
        });

        // BAGIAN II: ISIAN SINGKAT
        if (data.isianQuestions.length > 0) {
            children.push(
                makeSectionBanner(
                    isSundaDoc
                        ? 'II. Eusian titik-titik di handap ieu ku jawaban anu singget tur bener!'
                        : 'II. Isilah titik-titik di bawah ini dengan jawaban yang singkat dan tepat!',
                    fontName,
                    fontSizeHp
                )
            );
            data.isianQuestions.forEach((q: any) => {
                children.push(
                    buildQuestionRow(
                        q.no,
                        q.stimulus,
                        `isian_${q.no}`,
                        q.visualTitle,
                        q.question,
                        []
                    )
                );
            });
        }

        // BAGIAN III: URAIAN
        if (data.uraianQuestions.length > 0) {
            children.push(
                makeSectionBanner(
                    isSundaDoc
                        ? 'III. Jawab pananya-pananya di handap ieu kalawan jéntré tur bener!'
                        : 'III. Jawablah pertanyaan-pertanyaan berikut dengan jelas, tepat, dan runtut!',
                    fontName,
                    fontSizeHp
                )
            );
            data.uraianQuestions.forEach((q: any) => {
                const answerLines = [0, 1, 2].map(() =>
                    new Paragraph({
                        spacing: { before: 140, after: 40 },
                        border: {
                            bottom: { style: BorderStyle.DOTTED, size: 6, color: '94A3B8' }
                        },
                        children: [new TextRun({ text: '', size: fontSizeHp })]
                    })
                );
                children.push(
                    buildQuestionRow(
                        q.no,
                        q.stimulus,
                        `uraian_${q.no}`,
                        q.visualTitle,
                        q.question,
                        answerLines
                    )
                );
            });
        }

        return children;
    };

    // 3. KUNCI JAWABAN SECTION (Portrait)
    const buildKunciJawabanChildren = (): (Paragraph | Table)[] => {
        const children: (Paragraph | Table)[] = [
            ...buildKopSurat(schoolName, fontName),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40 },
                children: [new TextRun({ text: `KUNCI JAWABAN & PEDOMAN KOREKSI ${typeLabel}`, bold: true, size: 26, font: fontName })]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 180 },
                children: [new TextRun({ text: `MATA PELAJARAN: ${data.subject.toUpperCase()} | KELAS: ${data.className.toUpperCase()}`, bold: true, size: 20, font: fontName })]
            }),
            makeSectionBanner('I. KUNCI JAWABAN PILIHAN GANDA (PG)', fontName, 22)
        ];

        const pgGridRows: TableRow[] = [];
        for (let i = 0; i < data.pgQuestions.length; i += 10) {
            const slice = data.pgQuestions.slice(i, i + 10);
            const colPct = Math.floor(100 / slice.length);
            pgGridRows.push(
                new TableRow({
                    children: slice.map(q =>
                        makeCell(`No ${q.no}`, {
                            widthPct: colPct,
                            bold: true,
                            align: AlignmentType.CENTER,
                            fill: 'F8FAFC',
                            sizeHp: 19,
                            fontFamily: fontName
                        })
                    )
                }),
                new TableRow({
                    children: slice.map(q =>
                        makeCell(q.correctAnswer, {
                            widthPct: colPct,
                            bold: true,
                            align: AlignmentType.CENTER,
                            color: '1E3A8A',
                            sizeHp: 22,
                            fontFamily: fontName
                        })
                    )
                })
            );
        }

        if (pgGridRows.length > 0) {
            children.push(
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    layout: TableLayoutType.FIXED,
                    borders: TABLE_SOLID_BORDERS,
                    rows: pgGridRows
                }),
                new Paragraph({ spacing: { after: 160 }, children: [] })
            );
        }

        if (data.isianQuestions.length > 0) {
            children.push(
                makeSectionBanner('II. KUNCI JAWABAN ISIAN SINGKAT', fontName, 22),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    layout: TableLayoutType.FIXED,
                    borders: TABLE_SOLID_BORDERS,
                    rows: [
                        new TableRow({
                            tableHeader: true,
                            children: [
                                makeCell('No Soal', { widthPct: 12, bold: true, align: AlignmentType.CENTER, fill: 'F8FAFC', sizeHp: 20, fontFamily: fontName }),
                                makeCell('Kunci Jawaban', { widthPct: 88, bold: true, fill: 'F8FAFC', sizeHp: 20, fontFamily: fontName })
                            ]
                        }),
                        ...data.isianQuestions.map(q =>
                            new TableRow({
                                cantSplit: true,
                                children: [
                                    makeCell(String(q.no), { widthPct: 12, bold: true, align: AlignmentType.CENTER, sizeHp: 20, fontFamily: fontName }),
                                    makeCell(q.correctAnswer, { widthPct: 88, bold: true, color: '047857', sizeHp: 20, fontFamily: fontName })
                                ]
                            })
                        )
                    ]
                }),
                new Paragraph({ spacing: { after: 160 }, children: [] })
            );
        }

        if (data.uraianQuestions.length > 0) {
            children.push(
                makeSectionBanner('III. PEDOMAN JAWABAN SOAL URAIAN', fontName, 22),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    layout: TableLayoutType.FIXED,
                    borders: TABLE_SOLID_BORDERS,
                    rows: [
                        new TableRow({
                            tableHeader: true,
                            children: [
                                makeCell('No Soal', { widthPct: 12, bold: true, align: AlignmentType.CENTER, fill: 'F8FAFC', sizeHp: 20, fontFamily: fontName }),
                                makeCell('Rambu-rambu Kunci Jawaban & Penjelasan', { widthPct: 88, bold: true, fill: 'F8FAFC', sizeHp: 20, fontFamily: fontName })
                            ]
                        }),
                        ...data.uraianQuestions.map(q =>
                            new TableRow({
                                cantSplit: true,
                                children: [
                                    makeCell(String(q.no), { widthPct: 12, bold: true, align: AlignmentType.CENTER, sizeHp: 20, fontFamily: fontName }),
                                    makeCell(q.correctAnswer, { widthPct: 88, color: '1E3A8A', sizeHp: 20, fontFamily: fontName })
                                ]
                            })
                        )
                    ]
                })
            );
        }

        return children;
    };

    // 4. RUBRIK & PENSKORAN SECTION (Portrait)
    const buildRubrikSkorChildren = (): (Paragraph | Table)[] => [
        ...buildKopSurat(schoolName, fontName),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [new TextRun({ text: `PEDOMAN PENSKORAN & RUBRIK PENILAIAN ${typeLabel}`, bold: true, size: 26, font: fontName })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [new TextRun({ text: 'KURIKULUM MERDEKA SESUAI PANDUAN PEMBELAJARAN DAN ASESMEN (PPA) 2026', bold: true, size: 20, font: fontName })]
        }),
        makeSectionBanner('A. BOBOT NILAI DAN SKOR MAKSIMAL TIAP BENTUK SOAL', fontName, 22),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            layout: TableLayoutType.FIXED,
            borders: TABLE_SOLID_BORDERS,
            rows: [
                new TableRow({
                    tableHeader: true,
                    children: [
                        makeCell('Bentuk Soal', { widthPct: 40, bold: true, align: AlignmentType.CENTER, fill: 'F8FAFC', sizeHp: 20, fontFamily: fontName }),
                        makeCell('Jumlah Butir', { widthPct: 20, bold: true, align: AlignmentType.CENTER, fill: 'F8FAFC', sizeHp: 20, fontFamily: fontName }),
                        makeCell('Skor Tiap Butir', { widthPct: 20, bold: true, align: AlignmentType.CENTER, fill: 'F8FAFC', sizeHp: 20, fontFamily: fontName }),
                        makeCell('Skor Maksimal', { widthPct: 20, bold: true, align: AlignmentType.CENTER, fill: 'F8FAFC', sizeHp: 20, fontFamily: fontName })
                    ]
                }),
                new TableRow({
                    children: [
                        makeCell('I. Pilihan Ganda (PG)', { widthPct: 40, bold: true, sizeHp: 20, fontFamily: fontName }),
                        makeCell(String(data.pgQuestions.length), { widthPct: 20, align: AlignmentType.CENTER, sizeHp: 20, fontFamily: fontName }),
                        makeCell('1', { widthPct: 20, align: AlignmentType.CENTER, sizeHp: 20, fontFamily: fontName }),
                        makeCell(String(data.pgQuestions.length * 1), { widthPct: 20, bold: true, align: AlignmentType.CENTER, sizeHp: 20, fontFamily: fontName })
                    ]
                }),
                new TableRow({
                    children: [
                        makeCell('II. Isian Singkat', { widthPct: 40, bold: true, sizeHp: 20, fontFamily: fontName }),
                        makeCell(String(data.isianQuestions.length), { widthPct: 20, align: AlignmentType.CENTER, sizeHp: 20, fontFamily: fontName }),
                        makeCell('2', { widthPct: 20, align: AlignmentType.CENTER, sizeHp: 20, fontFamily: fontName }),
                        makeCell(String(data.isianQuestions.length * 2), { widthPct: 20, bold: true, align: AlignmentType.CENTER, sizeHp: 20, fontFamily: fontName })
                    ]
                }),
                new TableRow({
                    children: [
                        makeCell('III. Uraian', { widthPct: 40, bold: true, sizeHp: 20, fontFamily: fontName }),
                        makeCell(String(data.uraianQuestions.length), { widthPct: 20, align: AlignmentType.CENTER, sizeHp: 20, fontFamily: fontName }),
                        makeCell('3', { widthPct: 20, align: AlignmentType.CENTER, sizeHp: 20, fontFamily: fontName }),
                        makeCell(String(data.uraianQuestions.length * 3), { widthPct: 20, bold: true, align: AlignmentType.CENTER, sizeHp: 20, fontFamily: fontName })
                    ]
                }),
                new TableRow({
                    children: [
                        new TableCell({
                            columnSpan: 3,
                            shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F1F5F9' },
                            borders: TABLE_SOLID_BORDERS,
                            margins: { top: 80, bottom: 80, left: 90, right: 90 },
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: 'TOTAL SKOR MAKSIMAL', bold: true, size: 20, font: fontName })]
                                })
                            ]
                        }),
                        makeCell(String(data.totalScoreMax), {
                            widthPct: 20,
                            bold: true,
                            align: AlignmentType.CENTER,
                            fill: 'F1F5F9',
                            color: '1E3A8A',
                            sizeHp: 22,
                            fontFamily: fontName
                        })
                    ]
                })
            ]
        }),
        new Paragraph({ spacing: { after: 140 }, children: [] }),
        makeSectionBanner('B. FORMULA PERHITUNGAN NILAI AKHIR (NA)', fontName, 22),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            layout: TableLayoutType.FIXED,
            borders: TABLE_SOLID_BORDERS,
            rows: [
                new TableRow({
                    children: [
                        makeCell(`Nilai Akhir (NA) = (Skor Perolehan Siswa / ${data.totalScoreMax}) × 100`, {
                            widthPct: 100,
                            bold: true,
                            align: AlignmentType.CENTER,
                            fill: 'F8FAFC',
                            sizeHp: 21,
                            fontFamily: fontName
                        })
                    ]
                })
            ]
        }),
        new Paragraph({ spacing: { after: 140 }, children: [] }),
        makeSectionBanner('C. PEDOMAN PEMBERIAN SKOR SOAL URAIAN', fontName, 22),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            layout: TableLayoutType.FIXED,
            borders: TABLE_SOLID_BORDERS,
            rows: [
                new TableRow({
                    tableHeader: true,
                    children: [
                        makeCell('Skor', { widthPct: 12, bold: true, align: AlignmentType.CENTER, fill: 'F8FAFC', sizeHp: 19, fontFamily: fontName }),
                        makeCell('Kategori', { widthPct: 25, bold: true, fill: 'F8FAFC', sizeHp: 19, fontFamily: fontName }),
                        makeCell('Deskripsi Ketercapaian Indikator', { widthPct: 63, bold: true, fill: 'F8FAFC', sizeHp: 19, fontFamily: fontName })
                    ]
                }),
                ...[
                    { score: '3', color: '047857', cat: 'Sangat Lengkap & Tepat', desc: 'Jawaban sangat lengkap, tepat sesuai konsep, langkah terstruktur dan mencerminkan pemahaman mendalam.' },
                    { score: '2', color: '0284C7', cat: 'Cukup Lengkap', desc: 'Jawaban benar secara umum namun penjelasan kurang mendalam atau langkah penyelesaian belum tuntas.' },
                    { score: '1', color: 'D97706', cat: 'Kurang Lengkap', desc: 'Hanya menyebutkan sebagian kecil fakta, masih terdapat kekeliruan konsep pokok.' },
                    { score: '0', color: 'DC2626', cat: 'Tidak Menjawab / Salah', desc: 'Tidak ada jawaban yang relevan atau tidak menjawab sama sekali.' }
                ].map(r =>
                    new TableRow({
                        cantSplit: true,
                        children: [
                            makeCell(r.score, { widthPct: 12, bold: true, align: AlignmentType.CENTER, color: r.color, sizeHp: 22, fontFamily: fontName }),
                            makeCell(r.cat, { widthPct: 25, bold: true, sizeHp: 19, fontFamily: fontName }),
                            makeCell(r.desc, { widthPct: 63, sizeHp: 19, fontFamily: fontName })
                        ]
                    })
                )
            ]
        }),
        new Paragraph({ spacing: { after: 200 }, children: [] }),
        buildSignatures(locationStr, headmasterName, headmasterNip, teacherName, teacherNip, fontName)
    ];

    const portraitSectionProps = {
        page: {
            size: {
                width: pageWidthTwip,
                height: pageHeightTwip,
                orientation: PageOrientation.PORTRAIT
            },
            margin: {
                top: marginTwip,
                bottom: marginTwip,
                left: marginTwip,
                right: marginTwip
            }
        }
    };

    const landscapeSectionProps = {
        page: {
            size: {
                width: pageHeightTwip,
                height: pageWidthTwip,
                orientation: PageOrientation.LANDSCAPE
            },
            margin: {
                top: marginTwip,
                bottom: marginTwip,
                left: marginTwip,
                right: marginTwip
            }
        }
    };

    const sections: ISectionOptions[] = [];
    let fileSuffix = '';

    if (type === 'kisi_kisi') {
        sections.push({ properties: landscapeSectionProps, children: buildKisiKisiChildren() });
        fileSuffix = 'Kisi_Kisi';
    } else if (type === 'naskah_soal') {
        sections.push({ properties: portraitSectionProps, children: buildNaskahSoalChildren() });
        fileSuffix = 'Naskah_Soal';
    } else if (type === 'kunci_jawaban') {
        sections.push({ properties: portraitSectionProps, children: buildKunciJawabanChildren() });
        fileSuffix = 'Kunci_Jawaban';
    } else if (type === 'rubrik_skor') {
        sections.push({ properties: portraitSectionProps, children: buildRubrikSkorChildren() });
        fileSuffix = 'Rubrik_Penilaian';
    } else {
        sections.push({ properties: landscapeSectionProps, children: buildKisiKisiChildren() });
        sections.push({ properties: portraitSectionProps, children: buildNaskahSoalChildren() });
        sections.push({ properties: portraitSectionProps, children: buildKunciJawabanChildren() });
        sections.push({ properties: portraitSectionProps, children: buildRubrikSkorChildren() });
        fileSuffix = 'Paket_Lengkap_Asesmen';
    }

    const doc = new Document({
        creator: teacherName,
        title: `${typeLabel} - ${data.subject} (${data.className})`,
        description: `Dokumen Asesmen Sumatif ${data.subject} ${data.className} TA ${data.academicYear}`,
        sections
    });

    const blob = await Packer.toBlob(doc);
    const sanitizedSubject = data.subject.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedClass = data.className.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${fileSuffix}_${data.assessmentType.toUpperCase()}_${sanitizedSubject}_${sanitizedClass}_${paperSize}.docx`;

    return { blob, filename };
};
