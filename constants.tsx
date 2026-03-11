
import { Product, CustomOrder, Artisan, ArtisanApplication, Workshop, StudioJournalEntry } from './types';

export const CATEGORIES: string[] = ['All', 'Vases', 'Wall Art', 'Sculptures', 'Textiles', 'Lighting'];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Ethereal Clay Vessel',
    category: 'Vases',
    price: 450,
    description: 'A hand-thrown terracotta vessel finished with a translucent bone-white glaze. Each piece bears the unique fingerprints of the artisan.',
    images: ['https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&q=80&w=800'],
    artisan: 'Ramesh Kumhar',
    materials: ['Terracotta', 'Glaze'],
    stock: 12,
    status: 'approved',
    /* Added missing customizable property */
    customizable: true
  },
  {
    id: '2',
    name: 'Gilded Lotus Sconce',
    category: 'Lighting',
    price: 1200,
    description: 'Hammered brass lighting fixture inspired by the bloom of a lotus at dawn. Hand-carved details create mesmerizing light patterns.',
    images: ['https://images.unsplash.com/photo-1542728928-1413eeae4d92?auto=format&fit=crop&q=80&w=800'],
    artisan: 'Sunita Devi',
    materials: ['Brass', 'Gold Leaf'],
    stock: 5,
    status: 'approved',
    /* Added missing customizable property */
    customizable: true
  },
  {
    id: '3',
    name: 'Sahyadri Slate Sculpture',
    category: 'Sculptures',
    price: 890,
    description: 'Abstract basalt and slate sculpture representing the rugged beauty of the Western Ghats. A statement piece for modern minimalist homes.',
    images: ['https://images.unsplash.com/photo-1554188248-986adbb73be4?auto=format&fit=crop&q=80&w=800'],
    artisan: 'Arjun Rao',
    materials: ['Basalt', 'Slate'],
    stock: 3,
    status: 'approved',
    /* Added missing customizable property */
    customizable: false
  },
  {
    id: '4',
    name: 'Sandalwood Inlay Frame',
    category: 'Wall Art',
    price: 320,
    description: 'Fine marquetry work featuring authentic sandalwood and teak. A traditional craft reimagined for contemporary art displays.',
    images: ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800'],
    artisan: 'Vikram Singh',
    materials: ['Sandalwood', 'Teak'],
    stock: 20,
    status: 'approved',
    /* Added missing customizable property */
    customizable: true
  }
];

