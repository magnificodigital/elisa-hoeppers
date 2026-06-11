export function BodyogaLogo({
  variant = "icon",
  className = "",
  size = 48,
}: {
  variant?: "icon" | "full";
  className?: string;
  size?: number;
}) {
  if (variant === "full") {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        <BodyogaMark size={size} />
        <span
          className="font-display tracking-[0.3em] text-xl"
          style={{ color: "var(--bodyoga-green)" }}
        >
          BODYOGA<sup className="text-[0.5em] tracking-normal">®</sup>
        </span>
      </div>
    );
  }

  return <BodyogaMark size={size} className={className} />;
}

function BodyogaMark({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="BODYOGA"
    >
      <circle cx="50" cy="50" r="48" fill="var(--bodyoga-green)" />
      {/* Y shape — two diagonal arms */}
      <path
        d="M30 28 L50 52"
        stroke="var(--bodyoga-cream)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M70 28 L50 52"
        stroke="var(--bodyoga-cream)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* vertical stem of the Y */}
      <path
        d="M50 52 L50 76"
        stroke="var(--bodyoga-cream)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* head dot */}
      <circle cx="50" cy="22" r="5" fill="var(--bodyoga-cream)" />
    </svg>
  );
}
