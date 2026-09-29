"use client"

/**
 * Cockpit rédactionnel REFERENCE.COM — écran plein de gestion du site.
 * Sidebar sombre + sections : tableau de bord, articles, éditeur, médiathèque,
 * rubriques & auteurs, campagnes pub, messages, paramètres.
 */

import * as React from "react"

import {
  ArrowLeft,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Newspaper,
  RefreshCw,
  Settings2,
  SquarePen,
  Tags,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Logo } from "@/components/reference/Logo"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type {
  CockpitSection,
  Navigate,
} from "@/components/reference/types"
import { CockpitDashboard } from "./cockpit/CockpitDashboard"
import { CockpitArticles } from "./cockpit/CockpitArticles"
import { CockpitEditor } from "./cockpit/CockpitEditor"
import { CockpitLogin } from "./cockpit/CockpitLogin"
import { CockpitMedia } from "./cockpit/CockpitMedia"
import { CockpitCategories } from "./cockpit/CockpitCategories"
import { CockpitCampaigns } from "./cockpit/CockpitCampaigns"
import { CockpitMessages } from "./cockpit/CockpitMessages"
import { CockpitSettings } from "./cockpit/CockpitSettings"
import { useCockpitData } from "./cockpit/cockpit-lib"
import { fetchJson } from "@/components/reference/lib"
import type { CockpitOverviewResponse } from "@/components/reference/types"

