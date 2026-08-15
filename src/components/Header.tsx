import { Link } from "@tanstack/react-router";
import { Menu, X, Instagram, Youtube } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavConfig, itemsFor } from "@/lib/nav-config";

interface HeaderProps {
  transparentOnTop?: boolean;
}


const Header = ({ transparentOnTop = false }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const navConfig = useNavConfig();

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

  const leftItems = itemsFor(navConfig, "header", "left");
  const rightItems = itemsFor(navConfig, "header", "right");
  // Logged-out users see LOGIN; logged-in users see PAINEL (and no INSCREVA-SE)
  const accountItem = user
    ? { label: "PAINEL", href: "/painel" as const }
    : { label: "LOGIN", href: "/login" as const };


  const headerBg = "bg-[#3B4F30] shadow-sm";
  const textColor = "text-[#DBCCBF]";
  const ctaBorder = "border-[#DBCCBF] text-[#DBCCBF] hover:bg-[#DBCCBF] hover:text-[#3B4F30]";
  // Filter to convert black -> #DBCCBF
  const logoFilter = "brightness(0) saturate(100%) invert(89%) sepia(8%) saturate(458%) hue-rotate(345deg) brightness(94%) contrast(88%)";

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${headerBg}`}>
      <div className={`relative max-w-[1280px] mx-auto px-4 md:px-6 flex items-center justify-end lg:justify-between h-20 md:h-24 gap-6 md:gap-10 ${textColor}`}>
        <nav className="hidden lg:flex flex-1 items-center justify-end space-x-8">
          {leftItems.map((i) => (
            <Link key={i.id} to={i.href} className="text-[12px] tracking-[0.15em] uppercase hover:opacity-70 transition-opacity font-medium">
              {i.label}
            </Link>
          ))}
        </nav>

        <Link to="/" className="flex-shrink-0 flex justify-center lg:static absolute left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-auto">
          <div className="relative hidden md:block h-20 md:h-24 w-72">
            <img
              src="/images/home/bodyoga/logo-bodyoga.png"
              alt="BODYOGA"
              className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-20 md:h-24 w-auto max-w-none"
              style={{ filter: logoFilter }}
            />
          </div>

          <img
            src="/images/home/bodyoga/logo-bodyoga.png"
            alt="BODYOGA"
            className={`md:hidden h-10 w-auto transition-all duration-300`}
            style={{ filter: logoFilter }}
          />
        </Link>


        <nav className="hidden lg:flex flex-1 items-center justify-start space-x-8">
          {rightItems.map((i) => (
            <Link key={i.id} to={i.href} className="text-[12px] tracking-[0.15em] uppercase hover:opacity-70 transition-opacity font-medium">
              {i.label}
            </Link>
          ))}
          <Link to={accountItem.href} className="text-[12px] tracking-[0.15em] uppercase hover:opacity-70 transition-opacity font-medium">
            {accountItem.label}
          </Link>
          {!user && (
            <Link
              to="/p/cadastro-de-alunos"
              className={`border px-6 py-2 rounded-full text-[11px] tracking-[0.15em] uppercase transition-all font-semibold ${ctaBorder}`}
            >
              INSCREVA-SE
            </Link>
          )}
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
            {[...leftItems, ...rightItems, accountItem].map((i) => (
              <Link
                key={i.href}
                to={i.href}
                className="text-sm tracking-widest py-2 border-b border-border"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {i.label}
              </Link>
            ))}
            {!user && (
              <Link
                to="/p/cadastro-de-alunos"
                className="border border-primary text-primary px-6 py-2 rounded-full text-[11px] tracking-widest text-center uppercase"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                INSCREVA-SE
              </Link>
            )}

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
