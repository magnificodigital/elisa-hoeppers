import { supabase, type Lesson } from "./supabase";

export type LessonFull = Lesson & {
  youtube_id: string | null;
  content_md: string | null;
};

export async function getLessonById(lessonId: string): Promise<LessonFull | null> {
  const { data, error } = await supabase
    .from("lessons")
    .select("id, course_id, module_id, slug, title, description, duration_min, display_order, is_free_preview, youtube_id, content_md")
    .eq("id", lessonId)
    .maybeSingle();
  if (error) throw error;
  return data as LessonFull | null;
}

export type LessonWithCourse = LessonFull & {
  course: { id: string; slug: string; title: string };
};

export async function getLessonWithCourse(lessonId: string): Promise<LessonWithCourse | null> {
  const { data, error } = await supabase
    .from("lessons")
    .select("id, course_id, module_id, slug, title, description, duration_min, display_order, is_free_preview, youtube_id, content_md, course:courses(id, slug, title)")
    .eq("id", lessonId)
    .maybeSingle();
  if (error) throw error;
  return data as LessonWithCourse | null;
}

export async function markLessonComplete(lessonId: string, watchedSeconds = 0): Promise<void> {
  const { error } = await supabase.rpc("mark_lesson_complete", {
    p_lesson_id: lessonId,
    p_watched_seconds: watchedSeconds,
  });
  if (error) throw error;
}

export type LessonWithProgress = Lesson & {
  completed: boolean;
  watched_seconds: number;
};

export async function listLessonsWithProgress(courseId: string): Promise<LessonWithProgress[]> {
  const { data: lessons, error } = await supabase
    .from("lessons")
    .select("id, course_id, module_id, slug, title, description, duration_min, display_order, is_free_preview")
    .eq("course_id", courseId)
    .order("display_order", { ascending: true });
  if (error) throw error;

  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData?.session?.user;
  if (!sessionUser || !lessons || lessons.length === 0) {
    return (lessons ?? []).map((l) => ({ ...l, completed: false, watched_seconds: 0 }));
  }

  const ids = lessons.map((l) => l.id);
  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id, completed, watched_seconds")
    .eq("user_id", sessionUser.id)
    .in("lesson_id", ids);

  const byId = new Map(progress?.map((p) => [p.lesson_id, p]) ?? []);
  return lessons.map((l) => {
    const p = byId.get(l.id);
    return { ...l, completed: !!p?.completed, watched_seconds: p?.watched_seconds ?? 0 };
  });
}
