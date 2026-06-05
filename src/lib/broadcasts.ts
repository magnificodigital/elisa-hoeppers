import { supabase } from "@/lib/supabase";

export type Broadcast = {
  id: string;
  subject: string;
  body_html: string;
  segment_type: "newsletter" | "course_enrolled" | "product_buyers" | "all_customers" | "all_students";
  segment_id: string | null;
  segment_label: string | null;
  created_at: string;
  sent_at: string | null;
  sent_count: number;
  failed_count: number;
  status: "draft" | "sending" | "sent" | "failed";
};

export async function listBroadcasts(): Promise<Broadcast[]> {
  const { data, error } = await (supabase as any)
    .from("broadcasts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Broadcast[];
}

export async function countRecipients(
  segmentType: Broadcast["segment_type"],
  segmentId: string | null
): Promise<number> {
  const { data, error } = await (supabase as any).rpc("admin_count_broadcast_recipients", {
    p_segment_type: segmentType,
    p_segment_id: segmentId,
  });
  if (error) throw error;
  return Number(data ?? 0);
}

export async function createBroadcast(input: {
  subject: string;
  body_html: string;
  segment_type: Broadcast["segment_type"];
  segment_id: string | null;
  segment_label: string | null;
}): Promise<Broadcast> {
  const { data: sessionData } = await supabase.auth.getSession();
  const { data, error } = await (supabase as any)
    .from("broadcasts")
    .insert({ ...input, created_by: sessionData?.session?.user.id })
    .select()
    .single();
  if (error) throw error;
  return data as Broadcast;
}

export async function sendBroadcastTest(broadcastId: string, testEmail: string): Promise<void> {
  const { error } = await supabase.functions.invoke("send-broadcast", {
    body: { broadcast_id: broadcastId, test_email: testEmail },
  });
  if (error) throw error;
}

export async function sendBroadcastReal(broadcastId: string): Promise<void> {
  const { error } = await supabase.functions.invoke("send-broadcast", {
    body: { broadcast_id: broadcastId },
  });
  if (error) throw error;
}
