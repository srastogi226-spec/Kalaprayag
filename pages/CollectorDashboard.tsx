
import React, { useState } from 'react';
import { Workshop, CustomOrder, ProductOrder, ClassBooking, Artisan, Review, FavoriteArtisan, AppNotification, FavoriteProduct, Product } from '../types';

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
}

const CollectorDashboard: React.FC<CollectorDashboardProps> = ({
    userEmail, userId, customOrders, productOrders, classBookings, favoriteArtisans, favoriteProducts, artisans, products, notifications, reviews, onLeaveReview, onMarkNotificationAsRead, onLogout
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'workshops' | 'saved' | 'notifications'>('overview');

    const myCustomOrders = customOrders.filter(o => o.email === userEmail);
    const myProductOrders = productOrders.filter(o => o.customerEmail === userEmail);
    const myBookings = classBookings.filter(b => b.customerEmail === userEmail);
    const favoredArtisans = artisans.filter(a => favoriteArtisans.some(f => f.artisanId === a.id));
    const favoredProducts = products.filter(p => favoriteProducts.some(f => f.productId === p.id));
    const myNotifications = notifications.filter(n => n.userId === userId);
    const unreadNotifs = myNotifications.filter(n => n.status === 'unread').length;

    const tabs: { id: string; label: string; badge?: number }[] = [
        { id: 'overview', label: 'Overview' },
        { id: 'orders', label: 'My Orders' },
        { id: 'workshops', label: 'Masterclasses' },
        { id: 'saved', label: 'Wishlist' }
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
        <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-gray-100 pb-8">
                <div>
                    <h1 className="text-4xl serif mb-2">Welcome Back</h1>
                    <p className="text-[#999] text-sm tracking-widest uppercase">{userEmail} • Collector Profile</p>
                </div>
                <div className="flex flex-wrap gap-8 mt-6 md:mt-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`text-xs uppercase tracking-[0.2em] pb-2 transition-all relative ${activeTab === tab.id ? 'border-b border-[#2C2C2C] font-bold text-[#2C2C2C]' : 'text-[#999] hover:text-[#2C2C2C]'}`}
                        >
                            {tab.label}
                            {tab.badge ? (
                                <span className="absolute -top-1 -right-4 bg-red-500 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                    {tab.badge}
                                </span>
                            ) : null}
                        </button>
                    ))}
                    <button onClick={onLogout} className="text-xs uppercase tracking-[0.2em] text-red-500 hover:text-red-700 transition-colors">Sign Out</button>
                </div>
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-[#FAF9F6] p-8 border border-[#F0F0F0] text-center">
                        <p className="text-[10px] uppercase tracking-widest text-[#999] mb-3">Active Orders</p>
                        <p className="text-4xl serif">{myCustomOrders.length + myProductOrders.length}</p>
                    </div>
                    <div className="bg-[#FAF9F6] p-8 border border-[#F0F0F0] text-center">
                        <p className="text-[10px] uppercase tracking-widest text-[#999] mb-3">Workshops Booked</p>
                        <p className="text-4xl serif">{myBookings.length}</p>
                    </div>
                    <div className="bg-[#FAF9F6] p-8 border border-[#F0F0F0] text-center">
                        <p className="text-[10px] uppercase tracking-widest text-[#999] mb-3">Saved Items</p>
                        <p className="text-4xl serif">{favoredArtisans.length + favoredProducts.length}</p>
                    </div>

                    <div className="md:col-span-2 mt-8">
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
                            <div key={b.id} className="bg-white border border-[#E5E5E5] overflow-hidden hover:shadow-md transition-shadow">
                                {/* Header */}
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

                                {/* Details */}
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
                                        {/* Reminder sent indicator */}
                                        {b.reminderSent && (
                                            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                                Workshop reminder has been sent to your email
                                            </div>
                                        )}

                                        {/* Zoom link — shown when available and not yet attended */}
                                        {b.status !== 'completed' && b.status !== 'attended' && b.status !== 'no-show' && (
                                            <div className="bg-indigo-50/50 border border-indigo-100 rounded p-3">
                                                <p className="text-[9px] uppercase tracking-widest text-indigo-600 font-bold mb-1">Join Link</p>
                                                <p className="text-xs text-[#999]">Zoom / Meet link will appear here once the admin sets it before the class.</p>
                                            </div>
                                        )}

                                        {/* Review button — only after completed */}
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

                                {/* Progress steps */}
                                <div className="px-6 pb-6">
                                    <div className="flex items-center justify-between">
                                        {['Booked', 'Reminder Sent', 'Attended', 'Completed'].map((step, idx) => {
                                            const reached =
                                                idx === 0 ? true :
                                                idx === 1 ? (b.reminderSent || b.status === 'reminded' || b.status === 'attended' || b.status === 'completed') :
                                                idx === 2 ? (b.status === 'attended' || b.status === 'completed') :
                                                b.status === 'completed';
                                            return (
                                                <div key={step} className="flex-1 flex flex-col items-center gap-1">
                                                    <div className={`w-3 h-3 rounded-full border-2 transition-all ${reached ? 'bg-[#8B735B] border-[#8B735B]' : 'bg-white border-gray-200'}`} />
                                                    <p className={`text-[8px] uppercase tracking-widest text-center ${reached ? 'text-[#8B735B] font-bold' : 'text-[#CCC]'}`}>{step}</p>
                                                    {idx < 3 && <div className={`h-0.5 w-full mt-1 ${reached ? 'bg-[#8B735B]' : 'bg-gray-100'}`} />}
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
                    {/* Favorite Products */}
                    {favoredProducts.length > 0 && (
                        <div>
                            <h3 className="text-xl serif mb-6 border-b pb-4 border-gray-100">Bespoke Wishlist ({favoredProducts.length})</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                {favoredProducts.map(p => (
                                    <div key={p.id} className="group cursor-pointer">
                                        <div className="aspect-[4/5] overflow-hidden bg-gray-50 mb-4 relative">
                                            <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={p.name} />
                                            <div className="absolute top-4 right-4 bg-white/90 p-2 rounded-full cursor-pointer hover:bg-red-50 text-red-500 transition-colors">
                                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                                            </div>
                                        </div>
                                        <h4 className="serif text-lg">{p.name}</h4>
                                        <p className="text-xs text-[#999] uppercase tracking-widest">₹ {p.price.toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Favorite Artisans */}
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
                                        <div className="absolute top-4 right-4">
                                            <button className="text-[#CCC] hover:text-red-500 transition-colors">
                                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                                            </button>
                                        </div>
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

        </div>
    );
};

export default CollectorDashboard;
