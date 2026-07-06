import { createFileRoute } from "@tanstack/react-router";

function cleanPath(raw: string | null): string | null {
  if (!raw) return null;
  const path = raw.trim().replace(/^\/+/, "");
  if (!path || path.includes("\0") || path === ".." || path.startsWith("../") || path.includes("/../")) {
    return null;
  }
  return path;
}

export const Route = createFileRoute("/api/public/media")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const path = cleanPath(new URL(request.url).searchParams.get("path"));
        if (!path) return new Response("Invalid media path", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("media").createSignedUrl(path, 60 * 60);

        if (error || !data?.signedUrl) {
          return new Response("Media not found", { status: 404 });
        }

        return new Response(null, {
          status: 307,
          headers: {
            Location: data.signedUrl,
            "Cache-Control": "public, max-age=300",
          },
        });
      },
    },
  },
});