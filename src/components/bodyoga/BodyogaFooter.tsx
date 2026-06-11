import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MessageCircle } from "lucide-react";
import { BodyogaLogo } from "./BodyogaLogo";

export function BodyogaFooter() {
  return (
    <footer className="bg-bodyoga-green text-bodyoga-cream">
      <div className="max-w-[1170px] mx-auto px-4 md:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <BodyogaLogo variant="full" size={40} className="[&_span]:!text-bodyoga-cream [&_circle:first-child]:!fill-[var(--bodyoga-cream)] [&_path]:!stroke-[var(--bodyoga-green)] [&_circle:last-child]:!fill-[var(--bodyoga-green)]" />
            <p className="text-sm leading-relaxed text-bodyoga-cream/80 max-w-xs">
              Rituais para corpo, mente e ambiente. Criado à mão por Elisa Hoeppers Casas, no encontro entre o yoga e o cuidado natural.
            </p>
          </div>

          {/* Nav */}
          <div>
            <h4 className="text-sm uppercase tracking-[0.2em] mb-4">Navegação</h4>
            <ul className="space-y-2 text-sm text-bodyoga-cream/80">
              <li>
                <Link to="/bodyoga/sobre" className="hover:text-bodyoga-brown transition">Sobre</Link>
              </li>
              <li>
                <Link to="/loja" search={{ brand: "bodyoga" }} className="hover:text-bodyoga-brown transition">Shop</Link>
              </li>
              <li>
                <Link to="/blog" search={{ tag: "bodyoga" }} className="hover:text-bodyoga-brown transition">Dicas</Link>
              </li>
              <li>
                <Link to="/" className="hover:text-bodyoga-brown transition">Site Elisa Hoeppers</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm uppercase tracking-[0.2em] mb-4">Contato</h4>
            <ul className="space-y-2 text-sm text-bodyoga-cream/80">
              <li>
                <a href="https://wa.me/5500000000000" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-bodyoga-brown transition">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              </li>
              <li>
                <a href="https://instagram.com/bodyoga.com.br" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-bodyoga-brown transition">
                  <Instagram className="w-4 h-4" /> Instagram
                </a>
              </li>
              <li>
                <a href="mailto:contato@bodyoga.com.br" className="inline-flex items-center gap-1.5 hover:text-bodyoga-brown transition">
                  <Mail className="w-4 h-4" /> Email
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-bodyoga-cream/20 text-center text-xs text-bodyoga-cream/60">
          © {new Date().getFullYear()} BODYOGA® — Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
