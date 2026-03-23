import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface ReviewFormProps {
  targetId: string;
  targetType: 'product' | 'artist';
  onReviewSubmitted?: () => void;
  onNavigate?: (page: string) => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ targetId, targetType, onReviewSubmitted, onNavigate }) => {
  const { currentUser } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    const checkExistingReview = async () => {
      if (!currentUser) return;
      const q = query(
        collection(db, 'reviews'),
        where('targetId', '==', targetId),
        where('userId', '==', currentUser.uid)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setHasReviewed(true);
      }
    };
    checkExistingReview();
  }, [currentUser, targetId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Please sign in to leave a review.');
      return;
    }
    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }
    if (!comment.trim()) {
      setError('Please enter a comment.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await addDoc(collection(db, 'reviews'), {
        targetId,
        targetType,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
        status: 'approved' // Defaulting to approved for now as per minimal MVP
      });

      setRating(0);
      setComment('');
      setHasReviewed(true);
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err: any) {
      setError('Failed to submit review. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) return (
    <div className="bg-[#FAF9F6] p-8 border border-dashed border-[#E5E5E5] text-center">
      <p className="text-sm text-[#999] mb-6 italic transition-all duration-300">Share your experience with this {targetType}.</p>
      <button 
        onClick={() => onNavigate?.('collector-login')}
        className="px-8 py-3 bg-[#8B735B] text-white text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#6D5A47] transition-all shadow-lg"
      >
        Sign In to Review
      </button>
    </div>
  );

  if (hasReviewed) return (
    <div className="bg-[#FAF9F6] p-8 border border-[#F0F0F0] text-center">
      <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      </div>
      <p className="text-sm font-medium text-[#2C2C2C]">Thank you for your feedback!</p>
      <p className="text-xs text-[#999] mt-2">You have already reviewed this {targetType}.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <h3 className="text-xl serif italic">Write a Review</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Your Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-transform hover:scale-110"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
              >
                <svg
                  className={`w-6 h-6 ${(hover || rating) >= star ? 'fill-[#8B735B] text-[#8B735B]' : 'text-[#E5E5E5]'}`}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  fill="none"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.07 6.36h6.704c.969 0 1.371 1.24.588 1.81l-5.396 3.928 2.07 6.36c.3.921-.755 1.688-1.54 1.118l-5.396-3.928-5.396 3.928c-.785.57-1.84-.197-1.54-1.118l2.07-6.36-5.396-3.928c-.783-.57-.38-1.81.588-1.81h6.704l2.07-6.36z" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Your Thoughts</label>
          <textarea
            required
            className="w-full bg-[#FAF9F6] border border-[#E5E5E5] p-4 text-sm focus:outline-none focus:border-[#2C2C2C] min-h-[120px] transition-all"
            placeholder={`What did you love about this ${targetType}?`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>
        </div>

        {error && <p className="text-red-500 text-xs italic">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className={`w-full bg-[#2C2C2C] text-white py-4 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-black transition-all ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {submitting ? 'Submitting...' : 'Post Review'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
