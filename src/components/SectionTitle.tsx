import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
  className?: string;
}

const SectionTitle = ({ children, subtitle, align = "center", className = "" }: Props) => {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`${alignClass} ${className}`}>
      <h2 className="font-display text-3xl md:text-[2.5rem] text-primary-dark leading-tight">
        {children}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-[var(--text-muted)] text-base ${align === "center" ? "max-w-[600px] mx-auto" : ""}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionTitle;
