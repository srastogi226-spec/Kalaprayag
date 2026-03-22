
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const artisanTabs: { id: string; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', count: 0, icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="square" strokeLinejoin="miter" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg> },
    { id: 'products', label: 'Products', count: 0, icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="square" strokeLinejoin="miter" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
    { id: 'workshops', label: 'Workshops', count: 0, icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="square" strokeLinejoin="miter" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
    { id: 'orders', label: 'Orders', count: newOrdersCount + newProductOrdersCount, icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="square" strokeLinejoin="miter" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
    { id: 'messages', label: 'Messages', count: unreadMessagesCount, icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="square" strokeLinejoin="miter" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
    { id: 'reviews', label: 'Reviews', count: 0, icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="square" strokeLinejoin="miter" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg> },
    { id: 'pricing', label: 'Pricing', count: 0, icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="square" strokeLinejoin="miter" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: 'profile', label: 'Profile', count: 0, icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="square" strokeLinejoin="miter" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
  ];

  const artisanTotalPending = artisanTabs.reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="flex min-h-screen bg-[#FAF9F6]">

      {/* ═══ MOBILE OVERLAY ═══ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══ LEFT SIDEBAR ═══ */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[260px] bg-[#2C2C2C] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="px-7 pt-8 pb-5 border-b border-white/10">
          <p className="text-[9px] uppercase tracking-[0.35em] text-[#8B735B] font-bold mb-1">Artisan Studio</p>
          <h1 className="text-[22px] text-[#FAF9F6] serif tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>KALA PRAYAG</h1>
        </div>

        {/* Artisan Profile Card */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 overflow-hidden border border-white/20 flex-shrink-0">
              <img src={artisan.profilePhoto} className="w-full h-full object-cover" alt={artisan.name} />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] text-[#FAF9F6] font-medium truncate">{artisan.brandName || artisan.name}</p>
              <p className="text-[10px] text-[#666] truncate">{artisan.craftType} • {artisan.location}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className={`text-[8px] uppercase tracking-[0.15em] px-2 py-0.5 font-bold ${artisan.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
              {artisan.status}
            </span>
            {artisan.rating > 0 && (
              <span className="text-[10px] text-[#8B735B] flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                {artisan.rating}
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 admin-sidebar-scroll">
          <p className="text-[9px] uppercase tracking-[0.25em] text-[#666] font-bold px-4 mb-3">Navigation</p>
          {artisanTabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSidebarOpen(false); }}
                className={`group w-full flex items-center gap-3 px-4 py-3 mb-0.5 text-left transition-all duration-200 relative ${
                  isActive
                    ? 'bg-[#8B735B]/15 text-[#FAF9F6]'
                    : 'text-[#999] hover:text-[#E5E5E5] hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#8B735B]" />
                )}
                <span className={`flex-shrink-0 transition-colors ${
                  isActive ? 'text-[#8B735B]' : 'text-[#666] group-hover:text-[#999]'
                }`}>
                  {tab.icon}
                </span>
                <span className={`text-[11px] uppercase tracking-[0.15em] flex-1 ${
                  isActive ? 'font-bold' : 'font-medium'
                }`}>
                  {tab.label}
                </span>
                {tab.count > 0 && (
                  <span className="flex-shrink-0 bg-red-500 text-white text-[9px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-4 py-5 border-t border-white/10 mt-auto">
          {artisanTotalPending > 0 && (
            <div className="mb-4 px-3 py-2.5 bg-amber-500/10 border border-amber-500/20">
              <p className="text-[9px] uppercase tracking-[0.2em] text-amber-400 font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-400 animate-pulse" />
                {artisanTotalPending} items need attention
              </p>
            </div>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-[#666] hover:text-red-400 transition-colors group"
            >
              <svg className="w-[18px] h-[18px] group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-[10px] uppercase tracking-[0.15em] font-medium">Switch Profile</span>
            </button>
          )}
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 min-w-0 lg:ml-0">
        {/* Mobile Top Bar */}
        <div className="lg:hidden sticky top-0 z-30 bg-[#2C2C2C] px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-[#FAF9F6] p-1.5 hover:bg-white/10 transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="square" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-[13px] text-[#FAF9F6] serif tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>KALA PRAYAG</span>
          <div className="flex items-center gap-2">
            {artisanTotalPending > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {artisanTotalPending}
              </span>
            )}
          </div>
        </div>

        {/* Content Header */}
        <div className="px-6 lg:px-10 pt-8 pb-6 border-b border-[#E5E5E5] bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#8B735B] font-bold mb-1">{artisanTabs.find(t => t.id === activeTab)?.label || 'Dashboard'}</p>
              <h2 className="text-2xl lg:text-3xl serif text-[#2C2C2C]" style={{ fontFamily: "'Playfair Display', serif" }}>{artisan.brandName || artisan.name}</h2>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-6 lg:px-10 py-8">

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

      {activeTab === 'orders' && (() => {
        // ── Derived stats ──────────────────────────────
        const totalCustom = myOrders.length;
        const totalShop   = myProductOrders.length;
        const totalAll    = totalCustom + totalShop;
        const pendingAll  = myOrders.filter(o => o.artisanStatus === 'waiting').length + myProductOrders.filter(o => o.status === 'pending').length;
        const completedAll= myOrders.filter(o => o.artisanStatus === 'completed').length + myProductOrders.filter(o => o.status === 'delivered').length;
        const totalAdvance= myOrders.reduce((s, o) => s + (o.advancePayment?.amount || 0), 0);

        // Grouping helpers
        const groupByMonth = <T extends { createdAt: string }>(arr: T[]): [string, T[]][] => {
          const sorted = [...arr].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          const map: Record<string, T[]> = {};
          sorted.forEach(item => {
            const k = new Date(item.createdAt).toLocaleDateString('default', { month: 'long', year: 'numeric' });
            if (!map[k]) map[k] = [];
            map[k].push(item);
          });
          return Object.entries(map);
        };

        const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

        const customStatusStyle = (status: string) => {
          if (status === 'waiting')   return 'bg-amber-50  text-amber-700  border-amber-200';
          if (status === 'accepted')  return 'bg-blue-50   text-blue-700   border-blue-200';
          if (status === 'completed') return 'bg-green-50  text-green-700  border-green-200';
          return 'bg-gray-50 text-gray-600 border-gray-200';
        };
        const shopStatusStyle = (status: string) => {
          if (status === 'pending')   return 'bg-amber-50  text-amber-700  border-amber-200';
          if (status === 'confirmed') return 'bg-blue-50   text-blue-700   border-blue-200';
          if (status === 'shipped')   return 'bg-indigo-50 text-indigo-700 border-indigo-200';
          if (status === 'delivered') return 'bg-green-50  text-green-700  border-green-200';
          return 'bg-red-50 text-red-700 border-red-200';
        };
        const dotColor = (style: string) => style.includes('amber') ? 'bg-amber-400' : style.includes('blue') ? 'bg-blue-400' : style.includes('indigo') ? 'bg-indigo-400' : style.includes('green') ? 'bg-green-400' : 'bg-red-400';

        return (
          <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">

            {/* ── Stat Summary Row ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Orders',    value: totalAll,        sub: `${totalCustom} custom · ${totalShop} shop` },
                { label: 'Needs Action',    value: pendingAll,      sub: 'Awaiting your response' },
                { label: 'Completed',       value: completedAll,    sub: 'Successfully fulfilled' },
                { label: 'Advance Received',value: `₹${totalAdvance.toLocaleString()}`, sub: 'From custom orders' },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-white border border-[#E5E5E5] rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-[10px] uppercase tracking-widest text-[#999] font-semibold mb-2">{label}</p>
                  <p className="text-3xl font-bold text-[#1A1A1A] tracking-tight">{value}</p>
                  <p className="text-[10px] text-[#BBB] mt-1.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* ── Filter Tabs ── */}
            <div className="flex items-center gap-1 bg-[#F5F5F5] p-1 rounded-lg w-fit">
              {(['all','custom','shop'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setOrderTypeFilter(f)}
                  className={`px-5 py-2 text-[10px] uppercase tracking-widest font-bold rounded-md transition-all flex items-center gap-2 ${
                    orderTypeFilter === f ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#999] hover:text-[#555]'
                  }`}
                >
                  {f === 'all'    ? 'All Orders' : f === 'custom' ? 'Custom' : 'Shop Orders'}
                  {f === 'custom' && newOrdersCount > 0 && <span className="bg-amber-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center">{newOrdersCount}</span>}
                  {f === 'shop'   && newProductOrdersCount > 0 && <span className="bg-amber-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center">{newProductOrdersCount}</span>}
                </button>
              ))}
            </div>

            {/* ── Custom Commissions Table ── */}
            {(orderTypeFilter === 'all' || orderTypeFilter === 'custom') && (
              <div className="space-y-2">
                {orderTypeFilter === 'all' && <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#8B735B] mb-3">Custom Commissions</h3>}
                {myOrders.length === 0 ? (
                  <div className="py-20 text-center bg-white border border-[#E5E5E5] rounded-lg">
                    <p className="text-3xl mb-2">🎨</p>
                    <p className="text-sm font-medium text-[#555]">No custom commissions yet</p>
                    <p className="text-xs text-[#BBB] mt-1">Collector requests assigned to you will appear here.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-[#E5E5E5] rounded-lg overflow-hidden shadow-sm">
                    {/* Table header */}
                    <div className="grid grid-cols-[2fr_1.5fr_2fr_1.5fr_1.2fr_1.2fr_1fr] gap-0 px-5 py-3 border-b border-[#F0F0F0] bg-[#FAFAFA]">
                      {['Order ID', 'Date', 'Customer', 'Category', 'Advance', 'Status', 'Action'].map(h => (
                        <p key={h} className="text-[9px] uppercase tracking-widest text-[#AAA] font-bold">{h}</p>
                      ))}
                    </div>
                    {/* Grouped rows */}
                    {groupByMonth(myOrders).map(([monthYear, orders]) => (
                      <div key={monthYear}>
                        {/* Month divider */}
                        <div className="px-5 py-2 bg-[#F9F8F6] border-y border-[#EFEFEF]">
                          <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#8B735B]">{monthYear}</span>
                        </div>
                        {orders.map(o => {
                          const isExpanded = !!expandedOrders[o.id];
                          const statusStyle = customStatusStyle(o.artisanStatus);
                          return (
                            <div key={o.id} className={`border-b border-[#F5F5F5] last:border-b-0 transition-colors ${isExpanded ? 'bg-[#FDFCFB]' : 'hover:bg-[#FCFCFC]'}`}>
                              {/* Row */}
                              <div
                                className="grid grid-cols-[2fr_1.5fr_2fr_1.5fr_1.2fr_1.2fr_1fr] gap-0 px-5 py-3.5 cursor-pointer items-center"
                                onClick={() => toggleOrderExpansion(o.id)}
                              >
                                <div className="flex items-center gap-2">
                                  {o.artisanStatus === 'waiting' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />}
                                  <p className="text-xs font-mono text-[#555] truncate">#{o.id.slice(-8)}</p>
                                </div>
                                <p className="text-xs text-[#666]">{fmtDate(o.createdAt)}</p>
                                <p className="text-xs font-semibold text-[#1A1A1A] truncate pr-2">{o.customerName}</p>
                                <p className="text-xs text-[#666] truncate">{o.category}</p>
                                <p className="text-xs font-bold text-[#8B735B]">₹{(o.advancePayment?.amount || 0).toLocaleString()}</p>
                                <div>
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold border ${statusStyle}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor(statusStyle)}`} />
                                    {o.artisanStatus}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 justify-end">
                                  <svg className={`w-4 h-4 text-[#BBB] transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                              </div>
                              {/* Expanded detail panel */}
                              {isExpanded && (
                                <div className="px-5 pb-5 bg-[#FAF9F6] border-t border-[#F0F0F0] animate-in slide-in-from-top-2 duration-200">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                                    {/* Left: order details */}
                                    <div className="md:col-span-2 space-y-4">
                                      <div>
                                        <p className="text-[9px] uppercase tracking-widest text-[#999] font-bold mb-1">Vision / Concept</p>
                                        <p className="text-sm text-[#444] leading-relaxed italic">"{o.concept}"</p>
                                      </div>
                                      <div className="grid grid-cols-3 gap-4">
                                        <div><p className="text-[9px] uppercase tracking-widest text-[#999] font-bold">Size</p><p className="text-sm font-medium text-[#1A1A1A] mt-0.5">{o.size || o.dimensions || '—'}</p></div>
                                        <div><p className="text-[9px] uppercase tracking-widest text-[#999] font-bold">Finish</p><p className="text-sm font-medium text-[#1A1A1A] mt-0.5">{o.finish || '—'}</p></div>
                                        <div><p className="text-[9px] uppercase tracking-widest text-[#999] font-bold">Full Order ID</p><p className="text-[10px] font-mono text-[#555] mt-0.5 break-all">{o.id}</p></div>
                                      </div>
                                      <div className="pt-2 border-t border-[#EBEBEB]">
                                        <p className="text-[9px] uppercase tracking-widest text-[#999] font-bold mb-1">Contact</p>
                                        <p className="text-xs text-[#444]">{o.email} · {o.phone}</p>
                                      </div>
                                      {o.adminNote && (
                                        <div className="bg-amber-50 border border-amber-100 rounded-md p-3">
                                          <p className="text-[9px] uppercase tracking-widest text-amber-700 font-bold mb-1">Admin Note</p>
                                          <p className="text-xs text-amber-900">{o.adminNote}</p>
                                        </div>
                                      )}
                                    </div>
                                    {/* Right: actions */}
                                    <div className="space-y-3">
                                      {o.artisanStatus === 'waiting' && (
                                        <>
                                          <p className="text-[9px] uppercase tracking-widest text-[#999] font-bold">Note to Customer</p>
                                          <textarea
                                            rows={3}
                                            placeholder="e.g. I can start next week..."
                                            className="w-full border border-[#D1D1D1] p-2.5 text-xs focus:outline-none focus:border-[#2C2C2C] resize-none rounded-md"
                                            value={artisanNotes[o.id] || ''}
                                            onChange={e => setArtisanNotes(prev => ({ ...prev, [o.id]: e.target.value }))}
                                          />
                                          <button
                                            onClick={e => { e.stopPropagation(); onAcceptOrder(o.id, artisanNotes[o.id] || ''); }}
                                            className="w-full bg-[#1A1A1A] text-white py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-[#8B735B] transition-all rounded-md"
                                          >
                                            Accept Commission
                                          </button>
                                        </>
                                      )}
                                      {o.artisanStatus === 'accepted' && (
                                        <div className="space-y-2">
                                          <button
                                            onClick={e => { e.stopPropagation(); onUpdateCustomOrder?.({ ...o, artisanStatus: 'completed', status: 'completed', acceptedAt: o.acceptedAt || new Date().toISOString() }); }}
                                            className="w-full bg-[#1A1A1A] text-white py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-green-700 transition-all rounded-md"
                                          >
                                            Mark as Completed ✓
                                          </button>
                                          <a
                                            href={`https://wa.me/${o.phone?.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(o.customerName)}!`}
                                            target="_blank" rel="noreferrer"
                                            className="flex items-center justify-center gap-2 w-full border border-[#D1D1D1] bg-white text-[#1A1A1A] hover:bg-[#25D366] hover:border-[#25D366] hover:text-white py-2.5 text-[10px] uppercase tracking-widest font-bold rounded-md transition-all"
                                          >
                                            WhatsApp
                                          </a>
                                        </div>
                                      )}
                                      {o.artisanStatus === 'completed' && (
                                        <div className="text-center py-4">
                                          <span className="text-2xl">✅</span>
                                          <p className="text-xs text-[#999] mt-1">Commission Completed</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Masterpiece Sales Table ── */}
            {(orderTypeFilter === 'all' || orderTypeFilter === 'shop') && (
              <div className={`space-y-2 ${orderTypeFilter === 'all' ? 'mt-8' : ''}`}>
                {orderTypeFilter === 'all' && <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#8B735B] mb-3">Masterpiece Sales</h3>}
                {myProductOrders.length === 0 ? (
                  <div className="py-20 text-center bg-white border border-[#E5E5E5] rounded-lg">
                    <p className="text-3xl mb-2">🏺</p>
                    <p className="text-sm font-medium text-[#555]">No shop orders yet</p>
                    <p className="text-xs text-[#BBB] mt-1">Sales from your listed artwork will appear here.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-[#E5E5E5] rounded-lg overflow-hidden shadow-sm">
                    {/* Table header */}
                    <div className="grid grid-cols-[2fr_1.5fr_2fr_1.5fr_1.2fr_1.2fr_1fr] gap-0 px-5 py-3 border-b border-[#F0F0F0] bg-[#FAFAFA]">
                      {['Order ID', 'Date', 'Customer', 'Items', 'Subtotal', 'Status', 'Action'].map(h => (
                        <p key={h} className="text-[9px] uppercase tracking-widest text-[#AAA] font-bold">{h}</p>
                      ))}
                    </div>
                    {/* Grouped rows */}
                    {groupByMonth(myProductOrders).map(([monthYear, orders]) => (
                      <div key={monthYear}>
                        <div className="px-5 py-2 bg-[#F9F8F6] border-y border-[#EFEFEF]">
                          <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#8B735B]">{monthYear}</span>
                        </div>
                        {orders.map(o => {
                          const isExpanded = !!expandedOrders[o.id];
                          const statusStyle = shopStatusStyle(o.status);
                          const myItems = o.items.filter(item => {
                            const product = products.find(p => p.id === item.productId);
                            return product?.artisanId === artisan.id;
                          });
                          const mySubtotal = myItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                          return (
                            <div key={o.id} className={`border-b border-[#F5F5F5] last:border-b-0 transition-colors ${isExpanded ? 'bg-[#FDFCFB]' : 'hover:bg-[#FCFCFC]'}`}>
                              {/* Row */}
                              <div
                                className="grid grid-cols-[2fr_1.5fr_2fr_1.5fr_1.2fr_1.2fr_1fr] gap-0 px-5 py-3.5 cursor-pointer items-center"
                                onClick={() => toggleOrderExpansion(o.id)}
                              >
                                <div className="flex items-center gap-2">
                                  {o.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />}
                                  <p className="text-xs font-mono text-[#555] truncate">#{o.id.slice(-8)}</p>
                                </div>
                                <p className="text-xs text-[#666]">{fmtDate(o.createdAt)}</p>
                                <p className="text-xs font-semibold text-[#1A1A1A] truncate pr-2">{o.customerName}</p>
                                <p className="text-xs text-[#666]">{myItems.length} item{myItems.length !== 1 ? 's' : ''}</p>
                                <p className="text-xs font-bold text-[#8B735B]">₹{mySubtotal.toLocaleString()}</p>
                                <div>
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold border ${statusStyle}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor(statusStyle)}`} />
                                    {o.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 justify-end">
                                  <svg className={`w-4 h-4 text-[#BBB] transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                              </div>
                              {/* Expanded panel */}
                              {isExpanded && (
                                <div className="px-5 pb-5 bg-[#FAF9F6] border-t border-[#F0F0F0] animate-in slide-in-from-top-2 duration-200">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                                    <div className="md:col-span-2 space-y-4">
                                      {/* Item list */}
                                      <div>
                                        <p className="text-[9px] uppercase tracking-widest text-[#999] font-bold mb-2">Products</p>
                                        <div className="space-y-2">
                                          {myItems.map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 bg-white border border-[#EBEBEB] rounded-md p-2.5">
                                              <img src={item.image} className="w-10 h-10 object-cover rounded border border-[#E5E5E5] flex-shrink-0" alt="" />
                                              <div className="flex-grow min-w-0">
                                                <p className="text-xs font-semibold text-[#1A1A1A] truncate">{item.name}</p>
                                                <p className="text-[9px] text-[#888] mt-0.5">Qty: {item.quantity}</p>
                                              </div>
                                              <p className="text-xs font-bold text-[#8B735B] flex-shrink-0">₹{(item.price * item.quantity).toLocaleString()}</p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                      {/* Shipping */}
                                      <div className="pt-2 border-t border-[#EBEBEB]">
                                        <p className="text-[9px] uppercase tracking-widest text-[#999] font-bold mb-1">Shipping Address</p>
                                        <p className="text-xs text-[#444]">{o.shippingAddress}, {o.city} — {o.pincode}</p>
                                      </div>
                                    </div>
                                    {/* Actions */}
                                    <div className="space-y-3">
                                      <p className="text-[9px] uppercase tracking-widest text-[#999] font-bold">Update Status</p>
                                      <div className="flex flex-col gap-2">
                                        {(['confirmed','shipped','delivered'] as const).map(s => (
                                          <button
                                            key={s}
                                            onClick={e => { e.stopPropagation(); onUpdateProductOrder?.({ ...o, status: s }); }}
                                            className={`py-2.5 text-[9px] uppercase tracking-widest font-bold border rounded-md transition-all ${
                                              o.status === s
                                                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-sm'
                                                : 'border-[#D1D1D1] bg-white text-[#666] hover:border-[#8B735B] hover:text-[#8B735B]'
                                            }`}
                                          >
                                            {s} {o.status === s && '✓'}
                                          </button>
                                        ))}
                                      </div>
                                      <a
                                        href={`https://wa.me/${o.customerPhone?.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(o.customerName)}!`}
                                        target="_blank" rel="noreferrer"
                                        className="flex items-center justify-center gap-2 w-full border border-[#D1D1D1] bg-white text-[#333] hover:bg-[#25D366] hover:border-[#25D366] hover:text-white py-2.5 text-[10px] uppercase tracking-widest font-bold rounded-md transition-all mt-1"
                                      >
                                        WhatsApp Customer
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        );
      })()}




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


        </div>
      </main>
    </div>
  );
};

export default ArtisanDashboard;

