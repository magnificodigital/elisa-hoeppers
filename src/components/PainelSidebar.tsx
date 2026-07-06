import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  LayoutDashboard, User, GraduationCap, Bookmark, ClipboardList,
  ShoppingBag, MessageCircleQuestion, Award, LogOut,
} from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { listMyCourseProgress } from "@/lib/enrollments";

export type PainelSection =
  | "painel" | "perfil" | "pedidos" | "wishlist"
  | "cursos" | "quizzes" | "certificados" | "qa";

type NavEntry = {
  id: PainelSection;
  icon: typeof LayoutDashboard;
  label: string;
  to: string;
  courseOnly?: boolean;
};

const navItems: NavEntry[] = [
  { id: "painel", icon: LayoutDashboard, label: "Painel", to: "/painel" },
  { id: "perfil", icon: User, label: "Meu perfil", to: "/painel/perfil" },
  { id: "pedidos", icon: ShoppingBag, label: "Histórico de Pedidos", to: "/painel/pedidos" },
  { id: "wishlist", icon: Bookmark, label: "Lista de desejos", to: "/painel/wishlist" },
  { id: "quizzes", icon: ClipboardList, label: "Tentativas de questionários", to: "/painel/tentativas", courseOnly: true },
  { id: "certificados", icon: Award, label: "Meus certificados", to: "/painel/certificados", courseOnly: true },
  { id: "qa", icon: MessageCircleQuestion, label: "Perguntas & Respostas", to: "/painel/perguntas", courseOnly: true },
];

export function PainelSidebar({ active }: { active: PainelSection }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: progress } = useQuery({
    queryKey: ["my-course-progress", user?.id],
    queryFn: listMyCourseProgress,
    enabled: !!user,
  });
  const hasCourses = (progress ?? []).length > 0;

  return (
    <aside className="hidden md:block w-64 shrink-0">
      <div className="bg-white rounded-xl p-4 shadow-sm sticky top-24">
        <nav className="space-y-1">
          {navItems
            .filter((item) => !item.courseOnly || hasCourses)
            .map((item) => {
              const Icon = item.icon;
              const isActive = item.id === active;
              const baseCls = "flex items-center gap-3 px-4 py-3 rounded-md text-sm transition-colors";
              const stateCls = isActive
                ? "bg-primary text-cream font-medium"
                : "text-primary-dark hover:bg-cream/60";
              return isActive ? (
                <div key={item.id} className={`${baseCls} ${stateCls}`}>
                  <Icon size={18} />
                  <span className="flex-1">{item.label}</span>
                </div>
              ) : (
                <Link key={item.id} to={item.to} className={`${baseCls} ${stateCls}`}>
                  <Icon size={18} />
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          <div className="pt-2 mt-2 border-t border-cream">
            <button
              onClick={() => signOut().then(() => navigate({ to: "/" }))}
              className="flex items-center gap-3 px-4 py-3 rounded-md text-sm w-full text-left text-primary-dark hover:bg-cream/60 transition-colors"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </nav>
      </div>
    </aside>
  );
}

/** Full page shell: header/footer via Layout + sidebar + content column. */
export function PainelLayout({
  active,
  children,
}: {
  active: PainelSection;
  children: ReactNode;
}) {
  return (
    <Layout>
      <section className="py-10 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8">
            <PainelSidebar active={active} />
            <div className="flex-1 min-w-0">{children}</div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
