import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { getQuizPublic, submitQuizAttempt, type QuizSubmissionResult, type QuizQuestionPublic } from "@/lib/quizzes";
import { supabase } from "@/lib/supabase";

export function LessonQuiz({ lessonId, onPassed }: { lessonId: string; onPassed?: () => void }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["lesson-quiz", lessonId],
    queryFn: () => getQuizPublic(lessonId),
  });

  const quiz = data?.quiz;
  const questions = data?.questions ?? [];

  const { data: attempts } = useQuery({
    queryKey: ["my-quiz-attempts", quiz?.id],
    queryFn: async () => {
      if (!quiz) return [];
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("id, score, correct_count, total_questions, passed, attempted_at")
        .eq("quiz_id", quiz.id)
        .order("attempted_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!quiz?.id,
  });

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizSubmissionResult | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);

  useEffect(() => {
    setAnswers({});
    setResult(null);
    setShowQuestions(false);
  }, [lessonId]);

  const submit = useMutation({
    mutationFn: () => submitQuizAttempt(quiz!.id, answers),
    onSuccess: (res) => {
      setResult(res);
      setShowQuestions(false);
      qc.invalidateQueries({ queryKey: ["my-quiz-attempts", quiz?.id] });
      qc.invalidateQueries({ queryKey: ["my-quiz-attempts-all"] });
      if (res.passed) onPassed?.();
    },
  });

  const attemptsUsed = attempts?.length ?? 0;
  const attemptsLeft = quiz?.max_attempts == null ? Infinity : Math.max(0, quiz.max_attempts - attemptsUsed);
  const allAnswered = useMemo(
    () => questions.every((q) => answers[q.id] !== undefined && answers[q.id] !== null),
    [questions, answers],
  );

  if (isLoading) return null;
  if (!quiz) return null;

  return (
    <div className="bg-white rounded-lg p-6 md:p-8 mt-10 border border-[#E5E0D8]">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h2 className="font-display text-xl text-primary-dark">{quiz.title}</h2>
          {quiz.description && <p className="text-sm text-primary-dark/70 mt-1">{quiz.description}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] uppercase tracking-widest text-primary-dark/50">Nota mínima</p>
          <p className="font-display text-2xl text-primary-dark">{quiz.passing_score}%</p>
        </div>
      </div>

      <p className="text-xs text-primary-dark/60 mb-6">
        {questions.length} {questions.length === 1 ? "pergunta" : "perguntas"}
        {quiz.max_attempts != null && (
          <>
            {" · "}Tentativas: {attemptsUsed}/{quiz.max_attempts}
          </>
        )}
      </p>

      {result && !showQuestions && (
        <ResultView
          result={result}
          questions={questions}
          passingScore={quiz.passing_score}
          attemptsLeft={attemptsLeft}
          onRetry={() => {
            setResult(null);
            setAnswers({});
            setShowQuestions(true);
          }}
        />
      )}

      {!result && !showQuestions && (
        <div className="text-center py-6">
          {attempts && attempts.length > 0 ? (
            <>
              <p className="text-sm text-primary-dark mb-1">
                Última tentativa: <span className="font-medium">{attempts[0].score}%</span>{" "}
                {attempts[0].passed ? "✓ aprovada" : "— não aprovada"}
              </p>
              <p className="text-xs text-primary-dark/50 mb-5">
                {new Date(attempts[0].attempted_at).toLocaleString("pt-BR")}
              </p>
            </>
          ) : (
            <p className="text-sm text-primary-dark/70 mb-5">Você ainda não fez este quiz.</p>
          )}
          {attemptsLeft > 0 ? (
            <button
              onClick={() => setShowQuestions(true)}
              className="bg-primary text-white px-8 py-3 rounded-full uppercase tracking-[0.2em] text-xs font-semibold hover:bg-primary-dark transition"
            >
              {attempts && attempts.length > 0 ? "Tentar novamente" : "Iniciar quiz"}
            </button>
          ) : (
            <p className="text-sm text-red-600">Limite de tentativas atingido.</p>
          )}
        </div>
      )}

      {showQuestions && (
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="border-t border-[#E5E0D8] pt-5">
              <p className="text-primary-dark mb-3">
                <span className="font-medium mr-2">{idx + 1}.</span>
                {q.question_text}
              </p>
              {q.question_type === "multiple_choice" && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt, i) => (
                    <label key={i} className="flex items-start gap-3 p-3 rounded border border-[#E5E0D8] hover:bg-cream/40 cursor-pointer">
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={answers[q.id] === i}
                        onChange={() => setAnswers({ ...answers, [q.id]: i })}
                        className="mt-1"
                      />
                      <span className="text-sm text-primary-dark">{opt}</span>
                    </label>
                  ))}
                </div>
              )}
              {q.question_type === "true_false" && (
                <div className="flex gap-3">
                  {[
                    { label: "Verdadeiro", value: 1 },
                    { label: "Falso", value: 0 },
                  ].map((b) => (
                    <label
                      key={b.value}
                      className={`flex-1 text-center px-4 py-3 rounded border cursor-pointer text-sm transition ${
                        answers[q.id] === b.value
                          ? "border-primary bg-primary text-white"
                          : "border-[#E5E0D8] text-primary-dark hover:bg-cream/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={answers[q.id] === b.value}
                        onChange={() => setAnswers({ ...answers, [q.id]: b.value })}
                        className="sr-only"
                      />
                      {b.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          {submit.error && (
            <p className="text-sm text-red-600">{(submit.error as Error).message}</p>
          )}

          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={() => submit.mutate()}
              disabled={!allAnswered || submit.isPending}
              className="bg-primary text-white px-8 py-3 rounded-full uppercase tracking-[0.2em] text-xs font-semibold hover:bg-primary-dark transition disabled:opacity-60"
            >
              {submit.isPending ? "Enviando…" : "Enviar respostas"}
            </button>
            {!allAnswered && (
              <p className="text-xs text-primary-dark/60">Responda todas as perguntas pra enviar.</p>
            )}
            <button
              onClick={() => {
                setShowQuestions(false);
                setAnswers({});
              }}
              className="ml-auto text-xs uppercase tracking-widest text-primary hover:opacity-70"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultView({
  result,
  questions,
  passingScore,
  attemptsLeft,
  onRetry,
}: {
  result: QuizSubmissionResult;
  questions: QuizQuestionPublic[];
  passingScore: number;
  attemptsLeft: number;
  onRetry: () => void;
}) {
  const byId = new Map(questions.map((q) => [q.id, q]));
  return (
    <div>
      <div className="text-center py-6 mb-6 bg-cream/50 rounded-lg">
        <p className="font-display text-5xl text-primary-dark">{result.score}%</p>
        <p className="text-sm text-primary-dark/70 mt-2">
          {result.correct_count} de {result.total_questions} corretas · Nota mínima: {passingScore}%
        </p>
        <p className={`mt-3 text-sm font-medium ${result.passed ? "text-green-700" : "text-red-700"}`}>
          {result.passed ? "✓ Aprovada" : "Não atingiu a nota mínima"}
        </p>
      </div>

      <h3 className="text-xs uppercase tracking-widest text-primary-dark/60 mb-4">Revisão</h3>
      <div className="space-y-4 mb-6">
        {result.results.map((r, idx) => {
          const q = byId.get(r.question_id);
          if (!q) return null;
          const userText =
            q.question_type === "true_false"
              ? r.user_answer === 1
                ? "Verdadeiro"
                : r.user_answer === 0
                ? "Falso"
                : "—"
              : q.options?.[r.user_answer] ?? "—";
          const correctText =
            q.question_type === "true_false"
              ? r.correct_answer === 1
                ? "Verdadeiro"
                : "Falso"
              : q.options?.[r.correct_answer] ?? "—";
          return (
            <div key={r.question_id} className="border border-[#E5E0D8] rounded p-4">
              <p className="text-sm text-primary-dark mb-2">
                <span className="font-medium">{idx + 1}.</span> {q.question_text}
              </p>
              <div className="flex items-start gap-2 text-sm">
                {r.is_correct ? (
                  <CheckCircle2 size={16} className="text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <XCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
                )}
                <span className="text-primary-dark">
                  Sua resposta: <span className="font-medium">{userText}</span>
                </span>
              </div>
              {!r.is_correct && (
                <p className="text-sm text-green-700 mt-1 ml-6">
                  Correta: <span className="font-medium">{correctText}</span>
                </p>
              )}
              {r.explanation && (
                <p className="text-xs text-primary-dark/70 mt-2 bg-cream/50 p-3 rounded">
                  💡 {r.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {attemptsLeft > 0 && (
        <div className="text-center">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 border border-primary text-primary px-6 py-2.5 rounded-full uppercase tracking-widest text-xs hover:bg-primary hover:text-white transition"
          >
            <RotateCcw size={14} /> Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}
