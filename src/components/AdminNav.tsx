import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  GraduationCap,
  Calendar,
  CalendarClock,
  ShoppingBag,
  Package,
  Users,
  Mail,
  Send,
  FileText,
  Settings,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/admin", label: "Painel", icon: LayoutDashboard, exact: true },
  { to: "/admin/cursos", label: "Cursos", icon: GraduationCap },
  { to: "/admin/agendamentos", label: "Agendamentos", icon: Calendar },
  { to: "/admin/disponibilidade", label: "Disponibilidade", icon: CalendarClock },
  { to: "/admin/produtos", label: "Produtos", icon: ShoppingBag },
  { to: "/admin/pedidos", label: "Pedidos", icon: Package },
  
  { to: "/admin/inscritos", label: "Inscritos", icon: Mail },
  { to: "/admin/broadcast", label: "Broadcast", icon: Send },
  { to: "/admin/blog", label: "Blog", icon: FileText },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function AdminNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  const scrollBy = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
  };

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="sticky top-20 md:top-24 z-30 bg-[#3B4F30] border-b border-[#DBCCBF]/20 shadow-sm">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 relative">
        {/* Left fade + arrow */}
        {canScrollLeft && (
          <>
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[#3B4F30] to-transparent z-10" />
            <button
              type="button"
              aria-label="Rolar para a esquerda"
              onClick={() => scrollBy(-1)}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center h-7 w-7 rounded-full bg-[#DBCCBF] text-[#3B4F30] shadow-md"
            >
              <ChevronLeft size={16} />
            </button>
          </>
        )}

        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar scroll-smooth"
        >
          <Link
            to="/"
            className="flex items-center gap-1.5 shrink-0 text-[#DBCCBF]/80 hover:text-[#DBCCBF] text-xs px-2.5 py-1.5 rounded-full transition-colors"
          >
            <ArrowLeft size={14} />
            Site
          </Link>
          <span className="h-5 w-px bg-[#DBCCBF]/20 shrink-0" />
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to, "exact" in item ? item.exact : false);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-1.5 shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                  active
                    ? "bg-[#DBCCBF] text-[#3B4F30] font-semibold"
                    : "text-[#DBCCBF]/80 hover:bg-[#DBCCBF]/15 hover:text-[#DBCCBF]"
                }`}
              >
                <Icon size={14} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right fade + arrow */}
        {canScrollRight && (
          <>
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#3B4F30] to-transparent z-10" />
            <button
              type="button"
              aria-label="Rolar para a direita"
              onClick={() => scrollBy(1)}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center h-7 w-7 rounded-full bg-[#DBCCBF] text-[#3B4F30] shadow-md"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminNav;
