import { Link } from "@tanstack/react-router";
import { Instagram, Youtube, MessageCircle } from "lucide-react";

const LOGO_URL = "/images/logo/logo-wordmark.png";

const Footer = () => {
  return (
    <footer className="bg-[#3B4F30] text-cream pt-16 pb-8">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12 mb-12">
          <div className="space-y-4">
            <div className="h-12 w-44">
              <img
                src="/images/home/bodyoga/logo-bodyoga.png"
                alt="BODYOGA"
                className="h-12 w-auto"
                style={{ filter: "brightness(0) saturate(100%) invert(89%) sepia(8%) saturate(458%) hue-rotate(345deg) brightness(94%) contrast(88%)" }}
              />
            </div>
            <p className="text-cream/70 text-sm leading-relaxed max-w-xs">
              Movimente seu corpo, cuide da sua mente.
            </p>
          </div>


          <div className="space-y-3 text-sm">
            <h4 className="uppercase tracking-widest text-[10px] text-cream/60 mb-4">Navegação</h4>
            <ul className="space-y-2">
              <li><Link to="/sobre" className="hover:text-peach transition-colors uppercase tracking-widest text-[11px]">Sobre mim</Link></li>
              <li><Link to="/agende-sua-aula" className="hover:text-peach transition-colors uppercase tracking-widest text-[11px]">Agende sua aula</Link></li>
              <li><Link to="/cursos" className="hover:text-peach transition-colors uppercase tracking-widest text-[11px]">Aulas</Link></li>
            </ul>
          </div>

          <div className="space-y-3 text-sm">
            <h4 className="uppercase tracking-widest text-[10px] text-cream/60 mb-4">Explorar</h4>
            <ul className="space-y-2">
              <li><Link to="/loja" className="hover:text-peach transition-colors uppercase tracking-widest text-[11px]">Shop</Link></li>
              <li><Link to="/blog" className="hover:text-peach transition-colors uppercase tracking-widest text-[11px]">Dicas e Novidades</Link></li>
              <li><a href="https://wa.me/5511994061178" className="hover:text-peach transition-colors uppercase tracking-widest text-[11px]">Fale conosco</a></li>
            </ul>
          </div>

          <div className="space-y-3 text-sm">
            <h4 className="uppercase tracking-widest text-xs text-cream/60 mb-4">Redes</h4>
            <div className="flex space-x-4">
              <a href="https://instagram.com/elisahoepperscasas" target="_blank" rel="noreferrer" className="hover:text-peach transition-colors"><Instagram size={20} /></a>
              <a href="https://www.youtube.com/@ElisaHoeppers" target="_blank" rel="noreferrer" className="hover:text-peach transition-colors"><Youtube size={20} /></a>
              <a href="https://wa.me/5511994061178" target="_blank" rel="noreferrer" className="hover:text-peach transition-colors"><MessageCircle size={20} /></a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-cream/10 text-center text-xs text-cream/60">
          <p className="mb-2">
            <Link to="/privacidade" className="hover:text-peach transition-colors">Privacidade</Link>
            {" · "}
            <Link to="/termos" className="hover:text-peach transition-colors">Termos de Uso</Link>
          </p>
          <p>
            © {new Date().getFullYear()} · Feito com muito ♥ por{" "}
            <a href="https://magnificodigital.com" target="_blank" rel="noreferrer" className="hover:text-peach underline">
              magnificodigital
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
