import { useRef, useState } from "react";
import { Upload, Link as LinkIcon, X, Loader2 } from "lucide-react";
import { uploadImage, uploadMedia, isVideoUrl } from "@/lib/storage";

export function ImageUploader({
  value,
  onChange,
  folder = "general",
  aspectRatio = "1/1",
  label,
  allowUrl = true,
  allowVideo = false,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  aspectRatio?: string;
  label?: string;
  allowUrl?: boolean;
  allowVideo?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const url = allowVideo ? await uploadMedia(file, folder) : await uploadImage(file, folder);
      onChange(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }


  return (
    <div className="space-y-2">
      {label && <p className="text-[10px] uppercase tracking-widest text-primary-dark">{label}</p>}

      {value ? (
        <div className="relative inline-block rounded-md overflow-hidden bg-sand border border-border" style={{ aspectRatio, width: "12rem" }}>
          {allowVideo && isVideoUrl(value) ? (
            <video src={value} className="w-full h-full object-cover" controls muted playsInline />
          ) : (
            <img src={value} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
          )}
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-1 right-1 w-7 h-7 rounded-full bg-white/90 text-red-700 hover:bg-white flex items-center justify-center shadow"
            aria-label="Remover mídia"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-1 left-1 inline-flex items-center gap-1 bg-white/90 text-primary-dark text-[10px] uppercase tracking-widest px-2 py-1 rounded-full hover:bg-white"
          >
            <Upload className="w-3 h-3" /> Trocar
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-md p-6 cursor-pointer transition ${
            dragOver ? "border-primary bg-primary/5" : "border-border bg-cream/30 hover:border-primary/60"
          }`}
          style={{ aspectRatio, width: "12rem" }}
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Enviando…</p>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 text-primary" />
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] text-center leading-tight">
                Clique ou arraste<br />uma imagem
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {error && <p className="text-red-700 text-xs">{error}</p>}

      {allowUrl && (
        <div>
          {!showUrl ? (
            <button
              type="button"
              onClick={() => setShowUrl(true)}
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-primary hover:opacity-70"
            >
              <LinkIcon className="w-3 h-3" /> Ou colar URL externa
            </button>
          ) : (
            <div className="flex gap-2 items-center">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://..."
                className="flex-1 border border-border rounded-md px-3 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={() => { onChange(urlInput.trim() || null); setShowUrl(false); setUrlInput(""); }}
                className="bg-primary text-white px-3 py-1.5 rounded-md text-[10px] uppercase tracking-widest hover:bg-primary-dark"
              >
                Aplicar
              </button>
              <button
                type="button"
                onClick={() => { setShowUrl(false); setUrlInput(""); }}
                className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] hover:text-primary-dark px-2"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
