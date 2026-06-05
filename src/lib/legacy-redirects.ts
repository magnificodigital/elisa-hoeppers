/**
 * Lookup de 301 redirects das URLs antigas do WP.
 * Retorna null se o path atual NÃO é uma URL legada e deve seguir o fluxo normal do TanStack.
 */

export type LegacyRedirect = { destination: string; status: 301 | 410 };

// ============== EXATOS (caminho → destino) ==============
const EXACT: Record<string, string> = {
  // home + páginas com slug diferente
  "/home": "/",
  "/store": "/loja",
  "/cart": "/carrinho",
  "/checkout-2-2": "/checkout",
  "/book-appointment": "/agende-sua-aula",
  "/my-bookings": "/painel",
  "/thank-you": "/",
  "/obrigado": "/",
  "/lp-term-conditions": "/termos",
  "/cadastro-de-instrutores": "/cadastro-de-alunos",

  // bookingpress velho (todo o fluxo abandonado)
  "/cancel-appointment": "/agende-sua-aula",
  "/cancel-payment": "/agende-sua-aula",
  "/appointment-reschedule": "/agende-sua-aula",
  "/appointment-cancellation-confirmation": "/agende-sua-aula",
  "/bookingpress-complete-payment": "/agende-sua-aula",
  "/bookingpress-complete-payment-2": "/agende-sua-aula",
  "/bookingpress-complete-payment-3": "/agende-sua-aula",

  // posts do blog (slug WP era root, agora vai pra /blog/...)
  "/5-beneficios-do-yoga-para-a-saude-mental": "/blog/5-beneficios-do-yoga-para-a-saude-mental",
  "/como-usar-oleos-essenciais-na-rotina-de-cuidados-pessoais": "/blog/como-usar-oleos-essenciais-na-rotina-de-cuidados-pessoais",
  "/os-diferentes-tipos-de-yoga-e-como-escolher-o-seu": "/blog/os-diferentes-tipos-de-yoga-e-como-escolher-o-seu",
};

// ============== PREFIXOS (path começa com X → reescrever) ==============
type PrefixRule = {
  prefix: string;
  rewrite: (rest: string) => string;
};

const PREFIXES: PrefixRule[] = [
  // /product/<slug>  →  /loja/<slug>   (Woo legado)
  { prefix: "/product/", rewrite: (rest) => `/loja/${rest}` },

  // /produtos/<slug>  →  /loja/<slug>   (variação de slug em PT)
  { prefix: "/produtos/", rewrite: (rest) => `/loja/${rest}` },

  // /courses/<slug>  →  /cursos/<slug>   (LearnPress)
  // mas /courses/<slug>/lessons/<x> cai aqui também — leva pro curso pai
  {
    prefix: "/courses/",
    rewrite: (rest) => {
      const slug = rest.split("/")[0];
      return `/cursos/${slug}`;
    },
  },

  // /course/<slug>  →  /cursos/<slug>  (singular)
  {
    prefix: "/course/",
    rewrite: (rest) => {
      const slug = rest.split("/")[0];
      return `/cursos/${slug}`;
    },
  },

  // /lessons/<slug>  →  /cursos  (lessons soltas, sem saber pai)
  { prefix: "/lessons/", rewrite: () => "/cursos" },

  // /lesson/<slug>  →  /cursos
  { prefix: "/lesson/", rewrite: () => "/cursos" },

  // /category/<x>, /tag/<x>  →  /blog
  { prefix: "/category/", rewrite: () => "/blog" },
  { prefix: "/tag/", rewrite: () => "/blog" },
  { prefix: "/author/", rewrite: () => "/" },

  // bookingpress + cartflows
  { prefix: "/bookingpress-", rewrite: () => "/agende-sua-aula" },
  { prefix: "/store-checkout", rewrite: () => "/checkout" },
  { prefix: "/checkout-", rewrite: () => "/checkout" },
];

// ============== REGEX (paths complicados) ==============
type RegexRule = { test: RegExp; status: 301 | 410; destination?: string };

const REGEX: RegexRule[] = [
  // todo o /wp-* vai 410 Gone (parar de aparecer no Google)
  { test: /^\/wp-admin(\/|$)/, status: 410 },
  { test: /^\/wp-login\.php/, status: 410 },
  { test: /^\/wp-content(\/|$)/, status: 410 },
  { test: /^\/wp-includes(\/|$)/, status: 410 },
  { test: /^\/wp-cron\.php/, status: 410 },
  { test: /^\/wp-json(\/|$)/, status: 410 },
  { test: /^\/xmlrpc\.php/, status: 410 },
  { test: /^\/readme\.html/, status: 410 },
  { test: /^\/license\.txt/, status: 410 },

  // feeds RSS antigos
  { test: /^\/feed(\/|$)/, status: 301, destination: "/blog" },
  { test: /^\/comments\/feed(\/|$)/, status: 301, destination: "/blog" },

  // URLs com ?p=N (legacy permalink)
  // ⚠️ tratada no handler porque depende da search param, não do path
];

// ============== ENTRY POINT ==============
export function findLegacyRedirect(url: URL): LegacyRedirect | null {
  const path = url.pathname.replace(/\/+$/, ""); // remove trailing slash (exceto root)
  const normalized = path === "" ? "/" : path;

  // 1) Exato
  if (EXACT[normalized]) {
    return { destination: EXACT[normalized], status: 301 };
  }

  // 2) Regex (inclui 410)
  for (const r of REGEX) {
    if (r.test.test(normalized)) {
      return {
        destination: r.destination ?? "/",
        status: r.status,
      };
    }
  }

  // 3) Prefixos
  for (const p of PREFIXES) {
    if (normalized.startsWith(p.prefix)) {
      const rest = normalized.slice(p.prefix.length);
      return { destination: p.rewrite(rest), status: 301 };
    }
  }

  // 4) Caso especial: /?p=NNN (legacy permalink WP)
  if (normalized === "/" && url.searchParams.has("p")) {
    return { destination: "/blog", status: 301 };
  }

  return null;
}
