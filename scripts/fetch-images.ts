// Récupération d'images pour REFERENCE.COM via z-ai image-search (concurrence 6)
// NB : le flag -o du CLI n'écrit pas le fichier, on parse donc stdout.
import { spawn } from "child_process"
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs"

const JOBS_FILE = "/home/z/my-project/scripts/image-jobs.tsv"
const OUT = "/home/z/my-project/prisma/img"
mkdirSync(OUT, { recursive: true })

const jobs = readFileSync(JOBS_FILE, "utf8")
  .trim()
  .split("\n")
  .map((l) => {
    const idx = l.indexOf("\t")
    return { key: l.slice(0, idx), query: l.slice(idx + 1) }
  })

async function runJob(job: { key: string; query: string }): Promise<void> {
  const dest = `${OUT}/${job.key}.json`
  if (existsSync(dest)) return
  for (let attempt = 1; attempt <= 2; attempt++) {
    const stdout = await new Promise<string>((resolve) => {
      let out = ""
      const p = spawn(
        "z-ai",
        ["image-search", "-q", job.query, "--count", "1", "--gl", "us", "--no-rank"],
        { stdio: ["ignore", "pipe", "ignore"] }
      )
      p.stdout.on("data", (d: Buffer) => (out += d.toString()))
      p.on("close", () => resolve(out))
      p.on("error", () => resolve(out))
    })
    const start = stdout.indexOf("{")
    if (start >= 0) {
      try {
        const parsed = JSON.parse(stdout.slice(start)) as {
          success?: boolean
          results?: Array<{ original_url?: string }>
        }
        const url = parsed?.results?.[0]?.original_url
        if (parsed.success && url) {
          writeFileSync(dest, JSON.stringify({ key: job.key, url }))
          return
        }
      } catch {
        // JSON tronqué : on retente
      }
    }
    await new Promise((r) => setTimeout(r, 2000))
  }
  console.log(`FAILED: ${job.key}`)
}

let index = 0
async function worker(wid: number) {
  while (index < jobs.length) {
    const job = jobs[index++]
    console.log(`[w${wid}] start: ${job.key}`)
    await runJob(job)
    console.log(`[w${wid}] done: ${job.key}`)
  }
}

await Promise.all(Array.from({ length: 6 }, (_, i) => worker(i + 1)))
console.log("ALL IMAGES DONE")
