import { useEffect } from "react";

export interface SEOProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  keywords?: string;
  noindex?: boolean;
}

export function useSEO({ title, description, canonicalPath, keywords, noindex }: SEOProps) {
  useEffect(() => {
    // 1. Titre
    const baseTitle = "Care4Success";
    document.title = title ? `${title} · ${baseTitle}` : "Care4Success – Plateforme d'excellence scolaire";

    // 2. Meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    if (description) {
      metaDescription.setAttribute("content", description);
    }

    // 3. Balise Canonique
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    const currentPath = canonicalPath || window.location.pathname;
    canonical.setAttribute("href", `https://care4success.usra-care.com${currentPath}`);

    // 4. Meta robots
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (metaRobots) {
      metaRobots.setAttribute(
        "content",
        noindex
          ? "noindex, nofollow"
          : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
      );
    }

    // 5. OpenGraph
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && title) {
      ogTitle.setAttribute("content", `${title} · ${baseTitle}`);
    }
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && description) {
      ogDesc.setAttribute("content", description);
    }
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute("content", `https://care4success.usra-care.com${currentPath}`);
    }
  }, [title, description, canonicalPath, keywords, noindex]);
}
