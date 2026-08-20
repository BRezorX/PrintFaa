import { Shopkeeper, ShopPricingConfig, Station, PrintJob } from '../types';

export const INITIAL_SHOPKEEPERS: Shopkeeper[] = [
  {
    id: 'shop-apex',
    name: 'Apex FastPrint & Xerox Center',
    tagline: 'High-speed laser printing & thesis binding',
    ownerName: 'Marcus Vance',
    phone: '+1 (555) 234-5678',
    email: 'contact@apexfastprint.com',
    address: '42 University Boulevard, Suite 101',
    city: 'Metro City, MC 94103',
    upiVpa: 'apexprint@upi',
    createdAt: Date.now() - 86400000 * 30,
    autoAcceptJobs: true,
    soundAlerts: true,
    pricingConfig: {
      bwPageRate: 0.10,
      colorPageRate: 0.45,
      a3Multiplier: 1.8,
      legalMultiplier: 1.2,
      duplexDiscountPercent: 15,
      paperTypes: {
        standard: 0.0,
        thick: 0.15,
        glossy: 0.35,
      },
      bindingRates: {
        none: 0,
        staple: 0.50,
        spiral: 2.50,
        laminate: 1.50,
      },
      currency: 'USD',
      currencySymbol: '$',
      taxRatePercent: 8,
    },
    stations: [
      {
        id: 'station-1',
        name: 'Counter Kiosk #1 (High-Speed LaserJet)',
        location: 'Main Checkout Counter',
        printerModel: 'Brother HL-L8360CDW Laser (Color & Duplex)',
        isOnline: true,
      },
      {
        id: 'station-2',
        name: 'Express Self-Serve #2 (B&W Rapid)',
        location: 'Lobby Entrance Table',
        printerModel: 'HP LaserJet Enterprise M507x (Monochrome)',
        isOnline: true,
      },
    ],
    hardware: {
      model: 'Brother HL-L8360CDW Laser',
      ip: '192.168.1.142',
      isOnline: true,
      statusText: 'Idle • Ready for incoming jobs',
      paperTrayCount: 420,
      paperTrayCapacity: 500,
      blackTonerPercent: 88,
      cyanTonerPercent: 92,
      magentaTonerPercent: 74,
      yellowTonerPercent: 85,
      totalJobsPrinted: 342,
      isBusy: false,
    },
  },
  {
    id: 'shop-metro',
    name: 'Metro Digital Xerox & Plotting Hub',
    tagline: 'Architectural blueprints, color posters & scanning',
    ownerName: 'Sunita Rao',
    phone: '+1 (555) 876-5432',
    email: 'orders@metrodigitalprint.com',
    address: '742 Central Transit Concourse, Gate 4',
    city: 'Metro City, MC 94107',
    upiVpa: 'metroprint@upi',
    createdAt: Date.now() - 86400000 * 60,
    autoAcceptJobs: true,
    soundAlerts: true,
    pricingConfig: {
      bwPageRate: 0.12,
      colorPageRate: 0.50,
      a3Multiplier: 2.0,
      legalMultiplier: 1.3,
      duplexDiscountPercent: 20,
      paperTypes: {
        standard: 0.0,
        thick: 0.20,
        glossy: 0.40,
      },
      bindingRates: {
        none: 0,
        staple: 0.75,
        spiral: 3.00,
        laminate: 2.00,
      },
      currency: 'USD',
      currencySymbol: '$',
      taxRatePercent: 7.5,
    },
    stations: [
      {
        id: 'station-metro-1',
        name: 'Transit Terminal #1 (Express Color)',
        location: 'Gate 4 Concourse Counter',
        printerModel: 'Canon imageRUNNER ADVANCE DX C3835i',
        isOnline: true,
      },
      {
        id: 'station-metro-2',
        name: 'Wide Format & Plotter Desk #2',
        location: 'Blueprint & A3 Section',
        printerModel: 'Canon imagePROGRAF PRO-1000',
        isOnline: true,
      },
    ],
    hardware: {
      model: 'Canon imageRUNNER ADVANCE DX C3835i',
      ip: '192.168.2.88',
      isOnline: true,
      statusText: 'Online • All trays loaded',
      paperTrayCount: 680,
      paperTrayCapacity: 1000,
      blackTonerPercent: 94,
      cyanTonerPercent: 65,
      magentaTonerPercent: 58,
      yellowTonerPercent: 72,
      totalJobsPrinted: 890,
      isBusy: false,
    },
  },
  {
    id: 'shop-campus',
    name: 'Campus Library Student Copy Point',
    tagline: 'Subsidized academic printing & student documents',
    ownerName: 'Elena Rostova',
    phone: '+1 (555) 432-1098',
    email: 'library.print@campus.edu',
    address: 'East Quad Academic Library, Ground Floor',
    city: 'College Park, CP 94025',
    upiVpa: 'campusprint@edu',
    createdAt: Date.now() - 86400000 * 90,
    autoAcceptJobs: true,
    soundAlerts: false,
    pricingConfig: {
      bwPageRate: 0.08,
      colorPageRate: 0.35,
      a3Multiplier: 1.5,
      legalMultiplier: 1.1,
      duplexDiscountPercent: 25,
      paperTypes: {
        standard: 0.0,
        thick: 0.10,
        glossy: 0.25,
      },
      bindingRates: {
        none: 0,
        staple: 0.25,
        spiral: 2.00,
        laminate: 1.00,
      },
      currency: 'USD',
      currencySymbol: '$',
      taxRatePercent: 0,
    },
    stations: [
      {
        id: 'station-campus-1',
        name: 'Library Study Hall Kiosk #1',
        location: 'Ground Floor Circulation Desk',
        printerModel: 'HP LaserJet Managed MFP E62655dn',
        isOnline: true,
      },
    ],
    hardware: {
      model: 'HP LaserJet Managed MFP E62655dn',
      ip: '10.10.4.19',
      isOnline: true,
      statusText: 'Ready • Student discount active',
      paperTrayCount: 520,
      paperTrayCapacity: 600,
      blackTonerPercent: 78,
      cyanTonerPercent: 81,
      magentaTonerPercent: 79,
      yellowTonerPercent: 84,
      totalJobsPrinted: 1250,
      isBusy: false,
    },
  },
];

