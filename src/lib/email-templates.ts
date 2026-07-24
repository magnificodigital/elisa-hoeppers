import { supabase } from "./supabase";

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  design_json: any;
  html: string;
  is_system: boolean;
  system_key: string | null;
  created_at: string;
  updated_at: string;
};

export async function listTemplates(): Promise<EmailTemplate[]> {
  const { data, error } = await (supabase as any)
    .from("email_templates")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EmailTemplate[];
}

export async function getTemplate(id: string): Promise<EmailTemplate | null> {
  const { data, error } = await (supabase as any)
    .from("email_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as EmailTemplate) ?? null;
}

export async function createTemplate(input: {
  name: string;
  subject?: string;
  design_json?: any;
  html?: string;
  is_system?: boolean;
  system_key?: string | null;
}): Promise<EmailTemplate> {
  const { data, error } = await (supabase as any)
    .from("email_templates")
    .insert({
      name: input.name,
      subject: input.subject ?? "",
      design_json: input.design_json ?? {},
      html: input.html ?? "",
      is_system: input.is_system ?? false,
      system_key: input.system_key ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as EmailTemplate;
}

export async function updateTemplate(
  id: string,
  patch: Partial<Pick<EmailTemplate, "name" | "subject" | "design_json" | "html">>
): Promise<void> {
  const { error } = await (supabase as any)
    .from("email_templates")
    .update(patch)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from("email_templates")
    .delete()
    .eq("id", id)
    .eq("is_system", false);
  if (error) throw error;
}
