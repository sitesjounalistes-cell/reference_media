/**
 * Tests des modules de sécurité — exécution : bun tests/security-check.ts
 * Vérifie session HMAC, mot de passe, rate limiting et détection magic bytes.
 */
import { createSessionToken, verifySessionToken, verifyAdminPassword } from "../src/lib/admin-auth"
import { rateLimit } from "../src/lib/rate-limit"

// Valeurs de TEST dédiées — jamais les vrais secrets du .env.
process.env.ADMIN_PASSWORD = "MotDePasse-De-Test-1234"
process.env.ADMIN_SESSION_SECRET = "cle-de-test-dediee-aux-tests-unitaires-0123456789abcdef"

let passed = 0
let failed = 0
function check(label: string, ok: boolean) {
  if (ok) { passed++; console.log(`  ✓ ${label}`) }
  else { failed++; console.log(`  ✗ ÉCHEC : ${label}`) }
}

/* ------------------------------ Session HMAC ------------------------------ */
console.log("\n[1] Session signée HMAC")
const token = createSessionToken()
check("jeton valide accepté", verifySessionToken(token) === true)
check("jeton falsifié rejeté (signature modifiée)", verifySessionToken(token.slice(0, -2) + "ff") === false)
check("jeton vide rejeté", verifySessionToken("") === false)
check("jeton aléatoire rejeté", verifySessionToken("123456.abcdef.deadbeef") === false)
check("format tronqué rejeté", verifySessionToken("123456") === false)

// Expiration : simuler un jeton périmé signé correctement
const { createHmac } = await import("node:crypto")
const expiredPayload = `${Date.now() - 1000}.deadbeef`
const expiredSig = createHmac("sha256", process.env.ADMIN_SESSION_SECRET!).update(expiredPayload).digest("hex")
check("jeton expiré rejeté", verifySessionToken(`${expiredPayload}.${expiredSig}`) === false)

// Secret différent → signature invalide
const otherSig = createHmac("sha256", "un-autre-secret-beaucoup-plus-long-que-32").update(`${Date.now() + 3600000}.aa`).digest("hex")
check("jeton signé avec un autre secret rejeté", verifySessionToken(`${Date.now() + 3600000}.aa.${otherSig}`) === false)

/* ------------------------------ Mot de passe ------------------------------ */
console.log("\n[2] Mot de passe administrateur")
check("bon mot de passe accepté", verifyAdminPassword("MotDePasse-De-Test-1234") === true)
check("mauvais mot de passe refusé", verifyAdminPassword("mauvais") === false)
check("mot de passe vide refusé", verifyAdminPassword("") === false)

/* ------------------------------- Rate limit ------------------------------- */
console.log("\n[3] Limitation de débit")
const results = Array.from({ length: 6 }, () => rateLimit(`t1:${Math.floor(Date.now() / 100000)}`, 5, 60000))
check("5 premières requêtes autorisées", results.slice(0, 5).every((r) => r.ok === true))
check("6e requête refusée", results[5].ok === false)
check("retryAfter positif", results[5].retryAfterS >= 1)
check("clés indépendantes", rateLimit(`autre:${Math.floor(Date.now() / 100000)}`, 5, 60000).ok === true)

