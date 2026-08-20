import React from 'react';
import {
  Palette,
  Copy,
  Layers,
  FileCheck,
  Maximize2,
  BookOpen,
  Scissors,
  Tag,
  CreditCard,
  Check,
} from 'lucide-react';
import { PrintSettings, ShopPricingConfig, UploadedFile } from '../types';
import { calculateJobCost } from '../utils/priceCalculator';
import { AdvancedFileEditor } from './AdvancedFileEditor';

interface PrintConfiguratorProps {
  file: UploadedFile;
  settings: PrintSettings;
  pricingConfig: ShopPricingConfig;
  onSettingsChange: (newSettings: PrintSettings) => void;
  onFileUpdate?: (updatedFile: UploadedFile) => void;
  onProceedToPayment: () => void;
}

export const PrintConfigurator: React.FC<PrintConfiguratorProps> = ({
  file,
  settings,
  pricingConfig,
  onSettingsChange,
  onFileUpdate,
  onProceedToPayment,
}) => {
  const calculation = calculateJobCost(settings, file.pageCount, pricingConfig);
  const { pricing, calculatedPages, sheetsNeeded, selectedPages } = calculation;

  const updateSetting = <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="m3-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#CAC4D0]/50 pb-4">
          <div>
            <h2 className="text-2xl font-normal text-[#1C1B1F] flex items-center gap-3">
              <span className="m3-step-circle">2</span>
              Configure Print Settings
            </h2>
            <p className="text-sm text-[#79747E] mt-1 ml-11">
              Customize colors, paper, copies & binding options
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-[#79747E] font-mono-code uppercase">Live Estimate</span>
            <p className="text-2xl font-bold text-[#006A6A] font-mono-code">
              {pricingConfig.currencySymbol}{pricing.total.toFixed(2)}
            </p>
          </div>
        </div>

        {/* 1. Color Mode Option */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#79747E] font-mono-code uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-[#006A6A]" />
            Color Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              id="color-mode-bw-btn"
              type="button"
              onClick={() => updateSetting('colorMode', 'bw')}
              className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                settings.colorMode === 'bw'
                  ? 'border-[#006A6A] bg-[#CCE8E8] text-[#052020] shadow-xs'
                  : 'border-[#CAC4D0] bg-[#F7F9FB] hover:bg-[#E7E0EB]/50 text-[#1C1B1F]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono-code font-bold text-xs ${settings.colorMode === 'bw' ? 'bg-[#006A6A] text-white' : 'bg-[#CAC4D0]/40 text-[#1C1B1F]'}`}>
                  B&W
                </div>
                <div>
                  <p className="text-sm font-medium">Black & White</p>
                  <p className="text-xs text-[#79747E] font-mono-code">
                    {pricingConfig.currencySymbol}{pricingConfig.bwPageRate.toFixed(2)} / page
                  </p>
                </div>
              </div>
              {settings.colorMode === 'bw' && <Check className="w-5 h-5 text-[#006A6A]" />}
            </button>

            <button
              id="color-mode-color-btn"
              type="button"
              onClick={() => updateSetting('colorMode', 'color')}
              className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                settings.colorMode === 'color'
                  ? 'border-[#006A6A] bg-[#CCE8E8] text-[#052020] shadow-xs'
                  : 'border-[#CAC4D0] bg-[#F7F9FB] hover:bg-[#E7E0EB]/50 text-[#1C1B1F]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono-code font-bold text-xs ${settings.colorMode === 'color' ? 'bg-[#006A6A] text-white' : 'bg-gradient-to-r from-amber-400 to-pink-500 text-white'}`}>
                  RGB
                </div>
                <div>
                  <p className="text-sm font-medium">Vibrant Color</p>
                  <p className="text-xs text-[#79747E] font-mono-code">
                    {pricingConfig.currencySymbol}{pricingConfig.colorPageRate.toFixed(2)} / page
                  </p>
                </div>
              </div>
              {settings.colorMode === 'color' && <Check className="w-5 h-5 text-[#006A6A]" />}
            </button>
          </div>
        </div>

        {/* 2. Number of Copies & Duplex Sidedness */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Copies Stepper */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#79747E] font-mono-code uppercase tracking-wider flex items-center gap-1.5">
              <Copy className="w-3.5 h-3.5 text-[#006A6A]" />
              Number of Copies
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-[#CAC4D0] rounded-full bg-[#F7F9FB] overflow-hidden w-full max-w-[150px]">
                <button
                  id="decrement-copies-btn"
                  type="button"
                  onClick={() => updateSetting('copies', Math.max(1, settings.copies - 1))}
                  className="px-3.5 py-2 text-[#1C1B1F] hover:bg-[#E7E0EB] font-bold text-sm cursor-pointer transition-colors"
                >
                  -
                </button>
                <input
                  id="copies-count-input"
                  type="number"
                  min="1"
                  max="50"
                  value={settings.copies}
                  onChange={(e) => updateSetting('copies', Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1)))}
                  className="w-full text-center font-bold font-mono-code text-sm bg-transparent outline-hidden py-2"
                />
                <button
                  id="increment-copies-btn"
                  type="button"
                  onClick={() => updateSetting('copies', Math.min(50, settings.copies + 1))}
                  className="px-3.5 py-2 text-[#1C1B1F] hover:bg-[#E7E0EB] font-bold text-sm cursor-pointer transition-colors"
                >
                  +
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1">
                {[1, 2, 5, 10].map((preset) => (
                  <button
                    key={preset}
                    id={`copy-preset-${preset}-btn`}
                    type="button"
                    onClick={() => updateSetting('copies', preset)}
                    className={`h-9 px-3 rounded-full text-xs font-mono-code font-bold cursor-pointer transition-all ${
                      settings.copies === preset
                        ? 'bg-[#1C1B1F] text-white'
                        : 'bg-[#F7F9FB] text-[#1C1B1F] border border-[#CAC4D0] hover:bg-[#E7E0EB]'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sidedness / Duplex */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#79747E] font-mono-code uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#006A6A]" />
              Print Sidedness
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="duplex-true-btn"
                type="button"
                onClick={() => updateSetting('duplex', true)}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  settings.duplex
                    ? 'border-[#006A6A] bg-[#CCE8E8] text-[#052020]'
                    : 'border-[#CAC4D0] bg-[#F7F9FB] text-[#1C1B1F] hover:bg-[#E7E0EB]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">2-Sided (Duplex)</p>
                  <span className="text-[9px] font-bold text-[#052020] bg-white/70 px-1.5 py-0.5 rounded">
                    -15%
                  </span>
                </div>
                <p className="text-[10px] text-[#79747E] mt-0.5">Saves paper</p>
              </button>

              <button
                id="duplex-false-btn"
                type="button"
                onClick={() => updateSetting('duplex', false)}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  !settings.duplex
                    ? 'border-[#006A6A] bg-[#CCE8E8] text-[#052020]'
                    : 'border-[#CAC4D0] bg-[#F7F9FB] text-[#1C1B1F] hover:bg-[#E7E0EB]/50'
                }`}
              >
                <p className="text-xs font-medium">1-Sided (Single)</p>
                <p className="text-[10px] text-[#79747E] mt-0.5">Standard single sheet</p>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Page Selection Range */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#79747E] font-mono-code uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-[#006A6A]" />
              Pages to Print (Total Document: {file.pageCount} Pages)
            </label>
            <span className="text-xs font-mono-code font-bold text-[#006A6A]">
              Selected: {selectedPages.length} {selectedPages.length === 1 ? 'page' : 'pages'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'all', label: 'All Pages' },
              { id: 'custom', label: 'Custom Range' },
              { id: 'odd', label: 'Odd Pages Only' },
              { id: 'even', label: 'Even Pages Only' },
            ].map((mode) => (
              <button
                key={mode.id}
                id={`page-range-${mode.id}-btn`}
                type="button"
                onClick={() => updateSetting('pageRangeType', mode.id as PrintSettings['pageRangeType'])}
                className={`py-2.5 px-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                  settings.pageRangeType === mode.id
                    ? 'border-[#006A6A] bg-[#CCE8E8] text-[#052020] font-bold'
                    : 'border-[#CAC4D0] bg-[#F7F9FB] text-[#1C1B1F] hover:bg-[#E7E0EB]'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {settings.pageRangeType === 'custom' && (
            <div className="pt-2">
              <input
                id="custom-pages-input"
                type="text"
                value={settings.customPages}
                placeholder="e.g. 1-2, 4"
                onChange={(e) => updateSetting('customPages', e.target.value)}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-[#CAC4D0] focus:border-[#006A6A] focus:ring-2 focus:ring-[#006A6A]/20 outline-hidden font-mono-code bg-[#F7F9FB]"
              />
              <p className="text-[11px] text-[#79747E] mt-1">
                Enter page numbers and/or ranges separated by commas (e.g. 1-3, 5).
              </p>
            </div>
          )}
        </div>

        {/* 4. Paper Size & Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Paper Size */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#79747E] font-mono-code uppercase tracking-wider flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-[#006A6A]" />
              Paper Size
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'a4', name: 'A4 Standard', desc: '210 × 297 mm' },
                { id: 'letter', name: 'US Letter', desc: '8.5 × 11 in' },
                { id: 'a3', name: 'A3 Poster', desc: '+60% size' },
                { id: 'legal', name: 'Legal Sheet', desc: '8.5 × 14 in' },
              ].map((size) => (
                <button
                  key={size.id}
                  id={`paper-size-${size.id}-btn`}
                  type="button"
                  onClick={() => updateSetting('paperSize', size.id as PrintSettings['paperSize'])}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    settings.paperSize === size.id
                      ? 'border-[#006A6A] bg-[#CCE8E8] text-[#052020]'
                      : 'border-[#CAC4D0] bg-[#F7F9FB] text-[#1C1B1F] hover:bg-[#E7E0EB]/50'
                  }`}
                >
                  <p className="text-xs font-medium">{size.name}</p>
                  <p className="text-[10px] text-[#79747E]">{size.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Paper Stock */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#79747E] font-mono-code uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#006A6A]" />
              Paper Stock
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'standard', name: 'Standard', desc: '75gsm', price: `+${pricingConfig.currencySymbol}0` },
                { id: 'thick', name: 'Heavy', desc: '100gsm', price: `+${pricingConfig.currencySymbol}${pricingConfig.paperTypes.thick}` },
                { id: 'glossy', name: 'Glossy', desc: 'Sheen', price: `+${pricingConfig.currencySymbol}${pricingConfig.paperTypes.glossy}` },
              ].map((paper) => (
                <button
                  key={paper.id}
                  id={`paper-type-${paper.id}-btn`}
                  type="button"
                  onClick={() => updateSetting('paperType', paper.id as PrintSettings['paperType'])}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    settings.paperType === paper.id
                      ? 'border-[#006A6A] bg-[#CCE8E8] text-[#052020]'
                      : 'border-[#CAC4D0] bg-[#F7F9FB] text-[#1C1B1F] hover:bg-[#E7E0EB]/50'
                  }`}
                >
                  <p className="text-xs font-medium">{paper.name}</p>
                  <p className="text-[10px] text-[#79747E]">{paper.desc}</p>
                  <p className="text-[10px] font-mono-code font-bold text-[#006A6A] mt-0.5">{paper.price}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Finishing & Binding */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#79747E] font-mono-code uppercase tracking-wider flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 text-[#006A6A]" />
            Finishing & Binding
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'none', label: 'No Binding', fee: 'Free' },
              { id: 'staple', label: 'Staple', fee: `+${pricingConfig.currencySymbol}${pricingConfig.bindingRates.staple}` },
              { id: 'spiral', label: 'Spiral', fee: `+${pricingConfig.currencySymbol}${pricingConfig.bindingRates.spiral}` },
              { id: 'laminate', label: 'Laminate', fee: `+${pricingConfig.currencySymbol}${pricingConfig.bindingRates.laminate}/pg` },
            ].map((opt) => (
              <button
                key={opt.id}
                id={`binding-${opt.id}-btn`}
                type="button"
                onClick={() => updateSetting('binding', opt.id as PrintSettings['binding'])}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  settings.binding === opt.id
                    ? 'border-[#006A6A] bg-[#CCE8E8] text-[#052020] font-bold'
                    : 'border-[#CAC4D0] bg-[#F7F9FB] text-[#1C1B1F] hover:bg-[#E7E0EB]/50'
                }`}
              >
                <p className="text-xs font-medium">{opt.label}</p>
                <p className="text-[10px] font-mono-code font-bold text-[#006A6A]">{opt.fee}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced File & Page Arranger Toggle Component */}
      {onFileUpdate && (
        <AdvancedFileEditor
          file={file}
          settings={settings}
          onFileUpdate={onFileUpdate}
          onSettingsUpdate={onSettingsChange}
        />
      )}

      {/* Bill & Checkout Card */}
      <div className="bg-[#1C1B1F] text-white rounded-[28px] p-6 sm:p-8 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-base font-medium tracking-tight flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#CCE8E8]" />
            Order Summary & Breakdown
          </h3>
          <span className="text-xs font-mono-code text-[#CAC4D0]">
            {sheetsNeeded} {sheetsNeeded === 1 ? 'Sheet' : 'Sheets'} ({calculatedPages} Total Page Impressions)
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-[#CAC4D0]">
            <span>
              {calculatedPages} {calculatedPages === 1 ? 'Page' : 'Pages'} ({settings.colorMode === 'bw' ? 'B&W' : 'Color'} @ {pricingConfig.currencySymbol}{pricing.baseRatePerPage.toFixed(2)})
            </span>
            <span className="font-mono-code">{pricingConfig.currencySymbol}{pricing.pageTotal.toFixed(2)}</span>
          </div>

          {pricing.duplexDiscount > 0 && (
            <div className="flex justify-between text-[#CCE8E8] font-medium">
              <span>Duplex Paper Discount (-{pricingConfig.duplexDiscountPercent}%)</span>
              <span className="font-mono-code">-{pricingConfig.currencySymbol}{pricing.duplexDiscount.toFixed(2)}</span>
            </div>
          )}

          {pricing.paperTypeSurge > 0 && (
            <div className="flex justify-between text-[#CAC4D0]">
              <span>Paper stock upgrade ({settings.paperType})</span>
              <span className="font-mono-code">+{pricingConfig.currencySymbol}{pricing.paperTypeSurge.toFixed(2)}</span>
            </div>
          )}

          {pricing.bindingFee > 0 && (
            <div className="flex justify-between text-[#CAC4D0]">
              <span>Finishing ({settings.binding})</span>
              <span className="font-mono-code">+{pricingConfig.currencySymbol}{pricing.bindingFee.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-[#79747E] pt-2 border-t border-white/10">
            <span>Estimated Sales Tax ({pricingConfig.taxRatePercent}%)</span>
            <span className="font-mono-code">{pricingConfig.currencySymbol}{pricing.tax.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-baseline pt-3 border-t border-white/10">
            <span className="text-sm font-medium text-white">Amount Due:</span>
            <span className="text-2xl font-bold text-[#CCE8E8] font-mono-code">
              {pricingConfig.currencySymbol}{pricing.total.toFixed(2)}
            </span>
          </div>
        </div>

        <button
          id="proceed-to-payment-btn"
          type="button"
          onClick={onProceedToPayment}
          className="w-full h-12 rounded-full bg-[#006A6A] hover:bg-[#005353] text-white font-medium text-sm shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
        >
          <CreditCard className="w-4 h-4 text-[#CCE8E8]" />
          <span>Pay {pricingConfig.currencySymbol}{pricing.total.toFixed(2)} & Initiate Print</span>
        </button>

        <p className="text-[11px] text-[#79747E] text-center font-mono-code">
          Instant printer dispatch upon payment. 100% contactless & secure.
        </p>
      </div>
    </div>
  );
};

