import React from 'react';
import { useTranslate } from '../hooks/useTranslate';

const About: React.FC = () => {
  const { t } = useTranslate();

  return (
    <>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '280px',
          marginTop: '64px',
          overflow: 'hidden',
          backgroundImage: 'url(/about-banner.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            height: '100%',
            maxWidth: '80rem',
            margin: '0 auto',
            padding: '0 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <span className="text-[10px] uppercase tracking-widest text-[#C4A882] mb-4 block font-semibold drop-shadow-md">{t('Our Origin')}</span>
          <h1 className="text-5xl md:text-6xl lg:text-7xl serif text-white tracking-widest leading-tight drop-shadow-md" dangerouslySetInnerHTML={{ __html: t('The Union of <br/> Craft & Soul') }}></h1>
        </div>
      </div>

      <div className="pt-12 pb-24 animate-in fade-in duration-700">
        <div className="max-w-7xl mx-auto px-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center mb-32">
          <div>
            <h2 className="text-4xl serif mb-8">{t("The Philosophy of 'Prayag'")}</h2>
            <p className="text-[#4A4A4A] text-lg leading-loose font-light mb-8">
              {t("In Sanskrit, 'Prayag' means confluence. At Kala Prayag, we represent the meeting point of three streams: ancestral wisdom, sustainable materials, and contemporary design language.")}
            </p>
            <p className="text-[#4A4A4A] text-lg leading-loose font-light">
              {t("We started in a small workshop in the outskirts of Hampi, realizing that the incredible skills of our local artisans were being lost to mass-produced replicas. Kala Prayag was born to restore the dignity of manual craft.")}
            </p>
          </div>
          <div className="aspect-[1/1] overflow-hidden">
            <img src="https://images.unsplash.com/photo-1493106819501-66d381c466f1?auto=format&fit=crop&q=80&w=1200" alt="Hampi landscape" className="w-full h-full object-cover" />
          </div>
        </div>

        <section className="mb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
            <div>
              <div className="text-4xl serif text-[#8B735B] mb-4">01.</div>
              <h3 className="text-xl serif mb-4">{t("Conscious Luxury")}</h3>
              <p className="text-sm text-[#666] leading-relaxed">{t("We source materials ethically, ensuring every stone, piece of metal, or fiber has a transparent journey from the earth to your home.")}</p>
            </div>
            <div>
              <div className="text-4xl serif text-[#8B735B] mb-4">02.</div>
              <h3 className="text-xl serif mb-4">{t("Artisan Autonomy")}</h3>
              <p className="text-sm text-[#666] leading-relaxed">{t("Our makers are partners, not laborers. We ensure fair wages that are 2x the market average, empowering artisan communities.")}</p>
            </div>
            <div>
              <div className="text-4xl serif text-[#8B735B] mb-4">03.</div>
              <h3 className="text-xl serif mb-4">{t("Ageless Design")}</h3>
              <p className="text-sm text-[#666] leading-relaxed">{t("We don't follow trends. Our pieces are designed to be relevant for decades, gathering character as they age in your space.")}</p>
            </div>
          </div>
        </section>

        <div className="relative h-[600px] mb-32 overflow-hidden">
          <img src="https://images.unsplash.com/photo-1541255197759-7b5937d8995a?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover" alt="Artisan Banner" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center px-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl serif text-white mb-6 italic">"{t("A machine can copy a shape, but only a human hand can imbue it with spirit.")}"</h2>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default About;
