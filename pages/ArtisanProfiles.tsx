import React, { useState } from 'react';
import { Artisan } from '../types';

interface ArtisanProfilesProps {
  artisans: Artisan[];
  onViewArtisan: (id: string) => void;
}

const ArtisanProfiles: React.FC<ArtisanProfilesProps> = ({ artisans, onViewArtisan }) => {
  const [filter, setFilter] = useState('All');
  const approved = artisans.filter(a => a.status === 'approved');
  const crafts = ['All', ...Array.from(new Set(approved.map(a => a.craftType)))];
  const filtered = filter === 'All' ? approved : approved.filter(a => a.craftType === filter);

  return (
    <div className="pt-32 pb-24 min-h-screen animate-in fade-in duration-700">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
        <span className="text-xs uppercase tracking-[0.4em] text-[#8B735B] mb-4 block">The Collective</span>
        <h1 className="text-6xl serif mb-4">Meet the Makers</h1>
        <p className="text-[#666] font-light max-w-xl mx-auto">
          Each artisan in our collective is a master of their craft — curated for excellence, passion and heritage.
        </p>
      </div>

      {/* Craft filter */}
      {crafts.length > 1 && (
        <div className="max-w-7xl mx-auto px-6 mb-12 flex flex-wrap justify-center gap-3">
          {crafts.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`px-6 py-2 text-[10px] uppercase tracking-widest border transition-all ${filter === c ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]' : 'border-[#D1D1D1] text-[#666] hover:border-[#2C2C2C]'}`}>
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-32 text-[#999]">
          <p className="serif text-3xl italic mb-4">No artisans yet.</p>
          <p className="text-sm">Our collective is growing — check back soon.</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filtered.map((artisan, idx) => (
            <div key={artisan.id}
              onClick={() => onViewArtisan(artisan.id)}
              className="group cursor-pointer bg-white border border-[#F0F0F0] overflow-hidden hover:shadow-xl transition-all duration-500 animate-in slide-in-from-bottom-2"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {/* Cover / Photo */}
              <div className="relative h-64 bg-[#F5F0EA] overflow-hidden">
                {artisan.coverPhoto || artisan.portfolioImages?.[0] ? (
                  <img src={artisan.coverPhoto || artisan.portfolioImages[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={artisan.brandName} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-7xl serif text-[#8B735B]/30">{(artisan.brandName || artisan.name).charAt(0)}</span>
                  </div>
                )}
                {/* Profile photo overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                {artisan.profilePhoto && (
                  <div className="absolute bottom-4 left-6">
                    <img src={artisan.profilePhoto} className="w-14 h-14 rounded-full border-2 border-white object-cover" alt={artisan.name} />
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 text-[9px] uppercase tracking-widest font-semibold">
                  {artisan.craftType}
                </div>
              </div>

              {/* Info */}
              <div className="p-6">
                <h3 className="text-2xl serif mb-1 group-hover:text-[#8B735B] transition-colors">
                  {artisan.brandName || artisan.name}
                </h3>
                {artisan.brandName && artisan.name !== artisan.brandName && (
                  <p className="text-xs text-[#999] mb-2">by {artisan.name}</p>
                )}
                <p className="text-xs text-[#8B735B] uppercase tracking-widest mb-3">{artisan.location}</p>
                <p className="text-sm text-[#666] font-light line-clamp-2 leading-relaxed mb-4">{artisan.bio}</p>

                <div className="flex items-center justify-between pt-4 border-t border-[#F0F0F0]">
                  <div className="flex items-center gap-1">
                    {'★'.repeat(Math.round(artisan.rating || 5)).split('').map((s, i) => (
                      <span key={i} className="text-[#8B735B] text-xs">★</span>
                    ))}
                    <span className="text-[10px] text-[#999] ml-1">{artisan.rating || '5.0'}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-[#999]">
                    {artisan.experience} yrs experience
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArtisanProfiles;
