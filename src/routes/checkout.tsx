import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Truck } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/lib/cart";
import { formatPriceBRL, calculateShipping, type ShippingOption } from "@/lib/shop";
import { getSetting } from "@/lib/settings";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Elisa Hoeppers" }] }),
  component: CheckoutPage,
});

const inputCls =
  "w-full border border-border rounded-md px-3 py-2.5 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="font-display text-lg text-primary-dark mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function friendlyError(msg: string): string {
  const m = (msg || "").toLowerCase();
  if (m.includes("name required")) return "Por favor, informe seu nome completo.";
  if (m.includes("email required")) return "Por favor, informe um e-mail válido.";
  if (m.includes("phone required")) return "Por favor, informe seu WhatsApp.";
  if (m.includes("cart empty") || m.includes("no valid items"))
    return "Seu carrinho está vazio.";
  if (m.includes("out of stock")) return "Um dos produtos está sem estoque.";
  if (m.includes("not available")) return "Um dos produtos não está mais disponível.";
  return "Não foi possível concluir o pedido. Tente novamente ou fale com a Elisa pelo WhatsApp.";
}

function CheckoutPage() {
  const { items, subtotalCents, totalItems, clear, loaded } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    cityState: "",
    notes: "",
  });

  useEffect(() => {
    if (loaded && totalItems === 0) {
      navigate({ to: "/carrinho" });
    }
  }, [loaded, totalItems, navigate]);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: f.name || profile?.full_name || user.email?.split("@")[0] || "",
        email: f.email || user.email || "",
      }));
    }
  }, [user, profile]);

  const [submitting, setSubmitting] = useState<"whatsapp" | "mercadopago" | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mpEnabled, setMpEnabled] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  useEffect(() => {
    getSetting("mp_enabled").then((v) => setMpEnabled(v === "true")).catch(() => setMpEnabled(false));
  }, []);

  async function lookupCep(rawCep: string) {
    const cep = rawCep.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      setCepLoading(true);
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) return;
      setForm((f) => ({
        ...f,
        street: data.logradouro || f.street,
        district: data.bairro || f.district,
        cityState:
          data.localidade && data.uf ? `${data.localidade}/${data.uf}` : f.cityState,
        complement: data.complemento || f.complement,
      }));
    } catch {
      // silenciosamente ignora falha de consulta de CEP
    } finally {
      setCepLoading(false);
    }
  }


  async function submitOrder(method: "whatsapp" | "mercadopago") {
    setSubmitError(null);
    try {
      setSubmitting(method);
      const [city, state] = form.cityState.split("/").map((s) => s.trim());
      const { data, error } = await supabase.rpc("place_order", {
        p_items: items.map((i) => ({ product_id: i.product_id, qty: i.qty })),
        p_customer_name: form.name,
        p_customer_email: form.email,
        p_customer_phone: form.phone,
        p_customer_address: form.street
          ? {
              cep: form.cep,
              street: form.street,
              number: form.number,
              complement: form.complement,
              district: form.district,
              city: city ?? "",
              state: state ?? "",
            }
          : null,
        p_notes: form.notes || null,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      const orderResult = row as { order_id: string; code: string; subtotal_cents: number; total_cents: number };

      track("order_created", {
        order_code: orderResult.code,
        total_brl: Number((orderResult.total_cents / 100).toFixed(2)),
        items: items.length,
      });

      supabase.functions.invoke("send-notification", {
        body: { type: "order", record_id: orderResult.order_id },
      }).catch((e) => console.error("email failed:", e));

      if (method === "mercadopago") {
        const { data: payData, error: payErr } = await supabase.functions.invoke("create-payment", {
          body: { order_id: orderResult.order_id },
        });
        if (payErr) throw payErr;
        const initPoint = (payData as { init_point?: string })?.init_point;
        if (!initPoint) throw new Error("Falha ao criar pagamento");
        clear();
        window.location.href = initPoint;
        return;
      }

      await supabase.from("orders").update({ payment_method: "whatsapp" }).eq("id", orderResult.order_id);
      clear();
      navigate({ to: "/pedido/$code", params: { code: orderResult.code } });
    } catch (err) {
      setSubmitError(friendlyError((err as Error).message));
    } finally {
      setSubmitting(null);
    }
  }

  if (loaded && totalItems === 0) return null;

  return (
    <Layout>
      <section className="py-12 md:py-20 bg-cream min-h-screen">
        <div className="max-w-[1170px] mx-auto px-4 md:px-6">
          <Link
            to="/carrinho"
            className="inline-flex items-center gap-1 text-sm text-primary-dark hover:text-primary mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar ao carrinho
          </Link>
          <h1 className="font-display text-4xl md:text-5xl text-primary-dark mb-8">
            Finalizar pedido
          </h1>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8"
          >
            <div className="space-y-6">
              <Section title="Seus dados">
                <Field label="Nome completo">
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Email">
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="WhatsApp">
                    <input
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className={inputCls}
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Endereço de entrega">
                <p className="text-xs text-[var(--text-muted)] -mt-2 mb-2">
                  Pode deixar em branco e combinar frete por WhatsApp.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3">
                  <Field label={cepLoading ? "CEP (buscando…)" : "CEP"}>
                    <input
                      value={form.cep}
                      onChange={(e) => {
                        const v = e.target.value;
                        setForm({ ...form, cep: v });
                        if (v.replace(/\D/g, "").length === 8) lookupCep(v);
                      }}
                      onBlur={(e) => lookupCep(e.target.value)}
                      placeholder="00000-000"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Rua">
                    <input
                      value={form.street}
                      onChange={(e) => setForm({ ...form, street: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Field label="Número">
                    <input
                      value={form.number}
                      onChange={(e) => setForm({ ...form, number: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Complemento">
                    <input
                      value={form.complement}
                      onChange={(e) => setForm({ ...form, complement: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Bairro">
                    <input
                      value={form.district}
                      onChange={(e) => setForm({ ...form, district: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Cidade/UF">
                    <input
                      value={form.cityState}
                      onChange={(e) => setForm({ ...form, cityState: e.target.value })}
                      placeholder="São Paulo/SP"
                      className={inputCls}
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Observações">
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Alguma instrução pra Elisa?"
                  className={inputCls}
                />
              </Section>

            </div>

            <aside className="bg-white rounded-lg p-6 self-start lg:sticky lg:top-6">
              <h2 className="font-display text-xl text-primary-dark mb-4">Pedido</h2>
              <ul className="space-y-3 mb-5 text-sm">
                {items.map((it) => (
                  <li key={it.product_id} className="flex justify-between gap-3">
                    <span className="text-primary-dark min-w-0 truncate">
                      {it.qty}× {it.name}
                    </span>
                    <span className="text-primary-dark font-medium flex-shrink-0">
                      {formatPriceBRL(it.unit_price_cents * it.qty)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-border pt-3 mb-5">
                <div className="flex justify-between mb-1">
                  <span className="text-[var(--text-muted)] text-sm">Subtotal</span>
                  <span className="text-primary-dark">{formatPriceBRL(subtotalCents)}</span>
                </div>
                <div className="flex justify-between mb-1 text-xs text-[var(--text-muted)]">
                  <span>Frete</span>
                  <span className="italic">Combinado por WhatsApp</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-display text-lg text-primary-dark">Total</span>
                  <span className="font-display text-2xl text-primary-dark">
                    {formatPriceBRL(subtotalCents)}
                  </span>
                </div>
              </div>
              {mpEnabled && (
                <button
                  type="button"
                  onClick={() => submitOrder("mercadopago")}
                  disabled={submitting !== null}
                  className="block w-full text-center bg-primary text-white py-3.5 rounded-full uppercase tracking-[0.2em] text-xs font-semibold hover:bg-primary-dark transition disabled:opacity-60 mb-2"
                >
                  {submitting === "mercadopago" ? "Indo pro pagamento…" : "Pagar agora com Mercado Pago"}
                </button>
              )}
              <button
                type="button"
                onClick={() => submitOrder("whatsapp")}
                disabled={submitting !== null}
                className={`block w-full text-center ${mpEnabled ? "border border-primary text-primary hover:bg-primary hover:text-white" : "bg-primary text-white hover:bg-primary-dark"} py-3.5 rounded-full uppercase tracking-[0.2em] text-xs font-semibold transition disabled:opacity-60`}
              >
                {submitting === "whatsapp" ? "Enviando…" : (mpEnabled ? "Combinar por WhatsApp" : "Enviar pedido")}
              </button>
              {submitError && (
                <p className="text-red-700 text-sm mt-3">{submitError}</p>
              )}
              <p className="text-[10px] text-[var(--text-muted)] text-center mt-3 leading-relaxed">
                {mpEnabled
                  ? "Pague online com cartão, PIX ou boleto, ou combine pagamento e frete diretamente com a Elisa via WhatsApp."
                  : "Elisa entra em contato em até 24h pelo WhatsApp para tirar qualquer duvida."}
              </p>
            </aside>
          </form>
        </div>
      </section>
    </Layout>
  );
}
