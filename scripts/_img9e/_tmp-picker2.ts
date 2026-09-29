/**
 * _tmp-picker2 : seconde passe (task 9-e) — choix éditoriaux explicites + replis automatiques.
 * - corrige le parsing des dimensions JPEG (density 1x1) : dernier couple plausible
 * - durcit captionIsBad (watermark, sous-titres, pub, illustration, infographie…)
 * - PICKS : candidat retenu par slug (JSON + index), suivi des replis du même JSON
 *   puis des autres JSON disponibles (<slug>-4/-3/-2.json puis <slug>.json)
 * - télécharge curl 90 s ×2 ; fichier ≥ 15 Ko ; MIME réel ; largeur ≥ 700
 * - remplace public/uploads/<slug>.<ext> (supprime l'ancien si extension différente)
 * - réécrit scripts/_img9e/mapping.json
 */
import { existsSync, readFileSync, writeFileSync, statSync, renameSync, unlinkSync } from "fs"

const WORK = "/home/z/my-project/scripts/_img9e"
const OUT = "/home/z/my-project/public/uploads"
const TMP = `/tmp/img-dl2-${Date.now()}`

// Déjà installées et validées éditorialement (aucune reprise)
const KEEP = new Set([
  "trous-noirs-expliques",
  "disparition-abeilles-consequences",
  "microbiote-second-cerveau",
  "amazonie-poumon-fragile",
  "jeune-intermittent-science",
  "inflation-expliquee",
])

// Choix éditoriaux : slug → { json: suffixe ("", "-2", "-3", "-4"), idx: index du candidat }
const PICKS: Record<string, { json: string; idx: number }> = {
  "ia-generative-fonctionnement": { json: "", idx: 1 },
  "marie-curie-pionniere": { json: "", idx: 0 },
  "megalithes-pyramides-construction": { json: "", idx: 1 },
  "oceans-eponges-climat": { json: "-3", idx: 2 },
  "pourquoi-mentons-nous": { json: "-4", idx: 0 },
  "beethoven-genie-silence": { json: "", idx: 1 },
  "economie-attention": { json: "", idx: 3 },
  "joconde-fascination": { json: "", idx: 0 },
  "informatique-quantique-revolution": { json: "", idx: 0 },
  "taux-directeur-banque-centrale": { json: "", idx: 0 },
  "pourquoi-le-ciel-est-bleu": { json: "", idx: 1 },
  "sommeil-profond-cerveau": { json: "-2", idx: 1 },
  "crispr-revolution-genetique": { json: "", idx: 0 },
  "chute-empire-romain": { json: "", idx: 4 },
  "effet-pygmalion-attentes": { json: "", idx: 0 },
  "villes-futur-urbanisme-climat": { json: "", idx: 2 },
  "mythes-grecs-heritage": { json: "-2", idx: 1 },
  "histoire-internet-arpanet-web": { json: "-2", idx: 4 },
}

type Res = { original_url: string; caption?: string; source?: string; original_width?: string; original_height?: string }
type Entry = { file: string; url: string; caption: string; source: string; bytes: number; width: number; height: number }

function px(v?: string): number {
  const n = Number((v || "").replace(/[^\d]/g, ""))
  return Number.isFinite(n) ? n : 0
}

function captionIsBad(cap: string): boolean {
  const c = (cap || "").toLowerCase()
  if (!c) return false
  if (/watermark|filigrane/.test(c) && !/no watermark|sans filigrane/.test(c)) return true
  if (/depositphotos|shutterstock|dreamstime|123rf|alamy|istock|getty images|stock ?photo/.test(c)) return true
  if (/logo/.test(c) && !/without logo|no logo/.test(c)) return true
  if (/subtitle|sous-?titre|text overlay|infographic|data chart|bar chart|diagram|book cover|product image/.test(c)) return true
  if (/collage|clip ?art|cartoon|illustration|3d render|advertisement|advertis|painting|artwork/.test(c)) return true
  return false
}

function jpegDims(out: string): { w: number; h: number } {
  const matches = [...out.matchAll(/(\d{3,5})x(\d{3,5})/g)]
  for (let i = matches.length - 1; i >= 0; i--) {
    const w = +matches[i][1]
    const h = +matches[i][2]
    if (w >= 300 && w <= 20000 && h >= 200 && h <= 20000) return { w, h }
  }
  return { w: 0, h: 0 }
}

