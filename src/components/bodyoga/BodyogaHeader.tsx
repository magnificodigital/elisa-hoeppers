import { Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Menu, X, User, ShoppingCart } from "lucide-react";
import { BodyogaLogo } from "./BodyogaLogo";
import { useAuth } from "@/hooks/useAuth";
import { useNavConfig, itemsFor } from "@/lib/nav-config";
import { listPages } from "@/lib/pages";
import { useQuery } from "@tanstack/react-query";



export function BodyogaHeader({ alwaysGreen = false }: { alwaysGreen?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const navConfig = useNavConfig();
  const { data: dbPages } = useQuery({ queryKey: ["pages-active-menu"], queryFn: listPages });
  const { data: logoSetting } = useQuery({ 
    queryKey: ["setting", "logo_filter"], 
    queryFn: () => getSetting("logo_filter") 
  });

  const logoFilter = logoSetting || "brightness(0) saturate(100%) invert(89%) sepia(8%) saturate(458%) hue-rotate(345deg) brightness(94%) contrast(88%)";

  const dynamicItems = useMemo(() => {
    if (!dbPages) return [];
    return dbPages
      .filter(p => p.in_menu && p.status === 'active')
      .map(p => ({
        id: p.id,
        label: p.title.toUpperCase(),
        href: `/p/${p.slug}`,
        header: "left" as const, // Defaulting to left for header
        footer: "left" as const,
        order: p.menu_order ?? 99
      }));
  }, [dbPages]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const green = scrolled || alwaysGreen;

  const leftItems = itemsFor(navConfig, "header", "left");
  const rightItems = itemsFor(navConfig, "header", "right");
  const navItems = [...leftItems, ...dynamicItems, ...rightItems];


  const linkStyle = green ? { color: "var(--bodyoga-cream)" } : undefined;
  const linkClass = green
    ? "text-xs font-medium uppercase tracking-[0.18em] hover:opacity-70 transition"
    : "text-xs font-medium uppercase tracking-[0.18em] text-bodyoga-green hover:opacity-70 transition";

  return (
    <header
      className="fixed top-0 inset-x-0 z-40 transition-colors duration-300"
      style={green ? { backgroundColor: "var(--bodyoga-green)" } : undefined}
    >
      <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 flex items-center justify-between h-24">

        {/* Left nav */}
        <nav className="hidden md:flex flex-1 items-center justify-end gap-8 md:pr-12">
          {leftItems.map((item) => (
            <Link
              key={item.id}
              to={item.href as any}
              className={linkClass}
              style={linkStyle}
            >
              {item.label}
            </Link>
          ))}
          {dynamicItems.map((item) => (
            <Link
              key={item.id}
              to={item.href as any}
              className={linkClass}
              style={linkStyle}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Centered logo */}
        <Link
          to="/"
          className="flex-shrink-0 flex justify-center md:static absolute left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto"
        >
          <img
            src="/images/home/bodyoga/logo-bodyoga.png"
            alt="BODYOGA"
            className="h-12 md:h-16 w-auto object-contain"
            style={{ filter: logoFilter }}
          />
        </Link>

        {/* Right nav */}
        <nav className="hidden md:flex flex-1 items-center justify-start gap-8 md:pl-12">
          {rightItems.map((item) => (
            <Link
              key={item.id}
              to={item.href as any}
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
            style={green ? { color: "var(--bodyoga-cream)" } : { color: "var(--bodyoga-green)" }}
          >
            <User className="w-5 h-5" />
          </Link>
          <Link
            to="/carrinho"
            aria-label="Carrinho"
            className="hover:opacity-70 transition"
            style={green ? { color: "var(--bodyoga-cream)" } : { color: "var(--bodyoga-green)" }}
          >
            <ShoppingCart className="w-5 h-5" />
          </Link>

        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden relative z-50 p-2 ml-auto flex items-center justify-center w-10 h-10 group"
          style={open || green ? { color: "var(--bodyoga-cream)" } : { color: "var(--bodyoga-green)" }}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
        >
          <div className="relative w-6 h-5 flex flex-col justify-between items-end">
            <span 
              className={`h-[1.5px] bg-current transition-all duration-300 ease-in-out ${
                open ? "w-6 absolute top-1/2 -translate-y-1/2 rotate-45" : "w-6"
              }`} 
            />
            <span 
              className={`h-[1.5px] bg-current transition-all duration-300 ease-in-out ${
                open ? "opacity-0" : "w-4"
              }`} 
            />
            <span 
              className={`h-[1.5px] bg-current transition-all duration-300 ease-in-out ${
                open ? "w-6 absolute top-1/2 -translate-y-1/2 -rotate-45" : "w-5"
              }`} 
            />
          </div>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden bg-bodyoga-green backdrop-blur-md flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col items-center gap-6 w-full max-w-[280px] pt-10">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.href as any}
                onClick={() => setOpen(false)}
                className="block text-sm font-medium uppercase tracking-[0.25em] text-bodyoga-cream hover:opacity-70 transition-colors py-2"
              >
                {item.label}
              </Link>
            ))}
            
            <div className="w-8 h-[1px] bg-bodyoga-cream/20 my-2" />
            
            <div className="flex flex-col gap-5 w-full">
              <Link
                to={user ? "/painel" : "/login"}
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-3 text-sm font-medium uppercase tracking-[0.2em] text-bodyoga-cream hover:opacity-70 transition-colors"
              >
                <User className="w-4 h-4 stroke-[1.5]" />
                {user ? "Painel" : "Minha Conta"}
              </Link>
              <Link
                to="/carrinho"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-3 text-sm font-medium uppercase tracking-[0.2em] text-bodyoga-cream hover:opacity-70 transition-colors"
              >
                <ShoppingCart className="w-4 h-4 stroke-[1.5]" />
                Carrinho
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
