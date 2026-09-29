"use client"

/** Cockpit — Gestion des articles : recherche, filtres, statuts, édition, suppression. */

import * as React from "react"

import {
  Eye,
  EyeOff,
  MoreHorizontal,
  Newspaper,
  Plus,
  Search,
  Send,
  SquarePen,
  Trash2,
  Undo2,
} from "lucide-react"

import { fetchJson } from "@/components/reference/lib"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  AdminArticleDto,
  AdminArticlesResponse,
  ArticleStatus,
} from "@/components/reference/types"
import {
  EmptyState,
  ErrorPanel,
  LoadingRows,
  SectionHeader,
  StatusBadge,
  formatDateShort,
} from "./cockpit-lib"

type StatusFilter = "all" | ArticleStatus

export function CockpitArticles({
  refreshKey,
  onEdit,
  onNew,
  onMutated,
  onView,
}: {
  refreshKey: number
  onEdit: (article: AdminArticleDto) => void
  onNew: () => void
  onMutated: () => void
  onView: (article: AdminArticleDto) => void
}) {
  const { toast } = useToast()
  const [articles, setArticles] = React.useState<AdminArticleDto[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [query, setQuery] = React.useState("")
  const [status, setStatus] = React.useState<StatusFilter>("all")
  const [toDelete, setToDelete] = React.useState<AdminArticleDto | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchJson<AdminArticlesResponse>(
        `/api/admin/articles?_r=${refreshKey}`
      )
      setArticles(data.articles)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les articles")
    } finally {
      setLoading(false)
    }
  }, [refreshKey])

  React.useEffect(() => {
    void load()
  }, [load])

  const patchStatus = async (article: AdminArticleDto, next: ArticleStatus, label: string) => {
    try {
      const updated = await fetchJson<{ article: AdminArticleDto }>(
        `/api/admin/articles/${article.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        }
      )
      setArticles((rows) =>
        rows?.map((row) => (row.id === updated.article.id ? updated.article : row)) ?? rows
      )
      toast({ title: label, description: `« ${article.title} »` })
      onMutated()
    } catch (err) {
      toast({
        title: "Action impossible",
        description: err instanceof Error ? err.message : "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/articles/${toDelete.id}`, { method: "DELETE" })
      if (!res.ok && res.status !== 204) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? "Suppression impossible")
      }
      setArticles((rows) => rows?.filter((row) => row.id !== toDelete.id) ?? rows)
      toast({ title: "Article supprimé", description: `« ${toDelete.title} »` })
      onMutated()
    } catch (err) {
      toast({
        title: "Suppression impossible",
        description: err instanceof Error ? err.message : "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setToDelete(null)
    }
  }

  const filtered = React.useMemo(() => {
    let rows = articles ?? []
    if (status !== "all") rows = rows.filter((row) => row.status === status)
    const q = query.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (row) =>
          row.title.toLowerCase().includes(q) ||
          row.excerpt.toLowerCase().includes(q) ||
          row.tags.join(",").toLowerCase().includes(q)
      )
    }
    return rows
  }, [articles, status, query])

  const counts = React.useMemo(() => {
    const rows = articles ?? []
    return {
      all: rows.length,
      DRAFT: rows.filter((r) => r.status === "DRAFT").length,
      PUBLISHED: rows.filter((r) => r.status === "PUBLISHED").length,
      HIDDEN: rows.filter((r) => r.status === "HIDDEN").length,
    }
  }, [articles])

  return (
    <div>
      <SectionHeader
        kicker="Rédaction"
        title="Articles"
        description="Rédigez, publiez, masquez ou supprimez les articles du site. Les modifications sont visibles immédiatement."
      >
        <Button onClick={onNew} className="min-h-10 gap-2">
          <Plus className="size-4" aria-hidden="true" />
          Nouvel article
        </Button>
      </SectionHeader>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs
          value={status}
          onValueChange={(value) => setStatus(value as StatusFilter)}
          className="w-full md:w-auto"
        >
          <TabsList className="h-10 w-full justify-start rounded-none bg-muted/60 p-0 md:w-auto">
            {(
              [
                ["all", "Tous"],
                ["DRAFT", "Brouillons"],
                ["PUBLISHED", "Publiés"],
                ["HIDDEN", "Masqués"],
              ] as Array<[StatusFilter, string]>
            ).map(([value, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="h-10 flex-1 rounded-none px-3 text-xs data-[state=active]:rounded-none md:flex-none"
              >
                {label}
                <span className="ml-1.5 tabular-nums text-muted-foreground">
                  {counts[value]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <label className="relative w-full md:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="sr-only">Rechercher un article</span>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Titre, extrait, mot-clé…"
            className="h-10 rounded-none pl-9"
          />
        </label>
      </div>

      {error ? (
        <ErrorPanel message={error} onRetry={load} />
      ) : loading && !articles ? (
        <div className="border p-4">
          <LoadingRows rows={6} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title={articles && articles.length > 0 ? "Aucun article ne correspond" : "Aucun article pour l'instant"}
          hint={
            articles && articles.length > 0
              ? "Essayez un autre mot-clé ou un autre filtre de statut."
              : "Rédigez votre premier article : il apparaîtra aussitôt sur le site."
          }
        >
          <Button onClick={onNew} variant="outline" className="gap-2">
            <Plus className="size-4" aria-hidden="true" />
            Nouvel article
          </Button>
        </EmptyState>
      ) : (
        <div className="border">
          <div className="max-h-[68vh] overflow-y-auto nice-scrollbar">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-muted/70 backdrop-blur-sm">
                <tr className="text-left">
                  <th className="kicker px-4 py-3 font-bold text-muted-foreground">Titre</th>
                  <th className="kicker hidden px-3 py-3 font-bold text-muted-foreground lg:table-cell">Rubrique</th>
                  <th className="kicker hidden px-3 py-3 font-bold text-muted-foreground md:table-cell">Auteur</th>
                  <th className="kicker px-3 py-3 font-bold text-muted-foreground">Statut</th>
                  <th className="kicker hidden px-3 py-3 text-right font-bold text-muted-foreground sm:table-cell">Vues</th>
                  <th className="kicker hidden px-3 py-3 font-bold text-muted-foreground xl:table-cell">Modifié</th>
                  <th className="px-3 py-3" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((article) => (
                  <tr key={article.id} className="transition-colors hover:bg-muted/40">
                    <td className="max-w-[280px] px-4 py-3">
                      <p className="truncate font-serif font-semibold">{article.title}</p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">
                        /article/{article.slug}
                      </p>
                    </td>
                    <td className="hidden px-3 py-3 lg:table-cell">
                      <span className="text-xs">{article.categoryName}</span>
                    </td>
                    <td className="hidden px-3 py-3 text-xs text-muted-foreground md:table-cell">
                      {article.authorName}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={article.status} />
                    </td>
                    <td className="hidden px-3 py-3 text-right tabular-nums text-xs text-muted-foreground sm:table-cell">
                      {article.views.toLocaleString("fr-FR")}
                    </td>
                    <td className="hidden px-3 py-3 text-xs text-muted-foreground xl:table-cell">
                      {formatDateShort(article.updatedAt)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`Actions sur « ${article.title} »`}
                          >
                            <MoreHorizontal className="size-4" aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => onEdit(article)}>
                            <SquarePen className="size-4" aria-hidden="true" />
                            Modifier
                          </DropdownMenuItem>
                          {article.status !== "PUBLISHED" ? (
                            <DropdownMenuItem
                              onClick={() => patchStatus(article, "PUBLISHED", "Article publié")}
                            >
                              <Send className="size-4" aria-hidden="true" />
                              Publier
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => onView(article)}>
                              <Eye className="size-4" aria-hidden="true" />
                              Voir sur le site
                            </DropdownMenuItem>
                          )}
                          {article.status !== "HIDDEN" && article.status !== "DRAFT" ? (
                            <DropdownMenuItem
                              onClick={() => patchStatus(article, "HIDDEN", "Article masqué")}
                            >
                              <EyeOff className="size-4" aria-hidden="true" />
                              Masquer
                            </DropdownMenuItem>
                          ) : null}
                          {article.status !== "DRAFT" ? (
                            <DropdownMenuItem
                              onClick={() =>
                                patchStatus(article, "DRAFT", "Article renvoyé en brouillon")
                              }
                            >
                              <Undo2 className="size-4" aria-hidden="true" />
                              Renvoyer en brouillon
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setToDelete(article)}
                            className="text-brand-red focus:text-brand-red"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t px-4 py-2.5 text-xs text-muted-foreground">
            {filtered.length} article{filtered.length > 1 ? "s" : ""} affiché
            {filtered.length > 1 ? "s" : ""} sur {articles?.length ?? 0}
          </p>
        </div>
      )}

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">
              Supprimer définitivement cet article ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              « {toDelete?.title} » sera supprimé du site et de la base de données. Cette action
              est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none" disabled={deleting}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-none bg-brand-red text-white hover:bg-brand-red/85"
              disabled={deleting}
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
