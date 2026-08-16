import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const formSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  whatsapp: z.string().min(10, "WhatsApp é obrigatório"),
  company: z.string().optional(),
  cnpj: z.string().optional(),
  project_type: z.enum(["fragrancia", "brinde", "outro"], {
    required_error: "Selecione o tipo de projeto",
  }),
  quantity_estimate: z.string().optional(),
  deadline: z.string().optional(),
  brief: z.string().min(10, "Conte um pouco mais sobre o projeto"),
  budget_range: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CustomProjectFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function CustomProjectForm({ onSuccess, className }: CustomProjectFormProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      project_type: "fragrancia",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("custom_project_requests")
        .insert([values]);

      if (error) throw error;

      // Notify Elisa
      await supabase.functions.invoke("send-notification", {
        body: {
          type: "project_request",
          payload: {
            name: values.name,
            email: values.email,
            whatsapp: values.whatsapp,
            company: values.company,
            project_type: values.project_type,
            brief: values.brief,
          },
        },
      }).catch(console.error);

      setIsSuccess(true);
      reset();
      onSuccess?.();
    } catch (error: any) {
      console.error(error);
      toast.error("Não foi possível enviar sua solicitação. Tente novamente ou fale no WhatsApp.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`text-center space-y-6 py-10 ${className}`}>
        <div className="flex justify-center">
          <CheckCircle2 className="w-16 h-16 text-[#3B4F30]" />
        </div>
        <h2 className="font-display text-2xl md:text-3xl text-[#3B4F30]">Recebemos sua solicitação!</h2>
        <p className="text-lg text-[#3B4F30]/80 leading-relaxed max-w-sm mx-auto">
          A Elisa vai te responder em breve pelo email ou WhatsApp para conversarmos sobre os próximos passos.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60 ml-2 text-[#3B4F30]">Nome *</label>
          <input
            {...register("name")}
            className="w-full bg-white border border-[#3B4F30]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B4F30]/20 transition"
            placeholder="Seu nome completo"
          />
          {errors.name && <p className="text-[10px] text-red-500 mt-1 ml-2">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60 ml-2 text-[#3B4F30]">Email *</label>
          <input
            {...register("email")}
            type="email"
            className="w-full bg-white border border-[#3B4F30]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B4F30]/20 transition"
            placeholder="exemplo@email.com"
          />
          {errors.email && <p className="text-[10px] text-red-500 mt-1 ml-2">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60 ml-2 text-[#3B4F30]">WhatsApp *</label>
          <input
            {...register("whatsapp")}
            className="w-full bg-white border border-[#3B4F30]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B4F30]/20 transition"
            placeholder="(00) 00000-0000"
          />
          {errors.whatsapp && <p className="text-[10px] text-red-500 mt-1 ml-2">{errors.whatsapp.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60 ml-2 text-[#3B4F30]">Empresa</label>
          <input
            {...register("company")}
            className="w-full bg-white border border-[#3B4F30]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B4F30]/20 transition"
            placeholder="Nome da empresa (opcional)"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60 ml-2 text-[#3B4F30]">CNPJ</label>
          <input
            {...register("cnpj")}
            className="w-full bg-white border border-[#3B4F30]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B4F30]/20 transition"
            placeholder="00.000.000/0000-00"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60 ml-2 text-[#3B4F30]">Tipo de projeto *</label>
          <select
            {...register("project_type")}
            className="w-full bg-white border border-[#3B4F30]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B4F30]/20 transition appearance-none"
          >
            <option value="fragrancia">Fragrância personalizada</option>
            <option value="brinde">Brinde corporativo</option>
            <option value="outro">Outro</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60 ml-2 text-[#3B4F30]">Conte sobre o projeto *</label>
        <textarea
          {...register("brief")}
          rows={3}
          className="w-full bg-white border border-[#3B4F30]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B4F30]/20 transition resize-none"
          placeholder="Descreva sua ideia, objetivo e detalhes..."
        />
        {errors.brief && <p className="text-[10px] text-red-500 mt-1 ml-2">{errors.brief.message}</p>}
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-[#3B4F30] text-[#F7F0E5] rounded-full text-[11px] uppercase tracking-[0.2em] font-bold hover:opacity-90 transition shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              Solicitar projeto
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
