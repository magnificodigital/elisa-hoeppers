import { supabase, type Course, type Lesson } from "./supabase";
import { mediaUrl } from "./storage";

function withCourseMedia(course: Course): Course {
  return { ...course, cover_image: mediaUrl(course.cover_image) };
}

export async function listPublishedCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("id, slug, title, subtitle, description, cover_image, overlay_label, level, duration_total_min, price_cents, is_published, display_order")
    .eq("is_published", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(withCourseMedia);
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from("courses")
    .select("id, slug, title, subtitle, description, cover_image, overlay_label, level, duration_total_min, price_cents, is_published, display_order")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return data ? withCourseMedia(data) : null;
}

export async function listLessonsByCourse(courseId: string): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from("lessons")
    .select("id, course_id, module_id, slug, title, description, duration_min, display_order, is_free_preview")
    .eq("course_id", courseId)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
