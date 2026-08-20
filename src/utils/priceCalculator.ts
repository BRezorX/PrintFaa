import { PrintSettings, ShopPricingConfig } from '../types';

export const DEFAULT_PRICING: ShopPricingConfig = {
  bwPageRate: 2.00, // ₹2.00 per B&W page
  colorPageRate: 10.00, // ₹10.00 per Color page
  a3Multiplier: 2.0, // 2x for A3 posters
  legalMultiplier: 1.25,
  duplexDiscountPercent: 15, // 15% discount for eco two-sided printing
  paperTypes: {
    standard: 0.00,
    thick: 3.00, // +₹3.00 per sheet
    glossy: 8.00, // +₹8.00 per sheet
  },
  bindingRates: {
    none: 0,
    staple: 5.00, // ₹5.00 staple fee
    spiral: 35.00, // ₹35.00 spiral binding
    laminate: 15.00, // ₹15.00 per sheet lamination
  },
  currency: 'INR',
  currencySymbol: '₹',
  taxRatePercent: 5, // 5% GST
};

/**
 * Parses user custom page string e.g. "1-3, 5, 8" against total document pages
 */
export function calculateSelectedPageNumbers(settings: PrintSettings, totalDocPages: number): number[] {
  if (totalDocPages <= 0) return [1];

  switch (settings.pageRangeType) {
    case 'all': {
      return Array.from({ length: totalDocPages }, (_, i) => i + 1);
    }
    case 'odd': {
      const odds: number[] = [];
      for (let i = 1; i <= totalDocPages; i += 2) odds.push(i);
      return odds;
    }
    case 'even': {
      const evens: number[] = [];
      for (let i = 2; i <= totalDocPages; i += 2) evens.push(i);
      return evens.length ? evens : [1];
    }
    case 'custom': {
      if (!settings.customPages || settings.customPages.trim() === '') {
        return Array.from({ length: totalDocPages }, (_, i) => i + 1);
      }
      const parts = settings.customPages.split(',');
      const selected = new Set<number>();

      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [startStr, endStr] = trimmed.split('-');
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (!isNaN(start) && !isNaN(end)) {
            const min = Math.max(1, Math.min(start, end));
            const max = Math.min(totalDocPages, Math.max(start, end));
            for (let p = min; p <= max; p++) {
              selected.add(p);
            }
          }
        } else {
          const page = parseInt(trimmed, 10);
          if (!isNaN(page) && page >= 1 && page <= totalDocPages) {
            selected.add(page);
          }
        }
      }

      const result = Array.from(selected).sort((a, b) => a - b);
      return result.length ? result : Array.from({ length: totalDocPages }, (_, i) => i + 1);
    }
  }
}

export function calculateJobCost(
  settings: PrintSettings,
  totalDocPages: number,
  config: ShopPricingConfig = DEFAULT_PRICING
) {
  const selectedPages = calculateSelectedPageNumbers(settings, totalDocPages);
  const rawPageCount = selectedPages.length;

  // Pages per sheet scaling
  const effectivePagesPerCopy = Math.ceil(rawPageCount / settings.pagesPerSheet);
  const totalPagesToPrint = effectivePagesPerCopy * Math.max(1, settings.copies);

  // Sheets needed (accounting for duplex)
  const sheetsNeeded = settings.duplex
    ? Math.ceil(totalPagesToPrint / 2)
    : totalPagesToPrint;

  // Base rate
  let baseRate = settings.colorMode === 'color' ? config.colorPageRate : config.bwPageRate;

  // Paper size multiplier
  if (settings.paperSize === 'a3') {
    baseRate *= config.a3Multiplier;
  } else if (settings.paperSize === 'legal') {
    baseRate *= config.legalMultiplier;
  }

  const rawPageTotal = totalPagesToPrint * baseRate;

  // Duplex discount calculation
  let duplexDiscount = 0;
  if (settings.duplex && totalPagesToPrint > 1) {
    // Discount given on the paper savings
    duplexDiscount = (rawPageTotal * config.duplexDiscountPercent) / 100;
  }

  // Paper type surcharge per sheet
  const paperTypeRate = config.paperTypes[settings.paperType] || 0;
  const paperTypeSurge = sheetsNeeded * paperTypeRate;

  // Binding fee
  const bindingUnitFee = config.bindingRates[settings.binding] || 0;
  // If staple/spiral, fee per copy; if laminate, fee per sheet
  const bindingFee = settings.binding === 'laminate'
    ? bindingUnitFee * sheetsNeeded
    : bindingUnitFee * Math.max(1, settings.copies);

  const subtotal = Math.max(0.10, rawPageTotal - duplexDiscount + paperTypeSurge + bindingFee);
  const tax = Number(((subtotal * config.taxRatePercent) / 100).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  return {
    selectedPages,
    calculatedPages: totalPagesToPrint,
    sheetsNeeded,
    pricing: {
      baseRatePerPage: Number(baseRate.toFixed(2)),
      pageTotal: Number(rawPageTotal.toFixed(2)),
      duplexDiscount: Number(duplexDiscount.toFixed(2)),
      paperTypeSurge: Number(paperTypeSurge.toFixed(2)),
      bindingFee: Number(bindingFee.toFixed(2)),
      subtotal: Number(subtotal.toFixed(2)),
      tax,
      total,
    },
  };
}
