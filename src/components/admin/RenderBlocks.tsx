import React, { useEffect, useState, useMemo } from "react";
import BodyogaHeroSlider from "../bodyoga/BodyogaHeroSlider";
import { BodyogaProductCard } from "../bodyoga/BodyogaProductCard";
import HomeInstagram from "../home/HomeInstagram";
import HomeBlog from "../home/HomeBlog";
import { listActiveSlides, listProducts, formatPriceBRL } from "@/lib/shop";
import { listPublishedCourses } from "@/lib/courses";
import { getSetting } from "@/lib/settings";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  Leaf, 
  Heart, 
  Sparkles, 
  Flower2, 
  Sprout, 
  Clock, 
  Layout, 
  Star,
  CheckCircle2,
  ArrowRight,
  Globe,
  Calendar,
  GraduationCap,
  Dumbbell,
  ShoppingBag,
  Instagram,
  Youtube,
  MessageCircle,
  Video,
  Users,
  User as UserIcon,
  MapPin,
  ChevronRight,
  Check
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import iconAsset from "@/assets/bodyoga/icone-bodyoga-2.png.asset.json";
import { CustomProjectForm } from "@/components/projetos/CustomProjectForm";
import { useAuth } from "@/hooks/useAuth";
import {
  listServices, listTakenSlots, bookAppointment, generateSlotsForDate,
  listAvailabilityRules, listAvailabilityBlocks,
  formatCurrencyBRL, formatTime, formatDate,
  type Service,
} from "@/lib/appointments";


function HomeHeroBlock() {
  // Deixa o próprio slider buscar os slides ativos (evita cair no DefaultHero
  // "Rituais para corpo" enquanto carrega). Igual ao comportamento do site publicado.
  return <BodyogaHeroSlider />;
}

function HomeRitualsBlock({ columns = 3, title, subtitle, selection = "all", bg = "cream" }: { columns?: number, title?: string, subtitle?: string, selection?: string, bg?: string }) {
  const { data: products } = useQuery({
    queryKey: ["bodyoga-products", selection],
    queryFn: () => listProducts({
      onlyInStock: false,
      featured: selection === "featured"
    })
  });

  const gridCols = columns === 1 ? "grid-cols-1" :
                   columns === 2 ? "grid-cols-1 md:grid-cols-2" :
                   columns === 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" :
                   "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  const bgClass = bg === "white" ? "bg-white" : bg === "soft" ? "bg-bodyoga-green/5" : "bg-bodyoga-cream";

  return (
    <section id="rituais" className={`${bgClass} scroll-mt-24`}>
      <span id="produtos" className="block -mt-24 pt-24" aria-hidden />
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-12 md:py-20">
        {(title || subtitle) && (
          <div className="text-center mb-12 max-w-2xl mx-auto">
            {title && (
              <h2 className="font-display text-3xl md:text-4xl text-bodyoga-green">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-bodyoga-green/70 mt-3">{subtitle}</p>
            )}
          </div>
        )}
        <div className={`grid ${gridCols} gap-4 md:gap-8`}>
          {(products ?? []).map((p) => (
            <BodyogaProductCard key={p.slug} product={p} noBorder />
          ))}
        </div>
      </div>
    </section>
  );
}

const INTRO_DEFAULTS: Record<string, string> = {
  home_intro_title: "BODYOGA é a\nfusão entre *yoga* e\ncuidado consciente.",
  home_intro_p1: "Cada produto é um ritual pensado pra trazer presença ao gesto cotidiano de cuidar de si.",
  home_intro_p2: "Feito à mão e em pequenos lotes, por Elisa Hoeppers Casas, para gerar equilíbrio e harmonizar o corpo, a mente e o ambiente.",
  home_intro_cta_label: "Harmonia & Equilíbrio",
  home_intro_cta_href: "/sobre",
  home_intro_image: "/images/home/bodyoga/bodyoga-left.png",
};

