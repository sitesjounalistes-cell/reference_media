/**
 * REFERENCE.COM — Client Cloudinary minimal (REST signé, sans SDK).
 * Activé par CLOUDINARY_CLOUD_NAME + API_KEY + API_SECRET dans .env ;
 * en leur absence, la médiathèque retombe sur le stockage local.
 */
import { createHash } from "node:crypto"

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME
const KEY = process.env.CLOUDINARY_API_KEY
const SECRET = process.env.CLOUDINARY_API_SECRET

export function cloudinaryConfigured(): boolean {
  return Boolean(CLOUD && KEY && SECRET)
}

/** Signature SHA-1 des paramètres triés (contrat Cloudinary). */
function sign(params: Record<string, string>): string {
  const data = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&")
  return createHash("sha1").update(data + SECRET).digest("hex")
}

export interface CloudinaryUpload {
  secureUrl: string
  publicId: string
  bytes: number
}

/** Type de ressource Cloudinary selon le genre médiathèque (audio → video). */
function resourceType(kind: string): "image" | "video" | "raw" {
  if (kind === "IMAGE") return "image"
  if (kind === "VIDEO" || kind === "AUDIO") return "video"
  return "raw"
}

/** Téléverse un fichier (buffer) et renvoie l'URL CDN + l'identifiant. */
export async function cloudinaryUpload(
  buffer: Buffer,
  kind: string,
  originalName: string
): Promise<CloudinaryUpload> {
  const timestamp = String(Math.floor(Date.now() / 1000))
  const folder = "reference-media"
  // Tous les paramètres envoyés (hors file/api_key) participent à la signature.
  const params = { folder, timestamp, unique_filename: "true", use_filename: "true" }
  const signature = sign(params)

  const form = new FormData()
  form.append("file", new Blob([new Uint8Array(buffer)]), originalName)
  form.append("api_key", KEY!)
  form.append("timestamp", timestamp)
  form.append("folder", folder)
  form.append("signature", signature)
  form.append("use_filename", "true")
  form.append("unique_filename", "true")

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD}/${resourceType(kind)}/upload`,
    { method: "POST", body: form, signal: AbortSignal.timeout(60_000) }
  )
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Cloudinary ${response.status} : ${detail.slice(0, 200)}`)
  }
  const data = (await response.json()) as {
    secure_url: string
    public_id: string
    bytes: number
  }
  return { secureUrl: data.secure_url, publicId: data.public_id, bytes: data.bytes }
}

/** Supprime une ressource distante (silencieux si déjà absente). */
export async function cloudinaryDestroy(
  publicId: string,
  kind: string
): Promise<void> {
  const timestamp = String(Math.floor(Date.now() / 1000))
  const signature = sign({ public_id: publicId, timestamp })
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD}/${resourceType(kind)}/destroy`,
    {
      method: "POST",
      body: new URLSearchParams({ public_id: publicId, timestamp, api_key: KEY!, signature }),
      signal: AbortSignal.timeout(20_000),
    }
  )
  if (!response.ok) {
    console.error("[cloudinary] destroy échoué", publicId, response.status)
  }
}
