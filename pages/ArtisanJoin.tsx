import React, { useState, useRef } from 'react';
import { ArtisanApplication } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { CATEGORIES } from '../constants.tsx';
import { compressImage } from '../utils/imageUtils';

interface ArtisanJoinProps {
  onApply: (app: ArtisanApplication) => void;
}

const STEPS = ['Account', 'Identity', 'Craft', 'Portfolio'];

const ArtisanJoin: React.FC<ArtisanJoinProps> = ({ onApply }) => {
  const productCategories = CATEGORIES.filter(c => c !== 'All');
  const { signup, loginWithGoogle, currentUser } = useAuth();
  
  const [step, setStep] = useState(0);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  React.useEffect(() => {
    // If the user is already authenticated (e.g. they logged in with Google on the main page
    // but don't have an application yet), auto-fill their info and skip step 0.
    if (currentUser && step === 0) {
      setFormData(prev => ({ 
        ...prev, 
        email: currentUser.email || '', 
        id: currentUser.uid,
        name: currentUser.displayName || prev.name,
      }));
      setStep(1);
    }
  }, [currentUser, step]);

  const [formData, setFormData] = useState<Partial<ArtisanApplication>>({
    name: '', brandName: '', email: '', phone: '', whatsapp: '',
    instagram: '', location: '',
    craftType: productCategories[0] || 'Vases',
    experience: '', bio: '', portfolioImages: [], profilePhoto: '',
    teachingInterest: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLInputElement>(null);

  const set = (key: string, val: any) => setFormData(prev => ({ ...prev, [key]: val }));

  const handleProfilePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const c = await compressImage(file, 400, 0.7); set('profilePhoto', c); }
    e.target.value = '';
  };

  const handlePortfolioImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const compressed = await Promise.all(Array.from(files).map(f => compressImage(f, 800, 0.65)));
      setFormData(prev => ({ ...prev, portfolioImages: [...(prev.portfolioImages || []), ...compressed] }));
    }
    e.target.value = '';
  };

  const removePortfolioImage = (idx: number) =>
    setFormData(prev => ({ ...prev, portfolioImages: (prev.portfolioImages || []).filter((_, i) => i !== idx) }));

  const handleSubmit = async () => {
    setAuthError('');
    // Only check password if it's an email/password signup
    if (!formData.id && password.length < 6) { setAuthError('Password must be at least 6 characters.'); return; }
    if (!formData.id && password !== confirmPassword) { setAuthError('Passwords do not match.'); return; }

    setSubmitting(true);
    try {
      let uid = formData.id;
      if (!uid) {
        const user = await signup(formData.email!, password);
        uid = user.uid;
      }

      const app: ArtisanApplication = {
        ...(formData as ArtisanApplication),
        id: uid as string,
        status: 'pending',
        appliedAt: new Date().toISOString(),
        categories: formData.craftType ? [formData.craftType] : [],
        customPricing: {},
      };
      onApply(app);
      setIsSubmitted(true);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') setAuthError('This email is already registered. Please login instead.');
      else if (err.code === 'auth/invalid-email') setAuthError('Please enter a valid email address.');
      else setAuthError('Could not create account. Please try again.');
    }
    setSubmitting(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 animate-in fade-in duration-700">
        <div className="text-center max-w-lg">
          <div className="w-24 h-24 bg-[#8B735B]/10 rounded-full flex items-center justify-center mx-auto mb-10">
            <svg className="w-12 h-12 text-[#8B735B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-xs uppercase tracking-[0.4em] text-[#8B735B] mb-4 block">Application Submitted</span>
          <h2 className="text-5xl serif mb-6">Welcome to the<br />Collective</h2>
          <p className="text-[#666] font-light leading-relaxed text-lg">
            Your application is under review. Our curation team will assess your portfolio and respond within 5 business days.
          </p>
        </div>
      </div>
    );
  }

  const stepValid = () => {
    if (step === 0) return formData.email && password.length >= 6 && password === confirmPassword;
    if (step === 1) return formData.name && formData.brandName && formData.phone && formData.location;
    if (step === 2) return formData.craftType && formData.experience && formData.bio;
    return true;
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Split layout */}
      <div className="flex min-h-screen">

        {/* Left panel — visual */}
        <div className="hidden lg:flex lg:w-2/5 bg-[#2C2C2C] flex-col justify-between p-16 relative overflow-hidden">
          <div className="absolute inset-0">
            <img src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&q=80&w=800"
              className="w-full h-full object-cover opacity-20" alt="" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#2C2C2C]/80 via-transparent to-[#2C2C2C]" />
          </div>
          <div className="relative z-10">
            <div className="text-white/40 text-xs uppercase tracking-[0.4em] mb-2">Kala Prayag</div>
            <div className="text-white text-2xl serif">Artisan Collective</div>
          </div>
          <div className="relative z-10">
            <h2 className="text-5xl serif text-white mb-6 leading-tight">Join 40+ master<br />craftspeople</h2>
            <p className="text-white/60 font-light leading-relaxed mb-12">
              Showcase your heritage craft to a global audience. Receive custom commissions, host workshops, and build your legacy.
            </p>
            {/* Step indicators */}
            <div className="space-y-4">
              {STEPS.map((s, i) => (
                <div key={s} className={`flex items-center gap-4 transition-all duration-300 ${i === step ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${i < step ? 'bg-[#8B735B] border-[#8B735B] text-white' : i === step ? 'border-white text-white' : 'border-white/30 text-white/30'}`}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span className="text-white text-sm">{s}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Testimonial */}
          <div className="relative z-10 border-t border-white/10 pt-8">
            <p className="text-white/50 text-sm italic font-light leading-relaxed">
              "Kala Prayag transformed my craft into a livelihood. My work now lives in homes across 12 countries."
            </p>
            <p className="text-white/30 text-xs mt-3 uppercase tracking-widest">— Priya Sharma, Pottery Artist</p>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex flex-col">
          {/* Mobile progress bar */}
          <div className="lg:hidden h-1 bg-[#E5E5E5]">
            <div className="h-full bg-[#8B735B] transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>

          <div className="flex-1 flex flex-col justify-center px-8 md:px-20 py-16 max-w-xl w-full mx-auto">
            {/* Step header */}
            <div className="mb-10">
              <span className="text-xs uppercase tracking-[0.4em] text-[#8B735B] mb-2 block">Step {step + 1} of {STEPS.length}</span>
              <h1 className="text-4xl serif">
                {step === 0 && 'Create your account'}
                {step === 1 && 'Tell us about you'}
                {step === 2 && 'Your craft'}
                {step === 3 && 'Show your work'}
              </h1>
              <p className="text-[#999] text-sm mt-2 font-light">
                {step === 0 && 'Your login credentials for the artisan dashboard.'}
                {step === 1 && 'Personal and contact information.'}
                {step === 2 && 'Your speciality and artist story.'}
                {step === 3 && 'Upload portfolio images to be reviewed.'}
              </p>
            </div>

            {/* STEP 0 — Account */}
            {step === 0 && (
              <div className="space-y-7">
                <button
                  type="button"
                  onClick={async () => {
                    setAuthError('');
                    setSubmitting(true);
                    try {
                      const user = await loginWithGoogle();
                      set('email', user.email);
                      set('id', user.uid);
                      setStep(1); // Skip password step if Google auth succeeds
                    } catch (err: any) {
                      console.error("Google Auth Error: ", err);
                      setAuthError(`Google sign-in failed: ${err.message || err.code || 'Unknown Error'}. Please try again.`);
                    }
                    setSubmitting(false);
                  }}
                  disabled={submitting}
                  className="w-full bg-white border border-[#E5E5E5] text-[#2C2C2C] px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  {submitting ? 'Connecting...' : 'Continue with Google'}
                </button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-[#F0F0F0]"></div>
                  <span className="flex-shrink-0 mx-4 text-[#999] text-xs uppercase tracking-widest">Or use email</span>
                  <div className="flex-grow border-t border-[#F0F0F0]"></div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Email Address *</label>
                  <input type="email" placeholder="you@example.com" autoComplete="email"
                    className="w-full border-b border-[#D1D1D1] bg-transparent py-3 focus:outline-none focus:border-[#2C2C2C] text-sm transition-colors"
                    value={formData.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Password *</label>
                  <input type="password" placeholder="Min. 6 characters"
                    className="w-full border-b border-[#D1D1D1] bg-transparent py-3 focus:outline-none focus:border-[#2C2C2C] text-sm transition-colors"
                    value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Confirm Password *</label>
                  <input type="password" placeholder="Repeat password"
                    className="w-full border-b border-[#D1D1D1] bg-transparent py-3 focus:outline-none focus:border-[#2C2C2C] text-sm transition-colors"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                  )}
                </div>
                {authError && <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3">{authError}</div>}
              </div>
            )}

            {/* STEP 1 — Identity */}
            {step === 1 && (
              <div className="space-y-7">
                {/* Profile photo */}
                <div className="flex items-center gap-6">
                  <div onClick={() => profileRef.current?.click()}
                    className="w-20 h-20 rounded-full bg-[#F0EDE8] overflow-hidden border-2 border-dashed border-[#D1D1D1] flex items-center justify-center cursor-pointer hover:border-[#8B735B] transition-all flex-shrink-0">
                    {formData.profilePhoto
                      ? <img src={formData.profilePhoto} className="w-full h-full object-cover" alt="Profile" />
                      : <svg className="w-7 h-7 text-[#C5B9AE]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                  </div>
                  <div>
                    <button type="button" onClick={() => profileRef.current?.click()}
                      className="text-xs uppercase tracking-widest text-[#2C2C2C] border-b border-[#2C2C2C] pb-0.5 hover:text-[#8B735B] hover:border-[#8B735B] transition-all">
                      Upload Profile Photo
                    </button>
                    <p className="text-[10px] text-[#BBB] mt-1">JPG or PNG · Max 5MB</p>
                    {formData.profilePhoto && (
                      <button type="button" onClick={() => set('profilePhoto', '')} className="text-[10px] text-red-400 mt-1 block">Remove</button>
                    )}
                  </div>
                  <input type="file" ref={profileRef} className="hidden" accept="image/jpeg, image/png, image/heic, image/heif" onChange={handleProfilePhoto} />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Brand / Studio Name *</label>
                    <input type="text" required placeholder="Your studio name"
                      className="w-full border-b border-[#D1D1D1] bg-transparent py-3 focus:outline-none focus:border-[#2C2C2C] text-sm transition-colors"
                      value={formData.brandName} onChange={e => set('brandName', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Full Legal Name *</label>
                    <input type="text" required
                      className="w-full border-b border-[#D1D1D1] bg-transparent py-3 focus:outline-none focus:border-[#2C2C2C] text-sm transition-colors"
                      value={formData.name} onChange={e => set('name', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Phone *</label>
                    <input type="tel" required
                      className="w-full border-b border-[#D1D1D1] bg-transparent py-3 focus:outline-none focus:border-[#2C2C2C] text-sm transition-colors"
                      value={formData.phone} onChange={e => set('phone', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">WhatsApp *</label>
                    <input type="tel" required
                      className="w-full border-b border-[#D1D1D1] bg-transparent py-3 focus:outline-none focus:border-[#2C2C2C] text-sm transition-colors"
                      value={formData.whatsapp} onChange={e => set('whatsapp', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">City / Location *</label>
                    <input type="text" required placeholder="e.g. Jaipur, Rajasthan"
                      className="w-full border-b border-[#D1D1D1] bg-transparent py-3 focus:outline-none focus:border-[#2C2C2C] text-sm transition-colors"
                      value={formData.location} onChange={e => set('location', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Instagram</label>
                    <input type="url" placeholder="https://instagram.com/..."
                      className="w-full border-b border-[#D1D1D1] bg-transparent py-3 focus:outline-none focus:border-[#2C2C2C] text-sm transition-colors"
                      value={formData.instagram} onChange={e => set('instagram', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 — Craft */}
            {step === 2 && (
              <div className="space-y-7">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Craft Category *</label>
                    <select className="w-full border-b border-[#D1D1D1] bg-transparent py-3 focus:outline-none focus:border-[#2C2C2C] text-sm transition-colors"
                      value={formData.craftType} onChange={e => set('craftType', e.target.value)}>
                      {productCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Years of Experience *</label>
                    <input type="text" required placeholder="e.g. 8"
                      className="w-full border-b border-[#D1D1D1] bg-transparent py-3 focus:outline-none focus:border-[#2C2C2C] text-sm transition-colors"
                      value={formData.experience} onChange={e => set('experience', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Artist Bio & Vision *</label>
                  <textarea required rows={5}
                    className="w-full bg-white border border-[#E5E5E5] p-4 text-sm focus:outline-none focus:border-[#2C2C2C] resize-none transition-colors leading-relaxed"
                    placeholder="Tell us your story, inspiration and craft philosophy..."
                    value={formData.bio} onChange={e => set('bio', e.target.value)} />
                  <p className="text-[10px] text-[#BBB]">{(formData.bio || '').length} / 500 characters</p>
                </div>
                <div className="flex items-center gap-3 bg-white border border-[#F0F0F0] p-4">
                  <input type="checkbox" id="teaching" className="w-4 h-4 accent-[#8B735B]"
                    checked={formData.teachingInterest} onChange={e => set('teachingInterest', e.target.checked)} />
                  <label htmlFor="teaching" className="text-xs text-[#666] cursor-pointer leading-relaxed">
                    I am interested in hosting <strong>workshops & masterclasses</strong> through Kala Prayag
                  </label>
                </div>
              </div>
            )}

            {/* STEP 3 — Portfolio */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-[#D1D1D1] rounded p-10 text-center cursor-pointer hover:border-[#8B735B] hover:bg-[#FAF9F6] transition-all"
                  onClick={() => fileInputRef.current?.click()}>
                  <svg className="w-10 h-10 text-[#D1D1D1] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-[#999] font-light mb-1">Click to upload portfolio images</p>
                  <p className="text-[10px] uppercase tracking-widest text-[#CCC]">JPG, PNG · Multiple allowed</p>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/jpeg, image/png, image/heic, image/heif" onChange={handlePortfolioImages} />

                {(formData.portfolioImages || []).length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {formData.portfolioImages!.map((img, idx) => (
                      <div key={idx} className="relative aspect-square group rounded overflow-hidden">
                        <img src={img} className="w-full h-full object-cover" alt="Portfolio" />
                        <button type="button" onClick={() => removePortfolioImage(idx)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-lg">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-[#BBB] leading-relaxed">
                  <strong className="text-[#999]">{(formData.portfolioImages || []).length} images</strong> uploaded. Our curators review portfolio quality carefully — upload your best work.
                </p>

                {authError && <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3">{authError}</div>}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-12">
              {step > 0
                ? <button type="button" onClick={() => setStep(s => s - 1)}
                  className="text-xs uppercase tracking-widest text-[#999] hover:text-[#2C2C2C] transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Back
                </button>
                : <div />}

              {step < STEPS.length - 1
                ? <button type="button"
                  disabled={!stepValid()}
                  onClick={() => { setAuthError(''); setStep(s => s + 1); }}
                  className="bg-[#2C2C2C] text-white px-10 py-4 text-xs uppercase tracking-[0.3em] font-bold hover:bg-[#8B735B] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed">
                  Continue
                </button>
                : <button type="button"
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="bg-[#8B735B] text-white px-10 py-4 text-xs uppercase tracking-[0.3em] font-bold hover:bg-[#2C2C2C] transition-all duration-300 disabled:opacity-50 flex items-center gap-3">
                  {submitting && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtisanJoin;
