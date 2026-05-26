import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Trash2, Save, Plus } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import {
  getQuizByLesson, listQuestionsForAdmin, upsertQuiz, deleteQuiz,
  createQuestion, updateQuestion, deleteQuestion,
  type QuizQuestionAdmin,
} from "@/lib/quizzes";

export const Route = createFileRoute("/admin/cursos/$id/aulas/$lessonId/quiz")({
  head: () => ({ meta: [{ title: "Admin — Quiz da aula" }] }),
  component: () => (
    <AdminGuard>
      <QuizEditor />
    </AdminGuard>
  ),
});

const inputCls = "w-full border border-border rounded-md px-3 py-2 bg-white text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary text-sm";

function QuizEditor() {
  const { id: courseId, lessonId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: quiz, isLoading: loadingQuiz } = useQuery({
    queryKey: ["admin-quiz", lessonId],
    queryFn: () => getQuizByLesson(lessonId),
  });

  const { data: questions } = useQuery({
    queryKey: ["admin-quiz-questions", quiz?.id],
    queryFn: () => listQuestionsForAdmin(quiz!.id),
    enabled: !!quiz?.id,
  });

  const [meta, setMeta] = useState({ title: "", description: "", passing_score: 70, max_attempts: "" as string | number, is_published: true });

  useEffect(() => {
    if (quiz) {
      setMeta({
        title: quiz.title,
        description: quiz.description ?? "",
        passing_score: quiz.passing_score,
        max_attempts: quiz.max_attempts ?? "",
        is_published: quiz.is_published,
      });
    }
  }, [quiz]);

  const saveQuiz = useMutation({
    mutationFn: () => upsertQuiz({
      id: quiz?.id,
      lesson_id: lessonId,
      title: meta.title || "Quiz",
      description: meta.description || null,
      passing_score: typeof meta.passing_score === "number" ? meta.passing_score : 70,
      max_attempts: meta.max_attempts === "" ? null : Number(meta.max_attempts),
      is_published: meta.is_published,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-quiz", lessonId] });
    },
  });

  const removeQuiz = useMutation({
    mutationFn: () => deleteQuiz(quiz!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-quiz", lessonId] });
      navigate({ to: "/admin/cursos/$id/aulas", params: { id: courseId } });
    },
  });

  return (
    <Layout>
      <section className="py-12 md:py-20 bg-[var(--surface-cream)] min-h-screen">
        <div className="container mx-auto px-6 max-w-4xl">
          <Link to="/admin/cursos/$id/aulas" params={{ id: courseId }} className="text-xs uppercase tracking-widest text-primary hover:opacity-70">← Voltar para aulas</Link>
          <h1 className="font-display text-3xl md:text-4xl text-primary-dark mt-3">Quiz da aula</h1>
          <p className="text-[var(--text-muted)] text-sm mb-6">Crie até quantas perguntas quiser. Tipos: múltipla escolha ou verdadeiro/falso.</p>

          {/* Quiz meta */}
          <div className="bg-white rounded-lg p-5 space-y-3 mb-8">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Título do quiz</label>
              <input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} className={inputCls} placeholder="Quiz — Conhecendo os pesinhos" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Descrição (opcional)</label>
              <textarea value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} rows={2} className={inputCls} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Nota mínima (%)</label>
                <input type="number" min={0} max={100} value={meta.passing_score} onChange={(e) => setMeta({ ...meta, passing_score: parseInt(e.target.value) || 0 })} className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Tentativas (vazio = ∞)</label>
                <input type="number" min={1} value={meta.max_attempts as any} onChange={(e) => setMeta({ ...meta, max_attempts: e.target.value })} className={inputCls} />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={meta.is_published} onChange={(e) => setMeta({ ...meta, is_published: e.target.checked })} />
                  <span className="text-xs text-primary-dark">Publicado</span>
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => saveQuiz.mutate()} disabled={saveQuiz.isPending} className="bg-primary text-white px-6 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60">
                {saveQuiz.isPending ? "Salvando…" : quiz ? "Salvar quiz" : "Criar quiz"}
              </button>
              {quiz && (
                <button onClick={() => { if (confirm("Excluir quiz e todas as perguntas?")) removeQuiz.mutate(); }} className="text-xs uppercase tracking-widest text-red-700 hover:opacity-70 ml-auto">
                  Excluir quiz
                </button>
              )}
            </div>
          </div>

          {/* Perguntas */}
          {quiz && (
            <>
              <h2 className="font-display text-xl text-primary-dark mb-4">Perguntas</h2>
              <div className="space-y-3 mb-6">
                {(questions ?? []).map((q) => (
                  <QuestionRow key={q.id} question={q} onChanged={() => qc.invalidateQueries({ queryKey: ["admin-quiz-questions", quiz.id] })} />
                ))}
                {(questions?.length ?? 0) === 0 && <p className="text-sm text-[var(--text-muted)] italic">Nenhuma pergunta ainda. Adicione a primeira abaixo.</p>}
              </div>
              <NewQuestionForm quizId={quiz.id} nextOrder={(questions?.length ?? 0) + 1} onCreated={() => qc.invalidateQueries({ queryKey: ["admin-quiz-questions", quiz.id] })} />
            </>
          )}

          {loadingQuiz && <p className="text-primary-dark">Carregando…</p>}
        </div>
      </section>
    </Layout>
  );
}

