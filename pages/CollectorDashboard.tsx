
import React, { useState } from 'react';
import { Workshop, CustomOrder, ProductOrder, ClassBooking, Artisan, Review, FavoriteArtisan, AppNotification, FavoriteProduct, Product } from '../types';
import WishlistButton from '../components/WishlistButton';

interface CollectorDashboardProps {
    userEmail: string;
    userId: string;
    customOrders: CustomOrder[];
    productOrders: ProductOrder[];
    classBookings: ClassBooking[];
    favoriteArtisans: FavoriteArtisan[];
    favoriteProducts: FavoriteProduct[];
    artisans: Artisan[];
    products: Product[];
    notifications: AppNotification[];
    reviews: Review[];
    onLeaveReview: (targetId: string, authorName: string) => void;
    onMarkNotificationAsRead: (id: string) => void;
    onLogout: () => void;
    onNavigate?: (page: string) => void;
    initialTab?: 'overview' | 'orders' | 'workshops' | 'saved' | 'notifications';
}

const CollectorDashboard: React.FC<CollectorDashboardProps> = ({
    userEmail, userId, customOrders, productOrders, classBookings, favoriteArtisans, favoriteProducts, artisans, products, notifications, reviews, onLeaveReview, onMarkNotificationAsRead, onLogout, onNavigate, initialTab = 'overview'
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'workshops' | 'saved' | 'notifications'>(initialTab);
    const [sidebarOpen, setSidebarOpen] = useState(false);


    const myCustomOrders = customOrders.filter(o => o.email === userEmail);
    const myProductOrders = productOrders.filter(o => o.customerEmail === userEmail);
    const myBookings = classBookings.filter(b => b.customerEmail === userEmail);
    const favoredArtisans = artisans.filter(a => favoriteArtisans.some(f => f.artisanId === a.id && f.userId === userId));
    const favoredProducts = products.filter(p => favoriteProducts.some(f => f.productId === p.id && f.userId === userId));
    const myNotifications = notifications.filter(n => n.userId === userId);
    const unreadNotifs = myNotifications.filter(n => n.status === 'unread').length;

    const tabs: { id: string; label: string; count: number; icon: React.ReactNode }[] = [
        { id: 'overview', label: 'Overview', count: 0, icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="square" strokeLinejoin="miter" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg> },
        { id: 'orders', label: 'Track Order', count: 0, icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="square" strokeLinejoin="miter" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
        { id: 'workshops', label: 'Masterclasses', count: 0, icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="square" strokeLinejoin="miter" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
        { id: 'saved', label: 'Wishlist', count: 0, icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="square" strokeLinejoin="miter" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
        { id: 'notifications', label: 'Notifications', count: unreadNotifs, icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="square" strokeLinejoin="miter" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
    ];


    const renderOrderStepper = (currentStatus: string, type: 'custom' | 'product') => {
        const customSteps = ['pending', 'accepted', 'completed'];
        const productSteps = ['pending', 'confirmed', 'shipped', 'delivered'];
        const steps = type === 'custom' ? customSteps : productSteps;
        const currentIndex = steps.indexOf(currentStatus);

        return (
            <div className="mt-8 relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
                <div
                    className="absolute top-1/2 left-0 h-0.5 bg-[#8B735B] -translate-y-1/2 z-0 transition-all duration-1000"
                    style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
                />
                <div className="relative z-10 flex justify-between">
                    {steps.map((step, idx) => (
                        <div key={step} className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full border-2 transition-all duration-500 ${idx <= currentIndex ? 'bg-[#8B735B] border-[#8B735B]' : 'bg-white border-gray-200'
                                }`} />
                            <span className={`text-[8px] uppercase tracking-widest mt-2 font-bold ${idx <= currentIndex ? 'text-[#8B735B]' : 'text-[#BBB]'
                                }`}>{step}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

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
                <div className="px-7 pt-8 pb-6 border-b border-white/10">
                    <button 
                      onClick={() => onNavigate?.('home')}
                      className="text-left group block"
                    >
                      <p className="text-[9px] uppercase tracking-[0.35em] text-[#8B735B] font-bold mb-1 group-hover:text-white transition-colors">Collector Portal</p>
                      <h1 className="text-[22px] text-[#FAF9F6] serif tracking-wide group-hover:text-[#8B735B] transition-colors" style={{ fontFamily: "'Playfair Display', serif" }}>KALA PRAYAG</h1>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 admin-sidebar-scroll">
                    <p className="text-[9px] uppercase tracking-[0.25em] text-[#666] font-bold px-4 mb-3">Community Console</p>
                    {tabs.map(tab => {
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
                    {unreadNotifs > 0 && (
                        <div className="mb-4 px-3 py-2.5 bg-amber-500/10 border border-amber-500/20">
                            <p className="text-[9px] uppercase tracking-[0.2em] text-amber-400 font-bold flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-amber-400 animate-pulse" />
                                {unreadNotifs} items need attention
                            </p>
                        </div>
                    )}
                    
                    <button
                        onClick={() => onNavigate?.('home')}
                        className="w-full flex items-center gap-3 px-3 py-2 text-[#666] hover:text-[#FAF9F6] transition-colors group mb-1"
                    >
                        <svg className="w-[18px] h-[18px] text-[#444] group-hover:text-[#8B735B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="square" strokeLinejoin="miter" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="text-[10px] uppercase tracking-[0.15em] font-medium">Return to Shop</span>
                    </button>

                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-[#666] hover:text-red-400 transition-colors group"
                    >
                        <svg className="w-[18px] h-[18px] group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="square" strokeLinejoin="miter" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-[10px] uppercase tracking-[0.15em] font-medium">Sign Out</span>
                    </button>
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
                    <button onClick={() => onNavigate?.('home')} className="text-[15px] text-[#FAF9F6] serif tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>KALA PRAYAG</button>
                    <div className="flex items-center gap-2">
                        {unreadNotifs > 0 && (
                            <span className="bg-red-500 text-white text-[9px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                {unreadNotifs}
                            </span>
                        )}
                    </div>
                </div>

                {/* Content Header */}
                <div className="px-6 lg:px-10 pt-8 pb-6 border-b border-[#E5E5E5] bg-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.25em] text-[#8B735B] font-bold mb-1">{tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}</p>
                            <h2 className="text-2xl lg:text-3xl serif text-[#2C2C2C]" style={{ fontFamily: "'Playfair Display', serif" }}>Welcome Back</h2>
                        </div>
                    </div>
                </div>

                {/* Content Body */}
                <div className="px-6 lg:px-10 py-8">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white p-8 border border-[#E5E5E5] text-center shadow-sm">
                                <p className="text-[10px] uppercase tracking-widest text-[#999] mb-3">Active Orders</p>
                                <p className="text-4xl serif">{myCustomOrders.length + myProductOrders.length}</p>
                            </div>
                            <div className="bg-white p-8 border border-[#E5E5E5] text-center shadow-sm">
                                <p className="text-[10px] uppercase tracking-widest text-[#999] mb-3">Workshops Booked</p>
                                <p className="text-4xl serif">{myBookings.length}</p>
                            </div>
                            <div className="bg-white p-8 border border-[#E5E5E5] text-center shadow-sm">
                                <p className="text-[10px] uppercase tracking-widest text-[#999] mb-3">Saved Items</p>
                                <p className="text-4xl serif">{favoredArtisans.length + favoredProducts.length}</p>
                            </div>

                            <div className="md:col-span-3 mt-8">
                                <h3 className="text-xs uppercase tracking-widest font-bold mb-6 text-[#999]">Recent Notifications</h3>
                                <div className="space-y-4">
                                    {myNotifications.slice(0, 3).map(n => (
                                        <div key={n.id} className="p-4 bg-white border border-gray-100 flex items-start gap-4 shadow-sm">
                                            <div className={`w-2 h-2 rounded-full mt-2 ${n.status === 'unread' ? 'bg-amber-500' : 'bg-transparent'}`}></div>
                                            <div>
                                                <p className="text-sm font-medium">{n.title}</p>
                                                <p className="text-xs text-[#666] mt-1">{n.message}</p>
                                                <p className="text-[9px] text-[#BBB] uppercase mt-2 tracking-tighter">{new Date(n.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {myNotifications.length === 0 && <p className="text-sm italic text-[#BBB]">No notifications yet.</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="space-y-12 animate-in slide-in-from-bottom-4">
                            {/* Custom Orders */}
                            <div>
                                <h3 className="text-xl serif mb-6 border-b pb-4 border-gray-100">Bespoke Commissions</h3>
                                <div className="grid grid-cols-1 gap-6">
                                    {myCustomOrders.length === 0 ? (
                                        <p className="text-sm italic text-[#BBB] py-8">No custom orders yet.</p>
                                    ) : myCustomOrders.map(o => (
                                        <div key={o.id} className="bg-white p-8 border border-[#F0F0F0] hover:border-[#8B735B] transition-all group overflow-hidden">
                                            <div className="flex flex-col md:flex-row justify-between gap-8">
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-4 mb-3">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#8B735B] bg-[#FAF9F6] px-3 py-1 border border-[#F0F0F0]">Commission: {o.id.slice(0, 8)}</span>
                                                        <span className="text-[10px] text-[#999] uppercase tracking-widest">{o.category}</span>
                                                    </div>
                                                    <h4 className="serif text-2xl italic text-[#2C2C2C] mb-4">"{o.concept}"</h4>
                                                    <div className="flex gap-8 text-[10px] uppercase tracking-widest text-[#999]">
                                                        <p>Artist: <span className="text-[#2C2C2C] font-semibold">{o.assignedArtisanName}</span></p>
                                                        <p>Date: <span className="text-[#2C2C2C] font-semibold">{new Date(o.createdAt).toLocaleDateString()}</span></p>
                                                    </div>

                                                    {renderOrderStepper(o.artisanStatus, 'custom')}
                                                </div>

                                                <div className="flex flex-col items-center md:items-end justify-center min-w-[120px] border-t md:border-t-0 md:border-l border-[#F0F0F0] pt-6 md:pt-0 md:pl-8">
                                                    <p className="text-[10px] uppercase tracking-widest text-[#999] mb-2">Completion</p>
                                                    <p className="text-2xl font-light serif">{o.artisanStatus === 'completed' ? '100%' : o.artisanStatus === 'accepted' ? '50%' : '10%'}</p>
                                                    {o.artisanStatus === 'completed' && (
                                                        <button
                                                            onClick={() => onLeaveReview(o.assignedArtisanId || '', o.customerName)}
                                                            className="mt-6 text-[9px] uppercase tracking-[0.2em] font-bold text-[#8B735B] hover:text-[#2C2C2C] transition-colors"
                                                        >
                                                            Write Review
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Shop Orders */}
                            <div>
                                <h3 className="text-xl serif mb-6 border-b pb-4 border-gray-100">Product Purchases</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {myProductOrders.length === 0 ? (
                                        <p className="text-sm italic text-[#BBB] py-8">No shop purchases yet.</p>
                                    ) : myProductOrders.map(o => (
                                        <div key={o.id} className="bg-white p-6 border border-[#F0F0F0] hover:border-[#8B735B] transition-all">
                                            <div className="flex flex-col lg:flex-row gap-6">
                                                <div className="flex-grow space-y-4">
                                                    <p className="text-[10px] text-[#BBB] uppercase tracking-widest">Order ID: {o.id.slice(0, 10)}</p>
                                                    <div className="flex flex-wrap gap-4">
                                                        {o.items.map((item, i) => (
                                                            <div key={i} className="flex items-center gap-4 bg-[#FAF9F6] p-2 rounded pr-4 border border-[#F0F0F0]">
                                                                <img src={item.image} className="w-12 h-12 object-cover rounded-sm shadow-sm" alt="" />
                                                                <div>
                                                                    <p className="text-xs font-medium text-[#2C2C2C]">{item.name}</p>
                                                                    <p className="text-[9px] text-[#999] uppercase tracking-widest">Qty: {item.quantity}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {renderOrderStepper(o.status, 'product')}
                                                </div>
                                                <div className="lg:w-48 lg:border-l border-[#F0F0F0] pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-center items-end">
                                                    <p className="text-[10px] uppercase tracking-widest text-[#999] mb-1">Payment</p>
                                                    <p className="text-lg font-medium">₹ {o.totalAmount.toLocaleString()}</p>
                                                    <div className="mt-4 flex flex-col items-end">
                                                        <p className="text-[10px] uppercase tracking-widest text-[#999] mb-1">Status</p>
                                                        <span className={`text-[9px] uppercase tracking-widest font-bold px-3 py-1 rounded-full ${o.status === 'delivered' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                                                            }`}>
                                                            {o.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'workshops' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4">
                            {myBookings.length === 0 ? (
                                <div className="py-20 text-center opacity-30 italic serif text-2xl">
                                    No masterclasses booked yet.
                                </div>
                            ) : myBookings.map(b => {
                                const statusColor =
                                    b.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' :
                                    b.status === 'attended' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                    b.status === 'reminded' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                    b.status === 'no-show' ? 'bg-red-50 text-red-600 border-red-100' :
                                    b.status === 'cancelled' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                                    'bg-[#FAF9F6] text-[#8B735B] border-[#E5E5E5]';

                                const statusLabel =
                                    b.status === 'completed' ? '✓ Completed' :
                                    b.status === 'attended' ? 'Attended' :
                                    b.status === 'reminded' ? 'Reminder Sent' :
                                    b.status === 'no-show' ? 'Missed' :
                                    b.status === 'cancelled' ? 'Cancelled' :
                                    'Seat Confirmed';

                                return (
                                    <div key={b.id} className="bg-white border border-[#E5E5E5] overflow-hidden hover:shadow-md transition-shadow shadow-sm">
                                        <div className="p-6 border-b border-[#F5F5F5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <p className="text-[10px] uppercase tracking-widest text-[#999] mb-1">Masterclass Booking</p>
                                                <h3 className="text-xl serif">{b.workshopTitle}</h3>
                                                <p className="text-xs text-[#8B735B] mt-1">By {b.artisanName || 'Kala Prayag Artisan'}</p>
                                            </div>
                                            <span className={`text-[9px] uppercase tracking-widest px-3 py-1.5 rounded font-bold border self-start ${statusColor}`}>
                                                {statusLabel}
                                            </span>
                                        </div>

                                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 text-xs text-[#666]">
                                                    <svg className="w-4 h-4 text-[#8B735B] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m-6-2v2M3 9h18M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                    <span>Booked on {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-[#666]">
                                                    <svg className="w-4 h-4 text-[#8B735B] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    <span className="font-mono text-[#999]">ID: {b.id}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-[#666]">
                                                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                    <span className="text-green-600 font-bold">₹{b.amount.toLocaleString()} — {b.paymentStatus === 'completed' ? 'Paid' : 'Pending'}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                {b.reminderSent && (
                                                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                                        Workshop reminder sent to email
                                                    </div>
                                                )}

                                                {b.status !== 'completed' && b.status !== 'attended' && b.status !== 'no-show' && (
                                                    <div className="bg-indigo-50/50 border border-indigo-100 rounded p-3">
                                                        <p className="text-[9px] uppercase tracking-widest text-indigo-600 font-bold mb-1">Join Link</p>
                                                        <p className="text-xs text-[#999]">Link will appear here before the class starts.</p>
                                                    </div>
                                                )}

                                                {(b.status === 'completed' || b.status === 'attended') && (
                                                    <button
                                                        onClick={() => onLeaveReview(b.artisanId, b.customerName)}
                                                        className="w-full text-[10px] uppercase tracking-[0.2em] font-bold text-white bg-[#8B735B] py-3 hover:bg-[#6B5040] transition-all"
                                                    >
                                                        Leave a Review
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="px-6 pb-6">
                                            <div className="flex items-center justify-between">
                                                {['Booked', 'Reminder', 'Attended', 'Completed'].map((step, idx) => {
                                                    const reached =
                                                        idx === 0 ? true :
                                                        idx === 1 ? (b.reminderSent || b.status === 'reminded' || b.status === 'attended' || b.status === 'completed') :
                                                        idx === 2 ? (b.status === 'attended' || b.status === 'completed') :
                                                        b.status === 'completed';
                                                    return (
                                                        <div key={step} className="flex-1 flex flex-col items-center gap-1">
                                                            <div className={`w-2.5 h-2.5 rounded-full border-2 transition-all ${reached ? 'bg-[#8B735B] border-[#8B735B]' : 'bg-white border-gray-200'}`} />
                                                            <p className={`text-[8px] uppercase tracking-widest text-center ${reached ? 'text-[#8B735B] font-bold' : 'text-[#CCC]'}`}>{step}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'saved' && (
                        <div className="animate-in slide-in-from-bottom-4 space-y-12">
                            {favoredProducts.length > 0 && (
                                <div>
                                    <h3 className="text-xl serif mb-6 border-b pb-4 border-gray-100">Bespoke Wishlist ({favoredProducts.length})</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                        {favoredProducts.map(p => (
                                            <div key={p.id} className="group cursor-pointer">
                                                <div className="aspect-[4/5] overflow-hidden bg-gray-50 mb-4 relative">
                                                    <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={p.name} />
                                                    <div className="absolute top-4 right-4 z-10">
                                                        <WishlistButton productId={p.id} variant="minimal" />
                                                    </div>
                                                </div>
                                                <h4 className="serif text-lg">{p.name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-[#999] line-through text-[10px]">₹ {Math.round(p.price * 1.10).toLocaleString()}</p>
                                                    <p className="text-[#2C2C2C] font-bold text-xs">₹ {p.price.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className="text-xl serif mb-6 border-b pb-4 border-gray-100">Master Crafters I Follow ({favoredArtisans.length})</h3>
                                {favoredArtisans.length === 0 ? (
                                    <div className="py-20 text-center opacity-30 italic serif text-2xl">
                                        Your collection of favorite artisans is empty.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                        {favoredArtisans.map(a => (
                                            <div key={a.id} className="bg-white border border-[#F0F0F0] p-8 text-center hover:shadow-xl transition-all group relative overflow-hidden">
                                                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 border-4 border-transparent group-hover:border-[#FAF9F6] transition-all shadow-lg scale-90 group-hover:scale-100 duration-500">
                                                    <img src={a.profilePhoto} className="w-full h-full object-cover" alt="" />
                                                </div>
                                                <h4 className="serif text-xl mb-2">{a.brandName || a.name}</h4>
                                                <p className="text-[10px] uppercase tracking-[0.3em] text-[#8B735B] font-bold">{a.craftType}</p>
                                                <div className="mt-6 pt-6 border-t border-[#F9F9F9]">
                                                    <button className="text-[9px] uppercase tracking-[0.4em] font-bold text-[#2C2C2C] hover:text-[#8B735B] transition-colors">View Profile</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="animate-in slide-in-from-bottom-4">
                            <h3 className="text-xl serif mb-6 border-b pb-4 border-gray-100">All Notifications</h3>
                            <div className="space-y-4">
                                {myNotifications.map(n => (
                                    <div key={n.id} className={`p-6 border flex items-start gap-6 transition-all ${n.status === 'unread' ? 'bg-white border-amber-100 shadow-sm' : 'bg-gray-50/50 border-gray-100 opacity-60'}`}>
                                        <div className={`mt-2 w-2 h-2 rounded-full flex-shrink-0 ${n.status === 'unread' ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-start">
                                                <h4 className={`text-[15px] ${n.status === 'unread' ? 'font-bold text-[#2C2C2C]' : 'font-medium text-[#666]'}`}>{n.title}</h4>
                                                <span className="text-[10px] uppercase tracking-widest text-[#BBB]">{new Date(n.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm text-[#666] mt-2 font-light leading-relaxed">{n.message}</p>
                                            {n.status === 'unread' && (
                                                <button
                                                    onClick={() => onMarkNotificationAsRead(n.id)}
                                                    className="mt-4 text-[10px] uppercase tracking-widest text-[#8B735B] font-bold hover:text-[#2C2C2C]"
                                                >
                                                    Mark as Read
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {myNotifications.length === 0 && <p className="text-sm italic text-[#BBB] py-20 text-center">No notifications yet.</p>}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );

};

export default CollectorDashboard;
