
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  images: string[];
  artisan: string;
  artisanId?: string;
  materials: string[];
  stock: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  customizable: boolean;
  dimensions?: string;
}

export interface StudioJournalEntry {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  date: string;
  category: string;
  author: string;
  tags: string[];
  featured?: boolean;
  readTime: string;
  quote?: string;
}

export interface Artisan {
  id: string;
  name: string;
  brandName?: string;
  email: string;
  phone: string;
  whatsapp?: string;
  instagram?: string;
  location: string;
  craftType: string;
  categories: string[];
  experience: string;
  bio: string;
  portfolioImages: string[];
  coverPhoto?: string;
  profilePhoto: string;
  status?: 'approved' | 'pending' | 'rejected' | 'suspended';
  teachingInterest: boolean;
  rating: number;
  reviewCount: number;
  customPricing: Record<string, number>;
  studioJournal?: StudioJournalEntry[];
}


export interface ArtisanApplication extends Omit<Artisan, 'status' | 'rating' | 'reviewCount'> {
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  categories: string[];
  customPricing: Record<string, number>;
}

export interface Workshop {
  id: string;
  artisanId: string;
  artisanName: string;
  title: string;
  description: string;
  category: string;
  mode: 'online' | 'offline';
  location?: string;
  duration: string;
  price: number;
  maxStudents: number;
  date: string;
  time: string;
  materialsProvided: boolean;
  curriculum: string;
  requirements: string;
  status: 'pending' | 'approved' | 'rejected';
  image: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  // ── Workshop process fields ──────────────────────────────────────────
  zoomLink?: string;       // For online workshops
  materialsNote?: string;  // Instructions for self-arranged materials
  completedAt?: string;    // When workshop was marked done
}

export interface Review {
  id: string;
  targetId: string; // Could be Product ID, Workshop ID, or Artisan ID
  authorName: string;
  rating: number;
  comment: string;
  date: string;
  status: 'pending' | 'approved';
}

export interface CustomRequest {
  id: string;
  artisanId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  budgetRange: string;
  dimensions: string;
  deadline: string;
  message: string;
  referenceImage?: string;
  status: 'new' | 'discussed' | 'accepted' | 'declined';
  createdAt: string;
}

/* Added CustomOrder interface to resolve import errors in constants and components */
export interface CustomOrder {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  concept: string;
  dimensions: string;
  size: string;
  finish: string;
  category: string;
  assignedArtisanId: string;
  assignedArtisanName: string;
  // Admin controls
  adminStatus: 'pending' | 'approved' | 'reassigned'; // admin review stage
  // Artisan stage (only visible after adminStatus === 'approved')
  artisanStatus: 'waiting' | 'accepted' | 'completed';
  // legacy status kept for backward compat
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  adminNote?: string;       // admin can add note when approving
  artisanNote?: string;     // artisan adds note when accepting
  reassignedTo?: string;    // if admin reassigns
  advancePayment: {
    amount: number;
    method: string;
    paid: boolean;
    paymentId?: string;
  };
  createdAt: string;
  budget?: number;
  approvedAt?: string;
  acceptedAt?: string;
}

export interface ClassBooking {
  id: string;
  workshopId: string;
  workshopTitle: string;
  artisanId: string;
  artisanName?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentStatus: 'pending' | 'completed';
  amount: number;
  method: string;
  transactionId?: string;
  createdAt: string;
  // ── Workshop process fields ───────────────────────────────────────────
  status: 'confirmed' | 'reminded' | 'attended' | 'completed' | 'cancelled' | 'no-show';
  reminderSent?: boolean;
  attendanceMarked?: boolean;
  reviewRequested?: boolean;
  cancellationReason?: string;
  adminNote?: string;
}

export interface InstitutionRequest {
  id: string;
  institutionName: string;
  contactPerson: string;
  email: string;
  phone: string;
  type: 'school' | 'college' | 'corporate' | 'ngo' | 'other';
  message: string;
  preferredDate?: string;
  groupSize?: number;
  craftCategory?: string;
  preferredArtist?: string;
  status: 'new' | 'contacted' | 'confirmed' | 'declined';
  createdAt: string;
}

export type Category = 'Vases' | 'Wall Art' | 'Sculptures' | 'Textiles' | 'Lighting' | 'All';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size: string;
  finish: string;
  notes: string;
}

export interface ProductOrder {
  id: string;
  items: CartItem[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  state?: string;
  pincode: string;
  paymentMethod: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentId?: string;
  awb?: string;
  trackingUrl?: string;
  shippingStatus?: string;
  shippingMethod?: string;
  shippingCost?: number;
  gstAmount?: number;
  estimatedDelivery?: string;
  artisanId?: string;
  artisanName?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderName: string;
  senderEmail: string;
  receiverId: string; // Artisan ID
  subject: string;
  body: string;
  status: 'unread' | 'read';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'workshop' | 'message' | 'system';
  link?: string;
  status: 'unread' | 'read';
  createdAt: string;
}

export interface FavoriteArtisan {
  id: string;
  userId: string;
  artisanId: string;
  createdAt: string;
}

export interface FavoriteProduct {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

export interface InvoiceData {
  id: string;              // Firebase ID
  invoiceNumber: string;    // KP-INV-XXXXXX
  invoiceDate: string;      // DD MMM YYYY
  orderType: 'shop' | 'workshop' | 'custom';
  orderId: string;          // Reference to the original order/booking ID

  customer: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };

  items: {
    description: string;
    artisan?: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];

  subtotal: number;
  gst: number;               // 18%
  gstAmount: number;
  totalAmount: number;

  payment: {
    method: string;          // UPI / Card / Bank Transfer
    status: 'paid' | 'partial' | 'pending';
    paidAmount: number;
    transactionId?: string;
    bookingId?: string;      // KP-XXXXXX format (original order/booking ref)
  };

  notes?: string;
  createdAt: string;
}
