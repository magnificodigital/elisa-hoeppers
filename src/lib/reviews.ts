import { supabase } from "./supabase";

export type CourseReview = {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  is_published: boolean;
  created_at: string;
  author_name: string | null;
};

export type CourseReviewWithProfile = CourseReview & {
  profile: { full_name: string | null; avatar_url: string | null } | null;
};

export type CourseRatingSummary = {
  course_id: string;
  course_slug: string;
  avg_rating: number;
  review_count: number;
};

export async function getRatingSummary(courseId: string): Promise<CourseRatingSummary | null> {
  const { data, error } = await supabase
    .from("course_rating_summary")
    .select("*")
    .eq("course_id", courseId)
    .maybeSingle();
  if (error) throw error;
  return data as CourseRatingSummary | null;
}

export async function getRatingSummariesByIds(
  courseIds: string[],
): Promise<Record<string, CourseRatingSummary>> {
  if (courseIds.length === 0) return {};
  const { data, error } = await supabase
    .from("course_rating_summary")
    .select("*")
    .in("course_id", courseIds);
  if (error) throw error;
  const map: Record<string, CourseRatingSummary> = {};
  (data ?? []).forEach((r) => {
    const row = r as CourseRatingSummary;
    map[row.course_id] = { ...row, avg_rating: Number(row.avg_rating) };
  });
  return map;
}

export async function listReviewsByCourse(
  courseId: string,
  limit = 20,
): Promise<CourseReviewWithProfile[]> {
  const { data, error } = await supabase
    .from("course_reviews")
    .select(
      `id, course_id, user_id, rating, comment, is_published, created_at, author_name,
       profile:profiles ( full_name, avatar_url )`,
    )
    .eq("course_id", courseId)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as CourseReviewWithProfile[];
}

export async function getMyReview(courseId: string): Promise<CourseReview | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData?.session?.user;
  if (!sessionUser) return null;
  const { data, error } = await supabase
    .from("course_reviews")
    .select("id, course_id, user_id, rating, comment, is_published, created_at, author_name")
    .eq("user_id", sessionUser.id)
    .eq("course_id", courseId)
    .maybeSingle();
  if (error) throw error;
  return data as CourseReview | null;
}

export async function upsertMyReview(input: {
  course_id: string;
  rating: number;
  comment: string | null;
}): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData?.session?.user;
  if (!sessionUser) throw new Error("Você precisa estar logado.");

  // pega nome do profile pra snapshot
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", sessionUser.id)
    .maybeSingle();
  const authorName = profile?.full_name ?? null;

  const existing = await getMyReview(input.course_id);
  if (existing) {
    const { error } = await supabase
      .from("course_reviews")
      .update({ rating: input.rating, comment: input.comment, author_name: authorName })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("course_reviews").insert({
      user_id: sessionUser.id,
      course_id: input.course_id,
      rating: input.rating,
      comment: input.comment,
      is_published: true,
      author_name: authorName,
    });
    if (error) throw error;
  }
}

export async function deleteMyReview(reviewId: string): Promise<void> {
  const { error } = await supabase.from("course_reviews").delete().eq("id", reviewId);
  if (error) throw error;
}

export type HomeReview = {
  id: string;
  rating: number;
  comment: string | null;
  author_name: string | null;
  created_at: string;
  course: { slug: string; title: string; overlay_label: string | null } | null;
};

export async function listTopReviewsForHome(limit = 3): Promise<HomeReview[]> {
  const { data, error } = await supabase
    .from("course_reviews")
    .select(`
      id, rating, comment, author_name, created_at,
      course:courses ( slug, title, overlay_label )
    `)
    .eq("is_published", true)
    .gte("rating", 4)
    .not("comment", "is", null)
    .order("rating", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as HomeReview[];
}
