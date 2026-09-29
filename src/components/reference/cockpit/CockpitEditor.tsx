"use client"

/**
 * Cockpit — Éditeur d'article : rédaction markdown avec barre d'outils,
 * image de couverture, reportage vidéo (médiathèque), publication.
 */

import * as React from "react"

import {
  Bold,
  Eye,
  FileImage,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  Quote,
  Send,
  Upload,
  X,
} from "lucide-react"
import ReactMarkdown from "react-markdown"

import { cn } from "@/lib/utils"
import { fetchJson, useFetch } from "@/components/reference/lib"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type {
  AdminArticleDto,
  AdminArticleInput,
  AdminAuthorsResponse,
  AdminCategoriesResponse,
  ArticleStatus,
  MediaAssetDto,
  MediaListResponse,
  Navigate,
} from "@/components/reference/types"
import { Card, Field, Spinner, StatusBadge } from "./cockpit-lib"

/* ------------------------------ helpers ----------------------------------- */

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

interface FormState {
  title: string
  slug: string
  excerpt: string
  content: string
  categoryId: string
  authorId: string
  tags: string
  readMinutes: string
  featured: boolean
  status: ArticleStatus
  coverImage: string
  videoUrl: string
}

function toForm(article: AdminArticleDto | null): FormState {
  return {
    title: article?.title ?? "",
    slug: article?.slug ?? "",
    excerpt: article?.excerpt ?? "",
    content: article?.content ?? "",
    categoryId: article?.categoryId ?? "",
    authorId: article?.authorId ?? "",
    tags: article?.tags.join(", ") ?? "",
    readMinutes: String(article?.readMinutes ?? 5),
    featured: article?.featured ?? false,
    status: article?.status ?? "DRAFT",
    coverImage: article?.coverImage ?? "",
    videoUrl: article?.videoUrl ?? "",
  }
}

/* ------------------------------ barre markdown ---------------------------- */

type Tool = { label: string; icon: typeof Bold; wrap?: [string, string]; prefix?: string }

const TOOLS: Tool[] = [
  { label: "Titre majeur", icon: Heading2, prefix: "## " },
  { label: "Titre secondaire", icon: Heading3, prefix: "### " },
  { label: "Gras", icon: Bold, wrap: ["**", "**"] },
  { label: "Italique", icon: Italic, wrap: ["*", "*"] },
  { label: "Lien", icon: Link2, wrap: ["[", "](https://…)"] },
  { label: "Citation", icon: Quote, prefix: "> " },
  { label: "Liste", icon: List, prefix: "- " },
  { label: "Image", icon: ImagePlus, wrap: ["![légende]", "(/uploads/…)"] },
]

/* -------------------------- sélecteur de médiathèque ---------------------- */

