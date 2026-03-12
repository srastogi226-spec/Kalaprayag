import React, { useState, useRef } from 'react';
import { CustomOrder, Artisan } from '../types';
import { CATEGORIES } from '../constants.tsx';
import { openRazorpay } from '../services/razorpay';

interface CustomStudioProps {
  onSubmitOrder: (order: CustomOrder) => Promise<void> | void;
  artisans: Artisan[];
  preSelectedArtisanId?: string | null;
  onViewInvoice?: () => void;
}


const TOTAL_STEPS = 6;

const STEPS = [
  { num: 1, label: 'Contact' },
  { num: 2, label: 'Category' },
  { num: 3, label: 'Artisan' },
  { num: 4, label: 'Dimensions' },
  { num: 5, label: 'Design' },
  { num: 6, label: 'Payment' },
];

function getSizeMultiplier(size: string): number {
  if (!size || size === 'custom') return 1;
  const s = size.toLowerCase();
  const nums = size.match(/[\d.]+/g);
  if (!nums) return 1;
  const w = parseFloat(nums[0]);
  const h = parseFloat(nums[1] || nums[0]);
  const area = w * h;
  if (s.includes('ft')) {
    if (area <= 2) return 1; if (area <= 6) return 1.5;
    if (area <= 12) return 2.2; if (area <= 24) return 3.5; return 5;
  } else if (s.includes(' m')) {
    if (area <= 0.5) return 1; if (area <= 1.5) return 2;
    if (area <= 4) return 3.5; return 6;
  } else if (s.includes('in')) {
    if (area <= 48) return 0.8; if (area <= 120) return 1;
    if (area <= 480) return 1.8; return 2.5;
  } else {
    if (area <= 200) return 0.7; if (area <= 600) return 1;
    if (area <= 1800) return 1.6; if (area <= 5400) return 2.5; return 4;
  }
}

function getDeliveryEstimate(size: string): string {
  if (!size || size === 'custom') return '3 – 4 weeks';
  const s = size.toLowerCase();
  const nums = size.match(/[\d.]+/g);
  if (!nums) return '3 – 4 weeks';
  const w = parseFloat(nums[0]); const h = parseFloat(nums[1] || nums[0]);
  const area = w * h;
  if (s.includes('ft')) {
    if (area <= 4) return '2 – 3 weeks'; if (area <= 16) return '3 – 5 weeks'; return '5 – 8 weeks';
  } else if (s.includes('m')) {
    if (area <= 1) return '2 – 3 weeks'; if (area <= 4) return '4 – 6 weeks'; return '6 – 10 weeks';
  } else {
    if (area <= 400) return '1 – 2 weeks'; if (area <= 2500) return '3 – 4 weeks'; return '4 – 6 weeks';
  }
}

