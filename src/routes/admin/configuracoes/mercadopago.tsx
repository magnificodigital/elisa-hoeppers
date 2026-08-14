import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, CreditCard, Eye, EyeOff, Save } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { SettingsCategory } from "@/components/admin/SettingsCategory";
import { listSettings } from "@/lib/settings";
import { getPaymentSecret, setPaymentSecret, maskSecret, detectEnv } from "@/lib/payment-secrets";

export const Route = createFileRoute("/admin/configuracoes/mercadopago")({
  head: () => ({ meta: [{ title: "Admin — Mercado Pago" }] }),
  component: () => (
    <AdminGuard>
      <Page />
    </AdminGuard>
  ),
});

function EnvBadge({ env }: { env: ReturnType<typeof detectEnv> }) {
  if (env === "producao")
    return <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-medium">🟢 Produção</span>;
  if (env === "teste")
    return <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-medium">🟡 Teste (pagamentos fake)</span>;
  return <span className="text-xs px-3 py-1 rounded-full bg-neutral-200 text-neutral-700 font-medium">⚪ Public Key inválida</span>;
}

function AccessTokenCard({ publicKey }: { publicKey: string }) {
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: current, isLoading } = useQuery({
    queryKey: ["payment-secret", "mp_access_token"],
    queryFn: () => getPaymentSecret("mp_access_token"),
  });

  const save = useMutation({
    mutationFn: () => setPaymentSecret("mp_access_token", input),
    onSuccess: () => {
      toast.success("Access Token salvo com segurança");
      setInput("");
      setShow(false);
      qc.invalidateQueries({ queryKey: ["payment-secret", "mp_access_token"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSave() {
    setError(null);
    const value = input.trim();
    if (!value) {
      setError("Cole o Access Token antes de salvar.");
      return;
    }
    const pkEnv = detectEnv(publicKey);
    const atEnv = detectEnv(value);
    if (pkEnv !== "indefinido" && atEnv !== "indefinido" && pkEnv !== atEnv) {
      setError(
        "Public Key e Access Token são de ambientes diferentes. Use os DOIS do mesmo ambiente (ambos TEST- ou ambos APP_USR-)."
      );
      return;
    }
    save.mutate();
  }

  return (
    <div className="border-t border-border pt-5">
      <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">
        Access Token (secreto)
      </label>
      <p className="text-xs text-primary-dark/60 mb-2">
        Guardado numa tabela protegida — só admins e o servidor conseguem ler. Nunca fica visível para clientes.
      </p>
      <p className="text-xs text-primary-dark/70 mb-3">
        Valor atual:{" "}
        <span className="font-mono">
          {isLoading ? "carregando…" : current ? maskSecret(current) : "(não configurado)"}
        </span>
      </p>
      <div className="flex gap-2">
        <input
          type={show ? "text" : "password"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoComplete="off"
          placeholder={current ? "(cole um novo Access Token para substituir)" : "(não configurado — cole o Access Token)"}
          className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-white"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="px-3 rounded-lg border border-border text-primary-dark"
          aria-label={show ? "Ocultar" : "Revelar"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={save.isPending}
          className="px-4 rounded-lg bg-primary text-cream text-sm inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Save size={15} /> Salvar
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}

function Page() {
  const { data: settings } = useQuery({
    queryKey: ["app-settings", "mercadopago"],
    queryFn: () => listSettings("mercadopago"),
  });
  const publicKey = (settings?.find((s) => s.key === "mp_public_key")?.value ?? "").trim();
  const env = detectEnv(publicKey);

  return (
    <Layout>
      <section className="py-12 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4">
          <Link to="/admin/configuracoes" className="inline-flex items-center gap-1 text-sm text-primary-dark/70 hover:text-primary transition mb-6">
            <ChevronLeft size={16} /> Voltar
          </Link>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center">
              <CreditCard size={20} className="text-primary" />
            </div>
            <h1 className="font-display text-3xl text-primary-dark">Mercado Pago</h1>
            <EnvBadge env={env} />
          </div>
          <p className="text-sm text-primary-dark/60 mb-2">Configure o checkout online pra aceitar cartão, PIX e boleto.</p>
          <a href="https://www.mercadopago.com.br/developers/panel" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-block mb-6">
            Abrir painel MP ↗
          </a>

          <div className="bg-white rounded-xl p-6 shadow-none border border-border/20 space-y-6">
            <SettingsCategory category="mercadopago" />
            <AccessTokenCard publicKey={publicKey} />
          </div>

          <div className="mt-6 bg-cream border border-border rounded-xl p-4 text-xs text-primary-dark/80 leading-relaxed">
            Para vender de verdade, use as credenciais de <strong>PRODUÇÃO</strong> (começam com <code>APP_USR-</code>).
            Para testar sem cobrar, use as de <strong>TESTE</strong> (começam com <code>TEST-</code>) + cartões de teste.
            Sempre os DOIS do mesmo ambiente.
          </div>

          <Link to="/admin/configuracoes/diagnosticos" className="text-sm text-primary hover:underline inline-block mt-6">
            Rodar diagnóstico do Mercado Pago →
          </Link>
        </div>
      </section>
    </Layout>
  );
}
