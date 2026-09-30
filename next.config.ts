import type { NextConfig } from "next";

/**
 * En-têtes de sécurité appliqués à toutes les réponses.
 * - CSP : bloque l'injection de scripts externes ou d'objets, interdit
 *   l'encadrement du site (clickjacking) et les soumissions vers d'autres
 *   origines. 'unsafe-inline' reste nécessaire aux scripts/styles
 *   d'hydratation de Next.js (passer aux nonces si possible un jour).
 *   'unsafe-eval' n'est toléré qu'en développement (HMR/React Refresh).
 * - COOP : isole les popups ouverts par le site (rel="noopener" défensif).
 * - CORP : empêche d'autres sites d'intégrer nos ressources.
 * - HSTS : force HTTPS pendant un an (ignoré par les navigateurs en HTTP dev).
 */
const isDev = process.env.NODE_ENV !== "production"

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ")

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // Les erreurs de type DOIVENT bloquer le build (aucun contournement silencieux).
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
