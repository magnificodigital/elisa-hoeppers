import { CreditCard, Zap, FileText, Banknote } from "lucide-react";

const configs: Record<string, { label: string; Icon: typeof CreditCard; cls: string }> = {
  credit_card: { label: "Cartão", Icon: CreditCard, cls: "bg-primary/10 text-primary" },
  debit_card: { label: "Débito", Icon: CreditCard, cls: "bg-primary/10 text-primary" },
  pix: { label: "PIX", Icon: Zap, cls: "bg-accent-teal/15 text-accent-teal" },
  ticket: { label: "Boleto", Icon: FileText, cls: "bg-peach/40 text-primary-dark" },
  bank_transfer: { label: "Transferência", Icon: Banknote, cls: "bg-sand text-primary-dark" },
};

export function PaymentMethodBadge({
  type,
  installments,
}: {
  type: string | null;
  installments?: number | null;
}) {
  if (!type) return null;
  const cfg = configs[type];
  if (!cfg)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-cream text-primary-dark/60">
        {type}
      </span>
    );
  const Icon = cfg.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${cfg.cls}`}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
      {type === "credit_card" && installments && installments > 1 && (
        <span className="ml-0.5">{installments}×</span>
      )}
    </span>
  );
}
