
import React, { useState } from 'react';
import { Product, Category, CartItem } from '../types';
import { CATEGORIES } from '../constants.tsx';
import { useTranslate } from '../hooks/useTranslate';
import WishlistButton from '../components/WishlistButton';

interface ShopProps {
  products: Product[];
  onViewProduct: (id: string) => void;
  onAddToCart?: (item: CartItem) => void;
  onToggleCart?: () => void;
}

const Shop: React.FC<ShopProps> = ({ products, onViewProduct, onAddToCart, onToggleCart }) => {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFirstImage, setShowFirstImage] = useState(false);
  const { t } = useTranslate();

  // Only show approved products
  const approvedProducts = products.filter(p => p.status === 'approved');

  const filteredProducts = approvedProducts.filter(p => {
    const categoryMatch = activeCategory === 'All' || p.category === activeCategory;
    const searchMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  return (
    <>
      {/* ── Hero Banner ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '280px',
          marginTop: '64px', /* clears fixed navbar */
          overflow: 'hidden',
          backgroundImage: 'url(/shop-hero-banner.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark uniform overlay for readability */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
          }}
        />

        {/* Content row */}
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
          <h1 className="text-5xl md:text-6xl serif mb-4 text-white tracking-widest leading-tight drop-shadow-md">
            {t('Collection')}
          </h1>
          <p className="text-white/80 font-light max-w-xl mx-auto text-sm md:text-base drop-shadow-sm leading-relaxed">
            {t('Explore our range of handcrafted decor pieces, each meticulously made using heritage techniques.')}
          </p>
        </div>
      </div>

      {/* Main shop content */}
      <div className="pt-12 pb-24 min-h-screen px-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Search + Horizontal Categories */}
      <div className="mb-12 space-y-8">
        <div className="relative max-w-md mx-auto">
          <input
            type="text"
            placeholder={t('Search...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-b border-[#D1D1D1] py-2 text-sm focus:outline-none focus:border-[#2C2C2C] transition-all pr-8"
          />
          <svg className="w-4 h-4 absolute right-0 top-3 text-[#999]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as Category)}
              className={`px-6 py-2 text-xs uppercase tracking-widest border transition-all ${activeCategory === cat ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]' : 'border-[#D1D1D1] text-[#666] hover:border-[#2C2C2C] hover:text-[#2C2C2C]'}`}
            >
              {t(cat)}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-6">
          <span className="text-xs uppercase tracking-widest text-[#999]">
            {filteredProducts.length} {t('items found')}
          </span>
          {activeCategory === 'Lighting' && (
            <div className="flex items-center gap-3">
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#999] font-semibold">
                {showFirstImage ? t('Ambient View') : t('Lit View')}
              </span>
              <button
                onClick={() => setShowFirstImage(p => !p)}
                className={`relative w-10 h-5 rounded-full transition-colors duration-300 focus:outline-none ${showFirstImage ? 'bg-[#2C2C2C]' : 'bg-[#D1D1D1]'
                  }`}
                title="Toggle image view"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${showFirstImage ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        {/* Product Grid */}
        <main className="flex-grow">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group cursor-pointer"
                onClick={() => onViewProduct(product.id)}
              >
                <div className="relative overflow-hidden aspect-[3/4] bg-[#F5F5F5] mb-3 rounded-sm shadow-sm transition-shadow group-hover:shadow-md">
                  {product.images[1] ? (
                    <>
                      <img
                        src={showFirstImage ? product.images[0] : product.images[1]}
                        className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                        alt={product.name}
                      />
                      <img
                        src={showFirstImage ? product.images[1] : product.images[0]}
                        className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                        alt={`${product.name} alternate view`}
                      />
                    </>
                  ) : (
                    <img
                      src={product.images[0] || 'https://via.placeholder.com/800'}
                      className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                      alt={product.name}
                    />
                  )}
                  {/* Wishlist Button */}
                  <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <WishlistButton productId={product.id} variant="minimal" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm serif mb-0.5 group-hover:text-[#8B735B] transition-colors line-clamp-1">{t(product.name)}</h3>
                  <p className="text-[9px] uppercase tracking-widest text-[#999] mb-1.5">{t(product.category)}</p>
                  <div className="price-container">
                    <div className="price-stack">
                      <div className="price-item flex items-center gap-2">
                        <p className="text-[#999] line-through text-xs">₹ {Math.round(product.price * 1.10).toLocaleString()}</p>
                        <p className="text-[#2C2C2C] font-bold text-sm">₹ {product.price.toLocaleString()}</p>
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
                        <p className="text-[10px] uppercase tracking-widest text-[#8B735B] font-bold">{t('Add to Cart')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="py-32 text-center text-[#999]">
              <p className="serif text-2xl italic">{t('No pieces found matching your criteria.')}</p>
            </div>
          )}
        </main>
      </div>

      </div>
    </>
  );
};

export default Shop;
