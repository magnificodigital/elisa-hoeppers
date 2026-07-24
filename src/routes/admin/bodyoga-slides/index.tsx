import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, GripVertical } from "lucide-react";
import Layout from "@/components/Layout";
import { StaffGuard } from "@/components/StaffGuard";
import { listAllSlidesForAdmin, createSlide } from "@/lib/shop";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/bodyoga-slides/")({
  head: () => ({ meta: [{ title: "Admin — Slides" }] }),
  component: () => (
    <StaffGuard>
      <SlidesList />
    </StaffGuard>
  ),
});

function SlidesList() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: slides, isLoading } = useQuery({
    queryKey: ["admin-slides"],
    queryFn: listAllSlidesForAdmin,
  });

  const create = useMutation({
    mutationFn: async () => {
      const order = (slides?.length ?? 0) + 1;
      return createSlide({
        title: "Novo slide",
        subtitle: null,
        cta_label: null,
        cta_href: null,
        image_url: null,
        video_url: null,
        media_href: null,
        show_nav: true,


        display_order: order,
        is_active: false,
        duration_seconds: 7,
        coupon_capture_enabled: false,
      });
    },
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ["admin-slides"] });
      navigate({ to: "/admin/bodyoga-slides/$id", params: { id: s.id } });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Layout>
      <section className="py-12 md:py-20 bg-[var(--surface-cream)] min-h-screen">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display text-3xl md:text-4xl text-primary-dark">Slides</h1>
            <button
              onClick={() => create.mutate()}
              disabled={create.isPending}
              className="bg-primary text-white px-5 py-2.5 rounded-full uppercase tracking-[0.2em] text-xs font-semibold hover:bg-primary-dark transition disabled:opacity-60 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Novo slide
            </button>
          </div>

          <p className="text-sm text-[var(--text-muted)] mb-6">
            Crie e edite os slides do banner da página BODYOGA. A ordem define a sequência do slider.
            Slides inativos não aparecem no site.
          </p>

          {isLoading ? (
            <p className="text-[var(--text-muted)]">Carregando…</p>
          ) : (slides ?? []).length === 0 ? (
            <p className="text-[var(--text-muted)]">Nenhum slide ainda. Crie o primeiro.</p>
          ) : (
            <ul className="space-y-3">
              {(slides ?? []).map((s) => (
                <li key={s.id}>
                  <Link
                    to="/admin/bodyoga-slides/$id"
                    params={{ id: s.id }}
                    className="flex items-center gap-4 bg-white rounded-lg p-4 hover:shadow-sm transition"
                  >
                    <GripVertical className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                    <span className="text-xs text-[var(--text-muted)] w-6 shrink-0 text-center">{s.display_order}</span>
                    <div className="w-20 h-12 rounded-md overflow-hidden bg-primary/5 shrink-0">
                      {s.image_url && (
                        <img src={s.image_url} alt={s.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-primary-dark truncate">{s.title}</p>
                      {s.subtitle && (
                        <p className="text-xs text-[var(--text-muted)] truncate">{s.subtitle}</p>
                      )}
                    </div>
                    {!s.is_active && (
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
