export function centsToBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatBRLInput(raw: string): { display: string; cents: number } {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return { display: "", cents: 0 };
  const cents = parseInt(digits, 10);
  const display = (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return { display: `R$ ${display}`, cents };
}
