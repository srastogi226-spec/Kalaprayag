import React, { useState } from 'react';
import { Workshop, InstitutionRequest, Artisan } from '../types';

interface GroupWorkshopsProps {
    workshops: Workshop[];
    artisans: Artisan[];
    onSubmitInstitutionRequest: (req: InstitutionRequest) => void;
    onBack: () => void;
}

const GroupWorkshops: React.FC<GroupWorkshopsProps> = ({ workshops, artisans, onSubmitInstitutionRequest, onBack }) => {
    const [institutionSubmitted, setInstitutionSubmitted] = useState(false);
    const [instForm, setInstForm] = useState({
        institutionName: '',
        contactPerson: '',
        email: '',
        phone: '',
        type: 'school' as InstitutionRequest['type'],
        message: '',
        preferredDate: '',
        groupSize: '',
        craftCategory: '',
        preferredArtist: '',
    });

    const handleInstitutionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!instForm.institutionName || !instForm.contactPerson || !instForm.email) return;
        const req: InstitutionRequest = {
            id: 'inst-' + Math.random().toString(36).substr(2, 9),
            institutionName: instForm.institutionName,
            contactPerson: instForm.contactPerson,
            email: instForm.email,
            phone: instForm.phone,
            type: instForm.type,
            message: instForm.message,
            preferredDate: instForm.preferredDate || undefined,
            groupSize: instForm.groupSize ? Number(instForm.groupSize) : undefined,
            craftCategory: instForm.craftCategory || undefined,
            preferredArtist: instForm.preferredArtist || undefined,
            status: 'new',
            createdAt: new Date().toISOString(),
        };
        onSubmitInstitutionRequest(req);
        setInstitutionSubmitted(true);
    };

    const resetForm = () => {
        setInstitutionSubmitted(false);
        setInstForm({ institutionName: '', contactPerson: '', email: '', phone: '', type: 'school', message: '', preferredDate: '', groupSize: '', craftCategory: '', preferredArtist: '' });
    };

    return (
        <div className="pt-32 pb-24 min-h-screen px-6 animate-in fade-in duration-700">
            {/* Back to Workshops link */}
            <div className="max-w-4xl mx-auto mb-10">
                <button
                    onClick={onBack}
                    className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#8B735B] font-semibold hover:text-[#2C2C2C] transition-colors"
                >
                    <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                    Back to Workshops
                </button>
            </div>

            {/* Hero Section with warm background */}
            <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-[#F8F3ED] via-[#F5EFE6] to-[#EDE4D6] rounded-3xl p-10 md:p-16 relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#8B735B]/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#8B735B]/5 rounded-full translate-y-1/3 -translate-x-1/4"></div>

                    <div className="relative text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-[#8B735B]/10 rounded-full px-5 py-2 mb-6">
                            <svg className="w-4 h-4 text-[#8B735B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                            </svg>
                            <span className="text-[11px] uppercase tracking-[0.2em] text-[#8B735B] font-bold">For Institutions & Groups</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl serif mb-5 text-[#2C2C2C]">Group & Institutional Workshops</h1>
                        <p className="text-[#666] font-light max-w-xl mx-auto text-base mb-8">
                            Bring heritage craft experiences to your school, college, corporate team, or community group. We customise workshops for groups of any size.
                        </p>

                        {/* Benefit pills */}
                        <div className="flex flex-wrap justify-center gap-3">
                            {['Schools & Colleges', 'Corporate Teams', 'NGOs & Communities', 'Custom Curricula', 'Any Group Size'].map(benefit => (
                                <span key={benefit} className="bg-white/80 border border-[#D4C5B0] text-[#5A4A38] px-4 py-2 rounded-full text-[11px] font-medium tracking-wide shadow-sm">
                                    {benefit}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="relative max-w-2xl mx-auto bg-white rounded-2xl border border-[#E5E5E5] p-10 shadow-lg animate-in slide-in-from-bottom-4 duration-500">
                        {institutionSubmitted ? (
                            <div className="text-center py-12 animate-in zoom-in duration-300">
                                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl serif mb-3">Request Submitted!</h3>
                                <p className="text-sm text-[#666] mb-6">Our team will reach out within 2 business days to discuss your group workshop.</p>
                                <div className="flex justify-center gap-6">
                                    <button
                                        onClick={resetForm}
                                        className="text-xs uppercase tracking-widest text-[#8B735B] border-b border-[#8B735B] pb-1 hover:text-[#2C2C2C] hover:border-[#2C2C2C] transition-all"
                                    >
                                        Submit Another Request
                                    </button>
                                    <button
                                        onClick={onBack}
                                        className="text-xs uppercase tracking-widest text-[#2C2C2C] border-b border-[#2C2C2C] pb-1 hover:text-[#8B735B] hover:border-[#8B735B] transition-all"
                                    >
                                        Back to Workshops
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleInstitutionSubmit} className="space-y-6">
                                <div className="mb-4">
                                    <h3 className="text-xl serif">Group Workshop Inquiry</h3>
                                    <p className="text-[#999] text-sm mt-1">Fill in the details and our team will get back to you</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Institution Name *</label>
                                        <input type="text" required value={instForm.institutionName} onChange={e => setInstForm(p => ({ ...p, institutionName: e.target.value }))}
                                            placeholder="e.g. Delhi Public School"
                                            className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none focus:border-[#2C2C2C] text-sm transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Contact Person *</label>
                                        <input type="text" required value={instForm.contactPerson} onChange={e => setInstForm(p => ({ ...p, contactPerson: e.target.value }))}
                                            className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none focus:border-[#2C2C2C] text-sm transition-all" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Email *</label>
                                        <input type="email" required value={instForm.email} onChange={e => setInstForm(p => ({ ...p, email: e.target.value }))}
                                            className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none focus:border-[#2C2C2C] text-sm transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Phone</label>
                                        <input type="tel" value={instForm.phone} onChange={e => setInstForm(p => ({ ...p, phone: e.target.value }))}
                                            className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none focus:border-[#2C2C2C] text-sm transition-all" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Type</label>
                                        <select value={instForm.type} onChange={e => setInstForm(p => ({ ...p, type: e.target.value as any }))}
                                            className="w-full border-b border-[#D1D1D1] py-2 bg-white focus:outline-none focus:border-[#2C2C2C] text-sm transition-all">
                                            <option value="school">School</option>
                                            <option value="college">College</option>
                                            <option value="corporate">Corporate</option>
                                            <option value="ngo">NGO</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Group Size</label>
                                        <input type="number" min="1" value={instForm.groupSize} onChange={e => setInstForm(p => ({ ...p, groupSize: e.target.value }))}
                                            placeholder="e.g. 30"
                                            className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none focus:border-[#2C2C2C] text-sm transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Preferred Date</label>
                                        <input type="date" value={instForm.preferredDate} onChange={e => setInstForm(p => ({ ...p, preferredDate: e.target.value }))}
                                            className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none focus:border-[#2C2C2C] text-sm transition-all" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Craft Category</label>
                                        <select value={instForm.craftCategory} onChange={e => setInstForm(p => ({ ...p, craftCategory: e.target.value }))}
                                            className="w-full border-b border-[#D1D1D1] py-2 bg-white focus:outline-none focus:border-[#2C2C2C] text-sm transition-all">
                                            <option value="">— Select Craft —</option>
                                            {[...new Set(workshops.map(w => w.category).filter(Boolean))].sort().map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Preferred Artist</label>
                                        <select value={instForm.preferredArtist} onChange={e => setInstForm(p => ({ ...p, preferredArtist: e.target.value }))}
                                            className="w-full border-b border-[#D1D1D1] py-2 bg-white focus:outline-none focus:border-[#2C2C2C] text-sm transition-all">
                                            <option value="">— Any Artist —</option>
                                            {artisans.filter(a => a.status === 'approved').map(a => (
                                                <option key={a.id} value={a.name}>{a.brandName || a.name} — {a.craftType}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Message / Requirements</label>
                                    <textarea rows={4} value={instForm.message} onChange={e => setInstForm(p => ({ ...p, message: e.target.value }))}
                                        placeholder="Tell us about the craft experience you'd like, any special requirements..."
                                        className="w-full bg-[#F9F9F9] border border-[#E5E5E5] p-4 text-sm focus:outline-none focus:border-[#2C2C2C] resize-none transition-all rounded-lg" />
                                </div>

                                <button type="submit"
                                    className="w-full bg-[#2C2C2C] text-white py-4 text-xs uppercase tracking-[0.3em] font-bold hover:bg-[#8B735B] transition-all rounded-lg">
                                    Submit Group Request
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupWorkshops;
