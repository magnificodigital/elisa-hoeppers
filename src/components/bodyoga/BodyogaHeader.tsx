import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Menu, X, User, ShoppingCart } from "lucide-react";
import { BodyogaLogo } from "./BodyogaLogo";
import { useAuth } from "@/hooks/useAuth";
import { useNavConfig, itemsFor } from "@/lib/nav-config";

const CREAM = "#FEF2D4";

export function BodyogaHeader({ alwaysGreen = false }: { alwaysGreen?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const navConfig = useNavConfig();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const green = scrolled || alwaysGreen;

  const leftItems = itemsFor(navConfig, "header", "left");
  const rightItems = itemsFor(navConfig, "header", "right");
  const navItems = [...leftItems, ...rightItems];


  const linkStyle = green ? { color: CREAM } : undefined;
  const linkClass = green
    ? "text-xs font-medium uppercase tracking-[0.18em] hover:opacity-70 transition"
    : "text-xs font-medium uppercase tracking-[0.18em] text-bodyoga-green hover:opacity-70 transition";

  return (
    <header
      className="fixed top-0 inset-x-0 z-40 transition-colors duration-300"
      style={green ? { backgroundColor: "var(--bodyoga-green)" } : undefined}
    >
      <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 flex items-center justify-end md:justify-between h-24">

        {/* Left nav */}
        <nav className="hidden md:flex flex-1 items-center justify-end gap-8 md:pr-12">
          {leftItems.map((item) => (
            <Link
              key={item.id}
              to={item.href}
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
          <BodyogaLogo variant="full" size={60} tone={green ? "cream" : "green"} />
        </Link>

        {/* Right nav */}
        <nav className="hidden md:flex flex-1 items-center justify-start gap-8 md:pl-12">
          {rightItems.map((item) => (
            <Link
              key={item.id}
              to={item.href}
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
            style={green ? { color: CREAM } : { color: "var(--bodyoga-green)" }}
          >
            <User className="w-5 h-5" />
          </Link>
          <Link
            to="/carrinho"
            aria-label="Carrinho"
            className="hover:opacity-70 transition"
            style={green ? { color: CREAM } : { color: "var(--bodyoga-green)" }}
          >
            <ShoppingCart className="w-5 h-5" />
          </Link>

        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden"
          style={green ? { color: CREAM } : { color: "var(--bodyoga-green)" }}
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
