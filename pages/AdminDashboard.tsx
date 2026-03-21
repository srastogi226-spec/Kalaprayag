import React, { useState, useRef } from 'react';
import { compressImage } from '../utils/imageUtils';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { auth, db } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Product, CustomOrder, ArtisanApplication, Artisan, Workshop, Review, CustomRequest, InstitutionRequest, ProductOrder, StudioJournalEntry, InvoiceData, ClassBooking } from '../types';
import InvoiceView from '../components/InvoiceView';

interface AdminDashboardProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: CustomOrder[];
  setOrders: React.Dispatch<React.SetStateAction<CustomOrder[]>>;
  applications: ArtisanApplication[];
  setApplications: React.Dispatch<React.SetStateAction<ArtisanApplication[]>>;
  artisans: Artisan[];
  setArtisans: React.Dispatch<React.SetStateAction<Artisan[]>>;
  workshops: Workshop[];
  setWorkshops: React.Dispatch<React.SetStateAction<Workshop[]>>;
  reviews: Review[];
  setReviews: React.Dispatch<React.SetStateAction<Review[]>>;
  customRequests: CustomRequest[];
  institutionRequests: InstitutionRequest[];
  setInstitutionRequests: React.Dispatch<React.SetStateAction<InstitutionRequest[]>>;
  productOrders?: ProductOrder[];
  journalEntries?: StudioJournalEntry[];
  invoices?: InvoiceData[];
  classBookings?: ClassBooking[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products, setProducts, orders, setOrders, applications, setApplications, artisans, setArtisans, workshops, setWorkshops, reviews, setReviews, customRequests, institutionRequests, setInstitutionRequests, productOrders = [], journalEntries = [], invoices = [], classBookings = []
}) => {


  // Dashboard states
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'workshops' | 'product-orders' | 'artisans' | 'manage-artisans' | 'pending-products' | 'pending-workshops' | 'active-workshops' | 'moderation' | 'marketplace-requests' | 'institution-requests' | 'journal' | 'invoices' | 'shipping' | 'bookings'>('inventory');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState('All');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('All');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [editingArtisan, setEditingArtisan] = useState<Artisan | null>(null);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [editingJournalEntry, setEditingJournalEntry] = useState<StudioJournalEntry | null>(null);
  const [inventoryCategory, setInventoryCategory] = useState('All');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [artisanCraftFilter, setArtisanCraftFilter] = useState('All');
  const [showCraftDropdown, setShowCraftDropdown] = useState(false);
  const [workshopModeFilter, setWorkshopModeFilter] = useState('All');
  const [showWorkshopDropdown, setShowWorkshopDropdown] = useState(false);
  const [orderTypeFilter, setOrderTypeFilter] = useState('All');
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);
  const [workshopTabFilter, setWorkshopTabFilter] = useState('Workshops');
  const [orderArtisanFilter, setOrderArtisanFilter] = useState('All');
  const [showOrderArtisanDropdown, setShowOrderArtisanDropdown] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [expandedWorkshops, setExpandedWorkshops] = useState<Record<string, boolean>>({});
  const journalImageInputRef = useRef<HTMLInputElement>(null);
  // ── Issue 2: AWB input state for shipping ─────────────────────────────
  const [awbInputs, setAwbInputs] = useState<Record<string, string>>({});
  const [awbSaving, setAwbSaving] = useState<Record<string, boolean>>({});

  const toggleOrderExpansion = (id: string) => {
    setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleWorkshopExpansion = (id: string) => {
    setExpandedWorkshops(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('kp_admin_auth_session');
    window.location.reload();
  };

  // ── Dashboard content (existing code below) ───────────────────────────

  const handleOrderStatus = (id: string, status: 'accepted' | 'rejected' | 'completed') => {
    const order = orders.find(o => o.id === id);
    if (order) {
      const adminStatus = status === 'accepted' ? 'approved' : status === 'rejected' ? 'pending' : order.adminStatus;
      const artisanStatus = status === 'accepted' ? 'waiting' : order.artisanStatus;
      setDoc(doc(db, 'customOrders', id), { ...order, status, adminStatus, artisanStatus }).catch(e => alert("Error updating order: " + e.message));
    }
  };

  const handleApproveArtisan = async (app: ArtisanApplication) => {
    const newArtisan: Artisan = {
      ...app,
      status: 'approved',
      rating: 0,
      reviewCount: 0
    };
    try {
      await setDoc(doc(db, 'artisans', app.id), newArtisan);
      await deleteDoc(doc(db, 'applications', app.id));
    } catch (e: any) { alert("Error approving artisan: " + e.message); }
  };

  const handleProductStatus = (id: string, status: 'approved' | 'rejected') => {
    const product = products.find(p => p.id === id);
    if (product) setDoc(doc(db, 'products', id), { ...product, status }).catch(e => alert("Error: " + e.message));
  };

  const handleWorkshopStatus = (id: string, status: 'approved' | 'rejected') => {
    const workshop = workshops.find(w => w.id === id);
    if (workshop) setDoc(doc(db, 'workshops', id), { ...workshop, status }).catch(e => alert("Error: " + e.message));
  };

  const handleAdminUpdateWorkshop = () => {
    if (!editingWorkshop) return;
    setDoc(doc(db, 'workshops', editingWorkshop.id), editingWorkshop).catch(e => alert("Error saving workshop: " + e.message));
    setEditingWorkshop(null);
  };

  const handleJournalSave = () => {
    if (!editingJournalEntry) return;
    setDoc(doc(db, 'journal', editingJournalEntry.id), editingJournalEntry).catch(e => alert("Error saving story: " + e.message));
    setEditingJournalEntry(null);
  };

  const handleJournalDelete = (id: string) => {
    if (window.confirm('Delete this story?')) {
      deleteDoc(doc(db, 'journal', id)).catch(e => alert("Error deleting story: " + e.message));
    }
  };

  const handleJournalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingJournalEntry) {
      try {
        const compressed = await compressImage(file, 1200, 0.7);
        setEditingJournalEntry({ ...editingJournalEntry, image: compressed });
      } catch (err) {
        console.error("Error uploading image:", err);
        alert("Error uploading image. Please try again.");
      }
    }
    if (e.target) e.target.value = '';
  };

  const pendingProds = products.filter(p => p.status === 'pending');
  const pendingWorkshops = workshops.filter(w => w.status === 'pending');
  const activeWorkshops = workshops.filter(w => w.status === 'approved');
  const pendingReviews = reviews.filter(r => r.status === 'pending');
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const newMarketplaceRequests = customRequests.filter(r => r.status === 'new');

  const newInstitutionRequests = institutionRequests.filter(r => r.status === 'new');

  const tabs = [
    { id: 'inventory', label: 'Inventory', count: pendingProds.length },
    { id: 'orders', label: 'Orders', count: pendingOrders.length + productOrders.filter(o => o.status === 'pending').length },
    { id: 'workshops', label: 'Workshops', count: newInstitutionRequests.length + pendingWorkshops.length + classBookings.filter(b => b.status === 'confirmed').length },
    { id: 'invoices', label: 'Invoices', count: 0 },
    { id: 'manage-artisans', label: 'Artisans', count: applications.length },
    { id: 'journal', label: 'Journal', count: 0 },
    { id: 'moderation', label: 'Reviews', count: pendingReviews.length },
    { id: 'shipping', label: 'Shipping', count: productOrders.filter(o => o.awb && o.shippingStatus !== 'Delivered').length },
  ];

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl serif">Management Console</h1>
        <div className="flex items-center gap-4">
          <div className="flex flex-wrap gap-2 bg-[#F0F0F0] p-1 rounded-md">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-2 text-[10px] uppercase tracking-widest rounded-md transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white shadow-sm text-[#2C2C2C]' : 'text-[#999]'}`}>
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="text-white rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center text-[8px] font-bold animate-pulse bg-red-500">{tab.count}</span>
                )}
              </button>
            ))}
          </div>
          <button onClick={handleAdminLogout} className="text-[9px] uppercase tracking-widest text-[#999] border border-[#E5E5E5] px-4 py-2 hover:border-red-300 hover:text-red-500 transition-all flex items-center gap-2 rounded-md">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout
          </button>
        </div>
      </div>

      {/* Category filter — only on inventory tab */}
      {activeTab === 'inventory' && (
        <div className="flex justify-end mb-6 relative">
          <button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="text-[10px] uppercase tracking-widest border border-[#E5E5E5] px-5 py-2 rounded-md flex items-center gap-2 hover:border-[#2C2C2C] transition-all bg-white"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            {inventoryCategory === 'All' ? 'All Categories' : inventoryCategory}
            <svg className={`w-3 h-3 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {showCategoryDropdown && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-[#E5E5E5] shadow-lg rounded-md z-50 min-w-[180px] py-1">
              {['All', ...new Set(products.map(p => p.category))].sort().map(cat => (
                <button
                  key={cat}
                  onClick={() => { setInventoryCategory(cat); setShowCategoryDropdown(false); }}
                  className={`w-full text-left px-4 py-2 text-[11px] uppercase tracking-widest hover:bg-[#F5F5F5] transition-all ${inventoryCategory === cat ? 'text-[#2C2C2C] font-bold bg-[#F5F5F5]' : 'text-[#999]'
                    }`}
                >
                  {cat === 'All' ? 'All Categories' : cat}
                  <span className="text-[#CCC] ml-2">({cat === 'All' ? products.length : products.filter(p => p.category === cat).length})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'inventory' && (() => {
        const filterFn = (p: Product) => inventoryCategory === 'All' || p.category === inventoryCategory;
        const filteredPending = pendingProds.filter(filterFn);
        const filteredApproved = products.filter(p => p.status === 'approved').filter(filterFn);
        return (
          <div className="space-y-8">
            {/* Pending Products */}
            {filteredPending.length > 0 && (
              <>
                <h2 className="text-xl font-medium flex items-center gap-3">Pending Approval <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded animate-status-flash">{filteredPending.length}</span></h2>
                <div className="space-y-3">
                  {filteredPending.map(p => (
                    <div key={p.id} className="bg-white p-5 border border-amber-200 shadow-sm flex flex-col md:flex-row items-start gap-6 animate-status-flash bg-amber-50/10">
                      <img src={p.images[0]} className="w-20 h-20 object-cover rounded" alt="" />
                      <div className="flex-grow">
                        <h3 className="text-lg font-medium">{p.name}</h3>
                        <p className="text-xs text-[#8B735B] uppercase tracking-widest">By {p.artisan} • {p.category} • \u20b9 {p.price.toLocaleString()}</p>
                        <p className="text-sm font-light mt-1 text-[#666] line-clamp-1">{p.description}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => handleProductStatus(p.id, 'approved')} className="bg-[#2C2C2C] text-white px-5 py-2 text-[10px] uppercase tracking-widest font-bold">Approve</button>
                        <button onClick={() => handleProductStatus(p.id, 'rejected')} className="border border-red-200 text-red-600 px-5 py-2 text-[10px] uppercase tracking-widest">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
                <hr className="border-[#E5E5E5]" />
              </>
            )}

            {/* Approved Products */}
            <h2 className="text-xl font-medium">{filteredApproved.length} Active Products</h2>
            {filteredApproved.length === 0 ? (
              <p className="text-center py-20 text-[#999] italic serif text-xl">No products in this category.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredApproved.map(p => (
                  <div key={p.id} className="bg-white p-5 border border-[#E5E5E5] flex items-center gap-6">
                    <img src={p.images[0]} className="w-14 h-14 object-cover bg-gray-50 rounded" alt="" />
                    <div className="flex-grow">
                      <h3 className="text-base font-medium">{p.name}</h3>
                      <p className="text-xs text-[#999] uppercase tracking-widest">{p.artisan} • {p.category} • \u20b9 {p.price.toLocaleString()}</p>
                    </div>
                    <button onClick={() => { if (window.confirm(`Remove "${p.name}" permanently?`)) deleteDoc(doc(db, 'products', p.id)); }} className="text-[10px] text-red-400 uppercase tracking-widest hover:text-red-600 transition-all">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}





      {/* ORDERS TAB */}
      {activeTab === 'orders' && (() => {
        // --- Order Calculations & Filtering ---
        const pendingOrders = orders.filter(o => o.status === 'pending');
        const acceptedOrders = orders.filter(o => o.status === 'accepted');
        const completedOrders = orders.filter(o => o.status === 'completed');
        
        const totalPendingProd = productOrders.filter(o => o.status === 'pending').length;
        const totalDeliveredProd = productOrders.filter(o => o.status === 'delivered').length;

        // Apply Artisan Filter
        const filteredShopOrders = orderArtisanFilter === 'All' 
          ? productOrders 
          : productOrders.filter(o => o.artisanName === orderArtisanFilter);

        const filteredCustomOrders = orderArtisanFilter === 'All'
          ? orders
          : orders.filter(o => o.assignedArtisanName === orderArtisanFilter);

        // Advance calculation
        const advanceAmount = orders.reduce((sum, o) => sum + (o.advancePayment?.amount || 0), 0);
        const shopAmount = productOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const totalActionNeeded = pendingOrders.length + acceptedOrders.length + totalPendingProd;

        return (
          <div className="space-y-12 animate-in fade-in duration-500">
            {/* STATS ROW */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white p-6 border border-[#E5E5E5] flex flex-col justify-between shadow-sm hover:shadow-md transition-all group">
                <p className="text-[10px] uppercase tracking-widest text-[#999] font-bold mb-4 group-hover:text-[#8B735B] transition-colors">Total Orders</p>
                <div>
                  <p className="text-3xl font-light text-[#2C2C2C]">{orders.length + productOrders.length}</p>
                  <p className="text-xs text-[#BBB] mt-1">{orders.length} Custom / {productOrders.length} Shop</p>
                </div>
              </div>
              <div className="bg-amber-50/30 p-6 border border-amber-100 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group">
                <p className="text-[10px] uppercase tracking-widest text-amber-800 font-bold mb-4 flex items-center gap-2 group-hover:text-amber-900 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Needs Action
                </p>
                <div>
                  <p className="text-3xl font-light text-amber-900">{totalActionNeeded}</p>
                  <p className="text-xs text-amber-700/70 mt-1">Pending approval & shipment</p>
                </div>
              </div>
              <div className="bg-white p-6 border border-[#E5E5E5] flex flex-col justify-between shadow-sm hover:shadow-md transition-all group">
                <p className="text-[10px] uppercase tracking-widest text-[#999] font-bold mb-4 group-hover:text-green-600 transition-colors">Completed</p>
                <div>
                  <p className="text-3xl font-light text-[#2C2C2C]">{completedOrders.length + totalDeliveredProd}</p>
                  <p className="text-xs text-[#BBB] mt-1">Delivered & finalized orders</p>
                </div>
              </div>
              <div className="bg-[#FAF9F6] p-6 border border-[#E5E5E5] flex flex-col justify-between shadow-sm hover:shadow-md transition-all group">
                <p className="text-[10px] uppercase tracking-widest text-[#8B735B] font-bold mb-4 group-hover:text-[#2C2C2C] transition-colors">Total Revenue</p>
                <div>
                  <p className="text-3xl font-light text-[#2C2C2C]">₹ {(advanceAmount + shopAmount).toLocaleString()}</p>
                  <p className="text-xs text-[#BBB] mt-1">Custom advance + Shop sales</p>
                </div>
              </div>
            </div>

            {/* FILTERS ROW */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-[#E5E5E5] sticky top-0 bg-[#FAF9F6] z-20 pt-2 -mt-2">
              
              {/* Type Filters (Pills) */}
              <div className="flex gap-2 bg-white p-1 rounded-md border border-[#E5E5E5] shadow-sm">
                {[
                  { id: 'All', label: 'All Orders', count: orders.length + productOrders.length, new: totalPendingProd + pendingOrders.length },
                  { id: 'Custom Orders', label: 'Custom', count: orders.length, new: pendingOrders.length },
                  { id: 'Shop Orders', label: 'Shop', count: productOrders.length, new: totalPendingProd }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setOrderTypeFilter(tab.id)}
                    className={`relative px-6 py-2.5 text-[11px] uppercase tracking-widest font-bold rounded-sm transition-all duration-300 flex flex-col items-center justify-center min-w-[120px] ${
                      orderTypeFilter === tab.id 
                        ? 'bg-[#2C2C2C] text-white shadow-md' 
                        : 'text-[#999] hover:bg-gray-50 hover:text-[#2C2C2C]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[9px] mt-0.5 font-normal ${orderTypeFilter === tab.id ? 'text-gray-300' : 'text-[#BBB]'}`}>
                      {tab.count} Total
                    </span>
                    {tab.new > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] text-white shadow-sm ring-2 ring-white font-bold animate-in zoom-in">
                        {tab.new}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Artisan Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowOrderArtisanDropdown(!showOrderArtisanDropdown)}
                  className="bg-white border border-[#E5E5E5] px-5 py-3 rounded-md flex items-center gap-3 text-[11px] uppercase tracking-widest font-bold text-[#666] hover:text-[#2C2C2C] hover:border-[#8B735B] transition-all shadow-sm min-w-[220px] justify-between"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-[#8B735B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    {orderArtisanFilter === 'All' ? 'All Artists' : orderArtisanFilter}
                  </span>
                  <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${showOrderArtisanDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                
                {showOrderArtisanDropdown && (
                  <div className="absolute top-full right-0 mt-2 bg-white border border-[#E5E5E5] shadow-xl rounded-md z-50 min-w-full py-2 animate-in fade-in slide-in-from-top-2">
                    <button
                      onClick={() => { setOrderArtisanFilter('All'); setShowOrderArtisanDropdown(false); }}
                      className={`w-full text-left px-5 py-2.5 text-[11px] uppercase tracking-widest transition-all ${
                        orderArtisanFilter === 'All' ? 'bg-[#FAF9F6] text-[#8B735B] font-bold border-l-2 border-[#8B735B]' : 'text-[#666] hover:bg-gray-50 border-l-2 border-transparent hover:text-[#2C2C2C]'
                      }`}
                    >
                      All Artists
                    </button>
                    <div className="my-1 border-t border-gray-100"></div>
                    {artisans.filter(a => a.status === 'approved').map(artisan => (
                      <button
                        key={artisan.id}
                        onClick={() => { setOrderArtisanFilter(artisan.name); setShowOrderArtisanDropdown(false); }}
                        className={`w-full text-left px-5 py-2.5 text-[11px] uppercase tracking-widest transition-all ${
                          orderArtisanFilter === artisan.name ? 'bg-[#FAF9F6] text-[#8B735B] font-bold border-l-2 border-[#8B735B]' : 'text-[#666] hover:bg-gray-50 border-l-2 border-transparent hover:text-[#2C2C2C]'
                        }`}
                      >
                        {artisan.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Helper Functions for the tables */}
            {(() => {
              const fmtDate = (dString: string) => {
                const d = new Date(dString);
                return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
              };
              
              const dotColor = (s: string) => {
                if(s === 'pending' || s === 'waiting') return 'bg-amber-400 animate-pulse';
                if(s === 'accepted' || s === 'confirmed' || s === 'shipped') return 'bg-blue-500';
                if(s === 'completed' || s === 'delivered') return 'bg-green-500';
                return 'bg-red-500';
              };
              
              const statusStyle = (s: string) => {
                if(s === 'pending' || s === 'waiting') return 'bg-amber-50 text-amber-700 border-amber-200';
                if(s === 'accepted' || s === 'confirmed') return 'bg-blue-50 text-blue-700 border-blue-200';
                if(s === 'shipped') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
                if(s === 'completed' || s === 'delivered') return 'bg-green-50 text-green-700 border-green-200';
                return 'bg-red-50 text-red-700 border-red-200';
              };

              const groupByMonth = <T extends { createdAt: string }>(items: T[]) => {
                return Object.entries(
                  items
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .reduce((groups, item) => {
                      const date = new Date(item.createdAt);
                      const monthYear = date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
                      if (!groups[monthYear]) groups[monthYear] = [];
                      groups[monthYear].push(item);
                      return groups;
                    }, {} as Record<string, T[]>)
                );
              };

              return (
                <div className="space-y-16">
                  
                  {/* --- CUSTOM COMMISSIONS TABLE --- */}
                  {(orderTypeFilter === 'All' || orderTypeFilter === 'Custom Orders') && (
                    <div className="space-y-6">
                      <h3 className="text-2xl serif italic text-[#2C2C2C]">Custom Commissions</h3>
                      {filteredCustomOrders.length === 0 ? (
                        <div className="py-24 text-center bg-white border border-[#E5E5E5] shadow-sm rounded-sm">
                          <p className="serif text-2xl italic text-[#999]">No custom commissions match this filter.</p>
                        </div>
                      ) : (
                        <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-sm overflow-hidden">
                          {/* Table Header */}
                          <div className="grid grid-cols-[1.5fr_1fr_1.5fr_1fr_1.5fr_1fr_auto] gap-4 p-4 border-b border-[#E5E5E5] bg-[#FAF9F6] text-[10px] uppercase tracking-widest font-bold text-[#999]">
                            <div>Order ID</div>
                            <div>Date</div>
                            <div>Customer</div>
                            <div>Assigned To</div>
                            <div>Commission details</div>
                            <div>Status</div>
                            <div className="w-10 text-center"></div>
                          </div>
                          
                          {/* Grouped Table Rows */}
                          {groupByMonth(filteredCustomOrders).map(([monthYear, monthOrders]) => (
                            <div key={monthYear}>
                              {/* Sticky Month Divider */}
                              <div className="bg-gray-50 border-y border-[#E5E5E5] px-4 py-2 text-xs uppercase tracking-[0.2em] font-bold text-[#8B735B] sticky top-[73px] z-10">
                                {monthYear}
                              </div>
                              
                              {/* Individual Rows */}
                              {monthOrders.map((o: any) => {
                                const isExpanded = !!expandedOrders[o.id];
                                return (
                                  <React.Fragment key={o.id}>
                                    <div 
                                      onClick={() => toggleOrderExpansion(o.id)}
                                      className={`grid grid-cols-[1.5fr_1fr_1.5fr_1fr_1.5fr_1fr_auto] gap-4 p-4 items-center border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${isExpanded ? 'bg-[#FAF9F6]' : ''}`}
                                    >
                                      {/* Order ID */}
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor(o.status)}`} />
                                        <p className="text-[11px] uppercase tracking-widest font-bold text-[#666] truncate">{o.id}</p>
                                        <button onClick={(e: any) => { e.stopPropagation(); navigator.clipboard.writeText(o.id); alert('ID Copied!'); }} className="text-[#CCC] hover:text-[#8B735B]">
                                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                                        </button>
                                      </div>
                                      
                                      <div className="text-xs text-[#666]">{fmtDate(o.createdAt)}</div>
                                      <div className="text-sm font-medium text-[#2C2C2C] truncate">{o.customerName}</div>
                                      <div className="text-xs font-semibold text-[#8B735B] truncate">{o.assignedArtisanName || <span className="text-[#999] italic font-normal">Unassigned</span>}</div>
                                      
                                      <div className="text-xs text-[#666] truncate group relative">
                                        <span className="truncate block">{o.category} • {o.size}</span>
                                      </div>

                                      <div>
                                        <span className={`px-2.5 py-1 text-[9px] uppercase tracking-widest font-bold border rounded-full ${statusStyle(o.status)}`}>
                                          {o.status}
                                        </span>
                                      </div>

                                      <div className="w-10 text-center">
                                       <button className={`text-[#BBB] transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[#8B735B]' : 'hover:text-[#2C2C2C]'}`}>
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
                                        </button>
                                      </div>
                                    </div>

                                    {/* Expanded Detail Panel */}
                                    {isExpanded && (
                                      <div className="col-span-full border-b border-gray-200 bg-[#FAF9F6] p-0 overflow-hidden animate-in slide-in-from-top-2 duration-300">
                                        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
                                          {/* Left Col: Details */}
                                          <div className="space-y-8">
                                            <div>
                                              <p className="text-[10px] uppercase tracking-widest text-[#999] font-bold mb-3">Client Vision</p>
                                              <div className="bg-white border border-[#E5E5E5] p-5 rounded-sm shadow-sm space-y-4">
                                                <p className="text-sm text-[#4A4A4A] leading-relaxed italic border-l-2 border-[#8B735B] pl-4">"{o.concept}"</p>
                                                <div className="grid grid-cols-2 gap-4 text-xs">
                                                  <div><p className="text-[9px] uppercase tracking-widest text-[#999] font-bold">Category</p><p className="font-semibold">{o.category}</p></div>
                                                  <div><p className="text-[9px] uppercase tracking-widest text-[#999] font-bold">Finish</p><p className="font-semibold">{o.finish}</p></div>
                                                  <div><p className="text-[9px] uppercase tracking-widest text-[#999] font-bold">Dimensions</p><p className="font-semibold">{o.dimensions}</p></div>
                                                  <div><p className="text-[9px] uppercase tracking-widest text-[#999] font-bold">Size Class</p><p className="font-semibold">{o.size}</p></div>
                                                </div>
                                                {o.budget && (
                                                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                                    <p className="text-[9px] uppercase tracking-widest text-[#999] font-bold">Client Budget</p>
                                                    <p className="font-bold text-[#2C2C2C]">₹ {parseInt(o.budget, 10).toLocaleString()}</p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            <div>
                                              <p className="text-[10px] uppercase tracking-widest text-[#999] font-bold mb-3">Customer Contact & Payment</p>
                                              <div className="bg-white border border-[#E5E5E5] p-5 rounded-sm shadow-sm flex flex-col gap-2">
                                                <p className="text-sm font-semibold">{o.customerName || o.email}</p>
                                                <p className="text-xs text-[#666]">{o.email}</p>
                                                {o.phone && <p className="text-xs text-[#8B735B] font-bold">{o.phone}</p>}
                                                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                                  <p className="text-[9px] uppercase tracking-widest text-[#999] font-bold">Advance Payment</p>
                                                  <div className="text-right">
                                                    <p className="text-sm font-bold text-[#2C2C2C]">₹ {(o.advancePayment?.amount || 0).toLocaleString()} via {o.advancePayment?.method}</p>
                                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold ${o.advancePayment?.paid ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                                        {o.advancePayment?.paid ? 'Paid' : 'Unpaid'}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Right Col: Admin Controls */}
                                          <div>
                                            <p className="text-[10px] uppercase tracking-widest text-[#999] font-bold mb-3">Admin Controls & Assignment</p>
                                            <div className="bg-white border border-[#E5E5E5] p-6 rounded-sm shadow-sm h-full flex flex-col justify-between">
                                              
                                              {/* Actions Base Structure */}
                                              <div className="space-y-6">
                                                {o.status === 'pending' && (
                                                  <div className="space-y-4">
                                                    <div>
                                                      <label className="text-[9px] uppercase tracking-widest text-[#999] font-bold mb-1.5 block">Assign Artisan</label>
                                                      <select
                                                        className="w-full text-xs box-border border border-[#D1D1D1] px-4 py-3 text-[#2C2C2C] bg-[#FAF9F6] focus:outline-none focus:border-[#8B735B] rounded-sm transition-colors"
                                                        value={o.assignedArtisanId || ''}
                                                        onChange={(e) => {
                                                          const selected = artisans.find(a => a.id === e.target.value);
                                                          setDoc(doc(db, 'customOrders', o.id), { ...o, assignedArtisanId: e.target.value, assignedArtisanName: selected?.name || '' });
                                                        }}
                                                      >
                                                        <option value="">— Select an Approved Artisan —</option>
                                                        {artisans.filter(a => a.status === 'approved').map(a => (
                                                          <option key={a.id} value={a.id}>{a.name}</option>
                                                        ))}
                                                      </select>
                                                    </div>
                                                    
                                                    <div className="flex gap-2 pt-2 border-t border-gray-50">
                                                      <button
                                                        onClick={() => {
                                                          if (!o.assignedArtisanId) { alert('Please assign an artisan first'); return; }
                                                          handleOrderStatus(o.id, 'accepted');
                                                        }}
                                                        className="flex-1 bg-[#2C2C2C] text-white py-3.5 text-[10px] uppercase tracking-widest font-bold hover:bg-[#8B735B] transition-all rounded-sm shadow-md"
                                                      >Approve & Send to Artisan</button>
                                                      <button
                                                        onClick={() => handleOrderStatus(o.id, 'rejected')}
                                                        className="flex-1 border border-red-200 text-red-600 py-3.5 text-[10px] uppercase tracking-widest font-bold hover:bg-red-50 hover:border-red-300 transition-all rounded-sm"
                                                      >Reject Commission</button>
                                                    </div>
                                                  </div>
                                                )}

                                                {o.status === 'accepted' && (
                                                  <div className="space-y-4">
                                                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-sm">
                                                      <p className="text-[10px] uppercase tracking-widest text-blue-800 font-bold mb-1">In Progress</p>
                                                      <p className="text-sm text-blue-900">Assigned to: <span className="font-bold">{o.assignedArtisanName}</span></p>
                                                    </div>
                                                    <button
                                                      onClick={() => handleOrderStatus(o.id, 'completed')}
                                                      className="w-full bg-[#2C2C2C] text-white py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-[#8B735B] transition-all rounded-sm shadow-md"
                                                    >
                                                      Finalize Commission (Mark Completed) ✓
                                                    </button>
                                                  </div>
                                                )}

                                                {o.status === 'completed' && (
                                                  <div className="p-5 bg-green-50/50 border border-green-100 rounded-sm flex items-center justify-between">
                                                    <div>
                                                      <p className="text-[10px] uppercase tracking-widest text-green-800 font-bold mb-1">Status</p>
                                                      <p className="text-sm font-bold text-green-900">Successfully Completed</p>
                                                      <p className="text-xs text-green-700 mt-1">By {o.assignedArtisanName}</p>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 border border-green-200">
                                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                    </div>
                                                  </div>
                                                )}

                                                {/* Optional Admin Note UI could go here */}
                                                {o.adminNote && (
                                                  <div className="mt-4 p-4 bg-amber-50/30 border border-amber-100 rounded-sm">
                                                    <p className="text-[10px] uppercase tracking-widest text-amber-800 font-bold mb-1">Admin History Note</p>
                                                    <p className="text-xs text-amber-900 italic">{o.adminNote}</p>
                                                  </div>
                                                )}
                                              </div>
                                              
                                              <p className="text-[9px] text-[#BBB] uppercase tracking-[0.2em] mt-8 text-center border-t border-gray-100 pt-4">
                                                Created on {new Date(o.createdAt).toLocaleString()}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* --- MASTERPIECE SALES (SHOP) TABLE --- */}
                  {(orderTypeFilter === 'All' || orderTypeFilter === 'Shop Orders') && (
                    <div className="space-y-6">
                      <h3 className="text-2xl serif italic text-[#2C2C2C]">Masterpiece Sales</h3>
                      {filteredShopOrders.length === 0 ? (
                        <div className="py-24 text-center bg-white border border-[#E5E5E5] shadow-sm rounded-sm">
                          <p className="serif text-2xl italic text-[#999]">No shop orders match this filter.</p>
                        </div>
                      ) : (
                        <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-sm overflow-hidden">
                          {/* Table Header */}
                          <div className="grid grid-cols-[1.5fr_1fr_1.5fr_1.5fr_1fr_1fr_auto] gap-4 p-4 border-b border-[#E5E5E5] bg-[#FAF9F6] text-[10px] uppercase tracking-widest font-bold text-[#999]">
                            <div>Order ID</div>
                            <div>Date</div>
                            <div>Customer</div>
                            <div>Products</div>
                            <div>Total Amount</div>
                            <div>Status</div>
                            <div className="w-10 text-center"></div>
                          </div>
                          
                          {/* Grouped Table Rows */}
                          {groupByMonth(filteredShopOrders).map(([monthYear, monthOrders]) => (
                            <div key={monthYear}>
                              {/* Sticky Month Divider */}
                              <div className="bg-gray-50 border-y border-[#E5E5E5] px-4 py-2 text-xs uppercase tracking-[0.2em] font-bold text-[#8B735B] sticky top-[73px] z-10">
                                {monthYear}
                              </div>
                              
                              {/* Individual Rows */}
                              {monthOrders.map((o: any) => {
                                const isExpanded = !!expandedOrders[o.id];
                                return (
                                  <React.Fragment key={o.id}>
                                    <div 
                                      onClick={() => toggleOrderExpansion(o.id)}
                                      className={`grid grid-cols-[1.5fr_1fr_1.5fr_1.5fr_1fr_1fr_auto] gap-4 p-4 items-center border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${isExpanded ? 'bg-[#FAF9F6]' : ''}`}
                                    >
                                      {/* Order ID */}
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor(o.status)}`} />
                                        <p className="text-[11px] uppercase tracking-widest font-bold text-[#666] truncate">{o.id}</p>
                                        <button onClick={(e: any) => { e.stopPropagation(); navigator.clipboard.writeText(o.id); alert('ID Copied!'); }} className="text-[#CCC] hover:text-[#8B735B]">
                                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                                        </button>
                                      </div>
                                      
                                      <div className="text-xs text-[#666]">{fmtDate(o.createdAt)}</div>
                                      <div className="text-sm font-medium text-[#2C2C2C] truncate">{o.customerName}</div>
                                      
                                      <div className="text-xs text-[#666] truncate group relative">
                                        <span className="truncate block font-medium">
                                          {o.items.length} {o.items.length === 1 ? 'Item' : 'Items'} <span className="font-normal text-[#999]">— {o.items[0]?.name}</span>
                                        </span>
                                      </div>

                                      <div className="text-sm font-bold text-[#2C2C2C]">
                                        ₹ {o.totalAmount?.toLocaleString() || 0}
                                      </div>

                                      <div>
                                      <span className={`px-2.5 py-1 text-[9px] uppercase tracking-widest font-bold border rounded-full ${statusStyle(o.status)}`}>
                                          {o.status}
                                        </span>
                                      </div>

                                      <div className="w-10 text-center">
                                       <button className={`text-[#BBB] transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[#8B735B]' : 'hover:text-[#2C2C2C]'}`}>
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
                                        </button>
                                      </div>
                                    </div>

                                    {/* Expanded Detail Panel */}
                                    {isExpanded && (
                                      <div className="col-span-full border-b border-gray-200 bg-[#FAF9F6] p-0 overflow-hidden animate-in slide-in-from-top-2 duration-300">
                                        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
                                          {/* Left Col: Order Items & Shipping */}
                                          <div className="space-y-8">
                                            <div>
                                              <p className="text-[10px] uppercase tracking-widest text-[#999] font-bold mb-3 border-b border-[#E5E5E5] pb-2">Purchased Items</p>
                                              <div className="bg-white border border-[#E5E5E5] p-2 rounded-sm shadow-sm space-y-1">
                                                {o.items.map((item: any, i: number) => (
                                                  <div key={i} className="flex items-center gap-4 p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                                    <img src={item.image} className="w-12 h-12 object-cover rounded border border-[#E5E5E5]" alt="" />
                                                    <div className="flex-grow">
                                                      <p className="text-xs font-bold text-[#2C2C2C]">{item.name}</p>
                                                      <p className="text-[10px] text-[#8B735B] font-semibold mt-0.5">{item.artisanName}</p>
                                                      <p className="text-[10px] text-[#999] mt-0.5">Qty: {item.quantity} • {item.size} • {item.finish}</p>
                                                    </div>
                                                    <p className="text-sm font-bold text-[#2C2C2C]">₹ {(item.price * item.quantity).toLocaleString()}</p>
                                                  </div>
                                                ))}
                                                <div className="p-4 bg-[#FAF9F6] rounded flex items-center justify-between border-t border-[#E5E5E5]">
                                                  <p className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Total Settled Amount</p>
                                                  <p className="text-lg font-bold text-[#2C2C2C]">₹ {o.totalAmount?.toLocaleString()}</p>
                                                </div>
                                              </div>
                                            </div>

                                            <div>
                                              <p className="text-[10px] uppercase tracking-widest text-[#999] font-bold mb-3">Shipping Profile</p>
                                              <div className="bg-white border border-[#E5E5E5] p-5 rounded-sm shadow-sm flex flex-col gap-2">
                                                <p className="text-sm font-semibold">{o.customerName}</p>
                                                <p className="text-xs font-medium text-[#666]">{o.customerEmail}</p>
                                                {o.customerPhone && <p className="text-xs font-bold text-[#8B735B] border-b border-gray-100 pb-2">{o.customerPhone}</p>}
                                                
                                                <p className="text-[9px] uppercase tracking-widest text-[#999] font-bold mt-2">Delivery Address</p>
                                                <p className="text-xs text-[#2C2C2C] font-light leading-relaxed">{o.shippingAddress}</p>
                                                <p className="text-xs font-bold text-[#2C2C2C]">{o.city}, {o.pincode}</p>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Right Col: Admin Controls & Fulfillment */}
                                          <div className="flex flex-col h-full">
                                            <p className="text-[10px] uppercase tracking-widest text-[#999] font-bold mb-3 border-b border-[#E5E5E5] pb-2">Logistics & Fulfillment</p>
                                            <div className="bg-white border border-[#E5E5E5] p-6 rounded-sm shadow-sm flex-grow flex flex-col justify-between">
                                              
                                              <div className="space-y-6">
                                                
                                                {o.status === 'pending' && (
                                                  <div className="text-center p-6 border-2 border-dashed border-amber-200 bg-amber-50/30 rounded-sm">
                                                    <p className="text-xs text-amber-800 font-bold mb-3">Payments check required</p>
                                                    <div className="flex justify-center gap-3">
                                                      <button 
                                                        onClick={() => setDoc(doc(db, 'productOrders', o.id), { ...o, status: 'confirmed' })}
                                                        className="bg-[#2C2C2C] px-6 py-2.5 text-white text-[10px] uppercase tracking-widest font-bold rounded-sm shadow-sm hover:bg-[#8B735B] transition-colors"
                                                      >Confirm Order Payment</button>
                                                      <button 
                                                        onClick={() => setDoc(doc(db, 'productOrders', o.id), { ...o, status: 'cancelled' })} 
                                                        className="border border-red-200 px-6 py-2.5 text-red-600 text-[10px] uppercase tracking-widest font-bold rounded-sm hover:bg-red-50 transition-colors"
                                                      >Cancel</button>
                                                    </div>
                                                  </div>
                                                )}

                                                {o.status === 'confirmed' && (
                                                  <div className="bg-blue-50/30 border border-blue-100 p-5 rounded-sm">
                                                    <p className="text-[10px] uppercase tracking-widest text-blue-800 font-bold mb-3">Order Confirmed. Ready for Shipping.</p>
                                                    <div className="space-y-3">
                                                      <label className="text-[9px] uppercase tracking-widest text-[#666] font-bold">Delhivery AWB Tracking Number</label>
                                                      <div className="flex gap-2">
                                                        <input
                                                          type="text"
                                                          placeholder="Scan or enter 13-digit AWB"
                                                          value={awbInputs[o.id] || ''}
                                                          onChange={e => setAwbInputs(p => ({ ...p, [o.id]: e.target.value }))}
                                                          className="flex-1 border border-[#D1D1D1] px-4 py-3 text-sm focus:outline-none focus:border-[#8B735B] font-mono rounded-sm shadow-inner"
                                                        />
                                                        <button
                                                          disabled={awbSaving[o.id] || !awbInputs[o.id]?.trim()}
                                                          onClick={async () => {
                                                            const awb = awbInputs[o.id]?.trim();
                                                            if (!awb) return;
                                                            setAwbSaving(p => ({ ...p, [o.id]: true }));
                                                            const trackingUrl = `https://www.delhivery.com/track/package/${awb}`;
                                                            await setDoc(doc(db, 'productOrders', o.id), {
                                                              ...o,
                                                              status: 'shipped',
                                                              awb,
                                                              trackingUrl,
                                                              shippingStatus: 'In Transit',
                                                              shippedAt: new Date().toISOString()
                                                            });
                                                            setAwbInputs(p => ({ ...p, [o.id]: '' }));
                                                            setAwbSaving(p => ({ ...p, [o.id]: false }));
                                                          }}
                                                          className="text-[10px] uppercase tracking-widest bg-[#2C2C2C] text-white px-6 py-3 hover:bg-[#8B735B] font-bold rounded-sm disabled:opacity-50 transition-colors"
                                                        >
                                                          {awbSaving[o.id] ? 'Saving...' : 'Mark Shipped'}
                                                        </button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}

                                                {o.status === 'shipped' && (
                                                  <div className="space-y-4">
                                                    <div className="bg-[#FAF9F6] border border-[#E5E5E5] p-5 rounded-sm flex items-center justify-between shadow-sm">
                                                      <div>
                                                        <p className="text-[9px] uppercase tracking-widest text-[#999] font-bold mb-1">Tracking Number</p>
                                                        <p className="text-sm font-mono font-bold text-[#8B735B]">{o.awb}</p>
                                                      </div>
                                                      <a href={o.trackingUrl || `https://www.delhivery.com/track/package/${o.awb}`} target="_blank" rel="noreferrer" 
                                                        className="text-[10px] uppercase tracking-widest bg-white border border-[#E5E5E5] text-[#2C2C2C] px-4 py-2 hover:border-[#8B735B] hover:text-[#8B735B] font-bold rounded-sm transition-colors flex items-center gap-2 shadow-sm">
                                                        Track <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                      </a>
                                                    </div>
                                                    
                                                    <button
                                                      onClick={() => setDoc(doc(db, 'productOrders', o.id), { ...o, status: 'delivered', shippingStatus: 'Delivered', deliveredAt: new Date().toISOString() })}
                                                      className="w-full text-[10px] uppercase tracking-widest bg-green-600 text-white py-4 hover:bg-green-700 font-bold rounded-sm shadow-md transition-colors"
                                                    >
                                                      Confirm Delivery (Mark Delivered) ✓
                                                    </button>
                                                  </div>
                                                )}

                                                {o.status === 'delivered' && (
                                                  <div className="p-5 bg-green-50/50 border border-green-100 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div>
                                                      <p className="text-[10px] uppercase tracking-widest text-green-800 font-bold mb-1">Final Status</p>
                                                      <p className="text-sm font-bold text-green-900">Successfully Delivered</p>
                                                    </div>
                                                    {o.awb && (
                                                      <div className="text-right">
                                                        <p className="text-[9px] uppercase tracking-widest text-green-700 font-bold">AWB Tracking</p>
                                                        <p className="text-xs font-mono font-bold text-green-800">{o.awb}</p>
                                                      </div>
                                                    )}
                                                  </div>
                                                )}

                                                {/* Meta Info */}
                                                <div className="border-t border-gray-100 pt-4 space-y-2 mt-auto">
                                                  <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-sm border border-gray-100">
                                                    <p className="text-[9px] uppercase tracking-widest text-[#999] font-bold">Payment Status</p>
                                                    <div className="flex items-center gap-1.5">
                                                      <span className="text-[10px] font-mono text-[#2C2C2C]">{o.paymentId || 'Prepaid'}</span>
                                                      <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                                                        <svg className="w-2.5 h-2.5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                              
                                              <p className="text-[9px] text-[#BBB] uppercase tracking-[0.2em] mt-6 text-center">
                                                Order placed on {new Date(o.createdAt).toLocaleString()}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </React.Fragment>
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

          </div>
        );
      })()}


      {/* Workshop tab — includes Workshops sub-tab and Group Booking sub-tab */}
      {activeTab === 'workshops' && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-[#E5E5E5] sticky top-0 bg-[#FAF9F6] z-20 pt-2 -mt-2 mb-6">
          
          {/* Type Filters (Pills) — same layout as Orders tab */}
          <div className="flex gap-2 bg-white p-1 rounded-md border border-[#E5E5E5] shadow-sm">
            {[
              { id: 'Workshops', label: 'Workshops', count: pendingWorkshops.length + activeWorkshops.length + classBookings.length, new: pendingWorkshops.length + classBookings.filter(b => b.status === 'confirmed').length },
              { id: 'Group Booking', label: 'Group Booking', count: institutionRequests.length, new: newInstitutionRequests.length },
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => setWorkshopTabFilter(sub.id)}
                className={`relative px-6 py-2.5 text-[11px] uppercase tracking-widest font-bold rounded-sm transition-all duration-300 flex flex-col items-center justify-center min-w-[120px] ${
                  workshopTabFilter === sub.id 
                    ? 'bg-[#2C2C2C] text-white shadow-md' 
                    : 'text-[#999] hover:bg-gray-50 hover:text-[#2C2C2C]'
                }`}
              >
                <span>{sub.label}</span>
                <span className={`text-[9px] mt-0.5 font-normal ${workshopTabFilter === sub.id ? 'text-gray-300' : 'text-[#BBB]'}`}>
                  {sub.count} Total
                </span>
                {sub.new > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] text-white shadow-sm ring-2 ring-white font-bold animate-in zoom-in">
                    {sub.new}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Mode Filter Dropdown — only when Workshops sub-tab is active */}
          {workshopTabFilter === 'Workshops' && (
            <div className="relative">
              <button
                onClick={() => setShowWorkshopDropdown(!showWorkshopDropdown)}
                className="bg-white border border-[#E5E5E5] px-5 py-3 rounded-md flex items-center gap-3 text-[11px] uppercase tracking-widest font-bold text-[#666] hover:text-[#2C2C2C] hover:border-[#8B735B] transition-all shadow-sm min-w-[220px] justify-between"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-[#8B735B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                  {workshopModeFilter === 'All' ? 'All Modes' : workshopModeFilter}
                </span>
                <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${showWorkshopDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              
              {showWorkshopDropdown && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-[#E5E5E5] shadow-xl rounded-md z-50 min-w-full py-2 animate-in fade-in slide-in-from-top-2">
                  {['All', ...new Set(workshops.map(w => w.mode).filter(Boolean))].sort().map(mode => (
                    <button
                      key={mode}
                      onClick={() => { setWorkshopModeFilter(mode); setShowWorkshopDropdown(false); }}
                      className={`w-full text-left px-5 py-2.5 text-[11px] uppercase tracking-widest transition-all ${
                        workshopModeFilter === mode ? 'bg-[#FAF9F6] text-[#8B735B] font-bold border-l-2 border-[#8B735B]' : 'text-[#666] hover:bg-gray-50 border-l-2 border-transparent hover:text-[#2C2C2C]'
                      }`}
                    >
                      {mode === 'All' ? 'All Modes' : mode}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {activeTab === 'workshops' && (() => {
        if (workshopTabFilter === 'Group Booking') {
          return null; // Group Booking content rendered separately below
        }
        const modeFn = (w: Workshop) => workshopModeFilter === 'All' || w.mode === workshopModeFilter;
        const filteredPending = pendingWorkshops.filter(modeFn);
        const filteredActive = activeWorkshops.filter(modeFn);

        const renderWorkshopCard = (w: Workshop, isPending: boolean) => {
          const isExpanded = expandedWorkshops[w.id];
          return (
            <div key={w.id} className={`bg-white border transition-all duration-300 ${isExpanded ? 'border-[#8B735B] shadow-md' : 'border-[#E5E5E5] hover:border-[#8B735B]'}`}>
              <div
                className="p-5 flex flex-col md:flex-row items-start md:items-center gap-6 cursor-pointer"
                onClick={() => toggleWorkshopExpansion(w.id)}
              >
                <div className="relative w-16 h-16 flex-shrink-0">
                  <img src={w.image} className="w-full h-full object-cover rounded shadow-sm" alt="" />
                  {isPending && (
                    <div className="absolute -top-1 -left-1">
                      <span className="flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-grow">
                  <h3 className="text-base font-medium text-[#2C2C2C]">{w.title}</h3>
                  <p className="text-[10px] text-[#999] uppercase tracking-[0.2em] mt-0.5">By {w.artisanName} • {w.mode} • {w.skillLevel}</p>
                  <div className="flex gap-4 mt-2">
                    <p className="text-xs text-[#666]">₹{w.price.toLocaleString()}</p>
                    <p className="text-xs text-[#BDBDBD]">|</p>
                    <p className="text-xs text-[#666]">{new Date(w.date).toDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full ${isPending ? 'bg-amber-50 text-amber-700 animate-status-flash border border-amber-200' : 'bg-green-50 text-green-700'}`}>
                    {isPending ? 'Pending' : 'Live'}
                  </div>
                  <div className={`p-1 rounded-full transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-[#8B735B] text-white' : 'text-[#BBB]'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-8 border-t border-[#F0F0F0] animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
                    <div>
                      <h4 className="text-[9px] uppercase tracking-widest text-[#999] font-bold mb-2">Curriculum Header</h4>
                      <p className="text-sm text-[#4A4A4A] leading-relaxed font-light mb-4">{w.description}</p>

                      <div className="space-y-4">
                        <div>
                          <h5 className="text-[9px] uppercase tracking-widest text-[#BBB] mb-1">What students learn</h5>
                          <p className="text-xs text-[#666] italic">"{w.curriculum || 'Standard artisan-led syllabus provided.'}"</p>
                        </div>
                        <div>
                          <h5 className="text-[9px] uppercase tracking-widest text-[#BBB] mb-1">Requirements</h5>
                          <p className="text-xs text-[#666]">{w.requirements || 'No special requirements listed.'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#FAF9F6] p-6 rounded-lg space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-[#AAA] mb-1">Max Students</p>
                          <p className="text-sm font-medium">{w.maxStudents} Seats</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-[#AAA] mb-1">Duration</p>
                          <p className="text-sm font-medium">{w.duration}</p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[#EEE] flex flex-wrap gap-3">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => handleWorkshopStatus(w.id, 'approved')}
                              className="bg-green-600 text-white px-6 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-green-700 transition-all rounded shadow-sm"
                            >
                              Approve Masterclass
                            </button>
                            <button
                              onClick={() => handleWorkshopStatus(w.id, 'rejected')}
                              className="bg-white border border-red-200 text-red-500 px-6 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-red-50 transition-all rounded"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleWorkshopStatus(w.id, 'rejected')}
                            className="text-[10px] uppercase tracking-widest text-red-400 hover:text-red-600 font-bold transition-colors"
                          >
                            Remove from Platform
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        };

        return (
          <div className="space-y-12">
            {/* Pending Workshops Section */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xl font-medium">Under Review</h2>
                <span className="bg-amber-100 text-amber-700 text-[10px] px-3 py-1 rounded-full font-bold animate-status-flash">{filteredPending.length} NEW</span>
              </div>
              {filteredPending.length === 0 ? (
                <div className="py-20 text-center bg-gray-50/30 border border-dashed border-gray-100 rounded-xl">
                  <p className="serif italic text-[#BBB]">All workshop proposals have been reviewed.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredPending.map(w => renderWorkshopCard(w, true))}
                </div>
              )}
            </div>

            <hr className="border-[#F0F0F0]" />

            {/* Live Workshops Section */}
            <div>
              <h2 className="text-xl font-medium mb-6">Live Academy ({filteredActive.length})</h2>
              {filteredActive.length === 0 ? (
                <div className="py-20 text-center bg-gray-50/30 border border-dashed border-gray-100 rounded-xl">
                  <p className="serif italic text-[#BBB]">No active classes in this category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredActive.map(w => renderWorkshopCard(w, false))}
                </div>
              )}
            </div>

            {/* ── Workshop Bookings Section ─────────────────────────────── */}
            <hr className="border-[#F0F0F0] mt-4" />
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-medium">Workshop Bookings ({classBookings.length})</h2>
                <div className="flex gap-4 text-[10px] uppercase tracking-widest text-[#999]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full"></span>Confirmed: {classBookings.filter(b => b.status === 'confirmed').length}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span>Completed: {classBookings.filter(b => b.status === 'completed').length}</span>
                  <span className="text-[#8B735B] font-bold">Revenue: ₹{classBookings.filter(b => b.paymentStatus === 'completed').reduce((s, b) => s + b.amount, 0).toLocaleString()}</span>
                </div>
              </div>

              {classBookings.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-[#E5E5E5] rounded-xl">
                  <p className="serif italic text-xl text-[#CCC]">No bookings yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Group by workshop */}
                  {Object.entries(
                    classBookings.reduce((acc: Record<string, { title: string; artisan: string; bookings: any[] }>, b) => {
                      if (!acc[b.workshopId]) acc[b.workshopId] = { title: b.workshopTitle, artisan: b.artisanName || '', bookings: [] };
                      acc[b.workshopId].bookings.push(b);
                      return acc;
                    }, {})
                  ).map(([wId, { title, artisan, bookings: wBookings }]) => {
                    const workshop = workshops.find(w => w.id === wId);
                    const confirmedCount = wBookings.filter(b => b.status === 'confirmed').length;
                    return (
                      <div key={wId} className="bg-white border border-[#E5E5E5] overflow-hidden shadow-sm">
                        {/* Workshop header */}
                        <div className="p-4 bg-[#FAF9F6] border-b border-[#F0F0F0] flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {workshop?.image && <img src={workshop.image} className="w-10 h-10 object-cover rounded flex-shrink-0" alt="" />}
                            <div>
                              <h3 className="text-sm font-bold">{title}</h3>
                              <p className="text-[10px] text-[#999] uppercase tracking-widest">By {artisan} · {workshop?.mode} · {workshop ? new Date(workshop.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-[10px] uppercase tracking-widest text-[#999]">{wBookings.length}/{workshop?.maxStudents || '?'} seats</span>
                            {confirmedCount > 0 && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Mark all ${confirmedCount} students as reminded for "${title}"?`)) {
                                    wBookings.filter(b => b.status === 'confirmed').forEach(b => {
                                      setDoc(doc(db, 'classBookings', b.id), { ...b, status: 'reminded', reminderSent: true });
                                    });
                                  }
                                }}
                                className="text-[9px] uppercase tracking-widest bg-amber-500 text-white px-4 py-2 hover:bg-amber-600 font-bold transition-all"
                              >
                                Send Reminder ({confirmedCount})
                              </button>
                            )}
                            {workshop?.mode === 'online' && (
                              <button
                                onClick={() => {
                                  const link = window.prompt(`Zoom/Meet link for "${title}":`);
                                  if (link && workshop) setDoc(doc(db, 'workshops', workshop.id), { ...workshop, zoomLink: link });
                                }}
                                className="text-[9px] uppercase tracking-widest bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 font-bold transition-all"
                              >
                                {workshop?.zoomLink ? 'Update Zoom' : '+ Zoom Link'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Students */}
                        <div className="divide-y divide-[#F5F5F5]">
                          {wBookings.map(b => (
                            <div key={b.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-[#FAF9F6] transition-colors">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-8 h-8 rounded-full bg-[#8B735B]/10 flex items-center justify-center text-[#8B735B] font-serif italic text-sm flex-shrink-0">
                                  {b.customerName.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{b.customerName}</p>
                                  <p className="text-[10px] text-[#999]">{b.customerEmail} · {b.customerPhone}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-xs font-bold text-green-600">₹{b.amount.toLocaleString()}</span>
                                <span className={`text-[8px] uppercase tracking-widest px-2 py-1 rounded font-bold ${
                                  b.status === 'confirmed' ? 'bg-blue-50 text-blue-700' :
                                  b.status === 'reminded' ? 'bg-amber-50 text-amber-700' :
                                  b.status === 'attended' || b.status === 'completed' ? 'bg-green-50 text-green-700' :
                                  b.status === 'no-show' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'
                                }`}>{b.status}</span>
                                <div className="flex gap-1">
                                  {(b.status === 'confirmed' || b.status === 'reminded') && (
                                    <>
                                      <button onClick={() => setDoc(doc(db, 'classBookings', b.id), { ...b, status: 'attended', attendanceMarked: true })} className="text-[8px] uppercase tracking-widest bg-green-600 text-white px-2 py-1 hover:bg-green-700 font-bold">Attended</button>
                                      <button onClick={() => setDoc(doc(db, 'classBookings', b.id), { ...b, status: 'no-show' })} className="text-[8px] uppercase tracking-widest border border-red-200 text-red-500 px-2 py-1 hover:bg-red-50">No Show</button>
                                    </>
                                  )}
                                  {b.status === 'attended' && (
                                    <button onClick={() => setDoc(doc(db, 'classBookings', b.id), { ...b, status: 'completed', reviewRequested: true })} className="text-[8px] uppercase tracking-widest bg-[#8B735B] text-white px-2 py-1 font-bold">Complete</button>
                                  )}
                                  <a href={`mailto:${b.customerEmail}?subject=Your booking for ${b.workshopTitle}&body=Dear ${b.customerName},%0A%0A`} className="text-[8px] uppercase tracking-widest border border-[#E5E5E5] px-2 py-1 hover:border-[#8B735B] transition-all">Email</a>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}



      {activeTab === 'workshops' && workshopTabFilter === 'Group Booking' && (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-medium">Group & Institutional Requests ({institutionRequests.length})</h2>
            <div className="flex gap-3 text-[10px] uppercase tracking-widest text-[#999]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> New: {newInstitutionRequests.length}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Confirmed: {institutionRequests.filter(r => r.status === 'confirmed').length}</span>
            </div>
          </div>
          {institutionRequests.length === 0 ? (
            <p className="text-center py-20 text-[#999] italic serif text-xl">No group workshop requests yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {institutionRequests.map(req => (
                <div key={req.id} className="bg-white p-6 border border-[#E5E5E5] shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl serif">{req.institutionName}</h3>
                      <p className="text-xs text-[#999] uppercase tracking-widest">{req.contactPerson} · {req.email} {req.phone ? `· ${req.phone}` : ''}</p>
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded font-bold ${req.status === 'new' ? 'bg-blue-50 text-blue-700' :
                      req.status === 'contacted' ? 'bg-amber-50 text-amber-700' :
                        req.status === 'confirmed' ? 'bg-green-50 text-green-700' :
                          'bg-red-50 text-red-700'
                      }`}>{req.status}</span>
                  </div>
                  <div className="flex gap-6 text-[10px] uppercase tracking-widest text-[#999] mb-3">
                    <span>Type: <span className="text-[#2C2C2C] capitalize">{req.type}</span></span>
                    {req.groupSize && <span>Group Size: <span className="text-[#2C2C2C]">{req.groupSize}</span></span>}
                    {req.preferredDate && <span>Date: <span className="text-[#2C2C2C]">{new Date(req.preferredDate).toLocaleDateString()}</span></span>}
                  </div>
                  {req.message && <p className="text-sm font-light text-[#4A4A4A] mb-4">"{req.message}"</p>}
                  <div className="flex gap-3 pt-3 border-t border-[#F0F0F0]">
                    {req.status === 'new' && (
                      <button onClick={() => setDoc(doc(db, 'institutionRequests', req.id), { ...req, status: 'contacted' })}
                        className="text-[10px] uppercase tracking-widest bg-[#2C2C2C] text-white px-4 py-2 hover:bg-[#4A4A4A] transition-all">
                        Mark Contacted
                      </button>
                    )}
                    {req.status === 'contacted' && (
                      <button onClick={() => setDoc(doc(db, 'institutionRequests', req.id), { ...req, status: 'confirmed' })}
                        className="text-[10px] uppercase tracking-widest bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-all">
                        Confirm Booking
                      </button>
                    )}
                    {(req.status === 'new' || req.status === 'contacted') && (
                      <button onClick={() => setDoc(doc(db, 'institutionRequests', req.id), { ...req, status: 'declined' })}
                        className="text-[10px] uppercase tracking-widest border border-red-200 text-red-500 px-4 py-2 hover:bg-red-50 transition-all">
                        Decline
                      </button>
                    )}
                    <a href={`mailto:${req.email}?subject=Kala Prayag Group Workshop — ${req.institutionName}&body=Dear ${req.contactPerson},%0A%0AThank you for your interest in a group workshop with Kala Prayag.%0A%0A`}
                      className="text-[10px] uppercase tracking-widest border border-[#D1D1D1] px-4 py-2 hover:border-[#2C2C2C] transition-all">
                      Email
                    </a>
                  </div>
                  <p className="text-[10px] text-[#CCC] mt-3">{new Date(req.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'moderation' && (
        <div className="space-y-8">
          <h2 className="text-xl font-medium flex items-center gap-3">Review Moderation <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded animate-status-flash">{pendingReviews.length} NEW</span></h2>
          {pendingReviews.map(r => (
            <div key={r.id} className="bg-white p-6 border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between">
                <div><p className="text-sm font-bold">{r.authorName}</p><p className="text-[10px] text-gray-400">{r.date}</p></div>
                <div className="flex text-amber-500">
                  {[...Array(r.rating)].map((_, i) => <svg key={i} className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>)}
                </div>
              </div>
              <p className="text-sm font-light italic">"{r.comment}"</p>
              <div className="flex gap-4 pt-2">
                <button onClick={() => setDoc(doc(db, 'reviews', r.id), { ...r, status: 'approved' })} className="text-[10px] uppercase tracking-widest text-green-600 font-bold">Approve Review</button>
                <button onClick={() => deleteDoc(doc(db, 'reviews', r.id))} className="text-[10px] uppercase tracking-widest text-red-600 font-bold">Discard</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Craft type filter — only on artisans tab */}
      {activeTab === 'manage-artisans' && (
        <div className="flex justify-end mb-6 relative">
          <button
            onClick={() => setShowCraftDropdown(!showCraftDropdown)}
            className="text-[10px] uppercase tracking-widest border border-[#E5E5E5] px-5 py-2 rounded-md flex items-center gap-2 hover:border-[#2C2C2C] transition-all bg-white"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            {artisanCraftFilter === 'All' ? 'All Crafts' : artisanCraftFilter}
            <svg className={`w-3 h-3 transition-transform ${showCraftDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {showCraftDropdown && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-[#E5E5E5] shadow-lg rounded-md z-50 min-w-[180px] py-1">
              {['All', ...new Set([...artisans, ...applications].map(a => a.craftType).filter(Boolean))].sort().map(craft => (
                <button
                  key={craft}
                  onClick={() => { setArtisanCraftFilter(craft); setShowCraftDropdown(false); }}
                  className={`w-full text-left px-4 py-2 text-[11px] uppercase tracking-widest hover:bg-[#F5F5F5] transition-all ${artisanCraftFilter === craft ? 'text-[#2C2C2C] font-bold bg-[#F5F5F5]' : 'text-[#999]'
                    }`}
                >
                  {craft === 'All' ? 'All Crafts' : craft}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab === 'manage-artisans' && (() => {
        const craftFn = (a: { craftType: string }) => artisanCraftFilter === 'All' || a.craftType === artisanCraftFilter;
        const filteredApps = applications.filter(craftFn);
        const filteredArtisans = artisans.filter(a => a.status === 'approved').filter(craftFn);
        return (
          <div className="space-y-8">
            {/* Pending Applications */}
            {filteredApps.length > 0 && (
              <>
                <h2 className="text-xl font-medium flex items-center gap-3">New Applications <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded animate-status-flash">{filteredApps.length} NEW</span></h2>
                {filteredApps.map(app => (
                  <div key={app.id} className="bg-white p-8 border border-amber-200 shadow-sm flex flex-col md:flex-row gap-8 bg-amber-50/10 animate-status-flash transition-all">
                    <img src={app.profilePhoto} className="w-32 h-32 object-cover rounded" alt="" />
                    <div className="flex-grow">
                      <h3 className="text-2xl serif">{app.brandName || app.name}</h3>
                      <p className="text-[10px] uppercase tracking-widest text-[#8B735B]">{app.craftType} • {app.location}</p>
                      <p className="text-sm font-light mt-4 leading-relaxed">"{app.bio}"</p>
                      <div className="mt-4 flex gap-2">
                        {app.portfolioImages.slice(0, 3).map((img, i) => <img key={i} src={img} className="w-12 h-12 object-cover rounded" />)}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 justify-center">
                      <button onClick={() => handleApproveArtisan(app)} className="bg-[#2C2C2C] text-white px-6 py-2 text-[10px] uppercase tracking-widest font-bold">Approve</button>
                      <button onClick={() => deleteDoc(doc(db, 'applications', app.id))} className="border border-red-200 text-red-600 px-6 py-2 text-[10px] uppercase tracking-widest">Reject</button>
                    </div>
                  </div>
                ))}
                <hr className="border-[#E5E5E5]" />
              </>
            )}

            {/* Approved Artisans */}
            <h2 className="text-xl font-medium">Approved Artisans ({filteredArtisans.length})</h2>
            {filteredArtisans.length === 0 ? (
              <p className="text-center py-20 text-[#999] italic serif text-xl">No artisans in this craft.</p>
            ) : (
              filteredArtisans.map(a => (
                <div key={a.id} className="bg-white p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                  <img src={a.profilePhoto} className="w-20 h-20 object-cover rounded-full border border-gray-100 flex-shrink-0" alt={a.name} />
                  <div className="flex-grow">
                    <h3 className="text-xl serif">{a.brandName || a.name}</h3>
                    <p className="text-[10px] uppercase tracking-widest text-[#8B735B] mt-1">{a.craftType} • {a.location}</p>
                    <p className="text-sm font-light text-[#666] mt-2 line-clamp-2">{a.bio}</p>
                    {a.portfolioImages.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {a.portfolioImages.slice(0, 5).map((img, i) => (
                          <img key={i} src={img} className="w-12 h-12 object-cover rounded" alt="" />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setEditingArtisan({ ...a })}
                      className="text-[10px] uppercase tracking-widest border border-[#2C2C2C] px-4 py-2 hover:bg-[#2C2C2C] hover:text-white transition-all"
                    >Edit Profile</button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Remove ${a.brandName || a.name} from Kala Prayag? This cannot be undone.`)) {
                          deleteDoc(doc(db, 'artisans', a.id)).catch(e => alert('Error: ' + e.message));
                        }
                      }}
                      className="text-[10px] uppercase tracking-widest border border-red-200 text-red-500 px-4 py-2 hover:bg-red-50 transition-all"
                    >Remove</button>
                  </div>
                </div>
              ))
            )}

            {/* Edit Artisan Modal */}
            {editingArtisan && (
              <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" onClick={() => setEditingArtisan(null)}>
                <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl serif">Edit Artisan Profile</h2>
                    <button onClick={() => setEditingArtisan(null)} className="text-[#999] hover:text-[#2C2C2C] text-xl">✕</button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-2">Name</label>
                      <input value={editingArtisan.name} onChange={e => setEditingArtisan(p => p ? { ...p, name: e.target.value } : p)} className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#8B735B]" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-2">Brand Name</label>
                      <input value={editingArtisan.brandName || ''} onChange={e => setEditingArtisan(p => p ? { ...p, brandName: e.target.value } : p)} className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#8B735B]" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-2">Bio</label>
                      <textarea rows={3} value={editingArtisan.bio} onChange={e => setEditingArtisan(p => p ? { ...p, bio: e.target.value } : p)} className="w-full border border-gray-200 p-3 text-sm resize-none focus:outline-none focus:border-[#8B735B]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-2">Craft Type</label>
                        <input value={editingArtisan.craftType} onChange={e => setEditingArtisan(p => p ? { ...p, craftType: e.target.value } : p)} className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#8B735B]" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-2">Location</label>
                        <input value={editingArtisan.location} onChange={e => setEditingArtisan(p => p ? { ...p, location: e.target.value } : p)} className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#8B735B]" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-2">Rating (0–5)</label>
                        <input type="number" min="0" max="5" step="0.1" value={editingArtisan.rating || 0} onChange={e => setEditingArtisan(p => p ? { ...p, rating: parseFloat(e.target.value) } : p)} className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#8B735B]" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-[#999] block mb-2">Status</label>
                        <select value={editingArtisan.status} onChange={e => setEditingArtisan(p => p ? { ...p, status: e.target.value as any } : p)} className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#8B735B]">
                          <option value="approved">Approved</option>
                          <option value="pending">Pending</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                      <button onClick={() => setEditingArtisan(null)} className="text-[10px] uppercase tracking-widest border border-gray-200 px-6 py-2 hover:bg-gray-50">Cancel</button>
                      <button onClick={() => { setDoc(doc(db, 'artisans', editingArtisan.id), editingArtisan); setEditingArtisan(null); }} className="text-[10px] uppercase tracking-widest bg-[#2C2C2C] text-white px-6 py-2 hover:bg-[#4A4A4A] transition-all">Save Changes</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {activeTab === 'invoices' && (() => {
        const filteredInvoices = invoices.filter(inv => {
          const matchesType = invoiceTypeFilter === 'All' || inv.orderType === invoiceTypeFilter.toLowerCase();
          const matchesStatus = invoiceStatusFilter === 'All' || inv.payment.status === invoiceStatusFilter.toLowerCase();
          const matchesSearch = inv.customer.name.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
            inv.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase());
          return matchesType && matchesStatus && matchesSearch;
        });

        const totalRevenue = invoices.filter(i => i.payment.status === 'paid').reduce((sum, i) => sum + i.totalAmount, 0);
        const pendingRevenue = invoices.filter(i => i.payment.status === 'pending' || i.payment.status === 'partial').reduce((sum, i) => sum + (i.totalAmount - i.payment.paidAmount), 0);

        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 border border-[#E5E5E5] rounded-xl shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-[#999] mb-1">Total Collected</p>
                <p className="text-3xl serif text-[#2C2C2C]">₹ {totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 border border-[#E5E5E5] rounded-xl shadow-sm border-l-4 border-l-[#8B735B]">
                <p className="text-[10px] uppercase tracking-widest text-[#8B735B] mb-1">Pending Amount</p>
                <p className="text-3xl serif text-[#2C2C2C]">₹ {pendingRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 border border-[#E5E5E5] rounded-xl shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-[#999] mb-1">Invoice Count</p>
                <p className="text-3xl serif text-[#2C2C2C] font-light">{invoices.length}</p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-5 flex flex-wrap gap-4 items-center justify-between border border-[#E5E5E5] rounded-xl shadow-sm">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search customer or #KP-INV..."
                    className="bg-[#FAF9F6] border border-[#E5E5E5] pl-10 pr-4 py-2.5 text-xs rounded-md w-72 focus:outline-none focus:ring-1 focus:ring-[#8B735B] transition-all"
                    value={invoiceSearch}
                    onChange={e => setInvoiceSearch(e.target.value)}
                  />
                  <svg className="w-4 h-4 text-[#CCC] absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <select
                  className="bg-[#FAF9F6] border border-[#E5E5E5] px-4 py-2.5 text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-[#8B735B]"
                  value={invoiceTypeFilter}
                  onChange={e => setInvoiceTypeFilter(e.target.value)}
                >
                  <option value="All">All Types</option>
                  <option value="Shop">Shop Orders</option>
                  <option value="Workshop">Workshops</option>
                  <option value="Custom">Custom Studio</option>
                </select>
                <select
                  className="bg-[#FAF9F6] border border-[#E5E5E5] px-4 py-2.5 text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-[#8B735B]"
                  value={invoiceStatusFilter}
                  onChange={e => setInvoiceStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Paid">Paid Only</option>
                  <option value="Pending">Pending Only</option>
                  <option value="Partial">Partial Payments</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-[#E5E5E5] text-[10px] uppercase tracking-widest text-[#999]">
                    <th className="px-6 py-5 font-bold">Ref #</th>
                    <th className="px-6 py-5 font-bold">Issued Date</th>
                    <th className="px-6 py-5 font-bold">Client</th>
                    <th className="px-6 py-5 font-bold">Channel</th>
                    <th className="px-6 py-5 font-bold text-right">Total Amount</th>
                    <th className="px-6 py-5 font-bold text-center">Payment Status</th>
                    <th className="px-6 py-5 font-bold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-[#FAF9F6]/50 transition-colors group">
                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-[#2C2C2C]">{inv.invoiceNumber}</p>
                        <p className="text-[9px] text-[#BBB] uppercase tracking-tighter">REF: {inv.orderId}</p>
                      </td>
                      <td className="px-6 py-5 text-xs text-[#666]">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-semibold">{inv.customer.name}</p>
                        <p className="text-[10px] text-[#999]">{inv.customer.email}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded bg-amber-50 text-[#8B735B] font-bold border border-amber-100">{inv.orderType}</span>
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-right">₹ {inv.totalAmount.toLocaleString()}</td>
                      <td className="px-6 py-5 text-center">
                        <span className={`text-[9px] uppercase tracking-widest px-3 py-1 rounded-full font-bold shadow-sm ${inv.payment.status === 'paid' ? 'bg-green-50 text-green-700 border border-green-100' :
                          inv.payment.status === 'partial' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                          {inv.payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="bg-[#2C2C2C] text-white text-[9px] uppercase tracking-widest font-bold px-4 py-2 hover:bg-[#8B735B] transition-all rounded shadow-sm"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-24 text-center">
                        <p className="serif text-2xl italic text-[#CCC]">No records found.</p>
                        <p className="text-[10px] uppercase tracking-widest text-[#999] mt-2">Adjust your filters or search terms.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Overlay for Invoice View */}
            {selectedInvoice && (
              <div className="fixed inset-0 z-[700] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
                <div className="w-full max-w-5xl h-[95vh] overflow-hidden bg-[#D1D1D1] shadow-2xl relative flex flex-col rounded-lg">
                  <div className="p-4 flex justify-between items-center bg-[#2C2C2C] text-white z-10">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setSelectedInvoice(null)} className="text-white/60 hover:text-white transition-opacity">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                      <p className="text-[10px] uppercase tracking-widest font-bold">Preview: {selectedInvoice.invoiceNumber}</p>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => window.print()}
                        className="bg-[#8B735B] hover:bg-[#A68F75] text-white px-8 py-2.5 text-[10px] uppercase tracking-widest font-bold transition-all shadow-lg flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4" /></svg>
                        Download PDF
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 md:p-12">
                    <div className="shadow-2xl">
                      <InvoiceView invoice={selectedInvoice} id="admin-invoice-print-area" />
                    </div>
                  </div>
                  <style dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                      body * { visibility: hidden; }
                      #admin-invoice-print-area, #admin-invoice-print-area * { visibility: visible; }
                      #admin-invoice-print-area { position: absolute; left: 0; top: 0; width: 100%; }
                    }
                  `}} />
                </div>
              </div>
            )}
          </div>
        );
      })()}
      {activeTab === 'journal' && (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-medium">Kala Prayag Journal ({journalEntries.length})</h2>
            <button
              onClick={() => setEditingJournalEntry({
                id: 'story-' + Date.now(),
                title: '',
                excerpt: '',
                content: '',
                image: '',
                date: new Date().toISOString().split('T')[0],
                category: 'CRAFT STORIES',
                author: '',
                tags: [],
                readTime: '5 MIN READ',
                featured: false
              })}
              className="bg-[#2C2C2C] text-white px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-black transition-all rounded"
            >
              Add New Story
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {journalEntries.map(entry => (
              <div key={entry.id} className="bg-white border border-[#E5E5E5] p-5 space-y-4 group rounded shadow-sm">
                <div className="aspect-video overflow-hidden rounded bg-[#F5F0E8]">
                  <img src={entry.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-widest text-[#8B735B] font-bold">{entry.category}</span>
                    {entry.featured && <span className="text-[8px] border border-[#8B735B] text-[#8B735B] px-1.5 py-0.5 rounded uppercase font-bold">Featured</span>}
                  </div>
                  <h3 className="text-lg font-medium serif mt-2">{entry.title}</h3>
                  <p className="text-xs text-[#999] mt-2 line-clamp-2 font-light">{entry.excerpt}</p>
                </div>
                <div className="flex gap-4 pt-2">
                  <button onClick={() => setEditingJournalEntry(entry)} className="text-[10px] uppercase tracking-widest text-[#2C2C2C] font-bold hover:text-[#8B735B] transition-colors">Edit</button>
                  <button onClick={() => handleJournalDelete(entry.id)} className="text-[10px] uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors">Delete</button>
                </div>
              </div>
            ))}
          </div>

          {!journalEntries.length && (
            <div className="py-32 text-center text-[#999] border border-dashed border-[#E5E5E5] rounded-xl bg-gray-50/30">
              <p className="serif text-2xl italic">No stories published yet.</p>
              <p className="text-[10px] uppercase tracking-widest mt-4">Click "Add New Story" to begin chronicling the crafts.</p>
            </div>
          )}
        </div>
      )}

      {/* Journal Edit Modal */}
      {editingJournalEntry && (
        <div className="fixed inset-0 z-[600] bg-black/50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-[#FAF9F6] w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in duration-300 rounded-lg">
            <div className="p-8 border-b border-[#E5E5E5] flex justify-between items-center sticky top-0 bg-[#FAF9F6] z-10">
              <h2 className="text-2xl serif">Edit Editorial Story</h2>
              <button onClick={() => setEditingJournalEntry(null)} className="text-[#999] hover:text-black transition-colors px-2 text-xl">✕</button>
            </div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Main Title</label>
                    <input type="text" className="w-full border-b border-[#E5E5E5] bg-transparent py-3 text-lg md:text-xl serif focus:outline-none focus:border-[#8B735B] transition-all" placeholder="Enter an elegant title..." value={editingJournalEntry.title} onChange={e => setEditingJournalEntry({ ...editingJournalEntry, title: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Category</label>
                      <select className="w-full border-b border-[#E5E5E5] bg-transparent py-3 text-sm focus:outline-none focus:border-[#8B735B]" value={editingJournalEntry.category} onChange={e => setEditingJournalEntry({ ...editingJournalEntry, category: e.target.value })}>
                        <option value="CRAFT STORIES">CRAFT STORIES</option>
                        <option value="HOME & STYLE">HOME & STYLE</option>
                        <option value="GUIDES">GUIDES</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Publish Date</label>
                      <input type="date" className="w-full border-b border-[#E5E5E5] bg-transparent py-3 text-sm focus:outline-none focus:border-[#8B735B]" value={editingJournalEntry.date} onChange={e => setEditingJournalEntry({ ...editingJournalEntry, date: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Author Name</label>
                      <input type="text" className="w-full border-b border-[#E5E5E5] bg-transparent py-3 text-sm focus:outline-none focus:border-[#8B735B]" value={editingJournalEntry.author} onChange={e => setEditingJournalEntry({ ...editingJournalEntry, author: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Read Time</label>
                      <input type="text" placeholder="e.g. 5 MIN READ" className="w-full border-b border-[#E5E5E5] bg-transparent py-3 text-sm focus:outline-none focus:border-[#8B735B]" value={editingJournalEntry.readTime} onChange={e => setEditingJournalEntry({ ...editingJournalEntry, readTime: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Tags (Comma separated)</label>
                    <input type="text" placeholder="HERITAGE, POTTERY, VARANASI" className="w-full border-b border-[#E5E5E5] bg-transparent py-3 text-sm focus:outline-none focus:border-[#8B735B]" value={(editingJournalEntry.tags || []).join(', ')} onChange={e => setEditingJournalEntry({ ...editingJournalEntry, tags: e.target.value.split(',').map(s => s.trim()) })} />
                  </div>

                  <div className="flex items-center gap-3 py-2">
                    <input type="checkbox" id="featured" checked={editingJournalEntry.featured} onChange={e => setEditingJournalEntry({ ...editingJournalEntry, featured: e.target.checked })} className="w-4 h-4 accent-[#8B735B]" />
                    <label htmlFor="featured" className="text-[10px] uppercase tracking-widest text-[#2C2C2C] font-bold cursor-pointer">Feature on top of Journal page</label>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Cover Image</label>
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <label className="text-[9px] uppercase tracking-widest text-[#BBB] mb-1 block">Image URL</label>
                          <input type="text" placeholder="https://unsplash.com/..." className="w-full border-b border-[#E5E5E5] bg-transparent py-2 text-sm focus:outline-none focus:border-[#8B735B]" value={editingJournalEntry.image} onChange={e => setEditingJournalEntry({ ...editingJournalEntry, image: e.target.value })} />
                        </div>
                        <button
                          onClick={() => journalImageInputRef.current?.click()}
                          className="bg-[#2C2C2C] text-white px-4 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-black transition-all rounded whitespace-nowrap"
                        >
                          Upload Photo
                        </button>
                        <input
                          type="file"
                          ref={journalImageInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleJournalImageUpload}
                        />
                      </div>
                      {editingJournalEntry.image && (
                        <div className="mt-2 aspect-video rounded overflow-hidden border border-[#E5E5E5] relative group">
                          <img src={editingJournalEntry.image} className="w-full h-full object-cover" alt="Preview" />
                          <button
                            onClick={() => setEditingJournalEntry({ ...editingJournalEntry, image: '' })}
                            className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Short Excerpt (Teaser)</label>
                    <textarea rows={3} className="w-full border border-[#E5E5E5] bg-white p-4 text-sm font-light focus:outline-none focus:border-[#8B735B] transition-all rounded" placeholder="Write a captivating teaser..." value={editingJournalEntry.excerpt} onChange={e => setEditingJournalEntry({ ...editingJournalEntry, excerpt: e.target.value })} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Story Content</label>
                    <textarea rows={10} className="w-full border border-[#E5E5E5] bg-white p-4 text-sm font-light leading-relaxed focus:outline-none focus:border-[#8B735B] transition-all rounded" placeholder="Tell the story of the craft..." value={editingJournalEntry.content} onChange={e => setEditingJournalEntry({ ...editingJournalEntry, content: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-[#E5E5E5] flex justify-end gap-6">
                <button onClick={() => setEditingJournalEntry(null)} className="px-10 py-4 text-[10px] uppercase tracking-widest border border-[#E5E5E5] hover:bg-white transition-all rounded">Cancel</button>
                <button onClick={handleJournalSave} className="px-16 py-4 text-[10px] uppercase tracking-widest bg-[#2C2C2C] text-white font-bold hover:bg-black transition-all rounded">Publish Story</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHIPPING TAB — Issue 2: Full shipping management with AWB + Delhivery tracking */}
      {activeTab === 'shipping' && (() => {
        const confirmedOrders = productOrders.filter(o => o.status === 'confirmed');
        const shippedOrders = productOrders.filter(o => o.awb);
        const inTransit = shippedOrders.filter(o => o.shippingStatus !== 'Delivered').length;
        const delivered = shippedOrders.filter(o => o.shippingStatus === 'Delivered' || o.status === 'delivered').length;

        return (
          <div className="animate-in fade-in duration-500 space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-[#E5E5E5] p-5 shadow-sm">
                <span className="text-[10px] uppercase tracking-widest text-[#999] font-bold block mb-1">Ready to Ship</span>
                <span className="text-3xl serif text-amber-600">{confirmedOrders.length}</span>
              </div>
              <div className="bg-white border border-[#E5E5E5] p-5 shadow-sm">
                <span className="text-[10px] uppercase tracking-widest text-[#999] font-bold block mb-1">Total Shipments</span>
                <span className="text-3xl serif">{shippedOrders.length}</span>
              </div>
              <div className="bg-[#FAF9F6] border border-[#E5E5E5] p-5 shadow-sm">
                <span className="text-[10px] uppercase tracking-widest text-[#8B735B] font-bold block mb-1">In Transit</span>
                <span className="text-3xl serif">{inTransit}</span>
              </div>
              <div className="bg-green-50 border border-green-100 p-5 shadow-sm">
                <span className="text-[10px] uppercase tracking-widest text-green-700 font-bold block mb-1">Delivered</span>
                <span className="text-3xl serif">{delivered}</span>
              </div>
            </div>

            {/* Confirmed orders — need AWB */}
            {confirmedOrders.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-amber-600 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse inline-block"></span>
                  Ready to Ship — Enter AWB Number
                </h3>
                <div className="space-y-3">
                  {confirmedOrders.map(order => (
                    <div key={order.id} className="bg-white border border-amber-200 p-4 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold font-mono text-[#2C2C2C]">{order.id}</p>
                        <p className="text-sm text-[#666]">{order.customerName} — {order.city}, {order.pincode}</p>
                        <p className="text-[10px] text-[#999]">{order.items.length} item(s) · ₹{order.totalAmount.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <input
                          type="text"
                          placeholder="Delhivery AWB number"
                          value={awbInputs[order.id] || ''}
                          onChange={e => setAwbInputs(p => ({ ...p, [order.id]: e.target.value }))}
                          className="border border-[#E5E5E5] px-3 py-2 text-xs w-48 focus:outline-none focus:border-indigo-400"
                        />
                        <button
                          disabled={awbSaving[order.id] || !awbInputs[order.id]?.trim()}
                          onClick={async () => {
                            const awb = awbInputs[order.id]?.trim();
                            if (!awb) return;
                            setAwbSaving(p => ({ ...p, [order.id]: true }));
                            await setDoc(doc(db, 'productOrders', order.id), {
                              ...order,
                              status: 'shipped',
                              awb,
                              trackingUrl: `https://www.delhivery.com/track/package/${awb}`,
                              shippingStatus: 'In Transit',
                              shippedAt: new Date().toISOString()
                            });
                            setAwbInputs(p => ({ ...p, [order.id]: '' }));
                            setAwbSaving(p => ({ ...p, [order.id]: false }));
                          }}
                          className="text-[9px] uppercase tracking-widest bg-indigo-600 text-white px-5 py-2 hover:bg-indigo-700 font-bold disabled:opacity-40 transition-all"
                        >
                          {awbSaving[order.id] ? 'Saving...' : 'Mark Shipped'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All shipments with AWB */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#2C2C2C] mb-3">All Shipments</h3>
              <div className="bg-white border border-[#E5E5E5] shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF9F6] border-b border-[#E5E5E5] text-[10px] uppercase tracking-widest text-[#999]">
                      <th className="p-4 font-semibold">Order</th>
                      <th className="p-4 font-semibold">Customer</th>
                      <th className="p-4 font-semibold">AWB / Carrier</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F0F0]">
                    {shippedOrders.map(order => (
                      <tr key={order.id} className="hover:bg-[#FAF9F6] transition-colors">
                        <td className="p-4">
                          <div className="text-xs font-bold font-mono">{order.id.slice(-8).toUpperCase()}</div>
                          <div className="text-[10px] text-[#999]">{new Date(order.createdAt).toLocaleDateString('en-IN')}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">{order.customerName}</div>
                          <div className="text-[10px] text-[#666]">{order.city} — {order.pincode}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-mono text-xs font-bold text-[#8B735B]">{order.awb}</div>
                          <div className="text-[10px] text-[#999] mt-0.5">{order.shippingMethod || 'Delhivery Standard'}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-[9px] uppercase tracking-widest rounded font-bold ${
                            order.status === 'delivered' || order.shippingStatus === 'Delivered'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}>
                            {order.shippingStatus || 'In Transit'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <a
                              href={order.trackingUrl || `https://www.delhivery.com/track/package/${order.awb}`}
                              target="_blank" rel="noreferrer"
                              className="text-[9px] uppercase tracking-widest border border-[#2C2C2C] px-3 py-1.5 hover:bg-[#2C2C2C] hover:text-white transition-all"
                            >
                              Track
                            </a>
                            {order.status !== 'delivered' && (
                              <button
                                onClick={() => setDoc(doc(db, 'productOrders', order.id), {
                                  ...order,
                                  status: 'delivered',
                                  shippingStatus: 'Delivered',
                                  deliveredAt: new Date().toISOString()
                                })}
                                className="text-[9px] uppercase tracking-widest bg-green-600 text-white px-3 py-1.5 hover:bg-green-700 transition-all font-bold"
                              >
                                Delivered ✓
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {shippedOrders.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-[#999] text-sm">No shipments yet. Confirm orders first.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}



    </div>
  );
};

export default AdminDashboard;