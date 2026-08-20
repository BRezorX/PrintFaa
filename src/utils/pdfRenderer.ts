import * as pdfjsLib from 'pdfjs-dist';
import { DocumentPage } from '../types';

// Configure pdfjs worker
// Using CDN fallback worker matching pdfjs-dist version
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
}

export interface ParsedPdfResult {
  pageCount: number;
  pages: DocumentPage[];
}

/**
 * Renders each page of a PDF File into high-resolution image data URLs and extracts text.
 */
export async function parseAndRenderPdf(file: File): Promise<ParsedPdfResult> {
  const arrayBuffer = await file.arrayBuffer();

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
      cMapPacked: true,
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const pages: DocumentPage[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 }); // Sharp preview

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          // Fill white background first (PDF backgrounds may be transparent)
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas,
          } as any).promise;

          const previewUrl = canvas.toDataURL('image/jpeg', 0.88);

          // Extract text
          let textSnippet = '';
          try {
            const textContent = await page.getTextContent();
            textSnippet = textContent.items
              .slice(0, 25)
              .map((item: any) => item.str || '')
              .join(' ')
              .trim();
          } catch {
            textSnippet = `Page ${pageNum} of ${file.name}`;
          }

          pages.push({
            pageNumber: pageNum,
            originalPageNumber: pageNum,
            rotation: 0,
            previewUrl,
            textSnippet: textSnippet || `Page ${pageNum} Content`,
          });
        } else {
          throw new Error('Canvas 2D context unavailable');
        }
      } catch (pageErr) {
        console.warn(`Error rendering PDF page ${pageNum}:`, pageErr);
        pages.push({
          pageNumber: pageNum,
          originalPageNumber: pageNum,
          rotation: 0,
          textSnippet: `Page ${pageNum} of ${file.name}`,
        });
      }
    }

    return {
      pageCount: numPages,
      pages,
    };
  } catch (err) {
    console.error('Failed to parse PDF with pdfjs-dist:', err);
    // Fallback: create single page with notice
    return {
      pageCount: 1,
      pages: [
        {
          pageNumber: 1,
          originalPageNumber: 1,
          rotation: 0,
          textSnippet: `Document: ${file.name}\n(Direct vector spooling ready)`,
        },
      ],
    };
  }
}
