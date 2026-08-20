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
  Building2,
  Store,
  MapPin,
  Phone,
  Mail,
  User,
  Smartphone,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  Volume2,
  VolumeX,
  Sparkles,
  Eye,
  AlertTriangle,
  Settings,
} from 'lucide-react';
import { Shopkeeper, ShopPricingConfig, Station, PrintJob, PrinterHardwareStatus } from '../types';
import { ShopkeeperSignage } from './ShopkeeperSignage';

interface ShopkeeperPageProps {
  shopkeepers: Shopkeeper[];
  activeShopId: string;
  onSelectShopkeeper: (shopId: string) => void;
  onUpdateShopkeeper: (shop: Shopkeeper) => void;
  onAddShopkeeper: (newShop: Shopkeeper) => void;
  onDeleteShopkeeper: (shopId: string) => void;
  jobs: PrintJob[];
  onUpdateJobStatus: (jobId: string, status: PrintJob['status']) => void;
  onReprintJob: (job: PrintJob) => void;
  onSimulateCustomerScan: (shopId: string, stationId: string) => void;
  onSwitchToCustomerKiosk: (shopId: string) => void;
}

export const ShopkeeperPage: React.FC<ShopkeeperPageProps> = ({
  shopkeepers,
  activeShopId,
  onSelectShopkeeper,
  onUpdateShopkeeper,
  onAddShopkeeper,
  onDeleteShopkeeper,
  jobs,
  onUpdateJobStatus,
  onReprintJob,
  onSimulateCustomerScan,
  onSwitchToCustomerKiosk,
}) => {
  const currentShop = shopkeepers.find((s) => s.id === activeShopId) || shopkeepers[0];

  const [activeTab, setActiveTab] = useState<'queue' | 'signage' | 'pricing' | 'hardware' | 'profile'>('queue');
  const [selectedStationId, setSelectedStationId] = useState<string>(currentShop?.stations[0]?.id || 'station-1');
  const [queueFilter, setQueueFilter] = useState<'all' | 'active' | 'ready' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Local state for forms
  const [localPricing, setLocalPricing] = useState<ShopPricingConfig>({ ...currentShop.pricingConfig });
  const [localProfile, setLocalProfile] = useState<{
    name: string;
    tagline: string;
    ownerName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    upiVpa: string;
    autoAcceptJobs: boolean;
    soundAlerts: boolean;
  }>({
    name: currentShop.name,
    tagline: currentShop.tagline || '',
    ownerName: currentShop.ownerName,
    phone: currentShop.phone,
    email: currentShop.email,
    address: currentShop.address,
    city: currentShop.city,
    upiVpa: currentShop.upiVpa || '',
    autoAcceptJobs: currentShop.autoAcceptJobs,
    soundAlerts: currentShop.soundAlerts,
  });

  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isAddShopModalOpen, setIsAddShopModalOpen] = useState<boolean>(false);
  const [isAddStationModalOpen, setIsAddStationModalOpen] = useState<boolean>(false);

  // New Shop Form State
  const [newShopForm, setNewShopForm] = useState({
    name: '',
    tagline: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    upiVpa: '',
    currencySymbol: '$',
    bwPageRate: 0.10,
    colorPageRate: 0.45,
    printerModel: 'Brother HL-L8360CDW Laser (Color & Duplex)',
  });

  // New Station Form State
  const [newStationForm, setNewStationForm] = useState({
    name: '',
    location: '',
    printerModel: currentShop.hardware.model || 'Brother HL-L8360CDW Laser',
  });

  // Sync local form state when active shopkeeper changes
  React.useEffect(() => {
    if (currentShop) {
      setLocalPricing({ ...currentShop.pricingConfig });
      setLocalProfile({
        name: currentShop.name,
        tagline: currentShop.tagline || '',
        ownerName: currentShop.ownerName,
        phone: currentShop.phone,
        email: currentShop.email,
        address: currentShop.address,
        city: currentShop.city,
        upiVpa: currentShop.upiVpa || '',
        autoAcceptJobs: currentShop.autoAcceptJobs,
        soundAlerts: currentShop.soundAlerts,
      });
      if (currentShop.stations.length > 0 && !currentShop.stations.some((s) => s.id === selectedStationId)) {
        setSelectedStationId(currentShop.stations[0].id);
      }
    }
  }, [currentShop?.id]);

  // Filter jobs for THIS shopkeeper only
  const shopJobs = jobs.filter((j) => (j.shopId ? j.shopId === currentShop.id : true));

  // Compute stats for this shopkeeper
  const totalRevenue = shopJobs
    .filter((j) => j.status !== 'draft' && j.status !== 'cancelled')
    .reduce((acc, j) => acc + (j.payment?.amount || j.pricing.total), 0);

  const totalPagesPrinted = shopJobs
    .filter((j) => j.status !== 'draft' && j.status !== 'cancelled')
    .reduce((acc, j) => acc + j.calculatedPages, 0);

  const activeQueueCount = shopJobs.filter(
    (j) => j.status === 'spooling' || j.status === 'printing' || j.status === 'paid'
  ).length;

  const readyCount = shopJobs.filter((j) => j.status === 'ready').length;

  // Filtered queue
  const filteredJobs = shopJobs.filter((j) => {
    if (queueFilter === 'active') {
      if (j.status !== 'spooling' && j.status !== 'printing' && j.status !== 'paid') return false;
    } else if (queueFilter === 'ready') {
      if (j.status !== 'ready') return false;
    } else if (queueFilter === 'completed') {
      if (j.status !== 'completed' && j.status !== 'cancelled') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        j.orderNumber.toLowerCase().includes(q) ||
        j.file.name.toLowerCase().includes(q) ||
        j.pickupPin.includes(q)
      );
    }
    return true;
  });

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Shopkeeper = {
      ...currentShop,
      pricingConfig: { ...localPricing },
    };
    onUpdateShopkeeper(updated);
    showToast('Pricing & rates saved successfully!');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Shopkeeper = {
      ...currentShop,
      name: localProfile.name,
      tagline: localProfile.tagline,
      ownerName: localProfile.ownerName,
      phone: localProfile.phone,
      email: localProfile.email,
      address: localProfile.address,
      city: localProfile.city,
      upiVpa: localProfile.upiVpa,
      autoAcceptJobs: localProfile.autoAcceptJobs,
      soundAlerts: localProfile.soundAlerts,
    };
    onUpdateShopkeeper(updated);
    showToast('Shop profile updated!');
  };

  const handleRefillPaper = () => {
    const updated: Shopkeeper = {
      ...currentShop,
      hardware: {
        ...currentShop.hardware,
        paperTrayCount: currentShop.hardware.paperTrayCapacity,
      },
    };
    onUpdateShopkeeper(updated);
    showToast('Paper tray refilled to 100% capacity!');
  };

  const handleTestDiagnosticPrint = () => {
    const updated: Shopkeeper = {
      ...currentShop,
      hardware: {
        ...currentShop.hardware,
        isBusy: true,
        statusText: 'Executing internal self-test diagnostic printout...',
      },
    };
    onUpdateShopkeeper(updated);
    setTimeout(() => {
      onUpdateShopkeeper({
        ...updated,
        hardware: {
          ...updated.hardware,
          isBusy: false,
          paperTrayCount: Math.max(0, updated.hardware.paperTrayCount - 1),
          statusText: 'Idle • Ready for incoming jobs',
        },
      });
      showToast('Diagnostic test print completed!');
    }, 2000);
  };

  const handleCreateShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopForm.name.trim()) return;

    const newShopId = 'shop-' + Date.now().toString(36);
    const newStationId = 'station-' + Date.now().toString(36).substring(0, 4);

    const createdShop: Shopkeeper = {
      id: newShopId,
      name: newShopForm.name,
      tagline: newShopForm.tagline || 'Fast self-serve printing & scanning',
      ownerName: newShopForm.ownerName || 'Shop Manager',
      phone: newShopForm.phone || '+1 (555) 000-0000',
      email: newShopForm.email || 'manager@printshop.local',
      address: newShopForm.address || 'Counter #1 Main Street',
      city: newShopForm.city || 'Downtown',
      upiVpa: newShopForm.upiVpa || `${newShopForm.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`,
      createdAt: Date.now(),
      autoAcceptJobs: true,
      soundAlerts: true,
      pricingConfig: {
        bwPageRate: Number(newShopForm.bwPageRate) || 0.10,
        colorPageRate: Number(newShopForm.colorPageRate) || 0.45,
        a3Multiplier: 1.8,
        legalMultiplier: 1.2,
        duplexDiscountPercent: 15,
        paperTypes: { standard: 0, thick: 0.15, glossy: 0.35 },
        bindingRates: { none: 0, staple: 0.50, spiral: 2.50, laminate: 1.50 },
        currency: newShopForm.currencySymbol === '₹' ? 'INR' : 'USD',
        currencySymbol: newShopForm.currencySymbol || '$',
        taxRatePercent: 5,
      },
      stations: [
        {
          id: newStationId,
          name: `${newShopForm.name} Counter #1`,
          location: newShopForm.address || 'Main Front Desk',
          printerModel: newShopForm.printerModel,
          isOnline: true,
        },
      ],
      hardware: {
        model: newShopForm.printerModel,
        ip: `192.168.1.${Math.floor(100 + Math.random() * 90)}`,
        isOnline: true,
        statusText: 'Idle • Ready for incoming jobs',
        paperTrayCount: 500,
        paperTrayCapacity: 500,
        blackTonerPercent: 95,
        cyanTonerPercent: 90,
        magentaTonerPercent: 88,
        yellowTonerPercent: 92,
        totalJobsPrinted: 0,
        isBusy: false,
      },
    };

    onAddShopkeeper(createdShop);
    onSelectShopkeeper(createdShop.id);
    setIsAddShopModalOpen(false);
    showToast(`New shop "${createdShop.name}" registered!`);
  };

  const handleAddStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStationForm.name.trim()) return;

    const newStation: Station = {
      id: 'station-' + Date.now().toString(36).substring(0, 5),
      name: newStationForm.name,
      location: newStationForm.location || 'Auxiliary Counter',
      printerModel: newStationForm.printerModel || currentShop.hardware.model,
      isOnline: true,
    };

    const updated: Shopkeeper = {
      ...currentShop,
      stations: [...currentShop.stations, newStation],
    };

    onUpdateShopkeeper(updated);
    setSelectedStationId(newStation.id);
    setIsAddStationModalOpen(false);
    setNewStationForm({ name: '', location: '', printerModel: currentShop.hardware.model });
    showToast(`Added station "${newStation.name}" with its unique QR code!`);
  };

  const activeStation =
    currentShop.stations.find((s) => s.id === selectedStationId) || currentShop.stations[0];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#052020] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#CCE8E8]/40 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-5 h-5 text-[#CCE8E8]" />
          <span className="text-sm font-medium">{saveToast}</span>
        </div>
      )}

      {/* Top Shopkeeper Branch Selector & Management Header */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-[#CAC4D0] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#006A6A] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono-code font-bold uppercase tracking-wider bg-[#CCE8E8] text-[#052020] px-2.5 py-0.5 rounded-md">
                  SHOPKEEPER PORTAL
                </span>
                <span className="text-xs text-[#79747E] font-mono-code">
                  ID: {currentShop.id}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1C1B1F] tracking-tight mt-0.5">
                {currentShop.name}
              </h1>
              <p className="text-xs text-[#79747E] flex items-center gap-2 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{currentShop.address}, {currentShop.city}</span>
                <span>•</span>
                <User className="w-3.5 h-3.5" />
                <span>Owner: {currentShop.ownerName}</span>
              </p>
            </div>
          </div>

          {/* Shop Switcher & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            {/* Switch Shop Dropdown */}
            <div className="relative inline-block">
              <select
                id="shopkeeper-branch-select"
                value={currentShop.id}
                onChange={(e) => onSelectShopkeeper(e.target.value)}
                className="bg-[#F7F9FB] border border-[#CAC4D0] text-[#1C1B1F] text-xs rounded-xl px-3 py-2 pr-8 font-medium cursor-pointer appearance-none hover:border-[#006A6A] focus:outline-none focus:ring-2 focus:ring-[#006A6A]/20"
              >
                {shopkeepers.map((s) => (
                  <option key={s.id} value={s.id}>
                    🏪 {s.name} ({s.city})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#79747E] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Add New Shopkeeper Store */}
            <button
              id="add-new-shopkeeper-btn"
              onClick={() => setIsAddShopModalOpen(true)}
              className="btn-m3 btn-m3-tonal text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register New Shop</span>
            </button>

            {/* Launch Customer Kiosk for this Shop */}
            <button
              id="open-customer-kiosk-for-shop-btn"
              onClick={() => onSwitchToCustomerKiosk(currentShop.id)}
              className="btn-m3 btn-m3-accent text-xs py-2 px-3.5 flex items-center gap-1.5"
              title="Open the customer-facing kiosk connected to this shop"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Open Customer Kiosk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Real-time KPI Metric Cards for Active Shopkeeper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#CAC4D0]/40">
          <div className="bg-[#F7F9FB] p-4 rounded-2xl border border-[#CAC4D0]/60">
            <div className="flex items-center justify-between text-[#79747E] text-[11px] font-mono-code font-bold uppercase">
              <span>Total Revenue</span>
              <DollarSign className="w-3.5 h-3.5 text-[#006A6A]" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-[#1C1B1F] font-mono-code mt-1.5">
              {currentShop.pricingConfig.currencySymbol}{totalRevenue.toFixed(2)}
            </p>
            <span className="text-[10px] text-[#052020] font-mono-code font-semibold bg-[#CCE8E8] px-2 py-0.5 rounded-full mt-1.5 inline-block">
              {shopJobs.length} Orders
            </span>
          </div>

          <div className="bg-[#F7F9FB] p-4 rounded-2xl border border-[#CAC4D0]/60">
            <div className="flex items-center justify-between text-[#79747E] text-[11px] font-mono-code font-bold uppercase">
              <span>Pages Printed</span>
              <FileText className="w-3.5 h-3.5 text-[#006A6A]" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-[#1C1B1F] font-mono-code mt-1.5">
              {totalPagesPrinted}
            </p>
            <span className="text-[10px] text-[#79747E] font-mono-code mt-1.5 inline-block">
              Rate: {currentShop.pricingConfig.currencySymbol}{currentShop.pricingConfig.bwPageRate}/page
            </span>
          </div>

          <div className="bg-[#F7F9FB] p-4 rounded-2xl border border-[#CAC4D0]/60">
            <div className="flex items-center justify-between text-[#79747E] text-[11px] font-mono-code font-bold uppercase">
              <span>Active Queue</span>
              <Printer className="w-3.5 h-3.5 text-[#006A6A]" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-[#1C1B1F] font-mono-code mt-1.5">
              {activeQueueCount}
            </p>
            <span className="text-[10px] text-[#052020] font-mono-code font-semibold bg-[#CCE8E8] px-2 py-0.5 rounded-full mt-1.5 inline-block">
              Auto-Spooling
            </span>
          </div>

          <div className="bg-[#F7F9FB] p-4 rounded-2xl border border-[#CAC4D0]/60">
            <div className="flex items-center justify-between text-[#79747E] text-[11px] font-mono-code font-bold uppercase">
              <span>Ready for Pickup</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#006A6A]" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-[#1C1B1F] font-mono-code mt-1.5">
              {readyCount}
            </p>
            <span className="text-[10px] text-[#052020] font-mono-code font-semibold bg-[#CCE8E8] px-2 py-0.5 rounded-full mt-1.5 inline-block">
              Tray Verified
            </span>
          </div>
        </div>
      </section>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#CAC4D0]/50 pb-2 overflow-x-auto">
        <button
          id="shopkeeper-tab-queue"
          onClick={() => setActiveTab('queue')}
          className={`btn-m3 text-xs shrink-0 ${
            activeTab === 'queue' ? 'btn-m3-filled' : 'btn-m3-tonal'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Print Jobs Queue ({shopJobs.length})</span>
        </button>

        <button
          id="shopkeeper-tab-signage"
          onClick={() => setActiveTab('signage')}
          className={`btn-m3 text-xs shrink-0 ${
            activeTab === 'signage' ? 'btn-m3-filled' : 'btn-m3-tonal'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Counter QR & Standees ({currentShop.stations.length})</span>
        </button>

        <button
          id="shopkeeper-tab-pricing"
          onClick={() => setActiveTab('pricing')}
          className={`btn-m3 text-xs shrink-0 ${
            activeTab === 'pricing' ? 'btn-m3-filled' : 'btn-m3-tonal'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Pricing & Rates ({currentShop.pricingConfig.currencySymbol})</span>
        </button>

        <button
          id="shopkeeper-tab-hardware"
          onClick={() => setActiveTab('hardware')}
          className={`btn-m3 text-xs shrink-0 ${
            activeTab === 'hardware' ? 'btn-m3-filled' : 'btn-m3-tonal'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Hardware & Supplies</span>
        </button>

        <button
          id="shopkeeper-tab-profile"
          onClick={() => setActiveTab('profile')}
          className={`btn-m3 text-xs shrink-0 ${
            activeTab === 'profile' ? 'btn-m3-filled' : 'btn-m3-tonal'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Shop Profile & Settings</span>
        </button>
      </div>

      {/* TAB 1: Live Print Queue */}
      {activeTab === 'queue' && (
        <div className="m3-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#CAC4D0]/50 bg-[#F7F9FB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-medium text-[#1C1B1F] text-base flex items-center gap-2">
                <span>{currentShop.name} — Incoming Print Queue</span>
              </h3>
              <p className="text-xs text-[#79747E]">
                Jobs submitted by customers scanning this shop's counter QR code
              </p>
            </div>

            {/* Filter pills & Search */}
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order #, file, PIN..."
                className="bg-white border border-[#CAC4D0] text-xs rounded-xl px-3 py-1.5 text-[#1C1B1F] focus:outline-none focus:border-[#006A6A] w-full sm:w-44"
              />

              <div className="flex items-center bg-[#E7E0EB] p-0.5 rounded-xl text-xs">
                <button
                  onClick={() => setQueueFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    queueFilter === 'all' ? 'bg-white text-[#1C1B1F] shadow-2xs font-bold' : 'text-[#79747E]'
                  }`}
                >
                  All ({shopJobs.length})
                </button>
                <button
                  onClick={() => setQueueFilter('active')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    queueFilter === 'active' ? 'bg-white text-[#1C1B1F] shadow-2xs font-bold' : 'text-[#79747E]'
                  }`}
                >
                  Active ({activeQueueCount})
                </button>
                <button
                  onClick={() => setQueueFilter('ready')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    queueFilter === 'ready' ? 'bg-white text-[#1C1B1F] shadow-2xs font-bold' : 'text-[#79747E]'
                  }`}
                >
                  Ready ({readyCount})
                </button>
                <button
                  onClick={() => setQueueFilter('completed')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    queueFilter === 'completed' ? 'bg-white text-[#1C1B1F] shadow-2xs font-bold' : 'text-[#79747E]'
                  }`}
                >
                  Done
                </button>
              </div>
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="p-12 text-center text-[#79747E] space-y-3">
              <Printer className="w-10 h-10 text-[#CAC4D0] mx-auto" />
              <p className="text-sm font-medium text-[#1C1B1F]">No print jobs found in this queue</p>
              <p className="text-xs text-[#79747E] max-w-sm mx-auto">
                Customers scanning your counter QR will upload and submit orders directly to this table.
              </p>
              <button
                onClick={() => onSimulateCustomerScan(currentShop.id, activeStation.id)}
                className="btn-m3 btn-m3-tonal text-xs py-2 px-4 inline-flex items-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Simulate Customer Order for this Shop</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#CAC4D0]/40">
              {filteredJobs.map((j) => (
                <div
                  key={j.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#F7F9FB]/80 transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#CCE8E8] border border-[#CAC4D0] flex flex-col items-center justify-center font-mono-code font-bold text-xs text-[#052020] shrink-0">
                      <span className="text-[9px] uppercase tracking-wider text-[#006A6A]">PIN</span>
                      <span className="text-sm leading-tight">{j.pickupPin}</span>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono-code font-bold text-xs text-[#1C1B1F]">
                          #{j.orderNumber}
                        </span>
                        <span className="font-medium text-xs text-[#1C1B1F] truncate max-w-[220px]">
                          {j.file.name}
                        </span>
                        <span
                          className={`text-[10px] font-mono-code font-bold px-2.5 py-0.5 rounded-full ${
                            j.status === 'printing'
                              ? 'bg-amber-100 text-amber-900 animate-pulse'
                              : j.status === 'ready'
                              ? 'bg-[#CCE8E8] text-[#052020]'
                              : j.status === 'completed'
                              ? 'bg-[#E7E0EB] text-[#79747E]'
                              : j.status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-[#CCE8E8] text-[#052020]'
                          }`}
                        >
                          {j.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-[11px] text-[#79747E] font-mono-code">
                          {j.stationName}
                        </span>
                      </div>

                      <p className="text-xs text-[#79747E] flex flex-wrap items-center gap-2 font-mono-code">
                        <span>
                          {j.calculatedPages} Pages ({j.sheetsNeeded} Sheets)
                        </span>
                        <span>•</span>
                        <span className="capitalize">{j.settings.colorMode === 'bw' ? 'B&W' : 'Color'}</span>
                        <span>•</span>
                        <span className="uppercase">{j.settings.paperSize}</span>
                        <span>•</span>
                        <span>{j.settings.copies}x Copies</span>
                        <span>•</span>
                        <span className="font-bold text-[#006A6A]">
                          {currentShop.pricingConfig.currencySymbol}
                          {j.pricing.total.toFixed(2)}
                        </span>
                        {j.payment && (
                          <span className="bg-[#E7E0EB] text-[#1C1B1F] text-[10px] px-2 py-0.5 rounded uppercase font-bold">
                            PAID ({j.payment.method})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {j.status === 'ready' && (
                      <button
                        onClick={() => onUpdateJobStatus(j.id, 'completed')}
                        className="btn-m3 btn-m3-accent text-xs py-1.5 px-3"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Picked Up</span>
                      </button>
                    )}

                    {j.status === 'spooling' && (
                      <button
                        onClick={() => onUpdateJobStatus(j.id, 'printing')}
                        className="btn-m3 btn-m3-filled text-xs py-1.5 px-3"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Release to Printer</span>
                      </button>
                    )}

                    <button
                      onClick={() => onReprintJob(j)}
                      className="btn-m3 btn-m3-tonal text-xs py-1.5 px-2.5 flex items-center gap-1"
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
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Counter QR Standees */}
      {activeTab === 'signage' && (
        <div className="space-y-6">
          {/* Station Selection for this Shop */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-4 rounded-2xl border border-[#CAC4D0]">
            <div>
              <span className="text-xs font-mono-code font-bold text-[#79747E] uppercase tracking-wider block">
                SELECT COUNTER TERMINAL / STATION:
              </span>
              <p className="text-xs text-[#1C1B1F]">
                Each station generates its own distinct QR code linking directly to {currentShop.name}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {currentShop.stations.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStationId(st.id)}
                  className={`btn-m3 text-xs py-1.5 px-3 ${
                    selectedStationId === st.id ? 'btn-m3-filled' : 'btn-m3-tonal'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{st.name}</span>
                </button>
              ))}

              <button
                id="add-new-station-btn"
                onClick={() => setIsAddStationModalOpen(true)}
                className="btn-m3 btn-m3-outlined text-xs py-1.5 px-3 flex items-center gap-1 border-dashed"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Station</span>
              </button>
            </div>
          </div>

          {/* Render Active Station Signage */}
          {activeStation && (
            <ShopkeeperSignage
              station={activeStation}
              shopId={currentShop.id}
              shopName={currentShop.name}
              ownerName={currentShop.ownerName}
              onSimulateCustomerScan={() =>
                onSimulateCustomerScan(currentShop.id, activeStation.id)
              }
            />
          )}
        </div>
      )}

      {/* TAB 3: Pricing & Rates Configuration */}
      {activeTab === 'pricing' && (
        <form onSubmit={handleSavePricing} className="m3-card p-6 space-y-6">
          <div className="border-b border-[#CAC4D0]/50 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-medium text-[#1C1B1F] text-base flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#006A6A]" />
                <span>Custom Print Rates for {currentShop.name}</span>
              </h3>
              <p className="text-xs text-[#79747E]">
                Set your custom profit margins, discounts, and paper rates for customers
              </p>
            </div>
            <button
              id="save-pricing-btn"
              type="submit"
              className="btn-m3 btn-m3-accent text-xs py-2 px-5 flex items-center gap-1.5 self-start sm:self-center"
            >
              <Save className="w-4 h-4" />
              <span>Save Rates</span>
            </button>
          </div>

          {/* Base Page Rates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#F7F9FB] border border-[#CAC4D0]/60 space-y-2">
              <label className="text-xs font-medium text-[#1C1B1F] block">
                B&W Rate / Page ({localPricing.currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={localPricing.bwPageRate}
                onChange={(e) =>
                  setLocalPricing({ ...localPricing, bwPageRate: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-white border border-[#CAC4D0] rounded-xl px-3 py-2 text-sm font-mono-code font-bold text-[#1C1B1F] focus:outline-none focus:border-[#006A6A]"
              />
              <span className="text-[11px] text-[#79747E] block">Standard monochrome document</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F7F9FB] border border-[#CAC4D0]/60 space-y-2">
              <label className="text-xs font-medium text-[#1C1B1F] block">
                Color Rate / Page ({localPricing.currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={localPricing.colorPageRate}
                onChange={(e) =>
                  setLocalPricing({ ...localPricing, colorPageRate: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-white border border-[#CAC4D0] rounded-xl px-3 py-2 text-sm font-mono-code font-bold text-[#1C1B1F] focus:outline-none focus:border-[#006A6A]"
              />
              <span className="text-[11px] text-[#79747E] block">High-resolution laser color</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F7F9FB] border border-[#CAC4D0]/60 space-y-2">
              <label className="text-xs font-medium text-[#1C1B1F] block">
                Duplex Discount (%)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="50"
                value={localPricing.duplexDiscountPercent}
                onChange={(e) =>
                  setLocalPricing({
                    ...localPricing,
                    duplexDiscountPercent: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full bg-white border border-[#CAC4D0] rounded-xl px-3 py-2 text-sm font-mono-code font-bold text-[#1C1B1F] focus:outline-none focus:border-[#006A6A]"
              />
              <span className="text-[11px] text-[#79747E] block">Discount for double-sided sheets</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F7F9FB] border border-[#CAC4D0]/60 space-y-2">
              <label className="text-xs font-medium text-[#1C1B1F] block">
                Sales Tax / GST Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="30"
                value={localPricing.taxRatePercent}
                onChange={(e) =>
                  setLocalPricing({
                    ...localPricing,
                    taxRatePercent: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-white border border-[#CAC4D0] rounded-xl px-3 py-2 text-sm font-mono-code font-bold text-[#1C1B1F] focus:outline-none focus:border-[#006A6A]"
              />
              <span className="text-[11px] text-[#79747E] block">Applied to final receipt</span>
            </div>
          </div>

          {/* Paper Surcharges & Multipliers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div className="p-4 rounded-2xl bg-[#F7F9FB] border border-[#CAC4D0]/60 space-y-3">
              <h4 className="font-mono-code font-bold text-xs text-[#79747E] uppercase">
                Paper Type Surcharges / Sheet
              </h4>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[#79747E] block mb-1">Standard (75gsm)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={localPricing.paperTypes.standard}
                    onChange={(e) =>
                      setLocalPricing({
                        ...localPricing,
                        paperTypes: {
                          ...localPricing.paperTypes,
                          standard: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-white border border-[#CAC4D0] rounded-lg p-2 font-mono-code"
                  />
                </div>
                <div>
                  <span className="text-[#79747E] block mb-1">Thick (100gsm)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={localPricing.paperTypes.thick}
                    onChange={(e) =>
                      setLocalPricing({
                        ...localPricing,
                        paperTypes: {
                          ...localPricing.paperTypes,
                          thick: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-white border border-[#CAC4D0] rounded-lg p-2 font-mono-code"
                  />
                </div>
                <div>
                  <span className="text-[#79747E] block mb-1">Glossy Photo</span>
                  <input
                    type="number"
                    step="0.01"
                    value={localPricing.paperTypes.glossy}
                    onChange={(e) =>
                      setLocalPricing({
                        ...localPricing,
                        paperTypes: {
                          ...localPricing.paperTypes,
                          glossy: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-white border border-[#CAC4D0] rounded-lg p-2 font-mono-code"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F7F9FB] border border-[#CAC4D0]/60 space-y-3">
              <h4 className="font-mono-code font-bold text-xs text-[#79747E] uppercase">
                Binding & Finishing Rates
              </h4>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[#79747E] block mb-1">Corner Staple</span>
                  <input
                    type="number"
                    step="0.01"
                    value={localPricing.bindingRates.staple}
                    onChange={(e) =>
                      setLocalPricing({
                        ...localPricing,
                        bindingRates: {
                          ...localPricing.bindingRates,
                          staple: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-white border border-[#CAC4D0] rounded-lg p-2 font-mono-code"
                  />
                </div>
                <div>
                  <span className="text-[#79747E] block mb-1">Spiral Comb</span>
                  <input
                    type="number"
                    step="0.01"
                    value={localPricing.bindingRates.spiral}
                    onChange={(e) =>
                      setLocalPricing({
                        ...localPricing,
                        bindingRates: {
                          ...localPricing.bindingRates,
                          spiral: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-white border border-[#CAC4D0] rounded-lg p-2 font-mono-code"
                  />
                </div>
                <div>
                  <span className="text-[#79747E] block mb-1">Heat Laminate</span>
                  <input
                    type="number"
                    step="0.01"
                    value={localPricing.bindingRates.laminate}
                    onChange={(e) =>
                      setLocalPricing({
                        ...localPricing,
                        bindingRates: {
                          ...localPricing.bindingRates,
                          laminate: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-white border border-[#CAC4D0] rounded-lg p-2 font-mono-code"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="btn-m3 btn-m3-accent text-xs py-2 px-6 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Rates for {currentShop.name}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: Hardware & Supplies */}
      {activeTab === 'hardware' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="m3-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#CAC4D0]/50 pb-3">
              <div>
                <h3 className="font-medium text-[#1C1B1F] text-base">Printer Hardware Status</h3>
                <p className="text-xs text-[#79747E]">{currentShop.hardware.model}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono-code font-bold text-[#052020] bg-[#CCE8E8] px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#006A6A]"></span>
                Online
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#CAC4D0]/30">
                <span className="text-[#79747E]">Network IP Address:</span>
                <span className="font-mono-code font-bold text-[#1C1B1F]">{currentShop.hardware.ip}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#CAC4D0]/30">
                <span className="text-[#79747E]">Printer Status:</span>
                <span className="font-medium text-[#006A6A]">{currentShop.hardware.statusText}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#CAC4D0]/30">
                <span className="text-[#79747E]">Total Lifetime Impressions:</span>
                <span className="font-mono-code font-bold text-[#1C1B1F]">
                  {currentShop.hardware.totalJobsPrinted} pages
                </span>
              </div>
            </div>

            {/* Paper Tray */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#1C1B1F]">Main Paper Tray Capacity (A4/Letter)</span>
                <span className="font-mono-code font-bold text-[#006A6A]">
                  {currentShop.hardware.paperTrayCount} / {currentShop.hardware.paperTrayCapacity} sheets
                </span>
              </div>
              <div className="w-full h-3 bg-[#E7E0EB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#006A6A] transition-all duration-500 rounded-full"
                  style={{
                    width: `${(currentShop.hardware.paperTrayCount / currentShop.hardware.paperTrayCapacity) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                onClick={handleRefillPaper}
                className="btn-m3 btn-m3-tonal text-xs py-2 flex-1 flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refill 500 Sheets</span>
              </button>
              <button
                onClick={handleTestDiagnosticPrint}
                className="btn-m3 btn-m3-outlined text-xs py-2 flex-1 flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Test Printout</span>
              </button>
            </div>
          </div>

          {/* Toner Cartridges */}
          <div className="m3-card p-6 space-y-4">
            <div className="border-b border-[#CAC4D0]/50 pb-3">
              <h3 className="font-medium text-[#1C1B1F] text-base">Laser Toner Cartridge Levels</h3>
              <p className="text-xs text-[#79747E]">CMYK High-yield drum & toner sensors</p>
            </div>

            <div className="space-y-4 pt-1">
              {/* Black */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-[#1C1B1F]">Key Black (K)</span>
                  <span className="font-mono-code font-bold">{currentShop.hardware.blackTonerPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#E7E0EB] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1C1B1F] rounded-full"
                    style={{ width: `${currentShop.hardware.blackTonerPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Cyan */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-[#1C1B1F]">Cyan (C)</span>
                  <span className="font-mono-code font-bold">{currentShop.hardware.cyanTonerPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#E7E0EB] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${currentShop.hardware.cyanTonerPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Magenta */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-[#1C1B1F]">Magenta (M)</span>
                  <span className="font-mono-code font-bold">{currentShop.hardware.magentaTonerPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#E7E0EB] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-500 rounded-full"
                    style={{ width: `${currentShop.hardware.magentaTonerPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Yellow */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-[#1C1B1F]">Yellow (Y)</span>
                  <span className="font-mono-code font-bold">{currentShop.hardware.yellowTonerPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#E7E0EB] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: `${currentShop.hardware.yellowTonerPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                onClick={() => {
                  onUpdateShopkeeper({
                    ...currentShop,
                    hardware: {
                      ...currentShop.hardware,
                      blackTonerPercent: 100,
                      cyanTonerPercent: 100,
                      magentaTonerPercent: 100,
                      yellowTonerPercent: 100,
                    },
                  });
                  showToast('Toner levels reset to 100% full!');
                }}
                className="btn-m3 btn-m3-tonal text-xs py-2 w-full flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Replace CMYK Toners (Reset to 100%)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Shop Profile & Settings */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="m3-card p-6 space-y-6">
          <div className="border-b border-[#CAC4D0]/50 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-medium text-[#1C1B1F] text-base flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#006A6A]" />
                <span>Shop Profile & Business Information</span>
              </h3>
              <p className="text-xs text-[#79747E]">
                Update store branding, contact details, and automated release policies
              </p>
            </div>
            <button
              type="submit"
              className="btn-m3 btn-m3-accent text-xs py-2 px-5 flex items-center gap-1.5 self-start sm:self-center"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-[#1C1B1F]">Shop / Business Name</label>
              <input
                type="text"
                value={localProfile.name}
                onChange={(e) => setLocalProfile({ ...localProfile, name: e.target.value })}
                className="w-full bg-white border border-[#CAC4D0] rounded-xl p-2.5 font-medium text-[#1C1B1F] focus:outline-none focus:border-[#006A6A]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#1C1B1F]">Tagline / Subtitle</label>
              <input
                type="text"
                value={localProfile.tagline}
                onChange={(e) => setLocalProfile({ ...localProfile, tagline: e.target.value })}
                className="w-full bg-white border border-[#CAC4D0] rounded-xl p-2.5 text-[#1C1B1F] focus:outline-none focus:border-[#006A6A]"
                placeholder="e.g. High-speed color copies & thesis binding"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#1C1B1F]">Owner / Manager Name</label>
              <input
                type="text"
                value={localProfile.ownerName}
                onChange={(e) => setLocalProfile({ ...localProfile, ownerName: e.target.value })}
                className="w-full bg-white border border-[#CAC4D0] rounded-xl p-2.5 text-[#1C1B1F] focus:outline-none focus:border-[#006A6A]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#1C1B1F]">Contact Phone</label>
              <input
                type="text"
                value={localProfile.phone}
                onChange={(e) => setLocalProfile({ ...localProfile, phone: e.target.value })}
                className="w-full bg-white border border-[#CAC4D0] rounded-xl p-2.5 font-mono-code text-[#1C1B1F] focus:outline-none focus:border-[#006A6A]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#1C1B1F]">Contact Email</label>
              <input
                type="email"
                value={localProfile.email}
                onChange={(e) => setLocalProfile({ ...localProfile, email: e.target.value })}
                className="w-full bg-white border border-[#CAC4D0] rounded-xl p-2.5 text-[#1C1B1F] focus:outline-none focus:border-[#006A6A]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#1C1B1F]">UPI ID / Payment VPA (for direct QR scan payment)</label>
              <input
                type="text"
                value={localProfile.upiVpa}
                onChange={(e) => setLocalProfile({ ...localProfile, upiVpa: e.target.value })}
                className="w-full bg-white border border-[#CAC4D0] rounded-xl p-2.5 font-mono-code text-[#1C1B1F] focus:outline-none focus:border-[#006A6A]"
                placeholder="e.g. shopname@upi"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#1C1B1F]">Street Address</label>
              <input
                type="text"
                value={localProfile.address}
                onChange={(e) => setLocalProfile({ ...localProfile, address: e.target.value })}
                className="w-full bg-white border border-[#CAC4D0] rounded-xl p-2.5 text-[#1C1B1F] focus:outline-none focus:border-[#006A6A]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#1C1B1F]">City & Postal Code</label>
              <input
                type="text"
                value={localProfile.city}
                onChange={(e) => setLocalProfile({ ...localProfile, city: e.target.value })}
                className="w-full bg-white border border-[#CAC4D0] rounded-xl p-2.5 text-[#1C1B1F] focus:outline-none focus:border-[#006A6A]"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F9FB] border border-[#CAC4D0]/60 space-y-3">
            <h4 className="font-mono-code font-bold text-xs text-[#79747E] uppercase">
              Automated Job Processing
            </h4>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localProfile.autoAcceptJobs}
                onChange={(e) =>
                  setLocalProfile({ ...localProfile, autoAcceptJobs: e.target.checked })
                }
                className="w-4 h-4 text-[#006A6A] rounded accent-[#006A6A]"
              />
              <div>
                <span className="text-xs font-medium text-[#1C1B1F] block">
                  Auto-release paid prints to physical printer
                </span>
                <span className="text-[11px] text-[#79747E] block">
                  Automatically initiates print spooling as soon as payment is confirmed
                </span>
              </div>
            </label>
          </div>

          {/* Delete Shopkeeper profile button (guard if only 1 shop) */}
          {shopkeepers.length > 1 && (
            <div className="pt-4 border-t border-[#CAC4D0]/40 flex justify-between items-center">
              <div>
                <span className="text-xs font-medium text-red-600 block">Delete this Shop</span>
                <span className="text-[11px] text-[#79747E]">
                  Permanently remove this shopkeeper profile from local storage
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${currentShop.name}?`)) {
                    onDeleteShopkeeper(currentShop.id);
                  }
                }}
                className="btn-m3 text-xs py-2 px-3 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Shop</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* MODAL: Register New Shopkeeper Store */}
      {isAddShopModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1B1F]/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] max-w-lg w-full overflow-hidden shadow-2xl border border-[#CAC4D0] flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-[#CAC4D0]/50 bg-[#F7F9FB] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#CCE8E8] text-[#006A6A] rounded-xl">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-normal text-lg text-[#1C1B1F]">Register New Shopkeeper Store</h3>
                  <p className="text-xs text-[#79747E]">Create a distinct shop with its own QR and data</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddShopModalOpen(false)}
                className="p-1.5 text-[#79747E] hover:text-[#1C1B1F] rounded-full hover:bg-[#E7E0EB]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateShop} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-[#1C1B1F]">Shop Name *</label>
                <input
                  type="text"
                  value={newShopForm.name}
                  onChange={(e) => setNewShopForm({ ...newShopForm, name: e.target.value })}
                  placeholder="e.g. SpeedPrint & Stationery Hub"
                  className="w-full bg-white border border-[#CAC4D0] rounded-xl p-2.5 text-xs text-[#1C1B1F] focus:outline-none focus:border-[#006A6A]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-[#1C1B1F]">Owner / Manager Name *</label>
                <input
                  type="text"
                  value={newShopForm.ownerName}
                  onChange={(e) => setNewShopForm({ ...newShopForm, ownerName: e.target.value })}
                  placeholder="e.g. Alex Henderson"
                  className="w-full bg-white border border-[#CAC4D0] rounded-xl p-2.5 text-xs text-[#1C1B1F] focus:outline-none focus:border-[#006A6A]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-medium text-[#1C1B1F]">Currency</label>
                  <select
                    value={newShopForm.currencySymbol}
                    onChange={(e) => setNewShopForm({ ...newShopForm, currencySymbol: e.target.value })}
                    className="w-full bg-white border border-[#CAC4D0] rounded-xl p-2.5 text-xs text-[#1C1B1F]"
                  >
                    <option value="₹">₹ (INR - Indian Rupee)</option>
                    <option value="$">$ (USD - US Dollar)</option>
                    <option value="€">€ (EUR - Euro)</option>
                    <option value="£">£ (GBP - British Pound)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-[#1C1B1F]">B&W Base Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newShopForm.bwPageRate}
                    onChange={(e) => setNewShopForm({ ...newShopForm, bwPageRate: parseFloat(e.target.value) || 0.10 })}
                    className="w-full bg-white border border-[#CAC4D0] rounded-xl p-2.5 font-mono-code"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-[#1C1B1F]">Street Address & Location</label>
                <input
                  type="text"
                  value={newShopForm.address}
                  onChange={(e) => setNewShopForm({ ...newShopForm, address: e.target.value })}
                  placeholder="e.g. 15 Tech Park Plaza, Gate 2"
                  className="w-full bg-white border border-[#CAC4D0] rounded-xl p-2.5 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-[#1C1B1F]">Printer Hardware Model</label>
                <input
                  type="text"
                  value={newShopForm.printerModel}
                  onChange={(e) => setNewShopForm({ ...newShopForm, printerModel: e.target.value })}
                  className="w-full bg-white border border-[#CAC4D0] rounded-xl p-2.5 text-xs font-mono-code"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#CAC4D0]/50">
                <button
                  type="button"
                  onClick={() => setIsAddShopModalOpen(false)}
                  className="btn-m3 btn-m3-tonal text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-m3 btn-m3-accent text-xs py-2 px-5 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Shopkeeper Store</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add New Station for this Shop */}
      {isAddStationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1B1F]/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] max-w-md w-full overflow-hidden shadow-2xl border border-[#CAC4D0] flex flex-col">
            <div className="p-5 border-b border-[#CAC4D0]/50 bg-[#F7F9FB] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#CCE8E8] text-[#006A6A] rounded-xl">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-normal text-base text-[#1C1B1F]">Add Terminal / Station</h3>
                  <p className="text-xs text-[#79747E]">Adds a new counter kiosk with its own QR code</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddStationModalOpen(false)}
                className="p-1.5 text-[#79747E] hover:text-[#1C1B1F] rounded-full hover:bg-[#E7E0EB]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStation} className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-[#1C1B1F]">Station Name *</label>
                <input
                  type="text"
                  value={newStationForm.name}
                  onChange={(e) => setNewStationForm({ ...newStationForm, name: e.target.value })}
                  placeholder="e.g. Counter Desk #3 (Express Color)"
                  className="w-full bg-white border border-[#CAC4D0] rounded-xl p-2.5 text-xs text-[#1C1B1F]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-[#1C1B1F]">Physical Location</label>
                <input
                  type="text"
                  value={newStationForm.location}
                  onChange={(e) => setNewStationForm({ ...newStationForm, location: e.target.value })}
                  placeholder="e.g. North Entry Booth"
                  className="w-full bg-white border border-[#CAC4D0] rounded-xl p-2.5 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-[#1C1B1F]">Printer Model</label>
                <input
                  type="text"
                  value={newStationForm.printerModel}
                  onChange={(e) => setNewStationForm({ ...newStationForm, printerModel: e.target.value })}
                  className="w-full bg-white border border-[#CAC4D0] rounded-xl p-2.5 text-xs font-mono-code"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#CAC4D0]/50">
                <button
                  type="button"
                  onClick={() => setIsAddStationModalOpen(false)}
                  className="btn-m3 btn-m3-tonal text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-m3 btn-m3-accent text-xs py-2 px-5 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Station & Generate QR</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
