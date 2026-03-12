import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import ErrorBoundary from './components/ErrorBoundary';
import AdminAuthGate from './components/AdminAuthGate';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import CustomStudio from './pages/CustomStudio';
import About from './pages/About';
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';
import ArtisanJoin from './pages/ArtisanJoin';
import ArtisanLogin from './pages/ArtisanLogin';
import ArtisanDashboard from './pages/ArtisanDashboard';
import ArtisanProfiles from './pages/ArtisanProfiles';
import Journal from './pages/Journal';
import Workshops from './pages/Workshops';
import WorkshopDetail from './pages/WorkshopDetail';
import ArtisanProfile from './pages/ArtisanProfile';
import GroupWorkshops from './pages/GroupWorkshops';
import CollectorDashboard from './pages/CollectorDashboard';
import OrderTracking from './pages/OrderTracking';
import ReviewModal from './components/ReviewModal';
import ChatWidget from './components/ChatWidget';
import InvoiceModal from './components/InvoiceModal';
import { openRazorpay } from './services/razorpay';
import { checkServiceability, getShippingRate, calculateWeight, createShipment, getEstimatedDelivery, ServiceabilityResult } from './services/delhivery';
import { Product, CustomOrder, ArtisanApplication, Artisan, Workshop, CustomRequest, Review, InstitutionRequest, ProductOrder, Message, ClassBooking, AppNotification, FavoriteArtisan, FavoriteProduct, CartItem, StudioJournalEntry, InvoiceData } from './types';
import { INITIAL_PRODUCTS, INITIAL_CUSTOM_ORDERS, INITIAL_APPLICATIONS, INITIAL_ARTISANS, INITIAL_WORKSHOPS, INITIAL_JOURNAL_ENTRIES } from './constants';
import { generateInvoiceNumber, calculateInvoiceTotals } from './utils/invoiceUtils';




