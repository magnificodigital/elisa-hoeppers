import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { EyeOff, Eye, Trash2, MessageSquare } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { StarRating } from "@/components/StarRating";
import {
  listAllReviewsForAdmin,
  setReviewPublished,
  deleteReviewAsAdmin,
  type AdminReview,
} from "@/lib/admin";

export const Route = createFileRoute("/admin/avaliacoes")({
  head: () => ({ meta: [{ title: "Admin — Avaliações" }] }),
  component: () => (
    <AdminGuard>
      <AdminReviews />
    </AdminGuard>
  ),
});

const FILTERS = [
  { id: "all", label: "Todas" },
  { id: "course", label: "Cursos" },
  { id: "product", label: "Produtos" },
  { id: "hidden", label: "Despublicadas" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

function AdminReviews() {
  const [filter, setFilter] = useState<FilterId>("all");

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-reviews", filter],
    queryFn: () =>
      listAllReviewsForAdmin(
        filter === "course"
          ? { kind: "course" }
          : filter === "product"
            ? { kind: "product" }
            : filter === "hidden"
              ? { onlyHidden: true }
              : {},
      ),
  });

  return (
    <Layout>
      <section className="py-12 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="text-primary" size={26} />
            <h1 className="font-display text-3xl md:text-4xl text-primary-dark">Avaliações</h1>
          </div>
          <p className="text-primary-dark/70 mb-8">
            Modere as avaliações de cursos e produtos. Despublicar oculta da vitrine; excluir é
            definitivo.
          </p>

          <div className="flex flex-wrap gap-2 mb-8">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest transition ${
                  filter === f.id
                    ? "bg-primary text-white"
                    : "bg-white text-primary-dark border border-border hover:border-primary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isLoading && <p className="text-primary-dark/60">Carregando…</p>}

          {!isLoading && (reviews?.length ?? 0) === 0 && (
            <div className="bg-white rounded-xl p-10 text-center">
              <MessageSquare className="mx-auto text-primary-dark/30 mb-3" size={32} />
              <p className="text-primary-dark/60">Nenhuma avaliação neste filtro.</p>
            </div>
          )}

          <div className="space-y-4">
            {(reviews ?? []).map((r) => (
              <ReviewRow key={`${r.kind}-${r.id}`} review={r} />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

function ReviewRow({ review: r }: { review: AdminReview }) {
  const qc = useQueryClient();

  const togglePub = useMutation({
    mutationFn: () => setReviewPublished(r.kind, r.id, !r.is_published),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reviews"] }),
  });

  const remove = useMutation({
    mutationFn: () => deleteReviewAsAdmin(r.kind, r.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reviews"] }),
  });

  const targetHref = r.kind === "course" ? `/cursos/${r.target_slug}` : `/loja/${r.target_slug}`;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[11px] uppercase tracking-widest text-primary-dark/50">
              {r.kind === "course" ? "Curso" : "Produto"}
            </span>
            <Link to={targetHref} className="font-display text-lg text-primary-dark hover:text-primary transition">
              {r.target_title}
            </Link>
            {!r.is_published && (
              <span className="text-[10px] uppercase tracking-widest bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                Despublicada
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-primary-dark/60">
            <span>{r.author_name ?? "Aluna"}</span>
            <span>·</span>
            <span>
              {new Date(r.created_at).toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
        <StarRating value={r.rating} size={16} />
      </div>

      {r.comment && (
        <p className="mt-3 text-sm text-primary-dark/80 whitespace-pre-line">{r.comment}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => togglePub.mutate()}
          disabled={togglePub.isPending}
          className="inline-flex items-center gap-1.5 border border-border text-primary-dark px-4 py-1.5 rounded-full text-[11px] uppercase tracking-widest hover:bg-cream/60 transition disabled:opacity-60"
        >
          {r.is_published ? (
            <>
              <EyeOff size={13} /> Despublicar
            </>
          ) : (
            <>
              <Eye size={13} /> Republicar
            </>
          )}
        </button>
        <button
          onClick={() => {
            if (confirm("Excluir avaliação? Esta ação é definitiva.")) remove.mutate();
          }}
          disabled={remove.isPending}
          className="inline-flex items-center gap-1.5 text-red-700 px-4 py-1.5 rounded-full text-[11px] uppercase tracking-widest hover:bg-red-50 transition disabled:opacity-60"
        >
          <Trash2 size={13} /> Excluir
        </button>
      </div>
    </div>
  );
}
