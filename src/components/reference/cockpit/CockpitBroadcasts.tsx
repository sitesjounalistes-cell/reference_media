"use client"

/**
 * Cockpit — FM & TV : publication de contenus audio et vidéo structurés
 * (podcasts, chroniques, interviews / reportages, émissions), média importé
 * depuis la médiathèque (Cloudinary) ou par URL directe.
 */
import * as React from "react"

import { Play, Save, Trash2 } from "lucide-react"

import { fetchJson, useFetch } from "@/components/reference/lib"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { MediaListResponse } from "@/components/reference/types"
import { Card, ErrorPanel, SectionHeader, Spinner, formatDateShort } from "./cockpit-lib"

interface BroadcastDto {
  id: string
  kind: string
  section: string
  title: string
  description: string
  mediaUrl: string
  thumbnailUrl: string | null
  isLive: boolean
  duration: number | null
  featured: boolean
  publishedAt: string
}

const SECTION_OPTIONS: Record<"AUDIO" | "VIDEO", Array<{ value: string; label: string }>> = {
  AUDIO: [
    { value: "podcast", label: "Podcast" },
    { value: "chronique", label: "Chronique audio" },
    { value: "interview", label: "Interview audio" },
  ],
  VIDEO: [
    { value: "reportage", label: "Reportage vidéo" },
    { value: "emission", label: "Émission" },
  ],
}

