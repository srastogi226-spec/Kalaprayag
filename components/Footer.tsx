
import React from 'react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#2C2C2C] text-white pt-20 pb-12 w-full">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        
        {/* Top Section: Community Signup */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-600 pb-16 mb-10 gap-10">
          
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>
              JOIN OUR COMMUNITY
            </h2>
            <p className="text-gray-300 text-[13px] font-medium tracking-wide">
              Sign up for our community for exclusive updates.
            </p>
          </div>

          <div className="flex-1 w-full flex justify-start md:justify-end">
            <div className="flex w-full max-w-md">
              <input
                type="email"
                placeholder="Email address"
                className="flex-grow bg-[#FAF9F6] text-black px-4 py-3 text-[13px] focus:outline-none placeholder-gray-500"
              />
              <button className="bg-[#8B735B] text-white px-8 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#6e5844] transition-colors whitespace-nowrap">
                SIGN UP
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Section: Links & Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* Social Icons */}
          <div className="flex space-x-5 text-white">
            <a href="#" className="hover:text-[#8B735B] transition-colors" aria-label="X (Twitter)">
              <svg className="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#" className="hover:text-[#8B735B] transition-colors" aria-label="Facebook">
              <svg className="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="#" className="hover:text-[#8B735B] transition-colors" aria-label="Instagram">
              <svg className="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-[10px] text-gray-400" style={{ fontFamily: "'Inter', sans-serif" }}>
            <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">Legal & Privacy</button>
            <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">Shipping & Returns</button>
            <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">Accessibility</button>
          </div>

          <div className="text-[10px] text-gray-400" style={{ fontFamily: "'Inter', sans-serif" }}>
            Kala Prayag © {currentYear}
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
