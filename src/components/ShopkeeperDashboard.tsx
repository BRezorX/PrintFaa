import React, { useState } from 'react';
import {
  Printer,
  Sliders,
  DollarSign,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Trash2,
  RotateCcw,
  QrCode,
  Layers,
  FileText,
  Plus,
  Save,
  Check,
} from 'lucide-react';
import { PrintJob, ShopPricingConfig, Station, PrinterHardwareStatus } from '../types';
import { ShopkeeperSignage } from './ShopkeeperSignage';

interface ShopkeeperDashboardProps {
  jobs: PrintJob[];
  pricingConfig: ShopPricingConfig;
  onUpdatePricing: (config: ShopPricingConfig) => void;
  stations: Station[];
  activeStation: Station;
  onSelectStation: (station: Station) => void;
  onUpdateJobStatus: (jobId: string, status: PrintJob['status']) => void;
  onSimulateCustomerScan: () => void;
  onReprintJob: (job: PrintJob) => void;
}

export const ShopkeeperDashboard: React.FC<ShopkeeperDashboardProps> = ({
  jobs,
  pricingConfig,
  onUpdatePricing,
  stations,
  activeStation,
  onSelectStation,
  onUpdateJobStatus,
  onSimulateCustomerScan,
  onReprintJob,
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'hardware' | 'pricing' | 'signage'>('queue');
  const [localPricing, setLocalPricing] = useState<ShopPricingConfig>({ ...pricingConfig });
  const [saveToast, setSaveToast] = useState<boolean>(false);
  const [shopName, setShopName] = useState<string>('QuickPrint & Copy Center');

  // Simulated Hardware State
  const [hardware, setHardware] = useState<PrinterHardwareStatus>({
    model: 'Brother HL-L8360CDW Professional Color Laser',
    ip: '192.168.1.142',
    isOnline: true,
    statusText: 'Idle • Ready for incoming jobs',
    paperTrayCount: 420,
    paperTrayCapacity: 500,
    blackTonerPercent: 88,
    cyanTonerPercent: 92,
    magentaTonerPercent: 74,
    yellowTonerPercent: 85,
    totalJobsPrinted: 148,
    isBusy: false,
  });

  // Calculate stats
  const totalRevenue = jobs
    .filter((j) => j.status !== 'draft' && j.status !== 'cancelled')
    .reduce((acc, j) => acc + (j.payment?.amount || j.pricing.total), 0);

  const totalPagesPrinted = jobs
    .filter((j) => j.status !== 'draft' && j.status !== 'cancelled')
    .reduce((acc, j) => acc + j.calculatedPages, 0);

  const pendingCount = jobs.filter((j) => j.status === 'spooling' || j.status === 'printing' || j.status === 'paid').length;
  const readyCount = jobs.filter((j) => j.status === 'ready').length;

  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePricing(localPricing);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleRefillPaper = () => {
    setHardware((prev) => ({
      ...prev,
      paperTrayCount: prev.paperTrayCapacity,
    }));
  };

  const handleTestPrint = () => {
    setHardware((prev) => ({
      ...prev,
      isBusy: true,
      statusText: 'Executing internal test diagnostic page...',
    }));
    setTimeout(() => {
      setHardware((prev) => ({
        ...prev,
        isBusy: false,
        paperTrayCount: Math.max(0, prev.paperTrayCount - 1),
        statusText: 'Idle • Ready for incoming jobs',
      }));
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="m3-card p-5">
          <div className="flex items-center justify-between text-[#79747E] text-xs font-mono-code font-bold uppercase">
            <span>Today's Revenue</span>
            <DollarSign className="w-4 h-4 text-[#006A6A]" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#1C1B1F] font-mono-code mt-2">
            {pricingConfig.currencySymbol}{totalRevenue.toFixed(2)}
          </p>
          <span className="text-[10px] text-[#052020] font-mono-code font-bold bg-[#CCE8E8] px-2 py-0.5 rounded-full mt-2 inline-block">
            +100% Automated
          </span>
        </div>

        <div className="m3-card p-5">
          <div className="flex items-center justify-between text-[#79747E] text-xs font-mono-code font-bold uppercase">
            <span>Pages Printed</span>
            <FileText className="w-4 h-4 text-[#006A6A]" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#1C1B1F] font-mono-code mt-2">
            {totalPagesPrinted}
          </p>
          <span className="text-[10px] text-[#79747E] font-mono-code mt-2 inline-block">
            {jobs.length} Total orders
          </span>
        </div>

        <div className="m3-card p-5">
          <div className="flex items-center justify-between text-[#79747E] text-xs font-mono-code font-bold uppercase">
            <span>In-Flight Jobs</span>
            <Printer className="w-4 h-4 text-[#006A6A]" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#1C1B1F] font-mono-code mt-2">
            {pendingCount}
          </p>
          <span className="text-[10px] text-[#052020] font-mono-code font-bold bg-[#CCE8E8] px-2 py-0.5 rounded-full mt-2 inline-block">
            Auto-spooling
          </span>
        </div>

        <div className="m3-card p-5">
          <div className="flex items-center justify-between text-[#79747E] text-xs font-mono-code font-bold uppercase">
            <span>Ready for Pickup</span>
            <CheckCircle2 className="w-4 h-4 text-[#006A6A]" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#1C1B1F] font-mono-code mt-2">
            {readyCount}
          </p>
          <span className="text-[10px] text-[#052020] font-mono-code font-bold bg-[#CCE8E8] px-2 py-0.5 rounded-full mt-2 inline-block">
            At Output Tray
          </span>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-[#CAC4D0]/50 pb-3 overflow-x-auto">
        <button
          id="shop-tab-queue-btn"
          onClick={() => setActiveTab('queue')}
          className={`btn-m3 text-xs shrink-0 ${
            activeTab === 'queue' ? 'btn-m3-filled' : 'btn-m3-tonal'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Live Print Queue ({jobs.length})</span>
        </button>

        <button
          id="shop-tab-hardware-btn"
          onClick={() => setActiveTab('hardware')}
          className={`btn-m3 text-xs shrink-0 ${
            activeTab === 'hardware' ? 'btn-m3-filled' : 'btn-m3-tonal'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Printer Hardware & Toner</span>
        </button>

        <button
          id="shop-tab-signage-btn"
          onClick={() => setActiveTab('signage')}
          className={`btn-m3 text-xs shrink-0 ${
            activeTab === 'signage' ? 'btn-m3-filled' : 'btn-m3-tonal'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Counter QR Signage</span>
        </button>

        <button
          id="shop-tab-pricing-btn"
          onClick={() => setActiveTab('pricing')}
          className={`btn-m3 text-xs shrink-0 ${
            activeTab === 'pricing' ? 'btn-m3-filled' : 'btn-m3-tonal'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Pricing & Rates</span>
        </button>
      </div>

      {/* Tab 1: Live Print Queue */}
      {activeTab === 'queue' && (
        <div className="m3-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#CAC4D0]/50 bg-[#F7F9FB] flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[#1C1B1F] text-sm sm:text-base">Incoming Automated Print Jobs</h3>
              <p className="text-xs text-[#79747E]">Real-time status of files submitted via customer QR scan</p>
            </div>
            <button
              onClick={onSimulateCustomerScan}
              className="btn-m3 btn-m3-accent text-xs py-1.5 px-3"
            >
              <Plus className="w-3.5 h-3.5" />
              Simulate New QR Order
            </button>
          </div>

          {jobs.length === 0 ? (
            <div className="p-12 text-center text-[#79747E] space-y-3">
              <Printer className="w-10 h-10 text-[#CAC4D0] mx-auto" />
              <p className="text-sm font-medium text-[#1C1B1F]">No print jobs in queue yet</p>
              <p className="text-xs text-[#79747E] max-w-sm mx-auto">
                When customers scan your counter QR code and upload files, their print jobs will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#CAC4D0]/40">
              {jobs.map((j) => {
                return (
                  <div
                    key={j.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#F7F9FB]/80 transition-colors"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-[#CCE8E8] border border-[#CAC4D0] flex items-center justify-center font-mono-code font-bold text-xs text-[#052020] shrink-0">
                        PIN
                        <br />
                        {j.pickupPin.substring(0, 2)}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-code font-bold text-xs text-[#1C1B1F]">
                            #{j.orderNumber}
                          </span>
                          <span className="font-medium text-xs text-[#1C1B1F] truncate max-w-[200px]">
                            {j.file.name}
                          </span>
                          <span
                            className={`text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-full ${
                              j.status === 'printing'
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : j.status === 'ready'
                                ? 'bg-[#CCE8E8] text-[#052020]'
                                : j.status === 'completed'
                                ? 'bg-[#E7E0EB] text-[#79747E]'
                                : 'bg-[#CCE8E8] text-[#052020]'
                            }`}
                          >
                            {j.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>

                        <p className="text-xs text-[#79747E] flex flex-wrap items-center gap-2 font-mono-code">
                          <span>
                            {j.calculatedPages} Pages ({j.sheetsNeeded} Sheets)
                          </span>
                          <span>•</span>
                          <span className="capitalize">{j.settings.colorMode === 'bw' ? 'B&W' : 'Full Color'}</span>
                          <span>•</span>
                          <span className="uppercase">{j.settings.paperSize}</span>
                          <span>•</span>
                          <span>{j.settings.copies}x Copies</span>
                          <span>•</span>
                          <span className="font-bold text-[#006A6A]">
                            {pricingConfig.currencySymbol}{j.pricing.total.toFixed(2)}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {j.status === 'ready' && (
                        <button
                          onClick={() => onUpdateJobStatus(j.id, 'completed')}
                          className="btn-m3 btn-m3-accent text-xs py-1 px-3"
                        >
                          Mark Collected
                        </button>
                      )}

                      <button
                        onClick={() => onReprintJob(j)}
                        className="btn-m3 btn-m3-tonal text-xs py-1 px-2.5 flex items-center gap-1"
                        title="Reprint Job"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reprint</span>
                      </button>

                      {j.status !== 'cancelled' && (
                        <button
                          onClick={() => onUpdateJobStatus(j.id, 'cancelled')}
                          className="p-2 text-[#79747E] hover:text-red-600 rounded-full hover:bg-red-50 cursor-pointer"
                          title="Cancel Job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Hardware & Toner Monitor */}
      {activeTab === 'hardware' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Hardware Status */}
          <div className="m3-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#CAC4D0]/50 pb-3">
              <div>
                <h3 className="font-medium text-[#1C1B1F] text-sm sm:text-base">Printer Hardware Status</h3>
                <p className="text-xs text-[#79747E]">{hardware.model}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono-code font-bold text-[#052020] bg-[#CCE8E8] px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#006A6A]"></span>
                Online
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#CAC4D0]/30">
                <span className="text-[#79747E]">Network IP:</span>
                <span className="font-mono-code font-bold text-[#1C1B1F]">{hardware.ip}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#CAC4D0]/30">
                <span className="text-[#79747E]">Printer State:</span>
                <span className="font-medium text-[#006A6A]">{hardware.statusText}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#CAC4D0]/30">
                <span className="text-[#79747E]">Lifetime Page Count:</span>
                <span className="font-mono-code font-bold text-[#1C1B1F]">14,920 sheets</span>
              </div>
            </div>

            {/* Paper Tray */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-[#1C1B1F]">Paper Tray #1 (A4/Letter)</span>
                <span className="font-mono-code text-[#79747E]">{hardware.paperTrayCount} / {hardware.paperTrayCapacity} sheets</span>
              </div>
              <div className="w-full h-3 bg-[#E7E0EB] rounded-full overflow-hidden p-0.5 border border-[#CAC4D0]">
                <div
                  style={{ width: `${(hardware.paperTrayCount / hardware.paperTrayCapacity) * 100}%` }}
                  className="h-full bg-[#006A6A] rounded-full"
                ></div>
              </div>
              <button
                onClick={handleRefillPaper}
                className="text-xs font-medium text-[#006A6A] hover:underline cursor-pointer pt-1"
              >
                + Refill Paper Tray to 500 Sheets
              </button>
            </div>

            <div className="pt-3 border-t border-[#CAC4D0]/50">
              <button
                disabled={hardware.isBusy}
                onClick={handleTestPrint}
                className="btn-m3 btn-m3-filled w-full text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{hardware.isBusy ? 'Printing Diagnostic...' : 'Print Hardware Test Diagnostic Page'}</span>
              </button>
            </div>
          </div>

          {/* Toner Cartridges */}
          <div className="m3-card p-5 sm:p-6 space-y-4">
            <h3 className="font-medium text-[#1C1B1F] text-sm sm:text-base border-b border-[#CAC4D0]/50 pb-3">
              Toner & Drum Cartridge Levels
            </h3>

            <div className="space-y-3.5">
              {/* Black */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-[#1C1B1F]">
                    <span className="w-3 h-3 rounded bg-[#1C1B1F] inline-block"></span>
                    Black Toner (K)
                  </span>
                  <span className="font-mono-code font-bold">{hardware.blackTonerPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#E7E0EB] rounded-full overflow-hidden">
                  <div style={{ width: `${hardware.blackTonerPercent}%` }} className="h-full bg-[#1C1B1F]"></div>
                </div>
              </div>

              {/* Cyan */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-[#1C1B1F]">
                    <span className="w-3 h-3 rounded bg-cyan-600 inline-block"></span>
                    Cyan Toner (C)
                  </span>
                  <span className="font-mono-code font-bold">{hardware.cyanTonerPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#E7E0EB] rounded-full overflow-hidden">
                  <div style={{ width: `${hardware.cyanTonerPercent}%` }} className="h-full bg-cyan-600"></div>
                </div>
              </div>

              {/* Magenta */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-[#1C1B1F]">
                    <span className="w-3 h-3 rounded bg-pink-600 inline-block"></span>
                    Magenta Toner (M)
                  </span>
                  <span className="font-mono-code font-bold">{hardware.magentaTonerPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#E7E0EB] rounded-full overflow-hidden">
                  <div style={{ width: `${hardware.magentaTonerPercent}%` }} className="h-full bg-pink-600"></div>
                </div>
              </div>

              {/* Yellow */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-[#1C1B1F]">
                    <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span>
                    Yellow Toner (Y)
                  </span>
                  <span className="font-mono-code font-bold">{hardware.yellowTonerPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#E7E0EB] rounded-full overflow-hidden">
                  <div style={{ width: `${hardware.yellowTonerPercent}%` }} className="h-full bg-amber-500"></div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#F7F9FB] rounded-2xl border border-[#CAC4D0] text-[11px] text-[#79747E] font-mono-code">
              Laser fuser temperature: 185°C (Optimal). All mechanical rollers aligned.
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Counter QR Signage */}
      {activeTab === 'signage' && (
        <ShopkeeperSignage
          station={activeStation}
          shopName={shopName}
          onSimulateCustomerScan={onSimulateCustomerScan}
        />
      )}

      {/* Tab 4: Pricing Settings */}
      {activeTab === 'pricing' && (
        <form onSubmit={handleSavePricing} className="m3-card p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#CAC4D0]/50 pb-4">
            <div>
              <h3 className="font-medium text-[#1C1B1F] text-sm sm:text-base">Shopkeeper Rate Card & Fees</h3>
              <p className="text-xs text-[#79747E]">Adjust the prices charged to customers per page and finishing add-ons</p>
            </div>
            {saveToast && (
              <span className="inline-flex items-center gap-1 text-xs font-mono-code font-bold text-[#052020] bg-[#CCE8E8] border border-[#006A6A] px-3 py-1 rounded-full">
                <Check className="w-3.5 h-3.5 text-[#006A6A]" /> Pricing Saved!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono-code font-bold text-[#79747E] uppercase">Shop Name (For Signage)</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full mt-1 px-3.5 py-2 text-xs rounded-xl border border-[#CAC4D0] bg-[#F7F9FB]"
              />
            </div>

            <div>
              <label className="text-xs font-mono-code font-bold text-[#79747E] uppercase">Currency Symbol</label>
              <input
                type="text"
                value={localPricing.currencySymbol}
                onChange={(e) => setLocalPricing({ ...localPricing, currencySymbol: e.target.value })}
                className="w-full mt-1 px-3.5 py-2 text-xs rounded-xl border border-[#CAC4D0] font-mono-code bg-[#F7F9FB]"
              />
            </div>

            <div>
              <label className="text-xs font-mono-code font-bold text-[#79747E] uppercase">B&W Rate Per Page ({localPricing.currencySymbol})</label>
              <input
                type="number"
                step="0.50"
                value={localPricing.bwPageRate}
                onChange={(e) => setLocalPricing({ ...localPricing, bwPageRate: parseFloat(e.target.value) || 2.0 })}
                className="w-full mt-1 px-3.5 py-2 text-xs rounded-xl border border-[#CAC4D0] font-mono-code bg-[#F7F9FB]"
              />
            </div>

            <div>
              <label className="text-xs font-mono-code font-bold text-[#79747E] uppercase">Color Rate Per Page ({localPricing.currencySymbol})</label>
              <input
                type="number"
                step="1.00"
                value={localPricing.colorPageRate}
                onChange={(e) => setLocalPricing({ ...localPricing, colorPageRate: parseFloat(e.target.value) || 10.0 })}
                className="w-full mt-1 px-3.5 py-2 text-xs rounded-xl border border-[#CAC4D0] font-mono-code bg-[#F7F9FB]"
              />
            </div>

            <div>
              <label className="text-xs font-mono-code font-bold text-[#79747E] uppercase">Duplex Discount (% Discount)</label>
              <input
                type="number"
                value={localPricing.duplexDiscountPercent}
                onChange={(e) => setLocalPricing({ ...localPricing, duplexDiscountPercent: parseInt(e.target.value, 10) || 0 })}
                className="w-full mt-1 px-3.5 py-2 text-xs rounded-xl border border-[#CAC4D0] font-mono-code bg-[#F7F9FB]"
              />
            </div>

            <div>
              <label className="text-xs font-mono-code font-bold text-[#79747E] uppercase">Sales Tax / GST (%)</label>
              <input
                type="number"
                value={localPricing.taxRatePercent}
                onChange={(e) => setLocalPricing({ ...localPricing, taxRatePercent: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 px-3.5 py-2 text-xs rounded-xl border border-[#CAC4D0] font-mono-code bg-[#F7F9FB]"
              />
            </div>

            <div>
              <label className="text-xs font-mono-code font-bold text-[#79747E] uppercase">Spiral Binding Fee ({localPricing.currencySymbol})</label>
              <input
                type="number"
                step="1.00"
                value={localPricing.bindingRates.spiral}
                onChange={(e) =>
                  setLocalPricing({
                    ...localPricing,
                    bindingRates: { ...localPricing.bindingRates, spiral: parseFloat(e.target.value) || 0 },
                  })
                }
                className="w-full mt-1 px-3.5 py-2 text-xs rounded-xl border border-[#CAC4D0] font-mono-code bg-[#F7F9FB]"
              />
            </div>

            <div>
              <label className="text-xs font-mono-code font-bold text-[#79747E] uppercase">Lamination Fee Per Page ({localPricing.currencySymbol})</label>
              <input
                type="number"
                step="1.00"
                value={localPricing.bindingRates.laminate}
                onChange={(e) =>
                  setLocalPricing({
                    ...localPricing,
                    bindingRates: { ...localPricing.bindingRates, laminate: parseFloat(e.target.value) || 0 },
                  })
                }
                className="w-full mt-1 px-3.5 py-2 text-xs rounded-xl border border-[#CAC4D0] font-mono-code bg-[#F7F9FB]"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              id="save-pricing-btn"
              type="submit"
              className="btn-m3 btn-m3-accent text-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save & Update Kiosk Pricing</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

