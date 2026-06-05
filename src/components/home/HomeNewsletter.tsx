import { useEffect, useState } from "react";
import { Mail, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSetting } from "@/lib/settings";
import { track } from "@/lib/analytics";

const HomeNewsletter = () => {
  const [enabled, setEnabled] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSetting("newsletter_enabled").then((v) => setEnabled(v === "true")).catch(() => setEnabled(false));
  }, []);

  if (!enabled) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("subscribe-newsletter", {
        body: { email, full_name: name, source: "home" },
      });
      if (error) throw error;
      track("newsletter_subscribed", { source: "home" });
      setDone(true);
    } catch (err) {
      setError((err as Error).message ?? "Erro ao inscrever");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="py-20 md:py-28 bg-primary-dark">
      <div className="max-w-2xl mx-auto px-4 md:px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-cream/15 flex items-center justify-center mx-auto mb-5">
          <Mail size={24} className="text-cream" />
        </div>
        <h2 className="font-display text-3xl md:text-4xl text-cream mb-3">Receba dicas e novidades</h2>
        <p className="text-cream/80 mb-8 leading-relaxed">
          Práticas de yoga, dicas de aromaterapia e novidades das aulas direto no seu e-mail. Sem spam, prometo.
        </p>

        {done ? (
          <div className="inline-flex items-center gap-2 bg-cream/15 border border-cream/30 rounded-full px-6 py-3 text-cream">
            <Check size={18} />
            <span>Inscrita! 🌿 Em breve você recebe novidades.</span>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3 max-w-md mx-auto">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome (opcional)"
              className="w-full bg-cream/15 border border-cream/30 rounded-full px-5 py-3 text-cream placeholder-cream/60 focus:outline-none focus:border-cream"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu melhor e-mail"
              className="w-full bg-cream/15 border border-cream/30 rounded-full px-5 py-3 text-cream placeholder-cream/60 focus:outline-none focus:border-cream"
            />
            {error && <p className="text-sm text-red-200">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-cream text-primary-dark rounded-full px-6 py-3 font-medium uppercase tracking-widest text-sm hover:bg-white transition disabled:opacity-60"
            >
              {submitting ? "Inscrevendo…" : "Quero receber"}
            </button>
            <p className="text-xs text-cream/60 mt-3">
              Você pode se descadastrar a qualquer momento. Suas informações estão seguras.
            </p>
          </form>
        )}
      </div>
    </section>
  );
};

export default HomeNewsletter;
