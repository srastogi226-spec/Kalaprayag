
import React, { useState, useRef } from 'react';
import { Artisan, Product, Workshop, CustomOrder, Review, ProductOrder, Message, ClassBooking, AppNotification, StudioJournalEntry } from '../types';
import { compressImage, removeBackgroundAI, smartLighting, upscaleImage } from '../utils/imageUtils';
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
  onUpdateCustomOrder?: (order: CustomOrder) => void;
  onUpdateProductOrder?: (order: ProductOrder) => void;
  onLogout?: () => void;
  productOrders?: ProductOrder[];
  messages?: Message[];
  onUpdateMessage?: (msg: Message) => void;
  classBookings?: ClassBooking[];
  notifications: AppNotification[];
  onMarkNotificationAsRead: (id: string) => void;
  onMarkAllNotificationsAsRead: (uid: string) => void;
}

const ArtisanDashboard: React.FC<ArtisanDashboardProps> = ({
  artisan, products, workshops, customOrders, onAcceptOrder, reviews, onAddProduct, onAddWorkshop, onUpdateWorkshop, onUpdateArtisan, onUpdateProduct, onUpdateCustomOrder, onUpdateProductOrder, onLogout, productOrders = [], messages = [], onUpdateMessage, classBookings = [], notifications, onMarkNotificationAsRead, onMarkAllNotificationsAsRead
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'workshops' | 'messages' | 'orders' | 'reviews' | 'pricing' | 'profile' | 'notifications'>('overview');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'shop' | 'custom'>('all');
  const [profileForm, setProfileForm] = useState({
    bio: artisan.bio || '',
    location: artisan.location || '',
    craftType: artisan.craftType || '',
    phone: artisan.phone || '',
    whatsapp: artisan.whatsapp || '',
    instagram: artisan.instagram || '',
    experience: artisan.experience || '',
    teachingInterest: artisan.teachingInterest || false,
    studioJournal: artisan.studioJournal || []
  });

  // Sync form when artisan updates from outside (like a photo upload finishing)
  React.useEffect(() => {
    setProfileForm({
      bio: artisan.bio || '',
      location: artisan.location || '',
      craftType: artisan.craftType || '',
      phone: artisan.phone || '',
      whatsapp: artisan.whatsapp || '',
      instagram: artisan.instagram || '',
      experience: artisan.experience || '',
      teachingInterest: artisan.teachingInterest || false,
      studioJournal: artisan.studioJournal || []
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
  const [dragImageIndex, setDragImageIndex] = useState<number | null>(null);
  const replaceInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const workshopImgRef = useRef<HTMLInputElement>(null);
  const [expandedWorkshops, setExpandedWorkshops] = useState<Record<string, boolean>>({});
  const toggleWorkshopExpansion = (id: string) => {
    setExpandedWorkshops(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const toggleOrderExpansion = (id: string) => {
    setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };


  const [isAddingJournal, setIsAddingJournal] = useState(false);
  const [newJournal, setNewJournal] = useState({ title: '', content: '', image: '', excerpt: '', category: 'Process', date: new Date().toISOString() });
  const videoInputRef = useRef<HTMLInputElement>(null);
  const journalImgRef = useRef<HTMLInputElement>(null);



  const handleSaveJournal = () => {
    const entry: StudioJournalEntry = {
      id: 'j-' + Math.random().toString(36).substr(2, 9),
      title: newJournal.title,
      content: newJournal.content,
      image: newJournal.image,
      excerpt: newJournal.excerpt || newJournal.content.substring(0, 100) + '...',
      category: newJournal.category,
      date: new Date().toISOString(),
      author: artisan.name,
      tags: [],
      readTime: '3 MIN READ'
    };
    const updatedJournal = [entry, ...(profileForm.studioJournal || [])];
    setProfileForm(prev => ({ ...prev, studioJournal: updatedJournal }));
    setIsAddingJournal(false);
    setNewJournal({ title: '', content: '', image: '', excerpt: '', category: 'Process', date: new Date().toISOString() });
  };

  const handleJournalImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 600, 0.7);
      setNewJournal(prev => ({ ...prev, image: compressed }));
    }
    e.target.value = '';
  };

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

  const myProductOrders = productOrders.filter(o =>
    o.artisanId === artisan.id || o.items.some(item => {
      const product = products.find(p => p.id === item.productId);
      return product?.artisanId === artisan.id;
    })
  );
  const newProductOrdersCount = myProductOrders.filter(o => o.status === 'pending').length;
  const unreadMessagesCount = messages.filter(m => m.status === 'unread').length;
  const myNotifications = notifications.filter(n => n.userId === artisan.id);
  const unreadNotifsCount = myNotifications.filter(n => n.status === 'unread').length;

  // Smart Default for Orders: If shop orders have pending items but custom ones don't, switch to shop view.
  React.useEffect(() => {
    if (activeTab === 'orders') {
      if (newProductOrdersCount > 0 && newOrdersCount === 0) {
        setOrderTypeFilter('shop');
      } else if (newOrdersCount > 0 && newProductOrdersCount === 0) {
        setOrderTypeFilter('custom');
      } else {
        setOrderTypeFilter('all');
      }
    }
  }, [activeTab, newOrdersCount, newProductOrdersCount]);
  const tabs = ['overview', 'products', 'workshops', 'messages', 'orders', 'reviews', 'pricing', 'profile'];

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
              <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border ${artisan.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
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
              {tab === 'messages' && unreadMessagesCount > 0 && <span className="bg-red-500 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{unreadMessagesCount}</span>}
              {tab === 'notifications' && unreadNotifsCount > 0 && <span className="bg-amber-600 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{unreadNotifsCount}</span>}
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
              <p className="text-lg font-light leading-relaxed mb-12">{artisan.bio}</p>
            </section>

            {/* Recent Activity / Notifications */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex justify-between items-end mb-6">
                <h3 className="text-xs uppercase tracking-widest font-semibold text-[#999]">Recent Activity</h3>
                {unreadNotifsCount > 0 && (
                  <button
                    onClick={() => onMarkAllNotificationsAsRead(artisan.id)}
                    className="text-[10px] uppercase tracking-widest text-[#8B735B] font-bold hover:text-[#2C2C2C]"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {myNotifications.length === 0 ? (
                  <p className="text-sm italic text-[#BBB] py-8 border border-dashed border-gray-100 text-center rounded">No recent activity.</p>
                ) : (
                  myNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map(n => (
                    <div key={n.id} className={`p-5 border flex gap-6 items-start transition-all ${n.status === 'unread' ? 'bg-white border-purple-100 shadow-sm' : 'bg-gray-50/50 border-gray-100 opacity-60'}`}>
                      <div className={`mt-2 w-2 h-2 rounded-full flex-shrink-0 ${n.status === 'unread' ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]' : 'bg-gray-300'}`}></div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <h4 className={`text-[13px] tracking-wide ${n.status === 'unread' ? 'font-bold text-[#2C2C2C]' : 'font-medium text-[#666]'}`}>{n.title}</h4>
                          <span className="text-[9px] uppercase tracking-widest text-[#BBB]">{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-[#666] mt-1.5 font-light leading-relaxed">{n.message}</p>
                        {n.status === 'unread' && (
                          <button
                            onClick={() => onMarkNotificationAsRead(n.id)}
                            className="mt-3 text-[9px] uppercase tracking-[0.2em] text-[#8B735B] font-bold hover:text-[#2C2C2C]"
                          >
                            Mark as Read
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {myNotifications.length > 5 && (
                  <p className="text-[9px] text-center text-[#999] uppercase tracking-widest pt-2">Showing latest 5 updates</p>
                )}
              </div>
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
                  <span className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border ${p.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{p.status}</span>
                  <div className="flex gap-4">
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
            {myWorkshops.map(w => {
              const participants = classBookings.filter(b => b.workshopId === w.id);
              const isExpanded = expandedWorkshops[w.id];
              return (
                <div key={w.id} className={`bg-white border transition-all duration-300 ${isExpanded ? 'border-[#8B735B] shadow-md' : 'border-[#E5E5E5] hover:border-[#8B735B]'}`}>
                  <div
                    className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6 cursor-pointer"
                    onClick={() => toggleWorkshopExpansion(w.id)}
                  >
                    <div className="relative w-full md:w-32 md:h-32 flex-shrink-0">
                      <img src={w.image} className="w-full h-full object-cover rounded aspect-video md:aspect-square" alt={w.title} />
                      <div className="absolute top-2 left-2">
                        <span className={`text-[8px] uppercase tracking-widest px-2 py-1 rounded-sm font-bold shadow-sm ${w.status === 'approved' ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}>
                          {w.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl serif tracking-wide">{w.title}</h3>
                          <p className="text-[10px] text-[#999] uppercase tracking-[0.2em] mt-1">{w.mode} • {w.skillLevel} • {w.duration}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-medium text-[#2C2C2C]">₹{w.price.toLocaleString()}</p>
                          <p className="text-[9px] text-[#999] uppercase tracking-widest">per seat</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#8B735B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span className="text-xs text-[#666]">{new Date(w.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {w.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#8B735B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                          <span className="text-xs text-[#666] font-medium">{participants.length} / {w.maxStudents} Students</span>
                        </div>
                        {w.maxStudents - participants.length <= 3 && w.maxStudents - participants.length > 0 && (
                          <span className="text-[9px] uppercase tracking-widest text-red-500 font-bold animate-pulse">Filling Fast!</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-stretch md:self-auto border-t md:border-t-0 pt-4 md:pt-0 mt-4 md:mt-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenWorkshopModal(w); }}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#8B735B]"
                        title="Edit Workshop"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <div className={`p-1 rounded-full transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-[#8B735B] text-white' : 'text-[#BBB]'}`}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-8 border-t border-[#F0F0F0] animate-in slide-in-from-top-2">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-8">
                        {/* Summary & Details */}
                        <div className="lg:col-span-1 space-y-6">
                          <div>
                            <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#999] font-bold mb-3">Workshop Essence</h4>
                            <p className="text-sm text-[#4A4A4A] leading-relaxed font-light">{w.description}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-[#FAF9F6] rounded">
                              <p className="text-[9px] uppercase tracking-widest text-[#AAA] mb-1">Materials</p>
                              <p className="text-xs font-medium">{w.materialsProvided ? 'Provided' : 'Self-Arranged'}</p>
                            </div>
                            <div className="p-3 bg-[#FAF9F6] rounded">
                              <p className="text-[9px] uppercase tracking-widest text-[#AAA] mb-1">Category</p>
                              <p className="text-xs font-medium">{w.category}</p>
                            </div>
                          </div>
                          {w.location && (
                            <div className="p-3 bg-amber-50/30 border border-amber-100/50 rounded flex items-start gap-3">
                              <svg className="w-4 h-4 text-amber-700 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              <div>
                                <p className="text-[9px] uppercase tracking-widest text-amber-700 mb-0.5 font-bold">Venue</p>
                                <p className="text-xs text-amber-900">{w.location}</p>
                              </div>
                            </div>
                          )}
                          {w.mode === 'online' && w.zoomLink && (
                            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded flex items-start gap-3">
                              <svg className="w-4 h-4 text-indigo-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                              <div>
                                <p className="text-[9px] uppercase tracking-widest text-indigo-700 mb-0.5 font-bold">Zoom Link (set by Admin)</p>
                                <a href={w.zoomLink} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline break-all">{w.zoomLink}</a>
                              </div>
                            </div>
                          )}
                          {w.mode === 'online' && !w.zoomLink && (
                            <div className="p-3 bg-amber-50/50 border border-dashed border-amber-200 rounded">
                              <p className="text-[9px] uppercase tracking-widest text-amber-600 font-bold">Zoom link not set yet — admin will add before class</p>
                            </div>
                          )}
                        </div>

                        {/* Participants List */}
                        <div className="lg:col-span-2">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#999] font-bold">Registered Students ({participants.length})</h4>
                            {participants.length > 0 && (
                              <button className="text-[9px] uppercase tracking-widest text-[#8B735B] font-bold hover:underline">Download Attendee List</button>
                            )}
                          </div>

                          {participants.length === 0 ? (
                            <div className="py-12 text-center bg-[#FAF9F6] border border-dashed border-gray-200 rounded-lg">
                              <p className="serif italic text-gray-400">Class threshold not yet reached.</p>
                              <p className="text-[10px] uppercase tracking-widest text-gray-300 mt-2">Marketing support active</p>
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                              {participants.map(b => (
                                <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-[#F0F0F0] rounded-lg hover:shadow-sm transition-shadow">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#8B735B]/10 flex items-center justify-center text-[#8B735B] font-serif italic text-lg">
                                      {b.customerName.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-[#2C2C2C]">{b.customerName}</p>
                                      <p className="text-[10px] text-[#999] tracking-wider">{b.customerEmail} • {b.customerPhone}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 mt-3 sm:mt-0">
                                    <span className={`text-[8px] uppercase tracking-widest px-2 py-1 rounded font-bold ${
                                      b.status === 'completed' ? 'bg-green-50 text-green-700' :
                                      b.status === 'attended' ? 'bg-blue-50 text-blue-700' :
                                      b.status === 'reminded' ? 'bg-amber-50 text-amber-700' :
                                      b.status === 'no-show' ? 'bg-red-50 text-red-500' :
                                      'bg-gray-100 text-gray-500'
                                    }`}>{b.status || 'confirmed'}</span>
                                    <div className="text-right">
                                      <p className="text-[9px] uppercase tracking-widest text-[#BBB] mb-0.5">Paid</p>
                                      <p className="text-[10px] font-medium text-green-600">₹{b.amount.toLocaleString()}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {myWorkshops.length === 0 && <p className="text-center py-20 text-[#999] italic serif text-xl">No workshops proposed yet.</p>}
          </div>
        </div>
      )}

      {/* MESSAGES TAB */}
      {activeTab === 'messages' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-center mb-6 border-b border-[#F0F0F0] pb-6">
            <div>
              <h2 className="text-xl font-medium">In-Platform Inbox</h2>
              <p className="text-xs text-[#999] mt-1">Direct inquiries from customers visiting your profile.</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest font-bold">
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> {unreadMessagesCount} Unread</span>
              <span className="text-gray-200">|</span>
              <span className="text-[#666]">{messages.length} Total</span>
            </div>
          </div>

          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="py-32 text-center text-[#999]">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <p className="serif text-xl italic">Silence is gold, but messages are better.</p>
                <p className="text-sm mt-2">When a customer sends a message from your profile, it will appear here.</p>
              </div>
            ) : (
              [...messages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(msg => (
                <div key={msg.id} className={`group bg-white border ${msg.status === 'unread' ? 'border-[#8B735B]/40 shadow-sm' : 'border-[#E5E5E5]'} transition-all hover:border-[#8B735B]`}>
                  <div
                    className="p-6 cursor-pointer flex items-center justify-between"
                    onClick={() => {
                      setSelectedMessageId(selectedMessageId === msg.id ? null : msg.id);
                      if (msg.status === 'unread' && onUpdateMessage) {
                        onUpdateMessage({ ...msg, status: 'read' });
                      }
                    }}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-2 h-2 rounded-full transition-all ${msg.status === 'unread' ? 'bg-red-500 animate-pulse' : 'bg-transparent'}`}></div>
                      <div>
                        <h4 className={`text-sm tracking-wide ${msg.status === 'unread' ? 'font-bold' : 'font-medium'}`}>{msg.subject}</h4>
                        <p className="text-[10px] uppercase tracking-widest text-[#999] mt-1">From: {msg.senderName} ({msg.senderEmail})</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <p className="text-[10px] text-[#BBB] uppercase tracking-widest">{new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <button className={`text-[#999] transition-transform duration-300 ${selectedMessageId === msg.id ? 'rotate-180' : ''}`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </div>
                  </div>

                  {selectedMessageId === msg.id && (
                    <div className="px-14 pb-8 animate-in slide-in-from-top-2 duration-300">
                      <div className="bg-[#FAF9F6] p-6 text-sm font-light leading-relaxed text-[#4A4A4A] border-l-2 border-red-500">
                        {msg.body.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                      </div>
                      <div className="mt-6 flex flex-wrap gap-4 items-center">
                        <a
                          href={`mailto:${msg.senderEmail}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                          className="bg-[#2C2C2C] text-white px-6 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-black transition-all"
                        >
                          Reply via Email
                        </a>
                        <button
                          onClick={() => onUpdateMessage?.({ ...msg, status: msg.status === 'read' ? 'unread' : 'read' })}
                          className="text-[10px] uppercase tracking-widest text-[#999] hover:text-[#8B735B] underline"
                        >
                          Mark as {msg.status === 'read' ? 'Unread' : 'Read'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
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
              className="px-4 py-2 border border-[#E5E5E5] text-xs uppercase tracking-widest text-[#666] focus:outline-none focus:border-[#2C2C2C] bg-white font-bold"
            >
              <option value="all">All Orders {(newOrdersCount + newProductOrdersCount) > 0 ? `(${(newOrdersCount + newProductOrdersCount)} New)` : ''}</option>
              <option value="custom">Custom Orders {newOrdersCount > 0 ? `(${newOrdersCount} New)` : ''}</option>
              <option value="shop">Shop Orders {newProductOrdersCount > 0 ? `(${newProductOrdersCount} New)` : ''}</option>
            </select>
          </div>

          {/* Custom Orders Section */}
          {(orderTypeFilter === 'all' || orderTypeFilter === 'custom') && (
            <div className={`space-y-6 ${orderTypeFilter === 'all' ? 'mb-16' : ''}`}>
              <h3 className="text-xl serif italic border-b border-[#E5E5E5] pb-3 text-[#2C2C2C]">Custom Commissions</h3>
              {myOrders.length === 0 ? (
                <div className="py-20 text-center bg-white border border-[#E5E5E5]">
                  <p className="serif text-2xl italic text-[#999]">No custom commissions found.</p>
                  <p className="text-sm text-[#BBB] mt-2">When collectors request bespoke pieces, they will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {[...myOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(o => {
                    const isExpanded = !!expandedOrders[o.id];
                    return (
                      <div key={o.id} className={`bg-white border transition-all duration-300 flex flex-col ${isExpanded ? 'ring-1 ring-[#8B735B] shadow-lg scale-[1.01]' : 'shadow-sm hover:shadow-md hover:border-[#8B735B]/40'} ${o.artisanStatus === 'waiting' ? 'border-amber-300 bg-amber-50/10' : 'border-[#E5E5E5]'}`}>
                        
                        {/* --- Card Header --- */}
                        <div className="p-6 pb-4 border-b border-gray-50 flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {o.artisanStatus === 'waiting' && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>}
                              {o.artisanStatus === 'accepted' && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                              {o.artisanStatus === 'completed' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                              <p className="text-[10px] uppercase tracking-widest text-[#999] font-bold">{o.id}</p>
                              <button
                                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(o.id); alert('ID Copied!'); }}
                                className="text-[#BBB] hover:text-[#8B735B] transition-colors"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                              </button>
                            </div>
                            <h4 className="text-xl serif">{o.customerName}</h4>
                          </div>
                          
                          <div className={`px-3 py-1 text-[9px] uppercase tracking-widest font-bold border rounded-full
                            ${o.artisanStatus === 'waiting' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                              o.artisanStatus === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : 
                              'bg-blue-50 text-blue-700 border-blue-200'}
                          `}>
                            {o.artisanStatus}
                          </div>
                        </div>

                        {/* --- Card Body --- */}
                        <div className="p-6 flex-grow space-y-5">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-[#999] font-bold mb-1">Vision</p>
                            <p className="text-sm text-[#4A4A4A] leading-relaxed italic line-clamp-3">"{o.concept}"</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Category</p>
                              <p className="text-sm font-medium mt-0.5">{o.category}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Advance</p>
                              <p className="text-sm font-bold text-[#8B735B] mt-0.5">₹ {o.advancePayment?.amount?.toLocaleString()}</p>
                            </div>
                          </div>

                          {o.adminNote && (
                            <div className="bg-amber-50/50 p-3 border border-amber-100 rounded-sm">
                              <p className="text-[9px] uppercase tracking-widest text-amber-800 font-bold mb-1 flex items-center gap-1.5">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Admin Note
                              </p>
                              <p className="text-xs text-amber-900">{o.adminNote}</p>
                            </div>
                          )}
                        </div>

                        {/* --- Card Footer & Actions --- */}
                        <div className="mt-auto">
                          {!isExpanded ? (
                            <button 
                              onClick={() => toggleOrderExpansion(o.id)}
                              className="w-full py-4 border-t border-gray-100 text-[10px] uppercase tracking-widest font-bold text-[#666] hover:text-[#2C2C2C] hover:bg-gray-50 flex items-center justify-center gap-2 transition-all"
                            >
                              View Full Details 
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                          ) : (
                            <div className="border-t border-[#F0F0F0] bg-[#FAF9F6] animate-in slide-in-from-top-4 duration-300 flex flex-col h-full">
                              
                              <div className="p-6 space-y-6 flex-grow">
                                <div className="grid grid-cols-2 gap-4">
                                  <div><p className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Size / Dims</p><p className="text-sm font-medium mt-1">{o.size || o.dimensions}</p></div>
                                  <div><p className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Finish</p><p className="text-sm font-medium mt-1">{o.finish}</p></div>
                                </div>
                                
                                <div className="pt-4 border-t border-[#E5E5E5]">
                                  <p className="text-[10px] uppercase tracking-widest text-[#999] font-bold mb-2">Customer Details</p>
                                  <p className="text-sm">{o.email}</p>
                                  <p className="text-sm">{o.phone}</p>
                                </div>
                              </div>

                              {/* Actions Block */}
                              <div className="p-6 pt-0 mt-auto">
                                {o.artisanStatus === 'waiting' && (
                                  <div className="space-y-3">
                                    <textarea
                                      rows={2}
                                      placeholder="Note to customer (e.g. I can start next week)..."
                                      className="w-full border border-[#D1D1D1] p-3 text-sm focus:outline-none focus:border-[#2C2C2C] resize-none rounded-sm"
                                      value={artisanNotes[o.id] || ''}
                                      onChange={e => setArtisanNotes(prev => ({ ...prev, [o.id]: e.target.value }))}
                                    />
                                    <button
                                      onClick={(e) => { e.stopPropagation(); onAcceptOrder(o.id, artisanNotes[o.id] || ''); }}
                                      className="w-full bg-[#2C2C2C] text-white py-3.5 text-[11px] uppercase tracking-widest font-bold hover:bg-[#8B735B] transition-all rounded-sm shadow-md"
                                    >
                                      Accept Commission
                                    </button>
                                  </div>
                                )}
                                
                                {o.artisanStatus === 'accepted' && (
                                  <div className="flex flex-col gap-3">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); onUpdateCustomOrder?.({ ...o, artisanStatus: 'completed', status: 'completed', acceptedAt: o.acceptedAt || new Date().toISOString() }); }}
                                      className="w-full bg-[#2C2C2C] text-white py-3.5 text-[10px] uppercase tracking-widest font-bold hover:bg-[#8B735B] transition-all rounded-sm shadow-md"
                                    >
                                      Mark as Completed ✓
                                    </button>
                                    <a href={`https://wa.me/${o.phone?.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(o.customerName)}!%20I'm%20${encodeURIComponent(artisan.brandName || artisan.name)}%20from%20Kala%20Prayag.%20I'm%20calling%20about%20your%20custom%20order%20(${o.id}).%20Let's%20discuss%20the%20progress!`}
                                      target="_blank" rel="noreferrer"
                                      className="flex items-center justify-center gap-2 w-full border border-[#D1D1D1] text-[#2C2C2C] hover:bg-[#25D366] hover:border-[#25D366] hover:text-white py-3 text-[10px] uppercase tracking-widest font-bold transition-all rounded-sm"
                                    >
                                      WhatsApp Customer
                                    </a>
                                  </div>
                                )}
                              </div>

                              <button 
                                onClick={() => toggleOrderExpansion(o.id)}
                                className="w-full py-4 border-t border-[#E5E5E5] text-[10px] uppercase tracking-widest font-bold text-[#666] hover:bg-gray-100 flex items-center justify-center gap-2 transition-all mt-auto"
                              >
                                Hide Details
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 15l7-7 7 7" /></svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Shop Orders Section */}
          {(orderTypeFilter === 'all' || orderTypeFilter === 'shop') && (
            <div className={`space-y-6 ${orderTypeFilter === 'all' ? 'pt-12 border-t border-gray-100 mt-12' : ''}`}>
              <h3 className="text-xl serif italic border-b border-[#E5E5E5] pb-3 text-[#2C2C2C]">Masterpiece Sales</h3>
              {myProductOrders.length === 0 ? (
                <div className="py-20 text-center bg-white border border-[#E5E5E5]">
                  <p className="serif text-2xl italic text-[#999]">No shop orders yet.</p>
                  <p className="text-sm text-[#BBB] mt-2">Sales from your listed artwork will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {[...myProductOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(o => {
                    const isExpanded = !!expandedOrders[o.id];
                    // Filter items to only show what belongs to THIS artisan if it's a multi-artisan order
                    const myItems = o.items.filter(item => {
                      const product = products.find(p => p.id === item.productId);
                      return product?.artisanId === artisan.id;
                    });
                    const mySubtotal = myItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

                    return (
                      <div key={o.id} className={`bg-white border transition-all duration-300 flex flex-col ${isExpanded ? 'ring-1 ring-[#8B735B] shadow-lg scale-[1.01]' : 'shadow-sm hover:shadow-md hover:border-[#8B735B]/40'} ${o.status === 'pending' ? 'border-amber-300 bg-amber-50/10' : 'border-[#E5E5E5]'}`}>
                        
                        {/* --- Card Header --- */}
                        <div className="p-6 pb-4 border-b border-gray-50 flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {o.status === 'pending' && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>}
                              {o.status === 'delivered' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                              {(o.status === 'confirmed' || o.status === 'shipped') && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                              <p className="text-[10px] uppercase tracking-widest text-[#999] font-bold">{o.id}</p>
                              <button
                                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(o.id); alert('ID Copied!'); }}
                                className="text-[#BBB] hover:text-[#8B735B] transition-colors"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                              </button>
                            </div>
                            <h4 className="text-xl serif">{o.customerName}</h4>
                          </div>
                          
                          <div className={`px-3 py-1 text-[9px] uppercase tracking-widest font-bold border rounded-full
                            ${o.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.2)]' :
                              o.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              o.status === 'shipped' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                              o.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                              'bg-red-50 text-red-700 border-red-200'}
                          `}>
                            {o.status}
                          </div>
                        </div>

                        {/* --- Card Body --- */}
                        <div className="p-6 flex-grow">
                          <div className="flex justify-between items-end mb-4">
                            <p className="text-[10px] uppercase tracking-widest text-[#999] font-bold">My Subtotal</p>
                            <p className="text-xl font-bold text-[#2C2C2C]">₹ {mySubtotal.toLocaleString()}</p>
                          </div>

                          <div className="space-y-3">
                            <p className="text-[10px] uppercase tracking-widest text-[#999] font-bold border-b border-gray-50 pb-2">Products</p>
                            {myItems.map((item, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <img src={item.image} className="w-10 h-10 object-cover rounded shadow-sm border border-[#E5E5E5]" alt="" />
                                <div className="flex-grow">
                                  <p className="text-xs font-semibold text-[#2C2C2C] truncate pr-2 leading-tight">{item.name}</p>
                                  <p className="text-[9px] text-[#888] mt-0.5 uppercase tracking-wide">Qty: {item.quantity}</p>
                                </div>
                                <p className="text-xs font-bold text-[#8B735B]">₹{(item.price * item.quantity).toLocaleString()}</p>
                              </div>
                            ))}
                            {myItems.length < o.items.length && (
                              <p className="text-[9px] text-[#BBB] italic mt-2 bg-gray-50 p-2 rounded-sm border border-gray-100">+ Includes other items.</p>
                            )}
                          </div>
                        </div>

                        {/* --- Card Footer & Actions --- */}
                        <div className="mt-auto">
                          {!isExpanded ? (
                            <button 
                              onClick={() => toggleOrderExpansion(o.id)}
                              className="w-full py-4 border-t border-gray-100 text-[10px] uppercase tracking-widest font-bold text-[#666] hover:text-[#2C2C2C] hover:bg-gray-50 flex items-center justify-center gap-2 transition-all"
                            >
                              Fulfillment Details 
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                          ) : (
                            <div className="border-t border-[#F0F0F0] bg-[#FAF9F6] animate-in slide-in-from-top-4 duration-300 flex flex-col h-full">
                              
                              <div className="p-6 space-y-6 flex-grow">
                                <div>
                                  <p className="text-[10px] uppercase tracking-widest text-[#999] font-bold mb-2">Shipping Details</p>
                                  <div className="bg-white p-4 border border-[#F0F0F0] rounded-sm shadow-sm space-y-1">
                                    <p className="text-xs font-semibold">{o.customerName}</p>
                                    <p className="text-[10px] text-[#666] leading-relaxed">{o.shippingAddress}</p>
                                    <p className="text-[10px] font-medium text-[#2C2C2C] pt-1">{o.city} — {o.pincode}</p>
                                  </div>
                                </div>
                                
                                <div className="pt-4 border-t border-[#E5E5E5]">
                                  <p className="text-[10px] uppercase tracking-widest text-[#999] font-bold mb-2">Update Status</p>
                                  <div className="flex gap-2">
                                    {['confirmed', 'shipped', 'delivered'].map((s) => (
                                      <button
                                        key={s}
                                        onClick={(e) => { e.stopPropagation(); onUpdateProductOrder?.({ ...o, status: s as any }); }}
                                        className={`flex-1 py-2 text-[9px] uppercase tracking-widest font-bold border rounded-sm transition-all ${
                                          o.status === s 
                                            ? 'bg-[#2C2C2C] text-white border-[#2C2C2C] shadow-md' 
                                            : 'border-[#D1D1D1] bg-white text-[#666] hover:border-[#8B735B] hover:text-[#8B735B]'
                                        }`}
                                      >
                                        {s} {o.status === s && '✓'}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="pt-4 border-t border-[#E5E5E5] flex items-center justify-between">
                                  <div>
                                    <p className="text-[10px] uppercase tracking-widest text-[#999] font-bold mb-1">Contact</p>
                                    <p className="text-xs font-medium">{o.customerPhone}</p>
                                  </div>
                                  <a href={`https://wa.me/${o.customerPhone?.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(o.customerName)}!%20I'm%20${encodeURIComponent(artisan.brandName || artisan.name)}%20from%20Kala%20Prayag.%20I'm%20preparing%20your%20order%20(${o.id}).`}
                                    target="_blank" rel="noreferrer"
                                    className="flex items-center justify-center gap-2 px-5 py-2 border border-[#D1D1D1] text-[#2C2C2C] bg-white hover:bg-[#25D366] hover:border-[#25D366] hover:text-white text-[9px] uppercase tracking-widest font-bold rounded-sm transition-all"
                                  >
                                    WhatsApp
                                  </a>
                                </div>
                              </div>

                              <button 
                                onClick={() => toggleOrderExpansion(o.id)}
                                className="w-full py-4 border-t border-[#E5E5E5] text-[10px] uppercase tracking-widest font-bold text-[#666] hover:bg-gray-100 flex items-center justify-center gap-2 transition-all mt-auto"
                              >
                                Hide Details
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 15l7-7 7 7" /></svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                  <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded border ${r.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{r.status}</span>
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
                <span className="text-[9px] text-[#BBB]">drag to reorder · hover to edit</span>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {newProd.images?.map((img, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={() => setDragImageIndex(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragImageIndex === null || dragImageIndex === i) return;
                      const updated = [...(newProd.images || [])];
                      const [moved] = updated.splice(dragImageIndex, 1);
                      updated.splice(i, 0, moved);
                      setNewProd({ ...newProd, images: updated });
                      setDragImageIndex(null);
                    }}
                    className={`relative aspect-square group rounded border overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-200 ${dragImageIndex === i ? 'opacity-40 scale-95 border-[#8B735B]' : 'border-[#E5E5E5]'
                      }`}
                  >
                    <img src={img} className="w-full h-full object-cover pointer-events-none" alt="" />
                    {/* Drag grip indicator */}
                    <div className="absolute top-1 left-1 grid grid-cols-2 gap-px opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none">
                      {[...Array(6)].map((_, d) => <div key={d} className="w-1 h-1 bg-white rounded-full shadow" />)}
                    </div>
                    {enhancementLoading === i ? (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold uppercase tracking-widest animate-pulse">Processing...</span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1.5">
                        {/* Replace image button */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); replaceInputRefs.current[i]?.click(); }}
                          className="w-full bg-white/20 border border-white/40 text-white text-[8px] uppercase tracking-widest py-1.5 font-bold hover:bg-white hover:text-[#1A1A1A] rounded-sm transition-all"
                        >
                          🔄 Replace
                        </button>
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
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow z-10"
                    >✕</button>
                    {/* Per-image replace hidden input */}
                    <input
                      type="file"
                      accept="image/jpeg, image/png, image/heif, image/heic"
                      className="hidden"
                      ref={el => { replaceInputRefs.current[i] = el; }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const updated = [...(newProd.images || [])];
                          updated[i] = ev.target?.result as string;
                          setNewProd({ ...newProd, images: updated });
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                    />
                  </div>
                ))}
                <div onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-gray-200 rounded flex flex-col items-center justify-center cursor-pointer hover:border-[#8B735B] transition-all text-[#BBB] p-2">
                  <svg className="w-6 h-6 mb-1 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                  <span className="text-[8px] uppercase tracking-widest text-center mt-1 text-[#BBB]">Add Photo</span>
                </div>
              </div>
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
                <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-2">WhatsApp</label>
                <input value={profileForm.whatsapp} onChange={e => setProfileForm(p => ({ ...p, whatsapp: e.target.value }))} className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#8B735B]" placeholder="+91 ..." />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-2">Instagram</label>
                <input value={profileForm.instagram} onChange={e => setProfileForm(p => ({ ...p, instagram: e.target.value }))} className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#8B735B]" placeholder="https://instagram.com/yourhandle" />
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

          {/* Studio Journal */}
          <div className="bg-white p-8 border border-[#E5E5E5]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xs uppercase tracking-widest font-semibold text-[#999]">Studio Journal</h3>
                <p className="text-xs text-[#999] mt-1">Share the stories behind your work, techniques, or daily studio life.</p>
              </div>
              <button onClick={() => setIsAddingJournal(true)} className="text-[10px] uppercase tracking-widest bg-[#2C2C2C] text-white px-5 py-2 hover:bg-black transition-all">
                Add Entry
              </button>
            </div>

            {(profileForm.studioJournal || []).length === 0 ? (
              <div className="text-center py-16 border border-dashed border-gray-200">
                <p className="serif text-xl italic text-[#BBB]">Your journal is a blank canvas.</p>
                <p className="text-[9px] uppercase tracking-widest text-[#CCC] mt-2">Start sharing your journey today.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {(profileForm.studioJournal || []).map((entry, i) => (
                  <div key={entry.id} className="flex gap-6 p-4 bg-[#FAF9F6] border border-[#F0F0F0] group rounded">
                    {entry.image && (
                      <div className="w-24 h-24 flex-shrink-0">
                        <img src={entry.image} className="w-full h-full object-cover rounded shadow-sm" alt="" />
                      </div>
                    )}
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-[#2C2C2C]">{entry.title}</h4>
                        <p className="text-[9px] text-[#BBB] uppercase tracking-widest">{new Date(entry.date).toLocaleDateString()}</p>
                      </div>
                      <p className="text-xs text-[#666] line-clamp-2 mt-2 font-light">{entry.content}</p>
                      <button
                        onClick={() => {
                          const updated = (profileForm.studioJournal || []).filter(item => item.id !== entry.id);
                          setProfileForm(prev => ({ ...prev, studioJournal: updated }));
                        }}
                        className="text-[9px] text-red-400 uppercase tracking-widest mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Delete Entry
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Journal Entry Modal */}
      {isAddingJournal && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-6 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-xl my-auto p-10 shadow-2xl space-y-8 animate-in zoom-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl serif">New Journal Entry</h2>
              <button onClick={() => setIsAddingJournal(false)} className="text-[#BBB] hover:text-black">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Journal Image */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-[#999]">Featured Image</label>
                <input ref={journalImgRef} type="file" accept="image/*" className="hidden" onChange={handleJournalImage} />
                {newJournal.image ? (
                  <div className="relative group w-full h-48">
                    <img src={newJournal.image} className="w-full h-full object-cover rounded border border-[#E5E5E5]" alt="" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => journalImgRef.current?.click()} className="bg-white text-[10px] uppercase tracking-widest px-4 py-2 font-bold">Change Image</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => journalImgRef.current?.click()} className="w-full h-32 border border-dashed border-[#D1D1D1] rounded bg-[#FAF9F6] text-[10px] uppercase tracking-widest text-[#999] hover:border-[#8B735B] transition-all">
                    + Upload Image
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-[#999]">Title</label>
                <input
                  type="text"
                  className="w-full border-b border-[#D1D1D1] py-2 focus:outline-none focus:border-[#2C2C2C] text-lg font-medium"
                  placeholder="e.g. My Morning with Terracotta"
                  value={newJournal.title}
                  onChange={e => setNewJournal({ ...newJournal, title: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-[#999]">Story</label>
                <textarea
                  className="w-full bg-[#FAF9F6] border border-[#F0F0F0] p-4 text-sm font-light min-h-[150px] focus:outline-none focus:border-[#8B735B]"
                  placeholder="Tell the story of your process, inspiration..."
                  value={newJournal.content}
                  onChange={e => setNewJournal({ ...newJournal, content: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSaveJournal}
                className="flex-grow bg-[#2C2C2C] text-white py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-black transition-all"
                disabled={!newJournal.title || !newJournal.content}
              >
                Publish to Journal
              </button>
              <button onClick={() => setIsAddingJournal(false)} className="px-8 border border-gray-200 text-[10px] uppercase tracking-widest hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}


      {/* FOOTER PADDING */}
      <div className="h-24"></div>
    </div>
  );
};

export default ArtisanDashboard;

