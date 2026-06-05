import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Send,
  Mail,
  Users,
  GraduationCap,
  ShoppingBag,
  History,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import {
  listBroadcasts,
  countRecipients,
  createBroadcast,
  sendBroadcastTest,
  sendBroadcastReal,
  type Broadcast,
} from "@/lib/broadcasts";
import { listAllCourses } from "@/lib/admin";
import { listAllProductsForAdmin } from "@/lib/shop";

export const Route = createFileRoute("/admin/broadcast")({
  head: () => ({ meta: [{ title: "Admin — Broadcast" }] }),
  component: () => (
    <AdminGuard>
      <BroadcastPage />
    </AdminGuard>
  ),
});

type SegmentType = Broadcast["segment_type"];

const SEGMENTS: { id: SegmentType; label: string; icon: any; needsId: "course" | "product" | null }[] = [
  { id: "newsletter", label: "Newsletter ativa", icon: Mail, needsId: null },
  { id: "all_students", label: "Todas as alunas matriculadas", icon: GraduationCap, needsId: null },
  { id: "course_enrolled", label: "Alunas de um curso específico", icon: GraduationCap, needsId: "course" },
  { id: "all_customers", label: "Todas as clientes da loja", icon: ShoppingBag, needsId: null },
  { id: "product_buyers", label: "Quem comprou um produto", icon: ShoppingBag, needsId: "product" },
];

