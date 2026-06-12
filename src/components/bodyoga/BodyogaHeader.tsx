import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, User } from "lucide-react";
import { BodyogaLogo } from "./BodyogaLogo";
import { useAuth } from "@/hooks/useAuth";

export function BodyogaHeader() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const navItems = [
    { to: "/bodyoga/sobre" as const, label: "Sobre" },
    { to: "/loja" as const, search: { brand: "bodyoga" }, label: "Shop" },
    { to: "/blog" as const, search: { tag: "bodyoga" }, label: "Dicas" },
  ];

  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(2);

  return (
    <header className="fixed top-0 inset-x-0 z-40">
      <div className="relative max-w-[1280px] mx-auto px-4 md:px-6 flex items-center justify-end md:justify-between h-24">

        {/* Left nav */}
        <nav className="hidden md:flex flex-1 items-center justify-end gap-8 md:pr-12">
          {leftItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              search={item.search}
              className="text-xs font-medium uppercase tracking-[0.18em] text-bodyoga-green hover:opacity-70 transition"
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
          <BodyogaLogo variant="full" size={60} tone="green" />
        </Link>

        {/* Right nav */}
        <nav className="hidden md:flex flex-1 items-center justify-start gap-8 md:pl-12">
          {rightItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              search={item.search}
              className="text-xs font-medium uppercase tracking-[0.18em] text-bodyoga-green hover:opacity-70 transition"
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <Link
              to="/painel"
              className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-bodyoga-green hover:opacity-70 transition"
            >
              <User className="w-4 h-4" />
              Painel
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-xs uppercase tracking-[0.18em] px-5 py-2 rounded-full border border-bodyoga-green text-bodyoga-green hover:bg-bodyoga-green hover:text-bodyoga-cream transition"
            >
              Inscreva-se
            </Link>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-bodyoga-green"
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
          {user ? (
            <Link
              to="/painel"
              onClick={() => setOpen(false)}
              className="block text-base uppercase tracking-[0.18em] text-bodyoga-green"
            >
              Painel
            </Link>
          ) : (
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="block text-base uppercase tracking-[0.18em] text-bodyoga-green"
            >
              Inscreva-se
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
