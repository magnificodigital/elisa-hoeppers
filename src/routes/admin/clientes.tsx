import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Download, Search, Mail, GraduationCap, UserCheck } from "lucide-react";
import { listCustomers, type AdminCustomer } from "@/lib/admin";

function csvEscape(v: string | number | null): string {
  if (v == null) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
}

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Filter = "all" | "subscribed" | "not_subscribed" | "account" | "guest";

export const Route = createFileRoute("/admin/clientes")({
  head: () => ({ meta: [{ title: "Admin — Clientes" }] }),
  component: () => (
    
      <CustomersPage />
    
  ),
});

function CustomersPage() {
  const { data: customers, isLoading } = useQuery({ queryKey: ["customers"], queryFn: listCustomers });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (customers ?? []).filter((c) => {
      if (filter === "subscribed" && !c.subscribed) return false;
      if (filter === "not_subscribed" && c.subscribed) return false;
      if (filter === "account" && !c.has_account) return false;
      if (filter === "guest" && c.has_account) return false;
      if (!q) return true;
      return (
        c.email.toLowerCase().includes(q) ||
        (c.name ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q)
      );
    });
  }, [customers, search, filter]);

  function downloadCsv() {
    if (!filtered.length) return;
    const header = "Nome,Email,Telefone,Conta,Pedidos,Total gasto,Inscrito,Matriculado,Última atividade\n";
    const rows = filtered
      .map((c) =>
        [
          c.name,
          c.email,
          c.phone,
          c.has_account ? "Sim" : "Não",
          c.orders_count,
          formatBRL(c.total_spent_cents),
          c.subscribed ? "Sim" : "Não",
          c.enrolled ? "Sim" : "Não",
          c.last_activity ? new Date(c.last_activity).toLocaleDateString("pt-BR") : "",
        ]
          .map(csvEscape)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes-elisa-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const total = customers?.length ?? 0;
  const subscribed = customers?.filter((c) => c.subscribed).length ?? 0;
  const withAccount = customers?.filter((c) => c.has_account).length ?? 0;

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "subscribed", label: "Inscritos" },
    { key: "not_subscribed", label: "Não inscritos" },
    { key: "account", label: "Com conta" },
    { key: "guest", label: "Sem conta" },
  ];

  return (
    <div className="py-12 md:py-16 bg-background min-h-[70vh]">
      <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Users size={24} className="text-primary" />
              <h1 className="font-display text-3xl md:text-4xl text-primary-dark">Clientes</h1>
            </div>
            <button
              type="button"
              onClick={downloadCsv}
              disabled={!filtered.length}
              className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60"
            >
              <Download size={14} /> Exportar CSV
            </button>
          </div>
          <p className="text-primary-dark/70 mb-6">
            {total} clientes · {subscribed} inscritos na newsletter · {withAccount} com conta
          </p>

          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-dark/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, email ou telefone…"
                className="w-full pl-9 pr-3 py-2 rounded-md border border-primary-dark/15 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {filters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                    filter === f.key
                       ? "bg-primary text-white"
                       : "bg-white text-primary-dark/70 hover:bg-background"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading && <p className="text-[var(--text-muted)]">Carregando…</p>}

          {!isLoading && filtered.length === 0 && (
            <div className="bg-white rounded-xl p-8 text-center border border-border/20">
              <p className="text-primary-dark/60">Nenhum cliente encontrado.</p>
            </div>
          )}

          <div className="space-y-2">
            {filtered.map((c) => (
              <CustomerRow key={c.email} c={c} />
            ))}
          </div>
      </div>
    </div>
  );
}

function CustomerRow({ c }: { c: AdminCustomer }) {
  return (
    <div className="bg-white border border-border/20 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium text-primary-dark truncate">{c.name ?? "(sem nome)"}</p>
        <p className="text-xs text-primary-dark/60 truncate">{c.email}</p>
        <p className="text-xs text-primary-dark/50 mt-0.5">
          {c.phone ? `${c.phone} · ` : ""}
          {c.orders_count > 0
            ? `${c.orders_count} pedido${c.orders_count > 1 ? "s" : ""} · ${formatBRL(c.total_spent_cents)}`
            : "Sem pedidos"}
        </p>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
        {c.subscribed ? (
          <span className="inline-flex items-center gap-1 text-xs text-primary bg-background px-2 py-1 rounded">
            <Mail size={12} /> Inscrito
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-primary-dark/50 bg-primary-dark/5 px-2 py-1 rounded">
            <Mail size={12} /> Não inscrito
          </span>
        )}
        {c.enrolled && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
            <GraduationCap size={12} /> Aluno
          </span>
        )}
        <span
          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
            c.has_account
              ? "text-indigo-700 bg-indigo-50"
              : "text-amber-700 bg-amber-50"
          }`}
        >
          <UserCheck size={12} /> {c.has_account ? "Com conta" : "Convidado"}
        </span>
      </div>
    </div>
  );
}
