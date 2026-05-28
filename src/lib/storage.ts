import { supabase } from "./supabase";

const BUCKET = "media";

export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Apenas imagens são aceitas.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Arquivo muito grande (máx 8 MB).");
  }

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const safeName =
    file.name
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "img";
  const path = `${folder.replace(/^\/+|\/+$/g, "")}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteImage(publicUrl: string): Promise<void> {
  const m = publicUrl.match(/\/storage\/v1\/object\/public\/media\/(.+)$/);
  if (!m) return;
  const path = decodeURIComponent(m[1]);
  await supabase.storage.from(BUCKET).remove([path]);
}
