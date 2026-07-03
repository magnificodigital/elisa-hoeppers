import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { BodyogaLogo } from "@/components/bodyoga/BodyogaLogo";


const searchSchema = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Entrar — BODYOGA" }] }),
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
    <main className="bodyoga-scope min-h-screen flex items-center justify-center p-4 md:p-8 bg-bodyoga-green relative">
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl border border-bodyoga-cream/25 shadow-2xl p-8 md:p-10">
          <div className="flex flex-col items-center mb-8">
            <BodyogaLogo variant="full" tone="cream" size={44} />
            <p className="mt-4 text-sm text-bodyoga-cream/80 tracking-wide text-center">
              Bem-vinda de volta ao seu ritual.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-[0.18em] text-bodyoga-cream/80 mb-2">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-full px-5 py-3.5 bg-bodyoga-cream/10 text-bodyoga-cream placeholder-bodyoga-cream/40 border border-bodyoga-cream/30 focus:outline-none focus:ring-2 focus:ring-bodyoga-cream/50 transition"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.18em] text-bodyoga-cream/80 mb-2">
                Senha
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-full px-5 py-3.5 bg-bodyoga-cream/10 text-bodyoga-cream placeholder-bodyoga-cream/40 border border-bodyoga-cream/30 focus:outline-none focus:ring-2 focus:ring-bodyoga-cream/50 transition"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-bodyoga-cream text-bodyoga-green px-10 py-3.5 rounded-full uppercase tracking-[0.2em] text-[11px] font-semibold hover:opacity-90 transition disabled:opacity-60"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <p className="text-center text-sm text-bodyoga-cream/80 mt-7">
            Ainda não tem conta?{" "}
            <Link to="/cadastro-de-alunos" className="underline hover:text-bodyoga-cream">
              Cadastre-se
            </Link>
          </p>
        </div>


        <p className="text-center mt-6">
          <Link to="/" className="text-xs uppercase tracking-[0.18em] text-bodyoga-cream hover:opacity-80 transition drop-shadow">
            ← Voltar ao início
          </Link>
        </p>
      </div>
    </main>
  );
}
