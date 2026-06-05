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
  module: { id: string; title: string; display_order: number } | null;
};

export async function listLessonsWithProgress(courseId: string): Promise<LessonWithProgress[]> {
  const { data: lessons, error } = await supabase
    .from("lessons")
    .select(`
      id, course_id, module_id, slug, title, description, duration_min, display_order, is_free_preview,
      module:modules ( id, title, display_order )
    `)
    .eq("course_id", courseId)
    .order("display_order", { ascending: true });
  if (error) throw error;

  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData?.session?.user;
  if (!sessionUser || !lessons || lessons.length === 0) {
    return (lessons ?? []).map((l: any) => ({ ...l, completed: false, watched_seconds: 0 }));
  }

  const ids = lessons.map((l: any) => l.id);
  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id, completed, watched_seconds")
    .eq("user_id", sessionUser.id)
    .in("lesson_id", ids);

  const byId = new Map(progress?.map((p) => [p.lesson_id, p]) ?? []);
  return (lessons as any[]).map((l) => {
    const p = byId.get(l.id);
    return { ...l, completed: !!p?.completed, watched_seconds: p?.watched_seconds ?? 0 };
  });
}

export type LessonGroup = {
  module: { id: string; title: string; display_order: number } | null;
  lessons: LessonWithProgress[];
};

export function groupLessonsByModule(lessons: LessonWithProgress[]): LessonGroup[] {
  const map = new Map<string, LessonGroup>();
  const unmoduled: LessonGroup = { module: null, lessons: [] };

  for (const l of lessons) {
    const m = (l as any).module ?? null;
    if (!m) {
      unmoduled.lessons.push(l);
      continue;
    }
    const key = m.id;
    if (!map.has(key)) map.set(key, { module: m, lessons: [] });
    map.get(key)!.lessons.push(l);
  }

  const groups = Array.from(map.values()).sort(
    (a, b) => (a.module?.display_order ?? 0) - (b.module?.display_order ?? 0)
  );
  groups.forEach((g) => g.lessons.sort((a, b) => a.display_order - b.display_order));
  unmoduled.lessons.sort((a, b) => a.display_order - b.display_order);

  if (unmoduled.lessons.length > 0) groups.push(unmoduled);
  return groups;
}


export async function isCourseJustCompleted(courseId: string): Promise<{ completed: boolean; certificateId: string | null }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData?.session?.user;
  if (!sessionUser) return { completed: false, certificateId: null };

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", courseId);
  const total = lessons?.length ?? 0;
  if (total === 0) return { completed: false, certificateId: null };

  const { count } = await supabase
    .from("lesson_progress")
    .select("lesson_id", { count: "exact", head: true })
    .eq("user_id", sessionUser.id)
    .eq("completed", true)
    .in("lesson_id", (lessons ?? []).map((l) => l.id));

  if ((count ?? 0) < total) return { completed: false, certificateId: null };

  const { data: cert } = await supabase
    .from("certificates")
    .select("id")
    .eq("user_id", sessionUser.id)
    .eq("course_id", courseId)
    .maybeSingle();

  return { completed: true, certificateId: cert?.id ?? null };
}
