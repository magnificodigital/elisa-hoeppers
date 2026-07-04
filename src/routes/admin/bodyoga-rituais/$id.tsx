import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";
import { StaffGuard } from "@/components/StaffGuard";
import { ImageUploader } from "@/components/ImageUploader";
import { getRitualForAdmin, updateRitual, deleteRitual } from "@/lib/shop";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export const Route = createFileRoute("/admin/bodyoga-rituais/$id")({
  head: () => ({ meta: [{ title: "Admin — Editar ritual" }] }),
  component: () => (
    <StaffGuard>
      <RitualEditPage />
    </StaffGuard>
  ),
});

function RitualEditPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: ritual, isLoading } = useQuery({
    queryKey: ["admin-ritual", id],
    queryFn: () => getRitualForAdmin(id),
  });

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    image_url: "" as string,
    display_order: 0,
    is_active: true,
  });
  const [delOpen, setDelOpen] = useState(false);

  useEffect(() => {
    if (ritual) {
      setForm({
        title: ritual.title,
        slug: ritual.slug,
        description: ritual.description ?? "",
        image_url: ritual.image_url ?? "",
        display_order: ritual.display_order,
        is_active: ritual.is_active,
      });
    }
  }, [ritual]);

  const save = useMutation({
    mutationFn: () =>
      updateRitual(id, {
        title: form.title,
        slug: form.slug,
        description: form.description || null,
        image_url: form.image_url || null,
        display_order: form.display_order,
        is_active: form.is_active,
      }),
    onSuccess: () => {
      toast.success("Ritual atualizado");
      qc.invalidateQueries({ queryKey: ["admin-rituals"] });
      qc.invalidateQueries({ queryKey: ["admin-ritual", id] });
      qc.invalidateQueries({ queryKey: ["bodyoga-rituals-active"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const del = useMutation({
    mutationFn: () => deleteRitual(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-rituals"] });
      navigate({ to: "/admin/bodyoga-rituais" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <Layout>
        <section className="py-24 text-center"><p className="text-[var(--text-muted)]">Carregando…</p></section>
      </Layout>
    );
  }
  if (!ritual) {
    return (
      <Layout>
        <section className="py-24 text-center"><p className="text-[var(--text-muted)]">Ritual não encontrado.</p></section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12 md:py-20 bg-[var(--surface-cream)] min-h-screen">
        <div className="container mx-auto px-6 max-w-2xl">
          <Link to="/admin/bodyoga-rituais" className="text-xs uppercase tracking-widest text-primary hover:opacity-70 inline-flex items-center gap-1">
            <ChevronLeft className="w-3.5 h-3.5" /> Voltar
          </Link>
          <h1 className="font-display text-3xl md:text-4xl text-primary-dark mt-3 mb-6">Editar ritual</h1>

          <form
            onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
            className="bg-white rounded-lg p-6 md:p-8 space-y-5"
          >
            <Field label="Título">
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Slug (URL)">
              <input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Descrição">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputCls} />
            </Field>

            <Field label="Ordem">
              <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} className={inputCls} />
            </Field>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-2">Imagem do ritual</label>
              <ImageUploader
                value={form.image_url || null}
                folder="rituals"
                onChange={(url) => setForm({ ...form, image_url: url ?? "" })}
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-2">Imagem vertical (retrato) fica melhor.</p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              <span className="text-sm text-primary-dark">Ativo na página BODYOGA</span>
            </label>

            {save.error && <p className="text-red-700 text-sm">{(save.error as Error).message}</p>}

            <div className="flex items-center gap-3 pt-3 border-t border-border">
              <button type="submit" disabled={save.isPending}
                className="bg-primary text-white px-8 py-3 rounded-full uppercase tracking-[0.2em] text-xs font-semibold hover:bg-primary-dark transition disabled:opacity-60">
                {save.isPending ? "Salvando…" : "Salvar"}
              </button>
              <button
                type="button"
                onClick={() => setDelOpen(true)}
                className="ml-auto text-xs uppercase tracking-widest text-red-700 hover:opacity-70 inline-flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </button>
            </div>
            <ConfirmDialog
              open={delOpen}
              onOpenChange={setDelOpen}
              title="Excluir ritual?"
              description="Os produtos vinculados ficarão sem ritual. Esta ação não pode ser desfeita."
              confirmLabel="Sim, excluir"
              variant="destructive"
              onConfirm={() => del.mutate()}
            />
          </form>
        </div>
      </section>
    </Layout>
  );
}

const inputCls = "w-full border border-border rounded-md px-3 py-2.5 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">{label}</label>
      {children}
    </div>
  );
}
