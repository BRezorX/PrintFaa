import React, { useState, useEffect } from 'react';
import {
  DEFAULT_PRINT_SETTINGS,
} from './utils/sampleData';
import { calculateJobCost } from './utils/priceCalculator';
import {
  Station,
  UploadedFile,
  PrintSettings,
  PrintJob,
  Shopkeeper,
} from './types';
import {
  loadShopkeepersFromStorage,
  saveShopkeepersToStorage,
  loadActiveShopId,
  saveActiveShopId,
  loadJobsFromStorage,
  saveJobsToStorage,
} from './utils/shopStore';
import { Header } from './components/Header';
import { QRScannerModal } from './components/QRScannerModal';
import { FileUploader } from './components/FileUploader';
import { DocumentViewer } from './components/DocumentViewer';
import { PrintConfigurator } from './components/PrintConfigurator';
import { PaymentModal } from './components/PaymentModal';
import { PrintJobTracker } from './components/PrintJobTracker';
import { ShopkeeperPage } from './components/ShopkeeperPage';
import { QrCode, Store, Smartphone, ArrowRight, Radio } from 'lucide-react';

export default function App() {
  // Multi-Shopkeeper State
  const [shopkeepers, setShopkeepers] = useState<Shopkeeper[]>(() => loadShopkeepersFromStorage());
  const [activeShopId, setActiveShopId] = useState<string>(() => loadActiveShopId());

  const activeShop =
    shopkeepers.find((s) => s.id === activeShopId) || shopkeepers[0];

  const [currentView, setCurrentView] = useState<'customer' | 'shopkeeper'>('customer');
  const [activeStationId, setActiveStationId] = useState<string>(
    activeShop?.stations[0]?.id || 'station-1'
  );

  const activeStation: Station =
    activeShop?.stations.find((st) => st.id === activeStationId) ||
    activeShop?.stations[0] || {
      id: 'station-1',
      name: 'Counter Kiosk #1',
      location: 'Main Desk',
      printerModel: 'LaserJet Color',
      isOnline: true,
    };

  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Active Customer Session State
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [printSettings, setPrintSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [activeJob, setActiveJob] = useState<PrintJob | null>(null);

  // Global Print Jobs Queue (persisted)
  const [jobs, setJobs] = useState<PrintJob[]>(() => loadJobsFromStorage());

  // Save shopkeepers to storage on update
  useEffect(() => {
    saveShopkeepersToStorage(shopkeepers);
  }, [shopkeepers]);

  // Save active shop ID to storage
  useEffect(() => {
    saveActiveShopId(activeShopId);
  }, [activeShopId]);

  // Save jobs to storage on update
  useEffect(() => {
    saveJobsToStorage(jobs);
  }, [jobs]);

  // Deep Link URL Detection for Page, Shop, and Station
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get('page');
      const shopParam = params.get('shop');
      const stationParam = params.get('station');

      if (pageParam === 'shopkeeper' || pageParam === 'customer') {
        setCurrentView(pageParam);
      }

      if (shopParam) {
        const foundShop = shopkeepers.find((s) => s.id === shopParam);
        if (foundShop) {
          setActiveShopId(foundShop.id);
          if (stationParam) {
            const foundStation = foundShop.stations.find((st) => st.id === stationParam);
            if (foundStation) {
              setActiveStationId(foundStation.id);
            }
          }
        }
      } else if (stationParam) {
        // Search across all shopkeepers for station
        for (const shop of shopkeepers) {
          const foundStation = shop.stations.find((st) => st.id === stationParam);
          if (foundStation) {
            setActiveShopId(shop.id);
            setActiveStationId(foundStation.id);
            break;
          }
        }
      }
    } catch {
      // Ignore URL parse issues
    }
  }, []);

  // Sync active station when active shop changes
  useEffect(() => {
    if (activeShop && !activeShop.stations.some((st) => st.id === activeStationId)) {
      if (activeShop.stations.length > 0) {
        setActiveStationId(activeShop.stations[0].id);
      }
    }
  }, [activeShopId]);

  // Navigation and URL helper
  const handleViewChange = (view: 'customer' | 'shopkeeper') => {
    setCurrentView(view);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('page', view);
      if (activeShop) {
        url.searchParams.set('shop', activeShop.id);
      }
      if (activeStation) {
        url.searchParams.set('station', activeStation.id);
      }
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore URL history errors
    }
  };

  // Build the current draft job object for payment using active shop's pricing
  const currentCost = uploadedFile
    ? calculateJobCost(printSettings, uploadedFile.pageCount, activeShop.pricingConfig)
    : null;

  const currentDraftJob: PrintJob | null = uploadedFile && currentCost
    ? {
        id: 'job-' + Date.now(),
        orderNumber: Math.floor(1000 + Math.random() * 9000).toString(),
        shopId: activeShop.id,
        shopName: activeShop.name,
        stationId: activeStation.id,
        stationName: activeStation.name,
        file: uploadedFile,
        settings: printSettings,
        calculatedPages: currentCost.calculatedPages,
        sheetsNeeded: currentCost.sheetsNeeded,
        pricing: currentCost.pricing,
        status: 'pending_payment',
        printProgress: 0,
        createdAt: Date.now(),
        pickupPin: Math.floor(1000 + Math.random() * 9000).toString(),
      }
    : null;

  const handleProceedToPayment = () => {
    if (!uploadedFile || !currentDraftJob) return;
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = (paymentInfo: {
    method: 'upi' | 'card' | 'wallet' | 'cash';
    transactionId: string;
    paidAt: number;
    amount: number;
  }) => {
    if (!currentDraftJob) return;

    const paidJob: PrintJob = {
      ...currentDraftJob,
      payment: paymentInfo,
      status: 'spooling',
      printProgress: 10,
    };

    setIsPaymentOpen(false);
    setActiveJob(paidJob);

    // Add to global shopkeeper queue
    setJobs((prev) => [paidJob, ...prev]);
  };

  const handleUpdateJobProgress = (jobId: string, progress: number, status: PrintJob['status']) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, printProgress: progress, status } : j))
    );
  };

  const handleUpdateJobStatus = (jobId: string, status: PrintJob['status']) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status } : j))
    );
  };

  const handleReprintJob = (job: PrintJob) => {
    const reprint: PrintJob = {
      ...job,
      id: 'job-' + Date.now(),
      orderNumber: Math.floor(1000 + Math.random() * 9000).toString(),
      status: 'spooling',
      printProgress: 0,
      createdAt: Date.now(),
      pickupPin: Math.floor(1000 + Math.random() * 9000).toString(),
    };
    setJobs((prev) => [reprint, ...prev]);
  };

  const handleResetForAnotherPrint = () => {
    setActiveJob(null);
    setUploadedFile(null);
    setPrintSettings(DEFAULT_PRINT_SETTINGS);
  };

  // Shopkeeper management actions
  const handleUpdateShopkeeper = (updated: Shopkeeper) => {
    setShopkeepers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleAddShopkeeper = (newShop: Shopkeeper) => {
    setShopkeepers((prev) => [...prev, newShop]);
  };

  const handleDeleteShopkeeper = (shopId: string) => {
    if (shopkeepers.length <= 1) return;
    const remaining = shopkeepers.filter((s) => s.id !== shopId);
    setShopkeepers(remaining);
    setActiveShopId(remaining[0].id);
  };

  const handleStationSelectedFromModal = (station: Station, shopId?: string) => {
    if (shopId) {
      setActiveShopId(shopId);
    }
    setActiveStationId(station.id);
  };

  const handleSimulateCustomerScan = (shopId: string, stationId: string) => {
    setActiveShopId(shopId);
    setActiveStationId(stationId);
    handleViewChange('customer');
    setUploadedFile(null);
    setActiveJob(null);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] text-[#1C1B1F] flex flex-col selection:bg-[#CCE8E8] selection:text-[#052020]">
      {/* Top Navigation Header */}
      <Header
        currentView={currentView}
        onViewChange={handleViewChange}
        activeShop={activeShop}
        activeStation={activeStation}
        onOpenScanner={() => setIsScannerOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        pendingJobsCount={jobs.filter((j) => (j.shopId ? j.shopId === activeShop.id : true) && (j.status === 'spooling' || j.status === 'printing')).length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentView === 'customer' ? (
          <div className="space-y-6">
            {/* If there is an active job currently printing or ready, show the Live Tracker */}
            {activeJob ? (
              <PrintJobTracker
                job={activeJob}
                pricingConfig={activeShop.pricingConfig}
                soundEnabled={soundEnabled}
                onPrintAnother={handleResetForAnotherPrint}
                onUpdateProgress={handleUpdateJobProgress}
              />
            ) : (
              <>
                {/* Material 3 Hero Banner for Customer */}
                <section className="m3-hero p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-code text-[11px] uppercase tracking-widest bg-[#052020] text-[#CCE8E8] px-2.5 py-0.5 rounded-full font-bold">
                        {activeShop.name}
                      </span>
                      <span className="font-mono-code text-xs text-[#052020]/70 font-semibold">
                        • {activeStation.id.toUpperCase()}
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-[#052020] mt-1">
                      {activeStation.name}
                    </h1>
                    <p className="text-xs sm:text-sm text-[#052020]/80">
                      {activeStation.location} • {activeStation.printerModel} • Rates from{' '}
                      <span className="font-bold">
                        {activeShop.pricingConfig.currencySymbol}
                        {activeShop.pricingConfig.bwPageRate.toFixed(2)}/page
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      id="banner-scan-qr-btn"
                      onClick={() => setIsScannerOpen(true)}
                      className="btn-m3 btn-m3-filled text-xs h-10 px-4 cursor-pointer shadow-xs"
                      title="Scan another shopkeeper QR code"
                    >
                      <QrCode className="w-4 h-4 text-[#CCE8E8]" />
                      <span>Scan Standee QR</span>
                    </button>
                  </div>
                </section>

                {/* Step 1: File Uploader */}
                <FileUploader
                  currentFile={uploadedFile}
                  onFileSelect={(file) => setUploadedFile(file)}
                  onClearFile={() => setUploadedFile(null)}
                />

                {/* Step 2 & 3: If file is uploaded, show Live Preview & Print Settings */}
                {uploadedFile && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Live Document Proof Viewer (5 cols) */}
                    <div className="lg:col-span-5 space-y-4">
                      <DocumentViewer file={uploadedFile} settings={printSettings} />
                    </div>

                    {/* Right Column: Print Options & Price Configurator (7 cols) */}
                    <div className="lg:col-span-7">
                      <PrintConfigurator
                        file={uploadedFile}
                        settings={printSettings}
                        pricingConfig={activeShop.pricingConfig}
                        onSettingsChange={setPrintSettings}
                        onFileUpdate={setUploadedFile}
                        onProceedToPayment={handleProceedToPayment}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* Dedicated Shopkeeper Portal Page (Multi-Shop Support) */
          <ShopkeeperPage
            shopkeepers={shopkeepers}
            activeShopId={activeShopId}
            onSelectShopkeeper={(id) => setActiveShopId(id)}
            onUpdateShopkeeper={handleUpdateShopkeeper}
            onAddShopkeeper={handleAddShopkeeper}
            onDeleteShopkeeper={handleDeleteShopkeeper}
            jobs={jobs}
            onUpdateJobStatus={handleUpdateJobStatus}
            onReprintJob={handleReprintJob}
            onSimulateCustomerScan={handleSimulateCustomerScan}
            onSwitchToCustomerKiosk={(shopId) => {
              setActiveShopId(shopId);
              handleViewChange('customer');
            }}
          />
        )}
      </main>

      {/* Material 3 Footer */}
      <footer className="bg-white border-t border-[rgba(28,27,31,0.12)] px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#79747E] mt-auto">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-[#1C1B1F]">PRINTSPOT AUTOMATED KIOSK SYSTEM</span>
          <span>•</span>
          <span>{activeShop.name}</span>
          <span>•</span>
          <span className="font-mono-code">{activeStation.name}</span>
        </div>
        <div className="font-mono-code text-[11px]">
          SHOP: {activeShop.id.toUpperCase()} // TERMINAL: {activeStation.id.toUpperCase()}
        </div>
      </footer>

      {/* QR Scanner Modal (with Shop & Station support) */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onStationSelected={handleStationSelectedFromModal}
        stations={activeShop.stations}
        shopkeepers={shopkeepers}
      />

      {/* Payment & Checkout Modal */}
      {currentDraftJob && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          job={currentDraftJob}
          pricingConfig={activeShop.pricingConfig}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
