import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";

const searchSchema = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Entrar — Elisa Hoeppers" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { next } = useSearch({ from: "/login" });
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn({ email, password });
      navigate({ to: next ?? "/painel" });
    } catch (err: any) {
      setError(err.message ?? "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <section className="py-20 bg-cream min-h-[70vh]">
        <div className="max-w-md mx-auto px-4">
          <h1 className="font-display text-3xl text-primary-dark mb-8 text-center">Entrar</h1>
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-primary-dark mb-2">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border rounded-md px-4 py-3 bg-white text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-primary-dark mb-2">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-border rounded-md px-4 py-3 bg-white text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white px-10 py-3.5 rounded-full uppercase tracking-[0.2em] text-[11px] font-semibold hover:bg-primary-dark transition disabled:opacity-60"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
          <p className="text-center text-sm text-primary-dark mt-6">
            Ainda não tem conta?{" "}
            <Link to="/cadastro-de-alunos" className="underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </section>
    </Layout>
  );
}
