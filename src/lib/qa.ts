import { supabase } from "./supabase";

export type Question = {
  id: string;
  lesson_id: string;
  user_id: string | null;
  author_name: string | null;
  body: string;
  is_resolved: boolean;
  created_at: string;
};

export type Answer = {
  id: string;
  question_id: string;
  user_id: string | null;
  author_name: string | null;
  author_role: "student" | "instructor" | "admin" | null;
  body: string;
  created_at: string;
};

export type QuestionWithAnswers = Question & { answers: Answer[] };

async function getSessionUser() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user ?? null;
}

async function getMyProfile(): Promise<{ id: string; full_name: string | null; role: "student" | "instructor" | "admin" } | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .maybeSingle();
  return data as { id: string; full_name: string | null; role: "student" | "instructor" | "admin" } | null;
}

export async function listLessonQuestions(lessonId: string): Promise<QuestionWithAnswers[]> {
  const { data: questions, error } = await supabase
    .from("lesson_questions")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!questions || questions.length === 0) return [];

  const ids = questions.map((q) => q.id);
  const { data: answers } = await supabase
    .from("lesson_answers")
    .select("*")
    .in("question_id", ids)
    .order("created_at", { ascending: true });

  const byQ = new Map<string, Answer[]>();
  (answers ?? []).forEach((a) => {
    const arr = byQ.get(a.question_id) ?? [];
    arr.push(a as Answer);
    byQ.set(a.question_id, arr);
  });

  return (questions as Question[]).map((q) => ({ ...q, answers: byQ.get(q.id) ?? [] }));
}

export async function createQuestion(input: { lesson_id: string; body: string }): Promise<void> {
  const profile = await getMyProfile();
  if (!profile) throw new Error("Você precisa estar logada.");
  const { error } = await supabase.from("lesson_questions").insert({
    lesson_id: input.lesson_id,
    user_id: profile.id,
    author_name: profile.full_name,
    body: input.body.trim(),
  });
  if (error) throw error;
}

export async function createAnswer(input: { question_id: string; body: string }): Promise<void> {
  const profile = await getMyProfile();
  if (!profile) throw new Error("Você precisa estar logada.");
  const { error } = await supabase.from("lesson_answers").insert({
    question_id: input.question_id,
    user_id: profile.id,
    author_name: profile.full_name,
    author_role: profile.role,
    body: input.body.trim(),
  });
  if (error) throw error;
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase.from("lesson_questions").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteAnswer(id: string): Promise<void> {
  const { error } = await supabase.from("lesson_answers").delete().eq("id", id);
  if (error) throw error;
}

export async function markQuestionResolved(id: string, resolved: boolean): Promise<void> {
  const { error } = await supabase.from("lesson_questions").update({ is_resolved: resolved }).eq("id", id);
  if (error) throw error;
}

export type MyQuestion = Question & {
  lesson: { id: string; title: string; course: { slug: string; title: string } | null } | null;
  answer_count: number;
};

export async function listMyQuestions(): Promise<MyQuestion[]> {
  const user = await getSessionUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("lesson_questions")
    .select(`
      id, lesson_id, user_id, author_name, body, is_resolved, created_at,
      lesson:lessons ( id, title, course:courses ( slug, title ) ),
      answers:lesson_answers ( count )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: { answers?: { count: number }[] } & Record<string, unknown>) => ({
    ...row,
    answer_count: row.answers?.[0]?.count ?? 0,
  })) as unknown as MyQuestion[];
}