const AppContent: React.FC = () => {
  const { currentUser, logout } = useAuth();

  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null);
  const [selectedArtisanId, setSelectedArtisanId] = useState<string | null>(null);
  const [preSelectedStudioArtisanId, setPreSelectedStudioArtisanId] = useState<string | null>(null);

  // ── Firestore state ────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [applications, setApplications] = useState<ArtisanApplication[]>([]);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [journalEntries, setJournalEntries] = useState<StudioJournalEntry[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomRequest[]>([]);
  const [institutionRequests, setInstitutionRequests] = useState<InstitutionRequest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [productOrders, setProductOrders] = useState<ProductOrder[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [classBookings, setClassBookings] = useState<ClassBooking[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [favoriteArtisans, setFavoriteArtisans] = useState<FavoriteArtisan[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<FavoriteProduct[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(null);
  const [reviewTargetId, setReviewTargetId] = useState('');
  const [reviewAuthorName, setReviewAuthorName] = useState('');

  // ── Cart & Purchase state ──────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ name: '', email: '', phone: '', address: '', city: '', pincode: '', state: '', payment: 'razorpay' });
  const [checkoutPaymentId, setCheckoutPaymentId] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutProcessing, setCheckoutProcessing] = useState(false);
  const [justPlacedOrderId, setJustPlacedOrderId] = useState('');
  // Shipping
  const [shippingCheck, setShippingCheck] = useState<ServiceabilityResult | null>(null);
  const [shippingChecking, setShippingChecking] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [shippingCost, setShippingCost] = useState(0);
  const [checkoutAwb, setCheckoutAwb] = useState('');
  const [checkoutEstDelivery, setCheckoutEstDelivery] = useState('');

  const handleAddToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.findIndex(c => c.productId === item.productId && c.size === item.size && c.finish === item.finish);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + item.quantity };
        return updated;
      }
      return [...prev, item];
    });
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const updateCartQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index] = { ...updated[index], quantity: newQty };
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // ── Firestore Subscriptions & Seeding ──────────────────────────────────
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), snapshot => {
      const data = snapshot.docs.map(doc => doc.data() as Product);
      if (data.length === 0 && INITIAL_PRODUCTS.length > 0) {
        INITIAL_PRODUCTS.forEach(p => setDoc(doc(db, 'products', p.id), p));
      } else {
        setProducts(data);
      }
    });

    const unsubOrders = onSnapshot(collection(db, 'customOrders'), snapshot => {
      const data = snapshot.docs.map(doc => doc.data() as CustomOrder);
      if (data.length === 0 && INITIAL_CUSTOM_ORDERS.length > 0) {
        INITIAL_CUSTOM_ORDERS.forEach(o => setDoc(doc(db, 'customOrders', o.id), o));
      } else {
        setCustomOrders(data);
      }
    });

    const unsubApps = onSnapshot(collection(db, 'applications'), snapshot => {
      setApplications(snapshot.docs.map(doc => doc.data() as ArtisanApplication));
    });

    const unsubArtisans = onSnapshot(collection(db, 'artisans'), snapshot => {
      const data = snapshot.docs.map(doc => doc.data() as Artisan);
      if (data.length === 0 && INITIAL_ARTISANS.length > 0) {
        INITIAL_ARTISANS.forEach(a => setDoc(doc(db, 'artisans', a.id), a));
      } else {
        setArtisans(data);
      }
    });

    const unsubWorkshops = onSnapshot(collection(db, 'workshops'), snapshot => {
      const data = snapshot.docs.map(doc => doc.data() as Workshop);
      if (data.length === 0 && INITIAL_WORKSHOPS.length > 0) {
        INITIAL_WORKSHOPS.forEach(w => setDoc(doc(db, 'workshops', w.id), w));
      } else {
        setWorkshops(data);
      }
    });

    const unsubJournal = onSnapshot(collection(db, 'journal'), snapshot => {
      const data = snapshot.docs.map(doc => doc.data() as StudioJournalEntry);
      if (data.length === 0 && INITIAL_JOURNAL_ENTRIES.length > 0) {
        INITIAL_JOURNAL_ENTRIES.forEach(j => setDoc(doc(db, 'journal', j.id), j));
      } else {
        setJournalEntries(data);
      }
    });

    const unsubCustomReq = onSnapshot(collection(db, 'customRequests'), snapshot => {
      setCustomRequests(snapshot.docs.map(doc => doc.data() as CustomRequest));
    });

    const unsubInstReq = onSnapshot(collection(db, 'institutionRequests'), snapshot => {
      setInstitutionRequests(snapshot.docs.map(doc => doc.data() as InstitutionRequest));
    });

    const unsubReviews = onSnapshot(collection(db, 'reviews'), snapshot => {
      setReviews(snapshot.docs.map(doc => doc.data() as Review));
    });

    const unsubProductOrders = onSnapshot(collection(db, 'productOrders'), snapshot => {
      setProductOrders(snapshot.docs.map(doc => doc.data() as ProductOrder));
    });

    const unsubMessages = onSnapshot(collection(db, 'messages'), snapshot => {
      setMessages(snapshot.docs.map(doc => doc.data() as Message));
    });

    const unsubBookings = onSnapshot(collection(db, 'classBookings'), snapshot => {
      setClassBookings(snapshot.docs.map(doc => doc.data() as ClassBooking));
    });

    const unsubNotifs = onSnapshot(collection(db, 'notifications'), snapshot => {
      setNotifications(snapshot.docs.map(doc => doc.data() as AppNotification));
    });

    const unsubFavs = onSnapshot(collection(db, 'favoriteArtisans'), snapshot => {
      setFavoriteArtisans(snapshot.docs.map(doc => doc.data() as FavoriteArtisan));
    });

    const unsubFavProducts = onSnapshot(collection(db, 'favoriteProducts'), snapshot => {
      setFavoriteProducts(snapshot.docs.map(doc => doc.data() as FavoriteProduct));
    });

    const unsubInvoices = onSnapshot(collection(db, 'invoices'), snapshot => {
      setInvoices(snapshot.docs.map(doc => doc.data() as InvoiceData));
    });

    return () => {
      unsubProducts(); unsubOrders(); unsubApps(); unsubArtisans();
      unsubWorkshops(); unsubJournal(); unsubCustomReq(); unsubInstReq(); unsubReviews();
      unsubProductOrders(); unsubMessages(); unsubBookings(); unsubNotifs(); unsubFavs(); unsubFavProducts();
      unsubInvoices();
    };
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [currentPage, selectedProductId, selectedWorkshopId, selectedArtisanId]);

  // ── URL path helpers ────────────────────────────────────────────────────
  const pageToPath = (page: string, entityId?: string | null): string => {
    const map: Record<string, string> = {
      home: '/',
      shop: '/shop',
      workshops: '/workshops',
      'group-workshops': '/workshops/group',
      'artisan-profiles': '/makers',
      journal: '/journal',
      studio: '/custom-studio',
      about: '/about',
      contact: '/contact',
      'artisan-join': '/artisan/join',
      'artisan-login': '/login',
      'artisan-dashboard': '/dashboard',
      admin: '/admin',
      'track-order': '/track',
      'product-detail': entityId ? `/product/${entityId}` : '/shop',
      'workshop-detail': entityId ? `/workshop/${entityId}` : '/workshops',
      'artisan-profile': entityId ? `/maker/${entityId}` : '/makers',
    };
    return map[page] || '/';
  };

  const pathToState = (pathname: string) => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return { page: 'home' };
    if (parts[0] === 'product' && parts[1]) return { page: 'product-detail', productId: parts[1] };
    if (parts[0] === 'workshop' && parts[1]) return { page: 'workshop-detail', workshopId: parts[1] };
    if (parts[0] === 'maker' && parts[1]) return { page: 'artisan-profile', artisanId: parts[1] };
    const reverseMap: Record<string, string> = {
      shop: 'shop',
      workshops: 'workshops',
      makers: 'artisan-profiles',
      journal: 'journal',
      'custom-studio': 'studio',
      about: 'about',
      contact: 'contact',
      login: 'artisan-login',
      dashboard: 'artisan-dashboard',
      admin: 'admin',
      track: 'track-order',
    };
    if (parts[0] === 'artisan' && parts[1] === 'join') return { page: 'artisan-join' };
    if (parts[0] === 'workshops' && parts[1] === 'group') return { page: 'group-workshops' };
    return { page: reverseMap[parts[0]] || 'home' };
  };

  // Parse initial URL on mount
  useEffect(() => {
    const state = pathToState(window.location.pathname);
    setCurrentPage(state.page);
    if ('productId' in state) setSelectedProductId(state.productId as string);
    if ('workshopId' in state) setSelectedWorkshopId(state.workshopId as string);
    if ('artisanId' in state) setSelectedArtisanId(state.artisanId as string);

    const handlePopState = () => {
      const s = pathToState(window.location.pathname);
      setCurrentPage(s.page);
      setSelectedProductId('productId' in s ? (s.productId as string) : null);
      setSelectedWorkshopId('workshopId' in s ? (s.workshopId as string) : null);
      setSelectedArtisanId('artisanId' in s ? (s.artisanId as string) : null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (page: string) => {
    setCurrentPage(page);
    setSelectedProductId(null);
    setSelectedWorkshopId(null);
    setSelectedArtisanId(null);
    if (page !== 'custom-studio') {
      setPreSelectedStudioArtisanId(null);
    }
    window.history.pushState(null, '', pageToPath(page));
  };

  const navigateToCustomStudioForArtisan = (artisanId: string) => {
    setPreSelectedStudioArtisanId(artisanId);
    setSelectedArtisanId(null);
    setSelectedProductId(null);
    setSelectedWorkshopId(null);
    setCurrentPage('studio');
    window.history.pushState(null, '', '/custom-studio');
    window.scrollTo(0, 0);
  };

  // ── The artisan currently logged in via Firebase ───────────────────────
  const loggedInArtisan = currentUser
    ? artisans.find(a => a.id === currentUser.uid) || null
    : null;

  // ── Derived data — only admin-approved items are public ───────────────
  const approvedProducts = products.filter(p => p.status === 'approved');
  const approvedWorkshops = workshops.filter(w => w.status === 'approved');
  const approvedArtisans = artisans.filter(a => a.status === 'approved' || !a.status);

  // ── Handlers ───────────────────────────────────────────────────────────
  const triggerNotification = (userId: string, title: string, message: string, type: 'order' | 'workshop' | 'message' | 'system', link?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setDoc(doc(db, 'notifications', id), {
      id, userId, title, message, type, link, status: 'unread', createdAt: new Date().toISOString()
    }).catch(console.error);
  };

  const handleArtisanApplication = (app: ArtisanApplication) => {
    setDoc(doc(db, 'applications', app.id), app).catch(err => alert("Error saving application: " + err.message));
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setDoc(doc(db, 'notifications', id), { status: 'read' }, { merge: true }).catch(console.error);
  };

  const handleMarkAllNotificationsAsRead = (uid: string) => {
    notifications
      .filter(n => n.userId === uid && n.status === 'unread')
      .forEach(n => handleMarkNotificationAsRead(n.id));
  };

  const handleAcceptOrder = (orderId: string, note: string) => {
    const order = customOrders.find(o => o.id === orderId);
    if (order) {
      const updated = {
        ...order, artisanStatus: 'accepted' as const,
        status: 'accepted' as const, artisanNote: note,
        acceptedAt: new Date().toISOString(),
      };
      setDoc(doc(db, 'customOrders', orderId), updated)
        .then(() => {
          // Clear any notifications for the artisan about this order
          notifications
            .filter(n => n.userId === currentUser?.uid && n.status === 'unread' && (n.message.includes(orderId) || n.type === 'order'))
            .forEach(n => handleMarkNotificationAsRead(n.id));

          triggerNotification(updated.email, 'Standard Commission Accepted', `Your custom request has been accepted by ${loggedInArtisan?.brandName || loggedInArtisan?.name}`, 'order', 'collector-dashboard');
        })
        .catch(err => alert("Error updating order: " + err.message));
    }
  };

  const handleAddProduct = (p: Product) => {
    const pWithStatus = { ...p, status: 'pending' as const };
    setDoc(doc(db, 'products', p.id), pWithStatus).catch(err => alert("Error adding product: " + err.message));
  };

  const handleUpdateProduct = (updated: Product) => {
    const pWithStatus = { ...updated, status: 'pending' as const };
    setDoc(doc(db, 'products', updated.id), pWithStatus).catch(err => alert("Error updating product: " + err.message));
  };

  const handleAddWorkshop = (w: Workshop) => {
    const wWithStatus = { ...w, status: 'pending' as const };
    setDoc(doc(db, 'workshops', w.id), wWithStatus).catch(err => alert("Error adding workshop: " + err.message));
  };

  const handleUpdateWorkshop = (updated: Workshop) => {
    const wWithStatus = { ...updated, status: 'pending' as const };
    setDoc(doc(db, 'workshops', updated.id), wWithStatus).catch(err => alert("Error updating workshop: " + err.message));
  };

  const handleUpdateArtisan = (updated: Artisan) => {
    setDoc(doc(db, 'artisans', updated.id), updated).catch(err => alert("Error saving profile: " + err.message));
  };

  const handleSendMessage = (msg: Message) => {
    setDoc(doc(db, 'messages', msg.id), msg)
      .then(() => {
        triggerNotification(msg.receiverId, 'New Message', `You received a message from ${msg.senderName}`, 'message', 'artisan-dashboard');
        alert("Message sent successfully!");
      })
      .catch(err => alert("Error sending message: " + err.message));
  };

  const handleUpdateMessage = (updated: Message) => {
    setDoc(doc(db, 'messages', updated.id), updated).catch(err => alert("Error updating message: " + err.message));
  };

  const handleBookingWorkshop = (booking: ClassBooking) => {
    setDoc(doc(db, 'classBookings', booking.id), booking)
      .then(() => {
        // Generate Invoice
        const totals = calculateInvoiceTotals([{ quantity: 1, unitPrice: booking.amount }]);
        const invoice: InvoiceData = {
          id: 'INV-' + booking.id,
          invoiceNumber: generateInvoiceNumber(),
          invoiceDate: new Date().toISOString(),
          orderType: 'workshop',
          orderId: booking.id,
          customer: {
            name: booking.customerName,
            email: booking.customerEmail,
            phone: booking.customerPhone,
          },
          items: [{
            description: `Workshop: ${booking.workshopTitle}`,
            quantity: 1,
            unitPrice: booking.amount,
            total: booking.amount
          }],
          subtotal: totals.subtotal,
          gst: totals.gstRate,
          gstAmount: totals.gstAmount,
          totalAmount: totals.totalAmount,
          payment: {
            method: booking.method,
            status: 'paid',
            paidAmount: totals.totalAmount,
            bookingId: booking.id
          },
          createdAt: new Date().toISOString()
        };
        setDoc(doc(db, 'invoices', invoice.id), invoice);
        setCurrentInvoice(invoice);

        triggerNotification(booking.artisanId, 'New Workshop Booking', `${booking.customerName} has reserved a seat for ${booking.workshopTitle}`, 'workshop', 'artisan-dashboard');
        if (currentUser) {
          triggerNotification(currentUser.uid, 'Booking Confirmed', `Your seat for ${booking.workshopTitle} is reserved!`, 'workshop', 'artisan-dashboard');
        }
      })
      .catch(err => alert("Error saving booking: " + err.message));
  };

  const handleLeaveReview = (targetId: string, authorName: string) => {
    setReviewTargetId(targetId);
    setReviewAuthorName(authorName);
    setIsReviewModalOpen(true);
  };

  const handlePlaceProductOrder = (order: ProductOrder) => {
    setDoc(doc(db, 'productOrders', order.id), order)
      .then(() => {
        // Generate Invoice
        const totals = calculateInvoiceTotals(order.items.map(i => ({ quantity: i.quantity, unitPrice: i.price })));
        const invoice: InvoiceData = {
          id: 'INV-' + order.id,
          invoiceNumber: generateInvoiceNumber(),
          invoiceDate: new Date().toISOString(),
          orderType: 'shop',
          orderId: order.id,
          customer: {
            name: order.customerName,
            email: order.customerEmail,
            phone: order.customerPhone,
            address: `${order.shippingAddress}, ${order.city} - ${order.pincode}`,
          },
          items: order.items.map(i => ({
            description: i.name,
            quantity: i.quantity,
            unitPrice: i.price,
            total: i.price * i.quantity
          })),
          subtotal: totals.subtotal,
          gst: totals.gstRate,
          gstAmount: totals.gstAmount,
          totalAmount: totals.totalAmount,
          payment: {
            method: order.paymentMethod,
            status: order.paymentMethod === 'cod' ? 'pending' : 'paid',
            paidAmount: order.paymentMethod === 'cod' ? 0 : totals.totalAmount,
            bookingId: order.id
          },
          createdAt: new Date().toISOString()
        };
        setDoc(doc(db, 'invoices', invoice.id), invoice);
        setCurrentInvoice(invoice);

        if (order.artisanId) {
          triggerNotification(order.artisanId, 'New Masterpiece Sale', `You have a new order from ${order.customerName}`, 'order', 'artisan-dashboard');
        }
        if (currentUser) {
          triggerNotification(currentUser.uid, 'Order Confirmed', `Your order ${order.id} has been placed successfully!`, 'order', 'artisan-dashboard');
        }
      })
      .catch(err => alert("Error placing order: " + err.message));
  };

  const handleUpdateCustomOrder = (updated: CustomOrder) => {
    setDoc(doc(db, 'customOrders', updated.id), updated).catch(err => alert("Error updating order: " + err.message));
  };

  const handlePlaceCustomOrder = (order: CustomOrder) => {
    setDoc(doc(db, 'customOrders', order.id), order)
      .then(() => {
        // Generate Invoice (Advance Payment)
        const totals = calculateInvoiceTotals([{ quantity: 1, unitPrice: order.advancePayment.amount }]);
        const invoice: InvoiceData = {
          id: 'INV-' + order.id,
          invoiceNumber: generateInvoiceNumber(),
          invoiceDate: new Date().toISOString(),
          orderType: 'custom',
          orderId: order.id,
          customer: {
            name: order.customerName,
            email: order.email,
            phone: order.phone,
          },
          items: [{
            description: `Custom Commission Advance: ${order.category}`,
            quantity: 1,
            unitPrice: order.advancePayment.amount,
            total: order.advancePayment.amount
          }],
          subtotal: totals.subtotal,
          gst: totals.gstRate,
          gstAmount: totals.gstAmount,
          totalAmount: totals.totalAmount,
          payment: {
            method: order.advancePayment.method,
            status: 'partial',
            paidAmount: totals.totalAmount,
            bookingId: order.id
          },
          createdAt: new Date().toISOString()
        };
        setDoc(doc(db, 'invoices', invoice.id), invoice);
        setCurrentInvoice(invoice);
      })
      .catch(err => alert("Error saving custom order: " + err.message));
  };

  const handleUpdateProductOrder = (updated: ProductOrder) => {
    setDoc(doc(db, 'productOrders', updated.id), updated).catch(err => alert("Error updating order: " + err.message));
  };

  const handleSubmitReview = (review: Partial<Review>) => {
    setDoc(doc(db, 'reviews', review.id!), review).catch(err => alert("Error submitting review: " + err.message));
  };

  const viewProduct = (id: string) => { setSelectedWorkshopId(null); setSelectedArtisanId(null); setSelectedProductId(id); setCurrentPage('product-detail'); window.history.pushState(null, '', `/product/${id}`); };
  const viewWorkshop = (id: string) => { setSelectedProductId(null); setSelectedArtisanId(null); setSelectedWorkshopId(id); setCurrentPage('workshop-detail'); window.history.pushState(null, '', `/workshop/${id}`); };
  const viewArtisan = (id: string) => { setSelectedProductId(null); setSelectedWorkshopId(null); setSelectedArtisanId(id); setCurrentPage('artisan-profile'); window.history.pushState(null, '', `/maker/${id}`); };

  const handleLogout = () => {
    logout().then(() => {
      navigateTo('home');
    });
  };

  // ── Artisan dashboard renderer ─────────────────────────────────────────
  const renderArtisanDashboard = () => {
    if (!currentUser) {
      return <ArtisanLogin onSuccess={() => navigateTo('artisan-dashboard')} onJoin={() => navigateTo('artisan-join')} />;
    }
    if (!loggedInArtisan) {
      const hasApplication = applications.some(a => a.id === currentUser.uid);

      if (!hasApplication) {
        return (
          <div className="pt-48 pb-32 text-center animate-in fade-in duration-700 px-6">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-4xl serif mb-4">No Application Found</h2>
            <p className="text-[#666] max-w-md mx-auto mb-2">Hi <strong>{currentUser.email}</strong> — you logged in but haven't submitted an artisan application yet.</p>
            <p className="text-[#999] text-sm max-w-md mx-auto mb-8">You need to submit your portfolio and brand details first.</p>
            <div className="flex justify-center gap-6">
              <button onClick={() => navigateTo('artisan-join')} className="bg-[#2C2C2C] text-white px-6 py-2 text-xs uppercase tracking-widest font-bold">
                Apply Now
              </button>
              <button
                onClick={async () => {
                  if (window.confirm("Are you sure you want to delete your account to start over?")) {
                    try { await currentUser.delete(); } catch (e) { handleLogout(); }
                  }
                }}
                className="text-xs text-red-500 uppercase tracking-widest border-b border-red-500 pb-1 hover:text-red-700 hover:border-red-700 transition-all">
                Delete Account
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="pt-48 pb-32 text-center animate-in fade-in duration-700 px-6">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-4xl serif mb-4">Application Under Review</h2>
          <p className="text-[#666] max-w-md mx-auto mb-2">Hi <strong>{currentUser.email}</strong> — your application is being reviewed.</p>
          <p className="text-[#999] text-sm max-w-md mx-auto mb-8">Our team will approve your account within 5 business days.</p>
          <div className="flex justify-center gap-6 items-center">
            <button onClick={handleLogout} className="text-xs uppercase tracking-widest text-[#2C2C2C] border-b border-[#2C2C2C] pb-1 hover:text-[#8B735B] hover:border-[#8B735B] transition-all">
              Sign Out
            </button>
            <button
              onClick={async () => {
                if (window.confirm("Are you sure you want to cancel your application and delete your account?")) {
                  try {
                    await currentUser.delete();
                    import('firebase/firestore').then(({ deleteDoc, doc }) => {
                      deleteDoc(doc(db, 'applications', currentUser.uid));
                    });
                    await handleLogout();
                  } catch (e) {
                    alert("Could not delete account since you just logged in. Try signing out and signing back in first.");
                    handleLogout();
                  }
                }
              }}
              className="text-xs text-red-500 uppercase tracking-widest border-b border-red-500 pb-1 hover:text-red-700 hover:border-red-700 transition-all">
              Withdraw & Reset
            </button>
          </div>
        </div>
      );
    }
    return (
      <ArtisanDashboard
        artisan={loggedInArtisan}
        products={products} workshops={workshops}
        reviews={reviews}
        customOrders={customOrders}
        productOrders={productOrders}
        onAcceptOrder={handleAcceptOrder}
        onAddProduct={handleAddProduct}
        onAddWorkshop={handleAddWorkshop}
        onUpdateWorkshop={handleUpdateWorkshop}
        onUpdateArtisan={handleUpdateArtisan}
        onUpdateProduct={handleUpdateProduct}
        onUpdateCustomOrder={handleUpdateCustomOrder}
        onUpdateProductOrder={handleUpdateProductOrder}
        messages={messages.filter(m => m.receiverId === loggedInArtisan.id)}
        onUpdateMessage={handleUpdateMessage}
        classBookings={classBookings.filter(b => b.artisanId === loggedInArtisan.id)}
        notifications={notifications}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onLogout={handleLogout}
      />
    );
  };

  // ── Page renderer ──────────────────────────────────────────────────────
  const renderPage = () => {
    if (selectedProductId) {
      const product = approvedProducts.find(p => p.id === selectedProductId);
      if (product) return (
        <ProductDetail
          product={product}
          onBack={() => navigateTo('shop')}
          onAddToCart={handleAddToCart}
          cart={cart}
          onToggleCart={() => setShowCart(true)}
        />
      );
    }
    if (selectedWorkshopId) {
      const workshop = approvedWorkshops.find(w => w.id === selectedWorkshopId);
      if (workshop) return (
        <WorkshopDetail
          workshop={workshop}
          artisans={artisans}
          onBack={() => navigateTo('workshops')}
          onViewArtisan={viewArtisan}
          loggedInArtisan={loggedInArtisan}
          onUpdateWorkshop={handleUpdateWorkshop}
          onBookingWorkshop={handleBookingWorkshop}
          classBookings={classBookings}
          onViewInvoice={() => setIsInvoiceModalOpen(true)}
        />
      );
    }
    if (selectedArtisanId) {
      const artisan = approvedArtisans.find(a => a.id === selectedArtisanId);
      if (artisan) return (
        <ArtisanProfile
          artisan={artisan}
          products={approvedProducts.filter(p => p.artisanId === artisan.id)}
          workshops={approvedWorkshops.filter(w => w.artisanId === artisan.id)}
          reviews={reviews.filter(r => r.targetId === artisan.id && r.status === 'approved')}
          onViewProduct={viewProduct}
          onViewWorkshop={viewWorkshop}
          onRequestCustomPiece={navigateToCustomStudioForArtisan}
          onSendMessage={handleSendMessage}
          onAddToCart={handleAddToCart}
          cart={cart}
        />
      );
    }

    switch (currentPage) {
      case 'home':
        return <Home
          products={approvedProducts}
          onViewProduct={viewProduct}
          onNavigate={navigateTo}
          artisans={approvedArtisans}
          onViewArtisan={viewArtisan}
          onAddToCart={handleAddToCart}
          onToggleCart={() => setShowCart(true)}
        />;
      case 'shop':
        return (
          <Shop
            products={approvedProducts}
            onViewProduct={viewProduct}
            onAddToCart={handleAddToCart}
            onToggleCart={() => setShowCart(true)}
          />
        );
      case 'workshops':
        return <Workshops
          workshops={approvedWorkshops}
          artisans={artisans}
          classBookings={classBookings}
          onViewWorkshop={viewWorkshop}
          onNavigate={navigateTo}
        />;
      case 'group-workshops':
        return <GroupWorkshops
          workshops={approvedWorkshops}
          artisans={artisans}
          onSubmitInstitutionRequest={(req) => setDoc(doc(db, 'institutionRequests', req.id), req)}
          onBack={() => navigateTo('workshops')}
        />;
      case 'artisan-profiles':
        return <ArtisanProfiles artisans={approvedArtisans} onViewArtisan={viewArtisan} />;
      case 'journal':
        return <Journal entries={journalEntries} />;
      case 'studio':
        return <CustomStudio
          onSubmitOrder={handlePlaceCustomOrder}
          artisans={approvedArtisans}
          preSelectedArtisanId={preSelectedStudioArtisanId}
          onViewInvoice={() => setIsInvoiceModalOpen(true)}
        />;
      case 'track-order':
        return <OrderTracking productOrders={productOrders} customOrders={customOrders} onNavigate={navigateTo} justPlacedOrderId={justPlacedOrderId} />;
      case 'about': return <About />;
      case 'contact': return <Contact />;
      case 'artisan-join': return <ArtisanJoin onApply={handleArtisanApplication} />;
      case 'artisan-login':
        if (currentUser) {
          if (loggedInArtisan) return renderArtisanDashboard();
          return (
            <CollectorDashboard
              userEmail={currentUser.email || ''}
              userId={currentUser.uid}
              customOrders={customOrders}
              productOrders={productOrders}
              classBookings={classBookings}
              favoriteArtisans={favoriteArtisans}
              favoriteProducts={favoriteProducts}
              artisans={artisans}
              products={products}
              notifications={notifications}
              reviews={reviews}
              onLeaveReview={handleLeaveReview}
              onMarkNotificationAsRead={handleMarkNotificationAsRead}
              onLogout={handleLogout}
            />
          );
        }
        return <ArtisanLogin onSuccess={() => navigateTo('artisan-dashboard')} onJoin={() => navigateTo('artisan-join')} />;
      case 'artisan-dashboard':
        if (loggedInArtisan) return renderArtisanDashboard();
        if (currentUser) {
          return (
            <CollectorDashboard
              userEmail={currentUser.email || ''}
              userId={currentUser.uid}
              customOrders={customOrders}
              productOrders={productOrders}
              classBookings={classBookings}
              favoriteArtisans={favoriteArtisans}
              favoriteProducts={favoriteProducts}
              artisans={artisans}
              products={products}
              notifications={notifications}
              reviews={reviews}
              onLeaveReview={handleLeaveReview}
              onMarkNotificationAsRead={handleMarkNotificationAsRead}
              onLogout={handleLogout}
            />
          );
        }
        return renderArtisanDashboard();
      case 'admin':
        return (
          <AdminAuthGate>
            <AdminDashboard
              products={products} setProducts={setProducts}
              orders={customOrders} setOrders={setCustomOrders}
              applications={applications} setApplications={setApplications}
              artisans={artisans} setArtisans={setArtisans}
              workshops={workshops} setWorkshops={setWorkshops}
              journalEntries={journalEntries}
              reviews={reviews} setReviews={setReviews}
              customRequests={customRequests}
              institutionRequests={institutionRequests}
              setInstitutionRequests={setInstitutionRequests}
              productOrders={productOrders}
              invoices={invoices}
            />
          </AdminAuthGate>
        );
      default:
        return <Home products={approvedProducts} onViewProduct={viewProduct} onNavigate={navigateTo} artisans={approvedArtisans} onViewArtisan={viewArtisan} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-[#8B735B]/30 selection:text-[#2C2C2C]">
      <Navbar
        onNavigate={navigateTo}
        currentPage={currentPage}
        unreadNotificationsCount={notifications.filter(n => n.userId === (currentUser?.uid || '') && n.status === 'unread').length}
        cartCount={cartCount}
        onToggleCart={() => setShowCart(true)}
      />
      <main className="flex-grow">{renderPage()}</main>
      <Footer onNavigate={navigateTo} />

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmit={handleSubmitReview}
        targetId={reviewTargetId}
        authorName={reviewAuthorName}
      />

      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoice={currentInvoice}
      />

      {/* Global Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-[300] flex">
          <div className="flex-1 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="w-full max-w-md bg-white h-full overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
            <div className="flex justify-between items-center p-8 border-b border-[#E5E5E5]">
              <h2 className="text-xl serif">Your Cart ({cartCount})</h2>
              <button onClick={() => setShowCart(false)} className="text-[#999] hover:text-[#2C2C2C]">✕</button>
            </div>
            <div className="flex-1 p-8 space-y-6 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-center text-[#999] serif italic text-xl py-20">Your cart is empty</p>
              ) : cart.map((item, i) => (
                <div key={i} className="flex gap-4 border-b border-[#F0F0F0] pb-6 group">
                  <img src={item.image} className="w-20 h-20 object-cover flex-shrink-0" alt={item.name} />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium">{item.name}</p>
                        <button
                          onClick={() => removeFromCart(i)}
                          className="text-[#999] hover:text-red-500 transition-colors p-1"
                          title="Remove item"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-[10px] text-[#999] uppercase tracking-widest mt-0.5">{item.size} · {item.finish}</p>
                    </div>

                    <div className="flex justify-between items-end mt-2">
                      <div className="flex items-center border border-[#E5E5E5] rounded-sm">
                        <button
                          onClick={() => updateCartQuantity(i, -1)}
                          className="px-2 py-1 text-[#999] hover:bg-gray-50 transition-colors border-r border-[#E5E5E5]"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-[11px] font-medium min-w-[30px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(i, 1)}
                          className="px-2 py-1 text-[#999] hover:bg-gray-50 transition-colors border-l border-[#E5E5E5]"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-sm font-bold text-[#2C2C2C]">₹ {(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="p-8 border-t border-[#E5E5E5] space-y-4">
                <div className="flex justify-between text-sm font-bold">
                  <span className="uppercase tracking-widest">Total</span>
                  <span className="text-lg serif">₹ {cartTotal.toLocaleString()}</span>
                </div>
                <button onClick={() => { setShowCart(false); setShowCheckout(true); }} className="w-full bg-[#2C2C2C] text-white py-4 text-xs uppercase tracking-[0.3em] font-bold hover:bg-[#8B735B] transition-all">
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-[400] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in duration-300">
            {orderPlaced ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-3xl serif mb-4">Order Confirmed!</h2>
                <p className="text-[#666] font-light mb-2">Thank you, {checkoutForm.name}.</p>
                {checkoutPaymentId && <p className="text-[10px] uppercase tracking-widest text-[#8B735B] mb-1">Payment ID: <span className="font-mono">{checkoutPaymentId}</span></p>}
                {checkoutAwb && (
                  <div className="bg-[#FAF9F6] border border-[#E5E5E5] p-4 mb-4 text-left text-sm space-y-2">
                    <div className="flex justify-between"><span className="text-[#999]">AWB Number</span><span className="font-mono font-bold text-[#2C2C2C]">{checkoutAwb}</span></div>
                    {checkoutEstDelivery && <div className="flex justify-between"><span className="text-[#999]">Est. Delivery</span><span className="font-medium">{checkoutEstDelivery}</span></div>}
                    <div className="flex items-center gap-2 text-[10px] text-emerald-700 uppercase tracking-widest pt-1 border-t border-[#E5E5E5]">
                      <span>📦</span> Handed to Delhivery for shipping
                    </div>
                  </div>
                )}
                <p className="text-[#999] text-sm mb-6">A confirmation will be sent to {checkoutForm.email}.</p>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => setIsInvoiceModalOpen(true)}
                    className="w-full border border-dark py-4 text-xs font-bold uppercase tracking-widest hover:bg-dark hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    View Invoice
                  </button>
                  <button
                    onClick={() => {
                      setShowCheckout(false);
                      setOrderPlaced(false);
                      navigateTo('track-order');
                    }}
                    className="w-full border border-[#8B735B] text-[#8B735B] py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#8B735B] hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                    Track My Order
                  </button>
                  <button
                    onClick={() => {
                      setShowCheckout(false);
                      setOrderPlaced(false);
                      setCart([]);
                      navigateTo('shop');
                    }}
                    className="bg-[#2C2C2C] text-white px-10 py-4 text-xs uppercase tracking-widest font-bold hover:bg-[#8B735B] transition-all"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl serif">Checkout</h2>
                  <button onClick={() => setShowCheckout(false)} className="text-[#999] hover:text-[#2C2C2C]">✕</button>
                </div>

                <div className="bg-[#FAF9F6] p-4 mb-8 space-y-2">
                  <p className="text-xs uppercase tracking-widest font-bold text-[#999] mb-3">Order Summary</p>
                  {cart.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-[#4A4A4A]">{item.name} × {item.quantity}</span>
                      <span className="font-medium">₹ {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  {shippingCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#4A4A4A]">Shipping ({shippingMethod === 'express' ? 'Express' : 'Standard'})</span>
                      <span className="font-medium">₹ {shippingCost.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-[#E5E5E5] pt-2 flex justify-between font-bold">
                    <span className="text-xs uppercase tracking-widest">Total</span>
                    <span>₹ {(cartTotal + shippingCost).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <p className="text-xs uppercase tracking-widest font-bold text-[#999]">Delivery Details</p>
                  <input placeholder="Full Name *" value={checkoutForm.name} onChange={e => setCheckoutForm(p => ({ ...p, name: e.target.value }))} className="w-full border border-[#E5E5E5] p-3 text-sm focus:outline-none focus:border-[#2C2C2C]" />
                  <input placeholder="Email *" value={checkoutForm.email} onChange={e => setCheckoutForm(p => ({ ...p, email: e.target.value }))} className="w-full border border-[#E5E5E5] p-3 text-sm focus:outline-none focus:border-[#2C2C2C]" />
                  <input placeholder="Phone" value={checkoutForm.phone} onChange={e => setCheckoutForm(p => ({ ...p, phone: e.target.value }))} className="w-full border border-[#E5E5E5] p-3 text-sm focus:outline-none focus:border-[#2C2C2C]" />
                  <textarea placeholder="Delivery Address *" rows={2} value={checkoutForm.address} onChange={e => setCheckoutForm(p => ({ ...p, address: e.target.value }))} className="w-full border border-[#E5E5E5] p-3 text-sm focus:outline-none focus:border-[#2C2C2C] resize-none" />
                  <input placeholder="State" value={checkoutForm.state} onChange={e => setCheckoutForm(p => ({ ...p, state: e.target.value }))} className="w-full border border-[#E5E5E5] p-3 text-sm focus:outline-none focus:border-[#2C2C2C]" />
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="City" value={checkoutForm.city} onChange={e => setCheckoutForm(p => ({ ...p, city: e.target.value }))} className="w-full border border-[#E5E5E5] p-3 text-sm focus:outline-none focus:border-[#2C2C2C]" />
                    <input placeholder="Pincode" value={checkoutForm.pincode} onChange={e => {
                      setCheckoutForm(p => ({ ...p, pincode: e.target.value }));
                      setShippingCheck(null);
                      setShippingCost(0);
                    }} className="w-full border border-[#E5E5E5] p-3 text-sm focus:outline-none focus:border-[#2C2C2C]" />
                  </div>
                </div>

                {/* ── Shipping Section ── */}
                <div className="mb-8">
                  <p className="text-xs uppercase tracking-widest font-bold text-[#999] mb-3">Shipping</p>
                  {!shippingCheck ? (
                    <button
                      onClick={async () => {
                        if (checkoutForm.pincode.length < 6) { setCheckoutError('Enter a valid 6-digit pincode'); return; }
                        setShippingChecking(true); setCheckoutError('');
                        const result = await checkServiceability(checkoutForm.pincode);
                        setShippingCheck(result);
                        setShippingChecking(false);
                        if (result.serviceable) {
                          const weight = calculateWeight(cart);
                          const cost = getShippingRate(weight, false);
                          setShippingCost(cost);
                          setShippingMethod('standard');
                        }
                      }}
                      disabled={shippingChecking || checkoutForm.pincode.length < 6}
                      className="w-full border border-[#E5E5E5] py-3 text-xs uppercase tracking-widest font-bold text-[#2C2C2C] hover:border-[#8B735B] hover:text-[#8B735B] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {shippingChecking ? (
                        <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Checking...</>
                      ) : 'Check Delivery Availability'}
                    </button>
                  ) : shippingCheck.serviceable ? (
                    <div className="border border-[#E5E5E5] p-4 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-xs uppercase tracking-widest font-bold">Delivery available to {checkoutForm.pincode}</span>
                      </div>
                      <div className="space-y-2">
                        <label className={`flex items-center justify-between p-3 border cursor-pointer transition-all ${shippingMethod === 'standard' ? 'border-[#8B735B] bg-[#FAF9F6]' : 'border-[#E5E5E5] hover:border-[#D1D1D1]'}`}>
                          <div className="flex items-center gap-3">
                            <input type="radio" checked={shippingMethod === 'standard'} onChange={() => { setShippingMethod('standard'); setShippingCost(getShippingRate(calculateWeight(cart), false)); }} className="accent-[#8B735B]" />
                            <div>
                              <p className="text-sm font-medium">Standard Delivery</p>
                              <p className="text-[10px] text-[#999]">{getEstimatedDelivery(shippingCheck.deliveryDays, false)}</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold">₹{getShippingRate(calculateWeight(cart), false)}</span>
                        </label>
                        {shippingCheck.expressAvailable && (
                          <label className={`flex items-center justify-between p-3 border cursor-pointer transition-all ${shippingMethod === 'express' ? 'border-[#8B735B] bg-[#FAF9F6]' : 'border-[#E5E5E5] hover:border-[#D1D1D1]'}`}>
                            <div className="flex items-center gap-3">
                              <input type="radio" checked={shippingMethod === 'express'} onChange={() => { setShippingMethod('express'); setShippingCost(getShippingRate(calculateWeight(cart), true)); }} className="accent-[#8B735B]" />
                              <div>
                                <p className="text-sm font-medium">Express Delivery</p>
                                <p className="text-[10px] text-[#999]">{getEstimatedDelivery(shippingCheck.deliveryDays, true)}</p>
                              </div>
                            </div>
                            <span className="text-sm font-bold">₹{getShippingRate(calculateWeight(cart), true)}</span>
                          </label>
                        )}
                      </div>
                      <button onClick={() => { setShippingCheck(null); setShippingCost(0); }} className="text-[10px] text-[#8B735B] uppercase tracking-widest hover:underline">Change Pincode</button>
                    </div>
                  ) : (
                    <div className="border border-red-200 bg-red-50 p-4">
                      <div className="flex items-center gap-2 text-red-600 mb-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        <span className="text-xs uppercase tracking-widest font-bold">Delivery not available to {checkoutForm.pincode}</span>
                      </div>
                      <p className="text-xs text-[#666]">Contact us at <strong>8979771816</strong> for alternative arrangements.</p>
                      <button onClick={() => { setShippingCheck(null); setShippingCost(0); }} className="text-[10px] text-[#8B735B] uppercase tracking-widest hover:underline mt-2">Try Another Pincode</button>
                    </div>
                  )}
                </div>

                {checkoutError && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-xs px-3 py-2 mb-4">
                    {checkoutError}
                    <button onClick={() => setCheckoutError('')} className="ml-2 underline">Dismiss</button>
                  </div>
                )}

                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-2 mb-6">
                  <svg className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-[10px] text-emerald-700 uppercase tracking-widest">Secure payment via Razorpay · UPI, Cards, Net Banking</span>
                </div>

                <button
                  onClick={() => {
                    setCheckoutError('');
                    setCheckoutProcessing(true);
                    const totalWithShipping = cartTotal + shippingCost;
                    openRazorpay({
                      amount: totalWithShipping,
                      description: `Kala Prayag Order — ${cart.length} item${cart.length > 1 ? 's' : ''}`,
                      customerName: checkoutForm.name,
                      customerEmail: checkoutForm.email,
                      customerPhone: checkoutForm.phone,
                      onSuccess: async (response) => {
                        const orderId = 'PO-' + Date.now().toString(36).toUpperCase();
                        const order: ProductOrder = {
                          id: orderId,
                          items: cart,
                          customerName: checkoutForm.name,
                          customerEmail: checkoutForm.email,
                          customerPhone: checkoutForm.phone,
                          shippingAddress: checkoutForm.address,
                          city: checkoutForm.city,
                          state: checkoutForm.state,
                          pincode: checkoutForm.pincode,
                          paymentMethod: 'Razorpay',
                          totalAmount: totalWithShipping,
                          status: 'confirmed',
                          paymentId: response.razorpay_payment_id,
                          shippingMethod: shippingMethod === 'express' ? 'Express' : 'Standard',
                          shippingCost: shippingCost,
                          estimatedDelivery: shippingCheck ? getEstimatedDelivery(shippingCheck.deliveryDays, shippingMethod === 'express') : '',
                          createdAt: new Date().toISOString(),
                        };
                        await handlePlaceProductOrder(order);
                        setCheckoutPaymentId(response.razorpay_payment_id);

                        // Auto-create Delhivery shipment
                        try {
                          const shipment = await createShipment({
                            orderId,
                            customerName: checkoutForm.name,
                            customerPhone: checkoutForm.phone,
                            customerEmail: checkoutForm.email,
                            address: checkoutForm.address,
                            city: checkoutForm.city,
                            state: checkoutForm.state,
                            pincode: checkoutForm.pincode,
                            amount: totalWithShipping,
                            weight: calculateWeight(cart),
                            items: cart.map(i => i.name).join(', '),
                            paymentMode: 'Prepaid',
                          });
                          if (shipment.success) {
                            setCheckoutAwb(shipment.awb);
                            setCheckoutEstDelivery(order.estimatedDelivery || '');
                            // Update order in Firebase with AWB
                            await setDoc(doc(db, 'productOrders', orderId), {
                              ...order,
                              awb: shipment.awb,
                              trackingUrl: shipment.trackingUrl,
                              shippingStatus: 'booked',
                            });
                          }
                        } catch (e) { console.error('[Delhivery] Shipment creation failed:', e); }

                        setCheckoutProcessing(false);
                        setJustPlacedOrderId(orderId);
                        setOrderPlaced(true);
                      },
                      onFailure: (error) => {
                        setCheckoutProcessing(false);
                        setCheckoutError(error.message || 'Payment failed. Please try again.');
                      },
                    });
                  }}
                  disabled={!checkoutForm.name || !checkoutForm.email || !checkoutForm.address || !shippingCheck?.serviceable || checkoutProcessing}
                  className="w-full bg-[#2C2C2C] text-white py-4 text-xs uppercase tracking-[0.3em] font-bold hover:bg-[#8B735B] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {checkoutProcessing ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </>
                  ) : `Pay Now · ₹ ${(cartTotal + shippingCost).toLocaleString()}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <ChatWidget />
    </div>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </ErrorBoundary>
);

export default App;
