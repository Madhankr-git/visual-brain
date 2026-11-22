import { ROUTES, GLOBAL_APP_URL } from "./routes.js";

export { GLOBAL_APP_URL };
export const CANONICAL_BASE_DOMAIN = "https://visualbrain.madhankr.com";

export const ROUTE_METADATA = {
  [ROUTES.HOME]: {
    canonical: `${CANONICAL_BASE_DOMAIN}/`,
    title: "Visual Brain — Curated Visual Knowledge Graph for AI-Generated Imagery",
    description: "Visual Brain is a curated visual knowledge graph for understanding AI-generated imagery and creative decisions. Explore connections between prompts, styles, and photographic techniques."
  },
  [ROUTES.GALLERY]: {
    canonical: `${CANONICAL_BASE_DOMAIN}/gallery`,
    title: "Archive Gallery — Visual Brain",
    description: "Browse the curated visual archive of AI imagery, camera techniques, and creative style nodes in Visual Brain."
  },
  [ROUTES.WHY_VISUAL_BRAIN]: {
    canonical: `${CANONICAL_BASE_DOMAIN}/why-visual-brain`,
    title: "Why Visual Brain? — Visual Manifesto",
    description: "The philosophy behind Visual Brain: moving beyond chaotic generation to structured, intentional visual intelligence."
  },
  [ROUTES.HOW_IT_WORKS]: {
    canonical: `${CANONICAL_BASE_DOMAIN}/how-it-works`,
    title: "How It Works — Technical Architecture & Taxonomy",
    description: "An overview of Visual Brain's underlying node taxonomy, multi-tier schema, and real-time graph engine."
  },
  [ROUTES.ABOUT_CREATOR]: {
    canonical: `${CANONICAL_BASE_DOMAIN}/about-creator`,
    title: "About the Creator — Madhan KR",
    description: "Meet Madhan KR, creator and architect of Visual Brain."
  }
};

/**
 * Derives the canonical URL for a given path.
 * - Enforces absolute HTTPS URL with https://visualbrain.madhankr.com
 * - Strips query parameters (?search=..., ?ref=...)
 * - Strips URL fragments/hashes (#section)
 * - Normalizes trailing slashes (e.g. /gallery/ -> /gallery, while / remains /)
 * - Returns self-referencing canonical for public routes, falling back to homepage
 */
export function getCanonicalUrl(rawPath) {
  let path = rawPath;
  if (!path && typeof window !== "undefined") {
    path = window.location.pathname;
  }
  if (!path) return `${CANONICAL_BASE_DOMAIN}/`;

  // If a full URL was passed, parse its pathname
  try {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      const url = new URL(path);
      path = url.pathname;
    }
  } catch {
    // fallback to string manipulation
  }

  // 1. Exclude query parameters and URL fragments
  const cleanPath = path.split("?")[0].split("#")[0].trim().toLowerCase();

  // 2. Normalize trailing slashes (e.g. /gallery/ -> /gallery, while / remains /)
  const normalizedPath = cleanPath.length > 1 && cleanPath.endsWith("/")
    ? cleanPath.slice(0, -1)
    : cleanPath;

  // 3. Match against known public routes
  if (ROUTE_METADATA[normalizedPath]) {
    return ROUTE_METADATA[normalizedPath].canonical;
  }

  // Fallback for root or non-public routes (admin, login, 404)
  return `${CANONICAL_BASE_DOMAIN}/`;
}

/**
 * Updates DOM head tags for the active route:
 * - Updates or creates <link rel="canonical" href="...">
 * - Updates og:url and twitter:url meta tags
 * - Updates document.title and meta description if applicable
 */
export function updateRouteSeo(rawPath) {
  if (typeof document === "undefined") return;

  const path = rawPath || window.location.pathname;
  const canonicalUrl = getCanonicalUrl(path);

  // Normalize path to get metadata
  let cleanPath = path;
  try {
    if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
      cleanPath = new URL(cleanPath).pathname;
    }
  } catch {
    // fallback
  }
  cleanPath = cleanPath.split("?")[0].split("#")[0].trim().toLowerCase();
  const normalizedPath = cleanPath.length > 1 && cleanPath.endsWith("/")
    ? cleanPath.slice(0, -1)
    : cleanPath;

  const meta = ROUTE_METADATA[normalizedPath] || ROUTE_METADATA[ROUTES.HOME];

  // 1. Update/Inject <link rel="canonical">
  let canonicalTag = document.querySelector('link[rel="canonical"]');
  if (!canonicalTag) {
    canonicalTag = document.createElement("link");
    canonicalTag.setAttribute("rel", "canonical");
    document.head.appendChild(canonicalTag);
  }
  canonicalTag.setAttribute("href", canonicalUrl);

  // 2. Update Open Graph and Twitter URLs
  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute("content", canonicalUrl);

  const twitterUrl = document.querySelector('meta[name="twitter:url"]');
  if (twitterUrl) twitterUrl.setAttribute("content", canonicalUrl);

  // 3. Update Title
  if (meta?.title) {
    document.title = meta.title;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", meta.title);
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute("content", meta.title);
  }

  // 4. Update Description
  if (meta?.description) {
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) descMeta.setAttribute("content", meta.description);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", meta.description);
    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) twitterDesc.setAttribute("content", meta.description);
  }

  return canonicalUrl;
}
