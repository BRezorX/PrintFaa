import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  X,
  CreditCard,
  QrCode,
  Smartphone,
  Banknote,
  CheckCircle2,
  ShieldCheck,
  Tag,
  Lock,
  Sparkles,
} from 'lucide-react';
import { PrintJob, ShopPricingConfig } from '../types';
import { playSuccessChime } from '../utils/audio';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: PrintJob;
  pricingConfig: ShopPricingConfig;
  onPaymentSuccess: (paymentInfo: {
    method: 'upi' | 'card' | 'wallet' | 'cash';
    transactionId: string;
    paidAt: number;
    amount: number;
  }) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  job,
  pricingConfig,
  onPaymentSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'wallet' | 'cash'>('upi');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [upiQrUrl, setUpiQrUrl] = useState<string>('');
  const [couponCode, setCouponCode] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [couponApplied, setCouponApplied] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Card form state
  const [cardNumber, setCardNumber] = useState<string>('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvc, setCardCvc] = useState<string>('888');

  const finalAmount = Math.max(1.00, job.pricing.total - discountAmount);

  // Generate UPI Payment URI QR
  useEffect(() => {
    if (!isOpen) return;

    const upiUri = `upi://pay?pa=printspot.kiosk@icici&pn=PrintSpot+Kiosk&am=${finalAmount.toFixed(
      2
    )}&cu=INR&tn=PrintOrder-${job.orderNumber}`;

    QRCode.toDataURL(upiUri, {
      width: 260,
      margin: 1,
      color: { dark: '#052020', light: '#ffffff' },
    })
      .then((url) => setUpiQrUrl(url))
      .catch((err) => console.error(err));
  }, [isOpen, finalAmount, job.orderNumber]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const code = couponCode.trim().toUpperCase();

    if (code === 'STUDENT10') {
      const discount = Number((job.pricing.total * 0.1).toFixed(2));
      setDiscountAmount(discount);
      setCouponApplied('STUDENT10 (10% Student Discount applied!)');
    } else if (code === 'FREESHEET') {
      setDiscountAmount(Math.min(job.pricing.total, 5.00));
      setCouponApplied(`FREESHEET (${pricingConfig.currencySymbol}5.00 off your print!)`);
    } else {
      setCouponError('Invalid promo code. Try "STUDENT10" or "FREESHEET"');
    }
  };

  const executePayment = async (method: 'upi' | 'card' | 'wallet' | 'cash') => {
    setIsProcessing(true);

    try {
      const res = await fetch(`/api/jobs/${job.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: method }),
      });
      if (!res.ok) {
        throw new Error('Payment approval failed');
      }
      const updatedJob = await res.json();

      setIsProcessing(false);
      playSuccessChime();

      // Confetti burst
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      if (updatedJob.payment) {
        onPaymentSuccess({
          method: updatedJob.payment.method,
          transactionId: updatedJob.payment.transactionId,
          paidAt: updatedJob.payment.paidAt,
          amount: updatedJob.payment.amount,
        });
      }
    } catch (err) {
      console.error('Payment Error:', err);
      setIsProcessing(false);
      alert('Payment could not be verified on the server. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1B1F]/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-[28px] max-w-lg w-full overflow-hidden shadow-2xl border border-[#CAC4D0] flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#CAC4D0]/50 flex items-center justify-between bg-[#F7F9FB]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#CCE8E8] text-[#006A6A] rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-normal text-lg text-[#1C1B1F]">Checkout & Pay</h3>
              <p className="text-xs text-[#79747E] font-mono-code">
                Order #{job.orderNumber} • {job.calculatedPages} Pages ({job.sheetsNeeded} Sheets)
              </p>
            </div>
          </div>
          <button
            id="close-payment-modal-btn"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-[#79747E] hover:text-[#1C1B1F] rounded-full hover:bg-[#E7E0EB] cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Payment Method Selector Tabs */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'upi', label: 'UPI / QR', icon: QrCode },
              { id: 'card', label: 'Card / RuPay', icon: CreditCard },
              { id: 'wallet', label: 'Net Banking', icon: Smartphone },
              { id: 'cash', label: 'Counter', icon: Banknote },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = paymentMethod === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`pay-tab-${tab.id}-btn`}
                  onClick={() => setPaymentMethod(tab.id as typeof paymentMethod)}
                  disabled={isProcessing}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1 text-center cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#006A6A] bg-[#CCE8E8] text-[#052020] font-bold shadow-xs'
                      : 'border-[#CAC4D0] bg-[#F7F9FB] text-[#1C1B1F] hover:bg-[#E7E0EB]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-[#006A6A]' : 'text-[#79747E]'}`} />
                  <span className="text-[11px] leading-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: UPI / QR Code Scan-to-pay */}
          {paymentMethod === 'upi' && (
            <div className="p-5 rounded-2xl bg-[#F7F9FB] border border-[#CAC4D0] text-center space-y-3">
              <p className="text-xs font-medium text-[#1C1B1F]">
                Scan with any UPI App (Google Pay, PhonePe, Paytm, BHIM, CRED)
              </p>

              <div className="p-3 bg-white border border-[#CAC4D0] rounded-2xl inline-block shadow-xs">
                {upiQrUrl ? (
                  <img src={upiQrUrl} alt="Payment QR Code" className="w-44 h-44 object-contain" />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-xs text-[#79747E]">
                    Generating payment QR...
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs text-[#79747E] font-mono-code">
                <Lock className="w-3.5 h-3.5 text-[#006A6A]" />
                <span>NPCI UPI Instant Auto-Verification</span>
              </div>

              <button
                id="simulate-upi-payment-btn"
                type="button"
                disabled={isProcessing}
                onClick={() => executePayment('upi')}
                className="w-full h-11 rounded-full bg-[#006A6A] hover:bg-[#005353] text-white text-xs font-medium shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying UPI Transaction...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#CCE8E8]" />
                    <span>Simulate UPI Payment Approval ({pricingConfig.currencySymbol}{finalAmount.toFixed(2)})</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Tab 2: Credit / Debit Card */}
          {paymentMethod === 'card' && (
            <div className="space-y-3 p-5 rounded-2xl bg-[#F7F9FB] border border-[#CAC4D0]">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono-code font-bold text-[#79747E] uppercase">RuPay / Debit / Credit Card</label>
                <span className="text-[10px] text-[#006A6A] font-mono-code font-bold">RuPay • Visa • Mastercard</span>
              </div>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#CAC4D0] bg-white font-mono-code"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono-code font-bold text-[#79747E] uppercase">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2 text-xs rounded-xl border border-[#CAC4D0] bg-white font-mono-code"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono-code font-bold text-[#79747E] uppercase">CVV</label>
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2 text-xs rounded-xl border border-[#CAC4D0] bg-white font-mono-code"
                  />
                </div>
              </div>

              <button
                id="submit-card-payment-btn"
                type="button"
                disabled={isProcessing}
                onClick={() => executePayment('card')}
                className="w-full h-11 rounded-full bg-[#1C1B1F] hover:bg-[#313033] text-white text-xs font-medium shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Authorizing OTP...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 text-[#CCE8E8]" />
                    <span>Pay {pricingConfig.currencySymbol}{finalAmount.toFixed(2)} with Card</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Tab 3: Net Banking */}
          {paymentMethod === 'wallet' && (
            <div className="p-5 rounded-2xl bg-[#F7F9FB] border border-[#CAC4D0] text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1C1B1F] text-white flex items-center justify-center mx-auto shadow-xs">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#1C1B1F]">Instant Net Banking & Wallets</p>
                <p className="text-xs text-[#79747E]">SBI • HDFC Bank • ICICI Bank • Axis Bank • Paytm Wallet</p>
              </div>

              <button
                id="submit-wallet-payment-btn"
                type="button"
                disabled={isProcessing}
                onClick={() => executePayment('wallet')}
                className="w-full h-11 rounded-full bg-[#1C1B1F] hover:bg-[#313033] text-white text-xs font-medium shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Redirecting to Net Banking...</span>
                  </>
                ) : (
                  <span>Pay {pricingConfig.currencySymbol}{finalAmount.toFixed(2)} via NetBanking</span>
                )}
              </button>
            </div>
          )}

          {/* Tab 4: Cash at Counter */}
          {paymentMethod === 'cash' && (
            <div className="p-5 rounded-2xl bg-[#CCE8E8]/50 border border-[#CAC4D0] text-center space-y-3">
              <Banknote className="w-8 h-8 text-[#006A6A] mx-auto" />
              <div>
                <p className="text-sm font-medium text-[#052020]">Pay Cash at Counter</p>
                <p className="text-xs text-[#052020]/80">
                  Show your 4-digit Collection PIN to the shopkeeper upon receiving your printed sheets.
                </p>
              </div>

              <button
                id="submit-cash-payment-btn"
                type="button"
                disabled={isProcessing}
                onClick={() => executePayment('cash')}
                className="w-full h-11 rounded-full bg-[#006A6A] hover:bg-[#005353] text-white text-xs font-medium shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <span>Dispatching Print Job...</span>
                ) : (
                  <span>Confirm Order & Pay Counter Cash</span>
                )}
              </button>
            </div>
          )}

          {/* Promo code input */}
          <div className="pt-2 border-t border-[#CAC4D0]/50">
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-[#79747E] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="coupon-code-input"
                  type="text"
                  placeholder="Promo code (Try STUDENT10)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[#CAC4D0] focus:border-[#006A6A] uppercase font-mono-code outline-hidden bg-[#F7F9FB]"
                />
              </div>
              <button
                id="apply-coupon-btn"
                type="submit"
                className="px-4 py-2 bg-[#E7E0EB] hover:bg-[#CAC4D0] text-[#1C1B1F] font-medium text-xs rounded-xl cursor-pointer transition-colors"
              >
                Apply
              </button>
            </form>
            {couponApplied && (
              <p className="text-[11px] text-[#006A6A] font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {couponApplied}
              </p>
            )}
            {couponError && (
              <p className="text-[11px] text-red-600 mt-1">{couponError}</p>
            )}
          </div>

          {/* Final Amount Callout */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1C1B1F] text-white shadow-xs">
            <div>
              <span className="text-[11px] text-[#CAC4D0] font-mono-code uppercase">Total Payable:</span>
              <p className="text-xl font-bold text-[#CCE8E8] font-mono-code">
                {pricingConfig.currencySymbol}{finalAmount.toFixed(2)}
              </p>
            </div>
            <div className="text-right text-[11px] text-[#CAC4D0]">
              <span className="block font-medium text-white">{job.stationName}</span>
              <span className="font-mono-code">Direct Printer Spooling</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