// Apresentação (Elisa): usa os campos do bloco; se vazios, cai nas MESMAS
// configurações que o site publicado (home_intro_*), pra ficar fiel.
function HomeIntroBlock({ props }: { props: any }) {
  const { data: s } = useQuery({
    queryKey: ["home-intro-settings"],
    queryFn: async () => {
      const keys = Object.keys(INTRO_DEFAULTS);
      const entries = await Promise.all(keys.map(async (k) => {
        try { const v = await getSetting(k); return [k, v && v.trim() ? v : INTRO_DEFAULTS[k]] as const; }
        catch { return [k, INTRO_DEFAULTS[k]] as const; }
      }));
      return Object.fromEntries(entries) as Record<string, string>;
    },
    staleTime: 5 * 60 * 1000,
  });
  const cfg = s ?? INTRO_DEFAULTS;
  const image = props.image || cfg.home_intro_image;
  const title = props.title || cfg.home_intro_title;
  const p1 = props.p1 || cfg.home_intro_p1;
  const p2 = props.p2 || cfg.home_intro_p2;
  const ctaLabel = props.ctaLabel || cfg.home_intro_cta_label;
  const ctaHref = props.ctaHref || cfg.home_intro_cta_href;

  return (
    <section className="bg-bodyoga-cream overflow-hidden">
      <div className="max-w-[1170px] mx-auto px-6 md:px-10 py-20 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-20 items-center">
          <div className="md:col-span-6 relative">
            <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-bodyoga-green/5">
              <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105" loading="lazy" decoding="async" />
            </div>
          </div>
          <div className="md:col-span-6 flex flex-col justify-center space-y-10 mt-12 md:mt-0">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-bodyoga-green leading-[1.15]">
              {renderIntroTitle(title)}
            </h2>
            <div className="space-y-6 max-w-md">
              {p1 && <p className="text-lg md:text-xl text-bodyoga-green/80 font-light leading-relaxed whitespace-pre-line">{p1}</p>}
              {p2 && <p className="text-sm md:text-base text-bodyoga-green font-medium leading-relaxed tracking-wide whitespace-pre-line">{p2}</p>}
            </div>
            {ctaLabel && (
              <div>
                <a href={ctaHref || "/sobre"} className="group inline-flex items-center gap-2 px-7 py-4 rounded-full border border-bodyoga-green/20 hover:bg-bodyoga-green hover:border-bodyoga-green transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                  <span className="text-[11px] uppercase tracking-[0.3em] text-bodyoga-green group-hover:text-bodyoga-cream font-semibold transition-colors">{ctaLabel}</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function CoursesBlock({ columns = 2 }: { columns?: number }) {
  const { data: courses } = useQuery({
    queryKey: ["courses", "published"],
    queryFn: listPublishedCourses,
  });

  const gridCols = columns === 1 ? "grid-cols-1" : 
                   columns === 3 ? "grid-cols-1 md:grid-cols-3" :
                   "grid-cols-1 md:grid-cols-2";

  return (
    <section className="bg-bodyoga-cream py-16 md:py-24">
      <div className="max-w-[1170px] mx-auto px-4 md:px-6">
        <div className={`grid ${gridCols} gap-8`}>
          {(courses ?? []).map((c) => (
            <Link
              key={c.id}
              to="/cursos/$slug"
              params={{ slug: c.slug }}
              className="flex flex-col group"
            >
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-bodyoga-green/5">
                {c.cover_image && (
                  <img
                    src={c.cover_image}
                    alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                )}
                {c.overlay_label && (
                  <span className="absolute top-4 left-4 bg-bodyoga-cream/90 text-bodyoga-green text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full">
                    {c.overlay_label}
                  </span>
                )}
              </div>
              <div className="mt-6 text-center">
                <h3 className="font-display text-xl text-bodyoga-green">{c.title}</h3>
                {c.subtitle && (
                  <p className="text-bodyoga-green/60 text-sm mt-2">{c.subtitle}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function IconSelector({ icon, className }: { icon: string, className?: string }) {
  switch (icon) {
    case 'leaf': return <Leaf className={className} />;
    case 'heart': return <Heart className={className} />;
    case 'sparkles': return <Sparkles className={className} />;
    case 'flower': return <Flower2 className={className} />;
    case 'sprout': return <Sprout className={className} />;
    case 'clock': return <Clock className={className} />;
    case 'layout': return <Layout className={className} />;
    case 'star': return <Star className={className} />;
    default: return <CheckCircle2 className={className} />;
  }
}

export function renderIntroTitle(text: string) {
  if (!text) return null;
  return text.split("\n").map((line, i) => (
    <span key={i}>
      {i > 0 && <br />}
      {line.split(/(\*[^*]+\*)/g).map((part, j) =>
        part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
          <span key={j} className="italic">
            {part.slice(1, -1)}
          </span>
        ) : (
          part
        )
      )}
    </span>
  ));
}


function DatePicker({ selectedDate, onChange }: { selectedDate: Date; onChange: (d: Date) => void }) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return d;
  });
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {days.map((d) => {
        const sel = d.toDateString() === selectedDate.toDateString();
        return (
          <button
            key={d.toISOString()}
            onClick={() => onChange(d)}
            className={`flex flex-col items-center justify-center min-w-[64px] py-3 rounded-lg border transition ${sel ? "bg-primary text-white border-primary" : "bg-white border-border"}`}
          >
            <span className="text-[10px] uppercase tracking-wider opacity-80">{d.toLocaleDateString("pt-BR", { weekday: "short" })}</span>
            <span className="text-2xl font-display leading-none">{d.getDate()}</span>
            <span className="text-[10px] uppercase opacity-80">{d.toLocaleDateString("pt-BR", { month: "short" })}</span>
          </button>
        );
      })}
    </div>
  );
}

function BookingFormBlock() {
  const { user, profile } = useAuth();
  const { data: services, isLoading: loadingServices } = useQuery({ queryKey: ["services"], queryFn: listServices });
  const { data: taken } = useQuery({ queryKey: ["taken-slots"], queryFn: listTakenSlots });
  const { data: rules } = useQuery({ queryKey: ["availability-rules"], queryFn: listAvailabilityRules });
  const { data: blocks } = useQuery({ queryKey: ["availability-blocks"], queryFn: listAvailabilityBlocks });

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  });
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [step, setStep] = useState<"service" | "slot" | "form" | "done">("service");
  const [form, setForm] = useState({
    name: profile?.full_name ?? user?.email?.split("@")[0] ?? "",
    email: user?.email ?? "",
    phone: "",
    notes: "",
  });
  const [confirmCode, setConfirmCode] = useState<string | null>(null);

  const slots = useMemo(() => {
    if (!selectedService) return [];
    return generateSlotsForDate(selectedDate, selectedService.duration_min, taken ?? [], rules, blocks);
  }, [selectedService, selectedDate, taken, rules, blocks]);

  const bookMutation = useMutation({
    mutationFn: () => bookAppointment({
      service_id: selectedService!.id,
      starts_at: selectedSlot!.toISOString(),
      customer_name: form.name,
      customer_email: form.email,
      customer_phone: form.phone || undefined,
      notes: form.notes || undefined,
    }),
    onSuccess: (result) => {
      setConfirmCode(result.code);
      setStep("done");
    },
  });

  return (
    <section className="bg-cream py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-5xl">
        {step === "service" && (
          <div className="grid md:grid-cols-2 gap-4">
            {(services ?? []).map((s) => (
              <button key={s.id} onClick={() => { setSelectedService(s); setStep("slot"); }} className="bg-white rounded-xl p-6 text-left border border-border hover:border-primary transition">
                <h2 className="font-display text-xl text-primary-dark mb-2">{s.title}</h2>
                <div className="flex justify-between text-sm">
                  <span>{s.duration_min} min</span>
                  <span className="font-semibold">{formatCurrencyBRL(s.price_cents)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
        {step === "slot" && (
          <div className="bg-white rounded-xl p-6 md:p-8">
            <DatePicker selectedDate={selectedDate} onChange={(d) => setSelectedDate(d)} />
            <div className="mt-8 grid grid-cols-4 gap-2">
              {slots.map((slot) => (
                <button key={slot.startsAt.toISOString()} onClick={() => slot.available && setSelectedSlot(slot.startsAt)} disabled={!slot.available}
                  className={`py-2 rounded-md text-sm ${selectedSlot?.getTime() === slot.startsAt.getTime() ? "bg-primary text-white" : "border"}`}>
                  {formatTime(slot.startsAt)}
                </button>
              ))}
            </div>
            {selectedSlot && <button onClick={() => setStep("form")} className="mt-8 bg-primary text-white px-8 py-3 rounded-full uppercase text-xs">Continuar</button>}
          </div>
        )}
        {step === "form" && (
          <form onSubmit={(e) => { e.preventDefault(); bookMutation.mutate(); }} className="bg-white p-8 max-w-xl mx-auto space-y-4">
            <input required placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border p-2" />
            <input type="email" required placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border p-2" />
            <button type="submit" className="w-full bg-primary text-white py-3 rounded-full uppercase text-xs">Reservar</button>
          </form>
        )}
        {step === "done" && (
          <div className="text-center p-8">
            <h2 className="font-display text-2xl mb-4">Reserva recebida!</h2>
            <p>Código: {confirmCode}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function SignupFormBlock() {
  const { signUp, signIn } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp({ email, password, fullName });
      await signIn({ email, password });
      window.location.href = "/painel";
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-20 bg-cream">
      <div className="max-w-md mx-auto px-4 bg-white p-8 rounded-3xl border">
        <h2 className="font-display text-2xl mb-6 text-center">Crie sua conta</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <input required placeholder="Nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border p-3" />
          <input type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border p-3" />
          <input type="password" required minLength={6} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border p-3" />
          <button type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded-full uppercase text-xs">Criar conta</button>
        </form>
      </div>
    </section>
  );
}


interface RenderBlocksProps {
  blocks: any[];
}

export const RenderBlocks: React.FC<RenderBlocksProps> = ({ blocks }) => {
  if (!blocks || !Array.isArray(blocks)) return null;

  return (
    <div className="flex flex-col w-full">
      {blocks.map((block) => {
        const p = block.props;
        switch (block.type) {
          case "hero":
            return (
              <BodyogaHeroSlider 
                key={block.id}
                initialSlides={[{
                  id: block.id,
                  title: p.title,
                  subtitle: p.subtitle,
                  button_label: p.buttonLabel,
                  button_link: p.buttonHref,
                  image_url: p.bgImage,
                  video_url: p.bgVideo,
                  overlay_opacity: p.overlay,
                  active: true
                } as any]}
              />
            );

          case "text":
            return (
              <section key={block.id} className="py-16 px-4 max-w-4xl mx-auto w-full">
                <div className={`text-${p.align || 'left'}`}>
                  {p.title && <h2 className="text-3xl md:text-4xl font-light mb-6 text-primary">{p.title}</h2>}
                  {p.content && <p className="text-lg text-primary/80 whitespace-pre-wrap">{p.content}</p>}
                </div>
              </section>
            );

          case "image-text":
            return (
              <section key={block.id} className="bg-bodyoga-cream overflow-hidden">
                <div className="max-w-[1170px] mx-auto px-6 md:px-10 py-16 md:py-24">
                  <div className={`grid md:grid-cols-2 gap-10 lg:gap-16 items-center ${p.side === 'left' ? 'md:[&>*:first-child]:order-2' : ''}`}>
                    {p.image && (
                      <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-bodyoga-green/5">
                        <img src={p.image} alt={p.title || ''} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <div className="space-y-6">
                      {p.title && <h2 className="font-display text-3xl md:text-4xl text-bodyoga-green leading-tight">{p.title}</h2>}
                      {p.content && <p className="text-lg text-bodyoga-green/80 font-light leading-relaxed whitespace-pre-line">{p.content}</p>}
                      {p.buttonLabel && (
                        <a href={p.buttonHref || '#'} className="inline-flex px-7 py-4 rounded-full border border-bodyoga-green/20 hover:bg-bodyoga-green hover:text-bodyoga-cream text-[11px] uppercase tracking-[0.3em] font-semibold transition">
                          {p.buttonLabel}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            );

          case "products":
            return <HomeRitualsBlock key={block.id} columns={p.columns} title={p.title} subtitle={p.subtitle} selection={p.selection} bg={p.bg} />;

          case "categories":
            return (
              <section key={block.id} className="bg-bodyoga-cream py-16 px-4">
                <div className="max-w-[1170px] mx-auto">
                  <div className={`grid ${p.columns === 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 md:grid-cols-3"} gap-4 md:gap-6`}>
                    {(p.items || []).map((item: any, i: number) => (
                      <a key={i} href={item.link || '#'} className="group block relative aspect-square overflow-hidden rounded-2xl bg-bodyoga-green/5">
                        {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />}
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white font-display text-xl">{item.name}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </section>
            );

          case "gallery":
            return (
              <section key={block.id} className="bg-bodyoga-cream py-12 px-4">
                <div className="max-w-[1170px] mx-auto">
                  <div className={`grid ${p.columns === 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 md:grid-cols-3"} gap-4`}>
                    {(p.images || []).map((img: any, i: number) => (
                      <div key={i} className="aspect-square rounded-2xl overflow-hidden">
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );

          case "faq":
            return (
              <section key={block.id} className="bg-bodyoga-cream py-16 md:py-24 px-4">
                <div className="max-w-3xl mx-auto">
                  {p.title && <h2 className="font-display text-3xl text-bodyoga-green text-center mb-12">{p.title}</h2>}
                  <Accordion type="single" collapsible className="w-full">
                    {(p.items || []).map((item: any, i: number) => (
                      <AccordionItem key={i} value={`item-${i}`} className="border-bodyoga-green/10">
                        <AccordionTrigger className="font-display text-lg text-bodyoga-green">{item.q}</AccordionTrigger>
                        <AccordionContent className="text-bodyoga-green/70 leading-relaxed">{item.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </section>
            );

          case "testimonials":
            return (
              <section key={block.id} className="bg-bodyoga-cream py-16 md:py-24 px-4">
                <div className="max-w-[1170px] mx-auto grid md:grid-cols-3 gap-8">
                  {(p.items || []).map((t: any, i: number) => (
                    <div key={i} className="bg-white p-8 rounded-2xl shadow-sm space-y-4">
                      <p className="italic text-bodyoga-green/80">"{t.text}"</p>
                      <div>
                        <p className="font-semibold text-bodyoga-green">{t.author}</p>
                        <p className="text-xs text-bodyoga-green/50 uppercase tracking-widest">{t.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );

          case "stats":
            return (
              <section key={block.id} className="bg-bodyoga-green py-16 px-4 text-bodyoga-cream">
                <div className="max-w-[1170px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                  {(p.items || []).map((s: any, i: number) => (
                    <div key={i} className="space-y-2">
                      <p className="font-display text-4xl md:text-5xl">{s.value}</p>
                      <p className="text-xs uppercase tracking-widest opacity-70">{s.label}</p>
                    </div>
                  ))}
                </div>
              </section>
            );

          case "benefits":
            return (
              <section key={block.id} className="bg-bodyoga-cream py-16 md:py-24">
                <div className="max-w-[1170px] mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
                  {(p.items || []).map((b: any, i: number) => (
                    <div key={i} className="flex flex-col items-center text-center space-y-4">
                      <IconSelector icon={b.icon} className="w-8 h-8 text-bodyoga-green" />
                      <h3 className="font-display text-xl text-bodyoga-green">{b.title}</h3>
                      <p className="text-bodyoga-green/70 text-sm">{b.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            );

          case "timeline":
            return (
              <section key={block.id} className="bg-bodyoga-cream py-16 md:py-24 px-4">
                <div className="max-w-3xl mx-auto space-y-12">
                  {(p.items || []).map((t: any, i: number) => (
                    <div key={i} className="flex gap-8 items-start">
                      <span className="font-display text-2xl text-bodyoga-green/30">{t.year}</span>
                      <div className="space-y-2">
                        <h3 className="font-display text-xl text-bodyoga-green">{t.title}</h3>
                        <p className="text-bodyoga-green/70">{t.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );

          case "author":
            return (
              <section key={block.id} className="bg-bodyoga-cream py-16 md:py-24">
                <div className="max-w-[900px] mx-auto px-6 grid md:grid-cols-12 gap-12 items-center">
                  <div className="md:col-span-5 aspect-[4/5] rounded-2xl overflow-hidden bg-bodyoga-green/5">
                    {p.photo && <img src={p.photo} alt={p.title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="md:col-span-7 space-y-6">
                    <h2 className="font-display text-3xl text-bodyoga-green">{p.title}</h2>
                    <p className="text-bodyoga-green/80 font-light leading-relaxed whitespace-pre-line">{p.bio}</p>
                  </div>
                </div>
              </section>
            );

          case "courses":
            return <CoursesBlock key={block.id} columns={p.columns} />;

          case "newsletter":
            return (
              <section key={block.id} className="bg-bodyoga-green py-20 px-4 text-bodyoga-cream text-center">
                <div className="max-w-xl mx-auto space-y-8">
                  <h2 className="font-display text-3xl md:text-4xl">{p.title}</h2>
                  <p className="opacity-80">{p.text}</p>
                  <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => { e.preventDefault(); toast.success("Inscrito!"); }}>
                    <input type="email" placeholder="Email" className="flex-1 bg-white/10 border border-white/20 rounded-full px-6 py-3" required />
                    <button className="bg-bodyoga-cream text-bodyoga-green px-8 py-3 rounded-full text-xs uppercase font-bold">Enviar</button>
                  </form>
                </div>
              </section>
            );

          case "columns":
            return (
              <section key={block.id} className="bg-bodyoga-cream py-16 px-4">
                <div className={`max-w-[1170px] mx-auto grid ${p.count === 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"} gap-12`}>
                  {(p.items || []).map((item: any, i: number) => (
                    <div key={i} className="text-bodyoga-green/80 font-light leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{ __html: item.content }} />
                  ))}
                </div>
              </section>
            );

          case "spacer":
            return <div key={block.id} style={{ height: `${p.height}px` }} />;

          case "booking-form":
            return <BookingFormBlock key={block.id} />;

          case "custom-project-form":
            return (
              <section key={block.id} className="py-20 md:py-32">
                <div className="container mx-auto px-6 max-w-2xl">
                  <CustomProjectForm className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-[#3B4F30]/5" />
                </div>
              </section>
            );

          case "signup-form":
            return <SignupFormBlock key={block.id} />;

          case "home-hero":
            return <HomeHeroBlock key={block.id} />;

          case "home-opening":
            return (
              <section key={block.id} className="bg-bodyoga-cream">
                <div className="max-w-[900px] mx-auto px-6 py-6 md:py-10 flex flex-col items-center text-center">
                  {p.icon && (
                    <img
                      src={p.icon}
                      alt="BODYOGA"
                      className="w-28 md:w-40 h-auto mb-3"
                      loading="lazy"
                    />
                  )}
                  <p className="font-display text-2xl md:text-4xl text-bodyoga-green leading-snug whitespace-pre-line">
                    {p.title}
                  </p>
                  {p.subtitle && (
                    <p className="mt-3 text-bodyoga-green/70 max-w-xl">{p.subtitle}</p>
                  )}
                </div>
              </section>
            );

          case "home-rituals":
            return <HomeRitualsBlock key={block.id} columns={p.columns} title={p.title} subtitle={p.subtitle} selection={p.selection} bg={p.bg} />;

          case "home-intro":
            return <HomeIntroBlock key={block.id} props={p} />;

          case "home-blog":
            return <HomeBlog key={block.id} />;

          case "instagram":
            return <HomeInstagram key={block.id} />;


          default:
            return <div key={block.id} className="p-8 border border-dashed text-center text-gray-400">Bloco {block.type} não encontrado</div>;
        }
      })}
    </div>
  );
};
