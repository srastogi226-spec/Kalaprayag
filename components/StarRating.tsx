import React from 'react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  activeColor?: string;
  inactiveColor?: string;
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  maxStars = 5, 
  size = 'sm',
  activeColor = '#8B735B',
  inactiveColor = '#E5E5E5' 
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="flex gap-1" aria-label={`Rating: ${rating} out of ${maxStars} stars`}>
      {[...Array(maxStars)].map((_, i) => {
        const starFull = i < Math.floor(rating);
        const starHalf = !starFull && i < rating;

        return (
          <svg
            key={i}
            className={`${sizeClasses[size]}`}
            viewBox="0 0 24 24"
            fill="none"
          >
            {starFull ? (
              <path
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                fill={activeColor}
              />
            ) : starHalf ? (
              <>
                <path
                  d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                  fill={inactiveColor}
                />
                <path
                  d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27V2z"
                  fill={activeColor}
                />
              </>
            ) : (
              <path
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                fill={inactiveColor}
              />
            )}
          </svg>
        );
      })}
    </div>
  );
};

export default StarRating;
