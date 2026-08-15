import { supabase } from "./supabase";

export type SiteNotice = {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_href: string | null;
  active: boolean;
  pages: string[];
  delay_seconds: number;
  frequency: 'once_session' | 'once_day' | 'always';
  start_at: string | null;
  end_at: string | null;
  capture_lead: boolean;
  form_title: string | null;
  fields_name: boolean;
  fields_email: boolean;
  fields_phone: boolean;
  success_message: string | null;
  created_at: string;
  updated_at: string;
  _count?: { leads: number };
};

export type SiteNoticeLead = {
  id: string;
  notice_id: string | null;
  notice_title: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  page: string | null;
  created_at: string;
};

export async function listNotices(): Promise<SiteNotice[]> {
  const { data, error } = await supabase
    .from("site_notices")
    .select("*, leads:site_notice_leads(count)")
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  
  return (data ?? []).map(n => ({
    ...n,
    _count: { leads: n.leads?.[0]?.count ?? 0 }
  })) as SiteNotice[];
}

export async function getNotice(id: string): Promise<SiteNotice | null> {
  const { data, error } = await supabase
    .from("site_notices")
    .select("*")
    .eq("id", id)
    .maybeSingle();
    
  if (error) throw error;
  return data as SiteNotice | null;
}

export async function createNotice(input: Partial<SiteNotice>): Promise<SiteNotice> {
  const { data, error } = await supabase
    .from("site_notices")
    .insert(input)
    .select()
    .single();
    
  if (error) throw error;
  return data as SiteNotice;
}

export async function updateNotice(id: string, patch: Partial<SiteNotice>): Promise<void> {
  const { error } = await supabase
    .from("site_notices")
    .update(patch)
    .eq("id", id);
    
  if (error) throw error;
}

export async function deleteNotice(id: string): Promise<void> {
  const { error } = await supabase
    .from("site_notices")
    .delete()
    .eq("id", id);
    
  if (error) throw error;
}

export async function listNoticeLeads(noticeId: string): Promise<SiteNoticeLead[]> {
  const { data, error } = await supabase
    .from("site_notice_leads")
    .select("*")
    .eq("notice_id", noticeId)
    .order("created_at", { ascending: false });
    
  if (error) throw error;
  return (data ?? []) as SiteNoticeLead[];
}

export async function submitLead(input: Partial<SiteNoticeLead>): Promise<void> {
  const { error } = await supabase
    .from("site_notice_leads")
    .insert(input);
    
  if (error) throw error;
}
