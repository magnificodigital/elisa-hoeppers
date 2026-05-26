import { supabase } from "./supabase";

export type Quiz = {
  id: string;
  lesson_id: string;
  title: string;
  description: string | null;
  passing_score: number;
  max_attempts: number | null;
  is_published: boolean;
};

export type QuizQuestionPublic = {
  id: string;
  quiz_id: string;
  question_type: "multiple_choice" | "true_false";
  question_text: string;
  options: string[] | null;
  display_order: number;
};

export type QuizQuestionAdmin = QuizQuestionPublic & {
  correct_answer: number;
  explanation: string | null;
};

export type QuizAttempt = {
  id: string;
  quiz_id: string;
  user_id: string;
  answers: Record<string, number>;
  score: number;
  correct_count: number;
  total_questions: number;
  passed: boolean;
  attempted_at: string;
};

export type QuizSubmissionResult = {
  attempt_id: string;
  score: number;
  passed: boolean;
  total_questions: number;
  correct_count: number;
  results: Array<{
    question_id: string;
    user_answer: number;
    correct_answer: number;
    is_correct: boolean;
    explanation: string | null;
  }>;
};

// =================== ADMIN ===================
export async function getQuizByLesson(lessonId: string): Promise<Quiz | null> {
  const { data, error } = await supabase
    .from("quizzes")
    .select("id, lesson_id, title, description, passing_score, max_attempts, is_published")
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (error) throw error;
  return data as Quiz | null;
}

export async function listQuestionsForAdmin(quizId: string): Promise<QuizQuestionAdmin[]> {
  const { data, error } = await supabase
    .from("quiz_questions")
    .select("id, quiz_id, question_type, question_text, options, correct_answer, explanation, display_order")
    .eq("quiz_id", quizId)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as QuizQuestionAdmin[];
}

export async function upsertQuiz(input: { lesson_id: string; id?: string; title: string; description?: string | null; passing_score: number; max_attempts?: number | null; is_published?: boolean }): Promise<Quiz> {
  const payload = {
    lesson_id: input.lesson_id,
    title: input.title,
    description: input.description ?? null,
    passing_score: input.passing_score,
    max_attempts: input.max_attempts ?? null,
    is_published: input.is_published ?? true,
  };
  if (input.id) {
    const { data, error } = await supabase.from("quizzes").update(payload).eq("id", input.id).select().single();
    if (error) throw error;
    return data as Quiz;
  }
  const { data, error } = await supabase.from("quizzes").insert(payload).select().single();
  if (error) throw error;
  return data as Quiz;
}

export async function deleteQuiz(quizId: string): Promise<void> {
  const { error } = await supabase.from("quizzes").delete().eq("id", quizId);
  if (error) throw error;
}

export type QuestionInput = Omit<QuizQuestionAdmin, "id" | "quiz_id">;
export async function createQuestion(quizId: string, input: QuestionInput): Promise<QuizQuestionAdmin> {
  const { data, error } = await supabase.from("quiz_questions").insert({ quiz_id: quizId, ...input }).select().single();
  if (error) throw error;
  return data as QuizQuestionAdmin;
}

export async function updateQuestion(id: string, patch: Partial<QuestionInput>): Promise<void> {
  const { error } = await supabase.from("quiz_questions").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase.from("quiz_questions").delete().eq("id", id);
  if (error) throw error;
}

// =================== STUDENT ===================
export async function getQuizPublic(lessonId: string): Promise<{ quiz: Quiz | null; questions: QuizQuestionPublic[] }> {
  const quiz = await getQuizByLesson(lessonId);
  if (!quiz || !quiz.is_published) return { quiz: null, questions: [] };
  const { data, error } = await supabase
    .from("quiz_questions_public")
    .select("*")
    .eq("quiz_id", quiz.id)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return { quiz, questions: (data ?? []) as QuizQuestionPublic[] };
}

export async function submitQuizAttempt(quizId: string, answers: Record<string, number>): Promise<QuizSubmissionResult> {
  const { data, error } = await supabase.rpc("submit_quiz_attempt", {
    p_quiz_id: quizId,
    p_answers: answers,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row as QuizSubmissionResult;
}

export async function listMyAttempts(): Promise<QuizAttempt[]> {
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("id, quiz_id, user_id, answers, score, correct_count, total_questions, passed, attempted_at")
    .order("attempted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as QuizAttempt[];
}
