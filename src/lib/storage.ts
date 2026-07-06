import { supabase } from "./supabase";

const BUCKET = "media";
const MEDIA_PROXY_PATH = "/api/public/media";

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

  return mediaUrlFromPath(path);
}

export function isVideoUrl(url: string): boolean {
  const path = mediaPathFromUrl(url) ?? url;
  return /\.(mp4|webm|mov|ogg|m4v)(\?|$)/i.test(path);
}

export function mediaUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const path = mediaPathFromUrl(value);
  return path ? mediaUrlFromPath(path) : value;
}

export function mediaUrlFromPath(path: string): string {
  return `${MEDIA_PROXY_PATH}?path=${encodeURIComponent(path.replace(/^\/+/, ""))}`;
}

export function mediaPathFromUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;
  if (raw.startsWith("media://")) return raw.slice("media://".length).replace(/^\/+/, "") || null;

  try {
    const url = new URL(raw, "https://local.invalid");
    if (url.pathname === MEDIA_PROXY_PATH) {
      return url.searchParams.get("path")?.replace(/^\/+/, "") || null;
    }

    const markers = [
      `/storage/v1/object/public/${BUCKET}/`,
      `/storage/v1/object/sign/${BUCKET}/`,
      `/storage/v1/object/${BUCKET}/`,
    ];
    for (const marker of markers) {
      const idx = url.pathname.indexOf(marker);
      if (idx >= 0) {
        return decodeURIComponent(url.pathname.slice(idx + marker.length)).replace(/^\/+/, "") || null;
      }
    }
  } catch {
    return null;
  }

  return null;
}


export async function deleteImage(publicUrl: string): Promise<void> {
  const path = mediaPathFromUrl(publicUrl);
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
