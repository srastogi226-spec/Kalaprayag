import React, { useState } from 'react';
import { Workshop, Artisan, ClassBooking } from '../types';
import { useTranslate } from '../hooks/useTranslate';

interface WorkshopsProps {
  workshops?: Workshop[];
  artisans?: Artisan[];
  classBookings?: ClassBooking[];
  onViewWorkshop?: (id: string) => void;
  onNavigate: (page: string) => void;
}

const Workshops: React.FC<WorkshopsProps> = ({ onNavigate }) => {
  const { t } = useTranslate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  const upcomingMasterclasses = [
    {
      title: 'Blue Pottery & Floral Glazes',
      craft: 'Jaipur Ceramic Arts',
      master: 'Master Pandit Ram Gopal',
      image: '/workshops-banner.png',
      location: 'Jaipur Studio & Live Stream',
      season: 'Coming Winter 2026',
    },
    {
      title: 'Lost-Wax Brass & Bronze Casting',
      craft: 'Dhokra Metal Craft',
      master: 'Artisan Devendra Jhankar',
      image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=1000',
      location: 'Bastar Craft Village & Online',
      season: 'Coming Early 2027',
    },
    {
      title: 'Heritage Hand-Block Printing',
      craft: 'Natural Dyes & Woodblocks',
      master: 'Master Artisan Sunita Craft',
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=1000',
      location: 'Bagru Workshop & Virtual Masterclass',
      season: 'Coming Spring 2027',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] pt-24 pb-24">
      {/* Hero Section */}
      <div className="relative w-full max-w-7xl mx-auto px-6 mb-16">
        <div className="relative rounded-2xl overflow-hidden bg-[#1A1A1A] text-white p-10 md:p-20 shadow-2xl border border-white/10">
          <div
            className="absolute inset-0 opacity-30 mix-blend-overlay bg-cover bg-center"
            style={{ backgroundImage: 'url(/workshops-banner.png)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A] via-[#1A1A1A]/90 to-transparent" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B735B]/20 border border-[#8B735B]/40 text-[#C4A97D] text-[10px] uppercase tracking-[0.25em] font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-[#C4A97D] animate-pulse" />
              {t('Academy & Masterclasses · Coming Soon')}
            </div>

            <h1 className="text-4xl md:text-6xl serif mb-6 tracking-wide leading-tight text-white">
              {t('Heritage Workshops')}
              <span className="block text-2xl md:text-3xl font-light italic text-[#C4A97D] mt-2">
                {t('Learn directly from India’s Master Artisans')}
              </span>
            </h1>

            <p className="text-white/70 text-sm md:text-base font-light leading-relaxed mb-10 max-w-xl">
              {t(
                'We are curating intimate physical studio sessions and interactive digital masterclasses. Connect with legendary craftspeople and preserve centuries-old art forms.'
              )}
            </p>

            {/* Newsletter / Waitlist Signup */}
            <div className="bg-white/5 border border-white/15 p-6 rounded-xl backdrop-blur-md max-w-lg">
              <p className="text-xs uppercase tracking-widest text-[#C4A97D] font-semibold mb-3">
                {t('Be First in Line')}
              </p>
              {submitted ? (
                <div className="p-4 bg-[#8B735B]/20 border border-[#8B735B]/50 rounded-lg text-center">
                  <p className="text-sm font-medium text-white">{t('You are on the priority waitlist!')}</p>
                  <p className="text-xs text-white/60 mt-1">{t('We will notify you as soon as bookings open.')}</p>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('Enter your email for early access')}
                    className="flex-1 bg-white/10 border border-white/20 px-4 py-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C4A97D] rounded-lg transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#8B735B] hover:bg-[#A3896F] text-white text-[10px] uppercase tracking-widest font-bold rounded-lg transition-colors whitespace-nowrap"
                  >
                    {t('Notify Me')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Preview Grid */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 pb-6 border-b border-[#E5E0D8]">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#8B735B] font-semibold block mb-2">
              {t('Sneak Peek')}
            </span>
            <h2 className="text-2xl md:text-3xl serif tracking-wider text-[#1A1A1A]">
              {t('Upcoming Masterclass Series')}
            </h2>
          </div>
          <p className="text-xs text-[#777] font-light max-w-sm mt-2 md:mt-0">
            {t('Craft curriculum and live booking schedules are currently being crafted in collaboration with our master artisans.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {upcomingMasterclasses.map((item, index) => (
            <div
              key={index}
              className="group bg-white rounded-xl overflow-hidden border border-[#EAE5DD] shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter grayscale group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/80 via-transparent to-transparent" />
                <div className="absolute top-4 right-4 bg-[#1A1A1A]/90 backdrop-blur text-[#C4A97D] text-[9px] uppercase tracking-widest px-3 py-1 font-semibold rounded-full border border-[#C4A97D]/30">
                  {item.season}
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-[9px] uppercase tracking-widest text-[#C4A97D] font-medium block">
                    {item.craft}
                  </span>
                  <h3 className="text-lg serif font-medium drop-shadow">{item.title}</h3>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between bg-white">
                <div className="space-y-2 mb-6">
                  <p className="text-xs text-[#666] flex items-center gap-2 font-light">
                    <svg className="w-4 h-4 text-[#8B735B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {item.master}
                  </p>
                  <p className="text-xs text-[#666] flex items-center gap-2 font-light">
                    <svg className="w-4 h-4 text-[#8B735B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {item.location}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#F0ECE1] flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-[#999] font-medium">
                    {t('Status')}
                  </span>
                  <span className="text-xs font-semibold text-[#8B735B]">
                    {t('Coming Soon')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action redirect to shop */}
        <div className="mt-16 text-center bg-[#EFECE6] p-10 rounded-2xl border border-[#DFD9CE]">
          <h3 className="text-xl md:text-2xl serif mb-3 text-[#1A1A1A]">
            {t('Explore Our Handcrafted Collections')}
          </h3>
          <p className="text-xs md:text-sm text-[#666] max-w-md mx-auto mb-6 font-light">
            {t('While we prepare our workshop masterclasses, discover master-made pieces available directly in our studio collection.')}
          </p>
          <button
            onClick={() => onNavigate('shop')}
            className="px-8 py-3 bg-[#1A1A1A] hover:bg-[#8B735B] text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-lg transition-colors shadow-md"
          >
            {t('Visit Kala Prayag Shop')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Workshops;
