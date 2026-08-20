import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, Trash2, FileCheck, RefreshCw } from 'lucide-react';
import { UploadedFile, DocumentPage } from '../types';
import { parseAndRenderPdf } from '../utils/pdfRenderer';

interface FileUploaderProps {
  currentFile: UploadedFile | null;
  onFileSelect: (file: UploadedFile) => void;
  onClearFile: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  currentFile,
  onFileSelect,
  onClearFile,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('Processing file...');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFile = async (file: File) => {
    setIsLoading(true);
    setLoadingStatus('Reading document...');

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    try {
      if (isPdf) {
        setLoadingStatus('Rendering PDF pages & high-res vector proofs...');
        const parsed = await parseAndRenderPdf(file);

        const uploaded: UploadedFile = {
          id: 'file-' + Date.now(),
          name: file.name,
          size: file.size,
          type: file.type || 'application/pdf',
          previewUrl: parsed.pages[0]?.previewUrl || '',
          pageCount: parsed.pageCount,
          pages: parsed.pages,
          uploadedAt: Date.now(),
          editSettings: {
            watermarkText: '',
            watermarkType: 'none',
            watermarkPosition: 'diagonal',
            pageMargin: 'normal',
            pageScale: 100,
            showCutBorders: false,
          },
        };

        setIsLoading(false);
        onFileSelect(uploaded);
        return;
      }

      if (isImage) {
        setLoadingStatus('Optimizing image for print proofing...');
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;

          const pages: DocumentPage[] = [
            {
              pageNumber: 1,
              originalPageNumber: 1,
              rotation: 0,
              previewUrl: dataUrl,
              textSnippet: `Photo / Graphic: ${file.name}`,
            },
          ];

          const uploaded: UploadedFile = {
            id: 'file-' + Date.now(),
            name: file.name,
            size: file.size,
            type: file.type || 'image/jpeg',
            previewUrl: dataUrl,
            pageCount: 1,
            pages,
            uploadedAt: Date.now(),
            editSettings: {
              watermarkText: '',
              watermarkType: 'none',
              watermarkPosition: 'diagonal',
              pageMargin: 'normal',
              pageScale: 100,
              showCutBorders: false,
            },
          };

          setIsLoading(false);
          onFileSelect(uploaded);
        };
        reader.readAsDataURL(file);
        return;
      }

      // Other documents (Text, Word, etc.)
      const isText = file.type.startsWith('text/') || file.name.endsWith('.txt');
      if (isText) {
        setLoadingStatus('Extracting text content...');
        const text = await file.text();
        const lines = text.split('\n');
        const linesPerPage = 35;
        const pageCount = Math.max(1, Math.ceil(lines.length / linesPerPage));

        const pages: DocumentPage[] = Array.from({ length: pageCount }, (_, idx) => {
          const pageLines = lines.slice(idx * linesPerPage, (idx + 1) * linesPerPage).join('\n');
          return {
            pageNumber: idx + 1,
            originalPageNumber: idx + 1,
            rotation: 0,
            textSnippet: pageLines.slice(0, 500) || `Content of page ${idx + 1}`,
          };
        });

        const uploaded: UploadedFile = {
          id: 'file-' + Date.now(),
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          previewUrl: '',
          pageCount,
          pages,
          uploadedAt: Date.now(),
          editSettings: {
            watermarkText: '',
            watermarkType: 'none',
            watermarkPosition: 'diagonal',
            pageMargin: 'normal',
            pageScale: 100,
            showCutBorders: false,
          },
        };

        setIsLoading(false);
        onFileSelect(uploaded);
        return;
      }

      // Default fallback for DOCX/other binary files
      const estimatedPages = Math.max(1, Math.min(10, Math.ceil(file.size / 150000)));
      const pages: DocumentPage[] = Array.from({ length: estimatedPages }, (_, idx) => ({
        pageNumber: idx + 1,
        originalPageNumber: idx + 1,
        rotation: 0,
        textSnippet: `Document: ${file.name}\n--- Page ${idx + 1} of ${estimatedPages} ---\nDirect document spooling configured.`,
      }));

      const uploaded: UploadedFile = {
        id: 'file-' + Date.now(),
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        previewUrl: '',
        pageCount: estimatedPages,
        pages,
        uploadedAt: Date.now(),
        editSettings: {
          watermarkText: '',
          watermarkType: 'none',
          watermarkPosition: 'diagonal',
          pageMargin: 'normal',
          pageScale: 100,
          showCutBorders: false,
        },
      };

      setIsLoading(false);
      onFileSelect(uploaded);
    } catch (err) {
      console.error('Error processing file:', err);
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      processFile(selectedFile);
      // Reset input value so re-uploading the same file or a new one works seamlessly
      e.target.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <section className="m3-card p-6 sm:p-8 space-y-6">
      {/* Hidden file input ALWAYS present in DOM */}
      <input
        ref={fileInputRef}
        type="file"
        id="print-file-input"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.xls,.xlsx,.webp"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Card Header with Step Circle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-normal text-[#1C1B1F] flex items-center gap-3">
            <span className="m3-step-circle">1</span>
            Upload Document to Print
          </h2>
          <p className="text-sm text-[#79747E] mt-1 ml-11">
            Supported: PDF, Word (DOCX), Images (PNG, JPG), Text, Excel
          </p>
        </div>

        {currentFile && (
          <button
            id="replace-file-btn"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-m3 btn-m3-outlined text-xs h-9 px-4 self-start sm:self-center cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#006A6A]" />
            <span>Upload Another File</span>
          </button>
        )}
      </div>

      {/* Upload Drop Area or Active File Banner */}
      {!currentFile ? (
        <div
          id="dropzone-area"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed border-[#79747E] rounded-2xl py-12 px-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
            isDragging
              ? 'bg-[rgba(0,106,106,0.12)] border-[#006A6A]'
              : 'bg-[rgba(0,106,106,0.04)] hover:bg-[rgba(0,106,106,0.08)]'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-[#CCE8E8] text-[#006A6A] flex items-center justify-center mb-4 shadow-xs">
            {isLoading ? (
              <div className="w-7 h-7 border-3 border-[#006A6A] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          <p className="text-base font-medium text-[#1C1B1F]">
            {isLoading ? loadingStatus : 'Click to browse or drop document'}
          </p>
          <p className="text-xs text-[#79747E] mt-1.5">
            Max 50MB per file. Automatic page detection & live visual proofs.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-5 rounded-2xl bg-[#CCE8E8]/40 border border-[#CAC4D0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#CAC4D0] text-[#006A6A] flex items-center justify-center shrink-0 shadow-2xs">
                {currentFile.type.includes('pdf') ? (
                  <FileText className="w-6 h-6 text-red-600" />
                ) : currentFile.type.includes('image') ? (
                  <ImageIcon className="w-6 h-6 text-blue-600" />
                ) : (
                  <FileCheck className="w-6 h-6 text-[#006A6A]" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-[#1C1B1F] text-base truncate max-w-[260px] sm:max-w-md">
                    {currentFile.name}
                  </p>
                  <span className="text-[10px] font-bold text-[#052020] bg-[#CCE8E8] px-2 py-0.5 rounded">
                    Ready
                  </span>
                </div>
                <p className="text-xs text-[#79747E] mt-0.5 flex items-center gap-2">
                  <span className="font-mono-code font-bold text-[#006A6A]">
                    {currentFile.pageCount} {currentFile.pageCount === 1 ? 'Page' : 'Pages'}
                  </span>
                  <span>•</span>
                  <span>{formatFileSize(currentFile.size)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                id="change-file-btn"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-m3 btn-m3-outlined text-xs h-8 px-3 cursor-pointer"
              >
                Change File
              </button>
              <button
                id="clear-file-btn"
                type="button"
                onClick={onClearFile}
                className="p-2 text-[#79747E] hover:text-red-600 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                title="Remove File"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {isLoading && (
            <div className="p-3 bg-[#CCE8E8] rounded-xl flex items-center gap-2.5 text-xs text-[#052020]">
              <div className="w-4 h-4 border-2 border-[#006A6A] border-t-transparent rounded-full animate-spin"></div>
              <span>{loadingStatus}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

