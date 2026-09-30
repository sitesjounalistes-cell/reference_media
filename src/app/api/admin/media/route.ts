import { randomUUID } from "node:crypto"
import { writeFile } from "fs/promises"
import { join } from "path"

import sharp from "sharp"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { requireAdmin } from "@/lib/admin-auth"
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { db } from "@/lib/db"
import { MAX_UPLOAD_SIZE, MAX_UPLOAD_SIZE_MO } from "../_lib"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const UPLOADS_DIR = join(process.cwd(), "public", "uploads")

/** MIME autorisés → (kind, extension de secours si le nom n'en fournit pas).
 *
 * ⚠️ image/svg+xml volontairement REFUSÉ : un SVG peut embarquer des scripts
 * et serait servi même origine depuis /uploads → XSS stocké. Les visuels
 * vectoriels doivent être convertis en PNG/WebP avant import.
 */
const MIME_KINDS: Record<string, { kind: string; ext: string }> = {
  // Images
  "image/jpeg": { kind: "IMAGE", ext: ".jpg" },
  "image/pjpeg": { kind: "IMAGE", ext: ".jpg" },
  "image/png": { kind: "IMAGE", ext: ".png" },
  "image/webp": { kind: "IMAGE", ext: ".webp" },
  "image/gif": { kind: "IMAGE", ext: ".gif" },
  "image/avif": { kind: "IMAGE", ext: ".avif" },
  "image/heic": { kind: "IMAGE", ext: ".heic" },
  "image/heif": { kind: "IMAGE", ext: ".heif" },
  "image/bmp": { kind: "IMAGE", ext: ".bmp" },
  "image/tiff": { kind: "IMAGE", ext: ".tiff" },
  // Vidéos
  "video/mp4": { kind: "VIDEO", ext: ".mp4" },
  "video/webm": { kind: "VIDEO", ext: ".webm" },
  "video/quicktime": { kind: "VIDEO", ext: ".mov" },
  "video/x-msvideo": { kind: "VIDEO", ext: ".avi" },
  "video/x-matroska": { kind: "VIDEO", ext: ".mkv" },
  "video/mpeg": { kind: "VIDEO", ext: ".mpeg" },
  "video/3gpp": { kind: "VIDEO", ext: ".3gp" },
  // Audios (y compris variantes Safari / Android souvent mal déclarées)
  "audio/mpeg": { kind: "AUDIO", ext: ".mp3" },
  "audio/mp3": { kind: "AUDIO", ext: ".mp3" },
  "audio/ogg": { kind: "AUDIO", ext: ".ogg" },
  "audio/vorbis": { kind: "AUDIO", ext: ".ogg" },
  "application/ogg": { kind: "AUDIO", ext: ".ogg" },
  "audio/wav": { kind: "AUDIO", ext: ".wav" },
  "audio/x-wav": { kind: "AUDIO", ext: ".wav" },
  "audio/vnd.wave": { kind: "AUDIO", ext: ".wav" },
  "audio/wave": { kind: "AUDIO", ext: ".wav" },
  "audio/mp4": { kind: "AUDIO", ext: ".m4a" },
  "audio/x-m4a": { kind: "AUDIO", ext: ".m4a" },
  "audio/m4a": { kind: "AUDIO", ext: ".m4a" },
  "audio/aac": { kind: "AUDIO", ext: ".aac" },
  "audio/x-aac": { kind: "AUDIO", ext: ".aac" },
  "audio/x-hx-aac-adts": { kind: "AUDIO", ext: ".aac" },
  "audio/opus": { kind: "AUDIO", ext: ".opus" },
  "audio/flac": { kind: "AUDIO", ext: ".flac" },
  "audio/x-flac": { kind: "AUDIO", ext: ".flac" },
  "audio/webm": { kind: "AUDIO", ext: ".webm" },
  "audio/amr": { kind: "AUDIO", ext: ".amr" },
  "audio/3gpp": { kind: "AUDIO", ext: ".3gp" },
  // Documents
  "application/pdf": { kind: "DOC", ext: ".pdf" },
  "application/msword": { kind: "DOC", ext: ".doc" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    kind: "DOC",
    ext: ".docx",
  },
}

