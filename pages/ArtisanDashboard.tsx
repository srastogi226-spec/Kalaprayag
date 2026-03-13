
import React, { useState, useRef } from 'react';
import { Artisan, Product, Workshop, CustomOrder, Review, ProductOrder } from '../types';
import { compressImage, removeBackgroundAI, smartLighting, upscaleImage } from '../utils/imageUtils';
import Product3DViewer from '../components/Product3DViewer';

interface ArtisanDashboardProps {
  artisan: Artisan;
  products: Product[];
  workshops: Workshop[];
  customOrders: CustomOrder[];
  onAcceptOrder: (orderId: string, note: string) => void;
  reviews: Review[];
  onAddProduct: (product: Product) => void;
  onAddWorkshop: (workshop: Workshop) => void;
  onUpdateWorkshop: (workshop: Workshop) => void;
  onUpdateArtisan: (artisan: Artisan) => void;
  onUpdateProduct?: (product: Product) => void;
  onLogout?: () => void;
  productOrders?: ProductOrder[];
}

const ArtisanDashboard: React.FC<ArtisanDashboardProps> = ({
  artisan, products, workshops, customOrders, onAcceptOrder, reviews, onAddProduct, onAddWorkshop, onUpdateWorkshop, onUpdateArtisan, onUpdateProduct, onLogout, productOrders = []
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'workshops' | 'orders' | 'reviews' | 'pricing' | 'profile'>('overview');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'shop' | 'custom'>('all');
  const [profileForm, setProfileForm] = useState({ bio: artisan.bio || '', location: artisan.location || '', craftType: artisan.craftType || '', phone: artisan.phone || '', experience: artisan.experience || '', teachingInterest: artisan.teachingInterest || false });

  // Sync form when artisan updates from outside (like a photo upload finishing)
  React.useEffect(() => {
    setProfileForm({
      bio: artisan.bio || '',
      location: artisan.location || '',
      craftType: artisan.craftType || '',
      phone: artisan.phone || '',
      experience: artisan.experience || '',
      teachingInterest: artisan.teachingInterest || false
    });
  }, [artisan]);

  const [profileSaved, setProfileSaved] = useState(false);
  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const portfolioRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = () => {
    onUpdateArtisan({ ...artisan, ...profileForm });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleProfilePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 250, 0.5);
      setProfileForm(prev => ({ ...prev, profilePhoto: compressed }));
    }
    e.target.value = '';
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const compressed = await Promise.all(
        Array.from(files).map(file => compressImage(file, 600, 0.6))
      );
      onUpdateArtisan({ ...artisan, ...profileForm, portfolioImages: [...artisan.portfolioImages, ...compressed] });
    }
    e.target.value = '';
  };

  const removePortfolioImage = (idx: number) => {
    onUpdateArtisan({ ...artisan, ...profileForm, portfolioImages: artisan.portfolioImages.filter((_, i) => i !== idx) });
  };

  const coverPhotoRef = useRef<HTMLInputElement>(null);

  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 800, 0.6); // larger for cover, but still heavily compressed
      onUpdateArtisan({ ...artisan, ...profileForm, coverPhoto: compressed });
    }
    e.target.value = '';
  };
  const [pricing, setPricing] = useState<Record<string, number>>(artisan.customPricing || {});
  const [pricingSaved, setPricingSaved] = useState(false);

  const handleSavePricing = () => {
    onUpdateArtisan({ ...artisan, customPricing: pricing });
    setPricingSaved(true);
    setTimeout(() => setPricingSaved(false), 2500);
  };
  const [isAddingProd, setIsAddingProd] = useState(false);
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [artisanNotes, setArtisanNotes] = useState<Record<string, string>>({});
  const [isAddingWorkshop, setIsAddingWorkshop] = useState(false);
  const [editingWorkshopId, setEditingWorkshopId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workshopImgRef = useRef<HTMLInputElement>(null);

  const [newProd, setNewProd] = useState<Partial<Product>>({
    name: '', category: 'Vases', price: 0, description: '', images: [], materials: [], stock: 1, customizable: false
  });

  const handleOpenProdModal = (p?: Product) => {
    if (p) {
      setEditingProdId(p.id);
      setNewProd(p);
    } else {
      setEditingProdId(null);
      setNewProd({ name: '', category: 'Vases', price: 0, description: '', images: [], materials: [], stock: 1, customizable: false });
    }
    setIsAddingProd(true);
  };

  const emptyWorkshop: Partial<Workshop> = {
    title: '', description: '', category: artisan.craftType, mode: 'offline', duration: '2 Hours',
    price: 0, maxStudents: 10, date: '', time: '', materialsProvided: true, curriculum: '', requirements: '', image: '', skillLevel: 'Beginner'
  };

  const [workshopFormData, setWorkshopFormData] = useState<Partial<Workshop>>(emptyWorkshop);

  const handleProdImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const imgFiles = Array.from(files);
      if (imgFiles.length > 0) {
        const compressed = await Promise.all(
          imgFiles.map(file => compressImage(file, 800, 0.65))
        );
        setNewProd(prev => ({ ...prev, images: [...(prev.images || []), ...compressed] }));
      }
    }
    e.target.value = '';
  };

  const removeProdImage = (idx: number) => {
    setNewProd(prev => ({ ...prev, images: (prev.images || []).filter((_, i) => i !== idx) }));
  };

  const [enhancementLoading, setEnhancementLoading] = useState<number | null>(null);

  const applyEnhancement = async (index: number, type: 'bg' | 'light' | 'upscale') => {
    try {
      setEnhancementLoading(index);
      let enhanced = '';
      if (type === 'bg') enhanced = await removeBackgroundAI(newProd.images[index]);
      if (type === 'light') enhanced = await smartLighting(newProd.images[index]);
      if (type === 'upscale') enhanced = await upscaleImage(newProd.images[index]);

      const newImages = [...(newProd.images || [])];
      newImages[index] = enhanced;
      setNewProd({ ...newProd, images: newImages });
    } catch (e: any) {
      console.error(e);
      if (e.message !== "API Key required for enhancement") {
        alert("Enhancement failed: " + e.message);
      }
    } finally {
      setEnhancementLoading(null);
    }
  };

  const handleWorkshopImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 800, 0.7);
      setWorkshopFormData(prev => ({ ...prev, image: compressed }));
    }
    e.target.value = '';
  };


  const handleSaveProduct = () => {
    if (editingProdId) {
      if (onUpdateProduct) {
        onUpdateProduct({
          ...(newProd as Product),
          materials: typeof newProd.materials === 'string' ? (newProd.materials as string).split(',').map(m => m.trim()).filter(Boolean) : (newProd.materials || []).join(',').split(',').map(m => m.trim()).filter(Boolean)
        });
      }
    } else {
      const p: Product = {
        ...(newProd as Product),
        materials: typeof newProd.materials === 'string' ? (newProd.materials as string).split(',').map(m => m.trim()).filter(Boolean) : (newProd.materials || []).join(',').split(',').map(m => m.trim()).filter(Boolean),
        id: Math.random().toString(36).substr(2, 9),
        artisan: artisan.name,
        artisanId: artisan.id,
        status: 'pending'
      };
      onAddProduct(p);
    }
    setIsAddingProd(false);
    setNewProd({ name: '', category: 'Vases', price: 0, description: '', images: [], materials: [], stock: 1, customizable: false });
  };

  const handleOpenWorkshopModal = (w?: Workshop) => {
    if (w) {
      setEditingWorkshopId(w.id);
      setWorkshopFormData(w);
    } else {
      setEditingWorkshopId(null);
      setWorkshopFormData(emptyWorkshop);
    }
    setIsAddingWorkshop(true);
  };

  const handleSaveWorkshop = () => {
    if (editingWorkshopId) {
      onUpdateWorkshop({ ...(workshopFormData as Workshop), status: 'pending' });
    } else {
      const w: Workshop = {
        ...(workshopFormData as Workshop),
        id: 'w-' + Math.random().toString(36).substr(2, 9),
        artisanId: artisan.id,
        artisanName: artisan.name,
        status: 'pending',
        image: workshopFormData.image || 'https://images.unsplash.com/photo-1590059590494-b778726b2165?auto=format&fit=crop&q=80&w=800'
      };
      onAddWorkshop(w);
    }
    setIsAddingWorkshop(false);
  };

  const myProducts = products.filter(p => p.artisanId === artisan.id);
  const myWorkshops = workshops.filter(w => w.artisanId === artisan.id);
  // Only show orders that admin has approved for this artisan
  const myOrders = customOrders.filter(o =>
    o.assignedArtisanId === artisan.id && o.adminStatus === 'approved'
  );
  const newOrdersCount = myOrders.filter(o => o.artisanStatus === 'waiting').length;
  const myReviews = reviews.filter(r => r.targetId === artisan.id);

  const myProductOrders = productOrders.filter(o => o.artisanId === artisan.id);
  const newProductOrdersCount = myProductOrders.filter(o => o.status === 'pending').length;
  const tabs = ['overview', 'products', 'workshops', 'orders', 'reviews', 'pricing', 'profile'];

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-gray-100 pb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full overflow-hidden border border-gray-200">
            <img src={artisan.profilePhoto} className="w-full h-full object-cover" alt={artisan.name} />
          </div>
          <div>
            <h1 className="text-3xl serif">{artisan.brandName || artisan.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border ${artisan.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {artisan.status} Status
              </span>
              <span className="text-xs text-[#999]">{artisan.craftType} • {artisan.location}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-6 mt-6 md:mt-0">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)}
              className={`text-xs uppercase tracking-widest pb-1 transition-all flex items-center gap-2 ${activeTab === tab ? 'border-b border-[#2C2C2C] font-semibold' : 'text-[#999] hover:text-[#2C2C2C]'}`}>
              {tab}
              {tab === 'orders' && (newOrdersCount + newProductOrdersCount > 0) && <span className="bg-red-500 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center font-bold animate-pulse">{newOrdersCount + newProductOrdersCount}</span>}
            </button>
          ))}
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="mt-6 md:mt-0 text-[9px] uppercase tracking-widest text-[#999] border border-[#E5E5E5] px-4 py-2 hover:border-red-300 hover:text-red-500 transition-all flex items-center gap-2"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Switch Profile
          </button>
        )}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white p-6 border border-gray-100 shadow-sm text-center">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">My Products</p>
                <p className="text-3xl serif">{myProducts.length}</p>
              </div>
              <div className="bg-white p-6 border border-gray-100 shadow-sm text-center">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Orders</p>
                <p className="text-3xl serif">{myOrders.length + myProductOrders.length}</p>
              </div>
              <div className="bg-white p-6 border border-gray-100 shadow-sm text-center">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Rating</p>
                <p className="text-3xl serif">{artisan.rating || 'N/A'}</p>
              </div>
            </div>
            <section>
              <h3 className="text-xs uppercase tracking-widest font-semibold text-[#999] mb-4">Bio & Philosophy</h3>
              <p className="text-lg font-light leading-relaxed">{artisan.bio}</p>
            </section>
            {artisan.portfolioImages && artisan.portfolioImages.length > 0 && (
              <section>
                <h3 className="text-xs uppercase tracking-widest font-semibold text-[#999] mb-6">Portfolio Gallery</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {artisan.portfolioImages.map((img, i) => (
                    <div key={i} className="relative aspect-square group rounded border border-[#E5E5E5] overflow-hidden">
                      <img src={img} className="w-full h-full object-cover" alt="Portfolio Work" />
                      <button
                        type="button"
                        onClick={() => removePortfolioImage(i)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow"
                      >✕</button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
          <div className="bg-[#FAF9F6] p-8 border border-[#F0F0F0] h-fit sticky top-32">
            <h3 className="text-sm font-semibold mb-6 uppercase tracking-widest">Profile Stats</h3>
            <div className="space-y-6">
              <div><p className="text-xs text-[#999] uppercase tracking-widest">Reviews</p><p className="text-xl serif mt-1">{myReviews.length}</p></div>
              <div><p className="text-xs text-[#999] uppercase tracking-widest">Workshops</p><p className="text-xl serif mt-1">{myWorkshops.length}</p></div>
              <div><p className="text-xs text-[#999] uppercase tracking-widest">Products</p><p className="text-xl serif mt-1">{myProducts.length}</p></div>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-medium">{myProducts.length} Creations</h2>
            <button onClick={() => handleOpenProdModal()} className="bg-[#2C2C2C] text-white px-6 py-3 text-xs uppercase tracking-widest hover:bg-[#4A4A4A] transition-all">
              Upload New Artwork
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {myProducts.map(p => (
              <div key={p.id} className="bg-white p-6 border border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center items-start gap-4 sm:gap-8">
                <img src={p.images[0]} className="w-20 h-20 object-cover bg-gray-50 rounded" alt="" />
                <div className="flex-grow w-full">
                  <h3 className="text-lg font-medium">{p.name}</h3>
                  <p className="text-xs text-[#999] uppercase tracking-widest mb-1">{p.category} • {p.customizable ? 'Customizable' : 'Fixed'}</p>
                  <p className="text-sm font-semibold">₹ {p.price.toLocaleString()}</p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <span className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border ${p.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{p.status}</span>
                  <div className="flex gap-4">
                    {p.modelUrl && (
                      <button onClick={() => setPreview3DProduct(p)} className="text-[10px] uppercase tracking-widest text-[#2C2C2C] underline">Preview 3D</button>
                    )}
                    <button onClick={() => handleOpenProdModal(p)} className="text-[10px] uppercase tracking-widest text-[#8B735B] underline">Edit</button>
                  </div>
                </div>
              </div>
            ))}
            {myProducts.length === 0 && <p className="text-center py-20 text-[#999] italic serif text-xl">You haven't uploaded any pieces yet.</p>}
          </div>
        </div>
      )}

      {/* WORKSHOPS TAB */}
      {activeTab === 'workshops' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-medium">{myWorkshops.length} Masterclasses</h2>
            <button onClick={() => handleOpenWorkshopModal()} className="bg-[#2C2C2C] text-white px-6 py-3 text-xs uppercase tracking-widest hover:bg-[#4A4A4A] transition-all">
              Propose New Workshop
            </button>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {myWorkshops.map(w => (
              <div key={w.id} className="bg-white p-6 border border-[#E5E5E5] flex flex-col md:flex-row items-start md:items-center gap-6">
                <img src={w.image} className="w-full md:w-24 md:h-24 object-cover rounded aspect-video md:aspect-square" alt={w.title} />
                <div className="flex-grow">
                  <h3 className="text-lg font-medium">{w.title}</h3>
                  <p className="text-xs text-[#999] uppercase tracking-widest mb-1">{w.mode} • {w.duration} • ₹ {w.price.toLocaleString()}</p>
                  <p className="text-sm text-[#666]">{new Date(w.date).toDateString()} at {w.time}</p>
                </div>
                <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto mt-2 md:mt-0">
                  <span className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border ${w.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{w.status}</span>
                  <button onClick={() => handleOpenWorkshopModal(w)} className="text-[10px] uppercase tracking-widest text-[#8B735B] underline">Edit</button>
                </div>
              </div>
            ))}
            {myWorkshops.length === 0 && <p className="text-center py-20 text-[#999] italic serif text-xl">No workshops proposed yet.</p>}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-medium">All Orders</h2>
              <p className="text-xs text-[#999] mt-1">Manage both shop piece sales and order commissions.</p>
            </div>
            <select
              value={orderTypeFilter}
              onChange={(e) => setOrderTypeFilter(e.target.value as any)}
              className="px-4 py-2 border border-[#E5E5E5] text-xs uppercase tracking-widest text-[#666] focus:outline-none focus:border-[#2C2C2C] bg-white"
            >
              <option value="all">All Orders</option>
              <option value="shop">Shop Orders</option>
              <option value="custom">Orders</option>
            </select>
          </div>

          {(orderTypeFilter === 'all' || orderTypeFilter === 'custom') && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium border-b border-[#F0F0F0] pb-2">Orders</h3>
              {myOrders.length === 0 ? (
                <div className="py-16 text-center text-[#999]">
                  <p className="serif text-xl italic">No orders assigned.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {myOrders.map(o => (
                    <div key={o.id} className={`bg-white border-2 shadow-sm overflow-hidden ${o.artisanStatus === 'waiting' ? 'border-red-400' :
                      o.artisanStatus === 'completed' ? 'border-green-300' :
                        'border-blue-300'
                      }`}>
                      {/* Top status bar */}
                      <div className={`px-6 py-2 flex items-center justify-between text-[9px] uppercase tracking-widest font-bold ${o.artisanStatus === 'waiting' ? 'bg-red-50 text-red-700 border-b border-red-100' :
                        o.artisanStatus === 'accepted' ? 'bg-blue-50 text-blue-700 border-b border-blue-100' :
                          'bg-green-50 text-green-700 border-b border-green-100'
                        }`}>
                        <span>
                          {o.artisanStatus === 'waiting' ? '🔔 New Order — Awaiting Your Acceptance' :
                            o.artisanStatus === 'accepted' ? '🎨 You are working on this' :
                              '✅ Completed'}
                        </span>
                        <span className="font-normal text-[#999]">{o.id}</span>
                      </div>

                      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Order details */}
                        <div className="md:col-span-2 space-y-4">
                          <div>
                            <h3 className="text-xl serif">{o.customerName}</h3>
                            <p className="text-xs text-[#999] uppercase tracking-widest">{o.email} · {o.phone}</p>
                          </div>
                          <div className="bg-[#FAF9F6] border border-[#F0F0F0] p-4">
                            <p className="text-[10px] uppercase tracking-widest text-[#999] mb-2">Their Vision</p>
                            <p className="text-sm font-light text-[#4A4A4A] leading-relaxed">{o.concept}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div><span className="text-[#999] uppercase tracking-widest text-[9px]">Category</span><p className="font-medium mt-0.5">{o.category}</p></div>
                            <div><span className="text-[#999] uppercase tracking-widest text-[9px]">Size</span><p className="font-medium mt-0.5">{o.size || o.dimensions}</p></div>
                            <div><span className="text-[#999] uppercase tracking-widest text-[9px]">Finish</span><p className="font-medium mt-0.5">{o.finish}</p></div>
                            <div><span className="text-[#999] uppercase tracking-widest text-[9px]">Advance Paid</span><p className="font-medium mt-0.5">₹ {o.advancePayment?.amount?.toLocaleString()}</p></div>
                          </div>
                          {o.adminNote && (
                            <div className="bg-amber-50 border border-amber-100 p-3 text-xs text-amber-800">
                              <strong>Note from Admin:</strong> {o.adminNote}
                            </div>
                          )}
                          <p className="text-[10px] text-[#999]">Order placed: {new Date(o.createdAt).toLocaleString()}</p>
                        </div>

                        {/* Action panel */}
                        <div className="space-y-4">
                          {o.artisanStatus === 'waiting' && (
                            <div className="space-y-3">
                              <div className="bg-amber-50 border border-amber-100 p-4 text-xs text-amber-800 leading-relaxed">
                                <strong>⚠ Important:</strong> By accepting, you commit to delivering this piece as described. Contact the customer within 24 hours.
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-widest text-[#999]">Add a note (optional)</label>
                                <textarea
                                  rows={3}
                                  placeholder="e.g. I will reach out within 24 hours to discuss material options..."
                                  className="w-full border border-[#E5E5E5] p-3 text-xs focus:outline-none focus:border-[#2C2C2C] resize-none"
                                  value={artisanNotes[o.id] || ''}
                                  onChange={e => setArtisanNotes(prev => ({ ...prev, [o.id]: e.target.value }))}
                                />
                              </div>
                              <button
                                onClick={() => onAcceptOrder(o.id, artisanNotes[o.id] || '')}
                                className="w-full bg-[#2C2C2C] text-white py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-[#8B735B] transition-all"
                              >
                                Accept This Order ✓
                              </button>
                              <p className="text-[9px] text-center text-[#999]">If you are unable to take this order, contact admin directly.</p>
                            </div>
                          )}
                          {o.artisanStatus === 'accepted' && (
                            <div className="bg-blue-50 border border-blue-100 p-4 text-center space-y-2">
                              <p className="text-sm font-semibold text-blue-700">Order Accepted ✓</p>
                              <p className="text-xs text-blue-600">Reach out to the customer and begin crafting.</p>
                              <div className="mt-2 bg-blue-50 border border-blue-100 p-2 text-center">
                                <p className="text-[9px] uppercase tracking-widest text-blue-600 font-bold">Customer will be notified via Kala Prayag</p>
                              </div>
                            </div>
                          )}
                          {o.artisanStatus === 'completed' && (
                            <div className="bg-green-50 border border-green-200 p-4 text-center">
                              <p className="text-sm font-semibold text-green-700">✅ Completed</p>
                              <p className="text-xs text-green-600 mt-1">Great work!</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(orderTypeFilter === 'all' || orderTypeFilter === 'shop') && (
                <div className="space-y-6 pt-8">
                  <h3 className="text-lg font-medium border-b border-[#F0F0F0] pb-2">Shop Orders</h3>
                  {myProductOrders.length === 0 ? (
                    <div className="py-16 text-center text-[#999]">
                      <p className="serif text-xl italic">No shop orders yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {[...myProductOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(o => (
                        <div key={o.id} className="bg-white p-6 border border-[#E5E5E5] shadow-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-[#999] mb-1">Order ID: {o.id}</p>
                              <h3 className="text-lg font-medium">{o.customerName}</h3>
                              <p className="text-xs text-[#999] uppercase tracking-widest mb-2">{o.customerEmail} {o.customerPhone ? `• ${o.customerPhone}` : ''}</p>
                              <p className="text-xs text-[#999] mb-2">{o.shippingAddress}, {o.city} — {o.pincode}</p>
                              <div className="mt-3 space-y-1">
                                {o.items.map((item, i) => (
                                  <div key={i} className="flex items-center gap-4 py-2 border-b border-gray-50">
                                    <img src={item.image} className="w-10 h-10 object-cover rounded" alt="" />
                                    <div className="flex-grow">
                                      <p className="text-sm font-medium">{item.name}</p>
                                      <p className="text-[10px] text-[#999]">Qty: {item.quantity} • {item.size} • {item.finish}</p>
                                    </div>
                                    <p className="text-sm font-semibold">₹ {(item.price * item.quantity).toLocaleString()}</p>
                                  </div>
                                ))}
                              </div>
                              <p className="text-sm font-bold mt-3">Total: ₹ {o.totalAmount.toLocaleString()}</p>
                              <p className="text-[10px] text-[#999] mt-1">{new Date(o.createdAt).toLocaleString()}</p>
                            </div>
                            <span className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded font-bold border ${o.status === 'pending' ? 'bg-red-50 text-red-700 border-red-200' :
                              o.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                o.status === 'shipped' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                  o.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                                    'bg-gray-50 text-gray-700 border-gray-200'
                              }`}>{o.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* REVIEWS TAB */}
      {activeTab === 'reviews' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
          <h2 className="text-xl font-medium">Collector Reviews ({myReviews.length})</h2>
          {myReviews.length === 0 ? (
            <div className="py-32 text-center text-[#999]">
              <p className="serif text-2xl italic">No reviews yet.</p>
              <p className="text-sm mt-4">Reviews from collectors will appear here once approved by the admin.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {myReviews.map(r => (
                <div key={r.id} className="bg-white p-8 border border-[#E5E5E5] shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">{r.authorName}</p>
                      <p className="text-[10px] text-[#999] uppercase tracking-widest">{r.date}</p>
                    </div>
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-current' : 'fill-gray-300'}`} viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm font-light italic text-[#4A4A4A]">"{r.comment}"</p>
                  <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded border ${r.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pricing Tab */}
      {activeTab === 'pricing' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-medium">My Order Pricing</h2>
              <p className="text-xs text-[#999] mt-1">Set your base price per category. This is shown to collectors in the Custom Studio when they pick you.</p>
            </div>
            <button
              onClick={handleSavePricing}
              className="bg-[#2C2C2C] text-white px-8 py-3 text-xs uppercase tracking-widest hover:bg-[#8B735B] transition-all"
            >
              {pricingSaved ? '✓ Saved!' : 'Save Prices'}
            </button>
          </div>

          <div className="bg-[#FAF9F6] border border-[#F0F0F0] p-6 flex items-start gap-3">
            <svg className="w-4 h-4 text-[#8B735B] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div className="text-xs text-[#666] leading-relaxed">
              <strong>How pricing works:</strong> The base price you set here is for a standard small piece. Larger sizes automatically apply a multiplier (1.5× to 5×) based on dimensions. The collector sees the final estimate in the Custom Studio. You can always negotiate the final price when you contact them.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(artisan.categories || [artisan.craftType]).filter(Boolean).map(cat => (
              <div key={cat} className="bg-white border border-[#E5E5E5] p-6 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-semibold text-[#2C2C2C]">{cat}</h3>
                    <p className="text-[10px] uppercase tracking-widest text-[#999] mt-1">Order base price</p>
                  </div>
                  {pricing[cat] && (
                    <span className="text-[10px] uppercase tracking-widest bg-green-50 text-green-700 px-2 py-1">Set</span>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-semibold">Starting From (₹)</label>
                  <div className="relative">
                    <span className="absolute left-0 top-2 text-[#999]">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      placeholder="e.g. 5000"
                      className="w-full border-b border-[#D1D1D1] py-2 pl-6 focus:outline-none focus:border-[#2C2C2C] transition-colors text-sm"
                      value={pricing[cat] || ''}
                      onChange={e => setPricing(prev => ({ ...prev, [cat]: Number(e.target.value) }))}
                    />
                  </div>
                  {pricing[cat] && (
                    <div className="mt-3 text-[10px] text-[#999] space-y-1">
                      <p>Small piece: <span className="text-[#2C2C2C] font-medium">₹ {pricing[cat].toLocaleString()}</span></p>
                      <p>Medium (1.5×): <span className="text-[#2C2C2C] font-medium">₹ {Math.round(pricing[cat] * 1.5).toLocaleString()}</span></p>
                      <p>Large (2.5×): <span className="text-[#2C2C2C] font-medium">₹ {Math.round(pricing[cat] * 2.5).toLocaleString()}</span></p>
                      <p>Extra Large (4×): <span className="text-[#2C2C2C] font-medium">₹ {Math.round(pricing[cat] * 4).toLocaleString()}</span></p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {(!artisan.categories || artisan.categories.length === 0) && !artisan.craftType && (
            <div className="py-20 text-center text-[#999]">
              <p className="serif text-xl italic">No categories assigned yet.</p>
              <p className="text-sm mt-2">Your craft categories are set during onboarding. Contact admin to update.</p>
            </div>
          )}
        </div>
      )}

      {/* Product Upload/Edit Modal */}
      {isAddingProd && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl my-auto p-12 shadow-2xl space-y-8 animate-in zoom-in duration-300">
            <div className="flex justify-between items-start">
              <h2 className="text-3xl serif">{editingProdId ? 'Edit Artwork' : 'Upload New Creation'}</h2>
              <button onClick={() => setIsAddingProd(false)} className="text-[#999] hover:text-black">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Piece Title</label>
                  <input type="text" className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none" value={newProd.name} onChange={e => setNewProd({ ...newProd, name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Category</label>
                  <select className="w-full border-b border-[#D1D1D1] py-2 bg-white focus:outline-none" value={newProd.category} onChange={e => setNewProd({ ...newProd, category: e.target.value })}>
                    <option>Vases</option><option>Wall Art</option><option>Sculptures</option><option>Textiles</option><option>Lighting</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Price (₹)</label>
                    <input type="number" className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none" value={newProd.price} onChange={e => setNewProd({ ...newProd, price: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Stock</label>
                    <input type="number" className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none" value={newProd.stock} onChange={e => setNewProd({ ...newProd, stock: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="customizable" className="w-4 h-4" checked={newProd.customizable} onChange={e => setNewProd({ ...newProd, customizable: e.target.checked })} />
                  <label htmlFor="customizable" className="text-[10px] uppercase tracking-widest text-[#666]">Open to bespoke modifications</label>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold">The Story</label>
                <textarea placeholder="Describe the inspiration, process..." className="w-full bg-[#F9F9F9] border border-[#E5E5E5] p-4 text-sm focus:outline-none min-h-[160px]" value={newProd.description} onChange={e => setNewProd({ ...newProd, description: e.target.value })}></textarea>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Product Photos</label>
                <span className="text-[9px] text-[#BBB]">hover image to remove</span>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {newProd.images?.map((img, i) => (
                  <div key={i} className="relative aspect-square group rounded border border-[#E5E5E5] overflow-hidden">
                    <img src={img} className="w-full h-full object-cover" alt="" />
                    {enhancementLoading === i ? (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold uppercase tracking-widest animate-pulse">Processing...</span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                        <button
                          type="button"
                          onClick={() => applyEnhancement(i, 'bg')}
                          className="w-full bg-purple-600 text-white text-[8px] uppercase tracking-widest py-1.5 font-bold hover:bg-purple-500 rounded-sm"
                        >
                          ✂️ Remove BG
                        </button>
                        <button
                          type="button"
                          onClick={() => applyEnhancement(i, 'light')}
                          className="w-full bg-blue-600 text-white text-[8px] uppercase tracking-widest py-1.5 font-bold hover:bg-blue-500 rounded-sm"
                        >
                          💡 Relight
                        </button>
                        <button
                          type="button"
                          onClick={() => applyEnhancement(i, 'upscale')}
                          className="w-full bg-emerald-600 text-white text-[8px] uppercase tracking-widest py-1.5 font-bold hover:bg-emerald-500 rounded-sm"
                        >
                          🔍 4K Upscale
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeProdImage(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow z-10"
                    >✕</button>
                  </div>
                ))}
                <div onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-gray-200 rounded flex flex-col items-center justify-center cursor-pointer hover:border-[#8B735B] transition-all text-[#BBB] p-2">
                  <svg className="w-6 h-6 mb-1 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                  <span className="text-[8px] uppercase tracking-widest text-center mt-1 text-[#BBB]">Add Photo<br />or 3D Model</span>
                </div>
              </div>
              {newProd.modelUrl && (
                <div className="flex items-center justify-between p-3 border border-[#E5E5E5] bg-[#FAF9F6] rounded mb-4 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🧊</span>
                    <div>
                      <p className="text-xs font-medium text-[#2C2C2C]">3D Model Ready</p>
                      <p className="text-[9px] text-[#999] uppercase tracking-widest">Collectors can view this piece in AR</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={() => setPreview3DTempModelUrl(newProd.modelUrl!)} className="text-xs text-[#2C2C2C] hover:text-[#8B735B] underline font-medium">Preview 3D</button>
                    <button type="button" onClick={() => setNewProd({ ...newProd, modelUrl: undefined })} className="text-xs text-red-500 hover:text-red-700 underline font-medium">Remove</button>
                  </div>
                </div>
              )}
              {newProd.usdzUrl && (
                <div className="flex items-center justify-between p-3 border border-[#E5E5E5] bg-[#FAF9F6] rounded mb-4 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🍏</span>
                    <div>
                      <p className="text-xs font-medium text-[#2C2C2C]">Apple AR Model Ready</p>
                      <p className="text-[9px] text-[#999] uppercase tracking-widest">iOS users can view this instantly</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={() => setNewProd({ ...newProd, usdzUrl: undefined })} className="text-xs text-red-500 hover:text-red-700 underline font-medium">Remove</button>
                  </div>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/jpeg, image/png, image/heif, image/heic" onChange={handleProdImages} />
              <div className="space-y-1 mt-4">
                <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Materials Used</label>
                <input
                  type="text"
                  placeholder="e.g. Terracotta, Glaze, Brass (comma separated)"
                  className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none focus:border-[#2C2C2C] text-sm transition-colors"
                  value={newProd.materials?.[0] !== undefined && newProd.materials.length === 1 ? newProd.materials[0] : (newProd.materials || []).join(', ')}
                  onChange={e => setNewProd({ ...newProd, materials: [e.target.value] })}
                />
              </div>
              <div className="space-y-1 mt-4">
                <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Dimensions</label>
                <input
                  type="text"
                  placeholder="e.g. 12 × 8 × 6 cm"
                  className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none focus:border-[#2C2C2C] text-sm transition-colors"
                  value={newProd.dimensions || ''}
                  onChange={e => setNewProd({ ...newProd, dimensions: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={handleSaveProduct} className="flex-grow bg-[#2C2C2C] text-white py-5 text-xs uppercase tracking-[0.4em] font-bold hover:bg-black transition-all">
                {editingProdId ? 'Save Changes' : 'Submit for Review'}
              </button>
              <button onClick={() => setIsAddingProd(false)} className="px-10 border border-gray-200 text-xs uppercase tracking-widest hover:bg-gray-50">Discard</button>
            </div>
          </div>
        </div>
      )}

      {/* Workshop Modal */}
      {isAddingWorkshop && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl my-auto p-12 shadow-2xl space-y-8 animate-in zoom-in">
            <div className="flex justify-between items-start">
              <h2 className="text-3xl serif">{editingWorkshopId ? 'Edit Workshop' : 'Propose Masterclass'}</h2>
              <button onClick={() => setIsAddingWorkshop(false)} className="text-[#999] hover:text-black">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {/* Workshop Cover Image Upload */}
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-[#999]">Cover Image</label>
                <input ref={workshopImgRef} type="file" accept="image/jpeg, image/png, image/heif, image/heic" className="hidden" onChange={handleWorkshopImage} />
                {workshopFormData.image && !workshopFormData.image.startsWith('https://images.unsplash') ? (
                  <div className="relative group w-full h-40">
                    <img src={workshopFormData.image} className="w-full h-full object-cover border border-[#E5E5E5]" alt="Workshop cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button type="button" onClick={() => workshopImgRef.current?.click()} className="bg-white text-[10px] uppercase tracking-widest px-4 py-2 font-bold hover:bg-[#F5F5F5]">Change</button>
                      <button type="button" onClick={() => setWorkshopFormData(p => ({ ...p, image: '' }))} className="bg-red-500 text-white text-[10px] uppercase tracking-widest px-4 py-2 font-bold">Remove</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => workshopImgRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#D1D1D1] h-32 flex flex-col items-center justify-center gap-2 hover:border-[#8B735B] transition-all group">
                    <svg className="w-8 h-8 text-[#CCC] group-hover:text-[#8B735B] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[10px] uppercase tracking-widest text-[#999] group-hover:text-[#8B735B]">Upload Cover Photo</span>
                  </button>
                )}
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-[#999]">Class Title</label>
                <input type="text" className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none" value={workshopFormData.title} onChange={e => setWorkshopFormData({ ...workshopFormData, title: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-[#999]">Description</label>
                <textarea className="w-full bg-[#F9F9F9] border border-[#E5E5E5] p-4 text-sm focus:outline-none min-h-[80px]" value={workshopFormData.description} onChange={e => setWorkshopFormData({ ...workshopFormData, description: e.target.value })}></textarea>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-[#999]">Mode</label>
                <select className="w-full border-b border-[#D1D1D1] py-2 bg-white" value={workshopFormData.mode} onChange={e => setWorkshopFormData({ ...workshopFormData, mode: e.target.value as any })}>
                  <option value="offline">Offline</option><option value="online">Online</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-[#999]">Skill Level</label>
                <select className="w-full border-b border-[#D1D1D1] py-2 bg-white" value={workshopFormData.skillLevel} onChange={e => setWorkshopFormData({ ...workshopFormData, skillLevel: e.target.value as any })}>
                  <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-[#999]">Fee (₹)</label>
                <input type="number" className="w-full border-b border-[#D1D1D1] py-2" value={workshopFormData.price} onChange={e => setWorkshopFormData({ ...workshopFormData, price: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-[#999]">Max Students</label>
                <input type="number" className="w-full border-b border-[#D1D1D1] py-2" value={workshopFormData.maxStudents} onChange={e => setWorkshopFormData({ ...workshopFormData, maxStudents: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-[#999]">Date</label>
                <input type="date" className="w-full border-b border-[#D1D1D1] py-2" value={workshopFormData.date} onChange={e => setWorkshopFormData({ ...workshopFormData, date: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-[#999]">Time</label>
                <input type="time" className="w-full border-b border-[#D1D1D1] py-2" value={workshopFormData.time} onChange={e => setWorkshopFormData({ ...workshopFormData, time: e.target.value })} />
              </div>
              {workshopFormData.mode === 'offline' && (
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-[#999]">Location</label>
                  <input type="text" className="w-full border-b border-[#D1D1D1] py-2" value={workshopFormData.location} onChange={e => setWorkshopFormData({ ...workshopFormData, location: e.target.value })} />
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <button onClick={handleSaveWorkshop} className="flex-grow bg-[#2C2C2C] text-white py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-black transition-all">
                {editingWorkshopId ? 'Update Masterclass' : 'Submit Proposal'}
              </button>
              <button onClick={() => setIsAddingWorkshop(false)} className="px-8 py-4 border border-gray-200 text-[10px] uppercase tracking-widest hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* PROFILE EDIT TAB */}
      {activeTab === 'profile' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-medium">Edit Profile</h2>
            <button onClick={handleSaveProfile} className="text-[10px] uppercase tracking-widest bg-[#2C2C2C] text-white px-6 py-3 hover:bg-[#4A4A4A] transition-all">
              {profileSaved ? '✓ Saved!' : 'Save Changes'}
            </button>
          </div>

          {/* Profile Photo */}
          <div className="bg-white p-8 border border-[#E5E5E5]">
            <h3 className="text-xs uppercase tracking-widest font-semibold text-[#999] mb-6">Profile Photo</h3>
            <div className="flex items-center gap-8">
              <div className="w-28 h-28 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                <img src={(profileForm as any).profilePhoto || artisan.profilePhoto} className="w-full h-full object-cover" alt={artisan.name} />
              </div>
              <div>
                <input ref={profilePhotoRef} type="file" accept="image/jpeg, image/png, image/heic, image/heif" className="hidden" onChange={handleProfilePhoto} />
                <button onClick={() => profilePhotoRef.current?.click()} className="text-[10px] uppercase tracking-widest border border-[#2C2C2C] px-5 py-2 hover:bg-[#2C2C2C] hover:text-white transition-all">
                  Upload New Photo
                </button>
                <p className="text-xs text-[#999] mt-2">JPG or PNG, max 5MB recommended</p>
              </div>
            </div>
          </div>

          {/* Cover Photo */}
          <div className="bg-white p-8 border border-[#E5E5E5]">
            <h3 className="text-xs uppercase tracking-widest font-semibold text-[#999] mb-4">Cover Photo</h3>
            <p className="text-xs text-[#999] mb-6">This image is used as the wide background header for your profile on the makers page.</p>
            <div className="flex flex-col gap-6">
              {artisan.coverPhoto || artisan.portfolioImages?.[0] ? (
                <div className="relative w-full h-48 bg-[#F5F0EA] overflow-hidden rounded group border border-[#E5E5E5]">
                  <img src={artisan.coverPhoto || artisan.portfolioImages[0]} className="w-full h-full object-cover" alt="Cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => coverPhotoRef.current?.click()} className="bg-white text-[10px] uppercase tracking-widest px-6 py-3 font-bold hover:bg-[#F5F5F5] transition-colors">
                      Change Cover
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full h-48 border-2 border-dashed border-[#D1D1D1] flex flex-col items-center justify-center gap-3 hover:border-[#8B735B] transition-colors bg-[#FAF9F6] rounded">
                  <button onClick={() => coverPhotoRef.current?.click()} className="text-[10px] uppercase tracking-widest border border-[#2C2C2C] bg-white px-5 py-2 hover:bg-[#2C2C2C] hover:text-white transition-all">
                    Upload Cover Photo
                  </button>
                </div>
              )}
              <input ref={coverPhotoRef} type="file" accept="image/jpeg, image/png, image/heic, image/heif" className="hidden" onChange={handleCoverPhotoUpload} />
            </div>
          </div>

          {/* Portfolio Photos */}
          <div className="bg-white p-8 border border-[#E5E5E5]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xs uppercase tracking-widest font-semibold text-[#999]">Portfolio Gallery</h3>
                <p className="text-xs text-[#999] mt-1">Upload images of your past works and process to show on your profile.</p>
              </div>
              <div>
                <input ref={portfolioRef} type="file" multiple accept="image/jpeg, image/png, image/heic, image/heif" className="hidden" onChange={handlePortfolioUpload} />
                <button onClick={() => portfolioRef.current?.click()} className="text-[10px] uppercase tracking-widest border border-[#2C2C2C] px-5 py-2 hover:bg-[#2C2C2C] hover:text-white transition-all">
                  Upload Photos
                </button>
              </div>
            </div>

            {artisan.portfolioImages && artisan.portfolioImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {artisan.portfolioImages.map((img, i) => (
                  <div key={i} className="relative aspect-square group rounded border border-[#E5E5E5] overflow-hidden">
                    <img src={img} className="w-full h-full object-cover" alt="" />
                    {i === 0 && (
                      <div className="absolute top-2 left-2 bg-[#8B735B] text-white text-[8px] uppercase tracking-widest px-2 py-1 font-bold shadow-sm">
                        Cover Photo
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removePortfolioImage(i)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow"
                    >✕</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-[#E5E5E5]">
                <p className="text-[#999] text-sm italic serif">No portfolio photos yet. Upload some to show your work!</p>
              </div>
            )}
          </div>

          {/* Bio & Details */}
          <div className="bg-white p-8 border border-[#E5E5E5]">
            <h3 className="text-xs uppercase tracking-widest font-semibold text-[#999] mb-6">Bio & Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-2">Bio / Artist Statement</label>
                <textarea
                  rows={4}
                  value={profileForm.bio}
                  onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                  className="w-full border border-gray-200 p-3 text-sm font-light resize-none focus:outline-none focus:border-[#8B735B]"
                  placeholder="Tell your story..."
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-2">Craft Type</label>
                <input value={profileForm.craftType} onChange={e => setProfileForm(p => ({ ...p, craftType: e.target.value }))} className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#8B735B]" placeholder="e.g. Pottery, Weaving..." />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-2">Location</label>
                <input value={profileForm.location} onChange={e => setProfileForm(p => ({ ...p, location: e.target.value }))} className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#8B735B]" placeholder="City, State" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-2">Phone</label>
                <input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#8B735B]" placeholder="+91 ..." />
              </div>


              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-2">Years of Experience</label>
                <input value={profileForm.experience} onChange={e => setProfileForm(p => ({ ...p, experience: e.target.value }))} className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#8B735B]" placeholder="e.g. 10" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="teaching" checked={profileForm.teachingInterest} onChange={e => setProfileForm(p => ({ ...p, teachingInterest: e.target.checked }))} className="w-4 h-4 accent-[#8B735B]" />
                <label htmlFor="teaching" className="text-sm font-light">Open to teaching workshops</label>
              </div>
            </div>
          </div>

          {/* Portfolio Gallery */}
          <div className="bg-white p-8 border border-[#E5E5E5]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs uppercase tracking-widest font-semibold text-[#999]">Portfolio Gallery</h3>
              <div>
                <input ref={portfolioRef} type="file" accept="image/jpeg, image/png, image/heic, image/heif" multiple className="hidden" onChange={handlePortfolioUpload} />
                <button onClick={() => portfolioRef.current?.click()} className="text-[10px] uppercase tracking-widest border border-[#2C2C2C] px-4 py-2 hover:bg-[#2C2C2C] hover:text-white transition-all">
                  + Upload Art
                </button>
              </div>
            </div>
            {artisan.portfolioImages.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-gray-200 cursor-pointer" onClick={() => portfolioRef.current?.click()}>
                <p className="serif text-2xl italic text-[#999] mb-2">No portfolio images yet</p>
                <p className="text-xs uppercase tracking-widest text-[#BDBDBD]">Click to upload your artwork</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {artisan.portfolioImages.map((img, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img src={img} className="w-full h-full object-cover" alt={`Portfolio ${i + 1}`} />
                    <button
                      onClick={() => removePortfolioImage(i)}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtisanDashboard;

