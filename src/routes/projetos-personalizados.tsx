import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { BodyogaHeader } from "@/components/bodyoga/BodyogaHeader";
import Footer from "@/components/Footer";
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

export const Route = createFileRoute("/projetos-personalizados")({
  head: () => ({
    meta: [
      { title: "Projetos Sob Medida | BODYOGA" },
      { name: "description", content: "Fragrâncias exclusivas e brindes personalizados para sua empresa ou evento." },
    ],
  }),
  component: CustomProjectsPage,
});

function CustomProjectsPage() {
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
      const { data, error } = await supabase
        .from("custom_project_requests")
        .insert([values])
        .select()
        .single();

      if (error) throw error;

      // Notify Elisa
      await supabase.functions.invoke("send-notification", {
        body: {
          type: "project_request",
          record_id: data.id,
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
      window.scrollTo(0, 0);
    } catch (error: any) {
      console.error(error);
      toast.error("Não foi possível enviar sua solicitação. Tente novamente ou fale no WhatsApp.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F7F0E5] text-[#3B4F30] flex flex-col">
        <BodyogaHeader alwaysGreen />
        <main className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-[#3B4F30]" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl">Recebemos sua solicitação!</h1>
            <p className="text-lg opacity-80 leading-relaxed">
              A Elisa vai te responder em breve pelo email ou WhatsApp para conversarmos sobre os próximos passos.
            </p>
            <div className="pt-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#3B4F30] text-[#F7F0E5] rounded-full text-xs uppercase tracking-[0.2em] font-bold hover:opacity-90 transition shadow-lg"
              >
                Voltar à loja
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F0E5] text-[#3B4F30] flex flex-col">
      <BodyogaHeader alwaysGreen />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-[#3B4F30] text-[#F7F0E5] py-20 md:py-32">
          <div className="container mx-auto px-6 max-w-4xl text-center space-y-6">
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl leading-tight">
              Projetos sob medida
            </h1>
            <p className="text-xl md:text-2xl font-light opacity-90 max-w-2xl mx-auto leading-relaxed">
              Fragrâncias exclusivas e brindes personalizados para sua empresa ou evento.
            </p>
          </div>
        </section>

        {/* Form Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-6 max-w-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60 ml-2">Nome *</label>
                  <input
                    {...register("name")}
                    className="w-full bg-white/50 border border-[#3B4F30]/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#3B4F30]/20 transition"
                    placeholder="Seu nome completo"
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1 ml-2">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60 ml-2">Email *</label>
                  <input
                    {...register("email")}
                    type="email"
                    className="w-full bg-white/50 border border-[#3B4F30]/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#3B4F30]/20 transition"
                    placeholder="exemplo@email.com"
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1 ml-2">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60 ml-2">WhatsApp *</label>
                  <input
                    {...register("whatsapp")}
                    className="w-full bg-white/50 border border-[#3B4F30]/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#3B4F30]/20 transition"
                    placeholder="(00) 00000-0000"
                  />
                  {errors.whatsapp && <p className="text-xs text-red-500 mt-1 ml-2">{errors.whatsapp.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60 ml-2">Empresa</label>
                  <input
                    {...register("company")}
                    className="w-full bg-white/50 border border-[#3B4F30]/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#3B4F30]/20 transition"
                    placeholder="Nome da empresa (opcional)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60 ml-2">CNPJ</label>
                  <input
                    {...register("cnpj")}
                    className="w-full bg-white/50 border border-[#3B4F30]/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#3B4F30]/20 transition"
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60 ml-2">Tipo de projeto *</label>
                  <select
                    {...register("project_type")}
                    className="w-full bg-white/50 border border-[#3B4F30]/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#3B4F30]/20 transition appearance-none"
                  >
                    <option value="fragrancia">Fragrância personalizada</option>
                    <option value="brinde">Brinde corporativo</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60 ml-2">Quantidade estimada</label>
                  <input
                    {...register("quantity_estimate")}
                    className="w-full bg-white/50 border border-[#3B4F30]/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#3B4F30]/20 transition"
                    placeholder="Ex: 100 a 200 unidades"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60 ml-2">Prazo desejado</label>
                  <input
                    {...register("deadline")}
                    className="w-full bg-white/50 border border-[#3B4F30]/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#3B4F30]/20 transition"
                    placeholder="Para quando você precisa?"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60 ml-2">Conte sobre o projeto *</label>
                <textarea
                  {...register("brief")}
                  rows={4}
                  className="w-full bg-white/50 border border-[#3B4F30]/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#3B4F30]/20 transition resize-none"
                  placeholder="Descreva sua ideia, objetivo e qualquer detalhe importante..."
                />
                {errors.brief && <p className="text-xs text-red-500 mt-1 ml-2">{errors.brief.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60 ml-2">Faixa de investimento (opcional)</label>
                <select
                  {...register("budget_range")}
                  className="w-full bg-white/50 border border-[#3B4F30]/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#3B4F30]/20 transition appearance-none"
                >
                  <option value="">Selecione uma faixa</option>
                  <option value="até 2k">Até R$ 2.000</option>
                  <option value="2-5k">R$ 2.000 a R$ 5.000</option>
                  <option value="5-10k">R$ 5.000 a R$ 10.000</option>
                  <option value="acima 10k">Acima de R$ 10.000</option>
                  <option value="não sei">Ainda não sei</option>
                </select>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-[#3B4F30] text-[#F7F0E5] rounded-full text-sm uppercase tracking-[0.25em] font-bold hover:opacity-90 transition shadow-xl disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Solicitar projeto
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
