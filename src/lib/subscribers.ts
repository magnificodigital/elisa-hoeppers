import { supabase } from "./supabase";

export type Subscriber = {
  id: string;
  email: string;
  full_name: string | null;
  source: string | null;
  subscribed_at: string;
  unsubscribed_at: string | null;
};

export async function listSubscribers(): Promise<Subscriber[]> {
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("subscribed_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as Subscriber[];
}

export async function setSubscribed(id: string, active: boolean): Promise<void> {
  const { error } = await supabase
    .from("newsletter_subscribers")
    .update({ unsubscribed_at: active ? null : new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteSubscriber(id: string): Promise<void> {
  const { error } = await supabase
    .from("newsletter_subscribers")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export function exportSubscribersCSV(subs: Subscriber[]): string {
  const header = "email,full_name,source,subscribed_at,unsubscribed_at";
  const rows = subs.map((s) =>
    [s.email, s.full_name ?? "", s.source ?? "", s.subscribed_at, s.unsubscribed_at ?? ""]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header, ...rows].join("\n");
}