/** Filet de sécurité : extension de fichier → (kind, extension). Couvre les
 * navigateurs qui envoient un MIME vide ou non standard (Safari, mobiles).
 * SVG exclu pour la même raison que ci-dessus. */
const EXT_KINDS: Record<string, { kind: string; ext: string }> = {
  jpg: { kind: "IMAGE", ext: ".jpg" },
  jpeg: { kind: "IMAGE", ext: ".jpg" },
  png: { kind: "IMAGE", ext: ".png" },
  webp: { kind: "IMAGE", ext: ".webp" },
  gif: { kind: "IMAGE", ext: ".gif" },
  avif: { kind: "IMAGE", ext: ".avif" },
  heic: { kind: "IMAGE", ext: ".heic" },
  heif: { kind: "IMAGE", ext: ".heif" },
  bmp: { kind: "IMAGE", ext: ".bmp" },
  tiff: { kind: "IMAGE", ext: ".tiff" },
  mp4: { kind: "VIDEO", ext: ".mp4" },
  webm: { kind: "VIDEO", ext: ".webm" },
  mov: { kind: "VIDEO", ext: ".mov" },
  avi: { kind: "VIDEO", ext: ".avi" },
  mkv: { kind: "VIDEO", ext: ".mkv" },
  mpeg: { kind: "VIDEO", ext: ".mpeg" },
  mpg: { kind: "VIDEO", ext: ".mpeg" },
  "3gp": { kind: "VIDEO", ext: ".3gp" },
  mp3: { kind: "AUDIO", ext: ".mp3" },
  m4a: { kind: "AUDIO", ext: ".m4a" },
  aac: { kind: "AUDIO", ext: ".aac" },
  ogg: { kind: "AUDIO", ext: ".ogg" },
  oga: { kind: "AUDIO", ext: ".ogg" },
  opus: { kind: "AUDIO", ext: ".opus" },
  flac: { kind: "AUDIO", ext: ".flac" },
  wav: { kind: "AUDIO", ext: ".wav" },
  amr: { kind: "AUDIO", ext: ".amr" },
  pdf: { kind: "DOC", ext: ".pdf" },
  doc: { kind: "DOC", ext: ".doc" },
  docx: { kind: "DOC", ext: ".docx" },
}

