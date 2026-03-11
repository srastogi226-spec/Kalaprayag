import React, { useState } from 'react';
import { Product, CartItem, ProductOrder } from '../types';
interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  cart: CartItem[];
  onAddToCart: (item: CartItem) => void;
  onToggleCart: () => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onBack, cart, onAddToCart, onToggleCart }) => {
  const [selectedSize, setSelectedSize] = useState('Standard');
  const [selectedFinish, setSelectedFinish] = useState('Original');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  const finishes = ['Original', 'Matte Black', 'Antique Gold', 'Burnished Silver'];
  const sizes = ['Standard', 'Exhibition (Large)', 'Studio (Small)'];

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const toggleAccordion = (section: string) => setOpenAccordion(prev => prev === section ? null : section);

  const handleAddToCart = () => {
    onAddToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity,
      size: product.customizable ? selectedSize : 'Standard',
      finish: product.customizable ? selectedFinish : 'Original',
      notes,
    });
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };


  const accordionSections = [
    {
      id: 'details', title: 'Details & Materials',
      content: (
        <div className="text-sm text-[#666] leading-relaxed space-y-2 pb-4">
          <p><span className="font-semibold text-[#2C2C2C]">Materials:</span> {product.materials.join(', ')}</p>
          <p><span className="font-semibold text-[#2C2C2C]">Category:</span> {product.category}</p>
          {product.dimensions && <p><span className="font-semibold text-[#2C2C2C]">Dimensions:</span> {product.dimensions}</p>}
          <p><span className="font-semibold text-[#2C2C2C]">Stock Available:</span> {product.stock} units</p>
          <p className="pt-2 font-light italic">Each piece is individually handcrafted — minor variations in texture, tone, and form are a hallmark of authentic artisanal work.</p>
        </div>
      ),
    },
    {
      id: 'artisan', title: 'Artisan & Heritage',
      content: (
        <div className="text-sm text-[#666] leading-relaxed space-y-2 pb-4">
          <p><span className="font-semibold text-[#2C2C2C]">Crafted by:</span> {product.artisan}</p>
          <p className="font-light">Our artisans are master craftspeople who have honed their skills over generations. Every piece undergoes a rigorous quality check before reaching your home.</p>
        </div>
      ),
    },
    {
      id: 'shipping', title: 'Shipping & Returns',
      content: (
        <div className="text-sm text-[#666] leading-relaxed space-y-2 pb-4">
          <p><span className="font-semibold text-[#2C2C2C]">Delivery:</span> 7–14 business days</p>
          <p><span className="font-semibold text-[#2C2C2C]">Packaging:</span> Archival tissue and custom foam-lined crates.</p>
          <p><span className="font-semibold text-[#2C2C2C]">Returns:</span> Within 7 days if item arrives damaged. Custom orders non-refundable.</p>
        </div>
      ),
    },
  ];

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto animate-in fade-in duration-500">

      {/* Toast */}
      <div className={`fixed top-24 right-8 z-[200] bg-[#2C2C2C] text-white px-8 py-4 shadow-2xl flex items-center gap-3 transition-all duration-500 ${toast ? 'translate-x-0 opacity-100' : 'translate-x-32 opacity-0'}`}>
        <svg className="w-5 h-5 text-[#8B735B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        <span className="text-xs uppercase tracking-widest font-medium">Added to Cart</span>
        <button onClick={onToggleCart} className="ml-4 text-[#8B735B] text-xs underline underline-offset-2">View Cart</button>
      </div>

      {/* Cart Icon */}
      {cart.length > 0 && (
        <button onClick={onToggleCart} className="fixed top-24 left-8 z-[150] bg-white border border-[#E5E5E5] shadow-lg px-5 py-3 flex items-center gap-3 hover:shadow-xl transition-all animate-in slide-in-from-left duration-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          <span className="text-xs uppercase tracking-widest font-bold">{cart.reduce((s, i) => s + i.quantity, 0)} items</span>
          <span className="text-xs text-[#8B735B] font-bold">₹ {cartTotal.toLocaleString()}</span>
        </button>
      )}


      <button onClick={onBack} className="flex items-center text-xs uppercase tracking-widest text-[#999] hover:text-[#2C2C2C] mb-12 transition-colors">
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Collection
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Images */}
        <div className="space-y-6">
          <div className="aspect-square overflow-hidden bg-[#F5F5F5]">
            <img src={product.images[activeImageIndex] || 'https://images.unsplash.com/photo-1588362951121-3ee319b018b2?auto=format&fit=crop&q=80&w=800'} className="w-full h-full object-cover" alt={product.name} />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((img, idx) => (
                <div key={idx} onClick={() => setActiveImageIndex(idx)} className={`aspect-square overflow-hidden cursor-pointer border-2 transition-all ${activeImageIndex === idx ? 'border-[#2C2C2C]' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <img src={img} className="w-full h-full object-cover" alt={`view ${idx + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#8B735B] mb-2 block">{product.category}</span>
          <h1 className="text-5xl serif mb-6">{product.name}</h1>
          <p className="text-2xl text-[#2C2C2C] mb-8">₹ {product.price.toLocaleString()}</p>
          <div className="prose prose-sm text-[#4A4A4A] max-w-none mb-10 leading-relaxed font-light">
            <p>{product.description}</p>
          </div>

          <div className="space-y-10 border-t border-[#E5E5E5] pt-10">

            {/* Size — only for customizable products */}
            {product.customizable && (
              <div>
                <h3 className="text-xs uppercase tracking-widest font-semibold mb-6">Select Size</h3>
                <div className="flex flex-wrap gap-4">
                  {sizes.map(size => (
                    <button key={size} onClick={() => setSelectedSize(size)} className={`px-6 py-3 text-xs uppercase tracking-widest border transition-all ${selectedSize === size ? 'border-[#2C2C2C] bg-[#2C2C2C] text-white' : 'border-[#D1D1D1] text-[#666] hover:border-[#2C2C2C]'}`}>{size}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Finish — only for customizable products */}
            {product.customizable && (
              <div>
                <h3 className="text-xs uppercase tracking-widest font-semibold mb-6">Select Finish</h3>
                <div className="grid grid-cols-2 gap-4">
                  {finishes.map(finish => (
                    <button key={finish} onClick={() => setSelectedFinish(finish)} className={`px-6 py-4 text-xs text-left uppercase tracking-widest border flex items-center justify-between transition-all ${selectedFinish === finish ? 'border-[#2C2C2C] ring-1 ring-[#2C2C2C]' : 'border-[#D1D1D1] text-[#666] hover:border-[#2C2C2C]'}`}>
                      {finish}
                      {selectedFinish === finish && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M21 7L9 19L3.5 13.5L4.91 12.09L9 16.17L19.59 5.59L21 7Z" /></svg>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <h3 className="text-xs uppercase tracking-widest font-semibold mb-4">Custom Requests (Optional)</h3>
              <textarea placeholder="Any special notes for our artisans..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-[#F9F9F9] border border-[#E5E5E5] p-4 text-sm focus:outline-none focus:border-[#2C2C2C] min-h-[100px]" />
            </div>

            {/* Quantity + Add to Cart */}
            <div className="flex gap-6">
              <div className="flex items-center border border-[#D1D1D1]">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-4 py-2 hover:bg-[#F5F5F5]">-</button>
                <span className="px-6 py-2 text-sm">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="px-4 py-2 hover:bg-[#F5F5F5]">+</button>
              </div>
              <button onClick={handleAddToCart} className="flex-grow bg-[#2C2C2C] text-white py-4 text-xs uppercase tracking-[0.3em] font-medium hover:bg-[#8B735B] transition-all duration-300">
                Add to Cart
              </button>
            </div>

            {cart.length > 0 && (
              <button onClick={onToggleCart} className="w-full border border-[#2C2C2C] py-4 text-xs uppercase tracking-[0.3em] font-medium hover:bg-[#2C2C2C] hover:text-white transition-all duration-300">
                View Cart ({cart.reduce((s, i) => s + i.quantity, 0)}) · ₹ {cartTotal.toLocaleString()}
              </button>
            )}

            {/* Accordion */}
            <div className="pt-8 space-y-0">
              {accordionSections.map((section) => (
                <div key={section.id} className="border-b border-[#E5E5E5]">
                  <button onClick={() => toggleAccordion(section.id)} className="w-full flex justify-between items-center py-4 text-left group">
                    <span className="text-xs uppercase tracking-widest font-semibold group-hover:text-[#8B735B] transition-colors">{section.title}</span>
                    <svg className={`w-4 h-4 transition-transform duration-300 ${openAccordion === section.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${openAccordion === section.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    {section.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
