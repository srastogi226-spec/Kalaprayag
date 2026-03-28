import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMobileNavigate = (id: string) => {
    onNavigate(id);
    setIsMenuOpen(false);
  };

  const desktopLinks = [
    { name: 'Shop', id: 'shop' },
    { name: 'Collections', id: 'shop' },
    { name: 'Artisans', id: 'artisan-profiles' },
    { name: 'About', id: 'about' },
    { name: 'Contact', id: 'contact' },
  ];

  const navBg = isScrolled
    ? 'bg-white border-b border-gray-200 shadow-sm'
    : 'bg-white';

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-[100] transition-colors duration-300 ${navBg}`}>
        <div className="max-w-[1400px] mx-auto px-6 h-20 md:h-24 flex justify-between items-center">

          {/* Logo (Left-aligned) */}
          <div className="flex-1 flex justify-start">
            <button
              onClick={() => handleMobileNavigate('home')}
              className="text-left"
            >
              <h1 className="text-2xl md:text-[28px] font-bold text-[#1A1A1A] tracking-wider" style={{ fontFamily: "'Playfair Display', serif" }}>
                KALA PRAYAG
              </h1>
            </button>
          </div>

          {/* Centered Navigation */}
          <div className="hidden lg:flex flex-1 justify-center space-x-10">
            {desktopLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleMobileNavigate(link.id)}
                className={`text-[11px] font-medium tracking-[0.25em] uppercase transition-colors hover:text-[#8B735B] ${currentPage === link.id ? 'text-[#8B735B]' : 'text-[#4A4A4A]'}`}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {link.name}
              </button>
            ))}
          </div>

          {/* Right-aligned Icons */}
          <div className="flex-1 flex justify-end items-center gap-6">

            {/* Search Icon */}
            <button
              onClick={() => handleMobileNavigate('shop')}
              className="text-[#1A1A1A] hover:text-[#8B735B] transition-colors"
              aria-label="Search"
            >
              <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>

            {/* Account Icon */}
            <button
              onClick={() => handleMobileNavigate('track-order')}
              className="text-[#1A1A1A] hover:text-[#8B735B] transition-colors"
              aria-label="Account"
            >
              <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </button>

            {/* Cart Icon */}
            <button
              onClick={onToggleCart}
              className="relative text-[#1A1A1A] hover:text-[#8B735B] transition-colors"
              aria-label="Cart"
            >
              <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#8B735B] text-white text-[9px] min-w-[16px] h-[16px] flex items-center justify-center rounded-full font-bold px-1">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Menu Toggle (Mobile) */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden text-[#1A1A1A] p-1 ml-2"
              aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className={`h-px bg-current w-full transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-[9px]' : ''}`}></span>
                <span className={`h-px bg-current w-full transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`h-px bg-current w-full transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-[9px]' : ''}`}></span>
              </div>
            </button>

          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed inset-0 z-[90] bg-white transition-transform duration-500 ease-in-out lg:hidden ${
          isMenuOpen ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full pt-20 pb-10 space-y-8">
          {desktopLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleMobileNavigate(link.id)}
              className="text-[14px] font-medium tracking-[0.2em] uppercase text-[#1A1A1A] hover:text-[#8B735B] transition-colors"
            >
              {link.name}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Navbar;
