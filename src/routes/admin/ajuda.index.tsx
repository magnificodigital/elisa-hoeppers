import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Clock, ChevronRight } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { tutorials, categories } from "@/data/tutorials";

export const Route = createFileRoute("/admin/ajuda/")({
  head: () => ({ meta: [{ title: "Admin — Ajuda" }] }),
  component: () => (
    <AdminGuard>
      <Page />
    </AdminGuard>
  ),
});

function Page() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = tutorials.filter((t) => {
    if (activeCategory && t.category !== activeCategory) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.steps.some((s) => s.title.toLowerCase().includes(q))
    );
  });

  return (
    <Layout>
      <section className="py-12 md:py-16 bg-background min-h-[70vh]">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="font-display text-3xl md:text-4xl text-primary-dark mb-2">
            Central de Ajuda
          </h1>
          <p className="text-primary-dark/70 mb-8">
            Passo a passo pras tarefas mais comuns do dia a dia. Quando quiser lembrar como fazer algo, vem aqui primeiro.
          </p>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-dark/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="O que você quer fazer? (ex: cadastrar produto, enviar email...)"
              className="w-full border border-border rounded-full pl-12 pr-5 py-3 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest transition ${
                activeCategory === null
                  ? "bg-primary text-cream"
                  : "bg-white text-primary-dark border border-border hover:border-primary/40"
              }`}
            >
              Todas
            </button>
            {Object.entries(categories).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key === activeCategory ? null : key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs uppercase tracking-widest transition ${
                  activeCategory === key
                    ? "bg-primary text-cream"
                    : "bg-white text-primary-dark border border-border hover:border-primary/40"
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-border">
              <p className="text-primary-dark/60">Nenhum tutorial encontrado.</p>
            </div>
          )}

          <div className="space-y-3">
            {filtered.map((t) => (
              <Link
                key={t.id}
                to="/admin/ajuda/$slug"
                params={{ slug: t.id }}
                className="group flex items-start gap-4 bg-white p-5 rounded-xl border border-border hover:border-primary/40 hover:shadow-sm transition"
              >
                <span className="text-2xl shrink-0">{categories[t.category].icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-primary-dark group-hover:text-primary transition">
                    {t.title}
                  </h3>
                  <p className="text-sm text-primary-dark/60 mt-1">{t.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-primary-dark/40">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {t.estimatedMinutes} min
                    </span>
                    <span className="uppercase tracking-widest">
                      {categories[t.category].label}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-primary-dark/30 group-hover:text-primary shrink-0 mt-2" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
