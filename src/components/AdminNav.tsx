import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  GraduationCap,
  Calendar,
  ShoppingBag,
  Package,
  Users,
  Newspaper,
  Settings,
  Sparkles,
  ArrowLeft,
  LogOut,
  HelpCircle,
  FileText,
  Mail,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type NavLeaf = {
  to: string;
  label: string;
  icon: any;
  exact?: boolean;
};

const NAV_ITEMS: NavLeaf[] = [
  { to: "/admin", label: "Painel", icon: LayoutDashboard, exact: true },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/pedidos", label: "Pedidos", icon: Package },
  { to: "/admin/solicitacoes", label: "Solicitações", icon: MessageSquare },
  { to: "/admin/notas-fiscais", label: "Notas Fiscais", icon: FileText },
  { to: "/admin/produtos", label: "Produtos", icon: ShoppingBag },
  { to: "/admin/site", label: "WebSite", icon: Sparkles },
  { to: "/admin/posts", label: "Posts", icon: Newspaper },
  { to: "/admin/broadcast", label: "Emails", icon: Mail },
  { to: "/admin/cursos", label: "Cursos", icon: GraduationCap },
  { to: "/admin/agendamentos", label: "Agendamentos", icon: Calendar },
  { to: "/admin/ajuda", label: "Tutoriais", icon: HelpCircle },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];


export function AdminNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };



  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <nav className="rounded-3xl bg-bodyoga-cream shadow-none p-4 md:p-5 border border-border/20">
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to, item.exact);
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] transition-colors ${
                  active
                    ? "bg-[#3B4F30] text-white font-medium"
                    : "text-[#3B4F30] hover:bg-[#3B4F30]/5"
                }`}
              >
                <Icon size={20} strokeWidth={1.8} className={active ? "text-white" : "text-[#3B4F30]"} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="my-3 border-t border-[#DBCCBF]/50" />

      <Link
        to="/"
        className="flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] text-[#3B4F30] hover:bg-[#3B4F30]/5 transition-colors"
      >
        <ArrowLeft size={20} strokeWidth={1.8} className="text-[#3B4F30]" />
        Ver site
      </Link>

      <button
        onClick={handleSignOut}
        className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] text-[#3B4F30] hover:bg-[#3B4F30]/5 transition-colors"
      >
        <LogOut size={20} strokeWidth={1.8} className="text-[#3B4F30]" />
        Sair
      </button>
    </nav>
  );
}

export default AdminNav;
