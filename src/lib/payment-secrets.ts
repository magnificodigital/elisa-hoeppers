import { supabase } from "./supabase";

/** Segredos de pagamento — tabela protegida por RLS (somente admin / service_role). */
export async function getPaymentSecret(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("payment_secrets")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  return (data?.value as string | undefined)?.trim() || null;
}

export async function setPaymentSecret(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from("payment_secrets")
    .upsert({ key, value: value.trim(), updated_at: new Date().toISOString() });
  if (error) throw error;
}

export function maskSecret(value: string | null): string {
  if (!value) return "";
  const prefix = value.startsWith("APP_USR-") ? "APP_USR-" : value.startsWith("TEST-") ? "TEST-" : "";
  return `${prefix}••••••••${value.slice(-4)}`;
}

export type MpEnv = "producao" | "teste" | "indefinido";

export function detectEnv(value: string): MpEnv {
  if (value.startsWith("APP_USR-")) return "producao";
  if (value.startsWith("TEST-")) return "teste";
  return "indefinido";
}
