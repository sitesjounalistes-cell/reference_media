/**
 * Copie post-build pour le mode standalone (auto-hébergé) :
 *   .next/static → .next/standalone/.next/static
 *   public       → .next/standalone/public
 *
 * Remplace les « cp -r » du script npm, non portables sous le shell bun
 * de Windows. Vercel n'exécute pas ce script (il lance `next build` lui-même) ;
 * il ne sert qu'au démarrage autonome : `bun run start`.
 */
import { cpSync, existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const standalone = join(root, ".next", "standalone")

if (!existsSync(standalone)) {
  // Sur Vercel, la sortie standalone est désactivée (voir next.config.ts) :
  // absence normale, sortie propre sans échec du build.
  if (process.env.VERCEL) {
    console.log("Vercel détecté : sortie standalone désactivée, rien à copier.")
    process.exit(0)
  }
  console.error("Dossier .next/standalone introuvable — lancez d'abord `next build`.")
  process.exit(1)
}

mkdirSync(join(standalone, ".next"), { recursive: true })
cpSync(join(root, ".next", "static"), join(standalone, ".next", "static"), {
  recursive: true,
})
cpSync(join(root, "public"), join(standalone, "public"), { recursive: true })

console.log("Standalone complété : static + public copiés dans .next/standalone")
