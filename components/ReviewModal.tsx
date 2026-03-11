
import React, { useState } from 'react';
import { Review } from '../types';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (review: Partial<Review>) => void;
    targetId: string;
    authorName: string;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, onSubmit, targetId, authorName }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            id: Math.random().toString(36).substr(2, 9),
            targetId,
            authorName,
            rating,
            comment,
            status: 'pending',
            date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        });
        setComment('');
        setRating(5);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-6 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg p-12 shadow-2xl animate-in zoom-in duration-300">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-3xl serif mb-2">Share Your Experience</h2>
                        <p className="text-xs text-[#999] uppercase tracking-widest">Your feedback helps the artisan and the community.</p>
                    </div>
                    <button onClick={onClose} className="text-[#999] hover:text-black">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Star Rating */}
                    <div className="flex flex-col items-center gap-4 py-4 bg-[#FAF9F6] border border-[#F0F0F0]">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-[#8B735B]">Rate your masterclass/piece</p>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    type="button"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                    className="transition-transform hover:scale-110"
                                >
                                    <svg
                                        className={`w-10 h-10 ${star <= (hoverRating || rating) ? 'text-amber-400 fill-current' : 'text-gray-200 fill-none'}`}
                                        viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}
                                    >
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                        <p className="text-sm font-medium text-[#2C2C2C]">
                            {rating === 5 ? 'Exceptional' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                        </p>
                    </div>

                    {/* Comment */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Your Commentary</label>
                        <textarea
                            required
                            rows={4}
                            placeholder="Tell us about the quality, the process, and the artisan's craft..."
                            className="w-full bg-[#F9F9F9] border border-[#E5E5E5] p-4 text-sm focus:outline-none focus:border-[#8B735B] transition-colors resize-none"
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="flex flex-col gap-4">
                        <button
                            type="submit"
                            className="w-full bg-[#2C2C2C] text-white py-4 text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#8B735B] transition-all"
                        >
                            Submit Review
                        </button>
                        <p className="text-[9px] text-[#BBB] text-center leading-relaxed italic">
                            *All reviews are reviewed by our curation team before going public.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
