import { SettingsCategory } from "@/components/admin/SettingsCategory";

export function AutomaticosTab() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-primary-dark/60">
        Textos e assuntos dos emails disparados automaticamente pelo sistema.
      </p>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-display text-lg text-primary-dark mb-1">Cupom de boas-vindas</h3>
        <p className="text-xs text-primary-dark/60 mb-4">Enviado quando a cliente se cadastra pelo banner de captura.</p>
        <SettingsCategory category="cupom" />
      </div>

      <p className="text-xs text-primary-dark/50">
        Confirmações de pedido, envio e agendamento usam o layout definido em <strong>Layout &amp; Branding</strong>.
      </p>
    </div>
  );
}
