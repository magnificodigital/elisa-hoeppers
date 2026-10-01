import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";

/** Módulos que podem ser ligados/desligados em Admin → Configurações → Módulos. */
export const MODULES = [
  { key: "modulo_mercadopago", label: "Mercado Pago", desc: "Plano B automático do checkout quando a Pagar.me falha. Também cobra cursos pagos." },
  { key: "modulo_asaas", label: "Asaas", desc: "Gateway de pagamento antigo, sem uso." },
  { key: "modulo_base", label: "Base ERP (NF-e)", desc: "Emissor de nota fiscal antigo. A NF-e passa a sair pela Awise." },
  { key: "modulo_financeiro", label: "Financeiro e Entrada de notas", desc: "Controle financeiro e de compras do próprio site. A Awise já cuida disso." },
  { key: "modulo_diagnosticos", label: "Diagnósticos", desc: "Telas de teste do Melhor Envio e do Mercado Pago (manutenção)." },
] as const;

export type ModuleKey = (typeof MODULES)[number]["key"];

export function useModules() {
  return useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("key, value").eq("category", "modulos");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((r) => [r.key, String(r.value) === "true"])) as Record<string, boolean>;
    },
    staleTime: 60_000,
  });
}

/** Sem a configuração carregada, considera ligado (não esconde nada por engano). */
export const isOn = (mods: Record<string, boolean> | undefined, key?: string) =>
  !key || !mods || mods[key] !== false;
