import { supabase } from "./supabase";

export type ProductReview = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  is_published: boolean;
  created_at: string;
  author_name: string | null;
};

export type ProductReviewWithProfile = ProductReview & {
  profile: { full_name: string | null; avatar_url: string | null } | null;
};

export type ProductRatingSummary = {
  product_id: string;
  product_slug: string;
  avg_rating: number;
  review_count: number;
};

export async function getProductRatingSummary(productId: string): Promise<ProductRatingSummary | null> {
  const { data, error } = await supabase
    .from("product_rating_summary")
    .select("*")
    .eq("product_id", productId)
    .maybeSingle();
  if (error) throw error;
  return data as ProductRatingSummary | null;
}

export async function listReviewsByProduct(
  productId: string,
  limit = 20,
): Promise<ProductReviewWithProfile[]> {
  const { data, error } = await supabase
    .from("product_reviews")
    .select(
      `id, product_id, user_id, rating, comment, is_published, created_at, author_name,
       profile:profiles ( full_name, avatar_url )`,
    )
    .eq("product_id", productId)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as ProductReviewWithProfile[];
}

export async function getMyProductReview(productId: string): Promise<ProductReview | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData?.session?.user;
  if (!sessionUser) return null;
  const { data, error } = await supabase
    .from("product_reviews")
    .select("id, product_id, user_id, rating, comment, is_published, created_at, author_name")
    .eq("user_id", sessionUser.id)
    .eq("product_id", productId)
    .maybeSingle();
  if (error) throw error;
  return data as ProductReview | null;
}

export async function hasPurchasedProduct(productId: string): Promise<boolean> {
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData?.session?.user;
  if (!sessionUser) return false;
  const { data, error } = await supabase
    .from("orders")
    .select("items")
    .eq("user_id", sessionUser.id)
    .in("status", ["completed", "shipped"]);
  if (error) throw error;
  return (data ?? []).some(
    (o) =>
      Array.isArray(o.items) &&
      (o.items as { product_id: string }[]).some((it) => it.product_id === productId),
  );
}

export async function upsertMyProductReview(input: {
  product_id: string;
  rating: number;
  comment: string | null;
}): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData?.session?.user;
  if (!sessionUser) throw new Error("Você precisa estar logada.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", sessionUser.id)
    .maybeSingle();
  const authorName = profile?.full_name ?? null;

  const existing = await getMyProductReview(input.product_id);
  if (existing) {
    const { error } = await supabase
      .from("product_reviews")
      .update({ rating: input.rating, comment: input.comment, author_name: authorName })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("product_reviews").insert({
      user_id: sessionUser.id,
      product_id: input.product_id,
      rating: input.rating,
      comment: input.comment,
      is_published: true,
      author_name: authorName,
    });
    if (error) throw error;
  }
}

export async function deleteMyProductReview(reviewId: string): Promise<void> {
  const { error } = await supabase.from("product_reviews").delete().eq("id", reviewId);
  if (error) throw error;
}
