// Script temporaire (task 9-e) : recherche d'images éditoriales pour les 24 articles.
// 1 requête FR par article, parallélisation limitée, sortie JSON par slug dans /tmp/imgsearch/
import { execFile } from "node:child_process"
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs"

const OUT = "/tmp/imgsearch"
mkdirSync(OUT, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const JOBS = [
  { slug: "histoire-internet-arpanet-web", q: "salle de serveurs avec câbles réseau dans un data center" },
  { slug: "mythes-grecs-heritage", q: "statue antique grecque en marbre d'un dieu au musée" },
  { slug: "villes-futur-urbanisme-climat", q: "immeubles verts avec façades végétalisées dans une ville moderne" },
  { slug: "effet-pygmalion-attentes", q: "maîtresse d'école aidant des élèves dans une vraie salle de classe" },
  { slug: "inflation-expliquee", q: "caddie plein de courses dans un rayon de supermarché" },
  { slug: "jeune-intermittent-science", q: "assiette de nourriture saine équilibrée sur une table de cuisine" },
  { slug: "amazonie-poumon-fragile", q: "vue aérienne de la forêt amazonienne avec une rivière" },
  { slug: "microbiote-second-cerveau", q: "boîte de Pétri en laboratoire de microbiologie" },
  { slug: "chute-empire-romain", q: "ruines du forum romain avec colonnes antiques à Rome" },
  { slug: "crispr-revolution-genetique", q: "scientifique avec pipette dans un laboratoire de génétique" },
  { slug: "sommeil-profond-cerveau", q: "personne endormie paisiblement dans son lit la nuit" },
  { slug: "pourquoi-le-ciel-est-bleu", q: "grand ciel bleu avec des nuages cumulus au-dessus d'un paysage" },
  { slug: "taux-directeur-banque-centrale", q: "tour de la banque centrale européenne à Francfort" },
  { slug: "informatique-quantique-revolution", q: "ordinateur quantique avec son cryostat doré en laboratoire" },
  { slug: "joconde-fascination", q: "tableau de la Joconde exposé au musée du Louvre" },
  { slug: "economie-attention", q: "personne absorbée par son smartphone dans la rue le soir" },
  { slug: "beethoven-genie-silence", q: "partition musicale manuscrite ancienne posée sur un piano" },
  { slug: "disparition-abeilles-consequences", q: "abeille en macro sur une fleur qui butine" },
  { slug: "pourquoi-mentons-nous", q: "portrait d'une personne qui cache sa bouche avec la main" },
  { slug: "oceans-eponges-climat", q: "récif corallien coloré avec des poissons sous l'eau" },
  { slug: "megalithes-pyramides-construction", q: "pyramides de Gizeh en Égypte sous le soleil" },
  { slug: "marie-curie-pionniere", q: "Marie Curie photographie historique noir et blanc au laboratoire" },
  { slug: "ia-generative-fonctionnement", q: "gros plan sur une puce électronique et une carte mère d'ordinateur" },
  { slug: "trous-noirs-expliques", q: "image du trou noir dans l'espace avec disque d'accrétion" },
]

function extractJson(text) {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) return null
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }
}

function runOne(job) {
  return new Promise((resolve) => {
    const args = [
      "image-search",
      "-q", job.q,
      "-c", "6",
      "--gl", "us",
    ]
    execFile("z-ai", args, { timeout: 240000, maxBuffer: 20 * 1024 * 1024 }, (err, stdout, stderr) => {
      const data = extractJson(stdout || "")
      if (data && data.success && Array.isArray(data.results)) {
        writeFileSync(`${OUT}/${job.slug}.json`, JSON.stringify(data, null, 2))
        console.log(`OK   ${job.slug} (${data.results.length} résultats)`)
        resolve(true)
      } else {
        const errText = (stderr || "").includes("429") ? "429" : ((data && data.error) || (err && err.message) || "réponse vide")
        console.log(`FAIL ${job.slug} :: ${errText}`)
        resolve(false)
      }
    })
  })
}

async function pool(jobs, size) {
  const queue = [...jobs]
  let ok = 0
  async function worker() {
    while (queue.length) {
      const job = queue.shift()
      const success = await runOne(job)
      if (success) ok++
    }
  }
  await Promise.all(Array.from({ length: size }, worker))
  return ok
}

// Résiliable : saute les slugs déjà réussis ; séquentiel avec backoff sur 429.
const pending = JOBS.filter((j) => {
  const p = `${OUT}/${j.slug}.json`
  if (existsSync(p)) {
    try {
      const d = JSON.parse(readFileSync(p, "utf8"))
      if (d.success && Array.isArray(d.results) && d.results.length) {
        console.log(`SKIP ${j.slug} (déjà fait)`)
        return false
      }
    } catch {}
  }
  return true
})

let ok = JOBS.length - pending.length
for (const job of pending) {
  let attempt = 0
  let done = false
  while (attempt < 5 && !done) {
    if (attempt > 0) {
      const wait = 15000 * attempt
      console.log(`  retry ${job.slug} dans ${wait / 1000}s (tentative ${attempt + 1})`)
      await sleep(wait)
    }
    done = await runOne(job)
    attempt++
    if (done) ok++
  }
  await sleep(4000)
}

console.log(`\nRecherche terminée : ${ok}/${JOBS.length} requêtes réussies`)
writeFileSync(`${OUT}/_jobs.json`, JSON.stringify(JOBS, null, 2))
