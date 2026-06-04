import { createClient } from "@supabase/supabase-js";

const url = "https://rjksutoohsvwqnqlemjv.supabase.co";
const anon = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqa3N1dG9vaHN2d3FucWxlbWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1ODE1NTMsImV4cCI6MjA5NjE1NzU1M30.UDScUF2qJSPbdOjOvSrLWhJLFpb-M9vDD963MkRkL9o";

const isBrowser = typeof window !== "undefined";

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
    detectSessionInUrl: isBrowser,
    storage: isBrowser ? window.localStorage : undefined,
  },
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
