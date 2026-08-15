import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw redirect({
        to: "/login",
        search: {
          next: location.href,
        },
      });
    }

    // Checa a role na fonte canônica (profiles.role), igual ao login e ao is_admin().
    // A tabela user_roles é um sistema paralelo vazio — não usar.
    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    const isStaff = prof?.role === "admin" || prof?.role === "instructor";

    if (!isStaff) {
      throw redirect({
        to: "/",
      });
    }
  },
  component: () => (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  ),
});
