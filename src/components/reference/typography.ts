/**
 * REFERENCE.COM — Typographie éditoriale partagée.
 * Conversion des préférences de police/gras/italique (stockées sur l'article)
 * en CSS : utilisée par l'éditeur (aperçu live) et la vue article (rendu).
 */
import type { ArticleFont, ArticleTextStyle } from "@/components/reference/types"

/** Police → pile de fontes du thème (variables CSS de layout.tsx). */
export const ARTICLE_FONT_FAMILIES: Record<ArticleFont, string> = {
  serif: "var(--font-serif, Georgia, serif)",
  sans: "var(--font-geist-sans, system-ui, sans-serif)",
  archivo: "var(--font-display, system-ui, sans-serif)",
  mono: "var(--font-geist-mono, ui-monospace, monospace)",
}

/** Libellés du sélecteur de police dans le cockpit. */
export const ARTICLE_FONT_LABELS: Record<ArticleFont, string> = {
  serif: "Serif — Playfair",
  sans: "Sans — Geist",
  archivo: "Titre — Archivo",
  mono: "Mono — Geist",
}

/** Style d'un champ → propriétés CSS (vide = thème par défaut). */
export function textStyleToCss(
  style: ArticleTextStyle | null | undefined
): React.CSSProperties {
  if (!style) return {}
  return {
    ...(style.font ? { fontFamily: ARTICLE_FONT_FAMILIES[style.font] } : {}),
    ...(style.bold ? { fontWeight: 800 } : {}),
    ...(style.italic ? { fontStyle: "italic" } : {}),
  }
}