const NAV_ITEMS: Array<{
  section: CockpitSection
  label: string
  icon: LucideIcon
}> = [
  { section: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { section: "articles", label: "Articles", icon: Newspaper },
  { section: "media", label: "Médiathèque", icon: Images },
  { section: "categories", label: "Rubriques & auteurs", icon: Tags },
  { section: "campaigns", label: "Campagnes pub", icon: Megaphone },
  { section: "messages", label: "Messages", icon: Inbox },
  { section: "settings", label: "Paramètres", icon: Settings2 },
]

const SECTION_META: Record<CockpitSection, string> = {
  dashboard: "Pilotage du site",
  articles: "Rédaction",
  editor: "Rédaction",
  media: "Médiathèque",
  categories: "Organisation",
  campaigns: "Régie publicitaire",
  messages: "Courrier des lecteurs",
  settings: "Administration",
}

export function CockpitView({
  navigate,
  initialSection,
}: {
  navigate: Navigate
  initialSection?: CockpitSection
}) {
  const [section, setSection] = React.useState<CockpitSection>(initialSection ?? "dashboard")
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [navOpen, setNavOpen] = React.useState(false)
  /** Session administrateur : « checking » le temps de la sonde /api/admin/session. */
  const [authState, setAuthState] = React.useState<"checking" | "authed" | "anon">("checking")
  const [editingArticle, setEditingArticle] = React.useState<
    import("@/components/reference/types").AdminArticleDto | null
  >(null)

  // Sonde de session : sans session valide, ni données ni écran de gestion
  // ne sont chargés — le portail de connexion s'affiche.
  React.useEffect(() => {
    let active = true
    fetchJson<{ authenticated: boolean }>("/api/admin/session")
      .then((data) => {
        if (active) setAuthState(data.authenticated ? "authed" : "anon")
      })
      .catch(() => {
        if (active) setAuthState("anon")
      })
    return () => {
      active = false
    }
  }, [])

  const logout = React.useCallback(async () => {
    try {
      await fetchJson("/api/admin/logout", { method: "POST" })
    } catch {
      // la session expirera d'elle-même — on repasse au portail dans tous les cas
    }
    setAuthState("anon")
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
  }, [])

  /** Badge de messages non lus (rechargé quand le contenu mute). */
  const { data: overviewData } = useCockpitData<CockpitOverviewResponse>(
    authState === "authed" ? "/api/admin/overview" : null,
    refreshKey
  )
  const unread = overviewData?.overview.messages.unread ?? 0

  const bumpRefresh = React.useCallback(() => setRefreshKey((key) => key + 1), [])

  const goSection = React.useCallback((next: CockpitSection) => {
    if (next !== "editor") setEditingArticle(null)
    setSection(next)
    setNavOpen(false)
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
  }, [])

  const backToSite = React.useCallback(() => navigate({ type: "home" }), [navigate])

  // Échap → retour au site public.
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !navOpen) backToSite()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [backToSite, navOpen])

  const navList = (
    <nav aria-label="Navigation du cockpit" className="flex flex-col">
      {NAV_ITEMS.map((item) => {
        const active = section === item.section
        return (
          <button
            key={item.section}
            type="button"
            onClick={() => goSection(item.section)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-11 items-center gap-3 px-4 text-left text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-white/40",
              active
                ? "bg-white/10 font-bold text-white"
                : "font-medium text-zinc-400 hover:bg-white/5 hover:text-white"
            )}
          >
            {active ? (
              <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-brand-red" />
            ) : null}
            <item.icon
              className={cn("size-4 shrink-0", active ? "text-brand-red" : "text-zinc-500")}
              aria-hidden="true"
            />
            <span className="flex-1">{item.label}</span>
            {item.section === "messages" && unread > 0 ? (
              <span className="flex min-w-5 items-center justify-center bg-brand-red px-1 text-[11px] font-bold tabular-nums text-white">
                {unread}
              </span>
            ) : null}
          </button>
        )
      })}
    </nav>
  )

  const brand = (
    <div className="border-b border-white/10 px-4 py-5">
      <p className="kicker text-brand-red">Espace rédaction</p>
      <div className="mt-2">
        <Logo className="h-7" />
      </div>
      <p className="mt-2 text-xs text-zinc-500">Cockpit de gestion — tout le site est modifiable.</p>
    </div>
  )

  // Sonde de session en cours : écran d'attente neutre, sans données.
  if (authState === "checking") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950">
        <Logo className="h-8" />
        <p className="text-sm font-medium text-zinc-400" role="status">
          Vérification de la session…
        </p>
      </div>
    )
  }

  // Session absente ou expirée : portail de connexion.
  if (authState === "anon") {
    return <CockpitLogin navigate={navigate} onSuccess={() => setAuthState("authed")} />
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* ------------------------------ sidebar ------------------------------ */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-zinc-950 lg:flex">
        {brand}
        <div className="flex-1 overflow-y-auto nice-scrollbar py-3">{navList}</div>
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={backToSite}
            className="flex min-h-10 w-full items-center gap-2.5 border border-zinc-700 px-3 text-sm font-medium text-zinc-300 outline-none transition-colors hover:border-white hover:bg-white hover:text-zinc-950 focus-visible:ring-[3px] focus-visible:ring-white/40"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voir le site
          </button>
          <button
            type="button"
            onClick={logout}
            className="mt-2 flex min-h-10 w-full items-center gap-2.5 px-3 text-sm font-medium text-zinc-500 outline-none transition-colors hover:text-brand-red focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-white/40"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Se déconnecter
          </button>
          <p className="mt-3 px-1 text-[11px] text-zinc-600">
            Rédaction REFERENCE.COM · © 2025
          </p>
        </div>
      </aside>

      {/* --------------------------- zone principale ------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/85">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <Button
              variant="outline"
              size="icon"
              className="size-9 rounded-none lg:hidden"
              aria-label="Ouvrir la navigation du cockpit"
              onClick={() => setNavOpen(true)}
            >
              <Menu className="size-4" aria-hidden="true" />
            </Button>
            <div className="min-w-0 flex-1">
              <p className="kicker truncate text-muted-foreground">
                {SECTION_META[section] ?? "Cockpit"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 rounded-none"
              onClick={bumpRefresh}
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 rounded-none lg:hidden"
              onClick={backToSite}
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Site
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            {section === "dashboard" ? (
              <CockpitDashboard
                refreshKey={refreshKey}
                onGoSection={(target) => goSection(target)}
              />
            ) : section === "articles" ? (
              <CockpitArticles
                refreshKey={refreshKey}
                onEdit={(article) => {
                  setEditingArticle(article)
                  setSection("editor")
                  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
                }}
                onNew={() => goSection("editor")}
                onView={(article) => navigate({ type: "article", slug: article.slug })}
                onMutated={bumpRefresh}
              />
            ) : section === "editor" ? (
              <CockpitEditor
                key={editingArticle?.id ?? "new"}
                article={editingArticle}
                refreshKey={refreshKey}
                onDone={() => goSection("articles")}
                navigate={navigate}
              />
            ) : section === "media" ? (
              <CockpitMedia refreshKey={refreshKey} onMutated={bumpRefresh} />
            ) : section === "categories" ? (
              <CockpitCategories refreshKey={refreshKey} onMutated={bumpRefresh} />
            ) : section === "campaigns" ? (
              <CockpitCampaigns refreshKey={refreshKey} onMutated={bumpRefresh} />
            ) : section === "messages" ? (
              <CockpitMessages refreshKey={refreshKey} onMutated={bumpRefresh} />
            ) : (
              <CockpitSettings refreshKey={refreshKey} onMutated={bumpRefresh} />
            )}
          </div>
        </main>
      </div>

      {/* ------------------------ navigation mobile -------------------------- */}
      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="w-72 overflow-y-auto bg-zinc-950 p-0 nice-scrollbar sm:w-80 [&>button]:text-white">
          <SheetHeader className="space-y-0 p-0 text-left">
            <SheetTitle asChild>
              <div className="block">{brand}</div>
            </SheetTitle>
            <SheetDescription className="sr-only">
              Navigation du cockpit rédactionnel
            </SheetDescription>
          </SheetHeader>
          <div className="py-3">{navList}</div>
          <div className="border-t border-white/10 p-3">
            <button
              type="button"
              onClick={() => {
                setNavOpen(false)
                backToSite()
              }}
              className="flex min-h-10 w-full items-center gap-2.5 border border-zinc-700 px-3 text-sm font-medium text-zinc-300 transition-colors hover:border-white hover:bg-white hover:text-zinc-950"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Voir le site
            </button>
            <button
              type="button"
              onClick={() => {
                setNavOpen(false)
                logout()
              }}
              className="mt-2 flex min-h-10 w-full items-center gap-2.5 px-3 text-sm font-medium text-zinc-500 transition-colors hover:text-brand-red"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Se déconnecter
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Lien clavier : retour au site */}
      <span className="sr-only" role="note">
        Appuyez sur Échap pour revenir au site public. Bouton Nouveau : SquarePen.
      </span>
    </div>
  )
}
