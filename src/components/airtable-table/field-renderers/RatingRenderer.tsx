
import React from 'react';
import { FieldRendererProps } from './index';
import { Star } from 'lucide-react';

const RatingRenderer = ({ field, value }: FieldRendererProps) => {
  if (value === null || value === undefined) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }
  
  try {
    const rating = Number(value);
    const maxRating = 5; // Default max rating, could be from field config
    
    if (isNaN(rating)) {
      return <span className="text-sm text-muted-foreground">-</span>;
    }
    
    return (
      <div className="flex items-center">
        {[...Array(maxRating)].map((_, index) => (
          <Star 
            key={index} 
            className={`h-4 w-4 ${index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
        <span className="ml-1 text-xs text-muted-foreground">({rating})</span>
      </div>
    );
  } catch (error) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }
};

export default RatingRenderer;
