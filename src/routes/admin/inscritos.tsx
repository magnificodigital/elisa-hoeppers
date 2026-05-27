import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, Download } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { supabase } from "@/lib/supabase";

type Subscriber = {
  id: string;
  email: string;
  full_name: string | null;
  source: string | null;
  subscribed_at: string;
  unsubscribed_at: string | null;
  resend_contact_id: string | null;
};

async function listSubscribers(): Promise<Subscriber[]> {
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("subscribed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Subscriber[];
}

function csvEscape(v: string | null): string {
  if (v == null) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
}

export const Route = createFileRoute("/admin/inscritos")({
  head: () => ({ meta: [{ title: "Admin — Inscritos" }] }),
  component: () => (
    <AdminGuard>
      <SubscribersPage />
    </AdminGuard>
  ),
});

function SubscribersPage() {
  const { data: subs, isLoading } = useQuery({ queryKey: ["subscribers"], queryFn: listSubscribers });

  function downloadCsv() {
    if (!subs || subs.length === 0) return;
    const header = "Email,Nome,Origem,Inscrito em,Descadastrado em\n";
    const rows = subs.map((s) =>
      [s.email, s.full_name, s.source, s.subscribed_at, s.unsubscribed_at].map(csvEscape).join(",")
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inscritos-elisa-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const active = subs?.filter((s) => !s.unsubscribed_at) ?? [];

  return (
    <Layout>
      <section className="py-12 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Mail size={24} className="text-primary" />
              <h1 className="font-display text-3xl md:text-4xl text-primary-dark">Inscritos da newsletter</h1>
            </div>
            <button
              type="button"
              onClick={downloadCsv}
              disabled={!subs || subs.length === 0}
              className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60"
            >
              <Download size={14} /> Exportar CSV
            </button>
          </div>
          <p className="text-primary-dark/70 mb-8">
            {active.length} ativos · {(subs?.length ?? 0) - active.length} descadastrados
          </p>

          {isLoading && <p className="text-[var(--text-muted)]">Carregando…</p>}

          {!isLoading && (subs?.length ?? 0) === 0 && (
            <div className="bg-white rounded-xl p-8 text-center">
              <p className="text-primary-dark/60">Ninguém se inscreveu ainda.</p>
            </div>
          )}

          <div className="space-y-2">
            {(subs ?? []).map((s) => (
              <div key={s.id} className="bg-white rounded-lg p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-primary-dark truncate">{s.email}</p>
                  <p className="text-xs text-primary-dark/60 truncate">
                    {s.full_name ?? "(sem nome)"} · {s.source ?? "—"} · {new Date(s.subscribed_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {s.unsubscribed_at ? (
                  <span className="text-xs uppercase tracking-widest text-red-700 bg-red-50 px-2 py-1 rounded">Descadastrado</span>
                ) : (
                  <span className="text-xs uppercase tracking-widest text-primary bg-cream px-2 py-1 rounded">Ativo</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
