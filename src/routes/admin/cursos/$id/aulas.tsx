import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { GripVertical, Plus, Pencil, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";
import { StaffGuard } from "@/components/StaffGuard";
import { getCourseForAdmin, listLessonsForAdmin, createLesson, updateLesson, deleteLesson, extractYouTubeId, type LessonAdmin } from "@/lib/admin";
import { listModulesByCourse, createModule, updateModule, deleteModule, type Module } from "@/lib/modules";

export const Route = createFileRoute("/admin/cursos/$id/aulas")({
  head: () => ({ meta: [{ title: "Admin — Aulas" }] }),
  component: () => (
    <StaffGuard>
      <CourseLessonsPage />
    </StaffGuard>
  ),
});

const inputCls = "w-full border border-border rounded-md px-3 py-2 bg-white text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary text-sm";

function CourseLessonsPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data: course } = useQuery({
    queryKey: ["admin-course", id],
    queryFn: () => getCourseForAdmin(id),
  });

  const { data: lessons, isLoading } = useQuery({
    queryKey: ["admin-lessons", id],
    queryFn: () => listLessonsForAdmin(id),
  });

  const { data: modules } = useQuery({
    queryKey: ["admin-modules", id],
    queryFn: () => listModulesByCourse(id),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-lessons", id] });
  const invalidateModules = () => qc.invalidateQueries({ queryKey: ["admin-modules", id] });
  const nextOrder = (lessons?.reduce((m, l) => Math.max(m, l.display_order), 0) ?? 0) + 1;
  const nextModuleOrder = (modules?.reduce((m, x) => Math.max(m, x.display_order), 0) ?? 0) + 1;

  return (
    <Layout>
      <section className="py-12 md:py-20 bg-bodyoga-cream min-h-screen">
        <div className="container mx-auto px-6 max-w-4xl">
          <Link to="/admin/cursos" className="text-xs uppercase tracking-widest text-primary hover:opacity-70">← Voltar</Link>
          <h1 className="font-display text-3xl md:text-4xl text-primary-dark mt-3">{course?.title ?? "—"}</h1>
          <p className="text-[var(--text-muted)] text-sm mb-6">Gerencie os módulos e as aulas deste curso</p>

          {/* Módulos */}
          <div className="mb-10">
            <h2 className="font-display text-xl text-primary-dark mb-3">Módulos</h2>
            <div className="space-y-2 mb-3">
              {(modules ?? []).map((m, i) => (
                <ModuleRow
                  key={m.id}
                  module={m}
                  index={i}
                  total={modules?.length ?? 0}
                  onChanged={() => { invalidateModules(); invalidate(); }}
                />
              ))}
              {(modules?.length ?? 0) === 0 && (
                <p className="text-[var(--text-muted)] text-sm bg-white rounded-lg p-4 shadow-none border border-border/20">
                  Nenhum módulo ainda. Aulas sem módulo aparecem agrupadas como "Outras aulas" no curso.
                </p>
              )}
            </div>
            <NewModuleForm courseId={id} nextOrder={nextModuleOrder} onCreated={invalidateModules} />
          </div>

          <h2 className="font-display text-xl text-primary-dark mb-3">Aulas</h2>
          {isLoading && <p className="text-[var(--text-muted)]">Carregando aulas…</p>}

          <div className="space-y-3 mb-6">
            {(lessons ?? []).map((l) => (
              <LessonRow key={l.id} lesson={l} modules={modules ?? []} onChanged={invalidate} />
            ))}
            {(lessons?.length ?? 0) === 0 && !isLoading && (
              <p className="text-[var(--text-muted)] text-sm">Nenhuma aula ainda. Adicione a primeira abaixo.</p>
            )}
          </div>

          <NewLessonForm courseId={id} nextOrder={nextOrder} modules={modules ?? []} onCreated={invalidate} />
        </div>
      </section>
    </Layout>
  );
}

function ModuleRow({ module: m, index, total, onChanged }: { module: Module; index: number; total: number; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(m.title);

  const save = useMutation({
    mutationFn: () => updateModule(m.id, { title }),
    onSuccess: () => { setEditing(false); onChanged(); },
  });

  const move = useMutation({
    mutationFn: (dir: -1 | 1) => updateModule(m.id, { display_order: m.display_order + dir }),
    onSuccess: onChanged,
  });

  const del = useMutation({
    mutationFn: () => deleteModule(m.id),
    onSuccess: onChanged,
  });

  return (
    <div className="bg-white rounded-lg p-3 flex items-center gap-2 shadow-none border border-border/20">
      <GripVertical className="w-4 h-4 text-primary-dark/30 shrink-0" />
      {editing ? (
        <>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="flex-1 border border-border rounded-md px-2 py-1 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button onClick={() => save.mutate()} disabled={save.isPending} className="text-xs uppercase tracking-widest text-primary hover:opacity-70 px-2">
            Salvar
          </button>
          <button onClick={() => { setTitle(m.title); setEditing(false); }} className="text-xs uppercase tracking-widest text-primary-dark/60 hover:opacity-70 px-2">
            Cancelar
          </button>
        </>
      ) : (
        <>
          <span className="text-xs text-[var(--text-muted)] font-mono">{String(m.display_order).padStart(2, "0")}</span>
          <span className="flex-1 text-sm text-primary-dark font-medium truncate">{m.title}</span>
          <button onClick={() => move.mutate(-1)} disabled={index === 0} className="text-primary-dark/40 hover:text-primary-dark disabled:opacity-30 px-1" aria-label="Subir">↑</button>
          <button onClick={() => move.mutate(1)} disabled={index === total - 1} className="text-primary-dark/40 hover:text-primary-dark disabled:opacity-30 px-1" aria-label="Descer">↓</button>
          <button onClick={() => setEditing(true)} className="text-primary-dark/40 hover:text-primary px-1" aria-label="Editar">
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => { if (confirm("Apagar módulo? Aulas dele ficam sem módulo.")) del.mutate(); }}
            className="text-red-600/60 hover:text-red-700 px-1"
            aria-label="Apagar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}

function NewModuleForm({ courseId, nextOrder, onCreated }: { courseId: string; nextOrder: number; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const create = useMutation({
    mutationFn: () => createModule({ course_id: courseId, title, display_order: nextOrder }),
    onSuccess: () => { setTitle(""); setOpen(false); onCreated(); },
  });
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-primary hover:opacity-70">
        <Plus className="w-4 h-4" /> Adicionar módulo
      </button>
    );
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (title.trim()) create.mutate(); }} className="bg-white rounded-lg p-3 flex gap-2 items-center shadow-none border border-border/20">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do módulo" autoFocus
        className="flex-1 border border-border rounded-md px-3 py-1.5 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      <button type="submit" disabled={create.isPending || !title.trim()} className="bg-primary text-white px-4 py-1.5 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60">
        {create.isPending ? "..." : "Criar"}
      </button>
      <button type="button" onClick={() => { setTitle(""); setOpen(false); }} className="text-xs uppercase tracking-widest text-primary-dark/60 hover:opacity-70 px-2">
        Cancelar
      </button>
    </form>
  );
}

function LessonRow({ lesson, modules, onChanged }: { lesson: LessonAdmin; modules: Module[]; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<LessonAdmin>(lesson);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = useMutation({
    mutationFn: () => updateLesson(lesson.id, {
      title: form.title,
      slug: form.slug,
      description: form.description,
      youtube_id: extractYouTubeId(form.youtube_id ?? ""),
      content_md: form.content_md,
      duration_min: form.duration_min,
      display_order: form.display_order,
      is_free_preview: form.is_free_preview,
      module_id: form.module_id,
    }),
    onSuccess: () => { setEditing(false); onChanged(); },
  });

  const del = useMutation({
    mutationFn: () => deleteLesson(lesson.id),
    onSuccess: onChanged,
  });

  const moduleTitle = modules.find((m) => m.id === lesson.module_id)?.title;

  if (!editing) {
    return (
      <div className="bg-white rounded-lg p-4 flex items-center gap-4 shadow-none border border-border/20">
        <span className="text-xs text-[var(--text-muted)] font-mono w-8">
          {String(lesson.display_order).padStart(2, "0")}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base text-primary-dark truncate">{lesson.title}</h3>
          <p className="text-xs text-[var(--text-muted)] truncate">
            {moduleTitle ? `${moduleTitle} · ` : ""}YouTube: {lesson.youtube_id ?? "(não definido)"} {lesson.duration_min ? `· ${lesson.duration_min} min` : ""}
          </p>
        </div>
        {lesson.is_free_preview && <span className="text-[10px] uppercase tracking-widest text-primary-dark">Prévia</span>}
        <Link
          to="/admin/cursos/$id/aulas/$lessonId/quiz"
          params={{ id: lesson.course_id, lessonId: lesson.id }}
          className="text-xs uppercase tracking-widest text-primary hover:opacity-70"
        >
          Quiz
        </Link>
        <button onClick={() => setEditing(true)} className="text-xs uppercase tracking-widest text-primary hover:opacity-70">Editar</button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-5 space-y-3 border border-border/20 shadow-none">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Título</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Slug</label>
          <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">YouTube (URL ou ID)</label>
        <input value={form.youtube_id ?? ""} onChange={(e) => setForm({ ...form, youtube_id: e.target.value })} className={inputCls} placeholder="https://youtu.be/... ou dQw4w9WgXcQ" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Duração (min)</label>
          <input type="number" value={form.duration_min ?? ""} onChange={(e) => setForm({ ...form, duration_min: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Ordem</label>
          <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} className={inputCls} />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-xs text-primary-dark cursor-pointer">
            <input type="checkbox" checked={form.is_free_preview} onChange={(e) => setForm({ ...form, is_free_preview: e.target.checked })} />
            Prévia gratuita
          </label>
        </div>
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Módulo</label>
        <select
          value={form.module_id ?? ""}
          onChange={(e) => setForm({ ...form, module_id: e.target.value || null })}
          className={inputCls}
        >
          <option value="">Sem módulo</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Descrição</label>
        <textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={inputCls} />
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Conteúdo (markdown)</label>
        <textarea value={form.content_md ?? ""} onChange={(e) => setForm({ ...form, content_md: e.target.value })} rows={4} className={inputCls} />
      </div>
      {save.error && <p className="text-red-700 text-sm">{(save.error as Error).message}</p>}
      <div className="flex items-center gap-2">
        <button onClick={() => save.mutate()} disabled={save.isPending} className="bg-primary text-white px-5 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60">
          {save.isPending ? "Salvando…" : "Salvar"}
        </button>
        <button onClick={() => { setForm(lesson); setEditing(false); }} className="text-xs uppercase tracking-widest text-primary hover:opacity-70 px-3">
          Cancelar
        </button>
        <button
          onClick={() => confirmDelete ? del.mutate() : setConfirmDelete(true)}
          className={`ml-auto text-xs uppercase tracking-widest px-3 ${confirmDelete ? "text-red-700 font-semibold" : "text-[var(--text-muted)]"} hover:opacity-70`}
        >
          {confirmDelete ? "Confirma deletar?" : "Deletar"}
        </button>
      </div>
    </div>
  );
}

function NewLessonForm({ courseId, nextOrder, modules, onCreated }: { courseId: string; nextOrder: number; modules: Module[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [youtubeInput, setYoutubeInput] = useState("");
  const [duration, setDuration] = useState<number | "">("");
  const [moduleId, setModuleId] = useState<string>("");

  const create = useMutation({
    mutationFn: async () => {
      const slug = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || `aula-${nextOrder}`;
      await createLesson({
        course_id: courseId,
        module_id: moduleId || null,
        slug,
        title,
        description: null,
        youtube_id: extractYouTubeId(youtubeInput),
        content_md: null,
        duration_min: duration === "" ? null : Number(duration),
        display_order: nextOrder,
        is_free_preview: false,
      });
    },
    onSuccess: () => {
      setTitle(""); setYoutubeInput(""); setDuration(""); setModuleId(""); setOpen(false);
      onCreated();
    },
  });

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="bg-primary text-white px-6 py-3 rounded-full uppercase tracking-[0.2em] text-xs font-semibold hover:bg-primary-dark transition">
        + Adicionar aula
      </button>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="bg-white rounded-lg p-5 space-y-3 border border-border/20 shadow-none">
      <h3 className="font-display text-lg text-primary-dark">Nova aula</h3>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da aula" required className={inputCls} />
      <input value={youtubeInput} onChange={(e) => setYoutubeInput(e.target.value)} placeholder="URL ou ID do YouTube" className={inputCls} />
      <input type="number" value={duration} onChange={(e) => setDuration(e.target.value === "" ? "" : parseInt(e.target.value))} placeholder="Duração em minutos" className={inputCls} />
      <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className={inputCls}>
        <option value="">Sem módulo</option>
        {modules.map((m) => (
          <option key={m.id} value={m.id}>{m.title}</option>
        ))}
      </select>
      {create.error && <p className="text-red-700 text-sm">{(create.error as Error).message}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={create.isPending || !title} className="bg-primary text-white px-6 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60">
          {create.isPending ? "Criando…" : "Criar aula"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs uppercase tracking-widest text-primary hover:opacity-70 px-3">Cancelar</button>
      </div>
    </form>
  );
}
