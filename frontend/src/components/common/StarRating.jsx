import React from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ rating = 5, totalStars = 5, size = 16, interactive = false, onRatingChange }) => {
  return (
    <div className="flex items-center gap-1">
      {[...Array(totalStars)].map((_, index) => {
        const starValue = index + 1;
        const isFilled = rating >= starValue;
        return (
          <button
            type="button"
            key={index}
            disabled={!interactive}
            onClick={() => interactive && onRatingChange && onRatingChange(starValue)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: interactive ? 'pointer' : 'default',
              padding: 0,
              display: 'inline-flex'
            }}
          >
            <Star
              size={size}
              style={{
                color: isFilled ? 'var(--text-main)' : 'var(--border)',
                fill: isFilled ? 'var(--text-main)' : 'none',
                transition: 'all 0.15s ease'
              }}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
