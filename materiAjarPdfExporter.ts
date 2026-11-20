import html2canvas from 'html2canvas-pro';
import { PageOrientationMode } from './materiAjarHelper';

export interface MateriPngExportOptions {
    filename: string;
    orientation?: PageOrientationMode;
}

export interface MateriMultiPngExportOptions {
    baseFilename: string;
    orientation?: PageOrientationMode;
}

export interface DomVerificationResult {
    ok: boolean;
    pageCount: number;
    issues: string[];
}

export interface PngTargetSpec {
    width: number;
    height: number;
    stageWidthPx: number;
    label: string;
}

export function getPngTargetSpec(orientation: PageOrientationMode = 'portrait_a4'): PngTargetSpec {
    if (orientation === 'landscape_a4') {
        return {
            width: 3508,
            height: 2480,
            stageWidthPx: 1123,
            label: '3508 × 2480 px (A4 Landscape 300 DPI)'
        };
    }

    if (orientation === 'digital_screen' || orientation === 'digital_4_5') {
        return {
            width: 1920,
            height: 1080,
            stageWidthPx: 960,
            label: '1920 × 1080 px (Layar Digital 16:9)'
        };
    }

    return {
        width: 2480,
        height: 3508,
        stageWidthPx: 794,
        label: '2480 × 3508 px (A4 Portrait 300 DPI)'
    };
}

function prepareCloneStage(
    sourceContainer: HTMLElement,
    stageWidthPx: number
): { stage: HTMLDivElement; clone: HTMLElement } {
    const stage = document.createElement('div');
    stage.style.position = 'fixed';
    stage.style.left = '-14000px';
    stage.style.top = '0';
    stage.style.width = `${stageWidthPx}px`;
    stage.style.backgroundColor = '#ffffff';
    stage.style.color = '#0f172a';
    stage.style.padding = '0';
    stage.style.margin = '0';
    stage.style.zIndex = '-1';

    const clone = sourceContainer.cloneNode(true) as HTMLElement;
    clone.style.width = `${stageWidthPx}px`;
    clone.style.maxWidth = `${stageWidthPx}px`;
    clone.style.margin = '0';
    clone.style.padding = '12px';
    clone.style.backgroundColor = '#ffffff';
    clone.style.boxShadow = 'none';
    clone.style.boxSizing = 'border-box';

    const svgs = clone.querySelectorAll('svg');
    svgs.forEach((svg) => {
        if (!svg.getAttribute('xmlns')) {
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }
        const vb = svg.getAttribute('viewBox');
        if (!svg.getAttribute('width') && vb) {
            const parts = vb.trim().split(/[\s,]+/);
            if (parts.length === 4) {
                svg.setAttribute('width', parts[2]);
                svg.setAttribute('height', parts[3]);
            }
        }
    });

    stage.appendChild(clone);
    document.body.appendChild(stage);
    return { stage, clone };
}

/**
 * Verifies rendered DOM container before PNG export:
 * confirms multi-page structure, non-empty content, zero horizontal overflow, valid SVGs, and no broken images.
 */
export function verifyRenderedMateriDom(sourceContainer: HTMLElement | null): DomVerificationResult {
    if (!sourceContainer) {
        return {
            ok: false,
            pageCount: 0,
            issues: ['Container pratinjau dokumen belum siap di DOM.']
        };
    }

    const issues: string[] = [];
    const pages = Array.from(sourceContainer.querySelectorAll<HTMLElement>('[data-materi-page]'));
    const targets = pages.length > 0 ? pages : [sourceContainer];

    if (targets.length === 0) {
        issues.push('Tidak ditemukan halaman materi ajar untuk dirender.');
    }

    targets.forEach((pageEl, idx) => {
        const textLen = (pageEl.textContent || '').trim().length;
        if (textLen < 40) {
            issues.push(`Halaman ${idx + 1} tampak kosong atau terpotong.`);
        }
        if (pageEl.clientWidth > 0 && pageEl.scrollWidth > pageEl.clientWidth + 6) {
            issues.push(`Halaman ${idx + 1} mengalami luapan horizontal (${pageEl.scrollWidth}px > ${pageEl.clientWidth}px).`);
        }
    });

    const imgs = Array.from(sourceContainer.querySelectorAll<HTMLImageElement>('img'));
    imgs.forEach((img, idx) => {
        if (img.complete && img.naturalWidth === 0) {
            issues.push(`Gambar eksternal #${idx + 1} gagal dimuat; fallback ilustrasi SVG digunakan.`);
        }
    });

    const svgs = Array.from(sourceContainer.querySelectorAll<SVGSVGElement>('svg'));
    if (svgs.length === 0) {
        issues.push('Tidak ada ilustrasi vektor SVG edukatif pada dokumen.');
    } else {
        const brokenSvg = svgs.some((svg) => {
            const vb = svg.getAttribute('viewBox');
            const rect = svg.getBoundingClientRect();
            return !vb && rect.width === 0;
        });
        if (brokenSvg) {
            issues.push('Terdapat komponen diagram SVG tanpa viewBox atau ukuran valid.');
        }
    }

    return {
        ok: issues.length === 0,
        pageCount: targets.length,
        issues
    };
}

function triggerBlobDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1200);
}

