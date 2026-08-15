import { supabase } from "./supabase";

export type AppSetting = {
  key: string;
  value: string;
  category: string;
  is_secret: boolean;
  label: string | null;
  description: string | null;
  display_order: number;
};

export async function listSettings(category?: string): Promise<AppSetting[]> {
  let q = supabase.from("app_settings").select("*").order("display_order", { ascending: true });
  if (category) q = q.eq("category", category);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AppSetting[];
}

export async function updateSetting(key: string, value: string): Promise<void> {
  const { error } = await supabase.from("app_settings").update({ value }).eq("key", key);
  if (error) throw error;
}

export async function getSetting(key: string): Promise<string | null> {
  // Reads only non-secret/public settings (e.g. me_enabled, mp_enabled,
  // mp_public_key) via a security-definer function so visitors who aren't
  // logged in can still see shipping/payment options at checkout.
  const { data, error } = await supabase.rpc("get_public_setting", { p_key: key });
  if (error) throw error;
  return (data as string | null) ?? null;
}
