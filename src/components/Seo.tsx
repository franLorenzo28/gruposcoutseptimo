import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

type SeoEntry = {
  title: string;
  description: string;
  fullTitle?: boolean;
  ogImageAlt?: string;
};

const BASE_URL = "https://gruposcoutseptimo.vercel.app";
const SITE_NAME = "Grupo Scout Séptimo";
const DEFAULT_DESCRIPTION =
  "Grupo Scout Séptimo de Montevideo. Comunidad scout con 61 años de historia formando líderes comprometidos. Campamentos, BAUEN, actividades y valores scout en Uruguay.";
const DEFAULT_TITLE = "Grupo Scout Séptimo - Montevideo | Scouts Uruguay";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`;

const ROUTE_SEO: Record<string, SeoEntry> = {
  "/": {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    fullTitle: true,
    ogImageAlt: "Grupo Scout Séptimo - Montevideo Uruguay",
  },
  "/historia": {
    title: "Historia del Grupo Scout",
    description:
      "Historia del Grupo Scout Séptimo en Montevideo: hitos, tradición y servicio en el Movimiento Scout del Uruguay.",
  },
  "/movimiento-scout": {
    title: "Movimiento Scout en Uruguay",
    description:
      "Conocé el Movimiento Scout del Uruguay, su propósito educativo y cómo el Grupo Scout Séptimo aporta a la comunidad.",
  },
  "/bauen": {
    title: "BAUEN del Grupo Scout",
    description:
      "Información sobre BAUEN, campamentos y actividades del Grupo Scout Séptimo en Montevideo.",
  },
  "/contacto": {
    title: "Contacto",
    description:
      "Contactá al Grupo Scout Séptimo de Montevideo. Sumate a nuestras actividades y conocé cómo participar.",
  },
  "/narrativas": {
    title: "Narrativas y relatos",
    description:
      "Narrativas del Grupo Scout Séptimo: relatos, memorias y experiencias de nuestras ramas y actividades.",
  },
  "/unidades/manada": {
    title: "Manada",
    description:
      "Manada del Grupo Scout Séptimo: actividades formativas para niños y niñas en Montevideo.",
  },
  "/unidades/tropa": {
    title: "Tropa",
    description:
      "Tropa Scout del Grupo Scout Séptimo: aventuras, patrullas y formación en valores scout.",
  },
  "/unidades/pioneros": {
    title: "Pioneros",
    description:
      "Rama Pioneros del Grupo Scout Séptimo: proyectos, liderazgo juvenil y servicio comunitario.",
  },
  "/unidades/rovers": {
    title: "Rovers",
    description:
      "Rama Rovers del Grupo Scout Séptimo: vocación de servicio, crecimiento personal y compromiso.",
  },
  "/unidades/staff": {
    title: "Staff",
    description:
      "Staff del Grupo Scout Séptimo: apoyo, logística y acompañamiento de las actividades del grupo.",
  },
  "/unidades/comite": {
    title: "Comité",
    description:
      "Comité del Grupo Scout Séptimo: gestión, coordinación y respaldo institucional del grupo.",
  },
};

const NOINDEX_PREFIXES = [
  "/area-miembros",
  "/dashboard",
  "/admin",
  "/perfil",
  "/configuracion",
  "/auth",
  "/login",
  "/usuarios",
  "/mensajes",
  "/grupos",
  "/verificar-email",
  "/archivo",
  "/cancionero",
  "/galeria",
  "/eventos",
  "/dirigentes",
  "/veteranos",
  "/test-diagnostic",
];

const normalizePath = (pathname: string) =>
  pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

const shouldNoIndex = (pathname: string) =>
  NOINDEX_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export default function Seo() {
  const { pathname } = useLocation();
  const normalizedPath = normalizePath(pathname);
  const entry = ROUTE_SEO[normalizedPath];
  const noIndex = shouldNoIndex(normalizedPath);
  const title = entry?.fullTitle ? entry.title : entry?.title ? `${entry.title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const description = entry?.description ?? DEFAULT_DESCRIPTION;
  const canonical = `${BASE_URL}${normalizedPath === "/" ? "/" : normalizedPath}`;
  const ogImageAlt = entry?.ogImageAlt ?? "Grupo Scout Séptimo - Montevideo Uruguay";

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: canonical,
    inLanguage: "es-UY",
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: `${BASE_URL}/`,
    },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: DEFAULT_OG_IMAGE,
    },
  };

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={DEFAULT_OG_IMAGE} />
      <meta property="og:image:alt" content={ogImageAlt} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="es_UY" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
      <meta name="twitter:image:alt" content={ogImageAlt} />
      {noIndex ? (
        <>
          <meta name="robots" content="noindex, nofollow" />
          <meta name="googlebot" content="noindex, nofollow" />
        </>
      ) : null}
      <script type="application/ld+json">{JSON.stringify(webPageJsonLd)}</script>
    </Helmet>
  );
}
