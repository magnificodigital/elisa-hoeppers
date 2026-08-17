// Meta Pixel (Facebook/Instagram) — eventos de e-commerce para catálogo/anúncios.
// content_ids usa o SLUG do produto, que é o mesmo id do feed (g:id) — isso é o
// que faz a "correspondência do catálogo" no Gerenciador de Comércio.

const PIXEL_ID = "1242306342290974";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: unknown;
  }
}

let initialized = false;

export function initMetaPixel(): void {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;
  /* eslint-disable */
  (function (f: any, b: Document, e: string, v: string) {
    if (f.fbq) return;
    const n: any = (f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode?.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
  window.fbq?.("init", PIXEL_ID);
}

export function pixelPageView(): void {
  if (typeof window === "undefined") return;
  window.fbq?.("track", "PageView");
}

export function pixelTrack(event: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.fbq?.("track", event, params);
}
