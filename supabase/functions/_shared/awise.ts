// Cliente da API da Awise (ERP). Token do usuário de integração em AWISE_TOKEN.
// Docs: https://awise.stoplight.io/docs/api-doc

// @ts-ignore
const TOKEN = (Deno.env.get("AWISE_TOKEN") ?? "").trim();
export const AWISE_BASE = "https://api.useawise.com";

export function awiseConfigured() {
  return TOKEN.length > 0;
}

let companyId: string | null = null;
let branchId: string | null = null;

/** Empresa (e filial) do token — a API exige o header x-company na maioria das rotas. */
async function scope(): Promise<Record<string, string>> {
  if (!companyId) {
    const r = await raw("GET", "/companies");
    companyId = r.data?.data?.[0]?.id ?? null;
    if (companyId) {
      const b = await raw("GET", `/companies/${companyId}/branches`, undefined, { "x-company": companyId });
      branchId = b.data?.data?.[0]?.id ?? null;
    }
  }
  return {
    ...(companyId ? { "x-company": companyId } : {}),
    ...(branchId ? { "x-branch": branchId } : {}),
  };
}

export async function awiseScope() {
  await scope();
  return { companyId, branchId };
}

async function raw(method: string, path: string, body?: unknown, extra: Record<string, string> = {}) {
  const r = await fetch(`${AWISE_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...extra,
    },
    body: body == null ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: r.ok, status: r.status, data };
}

export async function awise(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ ok: boolean; status: number; data: any }> {
  return raw(method, path, body, await scope());
}

/** Mensagem de erro legível a partir da resposta da Awise. */
export function awiseError(r: { status: number; data: any }): string {
  const d = r.data;
  const msg =
    (typeof d === "string" && d) ||
    d?.error?.message || d?.error || d?.message ||
    d?.errors?.map?.((e: any) => e?.detail || e?.title || e?.message).join("; ") ||
    JSON.stringify(d)?.slice(0, 300);
  return `Awise ${r.status}: ${msg}`;
}

/** Lista todas as variações (produtos com SKU/estoque) paginando. */
export async function listAllAwiseProducts(filter: Record<string, unknown> = {}): Promise<any[]> {
  const out: any[] = [];
  for (let page = 1; page <= 50; page++) {
    const r = await awise("POST", "/products/list", {
      page_size: 100,
      page_number: page,
      includeGroup: true,
      filter: { disabled: "onlyNotRemoved", ...filter },
    });
    if (!r.ok) throw new Error(awiseError(r));
    const rows = r.data?.data ?? [];
    out.push(...rows);
    if (rows.length < 100) break;
  }
  return out;
}

export const toCents = (v: unknown) => Math.round(parseFloat(String(v ?? "0").replace(",", ".")) * 100) || 0;
export const money = (cents: number) => (cents / 100).toFixed(2);