export const INITIAL_CUSTOM_ORDERS: CustomOrder[] = [
  {
    id: 'ORD-001',
    customerName: 'Ananya Sharma',
    email: 'ananya@example.com',
    phone: '+91 9876543210',
    concept: 'Large mural for living room inspired by Varanasi ghats',
    dimensions: '6ft x 4ft',
    size: '6 × 8 ft',
    finish: 'Natural',
    category: 'Wall Art',
    assignedArtisanId: '',
    assignedArtisanName: '',
    adminStatus: 'pending',
    artisanStatus: 'waiting',
    status: 'pending',
    advancePayment: { amount: 5000, method: 'UPI', paid: false },
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_ARTISANS: Artisan[] = [
  {
    id: 'artisan-ramesh',
    name: 'Ramesh Kumhar',
    brandName: 'Sahyadri Studios',
    email: 'ramesh@kalaprayag.com',
    phone: '9999999999',
    whatsapp: '9999999999',
    location: 'Varanasi, Uttar Pradesh',
    craftType: 'Pottery & Terracotta',
    categories: ['Vases', 'Sculptures'],
    experience: '20',
    bio: 'A third-generation potter from Varanasi, Ramesh has spent over two decades mastering the ancient art of terracotta. Each vessel he throws on the wheel carries the memory of the Ganga riverbank clay he grew up shaping.',
    portfolioImages: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800',
    ],
    coverPhoto: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&q=80&w=800',
    profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
    status: 'approved',
    teachingInterest: true,
    rating: 4.8,
    reviewCount: 12,
    customPricing: {},
  }
];
export const INITIAL_APPLICATIONS: ArtisanApplication[] = [];

export const INITIAL_WORKSHOPS: Workshop[] = [
  {
    id: 'w-1',
    artisanId: 'artisan-ramesh',
    artisanName: 'Ramesh Kumhar',
    title: 'The Soul of Clay: Pottery Basics',
    description: 'A immersive session on the heritage of Indian terracotta. Learn hand-building and basic wheel throwing.',
    category: 'Pottery',
    mode: 'offline',
    location: 'Varanasi Studio, UP',
    duration: '4 Hours',
    price: 1500,
    maxStudents: 8,
    date: '2026-05-15',
    time: '10:00 AM',
    materialsProvided: true,
    curriculum: '1. History of Indian Pottery\n2. Clay preparation\n3. Hand-building techniques\n4. Finishing & Glazing basics',
    requirements: 'No prior experience needed. Wear clothes you do not mind getting dirty.',
    status: 'approved',
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&q=80&w=1200',
    /* Added missing skillLevel property */
    skillLevel: 'Beginner'
  }
];
export const INITIAL_JOURNAL_ENTRIES: StudioJournalEntry[] = [
  {
    id: 'story-1',
    title: 'The Living Art of Indian Pottery: A 5,000-Year Tradition',
    excerpt: 'Our master potters continue a lineage that traces back to the Indus Valley Civilization. Each piece is a testament to the enduring relationship between earth and hand.',
    content: 'Full editorial story about the history and soul of Indian pottery...',
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&q=80&w=1200',
    date: '2026-03-01',
    category: 'CRAFT STORIES',
    author: 'Ramesh Kumhar',
    tags: ['POTTERY', 'HERITAGE', 'VARANASI'],
    featured: true,
    readTime: '8 MIN READ'
  },
  {
    id: 'story-2',
    title: '7 Ways to Style Handcrafted Vases in Your Home',
    excerpt: 'Discover how to blend museum-quality ceramics with contemporary interior design for a curated, intentional look.',
    content: 'Full guide on interior styling with handcrafted vases...',
    image: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&q=80&w=800',
    date: '2026-02-28',
    category: 'HOME & STYLE',
    author: 'Sunita Devi',
    tags: ['STYLING', 'MINIMALISM'],
    readTime: '4 MIN READ'
  },
  {
    id: 'story-3',
    title: 'Bamboo Weaving: The Ancient Craft Saving Forests',
    excerpt: 'Exploring the sustainable impact of artisanal bamboo work in the modern economy.',
    content: 'Deep dive into bamboo weaving and ecological sustainability...',
    image: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&q=80&w=800',
    date: '2026-02-25',
    category: 'CRAFT STORIES',
    author: 'Arjun Rao',
    tags: ['BAMBOO', 'SUSTAINABILITY'],
    readTime: '6 MIN READ'
  },
  {
    id: 'story-4',
    title: 'How to Commission a Custom Handcrafted Piece',
    excerpt: 'A comprehensive guide on collaborating with our master artisans to bring your unique vision to life.',
    content: 'A detailed process guide for custom commissions...',
    image: 'https://images.unsplash.com/photo-1542728928-1413eeae4d92?auto=format&fit=crop&q=80&w=800',
    date: '2026-02-20',
    category: 'GUIDES',
    author: 'Vikram Singh',
    tags: ['COMMISSION', 'PROCESS'],
    readTime: '5 MIN READ'
  },
  {
    id: 'story-5',
    title: 'Brass & Bronze: India\'s Metalwork Masters',
    excerpt: 'From temple bells to contemporary decor, the alchemy of copper and tin remains a cornerstone of Indian craft.',
    content: 'The history and alchemy of metalworking in India...',
    image: 'https://images.unsplash.com/photo-1521233013483-8441fd2042ca?auto=format&fit=crop&q=80&w=800',
    date: '2026-02-15',
    category: 'CRAFT STORIES',
    author: 'Sunita Devi',
    tags: ['METALWORK', 'BRASS'],
    readTime: '7 MIN READ'
  },
  {
    id: 'story-6',
    title: 'The Thoughtful Gift Guide: Handcrafted Pieces',
    excerpt: 'Curating a selection of meaningful, long-lasting gifts for every occasion.',
    content: 'A curated selection of gifts for various occasions...',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800',
    date: '2026-02-10',
    category: 'GUIDES',
    author: 'Arjun Rao',
    tags: ['GIFTING', 'GUIDE'],
    readTime: '5 MIN READ'
  }
];
