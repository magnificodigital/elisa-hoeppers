import { SettingsCategory } from "@/components/admin/SettingsCategory";

export function LayoutTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-primary-dark/60">
        Logotipo, cor da marca, assinatura e rodapé aplicados em todos os emails (transacionais e campanhas).
      </p>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <SettingsCategory category="emails" />
      </div>
    </div>
  );
}