function realInfo(path: string): { mime: string; ext: string; w: number; h: number } | null {
  try {
    const out = Bun.spawnSync(["file", "-b", path]).stdout.toString()
    if (/JPEG image data/i.test(out)) {
      const { w, h } = jpegDims(out)
      return { mime: "image/jpeg", ext: "jpg", w, h }
    }
    if (/PNG image data/i.test(out)) {
      const m = out.match(/(\d+) x (\d+)/)
      return { mime: "image/png", ext: "png", w: m ? +m[1] : 0, h: m ? +m[2] : 0 }
    }
    if (/Web\/P image|RIFF.*WebP/i.test(out)) {
      const m = [...out.matchAll(/(\d{3,5}) x?(\d{3,5})/g)].pop()
      return { mime: "image/webp", ext: "webp", w: m ? +m[1] : 0, h: m ? +m[2] : 0 }
    }
  } catch {}
  return null
}

function download(url: string): boolean {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const dl = Bun.spawnSync(["curl", "-sSL", "--max-time", "90", "-o", TMP, "-w", "%{http_code}", url], { timeout: 100_000 })
    if (dl.stdout.toString().trim() === "200" && statSync(TMP).size >= 15_000) return true
  }
  return false
}

const oldMapping: Record<string, Entry> = (() => {
  try { return JSON.parse(readFileSync(`${WORK}/mapping.json`, "utf8")) } catch { return {} }
})()
const mapping: Record<string, Entry> = { ...oldMapping }

function load(suffix: string): Res[] {
  const p = `${WORK}/${slugSuffix(suffix)}`
  try {
    const d = JSON.parse(readFileSync(p, "utf8"))
    if (d.success && Array.isArray(d.results)) return d.results
  } catch {}
  return []
}
let CURRENT = ""
function slugSuffix(s: string) { return CURRENT + (s || "") + ".json" }

function orderedLists(slug: string): Res[][] {
  CURRENT = slug
  const pick = PICKS[slug]
  const suffixes = [pick?.json, "-4", "-3", "-2", ""].filter((s, i, arr) => s !== undefined && arr.indexOf(s) === i)
  const lists: Res[][] = []
  for (const s of suffixes) {
    const res = load(s)
    if (!res.length) continue
    if (pick && s === pick.json && res[pick.idx]) {
      lists.push([res[pick.idx], ...res.filter((_, i) => i !== pick.idx)])
    } else {
      lists.push(res)
    }
  }
  return lists
}

const slugs = readFileSync(`${WORK}/queries.tsv`, "utf8").split("\n").map((l) => l.split("|")[0].trim()).filter(Boolean)
const failures: string[] = []

for (const slug of slugs) {
  if (KEEP.has(slug)) { console.log(`KEEP ${slug}`); continue }
  const lists = orderedLists(slug)
  if (!lists.length) { failures.push(slug); console.error(`!! ${slug} : aucun candidat`); continue }

  const scored = lists.flat()
    .map((r, i) => {
      const w = px(r.original_width)
      const h = px(r.original_height)
      const cap = r.caption || ""
      const ratio = h > 0 ? w / h : 0
      let score = 1000 - i * 2 // 1000+ : le choix éditorial passe toujours en premier
      if (i >= lists[0].length) score = 100 - i * 2
      if (w >= 1200) score += 15
      else if (w >= 900) score += 8
      if (ratio >= 1.3 && ratio <= 2.4) score += 25
      else if (ratio >= 1.0) score += 12
      else if (ratio > 0 && ratio < 0.95) score -= 30
      if (cap && !captionIsBad(cap)) score += 10
      if (captionIsBad(cap)) score -= 200
      return { r, w, h, cap, score }
    })
    .sort((a, b) => b.score - a.score)

  let installed: Entry | null = null
  for (const cand of scored) {
    const url = cand.r.original_url
    if (!url || !download(url)) continue
    const info = realInfo(TMP)
    if (!info) continue
    if (info.w && info.w < 700) continue
    const size = statSync(TMP).size
    const file = `${slug}.${info.ext}`
    const previous = oldMapping[slug]?.file
    if (previous && previous !== file && existsSync(`${OUT}/${previous}`)) {
      try { unlinkSync(`${OUT}/${previous}`) } catch {}
    }
    renameSync(TMP, `${OUT}/${file}`)
    installed = { file, url, caption: (cand.cap || "sans légende").replace(/\s+/g, " ").trim(), source: cand.r.source || "?", bytes: size, width: info.w, height: info.h }
    break
  }

  if (installed) {
    mapping[slug] = installed
    console.log(`OK ${slug} → ${installed.file} (${Math.round(installed.bytes / 1024)} Ko, ${installed.width}x${installed.height}, ${installed.source})`)
  } else {
    failures.push(slug)
    console.error(`!! ${slug} : aucun candidat téléchargeable`)
  }
}

writeFileSync(`${WORK}/mapping.json`, JSON.stringify(mapping, null, 2))
writeFileSync(`${WORK}/failures2.txt`, failures.join("\n"))
console.log(`\nTOTAL MAPPING: ${Object.keys(mapping).length}/24`)
if (failures.length) console.log(`ÉCHECS: ${failures.join(", ")}`)
