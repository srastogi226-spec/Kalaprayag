
import React, { useEffect, useRef, useState } from 'react';
import { Product, Artisan, CartItem } from '../types';
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

const Home: React.FC<HomeProps> = ({ products, onViewProduct, onNavigate, artisans = [], onViewArtisan, onAddToCart, onToggleCart }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const { t } = useTranslate();

  // Get enough products for a carousel, and duplicate for seamless loop
  const featured = products.length > 0 ? [...products.slice(0, 10), ...products.slice(0, 10)] : [];

  const [artisanImageIndex, setArtisanImageIndex] = useState(0);
  const artisanImages = [
    '/IMG_2687.jpg',
    '/IMG_0178.JPG',
    '/studio.png'
  ];

  const nextArtisanImage = () => {
    setArtisanImageIndex((prev) => (prev + 1) % artisanImages.length);
  };

  const prevArtisanImage = () => {
    setArtisanImageIndex((prev) => (prev - 1 + artisanImages.length) % artisanImages.length);
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || isPaused || featured.length === 0) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const scroll = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      if (scrollContainer) {
        // Precise scroll update based on time for smoothness
        scrollContainer.scrollLeft += (deltaTime * 0.05); // Adjust speed here

        // Reset to start when half-way through (since we duplicated items)
        if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2) {
          scrollContainer.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, featured.length]);

  return (
    <div className="animate-in fade-in duration-700">
      {/* Hero Section - Optimized for Mobile Viewports */}
      <section className="relative min-h-screen lg:h-screen h-[100dvh] w-full overflow-hidden group">
        <div className="absolute inset-0">
          <video
            src="/hero-video.mov"
            poster="/studio.png"
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-1/2 left-1/2 w-auto min-w-full min-h-full max-w-none -translate-x-1/2 -translate-y-1/2 object-cover"
          >
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/80 via-[#1A1A1A]/20 to-transparent"></div>
        </div>

        <div className="relative z-10 h-full flex flex-col items-center justify-end pb-32 sm:pb-36 text-center text-white px-6">
          <div className="flex flex-col sm:flex-row gap-6 animate-in slide-in-from-bottom-8 duration-1000 delay-500">
            <button
              onClick={() => onNavigate('shop')}
              className="border border-white/50 bg-[#1A1A1A]/80 backdrop-blur-md text-white px-12 py-5 text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-white hover:text-[#1A1A1A] transition-all duration-500 shadow-2xl hover:-translate-y-1"
            >
              {t('Explore Collection')}
            </button>
            <button
              onClick={() => onNavigate('studio')}
              className="border border-white/50 bg-[#1A1A1A]/80 backdrop-blur-md text-white px-12 py-5 text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-white hover:text-[#1A1A1A] transition-all duration-500 shadow-2xl hover:-translate-y-1"
            >
              {t('Custom Studio')}
            </button>
            <button
              onClick={() => onNavigate('group-workshops')}
              className="border border-white/50 bg-[#1A1A1A]/80 backdrop-blur-md text-white px-12 py-5 text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-white hover:text-[#1A1A1A] transition-all duration-500 shadow-2xl hover:-translate-y-1"
            >
              {t('Book a Workshop')}
            </button>
          </div>
        </div>

        <div className="absolute bottom-5 sm:bottom-8 inset-x-0 flex flex-col items-center gap-4 z-30 animate-bounce cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
          <span className="text-[9px] uppercase tracking-[0.5em] pl-[0.5em] text-white font-black drop-shadow-[0_2px_10px_rgba(0,0,0,1)] text-center">
            {t('Discover')}
          </span>
          <div className="w-[1.5px] h-8 sm:h-12 bg-gradient-to-b from-white via-white/60 to-transparent shadow-[0_0_20px_rgba(255,255,255,0.5)]"></div>
        </div>
      </section>

      {/* Brand Story Snippet */}
      <section className="py-32 bg-white text-center px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl serif mb-10 text-[#1A1A1A]">{t('Where Heritage Meets Design')}</h2>
          <p className="text-[#4A4A4A] leading-loose text-lg font-light mb-12 italic">
            "{t('Every stroke of the chisel, every throw of the clay, and every weave of the loom at Kala Prayag is a celebration of the artisan\'s spirit. We believe that true luxury lies in the story of the maker.')}"
          </p>
          <button
            onClick={() => onNavigate('about')}
            className="text-[10px] uppercase tracking-[0.3em] font-bold border-b border-[#1A1A1A] pb-2 hover:text-[#8B735B] hover:border-[#8B735B] transition-all"
          >
            {t('Our Philosophy')}
          </button>
        </div>
      </section>

      {/* Workshop Stats Bar */}
      <section className="bg-[#1A1A1A]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {[
            { value: '12+', label: t('Craft Disciplines'), img: '/studio.png' },
            { value: t('Online & Offline'), label: t('Session Modes'), img: '/IMG_0178.JPG' },
            { value: t('Group & Solo'), label: t('Workshop Formats'), img: '/IMG_2687.jpg' },
            { value: t('Master Artisan-Led'), label: t('Every Session'), img: '/studio.png' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="relative overflow-hidden group cursor-default py-14 px-6 text-center"
            >
              {/* Background photo — fades in on hover */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-0 group-hover:opacity-100 transition-opacity duration-700 scale-105 group-hover:scale-100 ease-in-out"
                style={{ backgroundImage: `url('${stat.img}')` }}
              />
              {/* Dark overlay always present, lightens on hover */}
              <div className="absolute inset-0 bg-[#1A1A1A]/90 group-hover:bg-[#1A1A1A]/55 transition-colors duration-700" />
              {/* Content */}
              <div className="relative z-10 transition-transform duration-500 group-hover:-translate-y-1">
                <p className="text-[#C4A97D] serif text-2xl md:text-3xl font-light mb-1">{stat.value}</p>
                <p className="text-white/50 group-hover:text-white/80 text-[9px] uppercase tracking-[0.3em] font-semibold transition-colors duration-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center py-6 border-t border-white/5">
          <button
            onClick={() => onNavigate('workshops')}
            className="text-[9px] uppercase tracking-[0.4em] text-[#8B735B] hover:text-[#C4A97D] transition-colors duration-300 font-bold border-b border-[#8B735B]/40 pb-1 hover:border-[#C4A97D]"
          >
            {t('Explore All Workshops')}
          </button>
        </div>
      </section>


      {/* Featured Collections */}
      <section className="py-10 bg-[#FAF9F6] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4">
            <div className="text-center md:text-left">
              <span className="text-[9px] uppercase tracking-[0.3em] text-[#8B735B] font-bold">{t('Curation')}</span>
              <h2 className="text-2xl md:text-3xl serif mt-1 text-[#1A1A1A]">{t('Featured Masterpieces')}</h2>
            </div>
            <button
              onClick={() => onNavigate('shop')}
              className="group flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:text-[#8B735B] transition-colors"
            >
              {t('View Full Collection')}
              <span className="w-6 h-px bg-current group-hover:w-10 transition-all"></span>
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="flex gap-6 overflow-x-auto no-scrollbar pb-10 active:cursor-grabbing px-6 md:px-[calc(50vw-min(640px,50vw-24px))]"
          style={{ scrollBehavior: 'auto' }}
        >
          {featured.map((product, idx) => (
            <div
              key={`${product.id}-${idx}`}
              className="min-w-[180px] md:min-w-[260px] group cursor-pointer"
              onClick={() => onViewProduct(product.id)}
            >
              <div className="relative overflow-hidden aspect-[3/4] mb-4 shadow-sm group-hover:shadow-lg transition-all duration-700 rounded-sm">
                <img
                  src={product.images[0] || 'https://via.placeholder.com/800'}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  alt={product.name}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500"></div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <button className="bg-white text-[#1A1A1A] px-5 py-2.5 text-[7px] uppercase tracking-[0.3em] font-bold shadow-2xl whitespace-nowrap">{t('Quick View')}</button>
                </div>
              </div>
              <h3 className="text-lg serif mb-0.5 text-[#1A1A1A] line-clamp-1">{product.name}</h3>
              <div className="flex justify-between items-center">
                <p className="text-[8px] uppercase tracking-widest text-[#8B735B] font-bold">{product.category}</p>
                <div className="price-container">
                  <div className="price-stack">
                    <div className="price-item">
                      <p className="text-sm text-[#1A1A1A] serif">₹ {product.price.toLocaleString()}</p>
                    </div>
                    <div
                      className="price-item cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onAddToCart) {
                          onAddToCart({
                            productId: product.id,
                            name: product.name,
                            price: product.price,
                            image: product.images[0],
                            quantity: 1,
                            size: 'Standard',
                            finish: 'Original',
                            notes: ''
                          });
                        }
                      }}
                    >
                      <p className="text-[9px] uppercase tracking-widest text-[#8B735B] font-bold">{t('Add to Cart')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Artisan Spotlight */}
      <section className="grid grid-cols-1 md:grid-cols-2">
        <div className="bg-[#EFEBE6] py-20 px-8 md:py-32 md:px-24 flex flex-col justify-center items-center md:items-start text-center md:text-left">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#8B735B] mb-6 font-bold">{t('Artisan Spotlight')}</span>
          <h2 className="text-4xl md:text-5xl serif mb-8 leading-tight text-[#1A1A1A]">{t('Mastering the')} <br /> {t('Forge & Flame')}</h2>
          <p className="text-[#4A4A4A] leading-loose mb-12 text-base md:text-lg font-light">
            {t('Our brass artisans from Moradabad have been perfecting their craft for generations. Each piece undergoes 14 distinct stages of refining, ensuring that the final object is not just decor, but an heirloom imbued with history.')}
          </p>
          <div>
            <button
              onClick={() => onNavigate('artisan-profiles')}
              className="bg-[#1A1A1A] text-white px-10 md:px-12 py-4 md:py-5 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#333] transition-all shadow-xl"
            >
              {t('Meet the Makers')}
            </button>
          </div>
        </div>
        <div className="relative min-h-[500px] h-full w-full overflow-hidden group">
          <img
            key={artisanImages[artisanImageIndex]}
            src={artisanImages[artisanImageIndex]}
            className="absolute inset-0 w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-1000 animate-in fade-in zoom-in-95"
            alt={t('Artisan at work')}
          />

          {/* Left Arrow */}
          <button
            onClick={prevArtisanImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#8B735B]"
            aria-label="Previous image"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Right Arrow */}
          <button
            onClick={nextArtisanImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#8B735B]"
            aria-label="Next image"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {artisanImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setArtisanImageIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === artisanImageIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'
                  }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Custom Orders CTA */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto border border-gray-100 bg-[#FAF9F6] p-20 shadow-sm">
            <h2 className="text-4xl md:text-5xl serif mb-6 text-[#1A1A1A]">{t('Bespoke Design Studio')}</h2>
            <p className="text-[#4A4A4A] mb-12 text-lg font-light max-w-xl mx-auto">
              {t('Collaborate with our master designers and artisans to create a unique piece specifically tailored to your home\'s aesthetic.')}
            </p>
            <button
              onClick={() => onNavigate('studio')}
              className="px-12 py-5 bg-[#8B735B] text-white text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-[#6D5A47] transition-all shadow-xl"
            >
              {t('Start Your Design Journey')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
