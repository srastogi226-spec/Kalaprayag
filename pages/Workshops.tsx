import React, { useState } from 'react';
import { Workshop, Artisan, ClassBooking } from '../types';
import { useTranslate } from '../hooks/useTranslate';

interface WorkshopsProps {
  workshops: Workshop[];
  artisans: Artisan[];
  classBookings: ClassBooking[];
  onViewWorkshop: (id: string) => void;
  onNavigate: (page: string) => void;
}

const Workshops: React.FC<WorkshopsProps> = ({ workshops, artisans, classBookings, onViewWorkshop, onNavigate }) => {
  const [filterMode, setFilterMode] = useState<'all' | 'online' | 'offline'>('all');
  const { t } = useTranslate();

  const approvedWorkshops = workshops.filter(w =>
    w.status === 'approved' &&
    (filterMode === 'all' || w.mode === filterMode)
  );

  return (
    <div className="pt-32 pb-24 min-h-screen px-6 max-w-7xl mx-auto animate-in fade-in duration-700">
      <header className="mb-16 text-center">
        <span className="text-xs uppercase tracking-[0.3em] text-[#8B735B] mb-4 block">{t('Academy')}</span>
        <h1 className="text-6xl serif mb-4">{t('Artist Workshops')}</h1>
        <p className="text-[#666] font-light max-w-xl mx-auto">
          {t('Learn heritage crafts directly from the masters. Join our physical studio sessions or online masterclasses.')}
        </p>
      </header>

      <div className="flex justify-center gap-4 mb-12">
        {['all', 'online', 'offline'].map((mode) => (
          <button
            key={mode}
            onClick={() => setFilterMode(mode as any)}
            className={`px-8 py-2 text-[10px] uppercase tracking-widest border transition-all ${filterMode === mode ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]' : 'border-[#D1D1D1] text-[#666] hover:border-[#2C2C2C]'}`}
          >
            {t(mode)}
          </button>
        ))}
      </div>

      {/* ── Prominent Group Workshops Banner — navigates to dedicated page ── */}
      <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
        <button
          onClick={() => onNavigate('group-workshops')}
          className="group block w-full text-left relative overflow-hidden bg-gradient-to-r from-[#2C2C2C] via-[#3D3427] to-[#4A3C2A] rounded-xl p-6 md:p-8 hover:shadow-xl transition-all duration-500"
        >
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-12 h-12 bg-[#8B735B]/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-[#C4A97D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-[0.3em] text-[#C4A97D] font-semibold mb-0.5 block">{t('For Schools · Corporates · Groups')}</span>
                <h3 className="text-lg md:text-xl serif text-white mb-1">{t('Group & Institutional Workshops')}</h3>
                <p className="text-white/60 text-xs font-light max-w-md">{t('Bring heritage craft experiences to your team or classroom. Custom-built for groups of any size.')}</p>
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2.5 bg-white/10 border border-white/10 px-5 py-2.5 rounded-lg group-hover:bg-[#8B735B] group-hover:border-[#8B735B] transition-all duration-300">
              <span className="text-white text-[10px] uppercase tracking-[0.2em] font-bold whitespace-nowrap">{t('Request a Workshop')}</span>
              <svg className="w-3.5 h-3.5 text-white transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {approvedWorkshops.map((w) => (
          <div
            key={w.id}
            className="group cursor-pointer bg-white border border-[#F0F0F0] overflow-hidden hover:shadow-xl transition-all duration-500"
            onClick={() => onViewWorkshop(w.id)}
          >
            <div className="relative h-64 overflow-hidden">
              <img src={w.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={w.title} />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 text-[10px] uppercase tracking-widest font-semibold shadow-sm">
                {w.mode}
              </div>
            </div>
            <div className="p-8">
              <span className="text-[10px] uppercase tracking-widest text-[#8B735B] mb-2 block">{t(w.category)}</span>
              <h3 className="text-2xl serif mb-4 group-hover:text-[#8B735B] transition-colors">{t(w.title)}</h3>
              <p className="text-sm text-[#666] line-clamp-2 mb-6 font-light">{t(w.description)}</p>

              <div className="pt-6 border-t border-[#F0F0F0]">
                <p className="text-[10px] uppercase tracking-widest text-[#999] mb-1">{t('Next Session')}</p>
                <div className="flex justify-between items-end">
                  <p className="text-sm font-medium">{new Date(w.date).toLocaleDateString()}</p>
                  <div className="text-right">
                    <p className="text-[8px] uppercase tracking-widest text-[#999] mb-0.5">{t('Availability')}</p>
                    <p className="text-xs font-semibold text-[#8B735B]">
                      {w.maxStudents - classBookings.filter(b => b.workshopId === w.id).length} {t('Seats Left')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {approvedWorkshops.length === 0 && (
        <div className="py-32 text-center text-[#999]">
          <p className="serif text-2xl italic">{t('No workshops available in this category yet.')}</p>
        </div>
      )}
    </div>
  );
};

export default Workshops;
