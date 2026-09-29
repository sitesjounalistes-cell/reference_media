"use client"

/** Cockpit — Tableau de bord : compteurs temps réel, raccourcis, derniers messages. */

import * as React from "react"

import {
  ArrowRight,
  FileText,
  Images,
  Inbox,
  Megaphone,
  Newspaper,
  Settings2,
  SquarePen,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { formatViews } from "@/components/reference/lib"
import type { CockpitOverviewResponse, Navigate } from "@/components/reference/types"
import {
  EmptyState,
  ErrorPanel,
  KpiCard,
  SectionHeader,
  formatDateShort,
  useCockpitData,
} from "./cockpit-lib"

const SUBJECT_LABEL: Record<string, string> = {
  redaction: "Rédaction",
  correction: "Correction",
  partenariat: "Partenariat",
  publicite: "Publicité",
  droits: "Droits",
  autre: "Autre",
}

export function CockpitDashboard({
  refreshKey,
  onGoSection,
}: {
  refreshKey: number
  onGoSection: (section: "articles" | "editor" | "media" | "campaigns" | "settings" | "messages") => void
}) {
  const { data, error, loading, retry } = useCockpitData<CockpitOverviewResponse>(
    "/api/admin/overview",
    refreshKey
  )

  const shortcuts: Array<{
    label: string
    hint: string
    icon: typeof SquarePen
    go: () => void
  }> = [
    { label: "Écrire un article", hint: "Rédiger, illustrer et publier", icon: SquarePen, go: () => onGoSection("editor") },
    { label: "Importer un média", hint: "Images, reportages vidéo, sons, PDF", icon: Images, go: () => onGoSection("media") },
    { label: "Gérer les campagnes", hint: "Régie publicitaire du site", icon: Megaphone, go: () => onGoSection("campaigns") },
    { label: "Paramètres du site", hint: "Contacts, réseaux sociaux, textes", icon: Settings2, go: () => onGoSection("settings") },
  ]

  return (
    <div>
      <SectionHeader
        kicker="Pilotage"
        title="Bonjour, rédaction"
        description="Voici l'état du site à l'instant. Tout ce qui est affiché ici est gérable depuis le cockpit."
      />

      {error ? (
        <ErrorPanel message={error} onRetry={retry} />
      ) : loading && !data ? (
        <div className="grid grid-cols-2 gap-px border bg-border md:grid-cols-4" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-background p-5">
              <span className="block h-3 w-20 animate-pulse bg-muted" />
              <span className="mt-3 block h-8 w-16 animate-pulse bg-muted" />
            </div>
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-px border bg-border md:grid-cols-4">
            <KpiCard
              label="Articles publiés"
              value={String(data.overview.articles.published)}
              hint={`${data.overview.articles.draft} brouillon(s) · ${data.overview.articles.hidden} masqué(s)`}
            />
            <KpiCard label="Lectures cumulées" value={formatViews(data.overview.totalViews)} />
            <KpiCard
              label="Messages non lus"
              value={String(data.overview.messages.unread)}
              hint={`${data.overview.messages.total} reçu(s) au total`}
              tone={data.overview.messages.unread > 0 ? "red" : "default"}
            />
            <KpiCard label="Abonnés newsletter" value={String(data.overview.subscribers)} />
            <KpiCard
              label="Médiathèque"
              value={String(data.overview.media.count)}
              hint="fichiers images, vidéos et documents"
            />
            <KpiCard
              label="Campagnes pub"
              value={`${data.overview.campaigns.active}/${data.overview.campaigns.total}`}
              hint="campagnes actives / au total"
            />
            <KpiCard label="Rubriques" value={String(data.overview.categories)} />
            <KpiCard label="Auteurs" value={String(data.overview.authors)} />
          </div>

          <div className="mt-6">
            <p className="kicker mb-3 text-muted-foreground">Raccourcis</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {shortcuts.map((shortcut) => (
                <button
                  key={shortcut.label}
                  type="button"
                  onClick={shortcut.go}
                  className="group flex items-center gap-3 border bg-background p-4 text-left transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center border bg-muted/40">
                    <shortcut.icon className="size-5 text-foreground" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-sm font-bold">{shortcut.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{shortcut.hint}</span>
                  </span>
                  <ArrowRight
                    className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-brand-red"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 border">
            <header className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
              <p className="kicker text-muted-foreground">Derniers messages</p>
              <button
                type="button"
                onClick={() => onGoSection("messages")}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground outline-none transition-colors hover:text-foreground"
              >
                Tout voir
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </button>
            </header>
            {data.recentMessages.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={Inbox}
                  title="Aucun message pour l'instant"
                  hint="Les messages envoyés depuis la page Contact arrivent ici."
                />
              </div>
            ) : (
              <ul className="divide-y">
                {data.recentMessages.map((message) => (
                  <li key={message.id}>
                    <button
                      type="button"
                      onClick={() => onGoSection("messages")}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/50 sm:px-5"
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "size-2 shrink-0 rounded-none",
                          message.read ? "bg-border" : "bg-brand-red"
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {message.name} — {SUBJECT_LABEL[message.subject] ?? message.subject}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {message.message}
                        </span>
                      </span>
                      <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                        {formatDateShort(message.createdAt)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
