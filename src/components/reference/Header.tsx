"use client"

import * as React from "react"

import { format } from "date-fns"
import { ar, enUS, es, fr, it, zhCN } from "date-fns/locale"
import type { Locale } from "date-fns/locale"
import { useTheme } from "next-themes"
import {
  ChevronRight,
  LayoutDashboard,
  Mail,
  Menu,
  Moon,
  RotateCw,
  Search,
  SquarePen,
  Sun,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { Lang } from "@/lib/i18n"
import { useFetch } from "@/components/reference/lib"
import { useI18n, useI18nFetch } from "@/components/reference/lang-context"
import { Logo } from "@/components/reference/Logo"
import { BreakingTicker } from "@/components/reference/BreakingTicker"
import { LanguageSwitcher } from "@/components/reference/LanguageSwitcher"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { Category, Navigate, SiteSettingsResponse, View } from "@/components/reference/types"

/** Locales date-fns par langue du site. */
const DATE_LOCALES: Record<Lang, Locale> = { fr, en: enUS, es, it, ar, zh: zhCN }

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const { t } = useI18n()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const isDark = mounted ? resolvedTheme === "dark" : false

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-11 text-muted-foreground hover:text-foreground", className)}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? t("header.themeLight") : t("header.themeDark")}
    >
      {mounted ? (
        isDark ? (
          <Sun className="size-[18px]" aria-hidden="true" />
        ) : (
          <Moon className="size-[18px]" aria-hidden="true" />
        )
      ) : (
        <Moon className="size-[18px] opacity-0" aria-hidden="true" />
      )}
    </Button>
  )
}

/* -------------------------------------------------------------------------- */
/*      Étage 0 — barre d'édition marine : date, tagline, liens rapides       */
/* -------------------------------------------------------------------------- */

