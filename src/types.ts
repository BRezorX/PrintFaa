export type ColorMode = 'bw' | 'color';
export type PaperSize = 'a4' | 'a3' | 'letter' | 'legal';
export type PrintOrientation = 'portrait' | 'landscape';
export type PaperType = 'standard' | 'thick' | 'glossy';
export type BindingOption = 'none' | 'staple' | 'spiral' | 'laminate';

export interface PrintSettings {
  colorMode: ColorMode;
  copies: number;
  duplex: boolean; // Double-sided
  paperSize: PaperSize;
  paperType: PaperType;
  orientation: PrintOrientation;
  pageRangeType: 'all' | 'custom' | 'odd' | 'even';
  customPages: string; // e.g. "1-4, 7"
  pagesPerSheet: 1 | 2 | 4;
  binding: BindingOption;
  notes: string;
}

export interface DocumentPage {
  pageNumber: number;
  originalPageNumber?: number;
  previewUrl?: string;
  textSnippet?: string;
  rotation?: number; // 0, 90, 180, 270
  isExcluded?: boolean;
  isCustomAdded?: boolean;
  customLabel?: string;
}

export interface FileEditSettings {
  watermarkText: string;
  watermarkType: 'none' | 'draft' | 'confidential' | 'copy' | 'original' | 'page_numbers' | 'custom';
  watermarkPosition: 'diagonal' | 'header' | 'footer';
  pageMargin: 'none' | 'normal' | 'wide';
  pageScale: number; // 80 - 120 (%)
  showCutBorders: boolean;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl: string;
  pageCount: number;
  pages: DocumentPage[];
  uploadedAt: number;
  editSettings?: FileEditSettings;
}

export type JobStatus = 'draft' | 'pending_payment' | 'paid' | 'spooling' | 'printing' | 'ready' | 'completed' | 'cancelled';

export interface PrintJob {
  id: string;
  orderNumber: string;
  shopId: string;
  shopName: string;
  stationId: string;
  stationName: string;
  file: UploadedFile;
  settings: PrintSettings;
  calculatedPages: number;
  sheetsNeeded: number;
  pricing: {
    baseRatePerPage: number;
    pageTotal: number;
    duplexDiscount: number;
    paperTypeSurge: number;
    bindingFee: number;
    subtotal: number;
    tax: number;
    total: number;
  };
  payment?: {
    method: 'upi' | 'card' | 'wallet' | 'cash';
    transactionId: string;
    paidAt: number;
    amount: number;
  };
  status: JobStatus;
  printProgress: number; // 0 to 100
  createdAt: number;
  pickupPin: string;
}

export interface ShopPricingConfig {
  bwPageRate: number; // e.g. 0.10
  colorPageRate: number; // e.g. 0.45
  a3Multiplier: number; // e.g. 1.8
  legalMultiplier: number; // e.g. 1.2
  duplexDiscountPercent: number; // e.g. 15 (%)
  paperTypes: {
    standard: number;
    thick: number;
    glossy: number;
  };
  bindingRates: {
    none: number;
    staple: number;
    spiral: number;
    laminate: number;
  };
  currency: string;
  currencySymbol: string;
  taxRatePercent: number;
}

export interface Station {
  id: string;
  name: string;
  location: string;
  printerModel: string;
  isOnline: boolean;
}

export interface PrinterHardwareStatus {
  model: string;
  ip: string;
  isOnline: boolean;
  statusText: string;
  paperTrayCount: number;
  paperTrayCapacity: number;
  blackTonerPercent: number;
  cyanTonerPercent: number;
  magentaTonerPercent: number;
  yellowTonerPercent: number;
  totalJobsPrinted: number;
  isBusy: boolean;
}

export interface Shopkeeper {
  id: string;
  name: string;
  tagline?: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  upiVpa?: string;
  pricingConfig: ShopPricingConfig;
  stations: Station[];
  hardware: PrinterHardwareStatus;
  createdAt: number;
  autoAcceptJobs: boolean;
  soundAlerts: boolean;
}

