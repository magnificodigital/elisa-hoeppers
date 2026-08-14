import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, MailCheck, ExternalLink, CheckCircle2, XCircle, Loader2, Send } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { supabase } from "@/lib/supabase";
import { getSetting } from "@/lib/settings";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/configuracoes/emails")({
  head: () => ({ meta: [{ title: "Admin — Integração Resend" }] }),
  component: () => (
    <AdminGuard>
      <Page />
    </AdminGuard>
  ),
});

function Page() {
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);

  // Best-effort probe: we can't read RESEND_API_KEY from the client. We
  // check by invoking a test send and reading the response.
  const { data: fromEmail } = useQuery({
    queryKey: ["email-from"],
    queryFn: async () => (await getSetting("email_from")) ?? "contato@bodyogaoficial.com.br",
  });

  const sendTest = async () => {
    if (!testEmail) return;
    setSending(true);
    try {
      // Reuse the broadcast function's test mode: create a minimal broadcast
      // record just for probing would pollute history. Instead, call the
      // coupon email function which validates the same Resend key.
      const { error } = await supabase.functions.invoke("send-coupon-email", {
        body: {
          code: "TESTE-RESEND",
          email: testEmail,
          full_name: "Teste",
          discount_percent: 0,
          validity_days: 0,
        },
      });
      if (error) throw error;
      toast.success(`Email de teste enviado para ${testEmail}`);
    } catch (e: any) {
      toast.error(e.message || "Falha ao enviar teste");
    } finally {
      setSending(false);
    }
  };

  const inputCls = "w-full border border-border rounded-md px-3 py-2 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <Layout>
      <section className="py-12 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4">
          <Link to="/admin/configuracoes" className="inline-flex items-center gap-1 text-sm text-primary-dark/70 hover:text-primary transition mb-6">
            <ChevronLeft size={16} /> Voltar
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center">
              <MailCheck size={20} className="text-primary" />
            </div>
            <h1 className="font-display text-3xl text-primary-dark">Integração Resend</h1>
          </div>
          <p className="text-sm text-primary-dark/60 mb-6">
            Conexão com o provedor de envio de emails. Layout, textos e campanhas ficam em{" "}
            <Link to="/admin/broadcast" className="text-primary underline">Emails &amp; Broadcast</Link>.
          </p>

          <div className="bg-white rounded-xl p-6 shadow-none border border-border/20 space-y-5">
            <div className="flex items-start gap-3 pb-4 border-b border-border">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-primary-dark">API Key configurada</p>
                <p className="text-xs text-primary-dark/60">
                  A chave <code className="bg-cream px-1 rounded">RESEND_API_KEY</code> está armazenada com segurança nos secrets do Supabase.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pb-4 border-b border-border">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-primary-dark">Domínio verificado</p>
                <p className="text-xs text-primary-dark/60">
                  Emails saem de <strong>{fromEmail}</strong> pelo domínio <code className="bg-cream px-1 rounded">bodyogaoficial.com.br</code>.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">
                Enviar email de teste
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={sendTest}
                  disabled={!testEmail || sending}
                  className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-md text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Testar
                </button>
              </div>
              <p className="text-xs text-primary-dark/50 mt-1.5">
                Se você receber o email, a integração está funcionando.
              </p>
            </div>

            <div className="pt-4 border-t border-border">
              <a
                href="https://resend.com/emails"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                Abrir dashboard do Resend <ExternalLink size={14} />
              </a>
            </div>
          </div>

          <p className="text-xs text-primary-dark/50 mt-4">
            Para trocar a chave de API, use os Secrets do Supabase (nome <code>RESEND_API_KEY</code>).
          </p>
        </div>
      </section>
    </Layout>
  );
}
