import React, { useState, useMemo } from 'react';
import { ProductOrder, CustomOrder } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface OrderTrackingProps {
    productOrders: ProductOrder[];
    customOrders: CustomOrder[];
    onNavigate: (page: string) => void;
    justPlacedOrderId?: string;
}

type FilterTab = 'all' | 'shop' | 'custom';

type TrackingStep = {
    label: string;
    description: string;
    date?: string;
    completed: boolean;
    active: boolean;
    cancelled?: boolean;
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-[#8B735B]/10', text: 'text-[#8B735B]' },
    confirmed: { bg: 'bg-amber-50', text: 'text-amber-700' },
    shipped: { bg: 'bg-blue-50', text: 'text-blue-700' },
    delivered: { bg: 'bg-green-50', text: 'text-green-700' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-600' },
    completed: { bg: 'bg-green-50', text: 'text-green-700' },
    rejected: { bg: 'bg-red-50', text: 'text-red-600' },
};

const STEPS_PRODUCT = ['Paid', 'Processing', 'Shipped', 'Delivered'];
const STEPS_CUSTOM = ['Submitted', 'Reviewed', 'In Progress', 'Completed'];

const OrderTracking: React.FC<OrderTrackingProps> = ({ productOrders, customOrders, onNavigate, justPlacedOrderId }) => {
    const { currentUser, loginWithGoogle } = useAuth();
    const userEmail = currentUser?.email?.toLowerCase() || '';

    const [filter, setFilter] = useState<FilterTab>('all');
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(justPlacedOrderId || null);

    // Manual search fallback state
    const [manualOrderId, setManualOrderId] = useState('');
    const [manualEmail, setManualEmail] = useState('');
    const [manualSearchResult, setManualSearchResult] = useState<{ po?: ProductOrder; co?: CustomOrder } | null>(null);
    const [manualError, setManualError] = useState('');
    const [showManualSearch, setShowManualSearch] = useState(false);

    // ── Filter orders for logged-in user ────────────────────────────────────

    const userProductOrders = useMemo(() => {
        if (!userEmail) return [];
        return productOrders
            .filter(o => o.customerEmail?.toLowerCase() === userEmail)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [productOrders, userEmail]);

    const userCustomOrders = useMemo(() => {
        if (!userEmail) return [];
        return customOrders
            .filter(o => o.email?.toLowerCase() === userEmail)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [customOrders, userEmail]);

    const filteredOrders = useMemo(() => {
        const combined: { type: 'shop' | 'custom'; order: ProductOrder | CustomOrder; date: string }[] = [];
        if (filter === 'all' || filter === 'shop') {
            userProductOrders.forEach(o => combined.push({ type: 'shop', order: o, date: o.createdAt }));
        }
        if (filter === 'all' || filter === 'custom') {
            userCustomOrders.forEach(o => combined.push({ type: 'custom', order: o, date: o.createdAt }));
        }
        return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [filter, userProductOrders, userCustomOrders]);

    const totalOrders = userProductOrders.length + userCustomOrders.length;

    // ── Manual search handler ──────────────────────────────────────────────

    const handleManualSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setManualError('');
        setManualSearchResult(null);
        const tid = manualOrderId.trim().toLowerCase();
        const temail = manualEmail.trim().toLowerCase();

        const po = productOrders.find(o => o.id.toLowerCase() === tid && o.customerEmail.toLowerCase() === temail);
        if (po) { setManualSearchResult({ po }); return; }

        const co = customOrders.find(o => o.id.toLowerCase() === tid && o.email.toLowerCase() === temail);
        if (co) { setManualSearchResult({ co }); return; }

        setManualError('No order found. Please check your Order ID and email address.');
    };

    // ── Progress helpers ───────────────────────────────────────────────────

    const getProductProgress = (status: string) => {
        const map: Record<string, number> = { pending: 0, confirmed: 1, shipped: 2, delivered: 3, cancelled: -1 };
        return map[status] ?? 0;
    };

    const getCustomProgress = (order: CustomOrder) => {
        if (order.status === 'rejected') return -1;
        if (order.artisanStatus === 'completed') return 3;
        if (order.artisanStatus === 'accepted') return 2;
        if (order.adminStatus === 'approved' || order.adminStatus === 'reassigned') return 1;
        return 0;
    };

    const renderProgressBar = (current: number, steps: string[], cancelled: boolean) => (
        <div className="mt-4">
            <div className="flex items-center gap-0">
                {steps.map((step, i) => {
                    const done = !cancelled && i <= current;
                    const isActive = !cancelled && i === current;
                    return (
                        <React.Fragment key={step}>
                            <div className="flex flex-col items-center" style={{ minWidth: 20 }}>
                                <div className={`w-3 h-3 rounded-full transition-all ${cancelled && i === 0 ? 'bg-red-500' : done ? 'bg-[#8B735B]' : 'bg-[#E5E5E5]'} ${isActive ? 'ring-[3px] ring-[#8B735B]/20' : ''}`} />
                                <span className={`text-[8px] uppercase tracking-widest mt-1.5 whitespace-nowrap ${done ? 'text-[#2C2C2C] font-bold' : 'text-[#CCC]'}`}>{step}</span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`flex-1 h-[2px] -mt-3 ${!cancelled && i < current ? 'bg-[#8B735B]' : 'bg-[#E5E5E5]'}`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );

    // ── Detailed timeline ─────────────────────────────────────────────────

    const getProductOrderSteps = (order: ProductOrder): TrackingStep[] => {
        const statusOrder = ['pending', 'confirmed', 'shipped', 'delivered'];
        const currentIndex = order.status === 'cancelled' ? -1 : statusOrder.indexOf(order.status);

        const steps: TrackingStep[] = [
            { label: 'Order Placed', description: 'Your order has been received.', date: new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), completed: currentIndex >= 0, active: currentIndex === 0 },
            { label: 'Confirmed', description: 'Artisan has started crafting.', completed: currentIndex >= 1, active: currentIndex === 1 },
            { label: 'Shipped', description: 'On its way to you.', completed: currentIndex >= 2, active: currentIndex === 2 },
            { label: 'Delivered', description: 'Enjoy your artisan piece!', completed: currentIndex >= 3, active: currentIndex === 3 },
        ];
        if (order.status === 'cancelled') {
            steps.forEach(s => { s.completed = false; s.active = false; });
            steps[0].completed = true;
            steps.push({ label: 'Cancelled', description: 'This order has been cancelled.', completed: true, active: true, cancelled: true });
        }
        return steps;
    };

    const getCustomOrderSteps = (order: CustomOrder): TrackingStep[] => {
        const steps: TrackingStep[] = [
            { label: 'Request Submitted', description: 'Submitted for review.', date: new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), completed: true, active: order.adminStatus === 'pending' },
            { label: 'Admin Review', description: order.adminStatus === 'approved' ? 'Approved and assigned.' : 'Under review.', completed: order.adminStatus === 'approved' || order.adminStatus === 'reassigned', active: order.adminStatus === 'pending' },
            { label: 'Artisan Working', description: order.artisanStatus === 'accepted' ? `${order.assignedArtisanName} is crafting.` : 'Waiting for artisan.', completed: order.artisanStatus === 'accepted' || order.artisanStatus === 'completed', active: order.artisanStatus === 'waiting' && order.adminStatus !== 'pending' },
            { label: 'Completed', description: 'Your custom piece is ready!', completed: order.artisanStatus === 'completed', active: order.artisanStatus === 'completed' },
        ];
        if (order.status === 'rejected') {
            steps.forEach(s => { s.completed = false; s.active = false; });
            steps[0].completed = true;
            steps.push({ label: 'Declined', description: 'Not accepted.', completed: true, active: true, cancelled: true });
        }
        return steps;
    };

    const renderTimeline = (steps: TrackingStep[]) => (
        <div className="relative mt-6">
            {steps.map((step, i) => (
                <div key={i} className="flex gap-4 mb-0">
                    <div className="flex flex-col items-center">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-all ${step.cancelled ? 'bg-red-500 border-red-500' : step.completed ? 'bg-[#8B735B] border-[#8B735B]' : step.active ? 'bg-white border-[#8B735B] ring-4 ring-[#8B735B]/20' : 'bg-white border-[#D1D1D1]'}`} />
                        {i < steps.length - 1 && (<div className={`w-0.5 h-12 ${step.completed && steps[i + 1]?.completed ? 'bg-[#8B735B]' : 'bg-[#E5E5E5]'}`} />)}
                    </div>
                    <div className={`pb-6 -mt-0.5 ${!step.completed && !step.active ? 'opacity-40' : ''}`}>
                        <div className="flex items-center gap-2">
                            <h4 className={`text-xs font-bold uppercase tracking-wider ${step.cancelled ? 'text-red-600' : step.completed || step.active ? 'text-[#2C2C2C]' : 'text-[#999]'}`}>{step.label}</h4>
                            {step.active && !step.cancelled && (<span className="text-[8px] uppercase tracking-widest bg-[#8B735B]/10 text-[#8B735B] px-2 py-0.5 font-bold">Current</span>)}
                        </div>
                        <p className="text-[#666] text-xs mt-0.5 font-light">{step.description}</p>
                        {step.date && <p className="text-[#999] text-[10px] mt-0.5">{step.date}</p>}
                    </div>
                </div>
            ))}
        </div>
    );

    // ── Order Card ─────────────────────────────────────────────────────────

    const renderProductCard = (order: ProductOrder) => {
        const isJust = order.id === justPlacedOrderId;
        const isExpanded = expandedOrderId === order.id;
        const progress = getProductProgress(order.status);
        const colors = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
        const itemSummary = order.items.length > 0 ? order.items[0].name + (order.items.length > 1 ? ` +${order.items.length - 1} more` : '') : '';

        return (
            <div key={order.id} className={`bg-white border ${isJust ? 'border-[#8B735B] ring-2 ring-[#8B735B]/10' : 'border-[#E5E5E5]'} transition-all hover:shadow-sm`}>
                <button onClick={() => setExpandedOrderId(isExpanded ? null : order.id)} className="w-full text-left p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-[#2C2C2C] font-mono">{order.id}</span>
                                {isJust && <span className="text-[8px] uppercase tracking-widest bg-[#8B735B] text-white px-2 py-0.5 font-bold">Just Ordered!</span>}
                                <span className={`text-[8px] uppercase tracking-widest px-2 py-0.5 font-bold ${colors.bg} ${colors.text}`}>{order.status}</span>
                            </div>
                            <p className="text-sm text-[#666] mt-1 truncate">{order.items.length} item{order.items.length > 1 ? 's' : ''} · ₹{order.totalAmount.toLocaleString()}</p>
                            <p className="text-xs text-[#999] mt-0.5 truncate">{itemSummary}</p>
                            <p className="text-[10px] text-[#CCC] mt-1">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <svg className={`w-4 h-4 text-[#999] flex-shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    {!isExpanded && renderProgressBar(progress, STEPS_PRODUCT, order.status === 'cancelled')}
                </button>

                {isExpanded && (
                    <div className="border-t border-[#F0F0F0] px-5 pb-5">
                        {renderTimeline(getProductOrderSteps(order))}
                        <div className="border-t border-[#E5E5E5] pt-4 mt-4">
                            <p className="text-[9px] uppercase tracking-widest text-[#999] font-bold mb-3">Order Items</p>
                            {order.items.map((item, i) => (
                                <div key={i} className="flex gap-3 items-center mb-2">
                                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover bg-[#F0EDE8]" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-[#2C2C2C] truncate">{item.name}</p>
                                        <p className="text-[10px] text-[#999]">{item.size} · {item.finish} · Qty: {item.quantity}</p>
                                    </div>
                                    <p className="text-xs font-bold">₹{(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4 text-xs text-[#666] border-t border-[#E5E5E5] pt-4">
                            <div>
                                <span className="text-[9px] text-[#999] uppercase tracking-wider font-bold block mb-1">Shipping To</span>
                                {order.customerName}<br />{order.shippingAddress}<br />{order.city} — {order.pincode}
                            </div>
                            <div>
                                <span className="text-[9px] text-[#999] uppercase tracking-wider font-bold block mb-1">Payment</span>
                                {order.paymentMethod}
                                {order.paymentId && <p className="text-[9px] font-mono text-[#8B735B] mt-0.5">{order.paymentId}</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderCustomCard = (order: CustomOrder) => {
        const isJust = order.id === justPlacedOrderId;
        const isExpanded = expandedOrderId === order.id;
        const progress = getCustomProgress(order);
        const status = order.status === 'rejected' ? 'rejected' : order.artisanStatus === 'completed' ? 'completed' : 'pending';
        const colors = STATUS_COLORS[status] || STATUS_COLORS.pending;

        return (
            <div key={order.id} className={`bg-white border ${isJust ? 'border-[#8B735B] ring-2 ring-[#8B735B]/10' : 'border-[#E5E5E5]'} transition-all hover:shadow-sm`}>
                <button onClick={() => setExpandedOrderId(isExpanded ? null : order.id)} className="w-full text-left p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-[#2C2C2C] font-mono">{order.id}</span>
                                <span className="text-[8px] uppercase tracking-widest bg-[#FAF9F6] text-[#8B735B] px-2 py-0.5 font-bold border border-[#E5E5E5]">Custom</span>
                                {isJust && <span className="text-[8px] uppercase tracking-widest bg-[#8B735B] text-white px-2 py-0.5 font-bold">Just Ordered!</span>}
                                <span className={`text-[8px] uppercase tracking-widest px-2 py-0.5 font-bold ${colors.bg} ${colors.text}`}>{status}</span>
                            </div>
                            <p className="text-sm text-[#666] mt-1 truncate">{order.category} · {order.assignedArtisanName || 'Unassigned'}</p>
                            <p className="text-xs text-[#999] mt-0.5 truncate">{order.concept?.slice(0, 60)}</p>
                            <p className="text-[10px] text-[#CCC] mt-1">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <svg className={`w-4 h-4 text-[#999] flex-shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    {!isExpanded && renderProgressBar(progress, STEPS_CUSTOM, order.status === 'rejected')}
                </button>

                {isExpanded && (
                    <div className="border-t border-[#F0F0F0] px-5 pb-5">
                        {renderTimeline(getCustomOrderSteps(order))}
                        <div className="grid grid-cols-2 gap-4 mt-4 text-xs text-[#666] border-t border-[#E5E5E5] pt-4">
                            <div>
                                <span className="text-[9px] text-[#999] uppercase tracking-wider font-bold block mb-1">Category</span>{order.category}
                            </div>
                            <div>
                                <span className="text-[9px] text-[#999] uppercase tracking-wider font-bold block mb-1">Artisan</span>{order.assignedArtisanName || '—'}
                            </div>
                            <div>
                                <span className="text-[9px] text-[#999] uppercase tracking-wider font-bold block mb-1">Size</span>{order.dimensions || order.size || '—'}
                            </div>
                            <div>
                                <span className="text-[9px] text-[#999] uppercase tracking-wider font-bold block mb-1">Finish</span>{order.finish || '—'}
                            </div>
                            {order.advancePayment && (
                                <div className="col-span-2">
                                    <span className="text-[9px] text-[#999] uppercase tracking-wider font-bold block mb-1">Advance Payment</span>
                                    ₹{order.advancePayment.amount.toLocaleString()} · {order.advancePayment.method}
                                    {order.advancePayment.paymentId && <span className="text-[9px] font-mono text-[#8B735B] ml-2">{order.advancePayment.paymentId}</span>}
                                    {order.advancePayment.paid && <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 ml-2 uppercase tracking-widest font-bold">✓ Paid</span>}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ── RENDER ─────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-[#FAF9F6]">
            {/* Hero */}
            <div className="bg-[#2C2C2C] text-white py-16 px-6 text-center">
                <p className="text-[10px] uppercase tracking-[0.4em] text-[#8B735B] mb-3 font-bold">Kala Prayag</p>
                <h1 className="text-4xl md:text-5xl serif mb-3">Your Orders</h1>
                <p className="text-[#999] font-light text-sm max-w-md mx-auto">
                    {currentUser ? 'Track all your orders and custom commissions.' : 'Track the status of your handcrafted pieces.'}
                </p>
            </div>

            <div className="max-w-2xl mx-auto px-6 py-10">

                {/* ═══ LOGGED IN — Show all orders ═══ */}
                {currentUser ? (
                    <>
                        {/* Stats */}
                        <div className="flex items-center gap-6 mb-6">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-[#999] font-bold">
                                {totalOrders} Order{totalOrders !== 1 ? 's' : ''}
                            </p>
                            {currentUser.email && (
                                <p className="text-[10px] text-[#CCC] truncate">{currentUser.email}</p>
                            )}
                        </div>

                        {/* Filter tabs */}
                        <div className="flex gap-1 mb-6 border-b border-[#E5E5E5]">
                            {([
                                { key: 'all' as FilterTab, label: 'All', count: totalOrders },
                                { key: 'shop' as FilterTab, label: 'Shop Orders', count: userProductOrders.length },
                                { key: 'custom' as FilterTab, label: 'Custom Studio', count: userCustomOrders.length },
                            ]).map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setFilter(tab.key)}
                                    className={`px-4 py-3 text-[10px] uppercase tracking-widest font-bold transition-all border-b-2 -mb-px ${filter === tab.key
                                        ? 'border-[#2C2C2C] text-[#2C2C2C]'
                                        : 'border-transparent text-[#999] hover:text-[#666]'
                                        }`}
                                >
                                    {tab.label} ({tab.count})
                                </button>
                            ))}
                        </div>

                        {/* Order list */}
                        {filteredOrders.length > 0 ? (
                            <div className="space-y-3">
                                {filteredOrders.map(({ type, order }) =>
                                    type === 'shop'
                                        ? renderProductCard(order as ProductOrder)
                                        : renderCustomCard(order as CustomOrder)
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 bg-[#F0EDE8] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-7 h-7 text-[#999]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                </div>
                                <p className="text-[#999] text-sm mb-6">No orders yet</p>
                                <button onClick={() => onNavigate('shop')} className="bg-[#2C2C2C] text-white px-8 py-3 text-xs uppercase tracking-[0.3em] font-bold hover:bg-[#8B735B] transition-all">
                                    Start Shopping
                                </button>
                            </div>
                        )}
                    </>
                ) : (

                    /* ═══ NOT LOGGED IN ═══ */
                    <>
                        {/* Login prompt */}
                        {!showManualSearch && (
                            <div className="bg-white border border-[#E5E5E5] p-8 text-center mb-6">
                                <div className="w-14 h-14 bg-[#FAF9F6] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#E5E5E5]">
                                    <svg className="w-6 h-6 text-[#8B735B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </div>
                                <h3 className="text-lg serif text-[#2C2C2C] mb-2">Log in to see all your orders</h3>
                                <p className="text-sm text-[#999] mb-6 font-light">View complete order history, track shipments, and manage your purchases.</p>
                                <button
                                    onClick={async () => {
                                        try { await loginWithGoogle(); } catch (e) { /* user cancelled */ }
                                    }}
                                    className="bg-[#2C2C2C] text-white px-8 py-3.5 text-xs uppercase tracking-[0.3em] font-bold hover:bg-[#8B735B] transition-all flex items-center justify-center gap-2 mx-auto"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                    Sign in with Google
                                </button>
                                <button
                                    onClick={() => setShowManualSearch(true)}
                                    className="mt-4 text-xs text-[#8B735B] uppercase tracking-widest font-bold hover:underline"
                                >
                                    Or search by Order ID →
                                </button>
                            </div>
                        )}

                        {/* Manual search form */}
                        {showManualSearch && (
                            <div className="bg-white border border-[#E5E5E5] p-6 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Search by Order ID</p>
                                    <button onClick={() => setShowManualSearch(false)} className="text-xs text-[#8B735B] hover:underline">← Back to login</button>
                                </div>
                                <form onSubmit={handleManualSearch} className="space-y-3">
                                    <input
                                        type="text" value={manualOrderId} onChange={e => setManualOrderId(e.target.value)}
                                        placeholder="Order ID (e.g. PO-XXXXXX)"
                                        className="w-full border border-[#E5E5E5] px-4 py-3 text-sm focus:border-[#8B735B] focus:outline-none transition-colors placeholder:text-[#CCC]" required
                                    />
                                    <input
                                        type="email" value={manualEmail} onChange={e => setManualEmail(e.target.value)}
                                        placeholder="Email used during checkout"
                                        className="w-full border border-[#E5E5E5] px-4 py-3 text-sm focus:border-[#8B735B] focus:outline-none transition-colors placeholder:text-[#CCC]" required
                                    />
                                    <button type="submit" className="w-full bg-[#2C2C2C] text-white py-3.5 text-xs uppercase tracking-[0.3em] font-bold hover:bg-[#8B735B] transition-all">
                                        Track Order
                                    </button>
                                </form>

                                {manualError && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 text-center">
                                        <p className="text-red-600 text-sm">{manualError}</p>
                                        <p className="text-[#999] text-xs mt-1">Need help? <button onClick={() => onNavigate('contact')} className="text-[#8B735B] underline">Contact us</button></p>
                                    </div>
                                )}

                                {manualSearchResult?.po && (
                                    <div className="mt-6 space-y-3">
                                        {renderProductCard(manualSearchResult.po)}
                                    </div>
                                )}
                                {manualSearchResult?.co && (
                                    <div className="mt-6 space-y-3">
                                        {renderCustomCard(manualSearchResult.co)}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default OrderTracking;
