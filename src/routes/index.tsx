import { createFileRoute, Link } from "@tanstack/react-router";
import Layout from "@/components/Layout";

export const Route = createFileRoute("/")({
  component: Index,
});

const products = [
  { name: "Higienizador Orgânico para mãos", price: "R$ 75,00", img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80", badge: null },
  { name: "Pesinhos BODYOGA", price: "R$ 420,00", img: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80", badge: null },
  { name: "Sabonete hidratante", price: "", img: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=600&q=80", badge: "Em breve" },
  { name: "Difusores", price: "", img: "https://images.unsplash.com/photo-1602928321679-560bb453f190?w=600&q=80", badge: "Em breve" },
  { name: "Spray de Ambiente", price: "", img: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&q=80", badge: "Em breve" },
  { name: "Blend de óleos essenciais", price: "", img: "https://images.unsplash.com/photo-1608068811588-3a67007b8d3c?w=600&q=80", badge: "Em breve" },
];

const aulas = [
  { title: "BODYOGA", subtitle: "Bodyoga · AO VIVO", img: "https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=800&q=80" },
  { title: "MEDITAÇÃO", subtitle: "Meditação", img: "https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&q=80" },
  { title: "YOGA", subtitle: "YOGA", img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80" },
];

const posts = [
  { title: "Os diferentes tipos de yoga e como escolher o seu", img: "https://images.unsplash.com/photo-1593810450967-f9c42742e326?w=800&q=80" },
  { title: "Os benefícios do yoga para sua saúde mental", img: "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800&q=80" },
  { title: "Cromoterapia: cuidando da pele através das cores", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80" },
];

function Index() {
  return (
    <Layout noTopPadding>
      {/* HERO */}
      <section className="relative w-full h-screen min-h-[600px] max-h-[800px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1920&q=80"
          alt="Elisa praticando yoga"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 h-full flex items-center justify-center pt-16 md:pt-20">
          <div className="container mx-auto px-6 max-w-[1280px] text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-32 md:mt-48">
              <Link
                to="/agende-sua-aula"
                className="bg-primary text-white px-8 py-3 rounded-full uppercase tracking-widest text-xs font-medium hover:bg-primary-dark transition"
              >
                Agende sua aula
              </Link>
              <Link
                to="/loja"
                className="bg-white/90 backdrop-blur text-primary px-8 py-3 rounded-full uppercase tracking-widest text-xs font-medium hover:bg-white transition"
              >
                Ver produtos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SHOP */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-6 max-w-[1170px]">
          <h2 className="font-display text-3xl md:text-4xl text-primary text-center mb-12">Shop</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {products.map((p) => (
              <Link key={p.name} to="/loja" className="group">
                <div className="relative aspect-square overflow-hidden rounded-sm bg-sand mb-3">
                  <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {p.badge && (
                    <span className="absolute top-3 left-3 bg-primary text-white text-[10px] px-2 py-1 uppercase tracking-wider">
                      {p.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-sm text-primary">{p.name}</h3>
                {p.price && <p className="text-sm text-primary/70 mt-1">{p.price}</p>}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* EXPLORAR AULAS */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-6 max-w-[1170px]">
          <h2 className="font-display text-3xl md:text-4xl text-primary text-center mb-3">Explorar Aulas</h2>
          <p className="text-center text-primary/70 mb-12 max-w-xl mx-auto">
            Encontre a harmonia e a energia que você busca, em nossas aulas.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aulas.map((a) => (
              <div key={a.title} className="bg-white rounded-sm overflow-hidden shadow-sm">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={a.img} alt={a.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="font-display text-3xl md:text-4xl text-white tracking-wider">{a.title}</span>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-primary">{a.subtitle}</p>
                  <Link
                    to="/cursos"
                    className="block text-center border border-primary text-primary px-6 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition"
                  >
                    Conheça a aula
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BODYOGA BRAND */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-[1280px] grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] gap-8 items-center">
          <img src="https://images.unsplash.com/photo-1518310383802-640c2de311b6?w=400&q=80" alt="BODYOGA" className="rounded-sm object-cover aspect-square w-full" />
          <div className="text-center px-4">
            <h2 className="font-display text-5xl md:text-6xl text-primary mb-6 tracking-wide">
              BOD<span className="relative">Y<span className="absolute -top-2 -right-2 text-xs">®</span></span>OGA
            </h2>
            <p className="text-primary/80 text-sm leading-relaxed mb-6 max-w-md mx-auto">
              É uma prática inovadora que combina o ritmo do yoga com pesinhos especiais, criando uma experiência única para fortalecer corpo e mente.
            </p>
            <Link
              to="/cursos"
              className="inline-block bg-primary text-white px-8 py-3 rounded-full uppercase tracking-widest text-xs hover:bg-primary-dark transition"
            >
              Saiba mais
            </Link>
          </div>
          <img src="https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=400&q=80" alt="BODYOGA pesinhos" className="rounded-sm object-cover aspect-square w-full" />
        </div>
      </section>

      {/* ÓLEOS ESSENCIAIS */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-6 max-w-[1170px] grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-3xl md:text-4xl text-primary mb-6">Óleos Essenciais</h2>
            <div className="space-y-4 text-primary/80 text-sm leading-relaxed">
              <p>Que tal entrar no caminho da cura com nossos eleitos e ainda desfrutar dos benefícios dos óleos essenciais naturais?</p>
              <p>O cheiro da Hoeppers contém um blend de óleos sagrados com aromas terrosos e ancestrais, e o difusor proporciona aroma, relaxamento e prazer.</p>
              <p>Uma mistura especial com óleos essenciais que acalma, amplia e harmoniza o cuidado do campo sutil. Acolhe seus conflitos e ansiedades. Ótimo apoio para usar antes de dormir, na sua prática de yoga, meditação e sempre que você desejar entrar em si.</p>
              <p>Encontre nossa curadoria sobre o nosso pequeno catálogo de produtos.</p>
              <p>Descobra o nosso óleo Elisa Hoeppers e transforme seu rotina em um agradável momento de bem-estar.</p>
            </div>
            <Link
              to="/loja"
              className="inline-block mt-8 bg-primary text-white px-8 py-3 rounded-full uppercase tracking-widest text-xs hover:bg-primary-dark transition"
            >
              Comprar agora
            </Link>
          </div>
          <img src="https://images.unsplash.com/photo-1611073615452-4889ade07ef0?w=800&q=80" alt="Óleos essenciais" className="rounded-sm w-full aspect-[3/4] object-cover" />
        </div>
      </section>

      {/* SOBRE ELISA */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-6 max-w-[1170px] grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <img src="https://images.unsplash.com/photo-1599447332411-fd6ca54a1d23?w=800&q=80" alt="Elisa Hoeppers" className="rounded-sm w-full aspect-square object-cover order-2 md:order-1" />
          <div className="order-1 md:order-2">
            <h2 className="font-display text-3xl md:text-4xl text-primary mb-6">Elisa Hoeppers</h2>
            <div className="space-y-4 text-primary/80 text-sm leading-relaxed">
              <p>Sou professora de Yoga, fundadora do BODYOGA, perfumista e mãe, e busco a harmonia entre o corpo, a mente e o espírito através do profundo amor e respeito pela sua prática interna.</p>
              <p>Em 2014, dei o salto e me dediquei aos estudos de yoga, aromaterapia e cuidados naturais, mergulhando nos benefícios que a prática traz e descobrindo nela a vibração de uma prática mais ampla e abrangente do autoconhecimento do yoga.</p>
              <p>Hoje meu maior compartilhar os benefícios transformados do yoga, ajudando outras pessoas a encontrar equilíbrio, paz interior e bem-estar através das práticas que mudaram minha vida.</p>
            </div>
            <Link
              to="/sobre"
              className="inline-block mt-8 bg-primary text-white px-8 py-3 rounded-full uppercase tracking-widest text-xs hover:bg-primary-dark transition"
            >
              Saiba mais
            </Link>
          </div>
        </div>
      </section>

      {/* DICAS E NOVIDADES */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-6 max-w-[1170px]">
          <h2 className="font-display text-3xl md:text-4xl text-primary text-center mb-3">Dicas e Novidades</h2>
          <p className="text-center text-primary/70 mb-12 max-w-2xl mx-auto">
            Encontre a harmonia e a leve energia que você precisa com a luz do yoga e aromaterapia. Acolhe os benefícios terapêuticos dos seus essenciais para transformar sua vida e trazer equilíbrio para seu corpo e mente.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map((p) => (
              <Link to="/blog" key={p.title} className="group relative aspect-[3/4] rounded-sm overflow-hidden block">
                <img src={p.img} alt={p.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <h3 className="font-display text-lg md:text-xl mb-3">{p.title}</h3>
                  <span className="text-xs uppercase tracking-widest border-b border-white pb-1">Descobra</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* INSTAGRAM */}
      <section className="py-16 bg-cream">
        <div className="container mx-auto px-6 max-w-[1280px]">
          <p className="text-center text-primary/70 mb-8 text-sm">
            Junte-se a comunidade e nos siga no instagram
          </p>
          <a
            href="https://instagram.com/elisa.hoeppers"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-3 mb-8"
          >
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">EH</div>
            <div className="text-left">
              <p className="text-primary font-semibold text-sm">@elisa.hoeppers</p>
              <p className="text-primary/60 text-xs">Yoga · Meditação · Aromaterapia · Bodyoga</p>
            </div>
          </a>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              "https://images.unsplash.com/photo-1545389336-cf090694435e?w=400&q=80",
              "https://images.unsplash.com/photo-1593810450967-f9c42742e326?w=400&q=80",
              "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80",
              "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400&q=80",
              "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80",
            ].map((src, i) => (
              <a key={i} href="https://instagram.com/elisa.hoeppers" target="_blank" rel="noreferrer" className="aspect-square overflow-hidden">
                <img src={src} alt={`Instagram ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
