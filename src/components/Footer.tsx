import { Link } from "@tanstack/react-router";
import { Instagram, Youtube, MessageCircle } from "lucide-react";

const LOGO_URL =
  "https://ynvrijkuampxpsmshftm.supabase.co/storage/v1/object/public/prompt-images/uploads/1779727219616-326e2eb0-8de1-4b94-8da7-f13e446eac94.png";

const Footer = () => {
  return (
    <footer className="bg-[#3B4F30] text-cream pt-16 pb-8">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12 mb-12">
          <div className="space-y-4">
            <img src={LOGO_URL} alt="Elisa Hoeppers" className="h-12 w-auto brightness-0 invert" />
            <p className="text-cream/70 text-sm leading-relaxed max-w-xs">
              Movimente seu corpo, cuide da sua mente.
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <h4 className="uppercase tracking-widest text-xs text-cream/60 mb-4">Navegação</h4>
            <ul className="space-y-2">
              <li><Link to="/sobre" className="hover:text-peach transition-colors">Sobre mim</Link></li>
              <li><Link to="/agende-sua-aula" className="hover:text-peach transition-colors">Agende sua aula</Link></li>
              <li><Link to="/cursos" className="hover:text-peach transition-colors">Aulas</Link></li>
            </ul>
          </div>

          <div className="space-y-3 text-sm">
            <h4 className="uppercase tracking-widest text-xs text-cream/60 mb-4">Explorar</h4>
            <ul className="space-y-2">
              <li><Link to="/loja" className="hover:text-peach transition-colors">Shop</Link></li>
              <li><Link to="/blog" className="hover:text-peach transition-colors">Dicas e Novidades</Link></li>
              <li><a href="https://wa.me/5511994061178" className="hover:text-peach transition-colors">Fale conosco</a></li>
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
