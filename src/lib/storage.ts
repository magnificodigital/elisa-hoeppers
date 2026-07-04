import { supabase } from "./supabase";

const BUCKET = "media";

export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Apenas imagens são aceitas.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Arquivo muito grande (máx 8 MB).");
  }
  return uploadToBucket(file, folder);
}

export async function uploadMedia(file: File, folder: string): Promise<string> {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) {
    throw new Error("Apenas imagens ou vídeos são aceitos.");
  }
  const max = isVideo ? 50 * 1024 * 1024 : 8 * 1024 * 1024;
  if (file.size > max) {
    throw new Error(`Arquivo muito grande (máx ${isVideo ? "50" : "8"} MB).`);
  }
  return uploadToBucket(file, folder);
}

async function uploadToBucket(file: File, folder: string): Promise<string> {
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const safeName =
    file.name
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "file";
  const path = `${folder.replace(/^\/+|\/+$/g, "")}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|ogg|m4v)(\?|$)/i.test(url);
}


export async function deleteImage(publicUrl: string): Promise<void> {
  const m = publicUrl.match(/\/storage\/v1\/object\/public\/media\/(.+)$/);
  if (!m) return;
  const path = decodeURIComponent(m[1]);
  await supabase.storage.from(BUCKET).remove([path]);
}
