import { supabase } from "./supabase";
import type { Course } from "./supabase";
import { track } from "./analytics";

export type Enrollment = {
  id: string;
  user_id: string;
  course_id: string;
  status: "active" | "cancelled" | "completed";
  enrolled_at: string;
};

export async function enrollInCourse(courseId: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData?.session?.user;
  if (!sessionUser) throw new Error("Você precisa estar logado para se matricular.");
  const { error } = await supabase
    .from("enrollments")
    .insert({ user_id: sessionUser.id, course_id: courseId, status: "active" });
  if (error && error.code !== "23505") throw error;
  track("course_enrolled", { course_id: courseId });
}

export async function isEnrolledInCourse(courseId: string): Promise<boolean> {
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData?.session?.user;
  if (!sessionUser) return false;
  const { data } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", sessionUser.id)
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

export type CourseProgressRow = {
  course_id: string;
  course_slug: string;
  course_title: string;
  cover_image: string | null;
  overlay_label: string | null;
  enrolled_at: string;
  total_lessons: number;
  completed_lessons: number;
  next_lesson_id: string | null;
};

export async function listMyCourseProgress(): Promise<CourseProgressRow[]> {
  const { data, error } = await supabase
    .from("my_course_progress")
    .select("*")
    .order("enrolled_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CourseProgressRow[];
}

export type MyEnrollment = {
  id: string;
  user_id: string;
  course_id: string;
  status: "active" | "cancelled" | "completed";
  enrolled_at: string;
};

export async function getMyEnrollment(courseId: string): Promise<MyEnrollment | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData?.session?.user;
  if (!sessionUser) return null;
  const { data, error } = await supabase
    .from("enrollments")
    .select("id, user_id, course_id, status, enrolled_at")
    .eq("user_id", sessionUser.id)
    .eq("course_id", courseId)
    .maybeSingle();
  if (error) throw error;
  return data as MyEnrollment | null;
}