/** Nom original nettoyé : sans composant de chemin, sans caractères de contrôle, ≤ 255. */
function sanitizeOriginalName(raw: string): string {
  const base = (raw || "fichier").split(/[\\/]+/).pop() ?? "fichier"
  const cleaned = base
    .replace(/[\u0000-\u001f\u007f"<>:*?|]/g, "")
    .trim()
    .slice(0, 255)
  return cleaned || "fichier"
}

/** Extension du nom original si plausible (1-5 caractères alphanumériques). */
function originalExtension(originalName: string): string | null {
  const parts = originalName.split(".")
  const raw = parts.length > 1 ? (parts.pop() ?? "") : ""
  const lower = raw.toLowerCase()
  return /^[a-z0-9]{1,5}$/.test(lower) ? lower : null
}

/** Résout (kind, extension finale) depuis le MIME, puis l'extension du nom.
 * Accepte notamment les fichiers dont le MIME est vide ou exotique. */
function resolveKindAndExtension(
  originalName: string,
  mimeType: string
): { kind: string; ext: string } | null {
  const byMime = MIME_KINDS[mimeType?.toLowerCase?.() ?? ""]
  if (byMime) return byMime

  const ext = originalExtension(originalName)
  if (ext && EXT_KINDS[ext]) return EXT_KINDS[ext]

  return null
}

/* ------------------------- Vérification du contenu ------------------------- */

/**
 * Inspection des magic bytes : déduit le genre réel du fichier.
 * - { kind } : signature reconnue ;
 * - "unknown" : format sans signature stable (MPEG-TS, flux bruns…) → toléré ;
 * - "dangerous" : exécutable ou document actif (PE, ELF, texte balisé
 *   SVG/HTML/XML…) → refusé quoi que déclare le client.
 */
function sniffMagic(buffer: Buffer): "dangerous" | "unknown" | { kind: string } {
  if (buffer.length < 4) return "dangerous"

  const b = (i: number) => buffer[i]
  const ascii = (start: number, length: number) =>
    buffer.subarray(start, start + length).toString("latin1")

  // Exécutables Windows (MZ) et Linux (ELF).
  if (ascii(0, 2) === "MZ" || ascii(0, 4) === "\x7fELF") return "dangerous"

  // Texte balisé : SVG, HTML, XML, scripts… (premier caractère non blanc = "<").
  let offset = 0
  if (b(0) === 0xef && b(1) === 0xbb && b(2) === 0xbf) offset = 3 // BOM UTF-8
  while (offset < buffer.length && [0x20, 0x09, 0x0a, 0x0d].includes(b(offset))) {
    offset++
  }
  if (offset < buffer.length && b(offset) === 0x3c) return "dangerous"

  // Images
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return { kind: "IMAGE" } // JPEG
  if (ascii(0, 4) === "\x89PNG") return { kind: "IMAGE" }
  if (ascii(0, 3) === "GIF") return { kind: "IMAGE" }
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") return { kind: "IMAGE" }
  if (ascii(0, 2) === "BM") return { kind: "IMAGE" } // BMP
  if (
    (b(0) === 0x49 && b(1) === 0x49 && b(2) === 0x2a) || // TIFF « II »
    (b(0) === 0x4d && b(1) === 0x4d && b(2) === 0x00) // TIFF « MM »
  ) {
    return { kind: "IMAGE" }
  }

  // Audios
  if (ascii(0, 4) === "fLaC") return { kind: "AUDIO" }
  if (ascii(0, 4) === "OggS") return { kind: "AUDIO" }
  if (ascii(0, 3) === "ID3") return { kind: "AUDIO" } // MP3 avec tag ID3
  if (b(0) === 0xff && (b(1) & 0xe0) === 0xe0) return { kind: "AUDIO" } // MP3 (synchro)
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WAVE") return { kind: "AUDIO" }

  // Vidéos
  if (b(0) === 0x1a && b(1) === 0x45 && b(2) === 0xdf && b(3) === 0xa3) {
    return { kind: "VIDEO" } // Matroska / WebM
  }
  if (b(0) === 0x00 && b(1) === 0x00 && b(2) === 0x01 && (b(3) === 0xba || b(3) === 0xb3)) {
    return { kind: "VIDEO" } // MPEG-PS
  }

  // Conteneurs ISO-BMFF (décalage 4..8 = "ftyp") : mp4/mov/3gp/m4a/heic/avif.
  if (ascii(4, 4) === "ftyp") {
    const brand = ascii(8, 4)
    if (/^M4A|^(mjp2)/.test(brand)) return { kind: "AUDIO" }
    if (
      /^(heic|heix|heif|heim|heis|hevc|hevx|avif|avis|msf|mif1|micf)/i.test(brand)
    ) {
      return { kind: "IMAGE" }
    }
    return { kind: "VIDEO" }
  }

  // Documents
  if (ascii(0, 4) === "%PDF") return { kind: "DOC" }
  if (b(0) === 0xd0 && b(1) === 0xcf && b(2) === 0x11 && b(3) === 0xe0) {
    return { kind: "DOC" } // OLE2 (doc)
  }
  if (ascii(0, 4) === "PK\x03\x04") return { kind: "DOC" } // Zip / docx

  return "unknown"
}

/** Résolution maximale acceptée : 40 Mpx (garde anti bombe de décompression). */
const MAX_IMAGE_PIXELS = 40_000_000

/**
 * Contrôle réel de décodabilité d'une image via sharp :
 * - refuse les fichiers illisibles ou tronqués ;
 * - refuse les résolutions délirantes (bombe de décompression).
 */
async function assertDecodableImage(buffer: Buffer): Promise<string | null> {
  try {
    const meta = await sharp(buffer).metadata()
    if (!meta.format) return "Image illisible ou corrompue"
    const pixels = (meta.width ?? 0) * (meta.height ?? 0)
    if (pixels > MAX_IMAGE_PIXELS) {
      return `Résolution trop grande (${Math.round(pixels / 1_000_000)} Mpx — 40 Mpx maximum)`
    }
    return null
  } catch {
    return "Image illisible ou corrompue"
  }
}

function mapMedia(row: {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  kind: string
  createdAt: Date
}) {
  return {
    id: row.id,
    filename: row.filename,
    originalName: row.originalName,
    mimeType: row.mimeType,
    size: row.size,
    kind: row.kind,
    url: `/uploads/${row.filename}`,
    createdAt: row.createdAt.toISOString(),
  }
}

/**
 * GET /api/admin/media — médiathèque, la plus récente d'abord.
 * ?kind=IMAGE|VIDEO|AUDIO|DOC (facultatif). Réservé à la rédaction.
 */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const kindParam = request.nextUrl.searchParams.get("kind")
    const kind =
      kindParam && ["IMAGE", "VIDEO", "AUDIO", "DOC"].includes(kindParam)
        ? kindParam
        : undefined

    const rows = await db.mediaAsset.findMany({
      where: kind ? { kind } : undefined,
      orderBy: [{ createdAt: "desc" }],
    })

    return NextResponse.json({ media: rows.map(mapMedia) })
  } catch (error) {
    console.error("GET /api/admin/media", error)
    return NextResponse.json(
      { error: "Impossible de charger la médiathèque" },
      { status: 500 }
    )
  }
}

