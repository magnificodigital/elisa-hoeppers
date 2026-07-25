import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Loader2, Save } from "lucide-react";

const EmailEditor = lazy(() => import("react-email-editor"));

export type EmailBuilderProps = {
  initialDesign?: any;
  initialHtml?: string;
  onSave: (design: any, html: string) => void | Promise<void>;
  saving?: boolean;
  minHeight?: number;
};

function htmlToDesign(html: string) {
  // Wrap arbitrary HTML into a single-row single-column Unlayer design with an HTML block
  return {
    counters: { u_row: 1, u_column: 1, u_content_html: 1 },
    body: {
      id: "body",
      rows: [
        {
          id: "row-1",
          cells: [1],
          columns: [
            {
              id: "col-1",
              contents: [
                {
                  id: "html-1",
                  type: "html",
                  values: {
                    html,
                    hideDesktop: false,
                    displayCondition: null,
                    _meta: { htmlID: "u_content_html_1", htmlClassNames: "u_content_html" },
                    selectable: true,
                    draggable: true,
                    duplicatable: true,
                    deletable: true,
                    hideable: true,
                  },
                },
              ],
              values: {},
            },
          ],
          values: {
            displayCondition: null,
            columns: false,
            backgroundColor: "",
            columnsBackgroundColor: "",
            backgroundImage: { url: "", fullWidth: true, repeat: "no-repeat", size: "custom", position: "center" },
            padding: "0px",
            hideDesktop: false,
            _meta: { htmlID: "u_row_1", htmlClassNames: "u_row" },
            selectable: true,
            draggable: true,
            duplicatable: true,
            deletable: true,
            hideable: true,
          },
        },
      ],
      values: {
        popupPosition: "center",
        popupWidth: "600px",
        popupHeight: "auto",
        borderRadius: "10px",
        contentAlign: "center",
        contentVerticalAlign: "center",
        contentWidth: "600px",
        fontFamily: { label: "Arial", value: "arial,helvetica,sans-serif" },
        textColor: "#000000",
        popupBackgroundColor: "#FFFFFF",
        popupBackgroundImage: { url: "", fullWidth: true, repeat: "no-repeat", size: "cover", position: "center" },
        popupOverlay_backgroundColor: "rgba(0, 0, 0, 0.1)",
        popupCloseButton_position: "top-right",
        popupCloseButton_backgroundColor: "#DDDDDD",
        popupCloseButton_iconColor: "#000000",
        popupCloseButton_borderRadius: "0px",
        popupCloseButton_margin: "0px",
        popupCloseButton_action: { name: "close_popup", attrs: { onClick: "document.querySelector('.u-popup-container').style.display = 'none';" } },
        backgroundColor: "#F9F9F9",
        backgroundImage: { url: "", fullWidth: true, repeat: "no-repeat", size: "custom", position: "center" },
        preheaderText: "",
        linkStyle: { body: true, linkColor: "#0000ee", linkHoverColor: "#0000ee", linkUnderline: true, linkHoverUnderline: true },
        _meta: { htmlID: "u_body", htmlClassNames: "u_body" },
      },
    },
    schemaVersion: 12,
  };
}

export function EmailBuilder({ initialDesign, initialHtml, onSave, saving, minHeight = 640 }: EmailBuilderProps) {
  const [mounted, setMounted] = useState(false);
  const editorRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const hasDesign = initialDesign && typeof initialDesign === "object" && Object.keys(initialDesign).length > 0;
    try {
      if (hasDesign) {
        editorRef.current?.editor?.loadDesign(initialDesign);
      } else if (initialHtml && initialHtml.trim().length > 0) {
        editorRef.current?.editor?.loadDesign(htmlToDesign(initialHtml));
      }
    } catch (e) {
      console.warn("loadDesign failed", e);
    }
  }, [ready, initialDesign, initialHtml]);

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
