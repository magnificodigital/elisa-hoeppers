import { Link } from "@tanstack/react-router";
import { Instagram, Youtube, Menu, X } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const leftItems = [
    { label: "SOBRE", href: "/sobre" },
    { label: "AULAS", href: "/cursos" },
    { label: "SHOP", href: "/loja" },
  ];
  const rightItems = [
    { label: "DICAS", href: "/blog" },
    { label: "LOGIN", href: "/painel" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary text-white">
      <div className="container mx-auto px-6 max-w-[1280px] flex items-center justify-between h-16 md:h-20">
        {/* Left menu */}
        <nav className="hidden lg:flex items-center space-x-8 flex-1">
          {leftItems.map((i) => (
            <Link key={i.href} to={i.href} className="text-sm tracking-widest hover:text-peach transition-colors">
              {i.label}
            </Link>
          ))}
        </nav>

        {/* Center logo */}
        <Link to="/" className="flex-shrink-0">
          <img 
            src="https://ynvrijkuampxpsmshftm.supabase.co/storage/v1/object/public/prompt-images/uploads/1779727219616-326e2eb0-8de1-4b94-8da7-f13e446eac94.png" 
            alt="Elisa Hoeppers Logo" 
            className="h-10 md:h-12 w-auto brightness-0 invert"
          />
        </Link>

        {/* Right menu */}
        <nav className="hidden lg:flex items-center space-x-6 flex-1 justify-end">
          {rightItems.map((i) => (
            <Link key={i.href} to={i.href} className="text-sm tracking-widest hover:text-peach transition-colors">
              {i.label}
            </Link>
          ))}
          <Link
            to="/cadastro-de-alunos"
            className="border border-white/60 px-4 py-2 rounded-full text-xs tracking-widest hover:bg-white hover:text-primary transition-all"
          >
            INSCREVA-SE
          </Link>
        </nav>

        {/* Mobile button */}
        <button className="lg:hidden text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-primary border-t border-white/10">
          <nav className="flex flex-col p-6 space-y-4">
            {[...leftItems, ...rightItems].map((i) => (
              <Link
                key={i.href}
                to={i.href}
                className="text-sm tracking-widest py-2 border-b border-white/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {i.label}
              </Link>
            ))}
            <Link
              to="/cadastro-de-alunos"
              className="border border-white px-4 py-2 rounded-full text-xs tracking-widest text-center"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              INSCREVA-SE
            </Link>
            <div className="flex justify-center space-x-6 pt-3">
              <a href="https://instagram.com/elisa.hoeppers" target="_blank" rel="noreferrer"><Instagram size={20} /></a>
              <a href="https://www.youtube.com/@ElisaHoeppers" target="_blank" rel="noreferrer"><Youtube size={20} /></a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
