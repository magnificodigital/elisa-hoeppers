import { Link } from "@tanstack/react-router";
import { Instagram, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-white pt-16 pb-8">
      <div className="container mx-auto px-6 max-w-[1280px]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div className="space-y-4">
            <img 
              src="https://ynvrijkuampxpsmshftm.supabase.co/storage/v1/object/public/prompt-images/uploads/1779727219616-326e2eb0-8de1-4b94-8da7-f13e446eac94.png" 
              alt="Elisa Hoeppers Logo" 
              className="h-12 w-auto brightness-0 invert"
            />
            <p className="text-white/70 text-sm leading-relaxed max-w-xs">
              Movimente seu corpo, cuide da sua mente.
            </p>
            <div className="flex space-x-3 pt-2">
              <a href="https://instagram.com/elisa.hoeppers" target="_blank" rel="noreferrer" className="hover:text-peach"><Instagram size={20} /></a>
              <a href="https://www.youtube.com/@ElisaHoeppers" target="_blank" rel="noreferrer" className="hover:text-peach"><Youtube size={20} /></a>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <h4 className="uppercase tracking-widest text-xs text-white/60 mb-4">Navegação</h4>
            <ul className="space-y-2">
              <li><Link to="/sobre" className="hover:text-peach">Sobre</Link></li>
              <li><Link to="/agende-sua-aula" className="hover:text-peach">Agende sua aula</Link></li>
              <li><Link to="/cursos" className="hover:text-peach">Aulas</Link></li>
              <li><Link to="/loja" className="hover:text-peach">Loja</Link></li>
              <li><Link to="/blog" className="hover:text-peach">Blog</Link></li>
            </ul>
          </div>

          <div className="space-y-3 text-sm">
            <h4 className="uppercase tracking-widest text-xs text-white/60 mb-4">Contato</h4>
            <p>Rua Itapolis 818 — Pacaembu</p>
            <p>São Paulo / SP</p>
            <p>
              <a href="https://wa.me/5511994061178" className="hover:text-peach">+55 11 99406-1178</a>
            </p>
            <p>
              <a href="mailto:contato@elisahoeppers.com.br" className="hover:text-peach">contato@elisahoeppers.com.br</a>
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 text-center text-xs text-white/60">
          <p>
            © {new Date().getFullYear()} Elisa Hoeppers · Desenvolvido por{" "}
            <a href="https://magnificodigital.com" target="_blank" rel="noreferrer" className="hover:text-peach underline">
              Magnifico Digital
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
