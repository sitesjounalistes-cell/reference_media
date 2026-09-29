"use client"

/** Cockpit — Rubriques & auteurs : création, édition, suppression sécurisée. */

import * as React from "react"

import { Plus, SquarePen, Tags, Trash2, Users } from "lucide-react"

import { fetchJson, useFetch } from "@/components/reference/lib"
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
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type {
  AdminAuthorDto,
  AdminAuthorsResponse,
  AdminCategoryDto,
  AdminCategoriesResponse,
} from "@/components/reference/types"
import { Card, EmptyState, ErrorPanel, LoadingRows, SectionHeader } from "./cockpit-lib"

/* -------------------------------- rubriques ------------------------------- */

function CategoryDialog({
  category,
  open,
  onOpenChange,
  onSaved,
}: {
  category: AdminCategoryDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [color, setColor] = React.useState("#1B5FD9")
  const [icon, setIcon] = React.useState("Lightbulb")
  const [order, setOrder] = React.useState("0")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setName(category?.name ?? "")
      setSlug(category?.slug ?? "")
      setDescription(category?.description ?? "")
      setColor(category?.color ?? "#1B5FD9")
      setIcon(category?.icon ?? "Lightbulb")
      setOrder(String(category?.order ?? 0))
    }
  }, [open, category])

  const save = async () => {
    setSaving(true)
    try {
      const body = JSON.stringify({
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim(),
        color,
        icon: icon.trim() || "Lightbulb",
        order: Number.parseInt(order, 10) || 0,
      })
      if (category) {
        await fetchJson(`/api/admin/categories/${category.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body,
        })
      } else {
        await fetchJson("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        })
      }
      toast({
        title: category ? "Rubrique modifiée" : "Rubrique créée",
        description: name.trim(),
      })
      onOpenChange(false)
      onSaved()
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

  const valid = name.trim().length >= 2 && description.trim().length >= 10

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-none">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {category ? "Modifier la rubrique" : "Nouvelle rubrique"}
          </DialogTitle>
          <DialogDescription>
            La rubrique apparaît dans la navigation du site et regroupe les articles.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Nom</Label>
            <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-none" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-slug">Adresse (slug)</Label>
            <Input
              id="cat-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto si vide"
              className="rounded-none font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="rounded-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cat-color">Couleur</Label>
              <div className="flex gap-1.5">
                <input
                  id="cat-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-9 cursor-pointer border p-0.5"
                  aria-label="Couleur de la rubrique"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 rounded-none font-mono text-xs"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-icon">Icône lucide</Label>
              <Input id="cat-icon" value={icon} onChange={(e) => setIcon(e.target.value)} className="h-9 rounded-none font-mono text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-order">Ordre</Label>
              <Input id="cat-order" type="number" value={order} onChange={(e) => setOrder(e.target.value)} className="h-9 rounded-none" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-none" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button className="rounded-none" disabled={!valid || saving} onClick={() => void save()}>
            {category ? "Enregistrer" : "Créer la rubrique"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* --------------------------------- auteurs -------------------------------- */

function AuthorDialog({
  author,
  open,
  onOpenChange,
  onSaved,
}: {
  author: AdminAuthorDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [name, setName] = React.useState("")
  const [role, setRole] = React.useState("")
  const [bio, setBio] = React.useState("")
  const [color, setColor] = React.useState("#1B5FD9")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setName(author?.name ?? "")
      setRole(author?.role ?? "")
      setBio(author?.bio ?? "")
      setColor(author?.color ?? "#1B5FD9")
    }
  }, [open, author])

  const save = async () => {
    setSaving(true)
    try {
      const body = JSON.stringify({ name: name.trim(), role: role.trim(), bio: bio.trim(), color })
      if (author) {
        await fetchJson(`/api/admin/authors/${author.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body,
        })
      } else {
        await fetchJson("/api/admin/authors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        })
      }
      toast({ title: author ? "Auteur modifié" : "Auteur créé", description: name.trim() })
      onOpenChange(false)
      onSaved()
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

  const valid = name.trim().length >= 2 && role.trim().length >= 2 && bio.trim().length >= 10

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-none">
        <DialogHeader>
          <DialogTitle className="font-serif">{author ? "Modifier l'auteur" : "Nouvel auteur"}</DialogTitle>
          <DialogDescription>
            Les initiales de l'avatar sont calculées automatiquement à partir du nom.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="author-name">Nom complet</Label>
            <Input id="author-name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-none" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="author-role">Rôle</Label>
            <Input
              id="author-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Rédactrice en chef, grand reporter…"
              className="rounded-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="author-bio">Biographie</Label>
            <Textarea id="author-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="rounded-none" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="author-color">Couleur d'avatar</Label>
            <div className="flex gap-1.5">
              <input
                id="author-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-9 cursor-pointer border p-0.5"
                aria-label="Couleur d'avatar"
              />
              <Input value={color} onChange={(e) => setColor(e.target.value)} className="h-9 rounded-none font-mono text-xs" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-none" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button className="rounded-none" disabled={!valid || saving} onClick={() => void save()}>
            {author ? "Enregistrer" : "Créer l'auteur"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------ section complète --------------------------- */

export function CockpitCategories({ refreshKey, onMutated }: { refreshKey: number; onMutated: () => void }) {
  const { toast } = useToast()
  const categoriesState = useFetch<AdminCategoriesResponse>(`/api/admin/categories?_r=${refreshKey}`)
  const authorsState = useFetch<AdminAuthorsResponse>(`/api/admin/authors?_r=${refreshKey}`)

  const [catDialog, setCatDialog] = React.useState<{ open: boolean; category: AdminCategoryDto | null }>({
    open: false,
    category: null,
  })
  const [authorDialog, setAuthorDialog] = React.useState<{ open: boolean; author: AdminAuthorDto | null }>({
    open: false,
    author: null,
  })
  const [toDelete, setToDelete] = React.useState<
    { kind: "category" | "author"; id: string; name: string } | null
  >(null)

  const confirmDelete = async () => {
    if (!toDelete) return
    const path = toDelete.kind === "category" ? "categories" : "authors"
    try {
      const res = await fetch(`/api/admin/${path}/${toDelete.id}`, { method: "DELETE" })
      if (!res.ok && res.status !== 204) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? "Suppression impossible")
      }
      toast({ title: toDelete.kind === "category" ? "Rubrique supprimée" : "Auteur supprimé", description: toDelete.name })
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

  const categories = categoriesState.data?.categories ?? []
  const authors = authorsState.data?.authors ?? []

  return (
    <div>
      <SectionHeader
        kicker="Organisation"
        title="Rubriques & auteurs"
        description="La structure du site : les rubriques de la navigation et l'équipe de rédaction qui signe les articles."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ------------------------------ rubriques ------------------------- */}
        <Card title={`Rubriques (${categories.length})`} className="self-start">
          {categoriesState.error ? (
            <ErrorPanel message={categoriesState.error} onRetry={categoriesState.retry} />
          ) : categoriesState.loading ? (
            <LoadingRows rows={4} />
          ) : (
            <>
              <ul className="divide-y">
                {categories.map((category) => (
                  <li key={category.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span
                      aria-hidden="true"
                      className="size-4 shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{category.name}</span>
                      <span className="block truncate font-mono text-[11px] text-muted-foreground">
                        /rubrique/{category.slug}
                      </span>
                    </span>
                    <span className="shrink-0 border px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">
                      {category.articleCount} art.
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      aria-label={`Modifier ${category.name}`}
                      onClick={() => setCatDialog({ open: true, category })}
                    >
                      <SquarePen className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 hover:text-brand-red"
                      aria-label={`Supprimer ${category.name}`}
                      onClick={() => setToDelete({ kind: "category", id: category.id, name: category.name })}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
              {categories.length === 0 ? (
                <div className="mb-3">
                  <EmptyState icon={Tags} title="Aucune rubrique" hint="Créez la première rubrique du site." />
                </div>
              ) : null}
              <Button
                variant="outline"
                className="mt-3 w-full gap-2 rounded-none"
                onClick={() => setCatDialog({ open: true, category: null })}
              >
                <Plus className="size-4" aria-hidden="true" />
                Nouvelle rubrique
              </Button>
            </>
          )}
        </Card>

        {/* -------------------------------- auteurs -------------------------- */}
        <Card title={`Auteurs (${authors.length})`} className="self-start">
          {authorsState.error ? (
            <ErrorPanel message={authorsState.error} onRetry={authorsState.retry} />
          ) : authorsState.loading ? (
            <LoadingRows rows={4} />
          ) : (
            <>
              <ul className="divide-y">
                {authors.map((author) => (
                  <li key={author.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span
                      aria-hidden="true"
                      className="flex size-9 shrink-0 items-center justify-center font-serif text-xs font-bold text-white"
                      style={{ backgroundColor: author.color }}
                    >
                      {author.initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{author.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{author.role}</span>
                    </span>
                    <span className="shrink-0 border px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">
                      {author.articleCount} art.
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      aria-label={`Modifier ${author.name}`}
                      onClick={() => setAuthorDialog({ open: true, author })}
                    >
                      <SquarePen className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 hover:text-brand-red"
                      aria-label={`Supprimer ${author.name}`}
                      onClick={() => setToDelete({ kind: "author", id: author.id, name: author.name })}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
              {authors.length === 0 ? (
                <div className="mb-3">
                  <EmptyState icon={Users} title="Aucun auteur" hint="Ajoutez le premier membre de la rédaction." />
                </div>
              ) : null}
              <Button
                variant="outline"
                className="mt-3 w-full gap-2 rounded-none"
                onClick={() => setAuthorDialog({ open: true, author: null })}
              >
                <Plus className="size-4" aria-hidden="true" />
                Nouvel auteur
              </Button>
            </>
          )}
        </Card>
      </div>

      <CategoryDialog
        open={catDialog.open}
        category={catDialog.category}
        onOpenChange={(open) => setCatDialog({ open, category: catDialog.category })}
        onSaved={onMutated}
      />
      <AuthorDialog
        open={authorDialog.open}
        author={authorDialog.author}
        onOpenChange={(open) => setAuthorDialog({ open, author: authorDialog.author })}
        onSaved={onMutated}
      />

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete
                ? `« ${toDelete.name} » sera définitivement retiré. Si des articles y sont encore rattachés, l'opération sera refusée.`
                : ""}
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
