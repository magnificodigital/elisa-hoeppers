import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Truck } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/lib/cart";
import { formatPriceBRL, calculateShipping, type ShippingOption } from "@/lib/shop";
import { getSetting } from "@/lib/settings";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { toast } from "sonner";

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
  const qc = useQueryClient();

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
  const [cepFilled, setCepFilled] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveThisAddress, setSaveThisAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState("");

  const [meEnabled, setMeEnabled] = useState(false);
  const [shippingOpts, setShippingOpts] = useState<ShippingOption[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);

  const [createAccount, setCreateAccount] = useState(true);
  const [password, setPassword] = useState("");
  const [accountError, setAccountError] = useState<string | null>(null);


  useEffect(() => {
    getSetting("mp_enabled").then((v) => setMpEnabled(v === "true")).catch(() => setMpEnabled(false));
    getSetting("me_enabled").then((v) => setMeEnabled(v === "true")).catch(() => setMeEnabled(false));
  }, []);

  useEffect(() => {
    setSelectedShipping(null);
    setShippingOpts([]);
    setShippingError(null);
    const cleanCep = form.cep.replace(/\D/g, "");
    if (!meEnabled || cleanCep.length !== 8 || items.length === 0) return;

    let cancelled = false;
    setShippingLoading(true);
    calculateShipping({
      cep_destino: cleanCep,
      items: items.map((i) => ({ product_id: i.product_id, qty: i.qty })),
    })
      .then((opts) => {
        if (cancelled) return;
        setShippingOpts(opts);
        if (opts.length > 0) setSelectedShipping(opts[0]);
      })
      .catch((e: Error) => {
        if (!cancelled) setShippingError(e.message);
      })
      .finally(() => {
        if (!cancelled) setShippingLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.cep, meEnabled, items]);

  const shippingCents = selectedShipping?.price_cents ?? 0;
  const totalCents = subtotalCents + shippingCents;

  async function lookupCep(rawCep: string) {
    const cep = rawCep.replace(/\D/g, "");
    if (cep.length !== 8) return;

    setCepLoading(true);
    setCepFilled(false);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.erro) return;

      // Auto-preenche só campos vazios (não sobrescreve o que a cliente já digitou)
      setForm((f) => ({
        ...f,
        street: f.street || data.logradouro || "",
        district: f.district || data.bairro || "",
        cityState:
          f.cityState || (data.localidade && data.uf ? `${data.localidade}/${data.uf}` : ""),
      }));
      setCepFilled(true);
      toast.success("Endereço preenchido pelo CEP");
    } catch (e) {
      console.warn("ViaCEP lookup falhou:", e);
      // Silencia — cliente pode digitar manual
    } finally {
      setCepLoading(false);
    }
  }

  // Debounce: dispara só quando o CEP chega a 8 dígitos
  useEffect(() => {
    const clean = form.cep.replace(/\D/g, "");
    if (clean.length !== 8) {
      setCepFilled(false);
      return;
    }
    const t = setTimeout(() => lookupCep(form.cep), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.cep]);

  function applyAddress(addr: any) {
    setForm((f) => ({
      ...f,
      cep: addr.cep ?? "",
      street: addr.street ?? "",
      number: addr.number ?? "",
      complement: addr.complement ?? "",
      district: addr.district ?? "",
      cityState: addr.city && addr.state ? `${addr.city}/${addr.state}` : "",
    }));
  }

  // Carrega endereços salvos do perfil
  useEffect(() => {
    if (!user || !profile?.saved_addresses) {
      setSavedAddresses([]);
      return;
    }
    const list = Array.isArray(profile.saved_addresses) ? profile.saved_addresses : [];
    setSavedAddresses(list);
    const def = list.find((a: any) => a.is_default);
    if (def && !form.street) {
      applyAddress(def);
      setSelectedAddressId(def.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile?.saved_addresses]);


  async function maybeCreateAccount(): Promise<boolean> {
    if (user) return true; // já logado
    if (!createAccount) return true; // optou por não criar

    if (password.length < 6) {
      setAccountError("A senha precisa ter no mínimo 6 caracteres.");
      return false;
    }

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password,
      options: { data: { full_name: form.name } },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists")) {
        setAccountError("Já existe uma conta com esse email. Faça login antes de continuar.");
        return false;
      }
      // Erros de envio de email (rate limit, SMTP) não devem impedir a compra.
      // Seguimos o pedido como visitante; a conta poderá ser criada depois.
      if (
        msg.includes("rate limit") ||
        msg.includes("email") ||
        msg.includes("smtp") ||
        msg.includes("sending")
      ) {
        return true;
      }
      setAccountError(error.message);
      return false;
    }

    await supabase.auth.signInWithPassword({ email: form.email, password });
    return true;
  }

  async function submitOrder(method: "whatsapp" | "mercadopago") {
    setSubmitError(null);
    setAccountError(null);

    // Não deixa MP prosseguir se ME está ativo mas o frete não foi calculado/selecionado
    if (method === "mercadopago" && meEnabled && (shippingError || !selectedShipping)) {
      setSubmitError("Selecione uma opção de frete válida antes de pagar.");
      return;
    }

    const accountOk = await maybeCreateAccount();
    if (!accountOk) return;


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
        p_shipping_service_id: selectedShipping?.id ?? null,
        p_shipping_service_label: selectedShipping
          ? `${selectedShipping.company} ${selectedShipping.name}`
          : null,
        p_shipping_cents: shippingCents,
        p_destination_cep: form.cep.replace(/\D/g, "") || null,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      const orderResult = row as { order_id: string; code: string; subtotal_cents: number; total_cents: number };

      // Salva o endereço no perfil se a cliente marcou o checkbox
      if (user && saveThisAddress && form.street) {
        const [aCity, aState] = form.cityState.split("/").map((s) => s.trim());
        const newAddr = {
          id: crypto.randomUUID(),
          label: addressLabel || "Endereço",
          cep: form.cep.replace(/\D/g, ""),
          street: form.street,
          number: form.number,
          complement: form.complement,
          district: form.district,
          city: aCity ?? "",
          state: aState ?? "",
          is_default: savedAddresses.length === 0,
        };
        const updated = [...savedAddresses, newAddr];
        supabase
          .from("profiles")
          .update({ saved_addresses: updated })
          .eq("id", user.id)
          .then(() => qc.invalidateQueries({ queryKey: ["profile", user.id] }));
      }



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
      // Logado → vai pra lista de pedidos (com highlight do pedido novo)
      // Guest → vai pra página do pedido
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigate({ to: "/painel/pedidos", search: { highlight: orderResult.code } });
      } else {
        navigate({ to: "/pedido/$code", params: { code: orderResult.code } });
      }
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

                {!user && (
                  <div className="pt-3 mt-1 border-t border-border">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createAccount}
                        onChange={(e) => setCreateAccount(e.target.checked)}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="block text-sm text-primary-dark font-medium">
                          Quero criar uma conta com esse email
                        </span>
                        <span className="block text-xs text-[var(--text-muted)] mt-0.5">
                          Permite acompanhar pedidos em "Meu painel" e comprar mais rápido na próxima vez.
                        </span>
                      </div>
                    </label>

                    {createAccount && (
                      <div className="mt-3">
                        <Field label="Senha">
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className={inputCls}
                          />
                        </Field>
                      </div>
                    )}

                    {accountError && (
                      <p className="text-red-700 text-sm mt-2">
                        {accountError}
                        {accountError.includes("login") && (
                          <>
                            {" "}
                            <Link
                              to="/login"
                              search={{ next: "/checkout" }}
                              className="underline font-medium"
                            >
                              Ir pro login
                            </Link>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                )}
              </Section>


              <Section title="Endereço de entrega">
                <p className="text-xs text-[var(--text-muted)] -mt-2 mb-2">
                  Pode deixar em branco e combinar frete por WhatsApp.
                </p>

                {user && savedAddresses.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">
                      Usar endereço salvo
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {savedAddresses.map((addr: any) => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => {
                            applyAddress(addr);
                            setSelectedAddressId(addr.id);
                          }}
                          className={`text-xs px-3 py-2 rounded-full border transition ${
                            selectedAddressId === addr.id
                              ? "border-primary bg-primary/10 text-primary-dark"
                              : "border-border text-primary-dark/70 hover:border-primary/40"
                          }`}
                        >
                          {addr.label || "Endereço"} · {addr.city}/{addr.state}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAddressId(null);
                          setForm((f) => ({
                            ...f,
                            cep: "",
                            street: "",
                            number: "",
                            complement: "",
                            district: "",
                            cityState: "",
                          }));
                        }}
                        className="text-xs px-3 py-2 rounded-full border border-dashed border-border text-primary-dark/60 hover:border-primary/40 transition"
                      >
                        + Novo endereço
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3">
                  <Field label="CEP">
                    <div className="relative">
                      <input
                        value={form.cep}
                        onChange={(e) => setForm({ ...form, cep: e.target.value })}
                        placeholder="00000-000"
                        maxLength={9}
                        className={inputCls}
                      />
                      {cepLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-dark/50">
                          <div className="w-4 h-4 border-2 border-primary-dark/30 border-t-primary rounded-full animate-spin" />
                        </div>
                      )}
                      {cepFilled && !cepLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary text-xs">
                          ✓
                        </div>
                      )}
                    </div>
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

                {user && !selectedAddressId && form.street && (
                  <div className="mt-4 border-t border-border pt-4">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveThisAddress}
                        onChange={(e) => setSaveThisAddress(e.target.checked)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-primary-dark">Salvar este endereço no meu perfil</p>
                        {saveThisAddress && (
                          <input
                            value={addressLabel}
                            onChange={(e) => setAddressLabel(e.target.value)}
                            placeholder="Ex: Casa, Trabalho, Sítio..."
                            className={`${inputCls} mt-2 text-sm`}
                          />
                        )}
                      </div>
                    </label>
                  </div>
                )}
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

                {meEnabled ? (
                  <div className="mt-3 mb-1">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-primary-dark mb-2">
                      <Truck className="w-3.5 h-3.5" /> Frete
                    </div>
                    {form.cep.replace(/\D/g, "").length !== 8 && (
                      <p className="text-xs text-[var(--text-muted)]">Preencha o CEP pra ver as opções.</p>
                    )}
                    {shippingLoading && (
                      <p className="text-xs text-[var(--text-muted)]">Calculando…</p>
                    )}
                    {shippingError && (
                      <p className="text-xs text-red-700">{shippingError}</p>
                    )}
                    {!shippingLoading && shippingOpts.length > 0 && (
                      <div className="space-y-2">
                        {shippingOpts.map((opt) => (
                          <label
                            key={opt.id}
                            className={`flex items-start gap-2 rounded-md border p-2.5 cursor-pointer transition ${
                              selectedShipping?.id === opt.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary"
                            }`}
                          >
                            <input
                              type="radio"
                              name="shipping"
                              checked={selectedShipping?.id === opt.id}
                              onChange={() => setSelectedShipping(opt)}
                              className="mt-0.5"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-primary-dark truncate">
                                {opt.company} {opt.name}
                              </p>
                              <p className="text-[11px] text-[var(--text-muted)]">
                                {opt.delivery_days} dia{opt.delivery_days === 1 ? "" : "s"} úteis
                              </p>
                            </div>
                            <span className="text-sm text-primary-dark font-medium flex-shrink-0">
                              {formatPriceBRL(opt.price_cents)}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                    {!shippingLoading && !shippingError && shippingOpts.length === 0 && form.cep.replace(/\D/g, "").length === 8 && (
                      <p className="text-xs text-[var(--text-muted)]">
                        Nenhuma opção disponível pra esse CEP. Combine via WhatsApp.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-between mb-1 text-xs text-[var(--text-muted)]">
                    <span>Frete</span>
                    <span className="italic">Combinado por WhatsApp</span>
                  </div>
                )}

                <div className="flex justify-between pt-2 mt-3 border-t border-border">
                  <span className="font-display text-lg text-primary-dark">Total</span>
                  <span className="font-display text-2xl text-primary-dark">
                    {formatPriceBRL(totalCents)}
                  </span>
                </div>
              </div>
              {mpEnabled && meEnabled && shippingError && (
                <p className="text-xs text-red-700 mb-3 text-center">
                  ⚠️ Não conseguimos calcular o frete. Verifique o CEP ou combine via WhatsApp.
                </p>
              )}
              <button
                type="button"
                onClick={() => submitOrder("mercadopago")}
                disabled={
                  submitting !== null ||
                  !mpEnabled ||
                  (meEnabled && !!shippingError) ||
                  (meEnabled && !selectedShipping && shippingOpts.length > 0)
                }
                className="block w-full text-center bg-primary text-white py-3.5 rounded-full uppercase tracking-[0.2em] text-xs font-semibold hover:bg-primary-dark transition disabled:opacity-60"
              >
                {submitting === "mercadopago" ? "Indo pro pagamento…" : "Finalizar Compra"}
              </button>

              {!mpEnabled && (
                <p className="text-xs text-red-700 mt-2 text-center">
                  Pagamento online indisponível no momento. Entre em contato pelo WhatsApp.
                </p>
              )}
              {submitError && (
                <p className="text-red-700 text-sm mt-3">{submitError}</p>
              )}
              <p className="text-[10px] text-[var(--text-muted)] text-center mt-3 leading-relaxed">
                Pague online com cartão, PIX ou boleto pelo Mercado Pago.
              </p>
              <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                {/* Visa */}
                <span className="inline-flex items-center justify-center h-6 w-10 rounded border border-border bg-white">
                  <svg viewBox="0 0 48 16" className="h-3" xmlns="http://www.w3.org/2000/svg">
                    <text x="0" y="13" fontFamily="Arial, sans-serif" fontWeight="bold" fontStyle="italic" fontSize="15" fill="#1A1F71">VISA</text>
                  </svg>
                </span>
                {/* Mastercard */}
                <span className="inline-flex items-center justify-center h-6 w-10 rounded border border-border bg-white">
                  <svg viewBox="0 0 40 24" className="h-4" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="15" cy="12" r="9" fill="#EB001B" />
                    <circle cx="25" cy="12" r="9" fill="#F79E1B" />
                    <path d="M20 5a9 9 0 0 1 0 14 9 9 0 0 1 0-14z" fill="#FF5F00" />
                  </svg>
                </span>
                {/* Elo */}
                <span className="inline-flex items-center justify-center h-6 w-10 rounded border border-border bg-white">
                  <svg viewBox="0 0 48 16" className="h-3" xmlns="http://www.w3.org/2000/svg">
                    <text x="0" y="13" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="14" fill="#000">elo</text>
                  </svg>
                </span>
                {/* Pix */}
                <span className="inline-flex items-center justify-center h-6 w-10 rounded border border-border bg-white gap-1">
                  <svg viewBox="0 0 512 512" className="h-4" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#32BCAD" d="M112 168l144-112 144 112h-52l-92-72-92 72zM112 344l144 112 144-112h-52l-92 72-92-72z"/>
                    <path fill="#32BCAD" d="M256 176l80 80-80 80-80-80z"/>
                  </svg>
                  <span className="text-[8px] font-bold text-[#32BCAD]">pix</span>
                </span>
              </div>


            </aside>
          </form>
        </div>
      </section>
    </Layout>
  );
}
