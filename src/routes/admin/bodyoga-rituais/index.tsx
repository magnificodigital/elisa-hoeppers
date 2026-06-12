import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, GripVertical } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { listAllRitualsForAdmin, createRitual } from "@/lib/shop";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/bodyoga-rituais/")({
  head: () => ({ meta: [{ title: "Admin — Rituais BODYOGA" }] }),
  component: () => (
    <AdminGuard>
      <RitualsList />
    </AdminGuard>
  ),
});

function RitualsList() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: rituals, isLoading } = useQuery({
    queryKey: ["admin-rituals"],
    queryFn: listAllRitualsForAdmin,
  });

  const create = useMutation({
    mutationFn: async () => {
      const order = (rituals?.length ?? 0) + 1;
      return createRitual({
        slug: `ritual-${Date.now().toString(36)}`,
        title: "Novo ritual",
        description: null,
        image_url: null,
        display_order: order,
        is_active: false,
      });
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["admin-rituals"] });
      navigate({ to: "/admin/bodyoga-rituais/$id", params: { id: r.id } });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Layout>
      <section className="py-12 md:py-20 bg-[var(--surface-cream)] min-h-screen">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display text-3xl md:text-4xl text-primary-dark">Rituais BODYOGA</h1>
            <button
              onClick={() => create.mutate()}
              disabled={create.isPending}
              className="bg-primary text-white px-5 py-2.5 rounded-full uppercase tracking-[0.2em] text-xs font-semibold hover:bg-primary-dark transition disabled:opacity-60 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Novo ritual
            </button>
          </div>

          <p className="text-sm text-[var(--text-muted)] mb-6">
            Crie e edite os rituais que aparecem na página BODYOGA. Depois, em cada produto, escolha o ritual para que ele apareça no lugar correto.
          </p>

          {isLoading ? (
            <p className="text-[var(--text-muted)]">Carregando…</p>
          ) : (rituals ?? []).length === 0 ? (
            <p className="text-[var(--text-muted)]">Nenhum ritual ainda. Crie o primeiro.</p>
          ) : (
            <ul className="space-y-3">
              {(rituals ?? []).map((r) => (
                <li key={r.id}>
                  <Link
                    to="/admin/bodyoga-rituais/$id"
                    params={{ id: r.id }}
                    className="flex items-center gap-4 bg-white rounded-lg p-4 hover:shadow-sm transition"
                  >
                    <GripVertical className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                    <div className="w-14 h-14 rounded-md overflow-hidden bg-primary/5 shrink-0">
                      {r.image_url && (
                        <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-primary-dark truncate">{r.title}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">/{r.slug}</p>
                    </div>
                    {!r.is_active && (
                      <span className="text-[10px] uppercase tracking-widest text-red-700 shrink-0">Inativo</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </Layout>
  );
}