function QuestionRow({ question, onChanged }: { question: QuizQuestionAdmin; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    question_type: question.question_type,
    question_text: question.question_text,
    options: question.options ?? ["", "", "", ""],
    correct_answer: question.correct_answer,
    explanation: question.explanation ?? "",
    display_order: question.display_order,
  });

  const save = useMutation({
    mutationFn: () => updateQuestion(question.id, {
      question_type: form.question_type,
      question_text: form.question_text,
      options: form.question_type === "true_false" ? null : (form.options as string[]).filter(Boolean),
      correct_answer: form.correct_answer,
      explanation: form.explanation || null,
      display_order: form.display_order,
    }),
    onSuccess: () => { setEditing(false); onChanged(); },
  });
  const del = useMutation({ mutationFn: () => deleteQuestion(question.id), onSuccess: onChanged });

  if (!editing) {
    return (
      <div className="bg-white rounded-lg p-4 flex items-start gap-4">
        <span className="w-7 h-7 rounded-full bg-sand text-primary-dark flex items-center justify-center text-xs font-semibold flex-shrink-0">{question.display_order}</span>
        <div className="flex-1 min-w-0">
          <p className="text-primary-dark font-medium">{question.question_text}</p>
          <div className="mt-1 flex gap-2 flex-wrap">
            <span className="text-[10px] uppercase bg-cream/60 text-primary-dark px-2 py-0.5 rounded">{question.question_type === "true_false" ? "V/F" : "Múltipla"}</span>
            {question.question_type === "multiple_choice" && question.options && (
              <span className="text-xs text-[var(--text-muted)]">{question.options.length} opções · resposta: {question.options[question.correct_answer]}</span>
            )}
            {question.question_type === "true_false" && (
              <span className="text-xs text-[var(--text-muted)]">resposta: {question.correct_answer === 1 ? "Verdadeiro" : "Falso"}</span>
            )}
          </div>
        </div>
        <button onClick={() => setEditing(true)} className="text-xs uppercase tracking-widest text-primary hover:opacity-70">Editar</button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-5 space-y-3 border border-primary/20">
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Tipo</label>
        <select value={form.question_type} onChange={(e) => setForm({ ...form, question_type: e.target.value as any, correct_answer: 0 })} className={inputCls}>
          <option value="multiple_choice">Múltipla escolha</option>
          <option value="true_false">Verdadeiro / Falso</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Pergunta</label>
        <textarea value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} rows={2} className={inputCls} />
      </div>
      {form.question_type === "multiple_choice" ? (
        <div className="space-y-2">
          <label className="block text-[10px] uppercase tracking-widest text-primary-dark">Opções (marque a correta)</label>
          {(form.options as string[]).map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name={`correct-${question.id}`} checked={form.correct_answer === i} onChange={() => setForm({ ...form, correct_answer: i })} />
              <input value={opt} onChange={(e) => {
                const next = [...(form.options as string[])]; next[i] = e.target.value;
                setForm({ ...form, options: next });
              }} className={inputCls + " flex-1"} placeholder={`Opção ${i + 1}`} />
              <button type="button" onClick={() => {
                const next = (form.options as string[]).filter((_, idx) => idx !== i);
                setForm({ ...form, options: next, correct_answer: Math.min(form.correct_answer, next.length - 1) });
              }} className="text-[var(--text-muted)] hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          <button type="button" onClick={() => setForm({ ...form, options: [...(form.options as string[]), ""] })} className="text-xs text-primary uppercase tracking-widest hover:opacity-70 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Adicionar opção
          </button>
        </div>
      ) : (
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name={`tf-${question.id}`} checked={form.correct_answer === 1} onChange={() => setForm({ ...form, correct_answer: 1 })} />
            <span className="text-sm">Verdadeiro</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name={`tf-${question.id}`} checked={form.correct_answer === 0} onChange={() => setForm({ ...form, correct_answer: 0 })} />
            <span className="text-sm">Falso</span>
          </label>
        </div>
      )}
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Explicação (opcional)</label>
        <textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} rows={2} className={inputCls} placeholder="Mostrada ao aluno após responder" />
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Ordem</label>
        <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} className={inputCls + " max-w-[120px]"} />
      </div>
      <div className="flex items-center gap-2 pt-2">
        <button onClick={() => save.mutate()} disabled={save.isPending} className="bg-primary text-white px-5 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition flex items-center gap-2">
          <Save className="w-3.5 h-3.5" /> Salvar
        </button>
        <button onClick={() => setEditing(false)} className="text-xs uppercase tracking-widest text-primary hover:opacity-70 px-3">Cancelar</button>
        <button onClick={() => { if (confirm("Excluir pergunta?")) del.mutate(); }} className="ml-auto text-xs uppercase tracking-widest text-red-700 hover:opacity-70">Excluir</button>
      </div>
    </div>
  );
}

