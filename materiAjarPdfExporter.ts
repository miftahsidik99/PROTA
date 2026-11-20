import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { PageOrientationMode } from './materiAjarHelper';

export interface MateriPdfExportOptions {
    filename: string;
    paperSize?: 'A4' | 'F4';
    orientation?: PageOrientationMode;
    institutionName?: string;
    subject?: string;
    className?: string;
}

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

interface OrientationMetrics {
    stageWidthPx: number;
    pageWidthMm: number;
    pageHeightMm: number;
    pdfOrientation: 'portrait' | 'landscape';
    pngScale: number;
}

function getOrientationMetrics(
    orientation: PageOrientationMode = 'portrait_a4',
    paperSize: 'A4' | 'F4' = 'A4'
): OrientationMetrics {
    if (orientation === 'landscape_a4') {
        const pageWidthMm = paperSize === 'F4' ? 330 : 297;
        const pageHeightMm = paperSize === 'F4' ? 215 : 210;
        return {
            stageWidthPx: 1123,
            pageWidthMm,
            pageHeightMm,
            pdfOrientation: 'landscape',
            pngScale: 3.125 // ~3509px wide @ 300 DPI A4 Landscape
        };
    }

    if (orientation === 'digital_4_5') {
        return {
            stageWidthPx: 794,
            pageWidthMm: 210,
            pageHeightMm: 262.5, // Exact 4:5 ratio
            pdfOrientation: 'portrait',
            pngScale: 3.025 // ~2402px wide
        };
    }

    // Default: portrait_a4
    const pageWidthMm = paperSize === 'F4' ? 215 : 210;
    const pageHeightMm = paperSize === 'F4' ? 330 : 297;
    return {
        stageWidthPx: 794,
        pageWidthMm,
        pageHeightMm,
        pdfOrientation: 'portrait',
        pngScale: 3.125 // ~2481px wide @ 300 DPI A4 Portrait
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
    clone.style.padding = '10px';
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
 * Verifies rendered DOM container before export (Stage 6 & QC #12):
 * confirms multi-page structure, non-empty page content, valid SVG dimensions, and no broken images.
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
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Exports each `[data-materi-page]` sheet as its own separate 300-DPI PNG file
 * (never merges multiple pages into one oversized vertical strip).
 */
export async function exportMateriAjarPagesPng(
    sourceContainer: HTMLElement,
    options: MateriMultiPngExportOptions
): Promise<{ pageCount: number; downloadedFiles: string[] }> {
    const metrics = getOrientationMetrics(options.orientation || 'portrait_a4', 'A4');
    const cleanBase = options.baseFilename.replace(/\.png$/i, '');
    const { stage, clone } = prepareCloneStage(sourceContainer, metrics.stageWidthPx);

    try {
        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
        }
        await new Promise((resolve) => setTimeout(resolve, 160));

        const pageNodes = Array.from(clone.querySelectorAll<HTMLElement>('[data-materi-page]'));
        const targets = pageNodes.length > 0 ? pageNodes : [clone];
        const downloadedFiles: string[] = [];

        for (let i = 0; i < targets.length; i++) {
            const pageEl = targets[i];
            pageEl.style.backgroundColor = '#ffffff';
            const canvas = await html2canvas(pageEl, {
                scale: metrics.pngScale,
                backgroundColor: '#ffffff',
                useCORS: true,
                allowTaint: true,
                logging: false,
                windowWidth: metrics.stageWidthPx
            });

            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 1.0));
            if (!blob) {
                throw new Error(`Gagal merender gambar PNG untuk Halaman ${i + 1}.`);
            }

            const outName = targets.length === 1
                ? `${cleanBase}.png`
                : `${cleanBase}_Hal_${i + 1}.png`;
            triggerBlobDownload(blob, outName);
            downloadedFiles.push(outName);

            if (i < targets.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 280));
            }
        }

        return {
            pageCount: targets.length,
            downloadedFiles
        };
    } finally {
        if (stage.parentNode) {
            stage.parentNode.removeChild(stage);
        }
    }
}

/**
 * Legacy single-container PNG helper preserved for compatibility.
 */