const SHOPS_STORAGE_KEY = 'printspot_shopkeepers_v1';
const ACTIVE_SHOP_STORAGE_KEY = 'printspot_active_shop_id_v1';
const JOBS_STORAGE_KEY = 'printspot_jobs_v1';

export function loadShopkeepersFromStorage(): Shopkeeper[] {
  try {
    const saved = localStorage.getItem(SHOPS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load shopkeepers from localStorage:', err);
  }
  return INITIAL_SHOPKEEPERS;
}

export function saveShopkeepersToStorage(shops: Shopkeeper[]): void {
  try {
    localStorage.setItem(SHOPS_STORAGE_KEY, JSON.stringify(shops));
  } catch (err) {
    console.warn('Failed to save shopkeepers to localStorage:', err);
  }
}

export function loadActiveShopId(): string {
  try {
    const saved = localStorage.getItem(ACTIVE_SHOP_STORAGE_KEY);
    if (saved) return saved;
  } catch (err) {
    console.warn('Failed to load active shop ID:', err);
  }
  return INITIAL_SHOPKEEPERS[0].id;
}

export function saveActiveShopId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_SHOP_STORAGE_KEY, id);
  } catch (err) {
    console.warn('Failed to save active shop ID:', err);
  }
}

export function loadJobsFromStorage(): PrintJob[] {
  try {
    const saved = localStorage.getItem(JOBS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load jobs from localStorage:', err);
  }
  return [];
}

export function saveJobsToStorage(jobs: PrintJob[]): void {
  try {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
  } catch (err) {
    console.warn('Failed to save jobs to localStorage:', err);
  }
}
