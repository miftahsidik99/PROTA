import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

export interface MateriPdfExportOptions {
    filename: string;
    paperSize?: 'A4' | 'F4';
    institutionName?: string;
    subject?: string;
    className?: string;
}

export interface MateriPngExportOptions {
    filename: string;
}

function prepareCloneStage(sourceContainer: HTMLElement): { stage: HTMLDivElement; clone: HTMLElement } {
    const stage = document.createElement('div');
    stage.style.position = 'fixed';
    stage.style.left = '-10000px';
    stage.style.top = '0';
    stage.style.width = '794px';
    stage.style.backgroundColor = '#ffffff';
    stage.style.color = '#0f172a';
    stage.style.padding = '0';
    stage.style.margin = '0';
    stage.style.zIndex = '-1';

    const clone = sourceContainer.cloneNode(true) as HTMLElement;
    clone.style.width = '794px';
    clone.style.maxWidth = '794px';
    clone.style.margin = '0';
    clone.style.padding = '16px';
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
 * Exports the A4 Portrait Educational Infographic Poster as a high-resolution PNG (~300 DPI / 2480px width).
 */
export async function exportMateriAjarPosterPng(
    sourceContainer: HTMLElement,
    options: MateriPngExportOptions
): Promise<void> {
    const { stage, clone } = prepareCloneStage(sourceContainer);
    try {
        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
        }
        await new Promise((resolve) => setTimeout(resolve, 140));

        // 794px @ 96dpi -> scale 3.1234 yields ~2480px width (300 DPI A4 Portrait)
        const canvas = await html2canvas(clone, {
            scale: 3.125,
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
            logging: false,
            windowWidth: 794
        });

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 1.0));
        if (!blob) {
            throw new Error('Gagal merender gambar PNG.');
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = options.filename.toLowerCase().endsWith('.png') ? options.filename : `${options.filename}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } finally {
        if (stage.parentNode) {
            stage.parentNode.removeChild(stage);
        }
    }
}

/**
 * Exports the A4/F4 Portrait Educational Infographic Poster into a print-ready 300-DPI PDF
 * without cutting text, cards, or illustrations across page boundaries.
 */
export async function exportMateriAjarToPdf(
    sourceContainer: HTMLElement,
    options: MateriPdfExportOptions
): Promise<void> {
    const {
        filename,
        paperSize = 'A4',
        institutionName = 'Satuan Pendidikan SD/MI',
        subject = 'Materi Ajar PPA',
        className = ''
    } = options;

    // A4 Portrait: 210 x 297 mm | F4 Portrait: 215 x 330 mm
    const pageWidthMm = paperSize === 'F4' ? 215 : 210;
    const pageHeightMm = paperSize === 'F4' ? 330 : 297;
    const marginXMm = 8;
    const marginTopMm = 8;
    const marginBottomMm = 11;
    const contentWidthMm = pageWidthMm - marginXMm * 2;
    const maxContentBottomMm = pageHeightMm - marginBottomMm;
    const availablePageHeightMm = maxContentBottomMm - marginTopMm;
    const blockGapMm = 2.5;

    const { stage, clone } = prepareCloneStage(sourceContainer);

    try {
        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
        }
        await new Promise((resolve) => setTimeout(resolve, 140));

        // Try capturing entire single poster first: if it fits cleanly on 1 A4 Portrait page (or with tiny uniform fit), keep it as ONE intact poster!
        const fullCanvas = await html2canvas(clone, {
            scale: 3.125,
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
            logging: false,
            windowWidth: 794
        });

        const fullHeightMm = (fullCanvas.height / fullCanvas.width) * contentWidthMm;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [pageWidthMm, pageHeightMm],
            compress: true
        });

        if (fullHeightMm <= availablePageHeightMm * 1.12) {
            // Fits cleanly onto ONE cohesive A4 Portrait poster page!
            const fitScale = Math.min(1, availablePageHeightMm / fullHeightMm);
            const drawWidth = contentWidthMm * fitScale;
            const drawHeight = fullHeightMm * fitScale;
            const offsetX = marginXMm + (contentWidthMm - drawWidth) / 2;

            const imgData = fullCanvas.toDataURL('image/png', 1.0);
            pdf.addImage(imgData, 'PNG', offsetX, marginTopMm, drawWidth, drawHeight, undefined, 'FAST');
        } else {
            // Multi-page clean block pagination (never slices any card or illustration mid-frame)
            const blocks = Array.from(clone.querySelectorAll<HTMLElement>('[data-pdf-block]'));
            const captureTargets = blocks.length > 0 ? blocks : [clone];

            let cursorY = marginTopMm;
            let isFirstBlockOnPage = true;

            for (let i = 0; i < captureTargets.length; i++) {
                const target = captureTargets[i];
                if (!target || target.offsetHeight < 4) continue;

                const canvas = await html2canvas(target, {
                    scale: 2.8,
                    backgroundColor: '#ffffff',
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    windowWidth: 794
                });

                if (canvas.width === 0 || canvas.height === 0) continue;

                const totalImgHeightMm = (canvas.height / canvas.width) * contentWidthMm;

                if (totalImgHeightMm <= availablePageHeightMm && !isFirstBlockOnPage && cursorY + totalImgHeightMm > maxContentBottomMm) {
                    pdf.addPage();
                    cursorY = marginTopMm;
                    isFirstBlockOnPage = true;
                }

                if (totalImgHeightMm <= availablePageHeightMm) {
                    const imgData = canvas.toDataURL('image/png', 0.98);
                    pdf.addImage(imgData, 'PNG', marginXMm, cursorY, contentWidthMm, totalImgHeightMm, undefined, 'FAST');
                    cursorY += totalImgHeightMm + blockGapMm;
                    isFirstBlockOnPage = false;
                } else {
                    if (!isFirstBlockOnPage) {
                        pdf.addPage();
                        cursorY = marginTopMm;
                        isFirstBlockOnPage = true;
                    }
                    const pxPerMm = canvas.width / contentWidthMm;
                    let renderedPxY = 0;

                    while (renderedPxY < canvas.height) {
                        const remainingMm = maxContentBottomMm - cursorY;
                        const sliceHeightPx = Math.min(canvas.height - renderedPxY, Math.floor(remainingMm * pxPerMm));
                        if (sliceHeightPx <= 0) {
                            pdf.addPage();
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
                            pdf.addPage();
                            cursorY = marginTopMm;
                            isFirstBlockOnPage = true;
                        } else {
                            cursorY += blockGapMm;
                            isFirstBlockOnPage = false;
                        }
                    }
                }
            }
        }

        // Clean PPA page footer
        const totalPages = pdf.getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
            pdf.setPage(p);
            pdf.setDrawColor(226, 232, 240);
            pdf.setLineWidth(0.25);
            pdf.line(marginXMm, pageHeightMm - 8.5, pageWidthMm - marginXMm, pageHeightMm - 8.5);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7);
            pdf.setTextColor(100, 116, 139);
            const leftFooter = `${institutionName} · ${subject}${className ? ` (${className})` : ''} · Infografis Materi Ajar PPA`;
            pdf.text(leftFooter.slice(0, 96), marginXMm, pageHeightMm - 4.8);
            pdf.text(`Hal ${p}/${totalPages}`, pageWidthMm - marginXMm, pageHeightMm - 4.8, { align: 'right' });
        }

        const safeName = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
        pdf.save(safeName);
    } finally {
        if (stage.parentNode) {
            stage.parentNode.removeChild(stage);
        }
    }
}
