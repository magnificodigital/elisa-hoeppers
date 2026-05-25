import { Link } from "@tanstack/react-router";
import { Menu, X, Instagram, Youtube } from "lucide-react";
import { useEffect, useState } from "react";

interface HeaderProps {
  transparentOnTop?: boolean;
}

const LOGO_WORDMARK = "/images/logo/logo-wordmark-new.png";
const LOGO_ICON = "/images/logo/logo-icon.png";

const Header = ({ transparentOnTop = false }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!transparentOnTop) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparentOnTop]);

  const leftItems = [
    { label: "SOBRE", href: "/sobre" },
    { label: "AULAS", href: "/cursos" },
    { label: "SHOP", href: "/loja" },
  ];
  const rightItems = [
    { label: "DICAS", href: "/blog" },
    { label: "LOGIN", href: "/painel" },
  ];

  const solid = scrolled || isMobileMenuOpen;
  const headerBg = solid ? "bg-cream shadow-sm" : "bg-transparent";
  const textColor = solid ? "text-primary" : "text-cream";
  const ctaBorder = solid 
    ? "border-primary text-primary hover:bg-primary hover:text-white" 
    : "border-cream text-cream hover:bg-cream hover:text-primary";
  const logoFilter = solid 
    ? "brightness(0) saturate(100%) invert(26%) sepia(15%) saturate(1145%) hue-rotate(52deg) brightness(96%) contrast(91%)" // Verde Escuro (#3B4F30)
    : "brightness(0) saturate(100%) invert(98%) sepia(13%) saturate(302%) hue-rotate(325deg) brightness(101%) contrast(93%)"; // Creme (#F5EBE2)

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${headerBg}`}>
      <div className={`max-w-[1280px] mx-auto px-4 md:px-6 flex items-center justify-between h-16 md:h-20 ${textColor}`}>
        <nav className="hidden lg:flex items-center space-x-12 flex-1">
          {leftItems.map((i) => (
            <Link key={i.href} to={i.href} className="text-[11px] tracking-[0.2em] uppercase hover:opacity-70 transition-opacity font-medium">
              {i.label}
            </Link>
          ))}
        </nav>

        <Link to="/" className="flex-shrink-0">
          <img
            src={LOGO_WORDMARK}
            alt="Elisa Hoeppers"
            className={`hidden md:block h-8 md:h-10 w-auto transition-all duration-300`}
            style={{ filter: logoFilter }}
          />
          <img
            src={LOGO_ICON}
            alt="Elisa Hoeppers"
            className={`md:hidden h-8 w-auto transition-all duration-300`}
            style={{ filter: logoFilter }}
          />
        </Link>

        <nav className="hidden lg:flex items-center space-x-10 flex-1 justify-end">
          {rightItems.map((i) => (
            <Link key={i.href} to={i.href} className="text-[11px] tracking-[0.2em] uppercase hover:opacity-70 transition-opacity font-medium">
              {i.label}
            </Link>
          ))}
          <Link
            to="/cadastro-de-alunos"
            className={`border px-7 py-2.5 rounded-full text-[10px] tracking-[0.2em] uppercase transition-all font-semibold ${ctaBorder}`}
          >
            INSCREVA-SE
          </Link>
        </nav>

        <button
          className={`lg:hidden ${textColor}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Menu"
        >
          {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-cream border-t border-border">
          <nav className="flex flex-col p-6 space-y-4 text-primary-dark">
            {[...leftItems, ...rightItems].map((i) => (
              <Link
                key={i.href}
                to={i.href}
                className="text-sm tracking-widest py-2 border-b border-border"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {i.label}
              </Link>
            ))}
            <Link
              to="/cadastro-de-alunos"
              className="border border-primary text-primary px-6 py-2 rounded-full text-[11px] tracking-widest text-center uppercase"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              INSCREVA-SE
            </Link>
            <div className="flex justify-center space-x-6 pt-3">
              <a href="https://instagram.com/elisahoepperscasas" target="_blank" rel="noreferrer"><Instagram size={20} /></a>
              <a href="https://www.youtube.com/@ElisaHoeppers" target="_blank" rel="noreferrer"><Youtube size={20} /></a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
