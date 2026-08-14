import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";
import { StaffGuard } from "@/components/StaffGuard";
import { ImageUploader } from "@/components/ImageUploader";
import { getSlideForAdmin, updateSlide, deleteSlide } from "@/lib/shop";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export const Route = createFileRoute("/admin/bodyoga-slides/$id")({
  head: () => ({ meta: [{ title: "Admin — Editar slide" }] }),
  component: () => (
    <StaffGuard>
      <SlideEditPage />
    </StaffGuard>
  ),
});

function SlideEditPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: slide, isLoading } = useQuery({
    queryKey: ["admin-slide", id],
    queryFn: () => getSlideForAdmin(id),
  });

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    cta_label: "",
    cta_href: "",
    image_url: "" as string,
    video_url: "" as string,
    media_href: "" as string,
    show_nav: true,
    display_order: 0,
    is_active: true,
    duration_seconds: 7,
    coupon_capture_enabled: false,
  });

  const [delOpen, setDelOpen] = useState(false);

  useEffect(() => {
    if (slide) {
      setForm({
        title: slide.title,
        subtitle: slide.subtitle ?? "",
        cta_label: slide.cta_label ?? "",
        cta_href: slide.cta_href ?? "",
        image_url: slide.image_url ?? "",
        video_url: slide.video_url ?? "",
        media_href: slide.media_href ?? "",
        show_nav: slide.show_nav ?? true,



        display_order: slide.display_order,
        is_active: slide.is_active,
        duration_seconds: slide.duration_seconds ?? 7,
        coupon_capture_enabled: slide.coupon_capture_enabled ?? false,
      });
    }
  }, [slide]);

  const save = useMutation({
    mutationFn: () =>
      updateSlide(id, {
        title: form.title,
        subtitle: form.subtitle || null,
        cta_label: form.cta_label || null,
        cta_href: form.cta_href || null,
        image_url: form.image_url || null,
        video_url: form.video_url || null,
        media_href: form.media_href || null,
        show_nav: form.show_nav,



        display_order: form.display_order,
        is_active: form.is_active,
        duration_seconds: form.duration_seconds,
        coupon_capture_enabled: form.coupon_capture_enabled,
      }),
    onSuccess: () => {
      toast.success("Slide atualizado");
      qc.invalidateQueries({ queryKey: ["admin-slides"] });
      qc.invalidateQueries({ queryKey: ["admin-slide", id] });
      qc.invalidateQueries({ queryKey: ["bodyoga-slides-active"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const del = useMutation({
    mutationFn: () => deleteSlide(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-slides"] });
      navigate({ to: "/admin/bodyoga-slides" });
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
  if (!slide) {
    return (
      <Layout>
        <section className="py-24 text-center"><p className="text-[var(--text-muted)]">Slide não encontrado.</p></section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12 md:py-20 bg-bodyoga-cream min-h-screen">
        <div className="container mx-auto px-6 max-w-2xl">
          <Link to="/admin/bodyoga-slides" className="text-xs uppercase tracking-widest text-primary hover:opacity-70 inline-flex items-center gap-1">
            <ChevronLeft className="w-3.5 h-3.5" /> Voltar
          </Link>
          <h1 className="font-display text-3xl md:text-4xl text-primary-dark mt-3 mb-6">Editar slide</h1>

          <form
            onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
            className="bg-white rounded-lg p-6 md:p-8 space-y-5 shadow-none border border-border/20"
          >
            <Field label="Título">
              <textarea required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} rows={2} className={inputCls} />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Use quebras de linha para separar o título em várias linhas.</p>
            </Field>
            <Field label="Subtítulo">
              <textarea value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} rows={3} className={inputCls} />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Texto do botão">
                <input value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} placeholder="Ex: Conhecer rituais" className={inputCls} />
              </Field>
              <Field label="Link do botão">
                <input value={form.cta_href} onChange={(e) => setForm({ ...form, cta_href: e.target.value })} placeholder="Ex: #produtos ou /loja" className={inputCls} />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Ordem">
                <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} className={inputCls} />
              </Field>
              <Field label="Duração na tela (segundos)">
                <input type="number" min={1} value={form.duration_seconds} onChange={(e) => setForm({ ...form, duration_seconds: Math.max(1, parseInt(e.target.value) || 1) })} className={inputCls} />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Tempo que este slide fica visível antes de trocar automaticamente.</p>
              </Field>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-2">Imagem de fundo do slide</label>
              <ImageUploader
                value={form.image_url || null}
                folder="slides"
                onChange={(url) => setForm({ ...form, image_url: url ?? "" })}
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-2">Imagem horizontal (paisagem) fica melhor no banner.</p>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-2">Vídeo de fundo do slide</label>
              <ImageUploader
                value={form.video_url || null}
                folder="slides"
                allowVideo
                aspectRatio="9/16"
                onChange={(url) => setForm({ ...form, video_url: url ?? "" })}
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-2">
                Faça upload de um vídeo (máx 50 MB) ou cole uma URL de embed do YouTube. Se preenchido, este slide exibe o vídeo em tela cheia (a imagem de fundo é ignorada). Deixe vazio para um slide normal.
              </p>
            </div>

            <Field label="Link da imagem/vídeo (opcional)">
              <input value={form.media_href} onChange={(e) => setForm({ ...form, media_href: e.target.value })} placeholder="Ex: /loja ou https://..." className={inputCls} />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Se preenchido, a imagem ou o vídeo deste slide ficam clicáveis e levam a este endereço.</p>
            </Field>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input type="checkbox" checked={form.show_nav} onChange={(e) => setForm({ ...form, show_nav: e.target.checked })} />
              <span className="text-sm text-primary-dark">Mostrar botões de navegação (setas e pontos) do slider</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              <span className="text-sm text-primary-dark">Ativo no banner da página BODYOGA</span>
            </label>

            <div className="rounded-lg border border-bodyoga-brown/20 bg-cream/50 p-4">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.coupon_capture_enabled}
                  onChange={(e) => setForm({ ...form, coupon_capture_enabled: e.target.checked })}
                  className="mt-1"
                />
                <div>
                  <span className="block text-sm text-primary-dark font-medium">Botão vira captura de cupom por email</span>
                  <span className="block text-xs text-primary-dark/60 mt-0.5">
                    Ao ativar, clicar no botão deste slide abre um modal pedindo o email da visitante e envia um cupom de desconto único.
                    Configure a porcentagem e a mensagem em <strong>Configurações → Integrações → Cupom de boas-vindas</strong>.
                  </span>
                </div>
              </label>
            </div>


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
              title="Excluir slide?"
              description="Esta ação não pode ser desfeita."
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