export function CockpitBroadcasts({ refreshKey, onMutated }: { refreshKey: number; onMutated: () => void }) {
  const { toast } = useToast()
  const [kind, setKind] = React.useState<"AUDIO" | "VIDEO">("AUDIO")
  const [section, setSection] = React.useState("podcast")
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [mediaUrl, setMediaUrl] = React.useState("")
  const [thumbnailUrl, setThumbnailUrl] = React.useState("")
  const [isLive, setIsLive] = React.useState(false)
  const [driveUrl, setDriveUrl] = React.useState("")
  const [importing, setImporting] = React.useState(false)
  const [duration, setDuration] = React.useState("")
  const [featured, setFeatured] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const list = useFetch<{ broadcasts: BroadcastDto[] }>(
    `/api/admin/broadcasts?kind=${kind}&_r=${refreshKey}`
  )
  const media = useFetch<MediaListResponse>(
    `/api/admin/media?kind=${kind === "AUDIO" ? "AUDIO" : "VIDEO"}&_r=${refreshKey}`
  )
  const items = list.data?.broadcasts ?? []
  const assets = media.data?.media ?? []
  const images = useFetch<MediaListResponse>(`/api/admin/media?kind=IMAGE&_r=${refreshKey}`)
  const imageAssets = images.data?.media ?? []

  React.useEffect(() => {
    setSection(SECTION_OPTIONS[kind][0].value)
  }, [kind])

  const valid =
    title.trim().length >= 3 && description.trim().length >= 10 && isSafe(mediaUrl)

  function isSafe(url: string) {
    return url.startsWith("/") || /^https:\/\/\S+$/i.test(url)
  }

  /** Import Google Drive sans API : téléchargement serveur → Cloudinary. */
  const importFromDrive = async () => {
    if (!driveUrl.trim() || importing) return
    setImporting(true)
    try {
      const res = await fetchJson<{ resolved: { url: string } }>(
        "/api/admin/broadcasts",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resolveDrive: driveUrl.trim() }),
        }
      )
      setMediaUrl(res.resolved.url)
      setDriveUrl("")
      toast({ title: "Audio Drive lié", description: "Lecture directe depuis Drive — le fichier reste dans son dossier." })
    } catch (err) {
      toast({
        title: "Import Drive impossible",
        description: err instanceof Error ? err.message : "Vérifiez que le fichier est partagé en accès public (lien).",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  const save = async () => {
    if (!valid || saving) return
    setSaving(true)
    try {
      await fetchJson("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          section,
          title: title.trim(),
          description: description.trim(),
          mediaUrl: mediaUrl.trim(),
          thumbnailUrl: thumbnailUrl.trim() || null,
          isLive,
          duration: duration ? Math.min(Math.max(Number.parseInt(duration, 10) || 1, 1), 600) : null,
          featured,
        }),
      })
      toast({ title: kind === "AUDIO" ? "Contenu FM publié" : "Contenu TV publié", description: title.trim() })
      setTitle(""); setDescription(""); setMediaUrl(""); setDuration(""); setFeatured(false)
      onMutated()
    } catch (err) {
      toast({
        title: "Publication impossible",
        description: err instanceof Error ? err.message : "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    try {
      await fetchJson(`/api/admin/broadcasts?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      onMutated()
    } catch (err) {
      toast({ title: "Suppression impossible", description: err instanceof Error ? err.message : "", variant: "destructive" })
    }
  }

  const toggleFeatured = async (item: BroadcastDto) => {
    try {
      await fetchJson(`/api/admin/broadcasts?id=${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !item.featured }),
      })
      onMutated()
    } catch {
      /* silencieux */
    }
  }

  return (
    <div>
      <SectionHeader
        kicker="Rédaction audio & vidéo"
        title="FM & TV"
        description="Publiez podcasts, chroniques, interviews, reportages et émissions — médias importés depuis la médiathèque (Cloudinary)."
      />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* Publication */}
        <Card title="Nouveau contenu">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="kicker text-muted-foreground">Antenne</Label>
                <Select value={kind} onValueChange={(v) => setKind(v as "AUDIO" | "VIDEO")}>
                  <SelectTrigger className="h-9 rounded-none"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="AUDIO">Radio FM</SelectItem>
                    <SelectItem value="VIDEO">Chaîne TV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="kicker text-muted-foreground">Section</Label>
                <Select value={section} onValueChange={setSection}>
                  <SelectTrigger className="h-9 rounded-none"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-none">
                    {SECTION_OPTIONS[kind].map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="kicker text-muted-foreground" htmlFor="bc-title">Titre</Label>
              <Input id="bc-title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 rounded-none" placeholder={kind === "AUDIO" ? "Interview : les abeilles en danger" : "Reportage : dans la cité antique"} />
            </div>
            <div className="space-y-1.5">
              <Label className="kicker text-muted-foreground" htmlFor="bc-desc">Description</Label>
              <Textarea id="bc-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="rounded-none" placeholder="Résumé affiché aux auditeurs/spectateurs (10 caractères minimum)…" />
            </div>
            <div className="space-y-1.5">
              <Label className="kicker text-muted-foreground" htmlFor="bc-url">Média</Label>
              <Input id="bc-url" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} className="h-10 rounded-none font-mono text-xs" placeholder="URL Cloudinary (choisissez ci-dessous) ou https://…" />
              {assets.length > 0 ? (
                <div className="mt-2 max-h-36 space-y-1 overflow-y-auto border p-1.5 nice-scrollbar">
                  <p className="px-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                    Médiathèque {kind === "AUDIO" ? "audio" : "vidéo"} — clic pour insérer
                  </p>
                  {assets.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => setMediaUrl(asset.url)}
                      className={mediaUrl === asset.url ? "block w-full bg-muted px-2 py-1.5 text-left text-xs font-semibold" : "block w-full px-2 py-1.5 text-left text-xs hover:bg-muted"}
                    >
                      {asset.originalName} <span className="text-muted-foreground">· {Math.round(asset.size / 1048576)} Mo</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Importez d'abord vos fichiers dans la section Médiathèque — ils apparaîtront ici.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="kicker text-muted-foreground" htmlFor="bc-drive">Lier un audio Google Drive (lecture directe)</Label>
              <div className="flex gap-2">
                <Input
                  id="bc-drive"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  className="h-10 rounded-none font-mono text-xs"
                  placeholder="https://drive.google.com/file/d/…/view"
                />
                <Button variant="outline" onClick={() => void importFromDrive()} disabled={!driveUrl.trim() || importing} className="min-h-10 shrink-0 rounded-none">
                  {importing ? <Spinner /> : null}
                  {importing ? "Import…" : "Récupérer"}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                L'audio reste dans Drive — le site le lit directement, rien n'est copié (Vercel/Cloudinary intacts). Partage requis : « Tous les utilisateurs disposant du lien ».
                Astuce TV : collez simplement un lien YouTube dans « Média » — le lecteur s'intègre automatiquement.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="kicker text-muted-foreground" htmlFor="bc-thumb">Visuel associé (vignette)</Label>
              <Input
                id="bc-thumb"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="h-10 rounded-none font-mono text-xs"
                placeholder="URL de l'image (choisissez ci-dessous ou https://…)"
              />
              {imageAssets.length > 0 ? (
                <div className="mt-2 flex max-h-24 gap-2 overflow-x-auto border p-1.5 nice-scrollbar">
                  {imageAssets.slice(0, 12).map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => setThumbnailUrl(asset.url)}
                      className={thumbnailUrl === asset.url ? "size-16 shrink-0 border-2 border-brand-red" : "size-16 shrink-0 border hover:opacity-80"}
                      title={asset.originalName}
                    >
                      { }
                      <img src={asset.url} alt={asset.originalName} className="size-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex items-end gap-4">
              <div className="w-32 space-y-1.5">
                <Label className="kicker text-muted-foreground" htmlFor="bc-dur">Durée (min)</Label>
                <Input id="bc-dur" value={duration} onChange={(e) => setDuration(e.target.value)} inputMode="numeric" className="h-10 rounded-none" placeholder="12" />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Switch checked={featured} onCheckedChange={setFeatured} aria-label="Mettre à la une" />
                <span className="text-xs text-muted-foreground">À la une</span>
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Switch checked={isLive} onCheckedChange={setIsLive} aria-label="Diffusion en direct" />
                <span className="text-xs text-muted-foreground">En direct {isLive ? "(badge pulsé)" : ""}</span>
              </div>
            </div>
            <Button onClick={() => void save()} disabled={!valid || saving} className="min-h-10 gap-2 rounded-none">
              {saving ? <Spinner className="text-primary-foreground" /> : <Save className="size-4" aria-hidden="true" />}
              Publier
            </Button>
          </div>
        </Card>

        {/* Contenus publiés */}
        <Card title={`Contenus publiés (${items.length})`}>
          {list.loading ? (
            <Spinner />
          ) : list.error ? (
            <ErrorPanel message={list.error} onRetry={list.retry} />
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun contenu pour cette antenne pour l'instant.</p>
          ) : (
            <ul className="divide-y">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3">
                  <span className="flex size-8 shrink-0 items-center justify-center border bg-muted">
                    <Play className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.title}</p>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      {SECTION_OPTIONS[item.kind as "AUDIO" | "VIDEO"]?.find((s) => s.value === item.section)?.label ?? item.section}
                      {item.isLive ? " · EN DIRECT" : ""}{" · "}{formatDateShort(item.publishedAt)}
                    </p>
                  </div>
                  <Switch checked={item.featured} onCheckedChange={() => void toggleFeatured(item)} aria-label="Mettre à la une" />
                  <Button variant="outline" size="icon" className="size-9 rounded-none" onClick={() => void remove(item.id)} aria-label="Supprimer">
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