/**
 * Renders a single DOM element cleanly onto an exact target resolution PNG Blob
 * (`2480×3508`, `3508×2480`, or `1920×1080`) with white fill and zero clipping.
 */
async function renderElementToExactPngBlob(
    pageEl: HTMLElement,
    spec: PngTargetSpec
): Promise<Blob> {
    pageEl.style.backgroundColor = '#ffffff';
    const captureScale = Math.max(2, Math.min(3.5, spec.width / spec.stageWidthPx));

    const srcCanvas = await html2canvas(pageEl, {
        scale: captureScale,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: spec.stageWidthPx
    });

    if (srcCanvas.width === 0 || srcCanvas.height === 0) {
        throw new Error('Kanvas halaman kosong saat merender PNG.');
    }

    const outCanvas = document.createElement('canvas');
    outCanvas.width = spec.width;
    outCanvas.height = spec.height;

    const ctx = outCanvas.getContext('2d');
    if (!ctx) {
        throw new Error('Context 2D tidak tersedia untuk menghasilkan PNG.');
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, spec.width, spec.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const safePad = Math.round(Math.min(spec.width, spec.height) * 0.018);
    const availW = spec.width - safePad * 2;
    const availH = spec.height - safePad * 2;
    const fitRatio = Math.min(availW / srcCanvas.width, availH / srcCanvas.height);

    const drawW = Math.round(srcCanvas.width * fitRatio);
    const drawH = Math.round(srcCanvas.height * fitRatio);
    const offsetX = Math.round((spec.width - drawW) / 2);
    const offsetY = Math.round((spec.height - drawH) / 2);

    ctx.drawImage(srcCanvas, 0, 0, srcCanvas.width, srcCanvas.height, offsetX, offsetY, drawW, drawH);

    const blob = await new Promise<Blob | null>((resolve) => outCanvas.toBlob(resolve, 'image/png', 1.0));
    if (!blob) {
        throw new Error('Gagal mengonversi kanvas ke format PNG.');
    }
    return blob;
}

/**
 * Exports a single selected page (1-based index) as an exact-resolution PNG file.
 */
export async function exportSingleMateriPagePng(
    sourceContainer: HTMLElement,
    pageNumber: number,
    options: MateriMultiPngExportOptions
): Promise<{ filename: string; width: number; height: number }> {
    const spec = getPngTargetSpec(options.orientation || 'portrait_a4');
    const cleanBase = options.baseFilename.replace(/\.png$/i, '');
    const { stage, clone } = prepareCloneStage(sourceContainer, spec.stageWidthPx);

    try {
        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
        }
        await new Promise((resolve) => setTimeout(resolve, 160));

        const pageNodes = Array.from(clone.querySelectorAll<HTMLElement>('[data-materi-page]'));
        const targets = pageNodes.length > 0 ? pageNodes : [clone];
        const idx = Math.max(0, Math.min(targets.length - 1, pageNumber - 1));
        const targetEl = targets[idx];

        const blob = await renderElementToExactPngBlob(targetEl, spec);
        const outName = targets.length === 1 ? `${cleanBase}.png` : `${cleanBase}_Hal_${idx + 1}.png`;
        triggerBlobDownload(blob, outName);

        return {
            filename: outName,
            width: spec.width,
            height: spec.height
        };
    } finally {
        if (stage.parentNode) {
            stage.parentNode.removeChild(stage);
        }
    }
}

/**
 * Exports each `[data-materi-page]` sheet as its own separate exact-resolution PNG file
 * (never merges multiple pages into one oversized strip; strictly PNG format).
 */
export async function exportMateriAjarPagesPng(
    sourceContainer: HTMLElement,
    options: MateriMultiPngExportOptions
): Promise<{ pageCount: number; downloadedFiles: string[]; spec: PngTargetSpec }> {
    const spec = getPngTargetSpec(options.orientation || 'portrait_a4');
    const cleanBase = options.baseFilename.replace(/\.png$/i, '');
    const { stage, clone } = prepareCloneStage(sourceContainer, spec.stageWidthPx);

    try {
        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
        }
        await new Promise((resolve) => setTimeout(resolve, 160));

        const pageNodes = Array.from(clone.querySelectorAll<HTMLElement>('[data-materi-page]'));
        const targets = pageNodes.length > 0 ? pageNodes : [clone];
        const downloadedFiles: string[] = [];

        for (let i = 0; i < targets.length; i++) {
            const blob = await renderElementToExactPngBlob(targets[i], spec);
            const outName = targets.length === 1
                ? `${cleanBase}.png`
                : `${cleanBase}_Hal_${i + 1}.png`;
            triggerBlobDownload(blob, outName);
            downloadedFiles.push(outName);

            if (i < targets.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 260));
            }
        }

        return {
            pageCount: targets.length,
            downloadedFiles,
            spec
        };
    } finally {
        if (stage.parentNode) {
            stage.parentNode.removeChild(stage);
        }
    }
}

export async function exportMateriAjarPosterPng(
    sourceContainer: HTMLElement,
    options: MateriPngExportOptions
): Promise<void> {
    await exportMateriAjarPagesPng(sourceContainer, {
        baseFilename: options.filename.replace(/\.png$/i, ''),
        orientation: options.orientation || 'portrait_a4'
    });
}
