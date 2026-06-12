import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Menu, X, User, ShoppingCart } from "lucide-react";
import { BodyogaLogo } from "./BodyogaLogo";
import { useAuth } from "@/hooks/useAuth";

const CREAM = "#FEF2D4";

export function BodyogaHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { to: "/bodyoga/sobre" as const, label: "Sobre" },
    { to: "/loja" as const, search: { brand: "bodyoga" }, label: "Shop" },
    { to: "/blog" as const, search: { tag: "bodyoga" }, label: "Dicas" },
  ];

  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(2);

  const linkStyle = scrolled ? { color: CREAM } : undefined;
  const linkClass = scrolled
    ? "text-xs font-medium uppercase tracking-[0.18em] hover:opacity-70 transition"
    : "text-xs font-medium uppercase tracking-[0.18em] text-bodyoga-green hover:opacity-70 transition";

  return (
    <header
      className="fixed top-0 inset-x-0 z-40 transition-colors duration-300"
      style={scrolled ? { backgroundColor: "var(--bodyoga-green)" } : undefined}
    >
      <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 flex items-center justify-end md:justify-between h-24">

        {/* Left nav */}
        <nav className="hidden md:flex flex-1 items-center justify-end gap-8 md:pr-12">
          {leftItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              search={item.search}
              className={linkClass}
              style={linkStyle}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Centered logo */}
        <Link
          to="/bodyoga"
          className="flex-shrink-0 flex justify-center md:static absolute left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto"
        >
          <BodyogaLogo variant="full" size={60} tone={scrolled ? "cream" : "green"} />
        </Link>

        {/* Right nav */}
        <nav className="hidden md:flex flex-1 items-center justify-start gap-8 md:pl-12">
          {rightItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              search={item.search}
              className={linkClass}
              style={linkStyle}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to={user ? "/painel" : "/login"}
            aria-label={user ? "Painel" : "Entrar"}
            className="hover:opacity-70 transition"
            style={scrolled ? { color: CREAM } : { color: "var(--bodyoga-green)" }}
          >
            <User className="w-5 h-5" />
          </Link>
          <Link
            to="/carrinho"
            aria-label="Carrinho"
            className="hover:opacity-70 transition"
            style={scrolled ? { color: CREAM } : { color: "var(--bodyoga-green)" }}
          >
            <ShoppingCart className="w-5 h-5" />
          </Link>

        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden"
          style={scrolled ? { color: CREAM } : { color: "var(--bodyoga-green)" }}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-bodyoga-green/20 px-4 py-6 space-y-4 bg-bodyoga-cream">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              search={item.search}
              onClick={() => setOpen(false)}
              className="block text-base uppercase tracking-[0.18em] text-bodyoga-green"
            >
              {item.label}
            </Link>
          ))}
          <Link
            to={user ? "/painel" : "/login"}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-base uppercase tracking-[0.18em] text-bodyoga-green"
          >
            <User className="w-5 h-5" />
            {user ? "Painel" : "Conta"}
          </Link>
          <Link
            to="/carrinho"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-base uppercase tracking-[0.18em] text-bodyoga-green"
          >
            <ShoppingCart className="w-5 h-5" />
            Carrinho
          </Link>

        </div>
      )}
    </header>
  );
}
