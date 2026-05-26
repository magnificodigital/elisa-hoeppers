import { Star } from "lucide-react";

export function StarRating({
  value,
  max = 5,
  size = 16,
  onChange,
  interactive = false,
  className = "",
}: {
  value: number;
  max?: number;
  size?: number;
  onChange?: (v: number) => void;
  interactive?: boolean;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = value >= i + 1;
        const Wrapper = interactive ? "button" : "span";
        return (
          <Wrapper
            key={i}
            type={interactive ? "button" : undefined}
            onClick={interactive && onChange ? () => onChange(i + 1) : undefined}
            className={interactive ? "cursor-pointer hover:scale-110 transition" : ""}
            aria-label={interactive ? `${i + 1} estrelas` : undefined}
          >
            <Star
              size={size}
              className={
                filled
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-yellow-400/40"
              }
            />
          </Wrapper>
        );
      })}
    </div>
  );
}
