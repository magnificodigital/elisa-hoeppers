import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Send, ArrowLeft, LayoutTemplate, Palette, Zap, Users, Mail } from "lucide-react";
import Layout from "@/components/Layout";
import { StaffGuard } from "@/components/StaffGuard";
import { CampanhasTab } from "@/components/admin/broadcast/CampanhasTab";
import { TemplatesTab } from "@/components/admin/broadcast/TemplatesTab";
import { LayoutTab } from "@/components/admin/broadcast/LayoutTab";
import { AutomaticosTab } from "@/components/admin/broadcast/AutomaticosTab";
import { InscritosTab } from "@/components/admin/broadcast/InscritosTab";

type TabId = "campanhas" | "templates" | "layout" | "automaticos" | "inscritos";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "campanhas", label: "Campanhas", icon: Send },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "layout", label: "Layout & Branding", icon: Palette },
  { id: "automaticos", label: "Automáticos", icon: Zap },
  { id: "inscritos", label: "Inscritos", icon: Users },
];

export const Route = createFileRoute("/admin/broadcast")({
  head: () => ({ meta: [{ title: "Admin — Emails & Broadcast" }] }),
  component: () => (
    <StaffGuard>
      <BroadcastPage />
    </StaffGuard>
  ),
});

function BroadcastPage() {
  const [tab, setTab] = useState<TabId>("campanhas");

  return (
    <Layout>
      <section className="py-12 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-6xl mx-auto px-4">
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-primary-dark/70 hover:text-primary transition mb-5">
            <ArrowLeft size={16} /> Voltar para o Painel
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-6 h-6 text-primary" />
            <h1 className="font-display text-3xl md:text-4xl text-primary-dark">Emails &amp; Broadcast</h1>
          </div>
          <p className="text-sm text-primary-dark/60 mb-6">
            Central de emails: campanhas, templates, layout, textos automáticos e inscritos da newsletter.
          </p>

          <div className="flex flex-wrap gap-1 bg-white rounded-full p-1.5 mb-6 shadow-sm w-fit">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs uppercase tracking-widest transition ${active ? "bg-primary text-white" : "text-primary-dark/60 hover:text-primary"}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {tab === "campanhas" && <CampanhasTab />}
          {tab === "templates" && <TemplatesTab />}
          {tab === "layout" && <LayoutTab />}
          {tab === "automaticos" && <AutomaticosTab />}
          {tab === "inscritos" && <InscritosTab />}
        </div>
      </section>
    </Layout>
  );
}
