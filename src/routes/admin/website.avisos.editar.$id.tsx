import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { getNotice, createNotice, updateNotice, type SiteNotice } from "@/lib/notices";
import { ImageUploader } from "@/components/ImageUploader";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/website/avisos/editar/$id")({
  head: () => ({ meta: [{ title: "Admin — Editar Aviso" }] }),
  component: () => <NoticeEditorPage />,
});

function NoticeEditorPage() {
  const { id } = useParams({ from: "/admin/website/avisos/editar/$id" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = id === "novo";

  const { data: notice, isLoading } = useQuery({
    queryKey: ["site_notice", id],
    queryFn: () => getNotice(id),
    enabled: !isNew
  });

  const [formData, setFormData] = useState<Partial<SiteNotice>>({
    title: "",
    content: "",
    image_url: null,
    cta_label: "",
    cta_href: "",
    active: false,
    pages: ["all"],
    delay_seconds: 3,
    frequency: "once_session",
    capture_lead: false,
    form_title: "",
    fields_name: true,
    fields_email: true,
    fields_phone: false,
    success_message: "Recebemos seus dados. Em breve entramos em contato! 💛"
  });

  useEffect(() => {
    if (notice) {
      setFormData(notice);
    }
  }, [notice]);

  const save = useMutation({
    mutationFn: async () => {
      if (isNew) {
        return createNotice(formData);
      } else {
        return updateNotice(id, formData);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_notices"] });
      toast.success(isNew ? "Aviso criado" : "Aviso atualizado");
      navigate({ to: "/admin/website/avisos" });
    },
    onError: (e: Error) => toast.error(e.message)
  });

  if (!isNew && isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const handleChange = (field: keyof SiteNotice, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-background min-h-[70vh] pb-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin/website/avisos" className="text-primary hover:text-primary-dark transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-3xl text-primary-dark">
            {isNew ? "Novo Aviso" : "Editar Aviso"}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary-dark/60 mb-2">Conteúdo</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-primary-dark mb-1 block">Título do Aviso</label>
                  <Input 
                    value={formData.title} 
                    onChange={e => handleChange("title", e.target.value)} 
                    placeholder="Ex: Promoção de Primavera 🌸"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-primary-dark mb-1 block">Texto (opcional)</label>
                  <Textarea 
                    value={formData.content || ""} 
                    onChange={e => handleChange("content", e.target.value)} 
                    placeholder="Descrição do aviso..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-primary-dark mb-1 block">Imagem (opcional)</label>
                  <ImageUploader 
                    value={formData.image_url || null} 
                    onChange={url => handleChange("image_url", url)} 
                    aspectRatio="16/9"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-primary-dark mb-1 block">Label do Botão</label>
                    <Input 
                      value={formData.cta_label || ""} 
                      onChange={e => handleChange("cta_label", e.target.value)} 
                      placeholder="Ex: Ver Ofertas"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-primary-dark mb-1 block">Link do Botão</label>
                    <Input 
                      value={formData.cta_href || ""} 
                      onChange={e => handleChange("cta_href", e.target.value)} 
                      placeholder="Ex: /loja"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary-dark/60">Captação de Leads</h2>
                <Switch 
                  checked={formData.capture_lead} 
                  onCheckedChange={val => handleChange("capture_lead", val)} 
                />
              </div>
              
              {formData.capture_lead && (
                <div className="space-y-4 pt-2 border-t border-border mt-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-primary-dark mb-1 block">Título do Formulário</label>
                    <Input 
                      value={formData.form_title || ""} 
                      onChange={e => handleChange("form_title", e.target.value)} 
                      placeholder="Ex: Ganhe 10% no primeiro pedido"
                    />
                  </div>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Switch checked={formData.fields_name} onCheckedChange={v => handleChange("fields_name", v)} />
                      <span className="text-xs text-primary-dark">Nome</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Switch checked={formData.fields_email} onCheckedChange={v => handleChange("fields_email", v)} />
                      <span className="text-xs text-primary-dark">Email</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Switch checked={formData.fields_phone} onCheckedChange={v => handleChange("fields_phone", v)} />
                      <span className="text-xs text-primary-dark">Telefone</span>
                    </label>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-primary-dark mb-1 block">Mensagem de Sucesso</label>
                    <Input 
                      value={formData.success_message || ""} 
                      onChange={e => handleChange("success_message", e.target.value)} 
                    />
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary-dark/60">Exibição</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-primary-dark">Aviso Ativo</span>
                  <Switch 
                    checked={formData.active} 
                    onCheckedChange={v => handleChange("active", v)} 
                  />
                </div>
                
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-primary-dark mb-1 block">Atraso (segundos)</label>
                  <Input 
                    type="number" 
                    value={formData.delay_seconds} 
                    onChange={e => handleChange("delay_seconds", parseInt(e.target.value) || 0)} 
                  />
                </div>
                
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-primary-dark mb-1 block">Frequência</label>
                  <select 
                    className="w-full border border-border rounded-md px-3 py-2 text-sm"
                    value={formData.frequency}
                    onChange={e => handleChange("frequency", e.target.value)}
                  >
                    <option value="once_session">Uma vez por sessão</option>
                    <option value="once_day">Uma vez por dia</option>
                    <option value="always">Sempre</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-primary-dark mb-1 block">Páginas (comma separated)</label>
                  <Input 
                    value={formData.pages?.join(", ") || "all"} 
                    onChange={e => handleChange("pages", e.target.value.split(",").map(s => s.trim()))}
                    placeholder="all ou /, /loja"
                  />
                  <p className="text-[10px] text-primary-dark/40 mt-1">'all' para todas as páginas</p>
                </div>
              </div>

              <div className="pt-6">
                <Button 
                  onClick={() => save.mutate()} 
                  className="w-full bg-primary hover:bg-primary-dark text-white rounded-full flex items-center justify-center gap-2"
                  disabled={save.isPending || !formData.title}
                >
                  {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isNew ? "Criar Aviso" : "Salvar Alterações"}
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
