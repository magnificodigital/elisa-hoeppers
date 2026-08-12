import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Code,
  Columns2,
  Copy,
  GripVertical,
  Heading,
  HelpCircle,
  Image as ImageIcon,
  Images,
  LayoutGrid,
  List,
  Megaphone,
  MessageSquareQuote,
  Minus,
  MousePointerClick,
  MoveVertical,
  PanelTop,
  Plus,
  Quote,
  Rows3,
  Settings2,
  Sparkles,
  Trash2,
  Type,
  Video,
} from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";
import { PageBlockView } from "@/components/pages/PageBlockRenderer";
import { BLOCK_LIBRARY, createBlock, getBlockDef, type BlockType, type PageBlock } from "@/lib/page-blocks";

const ICONS: Record<string, any> = {
  Heading,
  Type,
  List,
  Quote,
  Image: ImageIcon,
  Images,
  Video,
  MousePointerClick,
  Rows3,
  MoveVertical,
  Minus,
  Columns2,
  Sparkles,
  LayoutGrid,
  HelpCircle,
  BarChart3,
  MessageSquareQuote,
  PanelTop,
  Megaphone,
  Code,
};

const input =
  "w-full border border-border rounded-md px-3 py-2 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary";
const lbl = "block text-[10px] uppercase tracking-widest text-primary-dark/70 mb-1";

/* ---------------- palette ---------------- */

