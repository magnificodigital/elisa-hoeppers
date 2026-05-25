import { createClient } from "@supabase/supabase-js";

const url = "https://rwxaeckgpypvjiglorto.supabase.co";
const anon = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3eGFlY2tncHlwdmppZ2xvcnRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDA3ODIsImV4cCI6MjA5NTMxNjc4Mn0.cInQFQ_PuQhKuSWjkqnz5H5oJf4ghDh11yBL1jfDAfk";

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
