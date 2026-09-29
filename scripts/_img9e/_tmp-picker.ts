/**
 * _tmp-picker : sélectionne + télécharge la meilleure photo par article.
 * - lit scripts/_img9e/<slug>.json (résultats image-search)
 * - filtre : résolution ≥ 800px, pas de watermark/logo, paysage si possible
 * - télécharge, vérifie taille > 15 Ko + vrai type MIME via `file`
 * - installe dans public/uploads/<slug>.<ext> (ext selon type réel)
 * - écrit scripts/_img9e/mapping.json
 */
import { existsSync, readFileSync, writeFileSync, statSync, renameSync, mkdirSync } from "fs"

const WORK = "/home/z/my-project/scripts/_img9e"
const OUT = "/home/z/my-project/public/uploads"
const SLUGS = readFileSync(`${WORK}/queries.tsv`, "utf8")
  .split("\n")
  .map((l) => l.split("|")[0].trim())
  .filter(Boolean)

type Res = {
  original_url: string
  caption?: string
  source?: string
  original_width?: string
  original_height?: string
}

function px(v?: string): number {
  const n = Number((v || "").replace(/[^\d]/g, ""))
  return Number.isFinite(n) ? n : 0
}

function captionIsBad(cap: string): boolean {
  const c = cap.toLowerCase()
  if (/watermark/.test(c) && !/no watermark/.test(c)) return true
  if (/filigrane|tattoo|stock photo|depositphotos|shutterstock|dreamstime|alamy|getty images|istock/.test(c)) return true
  if (/logo/.test(c) && !/without logo/.test(c)) return true
  if (/collage|clip ?art|3d render|cartoon|illustration 3d/.test(c)) return true
  return false
}

function realInfo(path: string): { mime: string; ext: string; w: number; h: number } | null {
  try {
    const out = Bun.spawnSync(["file", "-b", path]).stdout.toString()
    if (/JPEG image data/i.test(out)) {
      const m = out.match(/(\d+)x(\d+)/)
      return { mime: "image/jpeg", ext: "jpg", w: m ? +m[1] : 0, h: m ? +m[2] : 0 }
    }
    if (/PNG image data/i.test(out)) {
      const m = out.match(/(\d+) x (\d+)/)
      return { mime: "image/png", ext: "png", w: m ? +m[1] : 0, h: m ? +m[2] : 0 }
    }
    if (/Web\/P image|RIFF.*WebP/i.test(out)) {
      const m = out.match(/(\d+) x (\d+)/)
      return { mime: "image/webp", ext: "webp", w: m ? +m[1] : 0, h: m ? +m[2] : 0 }
    }
  } catch {}
  return null
}

const mapping: Record<string, { file: string; url: string; caption: string; source: string; bytes: number; width: number; height: number }> = {}
const failures: string[] = []

mkdirSync(OUT, { recursive: true })
const tmp = `/tmp/img-dl-${Date.now()}`

for (const slug of SLUGS) {
  const jsonPath = `${WORK}/${slug}.json`
  if (!existsSync(jsonPath)) {
    failures.push(slug)
    console.error(`!! ${slug} : pas de résultat de recherche`)
    continue
  }
  let data: { success: boolean; results?: Res[] }
  try {
    data = JSON.parse(readFileSync(jsonPath, "utf8"))
  } catch {
    failures.push(slug)
    console.error(`!! ${slug} : JSON illisible`)
    continue
  }
  if (!data.success || !Array.isArray(data.results) || data.results.length === 0) {
    failures.push(slug)
    console.error(`!! ${slug} : recherche sans résultat`)
    continue
  }

  const scored = data.results
    .map((r, i) => {
      const w = px(r.original_width)
      const h = px(r.original_height)
      const cap = r.caption || ""
      let score = 100 - i * 2
      if (w >= 1000) score += 15
      if (w >= 800) score += 8
      if (h > 0 && w / h >= 1.2) score += 25
      if (h > 0 && w / h >= 1.0 && w / h < 1.2) score += 12
      if (h > 0 && w / h < 0.95) score -= 30 // portrait pénalisé
      if (cap && !captionIsBad(cap)) score += 10
      if (cap && captionIsBad(cap)) score -= 200
      return { r, w, h, cap, score }
    })
    .sort((a, b) => b.score - a.score)

  let installed: (typeof mapping)[string] | null = null
  for (const cand of scored.slice(0, 4)) {
    const url = cand.r.original_url
    try {
      const dl = Bun.spawnSync(
        ["curl", "-sSL", "--max-time", "40", "-o", tmp, "-w", "%{http_code}", url],
        { timeout: 50_000 }
      )
      const code = dl.stdout.toString().trim()
      if (code !== "200") continue
      const size = statSync(tmp).size
      if (size < 15_000) continue
      const info = realInfo(tmp)
      if (!info) continue
      if (info.w && info.w < 700) continue
      const file = `${slug}.${info.ext}`
      renameSync(tmp, `${OUT}/${file}`)
      installed = {
        file,
        url,
        caption: (cand.cap || "sans légende").replace(/\s+/g, " ").trim(),
        source: cand.r.source || "?",
        bytes: size,
        width: info.w,
        height: info.h,
      }
      break
    } catch {
      continue
    }
  }
  if (installed) {
    mapping[slug] = installed
    console.log(
      `OK ${slug} → ${installed.file} (${Math.round(installed.bytes / 1024)} Ko, ${installed.width}x${installed.height}, ${installed.source})`
    )
  } else {
    failures.push(slug)
    console.error(`!! ${slug} : aucun candidat téléchargeable`)
  }
}

writeFileSync(`${WORK}/mapping.json`, JSON.stringify(mapping, null, 2))
writeFileSync(`${WORK}/failures.txt`, failures.join("\n"))
console.log(`\nINSTALLÉS: ${Object.keys(mapping).length}/${SLUGS.length}`)
if (failures.length) console.log(`ÉCHECS: ${failures.join(", ")}`)
