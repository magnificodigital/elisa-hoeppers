import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (profile && profile.role !== "admin") {
      navigate({ to: "/painel" });
    }
  }, [loading, user, profile, navigate]);

  if (loading || !user || !profile) {
    return (
      <Layout>
        <section className="py-24 text-center">
          <p className="text-[var(--text-muted)]">Carregando…</p>
        </section>
      </Layout>
    );
  }

  if (profile.role !== "admin" && profile.role !== "instructor") {
    return (
      <Layout>
        <section className="py-24 text-center">
          <p className="text-[var(--text-muted)]">Acesso negado.</p>
        </section>
      </Layout>
    );
  }

  return <>{children}</>;
}
