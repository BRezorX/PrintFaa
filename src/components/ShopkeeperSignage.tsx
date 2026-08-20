import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, Copy, Check, QrCode, Smartphone, ArrowRight } from 'lucide-react';
import { Station } from '../types';

interface ShopkeeperSignageProps {
  station: Station;
  shopId: string;
  shopName: string;
  ownerName?: string;
  onSimulateCustomerScan: () => void;
}

export const ShopkeeperSignage: React.FC<ShopkeeperSignageProps> = ({
  station,
  shopId,
  shopName,
  ownerName,
  onSimulateCustomerScan,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Deep link URL for this specific shop and station
  const stationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?page=customer&shop=${encodeURIComponent(shopId)}&station=${encodeURIComponent(station.id)}`
    : `https://printspot.local/?page=customer&shop=${shopId}&station=${station.id}`;

  useEffect(() => {
    QRCode.toDataURL(stationUrl, {
      width: 340,
      margin: 2,
      color: {
        dark: '#052020',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [stationUrl, station.id, shopId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(stationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintSign = () => {
    window.print();
  };

  return (
    <div className="m3-card overflow-hidden">
      {/* Signage Header */}
      <div className="p-5 border-b border-[#CAC4D0]/50 bg-[#F7F9FB] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-medium text-[#1C1B1F] text-base flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#006A6A]" />
            Counter QR Standee / Kiosk Sign
          </h3>
          <p className="text-xs text-[#79747E]">
            Print and place this on your counter for customers to scan with their phones
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="copy-station-link-btn"
            onClick={handleCopyLink}
            className="btn-m3 btn-m3-tonal text-xs py-1.5 px-3"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#006A6A]" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied Link' : 'Copy Direct URL'}
          </button>
          <button
            id="print-standee-btn"
            onClick={handlePrintSign}
            className="btn-m3 btn-m3-accent text-xs py-1.5 px-3.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Counter Sign
          </button>
        </div>
      </div>

      {/* Main Standee Graphic Preview */}
      <div className="p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-center gap-8 bg-[#F7F9FB]">
        {/* Printable Standee Sheet */}
        <div
          id="printable-standee-sheet"
          className="w-full max-w-sm bg-white p-7 rounded-[28px] border-2 border-[#1C1B1F] shadow-lg text-center relative flex flex-col items-center"
        >
          {/* Top Badge */}
          <div className="w-full py-1.5 px-3 bg-[#1C1B1F] text-white rounded-full mb-4 flex items-center justify-center gap-2">
            <Printer className="w-4 h-4 text-[#CCE8E8]" />
            <span className="text-xs font-mono-code font-bold uppercase tracking-wider">{shopName}</span>
          </div>

          <h2 className="text-2xl font-black text-[#1C1B1F] tracking-tight">SCAN TO PRINT</h2>
          <p className="text-xs text-[#79747E] mt-1 max-w-[240px]">
            No apps required. Open your camera, upload file, and print instantly!
          </p>

          {/* QR Code Container */}
          <div className="my-5 p-3.5 bg-white border-2 border-dashed border-[#006A6A] rounded-2xl shadow-inner inline-block">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Counter Station QR Code"
                className="w-52 h-52 object-contain"
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-xs text-[#79747E]">
                Generating QR...
              </div>
            )}
          </div>

          {/* 3 Step Icons */}
          <div className="grid grid-cols-3 gap-2 w-full pt-3 border-t border-[#CAC4D0] text-[10px] text-[#1C1B1F] font-medium">
            <div className="flex flex-col items-center">
              <span className="w-5 h-5 rounded-full bg-[#CCE8E8] text-[#052020] font-bold flex items-center justify-center mb-1 text-[10px]">1</span>
              <span>Scan QR</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="w-5 h-5 rounded-full bg-[#CCE8E8] text-[#052020] font-bold flex items-center justify-center mb-1 text-[10px]">2</span>
              <span>Upload Doc</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="w-5 h-5 rounded-full bg-[#CCE8E8] text-[#052020] font-bold flex items-center justify-center mb-1 text-[10px]">3</span>
              <span>Pay & Collect</span>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-[#CAC4D0] w-full flex items-center justify-between text-[11px] text-[#79747E] font-mono-code">
            <span className="font-medium text-[#1C1B1F]">{station.name}</span>
            <span className="text-[#006A6A] font-bold">Auto-Release</span>
          </div>
        </div>

        {/* Action / Simulation Guide */}
        <div className="max-w-md space-y-4">
          <div className="p-5 rounded-2xl bg-[#CCE8E8]/40 border border-[#CAC4D0]">
            <h4 className="font-medium text-[#052020] text-sm flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#006A6A]" />
              How Customers Use This:
            </h4>
            <ul className="text-xs text-[#052020]/90 mt-2 space-y-1.5 list-disc list-inside">
              <li>Customer walks up to the counter and opens their phone camera.</li>
              <li>Camera detects the QR and opens this portal automatically.</li>
              <li>Customer picks B&W or Color, sets copies & page range.</li>
              <li>Completes contactless payment and the printer starts buzzing!</li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#CAC4D0] space-y-3">
            <h4 className="font-mono-code font-bold text-[#79747E] text-xs uppercase tracking-wider">
              Test Customer Experience
            </h4>
            <p className="text-xs text-[#1C1B1F]">
              Click below to simulate a customer scanning this exact QR code and jumping directly into the print submission workflow:
            </p>
            <button
              id="simulate-customer-scan-btn"
              onClick={onSimulateCustomerScan}
              className="btn-m3 btn-m3-filled w-full text-xs"
            >
              <Smartphone className="w-4 h-4 text-[#CCE8E8]" />
              <span>Simulate Customer Scan Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

