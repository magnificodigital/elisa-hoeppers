import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  GripVertical, 
  Trash2, 
  Copy, 
  ChevronUp, 
  ChevronDown, 
  Plus,
  Monitor,
  Smartphone,
  Tablet,
  Eye,
  Settings,
  Type,
  Image as ImageIcon,
  Video,
  Layout,
  Instagram,
  ShoppingCart,
  GraduationCap,
  MessageSquare,
  HelpCircle,
  Users,
  BarChart3,
  Clock,
  User,
  Mail,
  PenTool,
  Calendar,
  Columns,
  Square,
  Maximize2,
  Minus,
  Move,
  ArrowUp,
  ArrowDown,
  Globe
} from "lucide-react";
import { useState } from "react";
import { BLOCKS, createBlockInstance, type BlockType, type BlockDef } from "@/lib/block-registry";
import { RenderBlocks } from "./RenderBlocks";
import { ImageUploader } from "../ImageUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PageBuilderProps {
  blocks: any[];
  onChange: (blocks: any[]) => void;
  pageData?: any;
  onPageDataChange?: (data: any) => void;
}

export function PageBuilderUX({ blocks, onChange, pageData, onPageDataChange }: PageBuilderProps) {

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      onChange(arrayMove(blocks, oldIndex, newIndex));
    }
  };

  const addBlock = (type: BlockType) => {
    const newBlock = createBlockInstance(type);
    onChange([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const updateBlockProps = (id: string, props: any) => {
    onChange(blocks.map(b => b.id === id ? { ...b, props: { ...b.props, ...props } } : b));
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const duplicateBlock = (id: string) => {
    const index = blocks.findIndex(b => b.id === id);
    const block = blocks[index];
    const newBlock = { ...block, id: Math.random().toString(36).substr(2, 9) };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    onChange(newBlocks);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-gray-50 border border-border rounded-xl overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-border z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 rounded-md transition ${viewMode === 'desktop' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Monitor size={16} />
            </button>
            <button 
              onClick={() => setViewMode('tablet')}
              className={`p-1.5 rounded-md transition ${viewMode === 'tablet' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Tablet size={16} />
            </button>
            <button 
              onClick={() => setViewMode('mobile')}
              className={`p-1.5 rounded-md transition ${viewMode === 'mobile' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Smartphone size={16} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <Eye size={14} /> Pré-visualizar
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Palette */}
        <div className="w-80 bg-white border-r border-border flex flex-col z-10">
          <Tabs defaultValue="add" className="w-full flex flex-col h-full">
            <TabsList className="bg-white/50 border-b border-border p-1 rounded-none flex h-auto">
              <TabsTrigger value="add" className="flex-1 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary py-3">
                <Plus size={16} className="mr-2" />
                Blocos
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex-1 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary py-3">
                <Globe size={16} className="mr-2" />
                SEO
              </TabsTrigger>
            </TabsList>

            <TabsContent value="add" className="flex-1 overflow-y-auto p-4 space-y-2 mt-0">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary-dark/40 mb-3">Escolha um bloco</h3>
              {Object.values(BLOCKS).map((def) => (
                <button
                  key={def.type}
                  onClick={() => addBlock(def.type)}
                  className="w-full flex items-start gap-3 p-3 text-left bg-gray-50 hover:bg-primary/5 hover:border-primary/30 border border-transparent rounded-xl transition group"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:text-primary transition">
                    <BlockIcon type={def.type} size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary-dark leading-none mb-1">{def.label}</p>
                    <p className="text-[10px] text-primary-dark/50 leading-tight">{def.desc}</p>
                  </div>
                </button>
              ))}
            </TabsContent>

            <TabsContent value="seo" className="flex-1 overflow-y-auto p-6 space-y-6 mt-0">
               <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary-dark/40 mb-3">Otimização (SEO)</h3>
               <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-primary-dark/70 font-bold">Título da Página (SEO)</label>
                    <input 
                      type="text" 
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white" 
                      value={pageData?.seo_title || ''} 
                      onChange={(e) => onPageDataChange?.({ seo_title: e.target.value })}
                      placeholder={pageData?.title}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-primary-dark/70 font-bold">Descrição (Meta Description)</label>
                    <textarea 
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white" 
                      rows={4}
                      value={pageData?.seo_description || ''} 
                      onChange={(e) => onPageDataChange?.({ seo_description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-primary-dark/70 font-bold">Imagem de Compartilhamento (OG)</label>
                    <ImageUploader 
                      value={pageData?.og_image || null} 
                      onChange={(url) => onPageDataChange?.({ og_image: url || "" })} 
                      aspectRatio="1200/630" 
                      label="Selecionar Imagem OG"
                    />
                  </div>
               </div>
            </TabsContent>
          </Tabs>
        </div>


        {/* Center: Live Preview */}
        <div className="flex-1 bg-gray-100 overflow-y-auto p-8 flex justify-center items-start">
          <div 
            className={`bg-white shadow-2xl transition-all duration-300 min-h-full ${
              viewMode === 'mobile' ? 'w-[375px]' : 
              viewMode === 'tablet' ? 'w-[768px]' : 'w-full max-w-[1200px]'
            }`}
          >
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                {blocks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                    <Layout size={48} strokeWidth={1} className="mb-4 opacity-20" />
                    <p>Sua página está vazia.</p>
                    <p className="text-sm">Clique em um bloco à esquerda para começar.</p>
                  </div>
                ) : (
                  <div className="flex flex-col w-full">
                    {blocks.map((block) => (
                      <SortableBlock 
                        key={block.id}
                        block={block}
                        isSelected={selectedBlockId === block.id}
                        onSelect={() => setSelectedBlockId(block.id)}
                        onRemove={() => removeBlock(block.id)}
                        onDuplicate={() => duplicateBlock(block.id)}
                        onMoveUp={() => {
                          const idx = blocks.findIndex(b => b.id === block.id);
                          if (idx > 0) onChange(arrayMove(blocks, idx, idx - 1));
                        }}
                        onMoveDown={() => {
                          const idx = blocks.findIndex(b => b.id === block.id);
                          if (idx < blocks.length - 1) onChange(arrayMove(blocks, idx, idx + 1));
                        }}
                      />
                    ))}
                  </div>
                )}
              </SortableContext>

              <DragOverlay>
                {activeId ? (
                  <div className="bg-white border-2 border-primary/50 shadow-lg p-4 rounded-lg opacity-80 cursor-grabbing">
                    <p className="text-xs font-medium">Movendo bloco...</p>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>

        {/* Right Sidebar: Properties */}
        <div className="w-80 bg-white border-l border-border flex flex-col z-10">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary-dark/60">Propriedades</h3>
            {selectedBlock && (
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">
                {selectedBlock.type}
              </span>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {!selectedBlock ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-8">
                <Settings size={32} strokeWidth={1} className="mb-4 opacity-20" />
                <p className="text-sm italic">Selecione um bloco no centro para editar suas propriedades.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="pb-4 border-b border-border">
                  <p className="text-sm font-bold text-primary-dark mb-1">{BLOCKS[selectedBlock.type as BlockType].label}</p>
                  <p className="text-xs text-primary-dark/50">{BLOCKS[selectedBlock.type as BlockType].desc}</p>
                </div>

                <div className="space-y-4">
                  {BLOCKS[selectedBlock.type as BlockType].fields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-widest text-primary-dark/70 font-bold">
                        {field.label}
                      </label>
                      <FieldInput 
                        field={field} 
                        value={selectedBlock.props[field.key]} 
                        onChange={(val) => updateBlockProps(selectedBlock.id, { [field.key]: val })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: any, value: any, onChange: (v: any) => void }) {
  const inputCls = "w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary transition-all";

  switch (field.type) {
    case 'text':
      return <input type="text" className={inputCls} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'textarea':
      return <textarea className={inputCls} rows={4} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'number':
      return <input type="number" className={inputCls} value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} />;
    case 'boolean':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span className="text-sm text-primary-dark">Ativo</span>
        </label>
      );
    case 'select':
      return (
        <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
          {field.options.map((opt: any) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    case 'image':
    case 'video':
      return (
        <ImageUploader 
          value={value || null} 
          onChange={(url) => onChange(url || "")} 
          aspectRatio="16/9" 
          allowVideo={field.type === 'video'}
          label={`Selecionar ${field.type === 'image' ? 'Imagem' : 'Vídeo'}`}
        />
      );
    case 'link':
      return (
        <div className="flex gap-2">
          <input type="text" className={inputCls} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="/loja ou #produtos" />
        </div>
      );
    case 'list': {
      const items: any[] = Array.isArray(value) ? value : [];
      const itemFields: any[] = field.itemFields ?? [];
      const addItem = () => {
        const blank: any = {};
        itemFields.forEach((f) => { blank[f.key] = f.type === 'boolean' ? false : ''; });
        onChange([...items, blank]);
      };
      const updateItem = (idx: number, key: string, val: any) => {
        onChange(items.map((it, i) => (i === idx ? { ...it, [key]: val } : it)));
      };
      const removeItem = (idx: number) => onChange(items.filter((_, i) => i !== idx));
      const moveItem = (idx: number, dir: -1 | 1) => {
        const j = idx + dir;
        if (j < 0 || j >= items.length) return;
        const copy = [...items];
        [copy[idx], copy[j]] = [copy[j], copy[idx]];
        onChange(copy);
      };
      return (
        <div className="space-y-3">
          {items.length === 0 && (
            <p className="text-xs text-gray-400 italic">Nenhum item ainda. Adicione o primeiro abaixo.</p>
          )}
          {items.map((item, idx) => (
            <div key={idx} className="border border-border rounded-lg p-3 bg-gray-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary-dark/40">
                  Item {idx + 1}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveItem(idx, -1)}
                    disabled={idx === 0}
                    className="p-1 text-gray-400 hover:text-primary disabled:opacity-30 transition"
                    title="Subir"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(idx, 1)}
                    disabled={idx === items.length - 1}
                    className="p-1 text-gray-400 hover:text-primary disabled:opacity-30 transition"
                    title="Descer"
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1 text-gray-400 hover:text-red-500 transition"
                    title="Remover"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {itemFields.map((f) => (
                <div key={f.key} className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-primary-dark/60 font-bold">
                    {f.label}
                  </label>
                  <FieldInput
                    field={f}
                    value={item?.[f.key]}
                    onChange={(val) => updateItem(idx, f.key, val)}
                  />
                </div>
              ))}
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="w-full py-2 border-2 border-dashed border-primary/30 rounded-lg text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 transition"
          >
            + Adicionar item
          </button>
        </div>
      );
    }
    default:
      return <p className="text-xs text-red-500 italic">Tipo "{field.type}" não implementado</p>;
  }
}

function SortableBlock({ block, isSelected, onSelect, onRemove, onDuplicate, onMoveUp, onMoveDown }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`relative group transition-all ${isDragging ? 'opacity-30 z-0' : 'z-auto'}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Block Outline */}
      <div 
        className={`absolute -inset-[2px] pointer-events-none transition-opacity rounded-[2px] ${
          isSelected ? 'border-2 border-primary opacity-100 z-20' : 'border border-primary/20 opacity-0 group-hover:opacity-100 z-10'
        }`}
      />

      {/* Mini Controls */}
      {(isSelected || !isDragging) && (
        <div className={`absolute top-2 right-2 flex items-center gap-1 z-30 opacity-0 transition-opacity ${
          isSelected ? 'opacity-100' : 'group-hover:opacity-100'
        }`}>
          <div className="flex items-center bg-white border border-border shadow-sm rounded-lg overflow-hidden">
            <button 
              {...listeners} {...attributes}
              className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-primary transition cursor-grab"
            >
              <GripVertical size={14} />
            </button>
            <div className="w-[1px] h-4 bg-border" />
            <button 
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
              className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-primary transition"
            >
              <ArrowUp size={14} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
              className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-primary transition"
            >
              <ArrowDown size={14} />
            </button>
            <div className="w-[1px] h-4 bg-border" />
            <button 
              onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
              className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-primary transition"
            >
              <Copy size={14} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-red-500 transition"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Actual Content Render */}
      <div className="w-full">
        <RenderBlocks blocks={[block]} />
      </div>
    </div>
  );
}

function BlockIcon({ type, size = 16 }: { type: BlockType, size?: number }) {
  switch (type) {
    case 'hero': return <Maximize2 size={size} />;
    case 'text': return <Type size={size} />;
    case 'products': return <ShoppingCart size={size} />;
    case 'categories': return <Layout size={size} />;
    case 'image-text': return <Columns size={size} />;
    case 'gallery': return <ImageIcon size={size} />;
    case 'image': return <ImageIcon size={size} />;
    case 'video': return <Video size={size} />;
    case 'cta': return <Square size={size} />;
    case 'faq': return <HelpCircle size={size} />;
    case 'testimonials': return <MessageSquare size={size} />;
    case 'stats': return <BarChart3 size={size} />;
    case 'benefits': return <Users size={size} />;
    case 'timeline': return <Clock size={size} />;
    case 'author': return <User size={size} />;
    case 'courses': return <GraduationCap size={size} />;
    case 'instagram': return <Instagram size={size} />;
    case 'newsletter': return <Mail size={size} />;
    case 'custom-projects': return <PenTool size={size} />;
    case 'yoga-classes': return <Calendar size={size} />;
    case 'columns': return <Columns size={size} />;
    case 'shortcut-banner': return <Layout size={size} />;
    case 'spacer': return <Move size={size} />;
    default: return <Square size={size} />;
  }
}