export async function exportMateriAjarPosterPng(
    sourceContainer: HTMLElement,
    options: MateriPngExportOptions
): Promise<void> {
    await exportMateriAjarPagesPng(sourceContainer, {
        baseFilename: options.filename.replace(/\.png$/i, ''),
        orientation: options.orientation || 'portrait_a4'
    });
}

async function appendCanvasWithBlockFallback(
    pdf: jsPDF,
    pageNode: HTMLElement,
    metrics: OrientationMetrics,
    marginXMm: number,
    marginTopMm: number,
    maxContentBottomMm: number,
    availablePageHeightMm: number,
    contentWidthMm: number,
    isFirstPdfPage: boolean
): Promise<boolean> {
    const pageCanvas = await html2canvas(pageNode, {
        scale: 2.75,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: metrics.stageWidthPx
    });

    if (pageCanvas.width === 0 || pageCanvas.height === 0) return isFirstPdfPage;

    const fullHeightMm = (pageCanvas.height / pageCanvas.width) * contentWidthMm;

    // Fit cleanly onto 1 logical page if within reasonable 18% tolerance so Page 1/2/3 map cleanly 1:1
    if (fullHeightMm <= availablePageHeightMm * 1.18) {
        if (!isFirstPdfPage) {
            pdf.addPage([metrics.pageWidthMm, metrics.pageHeightMm], metrics.pdfOrientation);
        }
        const fitScale = Math.min(1, availablePageHeightMm / fullHeightMm);
        const drawWidth = contentWidthMm * fitScale;
        const drawHeight = fullHeightMm * fitScale;
        const offsetX = marginXMm + (contentWidthMm - drawWidth) / 2;

        const imgData = pageCanvas.toDataURL('image/png', 0.98);
        pdf.addImage(imgData, 'PNG', offsetX, marginTopMm, drawWidth, drawHeight, undefined, 'FAST');
        return false;
    }

    // Otherwise paginate cleanly using [data-pdf-block] so no card or illustration is sliced in half
    const blocks = Array.from(pageNode.querySelectorAll<HTMLElement>('[data-pdf-block]'));
    const captureTargets = blocks.length > 0 ? blocks : [pageNode];
    const blockGapMm = 2.4;

    if (!isFirstPdfPage) {
        pdf.addPage([metrics.pageWidthMm, metrics.pageHeightMm], metrics.pdfOrientation);
    }

    let cursorY = marginTopMm;
    let isFirstBlockOnSheet = true;

    for (let i = 0; i < captureTargets.length; i++) {
        const target = captureTargets[i];
        if (!target || target.offsetHeight < 4) continue;

        const canvas = await html2canvas(target, {
            scale: 2.6,
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
            logging: false,
            windowWidth: metrics.stageWidthPx
        });

        if (canvas.width === 0 || canvas.height === 0) continue;
        const totalImgHeightMm = (canvas.height / canvas.width) * contentWidthMm;

        if (totalImgHeightMm <= availablePageHeightMm && !isFirstBlockOnSheet && cursorY + totalImgHeightMm > maxContentBottomMm) {
            pdf.addPage([metrics.pageWidthMm, metrics.pageHeightMm], metrics.pdfOrientation);
            cursorY = marginTopMm;
            isFirstBlockOnSheet = true;
        }

        if (totalImgHeightMm <= availablePageHeightMm) {
            const imgData = canvas.toDataURL('image/png', 0.98);
            pdf.addImage(imgData, 'PNG', marginXMm, cursorY, contentWidthMm, totalImgHeightMm, undefined, 'FAST');
            cursorY += totalImgHeightMm + blockGapMm;
            isFirstBlockOnSheet = false;
        } else {
            if (!isFirstBlockOnSheet) {
                pdf.addPage([metrics.pageWidthMm, metrics.pageHeightMm], metrics.pdfOrientation);
                cursorY = marginTopMm;
                isFirstBlockOnSheet = true;
            }
            const pxPerMm = canvas.width / contentWidthMm;
            let renderedPxY = 0;

            while (renderedPxY < canvas.height) {
                const remainingMm = maxContentBottomMm - cursorY;
                const sliceHeightPx = Math.min(canvas.height - renderedPxY, Math.floor(remainingMm * pxPerMm));
                if (sliceHeightPx <= 0) {
                    pdf.addPage([metrics.pageWidthMm, metrics.pageHeightMm], metrics.pdfOrientation);
                    cursorY = marginTopMm;
                    continue;
                }

                const sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = canvas.width;
                sliceCanvas.height = sliceHeightPx;
                const ctx = sliceCanvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
                    ctx.drawImage(canvas, 0, renderedPxY, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);
                    const sliceImg = sliceCanvas.toDataURL('image/png', 0.98);
                    const sliceHeightMm = sliceHeightPx / pxPerMm;
                    pdf.addImage(sliceImg, 'PNG', marginXMm, cursorY, contentWidthMm, sliceHeightMm, undefined, 'FAST');
                    cursorY += sliceHeightMm;
                }

                renderedPxY += sliceHeightPx;
                if (renderedPxY < canvas.height) {
                    pdf.addPage([metrics.pageWidthMm, metrics.pageHeightMm], metrics.pdfOrientation);
                    cursorY = marginTopMm;
                    isFirstBlockOnSheet = true;
                } else {
                    cursorY += blockGapMm;
                    isFirstBlockOnSheet = false;
                }
            }
        }
    }

    return false;
}

