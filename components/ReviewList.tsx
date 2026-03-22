import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import StarRating from './StarRating';
import { Review } from '../types';

interface ReviewListProps {
  targetId: string;
  targetType: 'product' | 'artist';
}

const ReviewList: React.FC<ReviewListProps> = ({ targetId, targetType }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'reviews'),
      where('targetId', '==', targetId),
      where('targetType', '==', targetType),
      where('status', '==', 'approved')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      
      // Sort manually as Firestore needs index for composite index
      setReviews(reviewData.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
      setLoading(false);
    });

    return unsubscribe;
  }, [targetId, targetType]);

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  if (loading) return (
    <div className="py-12 text-center">
      <div className="w-8 h-8 border-b-2 border-[#8B735B] rounded-full animate-spin mx-auto mb-4" />
      <p className="text-[10px] uppercase tracking-widest text-[#999]">Loading Reviews...</p>
    </div>
  );

  return (
    <div className="space-y-12">
      {/* ── Average Rating Summary ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-[#F0F0F0] pb-12">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-6xl font-light serif text-[#2C2C2C]">{avgRating.toFixed(1)}</p>
            <p className="text-[10px] uppercase tracking-widest text-[#999] mt-2">Overall Rating</p>
          </div>
          <div className="w-px h-16 bg-[#F0F0F0]" />
          <div className="space-y-2">
            <StarRating rating={avgRating} size="md" />
            <p className="text-xs text-[#666] italic">{reviews.length} Collective Reviews</p>
          </div>
        </div>

        <div className="flex-1 max-w-xs w-full space-y-2">
          {[5, 4, 3, 2, 1].map(num => {
            const count = reviews.filter(r => r.rating === num).length;
            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <div key={num} className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-widest text-[#999] w-4">{num}</span>
                <div className="flex-1 h-1 bg-[#FAF9F6] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#8B735B] transition-all duration-1000" 
                    style={{ width: `${percentage}%` }} 
                  />
                </div>
                <span className="text-[10px] text-[#BBB] w-6">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Review Listing ── */}
      {reviews.length === 0 ? (
        <div className="py-20 text-center bg-[#FAF9F6] border border-dashed border-[#E5E5E5]">
          <p className="serif text-2xl italic text-[#CCC]">No stories told yet.</p>
          <p className="text-[10px] uppercase tracking-widest text-[#DDD] mt-4">Be the first to share your experience from the studio.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {reviews.map((review) => (
            <div key={review.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-700">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <StarRating rating={review.rating} size="xs" />
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#2C2C2C] mt-2">
                    {review.userName}
                  </p>
                </div>
                <p className="text-[10px] uppercase tracking-widest text-[#BBB]">
                  {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                </p>
              </div>
              <p className="text-[#4A4A4A] font-light leading-relaxed text-sm italic">
                "{review.comment}"
              </p>
              <div className="h-px w-12 bg-[#F0F0F0] mt-8 group-hover:w-24 transition-all duration-500" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewList;
