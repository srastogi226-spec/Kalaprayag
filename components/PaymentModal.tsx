import React, { useState, useRef, useEffect } from 'react';

export interface PaymentDetails {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  method: string;
  // UPI
  upiId?: string;
  upiScreenshot?: string;
  // Card
  cardNumber?: string;
  cardName?: string;
  cardExpiry?: string;
  cardCvv?: string;
  // Bank Transfer
  bankReceipt?: string;
  // Net Banking
  bankName?: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (bookingId: string, details: PaymentDetails) => void;
  title: string;
  subtitle?: string;
  amount: number;        // base amount (no GST)
  includeGst?: boolean;  // default true for workshops
  ctaLabel?: string;     // e.g. "Reserve My Seat" or "Place Order"
  onViewInvoice?: () => void;
}

const BANKS = [
  'HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank',
  'Kotak Mahindra Bank', 'Yes Bank', 'Punjab National Bank',
  'Bank of Baroda', 'Canara Bank', 'IndusInd Bank', 'Other',
];

type Step = 'details' | 'payment' | 'confirm' | 'success';

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen, onClose, onSuccess, title, subtitle, amount, includeGst = true, ctaLabel = 'Pay Now', onViewInvoice
}) => {
  const gst = includeGst ? Math.round(amount * 0.18) : 0;
  const total = amount + gst;

  // Step
  const [step, setStep] = useState<Step>('details');

  // Customer details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Payment method
  const [method, setMethod] = useState<'UPI' | 'Card' | 'Bank Transfer' | 'Net Banking'>('UPI');

  // UPI
  const [upiId, setUpiId] = useState('');
  const [upiScreenshot, setUpiScreenshot] = useState('');
  const upiRef = useRef<HTMLInputElement>(null);

  // Card
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [showCvv, setShowCvv] = useState(false);

  // Bank Transfer
  const [bankReceipt, setBankReceipt] = useState('');
  const bankRef = useRef<HTMLInputElement>(null);

  // Net Banking
  const [bankName, setBankName] = useState('');

  // Processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingId, setBookingId] = useState('');

  // Errors
  const [detailsError, setDetailsError] = useState('');
  const [paymentError, setPaymentError] = useState('');

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
      setMethod('UPI');
      setUpiId(''); setUpiScreenshot('');
      setCardNumber(''); setCardName(''); setCardExpiry(''); setCardCvv(''); setShowCvv(false);
      setBankReceipt(''); setBankName('');
      setDetailsError(''); setPaymentError('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Helpers ──────────────────────────────────────────────────────────────

  const formatCard = (val: string) => {
    const d = val.replace(/\D/g, '').slice(0, 16);
    return d.replace(/(.{4})(?=.)/g, '$1 ');
  };

  const formatExpiry = (val: string) => {
    const d = val.replace(/\D/g, '').slice(0, 4);
    if (d.length > 2) return d.slice(0, 2) + '/' + d.slice(2);
    return d;
  };

  const detectCardType = (num: string): string => {
    const n = num.replace(/\s/g, '');
    if (/^4/.test(n)) return 'Visa';
    if (/^5[1-5]/.test(n)) return 'Mastercard';
    if (/^3[47]/.test(n)) return 'Amex';
    if (/^6/.test(n)) return 'Rupay';
    return '';
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // ── Validation ───────────────────────────────────────────────────────────

  const validateDetails = (): boolean => {
    if (!name.trim()) { setDetailsError('Please enter your full name.'); return false; }
    if (!email.trim() || !email.includes('@')) { setDetailsError('Please enter a valid email.'); return false; }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setDetailsError('Please enter a valid 10-digit phone number.'); return false;
    }
    return true;
  };

  const validatePayment = (): boolean => {
    if (method === 'UPI') {
      if (!upiId.includes('@') || upiId.length < 5) {
        setPaymentError('Enter a valid UPI ID (e.g. name@okicici).'); return false;
      }
    }
    if (method === 'Card') {
      const digits = cardNumber.replace(/\s/g, '');
      if (digits.length !== 16) { setPaymentError('Enter a valid 16-digit card number.'); return false; }
      if (!cardName.trim()) { setPaymentError('Enter the name as on your card.'); return false; }
      if (cardExpiry.length < 5) { setPaymentError('Enter expiry as MM/YY.'); return false; }
      const [mm, yy] = cardExpiry.split('/').map(Number);
      const now = new Date();
      const expDate = new Date(2000 + yy, mm - 1);
      if (!mm || mm > 12 || expDate < now) { setPaymentError('Card expiry date is invalid or expired.'); return false; }
      if (cardCvv.length < 3) { setPaymentError('Enter a valid CVV (3-4 digits).'); return false; }
    }
    if (method === 'Bank Transfer') {
      if (!bankReceipt) { setPaymentError('Please upload your transfer receipt.'); return false; }
    }
    if (method === 'Net Banking') {
      if (!bankName) { setPaymentError('Please select your bank.'); return false; }
    }
    return true;
  };

  // ── Handlers ─────────────────────────────────────────────────────────────

  const goToPayment = () => {
    setDetailsError('');
    if (validateDetails()) setStep('payment');
  };

  const goToConfirm = () => {
    setPaymentError('');
    if (validatePayment()) setStep('confirm');
  };

  const handlePay = () => {
    setIsProcessing(true);
    const id = 'KP-' + Math.random().toString(36).toUpperCase().slice(2, 8);
    setTimeout(() => {
      setBookingId(id);
      setIsProcessing(false);
      setStep('success');
      onSuccess(id, {
        customerName: name, customerEmail: email, customerPhone: phone,
        method, upiId, upiScreenshot, cardNumber, cardName, cardExpiry, bankReceipt, bankName,
      });
    }, 2000);
  };

  const maskedCard = cardNumber.replace(/\d(?=\d{4})/g, '•').replace(/\s/g, ' ');

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="bg-white w-full max-w-[440px] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
        style={{ maxHeight: '94vh' }}
      >

        {/* ── Fixed Header ── */}
        <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-[#F0F0F0]">
          {/* Step trail */}
          {step !== 'success' && (
            <div className="flex items-center gap-1.5 mb-3">
              {(['details', 'payment', 'confirm'] as const).map((s, i) => {
                const labels = ['Details', 'Payment', 'Review'];
                const idx = ['details', 'payment', 'confirm', 'success'].indexOf(step);
                const done = i < idx;
                const active = s === step;
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
                    {i < 2 && <div className={`flex-1 h-px ${done ? 'bg-[#8B735B]' : 'bg-[#E5E5E5]'}`} />}
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

          {/* STEP 2 — PAYMENT */}
          {step === 'payment' && (
            <div className="px-6 py-5 space-y-5">

              {paymentError && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs px-3 py-2 rounded-sm">
                  {paymentError}
                </div>
              )}

              {/* Method selector */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#999] mb-2">Payment Method</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['UPI', 'Card', 'Bank Transfer', 'Net Banking'] as const).map(m => (
                    <button key={m} type="button" onClick={() => { setMethod(m); setPaymentError(''); }}
                      className={`flex items-center gap-2 px-3 py-2.5 border text-[11px] font-medium transition-all
                        ${method === m ? 'border-[#2C2C2C] bg-[#2C2C2C] text-white' : 'border-[#E5E5E5] text-[#4A4A4A] hover:border-[#8B735B]'}`}>
                      <span className="text-base leading-none">
                        {m === 'UPI' && '📱'}
                        {m === 'Card' && '💳'}
                        {m === 'Bank Transfer' && '🏦'}
                        {m === 'Net Banking' && '🌐'}
                      </span>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── UPI Fields ── */}
              {method === 'UPI' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="bg-[#FAF9F6] border border-[#E5E5E5] p-4 rounded-sm text-center">
                    <p className="text-[9px] uppercase tracking-widest text-[#999] mb-1">Send payment to</p>
                    <p className="text-xl font-bold text-[#2C2C2C] tracking-wide">kalaprayag@upi</p>
                    <p className="text-[10px] text-[#999] mt-1">Amount: <strong className="text-[#2C2C2C]">₹ {total.toLocaleString()}</strong></p>
                    <div className="mt-3 pt-3 border-t border-[#E5E5E5] flex justify-center gap-3 text-[9px] text-[#999] uppercase tracking-widest">
                      <span>GPay</span><span>·</span><span>PhonePe</span><span>·</span><span>Paytm</span><span>·</span><span>BHIM</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-1.5">Your UPI ID *</label>
                    <input value={upiId} onChange={e => setUpiId(e.target.value.trim())}
                      placeholder="yourname@okicici"
                      className="w-full border border-[#E5E5E5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#2C2C2C] font-mono" />
                    <p className="text-[10px] text-[#CCC] mt-1">Enter the UPI ID you'll pay from, for confirmation</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-1.5">Upload Payment Screenshot <span className="text-[#CCC] normal-case">(optional but recommended)</span></label>
                    <input ref={upiRef} type="file" accept="image/*" className="hidden"
                      onChange={e => handleFileUpload(e, setUpiScreenshot)} />
                    {upiScreenshot ? (
                      <div className="relative rounded-sm overflow-hidden border border-[#E5E5E5]">
                        <img src={upiScreenshot} className="w-full h-28 object-cover" alt="UPI proof" />
                        <button type="button" onClick={() => setUpiScreenshot('')}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">✕</button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[10px] px-2 py-1 uppercase tracking-widest">
                          Screenshot uploaded ✓
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => upiRef.current?.click()}
                        className="w-full border-2 border-dashed border-[#E5E5E5] py-4 rounded-sm text-[10px] text-[#999] uppercase tracking-widest hover:border-[#8B735B] hover:text-[#8B735B] transition-colors flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload Screenshot
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── Card Fields ── */}
              {method === 'Card' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* SSL */}
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-sm">
                    <svg className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-[10px] text-emerald-700 uppercase tracking-widest">256-bit SSL · Your data is encrypted</span>
                  </div>

                  {/* Card number */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-1.5">Card Number *</label>
                    <div className="relative">
                      <input
                        value={cardNumber}
                        onChange={e => setCardNumber(formatCard(e.target.value))}
                        placeholder="0000  0000  0000  0000"
                        maxLength={19}
                        className="w-full border border-[#E5E5E5] px-3 py-2.5 pr-20 text-sm focus:outline-none focus:border-[#2C2C2C] font-mono tracking-widest"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {detectCardType(cardNumber) ? (
                          <span className="text-[11px] font-bold text-[#8B735B] uppercase tracking-wider">
                            {detectCardType(cardNumber)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#CCC]">CARD</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-1.5">Name on Card *</label>
                    <input
                      value={cardName}
                      onChange={e => setCardName(e.target.value.toUpperCase())}
                      placeholder="AS PRINTED ON CARD"
                      className="w-full border border-[#E5E5E5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#2C2C2C] font-mono tracking-wider uppercase"
                    />
                  </div>

                  {/* Expiry + CVV */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-1.5">Expiry Date *</label>
                      <input
                        value={cardExpiry}
                        onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                        placeholder="MM / YY"
                        maxLength={5}
                        className="w-full border border-[#E5E5E5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#2C2C2C] text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-1.5">
                        CVV * &nbsp;
                        <button type="button" onClick={() => setShowCvv(v => !v)}
                          className="text-[#8B735B] hover:underline normal-case">
                          {showCvv ? 'hide' : 'show'}
                        </button>
                      </label>
                      <input
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="• • •"
                        type={showCvv ? 'text' : 'password'}
                        maxLength={4}
                        className="w-full border border-[#E5E5E5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#2C2C2C] text-center font-mono"
                      />
                      <p className="text-[9px] text-[#CCC] mt-1 text-center">3–4 digits on back of card</p>
                    </div>
                  </div>

                  {/* Card type logos row */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[9px] text-[#CCC] uppercase tracking-widest">Accepted:</span>
                    {['Visa', 'Mastercard', 'RuPay', 'Amex'].map(c => (
                      <span key={c} className="text-[9px] border border-[#E5E5E5] px-2 py-0.5 text-[#999] rounded-sm">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Bank Transfer Fields ── */}
              {method === 'Bank Transfer' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="bg-[#FAF9F6] border border-[#E5E5E5] p-4 space-y-2 text-sm rounded-sm">
                    <p className="text-[9px] uppercase tracking-widest text-[#999] mb-2">Transfer Details</p>
                    <div className="flex justify-between"><span className="text-[#999]">Account Name</span><span className="font-medium">Kala Prayag Heritage Collective</span></div>
                    <div className="flex justify-between"><span className="text-[#999]">Account No.</span><span className="font-mono font-medium">1234 5678 9012</span></div>
                    <div className="flex justify-between"><span className="text-[#999]">IFSC Code</span><span className="font-mono font-medium">HDFC0001234</span></div>
                    <div className="flex justify-between"><span className="text-[#999]">Bank</span><span className="font-medium">HDFC Bank</span></div>
                    <div className="flex justify-between border-t border-[#E5E5E5] pt-2 mt-1">
                      <span className="text-[#999]">Amount to Transfer</span>
                      <span className="font-bold text-[#2C2C2C]">₹ {total.toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-1.5">Upload Transfer Receipt *</label>
                    <input ref={bankRef} type="file" accept="image/*,application/pdf" className="hidden"
                      onChange={e => handleFileUpload(e, setBankReceipt)} />
                    {bankReceipt ? (
                      <div className="relative rounded-sm overflow-hidden border border-[#E5E5E5]">
                        <img src={bankReceipt} className="w-full h-28 object-cover" alt="Receipt" />
                        <button type="button" onClick={() => setBankReceipt('')}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">✕</button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[10px] px-2 py-1 uppercase tracking-widest">
                          Receipt uploaded ✓
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => bankRef.current?.click()}
                        className="w-full border-2 border-dashed border-[#E5E5E5] py-6 rounded-sm flex flex-col items-center gap-2 text-[10px] text-[#999] uppercase tracking-widest hover:border-[#8B735B] hover:text-[#8B735B] transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload Receipt / Screenshot
                        <span className="text-[9px] text-[#CCC] normal-case">JPG, PNG or PDF</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── Net Banking Fields ── */}
              {method === 'Net Banking' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-1.5">Select Your Bank *</label>
                    <select value={bankName} onChange={e => setBankName(e.target.value)}
                      className="w-full border border-[#E5E5E5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#2C2C2C] bg-white">
                      <option value="">-- Choose your bank --</option>
                      {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  {bankName && (
                    <div className="bg-blue-50 border border-blue-100 px-3 py-3 rounded-sm animate-in fade-in duration-200">
                      <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">Next Step</p>
                      <p className="text-xs text-blue-700">
                        After clicking "Review & Pay", you'll be redirected to <strong>{bankName}</strong>'s secure net banking portal to complete payment of <strong>₹ {total.toLocaleString()}</strong>.
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* STEP 3 — CONFIRM / REVIEW */}
          {step === 'confirm' && (
            <div className="px-6 py-5 space-y-4">
              <p className="text-[10px] uppercase tracking-widest text-[#999]">Review your booking</p>

              {/* Customer summary */}
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

              {/* Payment summary */}
              <div className="border border-[#E5E5E5] divide-y divide-[#F0F0F0] text-sm">
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-[#999] text-xs">Payment via</span>
                  <span className="font-medium">
                    {method === 'UPI' && `UPI (${upiId})`}
                    {method === 'Card' && `Card ending ••${cardNumber.replace(/\s/g, '').slice(-4)}`}
                    {method === 'Bank Transfer' && 'Bank Transfer'}
                    {method === 'Net Banking' && `Net Banking · ${bankName}`}
                  </span>
                </div>
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

              <p className="text-[10px] text-[#999] leading-relaxed">
                By confirming, you agree to Kala Prayag's booking terms. Confirmation will be sent to <strong>{email}</strong>.
              </p>
            </div>
          )}

          {/* STEP 4 — SUCCESS */}
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
                <div className="flex justify-between"><span className="text-[#999]">Method</span>
                  <span>
                    {method === 'UPI' && 'UPI'}
                    {method === 'Card' && `Card ••${cardNumber.replace(/\s/g, '').slice(-4)}`}
                    {method === 'Bank Transfer' && 'Bank Transfer'}
                    {method === 'Net Banking' && bankName}
                  </span>
                </div>
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

        </div>

        {/* ── Fixed Footer ── */}
        {step !== 'success' && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-[#F0F0F0] space-y-2">
            {step === 'details' && (
              <button onClick={goToPayment}
                className="w-full bg-[#2C2C2C] text-white py-3.5 text-xs uppercase tracking-[0.3em] font-bold hover:bg-[#8B735B] transition-all">
                Continue to Payment →
              </button>
            )}
            {step === 'payment' && (
              <div className="flex gap-2">
                <button onClick={() => setStep('details')}
                  className="px-4 py-3.5 border border-[#D1D1D1] text-xs uppercase tracking-widest hover:border-[#2C2C2C] transition-all whitespace-nowrap">
                  ← Back
                </button>
                <button onClick={goToConfirm}
                  className="flex-1 bg-[#2C2C2C] text-white py-3.5 text-xs uppercase tracking-[0.3em] font-bold hover:bg-[#8B735B] transition-all">
                  Review & Pay →
                </button>
              </div>
            )}
            {step === 'confirm' && (
              <div className="flex gap-2">
                <button onClick={() => setStep('payment')}
                  className="px-4 py-3.5 border border-[#D1D1D1] text-xs uppercase tracking-widest hover:border-[#2C2C2C] transition-all whitespace-nowrap">
                  ← Edit
                </button>
                <button onClick={handlePay} disabled={isProcessing}
                  className="flex-1 bg-[#8B735B] text-white py-3.5 text-xs uppercase tracking-[0.3em] font-bold hover:bg-[#2C2C2C] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </>
                  ) : `Confirm Payment ₹ ${total.toLocaleString()}`}
                </button>
              </div>
            )}
            <p className="text-[9px] text-center text-[#CCC] uppercase tracking-widest">
              🔒 Secured · No card data stored · Cancel anytime
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentModal;
