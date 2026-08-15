import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";

const STORAGE_KEY = "elisa.cookies.consent.v1";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setShow(true);
  }, []);

  function accept(level: "essential" | "all") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ level, at: Date.now() }));
    setShow(false);
    // dispara evento pra GA inicializar se aceito
    window.dispatchEvent(new CustomEvent("elisa-consent-change", { detail: { level } }));
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-primary text-cream">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center gap-4 relative">
        <p className="text-xs md:text-sm leading-relaxed flex-1 pr-8 md:pr-0">
          Usamos cookies essenciais para o site funcionar e cookies analíticos opcionais para
          entender o uso geral. Saiba mais na nossa{" "}
          <Link to="/p/privacidade" className="underline hover:text-peach">
            Política de Privacidade
          </Link>
          .
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => accept("essential")}
            className="border border-cream/40 text-cream px-4 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-cream/10 transition"
          >
            Só essenciais
          </button>
          <button
            onClick={() => accept("all")}
            className="bg-cream text-primary px-5 py-2 rounded-full text-xs uppercase tracking-widest font-semibold hover:bg-white transition"
          >
            Aceitar todos
          </button>
        </div>
        <button
          onClick={() => accept("essential")}
          className="text-cream/70 hover:text-cream md:hidden absolute top-2 right-2"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
