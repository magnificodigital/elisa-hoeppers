import { useState } from "react";
import { CreditCard, AlertCircle, Loader2 } from "lucide-react";
import {
  isValidCardNumber,
  formatCardNumber,
  formatExpiry,
  parseExpiry,
  isExpiryValid,
  detectBrand,
} from "@/lib/card-utils";
import { formatPriceBRL } from "@/lib/shop";

export type CardData = {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
  installmentCount: number;
};

export function CardPaymentForm({
  totalCents,
  onSubmit,
  disabled = false,
  loading = false,
  error = null,
}: {
  totalCents: number;
  onSubmit: (data: CardData) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
}) {
  const [holderName, setHolderName] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [ccv, setCcv] = useState("");
  const [installments, setInstallments] = useState(1);
  const [touchedError, setTouchedError] = useState<string | null>(null);

  const brand = detectBrand(number);
  const numberValid = isValidCardNumber(number);
  const expiryValid = isExpiryValid(expiry);
  const ccvValid = ccv.length >= 3 && ccv.length <= 4;
  const nameValid = holderName.trim().length >= 3;
  const canSubmit = numberValid && expiryValid && ccvValid && nameValid;

  const maxInstallments = Math.min(12, Math.max(1, Math.floor(totalCents / 500)));
  const installmentOptions = Array.from({ length: maxInstallments }, (_, i) => {
    const n = i + 1;
    const value = totalCents / n;
    return {
      value: n,
      label:
        n === 1
          ? `À vista · ${formatPriceBRL(totalCents)}`
          : `${n}× de ${formatPriceBRL(value)} sem juros`,
    };
  });

  function validate(): string | null {
    if (!nameValid) return "Nome no cartão inválido";
    if (!numberValid) return "Número do cartão inválido";
    if (!expiryValid) return "Validade inválida ou expirada";
    if (!ccvValid) return "CVV inválido";
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setTouchedError(err);
      return;
    }
    const parsed = parseExpiry(expiry);
    if (!parsed) {
      setTouchedError("Validade inválida");
      return;
    }
    setTouchedError(null);
    onSubmit({
      holderName: holderName.toUpperCase(),
      number: number.replace(/\D/g, ""),
      expiryMonth: parsed.month,
      expiryYear: parsed.year,
      ccv,
      installmentCount: installments,
    });
  }

  const inputCls =
    "w-full border border-border rounded-md px-3 py-2.5 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary";
  const showError = error || touchedError;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">
          Número do cartão
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            value={formatCardNumber(number)}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="1234 5678 9012 3456"
            maxLength={23}
            className={inputCls}
            disabled={disabled || loading}
          />
          {brand && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs uppercase tracking-widest text-primary-dark/60">
              {brand}
            </span>
          )}
          {!brand && number.length > 3 && (
            <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-dark/40" />
          )}
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">
          Nome no cartão
        </label>
        <input
          type="text"
          autoComplete="cc-name"
          value={holderName}
          onChange={(e) => setHolderName(e.target.value.toUpperCase())}
          placeholder="COMO IMPRESSO NO CARTÃO"
          className={inputCls}
          disabled={disabled || loading}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">
            Validade
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            value={formatExpiry(expiry)}
            onChange={(e) => setExpiry(e.target.value)}
            placeholder="MM/AA"
            maxLength={5}
            className={inputCls}
            disabled={disabled || loading}
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">
            CVV
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-csc"
            value={ccv.replace(/\D/g, "").slice(0, 4)}
            onChange={(e) => setCcv(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="123"
            maxLength={4}
            className={inputCls}
            disabled={disabled || loading}
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">
          Parcelamento
        </label>
        <select
          value={installments}
          onChange={(e) => setInstallments(parseInt(e.target.value))}
          className={inputCls}
          disabled={disabled || loading}
        >
          {installmentOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {showError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{showError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit || disabled || loading}
        className="w-full bg-primary text-cream py-3 rounded-full text-xs uppercase tracking-widest font-semibold hover:bg-primary-dark transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processando...
          </>
        ) : (
          `Pagar ${formatPriceBRL(totalCents)}`
        )}
      </button>

      <p className="text-[10px] text-primary-dark/50 text-center">
        🔒 Pagamento seguro. Não armazenamos dados do seu cartão.
      </p>
    </form>
  );
}
