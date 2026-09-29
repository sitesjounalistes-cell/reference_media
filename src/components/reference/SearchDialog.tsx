"use client"

import * as React from "react"

import {
  ArrowRight,
  Home,
  Info,
  Loader2,
  Mail,
  Search,
  SearchX,
} from "lucide-react"

import { fetchJson } from "@/components/reference/lib"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ArticleListItem, ArticlesResponse, Category, Navigate } from "@/components/reference/types"

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  navigate: Navigate
  categories?: Category[]
}

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
    {children}
  </kbd>
)

/**
 * Recherche plein texte (cmdk) : requête serveur débouncée (300 ms),
 * navigation clavier, Entrée pour ouvrir l’article.
 * Habillage éditorial : en-tête « Recherche » + filet bicolore de marque,
 * titres en serif (.headline), catégories en pastilles colorées.
 * La logique (fetch, filtres, navigation) est inchangée.
 */
export function SearchDialog({ open, onOpenChange, navigate, categories = [] }: SearchDialogProps) {
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<ArticleListItem[]>([])
  const [searching, setSearching] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [nonce, setNonce] = React.useState(0)

  const trimmed = query.trim()

  React.useEffect(() => {
    if (!open) return
    if (trimmed.length < 2) {
      setResults([])
      setSearching(false)
      setError(null)
      return
    }
    const controller = new AbortController()
    setSearching(true)
    setError(null)
    const timer = setTimeout(() => {
      fetchJson<ArticlesResponse>(
        `/api/articles?q=${encodeURIComponent(trimmed)}&pageSize=8`,
        { signal: controller.signal }
      )
        .then((res) => {
          setResults(res.articles ?? [])
          setSearching(false)
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name === "AbortError") return
          setError(err instanceof Error ? err.message : "Erreur de recherche")
          setSearching(false)
        })
    }, 300)
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [trimmed, open, nonce])

  const reset = () => {
    setQuery("")
    setResults([])
    setError(null)
    setSearching(false)
  }

  const openArticle = (slug: string) => {
    onOpenChange(false)
    navigate({ type: "article", slug })
  }

  const go = (view: Parameters<Navigate>[0]) => {
    onOpenChange(false)
    reset()
    navigate(view)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="overflow-hidden p-0 sm:max-w-xl" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>Rechercher sur REFERENCE.COM</DialogTitle>
          <DialogDescription>
            Tapez au moins deux caractères pour chercher un article.
          </DialogDescription>
        </DialogHeader>
        <Command
          shouldFilter={false}
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.16em] [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4"
        >
          {/* En-tête éditorial : kicker « Recherche » + filet bicolore de marque */}
          <div className="border-b">
            <div className="flex items-center justify-between px-4 pt-4">
              <span className="kicker text-foreground">Recherche</span>
              <Kbd>⌘K</Kbd>
            </div>
            <div aria-hidden="true" className="rule-brand ml-4 mt-2.5 h-[3px] w-12" />
            <div className="relative mt-1">
              <Search
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <label htmlFor="search-dialog-input" className="sr-only">
                Rechercher un article
              </label>
              <input
                id="search-dialog-input"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un article, un dossier…"
                autoComplete="off"
                className="flex h-12 w-full bg-transparent py-3 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <CommandList className="nice-scrollbar max-h-[24rem]">
            {trimmed.length < 2 ? (
              <>
                <CommandGroup heading="Navigation">
                  <CommandItem onSelect={() => go({ type: "home" })}>
                    <Home aria-hidden="true" />
                    Accueil
                  </CommandItem>
                  <CommandItem onSelect={() => go({ type: "about" })}>
                    <Info aria-hidden="true" />
                    À propos de REFERENCE.COM
                  </CommandItem>
                  <CommandItem onSelect={() => go({ type: "contact" })}>
                    <Mail aria-hidden="true" />
                    Contacter la rédaction
                  </CommandItem>
                </CommandGroup>
                {categories.length > 0 ? (
                  <>
                    <CommandSeparator />
                    <CommandGroup heading="Catégories">
                      {categories.map((category) => (
                        <CommandItem
                          key={category.slug}
                          value={`catégorie ${category.name}`}
                          onSelect={() => go({ type: "category", slug: category.slug })}
                        >
                          <span
                            aria-hidden="true"
                            className="size-2 shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                          <span className="ml-auto text-xs text-muted-foreground">
                            {category.articleCount} articles
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                ) : null}
              </>
            ) : searching ? (
              <div className="flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Recherche en cours…
              </div>
            ) : error ? (
              <div className="px-4 py-8 text-center text-sm">
                <p className="text-muted-foreground">{error}</p>
                <button
                  type="button"
                  onClick={() => setNonce((n) => n + 1)}
                  className="mt-2 font-medium text-brand-blue underline-offset-4 hover:underline"
                >
                  Réessayer
                </button>
              </div>
            ) : results.length === 0 ? (
              <CommandEmpty className="flex flex-col items-center gap-2 py-8 text-center">
                <SearchX className="size-8 text-muted-foreground/60" aria-hidden="true" />
                <span>
                  Aucun résultat pour «&nbsp;{trimmed}&nbsp;».
                </span>
                <span className="text-xs text-muted-foreground">
                  Essayez un autre mot-clé ou explorez les catégories.
                </span>
              </CommandEmpty>
            ) : (
              <CommandGroup heading={`${results.length} résultat${results.length > 1 ? "s" : ""}`}>
                {results.map((article) => (
                  <CommandItem
                    key={article.id}
                    value={article.id}
                    onSelect={() => openArticle(article.slug)}
                    className="items-start gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          aria-hidden="true"
                          className="size-1.5 shrink-0"
                          style={{ backgroundColor: article.category.color }}
                        />
                        <span
                          className="kicker"
                          style={{ color: article.category.color }}
                        >
                          {article.category.name}
                        </span>
                      </span>
                      <p className="headline mt-1 truncate text-sm font-bold text-foreground">
                        {article.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {article.excerpt}
                      </p>
                    </div>
                    <ArrowRight
                      className="mt-1 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-2.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> naviguer
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Kbd>Entrée ↵</Kbd> ouvrir
            </span>
            <span className="ml-auto inline-flex items-center gap-1.5">
              <Kbd>Échap</Kbd> fermer
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