/**
 * Exports multi-page Materi Ajar (`[data-materi-page]`) into a print-ready 300-DPI PDF
 * supporting Portrait A4, Landscape A4, and 4:5 Digital ratios.
 */
export async function exportMateriAjarToPdf(
    sourceContainer: HTMLElement,
    options: MateriPdfExportOptions
): Promise<void> {
    const {
        filename,
        paperSize = 'A4',
        orientation = 'portrait_a4',
        institutionName = 'Satuan Pendidikan SD/MI',
        subject = 'Materi Ajar PPA',
        className = ''
    } = options;

    const metrics = getOrientationMetrics(orientation, paperSize);
    const marginXMm = 8;
    const marginTopMm = 8;
    const marginBottomMm = 11;
    const contentWidthMm = metrics.pageWidthMm - marginXMm * 2;
    const maxContentBottomMm = metrics.pageHeightMm - marginBottomMm;
    const availablePageHeightMm = maxContentBottomMm - marginTopMm;

    const { stage, clone } = prepareCloneStage(sourceContainer, metrics.stageWidthPx);

    try {
        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
        }
        await new Promise((resolve) => setTimeout(resolve, 160));

        const pdf = new jsPDF({
            orientation: metrics.pdfOrientation,
            unit: 'mm',
            format: [metrics.pageWidthMm, metrics.pageHeightMm],
            compress: true
        });

        const pageNodes = Array.from(clone.querySelectorAll<HTMLElement>('[data-materi-page]'));
        const targets = pageNodes.length > 0 ? pageNodes : [clone];

        let isFirstPdfPage = true;
        for (let i = 0; i < targets.length; i++) {
            isFirstPdfPage = await appendCanvasWithBlockFallback(
                pdf,
                targets[i],
                metrics,
                marginXMm,
                marginTopMm,
                maxContentBottomMm,
                availablePageHeightMm,
                contentWidthMm,
                isFirstPdfPage
            );
        }

        // Clean PPA page footer on every page
        const totalPages = pdf.getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
            pdf.setPage(p);
            pdf.setDrawColor(226, 232, 240);
            pdf.setLineWidth(0.25);
            pdf.line(marginXMm, metrics.pageHeightMm - 8.5, metrics.pageWidthMm - marginXMm, metrics.pageHeightMm - 8.5);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7);
            pdf.setTextColor(100, 116, 139);
            const leftFooter = `${institutionName} · ${subject}${className ? ` (${className})` : ''} · Materi Ajar Kurikulum Merdeka PPA`;
            pdf.text(leftFooter.slice(0, 110), marginXMm, metrics.pageHeightMm - 4.8);
            pdf.text(`Hal ${p}/${totalPages}`, metrics.pageWidthMm - marginXMm, metrics.pageHeightMm - 4.8, { align: 'right' });
        }

        const safeName = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
        pdf.save(safeName);
    } finally {
        if (stage.parentNode) {
            stage.parentNode.removeChild(stage);
        }
    }
}
