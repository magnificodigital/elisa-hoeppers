// Meta Pixel (Facebook/Instagram) — eventos de e-commerce para catálogo/anúncios.
// O carregamento base (loader + init + PageView inicial) fica no <head> em __root.
// Aqui só disparamos PageView nas navegações internas (SPA) e os eventos de compra.
// content_ids usa o SLUG do produto, que é o mesmo id do feed (g:id) — é isso que
// faz a "correspondência do catálogo" no Gerenciador de Comércio.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export function pixelPageView(): void {
  if (typeof window === "undefined") return;
  window.fbq?.("track", "PageView");
}

export function pixelTrack(event: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.fbq?.("track", event, params);
}
