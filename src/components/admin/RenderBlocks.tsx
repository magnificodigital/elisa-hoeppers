import React, { useEffect, useState, useMemo } from "react";
import BodyogaHeroSlider from "../bodyoga/BodyogaHeroSlider";
import { BodyogaProductCard } from "../bodyoga/BodyogaLanding";
import HomeInstagram from "../home/HomeInstagram";
import HomeBlog from "../home/HomeBlog";
import { listActiveSlides, listProducts, formatPriceBRL } from "@/lib/shop";
import { listPublishedCourses } from "@/lib/courses";
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
  const { data: slides } = useQuery({ 
    queryKey: ["bodyoga-slides-active"], 
    queryFn: listActiveSlides 
  });
  return <BodyogaHeroSlider initialSlides={slides ?? []} />;
}

function HomeRitualsBlock({ columns = 3, title, selection = "all" }: { columns?: number, title?: string, selection?: string }) {
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

  return (
    <section id="rituais" className="bg-bodyoga-cream scroll-mt-24">
      <span id="produtos" className="block -mt-24 pt-24" aria-hidden />
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-12 md:py-20">
        {title && (
          <h2 className="font-display text-3xl md:text-4xl text-bodyoga-green text-center mb-12">
            {title}
          </h2>
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

function renderIntroTitle(text: string) {
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

