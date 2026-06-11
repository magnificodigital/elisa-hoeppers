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

  return (
    <header className="sticky top-0 z-40 bg-bodyoga-cream/95 backdrop-blur border-b border-bodyoga-brown/20">
      <div className="max-w-[1170px] mx-auto px-4 md:px-6 flex items-center justify-between h-20">
        {/* Logo */}
        <Link to="/bodyoga" className="flex items-center gap-3">
          <BodyogaLogo variant="full" size={40} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              search={item.search}
              className="text-sm uppercase tracking-[0.18em] text-bodyoga-green hover:text-bodyoga-brown transition"
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <Link
              to="/painel"
              className="inline-flex items-center gap-1.5 text-sm uppercase tracking-[0.18em] text-bodyoga-green hover:text-bodyoga-brown transition"
            >
              <User className="w-4 h-4" />
              Painel
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-sm uppercase tracking-[0.18em] px-5 py-2 rounded-full bg-bodyoga-green text-bodyoga-cream hover:bg-bodyoga-brown transition"
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
        <div className="md:hidden border-t border-bodyoga-brown/20 px-4 py-6 space-y-4 bg-bodyoga-cream">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              search={item.search}
              onClick={() => setOpen(false)}
              className="block text-base uppercase tracking-[0.18em] text-bodyoga-green hover:text-bodyoga-brown transition"
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
