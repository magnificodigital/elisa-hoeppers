import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, CreditCard, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getSetting } from "@/lib/settings";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/configuracoes/pagarme")({
  head: () => ({ meta: [{ title: "Admin — Pagar.me" }] }),
  component: Page,
});

const WEBHOOK_URL = "https://rjksutoohsvwqnqlemjv.supabase.co/functions/v1/pagarme-webhook";

type Gateway = "mercadopago" | "pagarme";

function Page() {
  const [gateway, setGateway] = useState<Gateway>("mercadopago");
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getSetting("payment_gateway"), getSetting("payments_enabled")])
      .then(([g, e]) => {
        setGateway(g === "pagarme" ? "pagarme" : "mercadopago");
        setEnabled(e !== "false");
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("app_settings").upsert(
        [
          { key: "payment_gateway", value: gateway, category: "pagamento", is_secret: false },
          { key: "payments_enabled", value: enabled ? "true" : "false", category: "pagamento", is_secret: false },
        ],
        { onConflict: "key" },
      );
      if (error) throw error;
      toast.success("Configuração de pagamento salva.");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const card = "bg-white rounded-xl p-6 shadow-none border border-border/20";

  return (
    <section className="py-12 md:py-16 bg-background min-h-[70vh]">
      <div className="max-w-3xl mx-auto px-4">
        <Link to="/admin/configuracoes" className="inline-flex items-center gap-1 text-sm text-primary-dark/70 hover:text-primary transition mb-6">
          <ChevronLeft size={16} /> Voltar
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
            <CreditCard size={20} className="text-primary" />
          </div>
          <h1 className="font-display text-3xl text-primary-dark">Pagar.me</h1>
        </div>
        <p className="text-sm text-primary-dark/60 mb-6">
          Checkout hospedado com cartão, PIX, Apple Pay e Google Pay (o cliente paga numa
          página segura da Pagar.me e volta pro site).
        </p>

        {loading ? (
          <p className="text-sm text-primary-dark/60">Carregando…</p>
        ) : (
          <>
            {/* Seletor de gateway */}
            <div className={card + " mb-6"}>
              <h2 className="font-medium text-primary-dark mb-1">Gateway de pagamento ativo</h2>
              <p className="text-xs text-primary-dark/60 mb-4">
                Escolhe qual serviço processa os pagamentos novos da loja.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([
                  { id: "mercadopago", label: "Mercado Pago", desc: "Cartão + PIX, dentro do site. Funciona agora." },
                  { id: "pagarme", label: "Pagar.me", desc: "Cartão + PIX + Apple Pay + Google Pay (checkout hospedado)." },
                ] as { id: Gateway; label: string; desc: string }[]).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setGateway(opt.id)}
                    className={`text-left rounded-xl border p-4 transition ${
                      gateway === opt.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-[#DBCCBF] hover:border-primary"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-primary-dark">{opt.label}</span>
                      {gateway === opt.id && <Check size={16} className="text-primary" />}
                    </div>
                    <p className="text-xs text-primary-dark/60 mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2 mt-5 text-sm text-primary-dark">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
                Pagamento online ativo (desmarque só em manutenção — clientes veem “pagamento indisponível”).
              </label>

              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary text-cream px-6 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {saving ? "Salvando…" : "Salvar"}
              </button>
            </div>

            {gateway === "pagarme" && (
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-900 mb-1">⚠️ Antes de ativar a Pagar.me</p>
                <ul className="text-xs text-amber-800 leading-relaxed list-disc list-inside space-y-1">
                  <li>A chave secreta de produção (<code className="bg-amber-100 px-1 rounded">sk_live_</code>) precisa estar no secret <code className="bg-amber-100 px-1 rounded">PAGARME_SECRET_KEY</code> do Supabase.</li>
                  <li>O produto <strong>Checkout</strong> precisa estar habilitado na conta Pagar.me (Configurações → Funcionalidades, ambiente Produção).</li>
                  <li>Se a Pagar.me retornar “checkout não disponível”, o pagamento falha — só ative depois de confirmar que funciona.</li>
                </ul>
              </div>
            )}

            {/* Webhook */}
            <div className={card}>
              <h2 className="font-medium text-primary-dark mb-2">Webhook (confirmação de pagamento)</h2>
              <p className="text-xs text-primary-dark/60 mb-3">
                No painel da Pagar.me → Webhooks, cadastre a URL abaixo e ative os eventos
                <strong> order.paid</strong>, <strong>order.payment_failed</strong> e <strong>order.canceled</strong>.
              </p>
              <code className="block bg-background px-3 py-2 rounded text-xs break-all text-primary-dark">
                {WEBHOOK_URL}
              </code>
              <p className="text-[11px] text-primary-dark/50 mt-3">
                A chave secreta não fica aqui por segurança — ela vive no cofre de secrets do
                Supabase (<code className="bg-background px-1 rounded">PAGARME_SECRET_KEY</code>).
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
