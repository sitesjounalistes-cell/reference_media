# REFERENCE.COM — Portail média francophone

Portail de connaissances et de presse en français : articles de fond, rubriques
thématiques, recherche plein texte, newsletter, régie publicitaire maison et
**cockpit rédaction** complet (articles, médiathèque, campagnes pub, messages,
paramètres du site).

## Stack

- **Next.js 16** (App Router, sortie `standalone`) + React 19
- **Prisma 6** + **PostgreSQL** (hébergement [Neon](https://neon.tech))
- Tailwind CSS 4 + shadcn/ui, Framer Motion, Recharts
- Bun comme runtime / gestionnaire de paquets

## Configuration

Copier `.env` (non versionné) à la racine avec :

```dotenv
# Base PostgreSQL (Neon)
DATABASE_URL=postgresql://<utilisateur>:<motdepasse>@<hote>.neon.tech/neondb?sslmode=require

# Cockpit rédaction (≥ 8 caractères ; générer par ex. : openssl rand -base64 18)
ADMIN_PASSWORD=...

# Clé de signature des sessions (≥ 32 caractères ; openssl rand -hex 48)
ADMIN_SESSION_SECRET=...
```

## Démarrage

```bash
bun install            # dépendances
bun run db:push        # applique le schéma Prisma à la base
bun run db:seed        # contenu éditorial (8 rubriques, 24 articles)
bun prisma/seed-ads.ts     # campagnes pub + statistiques de démonstration
bun prisma/seed-cockpit.ts # paramètres, annuaire, réseaux sociaux
bun run dev            # http://localhost:3000
bun prisma/verify-db.ts    # contrôle rapide du contenu de la base
```

## Sécurité intégrée

- **Cockpit protégé** : session cookie `httpOnly` signée HMAC-SHA256 (12 h),
  mot de passe à comparaison temps constant, garde `requireAdmin()` sur les
  33 handlers `/api/admin/*`, contrôle d'origine anti-CSRF.
- **Uploads durcis** : SVG et documents actifs refusés, vérification des
  magic bytes, quotas (30 import/h/IP), 200 Mo max.
- **Limitation de débit** sur login, newsletter, contact, vues, tracking pub.
- **Zéro donnée personnelle** sur les routes publiques (dashboard anonymisé,
  paramètres filtrés par liste blanche).
- **CSP stricte** + en-têtes de sécurité (`next.config.ts`), build TypeScript
  strict (`ignoreBuildErrors: false`).
- Tests de sécurité : `bun tests/security-check.ts`.

## Structure

```
prisma/            schéma, seeds, vérification base
src/app/api/       routes API (publiques + /api/admin protégées)
src/components/reference/   UI du portail + cockpit (login inclus)
src/lib/           auth admin, rate limiting, Prisma
public/uploads/    médiathèque (couvertures, créas publicitaires)
tests/             tests de sécurité
```

## Déploiement

Compatible Vercel / conteneur : `bun run build` produit un serveur
`standalone`. Variables d'environnement requises en production :
`DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`.