const CustomStudio: React.FC<CustomStudioProps> = ({ onSubmitOrder, artisans, onViewInvoice }) => {
  const [step, setStep] = useState(1);
  const [savedDraft, setSavedDraft] = useState(false);

  // Step 1 - Contact
  const [contact, setContact] = useState({ name: '', email: '', phone: '', preferredTime: 'Morning (9am–12pm)' });

  // Step 2 - Category
  const productCategories = CATEGORIES.filter(c => c !== 'All');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Step 3 - Artisan
  const [selectedArtisan, setSelectedArtisan] = useState<Artisan | null>(null);

  // Step 4 - Dimensions
  const [dimSize, setDimSize] = useState('');
  const [dimCustom, setDimCustom] = useState('');
  const [dimDepth, setDimDepth] = useState('');

  // Step 5 - Design
  const [design, setDesign] = useState({ concept: '', finish: 'Natural', specialInstructions: '' });
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 6 - Payment
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [paymentAgreed, setPaymentAgreed] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [orderPaymentId, setOrderPaymentId] = useState('');

  // Filtered artisans by category — match on categories array OR craftType string
  const categoryArtisans = artisans.filter(a => {
    if (a.status !== 'approved') return false;
    const cats = a.categories?.length ? a.categories : [a.craftType];
    return cats.some(c => c?.toLowerCase() === selectedCategory?.toLowerCase());
  });

  // Price calculation from artisan's custom pricing
  const artisanBasePrice = selectedArtisan?.customPricing?.[selectedCategory] || 0;
  const multiplier = getSizeMultiplier(dimSize);
  const estimatedTotal = artisanBasePrice > 0
    ? Math.round((artisanBasePrice * multiplier) / 100) * 100
    : 0;
  const suggestedAdvance = Math.round((estimatedTotal * 0.3) / 100) * 100;
  const finalDimensions = dimSize === 'custom'
    ? (dimCustom ? `${dimCustom}${dimDepth ? ' × ' + dimDepth + ' depth' : ''}` : '')
    : (dimSize ? `${dimSize}${dimDepth ? ' × ' + dimDepth + ' depth' : ''}` : '');
  const deliveryEstimate = getDeliveryEstimate(dimSize);

  // Step validation
  const stepValid = [
    contact.name && contact.email && contact.phone,
    !!selectedCategory,
    !!selectedArtisan,
    !!(dimSize && (dimSize !== 'custom' || dimCustom)),
    !!design.concept,
    paymentAgreed,
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => setReferenceImages(prev => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSaveDraft = () => {
    setSavedDraft(true);
    setTimeout(() => setSavedDraft(false), 2500);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setPaymentError('');
    const advAmt = Number(advanceAmount) || suggestedAdvance;
    openRazorpay({
      amount: advAmt,
      description: `Custom Commission Advance — ${design.concept.slice(0, 50)}`,
      customerName: contact.name,
      customerEmail: contact.email,
      customerPhone: contact.phone,
      onSuccess: (response) => {
        const id = 'ORD-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        const newOrder: CustomOrder = {
          id,
          customerName: contact.name,
          email: contact.email,
          phone: contact.phone,
          concept: design.concept + (design.specialInstructions ? `\n\nSpecial Instructions: ${design.specialInstructions}` : ''),
          dimensions: finalDimensions,
          size: finalDimensions,
          finish: design.finish,
          category: selectedCategory,
          assignedArtisanId: selectedArtisan?.id || '',
          assignedArtisanName: selectedArtisan?.brandName || selectedArtisan?.name || '',
          adminStatus: 'pending',
          artisanStatus: 'waiting',
          status: 'pending',
          advancePayment: {
            amount: advAmt,
            method: 'Razorpay',
            paid: true,
            paymentId: response.razorpay_payment_id,
          },
          createdAt: new Date().toISOString(),
        };
        onSubmitOrder(newOrder);
        setOrderId(id);
        setOrderPaymentId(response.razorpay_payment_id);
        setIsSubmitting(false);
        setIsSuccess(true);
      },
      onFailure: (error) => {
        setIsSubmitting(false);
        setPaymentError(error.message || 'Payment failed. Please try again.');
      },
    });
  };

  const resetAll = () => {
    setStep(1); setContact({ name: '', email: '', phone: '', preferredTime: 'Morning (9am–12pm)' });
    setSelectedCategory(''); setSelectedArtisan(null);
    setDimSize(''); setDimCustom(''); setDimDepth('');
    setDesign({ concept: '', finish: 'Natural', specialInstructions: '' });
    setReferenceImages([]);
    setAdvanceAmount(''); setPaymentAgreed(false); setIsSuccess(false); setPaymentError('');
  };

  // ─── Success Screen ────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="pt-32 pb-24 min-h-screen flex flex-col items-center justify-center px-6 animate-in fade-in duration-700">
        <div className="max-w-lg w-full text-center">
          <div className="w-24 h-24 bg-[#8B735B]/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-12 h-12 text-[#8B735B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl serif mb-4">Order Placed!</h1>
          <p className="text-[10px] uppercase tracking-widest text-[#8B735B] mb-2">Order ID: {orderId}</p>
          {orderPaymentId && <p className="text-[10px] uppercase tracking-widest text-[#8B735B] mb-8">Payment ID: <span className="font-mono">{orderPaymentId}</span></p>}

          <div className="bg-white border border-[#E5E5E5] p-8 text-left space-y-4 mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-[#999]">Artisan</span>
              <span className="font-medium">{selectedArtisan?.brandName || selectedArtisan?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#999]">Category</span>
              <span className="font-medium">{selectedCategory}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#999]">Dimensions</span>
              <span className="font-medium">{finalDimensions}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#999]">Estimated Delivery</span>
              <span className="font-medium text-[#8B735B]">{deliveryEstimate}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-[#F0F0F0] pt-4">
              <span className="text-[#999]">Advance Amount</span>
              <span className="font-bold text-lg serif">₹ {(Number(advanceAmount) || suggestedAdvance).toLocaleString()}</span>
            </div>
          </div>

          {/* WhatsApp confirmation */}
          <button
            onClick={onViewInvoice}
            className="flex items-center justify-center gap-3 w-full border border-[#2C2C2C] py-4 text-xs uppercase tracking-widest font-bold mb-4 hover:bg-[#2C2C2C] hover:text-white transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Invoice
          </button>
          <a
            href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(contact.name)}!%20Your%20custom%20order%20${orderId}%20has%20been%20placed%20with%20Kala%20Prayag.%20Your%20artisan%20${encodeURIComponent(selectedArtisan?.name || '')}%20will%20contact%20you%20soon.%20Estimated%20delivery%3A%20${encodeURIComponent(deliveryEstimate)}.`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-3 w-full bg-[#25D366] text-white py-4 text-xs uppercase tracking-widest font-bold mb-4 hover:opacity-90 transition-all"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.528 5.845L.057 23.214a.75.75 0 00.921.921l5.37-1.47A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.667-.502-5.203-1.378l-.374-.214-3.876 1.059 1.06-3.877-.214-.374A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" /></svg>
            Share on WhatsApp
          </a>
          <button onClick={resetAll} className="w-full border border-[#2C2C2C] py-4 text-xs uppercase tracking-widest hover:bg-[#2C2C2C] hover:text-white transition-all">
            Place Another Order
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Form ─────────────────────────────────────────────────────────────
  return (
    <div className="pt-32 pb-24 min-h-screen animate-in fade-in duration-700">
      {/* Header */}
      <div className="max-w-3xl mx-auto px-6 mb-12 text-center">
        <span className="text-xs uppercase tracking-widest text-[#8B735B] mb-4 block">Bespoke Design</span>
        <h1 className="text-5xl serif mb-4">The Custom Studio</h1>
        <p className="text-[#666] font-light max-w-xl mx-auto leading-relaxed text-sm">
          Commission a one-of-a-kind piece directly from a master artisan.
        </p>
      </div>

      {/* Progress Stepper - Minimal dots */}
      <div className="max-w-3xl mx-auto px-6 mb-16 h-8 relative">
        <div className="flex items-center justify-center gap-3 relative">
          {STEPS.map(s => (
            <div key={s.num} className="flex flex-col items-center gap-2 group relative">
              <div
                className={`h-1 transition-all duration-500 rounded-full ${s.num < step ? 'bg-[#8B735B] w-8'
                  : s.num === step ? 'bg-[#2C2C2C] w-12'
                    : 'bg-[#E5E5E5] w-6'
                  }`}
              />
              {s.num === step && (
                <span className="absolute top-4 text-[9px] uppercase tracking-widest text-[#2C2C2C] font-bold whitespace-nowrap animate-in fade-in duration-500">
                  {s.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Card */}
      <div className="max-w-3xl mx-auto px-4 md:px-0">
        <div className="bg-white p-4 md:p-10 text-left">

          {/* ── STEP 1: Contact ──────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-2xl serif mb-1">Let's start with you</h2>
                <p className="text-xs text-[#999]">We'll use this to send your order confirmation and connect you with your artisan.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Full Name *</label>
                  <input type="text" required className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none focus:border-[#2C2C2C] transition-colors text-sm" value={contact.name} onChange={e => setContact({ ...contact, name: e.target.value })} placeholder="Your full name" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Email Address *</label>
                  <input type="email" required className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none focus:border-[#2C2C2C] transition-colors text-sm" value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} placeholder="your@email.com" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">WhatsApp / Phone *</label>
                  <input type="tel" required className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none focus:border-[#2C2C2C] transition-colors text-sm" value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} placeholder="+91 00000 00000" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Preferred Contact Time</label>
                  <select className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none focus:border-[#2C2C2C] bg-white text-sm" value={contact.preferredTime} onChange={e => setContact({ ...contact, preferredTime: e.target.value })}>
                    <option>Morning (9am – 12pm)</option>
                    <option>Afternoon (12pm – 4pm)</option>
                    <option>Evening (4pm – 8pm)</option>
                    <option>Any time</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Category ─────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-2xl serif mb-1">What would you like crafted?</h2>
                <p className="text-xs text-[#999]">Select a category — we'll show you artisans who specialise in it.</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Product Category *</label>
                <select required className="w-full border-b border-[#D1D1D1] py-3 focus:outline-none focus:border-[#2C2C2C] bg-white text-sm" value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setSelectedArtisan(null); }}>
                  <option value="">— Choose a category —</option>
                  {productCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              {selectedCategory && (
                <div className="bg-[#FAF9F6] border border-[#F0F0F0] p-5 flex items-center gap-4 animate-in fade-in duration-300">
                  <svg className="w-5 h-5 text-[#8B735B] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <p className="text-xs text-[#666]">
                    <strong>{categoryArtisans.length}</strong> artisan{categoryArtisans.length !== 1 ? 's' : ''} available for <strong>{selectedCategory}</strong>. You'll pick your preferred one in the next step.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Artisan ──────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-2xl serif mb-1">Choose your artisan</h2>
                <p className="text-xs text-[#999]">Your order goes directly to them. They will contact you within 48 hours.</p>
              </div>

              {categoryArtisans.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-[#D1D1D1]">
                  <p className="text-[#999] serif text-xl italic mb-2">No artisans available yet</p>
                  <p className="text-xs text-[#BBB]">Our team is onboarding {selectedCategory} artisans. Please check back soon.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {categoryArtisans.map(artisan => {
                    const price = artisan.customPricing?.[selectedCategory];
                    const isSelected = selectedArtisan?.id === artisan.id;
                    return (
                      <button
                        key={artisan.id}
                        type="button"
                        onClick={() => setSelectedArtisan(artisan)}
                        className={`w-full text-left p-6 border-2 transition-all duration-200 flex items-center gap-6 ${isSelected ? 'border-[#8B735B] bg-[#FAF9F6]' : 'border-[#E5E5E5] hover:border-[#8B735B]/50'
                          }`}
                      >
                        <img src={artisan.profilePhoto} className="w-16 h-16 rounded-full object-cover border border-gray-100 flex-shrink-0" alt={artisan.name} onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'; }} />
                        <div className="flex-grow">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-[#2C2C2C]">{artisan.brandName || artisan.name}</h3>
                            <span className="text-[9px] uppercase tracking-widest bg-green-50 text-green-700 px-2 py-0.5 rounded">Available</span>
                          </div>
                          <p className="text-xs text-[#8B735B] uppercase tracking-widest mb-2">{artisan.craftType} · {artisan.location}</p>
                          <p className="text-xs text-[#666] line-clamp-2">{artisan.bio}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex text-amber-400">
                              {[...Array(5)].map((_, i) => (
                                <svg key={i} className={`w-3 h-3 ${i < Math.floor(artisan.rating || 0) ? 'fill-current' : 'fill-gray-200'}`} viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                              ))}
                              <span className="text-[10px] text-[#999] ml-1">{artisan.rating || 'New'}</span>
                            </div>
                            <span className="text-[10px] text-[#999]">{artisan.experience} yrs experience</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {price ? (
                            <>
                              <p className="text-[10px] text-[#999] uppercase tracking-widest mb-1">Starting from</p>
                              <p className="text-xl serif text-[#2C2C2C]">₹ {price.toLocaleString()}</p>
                            </>
                          ) : (
                            <p className="text-xs text-[#999] italic">Contact for price</p>
                          )}
                          {isSelected && (
                            <div className="mt-2 bg-[#8B735B] text-white text-[9px] uppercase tracking-widest px-3 py-1">
                              Selected ✓
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4: Dimensions ───────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-2xl serif mb-1">What size do you need?</h2>
                <p className="text-xs text-[#999]">Select from standard sizes or enter a custom dimension.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Size (Width × Height) *</label>
                  <select required className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none focus:border-[#2C2C2C] bg-white text-sm" value={dimSize} onChange={e => { setDimSize(e.target.value); setDimCustom(''); }}>
                    <option value="">— Select a size —</option>
                    <optgroup label="── Centimeters (cm) ──">
                      <option value="10 × 10 cm">10 × 10 cm</option>
                      <option value="15 × 20 cm">15 × 20 cm</option>
                      <option value="20 × 30 cm">20 × 30 cm</option>
                      <option value="30 × 40 cm">30 × 40 cm</option>
                      <option value="40 × 60 cm">40 × 60 cm</option>
                      <option value="50 × 70 cm">50 × 70 cm</option>
                      <option value="60 × 90 cm">60 × 90 cm</option>
                      <option value="90 × 120 cm">90 × 120 cm</option>
                      <option value="100 × 150 cm">100 × 150 cm</option>
                      <option value="120 × 180 cm">120 × 180 cm</option>
                    </optgroup>
                    <optgroup label="── Inches (in) ──">
                      <option value="4 × 6 in">4 × 6 in</option>
                      <option value="5 × 7 in">5 × 7 in</option>
                      <option value="8 × 10 in">8 × 10 in</option>
                      <option value="12 × 16 in">12 × 16 in</option>
                      <option value="16 × 20 in">16 × 20 in</option>
                      <option value="18 × 24 in">18 × 24 in</option>
                      <option value="24 × 36 in">24 × 36 in</option>
                      <option value="36 × 48 in">36 × 48 in</option>
                    </optgroup>
                    <optgroup label="── Feet (ft) ──">
                      <option value="1 × 1 ft">1 × 1 ft</option>
                      <option value="2 × 2 ft">2 × 2 ft</option>
                      <option value="2 × 3 ft">2 × 3 ft</option>
                      <option value="3 × 4 ft">3 × 4 ft</option>
                      <option value="4 × 6 ft">4 × 6 ft</option>
                      <option value="6 × 8 ft">6 × 8 ft</option>
                      <option value="8 × 10 ft">8 × 10 ft</option>
                    </optgroup>
                    <optgroup label="── Meters (m) ──">
                      <option value="0.5 × 0.5 m">0.5 × 0.5 m</option>
                      <option value="1 × 1 m">1 × 1 m</option>
                      <option value="1 × 1.5 m">1 × 1.5 m</option>
                      <option value="1.5 × 2 m">1.5 × 2 m</option>
                      <option value="2 × 3 m">2 × 3 m</option>
                      <option value="3 × 4 m">3 × 4 m</option>
                    </optgroup>
                    <optgroup label="── Custom ──">
                      <option value="custom">✏ Enter my own size</option>
                    </optgroup>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Depth <span className="normal-case text-[9px]">(optional)</span></label>
                  <select className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none focus:border-[#2C2C2C] bg-white text-sm" value={dimDepth} onChange={e => setDimDepth(e.target.value)}>
                    <option value="">— No depth / N/A —</option>
                    <optgroup label="── Centimeters ──">
                      {['5 cm', '10 cm', '15 cm', '20 cm', '25 cm', '30 cm', '40 cm', '50 cm'].map(d => <option key={d}>{d}</option>)}
                    </optgroup>
                    <optgroup label="── Inches ──">
                      {['1 in', '2 in', '3 in', '4 in', '6 in', '8 in', '12 in'].map(d => <option key={d}>{d}</option>)}
                    </optgroup>
                    <optgroup label="── Feet ──">
                      {['0.5 ft', '1 ft', '1.5 ft', '2 ft', '3 ft'].map(d => <option key={d}>{d}</option>)}
                    </optgroup>
                  </select>
                </div>
              </div>

              {dimSize === 'custom' && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Enter Your Custom Size *</label>
                  <input type="text" required placeholder="e.g. 45 × 90 cm  or  2.5ft × 4ft" className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none focus:border-[#2C2C2C] text-sm" value={dimCustom} onChange={e => setDimCustom(e.target.value)} />
                </div>
              )}

              {finalDimensions && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#FAF9F6] border border-[#F0F0F0] p-4 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-[#999] mb-1">Your Size</p>
                    <p className="text-sm font-semibold text-[#2C2C2C]">{finalDimensions}</p>
                  </div>
                  <div className="bg-[#FAF9F6] border border-[#F0F0F0] p-4 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-[#999] mb-1">Est. Delivery</p>
                    <p className="text-sm font-semibold text-[#8B735B]">{deliveryEstimate}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 5: Design Details ───────────────────────────── */}
          {step === 5 && (
            <>
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div>
                  <h2 className="text-2xl serif mb-1">Describe your vision</h2>
                  <p className="text-xs text-[#999]">The more detail you share, the closer the final piece will be to your dream.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold flex justify-between items-center">
                    <span>Concept Description *</span>
                  </label>
                  <textarea required placeholder="Describe the piece — style, material, colours, inspiration, where it will go in your home room..." className="w-full bg-transparent border-b-2 border-[#D1D1D1] py-4 text-xl font-light serif focus:outline-none focus:border-[#8B735B] min-h-[120px] transition-colors resize-none leading-relaxed" value={design.concept} onChange={e => setDesign({ ...design, concept: e.target.value })}></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Preferred Finish</label>
                    <select className="w-full border-b-2 border-[#D1D1D1] py-3 focus:outline-none focus:border-[#8B735B] bg-transparent text-lg font-light serif" value={design.finish} onChange={e => setDesign({ ...design, finish: e.target.value })}>
                      <option>Natural</option>
                      <option>Matte Black</option>
                      <option>Antique Gold</option>
                      <option>Burnished Silver</option>
                      <option>Rustic Wood</option>
                      <option>Polished Brass</option>
                      <option>Raw / Unfinished</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Special Instructions</label>
                    <input type="text" placeholder="Gifting? Specific deadline? Allergies?" className="w-full border-b-2 border-[#D1D1D1] py-3 focus:outline-none focus:border-[#8B735B] text-lg font-light serif bg-transparent" value={design.specialInstructions} onChange={e => setDesign({ ...design, specialInstructions: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="pt-10 mt-10 border-t border-[#F0F0F0] space-y-3">
                <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Reference Images <span className="normal-case text-[9px] text-[#BBB]">(optional — helps artisan understand your vision)</span></label>
                <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {referenceImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-square group rounded border border-[#E5E5E5] overflow-hidden">
                      <img src={img} className="w-full h-full object-cover" alt="" />
                      <button onClick={e => { e.stopPropagation(); setReferenceImages(prev => prev.filter((_, i) => i !== idx)); }} className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-red-500">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                  <div onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-[#E5E5E5] rounded flex flex-col items-center justify-center cursor-pointer hover:border-[#8B735B] hover:bg-[#FAF9F6] transition-all text-[#BBB]">
                    <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                    <span className="text-[8px] uppercase tracking-widest">Add</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── STEP 6: Payment ──────────────────────────────────── */}
          {step === 6 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-2xl serif mb-1">Advance Payment</h2>
                <p className="text-xs text-[#999]">A 30% advance confirms your order and begins production.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left Column: Bespoke Receipt */}
                <div className="col-span-1 bg-[#FAF9F6] p-8 border border-[#E5E5E5] relative shadow-sm">
                  {/* Decorative zig-zag top */}
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSI1Ij48cGF0aCBkPSJNMCAwbDUgNSA1LTVWMGgxMFoiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMCAwcjUgNSA1TVYwaDEwWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRTVFNUU1IiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvc3ZnPg==')] -mt-1.5 opacity-50"></div>

                  <div className="text-center mb-8 border-b border-[#E5E5E5] pb-6">
                    <p className="text-[9px] uppercase tracking-widest text-[#8B735B] mb-2 font-bold">Quotation</p>
                    <h3 className="serif text-xl text-[#2C2C2C]">Commission Details</h3>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-end border-b border-dotted border-[#D1D1D1] pb-1"><span className="text-[10px] uppercase tracking-widest text-[#999]">Artisan</span><span className="text-sm font-semibold text-[#2C2C2C]">{selectedArtisan?.brandName || selectedArtisan?.name}</span></div>
                    <div className="flex justify-between items-end border-b border-dotted border-[#D1D1D1] pb-1"><span className="text-[10px] uppercase tracking-widest text-[#999]">Category</span><span className="text-sm font-semibold text-[#2C2C2C]">{selectedCategory}</span></div>
                    <div className="flex justify-between items-end border-b border-dotted border-[#D1D1D1] pb-1"><span className="text-[10px] uppercase tracking-widest text-[#999]">Dimensions</span><span className="text-sm font-semibold text-[#2C2C2C]">{finalDimensions}</span></div>
                    <div className="flex justify-between items-end border-b border-dotted border-[#D1D1D1] pb-1"><span className="text-[10px] uppercase tracking-widest text-[#999]">Finish</span><span className="text-sm font-semibold text-[#2C2C2C]">{design.finish}</span></div>
                    <div className="flex justify-between items-end border-b border-dotted border-[#D1D1D1] pb-1"><span className="text-[10px] uppercase tracking-widest text-[#999]">Est. Delivery</span><span className="text-sm font-semibold text-[#8B735B]">{deliveryEstimate}</span></div>
                  </div>

                  {estimatedTotal > 0 ? (
                    <div className="pt-2">
                      <p className="text-[9px] uppercase tracking-widest text-[#999] mb-4 text-center">Cost Estimate</p>
                      <div className="flex justify-between mb-2"><span className="text-xs text-[#666]">Base Rate</span><span className="text-sm">₹ {artisanBasePrice.toLocaleString()}</span></div>
                      <div className="flex justify-between mb-4"><span className="text-xs text-[#666]">Size Factor</span><span className="text-sm">× {multiplier.toFixed(1)}</span></div>
                      <div className="flex justify-between items-baseline mb-6"><span className="text-[10px] uppercase tracking-widest font-bold text-[#2C2C2C]">Estimated Total</span><span className="text-xl serif">₹ {estimatedTotal.toLocaleString()}</span></div>

                      <div className="bg-[#2C2C2C] text-white p-6 text-center transform scale-105 shadow-md">
                        <p className="text-[9px] uppercase tracking-widest text-white/50 mb-1">Advance Required (30%)</p>
                        <p className="text-3xl serif text-[#E6D5C3]">₹ {suggestedAdvance.toLocaleString()}</p>
                      </div>
                      <p className="text-center text-[9px] uppercase tracking-widest text-[#999] mt-6">Balance of ₹ {(estimatedTotal - suggestedAdvance).toLocaleString()} due on delivery</p>
                    </div>
                  ) : (
                    <div className="pt-6 border-t border-dashed border-[#D1D1D1] text-center">
                      <p className="text-[10px] uppercase tracking-widest text-[#999] mb-2">Price To Be Determined</p>
                      <p className="text-xs text-[#666] italic leading-relaxed">Artisan will review your design and provide a custom quote shortly.</p>
                    </div>
                  )}

                  {/* Decorative zig-zag bottom */}
                  <div className="absolute bottom-0 left-0 w-full h-1.5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSI1Ij48cGF0aCBkPSJNMCAwbDUgNSA1LTVWMGgxMFoiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMCAwcjUgNSA1TVYwaDEwWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRTVFNUU1IiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvc3ZnPg==')] -mb-1.5 transform rotate-180 opacity-50"></div>
                </div>

                {/* Right Column: Payment Inputs */}
                <div className="col-span-1 flex flex-col justify-center space-y-8 pl-0 md:pl-4">
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold block">
                      Advance Amount (₹)
                      {suggestedAdvance > 0 && (
                        <button type="button" onClick={() => setAdvanceAmount(String(suggestedAdvance))} className="ml-3 text-[#8B735B] normal-case hover:underline font-normal text-xs">
                          Use Suggested ₹ {suggestedAdvance.toLocaleString()}
                        </button>
                      )}
                    </label>
                    <div className="relative">
                      <span className="absolute left-0 top-3 text-[#999] text-xl serif">₹</span>
                      <input type="number" min="0" placeholder={suggestedAdvance > 0 ? String(suggestedAdvance) : 'Enter amount'} className="w-full bg-transparent border-b-2 border-[#D1D1D1] py-3 pl-6 focus:outline-none focus:border-[#8B735B] text-2xl font-light serif transition-colors" value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-2">
                    <svg className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-[10px] text-emerald-700 uppercase tracking-widest">Secure payment via Razorpay · UPI, Cards, Net Banking</span>
                  </div>

                  {paymentError && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-xs px-3 py-2">
                      {paymentError}
                      <button onClick={() => setPaymentError('')} className="ml-2 underline">Dismiss</button>
                    </div>
                  )}

                  <div className="flex items-start gap-4 mt-8 pt-6 border-t border-[#F0F0F0]">
                    <input type="checkbox" id="agree" className="w-5 h-5 mt-0.5 accent-[#8B735B] shrink-0" checked={paymentAgreed} onChange={e => setPaymentAgreed(e.target.checked)} />
                    <label htmlFor="agree" className="text-sm text-[#666] leading-relaxed cursor-pointer select-none">
                      I understand that the advance is non-refundable once production begins, and the remaining balance is due upon successful delivery of the piece.
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation Buttons ────────────────────────────────── */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-[#F0F0F0]">
            <div className="flex items-center gap-4">
              {step > 1 && (
                <button type="button" onClick={() => setStep(s => s - 1)} className="text-xs uppercase tracking-widest text-[#666] flex items-center gap-2 hover:text-[#2C2C2C] transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Back
                </button>
              )}
              <button type="button" onClick={handleSaveDraft} className="text-xs uppercase tracking-widest text-[#BBB] hover:text-[#8B735B] transition-colors">
                {savedDraft ? '✓ Saved' : 'Save Draft'}
              </button>
            </div>

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                disabled={!stepValid[step - 1]}
                onClick={() => setStep(s => s + 1)}
                className="bg-[#2C2C2C] text-white px-10 py-4 text-xs uppercase tracking-widest font-medium hover:bg-[#8B735B] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-3"
              >
                Continue
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            ) : (
              <button
                type="button"
                disabled={!paymentAgreed || isSubmitting}
                onClick={handleSubmit}
                className="bg-[#8B735B] text-white px-10 py-4 text-xs uppercase tracking-widest font-bold hover:bg-[#2C2C2C] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing Payment...' : `Pay Advance · ₹ ${(Number(advanceAmount) || suggestedAdvance).toLocaleString()} →`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div >
  );
};

export default CustomStudio;
