import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { useAuth } from "@/hooks/useAuth";
import {
  listReviewsByProduct,
  getMyProductReview,
  upsertMyProductReview,
  deleteMyProductReview,
  getProductRatingSummary,
} from "@/lib/productReviews";

export function ProductReviews({
  productId,
  canReview,
}: {
  productId: string;
  canReview: boolean;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: summary } = useQuery({
    queryKey: ["product-rating-summary", productId],
    queryFn: () => getProductRatingSummary(productId),
  });

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["product-reviews", productId, summary?.review_count],
    queryFn: () => listReviewsByProduct(productId),
    enabled: (summary?.review_count ?? 0) > 0,
  });

  const { data: myReview } = useQuery({
    queryKey: ["my-product-review", user?.id, productId],
    queryFn: () => getMyProductReview(productId),
    enabled: !!user && canReview,
  });

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment ?? "");
    } else {
      setRating(0);
      setComment("");
    }
  }, [myReview]);

  const save = useMutation({
    mutationFn: () =>
      upsertMyProductReview({ product_id: productId, rating, comment: comment || null }),
    onSuccess: () => {
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["product-reviews", productId] });
      qc.invalidateQueries({ queryKey: ["my-product-review", user?.id, productId] });
      qc.invalidateQueries({ queryKey: ["product-rating-summary", productId] });
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteMyProductReview(myReview!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-reviews", productId] });
      qc.invalidateQueries({ queryKey: ["my-product-review", user?.id, productId] });
      qc.invalidateQueries({ queryKey: ["product-rating-summary", productId] });
    },
  });

  const avgRating = Number(summary?.avg_rating ?? 0);
  const count = summary?.review_count ?? 0;

  return (
    <div className="mt-12 bg-white rounded-xl border border-border p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl text-primary-dark mb-1">Avaliações</h2>
          {count > 0 ? (
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl text-primary-dark">
                {avgRating.toFixed(2)}
              </span>
              <StarRating value={avgRating} size={18} />
              <span className="text-sm text-[var(--text-muted)]">({count})</span>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              Ainda sem avaliações. Seja a primeira!
            </p>
          )}
        </div>
        {canReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="border border-primary text-primary px-5 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition self-start"
          >
            {myReview ? "Editar minha avaliação" : "Avaliar este produto"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="border border-border rounded-lg p-4 mb-6 bg-cream/30">
          <p className="text-sm font-medium text-primary-dark mb-2">Sua avaliação</p>
          <div className="mb-3">
            <StarRating
              value={rating}
              size={24}
              interactive
              onChange={(v) => setRating(v)}
            />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Conte sua experiência (opcional)"
            className="w-full border border-border rounded-md px-3 py-2 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-3"
          />
          {save.error && (
            <p className="text-red-700 text-sm mb-2">{(save.error as Error).message}</p>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => save.mutate()}
              disabled={rating < 1 || save.isPending}
              className="bg-primary text-white px-6 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60"
            >
              {save.isPending ? "Salvando…" : "Salvar avaliação"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs uppercase tracking-widest text-primary hover:opacity-70 px-3"
            >
              Cancelar
            </button>
            {myReview && (
              <button
                onClick={() => {
                  if (confirm("Excluir sua avaliação?")) remove.mutate();
                }}
                className="ml-auto text-xs uppercase tracking-widest text-red-700 hover:opacity-70 inline-flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </button>
            )}
          </div>
        </div>
      )}

      {isLoading && <p className="text-primary-dark text-sm">Carregando avaliações…</p>}

      <ul className="space-y-4">
        {(reviews ?? []).map((r) => (
          <li key={r.id} className="border-b border-border last:border-b-0 pb-4 last:pb-0">
            <div className="flex items-start gap-3">
              {r.profile?.avatar_url ? (
                <img
                  src={r.profile.avatar_url}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-primary-dark font-semibold text-xs flex-shrink-0">
                  {(r.profile?.full_name ?? r.author_name ?? "?").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-primary-dark">
                    {r.profile?.full_name ?? r.author_name ?? "Aluna"}
                  </p>
                  <span className="text-xs text-[var(--text-muted)]">·</span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(r.created_at).toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <StarRating value={r.rating} size={14} className="mb-1.5" />
                {r.comment && (
                  <p className="text-sm text-primary-dark/90 whitespace-pre-line">
                    {r.comment}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
