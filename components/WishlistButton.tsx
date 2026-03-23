import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, query, where, getDocs, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface WishlistButtonProps {
  productId: string;
  variant?: 'outline' | 'minimal';
  onNavigate?: (page: string) => void;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({ productId, variant = 'minimal', onNavigate }) => {
  const { currentUser } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wishlistDocId, setWishlistDocId] = useState<string | null>(null);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const fetchWishlistData = async () => {
      // 1. Check if user has wishlisted
      if (currentUser) {
        const q = query(
          collection(db, 'wishlists'),
          where('userId', '==', currentUser.uid),
          where('productId', '==', productId)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setIsWishlisted(true);
          setWishlistDocId(snapshot.docs[0].id);
        } else {
          setIsWishlisted(false);
          setWishlistDocId(null);
        }
      }

      // 2. Get total wishlist count
      const countQ = query(
        collection(db, 'wishlists'),
        where('productId', '==', productId)
      );
      const countSnapshot = await getDocs(countQ);
      setWishlistCount(countSnapshot.size);
    };
    fetchWishlistData();
  }, [currentUser, productId]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card clicks if in Shop grid
    if (!currentUser) {
      onNavigate?.('collector-login');
      return;
    }

    setLoading(true);
    try {
      if (isWishlisted && wishlistDocId) {
        // Remove from wishlist
        await deleteDoc(doc(db, 'wishlists', wishlistDocId));
        setIsWishlisted(false);
        setWishlistDocId(null);
        setWishlistCount(prev => Math.max(0, prev - 1));
      } else {
        // Add to wishlist
        const newDoc = await addDoc(collection(db, 'wishlists'), {
          userId: currentUser.uid,
          productId: productId,
          addedAt: serverTimestamp()
        });
        setIsWishlisted(true);
        setWishlistDocId(newDoc.id);
        setWishlistCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Wishlist toggle error:', err);
    } finally {
      setLoading(false);
    }
  };

  const buttonClasses = variant === 'outline'
    ? 'border border-[#E5E5E5] p-3 rounded-full hover:border-[#8B735B] transition-all'
    : 'p-2 rounded-full transition-all hover:bg-white/20';

  return (
    <button
      onClick={toggleWishlist}
      disabled={loading}
      className={`${buttonClasses} ${isWishlisted ? 'text-red-500' : 'text-[#8B735B]'} flex items-center gap-2`}
      title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
    >
      <svg
        className={`w-5 h-5 transition-all duration-300 ${isWishlisted ? 'fill-current scale-110' : 'fill-none'}`}
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
      {variant === 'outline' && wishlistCount > 0 && (
        <span className="text-[10px] font-bold tracking-widest">{wishlistCount}</span>
      )}
    </button>
  );
};

export default WishlistButton;
