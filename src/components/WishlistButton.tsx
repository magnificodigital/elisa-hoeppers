import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  isInWishlist,
  addToWishlist,
  removeFromWishlist,
} from "@/lib/wishlist";

export function WishlistButton({
  itemType,
  itemId,
  label = "Lista de desejos",
  className = "",
}: {
  itemType: "course" | "product";
  itemId: string;
  label?: string;
  className?: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: inList } = useQuery({
    queryKey: ["in-wishlist", user?.id, itemType, itemId],
    queryFn: () => isInWishlist(itemType, itemId),
    enabled: !!user,
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (inList) await removeFromWishlist(itemType, itemId);
      else await addToWishlist(itemType, itemId);
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["in-wishlist", user?.id, itemType, itemId],
      });
      qc.invalidateQueries({ queryKey: ["my-wishlist", user?.id] });
    },
  });

  return (
    <button
      type="button"
      onClick={() => {
        if (!user) {
          navigate({
            to: "/login",
            search: { next: window.location.pathname },
          });
          return;
        }
        toggle.mutate();
      }}
      disabled={toggle.isPending}
      className={`inline-flex items-center gap-2 text-sm transition ${
        inList ? "text-primary" : "text-primary-dark/70 hover:text-primary-dark"
      } ${className}`}
      aria-label={
        inList ? "Remover da lista de desejos" : "Adicionar à lista de desejos"
      }
    >
      <Bookmark className={`w-4 h-4 ${inList ? "fill-primary" : ""}`} />
      <span>{inList ? "Salvo" : label}</span>
    </button>
  );
}