/** POST /api/admin/media — import d'un fichier (multipart/form-data, champ
 * "file"). Réservé à la rédaction ; limité à 30 imports / heure / IP. */
export async function POST(request: Request) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const limit = rateLimit(`upload:${clientIp(request)}`, 30, 60 * 60 * 1000)
    if (!limit.ok) return tooManyRequests(limit.retryAfterS)

    // Refus précoce des corps surdimensionnés AVANT tout buffering mémoire.
    const declaredLength = Number.parseInt(
      request.headers.get("content-length") ?? "",
      10
    )
    if (
      Number.isFinite(declaredLength) &&
      declaredLength > MAX_UPLOAD_SIZE + 1024 * 1024
    ) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (${MAX_UPLOAD_SIZE_MO} Mo maximum)` },
        { status: 413 }
      )
    }

    let form: FormData
    try {
      form = await request.formData()
    } catch {
      return NextResponse.json(
        { error: "Requête invalide : formulaire multipart attendu" },
        { status: 400 }
      )
    }

    const file = form.get("file")
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 })
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (${MAX_UPLOAD_SIZE_MO} Mo maximum)` },
        { status: 400 }
      )
    }

    const originalName = sanitizeOriginalName(file.name)

    const mimeInfo = resolveKindAndExtension(originalName, file.type)
    if (!mimeInfo) {
      return NextResponse.json(
        { error: "Type de fichier non pris en charge" },
        { status: 400 }
      )
    }

    // Le contenu réel doit corroborer le type déclaré (anti-renommage,
    // polyglottes, exécutables et documents actifs déguisés).
    const buffer = Buffer.from(await file.arrayBuffer())
    const sniffed = sniffMagic(buffer)
    if (sniffed === "dangerous") {
      return NextResponse.json(
        {
          error:
            "Fichier refusé : contenu exécutable ou actif détecté (SVG/HTML/script interdits)",
        },
        { status: 400 }
      )
    }
    if (typeof sniffed === "object" && sniffed.kind !== mimeInfo.kind) {
      return NextResponse.json(
        { error: "Fichier refusé : le contenu ne correspond pas au type déclaré" },
        { status: 400 }
      )
    }

    // Les images sont réellement décodées (sharp) : anti-fichier tronqué,
    // anti-métadonnées mensongères et anti-bombe de décompression.
    if (mimeInfo.kind === "IMAGE") {
      const imageError = await assertDecodableImage(buffer)
      if (imageError) {
        return NextResponse.json({ error: imageError }, { status: 400 })
      }
    }

    const filename = `${randomUUID()}${mimeInfo.ext}`

    await writeFile(join(UPLOADS_DIR, filename), buffer)

    const asset = await db.mediaAsset.create({
      data: {
        filename,
        originalName,
        mimeType: file.type,
        size: file.size,
        kind: mimeInfo.kind,
      },
    })

    return NextResponse.json({ media: mapMedia(asset) }, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/media", error)
    return NextResponse.json(
      { error: "Impossible d'importer le fichier" },
      { status: 500 }
    )
  }
}
