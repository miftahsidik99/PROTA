import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

export interface MateriPdfExportOptions {
    filename: string;
    paperSize: 'A4' | 'F4';
    institutionName?: string;
    subject?: string;
    className?: string;
}

/**
 * Exports a structured Materi Ajar preview node (composed of [data-pdf-block] sections)
 * into a crisp, properly paginated A4 or F4 PDF file without slicing cards/diagrams mid-block.
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

    // A4: 210 x 297 mm | F4 (Folio Indonesia): 215 x 330 mm
    const pageWidthMm = paperSize === 'F4' ? 215 : 210;
    const pageHeightMm = paperSize === 'F4' ? 330 : 297;
    const marginXMm = 12;
    const marginTopMm = 11;
    const marginBottomMm = 13;
    const contentWidthMm = pageWidthMm - marginXMm * 2;
    const maxContentBottomMm = pageHeightMm - marginBottomMm;
    const blockGapMm = 3.5;

    // Clone into an offscreen fixed-width print stage (794px ~ 210mm @ 96dpi)
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
    clone.style.border = 'none';

    // Ensure every inline SVG has explicit numeric pixel sizing for reliable html2canvas rasterization
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

    try {
        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
        }
        await new Promise((resolve) => setTimeout(resolve, 120));

        const blocks = Array.from(clone.querySelectorAll<HTMLElement>('[data-pdf-block]'));
        const captureTargets = blocks.length > 0 ? blocks : [clone];

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [pageWidthMm, pageHeightMm],
            compress: true
        });

        let cursorY = marginTopMm;
        let isFirstBlockOnPage = true;

        for (let i = 0; i < captureTargets.length; i++) {
            const target = captureTargets[i];
            if (!target || target.offsetHeight < 4) continue;

            const canvas = await html2canvas(target, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                allowTaint: true,
                logging: false,
                windowWidth: 794
            });

            if (canvas.width === 0 || canvas.height === 0) continue;

            const totalImgHeightMm = (canvas.height / canvas.width) * contentWidthMm;
            const availableHeightMm = maxContentBottomMm - marginTopMm;

            // If block fits on a fresh page but not on current remaining space, break page cleanly
            if (totalImgHeightMm <= availableHeightMm && !isFirstBlockOnPage && cursorY + totalImgHeightMm > maxContentBottomMm) {
                pdf.addPage();
                cursorY = marginTopMm;
                isFirstBlockOnPage = true;
            }

            if (totalImgHeightMm <= availableHeightMm) {
                const imgData = canvas.toDataURL('image/png', 0.95);
                pdf.addImage(imgData, 'PNG', marginXMm, cursorY, contentWidthMm, totalImgHeightMm, undefined, 'FAST');
                cursorY += totalImgHeightMm + blockGapMm;
                isFirstBlockOnPage = false;
            } else {
                // Tall single block: slice vertically across pages cleanly
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
                        const sliceImg = sliceCanvas.toDataURL('image/png', 0.95);
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

        // Stamp clean PPA footer on every generated page
        const totalPages = pdf.getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
            pdf.setPage(p);
            pdf.setDrawColor(226, 232, 240);
            pdf.setLineWidth(0.25);
            pdf.line(marginXMm, pageHeightMm - 9.5, pageWidthMm - marginXMm, pageHeightMm - 9.5);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7.5);
            pdf.setTextColor(100, 116, 139);
            const leftFooter = `${institutionName} · ${subject}${className ? ` (${className})` : ''} · Materi Ajar PPA BSKAP 046`;
            pdf.text(leftFooter.slice(0, 92), marginXMm, pageHeightMm - 5.5);
            pdf.text(`Halaman ${p} dari ${totalPages}`, pageWidthMm - marginXMm, pageHeightMm - 5.5, { align: 'right' });
        }

        const safeName = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
        pdf.save(safeName);
    } finally {
        if (stage.parentNode) {
            stage.parentNode.removeChild(stage);
        }
    }
}
