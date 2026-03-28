
import React, { useRef } from 'react';
import { Product, CartItem } from '../types';
import { useTranslate } from '../hooks/useTranslate';

interface HomeProps {
  products: Product[];
  onViewProduct: (id: string) => void;
  onNavigate: (page: string) => void;
  artisans?: any[];
  onViewArtisan?: (id: string) => void;
  onAddToCart?: (item: CartItem) => void;
  onToggleCart?: () => void;
}

const Home: React.FC<HomeProps> = ({ products, onViewProduct, onNavigate, artisans = [], onViewArtisan, onAddToCart }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslate();

  const featured = products.length > 0 ? products.slice(0, 10) : [];
  
  const artisanToSpotlight = artisans.length > 0 ? artisans[0] : null;
  const artisanImage = artisanToSpotlight?.profilePhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600';

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };
  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

  const ensureTwoDecimals = (price: number) => {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="bg-[#FAF9F6] animate-in fade-in duration-700">
      
      {/* 1. HERO SECTION */}
      <section className="relative w-full h-[75vh] min-h-[600px] flex items-end justify-center pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
           {/* Fallback image as requested if video is unavailable, but sticking to the Unsplash image matching the design */}
          <img 
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400" 
            alt="Artisan hands"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        </div>
        
        <div className="relative z-10 text-center flex flex-col items-center">
          <h1 className="text-white text-4xl md:text-5xl lg:text-[56px] leading-[1.1] mb-8 drop-shadow-md" style={{ fontFamily: "'Playfair Display', serif" }}>
            WHERE ANCIENT CRAFT <br />
            MEETS MODERN LUXURY
          </h1>
          <button
            onClick={() => onNavigate('shop')}
            className="bg-[#8B735B] text-white px-8 py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg hover:bg-[#6e5844] transition-colors"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            DISCOVER THE COLLECTION
          </button>
        </div>
      </section>

      {/* 2. CURATED COLLECTIONS */}
      <section className="py-24 px-6 md:px-12 max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div className="flex-1"></div> {/* Spacer for perfect centering of title */}
          <h2 className="text-2xl md:text-3xl text-center text-[#1A1A1A] flex-shrink-0" style={{ fontFamily: "'Playfair Display', serif" }}>
            CURATED COLLECTIONS
          </h2>
          <div className="flex-1 flex justify-end gap-3">
            <button 
              onClick={scrollLeft}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-black hover:border-black transition-colors"
              aria-label="Previous"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button 
              onClick={scrollRight}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-black hover:border-black transition-colors"
              aria-label="Next"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        <div className="relative">
          <div 
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth"
          >
            {featured.map((product) => (
              <div 
                key={product.id} 
                className="flex flex-col min-w-[220px] max-w-[280px] w-[25vw]"
              >
                <div 
                  className="aspect-square w-full overflow-hidden bg-gray-100 cursor-pointer mb-3 relative group"
                  onClick={() => onViewProduct(product.id)}
                >
                  <img
                    src={product.images[0] || 'https://via.placeholder.com/400'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                
                <h3 className="text-[#1A1A1A] font-semibold text-[13px] mb-1 line-clamp-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {product.name}
                </h3>
                <p className="text-[#4A4A4A] text-[13px] mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
                  ${ensureTwoDecimals(product.price)}
                </p>
                
                <button 
                  onClick={() => onViewProduct(product.id)}
                  className="w-full py-2 border border-gray-300 text-[11px] font-bold text-[#1A1A1A] hover:bg-[#1A1A1A] hover:border-[#1A1A1A] hover:text-white transition-colors uppercase"
                >
                  View
                </button>
              </div>
            ))}
            
            {/* Empty state padding if not enough products */}
            {featured.length === 0 && (
              <p className="text-gray-400 italic font-light text-center w-full py-20">Collection is currently being updated...</p>
            )}
          </div>
        </div>
      </section>

      {/* 3. ARTISAN SPOTLIGHT */}
      <section className="py-20 md:py-32 px-6 md:px-12 max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row gap-12 md:gap-20 items-center">
          
          <div className="w-full md:w-1/2">
            <div className="aspect-square w-full overflow-hidden rounded-sm bg-gray-200">
              <img 
                src={artisanImage} 
                alt="Artisan Portrait"
                className="w-full h-full object-cover grayscale-[30%]"
              />
            </div>
          </div>
          
          <div className="w-full md:w-1/2 flex flex-col items-start text-left">
            <h3 className="text-[#8B735B] text-[15px] tracking-[0.05em] uppercase font-medium mb-3">
              ARTISAN SPOTLIGHT:
            </h3>
            <h2 className="text-3xl md:text-5xl text-[#1A1A1A] leading-tight mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
              THE MASTERS BEHIND<br/>THE CRAFT
            </h2>
            
            <p className="text-[#4A4A4A] text-[14px] leading-relaxed mb-6 font-medium">
              <strong className="text-black">Kala Prayag</strong> is a collective of master artisans who have inherited centuries of heritage and traditional art forms. We celebrate their exceptional skill and dedication to preserving these ancient techniques.
            </p>
            
            <p className="text-[#4A4A4A] text-[14px] leading-relaxed mb-10">
              Every curated piece reflects hours of meticulous craftsmanship, rooted in the soul of India's artisanal heritage.
            </p>
            
            <button 
              onClick={() => onViewArtisan(artisanToSpotlight?.id || '')}
              className="border border-[#1A1A1A] text-[#1A1A1A] px-8 py-3 text-[11px] font-bold uppercase tracking-[0.1em] hover:bg-[#1A1A1A] hover:text-white transition-colors"
            >
              MEET THE ARTISAN
            </button>
          </div>
          
        </div>
      </section>

    </div>
  );
};

export default Home;
