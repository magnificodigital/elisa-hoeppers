import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/configuracoes/newsletter")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/broadcast" });
  },
});
