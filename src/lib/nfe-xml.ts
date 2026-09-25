/**
 * Leitura do XML de NF-e (nota do fornecedor) no navegador.
 * Aceita o XML "procNFe" (com protocolo) ou só o <NFe>.
 */

export type NfeItem = {
  code: string;        // cProd (código do fornecedor)
  ean: string | null;  // cEAN / cEANTrib
  description: string; // xProd
  ncm: string | null;
  unit: string | null; // uCom
  qty: number;         // qCom
  unitPriceCents: number; // vUnCom
  totalCents: number;  // vProd
  /** Custo total do item já com frete, seguro, IPI, ST e outras despesas, menos desconto. */
  landedCents: number;
};

export type NfeDup = { number: string; dueDate: string; amountCents: number };

export type NfeData = {
  key: string | null;
  number: string;
  series: string;
  issuedAt: string | null; // YYYY-MM-DD
  supplier: { cnpj: string | null; name: string; email: string | null; phone: string | null };
  recipientDoc: string | null;
  productsCents: number;
  freightCents: number;
  discountCents: number;
  otherCents: number; // seguro + IPI + ST + outras
  totalCents: number;
  items: NfeItem[];
  dups: NfeDup[];
};

const cents = (v: string | null | undefined) => Math.round(parseFloat(v || "0") * 100) || 0;

function first(el: Element | Document, tag: string): Element | null {
  return el.getElementsByTagNameNS("*", tag)[0] ?? null;
}
function text(el: Element | Document | null, tag: string): string | null {
  if (!el) return null;
  const t = first(el, tag)?.textContent?.trim();
  return t ? t : null;
}

export function parseNfeXml(xml: string): NfeData {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error("Arquivo XML inválido.");
  const infNFe = first(doc, "infNFe");
  if (!infNFe) throw new Error("Este XML não é uma NF-e (não encontrei <infNFe>).");

  const ide = first(infNFe, "ide");
  const emit = first(infNFe, "emit");
  const dest = first(infNFe, "dest");
  const tot = first(infNFe, "ICMSTot");

  const key =
    text(doc, "chNFe") ?? (infNFe.getAttribute("Id")?.replace(/^NFe/, "") || null);

  const freight = cents(text(tot, "vFrete"));
  const discount = cents(text(tot, "vDesc"));
  const other =
    cents(text(tot, "vSeg")) + cents(text(tot, "vIPI")) + cents(text(tot, "vST")) + cents(text(tot, "vOutro"));
  const products = cents(text(tot, "vProd"));
  const total = cents(text(tot, "vNF")) || products + freight + other - discount;

  const dets = Array.from(infNFe.getElementsByTagNameNS("*", "det"));
  const items: NfeItem[] = dets.map((det) => {
    const prod = first(det, "prod");
    const imposto = first(det, "imposto");
    const ean = text(prod, "cEAN") ?? text(prod, "cEANTrib");
    const totalCents = cents(text(prod, "vProd"));
    // Impostos do próprio item (IPI, ST) ficam no item; frete/seguro/outras/desconto usam o valor
    // informado no item ou, se a nota só traz no total, são rateados pelo valor do produto.
    const ownTax = cents(text(first(imposto ?? det, "IPI"), "vIPI")) + cents(text(first(imposto ?? det, "ICMS"), "vICMSST"));
    const hasItemCosts = !!(text(prod, "vFrete") || text(prod, "vOutro") || text(prod, "vSeg") || text(prod, "vDesc"));
    const extras = hasItemCosts
      ? cents(text(prod, "vFrete")) + cents(text(prod, "vSeg")) + cents(text(prod, "vOutro")) - cents(text(prod, "vDesc"))
      : products
        ? Math.round((totalCents / products) * (freight + cents(text(tot, "vSeg")) + cents(text(tot, "vOutro")) - discount))
        : 0;
    const landed = totalCents + ownTax + extras;
    return {
      code: text(prod, "cProd") ?? "",
      ean: ean && /^\d{8,14}$/.test(ean) ? ean : null,
      description: text(prod, "xProd") ?? "",
      ncm: text(prod, "NCM"),
      unit: text(prod, "uCom"),
      qty: parseFloat(text(prod, "qCom") ?? "0") || 0,
      unitPriceCents: cents(text(prod, "vUnCom")),
      totalCents,
      landedCents: landed,
    };
  });

  const dups: NfeDup[] = Array.from(infNFe.getElementsByTagNameNS("*", "dup")).map((d) => ({
    number: text(d, "nDup") ?? "",
    dueDate: text(d, "dVenc") ?? "",
    amountCents: cents(text(d, "vDup")),
  })).filter((d) => d.dueDate && d.amountCents > 0);

  const phone = text(first(emit ?? infNFe, "enderEmit"), "fone");
  return {
    key,
    number: text(ide, "nNF") ?? "",
    series: text(ide, "serie") ?? "",
    issuedAt: (text(ide, "dhEmi") ?? text(ide, "dEmi"))?.slice(0, 10) ?? null,
    supplier: {
      cnpj: text(emit, "CNPJ") ?? text(emit, "CPF"),
      name: text(emit, "xFant") ?? text(emit, "xNome") ?? "Fornecedor",
      email: text(emit, "email"),
      phone,
    },
    recipientDoc: text(dest, "CNPJ") ?? text(dest, "CPF"),
    productsCents: products,
    freightCents: freight,
    discountCents: discount,
    otherCents: other,
    totalCents: total,
    items,
    dups,
  };
}

/** Normaliza texto pra comparar nomes (sem acento, minúsculo, só letras/números). */
export function norm(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Similaridade simples por palavras em comum (0..1) — usada pra sugerir o produto. */
export function similarity(a: string, b: string): number {
  const A = new Set(norm(a).split(" ").filter((w) => w.length > 2));
  const Bw = new Set(norm(b).split(" ").filter((w) => w.length > 2));
  if (!A.size || !Bw.size) return 0;
  let common = 0;
  for (const w of A) if (Bw.has(w)) common++;
  return common / Math.min(A.size, Bw.size);
}
