// Centralized Dynamic Routing and Link Configuration
// Designed to support local dev, staging, and future production live domains.

export const APP_CONFIG = {
  getLiveDomain: () => {
    if (typeof window !== "undefined") {
      return import.meta.env.VITE_APP_DOMAIN || window.location.origin;
    }
    return "";
  },
  basePath: import.meta.env.BASE_URL || "/"
};

export const ROUTES = {
  // Public Viewer Routes
  HOME: "/",
  GALLERY: "/gallery",
  WHY_VISUAL_BRAIN: "/why-visual-brain",
  HOW_IT_WORKS: "/how-it-works",
  ABOUT_CREATOR: "/about-creator",
  
  // Administrator Routes
  ADMIN: "/admin",
  ADMIN_GALLERY: "/admin/gallery",
  LOGIN: "/login"
};

export const ROLES = {
  USER: "user",
  ADMIN: "admin"
};

export function getRouteUrl(path, absolute = false) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (absolute) {
    const domain = APP_CONFIG.getLiveDomain().replace(/\/$/, "");
    return `${domain}${cleanPath}`;
  }
  return cleanPath;
}

export function parseRoute(pathname = window.location.pathname) {
  const clean = pathname.toLowerCase();
  
  const isWhyVisualBrain = clean === "/why-visual-brain" || clean === "/why-visual-brain/";
  const isHowItWorks = clean === "/how-it-works" || clean === "/how-it-works/";
  const isAboutCreator = clean === "/about-creator" || clean === "/about-creator/";
  const isAdmin = clean.startsWith("/admin");
  const isLogin = clean === "/login";
  const isGallery = clean === "/gallery" || clean === "/admin/gallery";

  return {
    role: isAdmin ? ROLES.ADMIN : ROLES.USER,
    isLogin,
    isWhyVisualBrain,
    isHowItWorks,
    isAboutCreator,
    view: isGallery ? "gallery" : "connections",
    path: pathname
  };
}

export function navigateTo(path) {
  if (typeof window !== "undefined") {
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }
}
