import { Link } from "@tanstack/react-router";
import { Instagram, Youtube, Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-sand text-primary-dark pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-[1170px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Col 1: Logo & Tagline */}
          <div className="space-y-6">
            <Link to="/">
              <img src="/logo.png" alt="Elisa Hoeppers" className="h-12" />
            </Link>
            <p className="text-primary/80 max-w-xs">
              Movimente seu corpo, cuide da sua mente. Yoga, Aromaterapia e Autocuidado.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-6">
            <h4 className="font-display text-xl">Navegação</h4>
            <ul className="space-y-3">
              <li><Link to="/sobre" className="hover:underline transition-all">Sobre</Link></li>
              <li><Link to="/agende-sua-aula" className="hover:underline transition-all">Agende sua aula</Link></li>
              <li><Link to="/cursos" className="hover:underline transition-all">Aulas / Cursos</Link></li>
              <li><Link to="/loja" className="hover:underline transition-all">Loja</Link></li>
              <li><Link to="/blog" className="hover:underline transition-all">Blog</Link></li>
            </ul>
          </div>

          {/* Col 3: Contact */}
          <div className="space-y-6">
            <h4 className="font-display text-xl">Contato</h4>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <Phone size={20} className="mt-1 flex-shrink-0" />
                <span>+55 11 99406-1178</span>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin size={20} className="mt-1 flex-shrink-0" />
                <span>Rua Itapolis 818 — Pacaembu — São Paulo/SP</span>
              </li>
              <li className="flex items-start space-x-3">
                <Mail size={20} className="mt-1 flex-shrink-0" />
                <span>contato@elisahoeppers.com.br</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Social */}
          <div className="space-y-6">
            <h4 className="font-display text-xl">Redes Sociais</h4>
            <div className="flex space-x-4">
              <a href="https://instagram.com/elisa.hoeppers" target="_blank" rel="noreferrer" className="bg-primary/10 p-3 rounded-full hover:bg-primary hover:text-white transition-all">
                <Instagram size={24} />
              </a>
              <a href="https://www.youtube.com/@ElisaHoeppers" target="_blank" rel="noreferrer" className="bg-primary/10 p-3 rounded-full hover:bg-primary hover:text-white transition-all">
                <Youtube size={24} />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-primary/10 text-center text-sm">
          <p>
            © {new Date().getFullYear()} Elisa Hoeppers · Desenvolvido por{" "}
            <a href="https://magnificodigital.com" target="_blank" rel="noreferrer" className="font-semibold hover:underline">
              Magnifico Digital
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