function UtilityBar({ navigate }: { navigate: Navigate }) {
  const [dateLabel, setDateLabel] = React.useState("")
  const { t, lang } = useI18n()

  // Accroche de marque pilotée depuis le cockpit (GET /api/settings).
  const { data: settingsData } = useFetch<SiteSettingsResponse>("/api/settings")
  const tagline = settingsData?.settings?.tagline?.trim() || t("header.taglineFallback")

  React.useEffect(() => {
    const label = format(new Date(), "EEEE d MMMM yyyy", {
      locale: DATE_LOCALES[lang] ?? fr,
    })
    setDateLabel(lang === "fr" ? label.charAt(0).toUpperCase() + label.slice(1) : label)
  }, [lang])

  const quickLinkClass =
    "kicker link-underline shrink-0 text-zinc-300 outline-none transition-colors hover:text-white focus-visible:ring-[3px] focus-visible:ring-white/30"

  return (
    <div className="band-navy-deep hidden text-zinc-300 md:block">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <p className="kicker truncate text-zinc-300" aria-hidden={dateLabel === ""}>
          {dateLabel ? t("header.edition", { date: dateLabel.toLowerCase() }) : "\u00A0"}
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <p className="kicker hidden text-zinc-400 lg:block">{tagline}</p>
          <span aria-hidden="true" className="hidden h-3 w-px bg-white/20 lg:block" />
          <button
            type="button"
            onClick={() => navigate({ type: "about" })}
            className={quickLinkClass}
          >
            {t("header.about")}
          </button>
          <span aria-hidden="true" className="h-3 w-px bg-white/20" />
          <button
            type="button"
            onClick={() => navigate({ type: "contact" })}
            className={quickLinkClass}
          >
            {t("header.contact")}
          </button>
          <span aria-hidden="true" className="hidden h-3 w-px bg-white/20 lg:block" />
          <LanguageSwitcher className="hidden h-9 !text-zinc-300 hover:!text-white lg:inline-flex" />
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*            Étage 1 — manchette blanche : logo, recherche, burger            */
/* -------------------------------------------------------------------------- */

function Masthead({
  navigate,
  onOpenSearch,
  onOpenMobile,
  mobileOpen,
}: {
  navigate: Navigate
  onOpenSearch: () => void
  onOpenMobile: (open: boolean) => void
  mobileOpen: boolean
}) {
  const { t } = useI18n()
  return (
    <div className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 md:h-20">
        <button
          type="button"
          onClick={() => navigate({ type: "home" })}
          aria-label={t("header.homeAria")}
          className="shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Logo className="h-9 md:h-11" />
        </button>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Recherche : bloc rouge de marque (signature charte). */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="inline-flex h-11 items-center justify-center gap-2 bg-brand-red px-3 text-white transition-colors hover:bg-[#c8101f] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:px-4"
            aria-label={t("header.searchAria")}
          >
            <Search className="size-4 shrink-0" aria-hidden="true" />
            <span className="hidden text-sm font-bold uppercase tracking-[0.08em] sm:inline">
              {t("common.search")}
            </span>
            <kbd className="pointer-events-none hidden select-none border border-white/40 bg-white/10 px-1.5 font-mono text-[10px] font-semibold text-white lg:inline-flex">
              ⌘K
            </kbd>
          </button>
          <LanguageSwitcher className="lg:hidden" />
          <ThemeToggle />

          {/* Burger — mobile et tablette uniquement */}
          <Sheet open={mobileOpen} onOpenChange={onOpenMobile}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-11 lg:hidden"
                aria-label={t("header.openMenu")}
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
          </Sheet>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*   Étage 2 — navigation principale (lg+) : Accueil + rubriques + services    */
/* -------------------------------------------------------------------------- */

function DesktopNav({
  view,
  navigate,
  categories,
  categoriesLoading,
  categoriesError,
  onRetryCategories,
}: {
  view: View
  navigate: Navigate
  categories: Category[]
  categoriesLoading: boolean
  categoriesError: string | null
  onRetryCategories: () => void
}) {
  const { t } = useI18n()
  return (
    <nav
      aria-label={t("header.navigation")}
      className="sticky top-0 z-50 hidden border-y bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/85 lg:block"
    >
      <div className="nice-scrollbar mx-auto flex max-w-7xl items-stretch justify-between overflow-x-auto px-4 sm:px-6">
        <NavItem
          label={t("header.home")}
          active={view.type === "home"}
          onClick={() => navigate({ type: "home" })}
        />

        <div className="flex items-stretch">
          {categoriesLoading && categories.length === 0
            ? Array.from({ length: 8 }).map((_, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className="mx-2.5 my-4 h-3 w-14 animate-pulse self-center bg-muted"
                />
              ))
            : categories.map((category) => {
                const active = view.type === "category" && view.slug === category.slug
                return (
                  <NavItem
                    key={category.slug}
                    label={category.name}
                    active={active}
                    dotColor={category.color}
                    onClick={() => navigate({ type: "category", slug: category.slug })}
                  />
                )
              })}
          {!categoriesLoading && categoriesError && categories.length === 0 ? (
            <button
              type="button"
              onClick={onRetryCategories}
              className="mx-2.5 inline-flex items-center gap-1.5 font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-brand-red outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <RotateCw className="size-3" aria-hidden="true" />
              {t("common.retry")}
            </button>
          ) : null}
        </div>

        <div className="flex items-stretch">
          <span aria-hidden="true" className="my-2.5 w-px bg-border" />
          <NavItem
            label={t("header.about")}
            active={view.type === "about"}
            onClick={() => navigate({ type: "about" })}
          />
          <NavItem
            label={t("header.contact")}
            active={view.type === "contact"}
            onClick={() => navigate({ type: "contact" })}
          />
        </div>
      </div>
    </nav>
  )
}

/** Élément de navigation (bureau) : libellé, pastille de rubrique, icône. */
function NavItem({
  label,
  active,
  dotColor,
  icon: Icon,
  onClick,
  tone = "default",
}: {
  label: string
  active: boolean
  dotColor?: string
  icon?: LucideIcon
  onClick: () => void
  /** « cockpit » : traitement discret rédaction — survol rouge au lieu de bleu. */
  tone?: "default" | "cockpit"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 py-3.5 font-display text-[10.5px] font-bold uppercase tracking-[0.12em] outline-none transition-colors",
        active
          ? "text-foreground after:absolute after:inset-x-2.5 after:bottom-0 after:h-[2px] after:bg-brand-red after:content-['']"
          : cn(
              "link-underline text-muted-foreground",
              tone === "cockpit" ? "hover:text-brand-red" : "hover:text-brand-blue"
            ),
        "focus-visible:ring-[3px] focus-visible:ring-ring/50"
      )}
    >
      {Icon ? (
        <Icon
          className={cn("size-3.5 shrink-0", active ? "text-brand-red" : "text-muted-foreground/70")}
          aria-hidden="true"
        />
      ) : null}
      {dotColor ? (
        <span
          aria-hidden="true"
          className="hidden size-1 shrink-0 xl:block"
          style={{ backgroundColor: dotColor }}
        />
      ) : null}
      {label}
    </button>
  )
}


/* -------------------------------------------------------------------------- */
/*        Menu mobile (burger) : panneau marine profond structuré en blocs     */
/* -------------------------------------------------------------------------- */

function MobileMenu({
  view,
  navigate,
  categories,
  open,
  onOpenChange,
}: {
  view: View
  navigate: Navigate
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const go = (v: View) => {
    onOpenChange(false)
    navigate(v)
  }

  const { t } = useI18n()

  const rowClass = (active: boolean) =>
    cn(
      "flex w-full items-center gap-3 border-b border-white/10 px-4 py-3.5 text-left text-sm outline-none transition-colors hover:bg-white/5 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-white/30",
      active ? "border-l-2 border-l-brand-red font-bold text-white" : "font-medium text-zinc-300"
    )

  const staticLinks: Array<{ label: string; view: View; active: boolean; icon?: LucideIcon }> = [
    { label: t("header.home"), view: { type: "home" }, active: view.type === "home" },
    { label: t("common.search"), view: { type: "search", q: "" }, active: view.type === "search" },
    { label: t("header.about"), view: { type: "about" }, active: view.type === "about" },
    { label: t("header.contact"), view: { type: "contact" }, active: view.type === "contact" },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="band-navy-deep w-full overflow-y-auto border-white/10 p-0 text-white nice-scrollbar sm:max-w-sm"
      >
        <SheetHeader className="space-y-0 border-b border-white/10 p-0 text-left">
          <div className="flex h-16 items-center px-4 sm:px-5">
            <SheetTitle asChild>
              <button
                type="button"
                onClick={() => go({ type: "home" })}
                className="outline-none focus-visible:ring-[3px] focus-visible:ring-white/30"
                aria-label={t("header.homeAria")}
              >
                <Logo className="h-8" />
                <span className="sr-only">REFERENCE.COM</span>
              </button>
            </SheetTitle>
          </div>
          <SheetDescription className="kicker px-4 pb-4 text-zinc-400 sm:px-5">
            {t("header.taglineFallback")}
          </SheetDescription>
        </SheetHeader>

        <nav aria-label={t("header.navigation")} className="pb-8">
          {/* Bloc principal */}
          <p className="kicker px-4 pb-2 pt-5 text-zinc-500 sm:px-5">{t("header.navigation")}</p>
          <div className="border-y border-white/10">
            {staticLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => go(link.view)}
                aria-current={link.active ? "page" : undefined}
                className={rowClass(link.active)}
              >
                {link.icon ? (
                  <link.icon
                    className={cn(
                      "size-4 shrink-0",
                      link.active ? "text-brand-red" : "text-zinc-500"
                    )}
                    aria-hidden="true"
                  />
                ) : null}
                <span className="flex-1">{link.label}</span>
                <ChevronRight className="size-4 text-zinc-500" aria-hidden="true" />
              </button>
            ))}
          </div>

          {/* Bloc rubriques */}
          <p className="kicker px-4 pb-2 pt-6 text-zinc-500 sm:px-5">{t("header.categories")}</p>
          <div className="border-y border-white/10">
            {categories.map((category) => {
              const active = view.type === "category" && view.slug === category.slug
              return (
                <button
                  key={category.slug}
                  type="button"
                  onClick={() => go({ type: "category", slug: category.slug })}
                  aria-current={active ? "page" : undefined}
                  className={rowClass(active)}
                >
                  <span
                    aria-hidden="true"
                    className="size-2 shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="flex-1">{category.name}</span>
                  <span className="text-xs tabular-nums text-zinc-500">
                    {category.articleCount}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Bloc contact direct */}
          <div className="px-4 pt-6 sm:px-5">
            <a
              href="mailto:redaction@reference.com"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-white px-4 text-sm font-bold uppercase tracking-[0.13em] text-[#0a1e3c] transition-colors hover:bg-brand-red hover:text-white focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/40"
            >
              <Mail className="size-4" aria-hidden="true" />
              {t("header.writeToRedaction")}
            </a>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Header                                   */
/* -------------------------------------------------------------------------- */

interface HeaderProps {
  view: View
  navigate: Navigate
  categories: Category[]
  categoriesLoading: boolean
  categoriesError: string | null
  onRetryCategories: () => void
  onOpenSearch: () => void
}

export function Header({
  view,
  navigate,
  categories,
  categoriesLoading,
  categoriesError,
  onRetryCategories,
  onOpenSearch,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const go = (v: View) => {
    setMobileOpen(false)
    navigate(v)
  }

  return (
    <>
      {/* Étage 0 — barre d'édition marine (desktop) */}
      <UtilityBar navigate={navigate} />

      {/* Étage 1 — manchette blanche */}
      <Masthead
        navigate={navigate}
        onOpenSearch={onOpenSearch}
        onOpenMobile={setMobileOpen}
        mobileOpen={mobileOpen}
      />

      {/* Étage 2 — navigation principale (bureau) */}
      <DesktopNav
        view={view}
        navigate={go}
        categories={categories}
        categoriesLoading={categoriesLoading}
        categoriesError={categoriesError}
        onRetryCategories={onRetryCategories}
      />

      {/* Étage 3 — bandeau « En direct » */}
      <BreakingTicker navigate={navigate} />

      {/* Menu burger (mobile / tablette) */}
      <MobileMenu
        view={view}
        navigate={go}
        categories={categories}
        open={mobileOpen}
        onOpenChange={setMobileOpen}
      />
    </>
  )
}
