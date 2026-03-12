import React, { useState, useEffect } from 'react';
import { openRazorpay } from '../services/razorpay';

export interface PaymentDetails {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  method: string;
  paymentId?: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (bookingId: string, details: PaymentDetails) => void;
  title: string;
  subtitle?: string;
  amount: number;        // base amount (no GST)
  includeGst?: boolean;  // default true for workshops
  ctaLabel?: string;
  onViewInvoice?: () => void;
}

type Step = 'details' | 'confirm' | 'processing' | 'success' | 'failed';

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen, onClose, onSuccess, title, subtitle, amount, includeGst = true, ctaLabel = 'Pay Now', onViewInvoice
}) => {
  const gst = includeGst ? Math.round(amount * 0.18) : 0;
  const total = amount + gst;

  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [detailsError, setDetailsError] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [failureMessage, setFailureMessage] = useState('');

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Full reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('details');
      setName(''); setEmail(''); setPhone('');
      setDetailsError('');
      setBookingId(''); setPaymentId('');
      setFailureMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateDetails = (): boolean => {
    if (!name.trim()) { setDetailsError('Please enter your full name.'); return false; }
    if (!email.trim() || !email.includes('@')) { setDetailsError('Please enter a valid email.'); return false; }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setDetailsError('Please enter a valid 10-digit phone number.'); return false;
    }
    return true;
  };

  const goToConfirm = () => {
    setDetailsError('');
    if (validateDetails()) setStep('confirm');
  };

  const handlePay = () => {
    setStep('processing');
    openRazorpay({
      amount: total,
      description: title,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      onSuccess: (response) => {
        const id = 'KP-' + Math.random().toString(36).toUpperCase().slice(2, 8);
        setBookingId(id);
        setPaymentId(response.razorpay_payment_id);
        setStep('success');
        onSuccess(id, {
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          method: 'Razorpay',
          paymentId: response.razorpay_payment_id,
        });
      },
      onFailure: (error) => {
        setFailureMessage(error.message || 'Payment failed. Please try again.');
        setStep('failed');
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="bg-white w-full max-w-[440px] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
        style={{ maxHeight: '94vh' }}
      >
        {/* ── Fixed Header ── */}
        <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-[#F0F0F0]">
          {step !== 'success' && step !== 'failed' && (
            <div className="flex items-center gap-1.5 mb-3">
              {(['details', 'confirm'] as const).map((s, i) => {
                const labels = ['Details', 'Review & Pay'];
                const stepsOrder = ['details', 'confirm', 'processing', 'success'];
                const idx = stepsOrder.indexOf(step);
                const done = i < idx;
                const active = s === step || (step === 'processing' && s === 'confirm');
                return (
                  <React.Fragment key={s}>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-5 h-5 rounded-full text-[9px] flex items-center justify-center font-bold transition-all
                        ${done ? 'bg-[#8B735B] text-white' : active ? 'bg-[#2C2C2C] text-white' : 'bg-[#E5E5E5] text-[#999]'}`}>
                        {done ? '✓' : i + 1}
                      </span>
                      <span className={`text-[9px] uppercase tracking-wider font-semibold
                        ${active ? 'text-[#2C2C2C]' : done ? 'text-[#8B735B]' : 'text-[#CCC]'}`}>
                        {labels[i]}
                      </span>
                    </div>
                    {i < 1 && <div className={`flex-1 h-px ${done ? 'bg-[#8B735B]' : 'bg-[#E5E5E5]'}`} />}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg serif text-[#2C2C2C] leading-tight">{title}</h2>
              {subtitle && <p className="text-[10px] text-[#8B735B] uppercase tracking-widest mt-0.5">{subtitle}</p>}
            </div>
            {step !== 'success' && (
              <button onClick={onClose}
                className="w-7 h-7 flex items-center justify-center text-[#999] hover:text-[#2C2C2C] hover:bg-[#F5F5F5] rounded-full transition-all text-base ml-3 flex-shrink-0">
                ✕
              </button>
            )}
          </div>

          {/* Amount strip */}
          <div className="mt-3 flex items-center justify-between bg-[#FAF9F6] px-3 py-2 rounded-sm text-sm">
            <div className="flex items-center gap-3 text-xs text-[#999]">
              <span>₹ {amount.toLocaleString()}</span>
              {includeGst && <span>+ GST ₹ {gst.toLocaleString()}</span>}
            </div>
            <span className="font-bold text-[#2C2C2C]">₹ {total.toLocaleString()}</span>
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* STEP 1 — DETAILS */}
          {step === 'details' && (
            <div className="px-6 py-5 space-y-4">
              <p className="text-[10px] uppercase tracking-widest text-[#999]">Your Contact Details</p>

              {detailsError && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs px-3 py-2 rounded-sm">
                  {detailsError}
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-1.5">Full Name *</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="As per your ID"
                  className="w-full border border-[#E5E5E5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#2C2C2C] transition-colors" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-1.5">Email Address *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full border border-[#E5E5E5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#2C2C2C] transition-colors" />
                <p className="text-[10px] text-[#CCC] mt-1">Booking confirmation will be sent here</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-1.5">Phone Number *</label>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full border border-[#E5E5E5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#2C2C2C] transition-colors" />
              </div>
            </div>
          )}

          {/* STEP 2 — CONFIRM / REVIEW */}
          {(step === 'confirm' || step === 'processing') && (
            <div className="px-6 py-5 space-y-4">
              <p className="text-[10px] uppercase tracking-widest text-[#999]">Review your booking</p>

              <div className="border border-[#E5E5E5] divide-y divide-[#F0F0F0] text-sm">
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-[#999] text-xs">Name</span>
                  <span className="font-medium">{name}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-[#999] text-xs">Email</span>
                  <span className="font-medium text-xs">{email}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-[#999] text-xs">Phone</span>
                  <span className="font-medium">{phone}</span>
                </div>
              </div>

              <div className="border border-[#E5E5E5] divide-y divide-[#F0F0F0] text-sm">
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-[#999] text-xs">Base amount</span>
                  <span>₹ {amount.toLocaleString()}</span>
                </div>
                {includeGst && (
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="text-[#999] text-xs">GST (18%)</span>
                    <span>₹ {gst.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between px-4 py-2.5 bg-[#FAF9F6]">
                  <span className="font-bold text-xs uppercase tracking-widest">Total Payable</span>
                  <span className="font-bold text-lg serif">₹ {total.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-sm">
                <svg className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-[10px] text-emerald-700 uppercase tracking-widest">Secure payment via Razorpay · UPI, Cards, Net Banking</span>
              </div>

              <p className="text-[10px] text-[#999] leading-relaxed">
                By confirming, you agree to Kala Prayag's booking terms. Confirmation will be sent to <strong>{email}</strong>.
              </p>
            </div>
          )}

          {/* SUCCESS */}
          {step === 'success' && (
            <div className="px-6 py-8 text-center space-y-5">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl serif mb-1">Payment Successful!</h3>
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#8B735B]">Booking ID: {bookingId}</p>
              </div>
              <div className="bg-[#FAF9F6] border border-[#E5E5E5] p-4 text-left space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[#999]">Name</span><span>{name}</span></div>
                <div className="flex justify-between"><span className="text-[#999]">Email</span><span className="text-xs">{email}</span></div>
                <div className="flex justify-between"><span className="text-[#999]">Amount Paid</span><span className="font-bold">₹ {total.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-[#999]">Payment ID</span><span className="text-xs font-mono text-[#8B735B]">{paymentId}</span></div>
              </div>
              <p className="text-xs text-[#666]">
                A confirmation has been sent to <strong>{email}</strong>. Our team will contact you within 24 hours.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={onViewInvoice}
                  className="w-full border border-[#2C2C2C] py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-[#2C2C2C] hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View Invoice
                </button>
                <button onClick={onClose}
                  className="w-full bg-[#2C2C2C] text-white py-3.5 text-xs uppercase tracking-[0.3em] font-bold hover:bg-[#8B735B] transition-all">
                  Done
                </button>
              </div>
            </div>
          )}

          {/* FAILED */}
          {step === 'failed' && (
            <div className="px-6 py-8 text-center space-y-5">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl serif mb-2">Payment Failed</h3>
                <p className="text-sm text-[#666]">{failureMessage}</p>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={handlePay}
                  className="w-full bg-[#8B735B] text-white py-3.5 text-xs uppercase tracking-[0.3em] font-bold hover:bg-[#2C2C2C] transition-all">
                  Try Again
                </button>
                <a
                  href="https://wa.me/919999999999?text=Hi%2C%20I%20had%20a%20payment%20issue%20on%20Kala%20Prayag"
                  target="_blank" rel="noreferrer"
                  className="w-full border border-[#E5E5E5] py-3.5 text-xs uppercase tracking-widest font-bold hover:border-[#2C2C2C] transition-all text-center"
                >
                  Contact Us on WhatsApp
                </a>
              </div>
            </div>
          )}

        </div>

        {/* ── Fixed Footer ── */}
        {step !== 'success' && step !== 'failed' && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-[#F0F0F0] space-y-2">
            {step === 'details' && (
              <button onClick={goToConfirm}
                className="w-full bg-[#2C2C2C] text-white py-3.5 text-xs uppercase tracking-[0.3em] font-bold hover:bg-[#8B735B] transition-all">
                Review & Pay →
              </button>
            )}
            {step === 'confirm' && (
              <div className="flex gap-2">
                <button onClick={() => setStep('details')}
                  className="px-4 py-3.5 border border-[#D1D1D1] text-xs uppercase tracking-widest hover:border-[#2C2C2C] transition-all whitespace-nowrap">
                  ← Back
                </button>
                <button onClick={handlePay}
                  className="flex-1 bg-[#8B735B] text-white py-3.5 text-xs uppercase tracking-[0.3em] font-bold hover:bg-[#2C2C2C] transition-all flex items-center justify-center gap-2">
                  {ctaLabel} · ₹ {total.toLocaleString()}
                </button>
              </div>
            )}
            {step === 'processing' && (
              <button disabled
                className="w-full bg-[#8B735B] text-white py-3.5 text-xs uppercase tracking-[0.3em] font-bold opacity-60 flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Opening Payment...
              </button>
            )}
            <p className="text-[9px] text-center text-[#CCC] uppercase tracking-widest">
              🔒 Secured by Razorpay · 256-bit SSL encrypted
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentModal;