function PaletteItem({ type, label, description, icon }: { type: BlockType; label: string; description: string; icon: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `palette:${type}`, data: { paletteType: type } });
  const Icon = ICONS[icon] ?? Type;
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-start gap-2 p-2.5 rounded-lg border border-border bg-white cursor-grab active:cursor-grabbing hover:border-primary/60 transition ${
        isDragging ? "opacity-40" : ""
      }`}
      title={description}
    >
      <Icon size={15} className="text-primary mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-primary-dark leading-tight">{label}</p>
        <p className="text-[10px] text-primary-dark/50 leading-tight truncate">{description}</p>
      </div>
    </div>
  );
}

/* ---------------- field editors ---------------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      {children}
    </div>
  );
}

function RepeaterList({
  items,
  onChange,
  render,
  addLabel,
  blank,
}: {
  items: any[];
  onChange: (v: any[]) => void;
  render: (item: any, set: (patch: any) => void) => React.ReactNode;
  addLabel: string;
  blank: () => any;
}) {
  return (
    <div className="space-y-2">
      {(items ?? []).map((it, i) => (
        <div key={i} className="border border-border rounded-lg p-2.5 space-y-2 bg-cream/40">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-widest text-primary-dark/50">#{i + 1}</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => i > 0 && onChange(arrayMove(items, i, i - 1))}
                className="text-primary-dark/40 hover:text-primary"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => i < items.length - 1 && onChange(arrayMove(items, i, i + 1))}
                className="text-primary-dark/40 hover:text-primary"
              >
                <ChevronDown size={14} />
              </button>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="text-primary-dark/40 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          {render(it, (patch) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x))))}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...(items ?? []), blank()])}
        className="w-full text-xs text-primary border border-dashed border-primary/40 rounded-lg py-2 hover:bg-primary/5 transition"
      >
        <Plus size={12} className="inline mr-1" />
        {addLabel}
      </button>
    </div>
  );
}

function BlockFields({ block, onChange }: { block: PageBlock; onChange: (b: PageBlock) => void }) {
  const p = block.props ?? {};
  const set = (patch: Record<string, any>) => onChange({ ...block, props: { ...p, ...patch } });

  switch (block.type) {
    case "heading":
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-3">
            <Field label="Texto">
              <input className={input} value={p.text ?? ""} onChange={(e) => set({ text: e.target.value })} />
            </Field>
          </div>
          <Field label="Tamanho">
            <select className={input} value={p.level ?? 2} onChange={(e) => set({ level: Number(e.target.value) })}>
              <option value={1}>Muito grande</option>
              <option value={2}>Grande</option>
              <option value={3}>Médio</option>
              <option value={4}>Pequeno</option>
            </select>
          </Field>
          <Field label="Alinhamento">
            <select className={input} value={p.align ?? "left"} onChange={(e) => set({ align: e.target.value })}>
              <option value="left">Esquerda</option>
              <option value="center">Centro</option>
              <option value="right">Direita</option>
            </select>
          </Field>
        </div>
      );
    case "text":
      return (
        <div className="space-y-3">
          <Field label="Texto (aceita **negrito**, *itálico*, [link](url))">
            <textarea rows={6} className={input} value={p.content ?? ""} onChange={(e) => set({ content: e.target.value })} />
          </Field>
          <Field label="Alinhamento">
            <select className={input} value={p.align ?? "left"} onChange={(e) => set({ align: e.target.value })}>
              <option value="left">Esquerda</option>
              <option value="center">Centro</option>
              <option value="right">Direita</option>
            </select>
          </Field>
        </div>
      );
    case "list":
      return (
        <div className="space-y-3">
          <Field label="Itens (um por linha)">
            <textarea
              rows={5}
              className={input}
              value={(p.items ?? []).join("\n")}
              onChange={(e) => set({ items: e.target.value.split("\n") })}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-primary-dark">
            <input type="checkbox" checked={!!p.ordered} onChange={(e) => set({ ordered: e.target.checked })} />
            Lista numerada
          </label>
        </div>
      );
    case "quote":
      return (
        <div className="space-y-3">
          <Field label="Frase">
            <textarea rows={3} className={input} value={p.text ?? ""} onChange={(e) => set({ text: e.target.value })} />
          </Field>
          <Field label="Autor (opcional)">
            <input className={input} value={p.author ?? ""} onChange={(e) => set({ author: e.target.value })} />
          </Field>
        </div>
      );
    case "image":
      return (
        <div className="space-y-3">
          <ImageUploader value={p.url || null} onChange={(url) => set({ url: url ?? "" })} folder="pages" aspectRatio="16/9" />
          <Field label="Texto alternativo">
            <input className={input} value={p.alt ?? ""} onChange={(e) => set({ alt: e.target.value })} />
          </Field>
          <Field label="Legenda">
            <input className={input} value={p.caption ?? ""} onChange={(e) => set({ caption: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-primary-dark">
            <input type="checkbox" checked={p.rounded !== false} onChange={(e) => set({ rounded: e.target.checked })} />
            Cantos arredondados
          </label>
        </div>
      );
    case "gallery":
      return (
        <div className="space-y-3">
          <Field label="Colunas">
            <select className={input} value={p.columns ?? 3} onChange={(e) => set({ columns: Number(e.target.value) })}>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </Field>
          <RepeaterList
            items={(p.images ?? []).map((url: string) => ({ url }))}
            onChange={(v) => set({ images: v.map((x: any) => x.url).filter(Boolean) })}
            addLabel="Adicionar imagem"
            blank={() => ({ url: "" })}
            render={(it, s) => (
              <ImageUploader value={it.url || null} onChange={(url) => s({ url: url ?? "" })} folder="pages" aspectRatio="1/1" />
            )}
          />
        </div>
      );
    case "video":
      return (
        <div className="space-y-3">
          <Field label="Link do YouTube ou do vídeo">
            <input className={input} value={p.url ?? ""} onChange={(e) => set({ url: e.target.value })} placeholder="https://youtu.be/..." />
          </Field>
          <ImageUploader value={null} onChange={(url) => url && set({ url })} folder="pages" aspectRatio="16/9" allowVideo label="Ou envie um arquivo de vídeo" />
          <Field label="Legenda">
            <input className={input} value={p.caption ?? ""} onChange={(e) => set({ caption: e.target.value })} />
          </Field>
        </div>
      );
    case "button":
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Texto">
            <input className={input} value={p.label ?? ""} onChange={(e) => set({ label: e.target.value })} />
          </Field>
          <Field label="Link">
            <input className={input} value={p.href ?? ""} onChange={(e) => set({ href: e.target.value })} />
          </Field>
          <Field label="Estilo">
            <select className={input} value={p.variant ?? "solid"} onChange={(e) => set({ variant: e.target.value })}>
              <option value="solid">Preenchido</option>
              <option value="outline">Contorno</option>
              <option value="link">Link</option>
            </select>
          </Field>
          <Field label="Alinhamento">
            <select className={input} value={p.align ?? "center"} onChange={(e) => set({ align: e.target.value })}>
              <option value="left">Esquerda</option>
              <option value="center">Centro</option>
              <option value="right">Direita</option>
            </select>
          </Field>
        </div>
      );
    case "buttons":
      return (
        <div className="space-y-3">
          <Field label="Alinhamento">
            <select className={input} value={p.align ?? "center"} onChange={(e) => set({ align: e.target.value })}>
              <option value="left">Esquerda</option>
              <option value="center">Centro</option>
              <option value="right">Direita</option>
            </select>
          </Field>
          <RepeaterList
            items={p.items ?? []}
            onChange={(items) => set({ items })}
            addLabel="Adicionar botão"
            blank={() => ({ label: "Botão", href: "/", variant: "solid" })}
            render={(it, s) => (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input className={input} placeholder="Texto" value={it.label ?? ""} onChange={(e) => s({ label: e.target.value })} />
                <input className={input} placeholder="Link" value={it.href ?? ""} onChange={(e) => s({ href: e.target.value })} />
                <select className={input} value={it.variant ?? "solid"} onChange={(e) => s({ variant: e.target.value })}>
                  <option value="solid">Preenchido</option>
                  <option value="outline">Contorno</option>
                  <option value="link">Link</option>
                </select>
              </div>
            )}
          />
        </div>
      );
    case "spacer":
      return (
        <Field label={`Altura: ${p.size ?? 48}px`}>
          <input
            type="range"
            min={8}
            max={200}
            step={4}
            value={p.size ?? 48}
            onChange={(e) => set({ size: Number(e.target.value) })}
            className="w-full"
          />
        </Field>
      );
    case "divider":
      return <p className="text-xs text-primary-dark/50">Sem opções.</p>;
    case "columns":
      return (
        <div className="space-y-3">
          <Field label="Título">
            <input className={input} value={p.title ?? ""} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="Texto">
            <textarea rows={5} className={input} value={p.content ?? ""} onChange={(e) => set({ content: e.target.value })} />
          </Field>
          <Field label="Imagem">
            <ImageUploader value={p.image || null} onChange={(url) => set({ image: url ?? "" })} folder="pages" aspectRatio="4/3" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Lado da imagem">
              <select className={input} value={p.imageSide ?? "right"} onChange={(e) => set({ imageSide: e.target.value })}>
                <option value="left">Esquerda</option>
                <option value="right">Direita</option>
              </select>
            </Field>
            <Field label="Botão (texto)">
              <input className={input} value={p.buttonLabel ?? ""} onChange={(e) => set({ buttonLabel: e.target.value })} />
            </Field>
            <Field label="Botão (link)">
              <input className={input} value={p.buttonHref ?? ""} onChange={(e) => set({ buttonHref: e.target.value })} />
            </Field>
          </div>
        </div>
      );
    case "features":
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Título da seção (opcional)">
              <input className={input} value={p.title ?? ""} onChange={(e) => set({ title: e.target.value })} />
            </Field>
            <Field label="Colunas">
              <select className={input} value={p.columns ?? 3} onChange={(e) => set({ columns: Number(e.target.value) })}>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </Field>
          </div>
          <RepeaterList
            items={p.items ?? []}
            onChange={(items) => set({ items })}
            addLabel="Adicionar destaque"
            blank={() => ({ title: "Título", text: "Descrição", image: "" })}
            render={(it, s) => (
              <div className="space-y-2">
                <input className={input} placeholder="Título" value={it.title ?? ""} onChange={(e) => s({ title: e.target.value })} />
                <textarea rows={2} className={input} placeholder="Texto" value={it.text ?? ""} onChange={(e) => s({ text: e.target.value })} />
                <ImageUploader value={it.image || null} onChange={(url) => s({ image: url ?? "" })} folder="pages" aspectRatio="1/1" label="Ícone (opcional)" />
              </div>
            )}
          />
        </div>
      );
    case "cards":
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Título da seção (opcional)">
              <input className={input} value={p.title ?? ""} onChange={(e) => set({ title: e.target.value })} />
            </Field>
            <Field label="Colunas">
              <select className={input} value={p.columns ?? 3} onChange={(e) => set({ columns: Number(e.target.value) })}>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </Field>
          </div>
          <RepeaterList
            items={p.items ?? []}
            onChange={(items) => set({ items })}
            addLabel="Adicionar cartão"
            blank={() => ({ image: "", title: "Título", text: "", href: "" })}
            render={(it, s) => (
              <div className="space-y-2">
                <ImageUploader value={it.image || null} onChange={(url) => s({ image: url ?? "" })} folder="pages" aspectRatio="4/3" />
                <input className={input} placeholder="Título" value={it.title ?? ""} onChange={(e) => s({ title: e.target.value })} />
                <input className={input} placeholder="Descrição" value={it.text ?? ""} onChange={(e) => s({ text: e.target.value })} />
                <input className={input} placeholder="Link (opcional)" value={it.href ?? ""} onChange={(e) => s({ href: e.target.value })} />
              </div>
            )}
          />
        </div>
      );
    case "faq":
      return (
        <div className="space-y-3">
          <Field label="Título">
            <input className={input} value={p.title ?? ""} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <RepeaterList
            items={p.items ?? []}
            onChange={(items) => set({ items })}
            addLabel="Adicionar pergunta"
            blank={() => ({ q: "Pergunta", a: "Resposta" })}
            render={(it, s) => (
              <div className="space-y-2">
                <input className={input} placeholder="Pergunta" value={it.q ?? ""} onChange={(e) => s({ q: e.target.value })} />
                <textarea rows={3} className={input} placeholder="Resposta" value={it.a ?? ""} onChange={(e) => s({ a: e.target.value })} />
              </div>
            )}
          />
        </div>
      );
    case "stats":
      return (
        <RepeaterList
          items={p.items ?? []}
          onChange={(items) => set({ items })}
          addLabel="Adicionar número"
          blank={() => ({ value: "100", label: "descrição" })}
          render={(it, s) => (
            <div className="grid grid-cols-2 gap-2">
              <input className={input} placeholder="Valor" value={it.value ?? ""} onChange={(e) => s({ value: e.target.value })} />
              <input className={input} placeholder="Legenda" value={it.label ?? ""} onChange={(e) => s({ label: e.target.value })} />
            </div>
          )}
        />
      );
    case "testimonial":
      return (
        <div className="space-y-3">
          <Field label="Depoimento">
            <textarea rows={3} className={input} value={p.text ?? ""} onChange={(e) => set({ text: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nome">
              <input className={input} value={p.author ?? ""} onChange={(e) => set({ author: e.target.value })} />
            </Field>
            <Field label="Descrição (opcional)">
              <input className={input} value={p.role ?? ""} onChange={(e) => set({ role: e.target.value })} />
            </Field>
          </div>
          <ImageUploader value={p.avatar || null} onChange={(url) => set({ avatar: url ?? "" })} folder="pages" aspectRatio="1/1" label="Foto" />
        </div>
      );
    case "hero":
      return (
        <div className="space-y-3">
          <ImageUploader value={p.image || null} onChange={(url) => set({ image: url ?? "" })} folder="pages" aspectRatio="16/9" />
          <Field label="Título">
            <input className={input} value={p.title ?? ""} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="Subtítulo">
            <input className={input} value={p.subtitle ?? ""} onChange={(e) => set({ subtitle: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Botão (texto)">
              <input className={input} value={p.buttonLabel ?? ""} onChange={(e) => set({ buttonLabel: e.target.value })} />
            </Field>
            <Field label="Botão (link)">
              <input className={input} value={p.buttonHref ?? ""} onChange={(e) => set({ buttonHref: e.target.value })} />
            </Field>
            <Field label="Altura">
              <select className={input} value={p.height ?? "medium"} onChange={(e) => set({ height: e.target.value })}>
                <option value="small">Baixa</option>
                <option value="medium">Média</option>
                <option value="large">Alta</option>
              </select>
            </Field>
            <Field label="Alinhamento">
              <select className={input} value={p.align ?? "center"} onChange={(e) => set({ align: e.target.value })}>
                <option value="left">Esquerda</option>
                <option value="center">Centro</option>
                <option value="right">Direita</option>
              </select>
            </Field>
          </div>
        </div>
      );
    case "cta":
      return (
        <div className="space-y-3">
          <Field label="Título">
            <input className={input} value={p.title ?? ""} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="Texto">
            <input className={input} value={p.text ?? ""} onChange={(e) => set({ text: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Botão (texto)">
              <input className={input} value={p.buttonLabel ?? ""} onChange={(e) => set({ buttonLabel: e.target.value })} />
            </Field>
            <Field label="Botão (link)">
              <input className={input} value={p.buttonHref ?? ""} onChange={(e) => set({ buttonHref: e.target.value })} />
            </Field>
          </div>
        </div>
      );
    case "html":
      return (
        <Field label="Código HTML">
          <textarea rows={8} className={`${input} font-mono text-xs`} value={p.code ?? ""} onChange={(e) => set({ code: e.target.value })} />
        </Field>
      );
    default:
      return null;
  }
}

function StyleFields({ block, onChange }: { block: PageBlock; onChange: (b: PageBlock) => void }) {
  const s = block.style ?? {};
  const set = (patch: any) => onChange({ ...block, style: { ...s, ...patch } });
  if (block.type === "hero" || block.type === "spacer") return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 mt-3 border-t border-border">
      <Field label="Fundo">
        <select className={input} value={s.bg ?? "transparent"} onChange={(e) => set({ bg: e.target.value })}>
          <option value="transparent">Transparente</option>
          <option value="cream">Creme</option>
          <option value="white">Branco</option>
          <option value="sand">Areia</option>
          <option value="primary">Verde</option>
        </select>
      </Field>
      <Field label="Espaçamento">
        <select className={input} value={s.pad ?? "md"} onChange={(e) => set({ pad: e.target.value })}>
          <option value="none">Nenhum</option>
          <option value="sm">Pequeno</option>
          <option value="md">Médio</option>
          <option value="lg">Grande</option>
        </select>
      </Field>
      <Field label="Largura">
        <select className={input} value={s.width ?? "normal"} onChange={(e) => set({ width: e.target.value })}>
          <option value="narrow">Estreita</option>
          <option value="normal">Normal</option>
          <option value="wide">Larga</option>
          <option value="full">Total</option>
        </select>
      </Field>
    </div>
  );
}

/* ---------------- canvas item ---------------- */

function SortableBlock({
  block,
  selected,
  onSelect,
  onChange,
  onDelete,
  onDuplicate,
}: {
  block: PageBlock;
  selected: boolean;
  onSelect: () => void;
  onChange: (b: PageBlock) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const def = getBlockDef(block.type);
  const Icon = ICONS[def?.icon ?? "Type"] ?? Type;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative rounded-xl border bg-white overflow-hidden ${
        selected ? "border-primary ring-1 ring-primary/40" : "border-border"
      } ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-2 px-3 py-2 bg-cream/60 border-b border-border">
        <button type="button" {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing text-primary-dark/40 hover:text-primary">
          <GripVertical size={15} />
        </button>
        <Icon size={13} className="text-primary" />
        <span className="text-[11px] uppercase tracking-widest text-primary-dark/70 flex-1">{def?.label ?? block.type}</span>
        <button type="button" onClick={onSelect} className="text-primary-dark/40 hover:text-primary" title="Editar">
          <Settings2 size={14} />
        </button>
        <button type="button" onClick={onDuplicate} className="text-primary-dark/40 hover:text-primary" title="Duplicar">
          <Copy size={14} />
        </button>
        <button type="button" onClick={onDelete} className="text-primary-dark/40 hover:text-red-500" title="Excluir">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="relative cursor-pointer" onClick={onSelect}>
        <div className="pointer-events-none">
          <PageBlockView block={block} />
        </div>
      </div>

      {selected && (
        <div className="p-4 border-t border-border bg-cream/30">
          <BlockFields block={block} onChange={onChange} />
          <StyleFields block={block} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

/* ---------------- builder ---------------- */

export function PageBuilder({ blocks, onChange }: { blocks: PageBlock[]; onChange: (b: PageBlock[]) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const { setNodeRef: setCanvasRef, isOver } = useDroppable({ id: "canvas" });

  const groups = useMemo(() => {
    const g: Record<string, typeof BLOCK_LIBRARY> = {};
    BLOCK_LIBRARY.forEach((b) => {
      (g[b.group] ??= []).push(b);
    });
    return g;
  }, []);

  const add = (type: BlockType, index?: number) => {
    const b = createBlock(type);
    const next = [...blocks];
    next.splice(index ?? next.length, 0, b);
    onChange(next);
    setSelected(b.id);
  };

  const handleDragStart = (e: DragStartEvent) => setDragging(String(e.active.id));

  const handleDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const { active, over } = e;
    if (!over) return;
    const paletteType = active.data.current?.paletteType as BlockType | undefined;
    if (paletteType) {
      const overIndex = blocks.findIndex((b) => b.id === over.id);
      add(paletteType, overIndex >= 0 ? overIndex : blocks.length);
      return;
    }
    if (active.id !== over.id) {
      const from = blocks.findIndex((b) => b.id === active.id);
      const to = blocks.findIndex((b) => b.id === over.id);
      if (from >= 0 && to >= 0) onChange(arrayMove(blocks, from, to));
    }
  };

  const draggingPaletteDef = dragging?.startsWith("palette:")
    ? getBlockDef(dragging.replace("palette:", "") as BlockType)
    : null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5 items-start">
        <aside className="bg-white rounded-xl p-3 lg:sticky lg:top-4 max-h-[80vh] overflow-y-auto">
          <p className="text-[10px] uppercase tracking-widest text-primary-dark mb-2">Blocos</p>
          <p className="text-[10px] text-primary-dark/50 mb-3">Arraste para a página ou clique para adicionar no final.</p>
          <div className="space-y-4">
            {Object.entries(groups).map(([group, items]) => (
              <div key={group}>
                <p className="text-[10px] uppercase tracking-widest text-primary-dark/50 mb-1.5">{group}</p>
                <div className="space-y-1.5">
                  {items.map((b) => (
                    <div key={b.type} onClick={() => add(b.type)}>
                      <PaletteItem type={b.type} label={b.label} description={b.description} icon={b.icon} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div
          ref={setCanvasRef}
          className={`min-h-[300px] rounded-xl p-3 transition ${isOver ? "bg-primary/5 ring-1 ring-primary/30" : "bg-cream/60"}`}
        >
          {blocks.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-xl py-20 text-center text-sm text-primary-dark/50">
              Arraste um bloco para começar a montar a página.
            </div>
          ) : (
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {blocks.map((b) => (
                  <SortableBlock
                    key={b.id}
                    block={b}
                    selected={selected === b.id}
                    onSelect={() => setSelected(selected === b.id ? null : b.id)}
                    onChange={(nb) => onChange(blocks.map((x) => (x.id === nb.id ? nb : x)))}
                    onDelete={() => onChange(blocks.filter((x) => x.id !== b.id))}
                    onDuplicate={() => {
                      const idx = blocks.findIndex((x) => x.id === b.id);
                      const copy = { ...b, id: Math.random().toString(36).slice(2, 10) };
                      const next = [...blocks];
                      next.splice(idx + 1, 0, copy);
                      onChange(next);
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </div>

      <DragOverlay>
        {draggingPaletteDef ? (
          <div className="px-3 py-2 rounded-lg bg-primary text-white text-xs shadow-lg">{draggingPaletteDef.label}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default PageBuilder;
