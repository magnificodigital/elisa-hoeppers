import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

export function useNewOrderNotifications() {
  const { profile } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (profile?.role !== "admin" && profile?.role !== "instructor") return;

    const channel = supabase
      .channel("orders-new")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const order = payload.new as { code?: string; total_cents?: number };
          const total = ((order.total_cents ?? 0) / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });
          toast.success(`🛒 Novo pedido #${order.code} — ${total}`, {
            action: {
              label: "Ver",
              onClick: () => {
                window.location.href = "/admin/pedidos";
              },
            },
            duration: 10_000,
          });
          try {
            const audio = new Audio("/notification.mp3");
            audio.volume = 0.3;
            audio.play().catch(() => {});
          } catch {
            /* som opcional */
          }
          qc.invalidateQueries({ queryKey: ["admin-orders"] });
          qc.invalidateQueries({ queryKey: ["admin-orders-pending-count"] });
          qc.invalidateQueries({ queryKey: ["admin-actions-required"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.role, qc]);
}
