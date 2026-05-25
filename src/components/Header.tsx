import { Link } from "@tanstack/react-router";
import { Instagram, Youtube, Phone, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuItems = [
    { label: "Sobre", href: "/sobre" },
    { label: "Aulas", href: "/cursos" },
    { label: "Shop", href: "/loja" },
    { label: "Dicas", href: "/blog" },
    { label: "Login", href: "/painel" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-cream/90 backdrop-blur-md shadow-sm py-3" : "bg-cream py-5"
      }`}
    >
      <div className="container mx-auto px-4 max-w-[1170px] flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src="/logo.png" alt="Elisa Hoeppers" className="h-10 md:h-12" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-8">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="text-primary font-medium hover:text-primary-dark transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/cadastro-de-alunos"
            className="bg-primary text-white px-6 py-2 rounded-full font-semibold uppercase tracking-wider text-sm hover:bg-primary-dark transition-colors"
          >
            Inscreva-se
          </Link>
          
          <div className="flex items-center space-x-4 ml-4">
            <a href="https://instagram.com/elisa.hoeppers" target="_blank" rel="noreferrer" className="text-primary hover:text-primary-dark">
              <Instagram size={20} />
            </a>
            <a href="https://www.youtube.com/@ElisaHoeppers" target="_blank" rel="noreferrer" className="text-primary hover:text-primary-dark">
              <Youtube size={20} />
            </a>
            <a href="https://wa.me/5511994061178" target="_blank" rel="noreferrer" className="text-primary hover:text-primary-dark">
              <Phone size={20} />
            </a>
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-primary"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-cream shadow-xl border-t border-sand animate-in fade-in slide-in-from-top-4 duration-300">
          <nav className="flex flex-col p-6 space-y-4">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-primary text-lg font-medium py-2 border-b border-sand/50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/cadastro-de-alunos"
              className="bg-primary text-white px-6 py-3 rounded-full font-semibold uppercase tracking-wider text-center"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Inscreva-se
            </Link>
            <div className="flex justify-center space-x-8 pt-4">
              <a href="https://instagram.com/elisa.hoeppers" target="_blank" rel="noreferrer" className="text-primary">
                <Instagram size={24} />
              </a>
              <a href="https://www.youtube.com/@ElisaHoeppers" target="_blank" rel="noreferrer" className="text-primary">
                <Youtube size={24} />
              </a>
              <a href="https://wa.me/5511994061178" target="_blank" rel="noreferrer" className="text-primary">
                <Phone size={24} />
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
