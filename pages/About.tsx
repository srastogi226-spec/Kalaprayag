
import React from 'react';

const About: React.FC = () => {
  return (
    <div className="pt-32 pb-24 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto px-6">
        <header className="mb-24 text-center">
          <span className="text-xs uppercase tracking-widest text-[#8B735B] mb-4 block">Our Origin</span>
          <h1 className="text-7xl serif mb-12">The Union of <br/> Craft & Soul</h1>
          <div className="w-px h-24 bg-[#D1D1D1] mx-auto mb-12"></div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center mb-32">
          <div>
            <h2 className="text-4xl serif mb-8">The Philosophy of 'Prayag'</h2>
            <p className="text-[#4A4A4A] text-lg leading-loose font-light mb-8">
              In Sanskrit, 'Prayag' means confluence. At Kala Prayag, we represent the meeting point of three streams: ancestral wisdom, sustainable materials, and contemporary design language.
            </p>
            <p className="text-[#4A4A4A] text-lg leading-loose font-light">
              We started in a small workshop in the outskirts of Hampi, realizing that the incredible skills of our local artisans were being lost to mass-produced replicas. Kala Prayag was born to restore the dignity of manual craft.
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
              <h3 className="text-xl serif mb-4">Conscious Luxury</h3>
              <p className="text-sm text-[#666] leading-relaxed">We source materials ethically, ensuring every stone, piece of metal, or fiber has a transparent journey from the earth to your home.</p>
            </div>
            <div>
              <div className="text-4xl serif text-[#8B735B] mb-4">02.</div>
              <h3 className="text-xl serif mb-4">Artisan Autonomy</h3>
              <p className="text-sm text-[#666] leading-relaxed">Our makers are partners, not laborers. We ensure fair wages that are 2x the market average, empowering artisan communities.</p>
            </div>
            <div>
              <div className="text-4xl serif text-[#8B735B] mb-4">03.</div>
              <h3 className="text-xl serif mb-4">Ageless Design</h3>
              <p className="text-sm text-[#666] leading-relaxed">We don't follow trends. Our pieces are designed to be relevant for decades, gathering character as they age in your space.</p>
            </div>
          </div>
        </section>

        <div className="relative h-[600px] mb-32 overflow-hidden">
           <img src="https://images.unsplash.com/photo-1541255197759-7b5937d8995a?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover" alt="Artisan Banner" />
           <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center px-6">
              <div className="max-w-2xl">
                <h2 className="text-4xl md:text-5xl serif text-white mb-6 italic">"A machine can copy a shape, but only a human hand can imbue it with spirit."</h2>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default About;