function NewQuestionForm({ quizId, nextOrder, onCreated }: { quizId: string; nextOrder: number; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"multiple_choice" | "true_false">("multiple_choice");
  const [text, setText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);

  const create = useMutation({
    mutationFn: () => createQuestion(quizId, {
      question_type: type,
      question_text: text,
      options: type === "true_false" ? null : options.filter(Boolean),
      correct_answer: correct,
      explanation: null,
      display_order: nextOrder,
    }),
    onSuccess: () => {
      setText(""); setOptions(["", "", "", ""]); setCorrect(0); setOpen(false);
      onCreated();
    },
  });

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="bg-primary text-white px-6 py-3 rounded-full uppercase tracking-[0.2em] text-xs font-semibold hover:bg-primary-dark transition inline-flex items-center gap-2">
        <Plus className="w-4 h-4" /> Nova pergunta
      </button>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="bg-white rounded-lg p-5 space-y-3 border border-primary/30">
      <h3 className="font-display text-lg text-primary-dark">Nova pergunta</h3>
      <select value={type} onChange={(e) => { setType(e.target.value as any); setCorrect(0); }} className={inputCls}>
        <option value="multiple_choice">Múltipla escolha</option>
        <option value="true_false">Verdadeiro / Falso</option>
      </select>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} required placeholder="Texto da pergunta" className={inputCls} />
      {type === "multiple_choice" ? (
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="new-correct" checked={correct === i} onChange={() => setCorrect(i)} />
              <input value={opt} onChange={(e) => { const next = [...options]; next[i] = e.target.value; setOptions(next); }} className={inputCls + " flex-1"} placeholder={`Opção ${i + 1}`} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="new-tf" checked={correct === 1} onChange={() => setCorrect(1)} /> Verdadeiro</label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="new-tf" checked={correct === 0} onChange={() => setCorrect(0)} /> Falso</label>
        </div>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={create.isPending || !text} className="bg-primary text-white px-6 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60">
          {create.isPending ? "Criando…" : "Criar pergunta"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs uppercase tracking-widest text-primary hover:opacity-70 px-3">Cancelar</button>
      </div>
    </form>
  );
}
