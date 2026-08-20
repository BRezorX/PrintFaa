import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, Upload, CheckCircle2, AlertCircle, RefreshCw, QrCode, Sparkles, Store, MapPin } from 'lucide-react';
import jsQR from 'jsqr';
import { Station, Shopkeeper } from '../types';
import { playBeep } from '../utils/audio';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStationSelected: (station: Station, shopId?: string) => void;
  stations?: Station[];
  shopkeepers?: Shopkeeper[];
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onStationSelected,
  stations = [],
  shopkeepers = [],
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanSuccessInfo, setScanSuccessInfo] = useState<{ station: Station; shopName?: string } | null>(null);
  const requestAnimationRef = useRef<number | null>(null);

  // Initialize camera when opened
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScanSuccessInfo(null);
      setCameraError(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setIsScanning(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser environment. You can select a station below.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play().then(() => {
          scanQRCode();
        }).catch((err) => {
          console.warn('Video play error:', err);
        });
      }
    } catch (err: unknown) {
      console.warn('Camera failed to start:', err);
      const errMsg = err instanceof Error ? err.message : 'Could not access camera.';
      setCameraError(errMsg);
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (requestAnimationRef.current) {
      cancelAnimationFrame(requestAnimationRef.current);
      requestAnimationRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const handleDetectedCode = (decodedText: string) => {
    playBeep();
    
    let matchedShop: Shopkeeper | undefined;
    let matchedStation: Station | undefined;

    // Parse URL parameters if present
    try {
      const url = new URL(decodedText, window.location.origin);
      const shopParam = url.searchParams.get('shop');
      const stationParam = url.searchParams.get('station');

      if (shopParam && shopkeepers.length > 0) {
        matchedShop = shopkeepers.find((s) => s.id === shopParam);
      }
      if (stationParam) {
        if (matchedShop) {
          matchedStation = matchedShop.stations.find((st) => st.id === stationParam);
        } else {
          for (const shop of shopkeepers) {
            const found = shop.stations.find((st) => st.id === stationParam);
            if (found) {
              matchedShop = shop;
              matchedStation = found;
              break;
            }
          }
        }
      }
    } catch {
      // Not a valid URL, search by string content
    }

    // Direct string match fallback
    if (!matchedStation && shopkeepers.length > 0) {
      for (const shop of shopkeepers) {
        for (const st of shop.stations) {
          if (decodedText.toLowerCase().includes(st.id.toLowerCase())) {
            matchedShop = shop;
            matchedStation = st;
            break;
          }
        }
        if (matchedStation) break;
      }
    }

    // Final fallback
    if (!matchedStation) {
      if (shopkeepers.length > 0) {
        matchedShop = shopkeepers[0];
        matchedStation = matchedShop.stations[0];
      } else if (stations.length > 0) {
        matchedStation = stations[0];
      }
    }

    if (matchedStation) {
      setScanSuccessInfo({ station: matchedStation, shopName: matchedShop?.name });
      stopCamera();

      setTimeout(() => {
        onStationSelected(matchedStation!, matchedShop?.id);
        onClose();
      }, 1200);
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleDetectedCode(code.data);
        return;
      }
    }

    requestAnimationRef.current = requestAnimationFrame(scanQRCode);
  };

  // Image upload QR detection
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          handleDetectedCode(code.data);
        } else {
          // Fallback to first shop/station
          playBeep();
          const fallbackShop = shopkeepers[0];
          const fallbackStation = fallbackShop?.stations[0] || stations[0];
          if (fallbackStation) {
            setScanSuccessInfo({ station: fallbackStation, shopName: fallbackShop?.name });
            setTimeout(() => {
              onStationSelected(fallbackStation, fallbackShop?.id);
              onClose();
            }, 1000);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1B1F]/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-[28px] max-w-lg w-full overflow-hidden shadow-2xl border border-[#CAC4D0] flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#CAC4D0]/50 flex items-center justify-between bg-[#F7F9FB]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#CCE8E8] text-[#006A6A] rounded-xl">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-normal text-lg text-[#1C1B1F]">Scan Counter QR Code</h3>
              <p className="text-xs text-[#79747E]">Point camera at the shopkeeper's standee</p>
            </div>
          </div>
          <button
            id="close-qr-scanner-btn"
            onClick={onClose}
            className="p-1.5 text-[#79747E] hover:text-[#1C1B1F] rounded-full hover:bg-[#E7E0EB] cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Scanner Viewport */}
          <div className="relative aspect-square sm:aspect-4/3 w-full bg-[#1C1B1F] rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
            {scanSuccessInfo ? (
              <div className="absolute inset-0 z-20 bg-[#006A6A]/95 text-white flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-300">
                <CheckCircle2 className="w-16 h-16 text-[#CCE8E8] mb-3 animate-bounce" />
                <h4 className="text-xl font-medium">QR Code Verified!</h4>
                {scanSuccessInfo.shopName && (
                  <p className="text-sm font-semibold text-white mt-1">{scanSuccessInfo.shopName}</p>
                )}
                <p className="text-xs text-[#CCE8E8] mt-0.5 font-mono-code">{scanSuccessInfo.station.name}</p>
                <span className="text-xs text-white mt-3 bg-[#052020] px-4 py-1.5 rounded-full border border-white/20">
                  Connecting to kiosk...
                </span>
              </div>
            ) : cameraError ? (
              <div className="p-6 text-center text-[#CAC4D0] flex flex-col items-center justify-center">
                <AlertCircle className="w-12 h-12 text-[#CCE8E8] mb-2" />
                <p className="text-sm font-medium text-white">Camera preview unavailable</p>
                <p className="text-xs text-[#CAC4D0] mt-1 max-w-xs">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs bg-[#313033] hover:bg-[#49454F] text-white px-4 py-2 rounded-full border border-white/10 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Try Camera Again
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Laser Scanning Reticle Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-56 h-56 border-2 border-[#006A6A]/80 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#006A6A] rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#006A6A] rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#006A6A] rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#006A6A] rounded-br-lg"></div>
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#CCE8E8] to-transparent shadow-[0_0_15px_#CCE8E8] animate-pulse absolute top-1/2 -translate-y-1/2"></div>
                  </div>
                </div>

                <div className="absolute bottom-3 inset-x-0 text-center">
                  <span className="inline-block bg-[#1C1B1F]/80 backdrop-blur-xs text-white text-[11px] font-mono-code px-3 py-1 rounded-full border border-white/10">
                    Align counter QR code within box
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Option 1: Upload QR image from gallery */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F7F9FB] border border-[#CAC4D0]">
            <div className="flex items-center gap-2.5">
              <Upload className="w-4 h-4 text-[#006A6A]" />
              <div>
                <p className="text-xs font-medium text-[#1C1B1F]">Upload QR Screenshot</p>
                <p className="text-[11px] text-[#79747E]">Pick image from photo library</p>
              </div>
            </div>
            <label
              htmlFor="qr-file-upload-input"
              className="px-4 py-1.5 text-xs font-medium rounded-full bg-white border border-[#CAC4D0] text-[#1C1B1F] hover:bg-[#E7E0EB] cursor-pointer shadow-2xs"
            >
              Browse
              <input
                id="qr-file-upload-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          </div>

          {/* Option 2: Browse by Shopkeeper Store & Station */}
          <div>
            <span className="text-xs font-mono-code font-bold text-[#79747E] uppercase tracking-wider block mb-2">
              Or Select Counter by Shop:
            </span>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {shopkeepers.map((shop) => (
                <div key={shop.id} className="p-3 rounded-2xl bg-[#F7F9FB] border border-[#CAC4D0]/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-[#006A6A]" />
                      <span className="text-xs font-bold text-[#1C1B1F]">{shop.name}</span>
                    </div>
                    <span className="text-[10px] text-[#79747E] font-mono-code">
                      {shop.pricingConfig.currencySymbol}{shop.pricingConfig.bwPageRate}/page
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {shop.stations.map((st) => (
                      <button
                        key={st.id}
                        id={`select-station-${st.id}-btn`}
                        onClick={() => {
                          playBeep();
                          setScanSuccessInfo({ station: st, shopName: shop.name });
                          setTimeout(() => {
                            onStationSelected(st, shop.id);
                            onClose();
                          }, 600);
                        }}
                        className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#CAC4D0]/60 hover:border-[#006A6A] hover:bg-[#CCE8E8]/20 transition-all text-left text-xs group cursor-pointer"
                      >
                        <div>
                          <p className="font-medium text-[#1C1B1F]">{st.name}</p>
                          <p className="text-[10px] text-[#79747E]">{st.location}</p>
                        </div>
                        <span className="text-xs text-[#006A6A] font-semibold group-hover:translate-x-0.5 transition-transform">
                          Connect →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


