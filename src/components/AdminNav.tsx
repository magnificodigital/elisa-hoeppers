import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  GraduationCap,
  Calendar,
  CalendarClock,
  ShoppingBag,
  Package,
  Star,
  Mail,
  Send,
  FileText,
  Settings,
  ArrowLeft,
} from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { to: "/admin", label: "Painel", icon: LayoutDashboard, exact: true },
  { to: "/admin/cursos", label: "Cursos", icon: GraduationCap },
  { to: "/admin/agendamentos", label: "Agendamentos", icon: Calendar },
  { to: "/admin/disponibilidade", label: "Disponibilidade", icon: CalendarClock },
  { to: "/admin/produtos", label: "Produtos", icon: ShoppingBag },
  { to: "/admin/pedidos", label: "Pedidos", icon: Package },
  { to: "/admin/avaliacoes", label: "Avaliações", icon: Star },
  { to: "/admin/inscritos", label: "Inscritos", icon: Mail },
  { to: "/admin/broadcast", label: "Broadcast", icon: Send },
  { to: "/admin/blog", label: "Blog", icon: FileText },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AdminNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="sticky top-20 md:top-24 z-30 bg-[#3B4F30] border-b border-[#DBCCBF]/20 shadow-sm">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar">
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
            const active = isActive(item.to, item.exact);
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
      </div>
    </div>
  );
}

export default AdminNav;
