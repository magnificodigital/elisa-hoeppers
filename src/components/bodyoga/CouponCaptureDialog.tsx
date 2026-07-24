import { useEffect, useState } from "react";
import { X, Copy, Check, Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createSignupCoupon, sendCouponEmail } from "@/lib/coupons";
import { getSetting } from "@/lib/settings";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CouponCaptureDialog({ open, onClose }: Props) {
  const [title, setTitle] = useState("Ganhe seu cupom de boas-vindas");
  const [subtitle, setSubtitle] = useState(
    "Cadastre seu email e receba um cupom exclusivo de desconto na sua primeira compra.",
  );
  const [discountPct, setDiscountPct] = useState<number>(10);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ code: string; discount_percent: number; expires_at: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      getSetting("coupon_banner_title"),
      getSetting("coupon_banner_subtitle"),
      getSetting("coupon_discount_percent"),
    ]).then(([t, st, d]) => {
      if (t) setTitle(t);
      if (st) setSubtitle(st);
      const pct = parseInt(d ?? "10", 10);
      if (!isNaN(pct)) setDiscountPct(pct);
    }).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) {
      setName("");
      setEmail("");
      setError(null);
      setResult(null);
      setCopied(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Informe um email válido.");
      return;
    }
    setLoading(true);
    try {
      const coupon = await createSignupCoupon({ email: email.trim(), full_name: name.trim() || null });
      setResult({ code: coupon.code, discount_percent: coupon.discount_percent, expires_at: coupon.expires_at });
      // Fire-and-forget: envia email com o cupom (não bloqueia o modal se falhar).
      sendCouponEmail({
        code: coupon.code,
        email: coupon.email,
        full_name: coupon.full_name,
        discount_percent: coupon.discount_percent,
        expires_at: coupon.expires_at,
        validity_days: coupon.expires_at
          ? Math.max(1, Math.round((new Date(coupon.expires_at).getTime() - Date.now()) / 86400000))
          : undefined,
      }).catch((err) => console.warn("send-coupon-email:", err));
    } catch (err) {
      setError((err as Error).message || "Não foi possível gerar seu cupom. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.code);
      setCopied(true);
      toast.success("Cupom copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Selecione manualmente.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-bodyoga-cream text-bodyoga-green rounded-2xl w-full max-w-md p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-bodyoga-green/60 hover:bg-bodyoga-green/10 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-bodyoga-green/10 flex items-center justify-center">
            <Gift className="w-7 h-7 text-bodyoga-green" />
          </div>
        </div>

        {!result ? (
          <>
            <h2 className="font-display text-2xl md:text-3xl text-center leading-tight mb-2">{title}</h2>
            <p className="text-sm text-center text-bodyoga-green/70 mb-6">{subtitle}</p>
            <p className="text-center text-bodyoga-green font-semibold mb-6">
              Ganhe <span className="text-xl">{discountPct}%</span> de desconto
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Seu nome (opcional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-bodyoga-green/20 rounded-full px-5 py-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-bodyoga-green"
              />
              <input
                type="email"
                required
                placeholder="Seu melhor email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-bodyoga-green/20 rounded-full px-5 py-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-bodyoga-green"
              />
              {error && <p className="text-sm text-red-700 text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-bodyoga-green text-bodyoga-cream text-sm font-medium uppercase tracking-[0.18em] hover:opacity-90 transition disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? "Gerando cupom…" : "Quero meu cupom"}
              </button>
              <p className="text-[11px] text-center text-bodyoga-green/50 pt-1">
                Ao continuar, você aceita receber emails da BODYOGA. Pode cancelar quando quiser.
              </p>
            </form>
          </>
        ) : (
          <>
            <h2 className="font-display text-2xl md:text-3xl text-center leading-tight mb-3">Cupom gerado 🌿</h2>
            <p className="text-sm text-center text-bodyoga-green/70 mb-5">
              Enviamos uma cópia para <strong>{email}</strong>. Guarde o código:
            </p>

            <div className="border-2 border-dashed border-bodyoga-green rounded-xl p-5 text-center mb-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-bodyoga-green/60 mb-1">Seu cupom</p>
              <p className="font-mono text-2xl font-bold text-bodyoga-green tracking-wider">{result.code}</p>
              <p className="text-xs text-bodyoga-green/70 mt-1">{result.discount_percent}% de desconto</p>
            </div>

            <button
              type="button"
              onClick={copyCode}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-bodyoga-green text-bodyoga-green text-xs font-medium uppercase tracking-[0.18em] hover:bg-bodyoga-green/5 transition mb-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copiado" : "Copiar código"}
            </button>
            <a
              href="/loja"
              className="block w-full text-center px-6 py-3.5 rounded-full bg-bodyoga-green text-bodyoga-cream text-sm font-medium uppercase tracking-[0.18em] hover:opacity-90 transition"
            >
              Ir para a loja
            </a>
            {result.expires_at && (
              <p className="text-[11px] text-center text-bodyoga-green/50 pt-3">
                Válido até {new Date(result.expires_at).toLocaleDateString("pt-BR")}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
