import React, { useEffect, useState } from 'react';
import {
  Printer,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { PrintJob, ShopPricingConfig } from '../types';
import { playPrinterStepSound } from '../utils/audio';

interface PrintJobTrackerProps {
  job: PrintJob;
  pricingConfig: ShopPricingConfig;
  soundEnabled: boolean;
  onPrintAnother: () => void;
  onUpdateProgress: (jobId: string, progress: number, status: PrintJob['status']) => void;
}

export const PrintJobTracker: React.FC<PrintJobTrackerProps> = ({
  job,
  pricingConfig,
  soundEnabled,
  onPrintAnother,
  onUpdateProgress,
}) => {
  const [progress, setProgress] = useState<number>(job.printProgress || 0);
  const [statusText, setStatusText] = useState<string>('Sending job to printer spooler...');
  const [activePrintingPage, setActivePrintingPage] = useState<number>(1);

  useEffect(() => {
    if (job.status === 'completed' || job.status === 'ready') {
      setProgress(100);
      setStatusText('All pages printed successfully! Ready for pickup.');
      return;
    }

    // Step through the printing simulation
    const totalSheets = Math.max(1, job.sheetsNeeded);
    let currentStep = 0;
    const totalSteps = 12;

    const interval = setInterval(() => {
      currentStep++;
      const currentPct = Math.min(100, Math.round((currentStep / totalSteps) * 100));
      setProgress(currentPct);

      if (currentPct < 25) {
        setStatusText('Rasterizing PDF & spooling data to Brother LaserJet...');
        onUpdateProgress(job.id, currentPct, 'spooling');
      } else if (currentPct < 50) {
        setStatusText(`Warming laser fuser & feeding sheet 1 of ${totalSheets}...`);
        if (soundEnabled && currentStep % 2 === 0) {
          playPrinterStepSound();
        }
        onUpdateProgress(job.id, currentPct, 'printing');
      } else if (currentPct < 95) {
        const pageIdx = Math.min(totalSheets, Math.ceil((currentPct - 40) / (55 / totalSheets)));
        setActivePrintingPage(pageIdx);
        setStatusText(`Printing sheet ${pageIdx} of ${totalSheets} (${job.settings.colorMode === 'bw' ? 'Monochrome' : 'CMYK Color'})...`);
        if (soundEnabled) {
          playPrinterStepSound();
        }
        onUpdateProgress(job.id, currentPct, 'printing');
      } else {
        setStatusText('Finishing tray output & validating print quality...');
        onUpdateProgress(job.id, 100, 'ready');
        clearInterval(interval);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [job.id, job.status, job.sheetsNeeded, job.settings.colorMode, soundEnabled]);

  const isComplete = progress >= 100;

  const handleNativePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Live Status Card */}
      <div className="m3-card overflow-hidden">
        {/* Top Banner */}
        <div className={`p-6 sm:p-7 text-white transition-colors duration-500 ${
          isComplete
            ? 'bg-[#006A6A]'
            : 'bg-[#1C1B1F]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                {isComplete ? (
                  <CheckCircle2 className="w-7 h-7 text-[#CCE8E8] animate-bounce" />
                ) : (
                  <Printer className="w-7 h-7 text-[#CCE8E8] animate-pulse" />
                )}
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider font-mono-code font-bold text-[#CCE8E8] bg-white/10 px-3 py-1 rounded-full">
                  {isComplete ? 'Print Complete' : 'Hardware Printing Active'}
                </span>
                <h2 className="text-xl font-medium mt-1.5">
                  {isComplete ? 'Ready for Collection!' : 'Printing Your Document...'}
                </h2>
              </div>
            </div>

            <div className="text-right font-mono-code">
              <span className="text-xs text-white/70 block">Order</span>
              <span className="text-base font-bold">#{job.orderNumber}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs font-medium text-white/90 font-mono-code">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#CCE8E8] animate-ping"></span>
                {statusText}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 w-full bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                style={{ width: `${progress}%` }}
                className="h-full bg-[#CCE8E8] rounded-full transition-all duration-500 shadow-xs"
              ></div>
            </div>
          </div>
        </div>

        {/* Pickup Ticket / Collection Card */}
        <div className="p-6 sm:p-7 space-y-6">
          <div className="p-5 rounded-2xl bg-[#F7F9FB] border-2 border-dashed border-[#CAC4D0] text-center relative">
            <span className="text-xs font-mono-code font-bold text-[#79747E] uppercase tracking-widest block">
              Pickup & Collection PIN
            </span>
            <p className="text-4xl sm:text-5xl font-bold text-[#1C1B1F] font-mono-code tracking-wider my-2">
              {job.pickupPin}
            </p>
            <p className="text-xs text-[#79747E]">
              Collect at: <span className="font-medium text-[#1C1B1F]">{job.stationName}</span>
            </p>

            {/* Barcode graphic */}
            <div className="mt-4 pt-4 border-t border-[#CAC4D0] flex flex-col items-center">
              <div className="font-mono-code text-xs text-[#79747E] tracking-[0.35em] uppercase">
                |||| | ||||| || |||| ||| |||||
              </div>
              <span className="text-[10px] text-[#79747E] font-mono-code mt-0.5">
                PIN-{job.pickupPin}-{job.orderNumber}
              </span>
            </div>
          </div>

          {/* Job Specifications Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#F7F9FB] border border-[#CAC4D0]">
              <span className="text-[#79747E] block text-[11px] font-mono-code">Format</span>
              <span className="font-medium text-[#1C1B1F] capitalize mt-0.5 block">
                {job.settings.colorMode === 'bw' ? 'B&W Grayscale' : 'Full Color'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F7F9FB] border border-[#CAC4D0]">
              <span className="text-[#79747E] block text-[11px] font-mono-code">Sheets</span>
              <span className="font-medium text-[#1C1B1F] mt-0.5 block">
                {job.sheetsNeeded} ({job.settings.duplex ? '2-Sided' : '1-Sided'})
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F7F9FB] border border-[#CAC4D0]">
              <span className="text-[#79747E] block text-[11px] font-mono-code">Copies</span>
              <span className="font-medium text-[#1C1B1F] mt-0.5 block">{job.settings.copies}x Copies</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F7F9FB] border border-[#CAC4D0]">
              <span className="text-[#79747E] block text-[11px] font-mono-code">Paid</span>
              <span className="font-bold text-[#006A6A] font-mono-code mt-0.5 block">
                {pricingConfig.currencySymbol}{job.payment?.amount?.toFixed(2) || job.pricing.total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              id="native-print-trigger-btn"
              type="button"
              onClick={handleNativePrint}
              className="btn-m3 btn-m3-filled w-full sm:flex-1 text-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt / Local Copy</span>
            </button>

            <button
              id="print-another-doc-btn"
              type="button"
              onClick={onPrintAnother}
              className="btn-m3 btn-m3-accent w-full sm:flex-1 text-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Print Another Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

