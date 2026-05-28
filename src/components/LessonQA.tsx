import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send, Trash2, CheckCircle2, Circle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listLessonQuestions, createQuestion, createAnswer,
  deleteQuestion, deleteAnswer, markQuestionResolved,
  type QuestionWithAnswers, type Answer,
} from "@/lib/qa";

export function LessonQA({ lessonId }: { lessonId: string }) {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [newQ, setNewQ] = useState("");

  const { data: questions, isLoading } = useQuery({
    queryKey: ["lesson-qa", lessonId],
    queryFn: () => listLessonQuestions(lessonId),
  });

  const askQ = useMutation({
    mutationFn: () => createQuestion({ lesson_id: lessonId, body: newQ }),
    onSuccess: () => {
      setNewQ("");
      qc.invalidateQueries({ queryKey: ["lesson-qa", lessonId] });
    },
  });

  const isStaff = profile?.role === "instructor" || profile?.role === "admin";

  if (!user) return null;

  return (
    <section className="mt-12 bg-white rounded-lg p-6 border border-border">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl text-primary-dark">Perguntas & Respostas</h2>
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          {(questions?.length ?? 0)} pergunta{(questions?.length ?? 0) === 1 ? "" : "s"}
        </span>
      </header>

      <form
        onSubmit={(e) => { e.preventDefault(); if (newQ.trim()) askQ.mutate(); }}
        className="bg-cream/40 rounded-md p-4 mb-6"
      >
        <textarea
          value={newQ}
          onChange={(e) => setNewQ(e.target.value)}
          placeholder="Tem uma dúvida sobre esta aula? Pergunta aqui."
          rows={3}
          className="w-full border border-border rounded-md px-3 py-2.5 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-2"
        />
        {askQ.error && <p className="text-red-700 text-xs mb-2">{(askQ.error as Error).message}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={askQ.isPending || newQ.trim().length === 0}
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60"
          >
            <Send className="w-3.5 h-3.5" /> {askQ.isPending ? "Enviando…" : "Perguntar"}
          </button>
        </div>
      </form>

      {isLoading && <p className="text-primary-dark text-sm">Carregando…</p>}

      {!isLoading && (questions?.length ?? 0) === 0 && (
        <p className="text-sm text-[var(--text-muted)] italic text-center py-4">
          Sem perguntas ainda. Seja a primeira a perguntar.
        </p>
      )}

      <div className="space-y-4">
        {(questions ?? []).map((q) => (
          <QuestionCard key={q.id} question={q} isStaff={isStaff} currentUserId={user.id} lessonId={lessonId} />
        ))}
      </div>
    </section>
  );
}

function QuestionCard({ question, isStaff, currentUserId, lessonId }: {
  question: QuestionWithAnswers; isStaff: boolean; currentUserId: string; lessonId: string;
}) {
  const qc = useQueryClient();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const isOwner = question.user_id === currentUserId;

  const reply = useMutation({
    mutationFn: () => createAnswer({ question_id: question.id, body: replyText }),
    onSuccess: () => {
      setReplyText(""); setReplyOpen(false);
      qc.invalidateQueries({ queryKey: ["lesson-qa", lessonId] });
    },
  });

  const del = useMutation({
    mutationFn: () => deleteQuestion(question.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lesson-qa", lessonId] }),
  });

  const toggleResolved = useMutation({
    mutationFn: () => markQuestionResolved(question.id, !question.is_resolved),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lesson-qa", lessonId] }),
  });

  return (
    <article className="border border-border rounded-lg p-4">
      <header className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center text-primary-dark text-xs font-semibold flex-shrink-0">
          {(question.author_name ?? "A").slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-primary-dark">{question.author_name ?? "Aluna"}</p>
            <span className="text-[10px] text-[var(--text-muted)]">
              {new Date(question.created_at).toLocaleString("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
            {question.is_resolved && (
              <span className="text-[10px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Resolvida
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {(isOwner || isStaff) && (
            <button
              onClick={() => toggleResolved.mutate()}
              className="text-[var(--text-muted)] hover:text-primary"
              title={question.is_resolved ? "Marcar como não resolvida" : "Marcar como resolvida"}
            >
              {question.is_resolved ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Circle className="w-4 h-4" />}
            </button>
          )}
          {(isOwner || isStaff) && (
            <button onClick={() => { if (confirm("Excluir pergunta? Respostas também serão deletadas.")) del.mutate(); }}
              className="text-[var(--text-muted)] hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>
      <p className="text-primary-dark/90 leading-relaxed mb-3 whitespace-pre-line">{question.body}</p>

      {question.answers.length > 0 && (
        <div className="border-l-2 border-primary/30 pl-4 space-y-3 mt-4">
          {question.answers.map((a) => <AnswerItem key={a.id} answer={a} isStaff={isStaff} currentUserId={currentUserId} lessonId={lessonId} />)}
        </div>
      )}

      {!replyOpen ? (
        <button onClick={() => setReplyOpen(true)}
          className="mt-3 text-xs uppercase tracking-widest text-primary hover:opacity-70">
          Responder
        </button>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); if (replyText.trim()) reply.mutate(); }}
          className="mt-3 bg-cream/40 rounded-md p-3">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Sua resposta…"
            rows={2}
            className="w-full border border-border rounded-md px-3 py-2 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-2"
          />
          {reply.error && <p className="text-red-700 text-xs mb-1">{(reply.error as Error).message}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={reply.isPending || replyText.trim().length === 0}
              className="bg-primary text-white px-4 py-1.5 rounded-full text-[11px] uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60">
              {reply.isPending ? "Enviando…" : "Enviar resposta"}
            </button>
            <button type="button" onClick={() => { setReplyOpen(false); setReplyText(""); }}
              className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] hover:text-primary-dark px-2">
              Cancelar
            </button>
          </div>
        </form>
      )}
    </article>
  );
}

function AnswerItem({ answer, isStaff, currentUserId, lessonId }: {
  answer: Answer; isStaff: boolean; currentUserId: string; lessonId: string;
}) {
  const qc = useQueryClient();
  const isOwner = answer.user_id === currentUserId;
  const isStaffAnswer = answer.author_role === "instructor" || answer.author_role === "admin";

  const del = useMutation({
    mutationFn: () => deleteAnswer(answer.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lesson-qa", lessonId] }),
  });

  return (
    <div className={`flex items-start gap-3 ${isStaffAnswer ? "bg-primary/5 -mx-2 px-2 py-2 rounded-md" : ""}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
        isStaffAnswer ? "bg-primary text-white" : "bg-cream text-primary-dark"
      }`}>
        {(answer.author_name ?? "A").slice(0, 1).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="text-sm font-medium text-primary-dark">{answer.author_name ?? "Aluna"}</p>
          {isStaffAnswer && (
            <span className="text-[10px] uppercase tracking-widest bg-primary text-white px-2 py-0.5 rounded">Instrutora</span>
          )}
          <span className="text-[10px] text-[var(--text-muted)]">
            {new Date(answer.created_at).toLocaleString("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <p className="text-sm text-primary-dark/90 leading-relaxed whitespace-pre-line">{answer.body}</p>
      </div>
      {(isOwner || isStaff) && (
        <button onClick={() => { if (confirm("Excluir resposta?")) del.mutate(); }}
          className="text-[var(--text-muted)] hover:text-red-700 flex-shrink-0" aria-label="Excluir">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
