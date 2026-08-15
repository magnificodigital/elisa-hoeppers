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
  // Use a generic RPC or just query directly if it's public.
  // Assuming a RLS policy allows public read for certain categories.
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  
  // If no public access, we might need the RPC from earlier.
  // Re-checking the previous file, it used get_public_setting.
  // I will stick to what works.
  if (error) {
     const { data: rpcData, error: rpcError } = await supabase.rpc("get_public_setting", { p_key: key });
     if (rpcError) throw rpcError;
     return (rpcData as string | null) ?? null;
  }
  return data?.value ?? null;
}

export async function bulkUpdateSettings(settings: { key: string; value: string }[]): Promise<void> {
  for (const s of settings) {
    const { error } = await supabase.from("app_settings").update({ value: s.value }).eq("key", s.key);
    if (error) throw error;
  }
}
