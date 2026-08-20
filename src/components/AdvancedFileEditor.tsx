import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCw,
  ArrowLeftRight,
  Plus,
  Trash2,
  Copy,
  FileText,
  RotateCcw,
  Sparkles,
  Layers,
  Stamp,
  Maximize2,
  Scissors,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { UploadedFile, PrintSettings, DocumentPage, FileEditSettings } from '../types';

interface AdvancedFileEditorProps {
  file: UploadedFile;
  settings: PrintSettings;
  onFileUpdate: (updatedFile: UploadedFile) => void;
  onSettingsUpdate: (updatedSettings: PrintSettings) => void;
}

export const AdvancedFileEditor: React.FC<AdvancedFileEditorProps> = ({
  file,
  settings,
  onFileUpdate,
  onSettingsUpdate,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'arrange' | 'watermark' | 'imposition'>('arrange');

  const editSettings: FileEditSettings = file.editSettings || {
    watermarkText: '',
    watermarkType: 'none',
    watermarkPosition: 'diagonal',
    pageMargin: 'normal',
    pageScale: 100,
    showCutBorders: false,
  };

  // Reorder page: move from index to new index
  const movePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= file.pages.length) return;
    const newPages = [...file.pages];
    const [moved] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, moved);

    // Re-index page numbers
    const updatedPages = newPages.map((p, idx) => ({
      ...p,
      pageNumber: idx + 1,
    }));

    onFileUpdate({
      ...file,
      pages: updatedPages,
    });
  };

  // Rotate individual page by 90 deg clockwise
  const rotatePage = (pageIndex: number) => {
    const newPages = [...file.pages];
    const currentRot = newPages[pageIndex].rotation || 0;
    const nextRot = (currentRot + 90) % 360;
    newPages[pageIndex] = {
      ...newPages[pageIndex],
      rotation: nextRot,
    };

    onFileUpdate({
      ...file,
      pages: newPages,
    });
  };

  // Rotate ALL pages by 90 deg clockwise
  const rotateAllPages = () => {
    const updatedPages = file.pages.map((p) => ({
      ...p,
      rotation: ((p.rotation || 0) + 90) % 360,
    }));

    onFileUpdate({
      ...file,
      pages: updatedPages,
    });
  };

  // Reverse page sequence (e.g. 1,2,3 -> 3,2,1)
  const reversePages = () => {
    const reversed = [...file.pages].reverse().map((p, idx) => ({
      ...p,
      pageNumber: idx + 1,
    }));

    onFileUpdate({
      ...file,
      pages: reversed,
    });
  };

  // Duplicate a page
  const duplicatePage = (pageIndex: number) => {
    const target = file.pages[pageIndex];
    const newPages = [...file.pages];
    const duplicated: DocumentPage = {
      ...target,
      pageNumber: pageIndex + 2,
      originalPageNumber: target.originalPageNumber || target.pageNumber,
      isCustomAdded: true,
      customLabel: `Copy of Page ${target.pageNumber}`,
    };
    newPages.splice(pageIndex + 1, 0, duplicated);

    const renumbered = newPages.map((p, idx) => ({
      ...p,
      pageNumber: idx + 1,
    }));

    onFileUpdate({
      ...file,
      pageCount: renumbered.length,
      pages: renumbered,
    });
  };

  // Delete page
  const deletePage = (pageIndex: number) => {
    if (file.pages.length <= 1) return; // keep at least 1 page
    const newPages = file.pages.filter((_, idx) => idx !== pageIndex);
    const renumbered = newPages.map((p, idx) => ({
      ...p,
      pageNumber: idx + 1,
    }));

    onFileUpdate({
      ...file,
      pageCount: renumbered.length,
      pages: renumbered,
    });
  };

  // Add blank / notes page
  const addBlankPage = () => {
    const newPageNum = file.pages.length + 1;
    const newBlankPage: DocumentPage = {
      pageNumber: newPageNum,
      originalPageNumber: newPageNum,
      rotation: 0,
      isCustomAdded: true,
      customLabel: 'Blank / Notes Sheet',
      textSnippet: '--- BLANK / NOTES PAGE ---\n\n(Customer inserted sheet for notes or spacing)',
    };

    const updatedPages = [...file.pages, newBlankPage];
    onFileUpdate({
      ...file,
      pageCount: updatedPages.length,
      pages: updatedPages,
    });
  };

  // Reset to original sequence
  const resetToOriginal = () => {
    const sorted = [...file.pages]
      .sort((a, b) => (a.originalPageNumber || a.pageNumber) - (b.originalPageNumber || b.pageNumber))
      .map((p, idx) => ({
        ...p,
        pageNumber: idx + 1,
        rotation: 0,
        isExcluded: false,
      }));

    onFileUpdate({
      ...file,
      pages: sorted,
      pageCount: sorted.length,
      editSettings: {
        watermarkText: '',
        watermarkType: 'none',
        watermarkPosition: 'diagonal',
        pageMargin: 'normal',
        pageScale: 100,
        showCutBorders: false,
      },
    });
  };

  // Update edit settings
  const updateEditSettings = (partial: Partial<FileEditSettings>) => {
    const nextSettings: FileEditSettings = {
      ...editSettings,
      ...partial,
    };

    onFileUpdate({
      ...file,
      editSettings: nextSettings,
    });
  };

  // Check if any adjustments are currently active
  const hasRotations = file.pages.some((p) => p.rotation && p.rotation > 0);
  const hasWatermark = editSettings.watermarkType !== 'none';
  const hasNUp = settings.pagesPerSheet > 1;
  const isModified = hasRotations || hasWatermark || hasNUp || file.pages.some((p, i) => p.originalPageNumber !== i + 1);

  return (
    <div className="m3-card overflow-hidden transition-all duration-300">
      {/* Collapsible Header */}
      <button
        type="button"
        id="toggle-advanced-file-editor-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-5 flex items-center justify-between text-left bg-[#F7F9FB] hover:bg-[#E7E0EB]/40 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#CCE8E8] text-[#006A6A] flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-normal text-base sm:text-lg text-[#1C1B1F]">
                Advanced Options: Edit & Arrange File
              </h3>
              {isModified && (
                <span className="text-[10px] font-mono-code font-bold bg-[#CCE8E8] text-[#052020] px-2 py-0.5 rounded-full">
                  Customized
                </span>
              )}
            </div>
            <p className="text-xs text-[#79747E] mt-0.5">
              Reorder pages, rotate sheets, add blank pages, configure watermarks & N-up layout
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-code text-[#79747E] hidden sm:inline">
            {file.pages.length} Pages • {isOpen ? 'Hide Options' : 'Expand Options'}
          </span>
          <div className="w-8 h-8 rounded-full bg-white border border-[#CAC4D0] flex items-center justify-center text-[#1C1B1F]">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Expandable Body */}
      {isOpen && (
        <div className="p-5 sm:p-6 space-y-6 border-t border-[#CAC4D0]/50 bg-white">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#CAC4D0]/50 pb-3 overflow-x-auto">
            <button
              type="button"
              id="adv-tab-arrange-btn"
              onClick={() => setActiveTab('arrange')}
              className={`btn-m3 text-xs py-1.5 px-3.5 shrink-0 ${
                activeTab === 'arrange' ? 'btn-m3-filled' : 'btn-m3-tonal'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Page Sequence & Rotation ({file.pages.length})</span>
            </button>

            <button
              type="button"
              id="adv-tab-watermark-btn"
              onClick={() => setActiveTab('watermark')}
              className={`btn-m3 text-xs py-1.5 px-3.5 shrink-0 ${
                activeTab === 'watermark' ? 'btn-m3-filled' : 'btn-m3-tonal'
              }`}
            >
              <Stamp className="w-3.5 h-3.5" />
              <span>Watermark & Header Stamp</span>
            </button>

            <button
              type="button"
              id="adv-tab-imposition-btn"
              onClick={() => setActiveTab('imposition')}
              className={`btn-m3 text-xs py-1.5 px-3.5 shrink-0 ${
                activeTab === 'imposition' ? 'btn-m3-filled' : 'btn-m3-tonal'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Multi-Page N-Up ({settings.pagesPerSheet}-Up)</span>
            </button>
          </div>

          {/* TAB 1: Page Sequence, Rotation, & Arranging */}
          {activeTab === 'arrange' && (
            <div className="space-y-4">
              {/* Quick Batch Actions Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#F7F9FB] rounded-2xl border border-[#CAC4D0]/60">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    id="rotate-all-pages-btn"
                    onClick={rotateAllPages}
                    className="btn-m3 btn-m3-outlined text-xs py-1 px-2.5 cursor-pointer"
                    title="Rotate all pages 90° clockwise"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-[#006A6A]" />
                    <span>Rotate All 90°</span>
                  </button>

                  <button
                    type="button"
                    id="reverse-page-order-btn"
                    onClick={reversePages}
                    className="btn-m3 btn-m3-outlined text-xs py-1 px-2.5 cursor-pointer"
                    title="Invert page order"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-[#006A6A]" />
                    <span>Reverse Order</span>
                  </button>

                  <button
                    type="button"
                    id="add-blank-sheet-btn"
                    onClick={addBlankPage}
                    className="btn-m3 btn-m3-outlined text-xs py-1 px-2.5 cursor-pointer"
                    title="Insert blank notes page at end"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#006A6A]" />
                    <span>Add Blank Page</span>
                  </button>
                </div>

                <button
                  type="button"
                  id="reset-page-arrangement-btn"
                  onClick={resetToOriginal}
                  className="btn-m3 btn-m3-tonal text-xs py-1 px-2.5 text-[#79747E] hover:text-[#1C1B1F] cursor-pointer"
                  title="Reset to uploaded order"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Original</span>
                </button>
              </div>

              {/* Visual Page Arrangement Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {file.pages.map((page, index) => {
                  const rotation = page.rotation || 0;
                  const isFirst = index === 0;
                  const isLast = index === file.pages.length - 1;

                  return (
                    <div
                      key={page.pageNumber + '-' + index}
                      id={`page-card-${index}`}
                      className="group bg-[#F7F9FB] rounded-2xl border border-[#CAC4D0] p-2.5 flex flex-col justify-between space-y-2 hover:border-[#006A6A] transition-all shadow-2xs hover:shadow-xs relative"
                    >
                      {/* Top Label & Actions */}
                      <div className="flex items-center justify-between text-[11px] font-mono-code font-bold text-[#1C1B1F]">
                        <span className="bg-white px-2 py-0.5 rounded-md border border-[#CAC4D0]">
                          #{page.pageNumber}
                        </span>

                        <div className="flex items-center gap-1">
                          {rotation > 0 && (
                            <span className="text-[9px] bg-[#CCE8E8] text-[#052020] px-1 rounded">
                              {rotation}°
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => rotatePage(index)}
                            className="p-1 hover:bg-[#E7E0EB] rounded-full text-[#006A6A] cursor-pointer transition-colors"
                            title="Rotate 90°"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Mini Page Thumbnail with live CSS Rotation */}
                      <div className="h-28 bg-white rounded-lg border border-[#CAC4D0]/60 p-2 flex items-center justify-center overflow-hidden relative shadow-2xs">
                        <div
                          style={{
                            transform: `rotate(${rotation}deg)`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.25s ease',
                          }}
                          className="w-full h-full flex flex-col justify-between text-[8px] font-mono-code text-[#79747E] leading-tight select-none p-1"
                        >
                          {page.previewUrl ? (
                            <img
                              src={page.previewUrl}
                              alt={`Thumb ${page.pageNumber}`}
                              className="w-full h-full object-contain pointer-events-none"
                            />
                          ) : (
                            <>
                              <div className="h-2 bg-[#1C1B1F] rounded-xs w-3/4 mb-1"></div>
                              <div className="space-y-1 opacity-70">
                                <div className="h-1.5 bg-[#CAC4D0] rounded-xs w-full"></div>
                                <div className="h-1.5 bg-[#CAC4D0] rounded-xs w-5/6"></div>
                                <div className="h-1.5 bg-[#CAC4D0] rounded-xs w-4/6"></div>
                                <div className="h-1.5 bg-[#CAC4D0]/60 rounded-xs w-full"></div>
                              </div>
                              <div className="text-[7px] text-[#79747E] truncate mt-1">
                                {page.customLabel || `Page ${page.originalPageNumber || page.pageNumber}`}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Diagonal watermark indicator if active */}
                        {editSettings.watermarkType !== 'none' && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-[8px] font-bold font-mono-code text-red-500/40 -rotate-30 uppercase border border-red-500/30 px-1 rounded-xs">
                              {editSettings.watermarkText || editSettings.watermarkType}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Reorder Controls */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#CAC4D0]/40 text-xs">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={() => movePage(index, index - 1)}
                            className="p-1 hover:bg-[#E7E0EB] disabled:opacity-30 rounded text-[#1C1B1F] cursor-pointer disabled:cursor-not-allowed"
                            title="Move left / earlier in sequence"
                          >
                            ◀
                          </button>
                          <button
                            type="button"
                            disabled={isLast}
                            onClick={() => movePage(index, index + 1)}
                            className="p-1 hover:bg-[#E7E0EB] disabled:opacity-30 rounded text-[#1C1B1F] cursor-pointer disabled:cursor-not-allowed"
                            title="Move right / later in sequence"
                          >
                            ▶
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => duplicatePage(index)}
                            className="p-1 hover:bg-[#E7E0EB] rounded text-[#006A6A] cursor-pointer"
                            title="Duplicate this page"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {file.pages.length > 1 && (
                            <button
                              type="button"
                              onClick={() => deletePage(index)}
                              className="p-1 hover:bg-red-100 rounded text-red-600 cursor-pointer"
                              title="Delete this page"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Watermark & Header Stamp */}
          {activeTab === 'watermark' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Watermark Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-mono-code font-bold text-[#79747E] uppercase">
                    Watermark Preset
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'none', label: 'None (Clean)' },
                      { id: 'confidential', label: 'CONFIDENTIAL' },
                      { id: 'draft', label: 'DRAFT' },
                      { id: 'copy', label: 'OFFICIAL COPY' },
                      { id: 'original', label: 'ORIGINAL' },
                      { id: 'custom', label: 'Custom Text...' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        id={`watermark-${item.id}-btn`}
                        onClick={() =>
                          updateEditSettings({
                            watermarkType: item.id as FileEditSettings['watermarkType'],
                            watermarkText: item.id === 'custom' ? editSettings.watermarkText || 'SAMPLE' : item.label,
                          })
                        }
                        className={`p-2.5 rounded-xl border text-xs font-medium text-left cursor-pointer transition-all ${
                          editSettings.watermarkType === item.id
                            ? 'border-[#006A6A] bg-[#CCE8E8] text-[#052020] font-bold'
                            : 'border-[#CAC4D0] bg-[#F7F9FB] text-[#1C1B1F] hover:bg-[#E7E0EB]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Position & Custom Text */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-mono-code font-bold text-[#79747E] uppercase">
                      Custom Watermark Text
                    </label>
                    <input
                      type="text"
                      id="custom-watermark-text-input"
                      value={editSettings.watermarkText}
                      placeholder="e.g. FOR SHOP REVIEW ONLY"
                      onChange={(e) =>
                        updateEditSettings({
                          watermarkText: e.target.value,
                          watermarkType: 'custom',
                        })
                      }
                      className="w-full mt-1 px-3.5 py-2 text-xs rounded-xl border border-[#CAC4D0] bg-[#F7F9FB] font-mono-code focus:border-[#006A6A] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono-code font-bold text-[#79747E] uppercase">
                      Stamp Position
                    </label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {[
                        { id: 'diagonal', label: 'Diagonal 45°' },
                        { id: 'header', label: 'Top Header' },
                        { id: 'footer', label: 'Bottom Footer' },
                      ].map((pos) => (
                        <button
                          key={pos.id}
                          type="button"
                          id={`stamp-pos-${pos.id}-btn`}
                          onClick={() =>
                            updateEditSettings({
                              watermarkPosition: pos.id as FileEditSettings['watermarkPosition'],
                            })
                          }
                          className={`p-2 rounded-xl border text-xs text-center cursor-pointer transition-all ${
                            editSettings.watermarkPosition === pos.id
                              ? 'border-[#006A6A] bg-[#CCE8E8] text-[#052020] font-bold'
                              : 'border-[#CAC4D0] bg-[#F7F9FB] text-[#1C1B1F] hover:bg-[#E7E0EB]'
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Multi-Page N-Up Imposition & Margins */}
          {activeTab === 'imposition' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* N-Up Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-mono-code font-bold text-[#79747E] uppercase">
                    Pages Per Sheet (N-Up Imposition)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 1, label: '1-Up', desc: 'Standard 1 Page / Sheet' },
                      { id: 2, label: '2-Up', desc: '2 Pages Side by Side' },
                      { id: 4, label: '4-Up', desc: '4 Pages 2x2 Grid' },
                    ].map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        id={`n-up-${n.id}-btn`}
                        onClick={() => onSettingsUpdate({ ...settings, pagesPerSheet: n.id as 1 | 2 | 4 })}
                        className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                          settings.pagesPerSheet === n.id
                            ? 'border-[#006A6A] bg-[#CCE8E8] text-[#052020] font-bold'
                            : 'border-[#CAC4D0] bg-[#F7F9FB] text-[#1C1B1F] hover:bg-[#E7E0EB]'
                        }`}
                      >
                        <p className="text-xs font-bold font-mono-code">{n.label}</p>
                        <p className="text-[10px] text-[#79747E] mt-0.5">{n.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Page Margins & Borders */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-mono-code font-bold text-[#79747E] uppercase">
                      Page Margin / Binder Punch Allowance
                    </label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {[
                        { id: 'normal', label: 'Normal (10mm)' },
                        { id: 'wide', label: 'Wide Punch (20mm)' },
                        { id: 'none', label: 'Borderless' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          id={`margin-${m.id}-btn`}
                          onClick={() => updateEditSettings({ pageMargin: m.id as FileEditSettings['pageMargin'] })}
                          className={`p-2 rounded-xl border text-xs text-center cursor-pointer transition-all ${
                            editSettings.pageMargin === m.id
                              ? 'border-[#006A6A] bg-[#CCE8E8] text-[#052020] font-bold'
                              : 'border-[#CAC4D0] bg-[#F7F9FB] text-[#1C1B1F] hover:bg-[#E7E0EB]'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[#1C1B1F]">
                      <input
                        type="checkbox"
                        checked={editSettings.showCutBorders}
                        onChange={(e) => updateEditSettings({ showCutBorders: e.target.checked })}
                        className="rounded accent-[#006A6A] w-4 h-4"
                      />
                      <span>Print thin separation lines between multi-up pages</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
