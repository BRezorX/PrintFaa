import React from 'react';
import { Printer, QrCode, Store, Volume2, VolumeX, Radio, ChevronRight, Smartphone } from 'lucide-react';
import { Station, Shopkeeper } from '../types';

interface HeaderProps {
  currentView: 'customer' | 'shopkeeper';
  onViewChange: (view: 'customer' | 'shopkeeper') => void;
  activeShop: Shopkeeper;
  activeStation: Station;
  onOpenScanner: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  pendingJobsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  activeShop,
  activeStation,
  onOpenScanner,
  soundEnabled,
  onToggleSound,
  pendingJobsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white px-4 sm:px-6 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.1)] border-b border-[#CAC4D0]/40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo & Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#006A6A] flex items-center justify-center text-white shadow-xs">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="font-brand font-bold text-xl tracking-tight text-[#1C1B1F]">
                PrintSpot
              </span>
              <span className="text-[10px] font-mono-code font-bold uppercase tracking-widest bg-[#CCE8E8] text-[#052020] px-2 py-0.5 rounded">
                {currentView === 'customer' ? 'Self-Serve Kiosk' : 'Shopkeeper Portal'}
              </span>
            </div>
            {currentView === 'customer' && (
              <p className="text-[11px] text-[#79747E] truncate max-w-[240px] sm:max-w-none">
                Connected to: <span className="font-medium text-[#1C1B1F]">{activeShop.name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-2">
          {/* Station Selector pill in Customer Mode */}
          {currentView === 'customer' && (
            <button
              id="header-change-station-btn"
              onClick={onOpenScanner}
              className="btn-m3 btn-m3-outlined text-xs h-9 px-3 hidden sm:inline-flex"
              title="Switch Kiosk Station or Scan Shop QR"
            >
              <Radio className="w-3.5 h-3.5 text-[#006A6A] animate-pulse" />
              <span className="font-medium truncate max-w-[140px]">
                {activeStation.name.split(' ')[0]} {activeStation.id.replace('station-', '#')}
              </span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            id="toggle-sound-btn"
            onClick={onToggleSound}
            className="btn-m3 btn-m3-outlined text-xs h-9 px-3"
            title={soundEnabled ? 'Mute audio alerts' : 'Enable audio alerts'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-[#79747E]" />}
            <span className="hidden md:inline">{soundEnabled ? 'Sound ON' : 'Muted'}</span>
          </button>

          {/* Scan QR Button for Customer */}
          {currentView === 'customer' && (
            <button
              id="header-scan-qr-btn"
              onClick={onOpenScanner}
              className="btn-m3 btn-m3-filled text-xs h-9 px-3.5"
            >
              <QrCode className="w-4 h-4 text-[#CCE8E8]" />
              <span>Scan QR</span>
            </button>
          )}

          {/* Shopkeeper Mode: Option to switch to Customer Kiosk preview */}
          {currentView === 'shopkeeper' && (
            <button
              id="switch-customer-mode-btn"
              onClick={() => onViewChange('customer')}
              className="btn-m3 btn-m3-tonal text-xs h-9 px-3.5 flex items-center gap-1.5"
              title="Open Customer Kiosk View"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#006A6A]" />
              <span>Open Customer Kiosk</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};


