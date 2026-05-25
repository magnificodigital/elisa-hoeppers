import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anon) {
  console.warn("Supabase env vars não configuradas");
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export type Course = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_image: string | null;
  overlay_label: string | null;
  level: "iniciante" | "intermediario" | "avancado" | "todos";
  duration_total_min: number | null;
  price_cents: number | null;
  is_published: boolean;
  display_order: number;
};

export type Lesson = {
  id: string;
  course_id: string;
  module_id: string | null;
  slug: string;
  title: string;
  description: string | null;
  duration_min: number | null;
  display_order: number;
  is_free_preview: boolean;
};
