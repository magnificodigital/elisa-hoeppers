import { Link } from "@tanstack/react-router";
import { Instagram, Youtube, MessageCircle, Facebook } from "lucide-react";
import { useNavConfig, itemsFor } from "@/lib/nav-config";
import { MenuLink } from "@/components/MenuLink";
import { useSocialLinks } from "@/lib/social-config";



const Footer = () => {
  const navConfig = useNavConfig();
  const leftItems = itemsFor(navConfig, "footer", "left");
  const rightItems = itemsFor(navConfig, "footer", "right");
  const social = useSocialLinks();

  return (
    <footer className="bg-[#3B4F30] text-cream pt-16 pb-8">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12 mb-12">
          <div className="space-y-4">
            <div className="h-20 w-64">
              <img
                src="/images/home/bodyoga/logo-bodyoga.png"
                alt="BODYOGA"
                className="h-20 w-auto"
                style={{ filter: "brightness(0) saturate(100%) invert(89%) sepia(8%) saturate(458%) hue-rotate(345deg) brightness(94%) contrast(88%)" }}
              />
            </div>
          </div>


          <div className="space-y-3 text-sm">
            <ul className="space-y-2">
              {leftItems.map((i) => (
                <li key={i.id}><MenuLink href={i.href} className="hover:text-peach transition-colors uppercase tracking-widest text-[11px]">{i.label}</MenuLink></li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 text-sm">
            <ul className="space-y-2">
              {rightItems.map((i) => (
                <li key={i.id}><MenuLink href={i.href} className="hover:text-peach transition-colors uppercase tracking-widest text-[11px]">{i.label}</MenuLink></li>
              ))}
            </ul>
          </div>


          <div className="space-y-3 text-sm">
            <div className="flex space-x-4">
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-peach transition-colors"><Instagram size={20} /></a>
              )}
              {social.youtube && (
                <a href={social.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" className="hover:text-peach transition-colors"><Youtube size={20} /></a>
              )}
              {social.facebook && (
                <a href={social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:text-peach transition-colors"><Facebook size={20} /></a>
              )}
              {social.whatsapp && (
                <a href={social.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="hover:text-peach transition-colors"><MessageCircle size={20} /></a>
              )}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-cream/10 text-center text-xs text-cream/60">
          <p className="mb-2">
            <Link to={"/privacidade" as any} className="hover:text-peach transition-colors">Privacidade</Link>
            {" · "}
            <Link to={"/termos" as any} className="hover:text-peach transition-colors">Termos de Uso</Link>
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
