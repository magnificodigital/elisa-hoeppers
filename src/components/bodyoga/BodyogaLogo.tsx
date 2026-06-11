export function BodyogaLogo({
  variant = "icon",
  className = "",
  size = 48,
  tone = "green",
}: {
  variant?: "icon" | "full";
  className?: string;
  size?: number;
  /** color tone of the wordmark + mark; on dark backgrounds use "cream" */
  tone?: "green" | "cream";
}) {
  const color = tone === "cream" ? "var(--bodyoga-cream)" : "var(--bodyoga-green)";

  if (variant === "full") {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        <BodyogaMark size={size} tone={tone} />
        <span
          className="font-display tracking-[0.32em] text-xl leading-none"
          style={{ color }}
        >
          BODYOGA<sup className="text-[0.45em] tracking-normal align-super">®</sup>
        </span>
      </div>
    );
  }

  return <BodyogaMark size={size} tone={tone} className={className} />;
}

/**
 * Marca BODYOGA — figura de yoga que forma a letra "Y":
 * dois braços abertos em V para cima, corpo vertical para baixo
 * e a cabeça como um ponto à direita do corpo. Inscrita num círculo verde.
 */
function BodyogaMark({
  size = 48,
  tone = "green",
  className = "",
}: {
  size?: number;
  tone?: "green" | "cream";
  className?: string;
}) {
  const circleFill = tone === "cream" ? "var(--bodyoga-cream)" : "var(--bodyoga-green)";
  const figureFill = tone === "cream" ? "var(--bodyoga-green)" : "var(--bodyoga-cream)";

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
      <circle cx="50" cy="50" r="49" fill={circleFill} />
      <g stroke={figureFill} strokeWidth="8.5" strokeLinecap="round" fill="none">
        {/* braço esquerdo (sobe para a esquerda) */}
        <path d="M48 56 L33 29" />
        {/* braço direito (sobe para a direita, mais longo) */}
        <path d="M48 56 L70 31" />
        {/* corpo (desce) */}
        <path d="M47 56 L45 80" />
      </g>
      {/* cabeça — ponto à direita do corpo */}
      <circle cx="60" cy="64" r="5" fill={figureFill} />
    </svg>
  );
}
