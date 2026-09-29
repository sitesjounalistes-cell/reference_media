"use client"

/** Cockpit — Médiathèque : import d'images / vidéos / sons / PDF, grille, gestion. */

import * as React from "react"

import {
  Check,
  Copy,
  FileText,
  Film,
  Images,
  Music,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { fetchJson } from "@/components/reference/lib"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { MediaAssetDto, MediaListResponse } from "@/components/reference/types"
import {
  EmptyState,
  ErrorPanel,
  SectionHeader,
  Spinner,
  formatBytes,
  formatDateShort,
} from "./cockpit-lib"

type KindFilter = "ALL" | "IMAGE" | "VIDEO" | "AUDIO" | "DOC"

// SVG volontairement absent (XSS stocké même origine — refusé par le serveur) :
// on énumère les formats d'image autorisés plutôt que image/*.
const ACCEPT =
  ".jpg,.jpeg,.png,.webp,.gif,.avif,.heic,.heif,.bmp,.tiff,video/*,audio/*,application/pdf,.m4a,.aac,.opus,.flac,.ogg,.wav,.mkv,.avi,.mov,.doc,.docx"
const MAX_SIZE_MO = 200
const MAX_SIZE = MAX_SIZE_MO * 1024 * 1024 // 200 Mo

const KIND_LABEL: Record<KindFilter, string> = {
  ALL: "Tous",
  IMAGE: "Images",
  VIDEO: "Vidéos",
  AUDIO: "Audios",
  DOC: "Documents",
}

interface UploadJob {
  id: string
  name: string
  size: number
  state: "uploading" | "done" | "error"
  message?: string
}

export function CockpitMedia({ refreshKey, onMutated }: { refreshKey: number; onMutated: () => void }) {
  const { toast } = useToast()
  const [media, setMedia] = React.useState<MediaAssetDto[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [kind, setKind] = React.useState<KindFilter>("ALL")
  const [jobs, setJobs] = React.useState<UploadJob[]>([])
  const [dragOver, setDragOver] = React.useState(false)
  const [toDelete, setToDelete] = React.useState<MediaAssetDto | null>(null)

  const inputRef = React.useRef<HTMLInputElement>(null)
  /** Protège les uploads contre le double montage StrictMode. */
  const uploadingRef = React.useRef(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchJson<MediaListResponse>(`/api/admin/media?_r=${refreshKey}`)
      setMedia(data.media)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger la médiathèque")
    } finally {
      setLoading(false)
    }
  }, [refreshKey])

  React.useEffect(() => {
    void load()
  }, [load])

  const uploadFiles = React.useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files)
      if (list.length === 0 || uploadingRef.current) return
      uploadingRef.current = true

      const newJobs: UploadJob[] = list.map((file, index) => ({
        id: `${Date.now()}-${index}-${file.name}`,
        name: file.name,
        size: file.size,
        state: "uploading",
      }))
      setJobs((current) => [...newJobs, ...current].slice(0, 8))

      let okCount = 0
      for (let index = 0; index < list.length; index++) {
        const file = list[index]
        const jobId = newJobs[index].id
        try {
          if (file.size > MAX_SIZE) {
            throw new Error(`Fichier trop volumineux (${MAX_SIZE_MO} Mo maximum)`)
          }
          const form = new FormData()
          form.append("file", file)
          await fetchJson<{ media: MediaAssetDto }>("/api/admin/media", {
            method: "POST",
            body: form,
          })
          okCount++
          setJobs((current) =>
            current.map((job) => (job.id === jobId ? { ...job, state: "done" } : job))
          )
        } catch (err) {
          setJobs((current) =>
            current.map((job) =>
              job.id === jobId
                ? {
                    ...job,
                    state: "error",
                    message:
                      err instanceof Error ? err.message : "Import impossible",
                  }
                : job
            )
          )
        }
      }

      uploadingRef.current = false
      if (okCount > 0) {
        toast({
          title: okCount === 1 ? "Média importé" : `${okCount} médias importés`,
          description: "Ils sont disponibles pour vos articles et la médiathèque.",
        })
        onMutated()
      }
      await load()
      window.setTimeout(() => {
        setJobs((current) => current.filter((job) => job.state === "uploading"))
      }, 4000)
    },
    [load, onMutated, toast]
  )

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      const res = await fetch(`/api/admin/media/${toDelete.id}`, { method: "DELETE" })
      if (!res.ok && res.status !== 204) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? "Suppression impossible")
      }
      setMedia((rows) => rows?.filter((row) => row.id !== toDelete.id) ?? rows)
      toast({ title: "Média supprimé", description: toDelete.originalName })
      onMutated()
    } catch (err) {
      toast({
        title: "Suppression impossible",
        description: err instanceof Error ? err.message : "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setToDelete(null)
    }
  }

  const copyUrl = async (asset: MediaAssetDto) => {
    const url = asset.url.startsWith("http") ? asset.url : `${window.location.origin}${asset.url}`
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: "URL copiée", description: asset.originalName })
    } catch {
      toast({ title: "Copie impossible", description: url, variant: "destructive" })
    }
  }

  const filtered = (media ?? []).filter((asset) => (kind === "ALL" ? true : asset.kind === kind))
  const counts = React.useMemo(() => {
    const rows = media ?? []
    return {
      ALL: rows.length,
      IMAGE: rows.filter((r) => r.kind === "IMAGE").length,
      VIDEO: rows.filter((r) => r.kind === "VIDEO").length,
      AUDIO: rows.filter((r) => r.kind === "AUDIO").length,
      DOC: rows.filter((r) => r.kind === "DOC").length,
    }
  }, [media])

  return (
    <div>
      <SectionHeader
        kicker="Médiathèque"
        title="Images, vidéos et documents"
        description="Importez vos photos, reportages vidéo, sons et PDF — puis insérez-les dans vos articles."
      />

      <div
        role="button"
        tabIndex={0}
        aria-label="Importer des fichiers dans la médiathèque"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click()
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragOver(false)
          void uploadFiles(event.dataTransfer.files)
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed px-6 py-10 text-center transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          dragOver ? "border-brand-red bg-brand-red/5" : "border-border hover:border-foreground/40"
        )}
      >
        <UploadCloud className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="font-serif text-base font-bold">
          Glissez vos fichiers ici ou cliquez pour parcourir
        </p>
        <p className="text-xs text-muted-foreground">
          Images, vidéos, sons et PDF — {MAX_SIZE_MO} Mo maximum par fichier
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(event) => {
            if (event.target.files) void uploadFiles(event.target.files)
            event.target.value = ""
          }}
        />
      </div>

      {jobs.length > 0 ? (
        <ul className="mt-3 divide-y border" aria-live="polite">
          {jobs.map((job) => (
            <li key={job.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              {job.state === "uploading" ? (
                <Spinner />
              ) : job.state === "done" ? (
                <Check className="size-4 text-emerald-600" aria-hidden="true" />
              ) : (
                <X className="size-4 text-brand-red" aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1 truncate">{job.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(job.size)}</span>
              {job.state === "error" && job.message ? (
                <span
                  className="max-w-[40%] shrink-0 truncate text-right text-xs text-brand-red"
                  title={job.message}
                >
                  {job.message}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mb-4 mt-6">
        <Tabs value={kind} onValueChange={(value) => setKind(value as KindFilter)}>
          <TabsList className="h-10 w-full justify-start rounded-none bg-muted/60 p-0 sm:w-auto">
            {(Object.keys(KIND_LABEL) as KindFilter[]).map((value) => (
              <TabsTrigger
                key={value}
                value={value}
                className="h-10 flex-1 rounded-none px-3 text-xs data-[state=active]:rounded-none sm:flex-none"
              >
                {KIND_LABEL[value]}
                <span className="ml-1.5 tabular-nums text-muted-foreground">{counts[value]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {error ? (
        <ErrorPanel message={error} onRetry={load} />
      ) : loading && !media ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="border">
              <span className="block aspect-square w-full animate-pulse bg-muted" />
              <span className="block px-3 py-2 text-[11px] text-transparent">·</span>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Images}
          title={media && media.length > 0 ? "Aucun fichier de ce type" : "Aucun média pour l'instant"}
          hint={
            media && media.length > 0
              ? "Changez de filtre pour voir les autres formats."
              : "Importez votre première image ou votre premier reportage vidéo."
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((asset) => (
            <li key={asset.id} className="group border bg-background">
              <div className="relative aspect-square w-full overflow-hidden bg-muted/40">
                {asset.kind === "IMAGE" ? (
                   
                  <img
                    src={asset.url}
                    alt={asset.originalName}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : asset.kind === "VIDEO" ? (
                  <span className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Film className="size-10" aria-hidden="true" />
                    <span className="kicker text-[10px]">Vidéo</span>
                  </span>
                ) : asset.kind === "AUDIO" ? (
                  <span className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Music className="size-10" aria-hidden="true" />
                    <span className="kicker text-[10px]">Audio</span>
                  </span>
                ) : (
                  <span className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <FileText className="size-10" aria-hidden="true" />
                    <span className="kicker text-[10px]">
                      {asset.mimeType === "application/pdf" ? "PDF" : "Document"}
                    </span>
                  </span>
                )}
              </div>
              <div className="border-t px-3 py-2">
                <p className="truncate text-xs font-medium" title={asset.originalName}>
                  {asset.originalName}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {formatBytes(asset.size)} · {formatDateShort(asset.createdAt)}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void copyUrl(asset)}
                    className="inline-flex min-h-8 flex-1 items-center justify-center gap-1.5 border px-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                  >
                    <Copy className="size-3" aria-hidden="true" />
                    Copier
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(asset)}
                    aria-label={`Supprimer ${asset.originalName}`}
                    className="inline-flex min-h-8 w-8 items-center justify-center border px-0 text-muted-foreground transition-colors hover:border-brand-red hover:text-brand-red"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Supprimer ce média ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {toDelete?.originalName} » sera retiré de la médiathèque et du disque. Les articles
              qui l'utilisent perdront ce fichier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-none bg-brand-red text-white hover:bg-brand-red/85"
              onClick={(event) => {
                event.preventDefault()
                void confirmDelete()
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
