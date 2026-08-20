import { Station, PrintSettings } from '../types';

export const DEFAULT_STATIONS: Station[] = [
  {
    id: 'station-1',
    name: 'Counter Kiosk #1 (High-Speed LaserJet)',
    location: 'Main Checkout Counter',
    printerModel: 'Brother HL-L8360CDW Laser (Color & Duplex)',
    isOnline: true,
  },
  {
    id: 'station-2',
    name: 'Self-Serve Station #2 (Express B&W)',
    location: 'Lobby Entrance Table',
    printerModel: 'HP LaserJet Enterprise M507x (Monochrome)',
    isOnline: true,
  },
  {
    id: 'station-3',
    name: 'Photo & Graphic Desk #3 (Wide Format A3)',
    location: 'Design & Plotting Corner',
    printerModel: 'Canon imagePROGRAF PRO-1000',
    isOnline: true,
  },
];

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  colorMode: 'bw',
  copies: 1,
  duplex: true,
  paperSize: 'a4',
  paperType: 'standard',
  orientation: 'portrait',
  pageRangeType: 'all',
  customPages: '',
  pagesPerSheet: 1,
  binding: 'none',
  notes: '',
};