function MediaPickerDialog({
  open,
  onOpenChange,
  kind,
  onPick,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  kind: "IMAGE" | "VIDEO"
  onPick: (asset: MediaAssetDto) => void
}) {
  const { data, loading } = useFetch<MediaListResponse>(
    open ? `/api/admin/media?kind=${kind}` : null
  )
  const assets = data?.media ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-none">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {kind === "IMAGE" ? "Choisir une image" : "Choisir une vidéo"}
          </DialogTitle>
          <DialogDescription>
            Fichiers de la médiathèque — importez-en d'autres depuis la section Médiathèque.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner className="size-6" />
          </div>
        ) : assets.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucun fichier de ce type dans la médiathèque.
          </p>
        ) : (
          <ul className="grid max-h-[55vh] grid-cols-3 gap-3 overflow-y-auto nice-scrollbar sm:grid-cols-4">
            {assets.map((asset) => (
              <li key={asset.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(asset)
                    onOpenChange(false)
                  }}
                  className="group block w-full border outline-none transition-colors hover:border-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <span className="block aspect-square w-full overflow-hidden bg-muted/40">
                    {asset.kind === "IMAGE" ? (
                       
                      <img
                        src={asset.url}
                        alt={asset.originalName}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-muted-foreground">
                        <FileImage className="size-8" aria-hidden="true" />
                      </span>
                    )}
                  </span>
                  <span className="block truncate border-t px-2 py-1.5 text-[11px] text-muted-foreground group-hover:text-foreground">
                    {asset.originalName}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------- éditeur ---------------------------------- */

export function CockpitEditor({
  article,
  refreshKey,
  onDone,
  navigate,
}: {
  article: AdminArticleDto | null
  refreshKey: number
  onDone: () => void
  navigate: Navigate
}) {
  const { toast } = useToast()
  const [form, setForm] = React.useState<FormState>(() => toForm(article))
  const [slugTouched, setSlugTouched] = React.useState(Boolean(article))
  const [saving, setSaving] = React.useState(false)
  const [savedArticle, setSavedArticle] = React.useState<AdminArticleDto | null>(article)
  const [tab, setTab] = React.useState("write")
  const [pickerKind, setPickerKind] = React.useState<"IMAGE" | "VIDEO" | null>(null)
  const [pickerTarget, setPickerTarget] = React.useState<"cover" | "video" | "content">("cover")
  const [uploadingField, setUploadingField] = React.useState<"cover" | "video" | null>(null)

  const contentRef = React.useRef<HTMLTextAreaElement>(null)
  const coverInputRef = React.useRef<HTMLInputElement>(null)
  const videoInputRef = React.useRef<HTMLInputElement>(null)

  const categoriesState = useFetch<AdminCategoriesResponse>(
    `/api/admin/categories?_r=${refreshKey}`
  )
  const authorsState = useFetch<AdminAuthorsResponse>(
    `/api/admin/authors?_r=${refreshKey}`
  )
  const categories = categoriesState.data?.categories ?? []
  const authors = authorsState.data?.authors ?? []

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  /** Slug auto : uniquement tant que l'utilisateur ne l'a pas édité. */
  React.useEffect(() => {
    if (!slugTouched) set("slug", slugify(form.title))
     
  }, [form.title, slugTouched])

  const words = React.useMemo(
    () => form.content.trim().split(/\s+/).filter(Boolean).length,
    [form.content]
  )

  const errors = {
    title: form.title.trim().length >= 3 ? undefined : "3 caractères minimum",
    excerpt: form.excerpt.trim().length >= 10 ? undefined : "10 caractères minimum",
    content: form.content.trim().length >= 30 ? undefined : "Le contenu doit faire au moins 30 caractères",
    categoryId: form.categoryId ? undefined : "Choisissez une rubrique",
    authorId: form.authorId ? undefined : "Choisissez un auteur",
  }
  const valid = Object.values(errors).every((value) => !value)

  /* ------------------------------- insertion markdown ---------------------- */

  const applyTool = (tool: Tool) => {
    const textarea = contentRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = form.content
    let next: string
    let cursor: number

    if (tool.wrap) {
      const [before, after] = tool.wrap
      next = value.slice(0, start) + before + value.slice(start, end) + after + value.slice(end)
      cursor = end + before.length + after.length
    } else if (tool.prefix) {
      const lineStart = value.lastIndexOf("\n", Math.max(start - 1, 0)) + 1
      next = value.slice(0, lineStart) + tool.prefix + value.slice(lineStart)
      cursor = end + tool.prefix.length
    } else {
      return
    }
    set("content", next)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  const insertAtCursor = (snippet: string) => {
    const textarea = contentRef.current
    const position = textarea ? textarea.selectionStart : form.content.length
    const next = form.content.slice(0, position) + snippet + form.content.slice(position)
    set("content", next)
    setTab("write")
  }

  /* --------------------------------- uploads ------------------------------- */

  const uploadToField = async (file: File, target: "cover" | "video") => {
    setUploadingField(target)
    try {
      const formBody = new FormData()
      formBody.append("file", file)
      const data = await fetchJson<{ media: MediaAssetDto }>("/api/admin/media", {
        method: "POST",
        body: formBody,
      })
      if (target === "cover") set("coverImage", data.media.url)
      else set("videoUrl", data.media.url)
      toast({ title: "Fichier importé", description: data.media.originalName })
    } catch (err) {
      toast({
        title: "Import impossible",
        description: err instanceof Error ? err.message : "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setUploadingField(null)
    }
  }

  /* -------------------------------- enregistrement ------------------------- */

  const save = async (statusOverride?: ArticleStatus) => {
    if (!valid || saving) return
    const status = statusOverride ?? form.status
    setSaving(true)
    const payload: AdminArticleInput = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      excerpt: form.excerpt.trim(),
      content: form.content,
      categoryId: form.categoryId,
      authorId: form.authorId,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      readMinutes: Math.min(Math.max(Number.parseInt(form.readMinutes, 10) || 5, 1), 60),
      featured: form.featured,
      status,
      coverImage: form.coverImage.trim() || null,
      videoUrl: form.videoUrl.trim() || null,
    }
    try {
      if (savedArticle) {
        const data = await fetchJson<{ article: AdminArticleDto }>(
          `/api/admin/articles/${savedArticle.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        )
        setSavedArticle(data.article)
        set("status", data.article.status)
        toast({
          title:
            data.article.status === "PUBLISHED" ? "Article publié" : "Modifications enregistrées",
          description: `« ${data.article.title} »`,
        })
      } else {
        const data = await fetchJson<{ article: AdminArticleDto }>("/api/admin/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        setSavedArticle(data.article)
        setSlugTouched(true)
        set("status", data.article.status)
        toast({
          title: data.article.status === "PUBLISHED" ? "Article publié" : "Article enregistré",
          description: `« ${data.article.title} » est désormais dans votre liste.`,
        })
      }
    } catch (err) {
      toast({
        title: "Enregistrement impossible",
        description: err instanceof Error ? err.message : "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const previewOnSite = () => {
    const current = savedArticle
    if (!current) return
    const published = (current.status === "PUBLISHED" && form.status === "PUBLISHED") || form.status === "PUBLISHED"
    navigate({
      type: "article",
      slug: current.slug,
      preview: published ? undefined : true,
    })
  }

  /* --------------------------------- rendu --------------------------------- */

  const pickerOpen = pickerKind !== null
  const closePicker = (open: boolean) => {
    if (!open) setPickerKind(null)
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <p className="kicker text-brand-red">
            {savedArticle ? "Modifier l'article" : "Nouvel article"}
          </p>
          {savedArticle ? <StatusBadge status={form.status} /> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={onDone} className="min-h-10">
            Retour à la liste
          </Button>
          {savedArticle ? (
            <Button variant="outline" onClick={previewOnSite} className="min-h-10 gap-2">
              <Eye className="size-4" aria-hidden="true" />
              Aperçu sur le site
            </Button>
          ) : null}
          {form.status !== "PUBLISHED" ? (
            <Button onClick={() => void save("PUBLISHED")} disabled={!valid || saving} className="min-h-10 gap-2">
              <Send className="size-4" aria-hidden="true" />
              Publier
            </Button>
          ) : null}
          <Button onClick={() => void save()} disabled={!valid || saving} className="min-h-10">
            {saving ? <Spinner className="text-primary-foreground" /> : null}
            Enregistrer
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* ---------------------------- colonne principale ------------------- */}
        <div className="min-w-0 space-y-5">
          <div>
            <label htmlFor="cockpit-title" className="sr-only">
              Titre de l'article
            </label>
            <Input
              id="cockpit-title"
              value={form.title}
              onChange={(event) => set("title", event.target.value)}
              placeholder="Titre de l'article…"
              className="h-auto rounded-none border-0 border-b-2 px-0 py-3 font-serif text-2xl font-bold tracking-tight shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 md:text-3xl"
            />
            {errors.title ? (
              <p className="mt-1.5 text-xs font-medium text-brand-red">{errors.title}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-2 border-b pb-3">
            <span className="shrink-0 font-mono text-xs text-muted-foreground">/article/</span>
            <Input
              value={form.slug}
              onChange={(event) => {
                setSlugTouched(true)
                set("slug", slugify(event.target.value))
              }}
              placeholder="adresse-de-l-article"
              className="h-8 rounded-none border-0 px-0 font-mono text-xs shadow-none focus-visible:ring-0"
              aria-label="Adresse de l'article (slug)"
            />
          </div>

          <Field label="Extrait" error={errors.excerpt}>
            <Textarea
              value={form.excerpt}
              onChange={(event) => set("excerpt", event.target.value)}
              rows={2}
              placeholder="Le chapô qui apparaîtra sur la page d'accueil et dans les listes…"
              className="rounded-none"
            />
            <p className="text-right text-[11px] tabular-nums text-muted-foreground">
              {form.excerpt.length}/400
            </p>
          </Field>

          <div>
            <Tabs value={tab} onValueChange={setTab}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <TabsList className="h-9 rounded-none bg-muted/60 p-0">
                  <TabsTrigger value="write" className="h-9 rounded-none px-4 text-xs">
                    Écrire
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="h-9 rounded-none px-4 text-xs">
                    Aperçu
                  </TabsTrigger>
                </TabsList>
                <p className="text-[11px] tabular-nums text-muted-foreground">
                  {words} mot{words > 1 ? "s" : ""}
                </p>
              </div>

              <TabsContent value="write" className="mt-0">
                <div className="mb-2 flex flex-wrap items-center gap-1 border p-1">
                  {TOOLS.map((tool) => (
                    <button
                      key={tool.label}
                      type="button"
                      title={tool.label}
                      aria-label={tool.label}
                      onClick={() => applyTool(tool)}
                      className="inline-flex size-8 items-center justify-center text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <tool.icon className="size-4" aria-hidden="true" />
                    </button>
                  ))}
                  <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
                  <button
                    type="button"
                    onClick={() => {
                      setPickerTarget("content")
                      setPickerKind("IMAGE")
                    }}
                    title="Insérer une image de la médiathèque"
                    className="inline-flex h-8 items-center gap-1.5 px-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <FileImage className="size-4" aria-hidden="true" />
                    Médiathèque
                  </button>
                </div>
                <Textarea
                  ref={contentRef}
                  value={form.content}
                  onChange={(event) => set("content", event.target.value)}
                  placeholder={"Rédigez ici en markdown.\n\n## Un titre\n\nDu texte en **gras**, un [lien](https://…), une citation :\n> Verbum sap…"}
                  className="min-h-[440px] rounded-none font-mono text-[13px] leading-relaxed"
                />
                {errors.content ? (
                  <p className="mt-1.5 text-xs font-medium text-brand-red">{errors.content}</p>
                ) : null}
              </TabsContent>

              <TabsContent value="preview" className="mt-0">
                <article className="min-h-[440px] border bg-muted/10 p-5 md:p-8">
                  {form.content.trim() ? (
                    <div className="article-body">
                      <ReactMarkdown>{form.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Rien à prévisualiser pour l'instant — commencez à écrire.
                    </p>
                  )}
                </article>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* ---------------------------- colonne latérale --------------------- */}
        <div className="space-y-4">
          <Card title="Rubrique & auteur">
            <div className="space-y-4">
              <Field label="Rubrique" error={errors.categoryId}>
                <Select
                  value={form.categoryId}
                  onValueChange={(value) => set("categoryId", value)}
                >
                  <SelectTrigger className="w-full rounded-none">
                    <SelectValue placeholder="Choisir une rubrique" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <span className="flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className="size-2"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Auteur" error={errors.authorId}>
                <Select
                  value={form.authorId}
                  onValueChange={(value) => set("authorId", value)}
                >
                  <SelectTrigger className="w-full rounded-none">
                    <SelectValue placeholder="Choisir un auteur" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {authors.map((author) => (
                      <SelectItem key={author.id} value={author.id}>
                        {author.name} — {author.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Card>

          <Card title="Image de couverture">
            {form.coverImage ? (
              <div className="relative mb-3">
                { }
                <img
                  src={form.coverImage}
                  alt="Aperçu de l'image de couverture"
                  className="aspect-video w-full border object-cover"
                />
                <button
                  type="button"
                  onClick={() => set("coverImage", "")}
                  aria-label="Retirer l'image de couverture"
                  className="absolute right-2 top-2 flex size-8 items-center justify-center border bg-background/90 text-foreground transition-colors hover:bg-brand-red hover:text-white"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            ) : null}
            <div className="space-y-2">
              <Input
                value={form.coverImage}
                onChange={(event) => set("coverImage", event.target.value)}
                placeholder="https://… ou /uploads/…"
                className="h-9 rounded-none font-mono text-xs"
                aria-label="URL de l'image de couverture"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 flex-1 gap-1.5 rounded-none"
                  disabled={uploadingField === "cover"}
                  onClick={() => coverInputRef.current?.click()}
                >
                  {uploadingField === "cover" ? <Spinner /> : <Upload className="size-3.5" aria-hidden="true" />}
                  Importer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 flex-1 gap-1.5 rounded-none"
                  onClick={() => {
                    setPickerTarget("cover")
                    setPickerKind("IMAGE")
                  }}
                >
                  <FileImage className="size-3.5" aria-hidden="true" />
                  Médiathèque
                </Button>
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void uploadToField(file, "cover")
                  event.target.value = ""
                }}
              />
            </div>
          </Card>

          <Card title="Reportage vidéo">
            {form.videoUrl ? (
              <div className="relative mb-3">
                <video
                  src={form.videoUrl}
                  controls
                  preload="metadata"
                  className="aspect-video w-full border bg-black"
                />
                <button
                  type="button"
                  onClick={() => set("videoUrl", "")}
                  aria-label="Retirer la vidéo"
                  className="absolute right-2 top-2 flex size-8 items-center justify-center border bg-background/90 text-foreground transition-colors hover:bg-brand-red hover:text-white"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            ) : null}
            <div className="space-y-2">
              <Input
                value={form.videoUrl}
                onChange={(event) => set("videoUrl", event.target.value)}
                placeholder="https://… ou /uploads/…"
                className="h-9 rounded-none font-mono text-xs"
                aria-label="URL de la vidéo"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 flex-1 gap-1.5 rounded-none"
                  disabled={uploadingField === "video"}
                  onClick={() => videoInputRef.current?.click()}
                >
                  {uploadingField === "video" ? <Spinner /> : <Upload className="size-3.5" aria-hidden="true" />}
                  Importer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 flex-1 gap-1.5 rounded-none"
                  onClick={() => {
                    setPickerTarget("video")
                    setPickerKind("VIDEO")
                  }}
                >
                  <FileImage className="size-3.5" aria-hidden="true" />
                  Médiathèque
                </Button>
              </div>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void uploadToField(file, "video")
                  event.target.value = ""
                }}
              />
              <p className="text-xs text-muted-foreground">
                Fichier de la médiathèque ou URL externe (MP4). Il s'affichera sous l'image de
                couverture.
              </p>
            </div>
          </Card>

          <Card title="Publication">
            <div className="space-y-4">
              <Field label="Statut">
                <Select
                  value={form.status}
                  onValueChange={(value) => set("status", value as ArticleStatus)}
                >
                  <SelectTrigger className="w-full rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="DRAFT">Brouillon — invisible sur le site</SelectItem>
                    <SelectItem value="PUBLISHED">Publié — visible sur le site</SelectItem>
                    <SelectItem value="HIDDEN">Masqué — retiré du site</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm">
                  À la une
                  <span className="block text-xs text-muted-foreground">
                    Mise en avant sur la page d'accueil
                  </span>
                </span>
                <Switch checked={form.featured} onCheckedChange={(checked) => set("featured", checked)} />
              </label>
              <Field label="Tags" hint="Séparés par des virgules">
                <Input
                  value={form.tags}
                  onChange={(event) => set("tags", event.target.value)}
                  placeholder="sciences, espace, exploration"
                  className="h-9 rounded-none"
                />
              </Field>
              <Field label="Temps de lecture" hint="En minutes (1 à 60)">
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={form.readMinutes}
                  onChange={(event) => set("readMinutes", event.target.value)}
                  className="h-9 w-24 rounded-none"
                />
              </Field>
            </div>
          </Card>
        </div>
      </div>

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={closePicker}
        kind={pickerKind ?? "IMAGE"}
        onPick={(asset) => {
          if (pickerTarget === "cover") set("coverImage", asset.url)
          else if (pickerTarget === "video") set("videoUrl", asset.url)
          else insertAtCursor(`\n![${asset.originalName}](${asset.url})\n`)
        }}
      />
    </div>
  )
}