/* ------------------------ Magic bytes (reconstruit) ----------------------- */
console.log("\n[4] Détection de contenu (recopie de sniffMagic)")
// Recopie exacte de la fonction du routeur media pour la tester isolément.
function sniffMagic(buffer: Buffer): "dangerous" | "unknown" | { kind: string } {
  if (buffer.length < 4) return "dangerous"
  const b = (i: number) => buffer[i]
  const ascii = (start: number, length: number) => buffer.subarray(start, start + length).toString("latin1")
  if (ascii(0, 2) === "MZ" || ascii(0, 4) === "\x7fELF") return "dangerous"
  let offset = 0
  if (b(0) === 0xef && b(1) === 0xbb && b(2) === 0xbf) offset = 3
  while (offset < buffer.length && [0x20, 0x09, 0x0a, 0x0d].includes(b(offset))) offset++
  if (offset < buffer.length && b(offset) === 0x3c) return "dangerous"
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return { kind: "IMAGE" }
  if (ascii(0, 4) === "\x89PNG") return { kind: "IMAGE" }
  if (ascii(0, 3) === "GIF") return { kind: "IMAGE" }
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") return { kind: "IMAGE" }
  if (ascii(0, 2) === "BM") return { kind: "IMAGE" }
  if ((b(0) === 0x49 && b(1) === 0x49 && b(2) === 0x2a) || (b(0) === 0x4d && b(1) === 0x4d && b(2) === 0x00)) return { kind: "IMAGE" }
  if (ascii(0, 4) === "fLaC") return { kind: "AUDIO" }
  if (ascii(0, 4) === "OggS") return { kind: "AUDIO" }
  if (ascii(0, 3) === "ID3") return { kind: "AUDIO" }
  if (b(0) === 0xff && (b(1) & 0xe0) === 0xe0) return { kind: "AUDIO" }
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WAVE") return { kind: "AUDIO" }
  if (b(0) === 0x1a && b(1) === 0x45 && b(2) === 0xdf && b(3) === 0xa3) return { kind: "VIDEO" }
  if (b(0) === 0x00 && b(1) === 0x00 && b(2) === 0x01 && (b(3) === 0xba || b(3) === 0xb3)) return { kind: "VIDEO" }
  if (ascii(4, 4) === "ftyp") {
    const brand = ascii(8, 4)
    if (/^M4A|^(mjp2)/.test(brand)) return { kind: "AUDIO" }
    if (/^(heic|heix|heif|heim|heis|hevc|hevx|avif|avis|msf|mif1|micf)/i.test(brand)) return { kind: "IMAGE" }
    return { kind: "VIDEO" }
  }
  if (ascii(0, 4) === "%PDF") return { kind: "DOC" }
  if (b(0) === 0xd0 && b(1) === 0xcf && b(2) === 0x11 && b(3) === 0xe0) return { kind: "DOC" }
  if (ascii(0, 4) === "PK\x03\x04") return { kind: "DOC" }
  return "unknown"
}

check("PNG reconnu IMAGE", (sniffMagic(Buffer.from("89504e470d0a1a0a0000000d", "hex")) as { kind: string }).kind === "IMAGE")
check("JPEG reconnu IMAGE", (sniffMagic(Buffer.from("ffd8ffe000104a464946", "hex")) as { kind: string }).kind === "IMAGE")
check("MP3/ID3 reconnu AUDIO", (sniffMagic(Buffer.from("49443303000000000000", "hex")) as { kind: string }).kind === "AUDIO")
check("MP4 reconnu VIDEO", (sniffMagic(Buffer.from("000000206674797069736f6d", "hex")) as { kind: string }).kind === "VIDEO")
check("PDF reconnu DOC", (sniffMagic(Buffer.from("%PDF-1.7\nblah", "latin1")) as { kind: string }).kind === "DOC")
check("DOCX (PK) reconnu DOC", (sniffMagic(Buffer.from("504b030414000600", "hex")) as { kind: string }).kind === "DOC")
check("EXE (MZ) → dangerous", sniffMagic(Buffer.from("4d5a90000300000004000000", "hex")) === "dangerous")
check("SVG → dangerous", sniffMagic(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`, "latin1")) === "dangerous")
check("SVG avec espaces/BOM → dangerous", sniffMagic(Buffer.concat([Buffer.from("efbbbf", "hex"), Buffer.from("  \n<svg/>", "latin1")])) === "dangerous")
check("HTML → dangerous", sniffMagic(Buffer.from("<!DOCTYPE html><html>", "latin1")) === "dangerous")
check("Fichier trop court → dangerous", sniffMagic(Buffer.from("ab", "hex")) === "dangerous")
check("MPEG-TS brut → unknown (toléré)", sniffMagic(Buffer.from("4719002400ff0f", "hex")) === "unknown")

console.log(`\n═══ Résultat : ${passed} succès, ${failed} échec(s) ═══`)
process.exit(failed === 0 ? 0 : 1)
