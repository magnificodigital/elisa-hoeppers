import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Loader2, Save } from "lucide-react";

const EmailEditor = lazy(() => import("react-email-editor"));

export type EmailBuilderProps = {
  initialDesign?: any;
  onSave: (design: any, html: string) => void | Promise<void>;
  saving?: boolean;
  minHeight?: number;
};

export function EmailBuilder({ initialDesign, onSave, saving, minHeight = 640 }: EmailBuilderProps) {
  const [mounted, setMounted] = useState(false);
  const editorRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!ready || !initialDesign || Object.keys(initialDesign).length === 0) return;
    try {
      editorRef.current?.editor?.loadDesign(initialDesign);
    } catch (e) {
      console.warn("loadDesign failed", e);
    }
  }, [ready, initialDesign]);

  const handleSave = () => {
    const editor = editorRef.current?.editor;
    if (!editor) return;
    editor.exportHtml((data: any) => {
      onSave(data.design, data.html);
    });
  };

  if (!mounted) {
    return (
      <div
        className="flex items-center justify-center bg-white border border-border rounded-xl"
        style={{ minHeight }}
      >
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="border border-border rounded-xl overflow-hidden bg-white">
        <Suspense
          fallback={
            <div className="flex items-center justify-center" style={{ minHeight }}>
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          }
        >
          <EmailEditor
            ref={editorRef}
            minHeight={minHeight}
            onReady={() => setReady(true)}
            options={{
              displayMode: "email",
              locale: "pt-BR",
              features: { preview: true },
              appearance: { theme: "modern_light" as any },
            } as any}
          />
        </Suspense>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Salvar
        </button>
      </div>
    </div>
  );
}

export default EmailBuilder;
