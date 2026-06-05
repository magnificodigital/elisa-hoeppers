import { supabase } from "./supabase";

export type Module = {
  id: string;
  course_id: string;
  title: string;
  display_order: number;
};

export async function listModulesByCourse(courseId: string): Promise<Module[]> {
  const { data, error } = await supabase
    .from("modules")
    .select("id, course_id, title, display_order")
    .eq("course_id", courseId)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Module[];
}

// ============ ADMIN ============
export async function createModule(input: { course_id: string; title: string; display_order: number }): Promise<Module> {
  const { data, error } = await supabase.from("modules").insert(input).select().single();
  if (error) throw error;
  return data as Module;
}

export async function updateModule(id: string, patch: { title?: string; display_order?: number }): Promise<void> {
  const { error } = await supabase.from("modules").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteModule(id: string): Promise<void> {
  // antes de apagar, libera as aulas do módulo (vira null)
  const { error: e1 } = await supabase.from("lessons").update({ module_id: null }).eq("module_id", id);
  if (e1) throw e1;
  const { error: e2 } = await supabase.from("modules").delete().eq("id", id);
  if (e2) throw e2;
}

export async function setLessonModule(lessonId: string, moduleId: string | null): Promise<void> {
  const { error } = await supabase.from("lessons").update({ module_id: moduleId }).eq("id", lessonId);
  if (error) throw error;
}
