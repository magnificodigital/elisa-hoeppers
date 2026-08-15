import { 
  LayoutDashboard, 
  Users, 
  Package, 
  MessageSquare, 
  FileText, 
  ShoppingBag, 
  Sparkles, 
  Newspaper, 
  Mail, 
  GraduationCap, 
  Calendar, 
  HelpCircle, 
  Settings,
  Clock,
  LayoutGrid
} from "lucide-react";

export const ADMIN_NAV_ITEMS = [
  { group: "OPERAÇÃO", items: [
    { to: "/admin", label: "Painel", icon: LayoutDashboard, exact: true },
    { to: "/admin/pedidos", label: "Pedidos", icon: Package },
    { to: "/admin/clientes", label: "Clientes", icon: Users },
    { to: "/admin/solicitacoes", label: "Solicitações", icon: MessageSquare },
    { to: "/admin/notas-fiscais", label: "Notas Fiscais", icon: FileText },
  ]},
  { group: "CATÁLOGO", items: [
    { to: "/admin/produtos", label: "Produtos", icon: ShoppingBag },
    { to: "/admin/cursos", label: "Cursos", icon: GraduationCap },
  ]},
  { group: "CONTEÚDO", items: [
    { to: "/admin/site", label: "Site", icon: Sparkles },
    { to: "/admin/blog", label: "Blog", icon: Newspaper },
    { to: "/admin/social", label: "Social", icon: LayoutGrid },
    { to: "/admin/broadcast", label: "Emails", icon: Mail },
  ]},
  { group: "AGENDA", items: [
    { to: "/admin/agendamentos", label: "Agendamentos", icon: Calendar },
    { to: "/admin/disponibilidade", label: "Horários", icon: Clock },
  ]},
  { group: "SISTEMA", items: [
    { to: "/admin/ajuda", label: "Tutoriais", icon: HelpCircle },
    { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
  ]},
];
