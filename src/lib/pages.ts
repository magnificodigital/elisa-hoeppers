import { supabase } from "./supabase";
import type { PageBlock } from "./page-blocks";

export type SitePage = {
  id: string;
  slug: string;
  title: string;
  content_md: string;
  content_blocks: PageBlock[];
  hero_image: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_published: boolean;
  show_in_menu: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  type: "site" | "landing";
  status: "active" | "draft";
  is_home: boolean;
  in_menu: boolean;
  menu_order: number | null;
  blocks: any[]; // New structure
};

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function listPages(): Promise<SitePage[]> {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .order("menu_order", { ascending: true, nullsLast: true })
    .order("title", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SitePage[];
}

export async function getPage(id: string): Promise<SitePage | null> {
  const { data, error } = await supabase.from("pages").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as SitePage) ?? null;
}

export async function createPage(input: { title: string; slug: string }): Promise<SitePage> {
  const { data, error } = await supabase
    .from("pages")
    .insert({ title: input.title, slug: input.slug, content_md: "", blocks: [] })
    .select()
    .single();
  if (error) throw error;
  return data as SitePage;
}

export async function updatePage(id: string, patch: Partial<SitePage>): Promise<void> {
  const { error } = await supabase.from("pages").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deletePage(id: string): Promise<void> {
  const { error } = await supabase.from("pages").delete().eq("id", id);
  if (error) throw error;
}
