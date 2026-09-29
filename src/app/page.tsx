"use client"

import * as React from "react"

import { AnimatePresence, motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { useFetch } from "@/components/reference/lib"
import { AboutView } from "@/components/reference/AboutView"
import { AdSlot } from "@/components/reference/AdSlot"
import { ArticleView } from "@/components/reference/ArticleView"
import { CategoryView } from "@/components/reference/CategoryView"
import { CockpitView } from "@/components/reference/CockpitView"
import { ContactView } from "@/components/reference/ContactView"
import { DashboardView } from "@/components/reference/DashboardView"
import { Footer } from "@/components/reference/Footer"
import { Header } from "@/components/reference/Header"
import { HomeView } from "@/components/reference/HomeView"
import { SearchDialog } from "@/components/reference/SearchDialog"
import { SearchView } from "@/components/reference/SearchView"
import { viewKey } from "@/components/reference/types"
import type { CategoriesResponse, View } from "@/components/reference/types"

export default function Home() {
  const [view, setView] = React.useState<View>({ type: "home" })
  const [searchOpen, setSearchOpen] = React.useState(false)
  /** Masque les rails fixes lorsque le pied de page entre dans le viewport. */
  const [railsHidden, setRailsHidden] = React.useState(false)

  // Catégories chargées une seule fois et partagées par toutes les vues.
  const categoriesState = useFetch<CategoriesResponse>("/api/categories")
  const categories = categoriesState.data?.categories ?? []

  const navigate = React.useCallback((next: View) => {
    setView(next)
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
  }, [])

  // ⌘K / Ctrl+K ouvre la recherche plein texte.
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const retryCategories = React.useCallback(
    () => categoriesState.retry(),
    [categoriesState]
  )

  // Rails publicitaires : disparaissent élégamment quand le footer apparaît.
  React.useEffect(() => {
    const footer = document.querySelector("footer")
    if (!footer || !("IntersectionObserver" in window)) return
    const observer = new IntersectionObserver(
      ([entry]) => setRailsHidden(entry.isIntersecting),
      { threshold: 0.08 }
    )
    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  // Cockpit rédaction : écran plein dédié (chrome du site absent).
  if (view.type === "cockpit") {
    return <CockpitView navigate={navigate} initialSection={view.section} />
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Bannière publicitaire en tête de site. */}
      <AdSlot slot="top" navigate={navigate} className="border-b border-border" />

      <Header
        view={view}
        navigate={navigate}
        categories={categories}
        categoriesLoading={categoriesState.loading}
        categoriesError={categoriesState.error}
        onRetryCategories={retryCategories}
        onOpenSearch={() => setSearchOpen(true)}
      />

      <main id="contenu-principal" className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={viewKey(view)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {view.type === "home" ? (
              <HomeView
                navigate={navigate}
                categories={categories}
                categoriesLoading={categoriesState.loading}
                categoriesError={categoriesState.error}
                onRetryCategories={retryCategories}
              />
            ) : view.type === "category" ? (
              <CategoryView
                slug={view.slug}
                navigate={navigate}
                categories={categories}
                categoriesLoading={categoriesState.loading}
                categoriesError={categoriesState.error}
                onRetryCategories={retryCategories}
              />
            ) : view.type === "article" ? (
              <ArticleView slug={view.slug} navigate={navigate} preview={view.preview} />
            ) : view.type === "search" ? (
              <SearchView q={view.q} navigate={navigate} categories={categories} />
            ) : view.type === "about" ? (
              <AboutView navigate={navigate} categories={categories} />
            ) : view.type === "dashboard" ? (
              <DashboardView navigate={navigate} />
            ) : (
              <ContactView initialSubject={view.subject} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Pavé publicitaire au-dessus du pied de page. */}
      <AdSlot slot="bottom" navigate={navigate} className="border-t border-border" />

      <Footer
        navigate={navigate}
        categories={categories}
        onOpenSearch={() => setSearchOpen(true)}
      />

      {/* Rails publicitaires latéraux fixes — très grands écrans uniquement.
          Ils s'estompent quand le pied de page entre dans le viewport. */}
      <aside
        aria-label="Espace publicitaire latéral"
        className={cn(
          "fixed left-2 top-1/2 z-30 hidden w-[150px] -translate-y-1/2 transition-opacity duration-300 2xl:block",
          railsHidden && "pointer-events-none opacity-0"
        )}
      >
        <AdSlot slot="rail-left" navigate={navigate} bare />
      </aside>
      <aside
        aria-label="Espace publicitaire latéral"
        className={cn(
          "fixed right-2 top-1/2 z-30 hidden w-[150px] -translate-y-1/2 transition-opacity duration-300 2xl:block",
          railsHidden && "pointer-events-none opacity-0"
        )}
      >
        <AdSlot slot="rail-right" navigate={navigate} bare />
      </aside>

      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        navigate={navigate}
        categories={categories}
      />
    </div>
  )
}
