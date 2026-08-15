import { createFileRoute, redirect } from "@tanstack/react-router";

// Retrocompat: /p/<slug> agora redireciona pra /<slug> (sem o prefixo /p).
export const Route = createFileRoute("/p/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/$slug", params: { slug: params.slug } });
  },
});
