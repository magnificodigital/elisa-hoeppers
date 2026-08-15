import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin")({
  component: AdminRoute,
});

function AdminRoute() {
  // Guard CLIENT-SIDE: no SSR a sessão (localStorage) não existe, então checar aqui
  // (depois da hidratação) evita deslogar ao atualizar a página.
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isStaff = profile?.role === "admin" || profile?.role === "instructor";

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login", search: { next: pathname } });
    } else if (profile && !isStaff) {
      navigate({ to: "/" });
    }
  }, [loading, user, profile, isStaff, pathname, navigate]);

  // Enquanto carrega a sessão / sem acesso: mostra spinner (não desloga no refresh)
  if (loading || !user || !isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F3EE]">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B4F30]" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
