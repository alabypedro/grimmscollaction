import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StarRating({
  rating,
  maxRating = 5,
  onRatingChange,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const starSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-6 w-6",
  };

  const currentRating = hoveredRating !== null ? hoveredRating : rating;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }).map((_, i) => {
        const starValue = i + 1;
        const isActive = starValue <= currentRating;

        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            className={cn(
              "transition-all duration-200",
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110 active:scale-95",
              isActive ? "text-primary" : "text-muted-foreground/30"
            )}
            onClick={() => onRatingChange?.(starValue)}
            onMouseEnter={() => !readonly && setHoveredRating(starValue)}
            onMouseLeave={() => !readonly && setHoveredRating(null)}
          >
            <Star
              className={cn(
                starSizes[size],
                isActive && "fill-current"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
