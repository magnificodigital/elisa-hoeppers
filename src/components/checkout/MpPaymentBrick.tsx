import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    MercadoPago?: any;
  }
}

type Props = {
  publicKey: string;
  preferenceId: string;
  amountCents: number;
  orderCode: string;
  payerEmail?: string;
  onSuccess: (paymentId: string) => void;
  onPending?: (paymentId: string) => void;
  onError: (msg: string) => void;
};

export function MpPaymentBrick({
  publicKey,
  preferenceId,
  amountCents,
  orderCode,
  payerEmail,
  onSuccess,
  onPending,
  onError,
}: Props) {
  const brickRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [pix, setPix] = useState<{ qrBase64?: string; qrCode?: string } | null>(null);

  const cbRef = useRef({ onSuccess, onPending, onError });
  cbRef.current = { onSuccess, onPending, onError };

  useEffect(() => {
    let cancelled = false;

    async function waitForMpSdk(): Promise<any> {
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
            ...(payerEmail ? { payer: { email: payerEmail } } : {}),
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
            onSubmit: async ({ formData, selectedPaymentMethod }: any) => {
              try {
                const deviceId = (window as any).MP_DEVICE_SESSION_ID ?? null;
                const { data, error: fnErr } = await supabase.functions.invoke("create-payment", {
                  body: { action: "process", order_code: orderCode, formData, selectedPaymentMethod, device_id: deviceId },
                });
                if (fnErr) throw new Error(fnErr.message);
                const res: any = data;
                if (res?.error) throw new Error(res.error);

                if (res?.pix?.qr_base64 || res?.pix?.qr_code) {
                  setPix({ qrBase64: res.pix.qr_base64, qrCode: res.pix.qr_code });
                  return;
                }
                if (res?.status === "approved") {
                  cbRef.current.onSuccess(String(res.id ?? ""));
                  return;
                }
                if (res?.status === "pending" || res?.status === "in_process") {
                  cbRef.current.onPending?.(String(res.id ?? ""));
                  return;
                }
                throw new Error("Pagamento não aprovado. Tente outro método ou cartão.");
              } catch (e) {
                cbRef.current.onError((e as Error).message ?? "Falha ao processar pagamento");
                throw e;
              }
            },
            onError: (error: any) => {
              console.error("Bricks error:", error);
              cbRef.current.onError(error?.message ?? "Erro ao processar pagamento");
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
          cbRef.current.onError((e as Error).message);
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
  }, [publicKey, preferenceId, amountCents, orderCode, payerEmail]);

  if (pix) {
    return (
      <div className="text-center">
        <p className="text-sm text-primary-dark mb-3">Escaneie o QR Code no app do seu banco</p>
        {pix.qrBase64 && (
          <img
            src={`data:image/png;base64,${pix.qrBase64}`}
            alt="QR Code PIX"
            className="mx-auto w-56 h-56 object-contain"
          />
        )}
        {pix.qrCode && (
          <>
            <p className="text-xs text-primary-dark/70 mt-4 mb-1">Ou copie o código PIX:</p>
            <textarea
              readOnly
              value={pix.qrCode}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full text-xs p-2 border border-border rounded resize-none h-20"
            />
          </>
        )}
        <p className="text-xs mt-3 text-primary">Após o pagamento, a confirmação é automática.</p>
      </div>
    );
  }

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
