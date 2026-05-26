import { supabase } from "./supabase";
import type { Course } from "./supabase";

export type Enrollment = {
  id: string;
  user_id: string;
  course_id: string;
  status: "active" | "cancelled" | "completed";
  enrolled_at: string;
};

export async function enrollInCourse(courseId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) throw new Error("Você precisa estar logado para se matricular.");
  const { error } = await supabase
    .from("enrollments")
    .insert({ user_id: auth.user.id, course_id: courseId, status: "active" });
  if (error && error.code !== "23505") throw error;
}

export async function isEnrolledInCourse(courseId: string): Promise<boolean> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return false;
  const { data } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", auth.user.id)
    .eq("course_id", courseId)
    .eq("status", "active")
    .maybeSingle();
  return !!data;
}

export type EnrollmentWithCourse = Enrollment & { course: Course };

export async function listMyEnrollments(): Promise<EnrollmentWithCourse[]> {
  const { data, error } = await supabase
    .from("enrollments")
    .select(`
      id, user_id, course_id, status, enrolled_at,
      course:courses ( id, slug, title, subtitle, description, cover_image, overlay_label, level, duration_total_min, price_cents, is_published, display_order )
    `)
    .eq("status", "active")
    .order("enrolled_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as EnrollmentWithCourse[];
}