function StatusPill({ status }: { status: Broadcast["status"] }) {
  const map = {
    draft: { label: "Rascunho", cls: "bg-cream text-primary-dark/60" },
    sending: { label: "Enviando", cls: "bg-peach/40 text-primary-dark" },
    sent: { label: "Enviado", cls: "bg-primary/10 text-primary" },
    failed: { label: "Falhou", cls: "bg-red-100 text-red-700" },
  } as const;
  const m = map[status];
  return (
    <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${m.cls}`}>
      {m.label}
    </span>
  );
}

function BroadcastPage() {
  const qc = useQueryClient();

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [segment, setSegment] = useState<SegmentType>("newsletter");
  const [segmentId, setSegmentId] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [confirmReal, setConfirmReal] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const seg = SEGMENTS.find((s) => s.id === segment)!;
  const needsId = seg.needsId;

  const { data: courses } = useQuery({ queryKey: ["all-courses"], queryFn: listAllCourses, enabled: needsId === "course" });
  const { data: products } = useQuery({ queryKey: ["all-products"], queryFn: listAllProductsForAdmin, enabled: needsId === "product" });

  useEffect(() => {
    setSegmentId(null);
  }, [segment]);

  const { data: recipientCount } = useQuery({
    queryKey: ["recipient-count", segment, segmentId],
    queryFn: () => countRecipients(segment, segmentId),
    enabled: !needsId || !!segmentId,
  });

  const { data: history } = useQuery({ queryKey: ["broadcasts"], queryFn: listBroadcasts });

  const segmentLabel =
    needsId === "course"
      ? (courses ?? []).find((c) => c.id === segmentId)?.title ?? null
      : needsId === "product"
      ? (products ?? []).find((p) => p.id === segmentId)?.name ?? null
      : seg.label;

  const sendTest = useMutation({
    mutationFn: async () => {
      const created = await createBroadcast({ subject, body_html: body, segment_type: segment, segment_id: segmentId, segment_label: segmentLabel });
      await sendBroadcastTest(created.id, testEmail);
    },
    onSuccess: () => setFeedback({ kind: "ok", text: `Email de teste enviado pra ${testEmail}. Confere a caixa!` }),
    onError: (e: any) => setFeedback({ kind: "err", text: e.message }),
  });

  const sendReal = useMutation({
    mutationFn: async () => {
      const created = await createBroadcast({ subject, body_html: body, segment_type: segment, segment_id: segmentId, segment_label: segmentLabel });
      await sendBroadcastReal(created.id);
    },
    onSuccess: () => {
      setFeedback({ kind: "ok", text: "Envio disparado. Acompanhe o status na lista abaixo." });
      setSubject("");
      setBody("");
      setConfirmReal(false);
      qc.invalidateQueries({ queryKey: ["broadcasts"] });
    },
    onError: (e: any) => setFeedback({ kind: "err", text: e.message }),
  });

  const canCompose = subject.trim().length > 2 && body.trim().length > 10 && (!needsId || !!segmentId);

  const inputCls =
    "w-full border border-border rounded-md px-3 py-2 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary";
  const labelCls = "block text-[10px] uppercase tracking-widest text-primary-dark mb-1";

  return (
    <Layout>
      <section className="py-12 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-2">
            <Send className="w-6 h-6 text-primary" />
            <h1 className="font-display text-3xl md:text-4xl text-primary-dark">Broadcast</h1>
          </div>
          <p className="text-sm text-primary-dark/60 mb-8">
            Envie email pra um segmento. Sempre faça um teste antes do envio real. Use{" "}
            <code className="bg-white px-1 rounded">{"{{first_name}}"}</code> no corpo pra personalizar.
          </p>

          {feedback && (
            <div
              className={`flex items-start gap-2 rounded-md px-4 py-3 mb-6 text-sm ${
                feedback.kind === "ok" ? "bg-primary/10 text-primary" : "bg-red-100 text-red-700"
              }`}
            >
              {feedback.kind === "ok" ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
              <p>{feedback.text}</p>
            </div>
          )}

          {/* COMPOSE */}
          <div className="bg-white rounded-xl p-6 space-y-5 shadow-sm">
            <div>
              <label className={labelCls}>Segmento</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SEGMENTS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSegment(s.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm text-left transition ${
                        segment === s.id
                          ? "border-primary bg-primary/5 text-primary-dark"
                          : "border-border text-primary-dark/70 hover:border-primary/40"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {needsId === "course" && (
              <div>
                <label className={labelCls}>Curso</label>
                <select
                  value={segmentId ?? ""}
                  onChange={(e) => setSegmentId(e.target.value || null)}
                  className={inputCls}
                >
                  <option value="">Selecione…</option>
                  {(courses ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {needsId === "product" && (
              <div>
                <label className={labelCls}>Produto</label>
                <select
                  value={segmentId ?? ""}
                  onChange={(e) => setSegmentId(e.target.value || null)}
                  className={inputCls}
                >
                  <option value="">Selecione…</option>
                  {(products ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-primary-dark/70">
              <Users className="w-4 h-4" />
              <span>
                {recipientCount !== undefined
                  ? `${recipientCount} destinatário${recipientCount === 1 ? "" : "s"}`
                  : "Calculando…"}
              </span>
            </div>

            <div>
              <label className={labelCls}>Assunto</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Corpo (HTML simples)</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                placeholder={"<h2>Olá {{first_name}}!</h2>\n<p>Hoje quero te contar sobre…</p>"}
                className={`${inputCls} font-mono`}
              />
              <p className="text-xs text-primary-dark/50 mt-1">
                Tags suportadas: h1-h3, p, a, strong, em, br. Use {"{{first_name}}"} pra personalizar.
              </p>
            </div>

            {/* TESTE */}
            <div className="border-t border-border pt-4">
              <label className={labelCls}>Email pra teste</label>
              <div className="flex gap-2">
                <input
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className={`flex-1 ${inputCls}`}
                />
                <button
                  type="button"
                  onClick={() => sendTest.mutate()}
                  disabled={!canCompose || !testEmail || sendTest.isPending}
                  className="inline-flex items-center gap-1.5 border border-primary text-primary px-4 py-2 rounded-md text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition disabled:opacity-50"
                >
                  {sendTest.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  Enviar teste
                </button>
              </div>
            </div>

            {/* ENVIO REAL */}
            <div className="pt-2">
              {!confirmReal ? (
                <button
                  type="button"
                  onClick={() => setConfirmReal(true)}
                  disabled={!canCompose || (recipientCount ?? 0) === 0}
                  className="w-full bg-primary text-white px-6 py-3 rounded-full uppercase tracking-[0.2em] text-xs font-semibold hover:bg-primary-dark transition disabled:opacity-50"
                >
                  Enviar pra {recipientCount ?? 0} pessoa{(recipientCount ?? 0) === 1 ? "" : "s"}
                </button>
              ) : (
                <div className="border border-primary/30 rounded-md p-4 bg-primary/5">
                  <p className="text-sm text-primary-dark mb-3">
                    Vai disparar {recipientCount} email{(recipientCount ?? 0) === 1 ? "" : "s"} agora. Confirma?
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => sendReal.mutate()}
                      disabled={sendReal.isPending}
                      className="bg-primary text-white px-5 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {sendReal.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Sim, enviar agora
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReal(false)}
                      className="text-xs uppercase tracking-widest text-primary-dark/60 hover:opacity-70 px-3"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* HISTÓRICO */}
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl text-primary-dark">Enviados anteriormente</h2>
            </div>
            <div className="space-y-2">
              {(history ?? []).map((b) => (
                <div key={b.id} className="bg-white rounded-lg p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-primary-dark truncate">{b.subject}</p>
                      <StatusPill status={b.status} />
                    </div>
                    <p className="text-xs text-primary-dark/50 mt-0.5">
                      {b.segment_label ?? b.segment_type} ·{" "}
                      {b.sent_at ? new Date(b.sent_at).toLocaleString("pt-BR") : "—"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-primary-dark">{b.sent_count} enviados</p>
                    {b.failed_count > 0 && <p className="text-xs text-red-600">{b.failed_count} falhas</p>}
                  </div>
                </div>
              ))}
              {(history?.length ?? 0) === 0 && (
                <p className="text-sm text-primary-dark/50">Nenhum broadcast ainda.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
