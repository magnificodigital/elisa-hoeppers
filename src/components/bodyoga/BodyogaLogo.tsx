import iconAsset from "@/assets/bodyoga/icone-bodyoga.png.asset.json";
import wordmarkAsset from "@/assets/bodyoga/logo-bodyoga.png.asset.json";

// Recolor the dark-green artwork to cream (for use on dark/green backgrounds).
// brightness(0) flattens to black first, then the sepia/hue chain tints to cream.
const CREAM_FILTER =
  "brightness(0) saturate(100%) invert(89%) sepia(8%) saturate(458%) hue-rotate(345deg) brightness(94%) contrast(88%)";

const GREEN_FILTER =
  "brightness(0) saturate(100%) invert(26%) sepia(13%) saturate(1292%) hue-rotate(52deg) brightness(94%) contrast(92%)";

export function BodyogaLogo({
  variant = "icon",
  className = "",
  size,
  tone = "green",
}: {
  variant?: "icon" | "full";
  className?: string;
  size?: number;
  /** color tone; on dark/green backgrounds use "cream" */
  tone?: "green" | "cream";
}) {
  if (variant === "full") {
    return (
      <img
        src={wordmarkAsset.url}
        alt="BODYOGA"
        className={`w-auto ${className}`}
        style={{
          height: size ?? undefined,
          filter: tone === "cream" ? CREAM_FILTER : (tone === "green" ? GREEN_FILTER : undefined),
        }}
      />
    );
  }

  return (
    <img
      src={iconAsset.url}
      alt="BODYOGA"
      className={`w-auto ${className}`}
      style={{ 
        height: size ?? 48,
        filter: tone === "cream" ? CREAM_FILTER : (tone === "green" ? GREEN_FILTER : undefined)
      }}
    />
  );
}
