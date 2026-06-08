import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/cadastro-de-alunos")({
  validateSearch: (s: Record<string, unknown>) => ({
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  head: () => ({ meta: [{ title: "Cadastro de alunos — Elisa Hoeppers" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();
  const search = Route.useSearch();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(search.email ?? "");

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signUp({ email, password, fullName });
      await signIn({ email, password });
      navigate({ to: "/painel" });
    } catch (err: any) {
      setError(err.message ?? "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <section className="py-20 bg-cream min-h-[70vh]">
        <div className="max-w-md mx-auto px-4">
          <h1 className="font-display text-3xl text-primary-dark mb-2 text-center">Crie sua conta</h1>
          <p className="text-center text-sm text-primary-dark/70 mb-8">
            Acesse aulas e matricule-se nos cursos da Elisa.
          </p>
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-primary-dark mb-2">Nome completo</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-border rounded-md px-4 py-3 bg-white text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-border rounded-md px-4 py-3 bg-white text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-primary-dark/60 mt-1">Mínimo 6 caracteres.</p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white px-10 py-3.5 rounded-full uppercase tracking-[0.2em] text-[11px] font-semibold hover:bg-primary-dark transition disabled:opacity-60"
            >
              {loading ? "Criando conta…" : "Criar conta"}
            </button>
          </form>
          <p className="text-center text-sm text-primary-dark mt-6">
            Já tem conta?{" "}
            <Link to="/login" className="underline">
              Entrar
            </Link>
          </p>
        </div>
      </section>
    </Layout>
  );
}
