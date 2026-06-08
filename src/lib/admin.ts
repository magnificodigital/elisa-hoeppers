import { supabase, type Course } from "./supabase";

// ============== COURSES ==============
export async function listAllCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("id, slug, title, subtitle, description, cover_image, overlay_label, level, duration_total_min, price_cents, is_published, display_order")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Course[];
}

export async function getCourseForAdmin(id: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from("courses")
    .select("id, slug, title, subtitle, description, cover_image, overlay_label, level, duration_total_min, price_cents, is_published, display_order")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Course | null;
}

export type CourseUpdate = Partial<Omit<Course, "id">>;

export async function updateCourse(id: string, patch: CourseUpdate): Promise<void> {
  const { error } = await supabase.from("courses").update(patch).eq("id", id);
  if (error) throw error;
}

export async function createCourse(input: { title: string; slug: string }): Promise<Course> {
  const { data, error } = await supabase
    .from("courses")
    .insert({ title: input.title.trim(), slug: input.slug.trim() })
    .select("id, slug, title, subtitle, description, cover_image, overlay_label, level, duration_total_min, price_cents, is_published, display_order")
    .single();
  if (error) throw error;
  return data as Course;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ============== LESSONS ==============
export type LessonAdmin = {
  id: string;
  course_id: string;
  module_id: string | null;
  slug: string;
  title: string;
  description: string | null;
  youtube_id: string | null;
  content_md: string | null;
  duration_min: number | null;
  display_order: number;
  is_free_preview: boolean;
};

export async function listLessonsForAdmin(courseId: string): Promise<LessonAdmin[]> {
  const { data, error } = await supabase
    .from("lessons")
    .select("id, course_id, module_id, slug, title, description, youtube_id, content_md, duration_min, display_order, is_free_preview")
    .eq("course_id", courseId)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as LessonAdmin[];
}

export type LessonInsert = Omit<LessonAdmin, "id">;
export type LessonUpdate = Partial<Omit<LessonAdmin, "id" | "course_id">>;

export async function createLesson(input: LessonInsert): Promise<LessonAdmin> {
  const { data, error } = await supabase.from("lessons").insert(input).select().single();
  if (error) throw error;
  return data as LessonAdmin;
}

export async function updateLesson(id: string, patch: LessonUpdate): Promise<void> {
  const { error } = await supabase.from("lessons").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteLesson(id: string): Promise<void> {
  const { error } = await supabase.from("lessons").delete().eq("id", id);
  if (error) throw error;
}

export function extractYouTubeId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m) return m[1];
  }
  return trimmed;
}

// ============== MODERAÇÃO DE REVIEWS ==============
export type AdminReview = {
  id: string;
  kind: "course" | "product";
  target_id: string;
  target_title: string;
  target_slug: string;
  user_id: string;
  rating: number;
  comment: string | null;
  author_name: string | null;
  is_published: boolean;
  created_at: string;
};

export async function listAllReviewsForAdmin(filter?: {
  kind?: "course" | "product";
  onlyHidden?: boolean;
}): Promise<AdminReview[]> {
  let q = (supabase as any)
    .from("admin_all_reviews")
    .select("*")
    .order("created_at", { ascending: false });
  if (filter?.kind) q = q.eq("kind", filter.kind);
  if (filter?.onlyHidden) q = q.eq("is_published", false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AdminReview[];
}

export async function setReviewPublished(
  kind: "course" | "product",
  reviewId: string,
  isPublished: boolean,
): Promise<void> {
  const table = kind === "course" ? "course_reviews" : "product_reviews";
  const { error } = await supabase.from(table).update({ is_published: isPublished }).eq("id", reviewId);
  if (error) throw error;
}

export async function deleteReviewAsAdmin(
  kind: "course" | "product",
  reviewId: string,
): Promise<void> {
  const table = kind === "course" ? "course_reviews" : "product_reviews";
  const { error } = await supabase.from(table).delete().eq("id", reviewId);
  if (error) throw error;
}

// ============== BUSCA GLOBAL ==============
export type GlobalSearchResult = {
  students: { id: string; full_name: string | null; email: string }[];
  courses: { id: string; title: string; slug: string }[];
  lessons: { id: string; title: string; course_id: string; course_title: string; course_slug: string }[];
  products: { id: string; name: string; slug: string }[];
  orders: { id: string; code: string; customer_name: string; total_cents: number; status: string }[];
  appointments: { id: string; code: string; customer_name: string; service_title: string; starts_at: string; status: string }[];
};

export async function adminGlobalSearch(query: string): Promise<GlobalSearchResult> {
  const { data, error } = await (supabase as any).rpc("admin_global_search", { p_query: query });
  if (error) throw error;
  return (data ?? {
    students: [], courses: [], lessons: [], products: [], orders: [], appointments: [],
  }) as GlobalSearchResult;
}
