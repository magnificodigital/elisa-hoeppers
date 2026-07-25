import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

declare global {
  interface Window {
    MercadoPago?: any;
  }
}

type Props = {
  publicKey: string;
  preferenceId: string;
  amountCents: number;
  onSuccess: (paymentId: string) => void;
  onError: (msg: string) => void;
};

export function MpPaymentBrick({ publicKey, preferenceId, amountCents, onSuccess, onError }: Props) {
  const brickRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function waitForMpSdk(): Promise<any> {
      // Injeta o script se ainda não existir
      if (!window.MercadoPago && !document.querySelector('script[src="https://sdk.mercadopago.com/js/v2"]')) {
        const s = document.createElement("script");
        s.src = "https://sdk.mercadopago.com/js/v2";
        s.async = true;
        document.head.appendChild(s);
      }
      for (let i = 0; i < 80; i++) {
        if (window.MercadoPago) return window.MercadoPago;
        await new Promise((r) => setTimeout(r, 100));
      }
      throw new Error("MP SDK não carregou. Recarregue a página.");
    }

    async function init() {
      try {
        if (!publicKey) throw new Error("Public Key MP não configurada. Vá em Admin → Integrações → Mercado Pago.");
        if (!preferenceId) throw new Error("Preference ID ausente");

        const MP = await waitForMpSdk();
        if (cancelled) return;

        const mp = new MP(publicKey, { locale: "pt-BR" });
        const bricksBuilder = mp.bricks();

        const settings = {
          initialization: {
            amount: amountCents / 100,
            preferenceId: preferenceId,
          },
          customization: {
            paymentMethods: {
              creditCard: "all",
              debitCard: "all",
              bankTransfer: "all",
            },
            visual: {
              style: { theme: "default" },
            },
          },
          callbacks: {
            onReady: () => {
              if (cancelled) return;
              setLoading(false);
            },
            onSubmit: async (_data: any) => {
              // Bricks processa o pagamento internamente via preferenceId.
              return new Promise((resolve) => resolve(true));
            },
            onError: (error: any) => {
              console.error("Bricks error:", error);
              onError(error?.message ?? "Erro ao processar pagamento");
            },
            onPaymentMethodReceived: (data: any) => {
              console.log("Método selecionado:", data);
            },
          },
        };

        const brick = await bricksBuilder.create("payment", "mp-payment-container", settings);

        if (!cancelled) {
          brickRef.current = brick;
        } else {
          try { brick.unmount(); } catch {}
        }
      } catch (e) {
        if (!cancelled) {
          setInitError((e as Error).message);
          setLoading(false);
          onError((e as Error).message);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (brickRef.current?.unmount) {
        try { brickRef.current.unmount(); } catch {}
      }
    };
  }, [publicKey, preferenceId, amountCents, onError]);

  if (initError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-900">Não conseguimos carregar o pagamento</p>
          <p className="text-xs text-red-800 mt-1">{initError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[200px]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-cream/60 z-10 rounded-lg">
          <div className="flex items-center gap-2 text-primary-dark">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Preparando pagamento...</span>
          </div>
        </div>
      )}
      <div id="mp-payment-container" />
    </div>
  );
}
