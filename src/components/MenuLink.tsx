import { Link } from "@tanstack/react-router";
import type { CSSProperties, ReactNode } from "react";
import { isExternalHref } from "@/lib/nav-config";

/**
 * Renderiza um item de menu: links externos (WhatsApp, mailto, tel, http)
 * viram <a href target="_blank">, e rotas internas usam o <Link> do router.
 */
export function MenuLink({
  href,
  className,
  style,
  onClick,
  children,
}: {
  href: string;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  children: ReactNode;
}) {
  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={className}
        style={style}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }
  return (
    <Link to={href as any} className={className} style={style} onClick={onClick}>
      {children}
    </Link>
  );
}
