import React, { useState, useEffect, useRef } from 'react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  unreadNotificationsCount?: number;
  cartCount?: number;
  onToggleCart?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  onNavigate,
  currentPage,
  unreadNotificationsCount = 0,
  cartCount = 0,
  onToggleCart
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isHome = currentPage === 'home';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

  // Desktop shows only core links — Custom Studio & Contact are in the menu drawer
  const desktopLinks = [
    { name: 'Shop', id: 'shop' },
    { name: 'Workshops', id: 'workshops' },
    { name: 'Journal', id: 'journal' },
    { name: 'Makers', id: 'artisan-profiles' },
    { name: 'About', id: 'about' },
  ];

  // Full list for the hamburger drawer
  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'Shop', id: 'shop' },
    { name: 'Workshops', id: 'workshops' },
    { name: 'Journal', id: 'journal' },
    { name: 'Custom Studio', id: 'studio' },
    { name: 'Makers', id: 'artisan-profiles' },
    { name: 'About', id: 'about' },
    { name: 'Contact', id: 'contact' },
    { name: 'My Orders', id: 'track-order' },
  ];


  const handleMobileNavigate = (id: string) => {
    onNavigate(id);
    setIsMenuOpen(false);
  };

  const isLightMode = !isHome || isScrolled || isMenuOpen;
  const textColor = isLightMode ? 'text-[#1A1A1A]' : 'text-white';
  const accentColor = isLightMode ? 'text-[#8B735B]' : 'text-white/60';
  const navBg = isLightMode
    ? 'bg-white/95 backdrop-blur-xl border-b border-gray-100 py-4 shadow-sm'
    : 'bg-transparent py-8';

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-700 ease-in-out ${navBg}`}>
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center relative">

          {/* Brand Identity */}
          <button
            onClick={() => handleMobileNavigate('home')}
            className="flex flex-col items-start group z-50 text-left"
          >
            <div className="flex flex-col items-start leading-none">
              <span className={`text-xs tracking-[0.5em] uppercase transition-colors duration-500 font-medium ${accentColor}`} style={{ fontFamily: "'Tiro Devanagari', serif" }}>
                Kala
              </span>
              <span className={`text-3xl md:text-4xl transition-colors duration-500 ${textColor}`} style={{ fontFamily: "'Tiro Devanagari', serif", letterSpacing: '4px', lineHeight: '1.1' }}>
                PRAYAG
              </span>
              <span className={`text-[7px] tracking-[0.5em] uppercase mt-1 transition-opacity duration-500 font-medium ${accentColor}`}>
                Artisanal Heritage
              </span>
            </div>
          </button>

          {/* Desktop Navigation — 5 primary links only */}
          <div className="hidden lg:flex items-center space-x-7">
            {desktopLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleMobileNavigate(link.id)}
                className={`group relative text-[11px] tracking-widest uppercase transition-all duration-300 ${currentPage === link.id
                  ? 'text-[#8B735B] font-semibold'
                  : `${isLightMode ? 'text-[#4A4A4A] hover:text-[#1A1A1A]' : 'text-white/90 hover:text-white'}`
                  }`}
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 h-[1px] bg-[#8B735B] transition-all duration-300 ${currentPage === link.id ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4 relative z-[110]">

            {/* Cart Icon */}
            <button
              onClick={onToggleCart}
              className={`group relative flex items-center gap-2 p-2 transition-all duration-300 rounded-full ${textColor}`}
              aria-label="View Cart"
            >
              <div className="relative">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#8B735B] text-white text-[8px] min-w-[14px] h-[14px] flex items-center justify-center rounded-full font-bold px-0.5 animate-in zoom-in duration-300">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:block text-[9px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                Cart
              </span>
            </button>

            {/* Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`group flex items-center gap-2 p-2 transition-all duration-300 rounded-full ${textColor}`}
              aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
            >
              <span className="hidden md:block text-[10px] uppercase tracking-[0.3em] font-bold opacity-70 group-hover:opacity-100 transition-opacity">
                {isMenuOpen ? 'Close' : 'Menu'}
              </span>
              <div className="w-8 h-8 flex flex-col justify-center items-center gap-1.5">
                <span className={`w-6 h-[1.5px] bg-current transition-all duration-500 ease-in-out ${isMenuOpen ? 'rotate-45 translate-y-[7.5px]' : ''}`}></span>
                <span className={`w-6 h-[1.5px] bg-current transition-all duration-300 ease-in-out ${isMenuOpen ? 'opacity-0 scale-x-0' : 'scale-x-100'}`}></span>
                <span className={`w-6 h-[1.5px] bg-current transition-all duration-500 ease-in-out ${isMenuOpen ? '-rotate-45 -translate-y-[7.5px]' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Navigation Drawer */}
      <div
        className={`fixed inset-0 z-[95] transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] transform overflow-y-auto overscroll-behavior-contain ${isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
          }`}
        style={{ backgroundColor: 'rgba(10, 10, 10, 0.75)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
      >
        <div className="flex flex-col min-h-full items-center justify-center px-10 pt-32 pb-16 space-y-12">
          {/* Main Links */}
          <div className="grid grid-cols-2 gap-y-8 gap-x-6 md:gap-y-12 md:gap-x-16 text-center w-full max-w-2xl mx-auto">
            {navLinks.map((link, idx) => (
              <button
                key={link.id}
                onClick={() => handleMobileNavigate(link.id)}
                className={`text-2xl md:text-5xl serif tracking-wider transition-all duration-700 transform ${isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
                  } ${currentPage === link.id ? 'text-[#8B735B]' : 'text-white hover:text-[#8B735B]'}`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                {link.name}
              </button>
            ))}
          </div>

          <div className={`w-12 h-[1px] bg-white/20 transition-all duration-1000 delay-500 ${isMenuOpen ? 'scale-x-100' : 'scale-x-0'}`}></div>

          {/* Secondary Actions */}
          <div className={`flex flex-col w-full gap-4 max-w-sm transition-all duration-700 delay-[600ms] ${isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}>
            <div className="flex justify-center">
              <button
                onClick={() => handleMobileNavigate('artisan-login')}
                className="w-full py-4 bg-white/5 border border-white/10 text-white text-[9px] tracking-[0.2em] uppercase font-bold hover:bg-white/10"
              >
                Artisan Login
              </button>
            </div>
          </div>

          <div className={`pt-12 transition-all duration-700 delay-[800ms] ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
            <p className="text-[9px] uppercase tracking-[0.6em] text-white/40 font-medium text-center">
              © {new Date().getFullYear()} Kala Prayag Heritage Collective
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
