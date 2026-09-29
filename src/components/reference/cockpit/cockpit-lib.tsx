"use client"

/**
 * Cockpit rédaction — briques partagées : en-têtes de section, états vides,
 * erreurs, badges de statut, champs de formulaire et récupération de données.
 */

import * as React from "react"

import type { LucideIcon } from "lucide-react"
import { Loader2, RotateCw, TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"
import { useFetch } from "@/components/reference/lib"
import type { ArticleStatus } from "@/components/reference/types"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

/* --------------------------------- formats -------------------------------- */

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 Ko"
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1).replace(".", ",")} Mo`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${bytes} o`
}

/** ISO → « 12 janv. 2025 » (forme compacte des listes du cockpit). */
export function formatDateShort(iso: string): string {
  try {
    return format(new Date(iso), "d MMM yyyy", { locale: fr })
  } catch {
    return ""
  }
}

/* -------------------------------- statuts --------------------------------- */

export const STATUS_META: Record<
  ArticleStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  DRAFT: {
    label: "Brouillon",
    badgeClass: "border-border text-muted-foreground",
    dotClass: "bg-muted-foreground/40",
  },
  PUBLISHED: {
    label: "Publié",
    badgeClass: "border-emerald-600/60 text-emerald-700 dark:text-emerald-400",
    dotClass: "bg-emerald-600",
  },
  HIDDEN: {
    label: "Masqué",
    badgeClass: "border-brand-red text-brand-red",
    dotClass: "bg-brand-red",
  },
}

export function StatusBadge({ status }: { status: ArticleStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.DRAFT
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]",
        meta.badgeClass
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5", meta.dotClass)} />
      {meta.label}
    </span>
  )
}

/* ----------------------------- blocs de section ---------------------------- */

export function SectionHeader({
  kicker,
  title,
  description,
  children,
}: {
  kicker: string
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="kicker text-brand-red">{kicker}</p>
        <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </div>
  )
}

export function Card({
  title,
  description,
  children,
  className,
}: {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("border bg-background", className)}>
      {title ? (
        <header className="border-b px-4 py-3 sm:px-5">
          <h2 className="kicker text-muted-foreground">{title}</h2>
          {description ? (
            <p className="mt-1 text-[13px] text-muted-foreground/80">{description}</p>
          ) : null}
        </header>
      ) : null}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: LucideIcon
  title: string
  hint?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 border border-dashed px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center border bg-muted/40">
        <Icon className="size-6 text-muted-foreground" aria-hidden="true" />
      </span>
      <p className="font-serif text-lg font-bold">{title}</p>
      {hint ? <p className="max-w-md text-sm text-muted-foreground">{hint}</p> : null}
      {children ? <div className="mt-2">{children}</div> : null}
    </div>
  )
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 border border-brand-red/40 bg-brand-red/5 px-6 py-10 text-center">
      <TriangleAlert className="size-6 text-brand-red" aria-hidden="true" />
      <p className="text-sm font-medium">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-10 items-center gap-2 border border-foreground px-4 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:bg-foreground hover:text-background"
        >
          <RotateCw className="size-3.5" aria-hidden="true" />
          Réessayer
        </button>
      ) : null}
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin text-muted-foreground", className)} aria-hidden="true" />
}

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-1 py-4">
          <span className="h-4 w-40 animate-pulse bg-muted" />
          <span className="ml-auto h-4 w-16 animate-pulse bg-muted" />
          <span className="h-4 w-20 animate-pulse bg-muted" />
        </div>
      ))}
    </div>
  )
}

/* -------------------------------- KPI -------------------------------------- */

export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string
  value: string
  hint?: string
  tone?: "default" | "red"
}) {
  return (
    <div className="bg-background p-4 sm:p-5">
      <p className="kicker text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 font-serif text-2xl font-bold tabular-nums tracking-tight md:text-3xl",
          tone === "red" && "text-brand-red"
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

/* ------------------------------ champs de forme ---------------------------- */

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <span className="kicker block text-muted-foreground">{label}</span>
      {children}
      {error ? (
        <p className="text-xs font-medium text-brand-red">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground/80">{hint}</p>
      ) : null}
    </div>
  )
}

/* --------------------------- chargement de données ------------------------- */

/** useFetch paramétré par une clé de rafraîchissement globale du cockpit. */
export function useCockpitData<T>(url: string | null, refreshKey: number) {
  const keyedUrl = url ? `${url}${url.includes("?") ? "&" : "?"}_r=${refreshKey}` : null
  return useFetch<T>(keyedUrl)
}
