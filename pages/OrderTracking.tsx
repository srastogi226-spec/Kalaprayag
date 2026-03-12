import React, { useState } from 'react';
import { ProductOrder, CustomOrder } from '../types';

interface OrderTrackingProps {
    productOrders: ProductOrder[];
    customOrders: CustomOrder[];
    onNavigate: (page: string) => void;
}

type TrackingStep = {
    label: string;
    description: string;
    date?: string;
    completed: boolean;
    active: boolean;
    cancelled?: boolean;
};

const OrderTracking: React.FC<OrderTrackingProps> = ({ productOrders, customOrders, onNavigate }) => {
    const [orderId, setOrderId] = useState('');
    const [email, setEmail] = useState('');
    const [searchError, setSearchError] = useState('');
    const [foundProductOrder, setFoundProductOrder] = useState<ProductOrder | null>(null);
    const [foundCustomOrder, setFoundCustomOrder] = useState<CustomOrder | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchError('');
        setFoundProductOrder(null);
        setFoundCustomOrder(null);
        setHasSearched(true);

        const trimmedId = orderId.trim();
        const trimmedEmail = email.trim().toLowerCase();

        // Search product orders
        const po = productOrders.find(
            o => o.id.toLowerCase() === trimmedId.toLowerCase() && o.customerEmail.toLowerCase() === trimmedEmail
        );
        if (po) {
            setFoundProductOrder(po);
            return;
        }

        // Search custom orders
        const co = customOrders.find(
            o => o.id.toLowerCase() === trimmedId.toLowerCase() && o.email.toLowerCase() === trimmedEmail
        );
        if (co) {
            setFoundCustomOrder(co);
            return;
        }

        setSearchError('No order found. Please check your Order ID and email address.');
    };

    const getProductOrderSteps = (order: ProductOrder): TrackingStep[] => {
        const statusOrder = ['pending', 'confirmed', 'shipped', 'delivered'];
        const currentIndex = order.status === 'cancelled' ? -1 : statusOrder.indexOf(order.status);

        const steps: TrackingStep[] = [
            {
                label: 'Order Placed',
                description: 'Your order has been received and is being reviewed.',
                date: new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                completed: currentIndex >= 0,
                active: currentIndex === 0,
            },
            {
                label: 'Confirmed',
                description: 'Your order has been confirmed and the artisan has started crafting.',
                completed: currentIndex >= 1,
                active: currentIndex === 1,
            },
            {
                label: 'Shipped',
                description: 'Your handcrafted piece is on its way to you.',
                completed: currentIndex >= 2,
                active: currentIndex === 2,
            },
            {
                label: 'Delivered',
                description: 'Your order has been delivered. Enjoy your artisan piece!',
                completed: currentIndex >= 3,
                active: currentIndex === 3,
            },
        ];

        if (order.status === 'cancelled') {
            steps.forEach(s => { s.completed = false; s.active = false; });
            steps[0].completed = true;
            steps.push({
                label: 'Cancelled',
                description: 'This order has been cancelled.',
                completed: true,
                active: true,
                cancelled: true,
            });
        }

        return steps;
    };

    const getCustomOrderSteps = (order: CustomOrder): TrackingStep[] => {
        const steps: TrackingStep[] = [
            {
                label: 'Request Submitted',
                description: 'Your custom order request has been submitted for review.',
                date: new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                completed: true,
                active: order.adminStatus === 'pending',
            },
            {
                label: 'Admin Review',
                description: order.adminStatus === 'approved'
                    ? 'Approved and assigned to artisan.'
                    : order.adminStatus === 'reassigned'
                        ? 'Reassigned to a different artisan.'
                        : 'Under review by our team.',
                completed: order.adminStatus === 'approved' || order.adminStatus === 'reassigned',
                active: order.adminStatus === 'pending',
                date: order.approvedAt ? new Date(order.approvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : undefined,
            },
            {
                label: 'Artisan Accepted',
                description: order.artisanStatus === 'accepted' || order.artisanStatus === 'completed'
                    ? `${order.assignedArtisanName} has accepted and is crafting your piece.`
                    : 'Waiting for the artisan to accept your order.',
                completed: order.artisanStatus === 'accepted' || order.artisanStatus === 'completed',
                active: order.artisanStatus === 'waiting' && order.adminStatus !== 'pending',
                date: order.acceptedAt ? new Date(order.acceptedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : undefined,
            },
            {
                label: 'Completed',
                description: 'Your custom piece is ready!',
                completed: order.artisanStatus === 'completed',
                active: order.artisanStatus === 'completed',
            },
        ];

        if (order.status === 'rejected') {
            steps.forEach(s => { s.completed = false; s.active = false; });
            steps[0].completed = true;
            steps.push({
                label: 'Declined',
                description: 'This custom order was not accepted.',
                completed: true,
                active: true,
                cancelled: true,
            });
        }

        return steps;
    };

    const renderTimeline = (steps: TrackingStep[]) => (
        <div className="relative mt-8">
            {steps.map((step, i) => (
                <div key={i} className="flex gap-4 mb-0">
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center">
                        <div
                            className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${step.cancelled
                                    ? 'bg-red-500 border-red-500'
                                    : step.completed
                                        ? 'bg-[#8B735B] border-[#8B735B]'
                                        : step.active
                                            ? 'bg-white border-[#8B735B] ring-4 ring-[#8B735B]/20'
                                            : 'bg-white border-[#D1D1D1]'
                                }`}
                        />
                        {i < steps.length - 1 && (
                            <div
                                className={`w-0.5 h-16 ${step.completed && steps[i + 1]?.completed
                                        ? 'bg-[#8B735B]'
                                        : 'bg-[#E5E5E5]'
                                    }`}
                            />
                        )}
                    </div>

                    {/* Step content */}
                    <div className={`pb-8 -mt-0.5 ${!step.completed && !step.active ? 'opacity-40' : ''}`}>
                        <div className="flex items-center gap-2">
                            <h4
                                className={`text-sm font-bold uppercase tracking-wider ${step.cancelled ? 'text-red-600' : step.completed || step.active ? 'text-[#2C2C2C]' : 'text-[#999]'
                                    }`}
                            >
                                {step.label}
                            </h4>
                            {step.active && !step.cancelled && (
                                <span className="text-[9px] uppercase tracking-widest bg-[#8B735B]/10 text-[#8B735B] px-2 py-0.5 font-bold">
                                    Current
                                </span>
                            )}
                        </div>
                        <p className="text-[#666] text-sm mt-1 font-light">{step.description}</p>
                        {step.date && (
                            <p className="text-[#999] text-xs mt-1">{step.date}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderOrderDetails = (order: ProductOrder) => (
        <div className="mt-8 border-t border-[#E5E5E5] pt-8">
            <h3 className="text-xs uppercase tracking-[0.2em] text-[#999] font-bold mb-4">Order Details</h3>
            <div className="space-y-4">
                {order.items.map((item, i) => (
                    <div key={i} className="flex gap-4 items-center">
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover bg-[#F0EDE8]" />
                        <div className="flex-1">
                            <p className="text-sm font-bold text-[#2C2C2C]">{item.name}</p>
                            <p className="text-xs text-[#999]">{item.size} · {item.finish} · Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-bold text-[#2C2C2C]">₹ {(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-dashed border-[#E5E5E5]">
                <span className="text-xs uppercase tracking-wider text-[#999] font-bold">Total</span>
                <span className="text-lg serif text-[#2C2C2C]">₹ {order.totalAmount.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6 text-xs text-[#666]">
                <div>
                    <span className="text-[#999] uppercase tracking-wider font-bold block mb-1">Shipping To</span>
                    {order.customerName}<br />
                    {order.shippingAddress}<br />
                    {order.city} — {order.pincode}
                </div>
                <div>
                    <span className="text-[#999] uppercase tracking-wider font-bold block mb-1">Payment</span>
                    {order.paymentMethod.toUpperCase()}<br />
                    <span className="text-[#999] uppercase tracking-wider font-bold block mb-1 mt-3">Order Date</span>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
            </div>
        </div>
    );

    const renderCustomOrderDetails = (order: CustomOrder) => (
        <div className="mt-8 border-t border-[#E5E5E5] pt-8">
            <h3 className="text-xs uppercase tracking-[0.2em] text-[#999] font-bold mb-4">Custom Order Details</h3>
            <div className="grid grid-cols-2 gap-4 text-xs text-[#666]">
                <div>
                    <span className="text-[#999] uppercase tracking-wider font-bold block mb-1">Category</span>
                    {order.category}
                </div>
                <div>
                    <span className="text-[#999] uppercase tracking-wider font-bold block mb-1">Artisan</span>
                    {order.assignedArtisanName}
                </div>
                <div>
                    <span className="text-[#999] uppercase tracking-wider font-bold block mb-1">Dimensions</span>
                    {order.dimensions || order.size}
                </div>
                <div>
                    <span className="text-[#999] uppercase tracking-wider font-bold block mb-1">Finish</span>
                    {order.finish}
                </div>
                <div className="col-span-2">
                    <span className="text-[#999] uppercase tracking-wider font-bold block mb-1">Concept</span>
                    {order.concept}
                </div>
            </div>
            {order.budget && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-dashed border-[#E5E5E5]">
                    <span className="text-xs uppercase tracking-wider text-[#999] font-bold">Budget</span>
                    <span className="text-lg serif text-[#2C2C2C]">₹ {order.budget.toLocaleString()}</span>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FAF9F6]">
            {/* Hero Header */}
            <div className="bg-[#2C2C2C] text-white py-20 px-6 text-center">
                <p className="text-[10px] uppercase tracking-[0.4em] text-[#8B735B] mb-4 font-bold">Kala Prayag</p>
                <h1 className="text-4xl md:text-5xl serif mb-3">Track Your Order</h1>
                <p className="text-[#999] font-light text-sm max-w-md mx-auto">
                    Enter your Order ID and email to see the latest status of your handcrafted piece.
                </p>
            </div>

            <div className="max-w-xl mx-auto px-6 py-12">
                {/* Search Form */}
                <form onSubmit={handleSearch} className="space-y-4">
                    <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-[#999] font-bold mb-2">
                            Order ID
                        </label>
                        <input
                            type="text"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            placeholder="e.g. PO-XXXXXX"
                            className="w-full border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-[#2C2C2C] focus:border-[#8B735B] focus:outline-none transition-colors placeholder:text-[#CCC]"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-[#999] font-bold mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="The email used during checkout"
                            className="w-full border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-[#2C2C2C] focus:border-[#8B735B] focus:outline-none transition-colors placeholder:text-[#CCC]"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-[#2C2C2C] text-white py-4 text-xs uppercase tracking-[0.3em] font-bold hover:bg-[#8B735B] transition-all"
                    >
                        Track Order
                    </button>
                </form>

                {/* Error */}
                {searchError && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 text-center">
                        <p className="text-red-600 text-sm">{searchError}</p>
                        <p className="text-[#999] text-xs mt-2">Need help? <button onClick={() => onNavigate('contact')} className="text-[#8B735B] underline">Contact us</button></p>
                    </div>
                )}

                {/* Product Order Result */}
                {foundProductOrder && (
                    <div className="mt-8 bg-white p-8 shadow-sm border border-[#F0EDE8]">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-[#999] font-bold">Order</p>
                                <p className="text-lg serif text-[#2C2C2C] mt-1">{foundProductOrder.id}</p>
                            </div>
                            <span className={`text-[9px] uppercase tracking-widest px-3 py-1 font-bold ${foundProductOrder.status === 'delivered' ? 'bg-green-50 text-green-700' :
                                    foundProductOrder.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                                        foundProductOrder.status === 'shipped' ? 'bg-blue-50 text-blue-700' :
                                            'bg-[#8B735B]/10 text-[#8B735B]'
                                }`}>
                                {foundProductOrder.status}
                            </span>
                        </div>

                        {renderTimeline(getProductOrderSteps(foundProductOrder))}
                        {renderOrderDetails(foundProductOrder)}
                    </div>
                )}

                {/* Custom Order Result */}
                {foundCustomOrder && (
                    <div className="mt-8 bg-white p-8 shadow-sm border border-[#F0EDE8]">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-[#999] font-bold">Custom Order</p>
                                <p className="text-lg serif text-[#2C2C2C] mt-1">{foundCustomOrder.id}</p>
                            </div>
                            <span className={`text-[9px] uppercase tracking-widest px-3 py-1 font-bold ${foundCustomOrder.status === 'completed' ? 'bg-green-50 text-green-700' :
                                    foundCustomOrder.status === 'rejected' ? 'bg-red-50 text-red-600' :
                                        'bg-[#8B735B]/10 text-[#8B735B]'
                                }`}>
                                {foundCustomOrder.status}
                            </span>
                        </div>

                        {renderTimeline(getCustomOrderSteps(foundCustomOrder))}
                        {renderCustomOrderDetails(foundCustomOrder)}
                    </div>
                )}

                {/* Empty state after search with no results */}
                {hasSearched && !foundProductOrder && !foundCustomOrder && !searchError && (
                    <div className="mt-8 text-center text-[#999] text-sm">
                        <p>Searching...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderTracking;
