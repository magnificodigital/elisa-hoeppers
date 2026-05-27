import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe, Calendar, GraduationCap, Dumbbell, ShoppingBag, Sparkles, Instagram, Youtube, MessageCircle } from "lucide-react";
import Layout from "@/components/Layout";

export const Route = createFileRoute("/bio")({
  head: () => ({
    meta: [
      { title: "Elisa Hoeppers — bio" },
      { name: "description", content: "Fundadora do BODYOGA · Professora de YOGA · Aromaterapia e perfumaria. Acesse meus links." },
      { property: "og:title", content: "Elisa Hoeppers" },
      { property: "og:description", content: "Fundadora do BODYOGA · Professora de YOGA · Aromaterapia e perfumaria." },
      { property: "og:image", content: "/images/home/instagram/round-2.png" },
    ],
  }),
  component: BioPage,
});

const links = [
  { label: "Site oficial", icon: Globe, href: "/" },
  { label: "Agende sua aula", icon: Calendar, href: "/agende-sua-aula" },
  { label: "Aulas online", icon: GraduationCap, href: "/cursos" },
  { label: "BODYOGA", icon: Dumbbell, href: "/cursos/bodyoga-ao-vivo" },
  { label: "Ver produtos", icon: ShoppingBag, href: "/loja" },
  { label: "Elisa Casas — perfumista", icon: Sparkles, href: "/perfumista" },
];

function BioPage() {
  return (
    <Layout noTopPadding>
      <section className="min-h-screen bg-cream py-10 px-4 flex items-center justify-center">
        <div className="w-full max-w-[28rem] mx-auto text-center">
          {/* Avatar */}
          <img
            src="/images/home/instagram/round-2.png"
            alt="Elisa Hoeppers"
            className="w-28 h-28 rounded-full mx-auto mb-5 object-cover border-4 border-white shadow-md"
          />

          {/* Nome */}
          <h1 className="font-display text-2xl text-primary-dark mb-1">
            Elisa Hoeppers Casas
          </h1>

          {/* Bio */}
          <p className="text-sm text-primary/70 mb-8 leading-relaxed">
            Fundadora do <strong>@bodyoga__</strong> ®️ · Professora de YOGA ·
            Aromaterapia com óleos essenciais · Alquimia olfativa
          </p>

          {/* Botões */}
          <div className="space-y-3 mb-8">
            {links.map((l) => {
              const Icon = l.icon;
              const cls = "w-full bg-white border border-border hover:border-primary text-primary-dark text-sm font-medium py-3.5 px-5 rounded-full transition flex items-center justify-center gap-2 shadow-sm hover:shadow";
              const content = (
                <>
                  <Icon className="w-4 h-4 shrink-0" />
                  {l.label}
                </>
              );
              return (
                <Link key={l.label} to={l.href} className={cls}>
                  {content}
                </Link>
              );
            })}
          </div>

          {/* Redes */}
          <div className="flex items-center justify-center gap-5 text-primary/60">
            <a href="https://instagram.com/elisahoeppers" target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-primary transition">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://youtube.com/@ElisaHoeppers" target="_blank" rel="noreferrer" aria-label="YouTube" className="hover:text-primary transition">
              <Youtube className="w-5 h-5" />
            </a>
            <a href="https://wa.me/5511994061178" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="hover:text-primary transition">
              <MessageCircle className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
