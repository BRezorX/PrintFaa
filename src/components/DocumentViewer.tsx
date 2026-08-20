import React, { useState } from 'react';
import { Eye, FileText, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { UploadedFile, PrintSettings } from '../types';
import { calculateSelectedPageNumbers } from '../utils/priceCalculator';

interface DocumentViewerProps {
  file: UploadedFile;
  settings: PrintSettings;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ file, settings }) => {
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Guard active page index
  const safeIndex = Math.min(Math.max(0, activePageIndex), Math.max(0, file.pages.length - 1));
  const selectedPages = calculateSelectedPageNumbers(settings, file.pageCount);
  const activePageNum = safeIndex + 1;
  const isCurrentPageIncluded = selectedPages.includes(activePageNum);

  const isBw = settings.colorMode === 'bw';
  const isLandscape = settings.orientation === 'landscape';

  const currentPageData = file.pages[safeIndex] || {
    pageNumber: activePageNum,
    originalPageNumber: activePageNum,
    rotation: 0,
    textSnippet: `Content of page ${activePageNum}`,
  };

  const pageRotation = currentPageData.rotation || 0;
  const editSettings = file.editSettings;

  return (
    <div className="m3-card overflow-hidden">
      {/* Top bar with visual modes */}
      <div className="p-4 border-b border-[#CAC4D0]/50 bg-[#F7F9FB] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#006A6A]" />
          <span className="font-medium text-[#1C1B1F] text-xs sm:text-sm">
            Live Print Proof: Page {activePageNum} of {file.pageCount}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isCurrentPageIncluded
                ? 'bg-[#CCE8E8] text-[#052020]'
                : 'bg-[#E7E0EB] text-[#79747E]'
            }`}
          >
            {isCurrentPageIncluded ? 'Included in Print' : 'Excluded by Filter'}
          </span>
          {pageRotation > 0 && (
            <span className="text-[10px] font-mono-code font-bold bg-[#CCE8E8] text-[#052020] px-2 py-0.5 rounded-full flex items-center gap-1">
              <RotateCw className="w-3 h-3" /> {pageRotation}°
            </span>
          )}
        </div>

        {/* Status Pills for Settings */}
        <div className="flex items-center gap-2 text-[11px] font-medium text-[#1C1B1F]">
          <span className={`px-2 py-0.5 rounded-md ${isBw ? 'bg-[#1C1B1F] text-white' : 'bg-gradient-to-r from-amber-500 to-pink-500 text-white'}`}>
            {isBw ? 'B&W Grayscale' : 'Full Color'}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#F7F9FB] border border-[#CAC4D0] uppercase font-mono-code font-bold">
            {settings.paperSize}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#F7F9FB] border border-[#CAC4D0] capitalize">
            {settings.orientation}
          </span>
          {settings.pagesPerSheet > 1 && (
            <span className="px-2 py-0.5 rounded-md bg-[#006A6A] text-white font-mono-code font-bold text-[10px]">
              {settings.pagesPerSheet}-UP
            </span>
          )}

          {/* Zoom controls */}
          <div className="flex items-center border border-[#CAC4D0] rounded-lg bg-white overflow-hidden ml-1">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.1))}
              className="p-1 text-[#1C1B1F] hover:bg-[#E7E0EB] cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] px-1 font-mono-code">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-1 text-[#1C1B1F] hover:bg-[#E7E0EB] cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Sheet Stage */}
      <div className="p-6 sm:p-8 bg-[#F7F9FB] min-h-[360px] flex items-center justify-center overflow-auto border-b border-[#CAC4D0]/50">
        <div
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          className={`transition-all duration-300 relative bg-white shadow-lg rounded-sm p-6 sm:p-8 border border-[#CAC4D0] text-[#1C1B1F] ${
            isLandscape ? 'w-[440px] h-[300px]' : 'w-[320px] h-[440px]'
          } ${isBw ? 'grayscale contrast-125' : ''}`}
        >
          {/* Paper watermark or binding preview */}
          {settings.binding === 'staple' && (
            <div className="absolute top-2 left-2 w-4 h-1.5 bg-[#1C1B1F] -rotate-45 rounded-xs shadow-xs z-20" title="Corner Staple"></div>
          )}
          {settings.binding === 'spiral' && (
            <div className="absolute top-0 bottom-0 left-1.5 flex flex-col justify-between py-2 pointer-events-none z-20">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full border-2 border-[#1C1B1F] bg-[#CAC4D0] shadow-2xs"></div>
              ))}
            </div>
          )}
          {settings.binding === 'laminate' && (
            <div className="absolute inset-0 border-4 border-[#006A6A]/40 pointer-events-none bg-[#006A6A]/5 z-20" title="Glossy Lamination Seal"></div>
          )}

          {/* Watermark / Header Stamp Overlays */}
          {editSettings && editSettings.watermarkType !== 'none' && (
            <>
              {editSettings.watermarkPosition === 'header' && (
                <div className="absolute top-2 inset-x-0 text-center pointer-events-none z-10">
                  <span className="text-[10px] font-bold font-mono-code text-red-600/70 border-b border-red-500/40 px-3 py-0.5">
                    {editSettings.watermarkText || editSettings.watermarkType.toUpperCase()}
                  </span>
                </div>
              )}
              {editSettings.watermarkPosition === 'footer' && (
                <div className="absolute bottom-2 inset-x-0 text-center pointer-events-none z-10">
                  <span className="text-[10px] font-bold font-mono-code text-red-600/70 border-t border-red-500/40 px-3 py-0.5">
                    {editSettings.watermarkText || editSettings.watermarkType.toUpperCase()}
                  </span>
                </div>
              )}
              {editSettings.watermarkPosition === 'diagonal' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
                  <span className="text-2xl font-black font-mono-code text-red-600/20 -rotate-30 uppercase tracking-widest border-2 border-red-500/20 px-4 py-1.5 select-none text-center">
                    {editSettings.watermarkText || editSettings.watermarkType.toUpperCase()}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Document Content Simulation with CSS Rotation */}
          <div
            style={{
              transform: `rotate(${pageRotation}deg)`,
              transformOrigin: 'center center',
              transition: 'transform 0.3s ease',
            }}
            className="w-full h-full flex flex-col justify-between overflow-hidden select-none"
          >
            {currentPageData.previewUrl ? (
              <div className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden">
                <img
                  src={currentPageData.previewUrl}
                  alt={`Page ${activePageNum}`}
                  className="max-w-full max-h-full object-contain rounded-xs shadow-2xs"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#CAC4D0] pb-2">
                  <div className="h-4 bg-[#1C1B1F] rounded w-1/2"></div>
                  <span className="text-[10px] font-mono-code text-[#79747E]">
                    p. {activePageNum} {currentPageData.originalPageNumber && `(Orig #${currentPageData.originalPageNumber})`}
                  </span>
                </div>
                <div className="space-y-2 text-[11px] text-[#1C1B1F] leading-relaxed whitespace-pre-line font-mono-code">
                  {currentPageData.textSnippet || (
                    <>
                      <div className="h-2.5 bg-[#CAC4D0] rounded w-full"></div>
                      <div className="h-2.5 bg-[#CAC4D0] rounded w-5/6"></div>
                      <div className="h-2.5 bg-[#CAC4D0] rounded w-4/6"></div>
                      <div className="h-2.5 bg-[#CAC4D0]/50 rounded w-full mt-3"></div>
                      <div className="h-2.5 bg-[#CAC4D0]/50 rounded w-11/12"></div>
                      <div className="h-2.5 bg-[#CAC4D0]/50 rounded w-3/4"></div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[#CAC4D0] flex items-center justify-between text-[10px] font-mono-code text-[#79747E]">
              <span className="truncate max-w-[150px]">{file.name}</span>
              <span>{settings.duplex ? 'Duplex Sheet' : 'Single Sided'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Thumbnail Strip */}
      <div className="p-3 bg-white flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] font-mono-code text-[#79747E] uppercase tracking-wider pl-2 shrink-0">
          Pages ({file.pageCount}):
        </span>
        <div className="flex items-center gap-2">
          {file.pages.map((p, idx) => {
            const isSelected = selectedPages.includes(p.pageNumber);
            const isActive = safeIndex === idx;
            const rot = p.rotation || 0;

            return (
              <button
                key={p.pageNumber + '-' + idx}
                id={`preview-page-${p.pageNumber}-btn`}
                onClick={() => setActivePageIndex(idx)}
                className={`relative w-12 h-16 rounded-xl border flex flex-col items-center justify-center p-1 cursor-pointer transition-all shrink-0 overflow-hidden ${
                  isActive
                    ? 'border-[#006A6A] bg-[#CCE8E8] shadow-xs'
                    : 'border-[#CAC4D0] bg-[#F7F9FB] hover:bg-[#E7E0EB]'
                } ${!isSelected ? 'opacity-40 line-through' : ''}`}
              >
                {p.previewUrl ? (
                  <div
                    style={{ transform: `rotate(${rot}deg)` }}
                    className="w-8 h-10 overflow-hidden rounded-xs flex items-center justify-center bg-white shadow-2xs border border-[#CAC4D0]/40"
                  >
                    <img src={p.previewUrl} alt={`p${p.pageNumber}`} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div style={{ transform: `rotate(${rot}deg)` }}>
                    <FileText className={`w-4 h-4 ${isActive ? 'text-[#006A6A]' : 'text-[#79747E]'}`} />
                  </div>
                )}
                <span className="text-[9px] font-mono-code font-bold text-[#1C1B1F] mt-0.5">{p.pageNumber}</span>
                {rot > 0 && (
                  <span className="absolute bottom-0.5 right-0.5 text-[7px] font-mono-code text-[#006A6A] font-bold bg-white/80 rounded px-0.5">
                    {rot}°
                  </span>
                )}
                {isSelected ? (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#006A6A] text-white rounded-full flex items-center justify-center text-[8px] font-bold z-10">
                    ✓
                  </span>
                ) : (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#79747E] text-white rounded-full flex items-center justify-center text-[8px] font-bold z-10">
                    ✕
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

