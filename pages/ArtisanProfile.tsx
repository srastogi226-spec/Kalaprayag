
import React, { useState } from 'react';
import { Artisan, Product, Workshop, Review, Message, CartItem } from '../types';

interface ArtisanProfileProps {
  artisan: Artisan;
  products: Product[];
  workshops: Workshop[];
  reviews: Review[];
  onViewProduct: (id: string) => void;
  onViewWorkshop: (id: string) => void;
  onRequestCustomPiece: (artisanId: string) => void;
  onSendMessage: (msg: Message) => void;
  onAddToCart?: (item: CartItem) => void;
  cart?: CartItem[];
}

const ArtisanProfile: React.FC<ArtisanProfileProps> = ({
  artisan, products, workshops, reviews, onViewProduct, onViewWorkshop, onRequestCustomPiece, onSendMessage, onAddToCart, cart
}) => {
  const [activeTab, setActiveTab] = useState<'collection' | 'academy' | 'journal' | 'reviews'>('collection');
  const [isMessaging, setIsMessaging] = useState(false);
  const [msgForm, setMsgForm] = useState({ subject: '', body: '', senderName: '', senderEmail: '' });
  const [msgSent, setMsgSent] = useState(false);

  const artisanProducts = products.filter(p => p.artisanId === artisan.id && p.status === 'approved');
  const artisanWorkshops = workshops.filter(w => w.artisanId === artisan.id && w.status === 'approved');
  const journalEntries = artisan.studioJournal || [];

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMsg: Message = {
      id: 'msg-' + Math.random().toString(36).substr(2, 9),
      ...msgForm,
      receiverId: artisan.id,
      status: 'unread',
      createdAt: new Date().toISOString()
    };
    onSendMessage(newMsg);
    setMsgSent(true);
    setTimeout(() => {
      setIsMessaging(false);
      setMsgSent(false);
      setMsgForm({ subject: '', body: '', senderName: '', senderEmail: '' });
    }, 2000);
  };

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* Messaging Modal */}
      {isMessaging && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-8 shadow-2xl space-y-6 animate-in zoom-in duration-300">
            {msgSent ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-2xl serif">Message Sent!</h3>
                <p className="text-[#999] text-sm italic">The artist will be notified.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl serif">Message {artisan.brandName || artisan.name}</h2>
                  <button onClick={() => setIsMessaging(false)} className="text-[#999] hover:text-black">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <form onSubmit={handleMessageSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Your Name</label>
                      <input required type="text" className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none" value={msgForm.senderName} onChange={e => setMsgForm({ ...msgForm, senderName: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Your Email</label>
                      <input required type="email" className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none" value={msgForm.senderEmail} onChange={e => setMsgForm({ ...msgForm, senderEmail: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Subject</label>
                    <input required type="text" className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none" value={msgForm.subject} onChange={e => setMsgForm({ ...msgForm, subject: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Message</label>
                    <textarea required className="w-full bg-[#F9F9F9] border border-[#E5E5E5] p-4 text-sm focus:outline-none min-h-[120px]" value={msgForm.body} onChange={e => setMsgForm({ ...msgForm, body: e.target.value })}></textarea>
                  </div>
                  <button type="submit" className="w-full bg-[#2C2C2C] text-white py-4 text-xs uppercase tracking-[0.4em] font-bold hover:bg-black transition-all">
                    Send Message
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mb-24 items-center">
        <div className="lg:col-span-1">
          <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-gray-100 shadow-2xl bg-gray-50 relative group">
            <img src={artisan.profilePhoto} className="w-full h-full object-cover" alt={artisan.brandName || artisan.name} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-4">
            <span className="text-xs uppercase tracking-[0.3em] text-[#8B735B]">{artisan.craftType}</span>
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className={`w-3 h-3 ${i < Math.floor(artisan.rating) ? 'fill-current' : 'fill-gray-300'}`} viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
              ))}
            </div>
          </div>
          <h1 className="text-6xl serif">{artisan.brandName || artisan.name}</h1>
          <p className="text-sm font-medium uppercase tracking-widest text-[#999]">{artisan.location} • {artisan.experience} Years of Mastery</p>
          <p className="text-lg font-light leading-relaxed text-[#4A4A4A] max-w-2xl">{artisan.bio}</p>

          <div className="flex flex-wrap gap-4 pt-4">
            <button onClick={() => onRequestCustomPiece(artisan.id)} className="bg-[#2C2C2C] text-white px-8 py-3 text-[10px] uppercase tracking-widest font-semibold hover:bg-black transition-all rounded-lg">
              Request Custom Piece
            </button>
            <button onClick={() => setIsMessaging(true)} className="border border-[#2C2C2C] text-[#2C2C2C] px-8 py-3 text-[10px] uppercase tracking-widest font-semibold hover:bg-[#2C2C2C] hover:text-white transition-all rounded-lg">
              Message
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-100 mb-16 flex flex-wrap gap-8 md:gap-12">
        <button onClick={() => setActiveTab('collection')} className={`pb-4 text-[10px] md:text-xs uppercase tracking-widest font-semibold transition-all ${activeTab === 'collection' ? 'border-b-2 border-black' : 'text-[#999] hover:text-[#2C2C2C]'}`}>The Collection ({artisanProducts.length})</button>
        <button onClick={() => setActiveTab('academy')} className={`pb-4 text-[10px] md:text-xs uppercase tracking-widest transition-all ${activeTab === 'academy' ? 'border-b-2 border-black font-semibold' : 'text-[#999] hover:text-[#2C2C2C]'}`}>Academy ({artisanWorkshops.length})</button>
        <button onClick={() => setActiveTab('journal')} className={`pb-4 text-[10px] md:text-xs uppercase tracking-widest transition-all ${activeTab === 'journal' ? 'border-b-2 border-black font-semibold' : 'text-[#999] hover:text-[#2C2C2C]'}`}>Studio Journal ({journalEntries.length})</button>
        <button onClick={() => setActiveTab('reviews')} className={`pb-4 text-[10px] md:text-xs uppercase tracking-widest transition-all ${activeTab === 'reviews' ? 'border-b-2 border-black font-semibold' : 'text-[#999] hover:text-[#2C2C2C]'}`}>Reviews ({reviews.length})</button>
      </div>

      {/* Collection Tab */}
      {activeTab === 'collection' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-24 animate-in fade-in duration-300">
          {artisanProducts.length === 0 && <p className="col-span-4 text-center py-20 text-[#999] italic serif text-xl">No products yet.</p>}
          {artisanProducts.map(p => (
            <div key={p.id} className="group cursor-pointer" onClick={() => onViewProduct(p.id)}>
              <div className="aspect-[4/5] overflow-hidden bg-gray-50 mb-4">
                <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={p.name} />
              </div>
              <h3 className="serif text-lg">{p.name}</h3>
              <p className="text-xs text-[#999] uppercase tracking-widest">₹ {p.price.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Academy Tab */}
      {activeTab === 'academy' && (
        <div className="mb-24 animate-in fade-in duration-300">
          {artisanWorkshops.length === 0 ? (
            <p className="text-center py-20 text-[#999] italic serif text-xl">No workshops available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {artisanWorkshops.map(w => (
                <div key={w.id} className="bg-white border border-gray-100 p-8 flex gap-8 items-center cursor-pointer hover:shadow-lg transition-all" onClick={() => onViewWorkshop(w.id)}>
                  <img src={w.image} className="w-32 h-32 object-cover rounded" alt="" />
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#8B735B]">{w.mode}</span>
                    <h3 className="text-xl serif my-2">{w.title}</h3>
                    <p className="text-sm font-light text-[#666] line-clamp-2">{w.description}</p>
                    <button className="mt-4 text-[10px] uppercase tracking-[0.2em] font-bold border-b border-black">Book Your Spot</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Journal Tab */}
      {activeTab === 'journal' && (
        <div className="max-w-4xl mx-auto mb-24 animate-in slide-in-from-bottom-4 duration-500">
          {journalEntries.length === 0 ? (
            <div className="text-center py-32 bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl">
              <p className="serif text-2xl italic text-[#CCC]">The artisan's journal is quiet for now.</p>
              <p className="text-[10px] uppercase tracking-widest text-[#DDD] mt-4">Check back soon for stories from the studio.</p>
            </div>
          ) : (
            <div className="space-y-32">
              {journalEntries.map((entry, i) => (
                <article key={entry.id} className="group">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
                    <div className="md:col-span-1 space-y-4">
                      <div className="h-px w-12 bg-black opacity-20" />
                      <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#8B735B] transform -rotate-90 origin-left translate-y-12 whitespace-nowrap">
                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="md:col-span-11 space-y-8">
                      {entry.image && (
                        <div className="aspect-video overflow-hidden bg-gray-100 rounded-sm">
                          <img src={entry.image} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="" />
                        </div>
                      )}
                      <div className="max-w-2xl">
                        <h2 className="text-4xl serif mb-6 group-hover:text-[#8B735B] transition-colors">{entry.title}</h2>
                        <div className="h-px w-24 bg-[#8B735B] opacity-30 mb-8" />
                        <p className="text-lg font-light leading-relaxed text-[#4A4A4A] whitespace-pre-line">
                          {entry.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="mb-24 animate-in fade-in duration-300">
          {reviews.length === 0 ? (
            <p className="text-center py-20 text-[#999] italic serif text-xl">No reviews yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {reviews.map(r => (
                <div key={r.id} className="space-y-4">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-current' : 'fill-gray-200'}`} viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                    ))}
                  </div>
                  <p className="text-sm font-light italic leading-relaxed text-[#4A4A4A]">"{r.comment}"</p>
                  <p className="text-[10px] uppercase tracking-widest font-bold">— {r.authorName}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArtisanProfile;
