import { useState } from 'react';

interface UserRatingCardProps {
  onRate: (rating: number) => void;
  currentRating?: number;
}

export function UserRatingCard({ onRate, currentRating }: UserRatingCardProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [hasRated, setHasRated] = useState(false);

  const ratings = [
    { value: 1, label: '很差', emoji: '😞' },
    { value: 2, label: '较差', emoji: '😕' },
    { value: 3, label: '一般', emoji: '😐' },
    { value: 4, label: '不错', emoji: '🙂' },
    { value: 5, label: '很好', emoji: '😊' },
  ];

  const handleRate = (rating: number) => {
    setHasRated(true);
    onRate(rating);
  };

  if (hasRated && currentRating) {
    const ratedItem = ratings.find(r => r.value === currentRating);
    return (
      <div className="flex items-center gap-2">
        <span className="text-base">{ratedItem?.emoji}</span>
        <span className="text-sm text-gray-500">{ratedItem?.label}</span>
        <button
          onClick={() => setHasRated(false)}
          className="text-xs text-primary-500 hover:text-primary-600 ml-1"
        >
          改
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-gray-400 mr-1">评价</span>
      {ratings.map((rating) => (
        <button
          key={rating.value}
          onClick={() => handleRate(rating.value)}
          onMouseEnter={() => setHoveredRating(rating.value)}
          onMouseLeave={() => setHoveredRating(null)}
          className={`
            p-1.5 rounded-lg transition-all text-base
            ${hoveredRating === rating.value ? 'bg-white/50 scale-110' : 'hover:bg-white/30'}
            ${currentRating === rating.value ? 'bg-white scale-110' : ''}
          `}
          title={rating.label}
        >
          {rating.emoji}
        </button>
      ))}
    </div>
  );
}
